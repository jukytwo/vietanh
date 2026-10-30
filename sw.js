/* Góc học tập: dùng được khi không có mạng. Trang lưu sẵn; clip chỉ lưu khi bấm tải. Mọi nội dung đều đã mã hoá. */
const VER="e0ba88db29",APP="gh-app-"+VER,FONT="gh-font",CLIP="gh-clips";
const CORE=["./","index.html","app_basic.bin","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","favicon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("gh-app-")&&k!==APP).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;const u=new URL(req.url);
 if(u.origin===location.origin&&u.pathname.includes("/clips/")){e.respondWith(caches.open(CLIP).then(async c=>(await c.match(u.href))||fetch(req)));return}
 if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open(FONT).then(async c=>{const hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);if(r.ok||r.type==="opaque")c.put(req,r.clone());return r}catch(x){return Response.error()}}));return}
 if(u.origin===location.origin&&/ver\.json$/.test(u.pathname)){e.respondWith(fetch(req,{cache:"no-store"}).catch(()=>new Response("{}",{status:503})));return}
 if(u.origin===location.origin&&/users\.json$/.test(u.pathname)){e.respondWith(fetch(req,{cache:"no-store"}).then(r=>{if(r.ok)caches.open(APP).then(c=>c.put("users.json",r.clone()));return r}).catch(()=>caches.open(APP).then(c=>c.match("users.json")).then(h=>h||new Response("{}",{status:503}))));return}
 if(u.origin===location.origin&&(req.mode==="navigate"||/\.bin$/.test(u.pathname))){e.respondWith((async()=>{const c=await caches.open(APP);const key=req.mode==="navigate"?"index.html":req;
 const net=fetch(req,{cache:"no-cache"});
 try{const r=await Promise.race([net,new Promise((_,rej)=>setTimeout(()=>rej(new Error("slow")),5000))]);if(r&&r.ok){c.put(key,r.clone());return r}throw new Error("bad")}catch(x){const hit=await c.match(key,{ignoreSearch:true});
  /* mạng chậm: dùng bản đã lưu, tải bản mới ở nền rồi báo trang để mời cập nhật */
  if(hit&&req.mode!=="navigate"){e.waitUntil(net.then(async r=>{if(!r||!r.ok)return;const old=(hit.headers.get("etag")||"")+"|"+(hit.headers.get("content-length")||"");const nw=(r.headers.get("etag")||"")+"|"+(r.headers.get("content-length")||"");await c.put(key,r.clone());if(old!==nw){const cs=await self.clients.matchAll({includeUncontrolled:true});cs.forEach(cl=>cl.postMessage({t:"gh-updated"}))}}).catch(()=>{}))}
  return hit||net}})());return}
if(u.origin===location.origin){e.respondWith((async()=>{const c=await caches.open(APP);const key=req.mode==="navigate"?"index.html":req;const hit=await c.match(key,{ignoreSearch:true});
  const net=fetch(req).then(r=>{if(r.ok)c.put(key,r.clone());return r}).catch(()=>null);if(hit){e.waitUntil(net);return hit}const r=await net;return r||new Response("",{status:503})})())}});
