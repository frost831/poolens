# Mac Handoff - SplashLens Service Proof OS - 2026-07-10

## Done

- Added Service Proof OS as an additive layer inside the existing SplashLens web app.
- Kept the current app structure intact; no native wrapper files were intentionally changed in this pass.
- Added a Service Proof OS card to the Visit Report workflow with:
  - Generate Summary
  - Trust Portal Preview
  - Ask Proof Assistant
  - Save Passport
- Added local-first customer-safe summary generation.
- Added local trust-portal preview text for customer proof.
- Added local FAQ-style Service Proof Assistant.
- Added callback/risk trend flags to saved Service Proof Passport records.
- Added pool-level trend intelligence based on saved passports, readings, and repeat issue language.
- Added owner event tracking labels for new Service Proof actions.
- Bumped service worker cache to `splashlens-v19-service-proof-os`.

## Needs Manual Action

- Pull the latest app repo on Mac before any iOS/TestFlight or Google Play wrapper refresh.
- Rebuild wrappers so the native shells load the current web assets and service-worker cache.
- Store metadata can mention Service Proof Passport as an in-app workflow, but keep language conservative:
  - OK: "service proof reports", "customer-safe summaries", "saved visit history", "trend flags"
  - Avoid: "full CRM replacement", "diagnosis", "guaranteed callback prevention", "compliance replacement"

## Files/Artifacts

- App repo: `C:\Users\sales\Dropbox\Projects\poolens`
- Web app files changed:
  - `index.html`
  - `js/app.js`
  - `functions/api/events.js`
  - `sw.js`
- Handoff:
  - `C:\Users\sales\Dropbox\Projects\poolens\docs\MAC_HANDOFF_SERVICE_PROOF_OS_IOS_ANDROID_2026-07-10.md`

## Commands

From `C:\Users\sales\Dropbox\Projects\poolens`:

```powershell
git pull
git status --short
node --check js\app.js
Get-Content functions\api\events.js | node --input-type=module --check -
```

Local web smoke, if needed:

```powershell
python -m http.server 8789
```

Then open:

`http://127.0.0.1:8789/?tab=report&mode=tech`

## Verification

Passed local checks:

- `node --check js\app.js`
- `Get-Content functions\api\events.js | node --input-type=module --check -`
- Playwright mobile smoke:
  - opens tech/report workflow
  - generates customer summary
  - previews trust portal
  - answers Service Proof Assistant FAQ
  - confirms role picker is not blocking the workflow
  - confirms no runtime/page errors

## Checklist

- [ ] Pull latest repo on Mac.
- [ ] Preserve existing native project changes unless intentionally updating them.
- [ ] Rebuild iOS wrapper/TestFlight build after confirming the web deploy is live.
- [ ] Rebuild Android/Play wrapper only if store package needs refreshed screenshots/version.
- [ ] Use Service Proof Passport screenshots in the next store metadata refresh.

