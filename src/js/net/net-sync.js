// ---------- Online co-op: what the host sends, and how a guest shows it ----------
// A snapshot {t:'s'} goes to each guest NET_SNAP_HZ times a second: the players (every plain value on them that's
// changed since the last one, their place, and the pose of each joint), the goblins and vehicles near that guest (place
// and pose, with how each looks sent once), anything that happened meanwhile as events (blocks smashed or built, dust,
// sounds, messages), the fires, and now and then the clock, the weather and what's been wrecked.
// A guest draws everything a little behind the host (NET_DELAY at least, more on a jittery connection: netGotSnap),
// blending between the two snapshots either side, so movement is smooth whatever the network's doing; one-off events
// happen as the snapshot they came in becomes the one shown. If the next snapshot is late, places carry on along the
// way things were going for a moment (NET_EXTRA) rather than stopping dead and then jumping.
const r3=v=>Math.round(v*1000)/1000;
const NETM={g:new Map(),c:new Map()};   // (guest: the host's goblins and vehicles, by the host's number for them)
let NET_FXD=0,NET_APPLY=false,NET_MUTE=false,NET_SPOS=null;   // (NET_SPOS: the host's player whose step is running, so the sounds it makes can be heard from where it is)   // (NET_MUTE: a guest's own run of the venues, whose noise and dust the host's are standing in for)

// ---- players ----
// (plain values a guest has no use for, or keeps for itself: its seat, the menus, effects worked out from where he is)
const NET_PSKIP=new Set(['idx','active','paused','lastHp','speedFx','windZoom','bsK','bsx','bsz','bvx','bvz','flickAcc','flickAccY','flickReq','flickReqY','camHang','who','gob','name','pos','spawnSnap']);
const netEnc=v=>typeof v==='number'?(Number.isFinite(v)?r3(v):String(v)):v;
const netDec=v=>v==='Infinity'?Infinity:v==='-Infinity'?-Infinity:v==='NaN'?NaN:v;
// a player's joints, in a fixed order: the same list on both ends
function netJoints(p){return [p.root,p.rig,p.rig.children[0],p.head,p.jaw,p.tail,...p.legs,p.pool];}
function netPoseOf(nodes){const a=[];for(const o of nodes){if(!o){a.push(0,0,0,0,0,0,1,1,1,0);continue;}const P=o.position,R=o.rotation,S=o.scale;a.push(r3(P.x),r3(P.y),r3(P.z),r3(R.x),r3(R.y),r3(R.z),r3(S.x),r3(S.y),r3(S.z),o.visible?1:0);}return a;}
const lerpA=(a,b,k)=>{let d=b-a;if(d>Math.PI||d<-Math.PI)d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*k;};
function netPoseSet(nodes,a,b,k){for(let i=0;i<nodes.length;i++){const o=nodes[i];if(!o)continue;const j=i*10;
  const v=(n)=>b?a[j+n]+(b[j+n]-a[j+n])*k:a[j+n],w=(n)=>b?lerpA(a[j+n],b[j+n],k):a[j+n];
  o.position.set(v(0),v(1),v(2));o.rotation.set(w(3),w(4),w(5));o.scale.set(v(6),v(7),v(8));o.visible=!!a[j+9];}}
function netPlayerState(p,seat,N){
  const sent=N.sent[seat]||(N.sent[seat]={}),f={};
  for(const k in p){if(NET_PSKIP.has(k))continue;const v=p[k],t=typeof v;let e;
    if(t==='number'||t==='boolean'||t==='string')e=netEnc(v);
    else if(v instanceof V3)e=[r3(v.x),r3(v.y),r3(v.z)];
    else if(Array.isArray(v)&&v.length<32&&v.every(x=>typeof x==='string')){e={l:v.slice()};}   // (a list of names: Gnash's weapons)
    else continue;   // (objects: what he's holding, riding or locked on to are sent their own way, or not at all)
    const o=sent[k];if(!NET_AUTH.includes(k)&&(o===e||Array.isArray(e)&&Array.isArray(o)&&o[0]===e[0]&&o[1]===e[1]&&o[2]===e[2]||e&&e.l&&o&&o.l&&o.l.join()===e.l.join()))continue;   // (what's the host's to say goes every time: a guest's own guess can wander from it while the host's stays put, and a value sent only when it changes would never put it right)
    f[k]=e;sent[k]=e;}
  const lk=p.lockT?netRef(p.lockT):null;
  const e={s:seat,who:p.who,gob:!!p.gob,act:!!p.active,f,pos:[r3(p.pos.x),r3(p.pos.y),r3(p.pos.z)],h:r3(p.heading),pose:netPoseOf(netJoints(p)),lk,
    rd:!!(p.drv||p.rideC||p.standCar||p.vcl&&p.state==='climb')};
  // (in a vehicle: what it is and where, for the guest's chase camera)
  if(p.drv&&!p.drv.jack){try{const D=p.drv,S=drvPose(D),H=drvHP(D),o=D.o,W={};for(const k in o.wpn||{}){const s=o.wpn[k];W[k]=[s.n,Math.round(s.rl*10)/10];}
    e.dv=[D.k,r3(S.x),r3(S.y),r3(S.z),r3(S.h),r3(S.hx),r3(S.hz),r3(S.hy),r3(S.v||0),drvName(D),Math.round(H.hp*10)/10,H.max,W,o.veh||'',!!o.hose,D.seat||'',!!o.gnr,D.k==='mech'?o.key:0,D.k==='ship'?o.n:D.k==='mount'?o.S.n:0,D.k==='mount'?o.i:-1,p.shipBridge?1:0];}catch(er){}}   // (and its name, health and guns, for the guest's own display)   // (driving, riding or clinging to something that moves: the guest can't guess that, so it doesn't try)
  // (the guest's own seat: the last of its controls this took in, and how long ago, so it can tell how far its own guess has drifted)
  if(p.net&&p.net.seat===seat){e.ack=N.inN||0;e.adt=Math.round(NET.now-(N.inAt||NET.now));}
  return e;
}
// (something a player can be locked on to, as both ends can name it)
function netRef(o){let i=goblins.indexOf(o);if(i>=0)return['g',i];i=cars.indexOf(o);if(i>=0)return['c',i];
  if(isPlT(o)){const s=o===P1?0:o.net&&o.net.seat;if(s!==undefined&&s!==null)return['p',s];}   // (another player, locked on to with PvP on: by seat)
  return null;}
function netDeref(r){if(!r)return null;return r[0]==='g'?NETM.g.get(r[1])||null:r[0]==='c'?NETM.c.get(r[1])||null:r[0]==='p'?netSeatP(r[1],false):null;}
// (guest: which of its players is that seat. Its own is P1; anyone else is drawn as P2)
const NET_SEATP=new Map();   // (guest: the host's seats past the first two, as players here)
function netSeatP(s,make){if(s===NET.seat)return P1;if(s===0)return P2;
  // (a seat that isn't this guest's or the host's: another guest. Drawn as a player of its own, made when first seen)
  let q=NET_SEATP.get(s);if(!q&&make!==false){q=makePlayer(players.length);players.push(q);q.net={mirror:true,seat:s};q.active=true;q.root.visible=true;NET_SEATP.set(s,q);}
  if(q&&!q.active&&make!==false){q.active=true;q.root.visible=!q.gob;}return q||null;}

// ---- goblins and vehicles ----
const netLookOf=new WeakMap();let netLookN=0;
const netCol=c=>((Math.round(c.r*255)&255)<<16)|((Math.round(c.g*255)&255)<<8)|(Math.round(c.b*255)&255);
function netGoblins(p,N,out,looks){
  const R=170,px=pwx(p),pz=pwz(p);
  for(let i=0;i<goblins.length;i++){const g=goblins[i],r=g.root;if(!r.visible||!netNear(r.position,px,pz,R))continue;
    const P=r.position,Q=r.rotation;
    out.push([i,r3(P.x),r3(P.y),r3(P.z),r3(Q.x),r3(Q.y),r3(Q.z),r3(r.scale.x),r3(r.scale.y),r3(g.legs[0].rotation.x),r3(g.legs[1].rotation.x),r3(g.arm.rotation.x),r3(g.armL.rotation.x),r3(g.head.rotation.z),g.orb&&g.orb.visible?1:0,g.state,r3(g.hp),g.hpMax>=g.hp?g.hpMax:r3(g.hp),r3(g.arm.rotation.z),r3(g.arm.hand?g.arm.hand.rotation.x:0),g.wkit?g.wkit.shown:0]);   // (and its health, for the health bars; then the rest of a blow's pose, strikes.js; then an officer's club, handgun or holster, police-gun.js)
    const L=g.id&&g.id.look;if(!L)continue;let v=netLookOf.get(g.id);if(!v){v=++netLookN;netLookOf.set(g.id,v);}
    if(N.looks.get(i)!==v){N.looks.set(i,v);looks[i]={o:r.netOpt||(g.civ?{club:false}:{}),civ:!!g.civ,L,id:{name:g.id.name,occ:g.id.occ,age:g.id.age}};}}
}
function netCars(p,N,out,cfg){
  const R=220,px=pwx(p),pz=pwz(p);
  for(let i=0;i<cars.length;i++){const c=cars[i],G=c.g;if(!G.visible||!netNear(G.position,px,pz,R))continue;
    const P=G.position,Q=G.rotation,w=[],f=[];for(const s of c.wheels)w.push(r3(s.rotation.x));for(const s of c.front)f.push(r3(s.rotation.y));
    out.push([i,r3(P.x),r3(P.y),r3(P.z),r3(Q.x),r3(Q.y),r3(Q.z),w,f,c.dh&&c.dh.visible?1:0,c.hazG&&c.hazG.visible?1:0,c.alive?1:0,
      (c.police&&(c.hunter||c.pullLit||c.svcPool&&c.svc&&c.svc.st!=='parked'&&c.svc.st!=='leave')?1:0)|(c.hazard?2:0)|(c.flash&&c.svc&&c.svc.st!=='parked'?4:0),r3(c.hp),c.hpMax>=c.hp?c.hpMax:Math.max(r3(c.hp),carHP(c))]);   // (lights flashing: a police car's, hazards, an ambulance's or fire engine's)
    const k=c.veh+'|'+netCol(c.paint.color)+'|'+(c.police?1:0);if(N.cars.get(i)!==k){N.cars.set(i,k);cfg[i]=[c.veh,netCol(c.paint.color),c.police?1:0,!!c.hunter];}}
}

