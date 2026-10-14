'use strict';
// ================= CONFIG =================
const ERAS = {
  stone: { name:'Stone Age', durability:1.0, enemyHp:1.0, enemyDmg:1.0, ground:'#2a2019', ink:'#ffb35c' },
  // Later eras: weapons last longer, enemies hit harder. Older-era weapons do OLD_ERA_DMG.
  bronze:{ name:'Bronze Age', durability:1.6, enemyHp:1.8, enemyDmg:1.5, ground:'#2b2416', ink:'#e8c070' },
  iron:  { name:'Iron Age',   durability:2.2, enemyHp:2.8, enemyDmg:2.0, ground:'#1f2226', ink:'#b8d0ff' },
};
const ERA_ORDER = ['stone','bronze','iron'];
const OLD_ERA_DMG = 0.65;
const CURRENT_ERA = 'stone';

// shape: how to draw it. life = seconds before breaking, uses = hits before breaking
const CREATIONS = {
  club:  { name:'Club', icon:'🪵', era:'stone', shape:'short line', kind:'melee', dmg:14, life:9,  uses:30, rate:0.55, range:70, knock:260, cost:0 },
  spear: { name:'Spear', icon:'🗡️', era:'stone', shape:'long line', kind:'ranged', dmg:16, life:10, uses:14, rate:0.9, speed:620, pierce:4, cost:0 },
  rock:  { name:'Rock', icon:'🪨', era:'stone', shape:'circle', kind:'ranged', dmg:20, life:10, uses:10, rate:1.4, speed:380, aoe:70, cost:0 },
  sling: { name:'Sling', icon:'🪃', era:'stone', shape:'V shape', kind:'ranged', dmg:7, life:11, uses:40, rate:0.28, speed:720, pierce:1, cost:150 },
  dagger:{ name:'Bone Dagger', icon:'🦴', era:'stone', shape:'zigzag', kind:'melee', dmg:8, life:10, uses:60, rate:0.22, range:46, knock:60, cost:250, orbitSpeed:5 },
};
const MAX_ACTIVE = 5;
const BASE_CAST_CD = 0.6;
const BASE_FOCUS = 2.0, MAX_FOCUS = 2.8;
const SLOWMO = 0.22;

const POWERUPS = [
  {id:'ink',  name:'Sharper Ink', icon:'✒️', base:'common', desc:r=>`+${[10,16,24][r]}% creation damage`, apply:(p,r)=>p.dmgMul*=1+[.10,.16,.24][r]},
  {id:'quick',name:'Quick Sketch',icon:'⚡', base:'common', desc:r=>`-${[10,15,22][r]}% cast cooldown`, apply:(p,r)=>p.cdMul*=1-[.10,.15,.22][r]},
  {id:'swift',name:'Swift Step',  icon:'👣', base:'common', desc:r=>`+${[8,12,18][r]}% move speed`, apply:(p,r)=>p.speed*=1+[.08,.12,.18][r]},
  {id:'iron', name:'Iron Skin',   icon:'🛡️', base:'common', desc:r=>`+${[10,18,28][r]}% max HP & heal`, apply:(p,r)=>{const m=1+[.10,.18,.28][r];p.maxHp*=m;p.hp=Math.min(p.maxHp,p.hp*m+15)}},
  {id:'magnet',name:'Pickup Magnet',icon:'🧲',base:'common', desc:r=>`+${[35,55,90][r]}% pickup range`, apply:(p,r)=>p.magnet*=1+[.35,.55,.9][r]},
  {id:'heavy',name:'Heavy Hand',  icon:'🔨', base:'common', desc:r=>`+${[15,25,40][r]}% creation durability`, apply:(p,r)=>p.durMul*=1+[.15,.25,.40][r]},
  {id:'focus',name:'Deep Focus',  icon:'🌀', base:'rare',   desc:r=>`+${[.3,.4,.6][r]}s slow-mo (cap ${MAX_FOCUS}s)`, apply:(p,r)=>p.focus=Math.min(MAX_FOCUS,p.focus+[.3,.4,.6][r])},
  {id:'homing',name:'Homing Will',icon:'🎯', base:'rare',   desc:r=>`Projectiles home ${['slightly','well','fiercely'][r]}`, apply:(p,r)=>p.homing+=[1.5,2.5,4][r]},
  {id:'echo', name:'Echo Stroke', icon:'👥', base:'rare',   desc:r=>`${[15,20,30][r]}% chance a creation spawns twice`, apply:(p,r)=>p.echo=Math.min(.6,p.echo+[.15,.20,.30][r])},
  {id:'wind', name:'Second Wind', icon:'🕊️', base:'epic',   once:true, desc:()=>`Once per run, survive a fatal hit at 1 HP`, apply:p=>p.secondWind=true},
];
const RAR = ['common','rare','epic'];

const SHOP = [
  {id:'sling', type:'creation', cost:150, cur:'coins'},
  {id:'dagger',type:'creation', cost:250, cur:'coins'},
  {id:'slot4', type:'slot', name:'4th Loadout Slot', icon:'🎒', cost:400, cur:'coins'},
  {id:'dbl',   type:'stub', name:'Double Coins (1 run)', icon:'✨', cost:5, cur:'gems', note:'or watch an ad — coming soon'},
  {id:'skin',  type:'stub', name:'Skin: Cave Mage', icon:'🧙', cost:50, cur:'gems', note:'cosmetic — coming soon'},
];

// ================= SAVE =================
const SAVE_KEY='eradraw.save.v1';
let save=loadSave();
function loadSave(){
  const d={coins:0,gems:0,owned:['club','spear','rock'],loadout:['club','spear','rock'],slots:3,best:0,runs:0};
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s)return Object.assign(d,s)}catch(e){}
  return d;
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}}

