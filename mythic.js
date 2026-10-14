'use strict';
// ================= UPDATE: MYTHIC =================
// ---- the Mythic era ----
ERA_ORDER.push('mythic');
ERAS.mythic={name:'Mythic Age',durability:2.8,enemyHp:3.0,enemyDmg:2.2,ground:'#1d1830',ink:'#e0b0ff',date:'before time',no:'IV',
  spawns:[{type:'wisp',from:0,w:40},{type:'wraith',from:20,w:16},{type:'golem',from:60,w:8},{type:'hydra',from:110,w:5}],
  bosses:bossTable([[180,'cyclops'],[300,'hydraking'],[600,'gorgon'],[900,'aeon']]),
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

// ---- spell pages (Atelier): pre-draw glyphs onto scroll pages; cast them in the Mythic Age (Q/E/R or tap) ----
const SPELLS={
  gust:{name:'Gust',glyph:'short line',col:'#c8f0ff',desc:'Blast every nearby enemy away.'},
  lance:{name:'Lightning Lance',glyph:'long line',col:'#fff0a0',desc:'A bolt that pierces everything in a line.'},
  nova:{name:'Ember Nova',glyph:'circle',col:'#ff8a3a',desc:'A ring of fire around you; sets enemies burning.'},
  frost:{name:'Frost Fan',glyph:'V shape',col:'#9fe0ff',desc:'A cone of frost that freezes enemies.'},
  chain:{name:'Chain Spark',glyph:'zigzag',col:'#c48cff',desc:'Lightning that jumps between up to 7 enemies.'},
};
const GLYPH_SPELL={club:'gust',spear:'lance',rock:'nova',sling:'frost',dagger:'chain'};
const SPELL_USES=4,SPELL_CD=10;
if(!save.scrolls)save.scrolls=[null,null,null];
const spellsActive=()=>G&&CURRENT_ERA==='mythic';
runHooks.push(G=>{G.spells=save.scrolls.map(k=>k&&{k,uses:SPELL_USES+(G.player.spellUses||0),cd:0});scrollHud(true)});
function nearestEnemy(x,y,r){let b=null,bd=r*r;for(const e of G.enemies){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;b=e}}return b}
function castSpell(i){if(!spellsActive()||G.paused)return;const s=G.spells[i];if(!s)return;if(s.uses<=0){toast('Page spent');return}if(s.cd>0){toast('Page recharging');return}
  s.uses--;s.cd=SPELL_CD*(G.player.spellCdMul||1);const p=G.player,P=(1+G.level*.05)*(G.player.spellMul||1)*p.dmgMul,S=SPELLS[s.k];sfx('chest');haptic([20,20,40]);G.shake=8;floatText(p.x,p.y-60,S.name.toUpperCase(),S.col,1,14);
  const all=G.enemies.slice();
  if(s.k==='gust'){ring(p.x,p.y,220,S.col);for(const e of all){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<220){const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*900;e.ky+=Math.sin(a)*900;hurtEnemy(e,20*P,'spell')}}p.invul=Math.max(p.invul,.4)}
  if(s.k==='nova'){ring(p.x,p.y,150,S.col);ring(p.x,p.y,100,S.col);burst(p.x,p.y,S.col,50);for(const e of all)if(Math.hypot(e.x-p.x,e.y-p.y)<150){hurtEnemy(e,60*P,'spell');e.burn={t:3,dps:12*P}}}
  if(s.k==='lance'||s.k==='frost'){const t=nearestEnemy(p.x,p.y,600);const a=t?Math.atan2(t.y-p.y,t.x-p.x):p.face;
    for(let d=20;d<(s.k==='lance'?520:260);d+=18)G.fx.push({x:p.x+Math.cos(a)*d+rnd(-4,4),y:p.y-10+Math.sin(a)*d+rnd(-4,4),vx:0,vy:0,life:.4,max:.4,col:S.col,r:s.k==='lance'?3:2});
    for(const e of all){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),da=Math.abs(((Math.atan2(dy,dx)-a+9.42)%6.283)-3.14);
      if(s.k==='lance'&&d<520&&Math.abs(Math.sin(da))*d<26+e.r&&da<1.57)hurtEnemy(e,90*P,'spell');
      if(s.k==='frost'&&d<260&&da<.62){hurtEnemy(e,40*P,'spell');if(!e.T.boss)e.frozen=2;else e.slow=3}}}
  if(s.k==='chain'){let from={x:p.x,y:p.y-10};const hit=new Set();for(let n=0;n<7;n++){let b=null,bd=260*260;for(const e of G.enemies){if(hit.has(e))continue;const d=(e.x-from.x)**2+(e.y-from.y)**2;if(d<bd){bd=d;b=e}}if(!b)break;hit.add(b);
    for(let k=0;k<=8;k++)G.fx.push({x:from.x+(b.x-from.x)*k/8+rnd(-5,5),y:from.y+(b.y-10-from.y)*k/8+rnd(-5,5),vx:0,vy:0,life:.3,max:.3,col:S.col,r:2});from={x:b.x,y:b.y-10};hurtEnemy(b,55*P,'spell')}}
  scrollHud(true)}
