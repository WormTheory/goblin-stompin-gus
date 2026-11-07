// ---- the military bases' armour: tanks in the motor pools and helicopters on the pads, real vehicles. Parked, and
// empty, until someone comes into the base; then soldiers run out of the barracks to crew them (milCall, see crews.js),
// and (up to four at a time) the tanks start up and come for you, turrets turning, firing
// shells, and the helicopters lift off, circle you, and open up with their guns and rockets. Each has a stand-in in
// TRAIN_BOXES, so it's stood on, climbed and hit like a train; what's destroyed stays wrecked (saved in 'wrecked') ----
const MILM={olive:new THREE.MeshLambertMaterial({color:0x4a5a2a}),dark:new THREE.MeshLambertMaterial({color:0x2a3020}),track:new THREE.MeshLambertMaterial({color:0x22241e}),glass:new THREE.MeshLambertMaterial({color:0x1b2a3c}),blade:new THREE.MeshLambertMaterial({color:0x1a1a1a})};
const MIL={tank:{hp:160,pts:750,hx:1.6,hz:2.7,hy:2.3,name:'Tank'},heli:{hp:80,pts:1000,hx:1.0,hz:2.4,hy:2.2,name:'Helicopter'}};
// the solid parts of each, for running into things: the body (MIL's box), and a helicopter's tail boom and fin behind it
// (c: how far forward of the middle, y0/y1: from and to how high). Without the tail a tank drove straight through it
const MIL_PARTS={tank:[{c:0,hx:1.6,hz:2.7,y0:0,y1:2.3}],heli:[{c:0,hx:1.0,hz:2.4,y0:0,y1:2.2},{c:-4.2,hx:0.35,hz:1.9,y0:1.5,y1:3.25}]};
const MIL_CREW={tank:{name:'A tank crew',occ:'Army'},heli:{name:'A helicopter gunner',occ:'Army'}},MIL_ROLL=4;   // (how many tanks come for you at once)
function milBx(g,m,sx,sy,sz,x,y,z){const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);g.add(o);return o;}
function makeTank(){
  const g=new THREE.Group();
  for(const s2 of[-1,1]){milBx(g,MILM.track,0.8,1.0,5.4,s2*1.25,0.5,0);for(let k=0;k<5;k++)milBx(g,MILM.dark,0.84,0.5,0.5,s2*1.25,0.45,-2+k);}   // (the tracks and their road wheels)
  milBx(g,MILM.olive,2.0,0.9,5.0,0,1.15,0);milBx(g,MILM.olive,3.1,0.25,5.2,0,1.62,0);milBx(g,MILM.dark,2.2,0.5,0.3,0,1.2,2.55);
  const tur=new THREE.Group();tur.position.set(0,1.75,-0.3);g.add(tur);
  milBx(tur,MILM.olive,2.0,0.8,2.4,0,0.4,0);milBx(tur,MILM.dark,0.7,0.3,0.7,0.5,0.95,-0.4);milBx(tur,MILM.dark,0.26,0.26,3.2,0,0.45,2.7);milBx(tur,MILM.dark,0.38,0.38,0.5,0,0.45,1.3);
  return{g,tur};
}
function makeHeli(){
  const g=new THREE.Group();
  milBx(g,MILM.olive,1.8,1.7,3.6,0,1.55,0.3);milBx(g,MILM.glass,1.6,1.1,0.9,0,1.75,2.3);milBx(g,MILM.olive,0.45,0.45,4.6,0,1.9,-3.6);milBx(g,MILM.olive,0.12,1.3,0.8,0,2.5,-5.7);
  for(const s2 of[-1,1]){milBx(g,MILM.dark,0.12,0.12,3.6,s2*0.9,0.06,0.3);for(const z of[-0.6,1.2])milBx(g,MILM.dark,0.1,0.55,0.1,s2*0.9,0.3,z);milBx(g,MILM.dark,0.35,0.35,1.2,s2*1.15,1.2,0.7);}   // (skids, struts, rocket pods)
  milBx(g,MILM.dark,0.2,0.4,0.2,0,2.55,0.3);
  const rot=new THREE.Group();rot.position.set(0,2.8,0.3);g.add(rot);milBx(rot,MILM.blade,10,0.06,0.35,0,0,0);milBx(rot,MILM.blade,0.35,0.06,10,0,0,0);
  const trot=new THREE.Group();trot.position.set(0.12,2.5,-5.7);g.add(trot);milBx(trot,MILM.blade,0.05,1.5,0.18,0,0,0);
  return{g,rot,trot};
}
function armyVenue(B){
  const X0=B.ax*CELL,Z0=B.az*CELL,W=B.w*CELL,Hh=B.h*CELL,mil=[],V={kind:'army',B,X0,Z0,W,Hh,cx:X0+W/2,cz:Z0+Hh/2,mil,alert:false,awayT:0};
  const add=(kind,u,v,h)=>{const i=mil.length,mk=kind==='tank'?makeTank():makeHeli(),x=X0+u+0.5,z=Z0+v+0.5;
    const M=Object.assign({isMil:true,kind,V,x,y:G+1,z,h,tu:0,hp:MIL[kind].hp,dead:false,key:'mil:'+B.ax+','+B.az+':'+i,home:{x,z,h},state:'park',cd:1.5+i*0.4,rcd:6,burst:0,bt:0,stuck:0,v:0,vy:0,spin:0,oa:i*2.1,hurt:0},mk);
    scene.add(M.g);if(wrecked[M.key]){M.dead=true;M.deadT=99;milDark(M);}mil.push(M);};
  for(const u of [40,47,54])add('tank',u,40,Math.PI);   // (the first motor pool's row, guns toward the parade ground)
  for(const v of [42,54,66,78])for(const u of [103,111,119])add('tank',u,v,Math.PI);
  add('heli',78,48,0);add('heli',78,76,0);
  for(const M of V.mil)milPlace(M);
  return V;
}
function milDark(M){M.g.traverse(o=>{if(o.isMesh)o.material=TRM.dark;});if(M.rot)M.rot.visible=false;}
function milPlace(M){M.g.position.set(M.x,M.y,M.z);(M.pos||(M.pos=new V3())).set(M.x,M.y,M.z);const j=M.jolt>0&&!M.dead?M.jolt*0.4:0;   // (just hit: it rocks)
  M.g.rotation.set((M.pitch||0)+j*(Math.random()-.5),M.h+j*(Math.random()-.5)*0.5,(M.roll||0)+j*(Math.random()-.5),'YXZ');if(M.tur)M.tur.rotation.y=M.tu;}
