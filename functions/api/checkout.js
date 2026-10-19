import { checkoutAttribution, recordPaymentEvent } from '../_shared/payment-funnel.mjs';
import { classifyTraffic } from '../_shared/traffic-class.mjs';
import { CLOSING_PASS_AMOUNT_CENTS, CLOSING_PASS_LABEL, closingPassAmount, recordClosingPassCheckout } from '../_shared/closing-pass.mjs';
import { CREW_AMOUNT_CENTS, CREW_LABEL, CREW_SEAT_LIMIT, crewPriceId } from '../_shared/crew-plan.mjs';

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
    amount: CLOSING_PASS_AMOUNT_CENTS,
    label: CLOSING_PASS_LABEL,
  },
  crew_monthly: {
    amount: CREW_AMOUNT_CENTS,
    interval: 'month',
    label: CREW_LABEL,
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
  if (plan === 'closing_pass_60d') {
    return String(env.SPLASHLENS_STRIPE_PRICE_CLOSING_PRO_60D || '').trim();
  }
  if (plan === 'crew_monthly') return crewPriceId(env);
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

async function configuredPriceMatchesPlan(env, priceId, planConfig, signal) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      signal,
    });
    if (!response.ok) return false;
    const price = await response.json();
    const oneTime = !planConfig.interval;
    const recurringOk = oneTime
      ? price.type !== 'recurring' && !price.recurring
      : price.recurring?.interval === planConfig.interval && Number(price.recurring?.interval_count || 1) === 1;
    return price.active === true
      && price.currency === 'usd'
      && price.unit_amount === planConfig.amount
      && recurringOk;
  } catch {
    return false;
  }
}

async function createCheckoutSession(request, env, plan, attributionInput) {
  if (!env.STRIPE_SECRET_KEY) return null;

  const origin = appOrigin(request, env);
  const pass = plan === 'closing_pass_60d';
  const crew = plan === 'crew_monthly';
  const planKey = pass || crew ? plan : normalizedPlan(plan);
  const planConfig = PLAN_CONFIG[planKey];
  const passAmount = pass ? closingPassAmount() : null;
  if (pass && !passAmount) return { configurationError: true };
  const configuredPrice = priceForPlan(env, planKey);
  const signal = AbortSignal.timeout(15000);
  if ((pass || crew) && !/^price_[A-Za-z0-9]+$/.test(configuredPrice)) return { configurationError: true };
  if (configuredPrice && !(await configuredPriceMatchesPlan(env, configuredPrice, planConfig, signal))) {
    console.error('SplashLens checkout Price ID does not match the published plan');
    return { configurationError: true };
  }
  const params = new URLSearchParams();
  if (pass) params.set('mode', 'payment');
  else params.set('mode', 'subscription');
  if (crew) params.set('metadata[seat_limit]', String(CREW_SEAT_LIMIT));
  if (configuredPrice) {
    params.set('line_items[0][price]', configuredPrice);
  } else {
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(pass ? passAmount : planConfig.amount));
    if (!pass) params.set('line_items[0][price_data][recurring][interval]', planConfig.interval);
    params.set('line_items[0][price_data][product_data][name]', pass ? planConfig.label : 'Splash Lens Pro Unlimited');
    params.set('line_items[0][price_data][product_data][description]', 'Unlimited PartSnap scans, saved jobs, customer summaries, and equipment history.');
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
  } else if (crew) {
    params.set('metadata[plan_key]', planKey);
    params.set('subscription_data[metadata][product]', 'splashlens');
    params.set('subscription_data[metadata][feature]', 'scanner');
    params.set('subscription_data[metadata][plan]', params.get('metadata[plan]'));
    params.set('subscription_data[metadata][plan_key]', planKey);
    params.set('subscription_data[metadata][seat_limit]', String(CREW_SEAT_LIMIT));
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
  if (!pass && !crew) params.set('allow_promotion_codes', 'true');

  let response;
  try {
    response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `splashlens-${attribution.client_reference_id}`,
      },
      body: params,
      signal,
    });
  } catch {
    console.error('SplashLens checkout session transport failed');
    return null;
  }

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
    ).bind(attribution.source, plan === 'closing_pass_60d' || plan === 'crew_monthly' ? plan : normalizedPlan(plan), mode, JSON.stringify({ ...attribution, traffic_class: trafficClass, is_internal: trafficClass !== 'real' }), userAgent).run();
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
        {
          key: 'closing_pass_60d',
          label: PLAN_CONFIG.closing_pass_60d.label,
          priceLabel: '$29 one time / 60 days',
          amountCents: CLOSING_PASS_AMOUNT_CENTS,
          accessDays: 60,
          renews: false,
          checkoutConfigured: checkoutEnabled && stripeReady && /^price_[A-Za-z0-9]+$/.test(priceForPlan(env, 'closing_pass_60d')),
        },
        {
          key: 'crew_monthly',
          label: CREW_LABEL,
          priceLabel: '$39/month',
          amountCents: CREW_AMOUNT_CENTS,
          seatLimit: CREW_SEAT_LIMIT,
          seatSummary: '1 lead + up to 3 techs',
          checkoutConfigured: checkoutEnabled && stripeReady && /^price_[A-Za-z0-9]+$/.test(priceForPlan(env, 'crew_monthly')),
        },
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

  const requestedPlan = url.searchParams.get('plan') || '';
  const plan = ['closing_pass_60d', 'crew_monthly'].includes(requestedPlan) ? requestedPlan : normalizedPlan(requestedPlan);
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
  if (!['monthly', 'yearly', 'closing_pass_60d', 'crew_monthly'].includes(body?.plan) || body?.store !== 'web') {
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

  if (body.plan === 'closing_pass_60d' && (!closingPassAmount() || !env.STRIPE_SECRET_KEY
    || !/^price_[A-Za-z0-9]+$/.test(priceForPlan(env, 'closing_pass_60d'))
    || !env.SUBSCRIBERS_DB || typeof env.SUBSCRIBERS_DB.prepare !== 'function')) {
    return Response.json({ ok: false, error: 'Closing Pro pass is unavailable.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (body.plan === 'crew_monthly' && (!env.STRIPE_SECRET_KEY
    || !/^price_[A-Za-z0-9]+$/.test(priceForPlan(env, 'crew_monthly'))
    || !env.SUBSCRIBERS_DB || typeof env.SUBSCRIBERS_DB.prepare !== 'function')) {
    return Response.json({ ok: false, error: 'Crew checkout is unavailable.' }, {
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

  const target = body.plan === 'closing_pass_60d' || body.plan === 'crew_monthly' ? '' : paymentLinkForPlan(env, body.plan);
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
