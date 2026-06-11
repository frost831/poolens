const LINKS = {
  monthly: 'https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O',
  yearly: 'https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P',
  annual: 'https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P',
};

const PRICE_IDS = {
  monthly: 'price_1TbAp725fqLun6cVz5lhOiiS',
  yearly: 'price_1TbAp825fqLun6cVoVG0wqQl',
  annual: 'price_1TbAp825fqLun6cVoVG0wqQl',
};

function priceForPlan(env, plan) {
  const key = plan === 'yearly' || plan === 'annual' ? 'YEARLY' : 'MONTHLY';
  return String(
    env[`SPLASHLENS_STRIPE_PRICE_${key}`]
      || env[`STRIPE_PRICE_${key}`]
      || PRICE_IDS[plan]
      || PRICE_IDS.monthly,
  ).trim();
}

function appOrigin(request, env) {
  return String(env.SPLASHLENS_APP_ORIGIN || new URL(request.url).origin).replace(/\/+$/, '');
}

async function createCheckoutSession(request, env, plan) {
  if (!env.STRIPE_SECRET_KEY) return null;

  const origin = appOrigin(request, env);
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('line_items[0][price]', priceForPlan(env, plan));
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/?checkout=cancelled&plan=${encodeURIComponent(plan)}`);
  params.set('metadata[product]', 'splashlens');
  params.set('metadata[feature]', 'scanner');
  params.set('metadata[plan]', plan === 'yearly' || plan === 'annual' ? 'PartSnap Pro Annual' : 'PartSnap Pro Monthly');
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

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const plan = (url.searchParams.get('plan') || 'monthly').toLowerCase();
  const sessionUrl = await createCheckoutSession(request, env, plan);
  if (sessionUrl) return Response.redirect(sessionUrl, 302);

  const target = LINKS[plan] || LINKS.monthly;
  return Response.redirect(target, 302);
}
