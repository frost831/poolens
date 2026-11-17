import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { onRequestGet } from '../functions/api/account.js';

const secret = 'account-isolation-test-only-secret'.repeat(2);
function fixture(t) {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`CREATE TABLE events (
    event TEXT, mode TEXT, path TEXT, props TEXT,
    created_at TEXT DEFAULT '2026-11-17T00:00:00Z'
  )`);
  t.after(() => sql.close());
  const db = { prepare(query) {
    return {
      bind(...args) { this.args = args; return this; },
      async first() { return sql.prepare(query).get(...(this.args || [])); },
      async all() { return { results: sql.prepare(query).all(...(this.args || [])) }; },
      async run() { return sql.prepare(query).run(...(this.args || [])); },
    };
  } };
  return {
    event(name, props) { sql.prepare('INSERT INTO events (event, mode, path, props) VALUES (?, ?, ?, ?)').run(name, 'account', '/api/account', typeof props === 'string' ? props : JSON.stringify(props)); },
    async account(email) {
      const now = Math.floor(Date.now() / 1000);
      const payload = Buffer.from(JSON.stringify({ sub: email, scopes: ['account'], iat: now, exp: now + 3600 })).toString('base64url');
      const signed = `sl_account_v1.${payload}`;
      const token = `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
      const response = await onRequestGet({
        request: new Request('https://app.splashlens.com/api/account', { headers: { 'X-SplashLens-Account-Token': token } }),
        env: { SPLASHLENS_PROFILE_SECRET: secret, SUBSCRIBERS_DB: db },
      });
      assert.equal(response.status, 200);
      return response.json();
    },
  };
}

test('account activity matches the exact event owner, not another email or arbitrary text', async t => {
  const f = fixture(t);
  f.event('own_profile', { known_email: 'ann@example.com' });
  f.event('own_team_action', { actor_email: 'ANN@EXAMPLE.COM' });
  f.event('other_account', { known_email: 'joann@example.com' });
  f.event('unrelated_note', { note: 'Ask ann@example.com about this other account' });
  f.event('other_actor_invited_me', { actor_email: 'other@example.com', email: 'ann@example.com' });
  f.event('malformed_legacy_row', '{"known_email":"ann@example.com"');
  const result = await f.account('ann@example.com');
  assert.deepEqual(result.recentEvents.map(event => event.event).sort(), ['own_profile', 'own_team_action']);
  assert.equal(result.email, 'ann@example.com');
});

test('account activity preserves exact email punctuation and skips malformed legacy rows', async t => {
  const f = fixture(t);
  f.event('own_punctuation', { known_email: 'qa_%+tag@example.com' });
  f.event('stripped_address', { known_email: 'qa+tag@example.com' });
  f.event('foreign_prefix', { known_email: 'other-qa_%+tag@example.com' });
  f.event('invalid_json', '{not json');
  f.event('unattributed', {});
  const result = await f.account('qa_%+tag@example.com');
  assert.deepEqual(result.recentEvents.map(event => event.event), ['own_punctuation']);
});
