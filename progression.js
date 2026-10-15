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
  ink:   {name:'Ink Mage',   cost:0,   pal:{},                                              perk:'Balanced: 2 dash charges, no strengths, no weaknesses.', apply:G=>{}},
  flint: {name:'Flint Witch',cost:300, pal:{h:'#2a1a1a',H:'#140c0c',r:'#8f2430',R:'#5a1620'}, perk:'Dash leaves a fire trail that burns enemies. +20% damage, -15% max HP.', apply:G=>{G.player.fireDash=true;G.player.dmgMul*=1.2;G.player.maxHp*=.85;G.player.hp=G.player.maxHp}},
  wind:  {name:'Wind Sage',  cost:400, pal:{h:'#e9dcc3',H:'#b9ab90',r:'#4c7a4a',R:'#2e4f2e'}, perk:'3 dash charges, +15% speed, +0.4s slow-mo, -10% damage.', apply:G=>{G.player.dashMax=3;G.player.dashCharges=3;G.player.speed*=1.15;G.player.focus+=.4;G.focusLeft=G.player.focus;G.player.dmgMul*=.9}},
  hermit:{name:'Bone Hermit',cost:600, pal:{h:'#6b5038',H:'#4a3626',r:'#7b5a44',R:'#4f3a2c',w:'#efe6d2'},perk:'Longer dash (+60%), +1 melee cap, +20% durability, -10% speed.',apply:G=>{G.player.dashTimeMul=1.6;G.player.caps.melee+=1;G.player.durMul*=1.2;G.player.speed*=.9}},
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
  {id:'clear1',  name:'Out of the Cave', desc:'Clear the Stone Age (10:00)',     coins:200,test:g=>g&&g.victory&&g.era===ERAS.stone},
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


