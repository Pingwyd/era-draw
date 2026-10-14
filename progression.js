'use strict';
// ================= ERA MATERIALS =================
if(!save.mats)save.mats={bone:0,flint:0,hide:0,bronze:0};
const MAT_NAMES={bone:'Bone',flint:'Flint',hide:'Hide',bronze:'Bronze'};
const _killEnemy=killEnemy;
killEnemy=function(e){_killEnemy(e);if(!G)return;
  killHooks.forEach(f=>f(e));
  const m=e.T.mat;if(!m)return;const ch=e.T.boss?1:e.T.elite?.5:.05;
  if(Math.random()<ch){const n=e.T.boss?5:1;G.mats[m]=(G.mats[m]||0)+n;floatText(e.x,e.y-20,'+'+n+' '+MAT_NAMES[m].toUpperCase(),'#d9c27a',.9)}};
const killHooks=[];
endHooks.push(g=>{if(!g||!g.mats)return;for(const k in g.mats)save.mats[k]=(save.mats[k]||0)+g.mats[k]});


// ================= PERMANENT UPGRADE TREE =================
// Each node: max level, cost(l) in coins + materials, apply(G, level). Melee/Ranged Mastery raise the slot caps.
if(!save.upg)save.upg={};
const UPGRADES=[
  {id:'vit',  name:'Vitality',      branch:'Body',  max:5, desc:l=>`+${l*10}% max HP`,          coins:l=>60*l,  mats:l=>({hide:2*l}),          apply:(G,l)=>{G.player.maxHp*=1+.1*l;G.player.hp=G.player.maxHp}},
  {id:'swift',name:'Swift Feet',    branch:'Body',  max:5, desc:l=>`+${l*5}% move speed`,       coins:l=>50*l,  mats:l=>({bone:2*l}),          apply:(G,l)=>G.player.speed*=1+.05*l},
  {id:'step', name:'Quick Step',    branch:'Body',  max:3, desc:l=>`-${l*10}% dash cooldown`,   coins:l=>80*l,  mats:l=>({bone:2*l,hide:1*l}), apply:(G,l)=>G.player.dashCdMul=1-.1*l},
  {id:'might',name:'Ink Mastery',   branch:'Ink',   max:5, desc:l=>`+${l*6}% creation damage`,  coins:l=>80*l,  mats:l=>({flint:2*l}),         apply:(G,l)=>G.player.dmgMul*=1+.06*l},
  {id:'craft',name:'Craftsmanship', branch:'Ink',   max:5, desc:l=>`+${l*8}% durability`,       coins:l=>70*l,  mats:l=>({bone:1*l,flint:1*l}),apply:(G,l)=>G.player.durMul*=1+.08*l},
  {id:'focus',name:'Deep Breath',   branch:'Ink',   max:3, desc:l=>`+${(l*.15).toFixed(2)}s slow-mo`,coins:l=>90*l,mats:l=>({bone:2*l}),       apply:(G,l)=>{G.player.focus+=.15*l;G.focusLeft=G.player.focus}},
  {id:'greed',name:'Greed',         branch:'Fortune',max:5,desc:l=>`+${l*8}% coins`,            coins:l=>100*l, mats:l=>({hide:1*l}),          apply:(G,l)=>G.player.coinMul*=1+.08*l},
  {id:'melee',name:'Melee Mastery', branch:'Mastery',max:2,desc:l=>`+${l} melee weapon cap`,    coins:l=>400*l, mats:l=>({bone:6*l,hide:4*l}), apply:(G,l)=>G.player.caps.melee+=l},
  {id:'ranged',name:'Ranged Mastery',branch:'Mastery',max:2,desc:l=>`+${l} ranged weapon cap`,  coins:l=>450*l, mats:l=>({flint:6*l,hide:2*l}),apply:(G,l)=>G.player.caps.ranged+=l},
];
runHooks.push(G=>{for(const u of UPGRADES){const l=save.upg[u.id]||0;if(l)u.apply(G,l)}});
function canAfford(u,l){if(save.coins<u.coins(l))return false;const m=u.mats(l);for(const k in m)if((save.mats[k]||0)<m[k])return false;return true}
function costStr(u,l){const m=u.mats(l);return `${coinI()} ${u.coins(l)} `+Object.entries(m).map(([k,v])=>`<img class="pi" src="${ICON['mat_'+k]}" alt="${k}"> ${v}`).join(' ')}
function upgrades(){
  leaveRun();setRoute('upgrades');
  const branches=[...new Set(UPGRADES.map(u=>u.branch))];
  const wallet=`${coinI()} ${save.coins} &nbsp; `+Object.keys(MAT_NAMES).map(k=>`<img class="pi" src="${ICON['mat_'+k]}" alt=""> ${save.mats[k]||0}`).join(' &nbsp; ');
  show(sheet('Upgrades',`07 &mdash; ${wallet}`,`<div class="tree">${branches.map((b,bi)=>`<div class="br"><div class="lab rule">0${bi+1} &mdash; ${b}</div>${UPGRADES.filter(u=>u.branch===b).map(u=>{const l=save.upg[u.id]||0,mx=l>=u.max,n=l+1;
     return `<div class="node ${mx?'max':''}"><div class="node-t"><span class="nm">${u.name}</span><span class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</span></div>
      <span class="sh">${l?u.desc(l):'Not learned'}${mx?'':' &rarr; '+u.desc(n)}</span>
      <button class="buy ${mx?'own':canAfford(u,n)?'':'poor'}" data-u="${u.id}">${mx?'Mastered':costStr(u,n)}</button></div>`}).join('')}</div>`).join('')}</div>`));
  screenEl.querySelectorAll('[data-u]').forEach(el=>el.onclick=()=>{const u=UPGRADES.find(x=>x.id===el.dataset.u),l=save.upg[u.id]||0;if(l>=u.max)return;
    if(!canAfford(u,l+1)){toast('Not enough coins or materials');return}save.coins-=u.coins(l+1);const m=u.mats(l+1);for(const k in m)save.mats[k]-=m[k];save.upg[u.id]=l+1;persist();sfx('pick');toast(u.name+' '+(l+1));upgrades()});
  $('back').onclick=home;
}
hub('upgrades','Upgrades',upgrades);


