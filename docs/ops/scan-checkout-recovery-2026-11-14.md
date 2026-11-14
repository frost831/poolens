# Scan, verification, and checkout recovery release

## Repairs

- A captured frame is retained in the active page session when verification is dismissed or fails. The verification recovery action resumes that same frame instead of only updating the account badge.
- Expired server-side verification triggers one bounded verification/retry using the original evidence. Duplicate capture and gallery submissions cannot overlap an active scan.
- Scan and verification requests have deadlines, with abort support when available. A timed-out scan releases its lock and retains the evidence for retry.
- Verification includes a resend action, a 60-second client cooldown, a status message, and an explicit reminder to keep the capture session open. Invalid codes remain editable in the same sheet.
- Late submissions cannot close a replacement sheet, and late AI results cannot overwrite a different scanner task. Switching tasks or restarting evidence invalidates the previous pending task.
- Local OCR can convert an ordinary HTML canvas using `toBlob`; it no longer assumes the OffscreenCanvas-only `convertToBlob` method exists.
- Checkout handoff failures emit a structured, non-personal failure reason. QA classification survives checkout creation, Stripe metadata, and server payment-funnel recording.
- The protected owner dashboard shows failures by step, reason, and platform, excluding QA. Counts represent attempts, not distinct people. Historical records with no platform remain unknown.
- The app bundle is `20261114-scan-recovery-1`; its service-worker cache is `splashlens-v66-scan-recovery`.

## Validation

The complete local regression suite passed **438 tests, with zero failures and zero skips**, with browser tests enabled. The new recovery tests exercise desktop at 1365px and mobile at 390px, including invalid code correction, resend cooldown and resend success, keyboard navigation, same-frame resumption, cancellation, quota recovery, duplicate submission, expired verification, request timeout, stale results, local canvas conversion, protected reporting SQL, and late-dialog isolation.

Recovery reporting executes against an actual in-memory SQLite database to verify QA exclusion and reason redaction. Checkout tests verify that the QA label persists into Stripe and all server-side funnel records.

The 120-case PartSnap reference benchmark passes. All 120 cases remain metadata-only; this is not an image-accuracy or fitment benchmark.

An actual Stripe sandbox Closing Pro checkout was exercised through a declined test card, successful retry, completed test payment, and device entitlement activation. The configured sandbox return origin is `https://stripe-test-55.poolens.pages.dev`. No real payment, live subscription, live card, product price, or billing configuration was changed. Test-browser storage was discarded after the run. This verifies the sandbox payment/activation path; it does not independently certify provider webhook delivery or real customer revenue.

## Release surfaces and evidence

- Candidate alias: https://scan-recovery-20261114.poolens.pages.dev
- Production app target: https://app.splashlens.com
- Production site: https://splashlens.com
- Automated browser screenshots and the sanitized sandbox receipt are retained in the November 14 recovery-release QA artifacts.
- Deployment uses the canonical repository's public-asset staging script and the official Wrangler Pages CLI. Production acceptance is recorded separately after the immutable commit is deployed.

## Acceptance boundaries

Captured photos are retained in the active page's memory, not newly persisted to disk. Browser/process termination can end that session. No new photo-storage or retention policy is introduced.

The Android wrapper remains build 13 and receives the versioned web bundle. Native store purchasing remains suppressed because that build has no native billing integration. This release does not claim native purchase support, a Play-installed physical-phone test, exact fitment, field-photo identification accuracy, a settled live payment, or a change to store-policy eligibility.
