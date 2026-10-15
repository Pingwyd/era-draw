'use strict';
// ================= LEVEL-UP CARD REWORK =================
// 20 extra cards (stat / behaviour / synergy across rarities), max levels, and repeat-dampening:
// every pick of a card halves its future offer weight (floor 0.15) and it can't reappear in the very next level-up.
const CARD_MAX=5;
const pct=(a,r)=>Math.round(a[r]*100);
const NEW_CARDS=[
 // ---- common: plain stats ----
 {id:'whet',  name:'Whetstone',   base:'common',v:[.08,.12,.18],desc:r=>`+${pct([.08,.12,.18],r)}% melee damage`,apply:(p,r)=>p.meleeMul=(p.meleeMul||1)*(1+[.08,.12,.18][r]),
  art:['......ww.','.....wWk.','....wWk..','...wWk...','..wWk....','.bWk.....','bBk......','Bk.......','.........']},
 {id:'fletch',name:'Fletching',   base:'common',desc:r=>`+${pct([.08,.12,.18],r)}% ranged & area damage`,apply:(p,r)=>p.rangedMul=(p.rangedMul||1)*(1+[.08,.12,.18][r]),
  art:['m.......m','mm.....mm','.mm...mm.','..mbbbm..','...bBb...','...bBb...','...bBb...','...bBb...','...w.w...']},
 {id:'hide',  name:'Thick Hide',  base:'common',desc:r=>`-${pct([.05,.08,.12],r)}% damage taken`,apply:(p,r)=>p.armor=Math.max(.5,(p.armor||1)*(1-[.05,.08,.12][r])),
  art:['.ffffff..','fFffffFf.','fffFFfff.','ffFffFff.','fffFFfff.','.fffffff.','..fffff..','...fff...','....f....']},
 {id:'regrow',name:'Regrowth',    base:'common',desc:r=>`Regenerate ${[.2,.3,.5][r]} HP per second`,apply:(p,r)=>p.regen=(p.regen||0)+[.2,.3,.5][r],
  art:['....n....','...nnn...','..nNnNn..','.nnNnNnn.','..nNNNn..','....N....','....N....','...NNN...','..N.N.N..']},
 {id:'longshot',name:'Long Shot', base:'common',desc:r=>`+${pct([.1,.15,.22],r)}% projectile speed & reach`,apply:(p,r)=>p.reach=(p.reach||1)*(1+[.1,.15,.22][r]),
  art:['.........','.......y.','......yyk','yyyyyyyyy','yyyyyyyyy','......yyk','.......y.','.........','.........']},
 {id:'hunger',name:'Gem Hunger',  base:'common',desc:r=>`+${pct([.06,.09,.14],r)}% XP from gems`,apply:(p,r)=>p.xpMul=(p.xpMul||1)*(1+[.06,.09,.14][r]),
  art:['....e....','...eEe...','..eeEee..','.eeeEeee.','eeeeEeeee','.eeeEeee.','..eeEee..','...eEe...','....e....']},
 // ---- rare: behaviour ----
 {id:'vamp',  name:'Vampiric Ink',base:'rare',desc:r=>`Heal ${[.4,.6,1][r]}% of damage dealt (max 1.5 HP/s)`,apply:(p,r)=>p.vamp=(p.vamp||0)+[.004,.006,.01][r],
  art:['..m...m..','.mMm.mMm.','.mmmmmmm.','.mmmmmmm.','..mmmmm..','...mmm...','....m....','....M....','.........']},
 {id:'exec',  name:'Executioner', base:'rare',desc:r=>`+${pct([.2,.3,.45],r)}% damage to enemies under 30% HP`,apply:(p,r)=>p.exec=(p.exec||0)+[.2,.3,.45][r],
  art:['..ttttt..','.tTTTTTt.','..ttttt..','....b....','....b....','....b....','....b....','....B....','....B....']},
 {id:'slayer',name:'Giant Slayer',base:'rare',desc:r=>`+${pct([.12,.18,.28],r)}% damage to bosses & elites`,apply:(p,r)=>p.slayer=(p.slayer||0)+[.12,.18,.28][r],
  art:['a.a.a.a.a','aaaaaaaaa','aAaaAaaAa','aaaaaaaaa','.........','..wwwww..','.wkwwwkw.','.wwwwwww.','..w.w.w..']},
 {id:'crit',  name:'Lucky Stroke',base:'rare',desc:r=>`${pct([.06,.09,.14],r)}% chance to deal double damage`,apply:(p,r)=>p.crit=Math.min(.5,(p.crit||0)+[.06,.09,.14][r]),
  art:['....y....','...yyy...','yyyyyyyyy','.yyyyyyy.','..yyyyy..','.yyy.yyy.','.yy...yy.','y.......y','.........']},
 {id:'rush',  name:'Kill Rush',   base:'rare',desc:r=>`Kills give +${pct([.12,.18,.26],r)}% move speed for 2s`,apply:(p,r)=>p.rush=(p.rush||0)+[.12,.18,.26][r],
  art:['...oo....','..oOOo...','.oO..Oo..','oO....Oo.','.......Oo','oO....Oo.','.oO..Oo..','..oOOo...','...oo....']},
 {id:'pierce',name:'Pierce Deep', base:'rare',desc:r=>`Projectiles pierce +${[1,1,2][r]} more enemies`,apply:(p,r)=>p.pierceAdd=(p.pierceAdd||0)+[1,1,2][r],
  art:['.........','....t....','...tTt...','m.tTTTt.m','mmmmmmmmm','m.tTTTt.m','...tTt...','....t....','.........']},
 {id:'blast', name:'Blast Radius',base:'rare',desc:r=>`+${pct([.12,.18,.26],r)}% area of effect`,apply:(p,r)=>p.aoeMul=(p.aoeMul||1)*(1+[.12,.18,.26][r]),
  art:['o...o...o','.o..o..o.','..o.O.o..','...OOO...','ooOOyOOoo','...OOO...','..o.O.o..','.o..o..o.','o...o...o']},
 {id:'thorns',name:'Bramble Robe',base:'rare',desc:r=>`Enemies that hit you take ${[20,30,45][r]} damage`,apply:(p,r)=>p.thorns=(p.thorns||0)+[20,30,45][r],
  art:['g...g...g','.g.ggg.g.','..gGgGg..','.gGrrrGg.','ggrRrRrgg','.gGrrrGg.','..gGgGg..','.g.ggg.g.','g...g...g']},
 // ---- epic: synergy / build-defining ----
 {id:'arm',   name:'Third Hand',  base:'epic',max:2,desc:()=>`+1 melee creation at once`,apply:p=>p.caps.melee=(p.caps.melee||1)+1,
  art:['..sss....','.sssss...','.sSsSs...','.sssss.s.','..sss.ss.','...ssss..','...sss...','...sS....','...SS....']},
 {id:'quiver',name:'Deep Quiver', base:'epic',max:2,desc:()=>`+1 ranged creation at once`,apply:p=>p.caps.ranged=(p.caps.ranged||1)+1,
  art:['.w.w.w...','.w.w.w...','.t.t.t...','bbbbbbb..','bBBBBBb..','bBBBBBb..','bBBBBBb..','bBBBBBb..','.bbbbb...']},
 {id:'shock', name:'Shock Dash',  base:'epic',max:3,desc:()=>`Dashing releases a shockwave (40 dmg + knockback)`,apply:p=>p.shockDash=(p.shockDash||0)+40,
  art:['....y....','...yy....','..yy.....','.yyyyyy..','....yy...','...yy....','..yy.....','.yy......','.y.......']},
 {id:'glass', name:'Glass Cannon',base:'epic',once:true,desc:()=>`+35% damage, -20% max HP`,apply:p=>{p.dmgMul*=1.35;p.maxHp*=.8;p.hp=Math.min(p.hp,p.maxHp)},
  art:['...www...','..wW.Ww..','..w...w..','..wW.Ww..','...wWw...','....w....','....w....','...www...','..wwwww..']},
 {id:'precise',name:'Precision',  base:'epic',max:3,desc:()=>`Perfect draws hit 30% harder`,apply:p=>p.precision=(p.precision||0)+.3,
  art:['...mmm...','..m...m..','.m..m..m.','m..mmm..m','m.mmwmm.m','m..mmm..m','.m..m..m.','..m...m..','...mmm...']},
 {id:'stand', name:'Last Stand',  base:'epic',max:2,desc:()=>`Below 35% HP: +30% damage, +20% speed`,apply:p=>p.lastStand=(p.lastStand||0)+1,
  art:['....m....','...mMm...','..mMMMm..','..mMMMm..','..mMMMm..','...mMm...','....m....','.........','....m....']},
];
// nerf the original cards' values (~25%) and give everything a max level
const NERF={ink:[.08,.12,.18],quick:[.07,.11,.16],swift:[.06,.09,.14],iron:[.08,.14,.22],magnet:[.25,.4,.65],heavy:[.12,.2,.3],focus:[.2,.3,.45],homing:[1.2,2,3.2],echo:[.1,.15,.22],coin:[.2,.3,.4]};
for(const pu of POWERUPS){const v=NERF[pu.id];if(!v)continue;const P=n=>Math.round(n*100);
  const D={ink:r=>`+${P(v[r])}% creation damage`,quick:r=>`-${P(v[r])}% cast cooldown`,swift:r=>`+${P(v[r])}% move speed`,iron:r=>`+${P(v[r])}% max HP & heal`,magnet:r=>`+${P(v[r])}% pickup range`,
   heavy:r=>`+${P(v[r])}% creation durability`,focus:r=>`+${v[r]}s slow-mo (cap ${MAX_FOCUS}s)`,homing:r=>`Projectiles home ${['slightly','well','fiercely'][r]}`,echo:r=>`${P(v[r])}% chance a creation spawns twice (cap 45%)`,coin:r=>`+${P(v[r])}% coins this run`}[pu.id];
  const A={ink:(p,r)=>p.dmgMul*=1+v[r],quick:(p,r)=>p.cdMul*=1-v[r],swift:(p,r)=>p.speed*=1+v[r],iron:(p,r)=>{const m=1+v[r];p.maxHp*=m;p.hp=Math.min(p.maxHp,p.hp*m+4)},magnet:(p,r)=>p.magnet*=1+v[r],
   heavy:(p,r)=>p.durMul*=1+v[r],focus:(p,r)=>p.focus=Math.min(MAX_FOCUS,p.focus+v[r]),homing:(p,r)=>p.homing+=v[r],echo:(p,r)=>p.echo=Math.min(.45,p.echo+v[r]),coin:(p,r)=>p.coinMul*=1+v[r]}[pu.id];
  pu.desc=D;pu.apply=A}
