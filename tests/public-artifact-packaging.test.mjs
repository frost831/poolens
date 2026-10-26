import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = path.join(root, 'tools/deploy-poolens-web.ps1');
const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';

async function inventory(directory) {
  return (await fs.readdir(directory, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => path.relative(directory, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .sort();
}

function stage(script) {
  return JSON.parse(execFileSync(shell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', script, '-StageOnly'], { encoding: 'utf8', timeout: 60000 }));
}

test('Pages targets the staged app and keeps deployment rooted beside Functions', async () => {
  const config = await fs.readFile(path.join(root, 'wrangler.toml'), 'utf8');
  assert.match(config, /^pages_build_output_dir = "_deploy\/poolens-web"$/m);
  assert.match(config, /binding = "SCAN_USAGE_KV"/);
  assert.match(config, /binding = "SUBSCRIBERS_DB"/);
  const script = await fs.readFile(scriptPath, 'utf8');
  assert.match(script, /Push-Location \$root/);
  assert.match(script, /pages deploy "_deploy\\poolens-web"/);
  assert.ok(script.indexOf('if ($StageOnly)') < script.indexOf('npx wrangler'));
  assert.doesNotMatch(script, /pages deploy\s+["']?\.["']?\s/);
});

test('CI requires artifact tests and stage-only packaging without upload bypasses', async () => {
  const workflowRoot = path.join(root, '.github/workflows');
  const workflow = await fs.readFile(path.join(workflowRoot, 'ci.yml'), 'utf8');
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  const gate = '      - name: Run public artifact packaging gate\n        run: node --test tests/public-artifact-packaging.test.mjs';
  const staging = '      - name: Stage public app assets without deployment\n        run: powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File tools/deploy-poolens-web.ps1 -StageOnly';
  const source = workflow.replaceAll('\r\n', '\n');
  assert.ok(source.includes(gate), 'artifact gate must not be conditional or continue-on-error');
  assert.ok(source.includes(staging), 'CI must stage without invoking deployment');
  assert.ok(source.indexOf(gate) < source.indexOf(staging));
  assert.ok(source.indexOf(staging) < source.indexOf('- name: Run app regression suite'));
  assert.doesNotMatch(source, /^\s*(?:if|continue-on-error):/m);
  for (const name of await fs.readdir(workflowRoot)) {
    if (!/\.ya?ml$/.test(name)) continue;
    const action = await fs.readFile(path.join(workflowRoot, name), 'utf8');
    assert.doesNotMatch(action, /\bpages\s+(?:deploy|publish)\b|cloudflare\/(?:pages|wrangler)-action/i, `${name}: CI must not upload outside the packaging gate`);
  }
});

test('stage-only packaging rejects private files and preserves public native associations', async t => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'splashlens-app-package-'));
  t.after(() => fs.rm(fixture, { recursive: true, force: true }));
  const keep = ['index.html', 'manifest.json', 'sw.js', 'data-deletion.html', '_headers', '_redirects',
    '_routes.json', 'js/app.js', 'js/reference.json', 'icons/icon.svg',
    '.well-known/assetlinks.json', '.well-known/apple-app-site-association'];
  const omit = ['package.json', 'package-lock.json', 'composer.json', 'wrangler.toml', '.env',
    'request.php', 'functions/api/events.js', 'docs/internal.html', 'ios/Private.swift',
    'migrations/private.sql', 'js/.env', 'js/config.json', 'js/package.json', 'js/composer.lock',
    'js/server.php', 'js/app.js.map', 'js/backup.db', 'js/src/server.js', 'js/tests/test.js',
    'icons/private.json', '.well-known/config.json'];
  for (const name of [...keep, ...omit, '_deploy/poolens-web/stale.php', '_deploy/other/keep.txt']) {
    const target = path.join(fixture, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, 'packaging fixture');
  }
  const script = path.join(fixture, 'tools/deploy-poolens-web.ps1');
  await fs.mkdir(path.dirname(script), { recursive: true });
  await fs.copyFile(scriptPath, script);
  const result = stage(script);
  assert.equal(result.output, path.join(fixture, '_deploy/poolens-web'));
  assert.deepEqual(await inventory(result.output), keep.sort());
  assert.equal(result.count, keep.length);
  assert.equal(await fs.readFile(path.join(fixture, '_deploy/other/keep.txt'), 'utf8'), 'packaging fixture');
  assert.equal(await fs.readFile(path.join(fixture, 'functions/api/events.js'), 'utf8'), 'packaging fixture');
  assert.equal(await fs.readFile(path.join(fixture, 'ios/Private.swift'), 'utf8'), 'packaging fixture');
});

test('the real app stages its shell, scripts and associations without touching Functions or iOS', async () => {
  const preserved = ['functions/api/events.js', 'ios/SplashLens/ContentView.swift',
    'android-twa/app/src/main/res/raw/web_app_manifest.json'];
  const before = await Promise.all(preserved.map(name => fs.readFile(path.join(root, name))));
  const result = stage(scriptPath);
  const files = await inventory(result.output);
  for (const name of ['index.html', 'dashboard.html', 'owner-dashboard.html', 'privacy.html',
    'data-deletion.html', 'manifest.json', 'sw.js', '_headers', '.well-known/assetlinks.json']) {
    assert.ok(files.includes(name), name);
  }
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  for (const match of html.matchAll(/src="\/(js\/[^"?]+)(?:\?[^\"]*)?"/g)) assert.ok(files.includes(match[1]), match[1]);
  assert.ok(!files.some(name => /^(?:functions|ios|android-twa|docs|tools|tests|migrations)\//.test(name)));
  assert.ok(!files.some(name => /(^|\/)(?:package(?:-lock)?\.json|composer\.(?:json|lock)|wrangler\.toml)$|\.(?:php|sql|db|map)$/.test(name)));
  for (const [index, name] of preserved.entries()) assert.deepEqual(await fs.readFile(path.join(root, name)), before[index]);
});

test('staging refuses a linked output parent without touching its target', async t => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'splashlens-app-linked-package-'));
  t.after(() => fs.rm(fixture, { recursive: true, force: true }));
  const outside = path.join(fixture, 'outside');
  const script = path.join(fixture, 'tools/deploy-poolens-web.ps1');
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, 'keep.txt'), 'packaging fixture');
  await fs.mkdir(path.dirname(script));
  await fs.copyFile(scriptPath, script);
  await fs.symlink(outside, path.join(fixture, '_deploy'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => stage(script), error => error.status !== 0 && /Unsafe staging directory/.test(error.stderr.toString()));
  assert.equal(await fs.readFile(path.join(outside, 'keep.txt'), 'utf8'), 'packaging fixture');
});
