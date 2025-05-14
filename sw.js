const CACHE_NAME = 'todo-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.json',
  // Add any additional resources (like CSS files or images) here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached resource if available; otherwise, fetch from network
        return response || fetch(event.request);
      })
  );
});
