# SplashLens Store Wrapper Build Plan

Build a native iOS wrapper around:

https://app.splashlens.com/?store=ios

Before submission, verify:

- The app opens directly into SplashLens, not old PoolLens branding.
- Direct Stripe or web upgrade CTAs are hidden in `store=ios` mode.
- Manual lookup, calculators, notes, filters, and checklists still work after first load.
- Camera permission is requested only when the user starts scanner flow.
- Privacy and support links are reachable.
- Any AI scan result uses verification language and does not claim guaranteed diagnosis.

Initial build should be free-core. Do not attach App Store in-app purchases unless native billing, server-side entitlement verification, restore purchases, and scan metering are production-ready.
