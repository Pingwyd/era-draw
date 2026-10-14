'use strict';
// ================= UPDATE: MYTHIC =================
// ---- the Mythic era ----
ERA_ORDER.push('mythic');
ERAS.mythic={name:'Mythic Age',durability:2.8,enemyHp:3.0,enemyDmg:2.2,ground:'#1d1830',ink:'#e0b0ff',date:'before time',no:'IV',
  spawns:[{type:'wisp',from:0,w:40},{type:'wraith',from:20,w:16},{type:'golem',from:60,w:8},{type:'hydra',from:110,w:5}],
  bosses:bossTable([[180,'cyclops'],[300,'hydraking'],[450,'gorgon'],[600,'aeon']]),
  swarm:'wisp',flock:'wraith',tile:'mythic',decor:'mythic',music:'mythic',lore:'The age before ages, where every drawn line is a spell.'};
Object.assign(PAL,{V:'#e0b0ff',X:'#6a4a9a',Y:'#fff0ff'});
SPR.tiles.mythic=makeTile(91,'#221b38',['#2a2244','#1c1630','#30264e','#191428'],'#4a3a78');
SPR.decos.mythic={rock1:outline(grid(['..VV..','.VYYV.','VYVVYV','.VVVV.']),'#1a0f0e'),rock2:outline(grid(['.XX.','XVVX','XXXX']),'#1a0f0e'),
  bones:outline(grid(['.t.','ttt','.t.','.t.','.t.','ttt']),'#1a0f0e'),skull:outline(grid(['.VV.','VYYV','VVVV','.VV.']),'#1a0f0e'),
  fern:grid(['..V..','.VYV.','..V..']),grass:grid(['.X..X.','.X.XV.','VX.V.X']),flower:grid(['.Y.','YVY','.X.'])};
