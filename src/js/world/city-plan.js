// ---- the big plan, on a coarse 6x6-block grid: now and then one of these takes a big piece of it --
// a football stadium (4x6), a huge park (6x6 or 4x6), a shopping mall (4x4) or a residential neighbourhood
// (4x4 or 6x6, its streets kept) ----
// the city has one capitol: on the nearest 6x6 plan square to the start that no river runs through
function capitolPlan(){
  let C=superCache.get('capitol');
  if(C===undefined){
    C=null;
    for(const [mx,mz] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[0,2],[-2,0],[0,-2]]){
      const S={ax:mx*6+1,az:mz*6,w:4,h:6,kind:'capitol',mx,mz};if(!rectRail(S.ax,S.az,S.w,S.h)&&!rectRiver(S.ax,S.az,S.w,S.h)&&!rectClover(S.ax,S.az,S.w,S.h)&&!rectRamp(S.ax,S.az,S.w,S.h)&&!rectHighway(S.ax,S.az,S.w,S.h)&&!rectPlains(S.ax,S.az,S.w,S.h)&&!rectCuts(S.ax,S.az,S.w,S.h)){C=S;break;}
    }
    superCache.set('capitol',C);
  }
  return C;
}
function macroOf(px,pz){const M=macroOf1(px,pz);return M&&TEST_OFF.has(M.kind)?null:M;}
// a theme park is 8 x 8, more than one cell of the big plan: it reaches a block into each cell round its own
const THEME_H=0.97,themeHash=(mx,mz)=>{const h=hash2(mx*613+11,mz*389+7);return h>=0.90&&h<THEME_H;};
// (every block of it has to be free to be park: the sea, open country, a station and so on all win over a site, and a park
// with a piece missing is left with half a coaster and a Ferris wheel over somebody's house)
const themeSea=(ax,az)=>{for(let i=0;i<8;i++)for(let j=0;j<8;j++)if(seaPlot(ax+i,az+j)||metroStation(ax+i,az+j))return true;return false;};
// (an edge-of-town site, so where its own cell runs out of town it's moved along a little to find room: it can reach three blocks over)
// (deciding a park asks what's on the blocks round it, and those answers can't see the park yet: they mustn't be remembered,
// or it depends on what was asked first whether part of the park comes out as houses)
let themeBusy=0;
const THEME_OFF=[[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1],[-2,0],[2,0],[0,-2],[0,2],[-2,-1],[2,-1],[-2,1],[2,1],[-1,-2],[1,-2],[-1,2],[1,2],[-2,-2],[2,-2],[-2,2],[2,2]];
function themeOf(mx,mz){
  const k='t'+mx+','+mz;let T=superCache.get(k);if(T!==undefined)return T;T=null;superCache.set(k,null);
  if(Math.max(Math.abs(mx),Math.abs(mz))>=2&&themeHash(mx,mz)){
    let ok=true;const CP=capitolPlan();for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){if((a||b)&&themeHash(mx+a,mz+b))ok=false;if(CP&&CP.mx===mx+a&&CP.mz===mz+b)ok=false;}
    themeBusy++;
    if(ok)for(const [ox,oz] of THEME_OFF){const M={ax:mx*6-1+ox,az:mz*6-1+oz,w:8,h:8,kind:'theme'},ty=setType(M.ax+4,M.az+4);
      if((ty==='city'||ty==='large'||ty==='suburb')&&siteFits('theme',M.ax+4,M.az+4)&&!(rectPlains(M.ax,M.az,8,8)||rectRail(M.ax,M.az,8,8)||rectRiver(M.ax,M.az,8,8)||rectClover(M.ax,M.az,8,8)||rectRamp(M.ax,M.az,8,8)||rectCuts(M.ax,M.az,8,8)||rectHighway(M.ax,M.az,8,8)||themeSea(M.ax,M.az))){T=M;break;}}
    themeBusy--;
  }
  superCache.set(k,T);return T;
}
const themeNear=(mx,mz)=>{const k='tn'+mx+','+mz;let L=superCache.get(k);if(L)return L;L=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){if(!a&&!b)continue;const T=themeOf(mx+a,mz+b);if(T)L.push(T);}if(!themeBusy)superCache.set(k,L);return L;};
const themeHits=(ax,az,w,h)=>{const mx=Math.floor(ax/6),mz=Math.floor(az/6);for(const c of [[mx,mz],[Math.floor((ax+w-1)/6),Math.floor((az+h-1)/6)]]){for(const T of [themeOf(c[0],c[1]),...themeNear(c[0],c[1])])if(T&&ax<T.ax+8&&ax+w>T.ax&&az<T.az+8&&az+h>T.az)return true;}return false;};
function macroOf1(px,pz){
  {const L=themeNear(Math.floor(px/6),Math.floor(pz/6));for(const T of L)if(px>=T.ax&&px<T.ax+8&&pz>=T.az&&pz<T.az+8)return T;}
  const mx=Math.floor(px/6),mz=Math.floor(pz/6),mk='m'+mx+','+mz;let M=superCache.get(mk);
  if(M===undefined){
    M=null;
    const CP=capitolPlan();
    if(CP&&CP.mx===mx&&CP.mz===mz)M=CP;
    else if(Math.max(Math.abs(mx),Math.abs(mz))>=1){
      const h=hash2(mx*613+11,mz*389+7),rot=hash2(mx+3,mz+9)<0.5,off=hash2(mx+7,mz+1)<0.5?0:2,off2=hash2(mx+1,mz+7)<0.5?0:2;
      const strip=kind=>rot?{ax:mx*6,az:mz*6+off,w:6,h:4,kind}:{ax:mx*6+off,az:mz*6,w:4,h:6,kind};
      if(h<0.065)M=strip('stadium');
      else if(h<0.14)M=hash2(mx+11,mz+13)<0.5?{ax:mx*6,az:mz*6,w:6,h:6,kind:'bigpark'}:strip('bigpark');
      else if(h<0.19)M=strip('mall');
      else if(h<0.25)M={ax:mx*6+off,az:mz*6+off2,w:4,h:4,kind:'bigbox'};   // a superstore: 16 blocks, most of it car park
      else if(h<0.40)M=hash2(mx+17,mz+19)<0.5?{ax:mx*6,az:mz*6,w:6,h:6,kind:'hood'}:{ax:mx*6+off,az:mz*6+off2,w:4,h:4,kind:'hood'};
      else if(h<0.455)M={ax:mx*6+off,az:mz*6+off2,w:3,h:3,kind:'school'};   // a school with proper grounds: 3x3 blocks
      else if(h<0.50)M={ax:mx*6+off,az:mz*6+off2,w:4,h:3,kind:'ikea'};
      else if(h<0.55)M={ax:mx*6+off,az:mz*6+off2,w:3,h:2,kind:'museum'};
      else if(h<0.58)M={ax:mx*6+off,az:mz*6+off2,w:3,h:2,kind:'aquarium'};
      else if(h<0.63)M={ax:mx*6+off,az:mz*6+off2,w:2,h:3,kind:'cathedral'};
      else if(h<0.69)M={ax:mx*6+off,az:mz*6+off2,w:3,h:3,kind:'hospital'};
      else if(h<0.74)M={ax:mx*6,az:mz*6,w:6,h:6,kind:'campus'};
      else if(h<0.77)M={ax:mx*6+off,az:mz*6+off2,w:4,h:4,kind:'prison'};
      else if(h<0.81)M={ax:mx*6+off,az:mz*6+off2,w:4,h:3,kind:'factory'};
      else if(h<0.835)M={ax:mx*6+off,az:mz*6+off2,w:4,h:4,kind:'studio'};
      else if(h<0.86)M={ax:mx*6+off,az:mz*6+off2,w:3,h:3,kind:'power'};
      else if(h<0.90)M={ax:mx*6,az:mz*6,w:5,h:5,kind:'zoo'};
      else if(h<THEME_H)M=themeOf(mx,mz);
      if(M&&!siteFits(M.kind,M.ax+M.w/2,M.az+M.h/2))M=null;
      {const ty=M&&setType(M.ax,M.az);if(M&&/^(school|ikea|hospital|campus|prison|factory|studio|power|zoo|theme)$/.test(M.kind)&&ty!=='city'&&ty!=='large'&&ty!=='suburb')M=null;if(M&&(M.kind==='museum'||M.kind==='aquarium'||M.kind==='cathedral')&&ty!=='city'&&ty!=='large')M=null;if(M&&(M.kind==='stadium'||M.kind==='bigpark')&&ty!=='city')M=null;if(M&&(M.kind==='mall'||M.kind==='bigbox')&&ty!=='city'&&ty!=='large'&&ty!=='suburb')M=null;if(M&&M.kind==='hood'&&ty==='village')M=null;
       if(!M&&h<0.62&&setType(mx*6+3,mz*6+3)==='suburb')M=hash2(mx+17,mz+19)<0.5?{ax:mx*6,az:mz*6,w:6,h:6,kind:'hood'}:{ax:mx*6+off,az:mz*6+off2,w:4,h:4,kind:'hood'};}   // suburbs: housing estates
      if(M&&(rectRail(M.ax,M.az,M.w,M.h)||rectRiver(M.ax,M.az,M.w,M.h)||rectPlains(M.ax,M.az,M.w,M.h)||rectClover(M.ax,M.az,M.w,M.h)||rectRamp(M.ax,M.az,M.w,M.h)||rectCuts(M.ax,M.az,M.w,M.h)||M.kind!=='hood'&&rectHighway(M.ax,M.az,M.w,M.h)))M=null;
      // (nothing else where a neighbour's theme park has reached in)
      if(M&&M.kind!=='theme')for(const T of themeNear(mx,mz))if(M&&M.ax<T.ax+8&&M.ax+M.w>T.ax&&M.az<T.az+8&&M.az+M.h>T.az)M=null;
      // (its own park, if it has one, is already settled by themeOf: nothing here gets to knock out the middle and leave the rim)
      {const own=themeOf(mx,mz);if(own)M=own;}
    }
    if(!themeBusy)superCache.set(mk,M);
  }
  return M;
}
// the 2x2-block grid's own multi-block sites (hospitals, car parks, mega offices); two of a kind never sit side by side
function groupKind(gx,gz){
  const h=hash2(gx*211+5,gz*157+9);
  if(h<0.37)return h<0.022?'hospital4':h<0.065?'hospital2':h<0.095?'garage4':h<0.15?'garage2':h<0.21?'mega2':h<0.23?'police4':h<0.29?'market4':h<0.33?'drug2':'sitdown2';
  // the big single buildings: the flat-pack furniture superstore, a cathedral, museums, an aquarium, a casino, schools, factories
  return h<0.382?'ikea4':h<0.392?'ikea2':h<0.407?'cathedral2':h<0.427?'museum2':h<0.439?'aquarium2':h<0.453?'casino2':h<0.459?'casino4':h<0.499?'school2':h<0.534?'factory2':h<0.544?'factory4':h<0.566?'cinema4':
    // and the big complexes: an arena, a university campus, a prison, the water works, a power station, the zoo, a film studio
    h<0.578?'arena4':h<0.590?'campus4':h<0.600?'prison4':h<0.615?'water2':h<0.625?'power4':h<0.637?'zoo4':h<0.645?'studio4':h<0.653?'nuclear4':h<0.665?'theme4':null;
}
function superOf(px,pz){
  const M=macroOf(px,pz),inS=S=>S&&px>=S.ax&&px<S.ax+S.w&&pz>=S.az&&pz<S.az+S.h;
  if(inS(M))return M.kind==='hood'?null:M;
  const gx=Math.floor(px/2),gz=Math.floor(pz/2),k=gx*100003+gz;let S=superCache.get(k);
  if(S===undefined){
    S=null;
    const hitsM=M&&gx*2<M.ax+M.w&&gx*2+2>M.ax&&gz*2<M.az+M.h&&gz*2+2>M.az||themeHits(gx*2,gz*2,2,2);
    let gk=Math.max(Math.abs(gx),Math.abs(gz))>=2&&!hitsM?groupKind(gx,gz):null;
    if(gk){const ty=setType(gx*2,gz*2),kn=gk.slice(0,-1),OK={city:null,large:['hospital','garage','police','market','drug','sitdown','school','factory','museum','aquarium','casino','cathedral','ikea','cinema','arena','campus','prison','water','power','zoo','nuclear','theme'],small:['hospital','market','drug','sitdown','school','factory','cinema','water'],suburb:['police','market','drug','sitdown','school','ikea','cinema','water','campus','theme'],village:[]}[ty];if(!ty||OK&&!OK.includes(kn)&&!(ty==='suburb'&&SITE_EDGE.has(kn))||ty==='small'&&gk==='hospital4')gk=null;}
    if(gk&&!siteFits(gk.slice(0,-1),gx*2+1,gz*2+1))gk=null;   // (what a place that size would have)
    if(gk&&/^(hospital|factory)/.test(gk)&&setType(gx*2,gz*2)!=='small')gk=null;   // (a small town's are the modest kind)
    if(gk&&/^(ikea|museum|aquarium|cathedral|campus|prison|studio|power|zoo|theme|nuclear)/.test(gk))gk=null;   // (these come from the big plan now, at a proper size)
    if(gk&&gk.startsWith('school')&&setType(gx*2,gz*2)!=='small')gk=null;   // (only a small town's is this cramped: bigger places get the 3x3 kind)
    if(gk){const kn=gk.slice(0,-1);if((groupKind(gx-1,gz)||'').startsWith(kn)||(groupKind(gx,gz-1)||'').startsWith(kn))gk=null;}
    if(gk){
      const kind=gk.slice(0,-1),pair=hash2(gx*7+1,gz*5+3)<0.5
        ?{ax:gx*2,az:gz*2+(hash2(gx,gz+5)<0.5?0:1),w:2,h:1,kind}:{ax:gx*2+(hash2(gx+5,gz)<0.5?0:1),az:gz*2,w:1,h:2,kind};
      S=gk.endsWith('4')?{ax:gx*2,az:gz*2,w:2,h:2,kind}:pair;
      if(rectRail(S.ax,S.az,S.w,S.h)||rectMetro(S.ax,S.az,S.w,S.h)||rectRiver(S.ax,S.az,S.w,S.h)||rectHighway(S.ax,S.az,S.w,S.h)||rectPlains(S.ax,S.az,S.w,S.h)||rectClover(S.ax,S.az,S.w,S.h)||rectRamp(S.ax,S.az,S.w,S.h)||rectCuts(S.ax,S.az,S.w,S.h))S=null;
    }
    if(!themeBusy)superCache.set(k,S);
  }
  return inS(S)&&!TEST_OFF.has(S.kind)?S:null;
}
// a column's place in a superblock: null (not in one), 'road' (its outer streets), 'ring' (its pavement) or 'in'
function superPart(x,z){
  const S=superOf(Math.floor(x/CELL),Math.floor(z/CELL));if(!S)return null;
  const lx=x-S.ax*CELL,lz=z-S.az*CELL;
  if(lx<ROADW||lz<ROADW)return'road';
  if(lx<PL0||lz<PL0||lx>=(S.w-1)*CELL+PL1||lz>=(S.h-1)*CELL+PL1)return'ring';
  return'in';
}
// The street grid: intersection (ix,iz) sits at the corner (ix*CELL, iz*CELL); the stretch leaving it along +z (dir 0)
// is the strip at the low-x edge of block (ix,iz), between blocks (ix-1,iz) and (ix,iz); the one along +x (dir 1) is the
// strip at the low-z edge of block (ix,iz), between (ix,iz-1) and (ix,iz). dir 2 and 3 are the stretches arriving from
// -z and -x, i.e. another intersection's dir 0 / 1.
// A street is there when it runs between two blocks of the same kind of built-up land (so a town's outer edge, where
// its blocks only face open country, has no road round it), or along a highway's line; streets inside a superblock
// (other than round its outside) and alleys / back gardens aren't streets.
function segBase(ix,iz,dir){
  if(dir===2)return segBase(ix,iz-1,0);if(dir===3)return segBase(ix-1,iz,1);
  if(dir===0?jz(ix,iz):jx(ix,iz))return false;   // an alley or back gardens
  if(dir===1?gRow(iz,ix*CELL+RC):gCol(ix,iz*CELL+RC))return true;   // a highway's own line (out on the plains, the only road there is)
  if(!settlementAt(ix,iz)||!settlementAt(dir===0?ix-1:ix,dir===0?iz:iz-1))return false;
  const S=superOf(ix,iz);if(!S)return true;
  return dir===0?ix===S.ax:iz===S.az;
}
// ...plus the link roads: every bit of a place (a stray block out in the fields, a street cut off by a gap) is joined
// to the rest of its streets, or to a highway, by the shortest run of new road out across the edge or the open ground
function segOpen(ix,iz,dir){
  if(dir===2)return segOpen(ix,iz-1,0);if(dir===3)return segOpen(ix-1,iz,1);
  return segBase(ix,iz,dir)||connOpen(ix,iz,dir);
}
const segK=(ix,iz,d)=>(ix*100003+iz)*2+d;   // d 0 (+z) or 1 (+x)
function connOpen(ix,iz,d){
  const rx0=Math.round(ix/SET_SP),rz0=Math.round(iz/SET_SP),k=segK(ix,iz,d);
  for(let rx=rx0-1;rx<=rx0+1;rx++)for(let rz=rz0-1;rz<=rz0+1;rz++)if(setConns(settlementLat(rx,rz)).has(k))return true;
  return false;
}
// the two blocks either side of a stretch of street (normalised to d 0 / 1 at (ix,iz))
const segCells=(ix,iz,d)=>d===0?[[ix-1,iz],[ix,iz]]:[[ix,iz-1],[ix,iz]];
// worked out once per place: which stretches of new road it needs to hold together
function setConns(S){
  if(S.conns)return S.conns;const C=S.conns=new Set();
  const r=Math.ceil(S.R*1.5)+3,x0=S.cx-r,x1=S.cx+r+1,z0=S.cz-r,z1=S.cz+r+1;   // (nodes x0..x1, z0..z1; blocks x0..x1-1)
  const NK=(i,j)=>i*100003+j,inS=(x,z)=>settlementAt(x,z)===S;
  const DV=[[0,1],[1,0],[0,-1],[-1,0]],segOf=(i,j,dd)=>dd===0?[i,j,0]:dd===1?[i,j,1]:dd===2?[i,j-1,0]:[i-1,j,1];
  // the streets already there, as a graph of intersections, and its pieces (union-find)
  const par=new Map(),find=a=>{let b=a;while(par.get(b)!==b)b=par.get(b);while(par.get(a)!==b){const n=par.get(a);par.set(a,b);a=n;}return b;};
  const add=a=>{if(!par.has(a))par.set(a,a);},uni=(a,b)=>{add(a);add(b);a=find(a);b=find(b);if(a!==b)par.set(a,b);};
  const open=(i,j,d)=>{const cs=segCells(i,j,d);return(inS(cs[0][0],cs[0][1])||inS(cs[1][0],cs[1][1])||(d===1?gRow(j,i*CELL+RC):gCol(i,j*CELL+RC)))&&segBase(i,j,d);};
  // a crossing where a motorway is on its way up to (or down from) its deck: the slope is a solid bank, so no road can
  // join it or cross there
  const slopeAt=()=>false;   // (no motorway comes down to the ground any more)
  const badN=new Map(),bad=n=>{let v=badN.get(n);if(v===undefined){const i=Math.floor(n/100003+0.5);v=slopeAt(i,n-i*100003);badN.set(n,v);}return v;};
  const hwNode=new Set();
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++)for(const d of [0,1]){
    if(d===0&&j>=z1||d===1&&i>=x1)continue;if(!open(i,j,d))continue;
    const a=NK(i,j),b=d===0?NK(i,j+1):NK(i+1,j);uni(a,b);
    if(d===1?gRow(j,i*CELL+RC):gCol(i,j*CELL+RC)){if(!bad(a))hwNode.add(a);if(!bad(b))hwNode.add(b);}}
  // the main network: the piece reaching nearest the middle of the place (the biggest, if none does)
  let main=null;{let bd=1e9;const sz=new Map();for(const a of par.keys()){const f=find(a);sz.set(f,(sz.get(f)||0)+1);}
    for(const a of par.keys()){const i=Math.floor(a/100003+0.5),j=a-i*100003;const dd=Math.hypot(i-S.cx-0.5,j-S.cz-0.5)-sz.get(find(a))*0.02;if(dd<bd){bd=dd;main=find(a);}}}
  const reached=new Set();for(const a of par.keys())if(main!==null&&find(a)===main)reached.add(a);
  const roadAt=(i,j,d)=>open(i,j,d)||C.has(segK(i,j,d));
  // the blocks of the place, nearest the middle first; each must touch a stretch of street that's joined up
  const cells=[];for(let x=x0;x<x1;x++)for(let z=z0;z<z1;z++)if(inS(x,z))cells.push([x,z,Math.hypot(x-S.cx,z-S.cz)]);
  cells.sort((a,b)=>a[2]-b[2]);
  const edgesOf=(x,z)=>[[x,z,0],[x,z,1],[x+1,z,0],[x,z+1,1]];   // (its own two sides first)
  const ends=(i,j,d)=>d===0?[NK(i,j),NK(i,j+1)]:[NK(i,j),NK(i+1,j)];
  const blocked=(i,j,d)=>{for(const [cx,cz] of segCells(i,j,d)){if(!settlementAt(cx,cz)&&rivPlotNear(cx,cz))return true;if(!settlementAt(cx,cz)&&farmK(cx,cz)!==null)return true;if(superOf(cx,cz))return true;}return false;};
  // join a set of intersections up to the network: a 0-1 search over the grid of intersections (following road that's
  // already there is free, each new stretch costs 1), then lay the new road and count everything it joins as joined
  // (near: going by whether the river's really in the way of this stretch, not by whether it's somewhere near the block)
  const riverOn=(i,j,d)=>{for(let t=0;t<=1;t+=0.25){const x=d===0?i*CELL+RC:(i+t)*CELL+RC,z=d===0?(j+t)*CELL+RC:j*CELL+RC;if(riverAt(x,z,RIV_W+8))return true;}return false;};
  const joinUp=(starts,near)=>{
    const dist=new Map(),prev=new Map(),dq=[];for(const n of starts){dist.set(n,0);dq.push(n);}
    let goal=null,guard=0;
    while(dq.length&&guard++<6000){
      const n=dq.shift();if(reached.has(n)){goal=n;break;}
      const i=Math.floor(n/100003+0.5),j=n-i*100003,dn=dist.get(n);
      if(i<x0-8||i>x1+8||j<z0-8||j>z1+8)continue;
      for(let dd=0;dd<4;dd++){const [si,sj,sd]=segOf(i,j,dd),m=NK(i+DV[dd][0],j+DV[dd][1]);
        const have=roadAt(si,sj,sd);if(!have&&((near?riverOn(si,sj,sd)||segCells(si,sj,sd).some(([cx,cz])=>superOf(cx,cz)||!settlementAt(cx,cz)&&farmK(cx,cz)!==null):blocked(si,sj,sd))||bad(m)||bad(n)))continue;
        const nd=dn+(have?0:1);if(dist.has(m)&&dist.get(m)<=nd)continue;
        dist.set(m,nd);prev.set(m,[n,si,sj,sd]);if(have)dq.unshift(m);else dq.push(m);}
    }
    if(goal===null)return null;
    let n=goal;while(prev.has(n)){const [p,si,sj,sd]=prev.get(n);if(!open(si,sj,sd))C.add(segK(si,sj,sd));reached.add(n);reached.add(p);n=p;}
    // (n is now the start the new road came from: it, and the streets joined to it, are joined up -- the other starts
    // may still be on their own, and get their turn)
    reached.add(n);if(par.has(n)){const r0=find(n);for(const a of par.keys())if(find(a)===r0)reached.add(a);}
    return n;
  };
  // (a place's own highway that hasn't met its streets gets a road to them: otherwise it runs in and just stops)
  {const pieces=new Map();for(const a of hwNode){if(find(a)===main)continue;const i=Math.floor(a/100003+0.5),j=a-i*100003,own=ax=>{const Sp=axisSpan(S,ax);return Sp&&Sp.kind==='country'&&Sp.k===(ax==='x'?j:i)&&(ax==='x'?i:j)>=Sp.m0&&(ax==='x'?i:j)<=Sp.m1+1;};
     if(own('x')||own('z')){const f=find(a);if(!pieces.has(f))pieces.set(f,[]);pieces.get(f).push(a);}}
   if(main!==null)for(const L of pieces.values())joinUp(L,true);}
  for(const a of hwNode)reached.add(a);
  const keep=new Set();
  // 1. every block of the place touches a street that's joined up
  for(const [x,z] of cells){
    let ok=false;const starts=[];
    for(const [i,j,d] of edgesOf(x,z)){if(!roadAt(i,j,d))continue;for(const n of ends(i,j,d)){starts.push(n);if(reached.has(n))ok=true;}}
    if(ok)continue;
    const bare=!starts.length;
    if(bare)for(const [i,j] of [[x,z],[x+1,z],[x,z+1],[x+1,z+1]])starts.push(NK(i,j));
    const o=joinUp(starts);
    // a block with no street at all: the new road reaches its corner, and runs on along one of its sides
    // (the block's own low-x or low-z side first: that strip of street lies in the block itself, beside its pavement)
    if(bare&&o!==null)for(const [i,j,d] of edgesOf(x,z)){const [a,b]=ends(i,j,d);if((a===o||b===o)&&!blocked(i,j,d)&&!bad(a)&&!bad(b)){const k=segK(i,j,d);C.add(k);keep.add(k);reached.add(a);reached.add(b);break;}}
  }
  // 2. and no stretch of street is left on its own: each one leads somewhere
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++)for(const d of [0,1]){
    if(d===0&&j>=z1||d===1&&i>=x1)continue;
    const cs=segCells(i,j,d);if(!inS(cs[0][0],cs[0][1])&&!inS(cs[1][0],cs[1][1]))continue;
    if(!open(i,j,d))continue;const [a,b]=ends(i,j,d);if(reached.has(a)||reached.has(b))continue;
    joinUp([a,b]);
  }
  // 3. no new road ends in the middle of nowhere: a stretch of link road that leads nowhere (a dead end out in the
  // fields, left over where two routes met) is taken away again, unless it's the only street a block has
  const deg=n=>{const i=Math.floor(n/100003+0.5),j=n-i*100003;let c=0;for(let dd=0;dd<4;dd++){const [si,sj,sd]=segOf(i,j,dd);if(roadAt(si,sj,sd))c++;}return c;};
  for(let pass=0,gone=true;gone&&pass<50;pass++){gone=false;
    for(const k of [...C]){if(keep.has(k))continue;const d=((k%2)+2)%2,nn=(k-d)/2,i=Math.floor(nn/100003+0.5),j=nn-i*100003,[a,b]=ends(i,j,d);
      if(deg(a)<=1||deg(b)<=1){C.delete(k);gone=true;}}}
  return C;
}
// ---- joined blocks: some streets between neighbouring blocks aren't streets. Between two building blocks the
// road becomes a narrow back alley (the buildings come out over the pavements to meet it); inside a neighbourhood,
// rows of blocks share back gardens instead. A neighbourhood only joins its blocks one way (along x or along z), so
// every house still faces a real road on the other side. Neither kind carries traffic.
const joinCache=new Map();
const ALLEY_T=new Set(['tower','mid']);
function joinOf(ax,az,bx,bz,along){   // cells a and b either side of one street; along: 'x' if they differ in x
  if(isRiver(ax,az)||isRiver(bx,bz)||superOf(ax,az)||superOf(bx,bz))return null;
  if(along==='x'?hwCol(bx,bz)||ghwCol(bx,bz):hwRow(bz,bx)||ghwRow(bz,bx))return null;   // a highway runs along this street
  const ta=plotType(ax,az),tb=plotType(bx,bz),h=hash2(bx*53+(along==='x'?17:71),bz*41+(along==='x'?29:13));
  if(ta==='homes'&&tb==='homes'){
    const M=macroOf(ax,az);if(!M||M!==macroOf(bx,bz)||M.kind!=='hood')return null;
    const axis=hash2(M.ax*7+5,M.az*13+3)<0.5?'x':'z';
    return axis===along&&h<0.6?'yard':null;
  }
  if(ALLEY_T.has(ta)&&ALLEY_T.has(tb)&&h<0.22)return'alley';
  return null;
}
// the street running along z at the low-x edge of block (px,pz), between it and (px-1,pz)
function jz(px,pz){const k='z'+px+','+pz;let v=joinCache.get(k);if(v===undefined){v=joinOf(px-1,pz,px,pz,'x');joinCache.set(k,v);}return v;}
// the street running along x at the low-z edge of block (px,pz), between it and (px,pz-1)
function jx(px,pz){const k='x'+px+','+pz;let v=joinCache.get(k);if(v===undefined){v=joinOf(px,pz-1,px,pz,'z');joinCache.set(k,v);}return v;}
// how far a block's ground reaches: over the pavement on any side that's joined to its neighbour
function plotBounds(px,pz){return{x0:jz(px,pz)?ROADW:PL0,x1:jz(px+1,pz)?CELL:PL1,z0:jx(px,pz)?ROADW:PL0,z1:jx(px,pz+1)?CELL:PL1};}
// where in a place each kind of site belongs: how far out from the middle, as a share of the place's radius. Offices and
// theatres downtown; hospitals and arenas in the ring round it; schools, supermarkets and superstores out in the suburbs,
// where there's room; anything heavy, smelly or sprawling at the edge of town. (Little places have no such zones, so
// there it's only 'not in the very middle'.)
const SITE_F={mega:[0,.55],stocks:[0,.55],news:[0,.6],museum:[0,.8],theater:[0,.62],casino:[0,.72],cathedral:[0,.9],hospital:[.15,.8],arena:[.15,.85],stadium:[.2,.9],mall:[.3,.92],
  school:[.4,9],market:[.4,9],cinema:[.4,9],bigbox:[.5,9],ikea:[.42,9],armory:[.5,9],datacenter:[.62,9],dealer:[.62,9],electric:[.62,9],jail:[.6,9],lab:[.6,9],
  factory:[.5,9],power:[.5,9],water:[.68,9],zoo:[.35,9],theme:[.35,9],studio:[.45,9],campus:[.25,9],prison:[.5,9],nuclear:[.8,9]};
