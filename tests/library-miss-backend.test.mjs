import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { onRequestPost as saveMiss, onRequestOptions } from '../functions/api/library-miss.js';
import { onRequestGet as getAdmin, onRequestPost as postAdmin } from '../functions/api/admin.js';

function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/2026-10-09-library-misses.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(query) {
      let values = [];
      return {
        bind(...items) { values = items; return this; },
        async run() { return { meta: { changes: Number(sql.prepare(query).run(...values).changes) } }; },
        async first() { return sql.prepare(query).get(...values) || null; },
        async all() { return { results: sql.prepare(query).all(...values) }; },
      };
    },
  };
  return { sql, env: { SUBSCRIBERS_DB: db, SPLASHLENS_STATS_SECRET: 'fixture-secret' } };
}

function missRequest(body, headers = {}) {
  return new Request('https://app.splashlens.com/api/library-miss', {
    method: 'POST', headers: {
      Origin: 'https://app.splashlens.com', 'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.42', 'User-Agent': 'Mozilla/5.0 Safari/605.1.15', ...headers,
    }, body: JSON.stringify(body),
  });
}

const miss = { trigger: 'code_no_hit', brand: 'Hayward', model: 'SP2600', query: 'E05' };

test('library miss is text only, hashed, classified and atomically limited per client', async (t) => {
  const { sql, env } = fixture();
  t.after(() => sql.close());
  assert.equal((await saveMiss({ request: missRequest(miss), env })).status, 201);
  const row = sql.prepare('SELECT * FROM library_misses').get();
  assert.match(row.client_hash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(row).includes('203.0.113.42'));
  assert.equal(row.traffic_class, 'real');
  assert.equal(row.status, 'new');
  assert.equal(row.photo_ref, null);
  for (let i = 1; i < 20; i += 1) assert.equal((await saveMiss({ request: missRequest(miss), env })).status, 201);
  assert.equal((await saveMiss({ request: missRequest(miss), env })).status, 429);
  assert.equal(Number(sql.prepare('SELECT COUNT(*) AS count FROM library_misses').get().count), 20);
  assert.equal((await saveMiss({ request: missRequest(miss, { 'CF-Connecting-IP': '203.0.113.43' }), env })).status, 201);
  assert.equal((await saveMiss({ request: missRequest({ ...miss, source: 'qa' }, { 'CF-Connecting-IP': '203.0.113.44' }), env })).status, 201);
  assert.equal((await saveMiss({ request: missRequest(miss, { 'CF-Connecting-IP': '203.0.113.45', 'User-Agent': 'curl/8.0' }), env })).status, 201);
  assert.deepEqual(sql.prepare('SELECT DISTINCT traffic_class FROM library_misses ORDER BY traffic_class').all().map((entry) => entry.traffic_class), ['bot', 'qa', 'real']);
});

test('library miss rejects cross-origin, missing client identity, PII, photo and malformed inputs', async (t) => {
  const { sql, env } = fixture();
  t.after(() => sql.close());
  const bad = [
    [missRequest(miss, { Origin: 'https://other.example' }), 403],
    [missRequest(miss, { 'Sec-Fetch-Site': 'cross-site' }), 403],
    [missRequest(miss, { 'CF-Connecting-IP': '' }), 503],
    [missRequest({ ...miss, trigger: 'other' }), 400],
    [missRequest({ ...miss, query: 'call me at 555-123-4567' }), 400],
    [missRequest({ ...miss, brand: 'tech@example.com' }), 400],
    [missRequest({ ...miss, query: '123 Main Street' }), 400],
    [missRequest({ ...miss, photo_ref: 'some-existing-photo' }), 400],
    [missRequest({ ...miss, photo: 'base64' }), 400],
    [missRequest({ ...miss, query: 'x'.repeat(121) }), 400],
    [missRequest({ trigger: 'code_no_hit', query: '' }), 400],
  ];
  for (const [request, expected] of bad) assert.equal((await saveMiss({ request, env })).status, expected);
  assert.equal(Number(sql.prepare('SELECT COUNT(*) AS count FROM library_misses').get().count), 0);
  assert.equal((await onRequestOptions({ request: new Request('https://app.splashlens.com/api/library-miss', { headers: { Origin: 'https://other.example' } }) })).status, 403);
});

test('admin lists seven-day top misses only with secret and updates status', async (t) => {
  const { sql, env } = fixture();
  t.after(() => sql.close());
  await saveMiss({ request: missRequest(miss), env });
  await saveMiss({ request: missRequest(miss), env });
  await saveMiss({ request: missRequest({ ...miss, source: 'qa' }, { 'CF-Connecting-IP': '203.0.113.44' }), env });
  sql.prepare(`INSERT INTO library_misses (id, created_at, "trigger", brand, model, query, client_hash, traffic_class)
    VALUES ('old', datetime('now', '-8 days'), 'code_no_hit', 'Hayward', 'SP2600', 'old-query', 'hash', 'real')`).run();
  const unauthorized = new Request('https://app.splashlens.com/api/admin');
  assert.equal((await getAdmin({ request: unauthorized, env })).status, 401);
  const authorized = () => new Request('https://app.splashlens.com/api/admin', { headers: { 'X-SplashLens-Stats-Secret': 'fixture-secret' } });
  const response = await getAdmin({ request: authorized(), env });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.libraryMisses.length, 1);
  assert.equal(data.libraryMisses[0].count, 2);
  assert.equal(data.libraryMisses[0].status, 'new');
  assert.ok(!JSON.stringify(data.libraryMisses).includes('client_hash'));
  const update = new Request('https://app.splashlens.com/api/admin', { method: 'POST', headers: {
    'Content-Type': 'application/json', 'X-SplashLens-Stats-Secret': 'fixture-secret',
  }, body: JSON.stringify({ action: 'update_library_miss_status', ...miss, status: 'reviewing' }) });
  const unauthenticatedUpdate = new Request('https://app.splashlens.com/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_library_miss_status', ...miss, status: 'resolved' }) });
  assert.equal((await postAdmin({ request: unauthenticatedUpdate, env })).status, 401);
  assert.equal((await postAdmin({ request: update, env })).status, 200);
  assert.equal(sql.prepare("SELECT status FROM library_misses WHERE id = 'old'").get().status, 'new');
  assert.equal(sql.prepare("SELECT COUNT(*) AS count FROM library_misses WHERE status = 'reviewing'").get().count, 2);
  assert.equal(sql.prepare("SELECT status FROM library_misses WHERE traffic_class = 'qa'").get().status, 'new');
  assert.equal((await getAdmin({ request: authorized(), env }).then((r) => r.json())).libraryMisses[0].status, 'reviewing');
});

test('owner dashboard renders library miss status control without raw server HTML', () => {
  const html = readFileSync(new URL('../owner-dashboard.html', import.meta.url), 'utf8');
  assert.match(html, /id="libraryMisses"/);
  assert.match(html, /update_library_miss_status/);
  assert.match(html, /esc\(r\.query \|\| r\.model \|\| r\.brand\)/);
});
