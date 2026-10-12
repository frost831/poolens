import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8');

test('Play-signed field app can verify its web origin', () => {
  const links = JSON.parse(read('.well-known', 'assetlinks.json'));
  const fieldApp = links.find(({ target }) => target.package_name === 'com.splashlens.fieldtools');
  assert.ok(fieldApp);
  assert.ok(fieldApp.relation.includes('delegate_permission/common.handle_all_urls'));
  assert.ok(fieldApp.target.sha256_cert_fingerprints.includes(
    'F9:A4:78:9A:32:C8:10:D6:C1:FC:8E:6A:39:26:79:25:61:C3:E9:E9:A1:5F:D0:9D:6C:5D:4C:36:CE:1A:2B:F7'
  ));
  assert.ok(links.some(({ target }) => target.package_name === 'com.splashlens.app'));
});

test('camera and autofocus remain optional for manual lookup devices', () => {
  const manifest = read('android-twa', 'app', 'src', 'main', 'AndroidManifest.xml');
  for (const feature of ['android.hardware.camera', 'android.hardware.camera.autofocus']) {
    assert.match(manifest, new RegExp(`<uses-feature android:name="${feature.replaceAll('.', '\\.')}" android:required="false"\\s*/>`));
  }
});
