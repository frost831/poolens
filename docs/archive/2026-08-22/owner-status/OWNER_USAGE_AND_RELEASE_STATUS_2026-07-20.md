# SplashLens Owner Usage And Release Status - 2026-07-20

## Usage Notifications

Live owner-surface checks on 2026-07-20:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected digest gate rather than a public outage.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` still returned `301 -> /dashboard`.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email readiness remain present on the public probe.
- The digest route remains protected as expected; this did not verify private digest credentials or private owner data.
- The owner-dashboard redirect behavior remains stable and non-blocking.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-20:

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

Public store surfaces checked live on 2026-07-20:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The fetched Play listing body still exposed markers consistent with package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, `SoftwareApplication`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- Apple public lookup for `https://apps.apple.com/us/app/splashlens/id6763644905` still returned the live `SplashLens` listing with bundle `com.splashlens.app`, version `1.0.6`, and `currentVersionReleaseDate` `2026-07-16T05:09:22Z`.
- Repo-local Android wrapper drift remains ahead of the public Play listing: `android-twa/app/build.gradle` still declares `applicationId "com.splashlens.fieldtools"`, `versionCode 7`, and `versionName "1.0.6"`.

Current interpretation:

- Public Play and App Store evidence still supports live-listing status.
- Public Android truth remains the `1.0.5` release even though the local wrapper has advanced to `1.0.6`.
- Public iOS truth remains aligned to `1.0.6`.

## Stripe

Live checkout verification on 2026-07-20:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned direct `GET 302` with `X-SplashLens-Checkout-Mode: payment_link_direct`, and the follow redirect landed on a live Stripe Checkout page with final `200`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned direct `GET 302` with `X-SplashLens-Checkout-Mode: payment_link_direct`, and the follow redirect landed on a live Stripe Checkout page with final `200`.

Current interpretation:

- Direct web checkout still routes through the live Stripe Payment Link path.
- The verified public checkout mode remains `payment_link_direct`.

## Growth Gate

Outreach state checked on 2026-07-20:

- Gmail searches since the previous run timestamp `2026-07-17T14:16:24.104Z` found no new SplashLens unsubscribe/remove request, complaint, bounce, or delivery-failure message.
- Gmail search for Monday, July 20, 2026 sent mail found `0` SplashLens cold emails for the day.
- One new warm thread movement did appear after the previous run: Carolyn Dibrell at Service Industry News replied on 2026-07-17 saying she would call, and Joshua sent a same-day warm reply in-thread. A later unsent draft also exists in that thread.
- The checked-in `tools/splashlens_outreach_day_lock.ps1 -Date 2026-07-20` guard returned `BLOCKED` because it scans the last seven days inclusively and still sees the 2026-07-13 hard-bounce records inside that window.

Current interpretation:

- Cold outreach remains blocked on Monday, July 20, 2026 even though the Gmail stop-signal sweep itself was clean.
- The active stop signal is still the inclusive July 13 hard-bounce window in the repo-local guard, not a live site, app, store, or checkout failure.
- The true next clean automatic cold-send recheck is Tuesday, July 21, 2026 after a fresh same-day Gmail sweep and day-lock check.
