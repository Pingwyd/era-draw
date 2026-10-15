'use strict';
// ================= UPDATE: IRON AGE (third era) =================
Object.assign(PAL,{z:'#aab3bd',Z:'#5d646e',p:'#b8382f',P:'#6e1d1a',l:'#6b4a30',L:'#43301f'});
delete ERAS.iron.locked;
Object.assign(ERAS.iron,{date:'c. 800 BC',no:'III',ink:'#b8d0ff',enemyHp:2.2,enemyDmg:1.7,
  spawns:[{type:'militia',from:0,w:40},{type:'knight',from:25,w:14},{type:'xbow',from:45,w:12},{type:'warhorse',from:90,w:6},{type:'catapult',from:120,w:4}],
  bosses:[{t:180,type:'warlord',every:240},{t:300,type:'ram',every:300}],
  swarm:'militia',flock:'militia',tile:'iron',decor:'iron',music:'iron',lore:'Siege lines before a burning castle. Steel, pitch and stubborn men.'});
// ---- iron weapons ----
Object.assign(CREATIONS,{
  longsword:{name:'Iron Longsword',era:'iron',shape:'short line',shapeKey:'short',kind:'melee',dmg:34,life:10,uses:44,rate:.42,range:84,knock:240,cost:600},
  crossbow:{name:'Crossbow',era:'iron',shape:'long line',shapeKey:'long',kind:'ranged',dmg:33,life:11,uses:18,rate:.8,speed:900,pierce:5,proj:'spear',cost:650},
  hammer:{name:'War Hammer',era:'iron',shape:'circle',shapeKey:'circle',kind:'melee',dmg:60,life:10,uses:26,rate:.8,range:74,knock:420,cost:700},
  flail:{name:'Flail',era:'iron',shape:'zigzag',shapeKey:'zig',kind:'melee',dmg:23,life:11,uses:70,rate:.2,range:56,knock:120,orbitSpeed:6,cost:650},
});
SHOP.push({id:'longsword',type:'creation',cost:600,cur:'coins',era:'iron'},{id:'crossbow',type:'creation',cost:650,cur:'coins',era:'iron'},{id:'hammer',type:'creation',cost:700,cur:'coins',era:'iron'},{id:'flail',type:'creation',cost:650,cur:'coins',era:'iron'});
const GL='#b8d0ff';
SPR.longsword=set(outline(grid(['..k..','.kzk.','.kzk.','.kzk.','.kzk.','.kzk.','.kzk.','.kzk.','kZZZk','.klk.','.klk.','..k..']),'#1a0f0e',GL));
SPR.crossbow=set(outline(grid(['k.......k','.k.....k.','..kbbbk..','...kzk...','...kbk...','...kbk...','...kbk...','...kbk...','....k....']),'#1a0f0e',GL));
SPR.hammer=set(outline(grid(['kkkkkkk','kzzzzZk','kzZZZZk','kkkbkkk','...b...','...b...','...b...','...b...','...l...']),'#1a0f0e',GL));
SPR.flail=set(outline(grid(['.z.z.','zZZZz','.ZzZ.','zZZZz','.z.z.','..k..','..k..','..k..','.kbk.','.kbk.','.klk.']),'#1a0f0e',GL));
for(const id of ['longsword','crossbow','hammer','flail'])ICON[id]=iconURL(SPR[id].r,3);
SHAPE_KEY.flail='zig';
Object.assign(SKETCH_LORE,{longsword:'Iron holds an edge that bronze only dreamed of.',crossbow:'A long line, cocked and waiting.',hammer:'A circle with a handle and a temper.',flail:'Zigzag on a chain. Nobody likes it, least of all its wielder.'});
// ---- iron enemies ----
SPR.en.militia=enSet(LEG(['..lll...','.lsssl..','..sisi..','..ssss..','.LlllL..','sLllllLs','.LllllL.','..llll..'],['..l..l..','..l..l..','.ll..ll.'],['...ll...','..l..l..','.ll...ll']),.8);
SPR.en.knight=enSet(LEG(['...zzz....','..zzZzz...','..zkZkz...','..zzzzz.p.','.ZZzzzZZp.','zZzZZZzZzz','zZZzzzZZ.z','zz.zzzz..z','.z.ZZZZ...'],['...Z..Z...','...Z..Z...','..ZZ..ZZ..'],['....ZZ....','...Z..Z...','..ZZ..ZZ..']),.85);
SPR.en.xbow=enSet(LEG(['...ZZZZ...','..ZsssZ...','..ssisi...','...ssss.k.','..PPPPPkkk','.sPPPPP.k.','s.PPPP....','..PPPP....'],['..l..l....','..l..l....','.ll..ll...'],['...ll.....','..l..l....','.ll...ll..']),.85);
SPR.en.warhorse=enSet(LEG(['..........pZ','.........zzZZ','ZZ.zzzzzzzzzZi','.ZZzZzzzzzzz.','..zzzzzzzzzz.'],['..q.q....q.q.','..q.q....q.q.'],['...qq.....qq..','...qq.....qq..']),.85);
SPR.en.catapult=enSet([['.........kk','........kbk','.......kbk.','......kbk..','.....kbk...','..bbbbbbbb.','.bBbbbbbBb.','bbbbbbbbbbb','.kk.....kk.','kZZk...kZZk','.kk.....kk.']],.9);
SPR.en.warlord=enSet(LEG(['....pppp....','...ZzzzzZ...','...zkZZkz...','...zzzzzz...','..ZZPPPPZZ..','.zzPPPPPPzz.','zzZPPaaPPZzz','z.ZPPPPPPZ.z','a.ZZPPPPZZ.a','..ZZZZZZZZ..','..ZZ....ZZ..'],['..ZZ....ZZ..','.ZZZ....ZZZ.'],['...ZZ..ZZ...','..ZZZ..ZZZ..']));
SPR.en.ram=enSet([['..bbbbbbbbbb..','.bBbbbbbbbbBb.','zzbbbbbbbbbbbb','zZzbBbbbbbBbb.','zzbbbbbbbbbbbb','.bbbbbbbbbbbb.','.kk..kk..kk...','kZZkkZZkkZZk..','.kk..kk..kk...']],1);
Object.assign(EN_SCALE,{militia:.8,knight:.85,xbow:.85,warhorse:.85,catapult:.9,warlord:1,ram:1});
Object.assign(ENEMY_TYPES,{
  militia:{name:'Levy Militia',spr:'militia',r:10,hp:26,speed:96,dmg:9,xp:1,col:'#6b4a30',beh:'swarm',mat:'hide',lore:'Farmers with pitchforks, pressed into the siege.'},
  knight:{name:'Iron Knight',spr:'knight',r:14,hp:150,speed:44,dmg:22,xp:4,col:'#aab3bd',beh:'chase',mat:'iron',armor:.45,lore:'Plate armour shrugs off blades. Hit it from range.'},
  xbow:{name:'Crossbowman',spr:'xbow',r:11,hp:46,speed:52,dmg:16,xp:3,col:'#b8382f',beh:'thrower',mat:'flint',lore:'One bolt, carefully aimed, every few seconds.'},
  warhorse:{name:'Destrier',spr:'warhorse',r:16,hp:180,speed:62,dmg:26,xp:6,col:'#aab3bd',beh:'charge',elite:true,mat:'hide',lore:'Barded in steel and trained to trample.'},
  catapult:{name:'Catapult',spr:'catapult',r:18,hp:220,speed:14,dmg:30,xp:8,col:'#8a5a32',beh:'thrower',elite:true,mat:'iron',lore:'Slow to aim. Very fast to land.'},
  warlord:{name:'Brennus',title:'The Iron Warlord',spr:'warlord',r:22,hp:3600,speed:44,dmg:40,xp:80,col:'#b8382f',beh:'charge',boss:true,mat:'iron',armor:.7,lore:'Vae victis.'},
  ram:{name:'Old Thunder',title:'The Siege Ram',spr:'ram',r:24,hp:4800,speed:30,dmg:46,xp:100,col:'#8a5a32',beh:'charge',boss:true,mat:'iron',lore:'It has broken eleven gates. You are smaller than a gate.'},
});
MAT_NAMES.iron=MAT_NAMES.iron||'Iron';if(!SPR.mat.iron){SPR.mat.iron=outline(grid(['......','.zzzz.','zZZZZz','ZZZZZZ']));ICON.mat_iron=iconURL(SPR.mat.iron,3)}MAT_NAMES.bronze=MAT_NAMES.bronze||'Bronze';
// ---- castle siege ground ----
SPR.tiles.iron=makeTile(57,'#3d3f44',['#45474d','#36383d','#4d4f55','#2f3136'],'#55585f');
SPR.decos.iron={
  rock1:outline(grid(['tttttt','tTtTtT','tttttt','TtTtTt']),'#1a0f0e'), // wall chunk
  rock2:outline(grid(['bbbb','bBbB','bbbb']),'#1a0f0e'), // crate
  bones:outline(grid(['k....','kppp.','kpPp.','kppp.','k....','k....','k....']),'#1a0f0e'), // banner
  skull:outline(grid(['b...b','.b.b.','..b..','.b.b.','b...b']),'#1a0f0e'), // barricade
  fern:grid(['..O..','.OoO.','.oyo.','..b..']), // burning pitch
  grass:grid(['.t..t.','.T.tT.','Tt.T.t']),flower:grid(['.Z.','ZzZ','.Z.'])};
SPR.dirts.iron=SPR.dirt;
ERA_MUSIC.iron={bpm:120,root:98,scale:[0,1,3,5,7,8,10],lead:'sawtooth',bass:'square',drum:'x.x.x...x.x.x.x.',hat:'..x...x...x...x.',prog:[0,5,3,4]};
ERA_PROPS.iron=['torch','urn','torch'];
