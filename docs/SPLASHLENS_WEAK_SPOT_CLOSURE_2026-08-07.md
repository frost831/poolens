# SplashLens Weak Spot Closure - 2026-08-07

## Weak spots identified

The full 35-day first-party app pull now returns a `weakSpotScorecard`.

| Weak spot | Current | Status | Meaning |
| --- | ---: | --- | --- |
| Known-user attribution | 0% | weak | Usage exists, but almost none of it can be tied to a person, company, pilot, lead, or tracked campaign identity. |
| First-value completion | 24.6% | weak | Too many users open before reaching one useful lookup, scan, proof, or workflow completion. |
| PartSnap scan completion | 100% | good | Observed AI scan starts are reaching PartSnap results in the current pull. |
| Feedback capture | 33.3% | watch | One-tap feedback is working directionally, but detailed written feedback is still thin. |
| Checkout intent after value | 0% | weak | Paid conversion is not naturally following value yet. |
| Field challenge completion | 0% | weak | Campaign/challenge links were not consistently routing people into measurable task completion. |

## Fixes shipped

### 1. Post-value identity capture

After a meaningful workflow, the app now asks the user to tag the field test with a company or email.

Events added:

- `identity_prompt_shown`
- `identity_captured_after_value`
- `identity_prompt_dismissed`

This does not block free use and preserves the no-account promise. It simply gives willing users a way to identify themselves after the app has already delivered value.

### 2. Measurable homepage-to-app challenge links

The most important public-site CTAs now route into a `field60` challenge with explicit `challenge_path` and `challenge_id`.

Patched paths include:

- hero PartSnap CTA: `challenge_path=partsnap`
- hero Save Visit Proof CTA: `challenge_path=service_proof`
- nav Web App CTA: `challenge_path=app_choice`
- pricing Free CTA: `challenge_path=app_choice`
- bottom CTA: `challenge_path=app_choice`

### 3. Site click payloads now carry challenge context

Site-side tracking now sends:

- `destination`
- `destination_path`
- `field_challenge`
- `challenge_path`
- `challenge_id`
- `challenge_type`

This makes the site D1 event and the app KV event line up around the same funnel.

### 4. Protected usage pull now ranks leaks

`/api/usage-pull` now returns:

- `knownSignalCount`
- `anonymousRealCount`
- `knownSignalRate`
- `realTopSources`
- `realTopPaths`
- `realFunnelStages`
- `weakSpotScorecard`

The report separates real behavior from historical QA/test traffic.

### 5. Owner dashboard now shows the weak spots

`/dashboard` now loads `/api/usage-pull` and renders a `Weak Spot Scorecard` beside the existing activation funnel.

## What to watch next

The next 7 days should answer these questions:

1. Do users tag themselves after getting value?
2. Do challenge-linked homepage clicks complete a PartSnap or proof workflow?
3. Do wrong/missing feedback taps turn into actual notes?
4. Does a post-value paid offer beat a generic pricing-page offer?
5. Do named outreach links produce identifiable sessions?

## Next experiments

- Use `lead_id`, `company`, `utm_source`, `utm_campaign`, `challenge=field60`, and `challenge_path` on every outreach link.
- Send tech/media contacts to PartSnap challenge links, not the generic homepage.
- Send CPO/training/facility contacts to Facility Assist or service-proof challenge links.
- Ask for identity only after a useful workflow, not before.
- Push paid only after saved proof, repeated scans, or a vendor/customer packet.

## Current verdict

SplashLens is not failing because nobody opens it. It is leaking because too much attention is anonymous and unguided. The fixes shipped today make the next wave measurable: who came in, what promise they clicked, whether they reached value, whether they gave feedback, and whether that value created payment intent.
