# SplashLens Native Store Handoff - 2026-08-25

## Source Repos

- App repo: `C:\Users\sales\Dropbox\Projects\poolens`
- Site repo: `C:\Users\sales\Dropbox\Projects\poolens-site`
- App branch: `feature/splashlens-usage-alerts-dashboard`
- Site branch: `outreach/splashlens-drip-20260616`

## Store URLs

- iOS: `https://apps.apple.com/us/app/splashlens/id6763644905`
- Android: `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`

## Current Local Android Wrapper

- Package: `com.splashlens.fieldtools`
- Version name: `1.0.8`
- Version code: `9`
- Build file: `android-twa/app/build.gradle`
- Existing signed AAB record: `play-store-artifacts/SplashLens-Field-Tools-1.0.8-v9-fieldtools-FINAL-SIGNED.aab`

## Web/App State To Reflect In Store Copy

- Main promise: `Get off the pad faster.`
- Free core field reference app.
- PartSnap photo-assisted part-family workflow with missing-proof prompts.
- Pool, spa, hot tub, and swim-spa code/reference lookup.
- Closing Season Mode for winterizing proof.
- Service Proof records and customer-safe summaries.
- Facility Assist for CPO/operator-style daily checks and escalation packets.
- Voice-friendly notes and proof workflows.
- Optional paid add-ons:
  - PartSnap Pro monthly/annual is live.
  - Solo Proof, Teams, Facility/CPO, distributor, manufacturer, and training partner lanes are pilot/partner lanes unless native products are explicitly configured.

## Payment/Entitlement Notes

- Stripe readiness is live on the web app.
- Monthly and annual PartSnap Pro Payment Links are active.
- Stripe webhook is enabled with required events.
- Checkout path reports `payment_link_direct`.
- Scanner entitlement now requires active server-side entitlement when KV is available.
- Failed AI scans do not burn scan allowance.

## Conservative Store Disclosure

Use language like:

> SplashLens is a field reference and proof tool. It does not diagnose equipment, guarantee part fitment, replace chemical labels, replace manufacturer manuals, guarantee warranty approval, certify code compliance, or replace qualified judgment.

Avoid:

- manufacturer endorsement,
- guaranteed identification,
- guaranteed repair recommendations,
- claims that SplashLens replaces manuals, CPO training, or licensed judgment,
- saying paid pilot lanes are fully self-serve native subscriptions unless they are configured in the store.

## Recommended Screenshot Order

1. Home screen: `Get off the pad faster`
2. PartSnap result: possible part path plus missing proof
3. Closing Season Mode: proof before freeze season
4. Service Proof/customer-safe summary
5. Facility Assist/operator workflow
6. Spa/swim-spa reference lane
7. Error-code lookup
8. Dosing calculator or voice note

## Apple Metadata

Subtitle:

`Part ID, codes, proof, dose`

Promotional text:

`Get off the pad faster: PartSnap, code lookup, spa/swim-spa proof, closing-season records, voice notes, and clean senior-tech/vendor packets.`

Keywords:

`pool tech,PartSnap,parts,codes,pump,heater,salt,robot,proof,dosing,CPO,spa,swim,hot tub`

## Google Play Metadata

Short description:

`Pool/spa field app: PartSnap, codes, proof, dose math.`

Full description:

`SplashLens is a free-core field reference app for pool and spa techs. Use PartSnap to organize possible part paths, search pool and spa code references, calculate common doses, save service proof, capture voice notes, and build cleaner packets for senior techs, vendors, counters, or customer updates.`

Include the conservative disclosure above.

## Mac Steps

1. Pull latest app repo and site repo from GitHub.
2. Confirm app repo has the latest app commits:
   - `0a7648e` entitlement route boundary
   - later 2026-08-25 growth-plan/doc commit if present
3. Confirm site repo has:
   - `a0009ab` Teams page mobile release-gate fix
   - later 2026-08-25 outreach/doc commit if present
4. Open the iOS project in `C:\Users\sales\Dropbox\Projects\poolens\ios`.
5. Confirm webview/store wrapper still targets `https://app.splashlens.com/?store=ios`.
6. Capture new screenshots from the live web app or native shell in the order above.
7. Update App Store Connect metadata only if screenshots/copy are stale.
8. For Android, use package `com.splashlens.fieldtools`; do not upload to any obsolete `com.splashlens.app` record unless the console clearly requires it for a separate old listing.
9. If building a new Android AAB, increment versionCode above `9`.
10. Keep United States production targeting unless Canada/legal/localization review is separately approved.

## Verification Already Run On PC

- App tests: passing.
- PartSnap corpus build/export/benchmark: passing.
- Site tests and live UI audit: passing.
- Live app/site smoke: passing.
- Stripe readiness: production ready.
- Amplitude readiness: app and site GREEN.
