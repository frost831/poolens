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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-BZM-Language, X-BZM-Locale, X-BZM-Auto-Translate',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && allowedOrigins(env).includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: cors(request, env) });
}

function clean(value, max = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function notifyConfig(env) {
  return {
    apiKey: (env.SENDGRID_API_KEY || '').trim(),
    from: (env.SENDGRID_FROM || env.FLAGSHIP_NOTIFY_FROM || 'hello@splashlens.com').trim(),
    to: (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim(),
  };
}

async function sendFeedbackAlert(env, record) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from || !config.to) return { sent: false, reason: 'missing_sendgrid_config' };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: config.to }],
        subject: `[SplashLens PartSnap] Mystery part submitted`,
        custom_args: { product: 'splashlens', template_id: 'partsnap_feedback', correlation_id: crypto.randomUUID(), feedback_id: record.id },
      }],
      from: { email: config.from, name: 'SplashLens Alerts' },
      reply_to: record.email ? { email: record.email } : undefined,
      categories: ['splashlens', 'partsnap', 'mystery-part'],
      content: [{
        type: 'text/plain',
        value: [
          'SplashLens PartSnap mystery part',
          '',
          `Ticket: ${record.id}`,
          `Email: ${record.email || 'not provided'}`,
          `Note: ${record.note || 'not provided'}`,
          `Path: ${record.path}`,
          `Created: ${record.createdAt}`,
          '',
          record.escalation,
          '',
          `Result JSON: ${record.resultJson}`,
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
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(request, env, 400, { ok: false, error: 'Valid email required, or leave email blank.' });
  }

  const record = {
    id: `mpr-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
    email,
    note: clean(body.note, 1000),
    source: clean(body.source || 'partsnap-result', 80),
    path: clean(body.path || '', 300),
    escalation: clean(body.escalation, 2000),
    resultJson: JSON.stringify(body.result && typeof body.result === 'object' ? body.result : {}).slice(0, 4000),
    preferredLanguage: clean(body.preferred_language || request.headers.get('X-BZM-Language') || body.language_profile?.preferredLanguage || 'en', 16),
    createdAt: new Date().toISOString(),
  };

  if (env.SCAN_USAGE_KV) {
    await env.SCAN_USAGE_KV.put(`partsnap-feedback:${record.createdAt}:${crypto.randomUUID()}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365,
    });
  }

  const alert = await sendFeedbackAlert(env, record);
  return json(request, env, 200, {
    ok: true,
    ticketId: record.id,
    stored: Boolean(env.SCAN_USAGE_KV),
    alertQueued: Boolean(alert.sent),
    emailConfigured: alert.reason !== 'missing_sendgrid_config',
  });
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, { status: 204, headers: cors(request, env) });
}
