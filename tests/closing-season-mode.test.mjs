import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('Closing Season Mode is exposed in app metadata and Service Proof UI', () => {
  const html = read('index.html');
  assert.match(html, /Closing Season Mode/);
  assert.match(html, /startServiceProofWorkflow\('closing'\)/);
  assert.match(html, /Winterize proof, drain plugs, cover, callback notes/);
});

test('closing workflow creates a proof packet path with source-boundary language', () => {
  const app = read('js/app.js');
  assert.match(app, /Closing Season Proof Packet/);
  assert.match(app, /Open closing checklist/);
  assert.match(app, /Build proof packet/);
  assert.match(app, /does not replace the exact equipment manual, local code, or qualified judgment/);
});

test('closing checklist is proof-first and avoids insurance guarantee language', () => {
  const data = read('js/data.js');
  assert.match(data, /window\.CLOSING_SEASON_PROOF/);
  assert.match(data, /Callback and insurance-ready documentation/);
  assert.match(data, /not a coverage guarantee/);
  assert.match(data, /Exact product manual and local code remain the source of truth/);
});

test('service worker cache is bumped for closing season app assets', () => {
  const sw = read('sw.js');
  assert.match(sw, /splashlens-v36-closing-season-mode/);
  assert.match(sw, /js\/data\.js\?v=20260823-closing-season-mode/);
  assert.match(sw, /js\/app\.js\?v=20260823-closing-season-mode/);
});
