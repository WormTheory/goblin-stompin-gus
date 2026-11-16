// ---- The Mobile Gear's weapons and lock-on (see mech.js for the machine itself). Four weapons, one on each trigger, each
// with its own load and reload (DRV_WPN.mech, through the same wpnFire as a tank's): the Rivet Rifle in the right hand
// (held: a stream of rounds), the Heat Cleaver in the left (a lunge forward, at what's locked if it's near, then a
// long glowing blade swept right to left round in front of it, cutting through goblins, vehicles and walls), the Swarm Pod on the left shoulder (held: it locks up to four targets in the
// lock box, let go: a homing missile at each) and the Breaker Cannon on the right (on the ground it braces a moment,
// then a heavy shell; in the air it fires at once and the kick shoves it back).
// Lock-on: whatever's in the lock box round the crosshair is picked out by itself (the soft lock, M.soft) and the arms'
// shots go at it, led for its speed; the hard lock button holds on to it (M.hard), turning the camera to keep it in
// view while you move round it ----
DRV_WPN.mech=[{k:'rifle',name:'Rivet Rifle',max:40,gap:0.1,reload:2.5,act:'mgArmR'},{k:'blade',name:'Heat Cleaver',max:1,gap:0,reload:1.2,act:'mgArmL',cool:true},
  {k:'pod',name:'Swarm Pod',max:8,gap:0.07,reload:6,act:'mgShL'},{k:'cannon',name:'Breaker Cannon',max:3,gap:0.9,reload:7,act:'mgShR'}];
// (box: the lock box's half-width round the crosshair, as an angle; range: how far off it picks things out; hardRange:
// past this a hard lock lets go; camTurn: how fast a hard lock turns the camera, a second. The blade: a locked target
// within bladeReach is lunged at till it's bladeMid off, at most lungeMax; with none it lunges lunge ahead. Its cut
// reaches bladeR past the body, bladeArc either side of straight ahead. The swing: windT reaching across to its right
// (the lunge goes in this too), the blade lit for the last igniteT of it, the cut swept in sweepT, then backT to put it away)
const MGW={box:0.22,range:150,hardRange:170,camTurn:2.4,
  rifleDmg:3,rifleSc:0.006,
  bladeReach:24,bladeMid:8,lunge:7,lungeMax:12,bladeDmg:20,bladeVD:90,bladeR:13,bladeArc:1.92,lungeT:0.38,windT:0.34,igniteT:0.12,sweepT:0.14,backT:0.4,
  podLock:0.2,podLocks:4,missV:50,missTurn:5,missR:2.6,missDmg:4,missVD:35,missCrush:1.4,
  canV:95,canGrav:3,brace:0.4,canR:5.5,canDmg:10,canVD:180,canCrush:3.8,recoil:14};
// a point on the mech in its torso's frame (x to its left, y up from its feet, z ahead), out in the world
function mgAt(M,lx,ly,lz){const a=M.ty??M.h,c=Math.cos(a),s=Math.sin(a);return{x:M.x+lx*c+lz*s,y:M.y+ly,z:M.z-lx*s+lz*c};}
// the camera's forward line
function mgFwd(p){const cp=Math.cos(p.cam.pitch);return{x:-Math.sin(p.cam.yaw)*cp,y:Math.sin(p.cam.pitch),z:-Math.cos(p.cam.yaw)*cp};}
// how far off the crosshair a target is, as an angle from the camera (less its size, so a tank's edge counts)
function mgOff(p,t){const c=p.camera.position,f=mgFwd(p),ty=lockY(t),dx=t.pos.x-c.x,dy=ty-c.y,dz=t.pos.z-c.z,L=Math.hypot(dx,dy,dz)||1;
  return Math.max(0,Math.acos(Math.max(-1,Math.min(1,(dx*f.x+dy*f.y+dz*f.z)/L)))-Math.atan((isMilT(t)?MIL[t.kind].hz:0.5)/L));}
