# SplashLens Mac Handoff - iOS Growth + ASO

Date: 2026-07-01
Owner lane: Mac / Xcode / App Store Connect
Source repo on PC: `C:\Users\sales\Dropbox\Projects\poolens`
Branch: `feature/splashlens-usage-alerts-dashboard`
Bundle ID: `com.splashlens.app`
Current local iOS build settings: marketing version `1.0`, build `7`
Production app URL: `https://app.splashlens.com/?store=ios`
Public App Store URL: `https://apps.apple.com/us/app/splashlens/id6763644905`

## What Changed In This Packet

- Added success-triggered review ask in the web app after meaningful wins such as PartSnap proof saves, packets copied/shared, Route Brain saves, CRM packet actions, and report exports.
- Added a "needs work" path that routes users into the in-app feedback prompt instead of pushing a review when they are unhappy.
- Added owner digest support through `/api/events?digest=1` using the protected stats endpoint auth path.
- Bumped web cache to `splashlens-v14-growth-loop` and app script to `20260701-growth-loop`.
- Updated App Store Connect metadata drafts for stronger ASO around PartSnap, field intelligence, pool tech, CRM packets, proof, dosing, robot, salt, heater, and pump terms.

## iOS Build Steps

1. Pull the latest branch on the Mac:
   ```bash
   git fetch
   git checkout feature/splashlens-usage-alerts-dashboard
   git pull
   ```
2. Open `SplashLens.xcodeproj`.
3. Confirm bundle ID remains `com.splashlens.app`.
4. Confirm wrapper URL launches:
   `https://app.splashlens.com/?store=ios`
5. Increment the iOS build number above `7` before archive.
6. Archive in Xcode and upload to App Store Connect.
7. Submit to TestFlight first, then App Review after smoke testing.

## iOS Smoke Checklist

- App opens to the live hosted SplashLens app.
- App Store chip points to the public App Store listing.
- Google Play chip is not presented as an iOS install action inside the iOS wrapper.
- PartSnap screen loads, allows proof language, and does not claim guaranteed identification.
- Field Intelligence / CRM companion packets are visible in the web app after cache refresh.
- Review ask appears only after successful workflows, not immediately on first open.
- "Needs work" opens feedback instead of a public review route.
- Offline shell loads after first launch.

## App Store Connect ASO

Use the updated files under:

- `app-store-connect/metadata/en-US/description.txt`
- `app-store-connect/metadata/en-US/keywords.txt`
- `app-store-connect/metadata/en-US/promotional_text.txt`
- `app-store-connect/screenshot-plan.md`

Recommended subtitle, if editable:

`Pool Part ID & Field Tools`

Recommended screenshot order:

1. PartSnap-forward home/rescue quick actions
2. PartSnap scan or result with confidence ladder
3. PartSnap escalation / missing proof workflow
4. Field Intelligence pool profile or connected-pool troubleshooting tree
5. Error-code lookup
6. Chemical dosing calculator
7. Service note or CRM companion packet
8. Optional tester feedback / review prompt

## Review/Compliance Notes

- Do not describe SplashLens as a certified training product.
- Do not claim official manufacturer partnerships unless a partner has signed off.
- Do not claim guaranteed diagnosis, repair, chemical safety, part fit, or CRM sync.
- Keep wording as "possible matches", "verification prompts", and "field reference".

## Native iOS Follow-Up

The web review ask is live-friendly, but the ideal native iOS next step is to add `SKStoreReviewController` behind the same success trigger. Keep the same guardrail: if the user taps "needs work", open the feedback path instead of requesting a rating.
