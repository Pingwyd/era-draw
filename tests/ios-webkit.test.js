// iPod touch 7 (568x320 / 320x568, touch) WebKit smoke test: errors, 40px targets, level-up fit. Usage: node tests/ios-webkit.test.js
const {webkit}=require('playwright-core');
const UA='Mozilla/5.0 (iPod touch; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1';
(async()=>{const b=await webkit.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/webkit-2370/pw_run.sh'});
const out={};const errs=[];
for(const [w,h] of [[568,320],[320,568]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2,userAgent:UA});const p=await ctx.newPage();
 p.on('response',r=>r.status()>=400&&errs.push(w+': HTTP '+r.status()+' '+r.url()));p.on('pageerror',e=>errs.push(w+': '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(w+': '+m.text()));
 const sh=async n=>p.screenshot({path:`/workspace/era-draw/shots/ios-${n}-${w}x${h}.png`});
 await p.goto('http://localhost:8080/#/home');await p.waitForTimeout(1300);await sh('home');
 if(w<h){out.portrait=await p.evaluate(()=>!document.getElementById('rotate').classList.contains('hidden'));await ctx.close();continue}
 out.flags=await p.evaluate(()=>({ios:IS_IOS,small:SMALL_SCREEN,perf:EraDraw.save().perf,ui:EraDraw.save().uiScale,install:!!document.getElementById('install'),sw:'serviceWorker' in navigator}));
 // small targets audit on menu pages
 const audit=async n=>p.evaluate(()=>[...document.querySelectorAll('#screen button,#screen [data-m],#slots>*,#pauseBtn,.pick')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return {t:(b.id||b.textContent.trim()).slice(0,18),w:Math.round(r.width),h:Math.round(r.height),off:r.bottom>innerHeight+1&&!document.getElementById('screen').scrollHeight}}).filter(x=>x.h<40||x.w<40));
 out.homeSmall=await audit();
 for(const r of ['shop','loadout','upgrades','mages','settings','eras','daily','bestiary','achievements']){await p.goto('http://localhost:8080/#/'+r);await p.waitForTimeout(300);await sh(r);out[r]=(await audit()).map(x=>x.t+":"+x.w+"x"+x.h).join(",")}
 await p.evaluate(()=>{const s=EraDraw.save();s.tutDone=true});await p.goto('http://localhost:8080/#/home');await p.waitForTimeout(300);await p.evaluate(()=>{const i=document.getElementById('install');i&&document.getElementById('instX').click()});await p.tap('#play');await p.waitForTimeout(1500);await sh('run');
 out.runSmall=await audit();out.cap=await p.evaluate(()=>({S,BW,BH}));
 await p.evaluate(()=>levelUp());await p.waitForTimeout(300);await sh('levelup');out.lvSmall=await audit();
 out.lvFits=await p.evaluate(()=>[...document.querySelectorAll('.pick')].every(c=>c.getBoundingClientRect().bottom<=innerHeight));
 await p.tap('.pick');await p.waitForTimeout(200);await p.tap('#pauseBtn');await p.waitForTimeout(300);await sh('pause');
 await ctx.close()}
console.log(JSON.stringify(out),errs);await b.close()})();
