import assert from 'node:assert/strict';
import test from 'node:test';

import { amplitudeConfigPayload, forwardEventToAmplitude } from '../functions/_shared/amplitude.mjs';

test('Amplitude config is disabled without a Cloudflare secret', () => {
  const config = amplitudeConfigPayload({});
  assert.equal(config.enabled, false);
  assert.equal(config.keyExposed, false);
  assert.equal(Object.hasOwn(config, 'apiKey'), false);
  assert.equal(config.status, 'missing_api_key');
  assert.equal(config.ingestion, 'server_side_http_v2');
});

test('Amplitude config does not expose the project key when enabled', () => {
  const config = amplitudeConfigPayload({ AMPLITUDE_API_KEY: 'amp_test_key' });
  assert.equal(config.enabled, true);
  assert.equal(config.status, 'ready');
  assert.equal(config.keyExposed, false);
  assert.equal(Object.hasOwn(config, 'apiKey'), false);
});

test('Amplitude forwarding sends canonical SplashLens event shape', async () => {
  let captured;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    captured = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ code: 200, events_ingested: 1 }), { status: 200 });
  };

  try {
    const result = await forwardEventToAmplitude({
      AMPLITUDE_API_KEY: 'amp_test_key',
    }, {
      correlationId: 'event-test-12345',
      event: 'partsnap_result',
      source: 'app',
      path: '/?tab=scan&mode=parts',
      createdAt: '2026-08-06T10:00:00.000Z',
      propsJson: JSON.stringify({
        client_id: 'client-test-12345',
        session_id: 'session-test-12345',
        known_email: 'tech@example.com',
        known_company: 'Demo Pool Service',
        facility_id: 'facility-demo-1',
        splashlens_role: 'tech',
        corpus_status: 'source-backed candidates',
      }),
    });

    assert.equal(result.sent, true);
    assert.equal(captured.url, 'https://api2.amplitude.com/2/httpapi');
    assert.equal(captured.body.api_key, 'amp_test_key');
    assert.equal(captured.body.events[0].event_type, 'partsnap_result');
    assert.equal(captured.body.events[0].user_id, 'tech@example.com');
    assert.equal(captured.body.events[0].device_id, 'client-test-12345');
    assert.equal(captured.body.events[0].event_properties.product, 'splashlens');
    assert.equal(captured.body.events[0].user_properties.role, 'tech');
    assert.equal(captured.body.events[0].groups.company, 'Demo Pool Service');
    assert.equal(captured.body.events[0].groups.facility, 'facility-demo-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
