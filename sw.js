// Service worker — Conexão (PWA)
const CACHE = 'conexao-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// network-first para navegação (sempre tenta o site atualizado; offline cai no cache)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }
  // demais GETs do próprio site: cache-first leve
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
