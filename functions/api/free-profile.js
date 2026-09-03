const DEFAULT_ORIGIN = 'https://app.splashlens.com';

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'http://localhost:8788',
  'http://localhost:8787',
  'http://localhost:5173',
  'http://127.0.0.1:8788',
  'http://127.0.0.1:8787',
  'http://127.0.0.1:5173',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function normalizeEmail(value) {
  const email = clean(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

async function ensureFreeProfilesTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS free_profiles (
      email TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      role TEXT,
      source_feature TEXT,
      first_client_id TEXT,
      last_client_id TEXT,
      first_path TEXT,
      last_path TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
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
    return json({ ok: false, error: 'Invalid JSON' }, 400, headers);
  }

  const props = plainObject(body.props);
  const email = normalizeEmail(body.email || props.email || body.known_email || props.known_email);
  if (!email) return json({ ok: false, error: 'Valid email required for free scanner profile.' }, 400, headers);

  const name = clean(body.name || props.name || body.known_name || props.known_name, 140);
  const company = clean(body.company || props.company || body.known_company || props.known_company, 160);
  const role = clean(body.role || props.role || body.known_role || props.known_role || 'tech', 80);
  const sourceFeature = clean(body.feature || props.feature || body.sourceFeature || props.sourceFeature || 'scanner_gate', 100);
  const clientId = clean(body.clientId || body.client_id || props.clientId || props.client_id, 120);
  const path = clean(body.path || props.path, 300);
  const referrer = clean(request.headers.get('Referer') || body.referrer || props.referrer, 500);
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const country = clean(request.cf && request.cf.country, 10);

  if (!env.SUBSCRIBERS_DB) {
    return json({ ok: true, stored: false, warning: 'Profile accepted without DB binding.' }, 202, headers);
  }

  try {
    await ensureFreeProfilesTable(env.SUBSCRIBERS_DB);
    await ensureEventsTable(env.SUBSCRIBERS_DB);
    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO free_profiles (
        email, name, company, role, source_feature, first_client_id, last_client_id, first_path, last_path, user_agent, referrer, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = CASE WHEN excluded.name != '' THEN excluded.name ELSE free_profiles.name END,
        company = CASE WHEN excluded.company != '' THEN excluded.company ELSE free_profiles.company END,
        role = CASE WHEN excluded.role != '' THEN excluded.role ELSE free_profiles.role END,
        source_feature = excluded.source_feature,
        last_client_id = excluded.last_client_id,
        last_path = excluded.last_path,
        user_agent = excluded.user_agent,
        referrer = excluded.referrer,
        country = excluded.country,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(email, name, company, role, sourceFeature, clientId, clientId, path, path, userAgent, referrer, country).run();

    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      'free_scan_profile_captured',
      'app',
      path,
      '',
      sourceFeature,
      JSON.stringify({
        known_email: email,
        known_name: name,
        known_company: company,
        known_role: role,
        client_id: clientId,
        identity_source: 'free_scan_profile',
        identity_confidence: 'provided-email',
      }).slice(0, 2400),
      userAgent,
      referrer,
      country,
    ).run();

    return json({ ok: true, stored: true, email }, 200, headers);
  } catch (error) {
    console.error('SplashLens free profile capture error:', error);
    return json({ ok: false, error: 'Database error' }, 500, headers);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request }) {
  return json({ ok: false, error: 'Method not allowed' }, 405, corsHeaders(request));
}