// what's locked: the hard lock, or else the soft one
const mgTarget=M=>M.hard||M.soft||null;
// the lock box: everything in it (M.inBox), the soft lock (the best of them: nearest the middle, hostile goblins and
// the army's vehicles before townsfolk, ones in sight first, and the one already locked kept unless another's clearly
// better), and the hard lock's button. Then the target's speed, smoothed, for leading it; and a hard lock turning the
// camera after it
function mgLocks(M,p,i,dt){
  let best=null,bs=1e9;M.inBox=[];
  for(const o of lockTargets(p,MGW.range)){const t=o.t,a=mgOff(p,t);if(a>MGW.box)continue;M.inBox.push(t);
    const sc=a*40+o.d*0.02+(t.civ?3:0)+(isMilT(t)?-1:0)+o.hid+(t===M.soft?-1.5:0);if(sc<bs){bs=sc;best=t;}}
  if(best!==M.soft&&best&&audio)sfx('Mobile Gear lock',()=>tone('square',1400,1400,0.03,0.025));
  M.soft=best;
  if(i.mgLockP){
    if(M.hard){M.hard=null;tone('triangle',620,380,0.07,0.035);}
    else{let t=best;if(!t){let b2=1e9;for(const o of lockTargets(p,MGW.range)){const a=mgOff(p,o.t);if(a>0.8)continue;const sc=a*40+o.d*0.02+o.hid;if(sc<b2){b2=sc;t=o.t;}}}   // (nothing in the box: anything a little wider of it)
      if(t){M.hard=t;tone('square',880,1320,0.08,0.035);}else tone('square',180,140,0.06,0.03);}}
  if(M.hard&&(!lockAlive(M.hard)||Math.hypot(M.hard.pos.x-M.x,M.hard.pos.z-M.z)>MGW.hardRange)){M.hard=null;tone('triangle',520,300,0.08,0.03);}
  const T=mgTarget(M);
  if(T&&dt>0){const ty=lockY(T),V=M.lv;if(V&&V.t===T){const k=Math.min(1,dt*5);V.vx+=((T.pos.x-V.x)/dt-V.vx)*k;V.vy+=((ty-V.y)/dt-V.vy)*k;V.vz+=((T.pos.z-V.z)/dt-V.vz)*k;V.x=T.pos.x;V.y=ty;V.z=T.pos.z;}
    else M.lv={t:T,x:T.pos.x,y:ty,z:T.pos.z,vx:0,vy:0,vz:0};}
  // (hard locked: the view swings round after it, no faster than camTurn, so it never whips; you can still look about)
  if(M.hard){const T=M.hard,cx=M.x,cy=M.y+9.4,cz=M.z,dx=T.pos.x-cx,dz=T.pos.z-cz,dy=lockY(T)-cy,hz=Math.hypot(dx,dz)||1;
    p.cam.yaw=angTo(p.cam.yaw,Math.atan2(-dx,-dz),MGW.camTurn*dt);
    const wp=Math.max(-0.9,Math.min(0.6,Math.atan2(dy,hz)+0.12));p.cam.pitch=camPitch(p.cam.pitch+Math.max(-1,Math.min(1,(wp-p.cam.pitch)))*Math.min(1,dt*3),p);}
}
// where a shot from (x,y,z) at speed sp should go: at the locked target, ahead of it by the time the shot takes to get
// there; or else what's under the crosshair
function mgLead(M,p,x,y,z,sp){const T=mgTarget(M);if(!T||!lockAlive(T))return drvAim(p,sp);
  const V=M.lv,ty=lockY(T);if(!V||V.t!==T)return{x:T.pos.x,y:ty,z:T.pos.z};
  const t=Math.min(3,Math.hypot(T.pos.x-x,ty-y,T.pos.z-z)/sp),cl=v=>Math.max(-30,Math.min(30,v));
  return{x:T.pos.x+cl(V.vx)*t,y:ty+cl(V.vy)*t,z:T.pos.z+cl(V.vz)*t};}
