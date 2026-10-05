// GET /api/stats - protected owner stats for SplashLens app domain.
// Env: SUBSCRIBERS_DB, SPLASHLENS_STATS_SECRET

const DEFAULT_ORIGIN = 'https://app.splashlens.com';

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'http://localhost:8788',
  'http://localhost:5173',
]);

const EXTERNAL_EVENT_FILTER = `
 AND COALESCE(event, '') NOT IN ('session_heartbeat', 'amplitude_readiness_smoke', 'growth_plan_smoke', 'audit_handoff_probe', 'codex_deploy_smoke', 'codex_launch_probe', 'codex_post_push_probe', 'command_center_probe', 'release_gate_live_custom_domain', 'release_gate_live_preview')
 AND COALESCE(source, '') NOT IN ('qa', 'codex', 'codex_smoke', 'launch-gate-test')
 AND lower(COALESCE(source, '')) NOT LIKE 'codex%'
 AND lower(COALESCE(source, '')) NOT IN ('release_gate', 'release-gate')
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
    events: ['first_action_started'],
  },
  {
    key: 'first_value',
    label: 'Useful result',
    events: ['first_value_completed'],
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
    events: ['checkout_click', 'native_purchase_click'],
  },
  {
    key: 'paid_or_restored',
    label: 'Paid / entitlement proof',
    events: ['entitlement_granted', 'paid_entitlement_activated', 'checkout_success', 'stripe_checkout_completed', 'restore_entitlement_success'],
  },
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-SplashLens-Stats-Secret',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function authOk(request, env) {
  const secret = String(env.SPLASHLENS_STATS_SECRET || env.SPLASHLENS_ADMIN_SECRET || '').trim();
  if (!secret) return false;
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('X-SplashLens-Stats-Secret') || '';
  return bearer === secret || headerSecret === secret;
}

async function first(db, sql, ...bindings) {
  const row = await db.prepare(sql).bind(...bindings).first();
  return row || {};
}

async function all(db, sql, ...bindings) {
  const res = await db.prepare(sql).bind(...bindings).all();
  return res.results || [];
}

async function count(db, sql, ...bindings) {
  const row = await first(db, sql, ...bindings);
  return Number(row.value || 0);
}

function quotedEvents(events) {
  return events.map((event) => `'${event.replace(/'/g, "''")}'`).join(', ');
}

const QUALIFIED_FIRST_VALUE_FILTER = `
 AND NOT (
   event = 'first_value_completed'
   AND COALESCE(CAST(json_extract(props, '$.result_count') AS INTEGER), 1) <= 0
 )
`;

function stageFilter(stage) {
  return stage.key === 'first_value' ? QUALIFIED_FIRST_VALUE_FILTER : '';
}

async function funnelStageStats(db, days) {
  const rows = [];
  for (const stage of FUNNEL_STAGES) {
    const value = await count(db, `
      SELECT COUNT(*) AS value
      FROM events
      WHERE event IN (${quotedEvents(stage.events)})
      AND created_at >= datetime('now', '-${days} days')
      ${EXTERNAL_EVENT_FILTER}
      ${stageFilter(stage)}
    `);
    rows.push({ key: stage.key, label: stage.label, count: value, events: stage.events });
  }
  return rows.map((row, index) => {
    const previous = index > 0 ? rows[index - 1].count : null;
    const conversionFromPrevious = previous && previous > 0 ? Math.round((row.count / previous) * 1000) / 10 : null;
    return { ...row, conversionFromPrevious };
  });
}

