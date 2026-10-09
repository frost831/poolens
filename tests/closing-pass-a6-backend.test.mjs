import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet as catalog, onRequestPost as checkout } from '../functions/api/checkout.js';
import { onRequestGet as checkoutSuccess } from '../functions/api/checkout-success.js';
import { onRequestPost as scan } from '../functions/api/scan.js';
import { onRequestPost as restore } from '../functions/api/restore-entitlement.js';
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
  const db = d1();
  db.sqlite.exec(`CREATE TABLE closing_pass_checkouts (
    session_id TEXT PRIMARY KEY, amount_cents INTEGER NOT NULL, client_reference_id TEXT NOT NULL,
    payment_intent_id TEXT, charge_id TEXT, subject TEXT,
    status TEXT NOT NULL DEFAULT 'created', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.sqlite.prepare(`INSERT INTO closing_pass_checkouts (session_id, amount_cents, client_reference_id)
    VALUES (?, ?, ?)`).run(sessionId, 4900, reference);
  return {
    STRIPE_SECRET_KEY: 'sk_test_a6', SPLASHLENS_ENTITLEMENT_SECRET: secret,
    SPLASHLENS_STRIPE_WEBHOOK_SECRET: webhookSecret,
    SPLASHLENS_CLOSING_PASS_60D_AMOUNT_CENTS: '4900',
    SUBSCRIBERS_DB: db, SCAN_USAGE_KV: kv(),
  };
}

function stripeFetch(t, session = passSession(), chargePaidAt = paidAt) {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const path = String(url);
    if (path.endsWith(`/checkout/sessions/${sessionId}`)) return Response.json(session);
    if (path.endsWith('/payment_intents/pi_closing123')) {
      return Response.json({ id: 'pi_closing123', status: 'succeeded', currency: 'usd', amount_received: 4900, latest_charge: 'ch_closing123' });
    }
    if (path.endsWith('/charges/ch_closing123')) {
      return Response.json({ id: 'ch_closing123', payment_intent: 'pi_closing123', paid: true, status: 'succeeded', currency: 'usd', amount: 4900, created: chargePaidAt, refunded: false });
    }
    throw new Error(`Unexpected Stripe request ${path}`);
  });
}

function accountToken(email) {
  const now = Math.floor(Date.now() / 1000);
  const part = Buffer.from(JSON.stringify({ sub: email, scopes: ['account'], iat: now, exp: now + 600 })).toString('base64url');
  const signed = `sl_account_v1.${part}`;
  return `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
}

function restoreRequest(email = 'closer@example.com') {
  return new Request('https://app.splashlens.com/api/restore-entitlement', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken(email) },
    body: JSON.stringify({ email }),
  });
}

function scanRequest(token) {
  return new Request('https://app.splashlens.com/api/scan', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://app.splashlens.com', 'x-splashlens-entitlement-token': token },
    body: JSON.stringify({ image: 'AQID', mode: 'error_code' }),
  });
}

