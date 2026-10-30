const CACHE = 'splashlens-v60-public-cache';
const ASSETS = [
  '/',
  '/js/errors.js?v=20261010-hayward-safety',
  '/js/data.js?v=20261013-crew',
  '/js/i18n.js?v=20261030-closing-short',
  '/js/app.js?v=20261030-closing-cohorts',
  '/js/stop-flow.js?v=20261012-stop-flow',
  '/js/day-recap.js?v=20261012-day-recap',
  '/js/morning-route.js?v=20261012-morning-route',
  '/js/seasonal-checklist.js?v=20261013-closing-pro',
  '/js/field-config.js?v=20261012-soft-gate',
  '/js/soft-gate.js?v=20261012-soft-gate',
  '/js/review-prompt.js?v=20261012-review-prompt',
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
const STATIC_ASSETS = new Set(ASSETS.filter(asset => asset !== '/'));

function publicResponse(response) {
  return response.ok && response.type === 'basic'
    && !/\b(?:private|no-store)\b/i.test(response.headers.get('Cache-Control') || '');
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
  const sameOrigin = url.origin === self.location.origin;
  const authenticated = e.request.headers.has('authorization')
    || e.request.headers.has('x-splashlens-account-token')
    || e.request.headers.has('x-splashlens-profile-token');
  if (!sameOrigin || authenticated || url.pathname.startsWith('/api/')) return;

  if (e.request.mode === 'navigate') {
    const appShell = url.pathname === '/' || url.pathname === '/index.html';
    e.respondWith(
      fetch(e.request).then(async response => {
        if (appShell && publicResponse(response) && /text\/html/i.test(response.headers.get('Content-Type') || '')) {
          e.waitUntil?.(caches.open(CACHE).then(cache => cache.put('/', response.clone())));
        }
        if (response.type === 'error' || response.status === 0) {
          return appShell ? (await caches.match('/')) || response : response;
        }
        return response;
      }).catch(async () => appShell ? (await caches.match('/')) || Response.error() : Response.error())
    );
    return;
  }

  if (!STATIC_ASSETS.has(`${url.pathname}${url.search}`)
    && !url.pathname.startsWith('/js/') && !url.pathname.startsWith('/icons/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (publicResponse(res)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => Response.error());
    })
  );
});
