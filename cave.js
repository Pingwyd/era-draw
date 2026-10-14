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

// ---- shrines: stand inside the ring for 2.5s to receive a blessing ----
const SHRINES={
  fury:{name:'Shrine of Fury',col:'#ff6a3c',desc:'+35% damage for 20s',fn:G=>addBuff('fury',20)},
  wind:{name:'Shrine of Wind',col:'#9fe0ff',desc:'+30% speed for 20s',fn:G=>{if(!hasBuff('wind'))G.player.speed*=1.3;addBuff('wind',20)}},
  mend:{name:'Shrine of Mending',col:'#8fe07a',desc:'Heal 50%',fn:G=>{const p=G.player;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.5)}},
  gather:{name:'Shrine of Gathering',col:'#ffd34a',desc:'All gems fly to you',fn:G=>{for(const o of G.orbs)o.pull=true}},
};
BUFF_END.wind=G=>{G.player.speed/=1.3};
DMG_MODS.push((e,d)=>hasBuff('fury')?d*1.35:d);
SPR.shrine=outline(grid(['..kkkk..','.kssssk.','.ksSSsk.','..kssk..','..ksSk..','..kssk..','..ksSk..','.kssssk.','kssSSssk','kkkkkkkk'],{...PAL,k:'#1a0f0e',s:'#8a8178',S:'#c8bfb2'}));
runHooks.push(G=>{G.shrines=[];G.shrineT=40;G.buffs={};G.quest=null;G.questT=25;G.relics={};G.relicPending=0;G.frenzy=null;G.boneUsed=false});
CAVE_TICK.push(dt=>{const p=G.player;G.shrineT-=dt;
  if(G.shrineT<=0&&G.shrines.length<2){G.shrineT=55+Math.random()*20;const ks=Object.keys(SHRINES),k=ks[Math.floor(Math.random()*ks.length)],a=Math.random()*6.283,d=180+Math.random()*120;G.shrines.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,k,prog:0,t:0});toast(SHRINES[k].name+' nearby')}
  for(let i=G.shrines.length-1;i>=0;i--){const s=G.shrines[i];s.t+=dt;const inR=Math.hypot(s.x-p.x,s.y-p.y)<42;s.prog=inR?s.prog+dt:Math.max(0,s.prog-dt*.5);
    if(s.prog>=2.5){SHRINES[s.k].fn(G);toast(SHRINES[s.k].name+': '+SHRINES[s.k].desc);ring(s.x,s.y,90,SHRINES[s.k].col);burst(s.x,s.y,SHRINES[s.k].col,30);sfx('chest');haptic([20,20,40]);G.shrines.splice(i,1);continue}
    if(s.t>75)G.shrines.splice(i,1)}});
const _cvRP=renderPickups;renderPickups=function(){if(G.shrines)for(const s of G.shrines){const sx=X(s.x),sy=Y(s.y),col=SHRINES[s.k].col;
  bx.fillStyle=col;bx.globalAlpha=.35;const r=Math.round(42/Z);for(let a=0;a<64;a++){if(a/64>s.prog/2.5&&a%2)continue;const an=a/64*6.283;bx.fillRect(Math.round(sx+Math.cos(an)*r),Math.round(sy+Math.sin(an)*r*.6),1,1)}
  bx.globalAlpha=1;shadow(s.x,s.y,7);blit(SPR.shrine,s.x,s.y)}_cvRP()};
const _cvTop=drawLootTop;drawLootTop=function(){_cvTop();if(!G||!G.shrines)return;const pulse=.5+.5*Math.sin(G.t*4);for(const s of G.shrines){const sx=X(s.x),sy=Y(s.y)-10;
  bx.globalCompositeOperation='lighter';bx.globalAlpha=.16+.12*pulse;bx.fillStyle=SHRINES[s.k].col;bx.beginPath();bx.arc(sx,sy,10+s.prog*3,0,6.283);bx.fill();bx.globalCompositeOperation='source-over';bx.globalAlpha=1;
  const hs=hiSpr('shrine',SPR.shrine,'#fff6d8');bx.drawImage(hs,sx-(hs.width>>1),Y(s.y)-hs.height);
  if(sx<6||sx>BW-6||sy<6||sy>BH-6){const ax=Math.max(8,Math.min(BW-8,sx)),ay=Math.max(14,Math.min(BH-16,sy));bx.fillStyle=SHRINES[s.k].col;bx.fillRect(ax-2,ay-2,4,4)}}};

// ---- mini-quests: a timed objective every ~75s; reward = chest + coins ----
const QUESTS=[
  {id:'cull',mk:G=>{const sp=G.era.spawns.filter(s=>s.from<=G.t);const t=sp[Math.floor(Math.random()*sp.length)].type;const n=t===G.era.swarm?30:12;return {txt:`Defeat ${n} ${ENEMY_TYPES[t].name}s`,type:t,n,c:0,time:60}},kill:(q,e)=>{if(e.type===q.type)q.c++}},
  {id:'untouched',mk:()=>({txt:'Take no damage for 30s',n:30,c:0,time:31,hit:false}),tick:(q,dt)=>{q.c=Math.min(q.n,q.c+dt)},hurt:q=>{q.fail=true}},
  {id:'vandal',mk:()=>({txt:'Break 4 torches, bushes or urns',n:4,c:0,time:60}),prop:q=>q.c++},
  {id:'artist',mk:()=>({txt:'Draw 6 weapons',n:6,c:0,time:45}),draw:q=>q.c++},
];
CAVE_TICK.push(dt=>{const q=G.quest;
  if(!q){G.questT-=dt;if(G.questT<=0){const Q=QUESTS[Math.floor(Math.random()*QUESTS.length)];G.quest={...Q.mk(G),def:Q};toast('Quest: '+G.quest.txt)}}
  else{q.time-=dt;if(q.def.tick)q.def.tick(q,dt);
    if(q.c>=q.n){G.quest=null;G.questT=70+Math.random()*20;const p=G.player;G.chests.push({x:p.x+40,y:p.y-30});G.bonus=(G.bonus||0)+20;toast('Quest complete! Chest + 20 coins');sfx('chest');haptic([20,30,20]);(save.stats.quests=(save.stats.quests||0)+1)}
    else if(q.time<=0||q.fail){G.quest=null;G.questT=60;toast('Quest failed')}}
  questHud()});
killHooks.push(e=>{if(G&&G.quest&&G.quest.def.kill)G.quest.def.kill(G.quest,e)});
const _cvHit=hitProp;hitProp=function(k){_cvHit(k);if(k.dead&&G.quest&&G.quest.def.prop)G.quest.def.prop(G.quest)};
const _cvDP2=damagePlayer;damagePlayer=function(d){if(G&&G.quest&&G.quest.def.hurt&&G.player.invul<=0)G.quest.def.hurt(G.quest);return _cvDP2(d)};
const _cvSp2=spawnCreation;spawnCreation=function(id,dir,echo){const r=_cvSp2.apply(this,arguments);if(!echo&&G&&G.quest&&G.quest.def.draw)G.quest.def.draw(G.quest);return r};
function questHud(){let el=$('quest');const q=G&&G.quest;if(!q||mode!=='run'){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='quest';$('hud').appendChild(el)}
  const txt=`<b>QUEST</b> ${q.txt} <i>${Math.floor(q.c)}/${q.n} &middot; ${Math.ceil(q.time)}s</i>`;if(el.innerHTML!==txt)el.innerHTML=txt}
