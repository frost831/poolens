# SplashLens IAP Products Draft

Native paid products are now code-prepped for the next iOS submission.

Use these exact subscription product IDs in App Store Connect so the iOS wrapper can resolve StoreKit products:

- `partsnap_pro_monthly`
- `partsnap_pro_annual`

Required before enabling paid native access:

- Create both subscription products in App Store Connect.
- Attach them to a subscription group named `PartSnap Pro`.
- Add local price, duration, review screenshot, and subscription disclosure copy.
- Add App Store Server API credentials to Cloudflare Pages:
  - `APPLE_APP_STORE_CONNECT_ISSUER_ID`
  - `APPLE_APP_STORE_CONNECT_KEY_ID`
  - `APPLE_APP_STORE_CONNECT_PRIVATE_KEY`
  - `SPLASHLENS_IOS_BUNDLE_ID`
- Keep `SPLASHLENS_ENTITLEMENT_SECRET` or `SCAN_ENTITLEMENT_SECRET` set.
- Submit a build that includes `ios/SplashLens/ContentView.swift` StoreKit bridge.

The backend fails closed if Apple server verification is not configured. That is intentional: SplashLens must not unlock PartSnap Pro from an unverified client-only receipt.

Optional later product:

- `partsnap_scan_pack_25`
