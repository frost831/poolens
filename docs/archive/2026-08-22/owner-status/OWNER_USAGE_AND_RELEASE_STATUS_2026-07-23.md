# SplashLens Owner Usage And Release Status - 2026-07-23

## Usage Notifications

Live owner-surface checks on 2026-07-23:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected digest gate rather than a public outage.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned final HTTP `200`.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email readiness remain present on the public probe.
- The digest route remains protected as expected; this did not verify private digest credentials or private owner data.
- The owner dashboard remained reachable in this pass.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-23:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- The live homepage body still exposed `230+` language, with no visible `180+` fallback and no visible `500+` claim found in this pass.
- No checked fake-testimonial placeholder names were found in the fetched homepage body.
- `https://splashlens.com/privacy`, `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, and `https://splashlens.com/category-hub-sitemap.xml` all returned HTTP `200`.
- `https://app.splashlens.com/ai.txt`, `https://app.splashlens.com/llms.txt`, and `https://app.splashlens.com/robots.txt` all returned HTTP `200`.

Current interpretation:

- Public site, intake, and AEO/discovery surfaces stayed healthy on both hosts.
- Partner intake remains live with both storage and email configuration present.
- The discovery files continue to serve crawlable public content.

## Store Status

Public store surfaces checked live on 2026-07-23:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The fetched Play listing body still exposed markers consistent with title `SplashLens Field Tools`, package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- Apple public lookup for `https://apps.apple.com/us/app/splashlens/id6763644905` still reports the live `SplashLens` listing with bundle `com.splashlens.app`, version `1.0.7`, and `currentVersionReleaseDate` `2026-07-21T05:14:21Z`.
- Repo-local Android wrapper is still ahead of the public Play listing: `android-twa/app/build.gradle` still declares `applicationId "com.splashlens.fieldtools"`, `versionCode 8`, and `versionName "1.0.7"`.

Current interpretation:

- Public Play and App Store evidence still supports live-listing status.
- Public Android truth remains the `1.0.5` release even though the local wrapper has advanced to `1.0.7`.
- Public iOS truth remains `1.0.7`.

## Stripe

Live checkout verification on 2026-07-23:

- `https://app.splashlens.com/api/checkout?plan=monthly` still routes through the live Stripe Checkout flow in `payment_link_direct` mode.
- `https://app.splashlens.com/api/checkout?plan=yearly` still routes through the live Stripe Checkout flow in `payment_link_direct` mode.
- `https://app.splashlens.com/api/checkout-readiness` returned `{"ok":true,...}` with `checkoutMode="payment_link_direct"`, `stripe.ok=true`, `webhookConfigured=true`, `storageConfigured=true`, `allPlansConfigured=true`, and plan readiness across the current paid-lane catalog.

Current interpretation:

- Direct web checkout still routes through the live Stripe Payment Link path for the public PartSnap plans.
- Stripe authentication, webhook configuration, and storage still look healthy on the readiness probe.
- The verified public checkout mode remains `payment_link_direct`; the readiness probe does not mean the public route has been switched away from payment links.

## Growth Gate

Outreach state checked on 2026-07-23:

- Gmail searches since the previous automation timestamp `2026-07-22T16:01:31.521Z` found no new SplashLens reply, unsubscribe/remove request, complaint, negative reply, bounce, or delivery-failure message.
- Same-day Gmail search on Thursday, July 23, 2026 showed five valid SplashLens cold emails already sent earlier in the day:
  - Your Pool Buddy, `info@Yourpoolbuddy.com`, sent id `19f8f31f18ef19d2`
  - AAA Pool Service, `info@aaapoolservice.com`, sent id `19f8f31f4d600991`
  - All Pure Pool Service, `allpure@softcom.net`, sent id `19f8f31fcf882aab`
  - Atlantic Aquatech, `brad@atlanticaquatechpools.com`, sent id `19f8f31fedb0d74c`
  - Patriot Pool Service, `info@patriotpoolservice.com`, sent id `19f8f3203149fea0`
- The checked-in `tools\splashlens_outreach_day_lock.ps1 -Date 2026-07-23` guard returned `BLOCKED` because the daily cap was already consumed at `5/5`.
- No additional cold email was sent in this pass.
- Added four verified prospects to the main queue instead of sending: `Callen Pool Supply`, `American Pool Supply`, `Aquatic Management Services`, and `Pool Services Group`.

Current interpretation:

- Cold outreach hygiene stayed clean after the July 22 run, but the day was already saturated before this pass.
- The July 23 send total remains within the 5-email daily cap because this pass added no new outbound mail.
- Warm editorial threads remain active separately and did not need same-day action in this check.
