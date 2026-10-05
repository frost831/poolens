import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { entriesFromCsv, entriesFromOfficialCsv, parseArgs } from '../tools/import-store-metrics.mjs';
import { onRequestPost } from '../functions/api/store-metrics.js';

const statsSource = readFileSync(new URL('../functions/api/stats.js', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const importerSource = readFileSync(new URL('../tools/import-store-metrics.mjs', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('store metric importer normalizes official App Store and Google Play exports', () => {
  const csv = [
    'date,platform,metric,value,notes',
    '2026-09-10,iOS,downloads,"1,234",App Store Connect daily export',
    '2026-09-10,android,installs,42,Play Console daily export',
  ].join('\n');
  assert.deepEqual(entriesFromCsv(csv, 'console_export'), [
    {
      platform: 'app_store',
      metric: 'downloads',
      value: 1234,
      date: '2026-09-10',
      source: 'console_export',
      notes: 'App Store Connect daily export',
    },
    {
      platform: 'google_play',
      metric: 'installs',
      value: 42,
      date: '2026-09-10',
      source: 'console_export',
      notes: 'Play Console daily export',
    },
  ]);
});

test('official store metrics are exposed in owner reporting', () => {
  assert.match(statsSource, /storeMetricStats/);
  assert.match(statsSource, /store_metric_imports/);
  assert.match(dashboardSource, /Official store imports/);
  assert.match(dashboardSource, /latestStoreMetricImportAt/);
});

test('raw App Store Connect sales exports aggregate download units by day', () => {
  const csv = [
    'Provider,SKU,Title,Units,Begin Date',
    'APPLE,splashlens-ios-2026,SplashLens,3,09/10/2026',
    'APPLE,splashlens-ios-2026,SplashLens,2,09/10/2026',
  ].join('\n');
  assert.deepEqual(entriesFromOfficialCsv(csv, 'auto', 'app_store_connect_export'), [{
    platform: 'app_store', metric: 'downloads', value: 5, date: '2026-09-10',
    source: 'app_store_connect_export', notes: 'App Store Connect official export',
  }]);
});

test('raw Google Play statistics exports map install, update, uninstall, and crash rows', () => {
  const csv = [
    'Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Daily Device Upgrades,Crashes',
    '2026-09-10,com.splashlens.fieldtools,8,2,3,1',
  ].join('\n');
  assert.deepEqual(entriesFromOfficialCsv(csv, 'auto', 'google_play_export').map((entry) => [entry.metric, entry.value]), [
    ['installs', 8], ['uninstalls', 2], ['updates', 3], ['crashes', 1],
  ]);
});

test('Apple tab export counts only SplashLens app downloads, redownloads, and updates', () => {
  const csv = [
    'Provider\tSKU\tTitle\tUnits\tBegin Date\tProduct Type Identifier',
    'APPLE\tsplashlens-ios-2026\tSplashLens\t4\t10/01/2026\t1F',
    'APPLE\tsplashlens-ios-2026\tSplashLens\t2\t10/01/2026\t3F',
    'APPLE\tsplashlens-ios-2026\tSplashLens\t3\t10/01/2026\t7F',
    'APPLE\tsplashlens-ios-2026\tPro\t99\t10/01/2026\tIAY',
    'APPLE\tother-app\tOther\t44\t10/01/2026\t1F',
  ].join('\n');
  assert.deepEqual(entriesFromOfficialCsv(csv, 'auto', '').map(({ metric, value, source }) => [metric, value, source]), [
    ['downloads', 4, 'app_store_connect_export'],
    ['redownloads', 2, 'app_store_connect_export'],
    ['updates', 3, 'app_store_connect_export'],
  ]);
});

test('Google Play export filters package and chooses one install and uninstall definition', () => {
  const csv = [
    'Date,Package Name,Daily Device Installs,Install Events,Daily Device Uninstalls,Uninstall Events,Daily Device Upgrades,Crashes',
    '2026-10-01,com.splashlens.fieldtools,8,9,2,3,4,1',
    '2026-10-01,com.another.app,100,100,90,90,20,50',
  ].join('\n');
  assert.deepEqual(entriesFromOfficialCsv(csv, 'auto', '').map(({ metric, value }) => [metric, value]), [
    ['installs', 8], ['uninstalls', 2], ['updates', 4], ['crashes', 1],
  ]);
});

test('Google Play store performance export is detected without an installs column', () => {
  const csv = 'Date,Package Name,Store Listing Visitors,Store Listing Acquisitions\n2026-10-01,com.splashlens.fieldtools,12,3';
  assert.deepEqual(entriesFromOfficialCsv(csv, 'auto', '').map(({ metric, value }) => [metric, value]), [
    ['store_listing_visitors', 12], ['acquisitions', 3],
  ]);
});

test('store import rejects malformed counts and dates instead of inventing zeros', () => {
  const generic = 'date,platform,metric,value\n2026-10-01,app_store,downloads,bad';
  assert.throws(() => entriesFromCsv(generic, ''), /nonnegative whole number/);
  assert.throws(() => entriesFromCsv('date,platform,metric,value\n2026-02-30,app_store,downloads,2', ''), /real YYYY-MM-DD date/);
  assert.throws(() => entriesFromOfficialCsv('Date,Package Name,Crashes\n2026-10-01,com.splashlens.fieldtools,bad', 'auto', ''), /nonnegative whole number/);
});

test('store metrics API rejects invalid rows before any import', async () => {
  let inserts = 0;
  const db = { prepare(sql) { return { run() { if (/INSERT/.test(sql)) inserts += 1; return Promise.resolve(); } }; } };
  const request = new Request('https://app.splashlens.com/api/store-metrics', {
    method: 'POST', headers: { 'X-SplashLens-Stats-Secret': 'test' },
    body: JSON.stringify({ entries: [{ platform: 'app_store', metric: 'downloads', value: 'bad', date: '2026-10-01', source: 'app_store_connect_export' }] }),
  });
  const response = await onRequestPost({ request, env: { SPLASHLENS_STATS_SECRET: 'test', SUBSCRIBERS_DB: db } });
  assert.equal(response.status, 400);
  assert.equal(inserts, 0);
});

test('PartSnap is the default scanner path and has an immediate post-result upgrade nudge', () => {
  assert.match(appSource, /setScanMode\(_scanMode \|\| 'parts'\)/);
  assert.match(appSource, /renderPartSnapResultUpgradeOffer\('partsnap_result'\)/);
  assert.match(appSource, /post_value_upgrade_shown/);
  assert.match(appSource, /post_value_upgrade_clicked/);
  assert.match(appSource, /Save this job, customer summary, and equipment history with Pro\./);
  assert.match(appSource, /ai_scan_attempted/);
  assert.match(appSource, /ai_scan_completed/);
  assert.match(appSource, /ai_scan_failed/);
  assert.match(appSource, /lookup_zero_result/);
});

test('store metric importer has dry-run and D1 fallback modes', () => {
  assert.deepEqual(parseArgs(['--file', 'x.csv', '--dry-run']).dryRun, true);
  assert.deepEqual(parseArgs(['--file', 'x.csv', '--d1']).d1, true);
  assert.equal(parseArgs(['--file', 'x.csv', '--format', 'google-play']).format, 'google-play');
  assert.match(importerSource, /SPLASHLENS_STATS_SECRET/);
  assert.match(importerSource, /wrangler/);
  assert.match(packageJson.scripts['store-metrics:import'], /import-store-metrics\.mjs/);
});
