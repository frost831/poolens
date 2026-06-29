# SplashLens Mac Handoff - Field Intelligence iOS Build - 2026-06-29

This is the Mac-only handoff for the SplashLens iOS app programming lane. The PC side has already handled the web app code, Cloudflare deploy, GitHub push, and production smoke checks. The Mac should focus on Xcode, native wrapper behavior, simulator/device proof, TestFlight, and App Store Connect.

## Done

- Field Intelligence Layer is built and deployed in the hosted SplashLens app.
- Production URL: `https://app.splashlens.com`
- iOS wrapper URL: `https://app.splashlens.com/?store=ios`
- Git repo: `https://github.com/throttleshare/poolens.git`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Current web/app commit to pull: `d0d069f`
- Commit message: `Build SplashLens field intelligence layer`
- Cloudflare preview from deploy: `https://0eed86a3.poolens.pages.dev`
- Live app verified HTTP 200 on `https://app.splashlens.com/`
- Live app verified new asset version: `js/app.js?v=20260629-field-intel`
- Live service worker cache verified: `splashlens-v12-field-intel`

## What The iOS App Should Pick Up From Web

Because the iOS app is a SwiftUI `WKWebView` wrapper, most of this release should appear without native feature rewrites once the wrapper loads the current hosted app.

New user-facing app pieces:

- Field Intelligence panel inside saved Pool profiles.
- Callback risk status: `Clean History`, `Watch Next Visit`, or `High Callback Risk`.
- Pool-level proof counts, equipment counts, and reading counts.
- Next visit reminder per pool.
- Manual Equipment Tree add flow for pumps, heaters, automation, robots, lights, covers, salt systems, controllers, and related hardware.
- Service Proof Passport history inside pool profiles.
- CRM/export packet that can be copied or shared into Jobber, Skimmer, Pool Brain, QuickBooks, office notes, a senior tech thread, or a vendor counter.
- CSV export for the pool profile packet.
- Print/PDF packet from the web app.
- Store-safe positioning: SplashLens is a reference aid, not a diagnosis replacement or guaranteed part-fit tool.

## Current Xcode Facts To Confirm

Open on the Mac:

```bash
open SplashLens.xcodeproj
```

Current repo facts from `SplashLens.xcodeproj/project.pbxproj`:

- Bundle ID: `com.splashlens.app`
- Team: `2XSLXV9H74`
- Marketing version: `1.0`
- Current project build: `7`
- iOS deployment target: `17.0`

Before archiving for TestFlight, increment the build number above `7`.

The native wrapper source is:

- `ios/SplashLens/ContentView.swift`
- `ios/SplashLens/Info.plist`

Current wrapper entry URL:

```swift
https://app.splashlens.com/?store=ios
```

Do not point the iOS app at the public marketing site. It should load the app surface.

## Commands

Run this on the Mac inside the SplashLens repo folder:

```bash
git fetch origin
git checkout feature/splashlens-usage-alerts-dashboard
git pull --ff-only origin feature/splashlens-usage-alerts-dashboard
git status --short
git log -1 --oneline
```

Expected latest commit:

```text
d0d069f Build SplashLens field intelligence layer
```

Stop if `git status --short` shows uncommitted Mac-side changes. Do not overwrite them without asking Joshua.

## Native App Programming To Do On Mac

Minimum required:

1. Build and run the current wrapper in Xcode.
2. Confirm `https://app.splashlens.com/?store=ios` loads the latest web app and not an old cached service-worker version.
3. Confirm Pool profiles show the Field Intelligence panel.
4. Confirm `Copy CRM Packet`, `Share / Export`, `Download CSV`, and `Print / PDF` do not crash inside the iOS wrapper.
5. Confirm Store mode does not show direct Stripe/web checkout CTAs inside iOS.
6. Confirm no account is required for manual lookup, pools, dosing, Route Brain, reports, and reference tools.

Strongly recommended native improvements if app programming time is available:

1. Add a native share bridge for Field Intelligence packets if `navigator.share` is unreliable in `WKWebView`.
2. Add native document/share handling for CSV/PDF exports if iOS blocks browser-style downloads.
3. Add native Speech framework support for dictated notes if Web Speech is unavailable inside `WKWebView`.
4. Add a visible in-app refresh/reload recovery path for stale web content or failed network loads.
5. Add a first-run cache/version check so the wrapper can recover if an older service worker sticks.
6. Keep all native payment/subscription work separate from this release unless the App Store IAP lane is explicitly ready.

