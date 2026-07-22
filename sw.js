const CACHE = 'splashlens-v33-post-value-upgrade';
const ASSETS = ['/', '/index.html', '/js/errors.js', '/js/data.js?v=20260718-partsnap-cache-safe', '/js/app.js?v=20260721-post-value-upgrade', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/manifest.json'];

function cacheKey(url) {
  return `${url.pathname}${url.search}`;
}

function isPrivateOrDynamic(url) {
  return url.pathname.startsWith('/api/')
    || url.pathname === '/dashboard'
    || url.pathname === '/dashboard.html';
}

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin || isPrivateOrDynamic(url)) return false;
  if (ASSETS.includes(cacheKey(url))) return true;
  return /\.(?:css|js|png|svg|ico|webp|jpg|jpeg)$/i.test(url.pathname);
}

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

  if (e.request.mode === 'navigate') {
    if (url.origin !== self.location.origin || isPrivateOrDynamic(url)) return;
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }

  if (!isCacheableAsset(url)) return;

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
    )
  );
});
