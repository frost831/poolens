# Mac Handoff - PartSnap Corpus Native Refresh

## Goal

Refresh iOS TestFlight/App Store and Google Play builds so native users get the newest SplashLens web app with PartSnap source-backed corpus candidates.

## Git Source

- Repo: `https://github.com/throttleshare/poolens.git`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Required commit or newer: `2e1a6d9`

## What Changed

- PartSnap now separates:
  - `AI-only result`
  - `Source-backed candidates`
- Results include:
  - source tier
  - source labels
  - required proof before ordering
  - lookalike warnings
  - 1-2-3 field path
- App dashboard includes corpus metrics.

## Store Copy Guardrails

Use:

- `AI-assisted part family lookup`
- `source-backed candidates`
- `proof prompts before ordering`
- `senior tech/vendor packets`
- `verify with model plate, markings, dimensions, and current manual`

Do not use:

- `guaranteed part identification`
- `confirmed fit`
- `manufacturer verified`
- `diagnosis replacement`
- `exact part accuracy`

## Native QA Checklist

1. Pull latest branch.
2. Confirm wrapper opens `https://app.splashlens.com/`.
3. Clear app cache or reinstall so the new `sw-partsnap-corpus.js` service worker registers.
4. Launch app and confirm homepage loads.
5. Open PartSnap scanner.
6. Confirm result UI can display:
   - Fast field path
   - Source-backed candidates
   - AI-only fallback language
7. Confirm dashboard and checkout links still open externally as expected.
8. Build iOS and Android with updated store screenshots if screenshots show PartSnap.

## Suggested ASO Note

SplashLens helps pool and spa pros get off the pad faster with equipment/error-code lookup, PartSnap part-family assistance, proof prompts, service notes, dosing tools, and Facility Assist workflows. PartSnap is a reference aid: it suggests possible families and proof needed before ordering, not a guaranteed diagnosis or fitment replacement.
