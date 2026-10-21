# SplashLens iOS App Store Submission - 2026-07-21

## Result

- App Store Connect app: SplashLens, Apple ID `6763644905`
- Bundle ID: `com.splashlens.app`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Submitted source commit: `63412e79db9b4a5cf4237a3968ed67c6e9f72ff3`
- App Store version submitted: `1.0.8`
- Build submitted: `15`
- Build ID / delivery UUID: `c1e9bd2b-be36-45af-8c03-96e197152967`
- App Store version ID: `39cd5096-b90b-4526-bb20-961d561b1655`
- Review submission ID: `e36eb61b-762e-4a13-94d1-201c3244b786`
- Review submission item ID: `ZTM2ZWI2MWItNzYyZS00YTEzLTk0ZDEtMjAxYzMyNDRiNzg2fDZ8ODg4NjQwNTY4`
- Final ASC state: `WAITING_FOR_REVIEW`
- Submitted date from ASC: `2026-07-21T16:21:31.096Z`

## Store Copy

- Promotional text: `Get off the pad faster, then turn the stop into a five-minute field lesson.`
- What's New: `Adds Field Learning OS workflows that turn real PartSnap misses, facility scenarios, and saved service proof into short field lessons with proof checks and review guidance. SplashLens remains a reference aid and does not replace manuals, codes, certification, or qualified judgment.`
- Reviewer notes saved through App Store Connect with the no-account review path, optional permission explanation, free-core wrapper note, and reference-aid boundaries.

## Screenshot Set

Display type: `APP_IPHONE_67`

- `01-partsnap-source-proof.png` - `1320 x 2868`, ASC screenshot ID `9489121f-a205-49fc-a1bc-e18d2b433a15`, state `COMPLETE`
- `02-field-learning-partsnap-lesson.png` - `1320 x 2868`, ASC screenshot ID `3ba0f05e-bc02-434e-a38d-a7b0fd095948`, state `COMPLETE`
- `03-cpo-scenario-answer-key.png` - `1320 x 2868`, ASC screenshot ID `4fa585a3-c884-4ee8-a5b0-659e16f41153`, state `COMPLETE`
- `04-service-proof-handoff.png` - `1320 x 2868`, ASC screenshot ID `249e9885-6f26-4b9f-bdc6-7afdac6f8341`, state `COMPLETE`

## Release Gate

- `git status --short --branch` showed the branch synced with `origin/feature/splashlens-usage-alerts-dashboard`.
- Contract tests passed: `node --test tests/checkout-safety.test.mjs tests/email-contract.test.mjs tests/paid-lane-lead-contract.test.mjs tests/refund-entitlement-contract.test.mjs` (`10` pass, `0` fail).
- `xcodebuild archive` succeeded for App Store archive.
- App Store export succeeded.
- `xcrun altool --validate-app` succeeded with no errors.
- `xcrun altool --upload-package --wait` succeeded.
- Exported IPA verified:
  - Bundle ID `com.splashlens.app`
  - Version `1.0.8`
  - Build `15`
  - Minimum iOS `17.0`
  - `ITSAppUsesNonExemptEncryption=false`
  - Camera, microphone, and photo usage descriptions present
  - `get-task-allow=false`
  - Apple Distribution team `2XSLXV9H74`
- IPA SHA-256: `9e418b8905ab9995f6b994fc9654c886bc5fdd2ade5ad334d97d043e2c7953c1`
- ASC build processing: `VALID`
- ASC build audience: `APP_STORE_ELIGIBLE`
- Live route smoke checks passed for:
  - `https://app.splashlens.com/?store=ios&mode=trainer&utm_source=field_learning_os`
  - `https://splashlens.com/field-learning-os`

## Public Listing

The public App Store lookup still reports live version `1.0.7` with `currentVersionReleaseDate=2026-07-21T05:14:21Z`. Version `1.0.8` is submitted and waiting for Apple review, so it is as close to live as ASC permits before approval.

## Evidence Files

- `SplashLens-1.0.8-build15.xcarchive`
- `ios-export/SplashLens.ipa`
- `ios-archive.log`
- `ios-export.log`
- `ios-validate.log`
- `ios-upload.log`
- `ios-build-valid.json`
- `asc-submit-splashlens-108.log`
- `asc-submit-final-1.0.8-15.json`
- `asc-screenshots/*.png`
