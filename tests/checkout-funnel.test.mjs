import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { onRequestGet as checkout } from '../functions/api/checkout.js';
import { onRequestGet as checkoutSuccess } from '../functions/api/checkout-success.js';
import { onRequestPost as restoreEntitlement } from '../functions/api/restore-entitlement.js';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const entitlementSecret = 'checkout-funnel-test-secret-is-long-enough';

function accountToken(email) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: email, scopes: ['account'], iat: now, exp: now + 600,
  })).toString('base64url');
  const signed = `sl_account_v1.${payload}`;
  return `${signed}.${createHmac('sha256', entitlementSecret).update(signed).digest('base64url')}`;
}

function stripeSession() {
  return {
    id: 'cs_live_valid123',
    mode: 'subscription',
    subscription: 'sub_valid123',
    payment_status: 'paid',
    customer: 'cus_valid123',
    customer_details: { email: 'tech@example.com' },
    metadata: { product: 'splashlens', feature: 'scanner', plan: 'Splash Lens Pro Unlimited Monthly' },
  };
}

test('Pro checkout creates a live subscription route with product metadata and a success handoff', async (t) => {
  let params;
  const recorded = [];
  const db = {
    prepare(sql) {
      return {
        async run() { recorded.push({ sql, values: [] }); },
        bind(...values) {
          return { async run() { recorded.push({ sql, values }); } };
        },
      };
    },
  };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    params = new URLSearchParams(options.body);
    return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_live_valid123' });
  });
  const response = await checkout({
    request: new Request('https://app.splashlens.com/api/checkout?plan=monthly'),
    env: { STRIPE_SECRET_KEY: 'sk_test_placeholder', SPLASHLENS_APP_ORIGIN: 'https://app.splashlens.com', SUBSCRIBERS_DB: db },
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('X-SplashLens-Checkout-Mode'), 'stripe_checkout_session');
  assert.match(response.headers.get('Location'), /^https:\/\/checkout\.stripe\.com\//);
  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('metadata[product]'), 'splashlens');
  assert.equal(params.get('metadata[feature]'), 'scanner');
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '2900');
  assert.equal(params.get('success_url'), 'https://app.splashlens.com/api/checkout-success?session_id={CHECKOUT_SESSION_ID}');
  assert.deepEqual(recorded.filter((entry) => entry.sql.includes("VALUES ('checkout_started'"))[0]?.values, ['monthly', 'stripe_checkout_session', '']);
});

test('failed checkout does not report a start', async (t) => {
  const recorded = [];
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 503 }));
  const response = await checkout({
    request: new Request('https://app.splashlens.com/api/checkout?plan=monthly'),
    env: {
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      SUBSCRIBERS_DB: { prepare(sql) { recorded.push(sql); return { run: async () => ({}) }; } },
    },
  });
  assert.equal(response.status, 503);
  assert.equal(recorded.length, 0);
});

test('an old paid checkout cannot reactivate a canceled subscription', async (t) => {
  const writes = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/checkout/sessions/')) return Response.json(stripeSession());
    if (String(url).includes('/subscriptions/')) return Response.json({ status: 'canceled' });
    throw new Error(`Unexpected Stripe request: ${url}`);
  });
  const response = await checkoutSuccess({
    request: new Request('https://app.splashlens.com/api/checkout-success?session_id=cs_live_valid123'),
    env: {
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      SPLASHLENS_ENTITLEMENT_SECRET: entitlementSecret,
      SCAN_USAGE_KV: { async put(...args) { writes.push(args); }, async delete(key) { writes.push(key); } },
    },
  });
  assert.equal(response.status, 403);
  assert.equal(writes.length, 0);
});

test('active paid checkout issues a signed token that a verified account can restore', async (t) => {
  const kv = new Map();
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/checkout/sessions/')) return Response.json(stripeSession());
    if (String(url).includes('/subscriptions/')) return Response.json({ status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 2592000 });
    throw new Error(`Unexpected Stripe request: ${url}`);
  });
  const env = {
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    SPLASHLENS_ENTITLEMENT_SECRET: entitlementSecret,
    SCAN_USAGE_KV: {
      async get(key) { return kv.get(key) || null; },
      async put(key, value) { kv.set(key, value); },
      async delete(key) { kv.delete(key); },
    },
  };
  const success = await checkoutSuccess({
    request: new Request('https://app.splashlens.com/api/checkout-success?session_id=cs_live_valid123'), env,
  });
  assert.equal(success.status, 200);
  assert.match(await success.text(), /scan_token=sl_scan_v1\./);
  assert.equal(JSON.parse(kv.get('entitlement:tech@example.com')).stripeSessionId, 'cs_live_valid123');

  const restored = await restoreEntitlement({
    request: new Request('https://app.splashlens.com/api/restore-entitlement', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken('tech@example.com') },
      body: JSON.stringify({ email: 'tech@example.com' }),
    }),
    env,
  });
  assert.equal(restored.status, 200);
  assert.match((await restored.json()).token, /^sl_scan_v1\./);
});

test('every web upgrade entry records checkout intent, and zero-result lookups do not count impressions', () => {
  assert.match(app, /trackCheckoutIntent\('monthly','scan_limit_reached'\)/);
  assert.match(app, /trackCheckoutIntent\('yearly','scan_limit_reached'\)/);
  assert.match(app, /placement: 'paid_lane'/);
  assert.match(app, /function trackCheckoutIntent\(plan, placement\) \{\s*trackSplashLensEvent\('checkout_click'/);
  const lookup = app.slice(app.indexOf('function renderManualLookupUpgradeOffer'), app.indexOf('function renderStripResult'));
  assert.match(lookup, /if \(resultCount <= 0 \|\| isPartSnapPro\(\) \|\| isStoreShellMode\(\)\) return '';/);
});
