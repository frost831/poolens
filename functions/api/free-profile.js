const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const PROFILE_TOKEN_PREFIX = 'sl_profile_v1';
const VERIFICATION_TTL_SECONDS = 10 * 60;
const PROFILE_TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60;
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SplashLens-Profile-Token',
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

function profileSecret(env) {
  const secret = String(env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function parseSender(value) {
  const raw = clean(value || 'hello@splashlens.com', 220);
  const match = raw.match(/^(.*?)<([^>]+)>$/);
  const email = normalizeEmail(match ? match[2] : raw) || 'hello@splashlens.com';
  const name = clean(match ? match[1] : 'SplashLens', 80).replace(/^"|"$/g, '') || 'SplashLens';
  return { email, name };
}

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String((bytes[0] % 900000) + 100000);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
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

async function signProfileToken(secret, email) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: email,
    scopes: ['free_scan'],
    source: 'free_profile_email_verification',
    iat: now,
    exp: now + PROFILE_TOKEN_TTL_SECONDS,
  };
  const payloadPart = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const signed = `${PROFILE_TOKEN_PREFIX}.${payloadPart}`;
  const signature = await hmacSha256(secret, signed);
  return { token: `${signed}.${signature}`, expiresAt: new Date(payload.exp * 1000).toISOString() };
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
      verified_at DATETIME,
      profile_token_last_issued_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare('ALTER TABLE free_profiles ADD COLUMN verified_at DATETIME').run().catch(() => {});
  await db.prepare('ALTER TABLE free_profiles ADD COLUMN profile_token_last_issued_at DATETIME').run().catch(() => {});
}

