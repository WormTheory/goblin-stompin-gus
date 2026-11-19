// ---- vehicles meeting each other, by their mass (the fender benders at the end of updateCars, a car into a wall, a
// hippo into a car) ----
// Every car is a box on the ground with a mass (HANDLING's mass, handOf: the one place it's kept) and a moment of
// inertia worked out from it, m(hx^2+hz^2)/3. Two that touch push apart by their masses (the lighter one gives more), and
// if they're closing they trade momentum through one impulse at the point where they meet: along the line between them,
// with a little bounce (CO.e, or a kind's own HANDLING bounce), and across it, the tyres' scrub (no more than CO.mu of the
// push). Struck off its middle a car spins, c.yawV (radians a second), which its tyres take out at a rate tied to its
// grip. A car going about its business that's sent spinning stops steering (c.spinT, the spin owns its heading) till it's
// come to rest, then finds its way again (carReroute); a driven one spins too, and its driver keeps steering. A wall is a
// body that never moves. Damage comes from the change in speed the blow makes, so the light one of two takes the worst of
// it (CO.dmgK, a kind's own HANDLING crush). Host only: guests get the place and heading in the snapshots as before.
const CO={e:0.25,mu:0.45,slop:0.02,push:0.6,dmgV:2.5,dmgK:1.2,dmgMax:28,cd:0.45,yawMax:7,yawK:0.35,spinAt:1.6,
  tipAt:7,tipTall:1.9,flipK:2.6,flipV:6,throwV:4.5,smokeYaw:2.4,hippo:1.5,gob:0.5};
// a car's mass: its kind's, and a forklift's with what's on its forks (a car up there is part of it)
function carMass(c){let m=handOf(c.veh||'car').mass;if(c.fork&&c.fork.load&&c.fork.load.k==='car'&&c.fork.load.o)m+=handOf(c.fork.load.o.veh||'car').mass;return m;}
const carInertia=(c,m)=>m*((c.hx||1)*(c.hx||1)+(c.hz||2)*(c.hz||2))/3;
// (who takes a blow for a car: the forklift, for a car up on its forks)
const carBody=c=>c.forkOn&&c.forkOn.alive?c.forkOn:c;
// a car's velocity on the ground: where it's really going (a driven one's slide, c.hvel, else straight ahead at its
// speed) plus any knock it's carrying (c.kv)
function carVel(c){const f=c.hvel;if(f)return {x:f.x+c.kv.x,z:f.z+c.kv.z};const s=c.speed||0;return {x:Math.sin(c.heading)*s+c.kv.x,z:Math.cos(c.heading)*s+c.kv.z};}
// a change of velocity put back: a driven one's slide takes it whole (roadSlip brings it round to the heading at the
// tyres' grip); otherwise its share along the heading goes on its speed and the rest on its knock
function carDv(c,dx,dz){const fx=Math.sin(c.heading),fz=Math.cos(c.heading),al=dx*fx+dz*fz;c.speed=(c.speed||0)+al;
  if(c.hvel){c.hvel.x+=dx;c.hvel.z+=dz;}else{c.kv.x+=dx-fx*al;c.kv.z+=dz-fz*al;}}
