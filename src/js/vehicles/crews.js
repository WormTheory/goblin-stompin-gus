// ---- crews: the militia's armed pickups ('technicals') and four-wheelers, and the bases' tanks and helicopters, all
// stand empty until their camp is set off. Then goblins of the camp's own kind run out to them and climb aboard (a
// driver and a gunner each on the militia's, one soldier in a tank or a helicopter), and only once they're in does
// anything start up. Kill one on the way and that vehicle waits for the next to come out ----
// the militia's vehicles: where they're parked in the compound (site coordinates, and the way they face: the cab
// toward the HQ end), what they're made of, and the gun each one's gunner works
const CREW_SPOTS=[{t:'technical',u:42.5,v:29.5,h:-Math.PI/2},{t:'technical',u:50.5,v:29.5,h:-Math.PI/2},{t:'quad',u:40.5,v:34.5,h:-Math.PI/2},{t:'quad',u:45.5,v:34.5,h:-Math.PI/2}];
const CREW_HP={technical:45,quad:24},CREW_NAME={technical:'Technical',quad:'Four-wheeler'};
// turn: how fast the gun swings round (a second); range; burst: rounds a burst, bt: seconds between them; cd: the pause
// after one; hit: the chance a round finds him, close in (falling off with range)
const CREW_GUN={technical:{turn:2.2,range:60,burst:5,bt:0.09,cd:[1.8,2.8],hit:0.25,dmg:1,cause:'Gunned down from a technical'},
  quad:{turn:4,range:45,burst:1,bt:0,cd:[1.8,2.8],hit:0.6,dmg:1,cause:'Shot from a four-wheeler'}};
// the vehicles come out of a pool of their own (never traffic), olive drab
const CREWCARS=[];
function crewCar(){let c=CREWCARS.find(o=>!o.alive);
  if(!c&&CREWCARS.length<12){c=makeCar(cars.length);c.g.scale.setScalar(ES);c.crewPool=true;c.respawnT=1e9;c.color=0x4a5a2a;c.paint.color.setHex(c.color);cars.push(c);CREWCARS.push(c);}
  return c||null;}
// one put down at x,z, empty, as the given kind (k: who crews it)
function crewPut(c,t,x,z,h,key,k){
  setVeh(c,t);c.paint.color.setHex(c.color);c.rusted=false;c.spot=key;c.pos.set(x,groundAt(x,z,G+6),z);c.heading=h;c.speed=0;c.kv.set(0,0,0);c.hp=CREW_HP[t];c.alive=true;c.hunter=false;c.parked=true;c.vy=0;c.driver=null;
  c.rt=null;c.hw=null;c.path=null;c.svc=null;c.leaving=false;c.left=false;c.makeWay=0;c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.reverseT=0;c.stuckT=0;c.hurt=0;c.steer=0;c.paint.emissive.setHex(0);c.wpn=null;c.gunYaw=0;
  c.g.visible=true;c.g.position.copy(c.pos);c.g.rotation.set(0,h,0);
  c.crew={k,drv:null,gun:null,go:false,run:{},yaw:0,cd:1,burst:0,bt:0,side:Math.random()<0.5?1:-1};crewShow(c);
}
// who's showing aboard: the driver's head (and on a four-wheeler, the rest of him), the gunner at his gun
function crewShow(c){const C=c.crew,V=c.vehG[c.veh];if(!C||!V)return;
  if(!c.drv)c.dh.visible=!!C.drv;if(V.gunner)V.gunner.visible=!!C.gun;}
// a point beside a vehicle, in the world: a across (to its right), c along (forward), from its middle
function crewAt(x,z,h,a,c){return{x:x+Math.cos(h)*a+Math.sin(h)*c,z:z-Math.sin(h)*a+Math.cos(h)*c};}
// where a goblin running for a seat heads: the driver's door, the tailgate (a technical's gunner), behind the seat (a
// four-wheeler's), a tank's or helicopter's side
function crewDoor(o,seat){
  if(o.isMil){const I=MIL[o.kind];return crewAt(o.x,o.z,o.h,I.hx+0.9,0);}
  const V=VEH[o.veh];
  if(seat==='drv')return crewAt(o.pos.x,o.pos.z,o.heading,(V.hx+0.8)*ES*(V.head[0]<0?-1:1),V.head[2]*ES);
  return o.veh==='technical'?crewAt(o.pos.x,o.pos.z,o.heading,0,-(V.hz+0.7)*ES):crewAt(o.pos.x,o.pos.z,o.heading,-(V.hx+0.8)*ES,-0.5*ES);
}
// is the seat it's running for still there to fill?
function crewWanted(m){const o=m.o;if(m.home)return true;
  if(o.isMil)return!o.dead&&!o.crew&&!o.drv&&o.state==='man';
  return o.alive&&!!o.crew&&!o.crew[m.seat]&&!o.drv&&!o.gnr;}
