// Service worker — Conexão Vendas v2 (PWA instalável + cache de fotos). Sem notificações push.
const VERSAO = 'v2-2';
const SHELL = `conexao-shell-${VERSAO}`;
const FOTOS = 'conexao-fotos-v1'; // não muda de nome a cada versão: fotos ficam no aparelho
const MAX_FOTOS = 600;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.json', '/icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      // apaga caches antigos (inclusive o "conexao-v3" do app anterior)
      caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL && k !== FOTOS).map((k) => caches.delete(k)))),
      // o app antigo assinava notificações push; o novo não usa mais — cancela a assinatura deste aparelho
      self.registration.pushManager ? self.registration.pushManager.getSubscription().then((s) => s && s.unsubscribe()).catch(() => {}) : null,
    ]),
  );
  self.clients.claim();
});

const ehFoto = (url) => url.pathname.includes('/storage/v1/object/public/produtos/') || url.pathname.startsWith('/mock/fotos/');

async function limitar(cache) {
  const ks = await cache.keys();
  for (let i = 0; i < ks.length - MAX_FOTOS; i++) await cache.delete(ks[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fotos: cache-first (cada versão de foto tem URL própria, então nunca fica velha)
  if (ehFoto(url)) {
    e.respondWith(
      caches.open(FOTOS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') {
          c.put(req, res.clone());
          limitar(c);
        }
        return res;
      }),
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Páginas: rede primeiro (sempre a versão nova), offline cai no cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const cp = res.clone();
          caches.open(SHELL).then((c) => c.put(req, cp));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/'))),
    );
    return;
  }
  // JS/CSS/fontes do Next têm hash no nome: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(caches.open(SHELL).then(async (c) => (await c.match(req)) || fetch(req).then((res) => (c.put(req, res.clone()), res))));
  }
});
