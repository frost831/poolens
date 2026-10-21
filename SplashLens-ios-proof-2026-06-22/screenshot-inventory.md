# SplashLens iOS Screenshot Inventory - Reset June 23, 2026

## Active Screenshot Set

The active `screenshots/` folder has been reset. Do not use the previous simulator or phone screenshots for App Store Connect.

Previous images were moved to:

`rejected-screenshots-2026-06-23/`

Reason: the prior phone/imported screenshots showed the old live payload with broken character encoding. The app and live web payload were cleaned after those images were captured.

## Fresh Screenshots To Capture

Capture these from the installed iPhone build after the phone is unlocked and SplashLens launches cleanly:

1. `screenshots/01-home-iphone-clean.png`
   - PartSnap-forward home screen.
   - Shows `Find the part. Fix the stop.`
   - Shows `PartSnap Parts ID`.

2. `screenshots/02-partsnap-scanner-iphone.png`
   - PartSnap scanner primer or scanner mode.
   - Shows clean mode text with no broken characters.

3. `screenshots/03-partsnap-result-iphone.png`
   - PartSnap result with possible-match language, confidence ladder, and verify-before-ordering language.

4. `screenshots/04-partsnap-proof-escalation-iphone.png`
   - Visible proof, next proof, alternates if available, and copyable escalation packet.

5. `screenshots/05-error-code-expanded-iphone.png`
   - Error-code lookup result, preferably `E05`, expanded.
   - Must show clean text with no mojibake.

6. `screenshots/06-dosing-or-service-note-iphone.png`
   - Dosing calculator or clean service note.

## Current Clean Evidence Outside Active Screenshot Set

Release-gate browser/simulator evidence from the fixed production payload is retained at:

`../output/release-gate-2026-06-23/`

That evidence is useful for audit history but is not the final App Store screenshot set.

Latest live production browser evidence after the report UI polish:

- `../output/release-gate-2026-06-23/live-v9-home.png`
- `../output/release-gate-2026-06-23/live-v9-report-top.png`
- `../output/release-gate-2026-06-23/live-v9-report-proof.png`
- `../output/release-gate-2026-06-23/live-v9-partsnap.png`
- `../output/release-gate-2026-06-23/live-v9-error-e05.png`
- `../output/release-gate-2026-06-23/live-v9-error-e05-expanded.png`
- `../output/release-gate-2026-06-23/live-v9-more-store.png`

These are production browser QA screenshots, not App Store Connect proof screenshots. Keep the active `screenshots/` folder empty until fresh physical iPhone screenshots are captured from the installed TestFlight build.