// ================= DAILY CHALLENGE =================
function todayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function seedOf(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const DAILY_MODS=[{n:'Glass Ink',d:'Weapons break 40% faster',f:G=>G.player.durMul*=.6},{n:'Swarm Day',d:'+40% spawns',f:G=>G.diffDef={...G.diffDef,spawn:G.diffDef.spawn*1.4}},{n:'Heavy Robes',d:'-15% speed, +30% HP',f:G=>{G.player.speed*=.85;G.player.maxHp*=1.3;G.player.hp=G.player.maxHp}},{n:'Sharp Quill',d:'+30% damage, -30% HP',f:G=>{G.player.dmgMul*=1.3;G.player.maxHp*=.7;G.player.hp=G.player.maxHp}}];
function dailyInfo(){const k=todayKey(),s=seedOf('eradraw'+k),r=mulberry(s);return {k,s,era:'stone',mod:DAILY_MODS[Math.floor(r()*DAILY_MODS.length)]}}
if(!save.daily)save.daily={};
runHooks.push(G=>{if(!G.daily)return;const d=dailyInfo();G.dailyKey=d.k;d.mod.f(G)});
endHooks.push(g=>{if(g&&g.daily){const b=save.daily[g.dailyKey]||{t:0,kills:0};if(g.t>b.t)save.daily[g.dailyKey]={t:Math.floor(g.t),kills:g.kills};DAILY_ON=null;persist()}});
function startDaily(){const d=dailyInfo();DAILY_ON=d.k;RUN_SEED=d.s;const pe=save.era;save.era=d.era;startRun();save.era=pe;setRoute('play')}
const _leave=leaveRun;leaveRun=function(){if(DAILY_ON&&mode!=='run'){DAILY_ON=null}return _leave.apply(this,arguments)};
function daily(){
  leaveRun();setRoute('daily');const d=dailyInfo(),b=save.daily[d.k];
  const hist=Object.entries(save.daily).sort((a,b)=>b[0]<a[0]?-1:1).slice(0,6);
  show(sheet('Daily Challenge',`11 &mdash; ${d.k} &middot; seed ${d.s.toString(16)}`,`<div class="detail"><div class="d-l"><span class="sec">Today's rite</span><h3 class="dt">${d.mod.n}</h3><p class="sh">${d.mod.d}. Stone Age, Cursed difficulty, Ink Mage. Same spawns for everyone today.</p><p class="sh">Best today: ${b?fmt(b.t)+' &middot; '+b.kills+' kills':'not attempted'}</p><button class="btn pri" id="dgo">Begin daily</button></div><div class="d-r"><span class="sec">Recent</span>${hist.length?hist.map(([k,v])=>`<div class="li"><span class="nm">${k}</span><span class="sh">${fmt(v.t)} &middot; ${v.kills} kills</span></div>`).join(''):'<p class="sh">No dailies yet.</p>'}</div></div>`));
  $('dgo').onclick=startDaily;$('back').onclick=home;
}
hub('daily','Daily',daily);


// ================= CHEST ROULETTE =================
function openChest(c){
  G.paused=true;stick.id=null;stick.active=false;G.drawing=null;
  const r=Math.random(),n=c.boss?(r<.6?3:1):(r<.15?3:1); // max 3 rewards: outcomes are 1 or 3
  const pool=POWERUPS.filter(pu=>!pu.max||(G.picks[pu.id]||0)<pu.max);const rewards=[];
  for(let i=0;i<n;i++){const pu=pool[Math.floor(Math.random()*pool.length)];rewards.push({pu,r:Math.random()<.05*n?2:Math.random()<.4?1:0})}
  sfx('chest');haptic([20,40,20,40,60]);
  show(`<div class="sheet lv chestr"><header class="row"><span class="lab">${c.boss?'Boss chest':'Chest'} &middot; +25 coins</span><span class="lab">${n} reward${n>1?'s':''}</span></header>
   <h2 class="disp">${n===3?'Jackpot':'Treasure'}</h2>
   <div class="reels">${rewards.map((_,i)=>`<div class="reel" id="reel${i}"><img alt=""></div>`).join('')}</div>
   <div class="rlist" id="rlist"></div><button class="btn pri" id="rok" disabled>Collect</button></div>`);
  const ids=POWERUPS.map(p=>p.id);let t=0;
  const spin=setInterval(()=>{t++;rewards.forEach((k,i)=>{const el=$('reel'+i);if(!el)return;const stop=10+i*5;
    if(t<stop){el.firstChild.src=ICON['pu_'+ids[(t+i*3)%ids.length]];if(t%2)sfx('tick')}
    else if(t===stop){el.firstChild.src=ICON['pu_'+k.pu.id];el.className='reel done r-'+RAR[k.r];sfx('pick');
      $('rlist').insertAdjacentHTML('beforeend',`<span class="rr r-${RAR[k.r]}">${k.pu.name} <i>${RAR[k.r]}</i></span>`)}});
    if(t>=10+(n-1)*5){clearInterval(spin);const ok=$('rok');if(ok)ok.disabled=false}},90);
  $('rok').onclick=()=>{for(const k of rewards){k.pu.apply(G.player,k.r);if(window.noteCardPick)noteCardPick(k.pu.id,false);G.picks[k.pu.id]=(G.picks[k.pu.id]||0)+1}show('');G.paused=false;last=performance.now()};
}


// ================= MAP PICKUPS =================
const PICKUP_ART={
 magnet:['.RR..RR.','RrR..RrR','RrR..RrR','RrR..RrR','RrRRRRrR','.RrrrrR.','..RRRR..'],
 meat:['....ww','...wWw','.mmmw.','mMMMm.','mMMMm.','mMMm..','.mm...'],
 bomb:['....y.','...Ky.','.KKK..','KkkkK.','KkKkK.','KkkkK.','.KKK..'],
};
const PICKUP_PAL={R:'#b8382f',r:'#e8e0cc',w:'#efe6d2',W:'#b9ab90',m:'#7a2e22',M:'#b8583c',K:'#1a1416',k:'#3b3438',y:'#ffd34a'};
SPR.pick={};for(const k in PICKUP_ART)SPR.pick[k]=outline(grid(PICKUP_ART[k],{...PAL,...PICKUP_PAL}));
const PICKUPS={
 magnet:{name:'Magnet',w:3,fn:G=>{const p=G.player;let n=0;for(const o of G.orbs)if(Math.hypot(o.x-p.x,o.y-p.y)<900){o.pull=true;n++}toast('Magnet: '+n+' gems pulled')}},
 meat:{name:'Drumstick',w:4,fn:G=>{const p=G.player,h=Math.round(p.maxHp*.2);p.hp=Math.min(p.maxHp,p.hp+h);floatText(p.x,p.y-40,'+'+h+' HP','#8fd17a',1.2)}},
 bomb:{name:'Bomb',w:2,fn:G=>{const p=G.player;G.shake=18;burst(p.x,p.y,'#ffd34a',60);ring(p.x,p.y,420,'#ffd34a');
   for(const e of G.enemies.slice())if(!e.T.boss&&Math.hypot(e.x-p.x,e.y-p.y)<460)killEnemy(e);toast('Bomb!')}},
};
function dropPickup(x,y,type){if(!type){const tot=Object.values(PICKUPS).reduce((a,b)=>a+b.w,0);let r=Math.random()*tot;for(const k in PICKUPS){r-=PICKUPS[k].w;if(r<=0){type=k;break}}}
  (G.pickups||(G.pickups=[])).push({x,y,type,t:0})}
runHooks.push(G=>{G.pickups=[];G.pickT=30;G.mapChestT=110});
function updatePickups(dt){const p=G.player;if(!G.pickups)G.pickups=[];
  G.pickT-=dt;if(G.pickT<=0){G.pickT=24+Math.random()*12;const a=Math.random()*6.283,d=170+Math.random()*130;dropPickup(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d)}
  for(let i=G.pickups.length-1;i>=0;i--){const k=G.pickups[i];k.t+=dt;if(k.t>60){G.pickups.splice(i,1);continue}
    if(Math.hypot(k.x-p.x,k.y-p.y)<p.r+14){G.pickups.splice(i,1);sfx('pick');haptic(15);PICKUPS[k.type].fn(G);if(mode!=='run')return}}}
function renderPickups(){if(!G.pickups)return;for(const k of G.pickups){if(k.t>54&&(Math.floor(k.t*8)&1))continue;shadow(k.x,k.y,5);blit(SPR.pick[k.type],k.x,k.y-((Math.floor(G.t*3)&1)))}}


// ================= BREAKABLES =================
const PROP_ART={
 torch:['..y...','.yOy..','.OYO..','..O...','.BBB..','..b...','..b...','..b...','.bbb..'],
 bush:['..GG.G..','.GgGGgG.','GgGgGGgG','GGgGgGGG','.GGGGgG.','..G..G..'],
 urn:['.CCCC.','..cc..','.CccC.','CcCCcC','CcccCC','.CccC.','..CC..'],
};
const PROP_PAL={y:'#ffd34a',O:'#ff8a2a',Y:'#fff0a0',B:'#4a3a30',b:'#6b5038',G:'#3f6b2e',g:'#5f8f3c',C:'#a8643a',c:'#d08a52'};
SPR.prop={};for(const k in PROP_ART)SPR.prop[k]=outline(grid(PROP_ART[k],{...PAL,...PROP_PAL}));
const ERA_PROPS={stone:['torch','bush','bush'],bronze:['torch','urn','urn']};
runHooks.push(G=>{G.props=[];G.propT=2});
function hitProp(k){k.hp--;k.flash=.12;k.shk=.22;burst(k.x,k.y-8,k.type==='bush'?'#5f8f3c':k.type==='urn'?'#d08a52':'#ff8a2a',10);sfx('hit');
  if(k.hp<=0){k.dead=true;burst(k.x,k.y-8,'#d9c27a',14);if(Math.random()<.3)dropPickup(k.x,k.y);else{G.orbs.push({x:k.x,y:k.y,v:3*(ERA_XP[CURRENT_ERA]||1),t:0});G.bonus=(G.bonus||0)+2;floatText(k.x,k.y-24,'+2','#d9c27a',.8)}}}
const _updP=updatePickups;updatePickups=function(dt){_updP(dt);if(mode!=='run'||!G.props)return;const p=G.player;
  G.propT-=dt;if(G.propT<=0&&G.props.length<7){G.propT=13+Math.random()*9;const a=Math.random()*6.283,d=220+Math.random()*220,ts=ERA_PROPS[CURRENT_ERA]||ERA_PROPS.stone;
    G.props.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,type:ts[Math.floor(Math.random()*ts.length)],hp:3,maxHp:3,cd:0})}
  for(const k of G.props){k.cd-=dt;if(k.cd>0)continue;let hit=false;
    for(const s of G.shots)if(Math.abs(s.x-k.x)<14&&Math.abs(s.y-(k.y-8))<16){hit=true;break}
    if(!hit)for(const c of G.creations)if(c.def.kind==='melee'&&Math.hypot(c.x-k.x,c.y-k.y)<20){hit=true;break}
    if(!hit&&p.dashT>0&&Math.hypot(p.x-k.x,p.y-k.y)<24)hit=true;
    if(k.flash>0)k.flash-=dt;if(k.shk>0)k.shk-=dt;
    if(hit){k.cd=.25;hitProp(k)}}
  G.props=G.props.filter(k=>!k.dead&&Math.hypot(k.x-p.x,k.y-p.y)<1400)};
