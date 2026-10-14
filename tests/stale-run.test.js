// Regression: a new run after death must be fresh and the game loop alive. Usage: node tests/stale-run.test.js [baseURL]
const {chromium}=require(process.env.PW||'playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,120)));
const base=process.argv[2]||'http://localhost:8080/';
await p.goto(base+'#/home');await p.evaluate(()=>{const s=EraDraw.save();s.tutDone=true;localStorage.setItem('eradraw.save.v1',JSON.stringify(s))});await p.reload();await p.waitForTimeout(300);
await p.evaluate(()=>{window.__f=0;const f=()=>{window.__f++;requestAnimationFrame(f)};f()});
const st=()=>p.evaluate(()=>({mode:EraDraw.mode,t:EraDraw.G?+EraDraw.G.t.toFixed(1):null,hp:EraDraw.G?Math.round(EraDraw.G.player.hp):null,hash:location.hash,saved:!!sessionStorage.getItem('eradraw.run.v1'),scr:!!document.getElementById('screen').innerHTML,hud:document.querySelector('#hud .time,#time')?.textContent}));
const kill=async()=>{await p.waitForTimeout(1500);await p.evaluate(()=>{const G=EraDraw.G;G.player.secondWind=true;G.player.usedWind=false;G.player.hp=1;G.player.invul=0;for(const e of G.enemies){e.x=G.player.x+2;e.y=G.player.y}});
 for(let i=0;i<40;i++){await p.waitForTimeout(100);const m=await p.evaluate(()=>{const G=EraDraw.G;if(G&&G.player.invul<=0&&G.player.hp<=1){G.player.invul=0;for(const e of G.enemies){e.x=G.player.x+2;e.y=G.player.y}}return EraDraw.mode});if(m!=='run')break}};
// time-advancing check on the game itself
const alive=async()=>{const a=await p.evaluate(()=>EraDraw.G&&EraDraw.G.t);await p.waitForTimeout(600);const c=await p.evaluate(()=>EraDraw.G&&EraDraw.G.t);return c>a};
const R={};let ok=true;const chk=async(n,fn)=>{await fn();await p.waitForTimeout(700);const s=await st();const al=await alive();R[n]={...s,advancing:al};console.log(n,JSON.stringify(R[n]));if(!(s.mode==='run'&&s.t<4&&s.hp>1&&(n==='refreshPlay'?s.scr:(al&&!s.scr))))ok=false};
await p.evaluate(()=>EraDraw.startRun());await kill();R.death=await st();
await chk('drawAgain',()=>p.click('#retry'));
await kill();await chk('homePlay',async()=>{await p.click('#hm');await p.waitForTimeout(200);await p.click('#play')});
await kill();await chk('escThenPlay',async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(200);await p.click('#play')});
await kill();await chk('hashPlay',async()=>{await p.evaluate(()=>{location.hash='#/play'})});
await kill();await chk('eras',async()=>{await p.goto(base+'#/eras');await p.waitForTimeout(200);await p.click('[data-era=stone]');await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.waitForTimeout(200);await p.click('#play')});
await kill();await chk('daily',async()=>{await p.goto(base+'#/daily');await p.waitForTimeout(200);await p.click('#dgo')});
await chk('giveUpThenPlay',async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(150);await p.click('#quit');await p.waitForTimeout(200);await p.click('#retry')});
await kill();await chk('refreshPlay',async()=>{await p.goto(base+'#/play');await p.reload()});
console.log(JSON.stringify(R,null,0));console.log(ok?'PASS':'FAIL',errs);await b.close();process.exit(ok?0:1)})();