CAVE_TICK.push(dt=>{if(G.spells)for(const s of G.spells)if(s&&s.cd>0)s.cd-=dt;scrollHud()});
addEventListener('keydown',e=>{if(mode!=='run'||!G||e.repeat)return;const i={q:0,e:1,r:2}[e.key.toLowerCase()];if(i!=null&&spellsActive())castSpell(i)});
function glyphIcon(k){return SPELL_ICON[k]}
const SPELL_ICON={};{const art={gust:['.....','kkkkk','.....'],lance:['k......','.k.....','..k....','...k...','....k..','.....k.','......k'],nova:['.kkk.','k...k','k...k','k...k','.kkk.'],frost:['k...k','k...k','.k.k.','.k.k.','..k..'],chain:['k...k...','.k.k.k..','..k...k.','.......k']};
  for(const k in art)SPELL_ICON[k]=iconURL(outline(grid(art[k].map(r=>r.replace(/k/g,'y')),{...PAL,y:SPELLS[k].col}),'#1a0f0e'),4)}
let scrollSig='';
function scrollHud(force){let el=$('scrolls');if(!spellsActive()||mode!=='run'||!G.spells||!G.spells.some(Boolean)){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='scrolls';$('hud').appendChild(el);el.addEventListener('pointerdown',ev=>{const b=ev.target.closest('[data-sp]');if(b){ev.stopPropagation();ev.preventDefault();castSpell(+b.dataset.sp)}})}
  const sig=G.spells.map(s=>s?s.uses+':'+Math.ceil(s.cd):'-').join();if(!force&&sig===scrollSig)return;scrollSig=sig;
  el.innerHTML=G.spells.map((s,i)=>s?`<button data-sp="${i}" class="${s.uses<=0?'spent':s.cd>0?'cd':''}"><img src="${SPELL_ICON[s.k]}" alt=""><b>${'QER'[i]}</b><i>${s.cd>0?Math.ceil(s.cd):s.uses}</i></button>`:'').join('')}
