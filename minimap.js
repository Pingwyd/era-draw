'use strict';
// ================= MINIMAP =================
// Corner radar: you (direction arrow), teammates, enemies (bosses distinct), XP gems, chests, shrines.
// Always on in multiplayer (same-screen co-op or LAN); optional in solo (Settings > Minimap).
if(save.minimap==null)save.minimap=false;
const MM_RANGE=900;
function mmMulti(){return !!(G&&((G.allies&&G.allies.length)||G.lan))}
function mmOn(){return mode==='run'&&G&&!G.paused&&(save.minimap||mmMulti())}
let mmCv=null,mmX=null,mmF=0;
function mmEl(){if(mmCv)return mmCv;mmCv=document.createElement('canvas');mmCv.id='minimap';mmCv.width=96;mmCv.height=96;mmX=mmCv.getContext('2d');$('hud').appendChild(mmCv);return mmCv}
function mmDraw(){requestAnimationFrame(mmDraw);if(!mmOn()){if(mmCv)mmCv.style.display='none';return}const c=mmEl();c.style.display='';if((mmF++)&1)return;
  const x=mmX,W2=48,k=W2/MM_RANGE,p=G.player,P=(o)=>[W2+(o.x-p.x)*k,W2+(o.y-p.y)*k],inb=(a)=>a[0]>=1&&a[0]<=95&&a[1]>=1&&a[1]<=95;
  x.clearRect(0,0,96,96);x.fillStyle='rgba(20,11,12,.72)';x.beginPath();x.arc(48,48,47,0,6.283);x.fill();x.strokeStyle='rgba(233,220,195,.35)';x.lineWidth=1;x.stroke();
  x.save();x.beginPath();x.arc(48,48,46,0,6.283);x.clip();
  x.strokeStyle='rgba(233,220,195,.12)';x.beginPath();x.arc(48,48,24,0,6.283);x.stroke();
  x.fillStyle='#5fd3e8';for(const o of G.orbs){const a=P(o);if(inb(a))x.fillRect(a[0]|0,a[1]|0,o.v>=10?2:1,o.v>=10?2:1)}
  for(const e of G.enemies){if(e.T.boss||e.eat)continue;const a=P(e);if(inb(a))mmIcon(x,a[0]|0,a[1]|0,e,p)}
  if(G.props)for(const k of G.props){if(k.dead)continue;const a=P(k);if(!inb(a))continue;x.fillStyle='#1a0f0e';x.fillRect((a[0]|0)-1,(a[1]|0)-1,3,3);x.fillStyle='#8fe07a';x.fillRect(a[0]|0,a[1]|0,1,1)}
  if(G.shrines)for(const s of G.shrines){const a=P(s);const cx=a[0]|0,cy=a[1]|0;x.fillStyle='#1a0f0e';x.fillRect(cx-2,cy-1,5,3);x.fillRect(cx-1,cy-2,3,5);x.fillStyle='#7fd8ff';x.fillRect(cx-1,cy,3,1);x.fillRect(cx,cy-1,1,3)}
  for(const ch of G.chests){const a=P(ch);x.fillStyle='#1a0f0e';x.fillRect((a[0]|0)-2,(a[1]|0)-2,5,5);x.fillStyle='#ffd34a';x.fillRect((a[0]|0)-1,(a[1]|0)-1,3,3)}
  x.restore();
  // bosses and allies: clamp to edge so you always know the direction
  const edge=(a)=>{const dx=a[0]-48,dy=a[1]-48,d=Math.hypot(dx,dy);return d>43?[48+dx/d*43,48+dy/d*43]:a};
  for(const e of G.enemies)if(e.T.boss){const a=edge(P(e)),cx=Math.round(a[0]),cy=Math.round(a[1]);x.fillStyle='#1a0f0e';x.fillRect(cx-4,cy-4,9,8);x.fillStyle='#ffd34a';x.fillRect(cx-3,cy-1,7,3);x.fillRect(cx-3,cy-3,1,2);x.fillRect(cx,cy-3,1,2);x.fillRect(cx+3,cy-3,1,2);x.fillStyle='#ff2e63';x.fillRect(cx-1,cy,3,1)}
  const mates=[...(G.allies||[]),...((G.lan&&G.lan.peers)||[])];
  mates.forEach((q,i)=>{const a=edge(P(q));x.fillStyle='#1a0f0e';x.fillRect(a[0]-3,a[1]-3,6,6);x.fillStyle=q.down?'#777':['#7ab8ff','#8fe07a','#ffb13a','#c48cff'][i%4];x.fillRect(a[0]-2,a[1]-2,4,4)});
  // you: arrow pointing where you face / move
  const f=p.face||0;x.save();x.translate(48,48);x.rotate(f);x.fillStyle='#1a0f0e';x.beginPath();x.moveTo(7,0);x.lineTo(-5,-5);x.lineTo(-2,0);x.lineTo(-5,5);x.closePath();x.fill();
  x.fillStyle='#ffffff';x.beginPath();x.moveTo(5.5,0);x.lineTo(-3.6,-3.6);x.lineTo(-1.2,0);x.lineTo(-3.6,3.6);x.closePath();x.fill();x.restore()}
