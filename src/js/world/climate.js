// ---- climate and biomes (docs/biomes-plan.md, sections 4, 6 and 7): temperature and moisture over the world, and from
// them the biome of every column out in the wilds. All from the seed and the place (gradient noise, so every browser works
// out the same), lazily, and cheaply: the slow part is worked out once per corner of a lattice CL_SP blocks apart and
// blended between. The world's settings (WORLD_CFG's temp, rain, czone and lat) shift and stretch it ----
const CLIM={t:0,m:0},CL_SP=64,CL_C=new Map();let clSeed=null;
// (a slow north-south swing, hot toward +z and cold toward -z, LAT_P blocks from the start to the hottest, 0 at the start;
// WORLD_CFG.lat 1 is the default, weak, 0 off. A triangle wave, so no sine)
const LAT_P=60000,LAT_K=0.12;
function latBand(z){let u=z/LAT_P;u-=4*Math.floor((u+1)/4);return u<1?u:2-u;}
// (the start's region is always temperate and middling wet: grassland, as the world always was, within START_R blocks)
const START_R0=3000,START_R1=8000;
// at block (x,z): t from cold 0 to hot 1, m from arid 0 to soaked 1, before the lattice (the World Generator's Climate
// layer asks this directly). Broad, domain-warped fBm, its regions some 6 to 15 thousand blocks across. Into CLIM
function climateAt(x,z){
  const s=WORLD_CFG.czone,w=nzWarp(x/s,z/s,14000,3000,2101),wx=w[0],wz=w[1];
  let t=0.5+1.25*nzFbm(wx,wz,18000,3,2203)+LAT_K*WORLD_CFG.lat*latBand(z)+WORLD_CFG.temp;
  let m=0.45+1.3*nzFbm(wx+50000,wz-30000,13000,3,2311)+WORLD_CFG.rain;
  // (wetter within reach of the sea: the shore's air off the water)
  const v=seaV(x/CELL,z/CELL);m+=0.14*nzSmooth(SEA_T-0.32,SEA_T,v);
  const d2=x*x+z*z,k=nzSmooth(START_R0*START_R0,START_R1*START_R1,d2);
  t=0.5+(t-0.5)*k;m=0.52+(m-0.52)*k;
  CLIM.t=nzClamp01(t);CLIM.m=nzClamp01(m);
  return CLIM;
}
// ---- the biomes: what each one is, as data (everything about one is here, so a new one is a new record). top: the block
// on the surface, sub the few under it (null: as the plains); grass and leaf: tints multiplying the grass and leaves'
// colours (each no more than 1.8: a vertex colour of 1.5 or more glows, and the brightest face's shade is 0.8); map: its
// colour on the maps; trees: species and how likely each, sc the scattered trees' odds and dn how much more where the
// woods are thick, wood how much thicker the woods are here (-1 none); pond: how much likelier ponds are (water, or ice
// in ice fields); bush, flower, rock: odds of a bush, a flower, a boulder on a column ----
const BIOMES=[
  {k:'grassland',n:'Grassland',map:'#6c9448',grass:[1,1,1],leaf:[1,1,1],trees:[['oak',1]],sc:0.006,dn:0.11,wood:-0.25,pond:0,bush:0.01,flower:0.045,rock:0.0025},
  {k:'forest',n:'Temperate forest',map:'#4f7a38',grass:[0.74,0.85,0.85],leaf:[0.85,0.95,0.85],trees:[['oak',0.75],['big',0.25]],sc:0.02,dn:0.17,wood:0.5,pond:0.1,bush:0.04,flower:0.02,rock:0.002},
  {k:'taiga',n:'Taiga',map:'#4a6e58',grass:[0.74,0.82,1.5],leaf:[0.8,0.9,1.2],trees:[['pine',0.9],['oak',0.1]],sc:0.012,dn:0.15,wood:0.35,pond:0.15,bush:0.015,flower:0.006,rock:0.004},
  {k:'tundra',n:'Tundra',map:'#8e9a84',grass:[1.37,0.94,1.8],leaf:[1.2,1,1.4],trees:[['pine',0.4],['dead',0.6]],sc:0.0015,dn:0.01,wood:-0.6,pond:0.2,bush:0.02,flower:0.004,rock:0.012,gravel:0.08},
  {k:'ice',n:'Ice fields',map:'#e4ecf0',top:SNOW,sub:SNOW,grass:[1,1,1],leaf:[1,1,1],trees:[],sc:0,dn:0,wood:-2,pond:0.25,bush:0,flower:0,rock:0.004,ice:true},
  {k:'desert',n:'Desert',map:'#d8c48a',top:SAND,sub:SANDSTONE,grass:[1.8,1.0,1.3],leaf:[1.35,1.0,1.0],trees:[['cactus',0.75],['dead',0.25]],sc:0.004,dn:0,wood:-2,pond:-1,bush:0,flower:0,rock:0.002},
  {k:'badlands',n:'Badlands',map:'#c0703f',top:RED_SAND,sub:TERRA,grass:[1.8,0.95,1.2],leaf:[1.35,1.0,1.0],trees:[['dead',0.8],['cactus',0.2]],sc:0.002,dn:0,wood:-2,pond:-1,bush:0,flower:0,rock:0.006},
  {k:'scrub',n:'Scrubland',map:'#9a9a5a',grass:[1.42,0.91,1.32],leaf:[1.3,0.95,1.1],trees:[['oak',0.4],['dead',0.3],['acacia',0.3]],sc:0.006,dn:0.03,wood:-0.2,pond:-0.3,bush:0.05,flower:0.008,rock:0.004,gravel:0.04},
  {k:'savanna',n:'Savanna',map:'#b4a650',grass:[1.8,1.0,1.3],leaf:[1.4,1.05,1.0],trees:[['acacia',1]],sc:0.004,dn:0.02,wood:-0.35,pond:0,bush:0.025,flower:0.01,rock:0.002},
  {k:'rainforest',n:'Rainforest',map:'#2f6a28',grass:[0.58,0.85,0.75],leaf:[0.7,0.95,0.8],trees:[['jungle',0.6],['oak',0.4]],sc:0.06,dn:0.2,wood:0.7,pond:0.15,bush:0.08,flower:0.03,rock:0.001},
  {k:'swamp',n:'Swamp',map:'#55704a',sub:MUD,grass:[0.84,0.69,1.04],leaf:[0.85,0.8,1.0],trees:[['swamp',1]],sc:0.012,dn:0.1,wood:0.1,pond:0.6,bush:0.03,flower:0.01,rock:0.0005,reeds:0.25},
  {k:'moor',n:'Moor',map:'#86707a',grass:[1.26,0.6,1.8],leaf:[1.15,0.8,1.2],trees:[['oak',0.3],['dead',0.7]],sc:0.0015,dn:0.01,wood:-0.6,pond:0.2,bush:0.03,flower:0.03,rock:0.014}
];
const BIO_I={};BIOMES.forEach((B,i)=>{BIO_I[B.k]=i;B.i=i;});
const BIO_GRASS=0;
// the table: temperature rows (frozen, cold, temperate, warm, hot) by moisture columns (arid, dry, moderate, wet, soaked)
const BIO_T=[0.2,0.36,0.64,0.8],BIO_M=[0.22,0.4,0.62,0.8];
const BIO_TAB=[
  ['ice','ice','tundra','taiga','taiga'],
  ['tundra','tundra','moor','taiga','swamp'],
  ['grassland','grassland','grassland','forest','swamp'],
  ['desert','scrub','savanna','forest','rainforest'],
  ['desert','desert','savanna','rainforest','rainforest']].map(r=>r.map(k=>BIO_I[k]));
