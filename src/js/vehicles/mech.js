// ---- The Mobile Gear: a walking mech eight blocks tall, only in the Testing Environment for now (its button is with the
// vehicles there, tenvMech). A goblin gets in with the use button, as with anything else (drvFind), and drvMech moves it
// on the pilot's controls, which are its own set (the 'mg' actions in ACTS): walking, boost skating (a switch, free on
// the ground), a jump that keeps climbing while it's held, and quick boosts, a sudden burst sideways. Everything off the
// ground is paid for from one energy bar (M.en); run it dry and it redlines (M.red), and nothing boosts until that's
// over. It never asks who the pilot is, so every character drives it the same ----
// (all the tuning in one place: speeds in blocks a second, energy out of enMax)
const MG={hy:7.6,r:1.25,hp:600,walk:6,skate:18,air:16,airEN:12,hoverEN:5,grav:26,jumpV:16,jumpEN:8,ascV:9,ascEN:30,
  qbV:34,qbT:0.22,qbCD:0.35,qbEN:20,qbKeep:0.45,enMax:100,enRegen:45,enDelay:0.5,red:1.8,stepWalk:1,stepSkate:2,outHold:0.5};
DRV_NAME.mech='Mobile Gear';
// its paint: gunmetal frame, off-white armour, hazard-yellow trim, and a cold blue-white glow from its thrusters and eye
const MGM={frame:new THREE.MeshLambertMaterial({color:0x3e454c}),plate:new THREE.MeshLambertMaterial({color:0xd6d2c4}),trim:new THREE.MeshLambertMaterial({color:0xe8b020}),
  dark:new THREE.MeshLambertMaterial({color:0x202428}),glow:new THREE.MeshBasicMaterial({color:0x9fe4ff}),flame:new THREE.MeshBasicMaterial({color:0xcff4ff,transparent:true,opacity:0.8})};
