# Mac Codex Native Execution - 2026-10-05

Scope: MAC-01 through MAC-05 from `docs/codex/MAC_CODEX_NATIVE_TICKETS_2026-10-05.md`.

## Resumed Testing Status

The sections below retain the earlier build/export snapshot. This section supersedes its release blockers after PC deployment `bd83d0c`:

- PC deployed the gallery/external-upgrade hooks and cache `splashlens-v23-native-gallery`; live script uses `v=20261005-native-gallery`. Mac synced that published revision without modifying PC backend/site/worker work. Native files are unchanged from the audited candidates.
- Distribution export now succeeded: `/Users/macbookpro/poolens-mac-release-2026-10-05/ios-export-resume/SplashLens.ipa`, SHA256 `d545602cba4ca06d6d3c97b8aafb22192c45057b945fef6fc99c8bba7cb37de4`. Exported app identity is `com.splashlens.app`, `1.0.11 (18)`, Apple Distribution team `2XSLXV9H74`; codesign verification passes, `get-task-allow=false`, `beta-reports-active=true`, permission strings and active App Store profile match. No StoreKit or third-party billing framework is linked. No upload was attempted.
- Integrated regression suite passed all 195 tests with browser integration enabled, without skips. The new CSP regression raises that total to 196.
- **New live bug found and corrected locally:** `fetch(dataUrl)` is blocked by production `connect-src`, causing native selection to reopen the browser picker. Installed simulator denial -> Pick Gallery -> actual PHPicker selection reproduced this second-picker failure. The adapter now decodes base64 locally with `atob`/`Uint8Array`/`Blob`; no CSP relaxation or worker changes. A new regression prohibits network fetch during native image decoding.
- Browser test substituted only the local adapter script under unchanged production response headers: one 512x512 frame, one analysis-path invocation, one `partsnap_gallery_picked`. Backend analysis was isolated; this is not an AI accuracy test. **PC must deploy this correction and invalidate its script/cache version before installed-native gallery acceptance can pass.**
- Fresh comparison confirms web lookup offer has checkout; iOS/Android have only external handoff. This technical behavior does not establish store-policy eligibility.
- **Release-policy hold:** PC packet `docs/ops/native-web-bridge-readiness-2026-10-05.md` explicitly holds native external digital-upgrade CTAs. ASC readback shows availability in 175 territories, not US-only. The current native link is not gated by trustworthy storefront/program eligibility. Apple permits a US-storefront exception but restricts other storefronts; Google requires applicable program enrollment and requirements. Safari/Chrome opening alone is not approval. Sources: https://developer.apple.com/app-store/review/guidelines/ and https://support.google.com/googleplay/android-developer/answer/9858738?hl=en.
- No IAP, regional enrollment, agreement acceptance, territory change, or production deployment was performed. Resolve the purchase-link hold with the user/PC before uploading, while preserving FreeCore/manual fallback.
- Android existing upload key is still not located on this Mac; unrelated app keys must not be substituted. Android signing/device checks remain open.

New evidence is retained privately alongside the earlier logs: `regression-browser-csp-fix.log`, `ios-export-resume/`, `asc-territories-resume.json`, `ios-native-csp-second-picker.png`, and the resumed browser/simulator receipts.

## Implemented

- iOS permission strings now describe user-initiated pool/spa equipment label, marking, display, and test-strip scanning.
- iOS photo-library string now describes the gallery fallback when camera access is denied or unavailable.
- iOS WKWebView injects `window.SplashLensNative.pickGalleryPhoto()` and returns one selected image as `{ name, type, dataUrl }`.
- PartSnap camera-deny UI now calls the native gallery bridge first, then falls back to the browser photo picker.
- PartSnap deny/gallery events include `partsnap_camera_requested`, `partsnap_camera_granted`, `partsnap_camera_denied`, and `partsnap_gallery_picked`.
- Store wrapper mode still starts from `?store=ios` / `?store=android`.
- Native store upgrade surfaces avoid in-wrapper Stripe and IAP. They open `https://splashlens.com/?upgrade=splashlens-pro` in Safari/Chrome.
- Android TWA declares `CAMERA` and includes camera/photo-picker rationale strings. It does not request broad media-library access.
- Native versions bumped:
  - iOS `MARKETING_VERSION=1.0.11`, `CURRENT_PROJECT_VERSION=18`; ASC currently has `1.0.10 (17)`.
  - Android `versionName=1.0.9`, `versionCode=10`, target SDK `36`; Play currently has `1.0.8` / code `9`.
- Native gallery messages are restricted to the trusted HTTPS main frame; concurrent requests reject with `gallery_busy`. Selected images, including HEIC, are normalized to JPEG at maximum dimension 1600 pixels. Cancel/busy does not reopen a browser picker.
- Android app/deep links retain `store=android`. Added AndroidX Gradle configuration required by the existing project.

## Verification

