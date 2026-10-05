import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../owner-dashboard.html', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];

test('active owner dashboard renders independent paid-intent and fulfillment stages', async () => {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id, { value: '', innerHTML: '', textContent: '' });
    return elements.get(id);
  };
  const metrics = {
    firstActions30d: 11, firstValues30d: 12, qualifiedFirstValueSessions30d: 8,
    partSnapResults30d: 10, partSnapResultFailures30d: 2,
    checkoutCtaShown30d: 23, checkoutClicks30d: 5,
    checkoutSessionsCreated30d: 4, unattributedCheckoutSessions30d: 1,
    checkoutStarts30d: 19, checkoutCompleted30d: 3,
    subscriptionCreated30d: 2, entitlementGranted30d: 1,
  };
  const context = vm.createContext({
    document: { getElementById },
    localStorage: { getItem: () => 'fixture-secret', setItem() {} },
    fetch: async path => ({
      ok: true,
      json: async () => path === '/api/stats'
        ? { ok: true, metrics, generatedAt: 'fixture', funnel30d: [{ label: '<unsafe>', count: 5, conversionFromPrevious: 999 }] }
        : { ok: true, totals: {} },
    }),
  });
  vm.runInContext(script, context);
  await context.loadDashboard();
  const html = getElementById('metrics').innerHTML;
  for (const [label, value] of [
    ['PartSnap results 30d', 10], ['Checkout offers seen 30d', 23],
    ['Checkout clicks 30d', 5], ['Stripe sessions created 30d', 4],
    ['Legacy checkout starts 30d', 19], ['Checkouts completed 30d', 3],
    ['Subscriptions created 30d', 2], ['Entitlements granted 30d', 1],
  ]) {
    assert.ok(html.includes(`${label}</p><div class="metric">${value}</div>`), label);
  }
  assert.match(html, /1 without a matching click/);
  assert.match(html, /8 distinct sessions; zero results excluded/);
  assert.match(getElementById('funnel30').innerHTML, /&lt;unsafe&gt;/);
  assert.ok(!getElementById('funnel30').innerHTML.includes('999%'));
  assert.equal(getElementById('status').textContent, 'Dashboard loaded.');
});

test('dashboard route serves the tested owner asset and keeps access protected', () => {
  const route = readFileSync(new URL('../functions/dashboard.js', import.meta.url), 'utf8');
  assert.match(route, /\/owner-dashboard\.html/);
  assert.match(source, /X-SplashLens-Stats-Secret/);
  assert.match(source, /api\('\/api\/stats'\)/);
  assert.match(source, /api\('\/api\/admin'\)/);
});
