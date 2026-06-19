// Cloudflare Pages Function - AI Scanner backend
// POST /api/scan
// Body: { image: string (base64 image), mode: 'error_code' | 'parts_snap' | 'test_strip' }
// Required env: ANTHROPIC_API_KEY
// Optional bindings/env: SCAN_RATE_LIMITER, SCAN_USAGE_KV, SPLASHLENS_ENTITLEMENT_SECRET.
// Production scanner traffic must have SCAN_USAGE_KV so free and entitled monthly limits are server-enforced.

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const FREE_SCAN_LIMIT = 10;
const ENTITLED_SCAN_LIMIT = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BASE64_CHARS = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
const LOCAL_FALLBACK_LIMIT = 4;
const LOCAL_FALLBACK_WINDOW_MS = 60 * 60 * 1000;
const ENTITLEMENT_TOKEN_PREFIX = 'sl_scan_v1';
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

  parts_snap: `You are a pool equipment parts reference assistant. Suggest possible matches only when visible evidence supports them. Do not imply certainty, fit, repair need, or replacement interval unless visible markings or the user-provided context supports it.

Return ONLY valid JSON in this exact format:
{
  "manufacturer": "Hayward",
  "category": "pump",
  "component": "impeller",
  "model": "Super Pump SP2607X10",
  "partNumber": "SPX2607C",
  "description": "1 HP impeller for Super Pump",
  "condition": "worn",
  "verificationNotes": "Check visible markings, dimensions, and the manual parts diagram before ordering",
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
- verificationNotes: what to verify in the manual or parts diagram (20 words max, null if not applicable)
- searchTerms: 2-4 search strings that would find this part online
- confidence: high/medium/low

If image does not show pool equipment: {"manufacturer":null,"category":"other","component":"unknown","model":null,"partNumber":null,"description":"Not a pool part","condition":"unknown","verificationNotes":null,"searchTerms":[],"confidence":"low"}`,

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
    'Access-Control-Allow-Headers': 'Content-Type, X-BZM-Language, X-BZM-Locale, X-BZM-Auto-Translate',
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

function truthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

function entitlementSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
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
    return { ok: true, usage: { count: current + 1, limit, source } };
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
  return { ok: true, usage: { count: bucket.count, limit: LOCAL_FALLBACK_LIMIT, source: 'local' } };
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

  return enforceUsageQuota(
    request,
    env,
    headers,
    getClientKey(request, body),
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
  const preferredLanguage = String(body.preferred_language || request.headers.get('X-BZM-Language') || body.language_profile?.preferredLanguage || 'en').slice(0, 16);
  const promptLanguageInstruction = preferredLanguage === 'en'
    ? ''
    : `\nUser preferred language: ${preferredLanguage}. Keep JSON keys exactly as specified. Translate short human-readable values such as context, description, notes, disclaimer, and verificationNotes into that language when safe. Preserve brand names, model names, part numbers, codes, and chemical units exactly.`;

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
            { type: 'text', text: `${PROMPTS[mode]}${promptLanguageInstruction}` }
          ]
        }]
      })
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error('Anthropic API error:', apiRes.status, err);
      return json({ error: 'AI service error', status: apiRes.status }, 502, headers);
    }

    const data = await apiRes.json();
    const text = data.content?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch {
      return json({ error: 'AI response parse failed', raw: text.slice(0, 200) }, 502, headers);
    }

    return json({ ok: true, mode, result: parsed, usage: meter.usage, preferred_language: preferredLanguage }, 200, headers);
  } catch (err) {
    console.error('Scan worker error:', err);
    return json({ error: 'Internal error' }, 500, headers);
  }
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env)
  });
}
