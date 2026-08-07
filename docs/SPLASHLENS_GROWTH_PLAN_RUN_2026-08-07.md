# SplashLens Growth Plan Run

Generated: 2026-08-07T13:38:36.059Z

## Classification

YELLOW: live funnel works, but app Amplitude key and site Amplitude key must be added for Amplitude charts.

## Question

Can SplashLens tell which attention sources turn into real app use, first useful workflow, proof/feedback, and paid conversion?

## Tracked

- App event endpoint: 200 storage=YES email=YES
- Site event endpoint: 200 stored=YES fresh=YES
- Site public 7d events: 26
- Site public 30d events: 216
- App smoke stored: 200 stored=YES amplitudeQueued=NO
- Site smoke stored: 200 funnelForwarded=NO amplitudeQueued=NO
- Stripe readiness: productionReady=YES mode=payment_link_direct
- Stripe account: ok=YES charges=YES payouts=YES
- Webhook: ok=YES status=enabled missingEvents=0
- Payment links: ok=YES configured=2 active=2
- Monthly checkout redirect: 302 https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O
- Yearly checkout redirect: 302 https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P

## Missing

- App Amplitude key is missing in Cloudflare Pages project `poolens`.
- Site Amplitude key is missing in Cloudflare Pages project `poolens-site`.
- Protected owner-dashboard KPI snapshot was not pulled unless a stats secret is entered in the dashboard or supplied through a secure local env.

## Broken

- No payment readiness blocker found in public probes.
- No first-party event endpoint outage found.
- Amplitude ingestion is not active until the real SplashLens Amplitude API key is added to both Cloudflare projects.

## Event Plan

1. Keep all outreach, paid, podcast, magazine, and partner links tagged with `attribution_source`, `attribution_campaign`, and a stable `client_id` or `lead_id` when lawful.
2. Count `campaign_landing_view`, `article_referral_open`, `open_app_click`, `app_store_download_click`, and `google_play_download_click` as attention and intent.
3. Count `first_app_open`, `app_open`, `native_shell_first_open`, and `pwa_standalone_open` as app arrival.
4. Count `manual_code_search`, `partsnap_result`, `facility_workflow_completed`, `service_report_saved`, and `proof_ready_report_saved` as first useful work.
5. Count `partsnap_saved_to_pool`, `service_proof_share_link_created`, `service_proof_customer_summary_copied`, and `service_proof_json_exported` as proof value.
6. Count `field_feedback_submitted`, `field_feedback_quick_answered`, and `field_challenge_feedback` as roadmap feedback.
7. Count `checkout_click`, `upgrade_click`, and `checkout_started` as paid intent, but only `checkout_success` as paid conversion.
8. Review the owner dashboard daily for top sources, top campaigns, known users, anonymous clients, PartSnap source-backed versus AI-only results, checkout starts, paid conversions, and seven-day returns.

## Next Seven Days

1. Add the real SplashLens Amplitude API key to both Cloudflare Pages projects.
2. Rerun `node tools\check-amplitude-readiness.mjs` until GREEN.
3. Use `https://splashlens.com/campaign` or `https://splashlens.com/paid-media` for every serious send, not the broad homepage.
4. Send the CTA as a field challenge: run one real code, part, or equipment family.
5. Push the first paid ask only after a useful PartSnap/proof moment, not on first page load.
6. Call any checkout-click-without-checkout-success pattern a copy/pricing/checkout friction issue and inspect the flow.
7. Make the next homepage/app emphasis follow the highest first-value workflow, not opinion.

## Public Site Top Events

- site_page_view: 17
- amplitude_readiness_smoke: 6
- amplitude_wiring_smoke: 1
- growth_plan_smoke: 1
- persona_fork_click: 1

## Confidence

High for first-party event capture and Stripe readiness. Medium for full behavior analytics until Amplitude key is installed and the protected dashboard is reviewed with the stats secret.