function signedScanToken(payload) {
  const part = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signed = `sl_scan_v1.${part}`;
  return `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
}

function scanFetch(t) {
  t.mock.method(console, 'info', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    return Response.json({ content: [{ text: '{"codes":["E01"],"brand":null,"model":null,"context":"Test","confidence":"high"}' }] });
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
  configuration.SUBSCRIBERS_DB.sqlite.prepare('DELETE FROM closing_pass_checkouts').run();
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
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT amount_cents FROM closing_pass_checkouts WHERE session_id = ?').get(sessionId).amount_cents, 4900);
  const noDb = await checkout({ request: passCheckoutRequest(), env: {
    STRIPE_SECRET_KEY: 'sk_test_a6', SPLASHLENS_CLOSING_PASS_60D_AMOUNT_CENTS: '4900',
  } });
  assert.equal(noDb.status, 503);
  for (const bad of [{ client_reference_id: '' }, { placement: '' }, { store: 'ios' }, { source: 'server' }]) {
    assert.equal((await checkout({ request: passCheckoutRequest(bad), env: configuration })).status, 400);
  }
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('paid original checkout price survives config change, but missing or mismatched receipt fails closed', async (t) => {
  stripeFetch(t);
  const configuration = env();
  configuration.SPLASHLENS_CLOSING_PASS_60D_AMOUNT_CENTS = '5900';
  const request = () => new Request(`https://app.splashlens.com/api/checkout-success?session_id=${sessionId}`);
  assert.equal((await checkoutSuccess({ request: request(), env: configuration })).status, 200);
  configuration.SUBSCRIBERS_DB.sqlite.prepare('DELETE FROM commercial_entitlements').run();
  configuration.SUBSCRIBERS_DB.sqlite.prepare('DELETE FROM closing_pass_checkouts').run();
  assert.equal((await checkoutSuccess({ request: request(), env: configuration })).status, 503);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM commercial_entitlements').get().n, 0);
  configuration.SUBSCRIBERS_DB.sqlite.prepare(`INSERT INTO closing_pass_checkouts (session_id, amount_cents, client_reference_id)
    VALUES (?, ?, ?)`).run(sessionId, 5900, reference);
  assert.equal((await checkoutSuccess({ request: request(), env: configuration })).status, 503);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM commercial_entitlements').get().n, 0);
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
    const chargeMapping = configuration.SCAN_USAGE_KV.writes.find(write => write.key === 'closing_pass_charge:ch_closing123');
    assert.ok(chargeMapping.options.expirationTtl > 0 && chargeMapping.options.expirationTtl <= 60 * 24 * 60 * 60);
    const token = (await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook', 'ch_closing123')).token;
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
  const first = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook', 'ch_closing123');
  assert.equal(first.ok, true);
  const again = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_checkout_success', 'ch_closing123');
  assert.equal(again.expiresAt, first.expiresAt);
  const expired = await grantClosingPass(passSession(), Math.floor(Date.now() / 1000) - 61 * 24 * 60 * 60, configuration, 'stripe_webhook', 'ch_closing123');
  assert.equal(expired.ok, false);
  assert.equal(expired.status, 403);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('pass scan requires its own active D1 session row, plan, and future end date', async (t) => {
  scanFetch(t);
  const configuration = env();
  configuration.ANTHROPIC_API_KEY = 'test_key';
  const granted = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook', 'ch_closing123');
  assert.equal(granted.ok, true);
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 200);
  const oldSubscriptionToken = signedScanToken({
    sub: 'closer@example.com', plan: 'Splash Lens Pro Unlimited Monthly', scopes: ['scan'],
    source: 'stripe_webhook', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 365 * 86400,
  });
  assert.equal((await scan({ request: scanRequest(oldSubscriptionToken), env: configuration })).status, 403);
  const db = configuration.SUBSCRIBERS_DB.sqlite;
  db.prepare('UPDATE commercial_entitlements SET stripe_session_id = ? WHERE id = ?').run('cs_test_other123', `stripe:${sessionId}`);
  db.prepare(`INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, current_period_end)
    VALUES (?, ?, 'pro', ?, 'active', 'stripe_webhook', ?, ?)`).run('stripe:other', 'closer@example.com', 'Splash Lens Pro Unlimited Monthly', 'cs_test_subscription', new Date(Date.now() + 365 * 86400_000).toISOString());
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
  db.prepare('UPDATE commercial_entitlements SET stripe_session_id = ?, plan = ? WHERE id = ?').run(sessionId, 'Splash Lens Pro Unlimited Monthly', `stripe:${sessionId}`);
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
  db.prepare('UPDATE commercial_entitlements SET plan = ?, current_period_end = ? WHERE id = ?')
    .run('SplashLens Closing Pro 60-Day Pass', new Date(Date.now() - 1000).toISOString(), `stripe:${sessionId}`);
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
  db.close();
});

test('KV-only pass scan checks exact session, source, plan, and expiry', async (t) => {
  scanFetch(t);
  const configuration = env();
  configuration.ANTHROPIC_API_KEY = 'test_key';
  const granted = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_checkout_success', 'ch_closing123');
  configuration.SUBSCRIBERS_DB.sqlite.close();
  delete configuration.SUBSCRIBERS_DB;
  const key = 'entitlement:closer@example.com';
  const original = configuration.SCAN_USAGE_KV.records.get(key);
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 200);
  const oldSubscriptionToken = signedScanToken({
    sub: 'closer@example.com', plan: 'Splash Lens Pro Unlimited Monthly', scopes: ['scan'],
    source: 'stripe_webhook', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 365 * 86400,
  });
  assert.equal((await scan({ request: scanRequest(oldSubscriptionToken), env: configuration })).status, 403);
  for (const mutation of [
    { stripeSessionId: 'cs_test_other123' },
    { plan: 'Splash Lens Pro Unlimited Monthly' },
    { expiresAt: new Date(Date.now() - 1000).toISOString() },
    { source: 'admin_grant' },
  ]) {
    configuration.SCAN_USAGE_KV.records.set(key, JSON.stringify({ ...JSON.parse(original), ...mutation }));
    assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
  }
});

