import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = new URL('../js/app.js', import.meta.url);

test('PartSnap has a client-side image preflight before spending an AI scan', async () => {
  const source = await readFile(appSource, 'utf8');
  assert.match(source, /function inspectPartSnapImage\(canvas\)/);
  assert.match(source, /function showPartSnapImagePreflight\(preflight, result, status\)/);
  assert.match(source, /partsnap_image_preflight_blocked/);
  assert.match(source, /partsnap_image_preflight_warning/);
  assert.match(source, /if \(isPartsScan\) \{\s*const preflight = inspectPartSnapImage\(canvas\)/);
  assert.match(source, /callAIScan\(canvas, aiMode, result, status\)/);
});

test('PartSnap guided retry tracks shown, still-missing, and completed recovery states', async () => {
  const source = await readFile(appSource, 'utf8');
  assert.match(source, /const PARTSNAP_RECOVERY_KEY = 'splashlens-partsnap-recovery-loop'/);
  assert.match(source, /function getPartSnapRecoveryContext\(\)/);
  assert.match(source, /function savePartSnapRecoveryContext\(value = \{\}\)/);
  assert.match(source, /function clearPartSnapRecoveryContext\(reason = 'completed'\)/);
  assert.match(source, /partsnap_guided_retry_shown/);
  assert.match(source, /partsnap_guided_retry_still_missing/);
  assert.match(source, /partsnap_guided_retry_completed/);
});

test('second proof requests are tied to the recovery loop and scan payload', async () => {
  const source = await readFile(appSource, 'utf8');
  assert.match(source, /const proofRequestId = `proof-\$\{Date\.now\(\)\.toString\(36\)\}`/);
  assert.match(source, /savePartSnapRecoveryContext\(\{\s*proofRequestId,/);
  assert.match(source, /proof_request_id: proofRequestId/);
  assert.match(source, /const partSnapRecovery = mode === 'parts_snap' \? getPartSnapRecoveryContext\(\) : null/);
  assert.match(source, /partSnapRecovery,/);
});
