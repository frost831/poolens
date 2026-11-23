import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));

for (const width of [390, 1365]) test(`learning feedback consent, retry, save and deletion work at ${width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
  const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  const errors = [], submissions = [];
  let failNext = true;
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'https://splashlens-app.test') return route.abort();
      if (url.pathname === '/api/learning') {
        const body = route.request().postDataJSON(); submissions.push(body);
        if (failNext) { failNext = false; return route.fulfill({ status: 503, json: { ok: false, error: 'Temporarily unavailable. Please retry.' } }); }
        return route.fulfill({ status: body.action === 'forget' ? 200 : 201, json: { ok: true, ticketId: 'lc_browser_fixture' } });
      }
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 401, json: { ok: false } });
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1), file = resolve(root, name);
      if (!file.startsWith(resolve(root) + sep) || !/^(index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name)) return route.abort();
      try { return route.fulfill({ contentType: /\.m?js$/.test(file) ? 'text/javascript' : /\.html$/.test(file) ? 'text/html' : 'application/json', body: readFileSync(file) }); } catch { return route.abort(); }
    });
    await page.goto('https://splashlens-app.test/?utm_source=qa');
    await page.waitForFunction(() => typeof renderLearningFeedback === 'function');
    await page.evaluate(() => {
      localStorage.setItem(ACCOUNT_TOKEN_KEY, 'sl_account_v1.fixture.signature');
      const panel = document.createElement('div'); panel.id = 'partsnap-feedback-panel';
      panel.style.cssText = 'max-width:540px;margin:16px auto;padding:8px;';
      document.body.replaceChildren(panel);
      _lastPartSnapResult = { learning: { receipt: 'signed-fixture', consentVersion: 'equipment-feedback-2026-11-23', mode: 'shadow' } };
      capturePartSnapOutcome('wrong');
    });
    await page.getByRole('button', { name: 'Send for review', exact: true }).click();
    assert.equal(submissions.length, 0, 'unchecked consent sends no contribution');
    await page.getByLabel('Correct equipment or part name (optional)', { exact: true }).fill('Hayward strainer basket');
    await page.getByLabel(/I agree to share/).check();
    await page.getByRole('button', { name: 'Send for review', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('learning-status').textContent.includes('Please retry'));
    assert.equal(await page.getByRole('button', { name: 'Send for review', exact: true }).isEnabled(), true);
    assert.equal(await page.getByLabel('Correct equipment or part name (optional)', { exact: true }).inputValue(), 'Hayward strainer basket');
    await page.getByRole('button', { name: 'Send for review', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('learning-status').textContent.includes('Saved for review'));
    assert.equal(submissions[1].receipt, 'signed-fixture');
    assert.equal(submissions[1].reportedLabel, 'Hayward strainer basket');
    assert.equal('image' in submissions[1], false);
    assert.equal('email' in submissions[1], false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const buttonBox = await page.getByRole('button', { name: 'Saved for review', exact: true }).boundingBox();
    assert.ok(buttonBox.height >= 44);
    if (process.env.LEARNING_SCREENSHOT_DIR) {
      mkdirSync(process.env.LEARNING_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: resolve(process.env.LEARNING_SCREENSHOT_DIR, `splashlens-learning-${width}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'Delete my learning feedback', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('learning-status').textContent.includes('deleted'));
    assert.equal(submissions.at(-1).action, 'forget');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
