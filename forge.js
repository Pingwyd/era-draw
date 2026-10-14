'use strict';
// ================= EVOLUTIONS =================
// A weapon evolves when you've drawn it MASTERY times this run AND own the paired powerup at >= lv.
const MASTERY=8;
const EVOLUTIONS={
  club:  {id:'club_spiked', name:'Spiked Club', needs:'ink',   lv:2, mods:{dmg:1.7,knock:1.4,range:1.2}, glow:'#ffe08a'},
  spear: {id:'spear_seek',  name:'Seeking Spear',needs:'homing',lv:1, mods:{dmg:1.4,pierce:2.5,rate:.8}, glow:'#9fd2f2'},
  rock:  {id:'rock_boulder',name:'Boulder',     needs:'echo',  lv:1, mods:{dmg:1.6,aoe:1.6}, glow:'#d9c27a'},
  sling: {id:'sling_storm', name:'Storm Sling', needs:'quick', lv:2, mods:{rate:.55,dmg:1.3}, glow:'#9fd2f2'},
  dagger:{id:'dagger_fang', name:'Fang Dagger', needs:'swift', lv:2, mods:{dmg:1.6,orbitSpeed:1.4,range:1.3}, glow:'#e0504e'},
};
function makeVariant(baseId,id,name,mods,extra={}){
  const b=CREATIONS[baseId],d={...b,...extra,name,hidden:true,base:extra.base||id};
  for(const k in mods)if(typeof d[k]==='number')d[k]=d[k]*mods[k];
  CREATIONS[id]=d;return d;
}
function forgeSprite(id,fromId,glow){const src=SPR[fromId].r;SPR[id]=set(outline(src,'#1a0f0e',glow));ICON[id]=iconURL(SPR[id].r,3)}
function initForge(){
  for(const b in EVOLUTIONS){const ev=EVOLUTIONS[b];makeVariant(b,ev.id,ev.name,ev.mods,{base:b,evolved:true,proj:b});forgeSprite(ev.id,b,ev.glow)}
  for(const k in COMBOS){const c=COMBOS[k];makeVariant(c.from,c.id,c.name,c.mods,{...c.extra,base:c.id,fused:true,proj:c.proj||c.from});forgeSprite(c.id,c.from,c.glow)}
}
function evolvedFor(id){
  const ev=EVOLUTIONS[id];if(!ev)return id;
  if((G.drawCount[id]||0)>=MASTERY&&(G.picks[ev.needs]||0)>=ev.lv){
    if(!G.evolved[id]){G.evolved[id]=true;toast(CREATIONS[id].name+' evolved: '+ev.name);sfx('chest');haptic([30,30,60])}
    return ev.id}
  return id;
}
// ================= COMBO DRAWS =================
// Draw two different shapes within COMBO_WINDOW seconds => fused creation (consumes the first).
const COMBO_WINDOW=0.9;
const COMBOS={
  'rock+spear':{id:'spear_flame',name:'Flaming Spear',from:'spear',glow:'#ff4a2a',mods:{dmg:1.4},extra:{pierce:6,aoe:38,fire:true,kind:'ranged'}},
  'club+rock': {id:'club_quake', name:'Quake Club',   from:'club', glow:'#d9c27a',mods:{dmg:1.3,range:1.5,knock:1.8,rate:1.2},extra:{quake:true}},
  'club+spear':{id:'spear_halberd',name:'Halberd',    from:'club', glow:'#9fd2f2',mods:{dmg:1.5,range:1.6},extra:{kind:'melee',orbitSpeed:1.8}},
  'rock+sling':{id:'sling_scatter',name:'Scatter Sling',from:'sling',glow:'#ff9a3c',mods:{dmg:1.2},extra:{multishot:3}},
};
function comboFor(id){
  const L=G.lastDraw;if(!L||L.id===id||performance.now()-L.at>COMBO_WINDOW*1000)return null;
  const key=[L.id,id].sort().join('+');const c=COMBOS[key];if(!c)return null;
  if(!G.combosSeen[c.id]){G.combosSeen[c.id]=true;toast('Combo: '+c.name)}
  return c.id;
}
function resolveDraw(id){
  G.drawCount[id]=(G.drawCount[id]||0)+1;
  const combo=comboFor(id);G.lastDraw={id,at:performance.now()};
  if(combo){G.lastDraw=null;return combo}
  return evolvedFor(id);
}