requestAnimationFrame(mmDraw);
// Settings toggle (appended to the Accessibility block / settings sheet)
const _mmSettings=settings;settings=function(inRun){_mmSettings(inRun);const host=screenEl.querySelector('.a11y')||screenEl.querySelector('.sheet');if(!host)return;
  const b=document.createElement('button');b.id='mmBtn';b.innerHTML=`<b>MM</b>Minimap (solo)<span>${save.minimap?'On':'Off'}</span><i>&rarr;</i>`;host.appendChild(b);
  const n=document.createElement('p');n.className='sh';n.textContent='The minimap is always shown in multiplayer.';host.appendChild(n);
  b.onclick=()=>{save.minimap=!save.minimap;persist();b.querySelector('span').textContent=save.minimap?'On':'Off'}};

// enemy icon by type: dot regular, triangle ranged, arrow charger, x exploder, diamond elite (all with dark edge)
function mmKind(e){if(e.vet||e.champ||e.T.elite)return 'elite';if(e.af==='boom')return 'boom';if(e.af==='spit'||e.T.beh==='thrower'||e.T.ranged||e.T.shoot)return 'ranged';if(e.af==='dash'||e.af==='leap'||e.T.beh==='charge'||e.T.beh==='lunge')return 'charge';return 'dot'}
function mmIcon(x,cx,cy,e,p){const k=mmKind(e);x.fillStyle='#1a0f0e';
  if(k==='dot'){x.fillRect(cx-1,cy-1,3,3);x.fillStyle='#ff5a4e';x.fillRect(cx,cy,1,1);return}
  if(k==='elite'){x.fillRect(cx-1,cy-3,3,7);x.fillRect(cx-3,cy-1,7,3);x.fillStyle='#ffd34a';x.fillRect(cx,cy-2,1,5);x.fillRect(cx-2,cy,5,1);x.fillRect(cx-1,cy-1,3,3);return}
  if(k==='boom'){x.fillRect(cx-2,cy-2,5,5);x.fillStyle='#ff9a3c';x.fillRect(cx-1,cy-1,1,1);x.fillRect(cx+1,cy-1,1,1);x.fillRect(cx,cy,1,1);x.fillRect(cx-1,cy+1,1,1);x.fillRect(cx+1,cy+1,1,1);return}
  if(k==='ranged'){x.fillRect(cx-2,cy-2,5,4);x.fillStyle='#9fe07a';x.fillRect(cx,cy-1,1,1);x.fillRect(cx-1,cy,3,1);return}
  const a=Math.atan2(p.y-e.y,p.x-e.x);x.save();x.translate(cx+.5,cy+.5);x.rotate(a);x.fillStyle='#1a0f0e';x.beginPath();x.moveTo(3.5,0);x.lineTo(-2.5,-2.5);x.lineTo(-2.5,2.5);x.fill();x.fillStyle='#ff7a5a';x.beginPath();x.moveTo(2.2,0);x.lineTo(-1.5,-1.4);x.lineTo(-1.5,1.4);x.fill();x.restore()}
