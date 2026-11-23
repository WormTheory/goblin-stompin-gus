// ---- relief (docs/biomes-plan.md, sections 4.2 and 5): how high the land stands in the wilds. Everything built stays at
// G (the datum rule): towns, farms, sites, roads, railways and rivers. The land only rises away from them, so towns sit in
// basins and valleys with hills and mountains between; a road or railway meets high ground in a cutting, or once the land
// over it is higher than RLF_TUN a tunnel; rivers run in wide valleys. Three parts, all from the seed and the place:
//   hills: the plains' rolling ground and ponds as before (plainsRaw)
//   mountains: ruggedness R (a slow field, worked out on the climate's lattice and blended) sets how tall the land may get
//     (RLF_TOP), and ridged noise shapes ranges and crests under that
//   lakes: hollows below the datum where the land's low and wet, filled with water up to G
// The World Generator's Land shape sliders scale them (WORLD_CFG's mtn, mth, hill, lakes) ----
const RLF={hill:0,mtn:0,lake:0,r:0,cut:false,tun:false,ter:false,tw:false,dune:0,salt:false,face:false,wl:-99,oas:false};
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
// the land's own height at (x,z) in blocks above G, before anything built flattens it: its parts into RLF (feat: with the
// tarns and oases)
function reliefNat(x,z,feat){
  // (with feat (plainsH asks so), a tarn or an oasis here too: looked up first, as working one out asks the land round it,
  // and plainsRaw then sets the climate back to this place's. Without, the land as it lies, for what looks far and wide:
  // the far view's distant rings, the plots' biomes, the World Generator)
  const no=!feat||RLF_TN||!RLF_VON,TN=no?null:rlfInCell(x,z,TARN_SP,rlfTarnAt),OA=no?null:rlfInCell(x,z,OAS_SP,rlfOasisAt);   // (left out with the valleys, zoomed far out)
  const hill=plainsRaw(x,z)*WORLD_CFG.hill,r=clBlend('r'),m=CLIM.m;   // (plainsRaw has just asked the climate here)
  const top=Math.min(RLF_MAX,rlfTop(r)*WORLD_CFG.mth);let mtn=0,lake=0;
  if(top>0.3){const w=nzWarp(x,z,1400,380,3307),P=nzRidged(w[0],w[1],900,4,3301);mtn=top*(0.12+0.88*P*P)*rlfValley(x,z);}
  // (lakes: low, wet ground only, deepest where it's flattest)
  if(r<0.4&&WORLD_CFG.lakes>0){const L=nzFbm(x,z,800,3,3401),th=-0.3+0.3*(m-0.5);if(L<th)lake=Math.min(RLF_LAKE,(th-L)*60)*WORLD_CFG.lakes*(1-r/0.4)*nzSmooth(START_R0*START_R0,START_R1*START_R1,x*x+z*z);}   // (none round the start, as there are no mountains there)
  if(RLF_VON){const sl=rlfSrcLake(x,z);if(sl>lake)lake=sl;}
  // (the landforms of phase 3: dunes on the hills' part, so they ease out by the roads as the hills do; mesas, plateaus and
  // escarpments on the mountains' part, cut back from what's built as the mountains are; salt flats level the ground)
  const du=clBlend('dune'),me=clBlend('mesa'),sa=clBlend('salt');let h2=hill;RLF.dune=0;RLF.salt=false;RLF.face=false;
  if(sa>0.5){const L=nzFbm(x,z,700,2,3551);if(L<0.02){const s=nzSmooth(-0.1,0.02,L);h2*=s;if(L<-0.1)RLF.salt=true;}}
  if(du>0.02&&!RLF.salt){const d=rlfDune(x,z)*du*WORLD_CFG.hill*(sa>0.5?nzSmooth(-0.1,0.05,nzFbm(x,z,700,2,3551)):1);h2+=d;RLF.dune=d;}
  if(me>0.02){mtn+=rlfMesa(x,z,me)*WORLD_CFG.mth;h2*=1-0.85*RLF_MS;}   // (a mesa's top is flat: the hills smoothed out on it)
  if(r>0.25&&r<0.7)mtn+=rlfCliff(x,z,r)*rlfValley(x,z);
  RLF.wl=-99;RLF.oas=false;
  // (an oasis: a little lake at the datum with a ring of green round it, the dunes dying away toward it)
  if(OA){const d=rlfLen(x-OA.x,z-OA.z);if(d<OA.R+40){const k=nzSmooth(OA.R+8,OA.R+40,d);h2-=RLF.dune*(1-k);RLF.dune*=k;
    if(d<OA.R){const v=1+4*(1-d*d/(OA.R*OA.R));if(v>lake)lake=v;}if(d<OA.R+9)RLF.oas=true;}}
  // (a tarn: a mountain lake in a bowl, its water at the lowest point of its rim (RLF.wl), the rim built up round it so it
  // holds)
  if(TN){const d=rlfLen(x-TN.x,z-TN.z),L=TN.L;if(d<TN.R+12){const t0=h2+mtn-lake;let t=t0;
    if(d<TN.R){t=Math.min(t0,L-1-4*(1-d*d/(TN.R*TN.R)));RLF.wl=L;}
    else t=Math.max(t0,d<TN.R+4?L+1:L+1-(d-TN.R-4)*1.5);
    mtn+=t-t0;}}
  RLF.hill=h2;RLF.mtn=mtn;RLF.lake=lake;RLF.r=r;
  return h2+mtn-lake;
}
// ---- landforms (docs/biomes-plan.md, phase 3) ----
// dunes: long ridges across the world's wind (one way per world, RLF_DW, a whole-number direction so no trig: [dx,dz,its
// length]), gentle on the windward side and steep on the lee (the slip face), 3 to 12 blocks high, wandering and broken
// up along their length
const RLF_DW=[[4,3,5],[3,4,5],[-3,4,5],[-4,3,5],[5,12,13],[12,5,13],[-12,5,13],[-5,12,13]];let RLF_DS=null,RLF_DD=null;
function rlfDune(x,z){
  if(RLF_DS!==seed){RLF_DS=seed;RLF_DD=RLF_DW[Math.floor(hash2(7717,9931)*8)];}const D=RLF_DD;
  const w=nzWarp(x,z,320,28,3501),wx=w[0],wz=w[1],u=(wx*D[0]+wz*D[1])/D[2]/46,f=u-Math.floor(u);
  let p=f<0.74?f/0.74:(1-f)/0.26;p=p*p*(3-2*p);
  const a=3+9*nzClamp01(0.5+0.9*nzFbm(x,z,260,2,3511)),br=nzSmooth(-0.45,0.1,nzFbm(wx,wz,140,1,3521));   // (how tall; and where a ridge dies away)
  return a*p*br;
}
// mesas: flat-topped tables 18 to 40 blocks high whose sides go up in steps of 5 (terraces of banded clay, as the
// badlands' ground is), plateaus where they're broad; canyons cut down through them to the datum along ridged noise's
// crests. me is how much of the badlands' (1) or scrubland's (0.5) there is here
let RLF_MS=0;   // (how much of the last place asked is on a mesa, 0 to 1)
function rlfMesa(x,z,me){
  const w=nzWarp(x,z,600,90,3523),n=nzFbm(w[0],w[1],700,3,3525),th=0.08-0.12*me;RLF_MS=0;if(n<th)return 0;
  const s=nzSmooth(th,th+0.035,n),H=(18+22*nzClamp01(0.5+nzFbm(x,z,2500,1,3531)))*me;
  const c=nzRidged(w[0],w[1],520,2,3541),k=1-nzSmooth(0.84,0.9,c);   // (a canyon)
  RLF_MS=s*k;
  return Math.floor(s*k*H/5)*5;
}
// escarpments: in middling country (ruggedness r 0.3 to 0.6) the land steps up a cliff of up to 14 blocks along a line
// that wanders for kilometres, high ground one side and low the other. RLF.face: on the cliff, so it's bare rock
function rlfCliff(x,z,r){
  const b=nzSmooth(0.25,0.35,r)*(1-nzSmooth(0.6,0.7,r));if(b<=0)return 0;
  const w=nzWarp(x,z,700,120,3561),e=nzFbm(w[0],w[1],1600,2,3571),p=nzClamp01((e-0.05)/0.008);
  if(p>0.04&&p<0.96)RLF.face=true;
  return 14*b*p*WORLD_CFG.mth;
}
// ---- tarns, oases and sinkholes: at most one of each kind per cell of a lattice (TARN_SP, OAS_SP, SINK_SP blocks), its
// middle kept 64 blocks inside the cell so all of it is in the cell; each worked out once (RLF_TC). RLF_TN: working one
// out (asking plainsH round it) ----
const TARN_SP=448,OAS_SP=640,SINK_SP=384,RLF_TC=new Map();let RLF_TN=false,RLF_TCS=null;
function rlfCell(SP,fn,ix,iz){
  if(RLF_TCS!==seed){RLF_TCS=seed;RLF_TC.clear();}
  const k=(ix*100003+iz)*4+(SP===TARN_SP?0:SP===OAS_SP?1:2);if(RLF_TC.has(k))return RLF_TC.get(k);
  const cx=Math.floor(ix*SP+64+hash2(ix*31+SP,iz*17+3)*(SP-128)),cz=Math.floor(iz*SP+64+hash2(ix*7+1,iz*43+SP)*(SP-128)),v=fn(ix,iz,cx,cz);
  if(RLF_TC.size>50000)RLF_TC.clear();RLF_TC.set(k,v);return v;}
