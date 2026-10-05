# SplashLens Store Wrapper Handoff

Updated: October 5, 2026

## Current App Target

- URL: `https://app.splashlens.com`
- Type: offline-first PWA
- Web monetization: FreeCore tools plus Splash Lens Pro Unlimited checkout links where paid access is available
- Store wrapper mode: use `https://app.splashlens.com/?store=ios` or `https://app.splashlens.com/?store=android` so native app review sees a FreeCore build with no direct Stripe upgrade CTAs.
- Upgrade handoff: native store mode may show an `Unlock on splashlens.com` handoff, but it must open Safari/Chrome to `https://splashlens.com/` and must not load Stripe checkout inside the iOS WKWebView, Android TWA, or any fallback WebView.
- Offline behavior: manual lookup, calculators, filter guides, checklists, reports, and cached app shell
- Online-only behavior: Error Scan, PartSnap, and Test Strip AI scanner

## Native Camera / Gallery Contract

- iOS candidate `1.0.11 (18)` injects `window.SplashLensNative.pickGalleryPhoto()`.
- The bridge returns a Promise resolving to `{ requestId, name, type, dataUrl }` for one user-selected JPEG, normalized to at most 1600 pixels on its longest edge.
- Cancellation rejects with `gallery_cancelled`; concurrent requests reject with `gallery_busy`. Neither should reopen a browser picker.
- The PartSnap deny path calls the bridge first when present, then falls back to the browser file picker.
- Expected events from the PWA deny path: `partsnap_camera_requested`, `partsnap_camera_granted`, `partsnap_camera_denied`, and `partsnap_gallery_picked`.
- The Android TWA relies on Chrome permission prompts and the browser photo picker fallback; it declares `CAMERA` for scanner use and does not request broad media-library access.

## Android Fast Path

Submit a Trusted Web Activity wrapper to Google Play around:

`https://app.splashlens.com/?store=android`

Suggested listing copy:

> SplashLens is a FreeCore field app for pool service technicians. Search equipment codes, calculate chemical doses, create visit notes, follow filter guides, and use 3 included PartSnap app scans a month for scanner assistance.

Short description:

> FreeCore pool tech field app: codes, dosing, service notes, and 3 PartSnap scans/month.

## iOS Fast Path

The existing SwiftUI/WKWebView wrapper loads:

`https://app.splashlens.com/?store=ios`

Review framing:

- This is a utility/reference app for pool service professionals.
- Manual tools work offline after first load.
- AI camera scanning requires internet and is user-initiated.
- Camera permission wording: SplashLens uses the camera only when the user chooses PartSnap/scanner tools to read pool and spa equipment labels, markings, displays, and test-strip photos for field reference.
- Photo picker wording: a selected pool/spa equipment photo is used as the fallback when camera access is denied or unavailable.
- No account is required.
- Pool/customer data is stored locally on device browser storage.
- Store wrapper mode does not show direct Stripe checkout buttons. Keep it that way unless native IAP or approved external-link entitlement handling is added.

## Store Screenshot Checklist

Before final screenshots, run `docs/ASO_THUMBNAIL_GATE_2026-05-28.md` and save the competitor board, screenshot frame plan, metadata drafts, and claim-parity check under `aso/`.

Capture these screens on phone dimensions:

- Home/rescue screen with quick actions.
- Error-code lookup result.
- Chemical dosing calculator.
- AI scanner mode selector or scan result.
- PartSnap result with part/search workflow.
- Service note/report screen.

## Known Launch Constraints

- Current evidence and release blockers: `docs/store/MAC_CODEX_NATIVE_EXECUTION_2026-10-05.md`. A successful archive is not a TestFlight upload.
- Android candidate is `1.0.9` / code `10`, target SDK `36`; the validated AAB is unsigned pending the existing upload key.
- PC must publish the native gallery adapter and external upgrade hooks, including PWA cache invalidation, before native releases are sent.
- Native store submission still needs Mac/Xcode or store-wrapper console access.
- App Store Connect and Google Play Console final actions cannot be completed from this Windows repo alone.
- If Apple asks about data collection, use the public privacy page: `https://splashlens.com/privacy.html`.
- If Google asks for data safety, declare local app data storage and user-submitted images for AI scanner processing. Email collection and Stripe checkout are on the web/marketing surfaces, not required inside the store wrapper.
- If Splash Lens Pro Unlimited is added inside the native app later, use Apple In-App Purchase / Google Play Billing or a policy-approved external purchase flow before exposing upgrade CTAs inside the store build.
