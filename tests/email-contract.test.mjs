import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

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