const rlfInCell=(x,z,SP,fn)=>rlfCell(SP,fn,Math.floor(x/SP),Math.floor(z/SP));
// (all open plains round (cx,cz), n plots each way)
function rlfOpen(cx,cz,n){const px=Math.floor(cx/CELL),pz=Math.floor(cz/CELL);for(let a=-n;a<=n;a++)for(let b=-n;b<=n;b++)if(!PLAINS_OPEN(px+a,pz+b))return false;return true;}
const RLF_D8=[[1,0],[-1,0],[0,1],[0,-1],[0.7071,0.7071],[-0.7071,0.7071],[0.7071,-0.7071],[-0.7071,-0.7071]];
// a tarn: up in the mountains (ruggedness over 0.55), well away from roads, rivers and anything built (so nothing cuts its
// rim down); its water level is the lowest of its rim, the land's own height there, which must be high ground
function rlfTarnAt(ix,iz,cx,cz){
  if(hash2(ix*13+5,iz*29+1)>0.7||WORLD_CFG.lakes<=0)return null;
  if(clCorner(Math.round(cx/CL_SP),Math.round(cz/CL_SP)).r<0.55||!rlfOpen(cx,cz,3))return null;
  const R=7+Math.floor(hash2(ix*3+9,iz*5+7)*9);if(roadNear(cx,cz)<R+30)return null;
  {const P=rlfVList(cx,cz).P;for(let q=0;q<P.length;q+=2){const [ax,az]=P[q].pts[P[q+1]];if(rlfLen(ax-cx,az-cz)<R+70)return null;}}
  RLF_TN=true;let L=1e9;for(const [a,b] of RLF_D8)L=Math.min(L,Math.round(reliefNat(Math.floor(cx+a*(R+10)),Math.floor(cz+b*(R+10)))));const c=reliefNat(cx,cz);RLF_TN=false;
  if(L<12||c<6)return null;
  return {x:cx,z:cz,R,L:L-1};}
