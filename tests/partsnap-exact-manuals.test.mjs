import test from 'node:test';
import assert from 'node:assert/strict';
import { attachPartSnapCorpusCandidates } from '../functions/lib/partsnap-corpus.mjs';
import { evidenceAllowed } from '../functions/lib/learning-store.mjs';
import { PARTSNAP_SOURCES } from '../functions/data/partsnap-source-corpus.mjs';
import { auditManuals } from '../tools/audit-partsnap-manuals.mjs';

test('owner learning review accepts the exact approved page anchor but rejects added data', () => {
  const url = PARTSNAP_SOURCES['maytronics-liberty-user-manual'].url;
  assert.equal(evidenceAllowed('splashlens', url, 'manufacturer_reference'), true);
  assert.equal(evidenceAllowed('splashlens', url.replace('#page=5', '#private-data'), 'manufacturer_reference'), false);
  assert.equal(evidenceAllowed('splashlens', url.replace('#page=5', '?account=private#page=5'), 'manufacturer_reference'), false);
  assert.equal(evidenceAllowed('throttleshare', 'https://throttleshare.com/#page=5', 'confirmed_outcome'), false);
});

test('a successful HTTP status with an HTML anti-bot page is not verified as a PDF manual', async () => {
  const result = await auditManuals(async () => new Response('<html>Challenge</html>', { headers: { 'Content-Type': 'text/html' } }));
  assert.equal(result.ok, false);
  assert.ok(result.results.every(row => row.pdf === false));
});

for (const fixture of [
  { manufacturer: 'Pentair', category: 'pump', model: 'IntelliFlo3 VSF', component: 'impeller', family: 'pentair-intelliflo3-variant-parts', section: '#page=29', missing: '1.5 HP or 3 HP variant proof' },
  { manufacturer: 'Maytronics', category: 'robot', model: 'LIBERTY 300', component: 'inductive charger', family: 'maytronics-liberty-cordless-family', section: '#page=5', missing: 'charger label and connector view' },
]) {
  test(`${fixture.model} returns its exact manual route and unresolved proof`, () => {
    const result = attachPartSnapCorpusCandidates({ ...fixture, confidence: 'high', modelVisible: true });
    const candidate = result.corpusCandidates.find(row => row.id === fixture.family);
    assert.ok(candidate);
    assert.ok(candidate.citations.some(citation => citation.url.endsWith(fixture.section)));
    assert.ok(candidate.requiredProof.includes(fixture.missing));
    assert.equal(candidate.exactFitmentConfirmed, false);
    assert.equal(result.orderingStatus, 'hold-for-verification');
    assert.equal(result.partNumber, null);
  });
}

test('the LIBERTY manual is not selected for a different manufacturer or a corded cleaner', () => {
  for (const observation of [
    { manufacturer: 'Maytronics', category: 'robot', model: 'Nautilus CC Plus', component: 'floating cable' },
    { manufacturer: 'Maytronics', category: 'robot', model: 'LIBERTY 600', component: 'inductive charger' },
    { manufacturer: 'Maytronics', category: 'robot', model: 'LIBERTY 3000', component: 'inductive charger' },
    { manufacturer: 'Polaris', category: 'robot', model: 'FREEDOM', component: 'charging station' },
    { category: 'robot', component: 'unknown battery pack' },
  ]) {
    const result = attachPartSnapCorpusCandidates(observation);
    assert.ok(!result.corpusCandidates.some(row => row.id === 'maytronics-liberty-cordless-family'));
    assert.equal(result.exactFitmentConfirmed, false);
  }
});
