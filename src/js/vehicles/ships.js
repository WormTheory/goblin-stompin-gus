// ---- Ships with insides you can walk round (the aircraft carrier's groundwork; a test barge for now). A ship's blocks
// aren't in the sea where it floats: they're kept far out in the world store, in a 'pocket' of their own (SHIP_X0 on, one
// SHIP_SLOT of z per ship, set up in world/places.js), where they never move. Anyone aboard is really standing in that
// pocket, so walking, climbing, smashing, goblins' routes and saved edits all work on its blocks just as anywhere else, and
// riding along as it sails and turns costs nothing: the pocket stays still and the ship's picture (S.grp, turned and moved
// to where it is, with the pocket's chunks hung off it) is what moves. Coming within SHIP_M of its hull you're moved into
// the pocket, and going further than that from it you're moved back out; the camera, goblins' drawing and the dust and
// rubble are put back where the ship really is when they're drawn. ----
const SHIP_M=3,SHIP_BAND=SHIP_M+5;   // (how close to the hull you're taken aboard; the pocket's water reaches a little past that)
const _sv={x:0,z:0};
let shipN=0;   // (how many ships there are: nothing here costs anything without one)
// the test barge: a flat steel pontoon with a plank deck and a rail, a two-storey wheelhouse at the stern with stairs up
// to its roof, the helm inside its front window, crates on the foredeck and a swim platform off the stern to climb out on
// (two steps, the first just under the water's surface, so a swimmer walks straight up them).
// u runs across (port to starboard), w along (stern to bow: the way it goes), y as in the world
function bargeBlock(u,y,w){
  if(w===-17)return u>=-3&&u<=2&&y===G-2?METAL:0;   // (the swim platform: a step up out of the water, then another)
  if(w===-16)return u>=-3&&u<=2&&(y===G-2||y===G-1)?METAL:0;
  if(y===G-2||y===G-1)return METAL;
  if(y===G)return PLANKS;
  const edge=u===-6||u===5||w===-15||w===14;
  if(y===G+1&&edge){if(w===-15&&u>=-3&&u<=2)return 0;if((u===-6||u===5)&&w>=4&&w<=6)return 0;return FENCE;}   // (gaps in the rail: over the swim platform, and a gangway each side)
  if(u>=-4&&u<=3&&w>=-12&&w<=-4&&y>=G+1&&y<=G+6){
    if(y===G+6)return u>=-3&&u<=-2&&w===-6?stairId(2,1):u>=-3&&u<=-2&&w>=-11&&w<=-7?0:METAL;   // (the roof, its top step, and a hole over the stairs)
    if(u===-4||u===3||w===-12||w===-4){
      if(w===-12&&u>=-1&&u<=1&&y<=G+4)return 0;   // (the door in the back)
      if(u===3&&w>=-10&&w<=-8&&y<=G+4)return 0;   // (and one in the starboard side)
      if(y>=G+3&&y<=G+4&&(w===-4||w!==-12&&(u===-4||u===3)&&(w===-6||w===-5)))return GLASS;
      return PAINT_WHITE;}
    if(u>=-3&&u<=-2&&w>=-11&&w<=-6&&y===G+12+w)return stairId(2,1);   // (steel stairs up the port wall to the roof, two wide: Gus is broad)
    if(w===-5&&u>=0&&u<=1&&y===G+1)return SCREEN;   // (the helm's console)
    return 0;}
  if(y===G+7&&u>=-4&&u<=3&&w>=-12&&w<=-4&&(u===-4||u===3||w===-12||w===-4)&&!(w===-12&&u>=-1&&u<=1))return FENCE;   // (the roof's rail)
  if(y>=G+1&&y<=G+2&&u>=-2&&u<=1&&w>=4&&w<=7&&!(y===G+2&&(u===1||w===7)))return CRATE;
  return 0;
}
// a kind of ship: its footprint (u0..u1, w0..w1, whole blocks), its blocks, where the helm is stood at (pocket offsets,
// facing +w), and how it handles
const SHIP_KINDS={
  barge:{name:'barge',u0:-6,u1:5,w0:-17,w1:14,block:bargeBlock,helm:[1,G+1,-5.5],hy:8,top:7,acc:0.35,turn:0.3,hp:200},
};
// which ship's pocket (x,z) is in (null out in the world, or in a slot with no ship)
const shipOfPos=(x,z)=>x>=SHIP_X0?SHIPS[Math.floor(z/SHIP_SLOT)]||null:null;
const shipOf=o=>shipOfPos(o.pos.x,o.pos.z);
// pocket to world and back (out: an {x,z}). The ship's yaw turns its +w the way a heading does: (sin, cos)
function shipToWorld(S,x,z,out){const dx=x-S.ox,dz=z-S.oz,c=Math.cos(S.yaw),s=Math.sin(S.yaw);out.x=S.x+dx*c+dz*s;out.z=S.z-dx*s+dz*c;return out;}
function worldToShip(S,x,z,out){const dx=x-S.x,dz=z-S.z,c=Math.cos(S.yaw),s=Math.sin(S.yaw);out.x=S.ox+dx*c-dz*s;out.z=S.oz+dx*s+dz*c;return out;}
// where a player really is, out in the world (aboard a ship, or not)
const pwx=p=>{const S=shipOf(p);return S?shipToWorld(S,p.pos.x,p.pos.z,_sv).x:p.pos.x;};
const pwz=p=>{const S=shipOf(p);return S?shipToWorld(S,p.pos.x,p.pos.z,_sv).z:p.pos.z;};
// the group a pocket chunk's meshes hang off (meshing.js)
function shipPg(cz){const S=SHIPS[Math.floor(cz*CS/SHIP_SLOT)];return S?S.pg:null;}
// a pocket chunk: the ship's blocks, and round its hull, out to SHIP_BAND, water up to the sea's surface (so anyone
// taken aboard while swimming is still swimming). Everywhere else in the pocket is air
function shipChunk(cx,cz){
  const a=new Uint8Array(CS*CS*H),x0=cx*CS,z0=cz*CS,S=SHIPS[Math.floor(z0/SHIP_SLOT)];
  if(S){const K=S.K;
    for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const u=x0+lx-S.ox,w=z0+lz-S.oz;
      if(u<K.u0-SHIP_BAND||u>K.u1+SHIP_BAND||w<K.w0-SHIP_BAND||w>K.w1+SHIP_BAND)continue;
      const inF=u>=K.u0&&u<=K.u1&&w>=K.w0&&w<=K.w1;
      for(let y=0;y<H;y++){let b=inF?K.block(u,y,w):0;if(!b&&y<G)b=WATER;if(b)a[li(lx,y,lz)]=b;}}}
  const ce=chunkEdits.get(ckey(cx,cz));
  if(ce)for(const [x,y,z,b] of ce)a[li(x-x0,y,z-z0)]=b;
  return a;
}
// the pocket chunks a ship covers (its footprint, the water round it and a chunk more for the meshes' edges)
function shipChunkBox(S){const K=S.K,b=SHIP_BAND+1;
  return[Math.floor((S.ox+K.u0-b)/CS),Math.floor((S.ox+K.u1+b)/CS),Math.floor((S.oz+K.w0-b)/CS),Math.floor((S.oz+K.w1+b)/CS)];}
