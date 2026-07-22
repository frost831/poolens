# SplashLens Owner Usage And Release Status - 2026-07-22

## Usage Notifications

Live owner-surface checks on 2026-07-22:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected digest gate rather than a public outage.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned direct HTTP `200` in this pass.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email readiness remain present on the public probe.
- The digest route remains protected as expected; this did not verify private digest credentials or private owner data.
- The owner dashboard is now directly reachable again; the older `301 -> /dashboard` note is stale for this pass.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-22:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- The live homepage body still exposed `230+` language, with no visible `180+` fallback and no visible `500+` claim found in this pass.
- `https://splashlens.com/privacy`, `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, and `https://splashlens.com/category-hub-sitemap.xml` all returned HTTP `200`.
- `https://app.splashlens.com/ai.txt`, `https://app.splashlens.com/llms.txt`, and `https://app.splashlens.com/robots.txt` all returned HTTP `200`.

Current interpretation:

- Public site, intake, and AEO/discovery surfaces stayed healthy on both hosts.
- Partner intake remains live with both storage and email configuration present.
- The discovery files continue to serve crawlable public content.

## Store Status

Public store surfaces checked live on 2026-07-22:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The fetched Play listing body still exposed markers consistent with title `SplashLens Field Tools`, package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- Apple public lookup for `https://apps.apple.com/us/app/splashlens/id6763644905` now reports the live `SplashLens` listing with bundle `com.splashlens.app`, version `1.0.7`, and `currentVersionReleaseDate` `2026-07-21T05:14:21Z`.
- Repo-local Android wrapper is still ahead of the public Play listing: `android-twa/app/build.gradle` now declares `applicationId "com.splashlens.fieldtools"`, `versionCode 8`, and `versionName "1.0.7"`.

Current interpretation:

- Public Play and App Store evidence still supports live-listing status.
- Public Android truth remains the `1.0.5` release even though the local wrapper has advanced to `1.0.7`.
- Public iOS truth has moved forward to `1.0.7`.

## Stripe

Live checkout verification on 2026-07-22:

- `https://app.splashlens.com/api/checkout?plan=monthly` still routes through the live Stripe Checkout flow in `payment_link_direct` mode.
- `https://app.splashlens.com/api/checkout?plan=yearly` still routes through the live Stripe Checkout flow in `payment_link_direct` mode.
- `https://app.splashlens.com/api/checkout-readiness` returned `{"ok":true,...}` with `checkoutMode="payment_link_direct"`, `stripe.ok=true`, `webhookConfigured=true`, `storageConfigured=true`, `allPlansConfigured=true`, and plan readiness across the current paid-lane catalog.

Current interpretation:

- Direct web checkout still routes through the live Stripe Payment Link path for the public PartSnap plans.
- Stripe authentication, webhook configuration, and storage now look healthy on the readiness probe, which is materially better than the older `stripe_api_401` state.
- The verified public checkout mode remains `payment_link_direct`; the readiness probe does not mean the public route has been switched away from payment links.

## Growth Gate

Outreach state checked on 2026-07-22:

- Gmail searches since the previous automation timestamp `2026-07-21T14:16:59.871Z` found five valid July 21 cold sends after that prior run, then no new SplashLens unsubscribe/remove request, complaint, bounce, delivery-failure message, or reply from those five recipients before the July 22 send decision.
- The broad stop-signal search did surface an unrelated Golf Tourism South Africa DSN plus unrelated canary/runtime mail, which were excluded from SplashLens queue decisions.
- Same-day Gmail search showed `0` SplashLens cold emails on Wednesday, July 22, 2026 before the new batch.
- The stale same-day lock created by an interrupted local check was released, then the checked-in `tools/splashlens_outreach_day_lock.ps1 -Date 2026-07-22` guard returned `PASS`.
- A fresh exact-recipient history check stayed empty for the five selected July 22 addresses.
- Five one-to-one plain-text SplashLens emails were then sent on 2026-07-22:
  - Spa Parts Plus, `customercare@spaparts.com`, sent id `19f8a9747f082a0f`
  - Solaxx, `support@solaxx.com`, sent id `19f8a974b1e6f7ff`
  - Harwil Corporation, `orders@harwil.com`, sent id `19f8a974dd736f8e`
  - HASA Ask Terry, `askterry@hasapool.com`, sent id `19f8a97525bf3b49`
  - Periodic Products, `info@periodicproducts.com`, sent id `19f8a97563e8349e`

Current interpretation:

- Cold outreach is no longer blocked by the old July 13 bounce window or the stale same-day lock.
- The July 22 batch stayed within the 5-email daily cap and followed the one-to-one plain-text boundary.
- Warm editorial threads remain active separately and did not need fresh same-day mail to keep momentum.
