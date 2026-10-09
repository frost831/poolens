const CACHE = 'splashlens-v38-cost-unknown';
const ASSETS = [
  '/',
  '/js/errors.js?v=20261002-trust-fixes-3',
  '/js/data.js?v=20261002-trust-fixes-2',
  '/js/i18n.js?v=20261009-cost-unknown',
  '/js/app.js?v=20261009-cost-unknown',
  '/js/crm-proof-export.js?v=20261009-pc20',
  '/js/packet-share.js?v=20261009-restart-a4',
  '/js/truck-qr.js?v=20261009-restart-a5',
  '/js/vendor/qrcode-generator.mjs?v=20261009-restart-a5',
  '/js/partsnap-boss-packet.js?v=20261005-boss-draft',
  '/js/field-signals.js?v=20260728-field-signals',
  '/js/analytics.js',
  '/js/field-score.js?v=20260914-closing-season-challenge',
  '/favicon.svg',
  '/manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const authenticated = e.request.headers.has('authorization')
    || e.request.headers.has('x-splashlens-account-token')
    || e.request.headers.has('x-splashlens-profile-token');
  if (!sameOrigin || authenticated || url.pathname.startsWith('/api/')) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(async response => {
        if (response.ok && response.type === 'basic') {
          caches.open(CACHE).then(cache => cache.put('/', response.clone()));
        }
        if (response.type === 'error' || response.status === 0) {
          return (await caches.match('/')) || response;
        }
        return response;
      }).catch(async () => (await caches.match('/')) || Response.error())
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => Response.error());
    })
  );
});
