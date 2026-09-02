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
    events: ['return_task_continued', 'session_started', 'session_heartbeat', 'app_tab_view', 'partsnap_field_stop_reopened'],
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

async function funnelStageStats(db, days) {
  const rows = [];
  for (const stage of FUNNEL_STAGES) {
    const value = await count(db, `
      SELECT COUNT(*) AS value
      FROM events
      WHERE event IN (${quotedEvents(stage.events)})
      AND created_at >= datetime('now', '-${days} days')
      ${EXTERNAL_EVENT_FILTER}
    `);
    rows.push({ key: stage.key, label: stage.label, count: value, events: stage.events });
  }
  return rows.map((row, index) => {
    const previous = index > 0 ? rows[index - 1].count : null;
    const conversionFromPrevious = previous && previous > 0 ? Math.round((row.count / previous) * 1000) / 10 : null;
    return { ...row, conversionFromPrevious };
  });
}

async function paymentStats(db) {
  const table = await first(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'payment_events'`);
  if (!table.name) return { byPlan: [], splashlensCompleted: 0, suspectCompleted: 0 };
  const byPlan = await all(db, `
    SELECT event_type, COALESCE(plan, 'unknown') AS plan, COUNT(*) AS count,
      COUNT(DISTINCT stripe_session_id) AS stripeSessions,
      MIN(created_at) AS firstSeen,
      MAX(created_at) AS lastSeen
    FROM payment_events
    GROUP BY event_type, COALESCE(plan, 'unknown')
    ORDER BY count DESC, plan ASC
  `);
  const splashlensCompleted = byPlan
    .filter((row) => /partsnap|splashlens/i.test(String(row.plan || '')))
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
  const suspectCompleted = byPlan
    .filter((row) => !/partsnap|splashlens/i.test(String(row.plan || '')))
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
  return { byPlan, splashlensCompleted, suspectCompleted };
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
    ] = await Promise.all([
      count(db, `SELECT COUNT(*) AS value FROM events WHERE created_at >= datetime('now', '-7 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('app_open','first_app_open','native_shell_open','native_shell_first_open') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('first_action_started','manual_code_search','ai_scan_started','service_proof_workflow_started','facility_workflow_action_selected','field_challenge_started') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('first_value_completed','partsnap_result','service_report_saved','service_proof_summary_generated','service_proof_share_link_created','field_challenge_completed') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event IN ('partsnap_result_feedback','field_feedback_quick_answered','field_feedback_submitted','field_score_feedback') AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM events WHERE event = 'checkout_click' AND created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER}`),
      count(db, `SELECT COUNT(*) AS value FROM subscribers`),
      count(db, `SELECT COUNT(*) AS value FROM partner_intake`),
      all(db, `SELECT event, COUNT(*) AS count FROM events WHERE created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} GROUP BY event ORDER BY count DESC LIMIT 15`),
      all(db, `SELECT COALESCE(path, '/') AS path, COUNT(*) AS count FROM events WHERE created_at >= datetime('now', '-30 days') ${EXTERNAL_EVENT_FILTER} GROUP BY COALESCE(path, '/') ORDER BY count DESC LIMIT 15`),
      funnelStageStats(db, 7),
      funnelStageStats(db, 30),
      paymentStats(db),
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
        feedback30d,
        checkoutClicks30d,
        subscribersTotal,
        partnerLeadsTotal,
        splashlensPaidCompletions: payments.splashlensCompleted,
        suspectNonSplashLensPaymentRows: payments.suspectCompleted,
      },
      funnel7d,
      funnel30d,
      topEvents30d,
      topPages30d,
      paymentsByPlan: payments.byPlan,
    }, 200, headers);
  } catch (error) {
    console.error('Stats error:', error);
    return json({ ok: false, error: 'Stats query failed' }, 500, headers);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
