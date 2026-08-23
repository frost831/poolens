# SplashLens One-Sprint Delivery Report - 2026-06-22

## What Shipped

This sprint turns the wishlist into a live app surface centered on getting the pool tech off the pad faster with better proof.

### Route Brain

Live in the Route tab.

- Equipment tree intake: pool, manufacturer/system, hardware, model/line, visible label/photo proof, symptom, checks completed, confidence level.
- Symptom quick picks: lighting, automation, robots, ORP/pH, covers, heaters, flow, pump priming.
- Field plan builder: recommended next checks, customer-safe summary, reference matches, and callback risk.
- Senior tech escalation packet: one-tap copy with pool, system, symptom, checks already done, next checks, matches, risk, and customer-safe summary.
- Save proof to pool history: saves Route Brain output as a Service Proof Passport and appends the equipment tree to the pool profile.
- Training Session Mode: generates an instructor-ready scenario, student task, answer key, and safety note.
- Quick Quote Prep: copies a concise office/owner recommendation packet.
- What Changed Since Last Visit: compares selected pool history/service passports where available.
- Manufacturer Learning Pages: hardware families, models, symptoms/causes, first checks, and call-pro posture from the database.

### PartSnap Confidence Ladder

- Adds levels: visible marking, likely family, possible, unknown.
- Holds buying/search links until there is enough visible evidence.
- Asks for missing proof such as part number, manufacturer, equipment model, or component name.

### Expanded Troubleshooting Corpus

The app now presents 230+ current troubleshooting entries across 21 brand/system groups and 40 categories, including:

- Lighting
- Home/pool automation
- Robots
- Water features
- Valves/actuators
- UV/ozone/AOP
- Chemical feeders/controllers
- Automatic covers
- Existing heaters, heat pumps, pumps, filters, salt, and robotic cleaner entries

### Partner Positioning

Marketing site now has a partner page:

- Education/CPO/training route
- Manufacturer/product-team route
- Media/podcast/publication route
- Sponsored-placement positioning with clear disclosure guardrails
- Contact path through hello@splashlens.com

## Coming Soon Gates

These are now visible/positioned but intentionally gated:

- Live photo-to-equipment-tree AI
- Manufacturer sponsored result banners
- Instructor-shared lessons and partner training modules
- Team sync / multi-tech handoff
- Native iOS speech cleanup beyond webview/browser support

## Self-Healing / QA

- Route Brain initially produced a weak match for "light trips GFCI"; matching was improved to search symptom, hardware+symptom, model, hardware, full query, and useful symptom tokens.
- Route Brain then over-included one unrelated electrical pump match; ranking and hardware-focused trimming were added.
- Final smoke confirmed the GFCI lighting test shows relevant GFCI lighting matches with no "no confident match" fallback.

## Verification

- `node --check js/app.js`
- `node --check js/errors.js`
- JSON parse for `manifest.json`
- JSON parse for Android TWA web manifest
- Playwright mobile smoke for Route Brain
- Playwright mobile smoke for partner page
- Marketing site JSON-LD parse

Evidence screenshots:

- `docs/route-brain-mobile-smoke.png`
- `poolens-site/docs/outreach/splashlens-partners-mobile-smoke.png`

## Positioning

SplashLens should now be described as:

> A pool-tech field rescue app that helps techs build faster troubleshooting plans, document proof, escalate cleaner, and get more of the day back.

Keep these guardrails:

- Reference assistance only.
- No guaranteed diagnosis.
- No implied manufacturer endorsement.
- No certification/training completion claims unless a real partner program exists.
- Sponsored placements must be labeled.
