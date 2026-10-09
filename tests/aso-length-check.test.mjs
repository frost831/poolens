import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseDrafts, validateDrafts } from '../tools/aso-length-check.mjs';

const markdown = await readFile(new URL('../aso/2026-10-growth-listing-drafts.md', import.meta.url), 'utf8');
const drafts = parseDrafts(markdown);

test('all four localized listings have complete in-limit fields', () => {
  const { counts, errors } = validateDrafts(drafts);
  assert.deepEqual(errors, []);
  assert.equal(counts.length, 16);
  assert.deepEqual(new Set(drafts.map(({ platform, locale }) => `${platform}/${locale}`)),
    new Set(['ios/en-US', 'ios/es-MX', 'play/en-US', 'play/es-419']));
});

test('counts Unicode characters, including Spanish accents, exactly', () => {
  const { counts } = validateDrafts(drafts);
  const byField = Object.fromEntries(counts.map(({ id, field, count }) => [`${id}.${field}`, count]));
  assert.deepEqual(byField, {
    'ios/en-US.name': 28,
    'ios/en-US.subtitle': 23,
    'ios/en-US.keywords': 90,
    'ios/en-US.promotionalText': 114,
    'ios/en-US.description': 886,
    'ios/es-MX.name': 27,
    'ios/es-MX.subtitle': 22,
    'ios/es-MX.keywords': 79,
    'ios/es-MX.promotionalText': 124,
    'ios/es-MX.description': 1034,
    'play/en-US.title': 27,
    'play/en-US.shortDescription': 71,
    'play/en-US.fullDescription': 893,
    'play/es-419.title': 27,
    'play/es-419.shortDescription': 71,
    'play/es-419.fullDescription': 1001,
  });
  assert.equal([...'Códigos'].length, 7);
});

test('rejects over-limit copy, missing fields, and disallowed promises', () => {
  const changed = structuredClone(drafts);
  changed[0].name = 'x'.repeat(31);
  delete changed[1].promotionalText;
  changed[2].shortDescription = 'Subscribe in app for $49 with Skimmer';
  const { errors } = validateDrafts(changed);
  assert.ok(errors.some((error) => error.includes('ios/en-US.name: 31 > 30')));
  assert.ok(errors.some((error) => error.includes('ios/es-MX.promotionalText: missing text')));
  assert.ok(errors.some((error) => error.includes('play/en-US.shortDescription: prohibited store copy')));
});

test('rejects malformed JSON and duplicate or absent locales', () => {
  assert.throws(() => parseDrafts('```json\n{bad}\n```'), /JSON block 1/);
  const changed = [...drafts.slice(0, 3), drafts[2]];
  const { errors } = validateDrafts(changed);
  assert.ok(errors.some((error) => error.includes('Duplicate listing play/en-US')));
  assert.ok(errors.some((error) => error.includes('Missing listing play/es-419')));
});