// ---- the venues' moving models: trains, planes, boats, rides, animals, base vehicles... ----
// A guest runs its own venues (so the models are made, from the same world, just as the host's are), quietly, and then
// every joint the host has sent is put where the host has it. Each model's joints are named by venue, field, place in
// the list and order in the model, which come out the same on both ends; a joint's sent again only when it's moved.
function netVenueModels(f){
  for(const [vk,V] of venues){if(V.kind==='mech')continue;for(const k in V){const x=V[k];if(!x||typeof x!=='object')continue;
    if(x.isObject3D)f(vk+'|'+k,x);
    else if(Array.isArray(x)&&x.length&&x[0]&&(x[0].isObject3D||x[0].g&&x[0].g.isObject3D))x.forEach((e,i)=>{const o=e&&e.isObject3D?e:e&&e.g;if(o&&o.isObject3D)f(vk+'|'+k+'|'+i,o);});}}   // (a Mobile Gear isn't sent by its joints: see netMechs)
  for(const [tk,T] of TRAINS)if(T.cars)T.cars.forEach((g,i)=>{if(g&&g.isObject3D)f('T'+tk+'|'+i,g);});
}
// (a model's joints: itself and everything in it that isn't a plain box, up to a limit)
function netNodes(o,out){out.push(o);for(let i=0;i<out.length&&out.length<80;i++){const c=out[i].children;if(c)for(const ch of c)if(!ch.isMesh||ch.children.length||ch.isInstancedMesh===false)out.push(ch);}return out;}
// ---- Mobile Gears: they aren't saved, so a guest makes its own copy of each one the host has (by its key) and poses it
// itself with mechPose, from the host's state for it each snapshot: where it is and how it's moving, and what its
// thrusters, boosts and weapons are doing. Fewer bytes than its joints, and the flames and blade (which are scaled,
// and joints are only placed and turned) come out right ----
const NET_MGK=['hp','en','red','qbT','qbFlash','airB','asc','jT','jPre','jd','landT','landK','stag','imp','kits','brace','aimP','raA','rfT','rkT','laA','rfLT','rkLT','cnA','cnT','pdA','podT','lgT','ty','vy','repT'],
  NET_MGB=['dead','grounded','boostOn'];
function netMechs(){const out=[];
  for(const [vk,V] of venues){if(V.kind!=='mech')continue;
    for(const M of V.mechs){const f={};for(const k of NET_MGK){const v=M[k];if(typeof v==='number'&&v)f[k]=r3(v);}for(const k of NET_MGB)if(M[k])f[k]=1;
      if(M.load)f.ld=mgLoadCode(M.load);   // (its weapons, so the guest's copy is built and shown carrying the same)
      if(M.qbDir)f.qd=[r3(M.qbDir.x),r3(M.qbDir.z)];if(M.ab)f.ab=M.ab.ph==='go'?2:1;if(M.kick)f.kk=M.kick.hit?2:1;
      if(M.sl)f.sl=[r3(M.sl.fx),r3(M.sl.fz),r3(M.sl.e),r3(M.sl.w),r3(M.sl.f),r3(M.sl.pt||0)];
      if(M.pod)f.pd=M.pod.locks.length+1;if(M.podQ&&M.podQ.length)f.pq=M.podQ.length;const hd=M.hard&&netRef(M.hard);if(hd)f.hd=hd;
      out.push([vk,M.key,r3(M.x),r3(M.y),r3(M.z),r3(M.h),r3(M.vx),r3(M.vz),f]);}}
  return out;}
const netMechByKey=key=>{for(const V of venues.values())if(V.kind==='mech'){const M=V.mechs.find(o=>o.key===key);if(M)return M;}return null;};
// (guest: made or dropped to match the host's, and each one's state as it was then; its place is blended in netMechPlace)
function netMechSet(L){
  const keep=new Set();
  for(const e of L){const [vk,key,x,y,z,h,vx,vz,f]=e;keep.add(key);
    let V=venues.get(vk);if(!V){V={kind:'mech',mechs:[]};venues.set(vk,V);}
    let M=V.mechs.find(o=>o.key===key);if(!M){M=newMech(V,x,z,h,mgLoadDecode(f.ld));M.key=key;M.y=y;M.net=true;}
    M.vx=vx;M.vz=vz;for(const k of NET_MGK)M[k]=f[k]||0;for(const k of NET_MGB)M[k]=!!f[k];
    M.qbDir=f.qd?{x:f.qd[0],z:f.qd[1]}:null;M.ab=f.ab?{ph:f.ab===2?'go':'charge'}:null;M.kick=f.kk?{hit:f.kk===2}:null;
    M.sl=f.sl?Object.assign(M.sl||{},{fx:f.sl[0],fz:f.sl[1],e:f.sl[2],w:f.sl[3],f:f.sl[4],pt:f.sl[5]}):null;
    M.pod=f.pd?{locks:new Array(f.pd-1).fill(null)}:null;M.podQ=f.pq?new Array(f.pq).fill(null):[];M.hard=f.hd?netDeref(f.hd):null;}
  for(const V of venues.values()){if(V.kind!=='mech')continue;for(let i=V.mechs.length-1;i>=0;i--)if(!keep.has(V.mechs[i].key)){scene.remove(V.mechs[i].g);V.mechs.splice(i,1);}}
}
// (guest, each frame: each one's place and heading, blended between snapshots as the goblins' are)
function netMechPlace(a,o,kp,ms){if(!a.mg)return;const by=new Map();if(o&&o.mg)for(const e of o.mg)by.set(e[1],e);
  for(const e of a.mg){const M=netMechByKey(e[1]);if(!M)continue;const fo=by.get(e[1]),kq=netKP(e,fo,2,kp,ms);
    M.x=fo?e[2]+(fo[2]-e[2])*kq:e[2];M.y=fo?e[3]+(fo[3]-e[3])*kq:e[3];M.z=fo?e[4]+(fo[4]-e[4])*kq:e[4];M.h=fo?lerpA(e[5],fo[5],kq):e[5];}}
// (guest: its copies are only posed, and stood on, never moved by themselves; a quick boost its own player presses
// flashes the thrusters and shakes the view at once, ahead of the host's answer)
function netMechStep(V,dt){
  for(const M of V.mechs){
    if(P1.drv&&P1.drv.o===M&&P1.in&&P1.in.mgQBP&&!M.dead){M.qbFlash=Math.max(M.qbFlash||0,0.25);P1.shake=Math.max(P1.shake||0,0.25);}
    mechPose(M,dt);mechBoxes(M,Math.hypot(M.vx,M.vz));}}
// ---- ships (the Testing Environment's barge and carrier): a ship's blocks are in its own pocket of the world, and
// everything aboard is placed in it, so a guest only needs its own copy of each ship in the host's slot, under the host's
// number, and then the host's places for anything aboard come out right by themselves (as do the blocks smashed there,
// goblins aboard and a sinking ship washing people off). Each snapshot carries each ship: slot, number, kind, where it
// is, its heading, speed, how far it's sunk, health, sunk or not, and the engine order and rudder for the helm's display;
// where it's broken in two so far (each break with the slot and number of the wreck it made, so a guest breaks its own
// copy the same way, from the same blocks), its deck weapons' aim, health and rounds, and a wreck's tilt. Furniture
// knocked over aboard is an event ('sk') as it starts falling, and once a second all that's lying down (netWorldBits) ----
const _nw={x:0,z:0};
function netWorldXZ(x,z){_nw.x=x;_nw.z=z;if(x>=SHIP_X0){const S=shipOfPos(x,z);if(S){shipToWorld(S,x,z,_nw);}}return _nw;}
// (is something at P within R of px,pz, both out in the world?)
const netNear=(P,px,pz,R)=>{const w=netWorldXZ(P.x,P.z);return Math.abs(w.x-px)<=R&&Math.abs(w.z-pz)<=R;};
// (the yaw of the frame a player is in: a ship's, aboard one, or the world's)
const netFrameYaw=p=>{const S=shipOf(p);return S?S.yaw:0;};
function netShips(){const out=[];
  for(const S of SHIPS)if(S&&S.V)out.push([S.slot,S.n,S.kind,r3(S.x),r3(S.z),r3(S.yaw),r3(S.sp),r3(S.sk),r3(S.hp),S.dead?1:0,S.ord,r3(S.rud),S.brks||0,
    S.mounts?S.mounts.map(Mt=>{const w=Mt.wpn&&(Mt.wpn.rkt||Mt.wpn.gun);return[r3(Mt.yaw),r3(Mt.pitch),r3(Mt.hp),Mt.dead?1:0,w?w.n:0,w&&w.rl>0?1:0];}):0,S.brk?r3(S.brk.tilt):0,S.cvNet||0]);
  return out;}
