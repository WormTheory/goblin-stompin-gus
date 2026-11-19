// ---- Play as a goblin: driving. Stood by a vehicle, the stomp button (E) gets in and takes the controls; pressed
// again, out you get. Cars and trucks, the bases' tanks and helicopters, boats, trains and the airport's planes. Each
// one's own update reads its driver's controls in place of its usual round (p.drv says what you're in, and the
// vehicle's .drv who's driving it); drvSeat keeps you in your seat once everything's moved ----
const DRV_NAME={ship:'ship',tank:'tank',heli:'helicopter',train:'train',subway:'subway train',plane:'plane',balloon:'hot-air balloon'};
function drvName(D){if(D.netN)return D.netN;const o=D.o;   // (D.netN: a guest online, told by the host)

  if(D.k==='car')return o.police?'police car':{car:'car',bike:'motorcycle',van:'van',pickup:'pickup',truck:'truck',semi:'lorry',bus:'bus',fire:'fire engine',amb:'ambulance',news:'news van',rv:'motorhome',technical:'technical',quad:'four-wheeler',super:'supercar',forklift:'forklift',hover:'hovercraft',tractor:'tractor',bicycle:'bicycle',kick:'kick scooter',segway:'Gobway',moped:'motor scooter'}[o.veh]||'car';
  if(D.k==='boat')return o.K.name.toLowerCase();
  if(D.k==='ship')return o.K.name;
  if(D.k==='mount')return o.K.name;
  if(D.k==='plane'&&o.jet)return'fighter jet';
  if(D.k==='plane'&&o.light)return'two-seater plane';
  if(D.k==='plane'&&!o.jet)return'airliner';
  return DRV_NAME[D.k];
}
// the key (or button) that gets you in and out, as bound
function drvKey(p){const B=BINDS.use;return btnMark(p.pad?bindGlyph('pad',B.pad[0]):bindGlyph('kb',B.kb.find(c=>!c.startsWith('Mouse'))||B.kb[0]));}
// the vehicle nearest you that you could get into: within reach of its box, and about level with it
function drvFind(p){
  const R=1.8,px=p.pos.x,pz=p.pos.z,py=p.pos.y;let best=null,bd=1e9;
  const take=(dx,dz,tx,tz,hx,hz,y0,top,D,y=py)=>{const al=dx*tx+dz*tz,ac=-dx*tz+dz*tx,ea=Math.abs(al)-hz,ec=Math.abs(ac)-hx;
    if(ea>R||ec>R||y<y0-1.6||y>top+1.2)return;const d=Math.max(ea,ec,0)+Math.max(0,y-top);if(d<bd){bd=d;best=D;}};
  for(const c of cars){if(!c.alive||!c.g.visible||c.gnr&&c.drv||Math.abs(c.pos.x-px)>14||Math.abs(c.pos.z-pz)>14)continue;
    // (another player at the wheel: the gunner's place, if it has one and nobody's in it)
    let D={k:'car',o:c};if(c.drv){D.seat='gun';if(!gunSeat(D)||c.crew&&c.crew.gun)continue;}
    take(px-c.pos.x,pz-c.pos.z,Math.sin(c.heading),Math.cos(c.heading),c.hx,c.hz,c.pos.y,c.pos.y+(c.hy||1.4),D);}
  // (a player aboard a ship is measured from where they really are for one out in the world, so they can climb into a
  // Mobile Gear stood on its deck; a tank or helicopter aboard has its box in the pocket with them)
  const Sp=shipN?shipOf(p):null,wp=Sp?shipToWorld(Sp,px,pz,{x:0,z:0}):null;
  for(const B of TRAIN_BOXES){const pr=B.proxy,T=pr.T;if(!pr.alive||!T||B.soft||pr.isShipBox||T.drv&&(!T.isMil||T.gnr))continue;
    const out=wp&&B.x<SHIP_X0,qx=out?wp.x:px,qz=out?wp.z:pz,qy=out?py-Sp.sk:py;
    const hx=B.hx||TRAIN_HX,hz=B.hz||TRAIN_HZ;if(Math.abs(B.x-qx)>hx+hz+R||Math.abs(B.z-qz)>hx+hz+R)continue;
    let D=null;
    if(T.isMil){if(!T.dead)D=T.drv?{k:T.kind,o:T,V:T.V,seat:'gun'}:{k:T.kind,o:T,V:T.V};}
    else if(T.isMech){if(!T.dead)D={k:'mech',o:T,V:T.V};}   // (a Mobile Gear: see mech.js)
    else if(T.isBalloon){if(!T.dead&&pr.i===0)D={k:'balloon',o:T,V:T.V};}   // (a hot-air balloon's basket: see balloon.js)
    else if(pr.isBoat){const V=venues.get(T.key);if(V&&V.bo===T&&!T.dead)D={k:'boat',o:T,V};}   // (one pulled up on the sand or in a dry dock too: see drvLaunch)
    else if(T.isPlane){if(!T.dead&&!T.fall)for(const V of venues.values())if(V.kind==='airport'&&V.pl&&V.pl.includes(T)){D={k:'plane',o:T,V};break;}}
    else if(pr.veh==='train'&&T.C&&!T.dead)D={k:'train',o:T,ci:pr.i};
    else if(pr.veh==='train'&&T.sub&&!T.dead){for(const V of venues.values())if(V.kind==='sub'&&V.T===T){D={k:'subway',o:T,V,ci:pr.i};break;}}   // (a subway train, under the city: see drvSub)
    if(D)take(qx-B.x,qz-B.z,B.tx,B.tz,hx,hz,Math.min(B.y0,B.top-0.5),B.top,D,qy);}
  {const h=shipHelm(p);if(h&&h.d<bd)best=h.D;}   // (aboard a ship, at its helm: see ships.js)
  {const m=mountFind(p);if(m&&m.d<bd)best=m.D;}   // (or by one of a carrier's deck weapons: see carrier-crew.js)
  return best;
}
// where the vehicle is and how it lies: its middle at the base, heading, half sizes, height, and speed along its heading
function drvPose(D){if(D.netS)return D.netS;const o=D.o;   // (D.netS: a guest online, shown where the host has the vehicle)

  if(D.k==='car')return{x:o.pos.x,y:o.pos.y,z:o.pos.z,h:o.heading,hx:o.hx,hz:o.hz,hy:o.hy||1.4,v:o.speed};
  if(D.k==='ship')return shipPose(o);
  if(D.k==='mount')return{x:o.x,y:o.y,z:o.z,h:o.yaw,hx:0.8,hz:0.8,hy:2.2,v:0};
  if(D.k==='mech')return{x:o.x,y:o.y,z:o.z,h:o.h,hx:MG.r,hz:MG.r,hy:MG.hy,v:Math.hypot(o.vx,o.vz)};
  if(D.k==='balloon')return{x:o.x,y:o.y,z:o.z,h:o.h,hx:BAL.bw,hz:BAL.bw,hy:BAL.bh,v:Math.hypot(o.vx,o.vz)};
  if(D.k==='tank'||D.k==='heli'){const I=MIL[D.k];return{x:o.x,y:o.y,z:o.z,h:o.h,hx:I.hx,hz:I.hz,hy:I.hy,v:D.k==='tank'?o.sv||0:Math.hypot(o.hv?o.hv.x:0,o.hv?o.hv.z:0)};}
  if(D.k==='subway'){const g=D.V.cars[D.ci];return{x:g.position.x,y:g.position.y,z:g.position.z,h:g.rotation.y,hx:TRAIN_HX,hz:TRAIN_HZ,hy:TRAIN_H,v:D.V.v};}
  if(D.k==='boat'){const g=o.g;return{x:g.position.x,y:g.position.y,z:g.position.z,h:g.rotation.y,hx:o.K.W/2,hz:o.L/2,hy:o.K.fb+1.5,v:o.sp||0};}
  if(D.k==='plane'){const g=o.g,Q=planeDim(o);return{x:g.position.x,y:g.position.y,z:g.position.z,h:g.rotation.y,hx:Q.hx,hz:Q.hz,hy:Q.hy,v:o.free?o.free.v:0};}
  // a train: the car you got into (laid along the track as updateRailVenue lays it)
  const T=o,C=T.C,hi=T.dir>0?T.s:T.s+TRAIN_LEN,c=hi-5.3-D.ci*10.6,Fa=railPt(C,c+4),Ba=railPt(C,c-4);
  return{x:(Fa.x+Ba.x)/2,y:G+1.2,z:(Fa.z+Ba.z)/2,h:Math.atan2(Fa.x-Ba.x,Fa.z-Ba.z),hx:TRAIN_HX,hz:TRAIN_HZ,hy:TRAIN_H,v:T.v*T.dir};
}
// (getting in: the "Drive the ..." prompt for whatever you just got into, or something beside it, goes at once rather than
// lingering on screen while you ride)
function drvHintClear(p){p.drvHintO=null;const box=p.ui&&(p.ui.feed||p.ui.label);if(!box||!box.children)return;
  for(const el of Array.from(box.children))if(el._s&&/  (Drive|Steal) the /.test(el._s)){clearTimeout(el._t);el.remove();}}
