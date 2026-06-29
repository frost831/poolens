# SplashLens Stripe Readiness - 2026-06-29

## Live status

- `https://app.splashlens.com/api/checkout?plan=monthly` returns `302`.
- Redirect target is the live monthly Stripe Payment Link: `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`.
- Response headers show `X-Splashlens-Checkout-Mode: payment_link_fallback`.
- Response headers show `X-Splashlens-Checkout-Fallback: stripe_api_401`.
- Following the redirect lands on Stripe with HTTP `200`.

## What is ready

- The app has production Cloudflare Pages secrets present for `STRIPE_SECRET_KEY`, `SPLASHLENS_ENTITLEMENT_SECRET`, `SPLASHLENS_STATS_SECRET`, `SPLASHLENS_NOTIFY_TO`, SendGrid, and related owner/admin keys.
- The checkout route has live monthly and annual Payment Link fallback URLs.
- The checkout success route can verify a Stripe Checkout Session and issue a scanner entitlement token when Stripe API authentication works.

## What is not ready

- The configured production `STRIPE_SECRET_KEY` is being rejected by Stripe with `401`.
- Because of that, the app cannot currently create first-party Stripe Checkout Sessions.
- A Payment Link purchase can still happen, but the automatic checkout-session entitlement flow will not activate from Payment Link fallback purchases unless separately handled.

## Required fix

Replace the Cloudflare Pages production `STRIPE_SECRET_KEY` with the correct live Stripe secret key for the account that owns:

- monthly price `price_1TbAp725fqLun6cVz5lhOiiS`
- annual price `price_1TbAp825fqLun6cVoVG0wqQl`
- monthly payment link `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`
- annual payment link `https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P`

Do not paste or commit the key into the repo. Use Wrangler secret storage:

```powershell
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name poolens
```

After updating the secret, redeploy or allow Cloudflare Pages to refresh the function environment, then smoke test:

```powershell
curl.exe -s -D - -o NUL "https://app.splashlens.com/api/checkout?plan=monthly"
```

Expected fixed result:

- `HTTP/1.1 302`
- `X-Splashlens-Checkout-Mode: stripe_checkout`
- `Location:` begins with `https://checkout.stripe.com/`

