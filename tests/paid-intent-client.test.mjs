import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const uuid = '01234567-89ab-4cde-8f01-23456789abcd';
const referencePattern = /^sl_checkout_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function functionSource(name) {
  const match = source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `Missing app function ${name}`);
  return match[0];
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

function harness(names, overrides = {}) {
  const events = [];
  const context = vm.createContext({
    crypto: webcrypto, URLSearchParams, URL, Uint8Array, Uint32Array,
    localStorage: storage({ 'splashlens-scan-client-id': uuid }),
    sessionStorage: storage({ 'splashlens-session-id': 'session-abc123-01234567' }),
    getSplashLensRole: () => 'tech', getWorkflowStyle: () => 'steps',
    normalizeSplashLensRole: value => value, getFieldChallengeContext: () => ({}),
    getStoreShellMode: () => '', isStoreShellMode: () => false,
    trackSplashLensEvent: (name, props = {}) => events.push({ name, props: { ...props } }),
    navigator: { onLine: true }, window: {},
    escHtml: value => String(value), escAttr: value => String(value),
    a3Text: key => key,
    ...overrides,
  });
  if (names.includes('startWebCheckout')) vm.runInContext('let checkoutPending = false;', context);
  vm.runInContext(names.map(functionSource).join('\n'), context);
  return { context, events };
}

const checkoutFunctions = [
  'getScanClientId', 'getAnalyticsSessionId', 'getCheckoutAttribution',
  'createCheckoutUUID', 'getCheckoutUrl', 'trackCheckoutIntent', 'trackPostValueUpgrade',
  'claimPostValueOffer',
];
const valueFunctions = ['trackFirstActionStarted', 'trackFirstUsefulResult'];
const names = events => events.map(event => event.name);

test('each checkout click has a fresh UUID and matching anonymous attribution in event and URL', () => {
  const { context, events } = harness(checkoutFunctions);
  const firstUrl = new URL(context.trackCheckoutIntent('monthly', 'scan_limit_reached'), 'https://app.test');
  const secondUrl = new URL(context.trackCheckoutIntent('yearly', 'field_stop_saved'), 'https://app.test');
  const clicks = events.filter(event => event.name === 'checkout_click');
  assert.equal(firstUrl.pathname, '/api/checkout');
  assert.equal(secondUrl.searchParams.get('plan'), 'yearly');
  assert.notEqual(clicks[0].props.client_reference_id, clicks[1].props.client_reference_id);
  for (const [index, url] of [firstUrl, secondUrl].entries()) {
    const props = clicks[index].props;
    assert.match(props.client_reference_id, referencePattern);
    for (const key of ['source', 'plan', 'placement', 'store', 'client_reference_id', 'client_id', 'session_id']) {
      assert.equal(url.searchParams.get(key), props[key], key);
    }
    assert.equal(props.source, 'app');
    assert.equal(props.store, 'web');
    assert.equal(props.client_id, uuid);
    assert.equal(props.session_id, 'session-abc123-01234567');
    assert.deepEqual(events[index * 2 + 1].props, props, 'Legacy upgrade shares the intent');
    assert.doesNotMatch(url.href, /email|name|@/);
  }
});

test('rendering a URL creates neither an intent reference nor checkout events', () => {
  const { context, events } = harness(checkoutFunctions);
  const url = new URL(context.getCheckoutUrl('monthly', 'partsnap_result'), 'https://app.test');
  assert.equal(url.searchParams.has('client_reference_id'), false);
  assert.equal(events.length, 0);
});

test('invalid stored identifiers and placements never leak identity into checkout', () => {
  const { context, events } = harness(checkoutFunctions, {
    localStorage: storage({ 'splashlens-scan-client-id': 'customer@example.com' }),
    sessionStorage: storage({ 'splashlens-session-id': 'Customer Name' }),
  });
  const url = context.trackCheckoutIntent('monthly', 'customer@example.com');
  assert.doesNotMatch(url, /customer|example|Customer|Name|@/);
  assert.equal(events[0].props.placement, 'app_upgrade');
  assert.match(events[0].props.client_id, /^[a-f0-9-]{36}$/);
  assert.match(events[0].props.session_id, /^session-[a-z0-9]+-[a-f0-9]{8}$/);
});

