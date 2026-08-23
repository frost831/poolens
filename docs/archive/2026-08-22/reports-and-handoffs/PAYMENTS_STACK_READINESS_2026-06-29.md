# SplashLens Payments Stack Readiness - 2026-06-29

## Current live web checkout

- Monthly checkout: `https://app.splashlens.com/api/checkout?plan=monthly`
- Yearly checkout: `https://app.splashlens.com/api/checkout?plan=yearly`
- Both return `X-Splashlens-Checkout-Mode: payment_link_direct`.
- Both redirect to live Stripe Payment Links.

This keeps the revenue path open while first-party Stripe Checkout Sessions stay disabled.

## Payment Link fulfillment

Live endpoint:

```text
https://app.splashlens.com/api/stripe-webhook
```

The endpoint is deployed and returns a ready status on `GET`. Unsigned `POST` requests return `400`, which confirms it is not accepting fake payment events.

To activate automatic fulfillment:

1. In Stripe, create a webhook endpoint for `https://app.splashlens.com/api/stripe-webhook`.
2. Select events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
3. Copy the Stripe endpoint signing secret.
4. Add it to Cloudflare Pages:

```powershell
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name poolens
```

5. Add the exact Payment Link IDs from Stripe:

```powershell
npx wrangler pages secret put SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID --project-name poolens
npx wrangler pages secret put SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID --project-name poolens
```

When those values are set, a recognized paid Checkout Session will:

- issue a signed scanner entitlement,
- store it in `SCAN_USAGE_KV`,
- email the buyer an activation link through SendGrid,
- email the owner a payment alert.

## First-party Stripe Checkout

First-party Checkout Sessions are still disabled by default because the production `STRIPE_SECRET_KEY` previously returned `stripe_api_401`.

Only enable this after the key is verified against the live SplashLens prices:

```powershell
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name poolens
npx wrangler pages secret put SPLASHLENS_CHECKOUT_MODE --project-name poolens
```

Set `SPLASHLENS_CHECKOUT_MODE` to:

```text
stripe_checkout
```

Expected green test:

```powershell
curl.exe -s -D - -o NUL "https://app.splashlens.com/api/checkout?plan=monthly"
```

The response should show:

```text
X-SplashLens-Checkout-Mode: stripe_checkout
Location: https://checkout.stripe.com/...
```

## iOS and Google Play

No native binary update is required for the current web Payment Link fix.

Current wrappers:

- iOS opens `https://app.splashlens.com/?store=ios`.
- Google Play TWA opens `https://app.splashlens.com/?store=android`.
- Store shell mode hides direct Stripe upgrade CTAs and keeps the submitted app free-core.

If SplashLens sells digital scanner access inside the native apps, then we need a native update:

- iOS: add StoreKit subscriptions / in-app purchase and App Store Connect products.
- Android: add Google Play Billing products and purchase verification.
- Server: map Apple/Google receipt validation to the same signed SplashLens entitlement model.

Until then, web checkout can sell PartSnap Pro outside the store-shell experience, and native store builds should remain free-core.
