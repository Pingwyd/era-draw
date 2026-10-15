// ===== Consent gate (GDPR-style). Loaded first. No ad or analytics script may load before consent. =====
// Future SDKs must go through Consent.load(category, src, onload) or Consent.whenGranted(category, fn).
(function(){
  const KEY='eradraw.consent',CATS=['analytics','ads'];let st=null;const waiting={analytics:[],ads:[]};
  try{st=JSON.parse(localStorage.getItem(KEY))}catch(e){st=null}
  if(!st||st.v!==1||typeof st.ads!=='boolean')st=null;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
  function flush(){if(!st)return;for(const c of CATS)if(st[c]){const q=waiting[c].splice(0);for(const f of q)try{f()}catch(e){}}}
  const C={
    CATS,decided:()=>!!st,get:()=>st?{analytics:st.analytics,ads:st.ads,adp:st.adp!==false,ts:st.ts}:null,
    granted:c=>!!(st&&st[c]),
    set(o){const was=st;st={v:1,analytics:!!o.analytics,ads:!!o.ads,adp:o.adp==null?!!o.ads:!!(o.adp&&o.ads),ts:Date.now()};save();flush();
      const revoked=was&&CATS.some(c=>was[c]&&!st[c]);return {revoked}},
    whenGranted(c,fn){if(C.granted(c))fn();else waiting[c].push(fn)},
    load(c,src,onload){C.whenGranted(c,()=>{const s=document.createElement('script');s.src=src;s.async=true;if(onload)s.onload=onload;document.head.appendChild(s)})},
    loaded:[]};
  window.Consent=C;
  function banner(custom){if(document.getElementById('consent'))return;const d=document.createElement('div');d.id='consent';d.setAttribute('role','dialog');d.setAttribute('aria-modal','false');d.setAttribute('aria-labelledby','cnsH');
    const cur=st||{analytics:false,ads:false};
    d.innerHTML=`<div class="cns-t"><b id="cnsH">Your privacy</b><p>Era Draw saves your progress on this device only. We use no tracking today. If we add optional analytics or ads later, they will only load if you allow them. <a href="#/privacy" id="cnsP">Privacy &amp; terms</a></p>
      <div class="cns-c" ${custom?'':'hidden'}><label><input type="checkbox" checked disabled> Essential (saves, offline cache)</label><label><input type="checkbox" id="cnsA" ${cur.analytics?'checked':''}> Analytics</label><label><input type="checkbox" id="cnsD" ${cur.ads?'checked':''}> Ads${window.AD_CONFIG&&AD_CONFIG.provider==='adsense'?'':' &amp; ad personalisation'}</label>${window.AD_CONFIG&&AD_CONFIG.provider==='adsense'?`<label><input type="checkbox" id="cnsP2" ${cur.adp!==false&&cur.ads?'checked':''}> Personalised ads</label>`:''}</div></div>
      <div class="cns-b"><button id="cnsRej">Reject</button><button id="cnsCus">${custom?'Save choices':'Customize'}</button><button id="cnsAcc" class="pri">Accept</button></div>`;
    document.body.appendChild(d);const close=o=>{C.set(o);d.remove()};
    d.querySelector('#cnsAcc').onclick=()=>close({analytics:true,ads:true});
    d.querySelector('#cnsRej').onclick=()=>close({analytics:false,ads:false});
    d.querySelector('#cnsCus').onclick=()=>{const box=d.querySelector('.cns-c');if(box.hidden){box.hidden=false;d.querySelector('#cnsCus').textContent='Save choices';d.querySelector('#cnsA').focus()}else{const p2=d.querySelector('#cnsP2');close({analytics:d.querySelector('#cnsA').checked,ads:d.querySelector('#cnsD').checked,adp:p2?p2.checked:undefined})}};
    d.querySelector('#cnsP').onclick=()=>d.remove();}
  C.banner=banner;
  // show once a choice is needed, never on top of a run
  function maybe(){if(st||navigator.webdriver&&!window.SHOW_CONSENT)return;if(typeof mode!=='undefined'&&mode==='run')return;banner(false)}
  window.addEventListener('load',()=>setTimeout(maybe,600));
  window.addEventListener('hashchange',()=>{if(location.hash==='#/privacy'){const d=document.getElementById('consent');if(d)d.remove()}else setTimeout(maybe,300)});
})();
