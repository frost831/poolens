import { cleanText, normalizeEmail, verifySplashLensAccount } from '../lib/splashlens-account-auth.mjs';
import { canTransitionReview, reviewRequiresComment, sanitizeReviewInput } from '../lib/team-review.mjs';

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'https://poolens.pages.dev',
]);
const REVIEWER_ROLES = new Set(['owner', 'admin']);
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_ACTIVE_REVIEWS_PER_TEAM = 500;
const MAX_REVIEWS_PER_ACCOUNT_PER_HOUR = 60;
const MAX_COMMENTS_PER_REVIEW = 200;
const MAX_COMMENTS_PER_ACCOUNT_PER_HOUR = 120;

function responseHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://app.splashlens.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-SplashLens-Account-Token',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders(request) });
}

async function parseBoundedJson(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_REQUEST_BYTES) throw new RangeError('Review request is too large.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_REQUEST_BYTES) throw new RangeError('Review request is too large.');
  return JSON.parse(text || '{}');
}

async function ensureReviewTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active',
    joined_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, email)
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS proof_packets (
    id TEXT PRIMARY KEY,
    share_id TEXT NOT NULL UNIQUE,
    owner_email TEXT NOT NULL,
    team_id TEXT,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_review_items (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    assignee_email TEXT,
    reviewer_email TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    proof_packet_id TEXT,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    last_transition_id TEXT,
    submitted_at DATETIME,
    decided_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proof_packet_id) REFERENCES proof_packets(id)
  )`).run();
  await db.prepare('ALTER TABLE team_review_items ADD COLUMN last_transition_id TEXT').run().catch(() => {});
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_review_comments (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    author_email TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'comment',
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_review_audit (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS events (
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
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_team_review_queue ON team_review_items(team_id, status, updated_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_team_review_assignee ON team_review_items(team_id, assignee_email, status)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_team_review_comments ON team_review_comments(review_id, created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_team_review_audit ON team_review_audit(review_id, created_at)').run();
}

async function teamMember(db, teamId, email) {
  if (!teamId || !email) return null;
  return db.prepare(
    `SELECT tm.role, tm.status FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id AND t.status = 'active'
     WHERE tm.team_id = ? AND lower(tm.email) = lower(?) AND tm.status = 'active' LIMIT 1`,
  ).bind(teamId, email).first();
}

async function requireMember(db, teamId, email) {
  const member = await teamMember(db, teamId, email);
  return member && member.status === 'active' ? member : null;
}

function isReviewer(member) {
  return Boolean(member && REVIEWER_ROLES.has(String(member.role || '').toLowerCase()));
}

async function reviewWriteRateAllowed(db, email, limit = MAX_COMMENTS_PER_ACCOUNT_PER_HOUR) {
  const row = await db.prepare(
    `SELECT COUNT(*) AS value FROM team_review_audit
     WHERE lower(actor_email) = lower(?) AND created_at >= datetime('now', '-1 hour')`,
  ).bind(email).first();
  return Number(row?.value || 0) < limit;
}

async function getReview(db, reviewId) {
  return db.prepare(
    `SELECT id, team_id AS teamId, created_by AS createdBy, assignee_email AS assigneeEmail,
            reviewer_email AS reviewerEmail, title, summary, proof_packet_id AS proofPacketId,
            payload, status, submitted_at AS submittedAt, decided_at AS decidedAt,
            created_at AS createdAt, updated_at AS updatedAt
     FROM team_review_items WHERE id = ? LIMIT 1`,
  ).bind(reviewId).first();
}

function auditStatements(db, request, review, actorEmail, action, fromStatus = '', toStatus = '', details = {}, guardTransitionId = '') {
  const auditId = `review_audit_${crypto.randomUUID()}`;
  const auditDetails = JSON.stringify(details).slice(0, 2000);
  const eventName = `team_review_${cleanText(action, 60)}`;
  const eventProps = JSON.stringify({ review_id: review.id, team_id: review.teamId, from_status: fromStatus, to_status: toStatus }).slice(0, 1800);
  const userAgent = cleanText(request.headers.get('User-Agent'), 300);
  const referrer = cleanText(request.headers.get('Referer'), 500);
  const country = cleanText(request.cf?.country, 10);
  if (guardTransitionId) {
    return [
      db.prepare(
        `INSERT INTO team_review_audit (id, review_id, team_id, actor_email, action, from_status, to_status, details)
         SELECT ?, id, team_id, ?, ?, ?, ?, ? FROM team_review_items WHERE id = ? AND last_transition_id = ?`,
      ).bind(auditId, actorEmail, cleanText(action, 80), cleanText(fromStatus, 40), cleanText(toStatus, 40), auditDetails, review.id, guardTransitionId),
      db.prepare(
        `INSERT INTO events (event, source, path, mode, props, user_agent, referrer, country)
         SELECT ?, 'team_review', '/api/team-review', 'team_review', ?, ?, ?, ?
         FROM team_review_items WHERE id = ? AND last_transition_id = ?`,
      ).bind(eventName, eventProps, userAgent, referrer, country, review.id, guardTransitionId),
    ];
  }
  return [
    db.prepare(
      `INSERT INTO team_review_audit (id, review_id, team_id, actor_email, action, from_status, to_status, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(auditId, review.id, review.teamId, actorEmail, cleanText(action, 80), cleanText(fromStatus, 40), cleanText(toStatus, 40), auditDetails),
    db.prepare(
      `INSERT INTO events (event, source, path, mode, props, user_agent, referrer, country)
       VALUES (?, 'team_review', '/api/team-review', 'team_review', ?, ?, ?, ?)`,
    ).bind(eventName, eventProps, userAgent, referrer, country),
  ];
}

