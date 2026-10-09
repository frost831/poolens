import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import * as packetShare from '../js/packet-share.js';

const app = readFileSync(join(import.meta.dirname, '..', 'js', 'app.js'), 'utf8');
const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');
const slice = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function sharingContext() {
  const shared = [];
  const events = [];
  const notices = [];
  const pools = [{ id: 'pool-1', servicePassports: [
    { proof: { complete: true, customerSummary: 'Pump inspected', photoProof: 'Label photographed' }, passportUrl: `https://app.splashlens.com/api/proof-packets/${'a'.repeat(32)}` },
    { proof: { complete: false, customerSummary: 'Unfinished' } },
  ] }];
  const context = vm.createContext({
    packetShare,
    navigator: { userAgent: 'Desktop', async share(payload) { shared.push(payload.text); } },
    document: {},
    getLanguageProfile: () => ({ preferredLanguage: 'es' }),
    trackSplashLensEvent: (name, props) => events.push([name, props]),
    showSplashLensNotice: (message) => notices.push(message),
    validateReportProof: () => ({ complete: true }),
    buildServicePassport: () => ({ proof: { customerSummary: 'Pump inspected', photoProof: 'Label photographed' } }),
    serviceProofSharePayload: () => ({ date: '2026-10-09', visitType: 'Service', readings: {}, proof: { complete: true, customerSummary: 'Pump inspected' } }),
    reportReadingSummary: () => '',
    findPoolById: (id) => pools.find((pool) => pool.id === id),
    servicePassportDetail: () => '<p>Saved proof detail</p>',
    escAttr: escape,
    escHtml: escape,
  });
  const integration = slice('let _lastSecureProofPacket = null;', 'async function submitProofPacketForTeamReview')
    .replace("await import('./packet-share.js')", 'await Promise.resolve(packetShare)');
  vm.runInContext(integration, context);
  vm.runInContext(slice('function codeCard(', 'function toggleCode('), context);
  vm.runInContext(slice('function renderServicePassportHistory(', 'function servicePassportDetail('), context);
  return { context, shared, events, notices, pools };
}

test('completed live stop texts selected-language packet and only matching Passport URL', async () => {
  const { context, shared, events } = sharingContext();
  const payload = context.serviceProofSharePayload();
  const url = `https://app.splashlens.com/api/proof-packets/${'b'.repeat(32)}`;
  context.linkState = { shareUrl: url, expiresAt: '2099-01-01T00:00:00Z', signature: context.proofPacketSignature(payload) };
  vm.runInContext('_lastSecureProofPacket = linkState', context);
  await context.textCurrentProofStop();
  assert.match(shared[0], /^Prueba de SplashLens\nResultado: Pump inspected\nEvidencia: Label photographed/);
  assert.match(shared[0], new RegExp(`Pasaporte: ${url}$`));
  assert.deepEqual(events.map(([name]) => name), ['packet_share_tapped', 'packet_shared']);
  assert.equal(events[1][1].surface, 'proof_stop');

  context.serviceProofSharePayload = () => ({ ...payload, proof: { complete: true, customerSummary: 'Changed stop' } });
  await context.textCurrentProofStop();
  assert.doesNotMatch(shared[1], /Pasaporte:/);
  context.validateReportProof = () => ({ complete: false });
  assert.equal(await context.textCurrentProofStop(), undefined);
  assert.equal(shared.length, 2);
});

test('saved history exposes Text it only for completed passports and shares that stop', async () => {
  const { context, shared, pools } = sharingContext();
  const history = context.renderServicePassportHistory(pools[0]);
  assert.equal((history.match(/>Text it<\/button>/g) || []).length, 1);
  assert.match(history, /data-passport-index="0"/);
  await context.textSavedProofStop({ dataset: { poolId: 'pool-1', passportIndex: '0' } });
  assert.match(shared[0], /Resultado: Pump inspected/);
  assert.match(shared[0], /Pasaporte: https:\/\/app\.splashlens\.com/);
  await context.textSavedProofStop({ dataset: { poolId: 'pool-1', passportIndex: '1' } });
  assert.equal(shared.length, 1);
  pools[0].servicePassports[0].passportExpiresAt = '2020-01-01T00:00:00Z';
  await context.textSavedProofStop({ dataset: { poolId: 'pool-1', passportIndex: '0' } });
  assert.doesNotMatch(shared[1], /Pasaporte:/);
});

test('every opened code card has Text it and shares the selected-language answer', async () => {
  const { context, shared, events } = sharingContext();
  const cardHtml = context.codeCard({ code: 'E01', name: 'Pump fault', severity: 'medium', causes: ['Flow low'], fix: ['Check filter'] }, 'e01', '#123456');
  assert.match(cardHtml, /onclick="textCodeAnswer\(this\)">Text it<\/button>/);
  await context.textCodeAnswer({ closest: () => ({ dataset: { code: 'E01', answerName: 'Pump fault', answerProof: 'Flow low \/ Check filter' } }) });
  assert.match(shared[0], /^Respuesta de código de SplashLens\nCódigo: E01\nResultado: Pump fault\nEvidencia: Flow low \/ Check filter$/);
  assert.equal(events[1][1].surface, 'code_answer');
});

test('live Text it is completion-gated and no new send or commerce UI is introduced', () => {
  assert.match(html, /id="rpt-text-proof-btn"[^>]*onclick="textCurrentProofStop\(\)"[^>]*hidden/);
  assert.match(html, /#rpt-text-proof-btn\[hidden\] \{ display:none; \}/);
  assert.match(slice('function validateReportProof(', 'function reportReadingSummary('), /textButton\.hidden = !complete/);
  assert.match(slice('function saveReportToPoolHistory(', 'function copyReport('), /passport\.passportUrl = passportUrl/);
  assert.match(slice('function saveReportToPoolHistory(', 'function copyReport('), /passport\.passportExpiresAt = _lastSecureProofPacket\.expiresAt/);
  assert.doesNotMatch(slice('function proofPacketSignature(', 'async function submitProofPacketForTeamReview'), /fetch\(|localStorage|phone|checkout|payment/i);
});

test('store-shell packet drops commerce language and never sends to a server', async () => {
  const { context, shared } = sharingContext();
  context.buildServicePassport = () => ({ proof: { customerSummary: 'Checkout for $19', photoProof: 'Payment required' } });
  await context.textCurrentProofStop();
  assert.equal(shared[0], 'Prueba de SplashLens');
});

test('iOS Text it opens the SMS composer with no recipient or server call', async () => {
  const { context, shared } = sharingContext();
  const opened = [];
  context.navigator.userAgent = 'iPhone';
  context.document.body = { append() {} };
  context.document.createElement = () => ({
    click() { opened.push(this.href); },
    remove() {},
  });
  await context.textCurrentProofStop();
  assert.equal(shared.length, 0);
  assert.equal(opened.length, 1);
  assert.match(opened[0], /^sms:\?&body=/);
  assert.match(decodeURIComponent(opened[0].split('body=')[1]), /Prueba de SplashLens/);
  assert.doesNotMatch(opened[0], /^sms:\?[^&]/);
});
