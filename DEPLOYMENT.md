# SplashLens App Deployment

This repo is the PoolLens source tree for the SplashLens field app.

## Cloudflare Pages

- Project: `poolens`
- Production domain: `https://app.splashlens.com`
- Fallback domain: `https://poolens.pages.dev`
- Deploy command from repo root: `npx wrangler pages deploy . --project-name poolens --commit-dirty=true`

## Required secrets

- `ANTHROPIC_API_KEY`: required for `/api/scan`. Production fails closed when this is missing.
- `ENVIRONMENT=production`: recommended production variable.
- `SPLASHLENS_ENTITLEMENT_SECRET`: required to verify signed scanner entitlement tokens.
- `SPLASHLENS_ENTITLEMENT_ADMIN_SECRET`: required for `/api/scan-entitlement` admin issuance.
- `STRIPE_SECRET_KEY`: required for `/api/checkout` to create Stripe Checkout Sessions and for `/api/checkout-success` to verify paid sessions before issuing scanner activation links.

## Required production metering

Do not run production scanner traffic with only browser localStorage limits.

- `SCAN_USAGE_KV`: Cloudflare KV namespace binding. Used for monthly anonymous scan metering, anonymous app events, and PartSnap mystery-part feedback when configured.
- `SCAN_RATE_LIMITER`: Cloudflare Rate Limiting binding. Used for short-window abuse protection.

If neither `SCAN_USAGE_KV` nor `SCAN_RATE_LIMITER` is configured in production, `/api/scan` returns `503 Scan metering is not configured`.

Recommended first pass:

- KV monthly limit: 10 scans per anonymous client key.
- Rate limiter: small burst window, for example 20 requests per 60 seconds per client key.

## Allowed origins for `/api/scan`

- `https://app.splashlens.com`
- `https://splashlens.com`
- `https://www.splashlens.com`
- `https://poolens.pages.dev`
- Localhost origins are allowed only outside production.

## Image limits

- Accepted image payloads: base64 JPEG, PNG, or WebP.
- Max decoded image size: 5 MB.
- Oversized requests return `413` before calling Anthropic.

## Stripe

`functions/api/checkout.js` now sends public web checkout directly to the live Stripe Payment Links by default. This keeps the revenue path live while the first-party Stripe API key is corrected.

Set `SPLASHLENS_CHECKOUT_MODE=stripe_checkout` only after the production `STRIPE_SECRET_KEY` has been verified against the live SplashLens prices. In that mode, the route creates Stripe Checkout Sessions, sends the success URL to `/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`, verifies the paid session with Stripe, signs a scanner entitlement token, stores the entitlement summary in `SCAN_USAGE_KV`, and sends the customer to SplashLens with the activation token.

## PartSnap feedback

`functions/api/partsnap-feedback.js` accepts low-confidence mystery-part submissions from the app. It stores the submission in `SCAN_USAGE_KV` with a `partsnap-feedback:` prefix and sends an alert through SendGrid when `SENDGRID_API_KEY` plus `SPLASHLENS_NOTIFY_TO` or another notify env is configured.

This endpoint is for product learning and support follow-up. It does not confirm part fitment or manufacturer endorsement.

If `SPLASHLENS_CHECKOUT_MODE` is not `stripe_checkout`, `/api/checkout` uses the existing Stripe Payment Links intentionally and returns `X-SplashLens-Checkout-Mode: payment_link_direct`. The customer activation path remains manual/payment-link-based until the first-party Checkout Session key is corrected.

Current Stripe catalog IDs:

- Monthly PartSnap Pro: `price_1TbAp725fqLun6cVz5lhOiiS`
- Annual PartSnap Pro: `price_1TbAp825fqLun6cVoVG0wqQl`

Admin issuance shape:

```powershell
$body = @{ email = "buyer@example.com"; plan = "SplashLens Scanner Pro"; ttlDays = 365 } | ConvertTo-Json -Compress
Invoke-RestMethod -Method POST -Uri "https://app.splashlens.com/api/scan-entitlement" -Headers @{ "X-SplashLens-Admin-Secret" = $env:SPLASHLENS_ENTITLEMENT_ADMIN_SECRET } -ContentType "application/json" -Body $body
```

Store wrapper submissions must use free-core mode unless native billing is added.
