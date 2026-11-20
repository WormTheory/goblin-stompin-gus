// ---- Ships with insides you can walk round (the aircraft carrier's groundwork; a test barge for now). A ship's blocks
// aren't in the sea where it floats: they're kept far out in the world store, in a 'pocket' of their own (SHIP_X0 on, one
// SHIP_SLOT of z per ship, set up in world/places.js), where they never move. Anyone aboard is really standing in that
// pocket, so walking, climbing, smashing, goblins' routes and saved edits all work on its blocks just as anywhere else, and
// riding along as it sails and turns costs nothing: the pocket stays still and the ship's picture (S.grp, turned and moved
// to where it is, with the pocket's chunks hung off it, laid out from the pocket's origin, and S.pg under it for anything
// placed in the pocket's own numbers, such as a player's model) is what moves. Coming within SHIP_M of its hull you're moved into
// the pocket, and going further than that from it you're moved back out; the camera, goblins' drawing and the dust and
// rubble are put back where the ship really is when they're drawn. ----
const SHIP_M=3,SHIP_BAND=SHIP_M+5;   // (how close to the hull you're taken aboard; the pocket's water reaches a little past that)
const _sv={x:0,z:0};
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
// a kind of ship: its footprint (u0..u1, w0..w1, whole blocks), its blocks (only asked for from y0 to y1, if given), where
// the helm is stood at (pocket offsets, facing +w), how it handles, its health, how far it goes down when it sinks, and the
// boxes that stand for it from outside (u0,u1,w0,w1,y0,y1 each). The aircraft carrier is added in carrier.js
const SHIP_KINDS={
  barge:{name:'barge',u0:-6,u1:5,w0:-17,w1:14,block:bargeBlock,helm:[1,G+1,-5.5],hy:8,top:7,acc:1.2,turn:0.3,yrk:1.2,hp:200,sc:800,sink:14,boxes:[[-6,5,-17,14,G-2,G+1]]},
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
// what a model made at x,z hangs off: the scene, or in a ship's pocket the ship's picture (laid out from the pocket's
// origin, so a falling piece of the island is drawn on the ship, going where it goes)
const shipPar=(x,z)=>{const S=x>=SHIP_X0?shipOfPos(x,z):null;return S?S.pg:scene;};
// the ship a pocket chunk belongs to (meshing.js: its meshes hang off S.grp, laid out from the pocket's origin)
function shipPg(cz){return SHIPS[Math.floor(cz*CS/SHIP_SLOT)]||null;}
// a pocket chunk: the ship's blocks, and round its hull, out to SHIP_BAND, water up to the sea's surface (so anyone
// taken aboard while swimming is still swimming). Everywhere else in the pocket is air
function shipChunk(cx,cz){
  const a=new Uint8Array(CS*CS*H),x0=cx*CS,z0=cz*CS,S=SHIPS[Math.floor(z0/SHIP_SLOT)];
  if(S){const K=S.K,ya=K.y0??0,yb=K.y1??H-1;
    for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const u=x0+lx-S.ox,w=z0+lz-S.oz;
      if(u<K.u0-SHIP_BAND||u>K.u1+SHIP_BAND||w<K.w0-SHIP_BAND||w>K.w1+SHIP_BAND)continue;
      const inF=u>=K.u0&&u<=K.u1&&w>=K.w0&&w<=K.w1;
      for(let y=0;y<H;y++){let b=inF&&y>=ya&&y<=yb?K.block(u,y,w):0;if(!b&&y<G)b=WATER;if(b)a[li(lx,y,lz)]=b;}}}
  const ce=chunkEdits.get(ckey(cx,cz));
  if(ce)for(const [x,y,z,b] of ce)a[li(x-x0,y,z-z0)]=b;
  return a;
}
// the pocket chunks a ship covers (its footprint, the water round it and a chunk more for the meshes' edges)
function shipChunkBox(S){const K=S.K,b=SHIP_BAND+1;
  return[Math.floor((S.ox+K.u0-b)/CS),Math.floor((S.ox+K.u1+b)/CS),Math.floor((S.oz+K.w0-b)/CS),Math.floor((S.oz+K.w1+b)/CS)];}
