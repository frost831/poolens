import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const checkout = fs.readFileSync(new URL('../functions/api/checkout.js', import.meta.url), 'utf8');
const webhook = fs.readFileSync(new URL('../functions/api/stripe-webhook.js', import.meta.url), 'utf8');
const restore = fs.readFileSync(new URL('../functions/api/restore-entitlement.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

test('checkout creates subscription sessions before falling back to payment links', () => {
  assert.match(checkout, /mode', 'subscription'/);
  assert.match(checkout, /checkout\/sessions/);
  assert.match(checkout, /success_url/);
  assert.match(checkout, /api\/checkout-success\?session_id=\{CHECKOUT_SESSION_ID\}/);
});

test('Stripe webhook endpoint verifies signed checkout completion before storing entitlement', () => {
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(webhook, /checkout\.session\.async_payment_succeeded/);
  assert.match(webhook, /verifyStripeSignature/);
  assert.match(webhook, /stripe-signature/);
  assert.match(webhook, /SCAN_USAGE_KV\.put\(`entitlement:\$\{subject\}`/);
  assert.match(webhook, /payment_events/);
  assert.match(webhook, /isSplashLensCheckoutSession/);
  assert.match(webhook, /non_splashlens_checkout_session/);
  assert.match(webhook, /SPLASHLENS_STRIPE_PAYMENT_LINK_IDS/);
  assert.match(webhook, /export async function onRequestGet/);
  assert.match(webhook, /Stripe webhooks must be sent as signed POST requests/);
});

test('checkout success refuses non-SplashLens Stripe sessions before issuing scanner access', () => {
  assert.match(checkout, /metadata\[product\]', 'splashlens'/);
  assert.match(checkout, /metadata\[feature\]', 'scanner'/);
  assert.match(fs.readFileSync(new URL('../functions/api/checkout-success.js', import.meta.url), 'utf8'), /This checkout session is not a SplashLens Pro purchase/);
});

test('paid restore endpoint exists for the app restore button', () => {
  assert.match(app, /const PARTSNAP_RESTORE_ENDPOINT = '\/api\/restore-entitlement'/);
  assert.match(restore, /export async function onRequestPost/);
  assert.match(restore, /SCAN_USAGE_KV\.get\(`entitlement:\$\{email\}`/);
  assert.match(restore, /No paid SplashLens entitlement was found/);
  assert.match(restore, /scan_token/);
});
