import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../functions/api/usage-pull.js', import.meta.url), 'utf8');

test('usage pull endpoint is protected by a pull or stats secret', () => {
  assert.match(source, /SPLASHLENS_PULL_SECRET/);
  assert.match(source, /SPLASHLENS_STATS_SECRET/);
  assert.match(source, /X-SplashLens-Pull-Secret/);
  assert.match(source, /return json\(401/);
});

test('usage pull endpoint returns aggregate funnel categories without raw identity dump', () => {
  for (const key of [
    'realTopEvents',
    'challengeEvents',
    'partSnapEvents',
    'facilityEvents',
    'feedbackEvents',
    'checkoutEvents',
    'knownUserSignalEvents',
    'knownSignalRate',
    'anonymousRealCount',
    'realTopSources',
    'realTopPaths',
    'realFunnelStages',
    'weakSpotScorecard',
    'recentSampleShape',
  ]) {
    assert.match(source, new RegExp(key));
  }
  assert.match(source, /propKeys/);
  assert.doesNotMatch(source, /known_email:\s*props\.known_email/);
});
