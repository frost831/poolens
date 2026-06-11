# SplashLens — Complete Project Handoff
**Date:** 2026-05-24  
**Prepared by:** Claude Sonnet 4.6 (full session, including compacted context)

---

## 1. What This Product Is

SplashLens is a free, offline-first PWA for pool service technicians. No account required. No app store download. No subscription. Open it on any phone at `app.splashlens.com` and it works without signal after the first load.

**The product today:**
- 500+ equipment error codes across 15 brands with causes + fix steps
- Chemical dosing calculators (chlorine, acid, alkalinity, CYA, salt)
- SLAM multi-day tracker with OCLT logging
- AI camera scanner — point at equipment error display → instant diagnosis
- Filter guides (sand backwash, DE recharge, cartridge clean)
- Weekly service checklist
- Works 100% offline via service worker cache

**The planned paid product:** Route Ready — a 10-module training program turning new hires into competent pool techs in 30 days. Landing page is live. Email capture is running. No content built yet.

---

## 2. Live URLs

| URL | Project | Status |
|---|---|---|
| `splashlens.com` | poolens-site | ✅ Live |
| `www.splashlens.com` | poolens-site | ✅ Live |
| `app.splashlens.com` | poolens | ✅ Live |
| `splashlens.com/route-ready` | poolens-site | ✅ Live |
| `splashlens.com/blog/` | poolens-site | ✅ Live (300 posts) |
| `poolens-site.pages.dev` | poolens-site | ✅ Always-on fallback |
| `poolens.pages.dev` | poolens | ✅ Always-on fallback |

---

## 3. GitHub Repos

| Repo | URL | Visibility |
|---|---|---|
| PWA app | `github.com/throttleshare/poolens` | Public |
| Marketing site | `github.com/throttleshare/poolens-site` | Public |

---

## 4. Cloudflare Infrastructure

**Account ID:** `214023f3c23554a68344d77bc7a16185`  
**splashlens.com Zone ID:** `e1ceb4ea5691b9f30f30f738a3c7e251`  
**Wrangler config:** `C:/Users/sales/.wrangler/config/default.toml`  
**Python (project use):** `C:/Users/sales/AppData/Local/Programs/Python/Python311/python.exe`

### CF Pages Projects

| Project Name | Custom Domain | Pages.dev fallback | Deploy command |
|---|---|---|---|
| `poolens` | `app.splashlens.com` | `poolens.pages.dev` | `cd poolens && npx wrangler pages deploy . --project-name poolens --commit-dirty=true` |
| `poolens-site` | `splashlens.com`, `www.splashlens.com` | `poolens-site.pages.dev` | `cd poolens-site && npx wrangler pages deploy . --project-name poolens-site --commit-dirty=true` |

### D1 Database — Email Subscribers

| Setting | Value |
|---|---|
| Database name | `splashlens-subscribers` |
| Database ID | `f474defb-4337-42ec-b143-7b37fc949761` |
| Binding name | `SUBSCRIBERS_DB` |
| Bound to | `poolens-site` CF Pages project |
| Schema | `subscribers(email TEXT UNIQUE, source TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)` |
| Endpoint | `POST https://splashlens.com/api/subscribe` |
| Query subscribers | `npx wrangler d1 execute splashlens-subscribers --remote --command "SELECT * FROM subscribers ORDER BY created_at DESC"` |

### Secrets / Env Vars

| Project | Secret | Purpose |
|---|---|---|
| `poolens` | `ANTHROPIC_API_KEY` | Claude Haiku vision API for AI scanner — set in CF Pages project settings |

