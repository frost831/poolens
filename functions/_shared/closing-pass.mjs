const PASS_KEY = 'closing_pass_60d';
const PASS_LABEL = 'SplashLens Closing Pro 60-Day Pass';
const PASS_SECONDS = 60 * 24 * 60 * 60;
const encoder = new TextEncoder();

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
    && session?.metadata?.plan === PASS_LABEL
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
    || charge?.refunded === true || !Number.isSafeInteger(paidAt)
    || paidAt <= 0 || paidAt > Math.floor(Date.now() / 1000) + 300) return null;
  return paidAt;
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

export async function grantClosingPass(session, paidAt, env, source) {
  const subject = subjectFor(session);
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  const db = env.SUBSCRIBERS_DB;
  if (!subject || secret.length < 32 || !db || typeof db.prepare !== 'function') {
    return { ok: false, status: 503, error: 'Closing Pro entitlement storage is unavailable.' };
  }
  const expiry = paidAt + PASS_SECONDS;
  if (expiry <= Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 403, error: 'This Closing Pro pass has expired.' };
  }
  const sessionId = session.id;
  const id = `stripe:${sessionId}`;
  const expiresAt = new Date(expiry * 1000).toISOString();
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS commercial_entitlements (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, team_id TEXT, lane TEXT NOT NULL,
      plan TEXT NOT NULL, status TEXT DEFAULT 'active', source TEXT,
      stripe_session_id TEXT, stripe_customer_id TEXT, current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await db.prepare(`INSERT OR IGNORE INTO commercial_entitlements
      (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end)
      VALUES (?, ?, 'pro', ?, 'active', ?, ?, ?, ?)`)
      .bind(id, subject, PASS_LABEL, source, sessionId, String(session.customer || ''), expiresAt).run();
    const row = await db.prepare(`SELECT email, plan, status, current_period_end AS expiresAt
      FROM commercial_entitlements WHERE id = ?`).bind(id).first();
    if (row?.email !== subject || row?.plan !== PASS_LABEL || row?.expiresAt !== expiresAt
      || row?.status !== 'active' || Date.parse(row.expiresAt) <= Date.now()) {
      return { ok: false, status: 403, error: 'This Closing Pro pass is no longer active.' };
    }
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: subject, plan: PASS_LABEL, scopes: ['scan'], source,
      stripeSessionId: sessionId, stripeCustomerId: String(session.customer || ''), iat: now, exp: expiry,
    };
    const token = await signToken(secret, payload);
    if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
      const ttl = expiry - now;
      if (ttl <= 0) return { ok: false, status: 403, error: 'This Closing Pro pass has expired.' };
      await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify({
        subject, plan: PASS_LABEL, scopes: ['scan'], source,
        stripeSessionId: sessionId, stripeCustomerId: payload.stripeCustomerId,
        issuedAt: new Date(now * 1000).toISOString(), expiresAt,
      }), { expirationTtl: ttl });
      await env.SCAN_USAGE_KV.put(`entitlement_session:${sessionId}`, subject, { expirationTtl: ttl });
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
