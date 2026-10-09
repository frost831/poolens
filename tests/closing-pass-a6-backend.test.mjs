import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet as catalog, onRequestPost as checkout } from '../functions/api/checkout.js';
import { onRequestGet as checkoutSuccess } from '../functions/api/checkout-success.js';
import { onRequestPost as webhook } from '../functions/api/stripe-webhook.js';
import { grantClosingPass } from '../functions/_shared/closing-pass.mjs';

const secret = 'a6-closing-pass-entitlement-secret-long-enough';
const webhookSecret = 'whsec_a6_test';
const sessionId = 'cs_test_closing123';
const reference = 'sl_checkout_5d46a1e0-a882-4c96-9c93-6558d2e34149';
const paidAt = Math.floor(Date.now() / 1000) - 30;

function d1() {
  const sqlite = new DatabaseSync(':memory:');
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return {
        bind(...values) {
          return {
            async run() { return { meta: { changes: statement.run(...values).changes } }; },
            async first() { return statement.get(...values) || null; },
          };
        },
        async run() { return { meta: { changes: statement.run().changes } }; },
        async first() { return statement.get() || null; },
      };
    },
  };
}

function kv() {
  const records = new Map();
  const writes = [];
  return {
    records, writes,
    async get(key) { return records.get(key) || null; },
    async put(key, value, options) { writes.push({ key, value, options }); records.set(key, value); },
    async delete(key) { records.delete(key); },
  };
}

function passSession(overrides = {}) {
  return {
    id: sessionId, mode: 'payment', status: 'complete', payment_status: 'paid',
    currency: 'usd', amount_total: 4900, subscription: null, customer: null,
    customer_details: { email: 'closer@example.com' }, payment_intent: 'pi_closing123',
    client_reference_id: reference,
    metadata: {
      product: 'splashlens', feature: 'scanner', plan: 'SplashLens Closing Pro 60-Day Pass',
      plan_key: 'closing_pass_60d', pass_amount_cents: '4900', source: 'app', placement: 'closing_completed', store: 'web',
    },
    ...overrides,
  };
}

function env() {
  return {
    STRIPE_SECRET_KEY: 'sk_test_a6', SPLASHLENS_ENTITLEMENT_SECRET: secret,
    SPLASHLENS_STRIPE_WEBHOOK_SECRET: webhookSecret,
    SPLASHLENS_CLOSING_PASS_60D_AMOUNT_CENTS: '4900',
    SUBSCRIBERS_DB: d1(), SCAN_USAGE_KV: kv(),
  };
}

function stripeFetch(t, session = passSession()) {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const path = String(url);
    if (path.endsWith(`/checkout/sessions/${sessionId}`)) return Response.json(session);
    if (path.endsWith('/payment_intents/pi_closing123')) {
      return Response.json({ id: 'pi_closing123', status: 'succeeded', currency: 'usd', amount_received: 4900, latest_charge: 'ch_closing123' });
    }
    if (path.endsWith('/charges/ch_closing123')) {
      return Response.json({ id: 'ch_closing123', payment_intent: 'pi_closing123', paid: true, status: 'succeeded', currency: 'usd', amount: 4900, created: paidAt, refunded: false });
    }
    throw new Error(`Unexpected Stripe request ${path}`);
  });
}

