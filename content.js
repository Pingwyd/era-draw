'use strict';
// ================= CONTENT PACK: cosmetics, premium + gem store (IAP stub), relics, events, enemies, mage, challenges =================
if(!save.cosm)save.cosm={owned:[],eq:{}};if(!save.cosm.eq)save.cosm.eq={};
const COSM=[
 // mage skins (palette swaps over whichever mage you play)
 {id:'sk_ember',type:'skin',name:'Ember Robe',cost:600,cur:'coins',desc:'Mage skin: smouldering red robe and charcoal hat.',pal:{h:'#3a1a14',H:'#1e0d0a',r:'#c2431f',R:'#7a2410'}},
 {id:'sk_frost',type:'skin',name:'Frost Mantle',cost:600,cur:'coins',desc:'Mage skin: glacier-blue robe, white hat.',pal:{h:'#e8f4ff',H:'#9cb8d0',r:'#3d7fb8',R:'#22507a'}},
 {id:'sk_star',type:'skin',name:'Starweaver',cost:120,cur:'gems',premium:true,desc:'Premium mage skin: midnight robe stitched with gold.',pal:{h:'#1a1440',H:'#0c0a22',r:'#3a2a7a',R:'#221a4e',w:'#ffd96a'}},
 // ink trails (stroke colour while drawing)
 {id:'tr_rainbow',type:'trail',name:'Rainbow Stroke',cost:400,cur:'coins',desc:'Ink trail: your strokes cycle through the spectrum.',col:()=>`hsl(${Math.floor(performance.now()/6)%360},90%,65%)`,sw:'linear-gradient(90deg,#f55,#fd5,#5f8,#5cf,#c5f)'},
 {id:'tr_gold',type:'trail',name:'Gold Leaf',cost:80,cur:'gems',premium:true,desc:'Premium ink trail: gilded strokes.',col:()=>'#ffd34a',sw:'#ffd34a'},
 // weapon skins (tint every creation + projectile)
 {id:'ws_obsidian',type:'wskin',name:'Obsidian Arms',cost:500,cur:'coins',desc:'Weapon skin: volcanic glass with a violet sheen.',tint:'rgba(60,20,90,.55)',sw:'#3c1a5a'},
 {id:'ws_prism',type:'wskin',name:'Prismatic Arms',cost:100,cur:'gems',premium:true,desc:'Premium weapon skin: pearl-white with cyan glints.',tint:'rgba(160,250,255,.5)',sw:'#a0faff'},
 // kill + death effects
 {id:'kf_confetti',type:'kill',name:'Confetti Kills',cost:350,cur:'coins',desc:'Kill effect: enemies pop in party colours.',sw:'linear-gradient(90deg,#f55,#fd5,#5cf)'},
 {id:'kf_wisps',type:'kill',name:'Spirit Wisps',cost:60,cur:'gems',premium:true,desc:'Premium kill effect: a pale wisp rises from each kill.',sw:'#c8f0ff'},
 {id:'df_shatter',type:'death',name:'Ink Shatter',cost:300,cur:'coins',desc:'Death effect: you burst into a cloud of ink and paper.',sw:'#1a0f0e'},
 // HUD themes
 {id:'hud_parch',type:'hud',name:'Parchment HUD',cost:250,cur:'coins',desc:'HUD theme: aged paper bars and sepia ink.',sw:'#d8c49a'},
 {id:'hud_neon',type:'hud',name:'Neon HUD',cost:50,cur:'gems',premium:true,desc:'Premium HUD theme: glowing cyan and magenta.',sw:'#ff4ad8'},
 // LAN emotes
 {id:'em_pack',type:'emote',name:'Emote Pack',cost:200,cur:'coins',desc:'LAN emotes: adds NICE!, THIS WAY, LOL and <3 to GG! and HELP!.',sw:'#ffe08a'},
];
const COSM_TYPES={skin:'Mage skins',trail:'Ink trails',wskin:'Weapon skins',kill:'Kill effects',death:'Death effects',hud:'HUD themes',emote:'LAN emotes'};
const cosmOwn=id=>save.cosm.owned.includes(id),cosmEq=t=>{const id=save.cosm.eq[t];return id&&cosmOwn(id)?COSM.find(c=>c.id===id):null};
const GEM_PACKS=[{g:80,p:'$0.99'},{g:450,p:'$4.99',tag:'+12%'},{g:1000,p:'$9.99',tag:'+25%'},{g:2200,p:'$19.99',tag:'best value'}];