// the model: built of boxes in a tree of joints (hips, knees, ankles, waist, shoulders, elbows, head), so drvMech's
// pose can walk it. The root sits on the ground between its feet, facing the way its legs face (M.h)
function makeMech(){
  const g=new THREE.Group(),J={legs:[],arms:[],flames:[],eye:null},bx=milBx,grp=(par,x,y,z)=>{const o=new THREE.Group();o.position.set(x,y,z);par.add(o);return o;};
  const flame=(par,x,y,z,dz)=>{const f=new THREE.Mesh(LM_BOX,MGM.flame);f.position.set(x,y,z);f.scale.set(0.32,0.32,0.01);f.visible=false;par.add(f);J.flames.push({m:f,z,dz});};
  bx(g,MGM.frame,1.7,0.75,1.15,0,3.8,0);bx(g,MGM.trim,1.75,0.14,1.2,0,3.45,0);   // (the hips)
  for(const s of [-1,1]){const hip=grp(g,s*0.8,3.75,0);
    bx(hip,MGM.plate,0.85,1.9,0.95,0,-0.95,0.05);bx(hip,MGM.frame,0.2,1.4,0.8,s*0.5,-0.85,0);
    const knee=grp(hip,0,-1.9,0.1);bx(knee,MGM.trim,0.7,0.5,0.45,0,0,0.38);bx(knee,MGM.frame,0.75,1.7,0.85,0,-0.85,-0.1);bx(knee,MGM.plate,0.8,1.25,0.3,0,-0.7,0.38);
    bx(knee,MGM.glow,0.4,0.45,0.08,0,-0.95,-0.56);flame(knee,0,-0.95,-0.6,-1);   // (a thruster down the back of each calf)
    const ank=grp(knee,0,-1.75,-0.1);bx(ank,MGM.dark,1.0,0.4,1.75,0,0.1,0.25);bx(ank,MGM.trim,0.9,0.18,0.3,0,0.2,1.08);bx(ank,MGM.frame,0.6,0.35,0.5,0,0.4,-0.1);
    J.legs.push({hip,knee,ank,s});}
  const T=grp(g,0,4.1,0);J.T=T;
  bx(T,MGM.dark,1.1,0.6,0.9,0,0.3,0);bx(T,MGM.frame,1.8,0.5,1.4,0,0.75,0.1);
  bx(T,MGM.plate,2.6,1.8,1.9,0,1.5,0.05);
  {const p=bx(T,MGM.plate,2.0,1.0,0.3,0,1.75,1.0);p.rotation.x=-0.2;}bx(T,MGM.trim,2.2,0.22,0.4,0,2.35,0.85);
  for(const s of [-1,1]){bx(T,MGM.dark,0.12,0.9,0.05,s*0.55,1.6,1.16);}   // (vents either side of the chest plate)
  // (the back: its thruster pack, two big nozzles, and the launchers carried on top)
  bx(T,MGM.frame,1.8,1.4,0.9,0,1.6,-1.3);
  for(const s of [-1,1]){bx(T,MGM.dark,0.55,0.55,0.25,s*0.5,1.2,-1.8);bx(T,MGM.glow,0.4,0.4,0.05,s*0.5,1.2,-1.94);flame(T,s*0.5,1.2,-1.97,-1);
    bx(T,MGM.frame,0.8,0.7,1.5,s*0.95,3.0,-0.7);bx(T,MGM.trim,0.82,0.18,0.08,s*0.95,3.2,0.06);bx(T,MGM.dark,0.6,0.5,0.06,s*0.95,2.95,0.07);
    bx(T,MGM.frame,0.25,0.9,0.25,s*0.95,2.45,-0.9);}
  const hd=grp(T,0,2.62,0.25);J.head=hd;
  bx(hd,MGM.frame,0.9,0.55,1.0,0,0.27,0);bx(hd,MGM.plate,0.95,0.2,0.7,0,0.6,-0.05);J.eye=bx(hd,MGM.glow,0.74,0.11,0.05,0,0.3,0.51);
  bx(hd,MGM.dark,0.06,0.7,0.06,0.3,0.95,-0.25);bx(hd,MGM.trim,0.1,0.14,0.8,0,0.75,0);
  for(const s of [-1,1]){const sh=grp(T,s*1.62,2.1,0.05);
    bx(sh,MGM.plate,0.95,0.75,1.25,s*0.18,0.15,0);bx(sh,MGM.trim,0.97,0.12,1.27,s*0.18,0.46,0);bx(sh,MGM.frame,0.55,1.3,0.6,s*0.22,-0.75,0);
    const el=grp(sh,s*0.22,-1.4,0);bx(el,MGM.plate,0.72,1.3,0.82,0,-0.55,0.05);bx(el,MGM.dark,0.45,0.4,0.45,0,-1.3,0.1);
    if(s>0){bx(el,MGM.dark,0.36,2.3,0.46,0,-1.7,0.2);bx(el,MGM.trim,0.2,0.5,0.3,0,-0.95,0.5);}   // (the right hand's rifle, along the forearm)
    else{bx(el,MGM.trim,0.32,1.0,0.32,0,-1.1,0.45);bx(el,MGM.dark,0.18,0.5,0.18,0,-1.75,0.45);}   // (the left's blade housing)
    J.arms.push({sh,el,s});}
  return{g,J};
}
// is there room for it with its feet at y? Its body's a square column MG.r either side of x,z, MG.hy tall
function mgFits(x,y,z){const r=MG.r,y0=Math.floor(y+0.05),y1=Math.floor(y+MG.hy);
  for(const ox of [-r,0,r])for(const oz of [-r,0,r]){const bx=Math.floor(x+ox),bz=Math.floor(z+oz);for(let yy=y0;yy<=y1;yy++)if(solidAt(bx,yy,bz))return false;}
  return true;}
// the highest ground under its feet, no higher than a little above them
function mgGround(x,z,y){const r=MG.r*0.8;let g=-1;for(const [ox,oz] of [[0,0],[-r,-r],[r,-r],[-r,r],[r,r]])g=Math.max(g,groundAt(x+ox,z+oz,y-0.9));return g;}
// would it overlap another vehicle there (a train, plane, boat, ride car, tank, helicopter or another Mobile Gear)?
function mgBlocked(M,x,z,y){const r=MG.r,top=y+MG.hy;
  for(const B of TRAIN_BOXES){const pr=B.proxy;if(pr===M.pr||B.soft||!pr.alive||y>=B.top||B.y0>=top)continue;const bx=B.hx||TRAIN_HX,bz=B.hz||TRAIN_HZ;
    if(Math.abs(B.x-x)>r+bx+bz||Math.abs(B.z-z)>r+bx+bz)continue;if(boxesTouch(x,z,0,r,r,B.x,B.z,Math.atan2(B.tx,B.tz),bx,bz))return true;}
  for(const V of venues.values()){if(V.kind==='army')for(const o of V.mil){if(Math.hypot(o.x-x,o.z-z)>12)continue;const ox=Math.sin(o.h),oz=Math.cos(o.h);
      for(const b of MIL_PARTS[o.kind]){if(y>=o.y+b.y1||o.y+b.y0>=top)continue;if(boxesTouch(x,z,0,r,r,o.x+ox*b.c,o.z+oz*b.c,o.h,b.hx,b.hz))return true;}}
    if(V.kind==='mech')for(const o of V.mechs){if(o===M)continue;if(Math.abs(o.x-x)<r*2&&Math.abs(o.z-z)<r*2&&y<o.y+MG.hy&&o.y<top)return true;}}
  return false;}