### DNS Records (splashlens.com zone)

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` | `poolens-site.pages.dev` | ON |
| CNAME | `www` | `poolens-site.pages.dev` | ON |
| CNAME | `app` | `poolens.pages.dev` | ON |

### Bing IndexNow

- Key: `7480a549532eec74705e8f33ed2c168a`
- Key file: `poolens-site/7480a549532eec74705e8f33ed2c168a.txt` (deployed at `splashlens.com/7480a549532eec74705e8f33ed2c168a.txt`)
- 304 URLs submitted 2026-05-24 (HTTP 200 confirmed)

---

## 5. Complete File Map

### App — `C:/Users/sales/Dropbox/Projects/poolens/`

| File | Purpose | Key details |
|---|---|---|
| `index.html` | Entire PWA UI | All tabs, all tools, all modals. This is the whole app in one file. |
| `js/app.js` | All app logic | Routing, calculators, SLAM tracker, service worker registration, camera, report generation |
| `js/errors.js` | Error code database | 15 brands, 978 lines, all codes with causes + fix steps. See Section 7 for brand list. |
| `js/chemicals.js` | Chemical catalog | 31 products, 12 categories, dosing guidance |
| `manifest.json` | PWA manifest | name: "SplashLens Field Reference", short_name: "SplashLens", theme: #0284c7 |
| `sw.js` | Service worker | Cache key: `splashlens-v1`. Changing this version forces all installed PWAs to refresh. |
| `functions/api/scan.js` | AI scanner backend | CF Pages Function. Proxies to Claude Haiku vision API. 3 modes: `error_code`, `parts_snap`, `test_strip`. CORS allows `app.splashlens.com` and `poolens.pages.dev`. |
| `favicon.svg` | App icon | Blue wave icon |
| `llms.txt` | LLM discovery | Brand: SplashLens, URLs: splashlens.com / app.splashlens.com |
| `robots.txt` | Crawler rules | Sitemap: `https://splashlens.com/sitemap.xml` |
| `BUSINESS_CASE.md` | Business case doc | Full analysis: market, revenue model, competitive positioning |

### Marketing Site — `C:/Users/sales/Dropbox/Projects/poolens-site/`

| File | Purpose | Key details |
|---|---|---|
| `index.html` | Marketing homepage | Hero, features, FAQ schema, Route Ready email CTA section, CF Web Analytics placeholder before `</body>` |
| `route-ready.html` | Route Ready landing page | 10-module grid, 4-tier pricing table, email capture form POSTing to `/api/subscribe`, FAQ, certificate section |
| `functions/api/subscribe.js` | Email capture endpoint | CF Pages Function. Validates email, `INSERT OR IGNORE INTO subscribers`. Returns `{"ok":true,"message":"You're on the list."}` |
| `blog/index.html` | Blog index | 300-post grid. Regenerated by `build_blog_index.py`. |
| `blog/*.html` | 300 blog posts | All rebranded. All canonicals point to `splashlens.com`. All og:images use Unsplash pool photo. |
| `sitemap.xml` | XML sitemap | 304 URLs (index + 300 posts + 3 core pages) at splashlens.com. Regenerated by `build_blog_index.py`. |
| `build_blog_index.py` | Blog/sitemap generator | SITE_URL = `https://splashlens.com`. Re-run after adding new posts to regenerate index + sitemap. |
| `_headers` | CF Pages headers | Security headers (X-Frame-Options DENY, nosniff, etc.) + cache rules for blog, favicon, HTML |
| `404.html` | Custom 404 | SplashLens branded, links to app and home |
| `favicon.svg` | Site icon | Same blue wave as app |
| `llms.txt` | LLM discovery | Brand: SplashLens |
| `robots.txt` | Crawler rules | Sitemap: `https://splashlens.com/sitemap.xml` |
| `privacy.html` | Privacy policy | Rebranded from PoolLens, contact: `hello@splashlens.com` |
| `terms.html` | Terms of service | Rebranded from PoolLens |
| `7480a549532eec74705e8f33ed2c168a.txt` | IndexNow key file | Content: `7480a549532eec74705e8f33ed2c168a` |
| `automate_launch.py` | Playwright automation | Opens Chromium, handles GSC sitemap submit + CF Analytics + Reddit post fill |
| `ROUTE_READY_CURRICULUM.md` | Training curriculum | Full 10-module outline, learning outcomes, SplashLens tie-ins, assessments, pricing, build sequence |
| `PARTNERSHIP_OUTREACH.md` | Outreach scripts | Email copy for Skimmer, Pool Brain, Jobber, PHTA. Includes send order + follow-up rule. |
| `LAUNCH_REDDIT_POSTS.md` | Reddit launch copy | Posts for r/swimmingpools, r/poolsupplies, r/pools, r/poolservice |

---

## 6. AI Scanner — Technical Detail

**File:** `poolens/functions/api/scan.js`  
**Model:** `claude-haiku-4-5-20251001`  
**Endpoint:** `POST https://app.splashlens.com/api/scan`  

### Three Scan Modes

| Mode | What you send | What comes back |
|---|---|---|
| `error_code` | Photo of equipment error display | Brand, error code, name, 3 likely causes, 3 fix steps, severity, whether to call a pro |
| `parts_snap` | Photo of pool equipment or part | Part name, brand, part number if visible, what it does, where to buy |
| `test_strip` | Photo of chemical test strip | Estimated readings for FC, pH, TA, CYA with interpretation |

