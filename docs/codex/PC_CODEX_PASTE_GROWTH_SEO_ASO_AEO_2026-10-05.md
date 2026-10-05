# PC Codex PASTE — SplashLens Growth: SEO · ASO · AEO · Reactive GTM · Library Factory
**Date:** 2026-10-05 (America/Chicago) · **Author:** Joshua Frost · **Branch base:** `docs/codex-full-boat-2026-10-05`  
**Repos:** `frost831/poolens` (app, `aso/`, `store-assets/`, `llms.txt`) + `frost831/poolens-site` (splashlens.com: blog, `/es/`, `/error-codes/`, `llms.txt`, sitemaps)  
**Amplitude:** SplashLens Production · projectId `863388` · **Companion docs:** `PC_CODEX_FULL_BOAT_2026-10-05.md` (PC-01…PC-59), `PRICING_AND_PARTNER_FRAME_2026-10-05.md`, `STRATEGY_WARM_MIDWEST_GROWTH_2026-10-05.md`, `../research/splashlens-competitive-brief-2026-10-05.md`

---

## ▶ PASTE INSTRUCTIONS — READ FIRST

1. **Paste this entire file into PC Codex. Implement ALL of it.** This file is self-contained; the companion docs add detail but aren't required to start.
2. **Waves are build ORDER, not cuts.** Wave G0 ships first because closing season is live *now*. Every wave and every PC-G ticket is in scope. Don't drop later items.
3. **PC owns:** web app (`poolens`), marketing site (`poolens-site`), Stripe (web only), Amplitude events, D1/Workers, schema/JSON-LD, `llms.txt`, and **drafting** store copy/screenshot scripts into `poolens/aso/` + `poolens/store-assets/`.
4. **Mac owns native only:** iOS/Android builds, App Store Connect / Play Console uploads, native camera strings, screenshot capture on devices. PC does **not** edit `ios/`, `SplashLens.xcodeproj`, `android-twa/` native code, or `project.yml`.
5. **Web Stripe only. No IAP.** No StoreKit / Play Billing. Native wrappers (`?store=ios|android`) hide Stripe; they show an honest "Pro is managed on the web" bridge (PC-06).
6. **Not a CRM.** Never routes, invoices, autopay, GPS payroll, customer billing, or customer directories.
7. **Pool Brain = the innovative CRM; SplashLens = the proof layer beside it.** Paste / export / webhook only. Never claim a formal partnership unless one exists.
8. **Pricing (authoritative):** Free core stays fat · Solo Pro **$19/mo · $149/yr** · Teams **owner-paid $49–79/mo, techs free** (was $149; **kill $99**) · impulse packs **$5–10** · Closing Pro 60-day pass (PC-42; price from config).
9. **Drafts only for outbound:** press emails, distributor outreach, Pool Brain/OEM outreach, and social posts go in `docs/gtm/drafts/`. **Joshua sends.** PC Codex never sends email/SMS/WhatsApp to real people or posts anywhere.
10. **Claims:** competitor facts only from the competitive brief. No invented stats, ratings, user counts, or testimonials. Mark guesses **[HYPOTHESIS]**.
11. **PR practice:** focused PRs labeled `PC-G-xx` (and `PC-XX` when extending Full Boat tickets). Never force-push `master`. Extend `tests/*.test.mjs` where behavior changes.

---

## ▶ STRATEGY SUMMARY (warm states + Midwest)

**Two motions, one product:**
- **Warm states (FL/TX/AZ/CA/NV/Gulf), year-round:** stale veterans, non-tech crews, and Spanish-dominant crews. They won't "adopt software." They will tap **Counter mode** (Code / Part / Chem), read a **Spanish** code answer, and **text a proof packet** to the boss. Owners (often on Pool Brain / Skimmer) pay **$49–79/mo** once packets land; techs stay free. **[HYPOTHESIS]** Fall heater/heat-pump startup is the warm-state seasonal SEO wedge while the Midwest closes.
- **Midwest/North, closing season NOW (Oct → mid-Nov):** winterize checklist + photo standards + declined-work notes = **spring-dispute insurance**. Freeze alerts. Closing checklist complete → **Closing Pro 60-day pass**. Off-season → annual **$149/yr** "winter brain." Spring → Opening damage pack.
- **Positioning line:** *Route apps run the company. OEM apps run one brand. SplashLens makes the stuck stop proveable, then ships the packet.*
- **Competitor reaction:** Pentair ↔ Pool Brain telemetry (May 2026) shows something's wrong; **SplashLens is the proof layer** that shows *what* is wrong at the pad.
- **Margin:** OEM FOMO (verified cards, warranty packs, anonymized heatmaps, authorized badge, sponsored dealer Pro), not seat ARPU.
- **Moat:** **miss → library factory.** Every failed search/scan becomes a triaged, verified, published card (in-app + SEO + AEO + Spanish + training).
- **Acquisition truth:** first value is mostly `manual_code_search`, so lead with **code answers** (SEO/AEO) and treat PartSnap as "proof ladder + packet," not magic.

---

## 1. Gap analysis vs competitors (from the competitive brief only)

### 1a. What they have that we don't
| Capability | Who has it (per brief) | Threat | Our move (ticket) |
|---|---|---|---|
| Company OS: routes, billing, autopay, portal, service emails | Skimmer, Pool Brain, Paythepoolman, Pool Founder, PoolDial, ProValet, Jobber | High (budget/mindshare) | **Don't build.** Companion pages + paste/export/webhook (PC-20, PC-G-06) |
| Distributor live inventory / ordering / exploded diagrams | Heritage Pool+, POOL360 | High at buy moment | Pre-login search-string deep links (PC-31, PC-56) |
| Instrument-grade chem (Bluetooth readings) | LaMotte Spin Touch → WaterLink → Skimmer/PB | Medium | "Confirm with calibrated kit" + import later (PC-55) |
| OEM telemetry into CRM | Pentair ↔ Pool Brain | Medium (narrative) | "Proof layer" content + packets (PC-G-15) |
| Owner admin AI (phones, scheduling) | Pool Founder George, Skimmer AI Phone add-on, PoolDial | Low (different buyer) | Skip |
| LSI brand | Orenda (free; embedded in Skimmer) | Low | Cite, don't compete |
| Live robot BT diagnostics | DolphinTech Plus (~1.7★ per brief) | Low | Triage → deep-link (PC-33, PC-35) |
| Remote chem monitoring | WaterGuru (Balboa selected for hot-tub water safety per brief) | Low | Escalation packet template (PC-G-10 card type) |

