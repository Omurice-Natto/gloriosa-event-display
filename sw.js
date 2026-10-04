const CACHE_NAME='gloriosa-ipad-pwa-v1';
const APP_SHELL=[
  './','./index.html','./styles.css','./config.js','./app.js','./manifest.webmanifest',
  './icon-180.png','./icon-192.png','./icon-512.png',
  './assets/logo-black.png','./assets/logo-white.png','./assets/qr-x.svg','./assets/qr-booth.svg',
  './assets/voice-cover.png','./assets/voice-p1.png','./assets/voice-p2.png','./assets/voice-p3.png',
  './assets/matome-cover.png','./assets/nemophila-cover.jpg','./assets/acrylic.png'
];
const PDFJS_URLS=[
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];
async function cachePdfJs(){
  const cache=await caches.open(CACHE_NAME);
  const results=[];
  for(const url of PDFJS_URLS){
    try{
      const res=await fetch(url,{mode:'cors',cache:'reload'});
      if(res && res.ok){await cache.put(url,res.clone()); results.push({url,ok:true});}
      else results.push({url,ok:false});
    }catch(e){results.push({url,ok:false});}
  }
  return results;
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await cachePdfJs();
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='CACHE_PDFJS'){
    event.waitUntil(cachePdfJs().then(results=>event.source?.postMessage({type:'PDFJS_CACHE_RESULT',results})));
  }
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  const isPdfJs=PDFJS_URLS.includes(event.request.url);
  if(isPdfJs){
    event.respondWith((async()=>{
      const cached=await caches.match(event.request);
      if(cached) return cached;
      try{
        const res=await fetch(event.request);
        if(res && res.ok){const cache=await caches.open(CACHE_NAME); await cache.put(event.request,res.clone());}
        return res;
      }catch(e){return new Response('',{status:503,statusText:'PDF.js offline cache missing'});}
    })());
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(event.request);
      if(cached) return cached;
      try{
        const res=await fetch(event.request);
        if(res && res.ok){const cache=await caches.open(CACHE_NAME); await cache.put(event.request,res.clone());}
        return res;
      }catch(e){
        if(event.request.mode==='navigate') return (await caches.match('./index.html')) || (await caches.match('./'));
        throw e;
      }
    })());
  }
});
