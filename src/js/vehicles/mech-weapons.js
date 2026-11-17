// ---- The Mobile Gear's weapons and lock-on (see mech.js for the machine itself). Four weapons, one on each trigger, each
// with its own load and reload (DRV_WPN.mech, through the same wpnFire as a tank's): the Rivet Rifle in the right hand
// (held: a stream of rounds), the Heat Cleaver in the left (a lunge forward, at what's locked if it's near, then a
// long glowing blade swept right to left round in front of it, cutting through goblins, vehicles and walls), the Swarm Pod on the left shoulder (held: it locks up to four targets in the
// lock box, let go: a homing missile at each) and the Breaker Cannon on the right (on the ground it braces a moment,
// then a heavy shell; in the air it fires at once and the kick shoves it back).
// Lock-on: whatever's in the lock box round the crosshair is picked out by itself (the soft lock, M.soft) and the arms'
// shots go at it, led for its speed; the hard lock button holds on to it (M.hard), turning the camera to keep it in
// view while you move round it ----
// (every weapon it can carry, by key. The first four are what it carries unless the loadout says otherwise)
const MG_WPNS={rifle:{k:'rifle',name:'Rivet Rifle',max:40,gap:0.1,reload:2.5,act:'mgArmR'},blade:{k:'blade',name:'Heat Cleaver',max:1,gap:0,reload:1.2,act:'mgArmL',cool:true},
  pod:{k:'pod',name:'Swarm Pod',max:8,gap:0.07,reload:6,act:'mgShL'},cannon:{k:'cannon',name:'Breaker Cannon',max:3,gap:0.9,reload:7,act:'mgShR'},
  shotgun:{k:'shotgun',name:'Scrap Shotgun',max:6,gap:0.6,reload:3.2,act:'mgArmR'},rifleL:{k:'rifleL',name:'Rivet Rifle',max:40,gap:0.1,reload:2.5,act:'mgArmL'},
  volley:{k:'volley',name:'Rocket Volley',max:12,gap:0.14,reload:7,act:'mgShL'},lobber:{k:'lobber',name:'Clod Lobber',max:6,gap:0.55,reload:5,act:'mgShR'}};
DRV_WPN.mech=[MG_WPNS.rifle,MG_WPNS.blade,MG_WPNS.pod,MG_WPNS.cannon];
// ---- the loadout: which weapon each of its four slots carries, picked in the Testing Environment panel (MG_LOAD, kept in
// this browser) and copied into each Mobile Gear as it's spawned (M.load), so changing it never swaps the guns on one
// already standing. Each slot's choices are weapons that fit that place on the body (arm or shoulder, left or right) ----
const MG_SLOTS=[{act:'mgArmL',n:'Left arm',ks:['blade','rifleL']},{act:'mgArmR',n:'Right arm',ks:['rifle','shotgun']},
  {act:'mgShL',n:'Left shoulder',ks:['pod','volley']},{act:'mgShR',n:'Right shoulder',ks:['cannon','lobber']}];
