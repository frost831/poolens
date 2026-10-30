import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import { onRequest as deletion } from '../functions/api/privacy-deletion.js';
import { onRequestPost as profile } from '../functions/api/free-profile.js';
import { onRequest as deletionPage } from '../functions/data-deletion.html.js';

const SECRET = 'fixture-only-account-signing-key-not-for-production';
const ORIGIN = 'https://app.splashlens.com';
function token(email = 'owner@example.com', changes = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: email, iat: now, exp: now + 3600, scopes: ['account'], ...changes })).toString('base64url');
  const signed = `sl_account_v1.${payload}`;
  return `${signed}.${createHmac('sha256', SECRET).update(signed).digest('base64url')}`;
}
function database() {
  const sqlite = new DatabaseSync(':memory:');
  const db = { prepare(sql) {
    let args = [];
    const operation = {
      bind(...values) { args = values; return operation; },
      async run() { const result = sqlite.prepare(sql).run(...args); return { success: true, meta: { changes: Number(result.changes) } }; },
      async first() { return sqlite.prepare(sql).get(...args) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...args) }; },
    };
    return operation;
  } };
  return { sqlite, db };
}
function request(body = { scope: 'account', confirmation: 'DELETE' }, options = {}) {
  return new Request(`${ORIGIN}/api/privacy-deletion`, {
    method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'X-SplashLens-Account-Token': token(), ...options.headers },
    body: JSON.stringify(body),
  });
}
function fixture(t, providerStatus = 202) {
  const { sqlite, db } = database();
  const messages = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://api.sendgrid.com/v3/mail/send');
    messages.push(JSON.parse(init.body));
    return new Response(null, { status: providerStatus });
  };
  t.after(() => { globalThis.fetch = original; sqlite.close(); });
  return { sqlite, messages, env: { SUBSCRIBERS_DB: db, SPLASHLENS_ENTITLEMENT_SECRET: SECRET, SENDGRID_API_KEY: 'fixture-only-key', SENDGRID_FROM: 'SplashLens <hello@splashlens.com>', SPLASHLENS_NOTIFY_TO: 'privacy@example.com' } };
}

test('verified account deletion is durable, notified, and explicitly a pending request', async t => {
  const f = fixture(t);
  const response = await deletion({ request: request(), env: f.env });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, 'requested');
  assert.equal(result.scope, 'account');
  assert.equal(result.processingDays, 30);
  assert.equal(Date.parse(result.expectedBy) - Date.parse(result.requestedAt), 30 * 86400000);
  assert.equal(f.sqlite.prepare('SELECT email FROM privacy_deletion_requests').get().email, 'owner@example.com');
  assert.equal(f.messages.length, 1);
  assert.match(f.messages[0].content[0].value, /not a completed deletion/);
  assert.match(f.messages[0].content[0].value, /owner@example.com/);
  assert.equal(f.messages[0].personalizations[0].to[0].email, 'privacy@example.com');
  assert.equal(JSON.stringify(result).includes('owner@example.com'), false);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
});

test('retry reuses one request and does not notify twice after delivery', async t => {
  const f = fixture(t);
  const first = await (await deletion({ request: request(), env: f.env })).json();
  const second = await (await deletion({ request: request(), env: f.env })).json();
  assert.equal(second.requestId, first.requestId);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM privacy_deletion_requests').get().n, 1);
  assert.equal(f.messages.length, 1);
});

test('provider failure preserves request, reports failure, and can recover safely', async t => {
  const f = fixture(t, 500);
  const failed = await deletion({ request: request(), env: f.env });
  assert.equal(failed.status, 503);
  const pending = await failed.json();
  globalThis.fetch = async () => new Response(null, { status: 202 });
  const recovered = await (await deletion({ request: request(), env: f.env })).json();
  assert.equal(recovered.requestId, pending.requestId);
  assert.equal(recovered.ok, true);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM privacy_deletion_requests').get().n, 1);
});

test('data-only scope is distinct and leaves existing account/content records untouched at intake', async t => {
  const f = fixture(t);
  f.sqlite.exec("CREATE TABLE user_accounts(email TEXT); INSERT INTO user_accounts VALUES ('owner@example.com'); CREATE TABLE proof_packets(id TEXT); INSERT INTO proof_packets VALUES ('keep-until-processed');");
  const response = await deletion({ request: request({ scope: 'data', confirmation: 'DELETE' }), env: f.env });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).scope, 'data');
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM user_accounts').get().n, 1);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM proof_packets').get().n, 1);
});

