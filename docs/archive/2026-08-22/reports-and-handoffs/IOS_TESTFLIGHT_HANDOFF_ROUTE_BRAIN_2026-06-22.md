# iOS / TestFlight Handoff - Route Brain Release - 2026-06-22

## Release Summary

Route Brain and the expanded troubleshooting corpus are live web-app changes. Because the iOS wrapper loads `https://app.splashlens.com/?store=ios`, most functionality updates through the hosted app without a native rebuild.

## What iOS Should Pick Up From Web

- Route Brain in the Route tab
- Equipment tree intake
- Field plan builder
- Senior tech escalation packet copy
- Training Session Mode
- Quick Quote Prep
- What Changed Since Last Visit
- Manufacturer Learning Pages
- PartSnap Confidence Ladder
- 230+ corpus copy and metadata

## Native/TestFlight Items To Verify On Mac

1. Open the current iOS wrapper build.
2. Confirm Route tab loads the new Route Brain panel.
3. Confirm bottom navigation is usable on iPhone sizes.
4. Confirm `?store=ios` still suppresses unsupported web-subscription CTAs.
5. Confirm camera permission text still matches optional scanner behavior.
6. Confirm microphone behavior:
   - Web Speech Recognition may be unavailable inside the iOS webview.
   - If unavailable, the app shows fallback text telling users to use the keyboard mic.
   - Native speech cleanup is a coming-soon item unless implemented in the wrapper.
7. Confirm App Store review path:
   - No account required.
   - Manual lookup/Route Brain/calculators/checklists work after first load.
   - AI scanner requires internet.
   - No diagnosis, repair guarantee, manufacturer endorsement, sponsored placement, or certification claims.

## App Store Connect Metadata Updated In Repo

- `app-store-connect/metadata/en-US/description.txt`
- `app-store-connect/metadata/en-US/promotional_text.txt`
- `app-store-connect/review_notes.txt`

## Recommended TestFlight Submission Notes

SplashLens Field Tools is a free field reference wrapper for pool service technicians. This release adds Route Brain, a manual field-planning workflow that helps users organize equipment, symptoms, proof, field checks, escalation notes, and service-history context. It also expands the manual troubleshooting corpus to 230+ entries across equipment, automation, lighting, robots, covers, sanitizers, and controllers.

Manual features are reference assistance only. Online AI scan features are optional and require internet. Camera access is user-initiated for scanner workflows. Microphone access is user-initiated for dictated notes where supported; unsupported webviews fall back to keyboard/manual entry.

## Blockers / Coming Soon

- Native iOS speech transcription is not implemented in the wrapper yet.
- Native sponsored-placement controls are not implemented; partner page is web-only.
- Live photo-to-equipment-tree AI is not implemented; the app currently uses manual equipment-tree intake plus AI scanner modes already present.

## Files To Include In Mac Review Packet

- This handoff file
- `docs/SPLASHLENS_ONE_SPRINT_DELIVERY_REPORT_2026-06-22.md`
- `docs/route-brain-mobile-smoke.png`
- Current ASC metadata files listed above
