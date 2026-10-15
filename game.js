'use strict';
// ================= CONFIG =================
const ERAS = {
  stone: { name:'Stone Age', date:'c. 10,000 BC', no:'I', durability:1.0, enemyHp:1.0, enemyDmg:1.0, ground:'#2a2019', ink:'#ffb35c' },
  // Later eras: weapons last longer, enemies hit harder. Older-era weapons do OLD_ERA_DMG.
  bronze:{ name:'Bronze Age', durability:1.6, enemyHp:1.8, enemyDmg:1.5, ground:'#2b2416', ink:'#e8c070' },
  iron:  { name:'Iron Age',   durability:2.2, enemyHp:2.8, enemyDmg:2.0, ground:'#1f2226', ink:'#b8d0ff' },
};
const ERA_ORDER = ['stone','bronze','iron'];
const OLD_ERA_DMG = 0.65;
let CURRENT_ERA = 'stone';

// shape: how to draw it. life = seconds before breaking, uses = hits before breaking
const CREATIONS = {
  club:  { name:'Club', icon:'🪵', era:'stone', shape:'short line', kind:'melee', dmg:13, life:9,  uses:30, rate:0.55, range:70, knock:210, cost:0 },
  spear: { name:'Spear', icon:'🗡️', era:'stone', shape:'long line', kind:'ranged', dmg:12, life:10, uses:14, rate:0.85, speed:620, pierce:3, cost:0 },
  rock:  { name:'Rock', icon:'🪨', era:'stone', shape:'circle', kind:'ranged', dmg:27, life:10, uses:14, rate:1.15, speed:380, aoe:78, cost:0 },
  sling: { name:'Sling', icon:'🪃', era:'stone', shape:'V shape', kind:'ranged', dmg:10, life:11, uses:40, rate:0.28, speed:720, pierce:2, cost:150 },
  dagger:{ name:'Bone Dagger', icon:'🦴', era:'stone', shape:'zigzag', kind:'melee', dmg:10, life:10, uses:60, rate:0.22, range:54, knock:60, cost:250, orbitSpeed:5 },
};
// Max active creations per CATEGORY (def.kind). Upgrades can raise each one via G.player.caps[kind].
const BASE_CAPS = { melee:3, ranged:2 };
// Drawing a different type shatters all active creations.
const SWITCH_SHATTERS = true;
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
  {id:'coin', name:'Coin Sense', icon:'', base:'rare', desc:r=>`+${[25,35,50][r]}% coins this run`, apply:(p,r)=>p.coinMul*=1+[.25,.35,.5][r]},
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
  const d={hudScale:1,zoom:1,uiScale:1,autoMove:false,coins:0,gems:0,owned:['club','spear','rock'],loadout:['club','spear','rock'],slots:3,best:0,runs:0};
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
let lastQuality={line:.5,circle:.5,poly:.5};
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
  // stroke quality 0..1 (perfect-draw bonus)
  {const cx=(minx+maxx)/2,cy=(miny+maxy)/2,rad=rs.map(q=>Math.hypot(q.x-cx,q.y-cy)),mr=rad.reduce((a,b)=>a+b,0)/rad.length,dev=Math.sqrt(rad.reduce((a,b)=>a+(b-mr)**2,0)/rad.length)/(mr||1);
   lastQuality={line:clamp((straight-.85)/.14,0,1),circle:clamp(1-dev*4,0,1)*clamp(1-chord/(L*.3),0,1)*.5+clamp(1-dev*4,0,1)*.5,poly:clamp(1-Math.abs(straight-.5),0,1)*.8}}
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

const ICON={};
for(const id of ['club','spear','rock','sling','dagger'])ICON[id]=iconURL(SPR[id].r,3);
for(const k in SPR.pu)ICON['pu_'+k]=iconURL(SPR.pu[k],4);ICON.gemHard=iconURL(SPR.gemHard,3);ICON.slot4=iconURL(SPR.chest,3);
initForge();
ICON.skull=iconURL(SPR.deco.skull,3);ICON.coin=iconURL(SPR.coin,3);ICON.chest=iconURL(SPR.chest,3);ICON.gem=iconURL(SPR.gem1,3);
// ================= GAME STATE =================
let G=null; // current run
let mode='home';
function newRun(){
  const era=ERAS[CURRENT_ERA];
  G={t:0,wave:1,kills:0,coins:0,spawnT:0,level:1,xp:0,xpNext:5,ink:[],trails:[],
    player:{x:0,y:0,r:16,hp:100,maxHp:100,speed:190,dmgMul:1,cdMul:1,durMul:1,focus:BASE_FOCUS,homing:0,echo:0,magnet:110,secondWind:false,coinMul:1,caps:{...BASE_CAPS},usedWind:false,invul:0,face:0},
    picks:{},drawCount:{},evolved:{},combosSeen:{},lastDraw:null,dnums:[],chests:[],eshots:[],enemies:[],creations:[],shots:[],orbs:[],fx:[],texts:[],castCd:0,focusLeft:BASE_FOCUS,drawing:null,
    era, loadout:save.loadout.slice(),paused:false,shake:0,dbl:false};
}

// ================= INPUT =================
const stick={id:null,ox:0,oy:0,x:0,y:0,active:false};
const keys={};
const mouse={x:0,y:0,walk:false,id:null};
const isTouch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'&&mode==='run'){e.preventDefault();tryDash()}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
cv.addEventListener('pointerdown',e=>{
  if(mode!=='run'||G.paused)return;
  cv.setPointerCapture(e.pointerId);
  const isMouse=e.pointerType==='mouse';
  if(isMouse&&e.button===2){mouse.walk=true;mouse.x=e.clientX;mouse.y=e.clientY;e.preventDefault();return}
  if(isMouse&&e.button!==0)return;
  if(!isMouse&&e.clientX<W*0.5&&stick.id===null){const now=performance.now();if(now-(stick.lastTap||0)<280)tryDash();stick.lastTap=now;Object.assign(stick,{id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY,active:true});return}
  if(!G.drawing&&(isMouse||e.clientX>=W*0.5)){G.drawing={id:e.pointerId,t0:performance.now(),pts:[{x:e.clientX,y:e.clientY}]};sfx('draw');}
});
cv.addEventListener('pointermove',e=>{
  if(mode!=='run')return;
  if(e.pointerType==='mouse'){mouse.x=e.clientX;mouse.y=e.clientY}
  if(e.pointerId===stick.id){stick.x=e.clientX;stick.y=e.clientY}
  else if(G.drawing&&G.drawing.id===e.pointerId){const pts=G.drawing.pts,l=pts[pts.length-1];if(Math.hypot(e.clientX-l.x,e.clientY-l.y)>3)pts.push({x:e.clientX,y:e.clientY})}
});
const endPtr=e=>{
  if(e.pointerType==='mouse'&&(e.button===2||e.type==='pointercancel'))mouse.walk=false;
  if(mode!=='run')return;
  if(e.pointerType==='mouse'&&e.button===2)return;
  if(e.pointerId===stick.id){stick.id=null;stick.active=false}
  else if(G.drawing&&G.drawing.id===e.pointerId){finishDraw();}
};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',()=>{mouse.walk=false;for(const k in keys)keys[k]=false});
// chorded buttons (right held while left pressed) don't fire pointerdown; track via buttons bitmask
cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&mode==='run')mouse.walk=(e.buttons&2)!==0});

function finishDraw(){
  const d=G.drawing;G.drawing=null;
  let id=recognize(d.pts);
  const pts=d.pts.slice();
  if(!id){fizzle(pts,'?');return}
  const sid=id;const pick=creationForShape(sid);if(!pick){fizzle(pts,CREATIONS[sid].shape+' not in loadout');return}
  id=pick;
  if(G.castCd>0){fizzle(pts,'recharging…');return}
  const a=pts[0],b=pts[pts.length-1];
  const dir=Math.atan2(b.y-a.y,b.x-a.x);
  const kindQ=(sid==='club'||sid==='spear')?'line':sid==='rock'?'circle':'poly';const q=lastQuality[kindQ];
  const power=(0.85+0.45*q)*(window.strokeBonus?strokeBonus(d,pts,id):1);const fid=resolveDraw(id);spawnCreation(fid,dir,false,power);
  if(q>=.85){G.perfects=(G.perfects||0)+1;floatText(G.player.x,G.player.y-64,'PERFECT DRAW','#ffe08a',1.2);sfx('lvl');haptic(30)}else if(q>=.6)floatText(G.player.x,G.player.y-64,'CLEAN','#e9dcc3',.8);
  if(Math.random()<G.player.echo){setTimeout(()=>G&&spawnCreation(fid,dir+0.4,true),150)}
  G.castCd=BASE_CAST_CD*G.player.cdMul;
  G.trails.push({pts,life:0.7,max:0.7,ok:true});
  G.focusLeft=Math.min(G.player.focus,G.focusLeft+0.6);
}
function fizzle(pts,msg){sfx('fizzle');G.trails.push({pts,life:0.5,max:0.5,ok:false});floatText(G.player.x,G.player.y-30,msg,'#ff8a8a')}

// ================= CREATIONS =================
function creationDmgMul(def){const ei=ERA_ORDER.indexOf(def.era),ci=ERA_ORDER.indexOf(CURRENT_ERA);return ei<ci?OLD_ERA_DMG:1}
function spawnCreation(id,dir,echo,power=1){
  const def=CREATIONS[id],p=G.player;
  if(SWITCH_SHATTERS&&!echo){const myBase=def.base||id;const others=G.creations.filter(c=>(c.def.base||c.id)!==myBase);if(others.length){for(const c of others)shatterCreation(c);G.shake=Math.max(G.shake,6);floatText(p.x,p.y-52,'Shatter!','#cfe3ff');sfx('shatter');haptic(25)}}
  const same=G.creations.filter(c=>c.def.kind===def.kind);
  while(same.length>=(p.caps[def.kind]||1)){const old=same.shift();breakCreation(old,true)} // replace oldest
  const dur=G.era.durability*p.durMul;
  const c={id,def,life:def.life*dur,max:def.life*dur,uses:Math.round(def.uses*dur),maxUses:Math.round(def.uses*dur),cd:0.15,
    ang:Math.random()*6.28,x:p.x,y:p.y,swing:0,dir,power};if(power>=1.23){c.life*=1.2;c.max*=1.2;c.perfect=true}
  G.creations.push(c);
  if(def.proj==='spear'||id==='spear')fireShot(c,dir); // first throw goes where you drew
  burst(p.x,p.y,G.era.ink,14);sfx('spawn');haptic(15);
  floatText(p.x,p.y-34,(echo?'Echo ':'')+def.name+'!',G.era.ink);
}
function breakCreation(c,quiet){const i=G.creations.indexOf(c);if(i>=0)G.creations.splice(i,1);burst(c.x,c.y,'#cfc3a8',10);if(!quiet)floatText(c.x,c.y-10,'broke','#cfc3a8')}
function shatterCreation(c){const i=G.creations.indexOf(c);if(i>=0)G.creations.splice(i,1);
  for(let k=0;k<9;k++){const a=Math.random()*6.283,sp=rnd(120,320);G.fx.push({shard:true,x:c.x,y:c.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rot:a,vr:rnd(-12,12),life:rnd(.4,.8),max:.8,col:k%2?'#cfe3ff':G.era.ink,r:rnd(4,8)})}
  ring(c.x,c.y,34,'#cfe3ff')}
