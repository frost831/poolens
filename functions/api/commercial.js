// /api/commercial - protected commercialization control plane for SplashLens.
// Env: SUBSCRIBERS_DB, SCAN_USAGE_KV, SPLASHLENS_PROFILE_SECRET/SPLASHLENS_ENTITLEMENT_SECRET,
// optional SENDGRID_API_KEY/SENDGRID_FROM/SPLASHLENS_OWNER_EMAIL.

const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1';
const FREE_SCAN_LIMIT = 3;
const textEncoder = new TextEncoder();

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

const COMMERCIAL_LANES = new Set([
  'pro',
  'teams',
  'facility',
  'manufacturer',
  'distributor',
  'training',
]);

const PLAN_CATALOG = [
  {
    lane: 'free',
    label: 'Free Field Tools',
    price: '$0',
    status: 'live',
    included: ['manual lookup', 'basic calculators', 'local notes', 'basic Facility Assist'],
  },
  {
    lane: 'pro',
    label: 'Splash Lens Pro',
    price: '$29/mo or $249/yr',
    status: 'live_checkout',
    included: ['more PartSnap/AI scanning', 'saved job proof', 'customer-ready notes', 'supplier handoff text'],
  },
  {
    lane: 'teams',
    label: 'Team Workspaces',
    price: '$149/company/mo target',
    status: 'pilot_request',
    included: ['crew invites', 'shared proof history', 'owner usage signals', 'team report exports'],
  },
  {
    lane: 'facility',
    label: 'Facility / CPO Mode',
    price: 'pilot request',
    status: 'partner_pilot',
    included: ['daily checks', 'incident workflow', 'dose logs', 'staff handoff records'],
  },
  {
    lane: 'manufacturer',
    label: 'Verified Manufacturer Cards',
    price: 'partner pricing',
    status: 'partner_pilot',
    included: ['model families', 'known misses', 'required proof photos', 'preferred support language'],
  },
  {
    lane: 'distributor',
    label: 'Distributor / Counter Mode',
    price: 'partner pricing',
    status: 'partner_pilot',
    included: ['proof before ordering', 'part-family packets', 'counter-safe handoff', 'wrong-order reduction'],
  },
  {
    lane: 'training',
    label: 'Field Learning OS',
    price: 'partner pricing',
    status: 'partner_pilot',
    included: ['5-minute field lessons', 'quizzes from real misses', 'trainer-reviewed cards', 'CPO workflow prompts'],
  },
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-SplashLens-Account-Token',
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

function normalizeEmail(value) {
  const email = clean(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function safeJson(value, max = 3600) {
  try {
    return JSON.stringify(value && typeof value === 'object' ? value : {}).slice(0, max);
  } catch {
    return '{}';
  }
}

function profileSecret(env) {
  const secret = String(env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function accountTokenFromRequest(request) {
  const headerToken = request.headers.get('x-splashlens-account-token')?.trim();
  if (headerToken) return headerToken;
  const auth = request.headers.get('authorization')?.trim() || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  return bearer.startsWith(`${ACCOUNT_TOKEN_PREFIX}.`) ? bearer : '';
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function scopeAllowed(scopes, requested) {
  if (!scopes) return false;
  if (scopes === 'all' || scopes === requested) return true;
  return Array.isArray(scopes) && (scopes.includes('all') || scopes.includes(requested));
}

async function verifyAccountToken(request, env) {
  const token = accountTokenFromRequest(request);
  if (!token) return { ok: false, status: 401, error: 'Sign in with your SplashLens email before using paid or partner workflows.' };

  const secret = profileSecret(env);
  if (!secret) return { ok: false, status: 503, error: 'Account verification is not configured.' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== ACCOUNT_TOKEN_PREFIX) {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  const signed = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(secret, signed);
  if (!constantTimeEqual(parts[2], expected)) {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }

  if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
    return { ok: false, status: 401, error: 'SplashLens account token is invalid.' };
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 401, error: 'SplashLens account sign-in expired. Verify your email again.' };
  }
  if (!scopeAllowed(payload.scopes, 'account')) {
    return { ok: false, status: 403, error: 'SplashLens account token does not include account access.' };
  }

  return { ok: true, email: payload.sub.toLowerCase(), expiresAt: new Date(payload.exp * 1000).toISOString() };
}

async function ensureCommercialTables(db) {
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
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      source TEXT,
      path TEXT,
      plan TEXT,
      mode TEXT,
      props TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
}

async function first(db, sql, ...bindings) {
  return (await db.prepare(sql).bind(...bindings).first()) || {};
}

async function all(db, sql, ...bindings) {
  const result = await db.prepare(sql).bind(...bindings).all();
  return result.results || [];
}

async function safeAll(db, sql, ...bindings) {
  try {
    return await all(db, sql, ...bindings);
  } catch {
    return [];
  }
}

async function safeFirst(db, sql, ...bindings) {
  try {
    return await first(db, sql, ...bindings);
  } catch {
    return {};
  }
}

async function logAudit(db, request, actorEmail, action, targetType, targetId, payload = {}) {
  const id = `audit_${crypto.randomUUID()}`;
  await db.prepare(
    `INSERT INTO audit_records (id, actor_email, action, target_type, target_id, payload, user_agent, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    actorEmail,
    clean(action, 120),
    clean(targetType, 80),
    clean(targetId, 180),
    safeJson(payload, 2400),
    clean(request.headers.get('User-Agent'), 300),
    clean(request.headers.get('Referer'), 500),
    clean(request.cf && request.cf.country, 10),
  ).run();
  return id;
}

async function logEvent(db, request, event, actorEmail, mode, props = {}) {
  await db.prepare(
    `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    clean(event, 80),
    'app',
    clean(props.path || '/api/commercial', 300),
    clean(props.plan || mode || 'commercial', 80),
    clean(mode || 'commercial', 80),
    safeJson({ ...props, actor_email: actorEmail, identity_source: 'passwordless_account' }, 2400),
    clean(request.headers.get('User-Agent'), 300),
    clean(request.headers.get('Referer'), 500),
    clean(request.cf && request.cf.country, 10),
  ).run();
}

async function checkRateLimit(env, key, limit = 30, ttlSeconds = 3600) {
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.get !== 'function' || typeof env.SCAN_USAGE_KV.put !== 'function') {
    return { ok: true, source: 'unavailable' };
  }
  const rateKey = `commercial_rate:${key}:${Math.floor(Date.now() / (ttlSeconds * 1000))}`;
  const count = Number(await env.SCAN_USAGE_KV.get(rateKey)) || 0;
  if (count >= limit) return { ok: false, retryAfter: ttlSeconds, count, limit };
  await env.SCAN_USAGE_KV.put(rateKey, String(count + 1), { expirationTtl: ttlSeconds });
  return { ok: true, count: count + 1, limit, source: 'kv' };
}

function parseSender(value) {
  const raw = clean(value || 'hello@splashlens.com', 220);
  const match = raw.match(/^(.*?)<([^>]+)>$/);
  const email = normalizeEmail(match ? match[2] : raw) || 'hello@splashlens.com';
  const name = clean(match ? match[1] : 'SplashLens', 80).replace(/^"|"$/g, '') || 'SplashLens';
  return { email, name };
}

async function sendCommercialNotice(env, subject, lines) {
  const apiKey = String(env.SENDGRID_API_KEY || '').trim();
  if (!apiKey) return { sent: false, error: 'SENDGRID_API_KEY is not configured.' };
  const toEmail = normalizeEmail(env.SPLASHLENS_OWNER_EMAIL || env.SPLASHLENS_NOTIFY_EMAIL || 'hello@splashlens.com');
  const from = parseSender(env.SENDGRID_FROM || env.SPLASHLENS_EMAIL_FROM || 'hello@splashlens.com');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from,
      subject,
      content: [{ type: 'text/plain', value: lines.filter(Boolean).join('\n') }],
    }),
  });
  if (!response.ok) return { sent: false, error: `SendGrid returned ${response.status}` };
  return { sent: true };
}

