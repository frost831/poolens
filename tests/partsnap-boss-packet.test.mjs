import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { buildPartSnapBossPacket, initPartSnapBossPacket, isSuccessfulPartSnap } from '../js/partsnap-boss-packet.js';

const result = (extra = {}) => ({
  manufacturer: 'Example manufacturer', component: 'Pump lid', confidence: 'medium',
  visibleEvidence: ['Raised marking visible'], missingProof: ['Equipment model plate'], ...extra,
});
const snapshot = (extra = {}) => ({ result: result(), mode: 'parts', status: 'POSSIBLE MATCH: Pump lid', ...extra });

function appProofHelpers() {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  return ['partConfidenceLadder', 'partSnapCallbackRisk', 'getPartSnapOrderGate'].map(name => {
    const source = app.match(new RegExp(`^function ${name}\\([^]*?^\\}`, 'm'))?.[0];
    assert.ok(source, `app proof helper missing: ${name}`);
    return source;
  }).join('\n');
}

test('draft includes proof, missing proof, manager ask, Teams inquiry and conservative claim boundary', () => {
  const packet = buildPartSnapBossPacket(result(), { ladder: { missing: ['Equipment model plate', 'Dimensions'] }, orderGate: { reasons: ['complete four-view evidence set'] } });
  assert.match(packet.text, /Scan-reported observation: Raised marking visible/);
  assert.match(packet.text, /Missing proof \/ ordering hold:/);
  assert.equal(packet.text.match(/- Equipment model plate/g).length, 1);
  assert.match(packet.text, /- Dimensions/);
  assert.match(packet.text, /complete four-view evidence set/);
  assert.match(packet.text, /Ask for my boss:/);
  assert.match(packet.text, /SplashLens Teams inquiry:/);
  assert.match(packet.text, /hello@splashlens\.com/);
  assert.match(packet.text, /not a diagnosis, exact-fit guarantee/);
  assert.match(packet.text, /No source citations available/);
});

test('unstructured AI descriptions and escalation claims are not promoted into the boss packet', () => {
  const packet = buildPartSnapBossPacket(result({ description: 'Guaranteed exact fit', escalationSummary: 'Manufacturer approved replacement', replacementNotes: 'Order now', model: 'M1', partNumber: 'P1' }));
  assert.doesNotMatch(packet.text, /Guaranteed exact fit|Manufacturer approved replacement|Order now/);
  assert.match(packet.text, /Possible model: M1/);
  assert.match(packet.text, /Possible part number: P1/);
});

test('citations use supplied HTTPS family routes, deduplicate and reject executable or credentialed URLs', () => {
  const packet = buildPartSnapBossPacket(result({ corpusCandidates: [
    { sourceUrls: ['https://example.com/manual.pdf', 'javascript:alert(1)', 'https://user:secret@example.com/private', 'data:text/html,bad'], sourceLabels: ['Manufacturer manual'] },
    { sourceUrls: ['https://example.com/manual.pdf', 'https://example.com/diagram'], sourceLabels: ['Manufacturer manual', 'Parts diagram'] },
  ] }));
  assert.match(packet.text, /Manufacturer manual: https:\/\/example.com\/manual.pdf/);
  assert.match(packet.text, /Parts diagram: https:\/\/example.com\/diagram/);
  assert.equal(packet.text.match(/https:\/\/example.com\/manual.pdf/g).length, 1);
  assert.doesNotMatch(packet.text, /javascript:|data:|user:secret/);
  assert.equal(packet.analytics.source_route_count, 2);
  assert.match(packet.text, /family reference is not proof/);
});

test('empty and malformed evidence stays explicit and packet text cannot inject headings via newlines', () => {
  const packet = buildPartSnapBossPacket({ component: 'Lid\nORDER APPROVED', confidence: 'private@example.com', visibleEvidence: [null, {}, '', 'Marking\r\nNew section'], missingProof: 'bad', corpusCandidates: [null, { sourceUrls: [null, 7, '/relative'] }] });
  assert.match(packet.text, /Possible part\/family: Lid ORDER APPROVED/);
  assert.match(packet.text, /Scan-reported observation: Marking New section/);
  assert.equal(packet.analytics.confidence, 'unknown');
  assert.doesNotMatch(packet.text, /\[object Object\]/);
  assert.match(buildPartSnapBossPacket(null).text, /No visible proof was recorded/);
  assert.match(buildPartSnapBossPacket({}).text, /current manufacturer verification is still required/);
});

