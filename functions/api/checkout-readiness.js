import {
  splashLensCheckoutPrice,
  splashLensCheckoutPriceData,
  splashLensPaymentLinkUrl,
  splashLensPlans,
} from '../_shared/splashlens-plans.mjs';
import { stripePaymentLinkStatus, stripeWebhookStatus } from '../_shared/stripe-readiness.mjs';

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function stripeSecret(env) {
  let secret = String(env.STRIPE_SECRET_KEY || '').trim();
  if (!secret) return '';
  secret = secret.replace(/^STRIPE_SECRET_KEY\s*=\s*/i, '').replace(/^Bearer\s+/i, '').trim();
  secret = secret.replace(/^['"]|['"]$/g, '').trim();
  return secret;
}

async function stripeAccountStatus(env) {
  const secret = stripeSecret(env);
  if (!secret) return { ok: false, reason: 'missing_secret' };
  const response = await fetch('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) return { ok: false, reason: `stripe_api_${response.status}` };
  const account = await response.json();
  return {
    ok: true,
    reason: 'ok',
    accountId: clean(account.id, 80),
    country: clean(account.country, 8),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
  };
}

export async function onRequestGet({ env }) {
  const [stripe, webhook, paymentLinks] = await Promise.all([
    stripeAccountStatus(env),
    stripeWebhookStatus(env),
    stripePaymentLinkStatus(env),
  ]);
  const checkoutMode = clean(env.SPLASHLENS_CHECKOUT_MODE || '', 80).toLowerCase() || 'stripe_checkout';
  const paymentLinkDirect = ['payment_link_direct', 'payment_links', 'links'].includes(checkoutMode);
  const webhookConfigured = clean(env.STRIPE_WEBHOOK_SECRET || env.SPLASHLENS_STRIPE_WEBHOOK_SECRET, 300).startsWith('whsec_');
  const plans = splashLensPlans().map((plan) => {
    const price = splashLensCheckoutPrice(env, plan);
    const paymentLink = splashLensPaymentLinkUrl(env, plan);
    const inlinePriceData = splashLensCheckoutPriceData(plan);
    const canUseCheckoutSession = stripe.ok && Boolean(price || inlinePriceData);
    const canUsePaymentLink = Boolean(paymentLink);
    return {
      key: plan.key,
      label: plan.displayName,
      publicStatus: plan.publicStatus,
      feature: plan.feature,
      configured: canUsePaymentLink || canUseCheckoutSession,
      checkoutPath: canUsePaymentLink && paymentLinkDirect ? 'payment_link' : canUseCheckoutSession ? 'stripe_checkout' : canUsePaymentLink ? 'payment_link_fallback' : 'not_configured',
      hasPaymentLink: canUsePaymentLink,
      hasStripePrice: Boolean(price),
      hasInlinePriceData: Boolean(inlinePriceData),
      stripeReady: stripe.ok,
    };
  });

  const storageConfigured = Boolean(env.SCAN_USAGE_KV);
  const livePlans = plans.filter((plan) => plan.publicStatus === 'live');
  const productionReady = Boolean(
    stripe.ok
    && stripe.chargesEnabled
    && stripe.payoutsEnabled
    && webhookConfigured
    && webhook.ok
    && paymentLinks.ok
    && storageConfigured
    && livePlans.length
    && livePlans.every((plan) => plan.configured)
  );

  return json(productionReady ? 200 : 503, {
    ok: productionReady,
    observedAt: new Date().toISOString(),
    checkoutMode,
    stripe,
    webhookConfigured,
    webhook,
    paymentLinks,
    storageConfigured,
    allPlansConfigured: plans.every((plan) => plan.configured),
    productionReady,
    plans,
  });
}
