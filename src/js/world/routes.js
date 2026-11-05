// ======== THE LAY OF THE LAND: the highways between the places, and the rivers ========
// Each place has a main street along x and one along z through its centre (block row T.cz, column T.cx). Every ninth
// row of places is linked along x by a raised motorway, every ninth column along z; the rest by country highways.
// Through a place a highway runs dead straight: a country highway is its main street, a motorway is up on its deck 3
// blocks off the main street (so its crossings miss the town square). Out on the plains, though, they go their own way:
// from the edge of town each heads off square, then takes a leg or two at an angle, the corners rounded off, to the
// next place. Now and then two places are also linked on the diagonal by a country highway.
const AX_KIND=(T,ax)=>mod(ax==='x'?T.rz:T.rx,9)===0?'moto':'country';
// the block row (x axis) / column (z axis) a place's highway runs along
const lineOf=(T,ax)=>(ax==='x'?T.cz:T.cx)+(AX_KIND(T,ax)==='moto'?3:0);
const placeAt=(rx,rz)=>settlementLat(rx,rz);
// is there a link from place (rx,rz) to the place (dx,dz) away? (dx,dz): (1,0) east, (0,1) south, (1,1)/(1,-1) diagonal
function diagExit(A,B){
  // a diagonal link leaves each end square along whichever axis faces the other end best -- as long as that's a country
  // highway there (motorways only go along their own rows and columns)
  const dx=B.cx-A.cx,dz=B.cz-A.cz,prefX=Math.abs(dx)>=Math.abs(dz);
  for(const ax of prefX?['x','z']:['z','x']){
    if(AX_KIND(A,ax)!=='country'||AX_KIND(B,ax)!=='country')continue;
    const sA=ax==='x'?Math.sign(dx):Math.sign(dz);if(!sA)continue;
    return{ax,sA,sB:-sA};}
  return null;
}
const edgeC=new Map();
function edgeOn(rx,rz,dx,dz){
  const key=rx+','+rz+','+dx+','+dz;let v=edgeC.get(key);if(v!==undefined)return v;
  const A=placeAt(rx,rz),B=placeAt(rx+dx,rz+dz),h=hash2(rx*31+dx*7+100,rz*17+dz*13+200);
  // (no highway across the sea)
  {let wet=false;for(let t=0;t<=1&&!wet;t+=0.04){const fx=A.cx+(B.cx-A.cx)*t+0.5,fz=A.cz+(B.cz-A.cz)*t+0.5;if(seaV(fx,fz)>SEA_T-0.06)wet=true;}if(wet){edgeC.set(key,false);return false;}}
  if(dx&&dz)v=h<0.18&&!!diagExit(A,B);
  else v=AX_KIND(A,dx?'x':'z')==='moto'||h>=0.12;
  // the highway's actual line (laid exactly as it will be built) mustn't wander into the sea either -- otherwise it
  // isn't built, and the places' highways (and motorway decks) would run to the edge of town and just stop
  if(v){edgeC.set(key,false);   // (while it's worked out)
    const E=dx&&dz?diagExit(A,B):null,ax=E?E.ax:dx?'x':'z',sA=E?E.sA:1,sB=E?E.sB:-1;
    const ep=(T,sg)=>{const c=lineOf(T,ax)*CELL+4,a=sg>0?(spanEnd(T,ax,1)+1)*CELL:spanEnd(T,ax,-1)*CELL;return ax==='x'?[a,c]:[c,a];};
    const pts=routeLine(ep(A,sA),ep(B,sB),rx*1000+rz*7+dx*3+dz*5+11,ax==='x'?[sA,0]:[0,sA],ax==='x'?[sB,0]:[0,sB],[A,B]);
    if(routeWet(pts))v=false;}
  edgeC.set(key,v);return v;
}
// does place T have a highway leaving it on side (ax, s)?
function sideUsed(T,ax,s){
  const {rx,rz}=T;
  if(ax==='x'?edgeOn(s>0?rx:rx-1,rz,1,0):edgeOn(rx,s>0?rz:rz-1,0,1))return true;
  for(const [ox,oz,dx,dz] of [[0,0,1,1],[0,0,1,-1],[-1,-1,1,1],[-1,1,1,-1]]){
    const ax0=rx+ox,az0=rz+oz;if(!edgeOn(ax0,az0,dx,dz))continue;
    const E=diagExit(placeAt(ax0,az0),placeAt(ax0+dx,az0+dz));const mine=ox===0&&oz===0;
    if(E&&E.ax===ax&&(mine?E.sA:E.sB)===s)return true;}
  return false;
}
// how far along its highway line a place reaches on one side: the last of its blocks before two in a row that aren't
const spanC=new Map();
function spanEnd(T,ax,s){
  const key=T.rx+','+T.rz+ax+s;let v=spanC.get(key);if(v!==undefined)return v;
  const k=lineOf(T,ax),at=m=>ax==='x'?settlementAt(m,k)===T:settlementAt(k,m)===T;
  let m=ax==='x'?T.cx:T.cz;
  for(let i=0;i<80;i++){if(!at(m+s)&&!at(m+2*s))break;m+=s;}
  spanC.set(key,m);return m;
}
// the stretch of a place's highway line that runs through it: {kind,k,m0,m1} (plots m0..m1 along the line), or null
const axC=new Map();
function axisSpan(T,ax){
  const key=T.rx+','+T.rz+ax;let v=axC.get(key);if(v!==undefined)return v;
  const lo=sideUsed(T,ax,-1),hi=sideUsed(T,ax,1),c=ax==='x'?T.cx:T.cz;
  v=lo||hi?{kind:AX_KIND(T,ax),k:lineOf(T,ax),m0:lo?spanEnd(T,ax,-1):c,m1:hi?spanEnd(T,ax,1):c}:null;
  // a motorway that leaves only one way ramps down onto the street at its other end: make sure there's a street there
  // to come down onto (a stretch of street along the line, with town both sides of it), pulling the end in
  // a block or two if the line runs along the very edge of town
  // a motorway that only skirts a place (no stretch of its line with town both sides) stays on the ground right
  // through, instead of humping up over a block or two of fields and straight back down
  if(v&&v.kind==='moto'&&lo&&hi){const k=v.k;let any=false;for(let m=v.m0;m<=v.m1&&!any;m++)any=ax==='x'?!!settlementAt(m,k-1)&&!!settlementAt(m,k):!!settlementAt(k-1,m)&&!!settlementAt(k,m);
    if(!any){v.kind='country';v.flat=true;}}
  // (a motorway stopping just short of the place's other motorway, within sight of it, looks like a mistake and joins
  // nothing: it carries on over the crossing, so the two get a proper interchange, and only then comes down to the street)
  if(v&&v.kind==='moto'&&lo!==hi){const o=ax==='x'?'z':'x';
    if(AX_KIND(T,o)==='moto'&&(sideUsed(T,o,1)||sideUsed(T,o,-1))){const j=lineOf(T,o),far=spanEnd(T,ax,hi?-1:1);
      if(!hi&&j+2>v.m1&&j+4<=far)v.m1=j+2;else if(!lo&&j-3<v.m0&&j-5>=far)v.m0=j-3;}}
  if(v&&v.kind==='moto'&&lo!==hi){const k=v.k,town=(m)=>ax==='x'?!!settlementAt(m,k-1)&&!!settlementAt(m,k):!!settlementAt(k-1,m)&&!!settlementAt(k,m);
    if(!hi){for(let n=0;n<3&&v.m1-1>=v.m0&&!town(v.m1+1);n++)v.m1--;}
    else{for(let n=0;n<3&&v.m0+1<=v.m1&&!town(v.m0-1);n++)v.m0++;}
    // (a line that only skirts a hamlet, with no street of its own to come down on: the motorway comes in on the
    // ground instead, and ends right there at the edge -- no stretch of it of the place's own, going nowhere)
    // (it runs on to the place's own column or row and stops there, where setConns joins it up to the streets: not left
    // ending in the grass at the edge)
    if(!town(hi?v.m0-1:v.m1+1)){v.kind='country';v.flat=true;if(hi)v.m0=Math.min(c,v.m1);else v.m1=Math.max(c,v.m0);}}
  axC.set(key,v);return v;
}
// is block m on line k (a row for 'x', a column for 'z') part of a place's highway, and of what kind?
const hwLineC=new Map();
function hwLine(ax,k,m){
  const key=ax+k+','+m;let v=hwLineC.get(key);if(v!==undefined)return v;v=null;
  const r0=Math.round((ax==='x'?m:k)/SET_SP),q0=Math.round((ax==='x'?k:m)/SET_SP);
  for(let rx=r0-1;rx<=r0+1&&!v;rx++)for(let rz=q0-1;rz<=q0+1&&!v;rz++){
    const T=placeAt(rx,rz);if(lineOf(T,ax)!==k)continue;const S=axisSpan(T,ax);if(S&&m>=S.m0&&m<=S.m1)v=S.kind;}
  hwLineC.set(key,v);return v;
}
// the old whole-line tests, now asked about one block along the line: a raised motorway / a country highway there?
const hwRow=(k,m)=>hwLine('x',k,m)==='moto',hwCol=(k,m)=>hwLine('z',k,m)==='moto';
const ghwRow=(k,m)=>hwLine('x',k,m)==='country',ghwCol=(k,m)=>hwLine('z',k,m)==='country';
// ---- the routes out across the plains: polylines in block coordinates, from one place's exit to the next ----
const RT_B=64,rtIdx=new Map(),rvIdx=new Map(),rtDone=new Set(),ROUTES=[];
// where a place's highway leaves it on side s: the edge of its last block, on the line's centre
function exitPt(T,ax,s){
  const S=axisSpan(T,ax),c=S.k*CELL+4,a=s>0?(S.m1+1)*CELL:S.m0*CELL;
  return ax==='x'?[a,c]:[c,a];
}
function fillet(p,R){const out=[p[0]];
  for(let i=1;i<p.length-1;i++){const A=p[i-1],B=p[i],C=p[i+1];const l1=Math.hypot(B[0]-A[0],B[1]-A[1]),l2=Math.hypot(C[0]-B[0],C[1]-B[1]);
    if(l1<1e-6||l2<1e-6)continue;
    const r=Math.min(R,l1*0.45,l2*0.45),p1=[B[0]+(A[0]-B[0])/l1*r,B[1]+(A[1]-B[1])/l1*r],p2=[B[0]+(C[0]-B[0])/l2*r,B[1]+(C[1]-B[1])/l2*r];
    const n=Math.max(2,Math.ceil(r/3));for(let k=0;k<=n;k++){const t=k/n,u=1-t;out.push([u*u*p1[0]+2*u*t*B[0]+t*t*p2[0],u*u*p1[1]+2*u*t*B[1]+t*t*p2[1]]);}}
  out.push(p[p.length-1]);return out;}
