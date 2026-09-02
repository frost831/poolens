const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'https://poolens.pages.dev',
]);

function headers(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(request) });
}

function cleanEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return '';
  return email;
}

function tokenSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
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

async function storedEntitlement(email, env) {
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.get !== 'function') return null;
  const value = await env.SCAN_USAGE_KV.get(`entitlement:${email}`);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  return null;
}

async function createTokenFromRecord(email, record, env) {
  const secret = tokenSecret(env);
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  return signToken(secret, {
    sub: email,
    plan: String(record.plan || 'Splash Lens Pro Unlimited').slice(0, 100),
    scopes: Array.isArray(record.scopes) && record.scopes.length ? record.scopes : ['scan'],
    source: 'restore_entitlement',
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { ok: false, error: 'Valid JSON is required.' }, 400);
  }

  const email = cleanEmail(body.email);
  if (!email) return json(request, { ok: false, error: 'A valid checkout email is required.' }, 400);

  const record = await storedEntitlement(email, env);
  if (!record) {
    return json(request, {
      ok: false,
      error: 'No paid SplashLens entitlement was found for that email yet.',
    }, 404);
  }

  const token = await createTokenFromRecord(email, record, env);
  if (!token) return json(request, { ok: false, error: 'Entitlement signing is not configured.' }, 503);

  return json(request, {
    ok: true,
    token,
    activateUrl: `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`,
    entitlement: {
      subject: email,
      plan: String(record.plan || 'Splash Lens Pro Unlimited').slice(0, 100),
      scopes: Array.isArray(record.scopes) ? record.scopes : ['scan'],
    },
  });
}

export async function onRequestGet({ request }) {
  return json(request, {
    ok: false,
    endpoint: 'restore-entitlement',
    methods: ['POST', 'OPTIONS'],
    error: 'Use POST with the checkout email to restore a paid SplashLens entitlement.',
  }, 405);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: headers(request) });
}
