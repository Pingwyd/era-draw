'use strict';
// ===== Provider config. Switch providers here (see docs/ADS.md). =====
// provider: 'hilltop' (HilltopAds: sandboxed srcdoc banners + direct-link / VAST rewarded) | 'adsense' (top-level AdSense banners + H5 Games Ads)
const AD_CONFIG={provider:'hilltop',hilltop:{vastUrl:'https://physicaldad.com/dKmVFpzGd.GFNgv/ZUGcUd/penm/9/uvZ/UZltkjPBTvcx1ZM/TtYK3BOrDkk/tmNxzNUuxGNcjpcE5FMlwO',rewardCoins:100},// vastUrl: paste a HilltopAds VAST tag URL to enable in-game rewarded video
  adsense:{client:'ca-pub-2853919516364773',slots:{pause:'',results:'',home:''},// fill with AdSense display ad unit slot IDs
    h5:true,interstitial:false,interstitialEvery:3,interstitialMinGap:180e3,rewardCap:5,rewardCooldown:120e3,rewardCoins:100,frequencyHint:'120s'}};
AD_CONFIG.adcash={enabled:false,banner:'12319166',interstitial:'12319258'};// Adcash display 300x100 + interstitial (results only)
const ADSENSE_CLIENT=AD_CONFIG.adsense.client;
const SENSE_OK=()=>/^ca-pub-\d+$/.test(ADSENSE_CLIENT);
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
function adSlot(where){if(!adsOk())return null;if(AD_IS_SENSE()||(SENSE_OK()&&AD_CONFIG.adsense.slots[where]))return senseSlot(where);const small=adSmall(),src=small?AD_SRC.mobile:AD_SRC.full;
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
  const sh=shop;shop=function(){const r=sh.apply(this,arguments);try{rewardFlow()}catch(e){}return r}})();
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
function senseLoad(){if(senseLoaded||!SENSE_OK())return;senseLoaded=true;const A=AD_CONFIG.adsense;
  window.adsbygoogle=window.adsbygoogle||[];if(!adPersonal())adsbygoogle.requestNonPersonalizedAds=1;
  window.adBreak=window.adConfig=function(o){adsbygoogle.push(o)};
  const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(ADSENSE_CLIENT);
  if(A.h5){s.setAttribute('data-ad-frequency-hint',A.frequencyHint);if(location.hostname==='localhost')s.setAttribute('data-adbreak-test','on')}
  document.head.appendChild(s);if(A.h5)adConfig({preloadAdBreaks:'on',sound:'on'})}
if(AD_IS_SENSE()&&window.Consent)Consent.whenGranted('ads',()=>{if(navigator.onLine!==false)senseLoad()});
function senseSlot(where){const id=AD_CONFIG.adsense.slots[where];if(!id)return acSlot(where);senseLoad();
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
  host.appendChild(el);if(left<=0||cd>0)return;if(typeof adBreak!=='function'){el.remove();adReward();return}const b=el.querySelector('#adGo');let fb=setTimeout(()=>{if(b.isConnected&&b.textContent.indexOf('Checking')===0){el.remove();adReward()}},6000);
  adBreak({type:'reward',name:'shop_reward',
    beforeAd:()=>{if(typeof sfx==='function')try{MUS&&(MUS.mute=true)}catch(e){}},afterAd:()=>{try{MUS&&(MUS.mute=false)}catch(e){}},
    beforeReward:show=>{clearTimeout(fb);if(!b.isConnected)return;b.disabled=false;b.textContent='Watch ad';b.onclick=()=>{b.disabled=true;show()}},
    adDismissed:()=>toast('Ad closed early: no reward'),
    adViewed:()=>{const d=adDay();if(d.n>=A.rewardCap)return;d.n++;d.last=Date.now();save.coins+=A.rewardCoins;let m='+'+A.rewardCoins+' coins';if(d.n%AD_REWARD.gemEvery===0){save.gems=(save.gems||0)+1;m+=' +1 gem'}persist();toast('Thanks! '+m)},
    adBreakDone:i=>{if(b.isConnected&&b.textContent.indexOf('Checking')===0){el.remove();adReward()}if(location.hash==='#/shop'&&i&&i.breakStatus==='viewed')shop()}})}
// interstitial between runs ('next' placement on the results screen), capped
let senseRes=0,senseLastI=0;
function senseNext(){const A=AD_CONFIG.adsense;if(!A.h5||!A.interstitial||!adsOk()||typeof adBreak!=='function')return;senseRes++;
  if(senseRes%A.interstitialEvery||Date.now()-senseLastI<A.interstitialMinGap)return;senseLastI=Date.now();
  adBreak({type:'next',name:'results_next',beforeAd:()=>{try{MUS&&(MUS.mute=true)}catch(e){}},afterAd:()=>{try{MUS&&(MUS.mute=false)}catch(e){}}})}
