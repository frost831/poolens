import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const begin = app.indexOf('function initDeepLink() {');
const end = app.indexOf('function getFacilityDeepLinkParts() {', begin);
assert.ok(begin >= 0 && end > begin);

function opened(search) {
  const calls = [];
  const context = {
    window: { location: { search } },
    URLSearchParams,
    setTimeout: fn => fn(),
    showTab: name => calls.push(`tab:${name}`),
    startServiceProofWorkflow: name => calls.push(`proof:${name}`),
    switchClType: name => calls.push(`checklist:${name}`),
    cleanAttributionValue: value => value,
  };
  vm.runInNewContext(`${app.slice(begin, end)}\ninitDeepLink();`, context);
  return calls;
}

test('Closing Mode report link opens the proof packet rather than the checklist', () => {
  assert.deepEqual(opened('?tab=report&workflow=closing&mode=closing'), ['tab:report', 'proof:closing']);
  assert.deepEqual(opened('?tab=guide&checklist=closing'), ['tab:guide', 'checklist:closing']);
});

test('all seven mobile field tools fit in the navigation track', () => {
  assert.match(html, /nav\[aria-label="SplashLens field tools"\] \.nav-btn \{ flex:1 1 0; min-width:0; \}/);
  assert.doesNotMatch(html, /flex:0 0 66px|flex-basis:74px/);
});