// ---- where two boxes meet (a sibling of boxesTouch): the face they met across, as n from a to b, how deep, and the point
// of contact (the middle of the corners of each inside the other; failing that, between the two). The face is the axis
// they began to overlap along last, going by how fast they're closing along each (rvx,rvz: b's velocity less a's), so a
// fast corner-on hit isn't taken for a scrape down the side; with nothing closing, the one they overlap least along ----
function boxContact(ax,az,ah,awx,awz,bx,bz,bh,bwx,bwz,rvx,rvz){
  const A=[[Math.cos(ah),-Math.sin(ah)],[Math.sin(ah),Math.cos(ah)]],B=[[Math.cos(bh),-Math.sin(bh)],[Math.sin(bh),Math.cos(bh)]],dx=bx-ax,dz=bz-az;
  let best=1e9,nx=0,nz=0,bt=1e9,tx=0,tz=0,td=0;
  for(const [ux,uz] of [...A,...B]){
    const ra=awx*Math.abs(A[0][0]*ux+A[0][1]*uz)+awz*Math.abs(A[1][0]*ux+A[1][1]*uz);
    const rb=bwx*Math.abs(B[0][0]*ux+B[0][1]*uz)+bwz*Math.abs(B[1][0]*ux+B[1][1]*uz);
    const dd=dx*ux+dz*uz,o=ra+rb-Math.abs(dd);if(o<0)return null;
    const s=dd<0?-1:1;if(o<best){best=o;nx=ux*s;nz=uz*s;}
    const cl=-((rvx||0)*ux+(rvz||0)*uz)*s;if(cl>0.05&&o/cl<bt){bt=o/cl;tx=ux*s;tz=uz*s;td=o;}}   // (closing along it: how long ago they met across it)
  if(bt<1e9&&bt<0.25){nx=tx;nz=tz;best=td;}
  // (the corners of one inside the other)
  let px=0,pz=0,n=0;
  const corners=(x,z,M,wx,wz,ox,oz,N,owx,owz)=>{for(const sx of [-1,1])for(const sz of [-1,1]){const cx=x+M[0][0]*wx*sx+M[1][0]*wz*sz,cz=z+M[0][1]*wx*sx+M[1][1]*wz*sz,
    lx=(cx-ox)*N[0][0]+(cz-oz)*N[0][1],lz=(cx-ox)*N[1][0]+(cz-oz)*N[1][1];if(Math.abs(lx)<=owx&&Math.abs(lz)<=owz){px+=cx;pz+=cz;n++;}}};
  corners(ax,az,A,awx,awz,bx,bz,B,bwx,bwz);corners(bx,bz,B,bwx,bwz,ax,az,A,awx,awz);
  if(n){px/=n;pz/=n;}else{px=(ax+bx)/2;pz=(az+bz)/2;}
  return {nx,nz,d:best,px,pz};
}
// ---- one impulse between two bodies at a point, along n (from a to b): {m,I,x,z,vx,vz,w} each, m Infinity for a wall.
// Returns the impulse along n and the velocity changes for each ({j, a:{dx,dz,dw}, b:{...}}), or null if they're parting ----
function coImpulse(a,b,nx,nz,px,pz,e,mu){
  const ima=a.m===Infinity?0:1/a.m,imb=b.m===Infinity?0:1/b.m,iIa=a.m===Infinity?0:1/a.I,iIb=b.m===Infinity?0:1/b.I;
  // (a point's velocity on a turning body: w x r, which on the ground with heading measured from +z is w*(rz,-rx))
  const rax=px-a.x,raz=pz-a.z,rbx=px-b.x,rbz=pz-b.z;
  const vax=a.vx+a.w*raz,vaz=a.vz-a.w*rax,vbx=b.vx+b.w*rbz,vbz=b.vz-b.w*rbx,rvx=vbx-vax,rvz=vbz-vaz,vn=rvx*nx+rvz*nz;
  if(vn>=0)return null;
  const ca=raz*nx-rax*nz,cb=rbz*nx-rbx*nz,k=ima+imb+ca*ca*iIa+cb*cb*iIb;if(k<=0)return null;
  const j=-(1+e)*vn/k;
  // (the scrub across: no more than mu of the push)
  let tx=rvx-vn*nx,tz=rvz-vn*nz;const tl=Math.hypot(tx,tz);let jt=0;
  if(tl>1e-4){tx/=tl;tz/=tl;const cta=raz*tx-rax*tz,ctb=rbz*tx-rbx*tz,kt=ima+imb+cta*cta*iIa+ctb*ctb*iIb;jt=Math.max(-mu*j,Math.min(mu*j,-(rvx*tx+rvz*tz)/kt));}
  else{tx=0;tz=0;}
  const Jx=j*nx+jt*tx,Jz=j*nz+jt*tz;
  return {j,jt,a:{dx:-Jx*ima,dz:-Jz*ima,dw:-(raz*Jx-rax*Jz)*iIa},b:{dx:Jx*imb,dz:Jz*imb,dw:(rbz*Jx-rbx*Jz)*iIb}};
}
const coBody=c=>{const m=carMass(c),v=carVel(c);return {m,I:carInertia(c,m),x:c.pos.x,z:c.pos.z,vx:v.x,vz:v.z,w:c.yawV||0};};
// (pairs that have just hit: no more damage between them for CO.cd)
const CO_HIT=new Map();
function coLately(a,b){const now=playTime,m=CO_HIT.get(a)||new Map(),t=m.get(b);m.set(b,now);CO_HIT.set(a,m);
  if(CO_HIT.size>200)for(const [k,mm] of CO_HIT){for(const [k2,t2] of mm)if(now-t2>2)mm.delete(k2);if(!mm.size)CO_HIT.delete(k);}
  return t!==undefined&&now-t<CO.cd;}
// a change of velocity and turn on a car, with what follows from a big one
function coApply(c,d,j,from){
  carDv(c,d.dx,d.dz);c.yawV=Math.max(-CO.yawMax,Math.min(CO.yawMax,(c.yawV||0)+d.dw));
  if(!c.drv&&Math.abs(c.yawV)>CO.spinAt){c.spinT=Math.max(c.spinT||0,0.4);c.spinH=c.spinH??c.heading;}}