const MG_LOAD_KEY='goblin-stompin-gus-mech-loadout',MG_LOAD_DEF={mgArmL:'blade',mgArmR:'rifle',mgShL:'pod',mgShR:'cannon'};
// (a loadout with anything missing or not allowed in its slot gets that slot's first choice, so a bad save can't break it)
const mgLoadFix=L=>{const o={};for(const S of MG_SLOTS)o[S.act]=L&&S.ks.includes(L[S.act])?L[S.act]:S.ks[0];return o;};
let MG_LOAD=mgLoadFix((()=>{try{return JSON.parse(localStorage.getItem(MG_LOAD_KEY)||'null');}catch(e){return null;}})());
function mgLoadSet(act,k){MG_LOAD=mgLoadFix(Object.assign({},MG_LOAD,{[act]:k}));try{localStorage.setItem(MG_LOAD_KEY,JSON.stringify(MG_LOAD));}catch(e){}}
// (a loadout as four digits, each slot's choice, for sending online; and back)
const mgLoadCode=L=>MG_SLOTS.map(S=>Math.max(0,S.ks.indexOf(L[S.act]))).join(''),mgLoadDecode=c=>mgLoadFix(Object.fromEntries(MG_SLOTS.map((S,i)=>[S.act,S.ks[+((c||'')[i]||0)]])));
// the weapons one Mobile Gear carries, in the slots' order, and its ammunition made ready from them
const mgWpnList=M=>{const L=M.load||MG_LOAD_DEF;return MG_SLOTS.map(S=>MG_WPNS[L[S.act]]);};
const mgArm=M=>wpnInit(M,'mech',mgWpnList(M));
// (box: the lock box's half-width round the crosshair, as an angle; range: how far off it picks things out; hardRange:
// past this a hard lock lets go; camTurn: how fast a hard lock turns the camera, a second. The blade: a locked target
// within bladeReach is lunged at till it's bladeMid off, at most lungeMax; with none it lunges lunge ahead. Its cut
// reaches bladeR past the body, bladeArc either side of straight ahead. The swing: windT reaching across to its right
// (the lunge goes in this too), the blade lit for the last igniteT of it, the cut swept in sweepT, then backT to put it away)
const MGW={box:0.22,range:150,hardRange:170,camTurn:2.4,
  rifleDmg:3,rifleSc:0.006,
  bladeReach:24,bladeMid:8,lunge:7,lungeMax:12,bladeDmg:20,bladeVD:90,bladeR:13,bladeArc:1.92,bladeY:4.5,swingUp:0.6,swingDown:0.8,lungeT:0.38,windT:0.34,igniteT:0.12,sweepT:0.14,backT:0.4,
  podLock:0.2,podLocks:4,missV:50,missTurn:5,missR:2.6,missDmg:4,missVD:35,missCrush:1.4,
  canV:95,canGrav:3,brace:0.4,canR:5.5,canDmg:10,canVD:180,canCrush:3.8,recoil:14,canImp:2,bladeImp:2,
  pellets:9,pelletDmg:2,shotSc:0.05,shotImp:1.6,
  rktV:70,rktR:3.2,rktDmg:5,rktVD:50,rktCrush:1.8,rktTurn:0.6,
  lobV:48,lobGrav:16,lobR:3.6,lobDmg:6,lobVD:80,lobCrush:2.4,lobImp:1.3};
// (pellets: how many a shotgun shot holds, each pelletDmg to a goblin, scattered by shotSc; shotImp how much more it jolts
// than a rifle round. The volley's rockets: speed rktV, turning only a little (rktTurn) toward where they were aimed.
// The lobber's shells: lobV, under lobGrav, so they arc high and come down on what's aimed at)
// a point on the mech in its torso's frame (x to its left, y up from its feet, z ahead), out in the world
function mgAt(M,lx,ly,lz){const a=M.ty??M.h,c=Math.cos(a),s=Math.sin(a);return{x:M.x+lx*c+lz*s,y:M.y+ly,z:M.z-lx*s+lz*c};}
// the camera's forward line
function mgFwd(p){const cp=Math.cos(p.cam.pitch);return{x:-Math.sin(p.cam.yaw)*cp,y:Math.sin(p.cam.pitch),z:-Math.cos(p.cam.yaw)*cp};}
// how far off the crosshair a target is, as an angle from the camera (less its size, so a tank's edge counts)
function mgOff(p,t){const c=p.camera.position,f=mgFwd(p),ty=lockY(t),dx=t.pos.x-c.x,dy=ty-c.y,dz=t.pos.z-c.z,L=Math.hypot(dx,dy,dz)||1;
  return Math.max(0,Math.acos(Math.max(-1,Math.min(1,(dx*f.x+dy*f.y+dz*f.z)/L)))-Math.atan((isMilT(t)?MIL[t.kind].hz:0.5)/L));}
// what's locked: the hard lock, or else the soft one
const mgTarget=M=>M.hard||M.soft||null;
// ---- impact and stagger: the army's tanks and helicopters and the Mobile Gear each have an impact meter that every hit
// fills (by its damage, times impX for the heavy blows: the cannon, the blade, the kick) and that drains once they've not
// been hit for IMP.wait. Full, they're staggered for IMP.stag: they can't move or fire, and take IMP.mul times damage ----
const IMP={tank:120,heli:90,wait:1.2,drain:30,stag:2,mul:1.5};let impX=1;
const impMax=T=>T.isMech?MG.impMax:IMP[T.kind]||100;
// a hit of n on T: its meter filled, and the damage it actually takes (more while staggered)
function impHit(T,n){
  if(T.stag>0)return n*IMP.mul;
  T.imp=(T.imp||0)+n*impX;T.impT=0;
  if(T.imp>=impMax(T)){T.imp=0;T.stag=IMP.stag;if(T.isMech){T.ab=null;T.kick=null;T.lgT=0;T.brace=0;}
    if(audio)sfx('Staggered',()=>{tone('square',300,120,0.3,0.06);noise(0.3,0.2,900,'bandpass');});
    puff(T.x,T.y+(T.isMech?6:2.5),T.z,12,0xffe060,1.2);}
  return n;}
