// ---- the aircraft carrier's people and its deck weapons (phase 3). Its crew stand about the ship until something sets
// them off: deck crew in coloured jerseys about the flight deck, sailors below, marines on watch. Boarding it, coming
// close in a vehicle, or hurting one of them sounds general quarters: marines and sailors hunt you through the ship with
// their rifles, the deck crew scatter, and a sailor runs to each of the deck weapons and opens up on you out in the
// world. It stands down when you've been well away for half a minute. The weapons are seats any goblin can take (F):
// the CIWS (Phalanx) is a fast stream of rounds that overheats, and shoots down rockets and missiles; the Sea Sparrow
// fires big homing missiles at a lock; RAM fires small quick ones at whatever's nearest the crosshair ----
// (the crew's kinds, deckhand, sailor and marine, are with the compounds' people in FOES: foes.js)
// deck crews' jerseys, by job (and their helmets the same colour)
const CV_JERSEY={yellow:0xe8c818,green:0x3a9a3a,blue:0x2a5ac8,red:0xc83030,purple:0x8040b0,white:0xeeeeee,brown:0x7a5030};
// where they stand: [kind, s, y above the sea, w, facing, jersey, a second spot to stroll to (s, w)]. The flight deck is
// y 17, the gallery deck 12, the hangar 6 and the lower deck 1 (carrier.js)
const CV_POSTS=[
  ['deckhand',-5,17,40,0,'yellow',[-5,60]],['deckhand',6,17,30,Math.PI,'yellow',[6,10]],['deckhand',-6,17,74,0,'green'],['deckhand',6,17,74,0,'green'],
  ['deckhand',8,17,-30,0,'blue',[8,-50]],['deckhand',10,17,20,Math.PI/2,'red'],['deckhand',-10,17,-10,0,'purple',[-10,5]],['deckhand',-12,17,-70,0,'white'],['deckhand',3,17,-60,Math.PI,'brown',[3,-40]],
  ['marine',9,17,-15,-Math.PI/2],['marine',0,17,-84,Math.PI],['marine',0,6,-40,0],['marine',0,6,25,Math.PI],['marine',15,27,-10,0],['marine',0,1,-84,Math.PI],
  ['sailor',-8,6,-60,0,null,[-8,-45]],['sailor',8,6,-10,Math.PI,null,[8,10]],['sailor',-8,6,35,0],['sailor',0,1,-50,0,null,[0,-30]],['sailor',0,1,10,Math.PI],['sailor',0,1,45,0],
  ['sailor',0,12,-30,0,null,[0,-10]],['sailor',0,12,40,Math.PI]];
// the deck weapons: [kind, s, w, facing (in the pocket: 0 toward the bow, plus round to port)]. On the flight deck's
// edges, clear of the catapults and the landing strip. A launcher rests tipped up
const CV_MOUNTS=[['ciws',-12,72,0.6],['ciws',14,-80,-2.2],['sparrow',13,50,-1.2],['sparrow',-13,-80,2.4],['ram',14,-55,-1.6],['ram',-12,62,1.0]];
// what each weapon is: its name, the magazine (DRV_WPN's shape), how far it reaches
const MOUNT_K={
  ciws:{name:'CIWS (Phalanx)',wpn:[{k:'gun',name:'Phalanx heat',max:160,gap:0.04,reload:4,heat:true}],range:70,hp:150},
  sparrow:{name:'Sea Sparrow launcher',wpn:[{k:'rkt',name:'Sea Sparrow',max:8,gap:0.6,reload:12}],range:160,hp:180,sp:55,turn:2.4,R:4.6,dmg:5,crush:2.6,vd:90},
  ram:{name:'RAM launcher',wpn:[{k:'rkt',name:'RAM',max:21,gap:0.22,reload:10}],range:100,hp:150,sp:70,turn:3.6,R:3.0,dmg:3,crush:1.6,vd:45}};