function atelier(){
  leaveRun();setRoute('atelier');
  show(sheet('Atelier','17 &mdash; Ink your spell pages (Mythic Age)',`<div class="split"><div><div class="lab rule">Draw a glyph on the page, then bind it to a scroll</div><canvas id="pad" width="420" height="240"></canvas><p class="sh" id="padr">Draw a short line, long line, circle, V or zigzag.</p>
    <nav class="menu">${[0,1,2].map(i=>`<button data-bind="${i}"><b>0${i+1}</b>Bind to scroll ${'QER'[i]}<span>${save.scrolls[i]?SPELLS[save.scrolls[i]].name:'empty'}</span><i>&rarr;</i></button>`).join('')}</nav></div>
    <aside class="pane"><div class="lab rule">Grimoire</div>${Object.entries(SPELLS).map(([k,s])=>`<div class="li"><img class="pi" src="${SPELL_ICON[k]}" alt=""><div class="li-t"><span class="nm">${s.name}</span><span class="sh">${s.glyph} &middot; ${s.desc}</span></div></div>`).join('')}<p class="note">Each page casts ${SPELL_USES}&times; per run with a ${SPELL_CD}s cooldown. Pages only answer in the Mythic Age.</p></aside></div>`));
  const cv=$('pad'),x=cv.getContext('2d');let pts=null,got=null;const bg=()=>{x.fillStyle='#e9dcc3';x.fillRect(0,0,cv.width,cv.height);x.strokeStyle='#cbbfa6';for(let y=20;y<cv.height;y+=20){x.beginPath();x.moveTo(0,y);x.lineTo(cv.width,y);x.stroke()}};bg();
  const pos=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}};
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);bg();pts=[pos(e)];x.strokeStyle='#1a0f0e';x.lineWidth=5;x.lineCap='round'};
  cv.onpointermove=e=>{if(!pts)return;const q=pos(e),l=pts[pts.length-1];x.beginPath();x.moveTo(l.x,l.y);x.lineTo(q.x,q.y);x.stroke();pts.push(q)};
  cv.onpointerup=()=>{if(!pts)return;const id=recognize(pts.map(q=>({x:q.x*Math.min(W,H)*.8/cv.height,y:q.y*Math.min(W,H)*.8/cv.height})));pts=null;got=id&&GLYPH_SPELL[id];$('padr').textContent=got?'Glyph read: '+SPELLS[got].name+'. Bind it to a scroll.':'The page did not take. Try again.';if(got)sfx('pick');else sfx('fizzle')};
  screenEl.querySelectorAll('[data-bind]').forEach(b=>b.onclick=()=>{if(!got){toast('Draw a glyph first');return}save.scrolls[+b.dataset.bind]=got;persist();toast(SPELLS[got].name+' inked');atelier()});
  $('back').onclick=home;
}
hub('atelier','Atelier',atelier);

