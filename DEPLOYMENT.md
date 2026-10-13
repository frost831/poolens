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

- `SCAN_USAGE_KV`: Cloudflare KV namespace binding. Used for monthly anonymous scan metering.
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

`functions/api/checkout.js` now creates Stripe Checkout Sessions when `STRIPE_SECRET_KEY` is present. The success URL lands on `/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`, verifies the paid session with Stripe, signs a scanner entitlement token, stores the entitlement summary in `SCAN_USAGE_KV`, and sends the customer to SplashLens with the activation token.

If `STRIPE_SECRET_KEY` is missing, `/api/checkout` falls back to the existing Stripe Payment Links so the public CTA does not break, but the customer activation path remains manual and revenue launch is not clean.

Current Stripe catalog IDs for the existing Pro plans:

- Monthly Splash Lens Pro Unlimited ($19/month): `price_1TbAp725fqLun6cVz5lhOiiS`
- Annual Splash Lens Pro Unlimited ($149/year): `price_1TbAp825fqLun6cVoVG0wqQl`

Closing Pro is a separate one-time Price. The app reads `SPLASHLENS_STRIPE_PRICE_CLOSING_PRO_60D` and refuses checkout until that Price is active, USD, `unit_amount` 2900, and not recurring. Do not create the Price from application code. In Stripe live mode, create:

- Product name: SplashLens Closing Pro 60-Day Pass
- Price: $29.00 USD, one time
- Description: 60 days of SplashLens Pro scanner access. One-time payment. Access ends after 60 days and does not renew.

Then set the new Price ID in the Pages environment. The app grants Pro scanner access for 60 days from the charge time and does not start a subscription.

Admin issuance shape:

```powershell
$body = @{ email = "buyer@example.com"; plan = "SplashLens Scanner Pro"; ttlDays = 365 } | ConvertTo-Json -Compress
Invoke-RestMethod -Method POST -Uri "https://app.splashlens.com/api/scan-entitlement" -Headers @{ "X-SplashLens-Admin-Secret" = $env:SPLASHLENS_ENTITLEMENT_ADMIN_SECRET } -ContentType "application/json" -Body $body
```

Store wrapper submissions must use FreeCore mode unless native billing is added.
