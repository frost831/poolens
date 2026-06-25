# SplashLens Google Play PartSnap Release - 2026-06-25

## Candidate

- App: SplashLens Field Tools
- Play Console package: `com.splashlens.app`
- Version code: `4`
- Version name: `1.0.3`
- Signed AAB: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.3-v4-splashlens-app-signed.aab`
- Signed AAB SHA-256: `8C01645D93335F8EBE7B505A2490F6815C680C5274742897FBFD9A62F1E6A832`
- Upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`

## Why This Build Exists

Play Console for this account shows the SplashLens app record as `com.splashlens.app`, closed testing, production inactive. The June 22 `1.0.2` artifact was built as `com.splashlens.fieldtools`, which does not match the visible Console package for `SplashLens Field Tools`.

This `1.0.3` build restores the Android wrapper package to `com.splashlens.app`, keeps the same hosted app URL, and increments the release to version code 4 for upload to the actual Play Console record.

## Build Proof

- `cmd /c gradlew.bat clean bundleRelease`: passed on Windows.
- `jarsigner` signed the release bundle with the local SplashLens upload key.
- `jarsigner -verify -verbose -certs`: certificate output returned for the signed bundle.
- Live app remains hosted at `https://app.splashlens.com/?store=android`.
- `.well-known/assetlinks.json` now includes both `com.splashlens.app` and `com.splashlens.fieldtools` for compatibility.

## Release Notes

```text
Refreshes SplashLens for the current field workflow.

PartSnap now emphasizes possible pool-part matches, visible proof, missing proof, confidence ladder, Callback Risk Score, Service Proof Passport saves, Mystery Part ticket IDs, local review queue, Apprentice Mode, and cleaner escalation notes before ordering.

The Android app remains a free no-account wrapper around app.splashlens.com. Manual lookup, dosing, checklists, and service notes remain free. Online scanner output is reference assistance only and must be verified against manufacturer documentation and professional field judgment.
```

## Play Console Status Seen On 2026-06-25

- Developer account: `warmsnowman831`
- App: `SplashLens Field Tools`
- Console package shown: `com.splashlens.app`
- App status: Closed testing
- Submitted release: `4 (1.0.3)`
- Publishing overview status after submission: `Changes in review`
- Google quick checks were still running after submission and Play said changes would be sent for review as soon as checks completed successfully.
- Production: inactive
- Production access gate: 0 testers currently opted in; Play requires at least 12 opted-in testers for at least 14 days before production access can be requested.