// one of the camp's kind (k), out of the pools at x,z, running for o's seat
function crewSend(k,x,z,o,seat){
  if(k==='soldier')jackKinds();const g=freeFoe(k,24);if(!g)return null;
  foeSpawn(g,k,null,0);g.pos.set(x,groundAt(x,z,G+6),z);g.mount={o,seat};g.mt=0;
  const at=o.isMil?{x:o.x,z:o.z}:o.pos;g.heading=Math.atan2(at.x-x,at.z-z);g.root.position.copy(g.pos);
  if(k==='soldier')g.id.occ=o.kind==='heli'?'Helicopter pilot':pick(['Tank crewman','Tank commander','Tank driver']);
  else g.id.occ=seat==='drv'?'Militia driver':o.veh==='technical'?'Machine gunner':'Rifleman';
  return g;
}
// running for it (from updateGoblins, in place of its usual round): flat out, straight there, stepping up a block at
// a time; boxed in by something taller, it works along it. True while it's moving
function crewRun(g,dt){
  const m=g.mount;if(!crewWanted(m)){g.mount=null;return false;}
  g.aim=0;if(g.orb)g.orb.visible=false;
  const at=m.home||crewDoor(m.o,m.seat),dx=at.x-g.pos.x,dz=at.z-g.pos.z,dd=Math.hypot(dx,dz);
  const o=m.o,ox=o?(o.isMil?o.x:o.pos.x):0,oz=o?(o.isMil?o.z:o.pos.z):0,R=o?(o.isMil?Math.max(MIL[o.kind].hx,MIL[o.kind].hz):Math.max(o.hx,o.hz))+1.4:0;
  g.mt=(g.mt||0)+dt;
  // (there: in it goes. Or it's been at it so long it must be stuck: it's let in all the same)
  if(dd<1.4||o&&!m.home&&Math.hypot(ox-g.pos.x,oz-g.pos.z)<R||g.mt>20){crewBoard(g);return false;}
  if(g.stun>0||!playing||g.vy!==0)return false;
  const sp=Math.min(dd,(g.spd||3)*1.7*dt),ux=dx/dd,uz=dz/dd;
  let mx=ux,mz=uz;
  if(gobGround(g.pos.x+ux*0.45,g.pos.z+uz*0.45,g.pos.y)-g.pos.y>1.05){
    // (in the way: along it, whichever side it picked, till it's past)
    const s=g.slot&1?1:-1;mx=-uz*s;mz=ux*s;
    if(gobGround(g.pos.x+mx*0.45,g.pos.z+mz*0.45,g.pos.y)-g.pos.y>1.05){mx=-mx;mz=-mz;g.slot=(g.slot|0)+1;}
    if(gobGround(g.pos.x+mx*0.45,g.pos.z+mz*0.45,g.pos.y)-g.pos.y>1.05)return false;}
  g.pos.x+=mx*sp;g.pos.z+=mz*sp;g.heading=Math.atan2(mx,mz);g.phase+=dt*11;
  g.arm.rotation.x=-0.9;g.armL.rotation.x=-0.4;
  return true;
}
// aboard (out of sight from here on: the vehicle shows them), or, sent home, gone back inside
function crewBoard(g){
  const m=g.mount;g.mount=null;g.mt=0;
  if(m&&!m.home&&crewWanted(m)){const o=m.o;
    if(o.isMil)o.crew=g.id;else{o.crew[m.seat]=g.id;o.left=false;crewShow(o);}
    if(audio){const n=nearestPlayer(g.pos.x,g.pos.z);if(n&&n.d<40)sfx('Crew climbs aboard',()=>{tone('square',150,90,0.08,0.05*(1-n.d/40));});}}
  g.state='wait';g.t=0;g.root.visible=false;g.homeV=null;
}
// a crewed militia vehicle's round (from updateCars, when nobody's driving it): with the camp set off, round him at
// the distance its gunner works best from, firing; otherwise, or with no driver, it sits
function crewDrive(c,dt){
  const C=c.crew;crewGun(c,dt);
  const n=playing&&C.drv&&C.go&&!calmNow()?nearestPlayer(c.pos.x,c.pos.z,true):null;
  if(!n){c.steer*=Math.exp(-dt*6);if(c.grounded)c.speed*=Math.exp(-dt*(C.drv?2:4));return;}
  const p=n.p,R=(c.veh==='quad'?9:15)*(C.rk||(C.rk=0.8+Math.random()*0.5)),top=c.veh==='quad'?13:11;   // (each its own distance, so two don't share a line)
  // (aiming for a point on that circle a little round from where it is, so it keeps going round him)
  const a=Math.atan2(c.pos.z-p.pos.z,c.pos.x-p.pos.x)+C.side*0.7,tx=p.pos.x+Math.cos(a)*R,tz=p.pos.z+Math.sin(a)*R;
  const diff=angDiff(c.heading,Math.atan2(tx-c.pos.x,tz-c.pos.z));let thr,st;
  if(c.reverseT>0){c.reverseT-=dt;thr=-1;st=-Math.sign(diff);}
  else{st=Math.max(-1,Math.min(1,diff*2));thr=Math.abs(diff)<1.3?1:0.4;
    // (another vehicle just ahead: steer off it and ease up, rather than run into it)
    const fx=Math.sin(c.heading),fz=Math.cos(c.heading);
    for(const o of cars){if(o===c||!o.alive)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z,al=ox*fx+oz*fz,ac=ox*fz-oz*fx;
      if(al>0&&al<c.hz+o.hz+5&&Math.abs(ac)<c.hx+o.hx+1.5){st=ac>0?-1:1;thr=Math.min(thr,0.3);break;}}
    if(Math.abs(c.speed)<1){c.stuckT+=dt;if(c.stuckT>1.5){c.reverseT=1;c.stuckT=0;C.side=-C.side;}}else c.stuckT=0;}
  const want=thr>0?top*thr:-5;
  if(c.grounded){if(want>c.speed)c.speed=Math.min(want,c.speed+(c.speed<0?24:9)*dt);else c.speed=Math.max(want,c.speed-14*dt);}
  c.steer+=(st-c.steer)*Math.min(1,dt*8);
  c.heading+=c.steer*dt*Math.max(-1,Math.min(1,c.speed/5))*1.9;
}
// the gunner: the gun swings on to him, and when it's on him and he's in sight, a burst (a technical's machine gun) or
// a shot (the rifle of the one riding behind on a four-wheeler)
function crewGun(c,dt){
  const C=c.crew,F=CREW_GUN[c.veh],V=c.vehG[c.veh];if(!C||!F||!C.gun)return;
  const n=playing&&C.go&&!calmNow()?nearestPlayer(c.pos.x,c.pos.z,true):null;
  const h=c.heading,P=c.veh==='technical'?crewAt(c.pos.x,c.pos.z,h,0,-1.3*ES):crewAt(c.pos.x,c.pos.z,h,0,-0.55*ES),py=c.pos.y+(c.veh==='technical'?2.05:1.45)*ES;
  let want=0;if(n)want=angDiff(h,Math.atan2(n.p.pos.x-P.x,n.p.pos.z-P.z));
  C.yaw=angTo(C.yaw,want,F.turn*dt);if(V.gun)V.gun.rotation.y=C.yaw;
  C.cd-=dt;if(!n)return;
  const p=n.p,a=h+C.yaw,fx=Math.sin(a),fz=Math.cos(a),mx=P.x+fx*(c.veh==='technical'?1.3:0.8)*ES,mz=P.z+fz*(c.veh==='technical'?1.3:0.8)*ES,d=Math.hypot(p.pos.x-mx,p.pos.z-mz);
  if(C.burst<=0){if(C.cd>0)return;
    if(d>F.range||Math.abs(angDiff(C.yaw,want))>0.12||!lineClear(mx,py,mz,p.pos.x,p.pos.y+1.2,p.pos.z)){C.cd=0.3;return;}
    C.burst=F.burst;C.bt=0;}
  C.bt-=dt;if(C.bt>0)return;C.bt=F.bt;C.burst--;
  if(C.burst<=0)C.cd=F.cd[0]+Math.random()*(F.cd[1]-F.cd[0]);
  const hit=!(p.dodge&&p.dodge.t<p.dodge.dur*0.85)&&Math.random()<F.hit*Math.max(0.35,1-d/F.range);
  let tx=p.pos.x,ty=p.pos.y+1.2,tz=p.pos.z;
  if(!hit){const r=Math.random()*6.283,e=1.5+Math.random()*2;tx+=Math.cos(r)*e;tz+=Math.sin(r)*e;ty+=(Math.random()-0.4)*1.5;}
  tracer(mx,py,mz,tx,ty,tz);puff(mx,py,mz,1,0xffe070,0.1);if(!hit)puff(tx,ty,tz,1,0x9a948a,0.2);
  if(audio){if(c.veh==='technical')sfx('Technical machine gun',()=>{noise(0.07,0.13,2000,'highpass');tone('square',140,70,0.05,0.04);});else{noise(0.09,0.14,2600,'highpass');tone('square',220,90,0.06,0.04);}}
  if(hit){const L=Math.hypot(tx-mx,tz-mz)||1;damagePlayer(p,F.dmg,new V3(tx,ty,tz),new V3((tx-mx)/L,0.2,(tz-mz)/L),F.cause,C.gun);}
}
// blown up with them aboard: the crew's bodies are thrown out of the wreck
function crewWreck(c,p){const C=c.crew;if(!C)return;
  for(const s of ['drv','gun'])if(C[s]){const o=crewAt(p.x,p.z,c.heading,(s==='drv'?1.4:-1.4),s==='drv'?0.6:-1.2);crewCorpse(C.k,C[s],o.x,p.y+0.6,o.z,'Killed when their '+CREW_NAME[c.veh].toLowerCase()+' blew up');}
  C.drv=C.gun=null;}
