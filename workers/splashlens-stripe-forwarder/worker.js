const CHECKOUT_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

const textEncoder = new TextEncoder();

export class SpouseShareRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch() {
    return json(410, {
      ok: false,
      error: 'legacy_durable_object_not_supported_by_splashlens_stripe_forwarder',
    });
  }
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function clean(value, max = 300) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function webhookSecret(env) {
  const secret = clean(env.STRIPE_WEBHOOK_SECRET, 500);
  return secret.startsWith('whsec_') ? secret : '';
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

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!secret) return { ok: false, error: 'missing_webhook_secret' };
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, ...value] = part.split('=');
      return [key, value.join('=')];
    }),
  );
  const timestamp = Number(parts.t || 0);
  const signature = parts.v1 || '';
  if (!timestamp || !signature) return { ok: false, error: 'invalid_signature_header' };
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 5 * 60) {
    return { ok: false, error: 'signature_timestamp_outside_tolerance' };
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return constantTimeEqual(expected, signature)
    ? { ok: true }
    : { ok: false, error: 'signature_mismatch' };
}

async function signForward(rawBody, env) {
  const secret = forwardSecret(env);
  if (!secret) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return { timestamp, signature };
}

async function forwardEvent(rawBody, env) {
  const signed = await signForward(rawBody, env);
  if (!signed) return { ok: false, status: 500, body: { ok: false, error: 'missing_forward_secret' } };

  const response = await fetch(env.SPLASHLENS_FORWARD_URL || 'https://app.splashlens.com/api/stripe-forward', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SplashLens-Forward-Timestamp': String(signed.timestamp),
      'X-SplashLens-Forward-Signature': signed.signature,
    },
    body: rawBody,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = { ok: false, error: 'non_json_forward_response' };
  }

  return { ok: response.ok, status: response.status, body };
}

async function handleStripeWebhook(request, env) {
  const rawBody = await request.text();
  const verified = await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature') || '', webhookSecret(env));
  if (!verified.ok) return json(400, { ok: false, error: verified.error });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  if (!CHECKOUT_EVENTS.has(event.type)) return json(200, { ok: true, action: 'ignored_event_type' });

  const forwarded = await forwardEvent(rawBody, env);
  if (!forwarded.ok) {
    return json(502, {
      ok: false,
      error: 'forward_failed',
      forwardStatus: forwarded.status,
      forwardBody: forwarded.body,
    });
  }

  return json(200, {
    ok: true,
    action: 'forwarded',
    forwardStatus: forwarded.status,
    forwardBody: forwarded.body,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json(204, {});

    const url = new URL(request.url);
    if (url.pathname === '/stripe/webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env);
    }

    if (url.pathname === '/stripe/webhook' && request.method === 'GET') {
      return json(200, {
        ok: true,
        status: 'SplashLens Stripe worker verifier/forwarder ready.',
        forwardUrl: env.SPLASHLENS_FORWARD_URL || 'https://app.splashlens.com/api/stripe-forward',
      });
    }

    return json(404, { error: 'Not found' });
  },
};
