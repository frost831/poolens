# PC Codex Restart: Wave A (2026-10-09)

**Paste this entire file into PC Codex. Implement A0-A8 in order. Stop and report when A8 is done.**

Repo: `frost831/poolens` (app, Cloudflare Pages + Functions + D1). Site work, where noted: `frost831/poolens-site`.
Branch per item off `master`: `codex/pc-a0-cache-bump`, `codex/pc-a1-measurement`, and so on. One focused PR per item, titled `PC-A0: ...` through `PC-A8: ...`.
Report after each merge-ready PR: PR URL, tests run, events added, and anything blocked.

## Non-negotiables

1. **Web Stripe only.** No IAP. Store shells (`?store=ios|android`, `isStoreShellMode()` in `js/app.js`) never render Stripe, prices, or checkout links.
2. **Not a CRM.** No routes, billing, invoices, autopay, or customer messaging from the server.
3. **Mac owns native.** Do not touch `ios/`, `SplashLens.xcodeproj/`, `android-twa/`, or `project.yml`.
4. **Never send messages to real people.** No server SMS/email. Share = `sms:` / share sheet opened by the user.
5. **No invented stats** in UI, site copy, or PR text.
6. Never force-push `master`. No direct commits to `master`.
7. Extend `tests/*.test.mjs` for every item. Keep the existing suite green (`npm test`, currently 192 tests; use **Node 22+** because `payment-funnel-events` and `foreign-payment-backfill-boundary` import `node:sqlite`).
8. Pricing is fixed: Pro **$19/mo or $149/yr**; Teams **$49-79/mo, owner pays, techs free**. Read prices from config (`PLAN_CONFIG` in `functions/api/checkout.js`), never hardcode new numbers.

## Why this wave (Oct 9 status)

After the Oct 5 build day, daily actives were 9, 14, 3, 2. Since Oct 5 only 2 users reached `first_value_completed`. D1 retention 0%, D7 about 1%. 17 new users are `source=qa`, 42 have no source. 21 `checkout_session_created`, 18 with `source=server` and no placement (8 on Oct 7, after the Oct 6 crawler guard). `checkout_click` never reached Amplitude. No paid events. Spanish use 0. No in-app closing events since Sep 14. `library_miss`, SMS packet, and Closing Pro never fired.

Goal: clean numbers, a 60-second hook, a reason to come back tomorrow, and monetize closing season. Nothing else this wave.

---

## A0 Cache bump (do first, ship same day)

Oct 8 fix `e4d2f94` (manual proof recovery) changed `js/app.js` without bumping the cache, so installed PWAs and store shells may still serve the Oct 5 bundle.

Files: `sw.js` (`CACHE = 'splashlens-v26-proof-packet'`, `ASSETS` list), `index.html` line ~1674 (`/js/app.js?v=20261005-proof-packet`), `tests/northstar-funnel-copy.test.mjs` lines ~81-85 (asserts the old version).

Acceptance:
- [ ] `CACHE` becomes `splashlens-v27-restart-a0`; every changed asset in `ASSETS` and `index.html` gets a new `?v=20261009-...` query.
- [ ] Old caches are deleted on `activate` (existing `keys.filter(k => k !== CACHE)` path still runs).
- [ ] Test asserts `sw.js` CACHE, `sw.js` ASSETS, and `index.html` script tags use the **same** version string (no drift).
- [ ] Rule written into `docs/codex/README.md`: every PR that changes `js/*.js` or `index.html` bumps the cache. Each later A-item bumps it again.

## A1 Measurement hygiene

Files: `functions/api/events.js` (`isInternalNoise` only filters `session_heartbeat` today), `functions/_shared/amplitude.mjs` (`forwardEventToAmplitude`), `js/app.js` (`trackSplashLensEvent` ~9387, `isInternalAnalyticsSession` ~9519, `trackCheckoutIntent` ~10336, `getCheckoutUrl` ~10375), `functions/api/checkout.js` (`onRequestGet`, `isAutomatedPreview`), `functions/_shared/payment-funnel.mjs` (`checkoutAttribution` defaults source to `server` when `client_reference_id` is missing).

