// End-to-end targeting: real Tab key, mouse click, touch taps (draw side + move side), gamepad R3 + right stick. Usage: node tests/targeting-e2e.test.js [baseUrl]
const {chromium}=require('playwright-core');const U=process.argv[2]||'http://localhost:8080/';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});const res={},errs=[];
 const setup=async(ctxOpt)=>{const c=await b.newContext(ctxOpt);const q=await c.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(U+'#/home');
  await q.evaluate(()=>{const s=EraDraw.save();s.tutDone=true;s.installDismissed=true;localStorage.setItem('eradraw.save.v1',JSON.stringify(s));localStorage.setItem('eradraw.consent',JSON.stringify({v:1,ads:false,analytics:false,ts:1}))});
  await q.reload();await q.waitForTimeout(500);await q.evaluate(()=>EraDraw.startRun());await q.waitForTimeout(400);
  await q.evaluate(()=>{const G=EraDraw.G;G.bossNext=[1e9,1e9];G.enemies.length=0;window._e=[];for(const [dx,dy] of [[70,-20],[110,-20],[-90,10]]){const e=spawnEnemy(G.era.swarm,1,{x:G.player.x+dx,y:G.player.y+dy});e.speed=0;e.hp=e.maxHp=1e6;_e.push(e)}});
  const at=i=>q.evaluate(i=>{const e=_e[i];return {x:X(e.x)*S,y:(Y(e.y)-5)*S}},i);const lock=()=>q.evaluate(()=>_e.indexOf(EraDraw.G.lock));return {c,q,at,lock}};
 {const {c,q,at,lock}=await setup({viewport:{width:1280,height:720}});await q.keyboard.press('Tab');res.tab=await lock();await q.keyboard.press('Tab');res.tab2=await lock();
  const p=await at(1);await q.mouse.click(p.x,p.y);res.click=await lock();
  res.marker=await q.evaluate(()=>new Promise(r=>{let n=0;const f=drawLootTop;drawLootTop=function(){n++;return f.apply(this,arguments)};setTimeout(()=>r(n),300)}));await c.close()}
 {const {c,q,at,lock}=await setup({viewport:{width:568,height:320},hasTouch:true,isMobile:true,deviceScaleFactor:2});let p=await at(1);await q.touchscreen.tap(p.x,p.y);await q.waitForTimeout(100);res.tapRight=await lock();
  p=await at(2);await q.touchscreen.tap(p.x,p.y);await q.waitForTimeout(100);res.tapLeft=await lock();
  // gamepad: R3 cycles, right stick picks by direction
  res.pad=await q.evaluate(async()=>{const st={ax:[0,0,0,0],b:{}};navigator.getGamepads=()=>[{id:'t',connected:true,mapping:'standard',axes:st.ax,buttons:Array.from({length:17},(_,i)=>({pressed:!!st.b[i],value:st.b[i]?1:0}))}];
   const w=ms=>new Promise(r=>setTimeout(r,ms));EraDraw.G.lock=null;await w(100);st.b[11]=1;await w(100);st.b[11]=0;await w(60);const r3=_e.indexOf(EraDraw.G.lock);
   st.ax=[0,0,-1,0];await w(300);st.ax=[0,0,0,0];await w(50);return {r3,stickLeft:_e.indexOf(EraDraw.G.lock)}});await c.close()}
 await b.close();const ok=res.tab>=0&&res.tab2>=0&&res.tab2!==res.tab&&res.click===1&&res.marker>5&&res.tapRight===1&&res.tapLeft===2&&res.pad.r3>=0&&res.pad.stickLeft===2;
 console.log(JSON.stringify(res),ok&&!errs.length?'[]':JSON.stringify(['FAIL',...errs]))})();