let NET_SHIP0=false,NET_SHIPF=false;   // (guest: had its first word of the host's ships. Those it already had are in the save it built from, smashed as they were)
const netShipBy=n=>SHIPS.find(S=>S&&S.n===n)||null;
function netShipGone(S){const V=S.V;if(V){const i=V.ships.indexOf(S);if(i>=0)V.ships.splice(i,1);if(!V.ships.length&&venues.get('tenvShips')===V)venues.delete('tenvShips');}shipDrop(S);}
// (guest: made or dropped to match the host's; their places are blended in netShipPlace)
function netShipSet(L){
  const keep=new Set();let made=false;NET_SHIPF=!NET_SHIP0;
  for(const e of L){const [slot,n,kind,x,z,yaw,sp,sk,hp,dead,ord,rud]=e;keep.add(n);
    let S=SHIPS[slot];if(S&&S.n!==n){netShipGone(S);S=null;}
    if(!S&&!SHIP_KINDS[kind])continue;   // (a wreck: made as its ship breaks, netShipBreaks)
    if(!S){S=makeShip(kind,x,z,yaw,null,{slot,n,keep:!NET_SHIP0});S.sk=sk;
      if(e[15])cvNetApply(S,e[15]);   // (a carrier out in the world, remembered broken or with jets gone: carrier-world.js)
      let V=venues.get('tenvShips');if(!V){V={kind:'ship',ships:[]};venues.set('tenvShips',V);}S.V=V;V.ships.push(S);made=true;netShipPose(S);}
    S.sp=sp;S.hp=hp;S.dead=!!dead;S.ord=ord|0;S.rud=rud||0;
    if(e[13]&&S.mounts)e[13].forEach((m,i)=>{const Mt=S.mounts[i];if(!Mt)return;Mt.hp=m[2];
      if(m[3]&&!Mt.dead){NET_MUTE=true;try{mountWreck(Mt);}finally{NET_MUTE=false;}}   // (blackened, as the host's: its blast came from the host)
      const w=Mt.wpn&&(Mt.wpn.rkt||Mt.wpn.gun);if(w){w.n=m[4];w.rl=m[5]?1:0;}});
    if(S.brk)S.brk.tilt=e[14]||0;}
  for(const S of SHIPS)if(S&&S.net&&!keep.has(S.n))netShipGone(S);
  NET_SHIP0=true;if(made)shipChunks(true);
}
function netShipPose(S){
  if(S.brk&&S.brk.tilt)shipWreckPlace(S);else{S.grp.position.set(S.x,-S.sk,S.z);S.grp.rotation.set(0,S.yaw,0);S.grp.updateMatrixWorld(true);}
  if(!S.dead||S.sk<S.K.sink)shipBoxes(S);}
// (guest, after the snapshot's blocks are in: each break the host's had that this copy hasn't, in order, from the same
// blocks, the wreck in the host's slot under its number; one that's gone from the host's already is dropped at once)
function netShipBreaks(L){
  const live=new Set(L.map(e=>e[1]));
  for(const e of L){const S=netShipBy(e[1]),bk=e[12];if(!S||!bk)continue;S.netBrk=S.netBrk||0;
    while(S.netBrk<bk.length){const [i,slot,n]=bk[S.netBrk++];const O=SHIPS[slot];if(O&&O.n!==n)netShipGone(O);if(SHIPS[slot])continue;
      let W=null;NET_MUTE=true;try{W=shipBreak(S,i,{slot,n,keep:NET_SHIPF});}finally{NET_MUTE=false;}
      if(W){W.dead=true;if(!live.has(n))netShipGone(W);}}}
}
// (furniture knocked over aboard: the host's as it starts to go, so the guest sees it fall)
{const sk=shipKnock;shipKnock=function shipKnock(f,dx,dz){const r=sk(f,dx,dz);
  if(r&&NET.mode===1&&NET.guests.size&&f.S&&f.S.props)netEmit(['sk',f.S.n,f.S.props.indexOf(f),+f.fall.ang.toFixed(4)]);return r;};}
function netShipKnock(e){const S=netShipBy(e[1]),f=S&&S.props&&S.props[e[2]];if(!f||f.gone||f.fall||f.down!==undefined)return;
  f.fall={t:0,ang:e[3]};S.propsFall=(S.propsFall||0)+1;for(const c of f.cells)propCells.delete(propCK(c[0],f.y0,c[1]));}
// (once a second: what's lying down aboard each ship, for a guest that missed one going over, or joined since)
const netShipProps=()=>SHIPS.filter(S=>S&&S.props).map(S=>[S.n,S.props.map((f,i)=>f.down!==undefined?[i,+f.down.toFixed(4)]:null).filter(Boolean)]);
function netShipPropsSet(L){for(const [n,a] of L){const S=netShipBy(n);if(!S||!S.props)continue;let ch=false;
  for(const [i,ang] of a){const f=S.props[i];if(f&&!f.fall&&f.down===undefined){f.down=ang;ch=true;for(const c of f.cells)propCells.delete(propCK(c[0],f.y0,c[1]));}}
  if(ch)shipPropsDraw(S);}}
// (guest, each frame: each one's place, heading and sinking, blended between snapshots)
function netShipPlace(a,o,kp){if(!a.sh)return;const by=new Map();if(o&&o.sh)for(const e of o.sh)by.set(e[1],e);
  for(const e of a.sh){const S=netShipBy(e[1]);if(!S)continue;const f=by.get(e[1]),k=f?kp:0;
    S.x=f?e[3]+(f[3]-e[3])*k:e[3];S.z=f?e[4]+(f[4]-e[4])*k:e[4];S.yaw=f?lerpA(e[5],f[5],k):e[5];S.sk=f?e[7]+(f[7]-e[7])*k:e[7];
    if(S.brk)S.brk.tilt=f?e[14]+(f[14]-e[14])*k:e[14];netShipPose(S);
    if(e[13]&&S.mounts)e[13].forEach((m,i)=>{const Mt=S.mounts[i],q=f&&f[13]&&f[13][i];if(!Mt||Mt.dead)return;Mt.yaw=q?lerpA(m[0],q[0],k):m[0];Mt.pitch=q?m[1]+(q[1]-m[1])*k:m[1];mountPose(Mt);});}}
// (guest, each frame: the models of anyone and anything aboard hung off the ship's picture, the rest off the scene; and
// its own player's camera turned with it when it goes aboard or off, as the host turned it)
function netShipFrames(){
  for(const q of players)if(q.active)shipParent(q,shipOf(q));
  for(const c of cars)if(c.net){const par=shipPar(c.g.position.x,c.g.position.z);if(c.g.parent!==par)par.add(c.g);}
  netVenueModels((key,o)=>{if(o.parent!==scene&&!(o.parent&&o.parent.shipPg))return;const par=shipPar(o.position.x,o.position.z);if(o.parent!==par)par.add(o);});
  const S=shipOf(P1);if(S!==NETP.fr){const a=(NETP.fr&&NETP.fr.isShip?NETP.fr.yaw:0)-(S?S.yaw:0);P1.cam.yaw+=a;shipRot(P1,'mvx','mvz',a);NETP.fr=S;}
}
function netVenues(p,N,out){
  const R=330,px=pwx(p),pz=pwz(p),sent=N.vsent||(N.vsent=new Map());
  netVenueModels((key,o)=>{if(!netNear(o.position,px,pz,R))return;
    netNodes(o,[]).forEach((n,j)=>{const Q=n.position,E=n.rotation,v=[r3(Q.x),r3(Q.y),r3(Q.z),r3(E.x),r3(E.y),r3(E.z),n.visible?1:0],k=key+'|'+j,o2=sent.get(k);
      if(o2&&o2.every((x,i)=>x===v[i]))return;sent.set(k,v);out.push([k,...v]);});});
}
function netVenueCommit(L,rt){
  if(!L.length)return;const by=new Map();
  netVenueModels((key,o)=>{netNodes(o,[]).forEach((n,j)=>by.set(key+'|'+j,n));});
  for(const e of L){const n=by.get(e[0]);if(!n)continue;
    const P=n.position,E=n.rotation;n.netFrom=[P.x,P.y,P.z,E.x,E.y,E.z];n.netTo=e.slice(1);n.netT0=rt;n.visible=!!e[7];NET_VN.add(n);}
}
const NET_VN=new Set();
function netVenuePose(rt){
  const span=1000/NET_SNAP_HZ;
  for(const n of NET_VN){if(!n.netTo)continue;const k=Math.max(0,Math.min(1,(rt-n.netT0)/span)),a=n.netFrom,b=n.netTo;
    if(!n.parent){NET_VN.delete(n);continue;}   // (gone with its venue)
    n.position.set(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k);n.rotation.set(lerpA(a[3],b[3],k),lerpA(a[4],b[4],k),lerpA(a[5],b[5],k));n.visible=!!b[6];}
}
// (the health of what's in the venues -- base vehicles, planes, boats, train cars -- for the health bars. A guest keeps it
// beside its own models, as netHp and netDead, rather than in their own hp and dead: its venues run quietly, and a
// vehicle there that thought itself dead would start wrecking itself)
// the vehicles in a venue whose health is sent by the venue (VEHICLE_KINDS' net, not netOwn), in a set order (a base's
// in the order it keeps them, as older guests expect); null for a venue with none, or a train's (sent car by car)
function netVehList(V){const ks=VEH_BY_VENUE[V.kind];if(!ks||ks[0].perCar)return null;if(V.kind==='army')return V.mil||null;
  const L=[];for(const K of ks)if(K.net&&!K.netOwn)L.push(...K.list(V));return L.length?L:null;}
