# SplashLens Google Play / iOS parity check - 2026-06-16

## Verdict

Google Play does not need a native feature rebuild to match iOS because both store wrappers load the live SplashLens PWA:

- iOS wrapper URL: `https://app.splashlens.com/?store=ios`
- Android TWA URL: `https://app.splashlens.com/?store=android`

The Play lane does need a store-readiness refresh after the June 16 usage-alert/dashboard work.

## Candidate Android build

- Package: `com.splashlens.app`
- Previous Play closed-test release: version code `1`, version name `1`
- New local candidate: version code `2`, version name `1.0.1`
- Wrapper source: `C:\Users\sales\Dropbox\Projects\poolens\android-twa`
- Upload keystore: `C:\Users\sales\.keystores\splashlens\splashlens-upload.keystore`
- Signed AAB: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.1-v2-signed.aab`
- Signed AAB size: `1,372,044` bytes
- Signed AAB SHA-256: `0258B8AC8785FD22C36924E3265FF49A99B414929AEADE61A6937DA7EB645BCD`
- Upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`
- Build verification: `cmd /c gradlew.bat clean bundleRelease` passed on Windows; `jarsigner -verify` returned `jar verified` after explicit upload-key signing.

Release-note draft:

```text
Updates SplashLens field-reference launch behavior and privacy alignment.
Keeps the Android app as a free no-account wrapper around app.splashlens.com.
Adds owner-side anonymous usage-event visibility for app opens, install signals, scan starts, manual searches, and PartSnap result views.
No native paid checkout, manufacturer endorsement, or guaranteed diagnosis claim is included.
```

## Privacy / Data Safety

Live privacy policy: `https://splashlens.com/privacy.html`

June 16 source update adds:

- anonymous app opens
- PWA install signals
- AI scan starts
- manual searches
- PartSnap result views
- owner email notifications for actual app usage
- usage-event retention up to 120 days

Play Console Data Safety should remain aligned with these categories:

- App activity: app interactions, other user actions
- App info and performance: diagnostics / other app performance data if Play requires this for Cloudflare/server logs or wrapper behavior
- Photos and videos: only user-selected scanner photos, used for app functionality
- Personal info: email address only when a user submits a waitlist/contact/pilot form
- Data sharing: do not claim third-party sharing is impossible unless AI scanner, Cloudflare, SendGrid, and Stripe processing disclosures are accepted as service-provider processing under Play's current form wording
- Data deletion: `https://splashlens.com/privacy.html`, plus user can clear local app data or contact support

## Store Listing Copy Guardrails

Use:

- free no-account field reference
- error-code lookup
- chemical dosing math from user-entered values
- service notes/checklists
- optional online scanner assistance
- possible matches / verify output

Avoid:

- guaranteed diagnosis
- chemical safety guarantees
- manufacturer endorsement
- native paid subscription or unlimited scan claims
- training certificate claims
- email-open tracking claims

## Current Play Console Gate

The latest local record says Google Play was submitted to closed testing on 2026-06-03 with version `1 (1)`.

Production access was blocked by Google's closed-test requirement: at least 12 opted-in testers for at least 14 days. The tester list showed 1 user at setup time.

## Exact Next Play Console Actions

1. Open Play Console for `SplashLens Field Tools`.
2. Confirm whether closed-test release `1 (1)` was approved, rejected, or is still in review.
3. If still closed-test gated, add at least 11 more opted-in testers and keep the test active for 14 days.
4. Update the privacy policy URL if Play still shows `https://splashlens.com/privacy.html`; the live policy now includes usage-event retention and owner notifications.
5. Review Data Safety against the June 16 behavior above.
6. If uploading a new release, upload the signed `1.0.1 (2)` AAB candidate and use the release-note draft in this file.
7. After Play App Signing is available, confirm Google's app-signing SHA-256 is present in `https://app.splashlens.com/.well-known/assetlinks.json`.
