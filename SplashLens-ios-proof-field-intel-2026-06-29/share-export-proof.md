# Share And Export Proof

## Native Share

Screenshot:

`screenshots/07-share-export-after-tap.png`

Observed:

- `Share` on the Field Intelligence packet invoked the native iOS share sheet.
- The sheet title included `SplashLens Field Intelligence Packet`.
- No external send action was completed.

## Copy Packet

Screenshot:

`screenshots/06-copy-crm-packet-after-tap.png`

Observed:

- `Copy Packet` wrote the complete CRM packet to simulator pasteboard.
- Pasteboard verification used `xcrun simctl pbpaste`.

## CSV Export

Screenshot:

`screenshots/10-download-csv-native-file-sheet.png`

Observed:

- `CSV` produced a native file share sheet.
- File name: `field-intel-test-pool-field-packet.csv`.
- No external send action was completed.

## Print / PDF

Screenshot:

`screenshots/11-print-pdf-native-print-options.png`

Observed:

- `Print/PDF` invoked the native iOS print options sheet.
- Preview showed 1 page.
- No print or external send action was completed.

## Native Bridge Coverage

The iOS wrapper now bridges:

- `navigator.share` to `UIActivityViewController`
- Blob downloads to a temporary file and `UIActivityViewController`
- `window.print` and blank popup print flows to `UIPrintInteractionController`
