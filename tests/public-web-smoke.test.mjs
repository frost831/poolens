import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPublicPage, TARGETS } from '../tools/smoke-public-web.mjs';

test('public web smoke checks both exact domains without mutations', () => {
  assert.deepEqual(TARGETS.map(target => target.url), [
    'https://splashlens.com/', 'https://app.splashlens.com/',
  ]);
});

test('public web smoke accepts an expected HTML response', async () => {
  const result = await checkPublicPage(TARGETS[1], async (_url, options) => {
    assert.equal(options.method, 'GET');
    return new Response('<!doctype html><html><title>Splash Lens</title></html>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });
  assert.equal(result.ok, true);
});

test('public web smoke rejects an HTTP error', async () => {
  const result = await checkPublicPage(TARGETS[0], async () => new Response('unavailable', { status: 503 }));
  assert.deepEqual(result, { name: 'site', ok: false, reason: 'http_503' });
});
