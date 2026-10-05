# Official Store Metrics Import

The owner dashboard reads `store_metric_imports` and reports App Store and Google Play totals separately from app-click telemetry. App-click events are intent; only these imports are official store counts.

## App Store Connect

Export daily Sales and Trends for the existing SplashLens iOS app (`SKU: splashlens-ios-2026`). The importer accepts Apple's tab-delimited `.txt` report or CSV with `Provider`, `SKU`, `Units`, and `Begin Date`. If `Product Type Identifier` is present, app units (`1`, `1F`, `1T`) become downloads, `3`/`3F` become redownloads, and `7`/`7F`/`7T` become updates. Other product types, including in-app purchases and subscriptions, are ignored. Without that column, `Units` is treated as app downloads only when the export is already limited to this app. Rows for another SKU are ignored. Files with malformed dates or counts fail validation.

Named App Analytics columns such as `First Time Downloads`, `Redownloads`, `Product Page Views`, `Crashes`, or `Updates` are imported only if the export also includes the SplashLens SKU. Metrics absent from the export remain absent in the dashboard; downloads do not stand in for installs or uninstalls. Apple reports with negative refund or credit units require separate review because the importer does not silently turn those into zero.

```powershell
npm run store-metrics:import -- --file C:\path\to\app-store-export.csv --format app-store-connect --source app_store_connect_export --dry-run
npm run store-metrics:import -- --file C:\path\to\app-store-export.csv --format app-store-connect --source app_store_connect_export --d1
```

## Google Play Console

Export the app statistics CSV for `com.splashlens.fieldtools`. The importer requires the `Package Name` column and ignores rows for other apps. It recognizes daily device/user installs, uninstalls, upgrades/update events, crashes, store-listing visitors, and acquisitions. When both daily device and event columns describe the same metric, the importer uses the device column once. Do not combine dimensional breakdowns (for example, country and device exports) in one import source; those would count the same activity twice.

```powershell
npm run store-metrics:import -- --file C:\path\to\google-play-statistics.csv --format google-play --source google_play_console_export --dry-run
npm run store-metrics:import -- --file C:\path\to\google-play-statistics.csv --format google-play --source google_play_console_export --d1
```

## Verification

1. Run the dry import and inspect dates, platform, metric, and value.
2. Run the D1 import from the trusted operator PC, or omit `--d1` when `SPLASHLENS_STATS_SECRET` is present.
3. Open the protected owner dashboard and confirm the `Official store imports` table, its source column, and latest import date. Totals are grouped by store, metric, and source so overlapping exports remain visible instead of being silently added together.
4. Re-importing the same platform, metric, date, and source updates that row instead of duplicating it.

No Apple or Google credential is stored in Git. If console exports are unavailable locally, the dashboard correctly shows `No official Apple/Google exports imported yet` rather than inferring downloads from click or shell-open events. The `ops/store-metrics-example.csv` file is a format example only and must never be imported as evidence.

Format references: [Apple Summary Sales Report](https://developer.apple.com/help/app-store-connect/reference/reporting/summary-sales-report/), [Apple product type identifiers](https://developer.apple.com/help/app-store-connect/reference/reporting/product-type-identifiers/), and [Google Play monthly export fields](https://support.google.com/googleplay/android-developer/answer/6135870).
