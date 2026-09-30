# Official Store Metrics Import

The owner dashboard reads `store_metric_imports` and reports App Store and Google Play totals separately from app-click telemetry. App-click events are intent; only these imports are official store counts.

## App Store Connect

Export daily Sales and Trends units for SplashLens. The importer accepts raw CSV columns including `Provider`, `Units`, and `Begin Date`; when App Analytics exports include named fields such as `First Time Downloads`, `Redownloads`, `Product Page Views`, `Crashes`, or `Updates`, those fields are imported too.

```powershell
npm run store-metrics:import -- --file C:\path\to\app-store-export.csv --format app-store-connect --source app_store_connect_export --dry-run
npm run store-metrics:import -- --file C:\path\to\app-store-export.csv --format app-store-connect --source app_store_connect_export --d1
```

## Google Play Console

Export the app statistics CSV for `com.splashlens.fieldtools`. The importer recognizes daily device/user installs, uninstalls, upgrades/update events, crashes, store-listing visitors, and acquisitions.

```powershell
npm run store-metrics:import -- --file C:\path\to\google-play-statistics.csv --format google-play --source google_play_console_export --dry-run
npm run store-metrics:import -- --file C:\path\to\google-play-statistics.csv --format google-play --source google_play_console_export --d1
```

## Verification

1. Run the dry import and inspect dates, platform, metric, and value.
2. Run the D1 import from the trusted operator PC, or omit `--d1` when `SPLASHLENS_STATS_SECRET` is present.
3. Open the protected owner dashboard and confirm the `Official store imports` table and latest import date.
4. Re-importing the same platform, metric, date, and source updates that row instead of duplicating it.

No Apple or Google credential is stored in Git. If console exports are unavailable locally, the dashboard correctly shows `No official Apple/Google exports imported yet` rather than inferring downloads from click or shell-open events.
