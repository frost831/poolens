import zip3Points from '../_shared/freeze-zip3.json' with { type: 'json' };

const ORIGINS = new Set(['https://app.splashlens.com', 'http://localhost:8788', 'http://localhost:8787', 'http://localhost:5173', 'http://127.0.0.1:8788', 'http://127.0.0.1:8787', 'http://127.0.0.1:5173']);
const EVENTS = new Set(['Freeze Warning', 'Hard Freeze Warning', 'Freeze Watch']);
const CACHE_SECONDS = 300;
const encoder = new TextEncoder();

function reply(request, status, data) {
  const origin = request.headers.get('Origin') || '';
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    'Access-Control-Allow-Origin': ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Freeze-Subscription',
  } });
}

function authorized(request, write = false) {
  const origin = request.headers.get('Origin') || '';
  const site = request.headers.get('Sec-Fetch-Site') || '';
  return (!write || ORIGINS.has(origin)) && (!origin || ORIGINS.has(origin)) && (!site || site === 'same-origin');
}

async function subscriberHash(request) {
  const token = request.headers.get('X-Freeze-Subscription') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(token)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return null;
  if (Number(request.headers.get('Content-Length') || 0) > 128) return null;
  const raw = await request.text();
  if (encoder.encode(raw).length > 128) return null;
  const body = JSON.parse(raw);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).join() !== 'zip') return null;
  return body;
}

function cleanAlert(feature, now) {
  const props = feature?.properties;
  const event = props?.event;
  const url = feature?.id;
  if (!EVENTS.has(event) || props?.status !== 'Actual' || typeof url !== 'string') return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.weather.gov' || !parsed.pathname.startsWith('/alerts/')) return null;
  const expires = Date.parse(props.ends || props.expires || '');
  if (!Number.isFinite(expires) || expires <= now) return null;
  return { event, url: parsed.href, expires: new Date(expires).toISOString() };
}

async function activeAlerts(env, zip3) {
  const key = `freeze-alerts:v1:${zip3}`;
  const cached = await env.SCAN_USAGE_KV.get(key);
  let alerts;
  if (cached) {
    alerts = JSON.parse(cached);
    if (!Array.isArray(alerts)) throw new Error('Invalid alert cache.');
  } else {
    const [lat, lon] = zip3Points[zip3];
    const response = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
      headers: { 'User-Agent': '(SplashLens freeze alerts, hello@splashlens.com)', 'Accept': 'application/geo+json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error('NWS unavailable.');
    const payload = await response.json();
    if (!Array.isArray(payload?.features)) throw new Error('Invalid NWS response.');
    alerts = payload.features.map(feature => cleanAlert(feature, Date.now())).filter(Boolean);
    await env.SCAN_USAGE_KV.put(key, JSON.stringify(alerts), { expirationTtl: CACHE_SECONDS });
  }
  return alerts.map(alert => cleanAlert({ id: alert.url, properties: { event: alert.event, status: 'Actual', expires: alert.expires } }, Date.now())).filter(Boolean);
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request)) return reply(request, 403, { ok: false, error: 'Forbidden.' });
  const hash = await subscriberHash(request);
  if (!hash) return reply(request, 400, { ok: false, error: 'Invalid subscription.' });
  if (!env.SUBSCRIBERS_DB || !env.SCAN_USAGE_KV) return reply(request, 503, { ok: false, error: 'Freeze alerts unavailable.' });
  try {
    const row = await env.SUBSCRIBERS_DB.prepare('SELECT zip3 FROM freeze_alert_optins WHERE subscriber_hash = ?').bind(hash).first();
    if (!row) return reply(request, 200, { ok: true, optedIn: false });
    if (!Object.hasOwn(zip3Points, row.zip3)) throw new Error('Unsupported ZIP3.');
    const alerts = await activeAlerts(env, row.zip3);
    return reply(request, 200, { ok: true, optedIn: true, zip3: row.zip3, alerts });
  } catch {
    return reply(request, 503, { ok: false, error: 'NWS alerts are unavailable. Check weather.gov directly.' });
  }
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, true)) return reply(request, 403, { ok: false, error: 'Forbidden.' });
  const hash = await subscriberHash(request);
  if (!hash) return reply(request, 400, { ok: false, error: 'Invalid subscription.' });
  let body;
  try { body = await readBody(request); } catch { body = null; }
  if (!body || typeof body.zip !== 'string' || !/^\d{3}(?:\d{2})?$/.test(body.zip)) return reply(request, 400, { ok: false, error: 'Enter a 3- or 5-digit US ZIP.' });
  const zip3 = body.zip.slice(0, 3);
  if (!Object.hasOwn(zip3Points, zip3)) return reply(request, 400, { ok: false, error: 'This ZIP prefix is not supported.' });
  if (!env.SUBSCRIBERS_DB || !env.SCAN_USAGE_KV) return reply(request, 503, { ok: false, error: 'Freeze alerts unavailable.' });
  try {
    await env.SUBSCRIBERS_DB.prepare(`INSERT INTO freeze_alert_optins (subscriber_hash, zip3) VALUES (?, ?)
      ON CONFLICT(subscriber_hash) DO UPDATE SET zip3 = excluded.zip3, updated_at = CURRENT_TIMESTAMP`).bind(hash, zip3).run();
    return reply(request, 200, { ok: true, optedIn: true, zip3 });
  } catch {
    return reply(request, 503, { ok: false, error: 'Freeze alerts unavailable.' });
  }
}

export async function onRequestDelete({ request, env }) {
  if (!authorized(request, true)) return reply(request, 403, { ok: false, error: 'Forbidden.' });
  const hash = await subscriberHash(request);
  if (!hash) return reply(request, 400, { ok: false, error: 'Invalid subscription.' });
  if (!env.SUBSCRIBERS_DB) return reply(request, 503, { ok: false, error: 'Freeze alerts unavailable.' });
  try {
    await env.SUBSCRIBERS_DB.prepare('DELETE FROM freeze_alert_optins WHERE subscriber_hash = ?').bind(hash).run();
    return reply(request, 200, { ok: true, optedIn: false });
  } catch {
    return reply(request, 503, { ok: false, error: 'Freeze alerts unavailable.' });
  }
}

export async function onRequestOptions({ request }) {
  if (!authorized(request, true)) return reply(request, 403, { ok: false, error: 'Forbidden.' });
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': request.headers.get('Origin'),
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Freeze-Subscription', 'Vary': 'Origin',
  } });
}
