# Aquatic Council Light Mode Product Plan - 2026-07-09

## What Tim Was Really Saying

Tim is not asking for the current service-tech app to be less capable. He is describing a different user:

- CPOs, facility managers, swim-school staff, apartment managers, medical-facility operators, and maintenance staff.
- They are responsible for the pool, but they are not always the person breaking down pumps, diagnosing boards, or replacing equipment.
- Their questions are often urgent, procedural, and standards-oriented: chemical dosing, basic pump/motor checks, contamination events, code/standard questions, and when to call a qualified expert.
- Aquatic Council's old retainer model worked because expert human support had value, but it failed adoption because it was invisible. Staff forgot it existed.

The opportunity is a tangible app/QR/wizard layer that makes the retainer support service visible at the exact moment of need.

## Product Thesis

Do not build a separate app first. Build a role-based front door on SplashLens:

- Service Tech Mode: current full SplashLens depth.
- CPO / Facility Mode: light guided workflows, fewer choices, more "what do I do right now?" language.
- Trainer / Support Mode: pilot/admin layer for call-log-informed content, client equipment packages, and escalation tracking.

This lets SplashLens be the tangible piece Tim wanted without duplicating the existing platform.

## Light Mode First Screen

The first screen for a CPO/facility user should ask:

1. What are you trying to handle?
2. Is this chemical, equipment, contamination, documentation, or escalation?
3. Do you need to calculate, document, identify, or call?

The initial lane set:

- Daily Pool Check
- Chemical Dose
- Vomit / Fecal / Contamination Event
- Pump or Motor Not Right
- Find Manual / Equipment
- Call Qualified Support

## Pilot-In-A-Box

For Goldfish, Edward Rose, Evergrove, or a similar pilot, the sellable package is:

- App landing URL with client/facility query params.
- Waterproof QR stickers for pump room, controller, heater, filter, chemical room, and staff desk.
- Facility equipment package: known pumps, filters, heaters, controllers, sanitizer systems, and manuals.
- Light workflows from Tim's call-log categories.
- Click-to-call / click-to-message support route.
- Owner/admin dashboard showing adoption, scans, guided workflows opened, escalations, and repeated issues.

## Call Log Ingestion

If Tim can share call logs under NDA, process them into:

- Top 25 call reasons.
- Top 10 seasonal issues.
- Top equipment families.
- Top code/standard questions.
- Top "call expert now" situations.
- Suggested in-app answer cards with conservative wording.

No client-identifiable data should be stored in public app content.

## Six-Month Pilot Definition

Suggested pilot:

- 10 facilities.
- No-cost or low-cost validation period.
- QR codes installed at each facility.
- Facility package preloaded.
- Weekly health check workflow.
- Call support CTA.
- Monthly usage report.

Success signals:

- Staff use QR/app before calling.
- Calls become better documented.
- Fewer avoidable service calls.
- Faster escalation when an issue is above CPO scope.
- Client can see usage/adoption, not just "we have a phone number."

## Positioning For Tim

"SplashLens can become the tangible front door for your support agreement. The app handles the first 60 seconds: identify the situation, guide the CPO through safe first checks, document what happened, and route them to your human experts when the issue is above their scope."

