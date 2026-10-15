'use strict';
// ================= ERAS (data-driven) =================
// Each era: weapons (creations with era tag + shapeKey), enemy spawn table, bosses, horde events, ground art, music.
// To add an era (e.g. a future Mythic era with spells): add ERAS[id] + ERA_ORDER entry, its creations, enemies and sprites.
// `kind:'spell'` creations are reserved for Mythic: they would use the same draw->creation pipeline.
const SHAPE_KEY={club:'short',spear:'long',rock:'circle',sling:'v',dagger:'zig'};
for(const id in CREATIONS)if(!CREATIONS[id].shapeKey)CREATIONS[id].shapeKey=SHAPE_KEY[CREATIONS[id].base&&CREATIONS[CREATIONS[id].base]?CREATIONS[id].base:id]||SHAPE_KEY[id];
const ERA_CLEAR_T=600; // 10:00 + the final boss defeated clears the era and unlocks the next
Object.assign(ERAS.stone,{
  spawns:[{type:'insect',from:0,w:45},{type:'bird',from:30,w:23},{type:'saber',from:70,w:12},{type:'caveman',from:90,w:8},{type:'bear',from:120,w:7},{type:'rhino',from:150,w:5}],
  bosses:[{t:180,type:'mammoth',every:240},{t:300,type:'shaman',every:300}],
  swarm:'insect',flock:'bird',tile:'stone',decor:'stone',music:'stone',lore:'Tar pits, cave bears and the first sparks of ink.'});
Object.assign(ERAS.bronze,{date:'c. 2,000 BC',no:'II',enemyHp:1.5,enemyDmg:1.3,ink:'#ffd27a',
  spawns:[{type:'hound',from:0,w:40},{type:'hoplite',from:20,w:18},{type:'archer',from:50,w:12},{type:'chariot',from:100,w:6},{type:'bull',from:140,w:6}],
  bosses:[{t:180,type:'minotaur',every:240},{t:300,type:'colossus',every:300}],
  swarm:'hound',flock:'hound',tile:'bronze',decor:'bronze',music:'bronze',lore:'Sun-baked citadels. Shields of bronze, spears in phalanx.'});
Object.assign(ERAS.iron,{date:'c. 800 BC',no:'III',locked:true,lore:'Coming soon.'});

