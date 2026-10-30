import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const payload = `<img src=x onerror="window.__xss=1">'\\\" & <svg onload=window.__xss=2>`;
function fn(name) {
  const match = source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}
function harness(extra = {}) {
  const context = vm.createContext({ URL, ...extra });
  vm.runInContext([fn('escHtml'), fn('escAttr')].join('\n'), context);
  return context;
}

test('text and attribute encoders neutralize all HTML delimiters without treating text as script', () => {
  const c = harness();
  assert.equal(c.escHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(c.escAttr(`&<>"'\\`), '&amp;&lt;&gt;&quot;&#39;&#92;');
  assert.equal(c.escHtml(null), '');
  assert.equal(c.escAttr(undefined), '');
});

test('outbound URL policy allows absolute HTTPS only', () => {
  const c = harness();
  vm.runInContext(fn('safeUrl'), c);
  for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<svg onload=alert(1)>', 'http://example.com', '//example.com', '/relative', 'https:\\evil.example', 'https://good.example\n.evil', null, {}]) {
    assert.equal(c.safeUrl(url), '', String(url));
  }
  assert.equal(c.safeUrl('https://manuals.example/path?q=a&b=2'), 'https://manuals.example/path?q=a&b=2');
});

test('camera OCR is escaped separately for text and input value contexts', () => {
  const c = harness();
  vm.runInContext(fn('showCaptureWithManualEntry'), c);
  const result = { innerHTML: '' };
  c.showCaptureWithManualEntry({ toDataURL: () => 'data:image/jpeg;base64,AA==' }, payload, result, {});
  assert.ok(result.innerHTML.includes(`Detected text: ${c.escHtml(payload)}`));
  assert.ok(result.innerHTML.includes(`value="${c.escAttr(payload)}"`));
  assert.ok(!result.innerHTML.includes(payload));
});

test('AI code results render hostile fields as text and keep the code out of executable handlers', () => {
  const result = { innerHTML: '' };
  const c = harness({ searchErrorDB: () => [], renderScanHits: () => '', countVerifiedCodeHits: () => 0 });
  vm.runInContext(fn('renderAIErrorCodeResult'), c);
  c.renderAIErrorCodeResult({ codes: [payload], brand: payload, model: payload, context: payload }, result, {});
  assert.ok(result.innerHTML.includes(c.escHtml(payload)));
  assert.ok(result.innerHTML.includes(`data-code="${c.escAttr(payload)}"`));
  assert.doesNotMatch(result.innerHTML, /onclick=/);
  assert.ok(!result.innerHTML.includes(payload));
});

test('strip text is escaped and malformed/non-finite readings cannot become markup or valid chemistry', () => {
  const c = harness();
  vm.runInContext(fn('renderStripResult'), c);
  const result = { innerHTML: '' };
  c.renderStripResult({ fc: payload, ph: '7.4', ta: Infinity, ch: '', cya: null, notes: payload, disclaimer: payload, confidence: payload }, result, {});
  assert.ok(result.innerHTML.includes(c.escHtml(payload)));
  assert.ok(result.innerHTML.includes('7.4'));
  assert.ok(!result.innerHTML.includes(payload));
  assert.doesNotMatch(result.innerHTML, />NaN<|>Infinity</);
  assert.equal((result.innerHTML.match(/✓ In range/g) || []).length, 1);
});

test('corpus sources filter unsafe schemes and carry opaque IDs as data', () => {
  const c = harness();
  vm.runInContext(fn('safeUrl') + '\n' + fn('renderPartSnapCorpusPanel'), c);
  const html = c.renderPartSnapCorpusPanel([{ id: payload, sourceTier: payload, sourceUrls: ['javascript:alert(1)', 'http://unsafe.example', 'https://manuals.example/a?b=1&c=2'] }]);
  assert.doesNotMatch(html, /javascript:|http:\/\/unsafe|onclick=/);
  assert.match(html, /https:\/\/manuals\.example\/a\?b=1&amp;c=2/);
  assert.ok(html.includes(`data-candidate-id="${c.escAttr(payload)}"`));
  assert.ok(html.includes(`data-source-tier="${c.escAttr(payload)}"`));
});

