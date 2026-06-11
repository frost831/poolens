# SplashLens — Business Case

> Current direction, May 2026: SplashLens is being treated as a free field-rescue app during pool season. The old paid-first PoolLens Pro / Learn assumptions below are legacy planning notes, not the active launch plan. Active priority is adoption: scan/search error codes, calculate doses, write service notes, and collect Route Ready pilot interest for free until real usage tells us what to monetize.
**Version 1.0 | May 2026 | Confidential — Founder Working Document**

---

## Current Truth Before Reading Legacy Sections

- SplashLens is the public brand. PoolLens is the source repo / earlier field-app name.
- Current public app: `https://app.splashlens.com`; fallback Pages host: `https://poolens.pages.dev`.
- Current public site: `https://splashlens.com`; fallback Pages host: `https://poolens-site.pages.dev`.
- Use `500+ error codes` in public-facing copy until the database count is automatically measured and updated.
- The online AI scanner is live, but production must keep server-side scan metering enabled. Do not rely only on browser localStorage limits.
- PartSnap Pro web checkout exists through Stripe Payment Links. Account-based paid entitlement is not production-grade yet.
- Route Ready is a planned training layer collecting free pilot interest. Do not describe certificates, verification, or completed modules as already built.
- Older PoolLens Pro / PoolLens Learn language below is legacy planning context, not the active launch claim.

---

## 1. Executive Summary

SplashLens is a free, offline-first Progressive Web App (PWA) for pool service technicians. It is a broad field reference tool: 500+ error codes across major equipment brands, full chemical dosing calculators, filter references, maintenance checklists, visit reporting, pool profiles, and route management - all usable with zero signal after first load.

The app is live at app.splashlens.com, with poolens.pages.dev as the Cloudflare Pages fallback. The marketing site is live at splashlens.com, with poolens-site.pages.dev as the fallback. No money has been spent on advertising. The product is distributing itself on brand authority and utility.

The business model is a four-tier stack built on top of a free product that will never be paywalled:

- **PartSnap** — camera-to-part-ID AI lookup with affiliate buy links and a $4.99/month unlimited tier
- **PoolLens Pro** — visit photo logging, customer PDF reports, multi-tech team accounts at $19.99/month
- **PoolLens Learn** — new technician training module licensed B2B at $49–299/employee or $299/year/company
- **Manufacturer API** — error code database licensing and white-label deals at $5K–25K/year per partner

Year 1 revenue target (at 5% conversion of 200,000 active US pool service techs): **$480,000 ARR.**

The moat is distribution: every free user is a future paid conversion opportunity, a referral source, and evidence of market dominance. No competitor offers offline-first access, the error code library, or the breadth of chemistry tools. PoolLens is built to be the tool every tech installs on day one — and the platform they pay for when their business grows.

---

## 2. Current Product State

### What's Built and Working (May 2026)

The app is a single-page PWA with 9 fully functional tabs. All features work offline via service worker cache. The app is installable from the browser on iOS and Android without going through an app store.

**Error Codes (Scan + Errors tabs)**
- 500+ fault codes across major brands: Hayward, Pentair (including IntelliFlo variable speed), Jandy, Maytronics/Dolphin, Aiper, Raypak, AquaCal, Sta-Rite, Waterway, Beatbot, Betta, Polaris, Zodiac
- Full-text search across all codes
- Live camera with frame capture and Web TextDetector OCR for code recognition
- Code Lookup returns manufacturer, fault description, diagnosis steps, and fix guidance

