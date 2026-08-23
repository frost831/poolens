# SplashLens Owner Usage And Release Status - 2026-07-06

## Usage Notifications

Live app-owner surfaces checked on 2026-07-06:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned `301 -> /dashboard`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended auth gate for the digest path rather than a public outage.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email configuration remain present on the public readiness probe.
- The digest path is protected as expected; this check did not validate the private stats secret itself.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-06:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on `GET`.
- `https://splashlens.com/api/partner-intake` returned HTTP `404` on `HEAD`, so the endpoint is functionally live but currently has a method-specific regression.
- `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, `https://splashlens.com/ai.txt`, and `https://splashlens.com/llms.txt` all returned HTTP `200`.
- `https://app.splashlens.com/robots.txt`, `https://app.splashlens.com/sitemap.xml`, `https://app.splashlens.com/ai.txt`, and `https://app.splashlens.com/llms.txt` all returned HTTP `200`.

Current interpretation:

- Public discovery surfaces stayed healthy on both the site and app hosts.
- `app.splashlens.com/ai.txt` continues to serve a real plain-text AI-discovery file.
- The only new public drift found in this pass was the `HEAD` mismatch on the partner-intake endpoint.

## Store Status

Public store surfaces checked live on 2026-07-06:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The Play listing body still exposed live markers consistent with package `com.splashlens.fieldtools` and privacy policy `https://splashlens.com/privacy`.
- The iOS App Store listing returned HTTP `200` at `https://apps.apple.com/us/app/splashlens/id6763644905`.

Current interpretation:

- Public Play and App Store evidence still supports the live-listing status.
- The Android public listing package remains `com.splashlens.fieldtools`.

## Stripe

Live checkout verification on 2026-07-06:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to the live monthly Stripe Payment Link.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to the live yearly Stripe Payment Link.

Current interpretation:

- Direct web checkout still routes cleanly to live Stripe Payment Links.
- The verified public truth remains `payment_link_direct`, not the older `stripe_api_401` fallback state.
