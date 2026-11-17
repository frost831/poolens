import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const width of [1365, 390]) test(`Account sign-in works without camera or scans at ${width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
  const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(8000);
  const errors = []; const actions = []; let cameraRequests = 0; let mailUnavailable = false;
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'https://splashlens-app.test') return route.abort();
      if (url.pathname === '/api/free-profile') {
        const body = route.request().postDataJSON(); actions.push(body.action);
        assert.equal(body.email, 'qa@example.com');
        if (body.action === 'request_code') return mailUnavailable
          ? route.fulfill({ status: 503, json: { error: 'Email service unavailable. Please try again.' } })
          : route.fulfill({ json: { ok: true, emailSent: true } });
        assert.equal(body.action, 'verify_code'); assert.equal(body.code, '123456');
        return route.fulfill({ json: { ok: true, profileToken: 'sl_profile_v1.fixture', accountToken: 'sl_account_v1.fixture', tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), accountTokenExpiresAt: new Date(Date.now() + 3600000).toISOString() } });
      }
      if (url.pathname === '/api/account') return route.fulfill({ json: { ok: true, account: { email: 'qa@example.com', role: 'tech' }, scanner: { count: 0, limit: 3 } } });
      if (url.pathname.startsWith('/api/')) { actions.push(url.pathname); return route.fulfill({ status: 503, json: { error: 'QA fixture' } }); }
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1); const file = resolve(root, name);
      if (!file.startsWith(resolve(root) + sep) || !/^(index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name)) return route.abort();
      try { return route.fulfill({ contentType: /\.m?js$/.test(file) ? 'text/javascript' : /\.html$/.test(file) ? 'text/html' : 'application/json', body: readFileSync(file) }); } catch { return route.abort(); }
    });
    await page.goto('https://splashlens-app.test/?tab=errors&utm_source=qa');
    await page.waitForFunction(() => typeof openSplashLensAccount === 'function');
    await page.exposeFunction('qaCameraCalled', () => { cameraRequests++; });
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = async () => { await window.qaCameraCalled(); throw new Error('Camera must not be requested'); };
      closeSplashLensSheet(); revealSplashLensApp();
      openSplashLensAccount();
    });
    await page.getByRole('button', { name: 'Verify email', exact: true }).click();
    const emailDialog = page.getByRole('dialog', { name: 'Verify your SplashLens email.', exact: true });
    await emailDialog.getByLabel('Work email').fill('qa@example.com');
    await emailDialog.getByRole('button', { name: 'Email my code', exact: true }).click();
    const codeDialog = page.getByRole('dialog', { name: 'Enter your 6-digit code.', exact: true });
    await codeDialog.getByLabel('6-digit code').fill('123456');
    await codeDialog.getByRole('button', { name: 'Verify account', exact: true }).click();
    await page.getByRole('dialog', { name: 'SplashLens account', exact: true }).getByText('qa@example.com', { exact: true }).waitFor();
    assert.equal(cameraRequests, 0);
    assert.equal(actions.includes('/api/scan'), false);
    assert.deepEqual(actions.filter(action => !action.startsWith('/')), ['request_code', 'verify_code']);
    assert.equal(await page.evaluate(() => getScanUsage().count), 0);
    assert.equal(await page.evaluate(() => hasAccountSession()), true);
    // A locally paid/profile-verified user with an expired account session must reverify too.
    await page.evaluate(() => {
      document.getElementById('splashlens-account-modal').remove();
      const profile = getFieldSaveAccount(); profile.accountTokenExpiresAt = '2000-01-01T00:00:00Z';
      localStorage.setItem(FIELD_SAVE_ACCOUNT_KEY, JSON.stringify(profile));
      isPartSnapPro = () => true;
      signInSplashLensAccount(); signInSplashLensAccount();
    });
    await codeDialog.waitFor();
    assert.equal(actions.filter(action => action === 'request_code').length, 2, 'duplicate clicks send only one new code');
    await codeDialog.getByRole('button', { name: 'Not now', exact: true }).click();
    await page.waitForFunction(() => accountSignInPending === false);
    mailUnavailable = true;
    await page.evaluate(() => { document.getElementById('splashlens-account-modal').remove(); signInSplashLensAccount(); });
    await page.getByRole('status').filter({ hasText: 'Email service unavailable. Please try again.' }).waitFor();
    await page.waitForFunction(() => accountSignInPending === false);
    assert.equal(cameraRequests, 0); assert.equal(actions.includes('/api/scan'), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
