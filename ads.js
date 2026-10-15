'use strict';
// ===== Provider config. Switch providers here (see docs/ADS.md). =====
// provider: 'adsterra' (current network, sandboxed srcdoc banners + sponsored link) | 'adsense' (top-level AdSense + H5 Games Ads)
const AD_CONFIG={provider:'adsense',
  adsense:{client:'ca-pub-2853919516364773',slots:{pause:'',results:'',home:''},// fill with AdSense display ad unit slot IDs
    h5:true,interstitial:true,interstitialEvery:3,interstitialMinGap:180e3,rewardCap:5,rewardCooldown:120e3,rewardCoins:100,frequencyHint:'120s'}};
const ADSENSE_CLIENT=AD_CONFIG.adsense.client;
const AD_IS_SENSE=()=>AD_CONFIG.provider==='adsense'&&/^ca-pub-\d+$/.test(ADSENSE_CLIENT);
window.AD_CONFIG=AD_CONFIG;
// ===== Ads: only with Consent 'ads' granted, online, never during active gameplay. =====
// Every ad script runs inside a sandboxed srcdoc iframe (no allow-same-origin, no top navigation), so it cannot
// read the game's storage, redirect the page or take it over. Slots collapse if the ad fails, is blocked or stays empty.
const AD_SRC={full:'https://untimely-hello.com/blXNV.sRdSGZlH0XY-WNcd/eeYmx9YujZ/UglHkDPeTLcH1gMPjFMGxLMjDOEAtqNazxUjySMAzHE/wPN/Qh',
  mobile:'https://untimely-hello.com/bjXvV.sHdZGXll0xYPWrck/NeimF9/usZ_UZllkiPQTbce1BM/j/MbxxMVT/cqt/NozpUMyoMfzEEtyOMEQV'};
const AD_REWARD={url:'https://physicaldad.com/dDmEF.zEd-GnNmvrZWGuUY/Iemmv9Nu/Z-UXl/kZPLTLcS1/MDTtYT3LOwDokdtoN-zjUcx/Nejhc/5RMjwI',coins:75,gemEvery:5,cap:5,cooldown:180e3,minAway:15e3};
function adsOk(){return !!(window.Consent&&Consent.granted('ads')&&navigator.onLine!==false&&!(typeof mode!=='undefined'&&mode==='run'&&G&&!G.paused&&!G.dead))}
function adSmall(){return innerWidth<760||matchMedia('(pointer:coarse)').matches}
function adSlot(where){if(!adsOk())return null;if(AD_IS_SENSE())return senseSlot(where);const small=adSmall(),src=small?AD_SRC.mobile:AD_SRC.full;
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
  const rs=results;results=function(){const r=rs.apply(this,arguments);if(mode==='dead'){adPlace('results',screenEl.querySelector('.sheet'));if(AD_IS_SENSE())senseNext()}return r};
  const hm=home;let last=0;home=function(){const r=hm.apply(this,arguments);const n=Date.now();if(Math.random()<1/3&&n-last>60e3&&adsOk()){last=n;adPlace('home',screenEl.querySelector('.home')||screenEl.firstElementChild)}return r};
  // rewarded sponsored link in the Shop
  const sh=shop;shop=function(){const r=sh.apply(this,arguments);try{AD_IS_SENSE()?senseReward():adReward()}catch(e){}return r}})();
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

// ===================== AdSense provider (top level only; AdSense cannot run inside a sandboxed srcdoc frame) =====================
let senseLoaded=false;
function adPersonal(){const c=window.Consent&&Consent.get();return !!(c&&c.adp!==false)}
function senseLoad(){if(senseLoaded||!AD_IS_SENSE())return;senseLoaded=true;const A=AD_CONFIG.adsense;
  window.adsbygoogle=window.adsbygoogle||[];if(!adPersonal())adsbygoogle.requestNonPersonalizedAds=1;
  window.adBreak=window.adConfig=function(o){adsbygoogle.push(o)};
  const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(ADSENSE_CLIENT);
  if(A.h5){s.setAttribute('data-ad-frequency-hint',A.frequencyHint);if(location.hostname==='localhost')s.setAttribute('data-adbreak-test','on')}
  document.head.appendChild(s);if(A.h5)adConfig({preloadAdBreaks:'on',sound:'on'})}