// ================= MAGE SELECT =================
if(!save.mages)save.mages=['ink'];if(!save.mage)save.mage='ink';
const MAGES={
  ink:   {name:'Ink Mage',   cost:0,   pal:{},                                              perk:'Balanced. No strengths, no weaknesses.', apply:G=>{}},
  flint: {name:'Flint Witch',cost:300, pal:{h:'#2a1a1a',H:'#140c0c',r:'#8f2430',R:'#5a1620'}, perk:'+20% damage, -15% max HP.',             apply:G=>{G.player.dmgMul*=1.2;G.player.maxHp*=.85;G.player.hp=G.player.maxHp}},
  wind:  {name:'Wind Sage',  cost:400, pal:{h:'#e9dcc3',H:'#b9ab90',r:'#4c7a4a',R:'#2e4f2e'}, perk:'+15% speed, +0.4s slow-mo, -10% damage.', apply:G=>{G.player.speed*=1.15;G.player.focus+=.4;G.focusLeft=G.player.focus;G.player.dmgMul*=.9}},
  hermit:{name:'Bone Hermit',cost:600, pal:{h:'#6b5038',H:'#4a3626',r:'#7b5a44',R:'#4f3a2c',w:'#efe6d2'},perk:'+1 melee cap, +20% durability, -10% speed.',apply:G=>{G.player.caps.melee+=1;G.player.durMul*=1.2;G.player.speed*=.9}},
};
const MAGE_SPR={};
function mageFrames(id){if(MAGE_SPR[id])return MAGE_SPR[id];const pal={...PAL,...MAGES[id].pal};return MAGE_SPR[id]=[0,1,0,2].map(i=>set(grid([...MAGE_TOP,...LEGS[i]],pal)))}
const BASE_MAGE=SPR.mage;
runHooks.push(G=>{const id=G.daily?'ink':(save.mages.includes(save.mage)?save.mage:'ink');G.mage=id;MAGES[id].apply(G);SPR.mage=mageFrames(id)});
function mages(){
  leaveRun();setRoute('mages');
  show(sheet('Mages',`08 &mdash; Choose who walks the ages &middot; ${coinI()} ${save.coins}`,`<div class="tbl">${Object.entries(MAGES).map(([id,m],i)=>{const own=save.mages.includes(id),on=save.mage===id;
    return `<button class="cell ${on?'on':''}" data-m="${id}"><span class="cell-h"><b>0${i+1}</b>${on?'<i class="chk">&#9632; Chosen</i>':''}</span><img class="mimg" src="${iconURL(mageFrames(id)[0].r,4)}" alt=""><span class="nm">${m.name}</span><span class="sh">${m.perk}</span><span class="st">${own?'Unlocked':coinI()+' '+m.cost}</span></button>`}).join('')}</div>`));
  screenEl.querySelectorAll('[data-m]').forEach(el=>el.onclick=()=>{const id=el.dataset.m,m=MAGES[id];
    if(!save.mages.includes(id)){if(save.coins<m.cost){toast('Not enough coins');return}save.coins-=m.cost;save.mages.push(id);toast(m.name+' joins you');sfx('chest')}
    save.mage=id;persist();mages()});
  $('back').onclick=home;
}
hub('mages','Mages',mages);


