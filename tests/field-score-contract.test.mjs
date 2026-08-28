import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fieldScore = readFileSync(new URL('../js/field-score.js', import.meta.url), 'utf8');

test('field score widget is present and loaded after analytics', () => {
  assert.match(html, /id="field-score-widget"/);
  assert.match(html, /data-field-score="helpful"/);
  assert.match(html, /data-field-score="saved_time"/);
  assert.match(html, /data-field-score="missing"/);
  assert.match(html, /data-field-score="wrong"/);
  assert.match(html, /\/js\/analytics\.js/);
  assert.match(html, /\/js\/field-score\.js\?v=20260828-closing-score/);
  assert.ok(html.indexOf('/js/analytics.js') < html.indexOf('/js/field-score.js'));
});

test('field score tracking captures activation and campaign attribution', () => {
  assert.match(fieldScore, /field_score_prompted/);
  assert.match(fieldScore, /field_score_feedback/);
  assert.match(fieldScore, /field_score_dismissed/);
  assert.match(fieldScore, /utm_source/);
  assert.match(fieldScore, /utm_medium/);
  assert.match(fieldScore, /utm_campaign/);
  assert.match(fieldScore, /challenge_path/);
  assert.match(fieldScore, /navigator\.sendBeacon/);
});

test('field score stays field friendly and avoids unsafe rendering', () => {
  assert.doesNotMatch(fieldScore, /innerHTML\s*=/);
  assert.match(fieldScore, /textContent/);
  assert.match(fieldScore, /20 \* 60 \* 1000/);
  assert.match(fieldScore, /maxlength="500"|safeText\(noteInput\.value, 500\)/);
});

test('homepage promise matches field technician positioning', () => {
  assert.match(html, /Get off the pad faster\./);
  assert.doesNotMatch(html, /<h1>Proof-first pool work\.<\/h1>/);
});
