import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

function fn(name) {
  const match = source.match(new RegExp(`^function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `${name} exists`);
  return match[0];
}

function harness(extra = {}) {
  const posted = [];
  const events = [];
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { search: '?utm_source=qa' } },
    navigator: { webdriver: false },
    fetch: (_url, options) => { posted.push(JSON.parse(options.body)); return Promise.resolve({ ok: true }); },
    trackSplashLensEvent: (name, props) => events.push({ name, props }),
    ...extra,
  });
  vm.runInContext([fn('libraryMissText'), fn('reportLibraryMiss')].join('\n'), context);
  return { context, posted, events };
}

test('each miss trigger posts once per query with no photo or contact details', () => {
  const h = harness();
  for (const [trigger, details] of [
    ['code_no_hit', { brand: 'Hayward', query: 'E999' }],
    ['partsnap_low', { brand: 'Pentair', model: 'VSF 3', query: 'pump lid' }],
    ['partsnap_no_match', { query: 'unidentified pool part' }],
    ['manual_fallback', { query: 'photo preflight manual ID' }],
  ]) {
    assert.equal(h.context.reportLibraryMiss(trigger, details), true);
    assert.equal(h.context.reportLibraryMiss(trigger, details), false);
  }
  assert.deepEqual(h.posted.map(row => row.trigger), ['code_no_hit', 'partsnap_low', 'partsnap_no_match', 'manual_fallback']);
  assert.equal(h.events.filter(event => event.name === 'library_miss').length, 4);
  assert.equal(h.posted.every(row => row.utm_source === 'qa' && !('photo_ref' in row)), true);
  assert.equal(h.context.reportLibraryMiss('code_no_hit', { query: 'john@example.com' }), false);
  assert.equal(h.context.reportLibraryMiss('partsnap_low', { query: 'Call 555-123-4567' }), false);
  assert.equal(h.posted.length, 4);
});

test('PartSnap low/no-match and manual fallback call the protected miss path', () => {
  const opened = [];
  const h = harness({ startServiceProofWorkflow: kind => opened.push(kind) });
  vm.runInContext("let _lastPartSnapResult = { manufacturer: 'Pentair', model: 'VSF 3', component: 'pump lid' };", h.context);
  vm.runInContext([fn('trackPartSnapResultFailure'), fn('openPartSnapPreflightManualFallback')].join('\n'), h.context);
  h.context.trackPartSnapResultFailure('low_confidence');
  h.context.trackPartSnapResultFailure('low_confidence');
  h.context.trackPartSnapResultFailure('no_match');
  h.context.openPartSnapPreflightManualFallback();
  assert.deepEqual(h.posted.map(row => row.trigger), ['partsnap_low', 'partsnap_no_match', 'manual_fallback']);
  assert.deepEqual(opened, ['part']);
});

test('both code-search surfaces debounce and dedupe a settled zero-hit equipment query', () => {
  const inputs = { 'error-search': { value: 'E999' }, 'scan-code-input': { value: 'E999' } };
  const results = { innerHTML: '', insertAdjacentHTML() {} };
  const h = harness({
    S: { brand: null },
    document: { getElementById: id => inputs[id] || (id === 'search-clear' ? { style: {} } : results) },
    searchErrorDB: () => [], getSplashLensRole: () => 'tech',
    trackFirstActionStarted: () => {}, renderScanHits: () => '',
    emptyState: () => '', a3Text: key => key, escHtml: value => value,
    clearTimeout: () => {}, setTimeout: callback => { callback(); return 1; },
  });
  vm.runInContext('let _scanBrand = null;', h.context);
  vm.runInContext([fn('onErrorSearch'), fn('scanCodeSearch'), fn('countVerifiedCodeHits')].join('\n'), h.context);
  h.context.onErrorSearch('E999');
  h.context.scanCodeSearch('E999');
  assert.equal(h.posted.length, 1);
  inputs['error-search'].value = 'E998';
  h.context.onErrorSearch('E998');
  assert.equal(h.posted.length, 2);
  assert.equal(h.posted.every(row => row.trigger === 'code_no_hit'), true);
});