**CORS:** Exact-origin allowlist for `app.splashlens.com`, `splashlens.com`, `www.splashlens.com`, and `poolens.pages.dev`; localhost is dev-only.
**Cost:** ~$0.003–0.015 per scan (Haiku vision pricing, depends on image size).  
**Auth:** `ANTHROPIC_API_KEY` must be set as a CF Pages secret on the `poolens` project.
**Metering:** Production should bind `SCAN_USAGE_KV` for monthly anonymous scan limits and `SCAN_RATE_LIMITER` for burst protection. If production has neither binding, `/api/scan` fails closed instead of allowing unlimited anonymous calls.

---

## 7. Error Code Database — 15 Brands

File: `poolens/js/errors.js` — 978 lines, syntax validated.

| Brand Key | Label | Categories Covered |
|---|---|---|
| `hayward` | Hayward | H-Series Gas Heater (E01-E07, BD, SF, LO, HI), HeatPro Heat Pump |
| `pentair` | Pentair | MasterTemp/Max-E-Therm (E01-E07, BD, SF, LO, HI), UltraTemp Heat Pump, IntelliFlo VSF (PRIMING, ALARM 0001-0004) |
| `jandy` | Jandy / Zodiac | LXi/LRZ Gas Heater (E01-E05, SFS, AGS, SNSR), **JXi Gas Heater** (E01-E07, SFS, AGS, SNSR, LOC, HLS — full set added this session), VS FloPro Pump, **iAqualink Automation** (No Comms, Offline, Freeze Protection — added this session) |
| `maytronics` | Maytronics (Dolphin) | LED indicator patterns (no text display) |
| `aiper` | Aiper | Seagull series LED patterns |
| `raypak` | Raypak | Gas heater error codes |
| `beatbot` | Beatbot | AquaSense error patterns |
| `betta` | Betta (BWT) | SE/SE Pro skimmer robots |
| `polaris` | Polaris (Zodiac) | 280/380/9350/Alpha iQ |
| `intelliflo` | IntelliFlo (Pentair) | VSF/VS/VF (E00-E04, full ALARM series) |
| `hayward_swg` | **Hayward Salt (TurboCell / AquaRite)** | No Flow, Check Cell, Check Salt, High Salt, Cold Water, Low Output, Inspect Cell blinking — **added this session** |
| `pentair_automation` | **Pentair Automation (IntelliTouch / EasyTouch)** | Pump Comms, Heater Fault, IntelliChlor, Freeze Protection, Panel Offline, Valve Actuator, Display — **added this session** |
| `aquacal` | AquaCal | Heat pump error codes |
| `sta_rite` | Sta-Rite | Gas heaters, filters |
| `waterway` | Waterway | Pumps, filters |

---

## 8. Route Ready Training Product

**Landing page:** `splashlens.com/route-ready`  
**Curriculum doc:** `poolens-site/ROUTE_READY_CURRICULUM.md`  
**Email capture:** Working — stored in D1 `splashlens-subscribers`  

### Pricing (on landing page)

| Tier | Price | Seats |
|---|---|---|
| Individual | $29/mo or $199 lifetime | 1 tech |
| Team Starter | $99/mo | Up to 5 techs |
| Team Growth | $199/mo | Up to 15 techs |
| Company Unlimited | $399/mo | Unlimited + manager dashboard |
| **Launch offer** | **$99 lifetime** | First 50 individuals only |

### Build Sequence (per curriculum doc priority)

1. **Module 4 — Error Codes** — content is 90% in the app already; needs instructional framing + 3 assessment scenarios
2. **Module 5 — Weekly Route** — most requested by company owners
3. **Module 6 — SLAM** — high differentiation, showcases app
4. **Module 2 — Dosing Math** — ties to calculators
5. Modules 1, 3, 7, 8, 9, 10
6. Final exam + certificate = monetization trigger

### Not Yet Built

- Actual module content (any of it)
- Stripe integration
- Video/quiz layer
- Certificate generation

---

## 9. Marketing & Outreach — Status

### Gmail Drafts (ready at gmail.com → Drafts)

| Recipient | Address | Subject |
|---|---|---|
| Skimmer | `partnerships@skimmerpro.com` | Partnership idea — we built the field reference layer for your techs |
| Pool Brain | `info@poolbrain.com` | Your techs are looking up error codes somewhere — it might as well be here |
| Jobber | `partnerships@getjobber.com` | Partner opportunity — free offline tool for your pool service customers |
| PHTA | `membership@phta.org` | Free tech tool for PHTA member pool service companies |