test('opaque identity persists and click tracking works when storage is blocked', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const { context, events } = harness(checkoutFunctions, { localStorage: blocked, sessionStorage: blocked });
  context.trackCheckoutIntent('monthly', 'partsnap_result');
  context.trackCheckoutIntent('yearly', 'partsnap_result');
  const clicks = events.filter(event => event.name === 'checkout_click');
  assert.equal(clicks[0].props.client_id, clicks[1].props.client_id);
  assert.equal(clicks[0].props.session_id, clicks[1].props.session_id);
});

test('UUID fallback preserves v4 reference format without randomUUID', () => {
  const { context } = harness(checkoutFunctions, { crypto: { getRandomValues: value => webcrypto.getRandomValues(value) } });
  const url = new URL(context.trackCheckoutIntent('monthly', 'partsnap_result'), 'https://app.test');
  assert.match(url.searchParams.get('client_reference_id'), referencePattern);
});

test('post-value checkout preserves the legacy click and upgrade events', () => {
  const { context, events } = harness(checkoutFunctions);
  assert.match(context.trackPostValueUpgrade('monthly', 'scan_lookup_search'), /^\/api\/checkout\?/);
  assert.deepEqual(names(events), ['checkout_click', 'upgrade_click', 'post_value_upgrade_clicked']);
});

test('native shells cannot render or initiate web upgrade paths', () => {
  for (const store of ['ios', 'android', 'native']) {
    const { context, events } = harness([...checkoutFunctions,
      'renderPostValueUpgradeOffer', 'renderPartSnapResultUpgradeOffer', 'renderManualLookupUpgradeOffer'], {
      getStoreShellMode: () => store, isStoreShellMode: () => true, isPartSnapPro: () => false,
    });
    assert.equal(context.getCheckoutUrl('monthly', 'account_dashboard'), '');
    assert.equal(context.trackCheckoutIntent('monthly', 'account_dashboard'), '');
    assert.equal(context.trackPostValueUpgrade('monthly', 'field_stop_saved'), '');
    assert.equal(context.renderPostValueUpgradeOffer(), '');
    assert.equal(context.renderPartSnapResultUpgradeOffer(), '');
    assert.equal(context.renderManualLookupUpgradeOffer(1, 'E05'), '');
    assert.equal(events.length, 0);
  }
});

test('zero-result lookup generates neither an offer nor an impression', () => {
  const { context, events } = harness([...checkoutFunctions, 'renderManualLookupUpgradeOffer'], { isPartSnapPro: () => false });
  assert.equal(context.renderManualLookupUpgradeOffer(0, 'unknown'), '');
  assert.equal(events.length, 0);
});

test('all rendered web upgrade links replace their href with the attributed intent URL', () => {
  for (const [renderer, args] of [
    ['renderPostValueUpgradeOffer', []],
    ['renderPartSnapResultUpgradeOffer', []],
    ['renderManualLookupUpgradeOffer', [1, 'E05']],
  ]) {
    const { context } = harness([...checkoutFunctions, renderer], { isPartSnapPro: () => false });
    const html = context[renderer](...args);
    assert.equal((html.match(/data-checkout-plan=/g) || []).length, 2);
    assert.equal((html.match(/this.href=trackPostValueUpgrade/g) || []).length, 2);
    assert.doesNotMatch(html, /sl_checkout_/);
  }
  assert.match(functionSource('showScanLimitModal'), /this.href=trackCheckoutIntent/);
  assert.match(source, /this.href=trackCheckoutIntent\('monthly','account_dashboard'\)/);
});

