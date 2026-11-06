// ---- tiny quaternion helpers ([x,y,z,w]) for the ledge tip ----
const qMul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qInv=a=>[-a[0],-a[1],-a[2],a[3]];
const qAx=(x,y,z,t)=>{const s=Math.sin(t/2);return[x*s,y*s,z*s,Math.cos(t/2)];};
const qRot=(q,v)=>{const p=qMul(qMul(q,[v[0],v[1],v[2],0]),qInv(q));return[p[0],p[1],p[2]];};
const qPow=(q,t)=>{let w=Math.max(-1,Math.min(1,q[3]));let s=1;if(w<0){q=q.map(c=>-c);w=-w;}const ang=2*Math.acos(w),sn=Math.sqrt(Math.max(0,1-w*w));if(sn<1e-6)return[0,0,0,1];return qAx(q[0]/sn,q[1]/sn,q[2]/sn,ang*t);};
// ---- pivot transitions (tipping over a ledge, hauling up over the top, wrapping round corners) ----
// The body's world pose swings from where it was to where it ends up around an edge line E (the lip, the roof edge,
// the corner), so it rolls over the corner instead of cutting through it. The root is solved each frame so that,
// whatever the rig's local pose is doing, root * rig follows that arc exactly, and lands exactly on the final pose.
function rigLocal(p){
  const r=p.rig.rotation,qx=qAx(1,0,0,r.x),qy=qAx(0,1,0,r.y),qz=qAx(0,0,1,r.z);
  return{q:r.order==='ZYX'?qMul(qMul(qz,qy),qx):qMul(qMul(qx,qy),qz),p:[p.rig.position.x,p.rig.position.y,p.rig.position.z]};
}
// After moving onto a new surface the stick keeps meaning "carry on the way you were going", but only while it's
// still held in about the same direction it had at the switch; turn it (or let go) and steering goes straight
// back to normal camera-relative control, no need to lift your thumb
function markStick(p){const m=Math.hypot(p.in.x,p.in.z);p.stickRef=m>0.15?Math.atan2(p.in.x,p.in.z):null;}
function stickHeld(p){
  if(p.stickRef==null)return false;const m=Math.hypot(p.in.x,p.in.z);
  if(m<0.15||Math.abs(wrapA(Math.atan2(p.in.x,p.in.z)-p.stickRef))>0.55){p.stickRef=null;return false;}
  return true;
}
function startPiv(p,o){markStick(p);
  // where the body is right now in the world (last frame's root * rig)
  const L=rigLocal(p),rq=p.rootQ||qAx(0,1,0,p.heading),rp=p.rootP||[p.pos.x,p.pos.y,p.pos.z],lp=qRot(rq,L.p);
  p.piv={t:0,dur:o.dur,E:o.E,q0:qMul(rq,L.q),p0:[rp[0]+lp[0],rp[1]+lp[1],rp[2]+lp[2]],from:[p.pos.x,p.pos.y,p.pos.z],to:o.to,next:o.next,h1:o.heading};
  p.state='piv';p.t=0;p.vy=0;p.mvx=p.mvz=0;p.dashT=0;p.longJump=false;p.grounded=true;p.headOff=0;if(p.visOff)p.visOff.set(0,0,0);
  p.heading=o.heading;
  // the rig goes straight to its end pose; the root swing carries the change in between
  if(o.next==='climb'){p.climbK=1;p.splayK=1;}else{p.climbK=0;p.climbRoll=0;}
}
// leaving the wall into free movement: the body's world pose eases from how it was clinging to however the
// normal animation now wants it (here: facing away, level), turning about the middle of the body as it goes
const BODYC=[0,1.3,0.85];
function startVBlend(p,dur){
  const L=rigLocal(p),rq=p.rootQ||qAx(0,1,0,p.heading),rp=p.rootP||[p.pos.x,p.pos.y,p.pos.z];
  const q0=qMul(rq,L.q),o=qRot(rq,L.p),b=qRot(q0,BODYC);
  p.vb={t:0,dur,q0,rel0:[rp[0]+o[0]+b[0]-p.pos.x,rp[1]+o[1]+b[1]-p.pos.y,rp[2]+o[2]+b[2]-p.pos.z]};
  p.climbK=0;p.climbRoll=0;p.headOff=0;if(p.visOff)p.visOff.set(0,0,0);
}
function poseVBlend(p,dt){
  const V=p.vb;V.t=Math.min(1,V.t+dt/V.dur);const k=V.t*V.t*(3-2*V.t);
  const L=rigLocal(p),rqn=qAx(0,1,0,p.root.rotation.y),qn=qMul(rqn,L.q),R=p.root.position;
  const on=qRot(rqn,L.p),bn=qRot(qn,BODYC),reln=[R.x+on[0]+bn[0]-p.pos.x,R.y+on[1]+bn[1]-p.pos.y,R.z+on[2]+bn[2]-p.pos.z];
  const q=qMul(qPow(qMul(qn,qInv(V.q0)),k),V.q0),bq=qRot(q,BODYC);
  const c=[0,1,2].map(i=>[p.pos.x,p.pos.y,p.pos.z][i]+V.rel0[i]+(reln[i]-V.rel0[i])*k);
  const rq=qMul(q,qInv(L.q)),ol=qRot(rq,L.p);
  p.root.position.set(c[0]-bq[0]-ol[0],c[1]-bq[1]-ol[1],c[2]-bq[2]-ol[2]);
  if(p.root.quaternion.set)p.root.quaternion.set(rq[0],rq[1],rq[2],rq[3]);
  p.rootQ=rq;p.rootP=[p.root.position.x,p.root.position.y,p.root.position.z];
  if(V.t>=1)p.vb=null;
}
function posePiv(p){
  const P=p.piv,k=P.t*P.t*(3-2*P.t),L=rigLocal(p),qr1=qAx(0,1,0,P.h1);
  const q1=qMul(qr1,L.q),l1=qRot(qr1,L.p),p1=[P.to[0]+l1[0],P.to[1]+l1[1],P.to[2]+l1[2]];
  const Q=qMul(q1,qInv(P.q0)),Qt=qPow(Q,k),q=qMul(Qt,P.q0),E=P.E;
  let W;
  if(E==='center'){
    // turn about the middle of the body while that middle glides in a straight line from start to end
    const BC=[0,1.3,0.85],b0=qRot(P.q0,BC),b1=qRot(q1,BC),bt=qRot(q,BC);
    W=[0,1,2].map(i=>{const c0=P.p0[i]+b0[i],c1=p1[i]+b1[i];return c0+(c1-c0)*k-bt[i];});
  } else {
    const rel=[P.p0[0]-E[0],P.p0[1]-E[1],P.p0[2]-E[2]],arc=qRot(Qt,rel),endA=qRot(Q,rel);
    W=[0,1,2].map(i=>E[i]+arc[i]+k*(p1[i]-(E[i]+endA[i])));
  }
  const rq=qMul(q,qInv(L.q)),rl=qRot(rq,L.p);
  p.root.position.set(W[0]-rl[0],W[1]-rl[1],W[2]-rl[2]);
  if(p.root.quaternion.set)p.root.quaternion.set(rq[0],rq[1],rq[2],rq[3]);
  p.rootQ=rq;p.rootP=[p.root.position.x,p.root.position.y,p.root.position.z];
}
// a hippo walking into a garden fence just flattens it (the bit of it his feet are in)
function trampleFences(p){
  if(p.deadT>0)return;const s=Math.sin(p.heading),c=Math.cos(p.heading),ys=[Math.floor(p.pos.y+0.2),Math.floor(p.pos.y+1.1),Math.floor(p.pos.y-0.6)];
  let ch=null,br=null;
  for(const b of [-1.55,-0.7,0,0.7,1.55])for(const a of [-0.75,0,0.75]){const wx=Math.floor(p.pos.x+a*ES*c+b*ES*s),wz=Math.floor(p.pos.z-a*ES*s+b*ES*c);
    for(const y of ys){const v=get(wx,y,wz);if(!v||!BLOCK[v].brittle)continue;
      setRaw(wx,y,wz,AIR);addEdit(wx,y,wz,AIR);(br||(br=[])).push({x:wx,y,z:wz,b:v});ch=ch||new Set();
      for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((wx+ox)/CS),Math.floor((wz+oz)/CS)));}}
  if(br){rebuildSet(ch);save();destroyFX(br,{force:0.6,dx:s,dz:c,up:1},true);noise(0.12,0.12,900,'bandpass');score+=2*br.length;}
}
// Play as Gnash the goblin (picked on the title screen's character select, ui/char-select.js): the same player code runs, with a goblin's abilities and speeds in place of the hippo's for
// the length of the step, so none of the moves need to know. (Walking speed and the hop are what goblins themselves do.)
const GOB_ABIL={bite:true,biteCombo:false,stomp:false,chargeStomp:false,fullStomp:false,groundSpike:false,pound:false,chargePound:false,fullPound:false,jump:true,double:false,triple:false,
  sprint:true,trample:false,dash:false,roll:false,blastDash:false,airDash:false,blastAirDash:false,longJump:false,blastJump:false,rocket:false,climb:true,crash:false,noFall:false};
