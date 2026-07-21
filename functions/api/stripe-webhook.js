import { recordVerifiedSplashLensPayment } from '../_shared/splashlens-payment.mjs';
import {
  splashLensActivationUrl,
  splashLensAllowedPaymentLinkIds,
  splashLensPlanFromSession,
} from '../_shared/splashlens-plans.mjs';
import { refundedEntitlementDecision } from '../_shared/splashlens-refund.mjs';

const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

const CHECKOUT_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);
const REFUND_EVENTS = new Set(['charge.refunded']);

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function tokenSecret(env) {
  const secret = clean(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET, 300);
  return secret.length >= 32 ? secret : '';
}

function webhookSecret(env) {
  const secret = clean(env.STRIPE_WEBHOOK_SECRET || env.SPLASHLENS_STRIPE_WEBHOOK_SECRET, 300);
  return secret.startsWith('whsec_') ? secret : '';
}

function notifyConfig(env) {
  return {
    apiKey: clean(env.SENDGRID_API_KEY, 300),
    from: clean(env.SENDGRID_FROM || env.FLAGSHIP_NOTIFY_FROM || 'hello@splashlens.com', 180),
    replyTo: clean(env.SPLASHLENS_REPLY_TO || env.SENDGRID_REPLY_TO || 'hello@splashlens.com', 180),
    ownerTo: clean(env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL, 180),
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mailHtml(text) {
  const rows = String(text || '').split('\n').map((line) => {
    if (!line) return '<div style="height:12px"></div>';
    if (/^https:\/\//i.test(line)) {
      const url = escapeHtml(line);
      return `<p style="margin:0 0 16px"><a href="${url}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open SplashLens</a></p>`;
    }
    return `<p style="margin:0 0 10px;line-height:1.5">${escapeHtml(line)}</p>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#15312d"><div style="max-width:600px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border-radius:12px;padding:28px">${rows}</div></div></body></html>`;
}

function allowedPaymentLinkIds(env) {
  return new Set(splashLensAllowedPaymentLinkIds(env).keys());
}

function isRecognizedSplashLensCheckout(session, env) {
  const metadata = session?.metadata || {};
  const product = clean(metadata.product || metadata.app || '', 80).toLowerCase();
  const feature = clean(metadata.feature || '', 80).toLowerCase();
  if (product === 'splashlens' || feature === 'scanner') return true;

  const paymentLink = clean(session?.payment_link, 120);
  const allowed = allowedPaymentLinkIds(env);
  if (allowed.size > 0) return allowed.has(paymentLink);

  return String(env.SPLASHLENS_STRIPE_WEBHOOK_ALLOW_UNTAGGED_PAYMENT_LINKS || '').toLowerCase() === 'true'
    && paymentLink.startsWith('plink_');
}

function paidEnough(session) {
  return session?.payment_status === 'paid' || session?.status === 'complete';
}

function subjectFromSession(session) {
  return clean(session?.customer_details?.email || session?.customer_email || session?.customer, 180).toLowerCase();
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!secret) return { ok: false, error: 'missing_webhook_secret' };
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, ...value] = part.split('=');
      return [key, value.join('=')];
    }),
  );
  const timestamp = Number(parts.t || 0);
  const signature = parts.v1 || '';
  if (!timestamp || !signature) return { ok: false, error: 'invalid_signature_header' };
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 5 * 60) {
    return { ok: false, error: 'signature_timestamp_outside_tolerance' };
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return constantTimeEqual(expected, signature)
    ? { ok: true }
    : { ok: false, error: 'signature_mismatch' };
}

