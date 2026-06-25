# SplashLens Google Play FieldTools Release - 2026-06-25

## Why This Packet Exists

The public Google Play listing resolves at:

- `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`

The prior local `1.0.3` release packet documented a build under `com.splashlens.app`, which created a release-risk mismatch against the public listing. This packet restores the Android wrapper to the public Google Play package.

## Build

- Package: `com.splashlens.fieldtools`
- Version code: `5`
- Version name: `1.0.4`
- Hosted app URL: `https://app.splashlens.com/?store=android`
- Build command run from `android-twa`: `.\gradlew.bat clean bundleRelease`
- Result: build passed

## Signed AAB

- Signed AAB: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.4-v5-fieldtools-signed.aab`
- SHA-256: `277272ABF82EFA6F4281492FDB6D4F482E432CFDCAE2B0EA275C89E57F7CFAAE`
- Upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`
- Signing verification: `jarsigner -verify -verbose -certs` returned `jar verified`

## Manifest Evidence

Gradle release intermediates show:

- `applicationId`: `com.splashlens.fieldtools`
- `versionCode`: `5`
- `versionName`: `1.0.4`
- Bundle manifest package: `com.splashlens.fieldtools`
- Main classes: `com.splashlens.fieldtools.Application`, `com.splashlens.fieldtools.LauncherActivity`, `com.splashlens.fieldtools.DelegationService`

Evidence files:

- `android-twa/app/build/intermediates/bundle_ide_model/release/produceReleaseBundleIdeListingFile/output-metadata.json`
- `android-twa/app/build/intermediates/bundle_manifest/release/processApplicationManifestReleaseForBundle/AndroidManifest.xml`

## Play Console Upload Steps

1. Open Play Console for `SplashLens Field Tools`.
2. Confirm package is `com.splashlens.fieldtools`.
3. Go to the active testing or production release lane Play allows for this account.
4. Create a new release.
5. Upload `SplashLens-Field-Tools-1.0.4-v5-fieldtools-signed.aab`.
6. Use release notes:

```text
SplashLens now includes the latest PartSnap field-reference improvements, proof-focused part identification language, owner usage event wiring, and updated live app surfaces. SplashLens remains a free-core pool technician reference aid and does not replace manuals, manufacturer support, licensed work, or qualified technician judgment.
```

7. Review Play warnings and app access/data safety prompts.
8. Send changes for review.

## Do Not Use

- Do not upload the `1.0.3` / version code `4` artifact to the public `com.splashlens.fieldtools` listing.
- Do not use `com.splashlens.app` for the public Google Play listing unless Play Console proves that is the live listing package.
- Do not add paid entitlement, guaranteed diagnosis, manufacturer endorsement, or unlimited AI claims to the Play listing.
