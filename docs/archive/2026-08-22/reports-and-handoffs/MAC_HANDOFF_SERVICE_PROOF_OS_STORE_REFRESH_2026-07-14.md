# SplashLens Mac Handoff - Service Proof OS Store Refresh - 2026-07-14

## Goal

Refresh the native iOS and Android submission lanes so the stores match the new flagship positioning:

PartSnap is the hook. Service Proof Passport is the moat. Facility Assist is the CPO/operator pilot lane.

## Source Branches

- App/runtime branch: `feature/splashlens-usage-alerts-dashboard`
- Safety branch with native cleanup work: `splashlens-native-store-cleanup-2026-07-14`

## What Changed On Windows

- App front door now says `Proof-first pool work.`
- App marketing gate now includes five large workflow chips:
  - ID part
  - Save proof
  - Facility
  - Smart pad
  - Voice note
- Owner dashboard now includes an Attention Queue for stuck PartSnap results, PoolPro/media lift, Facility Assist usage, checkout success, meaningful actions, and hot sessions.
- Public site homepage now leads with `The proof layer for pool and spa work.`
- Public site flagship section now leads with `Service Proof OS.`
- Apple metadata drafts now include Service Proof Passport and Facility Assist.
- Android web app manifest now includes Service Proof Passport shortcut.

## iOS / App Store Connect Tasks

1. Pull latest `feature/splashlens-usage-alerts-dashboard`.
2. Review whether to merge/cherry-pick from `splashlens-native-store-cleanup-2026-07-14` before archiving.
3. Open the iOS wrapper and verify the webview loads:
   - `https://app.splashlens.com/?store=ios`
   - no Stripe web checkout CTA in native wrapper mode
   - PartSnap, report tab, Facility Assist, dashboard links behave as expected
4. Use updated metadata from:
   - `app-store-connect/metadata/en-US/description.txt`
   - `app-store-connect/metadata/en-US/promotional_text.txt`
   - `app-store-connect/metadata/en-US/subtitle.txt`
   - `app-store-connect/metadata/en-US/keywords.txt`
   - `app-store-connect/review_notes.txt`
5. Capture new screenshots around:
   - Proof-first home / workflow chips
   - PartSnap result packet
   - Service Proof Passport
   - Facility Assist
   - Owner/dashboard or proof packet if allowed for store screenshots

## Google Play Tasks

1. Pull latest app branch.
2. Verify TWA manifest includes the new `Service Proof Passport` shortcut.
3. Confirm Play listing copy matches the ASO direction:
   - pool service app
   - pool tech app
   - PartSnap
   - pool parts identification
   - service proof
   - CPO / Facility Assist
   - spa / hot tub
   - robots / automation / salt / lights
4. If a new Android build is needed, increment versionCode/versionName from the current local wrapper state and build a new signed AAB on the proper machine.

## Review Safety Language

Keep this exact posture everywhere:

SplashLens is a reference and documentation workflow. It does not guarantee diagnosis, repair, chemical safety, part fit, manufacturer support, CRM sync, training certification, code compliance, or warranty outcomes. PartSnap returns possible paths and proof prompts that still need manual, model-number, manufacturer, and qualified-tech verification.

## Store Submission Checklist

- No fake manufacturer endorsement.
- No claim that AI confirms part fit.
- No claim that Facility Assist replaces CPO standards or health-department rules.
- No direct Stripe subscription CTA in native wrapper mode.
- Screenshots show real app UI, not only marketing cards.
- App icon and splash assets match the live SplashLens icon.

