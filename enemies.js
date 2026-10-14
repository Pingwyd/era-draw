'use strict';
// ================= STONE AGE BESTIARY =================
// Sprites face right; outline() adds the ink border. Two frames = legs swap.
SPR.en={};
function enSet(frames){const fs=frames.map(f=>set(outline(grid(f))));const s=fs[0];return {...s,frames:fs}}
const LEG=(rows,a,b)=>[[...rows,...a],[...rows,...b]];
SPR.en.insect=enSet([
['WW.WW.','.GGGGi','GGGGG.','.G.G..'],
['......','WGGGGi','GGGGG.','G...G.']].map(f=>f.map(r=>r.replace(/W/g,'w'))));
SPR.en.bird=enSet(LEG([
'......mm..','.....fffaa','.....fifaaa','.....fff..','....ff....','.fffffff..','ffFfffff..','.FFFffF...'],
['...a..a...','...a..a...','..aa.aa...'],['....aa....','...a..a...','..aa..aa..']));
SPR.en.saber=enSet(LEG([
'............ff..','...........fffi.','FF.ffffffffffffff','.FfffFfffFfffffw.','..fffffffffffff..','..FfFFFFFFFFfF...'],
['..F.f......F.f...','..F.f......F.f...'],['...fF.....fF.....','...fF.....fF.....']));
SPR.en.caveman=enSet(LEG([
'...cccc...','..cssssc..','..csisic..','..cssss...','...ss..tt.','.FFFFFFstt','sFFFFFF...','s.FFFF....','..FFFF....'],
['..s..s....','..s..s....','.ss..ss...'],['...ss.....','..s..s....','.ss...ss..']));
SPR.en.bear=enSet(LEG([
'..........cc.c..','.........ccccc..','..cccccccccicc..','.ccccccccccccCi.','cccccccccccccC..','cccccccccccccc..','cCcccccccccccC..','.CCcCCCCCcCCC...'],
['.CC.CC...CC.CC..','.CC.CC...CC.CC..'],['..CCCC....CCCC..','..CC.CC..CC.CC..']));
SPR.en.rhino=enSet(LEG([
'...............w..','..qqqqqqqqqq..ww..','.qqqqqqqqqqqqqqqw.','qqqqqqqqqqqqqqiqq.','qqqqqqqqqqqqqqqqq.','QqqqqqqqqqqqqqqQ..','.QQQQQQQQQQQQQQ...'],
['.QQ.QQ....QQ.QQ...','.QQ.QQ....QQ.QQ...'],['..QQQQ.....QQQQ...','..QQ.QQ...QQ.QQ...']));
SPR.en.mammoth=enSet(LEG([
'.......cccccccccc.........','.....cccccccccccccc.......','....cccccccccccccccccc....','...cccccccccccccccccccc...',
'..cccccccccccccccccccccc..','..ccccccccccccccccciccccc.','.ccccccccccccccccccccccccc','.cccccccccccccccccccccCcc.',
'.CccccccccccccccccccccwCc.','.CCccccccccccccccccccw.Cc.','.CCCccccccccccccccccw..Cc.','..CCCCCCCCCCCCCCCCCw...Cc.'],
['..CCC.CCC....CCC.CCC...Cc.','..CCC.CCC....CCC.CCC..CC..','..CCC.CCC....CCC.CCC......','.CCCC.CCCC..CCCC.CCCC.....'],
['...CCCCCC.....CCCCCC..Cc..','...CCC.CCC...CCC.CCC.CC...','..CCC..CCC..CCC..CCC......','.CCCC..CCCCCCCC..CCCC.....']));
SPR.en.shaman=enSet(LEG([
'..w.ww.w...o.','...wwwww..oyo','..wiwwiw...b.','..wwuuww...b.','...wwww....b.','..FFFFFF..sb.','.FFuFFuFFssb.','sFFFFFFFF..b.','s.FFFFFF...b.','..FFFFFF...b.','..F.FF.F...b.'],
['..s....s...b.','.ss....ss..b.'],['...s..s....b.','..ss..ss...b.']));

