#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';

const PILOT_ID = 'closing-season-10-tech-2026';
const PARTICIPANTS = Array.from({ length: 10 }, (_, index) => `sl-close-${String(index + 1).padStart(2, '0')}`);

function wranglerCommand() {
  if (process.platform !== 'win32') return { command: 'npx', prefixArgs: ['wrangler'] };
  const cache = join(tmpdir(), 'splashlens-wrangler-npm-cache');
  const npxCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
  if (existsSync(npxCli)) return { command: process.execPath, prefixArgs: [npxCli, '--cache', cache, '--yes', 'wrangler'] };
  return { command: 'npx.cmd', prefixArgs: ['--cache', cache, '--yes', 'wrangler'] };
}

function query(database) {
  const wrangler = wranglerCommand();
  const sql = `
    SELECT
      json_extract(props, '$.participant_id') AS participant_id,
      SUM(CASE WHEN event IN ('field_challenge_started','field_challenge_routed') THEN 1 ELSE 0 END) AS starts,
      SUM(CASE WHEN event = 'field_challenge_completed' THEN 1 ELSE 0 END) AS completions,
      ROUND(AVG(CASE WHEN event = 'field_challenge_completed' THEN CAST(json_extract(props, '$.seconds_to_value') AS REAL) END), 1) AS avg_seconds_to_value,
      SUM(CASE WHEN event IN ('partsnap_result_feedback','field_feedback_quick_answered','field_feedback_submitted','field_challenge_feedback') THEN 1 ELSE 0 END) AS feedback,
      MAX(CASE WHEN event = 'field_feedback_submitted' THEN json_extract(props, '$.time_saved') END) AS time_saved,
      MAX(CASE WHEN event = 'field_feedback_submitted' THEN json_extract(props, '$.upgrade_intent') END) AS upgrade_intent,
      SUM(CASE WHEN event IN ('session_started','return_task_continued','partsnap_field_stop_reopened') THEN 1 ELSE 0 END) AS return_events,
      SUM(CASE WHEN event = 'partsnap_result' THEN 1 ELSE 0 END) AS partsnap_results,
      SUM(CASE WHEN event = 'checkout_click' THEN 1 ELSE 0 END) AS checkout_starts,
      MAX(created_at) AS last_seen
    FROM events
    WHERE json_extract(props, '$.pilot_id') = '${PILOT_ID}'
      AND COALESCE(source, '') NOT IN ('qa','codex','codex_smoke','launch-gate-test')
      AND lower(COALESCE(source, '')) NOT LIKE 'codex%'
      AND lower(COALESCE(source, '')) NOT IN ('release_gate','release-gate')
      AND lower(COALESCE(user_agent, '')) NOT LIKE '%headless%'
      AND lower(COALESCE(user_agent, '')) NOT LIKE '%bot%'
    GROUP BY json_extract(props, '$.participant_id')
    ORDER BY participant_id;
  `.replace(/\s+/g, ' ').trim();
  const args = [...wrangler.prefixArgs, 'd1', 'execute', database, '--remote', '--json', '--command', sql];
  const options = {
    encoding: 'utf8', timeout: 60000, windowsHide: true,
    env: { ...process.env, NPM_CONFIG_CACHE: join(tmpdir(), 'splashlens-wrangler-npm-cache'), WRANGLER_LOG_PATH: join(tmpdir(), 'splashlens-wrangler.log') },
  };
  let raw = '';
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      raw = execFileSync(wrangler.command, args, options);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed[0]?.success !== true) throw new Error('Pilot report D1 query failed.');
  return parsed[0].results || [];
}

const databaseArg = process.argv.indexOf('--database');
const database = databaseArg >= 0 ? process.argv[databaseArg + 1] : 'splashlens-subscribers';
const jsonMode = process.argv.includes('--json');
const byParticipant = new Map(query(database).map((row) => [row.participant_id, row]));
const rows = PARTICIPANTS.map((participant_id) => ({
  participant_id,
  starts: 0,
  completions: 0,
  avg_seconds_to_value: null,
  feedback: 0,
  time_saved: '',
  upgrade_intent: '',
  return_events: 0,
  partsnap_results: 0,
  checkout_starts: 0,
  last_seen: '',
  ...(byParticipant.get(participant_id) || {}),
}));
const totals = rows.reduce((acc, row) => {
  for (const key of ['starts', 'completions', 'feedback', 'return_events', 'partsnap_results', 'checkout_starts']) acc[key] += Number(row[key] || 0);
  return acc;
}, { starts: 0, completions: 0, feedback: 0, return_events: 0, partsnap_results: 0, checkout_starts: 0 });
const report = { ok: true, pilot_id: PILOT_ID, generated_at: new Date().toISOString(), totals, targets: { partsnap_results: 10, feedback: 5, checkout_starts: 3, verified_new_paid_conversions: 1 }, participants: rows };

if (jsonMode) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`# SplashLens Closing Pilot\n\nGenerated: ${report.generated_at}\n`);
  console.log(`Starts ${totals.starts} | Completions ${totals.completions} | PartSnap ${totals.partsnap_results}/10 | Feedback ${totals.feedback}/5 | Checkout starts ${totals.checkout_starts}/3`);
  console.table(rows);
  console.log('\nPaid conversion is intentionally excluded from participant attribution until a signed Stripe completion can be joined to a verified account email.');
}
