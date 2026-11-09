// ---------- Goblin routes ----------
// One map of the way to each hippo, worked out backwards from where it stands and shared by every goblin after it: each
// standing place near it knows the next place along the cheapest way there, and how to get to it (walk, jump, climb). It's
// built a little each frame, and the goblins use the last finished one until the next is ready, so it never holds a frame up.
// (Costs are in tenths of a block's walk. Climbing's dear enough that they take the stairs if there are any.)
const NAV_R=160,NAV_HASH=1<<18,NAV_NODES=60000,NAV_CAP=3000,NAV_WORK=500,NAV_WALK=0,NAV_JUMP=1,NAV_UP=2,NAV_DOWN=3;
const navCols=new Map(),navSolid=new Uint8Array(256);let navWipe=0,navSolidOK=false;
// the places in a column of blocks where a goblin could be: a floor with room to stand on it, or (given as a negative
// number) the top of water too deep to stand in, where it would swim. Not cached if the chunk isn't there yet.
function navCol(x,z){
  const cx=Math.floor(x/CS),cz=Math.floor(z/CS),a=chunks.get(ckey(cx,cz));if(!a)return null;   // (even if it's remembered: looking round it would have the chunk made again)
  const k=x*65536+z;let c=navCols.get(k);if(c)return c;
  if(!navSolidOK){navSolidOK=true;for(let i=1;i<256;i++)navSolid[i]=BLOCK[i]&&BLOCK[i].solid?1:0;}
  c=[];const lx=x-cx*CS,lz=z-cz*CS,TT=a.tileTops||tileTopsOf(a);let up1=AIR,up2=AIR;
  for(let y=TT[(lz>>2)*4+(lx>>2)];y>=0;y--){let b=a[li(lx,y,lz)];if(b===LEAVES&&leafDown(x,y,z))b=AIR;
    if(navSolid[b]){if(!navSolid[up1]&&!navSolid[up2]&&!(up1===WATER&&up2===WATER)&&!(BLOCK[b].post&&!(y>1&&a[li(lx,y-1,lz)]===b&&a[li(lx,y-2,lz)]===b)))c.push(y+1);}   // (the top of a railing's no place to walk: they hop it)
    else if(b===WATER&&up1!==WATER&&!navSolid[up1]&&y>0&&a[li(lx,y-1,lz)]===WATER)c.push(-y);
    up2=up1;up1=b;}
  navCols.set(k,c);return c;
}
const navHas=(x,z,f)=>{const c=navCol(x,z);if(c)for(let i=0;i<c.length;i++)if(c[i]===f||c[i]===-f)return true;return false;};
function navOpen(x,z,y0,y1){for(let y=y0;y<=y1;y++)if(solidAt(x,y,z))return false;return true;}
const navKey=(F,x,z,f)=>(x-F.ox)<<18|(z-F.oz)<<8|f;
function navMake(){return {keys:new Int32Array(NAV_HASH),idx:new Int32Array(NAV_HASH),key:new Int32Array(NAV_NODES),cost:new Int32Array(NAV_NODES),par:new Int32Array(NAV_NODES),mv:new Uint8Array(NAV_NODES),n:0,ox:0,oz:0};}
function navFind(F,k){let h=Math.imul(k,0x9E3779B1)>>>14;while(F.keys[h]!==-1){if(F.keys[h]===k)return F.idx[h];h=(h+1)&(NAV_HASH-1);}return -1;}
function navAdd(N,x,z,f,c,par,mv){
  const F=N.back,k=navKey(F,x,z,f);if(c>NAV_CAP||F.n>=NAV_NODES-1||x<F.ox||z<F.oz||x-F.ox>1023||z-F.oz>1023)return;
  let h=Math.imul(k,0x9E3779B1)>>>14,i=-1;while(F.keys[h]!==-1){if(F.keys[h]===k){i=F.idx[h];break;}h=(h+1)&(NAV_HASH-1);}
  if(i<0){i=F.n++;F.keys[h]=k;F.idx[h]=i;F.key[i]=k;}else if(F.cost[i]<=c)return;
  F.cost[i]=c;F.par[i]=par;F.mv[i]=mv;(N.q[c]||(N.q[c]=[])).push(i);
}
// everything that can get to this place in one move
function navExpand(N,i){
  const F=N.back,k=F.key[i],x=(k>>18&1023)+F.ox,z=(k>>8&1023)+F.oz,y=k&255,c0=F.cost[i],props=propCells.size>0;
  const at=(mx,mz,f,c,mv)=>navAdd(N,mx,mz,f,c0+c+(props&&propCells.has(propCK(mx,f+.2,mz))?50:0),i,mv);
  for(let d=0;d<8;d++){
    const dx=NAV_DX[d],dz=NAV_DZ[d],mx=x+dx,mz=z+dz,C=navCol(mx,mz);if(!C)continue;
    let near=false;
    for(let j=0;j<C.length;j++){
      const e=C[j],f=e<0?-e:e,dh=f-y,walk=(e<0?22:10)*(d<4?1:1.4)|0;
      if(dh>=-1&&dh<=1)near=true;
      if(d>=4){   // (diagonally, only past a corner there's room to cut)
        if(dh<-1||dh>1||!navHas(mx,z,y)&&!navHas(mx,z,f)||!navHas(x,mz,y)&&!navHas(x,mz,f))continue;}
      if(dh===0)at(mx,mz,f,walk,NAV_WALK);
      else if(dh===1){if(!solidAt(x,y+2,z))at(mx,mz,f,walk,NAV_WALK);}
      else if(dh===-1){if(!solidAt(mx,f+2,mz))at(mx,mz,f,walk,NAV_WALK);}
      else if(dh>1){   // it's above here: over the edge, and down (a long way down on hands and feet, if there's a wall to climb)
        if(!navOpen(x,z,y+2,f+1))continue;
        const wall=solidAt(mx,y+1,mz);
        if(dh<=GOB_SAFE)at(mx,mz,f,10+dh*3,NAV_WALK);else if(wall)at(mx,mz,f,20+dh*10,NAV_DOWN);}
      else{   // it's below here: a hop up, or a climb
        if(!navOpen(mx,mz,f+2,y+1))continue;
        if(dh===-2)at(mx,mz,f,24,NAV_JUMP);else if(solidAt(x,y-1,z)&&solidAt(x,y-2,z)&&solidAt(x,f,z))at(mx,mz,f,20-dh*18,NAV_UP);}
    }
    // nothing to stand on next door: a running jump over the gap, from up to four blocks off
    if(d<4&&!near)for(let g=2;g<=4;g++){
      const gx=x+dx*g,gz=z+dz*g,G2=navCol(gx,gz);if(!G2)break;
      let landed=false;
      for(let j=0;j<G2.length;j++){const e=G2[j];if(e<0)continue;const dh=e-y;if(dh<-2||dh>3)continue;
        let clear=true;for(let u=1;u<g&&clear;u++){const ux=x+dx*u,uz=z+dz*u,lo=Math.min(e,y);if(!navCol(ux,uz)){clear=false;break;}const b=get(ux,lo,uz);clear=navOpen(ux,uz,b&&BLOCK[b].post?lo+1:lo,Math.max(e,y)+2);}
        if(clear){at(gx,gz,e,10*g+16,NAV_JUMP);landed=true;}}
      if(landed||!navOpen(gx,gz,y,y+1))break;}
  }
}
// (how far a goblin can drop without hurting itself)
const GOB_SAFE=6;
const NAV_DX=[0,1,0,-1,1,1,-1,-1],NAV_DZ=[1,0,-1,0,1,-1,1,-1];
// the place something at this height in this column would be standing on (the nearest within a jump), or 0
function navFloorOf(x,z,y){const c=navCol(x,z);if(!c)return 0;let best=0,bd=1e9;for(let i=0;i<c.length;i++){const f=c[i]<0?-c[i]:c[i];if(f>y+1.25)continue;const d=y-f;if(d<bd){bd=d;best=f;}}return best;}
// (who needs a route: goblins actually after a hippo, not the ones pottering about indoors who haven't noticed it)
const navWants=g=>g.state==='chase'&&!g.civ&&!g.staff&&!g.medic&&!g.ff&&(!g.indoor||g.alert||g.cop&&!g.inv);
// a hippo clinging to the side of a building: the block it's clinging to, the top of that wall above it, and the ground at
// the foot of the wall below it (null if it isn't on a wall)
function navWallOf(p){
  const cl=p.state==='climb'||p.state==='piv'&&p.piv&&p.piv.next==='climb',d=p.climbD;
  if(!cl||!d||Math.abs(d[0])+Math.abs(d[1])!==1||d[0]%1||d[1]%1)return null;
  const fx=Math.floor(p.pos.x),fz=Math.floor(p.pos.z),wx=fx+d[0],wz=fz+d[1],c=navCol(wx,wz);if(!c)return null;
  let top=0;for(const e of c){const f=e<0?-e:e;if(f>p.pos.y+0.5&&(!top||f<top))top=f;}if(top&&top-p.pos.y>=60)top=0;
  const foot=navFloorOf(fx,fz,p.pos.y);return {wx,wz,top,fx,fz,foot:foot&&p.pos.y-foot<60?foot:0};
}
function navStart(N,p){
  const F=N.back,x=Math.floor(p.pos.x),z=Math.floor(p.pos.z),y=p.pos.y;
  F.keys.fill(-1);F.n=0;F.ox=x-NAV_R;F.oz=z-NAV_R;N.c=0;N.done=false;N.q.length=0;
  // (no further out than any goblin could need: a long way round, or a long climb, but not the whole neighbourhood every time)
  {let far=0;for(const g of goblins){if(!navWants(g))continue;const d=Math.hypot(g.pos.x-p.pos.x,g.pos.z-p.pos.z);if(d<NAV_R-2)far=Math.max(far,d*40+Math.abs(g.pos.y-y)*25);}N.lim=N.cap=Math.min(NAV_CAP,far+2000);}
  // (clinging to a wall: to the foot of that wall below it, or the top above it, whichever's nearer, and from there on to
  // the wall itself after it: see navSteer. Each costs what the climb on from there to it would.)
  {const w=navWallOf(p);if(w){if(w.top)navAdd(N,w.wx,w.wz,w.top,Math.round((w.top-y)*18),-1,NAV_WALK);if(w.foot)navAdd(N,w.fx,w.fz,w.foot,Math.round((y-w.foot)*18),-1,NAV_WALK);}}
  // (hanging about up in the air, or squeezed in against something: whatever's standing room nearest it)
  // (sunk under water: the top of it, straight up, is as near as the map goes)
  if(!F.n){let yy=Math.floor(y+.6);if(navCol(x,z)&&get(x,yy,z)===WATER){while(yy<H-1&&get(x,yy+1,z)===WATER)yy++;if(get(x,yy-1,z)===WATER&&!solidAt(x,yy+1,z))navAdd(N,x,z,yy,0,-1,NAV_WALK);}}
  if(!F.n)for(let r=0;r<=3;r++){for(let u=-r;u<=r;u++)for(let v=-r;v<=r;v++){if(Math.max(Math.abs(u),Math.abs(v))!==r)continue;const f=navFloorOf(x+u,z+v,y);if(f&&y-f<40)navAdd(N,x+u,z+v,f,r*10,-1,NAV_WALK);}if(F.n)break;}
  N.x=x;N.z=z;N.y=Math.floor(y);N.t=0;
  if(!F.n)N.done=true;
}
function navBuild(N,p,dt){
  N.t+=dt;
  if(N.done){if(!N.front||N.t>0.25&&(N.x!==Math.floor(p.pos.x)||N.z!==Math.floor(p.pos.z)||N.y!==Math.floor(p.pos.y))||N.t>1.5)navStart(N,p);else return;}
  // (running late, with a hippo on the move: put more into finishing it)
  const F=N.back;let work=N.t>0.4?NAV_WORK*2:NAV_WORK;
  while(work>0&&!N.done){
    if(N.c>N.lim||F.n>=NAV_NODES-1){N.done=true;break;}
    const q=N.q[N.c];if(!q||!q.length){N.c++;if(N.c>=N.q.length)N.done=true;continue;}
    const i=q.pop();if(F.cost[i]!==N.c)continue;
    navExpand(N,i);work--;
    // (every so often: if all the goblins after this hippo are on the map now, it only has to go a bit past them)
    if(N.lim===N.cap&&(++N.ticks&127)===0){let all=true,any=false;for(const g of goblins){if(!navWants(g))continue;const d=Math.hypot(g.pos.x-p.pos.x,g.pos.z-p.pos.z);if(d>NAV_R-2)continue;any=true;const f=navFloorOf(Math.floor(g.pos.x),Math.floor(g.pos.z),g.pos.y);if(!f||navFind(F,navKey(F,Math.floor(g.pos.x),Math.floor(g.pos.z),f))<0){all=false;break;}}if(any&&all)N.lim=N.c+200;}
  }
  if(N.done&&F.n){const o=N.front;N.front=F;N.back=o||navMake();}
}
function navUpdate(dt){
  navWipe+=dt;if(navWipe>60||navCols.size>60000){navWipe=0;navCols.clear();}   // (setRaw forgets a column whenever a block in it changes; this is only for whatever might get past it)
  for(const p of players){if(!p.active||p.state==='dead')continue;
    let want=false;for(const g of goblins)if(navWants(g)&&Math.abs(g.pos.x-p.pos.x)<NAV_R&&Math.abs(g.pos.z-p.pos.z)<NAV_R){want=true;break;}
    if(!want)continue;
    if(!p.nav)p.nav={front:null,back:navMake(),q:[],done:true,c:0,lim:0,x:0,z:0,y:0,t:0,ticks:0};
    navBuild(p.nav,p,dt);}
}
// which place on the map a goblin is at, or -1
function navAt(F,g){
  const x=Math.floor(g.pos.x),z=Math.floor(g.pos.z),f=navFloorOf(x,z,g.pos.y);
  if(f&&g.pos.y-f<1.6&&x-F.ox>=0&&z-F.oz>=0&&x-F.ox<=1023&&z-F.oz<=1023){const i=navFind(F,navKey(F,x,z,f));if(i>=0)return i;}
  return -1;
}
// is it a clear walk in a straight line, near enough on the level?
function navLine(x0,z0,y0,x1,z1,y1){
  const L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/0.45);
  for(let s=1;s<=n;s++){const u=s/n,x=Math.floor(x0+(x1-x0)*u),z=Math.floor(z0+(z1-z0)*u),y=y0+(y1-y0)*u,f=navFloorOf(x,z,y+0.8);
    if(!f||f<y-1.2||f>y+1.05||solidAt(x,Math.floor(y+.1)+1,z)&&f<=y||propCells.size&&propCells.has(propCK(x,f+.2,z)))return false;}
  return true;
}
// where a goblin after this hippo should make for next: a point to run at, and, if that takes more than running, it sets off
function navSteer(g,p){
  const N=p.nav,F=N&&N.front;if(!F)return null;
  {const r=gobRoofDown(g,p);if(r)return r.act?null:r;}
  // (a clear run at the hippo: straight at where it is now. The map's a moment old, and it may have moved on since)
  // (not when it's up a wall or high in the air over that floor: then the map knows better)
  if((g.losT=(g.losT||0)-1)<=0){g.losT=4+Math.random()*4;const X=Math.floor(p.pos.x),Z=Math.floor(p.pos.z),f=navFloorOf(X,Z,p.pos.y);g.losY=f;
    g.los=!!f&&p.pos.y-f<1.5&&p.state!=='climb'&&Math.abs(f-g.pos.y)<3&&Math.hypot(p.pos.x-g.pos.x,p.pos.z-g.pos.z)<40&&navLine(g.pos.x,g.pos.z,g.pos.y,p.pos.x,p.pos.z,f);}
  if(g.los)return{x:p.pos.x,z:p.pos.z,y:g.losY};
  const i=navAt(F,g);
  // (not on the map: jammed into the corner of a wall, or up on a railing. Off to the nearest place that is)
  if(i<0){const x=Math.floor(g.pos.x),z=Math.floor(g.pos.z);{const u=get(x,Math.floor(g.pos.y-.5),z);if(!solidAt(x,Math.floor(g.pos.y+.5),z)&&!(u&&BLOCK[u].post))return null;}for(let d=0;d<8;d++){const X=x+NAV_DX[d],Z=z+NAV_DZ[d],f=navFloorOf(X,Z,g.pos.y);if(f&&g.pos.y-f<1.6&&X-F.ox>=0&&Z-F.oz>=0&&X-F.ox<=1023&&Z-F.oz<=1023&&navFind(F,navKey(F,X,Z,f))>=0)return{x:X+.5,z:Z+.5,free:true};}return null;}
  const par=F.par[i];
  // (at the end of the route, and the hippo's on the wall right there: on to the wall after it, up from the foot or down from the top)
  if(par<0){const w=navWallOf(p);if(w){const x=Math.floor(g.pos.x),z=Math.floor(g.pos.z);
      if(x===w.fx&&z===w.fz&&w.top&&p.pos.y>g.pos.y+1.5)gobStartMove(g,NAV_UP,{x:w.wx,z:w.wz,y:w.top});
      else if(x===w.wx&&z===w.wz&&w.foot&&p.pos.y<g.pos.y-1.5)gobStartMove(g,NAV_DOWN,{x:w.fx,z:w.fz,y:w.foot});
      if(g.act)g.act.chasing=true;}
    return null;}
  const P=k=>({x:(k>>18&1023)+F.ox,z:(k>>8&1023)+F.oz,y:k&255});
  if(F.mv[i]!==NAV_WALK){const t=P(F.key[par]);gobStartMove(g,F.mv[i],t);if(g.act)return null;return{x:t.x+.5,z:t.z+.5};}
  // (a short cut along the route, where there's nothing in the way, so they don't run in staircase steps across open ground)
  g.navT=(g.navT||0)-1;let a=par;
  if(g.navT<=0||g.navAimI===undefined||g.navF!==F){g.navT=10;g.navF=F;let b=par;for(let s=0;s<10;s++){if(F.mv[b]!==NAV_WALK||F.par[b]<0)break;const c=F.par[b],t=P(F.key[c]);if(!navLine(g.pos.x,g.pos.z,g.pos.y,t.x+.5,t.z+.5,t.y))break;b=c;}g.navAimI=b;a=b;}
  else{a=g.navAimI;const q=P(F.key[a]);if(Math.hypot(q.x+.5-g.pos.x,q.z+.5-g.pos.z)<0.7)a=par,g.navT=0;}
  const t=P(F.key[a]);return{x:t.x+.5,z:t.z+.5,y:t.y,next:P(F.key[par])};
}
// up on top of the building a hippo's clinging to, above it: along to the edge over it, and down the wall after it. The map
// can't always be trusted for this (a moment old, with the hippo moving about on the wall, it can lead a goblin straight off
// the edge, and the top of the hippo's bit of wall can be a window up here has no way to). Null if that's no way to it.
function gobRoofDown(g,p){
  const w=navWallOf(p),gy=g.pos.y;if(!w||gy<p.pos.y+1.5||gy>p.pos.y+60)return null;
  const C=p.climbD,L=[Math.abs(C[1]),Math.abs(C[0])],x=Math.floor(g.pos.x),z=Math.floor(g.pos.z);
  // (on the roof behind that wall, not far along it from the hippo)
  const depth=(x-w.wx)*C[0]+(z-w.wz)*C[1],lat=(x-w.wx)*L[0]+(z-w.wz)*L[1];if(depth<0||depth>8||Math.abs(lat)>8)return null;
  // (the edge right over the hippo, or as near along it as there's a clear way down to it)
  for(const s of [0,1,-1,2,-2]){const ex=w.wx+L[0]*s,ez=w.wz+L[1]*s,e=navFloorOf(ex,ez,gy+0.5);if(!e||Math.abs(e-gy)>1.1)continue;
    const ox=ex-C[0],oz=ez-C[1];if(!navCol(ox,oz)||!navOpen(ox,oz,Math.floor(p.pos.y)+1,e+1))continue;
    if(x===ex&&z===ez){gobStartMove(g,NAV_DOWN,{x:ox,z:oz,y:navFloorOf(ox,oz,p.pos.y+0.5)||Math.floor(p.pos.y)});g.act.chasing=true;return {act:true};}
    return navLine(g.pos.x,g.pos.z,gy,ex+.5,ez+.5,e)?{x:ex+.5,z:ez+.5,y:e,edge:true}:null;}
  return null;
}
// a jump, or a climb up or down a wall: from now until it's over the goblin's taken up with it
function gobStartMove(g,mv,t){
  const tx=t.x+.5,tz=t.z+.5,y=g.pos.y,face=Math.floor(g.pos.x)!==t.x?[Math.sign(t.x-Math.floor(g.pos.x)),0]:[0,Math.sign(t.z-Math.floor(g.pos.z))];
  if(mv===NAV_JUMP){const L=Math.hypot(tx-g.pos.x,tz-g.pos.z);g.act={k:'jump',t:0,T:Math.max(0.45,L/6.5),x0:g.pos.x,y0:y,z0:g.pos.z,x1:tx,y1:t.y,z1:tz,h:0.7+L*0.18};g.heading=Math.atan2(tx-g.pos.x,tz-g.pos.z);}
  else if(mv===NAV_UP){const wx=face[0]?(face[0]>0?t.x-.3:t.x+1.3):g.pos.x,wz=face[1]?(face[1]>0?t.z-.3:t.z+1.3):g.pos.z;g.act={k:'up',x:wx,z:wz,y1:t.y,tx,tz,f:face};g.heading=Math.atan2(face[0],face[1]);}
  else{const wx=face[0]?(face[0]>0?t.x+.3:t.x+.7):g.pos.x,wz=face[1]?(face[1]>0?t.z+.3:t.z+.7):g.pos.z;g.act={k:'down',x:wx,z:wz,y1:t.y,f:face};g.heading=Math.atan2(-face[0],-face[1]);}
}
// down after a fall: past the safe height it hurts, a point for every two blocks more (knocked off by a hippo, the hippo gets
// the credit; a slip of its own is an accident)
function gobLand(g){
  const h=(g.fallTop??g.pos.y)-g.pos.y;g.fallTop=undefined;if(h<=GOB_SAFE||g.state!=='chase')return;
  const n=Math.ceil((h-GOB_SAFE)/2);splat(g.pos.x,g.pos.z,g.pos.y+0.05,0.2+n*0.1);thud(Math.min(0.5,0.1+n*0.08));
  damageGoblin(g,n,new V3(g.pos.x,g.pos.y+0.4,g.pos.z),null,'Fell to death',playTime-(g.hitT??-99)<4?undefined:ACCIDENT);
}
// a hippo hanging on the same face of wall as a climbing goblin, or on the face round the corner from it: across it (and
// round the corner) and up or down to it, rather than on up to the top. True while it's doing that. (It keeps to the wall:
// no wall beside it, or something in the way, and that way's shut.)
function gobWallCrawl(g,A,dt){
  let W=A.k==='up'?A.f:[-A.f[0],-A.f[1]],q=null,qd=1e9,turn=null;
  for(const p of players){if(!p.active||p.state==='dead'||!(p.state==='climb'||p.state==='piv'&&p.piv&&p.piv.next==='climb')||!p.climbD)continue;
    const C=p.climbD,d=Math.hypot(p.pos.x-g.pos.x,p.pos.z-g.pos.z,p.pos.y-g.pos.y);if(d>=24||d>=qd)continue;
    if(C[0]===W[0]&&C[1]===W[1]){
      // (on this face: the same row of blocks out from the wall, and not miles off)
      if(W[0]?Math.floor(p.pos.x)!==Math.floor(g.pos.x):Math.floor(p.pos.z)!==Math.floor(g.pos.z))continue;
      qd=d;q=p;turn=null;}
    else if(C[0]*W[0]+C[1]*W[1]===0&&Math.abs(C[0])+Math.abs(C[1])===1){const k=gobCorner(g,W,C,p);if(k){qd=d;q=p;turn=k;}}}
  if(!q)return false;
  A.chasing=true;
  const clings=(x,z,yy)=>solidAt(x+W[0],yy,z+W[1])&&!solidAt(x,yy,z)&&!solidAt(x,yy+1,z);
  let moved=false;
  if(turn){
    // along to the corner (up or down towards the hippo's height on the way), and round it on to the hippo's face
    const L=turn.L,rem=(turn.x+.5-g.pos.x)*L[0]+(turn.z+.5-g.pos.z)*L[1],dy=q.pos.y-g.pos.y;
    if(rem>0.15){const s=Math.min(rem,dt*2.4),nx=g.pos.x+L[0]*s,nz=g.pos.z+L[1]*s;
      if(clings(Math.floor(nx),Math.floor(nz),Math.floor(g.pos.y+.1))){g.pos.x=nx;g.pos.z=nz;if(L[0])A.x=nx;else A.z=nz;moved=true;}
      if(Math.abs(dy)>0.2){const ny=g.pos.y+Math.sign(dy)*Math.min(Math.abs(dy),dt*2.6),yy=Math.floor(ny+.1);
        // (only while the way along to the corner's still there at the new height)
        if(clings(Math.floor(g.pos.x),Math.floor(g.pos.z),yy)&&gobCorner(g,W,q.climbD,q,yy)){g.pos.y=ny;moved=true;}}}
    else{const C=q.climbD;g.pos.x=turn.tx+.5+C[0]*.2;g.pos.z=turn.tz+.5+C[1]*.2;A.x=g.pos.x;A.z=g.pos.z;A.f=A.k==='up'?[C[0],C[1]]:[-C[0],-C[1]];
      g.heading=Math.atan2(C[0],C[1]);W=C;moved=true;}
  }else{
    const L=W[0]?[0,1]:[1,0],lat=(q.pos.x-g.pos.x)*L[0]+(q.pos.z-g.pos.z)*L[1],dy=q.pos.y-g.pos.y,y=Math.floor(g.pos.y+.1);
    if(Math.abs(lat)>0.25){const s=Math.sign(lat)*Math.min(Math.abs(lat),dt*2.4),nx=g.pos.x+L[0]*s,nz=g.pos.z+L[1]*s;
      if(clings(Math.floor(nx),Math.floor(nz),y)){g.pos.x=nx;g.pos.z=nz;if(L[0])A.x=nx;else A.z=nz;moved=true;}}
    if(Math.abs(dy)>0.2){const ny=g.pos.y+Math.sign(dy)*Math.min(Math.abs(dy),dt*2.6),yy=Math.floor(ny+.1);
      if(clings(Math.floor(g.pos.x),Math.floor(g.pos.z),yy)){g.pos.y=ny;moved=true;}}
  }
  if(!moved)return false;   // (stuck: back to making for the top, or the bottom)
  // (wherever it's got to, the top of the wall above it, or the ground below it, is where it finishes if the hippo lets go)
  const x=Math.floor(g.pos.x),z=Math.floor(g.pos.z);
  if(A.k==='up'){const c=navCol(x+W[0],z+W[1]);if(c){let top=0;for(const e of c){const f=e<0?-e:e;if(f>g.pos.y&&(!top||f<top))top=f;}if(top){A.y1=top;A.tx=x+W[0]+.5;A.tz=z+W[1]+.5;}}}
  else{const f=navFloorOf(x,z,g.pos.y);if(f)A.y1=f;}
  return true;
}
// could it get round the corner to this hippo on the wall, at its own height or a little higher up? (Windows and the
// like can break up a face of wall at one height and not another)
function gobRound(g,W,p,d){
  const C=p.climbD;if(C[0]*W[0]+C[1]*W[1]!==0||Math.hypot(d,p.pos.y-g.pos.y)>=24)return false;
  const y0=Math.floor(g.pos.y+.1),y1=Math.min(y0+12,Math.max(y0,Math.floor(p.pos.y+.1))+2);
  for(let y=y0;y<=y1;y++)if(gobCorner(g,W,C,p,y))return true;
  return false;
}
// the way along a goblin's face of wall (W) and round the corner to a hippo clinging to the face beside it (C), at the
// goblin's height: which way along (L), the last place on this face (x,z) and the first on the hippo's (tx,tz). Null if
// the wall doesn't lead there: a gap in it, something in the way, or the hippo's on the face of something else.
// (Round the outside of a corner if the hippo's beyond this face's wall, round the inside of one if it isn't.)
function gobCorner(g,W,C,p,yy){
  const y=yy??Math.floor(g.pos.y+.1),x0=Math.floor(g.pos.x),z0=Math.floor(g.pos.z),open=(x,z)=>!solidAt(x,y,z)&&!solidAt(x,y+1,z);
  const outer=(p.pos.x-g.pos.x)*W[0]+(p.pos.z-g.pos.z)*W[1]>0.5,L=outer?[-C[0],-C[1]]:[C[0],C[1]];
  const row=Math.floor(p.pos.x)*C[0]+Math.floor(p.pos.z)*C[1];
  for(let k=0;k<24;k++){const x=x0+L[0]*k,z=z0+L[1]*k;
    if(!open(x,z)||!solidAt(x+W[0],y,z+W[1]))return null;
    if(outer){if(!solidAt(x+L[0]+W[0],y,z+L[1]+W[1])){const tx=x+L[0]+W[0],tz=z+L[1]+W[1];
        return open(x+L[0],z+L[1])&&open(tx,tz)&&tx*C[0]+tz*C[1]===row?{L,x,z,tx,tz}:null;}}
    else if(solidAt(x+L[0],y,z+L[1]))return x*C[0]+z*C[1]===row?{L,x,z,tx:x,tz:z}:null;}
  return null;
}
// partway up a wall after a hippo that's since let go and dropped below it, or that's gone round to a face of the building
// it can't crawl round to: back down, rather than on to the top of a climb that no longer leads anywhere near it
function gobWallTurn(g,A){
  const t=nearestPlayer(g.pos.x,g.pos.z,true);if(!t||!A.chasing||A.k!=='up')return;
  // (only a climb that was after a hippo on the wall: a route up and over stays as it is)
  const p=t.p,W=A.f,x=Math.floor(g.pos.x),z=Math.floor(g.pos.z),f=navFloorOf(x,z,g.pos.y);if(!f||f>=g.pos.y-0.5)return;
  let down=false;
  // (back on its feet below it)
  if(p.grounded&&p.state!=='climb'&&p.state!=='piv')down=t.d<=40&&p.pos.y<g.pos.y-1;
  // (on another face, with no way round to it on the wall: down and round on foot, if that's less of a climb than over the top and down to it. Costs as the map's)
  else if(navWallOf(p)&&t.d<=100&&(p.climbD[0]!==W[0]||p.climbD[1]!==W[1])&&!gobRound(g,W,p,t.d)){const dx=Math.abs(p.pos.x-g.pos.x),dz=Math.abs(p.pos.z-g.pos.z);
    down=(g.pos.y+p.pos.y-2*f)*18+(dx+dz)*10<(2*A.y1-g.pos.y-p.pos.y)*18+Math.hypot(dx,dz)*10;}
  if(down)g.act={k:'down',x:g.pos.x,z:g.pos.z,y1:f,f:[-W[0],-W[1]]};
}
function gobMoveStep(g,dt){
  const A=g.act;g.phase+=dt*9;
  const sn=Math.sin(g.phase);
  if(A.k==='jump'){A.t+=dt;const s=Math.min(1,A.t/A.T),up=A.y1>A.y0+0.5,sx=up?s*s:s;g.pos.x=A.x0+(A.x1-A.x0)*sx;g.pos.z=A.z0+(A.z1-A.z0)*sx;g.pos.y=A.y0+(A.y1-A.y0)*Math.min(1,s*(up?1.6:1))+A.h*4*s*(1-s);g.vy=0;
    g.arm.rotation.x=-2.2;g.armL.rotation.x=-2.2;g.legs[0].rotation.x=0.6;g.legs[1].rotation.x=-0.6;if(s>=1){g.pos.y=Math.max(g.pos.y,A.y1);g.act=null;}return;}
  // up or down a wall, hand over hand
  g.pos.x+=(A.x-g.pos.x)*Math.min(1,dt*10);g.pos.z+=(A.z-g.pos.z)*Math.min(1,dt*10);g.vy=0;
  g.arm.rotation.x=-2.6+sn*0.5;g.armL.rotation.x=-2.6-sn*0.5;g.legs[0].rotation.x=-0.5+sn*0.5;g.legs[1].rotation.x=-0.5-sn*0.5;
  if(gobWallCrawl(g,A,dt))return;
  gobWallTurn(g,A);
  if(A.k==='up'){g.pos.y+=dt*2.6;
    if(!solidAt(Math.floor(A.tx),A.y1-1,Math.floor(A.tz)))g.act=null;   // (the top of the wall's gone: it just falls)
    else if(g.pos.y>=A.y1-.1){const L=Math.hypot(A.tx-g.pos.x,A.tz-g.pos.z);g.act={k:'jump',t:0,T:0.3,x0:g.pos.x,y0:g.pos.y,z0:g.pos.z,x1:A.tx,y1:A.y1,z1:A.tz,h:0.25+L*.05};}
  }else{g.pos.y-=dt*3.2;if(g.pos.y<=A.y1){g.pos.y=A.y1;g.act=null;}}
}
const GOB_GRID=new Map(),gobCell=(x,z)=>(x+1048576)*2097152+(z+1048576);   // (a whole-number key for a block column, unique for a million blocks either way)
function updateGoblins(dt){
  navUpdate(dt);
  const nAct=players.filter(p=>p.active).length;
  if(playing){playTime+=dt;posSaveT=(posSaveT||0)+dt;if(posSaveT>2){posSaveT=0;savePos();}}
  const sb=streetBusy(),active=Math.round(Math.min(14,(nAct>1?8:5)+Math.floor(playTime/75))*crowd*(0.75+0.25*sb)),civTarget=Math.round((nAct>1?12:9)*crowd*(0.4+0.6*sb));let gone=false;
  let hostileAlive=0,civAlive=0;for(const g of goblins)if(g.state==='chase'){if(g.staff||g.special)continue;if(g.civ)civAlive++;else hostileAlive++;}
  // who's standing where, a block to a cell, so each goblin only checks the few around it for crowding (checking every
  // goblin against every other one gets slow fast: 600 of them took 30+ ms a frame)
  GOB_GRID.clear();for(const g of goblins)if(g.state==='chase'){const k=gobCell(Math.floor(g.pos.x),Math.floor(g.pos.z)),l=GOB_GRID.get(k);if(l)l.push(g);else GOB_GRID.set(k,[g]);}
  goblins.forEach(g=>{
    g.t+=dt;g.hurt-=dt;g.atkS=(g.atkS??9)+dt;g.relS=(g.relS??9)+dt;if(g.pkit)copKit(g);   // (since its last blow, and since its last shot, throw or fireball: see strikes.js)
    {const glow=g.hurt>0;if(glow!==g.glow){g.glow=glow;for(const m of g.mats)m.emissive.setHex(glow?0x440000:0x000000);}}   // (only when it changes: ten materials a goblin, every frame, adds up in a crowd)
    if(g.state!=='chase'){g.act=null;g.fallTop=undefined;}
    if(g.state==='wait'){
      if(g.special)return;   // (cultists and the compounds' people: only ever brought out by their own place, or the Testing Environment)
      if(g.staff){if(g.t>1.5&&playing&&crowd>0&&!spawnStaff(g))g.t=0;}
      else if(g.civ){if(!TENV&&civAlive<civTarget&&g.t>1.5&&playing){if(spawnCiv(g))civAlive++;else g.t=0;}}
      else if(!TENV&&hostileAlive<active&&g.t>6&&playing&&alivePlayers().length){if(spawnGoblin(g))hostileAlive++;else g.t=3;}
      return;
    }
    if(g.state==='dead'){
      knockMove(g,dt);
      {const gr=supportAt(g.pos.x,g.pos.z,g.pos.y);if(gr!==null){if(g.vy>0||g.pos.y>gr+0.01){g.vy-=25*dt;g.pos.y+=g.vy*dt;if(g.pos.y<gr){g.pos.y=gr;g.vy=0;}}}}
      const f=Math.min(1,g.t*3);g.root.rotation.x=-f*Math.PI/2;
      g.root.position.set(g.pos.x,g.pos.y+f*0.15-g.sink,g.pos.z);g.root.rotation.y=g.heading;g.arm.rotation.x=-1.4;g.armL.rotation.x=-1.4;
      const waiting=g.claim&&g.claim.alive&&g.t<80;   // an ambulance is on its way: they stay put
      if(g.t>8&&!waiting)g.sink+=dt*0.4;
      if(g.t>11&&!waiting){g.state='wait';g.t=0;g.root.visible=false;g.claim=null;g.tended=false;}
      return;
    }
    const any=nearestPlayer(g.pos.x,g.pos.z,false);
    if(!any||any.d>(g.navOn||g.act?NAV_R-5:75)){if(g.mount){crewBoard(g);return;}   // (running for a vehicle out where nobody can see: it's got there)
      if(g.news)endNews(g);g.state='wait';g.t=0;g.root.visible=false;return;}
    // more about than there'd be at this hour (night falling, a shop closing): one at a time, out of sight, they go
    // home -- quietly vanishing somewhere no one's looking
    if(!gone&&g.t>15&&any.d>28&&!g.medic&&!g.ff&&!g.cop&&!g.news&&(g.civ&&!g.staff&&!TENV&&civAlive>civTarget||g.staff&&g.employer&&staffAt(g.employer.key)>staffCapNow(g.employer.b))&&!visibleToAny(g.pos.x,g.pos.y+1,g.pos.z)){
      gone=true;g.state='wait';g.t=0;g.root.visible=false;if(g.civ&&!g.staff)civAlive--;g.vendor=null;g.employer=null;return;}
    const tgt=nearestPlayer(g.pos.x,g.pos.z,true);
    let moving=false,d=1e9,dx=0,dz=0;
    if(g.snowU){if(g.snowFor!==g.id){g.snowFor=g.id;g.snowU.value=WX.k.snow>0.08?WX.snowCover*0.5:0;}snowGather(g,dt,g.phaseWas!==g.phase);g.phaseWas=g.phase;}
    g.stun-=dt;knockMove(g,dt);
    // (partway through a jump or a climb: that's all it's doing, unless something knocks it off)
    if(g.act){if(g.stun>0||!playing)g.act=null;else{
      let held=false;if(g.act.k==='up'||g.act.k==='down'){const t=nearestPlayer(g.pos.x,g.pos.z,true);if(t&&t.d<2.3){const q=t.p,dy=q.pos.y-g.pos.y;
        if(dy>-1.3&&dy<1.5){held=true;g.atk-=dt;if(g.atk<=0)g.atkS=0;if(!gobMeleePose(g,true))g.arm.rotation.x+=(-0.5-g.arm.rotation.x)*Math.min(1,dt*8);
          if(g.atk<=0){g.atk=1.5;const ux=(g.pos.x-q.pos.x)/(t.d||1),uz=(g.pos.z-q.pos.z)/(t.d||1);damagePlayer(q,1,new V3(q.pos.x+ux*1.2,q.pos.y+1.1,q.pos.z+uz*1.2),new V3(-ux,0.3,-uz),'Clubbed off a wall',g.id);}}}}   // (both hanging on to the same wall: it stops climbing and swings)
      if(!held)gobMoveStep(g,dt);if(g.atkX){g.atkX.tw=g.atkX.ln=g.atkX.lu=0;g.root.rotation.x=0;}g.posed=false;g.root.position.set(g.pos.x,g.pos.y,g.pos.z);g.root.rotation.y=g.heading;return;}}   // (on a wall: just the arms, no twist or lunge)
    if(g.medic)moving=medicAI(g,dt);
    else if(g.ff)moving=fireAI(g,dt);
    else if(g.news)moving=newsAI(g,dt);
    else if(g.mount)moving=crewRun(g,dt);   // (running out to a vehicle to crew it: see crews.js)
    else if(g.homeV&&(!g.homeV.roused||calmNow()))moving=g.cultist?cultCalm(g,dt):guardCalm(g,dt);   // (at the altar or their posts, until something sets them off)
    else if(g.civ||calmNow()&&!jackGrudge(g,dt))moving=civAI(g,dt);   // (with hostility off, or to a fellow goblin, hostile goblins act like the townsfolk -- not one you've just carjacked)
    else if(tgt){
      dx=tgt.p.pos.x-g.pos.x;dz=tgt.p.pos.z-g.pos.z;d=Math.hypot(dx,dz);
      // they can only club you if you're roughly level with them
      const reach=2.3,ddy=tgt.p.pos.y-g.pos.y,canHit=ddy>-1.3&&ddy<1.5;
      // a cultist conjuring a fireball stands its ground till it's thrown
      // (and police, once they've seen him, draw their handguns at range: police-gun.js)
      if(g.cultist&&cultCast(g,tgt.p,d,ddy,dt)||g.foeKind&&FOES[g.foeKind].gun&&foeRanged(g,tgt.p,d,ddy,dt)||g.gun&&!(g.cop&&g.inv)&&foeRanged(g,tgt.p,d,ddy,dt,g.gun)){g.legs[0].rotation.x=g.legs[1].rotation.x=0;gobRootPose(g,g.pos.y,dt);return;}
      // goblins holed up indoors stay put, pottering about, until a hippo is close and on their floor
      if(g.indoor&&!bldgAt(Math.floor(g.pos.x),Math.floor(g.pos.z)))g.indoor=false;
      if(g.cop&&g.inv&&d<22&&Math.abs(ddy)<4){g.inv=false;flashLabel('Police!',tgt.p);tone('square',880,660,0.25,0.05);}   // spotted!
      const copIdle=g.cop&&g.inv;if(copIdle){g.cop.t+=dt;if(g.cop.t>35&&Math.hypot(g.cop.car.pos.x-g.pos.x,g.cop.car.pos.z-g.pos.z)<2.8){g.state='wait';g.root.visible=false;g.t=0;g.cop=null;g.inv=false;return;}}
      // (once it's noticed a hippo close by, on this floor or just through the ceiling, it's after it, not pottering about)
      if(g.indoor&&d<(Math.abs(ddy)>3?32:16))g.alert=true;else if(!g.indoor||d>60)g.alert=false;
      let sr=null;
      // after a hippo: the route to it, however that goes (and if it's within arm's reach, nothing to work out)
      const hunting=!copIdle&&(!g.indoor||g.alert),inReach=d<=reach&&canHit;
      // (right below a hippo stood on something, with nothing overhead: no use looking for a way round, it's a leap. See below.)
      const below=!g.wet&&d<=reach&&ddy>=1.5&&ddy<4&&navOpen(Math.floor(g.pos.x),Math.floor(g.pos.z),Math.floor(g.pos.y)+2,Math.floor(g.pos.y+ddy));
      g.navOn=false;if(hunting&&g.stun<=0&&!inReach&&!below&&playing){sr=navSteer(g,tgt.p);g.navOn=!!sr||!!g.act;if(g.act)return;}   // (and it's still after you, even if the way round takes it further off than usual)
      // a hippo on another floor, close by: up or down the stairs after it (or, holed up indoors, off to another floor now and then)
      // (in a long building the stairs may be further from the hippo than the goblin started: once it's set off for them, it keeps going)
      const chaseUp=Math.abs(ddy)>2.5&&(d<(g.stUp!==undefined?90:32)||d<90&&!sr&&g.stun<=0&&(bldgAt(Math.floor(g.pos.x),Math.floor(g.pos.z))||{b:0}).b.style==='capitol');   // (the capitol's so big, and its rooms so many, that a route map may not reach the far ones)
      if(!sr&&g.stun<=0&&!copIdle&&(chaseUp||g.trip||g.stUp!==undefined)){const B=bldgAt(Math.floor(g.pos.x),Math.floor(g.pos.z));
        if(B&&B.b.stair){if(chaseUp){if(!onStair(g,B))g.stUp=ddy>0;sr=stairPoint(g,B,g.stUp);}
          else if(g.trip){g.stUp=g.trip.up;g.trip.t-=dt;if(g.trip.t>0&&Math.abs(g.pos.y-g.trip.y0)<3.5)sr=stairPoint(g,B,g.trip.up);}}
        // (once on a flight, it finishes it, even if the hippo's now nearly level)
        if(!sr&&B&&B.b.stair&&g.stUp!==undefined&&onStair(g,B))sr=stairPoint(g,B,g.stUp);
        // (caught on a flight for a second and a half: a little hop gets it going again)
        if(sr&&B&&onStair(g,B)){if(Math.abs(g.pos.x-(g.stX||0))+Math.abs(g.pos.z-(g.stZ||0))>0.4){g.stX=g.pos.x;g.stZ=g.pos.z;g.stT=0;}else if((g.stT=(g.stT||0)+dt)>1.5){g.stT=0;g.pos.y+=0.7;}}
        if(!sr){g.trip=null;g.stUp=undefined;}}
      // (a hippo on this floor, in another room: go round by the doors)
      if(!sr&&g.stun<=0&&!copIdle&&Math.abs(ddy)<=2.5&&d<=40){const B=bldgAt(Math.floor(g.pos.x),Math.floor(g.pos.z));if(B)sr=roomStep(g,B,g.pos.x+dx,g.pos.z+dz);}
      const lurk=(g.indoor&&!g.alert&&(d>16||Math.abs(ddy)>3)||copIdle)&&!sr;
      if(playing&&g.stun<=0&&lurk){
        g.wtT=(g.wtT||0)-dt;if(!g.wt||g.wtT<=0){g.wt=copIdle?copSpot(g):Math.random()<0.5?indoorWander(g):null;g.wtT=2+Math.random()*3;if(!copIdle&&Math.random()<0.08)g.trip={up:Math.random()<0.5,t:14,y0:g.pos.y};}
        if(g.wt){const wx=g.wt.x-g.pos.x,wz=g.wt.z-g.pos.z,wd=Math.hypot(wx,wz);
          if(wd<0.5)g.wt=null;else{let df=Math.atan2(wx,wz)-g.heading;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;g.heading+=Math.max(-5*dt,Math.min(5*dt,df));
            const fx=Math.sin(g.heading),fz=Math.cos(g.heading);if(gobGround(g.pos.x+fx*0.45,g.pos.z+fz*0.45,g.pos.y)-g.pos.y<=1.05){g.pos.x+=fx*1.2*dt;g.pos.z+=fz*1.2*dt;moving=true;g.phase+=dt*6;}else g.wt=null;}}
      }
      else if(playing&&g.stun<=0){
        if(sr){dx=sr.x-g.pos.x;dz=sr.z-g.pos.z;d=Math.max(reach+1,Math.hypot(dx,dz));}
        let want=Math.atan2(dx,dz);
        if(g.detour>0){g.detour-=dt;want=g.detourH;}
        let diff=want-g.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
        // (on a route, close to the next point: straight at it, or it'd run in circles round it)
        if(sr&&Math.hypot(dx,dz)<1.1)g.heading+=diff;else g.heading+=Math.max(-7*dt,Math.min(7*dt,diff));
        // (along a roof's edge to the place over a hippo on the wall below: not a step off it, even turning round)
        if(sr&&sr.edge&&gobGround(g.pos.x+Math.sin(g.heading)*0.45,g.pos.z+Math.cos(g.heading)*0.45,g.pos.y)<g.pos.y-1.5){g.heading+=diff;d=0;}
        if(d>reach){
          const fx=Math.sin(g.heading),fz=Math.cos(g.heading);
          const ahead=gobGround(g.pos.x+fx*0.45,g.pos.z+fz*0.45,g.pos.y,g,dt);
          if(sr&&sr.free){const L=Math.hypot(dx,dz)||1,sp=g.spd||2.8;g.pos.x+=dx/L*sp*dt;g.pos.z+=dz/L*sp*dt;moving=true;g.phase+=dt*12.6;}
          else
          // (the route says it's a step, but it's a touch more than one from here, off the low end of a ramp, say: a hop)
          if(ahead-g.pos.y>1.05&&sr&&!sr.next&&g.los){g.los=false;g.losT=120;g.detour=0;g.stuck=0;}   // (it wasn't so clear after all: back to the route for a bit)
          if(ahead-g.pos.y>1.05&&sr&&sr.next){g.navT=0;if(sr.next.y-g.pos.y>1.05&&ahead-g.pos.y<2.6){gobStartMove(g,NAV_JUMP,sr.next);return;}}
          if(ahead-g.pos.y>1.05){
            g.stuck+=dt;
            if(g.stuck>0.25){
              // walk along the wall: pick the open street direction that best heads toward the target
              let best=null,bs=-9;
              for(const [vx,vz] of DIRV){if(gobGround(g.pos.x+vx*1.2,g.pos.z+vz*1.2,g.pos.y)-g.pos.y>1.05)continue;const s=(vx*dx+vz*dz)/(d||1)+Math.random()*0.4;if(s>bs){bs=s;best=[vx,vz];}}
              if(best){g.detour=1.3;g.detourH=Math.atan2(best[0],best[1]);}
              g.stuck=0;
            }
          } else {const sp=g.wet?2:(g.spd||2.8);g.pos.x+=fx*sp*dt;g.pos.z+=fz*sp*dt;moving=true;g.phase+=dt*sp*4.5;g.stuck=0;}
          if(g.vy===0)g.atk=Math.max(g.atk,0.5);
        } else if(!canHit){if(g.vy===0)g.atk=Math.max(g.atk,0.5);
          // (a hippo stood on something just out of reach, a car roof, say: up at it, club first)
          g.leapT=(g.leapT||0)-dt;if(ddy>=1.5&&ddy<4&&g.leapT<=0&&!g.wet&&g.vy===0){g.vy=Math.sqrt(50*(ddy-0.2));g.leapT=1.4;g.atk=0.1;}}
        else {
          g.atk-=dt;
          if(g.atk<=0){dbgHit('dmg','cyl',{x:g.pos.x,y:g.pos.y-1.5,z:g.pos.z,r:2.3,h:2.8},'n');g.atk=g.cultist?0.85:g.foeKind?FOES[g.foeKind].melee[1]:1.5;g.atkS=0;const q=tgt.p,ux=-dx/(d||1),uz=-dz/(d||1);damagePlayer(q,1,new V3(q.pos.x+ux*1.2,q.pos.y+1.1,q.pos.z+uz*1.2),new V3(-ux,0.3,-uz),g.cultist?'Stabbed with a ritual dagger':g.foeKind?FOES[g.foeKind].melee[2]:'Clubbed to death',g.id);}   // (a dagger's quicker than a club)
        }
      }
      // (its blow: wound up over the last 0.45 s before it lands, then the follow-through; see strikes.js. Just after a
      // shot or a throw, foeRanged has posed the arms already)
      if(gobMeleePose(g,playing&&canHit&&d<=reach+0.3)||(g.relS??9)<STRIKE_FT&&g.posed){}
      else g.arm.rotation.x+=((-0.5+(moving?Math.sin(g.phase)*0.4:0))-g.arm.rotation.x)*Math.min(1,dt*8);
    }
    for(const p of players){if(!p.active||p.state==='dead'||Math.abs(p.pos.y-g.pos.y)>1.2||g.vy!==0)continue;const hx=g.pos.x-p.pos.x,hz=g.pos.z-p.pos.z,hd=Math.hypot(hx,hz),gap=p.gob?0.7:1.6;if(hd<gap&&hd>0.001)nudge(g,hx/hd*(gap-hd),hz/hd*(gap-hd));}
    for(const c of cars){if(!c.alive)continue;const cx=g.pos.x-c.pos.x,cz=g.pos.z-c.pos.z,cd=Math.hypot(cx,cz);if(cd<2&&cd>0.001)nudge(g,cx/cd*(2-cd),cz/cd*(2-cd));}
    {const cx=Math.floor(g.pos.x),cz=Math.floor(g.pos.z);   // (its own cell and the eight round it: anyone within 0.7 is in there, even after this frame's moves)
     for(let ix=cx-1;ix<=cx+1;ix++)for(let iz=cz-1;iz<=cz+1;iz++){const l=GOB_GRID.get(gobCell(ix,iz));if(!l)continue;
       for(const o of l){if(o===g||o.state!=='chase')continue;const ox=g.pos.x-o.pos.x,oz=g.pos.z-o.pos.z;if(ox>0.7||ox<-0.7||oz>0.7||oz<-0.7)continue;const od=Math.hypot(ox,oz);if(od<0.7&&od>0.001)nudge(g,ox/od*(0.7-od)*0.5,oz/od*(0.7-od)*0.5);}}}
    // in water too deep to stand in: up to the top of it and paddling, head out (or down after a hippo that's sunk close by)
    {const xi=Math.floor(g.pos.x),zi=Math.floor(g.pos.z),wy=Math.floor(g.pos.y+0.6);g.wet=get(xi,wy,zi)===WATER&&get(xi,wy-1,zi)===WATER;
     if(g.wet){let top=wy;while(top<H-1&&get(xi,top+1,zi)===WATER)top++;let wantY=g.civ?top:top-0.4;if(tgt&&!g.civ&&d<8&&tgt.p.wet&&tgt.p.pos.y<top)wantY=Math.max(tgt.p.pos.y,top-12);
       g.vy=0;g.pos.y+=Math.max(-3*dt,Math.min(3*dt,wantY-g.pos.y));
       if(moving&&(g.splash=(g.splash||0)-dt)<=0){g.splash=0.4;puff(g.pos.x,top+0.9,g.pos.z,2,0xcfe8ff,0.3);}}}
    const gr=g.wet?null:supportAt(g.pos.x,g.pos.z,g.pos.y);
    if(gr!==null){
      if(g.vy>0||g.pos.y>gr+0.01){g.fallTop=Math.max(g.fallTop??g.pos.y,g.pos.y);g.vy-=25*dt;g.pos.y+=g.vy*dt;if(g.pos.y<gr){g.pos.y=gr;g.vy=0;gobLand(g);}}
      else{g.vy=0;g.pos.y=Math.min(gr,g.pos.y+dt*8);g.fallTop=undefined;}
    }else if(g.wet)g.fallTop=undefined;   // (water breaks a fall)
    const sn=Math.sin(g.phase);
    g.legs[0].rotation.x=moving?sn*0.7:0;g.legs[1].rotation.x=moving?-sn*0.7:0;
    if(g.wet&&moving){g.arm.rotation.x=-1.6+sn*0.9;g.armL.rotation.x=-1.6-sn*0.9;}else if(g.armL.rotation.x<-1.2&&!g.fleeing&&!g.special)g.armL.rotation.x=0;
    gobRootPose(g,g.pos.y+(moving?Math.abs(sn)*0.05:0),dt);
    g.head.rotation.z=Math.sin(g.t*2+g.heading)*0.08;
  });
}

