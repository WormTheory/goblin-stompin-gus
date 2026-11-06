// ---- Play as a goblin: driving. Stood by a vehicle, the stomp button (E) gets in and takes the controls; pressed
// again, out you get. Cars and trucks, the bases' tanks and helicopters, boats, trains and the airport's planes. Each
// one's own update reads its driver's controls in place of its usual round (p.drv says what you're in, and the
// vehicle's .drv who's driving it); drvSeat keeps you in your seat once everything's moved ----
const DRV_NAME={tank:'tank',heli:'helicopter',train:'train',plane:'plane'};
function drvName(D){const o=D.o;
  if(D.k==='car')return o.police?'police car':{car:'car',bike:'motorcycle',van:'van',pickup:'pickup',truck:'truck',semi:'lorry',bus:'bus',fire:'fire engine',amb:'ambulance',news:'news van',rv:'motorhome'}[o.veh]||'car';
  if(D.k==='boat')return o.K.name.toLowerCase();
  return DRV_NAME[D.k];
}
// the key (or button) that gets you in and out, as bound
function drvKey(p){const B=BINDS.use;if(p.pad)return padLabel(B.pad[0],padStyle==='ps');return keyLabel(B.kb.find(c=>!c.startsWith('Mouse'))||B.kb[0]);}
// the vehicle nearest you that you could get into: within reach of its box, and about level with it
function drvFind(p){
  const R=1.8,px=p.pos.x,pz=p.pos.z,py=p.pos.y;let best=null,bd=1e9;
  const take=(dx,dz,tx,tz,hx,hz,y0,top,D)=>{const al=dx*tx+dz*tz,ac=-dx*tz+dz*tx,ea=Math.abs(al)-hz,ec=Math.abs(ac)-hx;
    if(ea>R||ec>R||py<y0-1.6||py>top+1.2)return;const d=Math.max(ea,ec,0)+Math.max(0,py-top);if(d<bd){bd=d;best=D;}};
  for(const c of cars){if(!c.alive||!c.g.visible||c.drv||Math.abs(c.pos.x-px)>14||Math.abs(c.pos.z-pz)>14)continue;
    take(px-c.pos.x,pz-c.pos.z,Math.sin(c.heading),Math.cos(c.heading),c.hx,c.hz,c.pos.y,c.pos.y+(c.hy||1.4),{k:'car',o:c});}
  for(const B of TRAIN_BOXES){const pr=B.proxy,T=pr.T;if(!pr.alive||!T||B.soft||T.drv)continue;
    const hx=B.hx||TRAIN_HX,hz=B.hz||TRAIN_HZ;if(Math.abs(B.x-px)>hx+hz+R||Math.abs(B.z-pz)>hx+hz+R)continue;
    let D=null;
    if(T.isMil){if(!T.dead)D={k:T.kind,o:T,V:T.V};}
    else if(pr.isBoat){const V=venues.get(T.key);if(V&&V.bo===T&&!T.dead&&!V.dry&&!V.ground)D={k:'boat',o:T,V};}
    else if(T.isPlane){if(!T.dead&&!T.fall)for(const V of venues.values())if(V.kind==='airport'&&V.pl&&V.pl.includes(T)){D={k:'plane',o:T,V};break;}}
    else if(pr.veh==='train'&&T.C&&!T.dead)D={k:'train',o:T,ci:pr.i};
    if(D)take(px-B.x,pz-B.z,B.tx,B.tz,hx,hz,Math.min(B.y0,B.top-0.5),B.top,D);}
  return best;
}
// where the vehicle is and how it lies: its middle at the base, heading, half sizes, height, and speed along its heading
function drvPose(D){const o=D.o;
  if(D.k==='car')return{x:o.pos.x,y:o.pos.y,z:o.pos.z,h:o.heading,hx:o.hx,hz:o.hz,hy:o.hy||1.4,v:o.speed};
  if(D.k==='tank'||D.k==='heli'){const I=MIL[D.k];return{x:o.x,y:o.y,z:o.z,h:o.h,hx:I.hx,hz:I.hz,hy:I.hy,v:D.k==='tank'?o.sv||0:Math.hypot(o.hv?o.hv.x:0,o.hv?o.hv.z:0)};}
  if(D.k==='boat'){const g=o.g;return{x:g.position.x,y:g.position.y,z:g.position.z,h:g.rotation.y,hx:o.K.W/2,hz:o.L/2,hy:o.K.fb+1.5,v:o.sp||0};}
  if(D.k==='plane'){const g=o.g;return{x:g.position.x,y:g.position.y,z:g.position.z,h:g.rotation.y,hx:1.25,hz:9.9,hy:3.65,v:o.free?o.free.v:0};}
  // a train: the car you got into (laid along the track as updateRailVenue lays it)
  const T=o,C=T.C,hi=T.dir>0?T.s:T.s+TRAIN_LEN,c=hi-5.3-D.ci*10.6,Fa=railPt(C,c+4),Ba=railPt(C,c-4);
  return{x:(Fa.x+Ba.x)/2,y:G+1.2,z:(Fa.z+Ba.z)/2,h:Math.atan2(Fa.x-Ba.x,Fa.z-Ba.z),hx:TRAIN_HX,hz:TRAIN_HZ,hy:TRAIN_H,v:T.v*T.dir};
}
function drvEnter(p,D){
  const o=D.o,jack=jackable(D);o.drv=p;p.drv=D;p.standCar=null;p.vcl=null;p.state='walk';p.vy=0;p.mvx=p.mvz=0;p.biteT=0;p.drvLook=-9;p.drvYaw=undefined;
  if(D.k==='car'){o.hunter=false;o.path=null;o.rt=null;o.hw=null;o.parked=false;o.left=false;o.reverseT=0;o.makeWay=0;o.leaving=false;o.yieldSv=false;o.hazard=false;if(o.hazG)o.hazG.visible=false;}
  else if(D.k==='tank'||D.k==='heli'){o.state='drive';o.sv=0;o.hv={x:0,z:0};o.vy=0;o.cd=0;o.detour=0;wpnInit(o,D.k);o.rkHeld=true;}
  else if(D.k==='boat'){const g=o.g;D.V.lane=null;D.V.x=g.position.x;D.V.z=g.position.z;D.V.yaw=g.rotation.y;o.sp=0;}
  else if(D.k==='plane'){if(!o.free)o.free={v:o.v||0,vy:0};o.g.visible=true;}
  else if(D.k==='train'){o.wait=0;}
  // (the camera starts out behind it)
  p.cam.yaw=drvPose(D).h+Math.PI;p.cam.pitch=-0.25;
  if(jack){jackStart(p,D);return;}   // (someone at the controls: they're thrown out first. See carjack.js)
  const k=drvKey(p),how=D.k==='heli'?'  ·  Jump climbs, Climb drops':D.k==='plane'?'  ·  Speed up, then Jump to take off':D.k==='tank'?'  ·  Bite fires':'';
  flashLabel('Driving the '+drvName(D)+'  ·  '+k+' to get out'+how,p);clang();
}
// out by the side (whichever has room), else the back or the front, else on the roof
function drvExit(p,thrown){
  const D=p.drv;if(!D)return;if(D.jack)jackEnd(p,D,true);p.drv=null;const o=D.o;if(o.drv===p)o.drv=null;if(p.lockT)setLock(p,null);
  const S=drvPose(D);
  if(D.k==='car')o.left=true;   // (left where it stopped: see updateCars)
  else if(D.k==='tank'||D.k==='heli'){if(!o.dead)o.state='idle';o.v=0;o.sv=0;}
  else if(D.k==='train'){if(o.v<0){o.v=0;o.wait=4;}else o.wait=0;}   // (going its own way, it carries on to the next station)   // (a plane's left as it is: it carries on and comes down by itself)
  const tx=Math.sin(S.h),tz=Math.cos(S.h),rx=Math.cos(S.h),rz=-Math.sin(S.h);let spot=null;
  for(const [a,b] of [[-(S.hx+0.9),0],[S.hx+0.9,0],[0,-(S.hz+0.9)],[0,S.hz+0.9]]){const x=S.x+rx*a+tx*b,z=S.z+rz*a+tz*b,y=Math.max(groundAt(x,z,S.y+2.5),S.y);
    if(!solidAt(x,Math.floor(y+0.3),z)&&!solidAt(x,Math.floor(y+1.2),z)){spot={x,y,z};break;}}
  if(!spot)spot={x:S.x,y:S.y+S.hy+0.2,z:S.z};
  p.pos.set(spot.x,spot.y,spot.z);p.vy=thrown?6:0;p.grounded=false;p.peakY=p.pos.y;p.state='walk';p.t=0;p.mvx=p.mvz=0;
  p.heading=p.cam.yaw+Math.PI;p.cam.pitch=camPitch(p.cam.pitch);
  if(thrown)flashLabel('Thrown clear of the wreck',p);
}
// each step, before the goblin's own moves: in or out, and (while you're in) nothing else
function drvTick(p,dt){
  const use=p.in.use&&!p.useHeld;p.useHeld=p.in.use;
  if(p.drv&&p.drv.jack&&p.state!=='dead'){jackTick(p,dt);return true;}   // (still hauling the driver out)
  if(p.drv){if(use||p.state==='dead')drvExit(p);else{drvLock(p,dt);return true;}return false;}
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
  const S=drvPose(D);p.pos.set(S.x,S.y+Math.min(1.2,S.hy*0.5),S.z);p.heading=S.h;
  p.vy=0;p.grounded=true;p.mvx=p.mvz=0;p.standCar=null;p.vcl=null;p.peakY=p.pos.y;p.biteT=0;
}
// a venue holding a vehicle someone's driving stays (however far it's been taken)
const drvHeld=V=>players.some(q=>q.drv&&(q.drv.V===V||V.T&&q.drv.o===V.T));
// locked on from a tank or a helicopter (the lock button): the gun aims at it, wherever you're looking, a little ahead
// of where it's going; the marker sits on it. Anything near the middle of the screen, out to 100 blocks, can be picked
function drvLock(p,dt){
  const D=p.drv,armed=D.k==='tank'||D.k==='heli';
  if(!armed){if(p.lockT)setLock(p,null);return;}
  if(p.in.lockPress){
    if(p.lockT){setLock(p,null);tone('triangle',620,380,0.07,0.035);}
    else{const c=p.camera.position,cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;let best=null,bs=1e9;
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
function drvAim(p,sp){if(p.lockT&&p.drv&&lockAlive(p.lockT))return drvLead(p,sp||40);const c=p.camera.position,cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
  for(let t=p.drvCamD||4;t<160;t+=0.5){const x=c.x+fx*t,y=c.y+fy*t,z=c.z+fz*t;if(y<1||solidAt(x,Math.floor(y),z))return{x,y,z};}
  return{x:c.x+fx*160,y:c.y+fy*160,z:c.z+fz*160};}
// the view from behind the vehicle: turned with the mouse or right stick as usual, and swinging back round behind it a
// moment after you stop looking about, once it's moving
function drvCamera(p){
  const D=p.drv,S=drvPose(D);
  if(p.drvYaw!==undefined&&Math.abs(angDiff(p.drvYaw,p.cam.yaw))>1e-5)p.drvLook=camClock;
  // (not a helicopter, which faces where you look anyway, nor a train, where the way you look is the way it goes)
  if(D.k!=='heli'&&D.k!=='train'&&camClock-(p.drvLook??-9)>1.2&&Math.abs(S.v)>1.5)p.cam.yaw+=angDiff(p.cam.yaw,S.h+Math.PI)*0.035;
  p.drvYaw=p.cam.yaw;
  const cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
  // (a tank or a helicopter: up higher and further back, so you see over it to what you're aiming at)
  const gun=D.k==='tank'||D.k==='heli',tx=S.x,ty=S.y+S.hy+(gun?2.6:0.8),tz=S.z,base=4+Math.max(S.hz,S.hx)*1.4+(gun?2:0);let dist=base;
  for(let t=0.6;t<=base;t+=0.3){if(solidAt(Math.floor(tx-fx*t),Math.floor(ty-fy*t),Math.floor(tz-fz*t))){dist=Math.max(0.8,t-0.5);break;}}
  let cx=tx-fx*dist,cy=ty-fy*dist,cz=tz-fz*dist;const gy=supportAt(cx,cz,cy);if(gy!==null&&cy<gy+0.4)cy=gy+0.4;
  if(fy>0.2&&cy<S.y+S.hy*0.8)cy=S.y+S.hy*0.8;   // (looking up: not from down inside the vehicle)
  p.drvCamD=dist;p.camera.position.set(cx,cy,cz);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);
  if(p.shake>0.002&&gameSpeed()>0){const c=p.camera.position;c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
}
// driving a car: much as a hunting car drives itself (updateCars does the rest: the ground, walls, what it runs into)
function drvCar(c,dt){
  const i=drvIn(c.drv),thr=-i.z,st=-i.x,top=c.veh==='semi'||c.veh==='bus'?17:c.veh==='car'?24:c.veh==='bike'?28:20;
  if(c.grounded||rampUnder(c.pos.x,c.pos.z,c.pos.y+0.5)){
    if(thr>0.1)c.speed+=(c.speed<0?26:10)*thr*dt;else if(thr<-0.1)c.speed-=(c.speed>0?26:8)*-thr*dt;else c.speed*=Math.exp(-dt*0.9);}
  c.speed=Math.max(-8,Math.min(top,c.speed));
  c.steer+=(st-c.steer)*Math.min(1,dt*8);c.heading+=c.steer*dt*Math.max(-1,Math.min(1,c.speed/5))*1.7;
  if(i.bitePress&&c.honkT<=0){horn(0.12);c.honkT=0.4;}   // (bite sounds the horn)
}
// ---- a driven tank's or helicopter's weapons: a load of rounds each, a moment between shots, and once the last is
// gone a reload (a tank's cannon: Bite; a helicopter's machine gun: Bite, held; its rockets: Stomp). o.wpn[k]: {n
// rounds left, cd till the next shot, rl reload time left}
const DRV_WPN={tank:[{k:'shell',name:'Shells',max:4,gap:1.2,reload:5}],
  heli:[{k:'gun',name:'Gun',max:40,gap:0.09,reload:3},{k:'rkt',name:'Rockets',max:4,gap:0.6,reload:6}]};
function wpnInit(o,kind){if(!o.wpn){o.wpn={};for(const W of DRV_WPN[kind]||[])o.wpn[W.k]={n:W.max,cd:0,rl:0,W};}}
function wpnTick(o,dt){for(const k in o.wpn||{}){const s=o.wpn[k];s.cd-=dt;s.ck=(s.ck||0)-dt;if(s.rl>0){s.rl-=dt;if(s.rl<=0){s.rl=0;s.n=s.W.max;if(audio)sfx('Weapon reloaded',()=>tone('square',380,520,0.08,0.03));}}}}
// (pulling the trigger with nothing loaded clicks: once a press, or every quarter second held)
function wpnFire(o,k){const s=o.wpn&&o.wpn[k];if(!s)return false;
  if(s.rl>0||s.n<=0){if(!(s.ck>0)){s.ck=0.25;wpnClick();}return false;}if(s.cd>0)return false;
  s.n--;s.cd=s.W.gap;if(s.n<=0){s.rl=s.W.reload;if(audio)sfx('Magazine empty',()=>tone('square',300,180,0.12,0.03));}return true;}
function wpnClick(){if(audio)sfx('Dry fire click',()=>{tone('square',2400,1500,0.018,0.05);tone('triangle',900,600,0.03,0.04,0.035);});}
// the helicopter's machine gun, one round: down the line to where you're aiming (led onto a locked target), a little
// scattered, to the first goblin, vehicle or wall in the way; a tracer and a puff where it hits
function heliGun(M,p){
  const A=drvAim(p,400),mx=M.x+Math.sin(M.h)*2.4,my=M.y+0.8,mz=M.z+Math.cos(M.h)*2.4;
  let dx=A.x-mx,dy=A.y-my,dz=A.z-mz;const L0=Math.hypot(dx,dy,dz)||1,sc=0.012*L0;
  dx+=(Math.random()-.5)*sc*2;dy+=(Math.random()-.5)*sc*2;dz+=(Math.random()-.5)*sc*2;
  const L=Math.hypot(dx,dy,dz)||1,ux=dx/L,uy=dy/L,uz=dz/L,R=Math.min(130,L0+20);
  // (the nearest goblin within reach of the line)
  let gt=1e9,gg=null;for(const g of goblins){if(g.state!=='chase')continue;const ox=g.pos.x-mx,oy=g.pos.y+0.8-my,oz=g.pos.z-mz,t=ox*ux+oy*uy+oz*uz;if(t<0||t>R||t>=gt)continue;
    const cx=ox-ux*t,cy=oy-uy*t,cz=oz-uz*t;if(cx*cx+cz*cz<0.5&&Math.abs(cy)<1.1){gt=t;gg=g;}}
  let t=0.5,hit='air';_sp.own=M;
  for(;t<Math.min(R,gt);t+=0.5){const x=mx+ux*t,y=my+uy*t,z=mz+uz*t;if(y<1||solidAt(x,Math.floor(y),z)){hit='wall';break;}_sp.pos.set(x,y,z);if(shotHitsVeh(_sp)){hit='veh';break;}}
  if(hit==='air'&&gg&&t>=gt){t=gt;hit='gob';}
  const ex=mx+ux*t,ey=my+uy*t,ez=mz+uz*t;tracer(mx,my,mz,ex,ey,ez);if(audio)sfx('Helicopter gun',()=>noise(0.06,0.1,2400,'highpass'));
  if(hit==='gob')damageGoblin(gg,2,new V3(ex,ey,ez),new V3(ux,0.3,uz),'Gunned down from a helicopter');
  else if(hit==='veh')vehBlast(ex,ey,ez,0.8,4,M);
  if(hit!=='air')puff(ex,ey,ez,1,hit==='wall'?0x9a948a:0xffb040,0.2);
}
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
  const p=M.drv,i=drvIn(p),thr=-i.z,st=-i.x;
  M.sv+=(thr*7-M.sv)*Math.min(1,dt*1.5);
  {const nh=M.h+st*0.9*dt;if(!milBlocked(M,M.x,M.z,nh,M.y)||milBlocked(M,M.x,M.z,M.h,M.y))M.h=nh;}
  const A=drvAim(p,45);M.aim=A;M.tu=angTo(M.tu,Math.atan2(A.x-M.x,A.z-M.z)-M.h,1.4*dt);
  const F=tankShell(M,A);M.pred=shotPath(F,2,4,M,A);
  wpnTick(M,dt);if(i.bitePress&&wpnFire(M,'shell')){const mx=F.x,my=F.y,mz=F.z;
    shot({kind:'shell',x:mx,y:my,z:mz,vx:F.vx,vy:F.vy,vz:F.vz,grav:2,fuse:4,R:4.5,dmg:4,cause:'Blown up by a goblin in a tank',crush:3.2,vd:60,own:M});
    smoke(mx,my,mz,4,0x8a8a80);puff(mx,my,mz,4,0xffc040,0.3);if(audio)sfx('Tank fires',()=>{noise(0.6,0.6,350,'lowpass');tone('sawtooth',70,30,0.5,0.15);});addShake(0.3,M.x,M.z,30);}
  // (anything more than a block up, below the top of the tank, stops it -- what's overhead it passes under; leaning on
  // it a moment, or hitting it at speed, it smashes through)
  if(Math.abs(M.sv)>0.05){const d=M.sv<0?-1:1,fx=Math.sin(M.h)*d,fz=Math.cos(M.h)*d,ax=M.x+fx*3,az=M.z+fz*3;
    if(groundAt(ax,az,M.y+1.1)-M.y>1.05||groundAt(ax-fz*1.2,az+fx*1.2,M.y+1.1)-M.y>1.05||groundAt(ax+fz*1.2,az-fx*1.2,M.y+1.1)-M.y>1.05){const fast=Math.abs(M.sv)>2.2;M.sv*=fast?0.8:0.5;M.stuck+=dt;
      if(M.stuck>0.5||fast){M.stuck=0;tankRam(M,d,fast?1.8:1.1);clang();if(fast)addShake(0.5,ax,az,25);}}   // (rammed at speed, it's straight through)
    else{const nx=M.x+Math.sin(M.h)*M.sv*dt,nz=M.z+Math.cos(M.h)*M.sv*dt;
      if(milBlocked(M,nx,nz,M.h,M.y)&&!milBlocked(M,M.x,M.z,M.h,M.y))M.sv=0;else{M.stuck=0;M.x=nx;M.z=nz;}}}
  M.v=Math.max(0,M.sv);
  {const gy=groundAt(M.x,M.z,M.y+1.5);if(gy<M.y){M.vy-=20*dt;M.y=Math.max(gy,M.y+M.vy*dt);}else{M.vy=0;M.y+=(gy-M.y)*Math.min(1,dt*8);}}
  milPlace(M);milBoxes(M,M.v);milShove(M);
}
// flying a helicopter: it goes the way you push, relative to where you look, and turns to face that way; jump climbs,
// climb (or dash) drops; bite fires a rocket where you're looking
function drvHeli(M,dt){
  const p=M.drv,i=drvIn(p);M.spin+=(1-M.spin)*Math.min(1,dt*0.8);
  const yaw=p.cam.yaw+Math.PI,fx=Math.sin(yaw),fz=Math.cos(yaw),f=-i.z,r=i.x;
  let wx=fx*f-Math.cos(yaw)*r,wz=fz*f+Math.sin(yaw)*r;const wm=Math.hypot(wx,wz);if(wm>1){wx/=wm;wz/=wm;}
  const up=(i.jump?1:0)-(i.climb||i.charge?1:0),lift=M.spin>0.8,k=Math.min(1,dt*1.5);
  M.hv.x+=((lift?wx*16:0)-M.hv.x)*k;M.hv.z+=((lift?wz*16:0)-M.hv.z)*k;M.vy+=((lift?up*8:Math.min(0,up)*8)-M.vy)*Math.min(1,dt*2);
  const gy=groundAt(M.x,M.z,M.y+1),flying=M.y>gy+0.05;
  if(!flying&&M.vy<=0){M.hv.x*=Math.exp(-dt*4);M.hv.z*=Math.exp(-dt*4);}   // (sat on the ground it doesn't slide about)
  {const nx=M.x+M.hv.x*dt,nz=M.z+M.hv.z*dt,clear=y=>!solidAt(nx,Math.floor(y),nz)&&!solidAt(nx+Math.sin(M.h)*2.6,Math.floor(y),nz+Math.cos(M.h)*2.6);
   if(clear(M.y+0.4)&&clear(M.y+1.6)&&clear(M.y+2.6)&&(!milBlocked(M,nx,nz,M.h,M.y)||milBlocked(M,M.x,M.z,M.h,M.y))){M.x=nx;M.z=nz;}
   else if(Math.hypot(M.hv.x,M.hv.z)>9){airCrash(M.x+Math.sin(M.h)*2.6,M.y+1.2,M.z+Math.cos(M.h)*2.6,4,'Killed when a helicopter crashed');milHit(M,MIL.heli.hp*99);return;}   // (into something at speed: it goes up)
   else{M.hv.x*=-0.3;M.hv.z*=-0.3;}}
  {let ny=M.y+M.vy*dt;const g2=groundAt(M.x,M.z,M.y+1);if(ny<g2){ny=g2;M.vy=0;}if(M.vy>0&&solidAt(M.x,Math.floor(ny+3),M.z)){ny=M.y;M.vy=0;}M.y=Math.min(ny,H+60);}
  M.h=angTo(M.h,yaw,1.6*dt);
  const sp=Math.hypot(M.hv.x,M.hv.z),va=Math.atan2(M.hv.x,M.hv.z)-M.h;M.pitch=Math.min(0.25,sp*0.02)*Math.cos(va);M.roll=-Math.min(0.25,sp*0.02)*Math.sin(va);
  M.rot.rotation.y+=dt*M.spin*28;M.trot.rotation.x+=dt*M.spin*40;
  {const A=drvAim(p,36),mx=M.x+Math.sin(M.h)*2.6,my=M.y+1.2,mz=M.z+Math.cos(M.h)*2.6,L=Math.hypot(A.x-mx,A.y-my,A.z-mz)||1,sp2=36;
   M.rk={x:mx,y:my,z:mz,vx:(A.x-mx)/L*sp2,vy:(A.y-my)/L*sp2,vz:(A.z-mz)/L*sp2};M.pred=lift?shotPath(M.rk,0.5,5,M,A):null;}
  wpnTick(M,dt);if(lift&&i.bite&&wpnFire(M,'gun'))heliGun(M,p);
  const rp=i.stomp&&!M.rkHeld;M.rkHeld=i.stomp;if(rp&&lift&&wpnFire(M,'rkt')){const F=M.rk;
    shot({kind:'rocket',x:F.x,y:F.y,z:F.z,vx:F.vx,vy:F.vy,vz:F.vz,grav:0.5,fuse:5,R:4.2,dmg:4,cause:'Blown up by a goblin in a helicopter',crush:2.8,vd:45,own:M});if(audio)sfx('Helicopter rocket',()=>noise(0.5,0.25,900,'bandpass'));}
  milPlace(M);milBoxes(M,Math.hypot(M.hv.x,M.hv.z));milShove(M);
  if(M.spin>0.3&&audio&&playing){M.thT=(M.thT||0)-dt;if(M.thT<=0){M.thT=0.11;sfx('Helicopter rotor',()=>noise(0.08,0.05*M.spin,180,'lowpass'));}}
}
// steering a boat: only where there's open water ahead of it (run it aground and it stops; hard, and it's holed a bit);
// the bigger it is, the slower it answers. Returns its speed
function drvBoat(V,dt){
  const bo=V.bo,g=V.boat,K=bo.K,i=bo.drv.in,thr=-i.z,st=-i.x,top=Math.max(6,K.sp*1.6);
  bo.sp=(bo.sp||0)+((thr>0.1?top*thr:thr<-0.1?-top*0.35*-thr:0)-(bo.sp||0))*Math.min(1,dt*(0.3+3/bo.L));
  g.rotation.y+=st*dt*Math.min(1.2,10/bo.L+0.15)*Math.max(-1,Math.min(1,bo.sp/3));
  const h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),d=bo.sp<0?-1:1,nx=g.position.x+tx*bo.sp*dt,nz=g.position.z+tz*bo.sp*dt;
  const wet=(x,z)=>get(x,G,z)===WATER&&!solidAt(x,G+1,z),fx=nx+tx*bo.L/2*d,fz=nz+tz*bo.L/2*d,w=K.W/2;
  if(wet(fx,fz)&&wet(fx+tz*w,fz-tx*w)&&wet(fx-tz*w,fz+tx*w)&&!(vehIn(nx,nz,h,w,bo.L/2,g.position.y-1,g.position.y+K.fb+1,bo)&&!vehIn(g.position.x,g.position.z,h,w,bo.L/2,g.position.y-1,g.position.y+K.fb+1,bo))){g.position.x=nx;g.position.z=nz;}
  else{if(Math.abs(bo.sp)>4){boatHit(bo,Math.abs(bo.sp)*0.5);thud(0.4);}bo.sp*=-0.2;}
  V.x=g.position.x;V.z=g.position.z;V.yaw=g.rotation.y;
  bo.hornT=(bo.hornT||0)-dt;if(i.bitePress&&bo.hornT<=0){horn(0.1);bo.hornT=0.5;}
  return Math.abs(bo.sp);
}
// is there another vehicle in a box at x,z (facing h, half-width hx, half-length hz, from y0 up to y1)? A car, a tank or
// helicopter, or a piece of a train, boat, plane or ride; not self's own
function vehIn(x,z,h,hx,hz,y0,y1,self){const R=Math.hypot(hx,hz);   // (returns what it met)
  for(const c of cars){if(!c.alive||c===self||Math.hypot(c.pos.x-x,c.pos.z-z)>R+c.hz||c.pos.y>=y1||c.pos.y+(c.hy||1.4)<=y0)continue;if(boxesTouch(x,z,h,hx,hz,c.pos.x,c.pos.z,c.heading,c.hx,c.hz))return c;}
  for(const V of venues.values()){if(V.kind!=='army')continue;for(const o of V.mil){if(o===self||o.dead||Math.hypot(o.x-x,o.z-z)>R+7)continue;const ox=Math.sin(o.h),oz=Math.cos(o.h);
    for(const b of MIL_PARTS[o.kind]){if(o.y+b.y0>=y1||o.y+b.y1<=y0)continue;if(boxesTouch(x,z,h,hx,hz,o.x+ox*b.c,o.z+oz*b.c,o.h,b.hx,b.hz))return o;}}}
  for(const B of TRAIN_BOXES){const pr=B.proxy;if(B.soft||!pr.alive||(pr.T||pr)===self||pr.T&&pr.T.isMil||B.y0>=y1||B.top<=y0||B.y0>=B.top)continue;const bx=B.hx||TRAIN_HX,bz=B.hz||TRAIN_HZ;
    if(Math.hypot(B.x-x,B.z-z)>R+Math.hypot(bx,bz))continue;if(boxesTouch(x,z,h,hx,hz,B.x,B.z,Math.atan2(B.tx,B.tz),bx,bz))return pr;}
  return null;}
// a vehicle run into by another (vehIn's answer), hurt by n
function vehHurt(o,n){if(o.isMil)milHit(o,n);else damageCar(o,n,undefined,'acc');}
// flying a plane: speed up along the ground, and past PLANE_LIFT it'll climb when you hold jump (climb, or dash, to go
// down); slower than that in the air, it sinks. Into the side of anything at speed, or down too hard, and it's wrecked.
// Left with nobody at the controls it glides down by itself
const PLANE_LIFT=34;
function drvPlane(pl,dt){
  const F=pl.free,g=pl.g,P=g.position,p=pl.drv,i=p?p.in:null;
  const thr=i?-i.z:0,st=i?-i.x:0,up=i?(i.jump?1:0)-(i.climb||i.charge?1:0):0;
  // (the sea's surface counts as ground; so does sea level, out where nothing's been built yet)
  const wetAt=(x,z)=>!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS)))||get(x,G,z)===WATER?G+1:0,gnd=(x,z,y)=>Math.max(groundAt(x,z,y),wetAt(x,z));
  const air=P.y>gnd(P.x,P.z,P.y+1)+0.05;
  if(!air&&F.vy<-0.5&&(F.vy<-14||!p&&F.v>20)){planeCrash(pl,P.x,P.y,P.z,true);return;}   // (touched down too hard, or with nobody flying it)
  if(thr>0.1)F.v+=14*thr*dt;else if(thr<-0.1)F.v-=(air?8:22)*-thr*dt;else if(!air)F.v-=3*dt;
  F.v=Math.max(0,Math.min(80,F.v));
  g.rotation.y+=st*dt*(air?0.6:Math.min(0.9,0.25+F.v*0.05));
  const want=!p?(air?-5:0):F.v>=PLANE_LIFT?up*F.v*0.3:air?-12:0;
  F.vy+=(want-F.vy)*Math.min(1,dt*1.5);if(!air&&F.vy<0)F.vy=0;
  const h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),nx=P.x+tx*F.v*dt,nz=P.z+tz*F.v*dt,ny=P.y+F.vy*dt;
  // something in the way: a fence or a car's height, on the ground, it ploughs through (and takes some damage); anything
  // bigger, at any speed, wrecks it; at a crawl it just stops
  const ax=nx+tx*9.5,az=nz+tz*9.5,over=gnd(ax,az,ny+3.5)-ny;
  const hitV=vehIn(nx,nz,h,1.25,9.9,ny,ny+3.65,pl);
  if(hitV&&!vehIn(P.x,P.z,h,1.25,9.9,P.y,P.y+3.65,pl)){if(F.v>12){vehHurt(hitV,F.v*3);planeCrash(pl,ax,ny+2,az,!air);return;}if(F.v>3)vehHurt(hitV,F.v);F.v=0;}   // (another vehicle in the way)
  else if(over>(air?0.6:1.05)){   // (taxiing, it rolls up a one-block step)
    if(!air&&over<=2.6&&F.v>0.5){crushBall(ax,ny+1,az,1.8);F.v*=0.6;planeHit(pl,15);if(pl.dead)return;}
    else if(F.v>12){planeCrash(pl,ax,ny+2,az,!air);return;}
    else F.v=0;}
  else{P.x=nx;P.z=nz;}
  const g2=gnd(P.x,P.z,ny+1.5);
  if(ny<=g2){if(air&&(F.vy<-14||!p&&F.v>20)){P.y=g2;planeCrash(pl,P.x,P.y,P.z,true);return;}P.y=g2;F.vy=0;}else P.y=Math.min(ny,H+80);
  g.rotation.set(-Math.max(-0.3,Math.min(0.3,Math.atan2(F.vy,Math.max(8,F.v)))),h,air&&p?-st*0.35:0,'YXZ');
  pl.v=F.v;g.visible=true;
}
// driving a train: forward is whichever way along the track you're looking; it stops at the ends of the line
function drvTrain(T,dt){
  const p=T.drv,i=p.in,C=T.C,P=railPt(C,T.s),look=-Math.sin(p.cam.yaw)*P.tx-Math.cos(p.cam.yaw)*P.tz>=0?1:-1,thr=-i.z;
  let v=T.v*T.dir;
  if(Math.abs(thr)>0.1){const want=thr*look;v+=want*(v*want<0?18:5)*Math.abs(thr)*dt;}else v*=Math.exp(-dt*0.15);
  v=Math.max(-30,Math.min(30,v));
  const lo=T.dir>0?TRAIN_LEN+1:1,hi=T.dir>0?C.L-2:C.L-2-TRAIN_LEN;T.s+=v*dt;
  if(T.s<lo){T.s=lo;v=0;}if(T.s>hi){T.s=hi;v=0;}
  T.v=v*T.dir;
  T.hornT=(T.hornT||0)-dt;if(i.bitePress&&T.hornT<=0){T.hornT=0.6;sfx('Train horn',()=>{tone('sawtooth',311,300,0.6,0.07);tone('sawtooth',370,360,0.6,0.06);});}
}
