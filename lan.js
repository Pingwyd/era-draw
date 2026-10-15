'use strict';
// ================= LAN MULTIPLAYER (separate devices, same Wi-Fi/hotspot, no internet) =================
// WebRTC DataChannel with serverless manual signalling: the host shows an invite (QR + short text code),
// the joiner scans/pastes it and shows an answer code back. No STUN/TURN: on a LAN, host candidates are enough.
// Host-authoritative: the host runs the fixed-tick sim; joiners send inputs (20 Hz) and render state snapshots (15 Hz).
// Joiners play as companion mages (auto-casting sketch bolts, dash, revive), exactly like same-screen co-op slots.
const LAN_VER='EDL1';
const LAN={role:null,peers:[],host:null,slot:0,status:''};
const NET_IN={};
// ---------- SDP compaction (only what a data-channel needs) ----------
function hexToB64(fp){return btoa(fp.split(':').map(h=>String.fromCharCode(parseInt(h,16))).join(''))}
function b64ToHex(b){return [...atob(b)].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase()).join(':')}
function sdpPack(desc){const s=desc.sdp,g=r=>{const m=s.match(r);return m?m[1].trim():''};
  const cands=[];const re=/a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ host/g;let m;while((m=re.exec(s)))if(!cands.includes(m[1]+'_'+m[2]))cands.push(m[1]+'_'+m[2]);
  return [LAN_VER,desc.type==='offer'?'O':'A',g(/a=ice-ufrag:(.+)/),g(/a=ice-pwd:(.+)/),hexToB64(g(/a=fingerprint:sha-256 (.+)/)),({actpass:'x',active:'c',passive:'p'})[g(/a=setup:(\w+)/)]||'c',cands.join(',')].join('~')}
function sdpUnpack(code){const p=code.trim().replace(/\s+/g,'').split('~');if(p[0]!==LAN_VER||p.length<7)throw new Error('Not an Era Draw LAN code');
  const type=p[1]==='O'?'offer':'answer',setup={x:'actpass',c:'active',p:'passive'}[p[5]]||'active';
  const cands=p[6]?p[6].split(','):[];
  const sdp=['v=0','o=- '+(Date.now()%1e9)+' 2 IN IP4 127.0.0.1','s=-','t=0 0','a=group:BUNDLE 0','a=msid-semantic: WMS','m=application 9 UDP/DTLS/SCTP webrtc-datachannel','c=IN IP4 0.0.0.0',
    'a=ice-ufrag:'+p[2],'a=ice-pwd:'+p[3],'a=ice-options:trickle','a=fingerprint:sha-256 '+b64ToHex(p[4]),'a=setup:'+setup,'a=mid:0','a=sctp-port:5000','a=max-message-size:262144',
    ...cands.map((c,i)=>{const j=c.lastIndexOf('_'),ip=c.slice(0,j),port=c.slice(j+1);return `a=candidate:${i+1} 1 udp ${2122260223-i} ${ip} ${port} typ host generation 0`}),'a=end-of-candidates',''].join('\r\n');
  return {type,sdp}}
function gathered(pc){return new Promise(res=>{if(pc.iceGatheringState==='complete')return res();const t=setTimeout(res,4000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);res()}})})}
function newPC(){return new RTCPeerConnection({iceServers:[]})}
function lanSend(dc,m){try{if(dc&&dc.readyState==='open')dc.send(JSON.stringify(m))}catch(e){}}
// ---------- host ----------
async function hostInvite(){if(LAN.peers.length>=3){toast('Up to 4 players');return null}
  const pc=newPC(),dc=pc.createDataChannel('ed',{ordered:false,maxRetransmits:0}),peer={pc,dc,slot:LAN.peers.length+1,ok:false,name:'P'+(LAN.peers.length+2)};
  dc.onopen=()=>{peer.ok=true;lanSend(dc,{k:'hello',slot:peer.slot});toast(peer.name+' connected');lanRefresh()};
  dc.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}if(m.k==='in')NET_IN['net'+peer.slot]={mx:+m.mx||0,my:+m.my||0,dash:!!m.dash};else if(m.k==='em'&&window.lanEmoteIn)lanEmoteIn(peer.slot,m)};
  dc.onclose=()=>{peer.ok=false;peer.gone=true;toast(peer.name+' disconnected');const q=G&&G.allies&&G.allies.find(a=>a.ctrl==='net'+peer.slot);if(q){q.down=true;q.hp=0;q.gone=true}lanRefresh()};
  LAN.role='host';LAN.peers.push(peer);
  await pc.setLocalDescription(await pc.createOffer());await gathered(pc);peer.offer=sdpPack(pc.localDescription);return peer}
