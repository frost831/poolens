import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  attachPartSnapCorpusCandidates,
  getPartSnapCorpusSnapshot,
  partsnapCorpusStats,
} from '../functions/_shared/partsnap-corpus.mjs';

test('attaches source-backed candidates for known salt-system family language', () => {
  const result = attachPartSnapCorpusCandidates({
    manufacturer: 'Hayward',
    category: 'salt',
    component: 'AquaRite TurboCell flow switch',
    model: 'AquaRite',
    visibleEvidence: ['flow switch tee', 'cell cord'],
    missingProof: ['cell label'],
    searchTerms: ['Hayward AquaRite T-CELL flow switch'],
  });

  assert.equal(result.corpusStatus.label, 'source-backed candidates');
  assert.ok(result.corpusCandidates.length >= 1);
  assert.equal(result.corpusCandidates[0].sourceTier, 1);
  assert.match(result.corpusCandidates[0].component, /AquaRite|TurboCell/i);
});

test('attaches source-backed connected-pump candidates for IntelliFlo3 service proof', () => {
  const result = attachPartSnapCorpusCandidates({
    manufacturer: 'Pentair',
    category: 'pump',
    component: 'IntelliFlo3 VSF connected pump with priming alert',
    model: '011076',
    visibleEvidence: ['pump nameplate', 'Pentair app screen', 'RS-485 terminal'],
    missingProof: ['filter pressure', 'speed schedule screenshot'],
    searchTerms: ['Pentair IntelliFlo3 VSF Pool Brain turnover alert I/O board'],
  });

  const candidate = result.corpusCandidates.find((row) => row.id === 'pentair-intelliflo3-connected-pump-proof');
  assert.equal(result.corpusStatus.label, 'source-backed candidates');
  assert.ok(candidate);
  assert.equal(candidate.sourceTier, 1);
  assert.ok(candidate.sourceLabels.some((label) => /Pentair official IntelliFlo3/i.test(label)));
  assert.ok(candidate.requiredProof.some((item) => /model plate/i.test(item)));
  assert.ok(candidate.requiredProof.some((item) => /RS-485|I\/O board/i.test(item)));
  assert.ok(candidate.lookalikeWarnings.some((item) => /not exact part fitment|not.*diagnosis/i.test(item)));
  assert.ok(candidate.lookalikeWarnings.some((item) => /do not imply SplashLens has partner access/i.test(item)));
});

test('marks unknown scans as AI-only when no corpus family matches', () => {
  const result = attachPartSnapCorpusCandidates({
    manufacturer: null,
    category: 'other',
    component: 'unknown',
    visibleEvidence: [],
    missingProof: ['clear pool-part photo'],
    searchTerms: [],
  });

  assert.equal(result.corpusStatus.label, 'ai-only');
  assert.equal(result.corpusCandidates.length, 0);
});

test('reports corpus health without exposing secrets', () => {
  const snapshot = getPartSnapCorpusSnapshot();

  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.stats.seedFamilyCount, partsnapCorpusStats.seedFamilyCount);
  assert.ok(snapshot.stats.targetFamilyCount >= 500000);
  assert.ok(snapshot.sources.every((source) => source.url && !/secret|key|token/i.test(JSON.stringify(source))));
});

test('corpus health alias is an API route, not an app-shell fallback', async () => {
  const routeSource = await readFile(new URL('../functions/api/partsnap-corpus-health.js', import.meta.url), 'utf8');
  assert.match(routeSource, /export\s+\{\s*onRequestGet\s*\}\s+from\s+['"]\.\/partsnap-corpus\.js['"]/);
});
