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
asset version is `20261117-play-billing-1`; the offline cache is
`splashlens-v68-play-billing`, including the new public client module.

## Validation

The complete app suite passed **460 tests, zero failures/skips**, with the real
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

## Activation and release gate

On Nov17 the Cloudflare Pages secret-name inventory contained no
`SPLASHLENS_PLAY_SERVICE_ACCOUNT` or `SPLASHLENS_PLAY_LEDGER_SECRET`. Local process
environment contained no Google Play credentials. Pages deploy access is valid;
its current OAuth scopes do not include D1 migration access. Billing must remain
disabled. No remote billing migration or activation was performed.

1. In the existing developer account owning `com.splashlens.fieldtools`, provide
   the existing approved service-account credential with scoped subscription
   catalog and purchase verification/acknowledgement access. Store it only as
   the encrypted Pages secret `SPLASHLENS_PLAY_SERVICE_ACCOUNT`; never in Git/chat.
2. Provision the dedicated encrypted `SPLASHLENS_PLAY_LEDGER_SECRET` (random32+
   bytes). Preserve it across deployments. Rotation needs explicit encrypted-token
   and account-HMAC migration, not simply replacing a secret.
3. Confirm the actual approved monthly/yearly product and base-plan IDs and set
   the four corresponding environment names in `.env.example`. No product IDs
   are invented or created by this patch. Confirm Play merchant eligibility and
   product availability in the intended country/account.
4. With authorized D1 access apply
   `migrations/2026-11-17-google-play-purchases.sql` to the isolated preview store.
   The migration is additive; public requests never auto-create billing tables.
5. Sign code14 with the existing upload key and upload to the existing internal
   Play track after release approval. Test a licensed, zero-real-money purchase,
   pending/cancel/retry, restore on another isolated device/account, entitlement
   and revocation. Enable `SPLASHLENS_PLAY_ALLOW_TEST_PURCHASES=true` only in that
   isolated acceptance environment; never charge a real card for QA.
6. Review the exact test/build evidence and privacy operations, apply the same
   additive schema to production, then enable `SPLASHLENS_PLAY_BILLING_ENABLED`
   only after explicit store/release approval. Keep production test purchases
   disabled. Rollback turns the flag off and preserves purchase records/keys.

References: [ABH billing](https://github.com/GoogleChrome/android-browser-helper/blob/main/playbilling/README.md),
[Google verification/security](https://developer.android.com/google/play/billing/security),
[subscription status](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get),
[acknowledgement/account binding](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/acknowledge).
