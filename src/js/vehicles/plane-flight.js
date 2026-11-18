// ---- flying a plane in three dimensions (from drvPlane, driving.js) ----
// The plane's attitude is a quaternion (F.q, [x,y,z,w]: its own +z the nose, +y the top, +x the left wing) and where it's
// going a velocity of its own (F.vel), so it rolls all the way round, loops and flies upside down. Each step the stick
// sets the rates it rolls, pitches and yaws at (F.w: p roll left, q nose up, r yaw left, eased toward what's asked at the
// kind's damp); lift acts square on to the air going past, toward the plane's top, from airspeed squared and the wing's
// angle to it (F.aoa), falling away past the stall (PLANE_KL, PLANE_AOA and the stall as before); sideslip (F.slip)
// swings the nose back into the airflow and pushes the plane sideways; thrust along the nose, drag and gravity as before.
// The old fields are worked out from it afterwards (F.v airspeed, F.gm the climb angle of the flight path, F.vy, F.pt the
// nose's pitch, F.rl the bank, positive left), so the carrier's catapult, its pilots and anything else that reads or
// sets them still can: setting them (or the model's rotation) from outside makes the attitude and velocity again from
// them (pfSync). On the ground drvPlane's own rolling, rotating and braking carry on as they were.
// Each kind's feel: roll rate (rad/s), how quickly the wing comes to the angle asked (pitch), the most G it pulls, yaw rate, how quickly the controls bite (damp), how hard a stall drops
// the nose and a wing, and how much sideslip pushes it sideways
const PLANE_KIND={
  air:{roll:0.8,pitch:3,gmax:3.5,yaw:0.22,damp:3,ndrop:0.9,wdrop:0.5,side:0.025,thr:0.45},     // (the airliner: heavy, wide turns)
  light:{roll:2.1,pitch:3,gmax:6,yaw:0.5,damp:6,ndrop:1.3,wdrop:0.2,side:0.05,thr:0.6},       // (the two-seater: light, a forgiving stall)
  jet:{roll:4.7,pitch:5,gmax:9,yaw:0.45,damp:9,ndrop:0.9,wdrop:0.7,side:0.02,thr:0.9}};       // (the fighter: fast and twitchy)
const pfKind=pl=>pl.jet?PLANE_KIND.jet:pl.light?PLANE_KIND.light:PLANE_KIND.air;
// the airliner's wings: pulled past this many G they creak, and kept there they're damaged (F.stress)
const PLANE_STRESS=3,PLANE_AB={thr:1.45,vmax:1.15,heat:6,cool:4};   // (the jet's afterburner: more thrust, a heat bar)

// ---- the two ways of flying, picked in Options per player: Mouse-aim (an instructor flies the plane toward where the
// camera looks, War Thunder style) or Direct (the stick is the stick); Auto is Mouse-aim on a mouse, Direct on a pad ----
const PLANE_CTL_KEY=['goblin-stompin-gus-planectl','goblin-stompin-gus-planectl2'],PLANE_CTLS=['auto','aim','direct'];
const PLANE_CTL=[0,1].map(k=>{try{const v=localStorage.getItem(PLANE_CTL_KEY[k]);return PLANE_CTLS.includes(v)?v:'auto';}catch(e){return'auto';}});
const pfSeat=()=>{try{return menuP2()?1:0;}catch(e){return 0;}};   // (whose menu it is; at load, nobody's yet)
const PLANE_CTL_TXT={auto:'Mouse-aim on a mouse and keyboard, Direct on a controller',aim:'Point the camera where you want to fly and the plane flies there; W/S throttle, A/D roll by hand',direct:'W/S pitch, A/D roll, Shift/C throttle, Q/E rudder: the stick is the stick (a controller: left stick, RT/LT throttle)'};
// (p.planeCtl, if set, wins: the tests fly by hand that way)
const planeMode=p=>{const m=p.planeCtl||PLANE_CTL[p.idx===1?1:0];return m==='auto'?(p.pad?'direct':'aim'):m;};
function setPlaneCtl(v,seat){const k=seat===1?1:0;if(!PLANE_CTLS.includes(v))v='auto';PLANE_CTL[k]=v;try{localStorage.setItem(PLANE_CTL_KEY[k],v);}catch(e){}syncPlaneCtl();}
// (the Options row shows whoever's menu it is: player two's only reachable through their own pause menu's Options)
function syncPlaneCtl(){const k=pfSeat(),v=PLANE_CTL[k];
  for(const b of document.querySelectorAll('#planeSeg [data-pctl]'))b.setAttribute('aria-checked',String(b.dataset.pctl===v));
  const t=document.getElementById('planeTxt');if(t)t.textContent=PLANE_CTL_TXT[v];}
