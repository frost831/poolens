import assert from 'node:assert/strict';
import test from 'node:test';

import { outboundStoreKey, paidFulfillmentGaps } from '../functions/_shared/checkout-safety.mjs';

function fulfillmentEnv(overrides = {}) {
  return {
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    SPLASHLENS_ENTITLEMENT_SECRET: 'entitlement-test-secret',
    SENDGRID_API_KEY: 'sendgrid-test-key',
    SCAN_USAGE_KV: { async put() {} },
    SPLASHLENS_CHECKOUT_MODE: 'payment_link_direct',
    SPLASHLENS_PAID_CHECKOUT_ENABLED: 'true',
    ...overrides,
  };
}

test('fails closed when activation dependencies or the release switch are absent', () => {
  assert.deepEqual(paidFulfillmentGaps({}).sort(), [
    'SCAN_USAGE_KV',
    'SENDGRID_API_KEY',
    'SPLASHLENS_ENTITLEMENT_SECRET',
    'SPLASHLENS_PAID_CHECKOUT_ENABLED',
    'STRIPE_WEBHOOK_SECRET',
  ]);
});

test('opens the release gate only when every fulfillment dependency exists', () => {
  assert.deepEqual(paidFulfillmentGaps(fulfillmentEnv()), []);
});

test('accepts the legacy vendor outbound parameter', () => {
  assert.equal(outboundStoreKey(new URL('https://app.splashlens.com/api/outbound?vendor=leslies&q=part')), 'leslies');
});

test('prefers the canonical store parameter over the compatibility alias', () => {
  assert.equal(outboundStoreKey(new URL('https://app.splashlens.com/api/outbound?store=web&vendor=leslies&q=part')), 'web');
});
