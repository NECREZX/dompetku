const CACHE_NAME = 'dompetku-v1';
const assets = [
  './',
  './index.html',
  './css/main.css',
  './css/navbar.css',
  './css/sidebar.css',
  './css/bottombar.css',
  './css/components.css',
  './js/app.js',
  './js/storage.js',
  './js/ui.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
