# SplashLens Stripe Checkout Fix Packet - 2026-07-12

## Current Safe Production Mode

Production is set to:

```text
SPLASHLENS_CHECKOUT_MODE=payment_link_direct
```

This is intentional right now because the current production `STRIPE_SECRET_KEY` returns `stripe_api_401` when SplashLens tries to create first-party Stripe Checkout Sessions.

## Verified Buyer Path

Both public checkout endpoints work and redirect to live Stripe Payment Links:

```text
https://app.splashlens.com/api/checkout?plan=monthly
-> https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O

https://app.splashlens.com/api/checkout?plan=yearly
-> https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P
```

Response header:

```text
X-Splashlens-Checkout-Mode: payment_link_direct
```

## Not Yet 100% Automatic

Cloudflare currently lists these payment-related secrets:

- `SPLASHLENS_CHECKOUT_MODE`
- `STRIPE_SECRET_KEY`
- `SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID`
- `SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID`

Cloudflare does **not** currently list:

- `STRIPE_WEBHOOK_SECRET`

That means the payment page is live and Payment Link IDs are configured, but automatic webhook fulfillment for Payment Link purchases cannot be considered fully wired until `STRIPE_WEBHOOK_SECRET` is added.

## Current Live Payment Link IDs

These are now set in Cloudflare:

```text
SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID=plink_1TbApG25fqLun6cVhSMjlpXa
SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID=plink_1TbApH25fqLun6cVQE7XvDrT
```

## Stripe Permission Blocker Found

The local Stripe CLI is logged in, but the available live restricted key can read live Payment Links and cannot create live webhook endpoints or live Checkout Sessions.

Stripe returned:

```text
The provided key does not have the required permissions for this endpoint on account acct_1TJ23t25fqLun6cV.
```

So the remaining fix must be done with a Stripe Dashboard user/key that can create webhook endpoints, or by replacing the Cloudflare `STRIPE_SECRET_KEY` with a live key allowed to create Checkout Sessions.

## Best Final State

Use one of these two production-safe paths.

### Option A - Recommended Now: Payment Links + Webhook Fulfillment

Keep:

```text
SPLASHLENS_CHECKOUT_MODE=payment_link_direct
```

Then in Stripe Dashboard:

1. Open Developers -> Webhooks.
2. Add endpoint:

```text
https://app.splashlens.com/api/stripe-webhook
```

3. Select events:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
```

4. Copy the webhook signing secret, beginning with `whsec_`.
5. Add it to Cloudflare Pages:

```powershell
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name poolens
```

6. Payment Link IDs are already set in Cloudflare. If links are recreated, replace:

```powershell
npx wrangler pages secret put SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID --project-name poolens
npx wrangler pages secret put SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID --project-name poolens
```

7. Redeploy:

```powershell
npx wrangler pages deploy . --project-name poolens --branch main --commit-dirty=true
```

### Option B - Later: First-Party Stripe Checkout Sessions

Only use this after the Stripe secret is corrected.

1. Replace `STRIPE_SECRET_KEY` with the correct live restricted or secret key that can create Checkout Sessions.
2. Set:

```powershell
"stripe_checkout" | npx wrangler pages secret put SPLASHLENS_CHECKOUT_MODE --project-name poolens
```

3. Redeploy.
4. Verify:

```text
X-Splashlens-Checkout-Mode: stripe_checkout
Location: https://checkout.stripe.com/...
```

If it returns `stripe_api_401`, switch back to `payment_link_direct`.

## Code Safeties Now In Place

- Payment Link direct mode keeps buyer checkout alive even if the Stripe API key is bad.
- Stripe webhook fulfillment is idempotent by `payment:<stripeSessionId>`.
- Checkout-success is idempotent by `payment:<stripeSessionId>`.
- Successful webhook or checkout-success writes dashboard-compatible `checkout_success` events.
- Native entitlement writes dashboard-compatible `checkout_success` events.
