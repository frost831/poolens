import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { isOfficialEmailAddress, officialSenderConfig } from '../functions/_shared/security-gate.mjs';

const files = [
  new URL('../functions/api/stripe-webhook.js', import.meta.url),
  new URL('../functions/api/restore-entitlement.js', import.meta.url),
];

test('buyer activation and restore emails include reply-to and multipart content', async () => {
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /reply_to:\s*\{\s*email:\s*config\.replyTo/);
    assert.match(source, /type:\s*'text\/plain'/);
    assert.match(source, /type:\s*'text\/html'/);
    assert.match(source, /width=device-width/);
  }
});

test('checkout activation mail is suppressed on webhook retries', async () => {
  const source = await readFile(files[0], 'utf8');
  assert.match(source, /email:checkout-activation:/);
  assert.match(source, /deduplicated: true/);
  assert.match(source, /expirationTtl: 365 \* 24 \* 60 \* 60/);
});

test('app-owned email sends use stable template ids and per-send correlation ids', async () => {
  const sources = await Promise.all([
    '../functions/api/stripe-webhook.js',
    '../functions/api/restore-entitlement.js',
    '../functions/api/waitlist.js',
    '../functions/api/events.js',
    '../functions/api/partsnap-feedback.js',
    '../functions/_shared/security-gate.mjs',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')));
  const source = sources.join('\n');
  for (const templateId of [
    'paid_activation',
    'paid_activation_owner_alert',
    'paid_refund',
    'paid_refund_owner_alert',
    'entitlement_restore',
    'waitlist_owner_alert',
    'paid_lane_request_confirmation',
    'event_owner_alert',
    'event_digest',
    'partsnap_feedback',
    'security_gate_alert',
  ]) {
    assert.match(source, new RegExp(`template_id: ['"]${templateId}['"]|['"]${templateId}['"]`));
  }
  assert.doesNotMatch(source, /template_id:\s*categories\[0\]/);
  assert.doesNotMatch(source, /correlation_id:\s*record\.correlationId/);
  assert.doesNotMatch(source, /correlation_id:\s*record\.id/);
  assert.match(source, /stripe_session_id:/);
  assert.match(source, /event_type:/);
  assert.match(source, /feedback_id:/);
});

test('official app notices are constrained to the SplashLens sender domain', () => {
  assert.equal(isOfficialEmailAddress('hello@splashlens.com'), true);
  assert.equal(isOfficialEmailAddress('support@splashlens.com'), true);
  assert.equal(isOfficialEmailAddress('frost@belowzeromedia.com'), false);
  assert.equal(isOfficialEmailAddress('joshua@gmail.com'), false);

  const sender = officialSenderConfig({
    SENDGRID_FROM: 'frost@belowzeromedia.com',
    SENDGRID_REPLY_TO: 'support@outlook.com',
  });
  assert.equal(sender.from, 'hello@splashlens.com');
  assert.equal(sender.replyTo, 'hello@splashlens.com');
  assert.equal(sender.fromPolicyOk, false);
  assert.equal(sender.replyToPolicyOk, false);
});