for(const b of document.querySelectorAll('#planeSeg [data-pctl]'))b.addEventListener('click',()=>{const k=pfSeat();if(b.dataset.pctl!==PLANE_CTL[k])tone('triangle',660,0,0.05,0.03);setPlaneCtl(b.dataset.pctl,k);});
syncPlaneCtl();

// ---- the attitude ----
const pfAxes=q=>({f:qRot(q,[0,0,1]),u:qRot(q,[0,1,0]),l:qRot(q,[1,0,0])});
const pfDot=(a,V)=>a[0]*V.x+a[1]*V.y+a[2]*V.z;
// made again from the old fields and the model's rotation (the first step, or when something else has set them)
function pfSync(F,g){const r=g.rotation,st=F.st;
  if(F.q&&st&&st[0]===r.x&&st[1]===r.y&&st[2]===r.z&&st[3]===F.v&&st[4]===F.gm)return;
  F.q=qMul(qMul(qAx(0,1,0,r.y),qAx(1,0,0,r.x)),qAx(0,0,1,r.z));
  const v=F.v||0,gm=F.gm||0;F.vel={x:Math.sin(r.y)*Math.cos(gm)*v,y:Math.sin(gm)*v,z:Math.cos(r.y)*Math.cos(gm)*v};
  if(!F.w)F.w={p:0,q:0,r:0};pfDerive(F);}
// the old fields from the attitude and velocity
function pfDerive(F){const A=pfAxes(F.q),f=A.f,u=A.u,l=A.l,V=F.vel,s=Math.hypot(V.x,V.y,V.z);F.f=f;F.u=u;F.l=l;
  F.pt=Math.asin(Math.max(-1,Math.min(1,f[1])));F.rl=Math.atan2(-l[1],u[1]);F.v=s;F.vy=V.y;F.gm=s>0.01?Math.asin(Math.max(-1,Math.min(1,V.y/s))):0;
  const vf=pfDot(f,V);F.aoa=s>1?Math.atan2(-pfDot(u,V),vf):0;F.slip=s>1?Math.atan2(pfDot(l,V),Math.abs(vf)):0;}
// the model's rotation (three.js's YXZ order: heading, then the nose's pitch, then the bank), and the stamp pfSync checks
function pfPose(F,g){const f=F.f,u=F.u,l=F.l,ca=Math.sqrt(Math.max(0,1-f[1]*f[1]));let h,c;
  if(ca>1e-3){h=Math.atan2(f[0],f[2]);c=Math.atan2(l[1],u[1]);}else{const sa=-f[1];h=Math.atan2(u[0]*sa,u[2]*sa);c=0;}   // (straight up or down)
  g.rotation.set(-Math.asin(Math.max(-1,Math.min(1,f[1]))),h,c,'YXZ');F.st=[g.rotation.x,g.rotation.y,g.rotation.z,F.v,F.gm];return h;}
// for the instruments: pitch up and roll right positive, and the heading
function planeAtt(pl){const F=pl.free||{};return{roll:-(F.rl||0),pitch:F.pt||0,hd:pl.g.rotation.y};}

