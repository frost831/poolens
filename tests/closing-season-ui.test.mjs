import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const closingCode = app.slice(app.indexOf('const CLOSING_PHOTO_PROOFS = ['), app.indexOf('function renderChecklist()'));

function harness({ storeShell = false, plans = [] } = {}) {
  const events = [];
  const shared = [];
  const checkoutCalls = [];
  const storage = new Map();
  const elements = new Map([['closing-proof-content', { hidden: true, innerHTML: '' }], ['closing-pass-offer', { innerHTML: '' }]]);
  const state = { clType: 'closing', checklists: { closing: {} } };
  const context = vm.createContext({
    S: state,
    CL_MAP: { closing: { data: () => [{ steps: ['First', 'Second'] }], key: 'closing-test', label: 'Closing', freq: 'Season Progress' } },
    document: { getElementById: id => elements.get(id) || null },
    localStorage: { setItem: (key, value) => storage.set(key, value) },
    escAttr: value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'),
    escHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    isStoreShellMode: () => storeShell,
    fetch: async () => ({ ok: true, json: async () => ({ plans }) }),
    trackSplashLensEvent: (name, props) => events.push({ name, props }),
    shareFieldPacket: async packet => { shared.push(packet); return { channel: 'share_sheet' }; },
    renderChecklist: () => {},
    setEl: () => {},
    a3Text: () => 'Closing checklist',
    updateProgress: () => {},
    startWebCheckout: (...args) => checkoutCalls.push(args),
  });
  vm.runInContext(closingCode, context);
  return { context, state, events, shared, elements, storage, checkoutCalls };
}

async function finishChecklist(h) {
  h.context.trackClosingChecklistStart();
  h.context.setClosingPhotoReference('cover', 'cover.jpg');
  h.context.setClosingPhotoReference('plugs', 'plugs.jpg');
  h.context.setClosingPhotoReference('equipment', 'drained.jpg');
  h.context.setClosingPhotoReference('chemistry', 'chemistry.jpg');
  h.state.checklists.closing['0-0'] = true;
  h.context.closingChecklistChanged(false);
  h.state.checklists.closing['0-1'] = true;
  h.context.closingChecklistChanged(false);
  await h.context.textClosingProofPacket();
}

test('site closing links land in closing checklist even without tab and with a competing tab', () => {
  const initDeepLink = app.slice(app.indexOf('function initDeepLink()'), app.indexOf('function getFacilityDeepLinkParts()'));
  for (const query of ['?workflow=closing', '?checklist=closing', '?tab=report&workflow=closing', '?tab=guide&checklist=closing', '?challenge=field60&challenge_path=closing']) {
    const tabs = [];
    const types = [];
    const context = vm.createContext({
      window: { location: { search: query } },
      URLSearchParams,
      cleanAttributionValue: value => value,
      getFacilityDeepLinkParts: () => null,
      showTab: tab => tabs.push(tab),
      switchClType: type => types.push(type),
      setFieldChallengeContext: () => {},
      trackSplashLensEvent: () => {},
      startFieldChallenge: () => { tabs.push('guide'); types.push('closing'); },
      setTimeout: callback => callback(),
    });
    vm.runInContext(`${initDeepLink}; initDeepLink()`, context);
    assert.deepEqual(tabs, ['guide'], query);
    assert.deepEqual(types, ['closing'], query);
  }
});

test('field60 closing route opens the checklist rather than the report intro', () => {
  const challenge = app.slice(app.indexOf('function startFieldChallenge('), app.indexOf('function initDeepLink()'));
  const entered = [];
  const types = [];
  const context = vm.createContext({
    cleanAttributionValue: value => value,
    setFieldChallengeContext: () => ({}),
    trackSplashLensEvent: () => {},
    trackFirstActionStarted: () => {},
    getSplashLensRole: () => 'tech',
    enterSplashLensApp: tab => entered.push(tab),
    switchClType: type => types.push(type),
    setTimeout: callback => callback(),
  });
  vm.runInContext(`${challenge}; startFieldChallenge('closing')`, context);
  assert.deepEqual(entered, ['guide']);
  assert.deepEqual(types, ['closing']);
});

