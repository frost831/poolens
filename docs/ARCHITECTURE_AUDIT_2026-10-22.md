# SplashLens web architecture audit — 2026-10-22

Scope: this `frost831/poolens` checkout, which serves `app.splashlens.com`. `frost831/poolens-site` is a separate repository and was not present in the authorized checkout. This is a source audit, not a production or installed-device acceptance report. Store/signing paths and workflows were not inspected.

## Decisions and tradeoffs for this pass

1. Keep prices, plan routing, Stripe eligibility checks, server entitlements, store-shell hiding and event names intact. Their contracts have payment and store consequences. Repair only proven boundary failures.
2. Retain the existing offline app shell and its precache list. Restrict runtime caching to public static assets and the app root, and honor `no-store`/`private`. A broader cache rewrite would require installed-device regression evidence.
3. Keep the current page architecture while reducing one repeated full-document scan. Breaking the 706 KB app script into modules is a later measured change because global inline handlers and offline asset versioning couple the script to the HTML and service worker.
4. Use a read-only smoke command for both public domains. Wiring it into a deployment workflow is deferred by the explicit workflow restriction; the bridge can invoke it after a deployment.
5. Report unmeasured Lighthouse scores as unmeasured. This checkout has no Lighthouse executable/browser harness or site repository, and this task forbids deployment, so an honest before/after mobile score cannot be produced here.

## Structure and data flow

| Area | Source and flow | Boundary |
| --- | --- | --- |
| Shell and UI | `index.html` loads `js/errors.js`, `js/data.js`, `js/i18n.js`, `js/app.js`, and feature modules. `js/app.js` owns tab state, modal rendering, calculators, route/pool state, scan UI and checkout handoff. `landing.html` is a page in this app repository; it is not proof of the separate marketing-site implementation. | Inline handlers and `window` functions tightly couple markup to the app script. |
| Calculators and checklists | Dosing, volume, and chemistry calculations run locally in `js/app.js`; checklists use `js/seasonal-checklist.js` and local state. `localStorage` retains checklists and field drafts. | Browser storage may be unavailable or cleared; data is device-local unless an explicit server save succeeds. |
| PartSnap | Camera/gallery input in `js/app.js` -> image preflight and multi-photo evidence composition -> `/api/scan` in `functions/api/scan.js` -> server quota/token checks -> Anthropic request -> corpus candidates in `functions/lib/partsnap-corpus.mjs` -> cautious result and manual recovery. | Image quality and source-backed match checks must fail closed; no exact fitment assertion from a metadata-only fixture. Camera denial exposes gallery and manual lookup. |
| Offline | `index.html` registers `sw.js`; install precaches the root plus 21 static assets. The worker serves the cached root on app-root navigation failure, bypasses API/authenticated requests, and now respects private/no-store responses. | Offline app data is not a substitute for server profile, quota, payment or entitlement checks. Cache version change removes previously retained runtime entries on activation. |
| Checkout | UI intent in `js/app.js` -> `POST /api/checkout` -> plan/attribution validation -> server Stripe price verification/session or configured payment link -> Stripe -> webhook and `/api/checkout-success` -> verified entitlement. `functions/_shared/payment-funnel.mjs` deduplicates server payment events. | Prices and grants remain server-side. QA/TEST traffic is not customer revenue. Client-side Stripe URL checking is an additional handoff guard. |
| Analytics | UI events go through `trackSplashLensEvent` and `/api/events`; server payment events flow through `functions/_shared/payment-funnel.mjs` to D1 and Amplitude. `js/analytics.js` supplies a fallback. | Event names and funnel distinctions remain unchanged. Logging must not include provider response bodies or customer data. |
| Hosting/CI | Cloudflare Pages Functions live in `functions/api/`; `_headers` supplies browser policies; `wrangler.toml` names KV and D1 bindings. `.github/workflows/ci.yml` runs the tests and PartSnap benchmark for every PR target branch. | No container/orchestrator is required. The public-domain smoke command is `node tools/smoke-public-web.mjs`. |

## Findings, root causes, and changes