test('cross-account identity, missing confirmation, primitives and large bodies never create a request', async t => {
  const f = fixture(t);
  for (const body of [{ scope: 'account', confirmation: 'DELETE', email: 'victim@example.com' }, { scope: 'account', confirmation: '' }, 'DELETE', [], null]) {
    assert.equal((await deletion({ request: request(body), env: f.env })).status, 400);
  }
  assert.equal((await deletion({ request: request({ scope: 'account', confirmation: 'DELETE', extra: 'x'.repeat(5000) }), env: f.env })).status, 413);
  assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='privacy_deletion_requests'").get().n, 0);
  assert.equal(f.messages.length, 0);
});

test('CSRF, forged/expired tokens, wrong scope and wrong content type are rejected before storage', async t => {
  const f = fixture(t);
  for (const [headers, status] of [
    [{ Origin: 'https://attacker.example' }, 403],
    [{ 'X-SplashLens-Account-Token': 'forged' }, 401],
    [{ 'X-SplashLens-Account-Token': token('owner@example.com', { exp: 1 }) }, 401],
    [{ 'X-SplashLens-Account-Token': token('owner@example.com', { scopes: ['free_scan'] }) }, 403],
    [{ 'Content-Type': 'text/plain' }, 415],
  ]) assert.equal((await deletion({ request: request(undefined, { headers }), env: f.env })).status, status);
  assert.equal(f.messages.length, 0);
  assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='privacy_deletion_requests'").get().n, 0);
});

test('privacy email verification issues identity proof without creating a scanner account', async t => {
  const f = fixture(t);
  const profileRequest = body => new Request(`${ORIGIN}/api/free-profile`, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const start = await profile({ request: profileRequest({ action: 'request_code', feature: 'privacy_deletion', email: 'owner@example.com', props: { path: '/data-deletion.html' } }), env: f.env });
  assert.equal(start.status, 200);
  const code = f.messages[0].content[0].value.match(/\b\d{6}\b/)[0];
  const verified = await profile({ request: profileRequest({ action: 'verify_code', email: 'owner@example.com', code }), env: f.env });
  assert.equal(verified.status, 200);
  const result = await verified.json();
  assert.match(result.accountToken, /^sl_account_v1\./);
  assert.equal(result.profileToken, undefined);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM free_profiles').get().n, 0);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM user_accounts').get().n, 0);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM free_profile_verifications').get().n, 0);
});

test('deletion HTML handler fails closed on the app-shell fallback instead of falsely returning a deletion page', async () => {
  const req = new Request(`${ORIGIN}/data-deletion.html`);
  assert.equal((await deletionPage({ request: req, env: { ASSETS: { fetch: async () => new Response('<title>SplashLens app</title>') } } })).status, 503);
  const response = await deletionPage({ request: req, env: { ASSETS: { fetch: async () => new Response('<form id="deletion-form"></form>') } } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /deletion-form/);
  const head = await deletionPage({ request: new Request(`${ORIGIN}/data-deletion.html`, { method: 'HEAD' }), env: { ASSETS: { fetch: async request => {
    assert.equal(request.method, 'GET');
    return new Response('<form id="deletion-form"></form>');
  } } } });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('ordinary scanner verification still creates its account and scanner allowance', async t => {
  const f = fixture(t);
  const call = body => profile({ request: new Request(`${ORIGIN}/api/free-profile`, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env: f.env });
  assert.equal((await call({ email: 'owner@example.com', action: 'request_code', feature: 'scanner_gate' })).status, 200);
  const code = f.messages[0].content[0].value.match(/\b\d{6}\b/)[0];
  const result = await (await call({ email: 'owner@example.com', action: 'verify_code', code })).json();
  assert.match(result.profileToken, /^sl_profile_v1\./);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM free_profiles').get().n, 1);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM user_accounts').get().n, 1);
});

test('privacy navigation cannot overwrite the offline app shell or masquerade as it offline', async () => {
  const handlers = {};
  const puts = [];
  let offline = false;
  const fallback = new Response('offline-app-shell');
  const context = {
    self: { location: { origin: ORIGIN }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    caches: { open: async () => ({ put: (...args) => { puts.push(args); } }), match: async () => fallback },
    fetch: async () => { if (offline) throw new Error('offline'); const response = new Response('online', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); Object.defineProperty(response, 'type', { value: 'basic' }); return response; },
    URL, Response,
  };
  vm.runInNewContext(fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), context);
  const navigate = async path => {
    let promise;
    const pending = [];
    handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: ORIGIN + path, headers: new Headers() }, respondWith: value => { promise = value; }, waitUntil: value => pending.push(value) });
    const response = await promise;
    await Promise.all(pending);
    return response;
  };
  assert.equal(await (await navigate('/data-deletion.html')).text(), 'online');
  assert.equal(puts.length, 0);
  await navigate('/');
  assert.equal(puts.length, 1);
  assert.equal(puts[0][0], '/');
  offline = true;
  assert.equal((await navigate('/data-deletion.html')).type, 'error');
  assert.equal(await (await navigate('/')).text(), 'offline-app-shell');
});
