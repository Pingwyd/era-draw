// ===== Spawn director (VS / Brotato / Halls-style) + enemy affixes =====
// Each era spawn entry ramps in over 30s after `from`, peaks ~4 min, then fades to a floor so the
// roster rotates. Spawns spend a budget (heavy types cost more). Timed events rotate: swarm ring,
// stampede, elite pack, affix squad. While a boss is up, regular spawning is cut hard.
function poolW(s,t,first){const age=t-s.from;if(age<0)return 0;const ramp=Math.min(1,.25+age/40);
  const fade=age<240?1:Math.max(first?.35:.18,1-(age-240)/320);return s.w*ramp*fade}
function spawnCost(type){const sw=ENEMY_TYPES[G.era.swarm]||{hp:8},T=ENEMY_TYPES[type];return Math.max(1,Math.min(3.2,Math.sqrt((T.hp||8)/Math.max(4,sw.hp||8))*.8))}
function pickSpawn(){const sp=G.era.spawns;let tot=0;const w=sp.map((s,i)=>{const v=poolW(s,G.t,i===0);tot+=v;return v});
  if(tot<=0)return sp[0].type;let r=Math.random()*tot;for(let i=0;i<sp.length;i++){r-=w[i];if(r<=0)return sp[i].type}return sp[0].type}
const AFFIX={spit:'Spitter',burrow:'Burrower',boom:'Exploder',leap:'Leaper',shield:'Shielded',dash:'Charger'};
const AFF_COL={spit:'#9fe07a',burrow:'#b08a5a',boom:'#ff7a3a',leap:'#7fd8ff',shield:'#d9dde6',dash:'#ff5a4e'};
function rollAffix(e,force){if(!e||e.T.boss||e.prop)return;const swarm=e.type===G.era.swarm;
  const ch=force?1:G.t<60?0:Math.min(.3,(G.t-60)/1400);if(Math.random()>=ch)return;
  const ks=swarm?['boom','boom','leap']:Object.keys(AFFIX);const a=force&&typeof force==='string'?force:ks[Math.floor(Math.random()*ks.length)];
  e.af=a;e.afT=rnd(1.5,3);if(a==='shield')e.shHp=e.maxHp*.7;if(a==='boom'){e.hp*=.8;e.maxHp*=.8}}
updateSpawns=function(dt){
  G.wave=1+Math.floor(G.t/30);const scale=1+G.t/300;
  const bossUp=G.enemies.some(e=>e.T.boss);G.bossUp=bossUp;
  G.spawnT+=dt*1.35*(1.05+G.t/65)*(bossUp?.3:1);
  const cap=Math.round(Math.min((typeof save!=='undefined'&&save.perf)?140:ENEMY_CAP,40+G.wave*7)*(bossUp?.45:1));const capB=bossUp?Math.min(cap,BOSS_ADD_CAP+G.enemies.filter(e=>e.T.boss).length):cap;
  let guard=0;while(G.spawnT>=1&&guard++<40){if(G.enemies.length>=capB){G.spawnT=Math.min(G.spawnT,2);break}
    const type=G.spNext||pickSpawn(),c=spawnCost(type);if(G.spawnT<c){G.spNext=type;break}G.spNext=null;G.spawnT-=c;rollAffix(spawnEnemy(type,scale))}
  // events
  if(G.evNext==null){G.evNext=50;G.evI=0}
  if(G.t>=G.evNext){if(bossUp)G.evNext=G.t+15;else{G.evNext=G.t+rnd(42,58);runEvent(G.evI++%4,scale)}}
  const BS=G.era.bosses;if(!G.bossNext)G.bossNext=BS.map(b=>b.t);
  BS.forEach((b,i)=>{if(G.t>=G.bossNext[i]){G.bossNext[i]+=b.every;const be=spawnEnemy(b.type,scale);be.bossKey=b.type+'@'+b.t;toast(ENEMY_TYPES[b.type].name+', '+ENEMY_TYPES[b.type].title+'!');G.shake=10;sfx('boss')}});
};
function ringPos(){const p=G.player,R=Math.hypot(viewW(),viewH())/2+30,a=Math.random()*6.283;return {p,R,a}}
function runEvent(k,scale){const {p,R,a}=ringPos();const n=Math.min(32,12+G.wave*2);
  if(k===0){for(let i=0;i<n;i++){const b=i/n*6.283;spawnEnemy(G.era.swarm,scale,{x:p.x+Math.cos(b)*R,y:p.y+Math.sin(b)*R})}toast('A swarm closes in!')}
  else if(k===1){const cx=p.x+Math.cos(a)*R,cy=p.y+Math.sin(a)*R;for(let i=0;i<n*.6;i++)spawnEnemy(G.t>30?G.era.flock:G.era.swarm,scale,{x:cx+rnd(-50,50),y:cy+rnd(-50,50)});toast('A flock stampedes!')}
  else if(k===2){// elite pack: the strongest unlocked regular type, beefed up, one may carry a chest
    const sp=G.era.spawns.filter(s=>s.from<=G.t);let best=sp[0].type;for(const s of sp)if(!ENEMY_TYPES[s.type].boss&&ENEMY_TYPES[s.type].hp>ENEMY_TYPES[best].hp)best=s.type;
    const m=G.t<240?2:3;for(let i=0;i<m;i++){const e=spawnEnemy(best,scale,{x:p.x+Math.cos(a+i*.25)*R,y:p.y+Math.sin(a+i*.25)*R});e.vet=true;e.hp*=3.5;e.maxHp*=3.5;e.r*=1.2;e.dmg*=1.3;if(i===0)e.vetChest=true;rollAffix(e,true)}
    toast('Elite pack!')}
  else{const sp=G.era.spawns.filter(s=>s.from<=G.t&&s.type!==G.era.swarm);const ks=Object.keys(AFFIX),af=ks[Math.floor(Math.random()*ks.length)];
    const ty=(sp.length?sp[Math.floor(Math.random()*sp.length)]:G.era.spawns[0]).type;for(let i=0;i<8;i++){const b=a+(i-4)*.14;rollAffix(spawnEnemy(ty,scale,{x:p.x+Math.cos(b)*R,y:p.y+Math.sin(b)*R}),af)}
    toast(AFFIX[af]+' squad!')}}