async function detailPayload(db, review) {
  const [commentsResult, auditResult] = await Promise.all([
    db.prepare(
      `SELECT id, author_email AS authorEmail, kind, body, created_at AS createdAt
       FROM team_review_comments WHERE review_id = ? ORDER BY created_at ASC LIMIT 200`,
    ).bind(review.id).all(),
    db.prepare(
      `SELECT id, actor_email AS actorEmail, action, from_status AS fromStatus, to_status AS toStatus,
              details, created_at AS createdAt
       FROM team_review_audit WHERE review_id = ? ORDER BY created_at ASC LIMIT 200`,
    ).bind(review.id).all(),
  ]);
  let payload = {};
  try { payload = JSON.parse(review.payload || '{}'); } catch {}
  return { ...review, payload, comments: commentsResult?.results || [], audit: auditResult?.results || [] };
}

async function listReviews(request, db, auth, url) {
  const teamId = cleanText(url.searchParams.get('teamId') || url.searchParams.get('team_id'), 140);
  if (!teamId) return json({ ok: false, error: 'Team id is required.' }, 400, request);
  const member = await requireMember(db, teamId, auth.email);
  if (!member) return json({ ok: false, error: 'Active team membership is required.' }, 403, request);
  const status = cleanText(url.searchParams.get('status'), 40).toLowerCase();
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)));
  const result = await db.prepare(
    `SELECT id, team_id AS teamId, created_by AS createdBy, assignee_email AS assigneeEmail,
            reviewer_email AS reviewerEmail, title, summary, proof_packet_id AS proofPacketId,
            status, submitted_at AS submittedAt, decided_at AS decidedAt,
            created_at AS createdAt, updated_at AS updatedAt
     FROM team_review_items
     WHERE team_id = ? AND (? = '' OR status = ?)
     ORDER BY updated_at DESC LIMIT ?`,
  ).bind(teamId, status, status, limit).all();
  return json({ ok: true, teamId, memberRole: member.role, reviews: result?.results || [] }, 200, request);
}

async function reviewDetail(request, db, auth, reviewId) {
  const review = await getReview(db, reviewId);
  if (!review) return json({ ok: false, error: 'Review item not found.' }, 404, request);
  const member = await requireMember(db, review.teamId, auth.email);
  if (!member) return json({ ok: false, error: 'Active team membership is required.' }, 403, request);
  return json({ ok: true, memberRole: member.role, review: await detailPayload(db, review) }, 200, request);
}

