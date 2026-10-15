// ===== Mythic spells v2: paper talismans with real spell behaviours =====
// Same drawing, durability (life + uses), melee/ranged caps, evolutions and combos as before;
// only what the creation DOES and how it LOOKS changes.
const SPELLS={
  arcblade:{sp:'flame',name:'Flamethrower',col:'#ff8a3a',g:['.......','..o.o..','..ooo..','.oOyOo.','.oyyyo.','..oyo..','.......'],lore:'A short line becomes a roaring jet of fire.'},
  lance:{sp:'bolt',name:'Thunder Call',col:'#fff0a0',g:['.......','...yy..','..yy...','.yyyy..','...yy..','..yy...','.......'],lore:'A long line pulls lightning down on your foes.'},
  emberorb:{sp:'wall',name:'Flame Wall',col:'#ff5a2a',g:['.......','.o.o.o.','.O.O.O.','.OoOoO.','.mOmOm.','.mmmmm.','.......'],lore:'A circle that unrolls into a wall of fire.'},
  frostfan:{sp:'nova',name:'Frost Nova',col:'#9fe0ff',g:['.......','.e.e.e.','..eee..','.eeEee.','..eee..','.e.e.e.','.......'],lore:'A V that bursts into a ring of killing frost.'},
  chainspark:{sp:'missile',name:'Arcane Missiles',col:'#e0b0ff',g:['.......','...u...','..uuu..','.u.u.u.','...u...','..u.u..','.......'],lore:'A zigzag that looses seeking bolts of arcana.'},
};
const SP_PAL={...PAL,e:'#9fe0ff',E:'#e8fbff',u:'#c48cff',m:'#c2301e'};
function spellOf(id){for(const b in SPELLS)if(id===b||id.indexOf(b+'_')===0)return b;return null}
const SPELL_SPR={};
for(const b in SPELLS){const S2=SPELLS[b];const paper=['wwwwwwwww','wWWWWWWWw'];const body=S2.g.map(r=>'w'+r.replace(/\./g,'w')+'w');
  const rows=['.wwwwwww.',...body,'wWWwWwWWw','.w.w.w.w.'];
  const c=outline(grid(rows,SP_PAL),'#1a0f0e',S2.col);SPELL_SPR[b]={r:c,w:c.width,h:c.height}}
for(const id in CREATIONS){const b=spellOf(id);if(!b||CREATIONS[id].era!=='mythic')continue;const d=CREATIONS[id];d.spell=SPELLS[b].sp;d.proj=undefined;
  if(id===b){d.name=SPELLS[b].name;SKETCH_LORE[b]=SPELLS[b].lore}ICON[id]=iconURL(SPELL_SPR[b].r,3)}
CREATIONS.lance.speed=undefined;
const isSpell=c=>c.def&&c.def.spell;
const spDmg=(c,k)=>c.def.dmg*(c.power||1)*G.player.dmgMul*creationDmgMul(c.def)*k;
function spTarget(x,y,r){return nearestEnemy(x,y,r)}
const _spUpd=updateCreations;updateCreations=function(dt){
  const all=G.creations,sp=all.filter(isSpell);if(!sp.length)return _spUpd(dt);
  G.creations=all.filter(c=>!isSpell(c));_spUpd(dt);const rest=G.creations;G.creations=all.filter(c=>rest.includes(c)||sp.includes(c));
  const p=G.player;
  sp.forEach((c,k)=>{c.life-=dt;c.cd-=dt;const def=c.def;c.ang+=dt*1.6;
    const tx=p.x+Math.cos(c.ang+k*2.1)*30,ty=p.y-26+Math.sin(c.ang+k*2.1)*10;c.x+=(tx-c.x)*Math.min(1,dt*6);c.y+=(ty-c.y)*Math.min(1,dt*6);
    SP_RUN[def.spell](c,dt,p);if(c.life<=0||c.uses<=0)breakCreation(c)})};

