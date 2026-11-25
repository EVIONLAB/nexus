// NEXUS: copia locale dell'app per usarla anche senza internet.
// Quando aggiorni l'app, cambia il numero qui sotto, così il dispositivo scarica la versione nuova.
const CACHE = 'nexus-v18';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  // ogni file da solo: se un'icona manca, l'aggiornamento si installa lo stesso
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, {cache: 'reload'}).then(r => r.ok && c.put(f, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  // solo i file dell'app: tutto il resto passa diretto, senza copie
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    // prima la rete, chiedendo sempre al server se c'è una versione nuova (niente copie vecchie del browser)
    fetch(e.request, {cache: 'no-cache'}).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }
      return caches.match(e.request).then(c => c || r);
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
