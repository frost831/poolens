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
- `STRIPE_WEBHOOK_SECRET`: required for `/api/stripe-webhook` to verify Stripe Payment Link / Checkout events before issuing scanner activation links.
- `STRIPE_SECRET_KEY`: required only when `SPLASHLENS_CHECKOUT_MODE=stripe_checkout` for first-party Checkout Sessions and `/api/checkout-success`.
- `SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID` and `SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID`: recommended so webhook fulfillment only issues entitlements for the correct SplashLens Payment Links.
- Optional paid-lane price IDs or Payment Links listed below activate the broader Verified Proof Network tiers. If a lane is not configured, `/api/checkout?plan=...` returns a clean `409 checkout_not_configured` instead of sending a buyer into a broken checkout.

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

### Stripe webhook fulfillment

`functions/api/stripe-webhook.js` is the production bridge for Payment Link purchases. Configure this endpoint in Stripe:

```text
https://app.splashlens.com/api/stripe-webhook
```

Listen for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`

Required webhook secret:

```powershell
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name poolens
```

Recommended Payment Link ID variables:

```powershell
npx wrangler pages secret put SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID --project-name poolens
npx wrangler pages secret put SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID --project-name poolens
```

When Stripe sends a recognized paid checkout session, the webhook signs a scanner entitlement, stores it in `SCAN_USAGE_KV`, emails the buyer an activation link via SendGrid, and emails the owner a payment alert. If the Payment Link IDs are not configured, keep `SPLASHLENS_STRIPE_WEBHOOK_ALLOW_UNTAGGED_PAYMENT_LINKS=false` unless the Stripe webhook endpoint is dedicated only to SplashLens Payment Links.

Current Stripe catalog IDs:

- Monthly PartSnap Pro: `price_1TbAp725fqLun6cVz5lhOiiS`
- Annual PartSnap Pro: `price_1TbAp825fqLun6cVoVG0wqQl`

### Verified Proof Network payment lane env vars

These plans are wired in code. Only attach public CTAs after Stripe products, pricing, fulfillment, and support are ready.

| Plan key | Product label | Required to enable Checkout Sessions | Payment Link fallback | Payment Link ID for webhook allow-list |
| --- | --- | --- | --- | --- |
| `partsnap_pro_monthly` | PartSnap Pro Monthly | `SPLASHLENS_STRIPE_PRICE_PARTSNAP_PRO_MONTHLY` or existing monthly price env | `SPLASHLENS_STRIPE_LINK_PARTSNAP_PRO_MONTHLY` or built-in live link | `SPLASHLENS_STRIPE_PAYMENT_LINK_PARTSNAP_PRO_MONTHLY_ID` or `SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID` |
| `partsnap_pro_annual` | PartSnap Pro Annual | `SPLASHLENS_STRIPE_PRICE_PARTSNAP_PRO_ANNUAL` or existing yearly price env | `SPLASHLENS_STRIPE_LINK_PARTSNAP_PRO_ANNUAL` or built-in live link | `SPLASHLENS_STRIPE_PAYMENT_LINK_PARTSNAP_PRO_ANNUAL_ID` or yearly/annual ID |
| `service_proof_pro_monthly` | Service Proof Pro | `SPLASHLENS_STRIPE_PRICE_SERVICE_PROOF_PRO_MONTHLY` | `SPLASHLENS_STRIPE_LINK_SERVICE_PROOF_PRO_MONTHLY` | `SPLASHLENS_STRIPE_PAYMENT_LINK_SERVICE_PROOF_PRO_MONTHLY_ID` |
| `team_proof_os_monthly` | Team Proof OS | `SPLASHLENS_STRIPE_PRICE_TEAM_PROOF_OS_MONTHLY` | `SPLASHLENS_STRIPE_LINK_TEAM_PROOF_OS_MONTHLY` | `SPLASHLENS_STRIPE_PAYMENT_LINK_TEAM_PROOF_OS_MONTHLY_ID` |
| `facility_cpo_pilot_monthly` | Facility / CPO Pilot | `SPLASHLENS_STRIPE_PRICE_FACILITY_CPO_PILOT_MONTHLY` | `SPLASHLENS_STRIPE_LINK_FACILITY_CPO_PILOT_MONTHLY` | `SPLASHLENS_STRIPE_PAYMENT_LINK_FACILITY_CPO_PILOT_MONTHLY_ID` |
| `verified_manufacturer_cards_monthly` | Verified Manufacturer Cards | `SPLASHLENS_STRIPE_PRICE_VERIFIED_MANUFACTURER_CARDS_MONTHLY` | `SPLASHLENS_STRIPE_LINK_VERIFIED_MANUFACTURER_CARDS_MONTHLY` | `SPLASHLENS_STRIPE_PAYMENT_LINK_VERIFIED_MANUFACTURER_CARDS_MONTHLY_ID` |
| `distributor_counter_mode_monthly` | Distributor / Counter Mode | `SPLASHLENS_STRIPE_PRICE_DISTRIBUTOR_COUNTER_MODE_MONTHLY` | `SPLASHLENS_STRIPE_LINK_DISTRIBUTOR_COUNTER_MODE_MONTHLY` | `SPLASHLENS_STRIPE_PAYMENT_LINK_DISTRIBUTOR_COUNTER_MODE_MONTHLY_ID` |
| `training_partner_layer_monthly` | Training Partner Layer | `SPLASHLENS_STRIPE_PRICE_TRAINING_PARTNER_LAYER_MONTHLY` | `SPLASHLENS_STRIPE_LINK_TRAINING_PARTNER_LAYER_MONTHLY` | `SPLASHLENS_STRIPE_PAYMENT_LINK_TRAINING_PARTNER_LAYER_MONTHLY_ID` |

Plan catalog check:

```powershell
curl.exe -s "https://app.splashlens.com/api/checkout?catalog=1"
```

Production payment readiness check:

```powershell
curl.exe -s "https://app.splashlens.com/api/checkout-readiness"
```

This route verifies the Stripe account can charge and pay out, the expected webhook endpoint is enabled with all required events, both configured PartSnap Payment Links are active and match their public URLs, and entitlement storage is bound. It returns `503` whenever the live paid lane is not fully ready.

Admin pilot grant example:

```powershell
$body = @{ email = "pilot@example.com"; planKey = "service_proof_pro_monthly"; ttlDays = 90 } | ConvertTo-Json -Compress
Invoke-RestMethod -Method POST -Uri "https://app.splashlens.com/api/scan-entitlement" -Headers @{ "X-SplashLens-Admin-Secret" = $env:SPLASHLENS_ENTITLEMENT_ADMIN_SECRET } -ContentType "application/json" -Body $body
```

Admin issuance shape:

```powershell
$body = @{ email = "buyer@example.com"; plan = "SplashLens Scanner Pro"; ttlDays = 365 } | ConvertTo-Json -Compress
Invoke-RestMethod -Method POST -Uri "https://app.splashlens.com/api/scan-entitlement" -Headers @{ "X-SplashLens-Admin-Secret" = $env:SPLASHLENS_ENTITLEMENT_ADMIN_SECRET } -ContentType "application/json" -Body $body
```

Store wrapper submissions must use free-core mode unless native billing is added.
