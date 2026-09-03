// /api/team - protected passwordless team workspace API for SplashLens.
// Env: SUBSCRIBERS_DB, SPLASHLENS_PROFILE_SECRET or SPLASHLENS_ENTITLEMENT_SECRET, optional SENDGRID_API_KEY/SENDGRID_FROM.

const DEFAULT_ORIGIN = 'https://app.splashlens.com';
const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1';
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

function profileSecret(env) {
  const secret = String(env.SPLASHLENS_PROFILE_SECRET || env.SPLASHLENS_ENTITLEMENT_SECRET || env.SCAN_ENTITLEMENT_SECRET || '').trim();
  return secret.length >= 32 ? secret : '';
}

function tokenFromRequest(request) {
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
  const token = tokenFromRequest(request);
  if (!token) return { ok: false, status: 401, error: 'Sign in with your SplashLens email before using team workspaces.' };

  const secret = profileSecret(env);
  if (!secret) return { ok: false, status: 503, error: 'Team account verification is not configured.' };

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

  return { ok: true, email: payload.sub.toLowerCase() };
}

async function ensureTeamTables(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS user_accounts (
      email TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      role TEXT,
      source_feature TEXT,
      first_client_id TEXT,
      last_client_id TEXT,
      first_path TEXT,
      last_path TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      verified_at DATETIME,
      account_token_last_issued_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      joined_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (team_id, email)
    )`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS team_invites (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      invited_by TEXT NOT NULL,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
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
    )`
  ).run();
}

async function all(db, sql, ...bindings) {
  const result = await db.prepare(sql).bind(...bindings).all();
  return result.results || [];
}

async function first(db, sql, ...bindings) {
  return (await db.prepare(sql).bind(...bindings).first()) || {};
}

