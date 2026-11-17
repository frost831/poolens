import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
for (const width of [1365, 390]) test(`Google Play dialog purchase, failure, restore, keyboard and fallback at ${width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
  const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(8000);
  const errors = []; const requests = []; let enabled = true; let verifyFail = true;
  page.on('pageerror', error => errors.push(error.message));
  const token = `sl_scan_v1.${Buffer.from(JSON.stringify({ sub: 'fixture', source: 'google_play', scopes: ['scan'], plan: 'Google Play QA', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
  try {
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'https://splashlens-app.test') return route.abort();
      if (url.pathname === '/api/play-billing') {
        const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null; requests.push(body?.action || 'catalog');
        if (!body) return route.fulfill({ json: { enabled, products: enabled ? [{ plan: 'monthly', productId: 'qa_monthly', label: 'Monthly Pro' }, { plan: 'yearly', productId: 'qa_yearly', label: 'Annual Pro' }] : [] } });
        if (body.action === 'verify' && verifyFail) return route.fulfill({ status: 503, json: { code: 'google_unavailable', error: 'Verification unavailable. Try Restore.' } });
        return route.fulfill({ json: { ok: true, token, entitlement: { source: 'google_play' } } });
      }
      if (url.pathname.startsWith('/api/')) { requests.push(url.pathname); return route.fulfill({ status: 503, json: { error: 'QA fixture' } }); }
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1); const file = resolve(root, name);
      if (!file.startsWith(resolve(root) + sep) || !/^(index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name)) return route.abort();
      try { return route.fulfill({ contentType: /\.m?js$/.test(file) ? 'text/javascript' : /\.html$/.test(file) ? 'text/html' : 'application/json', body: readFileSync(file) }); } catch { return route.abort(); }
    });
    await page.goto('https://splashlens-app.test/?store=android&utm_source=qa');
    await page.waitForFunction(() => typeof openAndroidPlayAccess === 'function' && window.SplashLensPlayBilling);
    await page.evaluate(() => {
      revealSplashLensApp(); showTab('scan', 'parts');
      getFieldSaveAccount = () => ({ email: 'qa@example.com', accountToken: 'fixture-account' });
      hasAccountSession = () => true; ensureFreeScanProfile = async () => true;
      window.getDigitalGoodsService = async () => ({
        getDetails: async () => [{ itemId: 'qa_monthly', subscriptionPeriod: 'P1M', price: { currency: 'USD', value: '19' } }, { itemId: 'qa_yearly', subscriptionPeriod: 'P1Y', price: { currency: 'USD', value: '149' } }], listPurchases: async () => [],
      });
      window.__paymentShows = 0;
      window.PaymentRequest = class { async show() { window.__paymentShows++; return { details: { purchaseToken: 'fixture-purchase' }, complete: async () => {} }; } };
      document.querySelector('[data-nav-tab="scan"]')?.focus();
    });
    await page.evaluate(() => openAndroidPlayAccess());
    const dialog = page.getByRole('dialog', { name: 'Google Play access', exact: true });
    await dialog.waitFor();
    const monthly = dialog.getByRole('button', { name: /Monthly Pro: USD 19/ });
    await monthly.click();
    await dialog.getByRole('status').filter({ hasText: 'Verification unavailable' }).waitFor();
    assert.equal(await dialog.locator('[data-play-plan]').count(), 0, 'uncertain payments offer restore instead of another purchase');
    assert.equal(await page.evaluate(() => localStorage.getItem(SCAN_ENTITLEMENT_TOKEN_KEY)), null);
    assert.equal(await page.evaluate(() => __paymentShows), 1);
    verifyFail = false;
    await dialog.getByRole('button', { name: 'Restore Google Play purchase', exact: true }).click();
    await dialog.getByRole('status').filter({ hasText: 'active on this device' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem(SCAN_ENTITLEMENT_TOKEN_KEY)), token);
    assert.equal(await dialog.locator('[data-play-plan]').count(), 0);
    await dialog.getByRole('button', { name: 'Close', exact: true }).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-play-restore')), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-play-close')), true);
    await page.keyboard.press('Escape'); assert.equal(await dialog.count(), 0);
    enabled = false;
    await page.evaluate(() => openAndroidPlayAccess()); await dialog.waitFor();
    await dialog.getByRole('status').filter({ hasText: 'upgrades are unavailable' }).waitFor();
    assert.equal(await dialog.locator('[data-play-plan]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true);
    assert.equal(requests.includes('/api/checkout'), false);
    if (process.env.SPLASHLENS_QA_SCREENSHOTS) {
      mkdirSync(process.env.SPLASHLENS_QA_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: resolve(process.env.SPLASHLENS_QA_SCREENSHOTS, `google-play-fallback-${width}.png`) });
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
