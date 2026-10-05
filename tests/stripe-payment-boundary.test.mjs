import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';

const checkout = fs.readFileSync(new URL('../functions/api/checkout.js', import.meta.url), 'utf8');
const webhook = fs.readFileSync(new URL('../functions/api/stripe-webhook.js', import.meta.url), 'utf8');
const restore = fs.readFileSync(new URL('../functions/api/restore-entitlement.js', import.meta.url), 'utf8');
const scan = fs.readFileSync(new URL('../functions/api/scan.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

test('checkout creates subscription sessions before falling back to payment links', () => {
  assert.match(checkout, /mode', 'subscription'/);
  assert.match(checkout, /checkout\/sessions/);
  assert.match(checkout, /success_url/);
  assert.match(checkout, /api\/checkout-success\?session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.match(checkout, /SPLASHLENS_PAID_CHECKOUT_ENABLED/);
  assert.match(checkout, /paid checkout is temporarily unavailable/i);
  assert.match(checkout, /priceLabel: '\$19\/month'/);
  assert.match(checkout, /priceLabel: '\$149\/year'/);
  assert.doesNotMatch(checkout, /\$29\/month|\$249\/year/);
  assert.match(checkout, /amount: 1900/);
  assert.match(checkout, /amount: 14900/);
  assert.match(checkout, /price_data\]\[unit_amount\]/);
  assert.doesNotMatch(checkout, /price_1TbAp725fqLun6cVz5lhOiiS|price_1TbAp825fqLun6cVoVG0wqQl/);
  assert.doesNotMatch(checkout, /buy\.stripe\.com\/7sY7sE2aIaq31cE5EF8AE0O|buy\.stripe\.com\/aFa28k9Da69NdZq3wx8AE0P/);
});

test('Stripe webhook endpoint verifies signed checkout completion before storing entitlement', () => {
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(webhook, /checkout\.session\.async_payment_succeeded/);
  assert.match(webhook, /customer\.created/);
  assert.match(webhook, /verifyStripeSignature/);
  assert.match(webhook, /stripe-signature/);
  assert.match(webhook, /SCAN_USAGE_KV\.put\(`entitlement:\$\{subject\}`/);
  assert.match(webhook, /payment_events/);
  assert.match(webhook, /isSplashLensCheckoutSession/);
  assert.match(webhook, /non_splashlens_checkout_session/);
  assert.match(webhook, /SPLASHLENS_STRIPE_PAYMENT_LINK_IDS/);
  assert.match(webhook, /export async function onRequestGet/);
  assert.match(webhook, /Stripe webhooks must be sent as signed POST requests/);
  assert.match(webhook, /stripe_webhook_events/);
  assert.match(webhook, /duplicate:\s*true/);
  assert.match(webhook, /non_splashlens_lifecycle/);
  assert.match(webhook, /entitlement_revoked:/);
  assert.match(webhook, /invoice\.paid'\) return 'active'/);
  assert.match(webhook, /SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID/);
  assert.match(webhook, /SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID/);
  assert.match(webhook, /signatures\.some/);
  assert.match(webhook, /lifecycleReference/);
});

test('checkout success refuses non-SplashLens Stripe sessions before issuing scanner access', () => {
  assert.match(checkout, /metadata\[product\]', 'splashlens'/);
  assert.match(checkout, /metadata\[feature\]', 'scanner'/);
  assert.match(fs.readFileSync(new URL('../functions/api/checkout-success.js', import.meta.url), 'utf8'), /This checkout session is not a Splash Lens Pro Unlimited purchase/);
  assert.doesNotMatch(fs.readFileSync(new URL('../functions/api/checkout-success.js', import.meta.url), 'utf8'), /session\.status === 'complete'/);
  assert.match(fs.readFileSync(new URL('../functions/api/checkout-success.js', import.meta.url), 'utf8'), /checkout\.success\.recovered/);
});

test('paid restore endpoint exists for the app restore button', () => {
  assert.match(app, /const PARTSNAP_RESTORE_ENDPOINT = '\/api\/restore-entitlement'/);
  assert.match(restore, /export async function onRequestPost/);
  assert.match(restore, /SCAN_USAGE_KV\.get\(`entitlement:\$\{email\}`/);
  assert.match(restore, /SUBSCRIBERS_DB/);
  assert.match(restore, /commercial_entitlements/);
  assert.match(restore, /No paid SplashLens entitlement was found/);
  assert.match(restore, /scan_token/);
  assert.match(restore, /x-splashlens-account-token/);
  assert.match(restore, /checkout email must match the verified SplashLens account/i);
  assert.doesNotMatch(app, /restorePaidScanEntitlement\(\)/);
  assert.doesNotMatch(app, /prompt\('Enter the email used at SplashLens checkout/);
  assert.match(app, /localStorage\.setItem\(SCAN_ENTITLEMENT_TOKEN_KEY, payload\.token\)/);
});

test('paid scanner checks server entitlement status and lifecycle revocation', () => {
  assert.match(scan, /entitlement_revoked:/);
  assert.match(scan, /commercial_entitlements/);
  assert.match(scan, /\['active', 'trialing', 'pilot'\]/);
  assert.match(scan, /Paid scanner access could not be confirmed/);
});

function accountToken(email, secret) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: email, scopes: ['account', 'free_scan'], iat: now, exp: now + 600 })).toString('base64url');
  const signed = `sl_account_v1.${payload}`;
  const signature = createHmac('sha256', secret).update(signed).digest('base64url');
  return `${signed}.${signature}`;
}

test('restore requires a verified matching account and returns a signed entitlement token', async () => {
  const { onRequestPost } = await import(`../functions/api/restore-entitlement.js?test=${Date.now()}`);
  const secret = 'restore-test-secret-that-is-long-enough-12345';
  const email = 'paid-tech@example.com';
  const writes = [];
  const env = {
    SPLASHLENS_ENTITLEMENT_SECRET: secret,
    SCAN_USAGE_KV: {
      async get(key) {
        if (key === `entitlement:${email}`) return JSON.stringify({ subject: email, plan: 'Splash Lens Pro Unlimited Monthly', scopes: ['scan'], source: 'stripe_webhook', expiresAt: new Date(Date.now() + 60_000).toISOString() });
        return null;
      },
      async put(key, value) { writes.push({ key, value }); },
      async delete(key) { writes.push({ deleted: key }); },
    },
  };

  const missing = await onRequestPost({
    request: new Request('https://app.splashlens.com/api/restore-entitlement', { method: 'POST', body: JSON.stringify({ email }) }),
    env,
  });
  assert.equal(missing.status, 401);

  const mismatch = await onRequestPost({
    request: new Request('https://app.splashlens.com/api/restore-entitlement', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken('other@example.com', secret) },
      body: JSON.stringify({ email }),
    }),
    env,
  });
  assert.equal(mismatch.status, 403);

  const restored = await onRequestPost({
    request: new Request('https://app.splashlens.com/api/restore-entitlement', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-splashlens-account-token': accountToken(email, secret) },
      body: JSON.stringify({ email }),
    }),
    env,
  });
  assert.equal(restored.status, 200);
  const payload = await restored.json();
  assert.equal(payload.ok, true);
  assert.match(payload.token, /^sl_scan_v1\./);
  assert.equal(writes.some((entry) => entry.key === `entitlement:${email}`), true);
  assert.equal(JSON.parse(writes.find((entry) => entry.key === `entitlement:${email}`).value).source, 'stripe_webhook');
});
