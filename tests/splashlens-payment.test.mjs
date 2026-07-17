import assert from 'node:assert/strict';
import test from 'node:test';

import { recordVerifiedSplashLensPayment } from '../functions/_shared/splashlens-payment.mjs';
import {
  resolveSplashLensPlan,
  splashLensAllowedPaymentLinkIds,
  splashLensCheckoutPrice,
  splashLensCheckoutPriceData,
  splashLensPaymentLinkUrl,
  splashLensPlanFromSession,
} from '../functions/_shared/splashlens-plans.mjs';

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

  const details = {
    source: 'stripe_webhook',
    planKey: 'partsnap_pro_monthly',
    feature: 'partsnap_pro',
    scopes: ['scan'],
  };
  const first = await recordVerifiedSplashLensPayment(env, session, details);
  const second = await recordVerifiedSplashLensPayment(env, session, details);

  assert.equal(first.stored, true);
  assert.equal(second.eventKey, first.eventKey);
  assert.equal(kv.records.size, 2);
  assert.ok(kv.records.has('payment:cs_live_example123'));
  const event = JSON.parse(kv.records.get(first.eventKey));
  const props = JSON.parse(event.propsJson);
  assert.equal(event.event, 'checkout_success');
  assert.equal(props.amount_total, 499);
  assert.equal(props.payment_source, 'stripe_webhook');
  assert.equal(props.plan_key, 'partsnap_pro_monthly');
  assert.equal(props.feature, 'partsnap_pro');
  assert.deepEqual(props.scopes, ['scan']);
});

test('does not claim storage without durable event storage', async () => {
  const result = await recordVerifiedSplashLensPayment({}, { id: 'cs_live_example123' });
  assert.deepEqual(result, { stored: false, reason: 'missing_event_storage' });
});

test('resolves live PartSnap plans and pilot proof plans from aliases', () => {
  assert.equal(resolveSplashLensPlan('monthly').key, 'partsnap_pro_monthly');
  assert.equal(resolveSplashLensPlan('annual').key, 'partsnap_pro_annual');
  assert.equal(resolveSplashLensPlan('service-proof-pro').key, 'service_proof_pro_monthly');
  assert.equal(resolveSplashLensPlan('team').displayName, 'Team Proof OS');
});

test('uses configured Stripe env vars for pilot checkout lanes', () => {
  const plan = resolveSplashLensPlan('facility-cpo');
  const env = {
    SPLASHLENS_STRIPE_PRICE_FACILITY_CPO_PILOT_MONTHLY: 'price_facility_123',
    SPLASHLENS_STRIPE_LINK_FACILITY_CPO_PILOT_MONTHLY: 'https://buy.stripe.com/facility',
    SPLASHLENS_STRIPE_PAYMENT_LINK_FACILITY_CPO_PILOT_MONTHLY_ID: 'plink_facility_123',
  };
  assert.equal(splashLensCheckoutPrice(env, plan), 'price_facility_123');
  assert.equal(splashLensPaymentLinkUrl(env, plan), 'https://buy.stripe.com/facility');
  assert.equal(splashLensAllowedPaymentLinkIds(env).get('plink_facility_123').key, 'facility_cpo_pilot_monthly');
});

test('has built-in recurring checkout price data for broader paid lanes', () => {
  const expected = [
    ['service_proof_pro_monthly', 1900],
    ['team_proof_os_monthly', 19900],
    ['facility_cpo_pilot_monthly', 9900],
    ['verified_manufacturer_cards_monthly', 50000],
    ['distributor_counter_mode_monthly', 19900],
    ['training_partner_layer_monthly', 19900],
  ];

  for (const [key, unitAmount] of expected) {
    const data = splashLensCheckoutPriceData(resolveSplashLensPlan(key));
    assert.equal(data.unitAmount, unitAmount);
    assert.equal(data.currency, 'usd');
    assert.equal(data.interval, 'month');
  }
});

test('maps a Stripe Payment Link session back to the right SplashLens plan', () => {
  const env = { SPLASHLENS_STRIPE_PAYMENT_LINK_SERVICE_PROOF_PRO_MONTHLY_ID: 'plink_service_proof_123' };
  const session = {
    id: 'cs_live_serviceproof',
    payment_link: 'plink_service_proof_123',
    amount_total: 1900,
    metadata: {},
  };
  assert.equal(splashLensPlanFromSession(session, env).key, 'service_proof_pro_monthly');
});