function crewCorpse(k,id,x,y,z,cause){
  if(k==='soldier')jackKinds();const g=freeFoe(k,24);if(!g)return;foeSpawn(g,k,null,0);g.pos.set(x,y,z);g.root.position.copy(g.pos);if(id)g.id=id;
  damageGoblin(g,99,new V3(x,y+1,z),new V3(Math.random()-0.5,1,Math.random()-0.5),cause);}
// the gunner of one you've carjacked jumps off and comes at you
function crewBail(c){const C=c.crew;if(!C)return;
  if(C.gun){const g=freeFoe(C.k,24);if(g){foeSpawn(g,C.k,null,0);const o=crewAt(c.pos.x,c.pos.z,c.heading,-1.8,-1.5);g.pos.set(o.x,groundAt(o.x,o.z,c.pos.y+3),o.z);g.id=C.gun;g.root.position.copy(g.pos);}}
  C.drv=C.gun=null;C.go=false;crewShow(c);}
// ---- the militia compound's vehicles (from updateSiteVenue): put out while you're near enough to see the place;
// once it's been set off, its people run out to every empty seat (one at a time for each seat), and the crewed ones go.
// A wrecked one's gone until the compound's had its two quiet minutes, like its people ----
function crewSite(V,me,dmin,dt){
  for(let i=0;i<V.vspots.length;i++){let c=V.vcar[i];const S=V.vspots[i],key=V.key+':v'+i;
    if(c&&(!c.alive||c.spot!==key)){if(!c.alive)V.vgone[i]=true;V.vcar[i]=c=null;}
    if(!c&&!V.vgone[i]&&me&&playing&&dmin<90){
      // (its spot clear: nothing parked or driven on to it)
      if(cars.some(o=>o.alive&&Math.hypot(o.pos.x-S.x,o.pos.z-S.z)<4))continue;
      c=crewCar();if(!c)continue;crewPut(c,S.t,S.x,S.z,S.h,key,'militia');V.vcar[i]=c;}
    if(!c)continue;const C=c.crew;if(!C)continue;
    C.go=V.roused&&!calmNow();
    if(!C.go||c.drv||c.gnr)continue;
    for(const s of ['drv','gun']){if(C[s])continue;const r=C.run[s];
      if(r&&r.state==='chase'&&r.mount&&r.mount.o===c)continue;   // (one's on the way)
      C.run[s]=null;const w=C.wait||(C.wait={});w[s]=(w[s]||0)-dt;if(w[s]>0)continue;w[s]=1.2;   // (and the next only a moment after one's fallen)
      const x=V.X0+40+Math.random()*12,z=V.Z0+22+Math.random()*2;C.run[s]=crewSend('militia',x,z,c,s);}}
}
function crewDrop(V){for(const c of V.vcar)if(c&&c.alive&&!c.drv&&!c.gnr&&c.spot&&c.spot.startsWith(V.key+':')){c.alive=false;c.g.visible=false;c.spot=null;c.crew=null;}
  for(const c of V.vcar)if(c&&(c.drv||c.gnr))c.spot=null;}   // (being driven: it stays, and goes once it's left far behind)