const MOUNT_STAND=30;   // (seconds well away, everyone, before general quarters stands down)
const _mtv={x:0,z:0};
// ---- the mounts' models: a pedestal, and on it a head that turns (and a gun or launcher in it that lifts) ----
const MT_MAT={};const mtMat=c=>MT_MAT[c]||(MT_MAT[c]=new THREE.MeshLambertMaterial({color:c}));
// (shared box shapes, so batDraw draws every mount's boxes in a few batches: see decoEach)
function mtBox(par,c,w,h,d,x,y,z){const m=new THREE.Mesh(boxGeo(w,h,d),mtMat(c));m.position.set(x,y,z);par.add(m);return m;}
const MT_WHITE=0xeceee8,MT_GREY=0xb4b9be,MT_DARK=0x2a2e33,MT_HOLE=0x16181b;
function makeMount(kind){
  const g=new THREE.Group(),head=new THREE.Group(),lift=new THREE.Group();g.add(head);head.position.y=1.0;head.add(lift);const caps=[];
  mtBox(g,0x8a9098,1.4,1.0,1.4,0,0.5,0);mtBox(g,0x6a7078,1.6,0.12,1.6,0,0.06,0);
  if(kind==='ciws'){lift.position.y=0.55;mtBox(head,0xb8bcc0,1.0,0.5,1.0,0,0.25,0);mtBox(lift,0xf2f2f0,0.95,1.3,0.95,0,0.75,-0.05);mtBox(lift,0xf2f2f0,0.7,0.35,0.7,0,1.55,-0.05);
    mtBox(lift,0x30343a,0.42,0.42,0.6,0,0.15,0.6);mtBox(lift,0x202428,0.28,0.28,1.5,0,0.15,1.4);}
  else if(kind==='sparrow'){
    // (the Sea Sparrow's launcher: a turntable, a yoke of two arms, and between them two boxes of four cells side by
    // side, each cell's front shut by a frangible cover until its missile goes, then open and dark)
    mtBox(head,MT_GREY,1.9,0.28,1.9,0,0.14,0);mtBox(head,MT_GREY,1.2,0.35,1.2,0,0.45,0);
    for(const sx of [-1,1]){mtBox(head,MT_GREY,0.26,1.35,0.7,sx*1.06,0.95,0);mtBox(head,MT_DARK,0.1,0.3,0.3,sx*1.2,1.45,0);}
    lift.position.y=1.45;mtBox(lift,MT_DARK,1.9,0.16,0.16,0,0,0);   // (the trunnion through the arms)
    for(const bx of [-0.46,0.46]){mtBox(lift,MT_WHITE,0.86,0.86,2.5,bx,0,0.15);
      for(const z of [-0.95,1.25])mtBox(lift,MT_GREY,0.92,0.92,0.14,bx,0,z);   // (the frames round each end)
      mtBox(lift,MT_GREY,0.6,0.08,2.0,bx,0.47,0.15);mtBox(lift,MT_DARK,0.8,0.8,0.06,bx,0,1.41);   // (a stiffener along the top; the open fronts behind the covers)
      for(const cy of [0.2,-0.2])for(const cx of [-0.2,0.2])caps.push(mtBox(lift,0xd8dad2,0.34,0.34,0.08,bx+cx,cy,1.45));}
    mtBox(lift,MT_GREY,0.12,0.6,1.6,0,0,0.15);}
  else{
    // (RAM: a turntable with a squat housing, side arms, and the launcher between them: 21 tubes in three rows of
    // seven, a rounded back, and its two seeker pods up on top at the front corners)
    mtBox(head,MT_GREY,1.7,0.28,1.7,0,0.14,0);mtBox(head,0xc4c8cc,1.05,0.55,1.1,0,0.55,-0.1);
    for(const sx of [-1,1]){mtBox(head,MT_GREY,0.22,1.2,0.6,sx*0.86,0.85,0);mtBox(head,MT_DARK,0.08,0.26,0.26,sx*0.98,1.25,0);}
    lift.position.y=1.25;const W=1.3,H=0.95,D=1.9;
    mtBox(lift,MT_WHITE,W,H,D,0,0,0.1);mtBox(lift,MT_WHITE,W-0.24,H-0.2,0.3,0,0,-0.98);mtBox(lift,MT_WHITE,W-0.5,H-0.4,0.18,0,0,-1.2);
    mtBox(lift,MT_DARK,W-0.08,H-0.08,0.06,0,0,1.06);mtBox(lift,MT_GREY,W+0.06,0.1,0.14,0,H/2,1.0);mtBox(lift,MT_GREY,W+0.06,0.1,0.14,0,-H/2,1.0);
    const cw=(W-0.16)/7,ch=(H-0.16)/3;for(let r=0;r<3;r++)for(let c=0;c<7;c++)caps.push(mtBox(lift,MT_WHITE,cw*0.7,ch*0.7,0.08,-W/2+0.08+cw*(c+0.5),H/2-0.08-ch*(r+0.5),1.1));
    for(const sx of [-1,1]){mtBox(lift,0x9aa0a6,0.3,0.34,0.62,sx*(W/2-0.18),H/2+0.17,0.62);mtBox(lift,MT_HOLE,0.2,0.2,0.04,sx*(W/2-0.18),H/2+0.19,0.94);}}
  return{g,head,lift,caps};
}
// (a launcher's covers shown over the cells still loaded: the last ones fired first, so it empties from the bottom up)
function mountCaps(Mt){const C=Mt.caps;if(!C||!C.length)return;const w=Mt.wpn&&Mt.wpn.rkt,n=w?(w.rl>0?0:w.n):C.length;
  if(n===Mt.capN)return;Mt.capN=n;for(let i=0;i<C.length;i++)C[i].visible=i<n;}
