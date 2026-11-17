# Account activity isolation and uncertain Play payments

## Reproduced failures

The account endpoint searched serialized event props with an email substring.
An account such as `ann@example.com` could receive event names, paths and times
from `joann@example.com`, unrelated notes mentioning its address, and actions by
another account inviting it. Stripping `%` and `_` also made some valid email
addresses match a different address instead of their own. These were reproduced
with signed test account sessions and a real in-memory SQLite database; no other
customer's live records were read to demonstrate the defect.

The Google Play client treated any `AbortError` as purchase cancellation, even
when Google had already returned a payment response and only server verification
timed out. A payment response without a usable token also permitted another
purchase attempt in the same dialog. Both failures were reproduced before the
fix. These are simulated provider failures, not actual customer transactions.

## Repairs

Recent account activity now compares the full normalized address in explicit
JSON identity fields, with `actor_email` taking precedence over recipient fields.
Malformed legacy JSON is excluded without suppressing valid neighboring rows.
Names, event ordering, the twenty-row limit, the signed account requirement and
the response shape are preserved. No database migration is required.

After any returned Google payment response, the current client marks that item
as requiring restore. A missing receipt never unlocks access or starts a second
purchase in the same dialog. Verification aborts/timeouts explicitly report an
uncertain payment and direct the person to Restore. The dialog removes purchase
buttons in this state while keeping Restore, Google subscription management,
support and Close available. Cancellation before a payment response still allows
retry. Server verification remains the only source of paid access.

The browser assets are versioned `20261117-account-play-recovery-1`; the offline
cache is `splashlens-v71-account-play-recovery`.

## Validation and release boundary

The complete app suite passed **472 tests, zero failures and zero skips**, with
Chromium browser fixtures enabled. Four new regression tests reproduce the
account isolation/punctuation and uncertain payment failures. Desktop1365px and
mobile390px dialog tests also verify that uncertain payment recovery removes the
purchase controls, retains Restore, activates only after server confirmation,
and preserves keyboard behavior. Checkout-return and direct account sign-in
browser checks pass. Public staging also passes.

The existing deployed PR95 web round-trip proof and scoped provider setup are
recorded in [the Android billing runbook](android-play-billing-2026-11-17.md).
PR96 merged the updated handoff without changing runtime behavior. Google
merchant linking remains owner/provider work; do not interfere with that setup.
Production native billing remains disabled. No products, bank/tax details,
signing keys, store tracks, billing records or production billing schema were
changed for these repairs. Licensed internal Play purchase/restore/revocation
acceptance is still required before enabling native paid billing.