test('closing requires all steps and four photo references before text packet', async () => {
  const h = harness();
  assert.match(html, /id="closing-proof-content" hidden/);
  h.context.renderClosingProof();
  assert.doesNotMatch(h.elements.get('closing-proof-content').innerHTML, /Text closing proof packet/);
  await h.context.textClosingProofPacket();
  assert.equal(h.shared.length, 0);
  await finishChecklist(h);
  assert.equal(h.shared.length, 1);
  assert.equal(h.shared[0].surface, 'closing_checklist');
  assert.match(h.shared[0].evidence, /Cover installed: cover.jpg/);
  assert.match(h.shared[0].evidence, /Closing chemistry record: chemistry.jpg/);
  assert.equal(h.events.filter(event => event.name === 'closing_checklist_started').length, 1);
  const completed = h.events.filter(event => event.name === 'closing_checklist_completed');
  assert.equal(completed.length, 1);
  assert.equal(completed[0].props.steps, 2);
  assert.equal(completed[0].props.photos, 4);
  assert.match(h.storage.get('closing-test'), /chemistry.jpg/);
});

test('unchecking a completed step removes sharing and rechecking completes again', async () => {
  const h = harness();
  await finishChecklist(h);
  vm.runInContext(`
    const cl = S.checklists.closing;
    const wasComplete = closingChecklistStatus().complete;
    cl['0-1'] = false;
    closingChecklistChanged(wasComplete);
  `, h.context);
  assert.doesNotMatch(h.elements.get('closing-proof-content').innerHTML, /Text closing proof packet/);
  await h.context.textClosingProofPacket();
  assert.equal(h.shared.length, 1);
  h.state.checklists.closing['0-1'] = true;
  h.context.closingChecklistChanged(false);
  assert.equal(h.events.filter(event => event.name === 'closing_checklist_completed').length, 2);
});

test('pass price and checkout appear only for configured catalog on web after completion', async () => {
  const configured = { key: 'closing_pass_60d', checkoutPlan: 'closing_pass_60d', amountCents: 3900, priceLabel: '$39 / 60 days', checkoutConfigured: true };
  for (const [storeShell, plans, shown] of [
    [false, [], false],
    [false, [{ ...configured, checkoutConfigured: false }], false],
    [false, [{ ...configured, amountCents: undefined }], false],
    [true, [configured], false],
    [false, [configured], true],
  ]) {
    const h = harness({ storeShell, plans });
    await finishChecklist(h);
    await h.context.loadClosingPassOffer();
    const offer = h.elements.get('closing-pass-offer').innerHTML;
    assert.equal(offer.includes('$39 / 60 days'), shown);
    assert.equal(offer.includes('startWebCheckout'), shown);
    assert.equal(h.events.filter(event => event.name === 'closing_pass_offer_shown').length, Number(shown));
  }
  assert.match(app, /data-checkout-plan="closing_pass_60d" data-checkout-placement="closing_checklist"/);
  assert.match(app, /startWebCheckout\('closing_pass_60d','closing_checklist'\)/);
  assert.match(app, /plan: plan === 'closing_pass_60d' \? 'closing_pass_60d'/);
  assert.match(app, /trackSplashLensEvent\('checkout_click', props\)/);
});

test('A1 checkout attribution and URL preserve the closing pass plan', () => {
  const emitted = [];
  const attribution = app.slice(app.indexOf('function getCheckoutAttribution('), app.indexOf('function initCheckoutClientTracking()'));
  const intent = app.slice(app.indexOf('function trackCheckoutIntent('), app.indexOf('let checkoutPending = false;'));
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { origin: 'https://app.splashlens.com' } },
    isStoreShellMode: () => false,
    getStoreShellMode: () => 'web',
    getScanClientId: () => 'client-test',
    getAnalyticsSessionId: () => 'session-test',
    createCheckoutUUID: () => '5d46a1e0-a882-4c96-9c93-6558d2e34149',
    trackSplashLensEvent: (name, props) => emitted.push([name, props]),
  });
  vm.runInContext(`${attribution}\n${intent}`, context);
  const props = context.getCheckoutAttribution('closing_pass_60d', 'closing_checklist');
  assert.equal(props.plan, 'closing_pass_60d');
  assert.equal(props.feature, 'closing_pass');
  const url = context.trackCheckoutIntent('closing_pass_60d', 'closing_checklist');
  assert.equal(new URL(url, 'https://app.splashlens.com').searchParams.get('plan'), 'closing_pass_60d');
  assert.equal(emitted[0][0], 'checkout_click');
  assert.equal(emitted[0][1].plan, 'closing_pass_60d');
});