// (the muzzles: the rifle's at the end of the right forearm, the cannon's over the right shoulder, the pod's tubes)
const mgRifleAt=M=>mgAt(M,-1.84,4.6,3.0),mgCannonAt=M=>mgAt(M,-0.95,7.9,2.9),mgPodAt=M=>mgAt(M,0.95,7.1,-0.2);
// one step of the weapons, for the pilot p (called first thing in drvMech, so a hard lock's turn of the camera counts
// this step)
function mgWeapons(M,p,i,dt){
  wpnInit(M,'mech');wpnTick(M,dt);mgLocks(M,p,i,dt);const W=M.wpn;
  M.rfT=Math.max(0,(M.rfT||0)-dt);M.rkT=Math.max(0,(M.rkT||0)-dt);M.cnT=Math.max(0,(M.cnT||0)-dt);M.podT=Math.max(0,(M.podT||0)-dt);
  // (the rifle: held, a round every W.gap, a little scattered, to the first goblin, vehicle or wall on the line)
  if(i.mgArmR&&wpnFire(M,'rifle')){const m=mgRifleAt(M),A=mgLead(M,p,m.x,m.y,m.z,400);
    gunRound(M,p,m.x,m.y,m.z,MGW.rifleDmg,MGW.rifleSc,'Riveted by a Mobile Gear','Mobile Gear rifle',A);M.rfT=0.6;M.rkT=0.08;puff(m.x,m.y,m.z,1,0xffd080,0.15);}
  // (the blade: a lunge forward, at the locked target if it's within reach (stopping with it about halfway along the
  // blade), otherwise the way you're looking; then the sweep, right to left. Not again until this swing's done)
  if(i.mgArmLP&&!M.sl&&wpnFire(M,'blade')){const T=mgTarget(M),f=mgFwd(p),fh=Math.hypot(f.x,f.z)||1;let fx=f.x/fh,fz=f.z/fh,go=MGW.lunge;
    if(T){const dx=T.pos.x-M.x,dz=T.pos.z-M.z,d=Math.hypot(dx,dz)||1;if(d<MGW.bladeReach){fx=dx/d;fz=dz/d;go=Math.min(MGW.lungeMax,Math.max(0,d-MG.r-MGW.bladeMid));}}
    M.lgT=0;
    // (the lunge starts at three times its average speed and eases to a stop, so it covers go in all and settles rather than halting)
    if(go>0.5){const v=3*go/MGW.lungeT;M.lgT=MGW.lungeT;M.lgx=fx*v;M.lgz=fz*v;}
    M.sl={fx,fz,e:0,w:Math.max(MGW.windT,M.lgT*0.75+0.08),f:0,hit:new Set()};if(audio)sfx('Mobile Gear blade',()=>tone('triangle',120,90,0.12,0.03));}
  if(M.sl){const S=M.sl;S.e+=dt;
    // (the blade lights as the reach finishes: a rising hum and a flash at the hand)
    if(!S.lit&&S.e>=S.w-MGW.igniteT){S.lit=true;const h=mgAt(M,-0.6,5.0,1.4);puff(h.x,h.y,h.z,6,0xffc070,0.5);if(audio)sfx('Mobile Gear blade',()=>{tone('sawtooth',90,520,0.14,0.05);noise(0.12,0.08,3200,'bandpass');});}
    const f=mgEase((S.e-S.w)/MGW.sweepT);if(f>S.f){mgSlash(M,S,S.f,f);S.f=f;}if(S.e>S.w+MGW.sweepT+MGW.backT)M.sl=null;}
  // (the pod: held, a lock every MGW.podLock on what's in the box, the least locked first, up to four or what's
  // loaded; let go, the missiles go one after another, each at its own lock (none: one, at the crosshair))
  const pd=W.pod;
  if(i.mgShL){if(!M.pod){M.pod={locks:[],k:0.05};if(pd.rl>0||pd.n<=0)wpnClick();}
    const P=M.pod;P.k-=dt;P.locks=P.locks.filter(t=>lockAlive(t));
    if(P.k<=0&&pd.rl<=0&&P.locks.length<Math.min(MGW.podLocks,pd.n)&&M.inBox.length){
      let t=null,bn=1e9;for(const c of M.inBox){const n=P.locks.filter(q=>q===c).length*10+(c===M.soft?0:1)+(c.civ?3:0);if(n<bn){bn=n;t=c;}}
      P.locks.push(t);P.k=MGW.podLock;if(audio)sfx('Mobile Gear missile lock',()=>tone('square',1100+P.locks.length*180,1100+P.locks.length*180,0.05,0.03));}}
  else if(M.pod){const L=M.pod.locks;M.pod=null;if(pd.rl<=0&&pd.n>0)M.podQ=L.length?L.slice():[null];}
  if(M.podQ&&M.podQ.length){if(pd.rl>0)M.podQ=null;else if(pd.cd<=0&&wpnFire(M,'pod'))mgMissile(M,p,M.podQ.shift());}
  // (the cannon: on the ground it braces first (M.brace: it stops, crouches and swings the barrel over its shoulder),
  // then fires; in the air at once)
  const cw=W.cannon;
  if(i.mgShRP&&!(M.brace>0)){if(cw.rl>0||cw.n<=0)wpnClick();else if(cw.cd<=0){if(M.grounded){M.brace=MGW.brace;M.cnT=MGW.brace+0.9;}else mgCannon(M,p);}}
  if(M.brace>0){M.brace-=dt;if(M.brace<=0){M.brace=0;mgCannon(M,p);}}
}
// with nobody in it: no locks, nothing firing, but the weapons still reload
function mgDisarm(M,dt){wpnInit(M,'mech');wpnTick(M,dt);M.soft=M.hard=null;M.inBox=[];M.pod=null;M.podQ=null;M.brace=0;M.lgT=0;M.sl=null;
  for(const k of ['rfT','rkT','cnT','podT'])M[k]=Math.max(0,(M[k]||0)-dt);}
