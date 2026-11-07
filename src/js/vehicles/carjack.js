// ---- Play as a goblin: stealing a vehicle with someone in it. Getting into one that has a driver plays out a carjacking
// first: you go to the door (or climb up to the hatch), get it open, haul the driver out and throw them clear, and climb
// in. Each vehicle does it its own way: a car's door swings open, a motorcycle's rider is shoved off the side, a tank's
// crewman is dragged up out of the turret hatch, a helicopter's door slides back. Whoever's thrown out is the right sort
// for the vehicle (a soldier out of a tank or a helicopter, an officer out of a police car, the driver out of anything
// else) and comes back at you or runs for it (D.jack while it plays: see drvTick and drvSeat) ----
const JACK_T={door:1.9,bike:1.35,tank:2.4,heli:2.0};
const JACK_NOIN={x:0,z:0,bite:false,bitePress:false,stomp:false,lockPress:false,use:false,jump:false,climb:false};
// what you drive with: nothing, while the carjacking's still playing out
const drvIn=p=>p.drv&&p.drv.jack?JACK_NOIN:p.in;
// is there anyone at the controls to throw out?
function jackable(D){const o=D.o;
  if(D.k==='car')return!!((o.driver||o.crew&&o.crew.drv)&&o.dh&&o.dh.visible&&!o.left);
  if(D.k==='tank'||D.k==='heli')return!o.dead&&o.state!=='idle'&&!!o.crew;   // (left standing by a goblin who drove it, or never yet crewed: empty)
  return false;
}
// the soldiers that crew the bases' tanks and helicopters, once they're out on foot (added to the compounds' kinds of foe)
function jackKinds(){if(!FOES.soldier)FOES.soldier={name:'Soldier',label:'Soldier killed',tunic:0x4a5a2a,pants:0x2a3018,hat:'hardhat',hatc:0x3a4a22,gear:'rifle',held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:3.0,
  melee:[1,1.2,'Clubbed with a rifle butt'],gun:[3,50,0.5,[1.1,1.9],1,'Shot by a soldier'],jobs:['Tank crewman','Gunner','Driver','Corporal','Private first class','Helicopter pilot']};}
