import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

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

test('Google Play bulk crash report detects Daily Crashes and ignores ANRs', () => {
  const csv = [
    'Date,Package Name,Device,Daily Crashes,Daily ANRs',
    '2026-10-01,com.splashlens.fieldtools,device-a,2,7',
    '2026-10-01,com.splashlens.fieldtools,device-b,3,9',
    '2026-10-01,com.another.app,device-c,99,99',
  ].join('\n');
  assert.deepEqual(entriesFromOfficialCsv(csv, 'auto', ''), [{
    platform: 'google_play', metric: 'crashes', value: 5, date: '2026-10-01',
    source: 'google_play_console_export', notes: 'Google Play Console official export',
  }]);
});

test('Google Play chooses Daily Crashes once when a Crashes alias is also present', () => {
  const csv = 'Date,Package Name,Daily Crashes,Crashes\n2026-10-01,com.splashlens.fieldtools,2,7';
  assert.deepEqual(entriesFromOfficialCsv(csv, 'google-play', '').map(({ metric, value }) => [metric, value]), [
    ['crashes', 2],
  ]);
});

test('official metric aggregation rejects totals beyond the safe integer range', () => {
  const csv = [
    'Date,Package Name,Daily Device Installs',
    `2026-10-01,com.splashlens.fieldtools,${Number.MAX_SAFE_INTEGER}`,
    '2026-10-01,com.splashlens.fieldtools,2',
  ].join('\n');
  assert.throws(() => entriesFromOfficialCsv(csv, 'auto', ''), /total exceeds the safe integer range/);
});

test('CLI dry-run decodes UTF-8 and BOM-marked UTF-16 official exports without credentials or writes', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'splashlens-store-import-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const csv = 'Date,Package Name,Daily Device Installs\r\n2026-10-01,com.splashlens.fieldtools,8\r\n';
  const utf16le = Buffer.from(`\uFEFF${csv}`, 'utf16le');
  const utf16be = Buffer.from(utf16le).swap16();
  for (const [encoding, bytes] of [
    ['utf8', Buffer.from(csv, 'utf8')],
    ['utf8-bom', Buffer.from(`\uFEFF${csv}`, 'utf8')],
    ['utf16le', utf16le],
    ['utf16be', utf16be],
  ]) {
    const path = join(directory, `${encoding}.csv`);
    writeFileSync(path, bytes);
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL('../tools/import-store-metrics.mjs', import.meta.url)),
      '--file', path, '--dry-run', '--d1', '--endpoint', 'http://127.0.0.1:1',
    ], { encoding: 'utf8', timeout: 10000, env: { ...process.env, SPLASHLENS_STATS_SECRET: '' } });
    assert.equal(result.status, 0, `${encoding}: ${result.stderr}`);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.dryRun, true);
    assert.equal(payload.imported, undefined);
    assert.deepEqual(payload.entries.map(({ platform, metric, date, value }) => [platform, metric, date, value]), [
      ['google_play', 'installs', '2026-10-01', 8],
    ]);
  }
});

test('CLI fails closed on malformed encoding instead of cleaning corrupt header bytes', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'splashlens-store-import-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const csv = 'Date,Package Name,Daily Device Installs\n2026-10-01,com.splashlens.fieldtools,8';
  for (const [name, bytes] of [
    ['bad-utf8', Buffer.from([0xff, 0x00, 0x44])],
    ['truncated-utf16', Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(csv, 'utf16le'), Buffer.from([0x44])])],
    ['unmarked-utf16', Buffer.from(csv, 'utf16le')],
  ]) {
    const path = join(directory, `${name}.csv`);
    writeFileSync(path, bytes);
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL('../tools/import-store-metrics.mjs', import.meta.url)), '--file', path, '--dry-run',
    ], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 1, name);
    assert.match(result.stderr, /Store export encoding/);
    assert.equal(result.stdout, '');
  }
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
