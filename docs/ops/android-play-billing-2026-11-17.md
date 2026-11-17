# Android Google Play billing candidate

The web app and backend now support Google Play Pro monthly and annual
subscriptions. Android candidate **1.0.13 (14)** adds Android Browser Helper
Billing **1.2.0**, whose Google Play Billing dependency is **8.3.0**. Existing
production build13 is separate and has not acquired native purchase support.
Closing Pro passes and Crew remain unavailable for native purchase. No prices,
subscriptions, merchant configuration, store tracks or signing keys were changed.

## Behavior and security

The Android scan-limit screen has a Google Play access/restore control. It shows
purchase buttons only after a fresh verified SplashLens account session, backend
configuration/schema checks, Google credential/catalog verification and native
Digital Goods capability/product-detail checks. Prices come from Google. The
monthly and annual products must be separate subscriptions, with configured
active base plans, P1M/P1Y billing periods, and US prices USD19/USD149 respectively.
Keep one eligible base plan per product; review any offer changes before enabling.

Purchases use Google's payment sheet. The client never grants paid access from a
receipt alone. The server checks `purchases.subscriptionsv2.get` for this exact
package and configured product/base-plan pair, rejects pending, paused, held,
expired and unsupported purchases, and preserves canceled paid-through access.
Test purchases are rejected unless explicitly enabled in the isolated test
environment. This implementation requires an auto-renewing subscription and does
not support prepaid, multi-item or replacement flows from the UI.

A purchase token is SHA256-keyed and atomically bound to one verified account;
the account key is a dedicated-secret HMAC, not a client-supplied identity. Tokens
are AES-GCM encrypted with row-associated authentication data. Android Browser
Helper currently omits the obfuscated account ID at purchase initiation, so the
first successful verified claim establishes ownership. Server acknowledgement
attaches that account ID through Google's `externalAccountIds`; existing provider
and linked-token bindings are respected. Keep purchase tokens confidential.

The durable owner record precedes acknowledgement. Uncertain acknowledgement
cannot return an activation token; restore retries safely. Every paid scan
requires the matching fresh account session and rechecks Google, including
revocation/expiry. There is no offline paid grant and no dependence on delayed
notifications. A D1 atomic limit permits20 billing checks per account per minute.
Failed verification does not call AI or consume scan quota. Restore can use the
encrypted server ledger without relying on the current Google account or the
removed Billing8 purchase-history API; an unrecorded purchase can be recovered
from the original installed Play account's active purchases.

Subscription cancellation routes to Google's official management page. The
dialog also provides official SplashLens support. No payment details or purchase
tokens are sent to analytics. The existing iOS native purchase guard is preserved.

## Related web/backend repairs

The third-scan upgrade controls now pass the actual placement through delegated
events instead of the literal nested template string. The scan API returns JSON
400 for null, array and primitive bodies before reaching the AI provider. The app
asset version in PR94 was `20261117-play-billing-1`; its offline cache was
`splashlens-v68-play-billing`, including the new public client module.

The follow-up account repair opens email verification directly from the account
dialog, without requiring camera permission or captured evidence. It also renews
expired account sessions for locally paid users without consuming a scan. Its
asset version is `20261117-checkout-return-1`, cache `splashlens-v70-checkout-return`.

After the owner verified `frost@belowzeromedia.com` directly in the isolated app,
production PartSnap processed the public Hayward brochure fixture and returned
a conservative Super Pump family candidate. The account endpoint agreed that
one free scan was used and two remained. Buying links stayed locked for missing
dimensions/identifying proof. This repeated brochure fixture proves live
transport, processing, rendering and metering; it is not four-view field evidence
or image-accuracy/native Android acceptance.