function drvEnter(p,D){
  {const S=D&&shipN?shipOf(p):null;if(S&&D.k!=='ship'&&D.k!=='mount'&&!((D.o.pos?D.o.pos.x:D.o.isPlane?D.o.g.position.x:D.o.x)>=SHIP_X0))shipMove(p,S,false,true);}   // (from aboard a ship into something out in the world, the Mobile Gear on its deck: put out there with it)
  const o=D.o,gun=D.seat==='gun',jack=!gun&&jackable(D);p.drv=D;p.standCar=null;p.vcl=null;p.state='walk';p.vy=0;p.mvx=p.mvz=0;p.biteT=0;p.trK=0;   // (trK: no running pose or rush carried in, or back out again)p.drvLook=-9;p.drvYaw=undefined;p.shipBridge=false;
  drvHintClear(p);
  if(gun)o.gnr=p;else drvTake(p,D);
  if(gunSeat(D))wpnInit(o,drvGunK(D));
  // (the camera starts out behind it)
  p.cam.yaw=drvPose(D).h+Math.PI;p.cam.pitch=-0.25;
  if(jack){jackStart(p,D);return;}   // (someone at the controls: they're thrown out first. See carjack.js)
  clang();
}
// taking the controls: whatever the vehicle was doing on its own, it stops doing
function drvTake(p,D){const o=D.o;o.drv=p;
  if(D.k==='car'){o.hvel=null;o.slipH=undefined;o.kThr=0;o.drift=null;o.boostT=0;if(o.tipR)o.tipFall=false;if(o.forkOn)forkDrop(o.forkOn,false);o.hunter=false;o.path=null;o.rt=null;o.hw=null;o.parked=false;o.left=false;o.reverseT=0;o.makeWay=0;o.leaving=false;o.yieldSv=false;o.hazard=false;if(o.hazG)o.hazG.visible=false;}
  else if(D.k==='tank'||D.k==='heli'){o.state='drive';o.sv=0;o.hv={x:0,z:0};o.vy=0;o.cd=0;o.detour=0;wpnInit(o,D.k);o.rkHeld=true;}
  else if(D.k==='boat'){drvLaunch(D);const g=o.g;D.V.lane=null;D.V.x=g.position.x;D.V.z=g.position.z;D.V.yaw=g.rotation.y;o.sp=0;}
  else if(D.k==='plane'){if(!o.free)o.free={v:o.v||0,vy:0};o.g.visible=true;if(o.jet){wpnInit(o,'jet');o.rkHeld=true;}}
  else if(D.k==='train'){o.wait=0;}
  else if(D.k==='subway'){D.V.wait=0;}
  else if(D.k==='mech'){o.outArm=false;o.outT=0;}
  else if(D.k==='mount')mountTakeover(o);   // (a sailor at it is thrown off)   // (the use button that got you in has to be let go before holding it gets you out)
}
// letting go of the controls: what the vehicle does with nobody driving it
function drvLetGo(p,D){const o=D.o;if(o.drv===p)o.drv=null;
  if(D.k==='car'){o.hose=null;o.left=true;o.siren=false;o.nitroOn=false;o.airBrake=false;o.wly=0;o.hand=false;}   // (left where it stopped: see updateCars)
  else if(D.k==='tank'||D.k==='heli'){if(!o.dead)o.state='idle';o.v=0;o.sv=0;}
  else if(D.k==='train'){if(o.v<0){o.v=0;o.wait=4;}else o.wait=0;}
  else if(D.k==='subway'){if(D.V.v<0)D.V.v=0;D.V.wait=0;}   // (it goes back to its rounds)   // (going its own way, it carries on to the next station)   // (a plane's left as it is: it carries on and comes down by itself)
}
// out by the side (whichever has room), else the back or the front, else on the roof
function drvExit(p,thrown){
  const D=p.drv;if(!D)return;if(D.jack)jackEnd(p,D,true);p.drv=null;const o=D.o;if(p.lockT)setLock(p,null);
  if(p.gb)rideReset(p.gb);
  // (your head at the wheel goes with you, unless someone else is still driving it: a crew's driver)
  if(D.k==='car'&&D.seat!=='gun'&&o.dh&&!(o.crew&&o.crew.drv)&&!rideShown({drv:D,state:''}))o.dh.visible=false;
  const S=drvPose(D);
  if(D.seat==='gun'){if(o.gnr===p)o.gnr=null;}else drvLetGo(p,D);
  if(D.k==='ship'){shipLeave(p,o);return;}   // (left standing at the helm)
  const tx=Math.sin(S.h),tz=Math.cos(S.h),rx=Math.cos(S.h),rz=-Math.sin(S.h);let spot=null;
  for(const [a,b] of [[-(S.hx+0.9),0],[S.hx+0.9,0],[0,-(S.hz+0.9)],[0,S.hz+0.9]]){const x=S.x+rx*a+tx*b,z=S.z+rz*a+tz*b,y=Math.max(groundAt(x,z,S.y+2.5),S.y);
    if(!solidAt(x,Math.floor(y+0.3),z)&&!solidAt(x,Math.floor(y+1.2),z)){spot={x,y,z};break;}}
  if(!spot)spot={x:S.x,y:S.y+S.hy+0.2,z:S.z};
  p.pos.set(spot.x,spot.y,spot.z);p.vy=thrown?6:0;p.grounded=false;p.peakY=p.pos.y;p.state='walk';p.t=0;p.mvx=p.mvz=0;
  p.heading=p.cam.yaw+Math.PI;p.cam.pitch=camPitch(p.cam.pitch,p);
  if(thrown)flashLabel('Thrown clear of the wreck',p);
}
// each step, before the goblin's own moves: in or out, and (while you're in) nothing else
function drvTick(p,dt){
  const use=p.in.use&&!p.useHeld;p.useHeld=p.in.use;
  if(p.drv&&p.drv.jack&&p.state!=='dead'){jackTick(p,dt);return true;}   // (still hauling the driver out)
  const wp=!!p.in.weapon&&!p.drvWpnHeld;p.drvWpnHeld=!!p.in.weapon;
  if(p.drv){if((p.drv.k==='mech'?p.drv.o.outT>=MG.outHold:use)||p.state==='dead')drvExit(p);else{if(wp&&drvSwapTo(p))drvSwap(p);else if(wp&&p.drv.k==='ship')shipViewSwap(p);else if(wp&&p.drv.k==='plane'&&p.drv.o.jet)jetHookSwap(p.drv.o,p);else if(wp&&p.drv.k==='plane')planeGear(p.drv.o,p);if(p.drv.k==='mount')shipOutside(()=>drvLock(p,dt));else drvLock(p,dt);return true;}return false;}
  if(p.state==='dead'||p.state!=='walk'&&p.state!=='climb')return false;
  if(use){const D=drvFind(p);if(D){drvEnter(p,D);return true;}}
  // (a vehicle in reach: say so, once for each one you come up to)
  p.drvHintT=(p.drvHintT||0)-dt;if(p.drvHintT<=0){p.drvHintT=0.3;const D=drvFind(p),o=D?D.o:null;
    if(o&&o!==p.drvHintO)flashLabel(drvKey(p)+(jackable(D)?'  Steal the ':'  Drive the ')+drvName(D),p);p.drvHintO=o;}
  return false;
}
// once every vehicle's moved: you're where your seat's got to (or, if it's been wrecked, thrown out)
function drvSeat(p){
  const D=p.drv;if(!D)return;const o=D.o;
  if(D.k==='car'?!o.alive:o.dead||o.fall){drvExit(p,true);return;}
  if(D.jack){jackPose(p);return;}
  if(D.k==='ship'){shipSeat(p,o);return;}
  const S=drvPose(D);p.pos.set(S.x,S.y+(D.k==='mech'?5:Math.min(1.2,S.hy*0.5)),S.z);   // (a Mobile Gear's pilot sits up in its chest)p.heading=S.h;
  p.vy=0;p.grounded=true;p.mvx=p.mvz=0;p.standCar=null;p.vcl=null;p.peakY=p.pos.y;p.biteT=0;
  if(p.gb)gunGripUndo(p.gb.m);   // (a gun held two-handed the moment before getting in: strikes.js)
  if(rideShown(p)){if(D.seat==='gun')gunPose(p,o);else if(rideSeatOf(D)){seatPose(p,D);if(D.k==='car')lightRider(p,o);}else ridePose(p,o);}
  // (in anything closed, it's your head the others see at the wheel, as they see every other driver's: cars.js's dh)
  else if(D.k==='car'&&D.seat!=='gun'&&!D.jack&&o.dh&&!o.dh.visible)o.dh.visible=true;
}
// where a goblin at the controls of something open sits, or stands, in its own frame, so the others see him there: the
// spot under his hips (or his feet, standing), and 'sit' or 'stand'; w: in blocks rather than the model's own units
// (the ship's helm: he's stood there already, see shipSeat)
const RIDE_SEAT={forklift:[0,1.27,-0.48,'sit'],tractor:[0,1.25,-0.84,'sit'],pedalo:[0.3,0.8,-0.5,'sit',1],row:[0,0.63,0.2,'sit',1],
  speed:[0.35,1.1,0.05,'sit',1],balloon:[0,0.72,0,'stand',1],
  bicycle:[0,0.9,-0.28,'sit'],moped:[0,0.97,-0.3,'sit'],kick:[0,0.2,-0.04,'stand'],segway:[0,0.38,0,'stand']};
