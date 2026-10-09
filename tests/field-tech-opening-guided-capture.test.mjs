import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const shell = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

test('opening screen exposes exactly three dominant field actions', () => {
  const workflow = shell.match(/<div class="field-workflow"[\s\S]*?<\/div>/)?.[0] || '';
  assert.equal((workflow.match(/<button\b/g) || []).length, 3);
  assert.match(workflow, /<strong>Identify Part<\/strong>/);
  assert.match(workflow, /<strong>Look Up Code<\/strong>/);
  assert.match(workflow, /<strong>Build Proof Packet<\/strong>/);
  assert.doesNotMatch(workflow, /<strong>(Dose|Note|Search)<\/strong>/);
});

test('exact-code search is primary while secondary tools stay expandable', () => {
  const drawer = shell.match(/<details class="field-tool-drawer">[\s\S]*?<\/details>/)?.[0] || '';
  assert.match(drawer, /CPO \/ Facility quick start/);
  assert.match(drawer, /New Tech Radar and Connected Pool Network/);
  assert.match(shell, /id="brand-grid"/);
  assert.match(shell, /id="error-search"/);
  assert.ok(shell.indexOf('id="error-search"') < shell.indexOf('<details class="field-tool-drawer">'));
  assert.doesNotMatch(drawer, /id="error-search"/);
});

test('PartSnap requires the four-shot guided evidence sequence', () => {
  for (const key of ['equipment', 'plate', 'marking', 'context']) {
    assert.match(app, new RegExp(`key: '${key}'`));
  }
  assert.match(app, /function capturePartSnapEvidenceFrame/);
  assert.match(app, /function composePartSnapEvidenceSheet/);
  assert.match(app, /partsnap_evidence_step_completed/);
  assert.match(app, /partsnap_evidence_set_completed/);
  assert.match(app, /dimension_status/);
  assert.match(app, /partsnap-evidence-guide.*scrollIntoView/);
});

test('new review and proof flows avoid native-shell dialog traps', () => {
  const reviewFlow = app.match(/async function changeSplashLensTeamReview[\s\S]*?\n}/)?.[0] || '';
  const shareFlow = app.match(/async function createServiceProofShareLink[\s\S]*?\n}/)?.[0] || '';
  assert.match(reviewFlow, /openSplashLensSheet/);
  assert.doesNotMatch(reviewFlow, /window\.prompt|\bconfirm\(/);
  assert.match(shareFlow, /service_proof_share_blocked_incomplete/);
  assert.doesNotMatch(shareFlow, /\bconfirm\(/);
});

test('all interactive workflows avoid native prompt and confirm dialogs', () => {
  assert.doesNotMatch(app, /\bprompt\(|window\.confirm|\bconfirm\(/);
  assert.match(app, /function openSplashLensSheet/);
  assert.match(app, /async function confirmSplashLensAction/);
});

test('PartSnap verification and buying links fail closed', () => {
  assert.match(app, /function getPartSnapOrderGate/);
  assert.match(app, /verificationReady:/);
  assert.match(app, /const buyLinks = orderGate\.verificationReady/);
  assert.match(app, /ORDER HOLD/);
  assert.match(app, /manufacturer parts diagram/);
});

test('blocked PartSnap photo offers a manual proof path without inventing a result', () => {
  const preflight = app.match(/function showPartSnapImagePreflight[\s\S]*?\n}/)?.[0] || '';
  const fallback = app.match(/function openPartSnapPreflightManualFallback[\s\S]*?\n}/)?.[0] || '';
  assert.match(preflight, /Document manually/);
  assert.match(preflight, /openPartSnapPreflightManualFallback\(\)/);
  assert.doesNotMatch(preflight, /requestPartSnapSecondProof\(\)/);
  assert.match(fallback, /partsnap_manual_fallback/);
  assert.match(fallback, /startServiceProofWorkflow\('part'\)/);
});
