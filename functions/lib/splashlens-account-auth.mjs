const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1';
const ACCOUNT_TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60;
const textEncoder = new TextEncoder();

export function cleanText(value, max = 160) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

export function normalizeEmail(value) {
  const email = cleanText(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const base64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(value || '').length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
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

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function tokenFromRequest(request) {
  const direct = request.headers.get('x-splashlens-account-token')?.trim();
  if (direct) return direct;
  const authorization = request.headers.get('authorization')?.trim() || '';
  const bearer = authorization.replace(/^Bearer\s+/i, '').trim();
  return bearer.startsWith(`${ACCOUNT_TOKEN_PREFIX}.`) ? bearer : '';
}

function hasAccountScope(scopes) {
  if (scopes === 'all' || scopes === 'account') return true;
  return Array.isArray(scopes) && (scopes.includes('all') || scopes.includes('account'));
}

export async function verifySplashLensAccount(request, env) {
  const token = tokenFromRequest(request);
  if (!token) return { ok: false, status: 401, error: 'Sign in with your SplashLens email to continue.' };

  const secret = cleanText(
    env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET,
    500,
  );
  if (secret.length < 32) return { ok: false, status: 503, error: 'SplashLens account verification is not configured.' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== ACCOUNT_TOKEN_PREFIX) {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  const expected = await hmacSha256(secret, `${parts[0]}.${parts[1]}`);
  if (!constantTimeEqual(parts[2], expected)) {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  const email = normalizeEmail(payload?.sub);
  const now = Math.floor(Date.now() / 1000);
  const issuedAt = Number(payload?.iat);
  if (!email || !Number.isFinite(payload?.exp) || payload.exp <= now) {
    return { ok: false, status: 401, error: 'SplashLens account token has expired.' };
  }
  if (!Number.isFinite(issuedAt) || issuedAt > now + 300 || now - issuedAt > ACCOUNT_TOKEN_MAX_AGE_SECONDS) {
    return { ok: false, status: 401, error: 'SplashLens account session has expired. Verify your email again.' };
  }
  if (!hasAccountScope(payload.scopes)) {
    return { ok: false, status: 403, error: 'SplashLens account token does not include account access.' };
  }

  return { ok: true, email, payload };
}

export { ACCOUNT_TOKEN_PREFIX };
