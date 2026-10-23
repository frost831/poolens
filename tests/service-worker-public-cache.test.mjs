import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

function worker(fetchResponse) {
  const handlers = {};
  const writes = [];
  const shell = new Response('<main>Offline app</main>', {
    headers: { 'Content-Type': 'text/html' },
  });
  const context = vm.createContext({
    URL, Response, Set,
    self: {
      location: { origin: 'https://app.splashlens.com' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
    },
    caches: {
      match: async key => key === '/' ? shell.clone() : undefined,
      open: async () => ({ put: async (key) => { writes.push(key); } }),
    },
    fetch: async () => fetchResponse,
  });
  vm.runInContext(source, context);
  return { handlers, writes };
}

async function request(workerState, path, mode = 'navigate') {
  let response;
  const pending = [];
  workerState.handlers.fetch({
    request: { method: 'GET', mode, url: `https://app.splashlens.com${path}`, headers: new Headers() },
    respondWith: promise => { response = promise; },
    waitUntil: promise => { pending.push(promise); },
  });
  if (response) await response;
  await Promise.all(pending);
  return response;
}

test('a protected no-store page is never written into the offline cache', async () => {
  const state = worker(new Response('<main>Private</main>', {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' },
  }));
  await request(state, '/dashboard');
  assert.deepEqual(state.writes, []);
});

test('a network failure on a non-app route does not display the offline app shell', async () => {
  const state = worker(Response.error());
  const response = await request(state, '/dashboard');
  assert.equal((await response).type, 'error');
  assert.deepEqual(state.writes, []);
});

test('the app root remains available offline', async () => {
  const state = worker(Response.error());
  const response = await request(state, '/?store=ios');
  assert.match(await (await response).text(), /Offline app/);
});

test('unlisted HTML is not cached as a static asset', async () => {
  const state = worker(new Response('<main>Private</main>'));
  await request(state, '/owner-dashboard.html', 'same-origin');
  assert.deepEqual(state.writes, []);
});

test('unlisted JSON outside the API is not cached', async () => {
  const state = worker(Response.json({ token: 'fixture' }));
  await request(state, '/private-data.json', 'same-origin');
  assert.deepEqual(state.writes, []);
});
