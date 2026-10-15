'use strict';
// ================= BUILD SYSTEM: 5 SKILLS + MINI POWER-UPS + TIMED POWER-UPS =================
// Skills: major abilities, max 5 different skills per run, each levels 1-5. Mini power-ups: small stat bumps, unlimited.
// Timed power-ups: map drops that last 1-10s.
const SKILL_SLOTS=5,SKILL_MAX=5;
const pc=v=>Math.round(v*100);
const L5=a=>lv=>a[Math.min(lv,a.length-1)];
const SKILLS=[
 {id:'echo',name:'Echo Stroke',icon:'echo',v:[.08,.12,.16,.2,.25],txt:v=>`${pc(v)}% chance a creation spawns twice`,set:(p,v)=>p.echo=v},
 {id:'homing',name:'Homing Will',icon:'homing',v:[1,1.6,2.2,2.8,3.4],txt:v=>`Projectiles home (strength ${v})`,set:(p,v)=>p.homing=v},
 {id:'focus',name:'Deep Focus',icon:'focus',v:[.2,.4,.6,.8,1],txt:v=>`+${v.toFixed(1)}s slow-mo while drawing`,set:(p,v,o)=>p.focus=Math.min(MAX_FOCUS+1,p.focus-(o||0)+v)},
 {id:'arm',name:'Third Hand',icon:'arm',v:[1,1,1,2,2],txt:v=>`+${v} melee creation${v>1?'s':''} at once`,set:(p,v,o)=>p.caps.melee=(p.caps.melee||1)-(o||0)+v},
 {id:'quiver',name:'Deep Quiver',icon:'quiver',v:[1,1,1,2,2],txt:v=>`+${v} ranged creation${v>1?'s':''} at once`,set:(p,v,o)=>p.caps.ranged=(p.caps.ranged||1)-(o||0)+v},
 {id:'shock',name:'Shock Dash',icon:'shock',v:[30,45,60,80,100],txt:v=>`Dashing releases a ${v}-damage shockwave`,set:(p,v)=>p.shockDash=v},
 {id:'precise',name:'Precision',icon:'precise',v:[.12,.24,.36,.48,.6],txt:v=>`Perfect draws hit ${pc(v)}% harder`,set:(p,v)=>p.precision=v},
 {id:'stand',name:'Last Stand',icon:'stand',v:[.4,.8,1.2,1.6,2],txt:v=>`Below 35% HP: +${pc(.15*v)}% damage, +${pc(.1*v)}% speed`,set:(p,v)=>p.lastStand=v},
 {id:'vamp',name:'Vampiric Ink',icon:'vamp',v:[.002,.004,.006,.008,.01],txt:v=>`Heal ${(v*100).toFixed(1)}% of damage dealt (max 1.5 HP/s)`,set:(p,v)=>p.vamp=v},
 {id:'thorns',name:'Bramble Robe',icon:'thorns',v:[12,24,36,48,60],txt:v=>`Enemies that hit you take ${v} damage`,set:(p,v)=>p.thorns=v},
 {id:'rush',name:'Kill Rush',icon:'rush',v:[.06,.12,.18,.24,.3],txt:v=>`Kills give +${pc(v)}% speed for 2s`,set:(p,v)=>p.rush=v},
 {id:'crit',name:'Lucky Stroke',icon:'crit',v:[.04,.08,.12,.16,.2],txt:v=>`${pc(v)}% chance to deal double damage`,set:(p,v)=>p.crit=v},
 {id:'exec',name:'Executioner',icon:'exec',v:[.1,.2,.3,.4,.5],txt:v=>`+${pc(v)}% damage to enemies under 30% HP`,set:(p,v)=>p.exec=v},
 {id:'slayer',name:'Giant Slayer',icon:'slayer',v:[.07,.14,.21,.28,.35],txt:v=>`+${pc(v)}% damage to bosses and elites`,set:(p,v)=>p.slayer=v},
 {id:'pierce',name:'Pierce Deep',icon:'pierce',v:[1,1,2,2,3],txt:v=>`Projectiles pierce +${v} more`,set:(p,v)=>p.pierceAdd=v},
 {id:'blast',name:'Blast Radius',icon:'blast',v:[.08,.16,.24,.32,.4],txt:v=>`+${pc(v)}% area of effect`,set:(p,v)=>p.aoeMul=1+v},
 {id:'wind',name:'Second Wind',icon:'wind',max:1,v:[1],txt:()=>`Once per run, survive a fatal hit at 1 HP`,set:p=>p.secondWind=true},
];
// minis: [id, name, icon, values common/rare/epic, text, apply]
const MV=(a,b,c)=>[a,b,c];
const MINIS=[
 ['ink','Sharper Ink','ink',MV(.04,.06,.09),v=>`+${pc(v)}% creation damage`,(p,v)=>p.dmgMul*=1+v],
 ['quick','Quick Sketch','quick',MV(.03,.05,.07),v=>`-${pc(v)}% cast cooldown`,(p,v)=>p.cdMul*=1-v],
 ['swift','Swift Step','swift',MV(.03,.04,.06),v=>`+${pc(v)}% move speed`,(p,v)=>p.speed*=1+v],
 ['iron','Iron Skin','iron',MV(.05,.08,.12),v=>`+${pc(v)}% max HP`,(p,v)=>{p.maxHp*=1+v;p.hp=Math.min(p.maxHp,p.hp*(1+v))}],
 ['magnet','Pickup Magnet','magnet',MV(.12,.18,.25),v=>`+${pc(v)}% pickup range`,(p,v)=>p.magnet*=1+v],
 ['heavy','Heavy Hand','heavy',MV(.06,.09,.13),v=>`+${pc(v)}% creation durability`,(p,v)=>p.durMul*=1+v],
 ['coin','Coin Sense','coin',MV(.08,.12,.16),v=>`+${pc(v)}% coins this run`,(p,v)=>p.coinMul*=1+v],
 ['whet','Whetstone','whet',MV(.05,.07,.1),v=>`+${pc(v)}% melee damage`,(p,v)=>p.meleeMul=(p.meleeMul||1)*(1+v)],
 ['fletch','Fletching','fletch',MV(.05,.07,.1),v=>`+${pc(v)}% ranged & area damage`,(p,v)=>p.rangedMul=(p.rangedMul||1)*(1+v)],
 ['hide','Thick Hide','hide',MV(.03,.04,.06),v=>`-${pc(v)}% damage taken`,(p,v)=>p.armor=Math.max(.6,(p.armor||1)*(1-v))],
 ['regrow','Regrowth','regrow',MV(.08,.12,.2),v=>`+${v.toFixed(2)} HP regen per second`,(p,v)=>p.regen=Math.min(1.2,(p.regen||0)+v)],
 ['longshot','Long Shot','longshot',MV(.05,.07,.1),v=>`+${pc(v)}% projectile speed & reach`,(p,v)=>p.reach=(p.reach||1)*(1+v)],
 ['hunger','Gem Hunger','hunger',MV(.03,.05,.07),v=>`+${pc(v)}% XP from gems`,(p,v)=>p.xpMul=(p.xpMul||1)*(1+v)],
 ['reservoir','Ink Reservoir','heavy',MV(.02,.03,.04),v=>`+${pc(v)}% damage and +${pc(v*2)}% durability`,(p,v)=>{p.dmgMul*=1+v;p.durMul*=1+v*2}],
 ['nimble','Nimble','swift',MV(.025,.035,.05),v=>`+${pc(v)}% speed and -${pc(v*.6)}% cast cooldown`,(p,v)=>{p.speed*=1+v;p.cdMul*=1-v*.6}],
 ['sturdy','Sturdy','iron',MV(8,12,18),v=>`+${v} max HP`,(p,v)=>{p.maxHp+=v;p.hp+=v*.5}],
 ['bandage','Bandage','regrow',MV(12,18,26),v=>`Heal ${v} HP now`,(p,v)=>p.hp=Math.min(p.maxHp,p.hp+v)],
 ['bead','Focus Bead','focus',MV(.06,.1,.15),v=>`+${v.toFixed(2)}s slow-mo`,(p,v)=>p.focus=Math.min(MAX_FOCUS+1,p.focus+v)],
 ['widenib','Wide Nib','blast',MV(.04,.06,.08),v=>`+${pc(v)}% area of effect`,(p,v)=>p.aoeMul=(p.aoeMul||1)*(1+v)],
 ['keen','Keen Eye','crit',MV(.01,.015,.02),v=>`+${(v*100).toFixed(1)}% crit chance`,(p,v)=>p.crit=Math.min(.45,(p.crit||0)+v)],
 ['luckycoin','Lucky Coin','coin',MV(.05,.07,.1),v=>`+${pc(v)}% coins and +${pc(v/2)}% XP`,(p,v)=>{p.coinMul*=1+v;p.xpMul=(p.xpMul||1)*(1+v/2)}],
 ['tough','Tough Ink','heavy',MV(.05,.07,.1),v=>`+${pc(v)}% durability and +${pc(v/2)}% damage`,(p,v)=>{p.durMul*=1+v;p.dmgMul*=1+v/2}],
 ['brisk','Brisk Pace','swift',MV(.02,.03,.045),v=>`+${pc(v)}% speed and +${pc(v*2)}% pickup range`,(p,v)=>{p.speed*=1+v;p.magnet*=1+v*2}],
 ['arcane','Arcane Spark','ink',MV(.06,.09,.13),v=>`+${pc(v)}% Mythic spell damage`,(p,v)=>p.mythMul=(p.mythMul||1)*(1+v)],
 ['hunter','Hunter','slayer',MV(.04,.06,.08),v=>`+${pc(v)}% damage to bosses and elites`,(p,v)=>p.slayer=(p.slayer||0)+v],
 ['edge','Cruel Edge','exec',MV(.04,.06,.08),v=>`+${pc(v)}% damage to enemies under 30% HP`,(p,v)=>p.exec=(p.exec||0)+v],
 ['bulwark','Bulwark','hide',MV(.02,.03,.04),v=>`-${pc(v)}% damage taken and +${Math.round(v*150)} max HP`,(p,v)=>{p.armor=Math.max(.6,(p.armor||1)*(1-v));p.maxHp+=v*150}],
 ['sprint','Sprinter','rush',MV(.15,.2,.3),v=>`Dash recharges ${pc(v)}% faster`,(p,v)=>p.dashCdMul=(p.dashCdMul||1)/(1+v)],
 ['gemsight','Gem Sight','hunger',MV(.08,.12,.18),v=>`+${pc(v)}% pickup range and +${pc(v/4)}% XP`,(p,v)=>{p.magnet*=1+v;p.xpMul=(p.xpMul||1)*(1+v/4)}],
 ['spite','Spite','thorns',MV(4,6,9),v=>`Enemies that hit you take +${v} damage`,(p,v)=>p.thorns=(p.thorns||0)+v],
];
// rebuild POWERUPS so every system that reads it (pause build, evolutions, chest icons) sees the new catalogue
POWERUPS.length=0;
for(const s of SKILLS){const max=s.max||SKILL_MAX;POWERUPS.push({id:s.id,name:s.name,kind:'skill',base:'epic',max,v:s.v,
  desc:lv=>s.txt(L5(s.v)(lv)),apply:(p,lv)=>s.set(p,L5(s.v)(lv),lv>0?L5(s.v)(lv-1):0)});if(!ICON['pu_'+s.id])ICON['pu_'+s.id]=ICON['pu_'+s.icon]||ICON.pu_ink}
