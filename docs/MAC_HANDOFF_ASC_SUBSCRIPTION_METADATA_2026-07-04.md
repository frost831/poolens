# Mac Handoff: Finish SplashLens ASC Subscription Metadata - 2026-07-04

Goal: open App Store Connect, finish the missing subscription metadata for SplashLens PartSnap Pro, attach the subscription to the app version if ASC allows it, save proof artifacts, commit, and push so PC Codex can verify.

## Pull Current Branch First

```bash
cd ~/Dropbox/Projects/poolens
git fetch origin
git checkout feature/splashlens-usage-alerts-dashboard
git pull --ff-only
git status --short
```

Do not overwrite unrelated local work. If the Dropbox checkout is dirty, use a fresh clone:

```bash
cd ~
git clone https://github.com/throttleshare/poolens.git SplashLens-asc-subscription-finish-2026-07-04
cd SplashLens-asc-subscription-finish-2026-07-04
git checkout feature/splashlens-usage-alerts-dashboard
```

## Current Known State

- App Store Connect app ID: `6763644905`
- Bundle ID: `com.splashlens.app`
- Uploaded valid build: `1.0.2 (11)`
- Subscription group exists: `PartSnap Pro`
- Subscription products exist:
  - `partsnap_pro_monthly`
  - `partsnap_pro_annual`
- Current blocker: products show `MISSING_METADATA`.

Evidence already returned from previous Mac run:

- `SplashLens-ios-proof-2026-07-03/go-no-go.md`
- `SplashLens-ios-proof-2026-07-03/console-parity.md`
- `SplashLens-ios-proof-2026-07-03/asc-ui-partsnap-pro-products.png`
- `SplashLens-ios-proof-2026-07-03/asc-ui-subscription-group-products.png`

## App Store Connect Windows To Open

Open these in browser tabs/windows:

1. App Store Connect > My Apps > SplashLens.
2. SplashLens > Features or Monetization > Subscriptions.
3. Subscription group: `PartSnap Pro`.
4. Product: `partsnap_pro_monthly`.
5. Product: `partsnap_pro_annual`.
6. SplashLens > App Store > iOS app version / prepare for submission.
7. SplashLens > TestFlight > Build `1.0.2 (11)`.

## Fill Subscription Metadata

Use conservative copy. Do not claim diagnosis, guaranteed identification, or manufacturer endorsement.

### Subscription Group

Reference name:

`PartSnap Pro`

Display name:

`PartSnap Pro`

Description, if ASC asks for group-level description:

`Optional paid scanner access for SplashLens field reference workflows. Manual lookup, calculators, reports, filters, and checklists remain free.`

### Monthly Product

Product ID:

`partsnap_pro_monthly`

Reference name:

`PartSnap Pro Monthly`

Display name:

`PartSnap Pro Monthly`

Description:

`Monthly access to optional PartSnap Pro scanner workflows for pool service field reference. Manual lookup and core SplashLens tools remain free.`

Duration:

`1 Month`

Price:

Use the intended low introductory paid tier if already decided in ASC/Stripe. If no price was already chosen, pick a conservative starter price and record it in proof. Do not guess in final report; state the actual selected price.

### Annual Product

Product ID:

`partsnap_pro_annual`

Reference name:

`PartSnap Pro Annual`

Display name:

`PartSnap Pro Annual`

Description:

`Annual access to optional PartSnap Pro scanner workflows for pool service field reference. Manual lookup and core SplashLens tools remain free.`

Duration:

`1 Year`

Price:

Use the intended annual tier if already decided in ASC/Stripe. If no price was already chosen, pick a conservative starter annual price and record it in proof. Do not guess in final report; state the actual selected price.

## Review Screenshot / Metadata

If ASC asks for review screenshot:

- Use a screenshot showing the SplashLens scanner/paywall/native billing entry point if available.
- If only a web/store-shell screenshot is available, capture `https://app.splashlens.com/?store=ios` and the PartSnap Pro limit/restore screen.
- Save screenshot path in the proof file.

