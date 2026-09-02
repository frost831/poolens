# SplashLens Google Play Launch Packet - 2026-05-28

Scope: Google Play launch packet for the current SplashLens pool-service field app only. App Store Connect approval is treated as background context; this packet does not change the Apple lane.

## Source Of Truth

- Active app repo: `github-projects/poolens`
- Public site repo: `github-projects/poolens-site`
- Current app URL for Play wrapper: `https://app.splashlens.com/?store=android`
- Marketing URL: `https://splashlens.com`
- Privacy URL: `https://app.splashlens.com/privacy`
- Support URL: `https://app.splashlens.com`
- Current product promise: FreeCore field reference app for pool service technicians. Search equipment codes, calculate chemical doses, create service notes, use filter/checklist references, and use 3 included PartSnap app scans a month for optional scanner workflows.
- Important legacy warning: `github-projects/splashlens` contains an older Unity AR pool-visualizer/dealer-sales concept. Do not use that AR/dealer copy, screenshots, or build lane for the current pool-tech PWA/scanner Play launch.

## Play Console Execution Update - 2026-05-28

- Correct Google Play developer account: `ThrottleShare`.
- Correct developer account ID: `7017771963942604688`.
- Google Play Console app created: `SplashLens Field Tools`.
- Play Console app ID: `4974110437390812521`.
- Package: `com.splashlens.fieldtools`.
- Production track: `https://play.google.com/console/u/2/developers/7017771963942604688/app/4974110437390812521/tracks/4697669214915845586`.
- Production release: `1.0.0 Android launch`, version `1 (1)`.
- Publishing overview status observed after confirmation: `Changes in review`.
- Upload key SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`.
- `.well-known/assetlinks.json` now includes the upload-key fingerprint for `com.splashlens.fieldtools`.
- Follow-up: add the Google Play App Signing SHA-256 for `com.splashlens.fieldtools` to `https://app.splashlens.com/.well-known/assetlinks.json` after Google assigns it.

## Android Package And Artifact Status

Package/app ID status:

- Current field-app Android package ID: `com.splashlens.fieldtools`.
- Apple/iOS bundle ID already used in ASC: `com.splashlens.app`.
- Legacy Unity AR Android identifier in `splashlens/app/ProjectSettings/ProjectSettings.asset`: `com.splashlens.app`.
- The old `com.splashlens.app` Play package is locked to the wrong personal Google Play developer account. Do not use it for the ThrottleShare launch lane.

Artifact verification:

- Current field-app Android/TWA wrapper now exists under `android-twa`.
- Release bundle build passed on Windows with `cmd /c gradlew.bat bundleRelease`.
- Unsigned build output: `android-twa/app/build/outputs/bundle/release/app-release.aab`.
- Signed Play upload candidate: `play-store-artifacts/SplashLens-Field-Tools-1.0.0-v1-com.splashlens.fieldtools-signed.aab`.
- Upload key is intentionally stored outside Git at `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`.
- Upload-key SHA-256 fingerprint: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`.
- Web asset link file updated at `.well-known/assetlinks.json` for the new package and upload-key fingerprint.
- PWA manifest now includes PNG 192, PNG 512, and maskable 512 icons.

Launch verdict: Play metadata and a signed AAB have been submitted to production review on the correct ThrottleShare developer account. Google Play approval and the final app-signing asset-links update remain external follow-ups.

## Play Store Metadata

Title, 30-character limit:

SplashLens Field Tools

Short description, 80-character limit:

Pool tech codes, dosing, service notes, and scanner assistance.

Full description:

SplashLens is a FreeCore field reference app for pool service technicians who need fast answers at the equipment pad.

Use SplashLens to search pool equipment codes, estimate chemical doses from values you enter, draft service notes, review filter and maintenance checklists, and use 3 included PartSnap app scans a month for optional online scanner workflows.

FreeCore tools do not require an account. Manual lookup, calculators, notes, filters, checklists, Facility Assist, and 3 PartSnap app scans a month are designed for field use. Manual tools can work from the app shell after first load. Online scanner features require internet access and are user-initiated. Splash Lens Pro Unlimited is the paid scanner-capacity and saved-job-memory lane where paid access is available.

What SplashLens helps with:

- Equipment error-code lookup and field reference
- Chemical dosing calculators based on user-entered readings
- Service notes and visit-report drafting
- Filter guides, maintenance checklists, and poolside references
- 3 included PartSnap app scans a month for optional scanner assistance

Important field-use note:

SplashLens provides reference assistance only. AI scanner output must be verified against equipment manuals, calibrated testing, label directions, SDS information where applicable, and professional field judgment. SplashLens does not guarantee diagnosis, repair, chemical safety, manufacturer support, or training certification.

## Policy-Safe Claims

Allowed claims for this Play launch:

- FreeCore pool-service field reference app.
- 3 included PartSnap app scans a month.
- Splash Lens Pro Unlimited as a paid scanner-capacity and saved-job-memory lane where paid access is available.
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
- Unqualified free/native unlimited scanning claims.
- Native paid subscriptions, paid unlocks, or Splash Lens Pro Unlimited entitlement inside the Play build unless Google Play Billing or an approved external-purchase flow is implemented.
- Completed Route Ready certification or training credentials.
- AR pool design/dealer proposal features from the legacy Unity repo.

## Data Safety Notes

Submitted Play Console data-safety posture for the Android production release:

- Account creation: not required for core use.
- Ads: no.
- Precise location: no.
- Contacts: no.
- Health/financial data: no.
- Payment information: no payment data collected inside the initial Play wrapper. If any checkout is exposed inside the app, pause and route through Play Billing or an approved policy flow.
- Local app data: service notes, saved pool/reference data, usage state, and preferences may be stored locally in app/browser storage for app functionality.
- Email address: collected optionally for app functionality and developer communications.
- Photos/images: collected optionally for app functionality and shared for app functionality when the user starts an online scanner workflow.
- Security: app traffic should use HTTPS/TLS.
- Deletion request URL: `https://app.splashlens.com/data-deletion`.

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

1. Monitor Google Play review under the ThrottleShare account.
2. After Google assigns the `com.splashlens.fieldtools` app-signing SHA-256, update `https://app.splashlens.com/.well-known/assetlinks.json`.
3. Smoke-test the approved Play listing/build:
   - Opens directly into SplashLens, not old PoolLens branding.
   - Starts at or preserves `?store=android`.
   - No direct Stripe checkout or web subscription CTA appears in store mode.
   - Manual lookup, calculators, notes, filters, and checklists work after first load.
   - Camera/photo permission is requested only when the user starts scanner flow.
   - Scanner language says assistance/verify, not guaranteed diagnosis.
   - Privacy/support links open correctly.

## Final Blockers

- Current-field-app Android/TWA source exists under `android-twa`.
- Current-field-app signed `.aab` exists and has been uploaded to production review.
- Play data-safety answers have been submitted with conservative scanner/photo disclosure.
- Temporary submission-grade screenshots and feature graphic were uploaded. Replace with premium real-photo creative in the next ASO pass.
- Do not use the legacy Unity AR app, AR screenshots, AR store copy, or dealer-sales positioning for this Google Play launch.
- Production release is now in Google review from the correct ThrottleShare account.