// the energy bar: n drawn from it (a redline if that empties it). Returns whether there was any to draw
function mgDraw(M,n){if(M.red>0||M.en<=0)return false;M.en-=n;M.enIdle=0;
  if(M.en<=0){M.en=0;M.red=MG.red;M.boostOn=false;if(audio)sfx('Mobile Gear energy out',()=>{tone('square',520,140,0.35,0.06);noise(0.3,0.12,500,'lowpass');});}
  return true;}
const mgCanBoost=M=>M.red<=0&&M.en>0;
// one step of piloting it (p's controls; called from updateMechs for a mech with a pilot)
function drvMech(M,dt){
  const p=M.drv,i=drvIn(p),yaw=p.cam.yaw+Math.PI,fx=Math.sin(yaw),fz=Math.cos(yaw),f=-i.z,r=i.x;
  // (which way you're pushing, on the ground's level, from where the camera looks: forward, back and strafing)
  let wx=fx*f-Math.cos(yaw)*r,wz=fz*f+Math.sin(yaw)*r;const wm=Math.hypot(wx,wz);if(wm>1){wx/=wm;wz/=wm;}const moving=wm>0.15;
  M.qbCD-=dt;M.enIdle+=dt;if(M.red>0)M.red-=dt;
  // getting out is a short hold (so it never happens by accident mid-fight), and only once the button's been let go
  // after getting in
  if(!i.mgOut)M.outArm=true;M.outT=i.mgOut&&M.outArm?(M.outT||0)+dt:0;
  if(i.mgBoostP){M.boostOn=!M.boostOn;if(audio)sfx('Mobile Gear boost switch',()=>tone('triangle',M.boostOn?300:520,M.boostOn?620:260,0.12,0.05));}
  // a quick boost: a burst at MG.qbV the way you push (straight back with nothing pushed), for MG.qbT
  if(i.mgQBP&&M.qbCD<=0&&mgCanBoost(M)){let dx=wx,dz=wz;if(!moving){dx=-fx;dz=-fz;}else{const m=Math.hypot(dx,dz);dx/=m;dz/=m;}
    mgDraw(M,MG.qbEN);M.qbT=MG.qbT;M.qbx=dx*MG.qbV;M.qbz=dz*MG.qbV;M.qbCD=MG.qbT+MG.qbCD;M.qbFlash=0.25;M.qbDir={x:dx,z:dz};
    if(!M.grounded)M.vy=Math.max(M.vy,0)*0.3;   // (in the air it holds its height for the burst)
    if(audio)sfx('Mobile Gear quick boost',()=>{noise(0.2,0.3,1700,'bandpass');tone('sawtooth',180,90,0.18,0.05);});addShake(0.18,M.x,M.z,12);
    puff(M.x-dx*1.5,M.y+3.5,M.z-dz*1.5,5,0xcfeeff,0.6);}
  // (jump: a tap's about five blocks up; held, or pressed again in the air, it climbs on its thrusters while there's energy)
  if(i.mgJumpP&&M.grounded&&mgCanBoost(M)){mgDraw(M,MG.jumpEN);M.vy=MG.jumpV;M.grounded=false;puff(M.x,M.y+0.2,M.z,8,0xb8b0a0,1.4);if(audio)sfx('Mobile Gear jump',()=>noise(0.3,0.25,600,'lowpass'));}
  M.asc=!M.grounded&&i.mgJump&&mgCanBoost(M)&&M.vy<MG.ascV+0.5;
  if(M.asc){mgDraw(M,MG.ascEN*dt);M.vy=Math.min(MG.ascV,M.vy+40*dt);}
  // the speed it wants: walking, boost skating on the ground, boosting through the air (which costs), or drifting
  const air=!M.grounded,airB=air&&M.boostOn&&mgCanBoost(M);M.airB=airB;
  const spd=!air?(M.boostOn?MG.skate:MG.walk):airB?MG.air:MG.walk,acc=!air?(M.boostOn?(moving?2.6:2.2):8):airB?2.2:1.2;
  if(airB&&!M.asc)mgDraw(M,(moving?MG.airEN:MG.hoverEN)*dt);
  if(M.qbT>0){M.qbT-=dt;M.vx=M.qbx;M.vz=M.qbz;if(M.qbT<=0){M.vx*=MG.qbKeep;M.vz*=MG.qbKeep;}}
  else{const k=Math.min(1,dt*acc);M.vx+=(wx*spd-M.vx)*k;M.vz+=(wz*spd-M.vz)*k;}
  // (an idle bar refills, faster on the ground; it can't boost again till a redline's over, but it fills meanwhile)
  if(M.enIdle>=MG.enDelay)M.en=Math.min(MG.enMax,M.en+MG.enRegen*(M.grounded?1.5:1)*dt);
  if(M.red<=0&&M.en>0&&M.wasRed){M.wasRed=false;if(audio)sfx('Mobile Gear energy back',()=>tone('triangle',380,760,0.15,0.04));}if(M.red>0)M.wasRed=true;
  // (the legs turn to follow where the camera looks; the body turns at once)
  M.h=angTo(M.h,yaw,3.2*dt);M.ty=yaw;M.aimP=p.cam.pitch;
  mgMove(M,dt,M.boostOn?MG.stepSkate:MG.stepWalk);
}
// with nobody in it: it stands where it was left (and falls if the ground's taken from under it), its energy filling
function mechIdle(M,dt){M.boostOn=false;M.asc=false;M.airB=false;M.qbT=0;M.enIdle+=dt;if(M.red>0)M.red-=dt;
  if(M.enIdle>=MG.enDelay)M.en=Math.min(MG.enMax,M.en+MG.enRegen*dt);
  const k=Math.min(1,dt*6);M.vx-=M.vx*k;M.vz-=M.vz*k;mgMove(M,dt,MG.stepWalk);}