// ---- skin: rebuild mage frames with the skin palette ----
runHooks.push(G=>{const s=cosmEq('skin');if(!s)return;const pal={...PAL,...(MAGES[G.mage]||{}).pal,...s.pal};SPR.mage=[0,1,0,2].map(i=>set(grid([...MAGE_TOP,...LEGS[i]],pal)))});
// ---- trail ----
const _ctInk=inkCol;inkCol=function(){const t=mode==='run'&&cosmEq('trail');return t?t.col():_ctInk()};
// ---- weapon skin: tinted copies of creation + projectile sprites for this run ----
const TINT_ORIG={};
function tintCanvas(src,col){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d');x.drawImage(src,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return c}
function tintSet(o,col){return {...o,r:tintCanvas(o.r,col),l:tintCanvas(o.l,col)}}
runHooks.push(G=>{for(const k in TINT_ORIG)SPR[k]=TINT_ORIG[k];const w=cosmEq('wskin');if(!w)return;
  for(const id of Object.keys(CREATIONS).concat(['p_spear','p_rock','p_pebble']))if(SPR[id]){TINT_ORIG[id]=TINT_ORIG[id]||SPR[id];const o=TINT_ORIG[id];SPR[id]=o.r?tintSet(o,w.tint):tintCanvas(o,w.tint)}});
// ---- kill effects ----
killHooks.push(e=>{if(!G)return;const k=cosmEq('kill');if(!k||(save.perf&&Math.random()<.6))return;
  if(k.id==='kf_confetti'){for(let i=0;i<8;i++){const a=Math.random()*6.283,s=rnd(60,200);G.fx.push({x:e.x,y:e.y-6,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:rnd(.4,.8),max:.8,col:['#ff5a5a','#ffd84a','#5af08a','#5ac8ff','#c85aff'][i%5],r:2})}}
  else G.fx.push({x:e.x,y:e.y-8,vx:rnd(-8,8),vy:-55,life:1.1,max:1.1,col:'#c8f0ff',r:3})});
// ---- death effect: a beat of ink before the results screen ----
const _ctEnd=endRun;endRun=function(){if(G&&G.dead&&cosmEq('death')&&!G.netClient){if(!G.deathFx){G.deathFx=performance.now();const p=G.player;G.shake=12;
    for(let i=0;i<40;i++){const a=Math.random()*6.283,s=rnd(40,260);G.fx.push({x:p.x,y:p.y-8,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.6,1.2),max:1.2,col:i%3?'#1a0f0e':'#efe6d2',r:rnd(2,5)})}ring(p.x,p.y,120,'#1a0f0e');p.invul=99}
  if(performance.now()-G.deathFx<900){G.fx.forEach(f=>{f.life-=1/60});return}}
  return _ctEnd.apply(this,arguments)};
const _ctDrawP=drawPlayer;drawPlayer=function(p){if(G&&G.deathFx)return;return _ctDrawP(p)};
// ---- HUD themes ----
function applyHudTheme(){const h=cosmEq('hud');document.body.classList.toggle('hud-parch',!!h&&h.id==='hud_parch');document.body.classList.toggle('hud-neon',!!h&&h.id==='hud_neon')}
applyHudTheme();
// ---- gems: small free income so premium items are reachable without paying (+1 per boss, +3 per era clear) ----
killHooks.push(e=>{if(G&&e.T.boss&&!G.netClient){save.gems=(save.gems||0)+1;floatText(e.x,e.y-50,'+1 GEM','#c48cff',1.4)}});
const _ctClear=eraCleared;eraCleared=function(){save.gems=(save.gems||0)+3;toast('+3 gems for clearing the era');return _ctClear.apply(this,arguments)};

