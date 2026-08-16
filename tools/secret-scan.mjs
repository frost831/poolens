#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const SKIP_DIRS = new Set([
  '.git',
  '.wrangler',
  'node_modules',
  '_deploy',
  'dist',
  'build',
  '.secrets.local',
  'release-evidence',
  'app-review-evidence',
]);
const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.aab',
  '.apk',
  '.keystore',
  '.jks',
  '.mp4',
  '.mov',
]);

const SECRET_PATTERNS = [
  { id: 'stripe_secret_key', regex: /\bsk_(live|test)_[A-Za-z0-9]{24,}\b/g },
  { id: 'stripe_webhook_secret', regex: /\bwhsec_[A-Za-z0-9]{24,}\b/g },
  { id: 'sendgrid_api_key', regex: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
  { id: 'github_token', regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g },
  { id: 'aws_access_key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'private_key_block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
];

function ext(name) {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx).toLowerCase();
}

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(join(dir, entry.name), files);
    } else if (entry.isFile()) {
      if (SKIP_EXTENSIONS.has(ext(entry.name))) continue;
      const full = join(dir, entry.name);
      const info = await stat(full);
      if (info.size > 2_000_000) continue;
      files.push(full);
    }
  }
  return files;
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

const findings = [];
for (const file of await walk(root)) {
  let source = '';
  try {
    source = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of SECRET_PATTERNS) {
    for (const match of source.matchAll(pattern.regex)) {
      const value = match[0];
      if (/example|placeholder|your_|test-secret|whsec_test/i.test(value)) continue;
      const lineStart = source.lastIndexOf('\n', match.index || 0) + 1;
      const lineEnd = source.indexOf('\n', match.index || 0);
      const line = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd);
      if (pattern.id === 'private_key_block' && /replace\(\s*\/-----BEGIN /.test(line)) continue;
      findings.push({
        id: pattern.id,
        file: relative(root, file).replace(/\\/g, '/'),
        line: lineNumber(source, match.index || 0),
      });
    }
  }
}

if (findings.length) {
  console.error(JSON.stringify({ ok: false, findings }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, findings: [] }));
}
