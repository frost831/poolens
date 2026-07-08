# SplashLens Mac Handoff - Apple + Android Submission ASAP

Date: 2026-07-07

## Mission

Get the newest SplashLens web/PWA release wrapped, screenshot-checked, and submitted ASAP for both Apple App Store Connect and Google Play.

This handoff is for the Mac/operator working the native build and store-console steps.

## Source Of Truth

- Repo: `C:\Users\sales\Dropbox\Projects\poolens`
- Branch to pull: `feature/splashlens-usage-alerts-dashboard`
- Current pushed commit: `e59068c`
- Live app: `https://app.splashlens.com`
- iOS wrapper URL: `https://app.splashlens.com/?store=ios`
- Android wrapper URL: `https://app.splashlens.com/?store=android`

## What Is Live In The Web App

These markers are already live on `https://app.splashlens.com`:

- PartSnap proof packet drawer.
- Spa Pack Lane shortcut.
- PartSnap Proof shortcut.
- Owner dashboard demand tracking.
- Service worker cache: `splashlens-v16-store-dashboard-source-pages`.
- App JS version marker: `20260707-all7`.

## Apple / iOS

### IDs

- Bundle ID: `com.splashlens.app`
- Xcode project: `SplashLens.xcodeproj`
- Project generator source: `project.yml`
- App source: `ios/SplashLens/`
- Current project values:
  - `MARKETING_VERSION: 1.0.2`
  - `CURRENT_PROJECT_VERSION: 11`

### Required iOS Action

1. Pull latest branch:
   - `git checkout feature/splashlens-usage-alerts-dashboard`
   - `git pull origin feature/splashlens-usage-alerts-dashboard`
2. Bump iOS build before upload:
   - Recommended: `MARKETING_VERSION = 1.0.3`
   - Recommended: `CURRENT_PROJECT_VERSION = 12`
3. Regenerate/open Xcode project if needed from `project.yml`.
4. Archive a real App Store build.
5. Upload to App Store Connect / TestFlight.
6. Attach or confirm the build in ASC.
7. Update metadata using:
   - `docs/store/SPLASHLENS_ASO_REFRESH_2026-07-07.md`
8. Submit for review after screenshot and copy gates pass.

### iOS Screenshot Set

Capture from the real iOS wrapper, not desktop browser screenshots:

1. Field rescue home showing PartSnap + Connected Pool Network.
2. PartSnap mode / possible part workflow.
3. PartSnap proof packet drawer open.
4. Spa Pack Lane / hot tub troubleshooting result.
5. Connected Pool Network or Route Brain proof workflow.

### iOS Reviewer Path

1. Launch app.
2. Confirm no login is required.
3. Tap `PartSnap Proof`.
4. Confirm scanner/PartSnap mode opens.
5. Use a non-sensitive test image or safe mocked result if available.
6. Open proof packet drawer.
7. Confirm copy stays cautious:
   - possible match
   - reference only
   - verify before ordering
   - no diagnosis replacement
   - no manufacturer partnership claim

### iOS Billing Warning

The code has StoreKit hooks for:

- `partsnap_pro_monthly`
- `partsnap_pro_annual`

Do not make store copy imply native subscriptions are fully live unless ASC products are attached, priced, screenshot-ready, and review-safe. If uncertain, keep release copy focused on the free core app and field reference workflows.

## Google Play / Android

### IDs

- Public Play package: `com.splashlens.fieldtools`
- TWA project: `android-twa/`
- Current Gradle values:
  - `versionName "1.0.6"`
  - `versionCode 7`
- Current `android-twa/twa-manifest.json` values:
  - `appVersionName: 1.0.6`
  - `appVersionCode: 7`
  - `appVersion: 1.0.6`

### Required Android Action

1. Pull latest branch:
   - `git checkout feature/splashlens-usage-alerts-dashboard`
   - `git pull origin feature/splashlens-usage-alerts-dashboard`
2. Verify `android-twa/twa-manifest.json` before building:
   - Set `appVersionName` to `1.0.6`
   - Set `appVersionCode` to `7`
   - Set `appVersion` to `1.0.6`
3. Build signed AAB for `com.splashlens.fieldtools`.
4. Verify artifact:
   - Package is `com.splashlens.fieldtools`
   - Version code is `7`
   - Start URL is `https://app.splashlens.com/?store=android`
5. Upload to Google Play Console.
6. Update store listing using:
   - `docs/store/SPLASHLENS_ASO_REFRESH_2026-07-07.md`
7. Submit for review after screenshot and copy gates pass.

### Android Screenshot Set

Capture from the real Android TWA build:

1. Field rescue home.
2. PartSnap Proof / scanner mode.
3. Proof packet drawer open.
4. Spa Pack Lane.
5. Connected Pool Network / Route Brain.

Google Play feature graphic: use clean SplashLens branding, not a fake device screenshot with unreadable text.

## Store Copy

Use this file:

- `docs/store/SPLASHLENS_ASO_REFRESH_2026-07-07.md`

Do not invent stronger claims. Keep the copy around:

- Free field reference.
- Pool and spa techs.
- PartSnap assistance.
- Proof before ordering.
- Robots, automation, lights, salt, spa packs, chemical controllers.
- Reference only, not a diagnosis replacement.

## Hard No-Go Conditions

Do not submit if any of these are true:

- iOS build number is still `11`.
- Android AAB version code is not higher than the last submitted Play build.
- Android package is anything other than `com.splashlens.fieldtools`.
- Screenshots show stale App Store / Google Play badges, clipped text, or broken camera permission copy.
- Store copy implies guaranteed part fit, diagnosis, warranty authority, or official manufacturer partnership.
- Native subscription language is shown without store-product proof.

## Proof To Save Back To This Repo

After Mac/operator work, save evidence under a new dated folder:

- `release-evidence/splashlens-native-submit-2026-07-07/`

Include:

- iOS archive/upload proof.
- ASC build/version screenshot or sanitized readback.
- Android signed AAB filename and version proof.
- Play Console upload/submission screenshot or sanitized readback.
- Store screenshots used.
- Final go/no-go note.

Then commit and push back to:

- `feature/splashlens-usage-alerts-dashboard`

## Quick Final Check Before Submitting

- App opens.
- No account needed.
- PartSnap Proof opens.
- Spa Pack Lane opens.
- Proof drawer opens.
- Camera permission copy is clean.
- Store metadata matches ASO doc.
- Reviewer can understand the app in the first 3 screenshots.