function nearestEnemy(x,y,maxD=9e9,skip){let best=null,bd=maxD;for(const e of G.enemies){if(skip&&skip.has(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;best=e}}return best}
function fireShot(c,ang){
  const def=c.def;if(def.multishot&&!c._ms){c._ms=1;for(let i=-1;i<=1;i++)if(i)fireShot(c,ang+i*.25);c._ms=0}
  G.shots.push({x:c.x,y:c.y,vx:Math.cos(ang)*def.speed,vy:Math.sin(ang)*def.speed,id:c.id,def,pierce:def.pierce||1,hit:new Set(),life:1.4,
    dmg:def.dmg*(c.power||1)*G.player.dmgMul*creationDmgMul(def),aoe:def.aoe||0,rot:ang});
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
        const targets=queryGrid(c.x,c.y,def.range+40).filter(e=>Math.hypot(e.x-c.x,e.y-c.y)<def.range+e.r);
        if(targets.length){
          c.cd=def.rate;c.swing=1;
          for(const e of targets.slice(0,c.id==='club'?6:2)){
            hurtEnemy(e,def.dmg*(c.power||1)*p.dmgMul*creationDmgMul(def),'melee',c);
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
    for(const e of queryGrid(s.x,s.y,40)){
      if(s.hit.has(e)||e.hp<=0)continue;
      if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+(s.id==='rock'?12:7)){
        s.hit.add(e);
        if(s.aoe){for(const o of queryGrid(s.x,s.y,s.aoe))if(Math.hypot(o.x-s.x,o.y-s.y)<s.aoe)hurtEnemy(o,s.dmg,'aoe',s);ring(s.x,s.y,s.aoe,s.def.fire?'#ff4a2a':'#d8c7a0');G.shake=Math.max(G.shake,3);if(!s.def.fire||--s.pierce<=0){dead=true;break}continue}
        hurtEnemy(e,s.dmg,'ranged',s);e.kx+=s.vx*0.12;e.ky+=s.vy*0.12;
        if(--s.pierce<=0){dead=true;break}
      }
    }
    if(dead)G.shots.splice(i,1);
  }
}

// ================= ENEMIES =================
// damage pipeline: systems push f(e,d,src,from)->d (src: melee|ranged|aoe|fire|spell...)
const DMG_MODS=[];
function hurtEnemy(e,d,src,from){
  if(e.hp<=0)return;for(const f of DMG_MODS)d=f(e,d,src,from);if(!(d>0))return;
  e.hp-=d;e.flash=0.1;sfx('hit');
  const dv=Math.max(1,Math.round(d));const prev=e.dn&&e.dn.life>.3&&G.dnums.includes(e.dn)?e.dn:null;
  if(prev){prev.v+=dv;prev.life=prev.max;prev.big=prev.v>=25;prev.col=prev.v>=25?'#ffe08a':'#fff6e0'}
  else if(G.dnums.length<55||e.T.boss||dv>=25){e.dn={x:e.x+rnd(-6,6),y:e.y-e.r*1.6,v:dv,big:d>=25,col:d>=25?'#ffe08a':'#fff6e0',life:.6,max:.6};G.dnums.push(e.dn)}
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  const i=G.enemies.indexOf(e);if(i>=0)G.enemies.splice(i,1);
  G.kills++;sfx('kill');burst(e.x,e.y,e.T.col,e.T.boss?50:7);burst(e.x,e.y,'#1a0f0e',e.T.boss?20:3);if(e.T.boss||e.T.elite)ring(e.x,e.y,e.T.boss?120:50,'#ffe08a');
  G.ink.push({x:e.x,y:e.y,r:e.r*rnd(.8,1.4),a:.35});if(G.ink.length>120)G.ink.shift();
  G.orbs.push({x:e.x,y:e.y,v:e.T.xp*(ERA_XP[CURRENT_ERA]||1)*(1+Math.max(0,G.t-240)/300),t:0});
  if(e.T.boss||(chestOk()&&((e.T.elite&&Math.random()<.07)||e.champ))){G.chests.push({x:e.x,y:e.y,boss:!!e.T.boss});if(e.T.boss){toast(e.T.name+' falls!');G.shake=14}}
}
// balance: at most CHEST_CAP non-boss chests on the map at once; boss chests always drop
const CHEST_CAP=2;function chestOk(){return !G||G.chests.filter(c=>!c.boss).length<CHEST_CAP}
// balance: XP needed grows ~level^1.45, plus a +25% step every 10 levels
const SCREEN_LABELS=[];
// ---- XP gem merging: resting gems close together fuse into a clump that keeps the exact summed XP (and gem count) ----
const ORB_MERGE_R=22,ORB_SOFT_CAP=220;
function mergeOrbs(dt){G.orbMergeT=(G.orbMergeT||0)-dt;if(G.orbMergeT>0)return;G.orbMergeT=.4;const over=G.orbs.length>ORB_SOFT_CAP;
  // over the soft cap the merge radius grows until the count fits (XP is never dropped)
  G.orbMergeR=over?Math.min(480,(G.orbMergeR||ORB_MERGE_R)*1.6):ORB_MERGE_R;const R=G.orbMergeR,C=R,cells=new Map(),out=[];
  for(const o of G.orbs){if(o.pull){out.push(o);continue}const k=Math.floor(o.x/C)+','+Math.floor(o.y/C);let hit=null;
    const cx=Math.floor(o.x/C),cy=Math.floor(o.y/C);
    for(let i=-1;i<=1&&!hit;i++)for(let j=-1;j<=1&&!hit;j++){const l=cells.get((cx+i)+','+(cy+j));if(l)for(const q of l){if((q.x-o.x)**2+(q.y-o.y)**2<R*R){hit=q;break}}}
    if(hit){const tv=hit.v+o.v;hit.x=(hit.x*hit.v+o.x*o.v)/tv;hit.y=(hit.y*hit.v+o.y*o.v)/tv;hit.v=tv;hit.n=(hit.n||1)+(o.n||1);hit.t=Math.min(hit.t,o.t)}
    else{(cells.get(k)||cells.set(k,[]).get(k)).push(o);out.push(o)}}
  G.orbs=out}
function orbSprite(o){const v=o.v/(ERA_XP[CURRENT_ERA]||1);if((o.n||1)>1)return v>=60?SPR.clump3:v>=20?SPR.clump2:SPR.clump1;return v>=10?SPR.gem3:v>=3?SPR.gem2:SPR.gem1}
// ---- render culling: only draw what is on screen (plus a margin) ----
function onScr(x,y,m){const sx=X(x),sy=Y(y);return sx>-m&&sx<BW+m&&sy>-m&&sy<BH+m}
function confirmBox(title,body,yes,no,onYes,onNo){show(`<div class="sheet lv cfm"><header class="row"><span class="lab">Confirm</span></header><h2 class="disp">${title}</h2><p class="sh">${body}</p>
  <nav class="menu"><button id="cfNo"><b>01</b>${no}<i>&larr;</i></button><button id="cfYes"><b>02</b>${yes}<i>&rarr;</i></button></nav></div>`);
  $('cfNo').onclick=()=>{show('');onNo&&onNo()};$('cfYes').onclick=()=>{onYes()};setTimeout(()=>$('cfNo')&&$('cfNo').focus(),30)}
function eraBossesDone(){const need=(G.era.bosses||[]).filter(b=>b.t<=ERA_CLEAR_T);return need.every(b=>(G.bossKills||{})[b.type+'@'+b.t])}
function finalBoss(){const b=(G.era.bosses||[]).find(x=>x.t===ERA_CLEAR_T);return b&&b.type}
// pacing (sims): ~L9 at 5:00, ~L14-15 at 10:00 in every era; gem XP normalized per era via ERA_XP
function xpFor(l){return Math.round(1.25*(14+3.2*Math.pow(l,1.45))*(1+.1*Math.floor(l/10)))}
const ERA_XP={stone:1,bronze:1,iron:2.1,mythic:.68};
function damagePlayer(d){
  if(!G||G.dead)return;const p=G.player;p.hp-=d;p.invul=0.5;sfx('hurt');haptic(35);G.shake=8;burst(p.x,p.y,'#ff6b6b',10);
  if(p.hp<=0){
    if(p.secondWind&&!p.usedWind){p.usedWind=true;p.hp=1;p.invul=2;toast('Second Wind!');ring(p.x,p.y,200,'#fff');for(const e of G.enemies){const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*500;e.ky+=Math.sin(a)*500}}
    else{p.hp=0;G.dead=true} // finalize after this step, never mid-loop
  }
}

// ================= XP / LEVEL =================
function updateOrbs(dt){
  const p=G.player;
  for(let i=G.orbs.length-1;i>=0;i--){const o=G.orbs[i];o.t+=dt;const d=Math.hypot(p.x-o.x,p.y-o.y);
    if(d<p.magnet||o.pull){o.pull=true;const a=Math.atan2(p.y-o.y,p.x-o.x),sp=300+o.t*200;o.x+=Math.cos(a)*sp*dt;o.y+=Math.sin(a)*sp*dt}
    if(d<p.r+6){G.orbs.splice(i,1);G.xp+=o.v*(p.xpMul||1);G.gemsPicked=(G.gemsPicked||0)+(o.n||1);if(G.xp>=G.xpNext){G.xp-=G.xpNext;G.level++;G.xpNext=xpFor(G.level);levelUp()}}}
  // a merged clump can carry more than one level: spend the overflow on the next free frame
  if(G.xp>=G.xpNext&&!G.paused&&mode==='run'){G.xp-=G.xpNext;G.level++;G.xpNext=xpFor(G.level);levelUp()}
  mergeOrbs(dt);
  for(let i=G.chests.length-1;i>=0;i--){const c=G.chests[i];if(Math.hypot(c.x-p.x,c.y-p.y)<p.r+14){G.chests.splice(i,1);G.bonus=(G.bonus||0)+25;floatText(p.x,p.y-40,'+25 COINS','#d9c27a',1.4);const rc=$('runcoins');rc.classList.remove('flash');void rc.offsetWidth;rc.classList.add('flash');burst(c.x,c.y,'#d9c27a',24);toast('Chest! +25 coins');(window.openChest?openChest(c):levelUp(true));return}}

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
function levelUp(fromChest){
  G.paused=true;stick.id=null;stick.active=false;G.drawing=null;
  const picks=rollPicks();sfx(fromChest?'chest':'lvl');haptic([20,40,20]);
  show(`<div class="sheet lv">
   <header class="row"><span class="lab">${fromChest?'Chest opened · +25 coins':'Level up'}</span><span class="lab">Choose one · ${fmt(G.t)}</span></header>
   <h2 class="disp">${fromChest?'Treasure':'Level '+G.level}</h2>
   <div class="picks">${picks.map((k,i)=>{const own=G.picks[k.pu.id]||0;return `<button class="pick r-${RAR[k.r]}" data-i="${i}">
     <span class="pk-top"><span class="ic"><img src="${ICON['pu_'+k.pu.id]}" alt=""></span><span class="lvtag">${own?'LV '+(own+1):'NEW'}</span></span>
     <span class="pk-name">${k.pu.name}</span><span class="pk-rar">${RAR[k.r]}</span><span class="pk-desc">${k.pu.desc(k.r)}</span></button>`}).join('')}</div></div>`);
  screenEl.querySelectorAll('.pick').forEach(el=>el.onclick=()=>{const k=picks[+el.dataset.i];k.pu.apply(G.player,k.r);G.picks[k.pu.id]=(G.picks[k.pu.id]||0)+1;sfx('pick');show('');G.paused=false;last=performance.now()});
}


// ================= FX =================
function burst(x,y,col,n){if(save.perf)n=Math.ceil(n*.4);if(save.perf&&G.fx.length>160)return;for(let i=0;i<n;i++){const a=Math.random()*6.283,s=rnd(40,220);G.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.7),max:.7,col,r:rnd(1.5,4)})}}
function ring(x,y,r,col){G.fx.push({ring:true,x,y,r,life:.35,max:.35,col})}
function floatText(x,y,txt,col,life=0.9,size=15){G.texts.push({x,y,txt,col,life,max:life,size});if(G.texts.length>80)G.texts.shift()}
let toastT=0;function toast(m){const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>t.style.opacity=0,1600)}
function updateFx(dt){
  for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];f.life-=dt;if(f.shard)f.rot+=f.vr*dt;if(!f.ring){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92}if(f.life<=0)G.fx.splice(i,1)}
  for(let i=G.dnums.length-1;i>=0;i--){const d=G.dnums[i];d.life-=dt;d.y-=22*dt;if(d.life<=0)G.dnums.splice(i,1)}
  for(let i=G.texts.length-1;i>=0;i--){const t=G.texts[i];t.life-=dt;t.y-=30*dt;if(t.life<=0)G.texts.splice(i,1)}
  for(let i=G.trails.length-1;i>=0;i--){G.trails[i].life-=dt;if(G.trails[i].life<=0)G.trails.splice(i,1)}
}

