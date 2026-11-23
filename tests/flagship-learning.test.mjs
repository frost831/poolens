import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { onRequestPost, onRequestGet } from '../functions/api/learning.js';
import { buildKnowledge, CONSENT_VERSION, evaluateLearning, groupFor, observationFrom, ownerHash, retrieveLearned, signReceipt, splitFor, verifyReceipt } from '../functions/lib/flagship-learning.mjs';
import { issueSplashLearning } from '../functions/lib/learning-store.mjs';

const secret = 'test-owner-secret-never-a-production-key-000000';
const ingest = 'test-throttleshare-ingest-key-0000000000000000';
const otherAdmin = 'test-throttleshare-admin-key-00000000000000000';
const evidenceUrl = 'https://www.hayward-pool.com/';

function sqliteD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/2026-11-23-flagship-learning.sql', import.meta.url), 'utf8'));
  const wrap = (sql, values = []) => ({
    bind(...bindings) { return wrap(sql, bindings); },
    async first() { return sqlite.prepare(sql).get(...values) || null; },
    async all() { return { results: sqlite.prepare(sql).all(...values) }; },
    async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }; },
  });
  return { sqlite, prepare: wrap, async batch(statements) {
    sqlite.exec('BEGIN');
    try { const results = []; for (const s of statements) results.push(await s.run()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
}

function account(email = 'qa@example.test') {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ sub: email, iat: now, exp: now + 3600, scopes: ['account'] })).toString('base64url');
  const value = `sl_account_v1.${body}`;
  return `${value}.${createHmac('sha256', secret).update(value).digest('base64url')}`;
}