SPR.dirts.mythic=SPR.dirt;ERA_PROPS.mythic=['torch','urn'];
ERA_MUSIC.mythic={bpm:84,root:116,scale:[0,2,4,7,9,11],lead:'sine',bass:'triangle',drum:'x.......x...x...',hat:'....x.......x...',prog:[0,4,5,3]};
// ---- mythic enemies ----
SPR.en.wisp=tintSet(SPR.en.insect,'#e0b0ff',.7);
SPR.en.wraith=tintSet(SPR.en.caveman,'#c8d8ff',.75);
SPR.en.golem=bigSet(tintSet(SPR.en.colossus,'#6a5a7a',.55),.8);
SPR.en.hydra=tintSet(bigSet(SPR.en.saber,1.2),'#3fae7a',.55);
SPR.en.cyclops=bigSet(tintSet(SPR.en.caveman,'#a14d9c',.4),2.1);
SPR.en.hydraking=bigSet(tintSet(SPR.en.saber,'#2e8a5e',.55),2.2);
SPR.en.gorgon=bigSet(tintSet(SPR.en.shaman,'#5fd36a',.45),1.6);
SPR.en.aeon=bigSet(tintSet(SPR.en.colossus,'#fff0ff',.55),1.7);
Object.assign(EN_SCALE,{wisp:1,wraith:.85,golem:.8,hydra:1,cyclops:1,hydraking:1,gorgon:1,aeon:1.1});
Object.assign(ENEMY_TYPES,{
  wisp:{name:'Ink Wisp',spr:'wisp',r:7,hp:20,speed:110,dmg:10,xp:1,col:'#e0b0ff',beh:'swarm',mat:'bone',lore:'Spilled ink that learned to want things.'},
  wraith:{name:'Wraith',spr:'wraith',r:11,hp:60,speed:84,dmg:18,xp:3,col:'#c8d8ff',beh:'lunge',mat:'hide',phase:true,lore:'Fades out of the page. Strike when it is solid.'},
  golem:{name:'Rune Golem',spr:'golem',r:16,hp:320,speed:34,dmg:30,xp:6,col:'#6a5a7a',beh:'chase',mat:'flint',armorRanged:.4,lore:'Arrows and stones bounce off its runes. Get close.'},
  hydra:{name:'Hydra Spawn',spr:'hydra',r:14,hp:180,speed:52,dmg:22,xp:5,col:'#3fae7a',beh:'charge',elite:true,mat:'hide',regen:12,lore:'Heals unless it burns. Cut one head, two remain.'},
  cyclops:{name:'Brontes',title:'The Cyclops Smith',spr:'cyclops',r:24,hp:5600,speed:42,dmg:48,xp:150,col:'#a14d9c',beh:'charge',boss:true,mat:'flint',lore:'Forged the first thunderbolt. Wants it back.'},
  hydraking:{name:'Lernaea',title:'Queen of Hydras',spr:'hydraking',r:26,hp:7600,speed:40,dmg:50,xp:180,col:'#2e8a5e',beh:'lunge',boss:true,mat:'hide',regen:40,summon:{type:'hydra',n:2,every:9},lore:'Burn the stumps.'},
  gorgon:{name:'Stheno',title:'The Gorgon',spr:'gorgon',r:22,hp:8400,speed:38,dmg:44,xp:200,col:'#5fd36a',beh:'shaman',boss:true,mat:'bone',gaze:true,lore:'Do not meet her eyes. Keep moving.'},
  aeon:{name:'Aeon',title:'The First Scribe',spr:'aeon',r:30,hp:16000,speed:36,dmg:64,xp:400,col:'#fff0ff',beh:'shaman',boss:true,mat:'bone',armor:.8,armorRanged:.8,summon:{type:'wraith',n:4,every:7},regen:20,lore:'Wrote the world. Would like to erase you from it.'},
});
// golem: ranged resistance; wraith: phases (immune while faded); hydra: regenerates unless burning
DMG_MODS.push((e,d,src)=>{if(e.T.armorRanged&&(src==='ranged'||src==='aoe'))d*=e.T.armorRanged;if(e.T.phase&&e.faded)return 0;return d});
CAVE_TICK.push(dt=>{for(const e of G.enemies){if(e.T.phase){e.phT=(e.phT==null?Math.random()*3:e.phT)+dt;e.faded=(e.phT%3)>2}
  if(e.T.regen&&!e.burn&&e.hp<e.maxHp)e.hp=Math.min(e.maxHp,e.hp+e.T.regen*dt*(1+G.t/600));
  if(e.T.gaze){e.gz=(e.gz||0)+dt;if(e.gz>6){e.gz=0;const p=G.player;if(!p.moving&&Math.hypot(p.x-e.x,p.y-e.y)<420){p.stoned=1.2;toast('Petrified! Keep moving near the Gorgon');}}}}
  const p=G.player;if(p.stoned>0){p.stoned-=dt;if(!p._spd){p._spd=p.speed;p.speed*=.15}}else if(p._spd){p.speed=p._spd;p._spd=0}});
const _myTop=drawLootTop;drawLootTop=function(){_myTop();if(!G)return;for(const e of G.enemies)if(e.T.phase&&e.faded){bx.globalAlpha=.55;bx.fillStyle='#1d1830';bx.beginPath();bx.arc(X(e.x),Y(e.y)-8,10,0,6.283);bx.fill();bx.globalAlpha=1}};
MAT_NAMES.bone=MAT_NAMES.bone||'Bone';

