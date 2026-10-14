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

// ---- ghost replay: your best run per era is recorded (10 samples/s) and replayed as a ghost ----
if(!save.ghosts)save.ghosts={};
runHooks.push(G=>{G.rec=[];G.recT=0;const g=save.ghost!==false&&save.ghosts[CURRENT_ERA];G.ghost=g&&!G.daily?g:null});
CAVE_TICK.push(dt=>{G.recT+=dt;if(G.recT>=.1){G.recT-=.1;const p=G.player;G.rec.push(Math.round(p.x),Math.round(p.y))}});
endHooks.push(g=>{if(!g||!g.rec||g.daily)return;const era=CURRENT_ERA,b=save.ghosts[era];if(!b||g.t>b.t){save.ghosts[era]={t:Math.floor(g.t),kills:g.kills,pts:g.rec.slice(0,2*10*1800),date:todayKey()};persist();toast('New best: ghost saved')}});
const _ghTop=drawLootTop;drawLootTop=function(){_ghTop();const gh=G&&G.ghost;if(!gh)return;const i=Math.floor(G.t*10)*2;if(i+1>=gh.pts.length)return;
  const j=Math.min(gh.pts.length-2,i+2),f=(G.t*10)%1,x=gh.pts[i]+(gh.pts[j]-gh.pts[i])*f,y=gh.pts[i+1]+(gh.pts[j+1]-gh.pts[i+1])*f;
  const fr=SPR.mage[Math.floor(G.t*6)%SPR.mage.length]||SPR.mage[0];const im=fr.wr||fr.r||fr;bx.globalAlpha=.32;bx.drawImage(im,X(x)-(im.width>>1),Y(y)-im.height);bx.globalAlpha=1;
  const sx=X(x),sy=Y(y);if(sx<4||sx>BW-4||sy<4||sy>BH-4){bx.globalAlpha=.6;bx.fillStyle='#fff6e0';bx.fillRect(Math.max(2,Math.min(BW-4,sx)),Math.max(10,Math.min(BH-14,sy)),2,2);bx.globalAlpha=1}};
// ---- leaderboard (local only: a global board needs a server) ----
if(!save.history)save.history=[];
endHooks.push(g=>{if(!g)return;save.history.push({t:Math.floor(g.t),kills:g.kills,era:CURRENT_ERA,diff:g.diff||'normal',mage:g.mage||'ink',code:g.customCode||null,daily:!!g.daily,date:todayKey()});
  save.history.sort((a,b)=>b.t-a.t||b.kills-a.kills);save.history=save.history.slice(0,25);persist()});
function leaderboard(){
  leaveRun();setRoute('leaderboard');
  const rows=save.history.map((r,i)=>`<div class="li"><b>${String(i+1).padStart(2,'0')}</b><div class="li-t"><span class="nm">${fmt(r.t)} &middot; ${r.kills} kills</span><span class="sh">${ERAS[r.era]?ERAS[r.era].name:r.era} &middot; ${r.diff} &middot; ${MAGES[r.mage]?MAGES[r.mage].name:r.mage}${r.daily?' &middot; daily':''} &middot; ${r.date}</span></div>${r.code?`<button class="buy" data-code="${r.code}">Replay seed</button>`:''}</div>`).join('')||'<p class="sh">No runs yet.</p>';
  const gh=Object.entries(save.ghosts).map(([e,g])=>`<div class="li"><span class="nm">${ERAS[e]?ERAS[e].name:e}</span><span class="sh">best ${fmt(g.t)} &middot; ${g.kills} kills &middot; ghost recorded ${g.date}</span></div>`).join('')||'<p class="sh">Finish a run to record a ghost.</p>';
  show(sheet('Leaderboard','15 &mdash; Local records',`<div class="cols"><div><div class="lab rule">Your top runs</div><div class="list">${rows}</div></div><div><div class="lab rule">Ghosts</div><div class="list">${gh}</div>
    <div class="lab rule" style="margin-top:14px">Global</div><p class="note">Global and friends leaderboards need an online service, which Era Draw doesn't have yet. Share codes from Custom Run let friends race the same seed today.</p>
    <nav class="menu"><button id="ghT"><b>01</b>Ghost replay<span>${save.ghost===false?'Off':'On'}</span><i>${save.ghost===false?'&#9633;':'&#9632;'}</i></button></nav></div></div>`));
  screenEl.querySelectorAll('[data-code]').forEach(el=>el.onclick=()=>custom(el.dataset.code));
  $('ghT').onclick=()=>{save.ghost=save.ghost===false;persist();leaderboard()};$('back').onclick=home;
}
hub('leaderboard','Leaderboard',leaderboard);
