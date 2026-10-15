// ===== Boss fights v2: tougher bosses, devour on arrival, small add cap, telegraphed move sets, enrage phases =====
const BOSS_SETS={
  mammoth:{reg:['charge','slam'],sp:['summon','hazard']},     shaman:{reg:['ring','fan'],sp:['summon','spiral']},
  ursa:{reg:['slam','leap'],sp:['summon','charge']},           titan:{reg:['slam','ring'],sp:['hazard','summon']},
  minotaur:{reg:['charge','fan'],sp:['slam','leap']},          colossus:{reg:['fan','slam'],sp:['spiral','hazard']},
  raider:{reg:['charge','fan'],sp:['summon','ring']},          sphinx:{reg:['ring','fan'],sp:['spiral','hazard']},
  warlord:{reg:['charge','slam'],sp:['summon','fan']},         ram:{reg:['charge','slam'],sp:['leap','hazard']},
  prince:{reg:['leap','fan'],sp:['charge','spiral']},          headsman:{reg:['slam','charge'],sp:['leap','hazard']},
  cyclops:{reg:['fan','slam'],sp:['hazard','ring']},           hydraking:{reg:['fan','ring'],sp:['spiral','summon']},
  gorgon:{reg:['fan','ring'],sp:['hazard','spiral']},          aeon:{reg:['ring','fan','slam'],sp:['spiral','hazard','summon','leap']},
};
const MOVE_ALL=['slam','ring','fan','charge','leap'],SPEC_ALL=['spiral','summon','hazard','charge','leap'];
function bossSet(e){if(BOSS_SETS[e.type])return BOSS_SETS[e.type];let h=0;for(const c of e.type)h=(h*31+c.charCodeAt(0))>>>0;return {reg:[MOVE_ALL[h%5],MOVE_ALL[(h>>3)%5]],sp:[SPEC_ALL[(h>>5)%5],SPEC_ALL[(h>>7)%5]]}}
const BOSS_HP_MUL=2.2,ERA_BOSS={stone:1,bronze:1.15,iron:1.3,mythic:1.45},BOSS_ADD_CAP=25;
const _bfSpawn=spawnEnemy;spawnEnemy=function(type,scale,at){const e=_bfSpawn.apply(this,arguments);
  if(e&&e.T&&e.T.boss&&!G.netClient&&!e.bf){const party=G.party||1,m=BOSS_HP_MUL*(ERA_BOSS[CURRENT_ERA]||1)*(1+.6*(party-1));e.hp*=m;e.maxHp*=m;e.baseHp=e.maxHp;e.baseDmg=e.dmg;
    e.bf={reg:2.5,sp:6,busy:0,ph:0,eat:0,set:bossSet(e)};G.bfSpfx=G.bfSpfx||[];bossIntro(e);setTimeout(()=>{if(G&&e.hp>0)devour(e)},700)}return e};
DMG_MODS.push((e,d)=>e.bf?d*.8:d); // boss defense
function bossIntro(e){const el=document.createElement('div');el.id='bossIntro';el.innerHTML=`<span class="lab">Boss</span><b>${e.T.name}</b><i>${e.T.title||''}</i>`;
  const o=$('bossIntro');if(o)o.remove();document.body.appendChild(el);setTimeout(()=>el.classList.add('out'),2000);setTimeout(()=>el.remove(),2600);sfx('boss');setTimeout(()=>sfx('boss'),350);haptic([40,60,40])}
function devour(b){const R=Math.hypot(viewW(),viewH())/2,p=G.player;const near=G.enemies.filter(e=>!e.T.boss&&!e.eat&&Math.hypot(e.x-p.x,e.y-p.y)<R);
  for(let i=near.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[near[i],near[j]]=[near[j],near[i]]}
  const n=Math.round(near.length*.8);for(let i=0;i<n;i++){const e=near[i];e.eat={b,t:0,d:.5+Math.random()*.5,x0:e.x,y0:e.y}}
  if(n)toast(b.T.name+' devours the horde!')}
