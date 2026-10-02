import { verifySplashLensAccount } from '../../lib/splashlens-account-auth.mjs';
import {
  canManageProofPacket,
  ensureProofPacketTables,
  proofPacketHtmlHeaders,
  renderProofPacketHtml,
  validShareId,
} from '../../lib/proof-packets.mjs';

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

function unavailable(status, message) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Proof packet unavailable</title></head><body><main><h1>Proof packet unavailable</h1><p>${message}</p></main></body></html>`;
  return new Response(html, { status, headers: proofPacketHtmlHeaders() });
}

export async function onRequestGet({ env, params }) {
  const shareId = String(params?.shareId || '');
  if (!validShareId(shareId)) return unavailable(404, 'This proof packet link is invalid.');
  if (!env.SUBSCRIBERS_DB) return unavailable(503, 'Proof packet storage is temporarily unavailable.');
  await ensureProofPacketTables(env.SUBSCRIBERS_DB);
  const row = await env.SUBSCRIBERS_DB.prepare(
    `SELECT id, payload, status, expires_at AS expiresAt
     FROM proof_packets WHERE share_id = ? LIMIT 1`,
  ).bind(shareId).first();
  if (!row) return unavailable(404, 'This proof packet was not found.');
  if (row.status === 'revoked') return unavailable(410, 'This proof packet was revoked by its owner.');
  if (row.status !== 'active') return unavailable(410, 'This proof packet is no longer available.');
  if (!row.expiresAt || Date.parse(row.expiresAt) <= Date.now()) {
    await env.SUBSCRIBERS_DB.prepare(
      `UPDATE proof_packets SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'active'`,
    ).bind(row.id).run();
    return unavailable(410, 'This proof packet has expired.');
  }

  let packet;
  try {
    packet = JSON.parse(row.payload);
  } catch {
    return unavailable(500, 'This proof packet could not be rendered safely.');
  }
  return new Response(renderProofPacketHtml(packet, { expiresAt: row.expiresAt }), {
    status: 200,
    headers: proofPacketHtmlHeaders(),
  });
}

export async function onRequestDelete({ request, env, params }) {
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
  const shareId = String(params?.shareId || '');
  if (!validShareId(shareId)) return json({ ok: false, error: 'Valid proof packet share id is required.' }, 400);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Proof packet database is not configured.' }, 503);
  await ensureProofPacketTables(env.SUBSCRIBERS_DB);
  const row = await env.SUBSCRIBERS_DB.prepare(
    'SELECT id, share_id, owner_email, team_id, status FROM proof_packets WHERE share_id = ? LIMIT 1',
  ).bind(shareId).first();
  if (!row) return json({ ok: false, error: 'Proof packet not found.' }, 404);
  if (!(await canManageProofPacket(env.SUBSCRIBERS_DB, row, auth.email))) {
    return json({ ok: false, error: 'Only the packet owner or a team owner/admin can revoke this packet.' }, 403);
  }
  if (row.status !== 'revoked') {
    await env.SUBSCRIBERS_DB.batch([
      env.SUBSCRIBERS_DB.prepare(
        `UPDATE proof_packets SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status != 'revoked'`,
      ).bind(row.id),
      env.SUBSCRIBERS_DB.prepare(
        `INSERT INTO proof_packet_audit (id, proof_packet_id, actor_email, action, details)
         SELECT ?, id, ?, 'revoked', ? FROM proof_packets WHERE id = ? AND status = 'revoked'`,
      ).bind(`proof_audit_${crypto.randomUUID()}`, auth.email, JSON.stringify({ route: 'delete' }), row.id),
    ]);
  }
  return json({ ok: true, proofPacketId: row.id, shareId, status: 'revoked' }, 200);
}
