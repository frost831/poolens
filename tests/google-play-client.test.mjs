import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../js/play-billing.js', import.meta.url), 'utf8');
function fixture(overrides = {}) {
  const window = {}; vm.runInNewContext(source, { window, setTimeout, clearTimeout });
  const products = [{ plan: 'monthly', productId: 'qa_monthly', label: 'Monthly' }, { plan: 'yearly', productId: 'qa_yearly', label: 'Annual' }];
  let identity = 'account-fixture'; let fail = ''; let active = 0; let shows = 0; let cancel = false;
  let paymentResolve;
  const calls = []; const completions = [];
  const service = { getDetails: async () => products.map((p, i) => ({ itemId: p.productId, subscriptionPeriod: i ? 'P1Y' : 'P1M', price: { currency: 'USD', value: i ? '149' : '19' } })), listPurchases: async () => [] };
  const host = { getDigitalGoodsService: async () => service, PaymentRequest: class {
    constructor(methods, details) { calls.push({ methods, details }); }
    async show() { shows++; if (cancel) { const e = new Error(); e.name = 'AbortError'; throw e; } if (overrides.pause) await new Promise(resolve => { paymentResolve = resolve; }); return { details: { purchaseToken: 'fixture-token' }, complete: async state => { completions.push(state); } }; }
  } };
  const api = async (method, body) => {
    calls.push({ method, body });
    if (method === 'GET') return { enabled: true, products };
    if (fail) { const error = new Error('Verification unavailable. Use Restore.'); error.code = fail; throw error; }
    return { ok: true, token: 'sl_scan_v1.fixture.signature', entitlement: { source: 'google_play' } };
  };
  const client = window.SplashLensPlayBilling.createClient({ host, api: overrides.api || api, accountToken: () => identity, activate: () => { active++; }, timeoutMs: 8 });
  return { client, host, service, calls, completions, setAccount: value => { identity = value; }, fail: value => { fail = value; }, cancel: value => { cancel = value; }, state: () => ({ active, shows }), resume: () => paymentResolve() };
}
test('native purchase uses Google price/SKU and unlocks only after server verification', async () => {
  const f = fixture(); await f.client.prepare(); await f.client.buy('yearly');
  assert.equal(f.calls.find(c => c.methods).methods[0].supportedMethods, 'https://play.google.com/billing');
  assert.equal(f.calls.find(c => c.methods).methods[0].data.sku, 'qa_yearly');
  assert.equal(f.calls.find(c => c.methods).details.total.amount.value, '149');
  assert.equal(f.calls.find(c => c.body?.action === 'verify').body.purchaseToken, 'fixture-token');
  assert.equal(f.state().active, 1); assert.deepEqual(f.completions, ['success']);
});
test('cancellation and verification failure release the lock without unlocking', async () => {
  const f = fixture(); await f.client.prepare(); f.cancel(true);
  await assert.rejects(f.client.buy('monthly'), /canceled/); assert.equal(f.state().active, 0);
  f.cancel(false); f.fail('google_unavailable'); await assert.rejects(f.client.buy('monthly'), /Restore/);
  assert.equal(f.state().active, 0); assert.deepEqual(f.completions, ['fail']);
  const before = f.state().shows;
  await assert.rejects(f.client.buy('yearly'), /already have/); assert.equal(f.state().shows, before);
  f.fail(''); await f.client.restore(); assert.equal(f.state().active, 1);
});
test('overlapping buy, prepare and restore requests cannot start another payment', async () => {
  const f = fixture({ pause: true }); await f.client.prepare(); const purchase = f.client.buy('monthly');
  await assert.rejects(f.client.buy('yearly'), /already open/);
  await assert.rejects(f.client.prepare(), /already open/);
  await assert.rejects(f.client.restore(), /already open/);
  f.resume(); await purchase; assert.equal(f.state().shows, 1);
});
test('account changes before and during purchase never unlock the wrong profile', async () => {
  const f = fixture({ pause: true }); await f.client.prepare(); f.setAccount('other');
  await assert.rejects(f.client.buy('monthly'), /Reopen/); f.setAccount('account-fixture');
  const purchase = f.client.buy('monthly'); f.setAccount('other'); f.resume();
  await assert.rejects(purchase, /account changed/); assert.equal(f.state().active, 0);
});
test('a current Google purchase blocks a second subscription and offers restore', async () => {
  const f = fixture(); f.service.listPurchases = async () => [{ itemId: 'qa_monthly', purchaseToken: 'existing' }];
  assert.equal((await f.client.prepare()).hasPurchase, true);
  await assert.rejects(f.client.buy('yearly'), /already have/); assert.equal(f.state().shows, 0);
  await f.client.restore(); assert.equal(f.state().active, 1);
});
test('missing capability, disabled catalog, wrong period and stalled bridges fail closed', async () => {
  const f = fixture(); delete f.host.getDigitalGoodsService;
  await assert.rejects(f.client.prepare(), /does not support/);
  f.host.getDigitalGoodsService = async () => f.service;
  f.service.getDetails = async () => [{ itemId: 'qa_monthly', subscriptionPeriod: 'P1Y', price: { currency: 'USD', value: '19' } }];
  await assert.rejects(f.client.prepare(), /plan details/);
  f.host.getDigitalGoodsService = () => new Promise(() => {});
  await assert.rejects(f.client.prepare(), /too long/);
  const off = fixture({ api: async () => ({ enabled: false, products: [] }) });
  await assert.rejects(off.client.prepare(), /unavailable/); assert.equal(off.state().shows, 0);
});
test('restore uses the confidential server ledger without depending on purchase history or the current Google account', async () => {
  const f = fixture(); delete f.host.getDigitalGoodsService;
  await f.client.restore(); assert.equal(f.state().active, 1);
  assert.equal(f.calls[0].body.action, 'restore');
});
test('first restore can recover an unacknowledged purchase from the device', async () => {
  const api = async (method, body) => {
    if (body?.action === 'restore') { const error = new Error(); error.code = 'no_active_purchase'; throw error; }
    if (method === 'GET') return { products: [{ productId: 'qa_monthly' }] };
    assert.equal(body.purchaseToken, 'unacknowledged');
    return { ok: true, token: 'sl_scan_v1.fixture.signature' };
  };
  const f = fixture({ api }); f.service.listPurchases = async () => [{ itemId: 'qa_monthly', purchaseToken: 'unacknowledged' }];
  await f.client.restore(); assert.equal(f.state().active, 1);
});