const bfFx=()=>G.bfSpfx||(G.bfSpfx=[]);
function bossShot(b,a,sp,k){G.eshots.push({x:b.x,y:b.y-10,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dmg:b.dmg*(k||.5),life:4,kind:'orb'})}
const MOVES={
  slam(b){bfFx().push({k:'tele',x:b.x,y:b.y,r:115,t:.9,m:.9,col:'#ff5a4e',fire:()=>{bfFx().push({k:'wave',x:b.x,y:b.y,r:0,R:150,t:.45,m:.45});G.shake=Math.max(G.shake,8);
    const p=G.player;if(Math.hypot(p.x-b.x,p.y-b.y)<115+p.r&&p.invul<=0)damagePlayer(b.dmg*.9)},hold:b})},
  ring(b){bfFx().push({k:'glow',b,t:.55,m:.55,fire:()=>{const n=b.bf.ph>=2?20:16,o=Math.random();for(let i=0;i<n;i++)bossShot(b,(i+o)/n*6.283,125)}})},
  fan(b){const p=G.player,a=Math.atan2(p.y-b.y,p.x-b.x);bfFx().push({k:'line',x:b.x,y:b.y,a,L:220,t:.5,m:.5,fire:()=>{for(let i=-2;i<=2;i++)bossShot(b,a+i*.16,210,.45)}})},
  spiral(b){let n=0;const a0=Math.random()*6.283;bfFx().push({k:'glow',b,t:.5,m:.5,fire:()=>{const iv=setInterval(()=>{if(!G||G.paused||b.hp<=0||n++>18){clearInterval(iv);return}for(let k=0;k<3;k++)bossShot(b,a0+n*.35+k*2.094,140,.35)},110)}})},
  charge(b){const p=G.player,a=Math.atan2(p.y-b.y,p.x-b.x);bfFx().push({k:'line',x:b.x,y:b.y,a,L:300,t:.85,m:.85,w:b.r,hold:b,fire:()=>{b.chg={a,t:.55}}})},
  leap(b){const p=G.player,tx=p.x,ty=p.y;bfFx().push({k:'tele',x:tx,y:ty,r:80,t:1,m:1,col:'#ffb13a',hold:b,fire:()=>{b.x=tx;b.y=ty;bfFx().push({k:'wave',x:tx,y:ty,r:0,R:110,t:.4,m:.4});G.shake=Math.max(G.shake,7);
    const q=G.player;if(Math.hypot(q.x-tx,q.y-ty)<80+q.r&&q.invul<=0)damagePlayer(b.dmg)}})},
  summon(b){const have=G.enemies.filter(e=>e.minion).length;const n=Math.min(4,6-have);if(n<=0)return MOVES.ring(b);
    for(let i=0;i<n;i++){const a=i/n*6.283;const m=spawnEnemy(G.era.swarm,1+G.t/300,{x:b.x+Math.cos(a)*50,y:b.y+Math.sin(a)*50});m.minion=true;ring(m.x,m.y,16,'#a14d9c')}},
  hazard(b){const p=G.player;for(let i=0;i<3;i++){const x=p.x+(i?rnd(-110,110):0),y=p.y+(i?rnd(-80,80):0);bfFx().push({k:'tele',x,y,r:58,t:1.1,m:1.1,col:'#ff8a3a',fire:()=>bfFx().push({k:'pool',x,y,r:58,t:4,m:4,tick:0,dmg:b.dmg*.35})})}},
};
CAVE_TICK.push(dt=>{if(G.netClient)return;const p=G.player;
  // devour animation
  for(const e of G.enemies){const E=e.eat;if(!E)continue;E.t+=dt;const b=E.b,k=Math.min(1,E.t/E.d);if(b.hp<=0){e.eat=null;continue}
    const sw=(1-k)*2.2;const dx=E.x0-b.x,dy=E.y0-b.y;const c=Math.cos(sw),s=Math.sin(sw);e.x=b.x+(dx*c-dy*s)*(1-k*k);e.y=b.y+(dx*s+dy*c)*(1-k*k);e.frozen=.05;
    if(k>=1){e.hp=0;e.gone=true;burst(b.x,b.y-8,'#5a0f12',3);if(b.bf.eat<30){b.bf.eat++;const add=b.baseHp*.015;b.maxHp+=add;b.hp+=add;b.dmg=b.baseDmg*(1+.01*b.bf.eat)}}}
  for(const b of G.enemies){if(!b.bf||b.hp<=0)continue;const f=b.bf,frac=b.hp/b.maxHp;
    if(f.ph<1&&frac<.5){f.ph=1;b.speed*=1.15;toast(b.T.name+' is enraged!');sfx('boss');ring(b.x,b.y,90,'#ff5a4e');G.shake=10}
    if(f.ph<2&&frac<.25){f.ph=2;b.speed*=1.1;toast(b.T.name+': final fury!');sfx('boss');ring(b.x,b.y,120,'#ffd34a');G.shake=12}
    const cdm=f.ph===2?.5:f.ph===1?.7:1;
    if(b.chg){b.chg.t-=dt;b.x+=Math.cos(b.chg.a)*b.speed*5.5*dt;b.y+=Math.sin(b.chg.a)*b.speed*5.5*dt;if(Math.random()<.5)burst(b.x,b.y,'#cfc3a8',1);if(b.chg.t<=0)b.chg=null}
    if(f.busy>0){f.busy-=dt;continue}
    const d=Math.hypot(p.x-b.x,p.y-b.y);if(d>Math.hypot(viewW(),viewH())*.7)continue; // only attack when on/near screen
    f.reg-=dt;f.sp-=dt;
    if(f.sp<=0){f.sp=rnd(7,9)*cdm;const m=f.set.sp[Math.floor(Math.random()*f.set.sp.length)];MOVES[m](b);f.busy=1.2;if(f.ph===2)setTimeout(()=>{if(b.hp>0)MOVES.ring(b)},900)}
    else if(f.reg<=0){f.reg=rnd(2.6,3.4)*cdm;const m=f.set.reg[Math.floor(Math.random()*f.set.reg.length)];MOVES[m](b);f.busy=.9}}
  const L=G.bfSpfx;if(!L)return;for(let i=L.length-1;i>=0;i--){const x=L[i];x.t-=dt;
    if(x.hold&&x.hold.hp>0)x.hold.frozen=Math.max(x.hold.frozen||0,.05);
    if(x.k==='wave')x.r=x.R*(1-x.t/x.m);
    if(x.k==='pool'){x.tick-=dt;if(x.tick<=0){x.tick=.5;if(Math.hypot(p.x-x.x,p.y-x.y)<x.r+p.r*.5&&p.invul<=0)damagePlayer(x.dmg*.5)}}
    if(x.k==='glow'&&x.b)x.x=x.b.x,x.y=x.b.y;
    if(x.t<=0){L.splice(i,1);if(x.fire)x.fire()}}});
