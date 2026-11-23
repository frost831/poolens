import { CONSENT_VERSION, groupFor, LEARNING_VERSION, observationFrom, OUTCOMES, ownerHash, PRODUCTS, safeText, signReceipt, verifyReceipt } from '../lib/flagship-learning.mjs';
import { allCases, audit, evaluateProduct, evidenceAllowed, isLearningAdmin, keyMatches, labelAllowed, learningEnabled, learningSecret, productKey, saveFeedback, validLabel } from '../lib/learning-store.mjs';
import { verifySplashLensAccount } from '../lib/splashlens-account-auth.mjs';
import { PARTSNAP_FAMILIES } from '../data/partsnap-source-corpus.mjs';

const MAX_BYTES = 20000;
const origins = new Set(['https://app.splashlens.com', 'https://poolens.pages.dev', 'http://localhost:8788', 'http://127.0.0.1:8788']);
const allowedOrigin = origin => !origin || origins.has(origin) || /^https:\/\/[a-z0-9-]+\.poolens\.pages\.dev$/.test(origin);
function response(request, status, data) {
  const origin = request.headers.get('Origin') || '';
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    ...(allowedOrigin(origin) && origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-SplashLens-Account-Token', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });
}

async function handle({ request, env }) {
  if (!allowedOrigin(request.headers.get('Origin') || '')) return response(request, 403, { ok: false, error: 'Forbidden origin.' });
  const url = new URL(request.url), product = url.searchParams.get('product') || 'splashlens';
  if (!PRODUCTS.includes(product)) return response(request, 400, { ok: false, error: 'Unknown product.' });
  const admin = isLearningAdmin(request, env, product);
  const ingest = keyMatches(request, productKey(env, product, 'INGEST'));
  if (request.method === 'GET') {
    if (!admin) return response(request, 401, { ok: false, error: 'Product owner authorization is required.' });
    if (!learningEnabled(env) || !env.SUBSCRIBERS_DB) return response(request, 503, { ok: false, error: 'Learning pilot is unavailable.' });
    const cases = await allCases(env.SUBSCRIBERS_DB, product);
    const versions = (await env.SUBSCRIBERS_DB.prepare('SELECT id,status,report,created_at FROM learning_versions WHERE product=? ORDER BY created_at DESC LIMIT 20').bind(product).all()).results || [];
    return response(request, 200, { ok: true, product, version: LEARNING_VERSION, consentVersion: CONSENT_VERSION,
      counts: { total: cases.length, pending: cases.filter(c => c.status === 'pending').length, verified: cases.filter(c => c.status === 'verified').length,
        real: cases.filter(c => c.traffic_class === 'real').length },
      // Owner hash is deliberately omitted from the review response.
      labels: product === 'splashlens' ? PARTSNAP_FAMILIES.map(f => ({ id: f.id, name: `${f.manufacturer} / ${f.component} / ${f.modelFamilies.join(', ')}` })) : [],
      cases: cases.slice(-100).reverse().map(({ owner_hash, split, ...c }) => c), versions: versions.map(v => ({ ...v, report: JSON.parse(v.report) })) });
  }
  if (request.method !== 'POST') return response(request, 405, { ok: false, error: 'Method not allowed.' });
  const auth = !admin && !ingest && product === 'splashlens' ? await verifySplashLensAccount(request, env) : null;
  if (!admin && !ingest && !auth?.ok) return response(request, auth?.status || 401, { ok: false, error: auth?.error || 'Product authorization is required.' });
  if (!learningEnabled(env) || !env.SUBSCRIBERS_DB) return response(request, 503, { ok: false, error: 'Learning pilot is unavailable.' });
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return response(request, 415, { ok: false, error: 'JSON is required.' });
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return response(request, 413, { ok: false, error: 'Request is too large.' });
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BYTES) return response(request, 413, { ok: false, error: 'Request is too large.' });
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
  } catch { return response(request, 400, { ok: false, error: 'Valid JSON object is required.' }); }
  const db = env.SUBSCRIBERS_DB, secret = learningSecret(env);
  if (body.action === 'observe') {
    if (!ingest) return response(request, 403, { ok: false, error: 'Product ingestion key is required.' });
    if (product === 'splashlens') return response(request, 403, { ok: false, error: 'SplashLens observations must come from the scanner.' });
    const observation = observationFrom(body.observation);
    if (!observation.brand || !observation.category) return response(request, 400, { ok: false, error: 'Market/brand and category are required.' });
    if (typeof body.id !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(body.id)) return response(request, 400, { ok: false, error: 'An opaque idempotency ID is required.' });
    if (!Array.isArray(body.baseline) || body.baseline.length > 4 || !body.baseline.every(validLabel)) return response(request, 400, { ok: false, error: 'Baseline label IDs are invalid.' });
    // Only trusted adapters can assert production provenance. Sandbox runs stay QA.
    const trafficClass = body.provenance === 'production_confirmed_outcome' ? 'real' : 'qa';
    const receipt = await signReceipt(secret, { id: body.id, product, observation, baseline: body.baseline, group: await groupFor(product, observation),
      owner: await ownerHash(secret, `${product}:adapter`), trafficClass, issuedAt: new Date().toISOString() });
    return response(request, 200, { ok: true, receipt, mode: 'shadow', consentVersion: CONSENT_VERSION });
  }
  if (body.action === 'submit') {
    if (body.consent !== true || body.consentVersion !== CONSENT_VERSION) return response(request, 400, { ok: false, error: 'Current learning consent is required.' });
    if (!OUTCOMES.includes(body.outcome)) return response(request, 400, { ok: false, error: 'Invalid outcome.' });
    const receipt = await verifyReceipt(secret, body.receipt);
    if (!receipt || receipt.product !== product) return response(request, 403, { ok: false, error: 'Valid scan receipt is required.' });
    if (product === 'splashlens' && (!auth?.ok || receipt.owner !== await ownerHash(secret, auth.email))) return response(request, 403, { ok: false, error: 'This scan belongs to a different account.' });
    if (product !== 'splashlens' && !ingest) return response(request, 403, { ok: false, error: 'Product ingestion key is required.' });
    const saved = await saveFeedback(db, receipt, { outcome: body.outcome, note: safeText(body.note, 500), reportedLabel: safeText(body.reportedLabel, 100) });
    if (saved.limited) return response(request, 429, { ok: false, error: 'Feedback limit reached. Try again later.' });
    return response(request, saved.duplicate ? 200 : 201, { ok: true, ticketId: saved.id, status: 'pending', duplicate: saved.duplicate });
  }
  if (body.action === 'forget') {
    if (!auth?.ok || product !== 'splashlens') return response(request, 403, { ok: false, error: 'Account authorization is required.' });
    const hash = await ownerHash(secret, auth.email);
    await db.batch([
      db.prepare('DELETE FROM learning_cases WHERE product=? AND owner_hash=?').bind(product, hash),
      // Snapshots can contain this account's examples. Retire and redact all
      // snapshots atomically; the next evaluation rebuilds from remaining data.
      db.prepare("UPDATE learning_versions SET status='retired',knowledge='[]',report='{}' WHERE product=?").bind(product),
      db.prepare('INSERT INTO learning_audit(id,product,action,subject_id) VALUES(?,?,?,?)').bind(`la_${crypto.randomUUID()}`, product, 'withdrawn', 'account-contributions'),
    ]);
    return response(request, 200, { ok: true, status: 'deleted' });
  }
  if (!admin) return response(request, 403, { ok: false, error: 'Product owner authorization is required.' });
  if (body.action === 'review') {
    if (!['verified', 'rejected'].includes(body.status)) return response(request, 400, { ok: false, error: 'Invalid review status.' });
    if (body.status === 'verified' && (!Object.hasOwn(body, 'expectedLabel') || !labelAllowed(product, body.expectedLabel)
      || !evidenceAllowed(product, body.evidenceUrl, body.evidenceKind))) return response(request, 400, { ok: false, error: 'A valid label (or null for abstention) and approved evidence source are required.' });
    const reviewedAt = new Date().toISOString();
    const result = await db.batch([
      db.prepare(`UPDATE learning_cases SET status=?,expected_label=?,evidence_url=?,evidence_kind=?,reviewed_at=? WHERE product=? AND id=? AND status='pending'`)
        .bind(body.status, body.status === 'verified' ? body.expectedLabel : null, body.evidenceUrl || '', body.evidenceKind || '', reviewedAt, product, String(body.id || '')),
      db.prepare('INSERT OR IGNORE INTO learning_audit(id,product,action,subject_id) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM learning_cases WHERE product=? AND id=? AND reviewed_at=?)')
        .bind(`review_${body.id}`, product, body.status, String(body.id || ''), product, String(body.id || ''), reviewedAt),
    ]);
    if (!result[0].meta?.changes) return response(request, 409, { ok: false, error: 'Case is missing or already reviewed.' });
    return response(request, 200, { ok: true, status: body.status });
  }
  if (body.action === 'evaluate') return response(request, 201, { ok: true, ...await evaluateProduct(db, product) });
  if (body.action === 'promote') {
    const version = await db.prepare('SELECT * FROM learning_versions WHERE id=? AND product=?').bind(String(body.id || ''), product).first();
    if (!version || version.status !== 'candidate') return response(request, 409, { ok: false, error: 'Candidate version not found.' });
    const report = JSON.parse(version.report);
    if (!report.promotable || report.version !== LEARNING_VERSION) return response(request, 409, { ok: false, error: 'Candidate has not passed the real holdout gate.', reasons: report.reasons });
    // External products remain shadow-only until their own adapter release gate.
    if (product !== 'splashlens') return response(request, 409, { ok: false, error: 'This product adapter is shadow-only.' });
    await db.batch([
      db.prepare("UPDATE learning_versions SET status='retired' WHERE product=? AND status='active' AND EXISTS(SELECT 1 FROM learning_versions WHERE id=? AND status='candidate')").bind(product, version.id),
      db.prepare("UPDATE learning_versions SET status='active' WHERE id=? AND product=? AND status='candidate'").bind(version.id, product),
    ]);
    await audit(db, product, 'promoted', version.id);
    return response(request, 200, { ok: true, activeVersion: version.id });
  }
  if (body.action === 'rollback') {
    await db.prepare("UPDATE learning_versions SET status='retired' WHERE product=? AND status='active'").bind(product).run();
    await audit(db, product, 'rolled_back', product);
    return response(request, 200, { ok: true, mode: 'shadow' });
  }
  return response(request, 400, { ok: false, error: 'Unknown action.' });
}

async function guarded(context) {
  try { return await handle(context); }
  catch (error) {
    const validation = /equipment or category|Pilot cohort|cohort changed/.test(error.message || '');
    return response(context.request, validation ? 400 : 503, { ok: false, error: validation ? error.message : 'Learning storage is unavailable. Your scan still works.' });
  }
}
export const onRequestGet = guarded;
export const onRequestPost = guarded;
export const onRequestPut = guarded;
export async function onRequestOptions({ request }) {
  return response(request, allowedOrigin(request.headers.get('Origin') || '') ? 200 : 403, { ok: allowedOrigin(request.headers.get('Origin') || '') });
}
