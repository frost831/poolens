import assert from 'node:assert/strict';
import test from 'node:test';

import { refundedEntitlementDecision } from '../functions/_shared/splashlens-refund.mjs';

function event(paymentIntentId, overrides = {}) {
  return {
    id: 'evt_refund_test',
    data: {
      object: {
        id: 'ch_refund_test',
        refunded: true,
        amount: 1900,
        amount_refunded: 1900,
        payment_intent: paymentIntentId,
        billing_details: { email: 'buyer@example.com' },
        ...overrides,
      },
    },
  };
}

test('full refund revokes only the entitlement tied to that PaymentIntent', async () => {
  const entitlement = {
    plan: 'Service Proof Pro',
    stripePaymentIntentId: 'pi_paid_fixture',
  };
  const result = refundedEntitlementDecision(event('pi_paid_fixture').data.object, entitlement);
  assert.equal(result.action, 'entitlement_revoked_after_full_refund');
  assert.equal(result.shouldRevoke, true);
});

test('partial refund and an older payment cannot remove current access', async () => {
  const entitlement = { stripePaymentIntentId: 'pi_current' };
  const partialResult = refundedEntitlementDecision(
    event('pi_current', { refunded: false, amount_refunded: 500 }).data.object,
    entitlement,
  );
  assert.equal(partialResult.action, 'ignored_partial_or_incomplete_refund');
  assert.equal(partialResult.shouldRevoke, false);

  const staleResult = refundedEntitlementDecision(event('pi_older').data.object, entitlement);
  assert.equal(staleResult.action, 'refund_did_not_match_current_entitlement');
  assert.equal(staleResult.shouldRevoke, false);
});
