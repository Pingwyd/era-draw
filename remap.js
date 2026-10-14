'use strict';
// ================= CONTROLS REMAP (keyboard + gamepad) =================
// Press-to-bind; binding a key/button that another action uses swaps them; reset to defaults; persisted in the save.
const PAD_NAMES=['A','B','X','Y','LB','RB','LT','RT','Back','Start','L3','R3','D-up','D-down','D-left','D-right','Home'];
const PAD_DEFAULT={dash:0,cast1:2,cast2:3,cast3:1,cast4:5,pause:9};
const KEY_DEFAULT={up:'w',down:'s',left:'a',right:'d',dash:' ',pause:'p'};
const ACT_NAMES={up:'Move up',down:'Move down',left:'Move left',right:'Move right',dash:'Dash',pause:'Pause',cast1:'Cast slot 1',cast2:'Cast slot 2',cast3:'Cast slot 3',cast4:'Cast slot 4'};
if(!save.padMap)save.padMap={};if(!save.keyMap)save.keyMap={};
function padBinds(){return {...PAD_DEFAULT,...save.padMap}}
function keyBinds(){return {...KEY_DEFAULT,...save.keyMap}}
const keyLabel=k=>k===' '?'Space':k.length===1?k.toUpperCase():k[0].toUpperCase()+k.slice(1);
// keyboard: translate bound keys onto the game's canonical keys (w/a/s/d, Space, p). Arrow keys always work too.
const CANON={up:'w',down:'s',left:'a',right:'d'};
function keyAction(k){const m=keyBinds();for(const a in m)if(m[a]===k)return a;return null}
let BINDING=null;
addEventListener('keydown',e=>{if(BINDING)return;const k=e.key.length===1?e.key.toLowerCase():e.key;const a=keyAction(k);const isDefault=Object.values(KEY_DEFAULT).includes(k);
  if(!a){if(isDefault&&mode==='run'){e.stopImmediatePropagation();if(k===' ')e.preventDefault()}return}
  if(CANON[a]){e.stopImmediatePropagation();keys[CANON[a]]=true;return}
  if(a==='dash'&&k!==' '){e.stopImmediatePropagation();if(mode==='run'&&!e.repeat)tryDash();return}
  if(a==='pause'&&k!=='p'){e.stopImmediatePropagation();if(!e.repeat)dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return}},true);
addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;const a=keyAction(k);if(a&&CANON[a]){e.stopImmediatePropagation();keys[CANON[a]]=false}
  else if(!a&&Object.values(CANON).includes(k))e.stopImmediatePropagation()},true);
function bindSet(kind,act,val){const map=kind==='pad'?save.padMap:save.keyMap,cur=kind==='pad'?padBinds():keyBinds();
  const clash=Object.keys(cur).find(a=>a!==act&&cur[a]===val);if(clash){map[clash]=cur[act];toast(ACT_NAMES[clash]+' swapped to '+(kind==='pad'?PAD_NAMES[cur[act]]:keyLabel(cur[act])))}
  map[act]=val;persist()}
function controlsHtml(){const kb=keyBinds(),pb=padBinds();
  return `<div class="lab rule">Controls &mdash; tap a binding, then press a key or button</div><div class="binds">${Object.keys(ACT_NAMES).map(a=>`<div class="bind"><span class="nm">${ACT_NAMES[a]}</span>${a in KEY_DEFAULT?`<button data-bk="${a}">${keyLabel(kb[a])}</button>`:'<i>&mdash;</i>'}${a in PAD_DEFAULT?`<button data-bp="${a}">${PAD_NAMES[pb[a]]||'#'+pb[a]}</button>`:'<i>stick</i>'}</div>`).join('')}</div>
  <button id="bindReset" class="sk"><span class="nm">Reset controls to defaults</span></button><p class="sh">Keyboard and gamepad columns. Arrow keys always move. Menus: D-pad/stick, A select, B back.</p>`}
function wireControls(box){box.innerHTML=controlsHtml();
  box.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{const a=b.dataset.bk;b.textContent='Press a key…';BINDING=true;
    const h=e=>{e.preventDefault();e.stopImmediatePropagation();removeEventListener('keydown',h,true);BINDING=null;if(e.key==='Escape'){wireControls(box);return}
      bindSet('key',a,e.key.length===1?e.key.toLowerCase():e.key);wireControls(box)};addEventListener('keydown',h,true)});
  box.querySelectorAll('[data-bp]').forEach(b=>b.onclick=()=>{const a=b.dataset.bp;b.textContent='Press a button…';BINDING=true;const t0=performance.now();
    const base=(pads()[0]||{buttons:[]}).buttons.map(x=>x.pressed);
    const poll=()=>{if(!BINDING)return;const g=p1Pad();if(g){const i=g.buttons.findIndex((x,j)=>x.pressed&&!base[j]);if(i>=0){BINDING=null;bindSet('pad',a,i);wireControls(box);return}}
      if(performance.now()-t0>6000){BINDING=null;toast('No button pressed');wireControls(box);return}requestAnimationFrame(poll)};requestAnimationFrame(poll)});
  $('bindReset').onclick=()=>{save.padMap={};save.keyMap={};persist();toast('Controls reset');wireControls(box)}}
const _rmSettings=settings;settings=function(inRun){_rmSettings(inRun);const host=screenEl.querySelector('.sheet');if(!host)return;const box=document.createElement('nav');box.className='menu controls';host.appendChild(box);wireControls(box)};