for(const c of NEW_CARDS){const {art,...pu}=c;POWERUPS.push(pu);SPR.pu[c.id]=outline(grid(art));ICON['pu_'+c.id]=iconURL(SPR.pu[c.id],4)}
for(const pu of POWERUPS)if(!pu.once&&!pu.max)pu.max=CARD_MAX;
const cardMaxed=pu=>(pu.once&&G.picks[pu.id])||(pu.max&&(G.picks[pu.id]||0)>=pu.max);

// ---- weighted offers with repeat-dampening ----
runHooks.push(G=>{G.cardW={};G.cardBlock=null});
const cardWeight=pu=>(G.cardW&&G.cardW[pu.id]!=null?G.cardW[pu.id]:1)*(pu.base==='epic'?.55:pu.base==='rare'?.85:1);
rollPicks=function(){
  const out=[];let epicUsed=false,tries=0;
  const pool=POWERUPS.filter(pu=>!cardMaxed(pu)&&pu.id!==G.cardBlock);
  while(out.length<3&&tries++<80){
    const cand=pool.filter(pu=>!out.some(o=>o.pu===pu));if(!cand.length)break;
    let tot=0;for(const pu of cand)tot+=cardWeight(pu);let x=Math.random()*tot,pu=cand[0];for(const c of cand){x-=cardWeight(c);if(x<=0){pu=c;break}}
    const owned=G.picks[pu.id]||0;
    let r=pu.base==='epic'?2:Math.max(RAR.indexOf(pu.base),rollRarity(!epicUsed));
    if(owned>=3&&pu.base!=='epic')r=Math.max(r,1);
    if(r===2&&epicUsed){if(pu.base==='epic')continue;r=1}
    if(r===2&&pu.base==='epic'&&G.t<120&&Math.random()<.7)continue;
    if(r===2)epicUsed=true;out.push({pu,r})}
  return out};
