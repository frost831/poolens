#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_BASE_URL = 'https://app.splashlens.com';
const DEFAULT_SITE_URL = 'https://splashlens.com';
const DEFAULT_D1_DATABASE = 'splashlens-subscribers';
const STALE_ROTATION_PATH = '/api/stripe-webhook?rotation=flagship-audit-3dc2b80e-d7fc-4c33-adef-54c574f7ac0b';

const REPORTING_EVENT_FILTER = `
 AND COALESCE(event, '') NOT IN ('session_heartbeat', 'amplitude_readiness_smoke', 'growth_plan_smoke', 'audit_handoff_probe', 'codex_deploy_smoke', 'codex_launch_probe', 'codex_post_push_probe', 'command_center_probe', 'release_gate_live_custom_domain', 'release_gate_live_preview')
 AND COALESCE(source, '') NOT IN ('qa', 'codex', 'codex_smoke', 'launch-gate-test')
 AND lower(COALESCE(user_agent, '')) NOT LIKE '%headless%'
 AND lower(COALESCE(user_agent, '')) NOT LIKE '%bot%'
 AND lower(COALESCE(user_agent, '')) NOT LIKE '%crawler%'
 AND lower(COALESCE(user_agent, '')) NOT LIKE '%spider%'
 AND lower(COALESCE(user_agent, '')) NOT LIKE '%preview%'
 AND lower(COALESCE(user_agent, '')) NOT LIKE '%compatible; meta-externalagent%'
 AND COALESCE(path, '') NOT LIKE '/test/%'
 AND COALESCE(path, '') NOT LIKE '%utm_source=qa%'
 AND COALESCE(path, '') NOT LIKE '%utm_medium=playwright%'
 AND COALESCE(path, '') NOT LIKE '%codex%'
 AND COALESCE(path, '') NOT LIKE '%amplitude-readiness%'
 AND COALESCE(path, '') NOT LIKE '%growth-plan%'
 AND COALESCE(path, '') NOT LIKE '%verify=%'
`;

const FUNNEL_STAGES = [
  {
    key: 'traffic',
    label: 'Article / site traffic',
    events: ['site_page_view', 'campaign_landing_view', 'campaign_view', 'field_challenge_page_view', 'article_referral_open'],
  },
  {
    key: 'app_intent',
    label: 'App or store intent',
    events: ['open_app_click', 'app_store_download_click', 'google_play_download_click', 'play_store_download_click', 'app_open', 'first_app_open', 'native_shell_open', 'native_shell_first_open', 'pwa_installed'],
  },
  {
    key: 'first_action',
    label: 'First field action',
    events: ['first_action_started', 'manual_code_search', 'ai_scan_started', 'service_proof_workflow_started', 'facility_workflow_action_selected', 'field_challenge_started', 'field_challenge_routed'],
  },
  {
    key: 'first_value',
    label: 'Useful result',
    events: ['first_value_completed', 'partsnap_result', 'service_report_saved', 'service_proof_summary_generated', 'service_proof_share_link_created', 'field_challenge_completed'],
  },
  {
    key: 'feedback',
    label: 'Feedback captured',
    events: ['partsnap_result_feedback', 'field_feedback_quick_answered', 'field_feedback_submitted', 'field_challenge_feedback', 'field_score_feedback'],
  },
  {
    key: 'return_use',
    label: 'Return / continued use',
    events: ['return_task_continued', 'session_started', 'app_tab_view', 'partsnap_field_stop_reopened'],
  },
  {
    key: 'checkout_intent',
    label: 'Checkout intent',
    events: ['checkout_click', 'upgrade_click', 'post_value_upgrade_clicked', 'partsnap_pro_restore_requested', 'native_purchase_click', 'paid_lane_click', 'paid_lane_lead_captured'],
  },
  {
    key: 'paid_or_restored',
    label: 'Paid / entitlement proof',
    events: ['paid_entitlement_activated', 'checkout_success', 'stripe_checkout_completed', 'restore_entitlement_success'],
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    siteUrl: DEFAULT_SITE_URL,
    json: false,
    checkStaleWebhook: false,
    d1Fallback: true,
    d1Database: DEFAULT_D1_DATABASE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--check-stale-webhook') options.checkStaleWebhook = true;
    else if (arg === '--no-d1-fallback') options.d1Fallback = false;
    else if (arg === '--d1-database') options.d1Database = argv[++index] || options.d1Database;
    else if (arg === '--base-url') options.baseUrl = argv[++index] || options.baseUrl;
    else if (arg === '--site-url') options.siteUrl = argv[++index] || options.siteUrl;
    else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  options.siteUrl = options.siteUrl.replace(/\/+$/, '');
  return options;
}

function helpText() {
  return `SplashLens Field Intelligence Loop

Usage:
  node tools/run-field-intelligence-loop.mjs [--json] [--check-stale-webhook] [--no-d1-fallback]

Environment:
  SPLASHLENS_STATS_SECRET   Optional. Pulls protected /api/stats and /api/admin when present.

This runner never prints secrets and does not treat missing local secrets as a production failure.
When SPLASHLENS_STATS_SECRET is absent, it attempts a read-only Wrangler D1 pull from splashlens-subscribers.`;
}

async function safeFetch(label, url, init = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      redirect: init.redirect || 'follow',
      headers: {
        'Accept': 'application/json, text/html;q=0.9, */*;q=0.8',
        'Cache-Control': 'no-cache',
        ...(init.headers || {}),
      },
      method: init.method || 'GET',
      body: init.body,
      signal: AbortSignal.timeout(init.timeoutMs || 20000),
    });
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const expected = Array.isArray(init.expectStatuses) ? init.expectStatuses : [];
    return {
      label,
      url,
      ok: response.ok || expected.includes(response.status),
      status: response.status,
      contentType,
      location: response.headers.get('location') || '',
      length: text.length,
      ms: Date.now() - startedAt,
      json: text.trimStart().startsWith('{') || text.trimStart().startsWith('['),
      body: text,
    };
  } catch (error) {
    return {
      label,
      url,
      ok: false,
      status: 0,
      contentType: '',
      location: '',
      length: 0,
      ms: Date.now() - startedAt,
      json: false,
      error: error instanceof Error ? error.message : String(error),
      body: '',
    };
  }
}

