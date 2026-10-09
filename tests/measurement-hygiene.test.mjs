import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { classifyTraffic } from '../functions/_shared/traffic-class.mjs';
import { onRequestPost as ingestEvent } from '../functions/api/events.js';
import { onRequestPost as checkout } from '../functions/api/checkout.js';

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
      };
    },
  };
}

const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const reference = 'sl_checkout_5d46a1e0-a882-4c96-9c93-6558d2e34149';
function checkoutRequest(body, headers = {}) {
  return new Request('https://app.splashlens.com/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': safari, ...headers }, body: JSON.stringify(body),
  });
}

test('traffic classes distinguish QA, automation, server-only, and normal Safari', () => {
  assert.equal(classifyTraffic({ source: 'qa', userAgent: safari }), 'qa');
  assert.equal(classifyTraffic({ utmSource: 'codex_smoke', userAgent: safari }), 'qa');
  assert.equal(classifyTraffic({ source: 'app', userAgent: 'curl/8.0' }), 'bot');
  assert.equal(classifyTraffic({ source: 'app', userAgent: safari, webdriver: true }), 'bot');
  assert.equal(classifyTraffic({ source: 'server', userAgent: safari, serverOrigin: true }), 'server');
  assert.equal(classifyTraffic({ source: 'app', userAgent: safari, props: { client_id: 'opaque' } }), 'real');
});

test('checkout_click is stored with real traffic class and forwarded to Amplitude', async (t) => {
  const db = database();
  t.after(() => db.sql.close());
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    sent.push(JSON.parse(options.body).events[0]);
    return Response.json({ code: 200 });
  });
  const request = new Request('https://app.splashlens.com/api/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': safari },
    body: JSON.stringify({ event: 'checkout_click', source: 'app', path: '/', props: {
      plan: 'monthly', placement: 'field_stop_saved', store: 'web', client_reference_id: reference,
      client_id: '5d46a1e0-a882-4c96-9c93-6558d2e34149',
    } }),
  });
  const response = await ingestEvent({ request, env: { SUBSCRIBERS_DB: db, AMPLITUDE_API_KEY: 'fixture' } });
  assert.equal(response.status, 200);
  const props = JSON.parse(db.sql.prepare("SELECT props FROM events WHERE event = 'checkout_click'").get().props);
  assert.equal(props.traffic_class, 'real');
  assert.equal(props.is_internal, false);
  assert.equal(sent[0].event_type, 'checkout_click');
  assert.equal(sent[0].event_properties.traffic_class, 'real');
  assert.equal(sent[0].user_properties.traffic_class, 'real');
});

test('POST checkout rejects missing attribution, bot and prefetch before Stripe', async (t) => {
  const stripeCalls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => { stripeCalls.push(args); throw new Error('Stripe must not run'); });
  const env = { STRIPE_SECRET_KEY: 'fixture' };
  const valid = { plan: 'monthly', source: 'app', placement: 'field_stop_saved', client_reference_id: reference, store: 'web' };
  assert.equal((await checkout({ request: checkoutRequest({ ...valid, client_reference_id: '' }), env })).status, 400);
  assert.equal((await checkout({ request: checkoutRequest({ ...valid, placement: '' }), env })).status, 400);
  assert.equal((await checkout({ request: checkoutRequest(valid, { 'User-Agent': 'curl/8.0' }), env })).status, 403);
  assert.equal((await checkout({ request: checkoutRequest(valid, { Purpose: 'prefetch' }), env })).status, 403);
  assert.equal((await checkout({ request: checkoutRequest(valid, { Purpose: 'navigate', 'Sec-Purpose': 'prefetch' }), env })).status, 403);
  assert.equal((await checkout({ request: checkoutRequest(valid, { 'Sec-Fetch-Mode': 'no-cors' }), env })).status, 403);
  assert.equal(stripeCalls.length, 0);
});
