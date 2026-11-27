# Reviewed manufacturer references — November 26, 2026

Owner-requested coverage expansion. This adds two narrow families to the existing static corpus: 12 official source routes and 19 families in total. A family is a reference route with missing-evidence prompts; it is not a diagnosis, exact replacement, warranty decision or manufacturer endorsement.

## Primary sources

- [Pentair IntelliFlo3 / IntelliPro3 VSF guide 356231.F, Replacement Parts](https://www.pentair.com/content/dam/extranet/nam/pentair-pool/residential/pumps/intelliflo3-vsf/manuals/install-guide/intelliflo3-pro3-vsf-install-guide.pdf#page=29), printed pages 24–25 / PDF pages 28–29. The separate 1.5 HP and 3 HP lists require variant proof. No part number is recommended or imported into a replacement rule.
- [Maytronics LIBERTY 100/200/300/400 instructions 8151995-EN](https://brand.maytronics.com/m/4affee30fc37cb11/original/User-Manual-8151995-EN.pdf#page=5), sections 1–3 and 10–11. Model-specific accessories, charger identity, indicators and observation time inform the evidence checklist. This does not cover LIBERTY 600, authorize opening batteries, or establish charger compatibility.

The exact-manual families require a model phrase with token boundaries; a LIBERTY 3000 substring cannot qualify as LIBERTY 300. Unsupported models keep the existing uncertain-candidate behavior. All candidates retain `exactFitmentConfirmed: false` and ordering remains on hold for verification.

Owner learning review accepts a page fragment only when the complete URL exactly matches an approved corpus source. Added queries, credentials and arbitrary fragments remain rejected. This fixes the integration between precise citations and the existing review gate without broadening fragment acceptance to other sites.

## Document delivery evidence

`node tools/audit-partsnap-manuals.mjs` checks only these reviewed entries using a bounded public Range GET. At 2026-11-27T02:32:20.911Z both returned HTTP 206, PDF content type and `%PDF-` signature. The audit rejects an HTTP 200 HTML challenge page. No document is redistributed, login attempted, challenge bypassed or full-site crawler installed.

The legacy Polaris H0748900 download returned a small HTML challenge despite HTTP 200. It was excluded from verified exact-manual coverage. Existing broad Polaris support routes on the site remain reference routes, not verified manual content.

## Validation and limits

- Full app suite with installed browser fixtures: **499 passed, zero failed/skipped**.
- Focused exact-manual and owner-learning tests: **18 passed**.
- Deterministic PartSnap benchmark: **120 metadata cases across 10 categories passed; zero image-proven cases**. These numbers do not establish image recognition accuracy, live AI performance, fitment or a customer outcome.
- Live exact-document audit: **2/2 PDF checks passed**.

The corpus operator skill's old build/export filenames no longer exist in this repository. The current sources are `functions/data/partsnap-source-corpus.mjs` and `functions/lib/partsnap-corpus.mjs`; the actual full suite, live document audit and benchmark above validate this implementation.

Prepared for owner review against master. No production deployment, payment, store release or authenticated customer test is claimed by this change.