async function issueActivation(session, env) {
  const secret = tokenSecret(env);
  if (!secret) return { ok: false, error: 'missing_entitlement_secret' };

  const subject = subjectFromSession(session);
  if (!subject) return { ok: false, error: 'missing_customer_subject' };

  const plan = splashLensPlanFromSession(session, env);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    plan: plan.displayName,
    planKey: plan.key,
    feature: plan.feature,
    scopes: plan.scopes,
    source: 'stripe_webhook',
    stripeSessionId: clean(session.id, 120),
    stripeCustomerId: clean(session.customer, 120),
    stripePaymentLinkId: clean(session.payment_link, 120),
    stripePaymentIntentId: clean(session.payment_intent, 120),
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  };
  const token = await signToken(secret, payload);
  const activateUrl = splashLensActivationUrl(token, plan);
  const record = {
    subject,
    plan: payload.plan,
    planKey: payload.planKey,
    feature: payload.feature,
    scopes: payload.scopes,
    source: payload.source,
    stripeSessionId: payload.stripeSessionId,
    stripeCustomerId: payload.stripeCustomerId,
    stripePaymentLinkId: payload.stripePaymentLinkId,
    stripePaymentIntentId: payload.stripePaymentIntentId,
    amountTotal: Number(session.amount_total || 0),
    currency: clean(session.currency, 12),
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify(record), {
      expirationTtl: 365 * 24 * 60 * 60,
    });
  }

  await recordVerifiedSplashLensPayment(env, session, {
    subject,
    plan: record.plan,
    planKey: record.planKey,
    feature: record.feature,
    scopes: record.scopes,
    source: 'stripe_webhook',
    path: '/api/stripe-webhook',
  });

  return { ok: true, subject, activateUrl, entitlement: record };
}

async function sendMail(config, to, subject, text, templateId, categories = [], customArgs = {}) {
  if (!config.apiKey || !config.from || !to) return { sent: false, reason: 'missing_sendgrid_config' };
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
        subject,
        custom_args: {
          ...customArgs,
          product: 'splashlens',
          template_id: templateId,
          correlation_id: crypto.randomUUID(),
        },
      }],
      from: { email: config.from, name: 'SplashLens' },
      reply_to: { email: config.replyTo, name: 'SplashLens Support' },
      categories: ['splashlens', 'payment', ...categories],
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: mailHtml(text) },
      ],
    }),
  });
  return { sent: response.ok, status: response.status };
}

async function sendActivationEmails(env, session, activation) {
  const config = notifyConfig(env);
  const buyerText = [
    'Thanks for upgrading SplashLens.',
    '',
    `Plan: ${activation.entitlement.plan}`,
    '',
    'Open this activation link on the device/browser where you use SplashLens:',
    activation.activateUrl,
    '',
    'Manual lookup, dosing, reports, filters, and checklists remain free. Paid SplashLens lanes add the proof, scanner, team, facility, training, or partner workflow listed on your plan.',
    '',
    'Talk Soon,',
    'Joshua Frost',
    'SplashLens',
  ].join('\n');
  const ownerText = [
    'SplashLens checkout completed.',
    '',
    `Customer: ${activation.subject}`,
    `Plan: ${activation.entitlement.plan}`,
    `Feature: ${activation.entitlement.feature || ''}`,
    `Scopes: ${(activation.entitlement.scopes || []).join(', ')}`,
    `Amount: ${session.amount_total || ''} ${session.currency || ''}`,
    `Stripe session: ${session.id || ''}`,
    `Payment link: ${session.payment_link || ''}`,
    '',
    `Activation link: ${activation.activateUrl}`,
  ].join('\n');

  const sessionId = clean(session.id || crypto.randomUUID(), 120);
  const metadata = { stripe_session_id: sessionId };
  const dedupeKey = `email:checkout-activation:${sessionId}`;
  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.get === 'function') {
    const prior = await env.SCAN_USAGE_KV.get(dedupeKey);
    if (prior) return {
      buyer: { sent: true, deduplicated: true },
      owner: { sent: true, deduplicated: true },
    };
    await env.SCAN_USAGE_KV.put(dedupeKey, 'pending', { expirationTtl: 7 * 24 * 60 * 60 });
  }
  const buyer = await sendMail(config, activation.subject, `Your SplashLens ${activation.entitlement.plan} activation`, buyerText, 'paid_activation', ['buyer-activation'], metadata);
  const owner = await sendMail(config, config.ownerTo, '[SplashLens Payment] Checkout completed', ownerText, 'paid_activation_owner_alert', ['owner-alert'], metadata);
  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    if (buyer.sent && owner.sent) {
      await env.SCAN_USAGE_KV.put(dedupeKey, 'sent', { expirationTtl: 365 * 24 * 60 * 60 });
    } else if (typeof env.SCAN_USAGE_KV.delete === 'function') {
      await env.SCAN_USAGE_KV.delete(dedupeKey);
    }
  }
  return { buyer, owner };
}

