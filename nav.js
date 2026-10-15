// ===== Menu navigation: spatial focus (keys + pad), B/Esc back for popups, controller drawing =====
function navRoot(){return document.getElementById('bpop')||document.querySelector('.modal')||(screenEl.innerHTML?screenEl:null)}
function navAll(){const r=navRoot();if(!r)return [];return [...r.querySelectorAll('button:not([disabled]),[data-m],[data-i],.pick,a[href],input[type=range]')].filter((b,i,a)=>b.offsetParent!==null&&a.indexOf(b)===i)}
function navFocus(el,scroll){if(!el)return;if(!el.hasAttribute('tabindex')&&!/^(BUTTON|A|INPUT)$/.test(el.tagName))el.setAttribute('tabindex','0');try{el.focus({preventScroll:true})}catch(e){el.focus()}if(scroll!==false&&el.scrollIntoView)el.scrollIntoView({block:'nearest'})}
// move focus to the nearest element in direction (dx,dy); returns true if handled
function navSpatial(dx,dy){const t=navAll();if(!t.length)return false;const a=document.activeElement;
  if(!a||!t.includes(a)){navFocus(t[0]);return true}
  const ra=a.getBoundingClientRect(),ax=ra.left+ra.width/2,ay=ra.top+ra.height/2;let best=null,bs=1e9;
  for(const b of t){if(b===a)continue;const r=b.getBoundingClientRect(),bx=r.left+r.width/2,by=r.top+r.height/2,ox=bx-ax,oy=by-ay;
    const along=ox*dx+oy*dy;if(along<=4)continue;const perp=Math.abs(ox*dy-oy*dx);const s=along+perp*2.2;if(s<bs){bs=s;best=b}}
  if(!best){// wrap: linear fallback
    const i=t.indexOf(a);best=t[(i+(dx+dy>0?1:-1)+t.length)%t.length]}
  navFocus(best);return true}
padNavMove=function(d,dx,dy){const t=navAll();if(!t.length)return;if(d===0||(!dx&&!dy)){const a=document.activeElement;if(!t.includes(a))navFocus(t[0]);else if(d)navSpatial(d>0?0:0,d);return}navSpatial(dx,dy)};
navTargets=navAll;
// Esc / B closes popups and cancels confirms before anything else
addEventListener('keydown',e=>{if(e.key!=='Escape'||e.repeat)return;
  const bp=document.getElementById('bpop');if(bp){e.preventDefault();e.stopImmediatePropagation();bp.remove();return}
  const no=document.getElementById('cfNo');if(no){e.preventDefault();e.stopImmediatePropagation();no.click()}},true);
// last input decides whether menus get auto-focus; pointer/touch/wheel never trigger it
let navLast='pointer',navRoute='';
const navPtr=()=>{navLast='pointer';document.body.classList.remove('kbnav','pad')};
for(const ev of ['pointerdown','touchstart','wheel','mousedown'])addEventListener(ev,navPtr,{passive:true,capture:true});
addEventListener('keydown',e=>{if(/^(Arrow|Tab|Enter|Escape)/.test(e.key)){navLast='key';document.body.classList.add('kbnav')}},true);
setInterval(()=>{if(document.body.classList.contains('pad'))navLast='pad'},250);
// auto-focus only when a NEW page opens (route change), only for keyboard/controller users, without scrolling
new MutationObserver(()=>{const r=location.hash;if(r===navRoute)return;navRoute=r;if(navLast==='pointer')return;
  const t=navAll(),a=document.activeElement;if(t.length&&!t.includes(a))navFocus(t.find(b=>b.id!=='back')||t[0],false)}).observe(screenEl,{childList:true});

// ---- Controller drawing: right stick moves a cursor, hold RT to trace ----
if(save.padDraw==null)save.padDraw=false;
const PADCUR=document.createElement('div');PADCUR.id='padCur';document.body.appendChild(PADCUR);
let pdHeld=false,pdX=0,pdY=0,pdLast=0;
(function pdPoll(now){requestAnimationFrame(pdPoll);const g=typeof p1Pad==='function'&&p1Pad();
  const on=save.padDraw&&g&&mode==='run'&&G&&!G.paused&&!screenEl.innerHTML;if(G)G.padDraw=!!on;
  PADCUR.style.display=on?'block':'none';if(!on){pdHeld=false;pdLast=now;return}
  const dt=Math.min(.05,(now-(pdLast||now))/1000);pdLast=now;
  if(!pdX){pdX=W*.62;pdY=H*.5}
  let rx=g.axes[2]||0,ry=g.axes[3]||0;const m=Math.hypot(rx,ry);if(m<.15){rx=ry=0}
  const sp=Math.min(W,H)*1.6;pdX=Math.max(6,Math.min(W-6,pdX+rx*sp*dt));pdY=Math.max(6,Math.min(H-6,pdY+ry*sp*dt));
  PADCUR.style.transform=`translate(${pdX}px,${pdY}px)`;
  const rt=g.buttons[7]&&(g.buttons[7].pressed||g.buttons[7].value>.4);PADCUR.classList.toggle('on',!!rt);
  if(rt&&!pdHeld){pdHeld=true;if(!G.drawing){G.drawing={id:'pad',t0:performance.now(),pts:[{x:pdX,y:pdY}]};sfx('draw')}}
  else if(rt&&G.drawing&&G.drawing.id==='pad'){const pts=G.drawing.pts,l=pts[pts.length-1];if(Math.hypot(pdX-l.x,pdY-l.y)>3)pts.push({x:pdX,y:pdY})}
  else if(!rt&&pdHeld){pdHeld=false;if(G.drawing&&G.drawing.id==='pad')finishDraw()}})(performance.now());
const _navSettings=settings;settings=function(inRun){_navSettings(inRun);const box=screenEl.querySelector('.menu.a11y');if(!box)return;
  const b=document.createElement('button');b.id='pdBtn';b.innerHTML=`<b>RT</b>Controller drawing<span>${save.padDraw?'On':'Off'}</span><i>&rarr;</i>`;
  const p=box.querySelector('.sh');box.insertBefore(b,p);
  if(p)p.insertAdjacentHTML('afterend','<p class="sh">Controller drawing: right stick moves a pen cursor, hold RT to trace a shape, release to cast. Menus: stick / D-pad move, A select, B back.</p>');
  b.onclick=()=>{save.padDraw=!save.padDraw;persist();b.querySelector('span').textContent=save.padDraw?'On':'Off'}};
