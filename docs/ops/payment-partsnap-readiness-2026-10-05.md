# Payment and PartSnap readiness - 2026-10-05

## Completed work

1. Read-only verification of the 06:48 UTC Stripe session and matching D1 event.
2. Client and server pay funnel attribution, Amplitude forwarding, and owner reporting.
3. PartSnap pre-permission explanation, denied recovery, photo-library fallback, and success/failure instrumentation.
4. Canonical first-action and useful-value measurement; failed camera entry does not count either.
5. Native external-purchase bridge eligibility and wrapper review; current shell purchase guard retained.
6. Official store metrics importer fixes, export/access inspection, and native-open proxy verification.
7. User-initiated boss review draft from a successful PartSnap stop.

Repository: `frost831/poolens`, branch `master`, verified starting commit `e17f87c929d000e9b2317a88584ae9fcb91d9507`. Three agents owned disjoint client, importer/store-review, and boss-draft changes. Coordinator implemented payment server proof, reporting, cache updates, and integration checks. Checkout started clean; no unrelated work was discarded.

## Live evidence before release

At 2026-10-05T14:24:58Z, the required intelligence command returned app/site/catalog/Amplitude config HTTP 200, protected stats HTTP 401 without a secret, and stale webhook probe HTTP 200. Protected stats/admin were not pulled without a local secret. Existing authorized Wrangler D1 read access supplied the report.

Thirty-day production-clean evidence at that snapshot: 154 app-open events, 44 mixed legacy first-action events, 18 useful-result events across six distinct sessions, zero PartSnap results, six feedback events, zero checkout clicks, one server checkout start, and zero verified new SplashLens paid completions. These are event totals, not a sequential cohort conversion funnel. Historical heartbeat rows were already separated: 11,192 in engagement storage, zero in the main events table.

The corrected reporting counts only `first_action_started` as a first action and only checkout clicks as checkout intent. Historical totals therefore change definition at this release. `partSnapResults30d` now counts `partsnap_result_success`; legacy result attempts have their own field. New stages are not backfilled from old data or guessed from clicks.

### 06:48 UTC session

Stripe live account used by the connected integration: Below Zero Media, `acct_1TJ23t25fqLun6cV`.

Session `cs_live_b1YomdbvlSNNCAhfeiSC8Ud8HkeBtyt3xDIJiW4V5tsG17QCcVJA2KrHwp`:

- Created: 2026-10-05T06:48:28Z.
- Status: open; payment status: unpaid; subscription: absent; payment link: absent.
- Amount: 2,900 USD cents, monthly subscription mode.
- Customer email and client reference: absent.
- Metadata: product=splashlens, feature=scanner, plan=Splash Lens Pro Unlimited Monthly.
- D1 has one `checkout_started` at the same second, source `checkout_api`, monthly plan, iPhone Safari user-agent string, empty props.
- No matching production-clean `checkout_click` was found. Classification: **unattributed_server**.

This is evidence of the app server route creating a checkout session. It does not identify the person, prove a real prospect, or establish a failed card/payment. Stripe's session object does not provide a reliable dashboard-versus-app origin field; the exact timestamp and D1 route event are the corroborating source evidence. Session was left unchanged.

The production fulfillment endpoint `https://app.splashlens.com/api/stripe-webhook` is enabled in Stripe with checkout completion/async success, subscription lifecycle, invoice paid/failure/action-required, refund, and dispute events. The old rotation endpoint and old worker endpoint are disabled. No Stripe prices, endpoints, account settings, or sessions were modified.

## New event contract