### 1b. What we have that they don't (together)
Free no-account web pad tools · cross-OEM error encyclopedia (230+ entries per site) · cautious PartSnap proof workflow · spa-pack + multi-robot + automation reference in one place · export-first · Closing Season Mode (AQUA coverage) · Proof Passport packets.

### 1c. White space to claim now
1. **Proof-before-counter packet** (SMS/WhatsApp), PC-07/PC-48
2. **Closing/opening seasonal proof kits**, PC-23/PC-42/PC-G-01/PC-G-19
3. **Spanish-first field reference** **[HYPOTHESIS: nobody in the brief positions this; verify before saying "first"]**, PC-16/PC-G-03/PC-G-14
4. **Spa-pack panic + multi-robot triage**, PC-33/PC-34/PC-G-07
5. **Miss → library factory**, PC-G-10 (+ PC-22/29/45/46/49/52)
6. **Crew starter link** (zero-login crews), PC-G-16
7. **Answer-engine-ready code pages**, PC-G-04/PC-G-05

---

## 2. Product wedges to ship (map to existing PC-XX + new PC-G-xx)

### 2a. Existing Full Boat tickets this growth plan depends on (pull forward if not merged)
| Wedge | Ticket(s) | Why it matters for growth |
|---|---|---|
| Analytics dictionary + pay funnel | PC-01, PC-03 | Campaign triggers and attribution need these |
| Camera deny → gallery + tips | PC-02 | Fixes PartSnap drop-off; feeds camera-deny campaign |
| First-value Pro offer / soft gate | PC-04, PC-05 | Monetization triggers |
| Native → web bridge | PC-06 | Store honesty ("Pro is managed on the web") |
| SMS packet + Passport | PC-07, PC-17, PC-40 | Viral loop; screenshot hero |
| Site pricing retarget | PC-08 | $19/$149 · Teams $49–79 techs free · kill $99 |
| Counter mode | PC-12 | Non-tech crews; ASO screenshot #1 |
| Spanish toggle | PC-16 | Spanish crews; ASO es-MX |
| Teams upsell + miss report | PC-18, PC-19, PC-39 | Owner pays; techs free |
| CRM paste templates | PC-20 | Pool Brain companion proof |
| Season packs | PC-23 | Closing now; Opening spring |
| Verified cards + trust tiers | PC-29, PC-46 | Library factory output; OEM FOMO |
| Distributor deep links | PC-31 | Counter / lunch kit |
| Robot + spa lanes | PC-33, PC-34, PC-35 | SEO clusters + OEM pilot |
| Heatmaps | PC-36 | OEM FOMO from miss data |
| Credit packs | PC-38 | $5–10 impulse |
| Closing Pro 60-day pass | PC-42 | Closing trigger |
| WhatsApp share | PC-48 | Spanish crews |
| Mystery part bounty | PC-49 | Community verification step |
| Offline hero | PC-59 | ASO + SEO claim |

### 2b. NEW tickets (PC-G-01 … PC-G-20)
| ID | Title | Repo | Wave | Depends |
|---|---|---|---|---|
| PC-G-01 | Closing Season campaign hub + Midwest regional/city cluster | site | G0 | PC-23 |
| PC-G-02 | Freeze alerts (opt-in ZIP, NWS public API) | app | G0 | PC-01 |
| PC-G-03 | Spanish pool-tech page set (`/es/`) expansion | site+app | G1 | PC-16 |
| PC-G-04 | Error-code brand page template: answer box + FAQPage/HowTo JSON-LD | site | G0 | — |
| PC-G-05 | `llms.txt` / `llms-full.txt` / `ai.txt` refresh (both repos) | both | G0 | — |
| PC-G-06 | "Not Skimmer" + Pool Brain companion pages | site | G1 | PC-20 |
| PC-G-07 | Spa-pack + robot SEO landings | site | G1 | PC-33, PC-34 |
| PC-G-08 | ASO metadata drafts (iOS en-US + es-MX; Play en-US + es-419) | app `aso/` | G0 | — |
| PC-G-09 | Screenshot scripts + HTML frame templates | app `store-assets/` | G0 | PC-12, PC-16 |
| PC-G-10 | Miss → library factory (`library_miss` → triage → verified card → publish) | app+site | G0 capture / G2 full | PC-01, PC-29, PC-46 |
| PC-G-11 | Amplitude-triggered in-app campaign engine | app | G0 | PC-01, PC-02, PC-05 |
| PC-G-12 | Distributor lunch kit (EN/ES print + script) | site | G1 | PC-28, PC-31 |
| PC-G-13 | Press / AQUA / PoolPro follow-up kit (drafts) | docs | G0 | — |
| PC-G-14 | Spanish WhatsApp/SMS packet templates | app | G1 | PC-07, PC-48, PC-16 |
| PC-G-15 | Competitor-reaction content: "the proof layer" | site | G1 | — |
| PC-G-16 | Crew starter link (owner → crew, zero-login) | app+site | G1 | PC-12, PC-16, PC-07 |
| PC-G-17 | Off-season retention: annual "winter brain" + Opening presell list | app+site | G2 | PC-42 |
| PC-G-18 | Internal-link mesh + sitemap + hreflang | site | G0 | — |
| PC-G-19 | Closing checklist complete → Closing Pro pass trigger | app | G0 | PC-23, PC-42, PC-G-11 |
| PC-G-20 | Store-review ask hook + AI-referral attribution | app | G1 | PC-01 |

### 2c. Waves (ALL required, order only)
| Wave | When | Tickets |
|---|---|---|
| **G0 — Closing now** | This week → Oct 31 | PC-G-01, 02, 04, 05, 08, 09, 10 (capture), 11, 13, 18, 19 + pull-forward PC-01/02/05/06/08/23/42 |
| **G1 — Warm/Spanish + companion** | Nov | PC-G-03, 06, 07, 12, 14, 15, 16, 20 + PC-12/16/20/48 |
| **G2 — Factory + off-season** | Dec → Feb | PC-G-10 (full pipeline), PC-G-17 + PC-29/36/46/49 |

