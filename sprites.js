'use strict';
// ================= PIXEL ART =================
// All sprites are hand-authored character grids rendered once into tiny canvases.
// Palette keys are shared; '.' is transparent.
const PAL = {
  k:'#1a0f0e', // outline / ink black
  h:'#7a1f2b', H:'#4e1119', // hat wine
  r:'#2f5d62', R:'#1d3a3e', // robe teal
  s:'#e8b796', S:'#b9826a', // skin
  w:'#efe6d2', W:'#bfb39b', // beard / bone / parchment
  b:'#8a5a32', B:'#5a3a20', // wood
  o:'#ffb35c', O:'#ff7a2e', // ink glow
  y:'#ffe08a',
  g:'#5c7a3a', G:'#3f5a28', v:'#7f9e4c', // greens
  d:'#6b5038', D:'#4a3626', // dirt
  t:'#8e8579', T:'#5f584f', // stone
  x:'#1c1716', // tar
  e:'#4ea6e0', E:'#2a5fa8', // xp blue
  n:'#5fd36a', N:'#2e8a3e', // xp green
  m:'#e0504e', M:'#8f2430', // red
  f:'#c98a45', F:'#8e5a28', // fur tan
  c:'#7b5a44', C:'#4f3a2c', // bear brown
  q:'#9a8e84', Q:'#6c625a', // rhino grey
  a:'#d9c27a', A:'#a88f4d', // gold
  i:'#27201c', // dark detail
  u:'#a14d9c',  // shaman paint
};
const SPR = {};
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;return [c,x]}
function grid(rows,pal=PAL){
  const h=rows.length,w=Math.max(...rows.map(r=>r.length));const [c,x]=mk(w,h);
  for(let j=0;j<h;j++)for(let i=0;i<rows[j].length;i++){const ch=rows[j][i];if(ch!=='.'&&ch!==' '&&pal[ch]){x.fillStyle=pal[ch];x.fillRect(i,j,1,1)}}
  return c;
}
function silhouette(src,col){const [c,x]=mk(src.width,src.height);x.drawImage(src,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return c}
// add a 1px outline (optionally a 2nd glow ring) around a sprite
function outline(src,col='#1a0f0e',glow){
  const pad=glow?2:1;const [c,x]=mk(src.width+pad*2,src.height+pad*2);
  if(glow){const g=silhouette(src,glow);for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[-1,1],[1,-1]])x.drawImage(g,pad+dx,pad+dy)}
  const s=silhouette(src,col);for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])x.drawImage(s,pad+dx,pad+dy);
  x.drawImage(src,pad,pad);return c;
}
function flip(src){const [c,x]=mk(src.width,src.height);x.translate(src.width,0);x.scale(-1,1);x.drawImage(src,0,0);return c}
// sprite set: normal, flipped, white flash (and flipped flash)
function set(src){const f=flip(src);return {r:src,l:f,wr:silhouette(src,'#fff6e0'),wl:silhouette(f,'#fff6e0'),w:src.width,h:src.height}}

// ---------- MAGE (16x18, faces right) ----------
const MAGE_TOP=[
'......kk........',
'.....khHk.......',
'....khhhHk......',
'....khhhhHk.....',
'...khhyhhhHk....',
'..khhhhhhhhHk...',
'.kkkkkkkkkkkkk..',
'....ksssssk.....',
'....kskssks..o..',
'....kwwwwwk.kyk.',
'...krwwwwwrk.b..',
'..krrrwwwrrRkb..',
'..krrrrrrrrRsk..',
'..kRrrrrrrrRkb..',
'...kRrrrrrRRkb..',
'...kRRrrrRRRk...'];
const LEGS=[
['....kBk.kBk.....','....kkk.kkk.....'],
['...kBk...kBk....','...kkk...kkk....'],
['.....kBkBk......','.....kkkkk......']];
SPR.mage=[0,1,0,2].map(i=>set(grid([...MAGE_TOP,...LEGS[i]])));
// idle uses frame 0 with a 1px bob