const bioBand=(v,E)=>v<E[0]?0:v<E[1]?1:v<E[2]?2:v<E[3]?3:4;
// the biome a climate (t, m) gives, at block (x,z) (badlands are hot dry ground where a patch noise says so)
function bioPick(t,m,x,z){let b=BIO_TAB[bioBand(t,BIO_T)][bioBand(m,BIO_M)];
  if(b===BIO_I.desert&&t>0.84&&nzNoise(x/2600,z/2600,2411)>0.12)b=BIO_I.badlands;return b;}
// (one corner of the lattice: its climate, its biome, and the smooth fields blended between corners: grass and leaf tints,
// how much likelier ponds are, how much thicker the woods)
function clCorner(ix,iz){
  if(clSeed!==seed){clSeed=seed;CL_C.clear();}
  const k=ix*100003+iz;let E=CL_C.get(k);if(E)return E;
  const x=ix*CL_SP,z=iz*CL_SP,c=climateAt(x,z),B=BIOMES[bioPick(c.t,c.m,x,z)];
  E={t:c.t,m:c.m,b:B.i,gr:B.grass,lf:B.leaf,pond:B.pond,wood:B.wood};
  if(CL_C.size>200000)CL_C.clear();CL_C.set(k,E);return E;
}
// the climate at block (x,z), blended from the lattice. Into CLIM, with CLIM.u, CLIM.v and the four corners in CL_Q for
// the blended fields
const CL_Q=[null,null,null,null];
function climAt(x,z){
  const fx=x/CL_SP,fz=z/CL_SP,ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz;
  const a=CL_Q[0]=clCorner(ix,iz),b=CL_Q[1]=clCorner(ix+1,iz),c=CL_Q[2]=clCorner(ix,iz+1),d=CL_Q[3]=clCorner(ix+1,iz+1);
  CLIM.u=u;CLIM.v=v;
  CLIM.t=(a.t*(1-u)+b.t*u)*(1-v)+(c.t*(1-u)+d.t*u)*v;CLIM.m=(a.m*(1-u)+b.m*u)*(1-v)+(c.m*(1-u)+d.m*u)*v;
  return CLIM;
}
// (a blended field of the corners just asked, by name)
function clBlend(f){const u=CLIM.u,v=CLIM.v,Q=CL_Q;return (Q[0][f]*(1-u)+Q[1][f]*u)*(1-v)+(Q[2][f]*(1-u)+Q[3][f]*u)*v;}
// the biome of the column at block (x,z): the table, from the blended climate dithered a little per column, so the edge
// between two biomes is ragged rather than a line. (Every column has one: towns are in a biome too, for their grass)
function biomeAt(x,z){
  const c=climAt(x,z),j=hash2(x*7+2203,z*13+2207)-0.5,j2=hash2(x*11+2213,z*5+2221)-0.5;
  return bioPick(c.t+j*0.03,c.m+j2*0.03,x,z);
}
// the biome a plot's mostly in (its middle, no dithering): for the maps and the far view
const biomeOfPlot=(px,pz)=>{const x=px*CELL+16,z=pz*CELL+16,c=climAt(x,z);return bioPick(c.t,c.m,x,z);};
// the grass (g 0) or leaf (g 1) tint at block (x,z), blended between the lattice's corners: into BIO_TINT
const BIO_TINT=[1,1,1];
function bioTint(x,z,g){climAt(x,z);const u=CLIM.u,v=CLIM.v,Q=CL_Q,f=g?'lf':'gr';
  for(let i=0;i<3;i++)BIO_TINT[i]=(Q[0][f][i]*(1-u)+Q[1][f][i]*u)*(1-v)+(Q[2][f][i]*(1-u)+Q[3][f][i]*u)*v;return BIO_TINT;}
