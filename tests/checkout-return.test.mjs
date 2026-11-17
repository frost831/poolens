import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = readFileSync(resolve(root, 'js/app.js'), 'utf8');
const key = 'splashlens-partsnap-checkout-return-v1';
const photo = 'data:image/jpeg;base64,AA==';
function unit() {
  const storage = new Map(); let capacity = 3000000;
  const context = vm.createContext({
    Date, JSON, URLSearchParams, S: { tab: 'scan' }, _scanMode: 'parts',
    PARTSNAP_CHECKOUT_RETURN_KEY: key, PARTSNAP_CHECKOUT_RETURN_TTL: 1800000,
    PARTSNAP_EVIDENCE_STEPS: ['equipment', 'plate', 'marking', 'context'].map(key => ({ key })),
    _lastPartSnapResult: { component: 'pump', guidedEvidence: { complete: true, captureCount: 4, dimensionStatus: 'provided' } },
    _partSnapEvidenceSession: { captures: Object.fromEntries(['equipment', 'plate', 'marking', 'context'].map(key => [key, photo])), dimensions: '8 inches', dimensionsUnavailable: false },
    getFieldSaveAccount: () => ({ email: 'qa@example.com', accountToken: 'never-store-this-credential' }),
    window: { location: { search: '?checkout=cancelled' } },
    sessionStorage: { getItem: key => storage.get(key) || null, removeItem: key => storage.delete(key), setItem: (key, value) => { if (value.length > capacity) throw Error('quota'); storage.set(key, value); } },
  });
  for (const name of ['createPartSnapEvidenceSession', 'rememberPartSnapCheckoutReturn', 'readPartSnapCheckoutReturn']) {
    const fn = source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
    assert.ok(fn); vm.runInContext(fn[0], context);
  }
  return { context, storage, limit: value => { capacity = value; } };
}

test('checkout draft retains evidence and account binding without credentials', () => {
  const { context: c, storage } = unit();
  assert.equal(c.rememberPartSnapCheckoutReturn(), true);
  assert.ok(!storage.get(key).includes('never-store-this-credential'));
  const restored = c.readPartSnapCheckoutReturn();
  assert.equal(restored.ai.component, 'pump'); assert.equal(restored.evidence.captures.plate, photo);
  assert.equal(restored.ai.guidedEvidence.complete, true);
  c.window.location.search = '';
  assert.equal(c.readPartSnapCheckoutReturn(), null, 'ordinary navigation does not replay an old answer');
  c.window.location.search = '?activate_scan=1';
  assert.ok(c.readPartSnapCheckoutReturn(), 'verified success handoff can reopen the same draft');
});

test('expired, future, malformed and different-account drafts are discarded', () => {
  for (const mutate of [draft => { draft.savedAt -= 1800001; }, draft => { draft.savedAt += 60000; }, draft => { draft.ai = []; }, draft => { draft.accountEmail = 'other@example.com'; }]) {
    const { context: c, storage } = unit(); c.rememberPartSnapCheckoutReturn();
    const draft = JSON.parse(storage.get(key)); mutate(draft); storage.set(key, JSON.stringify(draft));
    assert.equal(c.readPartSnapCheckoutReturn(), null); assert.equal(storage.has(key), false);
  }
  const { context: c, storage } = unit(); storage.set(key, '{invalid');
  assert.equal(c.readPartSnapCheckoutReturn(), null); assert.equal(storage.has(key), false);
});

test('invalid photo schemes cannot claim retained evidence and quota fallback keeps order hold', () => {
  const { context: c, storage, limit } = unit(); c.rememberPartSnapCheckoutReturn();
  const draft = JSON.parse(storage.get(key)); draft.evidence.captures.plate = 'data:image/svg+xml,<svg onload=alert(1)>';
  storage.set(key, JSON.stringify(draft));
  assert.equal(c.readPartSnapCheckoutReturn().ai.guidedEvidence.complete, false);
  c._partSnapEvidenceSession.captures.plate = 'data:image/jpeg;base64,' + 'A'.repeat(20000);
  limit(1000); assert.equal(c.rememberPartSnapCheckoutReturn(), true);
  const restored = c.readPartSnapCheckoutReturn();
  assert.equal(restored.photosOmitted, true); assert.equal(restored.ai.guidedEvidence.captureCount, 0);
  assert.equal(restored.ai.guidedEvidence.complete, false);
  limit(0); assert.equal(c.rememberPartSnapCheckoutReturn(), false);
});

