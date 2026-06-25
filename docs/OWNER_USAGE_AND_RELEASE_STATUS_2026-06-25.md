# SplashLens Owner Usage And Release Status - 2026-06-25

## Usage Notifications

Live endpoint checked:

- `https://app.splashlens.com/api/events`
- Result: `ok=true`
- Storage: configured
- Email notifications: configured

Meaningful app events are wired for owner notification through the app event endpoint, including app opens, install signals, scanner use, PartSnap result/use, proof saves, packets, mystery submissions, apprentice mode, partner cards, route/report saves, and checkout success.

The owner dashboard is available at:

- `https://app.splashlens.com/dashboard`
- Redirects also exist for `/dashboad` and `/owner-dashboard`.

Live verification refresh on 2026-06-25:

- `https://app.splashlens.com/dashboard` returned HTTP 200.
- `https://app.splashlens.com/owner-dashboard` and `https://app.splashlens.com/dashboad` both redirected to `/dashboard`.
- `https://app.splashlens.com/?store=ios` and `https://app.splashlens.com/?store=android` both returned HTTP 200.

## Site And Intake

Marketing and intake surfaces checked live on 2026-06-25:

- `https://splashlens.com` returned HTTP 200.
- `https://splashlens.com/api/partner-intake` returned `ok=true` on `GET` with storage and email configured.
- A live `POST` probe to `https://splashlens.com/api/partner-intake` returned `Valid email required`, which confirms the endpoint is up and validating requests.
- `https://splashlens.com/robots.txt`, `https://splashlens.com/sitemap.xml`, `https://splashlens.com/pseo-sitemap.xml`, `https://splashlens.com/seo-hub-sitemap.xml`, `https://splashlens.com/category-hub-sitemap.xml`, `https://splashlens.com/ai.txt`, and `https://splashlens.com/llms.txt` all returned HTTP 200.
- `https://app.splashlens.com/robots.txt`, `https://app.splashlens.com/sitemap.xml`, `https://app.splashlens.com/ai.txt`, and `https://app.splashlens.com/llms.txt` all returned HTTP 200.

## Google Play

The earlier signed Android release was documented as:

- Version: `1.0.3`
- Version code: `4`
- Package: `com.splashlens.app`
- AAB: `play-store-artifacts/SplashLens-Field-Tools-1.0.3-v4-splashlens-app-signed.aab`

Google Play is live publicly at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`. Because the public listing uses `com.splashlens.fieldtools`, a corrected Android wrapper build was prepared for that package:

- Version: `1.0.4`
- Version code: `5`
- Package: `com.splashlens.fieldtools`
- AAB: `play-store-artifacts/SplashLens-Field-Tools-1.0.4-v5-fieldtools-signed.aab`
- SHA-256: `277272ABF82EFA6F4281492FDB6D4F482E432CFDCAE2B0EA275C89E57F7CFAAE`
- Release packet: `docs/store/GOOGLE_PLAY_FIELDTOOLS_RELEASE_2026-06-25.md`

The marketing site includes a public Android tester and field-feedback intake page at `https://splashlens.com/google-play-testers.html`, wired to the partner/advisor intake endpoint for upcoming build feedback.

Store-surface verification on 2026-06-25:

- Public Google Play listing URL still resolved at `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`.
- iOS App Store listing URL returned HTTP 200 at `https://apps.apple.com/us/app/splashlens/id6763644905`.

Release-readiness caveat:

- `docs/store/GOOGLE_PLAY_FIELDTOOLS_RELEASE_2026-06-25.md` still says the `1.0.4` AAB upload was initiated in Play Console, but the final `Next` / review / rollout confirmation was not truthfully completed from automation.
- The public store listing is live, but this specific corrected `1.0.4` release should still be treated as waiting on manual Play Console confirmation.

## Stripe

Checkout still falls back to Stripe Payment Links because the direct Stripe API checkout path returns `stripe_api_401`.

Live checkout verification on 2026-06-25:

- `https://app.splashlens.com/api/checkout?plan=monthly` returned `302` with `X-SplashLens-Checkout-Mode: payment_link_fallback` and `X-SplashLens-Checkout-Fallback: stripe_api_401`.
- `https://app.splashlens.com/api/checkout?plan=yearly` returned `302` with the same fallback headers.

Confirmed earlier:

- The Cloudflare Pages secret name `STRIPE_SECRET_KEY` exists.
- The value is rejected by Stripe, so it is likely stale, malformed, or not the raw live secret.

Required external action:

```powershell
npx --yes wrangler@latest pages secret put STRIPE_SECRET_KEY --project-name poolens
```

Paste the raw live `sk_live_...` value from Stripe. Do not include `STRIPE_SECRET_KEY=` or `Bearer`.