// ---- one step in the air (drvPlane's air branch). C: the kind's numbers drvPlane already has ----
function pfAir(pl,dt,C){
  const F=pl.free,g=pl.g,P=g.position,p=pl.drv,i=p?drvIn(p):null,K=pfKind(pl),mode=p?planeMode(p):null;
  const {KL,THR,VMAX,STALL}=C;let s=F.v;
  // (what the hands ask: rates to roll left and yaw left, -1 to 1, and pI how hard to pull, -1 full forward to 1 full back;
  // null: let go). The stick doesn't turn the nose by itself: it sets the wing's angle to the air (aT), and the nose then
  // follows the flight path round, so a pull is a turn, a loop as tight as the wing allows, never a nose spinning on its own
  let rI=null,pI=null,yI=0,tin=0,aT=null;
  const trim=s>3?Math.max(-0.1,Math.min(PLANE_AOA*0.85,PLANE_G/(KL*s*s))):0,gCap=s>3?K.gmax*PLANE_G/(KL*s*s):PLANE_AOA;
  const stick=v=>v>=0?trim+v*(Math.min(PLANE_AOA*0.97,Math.max(trim,gCap))-trim):trim+v*(trim+Math.min(0.25,gCap*0.4));   // (pushed, no more than 0.4 of its G limit the other way)
  const lvlRoll=()=>Math.max(-1,Math.min(1,-F.rl*1.6))*0.6,
    hold=vyW=>{if(Math.abs(F.rl)>1.2||s<3)return 0;const need=(PLANE_G/Math.max(0.35,Math.cos(F.rl))+1.2*(vyW-F.vy))/(KL*s*s);
      return Math.max(-0.15,Math.min(PLANE_AOA*0.85,need));};
  if(p){
    const ana=(i.rt||0)-(i.lt||0),yaw=(i.arYawL?1:0)-(i.arYawR?1:0);yI=yaw;
    if(mode==='aim'){tin=-i.z;const a=pfInstructor(pl,p,i,C,K);rI=a.r;pI=a.p;yI=yaw||a.y;if(i.x)rI=-i.x;}
    else{tin=Math.abs(ana)>0.05?ana:(i.jump?1:0)-(i.climb?1:0);if(i.x)rI=-i.x;if(i.z)pI=i.z;}
    // (the airliner's autopilot: holds the height and heading it was switched on at; taking the stick switches it off)
    if(pl.ap){if(rI!==null&&mode!=='aim'||pI!==null&&mode!=='aim'||mode==='aim'&&i.x)planeAP(pl,p,false);
      else{rI=Math.max(-1,Math.min(1,Math.max(-0.45,Math.min(0.45,angDiff(g.rotation.y,pl.ap.h)*1.2))-F.rl)*1.5)*0.5;aT=hold(Math.max(-6,Math.min(6,(pl.ap.alt-P.y)*0.3)));}}
    // (the jet's barrel roll: A or D tapped twice, a whole turn at full rate, pulling a little)
    if(pl.jet)pfBarrel(pl,F,i,dt);if(F.br){rI=F.br.d;pI=0.3;}
    // (stick let go in Direct: the wings come level and it holds its height)
    if(aT===null){if(rI===null&&pI===null){rI=lvlRoll();aT=F.pt<-0.3&&Math.abs(F.rl)<0.6?stick(0.9):hold(0);}   // (diving: pulled out once the wings are level)
      else{if(rI===null)rI=0;aT=pI?stick(pI):Math.abs(F.rl)<1.2?hold(0):0;}}   // (rolling with the pitch let go: it holds its height while it can, and unloads the wing past the vertical, so a slow roll doesn't pull it down into a dive)
  } else {rI=lvlRoll();aT=hold(-4);}   // (nobody flying it: wings level, gliding down)
  // the throttle (stays where it's left; shut when nobody's flying it), and the jet's afterburner on top
  if(p)F.thr=Math.max(0,Math.min(1,F.thr+tin*K.thr*dt));else F.thr=Math.max(0,F.thr-dt*0.5);
  if(pl.jet){const want=!!(p&&i.jump&&(mode==='aim'||F.thr>=0.99)&&!F.abLock);F.ab=want;
    F.heat=Math.max(0,Math.min(1,(F.heat||0)+(want?dt/PLANE_AB.heat:-dt/PLANE_AB.cool)));if(F.heat>=1)F.abLock=true;else if(F.heat<0.3)F.abLock=false;}
  // the rates: what's asked (the controls bite less the slower it goes), plus the airflow's own pull on the nose. Pitch:
  // the rate the flight path itself is turning in the plane's own up and down (lift less gravity's share, over the speed),
  // and on top of that, the wing brought to the angle asked of it
  const stall=planeStalled(F,pl),auth=Math.max(0.15,Math.min(1,s/(STALL*1.2))),fl=Math.min(1,s/25);
  let path=0;if(s>3){const vf0=F.vel.x*F.f[0]+F.vel.y*F.f[1]+F.vel.z*F.f[2],st0=s<STALL||F.aoa>PLANE_AOA||F.aoa<-PLANE_AOA*1.2,cl0=vf0<=0?0:st0?Math.max(-PLANE_AOA,Math.min(F.aoa,PLANE_AOA))*0.45:Math.max(-0.3,Math.min(F.aoa,PLANE_AOA));
    path=(KL*s*s*cl0-PLANE_G*F.u[1])/s;}
  let pr=rI*K.roll*auth,qr=Math.max(-3,Math.min(3,path+(aT-F.aoa)*K.pitch*auth)),yr=yI*K.yaw*auth+3*F.slip*fl;
  if(stall){qr-=K.ndrop;if(!F.stW)F.stW=Math.random()<0.5?-1:1;pr+=F.stW*K.wdrop;}else F.stW=0;   // (a stalled wing: the nose falls through, a wing drops)
  const W=F.w,e=Math.min(1,dt*K.damp);W.p+=(pr-W.p)*e;W.q+=(qr-W.q)*e;W.r+=(yr-W.r)*Math.min(1,dt*4);
  // (turned in its own frame: pitch up is about its left wing backwards, a roll to the left about its nose backwards)
  const wx=-W.q,wy=W.r,wz=-W.p,wn=Math.hypot(wx,wy,wz);
  if(wn>1e-6){let q=qMul(F.q,qAx(wx/wn,wy/wn,wz/wn,wn*dt));const n=Math.hypot(q[0],q[1],q[2],q[3]);F.q=q.map(c=>c/n);}
  if(F.br)F.br.a+=Math.abs(W.p)*dt;
  // the forces on it
  const A=pfAxes(F.q),f=A.f,u=A.u,l=A.l,V=F.vel;s=Math.hypot(V.x,V.y,V.z);
  const vh=s>0.01?[V.x/s,V.y/s,V.z/s]:f,vf=pfDot(f,V),aoa=s>1?Math.atan2(-pfDot(u,V),vf):0,slip=s>1?Math.atan2(pfDot(l,V),Math.abs(vf)):0;
  const st2=s<STALL||aoa>PLANE_AOA||aoa<-PLANE_AOA*1.2;
  const cl=vf<=0?0:st2?Math.max(-PLANE_AOA,Math.min(aoa,PLANE_AOA))*0.45:Math.max(-0.3,Math.min(aoa,PLANE_AOA)),L=KL*s*s*cl;
  const perp=a=>{const d=a[0]*vh[0]+a[1]*vh[1]+a[2]*vh[2],x=a[0]-d*vh[0],y=a[1]-d*vh[1],z=a[2]-d*vh[2],m=Math.hypot(x,y,z)||1;return[x/m,y/m,z/m];};
  const n=perp(u),sd=perp(l),side=-K.side*s*s*Math.sin(slip);
  const brk=p&&i.arBrake?0.012*s*s:0;   // (Space in the air: the airbrake)
  const drag=PLANE_DRAG*s*s+0.25*Math.abs(L*cl)+0.3*Math.abs(side*Math.sin(slip))+brk,thrust=F.thr*THR*(F.ab?PLANE_AB.thr:1);
  V.x+=(f[0]*thrust+n[0]*L+sd[0]*side-vh[0]*drag)*dt;V.y+=(f[1]*thrust+n[1]*L+sd[1]*side-vh[1]*drag-PLANE_G)*dt;V.z+=(f[2]*thrust+n[2]*L+sd[2]*side-vh[2]*drag)*dt;
  const vm=VMAX*(F.ab?PLANE_AB.vmax:1),s2=Math.hypot(V.x,V.y,V.z);if(s2>vm){V.x*=vm/s2;V.y*=vm/s2;V.z*=vm/s2;}
  F.gl=L/PLANE_G;   // (the load on it, in G: 1 in level flight)
  // (the airliner pulled too hard: its wings creak, then give)
  if(!pl.jet&&!pl.light){if(F.gl>PLANE_STRESS){F.stress=(F.stress||0)+dt*(F.gl-PLANE_STRESS);F.crT=(F.crT||0)-dt;
      if(F.crT<=0){F.crT=0.9;if(audio)sfx('Airframe creaking',()=>{tone('sawtooth',70,55,0.5,0.05);noise(0.3,0.04,300,'lowpass');});if(p)flashLabel('The wings are creaking: ease off',p);}
      if(F.stress>1.5)planeHit(pl,4*dt*(F.gl-PLANE_STRESS));}
    else F.stress=Math.max(0,(F.stress||0)-dt*0.5);}
  // (the two-seater's smoke trail)
  if(F.smoke&&Math.random()<dt*28)puff(P.x-f[0]*2.5,P.y+0.8-f[1]*2.5,P.z-f[2]*2.5,1,0xffffff,0.35);
  pfDerive(F);
  if(stall&&p){F.stT=(F.stT||0)-dt;if(F.stT<=0){F.stT=0.5;if(audio)sfx('Stall warning',()=>tone('square',880,880,0.18,0.03));}}
}
// the instructor (Mouse-aim): flies toward where the camera looks, held while looking round (free look), keeping out of
// the stall and away from the ground, and the wings level once it's there. Returns rates asked of it, -1 to 1
function pfInstructor(pl,p,i,C,K){const F=pl.free,P=pl.g.position;
  // (free look: the camera goes where you like and the plane keeps on toward where it was looking when you started; let
  // go, and the camera's put back there)
  const cp=Math.cos(p.cam.pitch),cam=[-Math.sin(p.cam.yaw)*cp,Math.sin(p.cam.pitch),-Math.cos(p.cam.yaw)*cp];
  if(i.arLook){if(!F.aim)F.aim={d:cam,yaw:p.cam.yaw,pitch:p.cam.pitch};}
  else if(F.aim&&F.aim.held){p.cam.yaw=F.aim.yaw;p.cam.pitch=F.aim.pitch;F.aim=null;}else F.aim=null;
  if(F.aim)F.aim.held=true;
  if(pl.ap)return{r:0,p:0,y:0};   // (the autopilot's flying it: the mouse just looks round)
  const d=F.aim?F.aim.d:cam,f=F.f,u=F.u,l=F.l,df=d[0]*f[0]+d[1]*f[1]+d[2]*f[2],du=d[0]*u[0]+d[1]*u[1]+d[2]*u[2],dl=d[0]*l[0]+d[1]*l[1]+d[2]*l[2];
  const th=Math.acos(Math.max(-1,Math.min(1,df)));
  // (roll till the mark's above the nose, then pull; a mark only a little below, bank toward it and push instead; right on
  // the nose, wings level)
  const et=du>=0||th>0.5?Math.atan2(dl,du):Math.atan2(dl,-du),w=Math.max(0,Math.min(1,(th-0.03)/0.25)),e=w*et+(1-w)*-F.rl;
  let r=Math.max(-1,Math.min(1,e*3/K.roll)),pp=Math.max(-1,Math.min(1,Math.atan2(du,Math.max(0.05,df))*3)),y=Math.max(-1,Math.min(1,Math.atan2(dl,Math.max(0.05,df))*4));
  // (out of the stall: no harder a pull than the wing can take)
  pp=Math.min(pp,0.88);   // (out of the stall: never quite the full pull)
  // (near the ground and coming down: wings level and pull up)
  const agl=P.y-groundAt(P.x,P.z,P.y+1);if(F.vy<-1&&agl/-F.vy<3&&agl<60){r=Math.max(-1,Math.min(1,-F.rl*2));pp=Math.max(pp,Math.abs(F.rl)<0.8?0.8:0);}
  return{r,p:pp,y};}
