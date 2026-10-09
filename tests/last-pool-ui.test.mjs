import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { i18nText } from '../js/i18n.js';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function section(start, end) {
  const from = app.indexOf(start);
  const to = app.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Missing section ${start}`);
  return app.slice(from, to);
}

function harness(initialPools = []) {
  const values = new Map([['poolens-pools', JSON.stringify(initialPools)]]);
  const events = [];
  const elements = {
    'code-pool-select': { innerHTML: '', value: '' },
    'last-pool-counter-card': { innerHTML: '', classList: { active: false, toggle(name, enabled) { if (name === 'has-pool') this.active = enabled; } } },
  };
  const tabs = [];
  const roles = [];
  const context = {
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    document: { getElementById: id => elements[id] || null },
    trackSplashLensEvent: (name, props) => events.push({ name, props }),
    escHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
    escAttr: value => String(value).replaceAll('"', '&quot;'),
    showSplashLensNotice: () => {},
    a3Text: key => i18nText('en', key),
    revealSplashLensApp: () => {},
    renderPoolDetail: id => tabs.push(`detail:${id}`),
    showTab: tab => tabs.push(tab),
    setSplashLensRole: (role, options) => roles.push({ role, options }),
  };
  vm.runInNewContext(section("const POOLS_KEY = 'poolens-pools';", '// ─── POOL LIST VIEW'), context);
  return { context, values, events, elements, tabs, roles };
}

test('completed stop writes Last pool only after proof-ready save to an attached pool', () => {
  const h = harness([{ id: 'pool-1', name: 'Maple', servicePassports: [], history: [] }]);
  Object.assign(h.context, {
    ensureFieldSaveAccount: () => true,
    validateReportProof: () => ({ complete: false, missing: ['water'] }),
    findPoolForReport: () => h.context.getPools()[0],
    buildServicePassport: () => ({ id: 'proof-1', date: '2026-10-09', proof: { complete: true } }),
    currentProofPassportUrl: () => '',
    saveSplashLensCommercialProof: () => Promise.resolve({ ok: false }),
    window: { SplashLensFieldSignals: { offerSystemNotificationsAfterValue() {} } },
  });
  vm.runInNewContext(section('function saveReportToPoolHistory()', 'function copyReport()'), h.context);
  h.context.saveReportToPoolHistory();
  assert.equal(h.values.has('splashlens-last-pool-v1'), false);

  h.context.validateReportProof = () => ({ complete: true, missing: [] });
  h.context.saveReportToPoolHistory();
  const pointer = JSON.parse(h.values.get('splashlens-last-pool-v1'));
  assert.equal(pointer.poolId, 'pool-1');
  assert.equal(pointer.source, 'completed_stop');
  assert.equal(h.context.getPools()[0].servicePassports.length, 1);
  assert.match(h.elements['last-pool-counter-card'].innerHTML, /Last visit: 10\/9\/2026|Last visit: 9\/10\/2026/);
  assert.match(h.elements['last-pool-counter-card'].innerHTML, /Last proof: Proof ready/);
});

test('code answer updates Last pool only when a saved pool is attached', () => {
  const h = harness([{ id: 'pool-2', name: '<Private>', servicePassports: [] }]);
  h.context.renderCodePoolSelector();
  assert.match(h.elements['code-pool-select'].innerHTML, /&lt;Private&gt;/);
  const detail = { classList: { toggle: () => true }, closest: () => ({ dataset: { code: 'E1', answerName: 'Flow' }, textContent: 'Flow answer' }) };
  h.context.document.getElementById = id => id === 'det-code' ? detail : id === 'chev-code' ? { style: {} } : h.elements[id] || null;
  Object.assign(h.context, {
    trackFirstActionStarted() {},
    getSplashLensRole: () => 'tech',
    trackFirstUsefulResult() {},
    window: { SplashLensFieldSignals: { onCodeOpened() {} } },
  });
  vm.runInNewContext(section('function toggleCode(uid)', 'function onErrorSearch(q)'), h.context);
  h.context.toggleCode('code');
  assert.equal(h.values.has('splashlens-last-pool-v1'), false);
  h.context.setCodeLookupPool('pool-2');
  h.context.toggleCode('code');
  assert.equal(JSON.parse(h.values.get('splashlens-last-pool-v1')).source, 'code_lookup');
  assert.doesNotMatch(h.elements['last-pool-counter-card'].innerHTML, /<Private>/);
});

test('deep link opens local pool or routes to Counter without customer data in the URL', () => {
  const h = harness([{ id: 'pool-3', name: 'Private Pool', servicePassports: [] }]);
  h.context.saveLastPoolPointer('pool-3', 'completed_stop');
  Object.assign(h.context, { URLSearchParams, window: { location: { search: '?open=last_pool&utm_source=truck_qr' } } });
  vm.runInNewContext(section('function initDeepLink()', 'function getFacilityDeepLinkParts()'), h.context);
  h.context.initDeepLink();
  assert.deepEqual(h.tabs.slice(-2), ['detail:pool-3', 'pools']);
  assert.equal(h.events.find(event => event.name === 'last_pool_opened').props.source, 'truck_qr');

  h.context.openLastPool('card');
  assert.equal(h.events.filter(event => event.name === 'last_pool_opened').at(-1).props.source, 'card');

  h.context.savePools([]);
  h.context.initDeepLink();
  assert.equal(h.tabs.at(-1), 'counter');
  assert.equal(h.events.filter(event => event.name === 'last_pool_opened').length, 2);
  assert.doesNotMatch('https://app.splashlens.com/?open=last_pool&utm_source=truck_qr', /Private Pool|pool-3/);
});

test('Counter card exposes QR actions and does not change script or cache versions', () => {
  assert.match(html, /id="last-pool-counter-card"/);
  assert.match(html, /id="tab-counter"[\s\S]*id="last-pool-counter-card"[\s\S]*id="tab-errors"/);
  assert.match(html, /id="code-pool-select" onchange="setCodeLookupPool\(this.value\)"/);
  assert.match(html, /\.last-pool-card\.has-pool \{ display:block; \}/);
  for (const action of ['createTruckQr', 'printTruckQrSticker', 'downloadTruckQrSticker']) {
    assert.match(app, new RegExp(`function ${action}\\(`));
  }
  assert.equal((app.match(/trackSplashLensEvent\('truck_qr_created'/g) || []).length, 3);
  assert.doesNotMatch(app, /trackSplashLensEvent\('(last_pool_saved|last_pool_fallback|truck_qr_opened|truck_qr_printed|truck_qr_downloaded)'/);
  assert.match(app, /import\('\.\/truck-qr\.js\?v=20261009-restart-a5'\)/);
  assert.match(html, /<script src="\/js\/app\.js\?v=20261009-restart-a8"><\/script>/);
});

test('Last pool card stays hidden until a valid local pool pointer exists', () => {
  const h = harness();
  h.context.renderLastPoolCounterCard();
  assert.equal(h.elements['last-pool-counter-card'].classList.active, false);
  assert.equal(h.elements['last-pool-counter-card'].innerHTML, '');
  h.context.savePools([{ id: 'pool-4', name: 'Maple', servicePassports: [] }]);
  h.context.saveLastPoolPointer('pool-4', 'completed_stop');
  assert.equal(h.elements['last-pool-counter-card'].classList.active, true);
});

test('last-pool deep link is not overwritten by a previously saved tab', () => {
  const tabs = [];
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { search: '?open=last_pool&utm_source=truck_qr' } },
    getFacilityDeepLinkParts: () => null,
    showTab: tab => tabs.push(tab),
  });
  vm.runInContext("let counterFirstOpen = false;" + section('function initCounterModeHome(', 'function openCounterTool('), context);
  context.initCounterModeHome({ firstOpen: false, lastTab: 'errors' });
  assert.deepEqual(tabs, []);
});