function impTick(T,dt){if(T.stag>0){T.stag-=dt;if(T.stag<=0)T.stag=0;return;}T.impT=(T.impT||0)+dt;if(T.impT>IMP.wait)T.imp=Math.max(0,(T.imp||0)-IMP.drain*dt);}
// the lock box: everything in it (M.inBox), the soft lock (the best of them: nearest the middle, hostile goblins and
// the army's vehicles before townsfolk, ones in sight first, and the one already locked kept unless another's clearly
// better), and the hard lock's button. Then the target's speed, smoothed, for leading it; and a hard lock turning the
// camera after it
// a hostile vehicle, a deck weapon or a jet: picked out (lockTargets) and held twice as far off as anyone on foot
const mgBigT=t=>isMilT(t)||!!(t&&(t.isMountT||t.isJetT));
function mgLocks(M,p,i,dt){
  let best=null,bs=1e9;M.inBox=[];
  for(const o of lockTargets(p,MGW.range)){const t=o.t,a=mgOff(p,t);if(a>MGW.box)continue;M.inBox.push(t);
    const sc=a*40+o.d*0.02+(t.civ?3:0)+(isMilT(t)||t.isMountT||t.isJetT?-1:0)+o.hid+(t===M.soft?-1.5:0);if(sc<bs){bs=sc;best=t;}}
  if(best!==M.soft&&best&&audio)sfx('Mobile Gear lock',()=>tone('square',1400,1400,0.03,0.025));
  M.soft=best;
  if(i.mgLockP){
    if(M.hard){M.hard=null;tone('triangle',620,380,0.07,0.035);}
    else{let t=best;if(!t){let b2=1e9;for(const o of lockTargets(p,MGW.range)){const a=mgOff(p,o.t);if(a>0.8)continue;const sc=a*40+o.d*0.02+o.hid;if(sc<b2){b2=sc;t=o.t;}}}   // (nothing in the box: anything a little wider of it)
      if(t){M.hard=t;tone('square',880,1320,0.08,0.035);}else tone('square',180,140,0.06,0.03);}}
  if(M.hard&&(!lockAlive(M.hard)||Math.hypot(M.hard.pos.x-M.x,M.hard.pos.z-M.z)>MGW.hardRange*(mgBigT(M.hard)?2:1))){M.hard=null;tone('triangle',520,300,0.08,0.03);}
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
const mgRifleAt=M=>mgAt(M,-1.84,4.6,3.0),mgRifleLAt=M=>mgAt(M,1.84,4.6,3.0),mgCannonAt=M=>mgAt(M,-0.95,7.9,2.9),mgPodAt=M=>mgAt(M,0.95,7.1,-0.2);
// one step of the weapons, for the pilot p (called first thing in drvMech, so a hard lock's turn of the camera counts
// this step)
function mgWeapons(M,p,i,dt){
  mgArm(M);wpnTick(M,dt);mgLocks(M,p,i,dt);const W=M.wpn;
  M.rfT=Math.max(0,(M.rfT||0)-dt);M.rkT=Math.max(0,(M.rkT||0)-dt);M.rfLT=Math.max(0,(M.rfLT||0)-dt);M.rkLT=Math.max(0,(M.rkLT||0)-dt);M.cnT=Math.max(0,(M.cnT||0)-dt);M.podT=Math.max(0,(M.podT||0)-dt);
  // (the rifle: held, a round every W.gap, a little scattered, to the first goblin, vehicle or wall on the line)
  if(i.mgArmR&&wpnFire(M,'rifle')){const m=mgRifleAt(M),A=mgLead(M,p,m.x,m.y,m.z,400);
    gunRound(M,p,m.x,m.y,m.z,MGW.rifleDmg,MGW.rifleSc,'Riveted by a Mobile Gear','Mobile Gear rifle',A);M.rfT=0.6;M.rkT=0.08;puff(m.x,m.y,m.z,1,0xffd080,0.15);}
  // (the same rifle carried in the left hand instead of the blade)
  if(i.mgArmL&&W.rifleL&&wpnFire(M,'rifleL')){const m=mgRifleLAt(M),A=mgLead(M,p,m.x,m.y,m.z,400);
    gunRound(M,p,m.x,m.y,m.z,MGW.rifleDmg,MGW.rifleSc,'Riveted by a Mobile Gear','Mobile Gear rifle',A);M.rfLT=0.6;M.rkLT=0.08;puff(m.x,m.y,m.z,1,0xffd080,0.15);}
  // (the shotgun in the right hand: a spread of pellets each shot, short-ranged but hard-hitting, and it jolts what it
  // hits more than the rifle does)
  if(i.mgArmR&&W.shotgun&&wpnFire(M,'shotgun')){const m=mgRifleAt(M),A=mgLead(M,p,m.x,m.y,m.z,400);impX=MGW.shotImp;
    for(let k=0;k<MGW.pellets;k++)gunRound(M,p,m.x,m.y,m.z,MGW.pelletDmg,MGW.shotSc,'Blasted by a Mobile Gear\'s shotgun',k?'Mobile Gear shotgun pellet':'Mobile Gear shotgun',A);
    impX=1;M.rfT=0.8;M.rkT=0.2;puff(m.x,m.y,m.z,4,0xffd080,0.4);addShake(0.12,M.x,M.z,10);if(audio)sfx('Mobile Gear shotgun',()=>{noise(0.25,0.35,900,'lowpass');tone('square',140,60,0.12,0.06);});}
  // (the blade: a lunge forward, at the locked target if it's within reach (stopping with it about halfway along the
  // blade), otherwise the way you're looking; then the sweep, right to left. Not again until this swing's done)
  if(i.mgArmLP&&!M.sl&&wpnFire(M,'blade')){const T=mgTarget(M),f=mgFwd(p),fh=Math.hypot(f.x,f.z)||1;let fx=f.x/fh,fz=f.z/fh,go=MGW.lunge;
    if(T){const dx=T.pos.x-M.x,dz=T.pos.z-M.z,d=Math.hypot(dx,dz)||1;if(d<MGW.bladeReach){fx=dx/d;fz=dz/d;go=Math.min(MGW.lungeMax,Math.max(0,d-MG.r-MGW.bladeMid));}}
    M.lgT=0;
    // (the lunge starts at three times its average speed and eases to a stop, so it covers go in all and settles rather than halting)
    if(go>0.5){const v=3*go/MGW.lungeT;M.lgT=MGW.lungeT;M.lgx=fx*v;M.lgz=fz*v;}
    M.sl={fx,fz,e:0,w:Math.max(MGW.windT,M.lgT*0.75+0.08),f:0,hit:new Set(),pt:mgSwingPitch(M,p,T)};if(audio)sfx('Mobile Gear blade',()=>tone('triangle',120,90,0.12,0.03));}
  if(M.sl){const S=M.sl;S.e+=dt;
    // (the blade lights as the reach finishes: a rising hum and a flash at the hand)
    if(!S.lit&&S.e>=S.w-MGW.igniteT){S.lit=true;const h=mgAt(M,-0.6,5.0,1.4);puff(h.x,h.y,h.z,6,0xffc070,0.5);if(audio)sfx('Mobile Gear blade',()=>{tone('sawtooth',90,520,0.14,0.05);noise(0.12,0.08,3200,'bandpass');});}
    const f=mgEase((S.e-S.w)/MGW.sweepT);if(f>S.f){mgSlash(M,S,S.f,f);S.f=f;}if(S.e>S.w+MGW.sweepT+MGW.backT)M.sl=null;}
  // (the pod: held, a lock every MGW.podLock on what's in the box, the least locked first, up to four or what's
  // loaded; let go, the missiles go one after another, each at its own lock (none: one, at the crosshair))
  const pd=W.pod;
  if(pd&&i.mgShL){if(!M.pod){M.pod={locks:[],k:0.05};if(pd.rl>0||pd.n<=0)wpnClick();}
    const P=M.pod;P.k-=dt;P.locks=P.locks.filter(t=>lockAlive(t));
    if(P.k<=0&&pd.rl<=0&&P.locks.length<Math.min(MGW.podLocks,pd.n)&&M.inBox.length){
      let t=null,bn=1e9;for(const c of M.inBox){const n=P.locks.filter(q=>q===c).length*10+(c===M.soft?0:1)+(c.civ?3:0);if(n<bn){bn=n;t=c;}}
      P.locks.push(t);P.k=MGW.podLock;if(audio)sfx('Mobile Gear missile lock',()=>tone('square',1100+P.locks.length*180,1100+P.locks.length*180,0.05,0.03));}}
  else if(pd&&M.pod){const L=M.pod.locks;M.pod=null;if(pd.rl<=0&&pd.n>0)M.podQ=L.length?L.slice():[null];}
  if(pd&&M.podQ&&M.podQ.length){if(pd.rl>0)M.podQ=null;else if(pd.cd<=0&&wpnFire(M,'pod'))mgMissile(M,p,M.podQ.shift());}
  // (the cannon: on the ground it braces first (M.brace: it stops, crouches and swings the barrel over its shoulder),
  // then fires; in the air at once)
  // (the rocket volley instead: held, rockets one after another, unguided, straight at the crosshair or the lock)
  if(i.mgShL&&W.volley&&wpnFire(M,'volley'))mgRocket(M,p);
  // (the lobber instead: held, a clod of a shell every W.gap, lobbed high so it drops on to what's aimed at)
  if(i.mgShR&&W.lobber&&wpnFire(M,'lobber'))mgLob(M,p);
  const cw=W.cannon;
  if(cw&&i.mgShRP&&!(M.brace>0)){if(cw.rl>0||cw.n<=0)wpnClick();else if(cw.cd<=0){if(M.grounded&&!M.ab){M.brace=MGW.brace;M.cnT=MGW.brace+0.9;}else mgCannon(M,p);}}
  if(M.brace>0){M.brace-=dt;if(M.brace<=0){M.brace=0;mgCannon(M,p);}}
}
// with nobody in it: no locks, nothing firing, but the weapons still reload
function mgDisarm(M,dt){mgArm(M);wpnTick(M,dt);M.soft=M.hard=null;M.inBox=[];M.pod=null;M.podQ=null;M.brace=0;M.lgT=0;M.sl=null;
  for(const k of ['rfT','rkT','rfLT','rkLT','cnT','podT'])M[k]=Math.max(0,(M[k]||0)-dt);}
// (smoothstep: slow out, fast through the middle, slow in; the swing's cut follows the arm's swing exactly)
const mgEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// which way round from straight ahead (S.fx,S.fz) the point rx,rz is: 0 ahead, plus to the mech's left, minus to its
// right; and the sweep's angle a fraction f of the way through it (from bladeArc to its right, round to bladeArc left)
const mgSlAng=(S,rx,rz)=>Math.atan2(rx*S.fz-rz*S.fx,rx*S.fx+rz*S.fz),mgSweepA=f=>-MGW.bladeArc+2*MGW.bladeArc*f;
// one step of the sweep, from fraction f0 to f1 of the way round: goblins the blade passes through cut down (each once a
// swing), vehicles hurt hard, the blocks in that slice of the arc cut through. Sparks and the sound with the first step
// how far the swing tilts (radians, below level negative): at a locked target, the angle from the blade's height to it;
// otherwise at whatever the crosshair is on within the blade's reach (the ground in front, looking down), or at the
// crosshair's height that far out. The blade's height is MGW.bladeY up, and its plane through the mech dips or rises by
// the tilt's slope going forward (mgSwY)
function mgSwingPitch(M,p,T){
  const hb=M.y+MGW.bladeY,cl=a=>Math.max(-MGW.swingDown,Math.min(MGW.swingUp,a));
  if(T&&lockAlive(T)){const dx=T.pos.x-M.x,dz=T.pos.z-M.z;return cl(Math.atan2(lockY(T)-hb,Math.max(MG.r+2,Math.hypot(dx,dz))));}
  // (the view's line from where mechCamera puts it: behind and above the head, p.drvCamD back)
  if(!p.cam)return 0;const cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp,cd=p.drvCamD||11;
  const c={x:M.x-fx*cd,y:(M.g?M.g.position.y:M.y)+9.4-fy*cd,z:M.z-fz*cd};
  for(let t=0;t<90;t+=0.4){const x=c.x+fx*t,y=c.y+fy*t,z=c.z+fz*t,hd=Math.hypot(x-M.x,z-M.z);if(hd<MG.r+1)continue;
    if(hd>=MGW.bladeReach||solidAt(Math.floor(x),Math.floor(y),Math.floor(z)))return cl(Math.atan2(y-hb,hd));}
  return 0;
}
// the height of the swing's plane at fwd out in front of the mech (along the way it's swinging at)
const mgSwY=(M,S,fwd)=>M.y+MGW.bladeY+fwd*Math.tan(S.pt||0);
function mgSlash(M,S,f0,f1){
  mgSlashAt(M,M,S,f0,f1,false);
  // (a ship alongside, or under it: the same cut again in the ship's pocket, with the Mobile Gear and its swing turned
  // into the ship's frame. It stands out in the world on the ship's boxes, but the ship's blocks, and anyone and
  // anything aboard, are in the pocket)
  if(shipN)for(const Sh of SHIPS){if(!Sh||Sh.dead)continue;const K=Sh.K,r=Math.hypot(K.u1-K.u0,K.w1-K.w0)/2+MG.r+MGW.bladeR+2;if(Math.hypot(Sh.x-M.x,Sh.z-M.z)>r)continue;
    const t=worldToShip(Sh,M.x,M.z,{x:0,z:0}),d={x:S.fx,z:S.fz};shipRot(d,'x','z',-Sh.yaw);
    const Si=Object.create(S);Si.fx=d.x;Si.fz=d.z;Si.cut=S.cut||0;mgSlashAt({x:t.x,y:M.y+Sh.sk,z:t.z,drv:M.drv},M,Si,f0,f1,true);S.cut=Si.cut;}
}
// one step of the cut in one frame: M where the Mobile Gear is in it (Mo the Mobile Gear itself, spared its own blows),
// S the swing turned into it; inShip: a ship's pocket (the flash, sound and shake are made once, in the world)
function mgSlashAt(M,Mo,S,f0,f1,inShip){
  const a0=mgSweepA(f0),a1=mgSweepA(f1),R=MGW.bladeR+MG.r,lx=S.fz,lz=-S.fx;
  // (goblins: anything from the blade's plane down to six below it, or two above: level, that's everything from its
  // feet to its head)
  for(const g of goblins){if(g.state!=='chase'||S.hit.has(g))continue;const dx=g.pos.x-M.x,dz=g.pos.z-M.z,py=mgSwY(M,S,dx*S.fx+dz*S.fz);if(g.pos.y<py-6||g.pos.y>py+2)continue;
    const d=Math.hypot(dx,dz)||0.01,a=mgSlAng(S,dx,dz);
    if(d<=R&&(f0===0?a>=a0:a>a0)&&a<=a1){S.hit.add(g);damageGoblin(g,MGW.bladeDmg,g.pos.clone(),new V3(dx/d,0.8,dz/d),"Cut down by a Mobile Gear's heat blade");}}
  // (with PvP on, another player the blade passes through, once a swing)
  for(const q of pvpFoes(M.drv)){if(S.hit.has(q))continue;const dx=q.pos.x-M.x,dz=q.pos.z-M.z,py=mgSwY(M,S,dx*S.fx+dz*S.fz);if(q.pos.y<py-6||q.pos.y>py+2)continue;const d=Math.hypot(dx,dz)||0.01,a=mgSlAng(S,dx,dz);
    if(d<=R&&(f0===0?a>=a0:a>a0)&&a<=a1){S.hit.add(q);pvpHurt(M.drv,q,MGW.bladeDmg,q.pos.clone(),new V3(dx/d,0.8,dz/d),"Cut down by a Mobile Gear's heat blade",{cd:0});}}
  // (vehicles: a blow at three points round the arc, a third of the way along the blade's length and two thirds)
  for(const q of [1/6,1/2,5/6])if(f0<q&&f1>=q){const a=mgSweepA(q),ux=S.fx*Math.cos(a)+lx*Math.sin(a),uz=S.fz*Math.cos(a)+lz*Math.sin(a);
    for(const r of [MG.r+MGW.bladeR*0.35,MG.r+MGW.bladeR*0.75]){impX=MGW.bladeImp;vehBlast(M.x+ux*r,mgSwY(M,S,r*Math.cos(a)),M.z+uz*r,MGW.bladeR*0.22,MGW.bladeVD*0.5,Mo);impX=1;}}
  mgSlice(M,S,f0===0?a0-1e-6:a0,a1);
  if(f0===0&&!inShip){const e=mgAt(M,0,MGW.bladeY+(MG.r+3)*Math.tan(S.pt||0),MG.r+3);puff(e.x,e.y,e.z,8,0xffa040,1.2);if(audio)sfx('Mobile Gear blade',()=>{noise(0.25,0.25,2600,'bandpass');tone('sawtooth',700,160,0.22,0.05);});addShake(0.25,M.x,M.z,16);}
}
// the blade's cut through the blocks: the slice of the arc between angles lo and hi (see mgSlAng), from just past its
// body to the blade's tip, at the blade's height, three blocks deep (the same wreckage as ramming: the blocks fly, and
// what's left with nothing under it can come down)
function mgSlice(M,S,lo,hi){
  if(SBX)return 0;const R0=MG.r+1.2,R1=MG.r+MGW.bladeR,E=Math.ceil(R1)+1;
  const ch=new Set(),broken=[],cx0=Math.floor(M.x),cz0=Math.floor(M.z);
  for(let bz=cz0-E;bz<=cz0+E;bz++)for(let bx=cx0-E;bx<=cx0+E;bx++){const rx=bx+0.5-M.x,rz=bz+0.5-M.z,d=Math.hypot(rx,rz);if(d<R0||d>R1)continue;const a=mgSlAng(S,rx,rz);if(a<=lo||a>hi)continue;
    // (three blocks deep round the plane's height there: tilted, the cut dips or climbs going out)
    const yc=mgSwY(M,S,rx*S.fx+rz*S.fz),y0=Math.floor(yc-0.9),y1=Math.floor(yc+1.1);
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
    cause:"Blasted by a Mobile Gear's cannon",by:pvpBy(p),imp:MGW.canImp});
  M.cnT=Math.max(M.cnT||0,0.9);blastFx(m.x,m.y,m.z,0.25,1.2);smoke(m.x,m.y,m.z,6,0x8a8a8a);addShake(0.6,M.x,M.z,30);
  if(audio)sfx('Mobile Gear cannon',()=>{noise(0.6,0.5,700,'lowpass');tone('sawtooth',110,30,0.6,0.16);});
  if(!M.grounded){const h=Math.hypot(dx,dz)||1;M.vx-=dx/h*MGW.recoil;M.vz-=dz/h*MGW.recoil;M.vy=Math.max(M.vy,0)+2;}}