The result's monthly checkout opened on Stripe at USD19/month without payment.
Cancellation exposed an unsaved-result loss and a repeated camera explanation.
The follow-up preserves a bounded checkout draft in same-tab sessionStorage,
checks its account and 30-minute age on return, renders through the existing
escaped renderer, and deletes the draft after restoration. No account/profile
tokens enter the draft, and photos are not sent to analytics or another service.
This is local device storage under the existing privacy policy's local field-data
description, not an account-backed save or new server data collection. The age
limit is enforced on app access; clearing site data removes it. Session restore
by the browser may retain tab storage until the next app access.

Photo storage is capped at three million serialized characters. Quota-limited
browsers fall back to the answer without photos, with explicit reattachment
instructions and an incomplete evidence/order hold. If even that cannot be kept,
checkout stays in the app with an actionable storage error instead of silently
discarding the answer. Stale, future, malformed and different-account drafts
are discarded. A return never invokes AI, consumes quota or re-emits result/
activation/review events. A second checkout preserves QA traffic classification
from saved attribution even though Stripe's return URL has no campaign query.

## Validation

The PR95 app suite passed **468 tests, zero failures/skips**, with the real
desktop/mobile browser fixtures enabled. The paired site's focused regression
suite passed **29 tests**. The120-case metadata benchmark passed. The staged
Cloudflare Worker compiled successfully. These checks were run on Nov17.

Local Android debug APK and unsigned release AAB builds succeeded using JDK21,
Gradle8.11.1 and target/compile36. APK inspection confirms package
`com.splashlens.fieldtools`, version1.0.13/code14 and the merged BILLING permission.
No existing upload key was used or replaced.

Backend tests use real in-memory SQLite, generated test RSA credentials, signed
account sessions, verified OAuth JWT signatures, and mocked Google responses.
They cover ownership/replay, encrypted restore, acknowledgement retry, provider
failure, invalid states/products, rate limits and denial before AI/metering.
Client tests cover purchase, cancellation, restore, stale account, overlap,
existing subscription and unsupported/stalled bridges. Full-app Chromium tests
at1365px and390px cover failure/restore activation, keyboard trapping/Escape,
responsive fallback and absence of Stripe checkout requests.

These fixtures are not an actual Google purchase, a Play-installed build, a
physical-camera test or an image-identification accuracy result. The historical
120-case PartSnap benchmark is metadata-only. Current execution receipts and
screenshots are retained in the task's local `outputs/play-billing-20261117`.

## Current release and provider setup (Nov17)