// ---- cosmetics page (#/cosmetics) with premium section and gem store (#/gemstore) ----
function cosmIcon(c){if(c.type==='skin'){const pal={...PAL,...c.pal};return `<img class="mimg" src="${iconURL(set(grid([...MAGE_TOP,...LEGS[0]],pal)).r,4)}" alt="">`}
  return `<span class="sw" style="background:${c.sw}"></span>`}
function cosmCell(c){const own=cosmOwn(c.id),on=save.cosm.eq[c.type]===c.id;const price=c.cur==='gems'?gemI()+' '+c.cost:coinI()+' '+c.cost;
  return `<button class="cell ${on?'on':''} ${c.premium?'prem':''}" data-c="${c.id}"><span class="cell-h"><b>${COSM_TYPES[c.type]}</b>${on?'<i class="chk">&#9632; On</i>':''}</span>${cosmIcon(c)}<span class="nm">${c.name}</span><span class="sh">${c.desc}</span><span class="st">${c.type==='emote'?(own?'Owned':price):own?(on?'Equipped: tap to remove':'Owned: tap to equip'):price}</span></button>`}
function cosmetics(){leaveRun();setRoute('cosmetics');
  const std=COSM.filter(c=>!c.premium),prem=COSM.filter(c=>c.premium);
  show(sheet('Cosmetics',`Look, not power &middot; ${coinI()} ${save.coins} &nbsp; ${gemI()} ${save.gems||0}`,
   `<div class="tbl">${std.map(cosmCell).join('')}</div>
    <div class="lab rule">Premium &middot; priced in gems</div><div class="tbl">${prem.map(cosmCell).join('')}</div>
    <p class="sh">Earn gems free: +1 per boss defeated, +3 per era cleared. <button class="lab back" id="toGems">Gem Store &rarr;</button></p>`));
  screenEl.querySelectorAll('[data-c]').forEach(el=>el.onclick=()=>{const c=COSM.find(x=>x.id===el.dataset.c);
    if(!cosmOwn(c.id)){const bal=c.cur==='gems'?(save.gems||0):save.coins;if(bal<c.cost){toast(c.cur==='gems'?'Not enough gems (Gem Store is coming soon)':'Not enough coins');return}
      if(c.cur==='gems')save.gems-=c.cost;else save.coins-=c.cost;save.cosm.owned.push(c.id);if(c.type!=='emote')save.cosm.eq[c.type]=c.id;sfx('chest');toast(c.name+' unlocked')}
    else if(c.type!=='emote'){save.cosm.eq[c.type]=save.cosm.eq[c.type]===c.id?null:c.id;sfx('pick')}
    persist();applyHudTheme();cosmetics()});
  $('toGems').onclick=()=>gemstore();$('back').onclick=home}
hub('cosmetics','Cosmetics',cosmetics);
function gemstore(){leaveRun();setRoute('gemstore');
  show(sheet('Gem Store',`Coming soon &middot; ${gemI()} ${save.gems||0}`,
   `<div class="soon"><b>COMING SOON</b> In-app purchases are not available yet. No payment is wired up and nothing can be charged. These packs are a preview of the future store.</div>
    <div class="tbl">${GEM_PACKS.map((p,i)=>`<div class="cell gp"><span class="cell-h"><b>Pack 0${i+1}</b>${p.tag?`<i class="chk">${p.tag}</i>`:''}</span><img src="${ICON.gemHard}" alt=""><span class="nm">${p.g} gems</span><span class="sh">${p.p}</span><button class="btn" disabled>Coming soon</button></div>`).join('')}</div>
    <p class="sh">Gems only buy cosmetics. They never buy power.</p>`,'Cosmetics'));
  $('back').onclick=cosmetics}
