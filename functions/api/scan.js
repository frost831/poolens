// Cloudflare Pages Function - AI Scanner backend
// POST /api/scan
// Body: { image: string (base64 image), mode: 'error_code' | 'parts_snap' | 'test_strip' }
// Required env: ANTHROPIC_API_KEY
// Optional bindings/env: SCAN_RATE_LIMITER, SCAN_USAGE_KV, SPLASHLENS_ENTITLEMENT_SECRET.
// Production scanner traffic must have SCAN_USAGE_KV so free and entitled monthly limits are server-enforced.

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const FREE_SCAN_LIMIT = 3;
const ENTITLED_SCAN_LIMIT = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BASE64_CHARS = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
const LOCAL_FALLBACK_LIMIT = 4;
const LOCAL_FALLBACK_WINDOW_MS = 60 * 60 * 1000;
const ENTITLEMENT_TOKEN_PREFIX = 'sl_scan_v1';
const PROFILE_TOKEN_PREFIX = 'sl_profile_v1';
const textEncoder = new TextEncoder();

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'https://poolens.pages.dev',
]);

const DEV_ORIGINS = new Set([
  'http://localhost:8788',
  'http://localhost:8787',
  'http://localhost:5173',
  'http://127.0.0.1:8788',
  'http://127.0.0.1:8787',
  'http://127.0.0.1:5173',
]);

const localScanWindow = new Map();

const PROMPTS = {
  error_code: `You are a pool equipment technician's assistant. Analyze this image of pool equipment and identify any error codes, fault codes, or error messages displayed.

Return ONLY valid JSON in this exact format:
{
  "codes": ["E01", "FLO"],
  "brand": "Hayward",
  "model": "H-Series",
  "context": "Heater showing pressure fault",
  "confidence": "high"
}

Rules:
- codes: array of exact code strings visible (empty array if none found)
- brand: equipment brand if identifiable, null otherwise
- model: model name/series if visible, null otherwise
- context: brief description of what you see (20 words max)
- confidence: "high" if codes are clearly visible, "medium" if partially visible, "low" if uncertain

If you cannot identify any codes or pool equipment, return: {"codes":[],"brand":null,"model":null,"context":"No error code visible","confidence":"low"}`,

  parts_snap: `You are a pool equipment parts identification specialist. Analyze this image and identify the pool equipment part or component shown.

Return ONLY valid JSON in this exact format:
{
  "manufacturer": "Hayward",
  "category": "pump",
  "component": "impeller",
  "model": "Super Pump SP2607X10",
  "partNumber": "SPX2607C",
  "description": "1 HP impeller for Super Pump",
  "condition": "worn",
  "replacementNotes": "Check for wear marks on vanes; replace annually if running 8+ hours daily",
  "searchTerms": ["hayward impeller", "SPX2607C", "super pump impeller"],
  "confidence": "high"
}

Rules:
- manufacturer: brand name or null
- category: one of pump, filter, heater, cleaner, valve, motor, seal, impeller, basket, gauge, o-ring, controller, sensor, other
- component: specific part name
- model: equipment model this belongs to (null if unknown)
- partNumber: OEM part number if visible or identifiable (null if unknown)
- description: what this part does (15 words max)
- condition: new, good, worn, damaged, unknown
- replacementNotes: when/why to replace this (20 words max, null if not applicable)
- searchTerms: 2-4 search strings that would find this part online
- confidence: high/medium/low

If image does not show pool equipment: {"manufacturer":null,"category":"other","component":"unknown","model":null,"partNumber":null,"description":"Not a pool part","condition":"unknown","replacementNotes":null,"searchTerms":[],"confidence":"low"}`,

  test_strip: `You are a pool water chemistry analyzer. The user has photographed a pool test strip. Read the color blocks and estimate the water chemistry values.

Return ONLY valid JSON in this exact format:
{
  "fc": 3.0,
  "ph": 7.4,
  "ta": 100,
  "ch": 250,
  "cya": 40,
  "notes": "pH slightly high, FC adequate",
  "confidence": "medium",
  "disclaimer": "Visual strip reading is approximate; verify with drop-test kit for critical adjustments"
}

Rules:
- fc: Free Chlorine in ppm (typical range 1-10, null if not visible)
- ph: pH value (typical range 6.8-8.2, null if not visible)
- ta: Total Alkalinity in ppm (typical range 60-180, null if not visible)
- ch: Calcium Hardness in ppm (typical range 150-400, null if not visible)
- cya: Cyanuric Acid / Stabilizer in ppm (typical range 20-100, null if not visible)
- notes: 1-2 sentence plain-english summary of water state
- confidence: low (strip reading is inherently imprecise - almost always use low or medium)
- disclaimer: always include the standard accuracy disclaimer

If image is not a test strip: {"fc":null,"ph":null,"ta":null,"ch":null,"cya":null,"notes":"No test strip visible","confidence":"low","disclaimer":"Please photograph the test strip clearly"}`
};

