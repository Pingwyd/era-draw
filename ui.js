// ===== UI v2: Settings tabs, Privacy/Terms + Changelog pages, save export/import, recovery notice =====
const SET_TABS=[['game','Game'],['display','Display'],['controls','Controls'],['access','Access'],['privacy','Privacy'],['data','Data']];
const _uiSettings=settings;settings=function(inRun){_uiSettings(inRun);const sh=screenEl.querySelector('.sheet');if(!sh)return;
  const cols=sh.querySelector('.cols'),secs={};
  if(cols)for(const d of [...cols.children]){const h=d.querySelector('.lab.rule');const t=h?h.textContent.trim().toLowerCase():'';secs[t.indexOf('display')===0?'display':'game']=(secs[t.indexOf('display')===0?'display':'game']||[]).concat(d)}
  secs.access=[sh.querySelector('.menu.a11y')].filter(Boolean);secs.controls=[sh.querySelector('.menu.controls')].filter(Boolean);
  // privacy
  const pv=document.createElement('div');const cs=window.Consent&&Consent.get();
  pv.innerHTML=`<div class="lab rule">Privacy</div><nav class="menu"><button id="pvA" role="switch" aria-checked="${!!(cs&&cs.analytics)}"><b>AN</b>Analytics<span>${cs&&cs.analytics?'Allowed':'Off'}</span><i>&rarr;</i></button><button id="pvD" role="switch" aria-checked="${!!(cs&&cs.ads)}"><b>AD</b>Ads &amp; personalisation<span>${cs&&cs.ads?'Allowed':'Off'}</span><i>&rarr;</i></button><button id="pvP"><b>PP</b>Privacy policy &amp; terms<i>&rarr;</i></button></nav><p class="sh">No analytics or ad scripts are included today. If added later they only load after you allow them here or in the consent banner. ${cs?'Choice saved '+new Date(cs.ts).toLocaleDateString()+'.':'No choice made yet.'}</p>`;
  // data
  const dt=document.createElement('div');
  dt.innerHTML=`<div class="lab rule">Save data</div><nav class="menu"><button id="dExp"><b>EX</b>Export save<span>.json</span><i>&rarr;</i></button><button id="dImp"><b>IM</b>Import save<i>&rarr;</i></button><button id="dLog"><b>CL</b>Changelog<i>&rarr;</i></button></nav><input type="file" id="dFile" accept="application/json,.json" hidden aria-label="Choose a save file"><p class="sh">Your progress lives only in this browser (local storage). Export a backup before clearing site data or switching devices. Save format v${SAVE_VER}.</p>`;
  const gp=document.createElement('nav');gp.className='menu';if(isTouch)gp.innerHTML=`<button id="flBtn" role="switch" aria-checked="${save.flickDash!==false}"><b>FL</b>Flick joystick to dash<span>${save.flickDash!==false?'On':'Off'}</span><i>&rarr;</i></button><p class="sh">Snap the movement stick hard in one direction to dash that way. The dash button (right side) always works.</p>`;
  secs.game=(secs.game||[]).concat(gp);
  secs.privacy=[pv];secs.data=[dt];
  const tab=SET_TABS.some(t=>t[0]===save.setTab)?save.setTab:'game';
  const bar=document.createElement('div');bar.className='htabs stabs';bar.setAttribute('role','tablist');
  bar.innerHTML=SET_TABS.map(([k,n])=>`<button role="tab" data-st="${k}" aria-selected="${k===tab}" class="${k===tab?'on':''}">${n}</button>`).join('');
  const body=document.createElement('div');body.className='spanels';
  for(const [k] of SET_TABS){const p=document.createElement('div');p.className='spanel';p.dataset.sp=k;p.setAttribute('role','tabpanel');p.hidden=k!==tab;for(const el of secs[k]||[])p.appendChild(el);body.appendChild(p)}
  const h2=sh.querySelector('h2');(h2||sh.firstChild).after(bar);bar.after(body);if(cols&&!cols.children.length)cols.remove();
  bar.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{save.setTab=b.dataset.st;persist();bar.querySelectorAll('[data-st]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b)});body.querySelectorAll('.spanel').forEach(p=>p.hidden=p.dataset.sp!==b.dataset.st)});
  const tog=(id,c)=>{$(id).onclick=()=>{const cur=Consent.get()||{analytics:false,ads:false};cur[c]=!cur[c];const r=Consent.set(cur);if(r.revoked)toast('Saved. Reload the page to fully unload anything already loaded.');settings(inRun)}};
  if(window.Consent){tog('pvA','analytics');tog('pvD','ads')}
  if($('flBtn'))$('flBtn').onclick=()=>{save.flickDash=save.flickDash===false;persist();settings(inRun)};
  $('pvP').onclick=privacy;$('dLog').onclick=changelog;
  $('dExp').onclick=exportSave;$('dImp').onclick=()=>$('dFile').click();$('dFile').onchange=e=>importSave(e.target.files[0],inRun)};
function exportSave(){const t=JSON.stringify(save,null,1),name='era-draw-save-'+new Date().toISOString().slice(0,10)+'.json';
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Save exported')}catch(e){toast('Export failed on this browser')}}
function importSave(file,inRun){if(!file)return;const r=new FileReader();r.onerror=()=>toast('Could not read that file');
  r.onload=()=>{let o=null;try{o=JSON.parse(r.result)}catch(e){}
    if(!o||typeof o!=='object'||Array.isArray(o)||!('coins' in o)||!('owned' in o)){toast('That is not an Era Draw save');return}
    confirmBox('Import save?','This replaces all progress on this device with the file. Export your current save first if you want to keep it.','Import','Cancel',()=>{
      try{localStorage.setItem(SAVE_KEY+'.bak',JSON.stringify(save));localStorage.setItem(SAVE_KEY,JSON.stringify(migrateSave(o)));localStorage.removeItem('eradraw.run')}catch(e){}location.reload()},()=>settings(inRun))};
  r.readAsText(file)}
function docPage(route,title,num,html){leaveRun();setRoute(route);show(sheet(title,num,`<div class="doc" tabindex="0">${html}</div>`));$('back').onclick=()=>history.length>1?history.back():home()}
function privacy(){docPage('privacy','Privacy &amp; Terms','&mdash; Last updated 15 Oct 2026',`
<h3>The short version</h3><p>Era Draw is a game that runs entirely in your browser. There are no accounts, no servers that receive your data, and no analytics. Ads appear only if you allow them.</p>
<h3>What is stored, and where</h3><ul><li><b>Your save</b> (coins, unlocks, settings, achievements, stats) in your browser's local storage on this device, plus a rolling backup copy.</li><li><b>An in-progress run</b> so you can resume after closing the tab.</li><li><b>Your consent choice</b> for optional analytics and ads.</li><li><b>Offline files</b>: a service worker caches the game's own files so it works offline. It caches nothing personal.</li></ul>
<p>None of this leaves your device. Clearing site data for this page deletes it. You can export or import your save in Settings &rarr; Data.</p>
<h3>Network use</h3><p>The game loads only its own files from the site that serves it (GitHub Pages, which keeps standard server logs under GitHub's privacy statement). Fonts and libraries are bundled, not fetched from third parties. LAN Play links two devices directly with WebRTC on your local network: setup codes are exchanged by QR or copy-paste, and no relay or STUN server is used.</p>
<h3>Analytics and ads</h3><p>There is no analytics. <b>Ads</b> load only after you choose <b>Accept</b> (or turn on Ads under Customize or Settings &rarr; Privacy). If you reject or are offline, no ad code is loaded at all. Ads are shown only in menus, the pause screen and the results screen, never during play.</p>
${typeof adPrivacyHtml==='function'?adPrivacyHtml():''}
<h3>Feedback</h3><p>If you send feedback, we receive the category, your message, any contact you choose to add, and basic technical details: game version, era, browser, screen size and input type. Until online sending is set up, nothing is sent: you copy the text yourself or post it as a public GitHub issue (GitHub's terms apply there). Feedback queued while offline is kept on this device until it is sent.</p><h3>Children</h3><p>The game collects no personal information from anyone, including children.</p>
<h3>Terms</h3><ul><li>Era Draw is provided as is, without warranties. We are not liable for lost progress; please keep exports of saves you care about.</li><li>In-game coins and gems have no cash value and cannot be bought with real money today.</li><li>Do not use LAN Play or shared codes to harass other players.</li><li>The game, art and code are owned by their author. Do not redistribute modified copies as your own.</li></ul>
<h3>Contact</h3><p>Questions or requests: open an issue on the project's GitHub page.</p>`)}
const CHANGELOG=[
 ['15 Oct 2026','The big rework',['New build system: up to 5 Skills per run that level to 5, 30 stackable Mini power-ups, and timed power-ups that last a few seconds.','Enemies now arrive in rotating waves, with elite packs and special squads. New enemy traits: spitters, burrowers, exploders, leapers, shielded foes and chargers.','Mythic spells redrawn as paper talismans with new effects: Flamethrower, Thunder Call, Flame Wall, Frost Nova and Arcane Missiles.','Full controller and keyboard menu navigation, plus an optional controller drawing mode.','Lock onto a target by tapping it, with the right stick, or by cycling targets.','29 new achievements. You now claim rewards yourself.','New home screen and Settings tabs. Privacy controls, plus save export and import.']],
 ['15 Oct 2026','Run flow',['An era is cleared only at 10:00 with every era boss defeated.','Ending or quitting a run now asks you to confirm.','Fewer normal enemies while a boss is up. Magnets pull from a large radius instead of the whole map.','Healing toned down. Endless mode pays gems for extra minutes.']],
 ['Earlier','Foundations',['Bosses chase you down. Weapon balance pass, chests with jackpots, cosmetics, a gem store, challenges and emotes.','Slower, steadier levelling in every era.']],
];
function changelog(){docPage('changelog','Changelog','&mdash; What changed',CHANGELOG.map(([d,t,l])=>`<h3>${t} <small>${d}</small></h3><ul>${l.map(x=>`<li>${x}</li>`).join('')}</ul>`).join(''))}
hub('privacy','Privacy',privacy,{hidden:true});hub('changelog','Changelog',changelog,{hidden:true});
if(window.SAVE_RECOVERED)setTimeout(()=>toast(SAVE_RECOVERED==='backup'?'Your save was damaged, so we restored the last backup.':'Your save could not be read, so a fresh one was started. The damaged copy was kept.'),1500);
// global error state: tell the player once, keep the game usable
(function(){let shown=0;const onErr=()=>{const n=Date.now();if(n-shown<30000)return;shown=n;try{persist()}catch(e){}if(typeof toast==='function')toast('Something went wrong. Your progress is saved; reload if the game misbehaves.')};
  addEventListener('error',e=>{if(e&&e.filename&&e.filename.indexOf(location.origin)!==0)return;onErr()});addEventListener('unhandledrejection',onErr)})();
// ===== Loadout v2: era tabs, in-place updates (no re-render on hover/click, scroll is kept), sticky save =====
const LO_ERAS=[['stone','Stone'],['bronze','Bronze'],['iron','Iron'],['mythic','Mythic']];
loadout=function(){leaveRun();setRoute('loadout');const sel=save.loadout.slice();
  const ids=Object.keys(CREATIONS).filter(k=>!CREATIONS[k].hidden);
  const eraOf=id=>CREATIONS[id].era||'stone';const eras=LO_ERAS.filter(([e])=>ids.some(id=>eraOf(id)===e));
  let tab=loadout.tab&&eras.some(e=>e[0]===loadout.tab)?loadout.tab:eraOf(sel[0]||ids[0]),focus=sel[0]||ids[0];
  const cell=(id,i)=>{const d=CREATIONS[id],own=save.owned.includes(id),on=sel.includes(id);
    return `<button class="cell ${on?'on':''} ${own?'':'lock'}" data-id="${id}" aria-pressed="${on}" aria-label="${d.name}${own?'':', locked'}${on?', equipped':''}"><span class="cell-h"><b>${String(i+1).padStart(2,'0')}</b><i class="chk">${on?'&#9632; Equipped':''}</i></span><img src="${ICON[id]}" alt=""><span class="nm">${d.name}</span><span class="sh">Draw a ${d.shape}</span><span class="st">${own?wStats(d):'Locked &middot; '+d.cost+' coins'}</span></button>`};
  const pane=id=>detailPane(id,save.owned.includes(id)?'':`<p class="note">Unlock in the shop for ${CREATIONS[id].cost} coins.</p>`);
  show(sheet('Loadout',`02 &mdash; Choose up to ${save.slots} &middot; <span id="loN">${sel.length}</span> selected`,`<div class="htabs lotabs" role="tablist">${eras.map(([e,n])=>`<button role="tab" data-era="${e}" aria-selected="${e===tab}" class="${e===tab?'on':''}">${n} <small>${ids.filter(id=>eraOf(id)===e&&sel.includes(id)).length||''}</small></button>`).join('')}</div>
    <div class="split"><div class="lolist"><div class="tbl" id="loGrid" role="tabpanel"></div></div><div id="loPane">${pane(focus)}</div></div>
    <div class="losave"><span class="lab" id="loSel"></span><button id="ok" class="btn pri">Done &middot; saved</button></div>`));
  const grid=$('loGrid');
  const summary=()=>{$('loN').textContent=sel.length;$('loSel').textContent=sel.map(id=>CREATIONS[id].name).join(' · ')||'Nothing equipped';$('ok').disabled=!sel.length;
    screenEl.querySelectorAll('[data-era]').forEach(b=>{const n=ids.filter(id=>eraOf(id)===b.dataset.era&&sel.includes(id)).length;b.querySelector('small').textContent=n||''})};
  const setPane=id=>{if(focus===id)return;focus=id;$('loPane').innerHTML=pane(id)};
  const fill=()=>{grid.innerHTML=ids.filter(id=>eraOf(id)===tab).map(cell).join('');grid.scrollTop=0;if(typeof paint==='function')setTimeout(paint,0);
    grid.querySelectorAll('.cell').forEach(el=>{const id=el.dataset.id;
      el.onmouseenter=()=>setPane(id);el.onfocus=()=>setPane(id);
      el.onclick=()=>{setPane(id);if(!save.owned.includes(id)){toast('Unlock it in the shop');return}const i=sel.indexOf(id);let out=null;
        if(i>=0){if(sel.length===1){toast('Keep at least one weapon');return}sel.splice(i,1)}else{if(sel.length>=save.slots)out=sel.shift();sel.push(id)}
        save.loadout=sel.slice();persist();paint();if(out){toast('Replaced '+CREATIONS[out].name);const oc=grid.querySelector(`[data-id="${out}"]`);if(oc){oc.classList.remove('repl');void oc.offsetWidth;oc.classList.add('repl')}}
        el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');summary()}})};
  const paint=()=>grid.querySelectorAll('.cell').forEach(c=>{const on=sel.includes(c.dataset.id);c.classList.toggle('on',on);c.setAttribute('aria-pressed',on);c.querySelector('.chk').innerHTML=on?'&#9632; Equipped '+(sel.indexOf(c.dataset.id)+1):''});
  screenEl.querySelectorAll('[data-era]').forEach(b=>b.onclick=()=>{tab=loadout.tab=b.dataset.era;screenEl.querySelectorAll('[data-era]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b)});fill()});
  fill();paint();summary();
  $('ok').onclick=()=>{save.loadout=sel.slice();persist();home()};$('back').onclick=home};
// shop: hovering no longer rebuilds the page (it reset the scroll); swap the detail pane in place
const _uiShop=shop;shop=function(){_uiShop();screenEl.querySelectorAll('.li').forEach(el=>{const b=el.querySelector('.buy');if(!b)return;el.onmouseenter=()=>{const id=b.dataset.id;if(shop.focus===id)return;shop.focus=id;
  const f=SHOP.find(s=>s.id===id);const old=screenEl.querySelector('.split > .pane, .split > aside');if(f&&f.type==='creation'&&old){const t=document.createElement('div');t.innerHTML=detailPane(id);old.replaceWith(t.firstElementChild)}}})};
// ===== Mobile dash: dedicated button (shows charges) + optional joystick flick =====
if(isTouch){const db=document.createElement('button');db.id='dashBtn';db.setAttribute('aria-label','Dash');db.innerHTML='<b>DASH</b><span class="dc"></span>';$('hud').appendChild(db);
  const fire=e=>{e.preventDefault();e.stopPropagation();tryDash();db.classList.remove('hit');void db.offsetWidth;db.classList.add('hit')};
  db.addEventListener('pointerdown',fire);db.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
  setInterval(()=>{if(!G||!G.player||mode!=='run')return;const p=G.player,mx=p.dashMax||2,ch=p.dashCharges==null?mx:p.dashCharges;const h=Array.from({length:mx},(_,i)=>`<i class="${i<ch?'on':''}"></i>`).join('');const dc=db.querySelector('.dc');if(dc.innerHTML!==h)dc.innerHTML=h;db.classList.toggle('empty',ch<=0)},120);
  // flick: stick must travel >=60px from its origin within 110ms of leaving the 14px dead zone, once per touch
  let fl={id:null,t0:0,done:false};
  $('c').addEventListener('pointermove',e=>{if(save.flickDash===false||mode!=='run'||e.pointerId!==stick.id)return;const d=Math.hypot(stick.x-stick.ox,stick.y-stick.oy),now=performance.now();
    if(fl.id!==e.pointerId){fl={id:e.pointerId,t0:0,done:false}}if(fl.done)return;if(d>14&&!fl.t0)fl.t0=now;
    if(fl.t0&&d>=60){if(now-fl.t0<=110){fl.done=true;tryDash()}else fl.done=true}});}
// ===== Enemy readability: 1x sprites + light rim outside the dark outline =====
function enhSprite(c,k){const p=1,cw=Math.round(c.width*k),ch=Math.round(c.height*k),[o,x]=mk(cw+p*2,ch+p*2);
  const [s,sx]=mk(cw,ch);sx.drawImage(c,0,0,cw,ch);
  const [l,lx]=mk(s.width,s.height);lx.drawImage(s,0,0);lx.globalCompositeOperation='source-in';lx.fillStyle='rgba(255,240,214,.45)';lx.fillRect(0,0,l.width,l.height);
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])x.drawImage(l,p+dx,p+dy);x.drawImage(s,p,p);return o}
(function(){const done=new Set();for(const key in SPR.en){const st=SPR.en[key];if(!st||done.has(st))continue;done.add(st);const m=Math.max(st.w,st.h),k=1;
  const fix=f=>{for(const n of ['r','l'])if(f[n]&&f[n].width)f[n]=enhSprite(f[n],k);for(const n of ['wr','wl'])if(f[n]&&f[n].width)f[n]=enhW(f[n],k);f.w=f.r.width;f.h=f.r.height};
  if(st.frames)st.frames.forEach(fix);fix(st);if(k>1)st.big=true}})();
function enhW(c,k){const cw=Math.round(c.width*k),ch=Math.round(c.height*k),[s,sx]=mk(cw+2,ch+2);sx.drawImage(c,1,1,cw,ch);return s}
