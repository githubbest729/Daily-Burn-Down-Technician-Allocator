/*
 * Minimal offline app-shell service worker.
 *
 * Strategy:
 *  - PRECACHE: a small, explicit list of shell files (index.html, manifest,
 *    icons) fetched and cached on install, so the app has something to show
 *    even on a cold offline start.
 *  - RUNTIME CACHE (cache-first, network-fallback-then-cache-fill): every
 *    other same-origin GET request (the hashed JS/CSS bundles Vite produces,
 *    fonts, etc.) is cached the first time it's fetched and served from
 *    cache on every subsequent request, including fully offline. This
 *    avoids hardcoding hashed build filenames here.
 *  - Navigation requests fall back to the cached index.html when the
 *    network is unavailable, so deep refreshes still work in a dead zone.
 *
 * No Background Sync, no Push — intentionally out of scope per spec.
 */

const CACHE_VERSION = 'burndown-shell-v1';
const RUNTIME_CACHE = 'burndown-runtime-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests; let everything else pass through
  // untouched (e.g. cross-origin calls, POSTs).
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Navigations: try network first (fresh shell when online), fall back to
  // the cached shell when offline or in a dead zone.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Everything else: cache-first, then network, then stash a copy for next
  // time we're offline.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
