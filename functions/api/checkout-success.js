const TOKEN_PREFIX = 'sl_scan_v1';
const textEncoder = new TextEncoder();

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function tokenSecret(env) {
  const secret = String(env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

async function stripeGet(path, env) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!response.ok) {
    console.error('SplashLens Stripe lookup failed', response.status, await response.text());
    return null;
  }
  return response.json();
}

function isPaid(session) {
  return session && (session.payment_status === 'paid' || session.status === 'complete');
}

function cleanSubject(session) {
  const email = String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase();
  const customer = String(session?.customer || '').trim();
  return email || customer;
}

function cleanPlan(session) {
  const metadataPlan = String(session?.metadata?.plan || '').trim();
  if (metadataPlan) return metadataPlan.slice(0, 80);
  return 'PartSnap Pro';
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

async function issueActivation(session, env) {
  const secret = tokenSecret(env);
  if (!secret) return { error: 'Scanner entitlement signing is not configured.' };

  const subject = cleanSubject(session);
  if (!subject) return { error: 'Checkout completed, but no customer email was returned.' };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    plan: cleanPlan(session),
    scopes: ['scan'],
    source: 'stripe_checkout',
    stripeSessionId: String(session.id || ''),
    stripeCustomerId: String(session.customer || ''),
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
  };
  const token = await signToken(secret, payload);
  const activateUrl = `https://app.splashlens.com/?tab=scan&scan_token=${encodeURIComponent(token)}`;

  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`entitlement:${subject}`, JSON.stringify({
      subject,
      plan: payload.plan,
      scopes: payload.scopes,
      source: payload.source,
      stripeSessionId: payload.stripeSessionId,
      stripeCustomerId: payload.stripeCustomerId,
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    }), { expirationTtl: 365 * 24 * 60 * 60 });
  }

  return { activateUrl, subject };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = String(url.searchParams.get('session_id') || '').trim();
  if (!/^cs_(test|live)_[A-Za-z0-9]+/.test(sessionId)) {
    return html('<h1>SplashLens checkout</h1><p>Missing a valid checkout session.</p>', 400);
  }

  const session = await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`, env);
  if (!session) {
    return html('<h1>SplashLens checkout</h1><p>Checkout lookup is not configured yet. Contact support for activation.</p>', 503);
  }
  if (!isPaid(session)) {
    return html('<h1>SplashLens checkout</h1><p>Payment is not complete yet. Refresh after Stripe finishes processing.</p>', 402);
  }

  const activation = await issueActivation(session, env);
  if (activation.error) {
    return html(`<h1>SplashLens checkout complete</h1><p>${escapeHtml(activation.error)} Contact support for activation.</p>`, 503);
  }

  return html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SplashLens scanner activated</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:#061b22;color:#eef8fb;display:grid;place-items:center;min-height:100vh;padding:24px}
    main{width:min(560px,100%);border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);border-radius:18px;padding:28px}
    a{display:inline-flex;margin-top:18px;padding:13px 16px;border-radius:999px;background:#58d68d;color:#061b22;font-weight:800;text-decoration:none}
    p{color:rgba(238,248,251,.78);line-height:1.5}
  </style>
</head>
<body>
  <main>
    <h1>Scanner activated.</h1>
    <p>Your paid scanner entitlement is ready for ${escapeHtml(activation.subject)}. Open SplashLens to attach it to this browser.</p>
    <a href="${escapeHtml(activation.activateUrl)}">Open SplashLens scanner</a>
  </main>
</body>
</html>`);
}
