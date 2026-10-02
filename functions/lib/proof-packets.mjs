import { cleanText } from './splashlens-account-auth.mjs';

export const MAX_PROOF_REQUEST_BYTES = 64 * 1024;
export const MAX_PROOF_PAYLOAD_BYTES = 32 * 1024;
export const MAX_PROOF_EXPIRY_HOURS = 24 * 30;
export const MAX_ACTIVE_PROOF_PACKETS_PER_OWNER = 200;
export const MAX_RETAINED_PROOF_PACKETS_PER_OWNER = 1000;
export const MAX_PROOF_PACKETS_PER_HOUR = 30;

function cleanList(value, maxItems = 20, maxLength = 500) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function cleanRecord(value, maxEntries = 20, maxLength = 240) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, maxEntries)
      .map(([key, item]) => [cleanText(key, 80), cleanText(item, maxLength)])
      .filter(([key, item]) => key && item),
  );
}

export function sanitizeProofPacket(input = {}) {
  const source = input.packet && typeof input.packet === 'object' ? input.packet : input;
  return {
    title: cleanText(source.title || 'SplashLens Service Proof Packet', 140),
    customerLabel: cleanText(source.customerLabel || source.customer || source.pool || '', 140),
    workflow: cleanText(source.workflow || source.visitType || source.type || 'field_stop', 80),
    summary: cleanText(source.summary || source.customerSummary || source.note || '', 2400),
    equipment: cleanRecord(source.equipment, 20, 240),
    readings: cleanRecord(source.readings, 24, 120),
    evidence: cleanList(source.evidence || source.proof || source.photos, 20, 500),
    workPerformed: cleanList(source.workPerformed || source.work, 20, 500),
    recommendations: cleanList(source.recommendations, 20, 500),
    warnings: cleanList(source.warnings || source.risks, 12, 500),
    proofStatus: cleanText(source.proofStatus || source.status || 'saved', 60),
    riskLevel: cleanText(source.riskLevel || source.risk || 'unknown', 40),
    completedAt: cleanText(source.completedAt || source.createdAt || '', 40),
  };
}

export function serializeProofPacket(input) {
  const packet = sanitizeProofPacket(input);
  const serialized = JSON.stringify(packet);
  if (new TextEncoder().encode(serialized).length > MAX_PROOF_PAYLOAD_BYTES) {
    throw new RangeError('Proof packet payload is too large.');
  }
  return { packet, serialized };
}

export function createOpaqueShareId() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function validShareId(value) {
  return /^[A-Za-z0-9_-]{32}$/.test(String(value || ''));
}

export async function ensureProofPacketTables(db) {
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
  await db.prepare(`CREATE TABLE IF NOT EXISTS proof_packet_audit (
    id TEXT PRIMARY KEY,
    proof_packet_id TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_proof_packets_owner ON proof_packets(owner_email, created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_proof_packets_team ON proof_packets(team_id, created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_proof_packets_share ON proof_packets(share_id, status)').run();
}

export async function canManageProofPacket(db, row, email) {
  if (String(row?.owner_email || row?.ownerEmail || '').toLowerCase() === String(email || '').toLowerCase()) return true;
  const teamId = String(row?.team_id || row?.teamId || '').trim();
  if (!teamId) return false;
  const member = await db.prepare(
    `SELECT tm.role, tm.status FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id AND t.status = 'active'
     WHERE tm.team_id = ? AND lower(tm.email) = lower(?) AND tm.status = 'active' LIMIT 1`,
  ).bind(teamId, email).first();
  return Boolean(member && ['owner', 'admin'].includes(String(member.role || '').toLowerCase()));
}

export async function logProofPacketAudit(db, packetId, actorEmail, action, details = {}) {
  await db.prepare(
    `INSERT INTO proof_packet_audit (id, proof_packet_id, actor_email, action, details)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(
    `proof_audit_${crypto.randomUUID()}`,
    packetId,
    cleanText(actorEmail, 180),
    cleanText(action, 80),
    JSON.stringify(details).slice(0, 2000),
  ).run();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderList(title, items) {
  if (!items.length) return '';
  return `<section><h2>${escapeHtml(title)}</h2><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
}

function renderRecord(title, record) {
  const rows = Object.entries(record);
  if (!rows.length) return '';
  return `<section><h2>${escapeHtml(title)}</h2><dl>${rows.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl></section>`;
}

export function renderProofPacketHtml(packetInput, metadata = {}) {
  const packet = sanitizeProofPacket(packetInput);
  const expiry = cleanText(metadata.expiresAt, 40);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml(packet.title)}</title>
<style>body{margin:0;background:#eef7fb;color:#0f172a;font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:780px;margin:auto;padding:28px 18px 48px}header{background:#082f49;color:#fff;padding:22px;border-left:5px solid #14b8a6}h1{font-size:25px;margin:0 0 7px}h2{font-size:16px;margin:0 0 9px}section{background:#fff;border:1px solid #cbd5e1;margin-top:12px;padding:16px}p{margin:0;white-space:pre-wrap}ul{margin:0;padding-left:22px}dl{margin:0}dl div{display:grid;grid-template-columns:minmax(120px,1fr) 2fr;gap:12px;padding:7px 0;border-bottom:1px solid #e2e8f0}dt{font-weight:800}dd{margin:0}.meta{color:#cbd5e1;font-size:12px}.notice{background:#fff7ed;border-color:#fdba74;color:#7c2d12}</style></head>
<body><main class="wrap"><header><h1>${escapeHtml(packet.title)}</h1>${packet.customerLabel ? `<p>${escapeHtml(packet.customerLabel)}</p>` : ''}<p class="meta">Workflow: ${escapeHtml(packet.workflow)}${expiry ? ` | Available until ${escapeHtml(expiry)}` : ''}</p></header>
${packet.summary ? `<section><h2>Customer-safe summary</h2><p>${escapeHtml(packet.summary)}</p></section>` : ''}
${renderRecord('Equipment', packet.equipment)}${renderRecord('Readings', packet.readings)}${renderList('Evidence captured', packet.evidence)}${renderList('Work performed', packet.workPerformed)}${renderList('Recommendations', packet.recommendations)}${renderList('Risk and verification notes', packet.warnings)}
<section class="notice"><h2>Reference boundary</h2><p>Verify repair procedures, part fit, chemical safety, electrical work, and local code requirements with current manufacturer documentation and qualified service judgment.</p></section></main></body></html>`;
}

export function proofPacketHtmlHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}
