# SplashLens Google Play setup status - 2026-06-03

## App

- Play app: SplashLens Field Tools
- Package: com.splashlens.app
- Signed bundle: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.0-v1-signed.aab`
- Bundle SHA-256: `7602A83C9A5AD97D66C4C46AE7EB38EC8F9B573995AD0FFF3960794243D97230`
- Privacy policy: `https://splashlens.com/privacy.html`
- Support/contact email: `warmsnowman831@gmail.com`
- Marketing/support site: `https://splashlens.com`

## Completed in Play Console

- Privacy policy saved.
- Ads declaration saved as no ads.
- App access saved as unrestricted / no login required.
- Content rating saved as All Other App Types with online content disclosed for generated AI content; rating preview showed ESRB Everyone / PEGI 3 / IARC 3+ style ratings.
- Target audience saved as 18 and over.
- Data safety saved:
  - Current policy language should disclose service-provider processing where applicable for app functionality, diagnostics, and optional online scan workflows. Do not reuse the old no-sharing shortcut line for current submissions.
  - Data collected: name, email address, photos, crash logs, diagnostics, other app performance data, app interactions, other user-generated content, other actions.
  - Data deletion request URL: `https://splashlens.com/privacy.html`
  - Encrypted in transit.
- Advertising ID declaration saved as no.
- Government app declaration saved as no.
- Financial features saved as no financial features.
- Health apps saved as no health features.
- Category saved as Tools.
- Store contact details published with email and website.
- Main store listing saved after asset upload.
- Closed testing track configured with:
  - Countries / regions added for Alpha closed testing.
  - Existing `Internal testers` email list selected. At save time the list showed 1 user.
  - Closed testing release `1 (1)` created with app bundle version code 1 / version name 1, target SDK 35, API 21+, and release notes for en-US.
- Publishing overview submitted with 13 changes for Google review on 2026-06-03. Play Console showed `Changes in review` after confirmation; Google quick checks were still running and indicated changes would be sent for review as soon as checks completed successfully.

## Store listing text staged in Play Console

- App name: `SplashLens Field Tools`
- Short description: `Pool tech codes, dosing, service notes, and scanner assistance.`
- Full description: 1296-character ASO-safe description covering pool service error-code lookup, chemical dosing, service notes, filter guides, checklists, optional scanner assistance, and reference-only safety disclaimers.

## Upload folder prepared

Folder:

`C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\google-play-listing-2026-06-03`

Files:

- `app-icon-512.png` - 512 x 512 app icon.
- `feature-graphic-1024x500.png` - 1024 x 500 feature graphic.
- `01-error-code-lookup.png` - 1080 x 1920 phone screenshot.
- `02-chemical-dosing.png` - 1080 x 1920 phone screenshot.
- `03-pool-volume.png` - 1080 x 1920 phone screenshot.
- `04-scanner-assistance.png` - 1080 x 1920 phone screenshot.

## Review status

Submitted to Google Play review from Publishing overview on 2026-06-03:

- 13 changes sent for review.
- Closed testing - Alpha release `1 (1)` included.
- Countries / regions, tester list, store listing, app content, and store settings included.
- Play Console status after confirmation: `Changes in review`.
- Managed publishing was off, so approved changes are expected to publish automatically when Google approves them.

## Current blocker / production access note

This account cannot publish directly to production yet. Google requires a closed test with at least 12 opted-in testers for at least 14 days before production access can be requested. At tester setup time, the selected `Internal testers` list showed 1 user, so 11+ more opted-in testers are still needed for the production-access gate.

## June 16, 2026 parity update

- iOS and Android wrappers both load the live SplashLens PWA, so June 16 app/dashboard/usage-alert changes are available through the Android wrapper without a native feature rewrite.
- Privacy policy source was updated to disclose anonymous app usage events, owner-side usage notifications, and usage-event retention up to 120 days.
- Android wrapper source was bumped for a new upload candidate:
  - Version code: `2`
  - Version name: `1.0.1`
- Signed AAB candidate:
  - `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.1-v2-signed.aab`
  - SHA-256: `0258B8AC8785FD22C36924E3265FF49A99B414929AEADE61A6937DA7EB645BCD`
- New Play/iOS parity packet:
  - `C:\Users\sales\Dropbox\Projects\poolens\docs\store\GOOGLE_PLAY_IOS_PARITY_2026-06-16.md`