const rideKind=D=>D.k==='car'?D.o.veh:D.k==='boat'?D.o.k:D.k==='balloon'?'balloon':null;
const rideSeatOf=D=>D.k==='ship'?SHIP_STAND:RIDE_SEAT[rideKind(D)]||null,SHIP_STAND=[0,0,0,'stand',1];
// sat at the wheel (hands on it, knees up) or stood at the basket's rim or the ship's wheel, carried with the vehicle
function seatPose(p,D){
  const K=gobKit(p),R=K.root,S=rideSeatOf(D),sit=S[3]==='sit';
  if(D.k==='ship'){R.position.set(p.pos.x,p.pos.y,p.pos.z);R.rotation.set(0,p.heading,0);}
  else{const g=D.o.g,e=g.rotation,k=S[4]?1:ES,cx=Math.cos(e.x),sx=Math.sin(e.x),cy=Math.cos(e.y),sy=Math.sin(e.y),cz=Math.cos(e.z),sz=Math.sin(e.z);
    // (the seat turned with the vehicle, pitch, heading and roll, as its 'YXZ' rotation turns its model)
    let x=S[0]*k,y=S[1]*k,z=S[2]*k;[x,y]=[x*cz-y*sz,x*sz+y*cz];[y,z]=[y*cx-z*sx,y*sx+z*cx];[x,z]=[x*cy+z*sy,-x*sy+z*cy];
    R.position.set(g.position.x+x,g.position.y+y-(sit?0.45*ES:0),g.position.z+z);R.rotation.set(e.x,e.y,e.z);}
  for(const L of K.m.legs)L.rotation.set(sit?-1.25:0,0,0);if(sit){K.m.legs[0].rotation.z=0.2;K.m.legs[1].rotation.z=-0.2;}
  const a=sit?-1.3:-1.15;K.m.arm.rotation.set(a,0,-0.12);K.m.arm.hand.rotation.set(0,0,0);if(K.m.armL)K.m.armL.rotation.set(a,0,0.12);
}
// on a motorcycle you're out in the open: your goblin's sat astride it, leaning with it, hands on the bars, feet on the
// pegs; likewise sat on a forklift or a tractor, in an open boat, stood in a balloon's basket or at a ship's wheel
// (seatPose). In anything with a roof you're out of sight (gobView), and your head shows at the wheel as other drivers' do
const rideShown=q=>!!(q.drv&&(q.drv.k==='car'&&(q.drv.o.veh==='bike'||q.drv.o.veh==='quad'||q.drv.o.veh==='technical'&&q.drv.seat==='gun')||q.drv.seat!=='gun'&&rideSeatOf(q.drv))&&!q.drv.jack&&q.state!=='dead');   // (and anything else open: RIDE_SEAT)
function ridePose(p,c){const K=gobKit(p),R=K.root,s=Math.sin(c.heading),k=Math.cos(c.heading);
  R.rotation.set(c.g.rotation.x,c.g.rotation.y,c.g.rotation.z);
  // (the seat, from the bike's own middle: up 0.42 and back 0.25 of its body, tipped over with its lean)
  const up=0.42*ES,bk=-0.25*ES,rl=c.g.rotation.z,ax=-up*Math.sin(rl);
  R.position.set(c.pos.x+ax*k+bk*s,c.pos.y+up*Math.cos(rl),c.pos.z-ax*s+bk*k);
  for(const L of K.m.legs){L.rotation.set(-1.25,0,0);}K.m.legs[0].rotation.z=0.25;K.m.legs[1].rotation.z=-0.25;
  K.m.arm.rotation.set(-1.35,0,0.1);if(K.m.armL)K.m.armL.rotation.set(-1.35,0,-0.1);
}
function rideReset(K){for(const L of K.m.legs)L.rotation.set(0,0,0);K.m.arm.rotation.set(-0.5,0,0);if(K.m.armL)K.m.armL.rotation.set(0,0,0);}
// a venue holding a vehicle someone's driving stays (however far it's been taken)
const drvHeld=V=>players.some(q=>q.drv&&(q.drv.V===V||V.T&&q.drv.o===V.T))||!!(V.pl&&V.pl.some(pl=>pl.free&&!pl.dead&&(pl.free.air||pl.free.v>1)));   // (and an airport, while a plane that's been flown off is still going: it comes down by itself)
// locked on from a tank or a helicopter (the lock button): the gun aims at it, wherever you're looking, a little ahead
// of where it's going; the marker sits on it. Anything near the middle of the screen, out to 100 blocks, can be picked
function drvLock(p,dt){
  const D=p.drv,armed=drvArmed(p);
  if(!armed){if(p.lockT)setLock(p,null);return;}
  if(p.in.lockPress){
    if(p.lockT){setLock(p,null);tone('triangle',620,380,0.07,0.035);}
    else{const c=shipEye(p),cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;let best=null,bs=1e9;
      for(const o of lockTargets(p,100)){if(o.t===D.o)continue;const ty=lockY(o.t),dx=o.t.pos.x-c.x,dy=ty-c.y,dz=o.t.pos.z-c.z,L=Math.hypot(dx,dy,dz)||1,
          a=Math.max(0,Math.acos(Math.max(-1,Math.min(1,(dx*fx+dy*fy+dz*fz)/L)))-Math.atan((isMilT(o.t)?MIL[o.t.kind].hz:0.5)/L));if(a>0.4)continue;   // (any part of it within about 23 degrees of the crosshair)
        const sc=a*60+L*0.05+(isMilT(o.t)?0:15)+o.hid;if(sc<bs){bs=sc;best=o.t;}}   // (tanks and helicopters first)
      if(best){setLock(p,best);p.lockV=null;}else tone('square',180,140,0.06,0.03);}}
  const T=p.lockT;if(!T)return;
  if(!lockAlive(T)||Math.hypot(T.pos.x-p.pos.x,T.pos.z-p.pos.z)>130){setLock(p,null);tone('triangle',520,300,0.08,0.03);return;}
  // (how fast it's moving, smoothed, to lead it)
  const ty=lockY(T);if(p.lockV&&p.lockV.t===T&&dt>0){const k=Math.min(1,dt*5),V=p.lockV;V.vx+=((T.pos.x-V.x)/dt-V.vx)*k;V.vy+=((ty-V.y)/dt-V.vy)*k;V.vz+=((T.pos.z-V.z)/dt-V.vz)*k;V.x=T.pos.x;V.y=ty;V.z=T.pos.z;}
  else p.lockV={t:T,x:T.pos.x,y:ty,z:T.pos.z,vx:0,vy:0,vz:0};
  const m=lockMarker(p);m.position.set(T.pos.x,ty,T.pos.z);p.lockPulse=Math.max(0,(p.lockPulse||0)-dt);
  const cam=p.camera.position;m.scale.setScalar(Math.max(0.55,Math.hypot(T.pos.x-cam.x,ty-cam.y,T.pos.z-cam.z)*0.05)*(1+p.lockPulse*1.6)*(isMilT(T)?2:1));
}
// what a locked gun aims at: the target, led by the time the shot takes to get there (sp: the shot's speed)
function drvLead(p,sp){const T=p.lockT,V=p.lockV,ty=lockY(T);if(!V||V.t!==T)return{x:T.pos.x,y:ty,z:T.pos.z};
  const t=Math.min(3,Math.hypot(T.pos.x-p.pos.x,ty-p.pos.y,T.pos.z-p.pos.z)/sp),cl=v=>Math.max(-30,Math.min(30,v));
  return{x:T.pos.x+cl(V.vx)*t,y:ty+cl(V.vy)*t,z:T.pos.z+cl(V.vz)*t};}
// where the middle of the screen points: the first block on the line from the camera, past the vehicle
function drvAim(p,sp){if(p.lockT&&p.drv&&lockAlive(p.lockT))return drvLead(p,sp||40);const c=shipEye(p),cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
  // (a goblin under the crosshair is what's aimed at, not the ground behind it: from a gun off to one side of the
  // camera, aiming past it would miss)
  let gt=160,ga=null;const t0=p.drvCamD||4;
  // (and across a ship's side: aimed at its deck, or someone on it, from the Mobile Gear stood on it, say. See shipLines)
  const SL=shipLines(c.x,c.y,c.z,fx,fy,fz,gt),S0=SL&&c.x>=SHIP_X0?shipOfPos(c.x,c.z):null;
  for(const g of goblins){if(g.state!=='chase')continue;const q=SL?shipPosIn(g.pos,S0):g.pos,ox=q.x-c.x,oy=q.y+0.8-c.y,oz=q.z-c.z,t=ox*fx+oy*fy+oz*fz;if(t<t0||t>=gt)continue;
    const ex=ox-fx*t,ey=oy-fy*t,ez=oz-fz*t;if(ex*ex+ez*ez<0.5&&Math.abs(ey)<1.1){gt=t;ga={x:q.x,y:q.y+0.8,z:q.z};}}
  for(let t=t0;t<gt;t+=0.5){const x=c.x+fx*t,y=c.y+fy*t,z=c.z+fz*t;if(y<1||solidAt(x,Math.floor(y),z)||SL&&shipLineAt(SL,t))return{x,y,z};}
  return ga||{x:c.x+fx*160,y:c.y+fy*160,z:c.z+fz*160};}
// the view from behind the vehicle: turned with the mouse or right stick as usual, and, with the Controls tab's Camera
// auto-recenter on (CAM_RC, localStorage CAM_RC_KEY, off at first), swinging back round behind it a moment after you
// stop looking about, once it's moving
const CAM_RC_KEY='goblin-stompin-gus-cam-recenter';let CAM_RC=false;try{CAM_RC=localStorage.getItem(CAM_RC_KEY)==='1';}catch(e){}
{const t=document.getElementById('camTog');if(t){const show=()=>t.setAttribute('aria-checked',String(CAM_RC));show();
  t.addEventListener('click',()=>{CAM_RC=!CAM_RC;show();try{localStorage.setItem(CAM_RC_KEY,CAM_RC?'1':'0');}catch(e){}});}}