// the jet's barrel roll: a second tap of A or D within a third of a second
function pfBarrel(pl,F,i,dt){const d=i.x>0.5?-1:i.x<-0.5?1:0;
  if(d&&d!==F.lx){if(F.tapD===d&&playTime-F.tapT<0.3&&!F.br)F.br={d,a:0};F.tapD=d;F.tapT=playTime;}
  F.lx=d;if(F.br&&F.br.a>=Math.PI*2-0.15)F.br=null;}
// the airliner's autopilot (right click): on, holding the height and heading it has now; a chime either way
function planeAP(pl,p,on){pl.ap=on?{alt:pl.g.position.y,h:pl.g.rotation.y}:null;
  if(audio)sfx('Cabin chime',()=>{tone('sine',on?660:880,on?660:880,0.35,0.05);tone('sine',on?880:660,on?880:660,0.5,0.05,0.3);});
  if(p)flashLabel(on?'Autopilot on: holding '+Math.round(pl.g.position.y-G)+' m':'Autopilot off',p);}
// right click in a plane: the jet fires a missile (jetGuns), the two-seater's smoke trail on and off, the airliner's autopilot
function planeSpecial(pl,p,i){const pr=i.stomp&&!pl.spHeld;pl.spHeld=i.stomp;if(!pr||pl.jet)return;
  if(pl.light){pl.free.smoke=!pl.free.smoke;if(p)flashLabel(pl.free.smoke?'Smoke on':'Smoke off',p);}
  else if(pl.free.air)planeAP(pl,p,!pl.ap);}
