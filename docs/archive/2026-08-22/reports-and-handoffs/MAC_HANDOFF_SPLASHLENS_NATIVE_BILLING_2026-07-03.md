# Mac Handoff: SplashLens Native Billing Build 1.0.2 / 11

Goal: submit the native billing build for iOS/TestFlight and verify App Store Connect products.

## Pull This Branch

Repo:

```bash
cd ~/Dropbox/Projects/poolens
git fetch origin
git checkout feature/splashlens-usage-alerts-dashboard
git pull
```

Latest commits needed:

- `96c3bd9 Bump SplashLens Android billing build`
- Native iOS billing source is in `ios/SplashLens/ContentView.swift`.

## iOS Build

Build metadata:

- Bundle ID: `com.splashlens.app`
- Version: `1.0.2`
- Build: `11`
- Team: `2XSLXV9H74`

Open:

```bash
open SplashLens.xcodeproj
```

Archive:

- Scheme: `SplashLens`
- Destination: `Any iOS Device`
- Product > Archive
- Validate
- Upload to App Store Connect/TestFlight

## App Store Connect Products

Create subscription group:

- Group name: `PartSnap Pro`

Create subscription products exactly:

- `partsnap_pro_monthly`
- `partsnap_pro_annual`

Product positioning:

- Optional paid scanner access for PartSnap Pro.
- Manual lookup, calculators, reports, filters, and checklists remain free.
- SplashLens is a field reference aid, not a diagnosis replacement.

Required App Store Server API secrets for Cloudflare after products are created:

- `APPLE_APP_STORE_CONNECT_ISSUER_ID`
- `APPLE_APP_STORE_CONNECT_KEY_ID`
- `APPLE_APP_STORE_CONNECT_PRIVATE_KEY`
- `SPLASHLENS_IOS_BUNDLE_ID=com.splashlens.app`

## Reviewer Notes

Suggested reviewer note:

SplashLens is a free pool-service field reference app. Manual lookup, calculators, reports, filters, and checklists are free. PartSnap Pro is optional paid scanner access. The app does not diagnose equipment and does not replace manuals, qualified technician judgment, or manufacturer guidance.

No login is required for the free app. Native subscription products are used only for optional scanner entitlement.

## Proof To Return

Create folder:

`SplashLens-ios-proof-2026-07-03`

Include:

- `build-map.md`
- `iap-permissions-proof.md`
- `reviewer-path.md`
- `privacy-support-delete-account.md`
- `console-parity.md`
- `go-no-go.md`
- Screenshots of:
  - App Store Connect build 1.0.2 / 11 uploaded
  - Subscription group `PartSnap Pro`
  - Products `partsnap_pro_monthly` and `partsnap_pro_annual`
  - TestFlight build status

## Google Play Side From PC

The Android release bundle is already built:

`C:\Users\sales\Dropbox\Projects\poolens\android-twa\app\build\outputs\bundle\release\app-release.aab`

Version:

- versionCode: `7`
- versionName: `1.0.6`

Google Play products to create exactly:

- `partsnap_pro_monthly`
- `partsnap_pro_annual`

Cloudflare secrets needed after Play Console API access is configured:

- `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_PLAY_PACKAGE_NAME=com.splashlens.fieldtools`

## Stripe State

Public checkout is clean and live through Stripe Payment Links:

- Monthly: `https://app.splashlens.com/api/checkout?plan=monthly`
- Yearly: `https://app.splashlens.com/api/checkout?plan=yearly`

Production is forced to `payment_link_direct` until a new valid live Stripe API key is created. The live Stripe CLI keys on this PC return `401`, so do not re-enable first-party Checkout Sessions until a fresh live secret key is installed in Cloudflare.
