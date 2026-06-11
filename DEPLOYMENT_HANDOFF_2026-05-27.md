# SplashLens App Deployment Handoff - 2026-05-27

## Done

- Branch pushed: `splashlens-app-scan-security-2026-05-27`.
- Scan endpoint has origin checks, request-size/image validation, and production fail-closed metering.
- PoolLens should remain internal/source naming only; SplashLens is the public brand.

## Cloudflare Requirements

Set these before production scan launch:

- `ANTHROPIC_API_KEY`
- `ENVIRONMENT=production`
- `SCAN_USAGE_KV`
- `SCAN_RATE_LIMITER`

## Deployment Steps

1. Pull the branch.
2. Bind KV/rate limiter in Cloudflare.
3. Deploy preview.
4. Test free/manual field workflows offline.
5. Test AI scan online with a real metered request.
6. Verify privacy, terms, `llms.txt`, and headers.

## Blockers

- Native billing is not implemented. Keep store wrapper free-core until billing/entitlements are added.
