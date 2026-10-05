# PC Codex — SplashLens FULL BOAT Implementation Brief
**Date:** 2026-10-05 (America/Chicago)  
**Product:** SplashLens · splashlens.com / app.splashlens.com  
**Repos:** `frost831/poolens` (app) + `frost831/poolens-site` (marketing)  
**Amplitude:** SplashLens Production · projectId `863388`  
**Authoritative pricing (Joshua Frost approved 2026-10-05):** Free core stays fat (codes, dosing, offline, Closing Mode). Solo Pro target **$19/mo** or **$149/yr** (web Stripe only; was ~$29/$249 — open PC ticket to migrate Stripe price IDs). Teams: **owner pays, techs free** — target **$49–79/mo** for miss reports + packet inbox (was $149 primary / kill $99; do not sell tech-seat ARPU). Impulse: **$5–10** per-packet credit packs. Margin/FOMO = OEM verified cards + anonymized heatmaps — not crew seats. See also `docs/codex/PRICING_AND_PARTNER_FRAME_2026-10-05.md`.  
**Recent context:** `e17f87c` distinguishes unattributed server Stripe sessions from tracked customer `checkout_click`. Funnel: almost no subscribers; free core strong; PartSnap camera denials; first value often `manual_code_search`; D1~0%; monetization events dark; one open unpaid Stripe session = noise.

---

## PASTE INSTRUCTIONS (read first)

**Paste this entire file into PC Codex.** Prefer one branch per Build Order Wave (`docs/codex-wave-N-…`) or one umbrella PR series labeled `PC-XX`. Do **not** touch iOS/Android native project files (`ios/`, `SplashLens.xcodeproj`, `android-twa/` native manifests beyond docs) — those are Mac Codex. Do **not** add StoreKit / Play Billing / IAP. Web Stripe is the only paid path. Prefer many focused PRs by workstream over one mega-diff. Reference competitive brief: `docs/research/splashlens-competitive-brief-2026-10-05.md`. Mac verbal/tickets: `docs/codex/MAC_CODEX_*.md`.

**Scope intent:** Implement **100% of this backlog** over sequential PRs. Waves are **build order**, not cuts. Do not drop items because they are later waves.

**Growth companion (2026-10-05):** SEO / ASO / AEO / reactive GTM / miss→library factory live in `docs/codex/PC_CODEX_PASTE_GROWTH_SEO_ASO_AEO_2026-10-05.md` (new tickets **PC-G-01…PC-G-20**, Waves G0–G2). Closing season is live, so run its Wave G0 alongside this file's Wave 0. Strategy: `docs/codex/STRATEGY_WARM_MIDWEST_GROWTH_2026-10-05.md`.

---

## 1. Mission / north star / non-negotiables

### North-star line (use on landing)
> Route apps run the company. OEM apps run one brand. SplashLens makes the stuck stop proveable — then ships the packet.

### Mission
Ship the complete field-proof OS for pool/spa techs: **fat free core** (PartSnap, error codes, dosing, checklists, offline tools, Closing/Opening Season Mode) plus Proof Passport packets, cheap Solo Pro, owner-paid Teams visibility, verified partner cards, and web monetization — **without** becoming a CRM/billing/routing product. Acquisition story: techs buy the **pad-proof OS**; owners buy miss reports + packet inbox; OEMs buy FOMO (verified cards, heatmaps, sponsored Pro).

### Non-negotiables
1. **Not a CRM — complement Pool Brain (the innovative CRM) and peers.** Call Pool Brain the innovative CRM; SplashLens is the pad-proof field OS beside it. Paste / export / webhook into Skimmer / Pool Brain / Paythepoolman / Jobber. **Never** routes, invoices, autopay, GPS payroll, or customer billing.
2. **Web Stripe only.** Native wrappers (`?store=ios|android`) intentionally hide Stripe. No IAP.
3. **Mac owns native builds.** PC leaves JS bridges + hooks; Mac does camera strings, gallery fallback, rebuild, store CSV export.
4. **Human verification brand.** PartSnap = possible match + missing proof — never fitment guarantee.
5. **Privacy for OEM bait.** Failure heatmaps anonymized; no customer PII in partner exports.
6. **Pricing retarget (authoritative):** Solo Pro **$19/mo · $149/yr**; Teams **owner-paid $49–79/mo with free tech seats** (retire primary $149 Teams and kill every `$99` Teams claim). Impulse credits **$5–10**/pack. Stripe product/price IDs may still show old $29/$249/$149 — flag **migrate Stripe prices** as a PC ticket; site + Codex copy use the new targets.
7. **Do not invent competitor metrics** beyond the competitive brief.


### Pool Brain partner framing (GTM)
- **Pool Brain** = the innovative CRM / route+billing stack. SplashLens = pad-proof OS that makes the stuck stop proveable, then ships the packet.
- Integration posture: **paste / export / webhook only** — never routes or billing.
- Acquisition narrative: crews adopt SplashLens for free-core field proof; owners upgrade for miss reports + packet inbox; OEMs/distributors buy verified cards, warranty packs, anonymized heatmaps, authorized badges, and sponsored Pro for dealers.
- Manufacturer FOMO package: verified cards · warranty photo packs · anonymized heatmaps · authorized-service badge · sponsored Pro for dealers · **one spa or robot pilot** (PC-33/PC-34), not a full CRM displace.

### Funnel reality to fix
Almost no paid subs; free lookup works; PartSnap camera denials; first value skewed to manual_code_search; monetization events under-fired; classify unattributed Stripe sessions as ops noise (per `e17f87c`), not demand.

---

## 2. Repo map and PR practice

| Repo | Role | Typical paths |
|------|------|----------------|
| `frost831/poolens` | App PWA + Cloudflare Workers/D1 | `index.html`, `js/app.js`, `js/analytics.js`, `js/*.js`, `functions/api/*`, `migrations/*`, `docs/*`, `sw.js`, `manifest.json` |
| `frost831/poolens-site` | Marketing / SEO / pricing / seasonal | `index.html`, `closing-season.html`, `crm-companion.html`, `field-learning-os.html`, `campaign.html`, `paid-media.html`, teams pages, FAQ |

