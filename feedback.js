// ===== Feedback: backend-agnostic submit (Google Form formResponse via no-cors), offline queue, copy / GitHub fallback =====
// Configure: set endpoint to https://docs.google.com/forms/d/e/<FORM_ID>/formResponse and the entry.<id> fields of the form.
const FEEDBACK_CONFIG={endpoint:'',entries:{category:'entry.0',message:'entry.1',contact:'entry.2',meta:'entry.3'},repo:'Pingwyd/era-draw'};
const FB_Q='eradraw.fbq',FB_CATS=[['bug','Bug'],['idea','Idea'],['balance','Balance'],['other','Other']];
let GAME_VER='';fetch('sw.js').then(r=>r.text()).then(t=>{const m=t.match(/VERSION='([^']*)'/);GAME_VER=m?m[1]:''}).catch(()=>{});
function fbMeta(){return {version:GAME_VER||'unknown',era:typeof CURRENT_ERA!=='undefined'?CURRENT_ERA:'',inRun:!!(typeof mode!=='undefined'&&mode==='run'&&G),t:G&&G.t?Math.round(G.t):0,
  ua:navigator.userAgent,screen:screen.width+'x'+screen.height+'@'+(devicePixelRatio||1),view:innerWidth+'x'+innerHeight,touch:typeof isTouch!=='undefined'&&isTouch,pad:document.body.classList.contains('pad'),lang:navigator.language}}
function fbText(f){return `[${f.category}] ${f.message}\n\nContact: ${f.contact||'none'}\n\n${Object.entries(f.meta).map(([k,v])=>k+': '+v).join('\n')}`}
function fbPost(f){const C=FEEDBACK_CONFIG,E=C.entries,b=new URLSearchParams();b.append(E.category,f.category);b.append(E.message,f.message);b.append(E.contact,f.contact||'');b.append(E.meta,JSON.stringify(f.meta));
  return fetch(C.endpoint,{method:'POST',mode:'no-cors',body:b})}
function fbQueue(){try{return JSON.parse(localStorage.getItem(FB_Q))||[]}catch(e){return []}}
function fbSetQ(q){try{localStorage.setItem(FB_Q,JSON.stringify(q.slice(-20)))}catch(e){}}
function fbFlush(){if(!FEEDBACK_CONFIG.endpoint||!navigator.onLine)return;const q=fbQueue();if(!q.length)return;const f=q[0];fbPost(f).then(()=>{fbSetQ(fbQueue().slice(1));fbFlush()}).catch(()=>{})}
addEventListener('online',fbFlush);setTimeout(fbFlush,4000);
function fbCopy(t){const done=()=>toast('Feedback copied');if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(()=>fbCopy2(t,done));else fbCopy2(t,done)}
function fbCopy2(t,done){const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(e){toast('Copy failed: select the text manually')}a.remove()}
function fbIssueUrl(f){const body=fbText(f).slice(0,1800);return `https://github.com/${FEEDBACK_CONFIG.repo}/issues/new?title=${encodeURIComponent('['+f.category+'] '+f.message.slice(0,60))}&body=${encodeURIComponent(body)}`}
function feedback(fromPause){const inRun=fromPause===true;if(!inRun){leaveRun();setRoute('feedback')}const meta=fbMeta(),cfg=!!FEEDBACK_CONFIG.endpoint;
  show(sheet('Feedback','&mdash; Bugs, ideas, balance',`<form id="fbF" class="fb" novalidate>
    <div class="fb-cats" role="radiogroup" aria-label="Category">${FB_CATS.map(([k,n],i)=>`<label><input type="radio" name="cat" value="${k}" ${i===0?'checked':''}><span>${n}</span></label>`).join('')}</div>
    <label class="fb-l" for="fbM">Message</label><textarea id="fbM" maxlength="2000" rows="4" required placeholder="What happened, or what would you change?"></textarea>
    <label class="fb-l" for="fbC">Contact (optional)</label><input id="fbC" maxlength="120" placeholder="Email or @handle, only if you want a reply">
    <details class="fb-d"><summary>Attached automatically</summary><pre>${Object.entries(meta).map(([k,v])=>k+': '+String(v).replace(/</g,'&lt;')).join('\n')}</pre></details>
    <div class="fb-b">${cfg?'<button type="submit" class="btn pri" id="fbSend">Send</button>':''}<button type="button" class="btn" id="fbCopy">Copy feedback</button><a class="btn" id="fbGh" target="_blank" rel="noopener" href="#">Open GitHub issue</a></div>
    <p class="sh">${cfg?'Sent anonymously to our feedback form. If you are offline it is queued and sent later.':'Online sending is not set up yet: copy your feedback or open a prefilled GitHub issue.'} See <a href="#/privacy">Privacy</a>.</p></form>`));
  const get=()=>({category:(screenEl.querySelector('input[name=cat]:checked')||{}).value||'other',message:$('fbM').value.trim(),contact:$('fbC').value.trim(),meta,ts:Date.now()});
  const need=()=>{const f=get();if(!f.message){toast('Write a message first');$('fbM').focus();return null}return f};
  $('fbCopy').onclick=()=>{const f=need();if(f)fbCopy(fbText(f))};
  $('fbGh').onclick=e=>{const f=need();if(!f){e.preventDefault();return}$('fbGh').href=fbIssueUrl(f)};
  $('fbF').onsubmit=e=>{e.preventDefault();const f=need();if(!f||!cfg)return;if(!navigator.onLine){fbSetQ(fbQueue().concat(f));toast('Offline: feedback queued');back();return}
    $('fbSend').disabled=true;fbPost(f).then(()=>{toast('Thanks! Feedback sent');back()}).catch(()=>{fbSetQ(fbQueue().concat(f));toast('Could not send: queued for later');back()})};
  const back=()=>inRun?pauseMenu():home();$('back').onclick=back}
hub('feedback','Feedback',feedback,{hidden:true});
// entry points: home footer, pause menu, Settings > Data
const _fbHome=home;home=function(){_fbHome.apply(this,arguments);const f=screenEl.querySelector('.hfoot');if(f&&!$('fbH')){const b=document.createElement('button');b.id='fbH';b.textContent='Feedback';b.onclick=()=>feedback();f.appendChild(b)}};
const _fbPause=pauseMenu;pauseMenu=function(){_fbPause.apply(this,arguments);const m=screenEl.querySelector('.menu');if(m&&$('quit')){const b=document.createElement('button');b.id='fbP';b.innerHTML='<b>&#9993;</b>Feedback<i>&rarr;</i>';$('quit').before(b);b.onclick=()=>feedback(true)}};
const _fbSet=settings;settings=function(inRun){_fbSet(inRun);const d=$('dLog');if(d&&!$('fbS')){const b=document.createElement('button');b.id='fbS';b.innerHTML='<b>FB</b>Send feedback<i>&rarr;</i>';d.after(b);b.onclick=()=>feedback(inRun===true)}};
