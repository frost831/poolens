import qrcode from './vendor/qrcode-generator.mjs';

export const TRUCK_QR_URL = 'https://app.splashlens.com/?open=last_pool&utm_source=truck_qr';
export const TRUCK_QR_FILENAME = 'splashlens-truck-qr.svg';

export function createTruckQrSvg() {
  const qr = qrcode(0, 'M');
  qr.addData(TRUCK_QR_URL, 'Byte');
  qr.make();
  return qr.createSvgTag({
    cellSize: 10,
    margin: 40,
    title: 'SplashLens truck QR',
    alt: 'Scan to open the last pool in SplashLens',
  });
}

export function downloadTruckQr({ documentRef = globalThis.document, urlApi = globalThis.URL, schedule = globalThis.setTimeout } = {}) {
  const blob = new Blob([createTruckQrSvg()], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = urlApi.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = objectUrl;
  link.download = TRUCK_QR_FILENAME;
  documentRef.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    schedule(() => urlApi.revokeObjectURL(objectUrl), 1000);
  }
}

export function printTruckQr({ windowRef = globalThis.window } = {}) {
  const sheet = windowRef.open('', '_blank');
  if (!sheet) return false;

  sheet.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>SplashLens Truck QR</title>
<style>
  @page { size: letter; margin: 0.5in; }
  body { margin: 0; font: 18px Arial, sans-serif; text-align: center; color: #111; }
  main { padding: 0.5in 0; }
  svg { display: block; width: 3.5in; height: 3.5in; margin: 0.3in auto; }
  p { font-size: 12px; overflow-wrap: anywhere; }
</style></head><body><main><h1>SplashLens</h1><div>${createTruckQrSvg()}</div>
<p>${TRUCK_QR_URL.replace(/&/g, '&amp;')}</p></main></body></html>`);
  sheet.document.close();
  windowRef.setTimeout(() => {
    sheet.focus();
    sheet.print();
  }, 100);
  return true;
}
