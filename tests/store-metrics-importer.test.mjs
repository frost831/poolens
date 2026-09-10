import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { entriesFromCsv, parseArgs } from '../tools/import-store-metrics.mjs';

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

test('PartSnap is the default scanner path and has an immediate post-result upgrade nudge', () => {
  assert.match(appSource, /setScanMode\(_scanMode \|\| 'parts'\)/);
  assert.match(appSource, /renderPartSnapResultUpgradeOffer\('partsnap_result'\)/);
  assert.match(appSource, /post_value_upgrade_shown/);
  assert.match(appSource, /post_value_upgrade_clicked/);
});

test('store metric importer has dry-run and D1 fallback modes', () => {
  assert.deepEqual(parseArgs(['--file', 'x.csv', '--dry-run']).dryRun, true);
  assert.deepEqual(parseArgs(['--file', 'x.csv', '--d1']).d1, true);
  assert.match(importerSource, /SPLASHLENS_STATS_SECRET/);
  assert.match(importerSource, /wrangler/);
  assert.match(packageJson.scripts['store-metrics:import'], /import-store-metrics\.mjs/);
});
