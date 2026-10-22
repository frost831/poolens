# SplashLens release and verification — October 19, 2026

Verified through 16:08 UTC. The authorized app repairs and live Closing Pro/Crew configuration are deployed. Real installed-device PartSnap acceptance remains outstanding. This report supersedes the earlier authentication-blocked repair report.

## Done

- Released clean app commit **62dc49682907e604b9c0ffd215332c769db3a9e7** to Cloudflare Production branch `main`: https://ffa236af.poolens.pages.dev. The public app is https://app.splashlens.com.
- Preserved full portrait/wide captures in the PartSnap evidence sheet; increased the AI response budget and explicitly handled truncated responses with quota recovery; added bounded failure codes and opaque scan IDs.
- Fixed camera-denial Upload photo recovery to use the native gallery bridge. Native picker cancellation retains existing evidence; browser fallback opens the file/photo picker without the camera capture attribute.
- Kept post-result upgrade offers attached to their result across redraw/reload; preserved a single offer event and a fresh correlated checkout reference for each deliberate click.
- Corrected plan selection, disabled-plan access requests, checkout timeouts and retry behavior. Stripe activation links now stay in their configured app environment.
- Corrected billing dates after a real test purchase exposed a one-year date on a monthly entitlement. Subscription-item dates now reach Pro/Crew billing, verified checkout can repair an incorrect existing period, and later checkout webhooks preserve known billing dates. Token lifetime and revocation policy were preserved.
- Refreshed Stripe CLI authorization for **acct_1TJ23t25fqLun6cV**, Below Zero Media. Its Products write restriction persisted, so the two approved products were created in the authenticated Dashboard and independently verified through Stripe API reads. No key permissions were changed.
- Added only the two approved encrypted Production price settings, one at a time. Existing Pro prices, production storage and Preview test configuration were preserved.

| Live plan | Price | Stripe Price ID | Public checkout |
|---|---|---|---|
| Pro monthly | $19/month | Existing configuration preserved | Enabled |
| Pro annual | $149/year | Existing configuration preserved | Enabled |
| Closing Pro 60-Day Pass | $29 one time, no recurrence | `price_1USItu25fqLun6cVx4pWaPuy` | Enabled |
| Crew | $39/month | `price_1USIuT25fqLun6cVLNlG88FD` | Enabled |

Production setting names added: `SPLASHLENS_STRIPE_PRICE_CLOSING_PRO_60D`, `SPLASHLENS_STRIPE_PRICE_CREW_MONTHLY`. Teams remains request-access only.

## Verified

- **372/372 local app tests passed**, zero failures and zero skips, with browser checks enabled.
- GitHub's stored job log for the exact released commit reports **370 passed, zero failed, two optional browser skips**, plus the PartSnap metadata benchmark passing all 120 cases. The GitHub check summary still reports queued; that inconsistency is retained in `splashlens-ci-provider-proof-2026-10-19.json`. No check status was overridden or forced merge performed.
- Preview source **a6618b0c7362b0ded93f4084da22e05ecd4b24c1** passes **374/374**, zero skips. Clean allowlisted Preview deployment: https://4d04c123.poolens.pages.dev; alias https://stripe-test-55.poolens.pages.dev.
- Production SHA256 hashes match the released `index.html`, `js/app.js`, `sw.js` and PartSnap packet module. Asset version is `20261019-gallery-recovery`, service-worker cache `splashlens-v54-gallery-recovery`.
- Public app, site, sitemap, AI disclosure and LLM disclosure return HTTP 200. Protected stats without credentials returns HTTP 401. Both Production and Preview checkout catalogs return HTTP 200.
- Production Closing Pro and Crew screens show the correct price and Continue to Stripe. No live payment or live QA checkout session was submitted.
- Live gallery recovery passed with production web assets, simulated camera denial and a simulated native bridge: two native picker calls, zero browser picker calls, one retained capture after cancellation. This is a browser integration check, not installed-device proof.

### Actual Stripe TEST payment proof

Two hosted Stripe TEST purchases used synthetic reserved emails and Stripe's test card. Both were verified `livemode=false`, paid/completed, followed by signed provider webhook processing, active entitlement and a signed activation link consumed only in Preview. The second started from the Pro offer after opening the FLO equipment-code answer. Its checkout reference remained correlated through click, session creation, subscription, completion and entitlement.

The second monthly billing end date is **2026-11-19T15:38:36Z**, matching Stripe. Both test subscriptions were then canceled, and provider cancellation webhooks marked their entitlements canceled. Production had zero payment rows for either test session.

| Test | Session | Canceled subscription |
|---|---|---|
| Initial hosted flow | `cs_test_b1VsmRtelmhgxM9sU4ThzdYfir2r6n0VnkmzP418qL1GHxiAoy2sRk7otK` | `sub_1USIWW25fqLun6cVGQtAue3Z` |
| Post-result FLO offer | `cs_test_b1Fq93YcY2VybQ1eVNbmQloZj9XIQyGDQ7caZp66EHP7nJTn5ZmkWW6ckA` | `sub_1USIe225fqLun6cVwZfLDNcT` |

These demonstrate payment transport and fulfillment in TEST mode. They are not customer revenue, a new paid customer, or real-photo PartSnap accuracy.

