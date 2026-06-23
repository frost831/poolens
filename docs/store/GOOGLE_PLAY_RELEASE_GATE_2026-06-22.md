# Google Play Release Gate - SplashLens 1.0.2

Date: 2026-06-22

## Build

- Platform: Google Play / Android TWA
- App: SplashLens Field Tools
- Package: `com.splashlens.fieldtools`
- Version: `3 (1.0.2)`
- Final signed AAB: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.2-v3-fieldtools-final-signed.aab`
- SHA-256: `31DB557764A94760A2D6288068AFFAE5C120330151AECBB760B1C1369E73B562`

## Fixes Made Before Submission

- Corrected Android `applicationId`, namespace, TWA package, Java package declarations, and manifest component names from old `com.splashlens.app` to existing Play package `com.splashlens.fieldtools`.
- Corrected `/.well-known/assetlinks.json` to `com.splashlens.fieldtools`.
- Removed deprecated source manifest package usage and made app/activity/service names explicit.
- Updated bundled raw web manifest copy to match the public manifest wording and PartSnap Scanner shortcut.
- Removed visible store-wrapper wording that described PartSnap Pro as a paid web scanner upgrade.
- Kept store wrapper free-core. Store-mode scan-limit path did not expose checkout links or prices in browser smoke.

## Verification

- `cmd /c gradlew.bat clean bundleRelease`: passed.
- `jarsigner` signing: passed.
- `jarsigner -verify -verbose -certs`: certificate output returned for final AAB.
- JSON parse: `manifest.json`, `android-twa/twa-manifest.json`, `android-twa/app/src/main/res/raw/web_app_manifest.json`, and `.well-known/assetlinks.json` all parse.
- ESM parse/import: Cloudflare Pages functions passed for scan, checkout, checkout success, events, PartSnap feedback, and scan entitlement.
- Live production app deploy: completed to `poolens` production branch.
- Live HTTP:
  - `https://app.splashlens.com/`: 200
  - `https://app.splashlens.com/?store=android`: 200
  - `https://app.splashlens.com/.well-known/assetlinks.json`: 200
  - `https://app.splashlens.com/manifest.json`: 200
  - `https://app.splashlens.com/sitemap.xml`: 200
- Live assetlinks:
  - Found `com.splashlens.fieldtools`.
  - Old `com.splashlens.app` not present.
- Browser smoke:
  - Mobile 390px and tablet 768px loaded with no console errors.
  - PartSnap visible.
  - Offline manual lookup messaging visible.
  - Paid web scanner wording/prices not visible in store launch surface.
- API boundary:
  - `/api/scan` without allowed Origin returned `403 Origin not allowed`.
  - `/api/scan` with allowed Origin but no image returned `400 No image provided`.

## Go / No-Go

No-Go for final submission until the Play Console draft is replaced with the final AAB above.

Reason: the Play Console draft previously accepted an earlier corrected `fieldtools` AAB before the final assetlinks/raw-manifest/store-copy fixes. Browser control timed out while attempting to replace the draft upload. Do not submit the current Play draft unless the artifact name/hash shown in Play matches:

`SplashLens-Field-Tools-1.0.2-v3-fieldtools-final-signed.aab`

`31DB557764A94760A2D6288068AFFAE5C120330151AECBB760B1C1369E73B562`

## Exact Next Action

1. In Play Console release draft, remove the currently uploaded AAB if it is not the final file.
2. Upload `SplashLens-Field-Tools-1.0.2-v3-fieldtools-final-signed.aab`.
3. Paste the release notes from `GOOGLE_PLAY_PARTSNAP_RELEASE_2026-06-22.md`.
4. Preview release.
5. Confirm there are no package, deep-link, data safety, or policy warnings.
6. Submit only after that preview is clean.