// ================= CANVAS =================
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();
const $=id=>document.getElementById(id);
const screenEl=$('screen');
const rnd=(a,b)=>a+Math.random()*(b-a);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

// ================= SHAPE RECOGNITION =================
// Returns creation id or null. Works in screen pixels, normalized by screen size.
function recognize(pts){
  if(pts.length<4)return null;
  let L=0,minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
  for(let i=0;i<pts.length;i++){const p=pts[i];if(i)L+=Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y);minx=Math.min(minx,p.x);maxx=Math.max(maxx,p.x);miny=Math.min(miny,p.y);maxy=Math.max(maxy,p.y)}
  const unit=Math.min(W,H);
  if(L<unit*0.06)return null;
  const a=pts[0],b=pts[pts.length-1],chord=Math.hypot(b.x-a.x,b.y-a.y);
  const straight=chord/L, bw=maxx-minx, bh=maxy-miny;
  // resample & count sharp turns
  const rs=resample(pts,32);let turns=0,totalTurn=0;
  const angs=[];for(let i=1;i<rs.length;i++)angs.push(Math.atan2(rs[i].y-rs[i-1].y,rs[i].x-rs[i-1].x));
  for(let i=1;i<angs.length;i++){let d=angs[i]-angs[i-1];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;totalTurn+=d;}
  // corners: compare direction over windows of 3
  for(let i=3;i<angs.length-3;i++){let d=Math.abs(angs[i+2]-angs[i-2]);if(d>Math.PI)d=2*Math.PI-d;if(d>1.7){turns++;i+=4}}
  const closed=chord<L*0.3, round=Math.min(bw,bh)>Math.max(bw,bh)*0.45;
  if(straight>0.85){ return L<unit*0.28?'club':'spear'; }
  if(closed&&round&&Math.abs(totalTurn)>4.2)return 'rock';
  if(turns===1&&!closed)return 'sling';
  if(turns>=2&&!closed)return 'dagger';
  if(closed&&round)return 'rock';
  return null;
}
function resample(pts,n){
  let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
  const I=L/(n-1);let D=0;const out=[pts[0]];const p=pts.map(q=>({x:q.x,y:q.y}));
  for(let i=1;i<p.length;i++){const d=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
    if(D+d>=I&&d>0){const t=(I-D)/d,q={x:p[i-1].x+t*(p[i].x-p[i-1].x),y:p[i-1].y+t*(p[i].y-p[i-1].y)};out.push(q);p.splice(i,0,q);D=0}else D+=d}
  while(out.length<n)out.push(pts[pts.length-1]);return out;
}

// ================= GAME STATE =================
let G=null; // current run
let mode='home';
function newRun(){
  const era=ERAS[CURRENT_ERA];
  G={t:0,wave:1,kills:0,coins:0,spawnT:0,level:1,xp:0,xpNext:5,ink:[],trails:[],
    player:{x:0,y:0,r:16,hp:100,maxHp:100,speed:190,dmgMul:1,cdMul:1,durMul:1,focus:BASE_FOCUS,homing:0,echo:0,magnet:90,secondWind:false,usedWind:false,invul:0,face:0},
    picks:{},enemies:[],creations:[],shots:[],orbs:[],fx:[],texts:[],castCd:0,focusLeft:BASE_FOCUS,drawing:null,
    era, loadout:save.loadout.slice(),paused:false,shake:0,dbl:false};
}

// ================= INPUT =================
const stick={id:null,ox:0,oy:0,x:0,y:0,active:false};
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key==='Escape'&&mode==='run')togglePause()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
cv.addEventListener('pointerdown',e=>{
  if(mode!=='run'||G.paused)return;
  cv.setPointerCapture(e.pointerId);
  const isMouse=e.pointerType==='mouse';
  if(!isMouse&&e.clientX<W*0.5&&stick.id===null){Object.assign(stick,{id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY,active:true});return}
  if(!G.drawing&&(isMouse||e.clientX>=W*0.5)){G.drawing={id:e.pointerId,pts:[{x:e.clientX,y:e.clientY}]};}
});
cv.addEventListener('pointermove',e=>{
  if(mode!=='run')return;
  if(e.pointerId===stick.id){stick.x=e.clientX;stick.y=e.clientY}
  else if(G.drawing&&G.drawing.id===e.pointerId){const pts=G.drawing.pts,l=pts[pts.length-1];if(Math.hypot(e.clientX-l.x,e.clientY-l.y)>3)pts.push({x:e.clientX,y:e.clientY})}
});
const endPtr=e=>{
  if(mode!=='run')return;
  if(e.pointerId===stick.id){stick.id=null;stick.active=false}
  else if(G.drawing&&G.drawing.id===e.pointerId){finishDraw();}
};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('contextmenu',e=>e.preventDefault());

function finishDraw(){
  const d=G.drawing;G.drawing=null;
  const id=recognize(d.pts);
  const pts=d.pts.slice();
  if(!id){fizzle(pts,'?');return}
  if(!G.loadout.includes(id)){fizzle(pts,CREATIONS[id].name+' not in loadout');return}
  if(G.castCd>0){fizzle(pts,'recharging…');return}
  const a=pts[0],b=pts[pts.length-1];
  const dir=Math.atan2(b.y-a.y,b.x-a.x);
  spawnCreation(id,dir);
  if(Math.random()<G.player.echo){setTimeout(()=>G&&spawnCreation(id,dir+0.4,true),150)}
  G.castCd=BASE_CAST_CD*G.player.cdMul;
  G.trails.push({pts,life:0.7,max:0.7,ok:true});
  G.focusLeft=Math.min(G.player.focus,G.focusLeft+0.6);
}
function fizzle(pts,msg){G.trails.push({pts,life:0.5,max:0.5,ok:false});floatText(G.player.x,G.player.y-30,msg,'#ff8a8a')}

