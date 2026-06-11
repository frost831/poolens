# SplashLens Android Build Report - 2026-05-28

## Result

- Android TWA wrapper created under `android-twa`.
- Package ID: `com.splashlens.app`.
- Start URL: `https://app.splashlens.com/?store=android`.
- PWA manifest upgraded with PNG 192, PNG 512, and maskable 512 icons.
- Release bundle build passed on Windows:
  - Command: `cmd /c gradlew.bat bundleRelease`
  - Output: `android-twa/app/build/outputs/bundle/release/app-release.aab`
- Signed Play upload candidate created:
  - `play-store-artifacts/SplashLens-Field-Tools-1.0.0-v1-signed.aab`
  - Size: 1,389,053 bytes at build time.

## Signing

- Upload keystore is intentionally outside Git:
  - `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`
- Password note is intentionally outside Git:
  - `C:\Users\sales\.keystores\splashlens\splashlens-upload-key-DO-NOT-COMMIT.txt`
- Upload-key SHA-256:
  - `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`

## Web Verification

- `https://app.splashlens.com/manifest.json` includes PNG and maskable icons.
- `https://app.splashlens.com/.well-known/assetlinks.json` returns the upload-key asset link.
- Mobile browser smoke for `https://app.splashlens.com/?store=android` passed with no console/page errors and no horizontal overflow.

## Play Console Note

Upload this signed AAB first. If Google Play App Signing assigns a different App Signing certificate, add that SHA-256 fingerprint to `.well-known/assetlinks.json` alongside the upload-key fingerprint and redeploy with `tools/deploy-poolens-web.ps1`.
