import {
  PARTSNAP_CORPUS_VERSION,
  PARTSNAP_FAMILIES,
  PARTSNAP_SOURCES,
} from '../data/partsnap-source-corpus.mjs';

const SAFE_CONFIDENCE = new Set(['high', 'medium', 'low']);
const MAX_CANDIDATES = 4;

function clean(value, max = 240) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function cleanList(value, limit = 12, itemMax = 180) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => clean(item, itemMax)).filter(Boolean))].slice(0, limit);
}

function normalize(value) {
  return clean(value, 500)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value) {
  return normalize(value).replace(/\s/g, '');
}

function hasPhrase(haystack, phrase) {
  const needle = normalize(phrase);
  return Boolean(needle && haystack.includes(needle));
}

function flattenEvidence(result) {
  return normalize([
    result.manufacturer,
    result.category,
    result.component,
    result.model,
    result.description,
    ...(Array.isArray(result.searchTerms) ? result.searchTerms : []),
    ...(Array.isArray(result.observedMarkings) ? result.observedMarkings : []),
    ...(Array.isArray(result.visibleEvidence) ? result.visibleEvidence : []),
  ].filter(Boolean).join(' '));
}

function partNumberIsVisible(result, partNumber) {
  if (!partNumber || result.partNumberVisible !== true) return false;
  const expected = compact(partNumber);
  if (expected.length < 4) return false;
  return cleanList(result.observedMarkings, 20, 120).some((marking) => {
    const visible = compact(marking);
    return visible === expected || visible.includes(expected);
  });
}

function scoreFamily(result, row, text) {
  const reasons = [];
  const manufacturer = normalize(result.manufacturer);
  const category = normalize(result.category);
  const rowManufacturer = normalize(row.manufacturer);

  const brandMatch = manufacturer && rowManufacturer !== 'multi brand'
    && (manufacturer === rowManufacturer || manufacturer.includes(rowManufacturer) || rowManufacturer.includes(manufacturer));
  const modelHits = row.modelFamilies.filter((model) => hasPhrase(text, model));
  const aliasHits = row.aliases.filter((alias) => hasPhrase(text, alias));
  const clueHits = row.visualClues.filter((clue) => hasPhrase(text, clue));
  const categoryMatch = category && category === normalize(row.category);

  let score = 0;
  if (brandMatch) { score += 8; reasons.push('manufacturer'); }
  if (categoryMatch) { score += 4; reasons.push('category'); }
  if (modelHits.length) { score += Math.min(14, modelHits.length * 7); reasons.push('model family'); }
  if (aliasHits.length) { score += Math.min(9, aliasHits.length * 3); reasons.push('component language'); }
  if (clueHits.length) { score += Math.min(6, clueHits.length * 2); reasons.push('visible clue'); }

  const multiBrandModel = rowManufacturer === 'multi brand' && modelHits.length > 0;
  const independentlySupported = modelHits.length > 0 || (brandMatch && aliasHits.length > 0);
  const eligible = score >= 12 && (independentlySupported || multiBrandModel);
  return { score, reasons, eligible };
}

function citationFor(sourceId) {
  const source = PARTSNAP_SOURCES[sourceId];
  if (!source) return null;
  return {
    sourceId,
    title: source.title,
    publisher: source.publisher,
    sourceType: source.sourceType,
    url: source.url,
  };
}

function candidateFrom(row, scored) {
  const citations = row.sources.map(citationFor).filter(Boolean);
  const isFamilyMatch = scored.reasons.includes('model family')
    || (scored.reasons.includes('manufacturer') && scored.reasons.includes('component language'));
  return {
    id: row.id,
    manufacturer: row.manufacturer,
    category: row.category,
    component: row.component,
    modelFamilies: [...row.modelFamilies].slice(0, 5),
    matchLevel: isFamilyMatch ? 'source-backed family' : 'source-backed clue',
    matchScore: scored.score,
    matchReasons: scored.reasons,
    sourceTier: 1,
    sourceLabels: citations.map((citation) => citation.title),
    sourceUrls: citations.map((citation) => citation.url),
    citations,
    requiredProof: [...row.requiredProof].slice(0, 6),
    lookalikeWarnings: [...row.lookalikeWarnings].slice(0, 3),
    exactFitmentConfirmed: false,
  };
}

