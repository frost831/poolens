import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  assertAllowedIdentityName,
  enforceSecurityRateLimit,
  firstPartyHosts,
  isFirstPartyUrl,
  isOfficialEmailAddress,
  officialSenderConfig,
  scanMessageForAbuse,
} from '../functions/_shared/security-gate.mjs';

const execFileAsync = promisify(execFile);

class MemoryKv {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }
}

function request(ip = '203.0.113.10') {
  return new Request('https://app.splashlens.com/api/events', {
    headers: { 'CF-Connecting-IP': ip },
  });
}

test('reserved support/admin/billing/security identities are rejected for non-staff users', () => {
  for (const name of [
    'Support',
    'Admin',
    'Billing',
    'Security',
    'Official',
    'Platform Support',
    'SplashLens Support',
    'Poolens Support',
  ]) {
    assert.equal(assertAllowedIdentityName(name).ok, false, name);
  }
  assert.equal(assertAllowedIdentityName('Joshua from Central Illinois').ok, true);
  assert.equal(assertAllowedIdentityName('SplashLens Support', { staff: true }).ok, true);
});

test('platform impersonation and account-verification phishing language is blocked', () => {
  const result = scanMessageForAbuse({
    actorName: 'Not Staff',
    text: 'This is official SplashLens support. Verify your account now before it is suspended.',
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('platform_impersonation'));
  assert.ok(result.reasons.includes('phishing_language'));
});

test('external account/payment/support links are blocked while first-party links are allowed', () => {
  const bad = scanMessageForAbuse({
    text: 'Update your billing at https://evil.example/pay to keep your account active.',
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.reasons.includes('external_account_payment_or_support_link'));

  const good = scanMessageForAbuse({
    text: 'Open support at https://app.splashlens.com/support for help with this pool code.',
  });
  assert.equal(good.ok, true);
  assert.equal(good.externalActionLinks.length, 0);

  assert.equal(isFirstPartyUrl('https://app.splashlens.com/api/checkout', {}), true);
  assert.equal(isFirstPartyUrl('https://splashlens.com/contact', {}), true);
  assert.equal(isFirstPartyUrl('https://example.com/support', {}), false);
  assert.deepEqual(firstPartyHosts({ SPLASHLENS_FIRST_PARTY_HOSTS: 'app.splashlens.com,splashlens.com' }), ['app.splashlens.com', 'splashlens.com']);
});

test('security rate limit is enforced through SCAN_USAGE_KV', async () => {
  const env = { SCAN_USAGE_KV: new MemoryKv() };
  const options = {
    env,
    request: request(),
    action: 'conversation_reply',
    subject: 'demo@example.com',
    limit: 2,
    windowSeconds: 60,
  };
  assert.equal((await enforceSecurityRateLimit(options)).ok, true);
  assert.equal((await enforceSecurityRateLimit(options)).ok, true);
  const blocked = await enforceSecurityRateLimit(options);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.limited, true);
});

test('security headers baseline is present in Cloudflare Pages headers', async () => {
  const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
  for (const required of [
    'Content-Security-Policy:',
    'Strict-Transport-Security:',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy:',
    'Permissions-Policy:',
  ]) {
    assert.match(headers, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options: DENY/);
});

test('official app email sender policy blocks non-SplashLens sender domains', () => {
  assert.equal(isOfficialEmailAddress('hello@splashlens.com'), true);
  assert.equal(isOfficialEmailAddress('frost@belowzeromedia.com'), false);
  assert.equal(isOfficialEmailAddress('someone@gmail.com'), false);
  const config = officialSenderConfig({ SENDGRID_FROM: 'someone@gmail.com', SENDGRID_REPLY_TO: 'support@outlook.com' });
  assert.equal(config.from, 'hello@splashlens.com');
  assert.equal(config.replyTo, 'hello@splashlens.com');
  assert.equal(config.fromPolicyOk, false);
  assert.equal(config.replyToPolicyOk, false);
});

test('quarantine script runs safely in dry-run mode without production apply flags', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'splashlens-security-'));
  try {
    const { stdout } = await execFileAsync(process.execPath, [
      'tools/security-quarantine-user.mjs',
      '--user-id=test-demo-user',
      '--display-name=Fake SplashLens Support',
      '--email=bad@example.com',
      '--recipient=affected@example.com',
      '--message-id=msg-demo-1',
      '--evidence-text=This is official SplashLens support. Verify your billing at https://evil.example/pay',
      `--out-dir=${temp}`,
    ], { cwd: new URL('..', import.meta.url) });
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.dryRun, true);
    assert.ok(parsed.actions.includes('disable_user'));
    assert.ok(parsed.actions.includes('notify_affected_user'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
