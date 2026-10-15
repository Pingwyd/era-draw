'use strict';
// ================= UPDATE: POLISH =================
// ---- Gamepad (P1): left stick moves, right stick aims, X/Y/B/RB cast loadout slots 1-4, A dash, LB/LT/RT spell pages, Start pause, B back in menus ----
const PADB={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,BACK:8,START:9,UP:12,DOWN:13,LEFT:14,RIGHT:15};
let padRaw=[],padPrev={},padNav=0,padAim=0,padMoving=false;
function p1Pad(){const ps=pads();const claimed=new Set((typeof PARTY!=='undefined'?PARTY:[]).filter(c=>c&&c.startsWith('pad')).map(c=>+c.slice(3)));
  const g=ps.find(g=>!claimed.has(g.index));window.P1_PAD=g?g.index:undefined;return g}
const pressed=(g,b)=>!!(g.buttons[b]&&(g.buttons[b].pressed||g.buttons[b].value>.5));
function key(k){dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}))}
function padCast(i){if(!G||G.paused||!G.loadout[i])return;if(G.castCd>0)return;const p=G.player;
  let dir=padAim;const t=typeof nearestEnemy==='function'?nearestEnemy(p.x,p.y,500):null;if(!padAimHeld&&t)dir=Math.atan2(t.y-p.y,t.x-p.x);
  spawnCreation(resolveDraw(G.loadout[i]),dir,false,.9);G.castCd=BASE_CAST_CD*p.cdMul;haptic(15)}
let padAimHeld=false;
function navTargets(){const root=document.querySelector('.modal')||(screenEl.innerHTML?screenEl:null);if(!root)return [];
  return [...root.querySelectorAll('button:not([disabled]),[data-i],.pick,a[href]')].filter(b=>b.offsetParent!==null)}
function padNavMove(d){const t=navTargets();if(!t.length)return;let i=t.indexOf(document.activeElement);i=i<0?0:(i+d+t.length)%t.length;t[i].focus();t[i].scrollIntoView&&t[i].scrollIntoView({block:'nearest'})}
function padPoll(){requestAnimationFrame(padPoll);const g=p1Pad();if(!g){if(padMoving){stick.active=false;padMoving=false}return}
  const was=padPrev,now={};for(const k in PADB)now[k]=pressed(g,PADB[k]);padPrev=now;const hit=k=>now[k]&&!was[k];
  const lx=g.axes[0]||0,ly=g.axes[1]||0,rx=g.axes[2]||0,ry=g.axes[3]||0,lm=Math.hypot(lx,ly);
  if(lm>.5||Math.hypot(rx,ry)>.5||g.buttons.some(b=>b&&b.pressed))document.body.classList.add('pad');
  const inRun=mode==='run'&&G&&!G.paused&&!screenEl.innerHTML;
  if(inRun){
    if(stick.id===null){if(lm>.2){const k=Math.min(1,(lm-.2)/.7);stick.active=true;stick.ox=0;stick.oy=0;stick.x=lx/lm*55*k;stick.y=ly/lm*55*k;padMoving=true}else if(padMoving){stick.active=false;padMoving=false}}
    padAimHeld=Math.hypot(rx,ry)>.35;if(padAimHeld)padAim=Math.atan2(ry,rx);
    // in-run buttons come from the (remappable) binding table: PAD_BIND[action] = button index
    const B=padBinds(),hb=i=>pressed(g,i)&&!padRaw[i];
    if(hb(B.dash))tryDash();if(!save.padDraw){if(hb(B.cast1))padCast(0);if(hb(B.cast2))padCast(1);if(hb(B.cast3))padCast(2);if(hb(B.cast4))padCast(3)}
    if(hb(B.pause))key('Escape');padRaw=g.buttons.map((_,i)=>pressed(g,i));return}
  padRaw=g.buttons.map((_,i)=>pressed(g,i));
  if(padMoving){stick.active=false;padMoving=false}
  const t=performance.now();const vx=hit('RIGHT')?1:hit('LEFT')?-1:0,vy=hit('DOWN')?1:hit('UP')?-1:0;
  if(vx||vy)padNavMove(vx+vy,vx,vy);else if(lm>.6&&t-padNav>220){padNav=t;const h=Math.abs(lx)>Math.abs(ly);padNavMove((h?lx:ly)>0?1:-1,h?Math.sign(lx):0,h?0:Math.sign(ly))}
  if(hit('A')){const a=document.activeElement;if(a&&a!==document.body&&navTargets().includes(a))a.click();else padNavMove(0)}
  if(hit('B'))key('Escape');if(hit('START')){if(mode==='run'&&G)key('Escape');else{const b=$('play')||document.querySelector('[data-route="play"]');b&&b.click()}}}