test('analytics contains only enum and counts, never result text, identity or citations', () => {
  const packet = buildPartSnapBossPacket(result({ manufacturer: 'private@example.com', model: 'Account 123', component: 'Customer address', confidence: 'secret', visibleEvidence: ['private@example.com'], corpusCandidates: [{ sourceUrls: ['https://example.com/customer/secret'] }] }));
  assert.deepEqual(packet.analytics, { confidence: 'unknown', proof_visible_count: 1, proof_missing_count: 1, source_route_count: 1 });
  assert.doesNotMatch(JSON.stringify(packet.analytics), /private|secret|Account|Customer|https/);
});

test('real app proof helpers keep four-view, dimensions and model gaps in the boss draft', () => {
  const context = { PARTSNAP_EVIDENCE_STEPS: new Array(4) };
  runInNewContext(appProofHelpers(), context);
  const ai = result();
  const ladder = context.partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component);
  const risk = context.partSnapCallbackRisk(ai, ladder, ai.visibleEvidence, ai.missingProof);
  const gate = context.getPartSnapOrderGate(ai, [], ladder, risk, ai.missingProof);
  const packet = buildPartSnapBossPacket(ai, { ladder, orderGate: gate });
  for (const gap of ['visible part number or model plate', 'equipment model', 'complete four-view evidence set', 'record dimensions or fit measurements', 'match a source-backed equipment family']) assert.ok(packet.text.includes(gap), gap);
  assert.equal(gate.verificationReady, false);
});

test('only a successful matching PartSnap state qualifies; low, unknown, stale and error states do not', () => {
  assert.equal(isSuccessfulPartSnap(snapshot()), true);
  for (const extra of [
    { result: null }, { result: result({ confidence: 'low' }) }, { result: result({ confidence: 'unknown' }) },
    { result: result({ component: 'Unknown part' }) }, { result: result({ component: '' }) },
    { mode: 'strip' }, { status: 'AI ANALYZING EVIDENCE SET...' }, { status: 'POSSIBLE MATCH: Old part' },
    { status: 'AI UNAVAILABLE - USING LOCAL SCAN' }, { status: 'FREE SCAN LIMIT REACHED' },
    { status: 'PART NOT IDENTIFIED - NEEDS TWO PHOTOS' }, { status: 'SECOND PROOF: CAPTURE LABEL' },
  ]) assert.equal(isSuccessfulPartSnap(snapshot(extra)), false, JSON.stringify(extra));
});

// Minimal DOM harness keeps the module's integration tests dependency-free.
class Element {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.dataset = {}; this.style = {}; this.attrs = {}; this.listeners = new Map(); this.textContent = ''; }
  append(...nodes) { for (const node of nodes) { node.remove(); node.parentElement = this; this.children.push(node); } }
  before(node) { node.remove(); node.parentElement = this.parentElement; const siblings = this.parentElement.children; siblings.splice(siblings.indexOf(this), 0, node); }
  remove() { if (this.parentElement) { const siblings = this.parentElement.children; siblings.splice(siblings.indexOf(this), 1); this.parentElement = null; } }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector === 'button[onclick="sharePartSnapPacket()"]') return this.tag === 'button' && this.attrs.onclick === 'sharePartSnapPacket()';
    if (selector === '[data-partsnap-boss-packet]') return 'partsnapBossPacket' in this.dataset;
    if (selector === '[data-partsnap-boss-action]') return 'partsnapBossAction' in this.dataset;
    return false;
  }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector); }
  addEventListener(event, callback) { this.listeners.set(event, callback); }
  removeEventListener(event) { this.listeners.delete(event); }
  focus(options) { this.focused = true; this.focusOptions = options; }
  scrollIntoView(options) { this.scrollOptions = options; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  select() { this.selected = true; }
}

