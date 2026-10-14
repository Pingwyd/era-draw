'use strict';
// ================= UPDATE: LOCAL MULTIPLAYER (same device, 2-4 players) =================
// P1 plays as usual (draws weapons). P2-P4 are companion mages on keyboard (IJKL + O dash) or gamepads (left stick + A dash):
// they auto-cast sketch bolts, share XP/coins, can be downed and revived. Enemies hunt the nearest mage; the camera frames everyone.
const ALLY_COLS=['#7fd8ff','#8fe07a','#ffd34a'];
const ALLY_PAL=[{h:'#2a5fa8',H:'#173a6a',r:'#4ea6e0',R:'#2a5fa8'},{h:'#3f6b2e',H:'#26421c',r:'#7f9e4c',R:'#4f6a2c'},{h:'#a88f4d',H:'#6e5c2c',r:'#d9c27a',R:'#a88f4d'}];
const ALLY_SPR=ALLY_PAL.map(pal=>[0,1,0,2].map(i=>set(grid([...MAGE_TOP,...LEGS[i]],{...PAL,...pal}))));
let PARTY=[]; // joined controllers for the next run: 'kb2' | 'pad0'..'pad3'
function pads(){try{return [...(navigator.getGamepads?navigator.getGamepads():[])].filter(Boolean)}catch(e){return []}}
function padById(ctrl){const i=+ctrl.slice(3);return pads().find(g=>g.index===i)}
function partyTargets(){if(!G||!G.allies||!G.allies.length)return null;const a=[G.player];for(const q of G.allies)if(!q.down)a.push(q);return a}
function camTarget(){const PL=partyTargets();if(!PL)return G.player;let x=0,y=0;for(const q of PL){x+=q.x;y+=q.y}return {x:x/PL.length,y:y/PL.length}}
function damageAlly(q,d){if(q.invul>0||q.down)return;q.hp-=d;q.invul=.5;sfx('hurt');burst(q.x,q.y,'#ff6b6b',8);const g=q.ctrl.startsWith('pad')&&padById(q.ctrl);
  try{g&&g.vibrationActuator&&g.vibrationActuator.playEffect('dual-rumble',{duration:120,strongMagnitude:.6,weakMagnitude:.3})}catch(e){}
  if(q.hp<=0){q.hp=0;q.down=true;q.rev=0;toast('P'+q.n+' is down! Stand next to them to revive');floatText(q.x,q.y-40,'DOWN','#ff6b6b',1.2)}}
runHooks.push(G=>{G.allies=(G.daily?[]:PARTY).map((ctrl,i)=>({n:i+2,ctrl,x:G.player.x+(i%2?30:-30),y:G.player.y+20+10*i,r:16,hp:80,maxHp:80,invul:1,speed:180,face:0,atkT:.5,dashT:0,dashCd:0,down:false,rev:0,shots:[]}));
  const n=1+G.allies.length;if(n>1){G.party=n;G.diffDef={...G.diffDef,spawn:G.diffDef.spawn*(1+.45*(n-1))};toast(n+' mages: enemies scale up')}});
const _coSpawn=spawnEnemy;spawnEnemy=function(){const e=_coSpawn.apply(this,arguments);if(e&&G&&G.party>1&&!('hpParty' in e)){const m=1+.6*(G.party-1);e.hp*=m;e.maxHp*=m;e.hpParty=1}return e};
function allyInput(q){let mx=0,my=0,dash=false;
  if(q.ctrl==='kb2'){if(keys.i)my--;if(keys.k)my++;if(keys.j)mx--;if(keys.l)mx++;dash=!!keys.o}
  else{const g=padById(q.ctrl);if(g){const ax=g.axes[0]||0,ay=g.axes[1]||0;if(Math.hypot(ax,ay)>.2){mx=ax;my=ay}
    if(g.buttons[14]&&g.buttons[14].pressed)mx=-1;if(g.buttons[15]&&g.buttons[15].pressed)mx=1;if(g.buttons[12]&&g.buttons[12].pressed)my=-1;if(g.buttons[13]&&g.buttons[13].pressed)my=1;
    dash=!!(g.buttons[0]&&g.buttons[0].pressed)}}
  const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m}return {mx,my,dash}}
CAVE_TICK.push(dt=>{if(!G.allies||!G.allies.length)return;const P=G.player,c=camTarget(),hw=viewW()/2-28,hh=viewH()/2-36;
  for(const q of G.allies){q.invul-=dt;q.dashCd-=dt;
    if(q.down){const near=[P,...G.allies.filter(o=>o!==q&&!o.down)].some(o=>Math.hypot(o.x-q.x,o.y-q.y)<44);q.rev=near?q.rev+dt:Math.max(0,q.rev-dt);
      if(q.rev>=2.5){q.down=false;q.hp=q.maxHp*.5;q.invul=2;toast('P'+q.n+' revived');ring(q.x,q.y,60,'#8fe07a')}continue}
    const {mx,my,dash}=allyInput(q);
    if(dash&&q.dashCd<=0&&(mx||my)){q.dashT=.17;q.dashCd=2;q.dx=mx;q.dy=my;sfx('dash')}
    let vx=mx,vy=my,sp=q.speed;if(q.dashT>0){q.dashT-=dt;vx=q.dx;vy=q.dy;sp*=4;q.invul=Math.max(q.invul,.05)}
    q.x+=vx*sp*dt;q.y+=vy*sp*dt;if(mx||my){q.face=Math.atan2(my,mx);q.moving=true}else q.moving=false;
    // shared camera leash: keep everyone on screen
    q.x=Math.max(c.x-hw,Math.min(c.x+hw,q.x));q.y=Math.max(c.y-hh,Math.min(c.y+hh,q.y));
    // auto-cast sketch bolt at the nearest enemy
    q.atkT-=dt;if(q.atkT<=0){let best=null,bd=280*280;for(const e of G.enemies){const d2=(e.x-q.x)**2+(e.y-q.y)**2;if(d2<bd){bd=d2;best=e}}
      if(best){q.atkT=.55;const a=Math.atan2(best.y-q.y,best.x-q.x);q.shots.push({x:q.x,y:q.y-12,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:.8,hit:new Set()})}else q.atkT=.2}
    const dmg=9*(1+G.level*.06)*(G.era.durability||1);
    for(let i=q.shots.length-1;i>=0;i--){const s=q.shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
      for(const e of queryGrid(s.x,s.y,24))if(!s.hit.has(e)&&Math.hypot(e.x-s.x,e.y-s.y)<e.r+6){s.hit.add(e);hurtEnemy(e,dmg,'ranged',null);if(s.hit.size>=2)s.life=0;break}
      if(s.life<=0)q.shots.splice(i,1)}}
  // P1 is leashed too
  P.x=Math.max(c.x-hw,Math.min(c.x+hw,P.x));P.y=Math.max(c.y-hh,Math.min(c.y+hh,P.y));
  partyHud()});
