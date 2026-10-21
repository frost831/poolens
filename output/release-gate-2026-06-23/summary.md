# SplashLens Character Cleanup Release Gate - June 23, 2026

## Release Surface
- Cloudflare Pages project: `poolens`
- Production domain: `https://app.splashlens.com`
- Final production deployment: `a0598375-da67-4098-bd10-bd6e0d202be7`
- Final deployment URL: `https://a0598375.poolens.pages.dev`

## Source / Artifact Checks
- `node --check js/app.js` passed.
- `node --check js/data.js` passed.
- `node --check js/errors.js` passed.
- `node --check sw.js` passed.
- `node --check functions/api/*.js` passed.
- Staged Pages artifact: `/tmp/splashlens-pages-deploy`
- Staged artifact size: `700K`
- Staged artifact file count: `27`
- Staged character scan found no non-ASCII/mojibake markers in deployed files.

## Live Verification
- `https://app.splashlens.com/?store=ios` returned `200`.
- Live source scan found no `â`, `Â`, `Ã`, replacement glyphs, smart punctuation, entity dashes, or `lower Load Pool`.
- Live service worker cache key: `splashlens-v8-production-ui`.
- Live `/api/events` POST returned `{"ok":true,"stored":true,"alertQueued":false,"emailConfigured":true}`.
- Browser smoke on live production:
  - Home title: `Find the part. Fix the stop.`
  - PartSnap Parts ID visible.
  - E05 search result present.
  - Expanded error detail had no bad characters.
  - Report tab had clean `Load Pool` text.
  - Console errors: none.

## Native Wrapper Checks
- Device build succeeded.
- Installed on connected iPhone as `com.splashlens.app` version `1.0.1` build `8` before the final archive.
- Team/signing: `2XSLXV9H74`, Apple Development certificate.
- Bundle reload policy changed from `.returnCacheDataElseLoad` to `.reloadIgnoringLocalCacheData`.
- Physical iPhone launch later succeeded after the device was unlocked.
- Simulator wrapper build, install, launch, and home screenshot succeeded.

## TestFlight / App Store Connect Upload
- Build number bumped to `9` because build `8` was already used.
- Archive: `build/archive/SplashLens-1.0.1-9.xcarchive`
- IPA: `build/export/SplashLens-1.0.1-9/SplashLens.ipa`
- Final IPA signing: `Apple Distribution: Joshua Frost (2XSLXV9H74)`
- Final IPA profile: `iOS Team Store Provisioning Profile: com.splashlens.app`
- Final IPA `get-task-allow`: `false`
- Apple validation: `VERIFY SUCCEEDED with no errors`
- Upload: `UPLOAD SUCCEEDED with no errors`
- Delivery UUID: `c5b4aae5-b5bb-4b40-b9a1-dd3c2e994e08`
- App Store Connect status: `VALID`
- Import status: `VALID`
- Audience: `APP_STORE_ELIGIBLE`
- ASC presence: `true`

## Evidence Files
- Live home screenshot: `output/release-gate-2026-06-23/live-final-home-mobile.png`
- Live expanded error screenshot: `output/release-gate-2026-06-23/live-final-error-expanded-mobile.png`
- Live report screenshot: `output/release-gate-2026-06-23/live-final-report-mobile.png`
- Simulator wrapper home screenshot: `output/release-gate-2026-06-23/simulator-final-wrapper-home.png`
- Live fetched files: `output/release-gate-2026-06-23/live-final-*.{html,js}`

## Go / No-Go
- Web character cleanup: go.
- TestFlight upload for build `1.0.1 (9)`: go, completed.
- App Review submission: no-go until fresh physical iPhone screenshots are captured from the cleaned build.

## Report UI Polish Release Gate - June 24, 2026 UTC

### Release Surface
- Production domain: `https://app.splashlens.com`
- First polish deployment URL: `https://5ff597ec.poolens.pages.dev`
- Final cache-bumped deployment URL: `https://b20d395d.poolens.pages.dev`
- Service worker cache key: `splashlens-v9-report-polish`

### What Changed
- Visit Report first screen was simplified into four large field actions: Pool, Readings, Proof, Work Done.
- Report sections now lead with four numbered core steps instead of a long paperwork wall.
- Chemicals/cost and equipment/follow-up fields are collapsed until opened.
- Date fields now use the same full-height mobile styling as other inputs.
- Dictation and optional chemical controls were enlarged for field tap targets.
- Copied report divider was shortened from an accidentally huge repeated separator to a normal divider.

### Local Verification
- `git diff --check` passed.
- `node --check js/app.js` passed.
- Source scan found no `â`, `Ã`, `Â`, replacement glyphs, `lower Load Pool`, or encoded mojibake markers in app files.
- Local mobile Playwright audit at `393 x 852` found:
  - No bad character markers.
  - No horizontal overflow.
  - No small actionable controls after checkbox label targets were considered.
- Local Python static server produced expected `/api/events` `501` POST errors only because Cloudflare Functions are not available on that server.

### Live Verification
- `https://app.splashlens.com/?store=ios` returned the polished report source.
- `https://app.splashlens.com/sw.js` returned `splashlens-v9-report-polish`.
- Live `/api/events` POST returned `{"ok":true,"stored":true,"alertQueued":false,"emailConfigured":true}`.
- Live Playwright mobile audit on production had:
  - Console errors: none.
  - Failed network requests: none.
  - Home, Report, PartSnap, E05 search, and expanded E05 all had no bad character markers.
  - Home, Report, PartSnap, E05 search, and expanded E05 all had no horizontal overflow.
  - Store-mode More panel showed no Stripe, checkout, buy-now, subscribe-now, payment-link, or card-required CTA.

### Evidence Files
- Live home: `output/release-gate-2026-06-23/live-v9-home.png`
- Live report top: `output/release-gate-2026-06-23/live-v9-report-top.png`
- Live report proof: `output/release-gate-2026-06-23/live-v9-report-proof.png`
- Live PartSnap: `output/release-gate-2026-06-23/live-v9-partsnap.png`
- Live E05 list: `output/release-gate-2026-06-23/live-v9-error-e05.png`
- Live E05 expanded: `output/release-gate-2026-06-23/live-v9-error-e05-expanded.png`
- Live store-mode More panel: `output/release-gate-2026-06-23/live-v9-more-store.png`

### TestFlight Decision
- No new native upload was made for this report-polish pass.
- Reason: the change is in the live web payload loaded by the already-uploaded iOS wrapper build `1.0.1 (9)`.
- Build `1.0.1 (9)` already contains the native cache-policy fix and remains the TestFlight/App Store Connect build for this payload.
- App Review submission remains no-go until fresh physical iPhone screenshots are captured from the installed build.
