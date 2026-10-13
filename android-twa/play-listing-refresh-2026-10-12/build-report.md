# SplashLens Android SL-5 Build Report - 2026-10-13

## Version

- Package: `com.splashlens.fieldtools`
- Version name: `1.0.11`
- Version code: `12`
- Track target: `internal`

Repo evidence in `docs/store/GOOGLE_PLAY_LAUNCH_PACKET_SPLASHLENS_2026-05-28.md` records `1.0.10` / `versionCode 11` as accepted by Play for review on October 12, so this candidate increments above the latest repo-recorded Play code.

## Tests

- `GRADLE_USER_HOME=/private/tmp/poolens-gradle-home ANDROID_HOME=/Users/macbookpro/Library/Android/sdk ./gradlew test` - PASS on 2026-10-13
- Result detail: `testDebugUnitTest` and `testReleaseUnitTest` were `NO-SOURCE`; Gradle build completed successfully.
- `node tools/aso-length-check.mjs` - PASS on 2026-10-13
- `node --test tests/android-release-association.test.mjs tests/aso-length-check.test.mjs` - PASS on 2026-10-13; 6 tests passed.

## Bundle Build

- `GRADLE_USER_HOME=/private/tmp/poolens-gradle-home ANDROID_HOME=/Users/macbookpro/Library/Android/sdk ./gradlew bundleRelease` - PASS on 2026-10-13
- Generated bundle: `android-twa/app/build/outputs/bundle/release/app-release.aab`
- SHA-256: `ef6c5b30ffb978fb3142841d74e418b5988a3aae546eaffc164931528b868f05`

## Signing Gate

`jarsigner -verify -verbose -certs android-twa/app/build/outputs/bundle/release/app-release.aab` reports:

```text
jar is unsigned.
```

No `android-twa/key.properties`, `.keystore`, `.jks`, `.p12`, or `.p8` file is present in this isolated worktree. The Gradle file supports ignored local upload-key signing through `android-twa/key.properties`, but this run did not have the upload key material available here and the bridge instruction says not to sign Android independently. Do not upload this generated AAB to Play.

## Screenshots

Screenshots were captured from the local current web build in Android store mode at 1080 x 1920:

- `screenshots/phone-01-partsnap.png`
- `screenshots/phone-02-counter-mode.png`
- `screenshots/phone-03-spanish.png`
- `screenshots/phone-04-closing.png`

PartSnap was captured with Chrome's fake camera device so no customer or credential-bearing image entered the screenshot asset.
