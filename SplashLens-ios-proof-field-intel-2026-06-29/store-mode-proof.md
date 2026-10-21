# Store Mode Proof

## Native Entry

The iOS wrapper opens:

`https://app.splashlens.com/?store=ios`

The navigation delegate preserves `store=ios` for `app.splashlens.com` navigations.

## Source Inspection

Relevant source:

- `ios/SplashLens/ContentView.swift`
- `js/app.js`

Observed:

- Store shell mode is driven by `?store=ios` and persisted with `sl_store_shell_mode`.
- `isStoreShellMode()` returns true when a store shell mode exists.
- In store shell mode, the scan limit modal does not present web Stripe checkout links.
- Store shell copy says: `This store build is free-core only while native billing is finalized.`
- Web checkout links still exist for non-store mode:
  - `/api/checkout?plan=monthly`
  - `/api/checkout?plan=yearly`

## Runtime Observation

The tested wrapper path loaded with `?store=ios`, opened Field Tools, and exercised Saved Pools, packet sharing, CSV, print, camera prompt, manual lookup, and dosing calculator without sending the user through a direct web checkout.

## Billing Status

Native billing/IAP was not implemented or verified in this run. Treat store mode as free-core until the native billing lane is intentionally built and release-gated.