// every ship's chunks drawn (from updateChunks): a dozen or so for a barge, about sixty for the carrier, so a few
// milliseconds' worth a frame (all at once with all set)
function shipChunks(all){
  if(!shipN)return;const t0=performance.now();
  for(const S of SHIPS){if(!S)continue;const [a,b,c,d]=shipChunkBox(S);
    for(let cx=a;cx<=b;cx++)for(let cz=c;cz<=d;cz++)if(!meshes.has(ckey(cx,cz))){buildChunk(cx,cz);if(!all&&performance.now()-t0>8)return;}}
}
// a slot's blocks forgotten: its chunks, their meshes, and anything smashed there (a new ship there starts whole)
function shipForget(slot,keepEdits){
  const z0=slot*SHIP_SLOT,z1=z0+SHIP_SLOT,c0=Math.floor(z0/CS),c1=Math.floor((z1-1)/CS);
  for(const [k,e] of meshes)if(e.cx>=SHIP_CX0&&e.cz>=c0&&e.cz<=c1){for(const m of e.m){if(m.parent)m.parent.remove(m);m.geometry.dispose();}meshes.delete(k);rebuildQ.delete(k);}
  for(const k of [...chunks.keys()]){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cx>=SHIP_CX0&&cz>=c0&&cz<=c1)chunks.delete(k);}
  if(keepEdits){lastK=-1;return;}
  for(const k of [...chunkEdits.keys()]){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cx>=SHIP_CX0&&cz>=c0&&cz<=c1)chunkEdits.delete(k);}
  for(const k in edits){const i=k.indexOf(','),j=k.lastIndexOf(','),x=+k.slice(0,i),z=+k.slice(j+1);if(x>=SHIP_X0&&z>=z0&&z<z1)delete edits[k];}
  lastK=-1;
}
// a new ship, at x,z in the world facing yaw, in the first free slot of the pocket (o: an online guest's copy of one of
// the host's, {slot,n,keep}: in the host's slot under the host's number, keep leaving what's smashed there alone, net-sync.js)
function makeShip(kind,x,z,yaw,Kw,o){
  let slot=0;while(SHIPS[slot])slot++;if(o)slot=o.slot;
  const K=Kw||SHIP_KINDS[kind],grp=new THREE.Group(),pg=new THREE.Group();   // (Kw: a kind of its own, a wreck broken off one: ship-break.js)
  shipForget(slot,o&&o.keep);
  const S={isShip:true,n:o?o.n:++shipSerial,net:!!o,kind,K,slot,ox:SHIP_X0+SHIP_SLOT/2,oz:slot*SHIP_SLOT+SHIP_SLOT/2,x,z,yaw,sp:0,ord:0,rud:0,yr:0,telD:0,telT:0,groundT:0,hp:K.hp,dead:false,deadT:0,sk:0,leak:0,drv:null,grp,pg,V:null,bx:null};
  pg.position.set(-S.ox,0,-S.oz);pg.shipPg=true;grp.add(pg);grp.position.set(x,0,z);grp.rotation.y=yaw;scene.add(grp);grp.updateMatrixWorld(true);
  SHIPS[slot]=S;shipN++;shipHullInit(S);shipPropsDraw(S);shipCrewInit(S);shipJetsInit(S);
  return S;
}
let shipSerial=0;   // (each ship's own number: a new one in an old one's slot isn't taken for it)
// a ship gone (cleared away): anyone aboard is put back in the sea where they were, and its pocket forgotten
function shipDrop(S){
  if(SHIPS[S.slot]!==S)return;
  for(const p of players){if(p.drv&&(p.drv.o===S||p.drv.o.S===S))drvExit(p);if(shipOf(p)===S)shipMove(p,S,false,true);}
  for(const g of goblins)if(g.state!=='wait'&&shipOf(g)===S)shipMove(g,S,false,false);
  shipVehEach((o,P)=>{if(shipOfPos(P.x,P.z)===S)shipVehMove(o,S,false);});shipJetsDrop(S);
  if(S.pm)for(const m of S.pm)if(m.dispose)m.dispose();
  scene.remove(S.grp);SHIPS[S.slot]=null;shipN--;shipForget(S.slot);
}
// is there room for the ship (and the water round it) at x,z facing yaw? Open sea under every edge, a little out past it
function shipFits(S,x,z,yaw){
  const K=S.K,m=SHIP_M+2,u0=K.u0-m,u1=K.u1+1+m,w0=K.w0-m,w1=K.w1+1+m,c=Math.cos(yaw),s=Math.sin(yaw);
  const ok=(u,w)=>{const X=x+u*c+w*s,Z=z-u*s+w*c;chunkArr(Math.floor(X/CS),Math.floor(Z/CS));   // (made now if it's past what's loaded: a big ship's bow can be further off than the view reaches)
    return get(X,G-1,Z)===WATER&&!solidAt(X,G,Z)&&!solidAt(X,G+1,Z);};
  for(let u=u0;u<=u1;u+=3)if(!ok(u,w0)||!ok(u,w1))return false;
  for(let w=w0;w<=w1;w+=3)if(!ok(u0,w)||!ok(u1,w))return false;
  return ok(u1,w1);
}
// each ship's step (from updateVenues): driven from the helm (shipHelmIn, shipDrive)
function updateShips(V,dt){
  for(const S of [...V.ships]){
    // (an online guest's copy: the host's snapshots place it, sink it and drop it, net-sync.js; here only its props)
    if(S.net){if(S.propsT>0&&(S.propsT-=dt)<=0)shipPropsDraw(S);shipPropsFall(S,dt);mountsFall(S,dt);continue;}
    if(S.dead){shipSinking(S,V,dt);continue;}
    if(S.leak&&!S.hull&&!drvSafe(S))S.hp-=S.leak*SHIP_LEAK*dt;   // (one that breaks up only floods where it's holed: ship-break.js)
    if(S.hp<=0){shipSink(S);continue;}
    if(S.hull&&S.hull.brk&&shipBreakCheck(S))continue;
    shipHelmIn(S,dt);shipDrive(S,dt);
    S.grp.position.set(S.x,0,S.z);S.grp.rotation.y=S.yaw;S.grp.updateMatrixWorld(true);
    shipBoxes(S);if(S.propsT>0&&(S.propsT-=dt)<=0)shipPropsDraw(S);shipPropsFall(S,dt);mountsFall(S,dt);shipCrewTick(S,dt);shipJetsTick(S,dt);
  }
}
// ---- driving from the bridge. W and S ring the engine telegraph up and down its orders, one a press (held, on down
// them every so often); the ship's way builds toward the order slowly, over many seconds, and falls off as slowly. A and
// D put the rudder over a little at a time, and it stays where it's left (climb, C, brings it back amidships). The rudder
// only bites with way on, and the turn builds up slowly and keeps going while it's over. Into water too shallow for it,
// it runs aground: grinds to a stop, hurt by how fast it was going. K.acc is how quickly its speed changes (a second, a
// second), K.turn its fastest turn (with the rudder hard over at speed), K.yrk how quickly a turn builds or comes off ----
const SHIP_ORDERS=[['Back full',-0.45],['Back 1/3',-0.18],['Stop',0],['Ahead 1/3',0.3],['Ahead 2/3',0.55],['Ahead full',0.8],['Flank',1]];
const SHIP_KN=4;   // (knots on the display, a block a second: flank is about a real carrier's 33 knots)
const shipOrder=S=>SHIP_ORDERS[S.ord+2];
function shipHelmIn(S,dt){
  const i=S.drv?drvIn(S.drv):null;if(!i){S.telD=0;return;}
  const thr=-i.z,st=-i.x,d=thr>0.5?1:thr<-0.5?-1:0;
  if(d){if(S.telD!==d||(S.telT-=dt)<=0){const o=Math.max(-2,Math.min(4,S.ord+d));S.telT=S.telD===d?0.4:0.7;S.telD=d;
    if(o!==S.ord){S.ord=o;shipBell(S);}}}else S.telD=0;
  if(Math.abs(st)>0.2)S.rud=Math.max(-1,Math.min(1,S.rud+st*dt*0.55));
  if(i.climb&&S.rud)S.rud-=Math.sign(S.rud)*Math.min(Math.abs(S.rud),dt*1.2);
  if(i.bitePress&&!(S.hornT>0)){horn(0.1);S.hornT=0.6;}
  if(i.seAnchorP){S.anchor=!S.anchor;if(audio)sfx('Anchor',()=>{noise(1.6,0.2,200,'lowpass');clang();});flashLabel(S.anchor?'Anchor down: the engines are held':'Anchor up',S.drv);if(S.anchor)S.anT=(S.rud||(Math.random()<0.5?-1:1))>0?1:-1;}
}
// the telegraph's bell, rung on the bridge for each new order (lower for one astern)
function shipBell(S){sfx('Ship telegraph',()=>{const f=S.ord<0?990:1320;tone('triangle',f,f-20,0.35,0.05);tone('sine',f*1.5,f*1.5-30,0.25,0.02);});}
function shipDrive(S,dt){
  const K=S.K,want=S.anchor?0:shipOrder(S)[1]*K.top,a=K.acc*(Math.abs(want)<Math.abs(S.sp)||want*S.sp<0?1.3:1)*dt;   // (it loses way a little quicker than it gathers it)
  S.sp+=Math.max(-a,Math.min(a,want-S.sp));if(!want&&Math.abs(S.sp)<0.02)S.sp=0;
  if(S.anchor)S.sp*=Math.exp(-dt*0.35);   // (the anchor dragging: it stops far sooner than it would)
  const bite=Math.max(-1,Math.min(1,S.sp/(K.top*0.35))),rud=S.anchor?S.anT*Math.min(1,Math.abs(S.sp)/(K.top*0.15)):S.rud;S.yr+=(rud*K.turn*bite-S.yr)*Math.min(1,dt*K.yrk);
  S.hornT=(S.hornT||0)-dt;if(S.groundT>0)S.groundT-=dt;
  if(Math.abs(S.sp)<0.005&&Math.abs(S.yr)<1e-5)return;
  const ny=S.yaw+S.yr*dt,nx=S.x+Math.sin(ny)*S.sp*dt,nz=S.z+Math.cos(ny)*S.sp*dt;
  if(shipFits(S,nx,nz,ny)){S.x=nx;S.z=nz;S.yaw=ny;return;}
  // (no room to swing: straight on, if there's room for that)
  const sx=S.x+Math.sin(S.yaw)*S.sp*dt,sz=S.z+Math.cos(S.yaw)*S.sp*dt;if(Math.abs(S.yr)>1e-5&&shipFits(S,sx,sz,S.yaw)){S.x=sx;S.z=sz;S.yr=0;return;}
  shipAground(S);
}
// run aground: stopped dead, the engines rung down to stop, and hurt by how hard it hit (at top speed about a sixteenth
// of its health; the carrier, only sunk by wrecking it, takes nothing from it). A scrape at a crawl does nothing
function shipAground(S){
  const K=S.K,v=Math.abs(S.sp),fwd=S.sp>=0;S.sp=0;S.yr=0;S.ord=0;S.telD=0;
  if(v<0.6||S.groundT>0)return;S.groundT=1;
  const n=Math.round(v*v*K.hp/1000),w=fwd?K.w1:K.w0,c=shipToWorld(S,S.ox+(K.u0+K.u1+1)/2,S.oz+w+(fwd?1:0),{x:0,z:0});if(!K.wreck){S.hp-=n;dmgPop(c.x,G+4,c.z,n,'#ffb04a');}
  puff(c.x,G+1,c.z,14,0xc8b48a,2.2);puff(c.x,G+1,c.z,8,0xe8f4ff,1.4);
  const np=nearestPlayer(c.x,c.z,false),k=np?Math.max(0.15,1-np.d/220):0.15;
  sfx('Ship aground',()=>{noise(1.6,0.35*k,160,'lowpass');tone('sawtooth',62,30,1.4,0.12*k);thud(0.8*k);});
  const sh=Math.min(1.2,v*0.15);addShake(sh,c.x,c.z,K.hp>=1000?260:60);for(const p of players)if(p.active&&(shipOf(p)===S||p.drv&&p.drv.o===S))p.shake=Math.max(p.shake,sh);   // (everyone aboard feels it)
  if(S.drv)flashLabel('Run aground! Ring astern ('+actMark(S.drv,'back')+') to back off',S.drv);
}
// the helm's controls (the order rung, the speed and the rudder are on its instrument: inShip)
function shipHow(p,S){
  const A=id=>actMark(p,id);
  return actPair(p,'fwd','back')+' engine orders  ·  '+actPair(p,'left','right')+' rudder  ·  '+A('climb')+' rudder amidships  ·  '+A('seAnchor')+(S.anchor?' raise the anchor':' drop the anchor')+'  ·  '+A('weapon')+(p.shipBridge?' chase view':' bridge view')+'  ·  '+A('bite')+' horn  ·  ';
}
// the view from the bridge (the weapon button, while at the helm): from the helmsman's eyes, looking about with the
// mouse or stick as usual, in the ship's own frame (shipCam turns it with the ship)
function shipBridgeCam(p,S){
  const h=S.K.helm;p.camera.position.set(S.ox+h[0],h[1]+1.45,S.oz+h[2]+0.45);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);p.drvCamD=1;
  if(p.shake>0.002&&gameSpeed()>0){const c=p.camera.position;c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
}
function shipViewSwap(p){p.shipBridge=!p.shipBridge;p.drvLook=camClock;if(p.shipBridge){p.cam.yaw=Math.PI;p.cam.pitch=-0.08;}else{p.cam.yaw=Math.PI;p.cam.pitch=-0.25;}tone('square',660,640,0.05,0.02);}
// ---- a ship's health: blocks knocked out of it (holes below the waterline cost more, and let the sea in, which goes on
// costing it a little while they're there), and hits on it from outside (shells, rockets, blasts, rams: through the boxes
// that stand for it out in the world). At none it sinks, straight down, washing off everyone aboard as the water reaches
// them, and is gone ----
const SHIP_LEAK=0.04;   // (health a second for each hole below the waterline)
// the boxes that stand for a ship out in the world (in TRAIN_BOXES, so shots, blasts and other vehicles meet it: nobody
// stands on them, since anyone that close has been taken aboard)
function shipBoxes(S){
  const K=S.K;if(!K.boxes||S.brk&&S.brk.tilt)return;const tx=Math.sin(S.yaw),tz=Math.cos(S.yaw),sk=S.sk;   // (going down, still level: they go down with it, so the Mobile Gear stood on it rides it down too)
  if(!S.bx)S.bx=K.boxes.map((b,i)=>{const hx=(b[1]+1-b[0])/2,hz=(b[3]+1-b[2])/2;
    return{u:(b[0]+b[1]+1)/2,w:(b[2]+b[3]+1)/2,hx,hz,y0:b[4],y1:b[5],pr:{isTrain:true,isShipBox:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx,hz,hy:b[5]-b[4],heading:0,top:0,veh:'ship',T:S,i}};});
  for(const B of S.bx){const pr=B.pr,x=S.x+B.u*tz+B.w*tx,z=S.z-B.u*tx+B.w*tz;pr.pos.set(x,B.y0-sk,z);pr.heading=S.yaw;pr.top=B.y1-sk;pr.speed=S.sp;
    TRAIN_BOXES.push({x,z,tx,tz,y0:B.y0-sk,top:B.y1-sk,v:S.sp,hx:B.hx,hz:B.hz,proxy:pr});}
  mountBoxes(S);   // (its deck weapons: carrier-crew.js)
}
// hit from outside (trainHit): the number shown where it struck, on the piece it struck. A ship that's only sunk by
// wrecking it (K.wreck: the carrier) takes nothing from the hit itself, only from the blocks the blast knocks out of it
function shipHit(S,n,i){
  if(S.dead)return;const B=S.bx&&S.bx[i||0],P=B?B.pr.pos:null;if(!S.K.wreck&&!drvSafe(S))S.hp-=n;
  if(P&&!S.K.wreck){dmgPop(P.x,B.y1+2,P.z,Math.round(n),'#ffb04a');vHitFx(P.x,B.y1,P.z,n);}   // (the carrier: nothing, the hit's own blast and the holes it knocks show where it struck; its boxes are too big for their middles to mean anything)
}
// a block of a ship knocked out (setRaw, before it's written): its health down a little, and if it was below the waterline
// the sea comes in (the block becomes water). It sinks on its next step (updateShips), not in the middle of the smash
function shipDent(x,y,z,b){
  const S=shipOfPos(x,z);if(!S||S.dead||b!==AIR)return b;const o=rawGet(x,y,z);if(!o||o===WATER)return b;
  if(S.props&&!(S.propsT>0))S.propsT=0.3;   // (anything stood on it goes too: looked over a moment later, once the smash is done)
  const safe=drvSafe(S);   // (Invulnerability, at its helm: its blocks still go, but not its health)
  if(S.hull){if(!safe)shipHullDent(S,y,z);if(y<G){S.leak++;return WATER;}return b;}   // (one that breaks up: only its hull counts, ship-break.js)
  if(y<G){S.leak++;if(!safe)S.hp-=3;return WATER;}
  if(!safe)S.hp-=1;return b;
}
// ---- a ship's furniture and doors. Its props (K.props: [type, s, y, w, yaw, tint, cells], as props.js draws them) go in
// instanced boxes of the ship's own, hung off its pocket, so they're carried along with it and need drawing only once (and
// again when it's been smashed: a prop whose floor's gone goes with it). They're bolted down: nothing knocks them over,
// though goblins go round them (shipPropCells, from refreshProps). Its doors (K.doors) are the town's doors (doors-clocks.js),
// in its pocket: shipDoors lists them for refreshDoors, and their doors hang off the pocket too ----
function shipPropsDraw(S){
  const K=S.K;if(!K.props)return;S.propsT=0;
  if(!S.props)S.props=K.props().filter(q=>PROPS[q[0]]).map(q=>{const f={prop:true,S,type:q[0],x:S.ox-q[1]+.5,y0:q[2],z:S.oz+q[3]+.5,yaw:q[4],tint:q[5]||0x6b7780,rad:.5,gone:false,
    cells:(q[6]||[[q[1],q[3]]]).map(c=>[S.ox-Math.round(c[0])+.5,S.oz+Math.round(c[1])+.5])};f.sup=K.block(Math.floor(.5-q[1]),Math.floor(f.y0)-1,Math.floor(q[3]+.5));return f;});
  let nL=0,nG=0;for(const f of S.props)for(const q of PROPS[f.type])q[0]!==PT&&q[0]>=PG?nG++:nL++;
  if(!S.pm){S.pm=[new THREE.InstancedMesh(PROP_L.geometry,PROP_L.material,Math.max(1,nL)),new THREE.InstancedMesh(PROP_G.geometry,PROP_G.material,Math.max(1,nG))];
    for(const m of S.pm){m.setColorAt(0,_PC.setHex(0xffffff));m.frustumCulled=false;m.count=0;S.grp.add(m);}}   // (hung off the ship itself, laid out from the pocket's origin: half a million blocks out, they'd shake)
  const [ML,MG]=S.pm,A=_shA,B=_shB,C=_shC;let iL=0,iG=0;
  for(const f of S.props){
    if(!f.gone&&f.sup){const fx=Math.floor(f.x),fy=Math.floor(f.y0)-1,fz=Math.floor(f.z);if(chunks.has(ckey(Math.floor(fx/CS),Math.floor(fz/CS)))){const b=get(fx,fy,fz);if(b===AIR||b===WATER)f.gone=true;}}
    if(f.gone)continue;
    // (one going over, or down: tipped about its foot toward ang, as props.js tips one over)
    const ang=f.fall?f.fall.ang:f.down,theta=f.fall?Math.PI/2*0.97*Math.min(1,f.fall.t/0.7)**2:f.down!==undefined?Math.PI/2*0.97:0,flat=theta>0;
    C.makeRotationY(f.yaw);if(flat){_shV.set(Math.cos(ang),0,-Math.sin(ang));B.makeRotationAxis(_shV,theta);C.premultiply(B);}B.makeTranslation(f.x-S.ox,f.y0,f.z-S.oz);C.premultiply(B);
    for(const q of PROPS[f.type]){let c=q[0]===PT?f.tint:q[0],glow=c>=PG;if(glow&&flat){c=0x20262b;glow=false;}   // (a knocked-over machine's screen goes dark)
      A.makeTranslation(q[1],q[2],q[3]);B.makeScale(q[4],q[5],q[6]);A.multiply(B);A.premultiply(C);
      if(glow){MG.setMatrixAt(iG,A);MG.setColorAt(iG++,_PC.setHex(c-PG));}else{ML.setMatrixAt(iL,A);ML.setColorAt(iL++,_PC.setHex(c));}}}
  fxSent(ML,iL);fxSent(MG,iG);
}
const _shA=new THREE.Matrix4(),_shB=new THREE.Matrix4(),_shC=new THREE.Matrix4(),_shV=new THREE.Vector3();
// knocked over (knockProps, a goblin shoving past): it tips over about its foot, the way it was pushed, as a building's
// props do, and lies there; goblins step over it then. Each step any are still going over, the ship's props are drawn again
function shipKnock(f,dx,dz){
  if(f.gone||f.fall||f.down!==undefined)return false;const S=f.S;
  f.fall={t:0,ang:(dx||dz)?Math.atan2(dx,dz):Math.random()*Math.PI*2};S.propsFall=(S.propsFall||0)+1;
  tone('square',320,140,0.1,0.03);puff(f.x,f.y0+.5,f.z,2,0xbfc5ca,0.25);award(5,null,f.x,f.y0+1,f.z);
  for(const c of f.cells)propCells.delete(propCK(c[0],f.y0,c[1]));
  return true;
}
// knockProps in a ship's pocket: its props within r of x,z (and about level), knocked away from there
function shipKnockAt(x,y,z,r,dx,dz){const S=shipOfPos(x,z);if(!S||!S.props)return;
  for(const f of S.props){const ex=f.x-x,ez=f.z-z,rr=r+f.rad;if(ex*ex+ez*ez<rr*rr&&Math.abs(f.y0+.5-y)<r+1.5)shipKnock(f,dx||ex,dz||ez);}}
