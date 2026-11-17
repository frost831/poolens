import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));

for (const width of [390, 1365]) test(`sheet actions remain tappable when the keyboard shrinks only the visual viewport at ${width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
  const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
  try {
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'https://splashlens-app.test' || url.pathname.startsWith('/api/')) return route.abort();
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1), file = resolve(root, name);
      if (!file.startsWith(resolve(root) + sep) || !/^(index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name)) return route.abort();
      try { return route.fulfill({ contentType: /\.m?js$/.test(file) ? 'text/javascript' : /\.html$/.test(file) ? 'text/html' : 'application/json', body: readFileSync(file) }); } catch { return route.abort(); }
    });
    await page.goto('https://splashlens-app.test/?store=android&utm_source=qa');
    await page.waitForFunction(() => typeof openSplashLensSheet === 'function');
    await page.evaluate(() => {
      closeSplashLensSheet();
      const viewport = new EventTarget(); viewport.height = 280; viewport.offsetTop = 64;
      window.__qaViewport = viewport;
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
      const keyboard = document.createElement('div'); keyboard.id = 'qa-keyboard';
      keyboard.style.cssText = 'position:fixed;left:0;right:0;top:344px;bottom:0;z-index:20000;background:#333;'; document.body.append(keyboard);
      window.__sheetOutcome = 'pending';
      openSplashLensSheet({ title: 'Verify your SplashLens email.', body: 'Account verification. '.repeat(30), fields: [{ name: 'email', label: 'Work email', type: 'email' }], primaryLabel: 'Email my code', secondaryLabel: 'Not now' }).then(value => { window.__sheetOutcome = value; });
    });
    await page.getByLabel('Work email', { exact: true }).focus();
    const cancel = page.getByRole('button', { name: 'Not now', exact: true });
    const box = await cancel.boundingBox();
    assert.ok(box.y >= 64 && box.y + box.height <= 344, 'cancel must fit above the keyboard without changing the layout viewport');
    assert.ok(box.height >= 44, 'cancel retains a usable touch target');
    await cancel.click();
    await page.waitForFunction(() => window.__sheetOutcome === null);
    await page.evaluate(() => {
      document.getElementById('qa-keyboard').style.top = '192px';
      __qaViewport.height = 168; __qaViewport.offsetTop = 24;
      window.__sheetOutcome = 'pending';
      openSplashLensSheet({ title: 'Verify', fields: [{ name: 'email', label: 'Work email', type: 'email' }], primaryLabel: 'Continue' }).then(value => { window.__sheetOutcome = value; });
      __qaViewport.dispatchEvent(new Event('resize'));
    });
    await page.evaluate(() => { document.getElementById('splashlens-sheet-email').focus(); __qaViewport.dispatchEvent(new Event('resize')); });
    const fieldFits = await page.evaluate(() => {
      const field = document.getElementById('splashlens-sheet-email').getBoundingClientRect();
      const area = document.querySelector('[data-sheet-content]').getBoundingClientRect();
      return field.top >= area.top - 1 && field.bottom <= area.bottom + 1 && field.height >= 44;
    });
    assert.equal(fieldFits, true, 'the email field remains fully readable on the shortest Android keyboard viewport');
    await page.getByLabel('Work email', { exact: true }).fill('qa@example.com');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.waitForFunction(() => window.__sheetOutcome?.email === 'qa@example.com');
    assert.equal(await page.locator('#splashlens-sheet').count(), 0);
    await page.evaluate(() => { __qaViewport.dispatchEvent(new Event('scroll')); __qaViewport.dispatchEvent(new Event('resize')); });
    assert.equal(await page.locator('#splashlens-sheet').count(), 0, 'closed sheets stay closed after viewport changes');
    await page.evaluate(() => {
      document.getElementById('qa-keyboard').remove();
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
      openSplashLensSheet({ title: 'Fallback browser', primaryLabel: 'Continue', secondaryLabel: 'Cancel' });
    });
    await page.setViewportSize({ width, height: 280 });
    await page.waitForFunction(() => document.getElementById('splashlens-sheet').style.height === '280px');
    const fallback = page.getByRole('button', { name: 'Cancel', exact: true });
    const fallbackBox = await fallback.boundingBox();
    assert.ok(fallbackBox.y + fallbackBox.height <= 280);
    await fallback.click();
  } finally { await browser.close(); }
});
