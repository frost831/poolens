#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
    dryRun: false,
    d1: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') options.file = argv[++index] || '';
    else if (arg === '--endpoint') options.endpoint = argv[++index] || DEFAULT_ENDPOINT;
    else if (arg === '--source') options.source = argv[++index] || options.source;
    else if (arg === '--d1-database') options.d1Database = argv[++index] || options.d1Database;
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

function wranglerCommand() {
  if (process.platform !== 'win32') return { command: 'npx', prefixArgs: ['wrangler'] };
  const appData = process.env.APPDATA || join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
  const globalWrangler = join(appData, 'npm', 'wrangler.ps1');
  if (existsSync(globalWrangler)) {
    return { command: 'powershell.exe', prefixArgs: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', globalWrangler] };
  }
  return { command: 'powershell.exe', prefixArgs: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'wrangler'] };
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
  ], { encoding: 'utf8', timeout: 60000, windowsHide: true });
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
  const entries = entriesFromCsv(readFileSync(options.file, 'utf8'), options.source);
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

export { entriesFromCsv, parseArgs, parseCsv };
