# SplashLens Google Play PartSnap Release - 2026-06-22

## Candidate

- App: SplashLens Field Tools
- Package: `com.splashlens.fieldtools`
- Version code: `3`
- Version name: `1.0.2`
- Signed AAB: `C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\SplashLens-Field-Tools-1.0.2-v3-fieldtools-final-signed.aab`
- Signed AAB size: `1,389,080` bytes
- Signed AAB SHA-256: `31DB557764A94760A2D6288068AFFAE5C120330151AECBB760B1C1369E73B562`
- Upload certificate SHA-256: `9F:B4:69:CF:41:91:74:BF:76:21:32:34:AF:7A:53:0D:75:02:58:0A:33:77:C9:D8:91:71:E4:E9:4B:17:2E:96`

## Build Proof

- `cmd /c gradlew.bat clean bundleRelease` passed on Windows.
- `jarsigner` signed the release bundle with the local SplashLens upload key.
- `jarsigner -verify -verbose -certs` returned certificate output for the signed bundle.
- Package/applicationId was corrected to `com.splashlens.fieldtools` to match the existing Play Console listing.
- `/.well-known/assetlinks.json` was corrected to `com.splashlens.fieldtools`.
- Store-wrapper visible copy avoids web-payment CTAs; store mode remains free-core until native billing is added.

## Release Notes

```text
Refreshes SplashLens for the PartSnap field workflow.

PartSnap now emphasizes possible pool-part matches, visible proof, missing proof, confidence ladder, Callback Risk Score, Service Proof Passport saves, Mystery Part ticket IDs, local review queue, Apprentice Mode, and cleaner escalation notes before ordering.

The Android app remains a free no-account wrapper around app.splashlens.com. Manual lookup, dosing, checklists, and service notes remain free. Online scanner output is reference assistance only and must be verified against manufacturer documentation and professional field judgment.
```

## Store Listing Copy Refresh

ASO keyword targets already reflected in current iOS metadata and recommended Play listing copy:

- pool tech
- PartSnap
- parts
- codes
- pump
- heater
- salt
- robot
- lighting
- dosing
- SCP

Additional public-site crawl terms added without partnership claims:

- Thursday Pools
- Leisure Pools
- SCP / Pool360 parts
- pool chemical lines
- BioGuard
- Natural Chemistry
- Orenda
- HASA
- HTH
- Leslie's
- In The Swim
- Clorox Pool & Spa
- Jack's Magic
- SeaKlear
- Poolife
- Baquacil
- GLB
- Applied Biochemists
- Lo-Chlor
- Pool Frog / King Technology

Recommended short description:

```text
Pool part ID, error codes, dosing, proof notes, and scanner assistance.
```

Recommended full description:

```text
SplashLens Field Tools helps pool service technicians move faster at the equipment pad.

Use SplashLens for:

- PartSnap pool parts ID for possible manufacturer, model, and part-number clues
- 230+ troubleshooting entries across equipment, automation, lighting, robots, covers, sanitizers, and controllers
- Error-code lookup for major pool brands
- Chemical dosing calculators
- Service notes, Route Brain field plans, and escalation packets
- Filter guides, pump/filter checklists, SLAM tracking, and manual reference tools
- Optional online scanner assistance for equipment displays, pool parts, and test strips

Manual lookup, calculators, notes, filters, and checklists are designed for field use and can work from the app shell after first load. Online AI scan features require internet access and are assistance only.

SplashLens does not guarantee diagnosis, repair, chemical safety, manufacturer support, training certification, or part fit. Always verify scanner output, dosing, repairs, and part ordering against equipment manuals, calibrated tests, label directions, and professional field judgment.
```

## Refreshed Listing Assets

Folder:

`C:\Users\sales\Dropbox\Projects\poolens\play-store-artifacts\google-play-listing-2026-06-22`

Files:

- `app-icon-512.png` - 512 x 512
- `feature-graphic-1024x500.png` - 1024 x 500
- `01-partsnap-home.png` - 1080 x 1920
- `02-partsnap-primer.png` - 1080 x 1920
- `03-partsnap-proof-result.png` - 1080 x 1920
- `04-dosing-calculator.png` - 1080 x 1920
- `05-error-code-lookup.png` - 1080 x 1920

## Play Console Steps

1. Open Play Console for `SplashLens Field Tools`.
2. Check whether the existing closed test `1 (1)` was approved, rejected, or still in review.
3. Go to the active testing track that Play allows for this account.
4. Create a new release or edit the draft release.
5. Upload `SplashLens-Field-Tools-1.0.2-v3-fieldtools-final-signed.aab`.
6. Paste the release notes above.
7. Refresh short/full description if Play allows listing changes.
8. Confirm Data Safety still discloses user-selected photos for scanner assistance, app interactions, diagnostics/performance data where applicable, email only when submitted, encrypted in transit, and deletion via the privacy page.
9. Send changes for review.

## Known Gate

Production access may still be blocked until Google Play's closed-test requirement is satisfied: at least 12 opted-in testers for at least 14 days. If production is blocked, keep this on closed testing and recruit testers.