const _coRP=renderPickups;renderPickups=function(){_coRP();if(!G.allies)return;for(const q of G.allies){const fr=ALLY_SPR[(q.n-2)%3][q.moving?Math.floor(G.t*8)%4:0];const left=Math.cos(q.face)<0;
    const im=q.down?fr.wr:(q.invul>0&&Math.floor(G.t*20)&1?fr.wr:(left?fr.l:fr.r));shadow(q.x,q.y,6);bx.globalAlpha=q.down?.45:1;bx.drawImage(im,X(q.x)-(im.width>>1),Y(q.y)-im.height);bx.globalAlpha=1;
    bx.fillStyle='#1a0f0e';bx.fillRect(X(q.x)-7,Y(q.y)+2,14,2);bx.fillStyle=q.down?'#8fe07a':ALLY_COLS[(q.n-2)%3];bx.fillRect(X(q.x)-7,Y(q.y)+2,Math.round(14*(q.down?q.rev/2.5:q.hp/q.maxHp)),2);
    for(const s of q.shots){bx.fillStyle=ALLY_COLS[(q.n-2)%3];bx.fillRect(X(s.x)-1,Y(s.y)-1,3,3)}}};
function partyHud(){let el=$('party');if(!G||!G.allies||!G.allies.length||mode!=='run'){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='party';$('hud').appendChild(el)}
  const h=G.allies.map(q=>`<span style="color:${ALLY_COLS[(q.n-2)%3]}">P${q.n} ${q.down?'DOWN':Math.ceil(q.hp)}</span>`).join('');if(el.innerHTML!==h)el.innerHTML=h}
// ---- lobby: #/coop ----
let lobbyTimer=0;
function coop(){
  leaveRun();setRoute('coop');clearInterval(lobbyTimer);
  const draw=()=>{const slots=[0,1,2].map(i=>{const c=PARTY[i];return `<div class="cell ${c?'on':''}"><span class="cell-h"><b>P${i+2}</b><i>${c?(c==='kb2'?'Keyboard':'Gamepad '+(+c.slice(3)+1)):'empty'}</i></span><img class="mimg" src="${iconURL(ALLY_SPR[i][0].r,4)}" alt=""><span class="nm">${c?'Ready':'Press to join'}</span><span class="sh">${c?'IJKL / stick: move &middot; O / A: dash':'Keyboard: press O &middot; Gamepad: press A'}</span></div>`}).join('');
    show(sheet('Local Co-op','16 &mdash; Up to 4 mages on one screen',`<div class="tbl">${`<div class="cell on"><span class="cell-h"><b>P1</b><i>you</i></span><img class="mimg" src="${iconURL(SPR.mage[0].r,4)}" alt=""><span class="nm">Draws weapons</span><span class="sh">Mouse / touch to draw, WASD or stick to move</span></div>`+slots}</div>
      <p class="note">Companions auto-cast and can be revived. Enemies get ${PARTY.length?Math.round(60*PARTY.length)+'% more HP and '+Math.round(45*PARTY.length)+'% more spawns':'tougher for each extra mage'}. Touch-only 2P is not supported yet (one phone screen is too small to split).</p>
      <nav class="menu"><button id="cstart"><b>01</b>Start co-op run (${1+PARTY.length} players)<i>&rarr;</i></button><button id="cclear"><b>02</b>Clear party<i>&rarr;</i></button></nav>`));
    $('cstart').onclick=()=>{clearInterval(lobbyTimer);startRun()};$('cclear').onclick=()=>{PARTY=[];draw()};$('back').onclick=()=>{clearInterval(lobbyTimer);home()}};
  draw();let prev='';
  lobbyTimer=setInterval(()=>{if(location.hash!=='#/coop'){clearInterval(lobbyTimer);return}
    for(const g of pads()){const id='pad'+g.index;if(g.buttons[0]&&g.buttons[0].pressed&&!PARTY.includes(id)&&PARTY.length<3&&!(window.P1_PAD===g.index)){PARTY.push(id);sfx('pick')}}
    const s=PARTY.join();if(s!==prev){prev=s;draw()}},120);
}
addEventListener('keydown',e=>{if(location.hash==='#/coop'&&(e.key==='o'||e.key==='O')&&!PARTY.includes('kb2')&&PARTY.length<3){PARTY.push('kb2');sfx('pick');coop()}});
hub('coop','Co-op',coop);