// ================= LOOP =================
let last=performance.now();
const FIXED_DT=1/60;let simAcc=0;
// all simulation randomness comes from the run's seeded RNG; rendering keeps Math.random
const NATIVE_RANDOM=Math.random;let RENDERING=false;
Math.random=function(){return (!RENDERING&&mode==='run'&&G&&G.rng)?G.rng():NATIVE_RANDOM()};
function simStep(dt,realDt){step(dt,realDt)}
function renderSafe(dt){const r=RENDERING;RENDERING=true;try{return renderInner(dt)}finally{RENDERING=r}}
function frame(now){
  requestAnimationFrame(frame);
  const realDt=Math.min(0.05,(now-last)/1000);last=now;
  if(mode==='run'&&G&&!G.paused){
    // fixed-timestep simulation (deterministic for a given seed + input), render at display rate
    simAcc+=realDt;let n=0;
    while(simAcc>=FIXED_DT&&n<6&&mode==='run'&&G&&!G.paused){
      let scale=1;
      if(G.drawing&&G.focusLeft>0){scale=SLOWMO;G.focusLeft-=FIXED_DT}
      else if(!G.drawing)G.focusLeft=Math.min(G.player.focus,G.focusLeft+FIXED_DT*0.5);
      G.slow=scale<1;
      try{simStep(FIXED_DT*scale,FIXED_DT)}catch(e){console.error('step',e)}
      simAcc-=FIXED_DT;n++}
    if(n>=6)simAcc=0;
  }else simAcc=0
  RENDERING=true;try{render(realDt)}catch(e){console.error('render',e)}RENDERING=false;
}
function step(dt,realDt){
  const p=G.player;G.t+=dt;G.castCd-=realDt;p.invul-=dt;G.shake=Math.min(14,G.shake)*Math.pow(.004,realDt);if(G.shake<.3)G.shake=0;
  let mx=0,my=0;
  if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;
  if(stick.active){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.hypot(dx,dy);if(d>6){const k=Math.min(1,d/55);mx=dx/d*k;my=dy/d*k}}
  if(mouse.walk&&!mx&&!my){const dx=(mouse.x-W/2)/S*Z-(p.x-cam.x),dy=(mouse.y-H/2)/S*Z-(p.y-cam.y),d=Math.hypot(dx,dy);if(d>12){const k=Math.min(1,d/80);mx=dx/d*k;my=dy/d*k}}
  if(save.autoMove&&!mx&&!my&&!stick.active){const v=kiteVector(p);mx=v.x;my=v.y}
  const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m}
  if(p.dashT>0){p.dashT-=dt;mx=p.dashX;my=p.dashY;p.invul=Math.max(p.invul,.05);if(Math.random()<.8)G.fx.push({x:p.x+rnd(-6,6),y:p.y-rnd(0,14),vx:-mx*40,vy:-my*40,life:.3,max:.3,col:'#ff9a3c',r:2})}
  {const mx_=p.dashMax||2;if(p.dashCharges==null)p.dashCharges=mx_;if(p.dashCharges<mx_){p.dashCd=(p.dashCd||0)-dt;if(p.dashCd<=0){p.dashCharges++;p.dashCd=p.dashCharges<mx_?DASH.cd*(p.dashCdMul||1):0}}else p.dashCd=0}
  const spd=p.dashT>0?p.speed*DASH.mult:p.speed;
  p.x+=mx*spd*dt;p.y+=my*spd*dt;if(m>0.1)p.face=Math.atan2(my,mx);p.moving=m>0.1;
  updateSpawns(dt);updateEnemies(dt);if(G.dead){updateHud();endRun();return}if(mode!=='run')return;updateCreations(dt);updateShots(dt);updateOrbs(dt);if(window.updatePickups)updatePickups(dt);if(!G||mode!=='run')return;updateFx(dt);if(G.dead){endRun();return}
  if(G.t>=ERA_CLEAR_T+1&&!G.cleared&&eraBossesDone()){G.cleared=true;eraCleared();return}
  G.coins=calcCoins();updateHud();
}
// Auto-move (kite): steer away from nearby enemies, drift toward nearby XP
function kiteVector(p){
  let x=0,y=0;
  for(const e of G.enemies){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,R=200+e.r;if(d<R){const w=(R-d)/R*(e.T.boss?3:1);x+=dx/d*w*2;y+=dy/d*w*2}}
  let best=null,bd=320;for(const o of G.orbs){const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;best=o}}
  if(best){const dx=best.x-p.x,dy=best.y-p.y,d=Math.hypot(dx,dy)||1;x+=dx/d*.6;y+=dy/d*.6}
  const m=Math.hypot(x,y);if(m<0.15)return{x:0,y:0};return m>1?{x:x/m,y:y/m}:{x,y};
}
// ---- dash: Space / double-tap the move side. Short burst, brief invulnerability ----
const DASH={mult:4.2,time:.17,cd:2.4};
function tryDash(){if(!G||G.paused)return;const p=G.player;if(p.dashCharges==null)p.dashCharges=p.dashMax||2;if(p.dashCharges<=0||p.dashT>0)return;
  let dx=Math.cos(p.face),dy=Math.sin(p.face);if(stick.active){const sx=stick.x-stick.ox,sy=stick.y-stick.oy,d=Math.hypot(sx,sy);if(d>6){dx=sx/d;dy=sy/d}}
  p.dashX=dx;p.dashY=dy;p.dashT=DASH.time*(p.dashTimeMul||1);if(p.dashCharges===(p.dashMax||2)||p.dashCd<=0)p.dashCd=DASH.cd*(p.dashCdMul||1);p.dashCharges--;sfx('dash');haptic(12);G.shake=Math.max(G.shake,2)}
