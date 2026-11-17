// Google is the authority for every grant and paid scan. The ledger binds a
// purchase to one verified SplashLens account and encrypts the restore token.
import { verifySplashLensAccount } from '../lib/splashlens-account-auth.mjs';

export const PLAY_PACKAGE = 'com.splashlens.fieldtools';
const encoder = new TextEncoder();
const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY_PACKAGE}`;
const labels = { monthly: 'SplashLens Pro Monthly (Google Play)', yearly: 'SplashLens Pro Annual (Google Play)' };

export class PlayBillingError extends Error {
  constructor(code, status = 503) { super(code); this.code = code; this.status = status; }
}
function fail(code, status) { throw new PlayBillingError(code, status); }
function b64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function unb64(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
async function digest(value) { return b64(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
export async function playAccountId(env, email) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SPLASHLENS_PLAY_LEDGER_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, encoder.encode(`play-account:${email}`)));
}
function products(env) {
  const out = {};
  for (const plan of ['monthly', 'yearly']) {
    const productId = String(env[`SPLASHLENS_PLAY_${plan.toUpperCase()}_PRODUCT`] || '');
    const basePlanId = String(env[`SPLASHLENS_PLAY_${plan.toUpperCase()}_BASE_PLAN`] || '');
    if (!/^[a-z0-9][a-z0-9._]{0,139}$/.test(productId) || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(basePlanId)) fail('billing_not_configured');
    out[plan] = { productId, basePlanId, plan, label: labels[plan] };
  }
  if (out.monthly.productId === out.yearly.productId) fail('billing_not_configured');
  return out;
}
function settings(env) {
  if (env.SPLASHLENS_PLAY_BILLING_ENABLED !== 'true') fail('billing_unavailable');
  if (String(env.SPLASHLENS_PLAY_LEDGER_SECRET || '').length < 32
    || String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').length < 32
    || !env.SUBSCRIBERS_DB?.prepare) fail('billing_not_configured');
  let credentials;
  try { credentials = JSON.parse(env.SPLASHLENS_PLAY_SERVICE_ACCOUNT || ''); } catch { fail('billing_not_configured'); }
  if (credentials.type !== 'service_account' || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(credentials.client_email || '')
    || !String(credentials.private_key || '').startsWith('-----BEGIN PRIVATE KEY-----')) fail('billing_not_configured');
  return { credentials, products: products(env) };
}
export async function playCatalog(env) {
  const config = settings(env);
  // No auto-migration on a public request. Missing schema keeps the feature off.
  await env.SUBSCRIBERS_DB.prepare('SELECT token_hash FROM google_play_purchases LIMIT 1').first();
  const access = await googleAccess(config);
  for (const product of Object.values(config.products)) {
    const catalog = await googleJson(`${base}/subscriptions/${encodeURIComponent(product.productId)}`, { headers: { Authorization: `Bearer ${access}` } });
    const plan = catalog.basePlans?.find(p => p.basePlanId === product.basePlanId);
    const us = plan?.regionalConfigs?.find(region => region.regionCode === 'US');
    const amount = product.plan === 'monthly' ? '19' : '149';
    if (catalog.packageName !== PLAY_PACKAGE || catalog.productId !== product.productId || plan?.state !== 'ACTIVE'
      || plan.autoRenewingBasePlanType?.billingPeriodDuration !== (product.plan === 'monthly' ? 'P1M' : 'P1Y')
      || us?.newSubscriberAvailability !== true || us.price?.currencyCode !== 'USD'
      || String(us.price?.units) !== amount || Number(us.price?.nanos || 0) !== 0) fail('billing_not_configured');
  }
  return { enabled: true, products: Object.values(config.products) };
}
export async function limitPlayRequest(env, email) {
  settings(env);
  const accountId = await playAccountId(env, email);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.SUBSCRIBERS_DB.prepare(`INSERT INTO google_play_request_windows (account_id, window_started, attempts)
    VALUES (?, ?, 1) ON CONFLICT(account_id) DO UPDATE SET
    attempts = CASE WHEN window_started <= ? THEN 1 ELSE attempts + 1 END,
    window_started = CASE WHEN window_started <= ? THEN excluded.window_started ELSE window_started END
    WHERE window_started <= ? OR attempts < 20 RETURNING attempts`)
    .bind(accountId, now, now - 60, now - 60, now - 60).first();
  if (!row) fail('billing_rate_limited', 429);
}
async function googleJson(url, init = {}) {
  let response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(12000), redirect: 'error' }); }
  catch { fail('google_unavailable'); }
  if (!response.ok) fail(response.status === 404 || response.status === 410 ? 'purchase_not_found' : 'google_unavailable', response.status === 404 || response.status === 410 ? 403 : 503);
  try { const body = await response.text(); return body ? JSON.parse(body) : {}; } catch { fail('google_unavailable'); }
}
async function googleAccess(config) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64(encoder.encode(JSON.stringify({ iss: config.credentials.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 300 })));
  let signature;
  try {
    const pem = config.credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
    const key = await crypto.subtle.importKey('pkcs8', unb64(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    signature = b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(`${header}.${payload}`)));
  } catch { fail('billing_not_configured'); }
  const response = await googleJson('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${payload}.${signature}` }),
  });
  if (typeof response.access_token !== 'string' || !response.access_token || response.token_type?.toLowerCase() !== 'bearer') fail('google_unavailable');
  return response.access_token;
}
async function cipherKey(env) {
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(`play-token:v1:${env.SPLASHLENS_PLAY_LEDGER_SECRET}`));
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encrypt(env, token, tokenHash) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return `${b64(iv)}.${b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(tokenHash) }, await cipherKey(env), encoder.encode(token)))}`;
}
async function decrypt(env, row) {
  const [iv, data] = row.token_ciphertext.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: encoder.encode(row.token_hash) }, await cipherKey(env), unb64(data)));
}
export function validPlayToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._~+\/-]{10,4096}={0,2}$/.test(value);
}
async function readPurchase(config, access, token) {
  const purchase = await googleJson(`${base}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`, { headers: { Authorization: `Bearer ${access}` } });
  const items = purchase.lineItems;
  if (!Array.isArray(items) || items.length !== 1) fail('unsupported_purchase', 403);
  const item = items[0];
  const product = Object.values(config.products).find(p => p.productId === item.productId && p.basePlanId === item.offerDetails?.basePlanId);
  if (!product || !item.autoRenewingPlan || item.prepaidPlan) fail('unsupported_purchase', 403);
  const expiry = Math.floor(Date.parse(item.expiryTime) / 1000);
  if (!['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED'].includes(purchase.subscriptionState)
    || !Number.isFinite(expiry) || expiry <= Math.floor(Date.now() / 1000)) fail('purchase_inactive', 403);
  if (!['ACKNOWLEDGEMENT_STATE_PENDING', 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED'].includes(purchase.acknowledgementState)) fail('purchase_inactive', 403);
  return { purchase, product, expiry };
}
async function signedEntitlement(env, row, expiry) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: row.account_id, source: 'google_play', plan: labels[row.plan_key], planKey: row.plan_key, scopes: ['scan'], purchaseHash: row.token_hash, iat: now, exp: expiry };
  const part = b64(encoder.encode(JSON.stringify(payload)));
  const signed = `sl_scan_v1.${part}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return { token: `${signed}.${b64(await crypto.subtle.sign('HMAC', key, encoder.encode(signed)))}`, entitlement: { plan: payload.plan, planKey: row.plan_key, source: 'google_play', expiresAt: new Date(expiry * 1000).toISOString() } };
}
export async function verifyPlayPurchase(env, email, token) {
  if (env.SUBSCRIBERS_DB?.withSession) env = { ...env, SUBSCRIBERS_DB: env.SUBSCRIBERS_DB.withSession('first-primary') };
  const config = settings(env);
  if (!validPlayToken(token)) fail('invalid_purchase_token', 400);
  const accountId = await playAccountId(env, email);
  const tokenHash = await digest(token);
  const existing = await env.SUBSCRIBERS_DB.prepare('SELECT * FROM google_play_purchases WHERE token_hash = ?').bind(tokenHash).first();
  if (existing && existing.account_id !== accountId) fail('purchase_account_mismatch', 403);
  const access = await googleAccess(config);
  const { purchase, product, expiry } = await readPurchase(config, access, token);
  if (purchase.testPurchase && env.SPLASHLENS_PLAY_ALLOW_TEST_PURCHASES !== 'true') fail('test_purchase_disabled', 403);
  // ABH 1.2.0 does not transmit an obfuscated account ID at purchase. Claim the
  // confidential token atomically, then attach the account ID at acknowledgement.
  // Subsequent restores require the original account in our ledger and Google.
  if (purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId
    && purchase.externalAccountIdentifiers.obfuscatedExternalAccountId !== accountId) fail('purchase_account_mismatch', 403);
  if (purchase.linkedPurchaseToken) {
    const linked = await env.SUBSCRIBERS_DB.prepare('SELECT * FROM google_play_purchases WHERE token_hash = ?').bind(await digest(purchase.linkedPurchaseToken)).first();
    if (linked && linked.account_id !== accountId) fail('purchase_account_mismatch', 403);
  }
  const ciphertext = await encrypt(env, token, tokenHash);
  await env.SUBSCRIBERS_DB.prepare(`INSERT INTO google_play_purchases
    (token_hash, account_id, product_id, plan_key, token_ciphertext, expires_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(token_hash) DO NOTHING`).bind(tokenHash, accountId, product.productId, product.plan, ciphertext, expiry, Math.floor(Date.now() / 1000)).run();
  const row = await env.SUBSCRIBERS_DB.prepare('SELECT * FROM google_play_purchases WHERE token_hash = ?').bind(tokenHash).first();
  if (!row || row.account_id !== accountId || row.product_id !== product.productId) fail('purchase_account_mismatch', 403);
  // Durable owner binding precedes acknowledgement. An uncertain acknowledgement
  // never unlocks access; retry/restore re-reads Google and is idempotent.
  if (purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
    await googleJson(`${base}/purchases/subscriptions/${encodeURIComponent(product.productId)}/tokens/${encodeURIComponent(token)}:acknowledge`, {
      method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalAccountIds: { obfuscatedAccountId: accountId } }),
    });
  }
  await env.SUBSCRIBERS_DB.prepare('UPDATE google_play_purchases SET expires_at = ?, updated_at = ? WHERE token_hash = ? AND account_id = ?')
    .bind(expiry, Math.floor(Date.now() / 1000), tokenHash, accountId).run();
  return signedEntitlement(env, row, expiry);
}
export async function restorePlayPurchases(env, email) {
  settings(env);
  const accountId = await playAccountId(env, email);
  const result = await env.SUBSCRIBERS_DB.prepare('SELECT * FROM google_play_purchases WHERE account_id = ? ORDER BY expires_at DESC LIMIT 10').bind(accountId).all();
  for (const row of result.results || []) {
    try { return await verifyPlayPurchase(env, email, await decrypt(env, row)); }
    catch (error) {
      if (!(error instanceof PlayBillingError) || error.status !== 403) throw error;
    }
  }
  fail('no_active_purchase', 404);
}
export async function verifyPlayScan(request, env, payload) {
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return { present: true, ...auth, profileRequired: true };
  try {
    settings(env);
    await limitPlayRequest(env, auth.email);
    const accountId = await playAccountId(env, auth.email);
    if (payload.sub !== accountId || !/^[A-Za-z0-9_-]{43}$/.test(payload.purchaseHash || '')) fail('purchase_account_mismatch', 403);
    const row = await env.SUBSCRIBERS_DB.prepare('SELECT * FROM google_play_purchases WHERE token_hash = ?').bind(payload.purchaseHash).first();
    if (!row || row.account_id !== accountId) fail('purchase_account_mismatch', 403);
    await verifyPlayPurchase(env, auth.email, await decrypt(env, row));
    return { present: true, ok: true, subject: accountId, plan: labels[row.plan_key] };
  } catch (error) {
    return { present: true, ok: false, status: error instanceof PlayBillingError ? error.status : 503, error: 'Google Play access could not be confirmed. Restore your purchase or try again.' };
  }
}
