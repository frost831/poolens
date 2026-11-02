import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { i18nText } from '../js/i18n.js';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const closingCode = app.slice(app.indexOf('const CLOSING_PHOTO_PROOFS = ['), app.indexOf('function renderChecklist()'));
const checklistCode = app.slice(app.indexOf('function renderChecklist()'), app.indexOf('async function resetChecklist()'));

function harness({ storeShell = false, plans = [], shortFlag = false, realChecklist = false, clientId = 'scan-test-client' } = {}) {
  const events = [];
  const shared = [];
  const checkoutCalls = [];
  const storage = new Map();
  const elements = new Map([['closing-proof-content', { hidden: true, innerHTML: '' }], ['closing-pass-offer', { innerHTML: '' }], ['checklist-content', { innerHTML: '' }], ['progress-text', { textContent: '', style: {} }]]);
  const state = { clType: 'closing', checklists: { closing: {}, closingShort: {} } };
  const context = vm.createContext({
    S: state,
    CL_MAP: { closing: { data: () => [{ steps: ['First', 'Second'] }], key: 'closing-test', label: 'Closing', freq: 'Season Progress' } },
    document: { getElementById: id => elements.get(id) || null },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    getScanClientId: () => clientId,
    escAttr: value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'),
    escHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    isStoreShellMode: () => storeShell,
    fetch: async () => ({ ok: true, json: async () => ({ plans }) }),
    trackSplashLensEvent: (name, props) => events.push({ name, props }),
    shareFieldPacket: async packet => { shared.push(packet); return { channel: 'share_sheet' }; },
    renderChecklist: () => {},
    setEl: (id, value) => { if (elements.has(id)) elements.get(id).innerHTML = value; },
    a3ClosingText: value => value,
    a3Text: key => ({
      'closing.coverInstalled': 'Cover installed',
      'closing.winterPlugs': 'Winter and drain plugs',
      'closing.equipment': 'Equipment drained',
      'closing.chemistryRecord': 'Closing chemistry record',
      'closing.shortNotice': i18nText('en', 'closing.shortNotice'),
      'closing.openFullChecklist': i18nText('en', 'closing.openFullChecklist'),
    })[key] || key,
    updateProgress: () => {},
    startWebCheckout: (...args) => checkoutCalls.push(args),
  });
  vm.runInContext(shortFlag ? closingCode.replace('enabled: false, rolloutPercent: 50', `enabled: true, rolloutPercent: ${shortFlag === 'ab' ? 50 : 100}`) : closingCode, context);
  if (realChecklist) vm.runInContext(checklistCode, context);
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

test('closing checklist links land in the guide while field60 remains a checklist challenge', () => {
  const initDeepLink = app.slice(app.indexOf('function initDeepLink()'), app.indexOf('function getFacilityDeepLinkParts()'));
  for (const query of ['?workflow=closing', '?checklist=closing', '?tab=guide&checklist=closing', '?challenge=field60&challenge_path=closing']) {
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

test('step events identify the full-flow drop position without sending user-entered proof', () => {
  const h = harness({ realChecklist: true });
  h.context.switchClType('closing');
  h.context.toggleItem(0, 0);
  h.context.toggleItem(0, 1);
  h.context.toggleItem(0, 1);
  const steps = h.events.filter(event => event.name === 'closing_checklist_step_changed');
  assert.deepEqual(steps.map(event => event.props.step_index), [1, 2, 2]);
  assert.deepEqual(steps.map(event => event.props.checked), [true, true, false]);
  assert.equal(steps[0].props.step_name, 'First');
  assert.equal(steps[0].props.variant, 'full');
  assert.equal(steps[0].props.assignment, 'full');
  assert.equal(Object.values(steps[0].props).some(value => String(value).includes('cover.jpg')), false);
  assert.equal(h.events.find(event => event.name === 'closing_checklist_started').props.variant, 'full');
});

test('flag-off keeps the full flow; flagged short flow has separate state and cannot unlock proof', async () => {
  const off = harness({ realChecklist: true });
  off.context.switchClType('closing');
  assert.doesNotMatch(off.elements.get('checklist-content').innerHTML, /Quick closing guide/);

  const h = harness({ shortFlag: true, realChecklist: true });
  h.context.switchClType('closing');
  assert.match(h.elements.get('checklist-content').innerHTML, /Quick closing guide/);
  assert.equal(h.elements.get('closing-proof-content').hidden, true);
  for (let phase = 0; phase < 6; phase++) h.context.toggleItem(phase, 0);
  assert.equal(h.events.filter(event => event.name === 'closing_checklist_short_completed').length, 1);
  assert.equal(h.events.filter(event => event.name === 'closing_checklist_completed').length, 0);
  assert.equal(h.storage.has('closing-test'), false);
  assert.equal(h.storage.has('poolens-cl-closing-short-v1'), true);
  await h.context.textClosingProofPacket();
  assert.equal(h.shared.length, 0);
  h.context.showFullClosingChecklist();
  assert.doesNotMatch(h.elements.get('checklist-content').innerHTML, /Quick closing guide/);
  assert.equal(h.elements.get('closing-proof-content').hidden, false);
  assert.equal(h.state.checklists.closing['0-0'], undefined);
  h.context.toggleItem(0, 0);
  const starts = h.events.filter(event => event.name === 'closing_checklist_started');
  assert.deepEqual(starts.map(event => event.props.variant), ['short', 'full']);
  assert.deepEqual(starts.map(event => event.props.assignment), ['short', 'short']);
  const fullStep = h.events.find(event => event.name === 'closing_checklist_step_changed' && event.props.variant === 'full');
  assert.equal(fullStep.props.assignment, 'short');
  assert.match(i18nText('es', 'closing.shortNotice'), /no acredita la preparación invernal/);
});

test('enabled A/B assignment is stable and splits client IDs between variants', () => {
  const assignments = new Set();
  for (let i = 0; i < 30; i++) {
    const h = harness({ shortFlag: 'ab', clientId: `scan-client-${i}` });
    const first = h.context.closingChecklistAssignment();
    assert.equal(h.context.closingChecklistAssignment(), first);
    assignments.add(first);
  }
  assert.deepEqual([...assignments].sort(), ['full', 'short']);
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
  assert.doesNotMatch(h.elements.get('closing-proof-content').innerHTML, /onclick="textClosingProofPacket\(\)"/);
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
  assert.match(app, /upgrade\.closingPassBody/);
  assert.match(app, /item\.renews === true/);
  assert.match(app, /data-closing-pass-placement="closing_workflow"/);
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
