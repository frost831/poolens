# SplashLens Codex briefs (2026-10-05)

Paste-ready implementation briefs for Joshua Frost / SplashLens.

| File | Audience | Purpose |
|------|----------|---------|
| [PC_CODEX_PASTE_GROWTH_SEO_ASO_AEO_2026-10-05.md](./PC_CODEX_PASTE_GROWTH_SEO_ASO_AEO_2026-10-05.md) | **PC Codex — PASTE TARGET** | Growth paste: SEO · ASO drafts · AEO · reactive GTM · miss→library factory · PC-G-01…20. Self-contained; implement all |
| [PC_CODEX_FULL_BOAT_2026-10-05.md](./PC_CODEX_FULL_BOAT_2026-10-05.md) | **PC Codex** | Full product backlog PC-01…PC-59 — paste entire file |
| [STRATEGY_WARM_MIDWEST_GROWTH_2026-10-05.md](./STRATEGY_WARM_MIDWEST_GROWTH_2026-10-05.md) | Joshua / both | Strategy: warm-state stale/non-tech/Spanish crews + Midwest closing season, Pool Brain partner, pricing, OEM FOMO, miss→library factory, competitive wedges |
| [MAC_CODEX_VERBAL_2026-10-05.md](./MAC_CODEX_VERBAL_2026-10-05.md) | Mac Codex (verbal) | ≤25-line script |
| [MAC_CODEX_NATIVE_TICKETS_2026-10-05.md](./MAC_CODEX_NATIVE_TICKETS_2026-10-05.md) | Mac Codex | Camera strings, store wrappers, rebuild, metrics |
| [PRICING_AND_PARTNER_FRAME_2026-10-05.md](./PRICING_AND_PARTNER_FRAME_2026-10-05.md) | PC Codex / Joshua | Authoritative cheap Pro/Teams + Pool Brain/OEM FOMO frame |
| [../research/splashlens-competitive-brief-2026-10-05.md](../research/splashlens-competitive-brief-2026-10-05.md) | Both | Competitive / options context |

**Rule:** PC Codex owns web app (`poolens`), marketing site (`poolens-site`), Stripe, Amplitude, data model. Mac Codex owns iOS/Android native wrapper builds only — **no IAP**.

**Pricing (2026-10-05):** Solo Pro **$19/mo · $149/yr**; Teams **owner-paid $49–79/mo, techs free** (was $149; kill $99); impulse **$5–10** packs. See pricing frame doc. Mac: pricing/site is PC — don’t change App Store price meta beyond what’s needed.

**Paste order for PC Codex:** (1) `PC_CODEX_PASTE_GROWTH_SEO_ASO_AEO_2026-10-05.md`: closing season is live, so Wave G0 goes first. (2) `PC_CODEX_FULL_BOAT_2026-10-05.md` for the full PC-01…PC-59 backlog. Both are in scope; waves are order, not cuts. PC drafts store copy/screenshot scripts into `aso/` + `store-assets/`; Mac ships builds/listings.

**Web cache rule:** Every PR that changes `js/*.js` or `index.html` must bump the `sw.js` cache name and version the changed asset URL in both the service-worker `ASSETS` list and `index.html`. Keep the URLs identical and retain deletion of old caches on activate.
