# SplashLens Store Wrapper Handoff

Updated: May 26, 2026

## Current App Target

- URL: `https://app.splashlens.com`
- Type: offline-first PWA
- Web monetization: free core tools plus PartSnap Pro checkout links
- Store wrapper mode: use `https://app.splashlens.com/?store=ios` or `https://app.splashlens.com/?store=android` so native app review sees a free-core build with no direct Stripe upgrade CTAs.
- Offline behavior: manual lookup, calculators, filter guides, checklists, reports, and cached app shell
- Online-only behavior: Error Scan, PartSnap, and Test Strip AI scanner

## Android Fast Path

Submit a Trusted Web Activity wrapper to Google Play around:

`https://app.splashlens.com/?store=android`

Suggested listing copy:

> SplashLens is a free field rescue app for pool service technicians. Search equipment error codes, calculate chemical doses, create visit notes, follow filter guides, and use the online AI scanner for equipment displays, pool parts, and test strips.

Short description:

> Free pool tech field app: error codes, dosing, service notes, and online AI scanner.

## iOS Fast Path

Use Capacitor or Median.co to wrap:

`https://app.splashlens.com/?store=ios`

Review framing:

- This is a utility/reference app for pool service professionals.
- Manual tools work offline after first load.
- AI camera scanning requires internet and is user-initiated.
- No account is required.
- Pool/customer data is stored locally on device browser storage.
- Store wrapper mode does not show direct Stripe checkout buttons. Keep it that way unless native IAP or approved external-link entitlement handling is added.

## Store Screenshot Checklist

Before final screenshots, run `docs/ASO_THUMBNAIL_GATE_2026-05-28.md` and save the competitor board, screenshot frame plan, metadata drafts, and claim-parity check under `aso/`.

Capture these screens on phone dimensions:

- Home/rescue screen with quick actions.
- Error-code lookup result.
- Chemical dosing calculator.
- AI scanner mode selector or scan result.
- PartSnap result with part/search workflow.
- Service note/report screen.

## Known Launch Constraints

- Native store submission still needs Mac/Xcode or store-wrapper console access.
- App Store Connect and Google Play Console final actions cannot be completed from this Windows repo alone.
- If Apple asks about data collection, use the public privacy page: `https://splashlens.com/privacy.html`.
- If Google asks for data safety, declare local app data storage and user-submitted images for AI scanner processing. Email collection and Stripe checkout are on the web/marketing surfaces, not required inside the store wrapper.
- If paid unlimited AI is added inside the native app later, use Apple In-App Purchase / Google Play Billing or a policy-approved external purchase flow before exposing upgrade CTAs inside the store build.
