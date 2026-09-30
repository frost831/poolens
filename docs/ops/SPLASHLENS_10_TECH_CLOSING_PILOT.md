# SplashLens 10-Tech Closing-Season Pilot

Pilot ID: `closing-season-10-tech-2026`

## Assignment

The ten unique links are in `ops/closing-season-10-tech-pilot.csv`. Replace only the `status` value when a real participant accepts; keep each `participant_id` and URL fixed so the funnel remains attributable. Participant names and contact details belong in the private outreach system, not Git.

## One Assignment

Each tech runs one real closing-season stop through the link and completes the closing workflow. The app records challenge start, qualified result, seconds to value, feedback, time-saved range, return use, checkout start, and upgrade intent. A result is not counted when a lookup returns zero matches.

## Participant Message

Subject: One real closing stop through SplashLens

I am asking ten working pool techs to pressure-test one closing-season workflow. Use your unique link during one real stop, complete the record you would normally need for the customer or spring crew, and give the short feedback prompt at the end. We are measuring whether it saved time, where it got in the way, whether you returned, and whether the paid save/history layer would actually help. SplashLens is reference support, not a replacement for current manuals, labels, company procedure, local requirements, or qualified judgment.

## Daily Readout

Run:

```powershell
npm run pilot:report
```

The report shows all ten participant IDs even before activity. The operating targets are ten completed closing challenges, five feedback responses, three checkout starts, and one Stripe-verified new paid conversion. Do not substitute test traffic or historical payments for those targets.

## Stop Rules

- Do not publish participant identity, customer information, or pool addresses.
- Do not count internal, demo, bot, heartbeat, or QA traffic.
- Do not claim time saved unless the participant selects a time-saved range.
- Do not call a checkout click a sale. Paid proof requires a signed Stripe webhook and active entitlement.
