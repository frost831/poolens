# PC Handoff From Mac - 2026-10-05

## Latest: TestFlight Available, Android Transfer Pending

Read this section first; it supersedes earlier upload holds below. Under the user's explicit override after the missing acceptance evidence was reported, Mac uploaded the unchanged validated iOS candidate **1.0.11 (18)** for `com.splashlens.app`. Delivery UUID / ASC build ID: `979e0aa4-0abc-4c1b-a656-2ad9cc1e54b8`. ASC confirms **VALID** processing, **IN_BETA_TESTING**, and membership in the existing internal group. No external beta review, App Review, new testers, or public release was submitted.

PC: review the remaining proof packet in `docs/store/MAC_CODEX_NATIVE_EXECUTION_2026-10-05.md`; do not modify the deployed web app for this native acceptance task or repeat historical repair instructions. Remote iPhone testing remains paused and the QA simulator remains shut down. Installed-native acceptance and a verified-account full AI scan are still unverified, despite the successful upload and 198/198 serial regression. Do not report MAC-04 as fully accepted.

Securely transfer the existing key from `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`, alias `splashlens_upload`, into `/Users/macbookpro/SecureKeys/splashlens/` on Mac and provide only the resulting local path. The prepared directory is mode `0700`; Mac must secure the file to `0600` and verify the actual certificate before signing. Supply passwords through a private local credential mechanism, not Git/chat. No secure PC connection or transferred key is available to Mac yet.

Mac read the current Play **upload** certificate for `com.splashlens.fieldtools`: SHA256 `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`. This matches the historical expected certificate but does not validate the absent keystore. Do not substitute an app-signing certificate, generate another key, reset the upload key, or send pre-existing Play publishing changes. Android `1.0.9` code `10` remains unsigned and unuploaded.

No deployed web, Stripe, PWA worker, site, or production metrics import was changed. Mac continues to own Apple release signing/build numbers/uploads. Private binaries, signing assets, raw metrics, and tester details are not in this public repository. Fetch `origin/mac/native-tickets-2026-10-05` and review PR #3 for this documentation-only status update.

## Current Status After Web Clearance

This is the pre-upload verification snapshot; the latest TestFlight result above supersedes its upload hold. Earlier deployment/signing/CTA blockers below are historical where superseded. Mac synced `origin/master` at `70cfa0b`. The PC gallery decoding fix, v25 offline root-shell cache, and native purchase-CTA suppression are live. There are no remaining Mac code changes against current master, only status documentation.

Done: signed iOS `1.0.11 (18)` IPA passed archive validation with no errors; serial regression passed 198/198 with browser integration; fresh desktop iOS/Android store-mode offline reload and opening `CHECK SALT` passed; gallery decoding entered the actual existing capture path once under production CSP with a mocked picker/public fixture; tested store purchase surfaces suppressed checkout and external purchase CTAs; ordinary web checkout remained visible. No IAP added.

Not done: actual installed-native camera-denial/gallery acceptance and full verified-account AI analysis. Remote iPhone testing is stopped at the user's request, and the QA simulator is shut down after failing to finish startup. Browser transport evidence is not installed-native or AI accuracy evidence. No TestFlight or Play internal upload occurred.

Android: securely transfer the **existing** `splashlens-upload.keystore`, alias `splashlens_upload`, from the documented PC location into `/Users/macbookpro/SecureKeys/splashlens/` on Mac and provide only its local file path. The destination has owner-only `0700` permissions; the actual key has not been located, secured, or verified. Keep passwords out of Git/chat and preserve the existing certificate identity; do not generate a replacement key. Mac will verify against Play before signing.

Metrics: official Play CSV is already retained privately, dry-run accepted 27 records. Apple report definitions still have no download/crash instances. No production import was sent. Do not commit raw metrics or signing assets to this public repository.

Next: supply the secure key path and a verified live-AI test profile; keep remote iPhone testing stopped until the user explicitly resumes it; finish permitted native/device acceptance and artifact gates before store uploads. Details and private evidence paths are in `docs/store/MAC_CODEX_NATIVE_EXECUTION_2026-10-05.md`.

## Resume Update After PC Deployment

The original integration landed in PC revision `bd83d0c`. Read the latest status in `docs/store/MAC_CODEX_NATIVE_EXECUTION_2026-10-05.md`; the earlier checklist below is historical where superseded.

**PC action now:** deploy the small native-gallery adapter correction in this branch. Production CSP blocks the old `fetch(dataUrl)`, so selection currently reopens another picker. Mac changed only the adapter to decode base64 locally and added its regression test; PC must own deployment and script/service-worker cache invalidation. Keep production CSP unchanged.