hub('gemstore','Gem Store',gemstore,{hidden:true});

// ---- LAN emotes: keys 7-0 or the emote bar; shown above the sender for everyone ----
const EMOTES=['GG!','HELP!','NICE!','THIS WAY','LOL','<3'];
const emoteSet=()=>cosmOwn('em_pack')?EMOTES:EMOTES.slice(0,2);
function emoteShow(x,y,txt){if(!G)return;floatText(x,y-46,txt,'#ffe08a',1.8,13)}
function sendEmote(i){if(!G||!G.lan)return;const txt=emoteSet()[i];if(!txt)return;const P=G.player;emoteShow(P.x,P.y,txt);
  const m={k:'em',t:txt,x:Math.round(P.x),y:Math.round(P.y)};if(G.lan.role==='host'){for(const p of LAN.peers)lanSend(p.dc,m)}else lanSend(LAN.host&&LAN.host.dc,m)}
window.lanEmoteIn=function(slot,m){if(!G||!EMOTES.includes(m.t))return;const q=G.allies.find(a=>a.ctrl==='net'+slot);emoteShow(q?q.x:+m.x||0,q?q.y:+m.y||0,m.t);
  for(const p of LAN.peers)if(p.slot!==slot)lanSend(p.dc,{k:'em',t:m.t,x:Math.round(q?q.x:m.x),y:Math.round(q?q.y:m.y)})};
window.lanEmoteClient=function(m){if(EMOTES.includes(m.t))emoteShow(+m.x||0,+m.y||0,m.t)};
addEventListener('keydown',e=>{if(mode!=='run'||!G||!G.lan)return;const i=['7','8','9','0','-','='].indexOf(e.key);if(i>=0&&i<emoteSet().length)sendEmote(i)});
const _ctDP=damagePlayer;damagePlayer=function(d){if(!(d>0))return;return _ctDP(d)};
function emoteBar(){let b=$('emotes');const want=mode==='run'&&G&&G.lan;if(!want){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.id='emotes';document.body.appendChild(b)}const sig=emoteSet().join('|');if(b.dataset.s!==sig){b.dataset.s=sig;b.innerHTML=emoteSet().map((t,i)=>`<button data-e="${i}">${t}</button>`).join('');
    b.querySelectorAll('button').forEach(x=>x.onclick=()=>sendEmote(+x.dataset.e))}}
setInterval(emoteBar,500);

// ---- relics ----
Object.assign(RELICS,{
  storm:{name:'Storm Quill',desc:'Every 10th kill calls lightning on up to 4 nearby enemies.'},
  lung:{name:'Iron Lung',desc:'+15% max HP and regenerate 0.25 HP per second.',apply:G=>{const p=G.player;p.maxHp*=1.15;p.hp=Math.min(p.maxHp,p.hp*1.15);p.regen=(p.regen||0)+.25}},
});
killHooks.push(e=>{if(!G||!G.relics||!G.relics.storm)return;G.stormN=(G.stormN||0)+1;if(G.stormN%10)return;
  const t=queryGrid(e.x,e.y,220).filter(o=>o!==e&&o.hp>0).slice(0,4);for(const o of t){G.fx.push({ring:true,x:o.x,y:o.y,r:26,life:.3,max:.3,col:'#fff0a0'});hurtEnemy(o,30*G.player.dmgMul,'aoe')}if(t.length)sfx('hit')});