// (smoothstep: slow out, fast through the middle, slow in; the swing's cut follows the arm's swing exactly)
const mgEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// which way round from straight ahead (S.fx,S.fz) the point rx,rz is: 0 ahead, plus to the mech's left, minus to its
// right; and the sweep's angle a fraction f of the way through it (from bladeArc to its right, round to bladeArc left)
const mgSlAng=(S,rx,rz)=>Math.atan2(rx*S.fz-rz*S.fx,rx*S.fx+rz*S.fz),mgSweepA=f=>-MGW.bladeArc+2*MGW.bladeArc*f;
// one step of the sweep, from fraction f0 to f1 of the way round: goblins the blade passes through cut down (each once a
// swing), vehicles hurt hard, the blocks in that slice of the arc cut through. Sparks and the sound with the first step
function mgSlash(M,S,f0,f1){
  const a0=mgSweepA(f0),a1=mgSweepA(f1),R=MGW.bladeR+MG.r,lx=S.fz,lz=-S.fx;
  for(const g of goblins){if(g.state!=='chase'||S.hit.has(g)||g.pos.y<M.y-1.5||g.pos.y>M.y+MG.hy)continue;const dx=g.pos.x-M.x,dz=g.pos.z-M.z,d=Math.hypot(dx,dz)||0.01,a=mgSlAng(S,dx,dz);
    if(d<=R&&(f0===0?a>=a0:a>a0)&&a<=a1){S.hit.add(g);damageGoblin(g,MGW.bladeDmg,g.pos.clone(),new V3(dx/d,0.8,dz/d),"Cut down by a Mobile Gear's heat blade");}}
  // (with PvP on, another player the blade passes through, once a swing)
  for(const q of pvpFoes(M.drv)){if(S.hit.has(q)||q.pos.y<M.y-1.5||q.pos.y>M.y+MG.hy)continue;const dx=q.pos.x-M.x,dz=q.pos.z-M.z,d=Math.hypot(dx,dz)||0.01,a=mgSlAng(S,dx,dz);
    if(d<=R&&(f0===0?a>=a0:a>a0)&&a<=a1){S.hit.add(q);pvpHurt(M.drv,q,MGW.bladeDmg,q.pos.clone(),new V3(dx/d,0.8,dz/d),"Cut down by a Mobile Gear's heat blade",{cd:0});}}
  // (vehicles: a blow at three points round the arc, a third of the way along the blade's length and two thirds)
  for(const q of [1/6,1/2,5/6])if(f0<q&&f1>=q){const a=mgSweepA(q),ux=S.fx*Math.cos(a)+lx*Math.sin(a),uz=S.fz*Math.cos(a)+lz*Math.sin(a);
    for(const r of [MG.r+MGW.bladeR*0.35,MG.r+MGW.bladeR*0.75])vehBlast(M.x+ux*r,M.y+4.5,M.z+uz*r,MGW.bladeR*0.22,MGW.bladeVD*0.5,M);}
  mgSlice(M,S,f0===0?a0-1e-6:a0,a1);
  if(f0===0){const e=mgAt(M,0,4.5,MG.r+3);puff(e.x,e.y,e.z,8,0xffa040,1.2);if(audio)sfx('Mobile Gear blade',()=>{noise(0.25,0.25,2600,'bandpass');tone('sawtooth',700,160,0.22,0.05);});addShake(0.25,M.x,M.z,16);}
}
// the blade's cut through the blocks: the slice of the arc between angles lo and hi (see mgSlAng), from just past its
// body to the blade's tip, at the blade's height, three blocks deep (the same wreckage as ramming: the blocks fly, and
// what's left with nothing under it can come down)
function mgSlice(M,S,lo,hi){
  if(SBX)return 0;const R0=MG.r+1.2,R1=MG.r+MGW.bladeR,y0=Math.floor(M.y+3.6),y1=Math.floor(M.y+5.6),E=Math.ceil(R1)+1;
  const ch=new Set(),broken=[],cx0=Math.floor(M.x),cz0=Math.floor(M.z);
  for(let bz=cz0-E;bz<=cz0+E;bz++)for(let bx=cx0-E;bx<=cx0+E;bx++){const rx=bx+0.5-M.x,rz=bz+0.5-M.z,d=Math.hypot(rx,rz);if(d<R0||d>R1)continue;const a=mgSlAng(S,rx,rz);if(a<=lo||a>hi)continue;
    for(let by=y0;by<=y1;by++){const b=get(bx,by,bz);if(b===AIR||b===WATER||b===BEDROCK||by<1||by>=H)continue;
      setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
      for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((bx+ox)/CS),Math.floor((bz+oz)/CS)));}}
  S.cut=(S.cut||0)+broken.length;
  if(!broken.length)return 0;
  // (the bits fly on round the way the blade's going: toward its left)
  const am=(lo+hi)/2,lx=S.fz,lz=-S.fx,ux=S.fx*Math.cos(am)+lx*Math.sin(am),uz=S.fz*Math.cos(am)+lz*Math.sin(am);
  const o={force:0.9,dx:ux+lx*0.6,dz:uz+lz*0.6,up:0.6};rebuildSet(ch);save();destroyFX(broken.slice(0,60),o);settle(broken,o);pumpsHit(broken);
  knockProps(M.x+ux*(MG.r+MGW.bladeR*0.5),M.y+4.5,M.z+uz*(MG.r+MGW.bladeR*0.5),MGW.bladeR*0.5,ux,uz);
  return broken.length;}
