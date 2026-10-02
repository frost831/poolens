const TOKEN_PREFIX = 'sl_scan_v1';
const ACCEPTED_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'charge.refunded',
  'charge.dispute.created',
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

function webhookSecrets(env) {
  return [
    env.SPLASHLENS_STRIPE_WEBHOOK_SECRET,
    env.STRIPE_WEBHOOK_SECRET,
    env.SPLASHLENS_STRIPE_WEBHOOK_SECRETS,
    env.STRIPE_WEBHOOK_SECRETS,
  ]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter((value, index, list) => value && list.indexOf(value) === index);
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
  return String(session?.metadata?.plan || session?.metadata?.product || 'Splash Lens Pro Unlimited').trim().slice(0, 100);
}

function allowedPaymentLinkIds(env) {
  return [
    env.SPLASHLENS_STRIPE_PAYMENT_LINK_IDS,
    env.SPLASHLENS_STRIPE_ALLOWED_PAYMENT_LINKS,
    env.SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID,
    env.SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID,
  ]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter((value, index, list) => value && list.indexOf(value) === index);
}

function isSplashLensCheckoutSession(session, env) {
  const metadata = session?.metadata || {};
  const subscriptionMetadata = session?.subscription_data?.metadata || {};
  const product = String(metadata.product || subscriptionMetadata.product || '').toLowerCase();
  const feature = String(metadata.feature || subscriptionMetadata.feature || '').toLowerCase();
  const plan = cleanPlan(session).toLowerCase();
  const paymentLink = String(session?.payment_link || '').trim();
  const allowedLinks = allowedPaymentLinkIds(env);

  if (product === 'splashlens' && feature === 'scanner' && /splash lens pro unlimited/.test(plan)) return true;
  if (paymentLink && allowedLinks.includes(paymentLink)) return true;
  return false;
}

function isPaidSession(session, eventType) {
  return (
    eventType === 'checkout.session.async_payment_succeeded' ||
    session?.payment_status === 'paid' ||
    session?.payment_status === 'no_payment_required'
  );
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = String(signatureHeader || '')
    .split(',')
    .map((part) => part.trim().split('='))
    .filter((pair) => pair.length === 2);
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1] || 0);
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((signature) => constantTimeEqual(expected, signature));
}

async function verifyAnyStripeSignature(rawBody, signatureHeader, secrets) {
  for (const secret of secrets) {
    if (await verifyStripeSignature(rawBody, signatureHeader, secret)) return true;
  }
  return false;
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
    if (payload.stripeCustomerId) {
      await env.SCAN_USAGE_KV.put(`entitlement_customer:${payload.stripeCustomerId}`, subject, { expirationTtl: 365 * 24 * 60 * 60 });
    }
    await env.SCAN_USAGE_KV.delete(`entitlement_revoked:${subject}`);
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
      `CREATE TABLE IF NOT EXISTS commercial_entitlements (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        team_id TEXT,
        lane TEXT NOT NULL,
        plan TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        source TEXT,
        stripe_session_id TEXT,
        stripe_customer_id TEXT,
        current_period_end DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ).run();
    await env.SUBSCRIBERS_DB.prepare(
      `CREATE TABLE IF NOT EXISTS audit_records (
        id TEXT PRIMARY KEY,
        actor_email TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        payload TEXT,
        user_agent TEXT,
        referrer TEXT,
        country TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ).run();
    await env.SUBSCRIBERS_DB.prepare(
      'INSERT INTO payment_events (event_type, stripe_session_id, subject, plan) VALUES (?, ?, ?, ?)',
    ).bind(eventType, payload.stripeSessionId, subject, payload.plan).run();
    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end)
       VALUES (?, ?, 'pro', ?, 'active', 'stripe_webhook', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         plan = excluded.plan,
         status = 'active',
         source = 'stripe_webhook',
         stripe_customer_id = excluded.stripe_customer_id,
         current_period_end = excluded.current_period_end,
         updated_at = CURRENT_TIMESTAMP`,
    ).bind(
      `stripe:${payload.stripeSessionId || subject}`,
      subject,
      payload.plan,
      payload.stripeSessionId,
      payload.stripeCustomerId,
      record.expiresAt,
    ).run();
    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO audit_records (id, actor_email, action, target_type, target_id, payload)
       VALUES (?, ?, 'stripe_entitlement_activated', 'commercial_entitlement', ?, ?)`,
    ).bind(
      `audit_${crypto.randomUUID()}`,
      subject,
      `stripe:${payload.stripeSessionId || subject}`,
      JSON.stringify({
        event_type: eventType,
        plan: payload.plan,
        stripe_session_id: payload.stripeSessionId,
        stripe_customer_id: payload.stripeCustomerId,
      }).slice(0, 2400),
    ).run();
  }

  return { ok: true, subject, tokenCreated: true };
}

