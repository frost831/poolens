const CACHE = 'splashlens-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/js/errors.js',
  '/js/data.js?v=20260823-closing-season-mode',
  '/js/app.js?v=20260823-closing-season-mode',
  '/js/field-signals.js?v=20260728-field-signals',
  '/js/analytics.js',
  '/js/field-score.js?v=20260828-closing-score',
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
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
