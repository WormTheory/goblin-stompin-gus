// ---------- Online co-op: what the host sends, and how a guest shows it ----------
// A snapshot {t:'s'} goes to each guest NET_SNAP_HZ times a second: the players (every plain value on them that's
// changed since the last one, their place, and the pose of each joint), the goblins and vehicles near that guest (place
// and pose, with how each looks sent once), anything that happened meanwhile as events (blocks smashed or built, dust,
// sounds, messages), the fires, and now and then the clock, the weather and what's been wrecked.
// A guest draws everything NET_DELAY behind the host, blending between the two snapshots either side, so movement is
// smooth whatever the network's doing; one-off events happen as the snapshot they came in becomes the one shown.
const r3=v=>Math.round(v*1000)/1000;
const NETM={g:new Map(),c:new Map()};   // (guest: the host's goblins and vehicles, by the host's number for them)
let NET_FXD=0,NET_APPLY=false,NET_MUTE=false;   // (NET_MUTE: a guest's own run of the venues, whose noise and dust the host's are standing in for)

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
    else continue;   // (objects: what he's holding, riding or locked on to are sent their own way, or not at all)
    const o=sent[k];if(o===e||Array.isArray(e)&&Array.isArray(o)&&o[0]===e[0]&&o[1]===e[1]&&o[2]===e[2])continue;
    f[k]=e;sent[k]=e;}
  const lk=p.lockT?netRef(p.lockT):null;
  const e={s:seat,who:p.who,gob:!!p.gob,act:!!p.active,f,pos:[r3(p.pos.x),r3(p.pos.y),r3(p.pos.z)],h:r3(p.heading),pose:netPoseOf(netJoints(p)),lk,
    rd:!!(p.drv||p.rideC||p.standCar||p.vcl||p.jackA)};   // (driving, riding or clinging to something that moves: the guest can't guess that, so it doesn't try)
  // (the guest's own seat: the last of its controls this took in, and how long ago, so it can tell how far its own guess has drifted)
  if(p.net&&p.net.seat===seat){e.ack=N.inN||0;e.adt=Math.round(NET.now-(N.inAt||NET.now));}
  return e;
}
// (something a player can be locked on to, as both ends can name it)
function netRef(o){let i=goblins.indexOf(o);if(i>=0)return['g',i];i=cars.indexOf(o);if(i>=0)return['c',i];return null;}
function netDeref(r){if(!r)return null;return r[0]==='g'?NETM.g.get(r[1])||null:r[0]==='c'?NETM.c.get(r[1])||null:null;}
// (guest: which of its players is that seat. Its own is P1; anyone else is drawn as P2)
const netSeatP=s=>s===NET.seat?P1:P2;

// ---- goblins and vehicles ----
const netLookOf=new WeakMap();let netLookN=0;
const netCol=c=>((Math.round(c.r*255)&255)<<16)|((Math.round(c.g*255)&255)<<8)|(Math.round(c.b*255)&255);
function netGoblins(p,N,out,looks){
  const R=170,px=p.pos.x,pz=p.pos.z;
  for(let i=0;i<goblins.length;i++){const g=goblins[i],r=g.root;if(!r.visible||Math.abs(r.position.x-px)>R||Math.abs(r.position.z-pz)>R)continue;
    const P=r.position,Q=r.rotation;
    out.push([i,r3(P.x),r3(P.y),r3(P.z),r3(Q.x),r3(Q.y),r3(Q.z),r3(r.scale.x),r3(r.scale.y),r3(g.legs[0].rotation.x),r3(g.legs[1].rotation.x),r3(g.arm.rotation.x),r3(g.armL.rotation.x),r3(g.head.rotation.z),g.orb&&g.orb.visible?1:0,g.state]);
    const L=g.id&&g.id.look;if(!L)continue;let v=netLookOf.get(g.id);if(!v){v=++netLookN;netLookOf.set(g.id,v);}
    if(N.looks.get(i)!==v){N.looks.set(i,v);looks[i]={o:r.netOpt||(g.civ?{club:false}:{}),civ:!!g.civ,L,id:{name:g.id.name,occ:g.id.occ,age:g.id.age}};}}
}
function netCars(p,N,out,cfg){
  const R=220,px=p.pos.x,pz=p.pos.z;
  for(let i=0;i<cars.length;i++){const c=cars[i],G=c.g;if(!G.visible||Math.abs(G.position.x-px)>R||Math.abs(G.position.z-pz)>R)continue;
    const P=G.position,Q=G.rotation,w=[],f=[];for(const s of c.wheels)w.push(r3(s.rotation.x));for(const s of c.front)f.push(r3(s.rotation.y));
    out.push([i,r3(P.x),r3(P.y),r3(P.z),r3(Q.x),r3(Q.y),r3(Q.z),w,f,c.dh&&c.dh.visible?1:0,c.hazG&&c.hazG.visible?1:0,c.alive?1:0]);
    const k=c.veh+'|'+netCol(c.paint.color)+'|'+(c.police?1:0);if(N.cars.get(i)!==k){N.cars.set(i,k);cfg[i]=[c.veh,netCol(c.paint.color),c.police?1:0,!!c.hunter];}}
}

