# Mac Codex Native Tickets — SplashLens
**Date:** 2026-10-05 (CT) · **Scope:** iOS / Android store wrappers only  
**Repo:** `frost831/poolens` · **Do not touch:** web Stripe, site pricing, Amplitude product events beyond native pass-through

PC owns the full backlog in `docs/codex/PC_CODEX_FULL_BOAT_2026-10-05.md`. Mac owns only what requires Xcode / Android Studio / store consoles.

---

## MAC-01 — Camera permission strings + rationale
**Why:** PartSnap camera denials kill first value; store review needs clear purpose strings.  
**Touch:** `ios/` Info.plist / Capacitor config; `android-twa/` / AndroidManifest; any Median/Capacitor wrapper configs; `STORE_WRAPPER_HANDOFF.md` if strings documented.  
**Do:**
- Set clear NSCameraUsageDescription: identify pool/spa equipment markings for field reference (not surveillance).
- Android CAMERA permission rationale matching the same intent.
- Photo library / READ_MEDIA_IMAGES (or photo picker) strings for gallery fallback.
**Acceptance:**
- Fresh install prompts show accurate SplashLens purpose text.
- Deny-camera path still opens gallery picker (MAC-02).
- No Stripe / IAP language in permission sheets.
**Out of scope:** Implementing PartSnap CV; that’s web/PC.

## MAC-02 — Gallery fallback + flashlight tips (PartSnap deny path)
**Why:** Funnel shows camera denials; first value often `manual_code_search` instead.  
**Touch:** Native bridge that exposes gallery pick to the PWA; optional flashlight capability if wrapper supports it; ensure web hooks for deny UI can call native picker.  
**Do:**
- When camera permission denied or unavailable, expose a native gallery / photo-library picker to the PWA.
- Surface flashlight tip copy (or torch toggle if wrapper supports) for dark pad photos.
- Coordinate with PC PartSnap deny UX events: `partsnap_camera_denied`, `partsnap_gallery_picked`.
**Acceptance:**
- Deny camera → pick from gallery → image reaches existing PartSnap upload path.
- Event hooks fire (or documented bridge contract if events stay in web).
**Do not:** Add IAP paywall on camera deny.

## MAC-03 — Keep store wrappers Stripe-free
**Why:** Policy + intentional product design; web is only paid path.  
**Touch:** Wrapper URL must remain `https://app.splashlens.com/?store=ios` / `?store=android`; verify no injected checkout.  
**Do:**
- Confirm store builds load with `store=` query param.
- Regression-check: Pro upgrade CTAs hide; “Unlock on web” / Safari handoff only.
- No StoreKit, no Play Billing, no third-party IAP SDK.
**Acceptance:**
- Side-by-side: web shows Stripe; store wrapper does not.
- External browser upgrade link works from native shell.
**Do not:** Implement native IAP “for convenience.”

## MAC-04 — Rebuild / TestFlight / Play internal
**Why:** Ship MAC-01–03 after PC web hooks land.  
**Do:**
- Bump native build numbers as needed.
- Archive iOS → TestFlight; Android → internal testing track.
- Smoke: offline shell, code search, PartSnap camera+gallery, store CTA hide, web upgrade link.
**Acceptance:** Installable builds on both platforms with checklist above green.

## MAC-05 — Store metrics CSV export (stub consumer already on PC)
**Why:** Attribution noise; need store downloads/crashes vs web funnel.  
**Touch:** Export from ASC / Play Console; drop into path expected by `functions/api/store-metrics.js` + `migrations/2026-09-10-store-metric-imports.sql` (PC owns importer).  
**Do:**
- Export available metrics CSVs (impressions, downloads, crashes, ratings if available).
- Hand files to ops / PC import path; do not invent metrics.
**Acceptance:** At least one successful CSV landed for import OR documented “console unavailable” note with date.
**Do not:** Scrape consoles with unofficial automation that violates ToS.

## MAC handoff contract (what PC must leave)
- Web events + UI for camera-deny / gallery fallback that call documented JS bridges.
- `?store=ios|android` detection remains source of truth for hiding Stripe.
- Upgrade deep links to `https://splashlens.com` or `https://app.splashlens.com` **without** `store=` (or with explicit web upgrade flag) so Safari/Chrome can show Stripe.
- No requirement for Mac to touch `poolens-site` or Cloudflare functions beyond verifying URLs.