function haptic(ms){if(typeof save!=='undefined'&&save.haptics===false)return;try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
function calcCoins(){let c=10+G.t*0.25+G.kills*0.08+(G.bonus||0);c*=G.player.coinMul;if(G.dbl)c*=2;return Math.floor(c)}

// ================= RENDER =================
const cam={x:0,y:0};
// ---- low-res pixel buffer: 1 art pixel = Z world units = S screen px ----
const Z=2;
let S=2,BW=0,BH=0;const buf=document.createElement('canvas'),bx=buf.getContext('2d');
function layoutBuf(){const zm=(typeof save!=='undefined'&&save.zoom)||1;S=Math.max(1,Math.round(H*zm/((typeof save!=='undefined'&&save.perf)?150:180)));BW=Math.ceil(W/S);BH=Math.ceil(H/S);buf.width=BW;buf.height=BH;bx.imageSmoothingEnabled=false}
addEventListener('resize',layoutBuf);layoutBuf();
const viewW=()=>BW*Z,viewH=()=>BH*Z;
let ox=0,oy=0;
const X=x=>Math.round((x-cam.x)/Z+BW/2+ox),Y=y=>Math.round((y-cam.y)/Z+BH/2+oy);
function blit(im,x,y,ay=1){bx.drawImage(im,X(x)-(im.width>>1),Y(y)-Math.round(im.height*ay))}
function sprite(st,x,y,left,flash,ay=1){blit(flash?(left?st.wl:st.wr):(left?st.l:st.r),x,y,ay)}
function shadow(x,y,w){const sx=X(x),sy=Y(y);bx.fillStyle='rgba(12,8,4,.38)';bx.fillRect(sx-w,sy-1,w*2,3);bx.fillRect(sx-w+2,sy-2,w*2-4,5)}
function pxCircle(cx,cy,r,col){bx.fillStyle=col;const n=Math.max(8,Math.round(r*1.6));for(let i=0;i<n;i++){const a=i/n*6.283;bx.fillRect(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r),1,1)}}
const blobCache={};
function blobSprite(T){ // fallback pixel blob for enemies without authored art
  if(blobCache[T.name])return blobCache[T.name];
  const r=Math.max(4,Math.round(T.r/Z)),d=r*2;const c=document.createElement('canvas');c.width=d;c.height=d;const x=c.getContext('2d');
  for(let j=0;j<d;j++)for(let i=0;i<d;i++){const q=Math.hypot(i-r+.5,j-r+.5)/r;if(q<1){x.fillStyle=q>.75?'#1a0f0e':j<r*.7?T.col:shade(T.col);x.fillRect(i,j,1,1)}}
  x.fillStyle='#ffe9a8';x.fillRect(r+1,r-2,1,1);x.fillRect(r+3,r-2,1,1);
  return blobCache[T.name]=set(c);
}
function shade(hex){const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.round(v*.7));return'#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('')}
function render(dt){return renderSafe(dt)}
function renderInner(dt){
  ctx.imageSmoothingEnabled=false;
  if(mode!=='run'||!G){ctx.fillStyle='#140b0c';ctx.fillRect(0,0,W,H);drawMenuBg(dt);return}
  const p=G.player;const ct=window.camTarget?camTarget():p;cam.x+=(ct.x-cam.x)*0.15;cam.y+=(ct.y-cam.y)*0.15;
  ox=Math.round((Math.random()-.5)*G.shake/Z);oy=Math.round((Math.random()-.5)*G.shake/Z);
  drawGround();
  for(const s of G.ink){if(!onScr(s.x,s.y,40))continue;bx.fillStyle=`rgba(26,15,14,${s.a})`;const r=Math.round(s.r/Z),sx=X(s.x),sy=Y(s.y);bx.fillRect(sx-r,sy-(r>>1),r*2,r);bx.fillRect(sx-(r>>1),sy-r+1,r,r*2-2)}
  for(const o of G.orbs){if(!onScr(o.x,o.y,12))continue;const im=orbSprite(o);bx.drawImage(im,X(o.x)-(im.width>>1),Y(o.y)-(im.height>>1)-((Math.floor(G.t*3+o.x*.1)&1)))}
  if(G.chests)for(const c of G.chests){shadow(c.x,c.y,6);blit(SPR.chest,c.x,c.y-((Math.floor(G.t*4)&1)))}
  if(window.renderPickups)renderPickups();
  drawBossGround();
  // y-sorted actors
  const actors=[];for(const e of G.enemies)if(onScr(e.x,e.y,48))actors.push(e);actors.push(p);for(const c of G.creations)if(c.def.kind==='melee')actors.push(c);
  actors.sort((a,b)=>a.y-b.y);
  for(const a of actors){if(a===p)drawPlayer(p);else if(a.def)drawCreation(a);else drawEnemy(a)}
  for(const c of G.creations)if(c.def.kind!=='melee')drawCreation(c);
  for(const s of G.shots)if(onScr(s.x,s.y,24))drawShot(s);
  if(G.eshots)for(const s of G.eshots){const im=s.kind==='orb'?SPR.p_orb:SPR.p_enemyRock;bx.drawImage(im,X(s.x)-(im.width>>1),Y(s.y)-(im.height>>1))}
  for(const f of G.fx){if(!f.ring&&!onScr(f.x,f.y,4))continue;const a=f.life/f.max;
    if(f.ring){bx.globalAlpha=a;pxCircle(X(f.x),Y(f.y),f.r/Z*(1.2-a*.5),f.col)}
    else{bx.globalAlpha=Math.min(1,a*1.5);bx.fillStyle=f.col;const s=f.shard?2:f.r>2.5?2:1;bx.fillRect(X(f.x),Y(f.y),s,s)}}
  bx.globalAlpha=1;
  // damage numbers (bitmap digits, pop then float)
  for(const d of G.dnums){const age=d.max-d.life,sc=d.big&&age<0.1?2:1,str=String(d.v);bx.globalAlpha=Math.min(1,d.life/d.max*3);drawDigits(bx,str,X(d.x)-(digitsWidth(str,sc)>>1),Y(d.y)-sc*3,d.col,sc)}
  bx.globalAlpha=1;
  // slow-mo: warm ink tint + dithered edges
  if(G.slow){bx.fillStyle='rgba(60,25,10,.28)';bx.fillRect(0,0,BW,BH);bx.fillStyle='rgba(20,8,6,.6)';for(let i=0;i<BW;i+=2){bx.fillRect(i,0,1,3);bx.fillRect(i+1,BH-3,1,3)}for(let j=0;j<BH;j+=2){bx.fillRect(0,j,3,1);bx.fillRect(BW-3,j+1,3,1)}}
  drawLight(p);
  for(const tr of G.trails)drawStroke(tr.pts,tr.ok?(window.inkCol?inkCol():'#ff9a3c'):'#e0504e',tr.life/tr.max);
  if(G.drawing)drawStroke(G.drawing.pts,'#fff1d0',1,true);
  if(window.drawLootTop)drawLootTop();
  ctx.drawImage(buf,0,0,BW*S,BH*S);
  // screen-space labels (pixel font)
  ctx.textAlign='center';
  for(const t of G.texts){ctx.globalAlpha=Math.min(1,t.life/t.max*2);ctx.font=`${S*5}px Silkscreen, monospace`;const sx=X(t.x)*S,sy=Y(t.y)*S;ctx.fillStyle='#1a0f0e';ctx.fillText(t.txt,sx+S,sy+S);ctx.fillStyle=t.col;ctx.fillText(t.txt,sx,sy)}
  // per-frame screen-space labels queued by world systems (crisp text at native resolution)
  for(const l of SCREEN_LABELS){ctx.globalAlpha=1;ctx.font=`${Math.round(S*(l.size||4))}px Silkscreen, monospace`;const sx=l.x*S,sy=l.y*S;ctx.fillStyle='#1a0f0e';ctx.fillText(l.txt,sx+S*.6,sy+S*.6);ctx.fillStyle=l.col;ctx.fillText(l.txt,sx,sy)}SCREEN_LABELS.length=0;ctx.globalAlpha=1;
  ctx.globalAlpha=1;
  if(G.drawing){const id=recognize(G.drawing.pts);const l=G.drawing.pts[G.drawing.pts.length-1];
    const cid=id&&creationForShape(id),ok=!!cid,txt=id?(ok?CREATIONS[cid].name:CREATIONS[id].shape+' (not equipped)').toUpperCase():'...';
    ctx.font='11px Silkscreen, monospace';ctx.textAlign='left';const w=ctx.measureText(txt).width+(ok?30:12),x0=Math.min(W-w-8,l.x+18),y0=Math.max(8,l.y-36);
    ctx.fillStyle='#1a0f0ee6';ctx.fillRect(x0,y0,w,22);ctx.fillStyle=ok?'#ff9a3c':'#5a3a30';ctx.fillRect(x0,y0+21,w,1);
    if(ok){const im=SPR[cid].r;ctx.drawImage(im,x0+4,y0+3,Math.round(im.width*16/im.height*.9),15)}
    ctx.fillStyle=ok?'#fff1d0':'#9c8a76';ctx.fillText(txt,x0+(ok?26:6),y0+15)}
  // focus meter (bottom right)
  const k=HUDK,fw=Math.round(120*k),fx=W-fw-16*k,fy=H-20*k;
  ctx.fillStyle='#1a0f0e';ctx.fillRect(fx-2,fy-2,fw+4,6*k+4);ctx.fillStyle='#3a2622';ctx.fillRect(fx,fy,fw,6*k);ctx.fillStyle='#ff9a3c';ctx.fillRect(fx,fy,Math.round(fw*clamp(G.focusLeft/G.player.focus,0,1)),6*k);
  ctx.font=Math.round(10*k)+'px Silkscreen, monospace';ctx.textAlign='right';ctx.fillStyle=G.castCd>0?'#e0504e':'#e9dcc3';ctx.fillText(G.castCd>0?'RECHARGING':'FOCUS',W-16*k,fy-6*k);
  {const k=HUDK,P_=G.player,mx_=P_.dashMax||2,ch=P_.dashCharges==null?mx_:P_.dashCharges,cdF=ch<mx_?1-Math.max(0,P_.dashCd)/(DASH.cd*(P_.dashCdMul||1)):0,gap=3*k,pw=Math.floor((fw*.5-gap*(mx_-1))/mx_);
   for(let i=0;i<mx_;i++){const x0=fx+i*(pw+gap);ctx.fillStyle='#1a0f0e';ctx.fillRect(x0-1,fy-20*k,pw+2,6*k);ctx.fillStyle='#3a2e28';ctx.fillRect(x0,fy-19*k,pw,4*k);
     if(i<ch){ctx.fillStyle='#e9dcc3';ctx.fillRect(x0,fy-19*k,pw,4*k)}else if(i===ch){ctx.fillStyle='#7a6656';ctx.fillRect(x0,fy-19*k,Math.round(pw*cdF),4*k)}}
   ctx.fillStyle='#e9dcc3';ctx.font=Math.round(8*k)+'px Silkscreen, monospace';ctx.textAlign='left';ctx.fillText(isTouch?'DASH: DOUBLE-TAP':'DASH: SPACE',fx,fy-24*k)}
  if(stick.active){ctx.strokeStyle='#e9dcc355';ctx.lineWidth=2;ctx.beginPath();ctx.arc(stick.ox,stick.oy,55,0,6.283);ctx.stroke();const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.min(55,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);ctx.fillStyle='#e9dcc388';ctx.beginPath();ctx.arc(stick.ox+Math.cos(a)*d,stick.oy+Math.sin(a)*d,22,0,6.283);ctx.fill()}
  else if(G.t<8){ctx.fillStyle='#e9dcc377';ctx.font='12px Silkscreen, monospace';ctx.textAlign='center';if(isTouch){ctx.fillText('< MOVE',W*.25,H-56);ctx.fillText('DRAW >',W*.75,H-56);ctx.fillStyle='#e9dcc322';ctx.fillRect(W/2-1,H*.3,2,H*.5)}else ctx.fillText(controlsHint().toUpperCase(),W/2,H-56)}
}
// dithered darkness with a warm light radius around the mage
let lightCv=null,lightKey='';
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function drawLight(p){
  const R=Math.round(Math.min(BW,BH)*.62),key=BW+'x'+BH;
  if(lightKey!==key){lightKey=key;const w=BW*2,h=BH*2;lightCv=document.createElement('canvas');lightCv.width=w;lightCv.height=h;const x=lightCv.getContext('2d');const img=x.createImageData(w,h);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){const d=Math.hypot(i-w/2,(j-h/2)*1.15)/R;let lv=clamp((d-.45)/.6,0,1)*4+BAYER[(j&3)*4+(i&3)]/16;lv=Math.floor(lv);const a=[0,.18,.34,.5,.66][Math.min(4,lv)];const k=(j*w+i)*4;img.data[k]=14;img.data[k+1]=8;img.data[k+2]=10;img.data[k+3]=a*255}
    x.putImageData(img,0,0)}
  bx.drawImage(lightCv,Math.round(X(p.x)-lightCv.width/2),Math.round(Y(p.y)-8-lightCv.height/2));
}
function hash(a,b){let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
function drawGround(){
  const T=SPR.tiles[G.era.tile]||SPR.tile,tw=T.width;
  const offx=((Math.round(-cam.x/Z+BW/2+ox))%tw+tw)%tw-tw,offy=((Math.round(-cam.y/Z+BH/2+oy))%tw+tw)%tw-tw;
  for(let x=offx;x<BW;x+=tw)for(let y=offy;y<BH;y+=tw)bx.drawImage(T,x,y);
  // deterministic decor per world cell
  const C=150,vw=viewW()/2+60,vh=viewH()/2+60;
  const x0=Math.floor((cam.x-vw)/C),x1=Math.floor((cam.x+vw)/C),y0=Math.floor((cam.y-vh)/C),y1=Math.floor((cam.y+vh)/C);
  const D=SPR.decos[G.era.decor]||SPR.deco;
  for(let i=x0;i<=x1;i++)for(let j=y0;j<=y1;j++){
    const h=hash(i,j),h2=hash(j*7+3,i*13+1);const wx=i*C+h2*C,wy=j*C+((h*7)%1)*C;
    if(h<.10)bx.drawImage(SPR.dirts[G.era.decor]||SPR.dirt,X(wx)-24,Y(wy)-24);
    else if(h<.14&&G.era.decor==='stone')drawTar(wx,wy,h2);
    if(h2<.18)blit(D.rock1,wx+30,wy+10);else if(h2<.26)blit(D.rock2,wx-20,wy+40);
    else if(h2<.32)blit(D.bones,wx,wy+30);else if(h2<.35)blit(D.skull,wx+10,wy-20);
    else if(h2<.55)blit(D.fern,wx-30,wy-10);
    if(h>.45)blit(D.grass,wx+((h*31)%1)*C*.5,wy+((h*17)%1)*C*.4);
    if(h>.8)blit(D.flower,wx-40,wy+50);
  }
}
function drawTar(wx,wy,h){
  const cx=X(wx),cy=Y(wy),rx=10+Math.round(h*8),ry=Math.round(rx*.55);
  for(let j=-ry;j<=ry;j++){const w=Math.round(rx*Math.sqrt(1-(j*j)/(ry*ry)));bx.fillStyle=Math.abs(j)>=ry-1?'#2a201a':'#17120f';bx.fillRect(cx-w,cy+j,w*2,1)}
  bx.fillStyle='#3a3230';bx.fillRect(cx-rx+4,cy-ry+2,4,1);
  const b=Math.floor(G.t*2+h*10)%4;if(b<2){bx.fillStyle='#2e2622';bx.fillRect(cx+Math.round(h*6)-2,cy-1+b,2,2)}
}
function drawPlayer(p){
  if(p.invul>0&&Math.floor(G.t*20)%2)return;
  const left=Math.cos(p.face)<0;shadow(p.x,p.y,6);
  const fr=p.moving?SPR.mage[Math.floor(G.t*9)%4]:SPR.mage[0];
  const bob=p.moving?0:(Math.floor(G.t*2)%2);
  const im=left?fr.l:fr.r;bx.drawImage(im,X(p.x)-(im.width>>1),Y(p.y)-im.height+1+bob);
  if(G.slow){bx.fillStyle='#ffe08a';const sx=X(p.x)+(left?-5:5),sy=Y(p.y)-10;bx.fillRect(sx-1,sy-1,3,3)}
  // hp bar under player
  const w=16,sx=X(p.x)-8,sy=Y(p.y)+3;bx.fillStyle='#1a0f0e';bx.fillRect(sx-1,sy-1,w+2,4);bx.fillStyle='#4a1a1e';bx.fillRect(sx,sy,w,2);bx.fillStyle='#e0504e';bx.fillRect(sx,sy,Math.round(w*clamp(p.hp/p.maxHp,0,1)),2);
}
function drawBossGround(){for(const e of G.enemies){if(!e.T.boss)continue;
    if(e.leap&&onScr(e.leap.x,e.leap.y,120)){const k=1-e.leap.t/e.leap.max,r=Math.round((10+e.r*1.6)/Z*(.4+.6*k));const sx=X(e.leap.x),sy=Y(e.leap.y);
      bx.strokeStyle=(Math.floor(G.t*12)%2)?'#ff5a4a':'#ffe08a';bx.lineWidth=1;bx.beginPath();bx.ellipse(sx+.5,sy+.5,r,Math.max(2,r*.5),0,0,6.283);bx.stroke();
      bx.fillStyle='rgba(255,70,50,.22)';bx.beginPath();bx.ellipse(sx,sy,r*k,Math.max(1,r*.5*k),0,0,6.283);bx.fill();SCREEN_LABELS.push({txt:'!',x:sx-1,y:sy-r*.5-3,col:'#ff5a4a',size:7})}
    if(!onScr(e.x,e.y,90))continue;const pr=(e.r*1.25+6+Math.sin(G.t*4)*3)/Z,sx=X(e.x),sy=Y(e.y);
    bx.strokeStyle=e.type===finalBoss()?'#ff5a4a':'#ffe08a';bx.globalAlpha=.55+.3*Math.sin(G.t*4);bx.lineWidth=1;bx.beginPath();bx.ellipse(sx+.5,sy+.5,pr,Math.max(2,pr*.45),0,0,6.283);bx.stroke();
    bx.globalAlpha=.18;bx.fillStyle=bx.strokeStyle;bx.beginPath();bx.ellipse(sx,sy,pr*.8,Math.max(1,pr*.36),0,0,6.283);bx.fill();bx.globalAlpha=1}}
const MARK_CROWN=['g.g.g','ggggg','gyggy'.replace(/y/g,'g'),'ggggg'],MARK_SKULL=['.www.','wwwww','wkwkw','.www.','.w.w.'];
function drawBossMark(e,top){const fin=e.type===finalBoss(),art=fin?MARK_SKULL:MARK_CROWN,c={g:'#ffd23a',w:'#f4ead2',k:'#1a0f0e'},bob=Math.round(Math.sin(G.t*3));
  const sx=X(e.x)-2,sy=top-art.length+bob;bx.fillStyle='#1a0f0e';bx.fillRect(sx-1,sy-1,7,art.length+2);
  art.forEach((row,j)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='.')continue;bx.fillStyle=c[ch];bx.fillRect(sx+i,sy+j,1,1)}})}