// moving it: across (a side at a time, so it slides along a wall), up a step if it's low enough, then up or down
function mgMove(M,dt,step){
  const sp0=Math.hypot(M.vx,M.vz),tryTo=(nx,nz)=>{
    if(mgFits(nx,M.y,nz)){if(mgBlocked(M,nx,nz,M.y))return false;M.x=nx;M.z=nz;return true;}
    if(!M.grounded)return false;
    for(let s=1;s<=step;s++){const y=Math.floor(M.y+0.05)+s;if(!mgFits(nx,y,nz))continue;const gy=mgGround(nx,nz,y+0.05);if(gy>y+0.01||gy<M.y)continue;
      if(mgBlocked(M,nx,nz,gy))return false;M.x=nx;M.z=nz;M.y=gy;M.stepT=0.15;return true;}
    return false;};
  let hit=false;
  if(M.vx&&!tryTo(M.x+M.vx*dt,M.z)){hit=true;M.vx=0;}
  if(M.vz&&!tryTo(M.x,M.z+M.vz*dt)){hit=true;M.vz=0;}
  if(hit&&sp0>14&&!M.clangT){M.clangT=0.4;clang();addShake(0.25,M.x,M.z,15);puff(M.x+M.vx*0.1,M.y+3,M.z+M.vz*0.1,5,0x9a948a,1);}
  if(M.clangT>0)M.clangT=Math.max(0,M.clangT-dt);
  // (down: on the ground it keeps to it, down a step too; off it, it falls -- slowly while boosting -- and lands)
  const gy=mgGround(M.x,M.z,M.y+0.3);
  if(M.grounded&&M.vy<=0){if(gy>=M.y-1.05&&gy<=M.y+0.3){M.y=gy;M.vy=0;}else M.grounded=false;}
  if(!M.grounded){
    const g=M.airB&&M.vy<=0?MG.grav*0.35:MG.grav;M.vy-=g*dt;if(M.airB&&M.vy<-5)M.vy=Math.max(M.vy,-5-dt*20);
    let ny=M.y+M.vy*dt;
    if(M.vy>0&&!mgFits(M.x,ny,M.z)){ny=M.y;M.vy=0;}
    const g2=mgGround(M.x,M.z,Math.max(M.y,ny)+0.3);
    if(ny<=g2&&M.vy<=0){mgLand(M,-M.vy);ny=g2;M.vy=0;M.grounded=true;}
    M.y=Math.min(ny,H+80);}
}
// coming down: the harder, the longer it crouches; from high up it shakes the ground and knocks the goblins round it flat
function mgLand(M,v){M.landT=Math.min(0.5,0.08+v*0.015);M.landK=Math.min(1,v/22);
  if(v>6){thud(Math.min(1,v/25));puff(M.x,M.y+0.2,M.z,Math.min(16,4+v*0.4|0),0xb8b0a0,1.6);addShake(Math.min(0.6,v*0.02),M.x,M.z,25);}
  if(v>14)hitGoblins(M.x,M.z,4.5,Math.round(v/5),'Flattened by a Mobile Gear landing',M.y);}
