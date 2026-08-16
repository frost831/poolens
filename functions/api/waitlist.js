import { officialSenderConfig, protectUserSubmission } from '../_shared/security-gate.mjs';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
];

function allowedOrigins(env) {
  return (env.SPLASHLENS_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-BZM-Language, X-BZM-Locale, X-BZM-Auto-Translate',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: cors(request, env) });
}

function clean(value, max = 120) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function notifyConfig(env) {
  const sender = officialSenderConfig(env);
  return {
    apiKey: (env.SENDGRID_API_KEY || '').trim(),
    from: sender.from,
    replyTo: sender.replyTo,
    to: (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim(),
    senderPolicyOk: sender.fromPolicyOk && sender.replyToPolicyOk,
  };
}

async function sendWaitlistAlert(env, record) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from || !config.to) {
    return { sent: false, reason: 'missing_sendgrid_config' };
  }
  if (!config.senderPolicyOk) return { sent: false, reason: 'sender_policy_blocked' };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: config.to }],
        subject: `[SplashLens] New app waitlist signup: ${record.email}`,
        custom_args: { product: 'splashlens', template_id: 'waitlist_owner_alert', correlation_id: crypto.randomUUID(), signup_id: record.correlationId },
      }],
      from: { email: config.from, name: 'SplashLens Alerts' },
      reply_to: { email: record.email },
      categories: ['splashlens', 'app-waitlist'],
      content: [{
        type: 'text/plain',
        value: [
          'New SplashLens app waitlist signup',
          '',
          `Email: ${record.email}`,
          `Preferred language: ${record.preferredLanguage}`,
          `Locale: ${record.locale}`,
          `Source: ${record.source}`,
          `Interest: ${record.interestLabel || record.interest || 'general waitlist'}`,
          `Path: ${record.path}`,
          `Referrer: ${record.referrer}`,
          `Country: ${record.country}`,
          `Created: ${record.createdAt}`,
        ].join('\n'),
      }],
    }),
  });

  return { sent: response.ok, status: response.status };
}

async function sendWaitlistConfirmation(env, record) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from) return { sent: false, reason: 'missing_sendgrid_config' };
  if (!config.senderPolicyOk) return { sent: false, reason: 'sender_policy_blocked' };
  const label = record.interestLabel || 'SplashLens updates';
  const subject = `We received your SplashLens ${label} request`;
  const text = [
    `Thanks — we received your request for ${label}.`,
    '',
    'This lane is not self-serve yet. We will review the request and reply with availability, scope, and next steps. No payment was taken.',
    '',
    'Questions? Reply to this email.',
    '',
    'Talk Soon,',
    'Joshua Frost',
    'SplashLens',
  ].join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,sans-serif;color:#15312d"><div style="max-width:600px;margin:auto;padding:24px"><h1 style="font-size:24px">Request received</h1><p>Thanks — we received your request for <strong>${label.replace(/[<>&"']/g, '')}</strong>.</p><p>This lane is not self-serve yet. We will review availability, scope, and next steps. <strong>No payment was taken.</strong></p><p>Questions? Reply to this email.</p><p>Talk Soon,<br>Joshua Frost<br>SplashLens</p></div></body></html>`;
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: record.email }],
        subject,
        custom_args: { product: 'splashlens', template_id: 'paid_lane_request_confirmation', correlation_id: crypto.randomUUID(), signup_id: record.correlationId },
      }],
      from: { email: config.from, name: 'SplashLens' },
      reply_to: { email: config.replyTo, name: 'SplashLens Support' },
      categories: ['splashlens', 'paid-lane-request'],
      content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }],
    }),
  });
  return { sent: response.ok, status: response.status };
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, env, 400, { ok: false, error: 'Invalid JSON' });
  }

  const email = clean(body.email, 200).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(request, env, 400, { ok: false, error: 'Valid email required' });
  }

  const protection = await protectUserSubmission({
    env,
    request,
    action: 'waitlist_request',
    subject: email,
    actorName: body.name || body.known_name || body.company || '',
    textParts: [body.name, body.company, body.interest, body.interest_label, body.message, body.note],
    rateLimit: { limit: 6, windowSeconds: 60 * 60 },
    context: 'waitlist_request',
  });
  if (!protection.ok) {
    return json(request, env, protection.status, {
      ok: false,
      error: protection.error,
      message: protection.message,
      reasons: protection.moderation?.reasons || [],
    });
  }

  const record = {
    correlationId: crypto.randomUUID(),
    email,
    preferredLanguage: clean(body.preferred_language || request.headers.get('X-BZM-Language') || body.language_profile?.preferredLanguage || 'en', 16),
    locale: clean(body.locale || request.headers.get('X-BZM-Locale') || body.language_profile?.locale || body.preferred_language || 'en', 32),
    languageProfile: body.language_profile && typeof body.language_profile === 'object' ? body.language_profile : {},
    source: clean(body.source || 'app-landing', 60),
    interest: clean(body.interest || '', 100),
    interestLabel: clean(body.interest_label || '', 120),
    path: clean(body.path || '', 300),
    referrer: clean(request.headers.get('Referer') || body.referrer, 500),
    country: clean(request.cf?.country || request.headers.get('CF-IPCountry'), 10),
    createdAt: new Date().toISOString(),
  };

  const dedupeKey = `waitlist:${email}:${record.interest || 'general'}`;
  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.get === 'function') {
    const prior = await env.SCAN_USAGE_KV.get(dedupeKey);
    if (prior) return json(request, env, 200, {
      ok: true,
      message: "You're already on the list.",
      deduplicated: true,
      alertQueued: true,
      confirmationQueued: record.source === 'paid-lane-request',
      emailConfigured: true,
    });
    await env.SCAN_USAGE_KV.put(dedupeKey, record.createdAt, { expirationTtl: 24 * 60 * 60 });
  }

  console.log('SplashLens waitlist signup:', JSON.stringify(record));

  const alert = await sendWaitlistAlert(env, record);
  const confirmation = record.source === 'paid-lane-request'
    ? await sendWaitlistConfirmation(env, record)
    : { sent: false, reason: 'not_paid_lane_request' };
  if (!alert.sent && !confirmation.sent && env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.delete === 'function') {
    await env.SCAN_USAGE_KV.delete(dedupeKey);
  }
  console.log('SplashLens waitlist alert:', JSON.stringify({ email, alert }));

  return json(request, env, 200, {
    ok: true,
    message: "You're on the list.",
    alertQueued: Boolean(alert.sent),
    confirmationQueued: Boolean(confirmation.sent),
    emailConfigured: alert.reason !== 'missing_sendgrid_config',
    senderPolicyOk: notifyConfig(env).senderPolicyOk,
  });
}

export async function onRequestGet({ request, env }) {
  return json(request, env, 200, {
    ok: true,
    status: 'SplashLens app waitlist endpoint ready.',
    emailConfigured: Boolean((env.SENDGRID_API_KEY || '').trim() && (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim()),
  });
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, { status: 204, headers: cors(request, env) });
}
