import { buildKnowledge, CONSENT_VERSION, evaluateLearning, groupFor, LEARNING_VERSION, observationFrom, ownerHash, PRODUCTS, retrieveLearned, signReceipt, splitFor } from './flagship-learning.mjs';
import { verifySplashLensAccount } from './splashlens-account-auth.mjs';
import { PARTSNAP_FAMILIES, PARTSNAP_SOURCES } from '../data/partsnap-source-corpus.mjs';

export const learningSecret = env => String(env.FLAGSHIP_LEARNING_SIGNING_SECRET || env.SPLASHLENS_STATS_SECRET || env.SPLASHLENS_ADMIN_SECRET || '');
export const learningEnabled = env => env.FLAGSHIP_LEARNING_ENABLED === 'true';
export const validLabel = label => typeof label === 'string' && /^[a-z0-9][a-z0-9_-]{1,100}$/.test(label);
export const productKey = (env, product, kind) => String(env[`FLAGSHIP_LEARNING_${product.toUpperCase()}_${kind}_KEY`] || '');

export function keyMatches(request, expected) {
  if (expected.length < 32) return false;
  const received = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
}

export function isLearningAdmin(request, env, product) {
  return keyMatches(request, productKey(env, product, 'ADMIN')) || (product === 'splashlens' && keyMatches(request, learningSecret(env)));
}

export async function issueSplashLearning(request, env, result, scanId, trafficClass) {
  if (!learningEnabled(env) || !env.SUBSCRIBERS_DB) return null;
  const auth = await verifySplashLensAccount(request, env);
  if (!auth.ok) return null;
  const secret = learningSecret(env);
  const observation = observationFrom({ brand: result.manufacturer, model: result.model, component: result.component, category: result.category, terms: result.searchTerms });
  const baseline = (result.corpusCandidates || []).map(c => c.id).slice(0, 4);
  const group = await groupFor('splashlens', observation);
  const receipt = await signReceipt(secret, { id: scanId, product: 'splashlens', observation, baseline, group,
    owner: await ownerHash(secret, auth.email), trafficClass, issuedAt: new Date().toISOString() });
  // Frozen, promoted knowledge only. Candidate knowledge is evaluated separately.
  let active = null;
  try { active = await env.SUBSCRIBERS_DB.prepare("SELECT id, knowledge FROM learning_versions WHERE product='splashlens' AND status='active' LIMIT 1").first(); } catch { /* scan still works before migration */ }
  const guidance = active ? retrieveLearned(observation, JSON.parse(active.knowledge)) : [];
  return { version: LEARNING_VERSION, consentVersion: CONSENT_VERSION, receipt, mode: active ? 'active' : 'shadow', activeVersion: active?.id || null,
    candidates: guidance.map(c => ({ ...c, name: PARTSNAP_FAMILIES.find(f => f.id === c.label)?.component || c.label, exactFitmentConfirmed: false })) };
}

export async function allCases(db, product) {
  // Oldest first gives a stable frozen cohort; never silently truncate evaluation.
  const count = await db.prepare('SELECT COUNT(*) AS n FROM learning_cases WHERE product=?').bind(product).first();
  if (Number(count?.n) > 10000) throw new Error('Pilot cohort exceeds 10000 cases. Freeze and export a cohort before evaluation.');
  return (await db.prepare('SELECT * FROM learning_cases WHERE product=? ORDER BY created_at,id LIMIT 10000').bind(product).all()).results || [];
}

export function evidenceAllowed(product, url, kind) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search) return false;
    if (product === 'splashlens') {
      const sources = Object.values(PARTSNAP_SOURCES).map(s => new URL(s.url));
      // Preserve precise manual-page citations only when that entire URL is
      // explicitly in the reviewed corpus. Arbitrary fragments remain forbidden.
      if (parsed.hash && !sources.some(source => source.href === parsed.href)) return false;
      const hosts = new Set(sources.map(source => source.hostname));
      return kind === 'manufacturer_reference' && hosts.has(parsed.hostname);
    }
    return !parsed.hash && product === 'throttleshare' && kind === 'confirmed_outcome' && ['throttleshare.com', 'www.throttleshare.com'].includes(parsed.hostname);
  } catch { return false; }
}

export async function audit(db, product, action, subjectId) {
  return db.prepare('INSERT INTO learning_audit(id,product,action,subject_id) VALUES(?,?,?,?)')
    .bind(`la_${crypto.randomUUID()}`, product, action, subjectId).run();
}

export async function evaluateProduct(db, product) {
  if (!PRODUCTS.includes(product)) throw new Error('Unknown product.');
  const revision = Number((await db.prepare('SELECT COUNT(*) AS n FROM learning_audit WHERE product=?').bind(product).first())?.n || 0);
  const cases = await allCases(db, product), knowledge = buildKnowledge(cases);
  const report = evaluateLearning(cases, knowledge);
  const id = `lv_${crypto.randomUUID()}`;
  const result = await db.batch([
    db.prepare("INSERT INTO learning_versions(id,product,knowledge,report,status) SELECT ?,?,?,?,'candidate' WHERE (SELECT COUNT(*) FROM learning_audit WHERE product=?)=?").bind(id, product, JSON.stringify(knowledge), JSON.stringify(report), product, revision),
    db.prepare('INSERT INTO learning_audit(id,product,action,subject_id) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM learning_versions WHERE id=?)').bind(`la_${crypto.randomUUID()}`, product, 'evaluated', id, id),
  ]);
  if (!result[0].meta?.changes) throw new Error('Learning cohort changed during evaluation. Run it again.');
  return { id, report };
}

export function labelAllowed(product, label) {
  return label === null || (validLabel(label) && (product !== 'splashlens' || PARTSNAP_FAMILIES.some(f => f.id === label)));
}

export async function saveFeedback(db, receipt, { outcome, note, reportedLabel }) {
  const existing = await db.prepare('SELECT id FROM learning_cases WHERE product=? AND receipt_id=?').bind(receipt.product, receipt.id).first();
  if (existing) return { id: existing.id, duplicate: true };
  const id = `lc_${crypto.randomUUID()}`;
  const result = await db.prepare(`INSERT OR IGNORE INTO learning_cases
    (id,product,receipt_id,owner_hash,group_key,split,observation,baseline,outcome,note,reported_label,traffic_class,consent_version)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?
    WHERE (SELECT COUNT(*) FROM learning_cases WHERE product=? AND owner_hash=? AND created_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 hour')) < 20`)
    .bind(id, receipt.product, receipt.id, receipt.owner, receipt.group, splitFor(receipt.group), JSON.stringify(receipt.observation), JSON.stringify(receipt.baseline), outcome, note, reportedLabel,
      receipt.trafficClass, CONSENT_VERSION, receipt.product, receipt.owner).run();
  if (!result.meta?.changes) {
    const duplicate = await db.prepare('SELECT id FROM learning_cases WHERE product=? AND receipt_id=?').bind(receipt.product, receipt.id).first();
    return duplicate ? { id: duplicate.id, duplicate: true } : { limited: true };
  }
  return { id, duplicate: false };
}