test('chemical no-results message displays the query as text', () => {
  const result = { innerHTML: '' };
  const c = harness({ document: { getElementById: () => result }, window: { CHEM_CATALOG: { categories: [] } } });
  vm.runInContext(fn('scanChemSearch'), c);
  c.scanChemSearch(payload);
  assert.ok(result.innerHTML.includes(c.escHtml(payload)));
  assert.ok(!result.innerHTML.includes(payload));
});

test('saved pool IDs and numeric form fields cannot create attributes or code', () => {
  const result = { innerHTML: '' };
  const c = harness({ S: {}, getPools: () => [{ id: payload, name: payload, gallons: payload, filterDia: payload }], document: { getElementById: () => result }, voiceNoteButton: () => '' });
  vm.runInContext(fn('renderPoolForm'), c);
  c.renderPoolForm(payload);
  assert.ok(!result.innerHTML.includes(payload));
  assert.doesNotMatch(result.innerHTML, /onclick="[^"]*(?:onerror|__xss)/);
});

test('template data is never interpolated into inline event handler source', () => {
  // Lines may include generated labels/attributes after a constant handler; inspect the handler itself.
  for (const match of source.matchAll(/\bon(?:click|change|input|blur)="([^\n]*?)"/g)) {
    assert.ok(!match[1].includes('${'), `Data-bearing inline handler: ${match[0]}`);
  }
});

test('listeners pass untrusted IDs as opaque strings, coerce numeric arguments, and ignore unknown actions', () => {
  const calls = [];
  const c = harness({
    renderPoolDetail: id => calls.push(['pool', id]),
    toggleItem: (...args) => calls.push(['item', ...args]),
    savePoolNotes: id => calls.push(['notes', id]),
    setClosingPhotoReference: (...args) => calls.push(['photo', ...args]),
  });
  vm.runInContext(fn('handleAppDataEvent'), c);
  function dispatch(action, dataset, type = 'click', value = '') {
    const control = { dataset, value, getAttribute: () => action };
    c.handleAppDataEvent({ type, target: { closest: () => control } });
  }
  dispatch('renderPoolDetail', { arg0: payload });
  dispatch('toggleItem', { arg0: '2', arg1: '3' });
  dispatch('savePoolNotes', { arg0: payload }, 'focusout');
  dispatch('closing-photo', { arg0: 'equipment' }, 'change', payload);
  for (const action of ['constructor', '__proto__', 'window.__xss=1']) dispatch(action, { arg0: payload });
  assert.deepEqual(calls, [['pool', payload], ['item', 2, 3], ['notes', payload], ['photo', 'equipment', payload]]);
  assert.equal(c.__xss, undefined);
});