async function createReview(request, db, auth, body) {
  const data = sanitizeReviewInput(body);
  if (!data.teamId || !data.title) return json({ ok: false, error: 'Team id and title are required.' }, 400, request);
  const member = await requireMember(db, data.teamId, auth.email);
  if (!member) return json({ ok: false, error: 'Active team membership is required.' }, 403, request);
  if (data.assigneeEmail && !(await requireMember(db, data.teamId, data.assigneeEmail))) {
    return json({ ok: false, error: 'Assignee must be an active member of this team.' }, 400, request);
  }
  if (data.proofPacketId) {
    const proofPacket = await db.prepare(
      `SELECT id FROM proof_packets
       WHERE id = ? AND team_id = ? AND status = 'active' AND expires_at > CURRENT_TIMESTAMP LIMIT 1`,
    ).bind(data.proofPacketId, data.teamId).first();
    if (!proofPacket) return json({ ok: false, error: 'Proof packet must be active and belong to this team.' }, 403, request);
  }
  const quota = await db.prepare(
    `SELECT
       SUM(CASE WHEN status IN ('draft','submitted','evidence_requested') THEN 1 ELSE 0 END) AS activeCount,
       SUM(CASE WHEN lower(created_by) = lower(?) AND created_at >= datetime('now', '-1 hour') THEN 1 ELSE 0 END) AS recentCount
     FROM team_review_items WHERE team_id = ?`,
  ).bind(auth.email, data.teamId).first();
  if (Number(quota?.activeCount || 0) >= MAX_ACTIVE_REVIEWS_PER_TEAM) {
    return json({ ok: false, error: 'This team review queue is full. Close existing reviews before adding another.' }, 429, request);
  }
  if (Number(quota?.recentCount || 0) >= MAX_REVIEWS_PER_ACCOUNT_PER_HOUR) {
    return json({ ok: false, error: 'Review creation is temporarily rate limited. Try again later.' }, 429, request);
  }
  const review = {
    id: `team_review_${crypto.randomUUID()}`,
    teamId: data.teamId,
    createdBy: auth.email,
    assigneeEmail: data.assigneeEmail,
    title: data.title,
    summary: data.summary,
    proofPacketId: data.proofPacketId,
    status: 'draft',
  };
  await db.batch([
    db.prepare(
      `INSERT INTO team_review_items
        (id, team_id, created_by, assignee_email, title, summary, proof_packet_id, payload, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    ).bind(review.id, review.teamId, review.createdBy, review.assigneeEmail, review.title, review.summary, review.proofPacketId, JSON.stringify(data.payload)),
    ...auditStatements(db, request, review, auth.email, 'created', '', 'draft', { assigneeEmail: data.assigneeEmail, proofPacketId: data.proofPacketId }),
  ]);
  return reviewDetail(request, db, auth, review.id);
}

async function assignReview(request, db, auth, body) {
  const reviewId = cleanText(body.reviewId || body.review_id || body.id, 140);
  const assigneeEmail = normalizeEmail(body.assigneeEmail || body.assignee_email);
  const review = await getReview(db, reviewId);
  if (!review) return json({ ok: false, error: 'Review item not found.' }, 404, request);
  const member = await requireMember(db, review.teamId, auth.email);
  if (!isReviewer(member)) return json({ ok: false, error: 'Only team owners or admins can assign reviews.' }, 403, request);
  if (!(await reviewWriteRateAllowed(db, auth.email))) return json({ ok: false, error: 'Team review updates are temporarily rate limited.' }, 429, request);
  if (!assigneeEmail || !(await requireMember(db, review.teamId, assigneeEmail))) {
    return json({ ok: false, error: 'Assignee must be an active member of this team.' }, 400, request);
  }
  if (['approved', 'rejected'].includes(review.status)) return json({ ok: false, error: 'Closed reviews cannot be reassigned.' }, 409, request);
  const assignmentId = `review_assignment_${crypto.randomUUID()}`;
  const results = await db.batch([
    db.prepare(
      `UPDATE team_review_items SET assignee_email = ?, last_transition_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = ?`,
    ).bind(assigneeEmail, assignmentId, review.id, review.status),
    ...auditStatements(db, request, review, auth.email, 'assigned', review.status, review.status, { assigneeEmail, assignmentId }, assignmentId),
  ]);
  if (Number(results?.[0]?.meta?.changes || 0) !== 1) {
    return json({ ok: false, error: 'This review changed while you were assigning it. Refresh and try again.' }, 409, request);
  }
  return reviewDetail(request, db, auth, review.id);
}

async function commentOnReview(request, db, auth, body) {
  const data = sanitizeReviewInput(body);
  const reviewId = cleanText(body.reviewId || body.review_id || body.id, 140);
  const review = await getReview(db, reviewId);
  if (!review) return json({ ok: false, error: 'Review item not found.' }, 404, request);
  if (!(await requireMember(db, review.teamId, auth.email))) return json({ ok: false, error: 'Active team membership is required.' }, 403, request);
  if (!data.comment) return json({ ok: false, error: 'Comment is required.' }, 400, request);
  const quota = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM team_review_comments WHERE review_id = ?) AS reviewCount,
       (SELECT COUNT(*) FROM team_review_comments WHERE lower(author_email) = lower(?) AND created_at >= datetime('now', '-1 hour')) AS recentCount`,
  ).bind(review.id, auth.email).first();
  if (Number(quota?.reviewCount || 0) >= MAX_COMMENTS_PER_REVIEW || Number(quota?.recentCount || 0) >= MAX_COMMENTS_PER_ACCOUNT_PER_HOUR) {
    return json({ ok: false, error: 'Review comments are temporarily rate limited.' }, 429, request);
  }
  const commentId = `review_comment_${crypto.randomUUID()}`;
  await db.batch([
    db.prepare(
      `INSERT INTO team_review_comments (id, review_id, team_id, author_email, kind, body)
       VALUES (?, ?, ?, ?, 'comment', ?)`,
    ).bind(commentId, review.id, review.teamId, auth.email, data.comment),
    ...auditStatements(db, request, review, auth.email, 'commented', review.status, review.status, { commentId }),
  ]);
  return reviewDetail(request, db, auth, review.id);
}

async function transitionReview(request, db, auth, body, targetStatus) {
  const data = sanitizeReviewInput(body);
  const reviewId = cleanText(body.reviewId || body.review_id || body.id, 140);
  const review = await getReview(db, reviewId);
  if (!review) return json({ ok: false, error: 'Review item not found.' }, 404, request);
  const member = await requireMember(db, review.teamId, auth.email);
  if (!member) return json({ ok: false, error: 'Active team membership is required.' }, 403, request);
  if (!(await reviewWriteRateAllowed(db, auth.email))) return json({ ok: false, error: 'Team review updates are temporarily rate limited.' }, 429, request);

  if (targetStatus === 'submitted') {
    const ownsWork = [review.createdBy, review.assigneeEmail].filter(Boolean).map((email) => email.toLowerCase()).includes(auth.email);
    if (!ownsWork && !isReviewer(member)) return json({ ok: false, error: 'Only the creator, assignee, owner, or admin can submit this review.' }, 403, request);
  } else if (!isReviewer(member)) {
    return json({ ok: false, error: 'Only team owners or admins can request evidence or decide reviews.' }, 403, request);
  }
  if (!canTransitionReview(review.status, targetStatus)) {
    return json({ ok: false, error: `Review cannot move from ${review.status} to ${targetStatus}.` }, 409, request);
  }
  if (reviewRequiresComment(targetStatus) && !data.comment) {
    return json({ ok: false, error: 'A reason is required for this review decision.' }, 400, request);
  }

  const reviewerEmail = ['evidence_requested', 'approved', 'rejected'].includes(targetStatus) ? auth.email : review.reviewerEmail || '';
  const transitionId = `review_transition_${crypto.randomUUID()}`;
  const commentId = data.comment ? `review_comment_${crypto.randomUUID()}` : '';
  const statements = [db.prepare(
    `UPDATE team_review_items SET status = ?, reviewer_email = ?,
       submitted_at = CASE WHEN ? = 'submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END,
       decided_at = CASE WHEN ? IN ('approved','rejected') THEN CURRENT_TIMESTAMP ELSE NULL END,
       last_transition_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?`,
  ).bind(targetStatus, reviewerEmail, targetStatus, targetStatus, transitionId, review.id, review.status)];
  if (data.comment) {
    statements.push(db.prepare(
      `INSERT INTO team_review_comments (id, review_id, team_id, author_email, kind, body)
       SELECT ?, id, team_id, ?, ?, ? FROM team_review_items WHERE id = ? AND last_transition_id = ?`,
    ).bind(commentId, auth.email, targetStatus, data.comment, review.id, transitionId));
  }
  statements.push(db.prepare(
    `INSERT INTO team_review_audit (id, review_id, team_id, actor_email, action, from_status, to_status, details)
     SELECT ?, id, team_id, ?, ?, ?, ?, ? FROM team_review_items WHERE id = ? AND last_transition_id = ?`,
  ).bind(
    `review_audit_${crypto.randomUUID()}`,
    auth.email,
    targetStatus,
    review.status,
    targetStatus,
    JSON.stringify({ commentId, transitionId }).slice(0, 2000),
    review.id,
    transitionId,
  ));
  statements.push(db.prepare(
    `INSERT INTO events (event, source, path, mode, props, user_agent, referrer, country)
     SELECT ?, 'team_review', '/api/team-review', 'team_review', ?, ?, ?, ?
     FROM team_review_items WHERE id = ? AND last_transition_id = ?`,
  ).bind(
    `team_review_${cleanText(targetStatus, 60)}`,
    JSON.stringify({ review_id: review.id, team_id: review.teamId, from_status: review.status, to_status: targetStatus }).slice(0, 1800),
    cleanText(request.headers.get('User-Agent'), 300),
    cleanText(request.headers.get('Referer'), 500),
    cleanText(request.cf?.country, 10),
    review.id,
    transitionId,
  ));
  const results = await db.batch(statements);
  if (Number(results?.[0]?.meta?.changes || 0) !== 1) {
    return json({ ok: false, error: 'This review changed while you were acting on it. Refresh and try again.' }, 409, request);
  }
  return reviewDetail(request, db, auth, review.id);
}

export async function onRequestGet({ request, env }) {
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, request);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Team review database is not configured.' }, 503, request);
  await ensureReviewTables(env.SUBSCRIBERS_DB);
  const url = new URL(request.url);
  const action = cleanText(url.searchParams.get('action') || 'list', 30).toLowerCase();
  if (action === 'list') return listReviews(request, env.SUBSCRIBERS_DB, auth, url);
  if (action === 'detail') return reviewDetail(request, env.SUBSCRIBERS_DB, auth, cleanText(url.searchParams.get('reviewId') || url.searchParams.get('id'), 140));
  return json({ ok: false, error: 'Unknown team review action.' }, 400, request);
}

export async function onRequestPost({ request, env }) {
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, request);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Team review database is not configured.' }, 503, request);
  await ensureReviewTables(env.SUBSCRIBERS_DB);
  let body;
  try {
    body = await parseBoundedJson(request);
  } catch (error) {
    return json({ ok: false, error: error instanceof RangeError ? error.message : 'Valid JSON is required.' }, error instanceof RangeError ? 413 : 400, request);
  }
  const action = cleanText(body.action, 40).toLowerCase();
  if (action === 'create') return createReview(request, env.SUBSCRIBERS_DB, auth, body);
  if (action === 'assign') return assignReview(request, env.SUBSCRIBERS_DB, auth, body);
  if (action === 'comment') return commentOnReview(request, env.SUBSCRIBERS_DB, auth, body);
  if (action === 'submit') return transitionReview(request, env.SUBSCRIBERS_DB, auth, body, 'submitted');
  if (action === 'request_evidence') return transitionReview(request, env.SUBSCRIBERS_DB, auth, body, 'evidence_requested');
  if (action === 'approve') return transitionReview(request, env.SUBSCRIBERS_DB, auth, body, 'approved');
  if (action === 'reject') return transitionReview(request, env.SUBSCRIBERS_DB, auth, body, 'rejected');
  return json({ ok: false, error: 'Unknown team review action.' }, 400, request);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: responseHeaders(request) });
}
