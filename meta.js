let DAILY_ON=null;const _RND=Math.random;
'use strict';
// ================= META: eras, difficulty, home hub =================
if(!save.eras)save.eras=['stone'];if(!save.era)save.era='stone';if(!save.diff)save.diff='normal';
const DIFFS={
  normal:   {name:'Normal',   hp:1,  dmg:1,   spawn:1,   coins:1,   desc:'The age as it was.'},
  cursed:   {name:'Cursed',   hp:1.35,dmg:1.2,spawn:1.15, coins:1.5, desc:'+35% enemy HP, +20% damage, more spawns. 1.5x coins.'},
  nightmare:{name:'Nightmare',hp:1.8,dmg:1.45,spawn:1.3,coins:2.2, desc:'For the ink-mad. 1.8x enemy HP, +45% damage, many more spawns. 2.2x coins.'},
};
const _spawnEnemy=spawnEnemy;
spawnEnemy=function(type,scale,at){const e=_spawnEnemy(type,scale,at);const d=G.diffDef||DIFFS.normal;e.hp*=d.hp;e.maxHp*=d.hp;e.dmg*=d.dmg;return e};
const _updateSpawns=updateSpawns;
updateSpawns=function(dt){_updateSpawns(dt);const d=G.diffDef||DIFFS.normal;if(d.spawn!==1)G.spawnT+=dt*(1+G.t/13)*(d.spawn-1)};
const _calcCoins=calcCoins;
calcCoins=function(){return Math.floor(_calcCoins()*((G&&G.diffDef)||DIFFS.normal).coins)};
const _newRun=newRun;
newRun=function(){_newRun();G.daily=!!DAILY_ON;G.diffDef=DIFFS[G.daily?'cursed':save.diff]||DIFFS.normal;G.diff=G.daily?'cursed':save.diff;G.mats={};G.bossKills={};G.perfects=0;runHooks.forEach(f=>f(G))};
const runHooks=[]; // later systems push(G=>...) to modify a new run
function eraCleared(){
  const i=ERA_ORDER.indexOf(CURRENT_ERA),next=ERA_ORDER[i+1];
  if(next&&!save.eras.includes(next)&&!ERAS[next].locked){save.eras.push(next);toast(ERAS[next].name+' unlocked!')}
  G.victory=true;sfx('chest');endRun();
}
const _endRun=endRun;
endRun=function(){const v=G&&G.victory,g=G;endHooks.forEach(f=>f(g));_endRun();if(save.lastRun){save.lastRun.victory=!!v;save.lastRun.diff=g?g.diff:'normal';save.lastRun.mats=g?g.mats:{};persist();results()}};
const endHooks=[];
const _results=results;
results=function(){_results();const r=save.lastRun;if(!r)return;
  if(r.victory){const h=document.querySelector('.res .disp');if(h)h.textContent='Era cleared.'}
  const m=r.mats&&Object.keys(r.mats).length?Object.entries(r.mats).map(([k,v])=>`<img class="pi" src="${ICON['mat_'+k]||''}" alt=""> ${v} ${k}`).join(' &nbsp; '):'';
  const note=document.querySelector('.res .note');if(note&&m)note.innerHTML+=' &nbsp;&middot;&nbsp; '+m;
  if(r.diff&&r.diff!=='normal'){const l=document.querySelector('.res .row .lab');if(l)l.innerHTML+=' &middot; '+DIFFS[r.diff].name}
};
function eras(){
  leaveRun();setRoute('eras');
  show(sheet('Eras','06 &mdash; Choose your age and its curse',`<div class="tbl eras">${ERA_ORDER.map((id,i)=>{const E=ERAS[id],open=save.eras.includes(id)&&!E.locked;
     return `<button class="cell ${save.era===id?'on':''} ${open?'':'lock'}" data-era="${id}"><span class="cell-h"><b>${E.no||'?'}</b>${save.era===id?'<i class="chk">&#9632; Selected</i>':''}</span><span class="nm">${E.name}</span><span class="sh">${E.date||''}</span><span class="st">${open?E.lore:(E.locked?'Coming soon':'Survive 10:00 in the '+ERAS[ERA_ORDER[i-1]].name)}</span></button>`}).join('')}</div>
    <div class="lab rule">Difficulty</div><nav class="menu">${Object.entries(DIFFS).map(([k,d],i)=>`<button data-diff="${k}" class="${save.diff===k?'prim':''}"><b>0${i+1}</b>${d.name}<span>${d.desc}</span><i>${save.diff===k?'&#9632;':'&#9633;'}</i></button>`).join('')}</nav>`));
  screenEl.querySelectorAll('[data-era]').forEach(el=>el.onclick=()=>{const id=el.dataset.era;if(!save.eras.includes(id)||ERAS[id].locked){toast('Locked');return}save.era=id;persist();eras()});
  screenEl.querySelectorAll('[data-diff]').forEach(el=>el.onclick=()=>{save.diff=el.dataset.diff;persist();eras()});
  $('back').onclick=home;
}
// ---- home hub ----
const HUB=[]; // {id,label,fn,extra} — later systems register pages here
function hub(id,label,fn,extra){HUB.push({id,label,fn,extra});ROUTES[id]=fn}
const ROUTES={};
const HOME_GROUPS=[['play','Play',['lo','daily','challenges','custom','tutorial']],['coll','Collection',['sketchbook','inks','cosmetics','mages','bestiary']],['prog','Progress',['upgrades','skills','eras','achievements']],['social','Social',['coop','lan','leaderboard']]];
function homeGroups(E){const known=new Set(HOME_GROUPS.flatMap(g=>g[2]));const extra=HUB.filter(h=>!known.has(h.id)&&!(h.extra&&h.extra.hidden)&&h.id!=='privacy'&&h.id!=='changelog').map(h=>h.id);
  const lab=id=>id==='lo'?'Loadout':(HUB.find(h=>h.id===id)||{}).label;const tab=save.homeTab||'play';
  const btn=id=>id==='lo'?`<button id="lo"><b>Loadout</b><span>${save.loadout.length}/${save.slots}</span></button>`:id==='eras'?`<button data-hub="eras"><b>Eras</b><span>${E.no}</span></button>`:lab(id)?`<button data-hub="${id}"><b>${lab(id)}</b></button>`:'';
  return `<div class="htabs" role="tablist">${HOME_GROUPS.map(g=>`<button role="tab" data-tab="${g[0]}" aria-selected="${g[0]===tab}" class="${g[0]===tab?'on':''}">${g[1]}</button>`).join('')}</div>`+
   HOME_GROUPS.map((g,i)=>`<nav class="subgrid hpanel" role="tabpanel" data-panel="${g[0]}" ${g[0]===tab?'':'hidden'}>${(i===1?[...g[2],...extra]:g[2]).map(btn).join('')}</nav>`).join('')}