// breakable feedback: hit flash, shake, crack stages and a small HP bar after the first hit
function propFx(k,shk){const im=SPR.prop[k.type];if(!im)return;const x=X(k.x)+shk-(im.width>>1),y=Y(k.y)-im.height,mh=k.maxHp||3,dmg=mh-k.hp;
  if(dmg>0){bx.fillStyle='#1a0f0e';const w=im.width,h=im.height;bx.fillRect(x+(w>>1),y+(h>>2),1,h>>1);bx.fillRect(x+(w>>1)-1,y+(h>>1),1,1);bx.fillRect(x+(w>>1)+1,y+(h>>2)+2,1,1);
    if(dmg>1){bx.fillRect(x+(w>>2),y+(h>>1),1,h>>2);bx.fillRect(x+(w>>2)+1,y+(h>>1)+2,(w>>1),1);bx.fillRect(x+w-(w>>2),y+(h>>2),1,h>>2)}
    const bw=12,bxp=X(k.x)+shk-6,byp=y-4;bx.fillStyle='#1a0f0e';bx.fillRect(bxp-1,byp-1,bw+2,4);bx.fillStyle='#3a2a20';bx.fillRect(bxp,byp,bw,2);bx.fillStyle=k.hp/mh>.5?'#e9dcc3':'#ff8a3a';bx.fillRect(bxp,byp,Math.max(1,Math.round(bw*k.hp/mh)),2)}
  if(k.flash>0){bx.globalCompositeOperation='lighter';bx.globalAlpha=Math.min(1,k.flash*8);bx.drawImage(im,x,y);bx.drawImage(im,x,y);bx.globalAlpha=1;bx.globalCompositeOperation='source-over'}}
