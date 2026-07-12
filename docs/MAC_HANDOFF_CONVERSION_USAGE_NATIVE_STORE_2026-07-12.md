# Mac Handoff - SplashLens Conversion, Usage, and Native Store Alignment - 2026-07-12

## Goal
Bring the iOS and Android wrappers/store listings in line with the current SplashLens web positioning:

- PartSnap is the front door.
- Manual field tools stay free.
- PartSnap Pro is the paid scanner capacity layer.
- Facility Assist is the lighter CPO/operator front door.
- Owner dashboard tracks real app usage, store opens, scanner use, proof actions, and checkout signals.

## Pull First

```powershell
cd C:\Users\sales\Dropbox\Projects\poolens
git pull --rebase
```

If the Dropbox checkout is dirty on Mac, use a clean clone before Xcode/Android Studio work.

## Store Copy To Match

Use plain language:

> SplashLens helps pool, spa, and aquatic service pros identify possible equipment and part paths, collect proof, use field calculators, save service notes, and escalate with cleaner packets. PartSnap is a proof-first part-identification workflow. It is a reference aid, not a diagnosis, manual, training, or fitment guarantee.

Do not claim:

- guaranteed part fitment
- guaranteed diagnosis
- official manufacturer endorsement
- CPO training replacement
- health-code reopening decisions

## iOS Checks

1. Open the current SplashLens Xcode project.
2. Confirm the app shell loads `https://app.splashlens.com/?store=ios`.
3. Confirm the newest web app gate says:
   - `Photo the part. Prove the path.`
   - PartSnap first
   - free field tools
   - PartSnap Pro only as scanner capacity
4. Confirm native billing hooks still call:
   - `splashlensNativeBilling` purchase
   - `splashlensNativeBilling` restore
   - `/api/native-entitlement`
5. Confirm store-mode does not show raw Stripe web checkout as the native purchase path.
6. Capture screenshots for:
   - marketing gate
   - PartSnap scanner
   - scan-limit/native purchase prompt
   - Facility Assist
   - Service Proof / report

## Android Checks

1. Confirm package remains `com.splashlens.fieldtools`.
2. Confirm TWA/web wrapper loads `https://app.splashlens.com/?store=android`.
3. Confirm Google Play listing copy matches the current free-core + PartSnap proof language.
4. Confirm Play Billing path is used for native purchase/restore where available.
5. Confirm no web Stripe checkout CTA appears inside store mode.

## Backend Notes

This web/backend update adds:

- dashboard metrics for checkout starts, upgrade clicks, App Store clicks, Google Play clicks
- cross-domain site click mirroring into `/api/events`
- CORS support for `https://splashlens.com` -> `https://app.splashlens.com/api/events`
- Stripe webhook idempotency by `payment:<stripeSessionId>`
- checkout-success fallback event/payment write
- native entitlement emits dashboard-compatible `checkout_success`

## Required Production Secrets To Verify

Do not paste secrets into chat. Just verify they exist in Cloudflare/console:

- `SCAN_USAGE_KV`
- `SPLASHLENS_ENTITLEMENT_SECRET`
- `STRIPE_WEBHOOK_SECRET` or `SPLASHLENS_STRIPE_WEBHOOK_SECRET`
- `SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID`
- `SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM`
- `SPLASHLENS_NOTIFY_TO`
- Apple/Google native verification credentials if native billing is active

## Smoke Tests

- Open `https://app.splashlens.com/?store=ios`
- Open `https://app.splashlens.com/?store=android`
- Open `https://app.splashlens.com/dashboard.html`
- Click a store/download CTA from `https://splashlens.com`
- Click PartSnap Pro upgrade from the web app and confirm dashboard shows checkout intent
- Verify actual purchase only after store sandbox/live test credentials are ready