function parseJsonProbe(probe) {
  if (!probe?.body) return null;
  try {
    return JSON.parse(probe.body);
  } catch {
    return null;
  }
}

function envStatus(env = process.env) {
  return {
    statsSecret: Boolean(env.SPLASHLENS_STATS_SECRET),
    amplitudeApiKey: Boolean(env.AMPLITUDE_API_KEY),
    stripeSecretKey: Boolean(env.STRIPE_SECRET_KEY),
  };
}

function wranglerCommand() {
  if (process.platform !== 'win32') return { command: 'npx', prefixArgs: ['wrangler'] };
  const appData = process.env.APPDATA || join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
  const wranglerJs = join(appData, 'npm', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  if (existsSync(wranglerJs)) {
    return {
      command: process.execPath,
      prefixArgs: [wranglerJs],
    };
  }
  const globalWrangler = join(appData, 'npm', 'wrangler.ps1');
  if (existsSync(globalWrangler)) {
    return {
      command: 'powershell.exe',
      prefixArgs: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', globalWrangler],
    };
  }
  return {
    command: 'powershell.exe',
    prefixArgs: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'wrangler'],
  };
}

function d1Rows(database, sql) {
  const wrangler = wranglerCommand();
  const commandSql = String(sql).replace(/\s+/g, ' ').trim();
  const raw = execFileSync(wrangler.command, [
    ...wrangler.prefixArgs,
    'd1',
    'execute',
    database,
    '--remote',
    '--json',
    '--command',
    commandSql,
  ], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000,
    windowsHide: true,
  });
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed[0]?.success !== true) {
    throw new Error(`D1 query failed for ${database}`);
  }
  return parsed[0].results || [];
}

function firstValue(database, sql) {
  const row = d1Rows(database, sql)[0] || {};
  return Number(row.value || 0);
}