function isProductionRequest(request, env) {
  const host = new URL(request.url).hostname;
  const configured = String(env.ENVIRONMENT || env.NODE_ENV || '').toLowerCase();
  return configured === 'production' || host === 'app.splashlens.com' || host.endsWith('.pages.dev');
}

function isAllowedOrigin(origin, production) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return !production && (origin === '' || DEV_ORIGINS.has(origin));
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const production = isProductionRequest(request, env);
  const allowOrigin = isAllowedOrigin(origin, production) ? (origin || DEFAULT_ORIGIN) : DEFAULT_ORIGIN;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SplashLens-Profile-Token, X-SplashLens-Entitlement-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function getClientKey(request, body) {
  const explicit = String(body.clientId || body.deviceId || '').trim().slice(0, 80);
  if (explicit && /^[a-zA-Z0-9:_-]+$/.test(explicit)) return `client:${explicit}`;

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const ua = request.headers.get('User-Agent') || 'unknown';
  return `anon:${ip}:${ua.slice(0, 80)}`;
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function normalizeEmail(value) {
  const email = clean(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function getFreeProfileEmail(body) {
  return normalizeEmail(
    body.free_profile_email ||
    body.profileEmail ||
    body.known_email ||
    body.email ||
    body.sl_email ||
    '',
  );
}

function truthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

function entitlementSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function profileSecret(env) {
  const secret = String(env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function entitlementTokenFromRequest(request, body) {
  const headerToken = request.headers.get('x-splashlens-entitlement-token')?.trim();
  if (headerToken) return headerToken;

  const auth = request.headers.get('authorization')?.trim() || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  if (bearer.startsWith(`${ENTITLEMENT_TOKEN_PREFIX}.`)) return bearer;

  return typeof body.entitlementToken === 'string' ? body.entitlementToken.trim() : '';
}

function profileTokenFromRequest(request, body) {
  const headerToken = request.headers.get('x-splashlens-profile-token')?.trim();
  if (headerToken) return headerToken;
  return typeof body.free_profile_token === 'string' ? body.free_profile_token.trim() : '';
}

async function verifyEntitlementToken(request, env, body) {
  const token = entitlementTokenFromRequest(request, body);
  if (!token) return { present: false, ok: false };

  const secret = entitlementSecret(env);
  if (!secret) {
    return {
      present: true,
      ok: false,
      status: 503,
      error: 'Scan entitlement verification is not configured.',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== ENTITLEMENT_TOKEN_PREFIX) {
    return { present: true, ok: false, status: 401, error: 'Invalid scan entitlement token.' };
  }

  const signed = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(secret, signed);
  if (!constantTimeEqual(parts[2], expected)) {
    return { present: true, ok: false, status: 401, error: 'Invalid scan entitlement token.' };
  }

  const payload = parseEntitlementPayload(parts[1]);
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
    return { present: true, ok: false, status: 401, error: 'Scan entitlement token expired.' };
  }

  if (!scopeAllowed(payload.scopes, 'scan')) {
    return { present: true, ok: false, status: 403, error: 'Scan entitlement does not include scanner access.' };
  }

  return {
    present: true,
    ok: true,
    subject: String(payload.sub).slice(0, 120),
    plan: String(payload.plan || 'SplashLens Premium').slice(0, 80),
  };
}

async function verifyProfileToken(request, env, body, email) {
  const token = profileTokenFromRequest(request, body);
  if (!token) {
    return { ok: false, status: 401, error: 'Verify your free SplashLens profile email before using AI scans.' };
  }

  const secret = profileSecret(env);
  if (!secret) {
    return { ok: false, status: 503, error: 'Free profile verification is not configured.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== PROFILE_TOKEN_PREFIX) {
    return { ok: false, status: 401, error: 'Free profile verification token is invalid.' };
  }

  const signed = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(secret, signed);
  if (!constantTimeEqual(parts[2], expected)) {
    return { ok: false, status: 401, error: 'Free profile verification token is invalid.' };
  }

  const payload = parseEntitlementPayload(parts[1]);
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 401, error: 'Free profile verification expired. Verify your email again.' };
  }
  if (String(payload.sub || '').toLowerCase() !== email) {
    return { ok: false, status: 401, error: 'Free profile token does not match this email.' };
  }
  if (!scopeAllowed(payload.scopes, 'free_scan')) {
    return { ok: false, status: 403, error: 'Free profile token does not include scanner access.' };
  }

  return { ok: true, subject: email };
}

function parseEntitlementPayload(value) {
  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(value)));
    if (!decoded || typeof decoded !== 'object') return null;
    if (typeof decoded.sub !== 'string' || typeof decoded.exp !== 'number') return null;
    return decoded;
  } catch {
    return null;
  }
}

function scopeAllowed(scopes, requested) {
  if (!scopes) return false;
  if (scopes === 'all' || scopes === requested) return true;
  return Array.isArray(scopes) && (scopes.includes('all') || scopes.includes(requested));
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

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function secondsUntilNextMonth() {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return Math.max(60, Math.ceil((nextMonth.getTime() - now.getTime()) / 1000));
}

async function recordFreeProfileScanUse(request, env, body, email, mode, usage) {
  if (!env.SUBSCRIBERS_DB || !email) return;
  const name = clean(body.known_name || body.free_profile_name || body.name, 140);
  const company = clean(body.known_company || body.free_profile_company || body.company, 160);
  const role = clean(body.known_role || body.free_profile_role || body.role || 'tech', 80);
  const clientId = clean(body.clientId || body.client_id || body.deviceId, 120);
  const path = clean(body.path || '', 300);
  const referrer = clean(request.headers.get('Referer'), 500);
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const country = clean(request.cf && request.cf.country, 10);

  try {
    await env.SUBSCRIBERS_DB.prepare(
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
    await env.SUBSCRIBERS_DB.prepare(
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
    ).bind(email, name, company, role, `scan_${mode}`, clientId, clientId, path, path, userAgent, referrer, country).run();
    await env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      'free_profile_scan_used',
      'app',
      path,
      'free_profile',
      mode,
      JSON.stringify({
        known_email: email,
        known_name: name,
        known_company: company,
        known_role: role,
        client_id: clientId,
        usage_count: usage?.count || 0,
        usage_limit: usage?.limit || FREE_SCAN_LIMIT,
        identity_source: 'free_scan_profile',
        identity_confidence: 'provided-email',
      }).slice(0, 2400),
      userAgent,
      referrer,
      country,
    ).run();
  } catch (error) {
    console.error('SplashLens free profile scan record error:', error);
  }
}

async function enforceUsageQuota(request, env, headers, key, limit, source, upgradePath) {
  const limiter = env.SCAN_RATE_LIMITER || env.RATE_LIMITER;

  if (limiter && typeof limiter.limit === 'function') {
    const { success } = await limiter.limit({ key });
    if (!success) {
      return {
        ok: false,
        response: json({ error: 'Scan rate limit exceeded. Try again later.' }, 429, {
          ...headers,
          'Retry-After': '60',
        }),
      };
    }
  }

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.get === 'function' && typeof env.SCAN_USAGE_KV.put === 'function') {
    const usageKey = `scan:${monthKey()}:${key}`;
    const current = Number(await env.SCAN_USAGE_KV.get(usageKey)) || 0;
    if (current >= limit) {
      return {
        ok: false,
        response: json({
          error: source === 'entitlement'
            ? 'Monthly scan entitlement limit reached.'
            : 'Free scan limit reached for this month.',
          limit,
          upgrade: upgradePath,
        }, 429, headers),
      };
    }
    await env.SCAN_USAGE_KV.put(usageKey, String(current + 1), { expirationTtl: secondsUntilNextMonth() });
    return { ok: true, usage: { count: current + 1, previousCount: current, limit, source, usageKey } };
  }

  const production = isProductionRequest(request, env);
  if (production) {
    return {
      ok: false,
      response: json({ error: 'Server scan metering is not configured' }, 503, headers),
    };
  }

  const now = Date.now();
  const bucket = localScanWindow.get(key) || { count: 0, resetAt: now + LOCAL_FALLBACK_WINDOW_MS };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + LOCAL_FALLBACK_WINDOW_MS;
  }
  if (bucket.count >= LOCAL_FALLBACK_LIMIT) {
    return {
      ok: false,
      response: json({ error: 'Local scan limit reached. Configure SCAN_USAGE_KV for production metering.' }, 429, headers),
    };
  }
  bucket.count += 1;
  localScanWindow.set(key, bucket);
  return { ok: true, usage: { count: bucket.count, previousCount: bucket.count - 1, limit: LOCAL_FALLBACK_LIMIT, source: 'local', localKey: key } };
}

