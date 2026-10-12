# SplashLens Android SL-5 Build Report - 2026-10-12

## Version

- Package: `com.splashlens.fieldtools`
- Version name: `1.0.11`
- Version code: `12`
- Track target: `internal`

Repo evidence in `docs/store/GOOGLE_PLAY_LAUNCH_PACKET_SPLASHLENS_2026-05-28.md` records `1.0.10` / `versionCode 11` as accepted by Play for review on October 12, so this candidate increments above the latest repo-recorded Play code.

## Tests

- `ANDROID_HOME=/Users/macbookpro/Library/Android/sdk ./gradlew test` - PASS
- Result detail: `testDebugUnitTest` and `testReleaseUnitTest` were `NO-SOURCE`; Gradle build completed successfully.

## Bundle Build

- `ANDROID_HOME=/Users/macbookpro/Library/Android/sdk ./gradlew bundleRelease` - PASS
- Generated bundle: `android-twa/app/build/outputs/bundle/release/app-release.aab`
- SHA-256: `654b5d7edf89dd1d286751e2699793b0811624467f7246678183054fa695d42f`

## Signing Gate

`jarsigner -verify -verbose -certs android-twa/app/build/outputs/bundle/release/app-release.aab` reports:

```text
jar is unsigned.
```

No `android-twa/key.properties`, `.keystore`, `.jks`, `.p12`, or `.p8` file is present in this isolated worktree. The Gradle file now supports ignored local upload-key signing through `android-twa/key.properties`, but this run did not have the upload key material available here. Do not upload this generated AAB to Play.

## Screenshots

Screenshots were captured from the local current web build in Android store mode at 1080 x 1920:

- `screenshots/phone-01-partsnap.png`
- `screenshots/phone-02-counter-mode.png`
- `screenshots/phone-03-spanish.png`
- `screenshots/phone-04-closing.png`

PartSnap was captured with Chrome's fake camera device so no customer or credential-bearing image entered the screenshot asset.
