// GET /api/account - protected user account snapshot for SplashLens.
// Env: SUBSCRIBERS_DB, SCAN_USAGE_KV, SPLASHLENS_PROFILE_SECRET or SPLASHLENS_ENTITLEMENT_SECRET.

const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1';
const FREE_SCAN_LIMIT = 3;
const textEncoder = new TextEncoder();

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-SplashLens-Account-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function profileSecret(env) {
  const secret = String(env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function accountTokenFromRequest(request) {
  const headerToken = request.headers.get('x-splashlens-account-token')?.trim();
  if (headerToken) return headerToken;

  const auth = request.headers.get('authorization')?.trim() || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  return bearer.startsWith(`${ACCOUNT_TOKEN_PREFIX}.`) ? bearer : '';
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

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function scopeAllowed(scopes, requested) {
  if (!scopes) return false;
  if (scopes === 'all' || scopes === requested) return true;
  return Array.isArray(scopes) && (scopes.includes('all') || scopes.includes(requested));
}

async function verifyAccountToken(request, env) {
  const token = accountTokenFromRequest(request);
  if (!token) return { ok: false, status: 401, error: 'Sign in with your SplashLens email to view this account.' };

  const secret = profileSecret(env);
  if (!secret) return { ok: false, status: 503, error: 'Account verification is not configured.' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== ACCOUNT_TOKEN_PREFIX) {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  const signed = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(secret, signed);
  if (!constantTimeEqual(parts[2], expected)) {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 401, error: 'SplashLens account sign-in expired. Verify your email again.' };
  }
  if (!scopeAllowed(payload.scopes, 'account')) {
    return { ok: false, status: 403, error: 'SplashLens account token does not include account access.' };
  }

  return { ok: true, email: payload.sub.toLowerCase(), scopes: payload.scopes, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

async function ensureUserAccountsTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS user_accounts (
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
      verified_at DATETIME,
      account_token_last_issued_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
}

async function safeFirst(db, sql, ...bindings) {
  try {
    const row = await db.prepare(sql).bind(...bindings).first();
    return row || {};
  } catch {
    return {};
  }
}

async function safeAll(db, sql, ...bindings) {
  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    return result.results || [];
  } catch {
    return [];
  }
}

async function freeScanUsage(env, email) {
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.get !== 'function') {
    return { count: 0, limit: FREE_SCAN_LIMIT, source: 'unavailable' };
  }
  const count = Number(await env.SCAN_USAGE_KV.get(`scan:${monthKey()}:free_profile:${email}`)) || 0;
  return { count, limit: FREE_SCAN_LIMIT, source: 'free_metered' };
}

export async function onRequestGet({ request, env }) {
  const headers = corsHeaders(request);
  const auth = await verifyAccountToken(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status || 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Account database is not configured.' }, 503, headers);

  const db = env.SUBSCRIBERS_DB;
  await ensureUserAccountsTable(db);
  const account = await safeFirst(db, `
    SELECT email, name, company, role, source_feature, verified_at, account_token_last_issued_at, created_at, updated_at
    FROM user_accounts
    WHERE email = ?
  `, auth.email);
  const profile = account.email ? account : await safeFirst(db, `
    SELECT email, name, company, role, source_feature, verified_at, profile_token_last_issued_at AS account_token_last_issued_at, created_at, updated_at
    FROM free_profiles
    WHERE email = ?
  `, auth.email);
  const events = await safeAll(db, `
    SELECT event, mode, path, created_at
    FROM events
    WHERE props LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `, `%${auth.email.replace(/[%_]/g, '')}%`);
  const usage = await freeScanUsage(env, auth.email);

  return json({
    ok: true,
    email: auth.email,
    account: {
      email: profile.email || auth.email,
      name: clean(profile.name, 140),
      company: clean(profile.company, 160),
      role: clean(profile.role || 'tech', 80),
      verifiedAt: profile.verified_at || '',
      createdAt: profile.created_at || '',
      updatedAt: profile.updated_at || '',
      tokenExpiresAt: auth.expiresAt,
    },
    scanner: usage,
    recentEvents: events.map((row) => ({
      event: clean(row.event, 120),
      mode: clean(row.mode, 80),
      path: clean(row.path, 300),
      createdAt: row.created_at || '',
    })),
  }, 200, headers);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
