import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const manifest = readFileSync(join(root, 'manifest.json'), 'utf8');
const androidWebManifest = readFileSync(join(root, 'android-twa', 'app', 'src', 'main', 'res', 'raw', 'web_app_manifest.json'), 'utf8');
const llms = readFileSync(join(root, 'llms.txt'), 'utf8');

test('all first-party scripts referenced by index.html exist as JavaScript files', () => {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((src) => src.startsWith('/js/'))
    .map((src) => src.replace(/^\//, '').split('?')[0]);

  assert.ok(scripts.length >= 5, 'expected the app shell to reference its first-party scripts');

  for (const script of scripts) {
    assert.ok(existsSync(join(root, script)), `${script} is referenced but missing`);
  }
});

test('field signals API methods used by app shell are implemented', () => {
  const fieldSignals = readFileSync(join(root, 'js', 'field-signals.js'), 'utf8');
  for (const method of [
    'openSignalCenter',
    'closeModal',
    'onTabShown',
    'onBrandSelected',
    'onCodeOpened',
    'onSearch',
    'onPoolViewed',
    'onEquipmentSaved',
    'scheduleNextVisitReminder',
    'onPartSnapResult',
    'offerSystemNotificationsAfterValue',
    'openPumpDecisionFromEquipment'
  ]) {
    assert.match(fieldSignals, new RegExp(`\\b${method}\\b`));
  }
});

test('public app metadata keeps field-entry claims conservative', () => {
  assert.doesNotMatch(manifest, /500\+ pool equipment error codes/i);
  assert.doesNotMatch(androidWebManifest, /500\+ pool equipment error codes/i);
  assert.doesNotMatch(llms, /500\+ error codes/i);
  assert.match(manifest, /230\+ pool and spa field reference entries/);
  assert.match(androidWebManifest, /230\+ pool and spa field reference entries/);
  assert.match(llms, /230\+ pool and spa field entries/);
});
