import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

test('proof packet sharing stores content server-side behind an opaque route', () => {
  assert.match(app, /const SPLASHLENS_PROOF_PACKETS_ENDPOINT = '\/api\/proof-packets'/);
  assert.match(app, /splashLensProofPacketRequest\(\{ action: 'create'/);
  assert.match(app, /expiresInHours: 24 \* 14/);
  assert.match(app, /server_stored: true/);
  assert.doesNotMatch(app, /proof-packet\.html\?p=/);
  assert.doesNotMatch(app, /encodeProofPacketPayload/);
});

test('proof packet copy action never embeds user text in inline JavaScript', () => {
  assert.match(app, /id="rpt-proof-copy-link"/);
  assert.match(app, /rpt-proof-copy-link'\)\?\.addEventListener/);
  assert.doesNotMatch(app, /onclick="copyTextToClipboard\('\$\{escAttr\(message\)\}/);
});

test('share payload keeps nested proof signals without explicit customer identifiers', () => {
  const functionSource = app.match(/^function serviceProofSharePayload\(\) \{[\s\S]*?^\}/m)?.[0];
  assert.ok(functionSource);
  const passport = {
    customer: 'Jane Private', address: '123 Private Lane', tech: 'Private Tech',
    date: '2026-10-05', visitType: 'Equipment repair',
    readings: { source: 'spintouch', fc: '3.2' },
    proof: { photoProof: 'pump-label.jpg', issueNote: 'Seal leak', customerSummary: 'Pump inspected' },
    workPerformed: 'Inspected seal', recommendations: 'Replace seal',
    callbackRisk: { level: 'medium', flags: ['Repeat pump issue'] },
  };
  const payload = runInNewContext(`${functionSource}; serviceProofSharePayload()`, {
    buildServicePassport: () => passport,
    findPoolForReport: () => null,
    reportProofRiskFlags: () => passport.callbackRisk.flags,
    validateReportProof: () => ({ complete: true, missing: [] }),
    buildServiceProofCustomerSummary: () => 'Fallback summary',
  });
  assert.equal(payload.proof.customerSummary, 'Pump inspected');
  assert.equal(payload.proof.photoProof, 'pump-label.jpg');
  assert.equal(payload.readings.source, 'spintouch');
  assert.equal(payload.workPerformed, 'Inspected seal');
  assert.equal(payload.recommendations, 'Replace seal');
  assert.equal(payload.callbackRisk.level, 'medium');
  assert.doesNotMatch(JSON.stringify(payload), /Jane Private|123 Private Lane|Private Tech/);
  assert.match(app, /review summary and proof notes for personal details before sharing/);
});

test('team review queue is visible and supports evidence and decision transitions', () => {
  assert.match(app, /const SPLASHLENS_TEAM_REVIEW_ENDPOINT = '\/api\/team-review'/);
  assert.match(app, /renderSplashLensReviewSection/);
  assert.match(app, /request_evidence/);
  assert.match(app, /'approve'/);
  assert.match(app, /'reject'/);
  assert.match(app, /submitLastProofPacketForTeamReview/);
  assert.match(app, /team_review_submitted_from_proof_packet/);
});

test('team names and invite ids never enter inline JavaScript handlers', () => {
  assert.match(app, /data-splashlens-team-invite/);
  assert.match(app, /data-splashlens-team-accept/);
  assert.match(app, /function wireSplashLensTeamActions/);
  assert.doesNotMatch(app, /onclick="inviteSplashLensTeamMember\('\$\{escAttr\(team/);
  assert.doesNotMatch(app, /onclick="acceptSplashLensTeamInvite\('\$\{escAttr\(invite/);
});
