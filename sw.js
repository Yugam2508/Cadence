// Cadence service worker: keeps the app shell available offline.
// App files are network-first so updates arrive straight away; fonts are cache-first.
// Database traffic (supabase.co) is never cached.
const CACHE='cadence-v4';
const SHELL=['/','/styles.css','/app.js','/config.js','/vendor/supabase-2.45.4.js','/manifest.webmanifest','/icon.svg','/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.hostname.endsWith('supabase.co'))return;
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})));
    return;
  }
  if(url.origin!==location.origin)return;
  e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})
    .catch(()=>caches.match(req).then(hit=>hit||(req.mode==='navigate'?caches.match('/'):undefined))));
});