addEventListener('gamepadconnected',e=>{toast('Controller connected: '+(e.gamepad.id||'gamepad').split('(')[0].trim().slice(0,32))});
requestAnimationFrame(padPoll);

// ---- accessibility: colour-blind palettes + high contrast (Settings) ----
if(save.cb==null)save.cb='off';if(save.hc==null)save.hc=false;
const CB_FILTERS={off:'',deut:'url(#cb-deut)',prot:'url(#cb-prot)',trit:'url(#cb-trit)'};
const CB_NAMES={off:'Off',deut:'Deuteranopia',prot:'Protanopia',trit:'Tritanopia'};
(function(){const NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.style.position='absolute';
  // these are correction (not simulation) matrices: hue-rotate the confused axis so enemies/loot stay distinct
  const C={deut:'1 0.6 -0.6 0 0  0 1 0 0 0  -0.3 0.6 1 0 0  0 0 0 1 0',prot:'1 0 0 0 0  0.6 0.6 -0.2 0 0  0.6 -0.4 1 0 0  0 0 0 1 0',trit:'1 0 0.3 0 0  0 1 0.3 0 0  0 -0.5 1.2 0 0  0 0 0 1 0'};
  s.innerHTML=Object.keys(C).map(k=>`<filter id="cb-${k}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${C[k]}"/></filter>`).join('');
  document.body.appendChild(s)})();
// applies to the whole page (menus, settings, HUD and the game canvas) so changes preview live
function applyA11y(){const f=[CB_FILTERS[save.cb]||'',save.hc?'contrast(1.35) saturate(1.25)':''].join(' ').trim();const c=$('c');if(c)c.style.filter='';document.documentElement.style.filter=f;document.body.classList.toggle('hc',!!save.hc);document.body.classList.toggle('cb',save.cb!=='off')}
applyA11y();
// high contrast in-world: thicker outlines on enemies + bright ring under player and loot
const _plTop=drawLootTop;drawLootTop=function(){_plTop();if(!G||!save.hc)return;const p=G.player;bx.strokeStyle='#ffffff';bx.lineWidth=1;bx.beginPath();bx.arc(X(p.x),Y(p.y),9,0,6.283);bx.stroke();
  bx.strokeStyle='#ff3b3b';for(const e of G.enemies){bx.beginPath();bx.arc(X(e.x),Y(e.y)-4,Math.max(5,e.r/ (S||1)*1.2),0,6.283);bx.stroke()}};
const _plSettings=settings;settings=function(inRun){_plSettings(inRun);const host=screenEl.querySelector('.menu,.tbl,.sheet');if(!host)return;
  const box=document.createElement('nav');box.className='menu a11y';
  box.innerHTML=`<div class="lab rule">Accessibility</div><button id="cbBtn"><b>CB</b>Colour-blind filter<span>${CB_NAMES[save.cb]}</span><i>&rarr;</i></button><button id="hcBtn"><b>HC</b>High contrast<span>${save.hc?'On':'Off'}</span><i>&rarr;</i></button><p class="sh">${navigator.getGamepads?'Controller: plug in or press a button. Left stick move, right stick aim. Buttons can be remapped under Controls below.':'Controllers are not supported by this browser.'}</p>`;
  (screenEl.querySelector('.sheet')||host).appendChild(box);
  $('cbBtn').onclick=()=>{const ks=Object.keys(CB_NAMES);save.cb=ks[(ks.indexOf(save.cb)+1)%ks.length];persist();applyA11y();$('cbBtn').querySelector('span').textContent=CB_NAMES[save.cb]};
  $('hcBtn').onclick=()=>{save.hc=!save.hc;persist();applyA11y();$('hcBtn').querySelector('span').textContent=save.hc?'On':'Off'}};
