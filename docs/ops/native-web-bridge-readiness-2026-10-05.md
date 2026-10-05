# Native Web Bridge Readiness - 2026-10-05

## Verdict and scope

**HOLD native external scan-upgrade CTA.** The local telemetry/importer work is verified; neither platform approval nor a policy-compliant native link-out bridge is established. This is a technical release-gate assessment, not legal advice or a store approval.

Assumption: the requested CTA sends a native user to purchase Pro/unlimited digital scans on the web. Renaming it "Continue on web" does not change its purchase destination. A genuinely free, noncommercial scan destination needs a separate destination/flow review; it is not implemented here.

Completed lanes:

1. Read instructions and verify checkout identity and existing native/store-metric support.
2. Inspect local export availability and existing store-console access without exposing credentials.
3. Research current official Apple/Google regional eligibility and configuration gates.
4. Fix reproduced importer defects and run focused plus shared-checkout tests.

Checkout: `C:\Users\sales\Documents\Codex\splashlens-proof-gate-20260830\app`; remote `https://github.com/frost831/poolens.git`; branch `master`; starting HEAD `e17f87c929d000e9b2317a88584ae9fcb91d9507`. Read `C:\Users\sales\AGENTS.md` and the supplied Complete-Task Contract; no additional ancestor or nested checkout `AGENTS.md` was found. Store-console observations and policy/test verification were made on 2026-10-05, approximately 14:25-14:38 UTC (09:25-09:38 America/Chicago).

Owned changes only: this new document, `tools/import-store-metrics.mjs`, and `tests/store-metrics-importer.test.mjs`. Other agents' checkout changes were preserved. No commit, push, deployment, real metric import, purchase, price change, entitlement enrollment, agreement acceptance, or production/store-setting mutation was performed.

## Existing support verified

| Surface | Local evidence | Meaning and limits |
| --- | --- | --- |
| Native opens | `js/app.js`: startup calls `trackStoreShellOpen`; emits `native_shell_open` each initialization and `native_shell_first_open` once per store/local-storage state. | Node VM execution verified first/repeat iOS opens, first Android open, and no event for ordinary web mode. These are shell-mode events, not verified installations or distinct people. Clearing storage can repeat a first-open event. |
| Shell marker | `getStoreShellMode` accepts `store=ios`, `store=android`, or `store=native`, persists the marker, and clears it with `store=web`/`0`. | User-controlled URL/storage is not trusted platform, storefront, country, age, or program eligibility. Do not use it to authorize a regional purchase CTA. |
| Reporting | `functions/api/stats.js` and `tools/run-field-intelligence-loop.mjs` include native-open events; the protected store API/dashboard use `store_metric_imports`. | Opens, download clicks, official store counts, checkout intent, verified entitlement activation, and paid conversion are separate evidence states. Open totals may contain multiple event types for the same initialization. No live D1 total was verified in this lane. |
| Current purchase guard | `showScanLimitModal` returns a native manual-lookup fallback; `renderPartSnapResultUpgradeOffer` suppresses the web offer in shell mode. | Preserve these guards. This source inspection is not an exhaustive native UI compliance audit. |
| iOS wrapper | `ios/SplashLens/ContentView.swift` opens `https://app.splashlens.com/?store=ios`; re-adds that flag on app-host navigation; allows only app/site hosts, plus external `mailto`/`tel`. | No StoreKit eligibility/disclosure/token APIs, native billing message handler, or approved web-upgrade browser launcher was found. Arbitrary external hosts are canceled; same-host "web" navigation is forced back into shell mode. |
| Android wrapper | `android-twa/app/build.gradle` launches `/?store=android` for `com.splashlens.fieldtools`, using Android Browser Helper 2.6.2. | No Play Billing dependency, external-link eligibility/disclosure/token integration, or native-to-web approval bridge was found in local wrapper source. A TWA is not an exemption from Play payments policy. Local version fields do not establish the installed production build. |
| JS native billing calls | `requestNativePartSnapPurchase` tries an iOS message handler or an Android billing intent. | These calls are stubs unless the native build actually handles them. They do not prove purchase, restore, external-link support, or store authorization. |

## Apple gates

