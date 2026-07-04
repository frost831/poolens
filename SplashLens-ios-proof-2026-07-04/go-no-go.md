# Go / No-Go - SplashLens ASC Subscription Finish - 2026-07-04

## Verdict

GO for PC verification of ASC subscription metadata/build attachment.

HOLD for App Review submission in this run.

## Completed

- Pulled `feature/splashlens-usage-alerts-dashboard` into a clean clone to avoid the dirty Dropbox checkout.
- Finished/verified `PartSnap Pro` subscription metadata in App Store Connect.
- Confirmed both subscriptions are `Ready to Submit`.
- Confirmed monthly US price is `$4.99` across `175 Countries or Regions`.
- Confirmed annual US price is `$39.00` across `175 Countries or Regions`.
- Created ASC iOS App Store version `1.0.2` in `Prepare for Submission`.
- Attached build `1.0.2 (11)` / build ID `0c44f71d-140b-450e-9815-4faf77c3d7fa`.
- Attached both `PartSnap Pro Annual` and `PartSnap Pro Monthly` to the next app version.
- Saved the ASC version page; final UI showed Save disabled and Add for Review enabled.
- Captured sanitized JSON readbacks and screenshots into this proof folder.

## Release Gate

- Git before ASC save: branch `feature/splashlens-usage-alerts-dashboard`, HEAD `9c7e062`, only proof folder untracked.
- Local iOS source settings:
  - `PRODUCT_BUNDLE_IDENTIFIER = com.splashlens.app`
  - `MARKETING_VERSION = 1.0.2`
  - `CURRENT_PROJECT_VERSION = 11`
  - `DEVELOPMENT_TEAM = 2XSLXV9H74`
  - `ITSAppUsesNonExemptEncryption = false`
- Permission strings inspected in `ios/SplashLens/Info.plist` for camera, microphone, and photo library.
- Native billing product IDs inspected in source:
  - `partsnap_pro_monthly`
  - `partsnap_pro_annual`
- ASC version readback confirms build `11` is `VALID`, `APP_STORE_ELIGIBLE`, and not expired.
- ASC subscription readback confirms both products have `submitWithNextAppStoreVersion: true`.

## Remaining

- App Review submission was intentionally not performed.
- Cloudflare Apple App Store Server API secrets were not verified or installed in this run.
- PC/user should verify production native entitlement behavior after secrets are installed.

## Evidence

- `asc-subscription-metadata.md`
- `asc-submission-readiness.md`
- `cloudflare-apple-secrets-status.md`
- `asc-subscription-group-ready-2026-07-04.png`
- `asc-monthly-product-ready-2026-07-04.png`
- `asc-monthly-pricing-2026-07-04.png`
- `asc-annual-product-ready-2026-07-04.png`
- `asc-annual-pricing-2026-07-04.png`
- `asc-app-version-build-subscriptions-saved-cropped-2026-07-04.png`
- `asc-app-version-subscriptions-saved-cropped-2026-07-04.png`
- `asc-app-version-1.0.2-build-readback-sanitized-2026-07-04.json`
- `asc-subscription-submit-with-next-version-readback-2026-07-04.json`