## Real PartSnap findings

The production-clean event audit at 15:40 UTC contained five PartSnap failures before any AI request: three camera denials and two historical photo-quality blocks. There were zero recorded PartSnap successes and zero model attempts in that audited set. Historical quality details do not identify the actual photo content; quality thresholds were preserved.

Of 16 recorded useful results, eight manual-code answers, five turnover calculations and one dosing calculation came from iOS shells; two volume calculations came from web/unspecified shells. All recorded manual-code answers were therefore on a surface that intentionally suppresses web Stripe offers. Those independent counts are not a sequential customer funnel. No customer intent or install count was inferred from them.

The metadata benchmark still has **zero image-proven cases**. The next acceptance evidence must come from an installed iPhone/Android device, a verified test account and a permitted real part-photo set.

## Needs manual action or external state

1. Run the installed-device checks in `splashlens-device-acceptance-2026-10-19.md`: camera denial, native gallery selection/cancellation, complete evidence set, verified AI request, supported candidate, verification and saved packet. Record device/OS/app build and opaque scan ID, without sharing email codes or signed tokens.
2. GitHub must publish its completed check results before the open PRs are merged. The actual job logs and local checks pass; the check metadata remains queued. Re-run/check the exact current heads before merging. No deployment approval is outstanding: the tested app commit is already deployed.
3. Real customer conversion, technician pilot feedback/return use, official Apple/Google metrics and native store release evidence remain separate. No outreach, real-card QA, signing-key mutation or store upload was performed in this continuation.

## Git and preserved state

- [PR #59](https://github.com/frost831/poolens/pull/59): merged PartSnap and checkout repair; master merge `33e20362cc7b56b80fb2bcc7da9f24a780a91e4f`.
- [PR #60](https://github.com/frost831/poolens/pull/60): merged native gallery recovery; master merge `91597daa59ea193d2d785dab4f69104787bf8484`.
- [PR #62](https://github.com/frost831/poolens/pull/62): open activation/billing repair at the released commit `62dc49682907e604b9c0ffd215332c769db3a9e7`. It includes the fix originally proposed in #61; #61 is closed as superseded.
- [PR #56](https://github.com/frost831/poolens/pull/56): open Preview isolation and verification branch at `a6618b0c7362b0ded93f4084da22e05ecd4b24c1`. Its description now records completed live setup and actual TEST payment proof.
- Both owned worktrees are clean. The released feature commit is deployed; it is not claimed to be merged into master.
- Until #62 merges, use the recorded released commit for any app redeployment; the older master commit does not contain the activation/billing repair.
- Historical `android-twa/app/src/main/res/xml/shortcuts.xml` is preserved with SHA256 `09E0C1798AB467D1018AE01B3C44C657C5DBFEB8EDD6FCF588BC875613866101`.
- The site, native signing key and existing Pro prices were preserved. Flagship Git health passed all 18 registered repositories before release work.

## Files and artifacts

All accompanying evidence is in this output folder:

- `splashlens-final-deployment-verification-2026-10-19.json`, `splashlens-final-deploy-2026-10-19.log`
- `splashlens-release-smoke-2026-10-19.json`, `splashlens-live-checkout-screens-2026-10-19.json`
- `splashlens-live-prices-2026-10-19.json`, `splashlens-cloudflare-final-2026-10-19.json`
- `splashlens-ci-provider-proof-2026-10-19.json`, PR #56/#62 final-status JSON
- `splashlens-billing-period-final-tests-2026-10-19.log`, `splashlens-preview-release-tests-2026-10-19.log`
- `splashlens-payment-chain-2026-10-19.json`, `splashlens-payment-cancellation-2026-10-19.json`
- `splashlens-result-payment-chain-2026-10-19.json`, `splashlens-result-payment-cancellation-2026-10-19.json`
- `splashlens-gallery-browser-2026-10-19.json`, `splashlens-result-distribution-2026-10-19.json`
- Stripe products, Closing Pro, Crew and gallery recovery screenshots.

## Commands and remaining checklist

Verification used `npm test` with the bundled Playwright path enabled, `npm run partsnap:benchmark`, the ordinary GitHub CI job, Stripe TEST session/subscription reads, signed webhook records in dedicated Preview D1, Cloudflare CLI account/secret/deployment commands, the clean production deploy script, independent public HTTP/hash checks and rendered browser checks. Only opaque record IDs and setting names are reported; secret values are excluded.

- [x] Deploy the authorized tested PartSnap and checkout repairs.
- [x] Verify live Closing Pro/Crew products and enable their public checkout entries.
- [x] Prove a post-result Stripe TEST payment, provider webhook, entitlement, activation and cancellation.
- [x] Diagnose recorded PartSnap failures and verify gallery recovery without weakening photo checks.
- [x] Preserve unrelated edits, Pro pricing and Preview storage isolation.
- [ ] Obtain real installed-device and permitted-photo PartSnap acceptance.
- [ ] Merge the open PRs after GitHub publishes the exact-head check results.
- [ ] Obtain real customer/pilot, native store and official download evidence.

The technical release is usable now. SplashLens's real-world proof targets are not declared complete.
