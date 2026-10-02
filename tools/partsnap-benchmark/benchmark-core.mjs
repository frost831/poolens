import { performance } from 'node:perf_hooks';

import {
  BENCHMARK_CASES,
  BENCHMARK_VERSION,
  CATALOG,
  DEFAULT_THRESHOLDS,
  REQUIRED_CATEGORIES,
} from './benchmark-data.mjs';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function phrasePresent(text, phrase) {
  const normalizedPhrase = normalize(phrase);
  return normalizedPhrase.length > 0 && (` ${text} `).includes(` ${normalizedPhrase} `);
}

function tokenOverlap(text, phrases) {
  return phrases.reduce((count, phrase) => count + (phrasePresent(text, phrase) ? 1 : 0), 0);
}

export function rankPartSnapCandidates(evidenceText, catalog = CATALOG) {
  const text = normalize(evidenceText);
  const ranked = catalog.map((candidate) => {
    const manufacturerMatch = phrasePresent(text, candidate.manufacturer);
    const modelMatches = candidate.models.filter((model) => phrasePresent(text, model));
    const identifierMatches = candidate.identifiers.filter((identifier) => phrasePresent(text, `label identifier ${identifier}`));
    const keywordMatches = tokenOverlap(text, candidate.keywords);
    const familyMatches = tokenOverlap(text, candidate.family.split('_'));
    const explicitFamilyMatch = phrasePresent(text, `reference family ${candidate.family}`);
    const score = (manufacturerMatch ? 5 : 0)
      + (modelMatches.length * 12)
      + (identifierMatches.length * 20)
      + (keywordMatches * 4)
      + (explicitFamilyMatch ? 18 : 0)
      + familyMatches;

    return {
      ...candidate,
      score,
      evidence: {
        manufacturerMatch,
        modelMatches,
        identifierMatches,
        keywordMatches,
        explicitFamilyMatch,
      },
    };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const top = ranked[0];
  const second = ranked[1];
  const scoreMargin = top.score - second.score;
  const strongRecordMatches = ranked.filter((candidate) => (
    candidate.evidence.identifierMatches.length > 0 || candidate.evidence.modelMatches.length > 0
  ));
  const conflictingStrongEvidence = strongRecordMatches.length > 1;
  const hasDecisiveIdentifier = top.evidence.identifierMatches.length > 0 && scoreMargin >= 8;
  const hasDecisiveModel = top.evidence.modelMatches.length > 0 && scoreMargin >= 5;
  const hasFamilyEvidence = (top.evidence.explicitFamilyMatch || top.evidence.keywordMatches >= 2) && scoreMargin >= 3;
  const abstained = conflictingStrongEvidence
    || top.score < 8
    || (!hasDecisiveIdentifier && !hasDecisiveModel && !hasFamilyEvidence);

  let confidence = 0.35;
  if (hasDecisiveIdentifier) confidence = 0.99;
  else if (hasDecisiveModel) confidence = 0.90;
  else if (hasFamilyEvidence) confidence = 0.76;
  else if (top.score >= 8) confidence = 0.58;
  if (abstained) confidence = Math.min(confidence, 0.49);

  return {
    abstained,
    confidence,
    exactPartId: hasDecisiveIdentifier && !abstained ? top.id : null,
    ranked: ranked.slice(0, 3).map((candidate) => ({
      id: candidate.id,
      family: candidate.family,
      category: candidate.category,
      score: candidate.score,
      source: candidate.source,
    })),
    proof: {
      scoreMargin,
      decisiveIdentifier: hasDecisiveIdentifier,
      decisiveModel: hasDecisiveModel,
      familyEvidence: hasFamilyEvidence,
      conflictingStrongEvidence,
    },
  };
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function rounded(value, digits = 4) {
  return Number(value.toFixed(digits));
}

export function evaluateBenchmark({
  cases = BENCHMARK_CASES,
  catalog = CATALOG,
  thresholds = DEFAULT_THRESHOLDS,
} = {}) {
  const started = performance.now();
  const results = cases.map((benchmarkCase) => {
    const caseStarted = performance.now();
    const prediction = rankPartSnapCandidates(benchmarkCase.evidenceText, catalog);
    const runtimeMs = performance.now() - caseStarted;
    const topFamilies = prediction.ranked.map((candidate) => candidate.family);
    const top1Correct = benchmarkCase.familyEvaluable
      ? topFamilies[0] === benchmarkCase.expectedFamily
      : null;
    const top3Correct = benchmarkCase.familyEvaluable
      ? topFamilies.includes(benchmarkCase.expectedFamily)
      : null;
    const exactCorrect = benchmarkCase.exactPartEligible
      ? prediction.exactPartId === benchmarkCase.expectedPartId
      : null;
    const unsupportedExactClaim = !benchmarkCase.exactPartEligible && prediction.exactPartId !== null;
    const wrongHighConfidenceFamily = benchmarkCase.familyEvaluable
      && !top1Correct
      && prediction.confidence >= 0.80;
    const highConfidenceOnAmbiguousCase = benchmarkCase.shouldAbstain
      && !prediction.abstained
      && prediction.confidence >= 0.75;
    const unsafeFalseConfidence = unsupportedExactClaim
      || wrongHighConfidenceFamily
      || highConfidenceOnAmbiguousCase;

    return {
      case: benchmarkCase,
      prediction,
      runtimeMs,
      top1Correct,
      top3Correct,
      exactCorrect,
      unsupportedExactClaim,
      unsafeFalseConfidence,
    };
  });

  const familyResults = results.filter((result) => result.case.familyEvaluable);
  const exactResults = results.filter((result) => result.case.exactPartEligible);
  const truePositiveAbstentions = results.filter((result) => result.case.shouldAbstain && result.prediction.abstained).length;
  const falsePositiveAbstentions = results.filter((result) => !result.case.shouldAbstain && result.prediction.abstained).length;
  const falseNegativeAbstentions = results.filter((result) => result.case.shouldAbstain && !result.prediction.abstained).length;
  const unsafeResults = results.filter((result) => result.unsafeFalseConfidence);
  const categoryCounts = Object.fromEntries(REQUIRED_CATEGORIES.map((category) => [
    category,
    cases.filter((benchmarkCase) => benchmarkCase.category === category).length,
  ]));
  const provenanceCounts = cases.reduce((counts, benchmarkCase) => {
    const key = benchmarkCase.provenance.evidenceType;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const metrics = {
    caseCount: cases.length,
    categoryCount: Object.values(categoryCounts).filter((count) => count > 0).length,
    minimumCasesInCategory: Math.min(...Object.values(categoryCounts)),
    familyEvaluableCases: familyResults.length,
    exactPartEligibleCases: exactResults.length,
    abstentionCases: results.filter((result) => result.case.shouldAbstain).length,
    top1FamilyAccuracy: rounded(ratio(familyResults.filter((result) => result.top1Correct).length, familyResults.length)),
    top3FamilyAccuracy: rounded(ratio(familyResults.filter((result) => result.top3Correct).length, familyResults.length)),
    exactPartAccuracy: rounded(ratio(exactResults.filter((result) => result.exactCorrect).length, exactResults.length)),
    abstentionPrecision: rounded(ratio(truePositiveAbstentions, truePositiveAbstentions + falsePositiveAbstentions)),
    abstentionRecall: rounded(ratio(truePositiveAbstentions, truePositiveAbstentions + falseNegativeAbstentions)),
    unsafeFalseConfidenceCount: unsafeResults.length,
    unsafeFalseConfidenceRate: rounded(ratio(unsafeResults.length, results.length)),
    unsupportedExactClaimCount: results.filter((result) => result.unsupportedExactClaim).length,
    medianPacketTimeSeconds: rounded(median(cases.map((benchmarkCase) => benchmarkCase.modeledPacketSeconds)), 2),
    medianEvaluatorRuntimeMs: rounded(median(results.map((result) => result.runtimeMs)), 3),
    totalEvaluatorRuntimeMs: rounded(performance.now() - started, 3),
  };

  const checks = [
    ['minimum cases', metrics.caseCount >= thresholds.minimumCases, metrics.caseCount, `>= ${thresholds.minimumCases}`],
    ['minimum categories', metrics.categoryCount >= thresholds.minimumCategories, metrics.categoryCount, `>= ${thresholds.minimumCategories}`],
    ['minimum cases per category', metrics.minimumCasesInCategory >= thresholds.minimumCasesPerCategory, metrics.minimumCasesInCategory, `>= ${thresholds.minimumCasesPerCategory}`],
    ['top-1 family accuracy', metrics.top1FamilyAccuracy >= thresholds.top1FamilyAccuracy, metrics.top1FamilyAccuracy, `>= ${thresholds.top1FamilyAccuracy}`],
    ['top-3 family accuracy', metrics.top3FamilyAccuracy >= thresholds.top3FamilyAccuracy, metrics.top3FamilyAccuracy, `>= ${thresholds.top3FamilyAccuracy}`],
    ['exact-part accuracy', metrics.exactPartAccuracy >= thresholds.exactPartAccuracy, metrics.exactPartAccuracy, `>= ${thresholds.exactPartAccuracy}`],
    ['abstention precision', metrics.abstentionPrecision >= thresholds.abstentionPrecision, metrics.abstentionPrecision, `>= ${thresholds.abstentionPrecision}`],
    ['abstention recall', metrics.abstentionRecall >= thresholds.abstentionRecall, metrics.abstentionRecall, `>= ${thresholds.abstentionRecall}`],
    ['unsafe false confidence rate', metrics.unsafeFalseConfidenceRate <= thresholds.maximumUnsafeFalseConfidenceRate, metrics.unsafeFalseConfidenceRate, `<= ${thresholds.maximumUnsafeFalseConfidenceRate}`],
    ['median packet time', metrics.medianPacketTimeSeconds <= thresholds.maximumMedianPacketSeconds, metrics.medianPacketTimeSeconds, `<= ${thresholds.maximumMedianPacketSeconds}s`],
  ].map(([name, passed, actual, expected]) => ({ name, passed, actual, expected }));

  return {
    ok: checks.every((check) => check.passed),
    benchmarkVersion: BENCHMARK_VERSION,
    generatedAt: new Date().toISOString(),
    evidenceBoundary: {
      imageProvenCases: cases.filter((benchmarkCase) => benchmarkCase.provenance.imageProven).length,
      metadataReferenceOnlyCases: cases.filter((benchmarkCase) => benchmarkCase.provenance.evidenceType === 'metadata_reference_only').length,
      statement: 'This deterministic gate validates ranking and evidence policy against reference metadata. It does not validate computer vision, live API behavior, fitment, or field accuracy.',
    },
    thresholds,
    metrics,
    categoryCounts,
    provenanceCounts,
    checks,
    failures: checks.filter((check) => !check.passed),
    unsafeCases: unsafeResults.map((result) => result.case.id),
    results,
  };
}

export function reportToMarkdown(report) {
  const percent = (value) => `${(value * 100).toFixed(1)}%`;
  const checkRows = report.checks
    .map((check) => `| ${check.name} | ${check.passed ? 'PASS' : 'FAIL'} | ${check.actual} | ${check.expected} |`)
    .join('\n');
  const categoryRows = Object.entries(report.categoryCounts)
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n');

  return `# PartSnap Deterministic Benchmark Report

Generated: ${report.generatedAt}  
Benchmark version: ${report.benchmarkVersion}  
Result: **${report.ok ? 'PASS' : 'FAIL'}**

## Evidence Boundary

${report.evidenceBoundary.statement}

- Image-proven cases: ${report.evidenceBoundary.imageProvenCases}
- Metadata/reference-only cases: ${report.evidenceBoundary.metadataReferenceOnlyCases}
- Exact-part scoring denominator: ${report.metrics.exactPartEligibleCases} cases with an explicit reference identifier
- Exact-part success does not establish fitment, interchange, manufacturer approval, or permission to order
- Packet time is a deterministic modeled duration attached to each reference case, not observed technician time

## Metrics

| Metric | Result |
| --- | ---: |
| Cases | ${report.metrics.caseCount} |
| Family-evaluable cases | ${report.metrics.familyEvaluableCases} |
| Top-1 family accuracy | ${percent(report.metrics.top1FamilyAccuracy)} |
| Top-3 family accuracy | ${percent(report.metrics.top3FamilyAccuracy)} |
| Exact-part accuracy on eligible cases | ${percent(report.metrics.exactPartAccuracy)} |
| Abstention precision | ${percent(report.metrics.abstentionPrecision)} |
| Abstention recall | ${percent(report.metrics.abstentionRecall)} |
| Unsafe false confidence | ${report.metrics.unsafeFalseConfidenceCount} (${percent(report.metrics.unsafeFalseConfidenceRate)}) |
| Unsupported exact claims | ${report.metrics.unsupportedExactClaimCount} |
| Median modeled packet time | ${report.metrics.medianPacketTimeSeconds}s |
| Median evaluator runtime | ${report.metrics.medianEvaluatorRuntimeMs}ms |

## Threshold Checks

| Check | Status | Actual | Required |
| --- | --- | ---: | ---: |
${checkRows}

## Coverage

| Category | Cases |
| --- | ---: |
${categoryRows}

## Interpretation

This is a deterministic policy and retrieval proof gate. It proves that reference evidence is ranked consistently, exact matching is restricted to explicitly identified cases, ambiguous evidence causes abstention, unsafe confidence is counted, and threshold failures fail the process. It cannot be used as proof of photo-recognition accuracy or production field performance. The next benchmark revision should replace reference-only cases with consented, labeled field images while preserving these cases as regression fixtures.
`;
}
