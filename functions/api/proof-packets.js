import { cleanText, verifySplashLensAccount } from '../lib/splashlens-account-auth.mjs';
import {
  MAX_PROOF_EXPIRY_HOURS,
  MAX_ACTIVE_PROOF_PACKETS_PER_OWNER,
  MAX_RETAINED_PROOF_PACKETS_PER_OWNER,
  MAX_PROOF_PACKETS_PER_HOUR,
  MAX_PROOF_REQUEST_BYTES,
  canManageProofPacket,
  createOpaqueShareId,
  ensureProofPacketTables,
  serializeProofPacket,
  validShareId,
} from '../lib/proof-packets.mjs';

const ALLOWED_ORIGINS = new Set([
  'https://app.splashlens.com',
  'https://splashlens.com',
  'https://www.splashlens.com',
  'https://poolens.pages.dev',
]);

function headers(request) {
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
  return new Response(JSON.stringify(data), { status, headers: headers(request) });
}

async function parseBoundedJson(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_PROOF_REQUEST_BYTES) throw new RangeError('Proof packet request is too large.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_PROOF_REQUEST_BYTES) throw new RangeError('Proof packet request is too large.');
  return JSON.parse(text || '{}');
}

async function requireTeamMember(db, teamId, email) {
  if (!teamId) return true;
  const row = await db.prepare(
    `SELECT tm.status FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id AND t.status = 'active'
     WHERE tm.team_id = ? AND lower(tm.email) = lower(?) AND tm.status = 'active' LIMIT 1`,
  ).bind(teamId, email).first();
  return Boolean(row && row.status === 'active');
}

async function createPacket(request, env, auth, body) {
  const teamId = cleanText(body.teamId || body.team_id, 140);
  if (!(await requireTeamMember(env.SUBSCRIBERS_DB, teamId, auth.email))) {
    return json({ ok: false, error: 'That team proof packet is not available to this account.' }, 403, request);
  }
  await env.SUBSCRIBERS_DB.prepare(
    `UPDATE proof_packets SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active' AND expires_at <= CURRENT_TIMESTAMP`,
  ).run();
  const quota = await env.SUBSCRIBERS_DB.prepare(
    `SELECT COUNT(*) AS retainedCount,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeCount,
            SUM(CASE WHEN created_at >= datetime('now', '-1 hour') THEN 1 ELSE 0 END) AS recentCount
     FROM proof_packets WHERE lower(owner_email) = lower(?)`,
  ).bind(auth.email).first();
  if (Number(quota?.retainedCount || 0) >= MAX_RETAINED_PROOF_PACKETS_PER_OWNER) {
    return json({ ok: false, error: 'Proof packet storage limit reached. Contact SplashLens before creating more records.' }, 429, request);
  }
  if (Number(quota?.activeCount || 0) >= MAX_ACTIVE_PROOF_PACKETS_PER_OWNER) {
    return json({ ok: false, error: 'Active proof packet limit reached. Revoke or let older packets expire before creating another.' }, 429, request);
  }
  if (Number(quota?.recentCount || 0) >= MAX_PROOF_PACKETS_PER_HOUR) {
    return json({ ok: false, error: 'Proof packet creation is temporarily rate limited. Try again later.' }, 429, request);
  }

  let packetData;
  try {
    packetData = serializeProofPacket(body.packet || body.payload || body);
  } catch (error) {
    return json({ ok: false, error: error.message || 'Proof packet payload is invalid.' }, error instanceof RangeError ? 413 : 400, request);
  }

  const requestedHours = Number(body.expiresInHours || body.expiryHours || 24 * 7);
  const expiresInHours = Math.max(1, Math.min(MAX_PROOF_EXPIRY_HOURS, Number.isFinite(requestedHours) ? requestedHours : 24 * 7));
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  const id = `proof_${crypto.randomUUID()}`;
  const shareId = createOpaqueShareId();

  const auditId = `proof_audit_${crypto.randomUUID()}`;
  await env.SUBSCRIBERS_DB.batch([
    env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO proof_packets (id, share_id, owner_email, team_id, payload, status, expires_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    ).bind(id, shareId, auth.email, teamId, packetData.serialized, expiresAt),
    env.SUBSCRIBERS_DB.prepare(
      `INSERT INTO proof_packet_audit (id, proof_packet_id, actor_email, action, details)
       VALUES (?, ?, ?, 'created', ?)`,
    ).bind(auditId, id, auth.email, JSON.stringify({ teamId, expiresAt }).slice(0, 2000)),
  ]);

  const origin = new URL(request.url).origin;
  return json({
    ok: true,
    proofPacketId: id,
    shareId,
    shareUrl: `${origin}/api/proof-packets/${shareId}`,
    expiresAt,
    status: 'active',
  }, 201, request);
}

