# PartSnap Evidence Graph Plan

## The Problem

PartSnap cannot be positioned as a magic photo scanner. Pool parts are full of lookalikes: lids, baskets, O-rings, impellers, seals, unions, boards, sensors, robot tracks, spa packs, and old/private-label parts can look similar across generations.

The defensible product is not "AI guessed the part." The defensible product is:

**AI photo assistance + source-ranked parts corpus + missing-proof checklist + human/partner review loop.**

## What Exists Today

- `/api/scan` sends the user image to Anthropic vision with a strict JSON prompt.
- The PartSnap prompt already requires visible evidence, missing proof, alternates, search terms, and `high/medium/low` confidence.
- The app already tracks `partsnap_result`, low confidence, high risk, second proof, saved proof, packet copy/share, and mystery submissions.
- `/api/partsnap-feedback` stores field feedback/mystery submissions in `SCAN_USAGE_KV`.
- `/api/partsnap-review` exposes an admin review queue and builds senior-tech/vendor packets.

That is a solid start, but it is still model-first. The next layer must be corpus-first.

## The Database To Build

Build a local/Cloudflare-backed **PartSnap Evidence Graph**.

Core tables/collections:

### `part_families`

- `id`
- `manufacturer`
- `brand_aliases`
- `equipment_category`
- `component`
- `model_family`
- `known_models`
- `oem_part_numbers`
- `superseded_numbers`
- `common_counter_names`
- `visual_clues`
- `lookalike_warnings`
- `required_proof`
- `safety_notes`
- `source_ids`
- `verification_level`

### `source_documents`

- `id`
- `tier`
- `publisher`
- `url`
- `document_type`
- `title`
- `revision_date`
- `allowed_use`
- `last_checked_at`
- `notes`

### `part_observations`

- `id`
- `source`
- `photo_hash`
- `ai_result`
- `confidence`
- `missing_proof`
- `human_corrected_result`
- `review_status`
- `reviewer`
- `created_at`

### `lookalike_rules`

- `id`
- `category`
- `component`
- `looks_like`
- `proof_to_separate`
- `warning_copy`
- `source_ids`

### `partner_verified_cards`

- `id`
- `partner`
- `manufacturer`
- `model_family`
- `approved_copy`
- `required_photos`
- `support_routing`
- `approved_at`
- `expires_review_at`

## Source Ranking

1. **Official manufacturer catalogs/manuals**: highest trust for model families, part numbers, manuals, and warranty-safe wording.
2. **Authorized/distributor catalogs**: useful for aliases, replacement numbers, counter language, and search routing.
3. **Public parts-diagram vendors**: useful for diagram item names and retail search terms, but secondary verification only.
4. **Field feedback**: product-learning signal only until reviewed.

## Source Registry

Machine-readable registry lives at:

`data/partsnap/reference-sources.json`

Priority sources identified:

- Pentair official replacement parts by category.
- Pentair current 2025-2026 product catalog and quarterly update lane.
- Hayward manuals and buyer guide / parts list lane.
- Jandy / Zodiac / Fluidra official genuine-parts/catalog route.
- Maytronics official Dolphin parts/accessories lane.
- POOL360 / PoolCorp / SCP sourcebooks and parts guide.
- INYO and MyPool public diagrams as permitted secondary diagram/search references.
- SplashLens field feedback and mystery-part review queue.

## Scanner Flow After Corpus

1. User scans part.
2. AI returns visual clues and possible category.
3. App queries PartSnap Evidence Graph for matching manufacturer/category/model/visual clues.
4. Result becomes:
   - **Visible marking**: part number/model plate is visible and matches a corpus entry.
   - **Likely family**: brand + model family + component clues align, but part number is missing.
   - **Possible**: category/component likely, but model proof missing.
   - **Unknown**: not enough evidence.
5. UI shows source-backed proof:
   - visible evidence
   - missing proof
   - lookalikes
   - source links
   - vendor/senior-tech packet
6. Any wrong/missing flag creates a review ticket.

## Accuracy Measurement

Do not publish a single accuracy percentage until we have a labeled test set.

Track internally:

- exact part number precision
- correct model-family precision
- correct component/category precision
- false confident rate
- missing-proof usefulness
- human correction rate
- vendor packet usefulness
- wrong-order avoidance stories

Initial gates:

- 500 reviewed photos: internal beta only.
- 2,000 reviewed photos: start talking model-family accuracy, not exact fit.
- 10,000 reviewed photos plus partner cards: stronger market claim.

## Immediate Build Order

1. Create source registry. Done.
2. Build `part_families` seed JSON/SQLite/D1 shape from official manufacturer sources.
3. Start with 100 high-value families:
   - pump lids/baskets/O-rings
   - pump seals/impellers/diffusers
   - salt cells/flow switches
   - heater sensors/boards/igniters
   - robot tracks/brushes/cables/power supplies
   - automation relays/actuators/remotes
   - spa topsides/packs/heaters/flow switches
4. Add source links and required proof for each.
5. Patch `/api/scan` to attach corpus candidates after AI result.
6. Patch result UI to show "source-backed candidate" versus "AI-only possible match."
7. Review all mystery submissions weekly and promote corrected patterns into the graph.

## Trust Language

Use:

- "possible match"
- "likely family"
- "visible marking match"
- "proof still needed"
- "verify before ordering"
- "source-backed candidate"

Do not use:

- "confirmed fit"
- "guaranteed part"
- "diagnosed"
- "manufacturer verified" unless written approval exists
- "AI accurate" without labeled benchmark data

## Partner Pitch

Give us model families, docs, known lookalikes, required proof photos, and support language. SplashLens turns that into field-safe cards that reduce bad photos, wrong part orders, support back-and-forth, and warranty-sensitive wording.

The partner value is not advertising. It is cleaner proof before support, counter, warranty, and replacement conversations.
