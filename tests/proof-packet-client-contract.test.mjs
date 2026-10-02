import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
