# SplashLens Amplitude + Activation Game Plan

Generated: 2026-08-07

## Current Truth

SplashLens has a first-party event spine already live:

- App events: `https://app.splashlens.com/api/events`
- Site events: `https://splashlens.com/api/event`
- Owner dashboard: `https://app.splashlens.com/dashboard`
- App Amplitude config: `https://app.splashlens.com/api/amplitude-config`
- Site Amplitude config: `https://splashlens.com/api/amplitude-config`
- Checkout readiness: `https://app.splashlens.com/api/checkout-readiness`

Amplitude forwarding is wired in code for both the app and marketing site through server-side HTTP V2 forwarding. The owner dashboard remains the operational source of truth for immediate usage: opens, known users, anonymous clients, PartSnap use, scanner use, proof saves, feedback, checkout starts, paid conversions, campaigns, referrers, and demand lanes.

Live checkout status on 2026-08-07:

- `checkout-readiness` returned `productionReady:true`.
- Stripe account check returned `ok:true`, `chargesEnabled:true`, and `payoutsEnabled:true`.
- Webhook endpoint is enabled at `https://app.splashlens.com/api/stripe-webhook`.
- Required webhook events are present: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`.
- Monthly and annual PartSnap Pro Payment Links are active and route through `payment_link_direct`.
- Broader Service Proof, Team, Facility/CPO, Manufacturer Cards, Distributor/Counter, and Training Partner lanes are configured as pilot/partner checkout-capable lanes, while the public site still markets them conservatively.

## Remaining Wiring

Cloudflare still needs the Amplitude API key on both Pages projects:

```powershell
wrangler pages secret put AMPLITUDE_API_KEY --project-name poolens
wrangler pages secret put AMPLITUDE_API_KEY --project-name poolens-site
```

After the key is installed, deploy both projects and run:

```powershell
node tools\check-amplitude-readiness.mjs
```

GREEN means both the app and site accepted smoke events and queued them to Amplitude.

## Amplitude Events That Matter

Use these as the first saved Amplitude chart set:

| Funnel Stage | Events |
| --- | --- |
| Attention | `campaign_landing_view`, `article_referral_open`, `site_page_view`, `press_coverage_click` |
| App Intent | `open_app_click`, `app_store_download_click`, `google_play_download_click`, `partsnap_click` |
| First Open | `first_app_open`, `app_open`, `native_shell_first_open`, `pwa_standalone_open` |
| First Value | `manual_code_search`, `partsnap_result`, `facility_workflow_completed`, `service_report_saved`, `proof_ready_report_saved` |
| Proof | `partsnap_saved_to_pool`, `service_proof_share_link_created`, `service_proof_customer_summary_copied`, `service_proof_json_exported`, `service_proof_route_note_copied` |
| Feedback | `field_feedback_submitted`, `field_feedback_quick_answered`, `field_challenge_feedback` |
| Revenue | `upgrade_click`, `checkout_started`, `checkout_success` |
| Retention | any meaningful action by the same `client_id`, known user, pilot, or company after first use |

## Identity Rules

Do not pretend anonymous users are known people. SplashLens can know who is using the app only when one of these is present:

- voluntary email from feedback, tester, restore, checkout, partner, or pilot form
- tracked outreach link carrying a lead, recipient, referral, pilot, or participant id
- Stripe checkout or entitlement event
- company or facility tag from a pilot link

Amplitude now receives useful grouping data when available:

- app groups: `company`, `pilot`, `facility`
- site groups: `company`, `campaign`, `publisher`

## Seven-Day Operating Plan

1. Install the Amplitude API key in both Cloudflare Pages projects.
2. Redeploy app and site.
3. Run `node tools\check-amplitude-readiness.mjs` until it returns GREEN.
4. Build Amplitude charts for activation, first value, proof save, feedback, and checkout.
5. Keep the owner dashboard as the fast operational view.
6. Use tagged campaign links for every publication, podcast, trainer, distributor, manufacturer, and pilot.
7. Put every outreach CTA through the same field challenge: one real code, part, or equipment family.
8. Weekly, compare Amplitude behavior with the owner dashboard before making product decisions.

## First Decision To Make From Data

The next product decision should be based on which lane gets the highest first-value completion:

- PartSnap possible part match
- manual error-code lookup
- Facility Assist / CPO workflow
- Service Proof save/share
- field challenge feedback

The winner becomes the homepage CTA, onboarding default, and next outreach hook.
