// Portable policy/retrieval core. Product adapters own their baseline and labels.
export const LEARNING_VERSION = 'flagship-learning-v1';
export const CONSENT_VERSION = 'equipment-feedback-2026-11-23';
export const PRODUCTS = Object.freeze(['splashlens', 'throttleshare', 'scanmyride', 'grainbrief', 'hyperpulse', 'ruckmode', 'bay2course']);
export const OUTCOMES = Object.freeze(['helpful', 'saved_time', 'wrong', 'missing', 'confirmed']);
export const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const encoder = new TextEncoder();

export function safeText(value, max = 200) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f<>@]/.test(value)
    || /\b(?:https?:|www\.|\d{3}[-. ]\d{3}[-. ]\d{4})/i.test(value)) throw new Error('Use equipment or category details only; omit contact details and links.');
  return value.trim();
}

export function observationFrom(value = {}) {
  return {
    brand: safeText(value.brand, 80), model: safeText(value.model, 100),
    component: safeText(value.component, 100), category: safeText(value.category, 60),
    terms: (Array.isArray(value.terms) ? value.terms : []).slice(0, 8).map(term => safeText(term, 100)),
  };
}

export function observationKey(observation) {
  // Keep all observations of an equipment model in the same split. When no model
  // is known, group by the complete structured observation instead of scan ID.
  const o = observationFrom(observation);
  return normalize(`${o.brand}|${o.model || `${o.category}|${o.component}|${[...o.terms].sort().join('|')}`}`);
}

export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function groupFor(product, observation) {
  return digest(`${product}:${observationKey(observation)}`);
}

export function splitFor(group) {
  return parseInt(group.slice(0, 8), 16) % 5 === 0 ? 'holdout' : 'learn';
}

function encode(value) {
  return btoa(String.fromCharCode(...encoder.encode(JSON.stringify(value)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(value) {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0))));
}