// ---------- WEAPONS (ink-glow outline) ----------
const INK='#ff9a3c';
SPR.club=set(outline(grid([
'..kk..','.kccbk','kcbbcbk'.slice(0,6),'kbbcbk','kbcbbk','.kbbk.','..kb..','..kb..','..kb..','..kB..','..kB..','..kk..']),'#1a0f0e',INK));
SPR.spear=set(outline(grid([
'..k..','.kwk.','.kwk.','kwWwk','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kbk.','.kBk.','.kBk.','..k..']),'#1a0f0e',INK));
SPR.rock=set(outline(grid([
'..kkkk..','.ktttTk.','kttwttTk','kttttTTk','ktTttTTk','kTTtTTTk','.kTTTTk.','..kkkk..']),'#1a0f0e',INK));
SPR.sling=set(outline(grid([
'k.....k','kb...bk','.kb.bk.','..kwk..','..kbk..','..kbk..','..kBk..','..kkk..']),'#1a0f0e',INK));
SPR.dagger=set(outline(grid([
'..k..','.kwk.','.kwk.','.kwk.','kwWwk','.kwk.','kWWWk','.kWk.','.kwk.','..k..']),'#1a0f0e',INK));
// projectiles (no glow; small)
SPR.p_spear=grid(['kkkkkkkkkkwk','BbbbbbbbbbWwk','kkkkkkkkkkwk']);
SPR.p_rock=outline(grid(['.ttT.','ttwtT','tttTT','.TTT.']));
SPR.p_pebble=grid(['kk','kt'].map(r=>r));
SPR.p_enemyRock=outline(grid(['.dD.','dddD','dDDD','.DD.']),'#1a0f0e');
SPR.p_orb=outline(grid(['.uu.','uyyu','uyyu','.uu.']),'#2a0f2a');

// ---------- PICKUPS ----------
SPR.gem1=outline(grid(['..e..','.eEe.','eewEe','.eEe.','..E..']));
SPR.gem2=outline(grid(['..n..','.nNn.','nnwNn','nnnNn','.nNn.','..N..']));
SPR.gem3=outline(grid(['...m...','..mMm..','.mmwMm.','mmmmMMm','.mmMMm.','..mMm..','...M...']));
SPR.coin=outline(grid(['.aaaa.','aayyaa','ayaaAa','aaaaAa','aaAAAa','.AAAA.']));
SPR.chest=outline(grid([
'.bbbbbbbb.','bBBBBBBBBb','baaaaaaaab','bBBByaBBBb','bbbbAAbbbb','bBBBBBBBBb','bbbbbbbbbb','BBBBBBBBBB']));
SPR.heart=outline(grid(['.mm.mm.','mmymmmm','mmmmmmM','.mmmmM.','..mmM..','...M...']));

// ---------- GROUND DECOR ----------
SPR.deco={
  rock1:outline(grid(['..ttt..','.ttwtT.','ttttTTT','tTTTTTT']),'#2a201a'),
  rock2:outline(grid(['.tt.','twtT','tTTT']),'#2a201a'),
  bones:grid(['w.......w','WwwwwwwwW','w.......w','.........','..w.w....','.wWwWw...']),
  skull:outline(grid(['.www.','wwwwW','wkwkW','.wWw.','.w.w.']),'#2a201a'),
  fern:grid(['....v....','.v..v..v.','..v.v.v..','v..vgv..v','.vg.g.gv.','..vgggv..','....G....']),
  grass:grid(['.v..v.','.v.vg.','gv.g.v','.ggG..']),
  flower:grid(['.a.','aya','.g.','.g.']),
  tar:null, // drawn procedurally (bubbling)
};
// ---------- GROUND TILE (64x64 base, dithered grass/dirt) ----------
SPR.tile=(()=>{const N=64;const [c,x]=mk(N,N);
  let seed=7;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
  x.fillStyle='#3a4a26';x.fillRect(0,0,N,N);
  for(let i=0;i<520;i++){x.fillStyle=['#425530','#344322','#4a5e34','#2f3c1f'][Math.floor(R()*4)];x.fillRect(Math.floor(R()*N),Math.floor(R()*N),1+Math.floor(R()*2),1)}
  for(let i=0;i<40;i++){x.fillStyle='#55693a';const px=Math.floor(R()*N),py=Math.floor(R()*N);x.fillRect(px,py,1,2);x.fillRect(px+1,py+1,1,1)}
  return c})();
