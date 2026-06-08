const CACHE_NAME = 'escape-room-v2';
const ASSETS = [
  './escape-room-player.html',
  './manifest.json',
  './icon.svg'
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

// Fetch — serve do cache se offline, rede se online
self.addEventListener('fetch', e => {
  // Só interceptar requests do mesmo domínio
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Serve cache E actualiza em background (stale-while-revalidate)
        const fetchPromise = fetch(e.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached;
      }
      // Não está em cache — vai à rede
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Offline e não está em cache
        if (e.request.destination === 'document') {
          return caches.match('./escape-room-player.html');
        }
      });
    })
  );
});