async function signingKey(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('Learning signing is not configured.');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function ownerHash(secret, subject) {
  const key = await signingKey(secret);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`learning-owner:${subject}`)))].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function signReceipt(secret, payload) {
  const body = encode({ ...payload, version: LEARNING_VERSION, exp: Math.floor(Date.now() / 1000) + 7 * 86400 });
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(body)));
  return `${body}.${[...signature].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export async function verifyReceipt(secret, receipt) {
  try {
    if (typeof receipt !== 'string' || receipt.length > 14000) return null;
    const [body, hex, extra] = receipt.split('.');
    if (extra || !/^[a-f0-9]{64}$/.test(hex || '')) return null;
    const signature = Uint8Array.from(hex.match(/../g), x => parseInt(x, 16));
    if (!await crypto.subtle.verify('HMAC', await signingKey(secret), signature, encoder.encode(body))) return null;
    const payload = decode(body);
    if (payload.version !== LEARNING_VERSION || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000 || !PRODUCTS.includes(payload.product)) return null;
    return payload;
  } catch { return null; }
}

export function buildKnowledge(cases) {
  return cases.filter(c => c.status === 'verified' && c.split === 'learn' && c.traffic_class === 'real' && c.expected_label)
    .map(c => ({ id: c.id, group: c.group_key, observation: typeof c.observation === 'string' ? JSON.parse(c.observation) : c.observation,
      label: c.expected_label, evidenceUrl: c.evidence_url, evidenceKind: c.evidence_kind }));
}

function tokens(o) {
  return new Set(normalize([o.model, o.component, o.category, ...(o.terms || [])].join(' ')).split(' ').filter(x => x.length > 2));
}

export function retrieveLearned(observation, knowledge, excludedGroup = '') {
  const o = observationFrom(observation), query = tokens(o);
  if (!normalize(o.brand) || query.size < 2) return [];
  const votes = new Map();
  for (const entry of knowledge) {
    if (entry.group === excludedGroup || normalize(entry.observation.brand) !== normalize(o.brand)) continue;
    const known = tokens(entry.observation);
    const overlap = [...query].filter(x => known.has(x)).length;
    const score = overlap / new Set([...query, ...known]).size;
    if (overlap < 2 || score < 0.35) continue;
    const previous = votes.get(entry.label);
    if (!previous || previous.score < score) votes.set(entry.label, { label: entry.label, score, evidenceUrl: entry.evidenceUrl, evidenceKind: entry.evidenceKind });
  }
  const ranked = [...votes.values()].sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  // Conflicting corrections abstain rather than promote an arbitrary winner.
  if (ranked[1] && ranked[0].score - ranked[1].score < 0.15) return [];
  return ranked.slice(0, 3);
}

function mcnemarProbability(wins, losses) {
  const n = wins + losses;
  if (!n || wins <= losses) return 1;
  // Sum in log space; 2^-n underflows for large pilot cohorts.
  let term = -n * Math.LN2, sum = term;
  for (let k = 1; k <= losses; k++) {
    term += Math.log(n - k + 1) - Math.log(k);
    const largest = Math.max(sum, term);
    sum = largest + Math.log(Math.exp(sum - largest) + Math.exp(term - largest));
  }
  return Math.min(1, Math.exp(sum));
}

export function evaluateLearning(cases, knowledge) {
  const eligible = cases.filter(c => c.status === 'verified' && c.split === 'holdout' && c.traffic_class === 'real');
  const trainingGroups = new Set(knowledge.map(k => k.group));
  const seen = new Set();
  const heldout = eligible.filter(c => !trainingGroups.has(c.group_key) && !seen.has(c.group_key) && seen.add(c.group_key));
  let baselineCorrect = 0, candidateCorrect = 0, wins = 0, losses = 0, unsafe = 0, baselineUnsafe = 0;
  const rows = heldout.map(c => {
    const observation = typeof c.observation === 'string' ? JSON.parse(c.observation) : c.observation;
    const baseline = typeof c.baseline === 'string' ? JSON.parse(c.baseline) : c.baseline;
    const learned = retrieveLearned(observation, knowledge, c.group_key);
    const before = baseline[0] || null, after = learned[0]?.label || before;
    const expected = c.expected_label || null;
    const b = before === expected, a = after === expected;
    baselineCorrect += Number(b); candidateCorrect += Number(a);
    wins += Number(a && !b); losses += Number(b && !a);
    unsafe += Number(expected === null && after !== null);
    baselineUnsafe += Number(expected === null && before !== null);
    return { id: c.id, baseline: before, candidate: after, expected, correctBefore: b, correctAfter: a };
  });
  const n = rows.length, p = mcnemarProbability(wins, losses);
  const accuracyBefore = n ? baselineCorrect / n : null, accuracyAfter = n ? candidateCorrect / n : null;
  const reasons = [];
  if (n < 30) reasons.push('At least 30 independent verified real holdout groups are required.');
  if (trainingGroups.size < 10) reasons.push('At least 10 independent verified learning groups are required.');
  if (!n || accuracyAfter - accuracyBefore < 0.05) reasons.push('Candidate must improve held-out accuracy by at least five percentage points.');
  if (p > 0.05) reasons.push('Paired improvement has not reached the predeclared 0.05 significance threshold.');
  if (losses) reasons.push('Candidate regressed previously correct cases.');
  if (unsafe) reasons.push('Candidate makes unsupported predictions on abstention cases.');
  if (!heldout.some(c => !c.expected_label)) reasons.push('Holdout must include verified abstention cases.');
  return { version: LEARNING_VERSION, generatedAt: new Date().toISOString(), promotable: !reasons.length,
    evidence: 'Verified structured metadata retrieval; does not measure image recognition, exact fitment, or booking conversion.',
    holdoutGroups: n, excludedDuplicateOrLeakedGroups: eligible.length - n, learningExamples: knowledge.length,
    accuracyBefore, accuracyAfter, wins, losses, unsupportedBefore: baselineUnsafe, unsupportedAfter: unsafe,
    pairedPValue: p, reasons, rows };
}