async function refundUsageQuota(env, usage) {
  if (!usage || typeof usage !== 'object') return;

  if (usage.usageKey && env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.get === 'function' && typeof env.SCAN_USAGE_KV.put === 'function') {
    const current = Number(await env.SCAN_USAGE_KV.get(usage.usageKey)) || 0;
    if (current === Number(usage.count || 0)) {
      await env.SCAN_USAGE_KV.put(usage.usageKey, String(Math.max(0, Number(usage.previousCount || 0))), { expirationTtl: secondsUntilNextMonth() });
    }
    return;
  }

  if (usage.localKey && localScanWindow.has(usage.localKey)) {
    const bucket = localScanWindow.get(usage.localKey);
    bucket.count = Math.max(0, Number(bucket.count || 0) - 1);
    localScanWindow.set(usage.localKey, bucket);
  }
}

function publicUsage(usage) {
  const payload = {
    count: Number(usage?.count || 0),
    limit: Number(usage?.limit || FREE_SCAN_LIMIT),
    source: clean(usage?.source || 'unknown', 60),
  };
  if (usage?.plan) payload.plan = clean(usage.plan, 80);
  return payload;
}

async function enforceScanAccess(request, env, headers, body) {
  const entitlement = await verifyEntitlementToken(request, env, body);
  if (entitlement.present) {
    if (!entitlement.ok) {
      return {
        ok: false,
        response: json({ error: entitlement.error }, entitlement.status || 401, headers),
      };
    }

    const quota = await enforceUsageQuota(
      request,
      env,
      headers,
      `entitled:${entitlement.subject}`,
      ENTITLED_SCAN_LIMIT,
      'entitlement',
      '/account',
    );
    if (!quota.ok) return quota;
    return { ok: true, usage: { ...quota.usage, plan: entitlement.plan } };
  }

  if (truthy(env.SCAN_REQUIRE_ENTITLEMENT)) {
    return {
      ok: false,
      response: json({
        error: 'A signed SplashLens scan entitlement is required.',
        upgrade: '/pricing',
      }, 401, headers),
    };
  }

  const freeProfileEmail = getFreeProfileEmail(body);
  if (!freeProfileEmail) {
    return {
      ok: false,
      response: json({
        error: 'Create a free SplashLens profile before using AI scans.',
        profileRequired: true,
        limit: FREE_SCAN_LIMIT,
        upgrade: '/api/checkout?plan=monthly',
      }, 401, headers),
    };
  }

  const profile = await verifyProfileToken(request, env, body, freeProfileEmail);
  if (!profile.ok) {
    return {
      ok: false,
      response: json({
        error: profile.error,
        profileRequired: true,
        verificationRequired: true,
        limit: FREE_SCAN_LIMIT,
        upgrade: '/api/checkout?plan=monthly',
      }, profile.status || 401, headers),
    };
  }

  return enforceUsageQuota(
    request,
    env,
    headers,
    `free_profile:${freeProfileEmail}`,
    FREE_SCAN_LIMIT,
    'free_metered',
    '/api/checkout?plan=monthly',
  );
}

