import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync, verify } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/play-billing.js';
import { onRequestPost as scan } from '../functions/api/scan.js';
import { playAccountId, playCatalog, verifyPlayPurchase, verifyPlayScan, restorePlayPurchases } from '../functions/_shared/google-play-billing.mjs';

const secret = 'test-only-secret-not-a-live-credential'.repeat(2);
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const migration = readFileSync(new URL('../migrations/2026-11-17-google-play-purchases.sql', import.meta.url), 'utf8');
const fixtureToken = 'fixture-purchase-token_1234567890';
function accountToken(email = 'qa@example.com', age = 0) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: email, scopes: ['account'], iat: now - age, exp: now + 3600 })).toString('base64url');
  const signed = `sl_account_v1.${payload}`;
  return `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
}
function setup(t) {
  const sql = new DatabaseSync(':memory:'); sql.exec(migration);
  t.after(() => sql.close());
  const env = {
    SPLASHLENS_PLAY_BILLING_ENABLED: 'true', SPLASHLENS_PLAY_LEDGER_SECRET: secret,
    SPLASHLENS_ENTITLEMENT_SECRET: secret, SPLASHLENS_PROFILE_SECRET: secret,
    SPLASHLENS_PLAY_MONTHLY_PRODUCT: 'qa_monthly', SPLASHLENS_PLAY_MONTHLY_BASE_PLAN: 'monthly',
    SPLASHLENS_PLAY_YEARLY_PRODUCT: 'qa_yearly', SPLASHLENS_PLAY_YEARLY_BASE_PLAN: 'yearly',
    SPLASHLENS_PLAY_SERVICE_ACCOUNT: JSON.stringify({ type: 'service_account', client_email: 'qa@fixture-project.iam.gserviceaccount.com', private_key: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }) }),
    SUBSCRIBERS_DB: { prepare(query) { return { bind(...args) { this.args = args; return this; }, async first() { return sql.prepare(query).get(...(this.args || [])) || null; }, async all() { return { results: sql.prepare(query).all(...(this.args || [])) }; }, async run() { return sql.prepare(query).run(...(this.args || [])); } }; } },
  };
  const calls = []; let ackFail = false; let outage = false;
  const purchase = {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
    lineItems: [{ productId: 'qa_monthly', offerDetails: { basePlanId: 'monthly' }, autoRenewingPlan: { autoRenewEnabled: true }, expiryTime: new Date(Date.now() + 86400 * 1000).toISOString() }],
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    assert.ok(init.signal, 'all provider requests have a deadline');
    assert.equal(init.redirect, 'error');
    if (outage) throw new Error('provider offline including confidential data');
    if (url === 'https://oauth2.googleapis.com/token') {
      const jwt = init.body.get('assertion'); const [a, b, c] = jwt.split('.');
      assert.ok(verify('RSA-SHA256', Buffer.from(`${a}.${b}`), keys.publicKey, Buffer.from(c, 'base64url')));
      const payload = JSON.parse(Buffer.from(b, 'base64url'));
      assert.equal(payload.scope, 'https://www.googleapis.com/auth/androidpublisher');
      assert.equal(payload.aud, url);
      return Response.json({ access_token: 'fixture-access-only', token_type: 'Bearer' });
    }
    assert.ok(url.startsWith('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.splashlens.fieldtools/'));
    assert.equal(init.headers.Authorization, 'Bearer fixture-access-only');
    if (url.includes('/subscriptions/qa_') && !url.includes('/purchases/')) {
      const yearly = url.endsWith('qa_yearly');
      return Response.json({ packageName: 'com.splashlens.fieldtools', productId: yearly ? 'qa_yearly' : 'qa_monthly', basePlans: [{ basePlanId: yearly ? 'yearly' : 'monthly', state: 'ACTIVE', autoRenewingBasePlanType: { billingPeriodDuration: yearly ? 'P1Y' : 'P1M' }, regionalConfigs: [{ regionCode: 'US', newSubscriberAvailability: true, price: { currencyCode: 'USD', units: yearly ? '149' : '19' } }] }] });
    }
    if (url.endsWith(':acknowledge')) {
      assert.ok(sql.prepare('SELECT token_hash FROM google_play_purchases').get(), 'owner binding durable before acknowledgement');
      if (ackFail) return new Response('', { status: 503 });
      purchase.acknowledgementState = 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';
      purchase.externalAccountIdentifiers = { obfuscatedExternalAccountId: JSON.parse(init.body).externalAccountIds.obfuscatedAccountId };
      return new Response(''); // Actual API may return empty 200.
    }
    return Response.json(purchase);
  };
  t.after(() => { globalThis.fetch = realFetch; });
  const request = (body, email, extra = {}) => new Request('https://app.splashlens.com/api/play-billing', { method: body === undefined ? 'GET' : 'POST', headers: { 'X-SplashLens-Account-Token': accountToken(email), 'Content-Type': 'application/json', ...extra }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
  return { env, sql, purchase, calls, request, failAck: value => { ackFail = value; }, outage: value => { outage = value; } };
}
test('API rejects absent/stale accounts, cross-origin calls and oversized bodies without contacting Google', async t => {
  const f = setup(t);
  assert.equal((await onRequestGet({ request: new Request('https://app.splashlens.com/api/play-billing'), env: f.env })).status, 401);
  assert.equal((await onRequestGet({ request: f.request(undefined, undefined, { 'X-SplashLens-Account-Token': accountToken(undefined, 86401) }), env: f.env })).status, 401);
  assert.equal((await onRequestPost({ request: f.request({ action: 'restore' }, undefined, { Origin: 'https://attacker.invalid' }), env: f.env })).status, 403);
  assert.equal((await onRequestPost({ request: f.request('x'.repeat(8193)), env: f.env })).status, 413);
  assert.equal((await onRequestPost({ request: f.request('null'), env: f.env })).status, 400);
  assert.equal(f.calls.length, 0);
});
test('disabled, invalid, or unmigrated configuration never advertises a purchase', async t => {
  const f = setup(t);
  for (const change of [{ SPLASHLENS_PLAY_BILLING_ENABLED: 'false' }, { SPLASHLENS_PLAY_SERVICE_ACCOUNT: '{}' }, { SPLASHLENS_PLAY_LEDGER_SECRET: '' }, { SPLASHLENS_PLAY_YEARLY_PRODUCT: 'qa_monthly' }]) {
    const response = await onRequestGet({ request: f.request(), env: { ...f.env, ...change } });
    assert.equal((await response.json()).enabled, false); assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  f.sql.exec('DROP TABLE google_play_purchases');
  assert.equal((await (await onRequestGet({ request: f.request(), env: f.env })).json()).enabled, false);
  assert.equal(f.calls.length, 0);
});
test('verified purchase is signed, acknowledged once, encrypted, account-bound and restorable', async t => {
  const f = setup(t);
  const result = await verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken);
  const [prefix, payload, signature] = result.token.split('.');
  assert.equal(prefix, 'sl_scan_v1');
  assert.equal(signature, createHmac('sha256', secret).update(`${prefix}.${payload}`).digest('base64url'));
  const decoded = JSON.parse(Buffer.from(payload, 'base64url'));
  assert.equal(decoded.source, 'google_play'); assert.equal(decoded.sub, await playAccountId(f.env, 'qa@example.com'));
  const row = f.sql.prepare('SELECT * FROM google_play_purchases').get();
  assert.ok(!JSON.stringify(row).includes(fixtureToken)); assert.ok(!JSON.stringify(row).includes('qa@example.com'));
  assert.equal((await restorePlayPurchases(f.env, 'qa@example.com')).entitlement.planKey, 'monthly');
  await verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken);
  assert.equal(f.calls.filter(c => c.url.endsWith(':acknowledge')).length, 1);
  await assert.rejects(verifyPlayPurchase(f.env, 'other@example.com', fixtureToken), { code: 'purchase_account_mismatch' });
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM google_play_purchases').get().n, 1);
});
test('catalog is enabled only after live Google credentials, package, base plan, interval and US price checks', async t => {
  const f = setup(t);
  const catalog = await playCatalog(f.env);
  assert.equal(catalog.enabled, true); assert.equal(catalog.products.length, 2);
  assert.equal(f.calls.length, 3);
  f.outage(true);
  assert.equal((await (await onRequestGet({ request: f.request(), env: f.env })).json()).enabled, false);
});
test('every paid scan revalidates Google and rejects revocation, outage and account swapping', async t => {
  const f = setup(t);
  const result = await verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken);
  const payload = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64url'));
  assert.equal((await verifyPlayScan(f.request(), f.env, payload)).ok, true);
  assert.equal((await verifyPlayScan(f.request(undefined, 'other@example.com'), f.env, payload)).ok, false);
  f.purchase.subscriptionState = 'SUBSCRIPTION_STATE_EXPIRED';
  assert.equal((await verifyPlayScan(f.request(), f.env, payload)).ok, false);
  f.purchase.subscriptionState = 'SUBSCRIPTION_STATE_ACTIVE'; f.outage(true);
  assert.equal((await verifyPlayScan(f.request(), f.env, payload)).status, 503);
  const denied = await verifyPlayScan(new Request('https://app.splashlens.com/api/scan'), f.env, payload);
  assert.equal(denied.status, 401); assert.equal(denied.profileRequired, true);
});
test('pending, paused, on-hold, expired, malformed and foreign products never grant or acknowledge', async t => {
  const f = setup(t); const initial = structuredClone(f.purchase);
  const cases = [
    ...['PENDING', 'PAUSED', 'ON_HOLD', 'EXPIRED', 'PENDING_PURCHASE_CANCELED'].map(state => ({ subscriptionState: `SUBSCRIPTION_STATE_${state}` })),
    { lineItems: [] }, { lineItems: [initial.lineItems[0], initial.lineItems[0]] },
    { lineItems: [{ ...initial.lineItems[0], expiryTime: new Date(0).toISOString() }] },
    { lineItems: [{ ...initial.lineItems[0], productId: 'other_app_product' }] },
    { lineItems: [{ ...initial.lineItems[0], offerDetails: { basePlanId: 'foreign-plan' } }] },
    { acknowledgementState: 'UNKNOWN' }, { testPurchase: {} },
    { externalAccountIdentifiers: { obfuscatedExternalAccountId: 'another-account' } },
  ];
  for (const change of cases) {
    Object.keys(f.purchase).forEach(k => delete f.purchase[k]); Object.assign(f.purchase, structuredClone(initial), change);
    await assert.rejects(verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken), { status: 403 });
  }
  assert.equal(f.calls.filter(c => c.url.endsWith(':acknowledge')).length, 0);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM google_play_purchases').get().n, 0);
});
test('cancellation preserves paid-through access; permitted isolated test purchases can activate', async t => {
  const f = setup(t); f.purchase.subscriptionState = 'SUBSCRIPTION_STATE_CANCELED';
  f.purchase.testPurchase = {}; f.env.SPLASHLENS_PLAY_ALLOW_TEST_PURCHASES = 'true';
  assert.ok((await verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken)).token);
});
test('failed acknowledgement is recoverable without a grant or ownership transfer', async t => {
  const f = setup(t); f.failAck(true);
  await assert.rejects(verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken), { code: 'google_unavailable' });
  assert.ok(f.sql.prepare('SELECT token_hash FROM google_play_purchases').get());
  await assert.rejects(verifyPlayPurchase(f.env, 'other@example.com', fixtureToken), { code: 'purchase_account_mismatch' });
  f.failAck(false); assert.ok((await restorePlayPurchases(f.env, 'qa@example.com')).token);
});
test('database failure cannot acknowledge a payment and provider errors never leak tokens', async t => {
  const f = setup(t); const db = f.env.SUBSCRIBERS_DB;
  f.env.SUBSCRIBERS_DB = { prepare(query) { if (query.startsWith('INSERT INTO google_play_purchases')) throw new Error(fixtureToken); return db.prepare(query); } };
  const response = await onRequestPost({ request: f.request({ action: 'verify', purchaseToken: fixtureToken }), env: f.env });
  assert.equal(response.status, 503); assert.ok(!(await response.text()).includes(fixtureToken));
  assert.equal(f.calls.filter(c => c.url.endsWith(':acknowledge')).length, 0);
});
test('malformed tokens and empty restores have safe failures', async t => {
  const f = setup(t);
  for (const token of [undefined, {}, 'short', '../path?secret=x', 'a'.repeat(4099)]) await assert.rejects(verifyPlayPurchase(f.env, 'qa@example.com', token), { code: 'invalid_purchase_token' });
  await assert.rejects(restorePlayPurchases(f.env, 'qa@example.com'), { code: 'no_active_purchase' });
  assert.equal(f.calls.length, 0);
});
test('account rate limits are atomic, isolated per account, and expire after one minute', async t => {
  const f = setup(t);
  for (let i = 0; i < 20; i++) {
    const response = await onRequestPost({ request: f.request({ action: 'restore' }), env: f.env });
    assert.equal(response.status, 404);
  }
  const blocked = await onRequestPost({ request: f.request({ action: 'restore' }), env: f.env });
  assert.equal(blocked.status, 429); assert.equal((await blocked.json()).code, 'billing_rate_limited');
  assert.equal((await onRequestPost({ request: f.request({ action: 'restore' }, 'other@example.com'), env: f.env })).status, 404);
  f.sql.exec('UPDATE google_play_request_windows SET window_started = 0');
  assert.equal((await onRequestPost({ request: f.request({ action: 'restore' }), env: f.env })).status, 404);
  assert.equal(f.calls.length, 0);
});
test('scanner rejects revoked Google access and malformed bodies before calling AI or metering a scan', async t => {
  const f = setup(t); t.mock.method(console, 'info', () => {});
  const result = await verifyPlayPurchase(f.env, 'qa@example.com', fixtureToken);
  f.purchase.subscriptionState = 'SUBSCRIPTION_STATE_EXPIRED';
  const request = body => new Request('https://app.splashlens.com/api/scan', { method: 'POST', headers: { Origin: 'https://app.splashlens.com', 'Content-Type': 'application/json', 'X-SplashLens-Account-Token': accountToken(), 'X-SplashLens-Entitlement-Token': result.token }, body: JSON.stringify(body) });
  const env = { ...f.env, ANTHROPIC_API_KEY: 'fixture-never-sent', SCAN_USAGE_KV: { get() { throw new Error('Denied request must not meter'); } } };
  assert.equal((await scan({ request: request({ image: 'dGVzdA==', mode: 'parts_snap' }), env })).status, 403);
  for (const body of [null, [], 17, 'bad']) assert.equal((await scan({ request: request(body), env })).status, 400);
  assert.equal(f.calls.some(c => c.url.includes('anthropic')), false);
});
