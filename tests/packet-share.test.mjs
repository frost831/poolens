import assert from 'node:assert/strict';
import test from 'node:test';
import { composeProofPacket, shareProofPacket, smsPlatform, smsUrl } from '../js/packet-share.js';

const token = 'a'.repeat(32);
const passportUrl = `https://app.splashlens.com/api/proof-packets/${token}`;

test('English and Spanish packets fit the limit and retain the Passport link', () => {
  for (const language of ['en', 'es']) {
    const packet = composeProofPacket({ language, kind: 'code', code: 'E01', summary: 'Pump inspected. '.repeat(80), evidence: 'Label photographed. '.repeat(80), passportUrl });
    assert.ok(packet.length <= 480);
    assert.ok(packet.endsWith(`${language === 'es' ? 'Pasaporte' : 'Passport'}: ${passportUrl}`));
    assert.match(packet, language === 'es' ? /Respuesta de código de SplashLens\nCódigo: E01\nResultado:/ : /SplashLens code answer\nCode: E01\nResult:/);
    assert.match(packet, /…/);
    assert.doesNotMatch(packet, /undefined|null/);
  }
});

test('empty packet, fallback language, commerce exclusion, control stripping and surrogate-safe truncation', () => {
  assert.equal(composeProofPacket(), 'SplashLens proof');
  assert.equal(composeProofPacket({ language: 'fr' }), 'SplashLens proof');
  const packet = composeProofPacket({ language: 'es', summary: 'Buen\n resultado\u202e', evidence: '😀'.repeat(200) });
  assert.match(packet, /Resultado: Buen resultado/);
  assert.doesNotMatch(packet, /\u202e|\ud83d(?!\ude00)/);
  assert.ok(packet.length <= 480);
  assert.equal(composeProofPacket({ summary: 'Checkout for $19', evidence: 'Sin precio', code: 'E01' }), 'SplashLens proof\nE01');
  assert.equal(composeProofPacket({ summary: 'Pro 19/mo' }), 'SplashLens proof');
});

test('Passport URL must be an exact HTTPS proof route without credentials or extras', () => {
  for (const invalid of [
    `http://app.splashlens.com/api/proof-packets/${token}`,
    `https://evil.test/api/proof-packets/${token}`,
    `https://app.splashlens.com.evil.test/api/proof-packets/${token}`,
    `https://user:pass@app.splashlens.com/api/proof-packets/${token}`,
    `https://app.splashlens.com/api/proof-packets/${token}?phone=123`,
    `https://app.splashlens.com/api/proof-packets/${token}#extra`,
    `https://app.splashlens.com/api/proof-packets/short`,
    'javascript:alert(1)',
  ]) assert.doesNotMatch(composeProofPacket({ passportUrl: invalid }), /Passport:/);
});