// ---- the crew and mounts of a ship, made with it (makeShip) ----
function shipCrewInit(S){
  if(S.kind!=='carrier'||S.crewV)return;
  const V={kind:'shipcrew',ship:S,posts:CV_POSTS.map(([k,s,y,w,h,j,alt])=>({k,x:S.ox-s+0.5,y:G+y,z:S.oz+w+0.5,h0:h,jersey:j?CV_JERSEY[j]:null,alt:alt?{x:S.ox-alt[0]+0.5,z:S.oz+alt[1]+0.5}:null})),
    roused:false,awayT:0,alarmT:0,cx:S.ox,cz:S.oz};
  V.slots=V.posts.map(()=>null);V.slain=V.posts.map(()=>false);S.crewV=V;
  S.mounts=CV_MOUNTS.map(([kind,s,w,h],i)=>{const m=makeMount(kind),K=MOUNT_K[kind],x=S.ox-s+0.5,z=S.oz+w+0.5,y=G+17;m.g.position.set(x,y,z);m.g.rotation.y=h;S.pg.add(m.g);
    const Mt={isMount:true,kind,K,S,i,x,y,z,h,hx:0.8,hz:0.8,yaw:h,pitch:0,g:m.g,head:m.head,lift:m.lift,caps:m.caps,capN:-1,pos:new V3(x,y,z),drv:null,crew:null,cd:0,heat:0,spin:0,acc:0,burst:0,hp:K.hp,dead:false,lk:{isMountT:true,Mt:null,pos:new V3()}};Mt.lk.Mt=Mt;if(kind!=='ciws')Mt.pitch=0.4;wpnInit(Mt,null,K.wpn);return Mt;});
}
// ---- general quarters: the alarm, and everyone at their posts after you ----
function shipGQ(V){
  if(V.roused||calmNow())return;V.roused=true;V.awayT=0;V.alarmT=8;V.alarmK=0;const S=V.ship;
  for(const g of V.slots){if(!g||g.state!=='chase')continue;
    if(g.foeKind==='deckhand'){g.homeV=null;g.civ=true;g.screamCD=Math.random();}   // (the deck crew scatter)
    else{g.gunCD=0.5+Math.random()*1.5;g.bombCD=3+Math.random()*3;}}
  const n=nearestPlayer(S.ox,S.oz);if(n)flashLabel('General quarters! The whole crew is after you',n.p);
}
// each step, from updateShips: who's at their post, whether they've been set off, the alarm, the mounts
function shipCrewTick(S,dt){
  const V=S.crewV;if(!V||V.off)return;   // (off: kept empty and quiet, as the tests of the ship itself want it)
  // (how near the nearest player is, measured where they really are; and whether anyone's aboard or close in a vehicle)
  let dmin=1e9,trip=null;for(const p of players){if(!p.active||p.state==='dead')continue;const d=shipDist(p,S.ox,S.oz);if(d<dmin)dmin=d;
    if(shipOf(p)===S||p.drv&&p.drv.k!=='ship'&&d<60)trip=trip||p;}
  for(let i=0;i<V.slots.length;i++){const g=V.slots[i];if(!g)continue;
    if(g.homeV!==V||g.state==='wait'){V.slots[i]=null;continue;}
    if(g.state==='dead'){V.slain[i]=true;V.slots[i]=null;g.homeV=null;}}
  if(V.roused){
    if(calmNow()){V.roused=false;V.alarmT=0;}
    else if(dmin>130){V.awayT+=dt;if(V.awayT>MOUNT_STAND){V.roused=false;V.slain.fill(false);}}else V.awayT=0;}
  else if(trip&&playing&&!calmNow())shipGQ(V);
  // (the klaxon: a falling whoop, over and over for a while)
  if(V.alarmT>0){V.alarmT-=dt;V.alarmK-=dt;if(V.alarmK<=0&&audio&&dmin<200){V.alarmK=0.9;sfx('General quarters alarm',()=>{tone('sawtooth',560,360,0.6,0.06);tone('square',280,180,0.6,0.025);});}}
  // (at their posts while anyone's near enough to see them: each post filled when someone's within 60 of it; with general
  // quarters sounded, the marines and sailors still turn out, straight after you, but the deck crew have gone below)
  if(playing)for(let i=0;i<V.posts.length;i++){if(V.slots[i]||V.slain[i]||V.posts[i].cut)continue;const P=V.posts[i];if(V.roused&&P.k==='deckhand')continue;
    if(!players.some(p=>p.active&&shipDist(p,P.x,P.z)<60))continue;
    const g=freeFoe(P.k,16);if(!g)break;foeSpawn(g,P.k,V,i,P.jersey?{tunic:P.jersey,hatShown:P.jersey,hat:P.jersey}:null);
    g.post=P;g.hold=P.k==='marine'&&P.y>G+20;if(V.roused){g.gunCD=0.8+Math.random()*1.5;g.bombCD=3+Math.random()*3;}g.pos.set(P.x,P.y,P.z);g.heading=P.h0;g.stroll=0;g.root.position.copy(g.pos);V.slots[i]=g;}
  // (a deck hand or a sailor with a second spot strolls between the two now and then)
  for(const g of V.slots){if(!g||!g.post||!g.post.alt||V.roused)continue;g.stroll=(g.stroll||0)+dt;
    if(g.stroll>9+(g.slot%4)*2){g.stroll=0;const P=V.posts[g.slot],A=P.alt;g.post=g.post===P?{x:A.x,y:P.y,z:A.z,h0:P.h0}:P;}}
  for(const Mt of S.mounts||[])mountTick(Mt,dt);
}
// ---- the mounts: a player in the seat, or a sailor sent to man it, or nobody ----
function mountFind(p){
  const S=shipOf(p);if(!S||!S.mounts)return null;let best=null,bd=1e9;
  for(const Mt of S.mounts){if(Mt.drv||Mt.dead)continue;const d=Math.hypot(p.pos.x-Mt.x,p.pos.z-Mt.z)-0.8;if(d<1.8&&d<bd&&Math.abs(p.pos.y-Mt.y)<1.6){bd=d;best=Mt;}}
  return best?{d:Math.max(0,bd),D:{k:'mount',o:best,V:S.V}}:null;
}
// the muzzle, out in the world (the mount's head turned to yaw, its gun lifted to pitch, both in the ship's frame)
function mountMuzzle(Mt){const S=Mt.S,L=Mt.kind==='ciws'?2.2:1.4,cp=Math.cos(Mt.pitch),y=Mt.y+(Mt.kind==='ciws'?1.7:Mt.kind==='sparrow'?2.45:2.25)+Math.sin(Mt.pitch)*L;
  shipToWorld(S,Mt.x+Math.sin(Mt.yaw)*cp*L,Mt.z+Math.cos(Mt.yaw)*cp*L,_mtv);return{x:_mtv.x,y:y-S.sk,z:_mtv.z};}
