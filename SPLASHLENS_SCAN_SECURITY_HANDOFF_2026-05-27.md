# SplashLens Scan Security Handoff - 2026-05-27

## Status

The SplashLens field app now has a safer `/api/scan` posture for production:

- exact-origin CORS allowlist
- request size limits before Anthropic calls
- base64 image validation
- production fail-closed behavior when server-side scan metering is missing
- optional Cloudflare Rate Limiting binding
- optional Cloudflare KV monthly scan metering
- clearer free-core and store-wrapper copy around PartSnap Pro

## Required Cloudflare Bindings

Production scanner traffic must have:

- `ANTHROPIC_API_KEY`
- `ENVIRONMENT=production`
- `SCAN_USAGE_KV` for monthly anonymous scan metering
- `SCAN_RATE_LIMITER` or equivalent Cloudflare rate limiter for burst protection

If `SCAN_USAGE_KV` is missing in production, `/api/scan` returns `503` instead of allowing unlimited anonymous calls.

## Store Wrapper Boundary

The native app-store wrapper must stay free-core unless native billing is added. Do not tell Apple or Google that account-based entitlement or subscription sync exists yet.

## Verification

Completed on Windows:

- `node --check js\app.js`
- `node --check js\data.js`
- `node --check js\errors.js`
- copied `functions\api\scan.js` to a temporary `.mjs` file and ran `node --check`
- `git diff --check`

## Backup Gate

This lane is not considered done until:

- The branch is pushed to GitHub.
- The PR/branch URL is captured in the final handoff.
- The repo remains available in the current Dropbox/Codex workspace.
- E: full backup is added later when that drive is healthy.
