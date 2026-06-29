# SplashLens Native Subscriptions Handoff - 2026-06-29

## Current store posture

The submitted iOS and Google Play apps are free-core wrappers:

- iOS opens `https://app.splashlens.com/?store=ios`.
- Android TWA opens `https://app.splashlens.com/?store=android`.
- Store mode hides direct Stripe upgrade CTAs.

No native binary update is required for web Payment Link checkout.

## Native subscription moonshot

If SplashLens sells PartSnap Pro inside the native apps, the next store release should add native billing and map store purchases to the existing signed entitlement model.

## iOS build scope

Required on Mac:

1. Add StoreKit products in App Store Connect.
   - Monthly: `partsnap_pro_monthly`
   - Annual: `partsnap_pro_annual`
2. Add StoreKit purchase UI in the iOS wrapper.
3. After purchase, send the App Store transaction JWS to SplashLens backend.
4. Backend verifies transaction with Apple App Store Server API.
5. Backend issues `sl_scan_v1` entitlement token and returns activation URL/token.
6. App opens `https://app.splashlens.com/?store=ios&tab=scan&scan_token=...`.

## Google Play build scope

Required in Android project / Play Console:

1. Add Play Billing library to the Android wrapper.
2. Create subscription products in Play Console.
   - Monthly: `partsnap_pro_monthly`
   - Annual: `partsnap_pro_annual`
3. Launch billing flow from native UI or a store-safe web bridge.
4. Send purchase token and product ID to SplashLens backend.
5. Backend verifies purchase with Google Play Developer API.
6. Backend issues `sl_scan_v1` entitlement token and opens the web app with that token.

## Backend contract to add

Endpoint:

```text
POST /api/native-entitlement
```

Request:

```json
{
  "store": "ios|android",
  "productId": "partsnap_pro_monthly",
  "transactionId": "store transaction id",
  "purchaseToken": "android purchase token or apple transaction jws"
}
```

Response:

```json
{
  "ok": true,
  "activateUrl": "https://app.splashlens.com/?tab=scan&scan_token=...",
  "entitlement": {
    "plan": "PartSnap Pro Monthly",
    "source": "ios_storekit"
  }
}
```

## Do not cross with Stripe

Stripe remains the web checkout path. Native app subscriptions should use Apple/Google billing for digital scanner access inside store builds.

The entitlement token is the shared layer across web Stripe, iOS StoreKit, and Google Play Billing.
