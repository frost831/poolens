# Mac Codex Native Execution - 2026-10-05

Scope: MAC-01 through MAC-05 from `docs/codex/MAC_CODEX_NATIVE_TICKETS_2026-10-05.md`.

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
  - iOS `MARKETING_VERSION=1.0.11`, `CURRENT_PROJECT_VERSION=8`
  - Android `versionName=1.0.1`, `versionCode=2`

## Verification

- `node --check js/app.js` passed.
- `plutil -lint ios/SplashLens/Info.plist` passed.
- `npm test -- --runInBand` passed: 132 tests.
- Unsigned iOS simulator build passed:
  - Command: `xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /Users/macbookpro/poolens-mac-native-2026-10-05/build/DerivedData CODE_SIGNING_ALLOWED=NO build`
  - Built bundle ID: `com.splashlens.app`
  - Built version/build: `1.0.11 (8)`
  - Built camera string: `SplashLens uses the camera only when you choose PartSnap or scanner tools to read pool and spa equipment labels, markings, displays, and test-strip photos for field reference.`
  - Built photo string: `SplashLens can use a pool or spa equipment photo you select as a gallery fallback when camera access is denied or unavailable.`
- Source audit found no native StoreKit, Play Billing, `splashlensNativeBilling`, or `intent://billing` hooks in `ios/`, `android-twa/`, or `js/app.js`.

## Blocked / Not Sent

- No TestFlight upload was attempted. App Store Connect redirected to Apple Account login before metrics/export or upload work could continue.
- No Google Play internal build/upload was attempted. The host has no Java runtime available, so Gradle cannot run:
  - `/usr/libexec/java_home -V` and `java -version` both report no Java runtime.
- No official store metrics CSV was exported. ASC was unavailable after login expiry; Play Console was not open/authenticated. No metrics were fabricated.
- No web, Stripe, site, PWA worker, or PC backlog work was implemented.
