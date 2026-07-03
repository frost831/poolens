const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

const PRODUCTS = {
  partsnap_pro_monthly: { plan: 'PartSnap Pro Monthly', storeProductId: 'partsnap_pro_monthly' },
  partsnap_pro_annual: { plan: 'PartSnap Pro Annual', storeProductId: 'partsnap_pro_annual' },
  partsnap_pro_yearly: { plan: 'PartSnap Pro Annual', storeProductId: 'partsnap_pro_annual' },
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function tokenSecret(env) {
  const secret = clean(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET, 300);
  return secret.length >= 32 ? secret : '';
}

function nativeSharedSecret(env) {
  const secret = clean(env.SPLASHLENS_NATIVE_BILLING_SHARED_SECRET || '', 300);
  return secret.length >= 32 ? secret : '';
}

function productSpec(productId) {
  return PRODUCTS[clean(productId, 80)] || null;
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

function base64UrlDecodeJson(part) {
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function decodeAppleTransactionJws(jws) {
  const parts = clean(jws, 4096).split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = base64UrlDecodeJson(parts[1]);
    return {
      raw: payload,
      productId: clean(payload.productId, 120),
      transactionId: clean(payload.transactionId || payload.originalTransactionId, 160),
      originalTransactionId: clean(payload.originalTransactionId, 160),
      expiresAt: Number(payload.expiresDate || 0) || 0,
      environment: clean(payload.environment, 40),
      bundleId: clean(payload.bundleId, 120),
    };
  } catch {
    return null;
  }
}

async function verifyApple(body, env) {
  const jws = clean(body.signedTransactionInfo || body.transactionJws || body.purchaseToken, 4096);
  if (!jws) return { ok: false, status: 400, error: 'Missing Apple transaction JWS.' };

  const decoded = decodeAppleTransactionJws(jws);
  if (!decoded) return { ok: false, status: 400, error: 'Apple transaction JWS could not be read.' };
  if (!decoded.transactionId) return { ok: false, status: 400, error: 'Apple transaction ID is missing.' };

  const serverVerified = await verifyAppleWithServerApi(decoded.transactionId, env);
  if (!serverVerified.ok) return serverVerified;
  const verified = serverVerified.transaction || decoded;
  const expectedBundle = clean(env.SPLASHLENS_IOS_BUNDLE_ID || 'com.splashlens.app', 120);
  if (verified.bundleId && verified.bundleId !== expectedBundle) {
    return { ok: false, status: 403, error: 'Apple transaction bundle does not match SplashLens.' };
  }
  if (verified.productId !== clean(body.productId, 120)) {
    return { ok: false, status: 403, error: 'Apple transaction product does not match request.' };
  }
  if (verified.expiresAt && verified.expiresAt <= Date.now()) {
    return { ok: false, status: 402, error: 'Apple subscription is expired.' };
  }

  return {
    ok: true,
    subject: clean(body.appAccountToken || verified.originalTransactionId || verified.transactionId, 180),
    store: 'ios',
    source: 'ios_storekit',
    transactionId: verified.transactionId,
    productId: verified.productId,
    expiresAt: verified.expiresAt || Date.now() + 365 * 24 * 60 * 60 * 1000,
  };
}

async function verifyAppleWithServerApi(transactionId, env) {
  const token = await appleServerToken(env);
  if (!token.token) return { ok: false, status: 503, error: `Apple App Store Server API verification not configured: ${token.error}` };

  const endpoints = [
    'https://api.storekit.itunes.apple.com/inApps/v1/transactions/',
    'https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/',
  ];
  let lastStatus = 0;
  for (const base of endpoints) {
    const response = await fetch(`${base}${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${token.token}` },
    });
    lastStatus = response.status;
    if (!response.ok) continue;
    const payload = await response.json();
    const verifiedJws = clean(payload.signedTransactionInfo, 4096);
    const transaction = verifiedJws ? decodeAppleTransactionJws(verifiedJws) : null;
    if (!transaction) return { ok: false, status: 502, error: 'Apple Server API returned unreadable transaction data.' };
    return { ok: true, transaction };
  }

  return { ok: false, status: lastStatus || 502, error: `Apple App Store Server API transaction lookup failed: ${lastStatus || 'no_response'}` };
}

async function appleServerToken(env) {
  const issuerId = clean(env.APPLE_APP_STORE_CONNECT_ISSUER_ID || env.APPLE_ISSUER_ID, 120);
  const keyId = clean(env.APPLE_APP_STORE_CONNECT_KEY_ID || env.APPLE_KEY_ID, 120);
  const bundleId = clean(env.SPLASHLENS_IOS_BUNDLE_ID || 'com.splashlens.app', 120);
  const privateKey = String(env.APPLE_APP_STORE_CONNECT_PRIVATE_KEY || env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  if (!issuerId || !keyId || !privateKey.includes('BEGIN PRIVATE KEY')) return { error: 'missing_apple_server_api_credentials' };

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(textEncoder.encode(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })));
  const claim = base64UrlEncode(textEncoder.encode(JSON.stringify({
    iss: issuerId,
    iat: now,
    exp: now + 1200,
    aud: 'appstoreconnect-v1',
    bid: bundleId,
  })));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    textEncoder.encode(`${header}.${claim}`),
  );
  return { token: `${header}.${claim}.${base64UrlEncode(new Uint8Array(signature))}` };
}