function netVenueHP(N){
  const sent=N.vhsent||(N.vhsent=new Map()),out=[];
  for(const [vk,V] of venues){let a=null;const L=netVehList(V);
    if(L)a=L.map(o=>[r3(o.hp),o.dead?1:0]);
    else if((V.kind==='rtrain'||V.kind==='sub')&&V.T)a=[[V.T.dead?1:0],(V.T.carHP||[]).map(r3),(V.T.carDead||[]).map(x=>x?1:0)];
    if(!a)continue;const k=JSON.stringify(a);if(sent.get(vk)===k)continue;sent.set(vk,k);out.push([vk,a]);}
  return out;
}
function netVenueHPSet(L){
  for(const [vk,a] of L){const V=venues.get(vk);if(!V)continue;
    const each=(list)=>{if(list)list.forEach((o,i)=>{if(o&&a[i]){o.netHp=a[i][0];o.netDead=!!a[i][1];}});};
    const VL=netVehList(V);if(VL)each(VL);
    else if((V.kind==='rtrain'||V.kind==='sub')&&V.T){V.T.netDead=!!a[0][0];V.T.netHP=a[1];V.T.netCarDead=a[2];}}
}
// (what the health bars read: on a guest the host's figures, wherever they've come)
const netHp=(o,hp)=>NET.mode===2&&o&&o.netHp!==undefined?o.netHp:hp,netDead=(o,dead)=>NET.mode===2&&o&&o.netDead!==undefined?o.netDead:!!dead;

// ---- lag compensation: a guest's attacks land on goblins where that guest saw them ----
// A guest sees the goblins as they were a moment ago (the trip over, and NET.dly behind on top). So while a guest's
// hippo is attacking, the host puts every goblin back where that guest was seeing it for that player's step, then
// returns them. (Only goblins, and only their places: anything that happens to them, happens to them now.)
const NET_GH=30;   // (frames of each goblin's places kept, about half a second: a guest on a bumpy connection draws further behind)
function netGobHist(){
  if(!(NET.mode===1&&NET.guests.size))return;
  for(const g of goblins){if(!g.root.visible){if(g.netH)g.netH.n=0;continue;}let H=g.netH;if(!H)H=g.netH={a:new Float64Array(NET_GH*4),i:0,n:0};
    const o=H.i*4;H.a[o]=NET.now;H.a[o+1]=g.pos.x;H.a[o+2]=g.pos.y;H.a[o+3]=g.pos.z;H.i=(H.i+1)%NET_GH;if(H.n<NET_GH)H.n++;}
}
const netSaved=[];
function netRewind(p){
  const N=p.net;if(!N||N.gone||!Number.isFinite(N.vt)||NET.now-(N.atkAt||-1e9)>600)return false;
  const t=N.vt+(NET.now-(N.inAt||NET.now));if(NET.now-t<20)return false;
  netSaved.length=0;
  for(const g of goblins){const H=g.netH;if(!H||H.n<2||!g.root.visible)continue;
    let best=-1,bt=-1e18;for(let k=0;k<H.n;k++){const o=k*4;if(H.a[o]<=t&&H.a[o]>bt){bt=H.a[o];best=o;}}
    if(best<0){let lo=1e18;for(let k=0;k<H.n;k++){const o=k*4;if(H.a[o]<lo){lo=H.a[o];best=o;}}}   // (further back than kept: the oldest there is)
    netSaved.push(g,g.pos.x,g.pos.y,g.pos.z);g.pos.set(H.a[best+1],H.a[best+2],H.a[best+3]);}
  return true;
}
function netUnwind(){for(let i=0;i<netSaved.length;i+=4)netSaved[i].pos.set(netSaved[i+1],netSaved[i+2],netSaved[i+3]);netSaved.length=0;}
{const up=updatePlayer;updatePlayer=function updatePlayer(p,dt){
  if(NET.mode!==1||!NET.guests.size)return up(p,dt);
  const rw=p.net?netRewind(p):false,sp=NET_SPOS;NET_SPOS=p.pos;try{return up(p,dt);}finally{NET_SPOS=sp;if(rw)netUnwind();}};}

// ---- events: one-off things the host's game did, done again on the guest ----
// (each a call to one of these with its arguments, made plain: numbers, strings, flat lists, players as their seat)
function netSan(v,d){
  if(v===null||v===undefined)return null;const t=typeof v;
  if(t==='number')return Number.isFinite(v)?r3(v):0;if(t==='string'||t==='boolean')return v;if(t!=='object')return null;
  const s=players.indexOf(v);if(s>=0)return{$p:s};
  if(v.isObject3D||v.isMaterial||d>2)return null;
  if(Array.isArray(v))return v.map(x=>netSan(x,d+1));
  const o={};for(const k in v){const x=v[k];if(x===null||typeof x!=='object'){if(typeof x!=='function'&&x!==undefined)o[k]=netSan(x,d+1);}else if(d<2&&!x.isObject3D&&!x.isMaterial&&!players.includes(x)&&!(x.root&&x.root.isObject3D))o[k]=netSan(x,d+1);}
  return o;
}
function netUnsan(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(netUnsan);if('$p' in v){const pl=players[v.$p];if(!pl)return null;
  // (the host's player one is drawn here as P2; this guest's seat is our P1)
  return netSeatP(v.$p,false);}const o={};for(const k in v)o[k]=netUnsan(v[k]);return o;}
function netEmit(e){for(const p of NET.guests.values()){const out=p.net.out;if(out.length<4000)out.push(e);}}
// (the sounds, and which of their arguments is the volume)
const NET_SND={tone:4,noise:1,woosh:0};
// the effects passed on: when the host's game calls one (and not from inside another), each guest makes the same call
const NET_FX={};
function netFx(name,f){
  NET_FX[name]=f;
  // (named as the one it wraps: the debug Sound list reads names off the stack to say what made a sound)
  return {[name](...a){
    if(NET_MUTE)return;
    if(NET.mode===1&&NET_FXD===0&&NET.guests.size){try{const e=['f',name,a.map(x=>netSan(x,0))];if(NET_SPOS&&NET_SND[name]!==undefined){const w=netWorldXZ(NET_SPOS.x,NET_SPOS.z);e.push([r3(w.x),r3(w.z)]);}netEmit(e);}catch(e){}}
    NET_FXD++;try{return f.apply(this,a);}finally{NET_FXD--;}
  }}[name];
}
puff=netFx('puff',puff);smoke=netFx('smoke',smoke);blood=netFx('blood',blood);splat=netFx('splat',splat);
destroyFX=netFx('destroyFX',destroyFX);shockwave=netFx('shockwave',shockwave);shockCone=netFx('shockCone',shockCone);blastFx=netFx('blastFx',blastFx);
tone=netFx('tone',tone);noise=netFx('noise',noise);dmgPop=netFx('dmgPop',dmgPop);woosh=netFx('woosh',woosh);tracer=netFx('tracer',tracer);
// (a message for one player goes to that player only; one for everyone, to everyone)
{const fl=flashLabel;NET_FX.flashLabel=fl;flashLabel=function flashLabel(s,who){
  if(NET_MUTE)return;
  if(NET.mode===1&&NET.guests.size){const seat=who?players.indexOf(who):-1;if(seat!==0)netEmit(['f','flashLabel',[s,seat>0?{$p:seat}:null]]);}
  return fl(s,who&&who.net&&NET.mode===1?null:who);};}
// (pop-ups and shouts the same way: only for the player they're for, so each sees their own hits)
{const hp=hudPop;NET_FX.hudPop=hp;hudPop=function hudPop(x,y,z,t,k,who){
  if(NET_MUTE)return;
  if(NET.mode===1&&NET.guests.size){const seat=who?players.indexOf(who):-1;if(seat!==0)netEmit(['f','hudPop',[x,y,z,t,k,seat>0?{$p:seat}:null]]);}
  if(who&&who.net&&NET.mode===1)return;return hp(x,y,z,t,k,who);};}
// blocks: every block the host's game changes for good goes through addEdit, so that's where they're picked up
{const ae=addEdit;addEdit=function addEdit(x,y,z,b){if(NET.mode===2&&NET.joined&&!NET_APPLY)return;ae(x,y,z,b);
  if(NET.mode===1&&NET.guests.size){const v=edits[x+','+y+','+z];for(const p of NET.guests.values()){const out=p.net.out,L=out[out.length-1];if(L&&L[0]==='e'&&L[1].length<3000)L[1].push(x,y,z,v);else out.push(['e',[x,y,z,v]]);}}};}
// (guest: the host's game is the only one that hurts anyone or breaks anything. Anything here that would -- a fire's
// flames, a hit worked out locally -- does nothing)
for(const [nm,f] of [['damagePlayer',damagePlayer],['damageGoblin',damageGoblin],['hitGoblins',hitGoblins],['damageCar',damageCar],['crush',crush]]){
  const g={[nm](...a){if(NET.mode===2&&NET.joined&&!NET_APPLY)return nm==='crush'?[]:undefined;return f.apply(this,a);}}[nm];
  if(nm==='damagePlayer')damagePlayer=g;else if(nm==='damageGoblin')damageGoblin=g;else if(nm==='hitGoblins')hitGoblins=g;else if(nm==='damageCar')damageCar=g;else crush=g;}
