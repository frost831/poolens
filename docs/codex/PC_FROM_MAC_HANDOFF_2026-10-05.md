# PC Handoff From Mac - 2026-10-05

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