The iOS distribution IPA exported and passed signing/identity checks, but remains unuploaded. Resolve the native purchase-link policy hold in `docs/ops/native-web-bridge-readiness-2026-10-05.md` before store uploads. ASC confirms 175 available territories; native upgrade links are not storefront-gated. Opening a browser does not prove eligibility. No IAP is authorized. Android still requires the existing upload key, not another app's key or a replacement.

Also investigate offline cold reload: fresh production browser session, controlling activated worker, cached `/index.html`, but offline `/?store=ios` reload returns `net::ERR_FAILED`. No worker edits were made by Mac. Repeat installed-device/offline acceptance after correction; do not infer a pass from in-memory lookup or unit tests.

## Fetch This Work

Repository: `frost831/poolens`.

```sh
git fetch origin mac/native-tickets-2026-10-05
git log --oneline origin/docs/codex-full-boat-2026-10-05..origin/mac/native-tickets-2026-10-05
```

Review PR: https://github.com/frost831/poolens/pull/3

Read `docs/store/MAC_CODEX_NATIVE_EXECUTION_2026-10-05.md` and `STORE_WRAPPER_HANDOFF.md` on that branch. This is a branch off the docs branch, not a production merge candidate without reconciliation against current master. Preserve all PC work and local changes.

## PC Work Needed To Unblock MAC-04

Integrate the narrow web adapter changes in `js/app.js` and `index.html` into the PC production branch. Resolve overlapping PC camera/funnel work function by function; do not overwrite whole files or blindly cherry-pick the native commits.

- Camera denial/unavailability calls `requestGalleryPhotoFallback()` from Pick Gallery. Remove the file input's camera-forcing `capture` attribute.
- Prefer `window.SplashLensNative.pickGalleryPhoto()` when available; its Promise returns `{ requestId, name, type, dataUrl }`. Feed it through the existing PartSnap image/upload path. Cancellation (`gallery_cancelled`) and concurrency (`gallery_busy`) must not open a second picker. Other native failures may use the browser picker.
- Preserve the lighting tip and agreed camera/gallery events. Do not add a deny-path paywall or rewrite PartSnap CV.
- Keep `store=ios|android` as the checkout-hiding source of truth across account, paid-lane, lookup/result/post-value and scan-limit surfaces. No native purchase/restore bridge, StoreKit, Play Billing or Stripe checkout inside the wrapper.
- Store upgrade uses an external browser link to `https://splashlens.com/?upgrade=splashlens-pro`; do not send that link back into the wrapper or add `store=` to it. Web checkout behavior remains PC-owned.
- PC owns production deployment and PWA cache/version invalidation. These files are intentionally unchanged by Mac. Confirm deployed/cached clients actually receive the approved adapter before notifying the user that native release testing can resume.
- Verify both store modes have no checkout URL and web mode retains checkout. Reconcile/adapt the focused tests in `tests/native-wrapper.test.mjs` and `tests/checkout-funnel.test.mjs`; run `npm test` and `npm run partsnap:benchmark`.

Mac's last live-app audit still found older native-billing hooks and no new gallery adapter/external helper. This is recorded evidence, not a claim about a later PC deployment.

## Native Ownership / Release State

Mac owns Apple native release code, signing, build numbers, archives and uploads. PC must not edit these or create/revoke Apple certificates or dispatch Apple release workflows. Review the native changes for context; do not reimplement them.

- iOS candidate: `com.splashlens.app`, `1.0.11 (18)`. Simulator and development archive built; distribution export still needs user handling of the Mac signing-key prompt. No TestFlight or App Review submission occurred.
- Android candidate: `com.splashlens.fieldtools`, `1.0.9`, code `10`, target SDK `36`. Release bundle validated but unsigned; no internal-track upload occurred.
- Existing Android upload key is documented on PC at `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`, alias `splashlens_upload`. Coordinate secure transfer of the existing key to Mac; never commit it, paste passwords into chat or generate a replacement key.
- After PC hooks are live and signing is available, Mac must finish artifact checks, installed-device smoke tests and the release gate before store uploads. Successful source tests/archive creation do not mean MAC-04 is complete.

## Metrics Handoff

Official Play install-event CSV exported and normalized; importer dry-run accepted 27 records. The import-ready local path is `/Users/macbookpro/poolens-mac-native-2026-10-05/exports/store-metrics/google-play-installs-2026-10-05.csv`. File SHA256: `835e7c6508eef14f0c15ebb9b09c57448c3936d669471174924840632189d4b6`.

This public Git repository does not contain the private CSV or native binaries/signing assets. Obtain the CSV through a private transfer before running the PC-owned importer. No production import has been sent. Keep only the all-countries series, not overlapping country totals; do not invent absent days.

ASC analytics snapshot was requested; downloads/crashes instances were not available at the final Mac check. Actual ASC SKU is `com.splashlens.app`, while the importer currently filters `splashlens-ios-2026`; PC owns reconciling that filter before an Apple import.
