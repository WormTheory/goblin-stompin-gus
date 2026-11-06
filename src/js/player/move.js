const SWIM_HOLD=0.35;   // (holding jump in the water: seconds between paddle strokes upward)
function movePlayer(p,dt){
  if(!p.active)return;
  if(p.state!=='climb')p.vcl=null;   // (a hold on a vehicle's side ends with the cling, however that ended)
  if(playing&&!SBX&&!DT.gob)trampleFences(p);
  if(p.snowU&&playing){const moving=Math.hypot(p.in.x,p.in.z)>0.2;snowGather(p,dt,moving);
    if(p.snowU.value>0.08&&(p.vy>3&&!p.grounded||p.biteT>0||p.state==='stomp'||p.state==='windup'||p.state==='pound'||p.state==='charge'||p.dashT>0||p.lungeT>0))shakeSnow(p,1.6);}
  p.trWas=p.trNow;p.trNow=false;
  p.t+=dt;p.hurt-=dt;p.smashCD-=dt;p.chargeCD-=dt;p.biteRepeat-=dt;p.biteCD=Math.max(0,(p.biteCD||0)-dt);p.knockT=Math.max(0,(p.knockT||0)-dt);
  for(const m of p.mats)m.emissive.setHex(p.hurt>0?0x440000:0x000000);
  // rage eyes: winding up a stomp (or charging a ground pound) makes the eye whites bulge (pupils stay the same size); it fades after the slam
  {const tgt=(p.state==='windup'||p.state==='pound'&&p.pHover)?Math.min(1,0.25+p.stompCharge/2*0.75):0;   // charging a stomp or a ground pound
  p.rage=tgt>(p.rage||0)?(p.rage||0)+(tgt-(p.rage||0))*Math.min(1,dt*8):Math.max(0,(p.rage||0)-dt*0.8);}
  const rg=p.rage,es=1+0.85*rg;
  for(const w of p.eyeWhites)w.scale.setScalar(es);
  // pupils keep their size and wander as usual; they just ride out on the bulging surface of the white
  for(const q of p.pupils){const w=Math.sin(p.t*(q.s>0?1.7:2.3)+q.ph);q.m.position.x=q.s*(0.46+0.02*w);q.m.position.y=0.62+0.025*Math.sin(p.t*(q.s>0?2.9:1.3)+q.ph);q.m.position.z=0.445+0.02*es;}
  for(const q of p.sidePupils){q.m.position.z=0.36+0.03*Math.sin(p.t*(q.s>0?1.9:2.6)+q.ph);q.m.position.y=0.62+0.02*Math.sin(p.t*(q.s>0?1.4:3.1)+q.ph);q.m.position.x=q.s*(0.525+0.02*es);}
  if(p.state==='dead'){
    if(p.lockT)setLock(p,null);
    const t=p.t,C=p.corpse;
    stepCorpse(p,dt);
    // legs: buckle and splay, flail while airborne, then the death twitches once it's still
    const lying=C?Math.min(1,Math.abs(Math.sin(C.roll))+Math.abs(Math.sin(C.pitch))):1,buckle=Math.min(1,t/0.45);
    const flail=C&&C.rest<=0&&C.cause!=='beaten'?Math.sin(t*17)*0.5:0;
    const tw=C&&C.rest>0.3&&C.rest<3.5&&Math.sin(t*3.1)>0.3?Math.sin(t*38)*0.25*(3.5-C.rest)/3.2:0;
    p.vb=null;p.piv=null;p.rig.rotation.order='XYZ';p.rig.position.x=0;p.climbK=0;if(p.visOff)p.visOff.set(0,0,0);p.headOff=0;p.rig.rotation.x=0;p.rig.rotation.z=0;p.rig.position.y=-buckle*0.25*(1-lying);p.rig.position.z=-0.85;p.rig.scale.set(1,1,1);
    p.legs.forEach((l,i)=>{l.rotation.x=buckle*(i<2?-0.9:0.9)*(1-lying*0.5)+(i%2?flail:-flail)+((i===1||i===2)?tw:0);l.rotation.z=lying*0.3*(i%2?1:-1);});
    p.jaw.rotation.x=0.35+lying*0.25;p.head.rotation.x=lying*0.2;p.tail.rotation.z=0;
    // the pool spreads once the body has come to rest
    const rt=C?C.rest:t;p.pool.scale.setScalar(Math.min(2.8,0.1+rt*0.5));
    // the body hitting the ground for good: a heavy thud and a burst of blood
    if(C&&!p.slammed&&(C.hits>0||C.rest>0.05||(C.cause==='beaten'&&Math.abs(Math.sin(C.roll))>0.95))){p.slammed=true;blood(p.pos.x,p.pos.y+0.8,p.pos.z,26,new V3(0,0.8,0));sfx('Body hits the ground',()=>{thud(0.8);});addShake(0.3,p.pos.x,p.pos.z,14);}
    return;
  }
  const inp=p.in;
  // (moves switched off in the Character tab: their buttons do nothing)
  if(!ABIL.bite){inp.bite=false;inp.bitePress=false;}if(!ABIL.jump)inp.jumpPress=false;
  // rocket boost: jump pressed in mid-air with no jumps left fires the rockets straight away
  if(ABIL.rocket&&ABIL.jump&&inp.jumpPress&&!p.grounded&&(p.coyote||0)<=0&&(p.airJumps||0)<=0&&p.state==='walk'&&!p.wet){p.rocketNow=true;inp.jumpPress=false;p.qJump=0;}
  if(!inp.jump||p.grounded)p.rocketNow=false;
  // Dash (hold to Sprint) (B / Shift / DASH): a tap is a dash, a hold the run (sprint, or trample). Let go within
  // DODGE_TAP of pressing and it's a dash; held longer, the run starts -- on the ground only (it isn't used in mid-air).
  // A press made in mid-air is the air dash, and nothing else. The separate Dash button dashes the moment it's pressed
  // (an air dash in mid-air); the separate Sprint button runs for as long as it's held (from landing, if in mid-air),
  // and pressed in mid-air it's an air dash too.
  // ("in mid-air" means properly airborne: not the moment's lift of a kerb, a step or a dodge's own hop -- a press then
  // counts as on the ground, so tapping dodge never sets off the air dash)
  p.airT=p.grounded?0:(p.airT||0)+dt;
  // (raw: the button itself, as read this frame -- not inp.charge, which this block turns into 'running' below, and which
  // a second step of the same frame (at a low frame rate) would otherwise take for the button having been let go)
  {const raw=!!(inp.chargeHeld??inp.charge),press=!!inp.chargePress,onGround=p.grounded||(p.coyote||0)>0.05,sRaw=!!inp.sprint,dPress=!!inp.dashPress,sPress=!!inp.sprintPress;
   const airborne=!p.grounded&&p.airT>=0.12&&!p.dodge&&(p.sinceDodge??9)>0.2;
   if(press){p.bT=0;p.bLive=!airborne;}
          // (held in mid-air, however it got there -- pressed for an air dash, or still down from the run-up to a jump: if it's
          // still held on landing, he goes straight into the run)
          if(raw&&!p.bLive&&!p.grounded&&!p.dodge)p.bWasHeld=true;
   inp.airPress=(press||dPress||sPress)&&airborne;
   if(p.bLive&&raw)p.bT+=dt;
   let dodge=false;if(p.bLive&&!raw){dodge=p.bT<DODGE_TAP;p.bLive=false;}
   const tapD=dodge;if(dPress&&!airborne)dodge=true;if(dodge)p.dodgeCombo=tapD;
   if(!ABIL.dash)dodge=false;
   const heldC=raw&&(p.bLive?p.bT>=DODGE_TAP:p.bWasHeld);   // (once the run's going, it keeps going while held)
   p.bWasHeld=heldC;inp.dodgePress=dodge;const held=(heldC||sRaw)&&ABIL.sprint;
   p.bRaw=raw;inp.charge=held&&onGround;inp.chargePress=inp.charge&&!p.bRunWas;p.bRunWas=inp.charge;
   if(heldC&&p.bLive&&p.bT>=DODGE_TAP)p.bLive=false;}
  // action queue: a press that comes while Gus is still busy is remembered for a moment and fires the instant he's free
  const stompPress=inp.stomp&&!p.stompHeld;p.stompHeld=inp.stomp;
  p.qBite=Math.max(0,(p.qBite||0)-dt);p.comboWin=Math.max(0,(p.comboWin||0)-dt);p.comboLockT=Math.max(0,(p.comboLockT||0)-dt);p.airBiteCD=Math.max(0,(p.airBiteCD||0)-dt);p.qJump=Math.max(0,(p.qJump||0)-dt);p.qStomp=Math.max(0,(p.qStomp||0)-dt);p.qDodge=Math.max(0,(p.qDodge||0)-dt);
  const busy=p.state!=='walk'||p.lungeT>0||p.biteT>0||!!p.dodge;
  if(inp.bitePress)p.qBite=0.35;
  // coyote time: for a moment after walking off an edge you can still make a normal (ground) jump
  if(p.grounded&&p.state==='walk')p.coyote=0.15;else p.coyote=Math.max(0,(p.coyote||0)-dt);
  if(!p.grounded&&p.vy>0.5)p.coyote=0;   // already on the way up (jumped, kicked off, launched): no second ground jump
  if(stompPress&&busy)p.qStomp=0.35;
  let wantJump=false,wantStomp=false;
  if(p.qBite>0&&!busy&&!(p.biteCD>0)){p.qBite=0;gusBite(p);p.biteRepeat=0.35;}
  else if(inp.bite&&p.biteRepeat<=0&&!busy){gusBite(p);p.biteRepeat=0.35;}
  // mid-combo on the ground (during a hit, or in the gap before the next): rooted, no walking or jumping
  const comboLock=p.grounded&&p.state==='walk'&&((p.biteT>0&&(p.biteStep??-1)>=0)||p.comboLockT>0||p.lungeT>0&&(p.biteStep??-1)>=0);
  // coming out of the root, walking speed builds back up instead of snapping straight to full
  if(comboLock)p.walkRamp=0;else p.walkRamp=Math.min(1,(p.walkRamp??1)+dt/0.22);
  // queued presses: a jump or dodge pressed while he's tied up (mid-bite, rooted in a combo, dodging, stomping...) is
  // held a little longer, so it goes the moment he's free; pressed while free, it only needs to bridge a frame or two
  if(inp.jumpPress)p.qJump=(busy||comboLock)?0.6:0.25;
  if(inp.dodgePress)p.qDodge=(busy||comboLock||p.dodgeCD>0||!p.grounded)?0.5:0.25;
  // (a jump pressed during a dodge waits for it to land, then goes -- an ordinary jump)
  // (...except just after a tap of the dash/sprint button has set one off: a jump pressed in the first instant of that
  // dash calls it off and makes it a long jump instead, as if the jump had come before the dash)
  if(p.dodge&&inp.jumpPress&&p.dodge.combo&&p.dodge.t<LJ_GRACE&&ABIL.longJump&&(inp.x||inp.z)&&p.state==='walk'){
    p.dodge=null;p.sinceDodge=9;p.coyote=Math.max(p.coyote||0,0.1);p.ljNowT=camClock;p.qJump=Math.max(p.qJump,0.1);}
  else if(p.dodge&&inp.jumpPress)p.qJump=Math.max(p.qJump,p.dodge.dur-p.dodge.t+0.15);
  if(p.qJump>0&&p.state==='walk'&&!p.dodge&&!comboLock&&!((p.sinceDodge??9)<0.3&&!p.grounded)&&(p.grounded||p.coyote>0||p.airJumps>0)){p.qJump=0;wantJump=true;}
  if(p.qStomp>0&&!busy&&p.grounded){p.qStomp=0;wantStomp=true;}
  let pitch=0,jawOpen=0,moving=false,tremble=0,charging=false;p.sprinting=false;
  // the bite lunges forward, then the jaws land
  if(p.lungeT>0){
    p.lungeT-=dt;
    if(p.lungeT<=0&&p.biteHit){p.biteHit=false;doBite(p);}
  }
  // leaning into the bite: eased in and out rather than snapping nose-down on the first frame
  p.bitePitch=(p.bitePitch||0)+((p.lungeT>0?0.12:0)-(p.bitePitch||0))*Math.min(1,dt*9);
  if(p.state==='walk')pitch=p.bitePitch;
  // the lurch forward with each bite: eases in and out (a bell-shaped speed curve over its duration)
  if(p.lurch){
    const Lr=p.lurch,t0=Lr.t;Lr.t=Math.min(Lr.dur,Lr.t+dt);
    const f=x=>(1-Math.cos(Math.PI*x/Lr.dur))/2,step=Lr.dist*(f(Lr.t)-f(t0)),hx=Math.sin(p.heading),hz=Math.cos(p.heading);
    if(p.state==='walk'&&groundAt(p.pos.x+hx*1.6,p.pos.z+hz*1.6,p.pos.y)-p.pos.y<=1.05&&(!bodyHits(p,p.pos.x+hx*step,p.pos.z+hz*step,p.heading)||bodyHits(p,p.pos.x,p.pos.z,p.heading))){p.pos.x+=hx*step;p.pos.z+=hz*step;}
    if(Lr.t>=Lr.dur)p.lurch=null;
  }
  if(p.carryV>0.05&&p.state==='walk'&&p.grounded){
    const hx=Math.sin(p.heading),hz=Math.cos(p.heading);
    if(groundAt(p.pos.x+hx*1.6,p.pos.z+hz*1.6,p.pos.y)-p.pos.y<=1.05&&(!bodyHits(p,p.pos.x+hx*p.carryV*dt,p.pos.z+hz*p.carryV*dt,p.heading)||bodyHits(p,p.pos.x,p.pos.z,p.heading))){p.pos.x+=hx*p.carryV*dt;p.pos.z+=hz*p.carryV*dt;}
    p.carryV*=Math.exp(-9*dt);
  } else p.carryV=0;
  updateLock(p,dt,inp);
  if(p.state==='walk'){
    if(wantJump){
      // (out of a run -- or with the dash/sprint button held down but the dash not yet gone off: the long jump takes
      // its place. Jumping out of a dash that's already happened is an ordinary jump)
      if(ABIL.longJump&&(p.grounded||p.coyote>0)&&p.state==='walk'&&p.lungeT<=0&&!p.dodge&&(p.wasCharging||(p.sinceCharge??9)<0.25||p.bLive&&p.bT<DODGE_TAP&&p.bRaw||camClock-(p.ljNowT??-9)<0.2)&&(inp.x||inp.z)){
        p.bLive=false;p.qDodge=0;inp.dodgePress=false;p.ljNowT=-9;
        // long jump: straight out of a charge, low and far
        const hx=Math.sin(p.heading),hz=Math.cos(p.heading);
        const BL=ABIL.blastJump,LJ=BL?AB.blastJump:AB.longJump;
        hbStart(p,BL?'blastJump':'longJump');p.vy=LJ.launch;p.grounded=false;p.coyote=0;p.airBiteCD=0;p.hopT=0.12;p.airJumps=airJumpsMax();p.longJump=true;p.mvx=hx*LJ.speed;p.mvz=hz*LJ.speed;
        sfx('Long jump',()=>{grunt(p,true);thud(0.12);});rumble(p,0.3,120);puff(p.pos.x-hx*1.2,p.pos.y+0.2,p.pos.z-hz*1.2,8,0xb8b2a6,0.6);
        p.blastJ=BL;p.blastAt=null;if(BL)blastOff(p,hx,hz);
      }
      else if(p.wet&&!p.grounded){const bb=boatBeside(p);p.vy=Math.max(p.vy,bb?Math.sqrt(50*(bb.top-p.pos.y+1)):4.2);if(bb){p.mvx=(bb.x-p.pos.x)/Math.hypot(bb.x-p.pos.x,bb.z-p.pos.z||1)*5;p.mvz=(bb.z-p.pos.z)/Math.hypot(bb.x-p.pos.x,bb.z-p.pos.z||1)*5;}p.hopT=0.1;puff(p.pos.x,p.pos.y+0.5,p.pos.z,4,0xcfe8ff,0.5);}   // swimming: a paddle stroke upward
      else if(p.grounded||p.coyote>0){hbStart(p,'jump');p.vy=AB.jump.launch;p.grounded=false;p.coyote=0;p.airBiteCD=0;p.hopT=0.12;p.airJumps=airJumpsMax();sfx('Jump',()=>{grunt(p,false);thud(0.08);});}
      else if(p.airJumps>0){
        // double jump: a second kick in mid-air with a full twirl and a puff of air underneath
        p.airJumps--;hbStart(p,'djump');p.airBiteCD=0;p.vy=Math.max(p.vy,0)+AB.djump.launch;p.twirl=(p.twirl>0.5?p.twirl:0)+Math.PI*2;p.hopT=0;p.spinSq=0.16;
        puff(p.pos.x,p.pos.y-0.2,p.pos.z,9,0xd6d8d0,0.7);sfx('Double jump',()=>{grunt(p,true);});rumble(p,0.2,80);
      }
    }
    let ix=inp.x,iz=inp.z;p.lastSp=0;
    if(p.dodge)ix=iz=0;   // (mid-dodge: the dodge moves him)
    if(p.perch){   // (just hauled up on to a pillar or a narrow ledge, see the haul up: this lasts until the stick moves)
      if(p.grounded&&stickHeld(p)){ix=iz=0;
        if(p.perch!==true&&inp.climb){const df=wrapA(Math.atan2(p.perch[0],p.perch[1])-p.heading);p.heading+=Math.max(-6*dt,Math.min(6*dt,df));if(Math.abs(df)<0.6&&startClimb(p,1.9))p.perch=false;}}
      else p.perch=false;}
    if(comboLock){
      // rooted mid-combo: the stick (relative to the camera) only turns him, to aim the next hit
      if(!p.lockT&&(ix||iz)){const s=Math.sin(p.cam.yaw),c=Math.cos(p.cam.yaw),wx=ix*c+iz*s,wz=-ix*s+iz*c;
        const df=wrapA(Math.atan2(wx,wz)-p.heading);p.heading+=Math.max(-5*dt,Math.min(5*dt,df));}
      ix=iz=0;
    }
    if(ix||iz){
      const len=Math.hypot(ix,iz),mag=Math.min(1,len);ix/=len;iz/=len;
      const s=Math.sin(p.cam.yaw),c=Math.cos(p.cam.yaw),wx=ix*c+iz*s,wz=-ix*s+iz*c;
      // locked on: keep facing the target and move straight along the stick (strafing); otherwise turn toward the stick and walk forward
      const LT=p.lockT;
      let diff=0;
      if(!LT&&!DT.gob){diff=Math.atan2(wx,wz)-p.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;p.heading+=Math.max(-4.5*dt,Math.min(4.5*dt,diff));if(!(inp.climb&&p.grounded))bodyFree(p);}   // (climb held: turning to face a pillar on a narrow ledge mustn't shove him out from in front of it)
      const charge=inp.charge&&!p.exhausted&&p.stam>0,tramp=charge&&ABIL.trample;p.sprinting=charge&&!ABIL.trample;   // (trample switched off: holding B is just a sprint -- no damage, no smashing)
      if(tramp){p.trNow=true;if(!p.trWas)hbStart(p,'trample');}
      if(charge){charging=true;if(!p.wasCharging&&tramp)p.roarBurst=0.5;p.stam-=AB.trample.stamina*(tramp?1:0.6)*dt;if(p.stam<=0){p.stam=0;p.exhausted=true;flashLabel('Out of breath',p);}}
      const sp=PSPEEDS[DT.psI]*(charge?AB.trample.speed:AB.walk.speed)*(Math.abs(diff)>1.5?0.35:1)*(0.6+0.4*p.hp/20)*Math.max(0.35,mag)*Math.max(0.04,(p.walkRamp??1));
      const hx=Math.sin(p.heading),hz=Math.cos(p.heading),frontX=p.pos.x+hx*1.8,frontZ=p.pos.z+hz*1.8;
      // locked: the stick works relative to the target (up = toward it, sideways = around it), not the trailing camera
      let mvx=DT.gob?wx:hx,mvz=DT.gob?wz:hz;   // (a goblin steps whichever way the stick says, facing where it looks)
      if(LT){const tx=LT.pos.x-p.pos.x,tz=LT.pos.z-p.pos.z,tl=Math.hypot(tx,tz)||1,fx=tx/tl,fz=tz/tl;mvx=fx*-iz-fz*ix;mvz=fz*-iz+fx*ix;const ml=Math.hypot(mvx,mvz)||1;mvx/=ml;mvz/=ml;}
      // which way the legs should step, relative to the body: forward/back and sideways
      p.gaitTF=LT?-iz:1;p.gaitTL=LT?-ix:0;
      const ahead=DT.gob?gobGround(p.pos.x+mvx*0.45,p.pos.z+mvz*0.45,p.pos.y,p,dt):groundAt(p.pos.x+mvx*1.6,p.pos.z+mvz*1.6,p.pos.y);
      if(tramp&&p.chargeCD<=0){
        const hit=hbOn('trample')?[]:carsNear(frontX,frontZ,AB.trample.hitR,p.pos.y);
        if(hit.length){p.chargeCD=0.6;sfx('Trample hits a vehicle',()=>{clang();thud(0.8);});addShake(0.35,frontX,frontZ,12);rumble(p,0.7,200);
          for(const c of hit){damageCar(c,AB.trample.carDmg);nudgeFlat(c,hx*1.2,hz*1.2);c.speed=0;}}
      }
      // on or onto a ramp, judge the slope just ahead of the feet instead of a body-length ahead
      const rampy=rampUnder(p.pos.x,p.pos.z,p.pos.y)||rampUnder(p.pos.x+mvx*0.8,p.pos.z+mvz*0.8,p.pos.y)||rampUnder(p.pos.x+mvx*1.6,p.pos.z+mvz*1.6,ahead);
      const bodyBlk=bodyHits(p,p.pos.x+mvx*sp*dt,p.pos.z+mvz*sp*dt,p.heading)&&!bodyHits(p,p.pos.x,p.pos.z,p.heading);
      // (climb held, standing close up to something thin, like a pillar at the back of a ledge: the look a body-length ahead has gone past it)
      if(inp.climb&&!rampy&&!bodyBlk&&ahead-p.pos.y<=1.05&&([0.5,1].some(k=>groundAt(p.pos.x+mvx*k,p.pos.z+mvz*k,p.pos.y)-p.pos.y>1.05)||bodyHits(p,p.pos.x+mvx*sp*dt,p.pos.z+mvz*sp*dt,p.heading))&&startClimb(p,1.9)){}
      else if(bodyBlk||(rampy?groundAt(p.pos.x+mvx*0.8,p.pos.z+mvz*0.8,p.pos.y+1)-p.pos.y>1.3:ahead-p.pos.y>1.05)){
        if(inp.climb&&startClimb(p,1.9)){}
        else if(tramp&&p.smashCD<=0){p.smashCD=0.35;const o={force:1.2,dx:hx,dz:hz};if(blockHit(AB.trample,frontX,p.pos.y,frontZ,hx,hz,o,sz=>crushDisc(frontX,p.pos.y,frontZ,sz,3,o))){p.stam=Math.max(0,p.stam-8);addShake(0.3,frontX,frontZ,12);sfx('Trample smashes blocks',()=>{thud(0.7);});rumble(p,0.5,150);}}
        // walking into a wall at an angle: slide along it (the part of the move that runs along the wall still happens)
        else if(!tramp||p.smashCD>0){
          const opts=Math.abs(mvx)>Math.abs(mvz)?[[Math.sign(mvx),0,Math.abs(mvx)],[0,Math.sign(mvz),Math.abs(mvz)]]:[[0,Math.sign(mvz),Math.abs(mvz)],[Math.sign(mvx),0,Math.abs(mvx)]];
          for(const [ux,uz,k] of opts){if(k<0.12)continue;const d=sp*dt*k,nx=p.pos.x+ux*d,nz=p.pos.z+uz*d;
            if((DT.gob?gobGround(p.pos.x+ux*0.45,p.pos.z+uz*0.45,p.pos.y,p,dt):groundAt(p.pos.x+ux*1.6,p.pos.z+uz*1.6,p.pos.y))-p.pos.y>1.05)continue;
            if(bodyHits(p,nx,nz,p.heading)&&!bodyHits(p,p.pos.x,p.pos.z,p.heading))continue;
            p.pos.x=nx;p.pos.z=nz;moving=true;p.lastSp=sp*k;p.phase+=dt*sp*k*3.4*(charge?0.45:1);break;}
        }
      } else {
        const d0=LT?Math.hypot(p.pos.x-LT.pos.x,p.pos.z-LT.pos.z):0;
        p.pos.x+=mvx*sp*dt;p.pos.z+=mvz*sp*dt;
        // (on a flight of stairs he keeps up with the steps, however quick he's walking)
        if(p.grounded){const xi=Math.floor(p.pos.x),zi=Math.floor(p.pos.z),y0=Math.floor(p.pos.y);for(let k=0;k<=3;k++){const bl=get(xi,y0+k,zi);if(bl&&BLOCK[bl].stair){const top=y0+k+rampH(bl,p.pos.x-xi,p.pos.z-zi);if(top>p.pos.y)p.pos.y=top;break;}}}
        // pure strafing circles the target at the same distance
        if(LT&&Math.abs(iz)<0.35&&d0>1.5){const ex=p.pos.x-LT.pos.x,ez=p.pos.z-LT.pos.z,e=Math.hypot(ex,ez)||1,nx=LT.pos.x+ex/e*d0,nz=LT.pos.z+ez/e*d0;if(canStand(nx,nz,p.pos.y)){p.pos.x=nx;p.pos.z=nz;}}
        moving=true;p.lastSp=sp;p.phase+=dt*sp*3.4*(charge?0.45:1);if(tramp&&!hbOn('trample')){hitGoblins(frontX,frontZ,AB.trample.hitR,AB.trample.dmg,'Trampled',p.pos.y);
          // and it ploughs straight through anything in the way: benches, bins, fences, railings, low walls
          p.trCD=(p.trCD||0)-dt;if(p.trCD<=0&&!hbOn('trample')&&!inp.climb){p.trCD=0.1;const o={force:1.1,dx:hx,dz:hz};if(blockHit(AB.trample,frontX,p.pos.y,frontZ,hx,hz,o,sz=>crushDisc(frontX,p.pos.y,frontZ,sz,3,o))){sfx('Trample ploughs through',()=>{thud(0.45);});addShake(0.18,frontX,frontZ,10);rumble(p,0.3,90);}}}
        if(inp.climb&&p.grounded&&!(p.standCar&&!DT.gob&&vOverEdge(p,mvx,mvz)))climbOverEdge(p,mvx,mvz);
      }
    }
    // holding climb and running (or jumping) into the side of a car, a train, a boat, a plane: grab on
    if(p.state==='walk'&&inp.climb&&!DT.gob&&(!p.grounded||Math.hypot(inp.x,inp.z)>0.3)&&vGrab(p,p.grounded?1.7:1.3)){}
    // holding climb while jumping at a wall: grab on
    if(p.state==='walk'&&inp.climb&&!p.grounded){if(!startClimb(p,1.1)&&p.vy>-2&&!DT.gob)grabCeil(p);}
    // R2 in mid-air: ground pound
    const dodgeHop=!!p.dodge||(p.sinceDodge??9)<0.3&&!p.grounded;   // (a dodge's little hop isn't a jump: no ground pound out of it)
    if(ABIL.pound&&inp.stomp&&!p.grounded&&p.lungeT<=0&&p.dashT<=0&&!dodgeHop){p.state='pound';p.t=0;{const g=supportAt(p.pos.x,p.pos.z,p.pos.y);p.flipY0=p.pos.y;p.flipA=Math.max(0,Math.min(0.9*ES,(g===null?9:p.pos.y-g)-0.4));}p.vy=Math.max(p.vy,0);p.legLift=0;p.stompCharge=0;p.stompLevel=0;p.pRel=false;p.pHover=false;p.poundLvl=0;sfx('Ground pound flip',()=>{tone('triangle',170,95,0.16,0.08);});}
    else if(ABIL.stomp&&(inp.stomp||wantStomp)&&p.grounded&&!dodgeHop&&p.lungeT<=0&&!p.stompLock)startStomp(p);
    if(!inp.stomp)p.stompLock=false;
  } else if(p.state==='piv'){
    // mid-transition (the model is posed in posePiv); the body itself just slides from start to end
    const P=p.piv;P.t=Math.min(1,P.t+dt/P.dur);const k=P.t*P.t*(3-2*P.t);
    p.vy=0;p.grounded=true;p.peakY=p.pos.y;
    p.pos.set(P.from[0]+(P.to[0]-P.from[0])*k,P.from[1]+(P.to[1]-P.from[1])*k,P.from[2]+(P.to[2]-P.from[2])*k);
    if(P.t>=1){p.pos.set(P.to[0],P.to[1],P.to[2]);p.heading=P.h1;p.state=P.next;p.piv=null;
      if(p.state==='climb'){p.climbK=1;p.splayK=1;}else if(p.state==='ceil'){p.splayK=1;p.ceilOff=null;}else{p.grounded=true;p.landT=0.12;}}
  } else if(p.state==='ceil'){
    // spider-climbing upside down along a ceiling or under an overhang; the stick steers like walking
    p.vy=0;p.grounded=true;p.airJumps=airJumpsMax();p.airDash=true;p.airBiteCD=0;p.peakY=p.pos.y;
    const cy=Math.floor(p.pos.y+0.5);
    if(!inp.climb||inp.jumpPress){
      // let go: drop, rolling upright on the way down
      let ny=p.pos.y-1.9*ES;if(solidAt(Math.floor(p.pos.x),Math.floor(ny),Math.floor(p.pos.z)))ny=Math.floor(ny)+1;p.pos.y=ny;
      p.state='walk';p.grounded=false;p.vy=0;p.qJump=0;startVBlend(p,0.35);
    } else if(Math.hypot(inp.x,inp.z)<0.15){p.ceilOff=0;p.stickRef=null;
    } else {
      const len=Math.hypot(inp.x,inp.z),mag=Math.min(1,len),ix=inp.x/len,iz=inp.z/len;
      const sn0=Math.sin(p.cam.yaw),cn0=Math.cos(p.cam.yaw),wx=ix*cn0+iz*sn0,wz=-ix*sn0+iz*cn0;
      // a stick held through the move onto the ceiling keeps meaning "keep going the way you were"; once it's let
      // go, steering goes back to plain camera-relative
      if(!stickHeld(p))p.ceilOff=0;else if(p.ceilOff===null)p.ceilOff=wrapA(p.heading-Math.atan2(wx,wz));
      let diff=Math.atan2(wx,wz)+(p.ceilOff||0)-p.heading;diff=wrapA(diff);p.heading+=Math.max(-4*dt,Math.min(4*dt,diff));
      const hx=Math.sin(p.heading),hz=Math.cos(p.heading),sp=2.8*Math.max(0.35,mag)*Math.max(0,Math.cos(diff));
      const nx=p.pos.x+hx*sp*dt,nz=p.pos.z+hz*sp*dt;
      const ceilOK=solidAt(Math.floor(nx+hx*0.5),cy,Math.floor(nz+hz*0.5));
      const freeOK=[1,2].every(h=>!solidAt(Math.floor(nx+hx*0.9),cy-h,Math.floor(nz+hz*0.9)));
      if(ceilOK&&freeOK){p.pos.x=nx;p.pos.z=nz;moving=sp>0.2;p.phase+=dt*7;}
      else if(sp>0.2){if(!freeOK)ceilToWall(p,hx,hz,cy);else ceilOverEdge(p,hx,hz,cy);}
    }
  } else if(p.state==='climb'&&p.vcl){
    // spider-climbing the side of a vehicle (see vClimb)
    p.vy=0;p.grounded=true;p.airJumps=airJumpsMax();p.airDash=true;p.airBiteCD=0;p.peakY=p.pos.y;
    if(vClimb(p,inp,dt))moving=true;
  } else if(p.state==='climb'){
    // spider-climb: belly to the wall, the stick moves up/down and along it
    const d=p.climbD,tx=-d[1],tz=d[0];
    p.vy=0;p.grounded=true;p.airJumps=airJumpsMax();p.airDash=true;p.airBiteCD=0;p.peakY=p.pos.y;
    if(p.qBite>0&&ABIL.bite&&p.biteT<=0&&!(p.biteCD>0)){p.qBite=0;wallBite(p);}   // R1: a snap of the jaws, still clinging on
    if(!inp.climb){
      // let go: a little push off the wall so he drops clear of it instead of sliding down through it,
      // turning to face away as he goes (the turn is eased so it reads as a twist off the wall)
      p.state='walk';p.grounded=false;p.vy=3.2;p.mvx=-d[0]*4.5;p.mvz=-d[1]*4.5;p.hopT=0.1;
      p.heading=Math.atan2(-d[0],-d[1]);startVBlend(p,0.32);puff(p.pos.x,p.pos.y+0.8,p.pos.z,4,0xd6d8d0,0.4);
    }
    else if(inp.jumpPress){   // kick off the wall
      p.state='walk';p.grounded=false;p.airBiteCD=0;p.vy=8.5;p.mvx=-d[0]*7;p.mvz=-d[1]*7;p.heading=Math.atan2(-d[0],-d[1]);startVBlend(p,0.3);p.hopT=0.12;p.qJump=0;sfx('Wall jump',()=>{grunt(p,false);});puff(p.pos.x,p.pos.y+1,p.pos.z,6,0xd6d8d0,0.5);
    }
    else if(stompPress&&ABIL.stomp&&wallBurst(p)){}   // stomp: through the wall and in
    else {
      // the stick works in the wall's own frame (so holding a direction carries him round corners), flipped
      // when the camera looks out away from the wall (e.g. over a ledge he's tipped over): then forward = down.
      // Which way round is only re-decided while the stick is let go, so it never flips mid-move
      {const fd=-Math.sin(p.cam.yaw)*d[0]-Math.cos(p.cam.yaw)*d[1];if(!stickHeld(p)&&Math.abs(fd)>0.5)p.climbFlip=fd>0?1:-1;}
      const fl=p.climbFlip||1;
      let up=-inp.z*fl,side=inp.x*fl;const mag=Math.hypot(up,side);if(mag>1){up/=mag;side/=mag;}
      const vUp=up*3.2,vSide=side*2.6;
      if(vUp>0){
        // headroom: with his head up the wall his snout reaches ~3 blocks up, about a block out from the face
        const reach=Math.cos(p.climbRoll||0)>0.5?3.1:2.3;
        const roof=[0.6,1.2].some(o=>solidAt(Math.floor(p.pos.x-d[0]*o),Math.floor(p.pos.y+reach),Math.floor(p.pos.z-d[1]*o)));
        if(!roof)p.pos.y+=vUp*dt;else climbToCeil(p,d,Math.floor(p.pos.y+reach));
      }
      else if(vUp<0){
        const gnd=groundAt(p.pos.x-d[0]*0.6,p.pos.z-d[1]*0.6,p.pos.y),headDown=Math.cos(p.climbRoll||0)<-0.5;
        p.pos.y=Math.max(gnd,p.pos.y+vUp*dt);
        // reaching the floor: head first, he walks out onto it; tail first, he drops back onto all fours facing the wall
        if(headDown&&p.pos.y<=gnd+1.4){if(!climbDismount(p,d,gnd,true)&&p.pos.y<=gnd+0.001)p.state='walk';}
        else if(p.pos.y<=gnd+0.001){if(!climbDismount(p,d,gnd,false))p.state='walk';}
      }
      if(vSide&&p.state==='climb'){
        const nx=p.pos.x+tx*vSide*dt,nz=p.pos.z+tz*vSide*dt,sx=Math.sign(vSide)*tx,sz=Math.sign(vSide)*tz;
        const clear=!solidAt(Math.floor(nx+sx*0.6-d[0]*0.6),Math.floor(p.pos.y+0.6),Math.floor(nz+sz*0.6-d[1]*0.6));
        const wall=[0.6,1.4].some(h=>solidAt(Math.floor(nx+sx*0.4+d[0]*0.75),Math.floor(p.pos.y+h),Math.floor(nz+sz*0.4+d[1]*0.75)));
        if(clear&&wall){p.pos.x=nx;p.pos.z=nz;}
        else if(!clear)climbCornerIn(p,d,[sx,sz]);    // a wall in the way: turn onto it
        else climbCornerOut(p,d,[sx,sz]);              // the wall ends: wrap round the corner
      }
      moving=mag>0.1;if(moving)p.phase+=dt*7;
      // turn on the wall to face the way he's crawling (head up, sideways or down)
      if(moving){const dr=wrapA(Math.atan2(side,up)-(p.climbRoll||0));p.climbRoll=wrapA((p.climbRoll||0)+dr*Math.min(1,dt*5.5));}
      // the wall ran out above the body: haul up over the edge (or, with nothing at all to hold, drop)
      const D=p.climbD;   // may have changed this frame by turning a corner
      if(p.state==='climb'&&!wallAhead(p,D,p.pos.y+0.6)&&!wallAhead(p,D,p.pos.y+1.4)){
        if(wallAhead(p,D,p.pos.y-0.3)||wallAhead(p,D,p.pos.y-0.9)){
          // (the height of the top comes from the lip he's holding, not from further in, which may be a drop or a wall)
          const top=supportAt(p.pos.x+D[0]*0.75,p.pos.z+D[1]*0.75,p.pos.y+1.2),spot=top===null?null:haulSpot(p,D,top,side);
          if(spot&&!solidAt(Math.floor(spot.x),Math.floor(top+0.5),Math.floor(spot.z))){
            // roll up and over the roof edge onto all fours
            const E=[p.pos.x+D[0]*0.06,top,p.pos.z+D[1]*0.06];if(D[0])E[2]=p.pos.z;else E[0]=p.pos.x;
            // on top of something narrow: the stick that brought him up doesn't carry him straight off the far side. With a
            // wall to go on to, it turns him to that and on up (p.perch is the way to it); with none, he stays put
            const bs=supportAt(p.pos.x+D[0]*1.3,p.pos.z+D[1]*1.3,top+0.1),more=[0,0.6,-0.6].some(o=>[0.6,1.4].some(h=>solidAt(Math.floor(p.pos.x+D[0]*1.3-D[1]*o),Math.floor(top+h),Math.floor(p.pos.z+D[1]*1.3+D[0]*o))));
            p.perch=bs===null||bs<top-0.6?(more?D:true):false;
            startPiv(p,{E,to:[spot.x,spot.y??top,spot.z],dur:0.4,next:'walk',heading:spot.h});sfx('Climb onto a ledge',()=>{thud(0.15);grunt(p,false);});}
          // nowhere a hippo fits (a slot in a wall, a step on a curving one): on to the wall behind the lip if there is one and
          // up that; if not, he hangs on at the lip rather than dropping
          else if(top!==null&&[0.6,1.4].some(h=>solidAt(Math.floor(p.pos.x+D[0]*1.3),Math.floor(p.pos.y+h),Math.floor(p.pos.z+D[1]*1.3))))startPiv(p,{E:'center',to:[p.pos.x+D[0],p.pos.y,p.pos.z+D[1]],dur:0.25,next:'climb',heading:p.heading});
          else if(top!==null&&vUp>0)p.pos.y-=vUp*dt;
          else{p.state='walk';p.grounded=false;}
        } else {p.state='walk';p.grounded=false;}
      }
    }
  } else if(p.state==='windup'){
    // rear up while the button is held; the longer the hold, the harder the slam
    if(stompCap())p.stompCharge=Math.min(stompCap(),p.stompCharge+dt);
    const k=Math.min(1,p.t/0.45),c=p.stompCharge/2;
    pitch=-0.5*Math.sin(k*Math.PI/2)-0.16*c;p.windPitch=pitch;
    jawOpen=0.3+0.45*c;tremble=(Math.random()-.5)*[0,0.03,0.06][stompLevelOf(p.stompCharge)];
    const lvNow=stompLevelOf(p.stompCharge);
    if(lvNow>p.stompLevel){
      p.stompLevel=lvNow;
      // reaching a new level: a soft rising chime, a nudge of shake, a short buzz
      if(lvNow===1){sfx('Charge level 1',()=>{tone('triangle',520,620,0.12,0.06);});p.shake=Math.max(p.shake,0.06);rumble(p,0.25,110);}
      else{sfx('Charge level 2',()=>{tone('triangle',620,780,0.1,0.06);tone('triangle',780,1040,0.16,0.06,0.08);});p.shake=Math.max(p.shake,0.1);rumble(p,0.45,150);}
    }
    // you can still turn on the spot while winding up
    if(inp.x||inp.z){const s=Math.sin(p.cam.yaw),cc=Math.cos(p.cam.yaw),wx=inp.x*cc+inp.z*s,wz=-inp.x*s+inp.z*cc;let diff=Math.atan2(wx,wz)-p.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;p.heading+=Math.max(-2*dt,Math.min(2*dt,diff));}
    if((!inp.stomp||!stompCap())&&p.t>=0.35){if(inp.stomp)p.stompLock=true;p.state='stomp';p.t=0;p.hit=false;p.stompF=stompLevelOf(p.stompCharge);hbStart(p,'stomp'+(p.stompF+1));cutVoice(p);stompGrunt(p,p.stompF);}
  } else if(p.state==='pound'){
    // a quick forward somersault hanging in the air, coming out of it rump-down; then hover to charge, or drop like a rock
    const k=Math.min(1,p.t/PFLIP),s=k*k*(3-2*k),pe=Math.max(0,Math.min(1,(k-0.5)/0.5)),e=pe*pe*(3-2*pe);
    pitch=k<1?Math.PI*1.5*s:-Math.PI/2;p.poundK=e;jawOpen=0.55;
    if(!inp.stomp)p.pRel=true;
    // through the somersault the whole hippo sinks a little and comes back up (a smooth dip, out of any ground)
    p.pHold=false;
    if(p.t<PFLIP){p.vy=0;p.pos.y=(p.flipY0??p.pos.y)-(p.flipA||0)*Math.sin(Math.PI*k);}
    // a tapped pound hangs still for a beat after the flip before it drops
    else if(p.t<PFLIP+PHOLD&&(p.pRel||!poundCap())){
      // the flip's rise carries on and eases to a standstill (u(1-u)^2: starts at the flip's speed, ends at rest)
      const u=(p.t-PFLIP)/PHOLD,v0=(p.flipA||0)*Math.PI/PFLIP;p.pHold=true;p.vy=0;p.pos.y=(p.flipY0??p.pos.y)+v0*PHOLD*u*(1-u)*(1-u);}
    else if(poundCap()&&!p.pRel&&p.stompCharge<poundCap()){
      // still held: hover rump-down and build it up, the same three levels as a stomp (a tap just drops)
      // drifts slowly upward while it charges: the flip's rise eases down into a steady 0.8/s (gravity is taken off afterward)
      if(!p.pHover)p.hoverV=(p.flipA||0)*Math.PI/PFLIP;
      p.hoverV+=(0.8-p.hoverV)*(1-Math.exp(-dt/0.07));p.pHover=true;p.vy=p.hoverV+25*dt;
      p.stompCharge=Math.min(poundCap(),p.stompCharge+dt);
      const c=p.stompCharge/2;jawOpen=0.55+0.25*c;tremble=(Math.random()-.5)*[0,0.03,0.06][stompLevelOf(p.stompCharge)];
      const lvNow=stompLevelOf(p.stompCharge);
      if(lvNow>p.stompLevel){p.stompLevel=lvNow;
        if(lvNow===1){sfx('Charge level 1',()=>{tone('triangle',520,620,0.12,0.06);});p.shake=Math.max(p.shake,0.06);rumble(p,0.25,110);}
        else{sfx('Charge level 2',()=>{tone('triangle',620,780,0.1,0.06);tone('triangle',780,1040,0.16,0.06,0.08);});p.shake=Math.max(p.shake,0.1);rumble(p,0.45,150);}}
    } else {
      if(p.pHover){p.pHover=false;p.poundLvl=stompLevelOf(p.stompCharge);cutVoice(p);if(p.poundLvl)stompGrunt(p,p.poundLvl);}
      p.pRel=true;p.vy=Math.max(-28-6*(p.poundLvl||0),(p.pHold===false&&p.vy>0?p.vy:Math.min(p.vy,0))-240*dt);   // gathers speed over about a tenth of a second rather than snapping to it
    }
  } else if(p.state==='poundLand'){
    // stay upright on the rump for a beat, squash, then tip back onto all fours
    const t=p.t,back=t<0.16?0:Math.min(1,(t-0.16)/0.32),e=back*back*(3-2*back);
    p.poundK=1-e;pitch=-Math.PI/2*(1-e);jawOpen=0.6*(1-e);
    if(t>=0.48){p.state='walk';p.poundK=0;p.legLift=0;}
  } else if(p.state==='stomp'){
    const D2=0.11,D3=0.4,s=p.t;
    if(s<D2)pitch=p.windPitch*(1-s/D2);
    jawOpen=s<D2?0.7:0.7*Math.max(0,1-(s-D2)/D3);
    if(!p.hit&&s>=D2){p.hit=true;stompImpact(p,p.stompF);}
    if(s>D2+D3)p.state='walk';
  }
  // the dodge: a quick low hop a few blocks whichever way the stick points (relative to the camera, or to the target
  // when locked on), straight back if it's centred. He keeps facing the same way, ducks and leans into it, and nothing
  // can hurt him for most of it.
  p.dodgeCD=Math.max(0,(p.dodgeCD||0)-dt);p.sinceDodge=(p.sinceDodge??9)+dt;
  const ROLL=ABIL.roll,BDASH=ABIL.blastDash&&!ROLL;
  if(p.qDodge>0&&p.state==='walk'&&!p.dodge&&p.grounded&&p.lungeT<=0&&p.biteT<=0&&p.dodgeCD<=0&&!p.exhausted&&p.stam>=(ROLL?AB.roll.stamina:BDASH?AB.blastDash.stamina:AB.dodge.stamina)){
    let wx,wz;const sx=inp.x,sz=inp.z;
    if(Math.hypot(sx,sz)>0.25){
      if(p.lockT){const tx=p.lockT.pos.x-p.pos.x,tz=p.lockT.pos.z-p.pos.z,tl=Math.hypot(tx,tz)||1,fx=tx/tl,fz=tz/tl;wx=fx*-sz-fz*sx;wz=fz*-sz+fx*sx;}
      else{const s2=Math.sin(p.cam.yaw),c2=Math.cos(p.cam.yaw);wx=sx*c2+sz*s2;wz=-sx*s2+sz*c2;}
    } else if(ROLL||BDASH||DT.gob){wx=Math.sin(p.heading);wz=Math.cos(p.heading);}   // (a roll or a blast dash goes forward, not back; so does Gnash's dash, the way he's looking)
    else {wx=-Math.sin(p.heading);wz=-Math.cos(p.heading);}
    const l=Math.hypot(wx,wz)||1;wx/=l;wz/=l;
    if(ROLL){
      // the roll: a low hop forward, curling up into a ball and somersaulting, bowling through whatever's there
      const R=AB.roll,dur=Math.max(0.15,R.dist/Math.max(0.1,R.speed*0.85));p.heading=Math.atan2(wx,wz);
      p.dodge={t:0,dur,dx:wx,dz:wz,fwd:1,side:0,roll:true,at:null};p.qDodge=0;
      p.dodgeCD=dur+0.15;p.stam=Math.max(0,p.stam-R.stamina);p.vy=Math.max(p.vy,R.hop);p.grounded=false;p.coyote=0;
      hbStart(p,'roll');sfx('Roll',()=>{woosh(0.3,0.3,500,1600,0.1);grunt(p,true);});rumble(p,0.35,120);puff(p.pos.x,p.pos.y,p.pos.z,7,0x9a948a,0.6);
    } else if(BDASH){
      // the blast dash: an explosion out of his backside flings him forward, low and fast, through whatever's there
      const R=AB.blastDash,dur=Math.max(0.1,R.dist/Math.max(0.1,R.speed*0.75));p.heading=Math.atan2(wx,wz);
      p.dodge={t:0,dur,dx:wx,dz:wz,fwd:1,side:0,blast:true,at:null};p.qDodge=0;
      p.dodgeCD=dur+0.2;p.stam=Math.max(0,p.stam-R.stamina);p.vy=Math.max(p.vy,1.8);p.grounded=false;p.coyote=0;
      hbStart(p,'blastDash');sfx('Blast dash',()=>{grunt(p,true);});blastOff(p,wx,wz,R,0.85);
    } else {
    const hx=Math.sin(p.heading),hz=Math.cos(p.heading),dur=Math.max(0.08,AB.dodge.dist*0.8/Math.max(0.1,AB.dodge.speed));   // (the skid at the end adds the rest)
    p.dodge={t:0,dur,dx:wx,dz:wz,fwd:wx*hx+wz*hz,side:wx*hz-wz*hx};p.qDodge=0;
    p.dodgeCD=dur+0.2;p.stam=Math.max(0,p.stam-AB.dodge.stamina);p.vy=Math.max(p.vy,2.6);p.grounded=false;p.coyote=0;
    hbStart(p,'dodge');sfx('Dash',()=>{woosh(0.16,0.26,700,2100,0.08);grunt(p,false);});rumble(p,0.2,60);
    puff(p.pos.x,p.pos.y,p.pos.z,5,0x9a948a,0.5);
  }}
  if(p.dodge){const D=p.dodge;if(D.combo===undefined)D.combo=!!p.dodgeCombo;D.t+=dt;
    if((D.roll||D.blast)&&D.t<D.dur&&p.state==='walk'){
      // rolling (or blast-dashing): fast off the mark and easing off; smashing a way through and knocking everything flying
      const HK=D.blast?'blastDash':'roll',R=AB[HK],u=D.t/D.dur,sp=D.blast?R.speed*(1.35-0.7*u*u):R.speed*(1.2-0.5*u),nx=p.pos.x+D.dx*sp*dt,nz=p.pos.z+D.dz*sp*dt,fx=p.pos.x+D.dx*1.5,fz=p.pos.z+D.dz*1.5,fy=p.pos.y+0.9*ES;
      if(!D.at||Math.hypot(fx-D.at.x,fz-D.at.z)>0.9){D.at={x:fx,z:fz};
        if(R.blkR>0&&!hbOn(HK)){crushBall(fx,fy,fz,R.blkR,{force:1.4,up:1.1});
          // (and a clean slot the full height of him, so no top course of a wall is left for him to catch on)
          crush(fx,p.pos.y,fz,Math.max(1,Math.round(R.blkR-0.5)),0,2,{force:1.4,dx:D.dx,dz:D.dz,up:1.1});}
        if(!hbOn(HK)){D.hitG=D.hitG||new Set();dbgHit('dmg','cap',dbgCap(fx,p.pos.y,fz,R.hitR));
          // (each goblin's hit once per roll, and sent flying on ahead of it)
          for(const g of goblins){if(g.state!=='chase'||D.hitG.has(g))continue;const dx=g.pos.x-fx,dz=g.pos.z-fz,dy=g.pos.y-p.pos.y,d=Math.hypot(dx,dz)||0.01;
            if(Math.hypot(d,dy)<R.hitR&&vReach(dy,R.hitR)){D.hitG.add(g);damageGoblin(g,R.dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(D.dx*0.8+dx/d*0.4,0.7,D.dz*0.8+dz/d*0.4),D.blast?'Blasted aside by a blast-dashing hippo':'Bowled over by a rolling hippo');sfx('Roll hits a goblin',()=>{thud(0.35);});}}
          for(const c of carsNear(fx,fz,R.hitR,p.pos.y)){if(c.rollHitT>camClock)continue;c.rollHitT=camClock+0.5;damageCar(c,R.carDmg,new V3(D.dx,0,D.dz));if(c.alive)launchCar(c,4,new V3(D.dx,0,D.dz),3);sfx('Roll hits a vehicle',()=>{clang();thud(0.5);});}}}
      if(groundAt(p.pos.x+D.dx*1.4,p.pos.z+D.dz*1.4,p.pos.y)-p.pos.y<=1.05&&(!bodyHits(p,nx,nz,p.heading)||bodyHits(p,p.pos.x,p.pos.z,p.heading))){p.pos.x=nx;p.pos.z=nz;}
      // (blocked -- often right at the start, pressed up against a wall: smash what's directly in front of him and try
      // again before giving up; only something he can't break, or a real step up, stops a roll)
      else if(R.blkR>0&&!hbOn(HK)&&(D.stuck=(D.stuck||0)+1)<=4){const ax=p.pos.x+D.dx*1.0,az=p.pos.z+D.dz*1.0;
        crush(ax,p.pos.y,az,Math.max(1,Math.round(R.blkR-0.5)),0,2,{force:1.4,dx:D.dx,dz:D.dz,up:1.1});D.at=null;D.t=Math.max(0,D.t-dt*0.5);}
      else D.t=Math.max(D.t,D.dur*0.85);}
    else if(D.t>=D.dur||p.state!=='walk'){p.dodge=null;p.sinceDodge=0;p.rollOut=!!(D.roll||D.blast);if(D.roll){if(p.grounded){sfx('Roll lands',()=>{thud(0.25);});puff(p.pos.x,p.pos.y,p.pos.z,6,0x9a948a,0.5);}
      // (rolled off an edge: he sails on at the speed the roll ended at, slowing as he falls, until he lands)
      else if(p.state==='walk'){const v=AB.roll.speed*0.7;p.mvx=D.dx*v;p.mvz=D.dz*v;}}
      else if(D.blast){if(p.state==='walk'){const v=p.grounded?Math.min(8,AB.blastDash.speed*0.3):AB.blastDash.speed*0.55;p.mvx=D.dx*v;p.mvz=D.dz*v;}}else if(p.state==='walk'){const v=Math.min(5.8,AB.dodge.speed*0.4);p.mvx=(p.mvx||0)+D.dx*v;p.mvz=(p.mvz||0)+D.dz*v;}if(p.grounded)puff(p.pos.x,p.pos.y,p.pos.z,4,0x9a948a,0.45);}
    else{const u=D.t/D.dur,sp=AB.dodge.speed*(1.3-0.85*u*u),nx=p.pos.x+D.dx*sp*dt,nz=p.pos.z+D.dz*sp*dt;   // (fast off the mark, easing into the landing)
      if(groundAt(p.pos.x+D.dx*1.4,p.pos.z+D.dz*1.4,p.pos.y)-p.pos.y<=1.05&&(!bodyHits(p,nx,nz,p.heading)||bodyHits(p,p.pos.x,p.pos.z,p.heading))){p.pos.x=nx;p.pos.z=nz;}
      else D.t=Math.max(D.t,D.dur*0.8);}}   // (ran into something: cut it short)
  // charging in mid-air: a roaring burst forward, once per jump
  if(ABIL.airDash&&p.state==='walk'&&inp.airPress&&!p.grounded&&!p.wet&&p.airDash&&!p.exhausted&&p.stam>=10){
    hbStart(p,'dash');p.airDash=false;p.dashT=Math.max(0.05,AB.dash.dist/Math.max(0.1,AB.dash.speed));p.lurchAt=camClock+1e-6;p.stam=Math.max(0,p.stam-AB.dash.stamina);p.vy=Math.max(p.vy,2);p.roarBurst=0.6;
    // dashing out of a long jump stacks on its speed
    p.dashBoost=!!p.longJump;p.dashSpeed=AB.dash.speed*(p.dashBoost?23/15:1);if(p.dashBoost)p.vy=Math.max(p.vy,4.5);   // and a little lift so the extra speed carries
    // the blast air dash: an explosion out of his backside -- faster, much further, and through anything in the way
    p.dashBlast=!!ABIL.blastAirDash;p.dashBlastAt=null;p.dashHitG=null;
    if(p.dashBlast){const A=AB.blastAirDash,hx=Math.sin(p.heading),hz=Math.cos(p.heading);hbStart(p,'blastAirDash');
      p.dashT=Math.max(0.05,A.dist/Math.max(0.1,A.speed));p.dashSpeed=A.speed*(p.dashBoost?23/15:1);p.stam=Math.max(0,p.stam-Math.max(0,A.stamina-AB.dash.stamina));p.vy=Math.max(p.vy,3);
      blastOff(p,hx,hz,A,0.8);}
    puff(p.pos.x-Math.sin(p.heading)*1.2,p.pos.y+0.6,p.pos.z-Math.cos(p.heading)*1.2,8,0xd6d8d0,0.6);rumble(p,0.45,160);p.shake=Math.max(p.shake,0.08);
    // the launch: a small upright shockwave ring just behind, and a hard grunt over the roar
    if(p.dashBoost){shockCone(p.pos.x,p.pos.y+0.85*ES,p.pos.z,p.heading,2.1,4.6,0.42);sfx('Air dash (boosted)',()=>{thud(0.32);});rumble(p,0.7,220);p.shake=Math.max(p.shake,0.14);}
    else{shockCone(p.pos.x,p.pos.y+0.85*ES,p.pos.z,p.heading,1.5,3.2,0.36);sfx('Air dash',()=>{thud(0.18);});}
    grunt(p,true);
  }
  if(p.dashT>0){
    p.dashT-=dt;charging=true;pitch=Math.min(pitch,0.15);
    // when the burst runs out in the air, keep most of its speed instead of stopping dead
    if(p.dashT<=0&&!p.grounded){const carry=(p.dashBoost?18:12)*(p.dashBlast?1.4:1);p.mvx=Math.sin(p.heading)*carry;p.mvz=Math.cos(p.heading)*carry;}
    const hx=Math.sin(p.heading),hz=Math.cos(p.heading),fx2=p.pos.x+hx*1.8,fz2=p.pos.z+hz*1.8;
    const ds=p.dashSpeed||15;
    // (blasting along: clear the way ahead before moving, and hit each goblin once)
    if(p.dashBlast){const A=AB.blastAirDash,fy=p.pos.y+0.9*ES;
      if(!p.dashBlastAt||Math.hypot(fx2-p.dashBlastAt.x,fz2-p.dashBlastAt.z,fy-p.dashBlastAt.y)>1){p.dashBlastAt={x:fx2,y:fy,z:fz2};
        if(A.blkR>0&&!hbOn('blastAirDash')){crushBall(fx2,fy,fz2,A.blkR,{force:1.6,up:1.2});crush(fx2,p.pos.y,fz2,Math.max(1,Math.round(A.blkR-0.5)),0,2,{force:1.6,dx:hx,dz:hz,up:1.2});}
        if(!hbOn('blastAirDash')){const S=p.dashHitG||(p.dashHitG=new Set());
          for(const g of goblins){if(g.state!=='chase'||S.has(g))continue;const dx=g.pos.x-fx2,dz=g.pos.z-fz2,dy=g.pos.y-p.pos.y,d=Math.hypot(dx,dz)||0.01;
            if(Math.hypot(d,dy)<A.hitR&&vReach(dy,A.hitR)){S.add(g);damageGoblin(g,A.dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(hx*0.8+dx/d*0.4,0.7,hz*0.8+dz/d*0.4),'Blasted aside by a flying hippo');}}
          for(const c of carsNear(fx2,fz2,A.hitR,p.pos.y)){if(c.blastHitT>camClock)continue;c.blastHitT=camClock+0.6;damageCar(c,A.carDmg,new V3(hx,0,hz));if(c.alive)launchCar(c,6,new V3(hx,0,hz),4);sfx('Blast hits a vehicle',()=>{clang();});}}}}
    if(groundAt(p.pos.x+hx*1.6,p.pos.z+hz*1.6,p.pos.y)-p.pos.y<=1.05&&(!bodyHits(p,p.pos.x+hx*ds*dt,p.pos.z+hz*ds*dt,p.heading)||bodyHits(p,p.pos.x,p.pos.z,p.heading))){p.pos.x+=hx*ds*dt;p.pos.z+=hz*ds*dt;}
    else if(!p.dashBlast&&p.smashCD<=0&&!hbOn('dash')){p.smashCD=0.2;const o={force:1.3,dx:hx,dz:hz};if(blockHit(AB.dash,fx2,p.pos.y,fz2,hx,hz,o,sz=>crush(fx2,p.pos.y,fz2,Math.max(0,Math.round(sz)),0,2,o))){addShake(0.3,fx2,fz2,12);sfx('Dash smashes blocks',()=>{thud(0.7);});}}
    if(!p.dashBlast&&!hbOn('dash'))hitGoblins(fx2,fz2,AB.dash.hitR,AB.dash.dmg,'Rammed by a flying hippo',p.pos.y);
    if(!p.dashBlast&&p.chargeCD<=0&&!hbOn('dash')){const hit=carsNear(fx2,fz2,AB.dash.hitR,p.pos.y);if(hit.length){p.chargeCD=0.5;for(const c of hit)damageCar(c,AB.dash.carDmg,new V3(hx,0,hz));sfx('Dash hits a vehicle',()=>{clang();thud(0.6);});}}
  }
  // a blast long jump ploughs through whatever's in its way: blocks, goblins, cars
  if(p.blastJ&&(!p.longJump||p.state!=='walk'))p.blastJ=false;
  if(p.blastJ&&(p.mvx||p.mvz)){const m=Math.hypot(p.mvx,p.mvz),ux=p.mvx/m,uz=p.mvz/m,fx=p.pos.x+ux*1.8,fz=p.pos.z+uz*1.8,fy=p.pos.y+1.1*ES,A=AB.blastJump;
    if(!p.blastAt||Math.hypot(fx-p.blastAt.x,fz-p.blastAt.z,fy-p.blastAt.y)>1.2){p.blastAt={x:fx,y:fy,z:fz};
      if(!hbOn('blastJump'))crushBall(fx,fy,fz,2.3,{force:1.6+m*0.04,up:1.2});
      hitGoblins(fx,fz,A.hitR,A.dmg,'Flattened by a blast long jump',p.pos.y);
      for(const c of carsNear(fx,fz,A.hitR,p.pos.y)){if(c.blastHitT>camClock)continue;c.blastHitT=camClock+0.6;damageCar(c,A.carDmg,new V3(ux,0,uz));if(c.alive)launchCar(c,6,new V3(ux,0,uz),4);sfx('Blast hits a vehicle',()=>{clang();});}}}
  // carried momentum (air-dash follow-through, long jumps): little drag in the air, skids out fast on the ground
  if(p.mvx||p.mvz){
    if(p.dashT>0||p.state==='pound'||p.state==='poundLand'||p.state==='windup'||p.state==='stomp'){if(p.state!=='walk'){p.mvx=p.mvz=0;}}
    else{
      const m=Math.hypot(p.mvx,p.mvz),ux=p.mvx/m,uz=p.mvz/m;
      if(groundAt(p.pos.x+ux*(DT.gob?0.45:1.6),p.pos.z+uz*(DT.gob?0.45:1.6),p.pos.y)-p.pos.y<=1.05&&(!bodyHits(p,p.pos.x+p.mvx*dt,p.pos.z+p.mvz*dt,p.heading)||bodyHits(p,p.pos.x,p.pos.z,p.heading))){p.pos.x+=p.mvx*dt;p.pos.z+=p.mvz*dt;if(m>6)hitGoblins(p.pos.x+ux*1.8,p.pos.z+uz*1.8,1.6,4,'Bowled over',p.pos.y);}
      else{p.mvx=p.mvz=0;}
      const f=Math.exp(-(p.grounded?7:p.rocket?1.1:0.5)*dt);p.mvx*=f;p.mvz*=f;
      if(Math.hypot(p.mvx,p.mvz)<0.3)p.mvx=p.mvz=0;
    }
  }
  if(charging&&p.grounded&&p.dashT<=0)p.sinceCharge=0;else p.sinceCharge=(p.sinceCharge??9)+dt;
  if(!charging&&!p.rocket){p.stamIdle+=dt;if(p.stamIdle>0.6)p.stam=Math.min(100,p.stam+26*dt);}else p.stamIdle=0;
  // the roar: swells as the stomp charges, bellows on the slam, growls while charging
  p.roarBurst=Math.max(0,p.roarBurst-dt);
  let rk=0,rmode='charge';
  if(p.state==='windup'||p.state==='pound'&&p.pHover){rmode='stomp';rk=0.25+0.75*Math.min(1,p.stompCharge/2);}
  else if(charging&&!p.sprinting)rk=0.5;
  if(p.roarBurst>0)rk=Math.max(rk,0.9*Math.min(1,p.roarBurst/0.25));
  if(!playing||p.paused)rk=0;
  if(Math.abs(rk-p.lastRoarK)>0.03||(rk===0&&p.lastRoarK!==0)){setVoice(p,rk,rmode);p.lastRoarK=rk;}
  p.wasCharging=charging;
  if(p.exhausted&&p.stam>=25)p.exhausted=false;
  if(DT.infStam){p.stam=100;p.exhausted=false;}   // debug: never out of breath
  // a hippo doesn't go around lamp posts
  if(!DT.gob&&p.pos.y<G+6.5)knockFixtures(p.pos.x,p.pos.z,1.05,Math.sin(p.heading),Math.cos(p.heading));
  if(!DT.gob)knockProps(p.pos.x,p.pos.y,p.pos.z,1.1,Math.sin(p.heading),Math.cos(p.heading));   // (nor round a hospital bed)
  // cars only block you at ground level: once your feet clear the hood you can hop over or onto them
  const vOn=p.vcl&&p.state==='climb'?(p.vcl.v.T||p.vcl.v):null;   // (clinging to its side: it doesn't push him off itself)
  for(const c of cars){if(!c.alive||c===vOn||p.pos.y<c.pos.y-1.5||Math.hypot(c.pos.x-p.pos.x,c.pos.z-p.pos.z)>c.hz+3)continue;
    const cs=Math.sin(c.heading),ck=Math.cos(c.heading),dx=p.pos.x-c.pos.x,dz=p.pos.z-c.pos.z,la=dx*ck-dz*cs,lb=dx*cs+dz*ck;
    if(p.pos.y>=c.pos.y+Math.min(0.9*ES,VEH[c.veh].roof(Math.max(-c.hz,Math.min(c.hz,lb))/ES)*ES-0.4)+0.05)continue;   // up on top of it
    const qa=Math.max(-c.hx,Math.min(c.hx,la)),qb=Math.max(-c.hz,Math.min(c.hz,lb)),ea=la-qa,eb=lb-qb,d=Math.hypot(ea,eb),R=DT.gob?0.45:1.0*ES;
    if(d<R){let ua,ub;if(d>0.001){ua=ea/d;ub=eb/d;}else{const fa=c.hx-Math.abs(la),fb=c.hz-Math.abs(lb);if(fa<fb){ua=Math.sign(la)||1;ub=0;}else{ua=0;ub=Math.sign(lb)||1;}}
      const push=d>0.001?R-d:R+Math.min(c.hx-Math.abs(la),c.hz-Math.abs(lb));shove(p,(ua*ck+ub*cs)*push,(-ua*cs+ub*ck)*push);}}
  for(const B of TRAIN_BOXES){const BX=B.hx||TRAIN_HX,BZ=B.hz||TRAIN_HZ;if(B.soft||B.proxy===p.rideC||vOn&&(B.proxy.T||B.proxy)===vOn||p.pos.y>=B.top-0.4||p.pos.y<B.y0-1.5||Math.hypot(B.x-p.pos.x,B.z-p.pos.z)>Math.max(BX,BZ)+3)continue;
    const dx=p.pos.x-B.x,dz=p.pos.z-B.z,al=dx*B.tx+dz*B.tz,ac=-dx*B.tz+dz*B.tx,R=DT.gob?0.45:1.0*ES;
    if(Math.abs(al)>BZ+R||Math.abs(ac)>BX+R)continue;
    const fa=BZ+R-Math.abs(al),fc=BX+R-Math.abs(ac);
    // (on board, a deckhouse is just something in the way, not a thing to be thrown overboard by. On a little boat, with no way round it, you end up on top of it)
    if(B.proxy.isBoat&&p.standCar&&p.standCar.T===B.proxy.T){if(B.proxy.T.K.W<6)p.pos.y=B.top;else if(fc<=fa){const sg=ac>=0?1:-1;shove(p,-B.tz*sg*fc,B.tx*sg*fc);}else{const sg=al>=0?1:-1;shove(p,B.tx*sg*fa,B.tz*sg*fa);}continue;}
    // (a train at speed doesn't just nudge you aside: it hits you)
    if(Math.abs(B.v)>=2&&!(p.trainT>0)&&!(p.standCar&&p.standCar.isTrain)&&p.hp>0&&inp.climb&&!DT.gob&&!vOn&&vGrab(p,3,B.proxy))break;   // (holding climb: he catches hold of it as it comes by)
    if(Math.abs(B.v)>=2&&!(p.trainT>0)&&!(p.standCar&&p.standCar.isTrain)&&p.hp>0){const sg=ac>=0?1:-1,sv=B.v<0?-1:1;trainStrike(p,new V3(B.tx*sv*0.8-B.tz*sg*0.6,0,B.tz*sv*0.8+B.tx*sg*0.6),Math.max(0.3,Math.min(1,Math.abs(B.v)/24)),B.proxy.isPlane?'Hit by a plane':B.proxy.isBoat?'Hit by a boat':undefined);}
    if(fc<=fa||Math.abs(B.v)>0.5){const sg=ac>=0?1:-1;shove(p,-B.tz*sg*fc,B.tx*sg*fc);}   // (out to the side -- always, from a moving one)
    else{const sg=al>=0?1:-1;shove(p,B.tx*sg*fa,B.tz*sg*fa);}}
  // standing on a car: ride along with it
  // (a coaster car can be 30 blocks on in a second: one that's under him as he comes down has him there and then, or it's gone before his feet have settled)
  const catchRide=p.standCar&&!p.grounded&&p.standCar.T&&p.standCar.T.isRide&&p.vy<=0&&p.state!=='pound'&&p.pos.y-p.standCar.top<0.6;
  if(p.standCar&&(p.grounded||catchRide)&&p.standCar.alive){const c=p.standCar;if(p.rideC===c){
      {let d=c.heading-p.rideH;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)>0.7)d=0;   // (a car that's turned right round in a moment doesn't take you with it)
        const ex=p.pos.x-p.rideX,ez=p.pos.z-p.rideZ,cd=Math.cos(d),sd=Math.sin(d);p.pos.x=c.pos.x+ex*cd+ez*sd;p.pos.z=c.pos.z-ex*sd+ez*cd;p.heading+=d;if(p.cam)p.cam.yaw+=d;p.pos.y=c.isPlane||c.isBoat?c.top:Math.max(p.pos.y,c.isTrain?c.top:c.pos.y+1.1*ES);
        // (going down a ramp the roof sinks away under you: you stay on it, you don't fall behind)
        if(!c.isTrain&&p.vy<=0.01){const ct=carTop(p);if(ct&&ct.c===c&&ct.y<p.pos.y&&p.pos.y-ct.y<2.5)p.pos.y=ct.y;}}}
    if(catchRide&&p.vy<-16&&p.rideC!==c&&!DT.gob){damageCar(c,Math.round(-p.vy*0.5));sfx('Lands on a vehicle',()=>{clang();});p.vy=-1;}   // (it still takes the landing, once)
    p.rideC=c;p.rideX=c.pos.x;p.rideZ=c.pos.z;p.rideH=c.heading;}else p.rideC=null;
  for(const o of players){if(o===p||!o.active||o.state==='dead')continue;const dx=p.pos.x-o.pos.x,dz=p.pos.z-o.pos.z,d=Math.hypot(dx,dz),gap=DT.gob?0.9:2.4;if(d<gap&&d>0.001)shove(p,dx/d*(gap-d)*0.5,dz/d*(gap-d)*0.5);}
  let g=p.state==='climb'||p.state==='piv'||p.state==='ceil'?null:footprint(p);   // clinging to a wall: no gravity
  // just loaded in: he's set straight down on whatever's under where he was (once it's there) -- never dropped onto it,
  // which would crash-land and blow a hole in it
  if(p.spawnSnap){if(g!==null&&chunks.has(ckey(Math.floor(p.pos.x/CS),Math.floor(p.pos.z/CS)))){if(g<p.pos.y)p.pos.y=g;p.spawnSnap=false;}p.vy=0;p.peakY=p.pos.y;}
  // in deep water: you sink slowly, can paddle up with jump, and the water breaks any fall
  const wet=get(Math.floor(p.pos.x),Math.floor(p.pos.y+0.6),Math.floor(p.pos.z))===WATER;
  if(wet&&!p.wet){puff(p.pos.x,p.pos.y+0.8,p.pos.z,12,0xcfe8ff,1.2);sfx('Splash',()=>{noise(0.4,0.35,900,'lowpass');tone('sine',300,120,0.25,0.06);});}
  p.wet=wet;if(wet){p.peakY=p.pos.y;p.airJumps=airJumpsMax();p.airDash=true;}   // (the air dash comes back in the water, but can't be used until he's out of it)
  // (holding jump in the water keeps on paddling upward, a stroke every SWIM_HOLD seconds after the first)
  if(wet&&ABIL.jump&&p.in.jump&&!p.grounded&&p.state==='walk'){p.swimHoldT=(p.swimHoldT??SWIM_HOLD)-dt;if(p.swimHoldT<=0){p.swimHoldT=SWIM_HOLD;p.vy=Math.max(p.vy,4.2);puff(p.pos.x,p.pos.y+0.5,p.pos.z,4,0xcfe8ff,0.5);}}else p.swimHoldT=SWIM_HOLD;
  if(g!==null){
    if(DT.fly&&p.state==='walk'&&!wet&&(p.pos.y>g+0.01||p.in.jump)){
      // debug flying: hold jump to rise, climb to sink, let go to hover (no gravity, no fall damage, no air jumps)
      const want=p.in.jump?11:p.in.climb?-11:0;p.vy+=(want-p.vy)*Math.min(1,dt*6);
      p.pos.y=Math.min(H+30,p.pos.y+p.vy*dt);p.peakY=p.pos.y;p.grounded=false;p.airJumps=0;p.coyote=0;
      if(p.pos.y<=g){p.pos.y=g;p.vy=0;p.grounded=true;p.airJumps=airJumpsMax();}
    }
    else if(p.vy>0||p.pos.y>g+0.01&&!stickToRamp(p,g)){
      p.peakY=Math.max(p.peakY??p.pos.y,p.pos.y);
      // rocket boost: jump held on after the jump itself (once it's stopped rising fast) fires the foot rockets, which
      // take the weight off and ease him up at a slow climb for as long as the stamina lasts
      p.rocket=ABIL.rocket&&ABIL.jump&&p.state==='walk'&&!wet&&p.in.jump&&(p.rocketNow||(p.jHeld||0)>0.3&&(p.rocket||p.vy<4))&&p.stam>0&&!p.exhausted&&!p.dodge&&p.dashT<=0;
      // (out of a long jump: the leap's over -- he flies on with its speed, which bleeds away into an ordinary boost)
      if(p.rocket&&p.longJump){p.longJump=false;p.blastJ=false;}
      if(p.rocket){p.vy+=25*dt+(ROCKET_RISE-p.vy)*Math.min(1,dt*2.2);if(!DT.infStam)p.stam=Math.max(0,p.stam-ROCKET_STAM*dt);p.peakY=p.pos.y;
        if(Math.random()<dt*14){const hx=Math.sin(p.heading),hz=Math.cos(p.heading),fx=(Math.random()<.5?-1:1)*0.45*ES,fz=(Math.random()<.5?-1:1)*0.7*ES;puff(p.pos.x+hz*fx+hx*fz,p.pos.y-0.3,p.pos.z-hx*fx+hz*fz,1,0x8a8680,0.3);}}
      p.vy-=(wet?8:25)*dt;if(wet)p.vy=Math.max(p.vy,-4);p.pos.y+=p.vy*dt;p.grounded=false;
      // ground-pounding or coming down hard: leaves, glass, awnings and furniture give way instead of catching you
      if(!DT.gob&&g!==null&&p.pos.y<g&&(p.state==='pound'||p.vy<-11)){
        for(let k=0;k<4&&g!==null&&p.pos.y<g;k++){if(!smashSoftUnder(p,g))break;g=footprint(p);}
        if(g===null)g=-1e9;
      }
      if(p.pos.y<g){
        // landing on a car from a real height dents it (a jump on to one just lands you on it, to ride)
        if(!DT.gob&&p.standCar&&p.vy<-16&&p.state!=='pound'){damageCar(p.standCar,Math.round(-p.vy*0.5));sfx('Lands on a vehicle',()=>{clang();});p.standCar.hurt=0.2;}
        if(p.vy<-11){sfx('Hard landing',()=>{thud(0.4);});p.shake=Math.max(p.shake,0.12);}
        if(p.vy<-3)p.landT=0.22;p.pos.y=g;p.vy=0;p.grounded=true;
        if(p.longJump){p.longJump=false;p.blastJ=false;sfx('Long jump lands',()=>{thud(0.3);});puff(p.pos.x,p.pos.y,p.pos.z,8,0x9a948a,0.6);}
        const drop=(p.peakY??g)-g;
        if(p.state==='pound'){if(p.pHover){p.pHover=false;p.poundLvl=stompLevelOf(p.stompCharge);}fallImpact(p,Math.max(0,drop)+POUND_BONUS[p.poundLvl||0],true,p.poundLvl||0);p.poundLvl=0;p.state='poundLand';p.t=0;p.landT=0;}
        else if(drop>=5){if(ABIL.crash&&!(p.standCar&&p.standCar.T&&p.standCar.T.isRide))fallImpact(p,drop,false);   // (a ride's car takes it: a crash landing would blow up the track under it, and derail what he's just landed on)
         
          // without immunity, a long fall hurts (landing in water never does; nor does a ground pound)
          if(!ABIL.noFall&&drop>=14&&!p.wet){const n=Math.min(16,Math.round((drop-12)/3));damagePlayer(p,n,new V3(p.pos.x,p.pos.y+0.6,p.pos.z),new V3(0,0.2,0),'Fell from a great height');flashLabel(n>=8?'Bad landing':'Ouch',p);}}
        p.peakY=g;
      }
    }
    else{
      if(p.state==='pound'&&p.t>PFLIP){if(p.pHover){p.pHover=false;p.poundLvl=stompLevelOf(p.stompCharge);}fallImpact(p,Math.max(0,(p.peakY??p.pos.y)-p.pos.y)+POUND_BONUS[p.poundLvl||0],true,p.poundLvl||0);p.poundLvl=0;p.state='poundLand';p.t=0;p.landT=0;}
      p.vy=0;p.pos.y=Math.min(g,p.pos.y+dt*6);p.grounded=true;p.airJumps=airJumpsMax();p.airDash=true;p.airBiteCD=0;p.peakY=p.pos.y;
    }
  }
  // gait: forward/back swing (reversed when backing up) blended with a sideways step when strafing
  {const k=Math.min(1,dt*10);p.gaitF=(p.gaitF??1)+((p.gaitTF??1)-(p.gaitF??1))*k;p.gaitL=(p.gaitL??0)+((p.gaitTL??0)-(p.gaitL??0))*k;}
  if(!p.lockT){p.gaitTF=1;p.gaitTL=0;}
  const sn=Math.sin(p.phase),sw=moving?sn*0.55*p.gaitF*(p.walkRamp??1):0,ss=moving?sn*0.42*p.gaitL:0;
  p.legs[0].rotation.x=sw+(pitch<0?pitch*1.2:0);p.legs[1].rotation.x=-sw+(pitch<0?pitch*1.2:0);
  p.legs[2].rotation.x=-sw;p.legs[3].rotation.x=sw;
  // diagonal pairs swing out to the side together, like a crab-step
  p.legs[0].rotation.z=ss;p.legs[3].rotation.z=ss;p.legs[1].rotation.z=-ss;p.legs[2].rotation.z=-ss;
  // rearing up to charge a stomp: the front legs paddle slowly in the air, a little out of step
  p.rearK=Math.max(0,Math.min(1,(p.rearK||0)+(p.state==='windup'&&stompCap()?dt/0.3:-dt/0.1)));
  if(p.rearK>0){p.rearT=(p.rearT||0)+dt;const rk=p.rearK*p.rearK*(3-2*p.rearK);
    for(const i of [0,1]){const ph=p.rearT*4.2+i*2.2;p.legs[i].rotation.x+=Math.sin(ph)*0.3*rk;p.legs[i].rotation.z+=Math.sin(ph*0.7+i)*0.1*rk;}}
  else p.rearT=0;
  // (no walking bob or waddle while the rockets carry him)
  const gaitBob=moving&&!p.rocket;
  p.rig.position.y=gaitBob?Math.abs(sn)*0.08:0;
  // a side-to-side waddle, plus a lean into the direction of a strafe
  p.rig.rotation.x=pitch;p.rig.rotation.z=(gaitBob?sn*(0.03+0.05*Math.abs(p.gaitL))-p.gaitL*0.08:0)+tremble;
  // trampling: legs splayed out wide and stamped down hard -- each one swings further, lifts up and out as it comes
  // through, then slams down; the body sits lower, rolls more and drops sharply onto every footfall
  // (a sprint -- trample switched off -- is the same run with a lighter, less stompy version of the pose)
  p.trK=Math.max(0,Math.min(1,(p.trK||0)+(charging&&moving&&p.grounded&&p.state==='walk'?dt/0.25:-dt/0.3)));
  p.trS=(p.trS??1)+((p.sprinting?0.55:1)-(p.trS??1))*Math.min(1,dt*6);
  if(p.trK>0){const tk=p.trK*p.trK*(3-2*p.trK)*p.trS,cl=Math.cos(p.phase);
    p.legs.forEach((l,i)=>{const side=i%2?1:-1,pair=(i===0||i===3)?1:-1,lift=Math.max(0,cl*pair);
      l.rotation.x+=sn*0.26*pair*tk;l.rotation.z+=side*(0.16+0.2*lift)*tk;});
    p.rig.position.y+=((1-Math.cos(2*p.phase))*0.045-0.07)*tk;
    p.rig.rotation.z+=sn*0.035*tk;
  }
  // jump pose: nose up and legs tucked on the way up, nose down and legs reaching on the way down
  // (a dodge's little hop isn't a jump: the jump pose stays out of it, easing back in only if he's still airborne after)
  p.dgAir=p.dodge?1:Math.max(0,(p.dgAir||0)-dt/0.18);
  if(!p.grounded&&p.state!=='pound'){
    const k=Math.max(-1,Math.min(1,p.vy/9.5)),a=p.dgAir*p.dgAir*(3-2*p.dgAir),w=1-a,mix=(o,v)=>o*a+v*w;
    p.rig.rotation.x+=-0.22*k*w;
    p.legs[0].rotation.x=mix(p.legs[0].rotation.x,-0.75+0.3*k);p.legs[1].rotation.x=mix(p.legs[1].rotation.x,-0.75+0.3*k);
    p.legs[2].rotation.x=mix(p.legs[2].rotation.x,0.7-0.25*k);p.legs[3].rotation.x=mix(p.legs[3].rotation.x,0.7-0.25*k);
    p.tail.rotation.x=0.4+0.6*k*w;
  } else p.tail.rotation.x=0.4;
  // rocket boost: a flickering flame under each foot (legs hang straight down while they fire)
  p.jHeld=p.in.jump?(p.jHeld||0)+dt:0;if(p.grounded||p.state!=='walk')p.rocket=false;
  if(p.rocket&&!p.flames){p.flames=p.legs.map(hip=>{const g=new THREE.Group();g.position.set(0,-0.78,0.03);
      const o=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.75,8),new THREE.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:0.85,depthWrite:false,fog:false}));o.rotation.x=Math.PI;o.position.y=-0.37;
      const i=new THREE.Mesh(new THREE.ConeGeometry(0.11,0.45,8),new THREE.MeshBasicMaterial({color:0xfff0a0,transparent:true,opacity:0.95,depthWrite:false,fog:false}));i.rotation.x=Math.PI;i.position.y=-0.22;
      // (the bright core is drawn after the outer flame, so it shows through it from every angle, not just when the
      // transparent-object sort happens to put it last)
      o.renderOrder=10;i.renderOrder=11;
      g.add(o,i);g.visible=false;hip.add(g);return g;});}
  if(p.flames)for(const f of p.flames){f.visible=!!p.rocket;if(p.rocket){const k=0.8+Math.random()*0.45;f.scale.set(0.9+Math.random()*0.2,k,0.9+Math.random()*0.2);}}
  // the pose: the feet (and their rockets) point back down the way he's going -- straight down going straight up,
  // swinging round behind him as he moves sideways, as if the rockets are what's pushing him. The body stays nearly
  // level (only a slight lean into it); the legs swing to make up the rest
  {const lx=p.rkLx??p.pos.x,lz=p.rkLz??p.pos.z;p.rkLx=p.pos.x;p.rkLz=p.pos.z;
   const a=Math.min(1,dt*8);if(dt>0){const vx=(p.pos.x-lx)/dt,vz=(p.pos.z-lz)/dt;if(Math.hypot(vx,vz)<60){p.rkVx=(p.rkVx||0)+(vx-(p.rkVx||0))*a;p.rkVz=(p.rkVz||0)+(vz-(p.rkVz||0))*a;}}
   let tx=0,tz=0,bx=0,bz=0;
   if(p.rocket){const h=p.heading,fwd=p.rkVx*Math.sin(h)+p.rkVz*Math.cos(h),side=p.rkVx*Math.cos(h)-p.rkVz*Math.sin(h),up=Math.max(1.5,p.vy);
     // (by how fast he's going: a gentle angle drifting about, swinging right back only at long-jump speeds)
     const sp=Math.hypot(fwd,side),tilt=1.15*Math.pow(Math.min(1,sp/16),1.4);if(sp>0.05){tx=tilt*fwd/sp;tz=-tilt*side/sp;}
     // the body: level going straight up, leaning a little the way he's moving (a few degrees, more the faster he goes)
     const lean=Math.min(tilt,ROCKET_LEAN*Math.min(1,sp/10));if(sp>0.05){bx=lean*fwd/sp;bz=-lean*side/sp;}}
   const b=Math.min(1,dt*(p.rocket?6:9));p.rkTx=(p.rkTx||0)+(tx-(p.rkTx||0))*b;p.rkTz=(p.rkTz||0)+(tz-(p.rkTz||0))*b;
   p.rkBx=(p.rkBx||0)+(bx-(p.rkBx||0))*b;p.rkBz=(p.rkBz||0)+(bz-(p.rkBz||0))*b;
   // (the boost takes over the body's angle from the jump pose -- which would have him nose-up as he rises -- easing in
   // as the rockets fire and back out when they stop)
   p.rkK=Math.max(0,Math.min(1,(p.rkK||0)+(p.rocket?dt/0.15:-dt/0.25)));
   if(p.rkK>0){const K=p.rkK*p.rkK*(3-2*p.rkK);p.rig.rotation.x=p.rig.rotation.x*(1-K)+p.rkBx*K;p.rig.rotation.z=p.rig.rotation.z*(1-K)+p.rkBz*K;}}
  // (and the whole body shudders a little in the turbulence: quick overlapping wobbles, never quite repeating)
  if(p.rocket){const t=p.rkShT=(p.rkShT||0)+dt,k=Math.min(1,t/0.15)*0.65;
    p.rig.position.y+=(Math.sin(t*37)*0.012+Math.sin(t*53+1.7)*0.008)*k;
    p.rig.rotation.x+=(Math.sin(t*29+0.4)*0.012+Math.sin(t*61+2.2)*0.006)*k;
    p.rig.rotation.z+=(Math.sin(t*33+1.1)*0.014+Math.sin(t*47+0.3)*0.007)*k;}else p.rkShT=0;
  // (the legs hang straight down while they fire, shuddering with the thrust)
  if(p.rocket){for(const L of p.legs){L.rotation.x=p.rkTx-p.rkBx+(Math.random()-.5)*0.09;L.rotation.z=p.rkTz-p.rkBz+(Math.random()-.5)*0.07;}}
  else if(p.rocketWas)for(const L of p.legs)L.rotation.z=0;
  // the sound: a steady roaring hiss while they fire; at the end, a fizzle and a puff of smoke from each foot
  rocketSound(p,!!p.rocket&&playing&&!p.paused);
  if(p.rocketWas&&!p.rocket){if(p.state!=='dead'){const hx=Math.sin(p.heading),hz=Math.cos(p.heading);
      for(const [fx,fz] of [[-0.5,0.8],[0.5,0.8],[-0.5,-0.8],[0.5,-0.8]])smoke(p.pos.x+(hz*fx+hx*fz)*ES,p.pos.y-0.1,p.pos.z+(-hx*fx+hz*fz)*ES,3,0x8f8b84);
      puff(p.pos.x,p.pos.y,p.pos.z,6,0xa8a49c,0.5);
      sfx('Rocket boost fizzles out',()=>{noise(0.45,0.07,2600,'highpass');tone('sine',520,140,0.32,0.035);tone('square',180,60,0.18,0.015,0.05);});}}
  p.rocketWas=!!p.rocket;
  // long jump: stretched out flat like a flying hippo, front legs reaching, back legs trailing
  if(p.longJump&&!p.grounded&&p.state==='walk'){
    const k=Math.max(-1,Math.min(1,p.vy/8));p.rig.rotation.x=-0.12*k;
    p.legs[0].rotation.x=p.legs[1].rotation.x=-1.25;p.legs[2].rotation.x=p.legs[3].rotation.x=1.2;p.tail.rotation.x=1.1;
  }
  // squash on landing, stretch on takeoff
  p.landT=Math.max(0,(p.landT||0)-dt);p.hopT=Math.max(0,(p.hopT||0)-dt);
  const sq=p.landT>0?Math.sin(p.landT/0.22*Math.PI)*0.16:0,st=p.hopT>0?Math.sin(p.hopT/0.12*Math.PI)*0.1:0;
  // a quick vertical squash as a mid-air jump's spin kicks off (bunching up, then springing back out)
  p.spinSq=Math.max(0,(p.spinSq||0)-dt);const spq=p.spinSq>0?Math.sin((1-p.spinSq/0.16)*Math.PI)*0.12:0;
  p.rig.scale.set(1+sq*0.6+spq*0.45,1-sq+st-spq,1+sq*0.3-st*0.5+spq*0.3);
  // reeling from a hit: the head snaps up and back, then settles
  if(p.knockT>0&&p.state==='walk'){const kk=Math.sin(Math.min(1,p.knockT/0.5)*Math.PI);p.rig.rotation.x-=0.4*kk;p.rig.rotation.z+=0.12*kk;}
  // ground-pound pose: body stood straight up on its rump, centred over the hippo
  const pk=p.poundK||0;
  if(pk>0){
    p.rig.position.y=0.38*pk;p.rig.position.z=-0.85+1.3*pk;
    // front legs tuck in; the hind legs swing up along the belly so they point skyward as he drops (blended from
    // whatever the stride had them doing), spread a little apart
    p.legs[0].rotation.x=p.legs[0].rotation.x*(1-pk)-0.5*pk;p.legs[1].rotation.x=p.legs[1].rotation.x*(1-pk)-0.5*pk;
    // while flipping over (and hovering to charge) they point forward; once the plunge starts the rush of air
    // pushes them up overhead
    const dropping=p.state==='pound'&&p.t>=PFLIP&&!p.pHover&&p.vy<-3;
    p.legLift=Math.max(0,Math.min(1,(p.legLift||0)+(dropping?dt/0.2:p.state==='pound'?-dt/0.15:0)));
    const ll=p.legLift*p.legLift*(3-2*p.legLift),hx=0.15+(-1.45-0.15)*ll;
    for(const i of [2,3]){const l=p.legs[i];l.rotation.x=l.rotation.x*(1-pk)+hx*pk;l.rotation.z=l.rotation.z*(1-pk)+(i%2?1:-1)*0.3*pk;}
    // hovering to charge: all four legs paddle slowly in the air, each a little out of step with the next
    p.wigK=Math.max(0,Math.min(1,(p.wigK||0)+(p.state==='pound'&&p.pHover?dt/0.25:-dt/0.12)));
    if(p.wigK>0){p.wigT=(p.wigT||0)+dt;const wk=p.wigK*p.wigK*(3-2*p.wigK);
      p.legs.forEach((l,i)=>{const ph=p.wigT*4.2+i*1.7;l.rotation.x+=Math.sin(ph)*0.28*wk;l.rotation.z+=Math.sin(ph*0.7+i)*0.1*wk;});}
    else p.wigT=0;
    if(p.state==='poundLand'&&p.t<0.16){const q=Math.sin(p.t/0.16*Math.PI);p.rig.scale.set(1+0.18*q,1+0.12*q,1-0.24*q);}
  } else p.rig.position.z=-0.85;
  // the somersault turns about his middle (not his hips): the rig is moved each frame so the centre of his body stays
  // put while he rolls -- easing from where it sits standing to where it sits rump-down -- and it dips a little and
  // rises again over the roll
  if(p.state==='pound'&&p.t<PFLIP){
    const k=Math.min(1,p.t/PFLIP),a=p.rig.rotation.x,cy=1.25,cz=1.0,u=k*k*(3-2*k);
    // where his middle sits: standing (1.25 up, 0.15 forward) blending to rump-down (1.38 up, 0.8 back), minus the dip
    const ty=1.25+(1.38-1.25)*u,tz=0.15+(-0.8-0.15)*u;
    p.rig.position.y=ty-(cy*Math.cos(a)-cz*Math.sin(a));p.rig.position.z=tz-(cy*Math.sin(a)+cz*Math.cos(a));
  }
  // the roll: curled up into a ball (legs tucked under, head down, a little squashed) and turning one full forward
  // somersault about the middle of his body
  {const D=p.dodge&&p.dodge.roll?p.dodge:null,u=D?Math.min(1,D.t/D.dur):1,ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
   const curl=D?ss(0,0.18,u)*(1-ss(0.82,1,u)):0;p.rlK=(p.rlK||0)+(curl-(p.rlK||0))*Math.min(1,dt*20);
   p.head.position.set(0,1.55,1.2);
   if(D||p.rlK>0.01){const c=p.rlK,a=D?Math.PI*2*ss(0.06,0.94,u):0;
     p.legs.forEach((l,i)=>{l.rotation.x=l.rotation.x*(1-c)+(i<2?1.25:-1.25)*c;l.rotation.z*=1-c;});
     p.head.position.set(0,1.55-0.35*c,1.2-0.55*c);p.tail.rotation.x+=0.8*c;   // (the head tucked right in, chin to chest)p.rig.scale.y*=1-0.12*c;p.rig.scale.z*=1-0.1*c;
     const cy=1.3,cz=0.85;p.rig.rotation.x+=a;p.rig.position.y+=cy-(cy*Math.cos(a)-cz*Math.sin(a));p.rig.position.z+=cz-(cy*Math.sin(a)+cz*Math.cos(a));}}
  // spider-climb pose, blended in and out: tipped onto the wall (feet against it), then spun about the wall's
  // normal so the head leads the way he's crawling; the spin pivots on the middle of the body
  p.climbK=p.state==='piv'?(p.piv.next==='climb'?1:0):Math.max(0,Math.min(1,(p.climbK||0)+(p.state==='climb'?dt:-dt)/0.22));
  const ce=p.climbK*p.climbK*(3-2*p.climbK);
  if(ce>0.001){
    const th=wrapA(p.climbRoll||0)*ce,cc=1.2;
    p.rig.rotation.order='ZYX';
    p.rig.rotation.x=p.rig.rotation.x*(1-ce)-Math.PI/2*ce;p.rig.rotation.z+=th;
    p.rig.position.z*=1-ce;p.rig.position.x=cc*Math.sin(th);p.rig.position.y+=cc*(1-Math.cos(th));
  } else {p.rig.rotation.order='XYZ';p.rig.position.x=0;p.climbRoll=0;}
  // spider stance: on the wall, and on the ground too while LB is held (so you can see climbing is armed).
  // Crouched low, legs splayed out diagonally like a lizard's; walking/crawling steps them in diagonal pairs:
  // each foot lifts (splays wider) as it swings forward, then plants and pushes back
  {
    const pivC=p.state==='piv'&&(p.piv.next==='climb'||p.piv.next==='ceil');if(pivC||p.state==='ceil')p.splayK=1;
    const want=p.state==='climb'||p.state==='ceil'||pivC||((p.state==='walk'||p.state==='piv')&&inp.climb&&p.grounded&&p.lungeT<=0);
    // eases in quickly, and back out a little more gently
    p.splayK=Math.max(0,Math.min(1,(p.splayK||0)+(want?dt/0.18:-dt/0.3)));
    const se=p.splayK*p.splayK*(3-2*p.splayK);
    // the head's normal pose (a little nod with the stride), blended toward the low stance's lowered head
    p.head.rotation.x=(moving&&!p.rocket?Math.sin(p.phase*2)*0.04:0)*(1-se)-0.18*se;
    if(p.rlK>0.001)p.head.rotation.x+=1.1*p.rlK;   // (rolling: head tipped right forward, chin to chest)
    if(se>0.001){
      // crouch toward whatever he's standing on: the ground (down) or the wall (forward, once tipped onto it)
      p.rig.position.y-=0.42*se*(1-ce);p.rig.position.z+=0.42*se*ce;
      const cs=Math.sin(p.phase),cl=Math.cos(p.phase),mv=moving?1:0;
      p.legs.forEach((l,i)=>{
        const side=i%2?1:-1,front=i<2,pair=(i===0||i===3)?1:-1;
        const swing=mv*cs*0.5*pair,lift=mv*Math.max(0,cl*pair)*0.4;
        const cx=(front?-0.62:0.62)+swing,cz=side*(1.0+lift);
        l.rotation.x=l.rotation.x*(1-se)+cx*se;l.rotation.z=l.rotation.z*(1-se)+cz*se;
      });
      // no waddle bob in the low stance: he skulks
      if(p.state!=='climb'&&moving)p.rig.position.y-=Math.abs(cs)*0.06*se;
    }
  }
  // the somersault: he tucks into it -- chin down and front legs folded back against his chest -- and stays tucked
  // (through any hover to charge it) until the plunge starts, when head and forelegs swing back up
  {const want=p.state==='pound'&&(p.t<PFLIP||p.pHover||p.pHold);p.tuckK=Math.max(0,Math.min(1,(p.tuckK||0)+(want?dt/0.08:-dt/0.12)));
   if(p.tuckK>0){const w=p.tuckK*p.tuckK*(3-2*p.tuckK);p.head.rotation.x+=0.6*w;p.legs[0].rotation.x+=1.05*w;p.legs[1].rotation.x+=1.05*w;}}
  // the plunge: the rushing air buffets his legs (each flapping on its own rhythm) and, a little, his head -- harder
  // the faster he falls
  if(p.state==='pound'&&p.t>=PFLIP&&!p.pHover&&p.vy<-3){const sp=Math.min(1,-p.vy/34),T=p.t;
    p.legs.forEach((l,i)=>{const a=0.03+0.15*sp;l.rotation.x+=(Math.sin(T*47+i*1.9)+0.6*Math.sin(T*83+i*2.7))*a;l.rotation.z+=(Math.sin(T*53+i*1.3)+0.5*Math.sin(T*97+i))*a*0.6;});
    const hb=0.012+0.045*sp;p.head.rotation.x+=(Math.sin(T*41)+0.6*Math.sin(T*71+1.1))*hb;p.head.rotation.z=(Math.sin(T*37+0.5)+0.5*Math.sin(T*89))*hb*0.8;}
  else if(p.head.rotation.z)p.head.rotation.z=0;
  // ...and his front legs spread out a little to either side as he plunges (easing out, and back in when he lands)
  {const fall=p.state==='pound'&&p.t>=PFLIP&&!p.pHover&&p.vy<-3;p.fallK=Math.max(0,Math.min(1,(p.fallK||0)+(fall?dt/0.15:-dt/0.12)));
   if(p.fallK>0){const w=p.fallK*p.fallK*(3-2*p.fallK);p.legs[0].rotation.z-=0.38*w;p.legs[1].rotation.z+=0.38*w;}}
  // crash landing: all four legs splay flat out (front ones forward, hind ones back, all out to the sides), the body
  // drops onto its belly and squashes flat for a moment, then he pushes himself back up
  p.crashT=Math.max(0,(p.crashT||0)-dt);
  if(p.crashT>0){const e=CRASH_T-p.crashT,k0=e<0.05?e/0.05:e<0.2?1:Math.max(0,1-(e-0.2)/0.3),k=k0*k0*(3-2*k0);
    p.legs.forEach((l,i)=>{const side=i%2?1:-1,front=i<2;l.rotation.z+=side*1.05*k;l.rotation.x+=(front?-0.45:0.45)*k;});
    p.rig.position.y-=0.42*k;p.rig.scale.x*=1+0.16*k;p.rig.scale.z*=1+0.1*k;p.rig.scale.y*=1-0.24*k;p.head.rotation.x+=0.12*k;}
  // dodging: he ducks low, leans hard the way he's going (rolling onto his side for a sidestep, tipping back for a
  // backstep), and tucks his legs up under him for the hop; it all eases off as he lands
  // (the pose follows a smooth bell over the dodge -- in over its first third, out over its last half -- eased in and out on
  // top of that, so nothing snaps: not at the start, not if the dodge is cut short)
  {const D=p.dodge&&!p.dodge.roll?p.dodge:null;if(D){p.dgSide=D.side;p.dgFwd=D.fwd;}
   const u=D?Math.min(1,D.t/D.dur):1,ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);},bell=D?ss(0,0.35,u)*(1-ss(0.55,1,u)):0;
   p.dgK=(p.dgK||0)+(bell-(p.dgK||0))*Math.min(1,dt*(bell>(p.dgK||0)?22:12));
   const k=p.dgK*p.dgK*(3-2*p.dgK),k2=k;
   if(k>0.001){const side=p.dgSide||0,fw=Math.max(0,p.dgFwd||0),bk=Math.max(0,-(p.dgFwd||0));
    p.rig.rotation.z+=-side*0.75*k2;p.rig.rotation.x+=(-bk*0.32+fw*0.2)*k2;p.rig.position.y+=(-0.18*(1-fw)+0.22*fw)*k;
    p.legs.forEach((l,i)=>{const sd=i%2?1:-1;
      // front legs reach out ahead; hind legs trail behind going forward, swing forward going back; a sidestep swings
      // all four out the opposite way to the movement
      const as=Math.abs(side),sw=-side*0.55*k2;
      if(i<2){l.rotation.x+=(-0.6*bk-0.8*fw-0.15*as)*k2;l.rotation.z+=sd*(0.15+0.35*fw)*(1-as)*k2+sw;}
      else{l.rotation.x+=(0.65*fw-0.65*bk)*k2;l.rotation.z+=sd*0.15*(1-as)*k2+sw;}});
    p.head.rotation.x+=(0.15*(1-fw)-0.6*fw)*k2;p.rig.scale.y*=1-0.1*k;}}
  // a mid-air jump's spin flings all four legs out to the sides, tucking back in as the turn winds down
  {p.spinK=Math.max(0,Math.min(1,(p.spinK||0)+(p.twirl>0.35?dt/0.06:-dt/0.09)));
   if(p.spinK>0){const w=p.spinK*p.spinK*(3-2*p.spinK);p.legs.forEach((l,i)=>{l.rotation.z+=(i%2?1:-1)*(i<2?0.5:0.4)*w;});}}
  // swimming: a doggy-paddle -- the legs churn round in diagonal pairs, the body levels out with the nose tipped up
  // out of the water, and he bobs gently; strokes kick up a little spray at the surface
  p.swimK=Math.max(0,Math.min(1,(p.swimK||0)+(p.wet&&p.state==='walk'?dt/0.25:-dt/0.25)));
  if(p.swimK>0){const k=p.swimK*p.swimK*(3-2*p.swimK);p.swimT=(p.swimT||0)+dt*(moving?7.5:4.2);const ph=p.swimT;
    p.legs.forEach((l,i)=>{const front=i<2,side=i%2?1:-1,o=(i===0||i===3)?0:Math.PI,c=Math.sin(ph+o);
      const tx=front?-0.6+c*0.75:0.55+c*0.6,tz=side*(0.26+0.14*Math.cos(ph+o));
      l.rotation.x=l.rotation.x*(1-k)+tx*k;l.rotation.z=l.rotation.z*(1-k)+tz*k;});
    p.rig.rotation.x=p.rig.rotation.x*(1-k)+(-0.2+Math.sin(ph*2)*0.035)*k;
    p.rig.rotation.z=p.rig.rotation.z*(1-k)+Math.sin(ph)*0.05*k;
    p.rig.position.y=p.rig.position.y*(1-k)+Math.sin(ph*2)*0.06*k;
    p.head.rotation.x=p.head.rotation.x*(1-k)-0.22*k;
    p.tail.rotation.x=p.tail.rotation.x*(1-k)+(0.9+Math.sin(ph*1.5)*0.3)*k;
    if(moving&&p.wet){p.swimFx=(p.swimFx||0)-dt;
      if(p.swimFx<=0){p.swimFx=0.3;const yy=Math.floor(p.pos.y+0.6);let top=yy;while(top<yy+4&&get(Math.floor(p.pos.x),top+1,Math.floor(p.pos.z))===WATER)top++;
        if(top-yy<3){const hx=Math.sin(p.heading),hz=Math.cos(p.heading);puff(p.pos.x+hx*1.6,top+1,p.pos.z+hz*1.6,3,0xcfe8ff,0.45);}}}
  } else p.swimT=0;
  // hanging from a ceiling: the whole standing pose flipped upside down about the feet, so they grip the ceiling
  if(p.state==='ceil'||(p.state==='piv'&&p.piv.next==='ceil')){p.rig.rotation.z+=Math.PI;p.rig.position.y*=-1;}
  p.jaw.rotation.x=jawOpen;
  p.tail.rotation.z=Math.sin(p.t*7)*0.4;
  p.head.rotation.y=0;
  // the light-attack combo: 1st bite swings in from the left, 2nd from the right, the 3rd dips the head and uppercuts
  if(p.biteT>0){
    const D=p.biteDur||0.3;p.biteT-=dt;const k=Math.min(1,Math.max(0,1-p.biteT/D)),sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    if(p.biteStep===2){
      const dip=sm(k/0.38),up=sm((k-0.4)/0.16),back=sm((k-0.7)/0.3);
      p.head.rotation.x+=0.42*dip*(1-up)-0.6*up*(1-back);
      p.rig.rotation.x+=0.09*dip*(1-up)-0.26*up*(1-back);
      p.jaw.rotation.x=Math.max(jawOpen,k<0.42?1.05*sm(k/0.3):1.05*(1-sm((k-0.42)/0.12)));
    } else {
      // a straight snap timed to the end of the lurch: the jaws gape as he surges forward, then slam shut
      // on impact (k~0.7) with a quick jab of the head
      const open=sm(k/0.6),shut=sm((k-0.69)/0.1),jab=Math.exp(-Math.pow((k-0.79)/0.07,2));
      p.jaw.rotation.x=Math.max(jawOpen,1.0*open*(1-shut));
      p.head.rotation.x+=0.1*open*(1-shut)-0.16*jab;p.rig.rotation.x+=0.05*jab;
    }
    // ground combo: every hit is one step. Hits 1 and 2 step with alternate diagonal pairs; the uppercut
    // plants both front feet forward and drives off the back ones
    if(p.biteStep>=0&&p.grounded){
      const lk=p.biteStep===2?0.63:0.78,st=sm(k/lk),lift=Math.sin(Math.min(1,k/lk)*Math.PI),settle=1-sm((k-lk)/(1-lk));   // timed to the lurch
      const L=p.legs;
      // blend from wherever the legs were (mid-stride, standing) into the step over the first moments
      const ein=sm(k/0.2),L0=p.biteLeg0||[0,0,0,0],set=(i,v)=>{L[i].rotation.x=L0[i]+(v-L0[i])*ein;};
      if(p.biteStep===2){
        for(const i of[0,1])set(i,(0.25-0.75*st)*settle);for(const i of[2,3])set(i,(0.45*st)*settle);
      } else {
        const A=p.biteStep===0?[0,3]:[1,2],B=p.biteStep===0?[1,2]:[0,3];
        // stepping pair swings from behind to in front (front leg reaches, hind leg follows); the other pair pushes back
        for(const i of A)set(i,(0.35-0.8*st)*settle-0.15*lift);
        for(const i of B)set(i,(-0.1+0.35*st)*settle);
      }
      p.rig.position.y+=0.06*lift;
    }
    if(p.biteT<=0){const mid=ABIL.biteCombo&&p.biteStep>=0&&p.biteStep<2;p.comboWin=mid?0.4:0;p.comboLockT=mid?0.08:0;}   // window to chain the next hit; only a brief root   // a short window to carry on into the next hit
  }
  if(p.twirl>0){const V=Math.PI*2/0.3625,D=V*0.0375;p.twirl=Math.max(0,p.twirl-dt*Math.max(0.6,p.twirl<D?V*Math.sqrt(p.twirl/D):V));}   // a turn takes 0.4s: steady speed, then braking evenly to a stop over the last 0.075s
  // ease away any snap from grabbing a wall, hauling over an edge or kicking off
  if(p.visOff){const k=Math.exp(-dt*12);p.visOff.multiplyScalar(k);p.headOff=(p.headOff||0)*k;}
  hbTick(p,dt);
  p.root.position.copy(p.pos);if(p.visOff)p.root.position.add(p.visOff);p.root.rotation.set(0,p.heading+p.twirl+(p.headOff||0),0);
  if(p.state==='piv'&&p.piv){p.vb=null;posePiv(p);}
  else if(p.vb&&p.state!=='climb')poseVBlend(p,dt);
  else{p.vb=null;p.rootQ=qAx(0,1,0,p.root.rotation.y);p.rootP=[p.root.position.x,p.root.position.y,p.root.position.z];}
  // footfalls: only when a foot actually comes down on something (walking on the ground or a car roof, or crawling on a wall or ceiling; never mid-jump)
  if(!DT.gob&&moving&&p.grounded&&(p.state==='walk'||p.state==='climb'||p.state==='ceil')&&Math.sign(sn)!==Math.sign(p.lastSin)){p.shake=Math.max(p.shake,0.04);sfx('Footstep',()=>{thud(0.1);});}
  p.lastSin=sn;
}