**PR rules**
- Label PRs `PC-XX` matching ticket IDs (multiple tickets OK if tightly coupled).
- Prefer Wave-scoped branches; never force-push `master`.
- Site price/badge copy changes can ship in `poolens-site` PRs referenced from the same wave.
- Tests: extend existing `tests/*.test.mjs` for funnel, checkout, first-value, trust handoff where applicable.
- Do not commit secrets; use existing Stripe/Amplitude env patterns.

---

## 3. Workstream index

| ID | Title | Buyer | Priority | Est | Depends on | Backlog # |
|----|-------|-------|----------|-----|------------|-----------|
| PC-01 | Analytics + Amplitude pay-funnel dictionary | Ops | P0 | M | — | prior |
| PC-02 | PartSnap camera/result events + deny UX hooks | Tech | P0 | M | PC-01 | 3, prior |
| PC-03 | first_action / first_value alignment | Ops | P0 | S | PC-01 | prior |
| PC-04 | Soft gate 3rd free scan + real checkout_click | Solo | P0 | M | PC-01,05 | 29 |
| PC-05 | Web Pro offer after any qualified first value | Solo | P0 | M | PC-03 | 28 |
| PC-06 | Native→web upgrade bridge (no IAP) | Solo | P0 | S | PC-05 | prior |
| PC-07 | One-button SMS/iMessage proof packet | Tech | P0 | M | PC-40 | 1 |
| PC-08 | Site Pro $19/$149yr + Teams owner-paid $49–79 + Stripe price migrate note | All | P0 | S | — | prior |
| PC-09 | Landing north-star + not-billing badge + offline hero | All | P0 | S | — | 5,35 |
| PC-10 | Stripe session read-only classify note (ops) | Ops | P0 | S | PC-01 | prior |
| PC-11 | Store metrics importer stub + docs | Ops | P1 | S | — | prior |
| PC-12 | Counter mode (Code / Part / Chem) | Tech | P1 | S | — | 4 |
| PC-13 | Voice note → structured stop | Tech | P1 | L | PC-40 | 2 |
| PC-14 | Wrong-part insurance calculator copy | Solo | P1 | S | PC-05 | 6 |
| PC-15 | Truck QR → last pool | Tech | P1 | M | PC-40 | 7 |
| PC-16 | Spanish-first UI toggle | Tech | P1 | L | — | 8 |
| PC-17 | Proof Passport as sole shareable artifact | Tech | P0 | M | PC-07 | 36 |
| PC-18 | Send-to-boss Teams upsell from real stop | Owner | P1 | M | PC-07,17 | 9 |
| PC-19 | Crew miss report (owner-paid Teams $49–79 story) | Owner | P1 | M | PC-01 | 10 |
| PC-20 | Skimmer/Jobber/PB export paste templates | Owner | P1 | S | PC-17 | 11 |
| PC-21 | Callback-risk score on weak proof | Tech+Owner | P1 | M | PC-17 | 12 |
| PC-22 | New-hire 5-min cards from misses | Trainer | P2 | M | PC-19 | 13 |
| PC-23 | Opening + Closing season company packs | Owner | P0 | M | — | 14 |
| PC-24 | Facility QR pilot-in-a-box | Facility | P2 | M | PC-17 | 15 |
| PC-25 | CPO instructor partner scenarios | Trainer | P2 | M | PC-17 | 16 |
| PC-26 | Micro-quiz after proof stop | Trainer | P2 | S | PC-17 | 17 |
| PC-27 | Apprentice mode + senior review queue | Owner | P2 | L | PC-19 | 18 |
| PC-28 | Trade-school / lunch-and-learn kits | Distro | P2 | M | PC-22 | 19 |
| PC-29 | Verified cards program (paid listing) | OEM | P1 | L | — | 20 |
| PC-30 | Warranty photo checklist templates | OEM | P1 | M | PC-17 | 21 |
| PC-31 | PartSnap → POOL360/Heritage deep link | Distro | P1 | M | PC-02 | 22 |
| PC-32 | OEM-branded co-app shell | OEM | P3 | L | PC-29 | 23 |
| PC-33 | Robot-lane specialization | Tech+OEM | P2 | M | PC-35 | 24 |
| PC-34 | Spa-pack lane flagship OEM partner | OEM | P1 | M | PC-29 | 25 |
| PC-35 | BT bridge wrappers → DolphinTech/ProApp | Tech | P2 | M | — |  emerging |
| PC-36 | Anonymized failure heatmap subscription | OEM | P2 | L | PC-01,19 | 26 |
| PC-37 | Authorized-service badge in-app | OEM | P2 | M | PC-29 | 27 |
| PC-38 | Per-packet credit pack ($5–10) | Solo | P1 | M | PC-04,05 | 30 |
| PC-39 | Company seat free / owner pays visibility | Owner | P1 | M | PC-18,19 | 31 |
| PC-40 | Proof packet data model + share API hardening | All | P0 | M | — | foundation |
| PC-41 | Distributor-sponsored free Pro | Distro | P2 | M | PC-05 | 32 |
| PC-42 | Seasonal Closing Pro 60-day pass | Solo | P1 | M | PC-05,23 | 33 |
| PC-43 | Mfr-sponsored free scans for verified cards | OEM | P2 | M | PC-29 | 34 |
| PC-44 | Multi-brand Connected Pool Network radio | Tech | P1 | M | — | 37 |
| PC-45 | Training Layer from real misses only | Trainer | P2 | M | PC-22 | 38 |
| PC-46 | Partner-verified language trust moat | All | P1 | S | PC-29 | 39 |
| PC-47 | Field Learning OS for counter staff | Distro | P2 | M | PC-45 | 40 |
| PC-48 | WhatsApp/Telegram bot packet send | Tech | P2 | L | PC-07 | 41 |
| PC-49 | Mystery part bounty + credits | Community | P3 | M | PC-38 | 42 |
| PC-50 | Insurance / P&C pilot packet schema | Partner | P3 | M | PC-17,21 | 43 |
| PC-51 | White-label for service roll-ups | Enterprise | P3 | L | PC-32,39 | 44 |
| PC-52 | Acquire/partner code DB / manuals indexes | Ops | P2 | M | — | 45 |
| PC-53 | On-device/offline multimodal ID (privacy) | Tech | P1 | L | PC-02 | emerging |
| PC-54 | Serial/QR/DataMatrix auto-capture | Tech | P1 | M | PC-02 | emerging |
| PC-55 | Test-strip / display OCR harden | Tech | P1 | M | PC-02 | emerging |
| PC-56 | Distributor barcode → truck/branch check | Tech | P2 | M | PC-31 | emerging |
| PC-57 | Voice-first “talk the stop” gloves-on | Tech | P1 | L | PC-13 | emerging |
| PC-58 | AR overlay stub only (defer full) | Tech | P3 | S | — | emerging |
| PC-59 | Offline-first hero (app + site) | Tech | P0 | S | PC-09 | 5 |