function drawEnemy(e){
  const st=e.T.spr?SPR.en[e.T.spr]:blobSprite(e.T);
  const left=G.player.x<e.x;shadow(e.x,e.y,Math.max(3,Math.round(st.w/3)));
  const frame=st.frames?st.frames[Math.floor((G.t*6+e.wob))%st.frames.length]:st;
  const im=e.flash>0?(left?frame.wl:frame.wr):(left?frame.l:frame.r);
  const hop=(Math.floor(G.t*6+e.wob)&1)&&!st.frames?1:0;
  if(e.T.boss){const wim=left?frame.wl:frame.wr,ix=X(e.x)-(im.width>>1),iy=Y(e.y)-im.height+2-hop;bx.globalAlpha=.7+.3*Math.sin(G.t*6);
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])bx.drawImage(wim,ix+dx,iy+dy);bx.globalAlpha=1}
  bx.drawImage(im,X(e.x)-(im.width>>1),Y(e.y)-im.height+2-hop);
  if(e.T.boss)drawBossMark(e,Y(e.y)-im.height-9-hop);
  if(e.T.boss||e.T.elite){const w=Math.max(16,st.w),sx=X(e.x)-(w>>1),sy=Y(e.y)-im.height-3;bx.fillStyle='#1a0f0e';bx.fillRect(sx-1,sy-1,w+2,4);bx.fillStyle='#e0504e';bx.fillRect(sx,sy,Math.round(w*clamp(e.hp/e.maxHp,0,1)),2)}
}
function drawCreation(c){
  const st=SPR[c.id];const frac=Math.min(c.life/c.max,c.uses/c.maxUses);
  if(frac<.25&&Math.floor(G.t*12)%2)return;
  const sx=X(c.x),sy=Y(c.y);
  if(c.def.kind==='melee'){
    bx.save();bx.translate(sx,sy);bx.rotate(c.ang+Math.PI/2+(c.swing>0?c.swing*1.4:0));bx.drawImage(st.r,-(st.w>>1),-st.h+2);bx.restore();
  }else{
    const bob=(Math.floor(G.t*3+c.ang)&1);bx.drawImage(st.r,sx-(st.w>>1),sy-(st.h>>1)-bob);
  }
  const w=10;bx.fillStyle='#1a0f0e';bx.fillRect(sx-5,sy+(c.def.kind==='melee'?4:st.h/2+1|0),w+1,3);bx.fillStyle=frac<.25?'#e0504e':'#ff9a3c';bx.fillRect(sx-4,sy+(c.def.kind==='melee'?5:st.h/2+2|0),Math.round((w-1)*frac),1);
}
function drawShot(s){
  const sid=s.def.proj||s.id;if(s.def.fire&&Math.random()<.7)G.fx.push({x:s.x,y:s.y,vx:rnd(-20,20),vy:rnd(-40,0),life:.3,max:.3,col:Math.random()<.5?'#ff4a2a':'#ffe08a',r:2});
  const im=sid==='spear'?SPR.p_spear:sid==='rock'?SPR.p_rock:SPR.p_pebble;
  bx.save();bx.translate(X(s.x),Y(s.y));if(sid!=='rock')bx.rotate(Math.round(s.rot/(Math.PI/8))*(Math.PI/8));bx.drawImage(im,-(im.width>>1),-(im.height>>1));bx.restore();
}
function drawStroke(pts,col,a,live){
  if(pts.length<2)return;bx.save();bx.globalAlpha=a;bx.lineCap='round';bx.lineJoin='round';
  const path=()=>{bx.beginPath();bx.moveTo(pts[0].x/S,pts[0].y/S);for(const q of pts)bx.lineTo(q.x/S,q.y/S)};
  path();bx.strokeStyle='#1a0f0e';bx.lineWidth=live?6:5+(1-a)*3;bx.stroke();
  bx.strokeStyle=live?'#c2501e':col;bx.lineWidth=live?4:3+(1-a)*2;bx.stroke();
  bx.strokeStyle=live?'#ffb35c':'#ffe08a';bx.lineWidth=live?2:1;bx.stroke();
  // ink beads along the stroke + hot tip
  bx.fillStyle='#fff1d0';for(let i=0;i<pts.length;i+=4){const q=pts[i];bx.fillRect(Math.round(q.x/S),Math.round(q.y/S),1,1)}
  if(live){const l=pts[pts.length-1],tx=Math.round(l.x/S),ty=Math.round(l.y/S),f=Math.floor(performance.now()/80)%2;
    bx.fillStyle='#1a0f0e';bx.fillRect(tx-3,ty-3,7,7);bx.fillStyle='#ff9a3c';bx.fillRect(tx-2,ty-2,5,5);bx.fillStyle='#fff6e0';bx.fillRect(tx-1+f,ty-1,2,2);
    if(Math.random()<.6&&G)G.fx.push({x:cam.x+(l.x/S-BW/2)*Z+rnd(-4,4),y:cam.y+(l.y/S-BH/2)*Z+rnd(-4,4),vx:rnd(-30,30),vy:rnd(-60,-10),life:rnd(.2,.45),max:.45,col:Math.random()<.5?'#ff9a3c':'#ffe08a',r:2})}
  bx.restore();
}

