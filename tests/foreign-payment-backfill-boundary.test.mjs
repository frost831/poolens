import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { paymentStats } from '../functions/api/stats.js';
import { onRequestPost as restoreEntitlement } from '../functions/api/restore-entitlement.js';
import { onRequestPost as scan } from '../functions/api/scan.js';

const secret = 'foreign-payment-regression-secret-long-enough';
const foreignEmail = 'foreign@example.com';
const verifiedEmail = 'verified@example.com';
const foreignSession = 'cs_live_foreign_zero_amount';
const verifiedSession = 'cs_live_verified_splashlens';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE payment_events (
      event_type TEXT, stripe_session_id TEXT, subject TEXT, plan TEXT, created_at TEXT
    );
    CREATE TABLE commercial_entitlements (
      id TEXT PRIMARY KEY, email TEXT, lane TEXT, plan TEXT, status TEXT,
      source TEXT, stripe_session_id TEXT, stripe_customer_id TEXT,
      current_period_end TEXT, updated_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE audit_records (
      id TEXT, actor_email TEXT, action TEXT, target_type TEXT, target_id TEXT, payload TEXT
    );
  `);
  db.prepare(`INSERT INTO payment_events VALUES (?, ?, ?, ?, datetime('now'))`)
    .run('checkout.session.completed', foreignSession, foreignEmail, 'PartSnap Pro');
  db.prepare(`INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end, updated_at) VALUES (?, ?, 'pro', ?, 'active', ?, ?, NULL, datetime('now', '+365 days'), datetime('now'))`)
    .run(`stripe:${foreignSession}`, foreignEmail, 'PartSnap Pro', 'd1_payment_backfill', foreignSession);
  return db;
}

function d1(db) {
  return {
    prepare(sql) {
      const statement = db.prepare(sql);
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async first() { return statement.get(...bindings) || null; },
        async all() { return { results: statement.all(...bindings) }; },
        async run() { return statement.run(...bindings); },
      };
    },
  };
}

function signedToken(prefix, email, scopes, source) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: email, scopes, source, iat: now, exp: now + 600 })).toString('base64url');
  const signed = `${prefix}.${payload}`;
  return `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
}

function restoreRequest(email) {
  return new Request('https://app.splashlens.com/api/restore-entitlement', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-splashlens-account-token': signedToken('sl_account_v1', email, ['account']) },
    body: JSON.stringify({ email }),
  });
}

test('historical plan-text backfill is inert even when a foreign checkout says PartSnap Pro', () => {
  const db = fixture();
  try {
    db.exec(`DELETE FROM commercial_entitlements`);
    db.exec(readFileSync(new URL('../migrations/2026-09-10-backfill-partsnap-pro-entitlements.sql', import.meta.url), 'utf8'));
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM commercial_entitlements').get().count, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_records').get().count, 0);
  } finally {
    db.close();
  }
});

test('a plan-labeled foreign payment is excluded from paid metrics until verified by a Stripe-origin entitlement', async () => {
  const db = fixture();
  try {
    let metrics = await paymentStats(d1(db));
    assert.equal(metrics.splashlensCompleted, 0);
    assert.equal(metrics.splashlensCompleted30d, 0);
    assert.equal(metrics.unverifiedSplashLensLabeledCompletions, 1);
    assert.deepEqual(metrics.byPlan, []);

    db.prepare(`INSERT INTO payment_events VALUES (?, ?, ?, ?, datetime('now'))`)
      .run('checkout.session.completed', verifiedSession, verifiedEmail, 'Splash Lens Pro Unlimited');
    db.prepare(`INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end, updated_at) VALUES (?, ?, 'pro', ?, 'active', ?, ?, NULL, datetime('now', '+30 days'), datetime('now'))`)
      .run(`stripe:${verifiedSession}`, verifiedEmail, 'Splash Lens Pro Unlimited', 'stripe_webhook', verifiedSession);
    metrics = await paymentStats(d1(db));
    assert.equal(metrics.splashlensCompleted, 1);
    assert.equal(metrics.splashlensCompleted30d, 1);
    assert.equal(metrics.unverifiedSplashLensLabeledCompletions, 1);
  } finally {
    db.close();
  }
});

test('paid metrics fail closed when payment events exist but the entitlement table does not', async () => {
  const db = fixture();
  try {
    db.exec('DROP TABLE commercial_entitlements');
    const metrics = await paymentStats(d1(db));
    assert.equal(metrics.splashlensCompleted, 0);
    assert.equal(metrics.unverifiedSplashLensLabeledCompletions, 1);
  } finally {
    db.close();
  }
});

