import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { attachPartSnapCorpusCandidates } from '../functions/_shared/partsnap-corpus.mjs';

const benchmarkPath = path.resolve('data/partsnap/benchmarks/seed-benchmark.json');
const outDir = path.resolve('data/partsnap/generated');
const outPath = path.join(outDir, 'partsnap-benchmark-report.json');
const benchmark = JSON.parse(await readFile(benchmarkPath, 'utf8'));
const cases = Array.isArray(benchmark.cases) ? benchmark.cases : [];

const results = cases.map((testCase) => {
  const enriched = attachPartSnapCorpusCandidates(testCase.aiResult || {});
  const top = enriched.corpusCandidates?.[0]?.id || null;
  const pass = top === (testCase.expectedTopFamily || null);
  return {
    id: testCase.id,
    expectedTopFamily: testCase.expectedTopFamily || null,
    actualTopFamily: top,
    pass,
    corpusStatus: enriched.corpusStatus?.label || 'unknown',
    candidateCount: enriched.corpusCandidates?.length || 0,
    topMatchLevel: enriched.corpusCandidates?.[0]?.matchLevel || '',
  };
});

const passed = results.filter((row) => row.pass).length;
const report = {
  ok: passed === results.length,
  generatedAt: new Date().toISOString(),
  benchmarkPath,
  caseCount: results.length,
  passed,
  failed: results.length - passed,
  familyTop1Percent: results.length ? Math.round((passed / results.length) * 10000) / 100 : null,
  caveat: 'This is a tiny engineering benchmark for regression protection. Do not publish as product accuracy.',
  results,
};

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));

if (!report.ok) process.exit(1);
