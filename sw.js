// NEXUS: copia locale dell'app per usarla anche senza internet.
// Quando aggiorni l'app, cambia il numero qui sotto, così il telefono scarica la versione nuova.
const CACHE = 'nexus-v17';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  // solo i file dell'app: tutto il resto passa diretto, senza copie
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      // prima la rete (così arrivano gli aggiornamenti); si salva in copia solo una risposta buona
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }
      return caches.match(e.request).then(c => c || r);
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
