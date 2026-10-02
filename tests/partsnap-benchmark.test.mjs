import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  BENCHMARK_CASES,
  CATALOG,
  DEFAULT_THRESHOLDS,
  REQUIRED_CATEGORIES,
} from '../tools/partsnap-benchmark/benchmark-data.mjs';
import {
  evaluateBenchmark,
  rankPartSnapCandidates,
  reportToMarkdown,
} from '../tools/partsnap-benchmark/benchmark-core.mjs';
import { parseArgs } from '../tools/run-partsnap-benchmark.mjs';

test('benchmark corpus has at least 100 unique cases across every required lane', () => {
  assert.ok(BENCHMARK_CASES.length >= 100);
  assert.equal(new Set(BENCHMARK_CASES.map((item) => item.id)).size, BENCHMARK_CASES.length);
  for (const category of REQUIRED_CATEGORIES) {
    const categoryCases = BENCHMARK_CASES.filter((item) => item.category === category);
    assert.ok(categoryCases.length >= 10, `${category} must have at least 10 cases`);
  }
  assert.equal(new Set(CATALOG.map((item) => item.id)).size, CATALOG.length);
});

test('every case reports evidence provenance without pretending reference fixtures are photos', () => {
  for (const benchmarkCase of BENCHMARK_CASES) {
    assert.equal(benchmarkCase.provenance.evidenceType, 'metadata_reference_only');
    assert.equal(benchmarkCase.provenance.imageProven, false);
    assert.match(benchmarkCase.provenance.sourceLocator, /^js\/errors\.js#/);
    assert.ok(benchmarkCase.provenance.limitations.length > 30);
  }
});

test('exact-part evaluation is evidence-gated and unsupported cases receive no exact claim', () => {
  const report = evaluateBenchmark();
  const exactEligible = report.results.filter((result) => result.case.exactPartEligible);
  const exactIneligible = report.results.filter((result) => !result.case.exactPartEligible);
  assert.equal(exactEligible.length, CATALOG.length);
  assert.ok(exactEligible.every((result) => result.prediction.exactPartId === result.case.expectedPartId));
  assert.ok(exactIneligible.every((result) => result.prediction.exactPartId === null));
  assert.equal(report.metrics.unsupportedExactClaimCount, 0);
});

test('ambiguous evidence abstains while model evidence returns a family candidate', () => {
  const ambiguous = BENCHMARK_CASES.find((item) => item.variant === 'conflicting_evidence');
  const modelOnly = BENCHMARK_CASES.find((item) => item.variant === 'model_label');
  assert.equal(rankPartSnapCandidates(ambiguous.evidenceText).abstained, true);
  const modelPrediction = rankPartSnapCandidates(modelOnly.evidenceText);
  assert.equal(modelPrediction.abstained, false);
  assert.equal(modelPrediction.exactPartId, null);
  assert.equal(modelPrediction.ranked[0].family, modelOnly.expectedFamily);
});

test('default proof gate passes and reports every required metric', () => {
  const report = evaluateBenchmark();
  assert.equal(report.ok, true, JSON.stringify(report.failures));
  assert.ok(report.metrics.top1FamilyAccuracy >= DEFAULT_THRESHOLDS.top1FamilyAccuracy);
  assert.ok(report.metrics.top3FamilyAccuracy >= DEFAULT_THRESHOLDS.top3FamilyAccuracy);
  assert.ok(report.metrics.exactPartAccuracy >= DEFAULT_THRESHOLDS.exactPartAccuracy);
  assert.ok(report.metrics.abstentionPrecision >= DEFAULT_THRESHOLDS.abstentionPrecision);
  assert.ok(report.metrics.abstentionRecall >= DEFAULT_THRESHOLDS.abstentionRecall);
  assert.ok(report.metrics.unsafeFalseConfidenceRate <= DEFAULT_THRESHOLDS.maximumUnsafeFalseConfidenceRate);
  assert.ok(report.metrics.medianPacketTimeSeconds <= DEFAULT_THRESHOLDS.maximumMedianPacketSeconds);
  assert.match(reportToMarkdown(report), /Exact-part success does not establish fitment/);
});

test('threshold regression fails the API result and the command exits nonzero', () => {
  const impossible = {
    ...DEFAULT_THRESHOLDS,
    top1FamilyAccuracy: 1.01,
  };
  const report = evaluateBenchmark({ thresholds: impossible });
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((failure) => failure.name === 'top-1 family accuracy'));

  const cli = spawnSync(process.execPath, [
    fileURLToPath(new URL('../tools/run-partsnap-benchmark.mjs', import.meta.url)),
    '--min-top1', '1.01',
  ], { encoding: 'utf8' });
  assert.equal(cli.status, 1, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /PartSnap deterministic benchmark .*: FAIL/);
});

test('runner arguments expose threshold overrides and keep output deterministic', () => {
  const options = parseArgs([
    '--json',
    '--report', 'docs/ops/report.md',
    '--min-top1', '0.9',
    '--max-unsafe-confidence', '0',
  ]);
  assert.equal(options.json, true);
  assert.equal(options.reportPath, 'docs/ops/report.md');
  assert.equal(options.thresholds.top1FamilyAccuracy, 0.9);
  assert.equal(options.thresholds.maximumUnsafeFalseConfidenceRate, 0);
  assert.throws(() => parseArgs(['--not-real']), /Unknown argument/);
});