// a way across open country from a to b, leaving a along dirA and arriving at b along -dirB: one or two angled legs
// in the middle, never doubling back, steering clear of other places
function routeLine(a,b,seed,dirA,dirB,avoid){
  const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,st=Math.min(200,L*0.16);
  const A1=[a[0]+dirA[0]*st,a[1]+dirA[1]*st],B1=[b[0]+dirB[0]*st,b[1]+dirB[1]*st];
  const mono=pts=>{let last=-1e9;for(const q of pts){const t=(q[0]-a[0])*ux+(q[1]-a[1])*uz;if(t<last-1)return false;last=t;}return true;};
  let best=null;
  for(let tries=0;tries<10;tries++){
    const n=tries>=8?0:1+Math.floor(hash2(seed,tries)*2),pts=[a,A1];
    const L2=Math.hypot(B1[0]-A1[0],B1[1]-A1[1])||1,vx=(B1[0]-A1[0])/L2,vz=(B1[1]-A1[1])/L2;
    for(let i=1;i<=n;i++){const t=0.3+0.4*(n===1?0.5:(i-1))+(hash2(seed+i,tries+7)-0.5)*0.2,off=(hash2(seed+i*3,tries+11)-0.5)*L2*0.26;
      pts.push([A1[0]+vx*L2*t-vz*off,A1[1]+vz*L2*t+vx*off]);}
    pts.push(B1,b);
    if(!mono(pts))continue;
    const sm=fillet(pts,300);
    let bad=0;for(let i=0;i<sm.length;i++){const q=sm[i],S=settlementAt(Math.floor(q[0]/CELL),Math.floor(q[1]/CELL));if(S&&!avoid.includes(S))bad++;}
    if(!bad)return sm;if(!best||bad<best.bad)best={sm,bad};
  }
  return best?best.sm:fillet([a,A1,B1,b],300);
}
// resample a polyline evenly (about every 4 blocks) and add up its length
function mkRoute(pts,o){
  const P=[pts[0]];for(let i=1;i<pts.length;i++){const A=pts[i-1],B=pts[i],l=Math.hypot(B[0]-A[0],B[1]-A[1]),n=Math.max(1,Math.ceil(l/4));for(let k=1;k<=n;k++)P.push([A[0]+(B[0]-A[0])*k/n,A[1]+(B[1]-A[1])*k/n]);}
  const cum=[0];for(let i=1;i<P.length;i++)cum.push(cum[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  return Object.assign({pts:P,cum,L:cum[cum.length-1],id:ROUTES.length},o);
}
// file each little piece of a line under the 64-block squares it passes through
function indexLine(idx,R){
  const P=R.pts;
  for(let i=0;i<P.length-1;i++){const [x0,z0]=P[i],[x1,z1]=P[i+1],pad=24;
    for(let bx=Math.floor((Math.min(x0,x1)-pad)/RT_B);bx<=Math.floor((Math.max(x0,x1)+pad)/RT_B);bx++)
      for(let bz=Math.floor((Math.min(z0,z1)-pad)/RT_B);bz<=Math.floor((Math.max(z0,z1)+pad)/RT_B);bz++){const k=bx*100003+bz;let l=idx.get(k);if(!l){l=[];idx.set(k,l);}l.push(R,i);}}
}
// build the routes leaving place (rx,rz) east, south and on the diagonals (each built once, by its western end)
const routeWet=pts=>{for(let i=0;i<pts.length;i++){const [x,z]=pts[i];if(seaBlk(x,z)>SEA_T-0.04)return true;if(i<pts.length-1){const [x2,z2]=pts[i+1];if(seaBlk((x+x2)/2,(z+z2)/2)>SEA_T-0.04)return true;}}return false;};
function buildRoutesFrom(rx,rz){
  const key=rx+','+rz;if(rtDone.has(key))return;rtDone.add(key);
  const A=placeAt(rx,rz);
  for(const [dx,dz] of [[1,0],[0,1],[1,1],[1,-1]]){
    if(!edgeOn(rx,rz,dx,dz))continue;const B=placeAt(rx+dx,rz+dz);
    let ax,sA,sB;if(dx&&dz){const E=diagExit(A,B);ax=E.ax;sA=E.sA;sB=E.sB;}else{ax=dx?'x':'z';sA=1;sB=-1;}
    const a=exitPt(A,ax,sA),b=exitPt(B,ax,sB),dA=ax==='x'?[sA,0]:[0,sA],dB=ax==='x'?[sB,0]:[0,sB];
    const kind=dx&&dz?'country':AX_KIND(A,ax);
    const pts=routeLine(a,b,rx*1000+rz*7+dx*3+dz*5+11,dA,dB,[A,B]);
    const R=mkRoute(pts,{kind,ax,HY:kind==='moto'?(ax==='x'?HY_X:HY_Z):G,A:{T:A,ax,s:sA},B:{T:B,ax,s:sB}});
    if(routeWet(pts))continue;   // (one that would wander into the sea isn't built -- edgeOn has already said so)
    ROUTES.push(R);indexLine(rtIdx,R);
  }
}
const rtReady=new Set();
function ensureRoutes(x,z){
  const bk=Math.floor(x/512)*100003+Math.floor(z/512);if(rtReady.has(bk))return;rtReady.add(bk);
  const rx0=Math.round(x/CELL/SET_SP),rz0=Math.round(z/CELL/SET_SP);
  for(let rx=rx0-2;rx<=rx0+2;rx++)for(let rz=rz0-2;rz<=rz0+2;rz++)buildRoutesFrom(rx,rz);
}
// ---- rivers: each runs along a row (or a column) of a coarse grid about 1600 blocks across, but which rows and
// columns have one is down to chance, so they're spaced unevenly. Its line wanders between jittered waypoints, with
// two kinds of bend on top: long sweeps, and meanders whose spacing and size keep changing along it (tight wiggly
// stretches, lazy loops, the odd near-straight reach). Where it meets a place it straightens out onto a row (or column)
// of blocks and runs dead straight through, easing back into its bends either side. ----
const RIV_SP=1600,RIV_W=9;
const rivOn=(ax,j)=>ax==='x'?hash2(j*733+1,4099)<0.45:hash2(j*577+9,4111)<0.4;
// along-axis coordinate a -> cross-axis position of river j's guide line (smooth through jittered waypoints)
function rivGuide(ax,j,a){
  const n=c=>j*RIV_SP+(hash2(c*37+j*11+(ax==='x'?0:5),j*53+3)-0.5)*RIV_SP*0.8;
  const i=Math.floor(a/RIV_SP),t=a/RIV_SP-i,p0=n(i-1),p1=n(i),p2=n(i+1),p3=n(i+2);
  return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
}
function rivOff(ax,j,a){
  const h=k=>hash2(j*91+k,(ax==='x'?17:29)+k*7)*6.283;
  const ph=a/95+2.2*Math.sin(a/700+h(1))+1.3*Math.sin(a/310+h(2));
  const fr=Math.abs(1/95+2.2/700*Math.cos(a/700+h(1))+1.3/310*Math.cos(a/310+h(2)));
  const amp=Math.min(70*(0.3+0.7*(0.5+0.5*Math.sin(a/900+h(3)))),0.8/Math.max(fr,1e-3));
  return amp*Math.sin(ph)+330*Math.sin(a/1500+h(4))+120*Math.sin(a/610+h(5));
}
// one tile (RIV_SP long) of river j: its centre line, and the places it straightens through {T,r,m0,m1}
const rivTileC=new Map();
function rivTile(ax,j,i){
  const key=ax+j+','+i;let v=rivTileC.get(key);if(v)return v;
  const a0=i*RIV_SP-500,a1=(i+1)*RIV_SP+500,N=Math.round((a1-a0)/4),A=[],C=[];
  for(let n=0;n<=N;n++){const a=a0+n*4;A.push(a);C.push(rivGuide(ax,j,a)+rivOff(ax,j,a));}
  const P=(a,c)=>ax==='x'?[Math.floor(a/CELL),Math.floor(c/CELL)]:[Math.floor(c/CELL),Math.floor(a/CELL)];
  // the places it runs into
  const towns=new Map();for(let n=0;n<=N;n+=4){const [px,pz]=P(A[n],C[n]),S=settlementRaw(px,pz);if(S&&!towns.has(S))towns.set(S,n);}
  const secs=[];
  for(const [T,n0] of towns){
    // where along it, and a row (column) of blocks through the place that keeps clear of its highway line
    // (worked out from the place's centre, so every tile of the river that meets this place agrees on it)
    const mAl=ax==='x'?T.cx:T.cz,aC=mAl*CELL+16,cC=rivGuide(ax,j,aC)+rivOff(ax,j,aC);
    const kl=lineOf(T,ax),okRow=r=>Math.abs(r-kl)>1&&(ax==='x'?settlementRaw(mAl,r):settlementRaw(r,mAl))===T;
    let r0=Math.round((cC-20)/CELL),r=null;for(let d=0;d<=8&&r===null;d++)for(const e of d?[d,-d]:[0])if(okRow(r0+e)){r=r0+e;break;}
    if(r===null)continue;
    const at=m=>(ax==='x'?settlementRaw(m,r):settlementRaw(r,m))===T;
    let m0=mAl,m1=mAl;for(let q=0;q<80;q++){if(!at(m0-1)&&!at(m0-2))break;m0--;}for(let q=0;q<80;q++){if(!at(m1+1)&&!at(m1+2))break;m1++;}
    secs.push({T,r,m0,m1,c:r*CELL+20,lo:m0*CELL,hi:(m1+1)*CELL});
  }
  // pull the line straight through each, easing in and out over 220 blocks either side
  for(let n=0;n<=N;n++){const a=A[n];
    for(const S of secs){const d=a<S.lo?S.lo-a:a>S.hi?a-S.hi:0;if(d>=220)continue;const u=1-d/220,w=u*u*(3-2*u);C[n]+=(S.c-C[n])*w;}}
  // keep just the tile's own stretch (plus a little overlap)
  const pts=[];for(let n=0;n<=N;n++){if(A[n]<i*RIV_SP-8||A[n]>(i+1)*RIV_SP+8)continue;pts.push(ax==='x'?[A[n],C[n]]:[C[n],A[n]]);}
  v={pts,secs,ax,j};rivTileC.set(key,v);
  const R=mkRoute(pts,{kind:'river',ax});v.R=R;indexLine(rvIdx,R);
  return v;
}
const rvReady=new Set();
function ensureRivers(x,z){
  const bk=Math.floor(x/512)*100003+Math.floor(z/512);if(rvReady.has(bk))return;rvReady.add(bk);
  for(const ax of ['x','z']){const a=ax==='x'?x:z,c=ax==='x'?z:x,i=Math.floor(a/RIV_SP),j0=Math.round(c/RIV_SP);
    for(let j=j0-1;j<=j0+1;j++){if(!rivOn(ax,j))continue;for(let ii=i-1;ii<=i+1;ii++)rivTile(ax,j,ii);}}
}
// the river (if any) whose straightened stretch block (px,pz) of a place is on: 'x' (it runs along x) or 'z'
const rivPlotC=new Map();
function riverDir(px,pz){
  const key=px*100003+pz;let v=rivPlotC.get(key);if(v!==undefined)return v;v=null;
  if(settlementRaw(px,pz)){
    for(const ax of ['x','z']){const a=(ax==='x'?px:pz)*CELL,c=(ax==='x'?pz:px)*CELL,i=Math.floor(a/RIV_SP),j0=Math.round(c/RIV_SP);
      for(let j=j0-1;j<=j0+1&&!v;j++){if(!rivOn(ax,j))continue;
        for(let ii=i-1;ii<=i+1&&!v;ii++)for(const S of rivTile(ax,j,ii).secs)if(S.r===(ax==='x'?pz:px)&&(ax==='x'?px:pz)>=S.m0&&(ax==='x'?px:pz)<=S.m1&&settlementRaw(px,pz)===S.T){v=ax;break;}}
      if(v)break;}}
  rivPlotC.set(key,v);return v;
}
const isRiver=(px,pz)=>riverDir(px,pz)!==null;
// ---- distances to the nearest route / river line from a point ----
// gather the pieces near a box (for a whole chunk at once), then measure each column against just those
function linesNear(idx,x0,z0,x1,z1){
  const out=[],seen=new Set();
  for(let bx=Math.floor(x0/RT_B);bx<=Math.floor(x1/RT_B);bx++)for(let bz=Math.floor(z0/RT_B);bz<=Math.floor(z1/RT_B);bz++){
    const l=idx.get(bx*100003+bz);if(!l)continue;for(let q=0;q<l.length;q+=2){const R=l[q],i=l[q+1],k=R.id*100000+i+(idx===rvIdx?5e9:0);if(seen.has(k))continue;seen.add(k);out.push(R,i);}}
  return out;
}
// nearest point on a set of pieces: {R,d (unsigned),sd (signed: + to the right of the way the line runs),s (distance
// along it),tx,tz (its direction there)} or null if none within lim
function nearestOn(list,x,z,lim){
  let best=null,bd=lim*lim;
  for(let q=0;q<list.length;q+=2){const R=list[q],i=list[q+1],P=R.pts,[ax,az]=P[i],[bx,bz]=P[i+1],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-9;
    let t=((x-ax)*dx+(z-az)*dz)/l2;t=t<0?0:t>1?1:t;const cx=ax+dx*t,cz=az+dz*t,d2=(x-cx)*(x-cx)+(z-cz)*(z-cz);
    if(d2<bd){bd=d2;const l=Math.sqrt(l2),tx=dx/l,tz=dz/l;best={R,i,t,tx,tz,d:Math.sqrt(d2),sd:(x-cx)*(-tz)+(z-cz)*tx,s:R.cum[i]+t*l,cx,cz};}}
  return best;
}
const routesNearBox=(x0,z0,x1,z1)=>{for(let x=x0;x<=x1+511;x+=512)for(let z=z0;z<=z1+511;z+=512)ensureRoutes(Math.min(x,x1),Math.min(z,z1));return linesNear(rtIdx,x0-16,z0-16,x1+16,z1+16);};
const riversNearBox=(x0,z0,x1,z1)=>{for(let x=x0;x<=x1+511;x+=512)for(let z=z0;z<=z1+511;z+=512)ensureRivers(Math.min(x,x1),Math.min(z,z1));return linesNear(rvIdx,x0-16,z0-16,x1+16,z1+16);};
// single-point versions (cached by 16-block square)
const nearRtC=new Map(),nearRvC=new Map();
function rtList(x,z){const k=Math.floor(x/16)*100003+Math.floor(z/16);let l=nearRtC.get(k);if(!l){if(nearRtC.size>6000)nearRtC.clear();const X=Math.floor(x/16)*16,Z=Math.floor(z/16)*16;l=routesNearBox(X,Z,X+15,Z+15);nearRtC.set(k,l);}return l;}
function rvList(x,z){const k=Math.floor(x/16)*100003+Math.floor(z/16);let l=nearRvC.get(k);if(!l){if(nearRvC.size>6000)nearRvC.clear();const X=Math.floor(x/16)*16,Z=Math.floor(z/16)*16;l=riversNearBox(X,Z,X+15,Z+15);nearRvC.set(k,l);}return l;}
const routeAt=(x,z,lim=12)=>nearestOn(rtList(x,z),x,z,lim);
const riverAt=(x,z,lim=16)=>nearestOn(rvList(x,z),x,z,lim);
// is anything of a route or river within the plot (plus a margin)? (for keeping farms and the like clear)
// ---- truck stops: big gas stations out on long country highways. Partway along a long enough route, on a straight
// stretch with open land to one side, a wide apron opens off the road: a long canopy over rows of pumps, room for the
// lorries to pull in behind, and the store (a building, staffed round the clock) at the back. ----
const tsIdx=new Map();
// the truck stops along a route: a long country highway is split into stretches about 900 blocks long, and most
// stretches get one, on a fairly straight bit with open land to one side (never close to a town)
function truckStopOf(R){
  if(R.ts!==undefined)return R.ts;R.ts=[];if(TEST_OFF.has('truckstop'))return R.ts;
  if(R.kind!=='country'||R.L<650)return R.ts;
  const tan=s=>{const P=rtPointL(R,s);return Math.atan2(P.tx,P.tz);},seed=Math.round(R.pts[0][0])*7+Math.round(R.pts[0][1]);
  const n=Math.max(1,Math.floor((R.L-300)/900)),span=(R.L-300)/n;
  for(let j=0;j<n;j++){
    if(hash2(seed+j*13,j*7+77)>0.85)continue;
    let got=null;
    for(let k=0;k<10&&!got;k++){
      const s0=150+span*(j+0.2+0.6*hash2(seed+k*31+j*5,k*7+5));
      let a=tan(s0-45)-tan(s0+45);a=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));if(a>0.12)continue;
      const P=rtPointL(R,s0);
      for(const side of hash2(k+j*3,Math.round(s0))<0.5?[1,-1]:[-1,1]){
        const nx=-P.tz*side,nz=P.tx*side;let ok=true;
        for(let u=-48;u<=48&&ok;u+=8)for(let v=0;v<=62&&ok;v+=8){const x=P.x+P.tx*u+nx*v,z=P.z+P.tz*u+nz*v,px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
          if(settlementAt(px,pz)||seaPlot(px,pz)||railNear(x,z)<8)ok=false;else{const q=nearestOn(rtList(x,z),x,z,16);if(q&&q.R!==R)ok=false;else{const w=riverAt(x,z,RIV_W+8);if(w)ok=false;}}}
        if(ok){got={R,s0,cx:P.x,cz:P.z,tx:P.tx,tz:P.tz,nx,nz,side};break;}
      }
    }
    if(got)R.ts.push(got);
  }
  return R.ts;
}
// (a point along a route, without needing the traffic code)
function rtPointL(R,s){s=Math.max(0,Math.min(R.L,s));let lo=0,hi=R.cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(R.cum[m]<=s)lo=m;else hi=m;}
  const [ax,az]=R.pts[lo],[bx,bz]=R.pts[Math.min(lo+1,R.pts.length-1)],l=Math.max(1e-6,R.cum[Math.min(lo+1,R.cum.length-1)]-R.cum[lo]),t=Math.min(1,(s-R.cum[lo])/l),L2=Math.hypot(bx-ax,bz-az)||1;
  return{x:ax+(bx-ax)*t,z:az+(bz-az)*t,tx:(bx-ax)/L2,tz:(bz-az)/L2};}