function unresolvedProof(result, candidates) {
  const supplied = cleanList(result.missingProof, 12);
  const visible = normalize(cleanList(result.visibleEvidence, 20).join(' '));
  const candidateProof = candidates.flatMap((candidate) => candidate.requiredProof || []);
  const required = [...supplied, ...candidateProof];
  if (!result.manufacturer) required.unshift('manufacturer or brand marking');
  if (!result.modelVisible) required.unshift('model and serial plate');
  if (!result.partNumberVisible) required.unshift('molded, printed, or stamped part number');
  if (!candidates.length) required.push('second angle showing where the part was installed');

  return [...new Set(required.map((item) => clean(item, 160)).filter((item) => item && !hasPhrase(visible, item)))]
    .slice(0, 8);
}

export function attachPartSnapCorpusCandidates(rawResult = {}) {
  if (!rawResult || typeof rawResult !== 'object' || Array.isArray(rawResult)) {
    return rawResult;
  }

  const result = {
    ...rawResult,
    manufacturer: clean(rawResult.manufacturer, 100) || null,
    category: clean(rawResult.category, 60) || 'other',
    component: clean(rawResult.component, 120) || 'unknown',
    model: clean(rawResult.model, 140) || null,
    partNumber: clean(rawResult.partNumber, 100) || null,
    description: clean(rawResult.description, 240),
    condition: clean(rawResult.condition, 40) || 'unknown',
    replacementNotes: clean(rawResult.replacementNotes, 240) || null,
    searchTerms: cleanList(rawResult.searchTerms, 6, 120),
    visibleEvidence: cleanList(rawResult.visibleEvidence, 12, 160),
    observedMarkings: cleanList(rawResult.observedMarkings, 12, 120),
    missingProof: cleanList(rawResult.missingProof, 12, 160),
    modelVisible: rawResult.modelVisible === true,
    partNumberVisible: rawResult.partNumberVisible === true,
    confidence: SAFE_CONFIDENCE.has(clean(rawResult.confidence, 20).toLowerCase())
      ? clean(rawResult.confidence, 20).toLowerCase()
      : 'low',
  };

  if (!partNumberIsVisible(result, result.partNumber)) {
    result.partNumber = null;
    result.partNumberVisible = false;
  }

  const text = flattenEvidence(result);
  const candidates = PARTSNAP_FAMILIES
    .map((row) => ({ row, ...scoreFamily(result, row, text) }))
    .filter((scored) => scored.eligible)
    .sort((left, right) => right.score - left.score || left.row.id.localeCompare(right.row.id))
    .slice(0, MAX_CANDIDATES)
    .map((scored) => candidateFrom(scored.row, scored));

  if (!candidates.length && result.confidence === 'high') result.confidence = 'medium';
  if (!result.manufacturer && !result.modelVisible) result.confidence = 'low';

  result.missingProof = unresolvedProof(result, candidates);
  result.verificationNotes = candidates.length
    ? 'Source-backed family candidates only. Confirm visible identifiers, dimensions, and the current manufacturer diagram before ordering.'
    : 'AI observation only. Capture the model plate, visible markings, dimensions, and installation context before ordering.';
  result.orderingStatus = 'hold-for-verification';
  result.exactFitmentConfirmed = false;
  result.corpusCandidates = candidates;
  result.corpusStatus = {
    label: candidates.length ? 'source-backed candidates' : 'ai-only',
    candidateCount: candidates.length,
    topSourceTier: candidates.length ? 1 : null,
    evidenceLevel: candidates.length ? 'family' : 'insufficient',
    exactFitmentConfirmed: false,
    corpusVersion: PARTSNAP_CORPUS_VERSION,
    note: candidates.length
      ? 'The observation matched official manufacturer source families. This narrows the family but does not confirm exact fitment.'
      : 'No official source family met the evidence threshold. Treat this as AI-only and capture more proof.',
  };

  return result;
}

export const partsnapCorpusStats = Object.freeze({
  version: PARTSNAP_CORPUS_VERSION,
  sourceCount: Object.keys(PARTSNAP_SOURCES).length,
  familyCount: PARTSNAP_FAMILIES.length,
  categories: Object.freeze([...new Set(PARTSNAP_FAMILIES.map((row) => row.category))].sort()),
});
