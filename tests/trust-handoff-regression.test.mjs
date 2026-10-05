import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { onRequestPost } from '../functions/api/events.js';

const dataSource = fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const errorSource = fs.readFileSync(new URL('../js/errors.js', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const eventsEndpoint = fs.readFileSync(new URL('../functions/api/events.js', import.meta.url), 'utf8');
const amplitude = fs.readFileSync(new URL('../functions/_shared/amplitude.mjs', import.meta.url), 'utf8');

const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(dataSource, dataContext);
const errorContext = { window: {} };
vm.createContext(errorContext);
vm.runInContext(errorSource, errorContext);

test('round-pool volume uses diameter and two depths without an argument shift', () => {
  const round = dataContext.window.POOL_VOLUME_DATA.shapes.find(shape => shape.id === 'round');
  assert.deepEqual([...round.fields], ['diameter', 'shallowEnd', 'deepEnd']);
  assert.equal(Math.round(round.formula(20, 3, 5)), 9400);
});

test('freeform volume uses area and two depths without an argument shift', () => {
  const freeform = dataContext.window.POOL_VOLUME_DATA.shapes.find(shape => shape.id === 'freeform');
  assert.deepEqual([...freeform.fields], ['surfaceAreaEst', 'shallowEnd', 'deepEnd']);
  assert.equal(Math.round(freeform.formula(400, 3, 5)), 11968);
});

test('exact-code search is above secondary navigation and ranks exact codes first', () => {
  assert.ok(shell.indexOf('id="error-search"') < shell.indexOf('<details class="field-tool-drawer">'));
  assert.match(appSource, /const matchRank = c === q \? 0/);
  assert.match(appSource, /return results\.sort\(\(a, b\) => \(/);
});

test('retired code families remain searchable without restoring guessed meanings', () => {
  const start = appSource.indexOf('function searchErrorDB');
  const end = appSource.indexOf('function renderScanHits', start);
  assert.ok(start >= 0 && end > start);
  const searchContext = { window: { ERROR_DB: errorContext.window.ERROR_DB } };
  vm.createContext(searchContext);
  vm.runInContext(`${appSource.slice(start, end)}; this.searchErrorDB = searchErrorDB;`, searchContext);
  const cases = [
    ['Raypak E1', 'Raypak'],
    ['Jandy LXi E01', 'Jandy / Zodiac'],
    ['Beatbot E03', 'Beatbot'],
    ['AquaCal FLO', 'AquaCal'],
    ['Sta-Rite E05', 'Sta-Rite'],
    ["Sta-Rite won't prime", 'Sta-Rite'],
  ];
  for (const [query, brand] of cases) {
    const hits = searchContext.searchErrorDB(query);
    assert.ok(hits.length > 0, `${query} should resolve to an unverified family result`);
    const safeHit = hits.find(hit => hit.brandLabel === brand && hit.unverified === true);
    assert.ok(safeHit, `${query} should include the ${brand} unverified family result`);
    assert.equal(safeHit.code, 'UNVERIFIED');
  }
});

test('first value requires an opened answer or completed calculation and first-session prompts wait', () => {
  assert.match(appSource, /trackSplashLensEvent\('code_answer_opened'/);
  assert.match(appSource, /trackSplashLensEvent\('calculation_completed'/);
  const searchHandler = appSource.slice(appSource.indexOf('function onErrorSearch'), appSource.indexOf('function clearSearch'));
  assert.doesNotMatch(searchHandler, /first_value_completed/);
  assert.match(appSource, /if \(\(firstActivation \|\| challengeCompleted\) && hasCompletedFirstUsageSession\(\)\)/);
});

test('offline, XSS, analytics privacy, and unverified-family protections fail closed', async () => {
  assert.match(serviceWorker, /e\.request\.mode === 'navigate'/);
  assert.match(serviceWorker, /caches\.match\('\/'\)/);
  assert.match(appSource, /description: escHtml\(description \|\| ''\)/);
  assert.match(appSource, /searchTerms: Array\.isArray\(searchTerms\).*escHtml/);
  assert.match(eventsEndpoint, /PERSONAL_PROP_KEYS/);
  assert.match(eventsEndpoint, /safeUrlField/);
  assert.doesNotMatch(amplitude, /user_id:/);
  assert.doesNotMatch(amplitude, /company:/);
  const writes = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return { run: async () => { writes.push({ sql, values }); } };
        },
        run: async () => {},
      };
    },
  };
  const request = new Request('https://app.splashlens.com/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://partner.example/path?email=private@example.com',
    },
    body: JSON.stringify({
      event: 'code_answer_opened',
      path: '/?email=private@example.com',
      props: {
        client_id: 'anon-device-12345',
        known_email: 'private@example.com',
        known_name: 'Private Person',
        known_company: 'Private Company',
        answer_name: 'Flow switch open',
      },
    }),
  });
  const response = await onRequestPost({ request, env: { SUBSCRIBERS_DB: db } });
  assert.equal(response.status, 200);
  const insert = writes.find(write => write.sql.includes('INSERT INTO events'));
  assert.ok(insert);
  const stored = insert.values.join(' ');
  assert.doesNotMatch(stored, /private@example\.com|Private Person|Private Company/);
  assert.match(stored, /Flow switch open/);
  const errorDb = errorContext.window.ERROR_DB;
  assert.equal(errorDb.jandy.categories['LXi / LRZ Gas Heater'].verificationStatus, 'unverified');
  assert.equal(errorDb.raypak.categories['Raypak Gas Heater'].verificationStatus, 'unverified');
  assert.equal(errorDb.beatbot.categories['Beatbot Robot Cleaners'].verificationStatus, 'unverified');
  assert.equal(errorDb.aquacal.categories['AquaCal Heat Pump'].verificationStatus, 'unverified');
  assert.equal(errorDb.starite.categories['Sta-Rite MAX-E-THERM / MASTER TEMP Gas Heater'].verificationStatus, 'unverified');
  assert.equal(errorDb.starite.categories['Sta-Rite Dura-Glas / Max-E-Glas Pump'].verificationStatus, 'unverified');
});
