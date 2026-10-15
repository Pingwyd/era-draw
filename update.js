// ===== Update prompt: a new service worker waits; offer 'Refresh' only outside active gameplay =====
(function(){if(!('serviceWorker' in navigator))return;let reg=null,waiting=null,ver='',shown=false,reloading=false;
  const DK='eradraw.updDismissed';
  function canShow(){return typeof mode==='undefined'||mode!=='run'||!G||G.paused||!!(screenEl&&screenEl.innerHTML)}
  function getVer(){return fetch('sw.js?v='+Date.now(),{cache:'no-store'}).then(r=>r.text()).then(t=>{const m=t.match(/VERSION='([^']*)'/);return m?m[1]:''}).catch(()=>'')}
  function found(w){if(!w||w===waiting)return;waiting=w;getVer().then(v=>{ver=v||'new';tick()})}
  function track(r){if(r.waiting&&navigator.serviceWorker.controller)found(r.waiting);
    r.addEventListener('updatefound',()=>{const n=r.installing;if(!n)return;n.addEventListener('statechange',()=>{if(n.state==='installed'&&navigator.serviceWorker.controller)found(n)})})}
  window.swWatch=r=>{reg=r;track(r);setInterval(()=>r.update().catch(()=>{}),10*60*1000)};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&reg)reg.update().catch(()=>{})});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload()});
  function refresh(){const mid=typeof mode!=='undefined'&&mode==='run'&&G&&!G.over;
    const go=()=>{try{if(mid&&typeof saveRun==='function')saveRun()}catch(e){}reloading=true;if(waiting)waiting.postMessage({type:'SKIP_WAITING'});setTimeout(()=>location.reload(),2500)};
    if(mid&&typeof confirmBox==='function'){hide();confirmBox('Update now?','Your run will be saved and you can resume it after the refresh.','Refresh','Not now',go,()=>{if(typeof pauseMenu==='function')pauseMenu();tick()})}else go()}
  function hide(){const b=document.getElementById('updBar');if(b)b.remove();shown=false}
  function tick(){if(!waiting||reloading)return;let dis='';try{dis=localStorage.getItem(DK)||''}catch(e){}if(dis&&dis===ver){hide();return}
    if(!canShow()){hide();return}if(shown&&document.getElementById('updBar'))return;
    const b=document.createElement('div');b.id='updBar';b.setAttribute('role','status');b.innerHTML='<span>Update available</span><button id="updGo" class="pri">Refresh</button><button id="updX" aria-label="Dismiss update">&times;</button>';
    document.body.appendChild(b);shown=true;b.querySelector('#updGo').onclick=refresh;b.querySelector('#updX').onclick=()=>{try{localStorage.setItem(DK,ver)}catch(e){}hide()}}
  setInterval(tick,1000);window.updTick=tick;window._updFound=found})();