// every ship's chunks drawn (from updateChunks): only a dozen or so a ship, so all at once
function shipChunks(){
  if(!shipN)return;
  for(const S of SHIPS){if(!S)continue;const [a,b,c,d]=shipChunkBox(S);
    for(let cx=a;cx<=b;cx++)for(let cz=c;cz<=d;cz++)if(!meshes.has(ckey(cx,cz)))buildChunk(cx,cz);}
}
// a slot's blocks forgotten: its chunks, their meshes, and anything smashed there (a new ship there starts whole)
function shipForget(slot){
  const z0=slot*SHIP_SLOT,z1=z0+SHIP_SLOT,c0=Math.floor(z0/CS),c1=Math.floor((z1-1)/CS);
  for(const [k,e] of meshes)if(e.cx>=SHIP_CX0&&e.cz>=c0&&e.cz<=c1){for(const m of e.m){if(m.parent)m.parent.remove(m);m.geometry.dispose();}meshes.delete(k);rebuildQ.delete(k);}
  for(const k of [...chunks.keys()]){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cx>=SHIP_CX0&&cz>=c0&&cz<=c1)chunks.delete(k);}
  for(const k of [...chunkEdits.keys()]){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cx>=SHIP_CX0&&cz>=c0&&cz<=c1)chunkEdits.delete(k);}
  for(const k in edits){const i=k.indexOf(','),j=k.lastIndexOf(','),x=+k.slice(0,i),z=+k.slice(j+1);if(x>=SHIP_X0&&z>=z0&&z<z1)delete edits[k];}
  lastK=-1;
}
// a new ship, at x,z in the world facing yaw, in the first free slot of the pocket
function makeShip(kind,x,z,yaw){
  let slot=0;while(SHIPS[slot])slot++;
  const K=SHIP_KINDS[kind],grp=new THREE.Group(),pg=new THREE.Group();
  shipForget(slot);
  const S={isShip:true,kind,K,slot,ox:SHIP_X0+SHIP_SLOT/2,oz:slot*SHIP_SLOT+SHIP_SLOT/2,x,z,yaw,sp:0,hp:K.hp,dead:false,drv:null,grp,pg,V:null};
  pg.position.set(-S.ox,0,-S.oz);grp.add(pg);grp.position.set(x,0,z);grp.rotation.y=yaw;scene.add(grp);grp.updateMatrixWorld(true);
  SHIPS[slot]=S;shipN++;
  return S;
}
// a ship gone (cleared away): anyone aboard is put back in the sea where they were, and its pocket forgotten
function shipDrop(S){
  if(SHIPS[S.slot]!==S)return;
  for(const p of players){if(p.drv&&p.drv.o===S)drvExit(p);if(shipOf(p)===S)shipMove(p,S,false,true);}
  for(const g of goblins)if(g.state!=='wait'&&shipOf(g)===S)shipMove(g,S,false,false);
  scene.remove(S.grp);SHIPS[S.slot]=null;shipN--;shipForget(S.slot);
}
// is there room for the ship (and the water round it) at x,z facing yaw? Open sea under every edge, a little out past it
function shipFits(S,x,z,yaw){
  const K=S.K,m=SHIP_M+2,u0=K.u0-m,u1=K.u1+1+m,w0=K.w0-m,w1=K.w1+1+m,c=Math.cos(yaw),s=Math.sin(yaw);
  const ok=(u,w)=>{const X=x+u*c+w*s,Z=z-u*s+w*c;if(!chunks.has(ckey(Math.floor(X/CS),Math.floor(Z/CS))))return false;
    return get(X,G-1,Z)===WATER&&!solidAt(X,G,Z)&&!solidAt(X,G+1,Z);};
  for(let u=u0;u<=u1;u+=3)if(!ok(u,w0)||!ok(u,w1))return false;
  for(let w=w0;w<=w1;w+=3)if(!ok(u0,w)||!ok(u1,w))return false;
  return ok(u1,w1);
}
// each ship's step (from updateVenues): driven from the helm, W/S the throttle, A/D the rudder (which only bites with
// way on); it stops dead short of shallow water
function updateShips(V,dt){
  for(const S of V.ships){
    const K=S.K,i=S.drv?drvIn(S.drv):null,thr=i?-i.z:0,st=i?-i.x:0;
    const want=thr>0.1?K.top*thr:thr<-0.1?-K.top*0.4*-thr:0;
    S.sp+=(want-S.sp)*Math.min(1,dt*K.acc);
    const ny=S.yaw+st*K.turn*Math.max(-1,Math.min(1,S.sp/3))*dt,nx=S.x+Math.sin(ny)*S.sp*dt,nz=S.z+Math.cos(ny)*S.sp*dt;
    if(Math.abs(S.sp)>0.01||ny!==S.yaw){if(shipFits(S,nx,nz,ny)){S.x=nx;S.z=nz;S.yaw=ny;}else{if(Math.abs(S.sp)>2)thud(0.5);S.sp*=-0.2;}}
    if(S.drv&&i.bitePress){S.hornT=(S.hornT||0);if(S.hornT<=0){horn(0.1);S.hornT=0.6;}}S.hornT=(S.hornT||0)-dt;
    S.grp.position.set(S.x,0,S.z);S.grp.rotation.y=S.yaw;S.grp.updateMatrixWorld(true);
  }
}
// ---- getting aboard and off: anyone within SHIP_M of a ship's hull is moved into its pocket, turned to match it; anyone
// further than that from it (a little further, so nobody flickers between the two at the edge) back out ----
// a horizontal vector (or heading) turned by a: the way a ship's yaw turns its own
const shipRot=(o,kx,kz,a)=>{const x=o[kx],z=o[kz];if(x===undefined||z===undefined)return;const c=Math.cos(a),s=Math.sin(a);o[kx]=x*c+z*s;o[kz]=-x*s+z*c;};
// the models that stand for a player, hung off the ship's picture while they're aboard (so they're drawn where it is)
function shipParent(p,S){const par=S?S.pg:scene;for(const o of [p.root,p.pool,p.gb&&p.gb.root])if(o&&o.parent!==par)par.add(o);}
function shipMove(o,S,into,isP){
  const P=o.pos,t=(into?worldToShip:shipToWorld)(S,P.x,P.z,_sv),a=into?-S.yaw:S.yaw;
  if(into){   // (never into the hull: up on to whatever's above, or not aboard yet)
    let y=P.y,ok=false;for(let k=0;k<10;k++){if(!solidAt(t.x,Math.floor(y+0.2),t.z)&&!solidAt(t.x,Math.floor(y+1.2),t.z)){ok=true;break;}y=Math.floor(y+0.2)+1;}
    if(!ok)return false;P.y=y;}
  P.x=t.x;P.z=t.z;o.heading+=a;
  if(o.kv)shipRot(o.kv,'x','z',a);
  if(isP){o.cam.yaw+=a;shipRot(o,'mvx','mvz',a);shipRot(o,'bvx','bvz',a);o.bsx=P.x;o.bsz=P.z;o.standCar=null;
    if(o.vcl){o.vcl=null;if(o.state==='climb')o.state='walk';}if(o.drvYaw!==undefined)o.drvYaw+=a;shipParent(o,into?S:null);}
  else{o.act=null;o.wt=null;o.path=null;o.fallTop=undefined;o.standCar=null;}
  return true;
}
function shipCross(o,isP){
  const P=o.pos;
  if(P.x>=SHIP_X0){const S=shipOfPos(P.x,P.z);if(!S)return;const K=S.K,m=SHIP_M+1.5,u=P.x-S.ox,w=P.z-S.oz;
    if(u<K.u0-m||u>K.u1+1+m||w<K.w0-m||w>K.w1+1+m)shipMove(o,S,false,isP);return;}
  for(const S of SHIPS){if(!S)continue;const K=S.K,t=worldToShip(S,P.x,P.z,_sv),u=t.x-S.ox,w=t.z-S.oz;
    if(u>=K.u0-SHIP_M&&u<=K.u1+1+SHIP_M&&w>=K.w0-SHIP_M&&w<=K.w1+1+SHIP_M&&P.y>G-24){shipMove(o,S,true,isP);return;}}
}
// every step, once everything's moved (players at the controls stay where their seat is)
function shipCrossAll(){
  // (anyone left in a pocket with no ship there, its ship gone: players back to solid ground, goblins away)
  for(const p of players)if(p.active&&p.pos.x>=SHIP_X0&&!shipOf(p)){if(p.drv)drvExit(p);placePlayer(p,new V3(10.5,G+1,10.5));shipParent(p,null);}
  for(const g of goblins)if(g.state!=='wait'&&g.pos.x>=SHIP_X0&&!shipOf(g)){g.state='wait';g.t=0;g.root.visible=false;}
  if(!shipN)return;
  for(const p of players)if(p.active&&!p.drv)shipCross(p,true);
  for(const g of goblins)if(g.state!=='wait')shipCross(g,false);
}
// a goblin's step, with every player not where it is (one aboard a ship with it out in the sea, or the other way round)
// shown to it where they really are, put into its own frame: so it chases them, swims out to the ship and climbs aboard
// (from updateGoblins)
function shipSees(g,fn){
  if(!shipN){fn();return;}
  const Sg=shipOf(g);let sw=null;
  for(const p of players){if(!p.active)continue;const Sp=shipOf(p);if(Sp===Sg)continue;
    (sw||(sw=[])).push(p,p.pos.x,p.pos.z);
    if(Sp){shipToWorld(Sp,p.pos.x,p.pos.z,_sv);p.pos.x=_sv.x;p.pos.z=_sv.z;}
    if(Sg){worldToShip(Sg,p.pos.x,p.pos.z,_sv);p.pos.x=_sv.x;p.pos.z=_sv.z;}}
  try{fn();}finally{if(sw)for(let i=0;i<sw.length;i+=3){const p=sw[i];p.pos.x=sw[i+1];p.pos.z=sw[i+2];}}
}
// fn run with every player aboard a ship moved, for its length, to where they really are (the far city, the map, the
// clouds: anything that's about the world round them rather than the blocks under their feet)
function shipView(fn){
  if(!shipN){fn();return;}
  let sw=null;for(const p of players){const S=shipOf(p);if(!S)continue;(sw||(sw=[])).push(p,p.pos.x,p.pos.z);shipToWorld(S,p.pos.x,p.pos.z,_sv);p.pos.x=_sv.x;p.pos.z=_sv.z;}
  try{fn();}finally{if(sw)for(let i=0;i<sw.length;i+=3){const p=sw[i];p.pos.x=sw[i+1];p.pos.z=sw[i+2];}}
}
// the camera, placed in the pocket by the usual code, put where that is on the ship (after placeCamera)
function shipCam(p){
  const S=shipOf(p)||p.drv&&p.drv.k==='ship'&&p.drv.o;if(!S||!S.isShip)return;
  const c=p.camera.position;shipToWorld(S,c.x,c.z,_sv);c.x=_sv.x;c.z=_sv.z;p.camera.rotation.y+=S.yaw;
}
// a goblin's model aboard: worked out as if it hung off the ship's picture (street goblins aren't in the scene; batDraw)
function shipGobMatrix(g){
  const S=g.pos.x>=SHIP_X0&&shipOf(g),r=g.root;
  if(!S){r.updateMatrixWorld(true);return;}
  r.parent=S.pg;try{r.updateMatrixWorld(true);}finally{r.parent=null;}
}
// a box of dust or rubble in a pocket, put where that is on the ship (fxPut: e is its instance matrix, at j)
function shipFx(e,j){
  const S=shipOfPos(e[j+12],e[j+14]);if(!S)return;const c=Math.cos(S.yaw),s=Math.sin(S.yaw);
  for(const o of [0,4,8]){const x=e[j+o],z=e[j+o+2];e[j+o]=x*c+z*s;e[j+o+2]=-x*s+z*c;}
  shipToWorld(S,e[j+12],e[j+14],_sv);e[j+12]=_sv.x;e[j+14]=_sv.z;
}
// ---- at the helm (driving.js): stood within reach of it, aboard, the use button takes the controls ----
function shipHelm(p){
  const S=shipOf(p);if(!S||S.drv||S.dead)return null;const h=S.K.helm,d=Math.hypot(p.pos.x-(S.ox+h[0]),p.pos.z-(S.oz+h[2]));
  return d<1.7&&Math.abs(p.pos.y-h[1])<1.3?{d,D:{k:'ship',o:S,V:S.V}}:null;
}
// the ship as drvPose gives it, in its own pocket (so the chase camera and the like work on its blocks)
function shipPose(S){const K=S.K;return{x:S.ox+(K.u0+K.u1+1)/2,y:G+1,z:S.oz+(K.w0+K.w1+1)/2,h:0,hx:(K.u1+1-K.u0)/2,hz:(K.w1+1-K.w0)/2,hy:K.hy,v:S.sp};}
// stood at the helm, facing the bow, while driving (drvSeat); and left standing there on letting go (drvExit)
function shipSeat(p,S){const h=S.K.helm;p.pos.set(S.ox+h[0],h[1],S.oz+h[2]);p.heading=0;p.vy=0;p.grounded=true;p.mvx=p.mvz=0;p.standCar=null;p.vcl=null;p.peakY=p.pos.y;p.biteT=0;shipParent(p,S);}
function shipLeave(p,S){shipSeat(p,S);p.state='walk';p.t=0;p.heading=p.cam.yaw+Math.PI;p.cam.pitch=camPitch(p.cam.pitch,p);}
// ---- the Testing Environment's sea: a square of deep water ahead of Gus, made the first time a ship's spawned and kept
// with the world (TENV.sea, in blocks) ----
const SEA_DEEP=16;
function seaHas(cx,cz){const R=TENV.sea,x0=cx*CS,z0=cz*CS;return x0+CS>R.x0&&x0<R.x1&&z0+CS>R.z0&&z0<R.z1;}
function seaChunk(cx,cz){
  const a=new Uint8Array(CS*CS*H),x0=cx*CS,z0=cz*CS,R=TENV.sea;
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const x=x0+lx,z=z0+lz,wet=x>=R.x0&&x<R.x1&&z>=R.z0&&z<R.z1;
    if(!wet){for(let y=0;y<G;y++)a[li(lx,y,lz)]=earthAt(x,y,z);a[li(lx,G,lz)]=GRASS;continue;}
    for(let y=0;y<G-SEA_DEEP;y++)a[li(lx,y,lz)]=earthAt(x,y,z);a[li(lx,G-SEA_DEEP,lz)]=SAND;for(let y=G-SEA_DEEP+1;y<G;y++)a[li(lx,y,lz)]=WATER;}
  const ce=chunkEdits.get(ckey(cx,cz));
  if(ce)for(const [x,y,z,b] of ce)a[li(x-x0,y,z-z0)]=b;
  if(WX.frozen)freezeArr(a,true);
  return a;
}
// the sea's chunks made again (and redrawn) once it's been laid out
function seaRebuild(){const R=TENV.sea,set=new Set();
  for(let cx=Math.floor(R.x0/CS)-1;cx<=Math.floor((R.x1-1)/CS)+1;cx++)for(let cz=Math.floor(R.z0/CS)-1;cz<=Math.floor((R.z1-1)/CS)+1;cz++){const k=ckey(cx,cz);chunks.delete(k);set.add(k);}
  lastK=-1;rebuildSet(set);chunkScan.key='';}
