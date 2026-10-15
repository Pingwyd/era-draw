// Save safety: populated save + settings survive a service-worker update + refresh (menu and mid-run); lost saves auto-recover from kept copies.
// Usage: serve a COPY of the repo at :8090 from /tmp/upd (the test rewrites its sw.js VERSION), then: node tests/save-update.test.js
const {chromium}=require('playwright-core');const fs=require('fs');const U=process.argv[2]||'http://localhost:8090/',SW=process.argv[3]||'/tmp/upd/sw.js';
const bump=()=>fs.writeFileSync(SW,fs.readFileSync(SW,'utf8').replace(/VERSION='[^']*'/,"VERSION='eradraw-T"+Date.now()+"'"));
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});const c=await b.newContext();const p=await c.newPage();const errs=[],o={};p.on('pageerror',e=>errs.push(e.message));
 const snap=()=>p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eradraw.save.v1')||'{}');return [s.coins,s.zoom,s.vol,s.runs].join()});const want='4321,1.3,0.25,17';
 await p.goto(U+'#/home');await p.waitForTimeout(1500);await p.evaluate(()=>{const s=EraDraw.save();s.tutDone=true;s.installDismissed=true;s.coins=4321;s.zoom=1.3;s.vol=.25;s.runs=17;persist()});await p.reload();await p.waitForTimeout(1500);
 const upd=async run=>{bump();if(run){await p.evaluate(()=>EraDraw.startRun());await p.waitForTimeout(400)}await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()));await p.waitForTimeout(3000);
  if(run){await p.evaluate(()=>togglePause());await p.waitForTimeout(1500)}const nav=p.waitForNavigation({timeout:8000}).catch(()=>{});await p.evaluate(()=>$('updGo').click()).catch(()=>{});await p.waitForTimeout(300);
  await p.evaluate(()=>{const y=document.getElementById('cfYes');if(y)y.click()}).catch(()=>{});await nav;await p.waitForTimeout(2000)};
 await upd(false);o.menu=await snap();await upd(true);o.run=await snap();o.mem=await p.evaluate(()=>EraDraw.save().coins);
 // recovery: main save replaced by a default one, rich backup kept
 await p.evaluate(()=>{const g=localStorage.getItem('eradraw.save.v1');localStorage.setItem('eradraw.save.v1.bak',g);localStorage.setItem('eradraw.save.v1',JSON.stringify({coins:0,runs:0,v:2}))});
 await p.evaluate(()=>{persist=function(){}});await p.reload();await p.waitForTimeout(1200);o.recBak=await p.evaluate(()=>[EraDraw.save().coins,window.SAVE_RECOVERED]);
 // corrupt main + no backup -> quarantined copy kept untouched
 await p.evaluate(()=>{persist=function(){};localStorage.removeItem('eradraw.save.v1.bak');localStorage.setItem('eradraw.save.v1','{bad json')});await p.reload();await p.waitForTimeout(1200);
 o.corruptKept=await p.evaluate(()=>localStorage.getItem('eradraw.save.v1.corrupt')==='{bad json');
 const ok=o.menu===want&&o.run===want&&o.mem===4321&&o.recBak[0]===4321&&o.corruptKept;console.log(JSON.stringify(o),JSON.stringify(errs),ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1)})();
