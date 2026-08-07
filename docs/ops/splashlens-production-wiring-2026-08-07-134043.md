# SplashLens Production Wiring Report

Generated: 2026-08-07 13:40:43 -05:00

Result: YELLOW

| Surface | Check | Result | Evidence | Fix |
|---|---|---|---|---|
| Amplitude | secret wiring | blocked | No local AMPLITUDE_API_KEY or SPLASHLENS_AMPLITUDE_API_KEY was present, so no Amplitude secret could be uploaded. | Add the Amplitude project API key to local env, then rerun this script. |
| Deploy | app Cloudflare Pages | pass | poolens deployed from trimmed app folder. |  |
| Deploy | site Cloudflare Pages | pass | poolens-site deployed from trimmed site folder. |  |
| App events | live status | pass | status=200; storage=True; email=True; amplitude=False | Check Cloudflare bindings/secrets and redeploy. |
| Site events | live status | pass | status=200; stored=True; fresh=True; amplitude=False | Check D1 binding/secrets and redeploy. |
| Amplitude | live config | blocked | app=missing_api_key; site=missing_api_key | Add AMPLITUDE_API_KEY to both Cloudflare projects and redeploy. |
| Stripe | checkout readiness | pass | status=200; productionReady=True; stripe=True; webhook=True; paymentLinks=True | Fix Stripe/webhook/payment-link config before sending paid traffic. |
| Owner analytics | usage pull protected | pass | status=401 | Keep /api/usage-pull protected. |
| App UX | post-value identity prompt live | pass | missing= | Deploy current static assets/functions. |
| Dashboard | weak spot scorecard live | pass | missing= | Deploy current static assets/functions. |
| Marketing site | challenge-linked app CTAs live | pass | missing= | Deploy current static assets/functions. |

## Warnings / Blockers
- Amplitude - secret wiring - No local AMPLITUDE_API_KEY or SPLASHLENS_AMPLITUDE_API_KEY was present, so no Amplitude secret could be uploaded.
- Amplitude - live config - app=missing_api_key; site=missing_api_key
