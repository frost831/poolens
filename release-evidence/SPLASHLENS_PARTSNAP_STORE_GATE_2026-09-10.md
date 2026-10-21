# SplashLens PartSnap Store Gate - 2026-09-10

Source:
- Repo: `https://github.com/frost831/poolens.git`
- Branch: `master`
- Pulled commit: `974f2681e94d3d4744077ba4c80b820baec649d4`
- Local release-prep changes are uncommitted in `/Users/macbookpro/poolens`.

Native wrappers:
- iOS wrapper URL: `https://app.splashlens.com/?store=ios` in `ios/SplashLens/ContentView.swift`.
- Android TWA host/start URL: `app.splashlens.com` / `/?store=android` in `android-twa/app/build.gradle` and `android-twa/twa-manifest.json`.
- iOS prepared version/build: `1.0.10 (17)`.
- Android prepared version: `1.0.10`, versionCode `11`, target SDK `36`.

Amplitude:
- Cloudflare Pages project `poolens` production secret list includes `AMPLITUDE_API_KEY: Value Encrypted`.
- GitHub CLI is authenticated for `frost831/poolens`, but `gh secret list --repo frost831/poolens` returned no repo secrets; the real key is present in Cloudflare Pages production secrets, not GitHub CI.
- `GET https://app.splashlens.com/api/amplitude-config` returned `enabled:true`, `status:"ready"`, `keyExposed:false`.
- `POST https://app.splashlens.com/api/events` with `app_open` returned `stored:true`, `amplitudeQueued:true`, `amplitudeConfigured:true`.
- `POST https://app.splashlens.com/api/events` with `screen_view` returned `stored:true`, `amplitudeQueued:true`, `amplitudeConfigured:true`.

Build/test:
- `npm test` passed: 55/55.
- `xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -resolvePackageDependencies` passed; no source packages.
- `xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -configuration Release -destination 'generic/platform=iOS' build CODE_SIGNING_ALLOWED=NO` passed.
- Built iOS Release bundle readback: bundle ID `com.splashlens.app`, version `1.0.10`, build `17`.
- iOS archive succeeded: `release-evidence/splashlens-native-store-20260910/SplashLens-1.0.10-build17.xcarchive`.
- iOS App Store export succeeded: `release-evidence/splashlens-native-store-20260910/ios-export/SplashLens.ipa`.
- Exported IPA readback: bundle ID `com.splashlens.app`, version `1.0.10`, build `17`, Apple Distribution certificate, Store provisioning profile, `get-task-allow=false`, `beta-reports-active=true`.
- `xcrun altool --validate-app` passed with no errors.
- `xcrun altool --upload-app` passed with no errors; Delivery UUID `28958bf8-eb54-4ef4-802e-a71e3671c229`.
- App Store Connect build readback: build `17`, processing state `VALID`, audience `APP_STORE_ELIGIBLE`, uploaded `2026-09-10T14:40:45-07:00`, non-exempt encryption `false`.
- App Store Connect version `1.0.10` was created, metadata/review notes were patched, five PartSnap-first screenshots completed processing, build `17` was attached, and the review submission was submitted.
- App Store Connect review submission readback: submission ID `97cab13f-6421-46a3-9cc1-1459a1afde5b`, state `WAITING_FOR_REVIEW`, submitted date `2026-09-10T21:45:30.18Z`.
- Android Gradle `bundleRelease` passed after setting local `JAVA_HOME`/Android SDK env and adding `android.useAndroidX=true`.
- Android output: `android-twa/app/build/outputs/bundle/release/app-release.aab`, 1.3 MB.
- Android manifest readback via `bundletool dump manifest`: package `com.splashlens.fieldtools`, versionCode `11`, versionName `1.0.10`, minSdk `21`, targetSdk `36`, launch activity `com.splashlens.fieldtools.LauncherActivity`.
- Android bundle validation via `bundletool validate` completed without bundle structure errors.
- Android release-gate signing readback: the new `app-release.aab` is unsigned and is not Play-uploadable.

Candidate screenshots:
- Apple candidate folder: `store-assets/app-store/iphone-6.9`
- Apple screenshot dimensions: `1290 x 2796`, PNG, no alpha.
- Google candidate folder: `store-assets/google-play/partsnap-20260910`
- Google phone screenshot dimensions: `1080 x 1920`, PNG, no alpha.
- Google feature graphic: `1024 x 500`, PNG, no alpha.