---

## 4. Build Order Waves (ALL in scope)

Waves sequence dependencies. **Every wave is required.** Do not treat later waves as optional backlog cuts.

| Wave | Theme | Ticket IDs |
|------|-------|------------|
| **0** | Foundation: analytics, PartSnap fix hooks, SMS packet, monetization gates, site badge/pricing, Proof Passport core | PC-01…11, PC-17, PC-40, PC-59 |
| **1** | Blue-collar pad UX + seasonal packs + CRM paste + callback risk | PC-12…16, PC-20, PC-21, PC-23, PC-14 |
| **2** | Teams monetization story + voice + capture tech | PC-18, PC-19, PC-13, PC-57, PC-53…55, PC-06 |
| **3** | OEM/distro deep links, verified cards, spa/robot lanes, BT wrappers | PC-29…37, PC-31, PC-56, PC-44, PC-46 |
| **4** | Training / CPO / apprentice / Field Learning OS | PC-22, PC-24…28, PC-45, PC-47 |
| **5** | Alt monetization + wild viable | PC-38, PC-39, PC-41…43, PC-48…52, PC-58 |

---

## 5. Detailed tickets

### PC-01 — Analytics + Amplitude pay-funnel dictionary
**Maps:** prior conversion fixes  
**Goal:** Monetization events stop being dark; Amplitude 863388 receives a coherent pay funnel.  
**Touch:** `js/analytics.js`, `functions/api/events.js`, `functions/_shared/amplitude.mjs`, owner dashboard intelligence if present.  
**Do:**
- Publish event dictionary (§6) as code comments + `docs/ops` or in-brief compliance.
- Ensure `checkout_click`, `checkout_session_created`, `checkout_success`, `entitlement_restored`, `paywall_shown`, `pro_offer_shown` fire with `plan`, `source`, `placement`, `store_mode`.
- Distinguish tracked clicks vs server-created sessions (honor `e17f87c`).
**Acceptance:**
- Manual web Pro click appears in Amplitude within 5 minutes with properties above.
- Unattributed session creation does **not** increment a “customer intent” chart.
- `/api/events` rejects unknown high-cardinality props reasonably; low-signal heartbeats stay filtered.
**Do not:** Log raw card data or full Stripe customer objects to Amplitude.

### PC-02 — PartSnap camera/result events + deny UX hooks
**Maps:** #3 + prior PartSnap events  
**Touch:** `js/app.js` PartSnap flows, scan entitlement, UI sheets.  
**Do:**
- Events: `partsnap_camera_requested`, `partsnap_camera_granted`, `partsnap_camera_denied`, `partsnap_gallery_picked`, `partsnap_result_shown`, `partsnap_miss`, `partsnap_proof_incomplete`.
- On deny: in-app tips (flashlight, gallery) + call Mac bridge if present; else `<input type=file accept=image/*>`.
- Never block free manual code search when camera fails.
**Acceptance:**
- Deny path still yields a PartSnap attempt via gallery.
- Events visible in Amplitude with `store_mode`.
- Regression tests cover deny → gallery happy path where testable.
**Mac hook:** document `window.SplashLensNative.pickGalleryPhoto()` contract in ticket PR.

### PC-03 — first_action / first_value alignment
**Maps:** prior  
**Touch:** `js/app.js` sites emitting `first_action_started` / `first_value_completed`.  
**Do:** Align definitions: first_action = intentional tool start; first_value = useful result (code hit, dose calc result, PartSnap result with proof ladder step, checklist complete, packet shared). Include `method` enum: `manual_code_search|partsnap|dose|checklist|packet|voice|ocr`.  
**Acceptance:** Dashboard/intelligence no longer treats empty sessions as value; tests in `tests/first-useful-result-path.test.mjs` updated.

### PC-04 — Soft gate on 3rd free scan + real checkout_click
**Maps:** #29  
**Touch:** `functions/api/scan-entitlement.js`, `scan.js`, paywall UI in `js/app.js`.  
**Do:** After 3 free PartSnap/AI scans in entitlement window, show soft gate with clear remaining=0; primary CTA fires **real** `checkout_click` then web Stripe checkout (hidden if `store=`). Secondary: “continue with manual tools.”  
**Acceptance:** 4th scan attempt shows gate; click records `checkout_click` before navigation; store mode shows web-upgrade bridge not Stripe iframe.

### PC-05 — Web Pro offer after any qualified first value
**Maps:** #28  
**Touch:** post-value surfaces in `js/app.js`.  
**Do:** After first_value for code/dose/checklist/packet (not only PartSnap), show once-per-session soft Pro offer (`pro_offer_shown`) with benefits tied to wrong-part insurance framing — **“less than one wrong part / one callback”** at target **Pro $19/mo or $149/yr** (free core stays usable).  
**Acceptance:** Offer appears after non-PartSnap first value; dismissible; does not block free core; Amplitude sees `source=first_value`.

### PC-06 — Native→web upgrade bridge
**Maps:** prior  
**Touch:** store-mode CTA components.  
**Do:** When `store=ios|android`, replace Stripe buttons with “Unlock Pro on the web” opening system browser to checkout or account restore URL **without** store param. Copy: no IAP.  
**Acceptance:** Store wrapper audit shows zero Stripe checkout URLs; bridge link works.