killHooks.push(e=>{if(e.vetChest&&Math.random()<.4&&window.chestOk&&chestOk())G.chests.push({x:e.x,y:e.y,boss:false})});
// ---- affix behaviours ----
CAVE_TICK.push(dt=>{if(G.netClient)return;const p=G.player;
  for(const e of G.enemies){if(!e.af||e.hp<=0)continue;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;e.afT-=dt;
    switch(e.af){
    case 'spit':if(e.afT<=0&&d<380){e.afT=rnd(2.8,3.8);G.eshots.push({x:e.x,y:e.y-8,vx:ux*150,vy:uy*150,dmg:e.dmg*.7,life:3,kind:'orb'})}break;
    case 'dash':if(!e.dst&&e.afT<=0&&d<240){e.dst=.55;e.frozen=Math.max(e.frozen||0,.55);e.dvx=ux;e.dvy=uy}
      else if(e.dst>0){e.dst-=dt;if(e.dst<=0){e.dgo=.4}}
      if(e.dgo>0){e.dgo-=dt;e.x+=e.dvx*e.speed*3.6*dt;e.y+=e.dvy*e.speed*3.6*dt;if(e.dgo<=0){e.dst=0;e.afT=rnd(2.5,3.5)}}break;
    case 'leap':if(!e.lst&&e.afT<=0&&d<300&&d>60){e.lst=.6;e.frozen=Math.max(e.frozen||0,.6);e.lx=p.x;e.ly=p.y}
      else if(e.lst>0){e.lst-=dt;if(e.lst<=0){e.lgo=.45;e.l0x=e.x;e.l0y=e.y}}
      if(e.lgo>0){e.lgo-=dt;const k=1-Math.max(0,e.lgo)/.45;e.x=e.l0x+(e.lx-e.l0x)*k;e.y=e.l0y+(e.ly-e.l0y)*k;e.hop=Math.sin(k*Math.PI)*18;e.frozen=Math.max(e.frozen||0,.02);
        if(e.lgo<=0){e.hop=0;e.afT=rnd(2.5,3.5);ring(e.x,e.y,28,'#7fd8ff');if(Math.hypot(p.x-e.x,p.y-e.y)<30+p.r&&p.invul<=0)damagePlayer(e.dmg)}}break;
    case 'boom':if(e.fuse==null&&d<64)e.fuse=.9;if(e.fuse!=null){e.fuse-=dt;e.frozen=Math.max(e.frozen||0,.05);e.flash=Math.max(e.flash,(Math.floor(G.t*16)%2)?.03:0);
        if(e.fuse<=0){ring(e.x,e.y,70,'#ff7a3a');burst(e.x,e.y,'#ff7a3a',14);G.shake=Math.max(G.shake,4);if(Math.hypot(p.x-e.x,p.y-e.y)<70&&p.invul<=0)damagePlayer(e.dmg*1.6);e.hp=0;e.gone=true}}break;
    case 'burrow':if(!e.bur&&e.afT<=0&&d>110&&d<420){e.bur=1.1;burst(e.x,e.y,'#5a4030',6)}
      if(e.bur>0){e.bur-=dt;e.x+=ux*Math.min(d-40,e.speed*2.4)*dt;e.y+=uy*Math.min(d-40,e.speed*2.4)*dt;
        if(e.bur<=0){e.bur=0;e.afT=rnd(3,4.5);burst(e.x,e.y,'#5a4030',10);ring(e.x,e.y,34,'#b08a5a');if(Math.hypot(p.x-e.x,p.y-e.y)<34+p.r&&p.invul<=0)damagePlayer(e.dmg*.8)}}break;
    }}});
