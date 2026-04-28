const CACHE_NAME = 'marche-auto-v1';
const ASSETS = [
  '/',
  '/index.html'
];

// Installation — mise en cache des ressources essentielles
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — stratégie Network First (fraîcheur des données)
self.addEventListener('fetch', function(event) {
  // Ne pas intercepter les requêtes API
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('twilio.com') ||
      event.request.url.includes('brevo.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Mettre en cache la réponse fraîche
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Hors ligne — retourner le cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
  );
});

// Notifications push (pour les alertes)
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'Le Marché Auto';
  var options = {
    body: data.body || 'Nouvelle annonce disponible !',
    icon: 'https://i.imgur.com/iLRREdx.png',
    badge: 'https://i.imgur.com/iLRREdx.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
