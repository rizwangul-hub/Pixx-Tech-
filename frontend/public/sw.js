/**
 * PixxTech Central Portal - Service Worker
 * Strategy: Safe static app-shell caching with STRICT ZERO-CACHE for authentication and API payloads.
 * Conforms to Section 5 Security Guidelines.
 */

const CACHE_NAME = 'pixxtech-portal-v1';

// Static Shell Assets allowed for offline bootstrap
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/laptop.png',
  '/mobile.png',
  '/favicon-64x64.png'
];

// URLs that MUST NEVER be cached under any circumstances
function isSensitiveOrApiRequest(url) {
  const path = url.pathname.toLowerCase();
  const search = url.search.toLowerCase();
  return (
    path.startsWith('/api') ||
    path.includes('/auth') ||
    path.includes('/login') ||
    path.includes('/logout') ||
    path.includes('/session') ||
    path.includes('/sso') ||
    search.includes('ticket=') ||
    search.includes('token=') ||
    search.includes('sso_ticket=')
  );
}

// 1. Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PixxTech SW] Non-fatal precache asset warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Service Worker Activation & Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PixxTech SW] Purging obsolete cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network Fetch Interception
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only handle GET requests; POST, PUT, DELETE, PATCH bypass directly
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // STRICT RULE: All internal API, authentication, and SSO ticket requests are Network-Only
  if (url.origin === self.location.origin && isSensitiveOrApiRequest(url)) {
    return;
  }

  // Cross-origin requests: Allow network execution (only cache Google Fonts if desired)
  if (url.origin !== self.location.origin) {
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, resClone));
            }
            return networkRes;
          });
        })
      );
    }
    return;
  }

  // Navigation requests (HTML document): Network-first with cached shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Static Assets (JS, CSS, static images): Cache-first with background network update (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline and not in cache
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message Handler for manual update triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