async function hostAccept(peer,code){const d=sdpUnpack(code);if(d.type!=='answer')throw new Error('That is an invite, not an answer');await peer.pc.setRemoteDescription(d)}
// ---------- joiner ----------
async function joinWith(code){const d=sdpUnpack(code);if(d.type!=='offer')throw new Error('That is an answer code; paste the host invite');
  const pc=newPC();LAN.role='client';LAN.host={pc,dc:null};
  pc.ondatachannel=ev=>{const dc=ev.channel;LAN.host.dc=dc;dc.onopen=()=>{LAN.status='Connected. Waiting for the host to start…';lanRefresh()};dc.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}clientMsg(m)};
    dc.onclose=()=>{toast('Host disconnected');LAN.role=null;if(G&&G.netClient){G=null;mode='home'}home()}};
  await pc.setRemoteDescription(d);await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);return sdpPack(pc.localDescription)}
// ---------- host side: joiners become companion mages ----------
const _lanAllyIn=allyInput;allyInput=function(q){if(q.ctrl.startsWith('net')){const i=NET_IN[q.ctrl]||{mx:0,my:0,dash:false};const m=Math.hypot(i.mx,i.my);return m>1?{mx:i.mx/m,my:i.my/m,dash:i.dash}:i}return _lanAllyIn(q)};
let NID=0;const _lanSpawn=spawnEnemy;spawnEnemy=function(){const e=_lanSpawn.apply(this,arguments);if(e&&!e.nid)e.nid=++NID;return e};
function lanStart(){const ok=LAN.peers.filter(p=>p.ok);if(!ok.length){toast('No players connected yet');return}
  const keep=PARTY;PARTY=ok.map(p=>'net'+p.slot);const seed=Math.floor(Math.random()*1e9);window.RUN_SEED=seed;startRun();PARTY=keep;window.RUN_SEED=undefined;
  G.lan={role:'host',peers:[]};for(const p of ok)lanSend(p.dc,{k:'start',era:CURRENT_ERA,slot:p.slot,n:ok.length+1})}
const R1=v=>Math.round(v);
function snapshot(){const P=G.player,near=G.enemies.slice(0,220);
  return {k:'s',t:+G.t.toFixed(2),w:G.wave,kl:G.kills,lv:G.level,xp:G.xp,xn:G.xpNext,pz:!!G.paused,
    h:[R1(P.x),R1(P.y),R1(P.hp),R1(P.maxHp),+(P.face||0).toFixed(2),P.moving?1:0],
    a:G.allies.map(q=>[q.ctrl,R1(q.x),R1(q.y),R1(q.hp),R1(q.maxHp),+(q.face||0).toFixed(2),q.moving?1:0,q.down?1:0,+(q.rev||0).toFixed(1),q.shots.map(s=>[R1(s.x),R1(s.y)])]),
    e:near.map(e=>[e.nid,e.type,R1(e.x),R1(e.y),+(e.hp/e.maxHp).toFixed(3),e.flash>0?1:0]),
    c:G.creations.map(c=>[c.id,R1(c.x),R1(c.y),+(c.ang||0).toFixed(2),+(c.swing||0).toFixed(2),+Math.min(c.life/c.max,c.uses/c.maxUses).toFixed(2)]),
    s:G.shots.slice(0,80).map(s=>[s.id,R1(s.x),R1(s.y),+(s.rot||0).toFixed(2)]),
    o:G.orbs.slice(0,160).map(o=>[R1(o.x),R1(o.y),o.v,o.n||1]),ch:G.chests.map(c=>[R1(c.x),R1(c.y),c.boss?1:0])}}
