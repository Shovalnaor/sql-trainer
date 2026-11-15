// Offline cache for the SQL trainer. Bump CACHE when files change.
const CACHE = 'sql-trainer-v8';
const SHELL = ['./', './index.html', './sql-asm.js', './sync-config.js', './sync.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (url.origin === location.origin || isFont) {
    e.respondWith(
      caches.match(req).then(hit => {
        const fetchAndCache = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        // app shell: network first so updates land, fall back to cache offline
        if (url.origin === location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('index.html'))) return fetchAndCache.then(r => r || hit);
        return hit || fetchAndCache;
      })
    );
  }
});
