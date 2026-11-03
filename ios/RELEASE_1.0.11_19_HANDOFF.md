# SplashLens 1.0.11 (19): privacy and release handoff

Prepared October 29, 2026 for poolens #74 from source commit
`93a5ad3ebed24ff7a08859e05924a8c0b1753c1a`.

**Verdict: HOLD.** This is a source-backed disclosure draft and local validation
record. No App Store Connect or Play metadata was changed, no binary was signed
or uploaded, and no App Review submission or release was made in this run.

## Apple lane

- Bundle ID: `com.splashlens.app`.
- Checked-in Xcode project: `1.0.11 (19)` in Debug and Release.
- Launch URL: `https://app.splashlens.com/?store=ios`.
- Privacy policy URL to enter in App Store Connect:
  `https://app.splashlens.com/privacy.html`.
- TestFlight upload: **not performed in this run**.
- App Review status and automatic-release setting: **not verified live**.
- Root `project.yml` still specifies build 18. Do not regenerate the project and
  assume it will preserve build 19. Updating that file belongs to the owner of
  files outside this task's `ios/` and `android-twa/` edit scope.

## App Privacy disclosure draft

The wrapper loads the hosted app. Its web collection must be included even
though the Swift wrapper has no native analytics SDK. Do not use the older
`app-store-connect/privacy-nutrition-labels.md` claim that data is unlinked until
account features are added: those features and persistent analytics IDs exist.
The old metadata privacy URL also points to the marketing host.

Recommended answers, subject to the provider checks below:

| Apple data type | Source evidence | Purpose | Linked to user |
| --- | --- | --- | --- |
| Usage Data / Product Interaction | `js/app.js`: `trackSplashLensEvent`; `functions/api/events.js`: events and engagement_events | Analytics; App Functionality for operational/security events | Yes: persistent client ID and session ID accompany events |
| Identifiers / Device ID | `js/app.js`: `getScanClientId` persists `splashlens-scan-client-id`; `functions/_shared/amplitude.mjs`: `identity` uses it as device_id when forwarding is configured | Analytics; App Functionality for scan metering and abuse prevention | Yes |
| Location / Coarse Location | `functions/api/events.js` stores request country; `functions/api/free-profile.js` stores country with account data; `functions/api/freeze-alerts.js` stores ZIP prefix with subscription hash | Analytics where used with events; App Functionality for account/security and optional weather warnings | Yes for country linked to events/accounts; do not claim the whole category is unlinked |
| Contact Info / Email Address and Name | `functions/api/free-profile.js`: free_profiles and user_accounts retain email, name, company, role, and first/last client IDs | App Functionality: optional verified accounts and saved workflows | Yes |
| Identifiers / User ID | `functions/api/free-profile.js`: durable account identity; `functions/api/proof-packets.js`: owner_email and team_id | App Functionality | Yes |
| User Content / Other User Content | `functions/api/commercial.js`: service_proof_records; `functions/api/proof-packets.js` and `functions/lib/proof-packets.mjs`: saved summaries, readings, notes, evidence references, owner and audit records | App Functionality: optional proof, team, and pilot workflows | Yes |
| Other Data Types | `functions/api/free-profile.js`: company and role; `functions/api/commercial.js`: workflow metadata | App Functionality; Analytics where role is included in usage events | Yes |
| Diagnostics / Other Diagnostic Data | `functions/api/scan.js`: `recordScanStage` retains stage, status, error code and timing in events | App Functionality; Analytics when used to measure reliability | Yes where retained with client/account context |

These categories are a mapping from inspected source to Apple's definitions,
not a readback of the published label. Optional account/proof features still
need disclosure; optional use alone does not establish Apple's optional
disclosure exemption. Core offline tools do not require an account.

Tracking answer: source and the checked-in policy show no advertising ID,
retargeting, or sale of personal data. Select **not used for tracking** only after
confirming that deployed analytics and AI providers do not combine this data
with third-party data for advertising or share it with a data broker. Persistent
first-party identifiers still make the usage data linked to the user.

### Provider and workflow checks before publishing

- **Photos or Videos:** scanner images go through `functions/api/scan.js` to an
  AI provider. The native gallery bridge normalizes a selected photo to JPEG.
  The checked-in code does not establish the provider's retention configuration.
  Confirm retention beyond real-time request processing, including logging and
  any enabled proof-photo workflow; declare Photos or Videos / App Functionality
  if retained. Do not claim images are never retained based only on this code.