[PR95](https://github.com/frost831/poolens/pull/95) merged as
`f3a3a90e9186b43791eced1f90b180e0c6bc6021`. Its tree matches the tested head
`6effd542098605b9b46a408aa3e09c450c7b1344`.
[Post-merge CI passed](https://github.com/frost831/poolens/actions/runs/44169839954).
After installing the approved encrypted secrets, the exact merged source was
redeployed to [production](https://app.splashlens.com) with immutable deployment
[b1f0b610](https://b1f0b610.poolens.pages.dev).
The deployed assets and offline cache match the checkout-return versions above.

The live desktop/mobile smoke passed for manual lookup, PartSnap recovery, XSS,
stored pool actions, offline updates, protected API boundaries and source hashes.
Six deployed-client checkout tests passed at1365px/390px using production assets
and a fixture Stripe handoff. Separately, the verified BZM QA account completed
one actual production AI request followed by the real USD19/month Stripe page
and cancellation return. Its answer and four repeated brochure fixture images
were restored without another camera prompt, scan charge or result event. The
account endpoint confirmed one free scan remaining. A read-only D1 query found
one each of scan completion, PartSnap result, checkout click/client-server,
checkout start and Stripe session creation, all classified QA. No payment was
submitted. This proves the web round trip; it does not prove native purchase,
physical-camera behavior or equipment fitment accuracy.

The owner-approved dedicated service account is active:
`splashlens-play-billing@below-zero-media.iam.gserviceaccount.com`, in the
existing `below-zero-media` project. Google Play Android Developer API is enabled.
Its saved Play permissions apply only to SplashLens: View app information
(read-only), dependent View app quality (read-only), View financial data, and
Manage orders and subscriptions. It has no account-wide or publishing grants
and no project-wide IAM role.

The replacement credential was generated locally; only its public certificate
was uploaded. The unused first key was revoked after explicit owner confirmation.
The active certificate expires **2027-11-17T20:35:58Z**; arrange rotation before
that date. A probe matching the backend JWT shape verified Google OAuth and
read the exact package's subscriptions endpoint successfully (HTTP204, no
product data returned). This verifies credential access, not real product or
purchase acceptance.

Both `SPLASHLENS_PLAY_SERVICE_ACCOUNT` and
`SPLASHLENS_PLAY_LEDGER_SECRET` are installed as encrypted production Pages
secrets. The local recovery copies are current-user Windows DPAPI encrypted,
owner/SYSTEM restricted and Git ignored. No private keys, tokens or ledger secret
belong in Git, support cases or chat. Preserve the ledger secret: replacement
requires encrypted-token and account-HMAC migration.

D1 access is restored. The additive billing migration was applied, read back,
and repeated idempotently in isolated preview only. Production D1 is not
migrated; `SPLASHLENS_PLAY_BILLING_ENABLED` remains off. No monthly/yearly product
or base-plan IDs were configured and no store track was changed.

## Merchant linking blocker

The owner reported completing the merchant profile. Read-only inspection found
an existing verified organization payments profile and a public merchant profile
on the correct owner login. Its shared public contact points to another app;
do not change that shared profile as a SplashLens-specific workaround.

Nevertheless, Play payments settings still says "Create a payments profile to
get started", SplashLens Monetize with Play still requires a merchant account,
and the setup flow repeatedly returns **OR-IDGRA-01** ("An unexpected error has
occurred. Please try again later."). Merchant linkage is therefore **not verified**.
No official cause for that exact error was established. Do not delete/recreate
profiles, migrate ownership, invent product IDs or weaken browser security.

The smallest external action is for the account owner
`hello@throttleshare.com` to resolve/link the Google Play merchant account using
[Play payments settings](https://play.google.com/console/u/1/developers/7017771963942604688/paymentssettings)
or [official developer support](https://support.google.com/googleplay/android-developer/gethelp).
The owner must handle legal seller, bank/tax details and final financial setup
directly in Google. Use `frost@belowzeromedia.com` for new SplashLens contact and
support. Existing shared profiles and account ownership must be reviewed before
any profile-wide change. Google's [payments verification guide](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)
distinguishes developer-identity profiles from monetization setup.

Use `frost@belowzeromedia.com` for SplashLens QA and new setup. This is a Google
Workspace mailbox. The owner entered the verification code directly in the
isolated app. The mail connector masks one-time codes; do not extract them
through another representation.

## Remaining activation gates

1. Verify Play merchant linkage and actual approved monthly/yearly products and
   base plans. Configure the four corresponding environment names in
   `.env.example` only from provider readback. Confirm intended-country pricing
   and availability. Do not overwrite another app's shared merchant contact.
2. Sign candidate1.0.13/code14 with the existing upload key and upload to the
   existing internal Play track after release approval. The current production
   build13 does not gain native billing from the web deployment.
3. Complete a licensed zero-real-money purchase, pending/cancel/retry, restore on
   another isolated device/account, entitlement and revocation checks.
   Enable `SPLASHLENS_PLAY_ALLOW_TEST_PURCHASES=true` only in the isolated
   acceptance environment. Do not charge a real card for QA.
4. Review the exact build/test/privacy evidence, apply
   `migrations/2026-11-17-google-play-purchases.sql` to production, and enable
   `SPLASHLENS_PLAY_BILLING_ENABLED` only after explicit store/release approval.
   Keep production test purchases disabled. Rollback disables the flag and
   preserves purchase records and secrets.

References: [ABH billing](https://github.com/GoogleChrome/android-browser-helper/blob/main/playbilling/README.md),
[Google verification/security](https://developer.android.com/google/play/billing/security),
[subscription status](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get),
[acknowledgement/account binding](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/acknowledge).