const _rndP=renderPickups;renderPickups=function(){if(G.props)for(const k of G.props){shadow(k.x,k.y,6);const shk=k.shk>0?Math.round(Math.sin(G.t*90)*k.shk*8):0;blit(SPR.prop[k.type],k.x+shk,k.y+(k.cd>0?-1:0));propFx(k,shk);
  if(k.type==='torch'){const sx=X(k.x),sy=Y(k.y)-14;const al=.05+.025*Math.sin(G.t*9+k.x);bx.fillStyle='rgba(255,170,60,'+al+')';for(const r of [4,7,10])bx.fillRect(sx-r,sy-r+2,r*2,r*2-4)}}_rndP()};


// ================= PROCEDURAL MUSIC =================
// Per-era data: tempo, scale (semitones), root (Hz), instrument timbres, drum pattern. Add an entry for any new era.
const ERA_MUSIC={
  stone: {bpm:96, root:110,scale:[0,3,5,7,10],lead:'triangle',bass:'sine',  drum:'x..x..x.x..x....',hat:'..x...x...x...x.',prog:[0,0,3,4]},
  bronze:{bpm:112,root:123,scale:[0,2,3,7,8], lead:'square',  bass:'triangle',drum:'x...x.x.x...x...',hat:'x.x.x.x.x.x.x.x.',prog:[0,3,4,0]},
  _menu: {bpm:72, root:98, scale:[0,3,7,10],  lead:'sine',    bass:'sine',  drum:'................',hat:'................',prog:[0,2,3,1]},
};
const MUS={on:false,next:0,step:0,bus:null,seed:1,motif:[]};
function mrand(){MUS.seed=(MUS.seed*1103515245+12345)&0x7fffffff;return MUS.seed/0x7fffffff}
function musNote(m,deg,oct){const n=m.scale.length,s=m.scale[((deg%n)+n)%n]+12*(oct+Math.floor(deg/n));return m.root*Math.pow(2,s/12)}
function musVoice(f,t,dur,type,vol){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(MUS.bus);o.start(t);o.stop(t+dur+.05)}
function musDrum(t,kick){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(kick?120:900,t);o.frequency.exponentialRampToValueAtTime(kick?40:300,t+.12);g.gain.setValueAtTime(kick?.5:.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+(kick?.18:.04));o.type=kick?'sine':'square';o.connect(g);g.connect(MUS.bus);o.start(t);o.stop(t+.2)}
function musKey(){return mode==='run'&&G?(ERA_MUSIC[CURRENT_ERA]?CURRENT_ERA:'stone'):'_menu'}
function musTick(){
  const want=AC&&!save.mute&&save.music!==false&&!(mode==='run'&&G&&G.paused&&!screenEl.innerHTML.includes('chestr'));
  if(!want){if(MUS.bus)MUS.bus.gain.setTargetAtTime(0,AC.currentTime,.1);MUS.on=false;return}
  if(!MUS.bus){MUS.bus=AC.createGain();MUS.bus.connect(master)}
  const key=musKey(),m=ERA_MUSIC[key];
  if(!MUS.on||MUS.key!==key){MUS.on=true;MUS.key=key;MUS.next=AC.currentTime+.05;MUS.step=0;MUS.seed=seedOf(key);MUS.motif=Array.from({length:8},()=>Math.floor(mrand()*7)-1)}
  MUS.bus.gain.setTargetAtTime(key==='_menu'?.35:.5,AC.currentTime,.3);
  const sp=60/m.bpm/4;
  while(MUS.next<AC.currentTime+.25){const t=MUS.next,s=MUS.step,bar=Math.floor(s/16)%m.prog.length,ch=m.prog[bar],i=s%16;
    if(m.drum[i]==='x')musDrum(t,true);if(m.hat[i]==='x')musDrum(t,false);
    if(i%8===0)musVoice(musNote(m,ch,-1),t,sp*7,m.bass,.22);
    if(i%2===0){const k=i/2,deg=MUS.motif[k]+ch;if(MUS.motif[k]>=0&&(bar%2===0||mrand()<.7))musVoice(musNote(m,deg,1),t,sp*1.8,m.lead,.07)}
    if(s%64===63)MUS.motif=MUS.motif.map(d=>mrand()<.25?Math.floor(mrand()*7)-1:d);
    MUS.next+=sp;MUS.step++}
}
setInterval(musTick,100);
addEventListener('keydown',e=>{if(e.key==='m'||e.key==='M'){save.music=save.music===false;persist();toast('Music '+(save.music===false?'off':'on'))}});


