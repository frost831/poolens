# SplashLens Mac Handoff - Spa, PartSnap Proof, and Store Refresh

Date: 2026-07-07

## Build

- Web/app branch: `feature/splashlens-usage-alerts-dashboard`
- App URL: `https://app.splashlens.com`
- iOS bundle: `com.splashlens.app`
- Android package: `com.splashlens.fieldtools`
- Store wrapper URLs:
  - iOS: `https://app.splashlens.com/?store=ios`
  - Android: `https://app.splashlens.com/?store=android`

## What Changed

- Added PartSnap proof packet drawer for pump, robot, spa pack, chemical controller, AOP/ozone/UV, lighting, and automation proof checklists.
- Added owner dashboard demand-lane reporting for spa/hot tub, robots, automation, lighting, salt, chemical controllers, source pages, and PartSnap proof drawer opens.
- Added home-screen touch targets for Spa Pack Lane and PartSnap Proof.
- Bumped PWA cache to `splashlens-v16-store-dashboard-source-pages`.

## Store Screenshot Set

Capture these from the real native shell, not desktop web:

1. Field rescue home showing PartSnap + Connected Pool Network.
2. PartSnap result with Proof Packet Drawer open.
3. Spa Pack Lane / hot tub troubleshooting results.
4. Connected Pool Network or Route Brain proof workflow.
5. Service Proof Passport / senior-tech packet workflow.

## Reviewer Path

1. Launch the native wrapper.
2. Confirm first screen loads without login.
3. Tap `PartSnap Proof`.
4. Confirm PartSnap mode opens.
5. Use a non-sensitive test image or mocked scanner result if the build supports test mode.
6. Open the proof packet drawer.
7. Confirm no diagnosis, warranty, official-manufacturer, or fitment-guarantee language appears.

## Copy/OCR Risks

- Keep "possible match", "reference only", "verify before ordering", and "qualified tech/manual verification" language visible.
- Do not imply official manufacturer partnership.
- Do not imply native subscriptions are live until StoreKit / Play Billing products are fully configured and review-safe.

## Go/No-Go

Go for a store refresh once:

- Current web build is deployed and smoke tested.
- Native shells open `https://app.splashlens.com/?store=ios` and `https://app.splashlens.com/?store=android`.
- Screenshots are captured from actual iOS/Android builds.
- Store metadata matches the ASO refresh doc.

No-go if:

- Native billing UI is shown without live store products.
- Screenshots show stale app-store chips, broken camera permission copy, or clipped text.
- Any screenshot implies a repair diagnosis or guaranteed part fit.
