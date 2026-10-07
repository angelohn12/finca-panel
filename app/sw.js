// Service worker de la app de bolsillo de Costa Piña.
// Guarda la app (no los datos: esos van en el almacenamiento del celular)
// para que abra aunque no haya señal en la finca.
// - La página: primero internet (para recibir arreglos), si no hay, la guardada.
// - Leaflet, fuentes e íconos: primero lo guardado.
// - El mapa satelital y la API de Google nunca se guardan acá.
const VERSION = 'cp-app-1';
const BASE = ['./', './index.html', './manifest.webmanifest', '../icon-192.png', '../icon-512.png', '../apple-touch-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com') || url.hostname.endsWith('arcgisonline.com')) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => {
      const copia = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copia)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  e.respondWith(caches.match(e.request).then(guardado => guardado || fetch(e.request).then(r => {
    if (r.ok && (url.hostname === 'unpkg.com' || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com') || url.origin === self.location.origin)) {
      const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia));
    }
    return r;
  })));
});
