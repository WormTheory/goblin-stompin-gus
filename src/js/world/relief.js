// ---- relief (docs/biomes-plan.md, sections 4.2 and 5): how high the land stands in the wilds. Everything built stays at
// G (the datum rule): towns, farms, sites, roads, railways and rivers. The land only rises away from them, so towns sit in
// basins and valleys with hills and mountains between; a road or railway meets high ground in a cutting, or once the land
// over it is higher than RLF_TUN a tunnel; rivers run in wide valleys. Three parts, all from the seed and the place:
//   hills: the plains' rolling ground and ponds as before (plainsRaw)
//   mountains: ruggedness R (a slow field, worked out on the climate's lattice and blended) sets how tall the land may get
//     (RLF_TOP), and ridged noise shapes ranges and crests under that
//   lakes: hollows below the datum where the land's low and wet, filled with water up to G
// The World Generator's Land shape sliders scale them (WORLD_CFG's mtn, mth, hill, lakes) ----
const RLF={hill:0,mtn:0,lake:0,r:0,cut:false,tun:false};
// (a length: Math.sqrt is exact in every browser, Math.hypot may differ in the last bit, and the land must be the same
// for every player online)
const rlfLen=(a,b)=>Math.sqrt(a*a+b*b);
// (how tall the land may get for each ruggedness, in blocks above G, straight lines between; the most it ever reaches;
// the height of land over a road or railway past which it's a tunnel rather than a cutting; the deepest lake)
const RLF_TOP=[[0,0],[0.3,2],[0.55,12],[0.75,45],[1,110]],RLF_MAX=135,RLF_TUN=22,RLF_LAKE=7;
function rlfTop(r){const S=RLF_TOP;if(r<=0)return 0;for(let i=1;i<S.length;i++)if(r<=S[i][0]){const a=S[i-1],b=S[i];return a[1]+(b[1]-a[1])*(r-a[0])/(b[0]-a[0]);}return S[S.length-1][1];}
// ruggedness at block (x,z), 0 (plains) to 1 (high mountains): broad warped noise in ranges some thousands of blocks long,
// never round the start (flat within START_R0, as the climate's always temperate there). Asked once per lattice corner
function ruggedAt(x,z){
  const w=nzWarp(x,z,9000,2500,3101);
  const r=(0.4+1.6*nzFbm(w[0],w[1],7000,3,3203)+WORLD_CFG.mtn)*nzSmooth(START_R0*START_R0,START_R1*START_R1,x*x+z*z);
  return nzClamp01(r);
}
// the land's own height at (x,z) in blocks above G, before anything built flattens it: its parts into RLF
function reliefNat(x,z){
  const hill=plainsRaw(x,z)*WORLD_CFG.hill,r=clBlend('r'),m=CLIM.m;   // (plainsRaw has just asked the climate here)
  const top=Math.min(RLF_MAX,rlfTop(r)*WORLD_CFG.mth);let mtn=0,lake=0;
  if(top>0.3){const w=nzWarp(x,z,1400,380,3307),P=nzRidged(w[0],w[1],900,4,3301);mtn=top*(0.12+0.88*P*P);}
  // (lakes: low, wet ground only, deepest where it's flattest)
  if(r<0.4&&WORLD_CFG.lakes>0){const L=nzFbm(x,z,800,3,3401),th=-0.3+0.3*(m-0.5);if(L<th)lake=Math.min(RLF_LAKE,(th-L)*60)*WORLD_CFG.lakes*(1-r/0.4);}
  RLF.hill=hill;RLF.mtn=mtn;RLF.lake=lake;RLF.r=r;
  return hill+mtn-lake;
}
// (the lines further off than routeAt and riverAt look, for the slopes up from them: a list per 64-block square)
// (and per 16-block square, only those pieces within 96 of it: a column of mountain asks for the nearest of them)
const rlfRtC=new Map(),rlfRvC=new Map(),rlfRt16=new Map(),rlfRv16=new Map();
function rlfLines(C,near,x,z){const k=Math.floor(x/64)*100003+Math.floor(z/64);let l=C.get(k);
  if(!l){if(C.size>3000)C.clear();const X=Math.floor(x/64)*64,Z=Math.floor(z/64)*64;l=near(X-72,Z-72,X+135,Z+135);C.set(k,l);}return l;}
function rlfLines16(C16,C,near,x,z){const k=Math.floor(x/16)*100003+Math.floor(z/16);let l=C16.get(k);if(l)return l;
  if(C16.size>20000)C16.clear();const L=rlfLines(C,near,x,z),X=Math.floor(x/16)*16+8,Z=Math.floor(z/16)*16+8;l=[];
  for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1],P=R.pts,[ax,az]=P[i],[bx,bz]=P[i+1],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-9;
    let t=((X-ax)*dx+(Z-az)*dz)/l2;t=t<0?0:t>1?1:t;const ex=X-ax-dx*t,ez=Z-az-dz*t;if(ex*ex+ez*ez<108*108)l.push(R,i);}
  C16.set(k,l);return l;}
