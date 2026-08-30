import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../functions/api/scan-entitlement.js', import.meta.url), 'utf8');

test('scan entitlement endpoint exposes a JSON GET auth boundary', () => {
  assert.match(source, /export async function onRequestGet/);
  assert.match(source, /hasAdminAccess\(request, env\)/);
  assert.match(source, /endpoint:\s*'scan-entitlement'/);
  assert.match(source, /Use POST with a valid admin secret/);
});

test('scan entitlement CORS advertises JSON API methods only', () => {
  assert.match(source, /'Access-Control-Allow-Methods':\s*'POST, OPTIONS'/);
  assert.match(source, /'Content-Type':\s*'application\/json'/);
});