// one rocket off the volley: straight out of the pod's tubes the way it's aimed (at the lock, led, or the crosshair),
// steering only a little, a bigger blast than a missile's
function mgRocket(M,p){
  const m=mgPodAt(M),A=mgLead(M,p,m.x,m.y,m.z,MGW.rktV),dx=A.x-m.x,dy=A.y-m.y,dz=A.z-m.z,L=Math.hypot(dx,dy,dz)||1,k=(M.podN=(M.podN||0)+1),sd=((k%3)-1)*0.03;
  shot({kind:'rocket',x:m.x,y:m.y,z:m.z,vx:(dx/L+sd)*MGW.rktV,vy:dy/L*MGW.rktV,vz:(dz/L-sd)*MGW.rktV,grav:0,fuse:5,R:MGW.rktR,dmg:MGW.rktDmg,crush:MGW.rktCrush,vd:MGW.rktVD,own:M,
    cause:"Blown up by a Mobile Gear's rocket",by:pvpBy(p),at:A,sp:MGW.rktV,turn:MGW.rktTurn});
  M.podT=0.5;puff(m.x,m.y,m.z,2,0xdadada,0.3);if(audio)sfx('Mobile Gear rocket',()=>noise(0.35,0.22,900,'bandpass'));}
// one of the lobber's shells: out of the barrel over the right shoulder, lifted so it falls on the aim point (the time
// to get there, times half its drop), a smaller blast than the cannon's but more of them and no brace
function mgLob(M,p){
  const m=mgCannonAt(M),A=mgLead(M,p,m.x,m.y,m.z,MGW.lobV),dx=A.x-m.x,dz=A.z-m.z,L=Math.hypot(dx,A.y-m.y,dz)||1,t=L/MGW.lobV,sp=MGW.lobV;
  shot({kind:'shell',x:m.x,y:m.y,z:m.z,vx:dx/L*sp,vy:(A.y-m.y)/L*sp+MGW.lobGrav*t*0.5,vz:dz/L*sp,grav:MGW.lobGrav,fuse:6,R:MGW.lobR,dmg:MGW.lobDmg,crush:MGW.lobCrush,vd:MGW.lobVD,own:M,
    cause:"Buried by a Mobile Gear's lobber",by:pvpBy(p),imp:MGW.lobImp});
  M.cnT=Math.max(M.cnT||0,0.7);blastFx(m.x,m.y,m.z,0.15,0.7);smoke(m.x,m.y,m.z,3,0x8a8a8a);addShake(0.2,M.x,M.z,16);
  if(audio)sfx('Mobile Gear lobber',()=>{noise(0.3,0.3,500,'lowpass');tone('sawtooth',160,70,0.25,0.08);});}
