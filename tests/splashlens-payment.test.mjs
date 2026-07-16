import assert from 'node:assert/strict';
import test from 'node:test';

import { recordVerifiedSplashLensPayment } from '../functions/_shared/splashlens-payment.mjs';

function fakeKv() {
  const records = new Map();
  return {
    records,
    async put(key, value) {
      records.set(key, value);
    },
  };
}

test('stores one deterministic conversion event per verified Stripe session', async () => {
  const kv = fakeKv();
  const env = { SCAN_USAGE_KV: kv };
  const session = {
    id: 'cs_live_example123',
    created: 1784203200,
    amount_total: 499,
    currency: 'usd',
    customer: 'cus_example',
    customer_details: { email: 'tech@example.com' },
    metadata: { plan: 'PartSnap Pro Monthly' },
  };

  const first = await recordVerifiedSplashLensPayment(env, session, { source: 'stripe_webhook' });
  const second = await recordVerifiedSplashLensPayment(env, session, { source: 'stripe_webhook' });

  assert.equal(first.stored, true);
  assert.equal(second.eventKey, first.eventKey);
  assert.equal(kv.records.size, 2);
  assert.ok(kv.records.has('payment:cs_live_example123'));
  const event = JSON.parse(kv.records.get(first.eventKey));
  const props = JSON.parse(event.propsJson);
  assert.equal(event.event, 'checkout_success');
  assert.equal(props.amount_total, 499);
  assert.equal(props.payment_source, 'stripe_webhook');
});

test('does not claim storage without durable event storage', async () => {
  const result = await recordVerifiedSplashLensPayment({}, { id: 'cs_live_example123' });
  assert.deepEqual(result, { stored: false, reason: 'missing_event_storage' });
});
