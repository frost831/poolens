import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

import { onRequestPost } from '../functions/api/scan.js';
import {
  attachPartSnapCorpusCandidates,
  partsnapCorpusStats,
} from '../functions/lib/partsnap-corpus.mjs';
import {
  PARTSNAP_FAMILIES,
  PARTSNAP_SOURCES,
} from '../functions/data/partsnap-source-corpus.mjs';

if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto });

test('PartSnap corpus contains official sources and broad field categories', () => {
  assert.equal(partsnapCorpusStats.sourceCount, 9);
  assert.equal(partsnapCorpusStats.familyCount, 16);
  for (const source of Object.values(PARTSNAP_SOURCES)) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.match(source.sourceType, /^official-/);
    assert.ok(source.publisher);
  }
  for (const category of ['pump', 'filter', 'heater', 'automation', 'salt', 'cleaner', 'robot', 'lighting', 'spa']) {
    assert.ok(partsnapCorpusStats.categories.includes(category), `missing ${category} coverage`);
  }
  assert.ok(PARTSNAP_FAMILIES.every((family) => family.requiredProof.length >= 4));
});

test('PartSnap returns cited family candidates without claiming exact fitment', () => {
  const result = attachPartSnapCorpusCandidates({
    manufacturer: 'Hayward',
    category: 'pump',
    component: 'impeller and diffuser',
    model: 'Super Pump',
    partNumber: 'SPX2607C',
    description: 'Pump wet-end component',
    searchTerms: ['Hayward Super Pump impeller'],
    visibleEvidence: ['Hayward wordmark', 'Super Pump model plate', 'molded marking SPX2607C'],
    observedMarkings: ['SPX2607C'],
    modelVisible: true,
    partNumberVisible: true,
    confidence: 'high',
  });

  assert.equal(result.corpusStatus.label, 'source-backed candidates');
  assert.equal(result.corpusStatus.evidenceLevel, 'family');
  assert.equal(result.corpusStatus.exactFitmentConfirmed, false);
  assert.equal(result.exactFitmentConfirmed, false);
  assert.equal(result.orderingStatus, 'hold-for-verification');
  assert.equal(result.partNumber, 'SPX2607C');
  assert.ok(result.corpusCandidates.length >= 1);
  assert.equal(result.corpusCandidates[0].manufacturer, 'Hayward');
  assert.equal(result.corpusCandidates[0].exactFitmentConfirmed, false);
  assert.match(result.corpusCandidates[0].matchLevel, /^source-backed (family|clue)$/);
  assert.ok(result.corpusCandidates[0].citations.length >= 1);
  assert.ok(result.corpusCandidates[0].citations.every((citation) => citation.url.startsWith('https://')));
  assert.ok(result.missingProof.length >= 1);
});

test('PartSnap withholds an AI-suggested part number without exact visible marking proof', () => {
  const result = attachPartSnapCorpusCandidates({
    manufacturer: 'Pentair',
    category: 'heater',
    component: 'thermistor',
    model: 'MasterTemp',
    partNumber: '42001-0053S',
    visibleEvidence: ['heater cabinet'],
    observedMarkings: ['42001'],
    modelVisible: false,
    partNumberVisible: true,
    confidence: 'high',
  });

  assert.equal(result.partNumber, null);
  assert.equal(result.partNumberVisible, false);
  assert.equal(result.exactFitmentConfirmed, false);
  assert.match(result.verificationNotes, /Source-backed family candidates only/);
  assert.ok(result.missingProof.includes('molded, printed, or stamped part number'));
});