// the truck stops whose grounds might reach (x,z), and where (x,z) is in each one's frame: u along the road, v out from it
function tsNear(x,z){
  const out=[];
  for(let q=0,L=rtList(x,z);q<L.length;q+=2){const R=L[q];if(R.kind!=='country')continue;for(const T of truckStopOf(R)){if(out.some(o=>o.T===T))continue;
    const dx=x-T.cx,dz=z-T.cz;if(dx*dx+dz*dz>90*90)continue;out.push({T,u:dx*T.tx+dz*T.tz,v:dx*T.nx+dz*T.nz});}}
  // (a route list only covers the routes passing close by: the grounds stretch 55 blocks off the road, so look along it too)
  return out;
}
const tsC=new Map();
// the truck stop whose grounds cover column (x,z): {T,u,v} or null
function tsAt(x,z){
  const k=Math.floor(x/16)*100003+Math.floor(z/16);let L=tsC.get(k);
  if(!L){if(tsC.size>6000)tsC.clear();L=[];const X=Math.floor(x/16)*16+8,Z=Math.floor(z/16)*16+8;
    for(let q=0,RL=routesNearBox(X-70,Z-70,X+70,Z+70);q<RL.length;q+=2){const R=RL[q];if(R.kind!=='country')continue;for(const T of truckStopOf(R))if(!L.includes(T)&&Math.hypot(X-T.cx,Z-T.cz)<100)L.push(T);}
    tsC.set(k,L);}
  for(const T of L){const dx=x+0.5-T.cx,dz=z+0.5-T.cz,u=dx*T.tx+dz*T.tz,v=dx*T.nx+dz*T.nz;if(Math.abs(u)<=46&&v>=6.5&&v<=60)return{T,u,v};}
  return null;
}
// ---- street furniture laid out with the plots: benches and litter bins ----
// Along the pavements of the busier blocks (shops, restaurants, offices, the hospital...), on any side with a street:
// often a bench facing the road with a bin beside it, sometimes just a bin; in a park, benches facing the paths.
const FURN_T=new Set(['courthouse','jail','lab','datacenter','electric','dealer','theater','stocks','armory','farmers','church','library','cinema','bank','news','disco','club','court','shops','bell','tower','mid','large','city','food','fastfood','sitdown','grocery','plaza','police','hospital','build','fire']);
const furnC=new Map();
function streetFurn(px,pz){
  const k=px*100003+pz;let v=furnC.get(k);if(v)return v;v=[];
  if(furnC.size>4000)furnC.clear();
  const t=plotType(px,pz),X0=px*CELL,Z0=pz*CELL,PB=plotBounds(px,pz);
  if(t==='fire')v.push({type:'flag',key:'ff'+px+','+pz,x:X0+PL0+15.5,z:Z0+PL0+2,yaw:0,rad:0.4});
  {const Sx=t==='super'&&superOf(px,pz);if(Sx&&Sx.kind==='school'&&Sx.ax===px&&Sx.az===pz)v.push({type:'flag',key:'fs'+px+','+pz,x:X0+PL0+(Sx.w>=3?35.5:8),z:Z0+PL0+(Sx.w>=3?10:3),yaw:0,rad:0.4});}
  // (props, drawn by refreshProps. Their keys keep the old names, so one knocked over in a saved world stays down)
  const add=(type,lx,lz,yaw,on,tag)=>{const x=X0+lx,z=Z0+lz;if(superPart(x,z)==='in')return;v.push({prop:true,type:type==='bench'?'parkbench':'litterbin',key:type+'@'+Math.round(x*2)+','+Math.round(z*2),x,z,y0:G+1,yaw,on,rad:type==='bench'?0.6:0});};
  if(FURN_T.has(t)&&!superOf(px,pz)){
    // [across-the-pavement position, along, which side's street, yaw facing the road]
    const sides=[[ROADW+1.3,0,()=>segOpen(px,pz,0),-Math.PI/2],[CELL-1.3,0,()=>segOpen(px+1,pz,0),Math.PI/2],[ROADW+1.3,1,()=>segOpen(px,pz,1),Math.PI],[CELL-1.3,1,()=>segOpen(px,pz+1,1),0]];
    sides.forEach(([c,alongX,open,yaw],i)=>{
      if(!open())return;const h=hash2(px*91+i*7+3,pz*57+i*13+1);if(h>0.62)return;
      const inPB=(lx,lz)=>lx>=PB.x0&&lx<PB.x1&&lz>=PB.z0&&lz<PB.z1;
      const P=(a,cc)=>alongX?[a,cc]:[cc,a];   // (alongX: the pavement runs along x)
      const cb=c<CELL/2?c-0.7:c+0.7;   // the bin stands nearer the kerb
      if(h<0.4){const [bx,bz]=P(PC-0.5,c);if(!inPB(Math.floor(bx),Math.floor(bz)))add('bench',bx,bz,yaw,SIDEWALK);}
      const [ix,iz]=P(PC+2.2,cb);if(!inPB(Math.floor(ix),Math.floor(iz)))add('bin',ix,iz,yaw,SIDEWALK);
    });
  }
  if(t==='dealer'){
    // strings of pennants across the lot, and flags on tall poles
    v.push({type:'bunt',key:'bu'+px+','+pz+':0',x:X0+PL0+21,z:Z0+PL0+1,yaw:0,L:14,rad:7});v.push({type:'bunt',key:'bu'+px+','+pz+':1',x:X0+PL1-1,z:Z0+PC,yaw:Math.PI/2,L:16,rad:8});
    for(const [a,b] of [[PL0+14,PL0+1],[PL1-1,PL1-1]])v.push({type:'flag',key:'fl'+px+','+pz+':'+a,x:X0+a,z:Z0+b,yaw:0,on:ASPHALT,rad:0.4});}
  else if(t==='park'){const P=plotInfo(px,pz);if(P.benches){
    // two each side of the cross paths, facing them, with a bin at the end of each pair
    for(const [a,yaw] of [[PC-3+0.5,0],[PC+2+0.5,Math.PI]])for(const b of [PC-5,PC+6]){
      add('bench',b,a,yaw,GRASS);add('bench',a,b,yaw?-Math.PI/2:Math.PI/2,GRASS);}
    for(const [bx,bz] of [[PC-7.5,PC-2.5],[PC+7.5,PC+2.5],[PC+2.5,PC-7.5],[PC-2.5,PC+7.5]])add('bin',bx,bz,0,GRASS);}}
  furnC.set(k,v);return v;
}
// ---- billboards beside the highways out on the plains: now and then one stands back off the road, facing it ----
function boardsOf(R){
  if(R.boards)return R.boards;const out=[];R.boards=out;if(TEST_OFF.has('billboards'))return out;
  if(R.L<320)return out;
  const sx=Math.round(R.pts[0][0]),sz=Math.round(R.pts[0][1]);
  for(let k=0,s0=150;s0<R.L-150;k++,s0+=150){
    const h=hash2(sx*31+k*7+11,sz*17+k*13+5);if(h>0.75)continue;
    const s=s0+(hash2(sx+k*5,sz-k*3)-0.5)*90,e=Math.min(s,R.L-s);if(e<90)continue;
    const P=rtPointL(R,s);let side=hash2(sx*3+k,sz*5+k*11)<0.5?1:-1;{const RL=railOf(R);if(RL&&RL.side===side)side=-side;}const nx=-P.tz*side,nz=P.tx*side,off=18;
    const x=P.x+nx*off,z=P.z+nz*off;
    // standing across the road's line rather than along it, its ad facing the traffic coming one way, toed in a
    // little toward the road
    const fw=hash2(sx*9+k,sz*3+k*7)<0.5?1:-1,fx0=P.tx*fw-nx*0.36,fz0=P.tz*fw-nz*0.36,fl=Math.hypot(fx0,fz0),yaw=Math.atan2(fx0/fl,fz0/fl);
    const ux=Math.cos(yaw),uz=-Math.sin(yaw),wx=Math.sin(yaw),wz=Math.cos(yaw);
    // on dry, level ground (not in a pond, not half up a hillock), clear of everything
    let ok=true,h0=null;for(const a of [-4.5,-2,0,2,4.5])for(const b of [-1.5,1.5]){const qx=x+ux*a+wx*b,qz=z+uz*a+wz*b,px=Math.floor(qx/CELL),pz=Math.floor(qz/CELL);
      if(settlementAt(px,pz)||!PLAINS_OPEN(px,pz)||railNear(qx,qz)<5||roadNear(qx,qz,0)<3||farmLaneCol(Math.floor(qx),Math.floor(qz))){ok=false;break;}
      const h=plainsH(Math.floor(qx),Math.floor(qz));if(h<0||h0!==null&&h!==h0){ok=false;break;}h0=h;}
    if(!ok)continue;
    const n=AD_N,a1=Math.floor(hash2(sx*7+k*3,sz*11+k)*n);let a2=Math.floor(hash2(sx*13+k*5,sz*3+k*7)*n);if(a2===a1)a2=(a2+1)%n;
    out.push({type:'board',key:'bb'+Math.round(x)+','+Math.round(z),x,z,y0:G+1+h0,yaw,ad:a1,ad2:a2,rad:3.6});
  }
  return out;
}
// is there a billboard right here (the plains trees keep off them)?
function boardNear(x,z,r){const L=routesNearBox(x-30,z-30,x+30,z+30);for(let q=0;q<L.length;q+=2)for(const f of boardsOf(L[q]))if(Math.abs(f.x-x)<r&&Math.abs(f.z-z)<r)return true;return false;}
// the way in: an opening in the road's barrier along the front of the grounds
function tsApron(x,z){const t=tsAt(x,z);return!!t&&Math.abs(t.u)<=40;}
// the block the store stands on
const tsPlotC=new Map();
function tsPlot(px,pz){const k=px*100003+pz;let v=tsPlotC.get(k);if(v!==undefined)return v;v=null;
  // (any truck stop near enough whose store lands on this block -- even if the block's middle is off its grounds)
  const X=px*CELL+16,Z=pz*CELL+16;for(let q=0,RL=routesNearBox(X-110,Z-110,X+110,Z+110);q<RL.length&&!v;q+=2){const R=RL[q];if(R.kind!=='country')continue;
    for(const T of truckStopOf(R)){const bx=T.cx+T.nx*47,bz=T.cz+T.nz*47;if(Math.floor(bx/CELL)===px&&Math.floor(bz/CELL)===pz){v=T;break;}}}
  tsPlotC.set(k,v);return v;}