window.noteCardPick=noteCardPick;function noteCardPick(id,fromLevel){if(!G.cardW)G.cardW={};G.cardW[id]=Math.max(.15,(G.cardW[id]!=null?G.cardW[id]:1)*.5);if(fromLevel)G.cardBlock=id}
const _lvUp=levelUp;levelUp=function(fromChest){G.cardBlockNow=G.cardBlock;_lvUp(fromChest);
  // after this offer is shown the block is spent; the picked card becomes the new block
  G.cardBlock=null;
  screenEl.querySelectorAll('.pick').forEach(el=>{const old=el.onclick;const id=el.querySelector('.pk-name')&&el.querySelector('.pk-name').textContent;
    const pu=POWERUPS.find(p=>p.name===id);const own=pu?(G.picks[pu.id]||0):0;const tag=el.querySelector('.lvtag');if(pu&&tag)tag.textContent=own?`LV ${own+1}/${pu.max||1}`:'NEW';
    el.onclick=()=>{if(pu)noteCardPick(pu.id,!fromChest);old()}})};

// ---- card effects ----
DMG_MODS.push((e,d,src,from)=>{const p=G.player;if(!p)return d;
  if(src==='melee'&&p.meleeMul)d*=p.meleeMul;else if(src!=='melee'&&src!=='dot'&&src!=='thorns'&&p.rangedMul)d*=p.rangedMul;
  if(p.exec&&e.hp<e.maxHp*.3)d*=1+p.exec;if(p.slayer&&(e.T.boss||e.T.elite||e.champ))d*=1+p.slayer;
  if(p.lastStand&&p.hp<p.maxHp*.35)d*=1+.3*p.lastStand;
  if(p.crit&&Math.random()<p.crit){d*=2;if(Math.random()<.3)floatText(e.x,e.y-28,'CRIT','#ffe08a',.5,11)}
  if(p.vamp&&G.vampBudget>0){const h=Math.min(G.vampBudget,d*p.vamp);G.vampBudget-=h;p.hp=Math.min(p.maxHp,p.hp+h)}
  return d});
