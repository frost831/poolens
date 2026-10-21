# IAP And Permissions Proof - June 22, 2026

## Native Paid Features

No native paid entitlements were found or tested in this Mac pass. The iOS wrapper build uploaded to App Store Connect is free-core.

Store wrapper mode is loaded through:

`https://app.splashlens.com/?store=ios`

The store shell flow captured in the latest live production browser audit did not show direct Stripe or web subscription checkout CTAs.

## Web Upgrade Guardrail

The web app contains checkout links for non-store web mode. Store shell mode checks the `store=ios` query parameter and changes scan-limit behavior to a free-core message with a manual lookup fallback instead of web checkout links.

Latest live store-mode audit: the More panel showed no Stripe, checkout, buy-now, subscribe-now, payment-link, or card-required CTA. If the monthly scan limit is reached in store mode, the implementation shows a free-core/manual-lookup message instead of web checkout links.

## Permission Strings From Build

- `NSCameraUsageDescription`: `SplashLens uses the camera only when you choose the optional scanner to review equipment displays, parts, or test strips.`
- `NSMicrophoneUsageDescription`: `SplashLens can use the microphone only when you choose dictated service notes.`
- `NSPhotoLibraryUsageDescription`: `SplashLens can use a photo you select for optional scanner assistance.`

## Permission Behavior Tested

- Camera permission prompt appeared only after starting PartSnap scanner mode.
- Previous camera prompt screenshots were moved to `rejected-screenshots-2026-06-23/` and should not be used for App Store Connect. Fresh physical iPhone permission proof is still required before App Review submission.
- Microphone prompt was not tested because dictated service notes were not used.
- Photo library prompt was not tested because no photo-picker flow was used.

## Signing / Entitlements

- Team: `2XSLXV9H74`
- Bundle ID: `com.splashlens.app`
- Distribution signing authority: `Apple Distribution: Joshua Frost (2XSLXV9H74)`
- `get-task-allow`: `false`
- `beta-reports-active`: `true`
- Non-exempt encryption: `false`
