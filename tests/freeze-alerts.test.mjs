import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { onRequestGet, onRequestPost, onRequestDelete } from '../functions/api/freeze-alerts.js';

const token = 'a'.repeat(64);
const origin = 'https://app.splashlens.com';
const migration = readFileSync(new URL('../migrations/2026-10-09-freeze-alert-optins.sql', import.meta.url), 'utf8');
const fixture = { features: [
  { id: 'https://api.weather.gov/alerts/urn:oid:freeze1', properties: { event: 'Freeze Warning', status: 'Actual', expires: '2099-01-01T00:00:00Z' } },
  { id: 'https://api.weather.gov/alerts/urn:oid:watch1', properties: { event: 'Freeze Watch', status: 'Actual', expires: '2099-01-01T00:00:00Z' } },
  { id: 'https://api.weather.gov/alerts/urn:oid:heat1', properties: { event: 'Heat Advisory', status: 'Actual', expires: '2099-01-01T00:00:00Z' } },
  { id: 'https://api.weather.gov/alerts/urn:oid:test1', properties: { event: 'Hard Freeze Warning', status: 'Test', expires: '2099-01-01T00:00:00Z' } },
  { id: 'https://evil.example/alerts/fake', properties: { event: 'Hard Freeze Warning', status: 'Actual', expires: '2099-01-01T00:00:00Z' } },
] };

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(migration);
  const cache = new Map();
  const puts = [];
  return {
    sqlite, cache, puts,
    env: {
      SUBSCRIBERS_DB: { prepare(sql) {
        const statement = sqlite.prepare(sql);
        return { bind(...args) { return {
          async first() { return statement.get(...args) || null; },
          async run() { return { meta: { changes: statement.run(...args).changes } }; },
        }; } };
      } },
      SCAN_USAGE_KV: {
        async get(key) { return cache.get(key) || null; },
        async put(key, value, options) { puts.push({ key, options }); cache.set(key, value); },
      },
    },
  };
}

function request(method, body, overrides = {}) {
  return new Request('https://app.splashlens.com/api/freeze-alerts', {
    method, headers: { Origin: origin, 'X-Freeze-Subscription': token, ...(body ? { 'Content-Type': 'application/json' } : {}), ...overrides },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('opt-in stores only ZIP3; official active payload displays eligible alerts and caches for an hour', async () => {
  const { sqlite, env, puts } = setup();
  const saved = await onRequestPost({ request: request('POST', { zip: '60614' }), env });
  assert.equal(saved.status, 200);
  assert.deepEqual(Object.keys(sqlite.prepare('SELECT * FROM freeze_alert_optins').get()).sort(), ['created_at', 'subscriber_hash', 'updated_at', 'zip3']);
  assert.equal(sqlite.prepare('SELECT zip3 FROM freeze_alert_optins').get().zip3, '606');
  assert.equal(sqlite.prepare('SELECT subscriber_hash FROM freeze_alert_optins').get().subscriber_hash.length, 64);
  const oldFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(fixture), { status: 200 });
  };
  try {
    const response = await onRequestGet({ request: request('GET'), env });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.zip3, '606');
    assert.deepEqual(body.alerts.map(alert => alert.event), ['Freeze Warning', 'Freeze Watch']);
    assert.ok(body.alerts.every(alert => alert.url.startsWith('https://api.weather.gov/alerts/')));
    assert.match(calls[0].url, /^https:\/\/api\.weather\.gov\/alerts\/active\?point=/);
    assert.match(calls[0].options.headers['User-Agent'], /SplashLens.*hello@splashlens\.com/);
    assert.deepEqual(puts, [{ key: 'freeze-alerts:v1:606', options: { expirationTtl: 300 } }]);
    await onRequestGet({ request: request('GET'), env });
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = oldFetch; sqlite.close(); }
});

test('opt-out deletes the subscription and suppresses future NWS lookups', async () => {
  const { sqlite, env } = setup();
  await onRequestPost({ request: request('POST', { zip: '554' }), env });
  assert.equal((await onRequestDelete({ request: request('DELETE'), env })).status, 200);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM freeze_alert_optins').get().n, 0);
  assert.deepEqual(await (await onRequestGet({ request: request('GET'), env })).json(), { ok: true, optedIn: false });
  sqlite.close();
});

