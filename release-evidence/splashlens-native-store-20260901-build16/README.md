# SplashLens Native Store Release Evidence - 2026-09-01

## Source

- Repo: `https://github.com/frost831/poolens` via local origin `https://github.com/throttleshare/poolens.git`
- Branch: `master`
- Release commit: `8830632b502dfbe441f12f098efa7799a0831342`
- Required app-code commit present: `92b9d66`

## iOS

- App Store Connect app ID: `6763644905`
- Bundle ID: `com.splashlens.app`
- Version/build: `1.0.9` / `16`
- IPA: `ios-export/SplashLens.ipa`
- IPA SHA-256: see `ipa-sha256.txt`
- Validation: `ios-validate.log` reports `VERIFY SUCCEEDED with no errors`
- Upload delivery UUID / build ID: `e49a259f-13c2-44c7-bbff-bbde4fe7569d`
- App Store version ID: `44f0d66b-0643-4459-9454-5246df13ca2a`
- Review submission ID: `0fb1b183-6e15-4bf5-94b0-3471acdad271`
- Review submission item ID: `MGZiMWIxODMtNmUxNS00YmY1LTk0YjAtMzQ3MWFjZGFkMjcxfDZ8ODkwNjUzMjAz`
- Final ASC state: `WAITING_FOR_REVIEW`
- Submitted date: `2026-09-01T15:15:00.465Z`
- Fresh screenshots: `asc-screenshots/*.png`, all `1320 x 2868`

## Android

- Package ID: `com.splashlens.fieldtools`
- Version code/name: `8` / `1.0.9`
- Target SDK: `36`
- AAB candidate: `android/SplashLens-Field-Tools-1.0.9-v8-release.aab`
- AAB SHA-256: see `android/aab-sha256.txt`
- AAB status: built successfully but unsigned; Play upload was not attempted because Google Play requires a signed upload artifact.
- Blocker: the SplashLens upload keystore/password referenced in prior handoff material were not found on this Mac.

## Live Store-Mode Smoke

- `https://app.splashlens.com/?store=ios` loaded HTTP 200.
- `https://app.splashlens.com/?store=android` loaded HTTP 200.
- Store modes show `Saved job history`, `Repeat Issue Watch`, and `PartSnap Pro`.
- Store modes do not expose direct checkout candidates.
- Live app HTML contains cache marker `20260901-northstar-funnel`.
- Web checkout endpoint redirects to Stripe Checkout for the web lane; see `checkout-headers.txt`.

## Notes

- Android Play policy checklist from the side-agent audit is tracked in the conversation: API 36 updates, package-name/developer verification, billing library, data safety, privacy/account deletion, app access, sensitive permissions, foreground services, content rating, and US billing/external-link settings.
- A Cloudflare Insights SRI console error appeared in one browser capture. It did not block app shell rendering and was not present as an app-source script tag in the store wrapper HTML.