// ---- the bases' armour (from updateArmy) ----
// a tank or helicopter chosen to go out: if it's empty, a soldier runs out of the barracks to it (M.state 'man' till
// he's in); one already crewed (the Testing Environment's) goes straight away
function milCall(V,M){
  if(M.crew||!V.W){M.crew=M.crew||MIL_CREW[M.kind];return true;}
  M.state='man';
  const x=Math.max(V.X0+38,Math.min(V.X0+124,M.home.x))+(Math.random()-0.5)*4,z=V.Z0+32+Math.random()*2;
  M.runner=crewSend('soldier',x,z,M,'drv');return false;
}
// waiting for its crew: in, it goes; its man killed (or the base stood down), it's back to waiting its turn
function milManning(V,M,dt){
  if(M.crew)return true;const r=M.runner;
  if(!V.alert||!r||r.state!=='chase'||!r.mount||r.mount.o!==M){if(r&&r.mount&&r.mount.o===M)r.mount=null;M.runner=null;M.state='park';M.callT=3;}
  return false;
}
// stood down and back in its place: the crew climbs out and walks back to the barracks
function milDismount(V,M){
  const id=M.crew;M.crew=null;if(!V.W||!id)return;const n=nearestPlayer(M.x,M.z);if(!n||n.d>70)return;
  const at=crewAt(M.x,M.z,M.h,MIL[M.kind].hx+0.9,0),g=freeFoe('soldier',24);if(!g)return;
  foeSpawn(g,'soldier',null,0);g.pos.set(at.x,groundAt(at.x,at.z,M.y+3),at.z);g.id=id;g.root.position.copy(g.pos);
  g.mount={home:{x:Math.max(V.X0+38,Math.min(V.X0+124,M.home.x)),z:V.Z0+31}};g.mt=0;
}
// the Testing Environment's: put down ahead of Gus like any vehicle, hunting with a driver and a gunner aboard (and
// the militia's own on foot, by the same names, if it's wrecked), or parked, empty
function crewId(k){const g=freeFoe(k,24);if(!g)return null;foeSpawn(g,k,null,0);const id=g.id;g.state='wait';g.root.visible=false;return id;}
function tenvCrew(t){
  if(!TENV)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  const park=TS.vm==='park',fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),cx=p.pos.x+fx*20,cz=p.pos.z+fz*20;let made=0;
  for(let i=0;i<TS.n;i++){
    let x=cx,z=cz;for(let k=0;k<20;k++){const a=Math.random()*Math.PI*2,r=i||k?4+Math.random()*(10+k*1.5):0;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;if(tenvRoom(x,z,4))break;}
    const c=crewCar();if(!c)break;crewPut(c,t,x,z,Math.atan2(p.pos.x-x,p.pos.z-z),null,'militia');c.spot=null;
    if(!park){c.crew.drv=crewId('militia');c.crew.gun=crewId('militia');c.crew.go=true;crewShow(c);}
    made++;}
  const nm=VEH_NAME[t];
  tsSet(made?('Spawned '+made+' '+(park?'parked ':'hunting ')+nm[made>1?1:0]+' ahead of Gus.'):'Couldn\'t spawn any '+nm[1]+' just now.');
}
