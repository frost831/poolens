import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  buildRecommendations,
  envStatus,
  parseArgs,
  wranglerCommand,
  wranglerExecOptions,
} from '../tools/run-field-intelligence-loop.mjs';

const toolSource = readFileSync(new URL('../tools/run-field-intelligence-loop.mjs', import.meta.url), 'utf8');
const statsSource = readFileSync(new URL('../functions/api/stats.js', import.meta.url), 'utf8');
const numbersPullSource = readFileSync(new URL('../tools/pull-splashlens-numbers.ps1', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('field intelligence runner is non-interactive and safe for heartbeat use', () => {
  assert.doesNotMatch(toolSource, /Read-Host|prompt\(|createInterface/);
  assert.doesNotMatch(toolSource, /console\.log\(process\.env/);
  assert.match(toolSource, /pathToFileURL\(process\.argv\[1\]\)\.href/);
  assert.match(toolSource, /SPLASHLENS_STATS_SECRET/);
  assert.match(toolSource, /redirect:\s*'manual'/);
  assert.doesNotMatch(toolSource, /safeFetch\('checkoutMonthly'|\/api\/checkout\?plan=/);
  assert.match(toolSource, /expectStatuses:\s*\[401\]/);
  assert.match(toolSource, /wrangler/);
  assert.match(toolSource, /splashlens-subscribers/);
  assert.match(toolSource, /REPORTING_EVENT_FILTER/);
  assert.match(toolSource, /NOT LIKE 'curl\/%'/);
  assert.match(statsSource, /NOT LIKE 'curl\/%'/);
  assert.match(toolSource, /NOT LIKE 'codex%'/);
  assert.match(toolSource, /'release_gate', 'release-gate'/);
  assert.match(toolSource, /'session_heartbeat'/);
  assert.match(toolSource, /countQualifiedFirstValues/);
  assert.match(toolSource, /qualifiedFirstValueSessions30d/);
  assert.match(toolSource, /checkoutStarts30d/);
  assert.match(toolSource, /checkoutStarts30d: countEvents\(database, 30, \['checkout_started'\]\)/);
  assert.match(toolSource, /ce\.source IN \('stripe_webhook', 'stripe_checkout_success'\)/);
  assert.match(toolSource, /splashlensPaidCompletions30d/);
  assert.match(packageJson.scripts['intelligence:check'], /run-field-intelligence-loop\.mjs/);
  assert.match(packageJson.scripts['numbers:pull'], /pull-splashlens-numbers\.ps1/);
  assert.match(numbersPullSource, /\[switch\]\$PromptForSecret/);
  assert.match(numbersPullSource, /\$PromptForSecret/);
  assert.match(numbersPullSource, /run-field-intelligence-loop\.mjs/);
});

test('Windows Wrangler fallback preserves SQL as an argv value', () => {
  const runner = wranglerCommand();
  if (process.platform === 'win32') {
    assert.notDeepEqual(runner.prefixArgs.slice(-2), ['-Command', 'wrangler']);
    assert.ok(runner.command === process.execPath || /npx\.cmd$/i.test(runner.command));
  }
  const options = wranglerExecOptions();
  assert.match(options.env.NPM_CONFIG_CACHE, /splashlens-wrangler-npm-cache/);
  assert.match(options.env.WRANGLER_LOG_PATH, /splashlens-wrangler\.log/);
});

test('field intelligence runner distinguishes local credential gaps from production failures', () => {
  const env = envStatus({});
  const recommendations = buildRecommendations({
    env,
    probes: [
      { label: 'app', ok: true, status: 200 },
      { label: 'site', ok: true, status: 200 },
      { label: 'checkoutCatalog', ok: true, status: 200, body: '{"product":"splashlens","plans":[{"key":"partsnap_pro_monthly","checkoutConfigured":true},{"key":"partsnap_pro_yearly","checkoutConfigured":true}]}' },
      { label: 'amplitudeConfig', ok: true, status: 200, body: '{"ok":true,"enabled":true,"status":"ready"}' },
      { label: 'statsNoSecret', ok: false, status: 401 },
    ],
    stats: null,
    admin: null,
  });

  assert.equal(env.statsSecret, false);
  assert.ok(recommendations.some((item) => item.severity === 'blocked-local' && /protected owner analytics/.test(item.issue)));
  assert.ok(!recommendations.some((item) => item.severity === 'critical'));
});

test('field intelligence runner flags an unconfigured Pro plan without starting Stripe Checkout', () => {
  const recommendations = buildRecommendations({
    env: envStatus({}),
    probes: [
      { label: 'app', ok: true, status: 200 },
      { label: 'site', ok: true, status: 200 },
      { label: 'checkoutCatalog', ok: true, status: 200, body: '{"product":"splashlens","plans":[{"key":"partsnap_pro_monthly","checkoutConfigured":true},{"key":"partsnap_pro_yearly","checkoutConfigured":false}]}' },
      { label: 'amplitudeConfig', ok: true, status: 200, body: '{"ok":true,"enabled":true,"status":"ready"}' },
      { label: 'statsNoSecret', ok: false, status: 401 },
    ],
    stats: null,
    admin: null,
  });

  assert.ok(recommendations.some((item) => /Pro checkout configuration/.test(item.issue) && /partsnap_pro_yearly/.test(item.evidence)));
  assert.doesNotMatch(toolSource, /safeFetch\('checkoutMonthly'|\/api\/checkout\?plan=/);
});

test('field intelligence runner treats D1 fallback as usable local analytics access', () => {
  const recommendations = buildRecommendations({
    env: envStatus({}),
    probes: [
      { label: 'app', ok: true, status: 200 },
      { label: 'site', ok: true, status: 200 },
      { label: 'checkoutCatalog', ok: true, status: 200, body: '{"product":"splashlens","plans":[{"key":"partsnap_pro_monthly","checkoutConfigured":true},{"key":"partsnap_pro_yearly","checkoutConfigured":true}]}' },
      { label: 'amplitudeConfig', ok: true, status: 200, body: '{"ok":true,"enabled":true,"status":"ready"}' },
      { label: 'statsNoSecret', ok: false, status: 401 },
      { label: 'd1Remote', ok: true, status: 200 },
    ],
    stats: {
      ok: true,
      source: 'wrangler-d1:splashlens-subscribers',
      metrics: {
        events30d: 50,
        firstValues30d: 4,
        feedback30d: 1,
        checkoutClicks30d: 0,
        splashlensPaidCompletions: 0,
        suspectNonSplashLensPaymentRows: 0,
      },
      funnel30d: [],
      storeSignals: [],
    },
    admin: null,
  });

  assert.ok(recommendations.some((item) => /D1 fallback is working/.test(item.issue)));
  assert.ok(!recommendations.some((item) => item.severity === 'blocked-local'));
});

test('field intelligence runner does not present independent event totals as cohort conversion', () => {
  assert.match(toolSource, /Counts are independent production-clean events/);
  assert.doesNotMatch(toolSource, /conversionFromPrevious/);
  assert.doesNotMatch(toolSource, /Largest 30-day funnel drop/);
});

test('field intelligence runner flags value-without-feedback and checkout-without-paid proof', () => {
  const recommendations = buildRecommendations({
    env: { statsSecret: true, amplitudeApiKey: false, stripeSecretKey: false },
    probes: [
      { label: 'app', ok: true, status: 200 },
      { label: 'site', ok: true, status: 200 },
      { label: 'checkoutCatalog', ok: true, status: 200, body: '{"product":"splashlens","plans":[{"key":"partsnap_pro_monthly","checkoutConfigured":true},{"key":"partsnap_pro_yearly","checkoutConfigured":true}]}' },
      { label: 'amplitudeConfig', ok: true, status: 200, body: '{"ok":true,"enabled":true,"status":"ready"}' },
      { label: 'statsNoSecret', ok: false, status: 401 },
    ],
    stats: {
      ok: true,
      metrics: {
        firstValues30d: 12,
        feedback30d: 0,
        checkoutClicks30d: 3,
        splashlensPaidCompletions: 0,
        suspectNonSplashLensPaymentRows: 0,
      },
      activitySignals30d: [
        { key: 'app_intent', label: 'App open', count: 20 },
        { key: 'first_value', label: 'Useful result', count: 12 },
        { key: 'paid_or_restored', label: 'Paid', count: 0 },
      ],
    },
    admin: null,
  });

  assert.ok(recommendations.some((item) => /getting value but not leaving feedback/.test(item.issue)));
  assert.ok(recommendations.some((item) => /Checkout intent exists/.test(item.issue)));
});

test('a server checkout start without an app click is not called customer intent', () => {
  const recommendations = buildRecommendations({
    env: { statsSecret: false, amplitudeApiKey: false, stripeSecretKey: false },
    probes: [
      { label: 'app', ok: true, status: 200 },
      { label: 'site', ok: true, status: 200 },
      { label: 'checkoutCatalog', ok: true, status: 200, body: '{"product":"splashlens","plans":[{"key":"partsnap_pro_monthly","checkoutConfigured":true},{"key":"partsnap_pro_yearly","checkoutConfigured":true}]}' },
      { label: 'amplitudeConfig', ok: true, status: 200, body: '{"ok":true,"enabled":true,"status":"ready"}' },
      { label: 'statsNoSecret', ok: false, status: 401 },
    ],
    stats: {
      ok: true,
      metrics: { firstValues30d: 18, feedback30d: 6, checkoutClicks30d: 0, checkoutStarts30d: 1, splashlensPaidCompletions30d: 0 },
      activitySignals30d: [],
      storeSignals: [],
    },
    admin: null,
  });

  assert.ok(recommendations.some((item) => /without a tracked app click/.test(item.issue)));
  assert.ok(recommendations.some((item) => /not producing paid-lane intent/.test(item.issue)));
  assert.ok(!recommendations.some((item) => /Checkout intent exists/.test(item.issue)));
});

test('field intelligence arguments default to production SplashLens URLs', () => {
  assert.deepEqual(parseArgs([]), {
    baseUrl: 'https://app.splashlens.com',
    siteUrl: 'https://splashlens.com',
    json: false,
    checkStaleWebhook: false,
    d1Fallback: true,
    d1Database: 'splashlens-subscribers',
  });
  assert.equal(parseArgs(['--json', '--check-stale-webhook']).json, true);
  assert.equal(parseArgs(['--json', '--check-stale-webhook']).checkStaleWebhook, true);
  assert.equal(parseArgs(['--no-d1-fallback']).d1Fallback, false);
  assert.equal(parseArgs(['--d1-database', 'other-db']).d1Database, 'other-db');
});
