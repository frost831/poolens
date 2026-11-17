import { verifySplashLensAccount } from '../lib/splashlens-account-auth.mjs';
import { playCatalog, verifyPlayPurchase, restorePlayPurchases, limitPlayRequest, PlayBillingError } from '../_shared/google-play-billing.mjs';

const messages = {
  billing_rate_limited: 'Too many Google Play checks. Wait a minute, then try again.',
  purchase_account_mismatch: 'This purchase belongs to a different SplashLens account. Sign in with the original account or contact support.',
  purchase_inactive: 'This Google Play subscription is pending, paused, expired, or no longer active. Check Google Play and try Restore again.',
  no_active_purchase: 'No active Google Play subscription was found for this SplashLens account. Use Restore on the original Google Play account.',
};
function response(request, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    'Access-Control-Allow-Origin': 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SplashLens-Account-Token, Authorization',
  } });
}
async function access(request, env) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return { ok: false, status: 403, error: 'Use the SplashLens app to manage Google Play access.' };
  return verifySplashLensAccount(request, env);
}
export async function onRequestGet({ request, env }) {
  const auth = await access(request, env);
  if (!auth.ok) return response(request, { error: auth.error }, auth.status);
  try { await limitPlayRequest(env, auth.email); return response(request, await playCatalog(env)); }
  catch { return response(request, { enabled: false, products: [], message: 'Google Play upgrades are unavailable. Free tools remain available.' }); }
}
export async function onRequestPost({ request, env }) {
  const auth = await access(request, env);
  if (!auth.ok) return response(request, { error: auth.error }, auth.status);
  // Bound the actual stream, not just an optional/untrusted Content-Length.
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 8192) { await reader.cancel(); return response(request, { error: 'Purchase request is too large.' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return response(request, { error: 'Valid JSON is required.' }, 400); }
  if (!body || !['verify', 'restore'].includes(body.action)) return response(request, { error: 'Choose verify or restore.' }, 400);
  try {
    await limitPlayRequest(env, auth.email);
    const result = body.action === 'restore' ? await restorePlayPurchases(env, auth.email) : await verifyPlayPurchase(env, auth.email, body.purchaseToken);
    return response(request, { ok: true, ...result });
  } catch (error) {
    const code = error instanceof PlayBillingError ? error.code : 'billing_unavailable';
    return response(request, { ok: false, code, error: messages[code] || 'Google Play access could not be confirmed. Try Restore again or contact hello@splashlens.com.' }, error instanceof PlayBillingError ? error.status : 503);
  }
}
export async function onRequestOptions({ request }) { return response(request, {}, 200); }