test('web post-value surfaces share one offer per session', () => {
  const sharedSession = storage();
  const functions = [...checkoutFunctions, 'renderPostValueUpgradeOffer',
    'renderPartSnapResultUpgradeOffer', 'renderManualLookupUpgradeOffer'];
  const first = harness(functions, { isPartSnapPro: () => false, sessionStorage: sharedSession });
  assert.match(first.context.renderManualLookupUpgradeOffer(1, 'E05'), /data-checkout-placement="scan_lookup_search"/);
  assert.equal(first.context.renderPartSnapResultUpgradeOffer(), '');
  assert.equal(first.context.renderPostValueUpgradeOffer(), '');
  assert.deepEqual(names(first.events), ['post_value_upgrade_shown']);
  const reloaded = harness(functions, { isPartSnapPro: () => false, sessionStorage: sharedSession });
  assert.equal(reloaded.context.renderPartSnapResultUpgradeOffer(), '');
  assert.equal(reloaded.events.length, 0);
});

test('third free scan gate follows result, can be dismissed, and uses A1 placement', () => {
  let html = '<div>Complete scan result</div>';
  let removed = false;
  const gate = { remove: () => { removed = true; } };
  const result = { insertAdjacentHTML: (_position, markup) => { html += markup; } };
  const { context, events } = harness([...checkoutFunctions, 'showThirdScanSoftGate', 'dismissThirdScanSoftGate'], {
    isPartSnapPro: () => false, SCAN_LIMIT_FREE: 3,
    document: { getElementById: id => id === 'third-scan-soft-gate' ? gate : null },
  });
  context.showThirdScanSoftGate(result, 'parts_snap');
  assert.ok(html.indexOf('Complete scan result') < html.indexOf('third-scan-soft-gate'));
  assert.match(html, /data-checkout-placement="soft_gate_scan3"/);
  assert.match(html, /trackPostValueUpgrade\('monthly','soft_gate_scan3'\)/);
  assert.match(html, /upgrade.softGateManual/);
  assert.equal(events[0].name, 'soft_gate_shown');
  assert.equal(events[0].props.remaining_scans, 0);
  assert.equal(events[0].props.mode, 'parts_snap');
  const checkoutUrl = new URL(context.trackPostValueUpgrade('monthly', 'soft_gate_scan3'), 'https://app.test');
  assert.equal(checkoutUrl.searchParams.get('placement'), 'soft_gate_scan3');
  assert.equal(events.find(event => event.name === 'checkout_click').props.placement, 'soft_gate_scan3');
  assert.equal(context.showThirdScanSoftGate(result, 'parts_snap'), undefined);
  assert.equal(events.filter(event => event.name === 'soft_gate_shown').length, 1);
  context.dismissThirdScanSoftGate();
  assert.equal(removed, true);
  assert.equal(events.at(-1).name, 'soft_gate_dismissed');
  assert.equal(events.at(-1).props.placement, 'soft_gate_scan3');
});

test('store shell cannot show a third-scan card or claim the session offer', () => {
  const result = { insertAdjacentHTML: () => { throw Error('store offer rendered'); } };
  const { context, events } = harness([...checkoutFunctions, 'showThirdScanSoftGate'], {
    SCAN_LIMIT_FREE: 3, isPartSnapPro: () => false, isStoreShellMode: () => true,
  });
  context.showThirdScanSoftGate(result, 'test_strip');
  assert.equal(events.length, 0);
});

test('a prior post-value offer does not suppress the third-scan gate', () => {
  let html = '';
  const result = { insertAdjacentHTML: (_position, markup) => { html += markup; } };
  const { context, events } = harness([...checkoutFunctions, 'showThirdScanSoftGate'], {
    SCAN_LIMIT_FREE: 3, isPartSnapPro: () => false,
    sessionStorage: storage({ 'splashlens-post-value-offer-session-v1': '1' }),
  });
  context.showThirdScanSoftGate(result, 'parts_snap');
  assert.match(html, /soft_gate_scan3/);
  assert.equal(events.filter(event => event.name === 'soft_gate_shown').length, 1);
});