const GOB_FEET=[[0,0],[.25,.25],[-.25,.25],[.25,-.25],[-.25,-.25]],GOB_WALK=2.8,GOB_RUN=5,GOB_HOP=8.4,GOB_EYE=1.22*ES;
const calmNow=()=>DT.host<2;   // (nobody's after you: enemy hostility is turned down. Playing as a goblin makes no difference: they're after you all the same)
const passiveNow=()=>DT.host===0;   // (and nobody minds you at all, not even when you hit them)
const camPitch=v=>DT.gob?Math.max(-1.5,Math.min(1.5,v)):Math.max(-1.1,Math.min(0.55,v));   // (in first person you can look right up)
function setGob(on){
  if(on===DT.gob)return;if(!on)for(const q of players)if(q.drv)drvExit(q);DT.gob=on;
  HIPPO_PTS=on?GOB_FEET:HIPPO_FEET;P_HX=P_HZ=on?0.38:0.75*ES;if(!on)P_HZ=1.45*ES;P_HY=on?1.35:2.1*ES;
  PB_LAT=on?[-0.38,0,0.38]:[-P_HX*0.95,0,P_HX*0.95];PB_ALONG=on?[-0.38,0,0.38]:[-1.42,-0.5,0.5,1.42].map(v=>v*ES);
  // (head height only: a block at the feet is a step up, and walking on to it is the ground's business)
  PB_YS=on?[1.1,1.3]:[1.25*ES,1.95*ES];
  for(const p of players){p.rig.visible=!on;p.cam.pitch=camPitch(p.cam.pitch);if(p.lockT)setLock(p,null);
    if(!p.active||p.state==='dead')continue;
    // (whatever the hippo was halfway through stops here)
    if(on){if(p.state!=='walk'&&p.state!=='climb'){p.state='walk';p.t=0;p.vb=null;p.piv=null;}
      p.dodge=null;p.dashT=0;p.lungeT=0;p.biteT=0;p.biteHit=false;p.lurch=null;p.mvx=p.mvz=0;p.carryV=0;p.rocket=false;p.longJump=false;p.blastJ=false;p.airJumps=0;p.qStomp=p.qDodge=0;}
    else if(p.state==='walk')bodyFree(p);}
  for(const p of players)dressHippo(p);   // (the names on the HUD)
  renderTime();
}
function updatePlayer(p,dt){
  if(!DT.gob||SBX)return movePlayer(p,dt);
  if(drvTick(p,dt))return;   // (in a vehicle: it does the moving. See drvTick)
  if(p.state==='walk')p.heading=p.cam.yaw+Math.PI;   // (a body faces wherever you look)
  const A0=Object.assign({},ABIL),w=AB.walk.speed,r=AB.trample.speed,j=AB.jump.launch;
  Object.assign(ABIL,GOB_ABIL);AB.walk.speed=GOB_WALK;AB.trample.speed=GOB_RUN;AB.jump.launch=GOB_HOP;
  try{movePlayer(p,dt);}finally{Object.assign(ABIL,A0);AB.walk.speed=w;AB.trample.speed=r;AB.jump.launch=j;}
}
// the attack button swings the club: one goblin's blow, in front of you
function gobClub(p){
  const hx=Math.sin(p.heading),hz=Math.cos(p.heading),fx=p.pos.x+hx*1.1,fz=p.pos.z+hz*1.1;
  hitGoblins(fx,fz,1,1,'Clubbed by another goblin',p.pos.y);
  for(const c of carsNear(fx,fz,1,p.pos.y)){damageCar(c,1,new V3(hx,0,hz));clang();}
}
// a goblin for others to see (the other player, or you from the free cam), and your own arm and club for you
function gobKit(p){
  if(p.gb)return p.gb;
  const root=new THREE.Group();root.rotation.order='YXZ';root.visible=false;root.scale.setScalar(ES);scene.add(root);
  const m=goblinModel(root,{tunic:p.idx?0xa83232:0x3a5f8a});
  // (drawn last and over everything, so it never pokes through a wall you're stood against)
  const vm=new THREE.Group();vm.rotation.order='YXZ';vm.visible=false;vm.scale.setScalar(0.5);scene.add(vm);
  const arm=new THREE.Group();arm.position.set(0.52,-0.62,-0.72);vm.add(arm);
  const mat=c=>new THREE.MeshLambertMaterial({color:c,transparent:true,depthTest:false,depthWrite:false});
  const box=(w,h,d,c,x,y,z,o)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));b.position.set(x,y,z);b.renderOrder=o;b.frustumCulled=false;arm.add(b);};
  box(0.11,0.11,0.42,GC.skin,0,0,-0.2,60);box(0.07,0.42,0.07,GC.club,0,0.17,-0.42,61);box(0.15,0.17,0.15,GC.club,0,0.42,-0.42,62);
  return p.gb={root,m,vm,arm};
}
// the first-person view, and the body that goes with it
function gobCamera(p){
  const K=gobKit(p),lie=p.state==='dead'?Math.min(1,p.t*3):0,walking=p.state==='walk'&&p.grounded&&p.lastSp>0.2,sn=Math.sin(p.phase),v=p.visOff;
  p.camHang=(p.camHang||0)+((p.state==='ceil'||(p.state==='piv'&&p.piv&&p.piv.next==='ceil')?1:0)-(p.camHang||0))*0.12;
  const eye=GOB_EYE*(1-0.75*lie)-2.2*ES*p.camHang+(walking?Math.abs(sn)*0.04:0),c=p.camera.position;
  c.set(p.pos.x+(v?v.x:0),p.pos.y+(v?v.y:0)+eye,p.pos.z+(v?v.z:0));p.camera.rotation.set(p.cam.pitch,p.cam.yaw,lie*1.2);
  if(p.shake>0.002&&gameSpeed()>0){c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
  const sw=p.biteT>0?1-p.biteT/(p.biteDur||0.38):0;
  K.root.position.set(p.pos.x,p.pos.y+lie*0.15,p.pos.z);K.root.rotation.set(-lie*Math.PI/2,p.heading,0);
  K.m.legs[0].rotation.x=walking?sn*0.7:0;K.m.legs[1].rotation.x=walking?-sn*0.7:0;K.m.arm.rotation.x=sw>0?-0.5-1.9*Math.sin(sw*Math.PI):-0.5;
  // up and back until the blow lands (with the bite's own timing), down hard, and slowly back to the rest
  const raise=sw<0.42?1.1*sw/0.42:sw<0.55?1.1-1.7*(sw-0.42)/0.13:-0.6+0.6*(sw-0.55)/0.45;
  K.arm.rotation.x=0.08+raise+(walking?sn*0.03:0);K.arm.position.y=-0.62+(walking?Math.abs(sn)*0.012:0);
}
// who's seen from this view: everyone's goblin but your own, unless the free cam has left it
function gobView(v){
  for(const q of players){if(!q.gb)continue;
    const me=q===v&&!(DT.freecam&&v===P1);
    q.gb.root.visible=DT.gob&&q.active&&!me&&!q.drv;q.gb.vm.visible=DT.gob&&q.active&&me&&q.state!=='dead'&&!q.drv;   // (in a vehicle you're out of sight)
    if(q.gb.vm.visible){q.gb.vm.position.copy(v.camera.position);q.gb.vm.rotation.set(v.camera.rotation.x,v.camera.rotation.y,v.camera.rotation.z);}}
}
