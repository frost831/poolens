# SplashLens Owner Usage And Release Status - 2026-07-15

## Usage Notifications

Live owner-surface checks on 2026-07-15:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- `https://app.splashlens.com/api/events?digest=1` returned `401 Unauthorized`, which still matches the intended protected digest gate rather than a public outage.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` still resolved through `301 -> /dashboard` on direct `GET`.

Current interpretation:

- Public owner-notification plumbing still looks healthy from public evidence.
- Event storage and owner-email readiness remain present on the public probe.
- The digest route remains protected as expected; this did not verify private digest credentials or private owner data.

## Site, Intake, And Discovery

Marketing, intake, and discovery surfaces checked live on 2026-07-15:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `{"ok":true,"endpoint":"splashlens_partner_intake","storageConfigured":true,"emailConfigured":true}` on direct `GET`.
- A `HEAD` probe on `https://splashlens.com/api/partner-intake` still drifted to `404 Not Found`, so direct `GET` remains the reliable health check for this route.
- The live homepage body still exposed `230+ current field troubleshooting entries`, with no visible `500+` claim and no checked fake-testimonial placeholder names in this pass.
- `https://splashlens.com/ai.txt`, `https://splashlens.com/llms.txt`, `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, and `https://splashlens.com/privacy` all returned HTTP `200`.
- `https://app.splashlens.com/ai.txt`, `https://app.splashlens.com/llms.txt`, and `https://app.splashlens.com/robots.txt` all returned HTTP `200`.

Current interpretation:

- Public site, intake, and AEO/discovery surfaces stayed healthy on both hosts.
- Partner-intake remains live with both storage and email configuration present.
- The discovery files continue to serve crawlable public content.

## Store Status

Public store surfaces checked live on 2026-07-15:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- The Play listing body still exposed markers consistent with package `com.splashlens.fieldtools`, public version `1.0.5`, `InStock`, `SoftwareApplication`, `Jun 25, 2026`, and privacy policy `https://splashlens.com/privacy`.
- The live iOS App Store listing returned HTTP `200` at `https://apps.apple.com/us/app/splashlens/id6763644905`.
- Repo-local Android wrapper drift remains ahead of the public Play listing: [`android-twa/app/build.gradle`](C:\Users\sales\Dropbox\Projects\poolens\android-twa\app\build.gradle) still declares `applicationId "com.splashlens.fieldtools"`, `versionCode 7`, and `versionName "1.0.6"`.

Current interpretation:

- Public Play and App Store evidence still supports live-listing status.
- Public Android truth remains the `1.0.5` release even though the local wrapper has advanced to `1.0.6`.
- Current public iOS truth remains the `id6763644905` listing.

## Stripe

Live checkout verification on 2026-07-15:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to `https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to `https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P`.
- Following both redirects landed on live Stripe Checkout pages with HTTP `200`.

Current interpretation:

- Direct web checkout still routes cleanly to the live Stripe Payment Links.
- The verified public checkout mode remains `payment_link_direct`.

## Growth Gate

Mailbox and outreach state checked on 2026-07-15:

- Fresh Gmail sweeps after the previous run found no new SplashLens reply, unsubscribe, remove-me request, complaint, or new delivery failure.
- Gmail still shows `0` SplashLens sends on 2026-07-15.
- Gmail history after the previous run still shows the five user-unlocked 2026-07-14 one-to-one cold sends plus the warm AQUA reply already recorded in the site outreach log.
- Queue truth remains unchanged in the checked-in site repo snapshot: `queued=27`, `needs-verification=37`, `needs-contact=23`, `replied=10`, `suppressed=1`, `bounced=4`, `sent=59`, `follow-up-sent=58`, `hold-community=6`, `hold-proof-needed=4`, `covered-by-sent=4`, and `research-needed=19`.
- The active stop signal is unchanged: the 2026-07-13 hard bounces for Wake Tech and NJPMA remain inside the seven-day hygiene window.

Current interpretation:

- Cold outreach remains blocked until the earliest clean recheck on 2026-07-20 after a fresh same-day Gmail sweep.
- No new queue mutation or outbound send was justified in this pass.