---

## 3. Ticket detail (PC-G)

### PC-G-01: Closing Season campaign hub + Midwest cluster
**Touch:** `poolens-site/closing-season.html`, new `poolens-site/closing/` dir, existing blogs (`pool-closing-winterizing-guide.html`, `pool-closing-mistakes.html`, `pool-pump-winterization.html`, `salt-water-pool-winter.html`, `above-ground-pool-winterizing.html`, `pool-freeze-protection.html`).  
**Do:**
- Make `closing-season.html` the hub: hero "Close it once. Prove it in April." Checklist preview, "Run Closing Mode free" CTA → `app.splashlens.com/?mode=closing&utm_source=site&utm_campaign=closing_2026`, Closing Pro pass CTA, declined-work note sample, Proof Passport sample.
- Pages: `/closing/midwest-pool-closing-checklist.html` (regional pillar), `/closing/winterize-variable-speed-pump.html`, `/closing/winterize-salt-cell.html`, `/closing/winterize-pool-heater.html`, `/closing/blow-out-pool-lines.html`, `/closing/declined-work-closing-note.html`, `/closing/late-pool-closing-freeze.html`.
- City pages **only with unique local content** (cited first-freeze normals source, local timing notes): Chicago, Minneapolis, Detroit, Indianapolis, Columbus, Milwaukee, St. Louis, Kansas City, Omaha, Des Moines, Cleveland. If unique data can't be cited for a city, **don't create that page**; link the regional pillar instead (avoid doorway pages).
- Each page has an answer box, checklist, FAQPage JSON-LD, CTA to Closing Mode, and an internal link back to the hub.
**Acceptance:** Hub + ≥6 topic pages live; sitemap updated; every page links hub ↔ app; no invented climate data (cite NOAA/NWS or omit).

### PC-G-02: Freeze alerts (opt-in)
**Touch:** new `functions/api/freeze-alerts.js`, client banner in `js/app.js`, migration `migrations/2026-10-xx-freeze-alert-optins.sql`.  
**Do:**
- Opt-in: user enters ZIP (store **ZIP3 or ZIP5 only**, no address). Server maps ZIP → lat/lon centroid (static table or public dataset) → `https://api.weather.gov/alerts/active?point=lat,lon` (public, no key; set a descriptive `User-Agent` with contact per NWS policy).
- Match events `Freeze Warning`, `Hard Freeze Warning`, `Freeze Watch`. Cache per ZIP3 for 1h.
- v1 delivery: **in-app banner** on next open + optional Web Push if already supported. Email only if the user typed an email *and* checked consent. **No SMS.**
- Banner links: Late-closer checklist, freeze-protection-mode reference, Closing Mode.
**Events:** `freeze_alert_optin`, `freeze_alert_shown`, `freeze_alert_clicked`.  
**Acceptance:** Test fixture with mocked NWS payload shows banner; opt-out works; no PII beyond ZIP + optional consented email.

### PC-G-03: Spanish pool-tech pages
**Touch:** `poolens-site/es/` (currently `index`, `faq`, `partsnap`, `service-proof-passport`, `facility-assist`), app `lang=es`.  
**Do:** Add `/es/codigos-de-error/` hub + top brand pages (Hayward, Pentair, Jandy, AquaCal, Raypak, Balboa/Gecko spa, robots), `/es/cierre-de-piscina.html` (invernar checklist), `/es/app-tecnico-de-piscinas.html`, `/es/identificar-piezas-de-piscina.html`, `/es/calculadora-quimicos-piscina.html`, `/es/equipos-crew.html` (crew link, PC-G-16), `/es/no-somos-crm.html` (Pool Brain/Skimmer companion).
- `hreflang` pairs EN↔ES on every translated page; `<html lang="es">`.
- **Native-speaker review gate:** ship as `noindex` until `reviewed_by` is set in page front-matter/comment; then flip to index.
**Keywords (seed):** códigos de error Hayward / Pentair / Jandy, error calentador piscina, invernar piscina, cerrar piscina invierno, técnico de piscinas app, identificar piezas de piscina, calculadora de cloro piscina, error jacuzzi Balboa.  
**Acceptance:** ≥10 ES pages; hreflang validates; noindex gate enforced in a test.

### PC-G-04: Error-code brand page template (SEO + AEO)
**Touch:** `poolens-site/error-codes/**`, `brands/`, `blog/*-error*.html`, generator in `poolens-site/tools/` if present.  
**Do:**
- Page anatomy (top to bottom): H1 `"{Brand} {Model family} error {CODE}: what it means and what to check"`; **40–60 word answer box** (meaning, top 3 checks, when to stop and call); numbered check steps; **"Proof to capture before ordering parts"** list; "Not a diagnosis" caution; related codes; CTA "Open this code offline in SplashLens"; last-reviewed date + source link to the manufacturer manual.
- JSON-LD: `FAQPage` (3–5 Q/A that mirror visible text), `HowTo` for check steps, `BreadcrumbList`, `Organization`. Visible text must match schema 1:1.
- Generate from the code corpus (`js/errors.js` / data corpus) so app + site stay in sync; one page per brand×code family where content is substantive. No empty shells.
**Acceptance:** Template applied to ≥50 existing code pages; Rich Results Test / schema validator passes (warnings OK); answer box present; test asserts schema text ⊆ visible text.  
**Note:** Google limits FAQ rich results and dropped HowTo rich results (2023). Schema is for **machine readability / answer engines**, not guaranteed SERP features. Don't promise rich snippets.

### PC-G-05: llms.txt / llms-full.txt / ai.txt refresh
**Touch:** `poolens/llms.txt` (40 lines), `poolens-site/llms.txt` (246 lines), `poolens-site/ai.txt`.  
**Do:**
- Update pricing to **Pro $19/mo · $149/yr; Teams $49–79/mo owner-paid, techs free**. Remove any $99/$29/$249/$4.99 references.
- Add sections: **Closing Season** (hub + pages), **Spanish / Español**, **Error codes by brand** (hub links), **Spa & robots**, **Works beside your CRM (Pool Brain, Skimmer, Jobber, Paythepoolman)**, **What SplashLens is not** (not CRM/billing/routes; not a fitment guarantee), **Canonical short answers** (5–10 one-line Q→A that LLMs can quote).
- Add `llms-full.txt` (site) with concatenated canonical answers for top 50 codes + closing checklist (plain text, dated).
- Keep the existing field-notes disclaimer.
**Acceptance:** Grep finds no stale prices; both files link the hubs; `llms-full.txt` < 500KB.