let lanTick=0;
CAVE_TICK.push(dt=>{if(!G.lan||G.lan.role!=='host')return;if((lanTick++)%4)return;const m=JSON.stringify(snapshot());for(const p of LAN.peers)if(p.ok&&p.dc.readyState==='open'){try{p.dc.send(m)}catch(e){}}});
const _lanEnd=endRun;endRun=function(){if(G&&G.lan&&G.lan.role==='host'){const r={k:'end',t:G.t,victory:!!G.victory};for(const p of LAN.peers)lanSend(p.dc,r)}return _lanEnd.apply(this,arguments)};
// a paused host (level-up / chest) still streams so joiners see why the game is frozen
setInterval(()=>{if(G&&G.lan&&G.lan.role==='host'&&G.paused){const m=JSON.stringify(snapshot());for(const p of LAN.peers)if(p.ok)try{p.dc.send(m)}catch(e){}}},250);
// ---------- joiner side: puppet world driven by snapshots ----------
function clientMsg(m){
  if(m.k==='hello'){LAN.slot=m.slot;LAN.status='Connected as P'+(m.slot+1)+'. Waiting for the host to start…';lanRefresh();return}
  if(m.k==='start'){if(ERAS[m.era])CURRENT_ERA=m.era;const keep=PARTY;PARTY=[];startRun();PARTY=keep;G.netClient=true;G.lan={role:'client',slot:m.slot,peers:[]};G.allies=[];G.enemies=[];G.orbs=[];G.chests=[];G.creations=[];G.shots=[];
    G.puppets=new Map();document.body.classList.add('netc');toast('Joined the host run');return}
  if(!G||!G.netClient)return;
  if(m.k==='end'){G.netClient=false;G.t=m.t;G.victory=m.victory;G.dead=false;try{endRun()}catch(e){home()}return}
  if(m.k==='em'&&window.lanEmoteClient){lanEmoteClient(m);return}
  if(m.k==='s')applySnap(m)}
function applySnap(m){G.t=m.t;G.wave=m.w;G.kills=m.kl;G.level=m.lv;G.xp=m.xp;G.xpNext=m.xn;G.hostPaused=m.pz;
  const P=G.player,mine=m.a.find(a=>a[0]==='net'+G.lan.slot);
  const others=[{n:2,x:m.h[0],y:m.h[1],hp:m.h[2],maxHp:m.h[3],face:m.h[4],moving:!!m.h[5],down:false,rev:0,shots:[],invul:0,host:true}];
  for(const a of m.a)if(a!==mine)others.push({n:2+others.length,x:a[1],y:a[2],hp:a[3],maxHp:a[4],face:a[5],moving:!!a[6],down:!!a[7],rev:a[8],shots:a[9].map(s=>({x:s[0],y:s[1]})),invul:0});
  // keep previous puppet positions so they glide instead of teleporting
  const prev=G.allies;others.forEach((q,i)=>{const o=prev[i];q.tx=q.x;q.ty=q.y;if(o&&Math.hypot(o.x-q.x,o.y-q.y)<200){q.x=o.x;q.y=o.y}});G.allies=others;G.lan.peers=others;
  if(mine){P.tx=mine[1];P.ty=mine[2];if(Math.hypot(P.x-P.tx,P.y-P.ty)>200){P.x=P.tx;P.y=P.ty}P.hp=mine[3];P.maxHp=mine[4];P.face=mine[5];P.moving=!!mine[6];P.down=!!mine[7];P.rev=mine[8];P.myShots=mine[9]}
  const seen=new Set();const list=[];for(const r of m.e){let e=G.puppets.get(r[0]);const T=ENEMY_TYPES[r[1]];if(!T)continue;
    if(!e){e={nid:r[0],type:r[1],T,x:r[2],y:r[3],r:T.r*(EN_SCALE[r[1]]||1),wob:r[0]%6,st:'move',maxHp:1};G.puppets.set(r[0],e)}
    e.tx=r[2];e.ty=r[3];e.hp=r[4];e.flash=r[5]?.08:0;seen.add(r[0]);list.push(e)}
  for(const k of [...G.puppets.keys()])if(!seen.has(k))G.puppets.delete(k);G.enemies=list;
  G.creations=m.c.map(c=>CREATIONS[c[0]]?{id:c[0],def:CREATIONS[c[0]],x:c[1],y:c[2],ang:c[3],swing:c[4],life:c[5],max:1,uses:1,maxUses:1}:null).filter(Boolean);
  G.shots=m.s.map(s=>CREATIONS[s[0]]?{id:s[0],def:CREATIONS[s[0]],x:s[1],y:s[2],rot:s[3]}:null).filter(Boolean);
  G.orbs=m.o.map(o=>({x:o[0],y:o[1],v:o[2],n:o[3],t:0}));G.chests=m.ch.map(c=>({x:c[0],y:c[1],boss:!!c[2]}))}
