'use strict';
// ===== Ads: only with Consent 'ads' granted, online, never during active gameplay. =====
// Every ad script runs inside a sandboxed srcdoc iframe (no allow-same-origin, no top navigation), so it cannot
// read the game's storage, redirect the page or take it over. Slots collapse if the ad fails, is blocked or stays empty.
const AD_SRC={full:'https://untimely-hello.com/blXNV.sRdSGZlH0XY-WNcd/eeYmx9YujZ/UglHkDPeTLcH1gMPjFMGxLMjDOEAtqNazxUjySMAzHE/wPN/Qh',
  mobile:'https://untimely-hello.com/bjXvV.sHdZGXll0xYPWrck/NeimF9/usZ_UZllkiPQTbce1BM/j/MbxxMVT/cqt/NozpUMyoMfzEEtyOMEQV'};
const AD_REWARD={url:'https://physicaldad.com/dDmEF.zEd-GnNmvrZWGuUY/Iemmv9Nu/Z-UXl/kZPLTLcS1/MDTtYT3LOwDokdtoN-zjUcx/Nejhc/5RMjwI',coins:75,gemEvery:5,cap:5,cooldown:180e3,minAway:15e3};
function adsOk(){return !!(window.Consent&&Consent.granted('ads')&&navigator.onLine!==false&&!(typeof mode!=='undefined'&&mode==='run'&&G&&!G.paused&&!G.dead))}
function adSmall(){return innerWidth<760||matchMedia('(pointer:coarse)').matches}
function adSlot(where){if(!adsOk())return null;const small=adSmall(),src=small?AD_SRC.mobile:AD_SRC.full;
  const box=document.createElement('div');box.className='adslot ad-'+where;box.setAttribute('aria-label','Advertisement');
  const f=document.createElement('iframe');f.title='Advertisement';f.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  f.setAttribute('referrerpolicy','no-referrer-when-downgrade');f.setAttribute('scrolling','no');f.tabIndex=-1;
  const id='ad'+Math.random().toString(36).slice(2);f.dataset.ad=id;
  f.srcdoc='<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;display:flex;justify-content:center}</style></head><body>'+
   '<script>(function(x){var d=document,s=d.createElement("script"),l=d.scripts[d.scripts.length-1];s.settings=x||{};s.src='+JSON.stringify(src)+';s.async=true;s.referrerPolicy="no-referrer-when-downgrade";'+
   's.onerror=function(){parent.postMessage({ad:"'+id+'",fill:false},"*")};l.parentNode.insertBefore(s,l)})({});'+
   'setTimeout(function(){var b=document.body,h=Math.max(b.scrollHeight,0),n=b.querySelectorAll("iframe,img,a,ins,div,canvas,video").length;parent.postMessage({ad:"'+id+'",fill:n>0&&h>10,h:h},"*")},4500)<\/script></body></html>';
  box.appendChild(f);setTimeout(()=>{if(!box.classList.contains('on'))box.remove()},9000);return box}
addEventListener('message',e=>{const d=e.data;if(!d||typeof d.ad!=='string')return;const f=document.querySelector('iframe[data-ad="'+d.ad+'"]');if(!f||e.source!==f.contentWindow)return;
  const box=f.parentNode;if(!d.fill){box.remove();return}box.classList.add('on');f.style.height=Math.min(100,Math.max(50,d.h|0))+'px'});
function adPlace(where,parent){try{if(!parent||parent.querySelector('.adslot'))return;const s=adSlot(where);if(s)parent.appendChild(s)}catch(e){}}
// placements: pause (bottom), results (bottom), home footer about 1 in 3 visits and at most once a minute
(function(){const pm=pauseMenu;pauseMenu=function(){const r=pm.apply(this,arguments);adPlace('pause',screenEl.querySelector('.sheet'));return r};
  const rs=results;results=function(){const r=rs.apply(this,arguments);if(mode==='dead')adPlace('results',screenEl.querySelector('.sheet'));return r};
  const hm=home;let last=0;home=function(){const r=hm.apply(this,arguments);const n=Date.now();if(Math.random()<1/3&&n-last>60e3&&adsOk()){last=n;adPlace('home',screenEl.querySelector('.home')||screenEl.firstElementChild)}return r};
  // rewarded sponsored link in the Shop
  const sh=shop;shop=function(){const r=sh.apply(this,arguments);try{adReward()}catch(e){}return r}})();
function adDay(){const d=new Date().toISOString().slice(0,10);if(!save.adRw||save.adRw.d!==d)save.adRw={d,n:0,last:0};return save.adRw}
let adPend=null;
function adReward(){const host=screenEl.querySelector('.sheet');if(!host||!window.Consent||!Consent.granted('ads'))return;const s=adDay();const left=AD_REWARD.cap-s.n,cd=Math.max(0,AD_REWARD.cooldown-(Date.now()-s.last));
  const el=document.createElement('div');el.className='adrw';const off=navigator.onLine===false;
  el.innerHTML=`<div><b>Sponsored link reward</b><span class="sh">Open a sponsor's page and stay ${AD_REWARD.minAway/1000}s or more, then come back: +${AD_REWARD.coins} coins (every ${AD_REWARD.gemEvery}th: +1 gem). ${left} left today.</span></div><button id="adGo" ${left<=0||cd>0||off?'disabled':''}>${off?'Offline':left<=0?'Done for today':cd>0?'Wait '+Math.ceil(cd/60000)+' min':'Open sponsored link'}</button>`;
  host.appendChild(el);const b=el.querySelector('#adGo');if(b)b.onclick=()=>{const w=window.open(AD_REWARD.url,'_blank','noopener');adPend={t0:Date.now()};toast('Come back in '+AD_REWARD.minAway/1000+'s or more for your reward')}}
function adBack(){if(!adPend||document.hidden)return;const away=Date.now()-adPend.t0;if(away<1500)return;const p=adPend;adPend=null;
  if(away<AD_REWARD.minAway){toast('Too quick: stay '+AD_REWARD.minAway/1000+'s on the sponsor page to earn the reward');return}
  const s=adDay();if(s.n>=AD_REWARD.cap)return;s.n++;s.last=Date.now();save.coins+=AD_REWARD.coins;let msg='+'+AD_REWARD.coins+' coins';if(s.n%AD_REWARD.gemEvery===0){save.gems=(save.gems||0)+1;msg+=' +1 gem'}persist();toast('Thanks! '+msg);
  if(location.hash==='#/shop')shop()}
document.addEventListener('visibilitychange',adBack);addEventListener('focus',adBack);
window.adsOk=adsOk;