async function ensureProfileVerificationTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS free_profile_verifications (
      email TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      name TEXT,
      company TEXT,
      role TEXT,
      source_feature TEXT,
      client_id TEXT,
      path TEXT,
      attempts INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
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

async function logProfileEvent(db, request, event, path, props = {}) {
  await ensureEventsTable(db);
  await db.prepare(
    `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    event,
    'app',
    clean(path, 300),
    '',
    clean(props.source_feature || props.feature || 'free_profile', 100),
    JSON.stringify(props).slice(0, 2400),
    clean(request.headers.get('User-Agent'), 300),
    clean(request.headers.get('Referer'), 500),
    clean(request.cf && request.cf.country, 10),
  ).run();
}

async function sendVerificationEmail(env, email, code) {
  const apiKey = String(env.SENDGRID_API_KEY || '').trim();
  if (!apiKey) return { sent: false, error: 'SENDGRID_API_KEY is not configured.' };

  const from = parseSender(env.SENDGRID_FROM || env.SPLASHLENS_EMAIL_FROM || 'hello@splashlens.com');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from,
      subject: 'Your SplashLens free scanner code',
      content: [{
        type: 'text/plain',
        value: [
          'Your SplashLens free scanner code is:',
          '',
          code,
          '',
          'It expires in 10 minutes.',
          '',
          'Manual lookup, calculators, guides, and checklists stay free to start. This code verifies the email used for free AI scans so scan limits and field misses are tied to a real contact.',
          '',
          'Talk Soon,',
          'SplashLens',
        ].join('\n'),
      }],
    }),
  });

  if (!response.ok) return { sent: false, error: `SendGrid returned ${response.status}` };
  return { sent: true };
}

async function requestCode({ request, env, headers, body, email, props }) {
  const secret = profileSecret(env);
  if (!secret) return json({ ok: false, error: 'Profile verification signing secret is not configured.' }, 503, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Profile database is not configured.' }, 503, headers);

  const name = clean(body.name || props.name || body.known_name || props.known_name, 140);
  const company = clean(body.company || props.company || body.known_company || props.known_company, 160);
  const role = clean(body.role || props.role || body.known_role || props.known_role || 'tech', 80);
  const sourceFeature = clean(body.feature || props.feature || body.sourceFeature || props.sourceFeature || 'scanner_gate', 100);
  const clientId = clean(body.clientId || body.client_id || props.clientId || props.client_id, 120);
  const path = clean(body.path || props.path, 300);
  const code = generateCode();
  const codeHash = await sha256Hex(`${email}.${code}.${secret}`);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_SECONDS * 1000).toISOString();

  await ensureFreeProfilesTable(env.SUBSCRIBERS_DB);
  await ensureProfileVerificationTable(env.SUBSCRIBERS_DB);
  await env.SUBSCRIBERS_DB.prepare(
    `INSERT INTO free_profile_verifications (email, code_hash, name, company, role, source_feature, client_id, path, attempts, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(email) DO UPDATE SET
       code_hash = excluded.code_hash,
       name = excluded.name,
       company = excluded.company,
       role = excluded.role,
       source_feature = excluded.source_feature,
       client_id = excluded.client_id,
       path = excluded.path,
       attempts = 0,
       expires_at = excluded.expires_at,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(email, codeHash, name, company, role, sourceFeature, clientId, path, expiresAt).run();

  const sent = await sendVerificationEmail(env, email, code);
  await logProfileEvent(env.SUBSCRIBERS_DB, request, sent.sent ? 'free_scan_profile_code_sent' : 'free_scan_profile_code_failed', path, {
    known_email: email,
    known_name: name,
    known_company: company,
    known_role: role,
    client_id: clientId,
    source_feature: sourceFeature,
    email_sent: sent.sent,
    send_error: sent.sent ? '' : sent.error,
    identity_source: 'free_scan_profile',
    identity_confidence: 'pending-email-verification',
  });

  if (!sent.sent) return json({ ok: false, error: sent.error || 'Verification email could not be sent.' }, 502, headers);
  return json({ ok: true, verificationRequired: true, emailSent: true, email, expiresInSeconds: VERIFICATION_TTL_SECONDS }, 200, headers);
}

async function verifyCode({ request, env, headers, body, email, props }) {
  const secret = profileSecret(env);
  if (!secret) return json({ ok: false, error: 'Profile verification signing secret is not configured.' }, 503, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Profile database is not configured.' }, 503, headers);

  const code = clean(body.code || body.verificationCode || props.code || props.verificationCode, 16).replace(/\D/g, '');
  if (!/^\d{6}$/.test(code)) return json({ ok: false, error: 'Enter the 6-digit SplashLens verification code.' }, 400, headers);

  await ensureFreeProfilesTable(env.SUBSCRIBERS_DB);
  await ensureProfileVerificationTable(env.SUBSCRIBERS_DB);
  const found = await env.SUBSCRIBERS_DB.prepare(
    `SELECT email, code_hash, name, company, role, source_feature, client_id, path, attempts, expires_at
     FROM free_profile_verifications WHERE email = ?`
  ).bind(email).first();

  if (!found) return json({ ok: false, error: 'Request a new SplashLens verification code.' }, 404, headers);
  if (Date.parse(found.expires_at || '') <= Date.now()) {
    return json({ ok: false, error: 'SplashLens verification code expired. Request a new code.' }, 410, headers);
  }
  if (Number(found.attempts || 0) >= 5) {
    return json({ ok: false, error: 'Too many verification attempts. Request a new code.' }, 429, headers);
  }

  const expected = await sha256Hex(`${email}.${code}.${secret}`);
  if (expected !== found.code_hash) {
    await env.SUBSCRIBERS_DB.prepare(
      `UPDATE free_profile_verifications SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?`
    ).bind(email).run();
    return json({ ok: false, error: 'Verification code did not match.' }, 401, headers);
  }

  const name = clean(body.name || props.name || found.name, 140);
  const company = clean(body.company || props.company || found.company, 160);
  const role = clean(body.role || props.role || found.role || 'tech', 80);
  const sourceFeature = clean(body.feature || props.feature || found.source_feature || 'scanner_gate', 100);
  const clientId = clean(body.clientId || body.client_id || props.clientId || props.client_id || found.client_id, 120);
  const path = clean(body.path || props.path || found.path, 300);
  const referrer = clean(request.headers.get('Referer') || body.referrer || props.referrer, 500);
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const country = clean(request.cf && request.cf.country, 10);
  const signed = await signProfileToken(secret, email);

  await env.SUBSCRIBERS_DB.prepare(
    `INSERT INTO free_profiles (
      email, name, company, role, source_feature, first_client_id, last_client_id, first_path, last_path, user_agent, referrer, country, verified_at, profile_token_last_issued_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
      verified_at = CURRENT_TIMESTAMP,
      profile_token_last_issued_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(email, name, company, role, sourceFeature, clientId, clientId, path, path, userAgent, referrer, country).run();
  await env.SUBSCRIBERS_DB.prepare('DELETE FROM free_profile_verifications WHERE email = ?').bind(email).run();
  await logProfileEvent(env.SUBSCRIBERS_DB, request, 'free_scan_profile_verified', path, {
    known_email: email,
    known_name: name,
    known_company: company,
    known_role: role,
    client_id: clientId,
    source_feature: sourceFeature,
    identity_source: 'free_scan_profile',
    identity_confidence: 'verified-email',
  });

  return json({
    ok: true,
    stored: true,
    verified: true,
    email,
    profileToken: signed.token,
    tokenExpiresAt: signed.expiresAt,
  }, 200, headers);
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

  const action = clean(body.action || body.intent || (body.code || body.verificationCode ? 'verify_code' : 'request_code'), 40).toLowerCase();
  if (action === 'verify_code' || action === 'verify') return verifyCode({ request, env, headers, body, email, props });
  if (action === 'request_code' || action === 'request' || action === 'start') return requestCode({ request, env, headers, body, email, props });

  return json({ ok: false, error: 'Unknown free profile action.' }, 400, headers);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request }) {
  return json({ ok: false, error: 'Method not allowed' }, 405, corsHeaders(request));
}
