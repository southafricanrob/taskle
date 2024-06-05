const cacheName = 'taskle-v1';
const precacheResources = [
  '/',
  'index.html',
  'taskle-style.css',
  'taskle-script.js',
  'taskle-icon-192.png',
  'taskle-icon-512.png',
  'screenshot-mobile.png',
  'screenshot-desktop.png',
];

self.addEventListener('install', event => {
  console.log('Service worker install event!');
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('Caching resources: ', precacheResources);
      return cache.addAll(precacheResources).catch(error => {
        console.error('Failed to cache:', error);
      });
    })
  );
});

self.addEventListener('activate', event => {
  console.log('Service worker activate event!');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== cacheName).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  console.log('Fetch intercepted for:', event.request.url);
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