test('a failed third scan does not show an upgrade card', async () => {
  let count = 2;
  let html = '';
  const result = {
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; },
    insertAdjacentHTML: (_position, markup) => { html += markup; },
  };
  const { context, events } = harness([...checkoutFunctions, 'callAIScan', 'showThirdScanSoftGate'], {
    SCAN_LIMIT_FREE: 3, isPartSnapPro: () => false,
    getScanUsage: () => ({ count }), recordAIScan: (_mode, usage) => { count = usage.count; },
    renderPartsSnapResult: (_ai, element) => { element.innerHTML = '<div>More evidence needed</div>'; return false; },
    getLanguageHeaders: () => ({}), getScanEntitlementToken: () => '',
    getPartSnapRecoveryContext: () => null, getSplashLensIdentityProfile: () => ({}),
    getFieldSaveAccount: () => ({}), getPartSnapEvidenceSummary: () => ({}),
    getScanClientId: () => uuid, withLanguageMetadata: value => value,
    FREE_PROFILE_TOKEN_KEY: 'profile', ACCOUNT_TOKEN_KEY: 'account',
    fetch: async () => ({ ok: true, json: async () => ({ result: {}, usage: { source: 'free_metered', count: 3 } }) }),
  });
  await context.callAIScan({ toDataURL: () => 'data:image/jpeg;base64,AA==' }, 'parts_snap', result, {});
  assert.match(html, /More evidence needed/);
  assert.doesNotMatch(html, /soft_gate_scan3/);
  assert.equal(events.some(event => event.name === 'soft_gate_shown'), false);
});

test('successful free scans show the soft gate only after the third complete result', async () => {
  let count = 0;
  let html = '';
  const result = {
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; },
    insertAdjacentHTML: (_position, markup) => { html += markup; },
  };
  const { context, events } = harness([...checkoutFunctions, 'callAIScan', 'showThirdScanSoftGate'], {
    SCAN_LIMIT_FREE: 3, isPartSnapPro: () => false,
    getScanUsage: () => ({ count }),
    recordAIScan: (_mode, usage) => { count = usage.count; },
    renderPartsSnapResult: (_ai, element) => { element.innerHTML = '<div>Full PartSnap result and actions</div>'; return true; },
    getLanguageHeaders: () => ({}), getScanEntitlementToken: () => '',
    getPartSnapRecoveryContext: () => null, getSplashLensIdentityProfile: () => ({}),
    getFieldSaveAccount: () => ({}), getPartSnapEvidenceSummary: () => ({ complete: true }),
    getScanClientId: () => uuid, withLanguageMetadata: value => value,
    FREE_PROFILE_TOKEN_KEY: 'profile', ACCOUNT_TOKEN_KEY: 'account',
    fetch: async () => ({ ok: true, json: async () => ({ result: { component: 'Pump lid' }, usage: { source: 'free_metered', count: count + 1 } }) }),
  });
  const canvas = { toDataURL: () => 'data:image/jpeg;base64,AA==' };
  for (let scan = 1; scan <= 3; scan++) {
    await context.callAIScan(canvas, 'parts_snap', result, {});
    assert.match(html, /Full PartSnap result and actions/);
    assert.equal(html.includes('third-scan-soft-gate'), scan === 3);
  }
  assert.ok(html.indexOf('Full PartSnap result and actions') < html.indexOf('third-scan-soft-gate'));
  assert.equal(events.filter(event => event.name === 'soft_gate_shown').length, 1);
  assert.equal(events.some(event => event.name === 'ai_scan_failed'), false);
});

