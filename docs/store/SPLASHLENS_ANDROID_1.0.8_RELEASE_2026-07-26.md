# SplashLens Android 1.0.8 Release

Date: 2026-07-26

## Release Candidate

- Package: `com.splashlens.fieldtools`
- Version name: `1.0.8`
- Version code: `9`
- Minimum Android API: `23`
- Target Android API: `36`
- Launch URL: `https://app.splashlens.com/?store=android`
- Upload artifact: `play-store-artifacts/SplashLens-Field-Tools-1.0.8-v9-fieldtools-FINAL-SIGNED.aab`
- SHA-256: `12CB8ADD0A739E991EDB5F39A63E4D1346B796FF3A1105F660300F7AE10EDB6A`

## Changes

- Removed the portrait-only wrapper restriction and enabled resizable activity behavior.
- Updated the web and embedded manifests to allow portrait and landscape use.
- Added the short-height onboarding layout so the first-use heading and controls remain reachable in landscape.
- Enabled current edge-to-edge handling for the native billing activity without allowing the Chrome-owned TWA toolbar to cover app content.
- Enabled R8 optimization and resource shrinking.
- Updated Java source and target compatibility to 17.
- Bumped the service-worker cache to `splashlens-v35-landscape-onboarding`.

## Verification

- `node --test tests\\*.test.mjs`: 31/31 passed.
- `gradlew lintRelease bundleRelease`: passed.
- Android lint: 0 errors; 7 generated-template unused-resource warnings.
- Bundletool 1.18.3 validation: passed.
- `jarsigner -verify`: `jar verified` using the established SplashLens upload certificate.
- Merged manifest: version `1.0.8`, code `9`, min API `23`, target API `36`, resizable activity enabled, no screen-orientation restriction.
- Android emulator cold launch: passed.
- Portrait onboarding visual check: passed.
- Active landscape rotation and short-height onboarding visual check: passed.
- Fatal app crash matches during the final launch: none.
- Live `https://app.splashlens.com/manifest.json`: orientation `any`.
- Live app HTTP check: `200`.
- Checkout readiness: `productionReady: true`.

## Distribution Decision

- Keep the current production market limited to the United States for this release.
- Do not add Canada production targeting yet. Metric calculator support, explicit USD/CAD pricing language, legal-operator alignment, Canadian privacy wording, subscription-market verification, and French-Canadian coverage should be completed first.
- A quiet Canadian test track can be considered separately; it is not part of this production upload.

## Play Console

Upload only the signed AAB listed above. Do not upload `android-twa/app/build/outputs/bundle/release/app-release.aab`, which is unsigned. Use release name `SplashLens 1.0.8 Android quality update` and retain a 100% United States rollout after Google review.
