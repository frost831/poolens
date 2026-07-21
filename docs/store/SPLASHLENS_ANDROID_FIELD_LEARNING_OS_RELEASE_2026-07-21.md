# SplashLens Android Field Learning OS Release - 2026-07-21

## Build

- Package: `com.splashlens.fieldtools`
- Version name: `1.0.7`
- Version code: `8`
- Source commit before release edit: `b46331222929d141e865328a9288d0cad8e2e2be`
- Launch URL: `https://app.splashlens.com/?store=android`
- Built AAB: `android-twa/app/build/outputs/bundle/release/app-release.aab`
- AAB SHA-256: `861ecc19a355b224f3e2542ea07851e47c819e7683a2ae8b66a6b08b64e191b1`
- Signing inspection: `jar is unsigned`
- Final signed AAB: `play-store-artifacts/SplashLens-Field-Tools-1.0.7-v8-fieldtools-FINAL-SIGNED.aab`
- Final signed AAB SHA-256: `760b261ee7a42b093631771e9faffad2884177e6b44b19fa8c9d029843837c71`
- Upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`
- `jarsigner -verify -verbose -certs` result: `jar verified`

## Assets Checked

- Android launcher/adaptive icon resources remain in `android-twa/app/src/main/res`.
- Live wrapper target contains Field Learning OS and Trainer Mode.
- Public Play listing package is `com.splashlens.fieldtools`.

## Reviewer Path

1. Install the signed release candidate.
2. Launch SplashLens.
3. Open Report / Trainer Mode.
4. Activate PartSnap Lesson, CPO Scenario, and Proof Review.
5. Confirm the lesson task, proof checks, answer key, and review boundary render.

## Copy / OCR Risks

- Use `AI-assisted` and `source-backed candidates`, not guaranteed identification.
- Do not claim official CPO, Aquatic Council, manufacturer, or certification alignment.
- Do not market paid access as unlocked until Google Play entitlement verification succeeds.

## Fixes Completed

- Build number advanced from `7` to `8` to avoid reused version codes.
- The existing Play upload key for `com.splashlens.fieldtools` was recovered from its intended non-Git location.
- The final AAB was signed with the same upload certificate used for prior accepted builds.

## Go / No-Go

- Build and functional web target: GO.
- Signed AAB: GO.
- Play upload: GO only in the public app record for package `com.splashlens.fieldtools`; confirm the console package before upload.

## Blocked Proof

- The generated Gradle output remains unsigned and must not be uploaded directly.
- Upload only `SplashLens-Field-Tools-1.0.7-v8-fieldtools-FINAL-SIGNED.aab`.
