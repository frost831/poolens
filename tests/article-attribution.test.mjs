import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
function functionSource(name) {
  const match = source.match(new RegExp(`^function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}

test('Field Notes attribution accepts only a bounded article ID', () => {
  for (const [article, expected] of [
    ['sl-field-001', 'sl-field-001'],
    ['private@example.com', ''],
    ['a'.repeat(65), ''],
  ]) {
    const context = vm.createContext({
      URL,
      Date,
      window: { location: { href: `https://app.splashlens.com/?utm_source=splashlens_blog&article=${encodeURIComponent(article)}`, pathname: '/' } },
      document: { referrer: '' },
      getReferrerHost: () => '',
      normalizeAttributionSource: value => value,
      cleanAttributionValue: value => value,
    });
    vm.runInContext(functionSource('attributionFromCurrentPage'), context);
    assert.equal(context.attributionFromCurrentPage().article, expected);
  }
});