function drvCamera(p){
  if(p.drv.k==='mech'){mechCamera(p);return;}
  if(p.drv.k==='ship'&&p.shipBridge){shipBridgeCam(p,p.drv.o);return;}   // (the view from the bridge: see ships.js)
  if(p.drv.k==='mount'){mountCam(p,p.drv.o);return;}   // (at a carrier's deck weapon: see carrier-crew.js)
  if(tankSight(p))return;   // (a tank's gunsight, held: from the turret, zoomed in. See tank-handling.js)
  const D=p.drv,S=drvPose(D);
  if(p.drvYaw!==undefined&&Math.abs(angDiff(p.drvYaw,p.cam.yaw))>1e-5)p.drvLook=camClock;
  // (not a helicopter, which faces where you look anyway, nor a train, where the way you look is the way it goes)
  // (by the real time since the last frame, so it swings round as fast at any frame rate: 3.5% a frame at 60)
  const cdt=Math.max(0,Math.min(0.1,camClock-(p.drvCamC??camClock)));p.drvCamC=camClock;
  if(CAM_RC&&D.k!=='heli'&&D.k!=='train'&&D.k!=='subway'&&D.k!=='balloon'&&D.seat!=='gun'&&!(D.k==='plane'&&planeMode(p)==='aim')&&camClock-(p.drvLook??-9)>1.2&&Math.abs(S.v)>1.5)p.cam.yaw+=angDiff(p.cam.yaw,S.h+Math.PI)*(1-Math.pow(1-0.035,cdt*60));
  p.drvYaw=p.cam.yaw;
  // (C held in a road vehicle: looking back past it, from in front)
  const yaw=D.k==='car'&&drvIn(p).rdBehind&&drvCtx(D)==='road'?S.h:p.cam.yaw;
  const cp=Math.cos(p.cam.pitch),fx=-Math.sin(yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(yaw)*cp;
  // (a tank or a helicopter: up higher and further back, so you see over it to what you're aiming at)
  // (a balloon: well back and up level with its envelope, so you see it and round it)
  const gun=D.k==='tank'||D.k==='heli',bal=D.k==='balloon',tx=S.x,ty=S.y+S.hy+(bal?4.5:gun?2.6:0.8),tz=S.z,base=bal?17:4+Math.max(S.hz,S.hx)*1.4+(gun?2:0);let dist=base;
  for(let t=0.6;t<=base;t+=0.3){if(solidAt(Math.floor(tx-fx*t),Math.floor(ty-fy*t),Math.floor(tz-fz*t))){dist=Math.max(0.8,t-0.5);break;}}
  let cx=tx-fx*dist,cy=ty-fy*dist,cz=tz-fz*dist;const gy=supportAt(cx,cz,cy);if(gy!==null&&cy<gy+0.4)cy=gy+0.4;
  if(fy>0.2&&cy<S.y+S.hy*0.8)cy=S.y+S.hy*0.8;   // (looking up: not from down inside the vehicle)
  p.drvCamD=dist;p.camera.position.set(cx,cy,cz);p.camera.rotation.set(p.cam.pitch,yaw,0);
  planeVignette(p);   // (a jet pulled hard: the view's edges grey)
  if(p.shake>0.002&&gameSpeed()>0){const c=p.camera.position;c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
}
// driving a car: much as a hunting car drives itself (updateCars does the rest: the ground, walls, what it runs into)
function drvCar(c,dt){
  const i=drvIn(c.drv),st=-i.x,V=c.veh,Hd=handOf(V||'car');let thr=drvThr(i),top=Hd.top;
  // (its numbers are its handling profile, HANDLING: a supercar pulls hard, a forklift barely, a tractor steadily up to a
  // crawl; a hovercraft has no wheels to brake with)
  let acc=Hd.acc;const brk=Hd.brk;
  // (on its side, a forklift goes nowhere; the forks and the tractor's hand throttle and hitch: farm-lift.js)
  if(c.tipR&&Math.abs(c.tipR)>0.05){c.speed*=Math.exp(-dt*4);return;}
  if(V==='forklift')forkDrive(c,i,dt);
  else if(V==='tractor'){thr=farmDrive(c,i,thr,top);if(farmWorking(c)){top*=FARM.slow;acc*=FARM.slow;}}
  // (a road vehicle: the handbrake and drifting, boosts, its special, the keyboard's throttle easing on: road-handling.js)
  const road=V!=='forklift'&&V!=='tractor'&&V!=='hover'&&V!=='segway',R=road?roadDrive(c,i,thr,dt,Hd,top,acc):null;if(R){thr=R.thr;top=R.top;acc=R.acc;}
  // (a light one, ridden its own way: pedalled, kicked, leant on, twisted. See light-vehicles.js)
  const Lt=lightOf(c)?lightDrive(c,i,thr,dt,Hd,top,acc):null;if(Lt){thr=Lt.thr;top=Lt.top;acc=Lt.acc;}
  if(c.grounded||rampUnder(c.pos.x,c.pos.z,c.pos.y+0.5)){
    if(thr>0.1)c.speed+=(c.speed<0?brk:acc*(Hd.accFall?Math.max(0.45,1-c.speed/Hd.accFall):1))*thr*dt;else if(thr<-0.1)c.speed-=(c.speed>0?brk:Math.min(acc,8))*-thr*dt;else c.speed*=Math.exp(-dt*Hd.coast);}
  c.speed=Math.max(-Hd.rev,Math.min(top,c.speed));
  // (a forklift steers with its back wheels: it turns hard even creeping along, about its front axle, the tail swinging wide)
  // (and a road vehicle's steering eases off with speed, so a lane change at speed isn't twitchy; its own grip then
  // brings where it's going round to where it points: roadSlip)
  const fall=Hd.fall||(road?Hd.top*3:0);
  c.steer+=(st-c.steer)*Math.min(1,dt*8);const dh=c.steer*dt*(Lt&&Lt.spot?1:Math.max(-1,Math.min(1,c.speed/(V==='forklift'?2:5))))*Hd.steer*(fall?Math.max(0.45,1-Math.abs(c.speed)/fall):1)*(R?R.yaw:1);
  c.heading+=dh;if(V==='forklift')forkPivot(c,dh);
  if(V==='hover')hovDrift(c,dt);else if(R)roadSlip(c,dt,Hd,R.grip);
  if(c.veh==='fire')drvHose(c,i,dt);   // (a fire engine: bite sprays water, its special is the siren. See hose.js)
  else if(i.bitePress&&c.honkT<=0){if(Lt)lightHorn(c);else horn(0.12);c.honkT=0.4;}   // (bite sounds the horn: on a light one, a bell or a beep)
}
// the throttle from the controls, -1 (full brake or reverse) to 1: on a controller the triggers, as far as they're
// pulled (RT throttle, LT brake), or else the stick; on the keyboard W and S
function drvThr(i){const t=(i.rt||0)-(i.lt||0);return Math.abs(t)>0.05?t:-i.z;}
// a hovercraft slides: the way it's going only slowly comes round to the way it points (updateCars moves it along its
// heading; this adds the rest, sideways, where there's nothing in the way)
function hovDrift(c,dt){const vx=Math.sin(c.heading)*c.speed,vz=Math.cos(c.heading)*c.speed;if(!c.hvel)c.hvel={x:vx,z:vz};const H=c.hvel,k=Math.min(1,dt*1.5);
  H.x+=(vx-H.x)*k;H.z+=(vz-H.z)*k;const sx=(H.x-vx)*dt,sz=(H.z-vz)*dt;if(Math.abs(sx)+Math.abs(sz)>1e-4){const x0=c.pos.x,z0=c.pos.z;nudgeFlat(c,sx,sz);if(c.pos.x===x0&&c.pos.z===z0){H.x=vx;H.z=vz;}}}
// ---- a driven tank's or helicopter's weapons: a load of rounds each, a moment between shots, and once the last is
// gone a reload (a tank's cannon: Bite; a helicopter's machine gun: Bite, held; its rockets: Stomp). o.wpn[k]: {n
// rounds left, cd till the next shot, rl reload time left}
const DRV_WPN={tank:[{k:'shell',name:'Shells',max:4,gap:1.2,reload:5}],
  heli:[{k:'gun',name:'Gun',max:40,gap:0.09,reload:3},{k:'rkt',name:'Rockets',max:4,gap:0.6,reload:6}],
  jet:[{k:'gun',name:'Cannon',max:120,gap:0.05,reload:4},{k:'rkt',name:'Missiles',max:6,gap:0.45,reload:8}]};
// (list: the weapons it carries, when they aren't the kind's usual ones: a Mobile Gear's loadout)
function wpnInit(o,kind,list){if(!o.wpn){o.wpn={};for(const W of list||DRV_WPN[kind]||[])o.wpn[W.k]={n:W.max,cd:0,rl:0,W};}}
function wpnTick(o,dt){for(const k in o.wpn||{}){const s=o.wpn[k];s.cd-=dt;s.ck=(s.ck||0)-dt;if(s.rl>0){s.rl-=dt;if(s.rl<=0){s.rl=0;s.n=s.W.max;if(audio)sfx('Weapon reloaded',()=>tone('square',380,520,0.08,0.03));}}}}
// (pulling the trigger with nothing loaded clicks: once a press, or every quarter second held)
function wpnFire(o,k){const s=o.wpn&&o.wpn[k];if(!s)return false;
  if(s.rl>0||s.n<=0){if(!(s.ck>0)){s.ck=0.25;wpnClick();}return false;}if(s.cd>0)return false;
  s.cd=s.W.gap;if(DT.infAmmo&&!s.W.cool)return true;   // (the debug menu's Infinite ammo: nothing used up, so nothing reloads; a cooldown, the blade's, still counts)
  s.n--;if(s.n<=0){s.rl=s.W.reload;if(audio)sfx('Magazine empty',()=>tone('square',300,180,0.12,0.03));}return true;}
function wpnClick(){if(audio)sfx('Dry fire click',()=>{tone('square',2400,1500,0.018,0.05);tone('triangle',900,600,0.03,0.04,0.035);});}
// the helicopter's machine gun, one round: down the line to where you're aiming (led onto a locked target), a little
// scattered, to the first goblin, vehicle or wall in the way; a tracer and a puff where it hits
function heliGun(M,p){gunRound(M,p,M.x+Math.sin(M.h)*2.4,M.y+0.8,M.z+Math.cos(M.h)*2.4,2,0.012,'Gunned down from a helicopter','Helicopter gun');}
// one round from a mounted gun (own: the vehicle it's on) at mx,my,mz, at where p is aiming: dmg to a goblin, sc how
// much it scatters (per block), cause what kills, snd the sound's name; A0, if given, what it's aimed at (else where p's
// crosshair is)
function gunRound(M,p,mx,my,mz,dmg,sc0,cause,snd,A0){
  return fireRound({x:mx,y:my,z:mz,at:A0||drvAim(p,400),own:M,by:p,dmg,sc:sc0,cause,snd,gobs:true,vehs:true,breaks:true,ship:true,pvp:{n:1,opt:{raw:true,cd:0.1}}});}
// ---- one round from any gun: down the line from the muzzle to the first thing in its way, with a tracer to show it ----
// Where it goes: x,y,z the muzzle; at {x,y,z} what it's aimed at, or dir (a unit vector) and range; sc how much it scatters
// (per block it's aimed off); step how finely the line's followed (0.5 by default); tr where the tracer starts, if not at
// the muzzle; own the vehicle it's fired from (spared); by the player firing (or null).
// What it can hit (each gun's own switches): gobs, goblins (dmg each; gb [radius, lowest, highest] how near the line,
// from its feet), and with PvP on another player (pvp {n, cause, opt} for pvpHurt); vehs, stopping at a vehicle in its
// way (vd to it through vehBlast, 4 by default); breaks, half the time the block it hits breaks (bulletBreak); ship,
// followed across a ship's side (shipLines). An enemy's shot is aimed at a player, tgt: hit the chance it finds them,
// else it's aimed off to one side by miss [nearest, furthest, up, up at random, how much further on], pdmg hearts (a
// driver's vehicle takes vd, else pdmg times VEH_SHOT_K: shotPlayer), id the goblin to blame; walls stop it, and for now
// it passes vehicles and goblins by and breaks nothing (its switches are off). cause what kills; snd its sound (a name
// for sfx, or a function to call). Returns what it hit ('gob', 'veh', 'wall', 'sea', 'tgt', 'air') and where it ended
const _rdir=new V3();
function fireRound(o){
  const mx=o.x,my=o.y,mz=o.z;let A=o.at,tgtHit=false;
  // (an enemy's: does it find him? A miss goes off to one side of him)
  if(o.tgt){const q=o.tgt;tgtHit=!(q.dodge&&q.dodge.t<q.dodge.dur*0.85)&&Math.random()<(o.hit||0);
    if(!tgtHit&&o.miss){const m=o.miss,a=Math.random()*6.283,r=m[0]+Math.random()*(m[1]-m[0]);A={x:A.x+Math.cos(a)*r,y:A.y+m[2]+(m[3]?Math.random()*m[3]:0),z:A.z+Math.sin(a)*r};
      if(m[4]&&m[4]!==1)A={x:mx+(A.x-mx)*m[4],y:my+(A.y-my)*m[4],z:mz+(A.z-mz)*m[4]};}}
  let dx,dy,dz,L0;if(A){dx=A.x-mx;dy=A.y-my;dz=A.z-mz;L0=Math.hypot(dx,dy,dz)||1;}else{dx=o.dir.x;dy=o.dir.y;dz=o.dir.z;L0=o.range;}
  if(o.sc){const sc=o.sc*L0;dx+=(Math.random()-.5)*sc*2;dy+=(Math.random()-.5)*sc*2;dz+=(Math.random()-.5)*sc*2;}
  const L=Math.hypot(dx,dy,dz)||1,ux=dx/L,uy=dy/L,uz=dz/L,R=o.range||(o.tgt?L:Math.min(130,L0+20)),who=o.own||o.by||null;
  // (followed across a ship's side too, into its pocket or out of it: see shipLines)
  const SL=o.ship?shipLines(mx,my,mz,ux,uy,uz,R):null,S0=SL&&mx>=SHIP_X0?shipOfPos(mx,mz):null;
  // (the nearest goblin within reach of the line)
  let gt=1e9,gg=null,pr=null;
  if(o.gobs){const B=o.gb||[0.707,-0.3,1.9],r2=B[0]*B[0],mid=(B[1]+B[2])/2,half=(B[2]-B[1])/2;
    for(const g of goblins){if(g.state!=='chase')continue;const q=SL?shipPosIn(g.pos,S0):g.pos,ox=q.x-mx,oy=q.y+mid-my,oz=q.z-mz,t=ox*ux+oy*uy+oz*uz;if(t<0||t>R||t>=gt)continue;
      const cx=ox-ux*t,cy=oy-uy*t,cz=oz-uz*t;if(cx*cx+cz*cz<r2&&Math.abs(cy)<half){gt=t;gg=g;}}
    // (with PvP on, another player nearer along it)
    if(o.pvp){pr=pvpRay(o.by,mx,my,mz,ux,uy,uz,Math.min(R,gt));if(pr){gt=pr.t;gg=pr.q;}}}
  const st=o.step||0.5,ve=Math.max(1,Math.round(0.4/st)),lim=Math.min(R,gt);   // (vehicles looked for every 0.4 or so: the narrowest box is far wider)
  let t=st,i=0,hit='air',oh=null,hv=null,wx=0,wy=0,wz=0;_sp.own=o.own||null;_sp.noShip=!!SL;
  for(;t<lim;t+=st,i++){const x=mx+ux*t,y=my+uy*t,z=mz+uz*t;if(y<1||solidAt(x,Math.floor(y),z)){hit='wall';wx=Math.floor(x);wy=Math.floor(y);wz=Math.floor(z);break;}
    if(o.vehs&&i%ve===0){_sp.pos.set(x,y,z);if(hv=shotHitsVeh(_sp)){hit='veh';break;}}
    if(SL&&(oh=shipLineAt(SL,t,who,true))){hit=oh.veh?'veh':oh.b?'wall':'sea';hv=oh.veh||null;break;}}
  _sp.noShip=false;_sp.own=null;
  if(hit==='air'&&gg&&t>=gt){t=gt;hit='gob';}
  if(hit==='air'&&tgtHit)hit='tgt';   // (reached him)
  // (a player's round, or any not aimed at a player, sets off a landmine it reaches first: just short of the ground under
  // it counts, as the line meets the mine as it meets the ground)
  let mr=null;if(!o.tgt&&MINES.length&&(mr=mineRay(mx,my,mz,ux,uy,uz,Math.min(R,t+0.4)))){t=mr.t;hit='mine';oh=null;}
  t=Math.min(t,R);const ex=mx+ux*t,ey=my+uy*t,ez=mz+uz*t,T0=o.tr||o;tracer(T0.x,T0.y,T0.z,ex,ey,ez);
  if(typeof o.snd==='function')o.snd();else if(o.snd&&audio)sfx(o.snd,()=>noise(0.06,0.1,2400,'highpass'));
  // (where it struck, in the frame of whatever it struck)
  const hx=oh?oh.x:ex,hy=oh?oh.y:ey,hz=oh?oh.z:ez;if(oh&&oh.b){wx=oh.b[0];wy=oh.b[1];wz=oh.b[2];}
  if(hit==='gob'&&pr&&gg===pr.q)pvpHurt(o.by,gg,o.pvp.n,new V3(ex,ey,ez),new V3(ux,0.3,uz),o.pvp.cause||o.cause,o.pvp.opt);
  else if(hit==='gob')damageGoblin(gg,o.dmg,SL?new V3(gg.pos.x,gg.pos.y+0.8,gg.pos.z):new V3(ex,ey,ez),new V3(ux,0.3,uz),o.cause);
  else if(hit==='veh'){const Mt=mountOfHit(hv);if(Mt)trainHit(Mt,MOUNT_ROUND);else vehBlast(hx,hy,hz,0.8,o.vd??4,o.own);}   // (a carrier's deck weapon: a round's own set damage, carrier-crew.js)
  else if(hit==='tgt'){const h=Math.hypot(ux,uz)||1;shotPlayer(o.tgt,o.pdmg,new V3(ex,ey,ez),new V3(ux/h,0.2,uz/h),o.cause,o.id,o.vd);}
  if(hit!=='tgt'&&(hit!=='air'||o.tgt))puff(hx,hy,hz,1,hit==='gob'||hit==='veh'?0xffb040:0x9a948a,0.2);   // (an enemy's miss raises dust where it ends)
  if(hit==='wall'&&o.breaks)bulletBreak(wx,wy,wz,ux,uz);
  if(mr)mineBoom(mr.M,isPlT(o.by)?pvpBy(o.by):undefined);
  return{hit,x:ex,y:ey,z:ez};
}
// a bullet into a wall: half the time the block it struck breaks (only that one, so a stream of rounds chews through a
// wall slowly, well short of what a shell, a missile or a blade does), with the same wreckage as anything else breaking
function bulletBreak(bx,by,bz,ux,uz){
  if(SBX||Math.random()>=0.5||by<1||by>=H)return false;const b=get(bx,by,bz);if(b===AIR||b===WATER||b===BEDROCK)return false;
  setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);const ch=new Set();for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((bx+ox)/CS),Math.floor((bz+oz)/CS)));
  const L=[{x:bx,y:by,z:bz,b}],o={force:0.5,dx:ux,dz:uz,up:0.4};rebuildSet(ch);save();destroyFX(L,o);settle(L,o);pumpsHit(L);return true;}