// ---- map event: meteor shower (telegraphed impacts hurt enemies and you) ----
runHooks.push(G=>{G.meteors=[];G.meteorT=150+Math.random()*30});
CAVE_TICK.push(dt=>{if(G.netClient)return;G.meteorT-=dt;const p=G.player;
  if(G.meteorT<=0){G.meteorT=140+Math.random()*50;toast('Meteor shower! Watch the ground');for(let i=0;i<9;i++)G.meteors.push({x:p.x+rnd(-320,320),y:p.y+rnd(-200,200),t:1.4+i*.55,max:1.4+i*.55})}
  for(let i=G.meteors.length-1;i>=0;i--){const m=G.meteors[i];m.t-=dt;if(m.t>0)continue;G.meteors.splice(i,1);burst(m.x,m.y,'#ff9a3a',18);ring(m.x,m.y,64,'#ff6a2a');G.shake=Math.max(G.shake,5);
    for(const e of queryGrid(m.x,m.y,80))if(Math.hypot(e.x-m.x,e.y-m.y)<64+e.r)hurtEnemy(e,90*G.era.enemyHp,'aoe');
    if(Math.hypot(p.x-m.x,p.y-m.y)<56&&p.invul<=0)damagePlayer(14*G.era.enemyDmg);G.orbs.push({x:m.x,y:m.y,v:4*(ERA_XP[CURRENT_ERA]||1),t:0})}});
const _ctPick=renderPickups;renderPickups=function(){_ctPick();if(!G||!G.meteors)return;for(const m of G.meteors){if(!onScr(m.x,m.y,40))continue;const k=1-Math.min(1,m.t/1.4),r=Math.round(64/Z);
  bx.strokeStyle=(Math.floor(G.t*10)%2)?'#ff6a2a':'#ffe08a';bx.lineWidth=1;bx.beginPath();bx.ellipse(X(m.x)+.5,Y(m.y)+.5,r,r*.5,0,0,6.283);bx.stroke();
  bx.fillStyle='rgba(255,106,42,.25)';bx.beginPath();bx.ellipse(X(m.x),Y(m.y),r*k,r*.5*k,0,0,6.283);bx.fill()}};

// ---- new enemies: treasure goblin (flees, drops a coin purse) and splitter (splits on death) ----
Object.assign(ENEMY_TYPES,{
  goblin:{name:'Ink Goblin',title:'Thief of Coin',r:11,hp:60,speed:120,dmg:0,xp:6,col:'#d9c27a',beh:'flee'},
  splitter:{name:'Splitter',title:'Two of Everything',r:15,hp:40,speed:52,dmg:9,xp:3,col:'#6fc46a',beh:'swarm'},
  splitlet:{name:'Splitlet',title:'Half a Problem',r:9,hp:14,speed:70,dmg:5,xp:1,col:'#9fe08a',beh:'swarm'},
});
for(const k in ERAS){const er=ERAS[k];if(er.spawns&&!er.spawns.some(s=>s.type==='splitter'))er.spawns.push({type:'splitter',from:150,w:6})}
runHooks.push(G=>{G.goblinT=90+Math.random()*40});
CAVE_TICK.push(dt=>{if(G.netClient)return;G.goblinT-=dt;if(G.goblinT<=0){G.goblinT=130+Math.random()*60;const e=spawnEnemy('goblin',1+G.t/300);e.ttl=22;toast('An Ink Goblin! Catch it before it escapes')}
  for(const e of G.enemies)if(e.type==='goblin'){e.ttl-=dt;if(e.ttl<=0){e.hp=0;e.gone=true}}
  const before=G.enemies.length;G.enemies=G.enemies.filter(e=>!e.gone);if(G.enemies.length<before)toast('The goblin escaped')});
const _ctUE=updateEnemies;updateEnemies=function(dt){const gs=G.enemies.filter(e=>e.type==='goblin').map(e=>[e,e.x,e.y]);_ctUE(dt);
  const p=G.player;for(const [e,x,y] of gs){const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy)||1;const w=Math.sin(G.t*2+e.wob)*.6;e.x=x+(dx/d-dy/d*w)*e.speed*dt+e.kx*dt;e.y=y+(dy/d+dx/d*w)*e.speed*dt+e.ky*dt}};