async function ensurePaymentTables(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS stripe_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS payment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      stripe_session_id TEXT,
      subject TEXT,
      plan TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS commercial_entitlements (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      team_id TEXT,
      lane TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      source TEXT,
      stripe_session_id TEXT,
      stripe_customer_id TEXT,
      current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS audit_records (
      id TEXT PRIMARY KEY,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      payload TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
}

async function webhookEventStatus(db, event) {
  await ensurePaymentTables(db);
  const eventId = String(event?.id || '').trim();
  if (!eventId) return { eventId: '', duplicate: false };
  const existing = await db.prepare('SELECT status FROM stripe_webhook_events WHERE event_id = ?').bind(eventId).first();
  if (existing?.status === 'processed') return { eventId, duplicate: true };
  await db.prepare(
    `INSERT INTO stripe_webhook_events (event_id, event_type, status)
     VALUES (?, ?, 'received')
     ON CONFLICT(event_id) DO UPDATE SET event_type = excluded.event_type, updated_at = CURRENT_TIMESTAMP`,
  ).bind(eventId, String(event?.type || '')).run();
  return { eventId, duplicate: false };
}

async function markWebhookProcessed(db, eventId) {
  if (!eventId) return;
  await db.prepare(
    `UPDATE stripe_webhook_events
     SET status = 'processed', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE event_id = ?`,
  ).bind(eventId).run();
}

function subscriptionCustomer(object) {
  return String(object?.customer || object?.customer_id || object?.subscription_details?.customer || '').trim();
}

function lifecycleReference(object, eventType) {
  if (eventType.startsWith('customer.subscription.')) return String(object?.id || '').trim();
  if (eventType.startsWith('invoice.')) return String(object?.subscription || object?.parent?.subscription_details?.subscription || object?.id || '').trim();
  return String(object?.invoice || object?.payment_intent || object?.id || '').trim();
}

function subscriptionStatus(object, eventType) {
  if (eventType === 'customer.subscription.deleted') return 'canceled';
  if (eventType === 'customer.subscription.paused') return 'paused';
  if (eventType === 'customer.subscription.resumed' || eventType === 'invoice.paid') return 'active';
  if (eventType === 'invoice.payment_failed' || eventType === 'invoice.payment_action_required') return 'past_due';
  if (eventType === 'charge.refunded') return 'refunded';
  if (eventType === 'charge.dispute.created') return 'disputed';
  return String(object?.status || 'active').trim().toLowerCase().slice(0, 80);
}

function lifecycleMetadata(object) {
  return object?.metadata
    || object?.subscription_details?.metadata
    || object?.parent?.subscription_details?.metadata
    || object?.lines?.data?.[0]?.metadata
    || {};
}

function hasSplashLensLifecycleMetadata(object) {
  const metadata = lifecycleMetadata(object);
  const product = String(metadata.product || '').trim().toLowerCase();
  const feature = String(metadata.feature || '').trim().toLowerCase();
  return product === 'splashlens' && feature === 'scanner';
}

function periodEnd(object) {
  const ts = Number(object?.current_period_end || object?.lines?.data?.[0]?.period?.end || 0);
  return ts > 0 ? new Date(ts * 1000).toISOString() : null;
}

async function storeLifecycleEvent(object, eventType, env) {
  if (!env.SUBSCRIBERS_DB || typeof env.SUBSCRIBERS_DB.prepare !== 'function') {
    return { ok: true, stored: false, reason: 'db_not_configured' };
  }
  const db = env.SUBSCRIBERS_DB;
  await ensurePaymentTables(db);
  const customer = subscriptionCustomer(object);
  const subscriptionId = lifecycleReference(object, eventType);
  const entitlement = customer
    ? await db.prepare(
      `SELECT email, plan, stripe_session_id AS stripeSessionId, stripe_customer_id AS stripeCustomerId
       FROM commercial_entitlements WHERE stripe_customer_id = ? ORDER BY updated_at DESC LIMIT 1`,
    ).bind(customer).first()
    : null;
  if (!entitlement?.email && !hasSplashLensLifecycleMetadata(object)) {
    return { ok: true, stored: false, ignored: true, reason: 'non_splashlens_lifecycle' };
  }
  const subject = String(entitlement?.email || object?.customer_email || object?.customer_details?.email || customer || '').trim().toLowerCase().slice(0, 160);
  const metadata = lifecycleMetadata(object);
  const plan = String(entitlement?.plan || metadata.plan || metadata.product || object?.billing_reason || cleanPlan(object)).trim().slice(0, 100);
  await db.prepare(
    'INSERT INTO payment_events (event_type, stripe_session_id, subject, plan) VALUES (?, ?, ?, ?)',
  ).bind(eventType, subscriptionId, subject, plan).run();
  if (customer) {
    await db.prepare(
      `UPDATE commercial_entitlements
       SET status = ?, current_period_end = COALESCE(?, current_period_end), updated_at = CURRENT_TIMESTAMP
       WHERE stripe_customer_id = ?`,
    ).bind(subscriptionStatus(object, eventType), periodEnd(object), customer).run();
  }
  const status = subscriptionStatus(object, eventType);
  if (subject && env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    if (['active', 'trialing'].includes(status)) {
      await env.SCAN_USAGE_KV.delete(`entitlement_revoked:${subject}`);
    } else {
      await env.SCAN_USAGE_KV.put(`entitlement_revoked:${subject}`, JSON.stringify({
        status,
        eventType,
        customer,
        updatedAt: new Date().toISOString(),
      }), { expirationTtl: 730 * 24 * 60 * 60 });
      await env.SCAN_USAGE_KV.delete(`entitlement:${subject}`);
    }
  }
  await db.prepare(
    `INSERT INTO audit_records (id, actor_email, action, target_type, target_id, payload)
     VALUES (?, ?, ?, 'stripe_lifecycle', ?, ?)`,
  ).bind(
    `audit_${crypto.randomUUID()}`,
    subject,
    `stripe_${eventType.replace(/\W+/g, '_')}`,
    subscriptionId || customer || eventType,
    JSON.stringify({ event_type: eventType, stripe_customer_id: customer, subscription_id: subscriptionId, status }).slice(0, 2400),
  ).run();
  return { ok: true, stored: true, subject, status };
}

export async function onRequestPost({ request, env }) {
  const secrets = webhookSecrets(env);
  if (!secrets.length) return json({ ok: false, error: 'Stripe webhook secret is not configured.' }, 503);

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('stripe-signature') || '';
  if (!(await verifyAnyStripeSignature(rawBody, signatureHeader, secrets))) {
    const url = new URL(request.url);
    if (url.searchParams.has('rotation') && String(url.searchParams.get('rotation') || '').startsWith('flagship-audit-')) {
      return json({
        ok: true,
        ignored: true,
        reason: 'stale_flagship_audit_rotation_endpoint_signature_mismatch',
        action: 'Remove this old rotation webhook endpoint from Stripe Dashboard or add its whsec secret to SPLASHLENS_STRIPE_WEBHOOK_SECRETS.',
      }, 200);
    }
    return json({ ok: false, error: 'Invalid Stripe signature.' }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
  }

  if (!ACCEPTED_EVENTS.has(event.type)) return json({ ok: true, ignored: true, event: String(event.type || '') });

  const webhookDb = env.SUBSCRIBERS_DB && typeof env.SUBSCRIBERS_DB.prepare === 'function' ? env.SUBSCRIBERS_DB : null;
  const receipt = webhookDb ? await webhookEventStatus(webhookDb, event) : { eventId: '', duplicate: false };
  if (receipt.duplicate) {
    return json({ ok: true, event: event.type, duplicate: true, eventId: receipt.eventId });
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    const storedLifecycle = await storeLifecycleEvent(event?.data?.object, event.type, env);
    if (webhookDb) await markWebhookProcessed(webhookDb, receipt.eventId);
    return json({
      ok: true,
      event: event.type,
      lifecycleStored: Boolean(storedLifecycle.stored),
      ignored: Boolean(storedLifecycle.ignored),
      reason: storedLifecycle.reason || '',
      status: storedLifecycle.status || '',
    });
  }

  const session = event?.data?.object;
  if (!isSplashLensCheckoutSession(session, env)) {
    if (webhookDb) await markWebhookProcessed(webhookDb, receipt.eventId);
    return json({
      ok: true,
      ignored: true,
      event: event.type,
      reason: 'non_splashlens_checkout_session',
      plan: cleanPlan(session),
    });
  }
  if (!isPaidSession(session, event.type)) {
    if (webhookDb) await markWebhookProcessed(webhookDb, receipt.eventId);
    return json({ ok: true, ignored: true, event: event.type, reason: 'checkout_not_paid' });
  }

  const stored = await storeEntitlement(session, event.type, env);
  if (!stored.ok) return json({ ok: false, error: stored.error }, 422);
  if (webhookDb) await markWebhookProcessed(webhookDb, receipt.eventId);
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
