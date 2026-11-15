// ---- The Mobile Gear: a walking mech eight blocks tall, only in the Testing Environment for now (its button is with the
// vehicles there, tenvMech). A goblin gets in with the use button, as with anything else (drvFind), and drvMech moves it
// on the pilot's controls, which are its own set (the 'mg' actions in ACTS): walking, boost skating (a switch, free on
// the ground), a jump that keeps climbing while it's held, and quick boosts, a sudden burst sideways. Everything off the
// ground is paid for from one energy bar (M.en); run it dry and it redlines (M.red), and nothing boosts until that's
// over. It never asks who the pilot is, so every character drives it the same ----
// (all the tuning in one place: speeds in blocks a second, energy out of enMax)
// (ramV: from this fast, running into a wall or a building knocks a hole in it; plow: from this fast it hardly slows)
const MG={hy:7.6,r:1.25,hp:600,walk:10.8,skate:32.4,air:28.8,airEN:12,hoverEN:5,grav:26,jumpV:16,jumpEN:8,jumpPre:0.12,ascV:9,ascEN:30,
  qbV:61,qbT:0.18,qbCD:0.35,qbEN:20,qbDec:0.35,enMax:100,enRegen:45,enDelay:0.5,red:1.8,stepWalk:1,stepSkate:2,outHold:0.5,
  ramV:15,plow:24};
// (the legs: thigh and shin lengths, and how high the hips stand)
const MG_L1=1.9,MG_L2=1.75,MG_HIP=3.75;
DRV_NAME.mech='Mobile Gear';
// its paint: gunmetal frame, off-white armour, hazard-yellow trim, and a cold blue-white glow from its thrusters and eye
const MGM={frame:new THREE.MeshLambertMaterial({color:0x3e454c}),plate:new THREE.MeshLambertMaterial({color:0xd6d2c4}),trim:new THREE.MeshLambertMaterial({color:0xe8b020}),
  dark:new THREE.MeshLambertMaterial({color:0x202428}),glow:new THREE.MeshBasicMaterial({color:0x9fe4ff}),flame:new THREE.MeshBasicMaterial({color:0xcff4ff,transparent:true,opacity:0.8}),heat:new THREE.MeshBasicMaterial({color:0xff9a3a})};
