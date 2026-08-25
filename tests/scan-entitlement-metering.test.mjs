import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const generatedFamiliesSource = await readFile(new URL('../functions/_shared/partsnap-generated-families.mjs', import.meta.url), 'utf8');
const generatedFamiliesUrl = `data:text/javascript;base64,${Buffer.from(generatedFamiliesSource).toString('base64')}`;
const corpusSource = (await readFile(new URL('../functions/_shared/partsnap-corpus.mjs', import.meta.url), 'utf8'))
  .replace("from './partsnap-generated-families.mjs'", `from '${generatedFamiliesUrl}'`);
const corpusUrl = `data:text/javascript;base64,${Buffer.from(corpusSource).toString('base64')}`;
const scanSource = (await readFile(new URL('../functions/api/scan.js', import.meta.url), 'utf8'))
  .replace("from '../_shared/partsnap-corpus.mjs'", `from '${corpusUrl}'`);
const scanModuleUrl = `data:text/javascript;base64,${Buffer.from(scanSource).toString('base64')}`;
const { onRequestPost: scanRequestPost } = await import(scanModuleUrl);

const TOKEN_PREFIX = 'sl_scan_v1';
const ENTITLEMENT_SECRET = 'scan-entitlement-test-secret-32-chars';
const textEncoder = new TextEncoder();

class MemoryKv {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed));
    this.puts = [];
  }

  async get(key) {
    return this.map.get(key) || null;
  }

  async put(key, value, options) {
    this.puts.push({ key, value, options });
    this.map.set(key, value);
  }
}

function scanRequest(body, headers = {}) {
  return new Request('https://app.splashlens.com/api/scan', {
    method: 'POST',
    headers: {
      Origin: 'https://app.splashlens.com',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      image: `data:image/jpeg;base64,${Buffer.from('pool part image').toString('base64')}`,
      mode: 'error_code',
      clientId: 'meter-test-client',
      ...body,
    }),
  });
}

function successFetch() {
  return async () => new Response(JSON.stringify({
    content: [{
      text: JSON.stringify({
        codes: ['E05'],
        brand: 'Hayward',
        model: 'TriStar',
        context: 'Heater display fault',
        confidence: 'high',
      }),
    }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

async function signToken(payload) {
  const payloadPart = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const signed = `${TOKEN_PREFIX}.${payloadPart}`;
  const signature = await hmacSha256(ENTITLEMENT_SECRET, signed);
  return `${signed}.${signature}`;
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function withFetch(stub, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('failed AI scans do not burn free monthly allowance', async () => {
  const kv = new MemoryKv();
  const response = await withFetch(
    async () => new Response('upstream unavailable', { status: 502 }),
    () => scanRequestPost({
      request: scanRequest({ clientId: 'failed-free-scan' }),
      env: { ANTHROPIC_API_KEY: 'test-key', SCAN_USAGE_KV: kv },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 502);
  assert.equal(payload.error, 'AI service error');
  assert.equal(kv.puts.some((put) => put.key.includes('scan:')), false);
});

test('successful AI scans commit free monthly allowance after parsing succeeds', async () => {
  const kv = new MemoryKv();
  const response = await withFetch(
    successFetch(),
    () => scanRequestPost({
      request: scanRequest({ clientId: 'successful-free-scan' }),
      env: { ANTHROPIC_API_KEY: 'test-key', SCAN_USAGE_KV: kv },
    }),
  );
  const payload = await response.json();
  const scanPut = kv.puts.find((put) => put.key.includes(':client:successful-free-scan'));

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.usage.source, 'free_metered');
  assert.equal(payload.usage.count, 1);
  assert.equal(scanPut?.value, '1');
});

test('signed paid scan token must have an active stored entitlement when KV is configured', async () => {
  let upstreamCalls = 0;
  const token = await signToken({
    sub: 'tech@example.com',
    plan: 'PartSnap Pro Monthly',
    scopes: ['scan'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const response = await withFetch(
    async () => {
      upstreamCalls += 1;
      return successFetch()();
    },
    () => scanRequestPost({
      request: scanRequest({}, { 'X-SplashLens-Entitlement-Token': token }),
      env: {
        ANTHROPIC_API_KEY: 'test-key',
        SPLASHLENS_ENTITLEMENT_SECRET: ENTITLEMENT_SECRET,
        SCAN_USAGE_KV: new MemoryKv(),
      },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 402);
  assert.match(payload.error, /No active SplashLens scan entitlement/);
  assert.equal(upstreamCalls, 0);
});

test('active paid entitlement uses the entitled monthly quota lane', async () => {
  const token = await signToken({
    sub: 'tech@example.com',
    plan: 'PartSnap Pro Monthly',
    scopes: ['scan'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const kv = new MemoryKv({
    'entitlement:tech@example.com': JSON.stringify({
      subject: 'tech@example.com',
      plan: 'PartSnap Pro Monthly',
      planKey: 'partsnap_pro_monthly',
      feature: 'partsnap_pro',
      scopes: ['scan'],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  const response = await withFetch(
    successFetch(),
    () => scanRequestPost({
      request: scanRequest({}, { 'X-SplashLens-Entitlement-Token': token }),
      env: {
        ANTHROPIC_API_KEY: 'test-key',
        SPLASHLENS_ENTITLEMENT_SECRET: ENTITLEMENT_SECRET,
        SCAN_USAGE_KV: kv,
      },
    }),
  );
  const payload = await response.json();
  const entitledPut = kv.puts.find((put) => put.key.includes(':entitled:tech@example.com'));

  assert.equal(response.status, 200);
  assert.equal(payload.usage.source, 'entitlement');
  assert.equal(payload.usage.limit, 500);
  assert.equal(payload.usage.planKey, 'partsnap_pro_monthly');
  assert.equal(payload.usage.verifiedBy, 'signed_token_and_kv');
  assert.equal(entitledPut?.value, '1');
});
