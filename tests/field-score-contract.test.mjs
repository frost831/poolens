import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fieldScore = readFileSync(new URL('../js/field-score.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const marketingGate = html.match(/<section id="marketing-gate"[\s\S]*?<div id="app-shell"/)?.[0] || '';

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

test('field score does not interrupt first-run or scanner entry clicks', () => {
  assert.match(fieldScore, /closest\('#role-picker'\)/);
  assert.match(fieldScore, /closest\('#marketing-gate'\)/);
  assert.doesNotMatch(fieldScore, /tab_'\s*\+/);
  assert.doesNotMatch(fieldScore, /scanner_mode_selected/);
  assert.doesNotMatch(fieldScore, /partsnap\|look up\|lookup/);
});

test('homepage promise matches field technician positioning', () => {
  assert.match(html, /Get off the pad faster\./);
  assert.doesNotMatch(html, /<h1>Proof-first pool work\.<\/h1>/);
});

test('first-run marketing screen sells the verified field network in plain field language', () => {
  assert.match(marketingGate, /<img src="\/icons\/icon-192\.png" alt="" aria-hidden="true">/);
  assert.doesNotMatch(marketingGate, /<span class="marketing-mark">SL<\/span>/);
  assert.match(marketingGate, /Verified Field Network/);
  assert.match(marketingGate, /Identify the thing in your hand/);
  assert.match(marketingGate, /Free lookup now/);
  assert.match(marketingGate, /Paid team and partner layers only unlock/);
  assert.match(marketingGate, /Job proof/);
  assert.match(marketingGate, /Training cards/);
  assert.match(marketingGate, /why it might come back/);
  assert.match(marketingGate, /Saved job trail/);
  assert.doesNotMatch(marketingGate, /Service Proof OS/);
  assert.doesNotMatch(marketingGate, /Learning OS/);
});

test('role picker keeps the field workflow obvious before tool depth', () => {
  assert.match(html, /aria-label="SplashLens fast workflow"/);
  assert.match(html, /<strong>Identify it<\/strong><span>Part, code, spa pack, robot, light, or smart pad\.<\/span>/);
  assert.match(html, /<strong>Prove it<\/strong><span>Photos, readings, labels, and missing checks\.<\/span>/);
  assert.match(html, /<strong>Send it<\/strong><span>Clean note for customer, boss, counter, or trainer\.<\/span>/);
});

test('report workflow uses plain-language proof wording for techs', () => {
  assert.match(html, /aria-label="Job Proof Trail"/);
  assert.match(html, /Save the stop so nobody has to guess later/);
  assert.doesNotMatch(html, /aria-label="Service Proof OS"/);
});

test('scanner tab keeps fallback content above fixed mobile nav', () => {
  assert.match(html, /id="tab-scan"[^>]+padding:0 0 calc\(184px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(appSource, /function revealNoCameraFallback/);
  assert.match(appSource, /scrollMarginBottom = 'calc\(184px \+ env\(safe-area-inset-bottom\)\)'/);
  assert.match(appSource, /scrollIntoView\(\{ block: 'nearest', behavior: 'smooth' \}\)/);
});
