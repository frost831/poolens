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
  return {
    apiKey: (env.SENDGRID_API_KEY || '').trim(),
    from: (env.SENDGRID_FROM || env.FLAGSHIP_NOTIFY_FROM || 'hello@splashlens.com').trim(),
    to: (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim(),
  };
}

async function sendWaitlistAlert(env, record) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from || !config.to) {
    return { sent: false, reason: 'missing_sendgrid_config' };
  }

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

  const record = {
    email,
    preferredLanguage: clean(body.preferred_language || request.headers.get('X-BZM-Language') || body.language_profile?.preferredLanguage || 'en', 16),
    locale: clean(body.locale || request.headers.get('X-BZM-Locale') || body.language_profile?.locale || body.preferred_language || 'en', 32),
    languageProfile: body.language_profile && typeof body.language_profile === 'object' ? body.language_profile : {},
    source: clean(body.source || 'app-landing', 60),
    path: clean(body.path || '', 300),
    referrer: clean(request.headers.get('Referer') || body.referrer, 500),
    country: clean(request.cf?.country || request.headers.get('CF-IPCountry'), 10),
    createdAt: new Date().toISOString(),
  };

  console.log('SplashLens waitlist signup:', JSON.stringify(record));

  const alert = await sendWaitlistAlert(env, record);
  console.log('SplashLens waitlist alert:', JSON.stringify({ email, alert }));

  return json(request, env, 200, {
    ok: true,
    message: "You're on the list.",
    alertQueued: Boolean(alert.sent),
    emailConfigured: alert.reason !== 'missing_sendgrid_config',
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
