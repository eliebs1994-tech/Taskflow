const CACHE = 'taskflow-v1';
const ASSETS = ['/', '/app.js', '/manifest.json'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/socket.io/')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
