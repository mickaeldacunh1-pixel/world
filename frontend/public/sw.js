const CACHE_NAME = 'world-auto-v2';
const STATIC_CACHE = 'world-auto-static-v2';

// Only cache static assets, NEVER API calls
const urlsToCache = [
  '/logo192.png',
  '/logo512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Installing new cache version');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache install error:', err);
      })
  );
  // Force activation immediately
  self.skipWaiting();
});

// Fetch event - NETWORK FIRST for everything except static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NEVER cache API requests - always go to network
  if (url.pathname.startsWith('/api') || 
      url.pathname.includes('/api/') ||
      event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For HTML pages - always fetch fresh, fallback to cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For static assets (images, fonts, etc.) - cache first, then network
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then((fetchResponse) => {
            return caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
    return;
  }
  
  // For JS/CSS - network first to get latest version
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: New version activated, claiming clients');
      return self.clients.claim();
    })
  );
});

// Force update all clients when SW updates
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('World Auto France', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