## Test Path On iPhone Simulator Or Device

Use a real iPhone device if possible. Simulator is acceptable for layout proof, but camera/microphone behavior needs device proof before store submission.

1. Launch the app.
2. Confirm the marketing entry screen appears and `Open Field Tools` enters the app.
3. Open `Pools`.
4. Add or open a saved pool profile.
5. Confirm the Field Intelligence panel appears.
6. Add an Equipment Tree item:
   - Manufacturer: `Pentair`
   - Hardware: `automation`
   - Model: `IntelliCenter`
   - Symptom: `app pairing offline`
7. Save the equipment item and confirm it appears in the Equipment Tree.
8. Set a next visit reminder and confirm it persists after closing/reopening the app.
9. Save or view a Service Proof Passport and confirm it appears in the pool profile.
10. Tap `Copy CRM Packet` and paste into Notes to verify packet content.
11. Tap `Share / Export` and confirm the native share sheet or fallback works.
12. Tap `Download CSV` and confirm the user can save/share/access the file.
13. Tap `Print / PDF` and confirm iOS does not crash or trap the user.
14. Open PartSnap / scanner and verify camera permission still appears only after user action.
15. Use dictated notes if supported. If not supported, confirm keyboard dictation is usable and the UI does not imply guaranteed native speech.

## Review Claims To Keep Safe

Use this language direction in App Store Connect and review notes:

- SplashLens is a free field reference app for pool service technicians.
- It helps organize pool profiles, equipment clues, service proof, chemistry readings, and next-visit reminders.
- PartSnap and scanner outputs are possible matches and verification aids.
- It does not diagnose, guarantee a repair, guarantee part fit, replace manuals, replace manufacturer guidance, or replace qualified tech judgment.
- No manufacturer endorsement, certification alignment, or training partnership should be claimed unless Joshua has a signed/explicit approval.
- Native paid subscriptions are not part of this release unless the separate IAP lane is complete.

## Screenshots To Capture

Capture from the actual iOS build, not the PC browser.

Required first set:

1. Marketing entry screen with SplashLens positioning.
2. Pools tab showing a saved pool profile.
3. Field Intelligence panel with proof/equipment/readings stats.
4. Equipment Tree with a robot, automation, heater, light, or pump example.
5. Next visit reminder saved.
6. CRM packet share/export flow.
7. PartSnap scanner or PartSnap proof screen.
8. Manual error-code lookup result.
9. Dosing calculator or service report.

Recommended proof folder name:

```text
SplashLens-ios-proof-field-intel-2026-06-29
```

Put these files in the proof folder:

- `build-map.md`
- `screenshot-inventory.md`
- `reviewer-path.md`
- `field-intelligence-proof.md`
- `permissions-proof.md`
- `share-export-proof.md`
- `store-mode-proof.md`
- `go-no-go.md`
- `screenshots/`

## Verification Already Completed On PC

PC-side checks completed after commit `d0d069f`:

- `node --check js/app.js` passed.
- Mobile browser smoke passed with no console errors.
- Desktop browser smoke passed with no console errors.
- Live production smoke passed on `https://app.splashlens.com/?tab=pools`.
- Live smoke confirmed:
  - Field Intelligence visible.
  - Export controls visible.
  - Equipment Tree renders robot/equipment records.
  - No horizontal overflow.
  - No production console errors in the checked path.

## Needs Manual Action

- Mac must pull the current branch.
- Mac must open Xcode and increment the iOS build above `7`.
- Mac must archive/upload only after simulator/device proof is captured.
- Mac must verify whether CSV/PDF/share/download behavior needs native bridge work.
- Mac must verify camera and microphone behavior on a real device before App Store submission.
- Mac must return the proof folder before calling the release store-ready.

## Checklist

1. Pull `feature/splashlens-usage-alerts-dashboard`.
2. Confirm latest commit is `d0d069f`.
3. Open `SplashLens.xcodeproj`.
4. Increment build above `7`.
5. Build and run on iPhone simulator.
6. Build and run on physical iPhone if available.
7. Verify Field Intelligence inside Pools.
8. Verify equipment save, reminder save, packet copy/share, CSV, and Print/PDF.
9. Verify scanner/camera and dictated-note behavior.
10. Capture screenshots from the iOS build.
11. Fill the proof folder.
12. Upload to TestFlight only if the go/no-go file is green.
