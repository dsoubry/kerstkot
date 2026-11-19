/* Kerstkot drankenrekenmachine: app-shell offline, prijzen online-first. */
const CACHE = 'kerstkot-rekenmachine-v1';
const SHELL = [
  './DrankenRekenmachine.html',
  './manifest.webmanifest',
  './kerstboom-192.png',
  './kerstboom-512.png',
  './kerstboom-180.png',
  './rekenmachine_config.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && key.startsWith('kerstkot-rekenmachine-')).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL('./',self.registration.scope).pathname)) return;
  // Always prefer current central prices; if offline, fall back to last cached copy.
  if (url.pathname.endsWith('/rekenmachine_config.json')) {
    event.respondWith(fetch(req).then(resp => {
      if (resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put('./rekenmachine_config.json',copy));
      }
      return resp;
    }).catch(async () => (await caches.match('./rekenmachine_config.json')) || Response.error()));
    return;
  }
  if (url.pathname.endsWith('/DrankenRekenmachine.html') || url.pathname.endsWith('/')) {
    event.respondWith(fetch(req).then(resp => {
      if (resp.ok) {const copy=resp.clone(); caches.open(CACHE).then(c=>c.put('./DrankenRekenmachine.html',copy));}
      return resp;
    }).catch(async () => (await caches.match('./DrankenRekenmachine.html')) || Response.error()));
    return;
  }
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(cached => cached || fetch(req)));
});
