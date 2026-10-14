// Two/three headless browser contexts connect over WebRTC (manual signalling), host starts, joiner input moves its mage, revive + end sync. Usage: node tests/lan-webrtc.test.js (server on :8080)
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--disable-features=WebRtcHideLocalIpsWithMdns']});
 const mk=async()=>{const c=await b.newContext({viewport:{width:900,height:520}});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.goto('http://localhost:8080/#/home');await p.evaluate(()=>{const s=EraDraw.save();s.tutDone=true;s.installDismissed=true;localStorage.setItem('eradraw.save.v1',JSON.stringify(s))});await p.reload();await p.waitForTimeout(300);return p};
 const H=await mk(),J=await mk(),J2=await mk();const out={};
 const pair=async(J)=>{await H.goto('http://localhost:8080/#/lan');await H.waitForTimeout(200);if(await H.$('#lanHost'))await H.click('#lanHost');await H.click('#lanInvite');await H.waitForSelector('#lanOffer',{timeout:8000});
  const offer=await H.inputValue('#lanOffer');await J.goto('http://localhost:8080/#/lan');await J.waitForTimeout(200);await J.click('#lanJoin');await J.fill('#lanOff',offer);await J.click('#lanMake');await J.waitForSelector('#lanMyAns',{timeout:8000});
  const ans=await J.inputValue('#lanMyAns');await H.fill('#lanAns',ans);await H.click('#lanConnect');await J.waitForFunction(()=>LAN.slot>0,null,{timeout:10000});return [offer.length,ans.length]};
 out.len1=await pair(J);await H.screenshot({path:'/workspace/era-draw/shots/lan-host-lobby.png'});out.len2=await pair(J2);await J2.screenshot({path:'/workspace/era-draw/shots/lan-join.png'});
 await H.waitForTimeout(300);await H.goto('http://localhost:8080/#/lan');await H.waitForTimeout(200);await H.click('#lanStart');await H.waitForTimeout(800);
 out.host=await H.evaluate(()=>({allies:EraDraw.G.allies.map(a=>a.ctrl),party:EraDraw.G.party}));
 await J.keyboard.down('d');await J.waitForTimeout(1500);await J.keyboard.up('d');
 out.client=await J.evaluate(()=>({net:EraDraw.G.netClient,enemies:EraDraw.G.enemies.length,allies:EraDraw.G.allies.length,t:EraDraw.G.t,me:[Math.round(EraDraw.G.player.x)]}));
 out.hostSees=await H.evaluate(()=>EraDraw.G.allies.map(a=>Math.round(a.x-EraDraw.G.player.x)));
 await J.screenshot({path:'/workspace/era-draw/shots/lan-client-run.png'});await H.screenshot({path:'/workspace/era-draw/shots/lan-host-run.png'});
 // down + revive path on host
 out.revive=await H.evaluate(async()=>{const G=EraDraw.G,q=G.allies[0];damageAlly(q,999);const d=q.down;q.x=G.player.x+10;q.y=G.player.y;await new Promise(r=>setTimeout(r,3200));return [d,q.down]});
 await H.evaluate(()=>{EraDraw.G.player.hp=0;EraDraw.G.dead=true});await H.waitForTimeout(800);out.clientEnd=await J.evaluate(()=>mode);
 out.errs=[H.errs,J.errs,J2.errs];console.log(JSON.stringify(out));await b.close()})();