// one missile off the pod: up and out first, then it turns after its lock (or the crosshair's spot, with none)
function mgMissile(M,p,T){
  const m=mgPodAt(M),f=mgFwd(p),k=(M.podN=(M.podN||0)+1),sd=((k%4)-1.5)*0.35,c=Math.cos(M.ty),s=Math.sin(M.ty);
  const vx=f.x*0.45+c*sd*0.4,vy=0.85,vz=f.z*0.45-s*sd*0.4,L=Math.hypot(vx,vy,vz),v=24;
  const A=T?null:mgLead(M,p,m.x,m.y,m.z,MGW.missV);
  shot({kind:'missile',x:m.x,y:m.y,z:m.z,vx:vx/L*v,vy:vy/L*v,vz:vz/L*v,grav:0,fuse:6,R:MGW.missR,dmg:MGW.missDmg,crush:MGW.missCrush,vd:MGW.missVD,own:M,
    cause:"Blown up by a Mobile Gear's missile",by:pvpBy(p),tgt:T,at:A,sp:MGW.missV,turn:MGW.missTurn});
  M.podT=0.5;puff(m.x,m.y,m.z,2,0xdadada,0.3);if(audio)sfx('Mobile Gear missile',()=>noise(0.3,0.16,1200,'bandpass'));}
// the cannon's shell, from over the right shoulder at the lock (led) or the crosshair, lifted a touch for its drop; a
// big flash, and a kick that shoves it back in the air
function mgCannon(M,p){
  if(!wpnFire(M,'cannon'))return;const m=mgCannonAt(M),A=mgLead(M,p,m.x,m.y,m.z,MGW.canV),dx=A.x-m.x,dz=A.z-m.z,L=Math.hypot(dx,A.y-m.y,dz)||1,t=L/MGW.canV,sp=MGW.canV;
  shot({kind:'shell',x:m.x,y:m.y,z:m.z,vx:dx/L*sp,vy:(A.y-m.y)/L*sp+MGW.canGrav*t*0.5,vz:dz/L*sp,grav:MGW.canGrav,fuse:5,R:MGW.canR,dmg:MGW.canDmg,crush:MGW.canCrush,vd:MGW.canVD,own:M,
    cause:"Blasted by a Mobile Gear's cannon",by:pvpBy(p)});
  M.cnT=Math.max(M.cnT||0,0.9);blastFx(m.x,m.y,m.z,0.25,1.2);smoke(m.x,m.y,m.z,6,0x8a8a8a);addShake(0.6,M.x,M.z,30);
  if(audio)sfx('Mobile Gear cannon',()=>{noise(0.6,0.5,700,'lowpass');tone('sawtooth',110,30,0.6,0.16);});
  if(!M.grounded){const h=Math.hypot(dx,dz)||1;M.vx-=dx/h*MGW.recoil;M.vz-=dz/h*MGW.recoil;M.vy=Math.max(M.vy,0)+2;}}