test('Strip Scan offers Pro only after a useful reading and once per session', async () => {
  let count = 0;
  let html = '';
  const result = {
    isConnected: true,
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; },
    getClientRects: () => [{}],
    insertAdjacentHTML: (_position, markup) => { html += markup; },
  };
  const { context, events } = harness([...checkoutFunctions, 'callAIScan', 'trackFirstUsefulResult',
    'renderPartSnapResultUpgradeOffer'], {
    SCAN_LIMIT_FREE: 3, isPartSnapPro: () => false,
    getScanUsage: () => ({ count }), recordAIScan: (_mode, usage) => { count = usage.count; },
    renderStripResult: (_ai, element) => { element.innerHTML = '<div>Complete strip readings</div>'; },
    getLanguageHeaders: () => ({}), getScanEntitlementToken: () => '',
    getPartSnapRecoveryContext: () => null, getSplashLensIdentityProfile: () => ({}),
    getFieldSaveAccount: () => ({}), getPartSnapEvidenceSummary: () => ({}),
    getScanClientId: () => uuid, withLanguageMetadata: value => value,
    FREE_PROFILE_TOKEN_KEY: 'profile', ACCOUNT_TOKEN_KEY: 'account',
    fetch: async () => ({ ok: true, json: async () => ({ result: { fc: 2 }, usage: { source: 'free_metered', count: count + 1 } }) }),
  });
  const canvas = { toDataURL: () => 'data:image/jpeg;base64,AA==' };
  await context.callAIScan(canvas, 'test_strip', result, {});
  assert.ok(html.indexOf('Complete strip readings') < html.indexOf('data-checkout-placement="test_strip_result"'));
  assert.ok(names(events).indexOf('first_value_completed') < names(events).indexOf('post_value_upgrade_shown'));
  await context.callAIScan(canvas, 'test_strip', result, {});
  assert.doesNotMatch(html, /data-checkout-placement=/);
  assert.equal(events.filter(event => event.name === 'post_value_upgrade_shown').length, 1);
});

test('paid lane checks configuration and posts the same click identity before navigation', async () => {
  let posted;
  let navigated = '';
  const { context, events } = harness([...checkoutFunctions, 'startWebCheckout', 'openSplashLensPaidLane'], {
    window: { location: { origin: 'https://app.splashlens.com', assign: value => { navigated = value; } } },
    showSplashLensNotice: () => {},
    fetch: async (_url, options) => {
      if (options?.method === 'POST') {
        posted = JSON.parse(options.body);
        return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/test' }) };
      }
      return { json: async () => ({ plans: [{ key: 'partsnap_pro_yearly', checkoutConfigured: true }] }) };
    },
  });
  await context.openSplashLensPaidLane('partsnap_pro_yearly', 'Pro');
  const click = events.find(event => event.name === 'checkout_click');
  assert.equal(click.props.placement, 'paid_lane');
  assert.equal(click.props.plan, 'yearly');
  assert.equal(posted.client_reference_id, click.props.client_reference_id);
  assert.equal(navigated, 'https://checkout.stripe.com/c/pay/test');
});

test('store paid lane does not open a purchase path while native link-out is on hold', async () => {
  let notice = '';
  const { context, events } = harness(['openSplashLensPaidLane'], {
    getStoreShellMode: () => 'ios', isStoreShellMode: () => true,
    showSplashLensNotice: message => { notice = message; },
    fetch: () => { throw new Error('store mode must not request checkout'); },
  });
  await context.openSplashLensPaidLane('partsnap_pro_monthly', 'Pro');
  assert.match(notice, /unavailable inside this store app/);
  assert.equal(events.some(event => event.name === 'checkout_click'), false);
});

test('CTA shown waits for visible viewport content and deduplicates each actual element', () => {
  const callbacks = {};
  const visible = { dataset: { checkoutPlan: 'monthly', checkoutPlacement: 'partsnap_result' }, isConnected: true,
    getClientRects: () => [{}], getBoundingClientRect: () => ({ top: 100, bottom: 150, left: 10, right: 180 }) };
  const hidden = { ...visible, getClientRects: () => [] };
  const offscreen = { ...visible, getBoundingClientRect: () => ({ top: 1000, bottom: 1050, left: 10, right: 180 }) };
  const detached = { ...visible, isConnected: false };
  const elements = [hidden, offscreen, detached];
  const document = { body: {}, visibilityState: 'visible', querySelectorAll: () => elements,
    addEventListener: (name, callback) => { callbacks[name] = callback; } };
  const { context, events } = harness([...checkoutFunctions, 'initCheckoutClientTracking'], {
    document, getComputedStyle: () => ({ visibility: 'visible' }),
    window: { innerHeight: 800, innerWidth: 400, addEventListener: (name, callback) => { callbacks[name] = callback; } },
    MutationObserver: class { constructor(callback) { callbacks.mutation = callback; } observe() {} },
    requestAnimationFrame: callback => callback(),
  });
  context.initCheckoutClientTracking();
  assert.equal(events.length, 0);
  elements.push(visible);
  callbacks.mutation();
  callbacks.scroll();
  assert.deepEqual(names(events), ['checkout_cta_shown']);
  assert.equal(events[0].props.placement, 'partsnap_result');
  assert.equal(events[0].props.source, 'app');
  assert.equal(events[0].props.client_reference_id, undefined);
  document.visibilityState = 'hidden';
  elements.push({ ...visible });
  callbacks.mutation();
  assert.equal(events.length, 1);
  document.visibilityState = 'visible';
  callbacks.visibilitychange();
  assert.equal(events.length, 2);
});

