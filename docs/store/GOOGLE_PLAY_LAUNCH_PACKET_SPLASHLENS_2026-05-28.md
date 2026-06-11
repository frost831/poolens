# SplashLens Google Play Launch Packet - 2026-05-28

Scope: Google Play launch packet for the current SplashLens pool-service field app only. App Store Connect approval is treated as background context; this packet does not change the Apple lane.

## Source Of Truth

- Active app repo: `github-projects/poolens`
- Public site repo: `github-projects/poolens-site`
- Current app URL for Play wrapper: `https://app.splashlens.com/?store=android`
- Marketing URL: `https://splashlens.com`
- Privacy URL: `https://splashlens.com/privacy.html`
- Support URL: `https://splashlens.com`
- Current product promise: free-core field reference app for pool service technicians. Search equipment error codes, calculate chemical doses, create service notes, use filter/checklist references, and optionally use online scanner workflows for displays, parts, and test strips.
- Important legacy warning: `github-projects/splashlens` contains an older Unity AR pool-visualizer/dealer-sales concept. Do not use that AR/dealer copy, screenshots, or build lane for the current pool-tech PWA/scanner Play launch.

## Android Package And Artifact Status

Package/app ID status:

- Current field-app Android package ID: not discoverable from an active Android/TWA source project in `poolens`.
- Apple/iOS bundle ID already used in ASC: `com.splashlens.app`.
- Legacy Unity AR Android identifier in `splashlens/app/ProjectSettings/ProjectSettings.asset`: `com.splashlens.app`.
- Recommended Play package if creating a new current-field-app TWA and the package is available/owned in Play Console: `com.splashlens.app`.
- Alternative only if the owner wants a new Below Zero Media namespace and can create/own the Play app record: `com.belowzeromedia.splashlens`.

Artifact verification:

- Current field-app Android/TWA wrapper now exists under `android-twa`.
- Release bundle build passed on Windows with `cmd /c gradlew.bat bundleRelease`.
- Unsigned build output: `android-twa/app/build/outputs/bundle/release/app-release.aab`.
- Signed Play upload candidate: `play-store-artifacts/SplashLens-Field-Tools-1.0.0-v1-signed.aab`.
- Upload key is intentionally stored outside Git at `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`.
- Upload-key SHA-256 fingerprint: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`.
- Web asset link file added at `.well-known/assetlinks.json` for the upload-key fingerprint.
- PWA manifest now includes PNG 192, PNG 512, and maskable 512 icons.

Launch verdict: Play metadata and a signed AAB are now ready for Play Console creation/upload. After Play Console enables Google Play App Signing, add Google's App Signing certificate SHA-256 to `.well-known/assetlinks.json` alongside the upload key and redeploy before production rollout.

## Play Store Metadata

Title, 30-character limit:

SplashLens Field Tools

Short description, 80-character limit:

Pool tech codes, dosing, service notes, and scanner assistance.

Full description:

SplashLens is a free field reference app for pool service technicians who need fast answers at the equipment pad.

Use SplashLens to search pool equipment error codes, estimate chemical doses from values you enter, draft service notes, review filter and maintenance checklists, and use optional online scanner workflows for equipment displays, pool parts, and test strips.

Core tools are free and do not require an account. Manual lookup, calculators, notes, filters, and checklists are designed for field use and can work from the app shell after first load. Online scanner features require internet access and are user-initiated.

What SplashLens helps with:

- Equipment error-code lookup and field reference
- Chemical dosing calculators based on user-entered readings
- Service notes and visit-report drafting
- Filter guides, maintenance checklists, and poolside references
- Optional online scanner assistance for displays, parts, and test strips

Important field-use note:

SplashLens provides reference assistance only. AI scanner output must be verified against equipment manuals, calibrated testing, label directions, SDS information where applicable, and professional field judgment. SplashLens does not guarantee diagnosis, repair, chemical safety, manufacturer support, or training certification.

## Policy-Safe Claims

Allowed claims for this Play launch:

- Free pool-service field reference app.
- No account required for core use.
- Manual tools can work offline after first load.
- Error-code lookup and reference workflows.
- Chemical dosing calculators based on user-entered data.
- Service-note and report drafting.
- Filter guides, maintenance checklists, SLAM/salt/chlorinator reference tools where visible in the app.
- Optional online scanner assistance for equipment displays, parts, and test strips.
- Scanner output is assistance only and requires verification.

Avoid these claims until the app actually supports them in the submitted native build:

- Guaranteed diagnosis, repair, or chemical safety.
- Official manufacturer support, endorsement, or certification.
- Replacing calibrated testing, equipment manuals, SDS/label directions, or professional judgment.
- Unlimited AI scanning in the native app.
- Native paid subscriptions, paid unlocks, or PartSnap Pro entitlement inside the Play build unless Google Play Billing or an approved external-purchase flow is implemented.
- Completed Route Ready certification or training credentials.
- AR pool design/dealer proposal features from the legacy Unity repo.

## Data Safety Notes

Use these as the Play Console data safety draft, then finalize only after the actual Android wrapper and any native SDKs are known.

Likely declarations for the current free-core TWA wrapper:

- Account creation: not required for core use.
- Ads: no.
- Precise location: no.
- Contacts: no.
- Health/financial data: no.
- Payment information: no payment data collected inside the initial Play wrapper. If any checkout is exposed inside the app, pause and route through Play Billing or an approved policy flow.
- Local app data: service notes, saved pool/reference data, usage state, and preferences may be stored locally in app/browser storage for app functionality.
- Photos/images: user-selected images may be uploaded only when the user starts an online scanner workflow. Purpose: app functionality, not advertising.
- Text/user content: scanner prompts, manual entries, notes, or readings may be processed for app functionality if submitted through an online workflow.
- Diagnostics/app activity: declare only if the Android wrapper adds analytics, crash reporting, or logging SDKs. If no native SDKs are added, verify whether the web app logs requests through Cloudflare or scanner endpoints before finalizing.
- Data sharing: do not claim zero sharing until the scanner endpoint, AI provider processing, hosting logs, and any analytics/crash SDKs are verified.
- Security: app traffic should use HTTPS/TLS.
- Deletion: users can clear local app data from Android settings/browser storage and can contact support through the public support/privacy URL.

Open data-safety checks before submission:

- Confirm whether the scanner endpoint retains uploaded images or only processes transiently.
- Confirm whether `SCAN_USAGE_KV`, scanner logs, Cloudflare logs, or AI provider logs store image/text/request metadata.
- Confirm whether the TWA adds Firebase, Play Integrity, crash reporting, analytics, or notification SDKs.
- Confirm `?store=android` hides Stripe/payment CTAs and does not expose web subscription purchase screens inside the Play build.

## Screenshot And Thumbnail Direction

Creative principle: show real pool-service utility, not generic pool lifestyle or legacy AR/dealer design.

Required phone screenshots:

1. Home/rescue dashboard: quick actions for error lookup, dosing, scanner, and notes. Thumbnail hook: "Stuck at the equipment pad?"
2. Error-code lookup: show a realistic equipment-code search/result with reference posture.
3. Chemical dosing calculator: show user-entered readings and calculated dose guidance with verification-safe language.
4. Service note/report: show visit notes or report drafting for tech workflow.
5. Offline manual tools: show cached/manual reference value after first load.
6. Online AI scanner: show scanner mode selector or result with visible "verify output" posture.
7. PartSnap/search workflow: show part-identification assistance or search terms, not guaranteed OEM match or purchase certainty.

Feature graphic / thumbnail direction:

- Use a phone UI over a real equipment-pad or pool-service field context.
- Lead with SplashLens brand and the free field-rescue promise.
- Keep text minimal and readable: "Pool Tech Field Tools" or "Codes, Dosing, Notes, Scanner".
- Do not show Stripe pricing, web checkout, paid native unlocks, certificates, manufacturer logos as endorsements, or AR pool-placement visuals.

## Outreach-Ready Positioning

One-liner:

SplashLens is a free field rescue app for pool techs: error codes, dosing math, service notes, and scanner assistance before escalation.

For working technicians:

Before you call the senior tech, open SplashLens. Search the code, check the dose, capture the note, and use scanner assistance when you have signal.

For service company owners:

SplashLens does not replace Skimmer, PoolBrain, or your office workflow. It gives techs a fast field reference layer at the stop so fewer small questions become phone calls.

For launch/social copy:

ASC is approved. Google Play is next. SplashLens is the free pool-tech field app for equipment codes, dosing calculators, visit notes, and online scanner assistance, with manual tools built to keep working after first load.

For cautious scanner positioning:

The scanner is reference assistance, not a diagnosis engine. It can help identify displays, parts, or test-strip context, but techs should verify against manuals, calibrated tests, labels, and field judgment.

## Manual Play Console Steps

1. Build a current SplashLens TWA/Android wrapper around `https://app.splashlens.com/?store=android`.
2. Choose the Play package ID. Use `com.splashlens.app` only if the Play Console account owns or can create it for this current app.
3. Set app name to `SplashLens Field Tools`, category to Utilities or Productivity, and pricing to Free.
4. Generate a signed release `.aab` with Play App Signing enabled.
5. Verify the bundle locally before upload:
   - `jarsigner -verify -verbose -certs <path-to-aab>`
   - `bundletool validate --bundle <path-to-aab>` if bundletool is available.
6. Create or open the Google Play Console app record.
7. Complete App content:
   - Privacy policy: `https://splashlens.com/privacy.html`
   - Ads: No
   - App access: no login required for core use
   - Target audience: adults/professionals, not children
   - Content rating: utility/reference, no social/user-generated public sharing
   - Data safety: use the draft above, then adjust based on the actual wrapper and scanner/analytics behavior.
8. Add store listing metadata from this packet.
9. Upload screenshots and feature graphic from the creative direction above.
10. Upload the signed `.aab` to internal testing first.
11. Smoke-test the internal build:
    - Opens directly into SplashLens, not old PoolLens branding.
    - Starts at or preserves `?store=android`.
    - No direct Stripe checkout or web subscription CTA appears in store mode.
    - Manual lookup, calculators, notes, filters, and checklists work after first load.
    - Camera/photo permission is requested only when the user starts scanner flow.
    - Scanner language says assistance/verify, not guaranteed diagnosis.
    - Privacy/support links open correctly.
12. Promote to production with manual publishing after internal test passes.

## Final Blockers

- Current-field-app Android/TWA source is missing.
- Current-field-app signed `.aab` is missing.
- Final Play data-safety answers must wait until the Android wrapper and any native SDKs are known.
- Store screenshots/feature graphic still need to be captured from the current `?store=android` app mode.
- Do not use the legacy Unity AR app, AR screenshots, AR store copy, or dealer-sales positioning for this Google Play launch.