// behavior: chase | swarm | lunge | thrower | charge | shaman
const ENEMY_TYPES={
  insect: {name:'Giant Gnat',  spr:'insect', r:7, hp:6,  speed:92, dmg:4, xp:1,col:'#3f5a28',beh:'swarm'},
  bird:   {name:'Terror Bird', spr:'bird',   r:10,hp:12, speed:122,dmg:6, xp:1,col:'#c98a45',beh:'chase',min:30},
  saber:  {name:'Sabertooth',  spr:'saber',  r:13,hp:32, speed:68, dmg:12,xp:2,col:'#c98a45',beh:'lunge',min:70},
  caveman:{name:'Rival Caveman',spr:'caveman',r:11,hp:24,speed:62, dmg:8, xp:2,col:'#7b5a44',beh:'thrower',min:90},
  bear:   {name:'Cave Bear',   spr:'bear',   r:17,hp:120,speed:36, dmg:18,xp:5,col:'#7b5a44',beh:'chase',min:120},
  rhino:  {name:'Woolly Rhino',spr:'rhino',  r:16,hp:75, speed:48, dmg:16,xp:4,col:'#9a8e84',beh:'charge',min:150,elite:true},
  mammoth:{name:'Grael',title:'The Woolly Elder',spr:'mammoth',r:30,hp:1100,speed:34,dmg:28,xp:30,col:'#7b5a44',beh:'charge',boss:true},
  shaman: {name:'Ur-Kesh',title:'Bone Shaman of the Tar Pits',spr:'shaman',r:14,hp:1600,speed:44,dmg:20,xp:50,col:'#a14d9c',beh:'shaman',boss:true},
};
const ENEMY_CAP=320;
const BOSS_SCHEDULE=[{t:180,type:'mammoth',every:240},{t:300,type:'shaman',every:300}];

// ---- spatial hash ----
const GRID_CELL=48;let egrid=new Map();
function buildGrid(){egrid=new Map();for(const e of G.enemies){const k=((e.x/GRID_CELL)|0)*73856093^((e.y/GRID_CELL)|0)*19349663;let a=egrid.get(k);if(!a)egrid.set(k,a=[]);a.push(e)}}
function queryGrid(x,y,r,out=[]){const x0=Math.floor((x-r)/GRID_CELL),x1=Math.floor((x+r)/GRID_CELL),y0=Math.floor((y-r)/GRID_CELL),y1=Math.floor((y+r)/GRID_CELL);
  for(let i=x0;i<=x1;i++)for(let j=y0;j<=y1;j++){const a=egrid.get((i|0)*73856093^(j|0)*19349663);if(a)for(const e of a)out.push(e)}return out}