Reviewer note for subscriptions:

`PartSnap Pro is optional paid scanner access. SplashLens remains usable without purchase: manual lookup, calculators, reports, filters, and checklists are free. SplashLens is a field reference aid and does not replace manuals, manufacturer guidance, or qualified technician judgment.`

## Attach Subscription To App Version

In App Store Connect:

- Open SplashLens iOS app version submission area.
- Attach the first auto-renewable subscription if ASC requires/permits it before review.
- Attach build `1.0.2 (11)` if not already attached.
- Do not submit to App Review unless all subscription metadata is complete and ASC shows no missing metadata warnings.

If ASC still blocks submission, capture the exact warning text and screenshot.

## Cloudflare Secret Reminder

Do not put secrets in Git.

If Apple App Store Server API key can be created during this ASC session, create it and install into Cloudflare Pages project `poolens` as encrypted secrets:

- `APPLE_APP_STORE_CONNECT_ISSUER_ID`
- `APPLE_APP_STORE_CONNECT_KEY_ID`
- `APPLE_APP_STORE_CONNECT_PRIVATE_KEY`
- `SPLASHLENS_IOS_BUNDLE_ID=com.splashlens.app`

If you cannot safely install these from Mac, record the exact key ID / issuer ID location and leave private key handling for PC/user manual secure entry.

## Proof Folder To Create Or Update

Create:

`SplashLens-ios-proof-2026-07-04`

Required files:

- `asc-subscription-metadata.md`
- `asc-submission-readiness.md`
- `cloudflare-apple-secrets-status.md`
- `go-no-go.md`

Required screenshots:

- Subscription group `PartSnap Pro` complete.
- Monthly product metadata/pricing page.
- Annual product metadata/pricing page.
- ASC product status after saving.
- App version page showing build `1.0.2 (11)` and any attached subscription/submission state.
- Any ASC blocking warning if submission cannot proceed.

## Proof File Templates

`asc-subscription-metadata.md`:

```md
# ASC Subscription Metadata - SplashLens - 2026-07-04

- Subscription group status:
- Monthly product status:
- Monthly price selected:
- Monthly territories:
- Annual product status:
- Annual price selected:
- Annual territories:
- Review screenshot used:
- ASC warnings remaining:
```

`asc-submission-readiness.md`:

```md
# ASC Submission Readiness - SplashLens - 2026-07-04

- Build attached:
- Build number:
- Subscription attached to app version:
- Ready for App Review:
- Not submitted reason, if not submitted:
- Submitted to App Review, if yes:
```

`cloudflare-apple-secrets-status.md`:

```md
# Cloudflare Apple Secrets Status - 2026-07-04

- Issuer ID installed:
- Key ID installed:
- Private key installed:
- Bundle ID installed:
- Notes:
```

`go-no-go.md`:

```md
# Go / No-Go - SplashLens ASC Subscription Finish - 2026-07-04

## Verdict

GO / HOLD / NO-GO

## Completed

- 

## Remaining

- 

## Evidence

- 
```

## Git Save And Push Requirement

After the ASC work/proof capture:

```bash
git status --short
git add docs/MAC_HANDOFF_ASC_SUBSCRIPTION_METADATA_2026-07-04.md SplashLens-ios-proof-2026-07-04
git commit -m "Add SplashLens ASC subscription metadata proof"
git pull --rebase origin feature/splashlens-usage-alerts-dashboard
git push origin feature/splashlens-usage-alerts-dashboard
git status --short --branch
```

If source files changed, include them in the commit only if the change was intentional and describe it in `go-no-go.md`.

## Report Back To PC Codex

Return:

- Commit hash pushed.
- Whether ASC products still show `MISSING_METADATA`.
- Whether build `1.0.2 (11)` is attached to the app version.
- Whether the first subscription is attached to the app version.
- Whether App Review was submitted or held.
- Whether Apple Server API Cloudflare secrets were installed.