export async function paymentStats(db) {
  const table = await first(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'payment_events'`);
  if (!table.name) return { byPlan: [], foreignByPlan: [], splashlensCompleted: 0, splashlensCompleted30d: 0, suspectCompleted: 0, unverifiedSplashLensLabeledCompletions: 0 };
  const entitlementTable = await first(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'commercial_entitlements'`);
  const verifiedProSession = !entitlementTable.name ? '0' : `EXISTS (
    SELECT 1 FROM commercial_entitlements ce
    WHERE ce.stripe_session_id = pe.stripe_session_id
      AND ce.lane = 'pro'
      AND ce.source IN ('stripe_webhook', 'stripe_checkout_success')
  )`;
  const allByPlan = await all(db, `
    SELECT event_type, COALESCE(plan, 'unknown') AS plan, COUNT(*) AS count,
      COUNT(DISTINCT stripe_session_id) AS stripeSessions,
      MIN(created_at) AS firstSeen,
      MAX(created_at) AS lastSeen
    FROM payment_events
    GROUP BY event_type, COALESCE(plan, 'unknown')
    ORDER BY count DESC, plan ASC
  `);
  const verifiedByPlan = await all(db, `
    SELECT pe.event_type, COALESCE(pe.plan, 'unknown') AS plan, COUNT(*) AS count,
      COUNT(DISTINCT pe.stripe_session_id) AS stripeSessions,
      MIN(pe.created_at) AS firstSeen,
      MAX(pe.created_at) AS lastSeen
    FROM payment_events pe
    WHERE ${verifiedProSession}
    GROUP BY pe.event_type, COALESCE(pe.plan, 'unknown')
    ORDER BY count DESC, plan ASC
  `);
  const byPlan = verifiedByPlan.filter((row) => /partsnap|splashlens|splash lens/i.test(String(row.plan || '')));
  const foreignByPlan = allByPlan.filter((row) => !/partsnap|splashlens|splash lens/i.test(String(row.plan || '')));
  const completionFilter = `pe.event_type IN ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    AND (lower(COALESCE(pe.plan, '')) LIKE '%partsnap%'
      OR lower(COALESCE(pe.plan, '')) LIKE '%splashlens%'
      OR lower(COALESCE(pe.plan, '')) LIKE '%splash lens%')`;
  const completed = await first(db, `
    SELECT COUNT(DISTINCT pe.stripe_session_id) AS value
    FROM payment_events pe
    WHERE ${completionFilter} AND ${verifiedProSession}
  `);
  const recent = await first(db, `
    SELECT COUNT(DISTINCT pe.stripe_session_id) AS value
    FROM payment_events pe
    WHERE ${completionFilter}
      AND pe.created_at >= datetime('now', '-30 days')
      AND ${verifiedProSession}
  `);
  const unverified = await first(db, `
    SELECT COUNT(DISTINCT pe.stripe_session_id) AS value
    FROM payment_events pe
    WHERE ${completionFilter} AND NOT ${verifiedProSession}
  `);
  const suspectCompleted = foreignByPlan.reduce((sum, row) => sum + Number(row.count || 0), 0);
  return {
    byPlan,
    foreignByPlan,
    splashlensCompleted: Number(completed.value || 0),
    splashlensCompleted30d: Number(recent.value || 0),
    suspectCompleted,
    unverifiedSplashLensLabeledCompletions: Number(unverified.value || 0),
  };
}

async function engagementStats(db) {
  const table = await first(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'engagement_events'`);
  const separatedHeartbeatTotal = table.name
    ? await count(db, `SELECT COUNT(*) AS value FROM engagement_events WHERE event = 'session_heartbeat'`)
    : 0;
  const legacyHeartbeatTotal = await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'session_heartbeat'`);
  return { separatedHeartbeatTotal, legacyHeartbeatTotal };
}

