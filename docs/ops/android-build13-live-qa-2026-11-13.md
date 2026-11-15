# Android build 13 live verification

Tested November 13, 2026 using the Google Play Console signed universal APK for `com.splashlens.fieldtools`, version `1.0.12`, versionCode `13`, on an isolated Android 16 Pixel 7 emulator. The APK's embedded launch URL is `https://app.splashlens.com/?store=android`. This was a sideload of Google's signed production artifact, not a Play-installed physical-phone acceptance test.

APK signature verification passed. Its signing certificate matches the `com.splashlens.fieldtools` certificate in the live app origin's Digital Asset Links file.

## Reproduced defects and repairs

- PartSnap initialized the previous scanner mode before selecting Parts, which could request the camera before the PartSnap explanation. Manual lookup could also request the camera unnecessarily. Select the intended mode during tab initialization across Counter, first-use, facility, role, marketing, and deep-link entries.
- Restoring Scan started in Error Scan despite the intended PartSnap default. Start in Parts and retain explicit Error Scan selection.
- Automatic feedback could cover the secure checkout handoff. Defer both feedback prompts while a SplashLens task sheet is active, including forced feedback requests.
- Publish `/js/app.js?v=20261113-camera-entry-2` and service-worker cache `splashlens-v65-camera-entry` so installed wrappers receive the repairs.

The consent regressions failed against the preceding master and passed after repair. Full local verification passes all 426 tests, with browser tests enabled and no skips. The 120-case PartSnap reference benchmark passes; all cases remain metadata-only, with zero image-proven benchmark cases.

## Live Android evidence

The signed build opened the live app in Android mode at a native viewport width of 412 CSS pixels. Verified explanation and camera skip, manual FLO lookup, gallery file selection, blank-photo rejection with gallery retry, four evidence captures, free-profile verification gating, the native web-checkout guard, and free manual recovery at the scan limit.

The owner explicitly authorized the `hello@splashlens.com` test profile. A verification email arrived and the profile was verified in the isolated emulator. A real `parts_snap` API request returned HTTP 200 and the result UI rendered a Hayward Super Pump family, requested missing proof, and locked buying links. No credentials, verification codes, or profile tokens are retained in this report.

The public input was page 1 of [Hayward's Super Pump high-efficiency sell sheet](https://commerce.hayward-pool-assets.com/magento/2026/SP2607X10/LITSPHE23_Super_Pump_High_Efficiency_Sell_Sheet_DIGITAL_c4ff.pdf), repeated as a controlled reference-input smoke test. It did not contain a real equipment model plate, measured dimensions, or four distinct field views. The result therefore proves live verification, transport, inference, rendering, and conservative proof handling, not real-world photo accuracy or exact fitment.

## Checkout evidence

Normal-browser web checkout reached live Stripe review for all four self-service plans. No contact, card, billing information, subscription confirmation, or payment was submitted.

| Plan | Stripe review |
| --- | --- |
| Scanner monthly | $19/month |
| Scanner annual | $149/year |
| Closing Pro pass | $29 once, 60 days, no automatic renewal |
| Crew | $39/month, one lead and up to three technicians |

Annual, Crew, and Closing Pro cancellation links returned to the matching app cancellation route. This does not prove a settled payment, webhook delivery, paid entitlement activation, or refund. Those paths have automated regression coverage but were not exercised with a live charge.

Android build 13 contains no native billing integration. Its in-app web-purchase path remains suppressed, and free tools stay available. No external-purchase eligibility or new billing implementation is claimed.

## Production diagnostics

Read-only aggregate queries in the signed-in Cloudflare D1 console found two `camera_denied` PartSnap failures dated October 15 and one `photo_quality` failure dated October 30 in the preceding 30 days after excluding QA traffic classes and named QA sources. Their store values were null, so they cannot be attributed to build 13. No `scan_stage` records existed in that period before this live AI smoke test. Checkout-start records are not paid-conversion evidence.

The CLI OAuth token had Pages access but no D1 scope; the existing dashboard session provided the read-only diagnostic path without expanding token permissions.

## Release references and acceptance limits

- Review: https://github.com/frost831/poolens/pull/91
- Initial verified preview: https://79822947.poolens.pages.dev
- Initial CI: https://github.com/frost831/poolens/actions/runs/43497871898
- Production origin: https://app.splashlens.com

Remaining acceptance limits are physical camera/gallery behavior on a Play-installed phone, real field-photo accuracy, and a completed paid transaction. Do not describe this work as proving those outcomes. The APK remains build 13; the remotely loaded web bundle supplies these fixes.
