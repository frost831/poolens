# Mac Handoff - SplashLens LanguageLayer ASC - 2026-06-17

## Done

- PC wired LanguageLayer into the active SplashLens/Poolens web and API surfaces.
- PC added Spanish-forward language selection behavior in the active app path.
- PC syntax checks passed for JavaScript/API surfaces.
- PC repo scan found native iOS project:
  - `SplashLens.xcodeproj`
  - `ios/SplashLens/Info.plist`
- Current identifiers seen on PC:
  - Bundle: `com.splashlens.app`
  - Marketing version: `1.0`
  - Current project version: `7`
  - Development team: `2XSLXV9H74`

## Needs Manual Action

Mac should process this after RuckMode unless RuckMode is blocked by signing or ASC.

1. Open `SplashLens.xcodeproj`.
2. Confirm bundle identifier is `com.splashlens.app`.
3. Increment build number above `7`.
4. Build on simulator and physical iPhone if available.
5. Verify whether the native app uses the updated web/API language flow or has separate Swift UI that still needs native language controls.
6. Archive in Xcode.
7. Upload to App Store Connect/TestFlight.
8. Wait for ASC processing before moving to Bay2Course.
9. Attach internal TestFlight only first.

## Files/Artifacts

Primary files to verify:

- `C:\Users\sales\Dropbox\Projects\poolens\SplashLens.xcodeproj`
- `C:\Users\sales\Dropbox\Projects\poolens\ios\SplashLens\Info.plist`
- `C:\Users\sales\Dropbox\Projects\poolens\index.html`
- `C:\Users\sales\Dropbox\Projects\poolens\js\app.js`
- `C:\Users\sales\Dropbox\Projects\poolens\functions\api\events.ts`

## Commands

Run from Mac Terminal:

```bash
cd ~/Dropbox/Projects/poolens
git status --short
open SplashLens.xcodeproj
```

Build, archive, and distribute from Xcode.

## Verification

Return this folder:

`SplashLens-ios-proof-2026-06-17`

Required files:

- `build-map.md`
- `screenshot-inventory.md`
- `ocr-copy-risks.md`
- `reviewer-path.md`
- `privacy-support-delete-account.md`
- `iap-permissions-proof.md`
- `console-parity.md`
- `go-no-go.md`
- `screenshots/`

Screenshots should include Spanish language selection and at least one user-facing translated state if the native app exposes it. If only the web/API path is translated, note that in `go-no-go.md`.

## Checklist

- [ ] Bundle id verified
- [ ] Build number incremented above `7`
- [ ] Simulator build passed
- [ ] Spanish-facing UI/path captured
- [ ] TestFlight upload processed
- [ ] Internal tester build assigned
- [ ] Proof folder returned