async function handleCheckoutSession(event, env) {
  const session = event.data?.object || {};
  if (!paidEnough(session)) return { ok: true, action: 'ignored_unpaid_or_incomplete' };
  if (!isRecognizedSplashLensCheckout(session, env)) {
    return { ok: true, action: 'ignored_unrecognized_checkout', sessionId: clean(session.id, 120) };
  }

  const activation = await issueActivation(session, env);
  if (!activation.ok) return { ok: false, error: activation.error };
  const emails = await sendActivationEmails(env, session, activation);
  return {
    ok: true,
    action: 'entitlement_issued',
    subject: activation.subject,
    emailSent: Boolean(emails.buyer.sent),
    ownerAlertSent: Boolean(emails.owner.sent),
  };
}

export async function handleRefundedCharge(event, env) {
  const charge = event.data?.object || {};
  const initial = refundedEntitlementDecision(charge);
  if (initial.action === 'ignored_partial_or_incomplete_refund') {
    return { ok: true, action: 'ignored_partial_or_incomplete_refund' };
  }
  const subject = clean(initial.subject, 180).toLowerCase();
  const paymentIntentId = clean(initial.paymentIntentId, 120);
  if (!subject || !paymentIntentId) {
    return { ok: true, action: 'refund_missing_entitlement_identity' };
  }
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.get !== 'function') {
    return { ok: false, error: 'missing_entitlement_storage' };
  }
  const key = `entitlement:${subject}`;
  const raw = await env.SCAN_USAGE_KV.get(key);
  if (!raw) return { ok: true, action: 'refund_entitlement_not_found', subject };

  let entitlement;
  try {
    entitlement = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'stored_entitlement_unreadable' };
  }
  const decision = refundedEntitlementDecision(charge, entitlement);
  if (!decision.shouldRevoke) {
    return { ok: true, action: 'refund_did_not_match_current_entitlement', subject };
  }
  if (typeof env.SCAN_USAGE_KV.delete !== 'function') {
    return { ok: false, error: 'entitlement_delete_unavailable' };
  }
  await env.SCAN_USAGE_KV.delete(key);

  const config = notifyConfig(env);
  const metadata = {
    charge_id: clean(charge.id || '', 120),
    stripe_event_id: clean(event.id || '', 120),
  };
  const buyerText = [
    'Your SplashLens payment was fully refunded.',
    '',
    `Plan: ${entitlement.plan || 'SplashLens paid access'}`,
    '',
    'The paid entitlement tied to that payment has been removed. Free SplashLens tools remain available.',
    '',
    'Questions? Reply to this email.',
  ].join('\n');
  const ownerText = [
    'SplashLens full refund processed.',
    '',
    `Customer: ${subject}`,
    `Plan: ${entitlement.plan || ''}`,
    `PaymentIntent: ${paymentIntentId}`,
    `Charge: ${charge.id || ''}`,
    '',
    'The matching paid entitlement was removed.',
  ].join('\n');
  const buyer = await sendMail(config, subject, 'Your SplashLens refund is complete', buyerText, 'paid_refund', ['buyer-refund'], metadata);
  const owner = await sendMail(config, config.ownerTo, '[SplashLens Payment] Refund completed', ownerText, 'paid_refund_owner_alert', ['owner-refund'], metadata);
  return {
    ok: true,
    action: 'entitlement_revoked_after_full_refund',
    subject,
    emailSent: Boolean(buyer.sent),
    ownerAlertSent: Boolean(owner.sent),
  };
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();
  const signature = request.headers.get('Stripe-Signature') || '';
  const verified = await verifyStripeSignature(rawBody, signature, webhookSecret(env));
  if (!verified.ok) return json(400, { ok: false, error: verified.error });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  let result;
  if (CHECKOUT_EVENTS.has(event.type)) {
    result = await handleCheckoutSession(event, env);
  } else if (REFUND_EVENTS.has(event.type)) {
    result = await handleRefundedCharge(event, env);
  } else {
    return json(200, { ok: true, action: 'ignored_event_type' });
  }
  console.log('SplashLens Stripe webhook:', JSON.stringify({ type: event.type, result }));
  return json(result.ok ? 200 : 500, result);
}

export async function onRequestGet() {
  return json(200, {
    ok: true,
    status: 'SplashLens Stripe webhook endpoint ready. Configure this URL in Stripe and keep STRIPE_WEBHOOK_SECRET private.',
  });
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

async function hmacSha256Hex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
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