| Severity | Finding and evidence | Disposition |
| --- | --- | --- |
| High | `sw.js` cached any successful same-origin GET, even HTML returned with `Cache-Control: no-store`; navigation from another route could overwrite the cached `/` shell. This could retain protected content on a shared device and turn an offline route into the wrong page. | Fixed: runtime caching is limited to static resources, `private`/`no-store` responses are excluded, and only root navigation updates/falls back to the app shell. Cache version advanced to remove old entries. Regression tests cover protected routes and root fallback. |
| Medium | Stripe checkout/session lookup and the scan provider error path printed raw provider response bodies; scan catch logged raw error objects. Provider diagnostics may contain identifiers or request context. | Fixed: status or generic failure only is logged. Stage/status telemetry remains. |
| Medium | `_headers` permits `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`; `index.html` and `js/app.js` use inline handlers and style attributes. That weakens CSP against a future injection. | Deferred: remove inline handlers and extract script/style in a separate verified refactor, then tighten CSP. A header-only change would break the app. |
| Medium | Profile/account/entitlement tokens are retained in localStorage in `js/app.js`, so a same-origin script compromise could read them. | Deferred: browser storage/auth redesign needs coordinated expiry, restore, offline and account tests. No secret values were inspected. |
| Low | Main shell is 161,617 bytes before this pass; `js/app.js` is 706,151 bytes, `js/errors.js` 151,530, `js/data.js` 90,279 and `js/i18n.js` 47,140 raw bytes. The up-front page/code payload is a likely mobile performance cost. | Reduced repeated DOM scanning on scroll/resize when IntersectionObserver exists. Module splitting and transfer/parse measurements remain a separate performance change. |
| Low | Camera recovery status and result lacked explicit live status semantics. | Added polite status and a named recovery group; visual controls and camera behavior are unchanged. |

Security controls observed: checkout rejects unsupported plans/store values, validates attribution, verifies configured Stripe prices against published amounts, and sends no-cache/no-store responses on sensitive paths. `/api/scan` has server quota and entitlement checks and bounded image size. `_headers` sets HSTS, no-sniff, frame denial, a CSP, referrer and permissions policies. No third-party npm dependencies or lockfile are declared in `package.json`; therefore an npm dependency vulnerability scan cannot establish more than that package inventory. A deployed-header and secret-scanning audit remains unverified without release artifacts. Only key names relevant to this audit are `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SPLASHLENS_ENTITLEMENT_SECRET`, `SCAN_ENTITLEMENT_SECRET`, `SCAN_USAGE_KV`, and `SUBSCRIBERS_DB`.

## Debug and edge-case evidence

- The default Node test runner failed every file with `spawn EPERM` before executing tests. In-process execution runs the web cases. The benchmark child-process assertion has the same sandbox limitation; its proof gate and failing-threshold CLI need direct invocation.
- Camera denial (`NotAllowedError`/`PermissionDeniedError`), unavailable media devices, cancelled native gallery selection, and uploaded-photo read errors already have recovery paths. This pass retains those paths and announces the status to assistive technology.
- API and authenticated requests bypass the service worker. A network failure at `/dashboard` no longer shows cached app-root HTML. A root app navigation still uses the cached shell. Private/no-store HTML is never runtime cached.
- Checkout transport failure returns a retryable 503. Price mismatch fails closed; no pricing, payment-link, entitlement or event changes were made.
- The checkout-link visibility tracker had a full `querySelectorAll` scan on each captured scroll and resize even when IntersectionObserver already tracked viewport entry. Those listeners now remain only as the fallback when that API is absent; DOM mutations still discover newly rendered links.

## Performance and release evidence

| Metric | Before | After in this checkout |
| --- | --- | --- |
| Raw main JS (`js/app.js`) | 706,151 bytes | 706,276 bytes (small guard/comment; no bundle split) |
| Root HTML | 161,617 bytes | 161,792 bytes (status semantics) |
| Checkout-link full-document scan on scroll/resize with IntersectionObserver | Once per scheduled frame | None from those events; intersection and mutation callbacks still run |
| Mobile Lighthouse app/site | Not measured | Not measured |

No local Lighthouse binary or browser harness is part of this checkout. A mobile 90+ target is **unverified**, not passed. The separate site repository, live deployment and installed-device behavior are outside this task's permitted execution. Before a release, run mobile Lighthouse against fixed URLs/conditions on both domains, repeat after deployment, and retain the reports. Run `node tools/smoke-public-web.mjs` after Cloudflare deploy; it checks HTTP 200 HTML on `splashlens.com` and `app.splashlens.com` without credentials or mutation. This task did not run it against production because no deployment occurred.

## Refactor order and deferred work

1. Extract pure calculator and checklist rules from `js/app.js`, preserving numeric fixtures and localStorage migration behavior.
2. Extract PartSnap capture/preflight/view state behind a small interface, then replay camera denied, gallery cancel, offline, and low-quality image cases on real devices. Keep source-backed abstention and quota boundaries.
3. Move checkout UI rendering and tracking into a module after pinning event and native store-shell contract tests. Leave Stripe and entitlements server-owned.
4. Move inline handlers/styles to modules and CSS, tighten CSP, and audit dynamic `innerHTML` sinks with untrusted strings.
5. Split non-critical UI by route/tab and measure transfer size, parse time, memory and mobile Lighthouse under repeatable throttling. Coordinate changed assets with the offline precache version.
6. Review the separate `poolens-site` repository, then wire the smoke command into an authorized post-deploy hook. Any store/signing or release-workflow change remains deferred by task scope.

No PR was created, merged or deployed here. The bridge owns publication and any final release gate.
