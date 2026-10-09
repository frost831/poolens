import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { formatCrmProofPacket, MAX_PACKET_LENGTH } from '../js/crm-proof-export.js';

const passport = {
  customer: 'Smith Residence', tech: 'A. Tech', date: '2026-10-09', visitType: 'Heater service',
  readings: { source: 'manual', fc: '2.5', ph: '7.4', ta: '90' },
  chemicals: [{ name: 'Liquid chlorine', amt: '1 gal', cost: 15.99 }],
  proof: { complete: true, missing: [], issueNote: 'Ignition code observed', photoProof: 'heater-plate.jpg', customerSummary: 'Heater inspected; repair pending.' },
  workPerformed: 'Checked flow and photographed model plate', equipmentNotes: 'Heater model HX-2',
  recommendations: 'Qualified heater service follow-up', nextVisit: 'After approval',
  callbackRisk: { level: 'medium', flags: ['Repeat heater issue'] },
  address: 'Private address', totalChemicalCost: 15.99, passportUrl: 'https://example.test/private',
};

test('four destination templates paste as readable Service Passport notes', () => {
  const expected = [
    ['skimmer', 'Skimmer', 'service note', 'Readings: manual, FC 2.5, pH 7.4, TA 90', 'Work performed'],
    ['poolBrain', 'Pool Brain', 'field proof', 'Issue / tech note', 'Readings'],
    ['jobber', 'Jobber', 'job note', 'Work performed', 'Issue / tech note'],
    ['ptp', 'Paythepoolman', 'service log', 'Readings', 'Issue / tech note'],
  ];
  for (const [destination, name, title, first, second] of expected) {
    const note = formatCrmProofPacket(passport, destination);
    assert.match(note, new RegExp(`^SplashLens ${title} \\| paste into ${name} notes`));
    assert.match(note, /Proof status: Ready/);
    assert.match(note, /Customer: Smith Residence/);
    assert.match(note, /Visit: 2026-10-09, Heater service/);
    assert.match(note, /Chemicals added: Liquid chlorine, 1 gal/);
    assert.match(note, /Photo \/ proof references: heater-plate.jpg/);
    assert.match(note, /Customer summary: Heater inspected; repair pending\./);
    assert.match(note, /Reference only\. Verify repairs/);
    assert.ok(note.indexOf(first) < note.indexOf(second), destination);
    assert.ok(note.length <= MAX_PACKET_LENGTH);
    assert.doesNotMatch(note, /Private address|15\.99|example\.test/);
  }
});

test('incomplete proof stays labeled and empty values do not claim readings or work', () => {
  const note = formatCrmProofPacket({
    date: '2026-10-09', visitType: 'Service', readings: { source: 'manual' },
    proof: { complete: false, missing: ['water reading', 'equipment/photo proof'] },
  }, 'skimmer');
  assert.match(note, /Proof status: Incomplete - verify before treating as final/);
  assert.match(note, /Missing proof: water reading, equipment\/photo proof/);
  assert.doesNotMatch(note, /Readings:|Work performed:|Customer summary:/);
});

test('long and hostile notes stay bounded, single-line per field, and retain caution', () => {
  const noisy = `Pump\nFake field: yes\u202e ${'😀'.repeat(1800)}`;
  const huge = {
    ...passport, customer: noisy, tech: noisy, visitType: noisy, equipmentNotes: noisy,
    workPerformed: noisy, recommendations: noisy, nextVisit: noisy,
    readings: { source: noisy, fc: noisy, cc: noisy, ph: noisy, ta: noisy, ch: noisy, cya: noisy },
    chemicals: Array.from({ length: 50 }, () => ({ name: noisy, amt: noisy, cost: 1 })),
    proof: { complete: false, missing: Array.from({ length: 50 }, () => noisy), issueNote: noisy, photoProof: noisy, customerSummary: noisy },
    callbackRisk: { level: 'high', flags: Array.from({ length: 50 }, () => noisy) },
  };
  const note = formatCrmProofPacket(huge, 'poolBrain');
  assert.ok(note.length <= MAX_PACKET_LENGTH);
  assert.match(note, /Proof status: Incomplete/);
  assert.match(note, /Reference only\. Verify repairs/);
  assert.doesNotMatch(note, /\u202e|\r|\ud83d(?!\ude00)/);
  assert.doesNotMatch(note, /\nFake field:/);
  assert.match(note, /Additional detail omitted for note length/);
  assert.match(note, /\+44 more in Passport/);
});

test('unknown destination and absent Passport fail closed', () => {
  assert.throws(() => formatCrmProofPacket(passport, 'unknown'), TypeError);
  assert.throws(() => formatCrmProofPacket(null, 'skimmer'), TypeError);
});

test('current report and saved Passport expose copy-only CRM actions', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  for (const [destination, label] of [['skimmer', 'Skimmer'], ['poolBrain', 'Pool Brain'], ['jobber', 'Jobber'], ['ptp', 'PTP']]) {
    assert.match(html, new RegExp(`onclick="copyCrmProofPacket\\('${destination}'\\)"[^>]*>Copy for ${label}</button>`));
    assert.match(app, new RegExp(`\\['${destination}', '${label}'\\]`));
  }
  assert.match(html, /We don't replace your CRM; we complement Pool Brain &amp; peers/);
  assert.match(app, /formatCrmProofPacket\(passport \|\| buildServicePassport\(\), destination\)/);
  assert.match(app, /copyTextToClipboard\(text, 'CRM proof note copied\.'\)/);
  assert.match(app, /copySavedCrmProofPacket\(this\)/);
  assert.match(app, /Number\.isSafeInteger\(index\) && index >= 0/);
});
