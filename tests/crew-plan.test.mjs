import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet as catalog, onRequestPost as checkout } from '../functions/api/checkout.js';
import { onRequestGet as checkoutSuccess } from '../functions/api/checkout-success.js';
import { onRequestPost as webhook } from '../functions/api/stripe-webhook.js';
import { onRequestPost as team } from '../functions/api/team.js';

const secret = 'crew-plan-entitlement-secret-long-enough';
const webhookSecret = 'whsec_crew_test';
const priceId = 'price_testCrewMonthly';
const reference = 'sl_checkout_5d46a1e0-a882-4c96-9c93-6558d2e34149';
const sessionId = 'cs_test_crew123';
const lead = 'lead@example.com';

function d1() {
  const sqlite = new DatabaseSync(':memory:', { enableDoubleQuotedStringLiterals: true });
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      const wrap = (values) => ({
        async run() { return { meta: { changes: statement.run(...values).changes } }; },
        async first() { return statement.get(...values) || null; },
        async all() { return { results: statement.all(...values) }; },
      });
      return {
        bind(...values) { return wrap(values); },
        async run() { return wrap([]).run(); },
        async first() { return wrap([]).first(); },
        async all() { return wrap([]).all(); },
      };
    },
  };
}

function env(extra = {}) {
  return {
    STRIPE_SECRET_KEY: 'sk_test_crew',
    SPLASHLENS_ENTITLEMENT_SECRET: secret,
    SPLASHLENS_STRIPE_WEBHOOK_SECRET: webhookSecret,
    SPLASHLENS_STRIPE_PRICE_CREW_MONTHLY: priceId,
    SUBSCRIBERS_DB: d1(),
    SCAN_USAGE_KV: { async put() {}, async delete() {} },
    ...extra,
  };
}

function accountToken(email) {
  const now = Math.floor(Date.now() / 1000);
  const part = Buffer.from(JSON.stringify({ sub: email, scopes: ['account'], iat: now, exp: now + 600 })).toString('base64url');
  const signed = `sl_account_v1.${part}`;
  return `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
}

function checkoutRequest() {
  return new Request('https://app.splashlens.com/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Safari/605.1' },
    body: JSON.stringify({
      plan: 'crew_monthly', store: 'web', source: 'app', placement: 'paid_lane', client_reference_id: reference,
    }),
  });
}

function crewSession() {
  return {
    id: sessionId,
    mode: 'subscription',
    status: 'complete',
    payment_status: 'paid',
    currency: 'usd',
    amount_total: 3900,
    subscription: 'sub_crew123',
    customer: 'cus_crew123',
    customer_details: { email: lead },
    client_reference_id: reference,
    metadata: {
      product: 'splashlens',
      feature: 'scanner',
      plan: 'SplashLens Crew',
      plan_key: 'crew_monthly',
      seat_limit: '4',
      source: 'app',
      placement: 'paid_lane',
      store: 'web',
    },
  };
}

function crewSubscription(overrides = {}) {
  return {
    id: 'sub_crew123',
    status: 'active',
    customer: 'cus_crew123',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    items: {
      data: [{
        price: {
          id: priceId,
          unit_amount: 3900,
          currency: 'usd',
          recurring: { interval: 'month', interval_count: 1 },
        },
      }],
    },
    ...overrides,
  };
}

function signedWebhook(object, type, id) {
  const body = JSON.stringify({ id, type, data: { object } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', webhookSecret).update(`${timestamp}.${body}`).digest('hex');
  return new Request('https://app.splashlens.com/api/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` },
    body,
  });
}