### PC-G-06: "Not Skimmer" + Pool Brain companion pages
**Touch:** `poolens-site/crm-companion.html`, `connected-pool-brain.html`, `blog/pool-service-software-skimmer.html`; new `/works-with/pool-brain.html`, `/works-with/skimmer.html`, `/works-with/jobber.html`, `/works-with/paythepoolman.html`.  
**Do:** Each page says "Keep your CRM. SplashLens is the pad-proof layer beside it," then shows the paste block example (PC-20), what SplashLens doesn't do (routes/billing), and the packet → CRM notes flow. Pool Brain copy: "Pool Brain is the innovative CRM." Comparison tables use **only** brief-sourced facts with a source line and "as of Oct 2026."  
**Never:** "Skimmer alternative" framing that implies replacement; partnership/integration-certified claims.  
**Acceptance:** 4 pages live + linked from home and `crm-companion.html`; claims-parity check passes (`aso/claim-parity-check.md` style).

### PC-G-07: Spa-pack + robot SEO landings
**Touch:** `spa-hot-tub-troubleshooting-app.html`, `pool-robot-troubleshooting-app.html`, `error-codes/hot-tubs-spas`, `error-codes/robot-cleaners-smart-robots`, blogs (Dolphin, Aiper, Beatbot).  
**Do:** "Spa Panic Mode for pool techs" landing (Balboa/Gecko/Waterway codes, GFCI timing, flow/heater proof); "Robot triage hub" landing (Dolphin/Polaris/Aiper/Beatbot/WYBOT: wear vs. call OEM app vs. SKU hint; honest "not live Bluetooth diagnostics"). PC-G-04 template + JSON-LD. Each has a verified-card slot ("Is this your brand?") for OEM FOMO.  
**Acceptance:** Both landings live, linked from hubs and app Connected Network.

### PC-G-08: ASO metadata drafts (PC drafts → Mac ships)
**Touch:** `poolens/aso/app-store-metadata.md`, `poolens/aso/google-play-metadata.md`, new `poolens/aso/2026-10-growth-listing-drafts.md`, `aso/claim-parity-check.md`.  
**Do:** Write the drafts in §5 below into the new file; update the parity check. Character counts validated by script (`tools/aso-length-check.mjs`).  
**Acceptance:** All fields within limits; no prices, no IAP wording, no competitor app names; Mac handoff note at top.

