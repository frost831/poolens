import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import vm from 'node:vm';
import { onRequestPost } from '../functions/api/field-followup.js';
import { onRequestGet as getAdmin } from '../functions/api/admin.js';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function sourceFunction(name, isAsync = false) {
  const match = app.match(new RegExp(`^${isAsync ? 'async ' : ''}function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `${name} exists`);
  return match[0];
}

function database() {
  const sql = new DatabaseSync(':memory:');
  return {
    sql,
    env: {
      SPLASHLENS_STATS_SECRET: 'fixture-secret',
      SUBSCRIBERS_DB: {
        prepare(query) {
          let values = [];
          return {
            bind(...args) { values = args; return this; },
            async run() { return { meta: { changes: Number(sql.prepare(query).run(...values).changes) } }; },
            async first() { return sql.prepare(query).get(...values) || null; },
            async all() { return { results: sql.prepare(query).all(...values) }; },
          };
        },
      },
    },
  };
}

function request(body, overrides = {}) {
  return new Request('https://app.splashlens.com/api/field-followup', {
    method: 'POST', headers: {
      Origin: 'https://app.splashlens.com', 'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.5', ...overrides,
    }, body: JSON.stringify(body),
  });
}

test('first-open task choices route to checklist, chlorine/salt math and PartSnap', () => {
  assert.match(html, /id="first-open-starts"/);
  for (const path of ['closing', 'chlorine', 'salt', 'partsnap']) assert.match(html, new RegExp(`openFirstStart\\('${path}'\\)`));
  const routes = [];
  const elements = {
    'dose-param': { value: '', scrollIntoView() {}, focus() {} },
    'salt-calculator': { scrollIntoView() {}, focus() {} },
  };
  const context = vm.createContext({
    document: { getElementById: id => elements[id] },
    trackSplashLensEvent: (name, props) => routes.push([name, props.path]),
    trackFirstActionStarted: () => {}, getSplashLensRole: () => 'tech',
    showTab: tab => routes.push(tab), switchClType: type => routes.push(type),
    setScanMode: mode => routes.push(mode), onParamChange: () => routes.push('param'),
  });
  vm.runInContext(sourceFunction('openFirstStart'), context);
  for (const path of ['closing', 'chlorine', 'salt', 'partsnap']) context.openFirstStart(path);
  assert.deepEqual(routes.filter(item => typeof item === 'string'), ['guide', 'closing', 'dosing', 'param', 'dosing', 'scan', 'parts']);
  assert.equal(elements['dose-param'].value, 'fc');
});

test('salt math requires measured inputs and never suggests an addition above target', () => {
  const fields = {
    'salt-volume': { value: '15000' }, 'salt-current': { value: '2800' },
    'salt-target': { value: '3200' }, 'salt-result': { textContent: '' },
  };
  const useful = [];
  const context = vm.createContext({
    document: { getElementById: id => fields[id] },
    trackFirstUsefulResult: (...args) => useful.push(args[0]),
  });
  vm.runInContext(sourceFunction('calculateSaltAdjustment'), context);
  context.calculateSaltAdjustment();
  assert.match(fields['salt-result'].textContent, /49\.8 lb/);
  assert.deepEqual(useful, ['salt_calculator']);
  fields['salt-current'].value = '3300';
  context.calculateSaltAdjustment();
  assert.match(fields['salt-result'].textContent, /No salt addition/);
  fields['salt-current'].value = '';
  context.calculateSaltAdjustment();
  assert.match(fields['salt-result'].textContent, /Enter a valid volume/);
  assert.deepEqual(useful, ['salt_calculator']);
});

test('store lead and PartSnap notification are stored with bounds, dedupe and origin protection', async t => {
  const { sql, env } = database();
  t.after(() => sql.close());
  const lead = { kind: 'pro_link', store: 'ios', email: 'Tech@example.com' };
  assert.equal((await onRequestPost({ request: request(lead), env })).status, 201);
  assert.equal((await onRequestPost({ request: request(lead), env })).status, 429);
  const miss = { kind: 'partsnap_miss', store: 'web', email: 'tech@example.com', brand: 'Pentair', model: 'VSF 3', query: 'pump lid' };
  assert.equal((await onRequestPost({ request: request(miss), env })).status, 201);
  const rows = sql.prepare('SELECT kind, email, store, model, client_hash FROM field_followup_requests ORDER BY created_at').all();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].email, 'tech@example.com');
  assert.equal(rows[1].model, 'VSF 3');
  assert.match(rows[0].client_hash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(rows).includes('203.0.113.5'));
  const adminUrl = 'https://app.splashlens.com/api/admin';
  assert.equal((await getAdmin({ request: new Request(adminUrl), env })).status, 401);
  const admin = await getAdmin({ request: new Request(adminUrl, { headers: { 'X-SplashLens-Stats-Secret': 'fixture-secret' } }), env });
  assert.equal(admin.status, 200);
  const snapshot = await admin.json();
  assert.equal(snapshot.totals.followupOpen, 2);
  assert.equal(snapshot.recentFollowups.length, 2);
  assert.ok(!JSON.stringify(snapshot.recentFollowups).includes('client_hash'));
  for (const [body, headers, status] of [
    [lead, { Origin: 'https://other.example' }, 403],
    [lead, { 'Sec-Fetch-Site': 'cross-site' }, 403],
    [{ ...lead, store: 'web' }, {}, 400],
    [{ ...lead, email: 'bad' }, {}, 400],
    [{ ...miss, query: 'call 555-123-4567' }, {}, 400],
    [{ ...miss, photo: 'base64', query: '' }, {}, 400],
  ]) {
    assert.equal((await onRequestPost({ request: request(body, headers), env })).status, status);
  }
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM field_followup_requests').get().n, 2);
});

test('store follow-up records success event only after accepted storage', async () => {
  const events = [];
  const posted = [];
  let accepted = true;
  const context = vm.createContext({
    getStoreShellMode: () => 'ios', getSplashLensRole: () => 'tech',
    openSplashLensSheet: async () => ({ email: 'Tech@example.com' }),
    fetch: async (_url, options) => { posted.push(JSON.parse(options.body)); return { ok: accepted, json: async () => ({ ok: accepted }) }; },
    rememberSplashLensIdentity: () => {}, trackSplashLensEvent: name => events.push(name),
    showSplashLensNotice: () => {},
  });
  vm.runInContext(sourceFunction('captureFieldFollowup', true), context);
  assert.equal(await context.captureFieldFollowup('pro_link'), true);
  assert.equal(posted[0].store, 'ios');
  assert.deepEqual(events, ['paid_lane_lead_captured']);
  accepted = false;
  assert.equal(await context.captureFieldFollowup('partsnap_miss', { query: 'pump lid' }), false);
  assert.deepEqual(events, ['paid_lane_lead_captured']);
  const storeBranch = app.slice(app.indexOf('function showScanLimitModal('), app.indexOf('function sanitizeAnalyticsProps(', app.indexOf('function showScanLimitModal(')));
  assert.match(storeBranch, /Email me my Pro link/);
  assert.match(app, /Type a model number instead/);
  assert.match(app, /We'll add this part, notify me/);
});
