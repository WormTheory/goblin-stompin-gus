// ---------- Structural physics ----------
const bodies=[];
const bkey=(x,y,z)=>((x+100000)*256+y)*200000+(z+100000);
const colKey=(x,z)=>(x+100000)*200000+(z+100000);
const NB6=[[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]]; // popped last-first, so downward is explored first
function colSupport(x,z,fromY){for(let y=Math.min(H-1,fromY-1);y>=0;y--)if(solidAt(x,y,z))return y+1;return 0;}
// returns the blocks of a piece that no longer connects to the ground, or null if it is held up
const FC_REACH=72;
function floatingCluster(sx,sy,sz,supported){
  if(sy<=G)return null;
  const b0=get(sx,sy,sz);if(b0===AIR||b0===WATER||b0===LEAVES)return null;
  const k0=bkey(sx,sy,sz);if(supported.has(k0))return null;
  const seen=new Set([k0]),list=[];
  const held=()=>{for(const k of seen)supported.add(k);return null;};
  // search outward for something that reaches the ground, always taking the lowest open block next (so a
  // building's walls are followed straight down, and along a highway deck the nearest pillar is found first).
  // It stays local: anything that runs on further than FC_REACH blocks sideways (a highway, a long terrace), or
  // into ground that isn't loaded, counts as held up, so the search never wanders off across the city.
  const bk=[],hd=[];let cy=sy;
  const push=(x,y,z)=>{(bk[y]||(bk[y]=[])).push(x,y,z);if(hd[y]===undefined)hd[y]=0;if(y<cy)cy=y;};
  push(sx,sy,sz);
  for(;;){
    while(cy<H&&(!bk[cy]||hd[cy]>=bk[cy].length))cy++;
    if(cy>=H)break;
    const B=bk[cy],i=hd[cy];hd[cy]+=3;const q=[B[i],B[i+1],B[i+2]];list.push(q);
    if(list.length>20000)return held();
    for(const [dx,dy,dz] of NB6){
      const nx=q[0]+dx,ny=q[1]+dy,nz=q[2]+dz;
      if(ny<0||ny>=H)continue;
      if(Math.abs(nx-sx)>FC_REACH||Math.abs(nz-sz)>FC_REACH)return held();
      if(!chunks.has(ckey(Math.floor(nx/CS),Math.floor(nz/CS))))return held();
      const b=get(nx,ny,nz);if(b===AIR||b===WATER||b===LEAVES)continue;
      if(ny<=G)return held();
      const k=bkey(nx,ny,nz);if(seen.has(k))continue;if(supported.has(k))return held();
      seen.add(k);push(nx,ny,nz);
    }
  }
  const out=list.map(([x,y,z])=>({x,y,z,b:get(x,y,z)}));
  // leaves don't hold anything up: a falling trunk takes its canopy with it, unless another trunk is close by
  const logs=out.filter(q=>q.b===LOG);
  if(logs.length){
    const inCl=new Set(out.map(q=>bkey(q.x,q.y,q.z))),taken=new Set();
    const nearOtherLog=(x,y,z)=>{for(let dy=-2;dy<=2;dy++)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)if(get(x+dx,y+dy,z+dz)===LOG&&!inCl.has(bkey(x+dx,y+dy,z+dz)))return true;return false;};
    for(const q of logs)for(let dy=-2;dy<=3;dy++)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
      const x=q.x+dx,y=q.y+dy,z=q.z+dz,k=bkey(x,y,z);
      if(taken.has(k)||get(x,y,z)!==LEAVES||nearOtherLog(x,y,z))continue;
      taken.add(k);out.push({x,y,z,b:LEAVES});
    }
  }
  return out;
}
function bldgAt(x,z){let px=Math.floor(x/CELL),pz=Math.floor(z/CELL),rx=mod(x,CELL),rz=mod(z,CELL);const S=superOf(px,pz);if(S){px=S.ax;pz=S.az;rx=x-px*CELL;rz=z-pz*CELL;}const P=plotInfo(px,pz);for(let i=0;i<P.b.length;i++){const b=P.b[i];if(rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1)return{b,i,px,pz,key:px+','+pz+','+i};}return null;}
// ---- destruction: how much of each building is gone, and how much of each place ----
// Every time an original block of a building is knocked out (by anything: a bite, a stomp, a collapse), that building's
// count goes up. Blocks that weren't part of it as built (rubble piled on top, a car) don't count, and neither does
// knocking out the same spot twice. How many blocks a building had to begin with is worked out from its plan --
// sampled column by column, so it's quick even for a skyscraper -- and cached.
const bSolidC=new Map(),setDestC=new Map(),setTotC=new Map(),setListC=new Map();let destroyVer=0;   // (bumped whenever anything's knocked out)
function noteRemoved(x,y,z){
  x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);
  if((x+','+y+','+z) in edits)return;   // (not as built: it's been changed before)
  const v=rawGet(x,y,z);if(v===AIR)return;
  if(noteFor){noteQ.push(x,y,z,v,noteFor);return;}
  noteBlock(x,y,z,v,bldgAt(x,z));
}
function noteBlock(x,y,z,v,B){
  if(!B)return;const b=B.b,rx=x-B.px*CELL,rz=z-B.pz*CELL;
  if(y>colTop(b,rx,rz))return;
  const sv=STRUCT;const o=blockAt(b,rx,rz,y,B.px,B.pz);STRUCT=sv;if(o!==v)return;
  destroyed[B.key]=(destroyed[B.key]||0)+1;
  destroyVer++;
}
// a building coming down takes tens of thousands of blocks at a stroke: they're counted over the next few frames, not all in
// the one where it goes (the figures on the map only need to catch up a moment later)
let noteFor=null;const noteQ=[];
function flushNotes(ms){
  if(!noteQ.length)return;const t0=performance.now();let i=0;
  while(i<noteQ.length){noteBlock(noteQ[i],noteQ[i+1],noteQ[i+2],noteQ[i+3],noteQ[i+4]);i+=5;if(!(i%500)&&performance.now()-t0>ms)break;}
  if(i>=noteQ.length)noteQ.length=0;else noteQ.splice(0,i);
}
function colTop(b,rx,rz){const tierOn=b.tier>0&&(b.x1-b.x0)>=8,inner=rx>=b.x0+2&&rx<b.x1-2&&rz>=b.z0+2&&rz<b.z1-2;return ((tierOn&&!inner)?b.tier:b.top)+(b.roof||0);}
// a building's original block count (estimated from up to 72 of its columns, picked evenly across the footprint)
function bldgSolid(b,px,pz,key){
  let n=bSolidC.get(key);if(n!==undefined)return n;
  const W=b.x1-b.x0,D=b.z1-b.z0,A=W*D,K=Math.min(A,72),sv=STRUCT;let sum=0;
  for(let i=0;i<K;i++){const c=K===A?i:Math.floor((i+0.5)*A/K),rx=b.x0+c%W,rz=b.z0+Math.floor(c/W),t=colTop(b,rx,rz);
    for(let y=G+1;y<=t&&y<H;y++)if(blockAt(b,rx,rz,y,px,pz)!==AIR)sum++;}
  STRUCT=sv;n=Math.max(1,Math.round(sum*A/K));bSolidC.set(key,n);return n;
}
// what's left of a building, 0..1
function bldgLeft(b,px,pz,key){return Math.max(0,1-(destroyed[key]||0)/bldgSolid(b,px,pz,key));}
// how little of it has to be left for it to count as destroyed, by its size: a one- or two-storey place is gone once
// half of it is; the taller it is the less of it can be left (what's left of a tower is still a lot of building), down
// to a tenth at a dozen storeys or more. A very big footprint lowers it a little more (half a superstore still stands).
function bldgThresh(b){
  const st=Math.max(1,Math.round((b.top-G)/FH)),A=(b.x1-b.x0)*(b.z1-b.z0);
  const big=Math.max(0,Math.min(1,Math.log10(Math.max(1,A/150))/Math.log10(20)));
  return Math.max(0.08,Math.min(0.5,1.2/st))*(1-0.3*big);
}
const bldgStanding=(b,px,pz,key)=>bldgLeft(b,px,pz,key)>bldgThresh(b);
// every building of a place (each superblock's buildings once, from its anchor)
function setBuildings(S){
  const out=[],seen=new Set(),R=Math.ceil(S.R+3);
  for(let px=S.cx-R;px<=S.cx+R;px++)for(let pz=S.cz-R;pz<=S.cz+R;pz++){
    if(settlementAt(px,pz)!==S)continue;let qx=px,qz=pz;const SB=superOf(px,pz);if(SB){qx=SB.ax;qz=SB.az;}
    const k0=qx+','+qz;if(seen.has(k0))continue;seen.add(k0);
    plotInfo(qx,qz).b.forEach((b,i)=>out.push({b,px:qx,pz:qz,key:k0+','+i}));}
  return out;
}
// how destroyed a place is, 0..1 -- or null while its total is still being worked out (a little each frame, so
// walking into a big city never stalls the game). A building that's been destroyed counts as entirely gone, whatever
// is left of it; one still standing counts the blocks actually knocked out of it. No building left standing: 100%.
const destJob={S:null,list:null,i:0,tot:0},setDCache=new Map();let setDVer=0;   // (bumped when a place's figure changes)
function setDestroyed(S){
  const k=S.rx+','+S.rz;let L=setListC.get(k);
  if(!L){
    if(destJob.S!==S){destJob.S=S;destJob.list=setBuildings(S);destJob.i=0;destJob.tot=0;}
    const t0=performance.now();
    while(destJob.i<destJob.list.length&&performance.now()-t0<3){const E=destJob.list[destJob.i++];destJob.tot+=bldgSolid(E.b,E.px,E.pz,E.key);}
    if(destJob.i<destJob.list.length)return null;
    L=destJob.list;setListC.set(k,L);setTotC.set(k,destJob.tot);destJob.S=null;}
  if(!L.length)return 0;
  const now=performance.now();let C=setDCache.get(k);
  if(!C||C.ver!==destroyVer&&now-C.t>250){
    let D=0,stand=0;
    for(const E of L){const N=bldgSolid(E.b,E.px,E.pz,E.key),d=destroyed[E.key]||0;
      if(d&&!bldgStanding(E.b,E.px,E.pz,E.key))D+=N;else{stand++;D+=Math.min(d,N);}}
    const v=stand===0?1:Math.min(1,D/Math.max(1,setTotC.get(k)));if(!C||C.v!==v)setDVer++;
    C={ver:destroyVer,t:now,v};setDCache.set(k,C);}
  return C.v;
}
// a place that's been wiped out (only known once its total has been worked out, i.e. once someone's been there)
const setGone=S=>setListC.has(S.rx+','+S.rz)&&setDestroyed(S)>=1;
// ---- how the maps show destruction, block by block ----
// A block with buildings is destroyed once all of them are. A block with nothing on it to destroy (a park, a plaza, a
// car park...) goes with its neighbours: it counts as destroyed when every built-on block of its place that it touches
// is destroyed -- touching directly, through other empty blocks, or across a narrow strip of plains (up to two blocks
// of it). And a narrow strip of plains (up to five blocks across) with destroyed blocks of the same place on both
// sides, along its row or its column, is shown destroyed too, so the destruction reads as one patch instead of
// scattered bits. Once a whole place is wiped out, all of it counts (rivers through it stay rivers), and so does every
// stretch of plains between its pieces, however wide.
const deadMemo={ver:-1,sv:-1,m:new Map()};
const hasBldgs=(px,pz)=>{const SB=superOf(px,pz);return plotInfo(SB?SB.ax:px,SB?SB.az:pz).b.length>0;};
function mapDead(px,pz){
  // (worked out afresh whenever anything's knocked out -- or a place's figure catches up with it, which can come a
  // moment later: that's what flips a place to wiped out)
  if(deadMemo.ver!==destroyVer||deadMemo.sv!==setDVer){deadMemo.ver=destroyVer;deadMemo.sv=setDVer;deadMemo.m.clear();}
  const key=px*100003+pz;let v=deadMemo.m.get(key);if(v!==undefined)return v;
  deadMemo.m.set(key,false);   // (guards against going round in circles)
  const S=settlementAt(px,pz);
  if(!S)v=plainsGap(px,pz);
  else if(plotType(px,pz)==='river')v=false;
  else if(setGone(S))v=true;
  else if(hasBldgs(px,pz))v=blockRuined(px,pz);
  else v=emptyDead(px,pz,S);
  deadMemo.m.set(key,v);return v;
}
// an empty block: spread out through the empty blocks of its place (and up to two blocks out across plains), stopping
// at built-on blocks; it's destroyed if it reached at least one and every one it reached is destroyed
function emptyDead(px,pz,S){
  const seen=new Set([px*100003+pz]),q=[[px,pz,0]];let edge=false;
  for(let n=0;n<q.length;n++){if(q.length>400)return false;const [x,z,d]=q[n];
    for(const [dx,dz] of DIRV){const a=x+dx,b=z+dz,k2=a*100003+b;if(seen.has(k2))continue;seen.add(k2);
      const T=settlementAt(a,b);
      if(T===S){if(plotType(a,b)==='river')continue;
        if(hasBldgs(a,b)){edge=true;if(!blockRuined(a,b))return false;}else q.push([a,b,d]);}
      else if(!T&&d<2&&plotType(a,b)==='plains')q.push([a,b,d+1]);}}
  return edge;
}
// open plains between destroyed pieces of a place: the nearest blocks of that place on both sides of it (along its
// row, or its column) are destroyed -- within a couple of blocks normally, or anywhere across it once it's wiped out
function plainsGap(px,pz){
  const t=plotType(px,pz);if(t!=='plains')return false;
  const rx0=Math.round(px/SET_SP),rz0=Math.round(pz/SET_SP);
  for(let rx=rx0-1;rx<=rx0+1;rx++)for(let rz=rz0-1;rz<=rz0+1;rz++){
    const S=settlementLat(rx,rz),R=Math.ceil(S.R*1.6)+3;
    if(Math.abs(px-S.cx)>R||Math.abs(pz-S.cz)>R)continue;
    const gone=setGone(S),reach=gone?2*R:3;
    // the first block of the place met going this way: is it destroyed? (open plains on the way are fine; anything
    // else -- a river, another place -- breaks it)
    const side=(dx,dz)=>{for(let i=1;i<=reach;i++){const a=px+dx*i,b=pz+dz*i,T=settlementAt(a,b);
      if(T===S)return gone||plotType(a,b)!=='river'&&mapDead(a,b);if(!gone&&(T||plotType(a,b)!=='plains'))return false;}return false;};
    if(side(1,0)&&side(-1,0)||side(0,1)&&side(0,-1))return true;
  }
  return false;
}
// goblins only turn up near buildings that are still standing (a farmhouse counts; open fields and roads don't)
function nearStanding(x,z,r=14){
  const seen=new Set();
  for(let px=Math.floor((x-r)/CELL);px<=Math.floor((x+r)/CELL);px++)for(let pz=Math.floor((z-r)/CELL);pz<=Math.floor((z+r)/CELL);pz++){
    let qx=px,qz=pz;const SB=superOf(px,pz);if(SB){qx=SB.ax;qz=SB.az;}
    const k0=qx+','+qz;if(seen.has(k0))continue;seen.add(k0);
    const P=plotInfo(qx,qz),X0=qx*CELL,Z0=qz*CELL;
    for(let i=0;i<P.b.length;i++){const b=P.b[i];
      const dx=Math.max(X0+b.x0-x,0,x-(X0+b.x1)),dz=Math.max(Z0+b.z0-z,0,z-(Z0+b.z1));
      if(Math.hypot(dx,dz)<=r&&bldgStanding(b,qx,qz,k0+','+i))return true;}}
  return false;
}
function settle(broken,o={}){
  // 1. buildings: losing about half of a floor's cross-section brings down everything above it
  const cand=new Map();
  for(const q of broken){
    if(q.y<=G)continue;const B=bldgAt(q.x,q.z);if(!B||q.y>B.b.top)continue;
    const L=collapses[B.key];if(L!==undefined&&q.y>=L)continue;
    let e=cand.get(B.key);if(!e){e={B,levels:new Set()};cand.set(B.key,e);}e.levels.add(q.y);
  }
  for(const {B,levels} of cand.values()){
    const b=B.b,X0=B.px*CELL,Z0=B.pz*CELL;
    for(const y of [...levels].sort((p,q)=>p-q)){
      const up=b.tier>0&&(b.x1-b.x0)>=8&&y>b.tier,x0=up?b.x0+2:b.x0,x1=up?b.x1-2:b.x1,z0=up?b.z0+2:b.z0,z1=up?b.z1-2:b.z1;
      // only walls and pillars hold a building up; floors and furniture don't count
      let solid=0,base=0;
      for(let x=b.x0;x<b.x1;x++)for(let z=b.z0;z<b.z1;z++){blockAt(b,x,z,y,B.px,B.pz);if(!STRUCT)continue;base++;if(get(X0+x,y,Z0+z)!==AIR)solid++;}
      if(base>0&&solid<base*0.5){collapseBuilding(B,y,o.impact?{x:o.dx,z:o.dz}:null);break;}
    }
  }
  // 2. anything else left hanging in the air
  const starts=[];for(const q of broken)for(const [dx,dy,dz] of NB6)starts.push([q.x+dx,q.y+dy,q.z+dz]);
  dropFloating(starts,o);
}
// every piece reachable from these cells that no longer connects to the ground falls (or tips over)
function dropFloating(starts,o={}){
  const supported=new Set();
  for(const [sx,sy,sz] of starts){
    const cl=floatingCluster(sx,sy,sz,supported);
    if(!cl)continue;
    const ch=new Set();
    for(const c of cl){setRaw(c.x,c.y,c.z,AIR);addEdit(c.x,c.y,c.z,AIR);ch.add(ckey(Math.floor(c.x/CS),Math.floor(c.z/CS)));for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]])ch.add(ckey(Math.floor((c.x+ox)/CS),Math.floor((c.z+oz)/CS)));}
    rebuildSet(ch);save();
    const big=cl.filter(c=>c.b!==LEAVES&&c.b!==LOG).length>=60;
    let minY=1e9,maxY=-1e9,mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;
    for(const c of cl){minY=Math.min(minY,c.y);maxY=Math.max(maxY,c.y);mnx=Math.min(mnx,c.x);mxx=Math.max(mxx,c.x);mnz=Math.min(mnz,c.z);mxz=Math.max(mxz,c.z);}
    const hgt=maxY-minY+1,wid=Math.max(mxx-mnx,mxz-mnz)+1;
    if(hgt>=4&&hgt>=wid*0.8){
      // tall and narrow (trees, towers): tip over, away from whatever hit it
      let dx=o.dx||0,dz=o.dz||0;if(!dx&&!dz){const a=Math.random()*Math.PI*2;dx=Math.cos(a);dz=Math.sin(a);}
      const dl=Math.hypot(dx,dz);dx/=dl;dz/=dl;
      const bottom=cl.filter(c=>c.y===minY);let bx=0,bz=0;for(const c of bottom){bx+=c.x+.5;bz+=c.z+.5;}bx/=bottom.length;bz/=bottom.length;
      let m=0;for(const c of bottom)m=Math.max(m,(c.x+.5-bx)*dx+(c.z+.5-bz)*dz);m+=0.5;
      makeTopple(cl,new V3(bx+dx*m,minY,bz+dz*m),new V3(dx,0,dz));
    } else makeBody(cl,big);
    if(big){let cx=0,cz=0;for(const c of cl){cx+=c.x;cz+=c.z;}cx/=cl.length;cz/=cl.length;{const pts=bldgPts(cl.length);score+=pts;flashLabel('Building down  +'+pts);}noise(3.2,0.9,300,'lowpass');tone('sawtooth',60,24,3.2,0.25);addShake(0.6,cx,cz,70);for(const p of players)if(p.active)rumble(p,0.9,900);}
  }
}
const bldgPts=n=>Math.max(100,Math.round(n*0.5/10)*10);
// a fall direction (unit vector) within 20 degrees of north, south, east or west is turned to point exactly that way
const SNAP_COS=Math.cos(20*Math.PI/180);
function snapCard(dx,dz){if(Math.abs(dx)>=SNAP_COS)return [Math.sign(dx),0];if(Math.abs(dz)>=SNAP_COS)return [0,Math.sign(dz)];return [dx,dz];}
// a building's outer walls on one level, as it was built rather than as it's left standing (otherwise, with a stretch of
// wall smashed out, the stairs or an inside wall behind it would pass for the outside): the first and last structural
// block along every row and every column of its footprint. Keys are (x-b.x0)*(b.z1-b.z0)+(z-b.z0).
function outerWalls(b,y,px,pz){
  const W=b.x1-b.x0,D=b.z1-b.z0,st=new Uint8Array(W*D),out=new Set();
  for(let x=0;x<W;x++)for(let z=0;z<D;z++){blockAt(b,b.x0+x,b.z0+z,y,px,pz);st[x*D+z]=STRUCT?1:0;}
  for(let z=0;z<D;z++){let a=-1,c=-1;for(let x=0;x<W;x++)if(st[x*D+z]){if(a<0)a=x;c=x;}if(a>=0){out.add(a*D+z);out.add(c*D+z);}}
  for(let x=0;x<W;x++){let a=-1,c=-1;for(let z=0;z<D;z++)if(st[x*D+z]){if(a<0)a=z;c=z;}if(a>=0){out.add(x*D+a);out.add(x*D+c);}}
  return out;
}
function collapseBuilding(B,L,push){
  const b=B.b,X0=B.px*CELL,Z0=B.pz*CELL,body=[],crumble=[],stood=[],ch=new Set();
  if(BLAME!=='acc')reportCrime(X0+(b.x0+b.x1)/2,Z0+(b.z0+b.z1)/2);
  for(let x=b.x0;x<b.x1;x++)for(let z=b.z0;z<b.z1;z++){
    const wx=X0+x,wz=Z0+z;
    noteFor=B;
    for(let y=L;y<H;y++){const v=get(wx,y,wz);if(v===AIR)continue;if(y===L)stood.push({x:wx,z:wz});if(y<L+FH+1&&collapseKeep(b,B.px,B.pz,x,z,y,L))continue;(y===L?crumble:body).push({x:wx,y,z:wz,b:v});setRaw(wx,y,wz,AIR);}
    noteFor=null;
  }
  for(let x=b.x0-1;x<=b.x1;x++)for(let z=b.z0-1;z<=b.z1;z++)ch.add(ckey(Math.floor((X0+x)/CS),Math.floor((Z0+z)/CS)));
  collapses[B.key]=Math.min(collapses[B.key]??1e9,L);
  rebuildSet(ch);save();
  // whatever the collapse left hanging: bits of the stump or the furniture whose support was already smashed away,
  // and anything fixed to the outside of the building (signs, awnings, a skybridge) -- all of it comes down too
  {const st=[],top=Math.min(H-1,b.top+(b.roof||0)+(b.ant||0)+3);
   for(let x=b.x0-1;x<=b.x1;x++)for(let z=b.z0-1;z<=b.z1;z++){
     const wx=X0+x,wz=Z0+z,inside=x>=b.x0&&x<b.x1&&z>=b.z0&&z<b.z1;
     for(let y=Math.max(G+1,L-1);y<=(inside?Math.min(top,L+FH+1):top);y++)if(get(wx,y,wz)!==AIR)st.push([wx,y,wz]);}
   dropFloating(st,push?{dx:push.x,dz:push.z}:{});}
  for(let i=crumble.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[crumble[i],crumble[j]]=[crumble[j],crumble[i]];}
  destroyFX(crumble.slice(0,24),{force:1.1,dx:0,dz:0,up:1});
  if(!body.length)return;
  // which way does it go? Toward the side that lost its support, hinged on the far edge of what's left.
  // Only the outer walls decide that: how much of them is still standing on the floor that gave way, against the middle
  // of the whole ring of them. Stairs, pillars, inside walls, the floor slab and the furniture are all left out (a
  // staircase built against one side would otherwise drag the lean that way, even with every outer wall standing).
  let mx=0,mz=0,sup;
  const ow=outerWalls(b,L,B.px,B.pz),OD=b.z1-b.z0;
  if(ow.size){
    for(const k of ow){mx+=X0+b.x0+Math.floor(k/OD)+.5;mz+=Z0+b.z0+k%OD+.5;}mx/=ow.size;mz/=ow.size;
    // (every block of them still there on that floor, whether the collapse leaves it as part of the stump or not: which
    // bits of the stump stay is chance, and mustn't decide the way it falls. None left at all: it drops straight down, unless pushed)
    sup=stood.filter(q=>ow.has((q.x-X0-b.x0)*OD+(q.z-Z0-b.z0)));
  } else {   // (nothing structural to call a wall: the old way, from the middle of what falls and whatever's left standing)
    for(const q of body){mx+=q.x+.5;mz+=q.z+.5;}mx/=body.length;mz/=body.length;
    sup=crumble;
  }
  let tip=null;
  if(sup.length){
    let sx=0,sz=0;for(const q of sup){sx+=q.x+.5;sz+=q.z+.5;}sx/=sup.length;sz/=sup.length;
    let dx=mx-sx,dz=mz-sz;
    if(push){dx+=push.x*3;dz+=push.z*3;}
    const dl=Math.hypot(dx,dz);
    if(dl>0.8){dx/=dl;dz/=dl;[dx,dz]=snapCard(dx,dz);let m=0;for(const q of sup)m=Math.max(m,(q.x+.5-sx)*dx+(q.z+.5-sz)*dz);m+=0.5;tip={p:new V3(sx+dx*m,L,sz+dz*m),d:new V3(dx,0,dz)};}
  } else if(push){const pl=Math.hypot(push.x,push.z)||1,[px,pz]=snapCard(push.x/pl,push.z/pl);tip={p:new V3(mx+px*(b.x1-b.x0)/2,L,mz+pz*(b.z1-b.z0)/2),d:new V3(px,0,pz)};}
  if(tip)makeTopple(body,tip.p,tip.d);else makeBody(body,body.length>=60);
  const cx=X0+(b.x0+b.x1)/2,cz=Z0+(b.z0+b.z1)/2;
  if(body.length>=60){
    const pts=bldgPts(body.length);score+=pts;flashLabel((L>G+(b.gf||FH)+1?'Building toppled  +':'Building down  +')+pts);
    noise(3.2,0.9,300,'lowpass');tone('sawtooth',60,24,3.2,0.25);tone('triangle',150,60,0.9,0.1,0.3);tone('triangle',120,50,1.1,0.1,1.2);
    addShake(0.6,cx,cz,70);for(const p of players)if(p.active)rumble(p,0.9,900);
  }
}
const clipMat=plane=>nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,alphaTest:.5,clippingPlanes:[plane]}));
// A material with a clipping plane needs a graphics program of its own, and three.js throws a program away when the last
// material using it goes. So every building falling straight down would compile that program afresh, a stall right as it
// goes. This one speck is drawn once, on the first frame, and its material kept: that program stays ready from then on.
{const g=new THREE.BufferGeometry(),z=()=>new THREE.Float32BufferAttribute([0,0,0,0,0,0,0,0,0],3);
 g.setAttribute('position',z());g.setAttribute('color',z());g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,0,0,0],2));
 const m=new THREE.Mesh(g,clipMat(new THREE.Plane(new V3(0,1,0),1e6)));m.frustumCulled=false;m.onAfterRender=()=>{m.visible=false;};scene.add(m);}
