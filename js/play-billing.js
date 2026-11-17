// Purchase UI is capability- and server-gated. A client receipt never unlocks
// scans; only the authenticated backend's signed entitlement does.
(() => {
  const method = 'https://play.google.com/billing';
  function createClient({ host = window, api, accountToken, activate, timeoutMs = 15000 }) {
    let prepared = null;
    let busy = false;
    async function bounded(promise) {
      let timer;
      try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Google Play took too long. Please try again.')), timeoutMs); })]); }
      finally { clearTimeout(timer); }
    }
    async function prepare() {
      if (busy) throw new Error('A Google Play request is already open.');
      prepared = null;
      const identity = accountToken();
      if (!identity) throw new Error('Verify your SplashLens account before using Google Play.');
      const catalog = await api('GET', null, identity);
      if (!catalog.enabled || !Array.isArray(catalog.products) || catalog.products.length !== 2) throw new Error('Google Play upgrades are unavailable in this build. Manual tools stay free.');
      if (typeof host.getDigitalGoodsService !== 'function' || typeof host.PaymentRequest !== 'function') throw new Error('This build does not support Google Play purchases. Manual tools stay free.');
      const service = await bounded(host.getDigitalGoodsService(method));
      const details = await bounded(service.getDetails(catalog.products.map(p => p.productId)));
      const items = catalog.products.map(product => {
        const detail = details.find(d => d.itemId === product.productId);
        const period = product.plan === 'monthly' ? 'P1M' : product.plan === 'yearly' ? 'P1Y' : '';
        if (!period || detail?.subscriptionPeriod !== period || !/^[A-Z]{3}$/.test(detail?.price?.currency || '')
          || !/^\d+(\.\d+)?$/.test(detail?.price?.value || '') || !(Number(detail.price.value) > 0)) throw new Error('Google Play plan details are unavailable. Please try again.');
        return { ...product, price: detail.price };
      });
      const purchases = await bounded(service.listPurchases());
      if (accountToken() !== identity) throw new Error('Your account changed. Reopen Google Play access.');
      prepared = { service, items, identity, purchases };
      return { items, hasPurchase: purchases.some(p => items.some(i => i.productId === p.itemId)) };
    }
    async function verify(token, identity) {
      const result = await api('POST', { action: 'verify', purchaseToken: token }, identity);
      if (accountToken() !== identity) throw new Error('Your account changed. Sign in to the original account and use Restore.');
      if (!result.ok || !String(result.token || '').startsWith('sl_scan_v1.')) throw new Error('Google Play access could not be confirmed. Please use Restore.');
      activate(result);
      return result;
    }
    async function buy(plan) {
      if (busy) throw new Error('A Google Play request is already open.');
      if (!prepared || accountToken() !== prepared.identity) throw new Error('Reopen Google Play access before purchasing.');
      if (prepared.purchases.some(p => prepared.items.some(i => i.productId === p.itemId))) throw new Error('You already have a Google Play purchase. Use Restore or manage it in Google Play.');
      const item = prepared.items.find(i => i.plan === plan);
      if (!item) throw new Error('This Google Play plan is unavailable.');
      const identity = prepared.identity;
      busy = true;
      let payment;
      try {
        // Call show during the button's user activation, before any await.
        const request = new host.PaymentRequest([{ supportedMethods: method, data: { sku: item.productId } }], { total: { label: item.label, amount: item.price } });
        payment = await request.show();
        // A returned receipt may represent a real/pending payment even if our
        // verification request fails. Require Restore instead of a second buy.
        if (payment.details?.purchaseToken) prepared.purchases.push({ itemId: item.productId });
        const result = await verify(payment.details?.purchaseToken, identity);
        try { await payment.complete('success'); } catch {} // Receipt already verified; a closed payment sheet cannot undo the grant.
        return result;
      } catch (error) {
        if (payment) { try { await payment.complete('fail'); } catch {} }
        if (error.name === 'AbortError') throw new Error('Purchase canceled. You can keep using the free tools.');
        throw error;
      } finally { busy = false; }
    }
    async function restore() {
      if (busy) throw new Error('A Google Play request is already open.');
      const identity = accountToken();
      if (!identity) throw new Error('Verify your original SplashLens account to restore.');
      busy = true;
      try {
        // The backend ledger restores purchases even when the device's current
        // Google account cannot list them. History APIs are not used (Billing8).
        try {
          const saved = await api('POST', { action: 'restore' }, identity);
          if (accountToken() !== identity) throw new Error('Your account changed. Try Restore again.');
          if (!saved.ok || !String(saved.token || '').startsWith('sl_scan_v1.')) throw new Error('Restore could not be confirmed.');
          activate(saved); return saved;
        } catch (error) { if (error.code !== 'no_active_purchase') throw error; }
        if (typeof host.getDigitalGoodsService !== 'function') throw new Error('Open the installed Google Play build with the original Google account, then try Restore.');
        const service = await bounded(host.getDigitalGoodsService(method));
        const purchases = await bounded(service.listPurchases());
        const catalog = await api('GET', null, identity);
        const candidates = purchases.filter(p => catalog.products?.some(i => i.productId === p.itemId));
        for (const purchase of candidates) {
          try { return await verify(purchase.purchaseToken, identity); }
          catch (error) { if (!['purchase_inactive', 'purchase_not_found'].includes(error.code)) throw error; }
        }
        throw new Error('No active Google Play subscription was found. Check the original Google and SplashLens accounts or contact hello@splashlens.com.');
      } finally { busy = false; }
    }
    return { prepare, buy, restore };
  }
  window.SplashLensPlayBilling = { createClient };
})();
