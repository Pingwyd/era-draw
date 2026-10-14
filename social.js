'use strict';
// ================= UPDATE: SOCIAL + REPLAY =================
// ---- seeded runs: every run has a seed; the simulation RNG is derived from it ----
let RUN_SEED=null;
runHooks.unshift(G=>{G.seed=(RUN_SEED!=null?RUN_SEED:Math.floor(Math.random()*4294967295))>>>0;RUN_SEED=null;G.rng=mulberry(G.seed)});

// ---- endless mode after the 15:00 clear ----
eraCleared=(function(orig){return function(){
  const i=ERA_ORDER.indexOf(CURRENT_ERA),next=ERA_ORDER[i+1];
  if(next&&!save.eras.includes(next)&&ERAS[next]&&!ERAS[next].locked){save.eras.push(next);persist();toast(ERAS[next].name+' unlocked!')}
  sfx('chest');haptic([40,40,80]);
  modal(pickCards('Era cleared','15:00 survived'+(next?' &middot; '+ERAS[next].name+' unlocked':''),[
    {name:'Go endless',desc:'Keep going. Bosses return in rotation, stronger every time. Coins x1.25 from here on.',tag:'&infin;',rar:'epic',sub:'endless'},
    {name:'Leave victorious',desc:'End the run now and bank everything.',tag:'END',rar:'rare',sub:'finish'}]),i=>{
      if(i===0){G.endless=true;toast('Endless mode');}else{G.victory=true;setTimeout(()=>{if(mode==='run')endRun()},0)}});
}})(eraCleared);
const _soCoins=calcCoins;calcCoins=function(){const c=_soCoins();return G&&G.endless?Math.round(c*1.25):c};

// ---- custom seeded runs + share codes: ED1-<era><diff><mage><ink>-<seed36> ----
const CODE_SETS=()=>({era:ERA_ORDER,diff:Object.keys(DIFFS),mage:Object.keys(MAGES),ink:Object.keys(INKS)});
function encodeRun(o){const S=CODE_SETS();return 'ED1-'+['era','diff','mage','ink'].map(k=>Math.max(0,S[k].indexOf(o[k])).toString(36)).join('')+'-'+(o.seed>>>0).toString(36).toUpperCase()}
function decodeRun(code){const m=/^ED1-([0-9a-z]{4})-([0-9A-Z]+)$/i.exec(String(code||'').trim());if(!m)return null;const S=CODE_SETS(),ks=['era','diff','mage','ink'],o={};
  for(let i=0;i<4;i++){o[ks[i]]=S[ks[i]][parseInt(m[1][i],36)];if(!o[ks[i]])return null}o.seed=parseInt(m[2],36)>>>0;return o}
let CUSTOM=null;
function startCustom(o){const keep={era:save.era,diff:save.diff,mage:save.mage,ink:save.ink};
  save.era=o.era;save.diff=o.diff;if(save.mages.includes(o.mage))save.mage=o.mage;if(save.inks.includes(o.ink))save.ink=o.ink;
  RUN_SEED=o.seed;CUSTOM=o;startRun();Object.assign(save,keep);persist();setRoute('play')}
runHooks.push(G=>{G.customCode=CUSTOM?encodeRun(CUSTOM):null;CUSTOM=null});
function copyText(t){try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>prompt('Copy:',t));return}}catch(e){}prompt('Copy:',t)}
function custom(code){
  leaveRun();setRoute('custom');const o=decodeRun(code)||{era:save.era||'stone',diff:save.diff||'normal',mage:save.mage||'ink',ink:save.ink||'soot',seed:Math.floor(Math.random()*4294967295)>>>0};
  const opt=(k,list,lab)=>`<label class="slider"><b>${lab}</b><select id="c_${k}">${list.map(v=>`<option value="${v}" ${v===o[k]?'selected':''}>${(k==='era'?ERAS[v].name:k==='diff'?(DIFFS[v].name||v):k==='mage'?MAGES[v].name:INKS[v].name)}${(k==='era'&&!save.eras.includes(v))||(k==='mage'&&!save.mages.includes(v))||(k==='ink'&&!save.inks.includes(v))?' (locked)':''}</option>`).join('')}</select><span></span></label>`;
  const S=CODE_SETS();
  show(sheet('Custom Run','14 &mdash; Seeded runs you can share',`<div class="cols"><div><div class="lab rule">Setup</div>${opt('era',S.era,'Era')}${opt('diff',S.diff,'Difficulty')}${opt('mage',S.mage,'Mage')}${opt('ink',S.ink,'Ink')}
    <label class="slider"><b>Seed</b><input id="c_seed" value="${o.seed.toString(36).toUpperCase()}" maxlength="8" autocapitalize="characters"><span></span></label></div>
    <div><div class="lab rule">Share code</div><p class="code" id="ccode"></p><nav class="menu"><button id="cgo"><b>01</b>Play this seed<i>&rarr;</i></button><button id="ccopy"><b>02</b>Copy link<i>&rarr;</i></button><button id="cpaste"><b>03</b>Enter a code<i>&rarr;</i></button><button id="crand"><b>04</b>New random seed<i>&rarr;</i></button></nav>
    <p class="note">Same code + same moves = the same run. Locked era, mage or ink fall back to yours.</p></div></div>`));
  const cur=()=>({era:$('c_era').value,diff:$('c_diff').value,mage:$('c_mage').value,ink:$('c_ink').value,seed:(parseInt($('c_seed').value,36)||0)>>>0});
  const upd=()=>{$('ccode').textContent=encodeRun(cur())};upd();screenEl.querySelectorAll('select,input').forEach(el=>el.oninput=el.onchange=upd);
  $('cgo').onclick=()=>{const c=cur();if(!save.eras.includes(c.era)){toast('That era is locked');return}startCustom(c)};
  $('ccopy').onclick=()=>copyText(location.href.split('#')[0]+'#/run/'+encodeRun(cur()));
  $('cpaste').onclick=()=>{const t=prompt('Paste a share code (ED1-...)');const d=decodeRun(t);if(d)custom(encodeRun(d));else if(t)toast('Invalid code')};
  $('crand').onclick=()=>{$('c_seed').value=(Math.floor(Math.random()*4294967295)>>>0).toString(36).toUpperCase();upd()};
  $('back').onclick=home;
}
hub('custom','Custom Run',()=>custom());
// #/run/<code> deep link
route=(function(orig){return function(){const h=location.hash.replace(/^#\/?/,'');if(h.startsWith('run/')){const o=decodeRun(h.slice(4));if(o){if(mode==='run'&&G&&G.customCode===encodeRun(o))return;if(!save.eras.includes(o.era))o.era='stone';custom(encodeRun(o));return}}return orig.apply(this,arguments)}})(route);