// ================= TUTORIAL =================
const TUT_TOUCH=matchMedia('(pointer:coarse)').matches;
const TUT=[
  {t:'Move',d:()=>TUT_TOUCH?'Drag the left side of the screen to walk.':'Hold right-click or use WASD to walk.',done:(G,s)=>Math.hypot(G.player.x-s.x0,G.player.y-s.y0)>140},
  {t:'Draw a weapon',d:()=>TUT_TOUCH?'Draw a short line on the right side: a Club appears.':'Left-drag a short line: a Club appears.',done:G=>G.creations.length>0},
  {t:'They fight for you',d:()=>'Weapons attack on their own and break with use. Draw a long line for a Spear, a circle for a Rock.',done:(G,s)=>s.tt>6},
  {t:'Dash',d:()=>TUT_TOUCH?'Double-tap to dash through danger.':'Press Space to dash through danger.',done:G=>G.player.dashCd>0},
  {t:'Survive',d:()=>'Collect gems to level up. Survive 10:00 and beat the final boss (or outlast it to 11:00) to clear the era. Good luck.',done:(G,s)=>s.tt>5},
];
runHooks.push(G=>{if(save.tutDone||G.daily){G.tut=null;return}G.tut={i:0,tt:0,x0:G.player.x,y0:G.player.y};G.diffDef={...G.diffDef,spawn:G.diffDef.spawn*.35}});
function tutRender(){let el=$('tut');const G_=G;
  if(mode!=='run'||!G_||!G_.tut||G_.paused){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='tut';document.body.appendChild(el)}
  const s=G_.tut,st=TUT[s.i];const h=`<span class="lab">Tutorial &middot; ${s.i+1} / ${TUT.length}</span><b>${st.t}</b><p>${st.d()}</p><button id="tutSkip" class="lab">Skip</button>`;
  if(el.dataset.i!=String(s.i)){el.innerHTML=h;el.dataset.i=s.i;$('tutSkip').onclick=tutEnd}}
