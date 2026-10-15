// ===== Achievements v2: more goals, manual claim, red dot on home, in-run toast =====
const achSkillsN=g=>g&&g.picks?POWERUPS.filter(p=>p.kind==='skill'&&g.picks[p.id]).length:0;
const achSkillMax=g=>g&&g.picks?POWERUPS.filter(p=>p.kind==='skill'&&(g.picks[p.id]||0)>=(p.max||5)).length:0;
const achBossSum=()=>Object.values(save.stats.bosses||{}).reduce((a,b)=>a+b,0);
ACH.push(
  {id:'kills500r',name:'Ink Flood',desc:'Defeat 500 enemies in one run',coins:60,test:g=>g&&g.kills>=500},
  {id:'kills1500r',name:'Black Tide',desc:'Defeat 1,500 enemies in one run',coins:120,test:g=>g&&g.kills>=1500},
  {id:'kills10k',name:'Ten Thousand Strokes',desc:'Defeat 10,000 enemies in total',coins:200,gems:2,test:()=>save.stats.kills>=10000},
  {id:'kills50k',name:'Inkwell Abyss',desc:'Defeat 50,000 enemies in total',coins:400,gems:5,test:()=>save.stats.kills>=50000},
  {id:'lv10',name:'Apprentice',desc:'Reach level 10 in a run',coins:40,test:g=>g&&g.level>=10},
  {id:'lv20',name:'Journeyman',desc:'Reach level 20 in a run',coins:120,test:g=>g&&g.level>=20},
  {id:'sk5',name:'Full Hand',desc:'Hold 5 skills in one run',coins:60,test:g=>achSkillsN(g)>=5},
  {id:'skmax',name:'Mastered',desc:'Max a skill to level 5',coins:60,test:g=>achSkillMax(g)>=1},
  {id:'skmax3',name:'Grand Design',desc:'Max 3 skills in one run',coins:150,gems:1,test:g=>achSkillMax(g)>=3},
  {id:'chest10',name:'Treasure Hunter',desc:'Open 10 chests in total',coins:50,test:()=>(save.stats.chests||0)>=10},
  {id:'chest100',name:'Dragon Hoard',desc:'Open 100 chests in total',coins:200,gems:2,test:()=>(save.stats.chests||0)>=100},
  {id:'timed',name:'Fleeting Power',desc:'Pick up a timed power-up',coins:20,test:g=>g&&g.timedSeen},
  {id:'timed3',name:'Overclocked',desc:'Have 3 timed power-ups active at once',coins:80,test:g=>g&&g.buffs&&Object.keys(TIMED).filter(k=>g.buffs['t_'+k]>0).length>=3},
  {id:'relic3',name:'Collector',desc:'Hold 3 relics in one run',coins:70,test:g=>g&&g.relics&&Object.keys(g.relics).length>=3},
  {id:'elite',name:'Pack Breaker',desc:'Defeat an elite pack leader',coins:40,test:g=>g&&g.vetKills>0},
  {id:'boss5',name:'Giant Slayer',desc:'Defeat 5 bosses in total',coins:100,test:()=>achBossSum()>=5},
  {id:'boss25',name:'Legend of the Eras',desc:'Defeat 25 bosses in total',coins:300,gems:3,test:()=>achBossSum()>=25},
  {id:'boss2run',name:'Double Feature',desc:'Defeat 2 bosses in one run',coins:80,test:g=>g&&g.bossKills&&Object.keys(g.bossKills).length>=2},
  {id:'clearB',name:'Bronze Master',desc:'Clear the Bronze Age',coins:250,gems:1,test:g=>g&&g.victory&&g.era===ERAS.bronze},
  {id:'clearI',name:'Iron Will',desc:'Clear the Iron Age',coins:300,gems:2,test:g=>g&&g.victory&&g.era===ERAS.iron},
  {id:'clearM',name:'Myth Made Real',desc:'Clear the Mythic Age',coins:400,gems:3,test:g=>g&&g.victory&&ERAS.mythic&&g.era===ERAS.mythic},
  {id:'endless15',name:'No End in Sight',desc:'Survive 15:00 in endless',coins:150,gems:1,test:g=>g&&g.endless&&g.t>=900},
  {id:'endless20',name:'Eternal Scribe',desc:'Survive 20:00 in endless',coins:300,gems:3,test:g=>g&&g.endless&&g.t>=1200},
  {id:'perfect50',name:'Calligrapher',desc:'50 perfect draws in one run',coins:120,test:g=>g&&g.perfects>=50},
  {id:'fullhp',name:'Untouched',desc:'Reach 3:00 without taking damage',coins:100,test:g=>g&&g.t>=180&&!g.hurt},
  {id:'rich5k',name:'Treasury',desc:'Hold 5,000 coins at once',coins:100,test:()=>save.coins>=5000},
  {id:'runs25',name:'Regular',desc:'Play 25 runs',coins:80,test:()=>save.runs>=25},
  {id:'runs100',name:'Devoted',desc:'Play 100 runs',coins:250,gems:2,test:()=>save.runs>=100},
  {id:'hell',name:'Through the Fire',desc:'Survive 5:00 on the hardest difficulty',coins:200,gems:2,test:g=>{if(!g)return false;const ks=Object.keys(DIFFS);return g.diff===ks[ks.length-1]&&g.t>=300}},
);
if(!save.achC){save.achC={};for(const id in (save.ach||{}))save.achC[id]=1;persist()} // older ones were paid on unlock
save.stats.chests=save.stats.chests||0;
const achClaimable=()=>ACH.filter(a=>save.ach[a.id]&&!save.achC[a.id]).length;
checkAch=function(g){for(const a of ACH){if(save.ach[a.id])continue;let ok=false;try{ok=a.test(g)}catch(e){}
  if(ok){save.ach[a.id]=Date.now();persist();achToast(a);sfx('chest');haptic([20,30,20])}}};