test('Crew stays off without its price ID and does not create a Stripe session', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(String(url));
    return Response.json({});
  });
  const configuration = env({ SPLASHLENS_STRIPE_PRICE_CREW_MONTHLY: '' });
  const plans = (await (await catalog({
    request: new Request('https://app.splashlens.com/api/checkout?catalog=1'),
    env: configuration,
  })).json()).plans;
  const crew = plans.find(plan => plan.key === 'crew_monthly');
  assert.equal(crew.priceLabel, '$39/month');
  assert.equal(crew.amountCents, 3900);
  assert.equal(crew.seatLimit, 4);
  assert.equal(crew.seatSummary, '1 lead + up to 3 techs');
  assert.equal(crew.checkoutConfigured, false);
  assert.equal(plans.find(plan => plan.key === 'partsnap_pro_monthly').priceLabel, '$19/month');
  assert.equal(plans.find(plan => plan.key === 'partsnap_pro_yearly').priceLabel, '$149/year');
  assert.equal(plans.find(plan => plan.key === 'closing_pass_60d').priceLabel, '$29 one time / 60 days');
  assert.equal(plans.find(plan => plan.key === 'team_proof_os_monthly').priceLabel, '$49-79/owner/month; techs free');
  assert.equal(plans.findIndex(plan => plan.key === 'crew_monthly') < plans.findIndex(plan => plan.key === 'team_proof_os_monthly'), true);
  assert.equal((await checkout({ request: checkoutRequest(), env: configuration })).status, 503);
  assert.equal(calls.length, 0);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('Crew checkout uses only the configured monthly price', async (t) => {
  const configuration = env();
  const plans = (await (await catalog({
    request: new Request('https://app.splashlens.com/api/checkout?catalog=1'),
    env: configuration,
  })).json()).plans;
  assert.equal(plans.find(plan => plan.key === 'crew_monthly').checkoutConfigured, true);
  let params;
  let created = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (String(url).endsWith(`/prices/${priceId}`)) {
      return Response.json({
        id: priceId, active: true, currency: 'usd', unit_amount: 3900, type: 'recurring',
        recurring: { interval: 'month', interval_count: 1 },
      });
    }
    created += 1;
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    params = new URLSearchParams(options.body);
    return Response.json({ id: sessionId, url: `https://checkout.stripe.com/c/pay/${sessionId}` });
  });
  const result = await checkout({ request: checkoutRequest(), env: configuration });
  assert.equal(result.status, 200);
  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('line_items[0][price]'), priceId);
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), null);
  assert.equal(params.get('metadata[plan]'), 'SplashLens Crew');
  assert.equal(params.get('metadata[plan_key]'), 'crew_monthly');
  assert.equal(params.get('metadata[seat_limit]'), '4');
  assert.equal(params.get('subscription_data[metadata][seat_limit]'), '4');
  assert.equal(params.get('allow_promotion_codes'), null);
  assert.equal(created, 1);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('a non-monthly Crew price cannot open checkout', async (t) => {
  const configuration = env();
  let created = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/checkout/sessions')) {
      created += 1;
      return Response.json({ id: sessionId, url: `https://checkout.stripe.com/c/pay/${sessionId}` });
    }
    return Response.json({
      id: priceId, active: true, currency: 'usd', unit_amount: 4900, type: 'recurring',
      recurring: { interval: 'month', interval_count: 1 },
    });
  });
  assert.equal((await checkout({ request: checkoutRequest(), env: configuration })).status, 503);
  assert.equal(created, 0);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('paid Crew webhook grants the lead and caps the workspace at one lead plus three techs', async (t) => {
  const configuration = env();
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.match(String(url), /\/subscriptions\/sub_crew123$/);
    return Response.json(crewSubscription());
  });
  const response = await webhook({
    request: signedWebhook(crewSession(), 'checkout.session.completed', 'evt_crew_paid'),
    env: configuration,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).seatLimit, 4);
  const billing = configuration.SUBSCRIBERS_DB.sqlite.prepare(
    'SELECT plan, status, seat_limit AS seatLimit, billing_email AS email FROM team_billing',
  ).get();
  assert.equal(billing.plan, 'crew');
  assert.equal(billing.status, 'active');
  assert.equal(billing.seatLimit, 4);
  assert.equal(billing.email, lead);
  const entitlement = configuration.SUBSCRIBERS_DB.sqlite.prepare(
    'SELECT plan, status FROM commercial_entitlements WHERE email = ?',
  ).get(lead);
  assert.equal(entitlement.plan, 'SplashLens Crew');
  assert.equal(entitlement.status, 'active');

  async function invite(address) {
    return team({
      request: new Request('https://app.splashlens.com/api/team', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken(lead) },
        body: JSON.stringify({ action: 'invite_member', teamId: configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT team_id AS teamId FROM team_billing').get().teamId, email: address }),
      }),
      env: configuration,
    });
  }
  for (const address of ['tech1@example.com', 'tech2@example.com', 'tech3@example.com']) {
    assert.equal((await invite(address)).status, 200, address);
  }
  const blocked = await invite('tech4@example.com');
  assert.equal(blocked.status, 402);
  assert.match((await blocked.json()).error, /one lead and up to 3 techs/);
  const people = configuration.SUBSCRIBERS_DB.sqlite.prepare(
    "SELECT COUNT(*) AS value FROM team_members WHERE status IN ('active', 'pending')",
  ).get();
  assert.equal(people.value, 4);

  const canceled = await webhook({
    request: signedWebhook({
      id: 'sub_crew123', customer: 'cus_crew123', status: 'canceled',
      metadata: { product: 'splashlens', feature: 'scanner', plan: 'SplashLens Crew' },
    }, 'customer.subscription.deleted', 'evt_crew_cancel'),
    env: configuration,
  });
  assert.equal(canceled.status, 200);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT status FROM team_billing').get().status, 'canceled');
  const paused = await invite('tech5@example.com');
  assert.equal(paused.status, 402);
  assert.match((await paused.json()).error, /not active/);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('checkout success saves the same four-seat Crew workspace', async (t) => {
  const configuration = env();
  configuration.SPLASHLENS_APP_ORIGIN = 'https://stripe-test-55.poolens.pages.dev';
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/checkout/sessions/')) return Response.json(crewSession());
    return Response.json(crewSubscription());
  });
  const response = await checkoutSuccess({
    request: new Request(`https://app.splashlens.com/api/checkout-success?session_id=${sessionId}`),
    env: configuration,
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /one lead and up to 3 techs/);
  assert.match(html, /\$39 monthly/);
  assert.doesNotMatch(html, /guarantee|diagnos/i);
  const activation = new URL(html.match(/href="([^"]+)"/)[1].replace(/&amp;/g, '&'));
  assert.equal(activation.origin, configuration.SPLASHLENS_APP_ORIGIN);
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT seat_limit AS seatLimit FROM team_billing').get().seatLimit, 4);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});

test('a pilot workspace keeps its own seat limit', async () => {
  const configuration = env();
  const created = await team({
    request: new Request('https://app.splashlens.com/api/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken('owner@example.com') },
      body: JSON.stringify({ action: 'create_team', name: 'Pilot crew' }),
    }),
    env: configuration,
  });
  assert.equal(created.status, 200);
  const teamId = configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT id FROM teams').get().id;
  assert.equal(configuration.SUBSCRIBERS_DB.sqlite.prepare('SELECT seat_limit AS seatLimit, plan FROM team_billing').get().seatLimit, 3);
  async function invite(address) {
    return team({
      request: new Request('https://app.splashlens.com/api/team', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken('owner@example.com') },
        body: JSON.stringify({ action: 'invite_member', teamId, email: address }),
      }),
      env: configuration,
    });
  }
  assert.equal((await invite('a@example.com')).status, 200);
  assert.equal((await invite('b@example.com')).status, 200);
  assert.equal((await invite('c@example.com')).status, 402);
  configuration.SUBSCRIBERS_DB.sqlite.close();
});
