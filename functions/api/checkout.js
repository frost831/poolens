import { checkoutAttribution, recordPaymentEvent } from '../_shared/payment-funnel.mjs';
import { classifyTraffic } from '../_shared/traffic-class.mjs';
import { closingPassAmount, recordClosingPassCheckout } from '../_shared/closing-pass.mjs';

const PLAN_CONFIG = {
  monthly: {
    amount: 1900,
    interval: 'month',
    label: 'Splash Lens Pro Unlimited Monthly',
  },
  yearly: {
    amount: 14900,
    interval: 'year',
    label: 'Splash Lens Pro Unlimited Annual',
  },
  closing_pass_60d: {
    label: 'SplashLens Closing Pro 60-Day Pass',
  },
};

function normalizedPlan(plan) {
  return /year|annual/i.test(String(plan || '')) ? 'yearly' : 'monthly';
}

function paymentLinkForPlan(env, plan) {
  const yearly = normalizedPlan(plan) === 'yearly';
  return String(
    yearly
      ? env.SPLASHLENS_STRIPE_LINK_YEARLY_PRO || env.SPLASHLENS_STRIPE_LINK_YEARLY || ''
      : env.SPLASHLENS_STRIPE_LINK_MONTHLY_PRO || env.SPLASHLENS_STRIPE_LINK_MONTHLY || ''
  ).trim();
}

function priceForPlan(env, plan) {
  const key = normalizedPlan(plan) === 'yearly' ? 'YEARLY' : 'MONTHLY';
  return String(
    env[`SPLASHLENS_STRIPE_PRICE_${key}_PRO`]
      || env[`SPLASHLENS_STRIPE_PRICE_${key}`]
      || env[`STRIPE_PRICE_${key}`]
      || '',
  ).trim();
}

function appOrigin(request, env) {
  return String(env.SPLASHLENS_APP_ORIGIN || new URL(request.url).origin).replace(/\/+$/, '');
}

function paidCheckoutEnabled(env) {
  return !/^(0|false|off|disabled)$/i.test(String(env.SPLASHLENS_PAID_CHECKOUT_ENABLED || '').trim());
}

function isAutomatedPreview(request) {
  const userAgent = String(request.headers.get('User-Agent') || '');
  return /bot|crawler|spider|preview|externalagent|facebookexternalhit|headless|curl|python-requests|node-fetch/i.test(userAgent)
    || /prefetch/i.test(`${request.headers.get('Purpose') || ''} ${request.headers.get('Sec-Purpose') || ''}`)
    || (request.headers.has('Sec-Fetch-Mode') && !['navigate', 'cors'].includes(request.headers.get('Sec-Fetch-Mode')));
}

async function configuredPriceMatchesPlan(env, priceId, planConfig) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
    if (!response.ok) return false;
    const price = await response.json();
    return price.active === true
      && price.currency === 'usd'
      && price.unit_amount === planConfig.amount
      && price.recurring?.interval === planConfig.interval
      && price.recurring?.interval_count === 1;
  } catch {
    return false;
  }
}