// touching down with the gear up (not the jet, which has none to raise): on its belly, which it survives, but not the plane
function pfBelly(pl,p){const F=pl.free;if(!F.gearUp||pl.jet||F.belly)return;F.belly=true;planeHit(pl,planeMax(pl)*0.7);
  if(audio)sfx('Belly landing',()=>{noise(1.4,0.3,500,'lowpass');thud(0.6);});if(p)flashLabel("Belly landing! That plane won't fly again",p);}
// R: the undercarriage up or down (the jet's R is its hook: jetHookSwap). Not on the ground
function planeGear(pl,p){const F=pl.free;if(!F||!F.air){if(p)flashLabel('Not on the ground!',p);return;}
  F.gearUp=!F.gearUp;if(audio)sfx('Undercarriage',()=>{noise(0.6,0.05,400,'lowpass');tone('square',F.gearUp?300:200,F.gearUp?200:300,0.5,0.02);});
  if(p)flashLabel(F.gearUp?'Gear up':'Gear down',p);}
// a hard pull greys the edges of the view (the jet's G-vignette): from drvCamera
function planeVignette(p){const D=p.drv,F=D&&D.k==='plane'&&D.o.jet&&D.o.free,k=F?Math.max(0,Math.min(0.85,((F.gl||1)-4.5)/5)):0;
  let v=p.ui.gvig;if(!v){if(!k)return;v=p.ui.gvig=document.createElement('div');v.className='gvig';v.style.cssText='position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(20,20,22,.95) 100%)';p.ui.view.append(v);}
  const o=k.toFixed(2);if(v.dataset.o!==o){v.dataset.o=o;v.style.opacity=o;}}
