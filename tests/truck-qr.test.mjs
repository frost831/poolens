import assert from 'node:assert/strict';
import test from 'node:test';
import qrcode from '../js/vendor/qrcode-generator.mjs';
import { createTruckQrSvg, downloadTruckQr, printTruckQr, TRUCK_QR_FILENAME, TRUCK_QR_URL } from '../js/truck-qr.js';

const EXPECTED_URL = 'https://app.splashlens.com/?open=last_pool&utm_source=truck_qr';

test('truck QR encodes only the exact public last-pool URL in a nonblank SVG', () => {
  assert.equal(TRUCK_QR_URL, EXPECTED_URL);
  const expectedQr = qrcode(0, 'M');
  expectedQr.addData(EXPECTED_URL, 'Byte');
  expectedQr.make();

  const svg = createTruckQrSvg({ poolName: 'Private Pool', customer: 'private@example.com' });
  assert.equal(svg, expectedQr.createSvgTag({
    cellSize: 10, margin: 40, title: 'SplashLens truck QR',
    alt: 'Scan to open the last pool in SplashLens',
  }));
  assert.match(svg, /^<svg\b[^>]*viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /<rect[^>]+fill="white"/);
  assert.match(svg, /<path d="M\d+,\d+/);
  assert.doesNotMatch(svg, /Private Pool|private@example\.com|customer=/);
  assert.equal(createTruckQrSvg(), svg);
});

test('download emits the local SVG as a file and releases its object URL', async () => {
  let blob;
  let clicked = false;
  let removed = false;
  let revoked = false;
  let release;
  const link = { click() { clicked = true; }, remove() { removed = true; } };
  const documentRef = {
    createElement(tag) { assert.equal(tag, 'a'); return link; },
    body: { appendChild(item) { assert.equal(item, link); } },
  };
  const urlApi = {
    createObjectURL(value) { blob = value; return 'blob:truck-qr'; },
    revokeObjectURL(value) { assert.equal(value, 'blob:truck-qr'); revoked = true; },
  };
  downloadTruckQr({ documentRef, urlApi, schedule(fn, delay) { assert.equal(delay, 1000); release = fn; } });

  assert.equal(link.download, TRUCK_QR_FILENAME);
  assert.equal(link.href, 'blob:truck-qr');
  assert.equal(blob.type, 'image/svg+xml;charset=utf-8');
  assert.equal(await blob.text(), createTruckQrSvg());
  assert.equal(clicked, true);
  assert.equal(removed, true);
  release();
  assert.equal(revoked, true);
});

test('print opens an offline sheet containing the QR and exact URL', () => {
  let html = '';
  let focused = false;
  let printed = false;
  let closed = false;
  let schedulePrint;
  const sheet = {
    document: { write(value) { html = value; }, close() { closed = true; } },
    focus() { focused = true; },
    print() { printed = true; },
  };
  const windowRef = {
    open(url, target) { assert.equal(url, ''); assert.equal(target, '_blank'); return sheet; },
    setTimeout(fn, delay) { assert.equal(delay, 100); schedulePrint = fn; },
  };
  assert.equal(printTruckQr({ windowRef }), true);
  assert.equal(closed, true);
  assert.match(html, /<svg\b/);
  assert.ok(html.includes(EXPECTED_URL.replace(/&/g, '&amp;')));
  assert.doesNotMatch(html, /<script|http-equiv="refresh"/i);
  schedulePrint();
  assert.equal(focused, true);
  assert.equal(printed, true);
  assert.equal(printTruckQr({ windowRef: { open: () => null } }), false);
});