// the weapons' part of the pose: the right arm brings the rifle on to what it's shooting at, kicking with each round;
// the left swings the blade across; the cannon swings over the shoulder to fire and back after; the pod's lid opens
// while it's locking and firing (ap: where the view's pitched, the arms' usual aim; ease: mechPose's easing)
function mgWpnPose(M,J,ap,dt,ease){
  const R=J.arms.find(a=>a.s<0),Lf=J.arms.find(a=>a.s>0),busy=M.rfT>0||!!mgTarget(M);
  M.raA=ease(M.raA||0,busy?1:0,8);
  if(M.raA>0.01){const T=mgTarget(M),m=mgRifleAt(M);let az=0,el=ap;
    if(T&&lockAlive(T)){const dx=T.pos.x-m.x,dz=T.pos.z-m.z;az=Math.max(-0.7,Math.min(0.7,angDiff(M.ty,Math.atan2(dx,dz))));el=Math.max(-0.8,Math.min(0.7,Math.atan2(lockY(T)-m.y,Math.hypot(dx,dz))));}
    const k=M.raA,kick=M.rkT>0?0.12:0;R.sh.rotation.y+=(az-R.sh.rotation.y)*k;
    R.sh.rotation.x+=((-0.25-el*0.3-M.pt*0.5)-R.sh.rotation.x)*k;R.el.rotation.x+=((-(Math.PI/2-0.25)-el*0.7-M.pt*0.5+kick)-R.el.rotation.x)*k;}
  else R.sh.rotation.y=0;
  // (the swing. The reach: the left hand drawn across to its right side, the body turning with it and the right arm
  // lifting out of the way; the blade lights from the hand as it gets there; then one quick level sweep out to its left,
  // the arm straightening and the body following through; then the blade goes back into the hand as it settles back.
  // k: how far the arm's in the swing's pose rather than its usual one; tw the body's extra turn; rr the right arm lifted)
  const S=M.sl;let tw=0,rr=0,ig=0;
  if(S){const e=S.e,w=S.w,sw=MGW.sweepT;let k,y,x,el,z;
    if(e<w){k=mgEase(e/(w*0.75));y=-1.15;x=-0.55;el=-1.35;z=-0.2;tw=-0.45*k;rr=k;ig=mgEase((e-(w-MGW.igniteT))/MGW.igniteT);}
    else if(e<w+sw){const q=(e-w)/sw,s1=mgEase(q),s2=mgEase(q*1.6);k=1;y=-1.15+2.9*s1;x=-0.55-0.45*s2-ap*0.2;el=-1.35+0.8*s2;z=-0.2+0.2*s1;tw=-0.45+0.85*s1;rr=1-0.6*s1;ig=1;}
    else{const r=mgEase((e-w-sw)/MGW.backT);k=1-r;y=1.75;x=-1.0-ap*0.2;el=-0.55;z=0;tw=0.4*k;rr=0.4*k;ig=1-mgEase((e-w-sw)/(MGW.backT*0.45));}
    Lf.sh.rotation.y=y*k;Lf.sh.rotation.x+=(x-Lf.sh.rotation.x)*k;Lf.el.rotation.x+=(el-Lf.el.rotation.x)*k;Lf.sh.rotation.z+=(z-Lf.sh.rotation.z)*k;}
  else Lf.sh.rotation.y=0;
  Lf.bl.visible=ig>0.01;Lf.bl.scale.y=Math.max(0.01,ig);
  J.T.rotation.y+=tw;R.sh.rotation.x-=0.35*rr;R.sh.rotation.z+=-0.3*rr;
  M.cnA=ease(M.cnA||0,M.brace>0||M.cnT>0?1:0,M.brace>0?14:5);J.cannon.rotation.x=-2.2*(1-M.cnA)+(-ap-M.pt)*M.cnA;
  M.pdA=ease(M.pdA||0,M.pod||M.podQ&&M.podQ.length||M.podT>0?1:0,10);J.podLid.rotation.x=-1.05*M.pdA;
}