function harness(nav = {}) {
  const panel = new Element(); panel.id = 'scan-camera-panel';
  const status = new Element(); status.id = 'scan-camera-status'; status.textContent = 'POSSIBLE MATCH: Pump lid';
  const root = new Element(); root.id = 'scan-result';
  const actions = new Element(); const share = new Element('button'); share.setAttribute('onclick', 'sharePartSnapPacket()'); actions.append(share);
  const feedback = new Element(); feedback.id = 'partsnap-feedback-panel';
  root.append(actions, feedback); panel.append(status, root);
  const doc = { getElementById: id => panel.id === id ? panel : panel.querySelector(`#${id}`), createElement: tag => new Element(tag) };
  let current = snapshot(); const events = []; const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const options = { document: doc, navigator: nav, getSnapshot: () => current, track: (event, props) => events.push({ event, props }), MutationObserver: Observer };
  const controller = initPartSnapBossPacket(options);
  const control = () => root.querySelector('[data-partsnap-boss-packet]');
  const action = name => control()?.querySelectorAll('[data-partsnap-boss-action]').find(node => node.dataset.partsnapBossAction === name);
  const click = async name => { const node = action(name); assert.ok(node, `missing ${name}`); await root.listeners.get('click')({ target: node }); };
  return { doc, root, status, actions, feedback, options, controller, control, action, click, events, observers, change(value) { current = value; }, get textarea() { return control().querySelector('#partsnap-boss-draft-text'); }, get notice() { return control().children[1].children[3]; } };
}