### PC-07 — One-button SMS / iMessage proof packet
**Maps:** #1 + emerging SMS  
**Touch:** Proof Passport share UI, `functions/api/proof-packets*`, deep links `sms:` / WhatsApp later.  
**Do:** Primary share = SMS body with truncated proof fields + link to packet; email secondary. Prefill boss/counter numbers from local preferences.  
**Acceptance:** On mobile Safari/Chrome, one tap opens SMS composer with packet summary; event `packet_sms_started` / `packet_shared`. Offline: copy-to-clipboard fallback.  
**Do not:** Build a messaging CRM inbox.

### PC-08 — Retarget site + Stripe notes to cheap Pro / owner-paid Teams
**Maps:** prior · pricing frame 2026-10-05  
**Touch:** `poolens-site` — `index.html`, `field-learning-os.html`, pricing/FAQ/campaign/`paid-media.html`; Stripe product docs / env price IDs in `poolens` if referenced in copy.  
**Do:**
1. **Solo Pro** copy → target **$19/mo · $149/yr** (kill primary $29/$249 as the sell number; “less than one wrong part / one callback”).
2. **Teams** copy → **owner pays, techs free**; target **$49–79/mo** for miss reports + packet inbox. Explicit line: *was $149; now owner-paid $49–79 with free tech seats.* **Kill every `$99` Teams claim** and retire **$149** as the primary Teams number.
3. Impulse credit packs **$5–10** (align PC-38).
4. Free-core callouts stay fat: codes, dosing, offline, Closing Mode.
5. If live Stripe Price IDs still bill $29/$249/$149, open/track a **PC ticket: migrate Stripe prices** to the new targets — do not leave site copy and Stripe out of sync without a note.
**Acceptance:** Site grep shows Pro $19/$149yr and Teams $49–79 owner-paid (no $99; no primary $149 Teams); Pro cards consistent; stale $4.99 PartSnap Pro gone; Stripe migrate ticket filed or prices updated.

### PC-09 — Landing north-star + not-billing badge + offline hero
**Maps:** #5, #35  
**Touch:** `poolens-site/index.html`, `crm-companion.html`, app home eyebrow.  
**Do:** Hero includes north-star line; persistent badge “We don’t do billing, routes, or invoices — we make the stop proveable”; offline-first hero section (manual tools work after first load / bad pad signal).  
**Acceptance:** Above-the-fold on marketing home shows north-star + badge; offline claim matches STORE_WRAPPER_HANDOFF truth.

### PC-10 — Stripe session read-only classify note (ops)
**Maps:** prior / `e17f87c`  
**Touch:** intelligence/dashboard copy, ops docs under `docs/ops` or owner dashboard.  
**Do:** Ops-facing note: unattributed Checkout Sessions ≠ demand; chart customer intent from `checkout_click` + fulfilled entitlements only.  
**Acceptance:** Owner/control-room UI or ops markdown states the classify rule; no code that creates sessions during intelligence checks (already partially done).

### PC-11 — Store metrics importer stub
**Maps:** prior  
**Touch:** `functions/api/store-metrics.js`, migration `2026-09-10-store-metric-imports.sql`, docs for Mac CSV drop.  
**Do:** Ensure import path accepts ASC/Play CSV shape (document columns); dry-run mode; do not fabricate rows.  
**Acceptance:** Sample CSV fixture imports in test or documented manual steps; Mac ticket MAC-05 points here.

### PC-40 — Proof packet / Passport data model hardening
**Maps:** foundation for #1,#36  
**Touch:** `migrations/2026-10-02-proof-packets-team-review.sql`, `functions/api/proof-packets*`, client passport UI.  
**Do:** Schema fields: stop_id, created_at, equipment_model, serial, codes[], photos[], missing_proof[], risk_flags[], share_token, team_id?, anonymize_key. Share link read-only.  
**Acceptance:** Create → share → open on second device works; revoke token works; no customer phone/address required.

### PC-17 — Proof Passport as only shareable artifact
**Maps:** #36  
**Do:** Deprecate ad-hoc “email me a blob” shares in favor of Passport URL + SMS summary. In-app: “Share Proof Passport” primary.  
**Acceptance:** All share CTAs produce Passport; analytics `passport_shared`.

### PC-59 — Offline-first hero (app + site)
**Maps:** #5  
**Do:** App home calls out offline manuals/codes/dosing; site section mirrors; sw.js cache policy review for reference shells (no change that breaks security headers).  
**Acceptance:** Airplane-mode smoke: code search + dose calc still work after prior online visit.


### PC-12 — Counter mode (3 big buttons)
**Maps:** #4 · **Buyer:** Tech · **Size:** S  
**Do:** Field home “Counter mode” layout: huge **Code / Part / Chem** buttons (≥48px targets), reduced chrome. Persist preference locally.  
**Acceptance:** Toggle to Counter mode; three buttons reach existing tools; event `counter_mode_enabled`.

### PC-13 — Voice note → structured stop
**Maps:** #2 · **Size:** L  
**Do:** Record/dictation → parse into Passport fields (symptom, code heard, model guess, actions taken, missing proof). Web Speech API + manual edit. Gloves-on: large tap targets.  
**Acceptance:** Speak a scripted stop → ≥4 fields populated editable; `voice_stop_structured` event; works beside SMS share.  
**Do not:** Require cloud LLM if on-device/basic ASR suffices for v1; if cloud used, gate on consent + Pro if cost requires.

### PC-57 — Voice-first “talk the stop” (gloves on)
**Maps:** emerging · extends PC-13  
**Do:** Entry point from home: “Talk the stop”; auto-start listening; confirm sheet then save Passport.  
**Acceptance:** End-to-end under 30s for scripted sample; works with wet-hands large UI.

### PC-14 — Wrong-part insurance calculator copy
**Maps:** #6  
**Do:** Simple calculator: callback truck roll cost × risk → “Pro ($19/mo or $149/yr) costs less than one callback / one wrong part”; CTA to web checkout.  
**Acceptance:** Interactive on site + in-app offer; no fake ROI statistics beyond user inputs.

### PC-15 — Truck QR stickers → last pool
**Maps:** #7  
**Do:** Generate sticker QR → `app.splashlens.com/t/{truckToken}` opens last-used stop/Passport or prompt to resume. Local-first last pool pointer.  
**Acceptance:** QR scan on phone opens app to last stop when present; privacy: no public PII on token page.