SPR.dirt=(()=>{const N=48;const [c,x]=mk(N,N);let seed=99;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const d=Math.hypot(i-N/2,j-N/2)/(N/2)+R()*0.25;if(d<0.95){x.fillStyle=d<0.6?(R()<.15?'#5a4330':'#4f3b2a'):(R()<.5?'#45391f':'#4f3b2a');x.fillRect(i,j,1,1)}}
  return c})();

// ---------- BITMAP DIGITS (3x5) for damage numbers ----------
const DIG={'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001111'};
function drawDigits(ctx2,str,px,py,col,scale=1){
  let cx=px;for(const ch of str){const g=DIG[ch];if(g){for(let i=0;i<15;i++)if(g[i]==='1'){ctx2.fillStyle='#1a0f0e';ctx2.fillRect(cx+(i%3)*scale+scale,py+Math.floor(i/3)*scale+scale,scale,scale)}
    for(let i=0;i<15;i++)if(g[i]==='1'){ctx2.fillStyle=col;ctx2.fillRect(cx+(i%3)*scale,py+Math.floor(i/3)*scale,scale,scale)}}cx+=4*scale}
}
function digitsWidth(str,scale=1){return str.length*4*scale-scale}

// ---------- ICON → data URL (for HTML menus) ----------
function iconURL(c,scale=4){const [o,x]=mk(c.width*scale,c.height*scale);x.imageSmoothingEnabled=false;x.drawImage(c,0,0,o.width,o.height);return o.toDataURL()}

// ---------- POWERUP ICONS (9x9, outlined) ----------
const PU_ART={
  ink:   ['.......wk','......wwk','.....wwk.','....wwk..','...wwk...','..wWk....','.kWk.....','.ok......','o........'],
  quick: ['.....yy..','....yy...','...yy....','..yyyyy..','....yy...','...yy....','..yy.....','.yy......','.y.......'],
  swift: ['..bbb....','..bbb....','..bbb....','..bbb....','..bbbb...','..bbbbbb.','.bbbbbbbb','.BBBBBBBB','.........'],
  iron:  ['.ttttttt.','tTwwwwwTt','tTwttwtTt','tTwttwtTt','.tTwwwTt.','.tTTwTTt.','..tTTTt..','...tTt...','....t....'],
  magnet:['.mm...mm.','.mm...mm.','.mm...mm.','.mm...mm.','.mm...mm.','.mMm.mMm.','..mMMMm..','...mmm...','.w.....w.'],
  heavy: ['.ttttttt.','.tTTTTTt.','.ttttttt.','....b....','....b....','....b....','....b....','....B....','....B....'],
  focus: ['aaaaaaaaa','.w.....w.','..wyyyw..','...wyw...','....w....','...w.w...','..wyyyw..','.wyyyyyw.','aaaaaaaaa'],
  homing:['...mmm...','.mm...mm.','.m..w..m.','m..www..m','m.wwmww.m','m..www..m','.m..w..m.','.mm...mm.','...mmm...'],
  echo:  ['....o..o.','...o..o..','..o..o...','.o..o....','o..o.....','..o..o...','.o..o....','o..o.....','.........'],
  wind:  ['......ww.','.....wWw.','....wWw..','...wWw...','..wWww...','..wWw....','.wWw.....','.ww......','w........'],
  coin:  ['..aaaaa..','.aayyyaa.','aaya.Aaaa','aayaAAaaa','aaaa.Aaaa','aaaaAAaaA','.aaaaaaA.','..AAAAA..','.........'],
};
SPR.pu={};for(const k in PU_ART)SPR.pu[k]=outline(grid(PU_ART[k]));
SPR.gemHard=outline(grid(['..mmm..','.mwmmM.','mmmmmMM','.mmmMM.','..mMM..','...M...']));
