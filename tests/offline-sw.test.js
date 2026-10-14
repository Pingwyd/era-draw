// Loads once, then goes offline and reloads: the service worker must serve the whole game (incl. LAN page + QR lib). Usage: node tests/offline-sw.test.js
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});const c=await b.newContext();const p=await c.newPage();
 await p.goto('http://localhost:8080/#/home');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForTimeout(1500);await p.reload();await p.waitForTimeout(800);
 await c.setOffline(true);await p.reload();await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>({ok:typeof EraDraw==='object',lan:typeof lanPage,qr:typeof qrcode,ctl:!!navigator.serviceWorker.controller}));await p.goto('http://localhost:8080/#/lan');await p.waitForTimeout(500);r.lanPage=await p.textContent('h2');
 console.log(JSON.stringify(r));await b.close()})();
