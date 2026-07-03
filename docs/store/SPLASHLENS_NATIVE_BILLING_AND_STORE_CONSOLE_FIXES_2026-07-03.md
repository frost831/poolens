# SplashLens Native Billing And Store Console Fixes - 2026-07-03

## Code now built

- Web app scanner limit modal calls native billing in store shells.
- iOS wrapper listens for `splashlensNativeBilling` messages and uses StoreKit 2 for purchase and restore.
- Android TWA has a `splashlens://billing` bridge and Google Play Billing Library 9.1.0 purchase flow.
- Cloudflare Functions endpoint `/api/native-entitlement` verifies store purchase data before issuing scanner entitlement.
- Google Play verification uses the Android Publisher API service account.
- Apple verification uses the App Store Server API transaction lookup.

## Store product IDs

Use the same product IDs in App Store Connect and Google Play Console:

- `partsnap_pro_monthly`
- `partsnap_pro_annual`

## Cloudflare Pages environment required

Do not print these values in logs.

- `SPLASHLENS_ENTITLEMENT_SECRET` or `SCAN_ENTITLEMENT_SECRET`
- `APPLE_APP_STORE_CONNECT_ISSUER_ID`
- `APPLE_APP_STORE_CONNECT_KEY_ID`
- `APPLE_APP_STORE_CONNECT_PRIVATE_KEY`
- `SPLASHLENS_IOS_BUNDLE_ID`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_PLAY_PACKAGE_NAME`

Optional hardening:

- `SPLASHLENS_NATIVE_BILLING_SHARED_SECRET`

## App Store Connect actions

- Create subscription group: `PartSnap Pro`.
- Add `partsnap_pro_monthly` and `partsnap_pro_annual`.
- Add pricing, duration, subscription disclosure, and review screenshot.
- Update privacy labels if native billing, usage analytics, diagnostic events, photos, or voice notes are collected.
- Submit the next build from Mac with the StoreKit bridge in `ios/SplashLens/ContentView.swift`.

## Google Play Console actions

- Create subscription products `partsnap_pro_monthly` and `partsnap_pro_annual`.
- Add active base plans and pricing for each subscription.
- Confirm package name `com.splashlens.fieldtools`.
- Add the service account to Play Console API access and grant app-level financial/order access needed for purchase verification.
- Upload a new AAB built from the Android TWA after the billing bridge changes.

## Store listing cleanup

- Developer/email/website should be SplashLens/Below Zero Media aligned, not ThrottleShare aligned.
- Website: `https://splashlens.com`
- Support/contact: `hello@splashlens.com`
- Public copy should say PartSnap Pro is optional paid scanner access. Manual lookup, calculators, and reference tools remain free.

## Verified locally

- Cloudflare function syntax checked as ES module.
- Android debug build succeeds with Billing Library 9.1.0.
- Android release bundle builds successfully: `android-twa/app/build/outputs/bundle/release/app-release.aab`.
- Windows cannot run `xcodebuild`; Mac handoff is required for iOS compile/archive/TestFlight.

## Verified live after deploy

- `https://app.splashlens.com/` returns HTTP 200.
- `https://app.splashlens.com/api/native-entitlement` returns HTTP 200 with native products listed.
- `https://app.splashlens.com/api/checkout?plan=monthly` attempts first-party Stripe Checkout and safely falls back to the live Stripe Payment Link.
- Current fallback reason: `stripe_api_401`.

## Still needs real console/secret values

- Cloudflare has an encrypted `STRIPE_SECRET_KEY`, but Stripe rejects it with `401`. Replace it with a valid live restricted/secret key or keep Payment Links as the working fallback.
- Cloudflare production secrets do not list Apple Server API keys yet.
- Cloudflare production secrets do not list Google Play service-account keys yet.
- App Store Connect and Play Console must have the subscription products created with the exact IDs above before native purchase buttons can resolve products.