test('rendered checkout links use the central POST helper before navigation', () => {
  const callbacks = {};
  const calls = [];
  const link = { dataset: { checkoutPlan: 'yearly', checkoutPlacement: 'field_stop_saved' } };
  const document = { body: {}, visibilityState: 'visible', querySelectorAll: () => [],
    addEventListener: (name, callback) => { callbacks[name] = callback; } };
  const { context } = harness(['initCheckoutClientTracking'], {
    document, startWebCheckout: (...args) => { calls.push(args); },
    window: { addEventListener: () => {} },
    MutationObserver: class { observe() {} },
    requestAnimationFrame: callback => callback(),
  });
  context.initCheckoutClientTracking();
  let prevented = false;
  callbacks.click({ target: { closest: () => link }, preventDefault: () => { prevented = true; }, stopImmediatePropagation: () => {} });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [['yearly', 'field_stop_saved']]);
});

test('manual answers count first action and first value when opened, not when closed', () => {
  let open = false;
  const detail = { isConnected: true, innerHTML: '<p>Check the filter</p>', getClientRects: () => [{}],
    classList: { toggle: () => (open = !open) }, closest: () => ({ dataset: { code: 'E05', answerName: 'Pump fault' } }) };
  const { context, events } = harness([...valueFunctions, 'toggleCode'], {
    document: { getElementById: id => id.startsWith('det-') ? detail : { style: {} } },
  });
  context.toggleCode('pump-e05');
  context.toggleCode('pump-e05');
  context.toggleCode('pump-e05');
  assert.equal(events.filter(event => event.name === 'first_action_started').length, 1);
  assert.equal(events.filter(event => event.name === 'first_value_completed').length, 1);
  assert.equal(events.filter(event => event.name === 'code_answer_opened').length, 2);
});