// a tank's shell as it would leave the gun now: from the muzzle, along the turret as it's turned (it may still be swinging
// round), climbing or dipping toward A only as far as the gun goes (about 31 degrees up, 27 down)
function tankShell(M,A){const a=M.h+M.tu,fx=Math.sin(a),fz=Math.cos(a),x=M.x+fx*3.9,y=M.y+2.2,z=M.z+fz*3.9,L=Math.hypot(A.x-x,A.y-y,A.z-z)||1,sp=45,
    hz=Math.max(1,Math.hypot(A.x-x,A.z-z)),k=Math.max(-0.5,Math.min(0.6,(A.y-y)/hz));
  return{x,y,z,vx:fx*sp,vy:k*sp+L/sp,vz:fz*sp};}
// where a shell or rocket fired like that (F: its start and velocity) would go off: its flight, step by step as
// updateShots moves it, to the first block or vehicle (other than own) it meets, or where its fuse runs out ({x,y,z,air}).
// A: what's being aimed at; a shot that never comes down on anything (aimed above what the gun can reach, say) is
// marked instead where it passes, as far off as A is, so you can see how far under the crosshair it goes
const _sp={pos:new V3(),own:null};
function shotPath(F,grav,fuse,own,A){
  let x=F.x,y=F.y,z=F.z,vx=F.vx,vy=F.vy,vz=F.vz,mid=null;_sp.own=own;
  const sp=Math.hypot(vx,vy,vz)||1,h=Math.min(1/30,0.4/sp),hd=A?Math.hypot(A.x-F.x,A.z-F.z):1e9;
  for(let t=0,k=0;t<fuse;t+=h,k++){vy-=grav*h;const nx=x+vx*h,ny=y+vy*h,nz=z+vz*h;
    if(ny<1||solidAt(nx,Math.floor(ny),nz))return{x,y,z,air:false};
    x=nx;y=ny;z=nz;if(!mid&&Math.hypot(x-F.x,z-F.z)>=hd)mid={x,y,z};if(k%3===0){_sp.pos.set(x,y,z);if(shotHitsVeh(_sp))return{x,y,z,air:false};}}
  return mid?{...mid,air:true}:{x,y,z,air:true};}