### PC-G-09: Screenshot scripts + frame templates
**Touch:** `poolens/store-assets/` (new `store-assets/screenshot-scripts-2026-10/`), `aso/screenshot-frame-plan.md`.  
**Do:** Per §5c: scene list, exact app state/URL to reproduce (e.g. `?mode=counter&lang=es&demo=1`), caption text EN + ES, HTML/CSS frame templates (1320×2868 iOS 6.9", 1080×1920 Play) that Mac can render after capture. Add a `demo=1` seed so screenshots never show real customer data.  
**Acceptance:** 8 scenes scripted EN + ES; demo seed works; no PII.

### PC-G-10: Miss → library factory
**Touch:** `js/app.js` (search + PartSnap result paths), `functions/api/events.js`, new `functions/api/library-misses.js`, migration `migrations/2026-10-xx-library-misses.sql`, owner/ops dashboard view, `docs/ops/LIBRARY_MISS_TRIAGE.md`.  
**Do:**
1. **Capture** `library_miss` on: zero-result code search; PartSnap `match_tier` none/low; "didn't help" tap on a card. Props: `method`, `query_norm` (lowercased, trimmed, max 80 chars, digits kept), `brand_guess`, `equipment_family`, `locale`, `region_bucket` (state or ZIP3), `store_mode`. **No photos** unless the user ticks "Share this photo to improve the library" (separate consented upload).
2. **Store** in D1 `library_misses` (fingerprint = hash(query_norm + brand_guess + family)), with count, first_seen, last_seen, status `new|triaged|drafted|verified|published|wontfix`.
3. **Triage view** (ops, auth-gated): weekly top-25 by count × recency × risk family (heater/spa GFCI/flow/gas weighted).
4. **Draft** card from public manual/source with URL → status `drafted`, tier **Unverified draft** (PC-46).
5. **Verify** via community confirm (PC-49) or partner (PC-29). Server-side flag only.
6. **Publish fan-out:** in-app card + site page via PC-G-04 template + `llms-full.txt` entry + ES translation queue (PC-G-03) + training card (PC-22/45).
7. **Close the loop:** opted-in users get "We added the answer you were missing" (in-app on next open; email only if consented). Event `library_miss_resolved`.
8. Feed aggregate counts to heatmaps (PC-36), anonymized.
**Acceptance:** Miss is captured end-to-end in a test; triage view lists fingerprints; status transitions are audited; publish creates a card with a source link; no PII stored.

### PC-G-11: Amplitude-triggered in-app campaign engine
**Touch:** new `js/campaigns.js`, `js/app.js`, `js/analytics.js`; config `js/campaigns.config.js`.  
**Do:** Deterministic client rules (mirrored by Amplitude cohorts for measurement), once-per-user caps, dismiss memory in localStorage, `store_mode` aware (no Stripe in wrappers → web bridge instead).
| Campaign ID | Trigger | Message | CTA |
|---|---|---|---|
| `camera_deny_tip` | `partsnap_camera_denied` | "No camera? Use a photo from your gallery, or type the model. Tip: flashlight on the nameplate." | Gallery picker / manual search |
| `first_value_pro` | first `first_value_completed` (any method) | "Pro: unlimited scans + saved passports. $19/mo or $149/yr. Less than one wrong part." | Web checkout / store bridge |
| `closing_pro_pass` | `closing_checklist_completed` | "Closing a lot of pools? Closing Pro: 60 days of unlimited scans + passports." | Closing Pro checkout (PC-42) |
| `third_scan_gate` | 3rd free scan (PC-04) | Soft gate | Checkout / continue manual |
| `packet_to_owner` | 2nd `passport_shared` | "Want these in your boss's inbox? Teams: owner pays $49–79, techs free." | Teams info / send owner link |
| `es_suggest` | `navigator.language` starts with `es` and locale unset | "¿Prefieres español?" | Set `lang=es` |
| `freeze_optin` | Closing Mode opened Oct–Nov, not opted in | "Get freeze warnings for your ZIP" | PC-G-02 opt-in |
| `miss_followup` | `library_miss` with opt-in | "Want a heads-up when we add this?" | Consent toggle |
- Amplitude: create cohorts + a "Growth Campaigns" dashboard via the Amplitude tools (chart per campaign: shown → clicked → checkout_click → checkout_success). If the MCP is unavailable, document chart specs in `docs/ops/AMPLITUDE_GROWTH_CAMPAIGNS.md`.
**Events:** `campaign_message_shown`, `campaign_message_clicked`, `campaign_message_dismissed` with `campaign_id`.  
**Acceptance:** Each trigger is unit-tested; caps hold; store mode never renders Stripe.

### PC-G-12: Distributor lunch kit
**Touch:** `poolens-site/partners.html`, new `/partners/lunch-kit.html` + printable PDFs/HTML-print pages EN + ES.  
**Do:** 20-minute agenda; PartSnap speed-trial script ("snap → missing proof → packet to counter"); tent card "Snap before you order" with QR → `app.splashlens.com/?utm_source=distributor&utm_campaign=lunchkit&branch={code}`; closing-season counter card; sign-up sheet that collects **only** consented contact info; sponsored-Pro redemption explainer (PC-41).  
**Acceptance:** Kit page live; print CSS clean; QR UTM per branch; no fabricated attendance or results.

### PC-G-13: Press / AQUA / PoolPro follow-up kit (DRAFTS ONLY)
**Touch:** new `docs/gtm/drafts/press-2026-10/`.  
**Do:** Drafts for: AQUA follow-up (Closing Season Mode → "closing proof" how-to); PoolPro follow-up (launch → "first fall: what techs miss at closing," using real pilot data from `docs/ops/SPLASHLENS_10_TECH_CLOSING_PILOT.md` or none); "proof layer" op-ed angle (PC-G-15); pricing-change note (cheap Pro / techs-free Teams). Each has subject, 120–180 word body, 3 bullet facts with sources, image list.  
**Never send.** Joshua reviews and sends.  
**Acceptance:** 4 drafts committed; every fact sourced.

### PC-G-14: Spanish WhatsApp/SMS packet templates
**Touch:** Passport share UI, `js/i18n/es.json` (or existing i18n pattern).  
**Do:** ES packet summary: `"SplashLens · {marca} {modelo} · Código {código} · Falta prueba: {faltantes} · Ver: {link}"` + optional English line for the owner (toggle "Agregar resumen en inglés para el jefe"). `wa.me/?text=` and `sms:` deep links. Native-speaker review gate on strings.  
**Events:** `passport_shared` with `channel=whatsapp|sms`, `locale=es`, `bilingual=true|false`.  
**Acceptance:** ES share produces a readable message ≤ 300 chars plus link.

### PC-G-15: Competitor-reaction content ("the proof layer")
**Touch:** new `poolens-site/blog/proof-layer-connected-pools.html`, update `connected-pool-brain.html`, `new-tech-radar.html`.  
**Do:** "Telemetry tells you something's wrong. Proof shows what." Explain Pentair ↔ Pool Brain (cite brief sources) as validation that the pad needs data, then show how a SplashLens packet complements telemetry alerts (and WaterGuru-style alerts). Respectful tone, no disparagement, no metrics beyond the brief.  
**Acceptance:** Page live, sourced, linked from companion pages.

### PC-G-16: Crew starter link
**Touch:** app route `app.splashlens.com/crew/{token}` or `?crew={token}`, new `functions/api/crew-links.js`, site `/crew.html` + `/es/equipos-crew.html`.  
**Do:** An owner (no account required; optional email for Teams later) creates a link with company display name, default language, boss SMS/WhatsApp number (stored server-side, hashed token), and default Counter mode. The tech opens it, the app sets preferences locally, and packets prefill the boss number. Revocable. The owner landing explains "Text this to your crew. No logins." with a Teams upsell for the inbox.  
**Events:** `crew_link_created`, `crew_link_opened`, `crew_link_packet_sent`.  
**Acceptance:** Create → open on second device → Counter mode + ES + boss prefilled; revoke disables; no customer PII.

### PC-G-17: Off-season retention
**Do:** Dec–Feb "winter brain" annual offer surface ($149/yr) on site + in-app for Midwest region_bucket; "Remind me at opening" opt-in captured at closing (email consent) → Opening pack launch list; winter training cards built from the season's top misses (PC-G-10 → PC-22).  
**Events:** `opening_reminder_optin`, `annual_offer_shown`.  
**Acceptance:** Region-aware offer toggled by date config; opt-in list exportable for Joshua (no auto-send in v1).

### PC-G-18: Internal-link mesh + sitemaps + hreflang
**Touch:** `poolens-site` nav (`splashlens-nav.js`), footers, `sitemap*.xml`, `seo-hub-sitemap.xml`, `robots.txt`; `poolens/landing.html` + app "Learn more" links.  
**Do:**
- Hubs: Error codes · Closing season · Español · Spa & robots · Works with your CRM · PartSnap · Proof Passport.
- Every leaf links up to its hub + 3 siblings + one app deep link with UTM (`utm_source=site&utm_medium=internal&utm_campaign={hub}`).
- Home (`splashlens.com`) above-the-fold links: Closing (seasonal), Error codes, Español, Works with Pool Brain/Skimmer.
- App (`app.splashlens.com`) code results link the matching site page ("Full guide").
- Add new pages to sitemaps; hreflang EN↔ES; canonical tags.
**Acceptance:** Link-check script (no orphans among new pages); sitemaps validate.

### PC-G-19: Closing checklist complete → Closing Pro pass
**Do:** Fire `closing_checklist_completed` (props: `items_done`, `photos_count`, `declined_work_noted`). On the 1st completion, show the `closing_pro_pass` campaign (PC-G-11). On the 3rd completion in 14 days, show the "Closing a route? Teams for your crew" owner prompt. Store mode → web bridge.  
**Acceptance:** Trigger fires once per cap; checkout plan `closing_pro_60d`; tests cover the store-mode path.

### PC-G-20: Store-review ask hook + AI-referral attribution
**Do:**
- **Review hook:** after the 3rd positive value event in store mode, call `window.SplashLensNative?.requestReview?.()` if present (Mac wires the native API; PC never fakes a review UI). Event `store_review_prompt_requested`.
- **AI referral:** on session start, classify `document.referrer` / `utm_source` for `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai` → `ai_source` prop on `session_start` + event `ai_referral_session`. Same in site GA4/Amplitude if present.
**Acceptance:** Unit test for referrer classifier; native hook no-ops on web.

---

## 4. SEO (site + blog/landing)

### 4a. Keyword clusters → pages
| Cluster | Seed keywords | Pages (new/upgrade) | Ticket |
|---|---|---|---|
| Midwest closing | pool closing checklist; how to winterize a pool; when to close pool [Midwest/city]; blow out pool lines; winterize variable speed pump; winterize salt cell; winterize pool heater; late pool closing freeze; pool closing declined work | `closing-season.html` hub, `/closing/*`, existing closing blogs | PC-G-01 |
| Freeze | pool freeze warning; pool freeze protection mode; what temperature to winterize pool | `blog/pool-freeze-protection.html` upgrade + late-closer page | PC-G-01/02 |
| Spanish | códigos de error Hayward/Pentair/Jandy; invernar piscina; cerrar piscina; app técnico de piscinas; identificar piezas de piscina; calculadora de cloro | `/es/**` | PC-G-03 |
| Error codes (brand) | {brand} {model} error {code}; {brand} heater error; omnilogic error; intellicenter error; jxi error; aquacal flo | `/error-codes/**`, `blog/*-error*` | PC-G-04 |
| Warm-state heater [H] | pool heater not igniting; heat pump error codes; mastertemp e05; raypak error | heater code pages + seasonal callout | PC-G-04 |
| Spa pack | balboa error codes; gecko error codes; hot tub FLO error; spa GFCI tripping | spa landing + codes | PC-G-07 |
| Robot | dolphin robot red light; aiper error; beatbot error; polaris robot not climbing | robot hub + existing blogs | PC-G-07 |
| CRM companion | skimmer alternative?; pool brain app; pool service app that works with skimmer; pool tech field app | `/works-with/*`, `crm-companion.html` | PC-G-06 |
| PartSnap | identify pool part from photo; what pool part is this | `partsnap-*.html` upgrade | PC-G-04/18 |

**Rules:** One intent per page; title ≤ 60 chars; meta description ≤ 155 chars; H1 = query phrasing; answer in the first 60 words; last-reviewed date; source link; CTA to the app deep link with UTM. No keyword stuffing. No doorway city pages without unique cited content. Spanish pages stay `noindex` until native review.

### 4b. Internal links from splashlens.com / poolens-site
Covered in PC-G-18. Also: `poolens/landing.html` and the app's footer "Guides" link to the site hubs; site hubs link to `app.splashlens.com` deep links (`?mode=closing`, `?mode=counter`, `?lang=es`, `?code={brand}-{code}`).

---

## 5. ASO (PC drafts copy/scripts → Mac ships builds/listings)

### 5a. Rules
- **No prices, no "in-app purchase" wording, no "subscribe in app."** The app has no IAP.
- Honest store-mode line (in description, not a CTA): *"SplashLens Pro is managed through your SplashLens account on the web. This app has no in-app purchases."* **Mac/Joshua verify** the current Apple 3.1.1/3.1.3 and Google Play payments policy for each storefront before including any link or web-purchase reference. If in doubt, use the account sentence without a URL.
- Don't put competitor **app** names (Skimmer, Pool Brain, DolphinTech) in store keywords/titles. Equipment brand keywords (Hayward/Pentair/Jandy/Balboa/Dolphin) describe documented equipment. If App Review objects, swap them for generic terms.
- iOS indexes name + subtitle + keywords; **don't repeat words across them.** US storefront also indexes the **Spanish (Mexico)** localization (widely reported ASO behavior; verify), so es-MX metadata doubles keyword coverage.

### 5b. Draft metadata (char-counted)
**iOS en-US**
- Name (≤30): `SplashLens: Pool & Spa Codes` (28)
- Subtitle (≤30): `Error codes, part ID, closing` (29)
- Keywords (≤100): `hayward,pentair,jandy,hot tub,winterize,salt cell,robot,dosing,technician,heater,pump,balboa,dolphin` (100)
- Promotional text (≤170): `Closing season: run the winterize checklist, photo each step, and text a proof packet before you leave. Works offline after first load. No account needed.` (154)
- Description lead (first 3 lines matter):
  > The field reference for pool and spa techs. Look up 230+ equipment error codes, snap a part for a possible match plus the proof you still need, run dosing math, and text a proof packet to your boss or the parts counter.
  > • Counter mode: three big buttons (Code / Part / Chem) for gloves-on use
  > • Closing Season Mode: winterize checklist, photo standards, declined-work notes
  > • Español: códigos, piezas y paquetes de prueba en español
  > • Works offline after first load. No account needed for core tools.
  > • Works beside your CRM: copy proof into your notes. SplashLens doesn't do billing or routes.
  > PartSnap shows possible matches and missing proof. It's not a fitment guarantee; verify against the nameplate and manual.
  > SplashLens Pro is managed through your SplashLens account on the web. This app has no in-app purchases.

**iOS es-MX**
- Name: `SplashLens: Códigos Piscina` (27)
- Subtitle: `Errores, piezas y cierre` (24)
- Keywords: `tecnico,invernar,jacuzzi,cloro,bomba,calentador,celda sal,robot,dosis,hayward,pentair,jandy,spa` (95)
- Promo: `Temporada de cierre: checklist para invernar, fotos de cada paso y paquete de prueba por SMS o WhatsApp. Funciona sin señal tras la primera carga.` (146)

**Google Play en-US**
- Title (≤30): `SplashLens: Pool Tech Codes` (27)
- Short description (≤80): `Pool & spa error codes, part photo ID, closing checklist & proof packets. Free.` (79)
- Full description: same structure as iOS. Play indexes the full description, so naturally include "pool error codes," "winterize pool," "pool closing checklist," "hot tub error codes," "pool part identification" (no stuffing; ≤ 2 mentions each).

**Google Play es-419**
- Title: `SplashLens: Códigos Piscina`
- Short (≤80): `Códigos de error, ID de piezas por foto y checklist de cierre para piscinas.` (76)

### 5c. Screenshot scripts (8 scenes; EN + ES captions)
Use `demo=1` seed data (PC-G-09). Order = story.
| # | Scene / app state | EN caption | ES caption |
|---|---|---|---|
| 1 | Counter mode home `?mode=counter&demo=1` | Three buttons. Gloves on. | Tres botones. Con guantes. |
| 2 | Error code result (e.g. heater code) with "proof to capture" list | 230+ error codes. Offline. | Más de 230 códigos. Sin señal. |
| 3 | PartSnap result: possible match + missing proof ladder | Possible match + the proof you still need | Posible coincidencia + la prueba que falta |
| 4 | SMS packet composer prefilled | Text the proof to your boss or the counter | Manda la prueba al jefe o al mostrador |
| 5 | Closing checklist with photo ticks + declined-work note | Close it once. Prove it in April. | Ciérrala una vez. Pruébalo en abril. |
| 6 | Spanish UI toggle (`lang=es`) on code search | Español en el pad | Español en el pad |
| 7 | Airplane-mode badge with dose calc working | Works without signal | Funciona sin señal |
| 8 | Spa or robot triage card | Spa packs & robots, too | Spas y robots también |
**Never show** prices, Stripe, "Subscribe," real customer names/addresses, or competitor logos.

---

## 6. AEO (answer-engine optimization)

**Goal:** ChatGPT / Perplexity / Gemini / Google AI Overviews quote SplashLens for pool error codes, closing checklists, and pool-tech-app questions, and cite the URL.

1. **Answer-first blocks** (PC-G-04): 40–60 word definitive answer at the top of every code/closing page, then steps. Plain sentences, units, brand/model names spelled out.
2. **JSON-LD:** `FAQPage` (Q/A identical to visible text), `HowTo` for checklists (closing, winterize VS pump, salt cell, heater), `BreadcrumbList`, `Organization` + `SoftwareApplication` on product pages (`offers` price `0` for free core; **don't** add Pro price to store-adjacent schema until Stripe migration is live, then $19/$149).
3. **Canonical Q→A set** (put on pages + `llms.txt` + `llms-full.txt`):
   - "What does {brand} error {code} mean?" → one-sentence meaning + top checks + "verify with manual."
   - "Midwest pool winterizing checklist" → numbered 10–12 steps (lower water per cover/skimmer type, blow out + plug lines, drain pump/filter/heater/chlorinator, salt cell out/stored, VS pump drained/freeze settings, chemistry to close, cover, photos + declined-work note).
   - "When should I close my pool in [Midwest]?" → general guidance ("before sustained nights near freezing; watch NWS freeze warnings") + link to city/regional page with cited normals. No invented dates.
   - "What app do pool techs use for error codes?" → factual description of SplashLens (free core, offline, works beside CRMs) without disparaging others.
   - "Does SplashLens replace Skimmer or Pool Brain?" → "No. It works beside them; paste proof into your CRM notes."
   - Spanish equivalents of the above.
4. **Freshness signals:** visible "Last reviewed {date}" + `dateModified` in schema; update closing pages every October.
5. **Citable facts only:** link manufacturer manuals; no unverifiable stats.
6. **llms.txt** (PC-G-05) lists the hubs + canonical answers; `ai.txt` stays consistent.
7. **Measure:** `ai_referral_session` (PC-G-20); monthly manual spot-check of 20 prompts in ChatGPT/Perplexity logged in `docs/ops/AEO_SPOTCHECK.md` (cited? which URL?).

---

## 7. Reactive GTM (run now)

| Play | When | What PC builds | Who sends |
|---|---|---|---|
| **Closing season campaign** | Now → Nov 15 | PC-G-01 hub/pages, PC-G-19 trigger, PC-42 pass, UTM'd links, social/forum post drafts in `docs/gtm/drafts/closing-2026/` (Reddit r/pools-style tech-helpful posts, Facebook group posts; disclosure line included) | Joshua posts |
| **Freeze alerts** | First Midwest freeze warnings | PC-G-02 + "late closer" checklist page + banner | Automated in-app (opt-in only) |
| **Press / AQUA / PoolPro follow-ups** | This week | PC-G-13 drafts | Joshua |
| **Distributor lunch kit** | Oct–Nov branch visits | PC-G-12 kit + branch UTM QR | Joshua / reps |
| **Spanish WhatsApp/SMS** | G1 | PC-G-14 templates + `/es/equipos-crew.html` + forwardable message for owners to send *their own* crews | Owners forward (user-initiated); no bulk sends from SplashLens |
| **Amplitude-triggered campaigns** | G0 | PC-G-11: camera deny → tip; first_value → Pro; closing checklist complete → Closing Pro pass; 3rd scan gate; 2nd share → Teams; es suggest; freeze opt-in; miss follow-up | In-app (automated) |
| **Competitor reaction** | G1 + whenever CRM/OEM news drops | PC-G-15 "proof layer" page; a 48-hour reaction template in `docs/gtm/drafts/reaction-template.md` (headline, 3 bullets, CTA, sources) | Joshua |
| **Pool Brain companion outreach** | G1 | Draft intro note in `docs/gtm/drafts/pool-brain-intro.md` ("we send proof into your notes; happy to build a paste/webhook format you prefer") | Joshua |
| **OEM FOMO pilot** | G2 | One spa **or** robot verified-card one-pager + empty "Partner-verified" slots | Joshua |

---

## 8. PartSnap library growth (summary of PC-G-10 cadence)

- **Weekly:** export top-25 `library_miss` fingerprints → draft cards → verify → publish (target miss→published median **≤7 days**).
- **Monthly:** "Top missed codes" anonymized internal report → OEM pitch material (PC-36). No PII, no site addresses.
- **Seasonal:** the closing season's misses become winter training cards (PC-G-17) and opening-season prep pages.
- **Every published card** gets an in-app card, a site page (if public code), an `llms-full.txt` line, an ES translation queue entry, and a training card link.

---

## 9. Analytics events to ADD (Amplitude 863388, via `trackSplashLensEvent` → `/api/events`)

Always include when known: `store_mode`, `locale`, `region_bucket` (state/ZIP3), `utm_source`, `utm_campaign`, `ai_source`.

| Event | When | Key props |
|---|---|---|
| `library_miss` | Zero-result search / PartSnap none-low / "didn't help" | `method`, `query_norm`, `brand_guess`, `equipment_family` |
| `library_miss_photo_shared` | Consented photo upload for library | `equipment_family` |
| `library_miss_triaged` | Ops status change | `fingerprint`, `status` |
| `library_card_published` | Card published | `card_id`, `tier`, `source_miss_count` |
| `library_miss_resolved` | User notified of new answer | `card_id` |
| `campaign_message_shown` / `_clicked` / `_dismissed` | PC-G-11 | `campaign_id` |
| `closing_checklist_completed` | Closing pack done | `items_done`, `photos_count`, `declined_work_noted` |
| `closing_pro_offer_shown` | Pass offer | `completion_count` |
| `freeze_alert_optin` / `freeze_alert_shown` / `freeze_alert_clicked` | PC-G-02 | `zip3`, `event_type` |
| `crew_link_created` / `crew_link_opened` / `crew_link_packet_sent` | PC-G-16 | `locale`, `counter_mode` |
| `locale_suggested` | ES suggestion shown | `browser_locale` |
| `web_upgrade_bridge_click` | Store-mode "manage Pro on web" | `placement` |
| `store_review_prompt_requested` | PC-G-20 | `value_count` |
| `ai_referral_session` | AI referrer detected | `ai_source` |
| `seo_landing_view` (site) | Site page view with hub | `hub`, `slug`, `lang` |
| `app_deeplink_from_site` | Site → app click | `hub`, `slug`, `mode` |
| `partner_kit_downloaded` | Lunch kit / tent card | `kit`, `branch` |
| `opening_reminder_optin` | Spring list | `region_bucket` |
| `annual_offer_shown` | Winter brain | `region_bucket` |
| `passport_shared` (extend) | Share | add `bilingual`, `crew_link` |

**Dashboards to build (Amplitude):** Growth Campaigns (per `campaign_id` funnel), Closing Season (checklist → pass → checkout_success), Library Factory (misses/week, published/week, median days), Spanish (ES sessions → packets), AEO (ai_referral_session by source), Crew links (created → opened → packets). Customer-intent charts use `checkout_click` + `checkout_success` only (per `e17f87c`).

---

## 10. Explicit DO-NOT list

- Don't add IAP / StoreKit / Play Billing, or render Stripe inside store wrappers.
- Don't put prices, "subscribe," or IAP wording in store listings or screenshots.
- Don't edit native projects (`ios/`, `SplashLens.xcodeproj`, `android-twa/` native, `project.yml`). That's Mac.
- Don't build routes, invoices, autopay, GPS payroll, customer billing, or customer directories.
- Don't claim a Pool Brain (or any) partnership, certification, or endorsement that doesn't exist; don't disparage competitors.
- Don't invent competitor metrics, user counts, ratings, testimonials, climate dates, or pilot results.
- Don't send email/SMS/WhatsApp or post to forums/social/press. Draft into `docs/gtm/drafts/`; Joshua sends.
- Don't cold-SMS anyone; freeze alerts and follow-ups are opt-in only (in-app first; email only with consent).
- Don't store addresses, customer names, phone numbers (except the owner's own boss number in crew links, hashed token), or photos without explicit consent.
- Don't ship doorway city pages without unique cited local content.
- Don't index machine-translated Spanish before native-speaker review.
- Don't promise rich snippets from FAQ/HowTo schema; don't put schema text that isn't visible on the page.
- Don't promise fitment or diagnosis; PartSnap = possible match + missing proof.
- Don't leave any $99 Teams, $29/$249 Pro, or $4.99 PartSnap price on site, `llms.txt`, or schema.
- Don't force-push `master`. Don't treat waves as cuts.

---

## 11. Definition of Done

**Wave G0 (closing now)**
- [ ] `closing-season.html` hub + ≥6 `/closing/*` pages live with answer boxes, FAQPage/HowTo JSON-LD, app deep links with UTM
- [ ] Freeze alerts opt-in working against NWS (mocked in tests); in-app banner; no SMS
- [ ] `closing_checklist_completed` → Closing Pro pass offer (web) / web bridge (store)
- [ ] Campaign engine live: camera_deny_tip, first_value_pro, closing_pro_pass, third_scan_gate, freeze_optin
- [ ] `library_miss` captured + stored + triage view
- [ ] Error-code template on ≥50 pages; schema validates
- [ ] `llms.txt` (both repos) + `llms-full.txt` updated; no stale prices
- [ ] ASO drafts (iOS en-US/es-MX, Play en-US/es-419) in `aso/` within char limits; 8 screenshot scripts + `demo=1` seed in `store-assets/`
- [ ] Press/AQUA/PoolPro drafts in `docs/gtm/drafts/press-2026-10/`
- [ ] Internal-link mesh + sitemaps updated

**Wave G1 (warm/Spanish + companion)**
- [ ] ≥10 `/es/` pages with hreflang; review gate enforced
- [ ] ES WhatsApp/SMS packet templates
- [ ] Crew starter link end-to-end
- [ ] `/works-with/{pool-brain,skimmer,jobber,paythepoolman}` + "proof layer" page
- [ ] Spa + robot landings
- [ ] Distributor lunch kit EN/ES with branch UTMs
- [ ] Store-review hook + AI-referral attribution

**Wave G2 (factory + off-season)**
- [ ] Miss → draft → verify → publish fan-out working (in-app + site + llms-full + ES queue + training)
- [ ] Miss→published median tracked; first weekly top-25 cycle done
- [ ] Winter annual offer + opening reminder opt-in
- [ ] Amplitude dashboards: Growth Campaigns, Closing Season, Library Factory, Spanish, AEO, Crew links

**Global**
- [ ] All new events visible in Amplitude 863388 with required props
- [ ] No IAP; no Stripe in store mode; no CRM features; no unsourced claims
- [ ] Pricing everywhere = Pro $19/mo · $149/yr; Teams $49–79/mo owner-paid, techs free; packs $5–10
- [ ] Mac handoff note lists exactly which `aso/` + `store-assets/` files to ship

---

**End of paste.** Implement every PC-G ticket plus the pulled-forward PC-XX items, in wave order, as focused PRs.