// ---- Mythic spells: in the Mythic Age, drawn shapes summon SPELLS. They are regular creations:
// same drawing, durability, melee/ranged caps, switch-shatter, loadout/shop, evolutions, combos and mastery.
// Older-era weapons still work here at reduced damage (OLD_ERA_DMG).
function nearestEnemy(x,y,r){let b=null,bd=r*r;for(const e of G.enemies){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;b=e}}return b}
Object.assign(CREATIONS,{
  arcblade:{name:'Arcane Blade',era:'mythic',shape:'short line',shapeKey:'short',kind:'melee',dmg:44,life:10,uses:50,rate:.36,range:80,knock:200,orbitSpeed:3.2,cost:900,arcane:true},
  lance:   {name:'Lightning Lance',era:'mythic',shape:'long line',shapeKey:'long',kind:'ranged',dmg:52,life:11,uses:18,rate:.75,speed:1100,pierce:12,proj:'spear',cost:950,shock:true},
  emberorb:{name:'Ember Orb',era:'mythic',shape:'circle',shapeKey:'circle',kind:'ranged',dmg:48,life:10,uses:14,rate:1.0,speed:420,aoe:110,proj:'rock',fire:true,cost:1000,burnHit:true},
  frostfan:{name:'Frost Fan',era:'mythic',shape:'V shape',shapeKey:'v',kind:'ranged',dmg:20,life:11,uses:44,rate:.3,speed:760,pierce:2,proj:'sling',multishot:3,cost:950,frost:true},
  chainspark:{name:'Chain Spark',era:'mythic',shape:'zigzag',shapeKey:'zig',kind:'melee',dmg:22,life:10,uses:70,rate:.2,range:58,knock:60,orbitSpeed:6,cost:950,chain:true},
});
SHAPE_KEY.arcblade='short';SHAPE_KEY.chainspark='zig';SHAPE_KEY.frostfan='v';
const MY='#e0b0ff';
SPR.arcblade=set(outline(grid(['..Y..','.YVY.','.YVY.','.YVY.','.YVY.','.YVY.','.YVY.','YXXXY','.XVX.','..X..']),'#1a0f0e',MY));
SPR.lance=set(outline(grid(['....Y','...YY','..YV.','.YV..','YV...','V....']),'#1a0f0e','#fff0a0'));
SPR.emberorb=set(outline(grid(['.ooo.','oOyOo','oyYyo','oOyOo','.ooo.']),'#1a0f0e','#ff8a3a'));
SPR.frostfan=set(outline(grid(['c...c','.c.c.','..c..','.cCc.','c.C.c']),'#1a0f0e','#9fe0ff'));
SPR.chainspark=set(outline(grid(['V...','.V..','..V.','.V..','V...','.V..','..V.']),'#1a0f0e',MY));
for(const id of ['arcblade','lance','emberorb','frostfan','chainspark'])ICON[id]=iconURL(SPR[id].r,3);
SHOP.push(...['arcblade','lance','emberorb','frostfan','chainspark'].map(id=>({id,type:'creation',cost:CREATIONS[id].cost,cur:'coins',era:'mythic'})));
Object.assign(SKETCH_LORE,{arcblade:'A short line, sharpened into pure intent.',lance:'A long line that remembers being lightning.',emberorb:'A circle that refuses to stop burning.',frostfan:'A V that opens like a cold wind.',chainspark:'A zigzag that jumps from foe to foe.'});
// spell effects ride on the shared damage pipeline
let CHAINING=false;
DMG_MODS.push((e,d,src,from)=>{const df=from&&from.def;if(!df||!d)return d;const p=G.player;
  if(df.era==='mythic'&&p.mythMul)d*=p.mythMul;
  if(df.frost){if(e.T.boss)e.slow=Math.max(e.slow||0,1.5);else if(Math.random()<.35)e.frozen=Math.max(e.frozen||0,1.2);else e.slow=Math.max(e.slow||0,2)}
  if(df.burnHit)e.burn={t:2.5,dps:Math.max(e.burn?e.burn.dps:0,d*.15)};
  if(df.shock&&Math.random()<.25){e.slow=Math.max(e.slow||0,.6)}
  if(df.chain&&!CHAINING){CHAINING=true;let at=e;for(let n=0;n<2;n++){let b=null,bd=110*110;for(const o of G.enemies){if(o===e||o===at||o.hp<=0)continue;const q=(o.x-at.x)**2+(o.y-at.y)**2;if(q<bd){bd=q;b=o}}if(!b)break;
    for(let k=0;k<=5;k++)G.fx.push({x:at.x+(b.x-at.x)*k/5+rnd(-3,3),y:at.y-8+(b.y-at.y)*k/5+rnd(-3,3),vx:0,vy:0,life:.2,max:.2,col:MY,r:1.5});hurtEnemy(b,d*.5,'aoe');at=b}CHAINING=false}
  return d});
