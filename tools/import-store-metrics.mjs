#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const DEFAULT_ENDPOINT = 'https://app.splashlens.com/api/store-metrics';
const DEFAULT_D1_DATABASE = 'splashlens-subscribers';
const ALLOWED_PLATFORMS = new Set(['app_store', 'google_play', 'ios', 'android', 'play_store']);
const ALLOWED_METRICS = new Set([
  'downloads',
  'installs',
  'first_time_downloads',
  'redownloads',
  'store_listing_visitors',
  'product_page_views',
  'acquisitions',
  'updates',
  'crashes',
  'ratings',
  'uninstalls',
]);

function parseArgs(argv) {
  const options = {
    file: '',
    endpoint: DEFAULT_ENDPOINT,
    source: 'manual_console_export',
    d1Database: DEFAULT_D1_DATABASE,
    format: 'auto',
    dryRun: false,
    d1: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') options.file = argv[++index] || '';
    else if (arg === '--endpoint') options.endpoint = argv[++index] || DEFAULT_ENDPOINT;
    else if (arg === '--source') options.source = argv[++index] || options.source;
    else if (arg === '--d1-database') options.d1Database = argv[++index] || options.d1Database;
    else if (arg === '--format') options.format = clean(argv[++index] || 'auto', 40).toLowerCase();
    else if (arg === '--d1') options.d1 = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
  }
  return options;
}

function helpText() {
  return `SplashLens official store metric importer

CSV columns:
  date,platform,metric,value,notes

Platforms:
  app_store, google_play

Metrics:
  downloads, installs, first_time_downloads, redownloads, store_listing_visitors,
  product_page_views, acquisitions, updates, crashes, ratings, uninstalls

Examples:
  node tools/import-store-metrics.mjs --file exports/store-metrics.csv --dry-run
  node tools/import-store-metrics.mjs --file exports/app-store-sales.csv --format app-store-connect --dry-run
  node tools/import-store-metrics.mjs --file exports/google-play-statistics.csv --format google-play --dry-run
  node tools/import-store-metrics.mjs --file exports/store-metrics.csv
  node tools/import-store-metrics.mjs --file exports/store-metrics.csv --d1

Default mode posts to ${DEFAULT_ENDPOINT} and requires SPLASHLENS_STATS_SECRET.
Use --d1 only from this trusted PC when the protected API secret is absent locally.`;
}

function clean(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function normalizePlatform(value) {
  const platform = clean(value, 40).toLowerCase().replace(/\s+/g, '_');
  if (platform === 'ios') return 'app_store';
  if (platform === 'android' || platform === 'play_store') return 'google_play';
  return platform;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((item) => clean(item))) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell.replace(/\r$/, ''));
  if (row.some((item) => clean(item))) rows.push(row);
  return rows;
}

function entriesFromCsv(text, source) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => clean(header, 80).toLowerCase().replace(/\s+/g, '_'));
  const required = ['date', 'platform', 'metric', 'value'];
  for (const key of required) {
    if (!headers.includes(key)) throw new Error(`Missing required CSV column: ${key}`);
  }
  return rows.slice(1).map((row, index) => {
    const record = Object.fromEntries(headers.map((header, col) => [header, row[col] ?? '']));
    const metricDate = clean(record.date || record.metric_date, 20);
    const platform = normalizePlatform(record.platform);
    const metric = clean(record.metric, 80).toLowerCase().replace(/\s+/g, '_');
    const value = Math.max(0, Math.round(Number(String(record.value || '0').replace(/,/g, ''))));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) throw new Error(`Row ${index + 2}: date must be YYYY-MM-DD`);
    if (!ALLOWED_PLATFORMS.has(platform)) throw new Error(`Row ${index + 2}: unsupported platform ${record.platform}`);
    if (!ALLOWED_METRICS.has(metric)) throw new Error(`Row ${index + 2}: unsupported metric ${record.metric}`);
    if (!Number.isFinite(value)) throw new Error(`Row ${index + 2}: value must be numeric`);
    return {
      platform,
      metric,
      value,
      date: metricDate,
      source: clean(record.source || source, 120),
      notes: clean(record.notes || '', 500),
    };
  });
}

