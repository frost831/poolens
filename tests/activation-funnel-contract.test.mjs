import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('app records the field challenge and attributed referral loop', () => {
  const app = read('../js/app.js');
  for (const signal of [
    'field_challenge_started',
    'field_challenge_routed',
    'field_challenge_completed',
    'referral_prompt_shown',
    'referral_share',
  ]) {
    assert.match(app, new RegExp(`['\"]${signal}['\"]`));
  }
  assert.match(app, /challenge_path/);
  assert.match(app, /pilot_id/);
  assert.match(app, /participant_id/);
  assert.match(app, /challenge_id/);
});

test('protected event summary exposes the activation funnel and excludes synthetic traffic', () => {
  const events = read('../functions/api/events.js');
  for (const key of [
    'funnelCampaignVisitors',
    'funnelAppStoreOpens',
    'funnelWorkflowCompleters',
    'funnelFeedbackSubmitters',
    'sevenDayReturningClients30d',
    'funnelPaidClients',
    'funnelFieldStories',
  ]) {
    assert.match(events, new RegExp(key));
  }
  assert.match(events, /isSyntheticEvent/);
  assert.match(events, /activationFunnel/);
  assert.match(events, /checkout_click/);
  assert.match(events, /checkoutStarts \+= 1/);
});

test('owner dashboard renders the activation target scorecard', () => {
  const dashboard = read('../dashboard.html');
  assert.match(dashboard, /id="activation-funnel"/);
  assert.match(dashboard, /function renderActivationFunnel/);
  assert.match(dashboard, /Demo and test traffic is excluded/);
  assert.match(dashboard, /id="analytics-wiring"/);
  assert.match(dashboard, /function renderAnalyticsWiring/);
  assert.match(dashboard, /Analytics \+ Payment Wiring/);
});