// evolutions + combos for the spell set
Object.assign(EVOLUTIONS,{
  arcblade:{id:'arcblade_astral',name:'Astral Blade',needs:'ink',lv:2,mods:{dmg:1.6,range:1.25},glow:'#ffffff'},
  lance:{id:'lance_storm',name:'Storm Lance',needs:'homing',lv:1,mods:{dmg:1.4,pierce:2,rate:.8},glow:'#fff0a0'},
  emberorb:{id:'emberorb_sun',name:'Little Sun',needs:'echo',lv:1,mods:{dmg:1.5,aoe:1.5},glow:'#ffd34a'},
  frostfan:{id:'frostfan_blizzard',name:'Blizzard Fan',needs:'quick',lv:2,mods:{rate:.6,dmg:1.3},glow:'#c8f0ff'},
  chainspark:{id:'chainspark_tempest',name:'Tempest Spark',needs:'swift',lv:2,mods:{dmg:1.5,orbitSpeed:1.4,range:1.3},glow:'#ffffff'},
});
Object.assign(COMBOS,{
  'emberorb+lance':{id:'lance_plasma',name:'Plasma Lance',from:'lance',glow:'#ff6aff',mods:{dmg:1.4},extra:{aoe:44,fire:true,burnHit:true,kind:'ranged'}},
  'arcblade+frostfan':{id:'arcblade_rime',name:'Rime Blade',from:'arcblade',glow:'#9fe0ff',mods:{dmg:1.3,range:1.3},extra:{frost:true}},
  'chainspark+emberorb':{id:'chainspark_wild',name:'Wildfire Spark',from:'chainspark',glow:'#ff8a3a',mods:{dmg:1.3},extra:{burnHit:true}},
});
for(const b of ['arcblade','lance','emberorb','frostfan','chainspark']){const ev=EVOLUTIONS[b];makeVariant(b,ev.id,ev.name,ev.mods,{base:b,evolved:true,proj:CREATIONS[b].proj||b});forgeSprite(ev.id,b,ev.glow)}
for(const k of ['emberorb+lance','arcblade+frostfan','chainspark+emberorb']){const c=COMBOS[k];makeVariant(c.from,c.id,c.name,c.mods,{...c.extra,base:c.id,fused:true,proj:CREATIONS[c.from].proj||c.from});forgeSprite(c.id,c.from,c.glow)}
// the old Atelier route is retired: spells are drawn live now
ROUTES.atelier=()=>{toast('Spells are drawn live in the Mythic Age now. Equip them in Loadout.');history.replaceState(null,'','#/loadout');loadout()};
if(save.scrolls)delete save.scrolls;