**Send order:** Skimmer first (best fit). Follow-up rule: if no reply in 7 days, send one follow-up. Template in `PARTNERSHIP_OUTREACH.md`.

### Bing IndexNow
✅ All 304 URLs submitted 2026-05-24. HTTP 200 confirmed.

### Reddit
Posts pre-written in `LAUNCH_REDDIT_POSTS.md`. `automate_launch.py` pre-fills the form — you click Submit.

### Facebook (Biggest Untapped Channel)
"Pool Service Professionals" Facebook Group — 80K+ members, your exact customer. One authentic post showing the AI scanner beats all other channels. Not yet done.

---

## 10. Everything Done This Session — Chronological

### Session Part 1 (Compacted)

1. **Discovered PoolLens = SplashLens** — user confirmed ownership of splashlens.com already in CF (zone ID: `e1ceb4ea5691b9f30f30f738a3c7e251`). Prior project was called PoolLens internally.

2. **Full rebrand PoolLens → SplashLens** across all files:
   - `poolens/index.html` — bulk Python replace, all URLs + brand strings
   - `poolens/js/app.js` — brand strings + report header
   - `poolens/manifest.json` — name/description/theme rewritten
   - `poolens/sw.js` — cache key changed from `poolens-v6` → `splashlens-v1`
   - `poolens/functions/api/scan.js` — CORS updated to allow `app.splashlens.com`
   - `poolens/llms.txt` — full rewrite with SplashLens URLs
   - `poolens/robots.txt` — sitemap URL updated
   - `poolens-site/index.html` — all URLs + branding, og:image fixed (was broken `/og.png` → Unsplash pool photo)
   - `poolens-site/build_blog_index.py` — `SITE_URL = 'https://splashlens.com'`, nav/footer rebranded
   - `poolens-site/privacy.html` + `terms.html` — rebranded, contact email updated
   - `poolens-site/llms.txt` + `robots.txt` — URLs updated
   - **All 300 blog posts** — Python batch replace across every `.html` file in `blog/`: `poolens-site.pages.dev` → `splashlens.com`, `poolens.pages.dev` → `app.splashlens.com`, `PoolLens` → `SplashLens`, broken og:image → Unsplash URL
   - `poolens-site/blog/index.html` — additional bulk replace (15 instances), favicon link added, canonical added
   - `poolens-site/sitemap.xml` — regenerated by `build_blog_index.py` with 304 URLs all at splashlens.com

3. **New files created on marketing site:**
   - `poolens-site/404.html` — custom 404 with SplashLens branding
   - `poolens-site/_headers` — CF Pages security + cache headers (X-Frame-Options DENY, nosniff, Referrer-Policy, cache rules for blog/favicon/HTML)
   - `poolens-site/favicon.svg` — copied from app to marketing site root
   - `poolens-site/7480a549532eec74705e8f33ed2c168a.txt` — Bing IndexNow key file
   - `poolens-site/functions/api/subscribe.js` — CF Pages Function for email → D1
   - `poolens-site/route-ready.html` — full Route Ready landing page
   - `poolens-site/ROUTE_READY_CURRICULUM.md` — 10-module curriculum
   - `poolens-site/PARTNERSHIP_OUTREACH.md` — 4 outreach email scripts
   - `poolens-site/LAUNCH_REDDIT_POSTS.md` — 4 Reddit post variants

