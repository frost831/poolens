# SplashLens Android Activation Release

Date: 2026-07-23

## Release Candidate

- Package: `com.splashlens.fieldtools`
- Version name: `1.0.7`
- Version code: `8`
- Minimum Android API: `23`
- Target Android API: `36`
- Launch URL: `https://app.splashlens.com/?store=android`
- Upload artifact: `play-store-artifacts/SplashLens-Field-Tools-1.0.7-v8-fieldtools-FINAL-SIGNED.aab`
- SHA-256: `5ED553B2E534CA840ACFACBD21FAF6D4F6CA5DFE5D8887F3B0C31CF374931C40`

## Source-to-Artifact Proof

The final artifact was rebuilt after the obsolete density-specific notification icons were removed. It therefore matches the current Android source, including the adaptive launcher background, monochrome launcher icon, monochrome notification icon, API 36 target, and `1.0.7` / code `8` metadata.

Verification completed:

- Clean `bundleRelease`: passed.
- `lintRelease`: passed with no lint failure.
- Merged manifest: version `1.0.7`, code `8`, min API `23`, target API `36`.
- Final upload bundle: `jarsigner -verify` returned `jar verified`.
- Previous pre-cleanup candidate passed bundletool validation, Android 15 emulator install, metadata inspection, full-screen TWA cold launch, upload-certificate comparison, and zero fatal-crash matches.

## Store Truth

The public Google Play listing returned HTTP 200 and still displayed `1.0.5` when checked on 2026-07-23. Upload the final signed AAB above to the ThrottleShare-owned SplashLens Play Console application, complete the production release checks, and submit it for review. Do not upload the unsigned `android-twa/app/build/outputs/bundle/release/app-release.aab`.

## Release Notes

SplashLens 1.0.7 keeps the free field-reference core and updates the Android wrapper for the current web workflows, including role-based entry, PartSnap and proof workflows, Facility Assist, field feedback, referral attribution, and the protected activation funnel. Possible part matches remain verification aids, not confirmed fitment or diagnosis.
