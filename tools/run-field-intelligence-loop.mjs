#!/usr/bin/env node
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_BASE_URL = 'https://app.splashlens.com';
const DEFAULT_SITE_URL = 'https://splashlens.com';
const STALE_ROTATION_PATH = '/api/stripe-webhook?rotation=flagship-audit-3dc2b80e-d7fc-4c33-adef-54c574f7ac0b';

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    siteUrl: DEFAULT_SITE_URL,
    json: false,
    checkStaleWebhook: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--check-stale-webhook') options.checkStaleWebhook = true;
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
  node tools/run-field-intelligence-loop.mjs [--json] [--check-stale-webhook]

Environment:
  SPLASHLENS_STATS_SECRET   Optional. Pulls protected /api/stats and /api/admin when present.

This runner never prints secrets and does not treat missing local secrets as a production failure.`;
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
    return {
      label,
      url,
      ok: response.ok,
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
  if (!env.statsSecret) {
    recommendations.push({
      severity: 'blocked-local',
      issue: 'This PC cannot pull protected owner analytics',
      evidence: 'SPLASHLENS_STATS_SECRET is not present in the local environment.',
      fix: 'Set SPLASHLENS_STATS_SECRET locally for read-only pulls, then rerun npm run intelligence:check.',
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
        issue: 'Non-SplashLens payment rows are still mixed into SplashLens reporting',
        evidence: `${stats.metrics.suspectNonSplashLensPaymentRows} suspect payment rows.`,
        fix: 'Keep product metadata filters strict and migrate or quarantine foreign payment rows.',
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
    lines.push('## Funnel Summary');
    lines.push('');
    lines.push(table(report.stats.funnel30d || [], ['label', 'count', 'conversionFromPrevious']));
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
    safeFetch('checkoutMonthly', `${options.baseUrl}/api/checkout?plan=monthly`, { redirect: 'manual' }),
    safeFetch('amplitudeConfig', `${options.baseUrl}/api/amplitude-config`),
    safeFetch('statsNoSecret', `${options.baseUrl}/api/stats`, { redirect: 'manual' }),
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