// the model: built of boxes in a tree of joints (hips, knees, ankles, waist, shoulders, elbows, head), so drvMech's
// pose can walk it. The root sits on the ground between its feet, facing the way its legs face (M.h)
function makeMech(){
  const g=new THREE.Group(),J={legs:[],arms:[],flames:[],eye:null},bx=milBx,grp=(par,x,y,z)=>{const o=new THREE.Group();o.position.set(x,y,z);par.add(o);return o;};
  // (a thruster's flame: it points along d, in its part's own frame. 'lift' ones hold it up, 'dir' ones on the body push
  // it about, so they burn on the side away from where it's going)
  // ('back' ones are the pack's main pair: they push it along and, tipped down in the air, hold it up too. Each flame is
  // two boxes: the body, and a thinner tip beyond it, as a real exhaust narrows)
  const flame=(par,x,y,z,d,kind,w)=>{const o=grp(par,x,y,z);mgAim(o,d);
    const f=new THREE.Mesh(LM_BOX,MGM.flame),t=new THREE.Mesh(LM_BOX,MGM.flame);f.scale.set(w,w,0.01);t.scale.set(w*0.55,w*0.55,0.01);f.visible=t.visible=false;o.add(f);o.add(t);
    J.flames.push({m:f,t,o,d,kind,L:0});};
  // (everything above the legs hangs from the pelvis, B, at hip height, so the body can crouch and lean while the legs
  // reach down to the ground)
  const B=grp(g,0,MG_HIP,0);J.B=B;
  bx(B,MGM.frame,1.7,0.75,1.15,0,0.05,0);bx(B,MGM.trim,1.75,0.14,1.2,0,-0.3,0);   // (the hips)
  for(const s of [-1,1]){const hip=grp(B,s*0.8,0,0);hip.rotation.order='ZXY';
    bx(hip,MGM.plate,0.85,1.9,0.95,0,-0.95,0.05);bx(hip,MGM.frame,0.2,1.4,0.8,s*0.5,-0.85,0);
    const knee=grp(hip,0,-1.9,0.1);bx(knee,MGM.trim,0.7,0.5,0.45,0,0,0.38);bx(knee,MGM.frame,0.75,1.7,0.85,0,-0.85,-0.1);bx(knee,MGM.plate,0.8,1.25,0.3,0,-0.7,0.38);
    bx(knee,MGM.glow,0.4,0.45,0.08,0,-0.95,-0.56);flame(knee,0,-0.95,-0.6,[0,-0.6,-0.8],'lift',0.32);   // (a thruster down the back of each calf)
    const ank=grp(knee,0,-1.75,-0.1);ank.rotation.order='XZY';bx(ank,MGM.dark,1.0,0.4,1.75,0,0.1,0.25);bx(ank,MGM.trim,0.9,0.18,0.3,0,0.2,1.08);bx(ank,MGM.frame,0.6,0.35,0.5,0,0.4,-0.1);
    J.legs.push({hip,knee,ank,s});}
  const T=grp(B,0,0.35,0);J.T=T;
  bx(T,MGM.dark,1.1,0.6,0.9,0,0.3,0);bx(T,MGM.frame,1.8,0.5,1.4,0,0.75,0.1);
  bx(T,MGM.plate,2.6,1.8,1.9,0,1.5,0.05);
  {const p=bx(T,MGM.plate,2.0,1.0,0.3,0,1.75,1.0);p.rotation.x=-0.2;}bx(T,MGM.trim,2.2,0.22,0.4,0,2.35,0.85);
  for(const s of [-1,1]){bx(T,MGM.dark,0.12,0.9,0.05,s*0.55,1.6,1.16);}   // (vents either side of the chest plate)
  // (the back: its thruster pack, two big nozzles, and the launchers carried on top)
  bx(T,MGM.frame,1.8,1.4,0.9,0,1.6,-1.3);
  J.nozzles=[];
  for(const s of [-1,1]){
    // (the main nozzles swivel: straight back on the ground, tipped down in the air)
    {const nz=grp(T,s*0.5,1.2,-1.75);J.nozzles.push(nz);bx(nz,MGM.dark,0.55,0.55,0.35,0,0,-0.05);bx(nz,MGM.glow,0.4,0.4,0.05,0,0,-0.24);flame(nz,0,0,-0.27,[0,0,-1],'back',0.36);}
    // (smaller nozzles: on the pack's sides, firing outward, and low on the chest, firing forward, for going sideways or back)
    bx(T,MGM.dark,0.16,0.45,0.45,s*0.98,1.55,-1.3);bx(T,MGM.glow,0.04,0.3,0.3,s*1.07,1.55,-1.3);flame(T,s*1.09,1.55,-1.3,[s,0,0],'dir',0.24);
    bx(T,MGM.dark,0.35,0.3,0.2,s*0.85,0.75,1.05);bx(T,MGM.glow,0.25,0.2,0.04,s*0.85,0.75,1.16);flame(T,s*0.85,0.75,1.18,[0,-0.25,0.97],'dir',0.22);
    bx(T,MGM.frame,0.25,0.9,0.25,s*0.95,2.45,-0.9);}
  // (on its back, each on a pivot: over the left shoulder (x+) the missile pod, a box of four tubes under a lid that
  // swings up while it's locking and firing; over the right the cannon, carried pointing up and back, swung down over
  // the shoulder to fire)
  {const pod=grp(T,0.95,3.0,-0.7);J.pod=pod;bx(pod,MGM.frame,0.8,0.7,1.5,0,0,0);bx(pod,MGM.trim,0.82,0.18,0.08,0,0.2,0.76);
    for(const [a,b] of [[-0.18,-0.12],[0.18,-0.12],[-0.18,0.16],[0.18,0.16]])bx(pod,MGM.dark,0.26,0.22,0.06,a,b,0.77);
    const lid=grp(pod,0,0.36,-0.75);J.podLid=lid;bx(lid,MGM.plate,0.86,0.1,1.56,0,0.04,0.78);}
  {const cn=grp(T,-0.95,2.75,-1.2);J.cannon=cn;bx(cn,MGM.frame,0.7,0.75,1.1,0,0,0);bx(cn,MGM.trim,0.72,0.16,0.3,0,0.3,0.2);
    bx(cn,MGM.dark,0.32,0.32,2.6,0,0.12,1.7);bx(cn,MGM.frame,0.44,0.44,0.5,0,0.12,2.95);J.cannonM=grp(cn,0,0.12,3.25);}
  const hd=grp(T,0,2.62,0.25);J.head=hd;
  bx(hd,MGM.frame,0.9,0.55,1.0,0,0.27,0);bx(hd,MGM.plate,0.95,0.2,0.7,0,0.6,-0.05);J.eye=bx(hd,MGM.glow,0.74,0.11,0.05,0,0.3,0.51);
  bx(hd,MGM.dark,0.06,0.7,0.06,0.3,0.95,-0.25);bx(hd,MGM.trim,0.1,0.14,0.8,0,0.75,0);
  for(const s of [-1,1]){const sh=grp(T,s*1.62,2.1,0.05);
    bx(sh,MGM.plate,0.95,0.75,1.25,s*0.18,0.15,0);bx(sh,MGM.trim,0.97,0.12,1.27,s*0.18,0.46,0);bx(sh,MGM.frame,0.55,1.3,0.6,s*0.22,-0.75,0);
    const el=grp(sh,s*0.22,-1.4,0);bx(el,MGM.plate,0.72,1.3,0.82,0,-0.55,0.05);bx(el,MGM.dark,0.45,0.4,0.45,0,-1.3,0.1);
    // (x is its left: the right hand (x-) holds the rifle along the forearm, the left carries the blade's housing, and the
    // blade itself, a long glowing bar shown only while it cuts)
    let mz=null,bl=null;
    if(s<0){bx(el,MGM.dark,0.36,2.3,0.46,0,-1.7,0.2);bx(el,MGM.trim,0.2,0.5,0.3,0,-0.95,0.5);mz=grp(el,0,-2.9,0.2);}
    else{bx(el,MGM.trim,0.32,1.0,0.32,0,-1.1,0.45);bx(el,MGM.dark,0.18,0.5,0.18,0,-1.75,0.45);bl=bx(el,MGM.heat,0.18,3.8,0.6,0,-3.8,0.45);bl.visible=false;}
    J.arms.push({sh,el,s,mz,bl});}
  return{g,J};
}
// turning a thruster's group so its flame points along d (a direction in its parent's frame)
function mgAim(o,d){const l=Math.hypot(d[0],d[1],d[2])||1;o.rotation.set(-Math.asin(d[1]/l),Math.atan2(d[0],d[2]),0,'YXZ');}
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
  mgWeapons(M,M.drv,drvIn(M.drv),dt);   // (first: a hard lock turns the camera, and that's the way it moves)
  const p=M.drv,i=drvIn(p),yaw=p.cam.yaw+Math.PI,fx=Math.sin(yaw),fz=Math.cos(yaw),f=-i.z,r=i.x;
  // (which way you're pushing, on the ground's level, from where the camera looks: forward, back and strafing)
  let wx=fx*f-Math.cos(yaw)*r,wz=fz*f+Math.sin(yaw)*r;if(M.brace>0&&M.grounded){wx=wz=0;}const wm=Math.hypot(wx,wz);if(wm>1){wx/=wm;wz/=wm;}const moving=wm>0.15;
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
  // (a jump starts with a short dip, MG.jumpPre, then it's off)
  if(i.mgJumpP&&M.grounded&&mgCanBoost(M)&&!(M.jPre>0))M.jPre=MG.jumpPre;
  if(M.jPre>0){M.jPre-=dt;if(M.jPre<=0){M.jPre=0;
    if(M.grounded&&mgCanBoost(M)){mgDraw(M,MG.jumpEN);M.vy=MG.jumpV;M.grounded=false;M.jT=0.55;M.jy0=M.y;puff(M.x,M.y+0.2,M.z,8,0xb8b0a0,1.4);if(audio)sfx('Mobile Gear jump',()=>noise(0.3,0.25,600,'lowpass'));}}}
  M.asc=!M.grounded&&i.mgJump&&mgCanBoost(M)&&M.vy<MG.ascV+0.5;
  if(M.asc){mgDraw(M,MG.ascEN*dt);M.vy=Math.min(MG.ascV,M.vy+40*dt);}
  // the speed it wants: walking, boost skating on the ground, boosting through the air (which costs), or drifting
  const air=!M.grounded,airB=air&&M.boostOn&&mgCanBoost(M);M.airB=airB;
  const spd=!air?(M.boostOn?MG.skate:MG.walk):airB?MG.air:MG.walk,acc=!air?(M.boostOn?(moving?2.6:2.2):8):airB?2.2:1.2;
  if(airB&&!M.asc)mgDraw(M,(moving?MG.airEN:MG.hoverEN)*dt);
  // (a quick boost: the burst, then for MG.qbDec it bleeds its speed off smoothly toward what you're holding)
  // (the blade's lunge, like a quick boost straight at what's locked, comes before anything else)
  if(M.lgT>0){M.lgT-=dt;M.vx=M.lgx;M.vz=M.lgz;if(M.lgT<=0){M.lgT=0;M.qbD=MG.qbDec*0.6;}}
  else if(M.qbT>0){M.qbT-=dt;M.vx=M.qbx;M.vz=M.qbz;if(M.qbT<=0)M.qbD=MG.qbDec;}
  else if(M.qbD>0){M.qbD-=dt;const k=Math.min(1,dt*6);M.vx+=(wx*spd-M.vx)*k;M.vz+=(wz*spd-M.vz)*k;}
  else if(!air&&!M.boostOn){
    // (on foot it gets going slowly and picks up into a jog -- pushing harder the faster it's already going -- and
    // stops a good deal quicker than it starts)
    const tx=wx*spd,tz=wz*spd,dx=tx-M.vx,dz=tz-M.vz,d=Math.hypot(dx,dz),v=Math.hypot(M.vx,M.vz);
    if(d>1e-4){const a=Math.hypot(tx,tz)<v-0.05?18:3+9*Math.min(1,v/MG.walk),st=Math.min(d,a*dt);M.vx+=dx/d*st;M.vz+=dz/d*st;}}
  else{const k=Math.min(1,dt*acc);M.vx+=(wx*spd-M.vx)*k;M.vz+=(wz*spd-M.vz)*k;}
  // (an idle bar refills, faster on the ground; it can't boost again till a redline's over, but it fills meanwhile)
  if(M.enIdle>=MG.enDelay)M.en=Math.min(MG.enMax,M.en+MG.enRegen*(M.grounded?1.5:1)*dt);
  if(M.red<=0&&M.en>0&&M.wasRed){M.wasRed=false;if(audio)sfx('Mobile Gear energy back',()=>tone('triangle',380,760,0.15,0.04));}if(M.red>0)M.wasRed=true;
  // (the body turns at once to where the camera looks. Moving, the legs follow it round. Standing, they stay planted
  // till the body's twisted too far round on them, then step round to catch up (mgTurn, posed in mechPose))
  M.ty=yaw;M.aimP=p.cam.pitch;
  if(!M.grounded||Math.hypot(M.vx,M.vz)>1.2){M.h=angTo(M.h,yaw,3.2*dt);M.turn=0;}
  else{const off=angDiff(M.h,yaw);if(!M.turn&&Math.abs(off)>0.85)M.turn=Math.sign(off);
    if(M.turn){const nh=angTo(M.h,yaw,2.6*dt);M.turnD=(M.turnD||0)+Math.abs(angDiff(M.h,nh));M.h=nh;if(Math.abs(angDiff(M.h,yaw))<0.03)M.turn=0;}}
  mgMove(M,dt,M.boostOn?MG.stepSkate:MG.stepWalk);
}
// with nobody in it: it stands where it was left (and falls if the ground's taken from under it), its energy filling
function mechIdle(M,dt){mgDisarm(M,dt);M.boostOn=false;M.asc=false;M.airB=false;M.qbT=0;M.enIdle+=dt;if(M.red>0)M.red-=dt;
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
  let bx=M.vx&&!tryTo(M.x+M.vx*dt,M.z),bz=M.vz&&!tryTo(M.x,M.z+M.vz*dt);
  // (fast enough, it smashes a way through whatever stopped it and carries on: boosting flat out it hardly slows)
  if((bx||bz)&&sp0>=MG.ramV&&!M.dead&&mgRam(M,M.vx/sp0,M.vz/sp0,sp0)){const keep=sp0>=MG.plow?0.94:0.5;M.vx*=keep;M.vz*=keep;if(M.qbT>0){M.qbx*=keep;M.qbz*=keep;}
    if(bx)bx=!tryTo(M.x+M.vx*dt,M.z);if(bz)bz=!tryTo(M.x,M.z+M.vz*dt);}
  if(bx)M.vx=0;if(bz)M.vz=0;const hit=bx||bz;
  if(hit&&sp0>12&&!M.clangT){M.clangT=0.4;clang();addShake(0.25,M.x,M.z,15);puff(M.x+M.vx*0.1,M.y+3,M.z+M.vz*0.1,5,0x9a948a,1);}
  if(M.clangT>0)M.clangT=Math.max(0,M.clangT-dt);if(M.ramT>0)M.ramT=Math.max(0,M.ramT-dt);
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
// knocking a hole in what's in front of it, as wide and tall as itself and deeper the faster it's going (the same
// wreckage as a tank ramming: the blocks fly, and a building that loses enough comes down). Returns how many broke
function mgRam(M,fx,fz,sp){
  if(SBX)return 0;const depth=sp>=MG.plow?2.4:1.3,W=MG.r+0.55,y0=Math.floor(M.y+0.05),y1=Math.floor(M.y+MG.hy),E=Math.ceil(MG.r+depth+W)+1;
  const ch=new Set(),broken=[],cx0=Math.floor(M.x),cz0=Math.floor(M.z);
  for(let bz=cz0-E;bz<=cz0+E;bz++)for(let bx=cx0-E;bx<=cx0+E;bx++){const rx=bx+0.5-M.x,rz=bz+0.5-M.z,a=rx*fx+rz*fz,l=Math.abs(rx*fz-rz*fx);
    for(let by=y0;by<=y1;by++){const rag=0.4*hash2(bx*5+by*3,bz*13+by);if(a<-MG.r||a>MG.r+depth+rag||l>W+rag)continue;   // (from its back edge: anything it's already scraping along goes too)
      const b=get(bx,by,bz);if(b===AIR||b===WATER||b===BEDROCK||by<1||by>=H)continue;
      setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
      for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((bx+ox)/CS),Math.floor((bz+oz)/CS)));}}
  if(!broken.length)return 0;
  const o={force:0.8+sp*0.03,dx:fx,dz:fz,up:1};rebuildSet(ch);save();destroyFX(broken.slice(0,120),o);settle(broken,o);pumpsHit(broken);
  knockProps(M.x+fx*(MG.r+1),M.y+1,M.z+fz*(MG.r+1),W+1,fx,fz);
  if(!M.ramT){M.ramT=0.12;clang();addShake(sp>=MG.plow?0.35:0.5,M.x,M.z,25);}
  return broken.length;}
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
  M.g.traverse(o=>{if(o.isMesh)o.material=o.material===MGM.flame?o.material:TRM.dark;});for(const F of M.J.flames)F.m.visible=F.t.visible=false;
  if(audio)sfx('Mobile Gear destroyed',()=>{noise(1.2,1,450,'lowpass');tone('sawtooth',60,14,1.4,0.3);});addShake(1,M.x,M.z,50);hitGoblins(M.x,M.z,8,8,'Blown up with a Mobile Gear',M.y+2);
}
// one leg reaching for a point: the ankle put at (dx,dy,dz) from its hip, in the pelvis's frame (x to its left, y up, z
// ahead), by swinging the hip out and forward and bending the knee (forward, as a knee does); then the ankle turned to
// keep the foot flat on the ground, whatever the pelvis's lean (bp, br) and the leg's angles
function mgLeg(L,dx,dy,dz,bp,br){
  const a=Math.hypot(dx,Math.min(dy,-0.3)),ro=Math.atan2(dx,Math.max(0.3,-dy)),Lm=MG_L1+MG_L2,d0=Math.hypot(a,dz);
  // (reaching further than about 93% of the leg, the reach eases off rather than locking straight, where the knee would
  // flick from bent to straight in a frame)
  const D=Math.max(0.5,d0<Lm*0.93?d0:Lm*(0.93+0.06*(1-Math.exp(-(d0-Lm*0.93)/(Lm*0.06)))));
  const cl=v=>Math.max(-1,Math.min(1,v)),fw=Math.atan2(dz,a)+Math.acos(cl((MG_L1*MG_L1+D*D-MG_L2*MG_L2)/(2*MG_L1*D))),kn=Math.PI-Math.acos(cl((MG_L1*MG_L1+MG_L2*MG_L2-D*D)/(2*MG_L1*MG_L2)));
  L.hip.rotation.set(-fw,0,ro);L.knee.rotation.x=kn;L.ank.rotation.set(fw-kn-bp,0,-(ro+br));}
