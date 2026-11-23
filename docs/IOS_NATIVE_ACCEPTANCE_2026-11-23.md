# SplashLens iOS native acceptance — November 23, 2026

Status: DRAFT NATIVE FIX; runtime acceptance and release build are still blocked.

## Apple state and shipping source

- App Store Connect app: 6763644905, bundle com.splashlens.app.
- Version 1.0.11, build 19 (59dc0436-8e14-4360-96c9-771a74e739dd) is READY_FOR_SALE / READY_FOR_DISTRIBUTION. Build processing is VALID and APP_STORE_ELIGIBLE. Its review submission is COMPLETE; there is no newer uploaded build.
- Retained distribution IPA SHA-256: 2c888d070a0f89747c299c19a336aa4ccbd0cf46d3a8ec6e78bbf6524d5e2288.
- The retained shipping wrapper's Swift code matches the source used for build 19 (0cb225a758514f8e822e53923abba5b8cae4e002) and current master f300827e6fadccde6627ce89d1bd7f0ab3a3012e. This was compared, not assumed from a generic wrapper stub.
- ContentView.swift SHA-256: e95f3c0d5292406540b6cbd04f85aef9dbd186420d182cfce5cd0c713d38c803.
- Swift implementation, gallery bridge, signing configuration, bundle ID and version/build numbers are unchanged by this patch.

## Finding and patch

The actual shipping IPA and current master declare only UIInterfaceOrientationPortrait for iPhone. Hosted-web rotation fixes cannot change that native restriction. Add UIInterfaceOrientationLandscapeLeft and UIInterfaceOrientationLandscapeRight to the iPhone orientation array. Existing iPad orientations are retained.

This permits landscape presentation; it does not establish successful folding, resizing or a suitable layout. The patch must remain a draft until native runtime acceptance is completed.

## Checks actually completed

- External SanDisk backing and writable APFS destination were verified, including capacity on both the physical SSD and mounted image. All task outputs, simulator data, caches, temporary files and logs were directed externally. No global storage links or other sessions' work were changed.
- Installed Xcode is 27.1, build 27A9275. The available iOS 27.1 runtime is 24A94232 and explicitly supports the iPhone Duo device type, model iPhone19,4.
- A separate task-owned Duo simulator booted. Display enumeration reported native integrated display geometry; this is platform inventory, not fold or interaction acceptance.
- Baseline Swift wrapper compiled for arm64 iOS Simulator. The rotation candidate also compiled successfully; its final simulator Info.plist contains portrait and both landscape orientations.
- Compiler proof used a simulator-only harness with identical shipping Swift source. Its test project omits asset/storyboard compilation and copies retained compiled resources from the shipping IPA because Apple's asset compiler did not honor external scratch routing. This is not a full production release build.
- The hosted iOS entry point, JavaScript and service worker were fetched directly. They identify 20261123-hinge-safe-1 / splashlens-v74-hinge-safe. PC separately verified deployment and broader browser checks.
- Static review found the existing main-frame, HTTPS, exact-host gallery-message checks and image normalization. These checks are not a gallery selection/cancellation or real-image acceptance test.
- Current native source has a gallery bridge but no StoreKit purchase/restore bridge. Current web store-mode paths retain free manual tools and suppress web checkout; native Apple purchase/restore/revocation acceptance remains pending.

## Exact runtime and release gates

1. Full simulator build: Apple's asset compiler failed trying to save scratch files in its internal T directory. The external-only sandbox blocked those writes with Operation not permitted. Do not relax the storage rule. Use a verified external-compatible asset-compiler/VM build path for the eventual full artifact.
2. Device interface: Simulator.app was absent from the inspected Xcode application layout. Device Hub access timed out repeatedly, including an execution timeout and session reset. No unchanged UI calls were repeated after recording that gate.
3. The isolated simulator reported Booted, but installation stalled and was stopped. Display screenshot and bootstatus checks each timed out after 25 seconds. No successful launch or usable native screen was observed. The task-owned simulator was then shut down successfully; shared simulator services and other device sessions were not reset.
4. Therefore folding/unfolding, real rotation, safe areas, keyboard visibility, account-sheet input preservation, gallery selection/cancellation and manual PartSnap recovery are NOT PASSED. Native privacy navigation and store guard/restore paths also require actual runtime verification.
5. Before signing/uploading: complete those runtime cases, run the full native build externally, audit the final signed artifact, refresh ASC reservations, choose a new version/build only then, and save plain-English TestFlight What to Test/App Store What's New notes for that exact release.

## Release boundary

No new signing certificate/profile, archive, TestFlight upload, App Review submission, version/build change, production billing enablement, database change or purchase was performed. No physical iPhone camera was activated. Physical-device and real-money operations remain outside these checks.

Keep the external candidate and private logs until the release is confirmed and the approved remote/artifact backup is verified. Git contains only this sanitized receipt and the source patch; private captures, credentials and binaries are excluded.
