import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('scan entitlement route returns JSON for GET instead of app-shell fallback', async () => {
  const routeSource = await readFile(new URL('../functions/api/scan-entitlement.js', import.meta.url), 'utf8');

  assert.match(routeSource, /export\s+async\s+function\s+onRequestGet/);
  assert.match(routeSource, /Use POST to create a SplashLens scan entitlement/);
  assert.match(routeSource, /405/);
});