// driving a tank: turns on the spot, forward and back; the turret follows where you look, and bite fires a shell there
// a tank shoving into a wall: everything in front of it as wide and tall as the tank (a little ragged round the edge)
// is knocked out, `depth` blocks deep past its nose (d: 1 going forward, -1 backing)
function tankRam(M,d,depth){
  const I=MIL[M.kind],fx=Math.sin(M.h)*d,fz=Math.cos(M.h)*d,y0=Math.floor(M.y+0.05),y1=Math.floor(M.y+I.hy+0.6),W=I.hx+0.45,E=Math.ceil(I.hz+depth+W)+1;
  const ch=new Set(),broken=[],cx0=Math.floor(M.x),cz0=Math.floor(M.z);
  if(SBX)return 0;knockProps(M.x+fx*(I.hz+1),M.y+1,M.z+fz*(I.hz+1),W+1,fx,fz);
  for(let bz=cz0-E;bz<=cz0+E;bz++)for(let bx=cx0-E;bx<=cx0+E;bx++){const rx=bx+0.5-M.x,rz=bz+0.5-M.z,a=rx*fx+rz*fz,l=Math.abs(rx*fz-rz*fx);
    for(let by=y0;by<=y1+1;by++){const rag=0.45*hash2(bx*7+by*3,bz*11+by);if(a<I.hz-0.7||a>I.hz+depth+rag||l>W+rag||by===y1+1&&rag<0.3)continue;
      const b=get(bx,by,bz);if(b===AIR||b===WATER||b===BEDROCK||by<1||by>=H)continue;
      setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
      for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((bx+ox)/CS),Math.floor((bz+oz)/CS)));}}
  if(broken.length){const o={force:1.2,dx:fx,dz:fz,up:1};rebuildSet(ch);save();destroyFX(broken.slice(0,120),o);settle(broken,o);pumpsHit(broken);}
  return broken.length;}
function drvTank(M,dt){
  const p=M.drv,i=drvIn(p),turn=tankDrive(M,p,i,dt);   // (its tracks, with weight, and the cruise steps: tank-handling.js)
  {const nh=M.h+turn*dt;if(!milBlocked(M,M.x,M.z,nh,M.y)||milBlocked(M,M.x,M.z,M.h,M.y))M.h=nh;}
  tankGun(M,M.gnr||p,dt,turn);   // (the turret and the gun: the gunner's, if there's another player in that seat)
  // (anything more than a block up, below the top of the tank, stops it -- what's overhead it passes under; leaning on
  // it a moment, or hitting it at speed, it smashes through)
  if(Math.abs(M.sv)>0.05){const d=M.sv<0?-1:1,fx=Math.sin(M.h)*d,fz=Math.cos(M.h)*d,ax=M.x+fx*3,az=M.z+fz*3;
    if(groundAt(ax,az,M.y+1.1)-M.y>1.05||groundAt(ax-fz*1.2,az+fx*1.2,M.y+1.1)-M.y>1.05||groundAt(ax+fz*1.2,az-fx*1.2,M.y+1.1)-M.y>1.05){const fast=Math.abs(M.sv)>2.2;M.sv*=fast?0.8:0.5;M.stuck+=dt;
      if(M.stuck>0.5||fast){M.stuck=0;tankRam(M,d,fast?1.8:1.1);clang();if(fast)addShake(0.5,ax,az,25);}}   // (rammed at speed, it's straight through)
    else{const nx=M.x+Math.sin(M.h)*M.sv*dt,nz=M.z+Math.cos(M.h)*M.sv*dt;
      if(milBlocked(M,nx,nz,M.h,M.y)&&!milBlocked(M,M.x,M.z,M.h,M.y))M.sv=0;else{M.stuck=0;M.x=nx;M.z=nz;}}}
  M.v=Math.max(0,M.sv);
  {const gy=groundAt(M.x,M.z,M.y+1.5);if(gy<M.y){M.vy-=20*dt;M.y=Math.max(gy,M.y+M.vy*dt);}else{M.vy=0;M.y+=(gy-M.y)*Math.min(1,dt*8);}}
  tankTilt(M,dt);milPlace(M);milBoxes(M,M.v);milShove(M);
}
// a driven tank's turret and gun, worked by g (its driver, or another player as its gunner): the turret follows where g
// looks, and bite fires a shell there
// (held straight ahead by hull lock; its aim blooming as it moves and swings, and HE or AP: tank-handling.js)
function tankGun(M,g,dt,turn=0){const i=drvIn(g);tankSwitches(M,g,i);
  const A=drvAim(g,45),tu0=M.tu;M.aim=A;if(!M.hullLock)M.tu=angTo(M.tu,Math.atan2(A.x-M.x,A.z-M.z)-M.h,1.4*dt);
  tankBloom(M,turn,angDiff(tu0,M.tu)/Math.max(dt,1e-3),dt);
  const F=tankShell(M,A);M.pred=shotPath(F,2,4,M,A);
  wpnTick(M,dt);if(i.bitePress&&wpnFire(M,'shell')){const mx=F.x,my=F.y,mz=F.z;
    tankFire(M,tankSpread(M,{...F}),g);
    smoke(mx,my,mz,4,0x8a8a80);puff(mx,my,mz,4,0xffc040,0.3);if(audio)sfx('Tank fires',()=>{noise(0.6,0.6,350,'lowpass');tone('sawtooth',70,30,0.5,0.15);});addShake(0.3,M.x,M.z,30);}
}
// flying a helicopter: it goes the way you push, relative to where you look, and turns to face that way; jump climbs,
// climb (or dash) drops; bite fires a rocket where you're looking
function drvHeli(M,dt){
  const p=M.drv,i=drvIn(p);heliMode(M,p,i);
  const lift=heliFly(M,p,i,dt);   // (Simple or Agile, the spool-up and autorotation: heli-handling.js)
  {const nx=M.x+M.hv.x*dt,nz=M.z+M.hv.z*dt,clear=y=>!solidAt(nx,Math.floor(y),nz)&&!solidAt(nx+Math.sin(M.h)*2.6,Math.floor(y),nz+Math.cos(M.h)*2.6);
   if(clear(M.y+0.4)&&clear(M.y+1.6)&&clear(M.y+2.6)&&(!milBlocked(M,nx,nz,M.h,M.y)||milBlocked(M,M.x,M.z,M.h,M.y))){M.x=nx;M.z=nz;}
   else if(Math.hypot(M.hv.x,M.hv.z)>9){airCrash(M.x+Math.sin(M.h)*2.6,M.y+1.2,M.z+Math.cos(M.h)*2.6,4,'Killed when a helicopter crashed');milHit(M,MIL.heli.hp*99);return;}   // (into something at speed: it goes up)
   else{M.hv.x*=-0.3;M.hv.z*=-0.3;}}
  {let ny=M.y+M.vy*dt;const g2=groundAt(M.x,M.z,M.y+1);if(ny<g2){if(M.auto)heliTouch(M,p,M.vy);ny=g2;M.vy=0;}if(M.dead)return;if(M.vy>0&&solidAt(M.x,Math.floor(ny+3),M.z)){ny=M.y;M.vy=0;}M.y=Math.min(ny,H+60);}
  heliRotor(M,p,dt);if(M.dead)return;   // (the main rotor against goblins and walls)
  M.rot.rotation.y+=dt*M.spin*28;M.trot.rotation.x+=dt*M.spin*40;
  heliGuns(M,M.gnr||p,lift,dt);   // (its gun and rockets: the gunner's, if there's another player in that seat)
  milPlace(M);milBoxes(M,Math.hypot(M.hv.x,M.hv.z));milShove(M);
  if(M.spin>0.3&&audio&&playing){M.thT=(M.thT||0)-dt;if(M.thT<=0){M.thT=0.11;sfx('Helicopter rotor',()=>noise(0.08,0.05*M.spin,180,'lowpass'));}}
}
// a helicopter's gun and rockets, worked by g (its pilot, or another player as its gunner), at where g looks; only
// with the rotor up to speed (lift)
function heliGuns(M,g,lift,dt){const i=drvIn(g);
  {const A=drvAim(g,36),mx=M.x+Math.sin(M.h)*2.6,my=M.y+1.2,mz=M.z+Math.cos(M.h)*2.6,L=Math.hypot(A.x-mx,A.y-my,A.z-mz)||1,sp2=36;
   M.rk={x:mx,y:my,z:mz,vx:(A.x-mx)/L*sp2,vy:(A.y-my)/L*sp2,vz:(A.z-mz)/L*sp2};M.pred=lift?shotPath(M.rk,0.5,5,M,A):null;}
  wpnTick(M,dt);if(lift&&i.bite&&wpnFire(M,'gun'))heliGun(M,g);
  const rp=i.stomp&&!M.rkHeld;M.rkHeld=i.stomp;if(rp&&lift&&wpnFire(M,'rkt')){const F=M.rk;
    shot({kind:'rocket',x:F.x,y:F.y,z:F.z,vx:F.vx,vy:F.vy,vz:F.vz,grav:0.5,fuse:5,R:4.2,dmg:4,cause:'Blown up by a goblin in a helicopter',by:pvpBy(g),crush:2.8,vd:45,own:M});if(audio)sfx('Helicopter rocket',()=>noise(0.5,0.25,900,'bandpass'));}
}
// steering a boat: only where there's open water ahead of it (run it aground and it stops; hard, and it's holed a bit);
// the bigger it is, the slower it answers. Returns its speed
function drvBoat(V,dt){
  const bo=V.bo,g=V.boat,K=bo.K,p=bo.drv,i=drvIn(p);
  boatDrive(V,bo,p,i,dt);   // (the throttle's notches, the oars, planing, waves, the anchor and the specials: boat-handling.js)
  const h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),d=bo.sp<0?-1:1,nx=g.position.x+tx*bo.sp*dt,nz=g.position.z+tz*bo.sp*dt;
  const wet=(x,z)=>get(x,G,z)===WATER&&!solidAt(x,G+1,z),fx=nx+tx*bo.L/2*d,fz=nz+tz*bo.L/2*d,w=K.W/2,y0=g.position.y-1,y1=g.position.y+K.fb+1;
  const hitV=vehIn(nx,nz,h,w,bo.L/2,y0,y1,bo),inV=hitV&&vehIn(g.position.x,g.position.z,h,w,bo.L/2,y0,y1,bo);
  // (another boat in the way: a tug in push mode shoves it along, anything else stops it)
  if(wet(fx,fz)&&wet(fx+tz*w,fz-tx*w)&&wet(fx-tz*w,fz+tx*w)&&(!hitV||inV||bo.push&&boatPush(bo,hitV,nx-g.position.x,nz-g.position.z))){g.position.x=nx;g.position.z=nz;}
  else{if(Math.abs(bo.sp)>4){boatHit(bo,Math.abs(bo.sp)*0.5);thud(0.4);}bo.sp*=-0.2;}
  V.x=g.position.x;V.z=g.position.z;V.yaw=g.rotation.y;
  bo.hornT=(bo.hornT||0)-dt;if(i.bitePress&&bo.k!=='row'&&bo.hornT<=0){horn(0.1);bo.hornT=0.5;}   // (the rowboat's left click is its left oar)
  return Math.abs(bo.sp);
}
// a boat pulled up on the sand, or in a dry dock, is pushed off into the nearest open water as you get in (big enough
// for it, nothing in the way), so it can be driven; with none near, it stays where it is
function drvLaunch(D){const V=D.V,bo=D.o,g=V.boat;if(!V.ground&&!V.dry)return;
  const K=bo.K,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),w=K.W/2+0.5,l=bo.L/2+0.5,x0=g.position.x,z0=g.position.z;
  const wet=(x,z)=>get(Math.floor(x),G,Math.floor(z))===WATER&&!solidAt(x,G+1,z),fits=(x,z)=>{for(const a of [-l,0,l])for(const b of [-w,0,w])if(!wet(x+tx*a+tz*b,z+tz*a-tx*b))return false;return true;};
  for(let r=2;r<=40;r+=2)for(let k=0;k<16;k++){const x=x0+Math.cos(k/16*Math.PI*2)*r,z=z0+Math.sin(k/16*Math.PI*2)*r;
    if(!fits(x,z)||vehIn(x,z,h,w,l,G,G+K.fb+1,bo))continue;
    g.position.x=V.x=x;g.position.z=V.z=z;V.y0=G+.85;V.ground=false;V.dry=false;g.visible=true;puff(x,G+1,z,12,0xd8ecff,1.4);return;}}
