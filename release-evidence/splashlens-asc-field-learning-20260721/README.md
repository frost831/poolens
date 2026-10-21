# SplashLens ASC Field Learning OS Metadata Update - 2026-07-21

## Source

- Repo: `/Users/macbookpro/SplashLens-asc-subscription-finish-2026-07-04`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Commit: `ace4fb71dc0c3b15c3a3ee04ff9f7457c3bdea64`

## App Store Connect State

- App: SplashLens
- Apple ID: `6763644905`
- Bundle ID: `com.splashlens.app`
- Live version: `1.0.7`
- Build: `14`
- Build ID: `fe00d872-aa44-4021-b604-c66c04df4463`
- Review submission ID: `29d0e41e-452a-4122-99c2-4adc7b0a3df8`
- Current review submission state: `COMPLETE`
- Current app version state: `READY_FOR_DISTRIBUTION`
- Current App Store state: `READY_FOR_SALE`

## Release Gate

- Git status was clean before ASC write.
- Contract tests passed:
  - `tests/checkout-safety.test.mjs`
  - `tests/email-contract.test.mjs`
  - `tests/paid-lane-lead-contract.test.mjs`
  - `tests/refund-entitlement-contract.test.mjs`
- Live `https://app.splashlens.com/?mode=trainer&utm_source=field_learning_os` returned HTTP `200` and included Field Learning OS, PartSnap Lesson, CPO Scenario, and Service Proof markers.
- Live `https://splashlens.com/field-learning-os` returned HTTP `200` and included Field Learning OS positioning.
- Live `https://app.splashlens.com/?store=ios` returned HTTP `200`.
- Public App Store lookup returned version `1.0.7` with current version release date `2026-07-21T05:14:21Z`.
- Existing exported IPA remains `1.0.7` build `14`, signed for team `2XSLXV9H74`, with `get-task-allow=false` and non-exempt encryption `false`.
- Existing IPA SHA-256: `830797bc1890130ef80b387680ba62147b7938d1724bee56537b156101004a17`.

## ASC Update

Updated the en-US promotional text to:

`Get off the pad faster, then turn the stop into a five-minute field lesson.`

ASC accepted the promotional text patch with HTTP `200` and the post-patch readback matched.

## Blocked By ASC State

Attempted to update `whatsNew` for the live `1.0.7` localization. ASC returned HTTP `409 STATE_ERROR`:

`Attribute 'whatsNew' cannot be edited at this time`

No new binary, screenshots, reviewer notes, or new review submission were uploaded. Because `1.0.7` is already live and the Field Learning OS change is web-delivered through the existing wrapper, a replacement binary was not required for this pass.

## Evidence Files

- `asc-promotional-text-update-summary.json`
- `20260721T154006Z-before-localization-200.json`
- `20260721T154006Z-patch-localization-409.json`
- `20260721T154034Z-patch-promotional-text-200.json`
- `20260721T154034Z-after-promotional-text-200.json`
