// ---- the planes of the airports and airfields: the country airfield's two-seaters (makeLightPlane, LIGHT_DIM), the
// pilots you can see in the cockpit (planePilot), and the timetables both kinds of site fly to (airportInit, aiFly).
// An airport's airliners are makePlane's; both are planes in its venue's V.pl, so standing on them, hitting them,
// flying them (drvPlane) and their health bars are the same code ----
//
// a two-seater: a high-winged little plane on its wheels, the engine and propeller at the front, the cabin's windows
// under the wing, struts out to it, a tail with its fin. Built straight at its size in blocks (a real one is about
// 7 m long and 10 m across, so about 5 and 7 blocks; it's drawn a little bigger, as the game's cars are, so a goblin
// fits in its seat)
const LIGHT_DIM={hx:0.56,hz:3.3,hy:2.3,wx:4.0,wz:0.65,wy:2.4,wo:0.7,nose:3.5},LIGHT_HP=120;
const LPM={white:new THREE.MeshLambertMaterial({color:0xeef0f2}),dark:new THREE.MeshLambertMaterial({color:0x26292e}),
  glass:new THREE.MeshLambertMaterial({color:0x6a8aa8,transparent:true,opacity:0.38}),
  liv:[0xc8302a,0x2b5fb8,0xe0a020].map(c=>new THREE.MeshLambertMaterial({color:c}))};