// driving a subway train round its loop: forward or back the way you're looking along it, as a train on a line
function drvSub(V,dt){const T=V.T,p=T.drv,i=drvIn(p),N=V.M.path.length;
  const R=trainLever(T,p,i,dt,V.v);V.v=trainPull(R,V.v,R.rev,dt,25);V.s=mod(V.s+V.v*dt,N);V.wait=0;   // (train-handling.js)
}
// is there another vehicle in a box at x,z (facing h, half-width hx, half-length hz, from y0 up to y1)? A car, a tank or
// helicopter, or a piece of a train, boat, plane or ride; not self's own
function vehIn(x,z,h,hx,hz,y0,y1,self){const R=Math.hypot(hx,hz);   // (returns what it met; a carrier's jets pass each other on its deck: the deck crew keeps them apart)
  for(const c of cars){if(!c.alive||c===self||Math.hypot(c.pos.x-x,c.pos.z-z)>R+c.hz||c.pos.y>=y1||c.pos.y+(c.hy||1.4)<=y0)continue;if(boxesTouch(x,z,h,hx,hz,c.pos.x,c.pos.z,c.heading,c.hx,c.hz))return c;}
  for(const V of venues.values()){if(V.kind!=='army')continue;for(const o of V.mil){if(o===self||o.dead||Math.hypot(o.x-x,o.z-z)>R+7)continue;const ox=Math.sin(o.h),oz=Math.cos(o.h);
    for(const b of MIL_PARTS[o.kind]){if(o.y+b.y0>=y1||o.y+b.y1<=y0)continue;if(boxesTouch(x,z,h,hx,hz,o.x+ox*b.c,o.z+oz*b.c,o.h,b.hx,b.hz))return o;}}}
  for(const L of [TRAIN_BOXES,PREV_BOXES])for(const B of L){const pr=B.proxy;if(B.soft||!pr.alive||(pr.T||pr)===self||pr.T&&pr.T.isMil||self&&self.cvJet&&pr.T&&pr.T.cvJet||B.y0>=y1||B.top<=y0||B.y0>=B.top)continue;const bx=B.hx||TRAIN_HX,bz=B.hz||TRAIN_HZ;
    if(Math.hypot(B.x-x,B.z-z)>R+Math.hypot(bx,bz))continue;if(boxesTouch(x,z,h,hx,hz,B.x,B.z,Math.atan2(B.tx,B.tz),bx,bz))return pr;}
  return null;}