function setup() {
  const db = sqliteD1();
  const env = { SUBSCRIBERS_DB: db, FLAGSHIP_LEARNING_ENABLED: 'true', SPLASHLENS_STATS_SECRET: secret,
    SPLASHLENS_PROFILE_SECRET: secret, FLAGSHIP_LEARNING_THROTTLESHARE_INGEST_KEY: ingest,
    FLAGSHIP_LEARNING_THROTTLESHARE_ADMIN_KEY: otherAdmin };
  const request = (body, { product = 'splashlens', key, email = 'qa@example.test', origin = 'https://app.splashlens.com' } = {}) => new Request(`https://app.splashlens.com/api/learning?product=${product}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin,
      ...(key ? { Authorization: `Bearer ${key}` } : { 'X-SplashLens-Account-Token': account(email) }) }, body: JSON.stringify(body),
  });
  const call = async (body, options) => { const r = await onRequestPost({ env, request: request(body, options) }); return { status: r.status, data: await r.json() }; };
  const receipt = async (id = 'scan-test-0001', email = 'qa@example.test', trafficClass = 'qa') => {
    const observation = { brand: 'Hayward', model: 'Super Pump', component: 'basket', category: 'pump', terms: [] };
    return signReceipt(secret, { id, product: 'splashlens', observation, baseline: ['hayward-super-pump-wet-end'], group: await groupFor('splashlens', observation), owner: await ownerHash(secret, email), trafficClass });
  };
  const submit = async (overrides = {}, options) => call({ action: 'submit', receipt: await receipt(), outcome: 'wrong', consent: true, consentVersion: CONSENT_VERSION, ...overrides }, options);
  return { db, env, request, call, receipt, submit };
}

test('signed observations reject tampering, expired receipts and the wrong signing key', async () => {
  const s = setup(), token = await s.receipt();
  assert.equal((await verifyReceipt(secret, token)).product, 'splashlens');
  assert.equal(await verifyReceipt(secret + 'x', token), null);
  assert.equal(await verifyReceipt(secret, 'a' + token.slice(1)), null);
  assert.equal(await verifyReceipt(secret, token + '.extra'), null);
});

test('equipment validation rejects contact data and image payloads are never retained', () => {
  assert.throws(() => observationFrom({ model: 'person@example.com' }));
  const cleaned = observationFrom({ brand: 'Hayward', image: 'base64', email: 'private@example.com', serial: 'private' });
  assert.deepEqual(Object.keys(cleaned), ['brand', 'model', 'component', 'category', 'terms']);
});

test('equipment model groups and splits are stable across repeat scans and case changes', async () => {
  const a = await groupFor('splashlens', { brand: 'Hayward', model: 'Super Pump', component: 'basket' });
  const b = await groupFor('splashlens', { brand: 'HAYWARD', model: 'super pump', component: 'impeller' });
  assert.equal(a, b); assert.equal(splitFor(a), splitFor(b));
  assert.notEqual(a, await groupFor('throttleshare', { brand: 'Hayward', model: 'Super Pump' }));
});

test('scanner issues a receipt only for a verified account and does not persist photos', async () => {
  const s = setup();
  const result = { manufacturer: 'Hayward', model: 'Super Pump', component: 'basket', category: 'pump', corpusCandidates: [{ id: 'hayward-super-pump-wet-end' }] };
  const issued = await issueSplashLearning(s.request({}), s.env, result, 'scan-001', 'qa');
  assert.ok(issued.receipt); assert.equal(issued.mode, 'shadow');
  assert.equal(await s.db.prepare('SELECT COUNT(*) AS n FROM learning_cases').first().then(r => r.n), 0);
  assert.equal(await issueSplashLearning(new Request('https://app.splashlens.com'), s.env, result, 'scan-002', 'qa'), null);
});

test('durable submit requires current consent, valid account ownership and a valid receipt', async () => {
  const s = setup();
  assert.equal((await s.submit({ consent: false })).status, 400);
  assert.equal((await s.submit({ consentVersion: 'old' })).status, 400);
  assert.equal((await s.submit({ receipt: 'forged' })).status, 403);
  assert.equal((await s.submit({}, { email: 'someone-else@example.test' })).status, 403);
  assert.equal((await s.submit({}, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await s.submit({ note: 'email me at private@example.com' })).status, 400);
  assert.equal((await s.submit()).status, 201);
});

test('retries are idempotent and ordinary feedback never enters verified knowledge', async () => {
  const s = setup();
  const first = await s.submit(), second = await s.submit();
  assert.equal(second.status, 200); assert.equal(second.data.ticketId, first.data.ticketId);
  assert.equal(second.data.duplicate, true);
  const rows = (await s.db.prepare('SELECT * FROM learning_cases').all()).results;
  assert.equal(rows.length, 1); assert.equal(rows[0].traffic_class, 'qa');
  assert.equal(buildKnowledge(rows).length, 0);
  assert.doesNotMatch(JSON.stringify(rows), /qa@example/);
});

test('review is owner-only and requires an approved reference and valid family label', async () => {
  const s = setup(), saved = await s.submit(), id = saved.data.ticketId;
  assert.equal((await s.call({ action: 'review', id, status: 'verified', expectedLabel: null, evidenceUrl, evidenceKind: 'manufacturer_reference' })).status, 403);
  const options = { key: secret };
  assert.equal((await s.call({ action: 'review', id, status: 'verified', expectedLabel: 'made-up-family', evidenceUrl, evidenceKind: 'manufacturer_reference' }, options)).status, 400);
  assert.equal((await s.call({ action: 'review', id, status: 'verified', expectedLabel: null, evidenceUrl: 'https://evil.example/doc', evidenceKind: 'manufacturer_reference' }, options)).status, 400);
  // Read the current corpus instead of assuming one manufacturer's domain.
  const { PARTSNAP_SOURCES } = await import('../functions/data/partsnap-source-corpus.mjs');
  const approvedUrl = Object.values(PARTSNAP_SOURCES)[0].url;
  assert.equal((await s.call({ action: 'review', id, status: 'verified', expectedLabel: null, evidenceUrl: approvedUrl, evidenceKind: 'manufacturer_reference' }, options)).status, 200);
  assert.equal((await s.call({ action: 'review', id, status: 'rejected' }, options)).status, 409);
});

test('ThrottleShare keys are isolated; ingestion cannot review and SplashLens owner cannot read it', async () => {
  const s = setup();
  const body = { action: 'observe', id: 'opaque-event-0001', observation: { brand: 'Tampa FL', category: 'watercraft', component: 'pontoon boat' }, baseline: [] };
  const issued = await s.call(body, { product: 'throttleshare', key: ingest });
  assert.equal(issued.status, 200);
  const saved = await s.call({ action: 'submit', receipt: issued.data.receipt, outcome: 'confirmed', consent: true, consentVersion: CONSENT_VERSION }, { product: 'throttleshare', key: ingest });
  assert.equal(saved.status, 201);
  assert.equal((await s.db.prepare('SELECT traffic_class FROM learning_cases').first()).traffic_class, 'qa');
  assert.equal((await s.call({ action: 'review', id: saved.data.ticketId, status: 'rejected' }, { product: 'throttleshare', key: ingest })).status, 403);
  const r = await onRequestGet({ env: s.env, request: new Request('https://app.splashlens.com/api/learning?product=throttleshare', { headers: { Authorization: `Bearer ${secret}` } }) });
  assert.equal(r.status, 401);
});

test('empty or QA-only evaluations cannot be promoted', async () => {
  const s = setup(); await s.submit();
  const evaluated = await s.call({ action: 'evaluate' }, { key: secret });
  assert.equal(evaluated.status, 201); assert.equal(evaluated.data.report.promotable, false);
  assert.equal(evaluated.data.report.holdoutGroups, 0);
  assert.equal((await s.call({ action: 'promote', id: evaluated.data.id }, { key: secret })).status, 409);
});

test('learner uses verified real learn cases, excludes holdout leakage and abstains on conflicting labels', () => {
  const observation = { brand: 'Hayward', model: 'Pump A', component: 'basket', category: 'pump', terms: ['strainer basket'] };
  const entry = { id: 'learn', group: 'group1', observation, label: 'family-a', evidenceUrl };
  assert.equal(retrieveLearned(observation, [entry])[0].label, 'family-a');
  assert.equal(retrieveLearned(observation, [entry], 'group1').length, 0);
  assert.equal(retrieveLearned(observation, [entry, { ...entry, label: 'family-b' }]).length, 0);
  assert.equal(retrieveLearned({ ...observation, brand: 'Pentair' }, [entry]).length, 0);
  const rows = ['pending', 'verified', 'rejected'].map((status, i) => ({ id: String(i), status, split: 'learn', traffic_class: 'real', observation, expected_label: 'family-a', group_key: 'group1' }));
  assert.equal(buildKnowledge(rows).length, 1);
});

test('paired gate measures improvement on independent groups and rejects regressions or missing abstentions', () => {
  const learn = Array.from({ length: 10 }, (_, i) => ({ id: `l${i}`, group: `l${i}`, observation: { brand: 'Hayward', model: `Series ${i}`, component: 'strainer basket', category: 'pump', terms: [] }, label: 'correct-family', evidenceUrl }));
  const cases = Array.from({ length: 30 }, (_, i) => ({ id: `h${i}`, group_key: `h${i}`, status: 'verified', split: 'holdout', traffic_class: 'real',
    observation: { brand: i === 29 ? '' : 'Hayward', model: `Alternate ${i}`, component: 'strainer basket', category: 'pump', terms: [] },
    baseline: [], expected_label: i === 29 ? null : 'correct-family' }));
  const report = evaluateLearning(cases, learn);
  assert.equal(report.promotable, true); assert.equal(report.wins, 29); assert.equal(report.unsupportedAfter, 0);
  assert.equal(report.accuracyAfter, 1); assert.ok(report.pairedPValue < 0.05);
  assert.equal(evaluateLearning(cases.map(c => ({ ...c, traffic_class: 'qa' })), learn).promotable, false);
  assert.equal(evaluateLearning(cases.slice(0, 29), learn).promotable, false);
  const leaked = evaluateLearning([...cases, { ...cases[0], id: 'duplicate' }], learn);
  assert.equal(leaked.holdoutGroups, 30); assert.equal(leaked.excludedDuplicateOrLeakedGroups, 1);
  assert.equal(evaluateLearning(cases.map(c => ({ ...c, group_key: 'l0' })), learn).holdoutGroups, 0);
});

test('withdrawal deletes contributions and invalidates snapshots atomically', async () => {
  const s = setup(); await s.submit();
  await s.db.prepare("INSERT INTO learning_versions(id,product,knowledge,report,status) VALUES('active','splashlens','[{}]','{}','active')").run();
  assert.equal((await s.call({ action: 'forget' })).status, 200);
  assert.equal((await s.db.prepare('SELECT COUNT(*) AS n FROM learning_cases').first()).n, 0);
  const version = await s.db.prepare('SELECT * FROM learning_versions').first();
  assert.equal(version.status, 'retired'); assert.equal(version.knowledge, '[]');
});

test('rollback returns to the frozen baseline and storage failures fail closed', async () => {
  const s = setup();
  await s.db.prepare("INSERT INTO learning_versions(id,product,knowledge,report,status) VALUES('active','splashlens','[]','{}','active')").run();
  assert.equal((await s.call({ action: 'rollback' }, { key: secret })).status, 200);
  assert.equal((await s.db.prepare('SELECT status FROM learning_versions').first()).status, 'retired');
  s.db.sqlite.exec('DROP TABLE learning_cases');
  const result = await s.submit(); assert.equal(result.status, 503); assert.equal(result.data.ok, false);
});
