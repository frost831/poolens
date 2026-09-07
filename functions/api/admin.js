// /api/admin - protected owner operations for SplashLens commercial control room.
// Env: SUBSCRIBERS_DB, SPLASHLENS_STATS_SECRET or SPLASHLENS_ADMIN_SECRET.

const DEFAULT_ORIGIN = 'https://app.splashlens.com';

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'http://localhost:8788',
  'http://localhost:8787',
  'http://localhost:5173',
  'http://127.0.0.1:8788',
  'http://127.0.0.1:8787',
  'http://127.0.0.1:5173',
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

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
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
  return (await db.prepare(sql).bind(...bindings).first()) || {};
}

async function all(db, sql, ...bindings) {
  const result = await db.prepare(sql).bind(...bindings).all();
  return result.results || [];
}

async function safeFirst(db, sql, ...bindings) {
  try {
    return await first(db, sql, ...bindings);
  } catch {
    return {};
  }
}

async function safeAll(db, sql, ...bindings) {
  try {
    return await all(db, sql, ...bindings);
  } catch {
    return [];
  }
}

async function ensureAdminTables(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS commercial_entitlements (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      team_id TEXT,
      lane TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      source TEXT,
      stripe_session_id TEXT,
      stripe_customer_id TEXT,
      current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS commercial_intake (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      company TEXT,
      role TEXT,
      lane TEXT NOT NULL,
      interest TEXT,
      notes TEXT,
      status TEXT DEFAULT 'new',
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS service_proof_records (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      team_id TEXT,
      customer_label TEXT,
      workflow TEXT,
      summary TEXT,
      proof_status TEXT,
      risk_level TEXT,
      source TEXT,
      payload TEXT,
      status TEXT DEFAULT 'saved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS partner_card_requests (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      company TEXT,
      lane TEXT,
      manufacturer TEXT,
      doc_url TEXT,
      proof_language TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS partner_verified_cards (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      company TEXT,
      lane TEXT,
      manufacturer TEXT,
      doc_url TEXT,
      proof_language TEXT,
      status TEXT DEFAULT 'draft',
      approved_by TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS learning_modules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      lane TEXT,
      audience TEXT,
      source_proof_id TEXT,
      body TEXT,
      quiz_json TEXT,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS team_billing (
      team_id TEXT PRIMARY KEY,
      plan TEXT DEFAULT 'pilot',
      status TEXT DEFAULT 'pilot',
      seat_limit INTEGER DEFAULT 3,
      billing_email TEXT,
      stripe_customer_id TEXT,
      current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

async function count(db, sql, ...bindings) {
  const row = await safeFirst(db, sql, ...bindings);
  return Number(row.value || 0);
}

async function logAudit(db, request, action, targetType, targetId, payload = {}) {
  await db.prepare(
    `INSERT INTO audit_records (id, actor_email, action, target_type, target_id, payload, user_agent, referrer, country)
     VALUES (?, 'owner', ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    `audit_${crypto.randomUUID()}`,
    clean(action, 120),
    clean(targetType, 80),
    clean(targetId, 180),
    JSON.stringify(payload).slice(0, 2400),
    clean(request.headers.get('User-Agent'), 300),
    clean(request.headers.get('Referer'), 500),
    clean(request.cf && request.cf.country, 10),
  ).run();
}

async function dashboardSnapshot(db) {
  const [
    entitlementsTotal,
    entitlementsActive,
    intakeOpen,
    proofLast30,
    partnerCardRequests,
    approvedPartnerCards,
    learningModules,
    teamWorkspaces,
    recentEntitlements,
    recentIntake,
    recentProof,
    partnerRequests,
    partnerCards,
    learning,
    teamBilling,
    audit,
  ] = await Promise.all([
    count(db, `SELECT COUNT(*) AS value FROM commercial_entitlements`),
    count(db, `SELECT COUNT(*) AS value FROM commercial_entitlements WHERE status IN ('active','trialing','pilot')`),
    count(db, `SELECT COUNT(*) AS value FROM commercial_intake WHERE status IN ('new','open','pilot')`),
    count(db, `SELECT COUNT(*) AS value FROM service_proof_records WHERE created_at >= datetime('now', '-30 days')`),
    count(db, `SELECT COUNT(*) AS value FROM partner_card_requests WHERE status IN ('new','open')`),
    count(db, `SELECT COUNT(*) AS value FROM partner_verified_cards WHERE status IN ('approved','pilot')`),
    count(db, `SELECT COUNT(*) AS value FROM learning_modules WHERE status IN ('published','pilot')`),
    count(db, `SELECT COUNT(*) AS value FROM teams WHERE status = 'active'`),
    safeAll(db, `SELECT id, email, lane, plan, status, source, stripe_session_id AS stripeSessionId, current_period_end AS currentPeriodEnd, created_at AS createdAt FROM commercial_entitlements ORDER BY created_at DESC LIMIT 25`),
    safeAll(db, `SELECT id, email, name, company, role, lane, interest, status, source, created_at AS createdAt FROM commercial_intake ORDER BY created_at DESC LIMIT 25`),
    safeAll(db, `SELECT id, email, team_id AS teamId, customer_label AS customerLabel, workflow, proof_status AS proofStatus, risk_level AS riskLevel, status, source, created_at AS createdAt FROM service_proof_records ORDER BY created_at DESC LIMIT 25`),
    safeAll(db, `SELECT id, email, company, lane, manufacturer, doc_url AS docUrl, status, created_at AS createdAt FROM partner_card_requests ORDER BY created_at DESC LIMIT 25`),
    safeAll(db, `SELECT id, request_id AS requestId, company, lane, manufacturer, doc_url AS docUrl, status, approved_by AS approvedBy, approved_at AS approvedAt, created_at AS createdAt FROM partner_verified_cards ORDER BY created_at DESC LIMIT 25`),
    safeAll(db, `SELECT id, title, lane, audience, source_proof_id AS sourceProofId, status, created_by AS createdBy, created_at AS createdAt FROM learning_modules ORDER BY created_at DESC LIMIT 25`),
    safeAll(db, `SELECT tb.team_id AS teamId, t.name AS teamName, tb.plan, tb.status, tb.seat_limit AS seatLimit, tb.billing_email AS billingEmail, tb.current_period_end AS currentPeriodEnd FROM team_billing tb LEFT JOIN teams t ON t.id = tb.team_id ORDER BY tb.updated_at DESC LIMIT 25`),
    safeAll(db, `SELECT id, actor_email AS actorEmail, action, target_type AS targetType, target_id AS targetId, created_at AS createdAt FROM audit_records ORDER BY created_at DESC LIMIT 30`),
  ]);
  return {
    totals: {
      entitlementsTotal,
      entitlementsActive,
      intakeOpen,
      proofLast30,
      partnerCardRequests,
      approvedPartnerCards,
      learningModules,
      teamWorkspaces,
    },
    recentEntitlements,
    recentIntake,
    recentProof,
    partnerRequests,
    partnerCards,
    learning,
    teamBilling,
    audit,
  };
}

async function updateEntitlement(db, request, body) {
  const id = clean(body.id || body.entitlementId, 180);
  const status = clean(body.status || 'active', 80).toLowerCase();
  if (!id) return { ok: false, statusCode: 400, error: 'Entitlement id is required.' };
  await db.prepare(`UPDATE commercial_entitlements SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(status, id).run();
  await logAudit(db, request, 'admin_entitlement_status_updated', 'commercial_entitlement', id, { status });
  return { ok: true };
}

async function updateTeamBilling(db, request, body) {
  const teamId = clean(body.teamId || body.team_id, 180);
  const plan = clean(body.plan || 'pilot', 80);
  const status = clean(body.status || 'pilot', 80).toLowerCase();
  const seatLimit = Math.max(1, Math.min(500, Number(body.seatLimit || body.seat_limit || 3)));
  const billingEmail = clean(body.billingEmail || body.billing_email, 180).toLowerCase();
  if (!teamId) return { ok: false, statusCode: 400, error: 'Team id is required.' };
  await db.prepare(
    `INSERT INTO team_billing (team_id, plan, status, seat_limit, billing_email)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(team_id) DO UPDATE SET plan = excluded.plan, status = excluded.status, seat_limit = excluded.seat_limit, billing_email = excluded.billing_email, updated_at = CURRENT_TIMESTAMP`,
  ).bind(teamId, plan, status, seatLimit, billingEmail).run();
  await logAudit(db, request, 'admin_team_billing_updated', 'team_billing', teamId, { plan, status, seatLimit, billingEmail });
  return { ok: true };
}

async function approvePartnerCard(db, request, body) {
  const requestId = clean(body.requestId || body.request_id, 180);
  const id = clean(body.cardId || body.id, 180) || `partner_card_${crypto.randomUUID()}`;
  const source = requestId ? await safeFirst(db, `SELECT * FROM partner_card_requests WHERE id = ?`, requestId) : {};
  const company = clean(body.company || source.company, 180);
  const lane = clean(body.lane || source.lane || 'manufacturer', 80);
  const manufacturer = clean(body.manufacturer || source.manufacturer || company, 180);
  const docUrl = clean(body.docUrl || body.doc_url || source.doc_url, 500);
  const proofLanguage = clean(body.proofLanguage || body.proof_language || source.proof_language, 1400);
  if (!company && !manufacturer) return { ok: false, statusCode: 400, error: 'Company or manufacturer is required.' };
  await db.prepare(
    `INSERT INTO partner_verified_cards (id, request_id, company, lane, manufacturer, doc_url, proof_language, status, approved_by, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 'owner', CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET request_id = excluded.request_id, company = excluded.company, lane = excluded.lane,
       manufacturer = excluded.manufacturer, doc_url = excluded.doc_url, proof_language = excluded.proof_language,
       status = 'approved', approved_by = 'owner', approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
  ).bind(id, requestId, company, lane, manufacturer, docUrl, proofLanguage).run();
  if (requestId) await db.prepare(`UPDATE partner_card_requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(requestId).run();
  await logAudit(db, request, 'admin_partner_card_approved', 'partner_verified_card', id, { requestId, company, manufacturer });
  return { ok: true, cardId: id };
}

async function publishLearningModule(db, request, body) {
  const id = clean(body.id || body.moduleId, 180) || `learning_${crypto.randomUUID()}`;
  const title = clean(body.title, 180);
  if (!title) return { ok: false, statusCode: 400, error: 'Learning module title is required.' };
  const lane = clean(body.lane || 'field_learning', 80);
  const audience = clean(body.audience || 'pool_tech', 120);
  const sourceProofId = clean(body.sourceProofId || body.source_proof_id, 180);
  const moduleBody = clean(body.body || body.lesson || '', 3000);
  const quizJson = JSON.stringify(Array.isArray(body.quiz) ? body.quiz.slice(0, 12) : []).slice(0, 2400);
  const status = clean(body.status || 'pilot', 80).toLowerCase();
  await db.prepare(
    `INSERT INTO learning_modules (id, title, lane, audience, source_proof_id, body, quiz_json, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'owner')
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, lane = excluded.lane, audience = excluded.audience,
       source_proof_id = excluded.source_proof_id, body = excluded.body, quiz_json = excluded.quiz_json,
       status = excluded.status, updated_at = CURRENT_TIMESTAMP`,
  ).bind(id, title, lane, audience, sourceProofId, moduleBody, quizJson, status).run();
  await logAudit(db, request, 'admin_learning_module_published', 'learning_module', id, { title, lane, audience, status });
  return { ok: true, moduleId: id };
}

export async function onRequestGet({ request, env }) {
  const headers = corsHeaders(request);
  if (!authOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'SUBSCRIBERS_DB binding is not configured' }, 503, headers);
  await ensureAdminTables(env.SUBSCRIBERS_DB);
  return json({ ok: true, generatedAt: new Date().toISOString(), project: 'splashlens', ...(await dashboardSnapshot(env.SUBSCRIBERS_DB)) }, 200, headers);
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);
  if (!authOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'SUBSCRIBERS_DB binding is not configured' }, 503, headers);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Valid JSON is required.' }, 400, headers);
  }
  await ensureAdminTables(env.SUBSCRIBERS_DB);
  const action = clean(body.action || '', 80).toLowerCase();
  let result;
  if (action === 'update_entitlement') result = await updateEntitlement(env.SUBSCRIBERS_DB, request, body);
  else if (action === 'update_team_billing') result = await updateTeamBilling(env.SUBSCRIBERS_DB, request, body);
  else if (action === 'approve_partner_card') result = await approvePartnerCard(env.SUBSCRIBERS_DB, request, body);
  else if (action === 'publish_learning_module') result = await publishLearningModule(env.SUBSCRIBERS_DB, request, body);
  else result = { ok: false, statusCode: 400, error: 'Unknown admin action.' };
  if (!result.ok) return json(result, result.statusCode || 400, headers);
  return json({ ...result, ...(await dashboardSnapshot(env.SUBSCRIBERS_DB)) }, 200, headers);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