// falling pieces of building: a section toppling over (a rigid piece turning about its hinge) and a collapse sinking
// into the ground. The blocks it's made of go once, when it starts; then where it is, in every snapshot while it lasts.
const netFallId=new WeakMap();let netFallN=0;const NETF=new Map();   // (host: piece -> number; guest: number -> its model)
const netFlat=L=>{const a=[];for(const q of L)a.push(q.x,q.y,q.z,q.b);return a;};
const netUnflat=a=>{const L=[];for(let i=0;i+3<a.length;i+=4)L.push({x:a[i],y:a[i+1],z:a[i+2],b:a[i+3]});return L;};
{const mt=makeTopple;makeTopple=function makeTopple(blocks,pivot,D){const r=mt(blocks,pivot,D);
  if(NET.mode===1&&NET.guests.size){const T=topples[topples.length-1];if(T){const id=++netFallN;netFallId.set(T,id);netEmit(['t',id,netFlat(blocks),[pivot.x,pivot.y,pivot.z]]);}}return r;};}
{const mb=makeBody;makeBody=function makeBody(blocks,big){const r=mb(blocks,big);
  if(NET.mode===1&&NET.guests.size){const B=bodies[bodies.length-1];if(B){const id=++netFallN;netFallId.set(B,id);netEmit(['b',id,netFlat(blocks),B.clipY]);}}return r;};}
// a building coming down takes its blocks out with setRaw alone (a chunk made later leaves them out by reading
// `collapses`), so none of them pass through addEdit. The guest's told which building and from which floor, before the
// pieces that fall from it, and takes the same blocks out of its own chunks (otherwise the building stayed standing
// there, with its toppling copy falling out of it)
{const cb=collapseBuilding;collapseBuilding=function collapseBuilding(B,L,push){
  if(NET.mode===1&&NET.guests.size&&!(collapses[B.key]<=L))netEmit(['c',B.key,L]);
  return cb(B,L,push);};}
const NET_COLL=new Map();let netCollSeeded=false;   // (guest: each building's collapse it's taken out of its chunks, and from which floor)
function netCollSeed(){if(netCollSeeded)return;netCollSeeded=true;for(const k in collapses)NET_COLL.set(k,collapses[k]);}   // (those in the save it built the city from are in its chunks already)
function netCollapse(key,L,ch){
  netCollSeed();if(NET_COLL.get(key)<=L)return;NET_COLL.set(key,L);collapses[key]=Math.min(collapses[key]??1e9,L);
  const [px,pz,bi]=String(key).split(',').map(Number),P=plotInfo(px,pz),b=P&&P.b[bi];if(!b)return;
  const X0=px*CELL,Z0=pz*CELL;
  NET_APPLY=true;
  try{for(let x=b.x0;x<b.x1;x++)for(let z=b.z0;z<b.z1;z++){const wx=X0+x,wz=Z0+z;if(!chunks.has(ckey(Math.floor(wx/CS),Math.floor(wz/CS))))continue;   // (not made yet: it'll leave them out itself)
    for(let y=L;y<H;y++){if(get(wx,y,wz)===AIR)continue;if(y<L+FH+1&&collapseKeep(b,px,pz,x,z,y,L))continue;setRaw(wx,y,wz,AIR);}}}
  finally{NET_APPLY=false;}
  for(let x=b.x0-1;x<=b.x1;x++)for(let z=b.z0-1;z<=b.z1;z++)ch.add(ckey(Math.floor((X0+x)/CS),Math.floor((Z0+z)/CS)));
  destroyVer++;
}
// a street fixture or a prop knocked over: it falls over 0.7 s (the `falling` entry knockFix makes), so the guest's told
// as it starts and plays the same fall, rather than only finding it lying down a second later
{const kf=knockFix;knockFix=function knockFix(f,dx,dz){const r=kf(f,dx,dz);
  if(r&&NET.mode===1&&NET.guests.size){const F=falling.get(f.key);if(F)netEmit(['k',f.key,+F.ang.toFixed(4),F.prop?1:0,r3(F.x),r3(F.z),F.y===undefined?null:r3(F.y)]);}
  return r;};}
function netKnock(e){if(downFix.has(e[1])||falling.has(e[1]))return;const F={t:0,ang:e[2],x:e[4],z:e[5]};if(e[3]){F.prop=true;F.y=e[6];}falling.set(e[1],F);}
// (guest, each frame: the falls under way, as updateTraffic moves them on the host, without its dust and sound, which come from the host)
function netFallingTick(dt){let any=false;for(const [k,F] of falling){F.t+=dt;any=true;if(F.t>=0.7){falling.delete(k);downFix.set(k,F.ang);}}return any;}
function netFalls(){const t=[],b=[];
  for(const T of topples){const id=netFallId.get(T);if(id){const P=T.grp.position,Q=T.grp.quaternion;t.push([id,r3(P.x),r3(P.y),r3(P.z),+Q.x.toFixed(5),+Q.y.toFixed(5),+Q.z.toFixed(5),+Q.w.toFixed(5)]);}}
  for(const B of bodies){const id=netFallId.get(B);if(id)b.push([id,r3(B.off)]);}
  return [t,b];}
// guest: a falling piece's model, made from its blocks as the host's was (it changes nothing in the world: the host sends the blocks it leaves behind)
function netFallMake(e){
  const L=netUnflat(e[2]);if(!L.length||NETF.has(e[1]))return;
  if(e[0]==='t'){const pv=new V3(e[3][0],e[3][1],e[3][2]),mesh=buildBodyMesh(L,null),grp=new THREE.Group();grp.position.copy(pv);mesh.position.set(-pv.x,-pv.y,-pv.z);grp.add(mesh);scene.add(grp);NETF.set(e[1],{o:grp,mesh,t:true,seen:true});}
  else{const mesh=buildBodyMesh(L,new THREE.Plane(new V3(0,1,0),-e[3]));scene.add(mesh);NETF.set(e[1],{o:mesh,mesh,t:false,seen:true});}
}
function netFallDrop(F){scene.remove(F.o);try{F.mesh.geometry.dispose();if(!F.t)F.mesh.material.dispose();}catch(e){}}
function netFallCommit(m){
  if(!m.fa)return;for(const F of NETF.values())F.seen=false;
  for(const e of m.fa[0]){const F=NETF.get(e[0]);if(F)F.seen=true;}for(const e of m.fa[1]){const F=NETF.get(e[0]);if(F)F.seen=true;}
  for(const [id,F] of NETF)if(!F.seen){netFallDrop(F);NETF.delete(id);}
}
function netFallPose(a,b,k){
  if(!a.fa)return;const bt=new Map(),bb=new Map();if(b&&b.fa){for(const e of b.fa[0])bt.set(e[0],e);for(const e of b.fa[1])bb.set(e[0],e);}
  for(const e of a.fa[0]){const F=NETF.get(e[0]);if(!F)continue;const f=bt.get(e[0]),v=n=>f?e[n]+(f[n]-e[n])*k:e[n];
    F.o.position.set(v(1),v(2),v(3));let x=v(4),y=v(5),z=v(6),w=v(7);if(f&&e[4]*f[4]+e[5]*f[5]+e[6]*f[6]+e[7]*f[7]<0){x=e[4]-(f[4]+e[4])*k;y=e[5]-(f[5]+e[5])*k;z=e[6]-(f[6]+e[6])*k;w=e[7]-(f[7]+e[7])*k;}
    const l=Math.hypot(x,y,z,w)||1;F.o.quaternion.set(x/l,y/l,z/l,w/l);}
  for(const e of a.fa[1]){const F=NETF.get(e[0]);if(!F)continue;const f=bb.get(e[0]);F.o.position.y=f?e[1]+(f[1]-e[1])*k:e[1];}
}
// (and its own blocks are the host's: a guess at a smash changes nothing here)
{const sr=setRaw;setRaw=function setRaw(x,y,z,b){if(NET.mode===2&&NET.joined&&!NET_APPLY)return;return sr(x,y,z,b);};}
// guest: one block, as the host has it
function netSetBlock(x,y,z,b,ch){
  if(edits[x+','+y+','+z]===b)return;
  const cx=Math.floor(x/CS),cz=Math.floor(z/CS);
  NET_APPLY=true;try{if(chunks.has(ckey(cx,cz)))setRaw(x,y,z,b);addEdit(x,y,z,b);}finally{NET_APPLY=false;}
  for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((x+ox)/CS),Math.floor((z+oz)/CS)));
}

// ---- the world's other saved state, the clock and the weather: sent when changed, checked once a second ----
function netWorldBits(N){
  const out={},J=(k,v)=>{const s=JSON.stringify(v);if(N.wsent[k]!==s){N.wsent[k]=s;out[k]=v;}};
  if(TENV){J('tenv',TENV.boxes);J('sea',TENV.sea||null);}if(shipN)J('sprop',netShipProps());   // (and its sea, laid out for the first ship, and the furniture knocked over aboard ships)   // (the Testing Environment's structures, as they're spawned and removed)
  J('coll',collapses);J('wreck',wrecked);J('down',[...downFix]);J('dest',destroyed);
  J('fire',fires.map(F=>[r3(F.x),r3(F.y),r3(F.z),r3(F.r),Math.round(F.t*10)/10,Math.round(F.life*10)/10,F.flames?1:0,r3(F.sm),r3(F.rise),F.douse?1:0]));
  return out;
}
function netClock(){return{tod,dayN,clockT,tc:trafficClock,wc:wxClock,wx:{type:WX.type,until:WX.until,k:Object.assign({},WX.k),wet:WX.wet,snowCover:WX.snowCover,snowClock:WX.snowClock,frozen:!!WX.frozen},host:Math.max(0,DT.host-1),hostV:DT.host,combo:DT.combo,pvp:DT.pvp};}
function netClockSet(k){if(!k)return;tod=k.tod;dayN=k.dayN;clockT=k.clockT;trafficClock=k.tc;wxClock=k.wc;if(k.wx){const w=k.wx;WX.type=WX_TYPES[w.type]?w.type:'partly';WX.until=w.until;Object.assign(WX.k,w.k);WX.wet=w.wet;WX.snowCover=w.snowCover;WX.snowClock=w.snowClock;WX.frozen=w.frozen;}
  {const h=k.hostV!==undefined?k.hostV:k.host!==undefined?k.host+1:undefined;if(h!==undefined&&h!==DT.host){DT.host=h;try{syncHost();}catch(e){}}}   // (hostV: the four steps; a host on an older version sends only host, its three, which start at Passive)
  if(k.pvp!==undefined&&!!k.pvp!==NET_PVP){NET_PVP=!!k.pvp;try{syncPvp();}catch(e){}}   // (PvP is the host's to say, as hostility is)
  if(k.combo!==undefined&&k.combo!==DT.combo){DT.combo=!!k.combo;try{comboUiSync();}catch(e){}}}   // (the host's Combo system switch: whether there's a combo to show at all)

