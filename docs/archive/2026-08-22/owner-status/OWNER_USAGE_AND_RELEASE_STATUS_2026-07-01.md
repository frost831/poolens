# SplashLens Owner Usage And Release Status - 2026-07-01

## Usage Notifications

Live endpoints checked on 2026-07-01:

- `https://app.splashlens.com/api/events`
- `https://app.splashlens.com/dashboard`
- `https://app.splashlens.com/owner-dashboard`

Results:

- `https://app.splashlens.com/api/events` returned `{"ok":true,"status":"SplashLens app event endpoint ready.","storageConfigured":true,"emailConfigured":true}`.
- `https://app.splashlens.com/dashboard` returned HTTP `200`.
- `https://app.splashlens.com/owner-dashboard` returned HTTP `200`.
- `https://app.splashlens.com/?store=ios` and `https://app.splashlens.com/?store=android` both returned HTTP `200`.

Meaningful app events are still wired for owner notification through the app event endpoint, including app opens, install signals, scanner use, PartSnap result/use, proof saves, packets, mystery submissions, apprentice mode, partner cards, route/report saves, and checkout success.

## Site, Intake, And Discovery

Marketing and intake surfaces checked live on 2026-07-01:

- `https://splashlens.com` returned HTTP `200`.
- `https://app.splashlens.com` returned HTTP `200`.
- `https://splashlens.com/api/partner-intake` returned `ok=true` on live `GET` with storage and email configured.
- `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/ai.txt`, and `https://splashlens.com/llms.txt` all returned HTTP `200`.
- `https://app.splashlens.com/robots.txt`, `https://app.splashlens.com/sitemap.xml`, and `https://app.splashlens.com/llms.txt` returned HTTP `200`.

Important nuance:

- `HEAD` on `https://splashlens.com/api/partner-intake` can return misleading results in this environment, but live `GET` is healthy and should remain the source-of-truth probe.
- `https://app.splashlens.com/ai.txt` currently returns HTTP `200` while serving the HTML app shell instead of app-specific AI-discovery text. Treat app-host `ai.txt` as currently broken for AEO/discovery purposes until it serves the expected plain-text file.

## Store Status

Public store surfaces checked live on 2026-07-01:

- Public Google Play listing URL resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- iOS App Store listing URL returned HTTP `200` at `https://apps.apple.com/us/app/splashlens/id6763644905`.

The public Play/App Store evidence still supports the live-listing status. The Android listing package remains `com.splashlens.fieldtools`.

## Stripe

Live checkout verification on 2026-07-01:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to the live monthly Stripe Payment Link.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_direct` and redirected to the live yearly Stripe Payment Link.

Current interpretation:

- The older `stripe_api_401` fallback is no longer the current production behavior.
- The live customer checkout path is now direct Payment Link routing, not the prior fallback header state.
- First-party Checkout Session mode is still not claimed as active here; the verified truth is that live web checkout reaches Stripe successfully through the Payment Link path.
