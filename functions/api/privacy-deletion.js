import { normalizeEmail, verifySplashLensAccount } from '../lib/splashlens-account-auth.mjs';

const MAX_BODY_BYTES = 4096;
const PROCESSING_DAYS = 30;

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function publicRequest(row) {
  return { requestId: row.id, scope: row.scope, status: row.status, requestedAt: row.requested_at, expectedBy: row.expected_by };
}

async function notifyOperator(env, row) {
  const key = String(env.SENDGRID_API_KEY || '').trim();
  if (!key) return false;
  const sender = String(env.SENDGRID_FROM || 'hello@splashlens.com');
  const from = normalizeEmail(sender.match(/<([^>]+)>/)?.[1] || sender) || 'hello@splashlens.com';
  const to = normalizeEmail(env.SPLASHLENS_NOTIFY_TO) || 'hello@splashlens.com';
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: 'SplashLens' },
      subject: `SplashLens verified ${row.scope} deletion request ${row.id}`,
      content: [{ type: 'text/plain', value: [
        `Request: ${row.id}`, `Verified account: ${row.email}`, `Scope: ${row.scope}`,
        `Received: ${row.requested_at}`, `Complete and confirm by: ${row.expected_by}`,
        'This is a verified in-app deletion request, not a completed deletion.',
        'Remove the requested account and associated personal data, or requested saved content/activity for data-only requests.',
        'Include user-owned shared proof content. Retain only records legally required, and explain any retained data and period to the person.',
        'Do not cancel billing or delete other team members\' accounts. Confirm completion to the verified email, then remove the request\'s personal data.',
      ].join('\n') }],
    }),
  });
  return response.ok;
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reply({ ok: false, error: 'Use the SplashLens deletion form.' }, 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return reply({ ok: false, error: 'JSON is required.' }, 415);
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return reply({ ok: false, error: auth.error }, auth.status);
  let body;
  try { body = await readBody(request); }
  catch (error) { return reply({ ok: false, error: 'Invalid deletion request.' }, error.message === 'size' ? 413 : 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || !['account', 'data'].includes(body.scope) || body.confirmation !== 'DELETE' || 'email' in body) {
    return reply({ ok: false, error: 'Choose a deletion scope and type DELETE to confirm. The account comes from your verified sign-in.' }, 400);
  }
  if (!env.SUBSCRIBERS_DB) return reply({ ok: false, error: 'Deletion requests are temporarily unavailable.' }, 503);
  try {
    const db = env.SUBSCRIBERS_DB;
    // Additive intake only. No existing account/content table is changed or erased here.
    await db.prepare(`CREATE TABLE IF NOT EXISTS privacy_deletion_requests (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, scope TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested', requested_at TEXT NOT NULL,
      expected_by TEXT NOT NULL, notified_at TEXT, UNIQUE(email, scope)
    )`).run();
    const now = new Date();
    await db.prepare(`INSERT INTO privacy_deletion_requests (id, email, scope, requested_at, expected_by)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(email, scope) DO NOTHING`).bind(
      crypto.randomUUID(), auth.email, body.scope, now.toISOString(),
      new Date(now.getTime() + PROCESSING_DAYS * 86400000).toISOString(),
    ).run();
    const row = await db.prepare('SELECT * FROM privacy_deletion_requests WHERE email = ? AND scope = ?').bind(auth.email, body.scope).first();
    if (!row) throw new Error('missing request');
    if (!row.notified_at) {
      let sent = false;
      try { sent = await notifyOperator(env, row); } catch { /* Keep the durable request for a safe retry. */ }
      if (!sent) return reply({ ok: false, requestId: row.id, error: 'Your request was saved, but delivery to the privacy team failed. Please retry this form; it will reuse your request.' }, 503);
      await db.prepare('UPDATE privacy_deletion_requests SET notified_at = ? WHERE id = ?').bind(new Date().toISOString(), row.id).run();
    }
    return reply({ ok: true, ...publicRequest(row), processingDays: PROCESSING_DAYS });
  } catch {
    return reply({ ok: false, error: 'We could not confirm your deletion request. Please retry this form.' }, 503);
  }
}