// pushing goblins and cars out of its way; a goblin it walks on is squashed, a car it walks into shoved
function mechShove(M){const r=MG.r,top=M.y+MG.hy,sp=Math.hypot(M.vx||0,M.vz||0),out=(o,rr)=>{const dx=o.pos.x-M.x,dz=o.pos.z-M.z;if(Math.abs(dx)>r+rr||Math.abs(dz)>r+rr)return null;
    const px=r+rr-Math.abs(dx),pz=r+rr-Math.abs(dz);return px<pz?{nx:Math.sign(dx)||1,nz:0,need:px+0.05}:{nx:0,nz:Math.sign(dz)||1,need:pz+0.05};};
  for(const g of goblins){if(g.state!=='chase'||g.pos.y+1.5<M.y||g.pos.y>top-0.3)continue;const c=out(g,0.4);if(!c)continue;
    g.pos.x+=c.nx*c.need;g.pos.z+=c.nz*c.need;
    if(!M.dead&&!(g.trainT>0)&&(sp>3||M.vy<-4)){g.trainT=1;damageGoblin(g,Math.round(4+sp*0.6),g.pos.clone(),new V3(c.nx,0.6,c.nz),'Trampled by a Mobile Gear');}}
  for(const c of cars){if(!c.alive||c.pos.y+(c.hy||1.4)<M.y||c.pos.y>top-0.3||Math.abs(c.pos.x-M.x)>r+c.hz+1||Math.abs(c.pos.z-M.z)>r+c.hz+1)continue;
    if(!boxesTouch(c.pos.x,c.pos.z,c.heading,c.hx,c.hz,M.x,M.z,0,r,r))continue;
    const k=outOf(c.pos.x,c.pos.z,Math.sin(c.heading),Math.cos(c.heading),c.hx,c.hz,{x:M.x,z:M.z,tx:0,tz:1,hx:r,hz:r});if(!k)continue;c.pos.x+=k.nx*k.need;c.pos.z+=k.nz*k.need;
    if(!(c.trainT>0)&&sp>8&&!M.dead){c.trainT=1;damageCar(c,Math.round(sp*0.5),new V3(k.nx,0,k.nz));if(c.alive)launchCar(c,2,new V3(k.nx*1.5,0,k.nz*1.5),2);clang();}}
  if(sp>3&&!M.dead)knockProps(M.x,M.y+1,M.z,r+0.8,M.vx,M.vz);
}
// its stand-in among the big vehicles' boxes, so it's stood on, bumped into and hit like them (see trainHit)
function mechBoxes(M,v){
  if(!M.pr)M.pr={isTrain:true,isPlane:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:MG.r,hz:MG.r,hy:MG.hy,heading:0,top:0,veh:'plane',T:M,i:0};
  const pr=M.pr;pr.alive=!M.dead;pr.pos.set(M.x,M.y,M.z);pr.heading=0;pr.top=M.y+MG.hy;
  TRAIN_BOXES.push({x:M.x,z:M.z,tx:0,tz:1,y0:M.y,top:pr.top,v,hx:MG.r,hz:MG.r,proxy:pr});
}
// hurt: by shells, rockets, bullets and blasts (through trainHit). At nothing it blows up and throws its pilot clear
function mechHit(M,n){
  if(M.dead)return;dmgPop(M.x,M.y+MG.hy+0.8,M.z,Math.round(n),'#ffb04a');M.hp-=n;M.hurt=0.2;vHitFx(M.x,M.y+5,M.z,n);
  if(M.hp>0)return;
  M.dead=true;M.deadT=0;M.boostOn=false;
  blastFx(M.x,M.y+4,M.z,0.9,2.6);smoke(M.x,M.y+5,M.z,26,0x262626);
  M.g.traverse(o=>{if(o.isMesh)o.material=o.material===MGM.flame?o.material:TRM.dark;});for(const F of M.J.flames)F.m.visible=false;
  if(audio)sfx('Mobile Gear destroyed',()=>{noise(1.2,1,450,'lowpass');tone('sawtooth',60,14,1.4,0.3);});addShake(1,M.x,M.z,50);hitGoblins(M.x,M.z,8,8,'Blown up with a Mobile Gear',M.y+2);
}
// how it stands this step: the legs walking (or skating, or hanging in the air), the body leaning into how it's moving,
// the arms up at what you're looking at, the thrusters' flames
function mechPose(M,dt){
  const J=M.J,g=M.g,sp=Math.hypot(M.vx,M.vz),h=M.h,lf=(M.vx*Math.sin(h)+M.vz*Math.cos(h)),ls=(M.vx*Math.cos(h)-M.vz*Math.sin(h));   // (its speed forward and to the left, in the legs' own frame)
  g.position.set(M.x,M.y,M.z);if(M.pos)M.pos.set(M.x,M.y,M.z);else M.pos=new V3(M.x,M.y,M.z);
  if(M.dead){g.rotation.set(0.12,h,0.2,'YXZ');return;}
  const skate=M.grounded&&M.boostOn&&sp>1,walk=M.grounded&&!skate&&sp>0.6,stride=Math.max(-1,Math.min(1,(Math.abs(lf)>=Math.abs(ls)?Math.sign(lf):Math.sign(ls))));
  // (the walking cycle: a step every 2.6 blocks or so; each foot coming down thumps)
  const ph0=M.ph||0;if(walk)M.ph=ph0+sp*dt*Math.PI/2.6;else M.ph=ph0+(Math.round(ph0/Math.PI)*Math.PI-ph0)*Math.min(1,dt*8);
  if(walk&&Math.floor(M.ph/Math.PI)!==Math.floor(ph0/Math.PI)){if(audio&&playing)sfx('Mobile Gear footstep',()=>thud(0.35));addShake(0.08,M.x,M.z,18);
    const s=Math.floor(M.ph/Math.PI)%2?1:-1;puff(M.x+Math.cos(h)*s*0.8,M.y+0.1,M.z-Math.sin(h)*s*0.8,2,0xb8b0a0,0.5);}
  M.landT=Math.max(0,(M.landT||0)-dt);const crouch=M.landT>0?M.landK*Math.sin(Math.min(1,M.landT/0.5)*Math.PI)*0.9:0;
  // (leaning: into a skate, and forward or back, side to side, with how it's speeding up; a quick boost throws it the
  // other way for a moment)
  const lean=k=>Math.max(-0.35,Math.min(0.35,k));M.qbFlash=Math.max(0,(M.qbFlash||0)-dt);
  let pt=lean(lf*(skate?0.016:0.008)),rl=lean(-ls*(skate?0.016:0.008));
  if(M.qbFlash>0&&M.qbDir){const k=M.qbFlash/0.25,qf=M.qbDir.x*Math.sin(h)+M.qbDir.z*Math.cos(h),qs=M.qbDir.x*Math.cos(h)-M.qbDir.z*Math.sin(h);pt-=qf*0.25*k;rl+=qs*0.25*k;}
  M.pt=(M.pt||0)+(pt-(M.pt||0))*Math.min(1,dt*8);M.rl=(M.rl||0)+(rl-(M.rl||0))*Math.min(1,dt*8);
  g.rotation.set(M.pt,h,M.rl,'YXZ');
  const dip=(walk?Math.abs(Math.sin(M.ph))*0.12:0)+crouch*0.8+(skate?0.35:0);g.position.y=M.y-dip;
  for(const L of J.legs){const k=L.s<0?0:Math.PI,sw=Math.sin(M.ph+k);
    let hp=0,kn=0,an=0;
    if(walk){hp=sw*0.45*stride;kn=Math.max(0,-Math.cos(M.ph+k))*0.7+0.05;an=-hp*0.5;}
    else if(skate){hp=-0.35+L.s*0.08;kn=0.75;an=-0.4;}   // (crouched, one foot a little ahead, gliding)
    else if(!M.grounded){hp=-0.5+(M.asc?0.2:0)+L.s*0.15;kn=0.9;an=0.3;}   // (in the air: knees drawn up)
    hp-=crouch*0.6;kn+=crouch*1.2;an-=crouch*0.6;
    L.hip.rotation.x=-hp;L.knee.rotation.x=kn;L.ank.rotation.x=an;
    L.hip.rotation.z=!M.grounded?-L.s*0.08:0;}
  // (the body turns to where you're looking, the head and arms tip up or down with the view)
  J.T.rotation.y=Math.max(-1.6,Math.min(1.6,angDiff(h,M.ty??h)));J.T.rotation.x=-M.pt*0.4;
  const ap=Math.max(-0.7,Math.min(0.6,M.aimP||0));J.head.rotation.x=-ap*0.5;
  for(const A of J.arms){A.sh.rotation.x=-0.25-ap*0.3;A.el.rotation.x=-(Math.PI/2-0.25)-ap*0.7;A.sh.rotation.z=A.s*0.06;}
  // (the thrusters: long flames while climbing or boosting through the air, short while skating, a burst on a quick boost)
  const thr=M.asc?1:M.airB?0.7:skate?0.35:0,qb=M.qbFlash>0?M.qbFlash/0.25*1.4:0,fl=Math.max(thr,qb)*(0.85+Math.random()*0.3);
  for(const F of J.flames){F.m.visible=fl>0.05;if(F.m.visible){const L=fl*1.6;F.m.scale.z=L;F.m.position.z=F.z+F.dz*L/2;}}
  J.eye.material=M.red>0&&Math.floor(camClock*8)%2?MGM.trim:MGM.glow;   // (its eye flashes while it's redlined)
  if(fl>0.3&&Math.random()<dt*20){const b=-1.9;puff(M.x+Math.sin(h)*b,M.y+5.2,M.z+Math.cos(h)*b,1,0xcfeeff,0.4);}
  if(skate&&Math.random()<dt*25)puff(M.x,M.y+0.15,M.z,1,0xffd080,0.5);   // (sparks off the feet)
  if((M.asc||M.airB||skate)&&audio&&playing){M.hum=(M.hum||0)-dt;if(M.hum<=0){M.hum=0.12;sfx('Mobile Gear thrusters',()=>noise(0.13,0.04+thr*0.05,M.asc?900:600,'bandpass'));}}
}
// every Mobile Gear in a venue, each step: piloted, or standing about; then posed and put among the big vehicles
function updateMechs(V,dt){
  for(const M of V.mechs){
    if(M.dead){M.deadT+=dt;if(M.deadT<60&&Math.random()<dt*3)smoke(M.x,M.y+5,M.z,1,0x262626);M.vx=M.vz=0;
      {const gy=mgGround(M.x,M.z,M.y+0.3);if(M.y>gy+0.02){M.vy-=MG.grav*dt;M.y=Math.max(gy,M.y+M.vy*dt);}else M.vy=0;}}
    else if(M.drv)drvMech(M,dt);else mechIdle(M,dt);
    M.hurt=(M.hurt||0)-dt;if(!M.dead)vDamaged(M.x,M.y+MG.hy,M.z,M.hp/MG.hp,dt);
    mechPose(M,dt);mechBoxes(M,Math.hypot(M.vx,M.vz));mechShove(M);}
}
// a new one, standing at x,z facing h, in venue V
function newMech(V,x,z,h){const mk=makeMech(),M=Object.assign({isMech:true,kind:'mech',V,x,y:groundAt(x,z,G+40),z,h,ty:h,vx:0,vy:0,vz:0,hp:MG.hp,dead:false,grounded:true,
  en:MG.enMax,enIdle:9,red:0,boostOn:false,qbT:0,qbCD:0,ph:0,key:'mech:'+Date.now()+':'+V.mechs.length},mk);
  scene.add(M.g);V.mechs.push(M);mechPose(M,0);return M;}