**A1a Tag, don't drop.** Add `traffic_class` to every event stored in D1 and forwarded to Amplitude: `real | qa | server | bot`. Rules: `source`/`utm_source` in `qa, codex, codex_smoke, launch-gate-test` -> `qa`; UA matching bot/crawler/spider/preview/headless/curl/python-requests/node-fetch or `navigator.webdriver` -> `bot`; server-originated without a client id -> `server`. Also set boolean `is_internal` (true unless `real`).
- [ ] Applies to all events, not just heartbeats. Keep heartbeat-noise skip as is.
- [ ] Amplitude user property `traffic_class` set too, so cohorts work.
- [ ] Add `docs/analytics/AMPLITUDE_FILTERS.md`: project 863388, saved segment "Real users" = `traffic_class = real`. Every product chart uses it.
- [ ] Test: qa source, curl UA, and normal Safari UA each produce the right class.

**A1b checkout_click actually lands.** Today the 10 `data-checkout-placement` CTAs call `trackCheckoutIntent` inside `onclick` on `target="_blank"` links; the beacon may race navigation, and nothing on the server records the click.
- [ ] Every real upgrade CTA (app + `poolens-site`) routes through one helper that fires `checkout_click` with `{plan, placement, client_reference_id, store:'web'}` to `/api/events` **before** navigating (beacon, then navigate).
- [ ] `events.js` forwards `checkout_click` to Amplitude (verify in test with a stubbed fetch).
- [ ] Server-side backstop: when `/api/checkout` receives a valid `client_reference_id` + `placement`, record `checkout_click_server` once per reference.
- [ ] Test: each CTA found by `data-checkout-placement` in `js/app.js` uses the helper; store shells produce no CTA and no event.

**A1c No Stripe session without a real click.** Likely cause of Oct 7 sessions: `poolens-site` links straight to `https://app.splashlens.com/api/checkout?plan=monthly` (`index.html`, `partsnap.html`, `campaign.html`, `lp/pool-parts-id-app.html`, `paid-media.html`). Any link unfurler, prefetcher, or safe-browsing scanner with a normal UA creates a session with `source=server`, no placement.
- [ ] `GET /api/checkout` never creates a Stripe session. It returns a tiny no-index HTML "Continue to secure checkout" page (or redirects to the app pricing view). Session creation moves to `POST /api/checkout` with JSON `{plan, placement, client_reference_id, client_id, session_id}`.
- [ ] POST requires a valid `client_reference_id` and `placement`; otherwise 400 and no Stripe call.
- [ ] Reject when `Sec-Fetch-Mode` is present and not `navigate`/`cors`, or `Purpose: prefetch` / `Sec-Purpose: prefetch` is set.
- [ ] Site links point to an app upgrade view (e.g. `https://app.splashlens.com/?upgrade=monthly&placement=site_home&utm_source=site`; add the view if none exists) where the user taps to POST, not to `/api/checkout`.
- [ ] `?catalog` GET keeps working unchanged.
- [ ] Tests: GET with plan only -> no Stripe fetch; POST without reference -> 400; bot UA POST -> 403; prefetch header -> 403; valid POST -> session + `checkout_session_created` with `source=app` and placement.

## A2 Counter mode home

Files: `index.html` (tab panels from ~874, nav ~1634), `js/app.js` (`showTab` ~629, `onErrorSearch` ~3499, `scanCodeSearch` ~11246, `renderChemCatalogHome` ~11441).
- [ ] New users (no prior `poolens-*` localStorage) land on Counter mode: three full-width buttons **Code / Part / Chem**, at least 72px tall, readable in sun.
- [ ] Code -> code search with keyboard focused; Part -> PartSnap (`tab-scan`); Chem -> dosing (`tab-dosing`).
- [ ] Code answers open from bundled `js/errors.js` data with **no network** (test offline: no fetch before first render).
- [ ] Returning users keep their last tab; a "Counter" button stays one tap away.
- [ ] Events: `counter_mode_opened`, `counter_button_tapped {button: code|part|chem}`.

