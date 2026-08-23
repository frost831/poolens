# SplashLens Store Wrapper Handoff

Updated: August 23, 2026

## Current App Target

- URL: `https://app.splashlens.com`
- Type: offline-first PWA
- Web monetization: free core tools plus optional paid/proof lanes where store policy allows
- Store wrapper mode: use `https://app.splashlens.com/?store=ios` or `https://app.splashlens.com/?store=android` so native app review sees a free-core build with no direct Stripe upgrade CTAs.
- Offline behavior: manual lookup, calculators, filter guides, checklists, reports, and cached app shell
- Online-only behavior: Error Scan, PartSnap, and Test Strip AI scanner

## Android Fast Path

Submit a Trusted Web Activity wrapper to Google Play around:

`https://app.splashlens.com/?store=android`

Suggested listing copy:

> SplashLens is a free-core field reference app for pool and spa techs. Use PartSnap to organize possible part paths, search pool and spa code references, calculate common doses, save service proof, capture voice notes, and build cleaner packets for senior techs, vendors, counters, or customer updates.

Short description:

> Pool/spa field app: PartSnap, codes, proof, dose math.

## iOS Fast Path

Use Capacitor or Median.co to wrap:

`https://app.splashlens.com/?store=ios`

Review framing:

- This is a utility/reference app for pool service professionals.
- Manual tools work offline after first load.
- AI camera scanning requires internet and is user-initiated.
- No account is required.
- Pool/customer data is stored locally on device browser storage.
- Store wrapper mode does not show direct Stripe checkout buttons. Keep it that way unless native IAP or approved external-link entitlement handling is added.

## Store Screenshot Checklist

Before final screenshots, run `docs/ASO_THUMBNAIL_GATE_2026-05-28.md` and save the competitor board, screenshot frame plan, metadata drafts, and claim-parity check under `aso/`.

Capture these screens on phone dimensions:

- Home/rescue screen: `Get off the pad faster`
- PartSnap result: `Identify the possible part path`
- Missing-proof packet: `Verify before ordering`
- Spa/swim-spa lane: `Pools, spas, and swim spas`
- Closing-season or Service Proof record: `Prove the stop`
- Error-code lookup: `Search codes across major pool brands`
- Dosing calculator: `Fast pool math in the field`
- Service note/voice note: `Write a clean service note`
- Optional feedback prompt: `Help shape the field tool`

## Known Launch Constraints

- Native store submission still needs Mac/Xcode or store-wrapper console access.
- App Store Connect and Google Play Console final actions cannot be completed from this Windows repo alone.
- If Apple asks about data collection, use the public privacy page: `https://splashlens.com/privacy.html`.
- If Google asks for data safety, declare local app data storage and user-submitted images for AI scanner processing. Email collection and Stripe checkout are on the web/marketing surfaces, not required inside the store wrapper.
- If paid unlimited AI is added inside the native app later, use Apple In-App Purchase / Google Play Billing or a policy-approved external purchase flow before exposing upgrade CTAs inside the store build.

## Current 1.0.8 Store Story

The 1.0.8 wrapper loads the same web runtime and includes quick scan feedback, Field Learning OS, PartSnap proof prompts, Service Proof records, Facility Assist, spa/swim-spa references, closing-season proof, and store-safe native shell routing. Feedback is optional and does not change the verification requirements above.