function signedWebhook(session, type = 'checkout.session.completed', id = 'evt_a6pass1') {
  const body = JSON.stringify({ id, type, data: { object: session } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', webhookSecret).update(`${timestamp}.${body}`).digest('hex');
  return new Request('https://app.splashlens.com/api/stripe-webhook', {
    method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, body,
  });
}

test('unset or invalid pass amount hides catalog and blocks checkout', async () => {
  for (const amount of [undefined, '0', '99', '14901', '49.00', 'not-a-price']) {
    const configuration = env();
    configuration.SPLASHLENS_CLOSING_PASS_60D_AMOUNT_CENTS = amount;
    const response = await catalog({ request: new Request('https://app.splashlens.com/api/checkout?catalog=1'), env: configuration });
    const plans = (await response.json()).plans;
    assert.equal(plans.some(plan => plan.key === 'closing_pass_60d'), false);
    assert.equal(plans.find(plan => plan.key === 'partsnap_pro_monthly').priceLabel, '$19/month');
    assert.equal(plans.find(plan => plan.key === 'partsnap_pro_yearly').priceLabel, '$149/year');
    const blocked = await checkout({ request: passCheckoutRequest(), env: configuration });
    assert.equal(blocked.status, 503);
    configuration.SUBSCRIBERS_DB.sqlite.close();
  }
});

function passCheckoutRequest(overrides = {}) {
  return new Request('https://app.splashlens.com/api/checkout', {
    method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Safari/605.1' },
    body: JSON.stringify({ plan: 'closing_pass_60d', store: 'web', source: 'app',
      placement: 'closing_completed', client_reference_id: reference, ...overrides }),
  });
}

test('configured pass appears in catalog and creates only a one-time web Stripe session', async (t) => {
  const configuration = env();
  const plans = (await (await catalog({ request: new Request('https://app.splashlens.com/api/checkout?catalog=1'), env: configuration })).json()).plans;
  assert.deepEqual(plans.find(plan => plan.key === 'closing_pass_60d'), {
    key: 'closing_pass_60d', label: 'SplashLens Closing Pro 60-Day Pass',
    priceLabel: '$49.00 one time / 60 days', amountCents: 4900, checkoutConfigured: true,
  });
  let params;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    params = new URLSearchParams(options.body);
    return Response.json({ id: sessionId, url: `https://checkout.stripe.com/c/pay/${sessionId}` });
  });
  const result = await checkout({ request: passCheckoutRequest(), env: configuration });
  assert.equal(result.status, 200);
  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '4900');
  assert.equal(params.get('line_items[0][price_data][currency]'), 'usd');
  assert.equal(params.get('metadata[plan_key]'), 'closing_pass_60d');
  assert.equal(params.get('metadata[pass_amount_cents]'), '4900');
  assert.equal(params.get('client_reference_id'), reference);
  assert.equal([...params.keys()].some(key => key.startsWith('subscription_data') || key.includes('[recurring]')), false);
  assert.equal(params.has('customer_creation'), false);
  for (const bad of [{ client_reference_id: '' }, { placement: '' }, { store: 'ios' }, { source: 'server' }]) {
    assert.equal((await checkout({ request: passCheckoutRequest(bad), env: configuration })).status, 400);
  }
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('signed webhook and checkout-success share an immutable 60-day guest entitlement in either order', async (t) => {
  stripeFetch(t);
  for (const order of ['webhook-first', 'success-first']) {
    const configuration = env();
    const success = () => checkoutSuccess({ request: new Request(`https://app.splashlens.com/api/checkout-success?session_id=${sessionId}`), env: configuration });
    const hook = () => webhook({ request: signedWebhook(passSession()), env: configuration });
    const responses = order === 'webhook-first' ? [await hook(), await success()] : [await success(), await hook()];
    assert.deepEqual(responses.map(response => response.status), [200, 200]);
    const row = configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT * FROM commercial_entitlements WHERE id = ?').get(`stripe:${sessionId}`);
    const expectedExpiry = new Date((paidAt + 60 * 24 * 60 * 60) * 1000).toISOString();
    assert.equal(row.current_period_end, expectedExpiry);
    assert.equal(row.email, 'closer@example.com');
    assert.equal(row.stripe_customer_id, '');
    const record = JSON.parse(configuration.SCAN_USAGE_KV.records.get('entitlement:closer@example.com'));
    assert.equal(record.expiresAt, expectedExpiry);
    const token = (await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook')).token;
    const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    assert.equal(tokenPayload.exp, paidAt + 60 * 24 * 60 * 60);
    assert.equal(configuration.SCAN_USAGE_KV.writes.some(write => write.key === 'entitlement_customer:'), false);
    const events = configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT event FROM events').all().map(row => row.event);
    assert.equal(events.filter(event => event === 'checkout_completed').length, 1);
    assert.equal(events.filter(event => event === 'entitlement_granted').length, 1);
    assert.equal(events.includes('subscription_created'), false);
    const replay = await hook();
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).duplicate, true);
    configuration.SUBSCRIBERS_DB.sqlite.close();
  }
});

test('paid asynchronous webhook grants only after a verified charge', async (t) => {
  stripeFetch(t);
  const configuration = env();
  const response = await webhook({ request: signedWebhook(passSession(), 'checkout.session.async_payment_succeeded', 'evt_paid_async'), env: configuration });
  assert.equal(response.status, 200);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM commercial_entitlements').get().n, 1);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('concurrent webhook and checkout-success create one pass row with one fixed expiry', async (t) => {
  stripeFetch(t);
  const configuration = env();
  const [hook, success] = await Promise.all([
    webhook({ request: signedWebhook(passSession(), 'checkout.session.completed', 'evt_race'), env: configuration }),
    checkoutSuccess({ request: new Request(`https://app.splashlens.com/api/checkout-success?session_id=${sessionId}`), env: configuration }),
  ]);
  assert.equal(hook.status, 200);
  assert.equal(success.status, 200);
  const rows = configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT current_period_end FROM commercial_entitlements').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].current_period_end, new Date((paidAt + 60 * 24 * 60 * 60) * 1000).toISOString());
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('unsigned, unpaid async, and mismatched signed payments cannot grant access', async (t) => {
  stripeFetch(t);
  const configuration = env();
  const badSignature = await webhook({ request: new Request('https://app.splashlens.com/api/stripe-webhook', {
    method: 'POST', headers: { 'stripe-signature': 't=1,v1=bad' }, body: JSON.stringify({ type: 'checkout.session.completed', data: { object: passSession() } }),
  }), env: configuration });
  assert.equal(badSignature.status, 400);
  const unpaid = await webhook({ request: signedWebhook(passSession({ payment_status: 'unpaid' }), 'checkout.session.async_payment_succeeded', 'evt_unpaid'), env: configuration });
  assert.equal((await unpaid.json()).reason, 'checkout_not_paid');
  const wrongAmount = await webhook({ request: signedWebhook(passSession({ amount_total: 5000 }), 'checkout.session.completed', 'evt_wrong_amount'), env: configuration });
  assert.equal(wrongAmount.status, 503);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM commercial_entitlements').get().n, 0);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('checkout-success fails closed on Stripe payment verification failure', async (t) => {
  const configuration = env();
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/checkout/sessions/')) return Response.json(passSession());
    return new Response('Stripe unavailable', { status: 503 });
  });
  const response = await checkoutSuccess({ request: new Request(`https://app.splashlens.com/api/checkout-success?session_id=${sessionId}`), env: configuration });
  assert.equal(response.status, 503);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='commercial_entitlements'").get(), undefined);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('pass grant refuses expired payment and cannot extend a previous paid expiry', async () => {
  const configuration = env();
  const first = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook');
  assert.equal(first.ok, true);
  const again = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_checkout_success');
  assert.equal(again.expiresAt, first.expiresAt);
  const expired = await grantClosingPass(passSession(), Math.floor(Date.now() / 1000) - 61 * 24 * 60 * 60, configuration, 'stripe_webhook');
  assert.equal(expired.ok, false);
  assert.equal(expired.status, 403);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});