function tutEnd(){if(G&&G.tut){G.tut=null;G.diffDef={...G.diffDef,spawn:G.diffDef.spawn/.35}}save.tutDone=true;persist();const el=$('tut');if(el)el.remove()}
const _updT=updatePickups;updatePickups=function(dt){_updT(dt);const s=G&&G.tut;if(!s)return;s.tt+=dt;
  if(TUT[s.i].done(G,s)){s.i++;s.tt=0;sfx('pick');haptic(15);if(s.i>=TUT.length){tutEnd();toast('Tutorial complete')}}};
setInterval(tutRender,120);
function tutorial(){save.tutDone=false;persist();startRun()}
hub('tutorial','Tutorial',tutorial);


// ================= KEYBOARD =================
function navButtons(){return [...screenEl.querySelectorAll('button:not([disabled]),[data-m],input[type=range]')].filter(b=>b.offsetParent!==null)}
addEventListener('keydown',e=>{
  if(e.repeat&&(e.key==='Escape'||e.key==='p'||e.key==='P'))return;
  const k=e.key,inRun=mode==='run'&&G,modal=screenEl.querySelector('.pick')||$('rok');
  if(k==='Escape'||((k==='p'||k==='P')&&inRun)){
    if(inRun){
      if(modal)return; // never skip a level-up or chest choice
      if(screenEl.classList.contains('live')&&$('back')){e.preventDefault();$('back').click();return}
      if(!G.paused||$('resume')){e.preventDefault();togglePause();return}
      return}
    if(k==='Escape'&&screenEl.innerHTML){const b=$('back')||$('hm');if(b){e.preventDefault();b.click()}else if(location.hash!=='#/home')home()}
    return}
  // number keys pick level-up cards
  if(/^[1-9]$/.test(k)&&inRun){const c=screenEl.querySelector(`.pick[data-i="${+k-1}"]`);if(c){e.preventDefault();c.click();return}}
  if(!screenEl.innerHTML)return;
  const act=document.activeElement,btns=navButtons();if(!btns.length)return;
  if(k==='Enter'&&(!act||!screenEl.contains(act))){const pri=$('rok')&&!$('rok').disabled?$('rok'):screenEl.querySelector('.btn.pri,#resume,#play,#retry,.menu button');if(pri){e.preventDefault();pri.click()}return}
  const isRange=act&&act.type==='range';
  const dir={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[k];
  if(dir&&!(isRange&&(k==='ArrowLeft'||k==='ArrowRight'))){e.preventDefault();let i=btns.indexOf(act);i=i<0?(dir>0?0:btns.length-1):(i+dir+btns.length)%btns.length;btns[i].focus()}
});


// ================= LOOT VISIBILITY =================
const LOOT_COL={chest:'#ffd34a',magnet:'#ff6a5a',meat:'#8fe07a',bomb:'#ffb13a'};
const HI={};function hiSpr(key,src,col){return HI[key]||(HI[key]=outline(src,col))}
// timed map chests + champions (glowing elites that always drop a chest)
const _updL=updatePickups;updatePickups=function(dt){_updL(dt);if(mode!=='run'||!G)return;const p=G.player;
  G.mapChestT-=dt;if(G.mapChestT<=0){G.mapChestT=150+Math.random()*40;if(!chestOk())return;const a=Math.random()*6.283,d=200+Math.random()*120;G.chests.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d});toast('A chest appeared nearby')}
  G.lootFx=(G.lootFx||0)-dt;if(G.lootFx<=0){G.lootFx=.12;const all=[...G.chests,...G.pickups];if(all.length){const o=all[Math.floor(Math.random()*all.length)];G.fx.push({x:o.x+rnd(-10,10),y:o.y-rnd(4,22),vx:0,vy:-20,life:.6,max:.6,col:'#fff6c8',r:1.5})}}};