// turning the head toward a point out in the world (A), as far as it turns this step
function mountAimAt(Mt,A,dt){const S=Mt.S,m=mountMuzzle(Mt);worldToShip(S,A.x,A.z,_mtv);const dx=_mtv.x-Mt.x,dz=_mtv.z-Mt.z;
  Mt.yaw=angTo(Mt.yaw,Math.atan2(dx,dz),(Mt.kind==='ciws'?4:2.5)*dt);Mt.pitch+=(Math.max(-0.3,Math.min(1.3,Math.atan2(A.y-m.y,Math.hypot(dx,dz))))-Mt.pitch)*Math.min(1,dt*6);}
function mountPose(Mt){Mt.head.rotation.y=Mt.yaw-Mt.h;Mt.lift.rotation.x=-Mt.pitch;mountCaps(Mt);}
function mountTick(Mt,dt){
  if(Mt.dead)return;   // (wrecked: see mountHit)
  const S=Mt.S,V=S.crewV;wpnTick(Mt,dt);const W=Mt.wpn.gun;
  // (the Phalanx cools while it isn't firing: its 'rounds' are how much more it can take before it overheats)
  if(W&&W.rl<=0&&W.cd<-0.3&&W.n<W.W.max)W.n=Math.min(W.W.max,W.n+dt*60);
  if(Mt.drv)shipOutside(()=>mountPlayer(Mt,Mt.drv,dt));
  else if(Mt.crew&&V.roused&&playing&&!calmNow())mountAI(Mt,dt);
  else{Mt.spin*=Math.exp(-dt*2);if(Mt.crew&&!V.roused){Mt.crew=null;}}   // (stood down: the gunner goes back below)
  // (general quarters: a sailor runs for each empty mount, from a little way inboard of it)
  if(V.roused&&!Mt.drv&&!Mt.crew&&!Mt.call&&playing&&!calmNow()){const ix=Mt.x+(S.ox-Mt.x)*0.4,iz=Mt.z;const g=crewSend('sailor',ix,iz,Mt,'gun');
    if(g){g.pos.y=Mt.y;g.root.position.copy(g.pos);g.id.occ=Mt.kind==='ciws'?'Phalanx gunner':'Missile technician';Mt.call=g;}}
  if(Mt.call&&(Mt.call.state!=='chase'||!Mt.call.mount))Mt.call=null;
  mountPose(Mt);
}
// ---- the mounts as targets: each is a small, fixed vehicle. Its box goes among the vehicles' (TRAIN_BOXES) twice: out
// in the world where the ship is (B.mw), for shots, blasts, missiles and vehicles from outside; and in the pocket, for
// anything aboard. Its lock-on stand-in (Mt.lk) is kept where it really is in the world
function mountBoxes(S){if(!S.mounts)return;const tx=Math.sin(S.yaw),tz=Math.cos(S.yaw);
  for(const Mt of S.mounts){if(Mt.dead)continue;const hy=Mt.kind==='ciws'?3.2:2.9,h=0.9;
    if(!Mt.pr)Mt.pr={isTrain:true,isMountBox:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:h,hz:h,hy,heading:0,top:0,veh:'mount',T:Mt,i:0};
    shipToWorld(S,Mt.x,Mt.z,_mtv);const y=Mt.y-S.sk,pr=Mt.pr;Mt.lk.pos.set(_mtv.x,y,_mtv.z);pr.pos.set(_mtv.x,y,_mtv.z);pr.top=y+hy;pr.heading=S.yaw;
    TRAIN_BOXES.push({x:_mtv.x,z:_mtv.z,tx,tz,y0:y,top:y+hy,v:S.sp,hx:h,hz:h,proxy:pr,mw:true});
    TRAIN_BOXES.push({x:Mt.x,z:Mt.z,tx:0,tz:1,y0:Mt.y,top:Mt.y+hy,v:0,hx:h,hz:h,proxy:pr});}}