- **United States storefront:** Guideline 3.1.1(a) permits external purchase buttons/links/CTAs without the external-purchase entitlement. This is a storefront exception, not worldwide permission based on device locale, IP, or `store=ios`. Proposed implementation must obtain trustworthy current storefront information, fail closed when unknown, use a real reviewed native browser-opening path, and document the destination in review notes. SplashLens's digital scan upgrade is not a physical pool-service purchase. Its scanner/tool purpose does not establish reader-app eligibility; a free paid-web companion exception does not authorize purchase steering by itself. [Apple App Review Guidelines, 3.1.1(a), 3.1.3](https://developer.apple.com/app-store/review/guidelines/uk/)

- **EU storefronts:** the August 18, 2026 license update took effect October 1; Attachment 14 supersedes the older EU addenda. Account Holder acceptance, StoreKit External Purchases or Offers entitlement, `com.apple.developer.storekit.custom-purchase-link.allowed-regions`, matching signing profiles, and supported OS are gates. Current iOS/iPadOS minimum is 26.2; earlier versions require Apple guidance. Call `canMakePayments`, then `ExternalPurchaseCustomLink.isEligible`, then `showNotice`; implement regional child protections. Payment-option choice must remain consistent across EU storefronts for 12 months. Apple now permits combinations with IAP, with simultaneous, at-least-equal IAP prominence when combined. A link-only multiplatform plan needs review: the page requires IAP and/or alternative in-app payment and genuine on-screen alternative-payment choice. Out-of-app link commission is generally 15%, or 10% for qualifying cases, on sales within seven days; report monthly within 15 days, including unsuccessful transactions/refunds/renewals. Norway/Iceland entries on the entitlement list are music-streaming-only, not a general SplashLens EEA permission. None of these account/build gates was verified. [Current Apple EU payment rules](https://developer.apple.com/support/payment-options-on-the-app-store-in-the-eu)

- **Japan:** Japan storefront, iPhone iOS 26.2+, accepted applicable terms, entitlement region `jp`, and new provisioning are required. Actionable web offers must present IAP simultaneously and at least as prominently. Use `canMakePayments`, `isEligible`, and disclosure flow; implement Apple-designed disclosure for older supported versions, not a generic JS confirmation. Out-of-app offers are barred for Kids-category apps and under-13 users; ages 13-17 require a parental gate. Commission/reporting obligations apply. This wrapper has no working IAP or regional bridge, so Japan cannot be enabled from web code alone. [Apple Japan payment rules](https://developer.apple.com/support/payment-options-on-the-app-store-in-japan/)

- **Brazil:** Brazil storefront, iPhone iOS 26.5+, applicable agreement, entitlement region `br`, signing, simultaneous/equally prominent IAP, eligibility checks, disclosure, and commission/reporting are required. Kids-category apps and users under 18 cannot receive out-of-app purchase offers. This lane remains held. [Apple Brazil payment rules](https://developer.apple.com/support/payment-options-on-the-app-store-in-brazil/)

- **Other storefronts:** leave purchase steering off unless the exact applicable regional/category program is established. Dating/music/reader-specific routes are not demonstrated for SplashLens. Do not treat an existing web subscription, a browser-opening mechanism, or the US exception as global approval. [Apple purchase-method restrictions](https://developer.apple.com/app-store/review/guidelines/uk/)

## Google gates

- **US and territories:** enroll and obtain app approval for the External Content Links program before enabling the CTA; complete declaration/support onboarding and Play Console `Settings > External content links`. Mobile/tablet apps and games can qualify. Restrict to eligible US users; provide customer support, dispute/refund handling, an accurately described destination, and protected URLs without exposed personal data. Google says transaction reporting and applicable service fees started October 1, 2026; the December 1 extension concerns external app-download reporting, not scan-subscription transactions. The documented recurring-subscription fee is 10% for qualifying link transactions within the stated 24-hour window. US enrollment can coexist with Play Billing, which must remain reliably accessible if offered. No program approval for `com.splashlens.fieldtools` was established. [Google US program requirements](https://support.google.com/googleplay/android-developer/answer/16470497?hl=en)

- **EEA:** enroll the exact app and selected countries in External Offers; the developer must be registered as a business and the app must not target only children. Requires approval, terms/payment-profile onboarding, external-offers APIs, support/refunds, fees, and reporting applicable authorized transactions within 24 hours. Current rules prohibit combining the enrolled app's external offers with Play Billing or user-choice billing; alternative billing without user choice is the supported in-app alternative. Keep external purchase promotion out of the Play listing. The currently visible account is labeled Personal and lacks the target package; it does not establish eligibility. US enrollment does not cover the EEA. [Google EEA external-offers requirements](https://support.google.com/googleplay/android-developer/answer/14372887?hl=en)

- **Native configuration for either program:** integrate Play Billing Library 8.2.1+; initialize with `enableBillingProgram` and the corresponding `BillingProgram.EXTERNAL_CONTENT_LINK` (US) or `EXTERNAL_OFFER` (EEA). Call `isBillingProgramAvailableAsync`, create a fresh external transaction token with `createBillingProgramReportingDetailsAsync` for every link-out, and use `launchExternalLink` with `LINK_TO_DIGITAL_CONTENT_OFFER`. Follow Google's information-screen flow; never open the link on cancellation, unavailable eligibility, or API failure. The web/backend must correlate the protected handoff and report transactions; a successful link launch is not payment proof. Verify using license testers. [US integration guide](https://developer.android.com/google/play/billing/externalcontentlinks/integration), [EEA integration guide](https://developer.android.com/google/play/billing/external/integration), [LinkType reference](https://developer.android.com/reference/com/android/billingclient/api/LaunchExternalLinkParams.LinkType)

- **Other regions/default:** payment for digital scans/app functionality normally requires Play Billing. Alternative billing enrollment is not blanket permission for a web-upgrade link. No other program was established for this app; keep the native CTA disabled there. [Google Payments policy, sections 2, 4, 8, 9](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)

## Exact export/access blockers

Local search included hidden/ignored files, while excluding Git/dependency/build internals, under:

- `C:\Users\sales\Documents\Codex\splashlens-proof-gate-20260830` (app and site).
- `C:\Users\sales\Documents\Codex\Flagships\poolens` and `poolens-site`.
- `C:\Users\sales\Downloads`.

No identifiable official Apple/Google metrics export was found. The only store-metric file candidates were the two copies of `ops/store-metrics-example.csv`; both are examples, not evidence, and were not imported. This is a bounded location/filename inspection, not a claim that no export exists anywhere on disk or inside unrelated archives.

| Lane | Verified blocker | Smallest external action |
| --- | --- | --- |
| Apple exports and account/build eligibility | Chrome opened `https://appstoreconnect.apple.com/login` and showed the Apple Account sign-in form. No authenticated app/report or entitlement access. | Owner signs in to the team containing SplashLens, verifies app Apple ID/SKU, and supplies daily Summary Sales exports for `splashlens-ios-2026`, including product type and dates. Authenticate locally, never paste credentials into this report. |
| Google target-app exports/enrollment | Chrome Play Console account `warmsnowman831` (`6282350079091140184`) showed three apps. SplashLens there is **`com.splashlens.app`**, closed testing; **`com.splashlens.fieldtools` is absent**. The account switcher showed only that developer account. | Owner supplies access to the developer account owning `com.splashlens.fieldtools`, or downloads its Statistics/install/crash reports and supplies them locally. Do not change the importer target to the other package based on the shared product name. |
| Automated store download | No relevant Apple ASC key/issuer/private-key or Google service-account/Google application credential variables were present in this process. Checkout and parent had no runtime `.env`/`.dev.vars`; only `.env.example` was present. | A manual official export is sufficient for dry-run normalization; no new credential is needed for that. Automated acquisition would require separately authorized least-privilege report access. This is not a claim about credentials in other machines or secret stores. |
| Protected API import/live totals | `SPLASHLENS_STATS_SECRET` and `SPLASHLENS_ADMIN_SECRET` were absent in this process. No authenticated live import/read was made. | After original exports and totals are verified, an authorized operator can supply the protected API credential or approved D1 access and explicit import approval. `--d1` is a **remote write**, not a local dry-run fallback. |

Apple's download workflow is Trends > Sales and Trends Reports > vendor/date > Download, then unpack GZIP to the tab-delimited report. Keep the original file, checksum, app identity, date range, report frequency, and provenance alongside normalized totals. [Apple download instructions](https://developer.apple.com/help/app-store-connect/measure-app-performance/download-and-view-reports/)

Google reports are available through Download reports > Statistics > exact app/month or the developer's private `pubsite_prod_rev...` bucket. Bulk report access needs Global View app information permission; service-account access must be granted by the account owner. Bulk CSVs can be UTF-16 and published with delay. Supply one disjoint dimension breakdown per report, not totals combined with country/device aggregates. [Google export/access specification](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en)

## Importer changes and safe usage

Existing capabilities remain: generic normalized CSV; Apple SKU-filtered tab/CSV app downloads/redownloads/updates; package-filtered Play installs/uninstalls/updates/crashes/listing metrics; protected API posting; D1 remote upserts keyed by platform/metric/date/source; credential-free dry runs. Missing metrics remain absent rather than fabricated zeros.

Reproduced and fixed:

1. The CLI previously read all input as UTF-8, failing on official UTF-16 exports. It now strictly decodes UTF-8 and BOM-marked UTF-16 LE/BE before parsing. Invalid/truncated encoding and NUL-containing unmarked UTF-16 fail closed.
2. Official Google `Daily Crashes` was not detected or mapped; it now maps to `crashes`. If both that and the older `Crashes` alias are present, select the official daily column once. ANRs remain separate/unsupported, not added to crashes. [Google bulk crash fields](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en)
3. Individually safe counts could aggregate beyond JavaScript's safe integer range. Aggregate totals now fail before API/D1 output rather than emit rounded numbers.

No new dependencies, schema changes, native purchase links, or production writes. Compressed archives must be unpacked first. Apple negative refund/credit units still fail for review; unrestricted analytics exports lacking SKU are not silently attributed to SplashLens. The parser does not prove file authenticity. Do not mix overlapping source/date/dimension totals; the API accepts at most 500 entries per request. The legacy mapping `Daily User Installs` -> `first_time_downloads` is a reporting label, not proof that Play's metric is identical to Apple's definition.

After an owner supplies real exports, these commands normalize locally only. The PowerShell variables are paths selected by the operator, not sample-data files:

```powershell
npm run store-metrics:import -- --file $AppleDailySummaryPath --format app-store-connect --source app_store_connect_export --dry-run
npm run store-metrics:import -- --file $PlayStatisticsPath --format google-play --source google_play_console_export --dry-run
```

Do not remove `--dry-run` or add a live import action as part of this lane. Official counts remain unknown until authentic exports for the correct app are supplied and verified.

## Verification and remaining release gates

| Check | Result |
| --- | --- |
| Baseline importer tests | 11/11 passed before edits. |
| Regression proof before implementation | Five new test cases failed against the old code, reproducing crash mapping, aggregate overflow, and encoding issues. |
| `node --test tests/store-metrics-importer.test.mjs` | 16/16 passed after fixes. Includes end-to-end CLI dry runs for UTF-8, UTF-8 BOM, UTF-16 LE/BE, malformed encodings, package filtering, aliases, overflow, and existing API rejection. Fixtures are synthetic. |
| Native-open behavior | Node VM harness passed first/repeat iOS, first Android, and ordinary-web suppression; no network telemetry was sent. |
| `node --check tools/import-store-metrics.mjs` | Passed. |
| Scoped `git diff --check` | Passed; only Git's LF/CRLF conversion warnings. |
| Full shared-checkout `npm test` / spec reruns | Initial integrated snapshot: 142 tests, 137 passed, 5 failed. Latest rerun: 163 tests, 157 passed, 4 failed, 2 skipped. Failures/skips are outside this writer's assigned files; not a green release gate. |

Latest full-suite failing locations: `tests/checkout-funnel.test.mjs:135` (web checkout intent), `tests/first-party-script-assets.test.mjs:30` (service-worker assets), `tests/northstar-funnel-copy.test.mjs:98` (checkout event contract), and `tests/northstar-funnel-copy.test.mjs:116` (post-value lookup paid path). The earlier `tests/payment-funnel-events.test.mjs:66` server-proof/identity failure no longer failed on rerun. Other agents were actively changing related files; coordinate their fixes and rerun the suite. These failures were not repaired by this writer.

The two skipped tests are real-browser integration/layout tests in `tests/partsnap-boss-packet.test.mjs`, gated on `SPLASHLENS_PLAYWRIGHT_PATH`. Their skip is not browser/device proof; this writer did not set that variable or modify those tests.

Before a separately authorized native CTA implementation/release, require: correct app/account and signed build identity; chosen region/program and verified approval/terms; trusted native eligibility and failure handling; approved external-opening/disclosure/token bridge; secure web account/entitlement return flow without personal data in URLs; required reporting/refund support; device tests for eligible/ineligible/unknown regions, restricted users, cancellation, network failure, browser return, and unchanged free manual fallback; reviewed screenshots/notes; and a green integrated test run. None of the missing native or store gates is satisfied merely by this importer fix.