// ---- the venues' moving models: trains, planes, boats, rides, animals, base vehicles... ----
// A guest runs its own venues (so the models are made, from the same world, just as the host's are), quietly, and then
// every joint the host has sent is put where the host has it. Each model's joints are named by venue, field, place in
// the list and order in the model, which come out the same on both ends; a joint's sent again only when it's moved.
function netVenueModels(f){
  for(const [vk,V] of venues)for(const k in V){const x=V[k];if(!x||typeof x!=='object')continue;
    if(x.isObject3D)f(vk+'|'+k,x);
    else if(Array.isArray(x)&&x.length&&x[0]&&(x[0].isObject3D||x[0].g&&x[0].g.isObject3D))x.forEach((e,i)=>{const o=e&&e.isObject3D?e:e&&e.g;if(o&&o.isObject3D)f(vk+'|'+k+'|'+i,o);});}
  for(const [tk,T] of TRAINS)if(T.cars)T.cars.forEach((g,i)=>{if(g&&g.isObject3D)f('T'+tk+'|'+i,g);});
}
// (a model's joints: itself and everything in it that isn't a plain box, up to a limit)
function netNodes(o,out){out.push(o);for(let i=0;i<out.length&&out.length<80;i++){const c=out[i].children;if(c)for(const ch of c)if(!ch.isMesh||ch.children.length||ch.isInstancedMesh===false)out.push(ch);}return out;}
function netVenues(p,N,out){
  const R=330,px=p.pos.x,pz=p.pos.z,sent=N.vsent||(N.vsent=new Map());
  netVenueModels((key,o)=>{const P=o.position;if(Math.abs(P.x-px)>R||Math.abs(P.z-pz)>R)return;
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
  return v.$p===NET.seat?P1:P2;}const o={};for(const k in v)o[k]=netUnsan(v[k]);return o;}
function netEmit(e){for(const p of NET.guests.values()){const out=p.net.out;if(out.length<4000)out.push(e);}}
// the effects passed on: when the host's game calls one (and not from inside another), each guest makes the same call
const NET_FX={};
function netFx(name,f){
  NET_FX[name]=f;
  // (named as the one it wraps: the debug Sound list reads names off the stack to say what made a sound)
  return {[name](...a){
    if(NET_MUTE)return;
    if(NET.mode===1&&NET_FXD===0&&NET.guests.size){try{netEmit(['f',name,a.map(x=>netSan(x,0))]);}catch(e){}}
    NET_FXD++;try{return f.apply(this,a);}finally{NET_FXD--;}
  }}[name];
}
puff=netFx('puff',puff);smoke=netFx('smoke',smoke);blood=netFx('blood',blood);splat=netFx('splat',splat);
destroyFX=netFx('destroyFX',destroyFX);shockwave=netFx('shockwave',shockwave);shockCone=netFx('shockCone',shockCone);blastFx=netFx('blastFx',blastFx);
tone=netFx('tone',tone);noise=netFx('noise',noise);woosh=netFx('woosh',woosh);
// (a message for one player goes to that player only; one for everyone, to everyone)
{const fl=flashLabel;NET_FX.flashLabel=fl;flashLabel=function flashLabel(s,who){
  if(NET_MUTE)return;
  if(NET.mode===1&&NET.guests.size){const seat=who?players.indexOf(who):-1;if(seat!==0)netEmit(['f','flashLabel',[s,seat>0?{$p:seat}:null]]);}
  return fl(s,who&&who.net&&NET.mode===1?null:who);};}
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
  J('coll',collapses);J('wreck',wrecked);J('down',[...downFix]);J('dest',destroyed);
  J('fire',fires.map(F=>[r3(F.x),r3(F.y),r3(F.z),r3(F.r),Math.round(F.t*10)/10,Math.round(F.life*10)/10,F.flames?1:0,r3(F.sm),r3(F.rise),F.douse?1:0]));
  return out;
}
function netClock(){return{tod,dayN,clockT,tc:trafficClock,wc:wxClock,wx:{type:WX.type,until:WX.until,k:Object.assign({},WX.k),wet:WX.wet,snowCover:WX.snowCover,snowClock:WX.snowClock,frozen:!!WX.frozen},host:DT.host};}
function netClockSet(k){if(!k)return;tod=k.tod;dayN=k.dayN;clockT=k.clockT;trafficClock=k.tc;wxClock=k.wc;if(k.wx){const w=k.wx;WX.type=w.type;WX.until=w.until;Object.assign(WX.k,w.k);WX.wet=w.wet;WX.snowCover=w.snowCover;WX.snowClock=w.snowClock;WX.frozen=w.frozen;}
  if(k.host!==undefined&&k.host!==DT.host){DT.host=k.host;try{syncHost();}catch(e){}}}