// ================= CREATIONS =================
function creationDmgMul(def){const ei=ERA_ORDER.indexOf(def.era),ci=ERA_ORDER.indexOf(CURRENT_ERA);return ei<ci?OLD_ERA_DMG:1}
function spawnCreation(id,dir,echo){
  const def=CREATIONS[id],p=G.player;
  if(G.creations.length>=MAX_ACTIVE){G.creations.sort((a,b)=>a.life/a.max-b.life/b.max);breakCreation(G.creations[0])}
  const dur=G.era.durability*p.durMul;
  const c={id,def,life:def.life*dur,max:def.life*dur,uses:Math.round(def.uses*dur),maxUses:Math.round(def.uses*dur),cd:0.15,
    ang:Math.random()*6.28,x:p.x,y:p.y,swing:0,dir};
  G.creations.push(c);
  if(id==='spear')fireShot(c,dir); // first throw goes where you drew
  burst(p.x,p.y,G.era.ink,14);
  floatText(p.x,p.y-34,(echo?'Echo ':'')+def.name+'!',G.era.ink);
}
function breakCreation(c){const i=G.creations.indexOf(c);if(i>=0)G.creations.splice(i,1);burst(c.x,c.y,'#cfc3a8',10);floatText(c.x,c.y-10,'broke','#cfc3a8')}
function nearestEnemy(x,y,maxD=9e9,skip){let best=null,bd=maxD;for(const e of G.enemies){if(skip&&skip.has(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;best=e}}return best}
function fireShot(c,ang){
  const def=c.def;
  G.shots.push({x:c.x,y:c.y,vx:Math.cos(ang)*def.speed,vy:Math.sin(ang)*def.speed,id:c.id,def,pierce:def.pierce||1,hit:new Set(),life:1.4,
    dmg:def.dmg*G.player.dmgMul*creationDmgMul(def),aoe:def.aoe||0,rot:ang});
  c.uses--;
}
function updateCreations(dt){
  const p=G.player;
  for(const c of G.creations.slice()){
    c.life-=dt;c.cd-=dt;c.swing=Math.max(0,c.swing-dt*4);
    const def=c.def;
    if(def.kind==='melee'){
      const os=def.orbitSpeed||2.2;c.ang+=os*dt;
      const rad=def.id==='dagger'?44:58;
      c.x=p.x+Math.cos(c.ang)*rad;c.y=p.y+Math.sin(c.ang)*rad;
      if(c.cd<=0){
        const targets=G.enemies.filter(e=>Math.hypot(e.x-c.x,e.y-c.y)<def.range+e.r);
        if(targets.length){
          c.cd=def.rate;c.swing=1;
          for(const e of targets.slice(0,c.id==='club'?6:2)){
            hurtEnemy(e,def.dmg*p.dmgMul*creationDmgMul(def));
            const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*def.knock;e.ky+=Math.sin(a)*def.knock;
          }
          c.uses--; if(c.id==='club'){G.shake=Math.max(G.shake,4);ring(c.x,c.y,def.range,'#ffb35c')}
        }
      }
    }else{
      // ranged: hover near player and auto-fire at nearest
      const k=G.creations.indexOf(c);c.ang+=dt*0.8;
      const tx=p.x+Math.cos(c.ang+k*1.3)*34,ty=p.y-30+Math.sin(c.ang+k*1.3)*12;
      c.x+=(tx-c.x)*Math.min(1,dt*6);c.y+=(ty-c.y)*Math.min(1,dt*6);
      if(c.cd<=0){const e=nearestEnemy(c.x,c.y,520);if(e){c.cd=def.rate;fireShot(c,Math.atan2(e.y-c.y,e.x-c.x))}}
    }
    if(c.life<=0||c.uses<=0)breakCreation(c);
  }
}
function updateShots(dt){
  for(let i=G.shots.length-1;i>=0;i--){
    const s=G.shots[i];s.life-=dt;
    if(G.player.homing>0){const e=nearestEnemy(s.x,s.y,260,s.hit);if(e){const want=Math.atan2(e.y-s.y,e.x-s.x),sp=Math.hypot(s.vx,s.vy);let cur=Math.atan2(s.vy,s.vx),d=want-cur;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;cur+=clamp(d,-1,1)*G.player.homing*dt;s.vx=Math.cos(cur)*sp;s.vy=Math.sin(cur)*sp}}
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.rot=Math.atan2(s.vy,s.vx);
    let dead=s.life<=0;
    for(const e of G.enemies){
      if(s.hit.has(e))continue;
      if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+(s.id==='rock'?12:7)){
        s.hit.add(e);
        if(s.aoe){for(const o of G.enemies)if(Math.hypot(o.x-s.x,o.y-s.y)<s.aoe)hurtEnemy(o,s.dmg);ring(s.x,s.y,s.aoe,'#d8c7a0');G.shake=Math.max(G.shake,3);dead=true;break}
        hurtEnemy(e,s.dmg);e.kx+=s.vx*0.12;e.ky+=s.vy*0.12;
        if(--s.pierce<=0){dead=true;break}
      }
    }
    if(dead)G.shots.splice(i,1);
  }
}

