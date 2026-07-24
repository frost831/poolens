import { splashLensAllowedPaymentLinkIds, splashLensPaymentLinkUrl } from './splashlens-plans.mjs';

const REQUIRED_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'charge.refunded',
];

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function stripeSecret(env) {
  let secret = String(env.STRIPE_SECRET_KEY || '').trim();
  if (!secret) return '';
  secret = secret.replace(/^STRIPE_SECRET_KEY\s*=\s*/i, '').replace(/^Bearer\s+/i, '').trim();
  return secret.replace(/^['"]|['"]$/g, '').trim();
}

function stripeHeaders(secret) {
  return { Authorization: `Bearer ${secret}` };
}

function normalizedUrl(value) {
  return clean(value, 500).replace(/\/+$/, '');
}

export async function stripeWebhookStatus(env, fetchImpl = fetch) {
  const secret = stripeSecret(env);
  if (!secret) return { ok: false, reason: 'missing_secret', endpointConfigured: false, missingEvents: REQUIRED_WEBHOOK_EVENTS };

  const response = await fetchImpl('https://api.stripe.com/v1/webhook_endpoints?limit=100', {
    headers: stripeHeaders(secret),
  });
  if (!response.ok) {
    return { ok: false, reason: `stripe_api_${response.status}`, endpointConfigured: false, missingEvents: REQUIRED_WEBHOOK_EVENTS };
  }

  const payload = await response.json();
  const expectedUrl = normalizedUrl(env.SPLASHLENS_STRIPE_WEBHOOK_URL || 'https://app.splashlens.com/api/stripe-webhook');
  const endpoint = (payload?.data || []).find((candidate) => normalizedUrl(candidate?.url) === expectedUrl);
  if (!endpoint) {
    return { ok: false, reason: 'endpoint_not_found', endpointConfigured: false, endpointUrl: expectedUrl, missingEvents: REQUIRED_WEBHOOK_EVENTS };
  }

  const enabledEvents = Array.isArray(endpoint.enabled_events) ? endpoint.enabled_events : [];
  const wildcard = enabledEvents.includes('*');
  const missingEvents = wildcard ? [] : REQUIRED_WEBHOOK_EVENTS.filter((event) => !enabledEvents.includes(event));
  const endpointEnabled = endpoint.status !== 'disabled';
  return {
    ok: endpointEnabled && missingEvents.length === 0,
    reason: !endpointEnabled ? 'endpoint_disabled' : missingEvents.length ? 'missing_events' : 'ok',
    endpointConfigured: true,
    endpointUrl: expectedUrl,
    endpointStatus: clean(endpoint.status || 'enabled', 40),
    requiredEvents: REQUIRED_WEBHOOK_EVENTS,
    missingEvents,
  };
}

export async function stripePaymentLinkStatus(env, fetchImpl = fetch) {
  const secret = stripeSecret(env);
  if (!secret) return { ok: false, reason: 'missing_secret', configured: 0, active: 0, links: [] };

  const configuredLinks = [...splashLensAllowedPaymentLinkIds(env).entries()];
  if (!configuredLinks.length) return { ok: false, reason: 'missing_payment_link_ids', configured: 0, active: 0, links: [] };

  const links = await Promise.all(configuredLinks.map(async ([id, plan]) => {
    const response = await fetchImpl(`https://api.stripe.com/v1/payment_links/${encodeURIComponent(id)}`, {
      headers: stripeHeaders(secret),
    });
    if (!response.ok) return { plan: plan.key, ok: false, active: false, reason: `stripe_api_${response.status}` };
    const paymentLink = await response.json();
    const expectedUrl = normalizedUrl(splashLensPaymentLinkUrl(env, plan));
    const actualUrl = normalizedUrl(paymentLink?.url);
    const urlMatches = !expectedUrl || actualUrl === expectedUrl;
    return {
      plan: plan.key,
      ok: paymentLink?.active === true && urlMatches,
      active: paymentLink?.active === true,
      urlMatches,
      reason: paymentLink?.active !== true ? 'inactive' : !urlMatches ? 'url_mismatch' : 'ok',
    };
  }));

  return {
    ok: links.every((link) => link.ok),
    reason: links.every((link) => link.ok) ? 'ok' : 'payment_link_check_failed',
    configured: links.length,
    active: links.filter((link) => link.active).length,
    links,
  };
}
