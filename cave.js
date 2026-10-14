'use strict';
// ================= UPDATE: CAVE PAINTINGS =================
// ---- shared helpers ----
const BUFFS={};// G.buffs[id]=seconds left
function addBuff(id,t){G.buffs=G.buffs||{};G.buffs[id]=Math.max(G.buffs[id]||0,t)}
function hasBuff(id){return G&&G.buffs&&G.buffs[id]>0}
function modal(html,onPick){G.paused=true;stick.id=null;stick.active=false;G.drawing=null;show(html);
  screenEl.querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{onPick(+el.dataset.i);show('');G.paused=false;last=performance.now()})}
function pickCards(title,lab,items){return `<div class="sheet lv"><header class="row"><span class="lab">${lab}</span><span class="lab">Choose one &middot; 1-${items.length}</span></header><h2 class="disp">${title}</h2>
  <div class="picks">${items.map((k,i)=>`<button class="pick r-${k.rar||'rare'}" data-i="${i}"><span class="pk-top"><span class="ic">${k.ic?`<img src="${k.ic}" alt="">`:''}</span><span class="lvtag">${k.tag||''}</span></span><span class="pk-name">${k.name}</span><span class="pk-rar">${k.sub||''}</span><span class="pk-desc">${k.desc}</span></button>`).join('')}</div></div>`}
const _cvUpd=updatePickups;updatePickups=function(dt){_cvUpd(dt);if(mode!=='run'||!G)return;if(G.buffs)for(const k in G.buffs)if(G.buffs[k]>0){G.buffs[k]-=dt;if(G.buffs[k]<=0&&BUFF_END[k])BUFF_END[k](G)}for(const f of CAVE_TICK)f(dt)};
const CAVE_TICK=[],BUFF_END={};

// ---- weapon affinity frenzy: same shape 3x within 8s => 6s frenzy for that shape ----
const _cvSpawn=spawnCreation;spawnCreation=function(id,dir,echo,power){const r=_cvSpawn.apply(this,arguments);
  if(!echo&&G&&CREATIONS[id]){const key=CREATIONS[id].shapeKey||id;G.shapeLog=(G.shapeLog||[]).filter(s=>G.t-s.t<8);G.shapeLog.push({key,t:G.t});
    if(G.shapeLog.filter(s=>s.key===key).length>=3&&!(G.frenzy&&G.frenzy.t>0&&G.frenzy.key===key)){G.frenzy={key,t:6,name:CREATIONS[id].name};G.shapeLog=[];
      toast('FRENZY: '+CREATIONS[id].name+' +40% damage');floatText(G.player.x,G.player.y-70,'FRENZY','#ff6a3c',1.4,18);sfx('chest');haptic([15,20,15]);G.shake=6}
    if(G.relics&&G.relics.twin&&Math.random()<.3)_cvSpawn(id,(dir||0)+.8,true,power)}
  return r};
DMG_MODS.push((e,d,src,from)=>{if(G.frenzy&&G.frenzy.t>0&&from&&from.def&&(from.def.shapeKey||from.id)===G.frenzy.key)d*=1.4;return d});
CAVE_TICK.push(dt=>{if(G.frenzy&&G.frenzy.t>0){G.frenzy.t-=dt;if(Math.random()<.4){const cs=G.creations.filter(c=>(c.def.shapeKey||c.id)===G.frenzy.key);const c=cs[Math.floor(Math.random()*cs.length)];if(c)G.fx.push({x:c.x+rnd(-6,6),y:c.y-rnd(0,12),vx:0,vy:-40,life:.4,max:.4,col:'#ff6a3c',r:2})}}});

// ---- relics: bosses drop a rule-changing relic (choose 1 of 3) ----
const RELICS={
  bloodstone:{name:'Bloodstone',desc:'Every kill heals 1 HP.'},
  ember:{name:'Ember Heart',desc:'Kills have a 25% chance to burst into flame (AoE).'},
  twin:{name:'Twin Quill',desc:'30% chance each draw also sketches a free copy.'},
  heavy:{name:'Heavy Ink',desc:'+50% damage, but -20% move speed.',apply:G=>{G.player.dmgMul*=1.5;G.player.speed*=.8}},
  glass:{name:'Glass Nib',desc:'+80% damage, but max HP is cut to 60%.',apply:G=>{G.player.maxHp=Math.round(G.player.maxHp*.6);G.player.hp=Math.min(G.player.hp,G.player.maxHp)},dmg:1.8},
  lodestone:{name:'Lodestone',desc:'Double pickup magnet; gems always drift to you.',apply:G=>{G.player.magnet*=2}},
  hourglass:{name:'Hourglass',desc:'+1.0s slow-mo focus, and focus refills twice as fast.',apply:G=>{G.player.focus+=1}},
  bone:{name:'Ancestor Bone',desc:'Weapons last 50% longer; your first death each boss fight is cheated.',apply:G=>{G.player.durMul*=1.5}},
};
const RELIC_ART=['..kkkk..','.kyyyyk.','kyYyyYyk','kyyYYyyk','kyyYYyyk','kyYyyYyk','.kyyyyk.','..kkkk..'];
SPR.relic=outline(grid(RELIC_ART,{...PAL,k:'#1a0f0e',y:'#c48cff',Y:'#fff0ff'}));ICON.relic=iconURL(SPR.relic,4);
DMG_MODS.push((e,d)=>G.relics&&G.relics.glass?d*RELICS.glass.dmg:d);
killHooks.push(e=>{if(!G)return;const p=G.player;
  if(G.relics&&G.relics.bloodstone)p.hp=Math.min(p.maxHp,p.hp+1);
  if(G.relics&&G.relics.ember&&Math.random()<.25){ring(e.x,e.y,50,'#ff6a2a');burst(e.x,e.y,'#ff9a3a',8);const near=queryGrid(e.x,e.y,50);setTimeout(()=>{if(G)for(const o of near)if(o!==e&&o.hp>0&&Math.hypot(o.x-e.x,o.y-e.y)<50)hurtEnemy(o,12*p.dmgMul,'fire')},0)}
  if(e.T.boss)G.relicPending=(G.relicPending||0)+1});
function offerRelic(){const own=G.relics||(G.relics={});const pool=Object.keys(RELICS).filter(k=>!own[k]);if(!pool.length)return;
  const picks=[];while(picks.length<Math.min(3,pool.length)){const k=pool[Math.floor(Math.random()*pool.length)];if(!picks.includes(k))picks.push(k)}
  sfx('chest');haptic([30,30,60]);
  modal(pickCards('Relic','Boss relic &middot; changes the rules',picks.map(k=>({name:RELICS[k].name,desc:RELICS[k].desc,ic:ICON.relic,rar:'epic',sub:'relic'}))),i=>{const k=picks[i];own[k]=true;if(RELICS[k].apply)RELICS[k].apply(G);toast('Relic: '+RELICS[k].name);(save.relicsSeen||(save.relicsSeen={}))[k]=1;persist()})}
CAVE_TICK.push(()=>{if(G.relicPending>0&&!G.paused&&!screenEl.innerHTML){G.relicPending--;offerRelic()}});
// ancestor bone: cheat death once per boss alive
const _cvDmgP=damagePlayer;damagePlayer=function(d){if(G&&G.relics&&G.relics.bone&&G.player.hp-d<=0&&G.enemies.some(e=>e.T.boss)&&!G.boneUsed){G.boneUsed=true;G.player.hp=1;G.player.invul=1.5;toast('Ancestor Bone!');return}G.dmgTaken=G.t;return _cvDmgP(d)};