test('checkout does not discard an unsaved answer when all tab storage is blocked', async () => {
  const notices = []; let navigated = false;
  const c = vm.createContext({
    URL, URLSearchParams, checkoutPending: false, S: { tab: 'scan' }, _scanMode: 'parts', _lastPartSnapResult: { component: 'pump' },
    isStoreShellMode: () => false, trackCheckoutIntent: () => '/api/checkout?plan=monthly&store=web',
    window: { location: { origin: 'https://app.test', search: '?utm_source=qa', assign: () => { navigated = true; } } },
    fetchSplashLensWithTimeout: async () => ({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/fixture' }) }),
    rememberPartSnapCheckoutReturn: () => false, trackSplashLensEvent() {}, showSplashLensNotice: text => notices.push(text),
  });
  vm.runInContext(source.match(/^async function startWebCheckout\([^]*?^}/m)[0], c);
  assert.equal(await c.startWebCheckout('monthly', 'partsnap_result'), false);
  assert.equal(navigated, false); assert.equal(c.checkoutPending, false);
  assert.match(notices[0], /allow site storage/);
});

for (const width of [1365, 390]) test(`checkout cancellation restores PartSnap without another scan or camera at ${width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
  const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(8000);
  const errors = []; const events = []; let checkoutBody; let aiCalls = 0;
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => {
      window.__cameraCalls = 0;
      navigator.mediaDevices.getUserMedia = async () => { window.__cameraCalls++; throw Error('No camera in fixture'); };
    });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'checkout.stripe.com') return route.fulfill({ contentType: 'text/html', body: '<a href="https://splashlens-app.test/?checkout=cancelled&plan=monthly">Cancel</a>' });
      if (url.origin !== 'https://splashlens-app.test') return route.abort();
      if (url.pathname === '/api/checkout') {
        checkoutBody = route.request().postDataJSON();
        return route.fulfill({ json: { url: 'https://checkout.stripe.com/c/pay/cs_test_fixture' } });
      }
      if (url.pathname === '/api/scan') aiCalls++;
      if (url.pathname === '/api/events') events.push(route.request().postDataJSON());
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'QA fixture' } });
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1); const file = resolve(root, name);
      if (!file.startsWith(resolve(root) + sep) || !/^(index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name)) return route.abort();
      try { return route.fulfill({ contentType: /\.m?js$/.test(file) ? 'text/javascript' : /\.html$/.test(file) ? 'text/html' : 'application/json', body: readFileSync(file) }); } catch { return route.abort(); }
    });
    await page.goto('https://splashlens-app.test/?tab=errors&utm_source=qa');
    await page.waitForFunction(() => typeof rememberPartSnapCheckoutReturn === 'function');
    const initialResultEvent = page.waitForResponse(response => new URL(response.url()).pathname === '/api/events' && response.request().postDataJSON()?.event === 'partsnap_result');
    await page.evaluate(() => {
      setSplashLensRole('tech');
      localStorage.setItem(FIELD_SAVE_ACCOUNT_KEY, JSON.stringify({ email: 'qa@example.com', profileToken: 'sl_profile_v1.fixture', accountToken: 'sl_account_v1.fixture' }));
      localStorage.setItem(SCAN_USAGE_KEY, JSON.stringify({ month: currentScanMonth(), count: 1 }));
      partSnapCheckoutRestoring = true; revealSplashLensApp(); showTab('scan', 'parts'); partSnapCheckoutRestoring = false;
      const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
      _partSnapEvidenceSession = createPartSnapEvidenceSession();
      for (const step of PARTSNAP_EVIDENCE_STEPS) _partSnapEvidenceSession.captures[step.key] = canvas.toDataURL('image/jpeg');
      _partSnapEvidenceSession.dimensionsUnavailable = true;
      if (window.SplashLensReview) window.SplashLensReview.afterSuccessfulId = () => {};
      renderPartsSnapResult({ manufacturer: 'Hayward', category: 'pump', component: 'pool pump motor assembly', model: 'Super Pump', confidence: 'medium', description: 'QA return-path fixture', visibleEvidence: ['Hayward wordmark'], missingProof: ['Confirm nameplate'], searchTerms: [], guidedEvidence: { complete: true, captureCount: 4, dimensionStatus: 'unavailable' } }, document.getElementById('scan-result'), document.getElementById('scan-camera-status'));
    });
    await initialResultEvent;
    const resultEvents = events.filter(event => event.event === 'partsnap_result').length;
    await page.getByRole('link', { name: 'Go Pro $19', exact: true }).click();
    await page.waitForURL('https://checkout.stripe.com/**');
    assert.equal(checkoutBody.traffic_class, 'qa');
    await page.getByRole('link', { name: 'Cancel', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'result and proof photos are restored' }).waitFor();
    assert.match(await page.locator('#scan-result').innerText(), /pool pump motor assembly/);
    assert.match(await page.locator('#scan-result').innerText(), /Buying links are locked/);
    assert.equal(await page.evaluate(() => getPartSnapEvidenceSummary().captureCount), 4);
    assert.equal(await page.evaluate(() => getScanUsage().count), 1);
    assert.equal(await page.evaluate(() => window.__cameraCalls), 0);
    assert.equal(await page.locator('#splashlens-sheet').count(), 0);
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), null);
    assert.equal(events.filter(event => event.event === 'partsnap_result').length, resultEvents);
    assert.equal(aiCalls, 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true);
    assert.deepEqual(errors, []);
    // QA classification must survive a return URL without utm_source too.
    await page.getByRole('link', { name: 'Go Pro $19', exact: true }).click();
    await page.waitForURL('https://checkout.stripe.com/**');
    assert.equal(checkoutBody.traffic_class, 'qa');
  } finally { await browser.close(); }
});