// hit (trainHit, from shots, blasts and rams): the number where it struck, and at none it's wrecked
function mountHit(Mt,n){
  if(Mt.dead||Mt.S.dead||drvSafe(Mt))return;const P=Mt.lk.pos;dmgPop(P.x,P.y+3.6,P.z,Math.round(n),'#ffb04a');Mt.hp-=n;vHitFx(P.x,P.y+1.5,P.z,n);
  if(Mt.hp<=0)mountWreck(Mt);}
// wrecked: whoever's at it thrown off, a blast and smoke, and what's left blackened, its head knocked askew. It does
// nothing more, and nobody can man it
function mountWreck(Mt){
  Mt.dead=true;Mt.hp=0;Mt.crew=null;Mt.call=null;if(Mt.pr)Mt.pr.alive=false;const P=Mt.lk.pos;
  if(Mt.drv){const p=Mt.drv;drvExit(p);}
  blastFx(P.x,P.y+1.5,P.z,0.6,2);smoke(P.x,P.y+2,P.z,14,0x262626);addShake(0.3,P.x,P.z,25);
  if(audio)sfx('Deck weapon destroyed',()=>{noise(0.8,0.5,500,'lowpass');tone('sawtooth',90,30,0.8,0.1);});
  Mt.g.traverse(o=>{if(o.isMesh)o.material=mtMat(0x1e1f21);});Mt.head.rotation.z=0.35;Mt.lift.rotation.x=0.5;
  if(Mt.caps)for(const c of Mt.caps)c.visible=false;
}
// a player at it: the head follows their view; bite (or stomp) fires. Run with everyone aboard put where they really are
// (shipOutside), so the aim, the lock and the shots are all out in the world
function mountPlayer(Mt,p,dt){
  const i=drvIn(p),K=Mt.K,S=Mt.S,A=drvAim(p,K.sp||400);
  // (the head and the gun, toward where the crosshair is, in the ship's frame)
  const m0=mountMuzzle(Mt);worldToShip(S,A.x,A.z,_mtv);Mt.yaw=angTo(Mt.yaw,Math.atan2(_mtv.x-Mt.x,_mtv.z-Mt.z),6*dt);
  Mt.pitch+=(Math.max(-0.3,Math.min(1.3,Math.atan2(A.y-m0.y,Math.hypot(_mtv.x-Mt.x,_mtv.z-Mt.z))))-Mt.pitch)*Math.min(1,dt*10);
  const fire=i.bite||i.stomp,press=(i.bitePress||i.stomp&&!Mt.stHeld);Mt.stHeld=i.stomp;
  if(Mt.kind==='ciws'){Mt.spin+=((fire?1:0)-Mt.spin)*Math.min(1,dt*(fire?2.5:1.2));
    if(fire&&Mt.spin>0.8){Mt.acc+=dt;while(Mt.acc>=K.wpn[0].gap){Mt.acc-=K.wpn[0].gap;if(!wpnFire(Mt,'gun'))break;ciwsRound(Mt,p,null);}}else Mt.acc=0;}
  else if(press&&wpnFire(Mt,'rkt')){
    // (the Sea Sparrow wants a lock first; RAM takes whatever's nearest the crosshair if there's no lock)
    let T=p.lockT&&lockAlive(p.lockT)?p.lockT:null;if(!T&&Mt.kind==='ram')T=mountPick(p);
    if(!T&&Mt.kind==='sparrow'){Mt.wpn.rkt.n++;Mt.wpn.rkt.cd=0.3;flashLabel('Lock on first ('+actMark(p,'lock')+')',p);tone('square',180,140,0.06,0.03);}
    else mountMissile(Mt,p,T?{t:T}:null,A);}
}
// RAM's quick lock: whatever's nearest the crosshair, within about 25 degrees and its reach
function mountPick(p){const c=p.camera.position,cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;let best=null,bs=1e9;
  for(const o of lockTargets(p,100)){const t=o.t,dx=t.pos.x-c.x,dy=lockY(t)-c.y,dz=t.pos.z-c.z,L=Math.hypot(dx,dy,dz)||1,a=Math.acos(Math.max(-1,Math.min(1,(dx*fx+dy*fy+dz*fz)/L)));
    if(a>0.45)continue;const sc=a*60+L*0.05+o.hid;if(sc<bs){bs=sc;best=t;}}
  return best;}
