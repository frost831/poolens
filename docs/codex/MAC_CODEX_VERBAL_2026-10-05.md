# Mac Codex Verbal — SplashLens native wrappers only
**Date:** 2026-10-05 (CT) · **For:** Joshua Frost → paste/say to Mac Codex

---

Mac Codex: only native iOS/Android wrapper work for SplashLens / `frost831/poolens`.

1. Camera permission strings + gallery-pick fallback when camera is denied (PartSnap path).
2. Keep `?store=ios|android` hiding Stripe CTAs — **no IAP, no in-app Stripe**.
3. Rebuild / TestFlight / Play internal track if needed after web hooks land.
4. Export App Store Connect + Play Console metrics CSVs into the existing store-metrics import path if available.
5. Do **not** implement web/Stripe/site/product backlog on Mac.
6. Pricing/site is **PC Codex** — don’t change App Store price meta beyond what’s needed for wrappers; no IAP SKUs.

Full product backlog lives in `docs/codex/PC_CODEX_FULL_BOAT_2026-10-05.md`.
Ticket detail for Mac-only work: `docs/codex/MAC_CODEX_NATIVE_TICKETS_2026-10-05.md`.
Competitive context: `docs/research/splashlens-competitive-brief-2026-10-05.md`.

## Mac-only checklist
- [ ] NSCameraUsageDescription / Android CAMERA rationale strings updated
- [ ] Gallery / photo-library fallback wired for PartSnap when camera denied
- [ ] Flashlight / lighting tip copy surfaces on deny or dark-pad miss
- [ ] Store wrapper still strips Stripe upgrade buttons under `store=ios|android`
- [ ] No StoreKit / Play Billing SKUs added
- [ ] Native rebuild + TestFlight / internal Play build after PC leaves hooks
- [ ] Store metrics CSV export (downloads, crashes, ratings) if consoles allow
- [ ] Confirm web “Upgrade on splashlens.com” deep link opens Safari/Chrome, not in-webview Stripe