// its stand-in, this frame (v: how fast it's moving, so it knocks over what it drives into)
function milBoxes(M,v){
  const I=MIL[M.kind];if(!M.pr)M.pr={isTrain:true,isPlane:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:I.hx,hz:I.hz,hy:I.hy,heading:0,top:0,veh:'plane',T:M,i:0};
  const pr=M.pr;pr.alive=!M.dead;pr.pos.set(M.x,M.y,M.z);pr.heading=M.h;pr.top=M.y+I.hy;
  const tx=Math.sin(M.h),tz=Math.cos(M.h);
  for(const a of MIL_PARTS[M.kind])TRAIN_BOXES.push({x:M.x+tx*a.c,z:M.z+tz*a.c,tx,tz,y0:M.y+a.y0,top:a.c?M.y+a.y1:pr.top,v,hx:a.hx,hz:a.hz,proxy:pr});
}
// a clear line between two points (no solid block on it)
function lineClear(x0,y0,z0,x1,y1,z1){const ex=x1-x0,ey=y1-y0,ez=z1-z0,n=Math.ceil(Math.hypot(ex,ey,ez)/0.5);for(let i=1;i<n;i++){const k=i/n;if(solidAt(x0+ex*k,Math.floor(y0+ey*k),z0+ez*k))return false;}return true;}
const angTo=(a,b,r)=>{let df=b-a;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;return a+Math.max(-r,Math.min(r,df));};
const angDiff=(a,b)=>{let df=b-a;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;return df;};
function milAlert(V,who){
  if(V.alert)return;V.alert=true;V.awayT=0;
  if(audio)sfx('Base alarm',()=>{tone('square',660,440,0.6,0.06);tone('square',660,440,0.6,0.06,0.7);});
  if(who)flashLabel('The base scrambles its tanks and helicopters!',who);
}
function updateArmy(V,dt){
  // someone in the base (or hurting what's in it, see milHit) sets it all off; long enough with no one about, it stands down
  if(playing&&!V.alert&&!calmNow())for(const q of players){if(!q.active||q.state==='dead')continue;if(q.pos.x>V.X0&&q.pos.x<V.X0+V.W&&q.pos.z>V.Z0&&q.pos.z<V.Z0+V.Hh){milAlert(V,q);break;}}
  if(V.alert){const n=nearestPlayer(V.cx,V.cz);if(!n||n.d>V.W/2+200||calmNow()){V.awayT+=dt;if(V.awayT>30||calmNow()){V.alert=false;for(const M of V.mil)if(!M.dead&&M.state!=='park')M.state='home';}}else V.awayT=0;}
  let rolling=0;for(const M of V.mil)if(M.kind==='tank'&&!M.dead&&(M.state==='hunt'||M.state==='man'))rolling++;
  for(const M of V.mil){
    if(M.dead){milWreck(M,dt);milBoxes(M,0);milShove(M);continue;}
    M.hurt-=dt;M.jolt=(M.jolt||0)-dt;vDamaged(M.x,M.y+MIL[M.kind].hy,M.z,M.hp/MIL[M.kind].hp,dt);M.callT=(M.callT||0)-dt;
    // (its crew on the way: once he's in, it goes; back in its place with the base stood down, he climbs out)
    if(M.state==='man'&&milManning(V,M,dt)){M.state='hunt';M.cd=M.kind==='tank'?1.5+Math.random():4;M.rcd=7+Math.random()*3;}
    if(M.state==='park'&&M.crew&&!V.alert&&!M.drv)milDismount(V,M);
    if(V.alert&&M.state==='park'&&M.callT<=0&&(M.kind==='heli'||rolling<MIL_ROLL)){
      // (the next tank off is the one nearest you)
      if(M.kind==='tank'){const n=nearestPlayer(M.x,M.z);let best=true;if(n)for(const o of V.mil)if(o!==M&&o.kind==='tank'&&!o.dead&&o.state==='park'&&Math.hypot(o.x-n.p.pos.x,o.z-n.p.pos.z)<n.d-0.01){best=false;break;}if(best){rolling++;if(milCall(V,M)){M.state='hunt';M.cd=1.5+Math.random();}}}
      else if(milCall(V,M)){M.state='hunt';M.cd=4;M.rcd=7+Math.random()*3;}}
    if(M.kind==='tank')updateTank(M,V,dt);else updateHeli(M,V,dt);
  }
}
// ---- the armour is solid: tanks and helicopters don't pass through each other or the other big vehicles (trains, planes,
// boats, rides), and they shove goblins and cars out of their way; a tank driving at them runs goblins down and rams cars ----
// would M, put at x,z (height y) facing h, overlap another base vehicle, or a train, plane, boat or ride car?
// (the base vehicles are checked from their own lists, since the ones later in this frame aren't in TRAIN_BOXES yet)
function milBlocked(M,x,z,h,y){const P=MIL_PARTS[M.kind],R=7,sx=Math.sin(h),sz=Math.cos(h);   // (R: out past the end of a helicopter's tail)
  for(const V of venues.values()){if(V.kind!=='army')continue;
    for(const o of V.mil){if(o===M||Math.hypot(o.x-x,o.z-z)>R*2)continue;const ox=Math.sin(o.h),oz=Math.cos(o.h);
      for(const a of P)for(const b of MIL_PARTS[o.kind]){if(y+a.y0>=o.y+b.y1||o.y+b.y0>=y+a.y1)continue;
        if(boxesTouch(x+sx*a.c,z+sz*a.c,h,a.hx,a.hz,o.x+ox*b.c,o.z+oz*b.c,o.h,b.hx,b.hz))return true;}}}
  for(const B of TRAIN_BOXES){if(B.soft||!B.proxy.alive||B.proxy.T&&B.proxy.T.isMil)continue;const bx=B.hx||TRAIN_HX,bz=B.hz||TRAIN_HZ;
    if(Math.hypot(B.x-x,B.z-z)>R+Math.hypot(bx,bz))continue;
    for(const a of P){if(y+a.y0>=B.top||B.y0>=y+a.y1)continue;if(boxesTouch(x+sx*a.c,z+sz*a.c,h,a.hx,a.hz,B.x,B.z,Math.atan2(B.tx,B.tz),bx,bz))return true;}}
  // (and cars: a tank or helicopter shoves an ordinary one aside (milShove), but not one that's being driven, which it stops against)
  for(const c of cars){if(!c.alive||!c.drv||Math.hypot(c.pos.x-x,c.pos.z-z)>R+c.hz)continue;
    for(const a of P){if(y+a.y0>=c.pos.y+(c.hy||1.4)||c.pos.y>=y+a.y1)continue;if(boxesTouch(x+sx*a.c,z+sz*a.c,h,a.hx,a.hz,c.pos.x,c.pos.z,c.heading,c.hx,c.hz))return true;}}
  return false;}