// an oasis: in the open desert (not a salt flat)
function rlfOasisAt(ix,iz,cx,cz){
  if(hash2(ix*11+3,iz*19+5)>0.4||WORLD_CFG.lakes<=0)return null;
  const E=clCorner(Math.round(cx/CL_SP),Math.round(cz/CL_SP));if(E.dune<1||E.salt||!rlfOpen(cx,cz,1))return null;
  return {x:cx,z:cz,R:9+Math.floor(hash2(ix*5+1,iz*7+3)*7)};}
// a sinkhole: a round shaft down toward the caves (bot: its floor), on open ground clear of roads and rivers, with water at
// the bottom in warm country (a cenote). Not in the ice fields
function rlfSinkAt(ix,iz,cx,cz){
  if(hash2(ix*17+9,iz*23+7)>0.15||cx*cx+cz*cz<START_R0*START_R0)return null;   // (none in the start's flat country)
  const E=clCorner(Math.round(cx/CL_SP),Math.round(cz/CL_SP));if(BIOMES[E.b].ice||!rlfOpen(cx,cz,0))return null;
  const R=3+Math.floor(hash2(ix*9+2,iz*3+4)*4);if(roadNear(cx,cz)<R+14)return null;
  return {x:cx,z:cz,R,bot:12+Math.floor(hash2(ix*5+6,iz*11+2)*8),wet:E.t>0.55};}
