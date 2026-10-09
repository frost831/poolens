import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { I18N, i18nText } from '../js/i18n.js';

test('every English A3 string has a nonempty Spanish counterpart', () => {
  const enKeys = Object.keys(I18N.en).sort();
  const esKeys = Object.keys(I18N.es).sort();
  assert.deepEqual(esKeys, enKeys);
  for (const key of enKeys) {
    assert.ok(I18N.en[key].trim(), `empty English value: ${key}`);
    assert.ok(I18N.es[key].trim(), `empty Spanish value: ${key}`);
  }
});

test('A3 dictionary covers each requested chrome surface', () => {
  for (const prefix of ['language.', 'counter.', 'code.', 'packet.', 'closing.', 'upgrade.']) {
    assert.ok(Object.keys(I18N.en).some((key) => key.startsWith(prefix)), `missing ${prefix}`);
  }
  assert.equal(i18nText('es', 'counter.code'), 'Código');
  assert.equal(i18nText('fr', 'counter.code'), 'Code');
  assert.equal(i18nText('es', 'unknown.key'), 'unknown.key');
});

test('draft Spanish is flagged and share copy contains no price or checkout claim', () => {
  const source = readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
  const review = readFileSync(new URL('../docs/i18n/ES_REVIEW.md', import.meta.url), 'utf8');
  assert.match(source, /needs_native_review/);
  assert.match(review, /machine-drafted/);
  for (const key of Object.keys(I18N.en).filter((entry) => entry.startsWith('packet.'))) {
    assert.doesNotMatch(I18N.en[key], /\$|checkout|guarantee/i, key);
    assert.doesNotMatch(I18N.es[key], /\$|checkout|garant[ií]a/i, key);
  }
});