// ---- host: one guest's snapshot ----
function netSendSnap(p){
  const N=p.net;if(!N.wsent)N.wsent={};
  const m={t:'s',n:++N.seq,tt:NET.now,p:[],g:[],gl:{},c:[],cl:{},e:N.out};N.out=[];
  for(let s=0;s<players.length;s++){const q=players[s];if(q.active)m.p.push(netPlayerState(q,s,N));}
  netGoblins(p,N,m.g,m.gl);netCars(p,N,m.c,m.cl);m.v=[];netVenues(p,N,m.v);m.fa=netFalls();m.sc=[score,kills];
  N.wT=(N.wT||0)-1;if(N.wT<=0){N.wT=NET_SNAP_HZ;m.w=netWorldBits(N);m.k=netClock();}
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
const NET_AUTH=['hp','deadT','hurtFx','regenT','hurt','stam','exhausted','lastHit','killer','score'];   // (what's always the host's to say, guessing or not)
const NETP={on:false,hist:[],sent:new Map(),corr:new V3(),snap:false};
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
  NET_MUTE=true;try{updatePlayer(P1,sdt);}catch(e){}finally{NET_MUTE=false;}
}
// each frame: ease off whatever's left of a correction
function netPredEase(dt){
  const c=NETP.corr;if(!c.x&&!c.y&&!c.z)return;const k=Math.min(1,dt*10);
  P1.pos.x+=c.x*k;P1.pos.y+=c.y*k;P1.pos.z+=c.z*k;c.x-=c.x*k;c.y-=c.y*k;c.z-=c.z*k;if(Math.abs(c.x)+Math.abs(c.y)+Math.abs(c.z)<0.002)c.set(0,0,0);
}

