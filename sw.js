const CACHE_NAME = 'dompetku-v6';
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
  './js/format.js',
  './js/theme.js',
  './js/export.js',
  './js/keuangan/sumber.js',
  './js/keuangan/transaksi.js',
  './js/keuangan/riwayat.js',
  './js/tabungan/tujuan.js',
  './js/tabungan/riwayat.js',
  './js/tabungan/kelola.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Paksa service worker baru aktif
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
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
