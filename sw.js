const CACHE = 'splashlens-v16-static-only';
const ASSETS = [
  '/',
  '/index.html',
  '/js/errors.js',
  '/js/data.js?v=20260904-commercial-scale',
  '/js/app.js?v=20261002-partsnap-proof-gate',
  '/js/field-signals.js?v=20260728-field-signals',
  '/js/analytics.js',
  '/js/field-score.js?v=20260914-closing-season-challenge',
  '/favicon.svg',
  '/manifest.json'
];
const STATIC_ASSET_URLS = new Set(ASSETS.map(asset => new URL(asset, self.location.origin).href));

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
  const staticAsset = sameOrigin && STATIC_ASSET_URLS.has(url.href);
  const authenticated = e.request.headers.has('authorization')
    || e.request.headers.has('x-splashlens-account-token')
    || e.request.headers.has('x-splashlens-profile-token');
  if (!staticAsset || authenticated || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => e.request.mode === 'navigate' ? caches.match('/index.html') : Response.error());
    })
  );
});
