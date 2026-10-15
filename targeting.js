'use strict';
// ================= TARGETING =================
// Auto-aim considers enemies AND breakables (nearest first). Lock a target by tapping/clicking it, by pushing the right
// stick toward it, or cycle on-screen targets (R3 / Tab) strongest first: bosses > elites > enemies > breakables.
PAD_DEFAULT.target=11;KEY_DEFAULT.target='tab';ACT_NAMES.target='Cycle target';
const tgAlive=t=>t&&(t.prop?!t.dead&&G.props&&G.props.includes(t):t.hp>0&&G.enemies.includes(t));
function targetables(){const out=G.enemies.slice();if(G.props)for(const k of G.props)if(!k.dead){k.prop=true;out.push(k)}return out}
nearestEnemy=function(x,y,maxD=9e9,skip){
  const L=G.lock;if(tgAlive(L)&&!(skip&&skip.has(L))&&Math.hypot(L.x-x,L.y-y)<Math.max(maxD,600))return L;
  let best=null,bd=maxD;for(const e of G.enemies){if(skip&&skip.has(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;best=e}}
  if(G.props&&!skip)for(const k of G.props){if(k.dead)continue;const d=Math.hypot(k.x-x,k.y-8-y);if(d<bd){bd=d;best=k;k.prop=true}}
  return best};
const tier=t=>t.prop?3:t.T.boss?0:(t.T.elite||t.champ)?1:2;
function setLock(t,quiet){G.lock=t||null;if(t&&!quiet){sfx('pick');haptic(10)}}
function cycleTarget(){if(!G||G.paused)return;const vis=targetables().filter(t=>onScr(t.x,t.y,0));if(!vis.length){setLock(null);return}
  vis.sort((a,b)=>tier(a)-tier(b)||(b.maxHp||0)-(a.maxHp||0)||Math.hypot(a.x-G.player.x,a.y-G.player.y)-Math.hypot(b.x-G.player.x,b.y-G.player.y));
  const i=vis.indexOf(G.lock);setLock(vis[(i+1)%vis.length])}
function lockToward(ang){const p=G.player;let best=null,bs=-1e9;for(const t of targetables()){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>620||d<1)continue;
  let da=Math.atan2(dy,dx)-ang;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;if(Math.abs(da)>.5)continue;const s=-Math.abs(da)*600-d*.4+(3-tier(t))*60;if(s>bs){bs=s;best=t}}
  if(best&&best!==G.lock)setLock(best,true)}
// tap / click an enemy to lock it (a tiny stroke that isn't a shape)
const _tgFinish=finishDraw;finishDraw=function(){const d=G&&G.drawing;
  if(d&&d.pts.length){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of d.pts){x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y)}
    if(x1-x0<16&&y1-y0<16&&performance.now()-d.t0<400){G.drawing=null;const q=d.pts[0],wx=(q.x-W/2)/S*Z+cam.x,wy=(q.y-H/2)/S*Z+cam.y;
      let best=null,bd=1e9;for(const t of targetables()){const dd=Math.hypot(t.x-wx,(t.y-(t.prop?8:t.r*.6))-wy)-(t.r||10);if(dd<bd){bd=dd;best=t}}
      if(best&&bd<34){setLock(best);floatText(best.x,best.y-(best.r||10)-24,'LOCKED','#ff6a5a',.6,9)}else if(G.lock){setLock(null);floatText(G.player.x,G.player.y-40,'lock off','#cfc3a8',.5,9)}return}}
  return _tgFinish()};
addEventListener('keydown',e=>{if(mode!=='run'||!G||BINDING)return;const k=e.key.length===1?e.key.toLowerCase():e.key.toLowerCase();if(keyAction(k)==='target'||(k==='tab'&&keyBinds().target==='tab')){e.preventDefault();if(!e.repeat)cycleTarget()}});
let tgPrev=false,tgStickT=0;
(function tgPoll(){requestAnimationFrame(tgPoll);if(mode!=='run'||!G||G.paused||G.padDraw)return;const g=typeof p1Pad==='function'&&p1Pad();if(!g)return;
  const b=padBinds().target,on=!!(g.buttons[b]&&g.buttons[b].pressed);if(on&&!tgPrev)cycleTarget();tgPrev=on;
  const rx=g.axes[2]||0,ry=g.axes[3]||0;if(Math.hypot(rx,ry)>.55&&performance.now()-tgStickT>180){tgStickT=performance.now();lockToward(Math.atan2(ry,rx))}})();
runHooks.push(G=>{G.lock=null});
CAVE_TICK.push(()=>{if(G.lock&&(!tgAlive(G.lock)||Math.hypot(G.lock.x-G.player.x,G.lock.y-G.player.y)>950))G.lock=null});
// reticle
// selection marker: pulsing white/gold ring + corner brackets + arrow above, dark-edged so it reads under colour-blind / high-contrast filters
const _tgTop=drawLootTop;drawLootTop=function(){_tgTop();const t=G&&G.lock;if(!tgAlive(t)||!onScr(t.x,t.y,20))return;
  const pu=.5+.5*Math.sin(G.t*8),r=Math.max(7,Math.round(((t.r||10)+7)/Z))+Math.round(pu),cx=X(t.x),cy=Y(t.y)-Math.round((t.prop?8:(t.r||10)*.7)/Z),L=4;
  const col=pu>.5?'#ffffff':'#ffd34a';
  bx.lineWidth=3;bx.strokeStyle='#1a0f0e';bx.beginPath();bx.arc(cx,cy,r,0,6.283);bx.stroke();bx.lineWidth=1;bx.strokeStyle=col;bx.globalAlpha=.85;bx.beginPath();bx.arc(cx,cy,r,0,6.283);bx.stroke();bx.globalAlpha=1;
  const R=r+3;for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=cx+sx*R,y=cy+sy*R;bx.fillStyle='#1a0f0e';bx.fillRect((sx<0?x:x-L+1)-1,y-1,L+2,3);bx.fillRect(x-1,(sy<0?y:y-L+1)-1,3,L+2);bx.fillStyle=col;bx.fillRect(sx<0?x:x-L+1,y,L,1);bx.fillRect(x,sy<0?y:y-L+1,1,L)}
  const ay=cy-R-4-Math.round(pu*2);bx.fillStyle='#1a0f0e';bx.beginPath();bx.moveTo(cx-4,ay-4);bx.lineTo(cx+4,ay-4);bx.lineTo(cx,ay+1);bx.fill();bx.fillStyle=col;bx.beginPath();bx.moveTo(cx-3,ay-3);bx.lineTo(cx+3,ay-3);bx.lineTo(cx,ay);bx.fill()};