function shipPropsFall(S,dt){
  if(!S.propsFall)return;
  for(const f of S.props)if(f.fall&&(f.fall.t+=dt)>=0.7){f.down=f.fall.ang;f.fall=null;S.propsFall--;}
  shipPropsDraw(S);
}
// the cells the props of every ship stand in, for goblins to walk round (refreshProps clears them with the rest)
function shipPropCells(){
  for(const S of SHIPS)if(S&&S.props)for(const f of S.props)if(!f.gone&&!f.fall&&f.down===undefined)for(const c of f.cells)propCells.set(propCK(c[0],f.y0,c[1]),f);
}
// a ship's doors as refreshDoors has them (in its pocket), and whoever's looking, put in the ship's frame
function shipDoors(S){
  if(S._doors)return S._doors;const D=S.K.doors?S.K.doors():[];
  return S._doors=D.map(d=>d.ax==='w'?{ax:'z',a0:S.oz+d.a0,a1:S.oz+d.a1+1,c:S.ox-d.c,n:1,h:d.h,y:d.y,kind:'steel',slide:false,S,key:'ship'+S.n+':'+d.tag}
    :{ax:'x',a0:S.ox-d.a1,a1:S.ox-d.a0+1,c:S.oz+d.c,n:1,h:d.h,y:d.y,kind:'steel',slide:false,S,key:'ship'+S.n+':'+d.tag});
}
function shipDoorsSeen(p,fn){
  for(const S of SHIPS){if(!S||!S.K.doors)continue;let q;
    if(shipOf(p)===S)q=p;else if(p.pos.x<SHIP_X0){worldToShip(S,p.pos.x,p.pos.z,_sv);q={pos:{x:_sv.x,y:p.pos.y,z:_sv.z}};}else continue;
    for(const R of shipDoors(S))fn(R,q);}
}
// a smash out in the world (crush, crushBall, crushDisc, crushShape) that reaches a ship: done again in its pocket, where
// its blocks are, so a shell, a rocket or a blow from outside knocks holes in it as one from aboard does. fn gets the
// place in the pocket and a copy of opt with its push turned to match
function shipSmash(x,y,z,R,opt,fn){
  for(const S of SHIPS){if(!S||S.dead)continue;const K=S.K,t=worldToShip(S,x,z,_sv),u=t.x-S.ox,w=t.z-S.oz,Y=y+S.sk,m=R+1;
    if(u<K.u0-m||u>K.u1+1+m||w<K.w0-m||w>K.w1+1+m||Y<K.y0-m||Y>K.y1+m)continue;
    const o=Object.assign({},opt);shipRot(o,'dx','dz',-S.yaw);fn(t.x,Y,t.z,o,-S.yaw);}
}
function shipSink(S){
  if(S.dead)return;S.dead=true;S.deadT=0;S.hp=0;
  for(const p of players)if(p.drv&&p.drv.o===S)drvExit(p);
  const K=S.K,big=K.hp>=1000,c=shipToWorld(S,S.ox+(K.u0+K.u1+1)/2,S.oz+(K.w0+K.w1+1)/2,{x:0,z:0});
  blastFx(c.x,G+4,c.z,1,big?4:2);smoke(c.x,G+4,c.z,big?30:12,0x262626);noise(1.2,1,500,'lowpass');tone('sawtooth',55,14,1.4,.35);addShake(big?1:.5,c.x,c.z,big?120:40);
  award(K.sc||1000,'The '+K.name+' sunk',c.x,G+6,c.z);
  if(S.kind!=='wreck'&&VEHICLE_KINDS.ship.rampage)RAMP.cars++;   // (once a ship: not again for an end broken off it, see ship-break.js)
}
// going down: slowly at first, then faster, steam where the water meets it and smoke from it, everyone the water reaches
// washed off into the sea; gone once it's under
function shipSinking(S,V,dt){
  const K=S.K,T=K.hp>=1000?45:16;S.deadT+=dt;
  const k=Math.min(1,S.deadT/T);S.sk=K.sink*k*k;S.sp*=Math.exp(-dt*0.5);
  S.grp.position.set(S.x,-S.sk,S.z);S.grp.updateMatrixWorld(true);
  if(S.brk)shipWreckTilt(S,dt);   // (a wreck broken off one: level while anyone's on it, then tipping, ship-break.js)
  if(k<1)shipBoxes(S);
  if(Math.random()<dt*(K.hp>=1000?10:3)){shipToWorld(S,S.ox+K.u0+Math.random()*(K.u1+1-K.u0),S.oz+K.w0+Math.random()*(K.w1+1-K.w0),_sv);
    puff(_sv.x,G+1,_sv.z,2,0xcfe8ff,.8);if(k<0.6&&Math.random()<0.5)smoke(_sv.x,G+4,_sv.z,2,0x262626);}
  for(const p of players)if(p.active&&shipOf(p)===S&&p.pos.y-S.sk<G+0.3)shipMove(p,S,false,true);
  for(const g of goblins)if(g.state!=='wait'&&shipOf(g)===S&&g.pos.y-S.sk<G+0.3)shipMove(g,S,false,false);
  shipVehEach((o,P)=>{if(shipOfPos(P.x,P.z)===S&&P.y-S.sk<G+0.3)shipVehMove(o,S,false);});
  if(k>=1){const i=V.ships.indexOf(S);if(i>=0)V.ships.splice(i,1);shipDrop(S);if(!V.ships.length&&venues.get('tenvShips')===V)venues.delete('tenvShips');}
}
// ---- getting aboard and off: anyone within SHIP_M of a ship's hull is moved into its pocket, turned to match it; anyone
// further than that from it (a little further, so nobody flickers between the two at the edge) back out ----
// a horizontal vector (or heading) turned by a: the way a ship's yaw turns its own
const shipRot=(o,kx,kz,a)=>{const x=o[kx],z=o[kz];if(x===undefined||z===undefined)return;const c=Math.cos(a),s=Math.sin(a);o[kx]=x*c+z*s;o[kz]=-x*s+z*c;};
// the models that stand for a player, hung off the ship's picture while they're aboard (so they're drawn where it is)
function shipParent(p,S){const par=S?S.pg:scene;for(const o of [p.root,p.pool,p.gb&&p.gb.root])if(o&&o.parent!==par)par.add(o);}
function shipMove(o,S,into,isP){
  const P=o.pos,t=(into?worldToShip:shipToWorld)(S,P.x,P.z,_sv),a=into?-S.yaw:S.yaw;
  P.y+=into?S.sk:-S.sk;   // (a ship going down: its pocket stays put, its picture sinks)
  if(into){   // (never into the hull: up on to whatever's above, or not aboard yet)
    let y=P.y,ok=false;for(let k=0;k<10;k++){if(!solidAt(t.x,Math.floor(y+0.2),t.z)&&!solidAt(t.x,Math.floor(y+1.2),t.z)){ok=true;break;}y=Math.floor(y+0.2)+1;}
    if(!ok){P.y-=S.sk;return false;}P.y=y;}
  P.x=t.x;P.z=t.z;o.heading+=a;
  if(o.kv)shipRot(o.kv,'x','z',a);
  if(isP){o.cam.yaw+=a;shipRot(o,'mvx','mvz',a);o.standCar=null;
    if(o.vcl){o.vcl=null;if(o.state==='climb')o.state='walk';}if(o.drvYaw!==undefined)o.drvYaw+=a;shipParent(o,into?S:null);}
  else{o.act=null;o.wt=null;o.path=null;o.fallTop=undefined;o.standCar=null;}
  return true;
}
// (a ship going down can still be climbed on to while it's level, from above the water: a wreck broken off another, or
// the whole of one, so you can get on and ride it down)
const shipOpen=(S,y)=>S&&(!S.dead||!(S.brk&&S.brk.tilt)&&y-S.sk>G+0.5);
function shipCross(o,isP){
  const P=o.pos;
  if(P.x>=SHIP_X0){const S=shipOfPos(P.x,P.z);if(!S)return;const K=S.K,m=SHIP_M+1.5,u=P.x-S.ox,w=P.z-S.oz;
    // (off its end and over another ship's blocks, the two side by side: one broken in two, its pieces still together.
    // Straight across into that one's pocket, so you walk from one on to the other)
    if(shipN>1&&(u<K.u0||u>K.u1+1||w<K.w0||w>K.w1+1)){shipToWorld(S,P.x,P.z,_sv);const wx=_sv.x,wz=_sv.z,wy=P.y-S.sk;
      for(const T of SHIPS){if(T===S||!shipOpen(T,wy))continue;const KT=T.K,t=worldToShip(T,wx,wz,_sv),ut=t.x-T.ox,wt=t.z-T.oz;
        if(ut<KT.u0||ut>KT.u1+1||wt<KT.w0||wt>KT.w1+1)continue;
        shipMove(o,S,false,isP);if(!shipMove(o,T,true,isP)&&isP)shipParent(o,null);return;}}
    if(u<K.u0-m||u>K.u1+1+m||w<K.w0-m||w>K.w1+1+m)shipMove(o,S,false,isP);return;}
  for(const S of SHIPS){if(!shipOpen(S,P.y))continue;const K=S.K,t=worldToShip(S,P.x,P.z,_sv),u=t.x-S.ox,w=t.z-S.oz;
    if(u>=K.u0-SHIP_M&&u<=K.u1+1+SHIP_M&&w>=K.w0-SHIP_M&&w<=K.w1+1+SHIP_M&&P.y>G-24){shipMove(o,S,true,isP);return;}}
}
// every step, once everything's moved (players at the controls stay where their seat is)
function shipCrossAll(){
  // (anyone left in a pocket with no ship there, its ship gone: players back to solid ground, goblins away)
  for(const p of players)if(p.active&&p.pos.x>=SHIP_X0&&!shipOf(p)){if(p.drv)drvExit(p);placePlayer(p,new V3(10.5,G+1,10.5));shipParent(p,null);}
  for(const g of goblins)if(g.state!=='wait'&&g.pos.x>=SHIP_X0&&!shipOf(g)){g.state='wait';g.t=0;g.root.visible=false;}
  shipVehEach(shipVehCross);   // (even with no ship about: one used aboard one, since sunk, has its model put back)
  if(!shipN)return;
  for(const p of players)if(p.active&&!p.drv)shipCross(p,true);
  for(const g of goblins)if(g.state!=='wait')shipCross(g,false);
}
// ---- vehicles aboard: cars, tanks and helicopters cross into a ship's pocket the same way (over its hull and clear of
// its blocks there), so they stand on its decks, ride along with it for nothing, land on it and are driven about on it,
// and are taken back out once they're off it. Their models hang off the ship's picture meanwhile, and whoever's in one
// goes with it, and so do planes (carrier-jets.js). (The Mobile Gear stays out in the world: it stands on the ship's
// boxes and is carried by them.) ----
// every car, tank and helicopter there is, each with its place and heading read the same way
function shipVehEach(fn){
  for(const c of cars)if(c.alive)fn(c,c.pos);
  for(const V of venues.values()){if(V.kind==='army'&&V.mil)for(const M of V.mil)if(!M.dead&&M.pos)fn(M,M.pos);
    // (and planes: a carrier's own jets, and any other the Testing Environment spawned, flown in over a ship or off one)
    if(V.kind==='airport'&&V.tenv&&V.pl)for(const pl of V.pl)if(!pl.dead&&!pl.fall)fn(pl,pl.g.position);}
}
function shipVehMove(o,S,into){
  if(o.isPlane){const P=o.g.position,t=(into?worldToShip:shipToWorld)(S,P.x,P.z,_sv),a=into?-S.yaw:S.yaw;P.x=t.x;P.z=t.z;P.y+=into?S.sk:-S.sk;o.g.rotation.y+=a;
    shipVehParent(o,into?S:null);if(o.drv&&o.drv.cam){o.drv.cam.yaw+=a;if(o.drv.drvYaw!==undefined)o.drv.drvYaw+=a;shipParent(o.drv,into?S:null);}return;}   // (a plane: its flight is all its own heading, speed and angles)
  const car=!o.isMil,P=car?o.pos:o,t=(into?worldToShip:shipToWorld)(S,P.x,P.z,_sv),a=into?-S.yaw:S.yaw;
  P.x=t.x;P.z=t.z;P.y+=into?S.sk:-S.sk;
  if(car){o.heading+=a;if(o.kv)shipRot(o.kv,'x','z',a);if(o.hvel)shipRot(o.hvel,'x','z',a);o.path=o.rt=o.hw=null;o.spot=null;}
  else{o.h+=a;if(o.hv)shipRot(o.hv,'x','z',a);o.home={x:t.x,z:t.z,h:o.h};o.pos.set(o.x,o.y,o.z);o.g.position.set(o.x,o.y,o.z);o.g.rotation.y+=a;}
  shipVehParent(o,into?S:null);
  // (whoever's driving it or on its gun turns with it, so they're still looking the same way out in the world)
  for(const q of [o.drv,o.gnr])if(q&&q.cam&&q.drv&&q.drv.o===o){q.cam.yaw+=a;if(q.drvYaw!==undefined)q.drvYaw+=a;shipParent(q,into?S:null);}
}
function shipVehParent(o,S){const par=S?S.pg:scene;if(o.g.parent!==par)par.add(o.g);}
// (every step, from shipCrossAll; one left in a pocket whose ship has gone, or spawned straight into one, is seen to)
function shipVehCross(o,P){
  if(P.x>=SHIP_X0){const S=shipOfPos(P.x,P.z);
    if(!S){if(o.isMil||o.isPlane){o.dead=true;o.g.visible=false;}else{o.alive=false;o.g.visible=false;o.respawnT=1e9;}shipVehParent(o,null);return;}
    shipVehParent(o,S);const K=S.K,m=SHIP_M+1.5,u=P.x-S.ox,w=P.z-S.oz;
    if(u<K.u0-m||u>K.u1+1+m||w<K.w0-m||w>K.w1+1+m)shipVehMove(o,S,false);return;}
  if(o.g.parent!==scene)shipVehParent(o,null);
  for(const S of SHIPS){if(!S||S.dead)continue;const K=S.K,t=worldToShip(S,P.x,P.z,_sv),u=t.x-S.ox,w=t.z-S.oz;
    if(u<K.u0-SHIP_M||u>K.u1+1+SHIP_M||w<K.w0-SHIP_M||w>K.w1+1+SHIP_M||P.y<G-24)continue;
    // (only where it's clear of the ship's blocks: one down by the hull below the deck stays out, and meets its boxes)
    const y=P.y+S.sk;if(solidAt(t.x,Math.floor(y+0.3),t.z)||solidAt(t.x,Math.floor(y+1.3),t.z))continue;
    shipVehMove(o,S,true);return;}
}
// a shell or rocket fired aboard (from a tank or helicopter on the deck) that's gone past the ship's side: out into the
// world, turned to match, so it flies on at whatever's out there
function shipShotOut(o){
  const S=shipOfPos(o.pos.x,o.pos.z);if(!S)return;const K=S.K,m=SHIP_M+1.5,u=o.pos.x-S.ox,w=o.pos.z-S.oz;
  if(u>=K.u0-m&&u<=K.u1+1+m&&w>=K.w0-m&&w<=K.w1+1+m)return;
  shipToWorld(S,o.pos.x,o.pos.z,_sv);o.pos.x=_sv.x;o.pos.z=_sv.z;o.pos.y-=S.sk;shipRot(o.v,'x','z',S.yaw);
}
// ---- lines of fire across a ship's side. A round (gunRound, gobShoot, drvAim) is followed in every frame it might meet
// something in: one fired out in the world (a helicopter's gun, the Mobile Gear's rifle on the deck) through any ship
// it passes near, put into that ship's pocket, so it hits the ship's blocks, the goblins and vehicles aboard; one fired
// aboard on out into the world past the side. shipLines lists those other frames with the line put into each (null if
// none), shipLineAt the first block or vehicle met in any of them at t along it, and shipPosIn where something is (a
// goblin, in another frame) in the frame the line was fired in ----
function shipLines(mx,my,mz,ux,uy,uz,R){
  if(!shipN)return null;const L=[],S0=mx>=SHIP_X0?shipOfPos(mx,mz):null;
  const put=(S,from,into)=>{const t=(into?worldToShip:shipToWorld)(from||S,mx,mz,{x:0,z:0}),d={x:ux,z:uz},a=into?-S.yaw:(from||S).yaw;shipRot(d,'x','z',a);
    L.push({S:into?S:null,x:t.x,y:my+(into?S.sk:-(from||S).sk),z:t.z,ux:d.x,uy,uz:d.z});};
  if(S0){if(!S0.dead)put(null,S0,false);return L.length?L:null;}
  for(const S of SHIPS){if(!S||S.dead)continue;const K=S.K,r=Math.hypot(K.u1-K.u0,K.w1-K.w0)/2+4,ox=S.x-mx,oz=S.z-mz,hz=Math.hypot(ux,uz)||1,
      t=Math.max(0,Math.min(R,(ox*ux+oz*uz)/(hz*hz)));if(Math.hypot(ox-ux*t,oz-uz*t)>r)continue;put(S,null,true);}
  return L.length?L:null;
}
const _sl={pos:new V3(),own:null,noShip:true};
// (at t along the line: {e, x,y,z (where, in e's frame), b: the block [x,y,z] it's in, or veh: the vehicle it meets, as shotHitsVeh)
function shipLineAt(L,t,own,veh){
  for(const e of L){const x=e.x+e.ux*t,y=e.y+e.uy*t,z=e.z+e.uz*t;
    if(e.S){const K=e.S.K,u=x-e.S.ox,w=z-e.S.oz;if(u<K.u0-2||u>K.u1+3||w<K.w0-2||w>K.w1+3)continue;
      if(solidAt(x,Math.floor(y),z))return{e,x,y,z,b:[Math.floor(x),Math.floor(y),Math.floor(z)]};}
    else if(y<1||solidAt(x,Math.floor(y),z))return{e,x,y,z,b:y<1?null:[Math.floor(x),Math.floor(y),Math.floor(z)]};
    if(veh){_sl.pos.set(x,y,z);_sl.own=own;const h=shotHitsVeh(_sl);if(h)return{e,x,y,z,veh:h};}}
  return null;
}
// pos (in whatever frame it's in) as it is in ship S0's pocket, or the world (S0 null)
const _spi={x:0,y:0,z:0};
function shipPosIn(pos,S0){
  const Sp=pos.x>=SHIP_X0?shipOfPos(pos.x,pos.z):null;if(Sp===S0)return pos;
  let x=pos.x,y=pos.y,z=pos.z;if(Sp){shipToWorld(Sp,x,z,_sv);x=_sv.x;z=_sv.z;y-=Sp.sk;}
  if(S0){worldToShip(S0,x,z,_sv);x=_sv.x;z=_sv.z;y+=S0.sk;}
  _spi.x=x;_spi.y=y;_spi.z=z;return _spi;
}
// a goblin's step, with every player not where it is (one aboard a ship with it out in the sea, or the other way round)
// shown to it where they really are, put into its own frame: so it chases them, swims out to the ship and climbs aboard
// (from updateGoblins)
function shipSees(g,fn){
  if(!shipN){fn();return;}
  const Sg=g.pos?shipOf(g):null;let sw=null;
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
// fn run as shipView does, with everyone aboard looking the way they really are too (the debug menu's spawns of what
// never goes aboard: planes, balloons, the Mobile Gear)
function shipOutside(fn){
  const L=[];for(const p of players){const S=shipOf(p);if(S){L.push(p,S.yaw);p.cam.yaw+=S.yaw;}}
  try{shipView(fn);}finally{for(let i=0;i<L.length;i+=2)L[i].cam.yaw-=L[i+1];}
}
// a point (anything with x and z) in a ship's pocket moved to where that is on the ship, in place; and how much a heading
// there turns by out in the world (effects that are drawn as they're made: fires, shockwaves)
function shipPt(v){if(v.x<SHIP_X0)return v;const S=shipOfPos(v.x,v.z);if(S){shipToWorld(S,v.x,v.z,_sv);v.x=_sv.x;v.z=_sv.z;if(v.y!==undefined)v.y-=S.sk;}return v;}
function shipYawAt(x,z){const S=shipOfPos(x,z);return S?S.yaw:0;}
// how far a player is from x,z, measured where both really are (one aboard a ship, the other not; nearestPlayer: how loud a
// sound is, who a goblin goes for)
function shipDist(p,x,z){const Sx=shipOfPos(x,z),Sp=shipOf(p);if(Sx===Sp)return Math.hypot(p.pos.x-x,p.pos.z-z);
  let px=pwx(p),pz=pwz(p);if(Sx){worldToShip(Sx,px,pz,_sv);px=_sv.x;pz=_sv.z;}return Math.hypot(px-x,pz-z);}
// the camera's place in a player's own frame (shipCam has put it out in the world): what aiming from it, aboard, wants
const _seye={x:0,y:0,z:0};
function shipEye(p){const c=p.camera.position;if(!shipN)return c;const S=shipOf(p);if(!S||!S.isShip)return c;
  worldToShip(S,c.x,c.z,_sv);_seye.x=_sv.x;_seye.y=c.y+S.sk;_seye.z=_sv.z;return _seye;}
// the camera, placed in the pocket by the usual code, put where that is on the ship (after placeCamera)
function shipCam(p){
  const S=shipOf(p)||p.drv&&p.drv.k==='ship'&&p.drv.o;if(!S||!S.isShip)return;
  const c=p.camera.position;shipToWorld(S,c.x,c.z,_sv);c.x=_sv.x;c.z=_sv.z;c.y-=S.sk;p.camera.rotation.y+=S.yaw;
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
  shipToWorld(S,e[j+12],e[j+14],_sv);e[j+12]=_sv.x;e[j+14]=_sv.z;e[j+13]-=S.sk;
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
  bbGen(a,cx,cz);
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
  // (a carrier wants a sea twice the size: one that's there already grows away from him)
  const K=SHIP_KINDS[kind],half=K.w1-K.w0>60?320:160;
  if(!TENV.sea){const cx=Math.round(px+fx*(24+half)),cz=Math.round(pz+fz*(24+half));TENV.sea={x0:cx-half,x1:cx+half,z0:cz-half,z1:cz+half};seaRebuild();updateChunks(999,0);save();}
  else if(TENV.sea.x1-TENV.sea.x0<2*half||TENV.sea.z1-TENV.sea.z0<2*half){const R=TENV.sea,grow=(a,b,q)=>{const n=2*half-(b-a);if(n<=0)return[a,b];return q<a?[a,b+n]:q>b?[a-n,b]:[a-n/2,b+n/2];};
    [R.x0,R.x1]=grow(R.x0,R.x1,px);[R.z0,R.z1]=grow(R.z0,R.z1,pz);seaRebuild();updateChunks(999,0);save();}
  const R=TENV.sea,S=makeShip(kind,0,0,yaw),r=Math.max(K.u1-K.u0,K.w1-K.w0)/2+12;let ok=false;
  // (the nearest open water straight ahead, else anywhere in the sea nearest him)
  for(let d=40-K.w0;d<=420-K.w0&&!ok;d+=6)for(const side of [0,-12,12,-30,30]){const x=px+fx*d-fz*side,z=pz+fz*d+fx*side;
    if(x<R.x0||x>R.x1||z<R.z0||z>R.z1)continue;for(let cx=Math.floor((x-r)/CS);cx<=Math.floor((x+r)/CS);cx++)for(let cz=Math.floor((z-r)/CS);cz<=Math.floor((z+r)/CS);cz++)chunkArr(cx,cz);
    if(shipFits(S,x,z,yaw)){S.x=x;S.z=z;ok=true;break;}}
  if(!ok){scene.remove(S.grp);SHIPS[S.slot]=null;shipN--;tsSet('No room on the sea for a '+S.K.name+' just there.');return;}
  S.grp.position.set(S.x,0,S.z);S.grp.updateMatrixWorld(true);
  let V=venues.get('tenvShips');if(!V){V={kind:'ship',ships:[]};venues.set('tenvShips',V);}S.V=V;V.ships.push(S);
  shipChunks();
  tsSet('Spawned a'+(/^[aeiou]/.test(K.name)?'n ':' ')+K.name+' on the sea ahead of Gus. Swim out, climb aboard from the stern, and take the helm '+(kind==='carrier'?'on the island\'s navigation bridge, its third storey,':'in the wheelhouse')+' with '+keyLabel(BINDS.use.kb[0])+' (as Gnash or Grizzle).');
}
// cleared away (tenvClear), all but one being driven
function shipsClear(){const V=venues.get('tenvShips');if(!V)return;
  V.ships=V.ships.filter(S=>{if(players.some(q=>q.drv&&q.drv.o===S))return true;shipDrop(S);return false;});if(!V.ships.length)venues.delete('tenvShips');}
