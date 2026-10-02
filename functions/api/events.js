import { amplitudeEnabled, forwardEventToAmplitude } from '../_shared/amplitude.mjs';

const LOW_SIGNAL_EVENTS = new Set(['session_heartbeat']);

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'http://localhost:8788',
  'http://localhost:5173',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

const PERSONAL_PROP_KEYS = new Set([
  'email', 'e', 'sl_email', 'customer_email', 'contact_email', 'free_profile_email', 'known_email',
  'name', 'first_name', 'last_name', 'customer_name', 'contact_name', 'free_profile_name', 'known_name',
  'company', 'organization', 'org', 'account', 'free_profile_company', 'known_company',
  'phone', 'mobile', 'address', 'street', 'city', 'postal_code', 'zip',
  'lead_id', 'contact_id', 'recipient_id', 'prospect_id', 'pilot_id', 'participant_id',
]);

function safeUrlField(value, fallback = '') {
  const raw = clean(value, 500);
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw, 'https://app.splashlens.com');
    return parsed.origin === 'https://app.splashlens.com'
      ? clean(parsed.pathname, 300)
      : clean(parsed.origin, 300);
  } catch {
    return clean(raw.split(/[?#]/)[0], 300) || fallback;
  }
}

function sanitizeAnalyticsProps(props, source) {
  const hasEmail = Boolean(clean(props.known_email || props.contact_email || props.email || props.e || props.sl_email, 180));
  const hasIdentity = hasEmail || Boolean(clean(
    props.known_name || props.contact_name || props.name || props.known_company || props.company ||
    props.lead_id || props.contact_id || props.recipient_id || props.prospect_id || props.pilot_id || props.participant_id,
    180
  ));
  const sanitized = Object.fromEntries(Object.entries(props).flatMap(([key, value]) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!normalizedKey || PERSONAL_PROP_KEYS.has(normalizedKey)) return [];
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      if (typeof value !== 'string') return [[key, value]];
      const urlField = ['path', 'landing_path', 'attribution_landing_path', 'referrer', 'attribution_referrer'].includes(normalizedKey);
      const safeValue = urlField
        ? safeUrlField(value, '')
        : clean(value, 300).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[redacted-email]');
      return [[key, safeValue]];
    }
    return [];
  }));
  return {
    ...sanitized,
    client_id: clean(props.client_id || props.clientId || props.anon_device_id, 120),
    session_id: clean(props.session_id || props.sessionId, 160),
    has_known_identity: Boolean(props.has_known_identity || hasIdentity),
    has_verified_email: Boolean(props.has_verified_email || hasEmail),
    known_role: clean(props.known_role || props.role || props.audience || props.persona || props.splashlens_role, 80),
    identity_source: clean(props.identity_source || props.attribution_source || source || 'app', 80),
    identity_confidence: clean(props.identity_confidence || (hasEmail ? 'provided-email' : hasIdentity ? 'known-profile' : ''), 40),
  };
}

function isInternalNoise({ event, source, path, userAgent, props }) {
  const ua = String(userAgent || '').toLowerCase();
  const src = String(source || '').toLowerCase();
  const eventPath = String(path || '').toLowerCase();
  const queryMarkers = [
    'utm_source=qa',
    'utm_medium=playwright',
    'codex',
    'amplitude-readiness',
    'growth-plan',
    'verify=',
  ];
  const internalSource = ['qa', 'codex', 'codex_smoke', 'launch-gate-test'].includes(src);
  const internalUa = ua.includes('headless') || ua.includes('bot') || ua.includes('crawler') || ua.includes('spider') || ua.includes('preview') || ua.includes('compatible; meta-externalagent');
  const internalPath = eventPath.startsWith('/test/') || queryMarkers.some((marker) => eventPath.includes(marker));
  const synthetic = props.demo === true || props.demo === 'true' || props.test === true || props.test === 'true' || props.synthetic === true || props.synthetic === 'true';
  return event === 'session_heartbeat' && (internalSource || internalUa || internalPath || synthetic);
}

async function ensureEventsTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      source TEXT,
      path TEXT,
      plan TEXT,
      mode TEXT,
      props TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
}

async function ensureEngagementEventsTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS engagement_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      source TEXT,
      path TEXT,
      mode TEXT,
      props TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);
  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers });
  }

  const event = clean(body.event || body.name, 80);
  if (!event) {
    return new Response(JSON.stringify({ ok: false, error: 'Event name required' }), { status: 400, headers });
  }

  const rawProps = Object.assign({}, plainObject(body.props), plainObject(body.properties));
  const rawPath = clean(body.path || rawProps.path, 500);
  const path = safeUrlField(rawPath, '/');
  const plan = clean(body.plan || rawProps.plan, 80);
  const mode = clean(body.mode || rawProps.mode || rawProps.displayMode, 80);
  const source = clean(body.source || rawProps.source || 'app', 80);
  const props = sanitizeAnalyticsProps(rawProps, source);
  const referrer = safeUrlField(request.headers.get('Referer') || body.referrer || props.referrer, '');
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const country = clean(request.cf && request.cf.country, 10);
  const propsJson = JSON.stringify(props).slice(0, 2400);

  if (isInternalNoise({ event, source, path: rawPath, userAgent, props })) {
    return new Response(JSON.stringify({ ok: true, stored: false, skipped: 'internal_heartbeat_noise' }), { status: 202, headers });
  }

  if (!env.SUBSCRIBERS_DB) {
    return new Response(JSON.stringify({ ok: true, stored: false, warning: 'Event accepted without DB binding' }), { status: 202, headers });
  }

  try {
    if (LOW_SIGNAL_EVENTS.has(event)) {
      await ensureEngagementEventsTable(env.SUBSCRIBERS_DB);
      await env.SUBSCRIBERS_DB.prepare(
        `INSERT INTO engagement_events (event, source, path, mode, props, user_agent, referrer, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(event, source, path, mode, propsJson, userAgent, referrer, country).run();
      return new Response(JSON.stringify({
        ok: true,
        stored: true,
        storageBucket: 'engagement_events',
        amplitudeQueued: false,
        amplitudeConfigured: amplitudeEnabled(env),
      }), { status: 200, headers });
    }

    await ensureEventsTable(env.SUBSCRIBERS_DB);
    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(event, source, path, plan, mode, propsJson, userAgent, referrer, country).run();

    const amplitude = await forwardEventToAmplitude(env, {
      correlationId: crypto.randomUUID(),
      event,
      source,
      path,
      plan,
      mode,
      createdAt: new Date().toISOString(),
    }, props);

    return new Response(JSON.stringify({
      ok: true,
      stored: true,
      amplitudeQueued: Boolean(amplitude.sent),
      amplitudeConfigured: amplitudeEnabled(env),
    }), { status: 200, headers });
  } catch (error) {
    console.error('SplashLens app event capture error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Database error' }), { status: 500, headers });
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request }) {
  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
    status: 405,
    headers: corsHeaders(request),
  });
}
