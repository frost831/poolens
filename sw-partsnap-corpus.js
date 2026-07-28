const CACHE = 'splashlens-v29-field-signals';
const FIELD_SIGNAL_STATE_KEY = '/__splashlens-field-signal-state';
const FIELD_SIGNAL_FEED = '/data/field-signals/current.json';
const ASSETS = [
  '/',
  '/index.html',
  '/js/errors.js',
  '/js/data.js?v=20260718-partsnap-cache-safe',
  '/js/app.js?v=20260728-field-signals',
  '/js/field-signals.js?v=20260728-field-signals',
  '/js/field-signals-core.mjs',
  FIELD_SIGNAL_FEED,
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

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
  return /\.(?:css|js|mjs|png|svg|ico|webp|jpg|jpeg)$/i.test(url.pathname);
}

async function readFieldSignalState() {
  const cache = await caches.open(CACHE);
  const response = await cache.match(FIELD_SIGNAL_STATE_KEY);
  if (!response) return { preferences: null, feedIds: [], shownAt: [] };
  try {
    return await response.json();
  } catch {
    return { preferences: null, feedIds: [], shownAt: [] };
  }
}

async function writeFieldSignalState(state) {
  const cache = await caches.open(CACHE);
  await cache.put(FIELD_SIGNAL_STATE_KEY, new Response(JSON.stringify(state), {
    headers: { 'content-type': 'application/json' },
  }));
}

function isQuietTime(preferences, now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const parse = (value, fallback) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || '');
    return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
  };
  const start = parse(preferences?.quietStart, 20 * 60);
  const end = parse(preferences?.quietEnd, 7 * 60);
  return start > end ? minutes >= start || minutes < end : minutes >= start && minutes < end;
}

function signalCategoryEnabled(signal, preferences) {
  const category = signal.category === 'equipment' ? 'equipmentUpdates' : signal.category;
  return preferences?.categories?.[category] !== false;
}

async function showFieldSignal(signal) {
  await self.registration.showNotification(signal.title || 'SplashLens Field Signal', {
    body: signal.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `splashlens-field-signal-${signal.id || 'update'}`,
    renotify: false,
    silent: true,
    data: {
      signalId: signal.id || '',
      url: signal.deepLink || `/?field_signal=${encodeURIComponent(signal.id || 'update')}&tab=errors`,
    },
  });
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin && url.pathname === FIELD_SIGNAL_FEED) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  if (event.request.mode === 'navigate') {
    if (url.origin !== self.location.origin || isPrivateOrDynamic(url)) return;
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }

  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
      }
      return response;
    }))
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SPLASHLENS_SHOW_FIELD_SIGNAL' && data.signal) {
    event.waitUntil(showFieldSignal(data.signal));
    return;
  }
  if (data.type === 'SPLASHLENS_FIELD_SIGNAL_PREFS') {
    event.waitUntil(readFieldSignalState().then(state => writeFieldSignalState({
      ...state,
      preferences: data.preferences || null,
    })));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const relative = event.notification.data?.url || '/?tab=errors';
  const target = new URL(relative, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener('periodicsync', event => {
  if (event.tag !== 'splashlens-field-signals') return;
  event.waitUntil((async () => {
    const state = await readFieldSignalState();
    const preferences = state.preferences;
    if (!preferences?.enabled || !preferences.systemNotifications || isQuietTime(preferences)) return;

    const now = Date.now();
    const shownAt = (state.shownAt || []).map(Number).filter(value => Number.isFinite(value) && now - value < 7 * 86400000);
    const shownToday = shownAt.filter(value => now - value < 86400000).length;
    if (shownToday >= Number(preferences.maxDaily || 1) || shownAt.length >= Number(preferences.maxWeekly || 2)) return;

    const response = await fetch(FIELD_SIGNAL_FEED, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    const currentIds = items.map(item => item.id).filter(Boolean);
    if (!(state.feedIds || []).length) {
      await writeFieldSignalState({ ...state, feedIds: currentIds, shownAt });
      return;
    }

    const known = new Set(state.feedIds || []);
    const signal = items.find(item => item.notificationEligible && !known.has(item.id) && signalCategoryEnabled(item, preferences));
    if (!signal) {
      await writeFieldSignalState({ ...state, feedIds: currentIds, shownAt });
      return;
    }
    await showFieldSignal(signal);
    await writeFieldSignalState({ ...state, feedIds: currentIds, shownAt: [...shownAt, now] });
  })());
});
