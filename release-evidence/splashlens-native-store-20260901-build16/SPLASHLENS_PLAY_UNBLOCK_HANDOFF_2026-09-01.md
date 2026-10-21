# SplashLens Google Play Unblock Handoff - 2026-09-01

Scope: SplashLens Android / Google Play release-prep only. No Play Console state was changed.

Re-check note, 2026-09-01: `bundletool dump manifest` reconfirmed package
`com.splashlens.fieldtools`, version code `8`, version `1.0.9`, and target SDK
`36`. `jarsigner -verify` reconfirmed the current candidate has no JAR
signature. Historical signed fieldtools AABs still resolve to upload certificate
SHA-256 `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`.

Copy-smoke correction, 2026-09-01: browser-level live smoke of
`https://app.splashlens.com/?store=ios` and
`https://app.splashlens.com/?store=android` showed visible `Repeat Issue Watch`
and no visible `Callback Risk`, `Service Proof Passport`, `Service Proof OS`,
`Team Proof OS`, `proof layer`, Stripe, or checkout wording. The live deployed
store-mode UI did not expose visible `Saved job history` on the first app
surface, so local source copy was tightened in `index.html` and `js/app.js`.
`npm test` now passes `22/22`; the live web/native shell will need a rebuilt
asset/deploy pass before that live smoke flips green.

## Current Candidate

- Package: `com.splashlens.fieldtools`
- Version: `1.0.9`
- Version code: `8`
- Target SDK: `36`
- AAB: `release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab`
- AAB SHA-256: `42e61c5e432b51653ecef93ce47823663c8e9864e8744f3dcf7292c501080f71`
- Status: built successfully, but unsigned. It cannot be uploaded to Play in its current state.

## Play Lane

- Correct Google Play developer account: `ThrottleShare`
- Developer account ID from prior evidence: `7017771963942604688`
- Play Console app ID from prior evidence: `4974110437390812521`
- Correct package: `com.splashlens.fieldtools`
- Do not use the old `com.splashlens.app` Google Play package; prior evidence says that package belongs to the wrong personal-account lane.

## Upload Key Evidence

The repo contains historical signed AABs for version code `1`:

- `play-store-artifacts/SplashLens-Field-Tools-1.0.0-v1-com.splashlens.fieldtools-signed.aab`
- `play-store-artifacts/SplashLens-Field-Tools-1.0.0-v1-signed.aab`

Both historical AABs are signed by the same certificate:

- Subject: `CN=SplashLens, OU=Mobile, O=Deer Track Design LLC, L=Bloomington, ST=IL, C=US`
- SHA-256 fingerprint: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`

That fingerprint matches the documented SplashLens upload-key fingerprint and the local `assetlinks.json` entry for `com.splashlens.fieldtools`.

## Missing Inputs

The private signing material was not found on this Mac. Prior evidence says it was intentionally stored outside Git:

- Keystore: `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`
- Password note: `C:\Users\sales\.keystores\splashlens\splashlens-upload-key-DO-NOT-COMMIT.txt`
- Alias from `android-twa/twa-manifest.json`: `splashlens_upload`

Required input before upload:

- The SplashLens upload keystore file for fingerprint `9F:B4:69:...:2E:96`.
- The keystore password.
- The key password, if different from the keystore password.
- Play Console access to ThrottleShare / app `4974110437390812521`, or Play Developer API credentials for that app.

Do not commit the keystore, passwords, or service account JSON.

## Next Commands After Key Material Is Available

Use a secure local path outside the repo, then sign the built AAB:

```bash
cd /Users/macbookpro/SplashLens-asc-subscription-finish-2026-07-04
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export SPLASHLENS_KEYSTORE=/secure/local/path/splashlens-upload.keystore
export SPLASHLENS_KEY_ALIAS=splashlens_upload
"$JAVA_HOME/bin/jarsigner" -verbose -sigalg SHA384withRSA -digestalg SHA-384 -keystore "$SPLASHLENS_KEYSTORE" release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab "$SPLASHLENS_KEY_ALIAS"
"$JAVA_HOME/bin/jarsigner" -verify -verbose -certs release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab
```

After signing, confirm the fingerprint still matches Play's upload certificate:

```bash
unzip -p release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab META-INF/SPLASHLE.RSA | openssl pkcs7 -inform DER -print_certs -outform PEM | openssl x509 -noout -fingerprint -sha256 -subject -issuer -dates
```

Then run the release gate before any upload:

```bash
shasum -a 256 release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home bundletool dump manifest --bundle=release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab --xpath=/manifest/@package
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home bundletool dump manifest --bundle=release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab --xpath=/manifest/@android:versionCode
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home bundletool dump manifest --bundle=release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v8-release.aab --xpath=/manifest/@android:versionName
```

## Verdict

The `1.0.9` / versionCode `8` AAB is package-correct and API-36-ready, but it is not uploadable until it is signed with the existing SplashLens upload key or Google Play accepts an upload-key reset. Local store copy now matches the current Saved Job / Repeat Issue language, but live store-mode smoke still needs a rebuilt/deployed asset before final Play submission.

## Deep Signing Search Addendum - 2026-09-01

Read-only search scope: `/Users/macbookpro`, including accessible Dropbox/CloudStorage paths, with dependency/build/cache folders excluded where needed to avoid false positives. No passwords, service-account JSON contents, `.p8` contents, or secret values were printed.

Verified keystore/property search result:

- No local SplashLens upload keystore file was found under the searched Mac paths.
- No local SplashLens signing-property file was found under the searched Mac paths.
- Additional app-state search under `/Users/macbookpro/.codex`, `/Users/macbookpro/.agents`, and `/Users/macbookpro/Library/CloudStorage/Dropbox/Backups/PC-Current/AppState` found SplashLens memory/docs only, plus unrelated GrainBrief backup signing material. It did not find a SplashLens keystore or SplashLens signing-property file.
- Non-SplashLens keystores found include Lumenly, MarkSet, Bay2Course, DoseGlass, Plowshare, HyperPulse debug, ThrottleShare, and GrainBrief backup keys. These do not satisfy the SplashLens key search based on filename/project context and were not used.
- `android-twa/.gitignore` ignores `splashlens-upload.keystore`.
- `android-twa/twa-manifest.json` confirms signing key metadata:
  - Package: `com.splashlens.fieldtools`
  - Keystore path from prior Windows lane: `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`
  - Alias: `splashlens_upload`

New signed-artifact evidence found in Dropbox:

- `/Users/macbookpro/Library/CloudStorage/Dropbox/Projects/poolens/play-store-artifacts/SplashLens-Field-Tools-1.0.7-v8-fieldtools-FINAL-SIGNED.aab`
  - SHA-256: `5ed553b2e534ca840acfacbd21faf6d4f6ca5dfe5d8887f3b0c31cf374931c40`
  - Package: `com.splashlens.fieldtools`
  - Version: `1.0.7`
  - VersionCode: `8`
  - Target SDK: `36`
  - Certificate subject: `CN=SplashLens, OU=Mobile, O=Deer Track Design LLC, L=Bloomington, ST=IL, C=US`
  - Certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`