const _spE=spawnEnemy;spawnEnemy=function(){const e=_spE.apply(this,arguments);
  if(e&&e.T&&!e.T.boss&&!e.T.elite&&G.t>90&&Math.random()<.0025){e.champ=true;e.hp*=6;if(e.maxHp)e.maxHp*=6;if(e.hpMax)e.hpMax*=6}return e};
function drawLootTop(){if(!G)return;const t=G.t,pulse=.5+.5*Math.sin(t*5);
  const items=[...G.chests.map(c=>({o:c,k:'chest',spr:SPR.chest})),...(G.pickups||[]).map(k=>({o:k,k:k.type,spr:SPR.pick[k.type]}))];
  for(const it of items){const o=it.o,col=LOOT_COL[it.k];if(it.k!=='chest'&&o.t>54&&(Math.floor(o.t*8)&1))continue;
    const sx=X(o.x),sy=Y(o.y)-6,bob=Math.round(Math.sin(t*4+o.x)*1.5);
    bx.globalCompositeOperation='lighter';
    for(const [r,a] of [[14,.10],[10,.14],[6,.2]]){bx.globalAlpha=a*(.6+.6*pulse);bx.fillStyle=col;bx.beginPath();bx.arc(sx,sy+bob,r+pulse*2,0,6.283);bx.fill()}
    bx.globalCompositeOperation='source-over';bx.globalAlpha=1;
    const hs=hiSpr(it.k,it.spr,'#fff6d8');bx.drawImage(hs,sx-(hs.width>>1),Y(o.y)-hs.height+bob);
    // off-screen arrow
    const m=6;if(sx<m||sx>BW-m||sy<m||sy>BH-m){const cx=BW/2,cy=BH/2,ang=Math.atan2(sy-cy,sx-cx);const ax=Math.max(m,Math.min(BW-m,sx)),ay=Math.max(m+8,Math.min(BH-m-14,sy));
      bx.save();bx.translate(Math.round(ax),Math.round(ay));bx.rotate(ang);bx.globalAlpha=.75+.25*pulse;bx.fillStyle='#1a0f0e';bx.beginPath();bx.moveTo(6,0);bx.lineTo(-4,-5);bx.lineTo(-4,5);bx.fill();bx.fillStyle=col;bx.beginPath();bx.moveTo(5,0);bx.lineTo(-3,-3.5);bx.lineTo(-3,3.5);bx.fill();bx.restore();bx.globalAlpha=1}}
  // champions glow + breakables stay readable in the dark
  for(const e of G.enemies)if(e.champ){bx.globalCompositeOperation='lighter';bx.globalAlpha=.18+.12*pulse;bx.fillStyle='#ffd34a';bx.beginPath();bx.arc(X(e.x),Y(e.y)-6,12,0,6.283);bx.fill();bx.globalCompositeOperation='source-over';bx.globalAlpha=1}
  if(G.props)for(const k of G.props){const sx=X(k.x),sy=Y(k.y);if(sx<-10||sx>BW+10||sy<-10||sy>BH+20)continue;
    const fl=k.type==='torch'?.7+.3*Math.sin(t*17+k.x)*Math.sin(t*7):1;
    if(k.type==='torch'){bx.globalCompositeOperation='lighter';for(const [r,a] of [[16,.07],[10,.12],[5,.25]]){bx.globalAlpha=a*fl;bx.fillStyle='#ff9a3a';bx.beginPath();bx.arc(sx,sy-15,r,0,6.283);bx.fill()}bx.globalCompositeOperation='source-over'}
    bx.globalAlpha=1;const hs=hiSpr('prop_'+k.type,SPR.prop[k.type],k.type==='torch'?'#ffcf7a':'#e8dcb8');bx.drawImage(hs,sx-(hs.width>>1),sy-hs.height+(k.cd>0?-1:0))}
  bx.globalAlpha=1;
}


