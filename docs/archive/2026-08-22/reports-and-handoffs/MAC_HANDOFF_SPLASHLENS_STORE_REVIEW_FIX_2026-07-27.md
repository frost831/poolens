# Mac Handoff - SplashLens Store Review Fix

Date: 2026-07-27

## Current ASC State

- App Store Connect app: SplashLens, Apple ID `6763644905`
- Bundle ID: `com.splashlens.app`
- Affected iOS version: `1.0.8`
- Affected build: `15`
- App Store version ID: `39cd5096-b90b-4526-bb20-961d561b1655`
- Review submission ID: `e36eb61b-762e-4a13-94d1-201c3244b786`
- Current API state captured 2026-07-27: `REJECTED`
- Review submission state captured 2026-07-27: `UNRESOLVED_ISSUES`

The App Store Connect API confirmed the rejection state but did not expose the Resolution Center reviewer text. The ASC browser session was stopped at Apple Account sign-in during this pass.

## Likely Review Issue

The submitted reviewer notes said the iOS wrapper should remain free-core and should not show direct Stripe checkout or web-subscription CTAs. The live `?store=ios` app still exposed paid proof workflow language and a reachable `openSplashLensPaidLane()` path that could redirect to `/api/checkout`.

Likely Apple concern: external web purchase / subscription path inside the iOS wrapper.

## Fix Applied

- Replaced the static Verified Proof Network section in `index.html` with free-core native copy and non-payment actions.
- Added a store-shell guard to `openSplashLensPaidLane()` so iOS/Android/native shells cannot fetch checkout catalog, redirect to `/api/checkout`, prompt for paid lead capture, or mail a paid-pilot request.
- Added store-shell handling to `renderVerifiedProofNetwork()`.
- Removed native-store scan-limit purchase/restore buttons until native billing is actually available.
- Sent `store_shell` with scan requests and changed `/api/scan` so native store limit responses omit web checkout upgrade links.
- Bumped the `js/app.js` cache query string to `20260727-store-safe-activation-funnel`.

## Verification

- Tests passed:
  - `node --test tests/checkout-safety.test.mjs tests/paid-lane-lead-contract.test.mjs tests/refund-entitlement-contract.test.mjs tests/email-contract.test.mjs tests/splashlens-payment.test.mjs tests/splashlens-intelligence.test.mjs`
  - Result: `21` pass, `0` fail
- Local browser smoke:
  - URL: `http://127.0.0.1:8788/?store=ios&mode=trainer&utm_source=field_learning_os`
  - Rendered Report flow had no checkout links, no `Paid layers`, no `Proof Pro pilot`, and no `Start paid plan`.
  - Screenshot evidence: `release-evidence/splashlens-store-safe-20260727/playwright/local-ios-store-report.png`
- ASC API evidence:
  - `release-evidence/splashlens-asc-current-20260727/summary.json`

## Google Play Parity Guidance

Apply the same native-store rule to Google Play review: `store=android` must not expose web checkout, Stripe upgrade links, paid pilot lead capture, or paid-subscription CTAs inside the Android wrapper unless Google Play Billing is implemented and approved for that flow.