function G_spfx(){return G.spfx||(G.spfx=[])}
const SP_RUN={
  flame(c,dt,p){const R=c.def.range?c.def.range*1.5:120;const e=spTarget(p.x,p.y,R);c.fl=e?Math.atan2(e.y-p.y,e.x-p.x):null;
    if(e){for(let i=0;i<2;i++){const a=c.fl+rnd(-.42,.42),sp=rnd(160,240);G.fx.push({x:p.x+Math.cos(c.fl)*10,y:p.y-8+Math.sin(c.fl)*10,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:R/200,max:R/200,col:Math.random()<.5?'#ff7a2a':'#ffe08a',r:rnd(1.5,3)})}
      if(c.cd<=0){c.cd=c.def.rate;let n=0;for(const o of queryGrid(p.x,p.y,R+20)){if(n>=10)break;const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy);if(d>R+o.r)continue;let da=Math.atan2(dy,dx)-c.fl;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;
        if(Math.abs(da)<.5){hurtEnemy(o,spDmg(c,1.9),'aoe',c);o.burn={t:1.5,dps:Math.max(o.burn?o.burn.dps:0,spDmg(c,.12))};n++}}c.uses--}}},
  bolt(c,dt,p){if(c.cd>0)return;const e=spTarget(p.x,p.y,480);if(!e)return;c.cd=c.def.rate;c.uses--;const R=70*(c.def.aoe?1.2:1);
    G_spfx().push({k:'bolt',x:e.x,y:e.y,t:.3,m:.3,R,seed:Math.random()*99});for(const o of queryGrid(e.x,e.y,R+20))if(Math.hypot(o.x-e.x,o.y-e.y)<R+o.r)hurtEnemy(o,spDmg(c,o===e?1.7:1.15),'aoe',c);
    G.shake=Math.max(G.shake,3);sfx('hit')},
  wall(c,dt,p){if(c.cd>0)return;const e=spTarget(p.x,p.y,360);if(!e)return;c.cd=c.def.rate;c.uses--;const a=Math.atan2(e.y-p.y,e.x-p.x),d=Math.min(160,Math.hypot(e.x-p.x,e.y-p.y));
    G_spfx().push({k:'wall',x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,a:a+Math.PI/2,L:180*(c.def.aoe>110?1.3:1),t:3.5,m:3.5,tick:0,c})},
  nova(c,dt,p){if(c.cd>0)return;if(!spTarget(p.x,p.y,170))return;c.cd=c.def.rate*2;c.uses-=1;const R=150;G_spfx().push({k:'nova',x:p.x,y:p.y,t:.4,m:.4,R});
    for(const o of queryGrid(p.x,p.y,R+20))if(Math.hypot(o.x-p.x,o.y-p.y)<R+o.r)hurtEnemy(o,spDmg(c,2.3),'aoe',c);sfx('shatter')},
  missile(c,dt,p){if(c.cd>0)return;const e=spTarget(c.x,c.y,460);if(!e)return;c.cd=c.def.rate*2.5;c.uses-=2;
    for(let i=0;i<2;i++){const a=Math.atan2(e.y-c.y,e.x-c.x)+(i?.7:-.7);G_spfx().push({k:'mis',x:c.x,y:c.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,t:2,m:2,tg:e,c,dmg:spDmg(c,.9)})}},
};
CAVE_TICK.push(dt=>{const L=G.spfx;if(!L)return;for(let i=L.length-1;i>=0;i--){const f=L[i];f.t-=dt;
  if(f.k==='wall'){f.tick-=dt;if(f.tick<=0){f.tick=.4;const ux=Math.cos(f.a),uy=Math.sin(f.a);for(const o of queryGrid(f.x,f.y,f.L/2+20)){const dx=o.x-f.x,dy=o.y-f.y,al=dx*ux+dy*uy,pe=Math.abs(dx*-uy+dy*ux);
      if(Math.abs(al)<f.L/2&&pe<22+o.r)hurtEnemy(o,spDmg(f.c,1.0),'fire',f.c)}}
    if(Math.random()<.8){const s=rnd(-.5,.5)*f.L;G.fx.push({x:f.x+Math.cos(f.a)*s,y:f.y+Math.sin(f.a)*s,vx:rnd(-8,8),vy:rnd(-50,-20),life:.4,max:.4,col:Math.random()<.5?'#ff4a2a':'#ffe08a',r:rnd(1.5,3)})}}
  else if(f.k==='mis'){if(!f.tg||f.tg.hp<=0)f.tg=nearestEnemy(f.x,f.y,400);if(f.tg){const want=Math.atan2(f.tg.y-f.y,f.tg.x-f.x),sp=Math.hypot(f.vx,f.vy)+dt*300;let cur=Math.atan2(f.vy,f.vx),d=want-cur;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;cur+=Math.max(-1,Math.min(1,d))*7*dt;f.vx=Math.cos(cur)*Math.min(sp,520);f.vy=Math.sin(cur)*Math.min(sp,520)}
    f.x+=f.vx*dt;f.y+=f.vy*dt;G.fx.push({x:f.x,y:f.y,vx:0,vy:0,life:.18,max:.18,col:'#c48cff',r:1.6});
    if(f.tg&&Math.hypot(f.tg.x-f.x,f.tg.y-f.y)<f.tg.r+6){hurtEnemy(f.tg,f.dmg,'ranged',f.c);ring(f.x,f.y,14,'#e0b0ff');f.t=0}}
  if(f.t<=0)L.splice(i,1)}});