// ================= DASH FIRE TRAIL (Flint Witch) =================
const _updF=updatePickups;updatePickups=function(dt){_updF(dt);if(mode!=='run'||!G)return;const p=G.player;if(!G.fire)G.fire=[];
  if(p.fireDash&&p.dashT>0){const l=G.fire[G.fire.length-1];if(!l||Math.hypot(l.x-p.x,l.y-p.y)>10)G.fire.push({x:p.x,y:p.y,life:1.4,tick:0})}
  for(let i=G.fire.length-1;i>=0;i--){const f=G.fire[i];f.life-=dt;f.tick-=dt;if(f.life<=0){G.fire.splice(i,1);continue}
    if(f.tick<=0){f.tick=.25;for(const e of queryGrid(f.x,f.y,22))if(e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<22)hurtEnemy(e,5*p.dmgMul)}
    if(Math.random()<.15)G.fx.push({x:f.x+rnd(-6,6),y:f.y-rnd(0,8),vx:0,vy:-30,life:.35,max:.35,col:Math.random()<.5?'#ffb13a':'#ff6a2a',r:1.5})}};
const _rndF=renderPickups;renderPickups=function(){if(G.fire)for(const f of G.fire){const sx=X(f.x),sy=Y(f.y),a=Math.min(1,f.life/.6);const fl=Math.floor(G.t*12+f.x)&1;
  bx.globalAlpha=.55*a;bx.fillStyle='#ff6a2a';bx.fillRect(sx-4,sy-2,8,3);bx.fillStyle=fl?'#ffd34a':'#ffb13a';bx.fillRect(sx-2,sy-3-fl,4,2);bx.globalAlpha=1}_rndF()};