// ================= ENEMIES =================
const ENEMY_TYPES={
  grub:  {name:'Mud Grub',r:13,hp:14,speed:62,dmg:8,xp:1,col:'#7d9a4a'},
  raptor:{name:'Raptorling',r:12,hp:10,speed:118,dmg:7,xp:1,col:'#c46a3a',min:40},
  brute: {name:'Cave Brute',r:24,hp:70,speed:46,dmg:18,xp:4,col:'#8a6d5a',min:75},
  mammoth:{name:'Woolly Elder',r:40,hp:600,speed:40,dmg:30,xp:25,col:'#a07850',boss:true},
};
function spawnEnemy(type,scale){
  const T=ENEMY_TYPES[type],p=G.player,a=Math.random()*6.283,R=Math.hypot(W,H)/2+60;
  G.enemies.push({type,T,x:p.x+Math.cos(a)*R,y:p.y+Math.sin(a)*R,r:T.r,hp:T.hp*scale*G.era.enemyHp,maxHp:T.hp*scale*G.era.enemyHp,
    speed:T.speed*(1+Math.min(.5,G.t/600)),dmg:T.dmg*G.era.enemyDmg*(1+G.t/300),kx:0,ky:0,flash:0,wob:Math.random()*6});
}
function updateSpawns(dt){
  G.wave=1+Math.floor(G.t/30);
  const scale=1+G.t/90;
  const rate=0.9+G.t/14; // enemies per second
  G.spawnT+=dt*rate;
  const cap=40+G.wave*12;
  while(G.spawnT>=1){G.spawnT-=1;if(G.enemies.length>=cap)continue;
    const r=Math.random();let type='grub';
    if(G.t>ENEMY_TYPES.brute.min&&r<0.12)type='brute';else if(G.t>ENEMY_TYPES.raptor.min&&r<0.45)type='raptor';
    spawnEnemy(type,scale);}
  if(!G.bossAt)G.bossAt=180;
  if(G.t>=G.bossAt){G.bossAt+=180;spawnEnemy('mammoth',scale);toast('A Woolly Elder approaches!')}
}
function hurtEnemy(e,d){
  if(e.hp<=0)return;
  e.hp-=d;e.flash=0.1;
  floatText(e.x+rnd(-6,6),e.y-e.r,Math.round(d),'#fff2c4',0.5,12);
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  const i=G.enemies.indexOf(e);if(i>=0)G.enemies.splice(i,1);
  G.kills++;burst(e.x,e.y,e.T.col,e.T.boss?40:8);
  G.ink.push({x:e.x,y:e.y,r:e.r*rnd(.8,1.4),a:.35});if(G.ink.length>120)G.ink.shift();
  G.orbs.push({x:e.x,y:e.y,v:e.T.xp,t:0});
}
function updateEnemies(dt){
  const p=G.player;
  for(const e of G.enemies){
    const a=Math.atan2(p.y-e.y,p.x-e.x);
    e.x+=(Math.cos(a)*e.speed+e.kx)*dt;e.y+=(Math.sin(a)*e.speed+e.ky)*dt;
    e.kx*=Math.pow(0.02,dt);e.ky*=Math.pow(0.02,dt);e.flash-=dt;e.wob+=dt*8;
    const d=Math.hypot(p.x-e.x,p.y-e.y);
    if(d<p.r+e.r&&p.invul<=0){damagePlayer(e.dmg);}
    // despawn very far
    if(d>Math.hypot(W,H)*1.3&&!e.T.boss){const R=Math.hypot(W,H)/2+40,b=Math.random()*6.283;e.x=p.x+Math.cos(b)*R;e.y=p.y+Math.sin(b)*R}
  }
  // light separation
  const es=G.enemies;for(let i=0;i<es.length;i++)for(let j=i+1;j<Math.min(es.length,i+12);j++){const A=es[i],B=es[j],dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||1,m=A.r+B.r;if(d<m){const push=(m-d)/2/d;A.x-=dx*push;A.y-=dy*push;B.x+=dx*push;B.y+=dy*push}}
}
function damagePlayer(d){
  const p=G.player;p.hp-=d;p.invul=0.5;G.shake=8;burst(p.x,p.y,'#ff6b6b',10);
  if(p.hp<=0){
    if(p.secondWind&&!p.usedWind){p.usedWind=true;p.hp=1;p.invul=2;toast('Second Wind!');ring(p.x,p.y,200,'#fff');for(const e of G.enemies){const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*500;e.ky+=Math.sin(a)*500}}
    else endRun();
  }
}

