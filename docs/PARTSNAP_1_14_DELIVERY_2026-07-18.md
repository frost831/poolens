# PartSnap 1-14 Delivery Report

Generated: 2026-07-18

## What Shipped

1. **Real corpus spine**
   - Added a source-ranked PartSnap corpus module at `functions/_shared/partsnap-corpus.mjs`.
   - Current seed: 22 high-value part-family records.
   - Target: 500,000 families through ingestion, not fake-generated SKUs.

2. **Corpus-backed scan results**
   - `/api/scan` now enriches PartSnap AI results with `corpusStatus` and `corpusCandidates`.
   - UI can now separate `AI-only` from `source-backed candidates`.

3. **Human review queue upgrade**
   - `/api/partsnap-review` now exposes corpus status, candidate count, top match, source tier, source labels, and required proof.
   - AI-only feedback/mystery submissions are flagged as `corpus-gap`.

4. **Benchmark harness**
   - Added `tests/partsnap-corpus.test.mjs` for source-backed, AI-only, and snapshot safety behavior.
   - This is the base for the 500-photo labeled benchmark.

5. **Purchase/source language safety**
   - Source-backed candidates show required proof and source links.
   - UI still avoids exact-fit or buy-now claims without proof.

6. **Owner dashboard corpus metrics**
   - Dashboard now shows source-backed scans, AI-only scans, corpus candidate totals, corpus statuses, source tiers, match levels, and corpus health.

7. **Paid-lane clarity**
   - PartSnap Pro remains the live paid lane.
   - Source-backed results strengthen the paid pitch around more scans, saved proof, packets, and history.

8. **Native app handoff**
   - iOS/Android wrappers should be refreshed after this web deploy so TestFlight/Google builds inherit the corpus UI and scanner trust language.
   - Store metadata should say `AI-assisted PartSnap with source-backed family candidates and proof prompts`, not `guaranteed part ID`.

9. **New Equipment Radar feed**
   - Snapshot output and source registry define the weekly ingestion lanes: official catalogs, manuals, new-product pages, and reviewed field misses.

10. **Partner-verified guardrails**
    - Partner-verified remains gated to written partner approval.
    - Current state is `source-backed`, not `manufacturer verified`.

11. **Field UX tightening**
    - Added a 1-2-3 PartSnap field path:
      1. possible/source-backed family
      2. proof to capture
      3. save/share/escalate cleanly

12. **Corpus health endpoint**
    - Added authenticated `/api/partsnap-corpus` for seed count, target count, source count, coverage by category/manufacturer/tier, ingestion lanes, and trust rules.

13. **Corpus export automation**
    - Added `tools/export-partsnap-corpus-snapshot.mjs`.
    - Generated snapshot: `data/partsnap/generated/partsnap-corpus-snapshot.json`.

14. **Production cache hardening**
    - Added a versioned service worker and cache-busted app assets so installed app users can refresh into the corpus UI.

## Still Not Fake-Complete

- The full 500,000-family database is not populated yet. The pipeline is ready, but the bulk records must be ingested from official/permitted sources and reviewed.
- True partner-verified cards require written partner data or approval.
- Exact accuracy claims require a labeled benchmark set.

## Next Data Build

1. Create `data/partsnap/raw-sources/` for downloaded/permitted PDFs, CSVs, and manual extracts.
2. Normalize official catalog rows into:
   - manufacturer
   - category
   - component
   - model families
   - aliases
   - visual clues
   - required proof
   - source IDs
3. Promote reviewed wrong/missing PartSnap tickets into seed candidates only after human review.
4. Keep exact fitment language out unless model/part markings and source data align.
