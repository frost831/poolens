import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const roster = readFileSync(new URL('../ops/closing-season-10-tech-pilot.csv', import.meta.url), 'utf8');
const report = readFileSync(new URL('../tools/report-closing-pilot.mjs', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('closing pilot has ten stable and uniquely attributed challenge links', () => {
  const lines = roster.trim().split(/\r?\n/).slice(1);
  assert.equal(lines.length, 10);
  const ids = lines.map((line) => line.split(',')[0]);
  assert.equal(new Set(ids).size, 10);
  for (const [index, line] of lines.entries()) {
    assert.match(line, new RegExp(`sl-close-${String(index + 1).padStart(2, '0')}`));
    assert.match(line, /pilot_id=closing-season-10-tech-2026/);
    assert.match(line, /challenge_path=closing/);
    assert.match(line, /utm_source=named_pilot/);
  }
});

test('pilot workflow measures completion, time, feedback, return, PartSnap, and checkout intent', () => {
  assert.match(app, /seconds_to_value/);
  assert.match(app, /field-feedback-time-saved/);
  assert.match(app, /field-feedback-upgrade-intent/);
  assert.match(app, /challengeCompleted && challenge\.pilot_id/);
  for (const signal of ['field_challenge_completed', 'time_saved', 'upgrade_intent', 'return_events', 'partsnap_results', 'checkout_starts']) {
    assert.match(report, new RegExp(signal));
  }
  assert.match(packageJson.scripts['pilot:report'], /report-closing-pilot\.mjs/);
});
