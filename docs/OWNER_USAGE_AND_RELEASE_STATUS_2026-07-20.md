# SplashLens Owner Usage And Release Status - 2026-07-20

## Usage Notifications

Live owner-surface checks on 2026-07-20:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected digest gate rather than a public outage.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned `301 -> /dashboard`.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email readiness remain present on the public probe.
- The digest route remains protected as expected; this did not verify private digest credentials or private owner data.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-20:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- The live homepage body still exposed `230+` language, did not show a visible `180+` fallback, and did not show a visible `500+` claim in this pass.
- `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, and `https://splashlens.com/privacy` all returned HTTP `200`.
- `https://app.splashlens.com/ai.txt`, `https://app.splashlens.com/llms.txt`, and `https://app.splashlens.com/robots.txt` all returned HTTP `200`.

Current interpretation:

- Public site, intake, and AEO/discovery surfaces stayed healthy on both hosts.
- Partner intake remains live with both storage and email configuration present.
- The discovery files continue to serve crawlable public content.

## Store Status

Public store surfaces checked live on 2026-07-20:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The fetched Play listing body still exposed markers consistent with `SplashLens Field Tools`, package `com.splashlens.fieldtools`, public version `1.0.5`, `SoftwareApplication`, `InStock`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- Apple public lookup for `https://apps.apple.com/us/app/splashlens/id6763644905` still returned the live `SplashLens` listing with bundle `com.splashlens.app`, version `1.0.6`, and `currentVersionReleaseDate` `2026-07-16T05:09:22Z`.
- Repo-local Android wrapper drift remains ahead of the public Play listing: `android-twa/app/build.gradle` still declares `applicationId "com.splashlens.fieldtools"`, `versionCode 7`, and `versionName "1.0.6"`.

Current interpretation:

- Public Play and App Store evidence still supports live-listing status.
- Public Android truth remains the `1.0.5` release even though the local wrapper has advanced to `1.0.6`.
- Public iOS truth remains aligned to `1.0.6`, matching the local release line more closely than Play.

## Stripe

Live checkout verification on 2026-07-20:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned direct `GET 302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and `Location: https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned direct `GET 302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and `Location: https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P`.

Current interpretation:

- Direct web checkout still routes through the live Stripe Payment Link path.
- The verified public checkout mode remains `payment_link_direct`.

## Growth Gate

Outreach state checked on 2026-07-20:

- Gmail searches since the prior completed run on 2026-07-17 found no new SplashLens unsubscribe/remove request, complaint, bounce, or delivery-failure message.
- Warm-thread movement was real after the prior run: Carolyn Dibrell at Service Industry News sent a post-call reply on 2026-07-17 (`19f71abb6e39aa53`), Joshua replied in-thread the same day (`19f71b0e3da4a31c`), and Joshua sent a warm operator-lane note to Tim Auerhahn (`19f71b36ac317d29`).
- Same-day `in:sent` history showed no new cold SplashLens outreach on Monday, 2026-07-20.
- The checked-in `tools/splashlens_outreach_day_lock.ps1 -Date 2026-07-20` guard still returned `BLOCKED` because recent hard-bounce/delivery-failure language is still inside its rolling seven-day run-log window.

Current interpretation:

- Cold outreach remains blocked on Monday, July 20, 2026, even though the fresh Gmail sweep did not find a new stop signal.
- The active blocker is the checked-in day-lock result, not a public site/store failure.
- Warm editorial and operator threads can continue manually, but the automated cold lane should stay paused until the guard passes.