test('restore rejects a plan-text backfill and permits a verified Stripe-origin entitlement', async () => {
  const db = fixture();
  const env = { SUBSCRIBERS_DB: d1(db), SPLASHLENS_ENTITLEMENT_SECRET: secret };
  try {
    const rejected = await restoreEntitlement({ request: restoreRequest(foreignEmail), env });
    assert.equal(rejected.status, 404);

    db.prepare(`INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end, updated_at) VALUES (?, ?, 'pro', ?, 'active', ?, ?, NULL, datetime('now', '+30 days'), datetime('now'))`)
      .run(`stripe:${verifiedSession}`, verifiedEmail, 'Splash Lens Pro Unlimited', 'stripe_webhook', verifiedSession);
    const allowed = await restoreEntitlement({ request: restoreRequest(verifiedEmail), env });
    assert.equal(allowed.status, 200);
    assert.match((await allowed.json()).token, /^sl_scan_v1\./);
  } finally {
    db.close();
  }
});

test('KV-only restore rejects a plan-text record without verified Stripe provenance', async () => {
  const env = {
    SPLASHLENS_ENTITLEMENT_SECRET: secret,
    SCAN_USAGE_KV: {
      async get(key) {
        if (key === `entitlement:${foreignEmail}`) {
          return JSON.stringify({ subject: foreignEmail, plan: 'PartSnap Pro', scopes: ['scan'], expiresAt: new Date(Date.now() + 60_000).toISOString() });
        }
        return null;
      },
    },
  };
  const response = await restoreEntitlement({ request: restoreRequest(foreignEmail), env });
  assert.equal(response.status, 404);
});

test('a previously restored scanner token cannot reactivate a backfilled entitlement', async () => {
  const db = fixture();
  try {
    const response = await scan({
      request: new Request('https://app.splashlens.com/api/scan', {
        method: 'POST',
        headers: {
          origin: 'https://app.splashlens.com',
          'content-type': 'application/json',
          'x-splashlens-entitlement-token': signedToken('sl_scan_v1', foreignEmail, ['scan'], 'restore_entitlement'),
        },
        body: JSON.stringify({ image: 'aGVsbG8=', mode: 'parts_snap' }),
      }),
      env: { SUBSCRIBERS_DB: d1(db), SPLASHLENS_ENTITLEMENT_SECRET: secret, ANTHROPIC_API_KEY: 'unused' },
    });
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /could not be confirmed/i);
  } finally {
    db.close();
  }
});

test('a plan-only KV record cannot validate a paid scanner token when D1 is unavailable', async () => {
  const response = await scan({
    request: new Request('https://app.splashlens.com/api/scan', {
      method: 'POST',
      headers: {
        origin: 'https://app.splashlens.com',
        'content-type': 'application/json',
        'x-splashlens-entitlement-token': signedToken('sl_scan_v1', foreignEmail, ['scan'], 'restore_entitlement'),
      },
      body: JSON.stringify({ image: 'aGVsbG8=', mode: 'parts_snap' }),
    }),
    env: {
      SPLASHLENS_ENTITLEMENT_SECRET: secret,
      ANTHROPIC_API_KEY: 'unused',
      SCAN_USAGE_KV: {
        async get(key) {
          if (key === `entitlement:${foreignEmail}`) {
            return JSON.stringify({ subject: foreignEmail, plan: 'PartSnap Pro', expiresAt: new Date(Date.now() + 60_000).toISOString() });
          }
          return null;
        },
      },
    },
  });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /could not be confirmed/i);
});

test('verified checkout restore remains usable through KV if D1 is temporarily unavailable', async () => {
  const db = fixture();
  const values = new Map();
  const kv = {
    async get(key) { return values.get(key) || null; },
    async put(key, value) { values.set(key, value); },
    async delete(key) { values.delete(key); },
  };
  try {
    db.prepare(`INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end, updated_at) VALUES (?, ?, 'pro', ?, 'active', ?, ?, NULL, datetime('now', '+30 days'), datetime('now'))`)
      .run(`stripe:${verifiedSession}`, verifiedEmail, 'Splash Lens Pro Unlimited', 'stripe_checkout_success', verifiedSession);
    const restored = await restoreEntitlement({
      request: restoreRequest(verifiedEmail),
      env: { SUBSCRIBERS_DB: d1(db), SPLASHLENS_ENTITLEMENT_SECRET: secret, SCAN_USAGE_KV: kv },
    });
    assert.equal(restored.status, 200);
    const { token } = await restored.json();
    assert.equal(JSON.parse(values.get(`entitlement:${verifiedEmail}`)).source, 'stripe_checkout');

    const response = await scan({
      request: new Request('https://app.splashlens.com/api/scan', {
        method: 'POST',
        headers: {
          origin: 'https://app.splashlens.com',
          'content-type': 'application/json',
          'x-splashlens-entitlement-token': token,
        },
        body: JSON.stringify({ image: 'aGVsbG8=', mode: 'parts_snap' }),
      }),
      env: {
        SPLASHLENS_ENTITLEMENT_SECRET: secret,
        ANTHROPIC_API_KEY: 'unused',
        SCAN_USAGE_KV: kv,
        SCAN_RATE_LIMITER: { async limit() { return { success: false }; } },
      },
    });
    assert.equal(response.status, 429);
    assert.match((await response.json()).error, /rate limit/i);
  } finally {
    db.close();
  }
});