### PC-16 — Spanish-first UI toggle
**Maps:** #8 · **Size:** L  
**Do:** `lang=es` toggle for core field flows (home, code search, PartSnap, dose, Passport share). Start with high-traffic strings; fallback English.  
**Acceptance:** Toggle persists; Code/Part/Chem + share packet usable in ES; event `locale_set`.

### PC-18 — Send-to-boss Teams upsell from real stop
**Maps:** #9  
**Do:** After successful packet share, owner CTA: “Make this visible to your company — Teams $49–79/mo (owner pays; techs free)” with sample miss dashboard screenshot.  
**Acceptance:** Upsell only post-real-stop; `teams_upsell_shown` / `teams_checkout_click`.

### PC-19 — Crew miss report (owner-paid Teams story)
**Maps:** #10  
**Do:** Teams dashboard: searched codes, PartSnap misses, incomplete proof counts by tech (no blame tone — training). Monetization story = **owner pays $49–79/mo** for miss reports + packet inbox; **tech seats free** (not tech-seat ARPU; not the old $149 primary).  
**Acceptance:** Owner with Teams entitlement sees weekly miss summary; anonymization option for exports; upsell/copy matches $49–79 owner-paid frame.

### PC-20 — Skimmer / Jobber / Pool Brain / PTP paste export
**Maps:** #11  
**Do:** “Copy for Skimmer” / “Copy for Pool Brain” (call Pool Brain the innovative CRM) / Jobber / PTP clipboard templates from Passport (plain text blocks); webhook stub docs welcome. Landing pointer on `crm-companion.html`.  
**Acceptance:** Paste into notes field readable; badge “We don’t replace your CRM — we complement Pool Brain & peers”; never routes/billing.

### PC-21 — Callback-risk score on weak proof
**Maps:** #12  
**Do:** Heuristic score from missing_proof + high-risk families (heater/spa GFCI/flow). Show before “complete/leave” with checklist gate.  
**Acceptance:** Weak proof → elevated risk + blocked soft-gate until ack; `callback_risk_shown`.

### PC-22 — New-hire 5-minute cards from real misses
**Maps:** #13  
**Do:** From miss queue, generate lesson card (problem, what was missing, correct proof, quiz link).  
**Acceptance:** Owner can publish card to crew; tech completes in ≤5 minutes.

### PC-23 — Opening / Closing season company packs
**Maps:** #14 + emerging season packs · **P0**  
**Do:** Productize Closing Season Mode + Opening Season Damage Claim Pack as company-assignable packs (checklists, photo standards, declined-work notes). Site push on `closing-season.html` + new opening page if missing.  
**Acceptance:** Pack assignable to Teams; solo tech can run pack free-core; Pro/Teams unlock company templates library.

### PC-24 — Facility QR pilot-in-a-box
**Maps:** #15  
**Do:** Generate wall QR → incident chem/photo packet to contracted vendor email/SMS. Reuse Passport.  
**Acceptance:** Pilot docs + working QR create path; no full CPO LMS.

### PC-25 — CPO instructor partner scenarios
**Maps:** #16  
**Do:** Export anonymized Passport scenarios as teaching PDFs/links; partner landing for instructors.  
**Acceptance:** One sample scenario pack downloadable; PII stripped.

### PC-26 — Micro-quiz after proof stop
**Maps:** #17  
**Do:** Optional 2–3 question quiz after Passport share; does not claim PHTA replacement.  
**Acceptance:** Completing quiz logs `training_quiz_completed`; skip always available.

### PC-27 — Apprentice mode + senior review queue
**Maps:** #18  
**Do:** Apprentice flag on stops → senior queue in Teams; approve/request more proof. Builds on team-review migration.  
**Acceptance:** Apprentice submit → senior notify → resolve loop works.

### PC-28 — Trade-school / distributor lunch-and-learn kits
**Maps:** #19  
**Do:** Static kit pages + printable agendas + PartSnap speed-trial script; site under partners/training.  
**Acceptance:** Kit page live; CTA to app; no fake attendance metrics.

### PC-29 — Verified cards program (paid listing)
**Maps:** #20  
**Do:** Data model for OEM-verified troubleshooting cards (manufacturer FOMO / paid listing); admin flag `verified_by`; public badge; rate-card stub page for sales. Margin story = OEM paid listings + heatmaps — not tech seats.  
**Acceptance:** Verified card renders badge; unverified cannot spoof; listing CMS or markdown workflow documented.

### PC-30 — Warranty photo checklist templates per brand
**Maps:** #21  
**Do:** Templates (nameplate, install context, fault screen, serial) attachable to Passport by brand family.  
**Acceptance:** Selecting brand loads checklist; incomplete items feed missing_proof.

### PC-31 — PartSnap → POOL360 / Heritage deep link
**Maps:** #22  
**Do:** After ID, buttons: “Search on Heritage Pool+” / “Search on POOL360” with URL/search-string generators (no login inside SL).  
**Acceptance:** Opens external search with model/SKU hints; `distro_deeplink_click`; works without distributor account in SL.

### PC-32 — OEM-branded co-app shell
**Maps:** #23 · Wave 5-ish  
**Do:** Theming shell (logo, color, card subset) via partner config; still SplashLens-powered; no separate billing stack.  
**Acceptance:** Feature-flagged demo shell for one fictional mid-tier OEM; docs for real partner onboarding.

### PC-33 — Robot-lane specialization
**Maps:** #24  
**Do:** Multi-brand robot triage hub (Dolphin/Polaris/Aiper/Beatbot/WYBOT): errors → wear vs call OEM app → SKU hints; deep link PC-35.  
**Acceptance:** Hub reachable from Connected Network; ≥3 brands with content stubs; honest “not live BT diagnose.”

### PC-34 — Spa-pack lane as flagship OEM partner surface
**Maps:** #25  
**Do:** Spa Panic Mode (Balboa/Gecko/Waterway): topside codes, GFCI timing wizard, photo proof schema for RMA. Partner-ready verified cards.  
**Acceptance:** End-to-end spa stop produces Passport with warranty checklist; partner badge slot ready.

### PC-35 — Bluetooth bridge wrappers (deep link only)
**Maps:** emerging  
**Do:** When brand detected (Maytronics/etc.), CTA “Open DolphinTech / ProApp” via documented URL schemes / store listings — **do not** rebuild BT-RS485 diagnose.  
**Acceptance:** Detection → deep link; fallback to App Store/Play search; copy says SplashLens triages then hands off.  
**DEFER:** Live bus read.