let clientSendT=0,dashReq=false;
const _lanDash=tryDash;tryDash=function(){if(G&&G.netClient){dashReq=true;return}return _lanDash.apply(this,arguments)};
const _lanStep=step;step=function(dt,realDt){if(!G||!G.netClient){document.body.classList.remove('netc');return _lanStep(dt,realDt)}
  const P=G.player,k=Math.min(1,dt*14);G.drawing=null;
  if(P.tx!=null){P.x+=(P.tx-P.x)*k;P.y+=(P.ty-P.y)*k}for(const q of G.allies)if(q.tx!=null){q.x+=(q.tx-q.x)*k;q.y+=(q.ty-q.y)*k}for(const e of G.enemies)if(e.tx!=null){e.x+=(e.tx-e.x)*k;e.y+=(e.ty-e.y)*k}
  for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];f.life-=dt;f.x+=(f.vx||0)*dt;f.y+=(f.vy||0)*dt;if(f.life<=0)G.fx.splice(i,1)}
  for(let i=G.texts.length-1;i>=0;i--){const t=G.texts[i];t.life-=dt;t.y-=30*dt;if(t.life<=0)G.texts.splice(i,1)}
  G.shake=0;try{updateHud()}catch(e){}
  if((clientSendT+=realDt)>=.05){clientSendT=0;let mx=0,my=0;if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;
    if(stick.active){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.hypot(dx,dy);if(d>6){const kk=Math.min(1,d/55);mx=dx/d*kk;my=dy/d*kk}}
    lanSend(LAN.host&&LAN.host.dc,{k:'in',mx:+mx.toFixed(2),my:+my.toFixed(2),dash:dashReq});dashReq=false}
  if(P.down&&Math.floor(G.t*2)%2===0)floatText(P.x,P.y-40,'DOWN: a teammate must revive you','#ff6b6b',.5,8);
  if(G.hostPaused&&Math.floor(G.t*4)%8===0&&!G.texts.some(t=>t.txt==='HOST IS CHOOSING'))floatText(P.x,P.y-60,'HOST IS CHOOSING','#ffd34a',.6,10)};
// my sketch bolts (simulated on host) are drawn from the snapshot
const _lanRP=renderPickups;renderPickups=function(){_lanRP();if(G&&G.netClient&&G.player.myShots){bx.fillStyle='#ff9a3c';for(const s of G.player.myShots)bx.fillRect(X(s[0])-1,Y(s[1])-1,3,3)}};
// ---------- lobby page ----------
function qrImg(code){try{const q=qrcode(0,'L');q.addData(code);q.make();return `<img class="qr" src="${q.createDataURL(4,8)}" alt="QR code">`}catch(e){return '<p class="sh">(code too long for a QR; use copy/paste)</p>'}}
async function scanQR(onCode){if(!('BarcodeDetector' in window)){toast('QR scanning is not supported in this browser: paste the code instead');return}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){toast('Camera unavailable: paste the code instead');return}
  const v=document.createElement('video');v.className='scan';v.setAttribute('playsinline','');v.muted=true;v.srcObject=stream;const host=$('scanBox');host.innerHTML='';host.appendChild(v);await v.play();
  const det=new BarcodeDetector({formats:['qr_code']});let done=false;const stop=()=>{done=true;stream.getTracks().forEach(t=>t.stop());host.innerHTML=''};
  const loop=async()=>{if(done)return;try{const r=await det.detect(v);if(r[0]&&r[0].rawValue.startsWith(LAN_VER)){stop();onCode(r[0].rawValue);return}}catch(e){}requestAnimationFrame(loop)};loop();setTimeout(()=>{if(!done){stop();toast('Scan timed out')}},45000)}