## A3 Spanish toggle on first open

Existing pieces: `LANGUAGE_OPTIONS = ['en','es']` (~line 22), `normalizeLanguage`, `setPreferredLanguage`, `?lang=` param, `language_preference_set` event. No first-open picker today.
- [ ] First open shows one sheet: **English / Español**, before Counter mode. Shown once, persisted in the existing language profile.
- [ ] Spanish covers: Counter mode, code answer UI chrome (labels, buttons, headings; code data itself may stay English), packet/share text, closing checklist, upgrade copy.
- [ ] Strings live in one dictionary file (e.g. `js/i18n.js`); machine-drafted Spanish is marked `// needs_native_review` and listed in `docs/i18n/ES_REVIEW.md`.
- [ ] Toggle reachable from Counter mode header at any time.
- [ ] Event: `language_selected {language, surface: first_open|header}`.
- [ ] Test: every key in `en` exists in `es`.

## A4 One-button SMS packet

Existing share paths: `navigator.share` at ~1381, ~5011, ~5502, ~6456, ~10865; boss packet in `js/partsnap-boss-packet.js`; Passport links via `functions/api/proof-packets.js` and `proof-packets/[shareId].js`.
- [ ] One "Text it" button on every proof stop and every opened code answer.
- [ ] Tap opens `sms:?&body=...` (iOS) / `sms:?body=...` (Android) with short packet text + Passport link; falls back to `navigator.share`, then clipboard.
- [ ] Text under 480 chars, in the selected language.
- [ ] No phone numbers stored or required. No server-side sending.
- [ ] Works in store shells (no prices or checkout in the text).
- [ ] Events: `packet_share_tapped {channel: sms|share_sheet|clipboard, surface}`, `packet_shared` (fire when the share promise resolves or sms link opens).

## A5 Return reason: last pool + truck QR

Files: `js/app.js` pools store (`POOLS_KEY = 'poolens-pools'` ~5950, `savePools`, `savePool` ~6814), `tab-pools`.
- [ ] Every completed stop/code lookup with a pool attached updates "Last pool" (local only).
- [ ] Counter mode shows a "Last pool" card (name, last visit, last proof) when one exists.
- [ ] "Truck QR" prints/downloads a QR for `https://app.splashlens.com/?open=last_pool&utm_source=truck_qr`; opening it lands on the last pool, or Counter mode if none.
- [ ] Events: `last_pool_opened {source: card|truck_qr}`, `truck_qr_created`.

## A6 In-app closing season + Closing Pro pass

Existing: `CLOSING_CHECKLIST` (`js/data.js`, key `poolens-cl-closing`), `startServiceProofWorkflow('closing')` ~1951, site hub `poolens-site/closing-season.html` already deep-links `?tab=guide&checklist=closing` and `?workflow=closing`.
- [ ] Closing checklist has photo-proof steps (cover, plugs, equipment drained, chemistry) and completes into a closing proof packet that A4 can text.
- [ ] Site hub links land in this flow (verify each `closing-season.html` app link in a test).
- [ ] Event `closing_checklist_started`, `closing_checklist_completed {steps, photos}`.
- [ ] After completion (web only): Closing Pro 60-day pass offer. Price comes from server config (add `closing_pass_60d` to `PLAN_CONFIG` + catalog; amount set by env, offer hidden if unset). One-time Stripe payment, grants Pro for 60 days via existing entitlement path.
- [ ] Never rendered in store shells.
- [ ] Event `closing_pass_offer_shown {placement}`; CTA fires `checkout_click` via A1b helper.

## A7 Soft gate on 3rd free scan + post-value offer