function wireHomeTabs(){screenEl.querySelectorAll('[data-tab]').forEach(t=>t.onclick=()=>{save.homeTab=t.dataset.tab;persist();
  screenEl.querySelectorAll('[data-tab]').forEach(x=>{const on=x===t;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});
  screenEl.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==t.dataset.tab)})}
home=function(){
  leaveRun();setRoute('home');mode='home';G=null;$('hud').classList.add('hidden');const E=ERAS[save.era]||ERAS.stone;const D=DIFFS[save.diff];
  const mats=save.mats?Object.entries(save.mats).filter(([k,v])=>v>0).map(([k,v])=>`<img class="pi" src="${ICON['mat_'+k]||''}" alt="${k}"><b>${v}</b>`).join(''):'';
  show(`<div class="home">
   <div class="home-l"><div class="lab">Era ${E.no} &mdash; ${E.name} &middot; ${E.date}${save.diff!=='normal'?' &middot; '+D.name:''}</div>
    <h1 class="mast">Era<br>Draw</h1>
    <p class="tag">Draw weapons from the age you are trapped in. Hold the line until the ink runs dry.</p>
    <div class="wallet">${coinI()}<b>${save.coins}</b>${gemI()}<b>${save.gems}</b>${mats}<span class="lab">Best ${save.best?fmt(save.best):'&mdash;'} &middot; Runs ${save.runs}</span></div></div>
   <div class="home-r"><div class="plate"><canvas id="diorama" width="160" height="48"></canvas><div class="cap"><span class="lab">Fig. 1 &mdash; The mage</span><span class="lab">Era ${E.no}</span></div></div><nav class="menu"><button id="play" class="prim"><b>&#9654;</b>Enter the ${E.name}<i>&rarr;</i></button></nav>
    ${homeGroups(E)}
    <nav class="hfoot"><button id="shop">Shop</button><button id="set">Settings</button><button id="how">How to play</button><button data-hub="privacy" id="prv">Privacy</button></nav></div></div>`);startDiorama();
  $('play').onclick=()=>{goLandscape();startRun()};$('lo').onclick=loadout;$('shop').onclick=shop;$('how').onclick=how;$('set').onclick=settings;
  screenEl.querySelectorAll('[data-hub]').forEach(el=>el.onclick=()=>ROUTES[el.dataset.hub]&&ROUTES[el.dataset.hub]());
  wireHomeTabs();
};
hub('eras','Eras',eras);
// route table extension
const _route=route;
route=function(){const r=(location.hash.replace(/^#\/?/,'')||'home');if(ROUTES[r]){ROUTES[r]();return}_route()};
removeEventListener('popstate',_route);addEventListener('popstate',()=>route());
// materials icons (used by later systems)
SPR.mat={bone:outline(grid(['w....w','WwwwwW','.wwww.','WwwwwW','w....w'])),flint:outline(grid(['..T...','.tTT..','ttwtT.','tttTTT','.tTTT.'])),hide:outline(grid(['f.ff.f','ffffff','fFffFf','ffffff','.f..f.'])),bronze:outline(grid(['.aaa.','ayaaA','aaaAA','.AAA.']))};
for(const k in SPR.mat)ICON['mat_'+k]=iconURL(SPR.mat[k],3);
window.addEventListener('load',()=>{});