async function googleAccessToken(env) {
  const clientEmail = clean(env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL, 300);
  const privateKey = String(env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  if (!clientEmail || !privateKey.includes('BEGIN PRIVATE KEY')) return { error: 'missing_google_play_service_account' };

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(textEncoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = base64UrlEncode(textEncoder.encode(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textEncoder.encode(`${header}.${claim}`));
  const assertion = `${header}.${claim}.${base64UrlEncode(new Uint8Array(signature))}`;
  const params = new URLSearchParams();
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.set('assertion', assertion);
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
  if (!response.ok) return { error: `google_oauth_${response.status}` };
  const payload = await response.json();
  return { token: clean(payload.access_token, 2048) };
}

function pemToArrayBuffer(pem) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function verifyGoogle(body, env) {
  const packageName = clean(env.GOOGLE_PLAY_PACKAGE_NAME || 'com.splashlens.fieldtools', 160);
  const productId = clean(body.productId, 120);
  const purchaseToken = clean(body.purchaseToken, 2048);
  if (!purchaseToken) return { ok: false, status: 400, error: 'Missing Google Play purchase token.' };
  const auth = await googleAccessToken(env);
  if (!auth.token) return { ok: false, status: 503, error: `Google Play verification not configured: ${auth.error}` };

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } });
  if (!response.ok) return { ok: false, status: response.status, error: `Google Play purchase verification failed: ${response.status}` };
  const payload = await response.json();
  const expiry = Number(payload.expiryTimeMillis || 0);
  if (!expiry || expiry <= Date.now()) return { ok: false, status: 402, error: 'Google Play subscription is expired.' };
  if (Number(payload.paymentState || 0) !== 1 && Number(payload.paymentState || 0) !== 2) {
    return { ok: false, status: 402, error: 'Google Play subscription is not paid yet.' };
  }

  return {
    ok: true,
    subject: clean(payload.obfuscatedExternalAccountId || payload.linkedPurchaseToken || body.accountId || purchaseToken.slice(0, 80), 180),
    store: 'android',
    source: 'google_play_billing',
    transactionId: clean(payload.orderId || body.transactionId, 160),
    productId,
    expiresAt: expiry,
  };
}

async function issueEntitlement(verified, spec, env) {
  const secret = tokenSecret(env);
  if (!secret) return { ok: false, status: 503, error: 'Entitlement signing is not configured.' };
  if (!verified.subject) return { ok: false, status: 400, error: 'Verified purchase did not include a stable subject.' };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: verified.subject,
    plan: spec.plan,
    scopes: ['scan'],
    source: verified.source,
    store: verified.store,
    storeProductId: verified.productId,
    storeTransactionId: verified.transactionId,
    iat: now,
    exp: Math.floor((verified.expiresAt || Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000),
  };
  const token = await signToken(secret, payload);
  const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`;
  const record = {
    subject: verified.subject,
    plan: spec.plan,
    scopes: ['scan'],
    source: verified.source,
    store: verified.store,
    storeProductId: verified.productId,
    storeTransactionId: verified.transactionId,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${verified.subject}`, JSON.stringify(record), { expirationTtl: 365 * 24 * 60 * 60 });
    await env.SCAN_USAGE_KV.put(`native-payment:${verified.store}:${verified.transactionId || crypto.randomUUID()}`, JSON.stringify({
      ...record,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 365 * 24 * 60 * 60 });
  }

  return { ok: true, activateUrl, entitlement: record };
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON.' });
  }

  const store = clean(body.store, 20).toLowerCase();
  const spec = productSpec(body.productId);
  if (!['ios', 'android'].includes(store)) return json(400, { ok: false, error: 'Store must be ios or android.' });
  if (!spec) return json(400, { ok: false, error: 'Unknown SplashLens native product.' });

  const shared = nativeSharedSecret(env);
  if (shared) {
    const supplied = clean(request.headers.get('X-SplashLens-Native-Secret'), 300);
    if (supplied !== shared) return json(401, { ok: false, error: 'Unauthorized native billing bridge.' });
  }

  const verified = store === 'ios'
    ? await verifyApple(body, env)
    : await verifyGoogle(body, env);
  if (!verified.ok) return json(verified.status || 400, { ok: false, error: verified.error });

  const issued = await issueEntitlement(verified, spec, env);
  if (!issued.ok) return json(issued.status || 500, { ok: false, error: issued.error });

  return json(200, {
    ok: true,
    activateUrl: issued.activateUrl,
    entitlement: issued.entitlement,
  });
}

export async function onRequestGet() {
  return json(200, {
    ok: true,
    status: 'SplashLens native entitlement endpoint ready. Verifies store purchase data before issuing scanner access.',
    products: Object.keys(PRODUCTS),
  });
}