Existing: `SCAN_LIMIT_FREE = 3` (~7704), scan-limit UI ~9336-9357, `trackPostValueUpgrade` ~10343, `functions/api/scan-entitlement.js`.
- [ ] On the 3rd free scan result: result shows in full, then a soft Pro card (dismissible, no block).
- [ ] After any first value (code answer, proof stop, closing complete), one post-value Pro offer per session, web only.
- [ ] Every CTA fires `checkout_click` with placement `soft_gate_scan3` or `post_value_<surface>`.
- [ ] Events: `soft_gate_shown`, `soft_gate_dismissed`.
- [ ] Test: store shells show neither card.

## A8 library_miss

Triggers: `scanCodeSearch` / `onErrorSearch` with zero hits, `trackPartSnapResultFailure('low_confidence'|'no_match')` (~10115), `partsnap_manual_fallback` (~8682).
- [ ] Fire `library_miss {trigger: code_no_hit|partsnap_low|partsnap_no_match|manual_fallback, brand, model, query}` (text only, trimmed, no PII).
- [ ] `POST /api/library-miss` stores to D1 table `library_misses` (new migration `migrations/2026-10-09-library-misses.sql`: id, created_at, trigger, brand, model, query, photo_ref nullable, client_hash, traffic_class, status default `new`). Rate-limit per client.
- [ ] Optional photo ref only if the user already uploaded it for the scan; never upload just for this.
- [ ] `owner-dashboard.html` gets a "Library misses" table (top queries by count, last 7 days, status), via `functions/api/admin.js` behind the existing admin secret.
- [ ] Test: each trigger fires once per query; endpoint rejects bad input; admin list requires auth.

---

## Analytics events (Wave A)

| Event | Key props | Fired from |
|---|---|---|
| `checkout_click` | plan, placement, client_reference_id, store | every real upgrade CTA (A1b) |
| `checkout_click_server` | placement, client_reference_id | `/api/checkout` POST (A1b) |
| `checkout_session_created` | source=app, placement | server, only after valid POST (A1c) |
| `counter_mode_opened` | first_open | A2 |
| `counter_button_tapped` | button | A2 |
| `language_selected` | language, surface | A3 |
| `packet_share_tapped` | channel, surface | A4 |
| `packet_shared` | channel, surface | A4 |
| `last_pool_opened` | source | A5 |
| `truck_qr_created` | — | A5 |
| `closing_checklist_started` / `_completed` | steps, photos | A6 |
| `closing_pass_offer_shown` | placement | A6 |
| `soft_gate_shown` / `soft_gate_dismissed` | scan_count | A7 |
| `library_miss` | trigger, brand, model, query | A8 |

All events carry `traffic_class`, `is_internal`, `language`, `store_shell`.

## Definition of Done (Wave A)

- [ ] A0-A8 each merged as its own PR labeled PC-A0..PC-A8.
- [ ] `npm test` green on Node 22+, with new tests for each item.
- [ ] Cache version bumped in the last PR; `sw.js` and `index.html` match.
- [ ] Every new event visible in Amplitude project 863388 from a real browser session, filtered by `traffic_class = real` (screenshot or event-stream note in the PR).
- [ ] A GET to `/api/checkout?plan=monthly` with a normal Safari UA creates **zero** Stripe sessions.
- [ ] Store shells (`?store=ios`, `?store=android`): no prices, no checkout, no Closing Pass offer; Counter, Spanish, SMS, last pool, closing checklist all work.
- [ ] No files changed under `ios/`, `SplashLens.xcodeproj/`, `android-twa/`, `project.yml`.
- [ ] Final report to Joshua: PR list, what shipped, what's blocked, and what needs native review (Spanish strings).

## After Wave A

Next waves stay in scope: `docs/codex/PC_CODEX_PASTE_GROWTH_SEO_ASO_AEO_2026-10-05.md` (PC-G-07..G-20) and `docs/codex/PC_CODEX_FULL_BOAT_2026-10-05.md` (remaining PC-21..PC-58). Joshua sends the next wave paste after reviewing Wave A numbers.
