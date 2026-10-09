import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { i18nText } from '../js/i18n.js';

const source = readFileSync(join(import.meta.dirname, '..', 'js', 'app.js'), 'utf8');

function functionSource(start, end) {
  return source.slice(source.indexOf(`function ${start}(`), source.indexOf(`function ${end}(`));
}

test('first useful value waits for visible content and fires once per tab session', () => {
  const events = [];
  const values = new Map();
  const context = {
    navigator: { onLine: true },
    sessionStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
    trackSplashLensEvent: (name, props) => events.push({ name, props }),
  };
  vm.runInNewContext(functionSource('trackFirstUsefulResult', 'trackCalculationCompleted'), context);
  const result = { isConnected: true, innerHTML: '<p>Answer</p>', getClientRects: () => [] };

  context.trackFirstUsefulResult('manual_code_answer', result, { result_count: 1 });
  assert.equal(events.length, 0);
  result.getClientRects = () => [{}];
  context.trackFirstUsefulResult('manual_code_answer', result, { result_count: 1 });
  context.trackFirstUsefulResult('manual_code_answer', result, { result_count: 1 });
  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'first_value_completed');
  assert.equal(events[0].props.workflow, 'manual_code_answer');
  assert.equal(events[0].props.result_count, 1);
});

test('first useful value survives blocked browser storage', () => {
  const events = [];
  const context = {
    sessionStorage: {
      getItem() { throw new Error('storage blocked'); },
      setItem() { throw new Error('storage blocked'); },
    },
    trackSplashLensEvent: (name) => events.push(name),
  };
  vm.runInNewContext(functionSource('trackFirstUsefulResult', 'trackCalculationCompleted'), context);
  const result = { isConnected: true, innerHTML: '<p>Answer</p>', getClientRects: () => [{}] };
  context.trackFirstUsefulResult('manual_code_answer', result);
  context.trackFirstUsefulResult('manual_code_answer', result);
  assert.deepEqual(events, ['first_value_completed']);
});

test('scanner no-result message escapes the typed query', () => {
  const context = {
    escHtml: (value) => String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    a3Text: (key) => i18nText('en', key),
  };
  vm.runInNewContext(functionSource('renderScanHits', 'renderManualLookupUpgradeOffer'), context);
  const html = context.renderScanHits([], '<img src=x>');
  assert.match(html, /&lt;img src=x&gt;/);
  assert.doesNotMatch(html, /<img src=x>/);
});

test('calculator value is counted only after its output exists', () => {
  const events = [];
  const values = new Map();
  const result = { isConnected: true, innerHTML: '', getClientRects: () => [{}] };
  const context = {
    navigator: { onLine: true },
    sessionStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
    document: { getElementById: (id) => id === 'turn-result' ? result : null },
    getSplashLensRole: () => 'tech',
    trackSplashLensEvent: (name) => events.push(name),
  };
  vm.runInNewContext(functionSource('trackFirstUsefulResult', 'calculateDose'), context);

  context.trackCalculationCompleted('turnover');
  assert.deepEqual(events, ['calculation_completed']);
  result.innerHTML = '<div class="result-wrap">5.0 hrs</div>';
  context.trackCalculationCompleted('turnover');
  assert.deepEqual(events, ['calculation_completed', 'calculation_completed', 'first_value_completed']);
  const turnover = functionSource('calcTurnoverRate', 'renderSaltSection');
  assert.ok(turnover.indexOf("setEl('turn-result'") < turnover.indexOf("trackCalculationCompleted('turnover'"));
});

test('PartSnap value follows its result and excludes guided retry or low confidence', () => {
  const partSnap = functionSource('renderPartsSnapResult', 'renderPartSnapFeedbackTrap');
  assert.ok(partSnap.indexOf('result.innerHTML = `') < partSnap.indexOf("trackFirstUsefulResult('partsnap_result'"));
  assert.match(partSnap, /if \(!showGuidedRetry && !low && \(component \|\| corpusCandidates\.length\)\)/);
});

test('brand-filtered zero result offers an all-brand retry without losing the query', () => {
  const events = [];
  const elements = {
    'search-clear': { style: {} },
    'error-results': { innerHTML: '' },
    'error-search': { value: 'E05' },
    'category-strip': { style: {} },
  };
  const state = { brand: 'hayward', category: null };
  const context = {
    S: state,
    document: { getElementById: (id) => elements[id] },
    window: { ERROR_DB: { pentair: { label: 'Pentair', color: '#000' } } },
    searchErrorDB: (_query, brand) => brand ? [] : [{ brandKey: 'pentair', category: 'Pump', code: 'E05' }],
    clearTimeout: () => {},
    trackSplashLensEvent: (name, props) => events.push({ name, props }),
    getSplashLensRole: () => 'tech',
    escHtml: (value) => value,
    a3Text: (key) => i18nText('en', key),
    codeCard: () => '<div class="error-card">Answer</div>',
    resetBrandBtn: () => {},
  };
  vm.runInNewContext(functionSource('onErrorSearch', 'clearSearch'), context);

  context.onErrorSearch('E05');
  assert.match(elements['error-results'].innerHTML, /Search all brands \(1\)/);
  assert.equal(events.find((event) => event.name === 'manual_code_search')?.props.result_count, 0);
  context.searchAllBrandsForCurrentQuery();
  assert.equal(state.brand, null);
  assert.equal(elements['error-search'].value, 'E05');
  assert.match(elements['error-results'].innerHTML, /error-card/);
  assert.equal(events.filter((event) => event.name === 'manual_code_search').length, 2);
  assert.equal(events.some((event) => event.name === 'first_value_completed'), false);
});