if(AD_IS_SENSE()&&window.Consent)Consent.whenGranted('ads',()=>{if(navigator.onLine!==false)senseLoad()});
function senseSlot(where){const id=AD_CONFIG.adsense.slots[where];if(!id)return null;senseLoad();
  const box=document.createElement('div');box.className='adslot sense ad-'+where;box.setAttribute('aria-label','Advertisement');
  const ins=document.createElement('ins');ins.className='adsbygoogle';ins.style.display='block';ins.setAttribute('data-ad-client',ADSENSE_CLIENT);ins.setAttribute('data-ad-slot',id);
  ins.setAttribute('data-ad-format','horizontal');ins.setAttribute('data-full-width-responsive','true');box.appendChild(ins);
  setTimeout(()=>{try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){box.remove()}},0);
  setTimeout(()=>{if(ins.getAttribute('data-ad-status')==='filled'||ins.offsetHeight>10)box.classList.add('on');else box.remove()},6000);return box}
// rewarded: real H5 Games Ads flow (beforeReward offers the ad, adViewed grants it)
let senseRw=null;
function senseReward(){const host=screenEl.querySelector('.sheet');if(!host||!window.Consent||!Consent.granted('ads')||navigator.onLine===false||!AD_CONFIG.adsense.h5)return;senseLoad();const A=AD_CONFIG.adsense,s=adDay();
  const left=A.rewardCap-s.n,cd=Math.max(0,A.rewardCooldown-(Date.now()-s.last));
  const el=document.createElement('div');el.className='adrw';el.innerHTML=`<div><b>Watch an ad for a reward</b><span class="sh">+${A.rewardCoins} coins (every ${AD_REWARD.gemEvery}th: +1 gem). ${left} left today.</span></div><button id="adGo" disabled>${left<=0?'Done for today':cd>0?'Wait '+Math.ceil(cd/60000)+' min':'Checking&hellip;'}</button>`;
  host.appendChild(el);if(left<=0||cd>0||typeof adBreak!=='function')return;const b=el.querySelector('#adGo');
  adBreak({type:'reward',name:'shop_reward',
    beforeAd:()=>{if(typeof sfx==='function')try{MUS&&(MUS.mute=true)}catch(e){}},afterAd:()=>{try{MUS&&(MUS.mute=false)}catch(e){}},
    beforeReward:show=>{if(!b.isConnected)return;b.disabled=false;b.textContent='Watch ad';b.onclick=()=>{b.disabled=true;show()}},
    adDismissed:()=>toast('Ad closed early: no reward'),
    adViewed:()=>{const d=adDay();if(d.n>=A.rewardCap)return;d.n++;d.last=Date.now();save.coins+=A.rewardCoins;let m='+'+A.rewardCoins+' coins';if(d.n%AD_REWARD.gemEvery===0){save.gems=(save.gems||0)+1;m+=' +1 gem'}persist();toast('Thanks! '+m)},
    adBreakDone:i=>{if(b.isConnected&&b.textContent.indexOf('Checking')===0){b.textContent='No ad available';b.disabled=true}if(location.hash==='#/shop'&&i&&i.breakStatus==='viewed')shop()}})}
// interstitial between runs ('next' placement on the results screen), capped
let senseRes=0,senseLastI=0;
function senseNext(){const A=AD_CONFIG.adsense;if(!A.h5||!A.interstitial||!adsOk()||typeof adBreak!=='function')return;senseRes++;
  if(senseRes%A.interstitialEvery||Date.now()-senseLastI<A.interstitialMinGap)return;senseLastI=Date.now();
  adBreak({type:'next',name:'results_next',beforeAd:()=>{try{MUS&&(MUS.mute=true)}catch(e){}},afterAd:()=>{try{MUS&&(MUS.mute=false)}catch(e){}}})}
// privacy page text follows the active provider
function adPrivacyHtml(){if(AD_IS_SENSE())return '<p>Ads are served by <b>Google AdSense</b> (including Google\'s H5 Games Ads for optional rewarded and between-run ads). Google and its partners may use cookies or similar identifiers to serve, measure and limit ads, and, only if you allow ad personalisation, to personalise them. If you turn personalisation off, we ask Google for non-personalised ads. Rewarded ads are optional: you choose to watch one in the Shop for coins. See Google\'s policy: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">How Google uses information from sites that use its services</a>. Change your choice at any time in Settings &rarr; Privacy.</p>';
  return "<p>Ads come from a <b>third-party ad network</b> (served from untimely-hello.com). Its code runs in a sandboxed frame that cannot read your save or control the game, but the network itself may set and read <b>cookies</b> or similar identifiers in its own frame, see your IP address and browser details, and use them to choose, measure and limit ads, under its own privacy policy. The Shop's <b>sponsored link reward</b> opens a sponsor's page (physicaldad.com) in a new tab; that site is outside Era Draw and has its own policies. Change your choice at any time in Settings &rarr; Privacy; reload the page to fully unload ad code after turning it off.</p>"}
window.adPrivacyHtml=adPrivacyHtml;
