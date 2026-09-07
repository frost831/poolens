# Mac Handoff: SplashLens Commercial Scale And Native Billing

Date: 2026-09-06

## One-Sentence Instruction For Mac

Pull the latest `master` from `https://github.com/frost831/poolens.git`, rebuild the iOS and Android wrappers against `https://app.splashlens.com`, increment native build numbers above the last store-approved builds, and submit with conservative notes that Pro web entitlement is live while native StoreKit/Play Billing remains disabled until implemented.

## Repository

- App repo: `https://github.com/frost831/poolens.git`
- Branch: `master`
- PC working clone used for this handoff: `C:\Users\sales\Documents\Codex\splashlens-proof-gate-20260830\app`
- Production app URL: `https://app.splashlens.com`
- iOS App Store URL: `https://apps.apple.com/us/app/splashlens/id6763644905`
- Google Play URL: `https://play.google.com/store/apps/details?id=com.splashlens.fieldtools`

## What Changed In The Web App

- Passwordless SplashLens email account remains the account layer.
- `/api/commercial` is the account-protected commercial control plane.
- `/api/admin` is the owner-protected commercial dashboard API.
- `/dashboard` and `/dashboard.html` are owner dashboard shells that load `/api/stats` and `/api/admin` with the SplashLens stats/admin secret.
- PartSnap proof and service report proof can save server-side proof metadata when the user has a verified account session.
- Team workspaces now include a pilot `team_billing` row and backend seat-limit enforcement.
- Partner/manufacturer card requests can be captured and approved into `partner_verified_cards`.
- Field Learning OS modules can be published into `learning_modules`.
- Stripe webhook supports multiple signing secrets and lifecycle events.
- Old Stripe audit endpoints using `?rotation=flagship-audit-*` should be removed from Stripe Dashboard or have their signing secret added to `SPLASHLENS_STRIPE_WEBHOOK_SECRETS`.

## Native Version Checks Found Locally

- Android package: `com.splashlens.fieldtools`
- Local Android wrapper file: `android-twa\app\build.gradle`
- Local Android wrapper currently shows `versionCode 1` and `versionName "1"` in the checked-out file.
- iOS bundle uses Xcode build settings through `$(MARKETING_VERSION)` and `$(CURRENT_PROJECT_VERSION)`.
- iOS Info.plist path: `ios\SplashLens\Info.plist`
- iOS app id seen in repo metadata/store URL: `6763644905`

## Required Mac / Store Actions

1. Pull latest `master` from GitHub before opening Xcode or Android Studio.
2. Verify the pulled commit contains:
   - `functions/api/admin.js`
   - `functions/api/commercial.js`
   - `dashboard.html`
   - `docs\ops\SPLASHLENS_COMMERCIAL_SCALE_RUNBOOK_2026-09-04.md`
3. iOS:
   - Open the SplashLens Xcode project.
   - Confirm the wrapper loads `https://app.splashlens.com`.
   - Increment `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` above the last App Store Connect/TestFlight build.
   - Rebuild and run on simulator/device.
   - Confirm camera permission copy still says SplashLens uses the camera only when the user chooses scanner assistance.
   - Confirm the native wrapper does not advertise native in-app subscriptions unless StoreKit is implemented in that native build.
   - Submit with conservative release notes below.
4. Android:
   - Open the Android TWA project.
   - Confirm `applicationId` remains `com.splashlens.fieldtools`.
   - Increment `versionCode` above the last accepted Play Console version code. Do not reuse old version codes.
   - Set `versionName` to the next store-safe version.
   - Build signed AAB.
   - Confirm `https://app.splashlens.com/.well-known/assetlinks.json` still matches the Play signing/upload key fingerprints required by the Play Console.
   - Submit with conservative release notes below.
5. Stripe Dashboard:
   - Remove the failing stale webhook endpoint `https://app.splashlens.com/api/stripe-webhook?rotation=flagship-audit-3dc2b80e-d7fc-4c33-adef-54c574f7ac0b`, or add that endpoint's `whsec_...` to the comma-separated Cloudflare secret `SPLASHLENS_STRIPE_WEBHOOK_SECRETS`.
   - Keep the main endpoint `https://app.splashlens.com/api/stripe-webhook`.
   - Events should include checkout completion plus subscription/invoice/refund/dispute lifecycle events.

## Conservative Store Release Notes

Suggested:

SplashLens now includes a cleaner field account layer, improved PartSnap and service proof workflows, Team Workspace pilot support, Facility/CPO workflow requests, partner card request support, and updated scanner entitlement handling. SplashLens remains a field reference aid and does not replace manuals, manufacturer guidance, calibrated water testing, local code, or qualified professional judgment.

Do not say:

- Native in-app subscriptions are available.
- Manufacturer cards are officially verified unless a specific card has been approved.
- SplashLens diagnoses or guarantees repair/part fit.
- Training certificates are available.

## ASO Copy Guardrails

Use:

- Pool service field reference app
- PartSnap part identification assistance
- Pool and spa equipment code lookup
- Facility/CPO workflow support
- Service proof notes and handoff packets
- Free field tools with optional Pro web entitlement

Avoid:

- Guaranteed diagnosis
- Official manufacturer support
- Certified training
- Native subscription unlocks
- Unlimited AI scanning inside the native app unless the native entitlement path is actually approved

## Store Test Script

1. Install fresh build.
2. Open SplashLens.
3. Confirm first screen loads without a blank webview.
4. Open Account.
5. Verify email using `frost@belowzeromedia.com` or a clearly marked test email.
6. Open PartSnap.
7. Confirm the free scanner account gate appears before AI scans if no verified session exists.
8. Confirm manual lookup and calculators remain accessible.
9. Confirm no Stripe checkout button appears in native store mode if native billing is not implemented.
10. Submit only after screenshots and review notes match the live behavior.

## Evidence To Return To PC

- Final iOS build/version numbers.
- Final Android `versionCode` and `versionName`.
- App Store Connect submission status or TestFlight status.
- Play Console track/status.
- Any rejection text verbatim.
- Screenshot of the app first screen and Account panel.
- Git commit pulled on Mac.
