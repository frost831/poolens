import { handleCheckoutSession } from './stripe-webhook.js';

const CHECKOUT_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

const textEncoder = new TextEncoder();

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clean(value, max = 300) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function forwardSecret(env) {
  const secret = clean(env.SPLASHLENS_STRIPE_FORWARD_SECRET, 500);
  return secret.length >= 32 ? secret : '';
}

async function hmacSha256Hex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

async function verifyForwardSignature(rawBody, request, env) {
  const secret = forwardSecret(env);
  if (!secret) return { ok: false, error: 'missing_forward_secret' };

  const timestamp = Number(request.headers.get('X-SplashLens-Forward-Timestamp') || 0);
  const signature = clean(request.headers.get('X-SplashLens-Forward-Signature'), 128).toLowerCase();
  if (!timestamp || !signature) return { ok: false, error: 'missing_forward_signature' };
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 5 * 60) {
    return { ok: false, error: 'forward_signature_timestamp_outside_tolerance' };
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return constantTimeEqual(expected, signature)
    ? { ok: true }
    : { ok: false, error: 'forward_signature_mismatch' };
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();
  const verified = await verifyForwardSignature(rawBody, request, env);
  if (!verified.ok) return json(400, { ok: false, error: verified.error });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  if (!CHECKOUT_EVENTS.has(event.type)) return json(200, { ok: true, action: 'ignored_event_type' });

  const result = await handleCheckoutSession(event, env);
  console.log('SplashLens Stripe forwarded webhook:', JSON.stringify({ type: event.type, result }));
  return json(result.ok ? 200 : 500, result);
}

export async function onRequestGet() {
  return json(200, {
    ok: true,
    status: 'SplashLens Stripe forward endpoint ready. Only signed worker forwards are accepted.',
  });
}