// ================= ACHIEVEMENTS =================
if(!save.ach)save.ach={};if(!save.stats)save.stats={kills:0,bosses:{},dailies:0};
const ACH=[
  {id:'kills100',name:'First Ink',       desc:'Defeat 100 enemies in one run',   coins:25, test:g=>g&&g.kills>=100},
  {id:'kills1k', name:'Inkstorm',        desc:'Defeat 1,000 enemies in total',   coins:80, test:()=>save.stats.kills>=1000},
  {id:'t5',      name:'Five Minutes',    desc:'Survive 5:00',                    coins:50, test:g=>g&&g.t>=300},
  {id:'t10',     name:'Ten Minutes',     desc:'Survive 10:00',                   coins:100,test:g=>g&&g.t>=600},
  {id:'clear1',  name:'Out of the Cave', desc:'Clear the Stone Age (15:00)',     coins:200,test:g=>g&&g.victory&&g.era===ERAS.stone},
  {id:'grael',   name:'Elder Felled',    desc:'Defeat Grael, the Woolly Elder',  coins:75, test:()=>save.stats.bosses.mammoth},
  {id:'urkesh',  name:'Tar Silenced',    desc:'Defeat Ur-Kesh, the Bone Shaman', coins:100,test:()=>save.stats.bosses.shaman},
  {id:'perfect10',name:'Steady Hand',    desc:'10 perfect draws in one run',     coins:50, test:g=>g&&g.perfects>=10},
  {id:'combo',   name:'Fusion',          desc:'Perform a combo draw',            coins:30, test:g=>g&&Object.keys(g.combosSeen||{}).length>0},
  {id:'evolve',  name:'Evolution',       desc:'Evolve a weapon',                 coins:60, test:g=>g&&Object.keys(g.evolved||{}).length>0},
  {id:'rich',    name:'Hoarder',         desc:'Hold 1,000 coins at once',        coins:50, test:()=>save.coins>=1000},
  {id:'cursed3', name:'Cursed Ink',      desc:'Survive 3:00 on Cursed or harder',coins:80, test:g=>g&&g.diff!=='normal'&&g.t>=180},
  {id:'bronze',  name:'Bronze Footing',  desc:'Enter the Bronze Age',            coins:50, test:g=>g&&g.era===ERAS.bronze},
  {id:'daily',   name:'Daily Ritual',    desc:'Finish a daily challenge',        coins:40, test:()=>save.stats.dailies>0},
  {id:'mage',    name:'New Robes',       desc:'Unlock another mage',             coins:30, test:()=>save.mages.length>1},
];
function checkAch(g){for(const a of ACH){if(save.ach[a.id])continue;let ok=false;try{ok=a.test(g)}catch(e){}
  if(ok){save.ach[a.id]=Date.now();save.coins+=a.coins;persist();toast('Achievement: '+a.name+' (+'+a.coins+')');sfx('chest');haptic([20,30,20])}}}
killHooks.push(e=>{save.stats.kills++;if(e.T.boss)save.stats.bosses[e.type]=(save.stats.bosses[e.type]||0)+1});
endHooks.push(g=>{if(g&&g.daily)save.stats.dailies++;checkAch(g)});
setInterval(()=>{if(mode==='run'&&G&&!G.paused)checkAch(G)},1500);
function achievements(){
  leaveRun();setRoute('achievements');const done=ACH.filter(a=>save.ach[a.id]).length;
  show(sheet('Achievements',`09 &mdash; ${done} / ${ACH.length} earned`,`<div class="list achl">${ACH.map((a,i)=>{const d=save.ach[a.id];
    return `<div class="li ${d?'':'dim'}"><b>${String(i+1).padStart(2,'0')}</b><span class="seal ${d?'on':''}"></span><div class="li-t"><span class="nm">${a.name}</span><span class="sh">${a.desc}</span></div><span class="buy ${d?'own':'poor'}">${d?'Earned':coinI()+' '+a.coins}</span></div>`}).join('')}</div>`));
  $('back').onclick=home;
}
hub('achievements','Achievements',achievements);


// ================= BESTIARY =================
if(!save.seen)save.seen={};
killHooks.push(e=>{save.seen[e.type]=(save.seen[e.type]||0)+1});
function bestiary(){
  leaveRun();setRoute('bestiary');
  const groups=Object.values(ERAS).filter(er=>er.spawns).map(er=>({er,ids:[...new Set([...er.spawns.map(s=>s.type||s[0]||s),...(er.bosses||[]).map(b=>b.type||b)])].filter(id=>ENEMY_TYPES[id])}));
  const total=groups.reduce((a,g)=>a+g.ids.length,0),known=groups.reduce((a,g)=>a+g.ids.filter(i=>save.seen[i]).length,0);
  show(sheet('Bestiary',`10 &mdash; ${known} / ${total} recorded`,groups.map((g,gi)=>`<div class="sec">0${gi+1} &mdash; ${g.er.name}</div><div class="tbl">${g.ids.map(id=>{const T=ENEMY_TYPES[id],n=save.seen[id];const fr=SPR.en[id];const img=fr&&fr.r?iconURL(fr.r,T.boss?2:3):'';
    return `<div class="cell ${n?'':'dim'}"><span class="cell-h"><b>${T.boss?'BOSS':''}</b><i>${n?n+' felled':''}</i></span>${img?`<img class="bimg ${n?'':'sil'}" src="${img}" alt="">`:''}<span class="nm">${n?(T.title||T.name||id):'???'}</span><span class="sh">${n?(T.lore||''):'Defeat one to record it.'}</span>${n?`<span class="st">HP ${T.hp} &middot; DMG ${T.dmg||T.contact||'-'}${T.mat?' &middot; drops '+MAT_NAMES[T.mat]:''}</span>`:''}</div>`}).join('')}</div>`).join('')));
  $('back').onclick=home;
}
hub('bestiary','Bestiary',bestiary);

boot();