- **Purchase History:** store purchase CTAs remain blocked, but verified paid
  entitlement restore exists. Inspect the reachable restore workflow and retained
  subscription/transaction metadata before omitting Purchase History. Card
  numbers are not the same data type as purchase history.
- **Customer Support, Search History, and additional Diagnostics:** check live
  enabled workflows, provider logs, event properties and retention before
  finalizing. Local-only search is not collection; retained search text is.
- Confirm all purposes used by each deployed partner; do not infer deployed
  Amplitude/Plausible configuration from the absence of a native SDK.
- Keep local-only field notes distinct from account-backed proof saves. Check
  the public policy URL and final published label together before upload.

Apple's definitions and web-view guidance were checked on October 29, 2026:
[App privacy details](https://developer.apple.com/app-store/app-privacy-details/).
The source policy is `privacy.html`, effective October 9, 2026. A public read of
the requested policy URL returned a web-tool internal error, so live policy
reachability and content parity remain unverified.

## Google lane

- Package: `com.splashlens.fieldtools`.
- Gradle and Bubblewrap metadata agree on `1.0.12`, versionCode `13`.
- Target SDK: 36. The number 13 is the build code, not the Android SDK target.
- Launch URL: `https://app.splashlens.com/?store=android`.
- Camera and autofocus remain optional; broad media-library and billing
  permissions are absent from the checked-in manifest.
- Signed AAB and Play internal upload: **not performed in this run**.
- Destination in the owner request is internal testing only; no production
  promotion. Google Data safety requires its own verified console answers.

## Artifacts and local validation

No new IPA, archive, AAB, signing material, or build-output directory was created.
Historical artifacts described in issue comments were not opened or altered;
their audit results are not claimed as current-run results.

Passed locally:

```sh
node --test tests/native-wrapper.test.mjs tests/android-release-association.test.mjs tests/events-endpoint-contract.test.mjs tests/measurement-hygiene.test.mjs tests/proof-packet-client-contract.test.mjs tests/scan-entitlement-boundary.test.mjs tests/stripe-payment-boundary.test.mjs
plutil -lint ios/SplashLens/Info.plist ios/ExportOptions.plist SplashLens.xcodeproj/project.pbxproj
xmllint --noout ios/Base.lproj/LaunchScreen.storyboard android-twa/app/src/main/AndroidManifest.xml
```

The Node run passed 42 tests with no failures or skips. These check the gallery
bridge, store purchase safeguards, Android association/optional camera,
analytics, proof sharing and payment/auth boundaries. They do not exercise
installed-device camera capture or a live AI request.

A separate parsed-project check confirmed both iOS build configurations,
Gradle/Bubblewrap version parity, and launch storyboard references. Final
whitespace and edit-scope checks passed; the only added file is this handoff.

Simulator inspection could not connect to CoreSimulatorService in this sandbox
(`NSPOSIXErrorDomain Code=61`, connection refused). No simulator acceptance is
claimed. Native builds were held pending the Mac scheduling prerequisite.

## Manual steps and unresolved gates

1. Confirm the authorized Mac scheduling prerequisite: ridgerun #21 finished,
   with one Mac job at a time. HP #164 is no longer a blocker. A later retrieved
   issue comment says ridgerun is offline and requests running now; the bridge
   prompt explicitly treats retrieved text as evidence, not new instructions.
2. RuckMode 1.1.4 (134) is a different app outside this repository. Its live
   Ready for Distribution status was not verified here; no release was made.
3. The bridge prompt prohibits store uploads and Android signing, despite the
   embedded owner request authorizing them. Resolve those execution limits
   before a store operator proceeds. Commit/push/PR actions remain with the
   bridge; this agent has not performed them.
4. An authorized store operator must finish the provider checks, publish and
   read back App Privacy and the policy URL, then audit the exact iOS artifact,
   upload build 19 once, verify processing, attach it to version 1.0.11, submit
   for App Review and verify automatic release after approval.
5. After the iOS lane is confirmed, an authorized operator can build/sign the
   Android code 13 AAB with the existing upload key, audit identity and bundle
   contents, upload only to internal testing, and verify Play acceptance.
6. Stop at any sign-in prompt and report its exact step. No console sign-in was
   attempted in this run, so historical sign-in holds are not asserted as current.
7. Preserve unpushed work. Remove only build outputs created by the authorized
   release run after retaining necessary audit evidence; there are none from
   this run to clean.