function spawnEnemy(type,scale,at){
  const T=ENEMY_TYPES[type],p=G.player,a=Math.random()*6.283,R=Math.hypot(viewW(),viewH())/2+40;
  const hpMul=T.boss?(1+G.t/400):scale;
  const e={type,T,x:at?at.x:p.x+Math.cos(a)*R,y:at?at.y:p.y+Math.sin(a)*R,r:T.r,hp:T.hp*hpMul*G.era.enemyHp,maxHp:T.hp*hpMul*G.era.enemyHp,
    speed:T.speed*(1+Math.min(.45,G.t/700)),dmg:T.dmg*G.era.enemyDmg*(1+G.t/360),kx:0,ky:0,flash:0,wob:Math.random()*6,st:'move',timer:rnd(1,3),vx:0,vy:0,sw:Math.random()*6};
  G.enemies.push(e);return e;
}
function updateSpawns(dt){
  G.wave=1+Math.floor(G.t/30);
  const scale=1+G.t/100;
  G.spawnT+=dt*(1.2+G.t/9);
  const cap=Math.min(ENEMY_CAP,50+G.wave*22);
  while(G.spawnT>=1){G.spawnT-=1;if(G.enemies.length>=cap)break;
    const r=Math.random(),t=G.t;let type='insect';
    if(t>150&&r<.05)type='rhino';else if(t>120&&r<.12)type='bear';else if(t>90&&r<.2)type='caveman';else if(t>70&&r<.32)type='saber';else if(t>30&&r<.55)type='bird';
    spawnEnemy(type,scale);}
  // horde events
  G.evT=(G.evT||0)+dt;
  if(G.evT>40){G.evT=0;const ring=Math.random()<.5;const n=Math.min(40,16+G.wave*3),p=G.player,R=Math.hypot(viewW(),viewH())/2+30;
    if(ring){for(let i=0;i<n;i++){const a=i/n*6.283;spawnEnemy('insect',scale,{x:p.x+Math.cos(a)*R,y:p.y+Math.sin(a)*R})}toast('A swarm closes in!')}
    else{const a=Math.random()*6.283,cx=p.x+Math.cos(a)*R,cy=p.y+Math.sin(a)*R;for(let i=0;i<n*.6;i++)spawnEnemy(G.t>30?'bird':'insect',scale,{x:cx+rnd(-50,50),y:cy+rnd(-50,50)});toast('A flock stampedes!')}}
  for(const b of BOSS_SCHEDULE){if(b.next===undefined)b.next=b.t;}
  if(!G.bossNext)G.bossNext=BOSS_SCHEDULE.map(b=>b.t);
  BOSS_SCHEDULE.forEach((b,i)=>{if(G.t>=G.bossNext[i]){G.bossNext[i]+=b.every;spawnEnemy(b.type,scale);toast(ENEMY_TYPES[b.type].name+', '+ENEMY_TYPES[b.type].title+'!');G.shake=10}});
}
function updateEnemies(dt){
  const p=G.player;buildGrid();
  for(const e of G.enemies){
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
    let mx=ux,my=uy,sp=e.speed;e.timer-=dt;
    switch(e.T.beh){
      case 'swarm':e.sw+=dt*6;mx=ux+Math.cos(e.sw)*.7*-uy;my=uy+Math.cos(e.sw)*.7*ux;break;
      case 'lunge':
        if(e.st==='move'&&d<130&&e.timer<=0){e.st='wind';e.timer=.45;e.vx=ux;e.vy=uy}
        else if(e.st==='wind'){sp=0;e.flash=Math.max(e.flash,(Math.floor(G.t*20)%2)?.02:0);if(e.timer<=0){e.st='go';e.timer=.45}}
        else if(e.st==='go'){mx=e.vx;my=e.vy;sp=e.speed*4.2;if(e.timer<=0){e.st='move';e.timer=rnd(1.5,2.5)}}
        break;
      case 'thrower':
        if(d<150){mx=-ux;my=-uy}else if(d<210){mx=-uy*.6;my=ux*.6}
        if(e.timer<=0&&d<320){e.timer=rnd(2,2.8);const sp2=210;G.eshots.push({x:e.x,y:e.y-10,vx:ux*sp2,vy:uy*sp2,dmg:e.dmg,life:2.2,kind:'rock'})}
        break;
      case 'charge':
        if(e.st==='move'&&d<(e.T.boss?320:230)&&e.timer<=0){e.st='wind';e.timer=e.T.boss?.8:.6;e.vx=ux;e.vy=uy}
        else if(e.st==='wind'){sp=0;if(e.timer<=0){e.st='go';e.timer=e.T.boss?1.1:.8;if(e.T.boss)G.shake=Math.max(G.shake,5)}}
        else if(e.st==='go'){mx=e.vx;my=e.vy;sp=e.speed*(e.T.boss?5:4.5);if(e.timer<=0){e.st='move';e.timer=rnd(2,3.5)}}
        break;
      case 'shaman':
        if(d<200){mx=-ux*.8;my=-uy*.8}else if(d<260){mx=-uy;my=ux}
        if(e.timer<=0){e.timer=3.6;const n=12,off=Math.random();for(let i=0;i<n;i++){const a=(i+off)/n*6.283;G.eshots.push({x:e.x,y:e.y-12,vx:Math.cos(a)*120,vy:Math.sin(a)*120,dmg:e.dmg*.6,life:3.5,kind:'orb'})}
          for(let i=0;i<5;i++)spawnEnemy('insect',1+G.t/100,{x:e.x+rnd(-30,30),y:e.y+rnd(-30,30)})}
        break;
    }
    const mm=Math.hypot(mx,my)||1;
    e.x+=(mx/mm*sp+e.kx)*dt;e.y+=(my/mm*sp+e.ky)*dt;
    const kd=Math.pow(e.T.boss?.001:.02,dt);e.kx*=kd;e.ky*=kd;e.flash-=dt;e.wob+=dt*(e.st==='go'?3:1);
    if(d<p.r+e.r*.8&&p.invul<=0)damagePlayer(e.dmg);
    if(d>Math.hypot(viewW(),viewH())*1.2&&!e.T.boss){const R=Math.hypot(viewW(),viewH())/2+40,b=Math.random()*6.283;e.x=p.x+Math.cos(b)*R;e.y=p.y+Math.sin(b)*R}
  }
  // separation via grid
  const near=[];
  for(const A of G.enemies){near.length=0;queryGrid(A.x,A.y,A.r+20,near);let n=0;
    for(const B of near){if(B===A||n>8)continue;const dx=B.x-A.x,dy=B.y-A.y,m=(A.r+B.r)*.85,d2=dx*dx+dy*dy;if(d2<m*m&&d2>0){const d=Math.sqrt(d2),push=(m-d)/d*.25;const wa=A.T.boss?0:1;A.x-=dx*push*wa;A.y-=dy*push*wa;n++}}}
  // enemy projectiles
  for(let i=G.eshots.length-1;i>=0;i--){const s=G.eshots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(Math.hypot(s.x-p.x,s.y-(p.y-10))<p.r&&p.invul<=0){damagePlayer(s.dmg);s.life=0}
    if(s.life<=0)G.eshots.splice(i,1)}
}