async function kvEntitlement(env, email) {
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.get !== 'function') return null;
  try {
    const raw = await env.SCAN_USAGE_KV.get(`entitlement:${email}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      id: `kv:${email}`,
      email,
      lane: 'pro',
      plan: clean(parsed.plan || 'Splash Lens Pro', 100),
      status: 'active',
      source: clean(parsed.source || 'scan_entitlement_kv', 80),
      currentPeriodEnd: clean(parsed.expiresAt || '', 80),
      stripeSessionId: clean(parsed.stripeSessionId || '', 140),
    };
  } catch {
    return null;
  }
}

async function snapshot(db, env, email) {
  const storedEntitlements = await safeAll(db, `
    SELECT id, email, team_id AS teamId, lane, plan, status, source, stripe_session_id AS stripeSessionId, stripe_customer_id AS stripeCustomerId,
           current_period_end AS currentPeriodEnd, created_at AS createdAt, updated_at AS updatedAt
    FROM commercial_entitlements
    WHERE email = ? AND status IN ('active', 'trialing', 'pilot')
    ORDER BY created_at DESC
    LIMIT 20
  `, email);
  const paymentEvents = await safeAll(db, `
    SELECT event_type AS eventType, stripe_session_id AS stripeSessionId, subject, plan, created_at AS createdAt
    FROM payment_events
    WHERE subject = ?
    ORDER BY created_at DESC
    LIMIT 10
  `, email);
  const proofStats = await safeFirst(db, `
    SELECT COUNT(*) AS total, SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS last30
    FROM service_proof_records
    WHERE email = ? AND status = 'saved'
  `, email);
  const recentProof = await safeAll(db, `
    SELECT id, customer_label AS customerLabel, workflow, proof_status AS proofStatus, risk_level AS riskLevel, created_at AS createdAt
    FROM service_proof_records
    WHERE email = ? AND status = 'saved'
    ORDER BY created_at DESC
    LIMIT 8
  `, email);
  const intakes = await safeAll(db, `
    SELECT id, lane, interest, status, source, created_at AS createdAt
    FROM commercial_intake
    WHERE email = ?
    ORDER BY created_at DESC
    LIMIT 10
  `, email);
  const teams = await safeAll(db, `
    SELECT t.id, t.name, tm.role, tm.status AS memberStatus, t.status
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.email = ? AND tm.status IN ('active', 'pending')
    ORDER BY t.created_at DESC
    LIMIT 10
  `, email);
  const kv = await kvEntitlement(env, email);
  const entitlements = kv
    ? [kv, ...storedEntitlements.filter((row) => row.stripeSessionId !== kv.stripeSessionId)]
    : storedEntitlements;

  return {
    email,
    plans: PLAN_CATALOG,
    entitlements,
    paymentEvents,
    proof: {
      total: Number(proofStats.total || 0),
      last30: Number(proofStats.last30 || 0),
      recent: recentProof,
    },
    intakes,
    teams,
    readiness: {
      accountAuth: Boolean(profileSecret(env)),
      d1: Boolean(env.SUBSCRIBERS_DB),
      serverSideScanMetering: Boolean(env.SCAN_USAGE_KV),
      stripeWebhookConfigured: Boolean(env.SPLASHLENS_STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET),
      stripeAllowedPaymentLinksConfigured: Boolean(env.SPLASHLENS_STRIPE_PAYMENT_LINK_IDS || env.SPLASHLENS_STRIPE_ALLOWED_PAYMENT_LINKS),
      officialEmailConfigured: Boolean(env.SENDGRID_API_KEY && (env.SENDGRID_FROM || env.SPLASHLENS_EMAIL_FROM)),
      durableProofMetadata: true,
      r2ProofImages: Boolean(env.SPLASHLENS_PROOF_BUCKET || env.PROOF_BUCKET),
      auditRecords: true,
    },
    northStar: 'Free field lookup plus paid proof, team, facility, manufacturer, distributor, and training workflows.',
  };
}

async function requireTeamAccess(db, email, teamId) {
  if (!teamId) return true;
  const member = await safeFirst(db, `
    SELECT role, status FROM team_members
    WHERE team_id = ? AND email = ? AND status = 'active'
  `, teamId, email);
  return member.status === 'active';
}

async function requestAccess(request, env, db, auth, body, headers) {
  const lane = clean(body.lane || body.plan || 'pro', 40).toLowerCase();
  if (!COMMERCIAL_LANES.has(lane)) return json({ ok: false, error: 'Unknown SplashLens commercial lane.' }, 400, headers);
  const id = `intake_${crypto.randomUUID()}`;
  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const role = clean(body.role, 80);
  const interest = clean(body.interest || lane, 120);
  const notes = clean(body.notes, 1000);
  await db.prepare(
    `INSERT INTO commercial_intake (id, email, name, company, role, lane, interest, notes, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, auth.email, name, company, role, lane, interest, notes, clean(body.source || 'app_account_modal', 80)).run();
  await logEvent(db, request, 'commercial_access_requested', auth.email, lane, { intake_id: id, lane, company, role });
  await logAudit(db, request, auth.email, 'commercial_access_requested', 'commercial_intake', id, { lane, company, role });
  const notice = await sendCommercialNotice(env, `SplashLens ${lane} access request`, [
    `Email: ${auth.email}`,
    company ? `Company: ${company}` : '',
    role ? `Role: ${role}` : '',
    `Lane: ${lane}`,
    interest ? `Interest: ${interest}` : '',
    notes ? `Notes: ${notes}` : '',
    '',
    'Talk Soon,',
    'SplashLens',
  ]);
  return json({ ok: true, intakeId: id, lane, noticeSent: notice.sent, noticeError: notice.sent ? '' : notice.error }, 200, headers);
}

async function saveProof(request, env, db, auth, body, headers) {
  const teamId = clean(body.teamId || body.team_id, 140);
  if (!(await requireTeamAccess(db, auth.email, teamId))) {
    return json({ ok: false, error: 'That team proof record is not available to this account.' }, 403, headers);
  }
  const id = clean(body.id, 120) || `proof_${crypto.randomUUID()}`;
  const workflow = clean(body.workflow || body.type || 'field_stop', 80);
  const customerLabel = clean(body.customerLabel || body.customer || body.pool || '', 160);
  const summary = clean(body.summary || body.customerSummary || body.note || '', 1200);
  const proofStatus = clean(body.proofStatus || body.status || 'saved', 60);
  const riskLevel = clean(body.riskLevel || body.risk || 'unknown', 60);
  await db.prepare(
    `INSERT INTO service_proof_records (id, email, team_id, customer_label, workflow, summary, proof_status, risk_level, source, payload, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved')
     ON CONFLICT(id) DO UPDATE SET
       customer_label = excluded.customer_label,
       workflow = excluded.workflow,
       summary = excluded.summary,
       proof_status = excluded.proof_status,
       risk_level = excluded.risk_level,
       source = excluded.source,
       payload = excluded.payload,
       status = 'saved',
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(
    id,
    auth.email,
    teamId,
    customerLabel,
    workflow,
    summary,
    proofStatus,
    riskLevel,
    clean(body.source || 'app_service_proof', 80),
    safeJson(body.payload || body, 3600),
  ).run();
  await logEvent(db, request, 'service_proof_record_saved_server', auth.email, workflow, { proof_id: id, workflow, proof_status: proofStatus, risk_level: riskLevel });
  await logAudit(db, request, auth.email, 'service_proof_record_saved', 'service_proof_record', id, { workflow, proofStatus, riskLevel, teamId });
  return json({ ok: true, proofId: id, ...(await snapshot(db, env, auth.email)) }, 200, headers);
}

async function partnerCardRequest(request, env, db, auth, body, headers) {
  const id = `partner_card_${crypto.randomUUID()}`;
  const company = clean(body.company, 160);
  const lane = clean(body.lane || 'manufacturer', 60);
  const manufacturer = clean(body.manufacturer || body.brand || company, 160);
  const docUrl = clean(body.docUrl || body.url || '', 500);
  const proofLanguage = clean(body.proofLanguage || body.notes || '', 1200);
  await db.prepare(
    `INSERT INTO partner_card_requests (id, email, company, lane, manufacturer, doc_url, proof_language)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, auth.email, company, lane, manufacturer, docUrl, proofLanguage).run();
  await logEvent(db, request, 'partner_verified_card_requested', auth.email, lane, { partner_card_id: id, manufacturer, company });
  await logAudit(db, request, auth.email, 'partner_verified_card_requested', 'partner_card_request', id, { lane, manufacturer, company, docUrl });
  const notice = await sendCommercialNotice(env, `SplashLens partner card request: ${manufacturer || company || auth.email}`, [
    `Email: ${auth.email}`,
    company ? `Company: ${company}` : '',
    manufacturer ? `Manufacturer/brand: ${manufacturer}` : '',
    docUrl ? `Docs: ${docUrl}` : '',
    proofLanguage ? `Preferred proof language: ${proofLanguage}` : '',
    '',
    'Talk Soon,',
    'SplashLens',
  ]);
  return json({ ok: true, partnerCardRequestId: id, noticeSent: notice.sent, noticeError: notice.sent ? '' : notice.error }, 200, headers);
}

export async function onRequestGet({ request, env }) {
  const headers = corsHeaders(request);
  const auth = await verifyAccountToken(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status || 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Commercial database is not configured.' }, 503, headers);
  await ensureCommercialTables(env.SUBSCRIBERS_DB);
  await logEvent(env.SUBSCRIBERS_DB, request, 'commercial_snapshot_opened', auth.email, 'commercial', {});
  return json({ ok: true, ...(await snapshot(env.SUBSCRIBERS_DB, env, auth.email)) }, 200, headers);
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);
  const auth = await verifyAccountToken(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status || 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Commercial database is not configured.' }, 503, headers);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Valid JSON is required.' }, 400, headers);
  }

  const action = clean(body.action || body.intent || 'snapshot', 80).toLowerCase();
  const rate = await checkRateLimit(env, `${auth.email}:${action}`, action === 'save_proof' ? 120 : 30);
  if (!rate.ok) return json({ ok: false, error: 'SplashLens commercial workflow rate limit reached. Try again shortly.' }, 429, headers);

  await ensureCommercialTables(env.SUBSCRIBERS_DB);
  if (action === 'request_access' || action === 'request') return requestAccess(request, env, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'save_proof' || action === 'save_service_proof') return saveProof(request, env, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'partner_card_request' || action === 'verified_card') return partnerCardRequest(request, env, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'snapshot' || action === 'list') return json({ ok: true, ...(await snapshot(env.SUBSCRIBERS_DB, env, auth.email)) }, 200, headers);
  return json({ ok: false, error: 'Unknown SplashLens commercial action.' }, 400, headers);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