async function storeMetricStats(db) {
  const table = await first(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'store_metric_imports'`);
  if (!table.name) return { totals: [], latestImportAt: null };
  const totals = await all(db, `
    SELECT platform, metric, source, SUM(value) AS value, MIN(metric_date) AS firstDate, MAX(metric_date) AS lastDate
    FROM store_metric_imports
    GROUP BY platform, metric, source
    ORDER BY platform ASC, metric ASC, source ASC
  `);
  const latest = await first(db, `SELECT MAX(updated_at) AS latestImportAt FROM store_metric_imports`);
  return { totals, latestImportAt: latest.latestImportAt || null };
}

export async function onRequestGet({ request, env }) {
  const headers = corsHeaders(request);
  if (!authOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'SUBSCRIBERS_DB binding is not configured' }, 503, headers);

  const db = env.SUBSCRIBERS_DB;
  try {
    const [
      events7d,
      events30d,
      appOpens30d,
      firstActions30d,
      firstValues30d,
      feedback30d,
      checkoutClicks30d,
      subscribersTotal,
      partnerLeadsTotal,
      topEvents30d,
      topPages30d,
      funnel7d,
      funnel30d,
      payments,
      storeMetrics,
      engagement,
    ] = await Promise.all([
      count(db, `SELECT COUNT(*) AS value FROM events WHERE created_at >= datetime('now', '-7 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('app_open','first_app_open','native_shell_open','native_shell_first_open') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'first_action_started' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'first_value_completed' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} ${QUALIFIED_FIRST_VALUE_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('partsnap_result_feedback','field_feedback_quick_answered','field_feedback_submitted','field_score_feedback') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('checkout_click','native_purchase_click') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM subscribers`),
      count(db, `SELECT COUNT(*) AS value FROM partner_intake`),
      all(db, `SELECT event, COUNT(*) AS count FROM events WHERE created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} GROUP BY event ORDER BY count DESC LIMIT 15`),
      all(db, `SELECT COALESCE(path, '/') AS path, COUNT(*) AS count FROM events WHERE created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} GROUP BY COALESCE(path, '/') ORDER BY count DESC LIMIT 15`),
      funnelStageStats(db, 7),
      funnelStageStats(db, 30),
      paymentStats(db),
      storeMetricStats(db),
      engagementStats(db),
    ]);

    return json({
      ok: true,
      generatedAt: new Date().toISOString(),
      project: 'splashlens',
      source: 'SUBSCRIBERS_DB',
      filters: {
        productionClean: true,
        note: 'Headless, bot, crawler, Codex, QA, Playwright, launch-gate, /test, readiness, and verification traffic are excluded from owner-facing counts.',
      },
      metrics: {
        events7d,
        events30d,
        appOpens30d,
        firstActions30d,
        firstValues30d,
        qualifiedFirstValueSessions30d: await count(db, `SELECT COUNT(DISTINCT COALESCE(NULLIF(json_extract(props, '$.session_id'), ''), NULLIF(json_extract(props, '$.client_id'), ''), id)) AS value FROM events WHERE event = 'first_value_completed' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} ${QUALIFIED_FIRST_VALUE_FILTER}`),
        partSnapResults30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'partsnap_result_success' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        partSnapResultAttempts30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'partsnap_result' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        partSnapResultSuccesses30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'partsnap_result_success' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        partSnapResultFailures30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'partsnap_result_fail' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        feedback30d,
        checkoutClicks30d,
        checkoutStarts30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'checkout_started' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        checkoutCtaShown30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'checkout_cta_shown' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        checkoutSessionsCreated30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'checkout_session_created' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        unattributedCheckoutSessions30d: await count(db, `SELECT COUNT(*) AS value FROM events e WHERE e.event = 'checkout_session_created' AND e.created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} AND NOT EXISTS (SELECT 1 FROM events c WHERE c.event = 'checkout_click' AND json_extract(c.props, '$.client_reference_id') = json_extract(e.props, '$.client_reference_id'))`),
        checkoutCompleted30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'checkout_completed' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        subscriptionCreated30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'subscription_created' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        entitlementGranted30d: await count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'entitlement_granted' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
        subscribersTotal,
        partnerLeadsTotal,
        splashlensPaidCompletions: payments.splashlensCompleted,
        splashlensPaidCompletions30d: payments.splashlensCompleted30d,
        unverifiedSplashLensLabeledCompletions: payments.unverifiedSplashLensLabeledCompletions,
        suspectNonSplashLensPaymentRows: payments.suspectCompleted,
        legacyHeartbeatRows: engagement.legacyHeartbeatTotal,
        separatedHeartbeatRows: engagement.separatedHeartbeatTotal,
      },
      funnel7d,
      funnel30d,
      topEvents30d,
      topPages30d,
      paymentsByPlan: payments.byPlan,
      foreignPaymentsByPlan: payments.foreignByPlan,
      storeMetricImports: storeMetrics.totals,
      latestStoreMetricImportAt: storeMetrics.latestImportAt,
    }, 200, headers);
  } catch (error) {
    console.error('Stats error:', error);
    return json({ ok: false, error: 'Stats query failed' }, 500, headers);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