// the weapons' part of the pose: the right arm brings the rifle on to what it's shooting at, kicking with each round;
// the left swings the blade across; the cannon swings over the shoulder to fire and back after; the pod's lid opens
// while it's locking and firing (ap: where the view's pitched, the arms' usual aim; ease: mechPose's easing)
function mgWpnPose(M,J,ap,dt,ease){
  const R=J.arms.find(a=>a.s<0),Lf=J.arms.find(a=>a.s>0),T0=mgTarget(M);
  // (an arm with a gun brings it up on to what it's shooting at while it fires or anything's locked, kicking with each
  // round: the right always, the left too when it carries the rifle instead of the blade)
  const aimArm=(A,a,m,kickT)=>{if(a<=0.01){A.sh.rotation.y=0;return;}let az=0,el=ap;
    if(T0&&lockAlive(T0)){const dx=T0.pos.x-m.x,dz=T0.pos.z-m.z;az=Math.max(-0.7,Math.min(0.7,angDiff(M.ty,Math.atan2(dx,dz))));el=Math.max(-0.8,Math.min(0.7,Math.atan2(lockY(T0)-m.y,Math.hypot(dx,dz))));}
    const kick=kickT>0?0.12:0;A.sh.rotation.y+=(az-A.sh.rotation.y)*a;
    A.sh.rotation.x+=((-0.25-el*0.3-M.pt*0.5)-A.sh.rotation.x)*a;A.el.rotation.x+=((-(Math.PI/2-0.25)-el*0.7-M.pt*0.5+kick)-A.el.rotation.x)*a;};
  M.raA=ease(M.raA||0,M.rfT>0||T0?1:0,8);aimArm(R,M.raA,mgRifleAt(M),M.rkT);
  const lGun=!!(M.load&&M.load.mgArmL==='rifleL');
  if(lGun){M.laA=ease(M.laA||0,M.rfLT>0||T0?1:0,8);aimArm(Lf,M.laA,mgRifleLAt(M),M.rkLT);}
  // (the swing. The reach: the left hand drawn across to its right side, the body turning with it and the right arm
  // lifting out of the way; the blade lights from the hand as it gets there; then one quick level sweep out to its left,
  // the arm straightening and the body following through; then the blade goes back into the hand as it settles back.
  // k: how far the arm's in the swing's pose rather than its usual one; tw the body's extra turn; rr the right arm lifted)
  const S=M.sl;let tw=0,rr=0,ig=0,lean=0;
  if(S){const e=S.e,w=S.w,sw=MGW.sweepT;let k,y,x,el,z;
    if(e<w){k=mgEase(e/(w*0.75));y=-1.15;x=-0.55;el=-1.35;z=-0.2;tw=-0.45*k;rr=k;ig=mgEase((e-(w-MGW.igniteT))/MGW.igniteT);}
    else if(e<w+sw){const q=(e-w)/sw,s1=mgEase(q),s2=mgEase(q*1.6);k=1;y=-1.15+2.9*s1;x=-0.55-0.45*s2-ap*0.2;el=-1.35+0.8*s2;z=-0.2+0.2*s1;tw=-0.45+0.85*s1;rr=1-0.6*s1;ig=1;}
    else{const r=mgEase((e-w-sw)/MGW.backT);k=1-r;y=1.75;x=-1.0-ap*0.2;el=-0.55;z=0;tw=0.4*k;rr=0.4*k;ig=1-mgEase((e-w-sw)/(MGW.backT*0.45));}
    // (aimed low it bends forward at the hips and the arm drops a little more, aimed high it leans back, so the sweep's
    // plane tilts toward what it's aiming at)
    lean=-(S.pt||0)*k;x+=lean*0.3;
    Lf.sh.rotation.y=y*k;Lf.sh.rotation.x+=(x-Lf.sh.rotation.x)*k;Lf.el.rotation.x+=(el-Lf.el.rotation.x)*k;Lf.sh.rotation.z+=(z-Lf.sh.rotation.z)*k;}
  else if(!lGun)Lf.sh.rotation.y=0;
  if(Lf.bl){Lf.bl.visible=ig>0.01;Lf.bl.scale.y=Math.max(0.01,ig);}
  J.T.rotation.y+=tw;J.T.rotation.x+=lean*0.8;R.sh.rotation.x-=0.35*rr;R.sh.rotation.z+=-0.3*rr;
  M.cnA=ease(M.cnA||0,M.brace>0||M.cnT>0?1:0,M.brace>0?14:5);J.cannon.rotation.x=-2.2*(1-M.cnA)+(-ap-M.pt)*M.cnA;
  M.pdA=ease(M.pdA||0,M.pod||M.podQ&&M.podQ.length||M.podT>0?1:0,10);J.podLid.rotation.x=-1.05*M.pdA;
}