// privacy page text follows the active provider
const SENSE_PRIV='<p>Ads are served by <b>Google AdSense</b> (including Google\'s H5 Games Ads for optional rewarded and between-run ads). Google and its partners may use cookies or similar identifiers to serve, measure and limit ads, and, only if you allow ad personalisation, to personalise them. If you turn personalisation off, we ask Google for non-personalised ads. Rewarded ads are optional: you choose to watch one in the Shop for coins. See Google\'s policy: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">How Google uses information from sites that use its services</a>. Change your choice at any time in Settings &rarr; Privacy.</p>';
function adPrivacyHtml(){if(AD_IS_SENSE())return SENSE_PRIV;
  return '<p>Ads come from <b>HilltopAds</b>, a third-party ad network (served from untimely-hello.com). Banner code runs in a sandboxed frame that cannot read your save or control the game, but the network may set and read <b>cookies</b> or similar identifiers in its own frame, see your IP address and browser details, and use them to choose, measure and limit ads, under its own privacy policy. The Shop\'s optional reward either plays a short <b>video ad</b> inside the game (supplied by HilltopAds; the video and its tracking pixels load from the ad network) or, when no video is available, opens a <b>sponsored link</b> (physicaldad.com) in a new tab that is outside Era Draw. '+(SENSE_OK()&&AD_CONFIG.adsense.h5?'The Shop may also offer a rewarded ad from <b>Google</b> (H5 Games Ads), which may use cookies under <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">Google\'s policies</a>, personalised only if you allow it. ':'')+'Change your choice at any time in Settings &rarr; Privacy; reload to fully unload ad code after turning it off.</p>'}

window.adPrivacyHtml=adPrivacyHtml;

// ===================== Adcash zones (display banner + interstitial). aclib loads once, after consent, top level =====================
let acState=0;const acQ=[];
function acLoad(cb){const A=AD_CONFIG.adcash;if(!A||!A.enabled||!window.Consent||!Consent.granted('ads')||navigator.onLine===false)return;
  if(acState===2&&window.aclib){cb();return}acQ.push(cb);if(acState)return;acState=1;
  const s=document.createElement('script');s.id='aclib';s.async=true;s.src='https://acscdn.com/script/aclib.js';
  s.onload=()=>{acState=2;const q=acQ.splice(0);for(const f of q)try{f()}catch(e){}};s.onerror=()=>{acState=3;acQ.length=0};document.head.appendChild(s)}
function acSlot(where){const A=AD_CONFIG.adcash;if(!A||!A.enabled||!A.banner)return null;const box=document.createElement('div');box.className='adslot ac ad-'+where;box.setAttribute('aria-label','Advertisement');
  const c=document.createElement('div');c.className='ac-c';box.appendChild(c);
  acLoad(()=>{if(!box.isConnected)return;const sc=document.createElement('script');sc.text="try{aclib.runBanner({zoneId:'"+A.banner+"'})}catch(e){}";c.appendChild(sc)});
  setTimeout(()=>{if(c.querySelector('iframe,img,ins,a,canvas')&&c.scrollHeight>10)box.classList.add('on');else box.remove()},7000);return box}
let acRuns=0,acLastI=0;
function acInterstitial(){const A=AD_CONFIG.adcash;if(!A||!A.enabled||!A.interstitial)return;acRuns++;if(acRuns%3||Date.now()-acLastI<180e3)return;
  if(typeof mode!=='undefined'&&mode!=='dead')return;acLastI=Date.now();acLoad(()=>{if(mode==='dead')try{aclib.runInterstitial({zoneId:A.interstitial})}catch(e){}})}
(function(){const rs=results;results=function(){const r=rs.apply(this,arguments);if(mode==='dead')setTimeout(acInterstitial,1200);return r}})();
const _adPriv=adPrivacyHtml;adPrivacyHtml=function(){let h=_adPriv();if(AD_CONFIG.adcash&&AD_CONFIG.adcash.enabled)h+='<p>We also use <b>Adcash</b> (acscdn.com), a third-party ad network, after you allow ads: a small banner on the pause, results and home screens, and occasionally a full-screen ad on the results screen between runs (at most every third run). Adcash may use cookies or similar identifiers to deliver and measure ads, under its own privacy policy.</p>';return h};
window.adPrivacyHtml=adPrivacyHtml;

// ===================== Rewarded: VAST video (if configured) > AdSense H5 > direct link =====================
function rewardFlow(){if(AD_CONFIG.hilltop&&AD_CONFIG.hilltop.vastUrl)return vastRewardUI();if(SENSE_OK()&&AD_CONFIG.adsense.h5)return senseReward();return adReward()}
function vastRewardUI(){const host=screenEl.querySelector('.sheet');if(!host||!window.Consent||!Consent.granted('ads'))return;const s=adDay(),cap=AD_REWARD.cap,left=cap-s.n,cd=Math.max(0,AD_REWARD.cooldown-(Date.now()-s.last)),off=navigator.onLine===false,C=AD_CONFIG.hilltop.rewardCoins;
  const el=document.createElement('div');el.className='adrw';el.innerHTML=`<div><b>Watch a video ad for a reward</b><span class="sh">Watch to the end: +${C} coins (every ${AD_REWARD.gemEvery}th: +1 gem). ${left} left today.</span></div><button id="adGo" ${left<=0||cd>0||off?'disabled':''}>${off?'Offline':left<=0?'Done for today':cd>0?'Wait '+Math.ceil(cd/60000)+' min':'Watch video'}</button>`;
  host.appendChild(el);const b=el.querySelector('#adGo');b.onclick=()=>{b.disabled=true;b.textContent='Loading…';
    vastPlay(AD_CONFIG.hilltop.vastUrl,()=>{const d=adDay();if(d.n>=cap)return;d.n++;d.last=Date.now();save.coins+=C;let m='+'+C+' coins';if(d.n%AD_REWARD.gemEvery===0){save.gems=(save.gems||0)+1;m+=' +1 gem'}persist();toast('Thanks! '+m);if(location.hash==='#/shop')shop()},
      why=>{if(why==='skip'){toast('Video closed early: no reward');if(location.hash==='#/shop')shop();return}el.remove();adReward()})}}
