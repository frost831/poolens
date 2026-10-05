import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { checkoutAttribution, recordPaymentEvent } from '../functions/_shared/payment-funnel.mjs';
import { onRequestGet as checkout } from '../functions/api/checkout.js';
import { onRequestGet as checkoutSuccess } from '../functions/api/checkout-success.js';
import { onRequestPost as webhook } from '../functions/api/stripe-webhook.js';
import { onRequestPost as events } from '../functions/api/events.js';

function database() {
  const sql = new DatabaseSync(':memory:');
  return {
    sql,
    prepare(query) {
      let values = [];
      return {
        bind(...items) { values = items; return this; },
        async run() { return { meta: { changes: Number(sql.prepare(query).run(...values).changes) } }; },
        async first() { return sql.prepare(query).get(...values) || null; },
        async all() { return { results: sql.prepare(query).all(...values) }; },
      };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sql.exec('COMMIT');
        return result;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
}

const reference = 'sl_checkout_5d46a1e0-a882-4c96-9c93-6558d2e34149';
const attribution = { source: 'app', client_reference_id: reference, client_id: '5d46a1e0-a882-4c96-9c93-6558d2e34149', session_id: 'session-qa123-5d46a1e0', placement: 'helpful_lookup', store: 'web' };

test('checkout carries anonymous click attribution into Stripe and records the created session', async (t) => {
  const db = database();
  t.after(() => db.sql.close());
  let params;
  const amplitudeEvents = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (String(url).includes('api.stripe.com')) {
      params = new URLSearchParams(options.body);
      return Response.json({ id: 'cs_live_localproof', url: 'https://checkout.stripe.com/c/pay/localproof' });
    }
    amplitudeEvents.push(JSON.parse(options.body).events[0]);
    return Response.json({ code: 200 });
  });
  const response = await checkout({
    request: new Request(`https://app.splashlens.com/api/checkout?plan=monthly&${new URLSearchParams(attribution)}`),
    env: { STRIPE_SECRET_KEY: 'fixture', SUBSCRIBERS_DB: db, AMPLITUDE_API_KEY: 'fixture' },
  });
  assert.equal(response.status, 302);
  assert.equal(params.get('client_reference_id'), reference);
  assert.equal(params.get('metadata[source]'), 'app');
  assert.equal(params.get('subscription_data[metadata][client_id]'), attribution.client_id);
  const row = db.sql.prepare("SELECT * FROM events WHERE event = 'checkout_session_created'").get();
  assert.equal(JSON.parse(row.props).client_reference_id, reference);
  assert.equal(amplitudeEvents[0].device_id, attribution.client_id);
  assert.equal(amplitudeEvents[0].event_type, 'checkout_session_created');
});

test('server proof is stored once and strips personal attribution values', async (t) => {
  const db = database();
  t.after(() => db.sql.close());
  const env = { SUBSCRIBERS_DB: db };
  const proof = { props: { email: 'private@example.com', client_reference_id: 'private@example.com', client_id: 'private@example.com', source: 'app', placement: 'private@example.com' } };
  await recordPaymentEvent(env, 'checkout_completed', 'cs_local', proof);
  await recordPaymentEvent(env, 'checkout_completed', 'cs_local', proof);
  const rows = db.sql.prepare('SELECT * FROM events').all();
  assert.equal(rows.length, 1);
  assert.doesNotMatch(rows[0].props, /private|example.com/);
  assert.equal(JSON.parse(rows[0].props).source, 'server');
  assert.equal(JSON.parse(rows[0].props).attribution_status, 'unattributed_server');
  assert.equal(checkoutAttribution({ source: 'app' }).source, 'server');
});

test('analytics failure cannot prevent a valid checkout redirect', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 'cs_local', url: 'https://checkout.stripe.com/c/pay/local' }));
  const response = await checkout({ request: new Request('https://app.splashlens.com/api/checkout'), env: {
    STRIPE_SECRET_KEY: 'fixture', SUBSCRIBERS_DB: { prepare() { throw new Error('analytics offline'); } },
  } });
  assert.equal(response.status, 302);
});

test('public event ingestion cannot forge any server payment proof', async () => {
  for (const event of ['checkout_session_created', 'checkout_completed', 'subscription_created', 'entitlement_granted']) {
    const response = await events({ request: new Request('https://app.splashlens.com/api/events', { method: 'POST', body: JSON.stringify({ event }) }), env: {} });
    assert.equal(response.status, 403);
  }
});

test('success reload plus signed webhook emits each paid stage only once', async (t) => {
  const db = database();
  t.after(() => db.sql.close());
  const kv = new Map();
  const secret = 'local-entitlement-fixture-secret-32-characters';
  const webhookSecret = 'whsec_local_fixture';
  const session = { id: 'cs_live_local123', mode: 'subscription', subscription: 'sub_local123', payment_status: 'paid', customer: 'cus_local123', customer_details: { email: 'private@example.com' }, client_reference_id: reference, metadata: { ...attribution, product: 'splashlens', feature: 'scanner', plan: 'Splash Lens Pro Unlimited Monthly' } };
  t.mock.method(globalThis, 'fetch', async (url) => Response.json(String(url).includes('/checkout/sessions/') ? session : { status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 2592000 }));
  const env = { SUBSCRIBERS_DB: db, STRIPE_SECRET_KEY: 'fixture', SPLASHLENS_ENTITLEMENT_SECRET: secret, SPLASHLENS_STRIPE_WEBHOOK_SECRET: webhookSecret, SCAN_USAGE_KV: { async put(key, value) { kv.set(key, value); }, async delete(key) { kv.delete(key); } } };
  for (let index = 0; index < 2; index += 1) {
    assert.equal((await checkoutSuccess({ request: new Request('https://app.splashlens.com/api/checkout-success?session_id=cs_live_local123'), env })).status, 200);
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ id: 'evt_local123', type: 'checkout.session.completed', data: { object: session } });
  const signature = createHmac('sha256', webhookSecret).update(`${timestamp}.${body}`).digest('hex');
  const response = await webhook({ request: new Request('https://app.splashlens.com/api/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, body }), env });
  assert.equal(response.status, 200);
  const rows = db.sql.prepare('SELECT event, props FROM events').all();
  assert.deepEqual(rows.map(row => row.event).sort(), ['checkout_completed', 'entitlement_granted', 'subscription_created']);
  assert.doesNotMatch(JSON.stringify(rows), /private@example/);
  assert.ok(kv.has('entitlement:private@example.com'));
});