// ---- per-mage skill trees: 3 branches x 3 tiers each, bought with coins, applied at run start ----
const B=(n,d,a)=>({n,d,a});
const SKILL_TREES={
  ink:{Line:[B('Steady Hand','+8% damage',p=>p.dmgMul*=1.08),B('Fine Nib','+15% durability',p=>p.durMul*=1.15),B('Masterstroke','+15% damage',p=>p.dmgMul*=1.15)],
       Page:[B('Thick Paper','+15 max HP',p=>p.maxHp+=15),B('Bookbinding','+1 ranged cap',p=>p.caps.ranged+=1),B('Second Draft','Second Wind: survive one fatal hit',p=>p.secondWind=true)],
       Spell:[B('Inkwell','+1 use per spell page',p=>p.spellUses=(p.spellUses||0)+1),B('Quick Quill','-20% spell cooldown',p=>p.spellCdMul=(p.spellCdMul||1)*.8),B('Grand Grimoire','+30% spell damage',p=>p.spellMul=(p.spellMul||1)*1.3)]},
  flint:{Ember:[B('Kindling','+10% damage',p=>p.dmgMul*=1.1),B('Wildfire','+15% creation durability',p=>p.durMul*=1.15),B('Inferno','+20% damage',p=>p.dmgMul*=1.2)],
       Ash:[B('Charred Skin','+20 max HP',p=>p.maxHp+=20),B('Smoke','+10% speed',p=>p.speed*=1.1),B('Phoenix','Second Wind: survive one fatal hit',p=>p.secondWind=true)],
       Spell:[B('Fire Tongue','+25% spell damage',p=>p.spellMul=(p.spellMul||1)*1.25),B('Hot Wax','-15% spell cooldown',p=>p.spellCdMul=(p.spellCdMul||1)*.85),B('Burning Page','+1 use per page',p=>p.spellUses=(p.spellUses||0)+1)]},
  wind:{Gale:[B('Tailwind','+8% speed',p=>p.speed*=1.08),B('Cyclone','+1 dash charge',p=>{p.dashMax=(p.dashMax||2)+1;p.dashCharges=p.dashMax}),B('Jetstream','+12% speed',p=>p.speed*=1.12)],
       Calm:[B('Still Air','+0.3s slow-mo',p=>p.focus+=.3),B('Breath','+150 magnet range',p=>p.magnet+=150),B('Eye of Storm','+15% damage',p=>p.dmgMul*=1.15)],
       Spell:[B('Whisper','-25% spell cooldown',p=>p.spellCdMul=(p.spellCdMul||1)*.75),B('Updraft','+1 use per page',p=>p.spellUses=(p.spellUses||0)+1),B('Tempest','+30% spell damage',p=>p.spellMul=(p.spellMul||1)*1.3)]},
  hermit:{Bone:[B('Marrow','+25 max HP',p=>p.maxHp+=25),B('Ossify','+20% durability',p=>p.durMul*=1.2),B('Ribcage','+40 max HP',p=>p.maxHp+=40)],
       Hunt:[B('Scavenger','+15% coins',p=>p.coinMul*=1.15),B('Heavy Club','+1 melee cap',p=>p.caps.melee+=1),B('Old Wrath','+20% damage',p=>p.dmgMul*=1.2)],
       Spell:[B('Bone Runes','+20% spell damage',p=>p.spellMul=(p.spellMul||1)*1.2),B('Long Memory','+2 uses per page',p=>p.spellUses=(p.spellUses||0)+2),B('Patience','-20% spell cooldown',p=>p.spellCdMul=(p.spellCdMul||1)*.8)]},
};
const SKILL_COST=[150,350,700];
if(!save.skills)save.skills={};
// apply before spells are built (runHooks order: progression mage apply runs earlier; this hook is inserted before the spell hook)
runHooks.splice(runHooks.length-1,0,G=>{if(G.daily)return;const t=SKILL_TREES[G.mage],own=save.skills[G.mage]||{};if(!t)return;const p=G.player;
  for(const br in t)for(let i=0;i<(own[br]||0);i++)t[br][i].a(p);p.hp=p.maxHp});
function skills(){
  leaveRun();setRoute('skills');const id=save.mage in SKILL_TREES?save.mage:'ink',t=SKILL_TREES[id],own=save.skills[id]||{};
  show(sheet('Skill Trees','18 &mdash; '+MAGES[id].name+' (pick another mage in Mages)',`<p class="sh">Coins: <b>${save.coins}</b>. Each branch unlocks in order. Skills apply to normal runs, not daily runs.</p><div class="tbl">${Object.entries(t).map(([br,nodes])=>`<div class="cell"><span class="cell-h"><b>${br}</b><i>${own[br]||0}/3</i></span>${nodes.map((n,i)=>{const have=i<(own[br]||0),next=i===(own[br]||0);return `<button class="sk ${have?'on':next?'':'off'}" data-br="${br}" data-i="${i}" ${next?'':'disabled'}><span class="nm">${n.n}</span><span class="sh">${n.d}${have?' &middot; learned':next?' &middot; '+SKILL_COST[i]+' coins':''}</span></button>`}).join('')}</div>`).join('')}</div>`));
  screenEl.querySelectorAll('.sk[data-br]:not([disabled])').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,c=SKILL_COST[i];if(save.coins<c){toast('Need '+c+' coins');return}save.coins-=c;(save.skills[id]=save.skills[id]||{})[b.dataset.br]=i+1;persist();sfx('chest');skills()});
  $('back').onclick=home;
}
hub('skills','Skill Trees',skills);
