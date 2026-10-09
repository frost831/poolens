const PASS_KEY = 'closing_pass_60d';
export const CLOSING_PASS_LABEL = 'SplashLens Closing Pro 60-Day Pass';
const PASS_SECONDS = 60 * 24 * 60 * 60;
const encoder = new TextEncoder();

export function closingPassAmount(env) {
  const raw = String(env.SPLASHLENS_CLOSING_PASS_60D_AMOUNT_CENTS || '').trim();
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const amount = Number(raw);
  return Number.isSafeInteger(amount) && amount >= 100 && amount <= 14900 ? amount : null;
}

async function ensureCheckoutTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS closing_pass_checkouts (
    session_id TEXT PRIMARY KEY, amount_cents INTEGER NOT NULL, client_reference_id TEXT NOT NULL,
    payment_intent_id TEXT, charge_id TEXT, subject TEXT,
    status TEXT NOT NULL DEFAULT 'created', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

export async function recordClosingPassCheckout(env, sessionId, amount, reference) {
  const db = env.SUBSCRIBERS_DB;
  if (!db || typeof db.prepare !== 'function' || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(String(sessionId || ''))
    || !/^sl_checkout_[a-f0-9-]{36}$/i.test(String(reference || '')) || !Number.isSafeInteger(amount)) return false;
  try {
    await ensureCheckoutTable(db);
    await db.prepare(`INSERT OR IGNORE INTO closing_pass_checkouts (session_id, amount_cents, client_reference_id)
      VALUES (?, ?, ?)`).bind(sessionId, amount, reference).run();
    const row = await db.prepare(`SELECT amount_cents AS amountCents, client_reference_id AS reference
      FROM closing_pass_checkouts WHERE session_id = ?`).bind(sessionId).first();
    return row?.amountCents === amount && row?.reference === reference;
  } catch (error) {
    console.error('SplashLens Closing Pro checkout receipt failed', error);
    return false;
  }
}

async function checkoutReceipt(session, env) {
  const db = env.SUBSCRIBERS_DB;
  if (!db || typeof db.prepare !== 'function') return null;
  try {
    const row = await db.prepare(`SELECT amount_cents AS amountCents, client_reference_id AS reference,
      payment_intent_id AS paymentIntentId, charge_id AS chargeId, status
      FROM closing_pass_checkouts WHERE session_id = ?`).bind(session.id).first();
    return row?.amountCents === session.amount_total && row?.reference === session.client_reference_id
      && !['refunded', 'disputed'].includes(row.status) ? row : null;
  } catch {
    return null;
  }
}

export async function closingPassRevocationStatus(session, env) {
  const db = env.SUBSCRIBERS_DB;
  if (!db || typeof db.prepare !== 'function') return '';
  try {
    const row = await db.prepare(`SELECT status FROM closing_pass_checkouts
      WHERE session_id = ? AND amount_cents = ? AND client_reference_id = ?`)
      .bind(session?.id, session?.amount_total, session?.client_reference_id).first();
    return ['refunded', 'disputed'].includes(row?.status) ? row.status : '';
  } catch {
    return '';
  }
}

export function isClosingPass(session) {
  return session?.metadata?.plan_key === PASS_KEY;
}

export function validClosingPassSession(session) {
  const amount = Number(session?.metadata?.pass_amount_cents);
  return /^cs_(test|live)_[A-Za-z0-9]+$/.test(String(session?.id || ''))
    && session?.mode === 'payment'
    && !session?.subscription
    && session?.status === 'complete'
    && session?.payment_status === 'paid'
    && session?.metadata?.product === 'splashlens'
    && session?.metadata?.feature === 'scanner'
    && session?.metadata?.plan === CLOSING_PASS_LABEL
    && Number.isSafeInteger(amount) && amount >= 100 && amount <= 14900
    && session?.currency === 'usd'
    && session?.amount_total === amount
    && /^pi_[A-Za-z0-9]+$/.test(String(session?.payment_intent || ''));
}

async function stripeObject(path, env) {
  if (!env.STRIPE_SECRET_KEY) return null;
  try {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function verifiedClosingPassPayment(session, env) {
  if (!validClosingPassSession(session)) return null;
  // Checkout receipts preserve the price approved when the session was created.
  if (!(await checkoutReceipt(session, env))) return null;
  const intent = await stripeObject(`payment_intents/${session.payment_intent}`, env);
  const chargeId = typeof intent?.latest_charge === 'string' ? intent.latest_charge : intent?.latest_charge?.id;
  if (intent?.id !== session.payment_intent || intent?.status !== 'succeeded' || intent?.currency !== 'usd'
    || intent?.amount_received !== session.amount_total
    || !/^ch_[A-Za-z0-9]+$/.test(String(chargeId || ''))) return null;
  const charge = typeof intent.latest_charge === 'object' && intent.latest_charge?.created
    ? intent.latest_charge : await stripeObject(`charges/${chargeId}`, env);
  const paidAt = Number(charge?.created);
  if (charge?.id !== chargeId || charge?.payment_intent !== intent.id
    || charge?.paid !== true || charge?.status !== 'succeeded'
    || charge?.currency !== 'usd' || charge?.amount !== session.amount_total
    || charge?.refunded === true || Number(charge?.amount_refunded || 0) > 0 || charge?.disputed === true
    || !Number.isSafeInteger(paidAt)
    || paidAt <= 0 || paidAt > Math.floor(Date.now() / 1000) + 300) return null;
  return { paidAt, chargeId };
}

function subjectFor(session) {
  const subject = String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject) && subject.length <= 160 ? subject : '';
}

async function signToken(secret, payload) {
  const part = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(payload))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const signed = `sl_scan_v1.${part}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(signed)));
  const suffix = btoa(String.fromCharCode(...signature)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${signed}.${suffix}`;
}

export async function grantClosingPass(session, paidAt, env, source, chargeId) {
  const subject = subjectFor(session);
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  const db = env.SUBSCRIBERS_DB;
  if (!subject || secret.length < 32 || !db || typeof db.prepare !== 'function'
    || !/^ch_[A-Za-z0-9]+$/.test(String(chargeId || ''))) {
    return { ok: false, status: 503, error: 'Closing Pro entitlement storage is unavailable.' };
  }
  const expiry = paidAt + PASS_SECONDS;
  if (expiry <= Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 403, reason: 'expired', error: 'This Closing Pro pass has expired.' };
  }
  const sessionId = session.id;
  const id = `stripe:${sessionId}`;
  const expiresAt = new Date(expiry * 1000).toISOString();
  try {
    await db.prepare(`UPDATE closing_pass_checkouts
      SET payment_intent_id = ?, charge_id = ?, subject = ?, status = 'paid'
      WHERE session_id = ? AND amount_cents = ? AND status IN ('created','paid')
        AND (payment_intent_id IS NULL OR payment_intent_id = ?)
        AND (charge_id IS NULL OR charge_id = ?)`)
      .bind(session.payment_intent, chargeId, subject, sessionId, session.amount_total, session.payment_intent, chargeId).run();
    const receipt = await checkoutReceipt(session, env);
    if (receipt?.status !== 'paid' || receipt?.paymentIntentId !== session.payment_intent
      || receipt?.chargeId !== chargeId) {
      return { ok: false, status: 403, error: 'This Closing Pro payment is no longer active.' };
    }
    await db.prepare(`CREATE TABLE IF NOT EXISTS commercial_entitlements (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, team_id TEXT, lane TEXT NOT NULL,
      plan TEXT NOT NULL, status TEXT DEFAULT 'active', source TEXT,
      stripe_session_id TEXT, stripe_customer_id TEXT, current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await db.prepare(`INSERT OR IGNORE INTO commercial_entitlements
      (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end)
      SELECT ?, ?, 'pro', ?, 'active', ?, ?, ?, ?
      WHERE EXISTS (SELECT 1 FROM closing_pass_checkouts WHERE session_id = ? AND charge_id = ? AND status = 'paid')`)
      .bind(id, subject, CLOSING_PASS_LABEL, source, sessionId, String(session.customer || ''), expiresAt, sessionId, chargeId).run();
    const row = await db.prepare(`SELECT email, plan, status, current_period_end AS expiresAt
      FROM commercial_entitlements WHERE id = ?`).bind(id).first();
    if (row?.email !== subject || row?.plan !== CLOSING_PASS_LABEL || row?.expiresAt !== expiresAt
      || row?.status !== 'active') {
      return { ok: false, status: 403, error: 'This Closing Pro pass is no longer active.' };
    }
    if (Date.parse(row.expiresAt) <= Date.now()) {
      return { ok: false, status: 403, reason: 'expired', error: 'This Closing Pro pass has expired.' };
    }
    if ((await checkoutReceipt(session, env))?.status !== 'paid') {
      return { ok: false, status: 403, error: 'This Closing Pro payment is no longer active.' };
    }
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: subject, plan: CLOSING_PASS_LABEL, scopes: ['scan'], source,
      stripeSessionId: sessionId, stripeCustomerId: String(session.customer || ''), iat: now, exp: expiry,
    };
    const token = await signToken(secret, payload);
    if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
      const ttl = expiry - now;
      if (ttl <= 0) return { ok: false, status: 403, reason: 'expired', error: 'This Closing Pro pass has expired.' };
      await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify({
        subject, plan: CLOSING_PASS_LABEL, scopes: ['scan'], source,
        stripeSessionId: sessionId, stripeCustomerId: payload.stripeCustomerId,
        issuedAt: new Date(now * 1000).toISOString(), expiresAt,
      }), { expirationTtl: ttl });
      await env.SCAN_USAGE_KV.put(`entitlement_session:${sessionId}`, subject, { expirationTtl: ttl });
      await env.SCAN_USAGE_KV.put(`closing_pass_charge:${chargeId}`, JSON.stringify({ sessionId, subject }), { expirationTtl: ttl });
      if (payload.stripeCustomerId) {
        await env.SCAN_USAGE_KV.put(`entitlement_customer:${payload.stripeCustomerId}`, subject, { expirationTtl: ttl });
      }
      if (typeof env.SCAN_USAGE_KV.delete === 'function') await env.SCAN_USAGE_KV.delete(`entitlement_revoked:${subject}`);
    }
    return { ok: true, subject, token, expiresAt };
  } catch (error) {
    console.error('SplashLens Closing Pro grant failed', error);
    return { ok: false, status: 503, error: 'Closing Pro entitlement storage is unavailable.' };
  }
}

async function revokeKvDuringDbOutage(env, chargeId) {
  const kv = env.SCAN_USAGE_KV;
  if (!kv || typeof kv.get !== 'function') return { handled: false };
  let reference;
  try { reference = JSON.parse(await kv.get(`closing_pass_charge:${chargeId}`)); } catch { return { handled: false }; }
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(String(reference?.sessionId || '')) || !reference?.subject) {
    return { handled: false };
  }
  try {
    await kv.put(`closing_pass_revoked:${reference.sessionId}`, 'pending_db_revocation', { expirationTtl: PASS_SECONDS });
    const raw = await kv.get(`entitlement:${reference.subject}`);
    let record;
    try { record = JSON.parse(raw); } catch {}
    if (record?.plan === CLOSING_PASS_LABEL && record?.stripeSessionId === reference.sessionId) {
      await kv.delete(`entitlement:${reference.subject}`);
      await kv.delete(`entitlement_session:${reference.sessionId}`);
    }
  } catch (error) {
    console.error('SplashLens Closing Pro outage revocation failed', error);
  }
  return { handled: true, error: true };
}

export async function revokeClosingPassPayment(object, eventType, env) {
  if (!['charge.refunded', 'charge.dispute.created'].includes(eventType)) return { handled: false };
  const rawCharge = eventType === 'charge.refunded' ? object?.id : object?.charge;
  const chargeId = String(typeof rawCharge === 'string' ? rawCharge : rawCharge?.id || '');
  if (!/^ch_[A-Za-z0-9]+$/.test(chargeId)) return { handled: false };
  const db = env.SUBSCRIBERS_DB;
  if (!db || typeof db.prepare !== 'function') return revokeKvDuringDbOutage(env, chargeId);
  let receipt;
  try {
    receipt = await db.prepare(`SELECT session_id AS sessionId, subject, payment_intent_id AS paymentIntentId,
      status FROM closing_pass_checkouts WHERE charge_id = ?`).bind(chargeId).first();
  } catch {
    return revokeKvDuringDbOutage(env, chargeId);
  }
  if (!receipt || !['paid', 'refunded', 'disputed'].includes(receipt.status)) return { handled: false };
  const rawIntent = object?.payment_intent;
  const eventIntent = String(typeof rawIntent === 'string' ? rawIntent : rawIntent?.id || '');
  if (eventIntent && eventIntent !== receipt.paymentIntentId) return { handled: false };
  const status = eventType === 'charge.refunded' ? 'refunded' : 'disputed';
  try {
    const entitlementUpdate = db.prepare(`UPDATE commercial_entitlements SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND stripe_session_id = ? AND plan = ?`)
      .bind(status, `stripe:${receipt.sessionId}`, receipt.sessionId, CLOSING_PASS_LABEL);
    const receiptUpdate = db.prepare(`UPDATE closing_pass_checkouts SET status = ? WHERE session_id = ?`)
      .bind(status, receipt.sessionId);
    if (typeof db.batch === 'function') await db.batch([entitlementUpdate, receiptUpdate]);
    else {
      await entitlementUpdate.run();
      await receiptUpdate.run();
    }
    if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
      await env.SCAN_USAGE_KV.put(`closing_pass_revoked:${receipt.sessionId}`, status, { expirationTtl: PASS_SECONDS });
      if (typeof env.SCAN_USAGE_KV.get === 'function' && typeof env.SCAN_USAGE_KV.delete === 'function') {
        const raw = await env.SCAN_USAGE_KV.get(`entitlement:${receipt.subject}`);
        let record;
        try { record = JSON.parse(raw); } catch {}
        if (record?.plan === CLOSING_PASS_LABEL && record?.stripeSessionId === receipt.sessionId) {
          await env.SCAN_USAGE_KV.delete(`entitlement:${receipt.subject}`);
          await env.SCAN_USAGE_KV.delete(`entitlement_session:${receipt.sessionId}`);
        }
      }
    }
    return { handled: true, status, sessionId: receipt.sessionId };
  } catch (error) {
    console.error('SplashLens Closing Pro revocation failed', error);
    return { handled: true, error: true };
  }
}