// how much a plane can take (its health bar's full length)
const planeMax=pl=>pl&&pl.light?LIGHT_HP:PLANE_HP;
function makeLightPlane(i){
  const g=new THREE.Group(),liv=LPM.liv[i%3],bx=(m,sx,sy,sz,x,y,z,par=g)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);par.add(o);return o;};
  bx(LPM.white,1.1,0.9,3.4,0,1.25,0.6);bx(LPM.glass,1.1,0.55,1.6,0,1.98,1.0);bx(LPM.white,1.1,0.55,1.8,0,1.98,-0.7);   // (the cabin, its windows)
  bx(LPM.white,0.75,0.75,2.6,0,1.45,-2.2);bx(liv,1.12,0.18,4.8,0,1.15,-0.3);   // (the tail cone, the stripe down the side)
  bx(liv,1.0,0.95,0.9,0,1.25,2.75);bx(LPM.dark,0.35,0.35,0.3,0,1.25,3.35);   // (the cowling, the spinner)
  const prop=new THREE.Group();prop.position.set(0,1.25,3.52);g.add(prop);bx(LPM.dark,0.16,2.0,0.06,0,0,0,prop);g.userData.prop=prop;
  bx(LPM.white,8.0,0.14,1.3,0,2.32,0.7);for(const s of [-1,1]){bx(liv,0.6,0.16,1.32,s*3.72,2.32,0.7);
    const st=bx(LPM.dark,0.08,2.07,0.08,s*1.38,1.62,0.7);st.rotation.z=-s*0.92;   // (the wing struts)
    bx(LPM.dark,0.08,0.6,0.08,s*0.72,0.5,1.1);bx(LPM.dark,0.2,0.45,0.45,s*0.9,0.23,1.1);}   // (the main wheels)
  bx(LPM.dark,0.18,0.4,0.4,0,0.2,2.6);
  bx(liv,0.1,1.1,1.0,0,2.1,-3.0);bx(LPM.white,2.6,0.1,0.8,0,1.6,-3.1);   // (the fin, the tailplane)
  planePilot(g,[[-0.25,1.0,1.0]],1);
  return g;
}
// a goblin pilot (or two), sat at the controls: shown while someone's flying it (planeCrewShow). s is its size
const PILOT_M={skin:new THREE.MeshLambertMaterial({color:0x6aa040}),shirt:new THREE.MeshLambertMaterial({color:0xf2f2f0}),cap:new THREE.MeshLambertMaterial({color:0x1d2a44})};
function planePilot(g,seats,s){
  const P=g.userData.pilots=[];
  for(const [x,y,z] of seats){const f=new THREE.Group(),bx=(m,sx,sy,sz,px,py,pz)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx*s,sy*s,sz*s);o.position.set(px*s,py*s,pz*s);f.add(o);};
    bx(PILOT_M.shirt,0.48,0.5,0.3,0,0.25,0);bx(PILOT_M.skin,0.36,0.36,0.34,0,0.7,0.02);bx(PILOT_M.cap,0.4,0.1,0.42,0,0.92,0.04);
    bx(PILOT_M.skin,0.1,0.14,0.14,-0.22,0.72,0);bx(PILOT_M.skin,0.1,0.14,0.14,0.22,0.72,0);   // (the ears)
    f.position.set(x,y,z);f.visible=false;g.add(f);P.push(f);}
}
// whoever's at the controls shows in the seat: the airport's own pilots on their rounds, or a player flying it
function planeCrewShow(pl,dt){
  const g=pl.g,on=!pl.dead&&!!(pl.drv||pl.crewed&&!pl.free),P=g.userData.pilots;
  if(P)for(const f of P)f.visible=on;
  const pr=g.userData.prop;if(pr){const run=on&&(pl.drv?pl.free&&pl.free.thr>0.02||pl.v>0.5:pl.v>0.2||pl.fly&&pl.fly.path&&pl.fly.path[pl.fly.i][0]!=='wait');pr.rotation.z+=dt*(run?45:0);}
}
// ---- the timetables. Each plane that goes round has its own (pl.fly): a list of waypoints in the site's coordinates,
// [u, v, height, speed, (u instead, with someone riding it)], or ['wait', seconds, 'hide' if out of sight meanwhile].
// The airport's two airliners: from their remote stands out to the runway's west end, off to the east and away beyond
// the horizon, back in from the west to land, off at the far end and back along the taxiway to their stands. The
// airfield's two-seater: out to the west end of the strip, off, round a circuit of the field, down and back to its spot ----
function airportFlyPath(B,k){
  const su=AP.stands[k],sv=AP.gateV,tw=AP.taxi,rw=AP.rwy,W=B.w*CELL;
  const P=[['wait',15+k*5],[su,sv,0,3],[su,62,0,4],[su,tw,0,6],[21.5,tw,0,6],[21.5,rw,0,4],[60,rw,0,24],[140,rw,1,46],[200,rw,12,60],[340,rw,70,70],[420,rw,90,75],[900,rw,110,80,560],
    ['wait',30,'hide'],[-700,rw,90,70,-480],[-200,rw,40,60],[10,rw,4,48],[30,rw,0,40],[120,rw,0,30],[W-70,rw,0,16],[W-22.5,rw,0,8],[W-22.5,tw,0,9],[su,tw,0,10],[su,62,0,4],[su,sv,0,3],['wait',60]]
    .map(P=>typeof P[0]==='number'?[P[0],apV(B,P[1]),...P.slice(2)]:P);   // (mirrored with the airport)
  // (one moves about the airport at a time: the other waits on its stand, or out of sight, till it's away -- see aiNext)
  P[2].claim=true;P[9].rel=true;P[13].claim=true;P[23].rel=true;
  return P;
}
function airfieldFlyPath(){
  const [su,sv]=AF.stand,s=AF.strip,t=AF.taxi,[e0,e1]=AF.exits;
  return[['wait',20],[su,sv,0,2],[su,t,0,3],[e0,t,0,3],[e0,s,0,3],[30,s,0,10],[55,s,1,16],[80,s,6,20],[125,s,18,22],[165,s-25,25,22],[150,s-70,28,22],[40,s-75,28,22],
    [-30,s-55,24,20],[-40,s,14,18],[-5,s,5,16],[14,s,0,14],[60,s,0,6],[e1,s,0,4],[e1,t,0,3],[su,t,0,3],[su,sv,0,2],['wait',45]];
}
// how each kind follows its waypoints: height counted as flying, how near a waypoint counts as reached in the air, how
// fast it can turn in the air and on the ground
const FLY_AIRLINER={airH:15,airR:45,turn:0.7,gturn:0.9},FLY_LIGHT={airH:4,airR:12,turn:1.0,gturn:1.2};
// a site's planes, first time round: which go round (and from where, and when), which stay parked where
function airportInit(V){
  const B=V.B,light=B.kind==='airfield';
  V.pl=V.planes.map(g=>({isPlane:true,light,g,hp:light?LIGHT_HP:PLANE_HP,dead:false,v:0}));
  if(light){
    const [a,b,c]=V.pl;a.fly={path:airfieldFlyPath(),i:0,t:0,pos:{u:AF.stand[0],v:AF.stand[1],h:0},sp:0,hd:0,o:FLY_LIGHT};a.crewed=true;
    b.park=[AF.tie[0],AF.tie[1],Math.PI];c.park=[AF.hangar[0],AF.hangar[1],Math.PI];}
  else{const lock={by:null};V.pl.forEach((pl,i)=>{
    if(i<2){const path=airportFlyPath(B,i),hide=path.findIndex(P=>P[2]==='hide'),i0=i===0?0:hide;
      pl.fly={path,i:i0,t:0,pos:{u:AP.stands[i],v:apV(B,AP.gateV),h:0},sp:0,hd:apYaw(B,0),o:FLY_AIRLINER,lock};pl.crewed=true;}
    else pl.park=[AP.gates[i-2],apV(B,AP.gateV),apYaw(B,0)];});}
}
function updateAirport(V,dt){
  const B=V.B,X0=B.ax*CELL,Z0=B.az*CELL;
  if(!V.pl)airportInit(V);
  for(const pl of V.pl)if(!pl.dead&&pl.g.visible)vehSmoke('plane',pl,pl.g.position.x,pl.g.position.y+3,pl.g.position.z,dt);
  // (one that a goblin's flown, or is flying, goes its own way: see drvPlane)
  for(const pl of V.pl){const g=pl.g;planeCrewShow(pl,dt);
    if(pl.dead){planeWreck(pl,V,dt);planeBoxes(pl,0);continue;}
    if(pl.free){drvPlane(pl,dt);if(pl.dead)continue;planeBoxes(pl,pl.free.v);if(pl.free.v>=2)planeStrike(pl,pl.free.v);continue;}
    if(pl.fly){aiFly(pl,pl.fly,X0,Z0,dt);continue;}
    const P=pl.park;g.position.set(X0+P[0],G+1,Z0+P[1]);g.rotation.set(0,P[2],0);pl.v=0;planeBoxes(pl,0);}
}
// one plane along its timetable
// on to the next waypoint, if it may: a step that needs the airport to itself waits till no other's using it (one
// that's wrecked, or a goblin's taken, lets go)
function aiNext(pl,S){
  const L=S.path.length,n=(S.i+1)%L,K=S.lock;
  if(K){const by=K.by;if(S.path[n].claim){if(by&&by!==pl&&!by.dead&&!by.free&&by.fly)return false;K.by=pl;}
    if(S.path[S.i].rel&&K.by===pl)K.by=null;}
  S.i=n;return true;
}
function aiFly(pl,S,X0,Z0,dt){
  const o=S.o,g=pl.g,L=S.path.length,P=S.path[S.i],rider=players.some(q=>q.active&&q.standCar&&q.standCar.T===pl);
  if(P[0]==='wait'){
    // (out of sight beyond the horizon, normally; with someone aboard it just turns round, and comes back)
    if(P[2]==='hide'&&rider){if(aiNext(pl,S))S.t=0;planeBoxes(pl,S.sp);return;}
    S.t+=dt;g.visible=P[2]!=='hide';
    if(S.t>=P[1]&&aiNext(pl,S)){S.t=0;if(P[2]==='hide'){const q=S.path[S.i];S.pos={u:q[0],v:q[1],h:q[2]};}}
    if(g.visible){g.position.set(X0+S.pos.u,G+1+S.pos.h,Z0+S.pos.v);g.rotation.set(0,S.hd,0,'YXZ');}
    pl.v=0;S.sp=0;planeBoxes(pl,0);return;}
  // (with someone aboard it doesn't go so far that the site's forgotten about)
  const tu=rider&&P[4]!==undefined?P[4]:P[0];
  g.visible=true;const du=tu-S.pos.u,dv=P[1]-S.pos.v,d=Math.hypot(du,dv),hd0=S.hd;
  S.sp+=(P[3]-S.sp)*Math.min(1,dt*0.6);const step=Math.min(d,S.sp*dt);pl.v=S.sp;
  const air=S.pos.h>o.airH;
  if(air&&d>o.airR){let a=Math.atan2(du,dv)-S.hd;a=Math.atan2(Math.sin(a),Math.cos(a));S.hd+=Math.max(-o.turn*dt,Math.min(o.turn*dt,a));S.pos.u+=Math.sin(S.hd)*S.sp*dt;S.pos.v+=Math.cos(S.hd)*S.sp*dt;S.pos.h+=(P[2]-S.pos.h)*Math.min(1,step/Math.max(1,d));}   // (in the air it banks round, rather than swinging about on the spot)
  else if(d<(air?o.airR:0.5)){if(!air){S.pos.u=tu;S.pos.v=P[1];S.pos.h=P[2];}if(!aiNext(pl,S)){S.sp=0;pl.v=0;}}
  else{   // (on the ground it stops and swings round before moving off, so anyone standing on it isn't thrown)
    let a=d>2?Math.atan2(du,dv)-S.hd:0;a=Math.atan2(Math.sin(a),Math.cos(a));S.hd+=Math.max(-o.gturn*dt,Math.min(o.gturn*dt,a));
    if(Math.abs(a)<0.2){S.pos.u+=du/d*step;S.pos.v+=dv/d*step;S.pos.h+=(P[2]-S.pos.h)*Math.min(1,step/Math.max(1,d));}else{S.sp*=1-Math.min(1,dt*2);pl.v=S.sp;}}
  const climb=Math.max(-0.25,Math.min(0.25,(P[2]-S.pos.h)/Math.max(1,d)*1.5));
  // (banked into its turns in the air)
  let tr=dt>0?Math.atan2(Math.sin(S.hd-hd0),Math.cos(S.hd-hd0))/dt:0;S.roll=(S.roll||0)+((air?Math.max(-0.6,Math.min(0.6,tr*0.8)):0)-(S.roll||0))*Math.min(1,dt*2);
  g.position.set(X0+S.pos.u,G+1+S.pos.h,Z0+S.pos.v);g.rotation.set(-climb,S.hd,-S.roll,'YXZ');
  planeBoxes(pl,S.sp);if(S.sp>=2)planeStrike(pl,S.sp);
}