// the goblin you are, as everyone sees you while you do it (in a vehicle your own body's out of sight: see gobView)
function jackActor(p){
  if(p.jackA)return p.jackA;
  const root=new THREE.Group();root.rotation.order='YXZ';root.visible=false;root.scale.setScalar(ES);scene.add(root);
  const m=goblinModel(root,{tunic:p.idx?0xa83232:0x3a5f8a});
  return p.jackA={root,m};
}
// a piece of the vehicle that opens: a hinged car door, a sliding helicopter door, the tank's hatch lid
function jackDoor(D,J){
  const o=D.o,mk=(m,w,h,d,x,y,z,par)=>{const b=new THREE.Mesh(boxGeo(w,h,d),m);b.position.set(x,y,z);par.add(b);return b;};
  if(J.kind==='door'){const V=VEH[o.veh],hz=V.hz,L=Math.min(1.25,hz*0.55),hy=Math.min(1.1,V.hy*0.5),zf=Math.min(hz-0.2,V.head[2]+0.75);
    const hinge=new THREE.Group();hinge.position.set(J.s*(V.hx+0.03),0,zf);o.vehG[o.veh].g.add(hinge);
    mk(o.paint,0.07,hy,L,0,V.head[1]-0.55,-L/2,hinge);if(V.hy>1.5)mk(smat(CARC.glass),0.075,Math.min(0.5,V.hy-hy-0.6),L*0.8,0,V.head[1]-0.55+hy/2+0.3,-L*0.5,hinge);
    return{g:hinge,par:o.vehG[o.veh].g,open:k=>{hinge.rotation.y=-J.s*1.25*k;}};}
  if(J.kind==='heli'){const g=new THREE.Group();g.position.set(J.s*0.93,0,0);o.g.add(g);mk(MILM.olive,0.08,1.2,1.3,0,1.5,1.2,g);mk(MILM.glass,0.09,0.45,0.8,0,1.75,1.2,g);
    return{g,par:o.g,open:k=>{g.position.z=-1.4*k;g.position.x=J.s*(0.93+0.08*Math.min(1,k*4));}};}
  if(J.kind==='tank'){const g=new THREE.Group();g.position.set(0.5,1.12,-0.75);o.tur.add(g);mk(MILM.olive,0.7,0.1,0.7,0,0,0.35,g);
    return{g,par:o.tur,open:k=>{g.rotation.x=-1.9*k;}};}
  return null;
}
// where things are on the vehicle, in the world: (a across, b up, c along) from its middle at the base
function jackAt(D,a,b,c){const S=drvPose(D),rx=Math.cos(S.h),rz=-Math.sin(S.h),fx=Math.sin(S.h),fz=Math.cos(S.h);return{x:S.x+rx*a+fx*c,y:S.y+b,z:S.z+rz*a+fz*c};}
// who's at the controls, now on foot: out of the right pool, dressed for it, held in the seat till they're thrown out
function jackVictim(D,J){
  const o=D.o;let g=null,how='flee',occ=null,name=null;
  const free=f=>goblins.find(q=>q.state==='wait'&&f(q));
  // (nobody spare in the pool: the furthest one about, out of sight, is taken for it)
  const take=f=>free(f)||goblins.filter(q=>q.state==='chase'&&f(q)&&!q.medic&&!q.ff&&!q.news&&!q.cop).sort((a,b)=>Math.hypot(b.pos.x-o.pos.x,b.pos.z-o.pos.z)-Math.hypot(a.pos.x-o.pos.x,a.pos.z-o.pos.z))[0]||null;
  const hostile=q=>!q.civ&&!q.special&&!q.staff,civ=q=>q.civ&&!q.staff;
  if(D.k==='tank'||D.k==='heli'){jackKinds();g=freeFoe('soldier',8);if(g){foeSpawn(g,'soldier',null,0);g.id.occ=D.k==='heli'?'Helicopter pilot':pick(['Tank crewman','Tank commander','Gunner','Tank driver']);if(o.crew&&o.crew!==MIL_CREW[D.k])g.id=o.crew;how='fight';}o.crew=null;}
  // (a militia vehicle: its own driver, a militiaman, comes out fighting, and its gunner jumps off the back: see crews.js)
  else if(o.crew){const k=o.crew.k;g=freeFoe(k,24);if(g){foeSpawn(g,k,null,0);if(o.crew.drv)g.id=o.crew.drv;how='fight';}crewBail(o);}
  else{const dr=o.driver||{};name=dr.name;occ=dr.occ;
    if(o.police){g=take(hostile);how='fight';}
    else{how=o.svcPool||Math.random()<0.62?'flee':'fight';g=take(how==='flee'?civ:hostile)||take(how==='flee'?hostile:civ);if(g)how=g.civ?'flee':'fight';}
    if(g){g.vendor=null;g.indoor=false;g.employer=null;g.homeV=null;g.cop=null;g.inv=false;g.wt=null;g.idle=0;g.fleeing=false;g.alert=false;g.trip=null;g.stUp=undefined;
      const L=dressGoblin(g);
      if(o.police){L.tunic=0x1c2a5a;L.pants=0x1c2a5a;L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','apron','eyepatch'].includes(k));L.hatType='cap';L.hat=0x1c2a5a;L.show.push('cap');L.hatShown=L.hat;applyLook(g,L,ES);}
      g.id=makeIdentity(g,L);if(name){g.id.name=name;g.id.age=dr.age||g.id.age;g.id.occ=occ;g.id.hobby=dr.hobby||g.id.hobby;g.id.quirk=dr.quirk||g.id.quirk;}
      g.hp=g.hpMax=g.civ?3:4;g.atk=1;g.arm.rotation.x=0;g.armL.rotation.x=0;}}
  if(!g)return null;
  g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=99;g.detour=0;g.stuck=0;g.act=null;g.root.visible=true;g.root.rotation.set(0,0,0);g.fallTop=undefined;
  {const se=jackSeat(D,J),at=jackAt(D,se.a,se.b,se.c);g.pos.set(at.x,at.y,at.z);g.root.position.copy(g.pos);}g.navOn=false;   // (in the seat from the start: see jackPose)
  g.jackHow=how;return g;
}
// getting in, when there's someone at the controls: it starts here, and drvTick and drvSeat play it out
function jackStart(p,D){
  const o=D.o,S=drvPose(D),kind=D.k==='car'?(o.veh==='bike'||o.veh==='quad'?'bike':'door'):D.k;
  // (the driver's side: a car's driver sits to one side, so that; a tank or a helicopter, whichever side you came up on)
  const lx=(p.pos.x-S.x)*Math.cos(S.h)-(p.pos.z-S.z)*Math.sin(S.h);
  const s=kind==='door'?(VEH[o.veh].head[0]<0?-1:1):lx<0?-1:1;
  const J={kind,s,t:0,T:JACK_T[kind],x0:p.pos.x,y0:p.pos.y,z0:p.pos.z,thrown:false,grabbed:false,v:null};
  J.door=jackDoor(D,J);D.jack=J;
  const A=jackActor(p);A.root.visible=true;A.root.position.set(p.pos.x,p.pos.y,p.pos.z);
  if(D.k==='car'){o.hunter=false;o.speed*=0.3;}
  flashLabel((D.k==='car'?(o.police?'Carjacking a police car':'Carjacking the '+drvName(D)):'Hijacking the '+drvName(D))+'!',p);
}
// the seat (where the driver's feet are, a/b/c as in jackAt) and the spot just outside it you work from
function jackSeat(D,J){const o=D.o;
  if(J.kind==='door'||J.kind==='bike'){const V=VEH[o.veh];return{a:V.head[0]*ES,b:(V.head[1]-0.71)*ES,c:V.head[2]*ES};}
  if(J.kind==='tank'){const T=Math.cos(o.tu),U=Math.sin(o.tu);return{a:(0.5*T-0.35*U),b:2.1,c:(-0.3+(-0.4)*T-0.5*U)};}   // (the hatch, on the turret as it's turned)
  return{a:J.s*0.4,b:0.85,c:1.4};}
function jackOut(D,J){const S=drvPose(D);
  if(J.kind==='tank')return{a:J.s*1.3,b:S.hy*0.76,c:-0.4};   // (up on the hull, beside the turret)
  if(J.kind==='door'){const V=VEH[D.o.veh];return{a:J.s*(S.hx+0.75),b:0,c:Math.min(S.hz-0.4,V.head[2]*ES+0.2)};}
  return{a:J.s*(S.hx+0.7),b:0,c:J.kind==='heli'?1.2:0};}
const jEase=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
// each step (from drvTick): the clock, the moment the driver's grabbed and the moment they're thrown, and the end
function jackTick(p,dt){
  const D=p.drv,J=D.jack,o=D.o,T=J.T,k=J.kind;J.t+=dt;
  if(D.k==='car')o.speed*=Math.exp(-dt*6);else if(D.k==='tank'){o.sv=0;}else if(D.k==='heli'){o.hv.x=o.hv.z=0;}
  const tGrab=k==='bike'?0.32:k==='tank'?0.85:0.62,tThrow=k==='bike'?0.55:k==='tank'?1.25:0.98;
  if(!J.grabbed&&J.t>=tGrab){J.grabbed=true;J.v=jackVictim(D,J);if(D.k==='car'&&o.dh)o.dh.visible=false;thud(0.25);}
  if(!J.thrown&&J.t>=tThrow){J.thrown=true;jackThrow(p,D,J);}
  if(J.t>=T)jackEnd(p,D);
}
// out they go: off to the side away from the vehicle (a motorcycle's rider: shoved off the far side)
function jackThrow(p,D,J){
  const g=J.v;if(!g)return;const S=drvPose(D),rx=Math.cos(S.h),rz=-Math.sin(S.h),s=J.kind==='bike'?-J.s:J.s,up=J.kind==='tank'?5:J.kind==='heli'?4:3.5,out=J.kind==='tank'?6.5:J.kind==='bike'?5.5:7;
  g.kv.set(rx*s*out-Math.sin(S.h)*1.2,0,rz*s*out-Math.cos(S.h)*1.2);g.vy=up;g.stun=1.1;g.fallTop=g.pos.y;g.heading=Math.atan2(-rx*s,-rz*s);
  g.jackP=p;g.root.rotation.set(0,g.heading,0);
  if(g.jackHow==='flee'){g.jackFear=14;g.screamCD=0.3;}else g.jackGrudge=45;
  if(audio){noise(0.12,0.3,900,'bandpass');tone('sawtooth',700,1100,0.18,0.04,0.05);}
}
// done: the door shut behind you, and you're at the controls
function jackEnd(p,D,quiet){
  const J=D.jack;if(!J)return;D.jack=null;
  if(!J.thrown)jackThrow(p,D,J);   // (cut short, the vehicle wrecked say: they're out anyway)
  if(J.door){J.door.par.remove(J.door.g);}
  if(p.jackA)p.jackA.root.visible=false;
  if(D.k==='car'&&D.o.dh)D.o.dh.visible=false;
  if(!quiet&&p.drv===D){const kk=drvKey(p),how=D.k==='heli'?'  ·  '+actMark(p,'jump')+' climbs, '+actMark(p,'climb')+' drops':D.k==='tank'?'  ·  '+actMark(p,'bite')+' fires':'';flashLabel('Driving the '+drvName(D)+'  ·  '+kk+' to get out'+how,p);clang();}
}
// once everything's moved (from drvSeat): you, the door, and the driver, where they are at this point in it
function jackPose(p){
  const D=p.drv,J=D.jack,o=D.o,A=jackActor(p),t=J.t,k=J.kind,S=drvPose(D);
  const se=jackSeat(D,J),ou=jackOut(D,J),seat=jackAt(D,se.a,se.b,se.c),door=jackAt(D,ou.a,ou.b,ou.c),fx=Math.sin(S.h),fz=Math.cos(S.h);
  // the phases: walk up (to t1), open up (to t2), grab and haul (to t3, the throw), climb in (to t4), shut (to the end)
  const P=k==='bike'?[0.3,0.32,0.55,1.0]:k==='tank'?[0.55,0.85,1.25,1.8]:[0.35,0.62,0.98,1.5],[t1,t2,t3,t4]=P;
  const L=(a,b,u)=>a+(b-a)*u;
  // you: up to the door (for a tank, a climb up the side onto the hull), then in
  let ax,ay,az,face=Math.atan2(seat.x-door.x,seat.z-door.z),arm=-0.4,armL=0,walk=false,shown=true;
  if(t<t1){const u=jEase(t/t1),gy=k==='tank'?door.y:J.y0+(door.y-J.y0)*u;ax=L(J.x0,door.x,u);az=L(J.z0,door.z,u);ay=k==='tank'?L(J.y0,door.y,Math.min(1,u*1.6)):gy;walk=true;if(k==='tank')arm=armL=-2.6*Math.sin(u*Math.PI);}
  else if(t<t3){ax=door.x;ay=door.y;az=door.z;const u=(t-t1)/(t3-t1);arm=t<t2?-0.4-1.2*jEase((t-t1)/(t2-t1)):-1.6+0.5*Math.sin(u*9);armL=t<t2?0:-1.4;if(k==='bike'){arm=-1.7*Math.sin(Math.min(1,u)*Math.PI);armL=arm;}}
  else if(t<t4){const u=jEase((t-t3)/(t4-t3));ax=L(door.x,seat.x,u);az=L(door.z,seat.z,u);ay=L(door.y,seat.y,u)+(k==='bike'?Math.sin(u*Math.PI)*0.5:0);arm=armL=-0.8;
    if(k==='tank'&&u>0.6)ay-=(u-0.6)*2.5;if(k!=='bike'&&u>0.85)shown=false;}
  else{ax=seat.x;ay=seat.y;az=seat.z;shown=k==='bike';face=S.h;}
  if(k==='bike'&&t>=t3)face=S.h;
  A.root.visible=shown;A.root.position.set(ax,ay,az);A.root.rotation.set(0,face,0);
  const sn=walk?Math.sin(t*14):0;A.m.legs[0].rotation.x=sn*0.7;A.m.legs[1].rotation.x=-sn*0.7;A.m.arm.rotation.x=arm;A.m.armL.rotation.x=armL;
  if(k==='bike'&&t>=t3){A.m.legs[0].rotation.x=A.m.legs[1].rotation.x=-1.2;A.m.arm.rotation.x=A.m.armL.rotation.x=-1.3;}
  p.pos.set(ax,Math.max(ay,S.y),az);p.heading=face;p.vy=0;p.grounded=true;p.mvx=p.mvz=0;p.standCar=null;p.vcl=null;p.peakY=p.pos.y;p.biteT=0;
  // the door, hatch or sliding door: open as you get to it, shut behind you
  if(J.door){const op=t<t1?0:t<t2?jEase((t-t1)/(t2-t1)):t<t4?1:1-jEase((t-t4)/(J.T-t4));J.door.open(op);}
  // the driver: in the seat till grabbed, then hauled out to the door (a crewman up out of the hatch), till thrown
  const g=J.v;if(g&&!J.thrown){const u=jEase((t-t2)/(t3-t2));
    let x=L(seat.x,door.x,u*0.85),y=L(seat.y,door.y+(k==='tank'?0.4:0.3),u),z=L(seat.z,door.z,u*0.85);if(k==='tank'){y=L(seat.y-1,seat.y+0.5,Math.min(1,u*1.8));if(u>0.55){const w=(u-0.55)/0.45;x=L(seat.x,door.x,w*0.6);z=L(seat.z,door.z,w*0.6);}}
    if(k==='bike'){x=seat.x;y=seat.y;z=seat.z;}
    g.pos.set(x,y,z);g.vy=0;g.kv.set(0,0,0);g.stun=99;g.heading=S.h+(k==='bike'?0:J.s*Math.PI/2*u);
    g.root.position.set(x,y,z);g.root.rotation.set(k==='bike'?0:-0.5*u,g.heading,k==='bike'?0:J.s*0.4*u);
    g.arm.rotation.x=-2.4+Math.sin(t*20)*0.5;g.armL.rotation.x=-2.4+Math.cos(t*20)*0.5;
    if(k==='bike'){g.legs[0].rotation.x=g.legs[1].rotation.x=-1.2;g.arm.rotation.x=g.armL.rotation.x=-1.3;}}
}
// after: one who runs keeps running from the goblin who did it (even though
// you're a goblin too: see civAI), and one who fights comes for you whatever goblin mode says (see updateGoblins)
function jackFear(g,dt){
  if(!(g.jackFear>0))return null;g.jackFear-=dt;const q=g.jackP;if(!q||!q.active||g.stun>0)return null;
  const d=Math.hypot(q.pos.x-g.pos.x,q.pos.z-g.pos.z);if(d>45){g.jackFear=0;return null;}
  return{p:q,d:Math.min(d,8)};}
function jackGrudge(g,dt){
  if(!(g.jackGrudge>0))return false;g.jackGrudge-=dt;return true;}
