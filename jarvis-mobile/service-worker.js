/* ============================================================
   JARVIS MOBILE — service-worker.js
   Face cache la toate fișierele aplicației, ca să se deschidă
   și fără internet (cerință PWA).
   Când modifici fișiere, crește versiunea CACHE ca telefoanele
   să primească varianta nouă.
   ============================================================ */
const CACHE = 'jarvis-mobile-v1';

// tot ce trebuie să meargă offline
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // fonturile Google (foaia de stil; fișierele woff2 se prind din mers)
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
];

// instalare: descarcă și salvează toate fișierele
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// activare: șterge cache-urile vechi
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// cereri: întâi cache, apoi rețea; răspunsurile noi (ex. fonturile woff2)
// se salvează în cache din mers
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        const copy = resp.clone();
        if (resp.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      }).catch(() => cached);
    })
  );
});
