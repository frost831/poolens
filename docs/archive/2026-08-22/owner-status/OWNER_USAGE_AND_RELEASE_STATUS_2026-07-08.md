# SplashLens Owner Usage And Release Status - 2026-07-08

## Usage Notifications

Live app-owner surfaces checked on 2026-07-08:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned direct HTTP `200`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected auth gate for the digest path rather than a public outage.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email configuration remain present on the public readiness probe.
- The owner dashboard now resolves directly with `200`; the earlier `301 -> /dashboard` note from 2026-07-06 is stale.
- The digest path is protected as expected; this check did not validate the private stats secret itself.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-08:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, and `https://splashlens.com/privacy` all returned HTTP `200`.
- `https://app.splashlens.com/sitemap.xml`, `https://app.splashlens.com/ai.txt`, and `https://app.splashlens.com/llms.txt` all returned HTTP `200`.

Current interpretation:

- Public discovery and AEO surfaces stayed healthy on both the site and app hosts.
- `app.splashlens.com/ai.txt` continues to serve a real app-host discovery file.
- The site partner-intake endpoint is currently healthy on direct `GET`; the older `HEAD` mismatch was method-specific drift, not a current functional outage.

## Store Status

Public store surfaces checked live on 2026-07-08:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The Play listing body still exposed markers consistent with package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, and privacy policy `https://splashlens.com/privacy`.
- The live iOS App Store listing returned HTTP `200` at `https://apps.apple.com/us/app/splashlens/id6763644905`.
- The older iOS URL `https://apps.apple.com/us/app/splashlens/id6747138915` returned HTTP `404` and should be treated as stale.

Current interpretation:

- Public Play and App Store evidence still supports the live-listing status.
- The Android public listing package remains `com.splashlens.fieldtools`.
- Current public iOS truth is the `id6763644905` listing, not the older `id6747138915` URL.

## Stripe

Live checkout verification on 2026-07-08:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to `https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P`.

Current interpretation:

- Direct web checkout still routes cleanly to live Stripe Payment Links.
- The verified public truth remains `payment_link_direct`.
