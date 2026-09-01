# Mac Handoff - SplashLens North-Star Field Copy

Date: 2026-09-01

## Source Of Truth

- App repo: `C:\Users\sales\Documents\Codex\splashlens-proof-gate-20260830\app`
- GitHub: `https://github.com/frost831/poolens.git`
- Branch: `master`
- Latest app commit to pull: `92b9d66`
- Site repo: `C:\Users\sales\Documents\Codex\splashlens-proof-gate-20260830\site`
- Site GitHub: `https://github.com/frost831/poolens-site.git`
- Latest site commit already deployed: `38ceabb`

## What Changed For Native Review

The live web app at `https://app.splashlens.com` now has cleaner field-tech copy:

- Uses `Saved job history` instead of `Service Proof Passport`.
- Uses `Repeat Issue Watch` instead of `Callback Risk`.
- Keeps the internal saved value `callback-risk` stable where needed so existing local data does not break.
- Bumped app shell/script cache versions to `20260901-northstar-funnel`.
- The store wrapper URLs remain:
  - iOS: `https://app.splashlens.com/?store=ios`
  - Android: `https://app.splashlens.com/?store=android`

## Store Positioning To Match

Use plain field language in App Store Connect and Google Play:

- Primary line: `Get off the pad faster.`
- Core value: `Identify the part. Check the code. Prove the visit.`
- Free-core claim: `Free pool and spa field reference app with optional paid add-ons.`
- Paid feature language:
  - `PartSnap Pro`
  - `Saved Job Pro`
  - `Team Field View`
  - `Facility Assist`
  - `Repeat Issue Watch`
- Avoid using these older terms in screenshots, metadata, or review notes:
  - `Service Proof Passport`
  - `Service Proof OS`
  - `Team Proof OS`
  - `Callback Risk Score`
  - `proof layer`

## iOS Tasks On Mac

1. Pull latest Git:

```bash
cd /path/to/poolens
git fetch origin
git checkout master
git pull --ff-only origin master
git rev-parse --short HEAD
```

Expected short SHA: `92b9d66`.

2. Open `SplashLens.xcodeproj`.

3. Confirm bundle/version state:

- Bundle ID: `com.splashlens.app`
- Marketing version: `1.0`
- Current project version/build: `7`
- Wrapper URL in `ios/SplashLens/ContentView.swift`: `https://app.splashlens.com/?store=ios`

4. Run on simulator/device and verify:

- The first screen loads from `https://app.splashlens.com/?store=ios`.
- No direct Stripe/web checkout CTA appears in iOS store mode.
- The app shows `Saved job history` and `Repeat Issue Watch`.
- The app does not show `Service Proof Passport` or `Callback Risk Score` in the main user flow.

5. If submitting a new iOS build, increment build number from `7` to the next unused App Store Connect build number, archive, upload, and submit with this review note:

```text
SplashLens is a free pool and spa field reference app for equipment/code lookup, PartSnap part-reference workflows, calculators, notes, and Facility Assist. The app is not a diagnostic replacement and asks users to verify against manuals, model numbers, and qualified judgment. Store mode hides direct web checkout calls to action.
```

## Android / Play Tasks

Android can be built on PC, but if Mac is handling store proof too:

1. Pull the same app commit `92b9d66`.
2. Confirm Android TWA start URL remains `/?store=android`.
3. Confirm the live PWA at `https://app.splashlens.com/?store=android` shows the newest copy.
4. If uploading a new bundle, increment `versionCode` from the last accepted Play Console version code. Do not reuse old codes.
5. Keep store screenshots aligned with:
   - PartSnap
   - Saved job history
   - Facility Assist
   - Repeat Issue Watch
   - Free core tools

## Production Smoke Already Done On PC

- `https://app.splashlens.com` returned HTTP 200.
- App shell contains `v=20260901-northstar-funnel`.
- App shell contains `Saved job history`.
- App shell contains `Repeat Issue Watch`.
- App shell no longer contains `Callback Risk`.
- App shell no longer contains `Service Proof Passport`.
- `https://app.splashlens.com/api/checkout?plan=monthly` returns HTTP 302 to `checkout.stripe.com`, confirming first-party Stripe Checkout Session mode.
- Site owner stats route exposes the new `Conversion Funnel` panel.
- Site and app security headers are present.

