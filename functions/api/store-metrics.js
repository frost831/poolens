// /api/store-metrics - protected owner import/read API for App Store Connect and Google Play metric snapshots.
// Env: SUBSCRIBERS_DB, SPLASHLENS_STATS_SECRET or SPLASHLENS_ADMIN_SECRET.

const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'http://localhost:8788',
  'http://localhost:5173',
]);

const ALLOWED_PLATFORMS = new Set(['ios', 'app_store', 'google_play', 'android', 'play_store']);
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

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-SplashLens-Stats-Secret',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function normalizePlatform(value) {
  const platform = clean(value, 40).toLowerCase().replace(/\s+/g, '_');
  if (platform === 'ios') return 'app_store';
  if (platform === 'android' || platform === 'play_store') return 'google_play';
  return platform;
}

function normalizeDate(value) {
  const date = clean(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
}

function authOk(request, env) {
  const secret = String(env.SPLASHLENS_STATS_SECRET || env.SPLASHLENS_ADMIN_SECRET || '').trim();
  if (!secret) return false;
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('X-SplashLens-Stats-Secret') || '';
  return bearer === secret || headerSecret === secret;
}

async function ensureTables(db) {
  await db.prepare(
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
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS audit_records (
      id TEXT PRIMARY KEY,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      payload TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
}

async function all(db, sql, ...bindings) {
  const result = await db.prepare(sql).bind(...bindings).all();
  return result.results || [];
}

async function first(db, sql, ...bindings) {
  return (await db.prepare(sql).bind(...bindings).first()) || {};
}

async function logAudit(db, request, action, targetId, payload) {
  await db.prepare(
    `INSERT INTO audit_records (id, actor_email, action, target_type, target_id, payload, user_agent, referrer, country)
     VALUES (?, 'owner', ?, 'store_metric_import', ?, ?, ?, ?, ?)`,
  ).bind(
    `audit_${crypto.randomUUID()}`,
    clean(action, 120),
    clean(targetId, 180),
    JSON.stringify(payload).slice(0, 2400),
    clean(request.headers.get('User-Agent'), 300),
    clean(request.headers.get('Referer'), 500),
    clean(request.cf && request.cf.country, 10),
  ).run();
}

function entriesFromBody(body) {
  if (Array.isArray(body.entries)) return body.entries;
  const platform = body.platform;
  const date = body.date || body.metric_date;
  const source = body.source;
  const notes = body.notes;
  if (body.metric) return [{ platform, date, source, notes, metric: body.metric, value: body.value }];
  const metrics = body.metrics && typeof body.metrics === 'object' && !Array.isArray(body.metrics) ? body.metrics : {};
  return Object.entries(metrics).map(([metric, value]) => ({ platform, date, source, notes, metric, value }));
}

async function upsertEntries(db, request, body) {
  const entries = entriesFromBody(body)
    .map((entry) => ({
      platform: normalizePlatform(entry.platform),
      metric: clean(entry.metric, 80).toLowerCase().replace(/\s+/g, '_'),
      value: Math.max(0, Math.round(Number(entry.value || 0))),
      metricDate: normalizeDate(entry.date || entry.metric_date),
      source: clean(entry.source || body.source || 'manual_console_export', 120),
      notes: clean(entry.notes || body.notes, 500),
    }))
    .filter((entry) => ALLOWED_PLATFORMS.has(entry.platform) && ALLOWED_METRICS.has(entry.metric));

  if (!entries.length) {
    return { ok: false, status: 400, error: 'No valid store metric entries were provided.' };
  }

  for (const entry of entries) {
    await db.prepare(
      `INSERT INTO store_metric_imports (id, platform, metric, value, metric_date, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(platform, metric, metric_date, source) DO UPDATE SET
         value = excluded.value,
         notes = excluded.notes,
         updated_at = CURRENT_TIMESTAMP`,
    ).bind(
      `store_metric_${crypto.randomUUID()}`,
      entry.platform,
      entry.metric,
      entry.value,
      entry.metricDate,
      entry.source,
      entry.notes,
    ).run();
  }

  await logAudit(db, request, 'store_metrics_imported', `${entries[0].platform}:${entries[0].metricDate}`, { count: entries.length });
  return { ok: true, imported: entries.length, entries };
}

async function snapshot(db) {
  const [totals, recent, latest] = await Promise.all([
    all(db, `
      SELECT platform, metric, SUM(value) AS value, MIN(metric_date) AS firstDate, MAX(metric_date) AS lastDate
      FROM store_metric_imports
      GROUP BY platform, metric
      ORDER BY platform ASC, metric ASC
    `),
    all(db, `
      SELECT platform, metric, value, metric_date AS metricDate, source, notes, updated_at AS updatedAt
      FROM store_metric_imports
      ORDER BY metric_date DESC, updated_at DESC
      LIMIT 50
    `),
    first(db, `SELECT MAX(updated_at) AS latestImportAt FROM store_metric_imports`),
  ]);
  return { totals, recent, latestImportAt: latest.latestImportAt || null };
}

export async function onRequestGet({ request, env }) {
  if (!authOk(request, env)) return json(request, { ok: false, error: 'Unauthorized' }, 401);
  if (!env.SUBSCRIBERS_DB) return json(request, { ok: false, error: 'SUBSCRIBERS_DB binding is not configured' }, 503);
  await ensureTables(env.SUBSCRIBERS_DB);
  return json(request, { ok: true, generatedAt: new Date().toISOString(), ...(await snapshot(env.SUBSCRIBERS_DB)) });
}

export async function onRequestPost({ request, env }) {
  if (!authOk(request, env)) return json(request, { ok: false, error: 'Unauthorized' }, 401);
  if (!env.SUBSCRIBERS_DB) return json(request, { ok: false, error: 'SUBSCRIBERS_DB binding is not configured' }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { ok: false, error: 'Valid JSON is required.' }, 400);
  }
  await ensureTables(env.SUBSCRIBERS_DB);
  const result = await upsertEntries(env.SUBSCRIBERS_DB, request, body);
  if (!result.ok) return json(request, result, result.status || 400);
  return json(request, { ...result, ...(await snapshot(env.SUBSCRIBERS_DB)) });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
