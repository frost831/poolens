# SplashLens Claim Parity Check

## PC-G-08 draft gate (2026-10-09)

- `2026-10-growth-listing-drafts.md` is draft copy only. It is not a native build, Console edit, approval, or live listing.
- Manual reference and calculators may work after first load; PartSnap photo assistance and sharing can require network or device capabilities. No universal offline claim.
- PartSnap is a possible match with missing-proof prompts, not a confirmed part fit or guaranteed diagnosis. Verify nameplate/model/manual and qualified field judgment.
- Counter mode and closing checklist are in the app. Do not assert a count of bundled error codes or complete Spanish UI coverage without a separate release audit.
- No price, in-app-purchase wording, competitor app names, manufacturer endorsement, or web-purchase CTA in the draft fields.
- **HOLD: native Spanish review** of es-MX and es-419 copy, feature terminology, and actual native-shell language experience before Mac submits either listing. Mac/Joshua also verify current storefront policy and native behavior before release.
- Run `node tools/aso-length-check.mjs` and `node --test tests/aso-length-check.test.mjs` on this worktree. Count validation is not product or policy approval.

Generated: 2026-05-28

Allowed:
- Pool equipment-pad field tools
- Calculator/reference workflows
- Field notes
- Optional scanner assistance with verification
- Offline/manual utility after first load
- FreeCore app with 3 PartSnap app scans a month
- Splash Lens Pro Unlimited as a paid scanner-capacity and saved-job-memory lane

Blocked:
- Unqualified free/native unlimited scanning claims
- Manufacturer endorsement
- Guaranteed diagnosis or repair
- Paid native unlocks without IAP/entitlements
- Completed certificate or training claims

Local build check:
`xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -destination 'generic/platform=iOS' build` passed for `com.splashlens.app` `1.0 (7)`.
