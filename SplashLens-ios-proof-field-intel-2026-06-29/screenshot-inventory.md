# Screenshot Inventory

Screenshot root:

`/Users/macbookpro/SplashLens-field-intel-ios-2026-06-29/SplashLens-ios-proof-field-intel-2026-06-29/screenshots`

## Primary Evidence

- `01b-launch-after-wait.png`: SplashLens loads inside the native iOS wrapper.
- `02-field-tools-home.png`: Field tools home available in the wrapper.
- `04-pools-list-seeded-profile.png`: Seeded proof pool appears in Saved Pools.
- `05-field-intelligence-panel-equipment-tree.png`: Field Intelligence panel shows service proof, equipment tree, symptom, next visit, and action buttons.
- `06-copy-crm-packet-after-tap.png`: Copy packet action after tap.
- `07-share-export-after-tap.png`: Native iOS share sheet presented for SplashLens packet.
- `10-download-csv-native-file-sheet.png`: Native iOS file share sheet presented for CSV export.
- `11-print-pdf-native-print-options.png`: Native iOS print options sheet presented with preview.
- `12-scan-camera-permission-user-action.png`: Camera permission prompt appears only after Scan tab user action.
- `13-manual-lookup-pentair-automation.png`: Manual lookup path visible with Pentair/automation context.
- `14-dosing-calculator.png`: Dosing calculator visible.

## Supporting / Intermediate Evidence

- `01-launch-wrapper.png`: Initial wrapper launch/loading.
- `02b-field-tools-after-load.png`: Field tools after load.
- `02c-open-tools-top-button.png`: Open Tools top button.
- `02d-keyboard-open-tools.png`: Intermediate keyboard state.
- `03-new-pool-form-scrolled.png`: New pool form visible.
- `03b-new-pool-form-save-visible.png`: New pool form save area visible.
- `03c-new-pool-form-save-visible.png`: New pool form save area visible.
- `03d-new-pool-form-save-visible.png`: New pool form save area visible.
- `04-pool-after-keyboard-save.png`: Intermediate pool/save state.
- `05-relaunch-after-seed.png`: Relaunch after simulator proof data seed.
- `07b-share-sheet-dismissed.png`: Share sheet dismissed.
- `08-download-csv-after-tap.png`: Earlier CSV tap before native bridge fix.
- `09-patched-relaunch.png`: Relaunch after CSV bridge patch.
- `11-print-pdf-after-tap.png`: Print tap before print options sheet.

## Notes

The proof pool was seeded into the simulator WebKit localStorage after WKWebView form automation proved unreliable for the nested mobile form. This was a proof-only local simulator setup and did not modify production data.
