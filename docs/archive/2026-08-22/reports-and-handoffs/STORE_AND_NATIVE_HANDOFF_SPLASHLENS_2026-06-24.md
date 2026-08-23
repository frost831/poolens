# SplashLens Store And Native Handoff - 2026-06-24

## Current Web Release

- Production app: `https://app.splashlens.com`
- Marketing site: `https://splashlens.com`
- PartSnap page: `https://splashlens.com/partsnap`
- Proof library: `https://splashlens.com/partsnap-proof-library.html`

## Features To Show In Store Screenshots

1. Home / field rescue opening: PartSnap, error lookup, dosing, Route Brain, service notes.
2. PartSnap primer: shoot the part, shoot the label, verify before ordering.
3. PartSnap result: possible match, confidence ladder, missing proof, Callback Risk Score.
4. Service Proof Passport: save PartSnap or Route Brain proof to a pool/visit record.
5. Mystery Part ticket: submitted or local review ticket saved on device.
6. Apprentice Mode: teaching prompt and answer key.
7. Route Brain: equipment tree, symptom, field checks, escalation packet.

## iOS / Mac Steps

1. On the Mac, pull latest GitHub branch:
   - `git checkout feature/splashlens-usage-alerts-dashboard`
   - `git pull`
2. Open the iOS wrapper in Xcode.
3. Confirm `ios/SplashLens/ContentView.swift` still loads `https://app.splashlens.com/?store=ios`.
4. Build and run on iPhone/simulator.
5. Verify:
   - first launch opens the hosted app
   - camera permission prompt appears only when scanner is used
   - PartSnap tab opens
   - Mystery Part Review Queue persists after app relaunch
   - Service Proof Passport save flow persists locally
   - Route Brain opens and saves proof
   - microphone button either works or shows the web/keyboard mic fallback
6. Refresh App Store Connect metadata from `app-store-connect/metadata/en-US`.
7. Upload refreshed screenshots that show the seven screens above.
8. Submit TestFlight first, then App Review after smoke testing.

## Google Play Steps

1. Open Play Console for `com.splashlens.fieldtools`.
2. If the current closed-test release is still in review, update listing copy/screenshots first.
3. If Play allows a new release, upload the latest signed AAB from the current Google Play packet or rebuild a new wrapper after confirming package/version codes.
4. Use the updated Play listing copy below.
5. Keep Data Safety aligned with actual behavior:
   - optional user-selected photo/camera input for scanner assistance
   - app interactions/usage events
   - email only if user submits it through feedback
   - encrypted in transit
   - deletion/contact via privacy page

## Updated Play Short Description

Pool part ID, error codes, dosing, proof notes, and scanner assistance.

## Updated Play Release Notes

SplashLens refreshes PartSnap for pool techs in the field.

New and highlighted:

- PartSnap Callback Risk Score
- Service Proof Passport save flow
- Mystery Part ticket IDs and local review queue
- Apprentice Mode for training-style review
- Cleaner scan UI labels
- Usage events for meaningful app activity

SplashLens remains a free-core reference app. Scanner output is assistance only and must be verified against manufacturer documentation, labels, calibrated tests, and professional field judgment before ordering or repair.

## Hard Gates Not Solved By Web Deploy

- App Store approval
- Play Store approval or closed-test eligibility
- Native iOS speech transcription
- Native in-app purchases
- Manufacturer-verified fitment
- Vendor stock/pricing APIs
