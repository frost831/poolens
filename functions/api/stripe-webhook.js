const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

const CHECKOUT_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

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
    ownerTo: clean(env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL, 180),
  };
}

function allowedPaymentLinkIds(env) {
  return new Set([
    clean(env.SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID, 120),
    clean(env.SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID, 120),
    clean(env.SPLASHLENS_STRIPE_PAYMENT_LINK_ANNUAL_ID, 120),
  ].filter(Boolean));
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

function planFromSession(session) {
  const metadataPlan = clean(session?.metadata?.plan, 100);
  if (metadataPlan) return metadataPlan;
  const amount = Number(session?.amount_total || 0);
  if (amount >= 3900) return 'PartSnap Pro Annual';
  return 'PartSnap Pro Monthly';
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

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    plan: planFromSession(session),
    scopes: ['scan'],
    source: 'stripe_webhook',
    stripeSessionId: clean(session.id, 120),
    stripeCustomerId: clean(session.customer, 120),
    stripePaymentLinkId: clean(session.payment_link, 120),
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  };
  const token = await signToken(secret, payload);
  const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`;
  const record = {
    subject,
    plan: payload.plan,
    scopes: payload.scopes,
    source: payload.source,
    stripeSessionId: payload.stripeSessionId,
    stripeCustomerId: payload.stripeCustomerId,
    stripePaymentLinkId: payload.stripePaymentLinkId,
    amountTotal: Number(session.amount_total || 0),
    currency: clean(session.currency, 12),
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify(record), {
      expirationTtl: 365 * 24 * 60 * 60,
    });
    await env.SCAN_USAGE_KV.put(`payment:${payload.stripeSessionId || crypto.randomUUID()}`, JSON.stringify({
      ...record,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 365 * 24 * 60 * 60 });
    await env.SCAN_USAGE_KV.put(`event:${new Date().toISOString()}:${crypto.randomUUID()}`, JSON.stringify({
      event: 'checkout_success',
      source: 'stripe',
      path: '/api/stripe-webhook',
      language: { preferredLanguage: 'en', locale: 'en', autoTranslate: false },
      createdAt: new Date().toISOString(),
      propsJson: JSON.stringify({
        subject,
        plan: record.plan,
        amount_total: record.amountTotal,
        currency: record.currency,
        stripe_session_id: record.stripeSessionId,
        stripe_payment_link_id: record.stripePaymentLinkId,
        payment_source: 'stripe_webhook',
      }).slice(0, 2000),
    }), { expirationTtl: 60 * 60 * 24 * 365 });
  }

  return { ok: true, subject, activateUrl, entitlement: record };
}

async function sendMail(config, to, subject, text, categories = []) {
  if (!config.apiKey || !config.from || !to) return { sent: false, reason: 'missing_sendgrid_config' };
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: config.from, name: 'SplashLens' },
      categories: ['splashlens', 'payment', ...categories],
      content: [{ type: 'text/plain', value: text }],
    }),
  });
  return { sent: response.ok, status: response.status };
}

async function sendActivationEmails(env, session, activation) {
  const config = notifyConfig(env);
  const buyerText = [
    'Thanks for upgrading SplashLens.',
    '',
    'Open this activation link on the device/browser where you use PartSnap:',
    activation.activateUrl,
    '',
    'Manual lookup, dosing, reports, filters, and checklists remain free. PartSnap Pro extends scanner access.',
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
    `Amount: ${session.amount_total || ''} ${session.currency || ''}`,
    `Stripe session: ${session.id || ''}`,
    `Payment link: ${session.payment_link || ''}`,
    '',
    `Activation link: ${activation.activateUrl}`,
  ].join('\n');

  const buyer = await sendMail(config, activation.subject, 'Your SplashLens PartSnap Pro activation', buyerText, ['buyer-activation']);
  const owner = await sendMail(config, config.ownerTo, '[SplashLens Payment] Checkout completed', ownerText, ['owner-alert']);
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

  if (!CHECKOUT_EVENTS.has(event.type)) return json(200, { ok: true, action: 'ignored_event_type' });

  const result = await handleCheckoutSession(event, env);
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
