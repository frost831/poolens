# SplashLens iOS Go / No-Go - June 22, 2026

## Verdict

GO for TestFlight/App Store Connect build upload.

HOLD for App Review submission until the remaining App Store listing and real-device evidence items below are handled.

## June 23 Character-Cleanup Update

GO for the live web character cleanup deployed to `https://app.splashlens.com`.

Build `1.0.1 (9)` was archived, validated, and uploaded to TestFlight/App Store Connect after the character cleanup and cache-policy fix.

HOLD for App Review submission until fresh physical iPhone screenshots confirm the installed wrapper is loading the cleaned production payload.

## June 24 Report UI Polish Update

GO for the live report UI polish deployed to `https://app.splashlens.com`.

Final production deployment URL: `https://b20d395d.poolens.pages.dev`

The current TestFlight build remains `1.0.1 (9)` because this pass changed the live web payload, not the native wrapper. Build `1.0.1 (9)` already loads `https://app.splashlens.com/?store=ios` and includes the no-stale-cache wrapper policy.

Release-gate checks passed:

- Live Home, Report, PartSnap, E05 search, and expanded E05 had no bad character markers.
- Live Home, Report, PartSnap, E05 search, and expanded E05 had no horizontal overflow.
- Live browser console errors: none.
- Live failed requests: none.
- Live `/api/events` POST returned success.
- Live service worker cache key is `splashlens-v9-report-polish`.
- Store-mode More panel showed no Stripe, checkout, buy-now, subscribe-now, payment-link, or card-required CTA.

HOLD for App Review submission until fresh physical iPhone screenshots confirm the installed TestFlight wrapper is loading this polished production payload.

## Completed

- Pulled the requested branch.
- Confirmed source state before local build edits.
- Confirmed bundle ID `com.splashlens.app`.
- Confirmed team `2XSLXV9H74`.
- Confirmed iOS deployment target `17.0`.
- Incremented build to `8`.
- Bumped version to `1.0.1` after Apple rejected `1.0 (8)` as a closed train.
- Built Release simulator artifact.
- Captured native iOS 6.7-inch screenshots at `1290 x 2796`.
- Archived and exported `SplashLens.ipa`.
- Validated the IPA with Apple successfully.
- Uploaded the IPA to App Store Connect/TestFlight successfully.
- Confirmed the delivery is `VALID`, `APP_STORE_ELIGIBLE`, and present on App Store Connect.
- June 23: archived, exported, validated, and uploaded build `1.0.1 (9)` after the character cleanup.
- June 24: deployed the report UI polish and service-worker cache bump to the live web payload consumed by build `1.0.1 (9)`.

## Sent

- IPA: `build/export/SplashLens-1.0.1-8/SplashLens.ipa`
- App Store Connect delivery UUID: `22440ad7-c45e-4f47-900c-2d5030ae898e`
- App Store Connect app ID: `6763644905`

June 23 character-cleanup upload:

- IPA: `build/export/SplashLens-1.0.1-9/SplashLens.ipa`
- App Store Connect delivery UUID: `c5b4aae5-b5bb-4b40-b9a1-dd3c2e994e08`
- App Store Connect status: `VALID`, `APP_STORE_ELIGIBLE`, present on App Store Connect.

June 24 report-polish deployment:

- Production URL: `https://app.splashlens.com`
- Deployment URL: `https://b20d395d.poolens.pages.dev`
- No new native upload was made because build `1.0.1 (9)` loads the live production payload.

No App Review submission was sent.

## Remaining Before App Review

1. Create or update the App Store Connect version record for `1.0.1`.
2. Attach/select build `1.0.1 (9)` after processing is available in App Store Connect.
3. Upload/select the final App Store screenshots.
4. Use the repo metadata and review notes as the source of truth.
5. Replace simulator-test-feed PartSnap result screenshots with real-device screenshots using an actual pool part and label if the listing needs polished possible-match proof.
6. Reconfirm scan-limit behavior in the installed TestFlight build after using the monthly free scans; store mode should show the free-core/manual-lookup message, not web checkout.
7. Install the uploaded TestFlight build on a real iPhone and verify first launch, camera permission, PartSnap scanner, manual lookup, dosing, Route Brain, and service notes.
8. Confirm the iOS wrapper still does not show direct Stripe/web-subscription CTAs in store mode.

## Blockers / Risks

- `1.0` cannot accept a new build. Apple rejected it with closed-train and higher-version errors. This Mac pass resolved that by uploading `1.0.1 (8)`.
- Build `1.0.1 (9)` is the current character-cleanup build uploaded on June 23.
- Simulator camera proof produced a conservative unidentified result, not a realistic possible-match result with alternates.
- Initial fresh simulator launch briefly produced blank WebKit screenshots before relaunch/warm render. Required screenshots were captured successfully after relaunch, but real-device TestFlight first launch should be checked before App Review.
- Active screenshot folder was reset; old screenshots are archived under `rejected-screenshots-2026-06-23/`.
- Fresh physical iPhone screenshots are still required before App Review submission.
- App Review submission was intentionally not performed in this pass.