for (const width of [1365, 390]) {
  test(`browser XSS and delegated-action regression at ${width}px`, { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
    const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      // An offline fixture uses the real renderers and listener; no API, payments or customer data.
      const functions = ['escHtml', 'escAttr', 'safeUrl', 'handleAppDataEvent', 'renderAIErrorCodeResult', 'showCaptureWithManualEntry', 'renderStripResult', 'renderPartSnapCorpusPanel', 'scanChemSearch', 'renderPoolForm'].map(fn).join('\n');
      await page.setContent('<main><canvas id="scan-canvas"></canvas><p id="scan-camera-status"></p><div id="scan-result"></div><div id="scan-chem-results"></div><div id="pools-content"></div><div id="evidence"></div></main>');
      await page.addScriptTag({ content: functions + `
        window.__calls=[]; window.__xss=0;
        window.S={}; window._partSnapEvidenceSession={captures:{},dimensions:''};
        window.searchErrorDB=()=>[]; window.renderScanHits=()=>''; window.countVerifiedCodeHits=()=>0;
        window.voiceNoteButton=()=>''; window.getPools=()=>window.__pools || [];
        window.trackSplashLensEvent=(...args)=>window.__calls.push(args);
        window.CHEM_CATALOG={categories:[]};
        document.addEventListener('click', handleAppDataEvent);
        document.addEventListener('change', handleAppDataEvent);
        document.addEventListener('focusout', handleAppDataEvent);
      ` });
      const values = [payload, `');window.__xss=9;//`, `&quot; autofocus onfocus=window.__xss=8 x=&quot;`, `</textarea><img src=x onerror=window.__xss=7>`];
      for (const value of values) {
        await page.evaluate(value => {
          const result = document.getElementById('scan-result');
          renderAIErrorCodeResult({ codes: [value], brand: value, model: value, context: value }, result, null);
        }, value);
        assert.equal(await page.locator('#scan-result [data-code]').getAttribute('data-code'), value);
        await page.locator('#scan-result [data-code]').click();
        assert.equal(await page.locator('#scan-manual-code').inputValue(), value);
        assert.equal(await page.locator('#scan-result').getByText(`Detected text: ${value}`, { exact: true }).count(), 1);
        assert.equal(await page.locator('#scan-result img').count(), 1, 'only the legitimate canvas preview may create an image');
        await page.evaluate(value => {
          renderStripResult({ fc: value, ph: '7.4', notes: value, disclaimer: value, confidence: value }, document.getElementById('scan-result'), null);
          scanChemSearch(value);
          window.__pools=[{id:value,name:value,gallons:value,filterDia:value}];
          renderPoolForm(value);
          document.getElementById('evidence').innerHTML=renderPartSnapCorpusPanel([{id:value,sourceTier:value,sourceUrls:['javascript:window.__xss=5','https://manuals.example/manual?x=1&y=2']}]);
        }, value);
        assert.equal(await page.locator('#scan-result img, #scan-chem-results img, #pools-content img, #evidence img').count(), 0);
        assert.equal(await page.locator('#pf-name').inputValue(), value);
        assert.equal(await page.locator('#evidence a').count(), 1);
        assert.equal(await page.locator('#evidence a').getAttribute('href'), 'https://manuals.example/manual?x=1&y=2');
        // Prevent navigation after the actual delegated listener runs; IDs must survive HTML decoding unchanged.
        await page.evaluate(() => document.getElementById('evidence').querySelector('a').addEventListener('click', event => event.preventDefault()));
        await page.locator('#evidence a').click();
        assert.deepEqual(await page.evaluate(() => __calls.at(-1)), ['partsnap_corpus_source_clicked', {candidate_id:value,source_tier:value}]);
        assert.equal(await page.locator('[autofocus], [onerror], [onload]').count(), 0);
        assert.equal(await page.evaluate(() => __xss), 0);
      }
      // Nested controls dispatch once, without evaluating arbitrary dataset values.
      await page.evaluate(() => {
        window.toggleItem=(...args)=>__calls.push(['toggle',...args]);
        document.getElementById('pools-content').innerHTML='<div data-app-action="toggleItem" data-arg0="1" data-arg1="2"><input id="nested" type="checkbox" data-app-action="toggleItem" data-arg0="1" data-arg1="2"></div>';
      });
      const before = await page.evaluate(() => __calls.length);
      await page.locator('#nested').check();
      assert.equal(await page.evaluate(() => __calls.length), before + 1);
      assert.deepEqual(await page.evaluate(() => __calls.at(-1)), ['toggle', 1, 2]);
    } finally {
      await browser.close();
    }
  });
}