test('PartSnap safely abstains when evidence cannot support a source family', () => {
  const result = attachPartSnapCorpusCandidates({
    manufacturer: null,
    category: 'other',
    component: 'unknown',
    model: null,
    partNumber: 'GUESSED-123',
    visibleEvidence: [],
    observedMarkings: [],
    modelVisible: false,
    partNumberVisible: false,
    confidence: 'high',
  });

  assert.equal(result.corpusStatus.label, 'ai-only');
  assert.equal(result.corpusStatus.evidenceLevel, 'insufficient');
  assert.equal(result.corpusCandidates.length, 0);
  assert.equal(result.partNumber, null);
  assert.equal(result.confidence, 'low');
  assert.equal(result.orderingStatus, 'hold-for-verification');
  assert.ok(result.missingProof.includes('manufacturer or brand marking'));
  assert.ok(result.missingProof.includes('second angle showing where the part was installed'));
});

function base64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function signedEntitlement(secret) {
  const payload = base64Url(Buffer.from(JSON.stringify({
    sub: 'focused-test@splashlens.com',
    exp: Math.floor(Date.now() / 1000) + 600,
    scopes: ['scan'],
    plan: 'PartSnap Test',
    source: 'focused_test',
  })));
  const signed = `sl_scan_v1.${payload}`;
  const key = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  return `${signed}.${base64Url(signature)}`;
}

function fakeDatabase(stageRows) {
  return {
    prepare(sql) {
      const statement = {
        args: [],
        bind(...args) {
          this.args = args;
          return this;
        },
        async run() {
          if (/INSERT INTO events/i.test(sql) && this.args[0] === 'scan_stage') {
            stageRows.push(JSON.parse(this.args[5]));
          }
          return { success: true };
        },
        async first() { return null; },
      };
      return statement;
    },
  };
}

test('scan API enriches the Anthropic result and records non-sensitive stage telemetry', async () => {
  const secret = 'focused-test-secret-value-that-is-long-enough';
  const token = await signedEntitlement(secret);
  const store = new Map();
  const stageRows = [];
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  console.info = () => {};
  globalThis.fetch = async () => new Response(JSON.stringify({
    content: [{
      text: JSON.stringify({
        manufacturer: 'Maytronics',
        category: 'robot',
        component: 'filter basket',
        model: 'Dolphin Nautilus',
        partNumber: '99999999',
        description: 'Robotic cleaner filter basket',
        condition: 'worn',
        replacementNotes: 'Compare basket profile before replacement',
        searchTerms: ['Dolphin Nautilus filter basket'],
        visibleEvidence: ['Dolphin wordmark', 'Nautilus model label', 'pleated filter basket'],
        observedMarkings: ['Nautilus'],
        missingProof: ['robot serial label'],
        modelVisible: true,
        partNumberVisible: false,
        confidence: 'high',
      }),
    }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });

  try {
    const response = await onRequestPost({
      request: new Request('http://localhost:8788/api/scan', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-splashlens-entitlement-token': token,
        },
        body: JSON.stringify({
          mode: 'parts_snap',
          image: 'data:image/jpeg;base64,AAAA',
          path: '/?tool=partsnap',
        }),
      }),
      env: {
        ANTHROPIC_API_KEY: 'test-key-not-a-real-secret',
        SPLASHLENS_ENTITLEMENT_SECRET: secret,
        SCAN_USAGE_KV: {
          async get(key) { return store.get(key) || null; },
          async put(key, value) { store.set(key, value); },
        },
        SUBSCRIBERS_DB: fakeDatabase(stageRows),
      },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.result.partNumber, null);
    assert.equal(payload.result.corpusStatus.label, 'source-backed candidates');
    assert.equal(payload.result.corpusCandidates[0].manufacturer, 'Maytronics');
    assert.equal(payload.telemetry.stage, 'completed');
    assert.equal(payload.telemetry.candidateCount >= 1, true);
    assert.match(payload.telemetry.scanId, /^[0-9a-z_-]{8,}$/i);

    const stages = stageRows.map((row) => row.stage);
    assert.deepEqual(stages, ['accepted', 'ai_requested', 'ai_completed', 'corpus_completed', 'completed']);
    assert.ok(stageRows.every((row) => !JSON.stringify(row).includes('test-key-not-a-real-secret')));
    assert.ok(stageRows.every((row) => !JSON.stringify(row).includes('99999999')));
  } finally {
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
  }
});