async function logEvent(db, request, event, actorEmail, props = {}) {
  await db.prepare(
    `INSERT INTO events (event, source, path, plan, mode, props, user_agent, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    event,
    'app',
    clean(props.path || '/api/team', 300),
    'team_workspace',
    clean(props.action || 'team', 80),
    JSON.stringify({ ...props, actor_email: actorEmail, identity_source: 'passwordless_account' }).slice(0, 2400),
    clean(request.headers.get('User-Agent'), 300),
    clean(request.headers.get('Referer'), 500),
    clean(request.cf && request.cf.country, 10),
  ).run();
}

function parseSender(value) {
  const raw = clean(value || 'hello@splashlens.com', 220);
  const match = raw.match(/^(.*?)<([^>]+)>$/);
  const email = normalizeEmail(match ? match[2] : raw) || 'hello@splashlens.com';
  const name = clean(match ? match[1] : 'SplashLens', 80).replace(/^"|"$/g, '') || 'SplashLens';
  return { email, name };
}

async function sendInviteEmail(env, teamName, invitedEmail, invitedBy) {
  const apiKey = String(env.SENDGRID_API_KEY || '').trim();
  if (!apiKey) return { sent: false, error: 'SENDGRID_API_KEY is not configured.' };
  const from = parseSender(env.SENDGRID_FROM || env.SPLASHLENS_EMAIL_FROM || 'hello@splashlens.com');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: invitedEmail }] }],
      from,
      subject: `SplashLens team invite: ${teamName}`,
      content: [{
        type: 'text/plain',
        value: [
          `${invitedBy} invited you to the SplashLens team workspace "${teamName}".`,
          '',
          'Open SplashLens, verify this same email, then tap Account to accept the pending invite:',
          'https://app.splashlens.com/?tab=scan',
          '',
          'Manual lookup stays free. Team workspaces are for shared proof, scanner visibility, and crew workflow tracking as those paid layers roll out.',
          '',
          'Talk Soon,',
          'SplashLens',
        ].join('\n'),
      }],
    }),
  });
  if (!response.ok) return { sent: false, error: `SendGrid returned ${response.status}` };
  return { sent: true };
}

async function teamSnapshot(db, email) {
  const teams = await all(db, `
    SELECT t.id, t.name, t.owner_email AS ownerEmail, t.status, tm.role, tm.status AS memberStatus, tm.joined_at AS joinedAt, t.created_at AS createdAt
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.email = ? AND tm.status IN ('active', 'pending')
    ORDER BY t.created_at DESC
  `, email);
  const pendingInvites = await all(db, `
    SELECT i.id, i.team_id AS teamId, i.email, i.role, i.status, i.invited_by AS invitedBy, i.expires_at AS expiresAt, i.created_at AS createdAt, t.name AS teamName
    FROM team_invites i
    LEFT JOIN teams t ON t.id = i.team_id
    WHERE i.email = ? AND i.status = 'pending' AND (i.expires_at IS NULL OR i.expires_at > datetime('now'))
    ORDER BY i.created_at DESC
  `, email);
  return { teams, pendingInvites };
}

async function createTeam(request, env, db, auth, body, headers) {
  const name = clean(body.name || body.teamName || body.company || 'SplashLens Team', 80);
  if (!name) return json({ ok: false, error: 'Team name is required.' }, 400, headers);
  const id = `team_${crypto.randomUUID()}`;
  await db.prepare('INSERT INTO teams (id, name, owner_email) VALUES (?, ?, ?)').bind(id, name, auth.email).run();
  await db.prepare(
    `INSERT INTO team_members (team_id, email, role, status, joined_at)
     VALUES (?, ?, 'owner', 'active', CURRENT_TIMESTAMP)
     ON CONFLICT(team_id, email) DO UPDATE SET role = 'owner', status = 'active', joined_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`
  ).bind(id, auth.email).run();
  await logEvent(db, request, 'team_workspace_created', auth.email, { action: 'create_team', team_id: id, team_name: name });
  return json({ ok: true, team: { id, name, ownerEmail: auth.email, role: 'owner', status: 'active' }, ...(await teamSnapshot(db, auth.email)) }, 200, headers);
}

async function requireTeamAdmin(db, teamId, email) {
  const member = await first(db, `
    SELECT role, status FROM team_members
    WHERE team_id = ? AND email = ? AND status = 'active'
  `, teamId, email);
  return member.status === 'active' && ['owner', 'admin'].includes(String(member.role || '').toLowerCase());
}

async function inviteMember(request, env, db, auth, body, headers) {
  const teamId = clean(body.teamId || body.team_id, 120);
  const email = normalizeEmail(body.email || body.memberEmail || body.inviteEmail);
  const role = clean(body.role || 'member', 40).toLowerCase();
  if (!teamId) return json({ ok: false, error: 'Team is required.' }, 400, headers);
  if (!email) return json({ ok: false, error: 'Valid invite email is required.' }, 400, headers);
  if (!['member', 'admin'].includes(role)) return json({ ok: false, error: 'Role must be member or admin.' }, 400, headers);
  if (!(await requireTeamAdmin(db, teamId, auth.email))) return json({ ok: false, error: 'Only team owners or admins can invite members.' }, 403, headers);
  const team = await first(db, 'SELECT id, name FROM teams WHERE id = ? AND status = "active"', teamId);
  if (!team.id) return json({ ok: false, error: 'Team not found.' }, 404, headers);
  const existingMember = await first(db, 'SELECT status FROM team_members WHERE team_id = ? AND email = ?', teamId, email);
  if (existingMember.status === 'active') return json({ ok: false, error: 'That email is already an active team member.' }, 409, headers);
  const inviteId = `invite_${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(
    `INSERT INTO team_invites (id, team_id, email, role, status, invited_by, expires_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`
  ).bind(inviteId, teamId, email, role, auth.email, expiresAt).run();
  await db.prepare(
    `INSERT INTO team_members (team_id, email, role, status)
     VALUES (?, ?, ?, 'pending')
     ON CONFLICT(team_id, email) DO UPDATE SET role = excluded.role, status = 'pending', updated_at = CURRENT_TIMESTAMP`
  ).bind(teamId, email, role).run();
  const emailResult = await sendInviteEmail(env, team.name, email, auth.email);
  await logEvent(db, request, 'team_member_invited', auth.email, {
    action: 'invite_member',
    team_id: teamId,
    invited_email: email,
    member_role: role,
    invite_email_sent: emailResult.sent,
    invite_email_error: emailResult.sent ? '' : emailResult.error,
  });
  return json({ ok: true, invite: { id: inviteId, teamId, email, role, status: 'pending', expiresAt }, emailSent: emailResult.sent, emailError: emailResult.sent ? '' : emailResult.error }, 200, headers);
}

async function acceptInvite(request, db, auth, body, headers) {
  const inviteId = clean(body.inviteId || body.invite_id, 140);
  const invite = inviteId
    ? await first(db, 'SELECT id, team_id AS teamId, email, role, status FROM team_invites WHERE id = ? AND email = ? AND status = "pending"', inviteId, auth.email)
    : await first(db, 'SELECT id, team_id AS teamId, email, role, status FROM team_invites WHERE email = ? AND status = "pending" ORDER BY created_at DESC LIMIT 1', auth.email);
  if (!invite.id) return json({ ok: false, error: 'No pending SplashLens team invite found for this email.' }, 404, headers);
  await db.prepare('UPDATE team_invites SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(invite.id).run();
  await db.prepare(
    `INSERT INTO team_members (team_id, email, role, status, joined_at)
     VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
     ON CONFLICT(team_id, email) DO UPDATE SET role = excluded.role, status = 'active', joined_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`
  ).bind(invite.teamId, auth.email, invite.role || 'member').run();
  await logEvent(db, request, 'team_member_joined', auth.email, { action: 'accept_invite', team_id: invite.teamId, invite_id: invite.id });
  return json({ ok: true, accepted: true, inviteId: invite.id, teamId: invite.teamId, ...(await teamSnapshot(db, auth.email)) }, 200, headers);
}

async function archiveTeam(request, db, auth, body, headers) {
  const teamId = clean(body.teamId || body.team_id, 120);
  if (!teamId) return json({ ok: false, error: 'Team is required.' }, 400, headers);
  const team = await first(db, 'SELECT id, owner_email AS ownerEmail FROM teams WHERE id = ? AND status = "active"', teamId);
  if (!team.id) return json({ ok: false, error: 'Team not found.' }, 404, headers);
  if (String(team.ownerEmail || '').toLowerCase() !== auth.email) {
    return json({ ok: false, error: 'Only the team owner can archive this workspace.' }, 403, headers);
  }
  await db.prepare('UPDATE teams SET status = "archived", updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(teamId).run();
  await db.prepare('UPDATE team_members SET status = "archived", updated_at = CURRENT_TIMESTAMP WHERE team_id = ?').bind(teamId).run();
  await db.prepare('UPDATE team_invites SET status = "archived", updated_at = CURRENT_TIMESTAMP WHERE team_id = ? AND status = "pending"').bind(teamId).run();
  await logEvent(db, request, 'team_workspace_archived', auth.email, { action: 'archive_team', team_id: teamId });
  return json({ ok: true, archived: true, teamId, ...(await teamSnapshot(db, auth.email)) }, 200, headers);
}

export async function onRequestGet({ request, env }) {
  const headers = corsHeaders(request);
  const auth = await verifyAccountToken(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status || 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Team database is not configured.' }, 503, headers);
  await ensureTeamTables(env.SUBSCRIBERS_DB);
  return json({ ok: true, email: auth.email, ...(await teamSnapshot(env.SUBSCRIBERS_DB, auth.email)) }, 200, headers);
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request);
  const auth = await verifyAccountToken(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status || 401, headers);
  if (!env.SUBSCRIBERS_DB) return json({ ok: false, error: 'Team database is not configured.' }, 503, headers);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Valid JSON is required.' }, 400, headers);
  }

  await ensureTeamTables(env.SUBSCRIBERS_DB);
  const action = clean(body.action || body.intent || 'snapshot', 50).toLowerCase();
  if (action === 'create_team' || action === 'create') return createTeam(request, env, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'invite_member' || action === 'invite') return inviteMember(request, env, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'accept_invite' || action === 'accept') return acceptInvite(request, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'archive_team' || action === 'archive') return archiveTeam(request, env.SUBSCRIBERS_DB, auth, body, headers);
  if (action === 'snapshot' || action === 'list') return json({ ok: true, email: auth.email, ...(await teamSnapshot(env.SUBSCRIBERS_DB, auth.email)) }, 200, headers);
  return json({ ok: false, error: 'Unknown team action.' }, 400, headers);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