// ---- two cars meeting (from the fender-bender loop in updateCars). a and b are both alive and close ----
function carsCollide(a,b,dt){
  const A=carBody(a),B=carBody(b);if(A===B)return;
  const qa=coBody(A),qb=coBody(B);
  const C=boxContact(a.pos.x,a.pos.z,a.heading,a.hx+0.15,a.hz+0.15,b.pos.x,b.pos.z,b.heading,b.hx+0.15,b.hz+0.15,qb.vx-qa.vx,qb.vz-qa.vz);if(!C)return;
  // (pushed apart by their masses: the lighter one gives more)
  const ima=1/qa.m,imb=1/qb.m,dep=Math.min(CO.push,Math.max(0,C.d-CO.slop)),sa=dep*ima/(ima+imb),sb=dep*imb/(ima+imb);
  nudgeFlat(A,-C.nx*sa,-C.nz*sa);nudgeFlat(B,C.nx*sb,C.nz*sb);
  const e=Math.min(handOf(A.veh||'car').bounce??CO.e,handOf(B.veh||'car').bounce??CO.e);
  const J=coImpulse(qa,qb,C.nx,C.nz,C.px,C.pz,e,CO.mu);if(!J)return;
  coApply(A,J.a,J.j,B);coApply(B,J.b,J.j,A);
  // (which was hit: the one the other came at faster)
  const inA=qa.vx*C.nx+qa.vz*C.nz,inB=-(qb.vx*C.nx+qb.vz*C.nz);
  coAfter(A,B,J.a,inB>inA);coAfter(B,A,J.b,inA>inB);
  // (damage by how much each one's speed was changed: the lighter one takes the worst; once a pair till they've parted)
  const dva=Math.hypot(J.a.dx,J.a.dz),dvb=Math.hypot(J.b.dx,J.b.dz),big=Math.max(dva,dvb);
  if(big>CO.dmgV&&!coLately(A,B)){const hurt=(c,dv)=>{const n=Math.min(CO.dmgMax,Math.round((dv-CO.dmgV)*CO.dmgK*(handOf(c.veh||'car').crush??1)*(c.svcPool==='news'?0.25:1)));if(n>0)damageCar(c,n,undefined,'acc');};
    if(big>CO.dmgV*2.2&&A.svcPool!=='news'&&B.svcPool!=='news')reportNews(C.px,C.pz,'car crash');
    hurt(A,dva);hurt(B,dvb);sfx('Vehicles collide',()=>{clang();thud(Math.min(0.9,0.2+big*0.05));});addShake(Math.min(0.6,0.1+big*0.03),C.px,C.pz,15);
    if(big>8)for(let k=0;k<3;k++)puff(C.px,a.pos.y+0.6,C.pz,1,0x9a948a,0.5);}
}
// what a big blow does besides (c took the change d from o; struck: o came at it, rather than it at o): a tall, narrow
// one hit hard from the side goes over; one hit by something much heavier is thrown up over its bonnet; anything ridden
// in the open throws its rider and cartwheels
function coAfter(c,o,d,struck){
  if(!c.alive)return;const dv=Math.hypot(d.dx,d.dz);if(dv<CO.throwV)return;
  const fx=Math.sin(c.heading),fz=Math.cos(c.heading),side=Math.abs((d.dx*fz-d.dz*fx)/dv);   // (how much of it was from the side)
  const light=LIGHT_RIDE[c.veh]||c.veh==='quad',mr=carMass(o)/carMass(c);
  if(light&&c.drv){const p=c.drv;drvExit(p,true);p.vy=Math.max(p.vy||0,4+dv*0.3);p.grounded=false;}
  if(light){c.vy=Math.max(c.vy||0,2.5+dv*0.35);c.grounded=false;c.spinR=(c.spinR||0)+(Math.random()<0.5?-1:1)*(6+dv*0.4);c.spinP=(c.spinP||0)+(Math.random()-0.5)*6;return;}
  if(side>0.7&&dv>CO.tipAt&&(c.hy||1.4)/Math.max(0.3,c.hx||1)>CO.tipTall&&!c.tipR){const s=Math.sign(d.dx*fz-d.dz*fx)||1;c.tipR=-s*0.06;c.tipV=-s*0.02;c.tipFall=true;c.tipT=0;
    if(c.drv)flashLabel('Over it goes!',c.drv);sfx('Vehicle tips over',()=>{thud(0.6);clang();});return;}
  if(struck&&mr>=CO.flipK&&dv>CO.flipV){c.vy=Math.max(c.vy||0,3+dv*0.3);c.grounded=false;c.spinP=(c.spinP||0)-Math.sign(d.dx*fx+d.dz*fz||1)*(3+dv*0.4);return;}
}
// ---- each car, each frame (updateCars, before it's placed): its spin, taken out by its tyres; a car going about its
// business lets the spin have its heading till it's over ----
function carSpin(c,dt){
  const w=c.yawV||0;if(!w&&!c.spinT)return;
  const gr=handOf(c.veh||'car').grip||9,k=c.grounded?gr*CO.yawK:0.3;
  if(c.spinT>0&&!c.drv){c.spinH=(c.spinH??c.heading)+w*dt;c.heading=c.spinH;c.speed*=Math.exp(-dt*1.8);c.steer=0;
    if(Math.abs(w)<0.5){c.spinT-=dt;if(c.spinT<=0){c.spinT=0;c.spinH=undefined;c.reverseT=0;if(!c.hunter&&!c.crew)carReroute(c);}}}
  else c.heading+=w*dt;
  c.yawV=w*Math.exp(-dt*k);if(Math.abs(c.yawV)<0.02)c.yawV=0;
  // (tyres screaming: smoke off the back wheels and a skid)
  if(Math.abs(w)>CO.smokeYaw&&c.grounded){c.skidT=(c.skidT||0)-dt;const bx=c.pos.x-Math.sin(c.heading)*c.hz*0.8,bz=c.pos.z-Math.cos(c.heading)*c.hz*0.8;
    if(Math.random()<dt*18)puff(bx,c.pos.y+0.2,bz,1,0xd8d8d8,0.5);
    if(c.skidT<=0){c.skidT=0.5;const np=nearestPlayer(c.pos.x,c.pos.z,false);if(np&&np.d<45){const v=0.05*(1-np.d/45);sfx('Tyres skid',()=>{noise(0.45,v,1800,'bandpass');tone('sawtooth',520,380,0.4,v*0.3);});}}}
}
// (a car that's gone over: lying there, and one going about its business is put back on its wheels after a while,
// as a forklift is when someone gets back in; tipPost, farm-lift.js)
function carTip(c,dt){if(!c.tipR||c.veh==='forklift')return;if(!c.drv&&Math.abs(c.tipR)>=Math.PI/2-1e-3){c.tipT=(c.tipT||0)+dt;c.speed=0;if(c.tipT>9)c.tipFall=false;}
  tipPost(c,dt);if(!c.tipR)c.tipT=0;}
