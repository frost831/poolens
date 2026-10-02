const TOKEN_PREFIX = 'sl_scan_v1';
const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1';
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

function accountSecret(env) {
  const secret = String(env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function accountTokenFromRequest(request) {
  const headerToken = request.headers.get('x-splashlens-account-token')?.trim();
  if (headerToken) return headerToken;
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  return bearer.startsWith(`${ACCOUNT_TOKEN_PREFIX}.`) ? bearer : '';
}

function base64UrlDecode(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

async function verifyAccountToken(request, env) {
  const token = accountTokenFromRequest(request);
  if (!token) return { ok: false, status: 401, error: 'Verify your SplashLens email before restoring paid access.' };
  const secret = accountSecret(env);
  if (!secret) return { ok: false, status: 503, error: 'Account verification is not configured.' };
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== ACCOUNT_TOKEN_PREFIX) {
    return { ok: false, status: 401, error: 'SplashLens account verification is invalid.' };
  }
  const expected = await hmacSha256(secret, `${parts[0]}.${parts[1]}`);
  if (!constantTimeEqual(parts[2], expected)) {
    return { ok: false, status: 401, error: 'SplashLens account verification is invalid.' };
  }
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return { ok: false, status: 401, error: 'SplashLens account verification is invalid.' };
  }
  const email = cleanEmail(payload?.sub);
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes : [];
  if (!email || Number(payload?.exp || 0) <= Math.floor(Date.now() / 1000) || !scopes.includes('account')) {
    return { ok: false, status: 401, error: 'SplashLens account verification has expired.' };
  }
  return { ok: true, email };
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
  if (env.SUBSCRIBERS_DB && typeof env.SUBSCRIBERS_DB.prepare === 'function') {
    const row = await env.SUBSCRIBERS_DB.prepare(
      `SELECT email, plan, source, stripe_session_id AS stripeSessionId, stripe_customer_id AS stripeCustomerId, current_period_end AS expiresAt
       FROM commercial_entitlements
       WHERE lower(email) = lower(?) AND status IN ('active','trialing','pilot')
       ORDER BY updated_at DESC
       LIMIT 1`,
    ).bind(email).first();
    if (row && row.email) {
      return {
        subject: email,
        plan: row.plan || 'Splash Lens Pro Unlimited',
        scopes: ['scan'],
        source: row.source || 'commercial_entitlements',
        stripeSessionId: row.stripeSessionId || '',
        stripeCustomerId: row.stripeCustomerId || '',
        expiresAt: row.expiresAt || '',
      };
    }
    return null;
  }
  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.get === 'function') {
    const revoked = await env.SCAN_USAGE_KV.get(`entitlement_revoked:${email}`);
    if (revoked) return null;
    const value = await env.SCAN_USAGE_KV.get(`entitlement:${email}`);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
    }
  }
  return null;
}

async function createTokenFromRecord(email, record, env) {
  const secret = tokenSecret(env);
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const token = await signToken(secret, {
    sub: email,
    plan: String(record.plan || 'Splash Lens Pro Unlimited').slice(0, 100),
    scopes: Array.isArray(record.scopes) && record.scopes.length ? record.scopes : ['scan'],
    source: 'restore_entitlement',
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  });
  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${email}`, JSON.stringify({
      subject: email,
      plan: String(record.plan || 'Splash Lens Pro Unlimited').slice(0, 100),
      scopes: Array.isArray(record.scopes) && record.scopes.length ? record.scopes : ['scan'],
      source: 'restore_entitlement',
      stripeSessionId: record.stripeSessionId || '',
      stripeCustomerId: record.stripeCustomerId || '',
      issuedAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date((now + 365 * 24 * 60 * 60) * 1000).toISOString(),
    }), { expirationTtl: 365 * 24 * 60 * 60 });
    await env.SCAN_USAGE_KV.delete(`entitlement_revoked:${email}`);
  }
  return token;
}

export async function onRequestPost({ request, env }) {
  const auth = await verifyAccountToken(request, env);
  if (!auth.ok) return json(request, { ok: false, error: auth.error }, auth.status);
  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { ok: false, error: 'Valid JSON is required.' }, 400);
  }

  const email = cleanEmail(body.email);
  if (!email) return json(request, { ok: false, error: 'A valid checkout email is required.' }, 400);
  if (email !== auth.email) {
    return json(request, { ok: false, error: 'The checkout email must match the verified SplashLens account.' }, 403);
  }

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
    message: 'Splash Lens Pro Unlimited is restored on this device.',
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
