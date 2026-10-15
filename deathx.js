'use strict';
// ===== Death transition (~2s, skippable): slow-mo + zoom onto the player, ink shatter, torn-paper iris, results fade in =====
// Safe by design: the real endRun always runs (on finish, skip, pause attempt, or a hard timeout), never mid-step.
if(save.reduceMotion==null)save.reduceMotion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let DTH=null;
function dthFinish(){if(!DTH||DTH.done)return;DTH.done=true;clearTimeout(DTH.to);const fn=DTH.end;DTH=null;
  try{fn()}catch(e){console.error('endRun',e);try{if(G){G=null}mode='dead';results()}catch(x){home()}}
  try{screenEl.classList.remove('dthIn');void screenEl.offsetWidth;screenEl.classList.add('dthIn');setTimeout(()=>screenEl.classList.remove('dthIn'),700)}catch(e){}}
const _dxEnd=endRun;endRun=function(){
  if(DTH&&!DTH.done)return; // transition running: the step loop keeps calling, ignore until it finishes
  if(!(G&&G.dead&&mode==='run')||G.netClient)return _dxEnd.apply(this,arguments);
  const me=this,args=arguments,p=G.player,rm=!!save.reduceMotion;
  DTH={t0:performance.now(),dur:rm?600:2000,rm,end:()=>_dxEnd.apply(me,args),done:false,px:p.x,py:p.y,seed:Math.random()*100};
  G.deathFx=performance.now()-5000;p.invul=99;G.shake=rm?0:10;
  if(!rm){for(let i=0;i<46;i++){const a=Math.random()*6.283,sp=rnd(40,240);G.fx.push({x:p.x,y:p.y-8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-30,life:rnd(.9,1.6),max:1.6,col:i%4===0?'#efe6d2':i%4===1?'#7b5ac8':'#1a0f0e',r:rnd(2,5)})}
    ring(p.x,p.y,110,'#1a0f0e')}
  DTH.to=setTimeout(dthFinish,DTH.dur+1500); // hard failsafe even if frames stop
};
// while dying: advance particles in slow motion only (the world is frozen), finish when the time is up
const _dxFrame=renderSafe;renderSafe=function(dt){
  if(DTH&&!DTH.done&&G){const el=(performance.now()-DTH.t0)/DTH.dur;try{if(!DTH.rm){for(const f of G.fx){f.x+=(f.vx||0)*dt*.3;f.y+=(f.vy||0)*dt*.3;f.life-=dt*.3}G.fx=G.fx.filter(f=>f.life>0)}G.shake*=.9}catch(e){}
    let r;try{r=_dxFrame(dt)}catch(e){}try{dthPost(Math.min(1,el))}catch(e){}if(el>=1)setTimeout(dthFinish,0);return r}
  return _dxFrame(dt)};
function dthPost(k){const p=G.player,sx=(X(p.x))*S,sy=(Y(p.y)-6)*S;const e=k*k*(3-2*k);
  if(!DTH.rm){const z=1+.7*Math.min(1,k*1.6);if(!dthPost.c)dthPost.c=document.createElement('canvas');const c=dthPost.c;if(c.width!==cv.width||c.height!==cv.height){c.width=cv.width;c.height=cv.height}
    const cx=c.getContext('2d');cx.clearRect(0,0,c.width,c.height);cx.drawImage(cv,0,0);const dpr=cv.width/W;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;const fx=sx*dpr,fy=sy*dpr;ctx.translate(fx,fy);ctx.scale(z,z);ctx.translate(-fx,-fy);ctx.drawImage(c,0,0);ctx.restore();
    // ink splatter shatter: the mage breaks into ink blots radiating out
    const n=14;ctx.save();for(let i=0;i<n;i++){const a=i/n*6.283+DTH.seed,d=(8+60*e)*z,r=(5-3*e)*z;ctx.globalAlpha=1-e*.6;ctx.fillStyle=i%3?'#1a0f0e':'#7b5ac8';ctx.fillRect(sx+Math.cos(a)*d-r,sy+Math.sin(a)*d-r,r*2,r*2)}ctx.restore()}
  // torn-paper iris closing on the player (starts at 45% of the transition)
  const ik=DTH.rm?k:Math.max(0,(k-.45)/.55);if(ik<=0)return;const R0=Math.hypot(W,H),R=R0*(1-ik*ik*(3-2*ik));
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);const m=36;for(let i=0;i<=m;i++){const a=i/m*6.283,j=1+.07*Math.sin(i*7.3+DTH.seed)+.05*Math.sin(i*3.1);const rr=Math.max(0,R*j);i?ctx.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr):ctx.moveTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr)}
  ctx.closePath();ctx.fillStyle='#140b0c';ctx.fill('evenodd');ctx.strokeStyle='#efe6d2';ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();for(let i=0;i<=m;i++){const a=i/m*6.283,j=1+.07*Math.sin(i*7.3+DTH.seed)+.05*Math.sin(i*3.1),rr=Math.max(0,R*j);i?ctx.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr):ctx.moveTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr)}ctx.stroke();ctx.restore()}
// skip: tap / click, Enter / Space / Escape, controller A (dash bind) or Start
const dthSkip=e=>{if(!DTH||DTH.done)return;if(e){e.preventDefault&&e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation()}dthFinish()};
addEventListener('pointerdown',e=>{if(DTH&&!DTH.done)dthSkip(e)},true);
addEventListener('keydown',e=>{if(DTH&&!DTH.done&&['Enter',' ','Escape'].includes(e.key))dthSkip(e)},true);
const _dxDash=tryDash;tryDash=function(){if(DTH&&!DTH.done){dthSkip();return}return _dxDash.apply(this,arguments)};
const _dxTP=togglePause;togglePause=function(){if(DTH&&!DTH.done){dthFinish();return}return _dxTP.apply(this,arguments)};
(function padSkip(){requestAnimationFrame(padSkip);if(!DTH||DTH.done)return;const g=navigator.getGamepads&&[...navigator.getGamepads()].find(x=>x);if(g&&g.buttons&&((g.buttons[0]&&g.buttons[0].pressed)||(g.buttons[9]&&g.buttons[9].pressed))&&performance.now()-DTH.t0>250)dthFinish()})();
window.dthActive=()=>!!(DTH&&!DTH.done);
