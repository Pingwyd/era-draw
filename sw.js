// Era Draw service worker: cache-first, versioned. Bump VERSION on every release.
const VERSION='eradraw-20261015202505';
const ASSETS=['./','index.html','style.css','fonts/fonts.css','manifest.webmanifest','icon.svg','icons/icon-180.png','icons/icon-192.png','fonts/Silkscreen-400.woff2','fonts/Silkscreen-700.woff2','fonts/VT323-400.woff2','fonts/InstrumentSerif-400.woff2',
 'audio.js','sprites.js','enemies.js','forge.js','game.js','eras.js','meta.js','platform.js','progression.js','cave.js','ink.js','iron.js','bosses.js','social.js','coop.js','mythic.js','spells.js','cards.js','build.js','polish.js','minimap.js','remap.js','vendor/qrcode.js','lan.js','content.js','ach2.js','targeting.js','nav.js','waves.js','spacing.js','tutorial2.js','tutorial2.js','ui.js','consent.js','dev.js','main.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match('index.html'))))});
