import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const eventsEndpoint = readFileSync(new URL('../functions/api/events.js', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

test('events endpoint accepts app analytics payload shapes', () => {
  assert.match(eventsEndpoint, /body\.event \|\| body\.name/);
  assert.match(eventsEndpoint, /plainObject\(body\.props\)/);
  assert.match(eventsEndpoint, /plainObject\(body\.properties\)/);
  assert.match(eventsEndpoint, /Event name required/);
});

test('events endpoint stores to D1 when the binding exists', () => {
  assert.match(eventsEndpoint, /SUBSCRIBERS_DB/);
  assert.match(eventsEndpoint, /CREATE TABLE IF NOT EXISTS events/);
  assert.match(eventsEndpoint, /INSERT INTO events/);
  assert.match(eventsEndpoint, /stored: true/);
});

test('app wrangler config declares the shared SplashLens events database binding', () => {
  assert.match(wrangler, /\[\[d1_databases\]\]/);
  assert.match(wrangler, /binding = "SUBSCRIBERS_DB"/);
  assert.match(wrangler, /database_name = "splashlens-subscribers"/);
  assert.match(wrangler, /database_id = "f474defb-4337-42ec-b143-7b37fc949761"/);
});