### PC-36 — Anonymized failure heatmap subscription
**Maps:** #26 + emerging OEM bait  
**Do:** Aggregate miss taxonomy by equipment family/region bucket; OEM subscription stub (waitlist + schema). Strip site addresses/customer names.  
**Acceptance:** Internal heatmap view for ops; export sample anonymized JSON; legal note in privacy FAQ.

### PC-37 — Authorized-service badge inside SplashLens
**Maps:** #27  
**Do:** Partner-verified techs/companies show badge on shared Passports (opt-in).  
**Acceptance:** Badge only if partner entitlement flag set; forge-proof server-side.

### PC-38 — Per-packet credit pack ($5–10)
**Maps:** #30  
**Do:** Stripe one-time **impulse** credit packs (**$5–10**) for N Passports or N PartSnap scans as alternative to monthly.  
**Acceptance:** Checkout plan `credits_*`; entitlement increments; Amplitude `checkout_click` with plan.

### PC-39 — Company seat free for techs, owner pays visibility
**Maps:** #31  
**Do:** Teams billing: unlimited free tech seats for core tools; paid owner visibility/miss reports/review queue.  
**Acceptance:** Docs + entitlement checks enforce; marketing copy matches **$49–79/mo owner-pays, techs free** story (was $149; kill $99).

### PC-41 — Distributor-sponsored free Pro
**Maps:** #32  
**Do:** Redemption codes / domain allowlist granting Pro to sponsored accounts; admin issue codes.  
**Acceptance:** Code redeems to Pro entitlement; audit log; expiry supported.

### PC-42 — Seasonal “Closing Pro” 60-day pass
**Maps:** #33  
**Do:** Stripe product for 60-day Pro; site Closing Season CTA.  
**Acceptance:** Entitlement expires ~60 days; offer seasonal only (feature flag/dates).

### PC-43 — Manufacturer-sponsored free scans for verified-card views
**Maps:** #34  
**Do:** Viewing verified OEM card grants sponsored scan credit (metered, fraud-capped).  
**Acceptance:** Credit applied once per card per period; `sponsored_scan_granted` event.

### PC-44 — Multi-brand Connected Pool Network as radio (not CRM)
**Maps:** #37  
**Do:** Strengthen Connected Pool Network guides as cross-OEM “radio”: Omni/IntelliCenter/iAquaLink/robots/spas symptom trees — export proof, no account graph of customers.  
**Acceptance:** Hub UX clarifies “reference radio, not your route list”; no customer directory features added.

### PC-45 — Training Layer fed only by real field misses
**Maps:** #38  
**Do:** Pipeline: miss → card (PC-22) → optional quiz (PC-26); block manually inventing generic LMS unrelated to misses.  
**Acceptance:** Every published card links to source miss id or anonymized fingerprint.

### PC-46 — Partner-verified language as trust moat
**Maps:** #39  
**Do:** Global copy system: “Partner-verified” vs “Field community” vs “Unverified draft”; enforce in card renderer.  
**Acceptance:** UI cannot mark unverified as verified client-side alone.

### PC-47 — Field Learning OS for distributor counter staff
**Maps:** #40  
**Do:** Counter-staff lane: identify from photo/description → packet for will-call; short lessons from wrong-part returns. Extend `field-learning-os.html` with real product hooks + Teams **$49–79 owner-paid / free tech seats** consistency.  
**Acceptance:** Counter mode + learning cards usable without truck route features.

### PC-48 — WhatsApp / Telegram bot
**Maps:** #41  
**Do:** Bot receives photo/code → returns Passport link / search hints; or share-via-WhatsApp deep link (`wa.me`) as v1 before full bot.  
**Acceptance:** v1 WhatsApp share link works; Telegram optional; document full bot as follow-on if webhook hosting ready.

### PC-49 — Mystery part bounty
**Maps:** #42  
**Do:** Community confirm on hard misses → credit reward; moderation queue. Tie to `mystery-part-lab.html`.  
**Acceptance:** Submit → confirm by N peers → credit grant; abuse caps.

### PC-50 — Insurance / P&C pilot schema
**Maps:** #43  
**Do:** Packet schema fields insurers care about (photos, timestamps, risk score); pilot PDF one-pager for BD — not full integration.  
**Acceptance:** Schema documented + sample Passport export; no fake carrier partnership claims.

### PC-51 — White-label for big service roll-ups
**Maps:** #44  
**Do:** Extend PC-32 with org SSO stub, custom domain docs, Teams seat billing at roll-up — still no CRM.  
**Acceptance:** Architecture doc + feature flags; demo org theme.

### PC-52 — Partner/acquire tiny code databases / manuals indexes
**Maps:** #45  
**Do:** Ops runbook: evaluate external code/manual indexes; ingestion format into `js/errors.js` / data corpus; licensing checklist. Implement at least one licensed/public ingestion path or stub importer.  
**Acceptance:** Importer or documented pipeline; versioned corpus (existing pattern `54379fa`).

### PC-53 — On-device / offline multimodal ID
**Maps:** emerging  
**Do:** Prefer on-device OCR/heuristics when network poor; queue cloud PartSnap when online; privacy copy for pad photos.  
**Acceptance:** Airplane mode: local OCR extracts visible model-ish text into Passport fields when possible; cloud scan resumes online.

### PC-54 — Serial / QR / DataMatrix auto-capture
**Maps:** emerging  
**Do:** Barcode detector (BarcodeDetector API / wasm fallback) fills serial/model; warranty checklist aware.  
**Acceptance:** Scan sample QR/DataMatrix → field populated; event `serial_captured`.

### PC-55 — Test-strip / display OCR harden
**Maps:** emerging  
**Do:** Improve strip/display OCR; keep “confirm with calibrated kit” FAQ messaging; dose draft only after confirm ack.  
**Acceptance:** Regression images fixture; messaging present; `strip_ocr_completed`.