function normalizeImage(image) {
  if (typeof image !== 'string' || !image.trim()) {
    return { error: 'No image provided' };
  }

  const dataUrl = image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  const mediaType = dataUrl ? dataUrl[1].toLowerCase().replace('image/jpg', 'image/jpeg') : 'image/jpeg';
  const base64 = (dataUrl ? dataUrl[2] : image).replace(/\s/g, '');

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { error: 'Image must be base64 encoded' };
  }
  if (base64.length > MAX_IMAGE_BASE64_CHARS) {
    return { error: 'Image is too large. Upload a compressed image under 5 MB.' };
  }

  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const estimatedBytes = Math.floor((base64.length * 3) / 4) - padding;
  if (estimatedBytes <= 0 || estimatedBytes > MAX_IMAGE_BYTES) {
    return { error: 'Image is too large. Upload a compressed image under 5 MB.' };
  }

  return { base64, mediaType };
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request, env);
  const origin = request.headers.get('Origin') || '';
  const production = isProductionRequest(request, env);

  if (!isAllowedOrigin(origin, production)) {
    return json({ error: 'Origin not allowed' }, 403, headers);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_IMAGE_BASE64_CHARS + 4096) {
    return json({ error: 'Request is too large. Upload a compressed image under 5 MB.' }, 413, headers);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI scanner not configured' }, 503, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400, headers);
  }

  const { image, mode = 'error_code' } = body;
  if (!PROMPTS[mode]) return json({ error: 'Unknown mode' }, 400, headers);

  const normalized = normalizeImage(image);
  if (normalized.error) return json({ error: normalized.error }, 400, headers);

  const meter = await enforceScanAccess(request, env, headers, body);
  if (!meter.ok) return meter.response;

  try {
    const apiRes = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: normalized.mediaType, data: normalized.base64 } },
            { type: 'text', text: PROMPTS[mode] }
          ]
        }]
      })
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error('Anthropic API error:', apiRes.status, err);
      await refundUsageQuota(env, meter.usage);
      return json({ error: 'AI service error', status: apiRes.status }, 502, headers);
    }

    const data = await apiRes.json();
    const text = data.content?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch {
      await refundUsageQuota(env, meter.usage);
      return json({ error: 'AI response parse failed', raw: text.slice(0, 200) }, 502, headers);
    }

    await recordFreeProfileScanUse(request, env, body, getFreeProfileEmail(body), mode, meter.usage);
    return json({ ok: true, mode, result: parsed, usage: publicUsage(meter.usage) }, 200, headers);
  } catch (err) {
    console.error('Scan worker error:', err);
    await refundUsageQuota(env, meter.usage).catch(() => {});
    return json({ error: 'Internal error' }, 500, headers);
  }
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env)
  });
}
