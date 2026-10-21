# SplashLens Web/PWA Release Evidence - 2026-09-01

Release surface: Cloudflare Pages production web app for `https://app.splashlens.com`, used by the iOS and Android store wrappers via `?store=ios` and `?store=android`.

Source:
- Pulled baseline: `a1007dc` (`Add PartSnap result feedback loop`).
- Released commit: `03d7300d3b16401dc2ac7621bf1bd01e1be6790a` (`Fix SplashLens PWA scanner recovery`).
- Remote: `https://github.com/throttleshare/poolens.git` accepted push; GitHub reports repository moved to `https://github.com/frost831/poolens.git`.

Changed files:
- `index.html`
- `js/app.js`
- `js/field-score.js`
- `sw.js`
- `tests/field-score-contract.test.mjs`
- `tests/first-party-script-assets.test.mjs`

Pre-release checks:
- `npm test`: 22 tests passed.
- `git diff --check`: passed.
- GitHub CI: no `.github` workflow directory found in this checkout; `gh run list --repo frost831/poolens --branch master --limit 5` returned no runs.
- Wrangler auth: logged in as Cloudflare account `214023f3c23554a68344d77bc7a16185`.
- Staged artifact: `_deploy/poolens-web`, copied only app assets, functions, icons, headers, and well-known metadata.
- Wrangler Pages dev compiled the Worker, parsed 9 header rules, and exposed local `SCAN_USAGE_KV` and `SUBSCRIBERS_DB` bindings.
- Local Pages dev `/api/events` POST returned `{"ok":true,"stored":true}`.

Deploy:
- Command: `npx wrangler pages deploy _deploy/poolens-web --project-name poolens --branch main --commit-dirty=true`
- Result: deployment complete.
- Deployment URL: `https://6bb73eca.poolens.pages.dev`
- Production URL: `https://app.splashlens.com`

Post-release checks:
- `https://6bb73eca.poolens.pages.dev/sw.js`: serves `splashlens-v4`.
- `https://app.splashlens.com/sw.js`: serves `splashlens-v4`.
- `https://app.splashlens.com/?store=ios`: HTTP 200 with expected security/cache headers.
- `https://app.splashlens.com/privacy.html`: HTTP 200 with expected security/cache headers.
- `https://6bb73eca.poolens.pages.dev/api/events`: POST returned `{"ok":true,"stored":true}`.
- `https://app.splashlens.com/api/events`: POST returned `{"ok":true,"stored":true}`.

Live browser smoke:
- `https://app.splashlens.com/?store=ios` on 390x844: Service Tech -> Identify a part opened the scanner; no visible field-score prompt; camera fallback displayed and cleared bottom nav; no visible checkout/pricing text; `sw.js` v4; console errors/warnings: 0.
- `https://app.splashlens.com/?store=android` on 390x844: Service Tech -> Identify a part opened the scanner; no visible field-score prompt; camera fallback displayed and cleared bottom nav; no visible checkout/pricing text; console errors/warnings: 0.
- Screenshot: `release-evidence/splashlens-web-pwa-20260901/live-ios-partsnap-fallback.png`.

ASC state checked before web release:
- App ID: `6763644905`
- Version: iOS `1.0.8`
- State: `READY_FOR_SALE` / `READY_FOR_DISTRIBUTION`
- Build: `15`, processing `VALID`, audience `APP_STORE_ELIGIBLE`
- Review submission: `e36eb61b-762e-4a13-94d1-201c3244b786`, `COMPLETE`, item `APPROVED`

Remaining notes:
- Static `python3 -m http.server` preview showed expected `/api/events` 501 responses because it cannot execute Cloudflare Pages Functions; Wrangler Pages dev and live production API both passed.
- No new ASC submission was made.