test('SMS URLs encode special characters and use platform-specific separators', () => {
  const body = 'Proof & code #1 / ¿Listo?\n😀';
  for (const platform of ['ios', 'android']) {
    const url = smsUrl(body, platform);
    assert.ok(url.startsWith(platform === 'ios' ? 'sms:?&body=' : 'sms:?body='));
    assert.equal(decodeURIComponent(url.split('body=')[1]), body);
    assert.doesNotMatch(url, /\s|#|¿/);
  }
  assert.throws(() => smsUrl(body, 'desktop'), TypeError);
  assert.throws(() => smsUrl('x'.repeat(481), 'ios'), TypeError);
  assert.equal(smsPlatform({ userAgent: 'Mozilla iPhone' }), 'ios');
  assert.equal(smsPlatform({ platform: 'MacIntel', maxTouchPoints: 5 }), 'ios');
  assert.equal(smsPlatform({ userAgent: 'Mozilla Android' }), 'android');
  assert.equal(smsPlatform({ userAgent: 'Mozilla Windows' }), null);
});

test('successful SMS dispatch emits tapped then shared and touches no other channel', async () => {
  const events = []; const opens = [];
  const result = await shareProofPacket({ packet: 'SplashLens proof', surface: 'proof_stop', platform: 'ios',
    openSms(url) { opens.push(url); return true; },
    navigator: { share() { throw new Error('unexpected share'); } },
    onEvent: (name, props) => events.push([name, props]),
  });
  assert.deepEqual(result, { channel: 'sms' });
  assert.equal(opens.length, 1);
  assert.deepEqual(events, [
    ['packet_share_tapped', { channel: 'sms', surface: 'proof_stop' }],
    ['packet_shared', { channel: 'sms', surface: 'proof_stop' }],
  ]);
});

test('default SMS opener dispatches a temporary anchor and cleans it up', async () => {
  const events = []; const actions = [];
  const anchor = { hidden: false, click() { actions.push(['click', this.href]); }, remove() { actions.push(['remove']); } };
  const document = { createElement(tag) { assert.equal(tag, 'a'); return anchor; }, body: { append(node) { assert.equal(node, anchor); actions.push(['append']); } } };
  const result = await shareProofPacket({ packet: 'SplashLens proof', surface: 'proof_stop', platform: 'ios', document,
    onEvent: (name, props) => events.push([name, props.channel]),
  });
  assert.deepEqual(result, { channel: 'sms' });
  assert.equal(anchor.hidden, true);
  assert.deepEqual(actions, [['append'], ['click', 'sms:?&body=SplashLens%20proof'], ['remove']]);
  assert.deepEqual(events, [['packet_share_tapped', 'sms'], ['packet_shared', 'sms']]);
});

test('failed SMS then failed share falls back to clipboard; success events await resolution', async () => {
  const events = []; const calls = []; let finish;
  const pending = shareProofPacket({ packet: 'Prueba de SplashLens', surface: 'code_answer', platform: 'android',
    openSms() { calls.push('sms'); return false; },
    navigator: { async share() { calls.push('share'); throw new Error('Unavailable'); }, clipboard: { writeText(text) { calls.push(text); return new Promise(resolve => { finish = resolve; }); } } },
    onEvent: (name, props) => events.push([name, props.channel]),
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['sms', 'share', 'Prueba de SplashLens']);
  assert.deepEqual(events, [['packet_share_tapped', 'sms'], ['packet_share_tapped', 'share_sheet'], ['packet_share_tapped', 'clipboard']]);
  finish();
  assert.deepEqual(await pending, { channel: 'clipboard' });
  assert.deepEqual(events.at(-1), ['packet_shared', 'clipboard']);
});

test('share resolution succeeds; cancellation stops without copying or a shared event', async () => {
  for (const canceled of [false, true]) {
    const events = []; let copies = 0;
    const result = await shareProofPacket({ packet: 'SplashLens proof', surface: 'proof_stop', platform: null,
      navigator: { async share(payload) { assert.deepEqual(payload, { text: 'SplashLens proof' }); if (canceled) throw Object.assign(new Error('Canceled'), { name: 'AbortError' }); }, clipboard: { async writeText() { copies++; } } },
      onEvent: (name, props) => events.push([name, props.channel]),
    });
    assert.deepEqual(result, canceled ? { channel: null, canceled: true } : { channel: 'share_sheet' });
    assert.equal(copies, 0);
    assert.deepEqual(events, canceled ? [['packet_share_tapped', 'share_sheet']] : [['packet_share_tapped', 'share_sheet'], ['packet_shared', 'share_sheet']]);
  }
});

test('no available channel and failed clipboard never claim packet_shared', async () => {
  const events = [];
  const result = await shareProofPacket({ packet: 'SplashLens proof', surface: 'proof_stop', platform: 'android',
    openSms() { throw new Error('blocked'); }, navigator: { clipboard: { async writeText() { throw new Error('denied'); } } },
    onEvent: name => events.push(name),
  });
  assert.deepEqual(result, { channel: null });
  assert.deepEqual(events, ['packet_share_tapped', 'packet_share_tapped']);
});

test('invalid packets and surfaces cause no side effects', async () => {
  let calls = 0;
  const options = { platform: 'ios', openSms() { calls++; return true; }, onEvent() { calls++; } };
  await assert.rejects(shareProofPacket({ ...options, packet: 'Checkout $19', surface: 'proof_stop' }), TypeError);
  await assert.rejects(shareProofPacket({ ...options, packet: 'Pro 19/mo', surface: 'proof_stop' }), TypeError);
  await assert.rejects(shareProofPacket({ ...options, packet: 'Proof', surface: 'bad surface' }), TypeError);
  assert.equal(calls, 0);
});