// menu background: slow drifting embers on dark wine
const motes=Array.from({length:40},()=>({x:Math.random(),y:Math.random(),s:rnd(.01,.03),h:Math.random()}));
function drawMenuBg(dt){for(const m of motes){m.y-=m.s*dt;if(m.y<0)m.y=1;ctx.fillStyle=m.h>.6?'#ff9a3c55':'#7a1f2b88';const s=m.h>.8?4:2;ctx.fillRect(Math.round(m.x*W),Math.round(m.y*H),s,s)}}

// ================= HUD =================
function updateHud(){
  const p=G.player;
  $('hpb').style.width=clamp(p.hp/p.maxHp*100,0,100)+'%';$('hpt').textContent=`${Math.ceil(Math.max(0,p.hp))}/${Math.round(p.maxHp)}`;
  $('xpb').style.width=(G.xp/G.xpNext*100)+'%';$('lvt').textContent='LV '+G.level;
  const s=Math.floor(G.t);$('timer').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  $('wave').textContent='WAVE '+G.wave;$('kills').textContent=G.kills;$('runcoins').textContent=G.coins;
  const boss=G.enemies.find(e=>e.T.boss);const bb=$('bossbar');
  if(boss){bb.classList.remove('hidden');$('bbName').textContent=boss.T.name;$('bbTitle').textContent=boss.T.title;$('bbFill').style.width='calc('+clamp(boss.hp/boss.maxHp*100,0,100)+'% - 2px)';$('bbHp').textContent=Math.ceil(Math.max(0,boss.hp))+' / '+Math.round(boss.maxHp)}else bb.classList.add('hidden');
  if(updateHud.sig!==G.loadout.join()){updateHud.sig=G.loadout.join();
    $('icSkull').src=ICON.skull;$('icCoin').src=ICON.coin;
    $('slots').innerHTML=G.loadout.map(id=>`<div class="slot" id="sl-${id}"><img src="${ICON[id]}" alt=""><span class="sh">${CREATIONS[id].shape.toUpperCase()}</span><span class="n"></span><span class="du"><i></i></span></div>`).join('')}
  for(const id of G.loadout){const el=$('sl-'+id);if(!el)continue;const act=G.creations.filter(c=>c.id===id||c.def.base===id);
    el.classList.toggle('on',act.length>0);el.querySelector('.n').textContent=act.length?'x'+act.length:'';
    const f=act.length?Math.max(...act.map(c=>Math.min(c.life/c.max,c.uses/c.maxUses))):0;el.querySelector('.du i').style.width=(f*100)+'%'}
}
function togglePause(){
  if(!G)return;
  if(G.paused&&$('resume')){show('');G.paused=false;last=performance.now();return}
  if(G.paused)return;
  G.paused=true;pauseMenu();
}
function pauseMenu(){
  screenEl.classList.remove('live');setRoute('play');
  const build=Object.keys(G.picks).map(id=>{const pu=POWERUPS.find(p=>p.id===id);return `<li><img src="${ICON['pu_'+id]}" alt=""><span>${pu.name}</span><em>LV ${G.picks[id]}</em></li>`}).join('')||'<li class="mute">No upgrades yet</li>';
  show(`<div class="sheet"><header class="row"><span class="lab">${ERAS[CURRENT_ERA].name} · ${fmt(G.t)} · Wave ${G.wave}</span><span class="lab">${G.kills} kills</span></header>
   <h2 class="disp">Paused</h2>
   <div class="cols"><div><div class="lab rule">Build</div><ul class="build">${build}</ul></div>
   <div><div class="lab rule">Stats</div><ul class="stats"><li>Damage<em>x${G.player.dmgMul.toFixed(2)}</em></li><li>Cast cooldown<em>x${G.player.cdMul.toFixed(2)}</em></li><li>Durability<em>x${(G.player.durMul*G.era.durability).toFixed(2)}</em></li><li>Focus<em>${G.player.focus.toFixed(1)}s</em></li><li>Move<em>${Math.round(G.player.speed)}</em></li></ul></div></div>
   <nav class="menu"><button id="resume"><b>01</b>Resume<i>&rarr;</i></button><button id="pset"><b>02</b>Settings<i>&rarr;</i></button><button id="quit"><b>03</b>Give up and keep coins<i>&rarr;</i></button></nav></div>`);
  $('resume').onclick=togglePause;$('pset').onclick=()=>settings(true);$('quit').onclick=()=>confirmBox('End this run?','You keep the coins earned so far, but the run is over.','End run','Keep playing',()=>{show('');endRun()},()=>pauseMenu());
}

$('pauseBtn').onclick=togglePause;