test('invalid PartSnap entry does not claim first action, but accepted evidence does', () => {
  const { context, events } = harness(valueFunctions);
  context.trackFirstActionStarted('tech', 'Use real PartSnap');
  context.trackFirstActionStarted('tech', 'field60_partsnap');
  assert.equal(events.length, 0);
  context.trackFirstActionStarted('tech', 'partsnap_evidence_capture', { has_frame: true });
  context.trackFirstActionStarted('tech', 'manual_code_lookup');
  assert.deepEqual(names(events), ['first_action_started']);
  assert.equal((source.match(/trackSplashLensEvent\('first_action_started'/g) || []).length, 1);
  assert.doesNotMatch(functionSource('openLivePartSnap'), /first_action_started|trackFirstActionStarted/);
});

function cameraHarness(overrides = {}) {
  const paragraphs = [{ textContent: '' }, { textContent: '' }];
  const elements = Object.fromEntries(['scan-video', 'scan-no-camera', 'scan-viewfinder-wrap', 'scan-camera-controls', 'scan-camera-status', 'scan-photo-upload'].map(id => [id, {
    style: {}, querySelectorAll: () => paragraphs,
    scrollIntoView(options) { this.scrollOptions = options; },
    parentElement: { prepend(element) { element.movedToTop = true; } },
    removeAttribute(name) { this.removed = name; },
  }]));
  const { context, events } = harness(['startCamera', 'revealNoCameraFallback', 'retryCameraAccess', 'trackPartSnapResultFailure'], {
    _scanMode: 'parts', _scanStream: null, _flashTrack: null, S: { tab: 'scan' },
    document: { getElementById: id => elements[id] },
    setTimeout: callback => callback(),
    requestAnimationFrame: callback => callback(),
    openSplashLensSheet: async () => ({}),
    navigator: { mediaDevices: { getUserMedia: async () => { throw Object.assign(Error('denied'), { name: 'NotAllowedError' }); } } },
    ...overrides,
  });
  vm.runInContext('let partSnapCameraExplained = false; let cameraRequestPending = false; let cameraRequestGeneration = 0;', context);
  return { context, events, elements, paragraphs };
}

test('PartSnap requests permission only after explanation consent', async () => {
  let respond;
  let requests = 0;
  const { context, events } = cameraHarness({
    openSplashLensSheet: config => {
      assert.match(config.body, /sent for AI analysis/);
      assert.match(config.body, /Camera access is optional/);
      return new Promise(resolve => { respond = resolve; });
    },
    navigator: { mediaDevices: { getUserMedia: async () => { requests++; return { getVideoTracks: () => [], getTracks: () => [] }; } } },
  });
  const pending = context.startCamera();
  assert.equal(requests, 0);
  respond({});
  await pending;
  assert.equal(requests, 1);
  assert.deepEqual(names(events), ['partsnap_camera_explanation_shown', 'partsnap_camera_requested', 'scanner_camera_ready', 'partsnap_camera_granted']);
  assert.equal(events.some(event => /first_action|first_value/.test(event.name)), false);
});

test('denial provides photo/manual recovery, records failure, and never records value or first action', async () => {
  const { context, events, elements, paragraphs } = cameraHarness();
  await context.startCamera();
  assert.deepEqual(names(events), ['partsnap_camera_explanation_shown', 'partsnap_camera_requested', 'scanner_camera_denied', 'partsnap_result_fail', 'partsnap_camera_denied']);
  assert.equal(events.find(event => event.name === 'partsnap_result_fail').props.reason, 'camera_denied');
  assert.match(paragraphs[0].textContent, /denied/);
  assert.match(paragraphs[1].textContent, /existing photo/);
  assert.match(paragraphs[1].textContent, /Code Lookup/);
  assert.equal(elements['scan-no-camera'].style.display, 'block');
  assert.equal(elements['scan-no-camera'].movedToTop, true);
  assert.equal(elements['scan-no-camera'].scrollOptions.block, 'start');
  assert.equal(elements['scan-no-camera'].scrollOptions.behavior, 'auto');
  assert.equal(elements['scan-photo-upload'].removed, 'capture');
  assert.equal(elements['scan-camera-controls'].style.display, 'none');
});

test('skipping camera does not invoke permission or claim activation', async () => {
  let requests = 0;
  const { context, events, elements } = cameraHarness({
    openSplashLensSheet: async () => null,
    navigator: { mediaDevices: { getUserMedia: async () => { requests++; } } },
  });
  await context.startCamera();
  assert.equal(requests, 0);
  assert.equal(elements['scan-no-camera'].style.display, 'block');
  assert.deepEqual(names(events), ['partsnap_camera_explanation_shown', 'partsnap_camera_explanation_dismissed']);
});

test('unsupported camera still exposes existing upload/manual fallback', async () => {
  const { context, events, elements } = cameraHarness({ navigator: {} });
  await context.startCamera();
  assert.deepEqual(names(events), ['scanner_camera_unavailable', 'partsnap_result_fail', 'partsnap_camera_denied']);
  assert.equal(elements['scan-no-camera'].style.display, 'block');
});

test('late permission result stops its stream after leaving the camera workflow', async () => {
  let resolve;
  let requested;
  const requestStarted = new Promise(done => { requested = done; });
  let stopped = 0;
  const { context, events } = cameraHarness({
    navigator: { mediaDevices: { getUserMedia: () => new Promise(done => { resolve = done; requested(); }) } },
  });
  const pending = context.startCamera();
  await requestStarted;
  context._scanMode = 'lookup';
  resolve({ getTracks: () => [{ stop: () => stopped++ }] });
  await pending;
  assert.equal(stopped, 1);
  assert.equal(names(events).includes('scanner_camera_ready'), false);
});

function resultHarness(guidedRetry = false) {
  const renderers = [...functionSource('renderPartsSnapResult').matchAll(/\b(render\w+)\(/g)]
    .map(match => match[1]).filter(name => name !== 'renderPartsSnapResult');
  return harness(['renderPartsSnapResult', 'trackPartSnapResultFailure', 'knownPartSnapComponent', 'trackFirstUsefulResult'], {
    ...Object.fromEntries(renderers.map(name => [name, () => ''])),
    partConfidenceLadder: () => ({ missing: [] }),
    partSnapCallbackRisk: () => ({ level: 'low', label: 'Low risk' }),
    getPartSnapOrderGate: () => ({ verificationReady: false, reasons: ['manufacturer verification'] }),
    shouldShowPartSnapGuidedRetry: () => guidedRetry,
    getPartSnapRecoveryContext: () => null,
    savePartSnapRecoveryContext: () => ({ attempts: 1 }),
    compactPartSnapList: value => value.join('|'),
    getScanUsage: () => ({ count: 1 }),
    SCAN_LIMIT_FREE: 3,
    _lastPartSnapResult: {},
  });
}

test('useful PartSnap success retains legacy result and counts value after rendering', () => {
  const { context, events } = resultHarness();
  const result = { isConnected: true, innerHTML: '', getClientRects: () => [{}], insertAdjacentHTML: () => {} };
  context.renderPartsSnapResult({ component: 'Pump lid', confidence: 'medium' }, result, {});
  assert.match(result.innerHTML, /Pump lid/);
  assert.equal(events.find(event => event.name === 'partsnap_result').props.useful_result, true);
  assert.equal(names(events).includes('partsnap_result_success'), true);
  assert.equal(names(events).includes('first_value_completed'), true);
  assert.equal(names(events).includes('partsnap_result_fail'), false);
});

test('low-confidence, unknown, empty, and guided-retry PartSnap results fail without first value', () => {
  for (const [ai, guided] of [
    [{ component: 'Pump lid', confidence: 'low' }, false],
    [{ component: 'Unknown part', confidence: 'medium' }, false],
    [{}, false],
    [{ component: 'Pump lid', confidence: 'medium' }, true],
  ]) {
    const { context, events } = resultHarness(guided);
    const result = { isConnected: true, innerHTML: '', getClientRects: () => [{}] };
    context.renderPartsSnapResult(ai, result, {});
    assert.equal(events.find(event => event.name === 'partsnap_result').props.useful_result, false);
    assert.equal(names(events).includes('partsnap_result_fail'), true);
    assert.equal(names(events).includes('partsnap_result_success'), false);
    assert.equal(names(events).includes('first_value_completed'), false);
  }
});

test('failed PartSnap requests record failure and retain a working manual/retry path', async () => {
  const { context, events } = harness(['callAIScan', 'trackPartSnapResultFailure'], {
    getLanguageHeaders: () => ({}), getScanEntitlementToken: () => '',
    getPartSnapRecoveryContext: () => null, getSplashLensIdentityProfile: () => ({}),
    getFieldSaveAccount: () => ({}), getPartSnapEvidenceSummary: () => ({ complete: true }),
    getScanClientId: () => uuid, withLanguageMetadata: value => value,
    FREE_PROFILE_TOKEN_KEY: 'profile', ACCOUNT_TOKEN_KEY: 'account',
    fetch: async () => { throw new TypeError('offline'); },
  });
  const result = { innerHTML: '' };
  await context.callAIScan({ toDataURL: () => 'data:image/jpeg;base64,AA==' }, 'parts_snap', result, {});
  assert.deepEqual(names(events), ['ai_scan_attempted', 'ai_scan_failed', 'partsnap_result_fail']);
  assert.match(result.innerHTML, /captureAndAnalyze\(\)/);
  assert.match(result.innerHTML, /setScanMode\('lookup'\)/);
});
