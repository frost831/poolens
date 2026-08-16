#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { officialSenderConfig, scanMessageForAbuse } from '../functions/_shared/security-gate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback = '') {
  const exact = process.argv.find((item) => item === `--${name}`);
  if (exact) return 'true';
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function listArg(name) {
  return process.argv
    .filter((item) => item.startsWith(`--${name}=`))
    .map((item) => item.slice(name.length + 3))
    .filter(Boolean);
}

function clean(value, max = 300) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function namespaceId() {
  const toml = await readFile(resolve(root, 'wrangler.toml'), 'utf8').catch(() => '');
  const match = toml.match(/binding\s*=\s*"SCAN_USAGE_KV"[\s\S]*?id\s*=\s*"([^"]+)"/);
  return match?.[1] || '';
}

function kvPut(namespace, key, value) {
  const result = spawnSync('npx', ['wrangler', 'kv', 'key', 'put', key, value, '--namespace-id', namespace], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stderr: clean(result.stderr, 1000),
    stdout: clean(result.stdout, 1000),
  };
}

function buildPlan(input) {
  const now = new Date().toISOString();
  const abuse = scanMessageForAbuse({
    text: input.evidenceText,
    actorName: input.displayName,
    actorIsStaff: false,
    env: {},
    context: 'quarantine_script',
  });
  const userId = clean(input.userId, 180);
  const recipients = input.recipients.map((recipient) => clean(recipient, 180)).filter(Boolean);
  const messageIds = input.messageIds.map((messageId) => clean(messageId, 180)).filter(Boolean);
  return {
    ok: Boolean(userId),
    dryRun: input.dryRun,
    auditId: `secq-${Date.now().toString(36)}`,
    createdAt: now,
    target: {
      userId,
      displayName: clean(input.displayName, 120),
      email: clean(input.email, 180).toLowerCase(),
    },
    reason: clean(input.reason || abuse.reasons.join(', ') || 'manual_security_quarantine', 240),
    abuse,
    actions: [
      { type: 'disable_user', key: `security-quarantine:user:${userId}`, value: { status: 'disabled', createdAt: now } },
      { type: 'revoke_sessions', key: `security-quarantine:session-revoke:${userId}`, value: { revokeBefore: now, createdAt: now } },
      ...messageIds.map((messageId) => ({
        type: 'hide_message',
        key: `security-quarantine:message:${messageId}`,
        value: { hidden: true, reason: input.reason, createdAt: now },
      })),
      ...recipients.map((recipient) => ({
        type: 'block_recipient_contact',
        key: `security-quarantine:block:${recipient}:${userId}`,
        value: { blocked: true, recipient, userId, createdAt: now },
      })),
      ...recipients.map((recipient) => ({
        type: 'notify_affected_user',
        recipient,
        officialFrom: officialSenderConfig(process.env).from,
        value: {
          template: 'security_notice_affected_user',
          subject: 'SplashLens security notice',
          body: 'SplashLens blocked an account that may have impersonated support. Only trust account, payment, or support links on splashlens.com or app.splashlens.com.',
          createdAt: now,
        },
      })),
      { type: 'write_audit_record', key: `security-audit:${now}:${userId}`, value: { createdAt: now, userId, recipients, messageIds, reason: input.reason, abuse } },
    ],
  };
}

async function main() {
  const dryRun = arg('apply') !== 'true';
  const input = {
    dryRun,
    userId: arg('user-id') || arg('user') || '',
    displayName: arg('display-name') || arg('name') || '',
    email: arg('email') || '',
    reason: arg('reason') || '',
    evidenceText: arg('evidence-text') || '',
    recipients: listArg('recipient'),
    messageIds: listArg('message-id'),
  };
  const plan = buildPlan(input);
  if (!plan.ok) {
    console.error(JSON.stringify({ ok: false, error: 'user_id_required', dryRun }, null, 2));
    process.exitCode = 2;
    return;
  }

  const outDir = resolve(root, arg('out-dir') || join('docs', 'security'));
  const outFile = resolve(outDir, `${plan.auditId}-${dryRun ? 'dry-run' : 'applied'}-quarantine.json`);
  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(plan, null, 2) + '\n');

  if (!dryRun) {
    if (arg('i-understand-production-change') !== 'true') {
      console.error(JSON.stringify({ ok: false, error: 'missing_i_understand_production_change', planFile: outFile }, null, 2));
      process.exitCode = 2;
      return;
    }
    const namespace = await namespaceId();
    if (!namespace) {
      console.error(JSON.stringify({ ok: false, error: 'scan_usage_kv_namespace_not_found', planFile: outFile }, null, 2));
      process.exitCode = 2;
      return;
    }
    const writes = plan.actions
      .filter((action) => action.key)
      .map((action) => kvPut(namespace, action.key, JSON.stringify(action.value)));
    const failed = writes.filter((write) => !write.ok);
    console.log(JSON.stringify({ ok: failed.length === 0, dryRun, planFile: outFile, writes }, null, 2));
    process.exitCode = failed.length ? 1 : 0;
    return;
  }

  console.log(JSON.stringify({ ok: true, dryRun, planFile: outFile, actions: plan.actions.map((action) => action.type) }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: clean(error?.message || error, 500) }, null, 2));
  process.exitCode = 1;
});