async function createCheckoutSession(request, env, plan, attributionInput) {
  if (!env.STRIPE_SECRET_KEY) return null;

  const origin = appOrigin(request, env);
  const pass = plan === 'closing_pass_60d';
  const planKey = pass ? plan : normalizedPlan(plan);
  const planConfig = PLAN_CONFIG[planKey];
  const passAmount = pass ? closingPassAmount(env) : null;
  if (pass && !passAmount) return { configurationError: true };
  const configuredPrice = pass ? '' : priceForPlan(env, planKey);
  if (configuredPrice && !(await configuredPriceMatchesPlan(env, configuredPrice, planConfig))) {
    console.error('SplashLens checkout Price ID does not match the published plan');
    return { configurationError: true };
  }
  const params = new URLSearchParams();
  if (pass) params.set('mode', 'payment');
  else params.set('mode', 'subscription');
  if (configuredPrice) {
    params.set('line_items[0][price]', configuredPrice);
  } else {
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(pass ? passAmount : planConfig.amount));
    if (!pass) params.set('line_items[0][price_data][recurring][interval]', planConfig.interval);
    params.set('line_items[0][price_data][product_data][name]', pass ? planConfig.label : 'Splash Lens Pro Unlimited');
    params.set('line_items[0][price_data][product_data][description]', pass
      ? '60 days of SplashLens Pro access for closing season.'
      : 'Unlimited PartSnap scans, saved jobs, customer summaries, and equipment history.');
  }
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/?checkout=cancelled&plan=${encodeURIComponent(plan)}`);
  params.set('metadata[product]', 'splashlens');
  params.set('metadata[feature]', 'scanner');
  params.set('metadata[plan]', planConfig.label);
  if (pass) {
    params.set('metadata[plan_key]', planKey);
    params.set('metadata[pass_amount_cents]', String(passAmount));
    params.set('payment_intent_data[metadata][product]', 'splashlens');
    params.set('payment_intent_data[metadata][plan_key]', planKey);
  } else {
    params.set('subscription_data[metadata][product]', 'splashlens');
    params.set('subscription_data[metadata][feature]', 'scanner');
    params.set('subscription_data[metadata][plan]', params.get('metadata[plan]'));
  }
  const attribution = checkoutAttribution(attributionInput);
  // Public callers cannot claim an administrative checkout source.
  if (attribution.source === 'admin') attribution.source = 'server';
  if (attribution.client_reference_id) params.set('client_reference_id', attribution.client_reference_id);
  for (const [key, value] of Object.entries(attribution)) {
    if (!value) continue;
    params.set(`metadata[${key}]`, value);
    if (!pass) params.set(`subscription_data[metadata][${key}]`, value);
  }
  if (!pass) params.set('allow_promotion_codes', 'true');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `splashlens-${attribution.client_reference_id}`,
    },
    body: params,
  });

  if (!response.ok) {
    console.error('SplashLens checkout session creation failed', response.status, await response.text());
    return null;
  }

  const session = await response.json();
  return session?.url ? { ...session, attribution } : null;
}

function checkoutResponse(location, mode) {
  return Response.json({ ok: true, url: location, mode }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-SplashLens-Checkout-Mode': mode,
    },
  });
}

async function recordCheckoutStarted(request, env, plan, mode, attribution) {
  const db = env.SUBSCRIBERS_DB;
  if (!db || typeof db.prepare !== 'function') return;
  try {
    await db.prepare(
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
      )`,
    ).run();
    const userAgent = String(request.headers.get('User-Agent') || '').slice(0, 300);
    const trafficClass = classifyTraffic({ source: attribution.source, userAgent, props: attribution, serverOrigin: true });
    await db.prepare(
      `INSERT INTO events (event, source, path, plan, mode, props, user_agent)
       VALUES ('checkout_started', ?, '/api/checkout', ?, ?, ?, ?)`,
    ).bind(attribution.source, plan === 'closing_pass_60d' ? plan : normalizedPlan(plan), mode, JSON.stringify({ ...attribution, traffic_class: trafficClass, is_internal: trafficClass !== 'real' }), userAgent).run();
  } catch (error) {
    console.error('SplashLens checkout start tracking failed', error);
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.has('catalog')) {
    const checkoutEnabled = paidCheckoutEnabled(env);
    const stripeReady = checkoutEnabled && Boolean(env.STRIPE_SECRET_KEY);
    return Response.json({
      product: 'splashlens',
      plans: [
        {
          key: 'partsnap_pro_monthly',
          label: 'Splash Lens Pro Unlimited Monthly',
          priceLabel: '$19/month',
          checkoutConfigured: checkoutEnabled && (stripeReady || (Boolean(paymentLinkForPlan(env, 'monthly')) && env.SPLASHLENS_PAYMENT_LINK_PRICING_VERSION === '2026-10-growth')),
        },
        {
          key: 'partsnap_pro_yearly',
          label: 'Splash Lens Pro Unlimited Annual',
          priceLabel: '$149/year',
          checkoutConfigured: checkoutEnabled && (stripeReady || (Boolean(paymentLinkForPlan(env, 'yearly')) && env.SPLASHLENS_PAYMENT_LINK_PRICING_VERSION === '2026-10-growth')),
        },
        ...(closingPassAmount(env) ? [{
          key: 'closing_pass_60d',
          label: PLAN_CONFIG.closing_pass_60d.label,
          priceLabel: `$${(closingPassAmount(env) / 100).toFixed(2)} one time / 60 days`,
          amountCents: closingPassAmount(env),
          checkoutConfigured: checkoutEnabled && stripeReady,
        }] : []),
        {
          key: 'team_proof_os_monthly',
          label: 'SplashLens Teams',
          priceLabel: '$49-79/owner/month; techs free',
          checkoutConfigured: false,
          requestAccessConfigured: true,
        },
        {
          key: 'facility_cpo_pilot',
          label: 'Facility / CPO Mode',
          priceLabel: 'pilot access',
          checkoutConfigured: false,
          requestAccessConfigured: true,
        },
        {
          key: 'verified_manufacturer_cards',
          label: 'Verified Manufacturer Cards',
          priceLabel: 'partner pricing',
          checkoutConfigured: false,
          requestAccessConfigured: true,
        },
        {
          key: 'distributor_counter_mode',
          label: 'Distributor / Counter Mode',
          priceLabel: 'partner pricing',
          checkoutConfigured: false,
          requestAccessConfigured: true,
        },
        {
          key: 'field_learning_os',
          label: 'Field Learning OS',
          priceLabel: 'training partner pricing',
          checkoutConfigured: false,
          requestAccessConfigured: true,
        },
      ],
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const plan = normalizedPlan(url.searchParams.get('plan'));
  const placement = /^[a-z0-9_-]{1,80}$/i.test(url.searchParams.get('placement') || '')
    ? url.searchParams.get('placement') : 'direct_checkout';
  const upgradeUrl = `/?upgrade=${plan}&placement=${encodeURIComponent(placement)}`;
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Continue to SplashLens checkout</title></head><body><main><h1>Continue to secure checkout</h1><p>Review your SplashLens plan before leaving for Stripe.</p><a href="${upgradeUrl}">Continue in SplashLens</a></main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}

export async function onRequestPost({ request, env }) {
  if (isAutomatedPreview(request)) {
    return Response.json({ ok: false, error: 'Checkout requires a browser action.' }, {
      status: 403, headers: { 'Cache-Control': 'no-store' },
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid checkout request.' }, { status: 400 });
  }
  if (!['monthly', 'yearly', 'closing_pass_60d'].includes(body?.plan) || body?.store !== 'web') {
    return Response.json({ ok: false, error: 'Web plan required.' }, { status: 400 });
  }
  const attribution = checkoutAttribution(body);
  if (!attribution.client_reference_id || !attribution.placement || !['app', 'site'].includes(attribution.source)) {
    return Response.json({ ok: false, error: 'Checkout reference and placement required.' }, { status: 400 });
  }

  if (!paidCheckoutEnabled(env)) {
    return Response.json({ ok: false, error: 'SplashLens paid checkout is temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (body.plan === 'closing_pass_60d' && (!closingPassAmount(env) || !env.STRIPE_SECRET_KEY
    || !env.SUBSCRIBERS_DB || typeof env.SUBSCRIBERS_DB.prepare !== 'function')) {
    return Response.json({ ok: false, error: 'Closing Pro pass is unavailable.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }

  await recordPaymentEvent(env, 'checkout_click_server', attribution.client_reference_id, {
    plan: body.plan, path: '/api/checkout', props: attribution,
    userAgent: String(request.headers.get('User-Agent') || ''),
  });
  const session = await createCheckoutSession(request, env, body.plan, attribution);
  if (session?.configurationError) {
    return Response.json({ ok: false, error: 'Checkout pricing is being updated. Please try again later.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (session) {
    if (body.plan === 'closing_pass_60d'
      && !(await recordClosingPassCheckout(env, session.id, closingPassAmount(env), attribution.client_reference_id))) {
      return Response.json({ ok: false, error: 'Closing Pro checkout could not be recorded.' }, {
        status: 503, headers: { 'Cache-Control': 'no-store' },
      });
    }
    await recordCheckoutStarted(request, env, body.plan, 'stripe_checkout_session', attribution);
    await recordPaymentEvent(env, 'checkout_session_created', session.id, {
      plan: body.plan, path: '/api/checkout', props: session.attribution,
      userAgent: String(request.headers.get('User-Agent') || ''),
    });
    return checkoutResponse(session.url, 'stripe_checkout_session');
  }

  const target = body.plan === 'closing_pass_60d' ? '' : paymentLinkForPlan(env, body.plan);
  if (target && env.SPLASHLENS_PAYMENT_LINK_PRICING_VERSION === '2026-10-growth') {
    await recordCheckoutStarted(request, env, body.plan, 'payment_link_direct', attribution);
    const paymentUrl = new URL(target);
    if (attribution.client_reference_id) paymentUrl.searchParams.set('client_reference_id', attribution.client_reference_id);
    return checkoutResponse(paymentUrl.href, 'payment_link_direct');
  }
  return Response.json({ ok: false, error: 'Stripe Checkout could not be started. Please try again.' }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
