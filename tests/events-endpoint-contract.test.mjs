import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const eventsEndpoint = readFileSync(new URL('../functions/api/events.js', import.meta.url), 'utf8');
const amplitudeConfig = readFileSync(new URL('../functions/api/amplitude-config.js', import.meta.url), 'utf8');
const amplitudeShared = readFileSync(new URL('../functions/_shared/amplitude.mjs', import.meta.url), 'utf8');
const statsEndpoint = readFileSync(new URL('../functions/api/stats.js', import.meta.url), 'utf8');
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

test('app API routes expose protected stats and server-side amplitude config as JSON', () => {
  assert.match(amplitudeConfig, /amplitudeConfigPayload/);
  assert.match(amplitudeShared, /product: 'app'/);
  assert.match(statsEndpoint, /export async function onRequestGet/);
  assert.match(statsEndpoint, /Unauthorized/);
  assert.match(statsEndpoint, /EXTERNAL_EVENT_FILTER/);
  assert.match(statsEndpoint, /amplitude_readiness_smoke/);
  assert.match(statsEndpoint, /release_gate_live_custom_domain/);
  assert.match(statsEndpoint, /headless/);
  assert.match(statsEndpoint, /suspectNonSplashLensPaymentRows/);
});

test('events endpoint normalizes identity and suppresses internal heartbeat noise', () => {
  assert.match(eventsEndpoint, /normalizeIdentityProps/);
  assert.match(eventsEndpoint, /known_email/);
  assert.match(eventsEndpoint, /known_company/);
  assert.match(eventsEndpoint, /identity_confidence/);
  assert.match(eventsEndpoint, /internal_heartbeat_noise/);
  assert.match(eventsEndpoint, /forwardEventToAmplitude/);
});

test('app wrangler config declares the shared SplashLens events database binding', () => {
  assert.match(wrangler, /\[\[d1_databases\]\]/);
  assert.match(wrangler, /binding = "SUBSCRIBERS_DB"/);
  assert.match(wrangler, /database_name = "splashlens-subscribers"/);
  assert.match(wrangler, /database_id = "f474defb-4337-42ec-b143-7b37fc949761"/);
});
