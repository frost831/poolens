# SplashLens Google Play FieldTools Release - 2026-06-25

## Why This Packet Exists

The public Google Play listing resolves at:

- `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`

The prior local `1.0.3` release packet documented a build under `com.splashlens.app`, which created a release-risk mismatch against the public listing. This packet restores the Android wrapper to the public Google Play package.

## Build

- Package: `com.splashlens.fieldtools`
- Version code: `6`
- Version name: `1.0.5`
- Hosted app URL: `https://app.splashlens.com/?store=android`
- Build command run from `android-twa`: `.\gradlew.bat clean bundleRelease`
- Result: build passed

## Signed AAB

- Signed AAB: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.5-v6-fieldtools-FINAL-SIGNED.aab`
- SHA-256: `B3574933B2069A8EBB7257D93E6AB1FE7C123BBCA3ABED142AA46841BCEBA7CF`
- Upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`
- Signing verification: `jarsigner -verify -verbose -certs` returned `jar verified`

## Manifest Evidence

Gradle release intermediates show:

- `applicationId`: `com.splashlens.fieldtools`
- `versionCode`: `6`
- `versionName`: `1.0.5`
- Bundle manifest package: `com.splashlens.fieldtools`
- Main classes: `com.splashlens.fieldtools.Application`, `com.splashlens.fieldtools.LauncherActivity`, `com.splashlens.fieldtools.DelegationService`

Evidence files:

- `android-twa/app/build/intermediates/bundle_ide_model/release/produceReleaseBundleIdeListingFile/output-metadata.json`
- `android-twa/app/build/intermediates/bundle_manifest/release/processApplicationManifestReleaseForBundle/AndroidManifest.xml`

## Play Console Upload Steps

Status from browser work on 2026-06-25:

- Play Console app confirmed: `SplashLens Field Tools`
- Console package confirmed: `com.splashlens.fieldtools`
- App status confirmed: `Production`
- Latest public production release before this upload: `1.0.0 Android launch`, released June 5, 2026
- Existing production draft release opened: `/tracks/4697669214915845586/releases/2/prepare`
- Play rejected the first `1.0.4` / version code `5` upload because version code `5` had already been used.
- Android wrapper was bumped to `1.0.5` / version code `6`.
- Play rejected an intermediate v6 upload as unsigned; local verification confirmed it was unsigned.
- `SplashLens-Field-Tools-1.0.5-v6-fieldtools-FINAL-SIGNED.aab` was generated, verified with `jarsigner`, and uploaded.
- Play Console accepted the bundle and showed `6 (1.0.5)` under App bundles.
- The release was saved from Preview and Confirm.
- Owner reported the saved production change was submitted to Google for review on 2026-06-25.

Release notes used/planned for this release:

```text
SplashLens now includes the latest PartSnap field-reference improvements, proof-focused part identification language, owner usage event wiring, and updated live app surfaces. SplashLens remains a free-core pool technician reference aid and does not replace manuals, manufacturer support, licensed work, or qualified technician judgment.
```

Play Console may still display the release as pending review until Google completes review.

## Do Not Use

- Do not upload the `1.0.3` / version code `4` artifact to the public `com.splashlens.fieldtools` listing.
- Do not upload the rejected `1.0.4` / version code `5` artifact again; Play has already consumed version code `5`.
- Do not use `com.splashlens.app` for the public Google Play listing unless Play Console proves that is the live listing package.
- Do not add paid entitlement, guaranteed diagnosis, manufacturer endorsement, or unlimited AI claims to the Play listing.
