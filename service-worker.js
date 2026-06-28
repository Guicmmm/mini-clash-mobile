const CACHE_NAME = 'mini-clash-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './service-worker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - recurso não disponível', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova notificação!',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23222" width="192" height="192"/><text x="96" y="110" font-size="80" font-weight="bold" fill="%2300ffcc" text-anchor="middle" font-family="Arial">⚔</text></svg>',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23222" width="192" height="192"/><text x="96" y="110" font-size="80" font-weight="bold" fill="%2300ffcc" text-anchor="middle" font-family="Arial">⚔</text></svg>',
    tag: 'mini-clash-notification'
  };
  event.waitUntil(self.registration.showNotification('Mini Clash', options));
});