function normalizedHeader(value) {
  return clean(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function dateIso(value) {
  const raw = clean(value, 40);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  throw new Error(`Unsupported official store date: ${raw}`);
}

function numeric(value) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim() || '0');
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function detectFormat(headers) {
  const set = new Set(headers);
  if (set.has('provider') && set.has('units') && (set.has('begin_date') || set.has('date'))) return 'app-store-connect';
  if (set.has('package_name') && (set.has('daily_device_installs') || set.has('install_events') || set.has('crashes'))) return 'google-play';
  return 'generic';
}

function aggregateOfficialRows(rows, platform, source, dateFields, mappings) {
  const totals = new Map();
  for (const row of rows) {
    const dateField = dateFields.find((field) => clean(row[field]));
    if (!dateField) continue;
    const date = dateIso(row[dateField]);
    for (const [field, metric] of mappings) {
      if (!(field in row) || clean(row[field]) === '') continue;
      const key = `${date}|${metric}`;
      totals.set(key, (totals.get(key) || 0) + numeric(row[field]));
    }
  }
  return [...totals.entries()].map(([key, value]) => {
    const [date, metric] = key.split('|');
    return { platform, metric, value, date, source, notes: `${platform === 'app_store' ? 'App Store Connect' : 'Google Play Console'} official export` };
  });
}

function entriesFromOfficialCsv(text, requestedFormat, source) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map(normalizedHeader);
  const records = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  const format = requestedFormat === 'auto' ? detectFormat(headers) : requestedFormat;
  if (format === 'generic') return entriesFromCsv(text, source);
  if (format === 'app-store-connect') {
    return aggregateOfficialRows(records, 'app_store', source, ['begin_date', 'date'], [
      ['units', 'downloads'],
      ['first_time_downloads', 'first_time_downloads'],
      ['redownloads', 'redownloads'],
      ['product_page_views', 'product_page_views'],
      ['crashes', 'crashes'],
      ['updates', 'updates'],
    ]);
  }
  if (format === 'google-play') {
    return aggregateOfficialRows(records, 'google_play', source, ['date', 'day'], [
      ['daily_device_installs', 'installs'],
      ['daily_user_installs', 'first_time_downloads'],
      ['install_events', 'installs'],
      ['daily_device_uninstalls', 'uninstalls'],
      ['daily_user_uninstalls', 'uninstalls'],
      ['uninstall_events', 'uninstalls'],
      ['daily_device_upgrades', 'updates'],
      ['update_events', 'updates'],
      ['crashes', 'crashes'],
      ['store_listing_visitors', 'store_listing_visitors'],
      ['store_listing_acquisitions', 'acquisitions'],
    ]);
  }
  throw new Error(`Unsupported --format ${requestedFormat}`);
}

function wranglerCommand() {
  if (process.platform !== 'win32') return { command: 'npx', prefixArgs: ['wrangler'] };
  const npmCache = join(tmpdir(), 'splashlens-wrangler-npm-cache');
  const npxCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
  if (existsSync(npxCli)) {
    return { command: process.execPath, prefixArgs: [npxCli, '--cache', npmCache, '--yes', 'wrangler'] };
  }
  const appData = process.env.APPDATA || join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
  const wranglerJs = join(appData, 'npm', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  if (existsSync(wranglerJs)) {
    return { command: process.execPath, prefixArgs: [wranglerJs] };
  }
  const globalWrangler = join(appData, 'npm', 'wrangler.ps1');
  if (existsSync(globalWrangler)) {
    return { command: 'powershell.exe', prefixArgs: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', globalWrangler] };
  }
  return { command: 'npx.cmd', prefixArgs: ['--cache', npmCache, '--yes', 'wrangler'] };
}

function wranglerExecOptions() {
  const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => ![
    'npm_config_cache',
    'wrangler_log_path',
  ].includes(key.toLowerCase())));
  return {
    encoding: 'utf8',
    timeout: 60000,
    windowsHide: true,
    env: {
      ...cleanEnv,
      NPM_CONFIG_CACHE: join(tmpdir(), 'splashlens-wrangler-npm-cache'),
      WRANGLER_LOG_PATH: join(tmpdir(), 'splashlens-wrangler.log'),
    },
  };
}

function sqlString(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function writeD1(entries, database) {
  const wrangler = wranglerCommand();
  const statements = [
    `CREATE TABLE IF NOT EXISTS store_metric_imports (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      metric TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      metric_date TEXT NOT NULL,
      source TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform, metric, metric_date, source)
    );`,
    ...entries.map((entry) => `INSERT INTO store_metric_imports (id, platform, metric, value, metric_date, source, notes)
      VALUES ('store_metric_' || lower(hex(randomblob(16))), ${sqlString(entry.platform)}, ${sqlString(entry.metric)}, ${entry.value}, ${sqlString(entry.date)}, ${sqlString(entry.source)}, ${sqlString(entry.notes)})
      ON CONFLICT(platform, metric, metric_date, source) DO UPDATE SET value = excluded.value, notes = excluded.notes, updated_at = CURRENT_TIMESTAMP;`),
  ].join('\n');
  const output = execFileSync(wrangler.command, [
    ...wrangler.prefixArgs,
    'd1',
    'execute',
    database,
    '--remote',
    '--json',
    '--command',
    statements,
  ], wranglerExecOptions());
  return JSON.parse(output);
}

async function postApi(entries, endpoint, secret) {
  if (!secret) throw new Error('SPLASHLENS_STATS_SECRET is required unless --d1 or --dry-run is used.');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SplashLens-Stats-Secret': secret,
    },
    body: JSON.stringify({ entries }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || `Store metric import failed: HTTP ${response.status}`);
  return payload;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.file) {
    console.log(helpText());
    process.exitCode = options.help ? 0 : 1;
    return;
  }
  const entries = entriesFromOfficialCsv(readFileSync(options.file, 'utf8'), options.format, options.source);
  if (!entries.length) throw new Error('No supported metric rows were found in the store export.');
  if (options.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, entries }, null, 2));
    return;
  }
  const result = options.d1
    ? writeD1(entries, options.d1Database)
    : await postApi(entries, options.endpoint, process.env.SPLASHLENS_STATS_SECRET || '');
  console.log(JSON.stringify({ ok: true, imported: entries.length, result }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export { detectFormat, entriesFromCsv, entriesFromOfficialCsv, parseArgs, parseCsv };
