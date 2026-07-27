import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { onRequestPost as scanRequestPost } from '../functions/api/scan.js';

test('non-self-serve paid lanes are labeled and have a server lead path', async () => {
  const data = await readFile(new URL('../js/data.js', import.meta.url), 'utf8');
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const scan = await readFile(new URL('../functions/api/scan.js', import.meta.url), 'utf8');
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
  assert.match(app, /if \(isStoreShellMode\(\)\) \{/);
  assert.match(app, /Web subscriptions and paid pilots are not offered inside the app/);
  assert.match(app, /store_shell: getStoreShellMode\(\) \|\| ''/);
  assert.match(scan, /storeShell \? '' : '\/api\/checkout\?plan=monthly'/);
  assert.match(waitlist, /No payment was taken/);
  assert.match(waitlist, /paid_lane_request_confirmation/);
  assert.match(waitlist, /waitlist:\$\{email\}:/);
  assert.match(waitlist, /deduplicated: true/);
});

test('native store scan-limit responses omit web checkout upgrade links', async () => {
  const request = new Request('https://app.splashlens.com/api/scan', {
    method: 'POST',
    headers: {
      Origin: 'https://app.splashlens.com',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: `data:image/jpeg;base64,${Buffer.from('x').toString('base64')}`,
      mode: 'error_code',
      clientId: 'native-reviewer',
      store_shell: 'ios',
    }),
  });
  const env = {
    ANTHROPIC_API_KEY: 'test-key',
    SCAN_USAGE_KV: {
      async get() { return '10'; },
      async put() { throw new Error('put should not run after quota is reached'); },
    },
  };

  const response = await scanRequestPost({ request, env });
  const payload = await response.json();

  assert.equal(response.status, 429);
  assert.equal(payload.error, 'Free scan limit reached for this month.');
  assert.equal('upgrade' in payload, false);
});
