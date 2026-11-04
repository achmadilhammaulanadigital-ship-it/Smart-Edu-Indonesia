const C="smart-edu-v8";
const A=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(C).then(async c=>{
    await c.addAll(A);
    try{ // simpan audio Arab (jika ada) agar bisa dipakai tanpa internet
      const r=await fetch("audio/manifest.json");
      if(r.ok){const m=await r.clone().json();await c.put("audio/manifest.json",r);
        for(const k of Object.keys(m)){try{await c.add("audio/ar/"+k+".mp3")}catch(_){}}}
    }catch(_){}
  }));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
async function potong(req,res){ // Safari meminta audio per bagian (Range)
  const b=await res.blob(),m=/bytes=(\d+)-(\d*)/.exec(req.headers.get("range")||"");
  if(!m)return res;
  const s=+m[1],t=m[2]?Math.min(+m[2],b.size-1):b.size-1;
  return new Response(b.slice(s,t+1),{status:206,statusText:"Partial Content",headers:{"Content-Type":b.type||"audio/mpeg","Content-Range":"bytes "+s+"-"+t+"/"+b.size,"Content-Length":String(t-s+1)}});
}
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  if(e.request.headers.has("range")){
    e.respondWith(caches.match(e.request,{ignoreVary:true}).then(r=>r?potong(e.request,r):fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    if(res&&res.status===200){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp))}
    return res;
  }).catch(()=>caches.match("index.html"))));
});
