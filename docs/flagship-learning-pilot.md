# Flagship learning pilot

SplashLens PartSnap is the first adapter. Other products use the same versioned
contract and separate product keys. This is supervised equipment-family retrieval,
not foundation-model training or a claim of improved vision/fitment accuracy.

## Live workflow

1. A signed-in successful PartSnap scan returns a signed seven-day receipt. It
   contains structured equipment observations and the frozen baseline family IDs,
   never the photo or email. The scan still succeeds when learning is unavailable.
2. Helpful, Saved time, Wrong and Missing open a feedback form. A contribution is
   stored only after explicit current-version consent. Retries reuse the receipt
   ID. The original prediction cannot be substituted by a browser payload.
3. `/dashboard` has **PartSnap learning pilot → Load learning review**. The owner
   verifies a family (or abstention) against an official corpus manufacturer host,
   or rejects it. Feedback and helpful votes never verify themselves.
4. **Evaluate candidate** freezes reviewed knowledge and a report. Only verified
   real learning cases enter retrieval. QA, bots and pending/rejected feedback are
   excluded. Equipment-model groups always stay together; holdout groups cannot
   train retrieval. Duplicate holdout groups count once.
5. Activation requires 10 independent learning groups, 30 independent real holdout
   groups, an abstention case, at least a five percentage-point accuracy gain, a
   one-sided exact paired McNemar probability <= 0.05, no previously correct case
   regressions and no unsupported holdout predictions. This measures structured
   retrieval only. It is not an independent field/clinical/financial certification.
6. Owner activation exposes additional reviewed family guidance on subsequent
   scans. Baseline evidence/ordering gates remain. **Return to baseline** retires
   active knowledge immediately. External product adapters remain shadow-only.
7. Signed-in people can delete all their learning contributions from the form.
   Deletion and snapshot retirement/redaction are atomic. Evaluation refuses a
   changed review/deletion cohort rather than persisting withdrawn examples.

## Runtime and deployment

- Cloudflare Pages, existing `SUBSCRIBERS_DB` D1 binding; additive migration
  `migrations/2026-11-23-flagship-learning.sql` must be applied before enabling.
- `FLAGSHIP_LEARNING_ENABLED=true` enables the feature. Setting it to `false`
  disables learning without disabling the scanner.
- Receipt signer: `FLAGSHIP_LEARNING_SIGNING_SECRET`, otherwise existing
  `SPLASHLENS_STATS_SECRET` / `SPLASHLENS_ADMIN_SECRET`, minimum 32 characters.
- Existing account signer and verification continue to govern browser access.
- Product owner key: `FLAGSHIP_LEARNING_<PRODUCT>_ADMIN_KEY`. SplashLens also
  accepts its existing owner secret. Ingestion keys never grant review or read.
- Product ingestion key: `FLAGSHIP_LEARNING_<PRODUCT>_INGEST_KEY`; provision a
  distinct random secret in producer and service only when connecting that product.
- Do not expose product/admin keys to a browser, commit them, or put them in URLs.
- Preview uses the already configured separate D1/KV stores. Never substitute
  production bindings in a preview deployment. Rolling code back retains pilot data.

## Contracts

`GET /api/learning?product=splashlens` is owner-only and returns counts, the last
100 cases (no owner hashes), reviewed label options and the last 20 versions.
`POST` accepts JSON up to 20 KB. Unknown products/origins fail closed.

| Action | Authorization | Behavior |
| --- | --- | --- |
| `submit` | Signed account + its scan receipt, or product ingestion key + its receipt | Explicit consent/version, bounded equipment note, outcome; idempotent pending ticket |
| `observe` | Non-SplashLens product ingestion key | Signs structured observation and immutable baseline IDs; sandbox defaults to QA |
| `review` | Matching product owner key | One pending case; verified label/null and approved reference, or rejected |
| `evaluate` | Matching product owner key | Immutable candidate snapshot and held-out comparison report |
| `promote` | SplashLens owner key | Passed candidate only; atomically activates one version |
| `rollback` | Matching product owner key | Retires active version |
| `forget` | Signed SplashLens account | Erases that account's contributions and invalidates snapshots |

Feedback submissions are limited to 20/hour per pseudonymous owner. Evaluation
refuses a cohort above 10,000 rows instead of silently truncating it. This pilot
has no cron, outbound email, X scraping, model-provider call or background training.

## ThrottleShare connection

`tools/adapters/throttleshare_learning.py` is a standard-library Python connector.
Use consented, confirmed outcomes to assess query-to-category suggestions. Supply
the original requested category separately from the confirmed category; the answer
must never enter prediction inputs. Event keys are SHA-256 hashed before transit.
Only market/equipment/category labels are accepted, not names, emails, precise
locations, booking IDs, messages or payment data. Use a product-specific key.

Candidate evaluations cannot change ThrottleShare listing eligibility, pricing,
coverage, payments, notifications or ranking. A separately qualified marketplace
adapter release follows only after the pilot demonstrates improvement. This also
cannot establish booking-conversion lift: that needs a later controlled experiment
with eligible inventory and actual paid-booking outcomes.

## Verification

```text
node --test tests/flagship-learning.test.mjs tests/learning-browser.test.mjs
node --test tests/*.test.mjs
node tools/run-partsnap-benchmark.mjs
node tools/flagship-learning.mjs status
node tools/flagship-learning.mjs evaluate
```

Browser tests use `SPLASHLENS_PLAYWRIGHT_PATH`; screenshots are optional through
`LEARNING_SCREENSHOT_DIR`. SQL tests use Node's real SQLite database behind the D1
interface, including transactions, uniqueness and rollback. Browser fixtures prove
consent, retry preservation, storage success, touch sizes and deletion at mobile
and desktop widths. Fixture gains are engineering demonstrations only. Real pilot
improvement remains unproven until the real-case report passes its gate.
