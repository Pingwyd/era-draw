// ===== Interactive tutorial v2: action-gated steps in a safe sandbox (no real spawns, harmless dummies) =====
const tIn=(touch,key,pad)=>(document.body.classList.contains('pad')||(typeof navLast!=='undefined'&&navLast==='pad'))?pad:TUT_TOUCH?touch:key;
function tDummies(n,opt){const p=G.player;const out=[];for(let i=0;i<n;i++){const a=i/n*6.283+Math.random(),d=opt&&opt.d||170;
  const e=spawnEnemy(G.era.swarm,1,{x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d});e.dmg=0;e.speed=opt&&opt.speed||22;e.baseSpeed=e.speed;e.tutDummy=true;e.af=null;if(opt&&opt.hp){e.hp=e.maxHp=opt.hp}out.push(e)}return out}
let tBroke=0,tShatter=0;
const _tBrk=breakCreation;breakCreation=function(c,q){if(G&&G.tut&&!q)tBroke++;return _tBrk.apply(this,arguments)};
const _tSh=shatterCreation;shatterCreation=function(){if(G&&G.tut)tShatter++;return _tSh.apply(this,arguments)};
function tSteps(G){const lo=G.loadout.filter(id=>CREATIONS[id]);const steps=[
  {t:'Move',d:()=>tIn('Drag on the left half of the screen to walk.','Use WASD, or hold right-click, to walk.','Push the left stick to walk.'),done:(G,s)=>Math.hypot(G.player.x-s.x0,G.player.y-s.y0)>140}];
  lo.forEach((id,i)=>{const d=CREATIONS[id];steps.push({t:'Draw: '+d.name,setup:()=>{if(i===0)tDummies(3)},
    d:()=>tIn(`Draw a <b>${d.shape}</b> on the right half of the screen.`,`Left-drag a <b>${d.shape}</b> anywhere.`,save.padDraw?`Hold RT and trace a <b>${d.shape}</b> with the right stick.`:`Press ${['X','Y','B','RB'][i]} to cast ${d.name}. (Pen drawing: Settings &rarr; Access.)`),
    done:G=>G.creations.some(c=>c.id===id||c.def.base===id)})});
  steps.push(
  {t:'Auto-attack &amp; durability',setup:()=>tDummies(6,{hp:30}),d:()=>'Weapons fight on their own. The bar under each one shows its wear. When it breaks, just draw it again.',done:(G,s)=>tBroke>0||s.tt>12},
  {t:'Switching shatters',d:()=>'Drawing a <b>different</b> weapon type shatters the ones you have. Draw something different now.',done:(G,s)=>tShatter>0||s.tt>15},
  {t:'Dash',setup:()=>tDummies(4,{speed:60}),d:()=>tIn('Double-tap to dash through danger.','Press Space to dash.','Press A to dash.'),done:G=>G.player.dashCd>0},
  {t:'XP &amp; level-ups',setup:G=>{const p=G.player;G.orbs.push({x:p.x+30,y:p.y,v:G.xpNext+1,t:0})},d:()=>'Grab the gem to level up. <b>Skills</b> (gold, max 5 per run) are your big upgrades. <b>Minis</b> stack without limit.',done:G=>G.level>=2&&!screenEl.querySelector('.pick')},
  {t:'Timed power-ups',setup:G=>{const p=G.player;dropTimed(p.x+50,p.y)},d:()=>'Glowing pickups give a short burst of power, from 1 to 10 seconds. Grab one.',done:(G,s)=>G.timedSeen||s.tt>12},
  {t:'Chests',setup:G=>{const p=G.player;G.chests.push({x:p.x+70,y:p.y-20,boss:false})},d:()=>'Walk into the chest. It holds 1 or 3 rewards.',done:(G,s)=>(s.c0!=null?save.stats.chests>s.c0:(s.c0=save.stats.chests,false))&&!$('rok')},
  {t:'Shrines &amp; breakables',setup:G=>{const p=G.player,ts=ERA_PROPS[CURRENT_ERA]||ERA_PROPS.stone;G.props.push({x:p.x-80,y:p.y,type:ts[0],hp:3,maxHp:3,cd:0});const ks=Object.keys(SHRINES);G.shrines.push({x:p.x+110,y:p.y+40,k:ks[0],prog:0,t:0})},
    d:()=>'Breakables drop loot, and your weapons hit them when no enemy is near. Stand in a shrine to charge a blessing.',done:(G,s)=>G.props.some(k=>k.dead)||s.tt>15},
  {t:'Targeting',setup:()=>tDummies(3,{hp:200,d:120}),d:()=>tIn('Tap an enemy to lock your attacks onto it.','Click an enemy, or press Tab to cycle targets (bosses first).','Point the right stick at an enemy, or press R3 to cycle.'),done:(G,s)=>!!G.lock||s.tt>15},
  {t:'Bosses &amp; clearing an era',d:()=>'Bosses arrive at set times. To clear an era, reach <b>10:00</b> and defeat <b>every era boss</b>. Good luck!',done:(G,s)=>s.tt>8});
  return steps}
runHooks.push(G=>{if(!G.tut)return;TUT.length=0;TUT.push(...tSteps(G));G.tut.setI=-1;tBroke=0;tShatter=0});
const _tSpawn=updateSpawns;updateSpawns=function(dt){if(G&&G.tut)return;return _tSpawn(dt)};
CAVE_TICK.push(dt=>{const s=G.tut;if(!s){if(G.tutWas){G.tutWas=0;for(const e of G.enemies)if(e.tutDummy){e.hp=0;e.gone=true}}return}
  G.tutWas=1;G.t=Math.min(G.t,3);G.player.invul=Math.max(G.player.invul,.5);G.shrineT=999;G.propT=999;G.mapChestT=999;G.pickT=999;
  if(s.setI!==s.i){s.setI=s.i;const st=TUT[s.i];if(st&&st.setup)st.setup(G,s)}
  if(s.i>1&&G.enemies.filter(e=>e.tutDummy).length<2)tDummies(2)});
const _tHow=how;how=function(){_tHow();const sh=screenEl.querySelector('.sheet');if(!sh)return;const b=document.createElement('button');b.className='btn pri';b.id='tutReplay';b.textContent='Replay interactive tutorial';
  const h2=sh.querySelector('h2');(h2||sh.firstChild).after(b);b.onclick=()=>{if(window.goLandscape)goLandscape();tutorial()}};
