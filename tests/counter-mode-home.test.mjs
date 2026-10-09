import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const errors = readFileSync(new URL('../js/errors.js', import.meta.url), 'utf8');

function section(start, end) {
  return app.slice(app.indexOf(`function ${start}(`), app.indexOf(`function ${end}(`));
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] || null,
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('Counter home has three full-width field actions and a one-tap nav entry', () => {
  assert.match(shell, /id="tab-counter"/);
  assert.match(shell, /\.counter-action \{[^}]*width:100%; min-height:72px;/);
  assert.match(shell, /id="nav-counter" onclick="showTab\('counter'\)"/);
  assert.ok(shell.indexOf('id="nav-counter"') < shell.indexOf('id="nav-errors"'));
  assert.ok(shell.indexOf('id="nav-errors"') < shell.indexOf('id="nav-scan"'));
  assert.ok(shell.indexOf('id="nav-scan"') < shell.indexOf('id="nav-dosing"'));
  assert.match(shell, /field tools"\] \{ overflow-x:auto; overflow-y:hidden;/);
  assert.match(shell, /\.nav-btn \{ flex:0 0 66px; min-width:66px; \}/);
  assert.match(shell, /\.nav-btn span \{ font-size:10px; white-space:nowrap; \}/);
  assert.match(shell, /#nav-counter \{ position:sticky; left:0;/);
  for (const button of ['code', 'part', 'chem']) {
    assert.match(shell, new RegExp(`onclick="openCounterTool\\('${button}'\\)"`));
  }
});

test('new users start at Counter, returning users restore their last tab, deep links win', () => {
  const localStorage = storage();
  const shown = [];
  const context = {
    localStorage,
    window: { location: { search: '' } },
    URLSearchParams,
    getFacilityDeepLinkParts: () => null,
    showTab: (tab) => shown.push(tab),
  };
  vm.runInNewContext("const COUNTER_SEEN_KEY = 'splashlens-counter-home-seen-v1'; const FIELD_TABS = new Set(['counter', 'errors', 'dosing', 'scan']); let counterFirstOpen = false;" + section('getCounterStartState', 'showTab'), context);
  context.initCounterModeHome(context.getCounterStartState());
  assert.deepEqual(shown, ['counter']);
  shown.length = 0;
  context.localStorage = storage({ 'poolens-pools': '[]', 'splashlens-last-field-tab': 'dosing' });
  context.initCounterModeHome(context.getCounterStartState());
  assert.deepEqual(shown, ['dosing']);
  shown.length = 0;
  context.window.location.search = '?tab=scan';
  context.initCounterModeHome(context.getCounterStartState());
  assert.deepEqual(shown, []);
  assert.equal(context.getCounterStartState().firstOpen, false);

  const existing = { ...context, localStorage: storage({ 'poolens-pools': '[]' }), window: { location: { search: '' } } };
  vm.runInNewContext("const COUNTER_SEEN_KEY = 'splashlens-counter-home-seen-v1'; const FIELD_TABS = new Set(['counter', 'errors', 'dosing', 'scan']); let counterFirstOpen = false;" + section('getCounterStartState', 'showTab'), existing);
  assert.equal(existing.getCounterStartState().firstOpen, false);
});

test('Counter buttons route to local code, PartSnap, and dosing with events', () => {
  const events = [];
  const shown = [];
  const input = { focused: false, focus() { this.focused = true; }, scrollIntoView() {} };
  const context = {
    document: { getElementById: () => input },
    showTab: (tab) => shown.push(tab),
    setScanMode: (mode) => shown.push(mode),
    trackSplashLensEvent: (name, props) => events.push([name, props.button]),
  };
  vm.runInNewContext(section('openCounterTool', 'showTab'), context);
  for (const button of ['code', 'part', 'chem']) context.openCounterTool(button);
  assert.deepEqual(shown, ['errors', 'scan', 'parts', 'dosing']);
  assert.equal(input.focused, true);
  assert.deepEqual(events, [['counter_button_tapped', 'code'], ['counter_button_tapped', 'part'], ['counter_button_tapped', 'chem']]);
});

test('Counter open event marks only the first visit as first_open', () => {
  const events = [];
  const panels = [{ classList: { add() {}, remove() {} } }];
  const context = {
    S: { tab: 'errors' },
    PRODUCT_INTELLIGENCE: { startedAt: 0 },
    localStorage: storage(),
    document: {
      querySelectorAll: () => panels,
      getElementById: (id) => id === 'tab-counter' ? panels[0] : null,
    },
    window: { scrollTo() {} },
    trackProductTabChange: () => {},
    trackSplashLensEvent: (name, props) => events.push([name, props.first_open]),
  };
  vm.runInNewContext('let counterFirstOpen = true; const COUNTER_SEEN_KEY = "splashlens-counter-home-seen-v1"; const FIELD_TABS = new Set(["counter"]);' + section('showTab', 'initMarketingGate'), context);
  context.showTab('counter');
  context.showTab('counter');
  assert.deepEqual(events, [['counter_mode_opened', true], ['counter_mode_opened', false]]);
  assert.equal(context.localStorage.getItem('splashlens-counter-home-seen-v1'), '1');
});

test('showTab persists real tab transitions and ignores invalid tabs or blocked storage', () => {
  const localStorage = storage();
  const panel = { classList: { add() {}, remove() {} } };
  const context = {
    S: { tab: 'errors' },
    localStorage,
    document: {
      querySelectorAll: () => [panel],
      getElementById: (id) => ['tab-counter', 'tab-errors', 'nav-counter', 'nav-errors'].includes(id) ? panel : null,
    },
    window: { scrollTo() {}, location: { search: '' } },
    URLSearchParams,
    getFacilityDeepLinkParts: () => null,
    trackProductTabChange: () => {},
    trackSplashLensEvent: () => {},
    renderCodePoolSelector: () => {},
  };
  vm.runInNewContext('const COUNTER_SEEN_KEY = "splashlens-counter-home-seen-v1"; const FIELD_TABS = new Set(["counter", "errors"]); let counterFirstOpen = true;' + section('getCounterStartState', 'showTab') + section('showTab', 'initMarketingGate'), context);
  context.showTab('counter');
  assert.equal(localStorage.getItem('splashlens-last-field-tab'), 'counter');
  context.showTab('errors');
  assert.equal(localStorage.getItem('splashlens-last-field-tab'), 'errors');
  assert.ok(Number.isFinite(Date.parse(localStorage.getItem('splashlens-last-field-tab-at'))));
  assert.equal(context.getCounterStartState().lastTab, 'errors');
  context.showTab('missing');
  assert.equal(localStorage.getItem('splashlens-last-field-tab'), 'errors');
  context.localStorage = { setItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => context.showTab('counter'));
});

test('bundled code answer renders offline without fetching', () => {
  let fetches = 0;
  const elements = {
    'search-clear': { style: {} },
    'error-results': { innerHTML: '' },
  };
  const context = {
    window: {},
    S: { brand: null, category: null },
    document: { getElementById: (id) => elements[id] },
    fetch: () => { fetches++; throw new Error('network unavailable'); },
    trackSplashLensEvent: () => {},
    getSplashLensRole: () => 'tech',
    escHtml: (value) => String(value),
    codeCard: (code) => `<div class="error-card">${code.code}: ${code.name}</div>`,
  };
  vm.runInNewContext(errors, context);
  vm.runInNewContext(section('searchErrorDB', 'renderScanHits'), context);
  vm.runInNewContext(section('onErrorSearch', 'clearSearch'), context);
  context.onErrorSearch('E05');
  assert.match(elements['error-results'].innerHTML, /error-card/);
  assert.equal(fetches, 0);
});
