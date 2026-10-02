import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DEFAULT_THRESHOLDS } from './partsnap-benchmark/benchmark-data.mjs';
import { evaluateBenchmark, reportToMarkdown } from './partsnap-benchmark/benchmark-core.mjs';

export function parseArgs(argv) {
  const options = {
    json: false,
    reportPath: '',
    thresholds: { ...DEFAULT_THRESHOLDS },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--json') options.json = true;
    else if (arg === '--report' && next) { options.reportPath = next; index += 1; }
    else if (arg === '--min-top1' && next) { options.thresholds.top1FamilyAccuracy = Number(next); index += 1; }
    else if (arg === '--min-top3' && next) { options.thresholds.top3FamilyAccuracy = Number(next); index += 1; }
    else if (arg === '--min-exact' && next) { options.thresholds.exactPartAccuracy = Number(next); index += 1; }
    else if (arg === '--min-abstention-precision' && next) { options.thresholds.abstentionPrecision = Number(next); index += 1; }
    else if (arg === '--min-abstention-recall' && next) { options.thresholds.abstentionRecall = Number(next); index += 1; }
    else if (arg === '--max-unsafe-confidence' && next) { options.thresholds.maximumUnsafeFalseConfidenceRate = Number(next); index += 1; }
    else if (arg === '--max-median-packet-seconds' && next) { options.thresholds.maximumMedianPacketSeconds = Number(next); index += 1; }
    else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
  }

  for (const [key, value] of Object.entries(options.thresholds)) {
    if (!Number.isFinite(value)) throw new Error(`Threshold ${key} must be numeric.`);
  }
  return options;
}

function formatHuman(report) {
  const percent = (value) => `${(value * 100).toFixed(1)}%`;
  const lines = [
    `PartSnap deterministic benchmark ${report.benchmarkVersion}: ${report.ok ? 'PASS' : 'FAIL'}`,
    `Cases ${report.metrics.caseCount} | categories ${report.metrics.categoryCount} | metadata-only ${report.evidenceBoundary.metadataReferenceOnlyCases} | image-proven ${report.evidenceBoundary.imageProvenCases}`,
    `Top-1 family ${percent(report.metrics.top1FamilyAccuracy)} | top-3 family ${percent(report.metrics.top3FamilyAccuracy)} | exact eligible ${percent(report.metrics.exactPartAccuracy)}`,
    `Abstention precision ${percent(report.metrics.abstentionPrecision)} | recall ${percent(report.metrics.abstentionRecall)}`,
    `Unsafe false confidence ${report.metrics.unsafeFalseConfidenceCount}/${report.metrics.caseCount} (${percent(report.metrics.unsafeFalseConfidenceRate)})`,
    `Median modeled packet ${report.metrics.medianPacketTimeSeconds}s | median evaluator ${report.metrics.medianEvaluatorRuntimeMs}ms`,
  ];
  for (const check of report.checks) {
    lines.push(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.actual} (${check.expected})`);
  }
  lines.push(`Boundary: ${report.evidenceBoundary.statement}`);
  return lines.join('\n');
}

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = evaluateBenchmark({ thresholds: options.thresholds });

  if (options.reportPath) {
    const resolved = path.resolve(options.reportPath);
    const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const allowedRoots = ['tools', 'tests', path.join('docs', 'ops')]
      .map((relative) => path.join(repositoryRoot, relative) + path.sep);
    if (!allowedRoots.some((root) => resolved.startsWith(root))) {
      throw new Error('Report path must stay under tools/, tests/, or docs/ops/.');
    }
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, reportToMarkdown(report), 'utf8');
  }

  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatHuman(report)}\n`);
  return report.ok ? 0 : 1;
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  runCli()
    .then((exitCode) => { process.exitCode = exitCode; })
    .catch((error) => {
      process.stderr.write(`PartSnap benchmark error: ${error.message}\n`);
      process.exitCode = 2;
    });
}
