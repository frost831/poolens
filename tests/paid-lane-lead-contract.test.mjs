import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('non-self-serve paid lanes are labeled and have a server lead path', async () => {
  const data = await readFile(new URL('../js/data.js', import.meta.url), 'utf8');
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const waitlist = await readFile(new URL('../functions/api/waitlist.js', import.meta.url), 'utf8');

  for (const key of [
    'service_proof_pro_monthly',
    'team_proof_os_monthly',
    'facility_cpo_pilot_monthly',
    'verified_manufacturer_cards_monthly',
    'distributor_counter_mode_monthly',
    'training_partner_layer_monthly',
  ]) assert.match(data, new RegExp(`planKey: "${key}"`));

  assert.match(data, /Not self-serve/);
  assert.match(app, /source: 'paid-lane-request'/);
  assert.match(app, /\/api\/waitlist/);
  assert.match(waitlist, /No payment was taken/);
  assert.match(waitlist, /paid_lane_request_confirmation/);
  assert.match(waitlist, /waitlist:\$\{email\}:/);
  assert.match(waitlist, /deduplicated: true/);
});
