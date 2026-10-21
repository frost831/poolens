// Stores opt-in follow-up requests. This endpoint never sends mail or creates checkout.
const ORIGINS = new Set(['https://app.splashlens.com', 'http://localhost:8788', 'http://localhost:8787', 'http://localhost:5173', 'http://127.0.0.1:8788', 'http://127.0.0.1:8787', 'http://127.0.0.1:5173']);
const STORES = new Set(['ios', 'android', 'native', 'web']);
const encoder = new TextEncoder();

function reply(request, status, body) {
  const origin = request.headers.get('Origin') || '';
  return Response.json(body, { status, headers: {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  } });
}

function equipmentText(value, max) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid part details.');
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || !/^[\p{L}\p{N}][\p{L}\p{N} #._/+-]*$/u.test(text) ||
      /@|\b(?:https?|www|street|avenue|road|drive|lane|boulevard|suite)\b|(?:\d[\s().-]*){7,}/i.test(text)) {
    throw new Error('Invalid part details.');
  }
  return text;
}

async function clientHash(ip, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(ip)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const fetchSite = request.headers.get('Sec-Fetch-Site') || '';
  if (!ORIGINS.has(origin) || (fetchSite && fetchSite !== 'same-origin')) return reply(request, 403, { ok: false, error: 'Forbidden.' });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return reply(request, 415, { ok: false, error: 'JSON is required.' });
  const secret = String(env.SPLASHLENS_STATS_SECRET || env.SPLASHLENS_ADMIN_SECRET || '').trim();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!env.SUBSCRIBERS_DB || !secret || !ip) return reply(request, 503, { ok: false, error: 'Follow-up storage is unavailable.' });
  if (Number(request.headers.get('Content-Length') || 0) > 1024) return reply(request, 413, { ok: false, error: 'Request is too large.' });

  let body;
  try {
    const raw = await request.text();
    if (encoder.encode(raw).length > 1024) return reply(request, 413, { ok: false, error: 'Request is too large.' });
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
  } catch {
    return reply(request, 400, { ok: false, error: 'Valid JSON object is required.' });
  }
  if (Object.keys(body).some(key => !['kind', 'email', 'store', 'brand', 'model', 'query'].includes(key))) {
    return reply(request, 400, { ok: false, error: 'Unexpected follow-up details.' });
  }
  const kind = body.kind;
  const store = body.store;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!['pro_link', 'partsnap_miss'].includes(kind) || !STORES.has(store) ||
      (kind === 'pro_link' && store === 'web') || email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(request, 400, { ok: false, error: 'Invalid follow-up request.' });
  }
  let brand = ''; let model = ''; let query = '';
  try {
    brand = equipmentText(body.brand, 60);
    model = equipmentText(body.model, 80);
    query = equipmentText(body.query, 120);
  } catch {
    return reply(request, 400, { ok: false, error: 'Invalid part details.' });
  }
  if (kind === 'partsnap_miss' && !brand && !model && !query) return reply(request, 400, { ok: false, error: 'Part details are required.' });
  if (kind === 'pro_link' && (brand || model || query)) return reply(request, 400, { ok: false, error: 'Part details are not allowed.' });

  const hash = await clientHash(ip, secret);
  try {
    await env.SUBSCRIBERS_DB.prepare(`CREATE TABLE IF NOT EXISTS field_followup_requests (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, email TEXT NOT NULL, store TEXT NOT NULL,
      brand TEXT, model TEXT, query TEXT, client_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const result = await env.SUBSCRIBERS_DB.prepare(`INSERT INTO field_followup_requests
      (id, kind, email, store, brand, model, query, client_hash)
      SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE
      (SELECT COUNT(*) FROM field_followup_requests WHERE client_hash = ? AND created_at >= datetime('now', '-1 hour')) < 5
      AND NOT EXISTS (SELECT 1 FROM field_followup_requests WHERE kind = ? AND email = ? AND query = ? AND created_at >= datetime('now', '-1 hour'))`
    ).bind(`followup_${crypto.randomUUID()}`, kind, email, store, brand, model, query, hash, hash, kind, email, query).run();
    if (!result.meta?.changes) return reply(request, 429, { ok: false, error: 'A recent request is already saved or the rate limit was reached.' });
    return reply(request, 201, { ok: true });
  } catch {
    return reply(request, 503, { ok: false, error: 'Follow-up storage is unavailable.' });
  }
}

export function onRequestOptions({ request }) {
  if (!ORIGINS.has(request.headers.get('Origin') || '')) return reply(request, 403, { ok: false, error: 'Forbidden.' });
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': request.headers.get('Origin'),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store', 'Vary': 'Origin',
  } });
}