function buildBodyMesh(blocks,plane){
  const set=new Set();for(const q of blocks)set.add(bkey(q.x,q.y,q.z));
  const P=[],U=[],C=[],I=[],surface=[];
  for(const q of blocks){
    const info=BLOCK[q.b];if(!info||!info.tiles)continue;let ex=false;
    for(const f of FACES){
      const [dx,dy,dz]=f.dir;if(set.has(bkey(q.x+dx,q.y+dy,q.z+dz)))continue;ex=true;
      const tile=dy===1?info.tiles[0]:dy===-1?info.tiles[1]:info.tiles[2],tx=tile%AC,ty=Math.floor(tile/AC),n=P.length/3,s=info.glow?2:f.shade*DIM;
      for(const c of f.c){P.push(q.x+c[0],q.y+c[1],q.z+c[2]);U.push((tx+0.002+c[3]*0.996)/AC,1-(ty+1)/AR+(0.002+c[4]*0.996)/AR);C.push(s,s,s);}
      I.push(n,n+1,n+2,n+2,n+1,n+3);
    }
    if(ex)surface.push(q);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);
  // (a toppling piece looks just like the world's own blocks; one sinking into the ground needs a clipping plane of its own)
  const mesh=new THREE.Mesh(g,plane?clipMat(plane):matOpaque);
  mesh.userData.surface=surface;mesh.userData.set=set;return mesh;
}
function makeBody(blocks,big){
  let minY=1e9,maxY=-1e9,sx=0,sz=0;const cols=new Map(),layers=new Map();
  for(const q of blocks){
    minY=Math.min(minY,q.y);maxY=Math.max(maxY,q.y);sx+=q.x;sz+=q.z;
    const k=colKey(q.x,q.z);let c=cols.get(k);if(!c){c={x:q.x,z:q.z,minY:q.y,maxY:q.y,n:0,logs:0,lv:0};cols.set(k,c);}if(q.b===LOG)c.logs++;else if(q.b===LEAVES)c.lv++;
    c.minY=Math.min(c.minY,q.y);c.maxY=Math.max(c.maxY,q.y);c.n++;
    let l=layers.get(q.y);if(!l){l=[];layers.set(q.y,l);}l.push(q);
  }
  // it comes to rest on whatever most of its footprint is over (a lamp post under one corner doesn't hold up a building)
  const sup=[];for(const c of cols.values())sup.push(colSupport(c.x,c.z,c.minY));sup.sort((a,b)=>a-b);
  const clipY=sup[Math.floor(sup.length/2)]||0;
  const plane=new THREE.Plane(new V3(0,1,0),-clipY);
  const mesh=buildBodyMesh(blocks,plane);scene.add(mesh);
  bodies.push({mesh,cols,layers,minY,maxY,clipY,off:0,v:0,vmax:big?9:22,mass:blocks.length,layersDone:0,hit:new Set(),big,cx:sx/blocks.length+.5,cz:sz/blocks.length+.5,pumps:blocks.filter(q=>q.b===PUMP)});
  if(!big){noise(0.2,0.2,900,'bandpass');}
}
function bodyColAt(B,x,z){return B.cols.get(colKey(Math.floor(x),Math.floor(z)));}
function updateBodies(dt){
  for(let i=bodies.length-1;i>=0;i--){
    const B=bodies[i];
    B.v=Math.min(B.vmax,B.v+18*dt);B.off-=B.v*dt;
    B.mesh.position.y=B.off;
    // falling blocks crush goblins and cars (never the hippos)
    for(const g of goblins){
      if(g.state!=='chase'||B.hit.has(g))continue;
      const c=bodyColAt(B,g.pos.x,g.pos.z);if(!c)continue;
      const bot=c.minY+B.off,top=c.maxY+1+B.off;
      if(bot<g.pos.y+1.4&&top>g.pos.y){B.hit.add(g);damageGoblin(g,B.mass>3?99:3,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3((Math.random()-.5),-1,(Math.random()-.5)),'Crushed by falling debris');if(g.state==='dead')flashLabel('Crushed  +100',(nearestPlayer(g.pos.x,g.pos.z)||{}).p);}
    }
    for(const car of cars){
      if(!car.alive||B.hit.has(car))continue;
      const s=Math.sin(car.heading),k=Math.cos(car.heading);
      for(const [a,b2] of car.pts){
        const c=bodyColAt(B,car.pos.x+a*k+b2*s,car.pos.z-a*s+b2*k);if(!c)continue;
        const bot=c.minY+B.off,top=c.maxY+1+B.off;
        if(bot<car.pos.y+1.7&&top>car.pos.y){B.hit.add(car);damageCar(car,B.mass>=25?999:Math.min(80,4+B.mass*0.8));clang();thud(0.6);break;}
      }
    }
    // whatever sinks below the support line is ground into rubble
    const passed=Math.floor(B.clipY-(B.minY+B.off));
    while(B.layersDone<passed&&B.minY+B.layersDone<=B.maxY){
      const y=B.minY+B.layersDone,l=B.layers.get(y);
      if(l&&l.length){
        const pick=[];for(let j=0;j<Math.min(B.big?7:3,l.length);j++)pick.push(l[Math.floor(Math.random()*l.length)]);
        destroyFX(pick.map(q=>({x:q.x,y:B.clipY,z:q.z,b:q.b})),{force:B.big?1:0.7,dx:0,dz:0,up:1.1},B.layersDone%4!==0);
        if(B.big){puff(B.cx,B.clipY,B.cz,4,0x8c8a84,2.2);addShake(0.22,B.cx,B.cz,55);}
      }
      B.layersDone++;
    }
    // a falling gas pump goes up as it hits the ground
    if(B.pumps.length&&!B.boomed&&B.minY+B.off<=B.clipY+0.05){B.boomed=true;pumpsFell(B.pumps.map(q=>({x:q.x,y:B.clipY,z:q.z})));}
    if(B.maxY+1+B.off<=B.clipY){
      if(B.mass>=6)placePile(B);
      scene.remove(B.mesh);B.mesh.geometry.dispose();B.mesh.material.dispose();
      bodies.splice(i,1);
    }
  }
}
function placePile(B){
  const ch=new Set(),pileBase=[];
  for(const c of B.cols.values()){
    if(players.some(p=>p.active&&Math.abs(p.pos.x-(c.x+.5))<2.2&&Math.abs(p.pos.z-(c.z+.5))<2.2))continue;
    // trees leave a fallen trunk and leaf litter; buildings leave a rubble heap
    const tree=(c.logs+c.lv)>=c.n*0.6;if(!tree&&B.mass<25)continue;
    const mat=tree?(c.logs?LOG:LEAVES):COBBLE,h=tree?(c.logs?1:(c.lv>=6?2:1)):Math.min(7,1+Math.round(c.n*0.1)),base=colSupport(c.x,c.z,B.clipY);
    for(let y=base;y<base+h&&y<H;y++)if(get(c.x,y,c.z)===AIR){setRaw(c.x,y,c.z,mat);addEdit(c.x,y,c.z,mat);if(y===base)pileBase.push([c.x,y,c.z]);}
    ch.add(ckey(Math.floor(c.x/CS),Math.floor(c.z/CS)));for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]])ch.add(ckey(Math.floor((c.x+ox)/CS),Math.floor((c.z+oz)/CS)));
  }
  rebuildSet(ch);save();dropFloating(pileBase);   // (a heap that landed on something already cut loose comes down too)
  pumpsUnder(B.cols.values());
  ruinFires([...B.cols.values()],B.mass);
  if(B.big){smoke(B.cx,B.clipY+1,B.cz,12,0x77756e);thud(1);}
}
function clearBodies(){for(const B of bodies){scene.remove(B.mesh);B.mesh.geometry.dispose();B.mesh.material.dispose();}bodies.length=0;for(const T of topples){scene.remove(T.grp);T.mesh.geometry.dispose();}topples.length=0;}