// how it stands this step: the feet stepping the way it's going (walking), splayed and braced (boost skating), or drawn up
// (in the air), every pose easing into the next; the body crouching and leaning into how it moves; the arms up at what
// you're looking at; and the thrusters burning on the side away from where it's headed
function mechPose(M,dt){
  const J=M.J,g=M.g,sp=Math.hypot(M.vx,M.vz),h=M.h,ch=Math.cos(h),sh=Math.sin(h),ease=(k,t,r)=>k+(t-k)*Math.min(1,dt*r);
  g.position.set(M.x,M.y,M.z);if(M.pos)M.pos.set(M.x,M.y,M.z);else M.pos=new V3(M.x,M.y,M.z);
  if(M.dead){g.rotation.set(0.12,h,0.2,'YXZ');return;}
  g.rotation.set(0,h,0);
  // (which way it's going in the legs' own frame: ux to its left, uz ahead)
  const lf=M.vx*sh+M.vz*ch,ls=M.vx*ch-M.vz*sh,ux=sp>0.3?ls/sp:0,uz=sp>0.3?lf/sp:0;
  // (skating: boost on, or a quick boost, or sliding faster than it can walk -- never a frantic walk)
  M.qbFlash=Math.max(0,(M.qbFlash||0)-dt);const skate=M.grounded&&sp>1&&(M.boostOn||M.qbT>0||M.qbFlash>0||sp>MG.walk*1.25),walk=M.grounded&&!skate&&sp>0.6;
  // (how much of each pose it's in: these ease, so nothing snaps from one to the next)
  M.gW=ease(M.gW??1,M.grounded?1:0,M.grounded?14:6);M.aW=ease(M.aW||0,M.asc?1:0,5);M.sW=ease(M.sW??0,skate?1:0,M.qbFlash>0?14:6);M.wW=ease(M.wW??0,walk?1:0,6);
  // (the walking cycle: a stride of 2A, so a planted foot keeps pace with the ground; shorter sideways, so the legs don't
  // cross; each foot coming down thumps)
  // (from a slow walk into a jog: the faster, the longer the stride, the higher the feet and the bigger the bob)
  const jg=Math.max(0,Math.min(1,(sp-3)/(MG.walk-3))),Af=1.05+0.55*jg,As=0.7+0.2*jg;
  const A=sp>0.3?1/Math.hypot(ux/As,uz/Af):Af,ph0=M.ph||0;
  if(walk)M.ph=ph0+sp*dt*Math.PI/(2*A);else M.ph=ph0+(Math.round(ph0/Math.PI)*Math.PI-ph0)*Math.min(1,dt*6);
  if(walk&&Math.floor((M.ph-Math.PI/2)/Math.PI)!==Math.floor((ph0-Math.PI/2)/Math.PI)){if(audio&&playing)sfx('Mobile Gear footstep',()=>thud(0.35));addShake(0.08,M.x,M.z,18);}
  M.landT=Math.max(0,(M.landT||0)-dt);const crouch=M.landT>0?M.landK*Math.sin(Math.min(1,M.landT/0.5)*Math.PI)*0.9:0;
  // (leaning: into the way it's going, more the faster; a quick boost throws it hard into the burst)
  const k=Math.min(1,sp/MG.skate),lean=v=>Math.max(-0.55,Math.min(0.55,v));
  // (in the air it leans hard into the way it's flying, judged against walking speed so even a drift tips it)
  const ka=Math.min(1,sp/MG.walk),lk=((0.05+0.08*jg)*M.wW+0.22*M.sW)*k+0.6*ka*(1-M.gW);let pt=uz*lk,rl=-ux*lk;
  if(M.qbFlash>0&&M.qbDir){const q=M.qbFlash/0.25,qf=M.qbDir.x*sh+M.qbDir.z*ch,qs=M.qbDir.x*ch-M.qbDir.z*sh;pt+=qf*0.3*q;rl-=qs*0.3*q;}
  M.pt=ease(M.pt||0,lean(pt),8);M.rl=ease(M.rl||0,lean(rl),8);
  // (the pelvis: a little knee bend standing, a bob walking, crouched skating, knocked down by a hard landing)
  // (the dip before a jump, let go quickly but not in a single frame as it springs up)
  {const t=M.jPre>0?Math.sin((1-M.jPre/MG.jumpPre)*Math.PI*0.5)*0.75:0;M.jd=ease(M.jd||0,t,t>(M.jd||0)?40:10);}
  M.brA=ease(M.brA||0,M.brace>0?1:0,12);   // (bracing to fire the cannon: down into a firm crouch)
  const dip=0.2+M.jd+M.brA*0.45+M.wW*Math.abs(Math.sin(M.ph))*(0.35+0.2*jg)+M.sW*0.55+crouch*0.9;const by=MG_HIP-dip*M.gW;
  J.B.position.y=by;J.B.rotation.set(M.pt,0,M.rl,'ZXY');
  const cp=Math.cos(M.pt),sp2=Math.sin(M.pt),cr=Math.cos(M.rl),sr=Math.sin(M.rl);
  // (a jump: for a moment the feet stay where they pushed off, so the legs straighten under it, then they tuck up and
  // swing out into the flying pose)
  M.jT=Math.max(0,(M.jT||0)-dt);const jt=M.jT>0?0.55-M.jT:9,push=Math.max(0,Math.min(1,(0.22-jt)/0.14)),tuck=jt<9?Math.sin(Math.max(0,Math.min(1,(jt-0.06)/0.49))*Math.PI):0;
  const gw=Math.max(M.gW,push);if(!M.fy)M.fy=[0,0];
  // (turning on the spot: each foot has its own angle round the middle, tA. As the legs turn, the planted foot keeps its
  // place on the ground (its angle runs back by the turn), while the other lifts and swings round past the middle;
  // they take turns, a step every 0.45 of a turn or so, until both are back square under it)
  if(!M.tA){M.tA=[0,0];M.tPh=0;}
  {const dh=angDiff(M.hP??h,h);M.hP=h;const on=M.grounded&&sp<1.2&&M.wW<0.3&&M.sW<0.3;
    if(!on){M.tA[0]=ease(M.tA[0],0,10);M.tA[1]=ease(M.tA[1],0,10);M.tS=-1;M.tL=0;}
    else{const busy=Math.abs(dh)>1e-4||Math.abs(M.tA[0])>0.04||Math.abs(M.tA[1])>0.04;
      if(!busy){M.tS=-1;M.tL=0;}
      else{const ph1=M.tPh;M.tPh+=Math.max(Math.abs(dh)/0.45,dt*1.6);const sw2=Math.floor(M.tPh)%2,fr=M.tPh%1;
        if(Math.floor(M.tPh)!==Math.floor(ph1)&&audio&&playing)sfx('Mobile Gear footstep',()=>thud(0.25));
        const dir=Math.sign(dh)||-Math.sign(M.tA[sw2])||0,lead=Math.abs(dh)>1e-4?dir*0.25:0;
        M.tA[1-sw2]-=dh;M.tA[sw2]=ease(M.tA[sw2]-dh,lead,10);M.tA=M.tA.map(a=>Math.max(-0.7,Math.min(0.7,a)));
        M.tS=sw2;M.tL=Math.sin(fr*Math.PI)*0.55;}}}
  for(const L of J.legs){const s=L.s,psi=M.ph+(s<0?0:Math.PI),j=s<0?0:1;
    // (on the ground: under the hip, stepping along the way it's going, lifted on the forward swing; skating, spread wide,
    // one foot ahead, both trailing the way it's sliding so the leading leg folds and the trailing one stretches)
    const sw=Math.sin(psi)*A*M.wW,lift=Math.max(0,Math.cos(psi))*(0.6+0.45*jg)*M.wW+(M.tS===j?M.tL:0);
    let gx=s*0.9+ux*sw,gz=uz*sw;gx+=M.sW*(s*0.45-ux*0.75*k);gz+=M.sW*(s*0.3-uz*0.75*k);
    // (turned on the spot: the foot where it was planted, swung round the middle by its own angle)
    {const a=M.tA[j],c=Math.cos(a),n=Math.sin(a),x0=gx;gx=x0*c+gz*n;gz=-x0*n+gz*c;}
    // (the sole on the ground under it, up or down a step. Over a drop deeper than a step (a pit, skating across it) the
    // foot stays up rather than reaching for the bottom, and it eases there either way: quickly up, slower down. Once
    // it's left the ground, level with where it was; pushing off, where it pushed from)
    const wx=M.x+gx*ch+gz*sh,wz=M.z-gx*sh+gz*ch;let fg=0;
    if(push>0&&!M.grounded)fg=Math.max(-0.6,M.jy0-M.y);
    else if(M.grounded){fg=Math.min(1.1,groundAt(wx,wz,M.y+1.2)-M.y);if(fg<-1.05)fg=-0.25;}
    M.fy[j]=push>0&&!M.grounded?fg:ease(M.fy[j],fg,fg>M.fy[j]&&M.grounded?30:7);const gy=M.fy[j]+0.04+lift;
    // (in the air: legs nearly straight, swept well back from the way it's flying: most of the way by walking speed,
    // the rest as boosted flight builds to full speed; the feet rise a little as they swing back so the legs stay in
    // reach; tucked up for a moment after a jump)
    const ta=0.95*Math.min(1,sp/MG.walk)+0.55*Math.max(0,Math.min(1,(sp-MG.walk)/(MG.air-MG.walk))),ax=s*0.9-ux*ta,ay=0.35+s*0.1+tuck*0.85+0.45*ta*ta/2.25,az=-0.45-M.aW*0.2-uz*ta+tuck*0.5;
    const tx=ax+(gx-ax)*gw,ty=ay+(gy-ay)*gw,tz=az+(gz-az)*gw;
    // (that point, seen from the leaning pelvis: undo its roll, then its pitch, then step across to the hip)
    let x=tx,y=ty-by,z=tz;{const x1=x*cr+y*sr,y1=-x*sr+y*cr;x=x1;y=y1;}{const y2=y*cp+z*sp2,z2=-y*sp2+z*cp;y=y2;z=z2;}
    mgLeg(L,x-s*0.8,y,z,M.pt,M.rl);}
  // (the body turns to where you're looking, the head and arms tip up or down with the view, allowing for the lean)
  J.T.rotation.y=Math.max(-1.6,Math.min(1.6,angDiff(h,M.ty??h)));J.T.rotation.x=0;
  const ap=Math.max(-0.7,Math.min(0.6,M.aimP||0));J.head.rotation.x=-ap*0.5-M.pt*0.5;
  // (jogging, the arms swing a little against the legs: each with the opposite leg)
  const swg=0.2*jg*M.wW*Math.sin(M.ph)*(uz<-0.3?-1:1);
  for(const A2 of J.arms){const w=swg*A2.s;A2.sh.rotation.x=-0.25-ap*0.3-M.pt*0.5-w;A2.el.rotation.x=-(Math.PI/2-0.25)-ap*0.7-M.pt*0.5-w*0.6;A2.sh.rotation.z=A2.s*0.06;}
  mgWpnPose(M,J,ap,dt,ease);   // (aiming, slashing, the cannon and the pod: see mech-weapons.js)
  // (the thrusters. Lift ones, down the calves: full climbing, less hovering or skating. The body's: each burns by how
  // much it points away from where it's headed (the burst's way during a quick boost), in the torso's frame)
  const tyw=h+J.T.rotation.y,ct=Math.cos(tyw),st=Math.sin(tyw),qb=M.qbFlash>0?M.qbFlash/0.25:0;
  let mx=(M.vx*ct-M.vz*st)/(sp||1),mz=(M.vx*st+M.vz*ct)/(sp||1),dirT=(skate?0.55:M.airB?0.8:0)*Math.min(1,sp/8);
  if(qb>0&&M.qbDir){mx=M.qbDir.x*ct-M.qbDir.z*st;mz=M.qbDir.x*st+M.qbDir.z*ct;dirT=Math.max(dirT,1.5*qb);}
  const lift=M.asc?1:M.airB?0.55:skate?0.25:(jt<0.3?0.8:0),air=1-M.gW;let big=0;
  // (in the air the main nozzles tip down, and the calves' flames are turned to fire straight down, whatever the legs'
  // angle: the shin's pitch is the lean, the hip and the knee together)
  for(const nz of J.nozzles)nz.rotation.x=-0.8*air;
  for(const F of J.flames){
    if(F.kind==='lift'){const L=J.legs[F.o.parent===J.legs[0].knee?0:1],th=M.pt+L.hip.rotation.x+L.knee.rotation.x,wy=-0.97,wz=-0.25;
      const d=[0,F.d[1]+((wy*Math.cos(th)+wz*Math.sin(th))-F.d[1])*air,F.d[2]+((-wy*Math.sin(th)+wz*Math.cos(th))-F.d[2])*air];mgAim(F.o,d);}
    const push2=dirT*Math.max(0,-(F.d[0]*mx+F.d[2]*mz)),want=F.kind==='lift'?lift:F.kind==='back'?Math.max(push2,lift*0.8*air):push2;
    F.L=ease(F.L,want,20);big=Math.max(big,F.L);
    const L=F.L*1.6*(0.85+Math.random()*0.3);F.m.visible=F.t.visible=L>0.08;
    if(F.m.visible){F.m.scale.z=L;F.m.position.z=L/2;F.t.scale.z=L*0.6;F.t.position.z=L*1.25;}}
  J.eye.material=M.red>0&&Math.floor(camClock*8)%2?MGM.trim:MGM.glow;   // (its eye flashes while it's redlined)
  if(big>0.3&&Math.random()<dt*20){const b=-1.9;puff(M.x+Math.sin(tyw)*b-(M.vx*0.05),M.y+5.2,M.z+Math.cos(tyw)*b-(M.vz*0.05),1,0xcfeeff,0.4);}
  if(skate&&Math.random()<dt*25)puff(M.x-M.vx*0.04,M.y+0.15,M.z-M.vz*0.04,1,0xffd080,0.5);   // (sparks off the feet)
  if((M.asc||M.airB||skate)&&audio&&playing){M.hum=(M.hum||0)-dt;if(M.hum<=0){M.hum=0.12;sfx('Mobile Gear thrusters',()=>noise(0.13,0.04+lift*0.05,M.asc?900:600,'bandpass'));}}
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
