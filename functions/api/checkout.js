import {
  resolveSplashLensPlan,
  splashLensCheckoutPrice,
  splashLensCheckoutPriceData,
  splashLensPaymentLinkUrl,
  splashLensPlanPublicPayload,
} from '../_shared/splashlens-plans.mjs';

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
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
  const price = splashLensCheckoutPrice(env, plan);
  const priceData = splashLensCheckoutPriceData(plan);
  if (!price && !priceData) return { url: null, reason: 'missing_price' };

  const origin = appOrigin(request, env);
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  if (price) {
    params.set('line_items[0][price]', price);
  } else {
    params.set('line_items[0][price_data][currency]', priceData.currency);
    params.set('line_items[0][price_data][unit_amount]', String(priceData.unitAmount));
    params.set('line_items[0][price_data][recurring][interval]', priceData.interval);
    params.set('line_items[0][price_data][product_data][name]', `SplashLens ${priceData.productName}`);
    params.set('line_items[0][price_data][product_data][metadata][product]', 'splashlens');
    params.set('line_items[0][price_data][product_data][metadata][feature]', plan.feature);
    params.set('line_items[0][price_data][product_data][metadata][plan_key]', plan.key);
  }
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/?checkout=cancelled&plan=${encodeURIComponent(plan.key)}`);
  params.set('metadata[product]', 'splashlens');
  params.set('metadata[feature]', plan.feature);
  params.set('metadata[plan]', plan.displayName);
  params.set('metadata[plan_key]', plan.key);
  params.set('metadata[scopes]', plan.scopes.join(','));
  params.set('subscription_data[metadata][product]', 'splashlens');
  params.set('subscription_data[metadata][feature]', plan.feature);
  params.set('subscription_data[metadata][plan]', params.get('metadata[plan]'));
  params.set('subscription_data[metadata][plan_key]', plan.key);
  params.set('subscription_data[metadata][scopes]', params.get('metadata[scopes]'));
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
  if (url.searchParams.get('catalog') === '1') {
    return json(200, { ok: true, plans: splashLensPlanPublicPayload(env) });
  }

  const plan = resolveSplashLensPlan(url.searchParams.get('plan') || 'monthly');

  const paymentLink = splashLensPaymentLinkUrl(env, plan);
  if (!useStripeCheckout(env) && paymentLink) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: paymentLink,
        'X-SplashLens-Checkout-Mode': 'payment_link_direct',
      },
    });
  }

  if (useStripeCheckout(env) || !paymentLink) {
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

    const target = paymentLink;
    if (!target) {
      return json(409, {
        ok: false,
        error: 'checkout_not_configured',
        plan: plan.key,
        label: plan.displayName,
        message: 'This SplashLens paid lane is configured in the app, but the Stripe price or payment link is not set yet.',
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        'X-SplashLens-Checkout-Mode': 'payment_link_fallback',
        'X-SplashLens-Checkout-Fallback': session.reason || 'unknown',
      },
    });
  }

  const target = paymentLink;
  if (!target) {
    return json(409, {
      ok: false,
      error: 'checkout_not_configured',
      plan: plan.key,
      label: plan.displayName,
      message: 'This SplashLens paid lane is configured in the app, but the Stripe Payment Link is not set yet.',
    });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'X-SplashLens-Checkout-Mode': 'payment_link_direct',
    },
  });
}