for(const [id,name,icon,vals,txt,ap] of MINIS){POWERUPS.push({id,name,kind:'mini',base:'common',v:vals,desc:r=>txt(vals[r]),apply:(p,r)=>ap(p,vals[r])});if(!ICON['pu_'+id])ICON['pu_'+id]=ICON['pu_'+icon]||ICON.pu_ink}
const PU=id=>POWERUPS.find(p=>p.id===id);
const skillsOwned=()=>POWERUPS.filter(p=>p.kind==='skill'&&G.picks[p.id]);
// ---- offers ----
runHooks.push(G=>{G.cardW={};G.cardBlock=null});
const miniW=pu=>(G.cardW[pu.id]!=null?G.cardW[pu.id]:1);
function pickW(list,w){let t=0;for(const x of list)t+=w(x);let r=Math.random()*t;for(const x of list){r-=w(x);if(r<=0)return x}return list[0]}
rollPicks=function(){const out=[];const own=skillsOwned();
  const skillPool=POWERUPS.filter(p=>p.kind==='skill'&&p.id!==G.cardBlock&&(G.picks[p.id]||0)<p.max&&(G.picks[p.id]||own.length<SKILL_SLOTS));
  const miniPool=POWERUPS.filter(p=>p.kind==='mini'&&p.id!==G.cardBlock);
  const nSkill=skillPool.length?(Math.random()<.75?1:0)+(Math.random()<.3?1:0):0;
  for(let i=0;i<Math.min(nSkill,skillPool.length);i++){const c=skillPool.filter(p=>!out.some(o=>o.pu===p));if(!c.length)break;
    const pu=pickW(c,p=>(G.picks[p.id]?2.2:1)*(p.id==='wind'?.3:1));out.push({pu,r:G.picks[pu.id]||0})}
  while(out.length<3){const c=miniPool.filter(p=>!out.some(o=>o.pu===p));if(!c.length)break;out.push({pu:pickW(c,miniW),r:rollRarity(true)})}
  return out};