- `/Users/macbookpro/Library/CloudStorage/Dropbox/Projects/poolens/play-store-artifacts/SplashLens-Field-Tools-1.0.8-v9-fieldtools-FINAL-SIGNED.aab`
  - SHA-256: `12cb8add0a739e991edb5f39a63e4d1346b796ff3a1105f660300f7ae10edb6a`
  - Package: `com.splashlens.fieldtools`
  - Version: `1.0.8`
  - VersionCode: `9`
  - Target SDK: `36`
  - Certificate subject: `CN=SplashLens, OU=Mobile, O=Deer Track Design LLC, L=Bloomington, ST=IL, C=US`
  - Certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`
  - `jarsigner -verify -verbose -certs` result: `jar verified`; warnings are self-signed/untimestamped upload certificate warnings, consistent with historical upload-key signing.

Impact:

- The current local candidate `SplashLens-Field-Tools-1.0.9-v8-release.aab` reuses versionCode `8`, while a signed `1.0.7-v8` artifact already exists and a signed `1.0.8-v9` artifact also exists. Treat versionCode `8` as unsafe for Play. The next current-source Play rebuild should use versionCode `10` or the next unused code confirmed in Play Console.
- The signed `1.0.8-v9` Dropbox artifact proves the expected upload certificate was used after the earlier handoff, but it does not include the latest local `1.0.9` store-copy/source changes.

Exact rebuild command from current source, after setting `android-twa/app/build.gradle` and `android-twa/twa-manifest.json` to the next unused Play versionCode, recommended `10` unless Play Console shows otherwise:

```bash
cd /Users/macbookpro/SplashLens-asc-subscription-finish-2026-07-04/android-twa
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/Users/macbookpro/Library/Android/sdk
export ANDROID_SDK_ROOT=/Users/macbookpro/Library/Android/sdk
bash ./gradlew --stop
bash ./gradlew clean :app:bundleRelease --no-daemon --rerun-tasks
mkdir -p ../release-evidence/splashlens-native-store-20260901-build16/android
cp app/build/outputs/bundle/release/app-release.aab ../release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-release-unsigned.aab
shasum -a 256 ../release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-release-unsigned.aab
bundletool validate --bundle=../release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-release-unsigned.aab
bundletool dump manifest --bundle=../release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-release-unsigned.aab --xpath=/manifest/@package
bundletool dump manifest --bundle=../release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-release-unsigned.aab --xpath=/manifest/@android:versionCode
bundletool dump manifest --bundle=../release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-release-unsigned.aab --xpath=/manifest/@android:versionName
```

If Gradle reports missing/deleted metadata after storage cleanup, rerun the same command once after Gradle regenerates its cache. Do not upload anything until the rebuilt AAB is signed with the matching SplashLens upload key and the release gate verifies package, versionCode, target SDK, signature fingerprint, and live store-mode copy.

## Production Web + v10 Rebuild Addendum - 2026-09-01

Live web blocker removed:

- Cloudflare Pages production deploy: `https://54cfe0f3.poolens.pages.dev`
- Project/environment/branch: `poolens` / Production / `main`
- Custom domain checked: `https://app.splashlens.com/?store=android`
- Service worker now serves cache `splashlens-v6-store-copy-20260901`.
- Clean browser smoke against the custom domain:
  - `Saved job history`: present
  - `Repeat Issue Watch`: present
  - `callback risk`: absent
  - `callback flag`: absent
  - `service proof pass`: absent
  - `service proof os`: absent
  - `team proof os`: absent
  - `proof layer`: absent
  - visible `checkout` / `stripe`: absent
  - console errors: `0`

Current-source Android wrapper rebuilt with versionCode `10`:

- Artifact: `release-evidence/splashlens-native-store-20260901-build16/android/SplashLens-Field-Tools-1.0.9-v10-unsigned.aab`
- SHA-256: `965b03866d1ef79fba2f3445669e15144ebf1bce041e95c8a26f120cfb11dac4`
- Package: `com.splashlens.fieldtools`
- VersionCode: `10`
- Target SDK: `36`
- `bundletool validate`: passed
- `jarsigner -verify`: `jar is unsigned`

Updated verdict:

- The Android review web surface is now fixed live.
- The latest-source v10 wrapper is structurally valid but still not uploadable until signed with the missing SplashLens upload key or until Play Console completes an upload-key reset.
- The existing signed Dropbox v9 AAB is package/API-36/signature-correct, but it is versionName `1.0.8` / versionCode `9` and does not represent the latest current-source wrapper metadata.