// (how far (x,z) is outside a sinkhole's shaft (below 0: inside), and the sinkhole in RLF_SK; 99 if none near)
let RLF_SK=null;
function rlfSinkD(x,z){const S=RLF_SK=rlfInCell(x,z,SINK_SP,rlfSinkAt);if(!S)return 99;return rlfLen(x+0.5-S.x,z+0.5-S.z)-S.R;}
// a sinkhole's column, cut into what plainsColumn made: open down to its floor, undercut round the bottom, water there in
// warm country, a ring of mossy stone round its lip
function sinkColumn(col,x,z){
  const d=rlfSinkD(x,z),S=RLF_SK;if(d>=3)return;const h=plainsH(x,z);if(h<0||RLF.wl>-99)return;
  const top=G+h,b=S.bot;
  if(d<0){col(b,STONE);for(let y=b+1;y<=top+3;y++)col(y,S.wet&&y<=b+4?WATER:AIR);return;}
  for(let y=b+1;y<=b+5;y++)col(y,S.wet&&y<=b+4?WATER:AIR);col(b,STONE);
  if(d<1)col(top,MOSSSTONE);}
// (how far (x,z) is outside an oasis's water (below 0: in it); 99 if none near)
function rlfOasisD(x,z){const O=rlfInCell(x,z,OAS_SP,rlfOasisAt);return O?rlfLen(x-O.x,z-O.z)-O.R:99;}
// ---- river valleys: the rivers (world/routes.js) wind through the mountains, so near one the mountains are let stand
// only so far: nothing on its floor (RLF_VM for a river, RLF_VT a tributary: [blocks of flat floor past its banks, how far
// out the sides go up to their full height]), rising in a smooth curve to full height. Worked out at the corners of a 16-
// block lattice and blended, as a valley's hundreds of blocks across; the steep last stretch by the banks is reliefMask's.
// And a lake at a river's source in low country (R.src: where, how wide). RLF_VON off (rlfValleys) leaves both out: the
// World Generator does, zoomed far out, where they're too small to see and would need every river on the continent ----
const RLF_VM=[30,340],RLF_VT=[12,170],RLF_VR=420,RLF_VC=new Map(),RLF_VL=new Map();var RLF_VON=true;
const rlfValleys=on=>{RLF_VON=!!on;};
// (the river pieces within RLF_VR of a 256-block square, and the sources with lakes among them)
function rlfVList(x,z){const k=Math.floor(x/256)*100003+Math.floor(z/256);let l=RLF_VL.get(k);if(l)return l;
  if(RLF_VL.size>4000)RLF_VL.clear();const X=Math.floor(x/256)*256,Z=Math.floor(z/256)*256,P=riversNearBox(X-RLF_VR,Z-RLF_VR,X+256+RLF_VR,Z+256+RLF_VR),S=[];
  for(let q=0;q<P.length;q+=2){const R=P[q];if(R.src&&!S.includes(R))S.push(R);}
  l={P,S};RLF_VL.set(k,l);return l;}
