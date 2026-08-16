# SplashLens Security Gate v1

Date: 2026-08-16

## Scope

This gate covers the SplashLens app at `https://app.splashlens.com` and its Cloudflare Pages Functions. The public marketing site at `https://splashlens.com` was checked for the requested headers and obvious risky DOM sinks; no code change was required there.

## Implemented Controls

1. Reserved identity protection
   - Shared guard: `functions/_shared/security-gate.mjs`
   - Blocks non-staff display/profile names such as Support, Admin, Billing, Security, Official, Platform Support, SplashLens Support, and Poolens Support.
   - Applied to public submission/event paths that can carry user identity hints.

2. In-app/user-submission protection
   - Scans public event, waitlist/paid-lane, and PartSnap feedback submissions before persistence or email.
   - Blocks platform impersonation, account/payment-verification phishing language, and external account/payment/support links.
   - Allows first-party account/support/payment URLs only on `app.splashlens.com`, `splashlens.com`, and `www.splashlens.com`.
   - Adds KV-backed rate limits for event submissions, waitlist requests, and PartSnap feedback.

3. Admin-visible moderation and quarantine
   - Moderation records are written under `security-moderation:*` in `SCAN_USAGE_KV`.
   - Blocked security events attempt an official-domain owner alert with template id `security_gate_alert`.
   - Quarantine workflow: `tools/security-quarantine-user.mjs`
   - Dry-run is default and produces an auditable plan covering disable, session revoke marker, message hide marker, recipient block marker, affected-user notification plan, and audit record.
   - Production apply requires `--apply --i-understand-production-change`.

4. Security headers
   - Verified in app `_headers`: CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, Referrer-Policy, and Permissions-Policy.
   - Verified same header family on the marketing site `_headers`.

5. Frontend XSS posture
   - Active scanner found no `document.write`, `eval`, `new Function`, unsafe message handlers, or dangerous navigation matches in the searched app paths.
   - Existing app UI still uses many internal `innerHTML` templates fed primarily by local catalogs and escaped helpers. The security gate prevents newly submitted abuse content from reaching storage/email paths; deeper template refactors should be handled in smaller UI passes.

6. Dependency and secret scanning
   - Added `package.json`, `package-lock.json`, and `npm run security:gate`.
   - Added committed-secret scanner: `tools/secret-scan.mjs`.
   - GitHub Actions workflow creation was attempted but blocked by the current GitHub OAuth/GitHub App permissions because workflow-file writes require workflow access. The committed `security:gate` script is ready for CI once a scoped token or repo admin installs the workflow.

7. Official sender policy
   - Official app sends now resolve through `officialSenderConfig`.
   - Gmail, Outlook, personal, or sibling-company sender domains are blocked/fail closed for official app notices.
   - Default official sender remains `hello@splashlens.com`.

8. Monitoring
   - Security gate alerts use SendGrid through the official SplashLens sender when configured.
   - KV moderation records preserve blocked phishing keywords, bad links, suspicious identity names, and rate-limit events for owner/admin review.

## Regression Proof

Automated tests were added for:

- Reserved names rejected.
- Platform impersonation/phishing language blocked.
- External support/payment links blocked.
- Rate limits enforced.
- Security headers present.
- Official sender policy enforced.
- Quarantine script dry-run safety.

Run:

```powershell
npm run security:gate
```

## Remaining Risks

- There is no full user-account/profile system in the current web app, so reserved-name protection is implemented as a shared guard plus enforced public submission paths. Native/account code should call the same guard before any future profile update endpoint is added.
- CSP still includes `unsafe-inline` for scripts/styles because the current static app has legacy inline handlers/templates. This is verified and documented, but a future UI hardening sprint should remove inline handlers and tighten CSP further.
- Quarantine live apply writes KV markers. If future messaging/session systems use a database other than `SCAN_USAGE_KV`, adapters should be added so the same script can revoke real sessions and redact real messages at the source of truth.
- Sentry is not configured in-repo. SplashLens currently uses owner alerts, Amplitude/event telemetry, and KV moderation logs as the equivalent monitoring path for this gate.
- GitHub Actions CI is not committed because the current GitHub credential cannot create or update `.github/workflows/*`. Add the workflow with a GitHub token/App that has workflow write permission, then run `npm run security:gate` in CI.