// one column of a truck stop's grounds
function truckStopColumn(a,col,t,px,pz,rx,rz,lx,lz,x,z){
  const {u,v}=t,au=Math.abs(u);
  for(let y=G+1;y<G+10;y++)col(y,AIR);col(G-1,DIRT);
  // the store first: all of it, even the bit that pokes out past the lot's edge
  {const P=plotInfo(px,pz);if(P.type==='truckstop')for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1){col(G,b.floor);buildingColumn(a,lx,lz,rx,rz,b,collapses[px+','+pz+','+bi],px,pz);return;}}}
  // the edge: a kerb of grass all round, with the frontage open to the road
  if(au>44||v>58){col(G,GRASS);return;}
  col(G,ASPHALT);
  // the canopy: a long roof on posts over four rows of pumps
  if(au<=26&&v>=11&&v<=27){col(G+7,(au>25||v<11.8||v>26.2)?NEON_O:METAL);
    if(Math.abs(mod(u+26,13)-0)<0.6&&(Math.abs(v-12)<0.6||Math.abs(v-26)<0.6))for(let y=G+1;y<=G+6;y++)col(y,METAL);
    const isl=[14.5,19,23.5].find(w=>Math.abs(v-w)<0.6);
    if(isl!==undefined&&au<=22){col(G+1,CONCRETE);if(Math.abs(mod(u+22,8)-4)<0.6){col(G+2,PUMP);col(G+3,PUMP);}}
    return;}
}
// does a river out on the plains cross (or come right up to) block (px,pz)?
const rivNearC=new Map();
function rivPlotNear(px,pz){const k=px*100003+pz;let v=rivNearC.get(k);if(v===undefined){const X0=px*CELL,Z0=pz*CELL,b=nearestOn(riversNearBox(X0,Z0,X0+CELL-1,Z0+CELL-1),X0+16,Z0+16,CELL*0.71+RIV_W+4);v=!!b;rivNearC.set(k,v);}return v;}
function clearLayout(){for(const M of [castleC,dumpC,bunkC,bigPC,bigOK,pyIdx,cutC,tsPlotC,setFinC,rivNearC,tsC,fieldC,edgeC,spanC,axC,hwLineC,rtIdx,rvIdx,rivTileC,rivPlotC,nearRtC,nearRvC])M.clear();for(const S of [rtDone,rtReady,rvReady])S.clear();ROUTES.length=0;}
function plotNearLines(px,pz,pad){
  const x0=px*CELL-pad,z0=pz*CELL-pad,x1=(px+1)*CELL+pad,z1=(pz+1)*CELL+pad,cx=(x0+x1)/2,cz=(z0+z1)/2,r=CELL/2*1.42+pad;
  const a=nearestOn(routesNearBox(x0,z0,x1,z1),cx,cz,r+9.6),b=nearestOn(riversNearBox(x0,z0,x1,z1),cx,cz,r+RIV_W);
  return !!(a&&a.d<r+9.6||b&&b.d<r+RIV_W);
}
const rectPlains=(ax,az,w,h)=>{for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(biomeOf(ax+i,az+j)==='plains')return true;return false;};
// plains terrain: gentle rolling hills (0-5 blocks up), flattening out toward any block that isn't open plains (the
// city, a farm, a river); hollows below the line hold ponds (-1)