const SITE_EDGE=new Set(['factory','power','water','zoo','theme','studio','prison','nuclear','campus']);
function siteFits(kind,cx,cz){
  const R=SITE_F[kind];if(!R)return true;const S=settlementAt(Math.floor(cx),Math.floor(cz));if(!S)return true;
  const f=setDist(S,cx,cz)/S.R;return S.type==='city'||S.type==='large'?f>=R[0]&&f<=R[1]:f>=R[0]*0.6;
}
// what sort of plot each city block is (decided from the seed alone, so neighbours can ask without recursion)
const B3_MIX={city:[['derelict',0.02],['stocks',0.006],['theater',0.012],['dealer',0.012],['armory',0.006],['camp',0.012],['farmers',0.01],['mansion',0.004]],
  large:[['derelict',0.02],['theater',0.01],['dealer',0.015],['armory',0.008],['camp',0.008],['farmers',0.012],['mansion',0.008],['trailers',0.004]],
  small:[['derelict',0.02],['dealer',0.012],['farmers',0.012],['trailers',0.015],['mansion',0.006],['armory',0.005],['nursery',0.01]],
  suburb:[['derelict',0.01],['mansion',0.025],['dealer',0.01],['trailers',0.01],['nursery',0.012],['farmers',0.008]],
  village:[['derelict',0.02],['trailers',0.025],['nursery',0.02],['farmers',0.015],['mansion',0.006]]};
