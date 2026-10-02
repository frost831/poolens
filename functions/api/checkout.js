const PLAN_CONFIG = {
  monthly: {
    amount: 2900,
    interval: 'month',
    label: 'Splash Lens Pro Unlimited Monthly',
  },
  yearly: {
    amount: 24900,
    interval: 'year',
    label: 'Splash Lens Pro Unlimited Annual',
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

async function createCheckoutSession(request, env, plan) {
  if (!env.STRIPE_SECRET_KEY) return null;

  const origin = appOrigin(request, env);
  const planKey = normalizedPlan(plan);
  const planConfig = PLAN_CONFIG[planKey];
  const configuredPrice = priceForPlan(env, planKey);
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  if (configuredPrice) {
    params.set('line_items[0][price]', configuredPrice);
  } else {
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(planConfig.amount));
    params.set('line_items[0][price_data][recurring][interval]', planConfig.interval);
    params.set('line_items[0][price_data][product_data][name]', 'Splash Lens Pro Unlimited');
    params.set('line_items[0][price_data][product_data][description]', 'Unlimited PartSnap scans, saved jobs, customer summaries, and equipment history.');
  }
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/?checkout=cancelled&plan=${encodeURIComponent(plan)}`);
  params.set('metadata[product]', 'splashlens');
  params.set('metadata[feature]', 'scanner');
  params.set('metadata[plan]', planConfig.label);
  params.set('subscription_data[metadata][product]', 'splashlens');
  params.set('subscription_data[metadata][feature]', 'scanner');
  params.set('subscription_data[metadata][plan]', params.get('metadata[plan]'));
  params.set('allow_promotion_codes', 'true');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    console.error('SplashLens checkout session creation failed', response.status, await response.text());
    return null;
  }

  const session = await response.json();
  return session?.url || null;
}

function checkoutRedirect(location, mode) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      'X-SplashLens-Checkout-Mode': mode,
    },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const plan = (url.searchParams.get('plan') || 'monthly').toLowerCase();
  if (url.searchParams.has('catalog')) {
    const checkoutEnabled = paidCheckoutEnabled(env);
    const stripeReady = checkoutEnabled && Boolean(env.STRIPE_SECRET_KEY);
    return Response.json({
      product: 'splashlens',
      plans: [
        {
          key: 'partsnap_pro_monthly',
          label: 'Splash Lens Pro Unlimited Monthly',
          priceLabel: '$29/month',
          checkoutConfigured: checkoutEnabled && (stripeReady || Boolean(paymentLinkForPlan(env, 'monthly'))),
        },
        {
          key: 'partsnap_pro_yearly',
          label: 'Splash Lens Pro Unlimited Annual',
          priceLabel: '$249/year',
          checkoutConfigured: checkoutEnabled && (stripeReady || Boolean(paymentLinkForPlan(env, 'yearly'))),
        },
        {
          key: 'team_proof_os_monthly',
          label: 'SplashLens Teams',
          priceLabel: '$149/company/month pilot target',
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

  if (!paidCheckoutEnabled(env)) {
    return Response.json({ ok: false, error: 'SplashLens paid checkout is temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const sessionUrl = await createCheckoutSession(request, env, plan);
  if (sessionUrl) return checkoutRedirect(sessionUrl, 'stripe_checkout_session');

  const target = paymentLinkForPlan(env, plan);
  if (target) return checkoutRedirect(target, 'payment_link_direct');
  return Response.json({ ok: false, error: 'Stripe Checkout could not be started. Please try again.' }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
