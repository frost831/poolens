# Cloudflare Apple Secrets Status - 2026-07-04

- Issuer ID installed: Not verified in this run.
- Key ID installed: Not verified in this run.
- Private key installed: Not verified in this run.
- Bundle ID installed: Not verified in this run.
- Bundle ID expected value: `com.splashlens.app`
- Cloudflare Pages project from handoff: `poolens`

## Notes

- No App Store Server API private key was created, downloaded, pasted, or committed in this run.
- Shell environment did not expose Apple App Store Connect/API secret values.
- The proof bundle intentionally records secret names only, not secret values:
  - `APPLE_APP_STORE_CONNECT_ISSUER_ID`
  - `APPLE_APP_STORE_CONNECT_KEY_ID`
  - `APPLE_APP_STORE_CONNECT_PRIVATE_KEY`
  - `SPLASHLENS_IOS_BUNDLE_ID`
- PC/user should verify or install these securely before relying on native paid entitlement verification in production.
