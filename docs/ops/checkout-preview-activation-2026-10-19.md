# Checkout activation origin — 2026-10-19

Testing the isolated Stripe Preview exposed a hard-coded production scanner activation URL in `checkout-success.js`. Checkout creation already respected `SPLASHLENS_APP_ORIGIN`, but Pro/Crew activation and Closing Pro activation did not. A Preview payment could therefore lead its user to production with a Preview-signed entitlement.

Activation links now use the same trusted configured app origin, trimming a trailing slash. When no origin is configured, the existing production default remains `https://app.splashlens.com`. Pro, Crew, and Closing Pro share the helper; payment verification, signatures, expiry, account checks, and storage bindings are unchanged.

A Preview-origin regression failed on the original code and now passes. Closing Pro and Crew backend tests additionally verify their configured activation origin. The full suite passes **369/369**, zero failures or skips, with installed Playwright coverage enabled. Real TEST checkout completion must be verified separately; these fixture tests do not prove a real payment or customer conversion.