// how far (x,z) is from the nearest of those pieces, out to lim (or lim if none), the route it's on in RLF_NR
let RLF_NR=null;
function rlfDist(L,x,z,lim){let bd=lim*lim;RLF_NR=null;
  for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1],P=R.pts,A=P[i],B=P[i+1],ax=A[0],az=A[1],dx=B[0]-ax,dz=B[1]-az,l2=dx*dx+dz*dz||1e-9;
    let t=((x-ax)*dx+(z-az)*dz)/l2;t=t<0?0:t>1?1:t;const ex=x-ax-dx*t,ez=z-az-dz*t,d2=ex*ex+ez*ez;if(d2<bd){bd=d2;RLF_NR=R;}}
  return Math.sqrt(bd);}
// how far (x,z) is outside a farm's lane in its block (with the flare where it meets the road, as farmLaneCol), or 99
function rlfLane(x,z,px,pz){const L=farmLane(px,pz);if(!L||z<L.z0-3||z>=L.z1+3)return 99;
  const dx=Math.abs(x+0.5-(px*CELL+PC)),dz=Math.abs(z-L.zEnd),w=dz<=4?1+(4-dz)+0.5:1;return Math.max(0,dx-w,L.z0-z,z-L.z1+1);}
// how far (x,z) is from the nearest railway's track bed, out to lim (railAt only looks 8 blocks out)
function railDist(x,z,lim){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),qx=x+0.5,qz=z+0.5,seen=new Set();let bd=lim;
  for(let i=px-1;i<=px+1;i++)for(let j=pz-1;j<=pz+1;j++)for(const L of railLinksNear(i,j)){if(seen.has(L))continue;seen.add(L);
    if(qx<L.box[0]-lim||qx>L.box[2]+lim||qz<L.box[1]-lim||qz>L.box[3]+lim)continue;
    for(const E of L.el){let d;
      if(E.t==='s'){const al=E.ax==='x'?qx:qz,ac=E.ax==='x'?qz:qx,o=al<E.a0?E.a0-al:al>E.a1?al-E.a1:0;d=rlfLen(o,ac-E.c);}
      else d=Math.abs(rlfLen(qx-E.cx,qz-E.cz)-E.r);   // (a bend: as a whole ring, near enough for a slope)
      if(d<bd)bd=d;}}
  return bd;
}
// (the airports and airfields near plot (px,pz), as boxes in blocks with how steeply the land may rise from each: their
// planes go round at fixed heights, the airliners out to the horizon low and level, so the land stays well under them)
const RLF_AIR=new Map();let RLF_AF=-1;
function rlfAir(px,pz){const k=px*100003+pz;let L=RLF_AIR.get(k);if(L)return L;L=[];
  const rx0=Math.round(px/SET_SP),rz0=Math.round(pz/SET_SP);
  for(let rx=rx0-1;rx<=rx0+1;rx++)for(let rz=rz0-1;rz<=rz0+1;rz++){const S=settlementLat(rx,rz);if(S.type!=='city'||settlementAt(S.cx,S.cz)!==S)continue;
    if(S.ap===undefined&&apBusy)return L;const A=airportOf(S);if(A)L.push([A.ax*CELL,A.az*CELL,(A.ax+A.w)*CELL,(A.az+A.h)*CELL,0.12]);}
  if(RLF_AF<0)RLF_AF=BIGP.findIndex(K=>K.kind==='airfield');const K=BIGP[RLF_AF];
  for(let ax=Math.floor((px-12)/K.w)*K.w;ax<=px+12;ax+=K.w)for(let az=Math.floor((pz-12)/K.h)*K.h;az<=pz+12;az+=K.h)
    if(bigCell(RLF_AF,ax,az))L.push([ax*CELL,az*CELL,(ax+K.w)*CELL,(az+K.h)*CELL,0.25]);
  if(!apBusy){if(RLF_AIR.size>20000)RLF_AIR.clear();RLF_AIR.set(k,L);}return L;}