runHooks.push(G=>{G.bfSpfx=[]});
// telegraphs, drawn above enemies
const _bfTop=drawLootTop;drawLootTop=function(){_bfTop();if(!G||!G.bfSpfx)return;const K=(X(100)-X(0))/100,pu=.5+.5*Math.sin(G.t*14);
  for(const f of G.bfSpfx){const a=1-f.t/f.m;
    if(f.k==='tele'){const sx=X(f.x),sy=Y(f.y),r=f.r*K;bx.globalAlpha=.18+.12*pu;bx.fillStyle=f.col;bx.beginPath();bx.arc(sx,sy,r,0,6.283);bx.fill();bx.globalAlpha=.9;bx.strokeStyle=f.col;bx.lineWidth=1;bx.beginPath();bx.arc(sx,sy,r,0,6.283);bx.stroke();
      bx.globalAlpha=.5;bx.beginPath();bx.arc(sx,sy,r*a,0,6.283);bx.stroke();bx.globalAlpha=1}
    else if(f.k==='wave'){bx.globalAlpha=Math.max(0,f.t/f.m);bx.strokeStyle='#fff1d0';bx.lineWidth=2;bx.beginPath();bx.arc(X(f.x),Y(f.y),f.r*K,0,6.283);bx.stroke();bx.globalAlpha=1}
    else if(f.k==='line'){const sx=X(f.x),sy=Y(f.y);bx.save();bx.translate(sx,sy);bx.rotate(f.a);bx.globalAlpha=.2+.2*pu;bx.fillStyle='#ff5a4e';const w=Math.max(3,(f.w||8)*K);bx.fillRect(0,-w,f.L*K,w*2);bx.globalAlpha=.9;bx.fillRect(0,-w,f.L*K*a,1);bx.fillRect(0,w-1,f.L*K*a,1);bx.restore();bx.globalAlpha=1}
    else if(f.k==='glow'&&f.b){bx.globalAlpha=.25+.35*pu;bx.strokeStyle='#e0b0ff';bx.lineWidth=2;bx.beginPath();bx.arc(X(f.b.x),Y(f.b.y)-8,(f.b.r+8)*K*(1.4-a*.4),0,6.283);bx.stroke();bx.globalAlpha=1}
    else if(f.k==='pool'){const sx=X(f.x),sy=Y(f.y);bx.globalAlpha=.35*Math.min(1,f.t);bx.fillStyle='#c2301e';bx.beginPath();bx.arc(sx,sy,f.r*K,0,6.283);bx.fill();bx.globalAlpha=.7*Math.min(1,f.t);bx.fillStyle='#ffb35c';
      for(let i=0;i<5;i++){const q=G.t*2+i*1.256;bx.fillRect(sx+Math.cos(q)*f.r*K*.6|0,sy+Math.sin(q*1.3)*f.r*K*.4|0,2,2)}bx.globalAlpha=1}}
  for(const e of G.enemies)if(e.eat){bx.globalAlpha=.5;bx.strokeStyle='#5a0f12';bx.beginPath();bx.moveTo(X(e.x),Y(e.y));bx.lineTo(X(e.eat.b.x),Y(e.eat.b.y));bx.stroke();bx.globalAlpha=1}};
