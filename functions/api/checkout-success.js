import { recordPaymentEvent, sessionAttribution } from '../_shared/payment-funnel.mjs';
import { grantClosingPass, isClosingPass, verifiedClosingPassPayment } from '../_shared/closing-pass.mjs';

const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function tokenSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

async function stripeGet(path, env) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!response.ok) {
    console.error('SplashLens Stripe lookup failed', response.status, await response.text());
    return null;
  }
  return response.json();
}

function isPaid(session) {
  return session && ['paid', 'no_payment_required'].includes(String(session.payment_status || ''));
}

async function activeSubscription(session, env) {
  const subscriptionId = String(session?.subscription || '').trim();
  if (session?.mode !== 'subscription' || !/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) return { active: false };
  const subscription = await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`, env);
  if (!subscription) return { active: false, unavailable: true };
  return { active: ['active', 'trialing'].includes(String(subscription.status || '')), subscription };
}

function cleanSubject(session) {
  const email = String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase();
  const customer = String(session?.customer || '').trim();
  return email || customer;
}

function cleanPlan(session) {
  const metadataPlan = String(session?.metadata?.plan || '').trim();
  if (metadataPlan) return metadataPlan.slice(0, 80);
  return 'Splash Lens Pro Unlimited';
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

async function ensurePaymentTables(db) {
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

async function persistActivation(session, subject, plan, env, subscription) {
  if (!env.SUBSCRIBERS_DB || typeof env.SUBSCRIBERS_DB.prepare !== 'function') return false;
  const db = env.SUBSCRIBERS_DB;
  await ensurePaymentTables(db);
  const sessionId = String(session.id || '');
  const customerId = String(session.customer || '');
  const fallbackDays = /year|annual/i.test(plan) ? 370 : 35;
  const periodEnd = Number(subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end || 0);
  const expiresAt = periodEnd > 0
    ? new Date(periodEnd * 1000).toISOString()
    : new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(
    `INSERT INTO payment_events (event_type, stripe_session_id, subject, plan)
     SELECT 'checkout.success.recovered', ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM payment_events WHERE event_type = 'checkout.success.recovered' AND stripe_session_id = ?
     )`,
  ).bind(sessionId, subject, plan, sessionId).run();
  await db.prepare(
    `INSERT INTO commercial_entitlements (id, email, lane, plan, status, source, stripe_session_id, stripe_customer_id, current_period_end)
     VALUES (?, ?, 'pro', ?, 'active', 'stripe_checkout_success', ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       plan = excluded.plan,
       status = 'active',
       source = CASE WHEN commercial_entitlements.source = 'stripe_webhook' THEN commercial_entitlements.source ELSE excluded.source END,
       stripe_customer_id = excluded.stripe_customer_id,
       current_period_end = COALESCE(commercial_entitlements.current_period_end, excluded.current_period_end),
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(
    `stripe:${sessionId || subject}`,
    subject,
    plan,
    sessionId,
    customerId,
    expiresAt,
  ).run();
  await db.prepare(
    `INSERT OR IGNORE INTO audit_records (id, actor_email, action, target_type, target_id, payload)
     VALUES (?, ?, 'stripe_checkout_success_recovered', 'commercial_entitlement', ?, ?)`,
  ).bind(
    `audit_checkout_success:${sessionId}`,
    subject,
    `stripe:${sessionId || subject}`,
    JSON.stringify({ stripe_session_id: sessionId, stripe_customer_id: customerId, plan }).slice(0, 2400),
  ).run();
  return true;
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

async function issueActivation(session, env, subscription) {
  const secret = tokenSecret(env);
  if (!secret) return { error: 'Scanner entitlement signing is not configured.' };

  const subject = cleanSubject(session);
  if (!subject) return { error: 'Checkout completed, but no customer email was returned.' };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    plan: cleanPlan(session),
    scopes: ['scan'],
    source: 'stripe_checkout',
    stripeSessionId: String(session.id || ''),
    stripeCustomerId: String(session.customer || ''),
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  };
  const token = await signToken(secret, payload);
  const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`;

  await persistActivation(session, subject, payload.plan, env, subscription);

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify({
      subject,
      plan: payload.plan,
      scopes: payload.scopes,
      source: payload.source,
      stripeSessionId: payload.stripeSessionId,
      stripeCustomerId: payload.stripeCustomerId,
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    }), { expirationTtl: 365 * 24 * 60 * 60 });
    if (payload.stripeSessionId) {
      await env.SCAN_USAGE_KV.put(`entitlement_session:${payload.stripeSessionId}`, subject, { expirationTtl: 365 * 24 * 60 * 60 });
    }
    if (payload.stripeCustomerId) {
      await env.SCAN_USAGE_KV.put(`entitlement_customer:${payload.stripeCustomerId}`, subject, { expirationTtl: 365 * 24 * 60 * 60 });
    }
    await env.SCAN_USAGE_KV.delete(`entitlement_revoked:${subject}`);
  }

  const proof = { plan: payload.plan, path: '/api/checkout-success', props: { ...sessionAttribution(session), payment_status: session.payment_status } };
  await recordPaymentEvent(env, 'checkout_completed', session.id, proof);
  await recordPaymentEvent(env, 'subscription_created', String(session.subscription || ''), proof);
  await recordPaymentEvent(env, 'entitlement_granted', session.id, proof);
  return { activateUrl, subject };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = String(url.searchParams.get('session_id') || '').trim();
  if (!/^cs_(test|live)_[A-Za-z0-9]+/.test(sessionId)) {
    return html('<h1>SplashLens checkout</h1><p>Missing a valid checkout session.</p>', 400);
  }

  const session = await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`, env);
  if (!session) {
    return html('<h1>SplashLens checkout</h1><p>Checkout lookup is not configured yet. Contact support for activation.</p>', 503);
  }
  if (session.id !== sessionId) {
    return html('<h1>SplashLens checkout</h1><p>Checkout verification failed.</p>', 503);
  }
  if (isClosingPass(session)) {
    const paidAt = await verifiedClosingPassPayment(session, env);
    if (!paidAt) {
      return html('<h1>SplashLens checkout</h1><p>Closing Pro payment could not be verified yet.</p>', 503);
    }
    const activation = await grantClosingPass(session, paidAt, env, 'stripe_checkout_success');
    if (!activation.ok) {
      return html(`<h1>SplashLens checkout</h1><p>${escapeHtml(activation.error)}</p>`, activation.status);
    }
    const proof = { plan: 'closing_pass_60d', path: '/api/checkout-success', props: { ...sessionAttribution(session), payment_status: session.payment_status } };
    await recordPaymentEvent(env, 'checkout_completed', session.id, proof);
    await recordPaymentEvent(env, 'entitlement_granted', session.id, proof);
    const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(activation.token)}`;
    return html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Closing Pro activated</title></head><body><main><h1>Closing Pro activated.</h1><p>Pro access for ${escapeHtml(activation.subject)} is active until ${escapeHtml(activation.expiresAt)}.</p><a href="${escapeHtml(activateUrl)}">Open SplashLens scanner</a></main></body></html>`);
  }
  if (!isSplashLensCheckoutSession(session, env)) {
    return html('<h1>SplashLens checkout</h1><p>This checkout session is not a Splash Lens Pro Unlimited purchase. Contact support if this looks wrong.</p>', 403);
  }
  if (!isPaid(session)) {
    return html('<h1>SplashLens checkout</h1><p>Payment is not complete yet. Refresh after Stripe finishes processing.</p>', 402);
  }

  const subscriptionState = await activeSubscription(session, env);
  if (subscriptionState.unavailable) {
    return html('<h1>SplashLens checkout</h1><p>Subscription verification is temporarily unavailable. Refresh in a moment or contact support.</p>', 503);
  }
  if (!subscriptionState.active) {
    return html('<h1>SplashLens checkout</h1><p>The subscription is not active. Contact support if this looks wrong.</p>', 403);
  }

  const activation = await issueActivation(session, env, subscriptionState.subscription);
  if (activation.error) {
    return html(`<h1>SplashLens checkout complete</h1><p>${escapeHtml(activation.error)} Contact support for activation.</p>`, 503);
  }

  return html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SplashLens scanner activated</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:#061b22;color:#eef8fb;display:grid;place-items:center;min-height:100vh;padding:24px}
    main{width:min(560px,100%);border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);border-radius:18px;padding:28px}
    a{display:inline-flex;margin-top:18px;padding:13px 16px;border-radius:999px;background:#58d68d;color:#061b22;font-weight:800;text-decoration:none}
    p{color:rgba(238,248,251,.78);line-height:1.5}
  </style>
</head>
<body>
  <main>
    <h1>Scanner activated.</h1>
    <p>Your paid scanner entitlement is ready for ${escapeHtml(activation.subject)}. Open SplashLens to attach it to this browser.</p>
    <a href="${escapeHtml(activation.activateUrl)}">Open SplashLens scanner</a>
  </main>
</body>
</html>`);
}
