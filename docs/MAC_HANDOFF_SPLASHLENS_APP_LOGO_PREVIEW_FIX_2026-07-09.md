# Mac Handoff - SplashLens App Logo Preview Fix - 2026-07-09

## Done

- Fixed the live `app.splashlens.com` web shell metadata so shared app links use the branded SplashLens share card instead of only the square app icon.
- Added `/favicon.svg` to the app shell head.
- Added secure Open Graph preview fields:
  - `og:image`
  - `og:image:secure_url`
  - `og:image:width`
  - `og:image:height`
  - `og:image:type`
  - `og:image:alt`
- Changed Twitter cards to `summary_large_image`.
- Added the same logo/preview contract to:
  - `index.html`
  - `dashboard.html`
  - `facility-qr.html`
  - `landing.html`

## Needs Manual Action

- On Mac, pull the app repo before App Store Connect / Google Play store work.
- Do not overwrite the existing native project changes unless those are intentionally yours:
  - `SplashLens.xcodeproj/project.pbxproj`
  - `SplashLens.xcodeproj/project.xcworkspace/contents.xcworkspacedata`
  - `android-twa/gradlew`
  - `project.yml`
  - `SplashLens.xcodeproj/xcshareddata/`
  - `release-evidence/`
  - `SplashLens-ios-proof-2026-07-03/`

## Files/Artifacts

- App repo: `C:\Users\sales\Dropbox\Projects\poolens`
- Handoff: `C:\Users\sales\Dropbox\Projects\poolens\docs\MAC_HANDOFF_SPLASHLENS_APP_LOGO_PREVIEW_FIX_2026-07-09.md`
- Canonical share card: `https://splashlens.com/splashlens-share-card.png`

## Commands

From `C:\Users\sales\Dropbox\Projects\poolens`:

```powershell
git pull
git status --short
curl.exe -s https://app.splashlens.com/ | Select-String -Pattern 'favicon.svg|apple-touch-icon|manifest.json|og:image|og:image:secure_url|twitter:image'
curl.exe -s https://app.splashlens.com/facility-qr.html | Select-String -Pattern 'favicon.svg|og:image:secure_url|twitter:image'
```

## Verification

Local audit after fix:

- App HTML pages checked: `index.html`, `dashboard.html`, `facility-qr.html`, `landing.html`
- Pages missing logo/link preview metadata: `0`

## Checklist

- [ ] Pull the app repo on Mac.
- [ ] Preserve existing native project changes unless intentionally updating them.
- [ ] Spot-check live `app.splashlens.com` source after deployment.
- [ ] If Messages, Slack, LinkedIn, or social previews still show an older icon, refresh the preview cache for that platform.