// the debug menu's Invulnerability covers whatever a player is driving, flying or manning, too: it takes no damage
function drvSafe(o){if(!DT.invuln||!o)return false;for(const p of players)if(p.active&&p.drv&&p.drv.o===o)return true;return false;}
// a round or a fireball reaching a player: on foot they're hurt; driving, flying or manning something, it's the vehicle
// that takes it (damagePlayer leaves a driver alone), VEH_SHOT_K times over: a rifle round's heart is 3 off a car
const VEH_SHOT_K=3;
function hurtDriven(p,v,dir){const D=p.drv,K=D&&VEHICLE_KINDS[D.k];if(!K||!D.o)return;K.hit(D.o,v,dir,D.ci);}
// (vd: what the vehicle takes, if not n times VEH_SHOT_K)
function shotPlayer(p,n,pt,dir,cause,killer,vd){if(p.drv)hurtDriven(p,vd??n*VEH_SHOT_K,dir);else damagePlayer(p,n,pt,dir,cause,killer);}
// a vehicle run into by another (vehIn's answer), hurt by n
function vehHurt(o,n){if(o.isMil)milHit(o,n);else damageCar(o,n,undefined,'acc');}
// flying a plane, more or less as a real one flies. On a controller the stick's up and down set the throttle (it stays
// where you leave it); on the runway left and right steer the nose wheel and pulling back with the throttle closed
// brakes. Past rotation speed, Jump pulls the nose up and the wings lift it off. In the air left and right bank it, and
// a banked plane turns; Jump pulls the nose up and Climb (or Dash) pushes it down. On the keyboard (i.kbd) it's flown
// with WASD alone, as a flight stick would: W pushes the nose down and S pulls it up, A and D bank, and Jump and Climb
// (or Dash) open and close the throttle (Climb with it closed brakes on the runway). Lift comes from speed and the wing's angle to the air: climbing costs speed and diving gains it,
// and too slow or too steep the wing stalls, lift goes and the nose drops. Let go and it eases back to level flight,
// holding its height through a turn. Into anything at speed, down too hard or on a wingtip, and it's wrecked; left with
// nobody at the controls the throttle closes and it glides down by itself. F: v airspeed, thr throttle, pt the nose's
// pitch, rl the bank (positive turning left), gm the flight path's climb angle, vy its climb rate
const PLANE_LIFT=34,PLANE_G=14,PLANE_KL=0.07,PLANE_AOA=0.32,PLANE_THRUST=20,PLANE_DRAG=0.003;
// is the wing stalled? too slow, or pulled up too steeply for the air going past it
const planeStalled=(F,pl)=>F.air&&(F.v<(pl&&pl.light?LIGHT_FLY.stall:20)||(F.aoa!==undefined?F.aoa:F.pt-F.gm)>PLANE_AOA);
// (a two-seater: lighter on the controls, a far smaller engine, and a wing that carries it at much lower speeds)
const LIGHT_FLY={kl:0.17,lift:16,stall:11,roll:1.6,rl:1.1,pitch:0.8,thr:10,vmax:46};
function drvPlane(pl,dt){
  if(pl.ai&&jetAI(pl,dt))return;   // (a carrier's pilot flying it: carrier-jets.js)
  const F=pl.free,g=pl.g,P=g.position,p=pl.drv,i=p?drvIn(p):null,fly=p||pl.ai,mode=p?planeMode(p):null;
  if(F.thr===undefined){F.thr=Math.min(1,(F.v||0)/60);F.gm=Math.atan2(F.vy||0,Math.max(8,F.v||0));F.pt=Math.max(0,F.gm);F.rl=0;}
  // (a fighter jet: rolls and pulls far harder, and has the engines to go about twice as fast)
  const J=pl.jet,LT=pl.light?LIGHT_FLY:null,THR=J?PLANE_THRUST*4.2:LT?LT.thr:PLANE_THRUST,VMAX=J?185:LT?LT.vmax:90,KL=LT?LT.kl:PLANE_KL,LIFT=LT?LT.lift:PLANE_LIFT;
  // (on the ground: the throttle (Mouse-aim W/S; Direct Shift/C, or a controller's triggers), the nose wheel with A/D, and
  // the nose lifted with S in Direct or by looking up in Mouse-aim)
  const ana=i?(i.rt||0)-(i.lt||0):0,tin=!i?0:mode==='aim'?-i.z:Math.abs(ana)>0.05?ana:(i.jump?1:0)-(i.climb?1:0),bank=i?-i.x:0;
  const up=!i?0:mode==='aim'?(Math.sin(p.cam.pitch)>Math.sin(F.pt||0)+0.06?1:0):i.z;
  // (the sea's surface counts as ground; so does sea level, out where nothing's been built yet)
  const wetAt=(x,z)=>!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS)))||get(x,G,z)===WATER?G+1:0,gnd=(x,z,y)=>Math.max(groundAt(x,z,y),wetAt(x,z));
  const was=F.air,air=P.y>gnd(P.x,P.z,P.y+1)+0.05;F.air=air;
  if(!air&&F.vy<-0.5&&(F.vy<-14||!fly&&F.v>20)){planeCrash(pl,P.x,P.y,P.z,true);return;}   // (touched down too hard, or with nobody flying it)
  // the throttle on the ground (in the air it's pfAir's), shut when nobody's flying it
  if(!air){if(p)F.thr=Math.max(0,Math.min(1,F.thr+tin*pfKind(pl).thr*dt));else F.thr=Math.max(0,F.thr-dt*0.5);}
  // (a jet on a carrier's catapult is held, then flung down it, not flown: see carrier-jets.js)
  if(pl.cat&&jetCatTick(pl,dt)){g.visible=true;return;}
  if(p&&!J)planeSpecial(pl,p,i);   // (right click: the two-seater's smoke, the airliner's autopilot)
  let h=g.rotation.y,dx,dy,dz;
  if(air){
    // in the air: the whole attitude, any way up (plane-flight.js)
    pfSync(F,g);pfAir(pl,dt,{KL,THR,VMAX,STALL:LT?LT.stall:20});if(pl.dead)return;
    h=Math.atan2(F.f[0],F.f[2]);dx=F.vel.x*dt;dy=F.vel.y*dt;dz=F.vel.z*dt;
  } else {
    const v=Math.max(0.5,F.v);
    // on the ground: wings level, the nose wheel steers, Space (or S with the throttle shut) brakes; past rotation speed
    // the nose lifts, and once the wings carry it, it's off. Landed with the gear up, it grinds along on its belly
    if(was){pfBelly(pl,p);if(pl.dead)return;}   // (just touched down)
    F.rl-=F.rl*Math.min(1,dt*6);h+=bank*dt*Math.min(0.9,0.25+F.v*0.05);
    const brake=F.belly?12:p&&(i.arBrake||tin<-0.1&&F.thr<0.05)?22:1.5+(p?0:3);
    F.v+=(F.thr*THR*(F.belly?0:1)-PLANE_DRAG*v*v)*dt;F.v-=Math.min(F.v,brake*dt);
    if(F.belly&&F.v>2&&Math.random()<dt*30)puff(P.x,P.y+0.3,P.z,1,0x9a948a,1.2);
    if(up>0&&F.v>=LIFT*0.8&&!F.belly)F.pt=Math.min(0.25,F.pt+0.5*dt);else F.pt+=(0-F.pt)*Math.min(1,dt*3);
    const L=KL*v*v*Math.max(0,Math.min(F.pt,PLANE_AOA));
    F.gm=L>PLANE_G?Math.min(0.2,(L-PLANE_G)/v):0;
    if(pl.jet){jetTrapCheck(pl,p);if(pl.trap)jetTrapTick(pl,dt);else if(p)jetCatCheck(pl,p);}   // (a carrier's wires and catapults: carrier-jets.js)
    F.v=Math.max(0,Math.min(VMAX,F.v));F.vy=F.v*Math.sin(F.gm);
    const vh=F.v*Math.cos(F.gm);dx=Math.sin(h)*vh*dt;dz=Math.cos(h)*vh*dt;dy=F.vy*dt;
  }
  const stop=()=>{F.v=0;F.vy=0;if(F.vel)F.vel.x=F.vel.y=F.vel.z=0;};
  const tx=Math.sin(h),tz=Math.cos(h),nx=P.x+dx,nz=P.z+dz,ny=P.y+dy;
  // something in the way: a fence or a car's height, on the ground, it ploughs through (and takes some damage); anything
  // bigger, at any speed, wrecks it; at a crawl it just stops
  const Q=planeDim(pl),ax=nx+tx*Q.nose,az=nz+tz*Q.nose,over=gnd(ax,az,ny+Q.hy-0.15)-ny;
  const hitV=vehIn(nx,nz,h,Q.hx,Q.hz,ny,ny+Q.hy,pl);
  if(hitV&&!vehIn(P.x,P.z,h,Q.hx,Q.hz,P.y,P.y+Q.hy,pl)){if(F.v>12){vehHurt(hitV,F.v*3);planeCrash(pl,ax,ny+2,az,!air);return;}if(F.v>3)vehHurt(hitV,F.v);stop();}   // (another vehicle in the way)
  else if(over>(air?0.6:1.05)){   // (taxiing, it rolls up a one-block step)
    if(!air&&over<=2.6&&F.v>0.5){crushBall(ax,ny+1,az,1.8);F.v*=0.6;planeHit(pl,15);if(pl.dead)return;}
    else if(F.v>12){planeCrash(pl,ax,ny+2,az,!air);return;}
    else stop();}
  else{P.x=nx;P.z=nz;}
  const g2=gnd(P.x,P.z,ny+1.5);let down=false;
  // (touching down: too fast a sink, nobody flying it at speed, a wing down, the nose dug in or upside down, and it's
  // wrecked; otherwise it lands, on its wheels, or with the gear up on its belly, which it survives but not the plane)
  if(ny<=g2){
    if(air&&(F.vy<-14||!fly&&F.v>20||Math.abs(F.rl)>0.6&&F.v>15||F.pt<-0.35&&F.v>15||F.u&&F.u[1]<0.5)){P.y=g2;planeCrash(pl,P.x,P.y,P.z,true);return;}
    P.y=g2;if(air){down=true;F.gm=0;F.vy=0;F.pt=Math.max(0,Math.min(0.2,F.pt));F.w={p:0,q:0,r:0};
      pfBelly(pl,p);if(pl.dead)return;}}
  else P.y=Math.min(ny,H+80);
  if(P.y>=H+80&&F.vy>0){F.gm=0;F.vy=0;if(F.vel)F.vel.y=0;}   // (the ceiling)
  if(air&&!down){pfDerive(F);pfPose(F,g);}else g.rotation.set(-F.pt,h,-F.rl,'YXZ');
  pl.v=F.v;g.visible=true;
  if(J&&p)jetGuns(pl,p,i,dt);
}
// a fighter's weapons: the cannon held on Bite, down the line to the crosshair (or the lock, led); a missile a press of
// Stomp, off the rails at the jet's own speed and on, homing on what you've locked or flying at the crosshair
function jetGuns(pl,p,i,dt){const g=pl.g,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),P=g.position,v=pl.free.v;
  wpnTick(pl,dt);if(i.bite&&wpnFire(pl,'gun'))gunRound(pl,p,P.x+tx*6.8,P.y+1.2,P.z+tz*6.8,3,0.008,'Gunned down by a fighter jet','Jet cannon',drvAim(p,v+200));
  const rp=i.stomp&&!pl.rkHeld;pl.rkHeld=i.stomp;
  if(rp&&wpnFire(pl,'rkt')){const T=p.lockT&&lockAlive(p.lockT)?p.lockT:null,A=T?null:drvAim(p,v+70),sd=(pl.rkN=(pl.rkN||0)+1)%2?1:-1,
      mx=P.x+tx*0.6-tz*sd*1.8,my=P.y+0.9,mz=P.z+tz*0.6+tx*sd*1.8,sp=v+60,F=pl.free,fw=F.f||[tx*Math.cos(F.gm||0),Math.sin(F.gm||0),tz*Math.cos(F.gm||0)];   // (off the rails along the nose)
    shot({kind:'missile',x:mx,y:my,z:mz,vx:fw[0]*sp,vy:fw[1]*sp,vz:fw[2]*sp,grav:0,fuse:6,R:3.2,dmg:5,crush:1.8,vd:60,own:pl,
      cause:"Blown up by a fighter jet's missile",by:pvpBy(p),tgt:T,at:A,sp:v+90,turn:4});
    if(audio)sfx('Jet missile',()=>noise(0.4,0.2,1100,'bandpass'));}
}
// driving a train: forward is whichever way along the track you're looking; it stops at the ends of the line
function drvTrain(T,dt){
  const p=T.drv,i=drvIn(p),C=T.C;let v=T.v*T.dir;
  // (the lever, the reverser and the brakes; then the bends: train-handling.js)
  const R=trainLever(T,p,i,dt,v);v=trainPull(R,v,R.rev*T.dir,dt,TRAIN_DRV.top);
  const lo=T.dir>0?TRAIN_LEN+1:1,hi=T.dir>0?C.L-2:C.L-2-TRAIN_LEN;T.s+=v*dt;
  if(T.s<lo){T.s=lo;v=0;}if(T.s>hi){T.s=hi;v=0;}
  T.v=v*T.dir;
  const dir=Math.sign(v)||R.rev*T.dir||T.dir,lead=dir===T.dir?T.s:T.s-T.dir*TRAIN_LEN;
  trainBends(T,p,R,v,lead,dir,dt);
}