// the controls, for the column down the left
function planeHow(p,D,armed,G){const A=id=>actMark(p,id),pl=D.o,m=planeMode(p),aim=m==='aim';
  const hk=pl.jet?A('arGear')+(pl.hook?' hook up':' hook down'):A('arGear')+(pl.free&&pl.free.gearUp?' gear down':' gear up');
  const sp=pl.jet?'':pl.light?A('arMsl')+(pl.free&&pl.free.smoke?' smoke off':' smoke on')+'  ·  ':A('arMsl')+(pl.ap?' autopilot off':' autopilot on')+'  ·  ';
  const ab=pl.jet?A('arThrUp')+(aim?' afterburner':' throttle (full: afterburner)')+'  ·  ':'';
  if(aim)return 'Mouse: fly toward  ·  '+A('fwd')+'/'+A('back')+' throttle  ·  '+A('left')+'/'+A('right')+' roll'+(pl.jet?' (twice: barrel roll)':'')+'  ·  '+ab+(p.pad?'':A('arLook')+' free look  ·  ')+A('arBrake')+' brakes  ·  '+sp+G+hk+'  ·  ';
  return (p.pad?'Stick pitch and roll':A('fwd')+'/'+A('back')+' nose down/up  ·  '+A('left')+'/'+A('right')+' roll'+(pl.jet?' (twice: barrel roll)':''))+'  ·  '+(pl.jet?ab:A('arThrUp')+'/'+A('arThrDn')+' throttle  ·  ')+(pl.jet?A('arThrDn')+' throttle down  ·  ':'')+A('arYawL')+'/'+A('arYawR')+' rudder  ·  '+A('arBrake')+' brakes  ·  '+sp+G+hk+'  ·  ';}