Candidate asset SHA-256:
- `store-assets/app-store/iphone-6.9/01-partsnap-first-home.png`: `f18ed5b868e3d39c9755ffa97d6b04c3ca7d0e182f63ce4b0bf3247e5b92fdbf`
- `store-assets/app-store/iphone-6.9/02-partsnap-scanner.png`: `cc2a8db36d55d353b81d47fe9d618e52568a2990a0e553b7e4ac23472a2727b4`
- `store-assets/app-store/iphone-6.9/03-code-lookup.png`: `f18ed5b868e3d39c9755ffa97d6b04c3ca7d0e182f63ce4b0bf3247e5b92fdbf`
- `store-assets/app-store/iphone-6.9/04-dosing.png`: `be0e4a94a922a646fa3b3c393677166612a062e6173a3aa9d29e92edaa24a2d8`
- `store-assets/app-store/iphone-6.9/05-service-proof.png`: `10203079177b33a0319f54dcaedc7ad55fd33917ca48388b873a825a1948d8a7`
- `store-assets/google-play/partsnap-20260910/feature-graphic-1024x500.png`: `b3dda69121651c30678de2d86c233748c9b2214b899f404bd5f645ebd1e74676`
- `store-assets/google-play/partsnap-20260910/phone-01-partsnap-first-home.png`: `d4bdc3b864310a8ff1dff12b288790d6a19ea94c9ea33eea9e149883d2634b31`
- `store-assets/google-play/partsnap-20260910/phone-02-partsnap-scanner.png`: `2ccec83d7fbdc417afe1f7455efd1be42979d196744f166ad9a609793784327a`
- `store-assets/google-play/partsnap-20260910/phone-03-code-lookup.png`: `d4bdc3b864310a8ff1dff12b288790d6a19ea94c9ea33eea9e149883d2634b31`
- `store-assets/google-play/partsnap-20260910/phone-04-dosing.png`: `f58644594249547937588688f9daeeee6d6fe77c1a7d7d1afcf8932f3cd7c72c`
- `store-assets/google-play/partsnap-20260910/phone-05-service-proof.png`: `fc3191e46484bf187679e23ae5edbc582c2dc2774c7efc7e950018fdd05bf644`

Store-metadata changes:
- App Store privacy draft now discloses Product Interaction and Diagnostics analytics.
- Google Play metadata now discloses product interaction analytics, diagnostics, and optional scanner photo/text processing.
- Release notes added at `app-store-connect/metadata/en-US/release_notes.txt`.
- App Store Connect API patch applied current description, promotional text, release notes, and App Review notes for version `1.0.10`.

Apple submitted:
- Version: `1.0.10`
- Build: `17`
- Build ID: `28958bf8-eb54-4ef4-802e-a71e3671c229`
- App Store version ID: `1b349f20-6ea5-4fee-9368-ba73e775db7e`
- Review submission ID: `97cab13f-6421-46a3-9cc1-1459a1afde5b`
- Review submission item ID: `OTdjYWIxM2YtNjQyMS00NmEzLTljYzEtMTQ1OWExYWZkZTVifDZ8ODkxMTY5NzU1`
- Final evidence: `release-evidence/splashlens-native-store-20260910/asc-submit-final-1.0.10-17.json`
- App Privacy note: local privacy-nutrition draft was updated for Product Interaction and Diagnostics analytics, but the App Store Connect App Privacy questionnaire was not editable from this Mac session. Direct ASC API probes for privacy resources returned `404 PATH_ERROR`/`NOT_FOUND`, and the open Chrome App Store Connect tab was at `login?targetUrl=%2Fapps&authResult=FAILED`.

Google blocker:
- Current Mac checkout can build the Android bundle, but cannot submit it to Play because the Play-required SplashLens upload keystore is not present on this Mac.
- Required key from prior successful Play submissions: `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`, alias `splashlens_upload`.
- Prior signed SplashLens bundles on this Mac prove the correct upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`.
- Play Console browser session is authenticated on the correct app and production track: developer ID `7017771963942604688`, app ID `4974110437390812521`, current active release `SplashLens 1.0.8 Android quality update`, versionCode `9`.
- Existing signed Dropbox artifacts include `SplashLens-Field-Tools-1.0.7-v8-fieldtools-FINAL-SIGNED.aab` and `SplashLens-Field-Tools-1.0.8-v9-fieldtools-FINAL-SIGNED.aab`, but there is no signed versionCode `11` artifact.
- Local Google API tooling is not available: `gcloud` is not installed, no Google ADC path was found, and no SplashLens Play service-account JSON was found in targeted local searches.
- Current unsigned AAB certificate check output: `jar is unsigned. Not a signed jar file`.
- No `splashlens-upload.keystore`, matching SplashLens `.jks`/`.keystore`, or SplashLens Play service-account JSON was found in the scanned local/Dropbox paths at the time of this evidence update.
- Do not upload an unsigned AAB to Play; Play will reject it and it is not a valid release artifact.
- The local route fix for `https://app.splashlens.com/data-deletion` must be deployed before using that clean deletion URL in Play Console. Until then, use `https://app.splashlens.com/data-deletion.html`.

Verdict:
- Apple App Review submission completed and is waiting for review.
- Google Play submission is blocked at the signing gate until the SplashLens upload keystore/password or a new already signed `com.splashlens.fieldtools` versionCode `11` AAB is available.
