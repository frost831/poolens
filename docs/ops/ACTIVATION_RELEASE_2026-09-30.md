# SplashLens Activation Release - 2026-09-30

## Production release

- App commit: `cbdd659c04da0b8328ba2561feff5808ff3004a3`
- Site commit: `bdb7826e4c0c6c5a2de4741449d6c4f0276a1f55`
- App deployment: `https://a2eacce0.poolens.pages.dev`
- Site deployment: `https://0727c624.poolens-site.pages.dev`
- Canonical app and site returned HTTP 200 after deployment.
- Monthly checkout returned HTTP 302 to a live Stripe Checkout session.
- App tests: 62 passed, 0 failed.
- Site and editorial tests: 39 passed, 0 failed.

## Corrected 30-day baseline

The earlier 26-event useful-result figure included 11 zero-result scanner code searches. The corrected production query requires a positive `result_count`, leaving 15 qualified events across four sessions. Those qualified events were manual/text lookup or turnover results, not PartSnap image results; production recorded one AI scan attempt and zero AI scan completions.

| Signal | Current |
| --- | ---: |
| First actions | 41 |
| Qualified useful-result events | 15 |
| Distinct qualified-result sessions | 4 |
| PartSnap results | 0 |
| AI scan attempts | 1 |
| AI scan completions | 0 |
| Feedback responses | 7 |
| Checkout starts | 0 |
| New paid conversions in 30 days | 0 |
| Historical SplashLens paid completions | 1 |
| Active commercial entitlements | 1 |

## Release changes

- PartSnap now records attempted, blocked, completed, and failed scan states separately.
- Zero-result manual searches no longer count as first value.
- The post-result offer is: `Save this job, customer summary, and equipment history with Pro.`
- Feedback is requested only after a completed scan or useful lookup result.
- Checkout intent uses the canonical `checkout_click` event.
- Signed Stripe completion remains the source of truth for paid entitlement.
- All 120 Field Notes map to a specific app workflow with article attribution.
- The 10-tech closing pilot has ten stable participant links and reports completion, time to value, time saved, feedback, return use, PartSnap results, and checkout intent.
- Official App Store Connect and Google Play CSV formats are supported by the store-metric importer and owner dashboard.

## Analytics noise migration

The production migration copied 11,170 `session_heartbeat` rows from `events` to `engagement_events`, verified every row, then removed the copied rows from the operating funnel table.

| Table | Before | After |
| --- | ---: | ---: |
| `events` heartbeat rows | 11,170 | 0 |
| `engagement_events` heartbeat rows | 0 | 11,170 |

New heartbeat traffic writes directly to `engagement_events` and is not forwarded to Amplitude.

## Live smoke proof

- Deployed app JavaScript contains the exact Pro offer and `ai_scan_completed` event.
- Deployed service worker uses `splashlens-v13-activation-truth`.
- The published September 30 closing article returned HTTP 200 and linked to `workflow=closing` with article attribution.
- A future article returned HTTP 404.
- Protected stats without a secret returned HTTP 401 JSON.
- Amplitude configuration returned HTTP 200 JSON.
- The stale Stripe webhook probe returned HTTP 200 JSON.

## External gates still open

These cannot be completed truthfully with code or test traffic:

1. Official store data: App Store Connect is signed out and Google Play requires account reauthentication. No official export is present locally, so no metrics were fabricated or imported.
2. Named pilot: ten unique participant slots are live, but no real tech has accepted or used one yet. Current pilot counts are all zero.
3. New paid proof: the technical checkout-to-entitlement path is covered by regression tests and the live checkout opens, but no new real customer has completed payment in the last 30 days.

## Immediate success scoreboard

| Target | Current | Remaining |
| --- | ---: | ---: |
| Real PartSnap results | 0 / 10 | 10 |
| Feedback responses | 7 / 5 overall; 0 pilot | Pilot feedback remains unproven |
| Checkout starts | 0 / 3 | 3 |
| Verified new paid conversion | 0 / 1 | 1 |

Do not add another broad feature lane before this scoreboard moves through real external use.
