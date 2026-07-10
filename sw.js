const CACHE="depot-v4-1";
const ASSETS=["./","./index.html?v=4.1","./style.css?v=4.1","./app.js?v=4.1","./data.js?v=4.1","./manifest.webmanifest"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?Promise.resolve():caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(["data.js","app.js","index.html","style.css"].some(n=>u.pathname.endsWith("/"+n))){
   e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request)));
   return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});