test('full app preserves saved-pool actions and captured checkout attribution after handler migration', { skip: !process.env.SPLASHLENS_PLAYWRIGHT_PATH }, async () => {
  const { chromium } = await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser = await chromium.launch({ headless: true });
  const root = fileURLToPath(new URL('..', import.meta.url));
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'https://splashlens-app.test') return route.abort();
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"error":"offline_fixture"}' });
      const pathname = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const file = resolve(root, pathname);
      if (!file.startsWith(resolve(root) + sep) || !/^(?:index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(pathname)) return route.abort();
      try {
        const contentType = /\.m?js$/.test(file) ? 'text/javascript' : /\.html$/.test(file) ? 'text/html' : /\.svg$/.test(file) ? 'image/svg+xml' : /\.json$/.test(file) ? 'application/json' : 'image/png';
        return route.fulfill({ contentType, body: readFileSync(file) });
      } catch { return route.abort(); }
    });
    await page.goto('https://splashlens-app.test/?tab=pools');
    await page.evaluate(value => {
      window.__xss = 0;
      setSplashLensRole('tech'); hideRolePicker(); showTab('pools');
      localStorage.setItem('poolens-pools', JSON.stringify([{
        id:value, name:value, address:value, type:value, sanitizer:value, gallons:15000, filter:'Sand', filterDia:value, notes:value,
        history:[{date:value,fc:value,ph:'7.4',note:value}],
        servicePassports:[{date:value,readings:{fc:value},proof:{customerSummary:value}}],
        equipmentTree:[], nextVisitReminder:{date:'2026-11-01',note:value},
      }]));
      renderPoolList();
    }, payload);
    assert.equal(await page.locator('#pools-content img, #pools-content [onerror]').count(), 0, 'stored pool summary/date fields stay text');
    await page.locator('.pool-card').click();
    assert.equal(await page.locator('#pool-notes-ta').inputValue(), payload);
    await page.locator('#pool-notes-ta').fill(payload + ' edited');
    await page.locator('[data-app-action="renderPoolForm"]').click();
    assert.equal(await page.locator('#pf-name').inputValue(), payload);
    assert.equal(await page.evaluate(() => getPools()[0].notes), payload + ' edited', 'focusout listener saves to the exact original ID');
    await page.locator('[data-app-action="savePool"]').click();
    assert.equal(await page.evaluate(() => getPools()[0].id), payload);
    await page.locator('[data-app-action="showEquipmentForm"]').click();
    await page.getByPlaceholder('Manufacturer', { exact: true }).fill('Pentair');
    await page.getByPlaceholder('Model / family', { exact: true }).fill(payload);
    await page.locator('[data-app-action="saveManualEquipment"]').click();
    assert.equal(await page.evaluate(() => getPools()[0].equipmentTree[0].model), payload);
    await page.locator('[data-app-action="showChemForm"]').click();
    await page.locator('input[id^="cf-fc-"]').fill('3');
    await page.locator('[data-app-action="saveChemReading"]').click();
    assert.equal(await page.evaluate(() => getPools()[0].history.at(-1).fc), 3);
    await page.locator('[data-app-action="showNextVisitReminderForm"]').click();
    await page.locator('textarea[id^="next-note-"]').fill(payload);
    await page.locator('[data-app-action="saveNextVisitReminder"]').click();
    assert.equal(await page.evaluate(() => getPools()[0].nextVisitReminder.note), payload);
    assert.equal(await page.locator('#pools-content img, #pools-content [onerror]').count(), 0);
    assert.equal(await page.evaluate(() => __xss), 0);

    await page.evaluate(() => {
      window.__checkoutCalls=[]; window.__events=[];
      window.startWebCheckout=(...args)=>__checkoutCalls.push(args);
      window.trackSplashLensEvent=(name,props)=>__events.push({name,props});
      sessionStorage.clear();
      document.getElementById('pools-content').innerHTML=renderPartSnapResultUpgradeOffer('first_value_dose_calculator');
    });
    await page.locator('#pools-content a[data-checkout-plan="monthly"]').click();
    assert.deepEqual(await page.evaluate(() => __checkoutCalls), [['monthly','first_value_dose_calculator']]);
    const clicks = await page.evaluate(() => __events.filter(event => event.name === 'post_value_upgrade_clicked'));
    assert.equal(clicks.length, 1);
    assert.equal(clicks[0].props.placement, 'first_value_dose_calculator');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