function cardHtml(k,i){const pu=k.pu,own=G.picks[pu.id]||0,sk=pu.kind==='skill';
  const tag=sk?(own?`SKILL LV ${own+1}/${pu.max}`:`NEW SKILL ${skillsOwned().length+1}/${SKILL_SLOTS}`):'MINI';
  return `<button class="pick ${sk?'skill':'r-'+RAR[k.r]}" data-i="${i}"><span class="pk-top"><span class="ic"><img src="${ICON['pu_'+pu.id]}" alt=""></span><span class="lvtag">${tag}</span></span>
   <span class="pk-name">${pu.name}</span><span class="pk-rar">${sk?'skill':RAR[k.r]}</span><span class="pk-desc">${pu.desc(k.r)}</span></button>`}
function takeCard(k,fromLevel){k.pu.apply(G.player,k.r);G.picks[k.pu.id]=(G.picks[k.pu.id]||0)+1;
  if(k.pu.kind==='mini'){G.cardW[k.pu.id]=Math.max(.15,miniW(k.pu)*.5)}if(fromLevel)G.cardBlock=k.pu.id}
levelUp=function(fromChest){
  G.paused=true;stick.id=null;stick.active=false;G.drawing=null;
  const picks=rollPicks();G.cardBlock=null;sfx(fromChest?'chest':'lvl');haptic([20,40,20]);
  show(`<div class="sheet lv"><header class="row"><span class="lab">${fromChest?'Chest opened':'Level up'} &middot; skills ${skillsOwned().length}/${SKILL_SLOTS}</span><span class="lab">Choose one &middot; arrows + Enter</span></header>
   <h2 class="disp">${fromChest?'Treasure':'Level '+G.level}</h2><div class="picks">${picks.map(cardHtml).join('')}</div></div>`);
  const els=[...screenEl.querySelectorAll('.pick')];
  els.forEach(el=>el.onclick=()=>{const k=picks[+el.dataset.i];takeCard(k,!fromChest);sfx('pick');show('');G.paused=false;last=performance.now()});
  setTimeout(()=>els[0]&&els[0].focus(),40)};