**Chemical Tools (Dosing + Volume tabs)**
- Dosing calculators for all 6 parameters: Free Chlorine, pH, Total Alkalinity, Calcium Hardness, CYA, Salt
- SLAM protocol calculator with full Treatment Plan Generator
- Drain/Refill and Turnover Rate calculators
- Salt Chlorinator Reference: all major brands, CYA recommendations, maintenance steps
- Chemical Safety Guide: never-mix combinations, PPE, handling rules
- Chemical Catalog: 31 products across 12 categories with generic names and store alternatives (Walmart, Sam's Club, Costco, Home Depot)

**Filters Tab**
- Sand filter: backwash guide, media sizing reference
- DE filter: charge calculator, grid inspection guide
- Cartridge filter: brand list, cleaning procedure, replacement guidance

**Guide Tab (Checklists)**
- Opening, Closing, Weekly, Monthly checklists — all fully detailed with steps and notes fields

**Report Tab**
- Visit Report generator
- Auto-fill from saved pool profiles
- Exportable/shareable report format

**Pools Tab**
- Pool profile storage: volume, shape, filter type, notes
- Chemistry history per pool

**Route Tab**
- Build a daily stop list
- Mark stops done with progress bar
- Day view for route planning

**Marketing Site**
- Full sales/showcase page: feature grid, competitor comparison table, AI scanner teaser, FAQ, testimonials
- 300 blog posts covering error codes, chemistry, equipment, and pool pro content — structured for SEO and answer engine optimization
- Legal pages, sitemap, robots.txt, full JSON-LD schema markup

**Infrastructure**
- Tech stack: Vanilla JS, no framework, no build step
- Hosting: Cloudflare Pages (zero egress cost, global CDN)
- PWA: service worker cache, offline-first, installable on iOS and Android

### What the Product Is Not (Yet)
- No native app store listing (Play Store / App Store) — currently browser-install only
- No backend/accounts — all data is local to the device
- AI vision calls are live online through `/api/scan`; production must keep `ANTHROPIC_API_KEY` and server-side metering configured.
- PartSnap Pro web checkout exists through Stripe Payment Links. Account-based paid entitlement is not production-grade yet; store wrappers must stay free-core unless native billing is added.
- No multi-device sync — pool profiles and routes live in localStorage only

---

## 3. Market Opportunity

### Industry Size

The US pool service and maintenance industry generates approximately **$7.5 billion per year** and is growing at ~5% annually. There are an estimated **200,000 active pool service technicians** in the United States, ranging from solo operators to employees of large regional chains like Leslie's and Blue Haven.

Key characteristics of the market:
- **Fragmented.** The vast majority of pool service companies are owner-operated with 1–5 techs. National chains account for roughly 15–20% of the market.
- **Seasonal in some regions, year-round in Sun Belt.** Florida, Texas, Arizona, California, and Nevada represent the highest density of year-round service techs.
- **Referral-driven, not software-driven.** Most techs share tools, apps, and shortcuts in Facebook Groups, Reddit (r/pools, r/poolmaintenance), and YouTube comment sections. Word-of-mouth product adoption is fast in this market.
- **Underserved by software.** Existing tools are either too expensive, too generic, or missing the field-first features techs actually need.

### Competitor Landscape

| Tool | Price | Error Codes | Offline | Chemistry Calcs | Field UX |
|---|---|---|---|---|---|
| **SplashLens** | Free | 500+ | Yes (SW cache) | Full suite | Yes |
| Skimmer | $1–2/pool/month | No | No | No | Partial |
| Pool Brain | $55/tech/month | No | No | Basic | Partial |
| Jobber | $69+/month | No | No | No | Generic |
| InspectorPro | $49/month | No | No | No | Inspection only |
| Pool Math (TFP) | Free (limited) | No | Partial | Yes | Consumer-focused |

**Analysis:**
- **Skimmer** is the most funded competitor ($74M raised, October 2024). It is a service management platform — scheduling, invoicing, CRM. It does not have error codes, offline mode, or a chemistry reference. It is not a field tool; it is an office tool. PoolLens and Skimmer can coexist and potentially integrate.
- **Pool Brain** has the most overlap on chemistry auto-dosing from readings. At $55/tech/month it is priced for established businesses, not solo techs or new hires. No error codes, no offline capability.
- **Jobber** is a horizontal service business platform. No pool-specific knowledge at all.
- **Pool Math (Trouble Free Pool)** is consumer-facing. Good chemistry calculator, but consumer UI, no error codes, no route/report features, and not designed for professional field use.

**The gap:** No competitor has all three of (1) error code library, (2) true offline operation, and (3) a free tier. PoolLens owns this intersection.

### Total Addressable Market (TAM)

| Segment | Users | Conversion Rate | Price | ARR |
|---|---|---|---|---|
| US pool service techs | 200,000 | 5% | $4.99–19.99/mo | $360K–$1.2M |
| Pool service companies (training) | ~50,000 companies | 0.2% | $299/year | $30K |
| Equipment manufacturers | 13 primary brands | 10% | $5K–25K/year | $6.5K–$32K |

**5-year ceiling at 15% conversion of the tech market:** ~$12M–15M ARR. This is a real business, not a rounding error.

---

## 4. Revenue Model

### Tier Structure

**Tier 1 — Free Forever (no paywall, no exceptions)**
- Everything currently built
- SLAM calculator, all chemistry tools, all error codes, filter reference, checklists, pool profiles, route management, visit reports
- This is the moat. Never charge for it. Any paywall on the core tool destroys distribution and trust.

**Tier 2 — PartSnap ($4.99/month or $39/year)**
- AI vision lookup: point camera at unknown part → get manufacturer, part number, compatible models, buy links
- Free users get 10 lookups/month (enough to evaluate, not enough to rely on)
- Paid users get unlimited lookups
- Affiliate revenue on buy links (Amazon Associates 3–5%, pool supply affiliates 4–8%)

**Tier 3 — PoolLens Pro ($19.99/month per tech, $199/year; first tech free, additional techs $9.99/month)**
- Visit photo logging with GPS + timestamp
- Customer-facing PDF report delivery via email
- Multi-tech team accounts with route assignment
- Chemical purchase history and usage analytics

**Tier 4 — PoolLens Learn (B2B)**
- Per-seat training: $49–99/employee trained (one-time)
- Company subscription: $299/year for unlimited employee seats
- Individual module: $9.99 one-time (CPO exam prep, SLAM deep dive, etc.)

**Tier 5 — Manufacturer API (Enterprise, negotiated)**
- Error code database licensing: $5,000–25,000/year per manufacturer
- White-label version of PoolLens for manufacturer service portals
- API integration for warranty claim systems

### 12-Month Revenue Projection

Assumptions: 200,000 US pool service techs, 5% overall adoption rate = 10,000 active users by month 12.

| Revenue Stream | Subscribers/Units | Monthly Rate | Annual Revenue |
|---|---|---|---|
| PartSnap Pro | 5,000 techs | $4.99/month | $299,400 |
| PoolLens Pro | 500 techs | $19.99/month | $119,940 |
| Training Licenses | 100 companies | $299/year | $29,900 |
| Affiliate Revenue | 1,000 orders/month | 5% × $50 avg order | $30,000 |
| **Total Year 1** | | | **$479,240** |

**Conservative scenario (2% conversion):** ~$192,000 ARR  
**Aggressive scenario (10% conversion):** ~$958,000 ARR

These projections require zero paid acquisition if organic distribution via the free tool works as modeled. The cost basis is almost entirely the AI API calls for PartSnap and hosting (near-zero on Cloudflare Pages).

### Unit Economics

**PartSnap Pro ($4.99/month):**
- AI cost per scan: $0.003–$0.015 (Claude Haiku)
- At 100 scans/month per paid user: $0.30–$1.50/month in API costs
- Gross margin: 70–94%
- Payback: Month 1

**PoolLens Pro ($19.99/month):**
- Infrastructure cost: <$0.10/user/month (Cloudflare storage, no backend yet)
- Once backend is built: estimate $1–2/user/month in compute
- Gross margin: ~85–90% at scale

**Training (B2B $299/year):**
- Content is fixed cost — already written (300 blog posts, all checklists)
- Incremental cost per seat: near-zero
- Gross margin: 95%+

---

## 5. Product Roadmap

### Q2 2026 — Foundation (Now → June 30)

**Must-do before any monetization:**
1. Deploy Cloudflare Worker at `/api/scan` (PartSnap backend)
2. Set up Anthropic API key in Cloudflare Worker environment
3. Build Stripe payment integration (PartSnap Pro checkout)
4. Add usage tracking for free-tier scan limits (10/month)
5. Submit to Google Play Store (PWA / TWA wrapper) for visibility
6. Submit to Apple App Store (PWA wrapper via Capacitor or similar)

**Nice-to-have Q2:**
- Google Analytics / Plausible for traffic and engagement data
- Email capture on marketing site (Mailchimp or SendGrid drip)
- Basic account system (email + password, localStorage sync backup)

### Q3 2026 — PartSnap Launch and Monetization

**PartSnap MVP:**
- `/api/scan` Worker live: mode=`parts_snap`, mode=`error_code`, mode=`test_strip`
- Part ID response: manufacturer, part number, description, compatible models, Amazon/PoolParts/PoolSupplyWorld links
- Stripe payment wall at scan limit
- Affiliate link tracking (Amazon Associates tag, pool supply affiliate codes)
- Free 10 scans/month enforced via localStorage + optional account

**Marketing push:**
- Product Hunt launch
- Pool service Facebook Groups seeding (Pool Chlorine Guy, Pool Care Network, etc.)
- Reddit r/pools and r/poolmaintenance organic posts
- YouTube tutorial: "How I identify unknown pool parts in 5 seconds"

### Q4 2026 — PoolLens Pro Beta

**Backend infrastructure (required for Pro):**
- Cloudflare D1 or Railway Postgres for user accounts and data sync
- Visit photo storage: Cloudflare R2 (S3-compatible, cheap)
- PDF report generator: Cloudflare Worker or Puppeteer
- Multi-user account model

**Features:**
- Visit photo upload with GPS timestamp and pool association
- PDF report generator: auto-fill from pool profile + photos + chemistry readings
- Email delivery of report to homeowner
- Team accounts: owner + techs, route assignment

**Pricing activation:** PoolLens Pro live in Stripe

### Q1 2027 — Training Module

**PoolLens Learn:**
- Apprentice Mode UI: simplified interface with "why" explanations
- Flash card system: 50 pool chemistry questions, spaced repetition
- CPO exam prep: multiple choice, timed, scored
- Completion tracking and downloadable certificate of completion (not CPO but useful for onboarding documentation)
- B2B checkout: company admin buys seats, assigns to employee accounts

### Q2 2027 — Manufacturer Outreach

- Package error code database as licensed API (JSON, authenticated, versioned)
- Build white-label demo using Hayward's error code subset
- Outreach to Hayward, Pentair service divisions with signed NDA + demo
- Target first deal at $10,000/year with 12-month term

---

## 6. AI Equipment Scanner — Technical Architecture and Business Case

### Current State

The Scan tab is live. Users can:
- Open a live camera feed
- Capture a frame
- Run Web TextDetector OCR for text recognition on the image
- Search the 500+ code database via full-text search

What's missing: the AI vision call. The frontend is wired. The backend does not exist yet.

### Architecture

```
[User taps "Identify This Part"]
    ↓
[Scan tab sends base64 image + mode to /api/scan]
    ↓
[Cloudflare Worker]
    - Validates auth token (free tier: count check; paid: pass through)
    - Builds Anthropic API prompt based on mode
    - Calls Claude claude-haiku-4-5 Vision API (cheapest, fast, sufficient)
    - Returns structured JSON response
    ↓
[Frontend renders result]
    - Part ID: manufacturer / part number / compatible models / buy links
    - Error code: fault code / diagnosis / fix steps / severity
    - Test strip: chemical readings / dosing recommendations
```

**Cloudflare Worker Environment Variables Required:**
- `ANTHROPIC_API_KEY` — Anthropic API key
- `STRIPE_SECRET_KEY` — for subscription status validation
- `AFFILIATE_TAG_AMAZON` — Amazon Associates tag
- `AFFILIATE_CODES` — pool supply affiliate codes JSON

### Prompt Engineering by Mode

**mode: `parts_snap`**
```
You are a pool equipment parts expert. The user has photographed an unknown pool part or component.
Identify:
1. Manufacturer (if visible from markings, shape, color coding)
2. Part type (impeller, O-ring, seal, valve, fitting, pump lid, etc.)
3. Part number or model range (if readable or inferrable)
4. Compatible equipment models
5. Estimated dimensions if relevant

Respond in JSON:
{
  "manufacturer": "",
  "part_type": "",
  "part_number": "",
  "compatible_models": [],
  "description": "",
  "confidence": "high|medium|low",
  "buy_links": {
    "amazon_search": "",
    "poolparts_search": "",
    "poolsupplyworld_search": ""
  }
}
```

**mode: `error_code`**
```
You are a pool equipment technician. The user has photographed a control panel or display showing an error/fault code.
Identify the fault code text visible on the screen.
Cross-reference against known pool equipment error codes.
Return diagnosis and recommended action.

Respond in JSON:
{
  "code": "",
  "manufacturer": "",
  "description": "",
  "severity": "info|warning|fault|critical",
  "likely_cause": "",
  "recommended_action": "",
  "confidence": "high|medium|low"
}
```

**mode: `test_strip`**
```
You are a pool chemistry expert. The user has photographed a test strip against a color reference chart.
Read the color values visible on the strip.
Return estimated chemical readings.

Respond in JSON:
{
  "fc": null,
  "ph": null,
  "ta": null,
  "ch": null,
  "cya": null,
  "confidence": "high|medium|low",
  "note": ""
}
```

### Cost Model

| Scenario | Scans/Month | Claude Haiku Cost | Monthly API Spend |
|---|---|---|---|
| Early (1,000 free users) | 10,000 | $0.015/scan max | $150 |
| Growth (10,000 users) | 50,000 | $0.015/scan max | $750 |
| Scale (50,000 users) | 150,000 | $0.015/scan max | $2,250 |

At 5,000 PartSnap Pro subscribers ($4.99/month = $24,950/month revenue), API costs at scale ($2,250/month) represent a 9% cost-of-goods. That's an acceptable COGS for a 91% gross margin SaaS product.

Free tier (10 scans/month) is economically defensible. At 10,000 free users × 10 scans = 100,000 scans/month max = $1,500/month in API costs, offset by affiliate revenue and conversion to paid.

### Business Case

PartSnap is the feature no competitor is building. Skimmer doesn't have it. Pool Brain doesn't have it. The incumbents are not thinking about this problem. The window to own "AI part identification for pool service techs" is now, while the AI vision API costs are low enough to make it economically viable.

The affiliate revenue alone can partially offset the API cost. A tech identifies an impeller, clicks the Amazon link, buys a $45 part. At 5% commission that's $2.25. At 1,000 orders/month that's $2,250/month — covering a significant portion of API costs even before subscription revenue.

**What has to happen before PartSnap monetizes:**
1. Cloudflare Worker deployed at `/api/scan`
2. Anthropic API key provisioned and set as a secret in Cloudflare
3. Stripe integration live with PartSnap Pro product ($4.99/month or $39/year)
4. Amazon Associates account approved and tag embedded in buy links
5. Pool supply affiliate programs applied to: PoolParts.com, PoolSupplyWorld, InTheSwim
6. Frontend scan limit enforcement (localStorage counter for free users)
7. App Store listing (Play Store at minimum) for discoverability — browser-install-only limits organic reach

---

## 7. New Tech Training — Market Gap Analysis and Proposed Feature

### The Problem

Pool service is a skilled trade. A new tech needs to understand:
- Water chemistry (6 parameters, interactions, dosing math)
- Equipment operation (pumps, filters, heaters, salt systems, automation)
- Fault diagnosis (error codes, equipment failure modes)
- Chemical safety (never-mix rules, PPE, storage)
- Route management and customer communication

There is no affordable, mobile-first, practical training resource for this. The options today:

| Resource | Cost | Format | Practical? |
|---|---|---|---|
| CPO Certification (NSPF) | $200–400 | 2-day classroom | Partial |
| YouTube (Orenda, TFP, etc.) | Free | Unstructured video | No curriculum |
| Manufacturer training | Free | Brand-specific only | No |
| On-the-job | Variable | Inconsistent | Yes, but expensive |
| PoolLens Learn (proposed) | $9.99–299 | Mobile, structured | Yes |

**The cost of a bad hire:** A solo tech who doesn't understand chemistry or equipment faults generates $500–2,000 in callbacks, chemical errors, and equipment damage in their first 60 days. A training tool that cuts that risk by 50% is worth $500–1,000 to a pool service company owner. At $299/year for unlimited seats, this is a dramatically underpriced solution.

### Market Size for Training

- ~50,000 pool service companies in the US
- Average 3–5 new hires per year at the 1–10 tech company level
- Target: companies with 3–20 techs who lack formal training infrastructure
- Realistic addressable market: 20,000 companies × $299/year = **$6M TAM**

Year 1 target: 100 company subscriptions ($29,900). Requires zero new content beyond what's already built in the app.

### Proposed Feature Architecture

**Apprentice Mode (in-app)**
- Toggle in settings: "I'm new to pool service"
- Simplifies UI: hides advanced features, surfaces guided checklists
- Each checklist step includes a "Why?" button with plain-English explanation
- Progress tracking: completed visits, checklists run, error codes looked up

**Flash Card System**
- 50 pool chemistry questions (FC relationships, pH effects, CYA math, etc.)
- Spaced repetition: cards resurface based on answer accuracy
- Topics: chemistry, equipment, safety, route management
- No new content needed — draw from the existing 300 blog posts

**CPO Exam Prep Module**
- Multiple choice questions mapped to NSPF CPO exam outline
- Timed practice tests
- Score tracking
- Pricing: $9.99 one-time unlock

**B2B Company Dashboard**
- Admin creates company account
- Invites employees via link or email
- Tracks: who completed what, quiz scores, time in app
- Completion certificate: PDF with employee name, company, date, modules completed
- This is the feature that justifies the B2B licensing price

**Content Sources (no new writing required)**
- Chemistry content: already built in Dosing, Volume, and Guide tabs
- Equipment content: already in Error Codes and Filter tabs
- Safety content: already in Chemical Safety Guide
- Quiz questions: already in 300 blog posts — extract and structure

### Go-To-Market for Training

**B2B angle:** Target pool service company owners (not techs) via:
- Facebook Groups for pool business owners (different from tech groups)
- Direct outreach to companies with 3–20 employees in Sun Belt states
- Pitch: "PoolLens Learn cuts your new tech onboarding from 60 days to 7 days. $299/year for your whole team."

**B2C angle:** Individual techs who want to learn or prep for CPO:
- $9.99 CPO prep module sold via App Store in-app purchase
- Organic discovery via existing blog posts on CPO certification

---

## 8. Go-to-Market Strategy

### Current Distribution (What's Working Without Effort)

The free product is the distribution mechanism. Every tech who installs PoolLens and finds it useful will:
1. Tell other techs in their network or company
2. Post about it in pool service Facebook Groups
3. Leave it installed because switching cost increases with each pool profile added

The 300 blog posts create SEO and AEO surface area. When a tech Googles "Hayward F1 error code" or "pool DE filter charge calculator" and finds a PoolLens blog post that links to the app, they install it. This is the content flywheel.

### Near-Term GTM (Q2–Q3 2026)

**Step 1: App Store Presence**
The single highest-leverage action that's not done. Browser-install only limits discovery. Google Play Store (TWA/PWA wrapper) and Apple App Store (Capacitor or similar) expand surface area to app store search, which is how many service techs discover tools.

- Play Store submission: 1 week of work
- App Store submission: 2–4 weeks (Apple review process)
- Required for any B2B pitch ("it's on the App Store" signals legitimacy)

**Step 2: Seed Facebook Groups**
- Target groups: "Pool Pros Unlimited," "Pool Service Professionals," "Pool Care Network," "Pool Guys & Gals"
- Post approach: genuine value share, not promotional. "Built this free offline error code lookup tool, figured it'd be useful for service calls." Let the comments do the marketing.
- One well-placed post in a 50K member pool pro group can drive 1,000+ installs in a week

**Step 3: Reddit**
- r/pools (750K+ members), r/poolmaintenance, r/poolservice
- Post the free tool with a specific use case: "No cell signal in equipment rooms? This works offline."
- Respond to error code threads with the PoolLens blog post as the answer

**Step 4: Product Hunt Launch**
- Time for Q3 2026 when PartSnap is live — this is the differentiating feature worth launching around
- "The AI that identifies unknown pool parts from a photo" is a strong product hook
- Target #1 product of the day in the Tools category

**Step 5: YouTube**
- Create a 3-minute demo video: install the PWA, look up an error code, use the dosing calculator, identify a part with PartSnap
- Upload to YouTube with keyword-optimized title and description
- This video becomes the top-of-funnel for every tech who searches for pool service tools on YouTube

**Step 6: Partnership Outreach**
- **Pool supply distributors** (SCP, Horizon, Pool Corporation regional): they train techs and would embed a PoolLens download QR code in their training materials
- **Manufacturers** (Hayward, Pentair training departments): "Use PoolLens during service certification courses"
- **Pool service franchises** (Pinch A Penny, The Pool Guy, etc.): white-label Pro tier for their franchise techs

### Long-Term GTM (2027+)

- **Skimmer integration:** Export PoolLens visit reports into Skimmer. They have an API. This turns PoolLens into a field companion to Skimmer's office tool — and PoolLens gets in front of Skimmer's entire user base.
- **Manufacturer distribution:** Hayward or Pentair embeds PoolLens QR code in equipment packaging or installer documentation. Every new equipment install = one more PoolLens user.
- **Pool Builder partnerships:** New pool installs come with a "Pool Service Starter Kit" that includes a PoolLens install card.

---

## 9. Risks and Mitigations

### Risk 1: Free Tier Cannibalizes Paid Conversion
**Concern:** If the free tool is so complete that techs never feel the need to upgrade, paid conversion stays at 0%.  
**Mitigation:** PartSnap is genuinely addictive once the AI lookup habit forms. The 10 scan/month free limit creates natural conversion pressure without frustrating casual users. Route this through real usage data — if free users are hitting the scan limit, they'll convert. Monitor scan usage before adjusting the limit.

### Risk 2: Anthropic API Costs Spike
**Concern:** Claude Vision API pricing increases, or usage scales faster than revenue, compressing margins.  
**Mitigation:** Claude Haiku is the cheapest tier and sufficient for this use case. Rate limiting is the primary lever — tighten the free tier if costs become material. At current pricing ($0.015/scan max), the math works at scale. If Anthropic raises prices 5x, revisit with open-source vision models hosted on Cloudflare Workers AI.

### Risk 3: Skimmer or Pool Brain Copies the Error Code Library
**Concern:** A funded competitor with 100 engineers copies the 600-code database in a sprint.  
**Mitigation:** The database is a moat component but not the only one. The moat is the combination of free + offline + error codes + calculators + the trust built from being the free tool. Funded competitors move slowly into free tiers because it conflicts with their board's growth metrics. First-mover advantage on offline-first field tools in this niche is real.

### Risk 4: App Store Rejection or Removal
**Concern:** Apple or Google rejects the app or removes it for policy reasons.  
**Mitigation:** PoolLens is a PWA — it doesn't need the app store to function. The app store listing is distribution, not survival. If rejected, the browser-install path continues to work. The native app wrapper is a thin shell; core functionality is entirely in the PWA.

### Risk 5: B2B Training Market Doesn't Buy
**Concern:** Pool service company owners are cost-sensitive and skeptical of software. $299/year doesn't get budget approval.  
**Mitigation:** Lead with the free individual install. Once the owner's techs are already using PoolLens for free, the upgrade pitch is: "Your techs already use this every day — now get the training dashboard and onboarding tools." This is expansion revenue from an existing relationship, not cold acquisition.

### Risk 6: Manufacturer Deals Take Too Long
**Concern:** Enterprise deals at $5K–25K/year have 6–18 month sales cycles and require legal review.  
**Mitigation:** Manufacturer deals are a bonus revenue layer, not a survival requirement. Year 1 does not need them. Build the relationship with Hayward/Pentair training departments now through product presence (techs using PoolLens recommend it to their manufacturer contacts) and cold outreach starting Q4 2026. Close the first deal in 2027.

### Risk 7: Data Loss — No Cloud Backup for Free Tier
**Concern:** A tech loses their phone and loses all pool profiles, chemistry history, and routes.  
**Mitigation:** This is a real UX risk. Short-term: add a "Export All Data" JSON download button (2 hours of work). This gives users control without requiring backend infrastructure. When PoolLens Pro launches with cloud sync, data persistence becomes a paid upgrade hook, not a crisis.

---

## 10. 90-Day Action Plan

### Month 1 (June 2026) — Monetization Infrastructure

| Priority | Task | Est. Effort |
|---|---|---|
| P0 | Deploy Cloudflare Worker at `/api/scan` | 2 days |
| P0 | Provision Anthropic API key + add to Worker env | 1 hour |
| P0 | Integrate Stripe: PartSnap Pro product ($4.99/mo, $39/yr) | 2 days |
| P0 | Build free scan limit tracking (localStorage counter) | 1 day |
| P1 | Submit to Google Play Store (TWA wrapper) | 1 week |
| P1 | Apply for Amazon Associates and pool supply affiliate programs | 2 hours |
| P1 | Build PartSnap frontend: mode selector, result rendering, buy link display | 3 days |
| P2 | Add email capture to marketing site (SendGrid) | 1 day |
| P2 | Set up Plausible or GA4 for traffic analytics | 2 hours |

**Month 1 exit criteria:** PartSnap is live and functional. Stripe checkout works. Play Store listing submitted.

### Month 2 (July 2026) — Launch and Seed

| Priority | Task | Est. Effort |
|---|---|---|
| P0 | Submit to Apple App Store | 1 week + review time |
| P0 | Seed PartSnap in 5 major pool service Facebook Groups | 2 hours |
| P0 | Post on r/pools and r/poolmaintenance | 1 hour |
| P1 | Create YouTube demo video (PartSnap + error lookup + dosing calc) | 2 days |
| P1 | Tune PartSnap prompts based on real usage edge cases | Ongoing |
| P1 | Monitor Stripe for first paid conversions, collect feedback | Ongoing |
| P2 | Plan Product Hunt launch for Month 3 | 1 week of prep |
| P2 | Draft outreach to 3 pool supply distributors (SCP, Horizon, PoolCorp) | 1 day |

**Month 2 exit criteria:** App Store submissions live or in review. PartSnap has real users. First paid subscribers on Stripe.

### Month 3 (August 2026) — Revenue and Product Feedback Loop

| Priority | Task | Est. Effort |
|---|---|---|
| P0 | Product Hunt launch | Launch day + follow-up week |
| P0 | Measure PartSnap conversion rate (free → paid). Target: 5% | Analytics review |
| P0 | If conversion <3%, adjust free limit or pricing | Iteration |
| P1 | Begin PoolLens Pro scoping (backend architecture, Cloudflare D1 or Railway) | 1 week |
| P1 | Interview 10 paid PartSnap users: what else do they want? | 5 hours |
| P1 | Begin B2B training outreach to 20 pool service company owners | 1 week |
| P2 | Review affiliate revenue: are links being clicked? | Analytics |
| P2 | Add "Export Data" JSON download button (free tier data safety) | 2 hours |

**Month 3 exit criteria:** PartSnap has measurable paid conversion. Product Hunt launched. PoolLens Pro is scoped. First B2B training conversations in progress.

---

## Appendix A — Key URLs and Resources

| Resource | URL |
|---|---|
| App (PWA) | poolens.pages.dev |
| Marketing Site | poolens-site.pages.dev |
| Cloudflare Pages Dashboard | dash.cloudflare.com |
| Anthropic API Docs | docs.anthropic.com |
| Claude Vision Reference | docs.anthropic.com/en/docs/build-with-claude/vision |
| Amazon Associates | affiliate-program.amazon.com |
| PoolParts.com Affiliate | poolparts.com/affiliate |
| PoolSupplyWorld Affiliate | poolsupplyworld.com/affiliate |

## Appendix B — Immediate Technical Checklist (Before PartSnap Can Go Live)

- [ ] Cloudflare Worker created and deployed at poolens.pages.dev/api/scan
- [ ] `ANTHROPIC_API_KEY` added as a Cloudflare Worker secret
- [ ] Stripe account created, PartSnap Pro product configured
- [ ] `STRIPE_SECRET_KEY` added as a Cloudflare Worker secret (for subscription validation)
- [ ] Frontend scan tab updated: sends base64 image + mode to /api/scan, renders JSON response
- [ ] localStorage scan counter implemented (key: `pl_scans_month`, resets on month rollover)
- [ ] Scan limit modal: "You've used 10 of 10 free scans this month. Upgrade to PartSnap Pro for unlimited."
- [ ] Stripe checkout link embedded in upgrade modal
- [ ] Amazon Associates account approved (can take 1–7 days)
- [ ] Buy links formatted with affiliate tag: `amazon.com/s?k=pentair+impeller+79301800&tag=YOUR_TAG`
- [ ] Google Play Store listing submitted (TWA wrapper around poolens.pages.dev)
- [ ] Apple App Store listing submitted (Capacitor or Median.co wrapper)

---

*Document maintained by: Frost | Last updated: May 2026 | Next review: September 2026*