// ---- guest ----
function netGotSnap(m){
  if(!Number.isFinite(m.tt))return;
  // (how far the host's clock is from ours: the smallest gap seen lately, so a slow message never drags the picture back)
  const gap=NET.now-m.tt;if(NET.off===null||gap<NET.off)NET.off=gap;else NET.off+=(gap-NET.off)*0.01;
  try{netPredCheck(m);}catch(e){}
  NET.q.push(m);
  if(NET.q.length>40)NET.q.splice(0,NET.q.length-40);
}
// the host's game takes over: the city's own goblins and traffic stand down, and both hippos are the host's to move
function netGuestBegin(h){
  for(const g of goblins){g.state='wait';g.root.visible=false;}
  for(const c of cars){c.alive=false;c.g.visible=false;}
  for(const [,g] of NETM.g)g.root.visible=false;for(const [,c] of NETM.c)c.g.visible=false;
  NET.q.length=0;NET.cur=null;NET.off=null;NETP.on=false;NETP.snap=false;NETP.hist.length=0;NETP.corr.set(0,0,0);
  P1.net={mirror:true,seat:NET.seat};P2.net={mirror:true,seat:0};
  if(h){P2.who=h.who?1:0;setGobP(P2,!!h.gob);}
  P2.active=true;P2.root.visible=!P2.gob;P2.paused=false;dressHippo(P2);dressHippo(P1);
  coop=false;layout();startPlay('net');
}
function netGob(id,o){
  let g=NETM.g.get(id);if(g)return g;
  const root=new THREE.Group();root.rotation.order='YXZ';
  const m=goblinModel(root,Object.assign({},o,{shareGeo:true}));
  g={snowU:m.snowU,root,legs:m.legs,head:m.head,arm:m.arm,armL:m.armL,mats:m.mats,roles:m.roles,acc:m.acc,orb:m.orb||null,pos:new V3(),kv:new V3(),stun:0,heading:0,vy:0,hp:4,state:'net',t:0,phase:0,atk:1,hurt:0,sink:0,detour:0,detourH:0,stuck:0,civ:false,net:true,id:null};
  root.visible=false;root.scale.setScalar(ES);goblins.push(g);NETM.g.set(id,g);return g;
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
  for(const e of m.p){const q=netSeatP(e.s);if(!q)continue;
    if(q===P2&&!e.act){q.active=false;q.root.visible=false;continue;}
    if(e.gob!==!!q.gob)setGobP(q,e.gob);if(e.who!==q.who){q.who=e.who;dressHippo(q);}
    const own=q===P1&&NETP.on&&!NETP.snap;
    for(const k in e.f){if(own&&!NET_AUTH.includes(k))continue;const v=e.f[k];if(Array.isArray(v)){if(q[k] instanceof V3)q[k].set(v[0],v[1],v[2]);else q[k]=new V3(v[0],v[1],v[2]);}else q[k]=netDec(v);}
    if(!(q===P1&&NETP.on))q.lockT=netDeref(e.lk);
    if(q===P1&&NETP.snap){NETP.snap=false;NETP.corr.set(0,0,0);NETP.hist.length=0;q.pos.set(e.pos[0],e.pos[1],e.pos[2]);q.heading=e.h;}
  }
  for(const i in m.gl){const G=m.gl[i],g=netGob(+i,G.o);g.civ=G.civ;try{applyLook(g,G.L,ES);}catch(e){}g.id=Object.assign({look:G.L},G.id);}
  for(const i in m.cl)netCar(+i,m.cl[i]);
  const seenG=new Set(),seenC=new Set();
  for(const e of m.g){const g=NETM.g.get(e[0]);if(!g)continue;seenG.add(g);g.state=e[15];g.root.visible=true;if(g.orb)g.orb.visible=!!e[14];}
  for(const [,g] of NETM.g)if(!seenG.has(g)){g.root.visible=false;g.state='net';}
  for(const e of m.c){const c=NETM.c.get(e[0]);if(!c)continue;seenC.add(c);c.g.visible=true;c.alive=!!e[11];if(c.dh)c.dh.visible=!!e[9];if(c.hazG)c.hazG.visible=!!e[10];}
  for(const [,c] of NETM.c)if(!seenC.has(c)){c.g.visible=false;c.alive=false;}
  // the events, in the order they happened
  const ch=new Set();
  for(const e of m.e){
    if(e[0]==='e'){const L=e[1];for(let i=0;i+3<L.length;i+=4)netSetBlock(L[i],L[i+1],L[i+2],L[i+3],ch);}
    else if(e[0]==='t'||e[0]==='b'){try{netFallMake(e);}catch(er){}}
    else if(e[0]==='f'){const f=NET_FX[e[1]];if(!f)continue;if(ch.size){rebuildSet(ch);ch.clear();}
      if(e[1]==='flashLabel'){const who=e[2][1]?netUnsan(e[2][1]):null;f(e[2][0],who);continue;}
      try{f(...e[2].map(netUnsan));}catch(er){}}}
  if(ch.size)rebuildSet(ch);
  netFallCommit(m);
  if(m.v)netVenueCommit(m.v,NET.now-NET.off-NET_DELAY);
  if(m.sc){score=m.sc[0];kills=m.sc[1];}
  if(m.w)netWorld(m.w);
  if(m.k)netClockSet(m.k);
  NET.cur=m;
}
function netWorld(w){
  if(w.coll)collapses=w.coll;if(w.wreck)wrecked=w.wreck;if(w.dest){destroyed=w.dest;destroyVer++;}
  if(w.down){downFix.clear();for(const [k,v] of w.down)downFix.set(k,v);trafficRefreshT=0;}
  if(w.fire){fires.length=0;for(const f of w.fire)fires.push({x:f[0],y:f[1],z:f[2],r:f[3],t:f[4],life:f[5],base:f[5],born:playTime,flames:!!f[6],acc:0,sacc:0,hurt:9,sm:f[7],rise:f[8],douse:!!f[9],blame:null});}
}
// every frame: show the host's game as it was NET_DELAY ago, blended between the snapshots either side
function netGuestFrame(dt){
  if(NET.off===null)return;
  const rt=NET.now-NET.off-NET_DELAY,Q=NET.q;
  // (fallen far behind -- a stall, a tab in the background: catch up rather than play it all out slowly)
  while(Q.length>6)netCommit(Q.shift());
  while(Q.length&&Q[0].tt<=rt)netCommit(Q.shift());
  const a=NET.cur;if(!a)return;const b=Q[0],k=b&&b.tt>a.tt?Math.max(0,Math.min(1,(rt-a.tt)/(b.tt-a.tt))):0;
  for(const e of a.p){const q=netSeatP(e.s);if(!q||!q.active)continue;if(q===P1&&NETP.on){netPredEase(dt);continue;}const f=b&&b.p.find(x=>x.s===e.s);
    const P=e.pos,P2b=f?f.pos:P;q.pos.set(P[0]+(P2b[0]-P[0])*k,P[1]+(P2b[1]-P[1])*k,P[2]+(P2b[2]-P[2])*k);
    q.heading=f?lerpA(e.h,f.h,k):e.h;netPoseSet(netJoints(q),e.pose,f&&f.pose,k);}
  const bg=new Map(),bc=new Map();if(b){for(const e of b.g)bg.set(e[0],e);for(const e of b.c)bc.set(e[0],e);}
  for(const e of a.g){const g=NETM.g.get(e[0]);if(!g)continue;const f=bg.get(e[0]),v=n=>f?e[n]+(f[n]-e[n])*k:e[n],w=n=>f?lerpA(e[n],f[n],k):e[n];
    g.root.position.set(v(1),v(2),v(3));g.root.rotation.set(w(4),w(5),w(6));g.root.scale.set(v(7),v(8),v(7));g.pos.copy(g.root.position);g.heading=g.root.rotation.y;
    g.legs[0].rotation.x=w(9);g.legs[1].rotation.x=w(10);g.arm.rotation.x=w(11);g.armL.rotation.x=w(12);g.head.rotation.z=w(13);}
  netVenuePose(rt);netFallPose(a,b,k);
  for(const e of a.c){const c=NETM.c.get(e[0]);if(!c)continue;const f=bc.get(e[0]),v=n=>f?e[n]+(f[n]-e[n])*k:e[n],w=n=>f?lerpA(e[n],f[n],k):e[n];
    c.g.position.set(v(1),v(2),v(3));c.g.rotation.set(w(4),w(5),w(6));c.pos.copy(c.g.position);c.heading=c.g.rotation.y;
    e[7].forEach((r,i)=>{if(c.wheels[i])c.wheels[i].rotation.x=f&&f[7][i]!==undefined?lerpA(r,f[7][i],k):r;});
    e[8].forEach((r,i)=>{if(c.front[i])c.front[i].rotation.y=r;});}
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
  if(netDressJ===0)refreshFixtures();else if(netDressJ===1)refreshBrandSigns();else if(netDressJ===2)refreshDoors();else if(netDressJ===3)refreshLandmarks();
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
  for(const key in P){const [cx,cz]=key.split(',').map(Number),x0=cx*CS,z0=cz*CS;
    for(const part of P[key].split(';')){const c=part.indexOf(':'),b=+part.slice(0,c);
      for(let o=c+1;o+2<part.length;o+=3){const i=ED64.indexOf(part[o])<<12|ED64.indexOf(part[o+1])<<6|ED64.indexOf(part[o+2]),y=Math.floor(i/(CS*CS)),r=i-y*CS*CS;
        netSetBlock(x0+r%CS,y,z0+Math.floor(r/CS),b,ch);}}}
  if(S.edits)for(const k in S.edits){const [x,y,z]=k.split(',').map(Number);netSetBlock(x,y,z,S.edits[k],ch);}
  if(ch.size)rebuildSet(ch);
  netWorld({coll:S.coll||{},wreck:S.wreck||{},dest:S.dest||{},down:Array.isArray(S.down)?S.down:[]});
}
