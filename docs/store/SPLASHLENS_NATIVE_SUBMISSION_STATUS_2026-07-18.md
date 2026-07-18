# SplashLens Native Submission Status - 2026-07-18

## Source

- Branch: `feature/splashlens-usage-alerts-dashboard`
- Starting handoff commit: `6fbd171e0ff6578e743cd1d4449ca3619ab39478`
- Native refresh commit before store work: `82424988dd77ac47aab88869aef738a804b53c8c`

## Apple

Submitted to App Store review.

- App Store Connect app: SplashLens, Apple ID `6763644905`
- Bundle ID: `com.splashlens.app`
- Version/build submitted: `1.0.7` / `14`
- Reason for version bump: App Store Connect rejected new `1.0.6` builds because version `1.0.6` is already approved and its pre-release train is closed.
- IPA: `release-evidence/splashlens-ios-appstore-20260718-v1.0.7-build14/ios-export/SplashLens.ipa`
- IPA SHA-256: `830797bc1890130ef80b387680ba62147b7938d1724bee56537b156101004a17`
- Upload delivery UUID / build ID: `fe00d872-aa44-4021-b604-c66c04df4463`
- Processing state: `VALID`
- Build audience: `APP_STORE_ELIGIBLE`
- Review submission ID: `29d0e41e-452a-4122-99c2-4adc7b0a3df8`
- Review submission state after submit: `WAITING_FOR_REVIEW`

Release gate checks completed before submit:

- `xcodebuild archive` and App Store Connect export succeeded.
- `xcrun altool --validate-app` passed with no errors.
- Exported IPA plist verified `com.splashlens.app`, version `1.0.7`, build `14`, minimum iOS `17.0`, non-exempt encryption `false`, and camera/microphone/photo usage strings present.
- Exported IPA signing verified Apple Distribution identity for team `2XSLXV9H74`; entitlements verified `get-task-allow=false`.

## Google

Not submitted.

The current Android release candidate is still blocked by the release gate:

- Intended public Play package from current repo/docs: `com.splashlens.fieldtools`
- Current Android candidate: `versionCode 7`, `versionName 1.0.6`
- Current built AAB: `android-twa/app/build/outputs/bundle/release/app-release.aab`
- Current AAB SHA-256: `bf42d43742c7f6ee3f7b5f7298e9121dc7803001efb9da8bfd9a5147a3bfffd8`
- Signing check result: `jar is unsigned`
- Targeted filesystem search only found v7 artifacts labeled unsigned/not-upload:
  - `SplashLens-Field-Tools-1.0.6-v7-UNSIGNED.aab`
  - `SplashLens-Field-Tools-1.0.6-v7-UNSIGNED-NOT-UPLOAD.aab`
- Older signed fieldtools bundles exist through v6, but they do not include the current refresh.
- The open Play Console account showed SplashLens Field Tools as package `com.splashlens.app`; it did not expose the public/current `com.splashlens.fieldtools` app.

Do not upload the unsigned v7 AAB, and do not upload the `com.splashlens.fieldtools` build into the `com.splashlens.app` Play Console record. Google can proceed after the SplashLens upload keystore/password or a signed `com.splashlens.fieldtools` v7 AAB is available, and the Play Console account/app for `com.splashlens.fieldtools` is selected.
