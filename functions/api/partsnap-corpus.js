import { getPartSnapCorpusSnapshot } from '../_shared/partsnap-corpus.mjs';

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

function authOk(request, env) {
  const secret = String(
    env.SPLASHLENS_STATS_SECRET ||
    env.SPLASHLENS_ADMIN_SECRET ||
    env.SPLASHLENS_ENTITLEMENT_ADMIN_SECRET ||
    '',
  ).trim();
  if (!secret) return false;

  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('X-SplashLens-Stats-Secret') || '';
  return bearer === secret || headerSecret === secret;
}

export async function onRequestGet({ request, env }) {
  if (!authOk(request, env)) return json(401, { ok: false, error: 'Unauthorized' });
  return json(200, getPartSnapCorpusSnapshot());
}
