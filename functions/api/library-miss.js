import { classifyTraffic } from '../_shared/traffic-class.mjs';

const ORIGINS = new Set(['https://app.splashlens.com', 'http://localhost:8788', 'http://localhost:8787', 'http://localhost:5173', 'http://127.0.0.1:8788', 'http://127.0.0.1:8787', 'http://127.0.0.1:5173']);
const TRIGGERS = new Set(['code_no_hit', 'partsnap_low', 'partsnap_no_match', 'manual_fallback']);
const MAX_BYTES = 1024;
const HOURLY_LIMIT = 20;
const encoder = new TextEncoder();

function response(request, status, data) {
  const origin = request.headers.get('Origin') || '';
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin',
  } });
}

function equipmentText(value, max) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid equipment text.');
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || !/^[\p{L}\p{N}][\p{L}\p{N} #._/+-]*$/u.test(text)) throw new Error('Invalid equipment text.');
  // Reject contact details, addresses and links before they can enter storage.
  if (/@|\b(?:https?|www|street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|apt|suite)\b|(?:\d[\s().-]*){7,}/i.test(text)) {
    throw new Error('Contact or location details are not allowed.');
  }
  return text;
}

async function clientHash(ip, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(ip)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const fetchSite = request.headers.get('Sec-Fetch-Site') || '';
  if (!ORIGINS.has(origin) || (fetchSite && fetchSite !== 'same-origin')) return response(request, 403, { ok: false, error: 'Forbidden.' });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return response(request, 415, { ok: false, error: 'JSON is required.' });
  const secret = String(env.SPLASHLENS_STATS_SECRET || env.SPLASHLENS_ADMIN_SECRET || '').trim();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!env.SUBSCRIBERS_DB || !secret || !ip) return response(request, 503, { ok: false, error: 'Library miss storage is unavailable.' });
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) return response(request, 413, { ok: false, error: 'Request is too large.' });

  let body;
  try {
    const raw = await request.text();
    if (encoder.encode(raw).length > MAX_BYTES) return response(request, 413, { ok: false, error: 'Request is too large.' });
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body.');
  } catch {
    return response(request, 400, { ok: false, error: 'Valid JSON object is required.' });
  }
  if (body.photo_ref != null || body.photoRef != null || body.photo != null || body.image != null) {
    return response(request, 400, { ok: false, error: 'Photo references are not supported by this endpoint.' });
  }
  if (!TRIGGERS.has(body.trigger)) return response(request, 400, { ok: false, error: 'Invalid trigger.' });
  let brand; let model; let query;
  try {
    brand = equipmentText(body.brand, 60);
    model = equipmentText(body.model, 80);
    query = equipmentText(body.query, 120);
  } catch (error) {
    return response(request, 400, { ok: false, error: error.message });
  }
  if (!brand && !model && !query) return response(request, 400, { ok: false, error: 'Equipment text is required.' });
  if (body.trigger === 'code_no_hit' && !query) return response(request, 400, { ok: false, error: 'Query is required.' });

  const hash = await clientHash(ip, secret);
  const trafficClass = classifyTraffic({ source: body.source, utmSource: body.utm_source, userAgent: request.headers.get('User-Agent'), webdriver: body.webdriver === true });
  try {
    const result = await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO library_misses (id, "trigger", brand, model, query, photo_ref, client_hash, traffic_class)
       SELECT ?, ?, ?, ?, ?, NULL, ?, ?
       WHERE (SELECT COUNT(*) FROM library_misses WHERE client_hash = ? AND created_at >= datetime('now', '-1 hour')) < ?`,
    ).bind(`miss_${crypto.randomUUID()}`, body.trigger, brand, model, query, hash, trafficClass, hash, HOURLY_LIMIT).run();
    if (!result.meta?.changes) return response(request, 429, { ok: false, error: 'Library miss rate limit reached.' });
    return response(request, 201, { ok: true });
  } catch {
    return response(request, 503, { ok: false, error: 'Library miss storage is unavailable.' });
  }
}

export async function onRequestOptions({ request }) {
  if (!ORIGINS.has(request.headers.get('Origin') || '')) return response(request, 403, { ok: false, error: 'Forbidden.' });
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': request.headers.get('Origin'), 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store', 'Vary': 'Origin',
  } });
}