CAVE_TICK.push(dt=>{const p=G.player;if(p.regen&&p.hp>0)p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);G.vampBudget=Math.min(1.5,(G.vampBudget||0)+1.5*dt);
  if(G.rushT>0)G.rushT-=dt;
  const want=(G.rushT>0?1+p.rush:1)*(p.lastStand&&p.hp<p.maxHp*.35?1+.2*p.lastStand:1);if(p._spdBoost!==want){p.speed*=want/(p._spdBoost||1);p._spdBoost=want}});
const _dpC=damagePlayer;damagePlayer=function(d){const p=G&&G.player;if(p&&p.invul<=0){if(p.armor)d*=p.armor;
  if(p.thorns){let t=null,bd=1e18;for(const e of G.enemies){const q=(e.x-p.x)**2+(e.y-p.y)**2;if(q<bd){bd=q;t=e}}if(t&&bd<(p.r+t.r+30)**2)hurtEnemy(t,p.thorns,'thorns')}}return _dpC(d)};
const _keC=killEnemy;killEnemy=function(e){_keC(e);if(G&&G.player.rush)G.rushT=2};
const _fsC=fireShot;fireShot=function(c,ang){const n=G.shots.length;_fsC(c,ang);const p=G.player;for(let i=n;i<G.shots.length;i++){const s=G.shots[i];
  if(p.reach){s.vx*=p.reach;s.vy*=p.reach;s.life*=1+(p.reach-1)*.5}if(p.pierceAdd)s.pierce+=p.pierceAdd;if(p.aoeMul&&s.aoe)s.aoe*=p.aoeMul}};
const _scC=spawnCreation;spawnCreation=function(id,dir,echo,power=1){const p=G&&G.player;if(p&&p.precision&&power>=1.23)power*=1+p.precision;return _scC(id,dir,echo,power)};
const _tdC=tryDash;tryDash=function(){const p=G&&G.player,before=p&&p.dashT;_tdC();if(p&&p.shockDash&&p.dashT>0&&!(before>0)){ring(p.x,p.y,110,'#ffe08a');G.shake=Math.max(G.shake,4);
  for(const e of queryGrid(p.x,p.y,130))if(Math.hypot(e.x-p.x,e.y-p.y)<110+e.r){hurtEnemy(e,p.shockDash*p.dmgMul,'aoe');const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*360;e.ky+=Math.sin(a)*360}}};
