# SplashLens Owner Usage And Release Status - 2026-07-08

## Usage Notifications

Live app-owner surfaces checked on 2026-07-08:

- `https://app.splashlens.com/api/events` returned direct `GET 200` with `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned direct HTTP `200`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected auth gate for the owner digest.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email configuration remain present on the public readiness probe.
- The owner-dashboard route now answers directly with `200`; it no longer matched the earlier `301 -> /dashboard` behavior captured on 2026-07-06.
- The digest path is still protected as expected; this check did not validate the private stats secret itself.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-08:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned direct `GET 200` with `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}`.
- `https://splashlens.com/robots.txt`, `https://app.splashlens.com/robots.txt`, `https://splashlens.com/ai.txt`, `https://app.splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, `https://app.splashlens.com/llms.txt`, `https://splashlens.com/sitemap.xml`, `https://app.splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, and `https://splashlens.com/category-hub-sitemap.xml` all returned HTTP `200`.
- `https://splashlens.com/privacy` returned HTTP `200`.

Current interpretation:

- Public discovery surfaces stayed healthy on both the site and app hosts.
- `app.splashlens.com/ai.txt` continues to serve a real plain-text AI-discovery file.
- The earlier partner-intake `404` concern does not reproduce on the direct GET path used in this run; the endpoint currently looks live.

## Store Status

Public store surfaces checked live on 2026-07-08:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The Play listing body still exposed markers consistent with package `com.splashlens.fieldtools`, version `1.0.5`, `InStock`, and privacy policy `https://splashlens.com/privacy`.
- The iOS App Store listing returned HTTP `200` at `https://apps.apple.com/us/app/splashlens/id6763644905`.

Current interpretation:

- Public Play and App Store evidence still supports the live-listing status.
- The Android public listing package remains `com.splashlens.fieldtools`.
- Public Play evidence still aligns to the older live release `1.0.5`, not the newer repo-side wrapper drift.

## Stripe

Live checkout verification on 2026-07-08:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to the live monthly Stripe Payment Link `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to the live yearly Stripe Payment Link `https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P`.

Current interpretation:

- Direct web checkout still routes cleanly to live Stripe Payment Links.
- The verified public truth remains `payment_link_direct`, not the older first-party Checkout Session path.
