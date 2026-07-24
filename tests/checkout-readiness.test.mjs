import assert from 'node:assert/strict';
import test from 'node:test';

import { stripePaymentLinkStatus, stripeWebhookStatus } from '../functions/_shared/stripe-readiness.mjs';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('verifies the live Stripe webhook URL and fulfillment events', async () => {
  const result = await stripeWebhookStatus({ STRIPE_SECRET_KEY: 'sk_test_value' }, async () => jsonResponse({
    data: [{
      url: 'https://app.splashlens.com/api/stripe-webhook',
      status: 'enabled',
      enabled_events: [
        'checkout.session.completed',
        'checkout.session.async_payment_succeeded',
        'charge.refunded',
      ],
    }],
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.missingEvents, []);
});

test('fails readiness when the Stripe webhook misses a required event', async () => {
  const result = await stripeWebhookStatus({ STRIPE_SECRET_KEY: 'sk_test_value' }, async () => jsonResponse({
    data: [{
      url: 'https://app.splashlens.com/api/stripe-webhook',
      status: 'enabled',
      enabled_events: ['checkout.session.completed'],
    }],
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'missing_events');
  assert.deepEqual(result.missingEvents, ['checkout.session.async_payment_succeeded', 'charge.refunded']);
});

test('verifies configured Stripe Payment Links are active and match their public URLs', async () => {
  const env = {
    STRIPE_SECRET_KEY: 'sk_test_value',
    SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID: 'plink_monthly',
    SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID: 'plink_yearly',
  };
  const urls = {
    plink_monthly: 'https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O',
    plink_yearly: 'https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P',
  };
  const result = await stripePaymentLinkStatus(env, async (url) => {
    const id = url.split('/').pop();
    return jsonResponse({ active: true, url: urls[id] });
  });

  assert.equal(result.ok, true);
  assert.equal(result.configured, 2);
  assert.equal(result.active, 2);
});
