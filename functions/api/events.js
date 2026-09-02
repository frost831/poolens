import { amplitudeEnabled, forwardEventToAmplitude } from '../_shared/amplitude.mjs';

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

function normalizeIdentityProps(props, source) {
  const knownEmail = clean(props.known_email || props.contact_email || props.email || props.e || props.sl_email, 180).toLowerCase();
  const leadId = clean(props.lead_id || props.contact_id || props.recipient_id || props.prospect_id || props.referral_id, 120);
  return {
    ...props,
    client_id: clean(props.client_id || props.clientId || props.anon_device_id, 120),
    session_id: clean(props.session_id || props.sessionId, 160),
    known_email: knownEmail,
    known_name: clean(props.known_name || props.contact_name || props.name || [props.first_name, props.last_name].filter(Boolean).join(' '), 140),
    known_company: clean(props.known_company || props.company || props.organization || props.org || props.account, 160),
    known_role: clean(props.known_role || props.role || props.audience || props.persona || props.splashlens_role, 80),
    lead_id: leadId,
    pilot_id: clean(props.pilot_id || props.pilot, 80),
    participant_id: clean(props.participant_id || props.participant, 80),
    identity_source: clean(props.identity_source || props.attribution_source || source || 'app', 80),
    identity_confidence: clean(knownEmail ? 'provided-email' : leadId ? 'tracked-link' : props.identity_confidence || '', 40),
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
  const path = clean(body.path || rawProps.path, 300);
  const plan = clean(body.plan || rawProps.plan, 80);
  const mode = clean(body.mode || rawProps.mode || rawProps.displayMode, 80);
  const source = clean(body.source || rawProps.source || 'app', 80);
  const props = normalizeIdentityProps(rawProps, source);
  const referrer = clean(request.headers.get('Referer') || body.referrer || props.referrer, 500);
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const country = clean(request.cf && request.cf.country, 10);
  const propsJson = JSON.stringify(props).slice(0, 2400);

  if (isInternalNoise({ event, source, path, userAgent, props })) {
    return new Response(JSON.stringify({ ok: true, stored: false, skipped: 'internal_heartbeat_noise' }), { status: 202, headers });
  }

  if (!env.SUBSCRIBERS_DB) {
    return new Response(JSON.stringify({ ok: true, stored: false, warning: 'Event accepted without DB binding' }), { status: 202, headers });
  }

  try {
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
