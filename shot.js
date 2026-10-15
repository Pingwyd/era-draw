'use strict';
// ===== In-game screenshot: frame from just before pause, crisp upscale, small watermark; download / share / new-tab =====
let shotSnap=null;
function shotGrab(){try{const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;c.getContext('2d').drawImage(cv,0,0);shotSnap=c}catch(e){}}
(function(){const tp=togglePause;togglePause=function(){if(G&&!G.paused)shotGrab();else if(G&&$('resume'))setTimeout(()=>{if(G&&!G.paused)shotSnap=null},0);return tp.apply(this,arguments)};
  const pm=pauseMenu;pauseMenu=function(){if(!shotSnap)shotGrab();const r=pm.apply(this,arguments);
    const q=$('quit');if(q&&!$('shotB')){const b=document.createElement('button');b.id='shotB';b.innerHTML='<b>&#9673;</b>Screenshot<i>&rarr;</i>';b.onclick=()=>takeShot(true);q.parentNode.insertBefore(b,q)}return r};})();
function takeShot(fromPause){
  if(mode!=='run'&&!fromPause&&!shotSnap){toast('Screenshots work during a run');return}
  if(!fromPause&&!(G&&G.paused))shotGrab();const src=shotSnap||cv;if(!src||!src.width)return;
  const k=Math.max(1,Math.min(4,Math.ceil(1920/src.width))),o=document.createElement('canvas');o.width=src.width*k;o.height=src.height*k;
  const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(src,0,0,o.width,o.height);
  if(save.shotMark!==false){const fs=Math.max(14,Math.round(o.height/48)),era=(window.ERAS&&ERAS[CURRENT_ERA]&&ERAS[CURRENT_ERA].name)||'',t=G?fmt(G.t):'';
    x.font='bold '+fs+'px monospace';x.textAlign='right';x.textBaseline='bottom';const txt='ERA DRAW'+(era?' · '+era:'')+(t?' · '+t:'');
    x.globalAlpha=.55;x.fillStyle='#000';x.fillText(txt,o.width-fs*.6+2,o.height-fs*.5+2);x.globalAlpha=.85;x.fillStyle='#ffe9c4';x.fillText(txt,o.width-fs*.6,o.height-fs*.5);x.globalAlpha=1}
  const name='era-draw-'+new Date().toISOString().replace(/[:T]/g,'-').slice(0,19)+'.png';
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),saf=/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  const fallback=()=>{const u=o.toDataURL('image/png'),w=window.open();if(w){w.document.write('<title>'+name+'</title><img src="'+u+'" style="max-width:100%;image-rendering:pixelated">');toast('Screenshot opened — long-press to save')}else{const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Screenshot saved')}};
  const done=b=>{if(!b){fallback();return}
    if(ios||saf){try{const f=new File([b],name,{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Era Draw'}).then(()=>toast('Screenshot shared')).catch(e=>{if(!e||e.name!=='AbortError')fallback()});return}}catch(e){}fallback();return}
    const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Screenshot saved')};
  try{o.toBlob?o.toBlob(done,'image/png'):fallback()}catch(e){fallback()}}
window.takeShot=takeShot;
