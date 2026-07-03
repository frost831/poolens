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

function stripeSecret(env) {
  let secret = String(env.STRIPE_SECRET_KEY || '').trim();
  if (!secret) return '';
  secret = secret.replace(/^STRIPE_SECRET_KEY\s*=\s*/i, '').replace(/^Bearer\s+/i, '').trim();
  secret = secret.replace(/^['"]|['"]$/g, '').trim();
  return secret;
}

async function createCheckoutSession(request, env, plan) {
  const secret = stripeSecret(env);
  if (!secret) return { url: null, reason: 'missing_secret' };

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
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('SplashLens checkout session creation failed', response.status, body);
    return { url: null, reason: `stripe_api_${response.status}` };
  }

  const session = await response.json();
  return { url: session?.url || null, reason: session?.url ? 'ok' : 'missing_session_url' };
}

function useStripeCheckout(env) {
  const mode = String(env.SPLASHLENS_CHECKOUT_MODE || '').trim().toLowerCase();
  if (['payment_link_direct', 'payment_links', 'links'].includes(mode)) return false;
  return true;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const plan = (url.searchParams.get('plan') || 'monthly').toLowerCase();

  if (useStripeCheckout(env)) {
    const session = await createCheckoutSession(request, env, plan);
    if (session.url) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: session.url,
          'X-SplashLens-Checkout-Mode': 'stripe_checkout',
        },
      });
    }

    const target = LINKS[plan] || LINKS.monthly;
    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        'X-SplashLens-Checkout-Mode': 'payment_link_fallback',
        'X-SplashLens-Checkout-Fallback': session.reason || 'unknown',
      },
    });
  }

  const target = LINKS[plan] || LINKS.monthly;
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'X-SplashLens-Checkout-Mode': 'payment_link_direct',
    },
  });
}