// ---- host: one guest's snapshot ----
function netSendSnap(p){   // (and the goblins' places are kept each frame, below, for lag compensation)
  const N=p.net;if(!N.wsent)N.wsent={};
  const m={t:'s',n:++N.seq,tt:NET.now,p:[],g:[],gl:{},c:[],cl:{},e:N.out};N.out=[];
  for(let s=0;s<players.length;s++){const q=players[s];if(q.active)m.p.push(netPlayerState(q,s,N));}
  netGoblins(p,N,m.g,m.gl);netCars(p,N,m.c,m.cl);m.v=[];netVenues(p,N,m.v);m.mg=netMechs();m.sh=netShips();m.vh=netVenueHP(N);m.fa=netFalls();m.sc=[score,kills,RAMP.cars,RAMP.best,RAMP.nB,RAMP.nR];
  N.wT=(N.wT||0)-1;if(N.wT<=0){N.wT=NET_SNAP_HZ;m.w=netWorldBits(N);m.k=netClock();N.vhsent=null;}   // (and the venues' health all again next time, for a venue the guest has only just made)
  try{NET.tr.send(m,N.peer);}catch(e){}
}

// ---- guest: its own hippo, moved at once ----
// Waiting a round trip to see your own hippo move feels like wading through mud, so a guest moves its own straight away
// with the very same player code (quietly: nothing it does here hurts or breaks anything, and the sounds and dust come
// from the host), and keeps a short history of where it put him. Each snapshot says which of its controls the host had
// taken in and how long ago; where the host has him then, against where the guest had him then, is how far the guess
// has drifted, and he's eased back by that much over the next few frames, so a correction is a nudge, never a jump.
// Anything the guest can't guess (riding or driving something, dying, a big knock) and it shows the host's own.
const NET_PREDICT=true;
const NET_AUTH=['wpns','gren','hp','deadT','hurtFx','regenT','hurt','stam','exhausted','lastHit','killer','score','cbN','cbT'];   // (what's always the host's to say, guessing or not. The combo too: only the host's kills build one, and the guest's own clock runs it down between snapshots, so without it the bar sat still)
const NETP={on:false,hist:[],sent:new Map(),corr:new V3(),snap:false,fr:null};   // (fr: the ship whose frame this guest's own player is in, or null out in the world)
// (the guest's controls going out: when each went, so its history can be matched up)
function netPredSent(n){if(NETP.sent.size>200)NETP.sent.clear();NETP.sent.set(n,NET.now);}
function netPredRecord(){const H=NETP.hist;H.push({t:NET.now,x:P1.pos.x,y:P1.pos.y,z:P1.pos.z});while(H.length>240||H.length&&NET.now-H[0].t>3000)H.shift();}
function netPredAt(t){const H=NETP.hist;if(!H.length)return null;if(t<=H[0].t)return H[0];
  for(let i=H.length-1;i>=0;i--)if(H[i].t<=t){const a=H[i],b=H[i+1];if(!b)return a;const k=(t-a.t)/((b.t-a.t)||1);return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,z:a.z+(b.z-a.z)*k};}return H[0];}
// a snapshot just in: how far off the guess was, straight away (not when it's shown)
function netPredCheck(m){
  const e=m.p.find(x=>x.s===NET.seat);if(!e)return;
  const can=NET_PREDICT&&!e.rd&&e.f.state!=='dead'&&P1.state!=='dead'&&!(e.f.deadT>0);
  if(!can){NETP.on=false;return;}
  if(!NETP.on||e.ack===undefined){NETP.on=!!e.ack;NETP.snap=true;return;}
  const at=NETP.sent.get(e.ack);if(at===undefined)return;const q=netPredAt(at+(e.adt||0));if(!q)return;
  const dx=e.pos[0]-q.x,dy=e.pos[1]-q.y,dz=e.pos[2]-q.z,d=Math.hypot(dx,dy,dz);
  if(d>6){NETP.snap=true;return;}   // (too far out to ease back: start again from the host's)
  if(d<0.04)return;
  NETP.corr.set(dx,dy,dz);for(const h of NETP.hist){h.x+=dx;h.y+=dy;h.z+=dz;}   // (the history was off by the same, from then on)
}
// each step: the player code, on this guest's own hippo
function netPredStep(sdt,first){
  if(!NETP.on||NETP.snap)return;
  if(!first){const I=P1.in;I.jumpPress=I.bitePress=I.lockPress=I.chargePress=I.dashPress=I.sprintPress=false;}
  NET_MUTE=true;try{updatePlayer(P1,sdt);if(shipN&&!P1.drv){shipCross(P1,true);NETP.fr=shipOf(P1);}}catch(e){}finally{NET_MUTE=false;}
}
// each frame: ease off whatever's left of a correction
function netPredEase(dt){
  const c=NETP.corr;if(!c.x&&!c.y&&!c.z)return;const k=Math.min(1,dt*10);
  P1.pos.x+=c.x*k;P1.pos.y+=c.y*k;P1.pos.z+=c.z*k;c.x-=c.x*k;c.y-=c.y*k;c.z-=c.z*k;if(Math.abs(c.x)+Math.abs(c.y)+Math.abs(c.z)<0.002)c.set(0,0,0);
}

