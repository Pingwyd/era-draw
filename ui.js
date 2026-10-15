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
<h3>The short version</h3><p>Era Draw is a game that runs entirely in your browser. There are no accounts, no servers that receive your data, and no tracking, analytics or ads today.</p>
<h3>What is stored, and where</h3><ul><li><b>Your save</b> (coins, unlocks, settings, achievements, stats) in your browser's local storage on this device, plus a rolling backup copy.</li><li><b>An in-progress run</b> so you can resume after closing the tab.</li><li><b>Your consent choice</b> for optional analytics and ads.</li><li><b>Offline files</b>: a service worker caches the game's own files so it works offline. It caches nothing personal.</li></ul>
<p>None of this leaves your device. Clearing site data for this page deletes it. You can export or import your save in Settings &rarr; Data.</p>
<h3>Network use</h3><p>The game loads only its own files from the site that serves it (GitHub Pages, which keeps standard server logs under GitHub's privacy statement). Fonts and libraries are bundled, not fetched from third parties. LAN Play links two devices directly with WebRTC on your local network: setup codes are exchanged by QR or copy-paste, and no relay or STUN server is used.</p>
<h3>Analytics and ads</h3><p>None are included right now. If they are added, they will only load after you choose <b>Accept</b> (or turn them on under <b>Customize</b> or Settings &rarr; Privacy), and this page will name the provider. You can withdraw consent at any time in Settings &rarr; Privacy.</p>
<h3>Children</h3><p>The game collects no personal information from anyone, including children.</p>
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