function rlfVCorner(cx,cz){const k=cx*100003+cz;let v=RLF_VC.get(k);if(v!==undefined)return v;v=1;
  const x=cx*16,z=cz*16,L=rlfVList(x,z).P;
  for(let q=0;q<L.length&&v>0;q+=2){const R=L[q],i=L[q+1],P=R.pts,ax=P[i][0],az=P[i][1],dx=P[i+1][0]-ax,dz=P[i+1][1]-az,l2=dx*dx+dz*dz||1e-9;
    const F=R.trib?RLF_VT:RLF_VM,ex0=x-ax,ez0=z-az;if(ex0*ex0+ez0*ez0>(F[0]+F[1]+R.w+40)*(F[0]+F[1]+R.w+40)+l2*4)continue;
    let t=(ex0*dx+ez0*dz)/l2;t=t<0?0:t>1?1:t;const ex=ex0-dx*t,ez=ez0-dz*t,u=(rlfLen(ex,ez)-R.w-4-F[0])/F[1];
    const s=u<=0?0:u>=1?1:u*u*(3-2*u);if(s<v)v=s;}
  if(RLF_VC.size>300000)RLF_VC.clear();RLF_VC.set(k,v);return v;}
function rlfValley(x,z){if(!RLF_VON)return 1;const fx=x/16,fz=z/16,cx=Math.floor(fx),cz=Math.floor(fz),u=fx-cx,w=fz-cz;
  const a=rlfVCorner(cx,cz),b=rlfVCorner(cx+1,cz),c=rlfVCorner(cx,cz+1),d=rlfVCorner(cx+1,cz+1);
  return (a+(b-a)*u)*(1-w)+(c+(d-c)*u)*w;}
