// ---- two players in one vehicle: the gunner's seat. A technical's machine gun, a four-wheeler's rifleman's place, a
// tank's turret and a helicopter's gun and rockets each have a seat of their own, so with one player at the wheel
// another can climb aboard (the use button by it) and work the guns, aiming where they look, while the first drives.
// On your own, the weapon button moves you between the two seats (a parked technical's gun, say). The vehicle's .gnr
// is who's on its gun; their p.drv is the vehicle as for a driver, with seat 'gun' ----
DRV_WPN.technical=[{k:'gun',name:'Machine gun',max:50,gap:0.1,reload:3}];
DRV_WPN.quad=[{k:'gun',name:'Rifle',max:6,gap:0.4,reload:2}];
// does it have a gunner's seat?
const gunSeat=D=>D.k==='tank'||D.k==='heli'||D.k==='car'&&(D.o.veh==='technical'||D.o.veh==='quad');
// which set of weapons (DRV_WPN) it carries
const drvGunK=D=>D.k==='car'?D.o.veh:D.k;
// are p's the hands on the guns? (the gunner's, or the driver's of a tank or helicopter with nobody on its gun)
function drvArmed(p){const D=p.drv;if(!D)return false;if(D.seat==='gun')return true;return(D.k==='tank'||D.k==='heli')&&!D.o.gnr;}
// is the other seat free to move to?
function drvSwapTo(p){const D=p.drv;if(!D||D.jack||D.netS||!gunSeat(D))return false;const o=D.o;
  if(D.seat==='gun')return!o.drv&&!jackable({k:D.k,o});
  return!o.gnr&&!(o.crew&&o.crew.gun);}
// over to the other seat: off the gun to the wheel, or from the wheel to the gun (leaving it as if you'd got out)
function drvSwap(p){const D=p.drv,o=D.o;
  if(D.seat==='gun'){if(o.gnr===p)o.gnr=null;D.seat=undefined;drvTake(p,D);if(p.gb)rideReset(p.gb);}
  else{drvLetGo(p,D);D.seat='gun';o.gnr=p;}
  if(gunSeat(D))wpnInit(o,drvGunK(D));
  drvSays(p,D);if(audio)tone('square',300,420,0.06,0.04);
}
// a player on a technical's or four-wheeler's gun (from updateCars, whoever's driving): the gun swings round to where
// they look, and bite fires it (held, the machine gun; pressed, the rifle)
function gnrCar(c,dt){
  const p=c.gnr,V=c.vehG[c.veh];if(!p||!V||!V.gun||c.veh!=='technical'&&c.veh!=='quad')return;
  const i=drvIn(p),tech=c.veh==='technical',h=c.heading,P=crewAt(c.pos.x,c.pos.z,h,0,(tech?-1.3:-0.55)*ES),py=c.pos.y+(tech?2.05:1.45)*ES;
  const A=drvAim(p,400);c.gunYaw=angTo(c.gunYaw||0,angDiff(h,Math.atan2(A.x-P.x,A.z-P.z)),CREW_GUN[c.veh].turn*1.6*dt);V.gun.rotation.y=c.gunYaw;
  wpnInit(c,c.veh);wpnTick(c,dt);
  const a=h+c.gunYaw,L=(tech?1.3:0.8)*ES;
  if((tech?i.bite:i.bitePress)&&wpnFire(c,'gun')){const mx=P.x+Math.sin(a)*L,mz=P.z+Math.cos(a)*L;
    gunRound(c,p,mx,py,mz,tech?2:3,tech?0.014:0.004,CREW_GUN[c.veh].cause,tech?'Technical machine gun':'Four-wheeler rifle');puff(mx,py,mz,1,0xffe070,0.1);}
}
// the gunner, as everyone sees them: stood in a technical's bed behind its gun, or sat behind the rider on a
// four-wheeler, turned the way the gun points
function gunPose(p,c){const K=gobKit(p),R=K.root,tech=c.veh==='technical',a=c.heading+(c.gunYaw||0);
  R.rotation.set(c.g.rotation.x,a,c.g.rotation.z);
  if(tech){const M=crewAt(c.pos.x,c.pos.z,c.heading,0,-1.3*ES);R.position.set(M.x-Math.sin(a)*0.55*ES,c.pos.y+1.1*ES,M.z-Math.cos(a)*0.55*ES);
    for(const L of K.m.legs)L.rotation.set(0,0,0);K.m.arm.rotation.set(-1.4,0,0.15);if(K.m.armL)K.m.armL.rotation.set(-1.4,0,-0.15);return;}
  const S=crewAt(c.pos.x,c.pos.z,c.heading,0,-0.8*ES);R.position.set(S.x,c.pos.y+0.42*ES,S.z);
  for(const L of K.m.legs)L.rotation.set(-1.25,0,0);K.m.legs[0].rotation.z=0.25;K.m.legs[1].rotation.z=-0.25;
  K.m.arm.rotation.set(-1.45,0,0.1);if(K.m.armL)K.m.armL.rotation.set(-1.45,0,-0.1);
}