test('restored pass retains paid expiry and remaining KV TTL; expired D1 and KV passes cannot revive', async (t) => {
  scanFetch(t);
  const configuration = env();
  configuration.ANTHROPIC_API_KEY = 'test_key';
  const granted = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook', 'ch_closing123');
  const response = await restore({ request: restoreRequest(), env: configuration });
  assert.equal(response.status, 200);
  const restored = await response.json();
  const payload = JSON.parse(Buffer.from(restored.token.split('.')[1], 'base64url').toString());
  assert.equal(payload.exp, paidAt + 60 * 24 * 60 * 60);
  assert.equal(payload.stripeSessionId, sessionId);
  assert.equal((await scan({ request: scanRequest(restored.token), env: configuration })).status, 200);
  const dbBinding = configuration.SUBSCRIBERS_DB;
  delete configuration.SUBSCRIBERS_DB;
  assert.equal((await scan({ request: scanRequest(restored.token), env: configuration })).status, 200);
  configuration.SUBSCRIBERS_DB = dbBinding;
  const kvWrite = configuration.SCAN_USAGE_KV.writes.filter(write => write.key === 'entitlement:closer@example.com').at(-1);
  assert.equal(JSON.parse(kvWrite.value).expiresAt, granted.expiresAt);
  assert.ok(kvWrite.options.expirationTtl > 0 && kvWrite.options.expirationTtl <= 60 * 24 * 60 * 60);
  configuration.SUBSCRIBERS_DB.sqlite.prepare('UPDATE commercial_entitlements SET current_period_end = ? WHERE id = ?')
    .run(new Date(Date.now() - 1000).toISOString(), `stripe:${sessionId}`);
  const writesBefore = configuration.SCAN_USAGE_KV.writes.length;
  assert.equal((await restore({ request: restoreRequest(), env: configuration })).status, 404);
  assert.equal(configuration.SCAN_USAGE_KV.writes.length, writesBefore);
  configuration.SUBSCRIBERS_DB.sqlite.close();
  delete configuration.SUBSCRIBERS_DB;
  configuration.SCAN_USAGE_KV.records.set('entitlement:closer@example.com', JSON.stringify({
    subject: 'closer@example.com', plan: 'SplashLens Closing Pro 60-Day Pass', source: 'stripe_webhook',
    stripeSessionId: sessionId, expiresAt: new Date(Date.now() - 1000).toISOString(),
  }));
  assert.equal((await restore({ request: restoreRequest(), env: configuration })).status, 404);
});

test('verified expired-pass webhook is acknowledged once without grant or retries', async (t) => {
  stripeFetch(t, passSession(), Math.floor(Date.now() / 1000) - 61 * 24 * 60 * 60);
  const configuration = env();
  const first = await webhook({ request: signedWebhook(passSession(), 'checkout.session.completed', 'evt_expired_pass'), env: configuration });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).reason, 'closing_pass_expired');
  const retry = await webhook({ request: signedWebhook(passSession(), 'checkout.session.completed', 'evt_expired_pass'), env: configuration });
  assert.equal((await retry.json()).duplicate, true);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM commercial_entitlements').get().n, 0);
  assert.equal(configuration.SCAN_USAGE_KV.writes.length, 0);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('signed partial refund revokes only its pass; a separate subscription remains usable', async (t) => {
  scanFetch(t);
  const configuration = env();
  configuration.ANTHROPIC_API_KEY = 'test_key';
  const granted = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook', 'ch_closing123');
  const db = configuration.SUBSCRIBERS_DB.sqlite;
  configuration.SUBSCRIBERS_DB.batch = async (statements) => {
    db.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      db.exec('COMMIT');
      return results;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  db.prepare(`INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, current_period_end)
    VALUES (?, ?, 'pro', ?, 'active', 'stripe_webhook', ?, ?)`)
    .run('stripe:subscription', 'closer@example.com', 'Splash Lens Pro Unlimited Monthly', 'cs_test_subscription', new Date(Date.now() + 30 * 86400_000).toISOString());
  const response = await webhook({ request: signedWebhook({
    id: 'ch_closing123', payment_intent: 'pi_closing123', amount_refunded: 100, refunded: false,
  }, 'charge.refunded', 'evt_pass_refund'), env: configuration });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).closingPassRevoked, true);
  assert.equal(db.prepare('SELECT status FROM commercial_entitlements WHERE id = ?').get(`stripe:${sessionId}`).status, 'refunded');
  assert.equal(db.prepare('SELECT status FROM commercial_entitlements WHERE id = ?').get('stripe:subscription').status, 'active');
  assert.equal(configuration.SCAN_USAGE_KV.records.has('entitlement:closer@example.com'), false);
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
  assert.equal((await restore({ request: restoreRequest(), env: configuration })).status, 200);
  const subscriptionToken = signedScanToken({
    sub: 'closer@example.com', plan: 'Splash Lens Pro Unlimited Monthly', scopes: ['scan'],
    source: 'stripe_webhook', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400,
  });
  assert.equal((await scan({ request: scanRequest(subscriptionToken), env: configuration })).status, 200);
  const retry = await webhook({ request: signedWebhook({ id: 'ch_closing123', payment_intent: 'pi_closing123' }, 'charge.refunded', 'evt_pass_refund'), env: configuration });
  assert.equal((await retry.json()).duplicate, true);
  const lateCompletion = await webhook({ request: signedWebhook(passSession(), 'checkout.session.completed', 'evt_late_completion'), env: configuration });
  assert.equal(lateCompletion.status, 200);
  assert.equal((await lateCompletion.json()).reason, 'closing_pass_refunded');
  db.close();
});

