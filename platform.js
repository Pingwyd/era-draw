'use strict';
// ================= PLATFORM: iOS / PWA / low-end devices =================
const UA=navigator.userAgent||'';
const IS_IOS=/iP(hone|od|ad)/.test(UA)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IS_STANDALONE=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||(window.matchMedia&&matchMedia('(display-mode: fullscreen)').matches);
const SMALL_SCREEN=Math.min(screen.width,screen.height)<=375||Math.min(innerWidth,innerHeight)<=340;
const LOW_END=(navigator.hardwareConcurrency||4)<=2||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(IS_IOS&&SMALL_SCREEN);
// sensible defaults on first launch (user choices in Settings win afterwards)
if(!save.perfSet&&save.perf===undefined)save.perf=!!(LOW_END||SMALL_SCREEN);
if(!save.scaleSet&&SMALL_SCREEN&&!save.autoScaled){save.autoScaled=true;save.uiScale=save.uiScale&&save.uiScale!==1?save.uiScale:.85;save.hudScale=save.hudScale&&save.hudScale!==1?save.hudScale:.9}
persist();
if(SMALL_SCREEN)document.documentElement.classList.add('small');
if(IS_IOS)document.documentElement.classList.add('ios');
// service worker (offline play)
if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(r=>{if(window.swWatch)swWatch(r)}).catch(()=>{}));
// install prompts
let deferredPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;showInstall()});
const SHARE_ICON='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 13" shape-rendering="crispEdges"><g fill="#4aa3ff"><rect x="5" y="0" width="1" height="8"/><rect x="4" y="1" width="3" height="1"/><rect x="3" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/><rect x="0" y="5" width="3" height="1"/><rect x="8" y="5" width="3" height="1"/><rect x="0" y="5" width="1" height="8"/><rect x="10" y="5" width="1" height="8"/><rect x="0" y="12" width="11" height="1"/></g></svg>');
function showInstall(){
  if(IS_STANDALONE||save.installDismissed||document.getElementById('install'))return;
  if(!(IS_IOS||deferredPrompt))return;
  const el=document.createElement('div');el.id='install';
  el.innerHTML=IS_IOS?`<b>Install Era Draw</b><span>Tap <img src="${SHARE_ICON}" alt="Share"> Share, then <em>Add to Home Screen</em> for fullscreen play, offline.</span><button id="instX" aria-label="Dismiss">&times;</button>`
    :`<b>Install Era Draw</b><span>Play fullscreen and offline.</span><button id="instGo">Install</button><button id="instX" aria-label="Dismiss">&times;</button>`;
  document.body.appendChild(el);setTimeout(()=>window.insPad&&insPad(),0);
  document.getElementById('instX').onclick=()=>{save.installDismissed=true;persist();el.remove();insPad()};
  const go=document.getElementById('instGo');if(go)go.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(e){}deferredPrompt=null;el.remove()};
}
// only nag on menus, never mid-run
setInterval(()=>{const el=document.getElementById('install');if(mode==='run'||!/^#?\/?(home)?$/.test(location.hash.replace('#/',''))){if(el)el.style.display='none'}else{if(el)el.style.display='';else showInstall()}},1000);
// reserve room for the install banner so it never covers home content (568x320 overlap fix)
function insPad(){const el=document.getElementById('install');const on=!!(el&&el.style.display!=='none');document.documentElement.classList.toggle('ins-on',on);
  document.documentElement.style.setProperty('--insH',on?Math.ceil(el.getBoundingClientRect().height+8)+'px':'0px')}
setInterval(insPad,500);addEventListener('resize',insPad);
