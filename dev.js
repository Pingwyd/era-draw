'use strict';
// ================= DEV / TESTING ROUTES =================
// #/dev/unlock-all : full test save (asks first).  #/dev/reset-save : wipe the save (asks first).
function devConfirm(title,lab,body,okLabel,onOk){leaveRun();
  show(sheet(title,lab,`<p class="sh">${body}</p><nav class="menu"><button id="devOk"><b>01</b>${okLabel}<i>&rarr;</i></button><button id="devNo"><b>02</b>Cancel<i>&rarr;</i></button></nav>`));
  $('devOk').onclick=onOk;$('devNo').onclick=$('back').onclick=()=>{history.replaceState(null,'','#/home');home()}}
function devUnlockAll(){
  const s=save,all=Object.keys(CREATIONS);
  s.coins=9999999;s.gems=99999;s.tutDone=true;
  s.eras=ERA_ORDER.slice();s.era=ERA_ORDER[ERA_ORDER.length-1];for(const e of ERA_ORDER)delete ERAS[e].locked;
  s.cleared={};for(const e of ERA_ORDER)s.cleared[e]=true;
  s.owned=all.slice();s.slots=4;s.loadout=all.filter(id=>ERA_ORDER.indexOf(CREATIONS[id].era)>=ERA_ORDER.indexOf('iron')).slice(0,4);if(s.loadout.length<4)s.loadout=all.slice(0,4);
  s.mages=Object.keys(MAGES);s.inks=Object.keys(INKS);
  s.upg={};for(const u of UPGRADES)s.upg[u.id]=u.max;
  s.skills={};for(const m in SKILL_TREES){s.skills[m]={};for(const br in SKILL_TREES[m])s.skills[m][br]=SKILL_TREES[m][br].length}
  s.ach=s.ach||{};for(const a of ACH)s.ach[a.id]=s.ach[a.id]||Date.now();
  s.seen=s.seen||{};for(const t in ENEMY_TYPES)s.seen[t]=Math.max(s.seen[t]||0,999);
  s.stats=s.stats||{kills:0,bosses:{},dailies:0};s.stats.kills=Math.max(s.stats.kills||0,100000);s.stats.bosses=s.stats.bosses||{};for(const t in ENEMY_TYPES)if(ENEMY_TYPES[t].boss)s.stats.bosses[t]=Math.max(s.stats.bosses[t]||0,10);
  s.mats=s.mats||{};for(const k of new Set([...Object.keys(MAT_NAMES),...Object.keys(SPR.mat||{})]))s.mats[k]=99999;
  s.mastery=s.mastery||{};const top=MASTERY_STEPS[MASTERY_STEPS.length-1];for(const k in SHAPE_NAMES)s.mastery[k]=Math.max(s.mastery[k]||0,top);
  s.sketched=s.sketched||{};for(const id of all)s.sketched[id]=1;
  if(typeof RELICS!=='undefined'){s.relicsSeen=s.relicsSeen||{};for(const k in RELICS)s.relicsSeen[k]=1}
  if(typeof SPELLS!=='undefined'&&!(s.scrolls||[]).some(Boolean))s.scrolls=['nova','chain','lance'];
  s.best=Math.max(s.best||0,900);s.runs=Math.max(s.runs||0,1);
  CURRENT_ERA=s.era;persist();
}
ROUTES['dev/unlock-all']=()=>{setRoute('dev/unlock-all');devConfirm('Unlock everything','Dev &mdash; test save','This overwrites your progress with a full test save: max coins and gems, every era (including Mythic) unlocked and cleared, every weapon, mage, ink, upgrade, skill node, achievement and bestiary entry, high materials and maxed mastery. Your settings are kept.','Apply test save',()=>{devUnlockAll();toast('Test save applied');history.replaceState(null,'','#/home');home()})};
ROUTES['dev/reset-save']=()=>{setRoute('dev/reset-save');devConfirm('Reset save','Dev &mdash; wipe','This deletes all progress and settings on this device and reloads the game. It cannot be undone.','Wipe save',()=>{G=null;mode='home';persist=function(){};saveRun=function(){};try{localStorage.removeItem(SAVE_KEY);sessionStorage.removeItem(RUN_KEY)}catch(e){}history.replaceState(null,'',location.pathname+location.search+'#/home');location.reload()})};