// chest roulette rewards: minis (+ an upgrade of an owned skill on boss chests)
window.chestPool=()=>POWERUPS.filter(p=>p.kind==='mini');
window.chestSkill=()=>{const s=skillsOwned().filter(p=>(G.picks[p.id]||0)<p.max);return s.length?s[Math.floor(Math.random()*s.length)]:null};
window.takeCard=takeCard;

// ---- pause screen build: tap a card for a popup with per-level stats ----
function buildInfo(id){const pu=PU(id);if(!pu)return;const own=G.picks[id]||0;let rows;
  if(pu.kind==='skill')rows=Array.from({length:pu.max},(_,i)=>`<li class="${i<own?'on':''}"><span>Level ${i+1}</span><em>${pu.desc(i)}</em></li>`).join('');
  else rows=[0,1,2].map(r=>`<li><span>${RAR[r]}</span><em>${pu.desc(r)}</em></li>`).join('');
  let pop=$('bpop');if(!pop){pop=document.createElement('div');pop.id='bpop';screenEl.appendChild(pop)}
  pop.innerHTML=`<div class="bp-h"><img src="${ICON['pu_'+id]}" alt=""><b>${pu.name}</b><i>${pu.kind==='skill'?'Skill · level '+own+'/'+pu.max:'Mini power-up · taken '+own+'x'}</i></div><ul class="stats">${rows}</ul><button class="btn" id="bpx">Close</button>`;
  pop.classList.add('show');$('bpx').onclick=()=>pop.remove();setTimeout(()=>$('bpx')&&$('bpx').focus(),20)}