// ================= XP / LEVEL =================
function updateOrbs(dt){
  const p=G.player;
  for(let i=G.orbs.length-1;i>=0;i--){const o=G.orbs[i];o.t+=dt;const d=Math.hypot(p.x-o.x,p.y-o.y);
    if(d<p.magnet||o.pull){o.pull=true;const a=Math.atan2(p.y-o.y,p.x-o.x),sp=300+o.t*200;o.x+=Math.cos(a)*sp*dt;o.y+=Math.sin(a)*sp*dt}
    if(d<p.r+6){G.orbs.splice(i,1);G.xp+=o.v;if(G.xp>=G.xpNext){G.xp-=G.xpNext;G.level++;G.xpNext=Math.round(5+G.level*3.2+Math.pow(G.level,1.5));levelUp()}}}
  if(G.orbs.length>250)G.orbs.splice(0,G.orbs.length-250);
}
function rollRarity(epicOk){
  const minutes=G.t/60;let we=minutes>=2?14:4;if(!epicOk)we=0;
  const r=Math.random()*(60+30+we);return r<60?0:r<90?1:2;
}
function rollPicks(){
  const out=[];let epicUsed=false;let tries=0;
  while(out.length<3&&tries++<60){
    const pu=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
    if(out.find(o=>o.pu===pu))continue;
    if(pu.once&&G.picks[pu.id])continue;
    const owned=G.picks[pu.id]||0;
    let r=pu.base==='epic'?2:Math.max(RAR.indexOf(pu.base),rollRarity(!epicUsed));
    if(owned>=2&&pu.base!=='epic')r=Math.max(r,1); // repeat picks upgrade rarity
    if(r===2&&epicUsed){if(pu.base==='epic')continue;r=1}
    if(r===2&&pu.base==='epic'&&G.t<120&&Math.random()<0.7)continue;
    if(r===2)epicUsed=true;
    out.push({pu,r});
  }
  return out;
}
function levelUp(){
  G.paused=true;stick.id=null;stick.active=false;G.drawing=null;
  const picks=rollPicks();
  screenEl.innerHTML=`<div class="panel picks"><h2>Level ${G.level}!</h2><div class="sub">Choose an upgrade for this run</div>${picks.map((k,i)=>`<div class="card ${RAR[k.r]}" data-i="${i}"><span class="tag">${RAR[k.r]}</span><b>${k.pu.icon} ${k.pu.name}</b>${k.pu.desc(k.r)}</div>`).join('')}</div>`;
  screenEl.querySelectorAll('.card').forEach(el=>el.onclick=()=>{const k=picks[+el.dataset.i];k.pu.apply(G.player,k.r);G.picks[k.pu.id]=(G.picks[k.pu.id]||0)+1;screenEl.innerHTML='';G.paused=false;last=performance.now()});
}

// ================= FX =================
function burst(x,y,col,n){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=rnd(40,220);G.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.7),max:.7,col,r:rnd(1.5,4)})}}
function ring(x,y,r,col){G.fx.push({ring:true,x,y,r,life:.35,max:.35,col})}
function floatText(x,y,txt,col,life=0.9,size=15){G.texts.push({x,y,txt,col,life,max:life,size});if(G.texts.length>80)G.texts.shift()}
let toastT=0;function toast(m){const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>t.style.opacity=0,1600)}
function updateFx(dt){
  for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];f.life-=dt;if(!f.ring){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92}if(f.life<=0)G.fx.splice(i,1)}
  for(let i=G.texts.length-1;i>=0;i--){const t=G.texts[i];t.life-=dt;t.y-=30*dt;if(t.life<=0)G.texts.splice(i,1)}
  for(let i=G.trails.length-1;i>=0;i--){G.trails[i].life-=dt;if(G.trails[i].life<=0)G.trails.splice(i,1)}
}

// ================= LOOP =================
let last=performance.now();
function frame(now){
  const realDt=Math.min(0.05,(now-last)/1000);last=now;
  if(mode==='run'&&G&&!G.paused){
    let scale=1;
    if(G.drawing&&G.focusLeft>0){scale=SLOWMO;G.focusLeft-=realDt}
    else if(!G.drawing)G.focusLeft=Math.min(G.player.focus,G.focusLeft+realDt*0.5);
    G.slow=scale<1;
    step(realDt*scale,realDt);
  }
  render(realDt);
  requestAnimationFrame(frame);
}
function step(dt,realDt){
  const p=G.player;G.t+=dt;G.castCd-=realDt;p.invul-=dt;G.shake=Math.max(0,G.shake-realDt*30);
  let mx=0,my=0;
  if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;
  if(stick.active){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.hypot(dx,dy);if(d>6){const k=Math.min(1,d/55);mx=dx/d*k;my=dy/d*k}}
  const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m}
  p.x+=mx*p.speed*dt;p.y+=my*p.speed*dt;if(m>0.1)p.face=Math.atan2(my,mx);p.moving=m>0.1;
  updateSpawns(dt);updateEnemies(dt);if(mode!=='run')return;updateCreations(dt);updateShots(dt);updateOrbs(dt);updateFx(dt);
  G.coins=calcCoins();updateHud();
}
function calcCoins(){let c=10+G.t*0.25+G.kills*0.1;if(G.picks.coin)c*=1.25;if(G.dbl)c*=2;return Math.floor(c)}

