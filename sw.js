const CACHE_NAME = 'escape-room-v4';
const ASSETS = [
  './escape-room-player.html',
  './escape-room-config.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './1405.jpg'
];

// Instalar — guarda ficheiros em cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar — limpa caches antigas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — stale-while-revalidate: serve cache imediatamente, actualiza em background
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise.catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('./escape-room-player.html');
        }
      });
    })
  );
});