test('mounting and opening creates one safe readonly draft and performs no outbound action', async () => {
  let sends = 0;
  const h = harness({ share() { sends++; }, clipboard: { writeText() { sends++; } } });
  assert.equal(h.events.length, 0);
  assert.equal(h.control().children[1].hidden, true);
  assert.equal(initPartSnapBossPacket(h.options), h.controller);
  h.controller.refresh(); h.observers[0].callback();
  assert.equal(h.root.querySelectorAll('[data-partsnap-boss-packet]').length, 1);
  await h.click('open');
  assert.equal(sends, 0);
  assert.equal(h.textarea.readOnly, true);
  assert.equal(h.textarea.selectionStart, 0);
  assert.equal(h.textarea.scrollTop, 0);
  assert.deepEqual(h.textarea.focusOptions, { preventScroll: true });
  assert.deepEqual(h.control().children[1].scrollOptions, { block: 'nearest', inline: 'nearest', behavior: 'auto' });
  assert.match(h.control().children[1].style.cssText, /scroll-margin-bottom:calc\(184px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.equal(h.action('open').getAttribute('aria-expanded'), 'true');
  assert.equal(h.events[0].event, 'partsnap_boss_packet_opened');
  await h.click('close');
  assert.equal(h.control().children[1].hidden, true);
  assert.equal(h.action('open').focused, true);
});

test('copy writes the reviewed draft and records sanitized success only after resolution', async () => {
  const writes = []; const h = harness({ clipboard: { async writeText(text) { writes.push(text); } } });
  await h.click('open'); await h.click('copy');
  assert.deepEqual(writes, [h.textarea.value]);
  assert.equal(h.notice.textContent, 'Draft copied.');
  assert.deepEqual(h.events.at(-1), { event: 'partsnap_boss_packet_copied', props: { confidence: 'medium', proof_visible_count: 1, proof_missing_count: 1, source_route_count: 0, method: 'clipboard' } });
});

test('native share receives only the draft and success is not automatic email or team submission', async () => {
  const shares = []; const h = harness({ async share(payload) { shares.push(payload); } });
  await h.click('open'); await h.click('share');
  assert.deepEqual(shares, [{ title: 'SplashLens PartSnap - boss review draft', text: h.textarea.value }]);
  assert.equal(h.notice.textContent, 'Draft shared.');
  assert.equal(h.events.at(-1).event, 'partsnap_boss_packet_shared');
});

test('share cancellation never silently copies or records a successful share', async () => {
  let copies = 0;
  const h = harness({ async share() { throw Object.assign(new Error('User canceled'), { name: 'AbortError' }); }, clipboard: { async writeText() { copies++; } } });
  await h.click('open'); await h.click('share');
  assert.equal(copies, 0);
  assert.equal(h.notice.textContent, 'Share canceled.');
  assert.deepEqual(h.events.map(item => item.event), ['partsnap_boss_packet_opened']);
  assert.equal(h.action('share').disabled, false);
});

test('unavailable or rejected clipboard selects the draft without falsely claiming a copy', async () => {
  for (const nav of [{}, { clipboard: { async writeText() { throw new Error('Denied'); } } }]) {
    const h = harness(nav); await h.click('open'); await h.click('copy');
    assert.equal(h.textarea.selected, true);
    assert.match(h.notice.textContent, /manual copy/);
    assert.equal(h.action('share').hidden, true);
    assert.equal(h.events.length, 1);
  }
});

test('share failure allows an explicit copy retry but never copies automatically', async () => {
  let copies = 0;
  const h = harness({ async share() { throw new Error('Share failed'); }, clipboard: { async writeText() { copies++; } } });
  await h.click('open'); await h.click('share');
  assert.equal(copies, 0); assert.match(h.notice.textContent, /Could not share/);
  await h.click('copy'); assert.equal(copies, 1);
});

test('new or modified evidence closes stale previews and rebuilds without duplicated buttons', async () => {
  const h = harness(); await h.click('open');
  const old = h.control(); const next = snapshot({ result: result({ visibleEvidence: ['New marking'], missingProof: ['New dimensions'] }) });
  h.change(next); h.observers[0].callback();
  assert.notEqual(h.control(), old); assert.equal(h.control().children[1].hidden, true);
  assert.match(h.textarea.value, /New marking/); assert.doesNotMatch(h.textarea.value, /Raised marking/);
  next.result.visibleEvidence = ['Changed in place']; h.controller.refresh();
  assert.match(h.textarea.value, /Changed in place/);
  assert.equal(h.root.querySelectorAll('[data-partsnap-boss-packet]').length, 1);
});

test('loading, errors, mode changes, incomplete DOM and busy results remove the control', () => {
  for (const invalidate of [
    h => { h.status.textContent = 'AI ANALYZING EVIDENCE SET...'; },
    h => { h.status.textContent = 'SPLASHLENS PRO RESTORE NEEDED'; },
    h => { h.change(snapshot({ mode: 'strip' })); },
    h => { h.feedback.remove(); }, h => { h.actions.remove(); },
    h => { h.root.setAttribute('aria-busy', 'true'); }, h => { h.root.hidden = true; },
  ]) {
    const h = harness(); assert.ok(h.control()); invalidate(h); h.observers[0].callback(); assert.equal(h.control(), null);
  }
});

test('a click revalidates live state even before the mutation observer runs', async () => {
  let copies = 0; const h = harness({ clipboard: { async writeText() { copies++; } } });
  await h.click('open'); const old = h.action('copy'); h.status.textContent = 'FREE SCAN LIMIT REACHED';
  await h.root.listeners.get('click')({ target: old });
  assert.equal(copies, 0); assert.equal(h.control(), null);
});

test('pending actions block repeated taps and late completion cannot overwrite a new result', async () => {
  let finish; let copies = 0;
  const h = harness({ clipboard: { writeText() { copies++; return new Promise(resolve => { finish = resolve; }); } } });
  await h.click('open'); const pending = h.click('copy'); await h.click('copy'); assert.equal(copies, 1);
  assert.equal(h.action('copy').disabled, true);
  h.change(snapshot({ result: result({ visibleEvidence: ['Second scan'] }) })); h.controller.refresh();
  const nextControl = h.control(); finish(); await pending;
  assert.equal(h.control(), nextControl); assert.equal(h.notice.textContent, '');
  assert.match(h.textarea.value, /Second scan/);
});

test('destroy removes owned UI and listeners and permits clean reinitialization', () => {
  const h = harness(); h.controller.destroy();
  assert.equal(h.control(), null); assert.equal(h.root.listeners.size, 0); assert.equal(h.observers[0].disconnected, true);
  const next = initPartSnapBossPacket(h.options); assert.notEqual(next, h.controller); assert.ok(h.control());
  assert.equal(initPartSnapBossPacket({ document: { getElementById() { return null; } } }), null);
});

test('script include is singular and module has no network, email navigation or storage writes', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const source = readFileSync(new URL('../js/partsnap-boss-packet.js', import.meta.url), 'utf8');
  assert.equal((html.match(/src="\/js\/partsnap-boss-packet\.js\?/g) || []).length, 1);
  assert.match(html, /type="module" src="\/js\/partsnap-boss-packet\.js/);
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|mailto:|localStorage|sessionStorage|innerHTML\s*=/);
});

// Opt-in real-browser coverage uses an already installed Playwright package, not a new repo dependency.
for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
  test(`real browser integration, lexical app state and layout ${viewport.width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
    const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport });
      const source = readFileSync(new URL('../js/partsnap-boss-packet.js', import.meta.url), 'utf8');
      const helpers = appProofHelpers();
      await page.route('https://boss-packet.test/**', route => {
        if (route.request().url().endsWith('/module.js')) return route.fulfill({ contentType: 'text/javascript', body: source });
        return route.fulfill({ contentType: 'text/html', body: `<html><body style="margin:0;background:#0f172a;color:white;font-family:Arial"><main style="max-width:640px;padding:14px;margin:auto"><div id="scan-camera-panel"><p id="scan-camera-status">POSSIBLE MATCH: Pump lid</p><div id="scan-result"><h2>Possible pump lid</h2><div><button onclick="sharePartSnapPacket()">Share Packet</button></div><div id="partsnap-feedback-panel"></div></div></div></main><script>let _lastPartSnapResult = ${JSON.stringify(result({ component: 'Pump lid', model: '<img src=x onerror=alert(1)>', corpusCandidates: [{ sourceUrls: ['https://example.com/manual'], sourceLabels: ['Manufacturer manual'] }] }))}; let _scanMode = 'parts'; const PARTSNAP_EVIDENCE_STEPS = new Array(4); ${helpers}; window.events=[]; window.trackSplashLensEvent=(event,props)=>events.push({event,props}); window.copies=[]; Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>copies.push(text)}}); Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('Canceled','AbortError')}}); function sharePartSnapPacket(){}</script><script type="module" src="/module.js"></script></body></html>` });
      });
      await page.goto('https://boss-packet.test/');
      await page.evaluate(() => {
        const footer = document.createElement('nav');
        footer.setAttribute('aria-label', 'SplashLens field tools');
        footer.textContent = 'Field tools';
        footer.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:58px;background:white;color:black;z-index:50;';
        document.body.append(footer);
        document.querySelector('main').style.paddingTop = '600px';
        document.querySelector('main').style.paddingBottom = '200px';
      });
      const open = page.getByRole('button', { name: 'Send this to my boss', exact: true });
      await open.click();
      assert.equal(await page.locator('#partsnap-boss-draft-text').evaluate(node => node.scrollTop), 0);
      const clearance = await page.evaluate(() => {
        const footerTop = document.querySelector('nav').getBoundingClientRect().top;
        const preview = document.querySelector('#partsnap-boss-draft');
        return { proofVisible: preview.getBoundingClientRect().top >= 0, controlsClear: [...preview.querySelectorAll('button')].every(node => node.getBoundingClientRect().bottom <= footerTop) };
      });
      assert.deepEqual(clearance, { proofVisible: true, controlsClear: true });
      await page.getByRole('button', { name: 'Copy draft', exact: true }).click();
      assert.equal(await page.locator('[role="status"]').textContent(), 'Draft copied.');
      assert.equal(await page.locator('#partsnap-boss-draft img').count(), 0);
      assert.match(await page.locator('#partsnap-boss-draft-text').inputValue(), /<img src=x onerror=alert\(1\)>/);
      assert.match(await page.locator('#partsnap-boss-draft-text').inputValue(), /record dimensions or fit measurements/);
      await page.getByRole('button', { name: 'Share draft', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[role="status"]').textContent === 'Share canceled.');
      assert.equal(await page.evaluate(() => copies.length), 1);
      assert.deepEqual(await page.evaluate(() => events.map(item => item.event)), ['partsnap_boss_packet_opened', 'partsnap_boss_packet_copied']);
      const layout = await page.evaluate(() => {
        const section = document.querySelector('[data-partsnap-boss-packet]');
        return { overflow: document.documentElement.scrollWidth > innerWidth, buttonsFit: [...section.querySelectorAll('button')].every(button => button.scrollWidth <= button.clientWidth + 2) };
      });
      assert.deepEqual(layout, { overflow: false, buttonsFit: true });
      if (process.env.SPLASHLENS_BOSS_SCREENSHOTS) await page.screenshot({ path: join(tmpdir(), `splashlens-boss-packet-${viewport.width}.png`), fullPage: true });
      await page.evaluate(() => { _lastPartSnapResult = { component: 'Pump lid', confidence: 'high', visibleEvidence: ['Fresh scan'] }; document.getElementById('scan-result').append(document.createElement('span')); });
      await page.waitForFunction(() => document.querySelector('#partsnap-boss-draft').hidden);
      assert.match(await page.locator('#partsnap-boss-draft-text').inputValue(), /Fresh scan/);
      assert.equal(await open.count(), 1);
      await page.evaluate(() => { document.getElementById('scan-camera-status').textContent = 'AI ANALYZING EVIDENCE SET...'; });
      await page.waitForFunction(() => !document.querySelector('[data-partsnap-boss-packet]'));
      await page.evaluate(() => { document.getElementById('scan-result').textContent = 'Scan failed'; document.getElementById('scan-camera-status').textContent = 'AI UNAVAILABLE'; });
      assert.equal(await open.count(), 0);
    } finally { await browser.close(); }
  });
}