async function revokePacket(request, env, auth, body) {
  const shareId = cleanText(body.shareId || body.share_id, 80);
  if (!validShareId(shareId)) return json({ ok: false, error: 'Valid proof packet share id is required.' }, 400, request);
  const row = await env.SUBSCRIBERS_DB.prepare(
    'SELECT id, share_id, owner_email, team_id, status FROM proof_packets WHERE share_id = ? LIMIT 1',
  ).bind(shareId).first();
  if (!row) return json({ ok: false, error: 'Proof packet not found.' }, 404, request);
  if (!(await canManageProofPacket(env.SUBSCRIBERS_DB, row, auth.email))) {
    return json({ ok: false, error: 'Only the packet owner or a team owner/admin can revoke this packet.' }, 403, request);
  }
  if (row.status !== 'revoked') {
    const auditId = `proof_audit_${crypto.randomUUID()}`;
    await env.SUBSCRIBERS_DB.batch([
      env.SUBSCRIBERS_DB.prepare(
        `UPDATE proof_packets SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status != 'revoked'`,
      ).bind(row.id),
      env.SUBSCRIBERS_DB.prepare(
        `INSERT INTO proof_packet_audit (id, proof_packet_id, actor_email, action, details)
         SELECT ?, id, ?, 'revoked', '{}' FROM proof_packets WHERE id = ? AND status = 'revoked'`,
      ).bind(auditId, auth.email, row.id),
    ]);
  }
  return json({ ok: true, proofPacketId: row.id, shareId, status: 'revoked' }, 200, request);
}

export async function onRequestGet({ request, env }) {
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, request);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Proof packet database is not configured.' }, 503, request);
  await ensureProofPacketTables(env.SUBSCRIBERS_DB);
  const result = await env.SUBSCRIBERS_DB.prepare(
    `SELECT id, share_id AS shareId, team_id AS teamId, status, expires_at AS expiresAt, created_at AS createdAt
     FROM proof_packets p
     WHERE lower(owner_email) = lower(?)
        OR EXISTS (
          SELECT 1 FROM team_members tm
          INNER JOIN teams t ON t.id = tm.team_id AND t.status = 'active'
          WHERE tm.team_id = p.team_id AND lower(tm.email) = lower(?) AND tm.status = 'active'
        )
     ORDER BY created_at DESC LIMIT 100`,
  ).bind(auth.email, auth.email).all();
  const origin = new URL(request.url).origin;
  const packets = (result?.results || []).map((row) => ({
    ...row,
    shareUrl: `${origin}/api/proof-packets/${row.shareId}`,
  }));
  return json({ ok: true, packets }, 200, request);
}

export async function onRequestPost({ request, env }) {
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, request);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Proof packet database is not configured.' }, 503, request);
  await ensureProofPacketTables(env.SUBSCRIBERS_DB);

  let body;
  try {
    body = await parseBoundedJson(request);
  } catch (error) {
    return json({ ok: false, error: error instanceof RangeError ? error.message : 'Valid JSON is required.' }, error instanceof RangeError ? 413 : 400, request);
  }
  const action = cleanText(body.action || 'create', 40).toLowerCase();
  if (action === 'create') return createPacket(request, env, auth, body);
  if (action === 'revoke') return revokePacket(request, env, auth, body);
  return json({ ok: false, error: 'Unknown proof packet action.' }, 400, request);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: headers(request) });
}
