# SplashLens iOS Field Signals Handoff

Date: 2026-07-28

## What changed

- iOS version is prepared as `1.0.9` build `16`.
- `ContentView.swift` now exposes a narrow `splashlensNotifications` bridge to the web app.
- The bridge requests notification permission only after the user taps Enable.
- It schedules quiet, no-sound field reminders and opens only approved SplashLens deep links.
- Pending SplashLens reminders can be cleared from the in-app Field Signals settings.
- Native billing behavior is unchanged.

## Mac steps

1. Pull the latest branch and confirm the commit hash supplied by the PC handoff.
2. Open `SplashLens.xcodeproj` in Xcode.
3. Confirm target version `1.0.9` and build `16` for both Debug and Release.
4. Select the SplashLens signing team and the existing `com.belowzeromedia.splashlens` bundle identifier.
5. Build and run on a physical iPhone. A simulator is not enough for final notification proof.
6. In the app, choose Service Tech, save an equipment item or service report, and wait for the optional Field Signals offer.
7. Tap Enable and verify the Apple permission prompt appears only then.
8. Use the Field Signals bell to send a sample notification. Verify it has no sound, opens SplashLens, and routes to the relevant workflow both while the app is open and after force-quitting it.
9. Set a next-visit reminder for a future time and verify it is scheduled. Turn system alerts off and confirm pending SplashLens reminders are removed.
10. Verify StoreKit purchase and restore still invoke `splashlensNativeBilling` and are unaffected by the new handler.
11. Test the pump decision workflow online and in airplane mode. Confirm no savings appear until wattage, schedule, and electric-rate fields are entered.
12. Archive Release, validate, upload to App Store Connect, attach the build to the next TestFlight group, and run internal TestFlight proof before review submission.

## Review wording

SplashLens offers optional, user-controlled field reminders for saved equipment, proof checklists, and next-visit notes. Alerts are disabled by default, capped in the app, respect quiet hours, and are not used for generic engagement messaging. Equipment guidance is reference assistance and does not replace manuals, applicable rules, manufacturer guidance, or qualified judgment.

## Android note

The Android Trusted Web Activity already has notification delegation enabled. The live web release supplies the new Field Signals UI and worker behavior without another Android binary. Do not create a Play build solely for this feature unless physical-device testing shows notification delegation is failing in the current `1.0.8` release.

## Proof to return to PC

- Xcode archive and validation success
- TestFlight build `1.0.9 (16)` processing/available status
- Physical-device screenshots of the opt-in screen, delivered sample notification, pump comparison, and notification deep link
- StoreKit purchase/restore regression result
- Any App Store Connect submission status change
- Final Mac commit hash if the Mac makes code or project-setting changes