// ---- guest ----
function netGotSnap(m){
  if(!Number.isFinite(m.tt))return;
  // (how far the host's clock is from ours: the smallest gap of the last two seconds, so a slow message never drags the
  // picture back, and a connection that's got slower for good is caught up with in two seconds rather than taken for jitter)
  const gap=NET.now-m.tt,W=NET.gaps;W.push(NET.now,gap);while(W.length>2&&NET.now-W[0]>2000)W.splice(0,2);
  let lo=gap;for(let i=1;i<W.length;i+=2)if(W[i]<lo)lo=W[i];NET.off=lo;
  netJitter(m,gap);
  try{netPredCheck(m);}catch(e){}
  NET.q.push(m);
  if(NET.q.length>40)NET.q.splice(0,NET.q.length-40);
}
// How far behind to draw. A snapshot is needed by the time the one before it is being shown, so the delay has to cover
// the time between snapshots plus however much later than the quickest they come in. That lateness is kept as an
// envelope (up at once on a late one, down slowly over several seconds), so a bumpy connection is drawn far enough
// behind to always have the next snapshot in hand, and a smooth one stays at NET_DELAY. Nothing extra is sent.
const NET_DELAY_MAX=300,NET_EXTRA=150;   // (ms: the most a guest will draw behind on top of the trip, and the longest it carries things on past the last snapshot)
function netJitter(m,gap){
  const late=Math.max(0,gap-NET.off);NET.jit+=(late-NET.jit)*(late>NET.jit?0.5:0.01);
  if(NET.lastTT!==null){const d=m.tt-NET.lastTT;if(d>0&&d<1000)NET.span+=(d-NET.span)*(d>NET.span?0.3:0.05);}
  if(NET.lastTT===null||m.tt>NET.lastTT)NET.lastTT=m.tt;
  NET.dly=Math.max(NET_DELAY,Math.min(NET_DELAY_MAX,NET.span+NET.jit*1.25+10));
}
// the host's time being shown, moved on each frame by how long the frame took, nudged (by up to a tenth) toward where the
// delay says it should be, so a change in the delay or the clock gap slows or quickens things a touch, never jumps them
function netShowClock(){
  const want=NET.now-NET.off-NET.dly,fd=NET.rtAt===null?0:Math.max(0,NET.now-NET.rtAt);NET.rtAt=NET.now;
  if(NET.rt===null||Math.abs(want-NET.rt)>500){NET.rt=want;return NET.rt;}   // (just joined, or a long stall: start again)
  const err=want-NET.rt-fd;NET.rt+=fd+Math.max(-0.1*fd,Math.min(0.1*fd,err));return NET.rt;
}
function netShowReset(){NET.gaps.length=0;NET.rt=null;NET.rtAt=null;NET.jit=0;NET.span=1000/NET_SNAP_HZ;NET.lastTT=null;NET.dly=NET_DELAY;NET.prev=null;}
// the host's game takes over: the city's own goblins and traffic stand down, and both hippos are the host's to move
function netGuestBegin(h){
  for(const g of goblins){g.state='wait';g.root.visible=false;}
  for(const c of cars){c.alive=false;c.g.visible=false;}
  for(const [,g] of NETM.g)g.root.visible=false;for(const [,c] of NETM.c)c.g.visible=false;
  NET.q.length=0;NET.cur=null;NET.off=null;netShowReset();NETP.on=false;NETP.snap=false;NETP.hist.length=0;NETP.corr.set(0,0,0);
  P1.net={mirror:true,seat:NET.seat};P2.net={mirror:true,seat:0};
  if(h){P2.who=h.who?1:0;setGobP(P2,!!h.gob);}
  P2.active=true;P2.root.visible=!P2.gob;P2.paused=false;dressHippo(P2);dressHippo(P1);
  coop=false;layout();startPlay('net');
}
function netGob(id,o){
  let g=NETM.g.get(id);if(g)return g;
  g=makeGoblin(Object.assign({},o,{shareGeo:true}),{state:'net',net:true,id:null});NETM.g.set(id,g);return g;
}
function netCar(id,k){
  let c=NETM.c.get(id);
  if(c&&c.police!==!!k[2]){c.g.visible=false;c.alive=false;NETM.c.delete(id);c=null;}
  if(!c){c=makeCar(id,!!k[2]);c.g.scale.setScalar(ES);c.net=true;c.respawnT=1e9;cars.push(c);NETM.c.set(id,c);}
  if(c.veh!==k[0]&&VEH[k[0]])setVeh(c,k[0]);c.paint.color.setHex(k[1]);c.hunter=!!k[3];
  return c;
}
// a snapshot becoming the one shown: everything in it that isn't blended
function netCommit(m){
  for(const [s,q] of NET_SEATP)if(q.active&&!m.p.some(e=>e.s===s))netDeactivate(q);   // (another guest gone)
  for(const e of m.p){const q=netSeatP(e.s);if(!q)continue;
    if(q===P2&&!e.act){q.active=false;q.root.visible=false;continue;}
    if(e.gob!==!!q.gob)setGobP(q,e.gob);if(e.who!==q.who){q.who=e.who;dressHippo(q);}
    const own=q===P1&&NETP.on&&!NETP.snap;
    for(const k in e.f){if(own&&!NET_AUTH.includes(k))continue;const v=e.f[k];if(Array.isArray(v)){if(q[k] instanceof V3)q[k].set(v[0],v[1],v[2]);else q[k]=new V3(v[0],v[1],v[2]);}else if(v&&v.l)q[k]=v.l.slice();else q[k]=netDec(v);}
    if(!(q===P1&&NETP.on))q.lockT=netDeref(e.lk);
    if(e.dv){if(!q.drv||!q.drv.netS)q.drv={k:e.dv[0],o:{},netS:{x:0,y:0,z:0,h:0,hx:1,hz:1,hy:1,v:0}};const D=q.drv,S=D.netS;D.k=e.dv[0];if(e.dv[17]){const M=netMechByKey(e.dv[17]);if(M)D.o=M;}if(e.dv[18]){const S=netShipBy(e.dv[18]);if(S)D.o=e.dv[19]!==undefined&&e.dv[19]>=0?(S.mounts&&S.mounts[e.dv[19]])||D.o:S;}   // (a ship, or one of its deck weapons)   // (a Mobile Gear: its copy here, for the view and the display)
      S.hx=e.dv[5];S.hz=e.dv[6];S.hy=e.dv[7];S.v=e.dv[8];
      D.netN=e.dv[9];D.netHP={hp:e.dv[10],max:e.dv[11]};D.o.veh=e.dv[13]||undefined;D.o.hose=!!e.dv[14];D.seat=e.dv[15]||undefined;D.o.gnr=e.dv[16]?q:null;
      // (at a ship's helm, the bridge view or the chase camera, as the weapon button left it on the host; a guest's own camera
      // is its own, so it's turned as shipViewSwap turns it there)
      {const sb=!!e.dv[20],was=q.netSB;q.netSB=sb;q.shipBridge=sb;if(was!==undefined&&was!==sb&&q===P1){q.drvLook=camClock;q.cam.yaw=Math.PI;q.cam.pitch=sb?-0.08:-0.25;}}   // (netSB: what the host last said, as the plain field may have come first)
      const W=e.dv[12]||{};if(Object.keys(W).length){if(!D.o.wpn)wpnInit(D.o,drvGunK(D));for(const k in W)if(D.o.wpn[k]){D.o.wpn[k].n=W[k][0];D.o.wpn[k].rl=W[k][1];}}}
    else if(q.drv&&q.drv.netS)q.drv=null;
    if(q===P1&&NETP.snap){NETP.snap=false;NETP.corr.set(0,0,0);NETP.hist.length=0;q.pos.set(e.pos[0],e.pos[1],e.pos[2]);q.heading=e.h;}
  }
  for(const i in m.gl){const G=m.gl[i],g=netGob(+i,G.o);g.civ=G.civ;try{applyLook(g,G.L,ES);}catch(e){}g.id=Object.assign({look:G.L},G.id);}
  for(const i in m.cl)netCar(+i,m.cl[i]);
  const seenG=new Set(),seenC=new Set();
  for(const e of m.g){const g=NETM.g.get(e[0]);if(!g)continue;seenG.add(g);g.state=e[15];if(e[16]!==undefined){g.hp=e[16];g.hpMax=e[17];}g.root.visible=true;if(g.orb)g.orb.visible=!!e[14];}
  for(const [,g] of NETM.g)if(!seenG.has(g)){g.root.visible=false;g.state='net';}
  for(const e of m.c){const c=NETM.c.get(e[0]);if(!c)continue;seenC.add(c);c.g.visible=true;c.alive=!!e[11];if(e[13]!==undefined){c.hp=e[13];c.hpMax=e[14];}if(c.dh)c.dh.visible=!!e[9];if(c.hazG)c.hazG.visible=!!e[10];}
  for(const [,c] of NETM.c)if(!seenC.has(c)){c.g.visible=false;c.alive=false;}
  if(m.sh)netShipSet(m.sh);
  // the events, in the order they happened
  const ch=new Set();
  for(const e of m.e){
    if(e[0]==='e'){const L=e[1];for(let i=0;i+3<L.length;i+=4)netSetBlock(L[i],L[i+1],L[i+2],L[i+3],ch);}
    else if(e[0]==='t'||e[0]==='b'){try{netFallMake(e);}catch(er){}}
    else if(e[0]==='c'){try{netCollapse(e[1],e[2],ch);}catch(er){}}
    else if(e[0]==='k'){try{netKnock(e);}catch(er){}}
    else if(e[0]==='sk'){try{netShipKnock(e);}catch(er){}}
    else if(e[0]==='f'){const f=NET_FX[e[1]];if(!f)continue;if(ch.size){rebuildSet(ch);ch.clear();}
      if(e[1]==='flashLabel'){const who=e[2][1]?netUnsan(e[2][1]):null;f(e[2][0],who);continue;}
      const a=e[2].map(netUnsan);
      // (a sound one of the players made: quieter the further that player is from this one)
      if(e[3]&&NET_SND[e[1]]!==undefined){const d=Math.hypot(e[3][0]-pwx(P1),e[3][1]-pwz(P1)),k=d<14?1:Math.max(0,1-(d-14)/70);if(k<0.04)continue;a[NET_SND[e[1]]]*=k;}
      try{f(...a);}catch(er){}}}
  if(ch.size)rebuildSet(ch);
  if(m.sh)netShipBreaks(m.sh);
  netFallCommit(m);
  if(m.mg)netMechSet(m.mg);
  if(m.v)netVenueCommit(m.v,NET.rt!==null?NET.rt:NET.now-NET.off-NET.dly);
  if(m.vh)netVenueHPSet(m.vh);
  if(m.sc){score=m.sc[0];kills=m.sc[1];RAMP.cars=m.sc[2]||0;RAMP.best=m.sc[3]||0;RAMP.nB=m.sc[4]||0;RAMP.nR=m.sc[5]||0;}
  if(m.w)netWorld(m.w);
  if(m.k)netClockSet(m.k);
  if(NET.cur&&NET.cur.tt<m.tt)NET.prev=NET.cur;NET.cur=m;
}
function netWorld(w){
  if(w.tenv&&TENV){const key=B=>[B.k,B.ax,B.az,B.w,B.h].join(),want=new Set(w.tenv.map(key));
    for(let i=TENV.boxes.length-1;i>=0;i--)if(!want.has(key(TENV.boxes[i])))tenvRemove(i);
    const have=new Set(TENV.boxes.map(key));for(const B of w.tenv)if(!have.has(key(B))){const C=Object.assign({},B);TENV.boxes.push(C);tenvIndex();linkNearC.clear();tenvRebuild(C);}}
  if(w.sea!==undefined&&TENV&&JSON.stringify(w.sea)!==JSON.stringify(TENV.sea||null)){TENV.sea=w.sea;if(w.sea)seaRebuild();}
  if(w.sprop)netShipPropsSet(w.sprop);
  if(w.coll){const ch=new Set();for(const k in w.coll)if(!(NET_COLL.get(k)<=w.coll[k]))netCollapse(k,w.coll[k],ch);collapses=w.coll;if(ch.size)rebuildSet(ch);}   // (one whose word went missing, or came while away)if(w.wreck)wrecked=w.wreck;if(w.dest){destroyed=w.dest;destroyVer++;}
  if(w.down){downFix.clear();for(const [k,v] of w.down)if(!falling.has(k))downFix.set(k,v);netDressT=0;}   // (one still falling here lands in its own time)   // (the street's fixtures drawn again, knocked-down ones lying down)
  if(w.fire){fires.length=0;for(const f of w.fire)fires.push({x:f[0],y:f[1],z:f[2],r:f[3],t:f[4],life:f[5],base:f[5],born:playTime,flames:!!f[6],acc:0,sacc:0,hurt:9,sm:f[7],rise:f[8],douse:!!f[9],blame:null});}
}
// every frame: show the host's game as it was a moment ago (netShowClock), blended between the snapshots either side
// (k, 0 to 1 from a to b). With no later snapshot in yet, places and headings carry on from the last two (kp: the same
// sums toward the one before, the other way), for NET_EXTRA at most; the poses of limbs and the like just hold. Anything
// that moved further between two snapshots than it could have (a respawn, a teleport) jumps rather than slides.
const NET_TP=(d,ms)=>d>6+0.1*ms;   // (blocks, against the time between the two snapshots: faster than 100 a second is a jump)
function netKP(e,f,i,kp,ms){if(!f)return 0;const dx=f[i]-e[i],dy=f[i+1]-e[i+1],dz=f[i+2]-e[i+2];return NET_TP(Math.sqrt(dx*dx+dy*dy+dz*dz),ms)?(kp>=0.5?1:0):kp;}
function netGuestFrame(dt){
  if(NET.off===null)return;
  const rt=netShowClock(),Q=NET.q;
  // (fallen far behind -- a stall, a tab in the background: catch up rather than play it all out slowly)
  while(Q.length>12)netCommit(Q.shift());
  while(Q.length&&Q[0].tt<=rt)netCommit(Q.shift());
  const a=NET.cur;if(!a)return;let b=Q[0]&&Q[0].tt>a.tt?Q[0]:null;const k=b?Math.max(0,Math.min(1,(rt-a.tt)/(b.tt-a.tt))):0;
  // (o: the snapshot the places are blended toward -- the next, or with none in yet the one before -- and kp how far)
  let o=b,kp=k;if(!b&&NET.prev&&NET.prev.tt<a.tt&&rt>a.tt){o=NET.prev;kp=-Math.min(rt-a.tt,NET_EXTRA)/(a.tt-o.tt);}
  const ms=o?Math.abs(o.tt-a.tt):0;
  for(const e of a.p){const q=netSeatP(e.s,false);if(!q||!q.active)continue;if(q===P1&&NETP.on){netPredEase(dt);continue;}const f=b&&b.p.find(x=>x.s===e.s),fo=o&&o.p.find(x=>x.s===e.s);
    const P=e.pos,P2b=fo?fo.pos:P,kq=fo?netKP(P,P2b,0,kp,ms):0;q.pos.set(P[0]+(P2b[0]-P[0])*kq,P[1]+(P2b[1]-P[1])*kq,P[2]+(P2b[2]-P[2])*kq);
    q.heading=fo?lerpA(e.h,fo.h,kq):e.h;netPoseSet(netJoints(q),e.pose,f&&f.pose,k);
    if(e.dv&&q.drv&&q.drv.netS){const S=q.drv.netS,g=fo&&fo.dv&&fo.dv[0]===e.dv[0]?fo.dv:e.dv,kd=netKP(e.dv,g,1,kp,ms);S.x=e.dv[1]+(g[1]-e.dv[1])*kd;S.y=e.dv[2]+(g[2]-e.dv[2])*kd;S.z=e.dv[3]+(g[3]-e.dv[3])*kd;S.h=lerpA(e.dv[4],g[4],kd);}}
  const bg=new Map(),bc=new Map();if(o){for(const e of o.g)bg.set(e[0],e);for(const e of o.c)bc.set(e[0],e);}
  for(const e of a.g){const g=NETM.g.get(e[0]);if(!g)continue;const fo=bg.get(e[0]),f=b?fo:null,kq=netKP(e,fo,1,kp,ms),v=n=>f?e[n]+(f[n]-e[n])*k:e[n],w=n=>f?lerpA(e[n],f[n],k):e[n];
    g.root.position.set(fo?e[1]+(fo[1]-e[1])*kq:e[1],fo?e[2]+(fo[2]-e[2])*kq:e[2],fo?e[3]+(fo[3]-e[3])*kq:e[3]);g.root.rotation.set(w(4),fo?lerpA(e[5],fo[5],kq):e[5],w(6));g.root.scale.set(v(7),v(8),v(7));g.pos.copy(g.root.position);g.heading=g.root.rotation.y;
    g.legs[0].rotation.x=w(9);g.legs[1].rotation.x=w(10);g.arm.rotation.x=w(11);g.armL.rotation.x=w(12);g.head.rotation.z=w(13);
    if(e[18]!==undefined){g.arm.rotation.z=w(18);if(g.arm.hand)g.arm.hand.rotation.x=f&&f[19]!==undefined?e[19]+(f[19]-e[19])*k:e[19];}   // (the wrist turns past half a turn: straight between, not the short way round)
    if(g.wkit)wkitShow(g.wkit,e[20]||0);}   // (a blade or club in hand, or the gun drawn, and the gun put away: foes.js)
  netVenuePose(rt);netMechPlace(a,o,kp,ms);netShipPlace(a,o,kp);netFallPose(a,b,k);
  for(const e of a.c){const c=NETM.c.get(e[0]);if(!c)continue;const fo=bc.get(e[0]),f=b?fo:null,kq=netKP(e,fo,1,kp,ms),w=n=>f?lerpA(e[n],f[n],k):e[n],x=n=>fo?e[n]+(fo[n]-e[n])*kq:e[n],y=n=>fo?lerpA(e[n],fo[n],kq):e[n];
    c.g.position.set(x(1),x(2),x(3));c.g.rotation.set(w(4),y(5),w(6));c.pos.copy(c.g.position);c.heading=c.g.rotation.y;
    e[7].forEach((r,i)=>{if(c.wheels[i])c.wheels[i].rotation.x=f&&f[7][i]!==undefined?lerpA(r,f[7][i],k):r;});
    e[8].forEach((r,i)=>{if(c.front[i])c.front[i].rotation.y=r;});
    // (the lights flash here as the host's game flashes them, on this guest's own clock)
    const L=e[12]|0,t=NET.now/1000;
    if(c.police&&c.lightR){const on=Math.floor(t*6.5)%2===0,lit=L&1;c.lightR.color.setHex(lit?(on?0xff2a2a:0x501010):0x401010);c.lightB.color.setHex(lit?(on?0x101a50:0x3a7aff):0x101a40);}
    if(c.hazM&&L&2)c.hazM.color.setHex(Math.floor(t*1.7)%2===0?0xffa024:0x3a2408);
    if(c.flash){const on=L&4&&Math.floor(t*5.5)%2===0;c.flash[0].color.setHex(on?0xff2a2a:0x501010);c.flash[1].color.setHex(on?0x303030:(c.veh==='amb'?0xffffff:0x3a7aff));}}
  netShipFrames();
}
// (guest, each step: only what's for show. The host's snapshots do everything else)
function netGuestStep(sdt,first){
  safe('predict',()=>netPredStep(sdt,first));
  safe('weather',()=>updateWeather(sdt));safe('sky',()=>updateSky(sdt));
  safe('parts',()=>updateParts(sdt));safe('rubble',()=>updateRubble(sdt));safe('shocks',()=>{updateShocks(sdt);updateCones(sdt);});
  safe('fires',()=>updateFires(sdt));safe('flecks',()=>updateFlecks(sdt));
  for(const p of players)if(p.active)safe('hud',()=>healthHud(p,sdt));
  if(NETP.on)netPredRecord();
}
// (guest, each frame: the street's dressing near the players, as the host's game does it in updateTraffic, without the traffic)
let netDressT=0,netDressJ=0;
function netGuestDress(dt){
  netDressT-=dt;if(netDressT<=0){netDressT=0.4;netDressJ=0;}
  const fall=netFallingTick(dt);
  if(netDressJ===0||fall)refreshFixtures();if(netDressJ===1)refreshBrandSigns();else if(netDressJ===2)refreshDoors();else if(netDressJ===3)refreshLandmarks();
  if(netDressJ<4)netDressJ++;
  updateDoors(dt);updateLandmarks(dt);headLamps();
  // the venues, run here only so their models are made and kept (quietly: the host's sounds and dust stand in for theirs)
  NET_MUTE=true;try{safe('venues',()=>updateVenues(dt));}finally{NET_MUTE=false;}
  // (and nothing of this game's own is shown: whatever a venue sent out here, the host's game has its own)
  for(const g of goblins)if(!g.net&&g.root.visible)g.root.visible=false;
  for(const c of cars)if(!c.net&&c.g.visible)c.g.visible=false;
}
// guest, on (re)joining a world this tab already built: whatever's changed on the host since that save, put in here too
function netCatchUp(S){
  const ch=new Set(),P=S.ed2||{};
  netCollSeed();for(const k in S.coll||{})netCollapse(k,S.coll[k],ch);   // (buildings that came down meanwhile, before the blocks changed since)
  for(const key in P){const [cx,cz]=key.split(',').map(Number),x0=cx*CS,z0=cz*CS;
    for(const part of P[key].split(';')){const c=part.indexOf(':'),b=+part.slice(0,c);
      for(let o=c+1;o+2<part.length;o+=3){const i=ED64.indexOf(part[o])<<12|ED64.indexOf(part[o+1])<<6|ED64.indexOf(part[o+2]),y=Math.floor(i/(CS*CS)),r=i-y*CS*CS;
        netSetBlock(x0+r%CS,y,z0+Math.floor(r/CS),b,ch);}}}
  if(S.edits)for(const k in S.edits){const [x,y,z]=k.split(',').map(Number);netSetBlock(x,y,z,S.edits[k],ch);}
  if(ch.size)rebuildSet(ch);
  netWorld({coll:S.coll||{},wreck:S.wreck||{},dest:S.dest||{},down:Array.isArray(S.down)?S.down:[]});
}