// ---- per-mage skill trees: 3 branches x 3 tiers each, bought with coins, applied at run start ----
const B=(n,d,a)=>({n,d,a});
const SKILL_TREES={
  ink:{Line:[B('Steady Hand','+8% damage',p=>p.dmgMul*=1.08),B('Fine Nib','+15% durability',p=>p.durMul*=1.15),B('Masterstroke','+15% damage',p=>p.dmgMul*=1.15)],
       Page:[B('Thick Paper','+15 max HP',p=>p.maxHp+=15),B('Bookbinding','+1 ranged cap',p=>p.caps.ranged+=1),B('Second Draft','Second Wind: survive one fatal hit',p=>p.secondWind=true)],
       Arcana:[B('Inkwell','+10% durability',p=>p.durMul*=1+0.1),B('Quick Quill','-10% cast cooldown',p=>p.cdMul*=0.90),B('Grand Grimoire','+30% Mythic spell damage',p=>p.mythMul=(p.mythMul||1)*1.3)]},
  flint:{Ember:[B('Kindling','+10% damage',p=>p.dmgMul*=1.1),B('Wildfire','+15% creation durability',p=>p.durMul*=1.15),B('Inferno','+20% damage',p=>p.dmgMul*=1.2)],
       Ash:[B('Charred Skin','+20 max HP',p=>p.maxHp+=20),B('Smoke','+10% speed',p=>p.speed*=1.1),B('Phoenix','Second Wind: survive one fatal hit',p=>p.secondWind=true)],
       Arcana:[B('Fire Tongue','+25% Mythic spell damage',p=>p.mythMul=(p.mythMul||1)*1.25),B('Hot Wax','-7% cast cooldown',p=>p.cdMul*=0.93),B('Burning Page','+10% durability',p=>p.durMul*=1+0.1)]},
  wind:{Gale:[B('Tailwind','+8% speed',p=>p.speed*=1.08),B('Cyclone','+1 dash charge',p=>{p.dashMax=(p.dashMax||2)+1;p.dashCharges=p.dashMax}),B('Jetstream','+12% speed',p=>p.speed*=1.12)],
       Calm:[B('Still Air','+0.3s slow-mo',p=>p.focus+=.3),B('Breath','+150 magnet range',p=>p.magnet+=150),B('Eye of Storm','+15% damage',p=>p.dmgMul*=1.15)],
       Arcana:[B('Whisper','-12% cast cooldown',p=>p.cdMul*=0.88),B('Updraft','+10% durability',p=>p.durMul*=1+0.1),B('Tempest','+30% Mythic spell damage',p=>p.mythMul=(p.mythMul||1)*1.3)]},
  hermit:{Bone:[B('Marrow','+25 max HP',p=>p.maxHp+=25),B('Ossify','+20% durability',p=>p.durMul*=1.2),B('Ribcage','+40 max HP',p=>p.maxHp+=40)],
       Hunt:[B('Scavenger','+15% coins',p=>p.coinMul*=1.15),B('Heavy Club','+1 melee cap',p=>p.caps.melee+=1),B('Old Wrath','+20% damage',p=>p.dmgMul*=1.2)],
       Arcana:[B('Bone Runes','+20% Mythic spell damage',p=>p.mythMul=(p.mythMul||1)*1.2),B('Long Memory','+20% durability',p=>p.durMul*=1+0.2),B('Patience','-10% cast cooldown',p=>p.cdMul*=0.90)]},
};
const SKILL_COST=[150,350,700];
if(!save.skills)save.skills={};
runHooks.push(G=>{if(G.daily)return;const t=SKILL_TREES[G.mage],own=save.skills[G.mage]||{};if(!t)return;const p=G.player;
  for(const br in t)for(let i=0;i<(own[br]||0);i++)t[br][i].a(p);p.hp=p.maxHp});
function skills(){
  leaveRun();setRoute('skills');const id=save.mage in SKILL_TREES?save.mage:'ink',t=SKILL_TREES[id],own=save.skills[id]||{};
  show(sheet('Skill Trees','18 &mdash; '+MAGES[id].name+' (pick another mage in Mages)',`<p class="sh">Coins: <b>${save.coins}</b>. Each branch unlocks in order. Skills apply to normal runs, not daily runs.</p><div class="tbl">${Object.entries(t).map(([br,nodes])=>`<div class="cell"><span class="cell-h"><b>${br}</b><i>${own[br]||0}/3</i></span>${nodes.map((n,i)=>{const have=i<(own[br]||0),next=i===(own[br]||0);return `<button class="sk ${have?'on':next?'':'off'}" data-br="${br}" data-i="${i}" ${next?'':'disabled'}><span class="nm">${n.n}</span><span class="sh">${n.d}${have?' &middot; learned':next?' &middot; '+SKILL_COST[i]+' coins':''}</span></button>`}).join('')}</div>`).join('')}</div>`));
  screenEl.querySelectorAll('.sk[data-br]:not([disabled])').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,c=SKILL_COST[i];if(save.coins<c){toast('Need '+c+' coins');return}save.coins-=c;(save.skills[id]=save.skills[id]||{})[b.dataset.br]=i+1;persist();sfx('chest');skills()});
  $('back').onclick=home;
}
hub('skills','Skill Trees',skills);
