const TOKEN_PREFIX = 'sl_scan_v1';
const DEFAULT_TTL_DAYS = 365;
const MAX_TTL_DAYS = 730;
const textEncoder = new TextEncoder();

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'https://poolens.pages.dev',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SplashLens-Admin-Secret',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function cleanSubject(value) {
  const subject = String(value || '').trim().toLowerCase();
  if (!subject || subject.length > 160) return '';
  if (!/^[a-z0-9._%+\-:@]+$/.test(subject)) return '';
  return subject;
}

function cleanPlan(value) {
  return String(value || 'SplashLens Scanner Pro').trim().slice(0, 80) || 'SplashLens Scanner Pro';
}

function adminSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_ADMIN_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function tokenSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function hasAdminAccess(request, env) {
  const secret = adminSecret(env);
  if (!secret) return { ok: false, status: 503, error: 'Entitlement admin secret is not configured.' };
  const supplied = request.headers.get('x-splashlens-admin-secret') || '';
  return constantTimeEqual(secret, supplied)
    ? { ok: true }
    : { ok: false, status: 403, error: 'Entitlement admin access denied.' };
}

export async function onRequestPost({ request, env }) {
  const access = hasAdminAccess(request, env);
  if (!access.ok) return json(request, { ok: false, error: access.error }, access.status);

  const secret = tokenSecret(env);
  if (!secret) {
    return json(request, { ok: false, error: 'Scan entitlement signing secret is not configured.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { ok: false, error: 'Valid JSON is required.' }, 400);
  }

  const subject = cleanSubject(body.subject || body.email || body.customerId || body.deviceId);
  if (!subject) return json(request, { ok: false, error: 'A valid subject, email, customerId, or deviceId is required.' }, 400);

  const ttlDays = Math.max(1, Math.min(Number(body.ttlDays || DEFAULT_TTL_DAYS), MAX_TTL_DAYS));
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    plan: cleanPlan(body.plan),
    scopes: ['scan'],
    source: 'admin_grant',
    iat: now,
    exp: now + Math.floor(ttlDays * 24 * 60 * 60),
  };

  const token = await signToken(secret, payload);
  const record = {
    subject,
    plan: payload.plan,
    scopes: payload.scopes,
    source: payload.source,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify(record), {
      expirationTtl: Math.floor(ttlDays * 24 * 60 * 60),
    });
  }

  const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`;
  return json(request, { ok: true, token, activateUrl, entitlement: record });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function signToken(secret, payload) {
  const payloadPart = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const signed = `${TOKEN_PREFIX}.${payloadPart}`;
  const signature = await hmacSha256(secret, signed);
  return `${signed}.${signature}`;
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}
