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

  const props = Object.assign({}, plainObject(body.props), plainObject(body.properties));
  const path = clean(body.path || props.path, 300);
  const plan = clean(body.plan || props.plan, 80);
  const mode = clean(body.mode || props.mode || props.displayMode, 80);
  const source = clean(body.source || props.source || 'app', 80);
  const referrer = clean(request.headers.get('Referer') || body.referrer || props.referrer, 500);
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const country = clean(request.cf && request.cf.country, 10);
  const propsJson = JSON.stringify(props).slice(0, 2400);

  if (!env.SUBSCRIBERS_DB) {
    return new Response(JSON.stringify({ ok: true, stored: false, warning: 'Event accepted without DB binding' }), { status: 202, headers });
  }

  try {
    await ensureEventsTable(env.SUBSCRIBERS_DB);
    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(event, source, path, plan, mode, propsJson, userAgent, referrer, country).run();

    return new Response(JSON.stringify({ ok: true, stored: true }), { status: 200, headers });
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