- `node --check js/app.js` passed.
- `plutil -lint ios/SplashLens/Info.plist` passed.
- `npm test` passed: 137 tests, including native Promise correlation, cancellation/busy handling, browser fallback, and single external upgrade handoff.
- `npm run partsnap:benchmark` passed all deterministic metadata-ranking gates; this is not field CV accuracy validation.
- Unsigned iOS simulator build passed:
  - Command: `xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /Users/macbookpro/poolens-mac-release-2026-10-05/SimulatorDerivedData CODE_SIGNING_ALLOWED=NO build`
  - Built bundle ID: `com.splashlens.app`
  - Built version/build: `1.0.11 (18)`
  - Built camera string: `SplashLens uses the camera only when you choose PartSnap or scanner tools to read pool and spa equipment labels, markings, displays, and test-strip photos for field reference.`
  - Built photo string: `SplashLens can use a pool or spa equipment photo you select as a gallery fallback when camera access is denied or unavailable.`
- Source audit found no native StoreKit, Play Billing, `splashlensNativeBilling`, or `intent://billing` hooks in `ios/`, `android-twa/`, or `js/app.js`.
- Device archive also succeeded and passed codesign verification. Final bundle ID/version/strings are correct. This archive is development-signed with `get-task-allow=true`, not an upload-ready IPA.
- No bundled privacy manifest was found; no third-party SDK or native required-reason API use was added. Exported IPA and App Store validation still need checking before upload.
- The simulator rendered the real live shell. Browser QA simulated camera denial/native photo selection: fallback UI, lighting tip/events, canvas image and one analysis invocation worked; upgrade opened a separate browser tab while retaining the store wrapper URL. Backend calls were unavailable in this isolated test, not an actual AI scan or installed-device acceptance.
- Isolated iOS simulator QA compiled the exact production `ContentView.swift` with a test-only button: actual PHPicker selection returned `image/jpeg`, `512x512`, `splashlens-gallery.jpg`, and rendered in WKWebView. Evidence: `ios-native-gallery-pass.png`. The QA app is separate and is not shipped.
- Fresh browser comparison: manual lookup upgrade HTML contains checkout in web mode, no checkout in iOS/Android modes, and external handoff in both store modes. Console failures were only the test server's intentionally unavailable `/api/events` requests.
- Android `bundleRelease` / `assembleDebug` succeeded. Official bundletool validation passed on the final AAB. Manifest confirms package/version/target SDK/CAMERA, no Billing or broad media permission; no native `.so` payload was found.
- Final AAB SHA256: `26dff5ec506ff7dab3e15d34b3789ae4db68768c40b694acf0c69f23fa41d687`. It is unsigned.

## Official Store Metrics

- Official Google Play Statistics install-event CSV exported, available rows 2026-09-07 through 2026-10-03. Selection extended through October 4, but no missing row was invented.
- Original CSV SHA256: `4273e54af93c669c64588a21bc8ef39696f83da987db866b66bf4e4ebf95b1c9`.
- Import-ready file: `exports/store-metrics/google-play-installs-2026-10-05.csv`. Existing importer dry-run accepted 27 records, using only all-countries totals rather than double-counting the overlapping US dimension. SHA256: `835e7c6508eef14f0c15ebb9b09c57448c3936d669471174924840632189d4b6`.
- These private metrics are ignored because the repository is public. No production import was performed; PC owns that step.
- ASC one-time snapshot `2726df74-cb4b-45d5-bcd2-443afc73d588` was accepted. Report definitions exist, but downloads/crashes instances are not yet available. No Apple CSV or zeros were fabricated.
- PC follow-up: actual ASC SKU is `com.splashlens.app`; the PC importer filters `splashlens-ios-2026`. Mac did not change the importer.

## Blocked / Not Sent

MAC-04 is **blocked, not complete**. No TestFlight, Play internal, App Review, website deployment, or production import was sent.

1. Matching web hooks must land first, per MAC-04. Live app JavaScript still lacks the native gallery adapter/external upgrade helper and contains older native-billing hooks. PC must integrate these narrow hooks, reconcile current master, and publish its cache/version invalidation. Mac did not edit site, Stripe/backend, PWA workers, or the PC backlog.
2. iOS distribution export waited at the existing private key's macOS access prompt. Computer Use refused access to `com.apple.SecurityAgent`; the user must handle that prompt. The stalled export was stopped, preserving the archive. A fresh ACTIVE App Store profile was created using the existing current distribution certificate; no certificate was created or revoked. Re-export and audit the IPA's distribution signing, entitlements, permission strings, privacy, and identity before validation/upload.
3. The existing Android upload keystore is not on this Mac. Documented PC path: `C:\\Users\\sales\\.keystores\\splashlens\\splashlens-upload.keystore`, alias `splashlens_upload`. Securely provide the existing key/credentials; do not generate a replacement. Sign, audit, and verify the accepted identity before internal upload.
4. Installed-device acceptance remains required after live hooks land: fresh camera prompt, denial to gallery to actual upload, offline shell/manual search, store CTA hiding, and external browser handoff. No Android test device/emulator is available on this Mac.

## Local Evidence

Worktree: `/Users/macbookpro/poolens-mac-native-2026-10-05` on `mac/native-tickets-2026-10-05`, based on docs commit `91857ea`.

Evidence: `/Users/macbookpro/poolens-mac-release-2026-10-05`, including build/test logs, ASC readbacks, Android final manifest, original CSV, importer dry-run, simulator screenshot, `SplashLens-1.0.11-18.xcarchive`, and `SplashLens-1.0.9-v10-UNSIGNED.aab`. Credentials/profiles, metrics, and build products are not committed.
