# SplashLens device and billing acceptance — 2026-11-23

This packet continues the approved PC web/backend/Android work and Mac iOS lane. It does not certify untested devices or authorize real-money purchases.

## Source and release

- Canonical PC app: `C:\Users\sales\Documents\Codex\Flagships\poolens` (`frost831/poolens`). The old Dropbox and dated clones are historical, not release sources.
- Canonical site: `C:\Users\sales\Documents\Codex\Flagships\poolens-site`; no marketing content changed in this release.
- Feature branch: `fix/splashlens-hinge-safe-layout-20261123`, based on master `6afa1a1b87efbdb484e3d599fe2c9872fa29285a` (PR #98 merged). The PR and Git history identify the final reviewed release revision.
- Web asset version: `20261123-hinge-safe-1`; service worker: `splashlens-v74-hinge-safe`.
- Android candidate: package `com.splashlens.fieldtools`, version `1.0.13`, version code `14`. Production remains the prior Play release; this packet does not claim candidate 14 was uploaded.

## Changes and proof

- A genuine two-segment Chromium emulation reproduced navigation and account actions crossing a separating hardware hinge. CSS now keeps interactions and dialogs in a safe first pane for horizontal or vertical separators. This is compatibility behavior, not an optimized two-pane UI.
- The Android launcher no longer forces portrait. The manifest explicitly allows resizing, and the web/TWA orientation is `any`.
- Account input survives folding/resizing. Keyboard, XSS escaping, offline lookup and manual PartSnap recovery remain covered.
- 478 app tests passed with browser fixtures enabled, zero failures and zero skips. Two tests assert actual viewport-segment media queries and critical control bounds. Direct CDP screenshots preserve the simulated hinge.
- WebKit engine checks passed at 320, 390 and 430 CSS pixels, including a 300-pixel keyboard-height viewport. These are browser-engine checks, not physical iPhone or shipping WKWebView proof.
- Debug APK and unsigned release AAB built successfully. Merged APK inspection confirms BILLING permission, resizing and orientation `any`.
- AAB SHA-256: `A869D914337E6BF6FE959C3DE4454A9494DD69EEBB5966B9EC109D64DAD3996D` (unsigned).
- Debug APK SHA-256: `A4DC9F689E08DBD616F8294CDBCEFB4924F13911A7CDC52822672F3A52AB4885`.
- Live Stripe checkout review and cancellation passed for monthly $19, annual $149, Closing $29 and Crew $39. No payment was submitted.
- The 120-case PartSnap metadata benchmark passes but contains zero image-proven cases. It is not camera identification accuracy evidence.

## Play configuration and remaining acceptance

Both native subscriptions have active US-only base plans, verified with the existing scoped service account:

| Product | Base plan | Period | USD |
| --- | --- | --- | --- |
| `splashlens_pro_monthly` | `monthly` | P1M | 19.00 |
| `splashlens_pro_yearly` | `annual-v1` | P1Y | 149.00 |

The existing merchant profile now allows catalog configuration. Bank/tax/payout details remain owner-managed. No payment method was added by this work.

Production native billing and production test purchases remain disabled. The production purchase-ledger migration must wait for native acceptance. Preview alone has billing/test-purchase flags enabled, the existing scoped credential, a separate encrypted ledger key and existing preview D1 tables. Never copy preview test-purchase settings into production.

Required native evidence is still pending: Play-installed app on the signed-in licensed QA device, signed candidate 14, zero-real-money purchase/restore/revocation, account binding and live PartSnap image handling. On the last direct PC readback, emulator `5572` had zero Google accounts and no SplashLens package despite user acknowledgments. Its foreground screen was a Google sign-in flow after a stylus tutorial overlay; do not infer installation from an acknowledgment.

The configured original upload key at `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore` is absent on PC. Recover the original approved key; do not generate a replacement, reset the Play upload key or put credentials in Git/chat. The AAB above cannot be uploaded as-is because it is unsigned.

## Mac iOS lane

The user authorized the existing SplashLens Mac lane to continue iOS work. Use the existing SplashLens ASC task, not a repurposed Android/Bay2Course task. Historical shipping wrapper: `/Volumes/MacBuildAPFS/SplashLensRelease20261029/privacy-repair/`; historical ASC client: `/Volumes/MacBuildAPFS/SplashLensRelease20261029/tools/asc-client.mjs`. Refresh paths and preserve local changes before building. The canonical `ios/` stub is not proof of the actual shipping wrapper.

1. Read current master and this packet, verify the clean revision and retain local shipping/signing work. Do not change backend, D1, merchant configuration or Android release tracks.
2. Read current App Store Connect version/build/review state. The public listing was verified as version 1.0.11, minimum iOS 17; it does not expose the current native build number.
3. Verify the available Xcode/iPhone Duo simulator runtime and actual shipping wrapper resizing, rotation, safe areas and keyboard. The iPhone Duo is Apple's foldable iPhone; generic Chromium hinge emulation does not certify it.
4. Test simulator/gallery/manual recovery, account sheet, privacy disclosures, store billing guard and restore paths. Record exact runtime, wrapper/build and results. Do not initiate real-money purchases.
5. Preserve the user's explicit hold on remotely turning on a physical iPhone camera. No remote physical-camera activation is authorized here.
6. Fix native-only issues and run tests before a signed build. Avoid duplicate uploads when a hosted-web change is sufficient. Report exact remaining signing/runtime/store gates rather than claiming all iOS devices passed.

Official listings: https://apps.apple.com/us/app/splashlens/id6763644905 and https://play.google.com/store/apps/details?id=com.splashlens.fieldtools .

No ASO claims, privacy policy, AI processing, prices, retention or subscription terms changed in this patch. PartSnap remains reference assistance: confirm against manufacturer documentation and qualified judgment. FAQ content is not analytics data.

## Local private evidence

PC evidence is outside Git under `C:\Users\sales\Documents\Codex\2026-10-19\sp\outputs\release-20261123\`, including hinge screenshots, WebKit checks, live release checks and the Play catalog screenshot. Full test log: `..\hinge-full-tests-20261123.txt`; catalog readback: `..\play-catalog-20261123.json`. Do not commit private console screenshots, encrypted credentials, QA session state or build binaries.

Before final release, require green CI, clean reviewed source, safe staged deployment and current custom-domain fingerprints. Real device/native billing proof remains a separate release gate.
