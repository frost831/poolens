import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const config = fs.readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

function binding(section, field) {
  const header = `[[${section}]]`;
  const start = config.indexOf(header);
  assert.notEqual(start, -1, `Missing ${section}: preview would inherit production storage`);
  const body = config.slice(start + header.length).split(/\r?\n\s*\[/)[0];
  assert.match(body, /binding\s*=\s*"(?:SCAN_USAGE_KV|SUBSCRIBERS_DB)"/);
  const value = body.match(new RegExp(`^${field}\\s*=\\s*"([^"]+)"`, 'm'))?.[1];
  assert.ok(value, `${section}.${field} must be configured`);
  return value;
}

test('test-mode Pages deployments cannot inherit production entitlement or analytics storage', () => {
  const productionKv = binding('kv_namespaces', 'id');
  const previewKv = binding('env.preview.kv_namespaces', 'id');
  const productionDb = binding('d1_databases', 'database_id');
  const previewDb = binding('env.preview.d1_databases', 'database_id');
  assert.notEqual(previewKv, productionKv, 'Preview must use a separate KV namespace');
  assert.notEqual(previewDb, productionDb, 'Preview must use a separate D1 database');
  assert.match(previewKv, /^[a-f0-9]{32}$/);
  assert.match(previewDb, /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
});

test('Stripe credentials and prices stay in encrypted Pages settings rather than deployable config', () => {
  assert.doesNotMatch(config, /(?:sk|rk)_(?:test|live)_[A-Za-z0-9]|whsec_[A-Za-z0-9]/);
  assert.doesNotMatch(config, /^\s*(?:STRIPE_SECRET_KEY|(?:SPLASHLENS_)?STRIPE_WEBHOOK_SECRET|SPLASHLENS_STRIPE_PRICE_\w+)\s*=/m);
});