// the mountains' part at (x,z) as it's let stand beside what's built: each thing nearby lets the land rise only so steeply
// from it (a road or railway in a cutting, 2 blocks up for every block out past its verge; a river's valley 0.7; a town's,
// farm's or site's edge 1.2; a truck stop, farm lane or town street 1.5). Over a road or railway it's a tunnel instead,
// once the land's higher than RLF_TUN (a motorway's deck counts too). RLF.cut: cut back, so its face is bare rock;
// RLF.tun: left standing over a road or railway
function reliefMask(x,z,px,pz,mtn,tot){
  let cap=mtn;RLF.cut=false;RLF.tun=false;
  const lim=Math.min(90,mtn/0.7+6),q=(d,k,v)=>{const c=Math.max(0,d-v)*k;if(c<cap)cap=c;};
  {const d=rlfDist(rlfLines16(rlfRt16,rlfRtC,routesNearBox,x,z),x,z,mtn/2+12),R=RLF_NR;if(R){const tn=RLF_TUN+(R.kind==='moto'?R.HY-G:0);if(tot>tn)RLF.tun=true;else q(d-9.6,2,1);}}
  if(cap>0){const d=railDist(x,z,mtn/2+6);if(d<mtn/2+6){if(tot>RLF_TUN)RLF.tun=true;else q(d-2.5,2,1);}}
  if(cap>0){const d=rlfDist(rlfLines16(rlfRv16,rlfRvC,riversNearBox,x,z),x,z,lim);if(RLF_NR)q(d-RIV_W-4,0.7,2);}
  if(cap>0){q(rlfLane(x,z,px,pz),1.5,0);q(linkNear(x,z),1.5,1);
    const k=Math.floor(x/16)*100003+Math.floor(z/16);if(!tsC.has(k))tsAt(x,z);for(const T of tsC.get(k)||[]){const dx=x+0.5-T.cx,dz=z+0.5-T.cz,u=dx*T.tx+dz*T.tz,v=dx*T.nx+dz*T.nz;
      q(rlfLen(Math.max(0,Math.abs(u)-46),Math.max(0,v-60,6.5-v))-2,1.5,1);}}
  if(cap>0)for(const A of rlfAir(px,pz))q(rlfLen(Math.max(0,A[0]-x,x-A[2]),Math.max(0,A[1]-z,z-A[3])),A[4],0);
  // (the edges of the blocks round about that aren't open plains: two blocks out, for the taller mountains)
  if(cap>0){const rx=x-px*CELL,rz=z-pz*CELL,R=mtn>36?2:1;
    for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++){if(!dx&&!dz||PLAINS_OPEN(px+dx,pz+dz))continue;
      const ex=dx<0?rx+(-dx-1)*CELL:dx>0?(dx-1)*CELL+CELL-1-rx:0,ez=dz<0?rz+(-dz-1)*CELL:dz>0?(dz-1)*CELL+CELL-1-rz:0;q(rlfLen(ex,ez),1.2,2);}}
  if(cap<mtn-2&&cap>2)RLF.cut=true;
  return cap;
}
// (the heights above G where the trees stop and the ground's bare rock and scree, and where it's snow all year: lower the
// colder the climate, t from climateAt)
const rlfSnow=t=>48+70*t,rlfRock=t=>rlfSnow(t)-20;
// the top of the ground at (x,z) as the chunks will make it, for what moves over land that isn't made yet (a plane): the
// open plains' height, else G
function landTop(x,z){const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);return G+1+(realmOf(px,pz)==='plains'?Math.max(0,plainsH(Math.floor(x),Math.floor(z))):0);}
// the land's relief on the maps: a plains block split n x n, each cell its biome's colour, bare rock or snow by height
// and lake water below the datum, shaded as if lit from the north-west. A list of n*n colours, or null where it's flat
// (just the biome's colour). Kept per block and n (the land's height is from the seed alone)
const RLF_MAPC=new Map();let rlfMapSeed=null;
function reliefMapCells(px,pz,n){
  const key=(px*100003+pz)*16+n;if(RLF_MAPC.has(key))return RLF_MAPC.get(key);
  if(rlfMapSeed!==seed){rlfMapSeed=seed;RLF_MAPC.clear();}if(RLF_MAPC.size>60000)RLF_MAPC.clear();
  if(!PLAINS_OPEN(px,pz)){RLF_MAPC.set(key,null);return null;}
  const st=CELL/n,base=BIOMES[biomeOfPlot(px,pz)].map,C=[];let any=false;
  const hAt=(x,z)=>reliefNat(x,z);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const x=px*CELL+(i+0.5)*st,z=pz*CELL+(j+0.5)*st,h=hAt(x,z),t=CLIM.t,d=Math.max(2,st/2);
    if(h<-0.9){C.push(MAPC.river);any=true;continue;}
    const s=((h-hAt(x-d,z))+(h-hAt(x,z-d)))/d;   // (facing the light: brighter; away from it: darker)
    let col=h>rlfSnow(t)?'#eef2f4':h>rlfRock(t)?'#8c8a84':base;
    const k=Math.max(-0.45,Math.min(0.45,s*0.35))+Math.min(0.12,h/600);
    if(col!==base||Math.abs(k)>0.03){any=true;col=mapShade(col,k);}
    C.push(col);}
  const r=any?C:null;RLF_MAPC.set(key,r);return r;
}
// (a map colour lightened (k>0) or darkened (k<0))
function mapShade(c,k){const v=parseInt(c.slice(1),16),f=x=>Math.round(k>0?x+(255-x)*k:x*(1+k)).toString(16).padStart(2,'0');return '#'+f(v>>16&255)+f(v>>8&255)+f(v&255);}
