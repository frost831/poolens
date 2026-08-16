import { officialSenderConfig } from '../_shared/security-gate.mjs';

const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function cleanEmail(value) {
  const email = clean(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function tokenSecret(env) {
  const secret = clean(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET, 300);
  return secret.length >= 32 ? secret : '';
}

function notifyConfig(env) {
  const sender = officialSenderConfig(env);
  return {
    apiKey: clean(env.SENDGRID_API_KEY, 300),
    from: sender.from,
    replyTo: sender.replyTo,
    senderPolicyOk: sender.fromPolicyOk && sender.replyToPolicyOk,
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

function restoreHtml(plan, activateUrl, expiresAt) {
  const safePlan = escapeHtml(plan);
  const safeUrl = escapeHtml(activateUrl);
  const safeExpiry = escapeHtml(expiresAt || 'active entitlement');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#15312d"><div style="max-width:600px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border-radius:12px;padding:28px"><h1 style="font-size:24px">Restore ${safePlan}</h1><p style="line-height:1.5">Here is your SplashLens restore link. Open it on the device or browser where you use SplashLens.</p><p><a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Restore SplashLens access</a></p><p><strong>Plan:</strong> ${safePlan}<br><strong>Expires:</strong> ${safeExpiry}</p><p style="line-height:1.5">Manual lookup, dosing, reports, filters, and checklists remain free. Paid SplashLens lanes restore the workflow attached to your plan.</p><p>Talk Soon,<br>Joshua Frost<br>SplashLens</p></div></div></body></html>`;
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

async function sendRestoreEmail(config, email, activateUrl, entitlement) {
  if (!config.apiKey || !config.from) return { sent: false, reason: 'missing_sendgrid_config' };
  if (!config.senderPolicyOk) return { sent: false, reason: 'sender_policy_blocked' };

  const plan = clean(entitlement.plan || 'SplashLens paid access', 100);
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: `Restore your ${plan} access`,
        custom_args: {
          product: 'splashlens',
          template_id: 'entitlement_restore',
          correlation_id: crypto.randomUUID(),
          stripe_session_id: clean(entitlement.stripeSessionId || '', 120),
        },
      }],
      from: { email: config.from, name: 'SplashLens' },
      reply_to: { email: config.replyTo, name: 'SplashLens Support' },
      categories: ['splashlens', 'entitlement-restore'],
      content: [
        {
          type: 'text/plain',
          value: [
          `Here is your SplashLens ${plan} restore link.`,
          '',
          'Open this on the device/browser where you use SplashLens:',
          activateUrl,
          '',
          `Plan: ${plan}`,
          `Expires: ${entitlement.expiresAt || 'active entitlement'}`,
          '',
          'Manual lookup, dosing, reports, filters, and checklists remain free. Paid SplashLens lanes restore the scanner, proof, team, facility, training, or partner workflow attached to your plan.',
          '',
          'Talk Soon,',
          'Joshua Frost',
          'SplashLens',
          ].join('\n'),
        },
        { type: 'text/html', value: restoreHtml(plan, activateUrl, entitlement.expiresAt) },
      ],
    }),
  });

  return { sent: response.ok, status: response.status };
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  const email = cleanEmail(body.email);
  if (!email) return json(400, { ok: false, error: 'Enter the email used at checkout.' });

  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.get !== 'function') {
    return json(503, { ok: false, error: 'Restore storage is not configured.' });
  }

  const secret = tokenSecret(env);
  if (!secret) return json(503, { ok: false, error: 'Restore signing is not configured.' });

  const raw = await env.SCAN_USAGE_KV.get(`entitlement:${email}`);
  if (!raw) {
    return json(404, {
      ok: false,
      error: 'No active SplashLens paid entitlement was found for that email.',
    });
  }

  let entitlement;
  try {
    entitlement = JSON.parse(raw);
  } catch {
    return json(500, { ok: false, error: 'Stored entitlement could not be read.' });
  }

  const expiresAt = Date.parse(entitlement.expiresAt || '');
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    return json(410, { ok: false, error: 'That SplashLens entitlement has expired.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: email,
    plan: clean(entitlement.plan || 'PartSnap Pro', 100),
    scopes: Array.isArray(entitlement.scopes) && entitlement.scopes.length ? entitlement.scopes : ['scan'],
    source: 'restore',
    stripeSessionId: clean(entitlement.stripeSessionId, 120),
    stripeCustomerId: clean(entitlement.stripeCustomerId, 120),
    stripePaymentLinkId: clean(entitlement.stripePaymentLinkId, 120),
    iat: now,
    exp: Math.floor((Number.isFinite(expiresAt) ? expiresAt : Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000),
  };

  const token = await signToken(secret, payload);
  const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`;
  const mail = await sendRestoreEmail(notifyConfig(env), email, activateUrl, entitlement);

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`event:${new Date().toISOString()}:${crypto.randomUUID()}`, JSON.stringify({
      event: 'partsnap_pro_restore_requested',
      source: 'app',
      path: '/api/restore-entitlement',
      language: { preferredLanguage: 'en', locale: 'en', autoTranslate: false },
      createdAt: new Date().toISOString(),
      propsJson: JSON.stringify({ subject: email, email_sent: Boolean(mail.sent) }).slice(0, 2000),
    }), { expirationTtl: 60 * 60 * 24 * 120 });
  }

  return json(200, {
    ok: true,
    emailSent: Boolean(mail.sent),
    emailConfigured: mail.reason !== 'missing_sendgrid_config',
    message: mail.sent
      ? 'Restore link sent. Check the email used at checkout.'
      : 'Entitlement found. Email delivery is not configured; contact hello@splashlens.com for the restore link.',
  });
}

export async function onRequestGet() {
  return json(200, {
    ok: true,
    status: 'SplashLens paid-entitlement restore endpoint ready. POST the checkout email to send a restore link.',
  });
}
