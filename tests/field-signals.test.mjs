import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  DEFAULT_FIELD_SIGNAL_PREFERENCES,
  buildContextualFieldSignals,
  buildPumpCustomerSummary,
  calculatePumpDecision,
  isFieldSignalEligible,
  isQuietTime,
  normalizeFieldSignalPreferences,
} from '../js/field-signals-core.mjs';

test('quiet, opt-in defaults protect technicians from notification noise', () => {
  const preferences = normalizeFieldSignalPreferences({});
  assert.equal(preferences.systemNotifications, false);
  assert.equal(preferences.maxDaily, 1);
  assert.equal(preferences.maxWeekly, 2);
  assert.equal(preferences.categories.training, false);
  assert.deepEqual(preferences, DEFAULT_FIELD_SIGNAL_PREFERENCES);
});

test('pump context produces decision and before-you-leave proof signals', () => {
  const signals = buildContextualFieldSignals({
    manufacturer: 'Example',
    hardware: 'single-speed pool pump motor',
    symptom: 'motor hums',
  });
  assert.deepEqual(signals.map(signal => signal.id), [
    'pump-before-you-leave-proof',
    'pump-repair-upgrade-decision',
  ]);
});

test('unrelated equipment does not receive a pump prompt', () => {
  const signals = buildContextualFieldSignals({ hardware: 'salt cell', symptom: 'low output' });
  assert.equal(signals.some(signal => signal.id.includes('pump')), false);
});

test('multiple missing PartSnap proof items trigger one proof reminder', () => {
  const signals = buildContextualFieldSignals({
    component: 'robot cable',
    missingProof: ['model plate', 'connector photo'],
  });
  assert.equal(signals[0].id, 'partsnap-missing-proof');
});

test('system alerts respect opt-in, quiet hours, daily cap, and weekly cap', () => {
  const signal = { id: 'test', category: 'proof' };
  const daytime = new Date('2026-07-28T12:00:00');
  const nighttime = new Date('2026-07-28T21:00:00');
  const optedIn = normalizeFieldSignalPreferences({ systemNotifications: true });

  assert.equal(isFieldSignalEligible(signal, {}, {}, { channel: 'system', now: daytime }).reason, 'system_disabled');
  assert.equal(isQuietTime(optedIn, nighttime), true);
  assert.equal(isFieldSignalEligible(signal, optedIn, {}, { channel: 'system', now: nighttime }).reason, 'quiet_hours');
  assert.equal(isFieldSignalEligible(signal, optedIn, {
    systemShownAt: ['2026-07-28T10:00:00'],
  }, { channel: 'system', now: daytime }).reason, 'daily_cap');
  assert.equal(isFieldSignalEligible(signal, optedIn, {
    systemShownAt: ['2026-07-27T10:00:00', '2026-07-28T09:00:00'],
  }, { channel: 'system', now: new Date('2026-07-29T12:00:00') }).reason, 'weekly_cap');
});

test('only explicitly urgent and verified safety alerts bypass quiet hours', () => {
  const preferences = normalizeFieldSignalPreferences({ systemNotifications: true });
  const now = new Date('2026-07-28T22:00:00');
  const verified = { verifiedAt: '2026-07-28' };
  assert.equal(isFieldSignalEligible({ id: 'safe', category: 'safety', source: verified }, preferences, {}, { channel: 'system', now }).reason, 'quiet_hours');
  assert.equal(isFieldSignalEligible({ id: 'urgent', category: 'safety', urgent: true, source: verified }, preferences, {}, { channel: 'system', now }).eligible, true);
});

test('pump comparison never invents an energy number', () => {
  const result = calculatePumpDecision({ repairCost: 600, replacementCost: 1800 });
  assert.equal(result.hasEnergyInputs, false);
  assert.equal(result.annualSavings, null);
  assert.match(buildPumpCustomerSummary({}, result), /No energy-savings figure is shown/);
});

test('pump comparison uses only explicit job inputs', () => {
  const input = {
    repairCost: 600,
    replacementCost: 1800,
    currentWatts: 1500,
    proposedWatts: 600,
    hoursPerDay: 8,
    daysPerYear: 365,
    electricityRate: 0.15,
    inputBasis: 'measured',
  };
  const result = calculatePumpDecision(input);
  assert.equal(result.currentAnnualCost, 657);
  assert.equal(result.proposedAnnualCost, 262.8);
  assert.ok(Math.abs(result.annualSavings - 394.2) < 0.001);
  assert.ok(Math.abs(result.simplePaybackYears - 3.044) < 0.01);
  assert.match(buildPumpCustomerSummary(input, result), /not a requirement or guarantee/);
});

test('current field-signal feed includes conservative IntelliFlo3 connected-pump intelligence', async () => {
  const feed = JSON.parse(await readFile(new URL('../data/field-signals/current.json', import.meta.url), 'utf8'));
  const signal = feed.items.find((item) => item.id === 'pentair-intelliflo3-connected-pump-intelligence-2026');

  assert.ok(signal);
  assert.equal(signal.status, 'current');
  assert.equal(signal.notificationEligible, true);
  assert.match(signal.body, /pump plate/i);
  assert.match(signal.body, /RS-485|I-O board/i);
  assert.match(signal.source.url, /pentair\.com/);
  assert.match(signal.source.secondaryUrl, /pentair\.com/);
  assert.match(signal.guardrail, /does not diagnose/i);
  assert.match(signal.guardrail, /does not.*endorsement/i);
  assert.match(signal.guardrail, /live Pentair telemetry/i);
});

test('current field-signal feed includes conservative Jandy connected-equipment radar', async () => {
  const feed = JSON.parse(await readFile(new URL('../data/field-signals/current.json', import.meta.url), 'utf8'));
  const signal = feed.items.find((item) => item.id === 'jandy-insider-connected-equipment-radar-2026');

  assert.ok(signal);
  assert.equal(signal.status, 'current');
  assert.equal(signal.notificationEligible, true);
  assert.match(signal.body, /AquaLink EDGE/);
  assert.match(signal.body, /Home Hub/);
  assert.match(signal.body, /app\/cloud status timestamp/i);
  assert.match(signal.body, /RS-485/i);
  assert.match(signal.source.url, /jandy\.com/);
  assert.match(signal.source.secondaryUrl, /jandy\.com/);
  assert.match(signal.guardrail, /does not diagnose/i);
  assert.match(signal.guardrail, /live Jandy telemetry/i);
  assert.match(signal.guardrail, /Fluidra\/Jandy endorsement/i);
});

test('app, worker, analytics, and native wrapper expose the Field Signals contract', async () => {
  const [html, app, worker, events, swift] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../sw-field-signals.js', import.meta.url), 'utf8'),
    readFile(new URL('../functions/api/events.js', import.meta.url), 'utf8'),
    readFile(new URL('../ios/SplashLens/ContentView.swift', import.meta.url), 'utf8'),
  ]);
  assert.match(html, /id="field-signal-inline"/);
  assert.match(html, /type="module" src="\/js\/field-signals\.js/);
  assert.match(app, /onPartSnapResult/);
  assert.match(app, /scheduleNextVisitReminder/);
  assert.match(worker, /SPLASHLENS_SHOW_FIELD_SIGNAL/);
  assert.match(worker, /periodicsync/);
  assert.match(events, /fieldSignalActionRate30d/);
  assert.match(swift, /splashlensNotifications/);
});