killHooks.push(e=>{if(!G)return;if(e.type==='goblin'&&!e.gone){G.bonus=(G.bonus||0)+40;floatText(e.x,e.y-30,'+40 COINS','#d9c27a',1.5);burst(e.x,e.y,'#ffd34a',24);toast('Goblin caught! +40 coins')}
  if(e.type==='splitter')for(let i=0;i<2;i++)spawnEnemy('splitlet',1+G.t/300,{x:e.x+rnd(-14,14),y:e.y+rnd(-14,14)})});

// ---- new mage ----
MAGES.chrono={name:'Chrono Scribe',cost:800,pal:{h:'#2b4a5a',H:'#16303c',r:'#c9a54a',R:'#8a6e2a'},perk:'+0.8s slow-mo, -10% cast cooldown, focus refills faster. -15% max HP.',
  apply:G=>{const p=G.player;p.focus+=.8;G.focusLeft=p.focus;p.cdMul*=.9;p.maxHp*=.85;p.hp=p.maxHp;G.chronoMage=true}};
CAVE_TICK.push(dt=>{if(G.chronoMage&&!G.drawing)G.focusLeft=Math.min(G.player.focus,G.focusLeft+dt*.4)});

// ---- challenges (#/challenges) ----
const CHALLENGES={
  oneshape:{name:'One Shape',desc:'Only your first loadout weapon can be drawn. Coins x1.5.',coin:1.5,apply:G=>{G.loadout=G.loadout.slice(0,1)}},
  noheal:{name:'Iron Will',desc:'You cannot heal by any means. Coins x2.',coin:2,apply:G=>{G.noHeal=true}},
};
runHooks.push(G=>{const c=CHALLENGES[save.challenge];G.challenge=null;if(!c||G.daily)return;G.challenge=save.challenge;c.apply(G);setTimeout(()=>mode==='run'&&toast('Challenge: '+c.name),3400)});
CAVE_TICK.push(()=>{if(!G.noHeal)return;const p=G.player;if(G.lastHp!=null&&p.hp>G.lastHp)p.hp=G.lastHp;G.lastHp=p.hp});
const _ctCoins=calcCoins;calcCoins=function(){const c=_ctCoins();const ch=G&&CHALLENGES[G.challenge];return ch?Math.floor(c*ch.coin):c};
function challenges(){leaveRun();setRoute('challenges');
  show(sheet('Challenges','Harder rules, bigger rewards',`<div class="tbl">${Object.entries(CHALLENGES).map(([id,c],i)=>{const on=save.challenge===id;
    return `<button class="cell ${on?'on':''}" data-ch="${id}"><span class="cell-h"><b>0${i+1}</b>${on?'<i class="chk">&#9632; Active</i>':''}</span><span class="nm">${c.name}</span><span class="sh">${c.desc}</span><span class="st">${on?'Tap to turn off':'Tap to activate'}</span></button>`}).join('')}</div>
    <p class="sh">An active challenge applies to every normal run until you turn it off. Daily runs ignore it.</p>`));
  screenEl.querySelectorAll('[data-ch]').forEach(el=>el.onclick=()=>{const id=el.dataset.ch;save.challenge=save.challenge===id?null:id;persist();sfx('pick');challenges()});
  $('back').onclick=home}
hub('challenges','Challenges',challenges);

// ---- era clear bookkeeping: every era boss of this run must fall ----
killHooks.push(e=>{if(G&&e.bossKey){(G.bossKills||(G.bossKills={}))[e.bossKey]=1}});
CAVE_TICK.push(()=>{if(G.netClient||G.cleared||G.t<ERA_CLEAR_T+1||G.clearHint)return;if(!eraBossesDone()){G.clearHint=true;toast('Defeat every era boss to clear the era')}});
