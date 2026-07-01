# SplashLens Google Play Handoff - Growth + ASO

Date: 2026-07-01
Owner lane: Android / Google Play Console
Source repo on PC: `C:\Users\sales\Dropbox\Projects\poolens`
Branch: `feature/splashlens-usage-alerts-dashboard`
Live Play package: `com.splashlens.fieldtools`
Current local Android wrapper version: `1.0.5`
Current local Android wrapper versionCode: `6`
Wrapper start URL: `https://app.splashlens.com/?store=android`
Public Play URL: `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`

## Important Package Warning

Use `com.splashlens.fieldtools` for the public Google Play listing. Older docs in this repo mention `com.splashlens.app` for Android, but the currently resolved public Play listing and local TWA wrapper are `com.splashlens.fieldtools`.

## What Changed In This Packet

- Web app cache bumped to `splashlens-v14-growth-loop`.
- Success-triggered review ask now routes Android users to the Google Play listing.
- "Needs work" routes to in-app feedback first.
- Protected owner digest endpoint added at `/api/events?digest=1`.
- Store metadata language should now emphasize PartSnap, Field Intelligence, proof packets, connected-pool troubleshooting, dosing, and fast field notes.

## Build Steps

1. Pull the latest branch:
   ```bash
   git fetch
   git checkout feature/splashlens-usage-alerts-dashboard
   git pull
   ```
2. Confirm Android config:
   - `android-twa/app/build.gradle`
   - package `com.splashlens.fieldtools`
   - versionCode greater than the last uploaded Play build
3. If Play rejected or already used versionCode `6`, increment to `7` before building.
4. Build the Android App Bundle from `android-twa`.
5. Upload the `.aab` to the `com.splashlens.fieldtools` production track or testing track, depending on Play Console state.
6. Use Play Console pre-launch report before broader rollout.

## Google Play ASO Draft

App name:
`SplashLens Field Tools`

Short description:
`PartSnap pool part ID, equipment codes, proof packets, dosing, and field notes.`

Full description:

`SplashLens Field Tools helps pool service technicians move faster at the equipment pad. Use PartSnap for possible pool part clues, search equipment and error-code references, build proof-ready field notes, calculate common chemical doses, and create cleaner packets for senior tech review, vendor support, or CRM notes.`

`SplashLens includes references for pool pumps, heaters, heat pumps, salt systems, automation, lighting, robots, covers, sanitizers, and connected-pool hardware. It is built for practical field lookup and verification, not guaranteed diagnosis.`

`PartSnap and online scan features require internet and should be verified against labels, manuals, calibrated tests, and qualified professional judgment. Manual tools can work from the app shell after first load. SplashLens does not guarantee repair, chemical safety, part fit, manufacturer support, or training certification.`

Search terms to naturally cover in listing copy and screenshots:

- pool service app
- pool technician app
- pool part identification
- PartSnap
- pool equipment troubleshooting
- pool error codes
- pool pump troubleshooting
- pool heater codes
- pool salt cell troubleshooting
- pool automation troubleshooting
- pool robot troubleshooting
- pool light troubleshooting
- pool service proof
- pool CRM companion

## Screenshot Order

1. PartSnap quick action / mystery part workflow
2. PartSnap result with proof and verification language
3. Field Intelligence / connected-pool tree
4. Error-code lookup
5. Chemical dosing calculator
6. Service proof or CRM companion packet
7. Feedback/tester loop

## Play Console Checklist

- Data Safety stays aligned with actual usage and analytics/feedback collection.
- No claim of guaranteed AI diagnosis.
- No fake manufacturer partnership claim.
- No paid native subscription claim unless native billing is actually live.
- Confirm release notes mention field feedback/review loop and Field Intelligence, not unsupported native-only features.
