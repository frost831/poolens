# SplashLens Owner Usage And Release Status - 2026-07-16

## Usage Notifications

Live owner-surface checks on 2026-07-16:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected digest gate rather than a public outage.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` still resolved through `301 -> /dashboard`.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email readiness remain present on the public probe.
- The digest route remains protected as expected; this did not verify private digest credentials or private owner data.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-16:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- The live homepage body still exposed supported `230+` language, with no visible `500+` claim found in this pass.
- `https://splashlens.com/robots.txt`, `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, and `https://splashlens.com/privacy` all returned HTTP `200`.
- `https://app.splashlens.com/robots.txt`, `https://app.splashlens.com/ai.txt`, and `https://app.splashlens.com/llms.txt` all returned HTTP `200`.

Current interpretation:

- Public site, partner intake, and AEO/discovery surfaces stayed healthy on both hosts.
- Partner-intake remains live with both storage and email configuration present.
- The discovery files continue to serve crawlable public content.

## Store Status

Public store surfaces checked live on 2026-07-16:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The fetched Play listing body still exposed markers consistent with package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, `SoftwareApplication`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- Apple public lookup for `https://apps.apple.com/us/app/splashlens/id6763644905` returned the live `SplashLens` listing with bundle `com.splashlens.app`, version `1.0.6`, and `currentVersionReleaseDate` `2026-07-16T05:09:22Z`.
- The public App Store page at `https://apps.apple.com/us/app/splashlens/id6763644905` returned HTTP `200`.
- Repo-local Android wrapper drift still remains ahead of the public Play listing: [`android-twa/app/build.gradle`](C:\Users\sales\Dropbox\Projects\poolens\android-twa\app\build.gradle) declares `applicationId "com.splashlens.fieldtools"`, `versionCode 7`, and `versionName "1.0.6"`.

Current interpretation:

- Public Play and App Store evidence still supports live-listing status.
- Public iOS truth advanced today to `1.0.6`, which closes yesterday's public App Store lag.
- Public Android truth remains the `1.0.5` Play release even though the local wrapper has advanced to `1.0.6`.

## Stripe

Live checkout verification on 2026-07-16:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned direct `GET 302` with `X-SplashLens-Checkout-Mode: payment_link_direct`, and the full follow landed on the live Stripe Checkout page at `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O` with final HTTP `200`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned direct `GET 302` with `X-SplashLens-Checkout-Mode: payment_link_direct`, and the full follow landed on the live Stripe Checkout page at `https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P` with final HTTP `200`.

Current interpretation:

- Direct web checkout still routes through the live Stripe Payment Link path.
- The verified public checkout mode remains `payment_link_direct`.

## Growth Gate

Outreach state checked on 2026-07-16:

- Gmail targeted stop-signal searches since the prior completed run found no new SplashLens unsubscribe/remove request, complaint, bounce, or delivery-failure message.
- No new reply arrived from the five 2026-07-15 cold-send recipients.
- The only new SplashLens mail activity since the previous run was on the warm AQUA Magazine thread: Jared Fish's 2026-07-15 inbound remained open, and Joshua sent a warm follow-up to Laura Carew on 2026-07-16 after completing the product submission.
- Same-day Gmail sent-mail search returned no SplashLens cold emails on 2026-07-16.
- The checked-in `tools/splashlens_outreach_day_lock.ps1` guard returned `BLOCKED` because recent hard-bounce/delivery-failure language still exists inside the last seven days of the run log.

Current interpretation:

- Cold outreach remains blocked until the earliest clean recheck on 2026-07-20 after a fresh same-day Gmail sweep.
- The active stop signal is still the July 13 hard-bounce window, not a live site, checkout, or store failure.
