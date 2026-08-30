const TOKEN_PREFIX = 'sl_scan_v1';
const ACCEPTED_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);
const textEncoder = new TextEncoder();

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function webhookSecret(env) {
  return String(env.SPLASHLENS_STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET || '').trim();
}

function tokenSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function cleanSubject(session) {
  return String(
    session?.customer_details?.email ||
    session?.customer_email ||
    session?.metadata?.email ||
    session?.customer ||
    '',
  ).trim().toLowerCase().slice(0, 160);
}

function cleanPlan(session) {
  return String(session?.metadata?.plan || session?.metadata?.product || 'PartSnap Pro').trim().slice(0, 100);
}

function isPaidSession(session, eventType) {
  return (
    eventType === 'checkout.session.async_payment_succeeded' ||
    session?.payment_status === 'paid' ||
    session?.payment_status === 'no_payment_required'
  );
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(
    String(signatureHeader || '')
      .split(',')
      .map((part) => part.split('='))
      .filter((pair) => pair.length === 2),
  );
  const timestamp = Number(parts.t || 0);
  const signature = parts.v1 || '';
  if (!timestamp || !signature) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return constantTimeEqual(expected, signature);
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function signToken(secret, payload) {
  const payloadPart = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const signed = `${TOKEN_PREFIX}.${payloadPart}`;
  const signature = await hmacSha256(secret, signed);
  return `${signed}.${signature}`;
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

async function storeEntitlement(session, eventType, env) {
  const subject = cleanSubject(session);
  if (!subject) return { ok: false, error: 'No customer email or customer id on Stripe session.' };

  const secret = tokenSecret(env);
  if (!secret) return { ok: false, error: 'Scanner entitlement signing is not configured.' };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    plan: cleanPlan(session),
    scopes: ['scan'],
    source: 'stripe_webhook',
    stripeSessionId: String(session.id || ''),
    stripeCustomerId: String(session.customer || ''),
    eventType,
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  };
  const token = await signToken(secret, payload);
  const record = {
    subject,
    plan: payload.plan,
    scopes: payload.scopes,
    source: payload.source,
    stripeSessionId: payload.stripeSessionId,
    stripeCustomerId: payload.stripeCustomerId,
    eventType,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify(record), { expirationTtl: 365 * 24 * 60 * 60 });
    if (payload.stripeSessionId) {
      await env.SCAN_USAGE_KV.put(`entitlement_session:${payload.stripeSessionId}`, subject, { expirationTtl: 365 * 24 * 60 * 60 });
    }
  }

  if (env.SUBSCRIBERS_DB && typeof env.SUBSCRIBERS_DB.prepare === 'function') {
    await env.SUBSCRIBERS_DB.prepare(
      `CREATE TABLE IF NOT EXISTS payment_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        stripe_session_id TEXT,
        subject TEXT,
        plan TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
    ).run();
    await env.SUBSCRIBERS_DB.prepare(
      'INSERT INTO payment_events (event_type, stripe_session_id, subject, plan) VALUES (?, ?, ?, ?)',
    ).bind(eventType, payload.stripeSessionId, subject, payload.plan).run();
  }

  return { ok: true, subject, tokenCreated: true };
}

export async function onRequestPost({ request, env }) {
  const secret = webhookSecret(env);
  if (!secret) return json({ ok: false, error: 'Stripe webhook secret is not configured.' }, 503);

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('stripe-signature') || '';
  if (!(await verifyStripeSignature(rawBody, signatureHeader, secret))) {
    return json({ ok: false, error: 'Invalid Stripe signature.' }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
  }

  if (!ACCEPTED_EVENTS.has(event.type)) return json({ ok: true, ignored: true, event: String(event.type || '') });

  const session = event?.data?.object;
  if (!isPaidSession(session, event.type)) {
    return json({ ok: true, ignored: true, event: event.type, reason: 'checkout_not_paid' });
  }

  const stored = await storeEntitlement(session, event.type, env);
  if (!stored.ok) return json({ ok: false, error: stored.error }, 422);
  return json({ ok: true, event: event.type, subject: stored.subject, entitlementStored: true });
}

export async function onRequestGet() {
  return json({
    ok: false,
    endpoint: 'stripe-webhook',
    methods: ['POST'],
    error: 'Stripe webhooks must be sent as signed POST requests.',
  }, 405);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
}