// (how deep a source's lake is at (x,z): a round hollow, deepest in the middle)
function rlfSrcLake(x,z){const S=rlfVList(x,z).S;let L=0;
  for(const R of S){const [sx,sz,r]=R.src,dx=x-sx,dz=z-sz,d2=dx*dx+dz*dz;if(d2<r*r){const v=(RLF_LAKE+3)*(1-d2/(r*r))+1;if(v>L)L=v;}}
  return L;}
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
// (how far in from the water's edge the column plainsH is asking about is, on a block by the sea; 1e9 elsewhere)
var RLF_SW=1e9;
function reliefMask(x,z,px,pz,mtn,tot){
  let cap=mtn;RLF.cut=false;RLF.tun=false;RLF.ter=false;RLF.tw=false;
  const lim=Math.min(90,mtn/0.7+6),q=(d,k,v)=>{const c=Math.max(0,d-v)*k;if(c<cap)cap=c;};
  {const d=rlfDist(rlfLines16(rlfRt16,rlfRtC,routesNearBox,x,z),x,z,mtn/2+12),R=RLF_NR;if(R){const tn=RLF_TUN+(R.kind==='moto'?R.HY-G:0);if(tot>tn)RLF.tun=true;else q(d-9.6,2,1);}}
  if(cap>0){const d=railDist(x,z,mtn/2+6);if(d<mtn/2+6){if(tot>RLF_TUN)RLF.tun=true;else q(d-2.5,2,1);}}
  if(cap>0){const d=rlfDist(rlfLines16(rlfRv16,rlfRvC,riversNearBox,x,z),x,z,lim);if(RLF_NR)q(d-RIV_W-4,0.7,2);}
  if(cap>0){q(rlfLane(x,z,px,pz),1.5,0);q(linkNear(x,z),1.5,1);
    const k=Math.floor(x/16)*100003+Math.floor(z/16);if(!tsC.has(k))tsAt(x,z);for(const T of tsC.get(k)||[]){const dx=x+0.5-T.cx,dz=z+0.5-T.cz,u=dx*T.tx+dz*T.tz,v=dx*T.nx+dz*T.nz;
      q(rlfLen(Math.max(0,Math.abs(u)-46),Math.max(0,v-60,6.5-v))-2,1.5,1);}}
  if(cap>0)for(const A of rlfAir(px,pz))q(rlfLen(Math.max(0,A[0]-x,x-A[2]),Math.max(0,A[1]-z,z-A[3])),A[4],0);
  // (the edges of the blocks round about that aren't open plains, two blocks out for the taller mountains: the land's
  // graded up from them in terraces, 3 blocks high and 4 deep, each held up by a retaining wall (RLF.tw: a column on the
  // wall's top edge), rather than cut back to a rock face)
  if(cap>0)q(RLF_SW,1.2,0);   // (rising off a natural shore no more steeply than off a town's edge)
  if(cap>0){const rx=x-px*CELL,rz=z-pz*CELL,R=mtn>36?2:1;let e=1e9;
    for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++){if(!dx&&!dz||LAND_OPEN(px+dx,pz+dz))continue;
      const ex=dx<0?rx+(-dx-1)*CELL:dx>0?(dx-1)*CELL+CELL-1-rx:0,ez=dz<0?rz+(-dz-1)*CELL:dz>0?(dz-1)*CELL+CELL-1-rz:0,d=rlfLen(ex,ez);if(d<e)e=d;}
    const u=Math.max(0,e-2),k=Math.floor(u/4);if(3*k<cap){cap=3*k;RLF.ter=true;RLF.tw=k>=1&&u-4*k<1;}}
  if(cap<mtn-2&&cap>2&&!RLF.ter)RLF.cut=true;
  return cap;
}
// (the heights above G where the trees stop and the ground's bare rock and scree, and where it's snow all year: lower the
// colder the climate, t from climateAt)
const rlfSnow=t=>48+70*t,rlfRock=t=>rlfSnow(t)-20;
// the top of the ground at (x,z) as the chunks will make it, for what moves over land that isn't made yet (a plane): the
// open plains' height, else G
function landTop(x,z){const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);return G+1+(realmOf(px,pz)==='plains'||SHORE_OPEN(px,pz)?Math.max(0,plainsH(Math.floor(x),Math.floor(z))):0);}
// the land's relief on the maps: a plains block split n x n, each cell its biome's colour, bare rock or snow by height
// and lake water below the datum, shaded as if lit from the north-west. A list of n*n colours, or null where it's flat
// (just the biome's colour). Kept per block and n (the land's height is from the seed alone)
const RLF_MAPC=new Map();let rlfMapSeed=null;
function reliefMapCells(px,pz,n){
  const key=(px*100003+pz)*16+n;if(RLF_MAPC.has(key))return RLF_MAPC.get(key);
  if(rlfMapSeed!==seed){rlfMapSeed=seed;RLF_MAPC.clear();}if(RLF_MAPC.size>60000)RLF_MAPC.clear();
  if(!PLAINS_OPEN(px,pz)){RLF_MAPC.set(key,null);return null;}
  const st=CELL/n,base=BIOMES[biomeOfPlot(px,pz)].map,C=[];let any=false;
  const hAt=(x,z)=>plainsH(Math.floor(x),Math.floor(z));   // (the land as the chunks build it: levelled by the roads, the rivers and the edges of what's built)
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const x=px*CELL+(i+0.5)*st,z=pz*CELL+(j+0.5)*st,h=hAt(x,z),t=CLIM.t,d=Math.max(2,st/2);
    if(h<-0.9){C.push(MAPC.river);any=true;continue;}
    if(RLF.salt&&h===0){C.push('#e8e4d8');any=true;continue;}
    if(RLF.wl>h){C.push(MAPC.river);any=true;continue;}
    const s=((h-hAt(x-d,z))+(h-hAt(x,z-d)))/d;   // (facing the light: brighter; away from it: darker)
    let col=h>rlfSnow(t)?'#eef2f4':h>rlfRock(t)?'#8c8a84':base;
    const k=Math.max(-0.45,Math.min(0.45,s*0.35))+Math.min(0.12,h/600);
    if(col!==base||Math.abs(k)>0.03){any=true;col=mapShade(col,k);}
    C.push(col);}
  const r=any?C:null;RLF_MAPC.set(key,r);return r;
}
// (a map colour lightened (k>0) or darkened (k<0))
function mapShade(c,k){const v=parseInt(c.slice(1),16),f=x=>Math.round(k>0?x+(255-x)*k:x*(1+k)).toString(16).padStart(2,'0');return '#'+f(v>>16&255)+f(v>>8&255)+f(v&255);}
