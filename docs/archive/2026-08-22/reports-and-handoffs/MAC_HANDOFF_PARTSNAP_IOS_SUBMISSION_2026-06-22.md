# SplashLens PartSnap iOS Submission Handoff - June 22, 2026

This is the Mac-only handoff. The PC has handled the web app, backend, metadata, and GitHub work. The Mac should only handle Xcode, signing, simulator/device proof, TestFlight, and App Store Connect.

## What Changed

- SplashLens now leads with PartSnap: "Find the part. Fix the stop."
- PartSnap AI now asks for visible proof, missing proof, possible alternate part families, and a senior-tech/vendor escalation summary.
- PartSnap results still use conservative language: possible match, confidence ladder, verify before ordering.
- A mystery-part feedback path was added so low-confidence results can be sent back as training candidates.
- The public marketing site now has a dedicated PartSnap page: https://splashlens.com/partsnap.html
- iOS metadata is now PartSnap-forward.

## GitHub / Repo State To Pull

Repo: `https://github.com/throttleshare/poolens.git`

Branch to use unless Joshua says otherwise:

`feature/splashlens-usage-alerts-dashboard`

On the Mac:

1. Open Terminal.
2. Go to the SplashLens repo folder.
3. Run:

```bash
git fetch origin
git checkout feature/splashlens-usage-alerts-dashboard
git pull
git status --short
```

Stop if `git status --short` shows uncommitted Mac changes. Do not overwrite them without asking.

## Xcode Build Facts To Confirm

Open:

`SplashLens.xcodeproj`

Confirm these in Xcode:

- Bundle ID: `com.splashlens.app`
- Team: `2XSLXV9H74`
- Version: `1.0`
- Build: increment above the current build before archive
- iOS target: iOS 17.0 or current project setting

The app is a SwiftUI `WKWebView` wrapper. It opens:

`https://app.splashlens.com/?store=ios`

## What To Test On iPhone Simulator Or Device

1. App opens to SplashLens without a blank screen.
2. First screen says: `Find the part. Fix the stop.`
3. First action is `PartSnap Parts ID`.
4. Tapping PartSnap opens scanner mode.
5. PartSnap scanner shows the primer: shoot the part, then shoot the label.
6. Camera permission copy appears only when starting scanner.
7. Microphone permission appears only if dictated service notes are used.
8. A PartSnap result shows:
   - possible match wording
   - confidence ladder
   - visible proof
   - next proof
   - alternates when available
   - copyable escalation packet
   - verify-before-ordering language
9. Store mode does not show direct Stripe/web subscription CTAs inside the iOS wrapper.
10. Manual lookup, dosing, Route Brain, and service notes still work.

## Screenshots To Capture From The Actual iOS Build

Use App Store Connect required iPhone sizes. First capture 6.7-inch screenshots.

Required order:

1. PartSnap-forward home screen.
2. PartSnap scanner primer or scan mode.
3. PartSnap result showing confidence ladder and verification language.
4. PartSnap escalation / missing-proof section.
5. Error-code lookup result.
6. Dosing calculator or clean service note.

Do not use PC web screenshots as App Store proof.

## App Store Connect Copy To Use

Metadata lives in:

- `app-store-connect/metadata/en-US/name.txt`
- `app-store-connect/metadata/en-US/subtitle.txt`
- `app-store-connect/metadata/en-US/promotional_text.txt`
- `app-store-connect/metadata/en-US/description.txt`
- `app-store-connect/metadata/en-US/keywords.txt`
- `app-store-connect/review_notes.txt`
- `app-store-connect/screenshot-plan.md`

Use the repo text as the source of truth. Do not add claims for:

- guaranteed diagnosis
- guaranteed part fit
- official manufacturer endorsement
- completed training certificates
- native paid unlimited AI scanning
- direct Stripe checkout inside the iOS wrapper

## Review Notes Summary

Tell Apple:

SplashLens is a free field-reference wrapper around `https://app.splashlens.com/?store=ios`. Core tools require no account. Optional online AI scanner features require internet and are user-initiated. PartSnap provides possible pool-part matches, visible-proof prompts, missing-proof prompts, and verification language. It is reference assistance only and must be verified against equipment manuals, label directions, calibrated tests, and professional judgment.

## Proof Folder To Return

Create a folder named:

`SplashLens-ios-proof-2026-06-22`

Include:

- `build-map.md`
- `screenshot-inventory.md`
- `ocr-copy-risks.md`
- `reviewer-path.md`
- `privacy-support-delete-account.md`
- `iap-permissions-proof.md`
- `console-parity.md`
- `go-no-go.md`
- `screenshots/`

Do not call this store-ready without build-linked iPhone screenshots and a successful archive/TestFlight upload.