### PC-56 — Distributor barcode → truck/branch availability UX
**Maps:** emerging  
**Do:** After ID, optional “scan distributor barcode” → prompt “on truck? / at my branch?” checklist + deep link search — **not** live inventory API until partner exists.  
**Acceptance:** Checklist + deep link; honest empty state if no API.

### PC-58 — AR overlay stub (DEFER full)
**Maps:** emerging DEFER  
**Do:** Hidden/feature-flag stub route “AR assist — coming later” with rationale (wet gloves, glare). No AR SDK.  
**Acceptance:** Stub compiles/routes behind flag; listed in DEFER; zero App Store AR entitlement work on Mac.


---


## 5b. Monetization + OEM FOMO summary (authoritative)

| Lane | Who pays | Target | Notes |
|------|----------|--------|-------|
| Free core | Nobody | Fat | Codes, dosing, offline, Closing Mode, checklists — stay generous |
| Solo Pro | Tech | **$19/mo · $149/yr** | “Less than one wrong part / one callback”; was ~$29/$249 |
| Teams | Owner | **$49–79/mo** | Owner pays; **techs free**; miss reports + packet inbox; was $149 primary; kill $99 |
| Impulse | Tech | **$5–10** packs | Per-packet / scan credits (PC-38) |
| OEM FOMO | Manufacturer / distro | Paid listings + heatmap sub | Verified cards, warranty packs, anonymized heatmaps, authorized badge, sponsored Pro for dealers; one spa/robot pilot |
| Margin thesis | — | — | **Not** tech-seat ARPU — OEM verified cards + heatmaps + cheap Pro/Teams conversion |

**Pool Brain:** innovative CRM we complement via paste/export/webhook. SplashLens never does routes/billing. Acquisition = pad-proof OS next to their CRM.

**Stripe:** If Price IDs still encode old amounts, PC must open **migrate Stripe prices** alongside site copy (PC-08).

## 6. Site / marketing changes (poolens-site)

| Change | Pages (non-exhaustive — grep) | Acceptance |
|--------|-------------------------------|------------|
| North-star hero line | `index.html`, campaign as needed | Visible above fold |
| “We don’t do billing” badge | `index.html`, `crm-companion.html`, app chrome | Persistent |
| Offline-first hero | `index.html`, maybe FAQ | Matches product truth |
| Closing + Opening season push | `closing-season.html`, opening page | CTAs to packs + Closing Pro |
| Pro pricing clarity | pricing sections, `campaign.html` | **$19/mo · $149/yr** targets (note Stripe migrate if needed) |
| Teams price retarget | `index.html`, `field-learning-os.html`, others | **$49–79/mo owner-paid, techs free**; kill $99; retire primary $149 |
| Kill stale $4.99 PartSnap Pro | `paid-media.html` | Align to current Pro |
| Proof Passport positioning | `service-proof-passport.html` | Matches app artifact |
| Not-Skimmer / complement | `crm-companion.html` | Export-first language |
| Pool Brain complement | `crm-companion.html`, home | Innovative CRM + paste/export/webhook; never routes/billing |
| OEM FOMO surfaces | partners / verified cards / heatmaps pages | Verified cards, warranty packs, heatmaps, authorized badge, sponsored Pro |

PC Codex should open PRs in `poolens-site` as needed; keep claims consistent with `SPLASHLENS_SITE_CLAIMS` handoff norms (no unverifiable competitor metrics).

---

## 7. Analytics event dictionary

Emit via `trackSplashLensEvent` → `/api/events` → Amplitude project **863388**. Always include when known: `store_mode` (`web|ios|android`), `plan`, `source`, `placement`, `method`.

| Event | When | Required props |
|-------|------|----------------|
| `session_start` | App load | `store_mode` |
| `first_action_started` | Tool intentionally started | `method` |
| `first_value_completed` | Useful result | `method` |
| `partsnap_camera_requested/granted/denied` | Permission path | — |
| `partsnap_gallery_picked` | Gallery fallback | — |
| `partsnap_result_shown` | Result UI | `match_tier` |
| `partsnap_miss` | No usable match | — |
| `partsnap_proof_incomplete` | Missing proof gates | `missing_count` |
| `serial_captured` | QR/DataMatrix/OCR serial | `symbology` |
| `strip_ocr_completed` | Strip/display OCR | `confirmed_kit` bool |
| `voice_stop_structured` | Voice→fields | `field_count` |
| `counter_mode_enabled` | Toggle | — |
| `locale_set` | ES/EN | `locale` |
| `passport_created` | Passport saved | `risk_score?` |
| `passport_shared` | Share | `channel=sms|whatsapp|copy|email` |
| `packet_sms_started` | SMS composer | — |
| `callback_risk_shown` | Risk gate | `score` |
| `pro_offer_shown` | Soft offer | `source` |
| `paywall_shown` | Soft gate | `remaining_scans` |
| `checkout_click` | User intent | `plan`, `placement` |
| `checkout_session_created` | Server session | `attributed` bool |
| `checkout_success` | Paid | `plan` |
| `entitlement_restored` | Restore | `plan` |
| `teams_upsell_shown` | Post-stop | — |
| `teams_checkout_click` | Teams CTA | — |
| `distro_deeplink_click` | Heritage/POOL360 | `partner` |
| `oem_deeplink_click` | DolphinTech etc. | `brand` |
| `sponsored_scan_granted` | Mfr credit | `card_id` |
| `training_quiz_completed` | Quiz | `card_id` |
| `heatmap_viewed` | OEM/ops | `anon` |

**Ops rule:** Customer demand charts use `checkout_click` + `checkout_success` / entitlements — **not** raw unattributed `checkout_session_created` (see `e17f87c`).

---

## 8. Data model / schema notes

### Proof Passport / packet
- `passports`: id, created_at, updated_at, owner_account_id?, team_id?, title, equipment_family, model, serial, codes_json, photos_json, readings_json, missing_proof_json, risk_score, share_token_hash, revoked_at, locale, source_method  
- `passport_events`: audit of shares/reviews  
- Extend existing `proof-packets` migration rather than parallel incompatible tables.

### Verified cards
- `verified_cards`: id, brand, sku_or_family, body_md, verification_status, sponsor_account_id, sponsor_credits_policy_json, updated_at  
- Render badge only when `verification_status=partner_verified` server-side.

