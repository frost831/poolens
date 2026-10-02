import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../functions/api/scan-entitlement.js', import.meta.url), 'utf8');
const scanSource = fs.readFileSync(new URL('../functions/api/scan.js', import.meta.url), 'utf8');

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

test('legacy account tokens cannot bypass the one-day scanner session age', () => {
  assert.match(scanSource, /ACCOUNT_TOKEN_MAX_AGE_SECONDS = 24 \* 60 \* 60/);
  assert.match(scanSource, /parts\[0\] === ACCOUNT_TOKEN_PREFIX/);
  assert.match(scanSource, /nowSeconds - Number\(payload\.iat\) > ACCOUNT_TOKEN_MAX_AGE_SECONDS/);
});