function tableExists(database, tableName) {
  const safeName = String(tableName).replace(/'/g, "''");
  return Boolean(d1Rows(database, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${safeName}'`)[0]?.name);
}

function quoteEvents(events) {
  return events.map((event) => `'${String(event).replace(/'/g, "''")}'`).join(', ');
}

function whereDays(days) {
  return `created_at >= datetime('now', '-${Number(days)} days')`;
}

function countEvents(database, days, events = null) {
  const eventClause = events ? `event IN (${quoteEvents(events)}) AND ` : '';
  return firstValue(database, `SELECT COUNT(*) AS value FROM events WHERE ${eventClause}${whereDays(days)} ${REPORTING_EVENT_FILTER}`);
}

function d1Funnel(database, days) {
  const rows = FUNNEL_STAGES.map((stage) => ({
    ...stage,
    count: countEvents(database, days, stage.events),
  }));
  return rows.map((row, index) => {
    const previous = index > 0 ? rows[index - 1].count : null;
    const conversionFromPrevious = previous && previous > 0 ? Math.round((row.count / previous) * 1000) / 10 : null;
    return { ...row, conversionFromPrevious };
  });
}

function paymentRows(database) {
  return d1Rows(database, `
    SELECT event_type, COALESCE(plan, 'unknown') AS plan, COUNT(*) AS count,
      COUNT(DISTINCT stripe_session_id) AS stripeSessions,
      MIN(created_at) AS firstSeen,
      MAX(created_at) AS lastSeen
    FROM payment_events
    GROUP BY event_type, COALESCE(plan, 'unknown')
    ORDER BY count DESC, plan ASC
  `);
}

function remoteD1Snapshot(database) {
  const payments = paymentRows(database);
  const splashlensPayments = payments.filter((row) => /partsnap|splashlens|splash lens/i.test(String(row.plan || '')));
  const foreignPayments = payments.filter((row) => !/partsnap|splashlens|splash lens/i.test(String(row.plan || '')));
  const splashlensCompleted = splashlensPayments.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const suspectCompleted = foreignPayments.reduce((sum, row) => sum + Number(row.count || 0), 0);

  const storeSignals = d1Rows(database, `
    SELECT event, COUNT(*) AS count, MIN(created_at) AS firstSeen, MAX(created_at) AS lastSeen
    FROM events
    WHERE event LIKE '%store%' OR event LIKE '%play%' OR event LIKE '%native%' OR event LIKE '%install%'
    GROUP BY event
    ORDER BY count DESC
  `);
  const hasStoreImports = tableExists(database, 'store_metric_imports');
  const storeMetricImports = hasStoreImports
    ? d1Rows(database, `
        SELECT platform, metric, SUM(value) AS value, MIN(metric_date) AS firstDate, MAX(metric_date) AS lastDate
        FROM store_metric_imports
        GROUP BY platform, metric
        ORDER BY platform ASC, metric ASC
      `)
    : [];

  return {
    ok: true,
    source: `wrangler-d1:${database}`,
    generatedAt: new Date().toISOString(),
    filters: {
      productionClean: true,
      note: 'Headless, bot, crawler, Codex, QA, Playwright, launch-gate, /test, readiness, verification, and low-signal heartbeat traffic are excluded from owner-facing conversion counts.',
    },
    metrics: {
      rawEventsTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM events'),
      rawSessionHeartbeatTotal: firstValue(database, "SELECT COUNT(*) AS value FROM events WHERE event = 'session_heartbeat'"),
      events7d: countEvents(database, 7),
      events30d: countEvents(database, 30),
      appOpens30d: countEvents(database, 30, ['app_open', 'first_app_open', 'native_shell_open', 'native_shell_first_open']),
      firstActions30d: countEvents(database, 30, ['first_action_started', 'manual_code_search', 'ai_scan_started', 'service_proof_workflow_started', 'facility_workflow_action_selected', 'field_challenge_started']),
      firstValues30d: countEvents(database, 30, ['first_value_completed', 'partsnap_result', 'service_report_saved', 'service_proof_summary_generated', 'service_proof_share_link_created', 'field_challenge_completed']),
      partSnapResults30d: countEvents(database, 30, ['partsnap_result']),
      aiScanStarts30d: countEvents(database, 30, ['ai_scan_started']),
      manualSearches30d: countEvents(database, 30, ['manual_code_search']),
      serviceProof30d: countEvents(database, 30, ['service_report_saved', 'service_proof_summary_generated', 'service_proof_share_link_created']),
      feedback30d: countEvents(database, 30, ['partsnap_result_feedback', 'field_feedback_quick_answered', 'field_feedback_submitted', 'field_score_feedback']),
      checkoutClicks30d: countEvents(database, 30, ['checkout_click', 'upgrade_click', 'post_value_upgrade_clicked', 'native_purchase_click']),
      subscribersTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM subscribers'),
      freeProfilesTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM free_profiles'),
      verifiedFreeProfilesTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM free_profiles WHERE verified_at IS NOT NULL'),
      userAccountsTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM user_accounts'),
      partnerLeadsTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM partner_intake'),
      commercialEntitlementsTotal: firstValue(database, 'SELECT COUNT(*) AS value FROM commercial_entitlements'),
      commercialEntitlementsActive: firstValue(database, "SELECT COUNT(*) AS value FROM commercial_entitlements WHERE status IN ('active','trialing','pilot')"),
      splashlensPaidCompletions: splashlensCompleted,
      suspectNonSplashLensPaymentRows: suspectCompleted,
    },
    funnel7d: d1Funnel(database, 7),
    funnel30d: d1Funnel(database, 30),
    topEvents30d: d1Rows(database, `SELECT event, COUNT(*) AS count FROM events WHERE ${whereDays(30)} ${REPORTING_EVENT_FILTER} GROUP BY event ORDER BY count DESC LIMIT 15`),
    topPages30d: d1Rows(database, `SELECT COALESCE(path, '/') AS path, COUNT(*) AS count FROM events WHERE ${whereDays(30)} ${REPORTING_EVENT_FILTER} GROUP BY COALESCE(path, '/') ORDER BY count DESC LIMIT 15`),
    paymentsByPlan: splashlensPayments,
    foreignPaymentsByPlan: foreignPayments,
    storeSignals,
    storeMetricImports,
  };
}

function stageDrop(funnel = []) {
  let worst = null;
  for (let index = 1; index < funnel.length; index += 1) {
    const current = funnel[index];
    const previous = funnel[index - 1];
    if (!previous || !Number.isFinite(Number(previous.count)) || Number(previous.count) <= 0) continue;
    const rate = Number(current.count || 0) / Number(previous.count);
    const dropFraction = 1 - rate;
    const drop = Math.round(dropFraction * 1000) / 10;
    if (!worst || drop > worst.drop) {
      worst = {
        from: previous.label,
        to: current.label,
        previous: Number(previous.count || 0),
        current: Number(current.count || 0),
        conversion: Math.round(rate * 1000) / 10,
        drop,
      };
    }
  }
  return worst;
}

function buildRecommendations({ probes, env, stats, admin }) {
  const byLabel = Object.fromEntries(probes.map((probe) => [probe.label, probe]));
  const recommendations = [];

  if (!byLabel.app?.ok) {
    recommendations.push({
      severity: 'critical',
      issue: 'App is not reachable',
      evidence: byLabel.app?.error || `HTTP ${byLabel.app?.status}`,
      fix: 'Treat as production incident and redeploy or restore Cloudflare Pages routing.',
    });
  }
  if (!byLabel.site?.ok) {
    recommendations.push({
      severity: 'critical',
      issue: 'Marketing site is not reachable',
      evidence: byLabel.site?.error || `HTTP ${byLabel.site?.status}`,
      fix: 'Treat as production incident and redeploy or restore Cloudflare Pages routing.',
    });
  }
  if (!byLabel.checkoutMonthly || byLabel.checkoutMonthly.status !== 302 || !/stripe\.com/i.test(byLabel.checkoutMonthly.location)) {
    recommendations.push({
      severity: 'high',
      issue: 'Checkout start is not clearly redirecting to Stripe',
      evidence: byLabel.checkoutMonthly ? `HTTP ${byLabel.checkoutMonthly.status} ${byLabel.checkoutMonthly.location}` : 'No checkout probe',
      fix: 'Check /api/checkout configuration and Stripe price/payment-link environment variables.',
    });
  }
  const amplitude = parseJsonProbe(byLabel.amplitudeConfig);
  if (!amplitude?.ok || amplitude.enabled !== true || amplitude.status !== 'ready') {
    recommendations.push({
      severity: 'high',
      issue: 'Amplitude forwarding is not ready',
      evidence: amplitude ? JSON.stringify({ ok: amplitude.ok, enabled: amplitude.enabled, status: amplitude.status }) : 'No JSON payload',
      fix: 'Verify server-side Amplitude environment variables and /api/events forwarding.',
    });
  }
  if (!env.statsSecret && !stats?.ok) {
    recommendations.push({
      severity: 'blocked-local',
      issue: 'This PC cannot pull protected owner analytics',
      evidence: 'SPLASHLENS_STATS_SECRET is not present in the local environment.',
      fix: 'Set SPLASHLENS_STATS_SECRET locally for owner API pulls, or keep using the read-only Wrangler D1 fallback.',
    });
  } else if (!env.statsSecret && stats?.source?.startsWith('wrangler-d1:')) {
    recommendations.push({
      severity: 'info',
      issue: 'Owner API secret is absent locally, but D1 fallback is working',
      evidence: `Pulled ${stats.metrics?.events30d ?? 0} clean events in 30 days from ${stats.source}.`,
      fix: 'Keep the owner API protected; use this runner for read-only local checks until the stats secret is added.',
    });
  }
  if (byLabel.statsNoSecret && byLabel.statsNoSecret.status !== 401) {
    recommendations.push({
      severity: 'medium',
      issue: 'Protected stats endpoint did not reject unauthenticated access with 401',
      evidence: `HTTP ${byLabel.statsNoSecret.status}`,
      fix: 'Review /api/stats auth boundary before exposing owner dashboard links.',
    });
  }
  if (stats?.ok) {
    const worstDrop = stageDrop(stats.funnel30d || []);
    if (worstDrop && worstDrop.previous >= 5 && worstDrop.drop >= 60) {
      recommendations.push({
        severity: 'high',
        issue: `Largest 30-day funnel drop: ${worstDrop.from} to ${worstDrop.to}`,
        evidence: `${worstDrop.previous} to ${worstDrop.current}; ${worstDrop.conversion}% conversion.`,
        fix: 'Run a focused UX/content fix on that exact transition and tag the experiment in analytics.',
      });
    }
    if (Number(stats.metrics?.feedback30d || 0) === 0 && Number(stats.metrics?.firstValues30d || 0) > 0) {
      recommendations.push({
        severity: 'high',
        issue: 'Users are getting value but not leaving feedback',
        evidence: `${stats.metrics.firstValues30d} useful-result events and 0 feedback events in 30 days.`,
        fix: 'Move the Did this help? trap closer to PartSnap/result completion and make Wrong/Missing one tap.',
      });
    }
    if (Number(stats.metrics?.checkoutClicks30d || 0) > 0 && Number(stats.metrics?.splashlensPaidCompletions || 0) === 0) {
      recommendations.push({
        severity: 'high',
        issue: 'Checkout intent exists with no paid completion proof',
        evidence: `${stats.metrics.checkoutClicks30d} checkout clicks and 0 SplashLens paid completions.`,
        fix: 'Check Stripe dashboard sessions, webhook delivery, and entitlement fulfillment immediately.',
      });
    }
    if (Number(stats.metrics?.suspectNonSplashLensPaymentRows || 0) > 0) {
      recommendations.push({
        severity: 'high',
        issue: 'Historical non-SplashLens payment rows remain in the payment table',
        evidence: `${stats.metrics.suspectNonSplashLensPaymentRows} suspect payment rows.`,
        fix: 'Keep them separated in reporting and only count SplashLens/PartSnap rows toward conversion and entitlement proof.',
      });
    }
    if (Number(stats.metrics?.rawSessionHeartbeatTotal || 0) > Number(stats.metrics?.events30d || 0) * 3) {
      recommendations.push({
        severity: 'medium',
        issue: 'Low-signal heartbeat volume is high versus clean conversion events',
        evidence: `${stats.metrics.rawSessionHeartbeatTotal} lifetime heartbeat events; ${stats.metrics.events30d} clean 30-day reporting events.`,
        fix: 'Keep heartbeat out of Amplitude and owner-facing funnels; rely on session_started, tab_dwell, first_value, feedback, and payment events.',
      });
    }
    if (Array.isArray(stats.storeMetricImports) && stats.storeMetricImports.length === 0) {
      recommendations.push({
        severity: 'medium',
        issue: 'Store-facing click/open events exist, but official Apple/Google metric imports are not present in D1',
        evidence: stats.storeSignals.map((row) => `${row.event}:${row.count}`).join(', '),
        fix: 'Use App Store Connect and Play Console exports/APIs for official downloads, then ingest daily summaries as store metric import events.',
      });
    }
  }
  if (admin?.ok && Number(admin.totals?.intakeOpen || 0) > 0) {
    recommendations.push({
      severity: 'medium',
      issue: 'Open commercial access requests need manual follow-up',
      evidence: `${admin.totals.intakeOpen} open access request(s).`,
      fix: 'Review owner dashboard and send one-to-one replies from the official SplashLens sender.',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      severity: 'info',
      issue: 'No new technical blocker found from available probes',
      evidence: 'Public app, site, checkout, and Amplitude readiness checks passed.',
      fix: 'Next useful move requires protected analytics or fresh user feedback evidence.',
    });
  }

  return recommendations;
}

function table(rows, columns) {
  const header = `| ${columns.join(' | ')} |`;
  const divider = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${columns.map((column) => String(row[column] ?? '').replace(/\|/g, '/')).join(' | ')} |`);
  return [header, divider, ...body].join('\n');
}

function markdownReport(report) {
  const lines = [];
  lines.push('# SplashLens Field Intelligence Check');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Base app: ${report.baseUrl}`);
  lines.push(`Site: ${report.siteUrl}`);
  lines.push('');
  lines.push('## Live Probes');
  lines.push('');
  lines.push(table(report.probes.map((probe) => ({
    label: probe.label,
    status: probe.status || 'failed',
    ok: probe.ok,
    json: probe.json,
    ms: probe.ms,
    note: probe.location ? probe.location.slice(0, 80) : (probe.error || ''),
  })), ['label', 'status', 'ok', 'json', 'ms', 'note']));
  lines.push('');
  lines.push('## Local Access');
  lines.push('');
  lines.push(table([
    { key: 'SPLASHLENS_STATS_SECRET', present: report.env.statsSecret },
    { key: 'AMPLITUDE_API_KEY', present: report.env.amplitudeApiKey },
    { key: 'STRIPE_SECRET_KEY', present: report.env.stripeSecretKey },
  ], ['key', 'present']));
  if (report.stats?.ok) {
    lines.push('');
    lines.push(`Stats source: ${report.stats.source || 'protected owner API'}`);
    lines.push('');
    lines.push('## Core Metrics');
    lines.push('');
    lines.push(table(Object.entries(report.stats.metrics || {}).map(([key, value]) => ({ key, value })), ['key', 'value']));
    lines.push('');
    lines.push('## Funnel Summary');
    lines.push('');
    lines.push(table(report.stats.funnel30d || [], ['label', 'count', 'conversionFromPrevious']));
    if (Array.isArray(report.stats.storeSignals) && report.stats.storeSignals.length) {
      lines.push('');
      lines.push('## Store Signals');
      lines.push('');
      lines.push(table(report.stats.storeSignals, ['event', 'count', 'firstSeen', 'lastSeen']));
    }
    if (Array.isArray(report.stats.storeMetricImports) && report.stats.storeMetricImports.length) {
      lines.push('');
      lines.push('## Official Store Metric Imports');
      lines.push('');
      lines.push(table(report.stats.storeMetricImports, ['platform', 'metric', 'value', 'firstDate', 'lastDate']));
    }
    if (Array.isArray(report.stats.paymentsByPlan) && report.stats.paymentsByPlan.length) {
      lines.push('');
      lines.push('## SplashLens Payment Rows');
      lines.push('');
      lines.push(table(report.stats.paymentsByPlan, ['event_type', 'plan', 'count', 'stripeSessions', 'firstSeen', 'lastSeen']));
    }
    if (Array.isArray(report.stats.foreignPaymentsByPlan) && report.stats.foreignPaymentsByPlan.length) {
      lines.push('');
      lines.push('## Quarantined / Foreign Payment Rows');
      lines.push('');
      lines.push(table(report.stats.foreignPaymentsByPlan, ['event_type', 'plan', 'count', 'stripeSessions', 'firstSeen', 'lastSeen']));
    }
  }
  lines.push('');
  lines.push('## Ranked Next Moves');
  lines.push('');
  lines.push(table(report.recommendations.map((item, index) => ({
    rank: index + 1,
    severity: item.severity,
    issue: item.issue,
    evidence: item.evidence,
    fix: item.fix,
  })), ['rank', 'severity', 'issue', 'evidence', 'fix']));
  lines.push('');
  return lines.join('\n');
}

async function run(options = parseArgs(process.argv.slice(2)), env = process.env) {
  if (options.help) {
    return { help: true, text: helpText(), exitCode: 0 };
  }

  const localEnv = envStatus(env);
  const probes = await Promise.all([
    safeFetch('app', `${options.baseUrl}/`),
    safeFetch('site', `${options.siteUrl}/`),
    safeFetch('checkoutCatalog', `${options.baseUrl}/api/checkout?catalog=1`),
    safeFetch('checkoutMonthly', `${options.baseUrl}/api/checkout?plan=monthly`, { redirect: 'manual', expectStatuses: [302] }),
    safeFetch('amplitudeConfig', `${options.baseUrl}/api/amplitude-config`),
    safeFetch('statsNoSecret', `${options.baseUrl}/api/stats`, { redirect: 'manual', expectStatuses: [401] }),
    safeFetch('serviceWorker', `${options.baseUrl}/sw.js`),
    ...(options.checkStaleWebhook
      ? [safeFetch('staleWebhook', `${options.baseUrl}${STALE_ROTATION_PATH}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })]
      : []),
  ]);

  let stats = null;
  let admin = null;
  if (localEnv.statsSecret) {
    const headers = { 'X-SplashLens-Stats-Secret': env.SPLASHLENS_STATS_SECRET };
    const statsProbe = await safeFetch('statsWithSecret', `${options.baseUrl}/api/stats`, { headers });
    const adminProbe = await safeFetch('adminWithSecret', `${options.baseUrl}/api/admin`, { headers });
    probes.push(statsProbe, adminProbe);
    stats = parseJsonProbe(statsProbe);
    admin = parseJsonProbe(adminProbe);
  } else if (options.d1Fallback) {
    try {
      stats = remoteD1Snapshot(options.d1Database);
      probes.push({
        label: 'd1Remote',
        url: `wrangler d1 execute ${options.d1Database} --remote`,
        ok: true,
        status: 200,
        contentType: 'application/json',
        location: '',
        length: JSON.stringify(stats).length,
        ms: 0,
        json: true,
        body: JSON.stringify({ ok: true, source: stats.source }),
      });
    } catch (error) {
      probes.push({
        label: 'd1Remote',
        url: `wrangler d1 execute ${options.d1Database} --remote`,
        ok: false,
        status: 0,
        contentType: '',
        location: '',
        length: 0,
        ms: 0,
        json: false,
        error: error instanceof Error ? error.message : String(error),
        body: '',
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    siteUrl: options.siteUrl,
    env: localEnv,
    probes: probes.map((probe) => ({
      label: probe.label,
      url: probe.url,
      ok: probe.ok,
      status: probe.status,
      contentType: probe.contentType,
      location: probe.location,
      length: probe.length,
      ms: probe.ms,
      json: probe.json,
      error: probe.error || '',
      containsFoldableCss: probe.body.includes('Foldable and compact tablet support'),
      containsFoldableCache: probe.body.includes('splashlens-v9-foldable-field-layout'),
    })),
    stats,
    admin,
  };
  report.recommendations = buildRecommendations({ probes, env: localEnv, stats, admin });

  const hardFailure = report.recommendations.some((item) => ['critical'].includes(item.severity));
  return {
    report,
    text: options.json ? JSON.stringify(report, null, 2) : markdownReport(report),
    exitCode: hardFailure ? 1 : 0,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
    .then((result) => {
      console.log(result.text);
      process.exitCode = result.exitCode;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.stack || error.message : String(error));
      process.exitCode = 1;
    });
}

export {
  buildRecommendations,
  envStatus,
  helpText,
  markdownReport,
  parseArgs,
  run,
  stageDrop,
};