const B4_MIX={city:[['datacenter',0.008],['electric',0.008]],large:[['datacenter',0.006],['electric',0.01]],small:[['electric',0.01]],suburb:[['datacenter',0.008]],village:[['electric',0.006]]};
const B5_MIX={city:[['lab',0.006]],large:[['lab',0.005],['jail',0.01]],small:[['jail',0.02]],suburb:[['jail',0.006]],village:[['jail',0.015]]};
const B2_MIX={city:[['courthouse',0.012],['church',0.02],['library',0.02],['news',0.016],['bank',0.035],['disco',0.016],['club',0.018],['cemetery',0.01],['radio',0.006]],
  large:[['courthouse',0.014],['church',0.025],['library',0.02],['news',0.01],['bank',0.03],['disco',0.012],['club',0.014],['cemetery',0.015],['radio',0.01]],
  small:[['courthouse',0.01],['court',0.01],['church',0.035],['library',0.02],['bank',0.025],['club',0.01],['cemetery',0.02],['radio',0.015]],
  suburb:[['court',0.02],['church',0.025],['library',0.015],['bank',0.015],['cemetery',0.01],['radio',0.008]],
  village:[['church',0.045],['bank',0.02],['cemetery',0.03],['radio',0.012],['library',0.012]]};
function baseType(px,pz){
  const t=baseType0(px,pz);if(siteFits(t,px+.5,pz+.5))return t;
  // (the wrong part of town for one of those: whatever's usual round here)
  const z=setType(px,pz);return z==='city'?'tower':z==='large'?'mid':hash2(px*23+3,pz*41+5)<0.2?'mid':'homes';
}
function baseType0(px,pz){
  const t=hash2(px*31+7,pz*17+13),ty=setType(px,pz);
  // a row of two little shops (bookshop, dentist, dispensary, gun shop, bar, soup kitchen); a water tower out in the
  // smaller places and the suburbs; a bell tower on its green, mostly in the small towns and villages
  {const u=hash2(px*61+5,pz*43+9);
   if(u<0.11)return'shops';
   if((ty==='small'||ty==='village'||ty==='suburb')&&u<0.127)return'wtower';
   if((ty==='small'||ty==='village')&&u<0.147||(ty==='large'||ty==='city')&&u<0.121)return'bell';}
  // churches, cemeteries, libraries, cinemas, radio and TV news, banks, discos and night clubs: how common each is
  // depends on the kind of place
  {const T2=B2_MIX[ty]||B2_MIX.small;let v=hash2(px*83+1,pz*29+7);for(const [k,p] of T2){if(v<p)return k;v-=p;}}
  // derelict buildings, mansions, trailer parks, encampments, farmer's markets, tree nurseries, car dealers, armories,
  // theatres, the stock exchange
  {const T3=B3_MIX[ty]||B3_MIX.small;let v=hash2(px*47+3,pz*97+11);for(const [k,p] of T3){if(v<p)return k;v-=p;}}
  {const T4=B4_MIX[ty]||[];let v=hash2(px*59+13,pz*71+17);for(const [k,p] of T4){if(v<p)return k;v-=p;}}
  {const T5=B5_MIX[ty]||[];let v=hash2(px*37+19,pz*113+23);for(const [k,p] of T5){if(v<p)return k;v-=p;}}
  if(ty==='large')return t<0.10?'park':t<0.14?'plaza':t<0.20?'tower':t<0.47?'mid':t<0.63?'homes':t<0.69?'gas':t<0.83?'food':t<0.90?'fastfood':t<0.95?'fire':'build';
  if(ty==='small')return t<0.08?'park':t<0.10?'plaza':t<0.26?'mid':t<0.62?'homes':t<0.69?'gas':t<0.85?'food':t<0.91?'fastfood':t<0.95?'fire':t<0.98?'police':'build';
  if(ty==='suburb')return t<0.09?'park':t<0.17?'mid':t<0.75?'homes':t<0.81?'gas':t<0.91?'food':t<0.96?'fastfood':t<0.98?'fire':'build';
  if(ty==='village')return t<0.08?'park':t<0.14?'mid':t<0.72?'homes':t<0.80?'gas':t<0.92?'food':t<0.96?'fastfood':t<0.98?'fire':'police';
  return t<0.10?'park':t<0.15?'plaza':t<0.47?'tower':t<0.63?'mid':t<0.69?'gas':t<0.83?'food':t<0.90?'fastfood':t<0.94?'fire':'build';
}
// towers and mid-rises cluster like a real downtown, but the other kinds don't repeat next door
const REROLL=['tower','tower','tower','mid','mid','mid','park','plaza','gas','food','fastfood','build','shops'];
// does a highway out of town (with its shoulders and barriers) cut across this town block -- a stray block of a
// place that the road runs through on its way somewhere else? Then nothing's built there: it's left as mown grass.
const cutC=new Map();
function routeCuts(px,pz){
  const k=px*100003+pz;let v=cutC.get(k);if(v!==undefined)return v;v=false;
  const X0=px*CELL,Z0=pz*CELL,L=routesNearBox(X0-4,Z0-4,X0+CELL+4,Z0+CELL+4);
  if(L.length){const past=n=>n.i===0&&n.t<=0||n.i===n.R.pts.length-2&&n.t>=1;
    for(let i=0;i<=6&&!v;i++)for(let j=0;j<=6&&!v;j++){const x=X0+ROADW+i*(CELL-ROADW)/6,z=Z0+ROADW+j*(CELL-ROADW)/6,n=nearestOn(L,x,z,10.5);
      if(n&&!past(n)){const e=Math.min(n.s,n.R.L-n.s);if(e>4)v=true;}}}
  cutC.set(k,v);return v;
}
function plotType(px,pz){
  const t=plotType1(px,pz);if(!TEST_OFF.size||!TEST_OFF.has(t))return t;
  return biomeOf(px,pz)==='city'?'empty':'plains';   // (switched off: an empty lot in town, open grass out in the country)
}
// (asked for constantly: every street segment, lamp post and goblin route goes through it, and working it out from scratch
// isn't cheap. Not remembered while a theme park is being placed, nor in the Testing Environment, where the answer can move.)
const plotTypeC=new Map();
function plotType1(px,pz){
  if(TENV||themeBusy)return plotType0(px,pz);
  const k=ckey(px,pz);let t=plotTypeC.get(k);
  if(t===undefined){t=plotType0(px,pz);if(!themeBusy)plotTypeC.set(k,t);}
  return t;
}
function plotType0(px,pz){
  if(seaPlot(px,pz))return coastType(px,pz);
  if(isRiver(px,pz))return'river';
  if(biomeOf(px,pz)==='plains')return railPlot(px,pz)?'plains':tsPlot(px,pz)?'truckstop':farmK(px,pz)!==null?'farm':dumpAt(px,pz)!==null?'dump':castleAt(px,pz)?'castle':bigPlainsAt(px,pz)?bigPlainsAt(px,pz).kind:'plains';
  if(railPlot(px,pz))return railStation(px,pz)?'station':'rail';
  if(metroStation(px,pz))return'metro';
  if(cloverOf(px,pz))return'ramp';
  if(!superOf(px,pz)&&rampSite(px,pz))return'ramp';
  if(superOf(px,pz))return'super';
  if(routeCuts(px,pz))return'ramp';
  const M=macroOf(px,pz);
  if(M&&M.kind==='hood'&&px>=M.ax&&px<M.ax+M.w&&pz>=M.az&&pz<M.az+M.h){const h=hash2(px*71+3,pz*53+1);return h<0.12?'park':h<0.165?'court':'homes';}
  if(px===0&&pz===0)return'plaza';
  let t=baseType(px,pz);
  if(t!=='tower'&&t!=='mid'&&t!=='homes'){
    const a=baseType(px-1,pz),c=baseType(px,pz-1),ty=setType(px,pz);
    if(t===a||t===c){const alts=REROLL.filter(q=>q!==t&&q!==a&&q!==c&&(ty==='city'||q!=='tower')&&(ty!=='village'&&ty!=='suburb'||q==='park'||q==='gas'||q==='food'||q==='fastfood'||q==='shops'||ty==='suburb'&&q==='mid'));t=alts[Math.floor(hash2(px*17+3,pz*29+11)*alts.length)];}
  }
  return t;
}
// a building with a real storey above the ground floor and no way up gets a flight of stairs: along its longer side, against
// the wall away from the door (or, where the far wall has something on it, like a bank's vault, along the front beside the door)
const STAIR_FRONT=new Set(['bank','news','stocks','club','disco','casino','radio']);
function autoStair(b){
  if(b.stair||b.noIndoor||b.style!=='normal'&&b.style!=='house')return;
  const gf=b.gf||FH;if(b.top-G<gf+FH||b.detailTop===undefined||b.detailTop<G+gf+3||b.x1-b.x0<5||b.z1-b.z0<5)return;
  const tr=b.tier>0&&(b.x1-b.x0)>=8?2:0,X0=b.x0+tr+1,X1=b.x1-tr-1,Z0=b.z0+tr+1,Z1=b.z1-tr-1,L=Math.max(gf,FH),iw=X1-X0,id=Z1-Z0;
  let ax=iw>=id?'x':'z';
  const fits=a=>(a==='x'?iw:id)>=L+2&&(a==='x'?id:iw)>=4;
  if(!fits(ax)){ax=ax==='x'?'z':'x';if(!fits(ax))return;}
  const al=ax==='x',R0=al?X0:Z0,R1=al?X1:Z1,C0=al?Z0:X0,C1=al?Z1:X1,cDoor=al?(b.door===2?-1:b.door===3?1:0):(b.door===0?-1:b.door===1?1:0),rDoor=al?(b.door===0?-1:b.door===1?1:0):(b.door===2?-1:b.door===3?1:0);
  let low=cDoor>0,r0=rDoor<0?R1-1-L:R0+1;
  if(STAIR_FRONT.has(b.ground)&&cDoor){const dr=al?(b.x0+b.x1)>>1:(b.z0+b.z1)>>1;
    if(dr+3+L+1<=R1){low=cDoor<0;r0=dr+3;}else if(dr-3-L>=R0+1){low=cDoor<0;r0=dr-3-L;}}
  const c0=low?C0:C1-2;
  b.stair={ax,c0,c1:c0+2,r0,L};
  // (in the way from the door to the middle of the room? another corner, or the other way round)
  const inWay=S=>{const a=S.ax==='x',x0=a?S.r0-1:S.c0-1,x1=a?S.r0+S.L:S.c1+1,z0=a?S.c0-1:S.r0-1,z1=a?S.c1+1:S.r0+S.L,cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;
    return b.door===2?cx+2>x0&&cx-1<x1&&b.z0<z1&&cz>z0:b.door===3?cx+2>x0&&cx-1<x1&&cz<z1&&b.z1>z0:b.door===0?cz+2>z0&&cz-1<z1&&b.x0<x1&&cx>x0:cz+2>z0&&cz-1<z1&&cx<x1&&b.x1>x0;};
  if(inWay(b.stair))for(const a of [ax,ax==='x'?'z':'x']){if(!fits(a))continue;const A=a==='x',r0a=A?X0:Z0,r1a=A?X1:Z1,c0a=A?Z0:X0,c1a=A?Z1:X1;let done=false;
    for(const c of [c0a,c1a-3])for(const rr of [r0a+1,r1a-1-L])if(!done){const q={ax:a,c0:c,c1:c+2,r0:rr,L};if(!inWay(q)){b.stair=q;done=true;}}
    if(done)break;}
}
function plotInfo(px,pz){
  const k=ckey(px,pz);let p=plotCache.get(k);if(p)return p;
  const r=n=>hash2(px*31+n*7,pz*17+n*13);
  const type=plotType(px,pz);
  p={type,b:[],px,pz,stall:0,pond:r(31)<0.4,benches:r(32)<0.8};
  if(type!=='police'&&type!=='gas'&&type!=='garage'&&type!=='river'&&r(30)<0.4)p.stall=r(33)<0.5?1:2;
  const base=o=>Object.assign({tier:0,neon:0,ant:0,gf:FH,style:'normal',band:0,roof:0},o);
  if(COAST.has(type)){coastInfo(p,px,pz,r,base);p.b.forEach(autoStair);plotCache.set(k,p);return p;}
  if(type==='rail'||type==='station'||type==='metro'){railInfo(p,px,pz,base);p.b.forEach(autoStair);plotCache.set(k,p);return p;}
  if(type==='super'){
    const S=superOf(px,pz);p.super=S;p.stall=0;
    // whatever it is sits on the anchor block, its footprint running across the vanished streets
    if(S.kind==='capitol'&&px===S.ax&&pz===S.az){
      const g=capGeo(),b=base({x0:PL0+g.px0,x1:PL0+g.px1,z0:PL0+g.pz0,z1:PL0+g.pz1,style:'capitol',top:G+60,wall:HOSPW,win:WIN_WARM,kind:'capitol',ground:'capitol',floor:FLOORT,door:2,farSkip:true});
      b.detailTop=b.top;b._stY=[G+4,G+9,G+14,G+19];b.stair={ax:'z',c0:PL0+g.c-32,c1:PL0+g.c-29,r0:PL0+g.bf+8,L:FH};b.east={_stY:b._stY,detailTop:b.top,stair:{ax:'z',c0:PL0+g.c+28,c1:PL0+g.c+31,r0:PL0+g.bf+8,L:FH}};p.b.push(b);
    }
    else if(S.kind!=='stadium'&&S.kind!=='bigpark'&&px===S.ax&&pz===S.az){
      const W=(S.w-1)*CELL,D=(S.h-1)*CELL,big=S.w*S.h>2;
      if(S.kind==='bigbox'){
        // a superstore: one huge, tall single-storey box at the back of a vast car park, two sets of entrance doors
        // footprint from the brand's real floor area (a Walmart Supercenter ~179,000 sq ft, a Kmart ~94,000)
        const B=brandPick('bigbox',r(140)),A=areaBl(B),SW=W+PW,SD=D+PW,bw=Math.min(SW-4,Math.round(Math.sqrt(A*1.5))),bd=Math.min(Math.round(SD*0.68),Math.round(A/bw));
        const x0=PL0+Math.round((SW-bw)/2),z1=PL1-1+D,b=base({x0,x1:x0+bw,z0:z1-bd,z1,gf:9,top:G+9,wall:CONCRETE,win:GLASS,kind:'grocery',ground:'bigbox',floor:FLOORT,door:2,neon:NEON_G});
        b.bigbox=bw>90?[0.2,0.5,0.8].map(f=>b.x0+Math.round(bw*f)):[b.x0+Math.round(bw*0.27),b.x0+Math.round(bw*0.73)];
        b.detailTop=b.top-1;brandOn(b,'bigbox',r(140));p.b.push(b);
      } else if(S.kind==='market'){
        // a supermarket (Kroger ~61,000 sq ft down to Aldi ~12,000) at the back of its car park
        const B=brandPick('market',r(140)),A=areaBl(B,0.6),SW=W+PW,SD=D+PW,bw=Math.min(SW-4,Math.round(Math.sqrt(A*1.4))),bd=Math.min(SD-16,Math.max(14,Math.round(A/bw)));
        const x0=PL0+Math.round((SW-bw)/2),z1=PL1-1+D,b=base({x0,x1:x0+bw,z0:z1-bd,z1,gf:7,top:G+7,wall:CONCRETE,win:GLASS,kind:'grocery',ground:'market',floor:FLOORT,door:2,front:true,neon:NEON_G});
        b.detailTop=b.top-1;brandOn(b,'market',r(140));p.b.push(b);
      } else if(S.kind==='drug'||S.kind==='sitdown'){
        // two blocks: the building at one end (sized from the brand's real floor area), its car park filling the rest
        const cat=S.kind,B=brandPick(cat,r(140)),A=areaBl(B,cat==='drug'?0.75:1),wide=S.w>S.h,SW=W+PW,SD=D+PW;
        let bw,bd,x0,z0;
        const small=cat==='sitdown'?22:0;   // (a dining room, a bar and a kitchen need that much)
        if(wide){bd=Math.min(SD-2,16);bw=Math.min(SW-14,Math.max(small,Math.round(A/bd)));x0=PL0+1;z0=PL0+1;}
        else{bw=Math.min(SW-2,16);bd=Math.min(SD-14,Math.max(small,Math.round(A/bw)));x0=PL0+1;z0=PL1-1+D-bd;}
        const b=base({x0,x1:x0+bw,z0,z1:z0+bd,gf:7,top:G+7,wall:BRICK,win:cat==='drug'?GLASS:WIN_WARM,kind:'apartment',ground:cat,floor:cat==='drug'?FLOORT:PLANKS,door:wide?2:2,front:cat==='drug',neon:NEON_R});
        b.detailTop=b.top-1;brandOn(b,cat,r(140));p.b.push(b);if(cat==='sitdown'){b.eat=true;b.eatTile=5;b.rowWin=true;}
        // beside a wide one: a row of bays against it and another along the far side; in front of a tall one: rows across the lot
        p.siteLot=wide?[{x0:b.x1+2,x1:b.x1+9,z0:PL0+1,z1:PL1-1,face:3},...(PL1-1+W-(b.x1+9)>=9?[{x0:PL1-8+W,x1:PL1-1+W,z0:PL0+1,z1:PL1-1,face:1}]:[])]:[{x0:PL0+1,x1:PL1-1,z0:PL0+1,z1:b.z0-3,big:'z',face:0}];
      } else if(S.kind==='ikea'){
        // the flat-pack furniture superstore: a huge blue box with a yellow band, one big entrance; inside, the
        // showroom path winding through furnished room sets, the cafeteria, and the self-serve warehouse of tall racks
        const SW=W+PW,SD=D+PW,bd=SD>30?SD-16:SD-2,x0=PL0+1,z1=PL0+SD-1;
        const b=base({x0,x1:PL0+SW-1,z0:z1-bd,z1,gf:11,top:G+11,wall:PAINT_BLUE,win:GLASS,kind:'grocery',ground:'ikea',floor:FLOORT,door:2,neon:NEON_Y});
        b.bigbox=[x0+Math.round((SW-2)*0.3)];b.detailTop=b.top-1;brandOn(b,'ikea',r(140));p.b.push(b);
        if(SD>30)p.siteLot=[{x0:PL0+1,x1:PL0+SW-1,z0:PL0+1,z1:b.z0-3,big:'z',face:0}];
      } else if(S.kind==='cathedral'){
        // a cathedral, end-on to the street: twin towers either side of the great doors and the rose window, the nave
        // (tall, its high windows over the arcades), lower aisles down either side, the choir and altar at the far end
        const wide=S.w>S.h,SW=W+PW,SD=D+PW,b=base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+1,z1:PL0+SD-1,top:G+52,style:'cathedral',wall:r(81)<0.5?STONE:MOSSSTONE,win:STAINED,kind:'church',ground:'church',floor:MARBLE,door:wide?0:2});
        b.trim=MARBLE;b.alongX=wide;b.doorSpec={w:1,h:5,k:'wood'};b.detailTop=b.top;p.b.push(b);
      } else if(S.kind==='museum'){
        // a museum: a long stone front with a columned porch; inside, a lobby with its gift shop, then galleries --
        // paintings, sculpture, and the great hall with the dinosaur
        const SW=W+PW,SD=D+PW,b=base({x0:PL0+6,x1:PL0+SW-6,z0:PL0+12,z1:PL0+SD-3,gf:10,top:G+10+FH,wall:r(81)<0.5?MARBLE:STONE,win:WIN_WARM,band:MARBLE,kind:'museum',ground:'museum',floor:MARBLE,door:2});
        b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-1;brandOn(b,'museum',r(140));b.rfForce={k:'dome',c:PAINT_GREEN};{const cx0=(b.x0+b.x1)>>1;b.stair={ax:'x',c0:b.z0+1,c1:b.z0+3,r0:cx0+5,L:10};}p.b.push(b);const cx=(b.x0+b.x1)>>1,hw=Math.min(10,(b.x1-b.x0)>>1);p.b.push(portico(b,4,G+9,cx-hw,cx+hw+1));
      } else if(S.kind==='aquarium'){
        // an aquarium: glass all along the front; huge tanks either side of the walkway, a tunnel tank you walk through,
        // fish swimming in them
        const SW=W+PW,SD=D+PW,b=base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+4,z1:PL0+SD-1,gf:9,top:G+9,wall:[PAINT_BLUE,PAINT_WHITE,STUCCO][Math.floor(r(81)*3)],win:GLASS,kind:'aquarium',ground:'aquarium',floor:FLOORT,door:2,front:true,neon:NEON_B});
        b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=b.top-1;brandOn(b,'aquarium',r(140));b.fish=true;b.rfForce={k:'whale'};p.b.push(b);
      } else if(S.kind==='casino'){
        // a casino: a glitzy podium wrapped in neon (a hotel tower rising out of it), a gold canopy over the doors; inside,
        // rows of slot machines, gaming tables, the cashier's cage, and a food court of little counters along one side
        const SW=W+PW,SD=D+PW,big=S.w*S.h>2,b=base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+5,z1:PL0+SD-1,gf:8,top:G+8+FH*(big?16:9),wall:[PAINT_RED,PAINT_DARK,PAINT_YELLOW][Math.floor(r(81)*3)],win:WIN_WARM,band:NEON_Y,
          kind:'apartment',ground:'casino',floor:CHECKER,door:2,neon:NEON_M});
        b.tier=G+8+FH;b.glitz=true;b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=Math.min(b.top-1,G+8+FH*2);brandOn(b,'casino',r(140));p.b.push(b);p.canopy=true;
      } else if(S.kind==='school'){
        // a school: a two-storey brick block of classrooms (with the gym and the cafeteria), a playground and a playing
        // field behind a chain-link fence, the school buses lined up out front
        const wide=S.w>S.h,SW=W+PW,SD=D+PW;
        if(S.w>=3){
          // the big kind: a long two-storey block set back behind its bus lane and front lawn, the playground and playing field behind
          const b=base({x0:PL0+10,x1:PL0+70,z0:PL0+14,z1:PL0+32,top:G+2*FH,wall:BRICK,win:WIN_WARM,band:CONCRETE,kind:'school',ground:'school',floor:FLOORT,door:2});
          b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=b.top-1;brandOn(b,'school',r(140));b.stair={ax:'z',c0:b.x0+22,c1:b.x0+25,r0:b.z0+11,L:FH};b.stairHall=[19,25,false];p.b.push(b);
          p.school={px0:PL0+1,px1:PL0+SW-1,pz0:b.z1+2,pz1:PL0+SD-1,big:true};p.buses=true;
        } else {
        const b=wide?base({x0:PL0+1,x1:PL0+28,z0:PL0+5,z1:PL0+SD-1,top:G+2*FH,wall:BRICK,win:WIN_WARM,band:CONCRETE,kind:'school',ground:'school',floor:FLOORT,door:2})
                    :base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+5,z1:PL0+26,top:G+2*FH,wall:BRICK,win:WIN_WARM,band:CONCRETE,kind:'school',ground:'school',floor:FLOORT,door:2});
        b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=b.top-1;brandOn(b,'school',r(140));b.stair=wide?{ax:'x',c0:b.z0+8,c1:b.z0+11,r0:b.x0+13,L:FH}:{ax:'z',c0:b.x0+11,c1:b.x0+15,r0:b.z0+13,L:FH};b.stairHall=[11,17,true];p.b.push(b);
        p.school=wide?{px0:b.x1+2,px1:PL0+SW-1,pz0:PL0+1,pz1:PL0+SD-1}:{px0:PL0+1,px1:PL0+SW-1,pz0:b.z1+2,pz1:PL0+SD-1};p.buses=true;
        }
      } else if(S.kind==='factory'){
        // a factory: a long hall under a sawtooth roof, loading docks along the back with lorries backed up to them,
        // smokestacks, and out in the yard whatever it needs: silos (a food works), tanks (chemicals), or a furnace
        // glowing inside (steel)
        const wide=S.w>S.h,SW=W+PW,SD=D+PW,kd=['steel','food','chem','cars'][Math.floor(r(80)*4)],L=wide?SW:SD,Wd=wide?SD:SW,hallL=L-17;
        const b=wide?base({x0:PL0+1,x1:PL0+1+hallL,z0:PL0+1,z1:PL0+SD-1,gf:10,top:G+10,wall:[BRICK,METAL,CONCRETE,RUST][Math.floor(r(81)*4)],win:WIN_WARM,kind:'factory',ground:'factory',floor:CONCRETE,door:2})
                    :base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+1,z1:PL0+1+hallL,gf:10,top:G+10,wall:[BRICK,METAL,CONCRETE,RUST][Math.floor(r(81)*4)],win:WIN_WARM,kind:'factory',ground:'factory',floor:CONCRETE,door:2});
        b.saw=true;b.roof=3;b.alongX=wide;b.fkind=kd;b.doorSpec={w:1,h:4,k:'steel'};b.detailTop=b.top-1;brandOn(b,'factory',['steel','food','chem','cars'].indexOf(kd)/4+0.05);
        // loading docks in the far end wall (roller doors left up), the lorries backed up to them
        const ac=PL0+(Wd>>1);b.docks=Wd>30?[ac-8,ac,ac+8]:[ac];b.dockSide=wide?1:3;p.b.push(b);
        const end=PL0+1+hallL,far=PL0+L-1,A=(a,c)=>wide?[a,c]:[c,a];   // (a: along the long way, c: across)
        // the yard beyond: a smokestack in one corner, silos or tanks in the other
        {const [x0,z0]=A(far-4,PL0+1),st=base({x0,x1:x0+3,z0,z1:z0+3,top:G+32,style:'stack',wall:kd==='steel'?RUST:BRICK,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});
         st.noIndoor=true;st.doorSpec=null;st.detailTop=st.top;st.smoke=true;p.b.push(st);}
        if(kd!=='cars'){const [x0,z0]=A(far-6,PL0+Wd-7),t=base({x0,x1:x0+5,z0,z1:z0+5,top:G+(kd==='food'?16:kd==='chem'?7:12),style:kd==='food'?'silo':'tank',wall:kd==='food'?PAINT_WHITE:kd==='chem'?METAL:RUST,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});
          t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;p.b.push(t);}
        if(S.w>=4){for(const k2 of [10,18]){const [x0,z0]=A(far-4,PL0+1+k2),st=base({x0,x1:x0+3,z0,z1:z0+3,top:G+26+k2,style:'stack',wall:kd==='steel'?RUST:BRICK,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});st.noIndoor=true;st.doorSpec=null;st.detailTop=st.top;st.smoke=true;p.b.push(st);}
          for(const k2 of [36,46,56]){if(kd==='cars')break;const [x0,z0]=A(far-6,PL0+k2),t=base({x0,x1:x0+6,z0,z1:z0+6,top:G+(kd==='food'?18:kd==='chem'?8:13),style:kd==='food'?'silo':'tank',wall:kd==='food'?PAINT_WHITE:kd==='chem'?METAL:RUST,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;p.b.push(t);}}
        p.lorries={wide,a:end+6.6,cs:b.docks};
      } else if(S.kind==='arena'){
        // an indoor arena: a round bowl under a dome, a band of glass round it, tiers of seats all the way round the
        // court, the scoreboard hanging over the middle, concession stands round the concourse
        const SW=W+PW,SD=D+PW,b=base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+1,z1:PL0+SD-1,top:G+36,style:'arena',wall:[CONCRETE,PAINT_WHITE,METAL][Math.floor(r(81)*3)],win:GLASS,kind:'arena',ground:'arena',floor:CONCRETE,door:2});
        b.noIndoor=true;b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=b.top;b.crowd='arena';brandOn(b,'arena',r(140));p.b.push(b);
      } else if(S.kind==='campus'){
        // a university: round a central quad of lawns and paths -- the library under its dome at the head, lecture halls
        // down the sides, the dormitories at the foot, the bell tower at a corner of the quad
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1,Z1=PL0+SD-1;
        const lib=base({x0:PL0+14,x1:X1-14,z0:PL0+1,z1:PL0+15,gf:FH+2,top:G+FH+2+FH,wall:MARBLE,win:WIN_WARM,band:MARBLE,kind:'library',ground:'library',floor:PLANKS,door:3});
        lib.doorSpec={w:1,h:4,k:'wood'};lib.dome={r:Math.min(9,((lib.x1-lib.x0)>>1)-1)};lib.roof=lib.dome.r+2;lib.detailTop=lib.top-1;brandOn(lib,'campus',r(140));p.b.push(lib);
        for(const [x0,x1,dr] of [[PL0+1,PL0+13,1],[X1-12,X1,0]]){const h=base({x0,x1,z0:PL0+18,z1:Z1-16,top:G+3*FH,wall:BRICK,win:WIN_WARM,band:MOSSSTONE,kind:'school',ground:'lecture',floor:PLANKS,door:dr});h.doorSpec={w:1,h:4,k:'wood'};h.detailTop=h.top-1;p.b.push(h);}
        for(const [x0,x1] of [[PL0+4,PL0+18],[X1-17,X1-3]]){const d=base({x0,x1,z0:Z1-12,z1:Z1,top:G+5*FH,wall:BRICK,win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:2});d.doorSpec={w:0,h:3,k:'wood'};d.detailTop=d.top-1;p.b.push(d);}
        const bt=base({x0:PL0+15,x1:PL0+21,z0:PL0+18,z1:PL0+24,top:G+26,style:'btower',wall:BRICK,win:WIN_WARM,kind:'landmark',ground:'landmark',floor:PLANKS,door:2});
        bt.trim=MOSSSTONE;bt.noIndoor=true;bt.detailTop=bt.top;bt.doorSpec={w:0,h:3,k:'wood'};bt.bell=true;p.b.push(bt);p.quad=true;
        if(S.w>=6){
          // the big kind: more halls round the quad, a row of dormitories, a science block with a dome of its own, the gym
          const hall=(x0,x1,z0,z1,fl,kd,gr,door)=>{const q=base({x0,x1,z0,z1,top:G+fl*FH,wall:BRICK,win:WIN_WARM,band:MOSSSTONE,kind:kd,ground:gr,floor:PLANKS,door});q.doorSpec={w:1,h:4,k:'wood'};q.detailTop=q.top-1;p.b.push(q);return q;};
          for(const zz of [50,84,118])hall(PL0+30,PL0+46,PL0+zz,PL0+zz+24,3,'school','lecture',1);
          for(const zz of [50,84,118])hall(X1-46,X1-30,PL0+zz,PL0+zz+24,3,'school','lecture',0);
          for(const xx of [48,70,92,114])hall(PL0+xx,PL0+xx+16,Z1-14,Z1,5,'apartment','apartment',2);
          const g=hall(PL0+1,PL0+26,PL0+1,PL0+16,2,'school','lecture',3);g.wall=PAINT_NAVY;
          const lab=hall(X1-26,X1-1,PL0+1,PL0+16,3,'school','lecture',3);lab.wall=CONCRETE;lab.rfForce={k:'dome',c:METAL};
        }
      } else if(S.kind==='prison'){
        // a prison: a high wall with razor wire round the top and a guard tower at every corner, the gatehouse, two cell
        // blocks, and the exercise yard between them
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1,Z1=PL0+SD-1;
        for(const [cx,cz] of [[PL0+1,PL0+1],[X1-4,PL0+1],[PL0+1,Z1-4],[X1-4,Z1-4]]){const t=base({x0:cx,x1:cx+4,z0:cz,z1:cz+4,top:G+16,style:'gtower',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;p.b.push(t);}
        const gh=base({x0:PL0+18,x1:X1-18,z0:PL0+1,z1:PL0+9,top:G+2*FH,wall:CONCRETE,win:WIN_BLUE,band:METAL,kind:'police',ground:'office',floor:FLOORT,door:2});gh.fort=true;gh.doorSpec={w:1,h:4,k:'steel'};gh.detailTop=gh.top-1;brandOn(gh,'prison',r(140));p.b.push(gh);
        for(const [x0,x1] of [[PL0+4,PL0+16],[X1-15,X1-3]]){const c=base({x0,x1,z0:PL0+14,z1:Z1-4,top:G+3*FH,wall:CONCRETE,win:WIN_BLUE,band:METAL,kind:'cells',ground:'cells',floor:CONCRETE,door:x0<PL0+10?1:0});c.fort=true;c.doorSpec={w:0,h:3,k:'steel'};c.detailTop=c.top-1;p.b.push(c);}
        p.prison={x0:PL0,x1:X1+1,z0:PL0,z1:Z1+1,yard:[PL0+18,X1-17,PL0+16,Z1-6]};
        if(S.w>=4){const mx0=((PL0+X1)>>1),mh=base({x0:mx0-14,x1:mx0+14,z0:PL0+16,z1:PL0+38,top:G+2*FH,wall:CONCRETE,win:WIN_BLUE,band:METAL,kind:'cells',ground:'cells',floor:CONCRETE,door:3});mh.fort=true;mh.doorSpec={w:1,h:4,k:'steel'};mh.detailTop=mh.top-1;p.b.push(mh);}
      } else if(S.kind==='water'){
        // the water works: round settling tanks (their arms sweeping slowly round), filter beds, the pump house
        const SW=W+PW,SD=D+PW,wide=S.w>S.h,X1=PL0+SW-1,Z1=PL0+SD-1;
        const ph=wide?base({x0:PL0+1,x1:PL0+13,z0:PL0+1,z1:PL0+13,top:G+FH,wall:BRICK,win:WIN_WARM,kind:'office',ground:'office',floor:FLOORT,door:2})
                     :base({x0:PL0+1,x1:PL0+13,z0:PL0+1,z1:PL0+13,top:G+FH,wall:BRICK,win:WIN_WARM,kind:'office',ground:'office',floor:FLOORT,door:2});
        ph.detailTop=ph.top-1;brandOn(ph,'water',r(140));p.b.push(ph);
        p.clar=wide?[[PL0+20,PL0+9],[PL0+36,PL0+9]]:[[PL0+9,PL0+20],[PL0+9,PL0+36]];p.filt=wide?[X1-6,PL0+1,X1,Z1]:[PL0+1,Z1-6,X1,Z1];p.waterW=true;
        p.b[0].arms=p.clar;
      } else if(S.kind==='power'){
        // a power station: the turbine hall and its tall chimney, two great cooling towers breathing steam, the coal heaped
        // in the yard on its conveyor, the switchyard of transformers and pylons
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1,Z1=PL0+SD-1;
        const th=base({x0:PL0+1,x1:PL0+26,z0:PL0+1,z1:PL0+16,gf:14,top:G+14,wall:[BRICK,CONCRETE,METAL][Math.floor(r(81)*3)],win:WIN_WARM,kind:'factory',ground:'turbine',floor:CONCRETE,door:2});
        th.saw=false;th.fkind='power';th.doorSpec={w:1,h:4,k:'steel'};th.detailTop=th.top-1;brandOn(th,'power',r(140));p.b.push(th);
        const st=base({x0:PL0+21,x1:PL0+24,z0:PL0+18,z1:PL0+21,top:G+46,style:'stack',wall:BRICK,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});st.noIndoor=true;st.doorSpec=null;st.detailTop=st.top;st.smoke=true;p.b.push(st);
        for(const [cx,cz] of [[X1-9,PL0+9],[X1-9,Z1-9]]){const t=base({x0:cx-8,x1:cx+9,z0:cz-8,z1:cz+9,top:G+38,style:'cooling',wall:CONCRETE,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;t.steam=true;p.b.push(t);}
        for(const z0 of [Z1-12,Z1-5]){const t=base({x0:PL0+4,x1:PL0+9,z0,z1:z0+3,top:G+16,style:'pylon',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:GRAVEL,door:2});t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;p.b.push(t);}
        p.power={coal:[PL0+11,PL0+19,PL0+28,Z1-2],switch:[PL0+1,PL0+10,Z1-14,Z1]};
      } else if(S.kind==='zoo'){
        // the zoo: an entrance with its gift shop, a loop of paths, and enclosures -- savannah (giraffes, zebras), the
        // elephant yard, the lions' rocks, the penguin pool, the monkey trees -- each with its animals wandering about
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1,Z1=PL0+SD-1,mx=PL0+(SW>>1);
        const gs=base({x0:mx-7,x1:mx+7,z0:PL0+1,z1:PL0+8,style:'house',top:G+FH,wall:PLANKS,win:WIN_WARM,kind:'shop',ground:'shop',floor:PLANKS,door:2,ridgeX:true});gs.roof=3;gs.detailTop=gs.top;gs.doorSpec={w:1,h:3,k:'wood'};brandOn(gs,'zoo',r(140));p.b.push(gs);
        const E=(x0,z0,x1,z1,g,sp,n)=>({x0,z0,x1,z1,g,sp,n});
        p.encl=[E(PL0+2,PL0+12,mx-3,PL0+27,'sav','giraffe',3),E(mx+3,PL0+12,X1-2,PL0+27,'dirt','elephant',2),E(PL0+2,PL0+31,mx-3,Z1-2,'rock','lion',3),
          E(mx+3,PL0+31,mx+12,Z1-2,'pool','penguin',6),E(mx+14,PL0+31,X1-2,Z1-2,'trees','monkey',4),E(PL0+2,PL0+12,mx-3,PL0+27,'sav','zebra',3)];
        if(S.w>=5)p.encl=[E(PL0+2,PL0+12,mx-3,PL0+60,'sav','giraffe',5),E(PL0+2,PL0+12,mx-3,PL0+60,'sav','zebra',6),E(mx+3,PL0+12,X1-2,PL0+60,'dirt','elephant',4),
          E(PL0+2,PL0+65,mx-3,PL0+105,'rock','lion',5),E(mx+3,PL0+65,mx+36,PL0+105,'pool','penguin',10),E(mx+41,PL0+65,X1-2,PL0+105,'trees','monkey',8),
          E(PL0+2,PL0+110,mx-3,Z1-2,'trees','monkey',6),E(mx+3,PL0+110,X1-2,Z1-2,'sav','giraffe',4)];
      } else if(S.kind==='studio'){
        // a film studio: a grand arched gate with the studio's name, the sound stages (huge plain sheds, numbered), a
        // backlot of false-fronted street, the trailers, and the water tank with its painted sky
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1,Z1=PL0+SD-1;
        const g=base({x0:PL0+18,x1:X1-18,z0:PL0+1,z1:PL0+4,top:G+11,style:'gate',wall:STUCCO,win:STUCCO,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});g.noIndoor=true;g.doorSpec=null;g.detailTop=g.top;brandOn(g,'studio',r(140));p.b.push(g);
        for(let i=0;i<(S.w>=4?5:2);i++)for(let row=0;row<(S.w>=4?2:1);row++){const ss=base({x0:PL0+1+i*16,x1:PL0+14+i*16,z0:PL0+7+row*27,z1:PL0+30+row*27,gf:16,top:G+16,wall:[PAINT_WHITE,STUCCO,CONCRETE][i%3],win:CONCRETE,kind:'studio',ground:'stage',floor:CONCRETE,door:2});ss.blank=true;ss.doorSpec={w:1,h:4,k:'steel'};ss.detailTop=ss.top-1;ss.stageNo=i+1;p.b.push(ss);}
        for(let i=0;i<(S.w>=4?13:4);i++){const fx=base({x0:PL0+2+i*7,x1:PL0+8+i*7,z0:Z1-14,z1:Z1-12,top:G+FH*(2+i%2),style:'facade',wall:[BRICK,SIDING,STUCCO,SIDING_Y][i],win:WIN_WARM,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});fx.noIndoor=true;fx.doorSpec=null;fx.detailTop=fx.top;p.b.push(fx);}
        for(let i=0;i<3;i++){const t=base({x0:X1-14+i*5,x1:X1-10+i*5,z0:PL0+8,z1:PL0+16,gf:4,top:G+4,wall:PAINT_WHITE,win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:2});t.doorSpec={w:0,h:3,k:'wood'};t.detailTop=t.top-1;p.b.push(t);}
        p.tank={x0:X1-16,x1:X1-1,z0:PL0+20,z1:PL0+34};
      } else if(S.kind==='nuclear'){
        // a nuclear power station behind a high fence: two domed reactor buildings, the turbine hall, the admin block,
        // and one giant cooling tower breathing steam
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1,Z1=PL0+SD-1;
        for(const [x0,z0] of [[PL0+3,PL0+20],[PL0+3,PL0+36]]){const c=base({x0,x1:x0+15,z0,z1:z0+15,top:G+24,style:'contain',wall:PAINT_WHITE,win:PAINT_WHITE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});c.noIndoor=true;c.doorSpec=null;c.detailTop=c.top;p.b.push(c);}
        const th=base({x0:PL0+20,x1:PL0+30,z0:PL0+20,z1:Z1-2,gf:14,top:G+14,wall:CONCRETE,win:WIN_WARM,kind:'factory',ground:'turbine',floor:CONCRETE,door:0});th.fkind='power';th.doorSpec={w:1,h:4,k:'steel'};th.detailTop=th.top-1;p.b.push(th);
        const ad=base({x0:PL0+3,x1:PL0+19,z0:PL0+3,z1:PL0+14,top:G+3*FH,wall:CONCRETE,win:WIN_BLUE,band:PAINT_YELLOW,kind:'office',ground:'office',floor:FLOORT,door:2});ad.detailTop=ad.top-1;brandOn(ad,'nuclear',r(140));p.b.push(ad);
        const ct=base({x0:X1-21,x1:X1,z0:PL0+14,z1:PL0+35,top:G+52,style:'cooling',wall:CONCRETE,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});ct.noIndoor=true;ct.doorSpec=null;ct.detailTop=ct.top;ct.steam=true;p.b.push(ct);
        p.nuke={x0:PL0,x1:X1+1,z0:PL0,z1:Z1+1};
      } else if(S.kind==='theme'){
        // a theme park: the entrance arch, a roller coaster looping round on its trestles, the Ferris wheel, the carousel,
        // food stalls, bright paving
        const SW=W+PW,SD=D+PW,X1=PL0+SW-1;
        const big6=S.w>=6,gm=(PL0+X1)>>1;
        const g=base({x0:big6?gm-18:PL0+18,x1:big6?gm+18:X1-18,z0:PL0+1,z1:PL0+3,top:G+12,style:'gate',wall:PAINT_RED,win:PAINT_YELLOW,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});g.noIndoor=true;g.doorSpec=null;g.detailTop=g.top;brandOn(g,'theme',r(140));
        g.ride=big6?{coaster:{cu:PL0+62,cv:PL0+140,a:54,b:84},wheel:{cu:PL0+184,cv:PL0+62,R:24,hub:G+29},carousel:{cu:PL0+184,cv:PL0+132},pond:{cu:PL0+184,cv:PL0+200,r:26},span:PL0+232,gm}:{coaster:{cu:PL0+16,cv:PL0+31,a:12,b:15},wheel:{cu:PL0+39,cv:PL0+14,R:10,hub:G+13},carousel:{cu:PL0+39,cv:PL0+37}};p.b.push(g);p.theme=g.ride;
        p.stalls=[{x0:PL0+28,z0:PL0+20,face:1,aw:AWN_R,crop:0},{x0:PL0+32,z0:PL0+20,face:1,aw:AWN_G,crop:2},{x0:PL0+28,z0:PL0+26,face:-1,aw:AWN_R,crop:4}];
        if(big6){p.stalls=[];for(let q=0;q<26;q++){const up=q%2;p.stalls.push({x0:PL0+66+q*6,z0:up?PL0+24:PL0+34,face:up?1:-1,aw:q%3?AWN_R:AWN_G,crop:q%5});}
          // a haunted house, the food hall and a drop tower to fill out the far side of the walks
          const lm=(x0,x1,z0,z1,top,wall,win)=>{const k=base({x0,x1,z0,z1,top,wall,win,kind:'landmark',ground:'landmark',floor:PLANKS,door:2});k.noIndoor=true;k.doorSpec=null;k.detailTop=k.top;p.b.push(k);};
          lm(PL0+128,PL0+152,PL0+96,PL0+118,G+14,PAINT_DARK,PAINT_RED);lm(PL0+206,PL0+232,PL0+108,PL0+126,G+9,PAINT_RED,WIN_WARM);lm(PL0+224,PL0+230,PL0+50,PL0+56,G+64,METAL,RUST);lm(PL0+128,PL0+148,PL0+172,PL0+196,G+10,PAINT_BLUE,WIN_WARM);}   // (and an arcade)
      } else if(S.kind==='cinema'){
        // a multiplex: a vast tall box over a whole site -- a glass front under the marquee and a big sign high up on
        // the facade; inside, the lobby (ticket desks, the snack bar, an arcade corner), a corridor, and three huge
        // screening rooms side by side, each with its seats stepping right up to the back
        const SW=W+PW,SD=D+PW,b=base({x0:PL0+1,x1:PL0+SW-1,z0:PL0+7,z1:PL0+SD-1,gf:16,top:G+16,wall:[PAINT_DARK,PAINT_RED,BRICK,PAINT_NAVY][Math.floor(r(81)*4)],win:GLASS,kind:'cinema',ground:'cinema',floor:CHECKER,door:2,front:true,neon:NEON_Y});
        b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=b.top-1;brandOn(b,'cinema',r(140));b.marquee=true;p.b.push(b);
      } else if(S.kind==='mall'){
        // a shopping mall: four tall storeys of shop units round glass-roofed concourses, glass along the front
        const longZ=S.h>S.w,BW=longZ?W:3*CELL,BD=longZ?3*CELL:D;
        const gf=FH+3,b=base({x0:PL0+1,x1:PL1-1+BW,z0:PL0+1,z1:PL1-1+BD,gf,top:storeysG(gf,gf+3*FH),style:'mall',wall:CONCRETE,win:GLASS,kind:'shop',ground:'shop',floor:FLOORT,door:2,neon:NEON_M});
        b.detailTop=b.top-1;brandOn(b,'mall',r(140));p.b.push(b);
      } else if(S.kind==='hospital'&&S.w>=3){
        // the big kind: the main block behind its drop-off, ER to one side of the doors, helipad on the roof; behind a garden,
        // a long low ward block
        const tierH=stnTier(px,pz),gf=FH+3,h=tierH===3?44+Math.floor(r(2)*16):28+Math.floor(r(2)*10);
        const b=base({x0:PL0+14,x1:PL0+68,z0:PL0+16,z1:PL0+46,gf,top:storeysG(gf,h),wall:HOSPW,win:WIN_BLUE,band:HOSPW,kind:'ward',ground:'hosp',floor:FLOORT,door:2,cross:true,heli:true});
        {const I=b.x1-b.x0-2,J=b.z1-b.z0-2,cu=I>>1;b.er={mode:'front',u0:cu+3,v1:Math.min(J-4,22)};b.er.door=b.x0+1+Math.floor((b.er.u0+I)/2);}
        b.detailTop=b.top-1;brandOn(b,'hospital',r(140));b.stair={ax:'x',c0:b.z1-7,c1:b.z1-3,r0:b.x0+3,L:gf};p.b.push(b);
        const w=base({x0:PL0+4,x1:PL0+78,z0:PL0+54,z1:PL0+78,gf,top:storeysG(gf,gf+3*FH),wall:HOSPW,win:WIN_BLUE,band:HOSPW,kind:'ward',ground:'ward',floor:FLOORT,door:2});
        w.doorSpec={w:1,h:4,k:'glass'};w.detailTop=w.top-1;w.stair={ax:'x',c0:w.z1-7,c1:w.z1-3,r0:w.x0+3,L:gf};p.b.push(w);
      } else if(S.kind==='hospital'){
        const tierH=stnTier(px,pz),gf=FH+3,h=tierH===3?(big?44:24)+Math.floor(r(2)*16):tierH===2?16+Math.floor(r(2)*8):gf+FH;
        const b=base({x0:PL0+1,x1:PL1-1+W,z0:PL0+5,z1:PL1-1+D,gf,top:storeysG(gf,h),wall:HOSPW,win:WIN_BLUE,band:HOSPW,kind:'ward',ground:'hosp',floor:FLOORT,door:2,cross:true,heli:true});
        // the emergency department: the front of the ground floor right of the main doors, with its own entrance
        // wide buildings: front-right of the ground floor, doors onto the drop-off; narrow ones: the back half, doors in the side
        {const I=b.x1-b.x0-2,J=b.z1-b.z0-2,cu=I>>1;
         if(I>=36){b.er={mode:'front',u0:cu+3,v1:Math.min(J-4,22)};b.er.door=b.x0+1+Math.floor((b.er.u0+I)/2);}
         else{b.er={mode:'back',v0:J>>1};b.er.door=b.z0+1+Math.floor((b.er.v0+J)/2);}}
        if(big){b.tier=storeysG(gf,h*0.55);if(b.tier>=b.top)b.tier=0;}
        b.detailTop=b.top-1;brandOn(b,'hospital',r(140));p.b.push(b);
      } else if(S.kind==='police'){
        // a big police station: two blocks, its own car park out front for the patrol cars
        const tierP=stnTier(px,pz),b=base({x0:PL0+1,x1:PL1-1+W,z0:PL0+1,z1:PL1-1+D,top:G+storeys(tierP===3?14+Math.floor(r(2)*8):tierP===2?9+Math.floor(r(2)*4):6),wall:POLICE,win:WIN_BLUE,band:SIDEWALK,neon:'police',kind:'police',ground:'police',floor:FLOORT,door:W>=D?0:2});
        b.detailTop=b.top-1;brandOn(b,'police',r(140));b.rfForce={k:'pad'};b.ant=8;p.b.push(b);
      } else if(S.kind==='garage'){
        const b=base({x0:PL0,x1:PL1+W,z0:PL0,z1:PL1+D,style:'garage',top:G+FH*(2+Math.floor(r(2)*4)),wall:CONCRETE,win:CONCRETE,kind:'garage',ground:'garage',floor:ASPHALT,door:0});
        b.detailTop=b.top;brandOn(b,'garage',r(140));p.b.push(b);
      } else {
        const f=FACADES[Math.floor(r(4)*5)],gf=FH*2,h=40+Math.floor(r(3)*60);
        const b=base({x0:PL0,x1:PL1+W,z0:PL0,z1:PL1+D,gf,top:storeysG(gf,h),wall:f[0],win:f[1],neon:r(6)<0.5?NEON_G:0,ant:r(8)<0.5?4:0,kind:'office',ground:'lobby',floor:FLOORT,door:Math.floor(r(12)*4)});
        b.tier=r(5)<0.5?storeysG(gf,h*0.55):0;if(b.tier>=b.top)b.tier=0;
        if(r(141)<0.7)brandOn(b,'office',r(140));detailCap(b);p.b.push(b);
      }
    }
  } else if(type==='tower'){
    // most towers are as before; some fill the whole block and run taller; a few are giants
    // footprints vary: each side is set back on its own, so towers come square, long, thin or off-centre
    const sz=r(13);let m=1+Math.floor(r(2)*2),h=26+Math.floor(r(3)*58),giant=false;
    let mx0=Math.floor(r(20)*3),mx1=Math.floor(r(21)*3),mz0=Math.floor(r(22)*3),mz1=Math.floor(r(23)*3);
    if(sz<0.09){m=Math.floor(r(14)*2);h=112+Math.floor(r(15)*36);giant=true;mx0=mx1=mz0=mz1=m;}
    else if(sz<0.32){m=0;h=56+Math.floor(r(15)*50);mx0=Math.floor(r(20)*2);mx1=0;mz0=0;mz1=Math.floor(r(23)*2);}
    const fw=18-mx0-mx1,fd=18-mz0-mz1,fl=Math.max(fw,fd),gf=r(16)<0.4&&fl>=15?(r(17)<0.5&&fl>=16?FH*2:FH+3):FH;   // (a tall lobby only where the stairs up from it will fit)
    const f=FACADES[Math.floor(r(4)*3)],tierOn=(giant||r(5)<0.6)&&Math.min(fw,fd)>=10&&fl-6>=gf+2;
    const b=base({x0:PL0+mx0,x1:PL1-mx1,z0:PL0+mz0,z1:PL1-mz1,gf,top:storeysG(gf,h),wall:f[0],win:f[1],neon:r(6)<0.55?(r(7)<0.5?NEON_G:NEON_M):0,
      ant:giant?6+Math.floor(r(9)*3):r(8)<0.6?3+Math.floor(r(9)*5):0,kind:'office',ground:'lobby',floor:r(11)<0.5?FLOORT:PLANKS,door:Math.floor(r(12)*4)});
    b.tier=tierOn?storeysG(gf,h*(giant?0.5:0.6)):0;if(b.tier>=b.top)b.tier=0;
    if(r(141)<0.5)brandOn(b,'office',r(140));detailCap(b);p.b.push(b);
  } else if(type==='mid'){
    // one building filling the block, big enough for rooms as well as its stairs
    const mk=(x0,x1,z0,z1,n,doors)=>{const f=FACADES[1+Math.floor(r(n)*4)],gf=r(n+7)<0.3&&x1-x0>=12?FH+3:FH;
      const b=base({x0,x1,z0,z1,gf,top:storeysG(gf,8+Math.floor(r(n+1)*16)),wall:f[0],win:f[1],neon:r(n+2)<0.3?NEON_G:0,kind:r(n+3)<0.7?'apartment':'office',ground:r(n+4)<0.55?'shop':'apartment',floor:r(n+5)<0.5?PLANKS:FLOORT,door:doors[Math.floor(r(n+6)*doors.length)]});
      if(b.ground==='shop'&&r(n+8)<0.75)brandOn(b,'shop',r(n+9));b.detailTop=b.top-1;p.b.push(b);};
    mk(PL0+1,PL1-1,PL0+1,PL1-1,10,[0,1,2,3]);
  } else if(type==='police'){
    const b=base({x0:PL0+1,x1:PL1-1,z0:PC-3,z1:PL1-1,top:G+storeys(stnTier(px,pz)>1?12:7),wall:POLICE,win:WIN_BLUE,band:SIDEWALK,neon:'police',kind:'police',ground:'police',floor:FLOORT,door:2});
    b.detailTop=b.top-1;brandOn(b,'police',r(140));b.stair={ax:'x',c0:b.z0+1,c1:b.z0+3,r0:((b.x0+b.x1)>>1)+2,L:FH};p.b.push(b);
  } else if(type==='garage'){
    // multi-storey car park: open sides, ramps between levels, cars in the bays
    const b=base({x0:PL0,x1:PL1,z0:PL0,z1:PL1,style:'garage',top:G+FH*(2+Math.floor(r(2)*3)),wall:CONCRETE,win:CONCRETE,kind:'garage',ground:'garage',floor:ASPHALT,door:0});
    b.detailTop=b.top;brandOn(b,'garage',r(140));p.b.push(b);
  } else if(type==='hospital'){
    const gf=FH+3,b=base({x0:PL0+1,x1:PL1-1,z0:PL0+4,z1:PL1-1,gf,top:storeysG(gf,22+Math.floor(r(2)*16)),wall:HOSPW,win:WIN_BLUE,band:HOSPW,kind:'ward',ground:'hosp',floor:FLOORT,door:2,cross:true,heli:true});
    b.detailTop=b.top-1;brandOn(b,'hospital',r(140));p.b.push(b);
  } else if(type==='grocery'){
    // one big, tall-ceilinged supermarket at the back of a car park
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+6,z1:PL1-1,gf:7,top:G+7,wall:r(2)<0.5?BRICK:CONCRETE,win:GLASS,kind:'grocery',ground:'grocery',floor:FLOORT,door:2,front:true,neon:NEON_G});
    b.detailTop=b.top-1;brandOn(b,'grocery',r(140));p.b.push(b);
  } else if(type==='homes'){
    // a little residential street: two houses with gable roofs, front doors facing the road on either side. Out in the
    // suburbs, now and then, one big house takes the block. (Their rooms: see homeRoom.)
    const walls=[SIDING,SIDING_Y,BRICK,PLANKS],sub=zoneAt(px,pz)==='suburb',two=r(53)<(sub?0.15:0.5),solo=two||sub&&r(90)<0.3;
    const mk=(z0,z1,door,n,two)=>{const b=base({x0:PL0+1,x1:PL1-1,z0,z1,style:'house',top:G+(two?2*FH:FH),wall:walls[Math.floor(r(n)*walls.length)],win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door,ridgeX:true});
      b.home=true;b.roof=Math.floor((z1-z0)/2);b.detailTop=b.top;
      if(two)b.stair=door===2?{ax:'x',c0:z1-3,c1:z1-1,r0:((b.x0+b.x1)>>1)+1,L:FH}:{ax:'x',c0:z0+1,c1:z0+3,r0:((b.x0+b.x1)>>1)+1,L:FH};
      p.b.push(b);};
    if(solo)mk(PL0+4,PL1-2,2,96,two);
    else{if(r(50)>=0.1)mk(PL0+1,PC-1,2,96,false);if(r(60)>=0.1)mk(PC+1,PL1-1,3,97,false);}
  } else if(type==='shops'){
    // a little shop filling its block, a glass front onto a paved forecourt: a bookshop, a dentist's, a dispensary, a gun
    // shop (bars over its windows), a bar or a soup kitchen. (Their rooms: see restProps and shopRoom. A bar gets tables outside.)
    const kinds=['books','dentist','dispo','guns','bar','soup'],kd=kinds[Math.floor(r(80)*6)],walls=[BRICK,SIDING,CONCRETE,STUCCO,SIDING_Y,BRICK];
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+4,z1:PL1-1,gf:6,top:G+6,wall:kd==='guns'?BRICK:walls[Math.floor(r(84)*walls.length)],win:GLASS,kind:kd==='dentist'?'office':'apartment',ground:kd,floor:kd==='books'||kd==='bar'||kd==='dispo'?PLANKS:kd==='soup'?CHECKER:kd==='guns'?CONCRETE:FLOORT,door:2,front:true,neon:kd==='bar'?NEON_O:kd==='dispo'?NEON_G:kd==='guns'?NEON_R:NEON_B});
    if(kd==='guns')b.barred=true;if(kd==='bar'||kd==='soup')b.eat=true;
    b.detailTop=b.top-1;brandOn(b,kd,r(150));p.b.push(b);if(kd==='bar')p.patio={z0:PL0,z1:PL0+4};
  } else if(type==='derelict'){
    // an abandoned building: boarded-up and broken windows, holes in its walls and roof, the floors half fallen in,
    // rubble and weeds round it behind a sagging chain-link fence
    const st=2+Math.floor(r(80)*3),b=base({x0:PL0+2,x1:PL1-2,z0:PL0+3,z1:PL1-2,top:G+storeys(st*FH),wall:[BRICK,MOSSCON,MOSSSTONE,CONCRETE][Math.floor(r(81)*4)],win:WIN_WARM,
      kind:'apartment',ground:r(82)<0.5?'shop':'apartment',floor:PLANKS,door:2});
    b.decay=true;b.doorSpec=null;b.detailTop=b.top-1;p.b.push(b);
  } else if(type==='mansion'){
    // a mansion: a big two-storey house behind iron railings and gate piers, a gravel drive up to a columned porch, a
    // fountain on the lawn, a pool out the back
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+6,z1:PL0+17,style:'house',top:G+2*FH,wall:[STUCCO,BRICK,PAINT_WHITE,SIDING][Math.floor(r(80)*4)],win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:2,ridgeX:true});
    b.home=true;b.roof=Math.floor((b.z1-b.z0)/2);b.detailTop=b.top;b.doorSpec={w:1,h:4,k:'wood'};p.b.push(b);
    const cx=(b.x0+b.x1)>>1;p.b.push(portico(b,3,G+2*FH-1,cx-3,cx+4));p.mansion=true;
  } else if(type==='trailers'){
    // a trailer park: mobile homes either side of a gravel lane, washing lines, odds and ends
    const walls=[SIDING,PAINT_WHITE,SIDING_Y,STUCCO];
    for(let q=0;q<4;q++){const e=q&1,z0=PL0+1+(q>>1)*9,x0=e?PL1-6:PL0+2;
      if(r(70+q)<0.12)continue;
      const b=base({x0,x1:x0+4,z0,z1:z0+8,gf:4,top:G+4,wall:walls[Math.floor(r(72+q)*walls.length)],win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:e?0:1});
      b.doorSpec={w:0,h:3,k:'wood'};b.detailTop=b.top-1;b.trailer=true;p.b.push(b);}
  } else if(type==='camp'){
    // a homeless encampment on a vacant lot: tents and tarps, a barrel fire, carts and bedding
    p.camp=[];for(let q=0;q<6;q++){if(r(60+q)<0.2)continue;const u=PL0+2+(q%3)*6,v=PL0+3+Math.floor(q/3)*8;p.camp.push({x0:u,z0:v,c:[AWN_G,PAINT_BLUE,AWN_R,PAINT_ORANGE,CLAY,PAINT_GREEN][Math.floor(r(66+q)*6)],ax:r(76+q)<0.5});}
    p.fire={x:PC,z:PC-1};
  } else if(type==='farmers'){
    // a farmer's market: two rows of stalls under striped awnings either side of the aisle, produce piled on the tables
    p.stalls=[];for(let q=0;q<8;q++){const row=q>>2,x0=PL0+1+(q&3)*4;p.stalls.push({x0,z0:row?PL1-5:PL0+2,face:row?-1:1,aw:r(90+q)<0.5?AWN_R:AWN_G,crop:Math.floor(r(100+q)*5)});}
  } else if(type==='nursery'){
    // a tree nursery: rows of young trees, potted plants, a glasshouse at the back, a little sales shed by the gate
    const g=base({x0:PL1-10,x1:PL1-1,z0:PL1-12,z1:PL1-1,style:'greenhouse',top:G+9,wall:GLASS,win:GLASS,kind:'landmark',ground:'landmark',floor:GRAVEL,door:0});
    g.ridgeX=false;g.roof=4;g.noIndoor=true;g.detailTop=g.top;g.doorSpec={w:0,h:3,k:'glass'};p.b.push(g);
    const sh=base({x0:PL1-8,x1:PL1-2,z0:PL0+1,z1:PL0+6,style:'house',top:G+FH,wall:PLANKS,win:WIN_WARM,kind:'shop',ground:'shop',floor:PLANKS,door:2,ridgeX:true});
    sh.roof=2;sh.detailTop=sh.top;sh.doorSpec={w:0,h:3,k:'wood'};brandOn(sh,'nursery',r(150));p.b.push(sh);p.nursery=true;
  } else if(type==='dealer'){
    // a car dealer: a glass showroom with cars on show inside, the lot full of cars for sale, bunting and flags
    const b=base({x0:PL0+1,x1:PL0+13,z0:PL0+2,z1:PL0+12,gf:7,top:G+7,wall:[PAINT_WHITE,METAL,PAINT_RED,PAINT_BLUE][Math.floor(r(80)*4)],win:GLASS,kind:'shop',ground:'dealer',floor:FLOORT,door:2,front:true,neon:NEON_B});
    b.glassAll=true;b.detailTop=b.top-1;brandOn(b,'dealer',r(150));p.b.push(b);p.dealer=true;
  } else if(type==='armory'){
    // an armory: a brick fortress -- a tall drill hall behind battlements, a round turret on each corner, big doors
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL1-2,gf:8,top:G+8+FH+1,wall:BRICK,win:WIN_WARM,band:MOSSSTONE,kind:'office',ground:'armory',floor:CONCRETE,door:2});
    b.stair={ax:'x',c0:b.z1-3,c1:b.z1-1,r0:b.x0+4,L:8};b.crenel=true;   // (between the corner turrets)
    b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-2;brandOn(b,'armory',r(150));
    for(const [cx,cz] of [[b.x0,b.z0],[b.x1,b.z0],[b.x0,b.z1],[b.x1,b.z1]]){const t=base({x0:cx-2,x1:cx+3,z0:cz-2,z1:cz+3,top:b.top+4,style:'turret',wall:BRICK,win:WIN_WARM,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});
      t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;p.b.push(t);}
    p.b.push(b);
  } else if(type==='theater'){
    // a theatre for plays, concerts and the ballet: a stone front with columns, the hall inside -- the stalls, a
    // balcony, the orchestra pit, the stage behind its red curtains
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+4,z1:PL1-1,gf:12,top:G+12,wall:r(80)<0.5?MARBLE:STONE,win:WIN_WARM,band:MARBLE,kind:'theater',ground:'theater',floor:PLANKS,door:2});
    b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-1;brandOn(b,'theater',r(150));p.b.push(b);p.b.push(portico(b,3,G+9));
  } else if(type==='stocks'){
    // the stock exchange: a marble temple of money -- tall columns across the front, the trading floor inside with
    // its rows of desks and screens, the big board, a ticker running across the back wall
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+6,z1:PL1-1,gf:9,top:G+9,wall:MARBLE,win:WIN_WARM,band:MARBLE,kind:'office',ground:'stocks',floor:MARBLE,door:2});
    b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-1;brandOn(b,'stocks',r(150));b.ticker=true;p.b.push(b);p.b.push(portico(b,4,G+8));
  } else if(type==='nuclear'||type==='base'||type==='airport'||type==='nasa'||type==='mine'||type==='quarry'||type==='lumber'||type==='campsite'||type==='cult'||type==='tower5g'||type==='prepper'||type==='militia'||type==='ruins'||type==='thieves'){
    // the buildings of a big plains site that fall on this block (each laid out in the site's own coordinates, and
    // only the ones inside this block built here)
    const B=bigPlainsAt(px,pz),U0=(px-B.ax)*CELL,V0=(pz-B.az)*CELL;
    const add=(o,brand)=>{if(o.x0<U0||o.x1>U0+CELL||o.z0<V0||o.z1>V0+CELL)return;const b=base(Object.assign({},o,{x0:o.x0-U0,x1:o.x1-U0,z0:o.z0-V0,z1:o.z1-V0}));b.detailTop=b.top-1;if(o.noIndoor){b.noIndoor=true;b.detailTop=b.top;}if(brand)brandOn(b,brand,r(150));p.b.push(b);};
    if(type==='nuclear'){
      for(const ux of [36,100,164]){add({x0:ux,x1:ux+24,z0:36,z1:60,top:G+36,style:'contain',wall:PAINT_WHITE,win:PAINT_WHITE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
        add({x0:ux,x1:ux+24,z0:66,z1:92,top:G+14,style:'hangar',wall:CONCRETE,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});}
      add({x0:4,x1:30,z0:4,z1:22,top:G+3*FH,wall:CONCRETE,win:WIN_BLUE,band:PAINT_YELLOW,kind:'office',ground:'office',floor:FLOORT,door:2},'nuclear');
      // the waste store: rows of casks in a long shed; the security block by the gate
      add({x0:36,x1:60,z0:166,z1:190,top:G+12,style:'hangar',wall:CONCRETE,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      for(const uz of [196,206,216])for(const ux of [36,46])add({x0:ux,x1:ux+7,z0:uz,z1:uz+7,top:G+7,style:'tank',wall:PAINT_YELLOW,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:4,x1:30,z0:70,z1:88,top:G+2*FH,wall:CONCRETE,win:WIN_BLUE,band:PAINT_YELLOW,kind:'police',ground:'office',floor:FLOORT,door:1});
      for(const [ux,zz] of [[196,34],[196,100],[228,36],[228,102]])add({x0:ux,x1:ux+(ux>200?26:28),z0:zz,z1:zz+(ux>200?26:28),top:G+72,style:'cooling',wall:CONCRETE,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true,steam:true});}
    else if(type==='base'){
      for(let i=0;i<3;i++)add({x0:36,x1:60,z0:4+i*9,z1:11+i*9,top:G+FH,wall:PAINT_GREEN,win:WIN_WARM,kind:'barracks',ground:'barracks',floor:CONCRETE,door:3,doorSpec:{w:0,h:3,k:'wood'}},i===0?'base':null);
      add({x0:2,x1:0,z0:36,z1:60,top:G+12,style:'hangar',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:58,x1:62,z0:58,z1:62,top:G+16,style:'gtower',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:4,x1:8,z0:4,z1:8,top:G+16,style:'gtower',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:122,x1:126,z0:4,z1:8,top:G+16,style:'gtower',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:122,x1:126,z0:122,z1:126,top:G+16,style:'gtower',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      for(let i=0;i<3;i++)for(const ux of [66,98])add({x0:ux,x1:ux+28,z0:4+i*9,z1:11+i*9,top:G+FH,wall:PAINT_GREEN,win:WIN_WARM,kind:'barracks',ground:'barracks',floor:CONCRETE,door:3,doorSpec:{w:0,h:3,k:'wood'}});
      add({x0:4,x1:26,z0:36,z1:60,top:G+12,style:'hangar',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});}
    else if(type==='mine'){
      add({x0:50,x1:60,z0:8,z1:20,top:G+8,wall:BRICK,win:WIN_WARM,band:CONCRETE,kind:'shop',ground:'shop',floor:CONCRETE,door:0,doorSpec:{w:1,h:4,k:'barn'}});   // the winding house
      add({x0:48,x1:60,z0:24,z1:36,top:G+FH,wall:PLANKS,win:WIN_WARM,kind:'office',ground:'office',floor:PLANKS,door:0,doorSpec:{w:0,h:3,k:'wood'}});           // the mine office
      add({x0:68,x1:90,z0:48,z1:62,top:G+11,wall:RUST,win:METAL,band:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});}   // the processing plant
    else if(type==='quarry'){
      add({x0:34,x1:56,z0:2,z1:14,top:G+12,wall:METAL,win:METAL,band:RUST,kind:'landmark',ground:'landmark',floor:CONCRETE,door:3,doorSpec:null,noIndoor:true});   // the crusher
      add({x0:4,x1:18,z0:4,z1:16,top:G+FH,wall:SIDING_Y,win:WIN_BLUE,kind:'office',ground:'office',floor:FLOORT,door:3,doorSpec:{w:0,h:3,k:'wood'}});}            // the site office
    else if(type==='cult'||type==='tower5g'||type==='ruins'){}
    else if(type==='prepper')add({x0:8,x1:24,z0:8,z1:20,style:'house',roof:6,top:G+FH,wall:SIDING,win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:3,doorSpec:{w:0,h:3,k:'wood'}});   // the house
    else if(type==='militia')add({x0:36,x1:56,z0:8,z1:20,top:G+FH,wall:PLANKS,win:WIN_WARM,band:LOG,kind:'barracks',ground:'barracks',floor:PLANKS,door:3,doorSpec:{w:0,h:3,k:'wood'}});   // the HQ shed
    else if(type==='thieves'){
      add({x0:6,x1:14,z0:10,z1:17,style:'house',roof:3,top:G+FH,wall:PLANKS,win:WIN_WARM,kind:'shop',ground:'shop',floor:PLANKS,door:2,doorSpec:{w:0,h:3,k:'wood'}});   // the shack
      add({x0:20,x1:26,z0:8,z1:13,top:G+FH-1,wall:RUST,win:RUST,kind:'shop',ground:'shop',floor:GRAVEL,door:3,doorSpec:{w:0,h:3,k:'wood'}});}   // the tin shed
    else if(type==='campsite'){
      add({x0:34,x1:44,z0:42,z1:48,top:G+FH,wall:PLANKS,win:WIN_WARM,kind:'shop',ground:'shop',floor:FLOORT,door:2,doorSpec:{w:0,h:3,k:'wood'}});   // the wash block
      add({x0:1,x1:7,z0:1,z1:8,style:'house',roof:3,top:G+FH,wall:LOG,win:WIN_WARM,kind:'office',ground:'office',floor:PLANKS,door:1,doorSpec:{w:0,h:3,k:'wood'}});}   // the warden's hut
    else if(type==='lumber'){
      add({x0:40,x1:62,z0:14,z1:30,top:G+8,wall:PLANKS,win:PLANKS,band:LOG,kind:'shop',ground:'shop',floor:PLANKS,door:3,doorSpec:{w:1,h:4,k:'barn'}});           // the sawmill
      for(const [x0,z0] of [[10,6],[22,6]])add({x0,x1:x0+8,z0,z1:z0+7,style:'house',roof:3,top:G+FH,wall:LOG,win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:3,doorSpec:{w:0,h:3,k:'wood'}});}   // the loggers' cabins
    else if(type==='airport'){
      add({x0:66,x1:94,z0:64,z1:76,gf:7,top:G+7+FH,wall:PAINT_WHITE,win:GLASS,band:METAL,kind:'office',ground:'terminal',floor:FLOORT,door:3,doorSpec:{w:1,h:4,k:'glass'},glassAll:true},'airport');
      add({x0:100,x1:105,z0:54,z1:59,top:G+30,style:'ctrl',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:132,x1:150,z0:50,z1:64,top:G+12,style:'hangar',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:164,x1:182,z0:50,z1:64,top:G+12,style:'hangar',wall:PAINT_WHITE,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      add({x0:34,x1:62,z0:64,z1:76,gf:7,top:G+7+FH,wall:PAINT_WHITE,win:GLASS,band:METAL,kind:'office',ground:'terminal',floor:FLOORT,door:3,doorSpec:{w:1,h:4,k:'glass'},glassAll:true});
      add({x0:388,x1:406,z0:50,z1:64,top:G+12,style:'hangar',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      for(const ux of [164,196,228,260,292,324,356])add({x0:ux,x1:ux+24,z0:68,z1:88,top:G+12,style:'hangar',wall:[METAL,CONCRETE,RUST][(ux>>2)%3],win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
      for(const uz of [100,108])for(const ux of [130,140])add({x0:ux,x1:ux+7,z0:uz,z1:uz+7,top:G+7,style:'tank',wall:PAINT_WHITE,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});}
    else{
      add({x0:3,x1:30,z0:4,z1:30,gf:50,top:G+56,wall:PAINT_WHITE,win:PAINT_WHITE,band:PAINT_BLUE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:3,doorSpec:null,noIndoor:true,blank:true,vab:true},'nasa');
      add({x0:36,x1:60,z0:4,z1:20,top:G+2*FH,wall:CONCRETE,win:WIN_BLUE,kind:'office',ground:'mission',floor:FLOORT,door:2,doorSpec:{w:1,h:4,k:'glass'}});}
  } else if(type==='jail'){
    // the town jail: a squat brick block, barred slits for windows, the cells inside
    const b=base({x0:PL0+3,x1:PL1-3,z0:PL0+4,z1:PL1-3,top:G+FH,wall:BRICK,win:WIN_BLUE,band:METAL,kind:'cells',ground:'cells',floor:CONCRETE,door:2});
    b.fort=true;b.doorSpec={w:0,h:3,k:'steel'};b.detailTop=b.top-1;brandOn(b,'jail',r(150));p.b.push(b);
  } else if(type==='lab'){
    // a goblin laboratory: a grim dark block with green-glowing slits; inside, vats bubbling, glowing tanks with things
    // floating in them, cages, and Tesla coils crackling with sparks
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+2,z1:PL1-1,gf:9,top:G+9+FH,wall:[PAINT_DARK,MOSSCON,DEEPSLATE][Math.floor(r(80)*3)],win:WIN_GREEN,band:NEON_G,kind:'lab',ground:'lab',floor:CHECKER,door:2});
    b.doorSpec={w:0,h:3,k:'steel'};b.detailTop=b.top-1;b.coils=true;brandOn(b,'lab',r(150));p.b.push(b);
  } else if(type==='datacenter'){
    // a data centre behind its fence: a windowless bunker of server racks, cooling units on the roof
    const b=base({x0:PL0+2,x1:PL1-2,z0:PL0+3,z1:PL1-2,top:G+10,style:'dc',wall:CONCRETE,win:CONCRETE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});
    b.noIndoor=true;b.doorSpec={w:0,h:3,k:'steel'};b.detailTop=b.top;b.leds=true;brandOn(b,'datacenter',r(150));p.b.push(b);p.fenced=true;
  } else if(type==='electric'){
    // the electric company: its office at the front, and behind a fence the substation -- transformers, and pylons
    const b=base({x0:PL0+1,x1:PL0+10,z0:PL0+1,z1:PL0+14,top:G+FH,wall:[CONCRETE,BRICK][Math.floor(r(80)*2)],win:WIN_BLUE,kind:'office',ground:'office',floor:FLOORT,door:2});
    b.detailTop=b.top-1;brandOn(b,'electric',r(150));p.b.push(b);
    for(const [x0,z0] of [[PL0+12,PL1-5],[PL0+12,PL0+2]]){const t=base({x0,x1:x0+5,z0,z1:z0+3,top:G+16,style:'pylon',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:GRAVEL,door:2});t.noIndoor=true;t.doorSpec=null;t.detailTop=t.top;p.b.push(t);}
    p.substation={x0:PL0+10,x1:PL1,z0:PL0,z1:PL1};
  } else if(type==='court'){
    // a fenced basketball court among the houses (laid out on the ground in genChunk)
    p.court={x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL1-3};
  } else if(type==='cemetery'){
    // rows of headstones behind a low wall, a gravel cross of paths, a little chapel at the back
    if(r(41)<0.5){
      // (or) a marble mausoleum: columns across its front, and inside a stair down to the crypt under the graves
      const b=base({x0:PC-4,x1:PC+3,z0:PL1-12,z1:PL1-1,top:G+8,style:'mausoleum',wall:MARBLE,win:MARBLE,kind:'landmark',ground:'landmark',floor:MARBLE,door:2});
      b.noIndoor=true;b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top;p.b.push(b);p.crypt={x0:PL0+2,x1:PL1-2,z0:PC-2,z1:PL1-1,sx:b.x0+2,sx1:b.x0+5,sz:b.z0+3};
    } else {const ch=churchB(PC-3,PL1-8,6,7,false,r);ch.top=G+7;ch.roof=3;p.b.push(ch);}
  } else if(type==='church'){
    // (laid out to fit inside the block: the nave, with the steeple beside its front corner)
    const ty=setType(px,pz),big=ty==='city'||ty==='large',W=big?11:9,D=big?15:14,x0=big?PL0+1:PC-(W>>1)-1,z0=big?PL0+1:PL0+3;
    const nave=churchB(x0,z0,W,D,big,r);p.b.push(nave);
    // the steeple, at the front corner
    const sw=big?5:4,st=base({x0:x0+W,x1:x0+W+sw,z0,z1:z0+sw,top:G+(big?34:26),style:'steeple',wall:nave.wall,win:STAINED,kind:'landmark',ground:'landmark',floor:nave.wall,door:2});
    st.trim=nave.trim;st.noIndoor=true;st.detailTop=st.top;st.doorSpec=null;st.shaft=big?18:13;p.b.push(st);
  } else if(type==='courthouse'){
    // a courthouse: stone and columns, a lobby with its metal detector, one tall courtroom behind it. (See civicRoom.)
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+5,z1:PL1-1,gf:9,top:G+9,wall:r(81)<0.5?MARBLE:STONE,win:WIN_WARM,band:MARBLE,kind:'office',ground:'courtroom',floor:PLANKS,door:2});
    b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-1;brandOn(b,'courthouse',r(150));p.b.push(b);p.b.push(portico(b,3,G+8));
  } else if(type==='library'){
    // a branch library in the smaller places; a grand one (stone, columns across the front) in the big ones
    const ty=setType(px,pz),big=ty==='city'||ty==='large';
    if(big){const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL1-1,top:G+3*FH,wall:r(81)<0.5?MARBLE:STONE,win:WIN_WARM,band:MARBLE,kind:'library',ground:'library',floor:PLANKS,door:2});
      b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-1;brandOn(b,'library',r(150));p.b.push(b);p.b.push(portico(b,3,G+FH*2-1));}
    else{const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+4,z1:PL0+16,top:G+FH,wall:BRICK,win:WIN_WARM,kind:'library',ground:'library',floor:PLANKS,door:2});
      b.doorSpec={w:0,h:3,k:'wood'};b.detailTop=b.top-1;brandOn(b,'library',r(150));p.b.push(b);}
  } else if(type==='radio'){
    // a small studio and its tall red-and-white mast, a red light winking on top
    const b=base({x0:PL0+1,x1:PL0+11,z0:PL0+3,z1:PL0+16,top:G+FH,wall:CONCRETE,win:WIN_BLUE,kind:'office',ground:'radio',floor:FLOORT,door:2});
    b.detailTop=b.top-1;brandOn(b,'radio',r(150));p.b.push(b);
    const m=base({x0:PL1-6,x1:PL1-3,z0:PL1-7,z1:PL1-4,top:G+46,style:'mast',wall:PAINT_RED,win:PAINT_WHITE,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2});
    m.noIndoor=true;m.detailTop=m.top;m.doorSpec=null;m.mast=true;p.b.push(m);
  } else if(type==='news'){
    // a TV news station: the newsroom and its studio on the ground floor, offices over it, dishes on the roof
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+4,z1:PL1-1,top:G+3*FH,wall:[METAL,CONCRETE,PAINT_NAVY][Math.floor(r(81)*3)],win:WIN_BLUE,kind:'office',ground:'news',floor:FLOORT,door:2});
    b.detailTop=b.top-1;brandOn(b,'news',r(150));b.dishes=true;p.b.push(b);
  } else if(type==='bank'){
    // a bank: a little branch, a big one downtown (stone, columns), or (in the cities, now and then) a fortress of a
    // place -- thick walls, barred slits for windows, bollards out front and a round vault door on a room of gold
    const ty=setType(px,pz),h=r(80),kd=ty==='city'?(h<0.28?'fort':h<0.8?'big':'small'):ty==='large'?(h<0.6?'big':'small'):'small';
    if(kd==='small'){const b=base({x0:PL0+3,x1:PL1-3,z0:PL0+4,z1:PL0+15,top:G+FH,wall:[BRICK,STUCCO,STONE][Math.floor(r(81)*3)],win:GLASS,kind:'bank',ground:'bank',floor:FLOORT,door:2,front:true,neon:NEON_B});
      b.detailTop=b.top-1;brandOn(b,'bank',r(150));p.b.push(b);}
    else if(kd==='big'){const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL1-1,gf:FH+2,top:G+FH+2+FH*2,wall:r(81)<0.5?MARBLE:STONE,win:WIN_WARM,band:MARBLE,kind:'office',ground:'bank',floor:MARBLE,door:2});
      b.doorSpec={w:1,h:4,k:'wood'};b.detailTop=b.top-1;brandOn(b,'bank',r(150));p.b.push(b);p.b.push(portico(b,3,G+FH+2));}
    else{const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL1-1,gf:FH+1,top:G+FH+1+FH,wall:CONCRETE,win:WIN_BLUE,band:METAL,kind:'office',ground:'bank',floor:MARBLE,door:2});
      b.fort=true;b.vault=true;b.doorSpec={w:1,h:4,k:'glass'};b.detailTop=b.top-1;brandOn(b,'bank',r(150));p.b.push(b);p.bollards=true;}
  } else if(type==='disco'||type==='club'){
    // a disco (a lit dance floor, a mirror ball, the DJ up on his booth) or a goblin night club (a stage with the
    // amps stacked up, a bar down one side, the VIP sofas under green neon) -- blank walls, a big sign, busy at night
    const disco=type==='disco',b=base({x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL1-1,gf:7,top:G+7+(r(81)<0.4?FH:0),wall:disco?PAINT_DARK:[RUST,CONCRETE,BRICK][Math.floor(r(82)*3)],win:disco?PAINT_DARK:RUST,
      kind:'apartment',ground:type,floor:disco?PAINT_DARK:CONCRETE,door:2,neon:disco?NEON_M:NEON_G});
    b.blank=true;b.doorSpec=disco?{w:1,h:3,k:'glass'}:{w:0,h:3,k:'wood'};b.detailTop=b.top-1;brandOn(b,type,r(150));if(disco)b.disco=true;p.b.push(b);
  } else if(type==='wtower'){
    // a water tower on its fenced patch of grass: four legs, a round tank with the town's name on it, a pointed lid
    const S=settlementAt(px,pz),c=[PAINT_WHITE,PAINT_BLUE,PAINT_WHITE,PAINT_GREEN,STUCCO][Math.floor(r(80)*5)];
    const b=base({x0:PC-5,x1:PC+4,z0:PC-4,z1:PC+5,top:G+27,style:'wtower',wall:c,win:c,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,farSkip:true});
    b.noIndoor=true;b.detailTop=b.top;b.doorSpec=null;
    if(S){const dark=c===PAINT_BLUE||c===PAINT_GREEN;b.brand={n:setName(S).toUpperCase(),bg:'#000',fg:dark?'#ffffff':'#1d3f6e',ac:'#000',only:true};b.signCat='wtower';}
    p.b.push(b);
  } else if(type==='bell'){
    // a bell tower on a little green: a stone shaft, an open belfry with its bell, a pointed roof
    const b=base({x0:PC-3,x1:PC+3,z0:PC-2,z1:PC+4,top:G+26,style:'btower',wall:[STONE,MOSSSTONE,BRICK][Math.floor(r(80)*3)],win:WIN_WARM,kind:'landmark',ground:'landmark',floor:PLANKS,door:2});
    b.trim=b.wall===BRICK?MOSSSTONE:MARBLE;b.noIndoor=true;b.detailTop=b.top;b.doorSpec={w:0,h:3,k:'wood'};b.bell=true;p.b.push(b);
  } else if(type==='plaza'){
    // the square's centrepiece: a clock tower (in the bigger places), a statue, an obelisk, or the old lit pillar
    const ty=setType(px,pz),h=r(90);
    p.feat=px===0&&pz===0?'clock':(ty==='city'||ty==='large')?(h<0.45?'clock':h<0.72?'statue':h<0.9?'obelisk':'pillar'):(h<0.5?'statue':h<0.78?'obelisk':'pillar');
    if(p.feat==='clock'){const b=base({x0:PC-3,x1:PC+3,z0:PC-3,z1:PC+3,top:G+31,style:'ctower',wall:r(91)<0.6?BRICK:MOSSSTONE,win:WIN_WARM,kind:'landmark',ground:'landmark',floor:PLANKS,door:2});
      b.trim=b.wall===BRICK?MARBLE:STONE;b.noIndoor=true;b.detailTop=b.top;b.doorSpec={w:0,h:3,k:'wood'};b.clock=true;p.b.push(b);}
    else if(p.feat==='statue')p.b.push(monument('statue',r));
    else if(p.feat==='obelisk')p.b.push(monument('obelisk',r));
  } else if(type==='food'){
    // a little restaurant, a diner, a pizzeria or a cafe, filling its block: a glass front and neon over the door, a
    // patio of tables under umbrellas out front. (Inside: see restProps.)
    const kinds=['diner','pizza','cafe'],k=Math.floor(r(80)*3),walls=[BRICK,SIDING,CONCRETE,SIDING_Y],neons=[NEON_R,NEON_M,NEON_B,NEON_G];
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+4,z1:PL1-1,gf:6,top:G+6,wall:walls[Math.floor(r(84)*walls.length)],win:GLASS,kind:'apartment',ground:kinds[k],floor:k===0?CHECKER:PLANKS,door:2,front:true,neon:neons[Math.floor(r(87)*neons.length)]});
    b.detailTop=b.top-1;b.eat=true;brandOn(b,kinds[k],r(150));p.b.push(b);
    p.patio={z0:PL0,z1:PL0+4};
  } else if(type==='fastfood'){
    // a fast-food joint: a low box with a glass front, a drive-thru lane round it, a tall pole sign by the road
    const b=base({x0:PL0+1,x1:PL0+15,z0:PL0+4,z1:PL0+17,gf:6,top:G+6,wall:BRICK,win:GLASS,kind:'apartment',ground:'fastfood',floor:FLOORT,door:2,front:true,neon:NEON_R});
    b.eat=true;b.dthru=PL0+14;
    b.detailTop=b.top-1;brandOn(b,'fastfood',r(150));p.b.push(b);
    p.pole={x:PL1-2,z:PL0+1};
  } else if(type==='sitdown'){
    // a sit-down family restaurant: one big tall-ceilinged dining room with booths and a bar, its car park out back
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL0+3,z1:PL0+17,gf:7,top:G+7,wall:BRICK,win:WIN_WARM,kind:'apartment',ground:'sitdown',floor:PLANKS,door:2,neon:NEON_R});
    b.eat=true;b.eatTile=5;b.rowWin=true;b.detailTop=b.top-1;brandOn(b,'sitdown',r(150));p.b.push(b);
  } else if(type==='fire'){
    // the fire station: three big engine bays opening onto the street, crew quarters upstairs, a hose-drying tower
    // (a city's has three bays and a hose tower; a large town's two and a shorter tower; a small town's or village's just one)
    const nb=stnTier(px,pz),fx1=PL0+14,gf=7;
    const b=base({x0:PL0+1,x1:fx1,z0:PL0+4,z1:PL1-1,gf,top:G+gf+FH,wall:BRICK,win:WIN_WARM,band:PAINT_RED,kind:'apartment',ground:'firehall',floor:FLOORT,door:2,neon:NEON_R});
    b.bays=[PL0+3,PL0+7,PL0+11].slice(0,nb);b.allBays=true;b.detailTop=b.top-1;brandOn(b,'fire',r(140));b.stair={ax:'x',c0:PL1-4,c1:PL1-2,r0:PL0+3,L:gf,m:1};p.b.push(b);
    // the hose-drying tower: what makes it a fire station from anywhere in town
    {const t2=base({x0:fx1,x1:fx1+3,z0:PL1-6,z1:PL1-1,top:G+(nb===3?6:nb===2?5:4)*FH,wall:BRICK,win:WIN_WARM,band:PAINT_RED,kind:'office',ground:'office',floor:FLOORT,door:0});
     t2.detailTop=t2.top-1;p.b.push(t2);}
    p.apron=true;
  } else if(type==='build'){
    // a construction site: a concrete frame going up (bare columns and floors, walls only on the lowest storeys),
    // a tower crane, the site office (a shipping container), spoil heaps, and a fence round it all
    const floors=5+Math.floor(r(90)*8),done=Math.max(1,Math.floor(floors*(0.35+r(91)*0.5)));
    const b=base({x0:PL0+3,x1:PL1-5,z0:PL0+6,z1:PL1-2,top:G+storeys(floors*FH),style:'site',wall:BRICK,win:GLASS,kind:'office',ground:'office',floor:CONCRETE,door:2});
    b.done=done;b.detailTop=b.top;p.b.push(b);
    p.crane={x:PL1-3,z:PL0+6,top:b.top+8+Math.floor(r(92)*6)};
  } else if(type==='farm'){
    // out on the plains: a farmhouse and a big red barn at the end nearest the road, a fenced field of crops filling
    // the rest (a farm with its highway to the south is laid out the other way round: mirror() flips z)
    const N=farmNorth(px,pz),mz=(z0,z1)=>N?[PL0+PL1-z1,PL0+PL1-z0]:[z0,z1];p.north=N;
    {const [z0,z1]=mz(PL0+1,PL0+11);const fh=base({x0:PL0+1,x1:PL0+11,z0,z1,style:'house',top:G+FH,wall:r(70)<0.5?SIDING:PLANKS,win:WIN_WARM,kind:'apartment',ground:'apartment',floor:PLANKS,door:N?3:2,ridgeX:true});
     fh.home=true;fh.roof=Math.floor((fh.z1-fh.z0)/2);fh.detailTop=fh.top;p.b.push(fh);}
    {const [z0,z1]=mz(PL0+1,PL0+11);const bn=base({x0:PL1-7,x1:PL1-1,z0,z1,style:'house',gf:9,top:G+9,wall:RUST,win:RUST,kind:'barn',ground:'barn',floor:GRAVEL,door:N?3:2,ridgeX:false});
     bn.roof=Math.floor((bn.x1-bn.x0)/2);bn.detailTop=bn.top;p.b.push(bn);}
    {const [z0,z1]=mz(PL0+12,PL1);p.field={x0:PL0,x1:PL1,z0,z1};}
  } else if(type==='truckstop'){
    // the store at the back of a truck stop's grounds: a long low building facing the road, under the brand's sign
    const T=tsPlot(px,pz),bx=T.cx+T.nx*47-px*CELL,bz=T.cz+T.nz*47-pz*CELL,alongX=Math.abs(T.tx)>=Math.abs(T.tz),W=alongX?22:12,D=alongX?12:22;
    const x0=Math.max(1,Math.min(CELL-1-W,Math.round(bx-W/2))),z0=Math.max(1,Math.min(CELL-1-D,Math.round(bz-D/2)));
    const door=alongX?(T.nz>0?2:3):(T.nx>0?0:1);
    const b=base({x0,x1:x0+W,z0,z1:z0+D,top:G+FH,wall:BRICK,win:GLASS,kind:'shop',ground:'shop',floor:FLOORT,door,neon:NEON_R,front:true});
    b.detailTop=b.top-1;brandOn(b,'gas',r(140));b.signCat='kiosk';p.b.push(b);p.stall=0;
  } else if(type==='gas'){
    // the shop across the back; the great canopy and its pumps fill the front (laid out with the forecourt in genChunk)
    const b=base({x0:PL0+1,x1:PL1-1,z0:PL1-8,z1:PL1-1,top:G+FH,wall:BRICK,win:GLASS,kind:'shop',ground:'shop',floor:FLOORT,door:2,neon:NEON_R,front:true});
    b.detailTop=b.top-1;brandOn(b,'gas',r(140));b.signCat='kiosk';p.b.push(b);
  }
  if(type==='park'&&!p.pond&&r(35)<0.45){p.statue=true;p.b.push(monument('statue',r));}
  if(p.super&&p.super.w>=3&&/^(campus|prison|studio|factory)$/.test(p.super.kind))for(const q of p.b){if(q.stair||q.noIndoor||q.style!=='normal'||q.top-G<=(q.gf||FH)+1||q.fort&&q.kind==='police')continue;
    const L=Math.max(q.gf||FH,FH);
    // (a cell block: in an open hall at the far end, beside the corridor. A library: at the reading-room end, clear of the shelves)
    if(q.kind==='cells'){const I=q.x1-q.x0-2,J=q.z1-q.z0-2,long=I>=J,Wl=long?I:J,c0=(long?q.z0:q.x0)+2,r0=(long?q.x0:q.z0)+1+Wl-L-3;q.stair={ax:long?'x':'z',c0,c1:c0+3,r0,L};q.stairHall=[Wl-L-6,Wl,false];continue;}
    if(q.ground==='library'&&q.x1-q.x0>=L+7){q.stair={ax:'x',c0:q.z0+2,c1:q.z0+5,r0:q.x0+2,L};if(q.x1-q.x0>=90)q.stair2={ax:'x',c0:q.z1-6,c1:q.z1-3,r0:q.x1-L-5,L};continue;}   // (a very long one: stairs at the other end too)
    if(q.x1-q.x0>=L+7&&q.z1-q.z0>=10)q.stair={ax:'x',c0:q.z1-6,c1:q.z1-3,r0:q.x0+2,L};else if(q.z1-q.z0>=L+7&&q.x1-q.x0>=10)q.stair={ax:'z',c0:q.x1-6,c1:q.x1-3,r0:q.z0+2,L};}
  addLots(p,px,pz,r);
  if(type==='tower'||type==='mid'){
    const J=plotBounds(px,pz);
    for(const b of p.b){if(J.x0<PL0&&b.x0<=PL0+3)b.x0=J.x0;if(J.x1>PL1&&b.x1>=PL1-3)b.x1=J.x1;if(J.z0<PL0&&b.z0<=PL0+3)b.z0=J.z0;if(J.z1>PL1&&b.z1>=PL1-3)b.z1=J.z1;}
  }
  p.b.forEach(autoStair);
  plotCache.set(k,p);return p;
}