DMG_MODS.push((e,d,src,from)=>{if(!e.af)return d;if(e.af==='burrow'&&e.bur>0)return 0;
  if(e.af==='shield'&&e.shHp>0){const p=G.player,sx=(from&&from.x!=null?from.x:p.x),sy=(from&&from.y!=null?from.y:p.y);
    const fx=p.x-e.x,fy=p.y-e.y,hx=sx-e.x,hy=sy-e.y,c=(fx*hx+fy*hy)/((Math.hypot(fx,fy)*Math.hypot(hx,hy))||1);
    if(c>.3){const ab=d*.6;e.shHp-=ab;if(e.shHp<=0){floatText(e.x,e.y-24,'SHIELD BREAK','#d9dde6',.8,10);ring(e.x,e.y,22,'#d9dde6')}return d-ab}}return d});
// burrowed enemies are untargetable
const _wvNear=nearestEnemy;nearestEnemy=function(x,y,maxD,skip){const s=skip||new Set();for(const e of G.enemies)if(e.bur>0)s.add(e);return _wvNear(x,y,maxD,s.size?s:skip)};
const _wvDraw=drawEnemy;drawEnemy=function(e){
  if(e.bur>0){bx.fillStyle='#3a2a20';const sx=X(e.x),sy=Y(e.y);bx.fillRect(sx-5,sy-1,10,3);bx.fillStyle='#5a4030';bx.fillRect(sx-3,sy-2,6,1);return}
  if(e.hop){const y=e.y;e.y-=e.hop;_wvDraw(e);e.y=y}else _wvDraw(e);
  if(!e.af&&!e.vet)return;const sx=X(e.x),sy=Y(e.y);
  if(e.vet){bx.globalAlpha=.55;bx.strokeStyle='#ffd34a';bx.beginPath();bx.arc(sx,sy-6,e.r*.9+3,0,6.283);bx.stroke();bx.globalAlpha=1}
  if(e.af){bx.fillStyle=AFF_COL[e.af];bx.fillRect(sx-1,sy+3,3,2);
    if(e.af==='shield'&&e.shHp>0){const p=G.player,a=Math.atan2(p.y-e.y,p.x-e.x);bx.strokeStyle='#d9dde6';bx.lineWidth=1;bx.beginPath();bx.arc(sx,sy-6,e.r*.7+3,a-.8,a+.8);bx.stroke()}
    if(e.af==='boom'&&e.fuse!=null){bx.globalAlpha=.25+.25*Math.sin(G.t*30);bx.fillStyle='#ff7a3a';bx.beginPath();bx.arc(sx,sy,70*S0(),0,6.283);bx.fill();bx.globalAlpha=1}
    if(e.af==='leap'&&e.lst>0){bx.strokeStyle='#7fd8ff';bx.globalAlpha=.7;bx.beginPath();bx.arc(X(e.lx),Y(e.ly),30*S0(),0,6.283);bx.stroke();bx.globalAlpha=1}
    if(e.af==='dash'&&e.dst>0){bx.strokeStyle='#ff5a4e';bx.globalAlpha=.6;bx.beginPath();bx.moveTo(sx,sy);bx.lineTo(sx+e.dvx*70*S0(),sy+e.dvy*70*S0());bx.stroke();bx.globalAlpha=1}}};
function S0(){return (X(100)-X(0))/100}