4. **D1 database created:**
   - Name: `splashlens-subscribers`, ID: `f474defb-4337-42ec-b143-7b37fc949761`
   - Table initialized: `CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, source TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
   - Bound to `poolens-site` project via CF API PATCH call (binding name: `SUBSCRIBERS_DB`)

5. **Route Ready email capture section** added to `poolens-site/index.html` — mailto CTA + styled section before footer

6. **CF Web Analytics beacon placeholder** comment added before `</body>` in `poolens-site/index.html`

7. **Dashboard updated:** SplashLens tab added to Flask command center at `C:/Users/sales/Dropbox/Projects/dashboard/templates/index.html` — KPIs, feature inventory, architecture, domain map, revenue model, 10 prioritized action items, 3-phase vision roadmap

8. **Domain migration attempts:**
   - Discovered `poolens.com` NOT in CF account (pivoted from that plan)
   - Removed domains from old `splashlens` CF Pages project via DELETE API
   - Added `splashlens.com` + `www.splashlens.com` to `poolens-site` project
   - Added `app.splashlens.com` to `poolens` project
   - Domains stuck at "CNAME record not set" — wrangler OAuth token has `zone:read` only, no `dns:write`
   - Cannot create DNS records programmatically — user manually added 3 CNAMEs in CF Dashboard

9. **Errors encountered in session:**
   - `poolens.com` not in CF account → pivoted to `splashlens.com`
   - `wrangler pages domain add` doesn't exist in wrangler 4.x → used REST API
   - CF DNS API returns error 10000 (auth) → token lacks `dns:write`
   - `wrangler api` command removed in wrangler 4.x
   - CF Pages domains stuck pending → user manually added CNAMEs
   - 522 errors during propagation → expected, resolved after DNS set
   - `app.splashlens.com` NXDOMAIN → resolved after CNAME added
   - OG image `/og.png` missing → replaced with Unsplash URL across all files
   - 300 blog posts still had old brand/URLs after initial index.html fix → Python batch replace on all `blog/*.html`
   - `wrangler d1 execute` requires `--remote` flag for cloud DB

### Session Part 2 (This Conversation)

10. **Deployed poolens-site** with all new files (Route Ready, subscribe function, IndexNow key, _headers, 404):
    - Deployment: `https://47f17d40.poolens-site.pages.dev`
    - 315 files uploaded, 2 new files

11. **IndexNow first attempt** — HTTP 403 `SiteVerificationNotCompleted` — blocked until DNS resolves

12. **Verified route-ready.html** — live at `/route-ready` (CF Pages strips .html extension). HTTP 200.

13. **Verified subscribe endpoint** — `POST /api/subscribe` returns `{"ok":true,"message":"You're on the list."}` — D1 write confirmed working.

14. **Token expired** — wrangler OAuth token expired at `2026-05-24T20:00:29.137Z`. Refreshed via `npx wrangler whoami`. New token: `4h8HwjP878zyllcu0-WQqEz43yfv2a2r1U40Gl8padE...`

15. **Domain re-verification** — deleted and re-added all 3 domains via CF API to trigger fresh verification. All 3 moved from `pending` → `active`. HTTP 200 confirmed on `splashlens.com` and `app.splashlens.com`.

16. **IndexNow submitted** — all 304 URLs to `https://api.indexnow.org/indexnow`. HTTP 200 confirmed.

17. **Error code expansion** — `poolens/js/errors.js` grew from 824 → 978 lines (13 → 15 brands):
    - **Added:** `hayward_swg` — Hayward AquaRite/TurboCell SWG (7 error conditions with full causes + fix)
    - **Added:** `pentair_automation` — Pentair IntelliTouch/EasyTouch (7 fault types)
    - **Added to jandy:** `JXi Gas Heater` category — 11 error codes (E01-E07, SFS, AGS, SNSR, LOC, HLS)
    - **Added to jandy:** `iAqualink Automation` category — 3 fault types
    - JS syntax validated (brace count balanced, node eval clean)

18. **Deployed updated poolens app:**
    - Deployment: `https://ad480466.poolens.pages.dev`
    - 1 new file uploaded (errors.js changed)

19. **Playwright automation script created** — `poolens-site/automate_launch.py`:
    - GSC sitemap submission
    - CF Web Analytics setup + token extraction
    - Reddit post pre-fill for r/swimmingpools + r/poolsupplies
    - First attempt used `launch_persistent_context` with Chrome profile — failed (Chrome blocks remote debugging on default user data dir — exit code 21, error: "DevTools remote debugging requires a non-default data directory")
    - Fixed: switched to `p.chromium.launch()` with Playwright's own Chromium
    - Browser confirmed running: window title "Google Search Console - Google Chrome for Testing"

20. **Gmail partnership drafts created** via Gmail MCP:
    - Skimmer draft ID: `r2564075746764011402`
    - Pool Brain draft ID: `r7995248885380353081`
    - Jobber draft ID: `r9174924737275391067`
    - PHTA draft ID: `r-6453432800730432408`
    - All 4 in Gmail Drafts, ready to send

21. **Git commits and pushes:**
    - `poolens`: committed 9 files (index.html, js/app.js, js/errors.js, manifest.json, sw.js, BUSINESS_CASE.md, functions/api/scan.js, llms.txt, robots.txt) → pushed to `github.com/throttleshare/poolens`
    - `poolens-site`: git init, committed 318 files (all blog posts, all new files) → new repo created `github.com/throttleshare/poolens-site` → pushed

---

## 11. Remaining Manual Steps

| Task | Where | What to do |
|---|---|---|
| **GSC sitemap submit** | search.google.com/search-console | Add property `https://splashlens.com/` → Sitemaps → submit `sitemap.xml` |
| **CF Web Analytics beacon** | dash.cloudflare.com → Web Analytics | Add `splashlens.com` → copy token → paste into `poolens-site/index.html` before `</body>` where the comment placeholder is → redeploy |
| **Send Gmail drafts** | gmail.com → Drafts | Review and send all 4 partnership emails. Skimmer first. |
| **Reddit posts** | Run `automate_launch.py` or copy from `LAUNCH_REDDIT_POSTS.md` | Script pre-fills form, you click Submit |
| **Facebook Groups** | facebook.com/groups/poolserviceprofessionals | 80K members. Authentic post, show AI scanner working. Biggest untapped channel. |
| **Brevo/Resend wiring** | — | Export D1 subscribers to email platform so you can actually send emails to the list. Query: `npx wrangler d1 execute splashlens-subscribers --remote --command "SELECT email FROM subscribers"` |
| **Stripe for Route Ready** | stripe.com | Create 4 products (Individual $199/mo, $29/mo; teams) before Module 1 ships. Wire to route-ready.html. |
| **Route Ready Module 4** | — | Build the first module. Error code content already exists in the app — needs instructional framing + 3 assessment scenarios. |

---

## 12. Next Bets (Priority Order)

1. **Facebook Groups** — "Pool Service Professionals" — 80K pool pros. Authentic post + AI scanner screen recording. This week.
2. **Route Ready Module 4** — Error codes content is 90% done. Ship it fast. The waitlist is growing with nothing to sell.
3. **Stripe** — wire payment before Module 1 ships. $99 founding member offer, hard cap 50.
4. **CF Web Analytics** — token takes 2 minutes to install. You're flying blind without it.
5. **Blog → App inline CTAs** — blog posts rank but don't convert. Every "Hayward E04" post needs an embedded lookup or deep link into the app. Zero engineering, just HTML edits.
6. **App Store / Play Store** — PWA install friction is high. A real app listing = discoverability. Wrap in Capacitor (already done for other projects in this portfolio).

---

## 13. Deploy Cheat Sheet

```bash
# Deploy the app
cd "C:/Users/sales/Dropbox/Projects/poolens"
npx wrangler pages deploy . --project-name poolens --commit-dirty=true

# Deploy the marketing site
cd "C:/Users/sales/Dropbox/Projects/poolens-site"
npx wrangler pages deploy . --project-name poolens-site --commit-dirty=true

# Regenerate sitemap + blog index after adding posts
cd "C:/Users/sales/Dropbox/Projects/poolens-site"
python build_blog_index.py

# Query subscriber emails
npx wrangler d1 execute splashlens-subscribers --remote --command "SELECT * FROM subscribers ORDER BY created_at DESC"

# Resubmit all URLs to Bing IndexNow (run after sitemap changes)
python -c "
import urllib.request, json, xml.etree.ElementTree as ET, urllib.error
with open('sitemap.xml') as f: tree = ET.parse(f)
ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [loc.text for loc in tree.getroot().findall('.//sm:loc', ns)]
payload = {'host':'splashlens.com','key':'7480a549532eec74705e8f33ed2c168a','keyLocation':'https://splashlens.com/7480a549532eec74705e8f33ed2c168a.txt','urlList':urls}
req = urllib.request.Request('https://api.indexnow.org/indexnow',json.dumps(payload).encode(),{'Content-Type':'application/json; charset=utf-8'},'POST')
with urllib.request.urlopen(req,timeout=30) as r: print(r.status)
"

# Run launch automation (GSC + CF Analytics + Reddit)
cd "C:/Users/sales/Dropbox/Projects/poolens-site"
"C:/Users/sales/AppData/Local/Programs/Python/Python311/python.exe" automate_launch.py

# Git commit + push both repos
cd "C:/Users/sales/Dropbox/Projects/poolens"
git add -A && git commit -m "your message" && git push origin master

cd "C:/Users/sales/Dropbox/Projects/poolens-site"
git add -A && git commit -m "your message" && git push origin master
```

---

## 14. Email & Contact

**SplashLens contact:** `hello@splashlens.com`  
**GitHub org:** `github.com/throttleshare`  
**CF account email:** `warmsnowman831@gmail.com`
