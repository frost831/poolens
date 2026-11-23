#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { buildKnowledge, evaluateLearning } from '../functions/lib/flagship-learning.mjs';

const [command = 'help', ...args] = process.argv.slice(2);
if (command === 'replay') {
  if (!args[0]) throw new Error('Usage: node tools/flagship-learning.mjs replay cases.json [report.json]');
  const cases = JSON.parse(await readFile(args[0], 'utf8'));
  const report = evaluateLearning(cases, buildKnowledge(cases));
  const output = JSON.stringify(report, null, 2);
  if (args[1]) await writeFile(args[1], output + '\n');
  console.log(output);
  if (!report.promotable) process.exitCode = 2;
} else if (['status', 'evaluate', 'rollback', 'promote'].includes(command)) {
  const base = new URL(process.env.FLAGSHIP_LEARNING_URL || 'https://app.splashlens.com/api/learning');
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('HTTPS endpoint required.');
  base.searchParams.set('product', process.env.FLAGSHIP_LEARNING_PRODUCT || 'splashlens');
  const key = process.env.FLAGSHIP_LEARNING_ADMIN_KEY || process.env.SPLASHLENS_STATS_SECRET;
  if (!key) throw new Error('Set FLAGSHIP_LEARNING_ADMIN_KEY in the environment. Never pass a key on the command line.');
  const result = await fetch(base, { method: command === 'status' ? 'GET' : 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(command === 'status' ? {} : { body: JSON.stringify({ action: command, id: args[0] }) }), signal: AbortSignal.timeout(30000) });
  const data = await result.json();
  console.log(JSON.stringify(data, null, 2));
  if (!result.ok) process.exitCode = 1;
} else {
  console.log('Commands: status | evaluate | promote <version> | rollback | replay <cases.json> [report.json]\nEnvironment: FLAGSHIP_LEARNING_URL, FLAGSHIP_LEARNING_PRODUCT, FLAGSHIP_LEARNING_ADMIN_KEY');
}