// goblins and cars inside M's box are put back outside it, by whichever side or end is nearer; a tank moving at 1 or more
// runs down a goblin it meets head on (and rams a car), and a car that drives hard into any of them is hurt by it
function milShove(M){const I=MIL[M.kind],R=Math.max(I.hx,I.hz)+3,tx=Math.sin(M.h),tz=Math.cos(M.h),run=M.kind==='tank'&&!M.dead&&M.v>1,top=M.y+I.hy;
  const out=(o,r)=>{const dx=o.pos.x-M.x,dz=o.pos.z-M.z,al=dx*tx+dz*tz,ac=-dx*tz+dz*tx;if(Math.abs(al)>I.hz+r||Math.abs(ac)>I.hx+r)return null;
    const pc=I.hx+r-Math.abs(ac),pl=I.hz+r-Math.abs(al);
    if(pc<pl){const s=ac>=0?1:-1;return{nx:-tz*s,nz:tx*s,need:pc+0.05};}
    const s=al>=0?1:-1;return{nx:tx*s,nz:tz*s,need:pl+0.05};};
  for(const g of goblins){if(g.state!=='chase'||Math.abs(g.pos.x-M.x)>R||Math.abs(g.pos.z-M.z)>R||g.pos.y+1.5<M.y||g.pos.y>top-0.3)continue;   // (one standing on top is left be)
    const c=out(g,0.4);if(!c)continue;g.pos.x+=c.nx*c.need;g.pos.z+=c.nz*c.need;
    if(run&&!(g.trainT>0)&&c.nx*tx+c.nz*tz>0.5){g.trainT=1;damageGoblin(g,Math.round(4+M.v*1.5),g.pos.clone(),new V3(c.nx,0.5,c.nz),'Run over by a tank',ACCIDENT);}}
  for(const c of cars){if(!c.alive||Math.abs(c.pos.x-M.x)>R+c.hz||Math.abs(c.pos.z-M.z)>R+c.hz||c.pos.y+(c.hy||1.4)<M.y||c.pos.y>top-0.3)continue;
    // (allowing for which way the car's facing: nose on, it's its whole length that has to come out)
    if(!boxesTouch(c.pos.x,c.pos.z,c.heading,c.hx,c.hz,M.x,M.z,M.h,I.hx,I.hz))continue;
    const k=outOf(c.pos.x,c.pos.z,Math.sin(c.heading),Math.cos(c.heading),c.hx,c.hz,{x:M.x,z:M.z,tx,tz,hx:I.hx,hz:I.hz});if(!k)continue;c.pos.x+=k.nx*k.need;c.pos.z+=k.nz*k.need;
    if(c.trainT>0)continue;
    if(run&&k.nx*tx+k.nz*tz>0.5){c.trainT=1;damageCar(c,Math.round(4+M.v),new V3(k.nx,0,k.nz),'acc');if(c.alive)launchCar(c,3,new V3(k.nx*1.5,0,k.nz*1.5),3);clang();thud(0.5);}
    else if(Math.abs(c.speed||0)>5){c.trainT=1;damageCar(c,Math.round(Math.abs(c.speed)*0.6),new V3(k.nx,0,k.nz),'acc');c.speed*=-0.3;clang();}}
}
function updateTank(M,V,dt){
  if(M.drv){drvTank(M,dt);return;}
  const n=playing?nearestPlayer(M.x,M.z):null;let wantV=0,wantH=M.h;
  if(M.state==='hunt'&&n){const p=n.p,dx=p.pos.x-M.x,dz=p.pos.z-M.z,d=n.d;
    // the turret swings round on to him; the hull heads for him until it's close enough to shoot at its ease
    const aim=Math.atan2(dx,dz)-M.h;M.tu=angTo(M.tu,aim,1.1*dt);wantH=Math.atan2(dx,dz);wantV=d>16?5.5:0;
    M.cd-=dt;
    if(M.cd<=0&&d>5&&d<75&&Math.abs(angDiff(M.tu,aim))<0.07){const a=M.h+M.tu,fx=Math.sin(a),fz=Math.cos(a),mx=M.x+fx*3.9,my=M.y+2.2,mz=M.z+fz*3.9,ty=p.pos.y+1.0;
      if(lineClear(mx,my,mz,p.pos.x,ty,p.pos.z)){const L=Math.hypot(p.pos.x-mx,ty-my,p.pos.z-mz)||1,sp=45;
        shot({kind:'shell',x:mx,y:my,z:mz,vx:(p.pos.x-mx)/L*sp,vy:(ty-my)/L*sp+L/sp*1,vz:(p.pos.z-mz)/L*sp,grav:2,fuse:4,R:3.6,dmg:3,cause:'Blown up by a tank shell',by:MIL_CREW.tank,crush:2.6,vd:40,own:M});
        M.cd=3.5+Math.random()*2;smoke(mx,my,mz,4,0x8a8a80);puff(mx,my,mz,4,0xffc040,0.3);if(audio)sfx('Tank fires',()=>{noise(0.6,0.6,350,'lowpass');tone('sawtooth',70,30,0.5,0.15);});addShake(0.3,M.x,M.z,30);}
      else M.cd=0.4;}}
  else if(M.state==='home'){const dx=M.home.x-M.x,dz=M.home.z-M.z,d=Math.hypot(dx,dz);M.tu=angTo(M.tu,0,0.8*dt);
    if(d<0.6){M.state='park';M.x=M.home.x;M.z=M.home.z;wantH=M.home.h;}else{wantH=Math.atan2(dx,dz);wantV=Math.min(4,d);}
    if(d<0.6)M.h=angTo(M.h,M.home.h,0.9*dt);}
  // driving: it turns on the spot to face where it's going before setting off; whatever stands in its way gets flattened
  // (blocked by another vehicle a moment ago: it swings off to one side for a bit to get round it)
  if(M.detour>0){M.detour-=dt;wantH+=0.9*M.dside;wantV=Math.max(wantV,3);}
  const df=angDiff(M.h,wantH);if(wantV>0){const nh=angTo(M.h,wantH,0.9*dt);if(!milBlocked(M,M.x,M.z,nh,M.y)||milBlocked(M,M.x,M.z,M.h,M.y))M.h=nh;}
  const go=Math.abs(df)>0.6?Math.min(wantV,1.2):wantV;M.v+=(go-M.v)*Math.min(1,dt*1.5);
  if(M.v>0.05){const fx=Math.sin(M.h),fz=Math.cos(M.h),ax=M.x+fx*3,az=M.z+fz*3;
    if(groundAt(ax,az,M.y+2)-M.y>1.05||groundAt(ax-fz*1.2,az+fx*1.2,M.y+2)-M.y>1.05||groundAt(ax+fz*1.2,az-fx*1.2,M.y+2)-M.y>1.05){M.v=0;M.stuck+=dt;
      if(M.stuck>0.5){M.stuck=0;crushBall(ax,M.y+1,az,1.8);clang();}}
    else{const nx=M.x+fx*M.v*dt,nz=M.z+fz*M.v*dt;
      // another vehicle in the way stops it (unless it's already caught up in one, when it's let drive out)
      if(milBlocked(M,nx,nz,M.h,M.y)&&!milBlocked(M,M.x,M.z,M.h,M.y)){M.v=0;if(!(M.detour>0)){M.detour=1.5;M.dside=Math.random()<0.5?1:-1;}}
      else{M.stuck=0;M.x=nx;M.z=nz;}}}
  {const gy=groundAt(M.x,M.z,M.y+1.5);if(gy<M.y){M.vy-=20*dt;M.y=Math.max(gy,M.y+M.vy*dt);}else{M.vy=0;M.y+=(gy-M.y)*Math.min(1,dt*8);}}
  milPlace(M);milBoxes(M,M.v);milShove(M);
}
function updateHeli(M,V,dt){
  if(M.drv){drvHeli(M,dt);return;}
  const n=playing?nearestPlayer(M.x,M.z):null;let tx=M.home.x,tz=M.home.z,ty=G+1,face=M.home.h;
  M.spin+=((M.state==='park'||M.state==='man'||M.state==='idle'&&M.y<=groundAt(M.x,M.z,M.y+1)+0.05?0:1)-M.spin)*Math.min(1,dt*0.6);
  if(M.state==='hunt'&&n){const p=n.p;
    // circling him, well up, nose on him
    M.oa+=dt*0.3;tx=p.pos.x+Math.cos(M.oa)*22;tz=p.pos.z+Math.sin(M.oa)*22;ty=Math.max(p.pos.y,groundAt(tx,tz,H-2),groundAt(M.x,M.z,H-2))+13;face=Math.atan2(p.pos.x-M.x,p.pos.z-M.z);
    if(M.spin<0.8){tx=M.x;tz=M.z;ty=M.y;}   // (the rotor running up before it lifts)
    else{const mx=M.x+Math.sin(M.h)*2.6,my=M.y+1.2,mz=M.z+Math.cos(M.h)*2.6,d3=Math.hypot(p.pos.x-mx,p.pos.y+1-my,p.pos.z-mz),see=d3<70&&Math.abs(angDiff(M.h,face))<0.35&&lineClear(mx,my,mz,p.pos.x,p.pos.y+1.2,p.pos.z);
      // its gun: a burst of six, then a pause
      M.cd-=dt;if(M.burst>0){M.bt-=dt;if(M.bt<=0){M.bt=0.12;M.burst--;const hit=see&&!(p.dodge&&p.dodge.t<p.dodge.dur*0.85)&&Math.random()<0.3;
          const a=Math.random()*6.28,r=hit?0:1.5+Math.random()*2,ex=p.pos.x+Math.cos(a)*r,ez=p.pos.z+Math.sin(a)*r,ey=p.pos.y+(hit?1.2:0);tracer(mx,my,mz,ex,ey,ez);if(audio)sfx('Helicopter gun',()=>noise(0.06,0.1,2400,'highpass'));if(!hit)puff(ex,ey,ez,1,0x9a948a,0.2);
          if(hit){const h=Math.hypot(ex-mx,ez-mz)||1;damagePlayer(p,1,new V3(ex,ey,ez),new V3((ex-mx)/h,0.2,(ez-mz)/h),'Gunned down from a helicopter',MIL_CREW.heli);}}}
      else if(M.cd<=0){if(see){M.burst=6;M.bt=0;M.cd=3+Math.random()*1.5;}else M.cd=0.5;}
      // and now and then a rocket
      M.rcd-=dt;if(M.rcd<=0&&see&&M.burst<=0){const L=d3||1,sp=30;shot({kind:'rocket',x:mx,y:my,z:mz,vx:(p.pos.x-mx)/L*sp,vy:(p.pos.y+1-my)/L*sp,vz:(p.pos.z-mz)/L*sp,grav:0.5,fuse:5,R:3.4,dmg:4,cause:'Blown up by a helicopter rocket',by:MIL_CREW.heli,crush:2.4,vd:35,own:M});M.rcd=7+Math.random()*4;if(audio)sfx('Helicopter rocket',()=>noise(0.5,0.25,900,'bandpass'));}}}
  else if(M.state==='home'){const d=Math.hypot(M.home.x-M.x,M.home.z-M.z);ty=d>3?Math.max(M.y,G+14):G+1;if(d<3&&M.y<G+1.2){M.state='park';M.y=G+1;M.x=M.home.x;M.z=M.home.z;}face=d>3?Math.atan2(tx-M.x,tz-M.z):M.home.h;}
  else{tx=M.x;tz=M.z;ty=M.y;if(M.state==='idle'){ty=groundAt(M.x,M.z,M.y+1);face=M.h;}}   // (left by a goblin who flew it: it settles where it is)
  // flying: easing toward where it wants to be, never faster than 12 a second, tipped a little the way it's going
  const dx=tx-M.x,dz=tz-M.z,dh=Math.hypot(dx,dz),sp=Math.min(12,dh*0.8),vx=dh>0.01?dx/dh*sp:0,vz=dh>0.01?dz/dh*sp:0;
  if(M.spin>0.8||M.state==='home'){M.vy=0;const stuck=milBlocked(M,M.x,M.z,M.h,M.y),ny=M.y+Math.max(-5*dt,Math.min(5*dt,ty-M.y));   // (it won't fly into another vehicle)
    if(stuck||!milBlocked(M,M.x+vx*dt,M.z+vz*dt,M.h,M.y)){M.x+=vx*dt;M.z+=vz*dt;}
    if(stuck||!milBlocked(M,M.x,M.z,M.h,ny))M.y=ny;}
  // (sat with its rotor stopped, it rests on what's under it: blow that away and down it drops, hard enough to hurt it)
  else{const gy=groundAt(M.x,M.z,M.y+1);
    if(M.y>gy+0.02){M.vy-=20*dt;M.y=Math.max(gy,M.y+M.vy*dt);if(M.y<=gy){if(M.vy<-12){milHit(M,(-M.vy-12)*6);thud(0.5);}M.vy=0;}}else M.vy=0;}
  M.h=angTo(M.h,face,1.4*dt);M.pitch=Math.min(0.25,sp*0.02)*Math.cos(Math.atan2(vx,vz)-M.h);M.roll=0;   // (nose down going forward)
  M.rot.rotation.y+=dt*M.spin*28;M.trot.rotation.x+=dt*M.spin*40;
  milPlace(M);milBoxes(M,sp);milShove(M);
  if(M.spin>0.3&&audio&&playing&&n&&n.d<90){M.thT=(M.thT||0)-dt;if(M.thT<=0){M.thT=0.11;sfx('Helicopter rotor',()=>noise(0.08,0.05*M.spin*(1-n.d/90),180,'lowpass'));}}   // (the thud of its rotor)
}
function milHit(M,n,dir){
  if(M.dead)return;const I=MIL[M.kind];dmgPop(M.x,M.y+I.hy+0.8,M.z,Math.round(n),'#ffb04a');M.hp-=n;M.hurt=0.2;M.jolt=0.3;vHitFx(M.x,M.y+I.hy*0.6,M.z,n);
  if(!M.V.alert&&!calmNow())milAlert(M.V,(nearestPlayer(M.x,M.z)||{}).p);   // (shot at, the whole base wakes up)
  if(M.hp>0)return;
  M.dead=true;M.deadT=0;M.fall=M.kind==='heli'&&M.y>G+2;M.vy=0;wrecked[M.key]=1;save();
  if(M.crew&&M.crew!==MIL_CREW[M.kind]){const o=crewAt(M.x,M.z,M.h,I.hx+1.2,0);crewCorpse('soldier',M.crew,o.x,M.y+1,o.z,'Killed in their '+I.name.toLowerCase());}M.crew=null;   // (whoever was in it)
  const bl=blasts[blastIdx++%blasts.length];bl.t=0.8;bl.s=2.2;for(const f of bl.m){f.position.set(M.x,M.y+1.5,M.z);f.visible=true;}smoke(M.x,M.y+2,M.z,22,0x262626);
  for(let k=0;k<8;k++){const d=debris[(debrisIdx++)%debris.length];d.m.position.set(M.x+(Math.random()-.5)*3,M.y+1.5+Math.random(),M.z+(Math.random()-.5)*4);d.v.set((Math.random()-.5)*18,8+Math.random()*10,(Math.random()-.5)*18);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=25;d.m.visible=true;}
  milDark(M);if(M.kind==='tank')M.tur.rotation.z=0.25;
  if(M.kind==='heli'&&!M.fall)airCrash(M.x,M.y+1,M.z,3.5,'Blown up with a helicopter');   // (shot down where it sits, or just above: it goes up there)
  sfx(I.name+' destroyed',()=>{noise(1.1,1,500,'lowpass');tone('sawtooth',70,16,1.3,0.3);});addShake(0.9,M.x,M.z,45);hitGoblins(M.x,M.z,8,8,'Blown up with a '+I.name.toLowerCase(),M.y+1);
  if(BLAME!=='acc'){score+=I.pts;flashLabel(I.name+' destroyed  +'+I.pts,(nearestPlayer(M.x,M.z)||{}).p);}
}
// a wreck: a helicopter shot down drops, spinning, and goes up where it lands; then it all lies there smouldering
function milWreck(M,dt){
  M.deadT+=dt;
  if(M.fall){M.vy-=22*dt;M.y+=M.vy*dt;M.h+=dt*3;const gy=groundAt(M.x,M.z,M.y+2);
    if(M.y<=gy){M.y=gy;M.fall=false;M.roll=0.4;airCrash(M.x,M.y,M.z,5,'Crushed by a falling helicopter');}
    if(Math.random()<dt*20)smoke(M.x,M.y+2,M.z,2,0x262626);milPlace(M);return;}
  {const gy=groundAt(M.x,M.z,M.y+1);if(M.y>gy+0.02){M.vy-=22*dt;M.y=Math.max(gy,M.y+M.vy*dt);milPlace(M);}else M.vy=0;}   // (the ground under it blown away: down it goes)
  if(M.deadT<60&&Math.random()<dt*3)smoke(M.x,M.y+2,M.z,1,0x262626);
}
function siteRouse(V){
  if(V.roused)return;V.roused=true;V.awayT=0;const n=nearestPlayer(V.cx,V.cz),me=n&&n.p;
  V.slots.forEach((g,i)=>{if(!g||g.state!=='chase')return;g.gunCD=0.4+i*0.35+Math.random()*0.5;g.bombCD=2+Math.random()*3;if(me)g.heading=Math.atan2(me.pos.x-g.pos.x,me.pos.z-g.pos.z);});
  if(audio)tone('square',330,160,0.5,0.07);
  if(me)flashLabel(V.style==='militia'?'The militia opens up on you!':V.style==='prepper'?'The preppers defend their compound!':"You've found the thieves' hideout!",me);
}