// ================= SCREENS =================
let HUDK=1;
function applyScale(){
  const ui=clamp(Math.min(innerWidth/1050,innerHeight/590),1,2.6)*(save.uiScale||1);
  document.documentElement.style.setProperty('--ui',ui.toFixed(3));
  const hud=clamp(Math.min(innerWidth/760,innerHeight/430),1,3.2)*(save.hudScale||1);
  document.documentElement.style.setProperty('--hud',hud.toFixed(3));HUDK=hud;
}
addEventListener('resize',applyScale);
function show(html){if(!html)screenEl.classList.remove('live');screenEl.innerHTML=html;if(html){$('toast').style.opacity=0;clearTimeout(toastT)}}
const coinI=()=>`<img class="pi" src="${ICON.coin}" alt="coins">`,gemI=()=>`<img class="pi" src="${ICON.gemHard}" alt="gems">`;
function home(){
  leaveRun();setRoute('home');mode='home';G=null;$('hud').classList.add('hidden');const E=ERAS[CURRENT_ERA];
  show(`<div class="home">
   <div class="home-l"><div class="lab">Era ${E.no} &mdash; ${E.name} &middot; ${E.date}</div>
    <h1 class="mast">Era<br>Draw</h1>
    <p class="tag">Draw weapons from the age you are trapped in. Hold the line until the ink runs dry.</p>
    <div class="wallet">${coinI()}<b>${save.coins}</b>${gemI()}<b>${save.gems}</b><span class="lab">Best ${save.best?fmt(save.best):'&mdash;'} &middot; Runs ${save.runs}</span></div></div>
   <div class="home-r"><div class="plate"><canvas id="diorama" width="160" height="48"></canvas><div class="cap"><span class="lab">Fig. 1 &mdash; The mage</span><span class="lab">Era I</span></div></div><nav class="menu">
    <button id="play" class="prim"><b>01</b>Enter the ${E.name}<i>&rarr;</i></button>
    <button id="lo"><b>02</b>Loadout<span>${save.loadout.length} / ${save.slots}</span><i>&rarr;</i></button>
    <button id="shop"><b>03</b>Shop<i>&rarr;</i></button>
    <button id="set"><b>04</b>Settings<i>&rarr;</i></button>
    <button id="how"><b>05</b>How to play<i>&rarr;</i></button>
   </nav></div></div>`);startDiorama();
  $('play').onclick=()=>{goLandscape();startRun()};$('lo').onclick=loadout;$('shop').onclick=shop;$('how').onclick=how;$('set').onclick=settings;
}
function startDiorama(){
  const cv2=$('diorama');if(!cv2)return;const x=cv2.getContext('2d');x.imageSmoothingEnabled=false;let t0=performance.now();
  const loop=now=>{if(!document.body.contains(cv2))return;const t=Math.max(0,(now-t0)/1000);
    for(let i=0;i<160;i+=64)x.drawImage(SPR.tile,i,0);x.drawImage(SPR.dirt,100,6);x.drawImage(SPR.deco.fern,20,30);x.drawImage(SPR.deco.bones,128,38);x.drawImage(SPR.deco.rock1,6,8);
    const m=SPR.mage[0].r;x.drawImage(m,48,22-(Math.floor(t*2)%2));
    const ph=(t%3)/3;// club orbits
    const cl=SPR.club.r;x.drawImage(cl,48+8+Math.round(Math.cos(t*2.2)*16)-4,30+Math.round(Math.sin(t*2.2)*8)-8);
    const b=SPR.en.bird.frames[Math.floor(t*6)%2],bx2=150-((t*28)%110);x.drawImage(b.l,Math.round(bx2),24);
    const sb=SPR.en.saber.frames[Math.floor(t*6)%2];x.drawImage(sb.l,Math.round(170-((t*20+50)%140)),32);
    x.fillStyle='rgba(20,11,12,.35)';x.fillRect(0,0,160,48);
    requestAnimationFrame(loop)};requestAnimationFrame(loop);
}
function sheet(title,lab,body,back='Back'){return `<div class="sheet"><header class="row"><span class="lab">${lab}</span><button class="lab back" id="back">&larr; ${back}</button></header><h2 class="disp">${title}</h2>${body}</div>`}
function settings(inRun){
  inRun=inRun===true&&mode==='run'&&!!G;
  if(inRun){G.paused=true;setRoute('play/settings');screenEl.classList.add('live')}else{screenEl.classList.remove('live');leaveRun();setRoute('settings')}
  const again=()=>settings(inRun);
  const sl=(id,label,key,min,max)=>`<label class="slider"><b>${label}</b><input type="range" id="${id}" min="${min}" max="${max}" step="10" value="${Math.round((save[key]||1)*100)}"><span id="${id}v">${Math.round((save[key]||1)*100)}%</span></label>`;
  show(sheet('Settings',inRun?'Paused &mdash; changes apply live':'04 &mdash; Options',`<div class="cols"><div><div class="lab rule">Display</div>
   ${sl('sHud','HUD size','hudScale',50,200)}${sl('sZoom','Game zoom','zoom',50,200)}${sl('sUi','Menu text size','uiScale',70,160)}
   <button class="lab back" id="sReset">Reset to defaults</button></div>
   <div><div class="lab rule">Play</div><nav class="menu">
   <button id="am"><b>01</b>Auto-move (kite)<span>${save.autoMove?'On':'Off'}</span><i>${save.autoMove?'&#9632;':'&#9633;'}</i></button>
   <button id="snd"><b>02</b>Sound<span>${save.mute?'Off':'On'}</span><i>${save.mute?'&#9633;':'&#9632;'}</i></button>
   <button id="hap"><b>03</b>Haptics<span>${save.haptics===false?'Off':'On'}</span><i>${save.haptics===false?'&#9633;':'&#9632;'}</i></button>
   <button id="mus"><b>04</b>Music<span>${save.music===false?'Off':'On'}</span><i>${save.music===false?'&#9633;':'&#9632;'}</i></button>
   <button id="perf"><b>05</b>Performance mode<span>${save.perf?'On':'Off'}</span><i>${save.perf?'&#9632;':'&#9633;'}</i></button></nav>
   <p class="note" id="perfNote">Performance mode: draws the world at a lower internal resolution (150 instead of 180 lines tall, so about 30% fewer pixels), cuts hit and death particles to 40% and caps them at 160 on screen, and limits enemies on screen to 140 (normally 320). Gameplay rules and damage are unchanged. It turns on by itself on small or low-end devices until you change it.</p>
   <p class="note">Auto-move steers the mage away from nearby enemies and toward XP whenever you are not steering.</p></div></div>`));
  for(const [id,key] of [['sHud','hudScale'],['sZoom','zoom'],['sUi','uiScale']]){const el=$(id);el.oninput=()=>{save[key]=el.value/100;save.scaleSet=true;$(id+'v').textContent=el.value+'%';applyScale();layoutBuf();persist()}}
  $('sReset').onclick=()=>{save.hudScale=save.zoom=save.uiScale=1;persist();applyScale();layoutBuf();again()};
  $('perf').onclick=()=>{save.perf=!save.perf;save.perfSet=true;persist();layoutBuf();again()};$('mus').onclick=()=>{save.music=save.music===false;persist();again()};$('am').onclick=()=>{save.autoMove=!save.autoMove;persist();again()};$('snd').onclick=()=>{save.mute=!save.mute;persist();again()};$('hap').onclick=()=>{save.haptics=save.haptics===false;persist();haptic(20);again()};$('back').onclick=inRun?pauseMenu:home;if(inRun){render(0);updateHud()}
}
function controlsHint(){return isTouch?'Left thumb: move · Right thumb: draw':'Hold right-click: walk · Left-drag: draw · WASD also works'}
function fmt(s){s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function how(){
  leaveRun();setRoute('how-to-play');
  show(sheet('How to play','05 &mdash; Field notes',`<div class="cols">
   <div><div class="lab rule">Controls</div><ul class="stats"><li>Phone<em>left thumb moves, right thumb draws</em></li><li>Laptop<em>hold right-click to walk, left-drag to draw</em></li><li>Keys<em>WASD / arrows</em></li><li>Focus<em>time slows while drawing, up to ${BASE_FOCUS}s</em></li></ul>
   <p class="note">Creations fight on their own and wear out. Up to ${BASE_CAPS.melee} melee or ${BASE_CAPS.ranged} ranged at once; one more replaces the oldest. Drawing a different weapon shatters the ones you have out.</p>
   <div class="lab rule" style="margin-top:10px">Combos &amp; evolutions</div><ul class="stats">${Object.entries(COMBOS).map(([k,c])=>`<li>${k.split('+').map(x=>CREATIONS[x].name).join(' + ')} quickly<em>${c.name}</em></li>`).join('')}<li>Draw a weapon ${MASTERY}x + its powerup<em>Evolution</em></li></ul></div>
   <div><div class="lab rule">Shapes</div><ul class="build">${save.owned.map(id=>`<li><img src="${ICON[id]}" alt=""><span>${CREATIONS[id].name}</span><em>${CREATIONS[id].shape}</em></li>`).join('')}</ul></div></div>`));
  $('back').onclick=home;
}
function wStats(d){return `DMG ${d.dmg} &middot; ${d.kind==='melee'?'MELEE':'RANGED'} &middot; ${d.life}s`}
function shapeDemo(id){ // tiny svg of the stroke to draw
  const P={club:'M20 40 L60 40',spear:'M8 44 L92 36',rock:'M50 18 A22 22 0 1 1 49.9 18',sling:'M25 20 L50 62 L75 20',dagger:'M18 22 L40 60 L60 22 L82 60'};
  if(!P[id]){const K={short:'club',long:'spear',circle:'rock',v:'sling',zig:'dagger'},d=CREATIONS[id];id=K[d&&d.shapeKey]||'club'}
  return `<svg viewBox="0 0 100 80" class="demo"><path d="${P[id]}" fill="none" stroke="#1a0f0e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="${P[id]}" fill="none" stroke="#ff9a3c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="${P[id]}" fill="none" stroke="#ffe08a" stroke-width="1.5" stroke-linecap="round"/></svg>`}
function detailPane(id,extra=''){const d=CREATIONS[id];const dur=Math.round(d.life*ERAS[CURRENT_ERA].durability);
  return `<aside class="pane"><div class="pane-art"><img src="${iconURL(SPR[id].r,8)}" alt=""></div>
   <div class="lab">${d.kind==='melee'?'Melee &middot; orbits &amp; smashes':'Ranged &middot; auto-fires'}</div><h3 class="pane-nm">${d.name}</h3>
   <div class="pane-shape">${shapeDemo(id)}<span class="lab">Draw a ${d.shape}</span></div>
   <ul class="stats"><li>Damage<em>${d.dmg}</em></li><li>Lasts<em>${dur}s / ${d.uses} uses</em></li><li>Max active<em>${BASE_CAPS[d.kind]}</em></li>${d.pierce?`<li>Pierce<em>${d.pierce}</em></li>`:''}${d.aoe?`<li>Blast radius<em>${d.aoe}</em></li>`:''}</ul>${extra}</aside>`}
function loadout(){
  leaveRun();setRoute('loadout');
  const sel=save.loadout.slice();let focus=sel[0]||'club';
  const render=()=>{show(sheet('Loadout',`02 &mdash; Choose up to ${save.slots} &middot; ${sel.length} selected`,`<div class="split"><div><div class="tbl">${Object.keys(CREATIONS).filter(k=>!CREATIONS[k].hidden).map((id,i)=>{const d=CREATIONS[id],own=save.owned.includes(id),on=sel.includes(id);
      return `<button class="cell ${on?'on':''} ${own?'':'lock'} ${focus===id?'foc':''}" data-id="${id}"><span class="cell-h"><b>0${i+1}</b>${on?'<i class="chk">&#9632; Equipped</i>':''}</span><img src="${ICON[id]}" alt=""><span class="nm">${d.name}</span><span class="sh">Draw a ${d.shape}</span><span class="st">${own?wStats(d):'Locked &middot; '+d.cost+' coins'}</span></button>`}).join('')}</div>
      <nav class="menu"><button id="ok" class="prim" ${sel.length?'':'disabled'}><b>&mdash;</b>Save loadout<i>&rarr;</i></button></nav></div>${detailPane(focus,save.owned.includes(focus)?'':`<p class="note">Unlock in the shop for ${CREATIONS[focus].cost} coins.</p>`)}</div>`));
  screenEl.querySelectorAll('.cell').forEach(el=>{el.onmouseenter=()=>{if(focus!==el.dataset.id){focus=el.dataset.id;render()}};el.onclick=()=>{const id=el.dataset.id;focus=id;if(!save.owned.includes(id)){toast('Unlock it in the shop');render();return}const i=sel.indexOf(id);if(i>=0)sel.splice(i,1);else if(sel.length<save.slots)sel.push(id);else toast('Slots full');render()}});
  $('ok').onclick=()=>{if(!sel.length)return;save.loadout=sel;persist();home()};$('back').onclick=home};
  render();
}
function shop(){
  leaveRun();setRoute('shop');
  const f=SHOP.find(s=>s.id===shop.focus)||SHOP[0];
  const pane=f.type==='creation'?detailPane(f.id):`<aside class="pane"><div class="pane-art"><img src="${f.id==='slot4'?iconURL(SPR.chest,8):f.id==='dbl'?iconURL(SPR.pu.coin,8):iconURL(SPR.pu.wind,8)}" alt=""></div><div class="lab">${f.type==='slot'?'Upgrade':'Coming soon'}</div><h3 class="pane-nm">${f.name}</h3><p class="note">${f.type==='slot'?'Carry four creations into every run instead of three.':f.note}</p></aside>`;
  show(sheet('Shop',`03 &mdash; ${coinI()} ${save.coins} &nbsp; ${gemI()} ${save.gems}`,`<div class="split"><div class="list">${SHOP.map((it,i)=>{
    const d=it.type==='creation'?CREATIONS[it.id]:it;const owned=it.type==='creation'?save.owned.includes(it.id):it.type==='slot'?save.slots>=4:false;
    const desc=it.type==='creation'?`New creation &middot; draw a ${d.shape} &middot; ${wStats(d)}`:it.type==='slot'?'Bring a fourth creation into each run':it.note;
    const icon=it.type==='creation'?ICON[it.id]:it.id==='slot4'?ICON.slot4:it.id==='dbl'?ICON.pu_coin:ICON.pu_wind;
    const afford=it.cur==='coins'?save.coins>=it.cost:save.gems>=it.cost;
    return `<div class="li"><b>0${i+1}</b><img src="${icon}" alt=""><div class="li-t"><span class="nm">${d.name}</span><span class="sh">${desc}</span></div>
     <button class="buy ${owned?'own':''} ${afford||owned?'':'poor'}" data-id="${it.id}">${owned?'Owned':(it.cur==='coins'?coinI():gemI())+' '+it.cost}</button></div>`}).join('')}</div>${pane}</div>`));
  screenEl.querySelectorAll('.li').forEach(el=>el.onmouseenter=()=>{const id=el.querySelector('.buy').dataset.id;if(shop.focus!==id){shop.focus=id;shop()}});
  screenEl.querySelectorAll('.buy').forEach(el=>el.onclick=()=>buy(SHOP.find(s=>s.id===el.dataset.id)));
  $('back').onclick=home;
}
function buy(it){
  if(it.type==='stub'){toast('Gems and ads are coming soon');return}
  if(it.type==='creation'&&save.owned.includes(it.id))return;if(it.type==='slot'&&save.slots>=4)return;
  if(save.coins<it.cost){toast('Not enough coins');return}
  save.coins-=it.cost;sfx('pick');
  if(it.type==='creation'){save.owned.push(it.id);if(save.loadout.length<save.slots)save.loadout.push(it.id);toast(CREATIONS[it.id].name+' unlocked')}
  if(it.type==='slot'){save.slots=4;toast('Fourth slot unlocked')}
  persist();shop();
}
function goLandscape(){
  if(!isTouch)return;
  try{const el=document.documentElement,rf=el.requestFullscreen||el.webkitRequestFullscreen;
    const p=rf&&!document.fullscreenElement?rf.call(el,{navigationUI:'hide'}):null;
    const lock=()=>{try{const o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(()=>{})}catch(e){}};
    if(p&&p.then)p.then(lock,lock);else lock();
  }catch(e){}
}
// Rotate overlay: touch devices in portrait pause the run
let rotPaused=false;
function checkOrientation(){
  const portrait=isTouch&&innerHeight>innerWidth;
  $('rotate').classList.toggle('hidden',!portrait);
  if(portrait&&mode==='run'&&G&&!G.paused){G.paused=true;rotPaused=true;stick.id=null;stick.active=false;G.drawing=null}
  else if(!portrait&&rotPaused){rotPaused=false;if(G&&mode==='run'&&!screenEl.innerHTML)G.paused=false;last=performance.now()}
}
addEventListener('resize',checkOrientation);addEventListener('orientationchange',()=>setTimeout(checkOrientation,200));
function startRun(){
  sessionStorage.removeItem(RUN_KEY);screenEl.classList.remove('live');show('');$('bossbar').classList.add('hidden');G=null;setRoute('play');
  CURRENT_ERA=(save.era&&ERAS[save.era]&&!ERAS[save.era].locked&&(save.eras||['stone']).includes(save.era))?save.era:'stone';
  newRun();mode='run';show('');$('hud').classList.remove('hidden');updateHud.sig=null;cam.x=0;cam.y=0;last=performance.now();
  toast(ERAS[CURRENT_ERA].name+' · survive');setTimeout(()=>mode==='run'&&toast(controlsHint()),1700);mouse.walk=false;checkOrientation();
}
function endRun(){
  if(mode!=='run')return;mode='dead';$('bossbar').classList.add('hidden');sessionStorage.removeItem(RUN_KEY);
  const coins=calcCoins();save.coins+=coins;save.runs++;const newBest=G.t>save.best;if(newBest)save.best=G.t;
  save.lastRun={era:CURRENT_ERA,t:G.t,wave:G.wave,kills:G.kills,level:G.level,coins,newBest,run:save.runs};persist();
  $('hud').classList.add('hidden');sfx('die');G=null;results();
}
function results(){
  setRoute('results');mode='dead';$('hud').classList.add('hidden');const r=save.lastRun;
  if(!r){home();return}
  show(`<div class="sheet res"><header class="row"><span class="lab">${ERAS[r.era].name} &middot; Run ${r.run}</span><span class="lab">${r.newBest?'New best':'Best '+fmt(save.best)}</span></header>
   <h2 class="disp">The ink fades.</h2>
   <div class="resgrid"><div><b>01</b><span class="lab">Survived</span><em>${fmt(r.t)}</em></div><div><b>02</b><span class="lab">Wave</span><em>${r.wave}</em></div><div><b>03</b><span class="lab">Kills</span><em>${r.kills}</em></div><div><b>04</b><span class="lab">Level</span><em>${r.level}</em></div><div class="gold"><b>05</b><span class="lab">Coins earned</span><em>+${r.coins}</em></div></div>
   <p class="note">Total ${coinI()} ${save.coins}</p>
   <nav class="menu"><button id="retry" class="prim"><b>01</b>Draw again<i>&rarr;</i></button><button id="hm"><b>02</b>Home<i>&rarr;</i></button></nav></div>`);
  $('retry').onclick=()=>{goLandscape();startRun()};$('hm').onclick=home;
}
// ================= ROUTING + RUN PERSISTENCE =================
const RUN_KEY='eradraw.run.v1';
function setRoute(r){const h='#/'+r;if(location.hash!==h)history.pushState(null,'',h)}
function leaveRun(){screenEl.classList.remove('live');if(mode==='run'&&G){saveRun();$('hud').classList.add('hidden');$('bossbar').classList.add('hidden')}}
function saveRun(){
  if(mode!=='run'||!G||G.dead||G.player.hp<=0)return;
  const p=G.player;
  const d={t:G.t,wave:G.wave,kills:G.kills,level:G.level,xp:G.xp,xpNext:G.xpNext,bonus:G.bonus||0,evT:G.evT||0,spawnT:G.spawnT,bossNext:G.bossNext,loadout:G.loadout,picks:G.picks,bossKills:G.bossKills||{},
    player:{...p},focusLeft:G.focusLeft,
    creations:G.creations.map(c=>({id:c.id,life:c.life,max:c.max,uses:c.uses,maxUses:c.maxUses,ang:c.ang,dir:c.dir})),
    enemies:G.enemies.map(e=>({type:e.type,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,speed:e.speed,dmg:e.dmg})),
    orbs:G.orbs.map(o=>({x:o.x,y:o.y,v:o.v,n:o.n||1})),chests:G.chests};
  try{sessionStorage.setItem(RUN_KEY,JSON.stringify(d))}catch(e){}
}
function restoreRun(){
  let d=null;try{d=JSON.parse(sessionStorage.getItem(RUN_KEY))}catch(e){}
  if(!d||!d.player||d.player.hp<=0){sessionStorage.removeItem(RUN_KEY);return false}
  newRun();Object.assign(G,{t:d.t,wave:d.wave,kills:d.kills,level:d.level,xp:d.xp,xpNext:d.xpNext,bonus:d.bonus,evT:d.evT,spawnT:d.spawnT,bossNext:d.bossNext,loadout:d.loadout,bossKills:d.bossKills||{},picks:d.picks,focusLeft:d.focusLeft});
  Object.assign(G.player,d.player);G.player.invul=1.5;
  G.creations=d.creations.map(c=>({...c,def:CREATIONS[c.id],cd:.2,x:G.player.x,y:G.player.y,swing:0}));
  G.enemies=d.enemies.map(e=>({...e,T:ENEMY_TYPES[e.type],r:ENEMY_TYPES[e.type].r*(EN_SCALE[ENEMY_TYPES[e.type].spr]||1),kx:0,ky:0,flash:0,wob:Math.random()*6,st:'move',timer:rnd(1,3),vx:0,vy:0,sw:0}));
  G.orbs=d.orbs.map(o=>({...o,t:0}));G.chests=d.chests||[];
  mode='run';$('hud').classList.remove('hidden');updateHud.sig=null;cam.x=G.player.x;cam.y=G.player.y;last=performance.now();updateHud();
  togglePause();toast('Run restored');return true;
}
setInterval(saveRun,2000);
addEventListener('beforeunload',saveRun);addEventListener('pagehide',saveRun);
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveRun();if(mode==='run'&&G&&!G.paused)togglePause()}});
function route(){
  const r=(location.hash.replace(/^#\/?/,'')||'home');
  if(r==='play'){if(mode==='run'&&G){if(G.paused&&!$('resume'))pauseMenu();return}if(!restoreRun())startRun();return}
  if(r==='play/settings'){if(!(mode==='run'&&G)&&!restoreRun()){home();return}settings(true);return}
  ({home,loadout,shop,settings,'how-to-play':how,results}[r]||home)();
}
addEventListener('popstate',route);


// expose for tests
window.EraDraw={step:(a,b)=>simStep(a,b===undefined?a:b),mouse,kiteVector,recognize,get G(){return G},get mode(){return mode},startRun,save:()=>save,spawnCreation,ERAS,CREATIONS};
function boot(){applyScale();if(!location.hash)history.replaceState(null,'','#/home');route();checkOrientation();requestAnimationFrame(frame)}
