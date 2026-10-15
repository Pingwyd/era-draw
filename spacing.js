// ===== Even weapon spacing: all active creations share one ring around the player, at 360/n apart =====
// Each creation eases its slot offset toward i*2PI/n, so adding or breaking one re-spaces smoothly.
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;return d};
const RING_R=c=>c.def.kind==='melee'&&!c.def.spell?(c.id==='dagger'||c.def.base==='dagger'?44:58):40;
const _spcUpd=updateCreations;updateCreations=function(dt){
  const L=G.creations,n=L.length;if(!n)return _spcUpd(dt);const p=G.player;
  const mel=L.filter(c=>c.def.kind==='melee'&&!c.def.spell);const os=mel.length?mel.reduce((a,c)=>a+(c.def.orbitSpeed||2.2),0)/mel.length:1.2;
  G.orbA=((G.orbA||0)+os*dt)%6.283;
  L.forEach((c,i)=>{const want=i*6.283/n;if(c.off==null)c.off=want;c.off+=angDiff(c.off,want)*Math.min(1,dt*6);c.slotA=G.orbA+c.off;
    if(c.def.kind==='melee'&&!c.def.spell)c.ang=c.slotA-(c.def.orbitSpeed||2.2)*dt}); // base melee adds its own orbit step
  _spcUpd(dt);
  for(const c of G.creations){if(c.slotA==null||(c.def.kind==='melee'&&!c.def.spell))continue;const r=RING_R(c);
    c.x=p.x+Math.cos(c.slotA)*r;c.y=p.y-8+Math.sin(c.slotA)*r*.75}};