// a barge: on the sea ahead of Gus (a sea made first if there isn't one), pointing the way he's looking, empty, to walk
// aboard and drive from its helm. Ships are kept in a venue of their own, 'tenvShips'
function tenvShip(kind){
  if(!TENV){tsSet('Ships can only be spawned in the Testing Environment for now.');return;}
  const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  const px=pwx(p),pz=pwz(p),yaw=(p.cam.yaw+Math.PI)+(shipOf(p)?shipOf(p).yaw:0),fx=Math.sin(yaw),fz=Math.cos(yaw);
  if(!TENV.sea){const cx=Math.round(px+fx*184),cz=Math.round(pz+fz*184);TENV.sea={x0:cx-160,x1:cx+160,z0:cz-160,z1:cz+160};seaRebuild();updateChunks(999,0);save();}
  const R=TENV.sea,S=makeShip(kind,0,0,yaw);let ok=false;
  // (the nearest open water straight ahead, else anywhere in the sea nearest him)
  for(let d=40;d<=420&&!ok;d+=6)for(const side of [0,-12,12,-30,30]){const x=px+fx*d-fz*side,z=pz+fz*d+fx*side;
    if(x<R.x0||x>R.x1||z<R.z0||z>R.z1)continue;for(let cx=Math.floor((x-40)/CS);cx<=Math.floor((x+40)/CS);cx++)for(let cz=Math.floor((z-40)/CS);cz<=Math.floor((z+40)/CS);cz++)chunkArr(cx,cz);
    if(shipFits(S,x,z,yaw)){S.x=x;S.z=z;ok=true;break;}}
  if(!ok){scene.remove(S.grp);SHIPS[S.slot]=null;shipN--;tsSet('No room on the sea for a '+S.K.name+' just there.');return;}
  S.grp.position.set(S.x,0,S.z);S.grp.updateMatrixWorld(true);
  let V=venues.get('tenvShips');if(!V){V={kind:'ship',ships:[]};venues.set('tenvShips',V);}S.V=V;V.ships.push(S);
  shipChunks();
  tsSet('Spawned a '+S.K.name+' on the sea ahead of Gus. Swim out, climb aboard from the stern, and take the helm in the wheelhouse with '+keyLabel(BINDS.use.kb[0])+' (as Gnash or Grizzle).');
}
// cleared away (tenvClear), all but one being driven
function shipsClear(){const V=venues.get('tenvShips');if(!V)return;
  V.ships=V.ships.filter(S=>{if(players.some(q=>q.drv&&q.drv.o===S))return true;shipDrop(S);return false;});if(!V.ships.length)venues.delete('tenvShips');}