// one round from the Phalanx at A (or where p is aiming): a world shot, sparing its own ship; and any rocket or missile
// close to the line of it is shot down
function ciwsRound(Mt,p,A0){
  const m=mountMuzzle(Mt),A=A0||drvAim(p,400);gunRound(Mt.S,p,m.x,m.y,m.z,2,0.01,'Shredded by a CIWS','CIWS',A);
  const dx=A.x-m.x,dy=A.y-m.y,dz=A.z-m.z,L=Math.hypot(dx,dy,dz)||1,ux=dx/L,uy=dy/L,uz=dz/L;
  for(const Q of SHOTS){if(!Q.live||Q.own===Mt.S||Q.own&&Q.own.S===Mt.S||Q.pos.x>=SHIP_X0||Q.kind==='grenade')continue;const ox=Q.pos.x-m.x,oy=Q.pos.y-m.y,oz=Q.pos.z-m.z,t=ox*ux+oy*uy+oz*uz;if(t<0||t>Mt.K.range)continue;
    const cx=ox-ux*t,cy=oy-uy*t,cz=oz-uz*t;if(cx*cx+cy*cy+cz*cz<2.2*2.2&&Math.random()<0.35){Q.fuse=0;Q.tgt=null;Q.chase=null;
      if(p&&p.drv)award(15,'Shot down',Q.pos.x,Q.pos.y,Q.pos.z);}}
}
// a missile up out of the launcher, then after its target: T, {t} a lockable target, {fn} a point that moves, or none
// (straight at A). A player's missile can hit the ship itself, if that's what they fire at (owned by the mount, not the
// ship); the crew's are the ship's, and never touch it
function mountMissile(Mt,p,T,A){
  const K=Mt.K,m=mountMuzzle(Mt),S=Mt.S,a=Mt.yaw+S.yaw,f=Math.cos(Mt.pitch);
  shot({kind:'missile',x:m.x,y:m.y+0.4,z:m.z,vx:Math.sin(a)*f*14,vy:16,vz:Math.cos(a)*f*14,grav:0,fuse:8,R:K.R,dmg:K.dmg,crush:K.crush,vd:K.vd,own:p?Mt:S,
    cause:'Blown up by a '+(Mt.kind==='ram'?'RAM':'Sea Sparrow')+' missile',by:p?pvpBy(p):null,tgt:T&&T.t||null,chase:T&&T.fn||null,at:T?null:{x:A.x,y:A.y,z:A.z},sp:K.sp,turn:K.turn});
  smoke(m.x,m.y,m.z,3,0xdadada);puff(m.x,m.y,m.z,3,0xffc060,0.3);if(audio)sfx(Mt.kind==='ram'?'RAM launch':'Sea Sparrow launch',()=>noise(0.5,0.22,1000,'bandpass'));
}
// what a sailor at a mount goes for, out in the world: rockets and missiles coming in (the Phalanx only), then aircraft,
// then vehicles, then anyone in the open; never anything close enough to the ship that hitting it would hit the ship
function mountThreat(Mt){
  const S=Mt.S,K=Mt.K,m=mountMuzzle(Mt),near=(x,z)=>{worldToShip(S,x,z,_mtv);const u=_mtv.x-S.ox,w=_mtv.z-S.oz;return u>S.K.u0-10&&u<S.K.u1+11&&w>S.K.w0-10&&w<S.K.w1+11;};
  let best=null,bs=1e9;const cand=(x,y,z,pri,o)=>{const d=Math.hypot(x-m.x,y-m.y,z-m.z);if(d>K.range||near(x,z))return;const sc=d+pri*1000;if(sc<bs){bs=sc;best={x,y,z,o};}};
  if(Mt.kind==='ciws')for(const Q of SHOTS)if(Q.live&&Q.own!==S&&!(Q.own&&Q.own.S===S)&&Q.pos.x<SHIP_X0&&Q.kind!=='grenade')cand(Q.pos.x,Q.pos.y,Q.pos.z,0,{shot:Q});
  for(const p of players){if(!p.active||p.state==='dead'||shipOf(p)===S)continue;const x=pwx(p),z=pwz(p);
    if(p.drv){const D=p.drv,air=D.k==='heli'||D.k==='plane'||D.k==='balloon'||D.k==='mech'&&!D.o.grounded;cand(x,p.pos.y,z,air?1:2,{p,veh:true});}
    else if(Mt.kind!=='sparrow')cand(x,p.pos.y+1,z,3,{p});}
  return best;
}
function mountAI(Mt,dt){
  const T=mountThreat(Mt);Mt.cd-=dt;
  if(!T){Mt.spin*=Math.exp(-dt*1.5);Mt.burst=0;return;}
  mountAimAt(Mt,T,dt);const S=Mt.S;
  if(Mt.kind==='ciws'){Mt.spin+=(1-Mt.spin)*Math.min(1,dt*2.5);if(Mt.spin<0.8)return;
    // (bursts: a second and a bit of fire, then a breather)
    if(Mt.burst<=0){if(Mt.cd>0)return;Mt.burst=1.2;Mt.cd=2.2;}
    Mt.burst-=dt;Mt.acc+=dt;while(Mt.acc>=0.05){Mt.acc-=0.05;if(!wpnFire(Mt,'gun'))break;const m=mountMuzzle(Mt),o=T.o;
      if(o.shot){ciwsRoundAt(Mt,m,T);continue;}
      if(o.veh){gunRound(S,null,m.x,m.y,m.z,2,0.02,'Shredded by a CIWS','CIWS',{x:T.x,y:T.y+0.5,z:T.z});continue;}
      // (someone in the open: the rounds are spread about, and each has a chance of finding them)
      let hit=Math.random()<0.12&&!(o.p.dodge&&o.p.dodge.t<o.p.dodge.dur*0.85),a=Math.random()*6.283,r=hit?0:1+Math.random()*2.5,ex=T.x+Math.cos(a)*r,ez=T.z+Math.sin(a)*r,ey=T.y;
      {const w=wallStop(m.x,m.y,m.z,ex,ey,ez);if(w){ex=w.x;ey=w.y;ez=w.z;hit=false;}}   // (a wall in the way takes it)
      tracer(m.x,m.y,m.z,ex,ey,ez);if(audio)sfx('CIWS',()=>noise(0.05,0.08,2600,'highpass'));if(!hit)puff(ex,ey,ez,1,0x9a948a,0.15);
      else{const h=Math.hypot(ex-m.x,ez-m.z)||1;shotPlayer(o.p,1,new V3(ex,ey,ez),new V3((ex-m.x)/h,0.2,(ez-m.z)/h),'Shredded by a CIWS',Mt.crew);}}
    return;}
  if(Mt.cd>0||Mt.spin<0)return;
  // (a missile at it every few seconds, chasing where they really are)
  const o=T.o,q=o.p;if(!wpnFire(Mt,'rkt'))return;Mt.cd=Mt.kind==='ram'?2.2:4.5;
  mountMissile(Mt,null,{fn:()=>q.active&&q.state!=='dead'&&shipOf(q)!==S?{x:pwx(q),y:q.pos.y+1,z:pwz(q)}:null},T);
}
// the Phalanx's rounds at a rocket or missile coming in: a tracer each, and a good chance of a hit
function ciwsRoundAt(Mt,m,T){const Q=T.o.shot;tracer(m.x,m.y,m.z,Q.pos.x+(Math.random()-.5),Q.pos.y+(Math.random()-.5),Q.pos.z+(Math.random()-.5));
  if(audio)sfx('CIWS',()=>noise(0.05,0.08,2600,'highpass'));if(Q.live&&Math.random()<0.15){Q.fuse=0;Q.tgt=null;Q.chase=null;}}
// the view from a mount: from just behind and above its head, looking where you look
function mountCam(p,Mt){
  const cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp,y=Mt.y+2.6;
  p.drvCamD=3.5;p.camera.position.set(Mt.x-fx*3,y-fy*3+0.4,Mt.z-fz*3);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);
  if(p.shake>0.002&&gameSpeed()>0){const c=p.camera.position;c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
}
// taking a mount a sailor's at: he's thrown off it, and he's not happy about it
function mountTakeover(Mt){
  if(!Mt.crew)return;Mt.crew=null;const V=Mt.S.crewV,g=freeFoe('sailor',16);if(!g)return;
  foeSpawn(g,'sailor',null,0);g.pos.set(Mt.x+Math.cos(Mt.yaw)*1.6,Mt.y,Mt.z-Math.sin(Mt.yaw)*1.6);g.heading=Mt.yaw;g.stun=0.8;g.root.position.copy(g.pos);if(V)shipGQ(V);
}