// minimal VAST 2/3/4 client: follows wrappers, picks an MP4/WebM MediaFile, fires impression, quartile and complete pixels
function vastFetch(url,depth,acc){return fetch(url,{credentials:'omit',cache:'no-store'}).then(r=>r.text()).then(t=>{const x=new DOMParser().parseFromString(t,'text/xml'),q=(n,sel)=>[...n.getElementsByTagName(sel)];
  const ad=q(x,'Ad')[0];if(!ad)throw new Error('no ad');const txt=n=>(n&&n.textContent||'').trim();
  q(ad,'Impression').forEach(n=>txt(n)&&acc.imp.push(txt(n)));q(ad,'Error').forEach(n=>txt(n)&&acc.err.push(txt(n)));
  q(ad,'Tracking').forEach(n=>{const e=n.getAttribute('event');if(txt(n))(acc.trk[e]=acc.trk[e]||[]).push(txt(n))});q(ad,'ClickTracking').forEach(n=>txt(n)&&acc.clk.push(txt(n)));
  const ct=q(ad,'ClickThrough')[0];if(ct&&txt(ct))acc.click=txt(ct);
  const w=q(ad,'VASTAdTagURI')[0];if(w){if(depth>=4)throw new Error('wrapper depth');return vastFetch(txt(w),depth+1,acc)}
  const v=document.createElement('video');const mf=q(ad,'MediaFile').map(n=>({src:txt(n),type:n.getAttribute('type')||'',w:+n.getAttribute('width')||0,api:n.getAttribute('apiFramework')||''}))
    .filter(m=>m.src&&!m.api&&/mp4|webm/i.test(m.type)&&v.canPlayType(m.type)).sort((a,b)=>Math.abs(a.w-640)-Math.abs(b.w-640));
  if(!mf.length)throw new Error('no playable media');acc.media=mf[0].src;return acc})}
const vastPing=list=>(list||[]).forEach(u=>{try{new Image().src=u.replace(/\[CACHEBUSTING\]/g,String(Math.random()*1e8|0))}catch(e){}});
function vastPlay(url,onReward,onFail){if(typeof mode!=='undefined'&&mode==='run'&&G&&!G.paused)return onFail('busy');
  const acc={imp:[],err:[],trk:{},clk:[],click:''};let done=false;
  vastFetch(url,0,acc).then(a=>{const ov=document.createElement('div');ov.id='vastOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Video ad');
    ov.innerHTML='<video playsinline webkit-playsinline preload="auto"></video><div class="vbar"><span class="vlab">Ad &middot; <b id="vT">--</b>s</span>'+(a.click?'<button id="vMore">Learn more</button>':'')+'<button id="vX">Close (no reward)</button></div>';
    document.body.appendChild(ov);const v=ov.querySelector('video');v.src=a.media;const fired={};let started=false;
    const end=(ok,why)=>{if(done)return;done=true;try{v.pause()}catch(e){}ov.remove();ok?onReward():onFail(why)};
    v.addEventListener('playing',()=>{if(!started){started=true;vastPing(a.imp);vastPing(a.trk.start);vastPing(a.trk.creativeView)}});
    v.addEventListener('timeupdate',()=>{const d=v.duration||0,t=v.currentTime;if(!d)return;const T=ov.querySelector('#vT');if(T)T.textContent=Math.max(0,Math.ceil(d-t));
      for(const [k,f] of [['firstQuartile',.25],['midpoint',.5],['thirdQuartile',.75]])if(!fired[k]&&t/d>=f){fired[k]=1;vastPing(a.trk[k])}});
    v.addEventListener('ended',()=>{vastPing(a.trk.complete);end(true)});
    v.addEventListener('error',()=>{vastPing(a.err);end(false,'error')});
    ov.querySelector('#vX').onclick=()=>{vastPing(a.trk.close||a.trk.skip);end(false,'skip')};
    const more=ov.querySelector('#vMore');if(more)more.onclick=()=>{vastPing(a.clk);window.open(a.click,'_blank','noopener')};
    const p=v.play();if(p&&p.catch)p.catch(()=>{v.muted=true;v.play().catch(()=>end(false,'error'))});
    setTimeout(()=>{if(!started)end(false,'error')},12000)}).catch(()=>{vastPing(acc.err);onFail('error')})}
window.vastPlay=vastPlay;
