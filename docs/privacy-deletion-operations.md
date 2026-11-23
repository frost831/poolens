# Verified privacy deletion intake

The account screen and `/data-deletion.html` let people initiate an account or
data-only deletion request without composing a support email. Fresh email-code
verification uses the existing signer but does not create/update a scanner
account. `POST /api/privacy-deletion` derives identity from that signed token,
requires same-origin JSON and explicit DELETE confirmation, and records an
idempotent request in `privacy_deletion_requests`.

## Required ongoing operation

This is **manual processing**, not automatic erasure. The public form and policy
state that processing takes up to 30 days and completion is confirmed by email.
The existing SendGrid configuration delivers the verified request ID, subject,
scope, and deadline to `SPLASHLENS_NOTIFY_TO` (or the published privacy contact,
`hello@splashlens.com`, when no valid single recipient is configured). Delivery
failure is reported to the person; the durable request can be retried safely.

The privacy operator must process each notice by its recorded deadline:

1. Read the stored verified request, matching its ID and email. Do not substitute
   an email from an unverified support message. Duplicate notices with the same
   ID are the same request.
2. For an account request, remove the account/profile and associated personal
   data, including user-owned saved/shared proof content and identifiable event
   properties. Locate all related client/account IDs before removing the profile.
   For a data-only request, remove saved content and identifiable activity while
   retaining the account/profile required for sign-in.
3. Review team ownership/shared records carefully. Do not erase another team
   member's account or unrelated records. Retain personal records only when
   legally required, and identify the retained data, reason, and retention period
   in the completion response. Do not describe ordinary retained product data as
   legally required without a basis.
4. Do not claim that this request cancelled an Apple, Google, or other subscription.
   The form warns that billing cancellation is separate; deletion is not gated on
   cancelling a subscription or contacting support.
5. Confirm actual completion to the verified email, then remove the intake
   record's personal data. Do not mark a queued request as a completed deletion.

Google Play rollout adds `google_play_purchases` only when its reviewed migration
is applied. The account identifier is HMAC-SHA256 of `play-account:<normalized
verified email>` using `SPLASHLENS_PLAY_LEDGER_SECRET`; this is still associated
personal data. Resolve that identifier before erasing an account and include its
purchase-ledger records, `google_play_request_windows` abuse-limit row, and
encrypted purchase tokens in access/export/deletion
processing, subject to the same documented retention exceptions above. Never
export service credentials, ledger encryption keys, or another account's tokens.
Removing ledger data does not cancel a Google subscription; direct cancellation
to Google's official subscription management workflow. Keep this feature disabled
until provider setup, operational review and installed-Play acceptance are done.

Production smoke checks must not submit test requests or send real email. Use
the SQLite/provider fixtures for success, retry and failure cases. An unauthenticated
production POST can verify rejection without creating records or sending mail.

## Release and rollback

### PartSnap learning contributions

Learning uses HMAC-SHA256(`learning-owner:<normalized verified email>`) with
`FLAGSHIP_LEARNING_SIGNING_SECRET` (fallback: the existing stats/admin secret).
Resolve this identifier before erasing the account. Remove matching SplashLens
rows from `learning_cases`. Retire and clear `knowledge` and `report` for all
SplashLens `learning_versions` in the same transaction, because snapshots can
contain contributions and case IDs. Rebuild only from remaining contributions.
The signed-in `POST /api/learning` action `forget` performs these operations.
Do not remove another product's cases. A key rotation requires retaining the old
HMAC key for deletion lookup or migrating the pseudonymous identifiers first.

The live production baseline is Cloudflare deployment
`ffa236af-7f5f-41a0-8790-8d015fee8e75`, source
`62dc49682907e604b9c0ffd215332c769db3a9e7`. Base the repair on this deployed
source, preserving its hosted app features. Keep the iOS19/Android13 native
artifacts and source identity separate; this repair changes hosted content only.

The schema change is additive and occurs only after a verified, confirmed request.
The intake endpoint never deletes existing production account/content records.
Rollback switches the Pages deployment back to the retained baseline; preserve
any new request records and notices for processing. Never drop that table or
erase customer records as release cleanup. Existing preview and production
database/KV bindings must remain isolated.
