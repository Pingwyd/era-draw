'use strict';
// ================= ERA MATERIALS =================
if(!save.mats)save.mats={bone:0,flint:0,hide:0,bronze:0};
const MAT_NAMES={bone:'Bone',flint:'Flint',hide:'Hide',bronze:'Bronze'};
const _killEnemy=killEnemy;
killEnemy=function(e){_killEnemy(e);if(!G)return;
  killHooks.forEach(f=>f(e));
  const m=e.T.mat;if(!m)return;const ch=e.T.boss?1:e.T.elite?.5:.05;
  if(Math.random()<ch){const n=e.T.boss?5:1;G.mats[m]=(G.mats[m]||0)+n;floatText(e.x,e.y-20,'+'+n+' '+MAT_NAMES[m].toUpperCase(),'#d9c27a',.9)}};
const killHooks=[];
endHooks.push(g=>{if(!g||!g.mats)return;for(const k in g.mats)save.mats[k]=(save.mats[k]||0)+g.mats[k]});

boot();