// ================= RENDER =================
const cam={x:0,y:0};
function render(dt){
  ctx.fillStyle='#120d1f';ctx.fillRect(0,0,W,H);
  if(mode!=='run'||!G){drawMenuBg(dt);return}
  const p=G.player;cam.x+=(p.x-cam.x)*0.15;cam.y+=(p.y-cam.y)*0.15;
  const sx=(Math.random()-.5)*G.shake,sy=(Math.random()-.5)*G.shake;
  ctx.save();ctx.translate(W/2-cam.x+sx,H/2-cam.y+sy);
  drawGround();
  for(const s of G.ink){ctx.fillStyle=`rgba(10,6,20,${s.a})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}
  for(const o of G.orbs){ctx.fillStyle=o.v>3?'#ffd98a':'#9d8cff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(o.x,o.y,o.v>3?6:4,0,6.283);ctx.fill()}
  ctx.shadowBlur=0;
  for(const e of G.enemies)drawEnemy(e);
  drawPlayer(p);
  for(const c of G.creations)drawCreation(c);
  for(const s of G.shots)drawShot(s);
  for(const f of G.fx){const a=f.life/f.max;if(f.ring){ctx.strokeStyle=f.col;ctx.globalAlpha=a;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1.2-a*.5),0,6.283);ctx.stroke()}else{ctx.globalAlpha=a;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.283);ctx.fill()}}
  ctx.globalAlpha=1;
  for(const t of G.texts){ctx.globalAlpha=Math.min(1,t.life/t.max*2);ctx.fillStyle=t.col;ctx.font=`bold ${t.size}px Georgia`;ctx.textAlign='center';ctx.strokeStyle='#0009';ctx.lineWidth=3;ctx.strokeText(t.txt,t.x,t.y);ctx.fillText(t.txt,t.x,t.y)}
  ctx.globalAlpha=1;ctx.restore();
  // slow-mo vignette
  if(G.slow){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.7);g.addColorStop(0,'rgba(60,40,120,0)');g.addColorStop(1,'rgba(60,40,140,.55)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  // trails (screen space)
  for(const tr of G.trails)drawStroke(tr.pts,tr.ok?G.era.ink:'#ff6b6b',tr.life/tr.max);
  if(G.drawing)drawStroke(G.drawing.pts,'#fff4d6',1,true);
  // focus meter
  const fw=120,fx=W-fw-14,fy=H-24-(window.visualViewport?0:0);
  ctx.fillStyle='#0008';ctx.fillRect(fx,fy,fw,8);ctx.fillStyle='#9d8cff';ctx.fillRect(fx,fy,fw*clamp(G.focusLeft/G.player.focus,0,1),8);
  ctx.fillStyle=G.castCd>0?'#ff8a8a':'#f3e9d2';ctx.font='11px Georgia';ctx.textAlign='right';ctx.fillText(G.castCd>0?'recharging':'FOCUS · draw here',W-14,fy-5);
  // stick
  if(stick.active){ctx.strokeStyle='#f3e9d255';ctx.lineWidth=2;ctx.beginPath();ctx.arc(stick.ox,stick.oy,55,0,6.283);ctx.stroke();const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.min(55,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);ctx.fillStyle='#f3e9d288';ctx.beginPath();ctx.arc(stick.ox+Math.cos(a)*d,stick.oy+Math.sin(a)*d,22,0,6.283);ctx.fill()}
  else if(G.t<8){ctx.fillStyle='#f3e9d255';ctx.font='14px Georgia';ctx.textAlign='center';ctx.fillText('← move here',W*.25,H-60);ctx.fillText('draw here →',W*.75,H-60);ctx.fillStyle='#f3e9d222';ctx.fillRect(W/2-1,H*.3,2,H*.5)}
}
function drawGround(){
  const g=40*4,x0=Math.floor((cam.x-W/2)/g)*g,y0=Math.floor((cam.y-H/2)/g)*g;
  ctx.fillStyle=G.era.ground;ctx.fillRect(cam.x-W/2-20,cam.y-H/2-20,W+40,H+40);
  for(let x=x0;x<cam.x+W/2+g;x+=g)for(let y=y0;y<cam.y+H/2+g;y+=g){
    const h=Math.sin(x*12.9898+y*78.233)*43758.5453,f=h-Math.floor(h);
    ctx.fillStyle=`rgba(255,220,170,${0.03+f*0.03})`;ctx.beginPath();ctx.arc(x+f*g,y+((f*7)%1)*g,2+f*6,0,6.283);ctx.fill();
    if(f>.82){ctx.strokeStyle='rgba(120,160,80,.25)';ctx.lineWidth=2;const gx=x+((f*13)%1)*g,gy=y+((f*3)%1)*g;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx-3,gy-9);ctx.moveTo(gx,gy);ctx.lineTo(gx+4,gy-8);ctx.stroke()}
  }
}
function drawPlayer(p){
  const t=G.t;ctx.save();ctx.translate(p.x,p.y);
  if(p.invul>0&&Math.floor(t*20)%2)ctx.globalAlpha=.5;
  ctx.fillStyle='rgba(157,140,255,.06)';ctx.beginPath();ctx.arc(0,0,p.magnet,0,6.283);ctx.fill();
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,14,14,5,0,0,6.283);ctx.fill();
  const bob=p.moving?Math.sin(t*14)*2:0;
  ctx.fillStyle='#3b2b6e';ctx.beginPath();ctx.moveTo(-13,14);ctx.lineTo(13,14);ctx.lineTo(7,-6+bob);ctx.lineTo(-7,-6+bob);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f0d2b0';ctx.beginPath();ctx.arc(0,-9+bob,7,0,6.283);ctx.fill();
  ctx.fillStyle='#4b3bd6';ctx.beginPath();ctx.moveTo(-14,-10+bob);ctx.lineTo(14,-10+bob);ctx.lineTo(Math.cos(p.face)*6,-34+bob);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd98a';ctx.beginPath();ctx.arc(Math.cos(p.face)*6,-34+bob,3,0,6.283);ctx.fill();
  ctx.strokeStyle='#ffd98a';ctx.shadowColor='#ffd98a';ctx.shadowBlur=G.slow?20:8;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10,10);ctx.lineTo(16,-12+bob);ctx.stroke();
  ctx.restore();
}
function drawEnemy(e){
  ctx.save();ctx.translate(e.x,e.y);const s=1+Math.sin(e.wob)*.05;
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,e.r*.8,e.r,e.r*.35,0,0,6.283);ctx.fill();
  ctx.fillStyle=e.flash>0?'#fff':e.T.col;ctx.strokeStyle='#120d1f';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,0,e.r*s,e.r/s,0,0,6.283);ctx.fill();ctx.stroke();
  const a=Math.atan2(G.player.y-e.y,G.player.x-e.x);
  ctx.fillStyle='#ffe9a8';for(const o of[-.4,.4]){ctx.beginPath();ctx.arc(Math.cos(a+o)*e.r*.5,Math.sin(a+o)*e.r*.5,e.r*.16,0,6.283);ctx.fill()}
  if(e.type==='mammoth'){ctx.strokeStyle='#f3e9d2';ctx.lineWidth=5;ctx.beginPath();ctx.arc(Math.cos(a)*e.r*.9,Math.sin(a)*e.r*.9,e.r*.5,a-1,a+1);ctx.stroke()}
  if(e.hp<e.maxHp){ctx.fillStyle='#0009';ctx.fillRect(-e.r,-e.r-9,e.r*2,4);ctx.fillStyle='#ff6b6b';ctx.fillRect(-e.r,-e.r-9,e.r*2*e.hp/e.maxHp,4)}
  ctx.restore();
}
function drawCreation(c){
  ctx.save();ctx.translate(c.x,c.y);
  const frac=Math.min(c.life/c.max,c.uses/c.maxUses);
  ctx.shadowColor=G.era.ink;ctx.shadowBlur=12;
  ctx.globalAlpha=frac<.25?(.5+.5*Math.abs(Math.sin(G.t*12))):1;
  ctx.strokeStyle=G.era.ink;ctx.lineCap='round';
  if(c.id==='club'){ctx.rotate(c.ang+Math.PI/2+c.swing*1.4);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,16);ctx.lineTo(0,-8);ctx.stroke();ctx.fillStyle='#6b4a2a';ctx.beginPath();ctx.ellipse(0,-14,8,11,0,0,6.283);ctx.fill();ctx.stroke()}
  else if(c.id==='dagger'){ctx.rotate(c.ang+Math.PI);ctx.fillStyle='#efe6d0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(4,4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.stroke()}
  else{ctx.font='20px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,13,0,6.283);ctx.stroke();ctx.fillText(c.def.icon,0,1)}
  ctx.shadowBlur=0;ctx.globalAlpha=1;
  // durability arc
  ctx.strokeStyle=frac<.25?'#ff6b6b':'#f3e9d2aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,20,-Math.PI/2,-Math.PI/2+6.283*frac);ctx.stroke();
  ctx.restore();
}
function drawShot(s){
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.shadowColor=G.era.ink;ctx.shadowBlur=10;
  if(s.id==='spear'){ctx.strokeStyle='#8a6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(10,0);ctx.stroke();ctx.fillStyle='#cfc3a8';ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(8,-5);ctx.lineTo(8,5);ctx.fill()}
  else if(s.id==='rock'){ctx.fillStyle='#8f8578';ctx.beginPath();ctx.arc(0,0,10,0,6.283);ctx.fill();ctx.strokeStyle='#120d1f';ctx.lineWidth=2;ctx.stroke()}
  else{ctx.fillStyle='#e8dcc0';ctx.beginPath();ctx.arc(0,0,4,0,6.283);ctx.fill()}
  ctx.restore();
}
function drawStroke(pts,col,a,live){
  if(pts.length<2)return;ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.shadowColor=col;ctx.shadowBlur=18;ctx.strokeStyle=col;ctx.lineWidth=live?7:6+(1-a)*8;
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(const p of pts)ctx.lineTo(p.x,p.y);ctx.stroke();
  ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  if(live){const id=recognize(pts);if(id){const l=pts[pts.length-1];ctx.font='bold 14px Georgia';ctx.fillStyle='#fff4d6';ctx.fillText(CREATIONS[id].icon+' '+CREATIONS[id].name,l.x+14,l.y-14)}}
  ctx.restore();
}
// menu background: drifting ink motes
const motes=Array.from({length:60},()=>({x:Math.random(),y:Math.random(),r:rnd(1,3),s:rnd(.01,.04),h:Math.random()}));
function drawMenuBg(dt){for(const m of motes){m.y-=m.s*dt;if(m.y<0)m.y=1;ctx.fillStyle=m.h>.5?'#9d8cff66':'#ffb35c55';ctx.beginPath();ctx.arc(m.x*W,m.y*H,m.r,0,6.283);ctx.fill()}}

// ================= HUD =================
function updateHud(){
  const p=G.player;
  $('hpb').style.width=clamp(p.hp/p.maxHp*100,0,100)+'%';$('hpt').textContent=`${Math.ceil(Math.max(0,p.hp))} / ${Math.round(p.maxHp)}`;
  $('xpb').style.width=(G.xp/G.xpNext*100)+'%';$('lvt').textContent='Lv '+G.level;
  const s=Math.floor(G.t);$('timer').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  $('wave').textContent=G.wave;$('kills').textContent=G.kills;$('runcoins').textContent=G.coins;
  const sig=G.loadout.join()+G.creations.length;
  if(updateHud.sig!==sig){updateHud.sig=sig;$('slots').innerHTML=G.loadout.map(id=>{const d=CREATIONS[id];const n=G.creations.filter(c=>c.id===id).length;return `<span class="slot">${d.icon} ${d.name}: <i>${d.shape}</i>${n?' ×'+n:''}</span>`}).join('')}
}
function togglePause(){
  if(!G)return;
  if(G.paused&&screenEl.innerHTML.includes('Paused')){screenEl.innerHTML='';G.paused=false;last=performance.now();return}
  if(G.paused)return;
  G.paused=true;
  screenEl.innerHTML=`<div class="panel"><h2>Paused</h2><button class="btn" id="resume">Resume</button><button class="btn" id="quit">Give up (keep coins)</button></div>`;
  $('resume').onclick=togglePause;$('quit').onclick=()=>{screenEl.innerHTML='';endRun()};
}
$('pauseBtn').onclick=togglePause;

// ================= SCREENS =================
function show(html){screenEl.innerHTML=html}
function home(){
  mode='home';G=null;$('hud').classList.add('hidden');
  show(`<div class="panel"><h1>Era Draw</h1><div class="sub">A time-hopping mage. Draw your weapons. Survive the ages.</div>
  <div class="wallet">🪙 ${save.coins} &nbsp; 💎 ${save.gems}${save.best?` &nbsp; 🏆 ${fmt(save.best)}`:''}</div>
  <button class="btn gold" id="play">▶ Play — ${ERAS[CURRENT_ERA].name}</button>
  <button class="btn" id="lo">Loadout (${save.loadout.length}/${save.slots})</button>
  <button class="btn" id="shop">Shop</button>
  <button class="btn" id="how">How to play</button></div>`);
  $('play').onclick=startRun;$('lo').onclick=loadout;$('shop').onclick=shop;$('how').onclick=how;
}
function fmt(s){s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function how(){
  show(`<div class="panel"><h2>How to play</h2><div class="help">
  <b>Move:</b> touch &amp; drag on the <b>left half</b> (or WASD / arrows).<br>
  <b>Draw:</b> drag on the <b>right half</b> (or click-drag with the mouse anywhere). Time slows while you draw (up to 2s).<br><br>
  ${save.owned.map(id=>`${CREATIONS[id].icon} <b>${CREATIONS[id].name}</b> — draw a <i>${CREATIONS[id].shape}</i>`).join('<br>')}<br><br>
  Creations fight <b>on their own</b>: melee ones orbit &amp; smash, ranged ones fire at the nearest enemy. Each has <b>durability</b> (the ring around it) and breaks — redraw it! Max ${MAX_ACTIVE} at once.<br><br>
  Collect XP orbs, pick upgrades on level-up, earn coins when you fall.</div>
  <button class="btn" id="back">Back</button></div>`);$('back').onclick=home;
}
function loadout(){
  const sel=save.loadout.slice();
  const render=()=>{show(`<div class="panel"><h2>Loadout</h2><div class="sub">Pick up to ${save.slots} creations to bring (${sel.length}/${save.slots})</div>
  <div class="grid">${Object.keys(CREATIONS).map(id=>{const d=CREATIONS[id],own=save.owned.includes(id);return `<div class="card ${sel.includes(id)?'on':''} ${own?'':'locked'}" data-id="${id}"><div class="ic">${d.icon}</div><b>${d.name}</b>${own?d.shape:'🔒 shop'}</div>`}).join('')}</div>
  <button class="btn gold" id="ok" ${sel.length?'':'disabled'}>Save</button></div>`);
  screenEl.querySelectorAll('.card').forEach(el=>el.onclick=()=>{const id=el.dataset.id;if(!save.owned.includes(id))return;const i=sel.indexOf(id);if(i>=0)sel.splice(i,1);else if(sel.length<save.slots)sel.push(id);else toast('Slots full');render()});
  $('ok').onclick=()=>{if(!sel.length)return;save.loadout=sel;persist();home()}};
  render();
}
function shop(){
  show(`<div class="panel"><h2>Shop</h2><div class="wallet">🪙 ${save.coins} &nbsp; 💎 ${save.gems}</div><div class="grid">${SHOP.map(it=>{
    const d=it.type==='creation'?CREATIONS[it.id]:it;const owned=it.type==='creation'?save.owned.includes(it.id):it.type==='slot'?save.slots>=4:false;
    return `<div class="card ${owned?'on':''}" data-id="${it.id}"><div class="ic">${d.icon}</div><b>${d.name}</b>${it.type==='creation'?'Draw: '+d.shape+'<br>':''}${owned?'✔ Owned':(it.cur==='coins'?'🪙 ':'💎 ')+it.cost}${it.note?`<br><small>${it.note}</small>`:''}</div>`}).join('')}</div>
    <button class="btn" id="back">Back</button></div>`);
  screenEl.querySelectorAll('.card').forEach(el=>el.onclick=()=>buy(SHOP.find(s=>s.id===el.dataset.id)));
  $('back').onclick=home;
}
function buy(it){
  if(it.type==='stub'){toast('Gems & ads coming soon');return}
  if(it.type==='creation'&&save.owned.includes(it.id))return;if(it.type==='slot'&&save.slots>=4)return;
  if(save.coins<it.cost){toast('Not enough coins');return}
  save.coins-=it.cost;
  if(it.type==='creation'){save.owned.push(it.id);if(save.loadout.length<save.slots)save.loadout.push(it.id);toast(CREATIONS[it.id].name+' unlocked!')}
  if(it.type==='slot'){save.slots=4;toast('4th slot unlocked!')}
  persist();shop();
}
function startRun(){
  newRun();mode='run';show('');$('hud').classList.remove('hidden');updateHud.sig=null;cam.x=0;cam.y=0;last=performance.now();
  toast(ERAS[CURRENT_ERA].name+' — survive!');
}
function endRun(){
  if(mode!=='run')return;mode='dead';
  const coins=calcCoins();save.coins+=coins;save.runs++;const newBest=G.t>save.best;if(newBest)save.best=G.t;persist();
  $('hud').classList.add('hidden');
  show(`<div class="panel"><h2>The ink fades…</h2><div class="sub">${ERAS[CURRENT_ERA].name}${newBest?' · 🏆 New best!':''}</div>
  <div class="help" style="text-align:center;font-size:16px">⏱ ${fmt(G.t)} &nbsp; 🌊 Wave ${G.wave} &nbsp; ☠ ${G.kills} &nbsp; ⭐ Lv ${G.level}<br><br><b style="font-size:24px;color:#ffd98a">+${coins} 🪙</b><br>Total: ${save.coins} 🪙</div>
  <button class="btn gold" id="retry">Retry</button><button class="btn" id="hm">Home</button></div>`);
  $('retry').onclick=startRun;$('hm').onclick=home;
}
// expose for tests
window.EraDraw={recognize,get G(){return G},get mode(){return mode},startRun,save:()=>save,spawnCreation,ERAS,CREATIONS};
home();requestAnimationFrame(frame);
