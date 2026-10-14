'use strict';
// ================= UPDATE: INK AND PAPER =================
// ---- ink colours: choose one per run (#/inks). Each adds an on-hit effect ----
const INKS={
  soot:{name:'Soot Ink',col:'#ff9a3c',cost:0,desc:'Plain ink. No side effects.'},
  crimson:{name:'Crimson Ink',col:'#ff4a3a',cost:400,desc:'Hits burn: 30% of the hit as fire over 2s.',hit:(e,d)=>{e.burn={t:2,dps:Math.max(e.burn?e.burn.dps:0,d*.15)}}},
  azure:{name:'Azure Ink',col:'#7fd8ff',cost:500,desc:'8% chance to freeze an enemy solid for 1.2s (bosses: slow).',hit:e=>{if(Math.random()<.08){if(e.T.boss)e.slow=Math.max(e.slow||0,1.5);else e.frozen=1.2}}},
  violet:{name:'Violet Ink',col:'#c48cff',cost:450,desc:'Hits slow enemies by 40% for 2s.',hit:e=>{e.slow=2}},
};
if(!save.inks)save.inks=['soot'];if(!save.ink)save.ink='soot';
function inkCol(){return (INKS[(G&&G.inkId)||save.ink]||INKS.soot).col}
runHooks.push(G=>{G.inkId=save.inks.includes(save.ink)?save.ink:'soot'});
DMG_MODS.push((e,d,src)=>{const k=G&&INKS[G.inkId];if(k&&k.hit&&src!=='fire'&&src!=='dot')k.hit(e,d);return d});
const _inkUpd=updatePickups;updatePickups=function(dt){_inkUpd(dt);if(mode!=='run'||!G)return;
  for(const e of G.enemies.slice()){if(e.baseSpeed==null)e.baseSpeed=e.speed;
    if(e.burn){e.burn.t-=dt;e.burnTick=(e.burnTick||0)-dt;if(e.burnTick<=0){e.burnTick=.4;hurtEnemy(e,e.burn.dps*.4,'dot');if(Math.random()<.6)G.fx.push({x:e.x+rnd(-5,5),y:e.y-rnd(4,14),vx:0,vy:-30,life:.35,max:.35,col:'#ff6a2a',r:1.5})}if(e.burn&&e.burn.t<=0)e.burn=null}
    if(e.frozen>0)e.frozen-=dt;if(e.slow>0)e.slow-=dt;
    e.speed=e.baseSpeed*(e.frozen>0?0:e.slow>0?.6:1)}};
const _inkRP=renderPickups;renderPickups=function(){_inkRP()};
const _inkTop=drawLootTop;drawLootTop=function(){_inkTop();if(!G)return;for(const e of G.enemies){if(!(e.frozen>0||e.slow>0||e.burn))continue;const sx=X(e.x),sy=Y(e.y);
  if(e.frozen>0){bx.globalAlpha=.45;bx.fillStyle='#bfefff';bx.fillRect(sx-Math.round(e.r/Z),sy-Math.round(e.r*1.6/Z),Math.round(e.r*2/Z),Math.round(e.r*1.6/Z))}
  else if(e.slow>0){bx.globalAlpha=.8;bx.fillStyle='#c48cff';bx.fillRect(sx-2,sy+1,4,1)}bx.globalAlpha=1}};
function inks(){
  leaveRun();setRoute('inks');
  show(sheet('Inks',`12 &mdash; Choose the colour of your magic &middot; ${coinI()} ${save.coins}`,`<div class="tbl">${Object.entries(INKS).map(([id,k],i)=>{const own=save.inks.includes(id),on=save.ink===id;
    return `<button class="cell ${on?'on':''}" data-ink="${id}"><span class="cell-h"><b>0${i+1}</b>${on?'<i class="chk">&#9632; Chosen</i>':''}</span><span class="swatch" style="background:${k.col}"></span><span class="nm">${k.name}</span><span class="sh">${k.desc}</span><span class="st">${own?'Unlocked':coinI()+' '+k.cost}</span></button>`}).join('')}</div>`));
  screenEl.querySelectorAll('[data-ink]').forEach(el=>el.onclick=()=>{const id=el.dataset.ink,k=INKS[id];
    if(!save.inks.includes(id)){if(save.coins<k.cost){toast('Not enough coins');return}save.coins-=k.cost;save.inks.push(id);sfx('chest')}save.ink=id;persist();inks()});
  $('back').onclick=home;
}
hub('inks','Inks',inks);