test('NWS outage and malformed payload fail closed; no synthetic alert is returned', async () => {
  const { sqlite, env } = setup();
  await onRequestPost({ request: request('POST', { zip: '606' }), env });
  const oldFetch = globalThis.fetch;
  try {
    for (const response of [new Response('down', { status: 503 }), new Response('{}', { status: 200 })]) {
      globalThis.fetch = async () => response.clone();
      const result = await onRequestGet({ request: request('GET'), env });
      assert.equal(result.status, 503);
      assert.equal((await result.json()).alerts, undefined);
    }
  } finally { globalThis.fetch = oldFetch; sqlite.close(); }
});

test('rejects extra personal fields, invalid ZIP and cross-site mutations', async () => {
  const { sqlite, env } = setup();
  assert.equal((await onRequestPost({ request: request('POST', { zip: '60614', email: 'x@example.com' }), env })).status, 400);
  assert.equal((await onRequestPost({ request: request('POST', { zip: '60614-1234' }), env })).status, 400);
  assert.equal((await onRequestPost({ request: request('POST', { zip: '60614' }, { Origin: 'https://evil.example' }), env })).status, 403);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM freeze_alert_optins').get().n, 0);
  sqlite.close();
});

test('client banner only renders an NWS-issued matching alert without tracking ZIP3', () => {
  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('const FREEZE_SUBSCRIPTION_KEY'), source.indexOf('function renderChecklist()', source.indexOf('const FREEZE_SUBSCRIPTION_KEY')));
  const elements = new Map();
  for (const id of ['freeze-banner', 'freeze-banner-title', 'freeze-banner-detail', 'freeze-nws-link', 'freeze-optin-form', 'freeze-optout', 'freeze-status']) elements.set(id, { hidden: true, textContent: '', href: '' });
  const events = [];
  const context = { document: { getElementById: id => elements.get(id) }, URL, crypto, localStorage: {}, trackSplashLensEvent: (name, props) => events.push({ name, props }) };
  runInNewContext(`${code}\nrenderFreezeSubscription(true, '606'); showFreezeAlerts(${JSON.stringify([{ event: 'Freeze Warning', url: 'https://api.weather.gov/alerts/urn:oid:freeze1' }])});`, context);
  assert.equal(elements.get('freeze-banner').hidden, false);
  assert.match(elements.get('freeze-banner-title').textContent, /NWS Freeze Warning near ZIP 606/);
  assert.deepEqual(events.map(event => event.name), ['freeze_alert_shown']);
  assert.equal(Object.hasOwn(events[0].props, 'zip3'), false);
  runInNewContext(`showFreezeAlerts([{event:'Freeze Warning',url:'https://evil.example/alerts/fake'}]);`, context);
  assert.equal(elements.get('freeze-banner').hidden, true);
});

test('client keeps opt-out available when NWS lookup fails', async () => {
  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('const FREEZE_SUBSCRIPTION_KEY'), source.indexOf('function renderChecklist()', source.indexOf('const FREEZE_SUBSCRIPTION_KEY')));
  const elements = new Map();
  for (const id of ['freeze-banner', 'freeze-banner-title', 'freeze-banner-detail', 'freeze-nws-link', 'freeze-optin-form', 'freeze-optout', 'freeze-banner-optout', 'freeze-status']) {
    elements.set(id, { hidden: true, textContent: '', addEventListener() {} });
  }
  const context = {
    document: { getElementById: id => elements.get(id), querySelectorAll: () => [] },
    URL, crypto, fetch: async () => { throw new Error('NWS down'); },
    localStorage: { getItem: () => token }, trackSplashLensEvent() {},
  };
  runInNewContext(`${code}\ninitFreezeAlerts();`, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.get('freeze-optout').hidden, false);
  assert.equal(elements.get('freeze-banner').hidden, false);
  assert.equal(elements.get('freeze-nws-link').href, 'https://www.weather.gov/alerts');
  assert.match(elements.get('freeze-status').textContent, /NWS alerts are unavailable/);
});
