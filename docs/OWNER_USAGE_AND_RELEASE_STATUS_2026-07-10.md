# SplashLens Owner Usage And Release Status - 2026-07-10

## Usage Notifications

Live app-owner surfaces checked on 2026-07-10:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected auth gate for the digest path rather than a public outage.
- Public app shell at `https://app.splashlens.com` returned HTTP `200`.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email configuration remain present on the public readiness probe.
- The digest path remains protected as expected; this check did not validate the private stats secret itself.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-10:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- The live homepage still exposes supported `230+ current field troubleshooting entries` language in the fetched body, with no visible `500+` claim found in this pass.
- `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, and `https://splashlens.com/privacy` all returned HTTP `200`.
- `https://app.splashlens.com/ai.txt`, `https://app.splashlens.com/llms.txt`, and `https://app.splashlens.com/robots.txt` all returned HTTP `200`.

Current interpretation:

- Public site, intake, and AEO/discovery surfaces stayed healthy on both hosts.
- Partner-intake remains healthy on direct `GET` with both storage and email configuration present.
- The site/app discovery files continue to serve real crawlable content rather than empty placeholders.

## Store Status

Public store surfaces checked live on 2026-07-10:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The Play listing body still exposed markers consistent with package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, `SoftwareApplication`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- The live iOS App Store listing returned HTTP `200` at `https://apps.apple.com/us/app/splashlens/id6763644905`.

Current interpretation:

- Public Play and App Store evidence still supports the live-listing status.
- The Android public listing package remains `com.splashlens.fieldtools`.
- Current public iOS truth remains the `id6763644905` listing.

## Stripe

Live checkout verification on 2026-07-10:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to `https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P`.
- Following both redirects landed on live Stripe Checkout pages with HTTP `200`.

Current interpretation:

- Direct web checkout still routes cleanly to live Stripe Payment Links.
- The verified public truth remains `payment_link_direct`.
