# SplashLens iOS Build Map - June 22, 2026

## Repository

- Repo path: `/Users/macbookpro/Frost-iOS/poolens`
- Remote: `https://github.com/throttleshare/poolens.git`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Source commit before local build/version edits: `05424e20385e46efb5d85d0ba764d98e4fdc9aae`
- Local change made on Mac: `SplashLens.xcodeproj/project.pbxproj`
  - `CURRENT_PROJECT_VERSION`: `8`
  - `MARKETING_VERSION`: `1.0.1`

## Xcode Project Facts

- Project: `SplashLens.xcodeproj`
- Bundle ID: `com.splashlens.app`
- Team: `2XSLXV9H74`
- iOS deployment target: `17.0`
- Web wrapper URL: `https://app.splashlens.com/?store=ios`
- Wrapper source: `ios/SplashLens/ContentView.swift`

## Version Note

The handoff requested version `1.0` with an incremented build. Apple validation rejected `1.0 (8)` because the `1.0.0` train is closed and the previously approved public version is already `1.0`.

Evidence: `logs/altool-validate-build8.log`

The uploadable build is therefore:

- Version: `1.0.1`
- Build: `8`

## Build Artifacts

- Simulator build command: `xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -configuration Release -destination 'generic/platform=iOS Simulator' -derivedDataPath build/DerivedData-sim build`
- Archive: `build/archives/SplashLens-1.0.1-8.xcarchive`
- Exported IPA: `build/export/SplashLens-1.0.1-8/SplashLens.ipa`
- IPA size: `140K`

## Signing And Bundle Inspection

- Distribution signing authority: `Apple Distribution: Joshua Frost (2XSLXV9H74)`
- Provisioning profile: `iOS Team Store Provisioning Profile: com.splashlens.app`
- Profile UUID: `1898b6af-59b9-4414-8502-c84805ca0e8b`
- Profile expiration: `2027-05-16 16:43:55 +0000`
- `get-task-allow`: `false`
- `beta-reports-active`: `true`
- `ITSAppUsesNonExemptEncryption`: `false`

## App Store Connect / TestFlight

- App Store Connect app ID: `6763644905`
- Current live App Store version at lookup time: `1.0`, `READY_FOR_SALE`
- Validation log: `logs/altool-validate-1.0.1-build8.log`
- Upload log: `logs/altool-upload-1.0.1-build8.log`
- Delivery UUID: `22440ad7-c45e-4f47-900c-2d5030ae898e`
- Uploaded bytes: `143704`
- Uploaded date from App Store Connect: `6/22/26, 9:44:24 PM`
- Build status: `VALID`
- Import status: `VALID`
- App Store Connect presence: `true`
- Audience type: `APP_STORE_ELIGIBLE`
- Expiration: `9/20/26, 9:44:24 PM`

No App Review submission was performed from this Mac pass.

## June 23 Character-Cleanup Build

After the live character-cleanup release, the native wrapper was updated to avoid stale WKWebView cache on launch:

- Wrapper request cache policy: `.reloadIgnoringLocalCacheData`
- Version: `1.0.1`
- Build: `9`
- Archive: `build/archive/SplashLens-1.0.1-9.xcarchive`
- Exported IPA: `build/export/SplashLens-1.0.1-9/SplashLens.ipa`
- IPA size: `140K`

Final IPA inspection:

- Bundle ID: `com.splashlens.app`
- Team: `2XSLXV9H74`
- iOS deployment target: `17.0`
- Distribution signing authority: `Apple Distribution: Joshua Frost (2XSLXV9H74)`
- Provisioning profile: `iOS Team Store Provisioning Profile: com.splashlens.app`
- Profile UUID: `1898b6af-59b9-4414-8502-c84805ca0e8b`
- `get-task-allow`: `false`
- `beta-reports-active`: `true`
- `ITSAppUsesNonExemptEncryption`: `false`

App Store Connect / TestFlight:

- Apple validation: `VERIFY SUCCEEDED with no errors`
- Upload result: `UPLOAD SUCCEEDED with no errors`
- Delivery UUID: `c5b4aae5-b5bb-4b40-b9a1-dd3c2e994e08`
- Uploaded bytes: `143698`
- Uploaded date from App Store Connect: `6/23/26, 1:50:42 PM`
- Build status: `VALID`
- Import status: `VALID`
- App Store Connect presence: `true`
- Audience type: `APP_STORE_ELIGIBLE`
- Expiration: `9/21/26, 1:50:42 PM`

No App Review submission was performed for build `1.0.1 (9)`.

## June 24 Report UI Polish Web Payload

The report-polish pass did not change the native wrapper after build `1.0.1 (9)`. No new native archive or IPA was created.

Reason: build `1.0.1 (9)` already loads the live wrapper URL `https://app.splashlens.com/?store=ios` and includes the native cache-policy fix (`.reloadIgnoringLocalCacheData`). The report polish was deployed to the live web payload consumed by that TestFlight build.

Production web deployment:

- Final deployment URL: `https://b20d395d.poolens.pages.dev`
- Production domain: `https://app.splashlens.com`
- Service worker cache key: `splashlens-v9-report-polish`
- Live `/api/events` probe: `{"ok":true,"stored":true,"alertQueued":false,"emailConfigured":true}`

Live audit evidence:

- `output/release-gate-2026-06-23/live-v9-home.png`
- `output/release-gate-2026-06-23/live-v9-report-top.png`
- `output/release-gate-2026-06-23/live-v9-report-proof.png`
- `output/release-gate-2026-06-23/live-v9-partsnap.png`
- `output/release-gate-2026-06-23/live-v9-error-e05-expanded.png`
- `output/release-gate-2026-06-23/live-v9-more-store.png`

Current TestFlight/App Store Connect build remains:

- Version: `1.0.1`
- Build: `9`
- Delivery UUID: `c5b4aae5-b5bb-4b40-b9a1-dd3c2e994e08`
- Last verified status: `VALID`, `APP_STORE_ELIGIBLE`, present on App Store Connect.