runHooks.push(G=>{G.spfx=[]});
const _spDraw=drawCreation;drawCreation=function(c){if(!isSpell(c))return _spDraw(c);const b=spellOf(c.id),s=SPELL_SPR[b];const frac=Math.min(c.life/c.max,c.uses/c.maxUses);
  if(frac<.25&&Math.floor(G.t*12)%2)return;const sx=X(c.x),sy=Y(c.y),bob=Math.round(Math.sin(G.t*4+c.ang)*1.5);
  bx.save();bx.translate(sx,sy+bob);bx.rotate(Math.sin(G.t*2+c.ang)*.15);bx.drawImage(s.r,-(s.w>>1),-(s.h>>1));bx.restore();
  bx.fillStyle='#1a0f0e';bx.fillRect(sx-5,sy+(s.h>>1)+2,11,3);bx.fillStyle=frac<.25?'#e0504e':SPELLS[b].col;bx.fillRect(sx-4,sy+(s.h>>1)+3,Math.round(9*frac),1)};
const _spRP=renderPickups;renderPickups=function(){_spRP();if(!G||!G.spfx)return;const K=(X(100)-X(0))/100;
  for(const f of G.spfx){const a=Math.max(0,f.t/f.m);
    if(f.k==='bolt'){const sx=X(f.x),sy=Y(f.y);bx.globalAlpha=a;bx.strokeStyle='#fff0a0';bx.lineWidth=2;bx.beginPath();let px=sx,py=sy-120;bx.moveTo(px,py);for(let i=1;i<=6;i++){px=sx+(i<6?Math.sin(f.seed+i*7)*8:0);py=sy-120+i*20;bx.lineTo(px,py)}bx.stroke();
      bx.strokeStyle='#ffffff';bx.lineWidth=1;bx.stroke();bx.globalAlpha=a*.35;bx.fillStyle='#fff0a0';bx.beginPath();bx.arc(sx,sy,f.R*K*(1.2-a*.2),0,6.283);bx.fill();bx.globalAlpha=1}
    else if(f.k==='wall'){const sx=X(f.x),sy=Y(f.y),hl=f.L/2*K;bx.save();bx.translate(sx,sy);bx.rotate(f.a);bx.globalAlpha=Math.min(1,f.t*2)*.55;bx.fillStyle='#c2301e';bx.fillRect(-hl,-5*K-2,hl*2,10*K+4);bx.globalAlpha=Math.min(1,f.t*2);bx.fillStyle='#ffb35c';
      for(let x=-hl;x<hl;x+=4){const h=3+((Math.sin(G.t*14+x)*.5+.5)*7|0);bx.fillRect(x|0,-h,2,h)}bx.restore();bx.globalAlpha=1}
    else if(f.k==='nova'){const r=f.R*K*(1-a*.9)+2;bx.globalAlpha=a;bx.strokeStyle='#e8fbff';bx.lineWidth=2;bx.beginPath();bx.arc(X(f.x),Y(f.y),r,0,6.283);bx.stroke();bx.strokeStyle='#9fe0ff';
      for(let i=0;i<12;i++){const q=i/12*6.283;bx.beginPath();bx.moveTo(X(f.x)+Math.cos(q)*r*.8,Y(f.y)+Math.sin(q)*r*.8);bx.lineTo(X(f.x)+Math.cos(q)*r*1.08,Y(f.y)+Math.sin(q)*r*1.08);bx.stroke()}bx.globalAlpha=a*.15;bx.fillStyle='#9fe0ff';bx.beginPath();bx.arc(X(f.x),Y(f.y),r,0,6.283);bx.fill();bx.globalAlpha=1}
    else if(f.k==='mis'){bx.fillStyle='#ffffff';bx.fillRect(X(f.x)-1,Y(f.y)-1,3,3);bx.fillStyle='#c48cff';bx.fillRect(X(f.x)-2,Y(f.y),1,1)}}};
