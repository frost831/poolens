# Console / Simulator Parity - June 22, 2026

## Native Wrapper

The iOS app is a SwiftUI `WKWebView` wrapper. Source inspection confirms the native wrapper opens:

`https://app.splashlens.com/?store=ios`

Allowed hosts are:

- `app.splashlens.com`
- `splashlens.com`
- `www.splashlens.com`

If a same-host URL loses `store=ios`, the wrapper appends it again.

## Simulator Proof

- Simulator: `SplashLens ASC iPhone 15 Pro Max 2026-06-22`
- UDID: `27352555-342C-4291-A807-AF3868CBE9AD`
- Runtime: iOS `26.5`
- Screenshot size: `1290 x 2796`

## Smoke Coverage

Confirmed in the native iOS build:

- App opens to SplashLens.
- First screen says "Find the part. Fix the stop."
- First quick action is PartSnap Parts ID.
- PartSnap scanner starts and requests camera permission only when starting scanner mode.
- PartSnap primer says to shoot the part, then the label.
- Live simulator-camera PartSnap result uses conservative low-confidence language.
- Result includes confidence ladder, visible proof, next proof, escalation/copy packet, mystery feedback path, and verify-before-ordering language.
- Manual lookup works for `E05`.
- Dosing calculator renders.
- Service note/report screen renders.
- Route Brain screen renders.

## First-Run Rendering Note

On the fresh simulator install, early screenshots captured a blank WebKit surface before the app was warmed/relaunched. After relaunch, the native wrapper rendered consistently and the required screenshot set was captured from the native build.

Before App Review submission, install the uploaded TestFlight build on a real iPhone and verify first launch from a clean install does not present a persistent blank screen.

## App Store Connect Parity

The uploaded build is `1.0.1 (8)`.

- Validation: passed.
- Upload: passed.
- Delivery UUID: `22440ad7-c45e-4f47-900c-2d5030ae898e`
- Build status: `VALID`
- Import status: `VALID`
- Audience type: `APP_STORE_ELIGIBLE`

## Current TestFlight Build Parity

The current uploaded build after the June 23 cache-policy fix is `1.0.1 (9)`.

- Delivery UUID: `c5b4aae5-b5bb-4b40-b9a1-dd3c2e994e08`
- Last verified build status: `VALID`
- Last verified import status: `VALID`
- Last verified audience type: `APP_STORE_ELIGIBLE`

## June 24 Live Web Parity

The report UI polish was deployed to the live web payload loaded by build `1.0.1 (9)`.

- Production URL: `https://app.splashlens.com/?store=ios`
- Final deployment URL: `https://b20d395d.poolens.pages.dev`
- Service worker cache key: `splashlens-v9-report-polish`
- Live `/api/events` POST: `{"ok":true,"stored":true,"alertQueued":false,"emailConfigured":true}`

Live Playwright mobile checks on production:

- Home: no mojibake markers, no horizontal overflow.
- Report: no mojibake markers, no horizontal overflow.
- PartSnap: no mojibake markers, no horizontal overflow.
- E05 search: no mojibake markers, no horizontal overflow.
- Expanded E05 detail: no mojibake markers, no horizontal overflow.
- Browser console errors: none.
- Failed network requests: none.
- Store-mode More panel: no direct Stripe/web checkout CTA.

Evidence screenshots are in:

`output/release-gate-2026-06-23/live-v9-*.png`
