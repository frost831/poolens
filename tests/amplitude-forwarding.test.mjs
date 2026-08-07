import assert from 'node:assert/strict';
import test from 'node:test';

import { amplitudeConfigPayload, forwardEventToAmplitude } from '../functions/_shared/amplitude.mjs';

test('Amplitude config is disabled without a Cloudflare secret', () => {
  const config = amplitudeConfigPayload({});
  assert.equal(config.enabled, false);
  assert.equal(config.apiKey, '');
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
  } finally {
    globalThis.fetch = originalFetch;
  }
});
