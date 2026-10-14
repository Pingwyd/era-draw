'use strict';
// ================= UPDATE: BOSSES =================
// Every era: bosses at 3:00, 5:00, 7:30 and 10:00 (final; beat it to clear). In endless (after the 10:00 clear) they return in rotation every 2:30, stronger each time.
const ONCE=1e9;
function bossTable(list){return [...list.map(([t,type])=>({t,type,every:ONCE})),...list.map(([t,type],i)=>({t:ERA_CLEAR_T+150*(i+1),type,every:600}))]}
// new boss sprites built from existing art (tinted / re-dressed) so they read as distinct silhouettes
function bigCanvas(src,k){const [c,x]=mk(Math.round(src.width*k),Math.round(src.height*k));x.imageSmoothingEnabled=false;x.drawImage(src,0,0,c.width,c.height);return c}
function bigSet(s,k){const fs=(s.frames||[s]).map(f=>({...f,r:bigCanvas(f.r,k),l:bigCanvas(f.l,k),wr:f.wr&&bigCanvas(f.wr,k),wl:f.wl&&bigCanvas(f.wl,k)}));return {...fs[0],frames:fs}}
SPR.en.ursa=tintSet(SPR.en.bear,'#3a2a55',.55);SPR.en.titan=tintSet(SPR.en.mammoth,'#1c1716',.65);
SPR.en.sphinx=tintSet(SPR.en.colossus,'#ffd27a',.35);SPR.en.raider=tintSet(SPR.en.minotaur,'#2a5fa8',.45);
SPR.en.prince=tintSet(SPR.en.knight,'#1c1716',.6);SPR.en.headsman=tintSet(SPR.en.warlord,'#5a0f12',.5);
for(const [k,m] of [['ursa',2],['titan',1.25],['sphinx',1.3],['raider',1.3],['prince',1.9],['headsman',1.35]])SPR.en[k]=bigSet(SPR.en[k],m);
Object.assign(EN_SCALE,{ursa:1,titan:1,sphinx:1,raider:1,prince:1.2,headsman:1});
Object.assign(ENEMY_TYPES,{
  ursa:{name:'Ursa Prime',title:'Mother of Caves',spr:'ursa',r:22,hp:2600,speed:44,dmg:30,xp:70,col:'#3a2a55',beh:'lunge',boss:true,mat:'hide',summon:{type:'bear',n:2,every:9},lore:'Where the cave bears come from.'},
  titan:{name:'Tar Titan',title:'Risen from the Pits',spr:'titan',r:26,hp:5200,speed:30,dmg:38,xp:120,col:'#1c1716',beh:'shaman',boss:true,mat:'bone',summon:{type:'blob',n:3,every:7},lore:'Every creature the tar ever swallowed, walking.'},
  raider:{name:'Shardana',title:'Chief of the Sea Peoples',spr:'raider',r:22,hp:3400,speed:52,dmg:34,xp:90,col:'#2a5fa8',beh:'charge',boss:true,mat:'bronze',summon:{type:'archer',n:3,every:8},lore:'Came from the sea. Burned everything. Left.'},
  sphinx:{name:'Akhet',title:'The Bronze Sphinx',spr:'sphinx',r:24,hp:6400,speed:34,dmg:40,xp:140,col:'#ffd27a',beh:'shaman',boss:true,mat:'bronze',armor:.8,lore:'Answer its riddle with ink.'},
  prince:{name:'The Black Prince',title:'Knight of No Banner',spr:'prince',r:20,hp:5000,speed:60,dmg:44,xp:130,col:'#1c1716',beh:'lunge',boss:true,mat:'iron',armor:.5,summon:{type:'knight',n:2,every:10},lore:'Never yielded, never spoke.'},
  headsman:{name:'Vorn',title:'The Headsman',spr:'headsman',r:24,hp:8200,speed:40,dmg:56,xp:180,col:'#5a0f12',beh:'charge',boss:true,mat:'iron',summon:{type:'xbow',n:3,every:8},lore:'The last thing many castles saw.'},
});
ERAS.stone.bosses=bossTable([[180,'mammoth'],[300,'shaman'],[450,'ursa'],[600,'titan']]);
ERAS.bronze.bosses=bossTable([[180,'minotaur'],[300,'colossus'],[450,'raider'],[600,'sphinx']]);
ERAS.iron.bosses=bossTable([[180,'warlord'],[300,'ram'],[450,'prince'],[600,'headsman']]);
// summoners
CAVE_TICK.push(dt=>{for(const e of G.enemies){const s=e.T.summon;if(!s)continue;e.sumT=(e.sumT==null?s.every*.6:e.sumT)-dt;
  if(e.sumT<=0){e.sumT=s.every;for(let i=0;i<s.n;i++){const a=Math.random()*6.283;spawnEnemy(s.type,1+G.t/600,{x:e.x+Math.cos(a)*40,y:e.y+Math.sin(a)*40})}ring(e.x,e.y,70,'#c48cff');floatText(e.x,e.y-60,'SUMMON','#c48cff',.8,12)}}});