// ---- stroke-speed bonus: a fast, confident stroke hits harder ----
function strokeBonus(d,pts,id){const dur=(performance.now()-(d.t0||performance.now()))/1000;let m=1;
  if(dur<.22){m=1.2;floatText(G.player.x,G.player.y-50,'SWIFT','#9fe0ff',.8,11)}else if(dur<.4)m=1.1;
  const key=CREATIONS[id]&&CREATIONS[id].shapeKey||id;masteryAdd(key);return m}
// ---- shape mastery: lifetime draws per shape -> levels (+5% damage each) ----
const MASTERY_STEPS=[10,40,120,300,700];
if(!save.mastery)save.mastery={};
function masteryLv(key){const n=save.mastery[key]||0;let l=0;for(const s of MASTERY_STEPS)if(n>=s)l++;return l}
function masteryAdd(key){const before=masteryLv(key);save.mastery[key]=(save.mastery[key]||0)+1;const l=masteryLv(key);if(l>before){toast('Mastery '+l+': '+SHAPE_NAMES[key]+' (+'+l*5+'% dmg)');sfx('lvl')}}
const SHAPE_NAMES={short:'Short line',long:'Long line',circle:'Circle',v:'V shape',zig:'Zigzag'};
DMG_MODS.push((e,d,src,from)=>{const def=from&&from.def;if(!def)return d;const l=masteryLv(def.shapeKey||from.id);return l?d*(1+.05*l):d});

// ---- sketchbook: gallery of every creation discovered, with lore + mastery ----
const SKETCH_LORE={club:'The first thing anyone ever drew in anger.',spear:'A line that wants to keep going.',rock:'Round things roll downhill, and into skulls.',sling:'Two strokes and a grudge.',dagger:'Bone, sharpened by a zigzag of intent.',
  sword:'Bronze remembers the shape of a short line.',javelin:'Thrown by soldiers who never learned to draw.',discus:'An athlete\'s toy, sketched for war.'};
if(!save.sketched)save.sketched={};
const _skSpawn=spawnCreation;spawnCreation=function(id){if(CREATIONS[id]&&!save.sketched[id]){save.sketched[id]=1;persist()}return _skSpawn.apply(this,arguments)};
function sketchbook(){
  leaveRun();setRoute('sketchbook');
  const ids=Object.keys(CREATIONS).filter(id=>!(CREATIONS[id].kind==='spell'&&!save.sketched[id]));const got=ids.filter(id=>save.sketched[id]).length;
  const mast=Object.keys(SHAPE_NAMES).map(k=>`<div class="li"><span class="nm">${SHAPE_NAMES[k]}</span><span class="pips">${MASTERY_STEPS.map((s,i)=>`<i class="${masteryLv(k)>i?'on':''}"></i>`).join('')}</span><span class="sh">${save.mastery[k]||0} drawn &middot; +${masteryLv(k)*5}%</span></div>`).join('');
  show(sheet('Sketchbook',`13 &mdash; ${got} / ${ids.length} sketched`,`<div class="sec">Shape mastery</div><div class="list achl">${mast}</div><div class="sec">Gallery</div><div class="tbl">${ids.map(id=>{const c=CREATIONS[id],s=save.sketched[id];const ic=ICON[id]||(SPR[id]&&iconURL(SPR[id].r||SPR[id],3));
    return `<div class="cell ${s?'':'dim'}"><span class="cell-h"><b>${(c.era||'').toUpperCase()}</b><i>${c.evolved?'evolved':c.combo?'combo':c.kind}</i></span>${ic?`<img class="bimg ${s?'':'sil'}" src="${ic}" alt="">`:''}<span class="nm">${s?c.name:'???'}</span><span class="sh">${s?(SKETCH_LORE[id]||c.lore||('Drawn as a '+(c.shape||'combination')+'.')):'Not yet sketched.'}</span></div>`}).join('')}</div>`));
  $('back').onclick=home;
}
hub('sketchbook','Sketchbook',sketchbook);