function achToast(a){const el=document.createElement('div');el.className='achtoast';el.setAttribute('role','status');el.innerHTML=`<span class="lab">Achievement</span><b>${a.name}</b><i>Claim it in Achievements</i>`;document.body.appendChild(el);setTimeout(()=>el.classList.add('out'),2600);setTimeout(()=>el.remove(),3200)}
function claimAch(a){if(!save.ach[a.id]||save.achC[a.id])return 0;save.achC[a.id]=1;save.coins+=a.coins;if(a.gems)save.gems=(save.gems||0)+a.gems;return 1}
achievements=function(){
  leaveRun();setRoute('achievements');const done=ACH.filter(a=>save.ach[a.id]).length,cl=achClaimable();
  const open=a=>save.ach[a.id]&&!save.achC[a.id];
  const row=(a,i)=>{const d=save.ach[a.id],rw=coinI()+' '+a.coins+(a.gems?' '+gemI()+' '+a.gems:'');
    return `<div class="li ${d?'':'dim'}"><b>${String(i+1).padStart(2,'0')}</b><span class="seal ${d?'on':''}"></span><div class="li-t"><span class="nm">${a.name}</span><span class="sh">${a.desc}</span></div>${open(a)?`<button class="buy claim" data-cl="${a.id}" aria-label="Claim ${a.name}">Claim ${rw}</button>`:`<span class="buy ${d?'own':'poor'}">${d?'Claimed':rw}</span>`}</div>`};
  const order=ACH.map((a,i)=>[a,i]).sort((x,y)=>(open(x[0])?0:1)-(open(y[0])?0:1));
  show(sheet('Achievements',`09 &mdash; ${done} / ${ACH.length} earned`,`${cl?`<button id="clAll" class="btn pri">Claim all (${cl})</button>`:''}<div class="list achl">${order.map(([a,i])=>row(a,i)).join('')}</div>`));
  $('back').onclick=home;
  screenEl.querySelectorAll('[data-cl]').forEach(b=>b.onclick=()=>{const a=ACH.find(x=>x.id===b.dataset.cl);if(claimAch(a)){persist();sfx('buy');toast('+'+a.coins+' coins'+(a.gems?', +'+a.gems+' gems':''))}achievements()});
  if($('clAll'))$('clAll').onclick=()=>{let c=0,g=0;for(const a of ACH)if(claimAch(a)){c+=a.coins;g+=a.gems||0}persist();sfx('chest');toast('+'+c+' coins'+(g?', +'+g+' gems':''));achievements()};
};
ROUTES.achievements=achievements;
const _a2Home=home;home=function(){_a2Home.apply(this,arguments);achDot()};
function achDot(){const b=screenEl.querySelector('[data-hub="achievements"]');if(!b)return;const n=achClaimable();const tb=screenEl.querySelector('[data-tab="prog"]');if(tb)tb.classList.toggle('dot',n>0);b.classList.toggle('dot',n>0);if(n)b.setAttribute('aria-label','Achievements, '+n+' to claim')}
const _a2Chest=openChest;openChest=function(){save.stats.chests=(save.stats.chests||0)+1;return _a2Chest.apply(this,arguments)};
killHooks.push(e=>{if(e.vetChest&&G)G.vetKills=(G.vetKills||0)+1});
const _a2Dmg=damagePlayer;damagePlayer=function(d){if(G&&G.player&&G.player.invul<=0&&d>0)G.hurt=true;return _a2Dmg.apply(this,arguments)};
const _a2Buff=addBuff;addBuff=function(k){if(G&&/^t_/.test(k))G.timedSeen=true;return _a2Buff.apply(this,arguments)};
