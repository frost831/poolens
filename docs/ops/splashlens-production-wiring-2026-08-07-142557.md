# SplashLens Production Wiring Report

Generated: 2026-08-07 14:25:57 -05:00

Result: GREEN

| Surface | Check | Result | Evidence | Fix |
|---|---|---|---|---|
| Amplitude | secret wiring | pass | AMPLITUDE_API_KEY found locally and uploaded to both Cloudflare Pages projects. |  |
| Deploy | app Cloudflare Pages | pass | poolens deployed from trimmed app folder. |  |
| Deploy | site Cloudflare Pages | pass | poolens-site deployed from trimmed site folder. |  |
| App events | live status | pass | status=200; storage=True; email=True; amplitude=True | Check Cloudflare bindings/secrets and redeploy. |
| Site events | live status | pass | status=200; stored=True; fresh=True; amplitude=True | Check D1 binding/secrets and redeploy. |
| Amplitude | live config | pass | app=ready; site=ready | Add AMPLITUDE_API_KEY to both Cloudflare projects and redeploy. |
| Stripe | checkout readiness | pass | status=200; productionReady=True; stripe=True; webhook=True; paymentLinks=True | Fix Stripe/webhook/payment-link config before sending paid traffic. |
| Owner analytics | usage pull protected | pass | status=401 | Keep /api/usage-pull protected. |
| App UX | post-value identity prompt live | pass | missing= | Deploy current static assets/functions. |
| Dashboard | weak spot scorecard live | pass | missing= | Deploy current static assets/functions. |
| Marketing site | challenge-linked app CTAs live | pass | missing= | Deploy current static assets/functions. |