// ---- Bronze Age creations (same shapes, stronger, more durable) ----
Object.assign(CREATIONS,{
  sword:  { name:'Bronze Sword', era:'bronze', shape:'short line', shapeKey:'short', kind:'melee', dmg:25, life:9, uses:36, rate:0.45, range:76, knock:220, cost:300 },
  javelin:{ name:'Javelin', era:'bronze', shape:'long line', shapeKey:'long', kind:'ranged', dmg:21, life:10, uses:16, rate:0.7, speed:700, pierce:5, proj:'spear', cost:350 },
  discus: { name:'Discus', era:'bronze', shape:'circle', shapeKey:'circle', kind:'ranged', dmg:28, life:10, uses:12, rate:1.0, speed:460, aoe:80, proj:'rock', cost:350 },
});
SHOP.splice(2,0,{id:'sword',type:'creation',cost:300,cur:'coins',era:'bronze'},{id:'javelin',type:'creation',cost:350,cur:'coins',era:'bronze'},{id:'discus',type:'creation',cost:350,cur:'coins',era:'bronze'});
// pick which loadout creation answers a recognised shape: prefer current-era weapons
function creationForShape(stoneId){
  const key=SHAPE_KEY[stoneId];const opts=G.loadout.filter(id=>CREATIONS[id].shapeKey===key);
  if(!opts.length)return null;opts.sort((a,b)=>(CREATIONS[b].era===CURRENT_ERA)-(CREATIONS[a].era===CURRENT_ERA));return opts[0];
}
// ---- Bronze sprites ----
SPR.sword=set(outline(grid(['..k..','.kyk.','.kak.','.kak.','.kak.','.kak.','.kak.','kAAAk','.kbk.','.kbk.','..k..']),'#1a0f0e','#ffd27a'));
SPR.javelin=set(outline(grid(['..k..','.kak.','kaAak','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kBk.','..k..']),'#1a0f0e','#ffd27a'));
SPR.discus=set(outline(grid(['..kkkk..','.kaaaAk.','kaayaaAk','kaaAAaAk','kaAAAaAk','kAaaaAAk','.kAAAAk.','..kkkk..']),'#1a0f0e','#ffd27a'));
for(const id of ['sword','javelin','discus'])ICON[id]=iconURL(SPR[id].r,3);
// ---- Bronze enemies ----
SPR.en.hound=enSet(LEG(['..........qq','.........qqqq','qq.qqqqqqqqqqi','.qqQqqqqqqqq.','..qqqqqqqqqq.'],['..q.q....q.q.','..q.q....q.q.'],['...qq.....qq..','...qq.....qq..']),.8);
SPR.en.hoplite=enSet(LEG(['...mmm....','..maaam...','..aaaaa...','..assas...','.AAAAAAa..','aaaAAAAAak','aAaAAAAAa.','aaa.AAAA..','.a..AAAA..'],['....s..s..','....s..s..','...ss.ss..'],['.....ss...','....s..s..','...ss..ss.']),.85);
SPR.en.archer=enSet(LEG(['...cccc...','..cssssc..','..csisis..','...ssss.b.','..MMMMMMb.','.sMMMMMb..','s.MMMM.b..','..MMMM....'],['..s..s....','..s..s....','.ss..ss...'],['...ss.....','..s..s....','.ss...ss..']),.85);
SPR.en.chariot=enSet(LEG(['........ss..','.......aMMa.','...cc..aMMa.','.ccccc.aaaa.','cccccccbbbbbb','.ccccc.b.aab.'],['..c.c.....kk','..c.c....k..k'],['...cc.....kk','...cc....k..k']),.85);
SPR.en.bull=enSet(LEG(['w..........w.','.w.......cw..','..cccccccccc.','.cccccccccicc','cccccccccccc.','cCcccccccccC.'],['.CC.C....C.CC','.CC.C....C.CC'],['..CCC....CCC.','..C.C....C.C.']),.8);
SPR.en.minotaur=enSet(LEG(['w.........w.','.w.cccccc.w.','..cccccccc..','..ccicicc...','...cccccc...','.aaccccccaa.','aaAAAAAAAAaa','a.AAAAAAAA.a','s.AAaAAaAA.s','..cccccccc..','..cc....cc..'],['..cc....cc..','.ccc....ccc.'],['...cc..cc...','..ccc..ccc..']));
SPR.en.colossus=enSet(LEG(['....aaaa....','...aaaaaa...','...ayaaya...','...aaaaaa...','..AAAAAAAA..','.aAAAAAAAAa.','aaAAyAAyAAaa','a.AAAAAAAA.a','a.AAAAAAAA.a','..AAA..AAA..'],['..AA....AA..','.AAA....AAA.'],['...AA..AA...','..AAA..AAA..']));
Object.assign(EN_SCALE,{hound:.8,hoplite:.85,archer:.85,chariot:.85,bull:.8,minotaur:1,colossus:1});
Object.assign(ENEMY_TYPES,{
  hound:   {name:'War Hound',spr:'hound',r:10,hp:16,speed:120,dmg:7,xp:1,col:'#7b5a44',beh:'chase',mat:'hide',lore:'Bred for the hunt, loosed on intruders.'},
  hoplite: {name:'Hoplite',spr:'hoplite',r:13,hp:70,speed:46,dmg:14,xp:3,col:'#d9c27a',beh:'chase',mat:'bronze',lore:'Shield first. Always shield first.'},
  archer:  {name:'Archer',spr:'archer',r:11,hp:28,speed:60,dmg:10,xp:2,col:'#8f2430',beh:'thrower',mat:'flint',lore:'Keeps its distance and fills the sky.'},
  chariot: {name:'War Chariot',spr:'chariot',r:16,hp:110,speed:58,dmg:20,xp:5,col:'#d9c27a',beh:'charge',elite:true,mat:'bronze',lore:'Wheels, hooves and very bad intentions.'},
  bull:    {name:'Bronze Bull',spr:'bull',r:15,hp:90,speed:50,dmg:18,xp:4,col:'#7b5a44',beh:'charge',mat:'hide',lore:'It does not stop for anyone.'},
  minotaur:{name:'Asterion',title:'Lord of the Labyrinth',spr:'minotaur',r:22,hp:1500,speed:40,dmg:32,xp:40,col:'#7b5a44',beh:'charge',boss:true,mat:'bronze'},
  colossus:{name:'Talos',title:'The Bronze Colossus',spr:'colossus',r:22,hp:2200,speed:34,dmg:26,xp:60,col:'#d9c27a',beh:'shaman',boss:true,mat:'bronze'},
});
// stone lore + materials
Object.assign(ENEMY_TYPES.insect,{mat:'bone',lore:'Gnats the size of fists. They come in clouds.'});
Object.assign(ENEMY_TYPES.bird,{mat:'bone',lore:'Flightless, furious, and faster than you.'});
Object.assign(ENEMY_TYPES.saber,{mat:'hide',lore:'Crouches, then strikes. Watch for the pause.'});
Object.assign(ENEMY_TYPES.caveman,{mat:'flint',lore:'A rival who learned to throw before you did.'});
Object.assign(ENEMY_TYPES.bear,{mat:'hide',lore:'Slow. Patient. Very hard to put down.'});
Object.assign(ENEMY_TYPES.rhino,{mat:'hide',lore:'Lowers its horn and charges in a straight line.'});
Object.assign(ENEMY_TYPES.mammoth,{mat:'bone',lore:'Oldest of the herd. The ground shakes when it charges.'});
Object.assign(ENEMY_TYPES.shaman,{mat:'flint',lore:'Speaks to the tar. The tar answers in swarms.'});
// ---- ground tiles per era ----
function makeTile(seed0,base,cols,blades){const N=64;const [c,x]=mk(N,N);let seed=seed0;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
  x.fillStyle=base;x.fillRect(0,0,N,N);for(let i=0;i<520;i++){x.fillStyle=cols[Math.floor(R()*cols.length)];x.fillRect(Math.floor(R()*N),Math.floor(R()*N),1+Math.floor(R()*2),1)}
  for(let i=0;i<40;i++){x.fillStyle=blades;const px=Math.floor(R()*N),py=Math.floor(R()*N);x.fillRect(px,py,1,2);x.fillRect(px+1,py+1,1,1)}return c}
SPR.tiles={stone:SPR.tile,bronze:makeTile(31,'#6b5434',['#75603d','#5f4a2d','#7d6942','#584428'],'#8a7448')};
SPR.decos={stone:SPR.deco,bronze:{
  rock1:outline(grid(['..ddd..','.ddwdD.','dddddDD','dDDDDDD']),'#2a201a'),
  rock2:outline(grid(['.dd.','dwdD','dDDD']),'#2a201a'),
  bones:outline(grid(['wwwww','.WwW.','.www.','.WwW.','.www.','.WwW.','wwwww']),'#2a201a'), // broken column
  skull:outline(grid(['.aa.','aAAa','aaAa','.aa.','.Aa.']),'#2a201a'), // amphora
  fern:grid(['....g....','..g.v.g..','.gvgvgvg.','..gvvvg..','...gbg...','....b....']), // olive shrub
  grass:grid(['.a..a.','.a.aA.','Aa.A.a','.AAA..']),flower:grid(['.m.','mym','.g.','.g.'])}};
SPR.dirts={stone:SPR.dirt,bronze:SPR.dirt};
