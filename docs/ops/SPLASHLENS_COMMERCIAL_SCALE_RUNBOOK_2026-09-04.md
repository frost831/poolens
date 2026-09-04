# SplashLens Commercial Scale Runbook

Date: 2026-09-04

## North Star

SplashLens is the field proof and intelligence layer for pool, spa, swim-spa, and aquatic facility work.

Free field lookup stays free. Paid value starts when a tech, team, facility, trainer, distributor, or manufacturer needs saved proof, verified workflow language, usage visibility, or a clean handoff before a callback, warranty call, part order, or training decision.

## Live Commercial Lanes

1. Free Field Tools
   - Manual lookup, calculators, local notes, basic Facility Assist.
   - No payment required.

2. Splash Lens Pro
   - Live checkout lane.
   - Pricing target: $29/month or $249/year.
   - Unlocks expanded PartSnap/AI scanning, saved job proof, customer-ready notes, and supplier handoff language where paid access is available.

3. Team Workspaces
   - Pilot/request lane.
   - Pricing target: $149/company/month.
   - Crew invites, shared proof history, owner usage signals, team report exports.

4. Facility / CPO Mode
   - Pilot/request lane.
   - Daily checks, incident workflow, dose logs, staff handoff records.

5. Verified Manufacturer Cards
   - Partner lane.
   - Model families, known misses, required proof photos, preferred support language.

6. Distributor / Counter Mode
   - Partner lane.
   - Proof before ordering, part-family packets, counter-safe handoff, wrong-order reduction.

7. Field Learning OS
   - Training partner lane.
   - Five-minute field lessons, quizzes from real misses, trainer-reviewed cards, CPO workflow prompts.

## Server-Owned Systems

Cloudflare Pages Functions:

- `/api/free-profile`: passwordless email verification and free scanner profile/account token issuance.
- `/api/account`: protected account snapshot.
- `/api/team`: protected team workspace CRUD and invites.
- `/api/commercial`: protected commercial control plane for entitlements, proof metadata, intake, partner card requests, readiness, and audit records.
- `/api/checkout`: Stripe Checkout Session first, Payment Link fallback.
- `/api/stripe-webhook`: signed Stripe webhook that activates Pro entitlements only for verified SplashLens metadata or allowlisted Payment Links.
- `/api/stats`: protected owner stats endpoint.
- `/api/events`: event capture with internal heartbeat/headless filtering and Amplitude forwarding where configured.

D1 tables created on demand:

- `user_accounts`
- `free_profiles`
- `free_profile_verifications`
- `teams`
- `team_members`
- `team_invites`
- `commercial_entitlements`
- `commercial_intake`
- `service_proof_records`
- `partner_card_requests`
- `payment_events`
- `audit_records`
- `events`

KV:

- `SCAN_USAGE_KV` stores free scan metering, paid entitlement records, entitlement-session lookup, and commercial endpoint rate-limit counters.

Optional R2:

- `SPLASHLENS_PROOF_BUCKET` or `PROOF_BUCKET` is the next binding for actual proof image/object storage. Current deploy stores durable proof metadata server-side and keeps existing local/app proof payloads intact.

## Stripe Wiring

Required Cloudflare secrets/vars:

- `STRIPE_SECRET_KEY`
- `SPLASHLENS_STRIPE_WEBHOOK_SECRET` or `STRIPE_WEBHOOK_SECRET`
- `SPLASHLENS_ENTITLEMENT_SECRET` or `SCAN_ENTITLEMENT_SECRET`
- `SPLASHLENS_STRIPE_PAYMENT_LINK_IDS` or `SPLASHLENS_STRIPE_ALLOWED_PAYMENT_LINKS`
- `SPLASHLENS_STRIPE_PRICE_MONTHLY_PRO`
- `SPLASHLENS_STRIPE_PRICE_YEARLY_PRO`
- `SPLASHLENS_STRIPE_LINK_MONTHLY_PRO`
- `SPLASHLENS_STRIPE_LINK_YEARLY_PRO`

Webhook endpoint:

- `https://app.splashlens.com/api/stripe-webhook`

Webhook events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Acceptance proof:

- `/api/checkout?catalog=1` returns Pro configured.
- `/api/checkout?plan=monthly` redirects to Stripe.
- Signed Stripe webhook for a SplashLens session writes `payment_events`, `commercial_entitlements`, KV entitlement, and `audit_records`.
- Non-SplashLens payment sessions are ignored.

## Email Wiring

Official app mail must use the SplashLens authenticated sender.

Required:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM` or `SPLASHLENS_EMAIL_FROM`, preferably `SplashLens <hello@splashlens.com>`
- `SPLASHLENS_OWNER_EMAIL` or `SPLASHLENS_NOTIFY_EMAIL`

Used for:

- verification code / magic-link account flows
- team invites
- commercial access requests
- partner card requests

## Release Gate

Before store handoff or public push:

1. `node --check functions/api/commercial.js`
2. `node --check functions/api/stripe-webhook.js`
3. `node --check functions/api/checkout.js`
4. `node --check js/app.js`
5. `npm test`
6. Deploy with the project deploy script.
7. Smoke:
   - `https://app.splashlens.com/api/account` returns JSON 401 when unauthenticated.
   - `https://app.splashlens.com/api/team` returns JSON 401 when unauthenticated.
   - `https://app.splashlens.com/api/commercial` returns JSON 401 when unauthenticated.
   - `https://app.splashlens.com/api/checkout?catalog=1` returns JSON catalog.
   - `https://app.splashlens.com/api/checkout?plan=monthly` redirects to Stripe.
   - `https://app.splashlens.com` returns 200 and includes `20260904-commercial-scale`.

## Store Handoff Notes

Mac should pull the newest Git commit before iOS/Android wrapper refresh.

Plain English:

1. Pull latest `https://github.com/frost831/poolens.git` on `master`.
2. Open the native wrapper project.
3. Confirm the wrapper points at `https://app.splashlens.com`.
4. Refresh screenshots if the account/commercial dashboard is visible in store imagery.
5. Release notes should mention:
   - passwordless account sessions
   - Team Workspaces
   - Pro entitlement readiness
   - server-saved proof metadata
   - Facility/CPO and Field Learning OS pilot requests
6. Do not claim native in-app subscriptions until StoreKit / Play Billing is built and approved.

## Remaining Scale Thresholds

These are not blockers for the current commercial deploy, but they are the next hardening moves before larger teams:

- Add R2 proof image/object storage and retention controls.
- Add admin owner dashboard views for `commercial_entitlements`, `service_proof_records`, `commercial_intake`, `partner_card_requests`, and `audit_records`.
- Add subscription lifecycle handling for renewals, cancellations, disputes, and refunds.
- Add organization billing seats and team role controls beyond owner/admin/member.
- Add export jobs for CSV/PDF packets and weekly owner reports.
- Move from D1 to Postgres only when D1 query volume, joins, reporting windows, or object relationships become limiting.