test('signed dispute revokes pass without deleting an unrelated KV subscription', async (t) => {
  scanFetch(t);
  const configuration = env();
  configuration.ANTHROPIC_API_KEY = 'test_key';
  const granted = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_checkout_success', 'ch_closing123');
  const key = 'entitlement:closer@example.com';
  const subscriptionRecord = JSON.stringify({
    subject: 'closer@example.com', plan: 'Splash Lens Pro Unlimited Monthly', source: 'stripe_webhook',
    expiresAt: new Date(Date.now() + 86400_000).toISOString(),
  });
  configuration.SCAN_USAGE_KV.records.set(key, subscriptionRecord);
  const response = await webhook({ request: signedWebhook({
    id: 'du_closing123', charge: 'ch_closing123', payment_intent: 'pi_closing123',
  }, 'charge.dispute.created', 'evt_pass_dispute'), env: configuration });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'disputed');
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT status FROM commercial_entitlements WHERE id = ?').get(`stripe:${sessionId}`).status, 'disputed');
  assert.equal(configuration.SCAN_USAGE_KV.records.get(key), subscriptionRecord);
  configuration.SUBSCRIBERS_DB.sqlite.close();
  delete configuration.SUBSCRIBERS_DB;
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
});

test('refund during a D1 outage blocks KV access and asks Stripe to retry', async (t) => {
  scanFetch(t);
  const configuration = env();
  configuration.ANTHROPIC_API_KEY = 'test_key';
  const granted = await grantClosingPass(passSession(), paidAt, configuration, 'stripe_webhook', 'ch_closing123');
  const dbBinding = configuration.SUBSCRIBERS_DB;
  delete configuration.SUBSCRIBERS_DB;
  const refund = () => signedWebhook({ id: 'ch_closing123', payment_intent: 'pi_closing123', amount_refunded: 100 }, 'charge.refunded', 'evt_outage_refund');
  assert.equal((await webhook({ request: refund(), env: configuration })).status, 503);
  assert.equal((await scan({ request: scanRequest(granted.token), env: configuration })).status, 403);
  configuration.SUBSCRIBERS_DB = dbBinding;
  assert.equal((await webhook({ request: refund(), env: configuration })).status, 200);
  assert.equal(dbBinding.sqlite.prepare('SELECT status FROM commercial_entitlements WHERE id = ?').get(`stripe:${sessionId}`).status, 'refunded');
  dbBinding.sqlite.close();
});

test('a refunded or disputed charge cannot activate a pass for the first time', async (t) => {
  const configuration = env();
  let chargeState = { amount_refunded: 100, refunded: false, disputed: false };
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/checkout/sessions/')) return Response.json(passSession());
    if (String(url).includes('/payment_intents/')) {
      return Response.json({ id: 'pi_closing123', status: 'succeeded', currency: 'usd', amount_received: 4900, latest_charge: 'ch_closing123' });
    }
    return Response.json({ id: 'ch_closing123', payment_intent: 'pi_closing123', paid: true, status: 'succeeded',
      currency: 'usd', amount: 4900, created: paidAt, ...chargeState });
  });
  const request = () => new Request(`https://app.splashlens.com/api/checkout-success?session_id=${sessionId}`);
  assert.equal((await checkoutSuccess({ request: request(), env: configuration })).status, 503);
  chargeState = { amount_refunded: 0, refunded: false, disputed: true };
  assert.equal((await checkoutSuccess({ request: request(), env: configuration })).status, 503);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='commercial_entitlements'").get(), undefined);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});