### Heatmaps (anonymized)
- `failure_signals`: day, geo_bucket (coarse), equipment_family, miss_type, count  
- No street address, customer name, phone, exact GPS.

### Credits / entitlements
- Reuse commercial entitlement tables; add `credit_balance`, `credit_ledger` for packet/scan packs and sponsored credits.

### Teams
- Free tech seats; paid owner features (**$49–79/mo target**): miss report, packet inbox, review queue, company packs. Not tech-seat ARPU.

---

## 9. Partner integration stubs

| Partner | Stub behavior | Not in v1 |
|---------|---------------|-----------|
| Heritage Pool+ | Search URL / query string from model/SKU | Live inventory API |
| POOL360 / SCP | Same | Account login proxy |
| Maytronics DolphinTech | Deep link / store search after robot triage | BT protocol clone |
| Pentair/Hayward/Jandy apps | Deep link to consumer/pro apps where public URLs exist | Telemetry APIs |
| SMS | `sms:` URI + optional provider later (Twilio) for server-send | Two-way inbox |
| WhatsApp | `wa.me` share | Full business API until approved |
| Stripe | Existing checkout + new credit/Closing Pro products; **migrate prices** to Pro $19/$149yr + Teams $49–79 | Native IAP |
| Pool Brain | Paste/export/webhook companion (innovative CRM) | Routes, invoices, autopay inside SplashLens |

Document stub URLs in `docs/ops/partner-deeplinks.md` (create).

---

## 10. Explicit DEFER list (still ticketed only as stubs where noted)

| Item | Status |
|------|--------|
| Full AR overlay / ARKit | **DEFER** — PC-58 stub only |
| Live BT / RS-485 diagnose rebuild | **DEFER** — deep-link wrappers only (PC-35) |
| Native IAP / StoreKit / Play Billing | **FORBIDDEN** |
| Becoming CRM (routes, invoices, autopay, GPS payroll) | **FORBIDDEN** |
| Competing with Orenda on LSI brand | **DEFER** |
| Full Facility/CPO LMS | **DEFER** — pilot stubs only (PC-24,25) |
| Formal Heritage/POOL360 inventory API | **DEFER** until partner |

---

## 11. Mac handoff pointer

PC must leave:
1. Gallery/camera deny UX calling optional `SplashLensNative` bridge.
2. `store=ios|android` hiding Stripe; web upgrade URLs without store param.
3. Store metrics CSV import path documented for MAC-05.
4. No native project file edits required for Waves 0–5 product work.

Mac implements: `docs/codex/MAC_CODEX_NATIVE_TICKETS_2026-10-05.md` / verbal script.

---

## 12. Definition of Done — Full Boat

**Wave 0 Done when:** Analytics dark funnel lit; PartSnap deny→gallery path; SMS Passport share; soft gate + first-value Pro offer; site Pro=$19/$149yr + Teams=$49–79 owner-paid + north-star + not-billing/Pool Brain badge; Stripe session classify note; Proof Passport shareable.

**Full Boat Done when:** Every backlog #1–45 maps to a merged or explicitly implemented ticket PC-01…PC-59; DEFER items only exist as stubs/docs per §10; Mac tickets either done or blocked solely on store console access (documented); Amplitude shows checkout_click→success path; no IAP introduced; CRM complement badges live.

### Backlog coverage matrix (must stay 1:1)

| # | Ticket | # | Ticket | # | Ticket |
|---|--------|---|--------|---|--------|
| 1 | PC-07 | 16 | PC-25 | 31 | PC-39 |
| 2 | PC-13 | 17 | PC-26 | 32 | PC-41 |
| 3 | PC-02 | 18 | PC-27 | 33 | PC-42 |
| 4 | PC-12 | 19 | PC-28 | 34 | PC-43 |
| 5 | PC-09,59 | 20 | PC-29 | 35 | PC-09 |
| 6 | PC-14 | 21 | PC-30 | 36 | PC-17 |
| 7 | PC-15 | 22 | PC-31 | 37 | PC-44 |
| 8 | PC-16 | 23 | PC-32 | 38 | PC-45 |
| 9 | PC-18 | 24 | PC-33 | 39 | PC-46 |
| 10 | PC-19 | 25 | PC-34 | 40 | PC-47 |
| 11 | PC-20 | 26 | PC-36 | 41 | PC-48 |
| 12 | PC-21 | 27 | PC-37 | 42 | PC-49 |
| 13 | PC-22 | 28 | PC-05 | 43 | PC-50 |
| 14 | PC-23 | 29 | PC-04 | 44 | PC-51 |
| 15 | PC-24 | 30 | PC-38 | 45 | PC-52 |

Emerging tech: Voice PC-13/57 · Offline multimodal PC-53 · Serial/QR PC-54 · Strip OCR PC-55 · SMS PC-07 · BT wrappers PC-35 · Distro barcode PC-56 · Season packs PC-23 · AR stub PC-58 · Heatmaps PC-36.

Prior conversion fixes: PartSnap events PC-02 · first_action/value PC-03 · native→web PC-06 · store metrics PC-11 · Amplitude pay funnel PC-01 · Stripe classify PC-10 · Teams price PC-08.

---

## 13. Do-Not list (global)

- Do not add IAP or in-wrapper Stripe.
- Do not build routing, invoicing, customer autopay, or technician GPS payroll.
- Do not promise fitment or diagnosis; keep cautious PartSnap language.
- Do not ship live OEM bus protocols.
- Do not put customer PII into OEM heatmap exports.
- Do not leave Teams priced at $99 anywhere, and do not keep **$149** as the primary Teams sell number (use owner-paid **$49–79** with free tech seats; note “was $149” only as migration context).
- Do not keep Solo Pro sold as **$29/mo · $249/yr** once site/Stripe migrate — target **$19/mo · $149/yr** (flag Stripe price-ID migrate ticket until live).
- Do not invent competitor metrics beyond `docs/research/splashlens-competitive-brief-2026-10-05.md`.
- Do not implement Mac-only native projects in PC PRs.
- Do not force-push `master`.
- Do not treat Waves as permission to drop later tickets — sequence only.

---

**End of PC Codex Full Boat brief.** Implement via sequential focused PRs labeled `PC-XX` until coverage matrix is complete.