- Client: `checkout_cta_shown` only for visible controls; `checkout_click` carries a fresh `sl_checkout_<UUID>`, anonymous device/session, placement, and store.
- Server: `checkout_session_created`, `checkout_completed`, `subscription_created`, `entitlement_granted` are written to the events table and forwarded to Amplitude. A receipt transaction deduplicates stage/reference pairs across success reloads and webhook deliveries.
- Public `/api/events` rejects forged server-payment events. Payment telemetry failure does not block checkout or entitlement delivery. Amplitude calls have a three-second timeout.
- Stripe metadata and subscription metadata preserve only validated anonymous attribution. Personal customer details remain in operational payment/entitlement records; none are added to payment analytics.
- Existing legacy click/result events remain for compatibility. Owner metrics count canonical events without adding aliases together. Unattributed session counts check for an actual matching click reference.
- PartSnap fires `partsnap_result_success` after a useful rendered match, and `partsnap_result_fail` for permission, scan, or identification recovery. Guided retry, unknown part, and low-confidence output do not become useful first value.

## Verification

- Integrated Node suite: **186/186 pass, zero skips** with `SPLASHLENS_PLAYWRIGHT_PATH` set to the bundled Playwright `index.mjs`.
- Payment behavioral tests use in-memory SQLite and mocked Stripe responses: reference transport, personal-value rejection, retry/reload deduplication, public event forgery rejection, analytics outage, and signed webhook plus success recovery.
- Desktop 1365x900 and mobile 390x844 browser checks: denied recovery, no false first-action/value, useful fixture result, boss draft, visible CTA impressions, anonymous checkout reference, no horizontal overflow or uncaught browser errors. Browser API requests were intercepted; no real scans/payments/production analytics were generated.
- Deterministic PartSnap benchmark: 120 reference-metadata cases across ten categories pass. Image-proven cases: **zero**. This does not prove photo-recognition accuracy, real fitment, or actual packet completion time.
- Git diff whitespace checks pass.

### Release verification

Web implementation `8e15369378fdf2c02d3f9e68da4b7868eb31dafa` was pushed and deployed to Cloudflare Pages (`https://2a092efa.poolens.pages.dev`). GitHub CI succeeded: https://github.com/frost831/poolens/actions/runs/37327108419.

Custom-domain checks on 2026-10-05 verified HTTP 200 and exact SHA-256 equality with the committed index, app script, boss module, and service worker. Protected stats remained HTTP 401. The live events API rejected a forged entitlement event with HTTP 403 before storage. Fixture-only browser checks also passed against the production shell on desktop and mobile without generating real analytics, scans, or checkout sessions.

That check exposed the `/dashboard` redirect to `/owner-dashboard`, a separate active asset. This follow-up updates that asset with distinct offers, clicks, canonical sessions, legacy starts, paid completions, subscriptions, and access grants. Two regression tests cover actual owner rendering and route selection. Independent event totals no longer display a step-to-step conversion percentage.

The post-deploy intelligence report at 2026-10-05T14:50:07Z confirmed app/site/catalog/config/webhook probes healthy and protected stats denied without a secret. Authorized D1 fallback returned 150 app opens, 18 useful results across six sessions, six feedback events, zero PartSnap results, zero checkout clicks, one legacy checkout start, and zero verified paid completions in the rolling 30-day window. Canonical first actions and new payment stages are zero at this definition cutover; old events are not backfilled or interpreted as lost activity. The named 06:48 session remains historical unattributed evidence, not a new canonical session event.

## Remaining external work

1. Official Apple/Google exports for the exact SplashLens app are absent. The available Play account does not own `com.splashlens.fieldtools`. Supply the correct account access or its official exports; normalize and inspect before import. Shell opens remain a proxy, not installs.
2. Native purchase steering needs trusted storefront/program eligibility and wrapper support. Current Swift wrapper blocks arbitrary external destinations and forces app-host navigation into shell mode; Android has no approved external-purchase integration. See [native bridge readiness](native-web-bridge-readiness-2026-10-05.md) for observed account and regional gates. No purchase CTA was enabled in the review shell.
3. A real successful subscription and entitlement delivery is still unproven. No real payment or synthetic live checkout was initiated by this release verification.
4. The labeled real-photo benchmark and field pilot still need actual photos/technicians. A fixture gate is not evidence of real PartSnap use or seven-day retention.

The next operating target remains ten real useful PartSnap results, five technician feedback responses, three tracked checkout starts, and one verified new paid conversion. Current success is implementation and test proof, not attainment of that business target.
