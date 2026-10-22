# SplashLens handoff for Grok — October 22, 2026

Start from `codex/splashlens-grok-handoff-20261022` in **both** repositories. This app branch combines the October 21 master, public-artifact security changes, October 19 billing/activation repairs, and isolated Stripe TEST Preview configuration. The site companion includes its October 21 master and public-artifact security changes. These are review branches; publishing them does not merge or deploy them.

## Get the complete code

Repositories: [app](https://github.com/frost831/poolens), [site](https://github.com/frost831/poolens-site).

For a fresh checkout, use:

```sh
git clone --branch codex/splashlens-grok-handoff-20261022 https://github.com/frost831/poolens.git
git clone --branch codex/splashlens-grok-handoff-20261022 https://github.com/frost831/poolens-site.git
```

For each existing clean clone, run:

```sh
git fetch origin --prune
git switch codex/splashlens-grok-handoff-20261022
git pull --ff-only origin codex/splashlens-grok-handoff-20261022
```

If the local branch does not exist, use `git switch --track origin/codex/splashlens-grok-handoff-20261022`. Preserve local changes before switching. Reading only `master` misses open billing, Preview and security work.

## Done and independently checked

- PartSnap preserves portrait/wide evidence, handles truncated model responses and quota recovery, and records bounded failure codes and opaque scan IDs. Camera-denial recovery uses the native gallery bridge and retains prior evidence when the picker is canceled. Quality and fitment checks remain enforced.
- Checkout fixes preserve result-linked offers across redraws, correct plan selection, support timeouts/retries, and correlate deliberate clicks through server events. Activation links stay in their configured environment. Monthly billing uses verified Stripe subscription-item dates and preserves known dates when later webhook data is incomplete.
- October 21 app work includes first-value offers, store-app buying boundaries, PartSnap miss capture and event forwarding fixes. The integrated branch also includes explicit public-asset staging and mandatory artifact guards.
- The approved live Closing Pro and Crew products already exist. On October 19, their price settings and public screens were verified. Two actual Stripe TEST payments proved signed webhook processing, entitlement, activation, matching monthly dates and cancellation in isolated Preview storage. Both test subscriptions were canceled. These are TEST fulfillment proofs, not customer revenue.
- Fresh October 22 local verification: **388 app tests passed, zero failures/skips**; **119 site tests passed, zero failures/skips**. The 120-case deterministic PartSnap benchmark passes, with **zero image-proven cases**. See `docs/handoff/2026-10-22/verification.json` and the adjacent summaries/evidence manifest.
- All 18 registered repositories passed the required Git health check with fetch before publishing. Previously local app/site public-artifact-packaging branches were also published with upstream tracking.

## Git integration state

| Component | Included source | Existing PR |
|---|---|---|
| App base | master `986922a` including #68, #67, #64 and gallery repair #60 | Already on master |
| App public packaging | `a0f08054b636419f5b2d2ada1048ef1dd05b3e28` | [#70](https://github.com/frost831/poolens/pull/70) |
| Billing/activation | `62dc49682907e604b9c0ffd215332c769db3a9e7` | [#62](https://github.com/frost831/poolens/pull/62) |
| Isolated TEST Preview | `a6618b0c7362b0ded93f4084da22e05ecd4b24c1` | [#56](https://github.com/frost831/poolens/pull/56) |
| Combined app code before this documentation | `eeed6dda85558884f9d28d5983c4aa9c8ede71e8` | This branch |
| Site base/security | `8873b21e4704be3e924428682a49f0343bbe7eb2`, including master `cf863ce` and direct paid-plan CTAs | [Site #23](https://github.com/frost831/poolens-site/pull/23) |

At the October 22 handoff check, app #62 and #56 had successful CI. App #70 had successful test CI and a canceled bridge check. Site #23 had successful bridge CI and canceled test CI. Do not treat canceled checks as passing. The new handoff branch checks must be inspected independently. After integrating a combined branch, reconcile superseded PRs by ancestry/diff; do not blindly merge every old PR again.

Android [#41](https://github.com/frost831/poolens/pull/41) and native documentation [#3](https://github.com/frost831/poolens/pull/3) remain separate. They are already published, but Android signing/upload and physical-device acceptance are not proven. Internal TestFlight build 18 notes are historical, not a current store-release claim.

## Environments and existing payment configuration

| Environment | Known configuration / evidence |
|---|---|
| Public app | https://app.splashlens.com |
| Public site | https://splashlens.com |
| October 19 app release | Commit `62dc49682907e604b9c0ffd215332c769db3a9e7`, deployment `ffa236af-7f5f-41a0-8790-8d015fee8e75`, https://ffa236af.poolens.pages.dev |
| Isolated TEST Preview | Source `a6618b0c7362b0ded93f4084da22e05ecd4b24c1`, https://stripe-test-55.poolens.pages.dev and https://4d04c123.poolens.pages.dev |
| Production storage | D1 `f474defb-4337-42ec-b143-7b37fc949761`; KV `05a02cae79bc40039fb7b29559b0a271` |
| TEST Preview storage | D1 `3ab2028b-3980-4dd9-953b-2249120ed547`; KV `306b5f0caa824923abbab3dc6e87d8e1` |
| Stripe merchant | Below Zero Media, `acct_1TJ23t25fqLun6cV` |
| Closing Pro | USD 29 one time / 60 days; `price_1USItu25fqLun6cVx4pWaPuy`; setting `SPLASHLENS_STRIPE_PRICE_CLOSING_PRO_60D` |
| Crew | USD 39/month, four seats; `price_1USIuT25fqLun6cVLNlG88FD`; setting `SPLASHLENS_STRIPE_PRICE_CREW_MONTHLY` |

Existing Pro USD 19/month and USD 149/year were preserved. Teams remains request-access only. Do not recreate these prices. Verify the account identity before using the saved `throttleshare-readiness` CLI profile; its name is not account proof. October 19 CLI live Products writes remained restricted, so the approved products were created through the authenticated Dashboard. No API key values belong in Git or chat.

**Freshness:** production deployment, account authentication, live catalog and payment evidence above were last verified on October 19. October 22 verification covers Git, integrated local tests and staging. Refresh live deployment inventory and asset hashes before making a current production claim or redeploying. No new deployment or payment was performed for this Git handoff.

## Verification and safe deployment commands

From the app checkout:

```sh
npm test
node --test tests/public-artifact-packaging.test.mjs
npm run partsnap:benchmark
```

On Windows, the app staging-only check is:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File tools/deploy-poolens-web.ps1 -StageOnly
```

The browser tests require Playwright. This PC used `SPLASHLENS_PLAYWRIGHT_PATH=C:\Users\sales\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs`. On another machine install/configure the supported Playwright runtime and verify the test summary has no optional skips before claiming equivalent browser coverage.

From the site checkout:

```sh
npm test
node tools/stage-public-assets.mjs
```

App public assets belong in `_deploy/poolens-web`; site public assets belong in `_deploy/public`. Functions compile from the repository working directory and must not be copied into the public asset tree. Never deploy a repository root. Handoff files, docs, tests, tools, credentials and private evidence must stay outside the staged assets. Inspect staging and exact-head CI before release. Keep JavaScript asset/cache versions synchronized when changing app JavaScript.

## Files and evidence

- `docs/handoff/2026-10-22/verification.json`: fresh local counts and source heads.
- `docs/handoff/2026-10-22/evidence-manifest.json`: SHA256 inventory of selected evidence, with dates and scope boundaries.
- `docs/handoff/2026-10-22/historical-2026-10-19/`: selected release, payment, gallery, pricing and failure evidence plus device checklist. These are historical snapshots. This root handoff supersedes their old Git/CI status and instructions to redeploy the older commit.
- `docs/handoff/2026-10-22/app-test-summary.txt`, `site-test-summary.txt`, `partsnap-benchmark.txt`, `staging-verification.json`: current test and staging results.
- The site branch has its own root `GROK_HANDOFF.md` with the companion branch and site checks.

Raw authentication/browser logs, signed activation links, secrets, caches and working directories were excluded. The old dirty `android-twa/app/src/main/res/xml/shortcuts.xml` was preserved locally (SHA256 `09E0C1798AB467D1018AE01B3C44C657C5DBFEB8EDD6FCF588BC875613866101`); Git showed only a line-ending warning, without a substantive patch. Generated Python caches were also preserved locally and excluded.

## Ordered next work / acceptance checklist

1. **Grok / engineering:** fetch both handoff branches and inspect the integrated diff and fresh GitHub checks. Resolve canceled required CI, including site #23 if it remains the integration vehicle. Merge only after the ordinary checks pass. Reconcile overlapping PRs so billing, Preview and security changes are retained.
2. **Grok / release owner:** refresh Cloudflare deployment inventory, custom-domain hashes, checkout catalog and authenticated Stripe account reads. Confirm no later release would be overwritten. Use staged public output for any authorized release, then verify the live fingerprints, protected endpoints, plan screens and Preview/Production isolation.
3. **Physical-device tester with engineering support:** run the archived installed-device acceptance checklist on iPhone and Android using permitted real photos and a verified test account. Record build/OS/time/opaque scan ID; keep codes/tokens private. The October 19 clean audit found three camera denials and two historical quality blocks before any AI attempt, with zero successful PartSnap results. Fresh evidence is required to prove real recognition and saved-packet behavior. Do not weaken image quality or claim fitment without markings/dimensions.
4. **Grok / engineering:** trace fresh failures through permission, gallery, evidence preflight, verified upload, model completion, candidate verification and saved packet. Add targeted regressions for observed failures. Separate a missing attempt, a model failure and an unsafe candidate; the metadata benchmark alone cannot close this acceptance gap.
5. **Product owner / authorized pilot:** verify the real web post-result offer and full paid funnel with actual authorized buyers. Count `checkout_cta_shown`, `checkout_click`, `checkout_session_created`, `checkout_completed`, `subscription_created` and `entitlement_granted` separately. Exclude QA/bots and label unmatched starts `unattributed_server`. TEST payments and independent event totals are not customer conversion or a sequential cohort. Store shells retain their approved billing boundary.
6. **Native build owner:** inspect current Apple/Google console state, build numbers and certificates before continuing #41/#3. Signing, store upload and installed acceptance remain distinct from web release. Obtain official install exports rather than treating `native_shell_open` as an install count.

No further human action is needed to retrieve this work from Git. Physical-device evidence, actual pilot behavior and native credentials/console approvals are the remaining external dependencies; engineering and current-state verification can proceed independently. Outreach, real-card QA and store publishing were not performed as part of this handoff.