// ---- a car driven into a wall: the wall's a body that never moves, met at the corner that hit it. Returns the impulse
// along the wall's face (for the smash and the damage) ----
function carWall(c,px,pz){
  const bx=Math.floor(px)+0.5,bz=Math.floor(pz)+0.5,ox=c.pos.x-bx,oz=c.pos.z-bz;
  // (the face it hit: whichever side of the block the car's on)
  let nx=0,nz=0;if(Math.abs(ox)>Math.abs(oz))nx=-Math.sign(ox);else nz=-Math.sign(oz);   // (n from the car into the wall)
  const q=coBody(c),W={m:Infinity,I:Infinity,x:bx,z:bz,vx:0,vz:0,w:0};
  const J=coImpulse(q,W,nx,nz,px,pz,handOf(c.veh||'car').bounce??CO.e,CO.mu);if(!J)return 0;
  coApply(c,J.a,J.j,null);return J.j;
}
// (the front corner of a car nearer a wall ahead: where it'll hit; null if neither is in a wall)
function carWallPt(c,dir){const fx=Math.sin(c.heading),fz=Math.cos(c.heading),rx=fz,rz=-fx,f=(c.hz+0.15)*dir,y=c.pos.y;let best=null;
  for(const s of [-1,0,1]){const x=c.pos.x+fx*f+rx*c.hx*0.9*s,z=c.pos.z+fz*f+rz*c.hx*0.9*s;if(groundAt(x,z,y)-y>0.6&&!best)best={x,z};}return best;}
// ---- a hippo (Gus or Gertie alike: CO.hippo, never their character) and a car meeting: the hippo moving at (vx,vz),
// at the point (px,pz). The car takes the impulse (and spins, if it's off its middle); the hippo's push on, its share ----
function hippoCar(p,c,vx,vz,px,pz){
  const B=carBody(c),q=coBody(B),h={m:CO.hippo,I:Infinity,x:p.pos.x,z:p.pos.z,vx,vz,w:0};
  let nx=B.pos.x-p.pos.x,nz=B.pos.z-p.pos.z;const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;
  const J=coImpulse(h,q,nx,nz,px,pz,CO.e,CO.mu);if(!J)return null;
  coApply(B,J.b,J.j,null);coAfter(B,B,J.b,true);return J;
}