function copyCode(t){try{navigator.clipboard.writeText(t);toast('Code copied')}catch(e){toast('Select the code and copy it')}}
let lanView='menu',lanPeer=null,lanAnswer='';
function lanRefresh(){if(location.hash==='#/lan')lanPage()}
function lanPage(){leaveRun();setRoute('lan');const ok=LAN.peers.filter(p=>p.ok);let body='';
  if(lanView==='menu')body=`<p class="sh">Play on separate phones/tablets/computers on the same Wi-Fi or hotspot. No internet needed once the game is installed or cached. The host draws weapons; joiners are companion mages.</p>
    <nav class="menu"><button id="lanHost"><b>01</b>Host a game<span>show an invite</span><i>&rarr;</i></button><button id="lanJoin"><b>02</b>Join a game<span>scan or paste the host invite</span><i>&rarr;</i></button></nav>`;
  if(lanView==='host')body=`<div class="split"><div><div class="lab rule">Players</div><div class="li"><span class="nm">P1 (you, host)</span></div>${LAN.peers.map(p=>`<div class="li"><span class="nm">${p.name}</span><span class="sh">${p.ok?'connected':p.gone?'left':'waiting for answer'}</span></div>`).join('')}
      <nav class="menu"><button id="lanInvite"><b>+</b>Invite a player<span>${LAN.peers.length}/3</span><i>&rarr;</i></button><button id="lanStart"><b>&#9654;</b>Start run<span>${ok.length+1} players &middot; ${ERAS[save.era]?ERAS[save.era].name:''}</span><i>&rarr;</i></button></nav></div>
    <aside class="pane">${lanPeer&&!lanPeer.ok?`<div class="lab rule">1. Joiner scans or pastes this invite</div>${qrImg(lanPeer.offer)}<textarea id="lanOffer" readonly rows="3">${lanPeer.offer}</textarea><button class="btn" id="lanCopy">Copy invite</button>
      <div class="lab rule">2. Paste or scan their answer</div><textarea id="lanAns" rows="3" placeholder="EDL1~A~..."></textarea><div class="row"><button class="btn pri" id="lanConnect">Connect</button><button class="btn" id="lanScanA">Scan answer QR</button></div><div id="scanBox"></div>`:'<p class="sh">Invite players one at a time. Each gets their own code.</p>'}</aside></div>`;
  if(lanView==='join')body=`<div class="split"><div>${lanAnswer?`<div class="lab rule">2. Show this answer to the host</div>${qrImg(lanAnswer)}<textarea readonly rows="3" id="lanMyAns">${lanAnswer}</textarea><button class="btn" id="lanCopyA">Copy answer</button><p class="sh" id="lanStatus">${LAN.status||'Waiting for the host to connect…'}</p>`
      :`<div class="lab rule">1. Scan or paste the host invite</div><textarea id="lanOff" rows="3" placeholder="EDL1~O~..."></textarea><div class="row"><button class="btn pri" id="lanMake">Create answer</button><button class="btn" id="lanScanO">Scan invite QR</button></div><div id="scanBox"></div>`}</div>
    <aside class="pane"><p class="sh">Both devices must be on the same network. Keep this page open until the host starts.</p></aside></div>`;
  show(sheet('LAN Play','19 &mdash; Separate devices, same Wi-Fi, offline',body));
  const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};
  on('lanHost',()=>{lanView='host';lanPage()});on('lanJoin',()=>{lanView='join';lanPage()});
  on('lanInvite',async()=>{try{lanPeer=await hostInvite();lanPage()}catch(e){toast('WebRTC unavailable: '+e.message)}});
  on('lanCopy',()=>copyCode(lanPeer.offer));on('lanCopyA',()=>copyCode(lanAnswer));
  on('lanConnect',async()=>{try{await hostAccept(lanPeer,$('lanAns').value);toast('Connecting…')}catch(e){toast(e.message)}});
  on('lanScanA',()=>scanQR(async c=>{try{await hostAccept(lanPeer,c);toast('Connecting…')}catch(e){toast(e.message)}}));
  const make=async c=>{try{lanAnswer=await joinWith(c);lanPage()}catch(e){toast(e.message)}};
  on('lanMake',()=>make($('lanOff').value));on('lanScanO',()=>scanQR(make));on('lanStart',lanStart);
  $('back').onclick=()=>{if(lanView!=='menu'&&!ok.length&&!lanAnswer){lanView='menu';lanPage()}else home()}}
hub('lan','LAN Play',lanPage);
