// Keeps the planner working offline. Bump VERSION after every update so devices fetch the new files.
const VERSION = 'planner-v6';
const FILES = ['./', './index.html', './manifest.webmanifest', './hero-poster.jpg', './favicon.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // The video is scrubbed by time and needs byte-range requests, so the browser fetches it directly.
  if (e.request.headers.has('range') || new URL(e.request.url).pathname.endsWith('.mp4')) return;
  if (new URL(e.request.url).origin !== location.origin && !e.request.url.includes('fonts.g')) return; // sync and other outside requests go straight to the network
  // Network first (fresh when online), cache as fallback (works offline).
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && r.status === 200 && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) {
        const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