const _bsPause=pauseMenu;pauseMenu=function(){_bsPause();const ul=screenEl.querySelector('.build');if(!ul)return;
  const ids=Object.keys(G.picks).sort((a,b)=>(PU(a)&&PU(a).kind==='skill'?0:1)-(PU(b)&&PU(b).kind==='skill'?0:1));
  ul.innerHTML=ids.length?ids.map(id=>{const pu=PU(id);if(!pu)return '';return `<li><button class="bitem ${pu.kind}" data-b="${id}"><img src="${ICON['pu_'+id]}" alt=""><span>${pu.name}</span><em>${pu.kind==='skill'?'LV '+G.picks[id]+'/'+pu.max:'x'+G.picks[id]}</em></button></li>`}).join(''):'<li class="mute">No upgrades yet</li>';
  ul.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>buildInfo(b.dataset.b))};

// ---- timed mini power-ups (map drops, 1-10s) ----
const TIMED={
 haste:{name:'Haste',t:6,col:'#9fe0ff',desc:'+40% speed',on:G=>{if(!hasBuff('t_haste'))G.player.speed*=1.4},off:G=>G.player.speed/=1.4},
 frenzy:{name:'Ink Frenzy',t:6,col:'#ff9a3c',desc:'casts recharge twice as fast'},
 shell:{name:'Paper Shell',t:4,col:'#efe6d2',desc:'-60% damage taken'},
 over:{name:'Overcharge',t:8,col:'#ff5a4a',desc:'+50% damage'},
 pulse:{name:'Gem Pulse',t:1,col:'#5ac8ff',desc:'pulls gems within 700',on:G=>{const p=G.player;for(const o of G.orbs)if(Math.hypot(o.x-p.x,o.y-p.y)<700)o.pull=true}},
 slip:{name:'Time Slip',t:3,col:'#c48cff',desc:'enemies move at half speed'},
 twin:{name:'Twin Cast',t:10,col:'#ffe08a',desc:'every draw is cast twice'},
};
const TIMED_ART=['.kkkk.','kyyyyk','kyYYyk','kyYYyk','kyyyyk','.kkkk.'];
for(const k in TIMED){const t=TIMED[k];SPR.pick['t_'+k]=outline(grid(TIMED_ART,{...PAL,k:'#1a0f0e',y:t.col,Y:'#ffffff'}));
  PICKUPS['t_'+k]={name:t.name,w:0,fn:G=>{if(t.on)t.on(G);addBuff('t_'+k,t.t);toast(t.name+': '+t.desc+' ('+t.t+'s)');sfx('chest')}};if(t.off)BUFF_END['t_'+k]=t.off}
function dropTimed(x,y){const ks=Object.keys(TIMED);dropPickup(x,y,'t_'+ks[Math.floor(Math.random()*ks.length)])}
killHooks.push(e=>{if(!G||G.netClient)return;const ch=e.T.boss?1:(e.T.elite||e.champ)?.18:.006;if(Math.random()<ch)dropTimed(e.x+rnd(-10,10),e.y+rnd(-10,10))});
DMG_MODS.push((e,d)=>hasBuff('t_over')?d*1.5:d);
CAVE_TICK.push(dt=>{if(hasBuff('t_frenzy'))G.castCd-=dt;if(hasBuff('t_slip'))for(const e of G.enemies)e.slow=Math.max(e.slow||0,.15);});
const _bsDP=damagePlayer;damagePlayer=function(d){return _bsDP(hasBuff('t_shell')?d*.4:d)};
const _bsSC=spawnCreation;spawnCreation=function(id,dir,echo,power){const r=_bsSC(id,dir,echo,power);if(!echo&&G&&hasBuff('t_twin'))setTimeout(()=>G&&_bsSC(id,(dir||0)+.35,true,power),120);return r};
// HUD chips for active timed buffs
setInterval(()=>{let el=$('tbuffs');if(mode!=='run'||!G){if(el)el.innerHTML='';return}if(!el){el=document.createElement('div');el.id='tbuffs';document.body.appendChild(el)}
  el.innerHTML=Object.keys(TIMED).filter(k=>hasBuff('t_'+k)).map(k=>`<span style="border-color:${TIMED[k].col};color:${TIMED[k].col}">${TIMED[k].name} ${Math.ceil(G.buffs['t_'+k])}s</span>`).join('')},200);
