# Mac Handoff - SplashLens iOS/Android Parity + Feedback Loop

Date: 2026-07-15
Repo: C:\Users\sales\Dropbox\Projects\poolens
Branch: feature/splashlens-usage-alerts-dashboard

## Goal
Get App Store Connect and Google Play aligned around the same SplashLens release label and verify the new feedback loop in native wrappers.

## Current Truth
- Live App Store public lookup reports SplashLens version 1.0.4, bundle `com.splashlens.app`, released 2026-07-11.
- Local iOS candidate has been bumped to version 1.0.6 build 13.
- Local Android candidate is versionName 1.0.6 versionCode 7, package `com.splashlens.fieldtools`.
- Android release assembly passed on Windows with only Java 8 deprecation warnings.
- SplashLens web runtime has the new feedback loop; native wrappers should receive it because they load `https://app.splashlens.com`.

## Pull Latest
```bash
git checkout feature/splashlens-usage-alerts-dashboard
git pull --ff-only origin feature/splashlens-usage-alerts-dashboard
```

## iOS ASC Work
1. Open `SplashLens.xcodeproj`.
2. Confirm build settings:
   - Bundle ID: `com.splashlens.app`
   - Version: `1.0.6`
   - Build: `13`
3. Archive the app in Xcode.
4. Upload to App Store Connect.
5. In ASC, create/select the `1.0.6` app version if needed and attach build `13`.
6. Verify screenshots/metadata mention the current app positioning: PartSnap, Service Proof Passport, Facility Assist, scan/code lookup, and feedback loop. Keep claims conservative: reference aid, possible matches, manual/model/qualified verification required.
7. Submit for review or TestFlight review, depending on current ASC state.

## Google Play Work
1. Open Play Console for `com.splashlens.fieldtools`.
2. Confirm whether production is already versionName `1.0.6` / versionCode `7`.
3. If production is still older, upload the newest AAB from:
   `android-twa/app/build/outputs/bundle/release/`
4. If versionCode `7` is already used/live, do not re-upload the same code. Only update screenshots/release notes/metadata if needed.
5. Store listing should mention the feedback loop carefully: quick in-app feedback after scans and PartSnap helps improve the field reference.

## Native Smoke Test
On both platforms:
1. Launch app.
2. Confirm app loads `https://app.splashlens.com`.
3. Run PartSnap or scanner flow.
4. Confirm a small bottom prompt appears: `Did PartSnap help?` or `Did the scan help?`
5. Tap `Yes` and verify it closes.
6. Repeat in a fresh session or after clearing local storage, tap `Wrong / missing`, and confirm the detailed feedback form opens.
7. Confirm no app crash and no clipped text on iPhone and Android phone.

## Go / No-Go
- GO for web runtime: deployed and active after this handoff commit.
- GO for Android source build: local release assembly passed.
- ASC is NOT parity-current until build 13 / version 1.0.6 is uploaded and selected in App Store Connect.
- Google Play is parity-current only if Console shows versionName 1.0.6 / versionCode 7 in production.
