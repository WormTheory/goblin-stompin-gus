// ---- the theme park's rides: each part has a stand-in in TRAIN_BOXES as well, so they're hit like trains and planes, and
// ridden like them too. What's wrecked stays wrecked (saved with the world): the park's a venue, rebuilt whenever you come back ----
const RIDE_HP={car:40,gond:30,wheel:250,carousel:120};
const ridePr=(T,i,hx,hz,hy)=>({isTrain:true,isPlane:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx,hz,hy,heading:0,top:0,veh:'plane',T,i});
const rideDark=g=>g.traverse(o=>{if(o.isMesh)o.material=TRM.dark;});
function rideBang(x,y,z,s,T,r,n,cause){
  blastFx(x,y,z,0.6,s);smoke(x,y,z,8+Math.round(s*6),0x262626);
  for(let k=0;k<6;k++){const d=debris[(debrisIdx++)%debris.length];d.m.position.set(x+(Math.random()-.5)*2,y+Math.random(),z+(Math.random()-.5)*2);d.v.set((Math.random()-.5)*16,8+Math.random()*10,(Math.random()-.5)*16);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=25;d.m.visible=true;}
  noise(1,1,600,'lowpass');tone('sawtooth',60,18,1.2,0.3);addShake(0.3+s*0.3,x,z,40);hitGoblins(x,z,r,n,cause,y);
  for(const pr of trainsNear(x,z,r,y-r,y+r))if(pr.T!==T)trainHit(pr.T,n,null,pr.i);   // (and whatever else is close: a train of them can go up together)
}
// Not every park got all of its ground built (part of one can land on open country or be left to ordinary streets), so a
// missing block only counts as broken if something broke it: that's what the edits are.
const rideBroke=(x,y,z)=>get(x,y,z)===AIR&&edits[x+','+y+','+z]!==undefined;
const rideBuilt=(x,y,z,id)=>get(x,y,z)===id||rideBroke(x,y,z);
// a ride with nothing under it isn't put up at all. (One look a frame, as looking can mean building a chunk there and then.)
function rideSurvey(V){
  const Q=V.survey,K=V.K,W=V.W,Cs=V.Cs,C=K.C;
  if(!Q.init){Q.init=true;Q.i=0;Q.track=0;Q.legs=0;Q.n=40;}
  if(Q.i<Q.n){const t=Q.i/Q.n*Math.PI*2,x=Math.floor(C.cu+Math.cos(t)*C.a),z=Math.floor(C.cv+Math.sin(t)*C.b),h=G+coasterH(t);let f=false;
    for(let dx=-1;dx<=1&&!f;dx++)for(let dz=-1;dz<=1&&!f;dz++)for(let y=h-1;y<=h+1&&!f;y++)if(rideBuilt(x+dx,y,z+dz,METAL))f=true;if(f)Q.track++;Q.i++;return false;}
  if(Q.i<Q.n+4){const j=Q.i-Q.n,dz=j<2?-2:2,sd=j%2?1:-1;if(rideBuilt(W.cu+sd*Math.round((W.top-G-1)*0.42),G+1,W.cv+dz,METAL))Q.legs++;Q.i++;return false;}
  if(Q.track<Q.n*0.9&&!K.off){K.off=true;K.halted=true;for(const c of K.cars){c.g.visible=false;c.dead=true;c.pr.alive=false;}}
  if(Q.legs<4&&!W.dead){W.dead=true;W.g.visible=false;W.rim.alive=false;for(const q of W.gonds){q.dead=true;q.pr.alive=false;}}
  if(!Cs.dead&&!rideBuilt(Cs.x,G,Cs.z,PLANKS)){Cs.dead=true;Cs.pr.alive=false;Cs.g.visible=false;}
  V.survey=null;V.ride.visible=true;return true;
}
function makeRides(V){
  const S=V.S,k=V.k,X0=S.ax*CELL,Z0=S.az*CELL,R2=plotInfo(S.ax,S.az).theme,g=new THREE.Group(),C=R2.coaster,W2=R2.wheel,C2=R2.carousel;scene.add(g);V.ride=g;g.visible=false;V.survey={};
  // the coaster's train of cars running round its track
  {const K={isRide:true,kind:'coaster',k:k+':coaster',C:{cu:X0+C.cu,cv:Z0+C.cv,a:C.a,b:C.b},th:0,sp:0.5,cars:[],checkT:0,halted:false,off:false},W0=wrecked[K.k];
   for(let i=0;i<4;i++){const cg=new THREE.Group(),m=new THREE.Mesh(LM_BOX,i?LMM.coach:LMM.loco);m.scale.set(1.3,0.8,2.0);m.position.y=0.5;cg.add(m);g.add(cg);K.cars.push({g:cg,hp:RIDE_HP.car,dead:false,fly:null,pr:ridePr(K,i,0.65,1.0,0.9)});}
   if(W0){K.th=W0.th||0;K.sp=0;K.halted=true;K.off=!!W0.off;K.cars.forEach((c,i)=>{if(K.off)c.g.visible=false;c.dead=K.off||!!(W0.dead&&W0.dead[i]);c.pr.alive=!c.dead;if(c.dead)rideDark(c.g);});}
   V.K=K;}
  // the Ferris wheel turning, its gondolas hanging level
  {const wg=new THREE.Group(),hub={x:X0+W2.cu+0.5,y:W2.hub+0.5,z:Z0+W2.cv+0.5},W={isRide:true,kind:'wheel',k:k+':wheel',g:wg,hub,R:W2.R,cu:X0+W2.cu,cv:Z0+W2.cv,top:W2.hub,gonds:[],hp:RIDE_HP.wheel,dead:!!wrecked[k+':wheel'],fall:null,checkT:0};
   wg.position.set(hub.x,hub.y,hub.z);g.add(wg);W.rim=ridePr(W,-1,1,1,1);
   for(let i=0;i<16;i++){const a=i/16*Math.PI*2,seg=new THREE.Mesh(LM_BOX,LMM.bar);seg.scale.set(0.25,2*W2.R*Math.sin(Math.PI/16)+0.1,0.25);seg.position.set(Math.cos(a)*W2.R,Math.sin(a)*W2.R,0);seg.rotation.z=a;wg.add(seg);
     if(i%2===0){const sp=new THREE.Mesh(LM_BOX,LMM.bar);sp.scale.set(W2.R,0.14,0.14);sp.position.set(Math.cos(a)*W2.R/2,Math.sin(a)*W2.R/2,0);sp.rotation.z=a;wg.add(sp);
       const gd=new THREE.Group();gd.position.set(Math.cos(a)*W2.R,Math.sin(a)*W2.R,0);const box=new THREE.Mesh(LM_BOX,LMM['g'+(i%3)]||(LMM['g'+(i%3)]=new THREE.MeshLambertMaterial({color:[0xe03a3a,0x3a8ae0,0xf0c030][i%3]})));box.scale.set(1.3,1.2,1.6);box.position.y=-1.0;gd.add(box);wg.add(gd);
       const n=W.gonds.length;W.gonds.push({g:gd,a,hp:RIDE_HP.gond,dead:false,pr:ridePr(W,n,0.65,0.8,1.2)});}}
   if(W.dead){wg.position.y=G+1.5;wg.rotation.x=Math.PI/2;rideDark(wg);for(const q of W.gonds){q.dead=true;q.pr.alive=false;}W.rim.alive=false;}
   V.W=W;}
  // the carousel going round with its horses rising and falling
  {const cg=new THREE.Group();cg.position.set(X0+C2.cu,G+1.2,Z0+C2.cv);g.add(cg);
   const roof=new THREE.Mesh(LM_CONE,LMM.canopy);roof.position.y=4.6;cg.add(roof);const pole=new THREE.Mesh(LM_BOX,LMM.gold);pole.scale.set(0.5,4.6,0.5);pole.position.y=2.3;cg.add(pole);const horses=[];
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2,hg=new THREE.Group();hg.position.set(Math.cos(a)*3.6,0,Math.sin(a)*3.6);hg.rotation.y=-a;const pl=new THREE.Mesh(LM_BOX,LMM.gold);pl.scale.set(0.1,4.2,0.1);pl.position.y=2.1;hg.add(pl);
     const hb=new THREE.Mesh(LM_BOX,LMM['h'+(i%3)]||(LMM['h'+(i%3)]=new THREE.MeshLambertMaterial({color:[0xf4f0e8,0x8a5a32,0x2a2a2a][i%3]})));hb.scale.set(0.5,0.6,1.4);hb.position.y=1.3;hg.add(hb);const hh=new THREE.Mesh(LM_BOX,hb.material);hh.scale.set(0.4,0.8,0.4);hh.position.set(0,1.75,0.7);hg.add(hh);
     cg.add(hg);horses.push({hg,ph:i});}
   const Cs={isRide:true,kind:'carousel',k:k+':carousel',g:cg,horses,x:X0+C2.cu,z:Z0+C2.cv,hp:RIDE_HP.carousel,dead:!!wrecked[k+':carousel'],checkT:0};Cs.pr=ridePr(Cs,0,5.6,5.6,6.6);Cs.pr.pos.set(Cs.x,G+1,Cs.z);Cs.pr.top=G+7.6;
   if(Cs.dead)carouselWreck(Cs);V.Cs=Cs;}
}
function carouselWreck(Cs){Cs.dead=true;Cs.pr.alive=false;rideDark(Cs.g);Cs.g.position.y=G+0.2;Cs.g.rotation.z=0.3;Cs.g.rotation.x=-0.15;}
function wheelFall(W,why){
  if(W.dead||W.fall)return;W.fall={vy:-1,sg:Math.random()<.5?1:-1};W.rim.alive=false;for(const q of W.gonds)q.pr.alive=false;
  rideBang(W.hub.x,W.hub.y,W.hub.z,why?1.2:1.8,W,6,10,'Blown up with a Ferris wheel');crushBall(W.hub.x,W.top,W.hub.z,4);
  award(1000,'Ferris wheel destroyed',W.hub.x,W.hub.y,W.hub.z);
}
function coasterMark(K){wrecked[K.k]={th:K.th,off:K.off,dead:K.cars.map(c=>c.dead)};save();}
function rideHit(T,n,ci){
  if(T.kind==='coaster'){const c=T.cars[ci];if(!c||c.dead||c.fly)return;const p=c.g.position;dmgPop(p.x,p.y+1.2,p.z,Math.round(n),'#ffb04a');c.hp-=n;if(c.hp>0)return;
    // that car goes up and the rest grind to a stop on the track; they can still be taken apart
    c.dead=true;c.pr.alive=false;rideDark(c.g);c.g.rotation.z=(ci%2?1:-1)*0.4;T.halted=true;rideBang(p.x,p.y+.5,p.z,0.8,T,4,6,'Blown up with a roller coaster');
    if(T.cars.every(q=>q.dead))award(700,'Roller coaster destroyed',p.x,p.y+2,p.z);else award(200,'Coaster car destroyed',p.x,p.y+2,p.z);coasterMark(T);return;}
  if(T.kind==='wheel'){if(T.dead||T.fall)return;
    if(ci>=0){const q=T.gonds[ci];if(!q||q.dead)return;const p=q.pr.pos;dmgPop(p.x,p.y+1,p.z,Math.round(n),'#ffb04a');q.hp-=n;if(q.hp>0)return;
      q.dead=true;q.pr.alive=false;q.g.visible=false;rideBang(p.x,p.y,p.z,0.6,T,3,4,'Blown up with a gondola');award(50,'Gondola destroyed',p.x,p.y+1,p.z);return;}
    dmgPop(T.hub.x,T.hub.y,T.hub.z,Math.round(n),'#ffb04a');T.hp-=n;if(T.hp<=0)wheelFall(T);return;}
  if(T.kind==='carousel'){if(T.dead)return;dmgPop(T.x,G+8,T.z,Math.round(n),'#ffb04a');T.hp-=n;if(T.hp<=0)carouselBlow(T);}
}
// every ride part and zoo animal still standing, for the health bars over the view (Options' Health bars, drawDbgOverlay):
// fn(x, y, z, health, its most) at the spot over each, as other vehicles' bars are. (Online a guest's rides and animals
// aren't sent their health: netHp falls back to what this copy has, as it does for anything else not sent.)
function rideBarsEach(fn){for(const V of venues.values()){
  if(V.kind==='theme'&&V.ride&&V.ride.visible&&!V.survey){const K=V.K,W=V.W,Cs=V.Cs;
    if(K&&!K.off)for(const c of K.cars)if(!c.dead&&!c.fly)fn(c.pr.pos.x,c.pr.pos.y+1.6,c.pr.pos.z,netHp(c,c.hp),RIDE_HP.car);
    if(W&&!W.dead&&!W.fall){fn(W.hub.x,W.hub.y+W.R+1.2,W.hub.z,netHp(W,W.hp),RIDE_HP.wheel);   // (the wheel itself, over its top; each gondola its own)
      for(const q of W.gonds)if(!q.dead)fn(q.pr.pos.x,q.pr.top+0.6,q.pr.pos.z,netHp(q,q.hp),RIDE_HP.gond);}
    if(Cs&&!Cs.dead)fn(Cs.x,Cs.pr.top+0.6,Cs.z,netHp(Cs,Cs.hp),RIDE_HP.carousel);}
  else if(V.kind==='zoo'&&V.animals)for(const A of V.animals){if(A.dead||!A.pr)continue;const I=ANIMALS[A.sp];fn(A.x,A.g.position.y+I.hy+0.4,A.z,netHp(A,A.hp),I.hp);}}}
function carouselBlow(Cs){
  carouselWreck(Cs);wrecked[Cs.k]=1;save();rideBang(Cs.x,G+3,Cs.z,1.4,Cs,7,8,'Blown up with a carousel');
  award(300,'Carousel destroyed',Cs.x,G+5,Cs.z);
}
// is the track still there at this point round the circuit? (a car's the width of it, and the height goes in steps, so look close by)
function coasterTrackAt(C,t){const x=Math.floor(C.cu+Math.cos(t)*C.a),z=Math.floor(C.cv+Math.sin(t)*C.b),h=G+coasterH(t);
  let broke=false;for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(let y=h-1;y<=h+1;y++){const b=get(x+dx,y,z+dz);if(b===METAL)return true;if(b===AIR&&edits[(x+dx)+','+y+','+(z+dz)]!==undefined)broke=true;}return !broke;}
const rideNear=(x,z,r)=>players.some(p=>p.active&&Math.hypot(p.pos.x-x,p.pos.z-z)<r);
function updateRides(V,dt){
  const K=V.K,W=V.W,Cs=V.Cs,C=K.C;
  // the coaster: speed from the slope, slow up the lift hills, racing down the drops
  if(!K.off){
    if(K.halted){K.sp=Math.max(0,K.sp-dt*1.2);}
    else{const h0=coasterH(K.th),h1=coasterH(K.th+0.05);K.sp=Math.max(0.12,Math.min(1.4,K.sp+(h0-h1)*dt*1.6+(K.sp<0.25?dt*0.2:0)));}
    K.th+=K.sp*dt*0.55;
    // (the track gone just ahead: off it goes, at whatever speed it was doing, and comes down wherever that takes it)
    K.checkT-=dt;if(K.checkT<=0&&K.sp>0){K.checkT=0.1;const ahead=K.th+2.5/((C.a+C.b)/2);
      if(rideNear(C.cu+Math.cos(ahead)*C.a,C.cv+Math.sin(ahead)*C.b,110)&&!coasterTrackAt(C,ahead)){K.off=true;
        K.cars.forEach((c,i)=>{if(c.dead)return;const t=K.th-i*0.11,tx=-Math.sin(t)*C.a,tz=Math.cos(t)*C.b,l=Math.hypot(tx,tz)||1,v=Math.min(30,Math.max(6,K.sp*0.55*l));c.fly={vx:tx/l*v,vz:tz/l*v,vy:4+Math.random()*3,sx:(Math.random()-.5)*4,sz:(Math.random()-.5)*4};c.pr.alive=false;});
        award(500,'Roller coaster derailed',C.cu,G+6,C.cv);coasterMark(K);}}
  }
  K.cars.forEach((c,i)=>{const cg=c.g;
    if(c.fly){const F=c.fly,P=cg.position;F.vy-=26*dt;P.x+=F.vx*dt;P.z+=F.vz*dt;P.y+=F.vy*dt;cg.rotation.x+=F.sx*dt;cg.rotation.z+=F.sz*dt;const gy=groundAt(P.x,P.z,P.y+2);
      if(gy!==null&&P.y<=gy||P.y<=G){P.y=gy!==null?gy:G;c.fly=null;c.dead=true;rideDark(cg);crushBall(P.x,P.y,P.z,2.5);rideBang(P.x,P.y+.5,P.z,0.9,K,5,8,'Flattened by a roller coaster car');}
      return;}
    if(K.off||!cg.visible)return;
    const t=K.th-i*0.11,x=C.cu+Math.cos(t)*C.a,z=C.cv+Math.sin(t)*C.b,h=coasterH(t),tx=-Math.sin(t)*C.a,tz=Math.cos(t)*C.b,hd=Math.atan2(tx,tz),y=G+h+1;
    cg.position.set(x,y,z);if(!c.dead)cg.rotation.set(0,hd,0);else cg.rotation.y=hd;
    const pr=c.pr;pr.pos.set(x,y,z);pr.heading=hd;pr.top=y+1.1;   // (a touch over the car: a step up in the track mustn't take a rider's footing)
    if(!c.dead)TRAIN_BOXES.push({x,z,tx:Math.sin(hd),tz:Math.cos(hd),y0:y,top:pr.top,v:0,hx:0.65,hz:1.0,proxy:pr});});
  // the wheel: it stands while its A-frame does. Lose a side (or the axle) and the whole thing comes down
  if(!W.dead&&!W.fall){
    W.g.rotation.z+=dt*0.14;const rot=W.g.rotation.z;for(const q of W.gonds)q.g.rotation.z=-rot;
    const hub=W.hub,R=W.R,ext=R*Math.sin(Math.PI/16)+0.6;W.rim.pos.set(hub.x,hub.y,hub.z);
    TRAIN_BOXES.push({x:hub.x,z:hub.z,tx:0,tz:1,y0:hub.y-1.5,top:hub.y+1.5,v:0,hx:1.5,hz:2.4,proxy:W.rim,soft:true});
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2+rot,y=hub.y+Math.sin(a)*R;TRAIN_BOXES.push({x:hub.x+Math.cos(a)*R,z:hub.z,tx:0,tz:1,y0:y-ext,top:y+ext,v:0,hx:ext,hz:0.6,proxy:W.rim,soft:true});}
    for(const q of W.gonds){if(q.dead)continue;const a=q.a+rot,x=hub.x+Math.cos(a)*R,y=hub.y+Math.sin(a)*R-1.6,pr=q.pr;pr.pos.set(x,y,hub.z);pr.top=y+1.2;TRAIN_BOXES.push({x,z:hub.z,tx:0,tz:1,y0:y,top:pr.top,v:0,hx:0.65,hz:0.8,proxy:pr});}
    W.checkT-=dt;if(W.checkT<=0&&rideNear(hub.x,hub.z,110)){W.checkT=0.5;let whole=0;
      for(const dz of [-2,2])for(const sd of [-1,1]){let ok=true;for(let y=G+1;y<W.top&&ok;y++)if(rideBroke(W.cu+sd*Math.round((W.top-y)*0.42),y,W.cv+dz))ok=false;if(ok)whole++;}
      if(whole<=2||rideBroke(W.cu,W.top,W.cv-2)&&rideBroke(W.cu,W.top,W.cv+2))wheelFall(W,true);}
  }else if(W.fall){const F=W.fall,gp=W.g.position;F.vy-=26*dt;gp.y+=F.vy*dt;W.g.rotation.x=Math.min(Math.PI/2,Math.abs(W.g.rotation.x)+dt*1.1)*F.sg;
    if(gp.y<=G+1.5){gp.y=G+1.5;W.g.rotation.x=F.sg*Math.PI/2;W.fall=null;W.dead=true;rideDark(W.g);for(const q of W.gonds)q.dead=true;wrecked[W.k]=1;save();
      // down it comes, flat, on whatever's under the ring
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;crushBall(W.hub.x+Math.cos(a)*W.R,G+2,W.hub.z+Math.sin(a)*W.R,3);}
      rideBang(W.hub.x,G+2,W.hub.z,2,W,W.R+2,99,'Flattened by a falling Ferris wheel');addShake(1.2,W.hub.x,W.hub.z,60);}}
  // the carousel: goes round till it's hit hard enough, or the floor's blown out from under it
  if(!Cs.dead){const tnow=performance.now()/1000;Cs.g.rotation.y+=dt*0.7;for(const H2 of Cs.horses)H2.hg.position.y=Math.sin(tnow*2.2+H2.ph)*0.35;
    TRAIN_BOXES.push({x:Cs.x,z:Cs.z,tx:0,tz:1,y0:G+1,top:Cs.pr.top,v:0,hx:5.6,hz:5.6,proxy:Cs.pr,soft:true});
    Cs.checkT-=dt;if(Cs.checkT<=0&&rideNear(Cs.x,Cs.z,110)){Cs.checkT=0.5;let gone=0;for(const [a,b] of [[0,0],[3,0],[-3,0],[0,3],[0,-3]])if(rideBroke(Cs.x+a,G,Cs.z+b))gone++;if(gone>=3)carouselBlow(Cs);}}
}
// the trains: a locomotive and three coaches
const TRM={loco:new THREE.MeshLambertMaterial({color:0x2a4a8a}),coach:new THREE.MeshLambertMaterial({color:0xc8ccd0}),dark:new THREE.MeshLambertMaterial({color:0x22262c}),win:new THREE.MeshLambertMaterial({color:0x3a5a7a}),red:new THREE.MeshLambertMaterial({color:0xc8302a}),white:new THREE.MeshLambertMaterial({color:0xf4f4f0}),wing:new THREE.MeshLambertMaterial({color:0xd8dce2})};
function makeTrainCar(loco,rear){
  const g=new THREE.Group(),bx=(m,sx,sy,sz,x,y,z)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);g.add(o);return o;};
  bx(TRM.dark,2.2,0.7,9.6,0,0.35,0);bx(loco?TRM.loco:TRM.coach,2.6,2.8,9.8,0,2.1,0);bx(TRM.win,2.64,0.8,8.6,0,2.6,0);
  if(loco){const e=rear?-1:1;bx(TRM.red,2.66,0.4,9.9,0,1.2,0);bx(TRM.win,2.2,0.9,0.06,0,2.8,e*4.92);bx(LMM.ledOn2,0.4,0.25,0.06,0,1.6,e*4.93);}
  return g;
}
// an airport's airliners (where they go and when: vehicles/airfields.js)
// (built at its old size, then stretched to about two-thirds of a real short-haul airliner's, as the game's other
// vehicles are: PLANE_K, longer more than it's wider. Its boxes are PLANE_DIM)
const PLANE_K=[1.15,1.25,1.45];
function makePlane(i){
  const g0=new THREE.Group(),g=new THREE.Group();g.scale.set(...PLANE_K);g0.add(g);const bx=(m,sx,sy,sz,x,y,z)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);g.add(o);return o;},liv=[TRM.red,TRM.loco,LMM.gold][i%3];
  bx(TRM.white,2.5,2.5,17,0,2.4,0);bx(TRM.white,1.8,1.1,1.6,0,1.95,9.2);bx(LPM.glass,1.7,0.7,1.3,0,2.85,9.05);bx(TRM.white,1.8,0.12,1.6,0,3.26,9.2);   // (the nose, the cockpit's windscreen and its roof)bx(TRM.win,2.54,0.4,13,0,2.9,0.5);bx(liv,2.56,0.35,16,0,1.9,0);
  bx(TRM.wing,21,0.35,3.4,0,1.7,0.6);for(const s2 of[-1,1])bx(TRM.dark,1.2,1.2,2.8,s2*4.8,0.9,1.2);
  bx(liv,0.35,3.6,2.8,0,4.6,-7.2);bx(TRM.wing,7.2,0.3,1.9,0,2.6,-7.6);
  for(const [x,z] of [[0,6],[-1.6,-0.4],[1.6,-0.4]])bx(TRM.dark,0.4,1.0,0.6,x,0.5,z);
  // (the captain and first officer, sat behind the windscreen: drawn unstretched, on the outer group)
  planePilot(g0,[[-0.5*PLANE_K[0],2.62*PLANE_K[1],8.9*PLANE_K[2]],[0.5*PLANE_K[0],2.62*PLANE_K[1],8.9*PLANE_K[2]]],1.1);
  return g0;
}
// a fighter jet (the debug menu's only, so far): a grey dart of a fuselage with a pointed nose, the canopy, delta
// wings, two tail fins canted out and the twin engines' glowing nozzles. It flies on the plane's own model, only
// harder and faster (pl.jet: see drvPlane), and has a cannon and missiles
// (built full size, about a real Hornet's, then shrunk to two-thirds as the game's other vehicles are: JET_K)
const JET_K=0.65;
function makeJet(){
  const g0=new THREE.Group(),g=new THREE.Group();g.scale.setScalar(JET_K);g0.add(g);const bx=(m,sx,sy,sz,x,y,z)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);g.add(o);return o;},
    gry=JETM.grey,dk=JETM.dark;
  bx(gry,1.8,1.5,12,0,2.1,-1.0);bx(gry,1.3,1.1,3.0,0,2.15,6.4);bx(gry,0.8,0.7,1.8,0,2.2,8.6);bx(dk,0.3,0.3,0.8,0,2.2,9.7);
  bx(JETM.glass,0.9,0.6,2.6,0,3.0,4.4);bx(gry,0.95,0.3,2.0,0,2.85,2.4);
  for(const s2 of[-1,1]){bx(gry,0.9,1.0,3.2,s2*1.25,2.0,1.8);   // (the intakes)
    for(let k=0;k<4;k++)bx(gry,1.3,0.28,4.6-k*1.05,s2*(1.4+k*1.05),1.75,-1.6-k*0.55);   // (a delta wing, stepped out to its tip)
    {const f=bx(gry,0.22,2.1,2.0,s2*0.75,3.6,-5.6);f.rotation.z=-s2*0.3;}
    bx(gry,1.6,0.2,1.6,s2*1.55,2.05,-6.4);bx(dk,0.8,0.8,0.6,s2*0.45,2.0,-7.3);bx(JETM.glow,0.6,0.6,0.08,s2*0.45,2.0,-7.62);}
  for(const o of g.children)o.position.y-=0.5;   // (it sits low on short legs)
  for(const [x,z] of [[0,5.6],[-1.3,-1.6],[1.3,-1.6]])bx(dk,0.3,0.85,0.4,x,0.42,z);
  return g0;
}
const JETM={grey:new THREE.MeshLambertMaterial({color:0x7d8794}),dark:new THREE.MeshLambertMaterial({color:0x2e3238}),glass:new THREE.MeshLambertMaterial({color:0x2a3a48,emissive:0x0a1420}),glow:new THREE.MeshBasicMaterial({color:0xff9a3a})};
// a plane's size, for its boxes and what it runs into: the fuselage's half width, half length and height, the wings'
// half span, half chord and top, and how far ahead its nose reaches
// half width, half length and height, the wings' half span, half chord, top and how far behind the middle, and how far
// ahead its nose reaches
const PLANE_DIM={hx:1.44,hz:14.4,hy:4.56,wx:12.1,wz:2.5,wy:2.4,wo:0.87,nose:13.8},JET_DIM={hx:1.0,hz:5.8,hy:2.7,wx:3.4,wz:1.5,wy:0.9,wo:0,nose:6.4};
const planeDim=pl=>pl&&pl.jet?JET_DIM:pl&&pl.light?LIGHT_DIM:PLANE_DIM;
// a plane's body, for standing on and hitting: the fuselage and the wings, each a box like a train car's
const PLANE_HP=300;
function planeBoxes(pl,v){
  const g=pl.g,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),y=g.position.y;if(!g.visible||pl.fall)return;
  const Q=planeDim(pl);
  if(!pl.pr)pl.pr=[0,1].map(i=>({isTrain:true,isPlane:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:i?Q.wx:Q.hx,hz:i?Q.wz:Q.hz,hy:i?Q.wy:Q.hy,heading:0,top:0,veh:'plane',T:pl,i}));
  for(const pr of pl.pr){pr.alive=!pl.dead;pr.pos.set(g.position.x,y,g.position.z);pr.heading=h;pr.top=y+pr.hy;}
  TRAIN_BOXES.push({x:g.position.x,z:g.position.z,tx,tz,y0:y,top:pl.pr[0].top,v,hx:Q.hx,hz:Q.hz,proxy:pl.pr[0]});
  // (the wings are overhead to anyone on the ground: only their top counts)
  TRAIN_BOXES.push({x:g.position.x+tx*Q.wo,z:g.position.z+tz*Q.wo,tx,tz,y0:pl.pr[1].top+1,top:pl.pr[1].top,v:0,hx:Q.wx,hz:Q.wz,proxy:pl.pr[1]});
}
// hitting a plane: it takes a lot. Wrecked on the ground it burns where it stands; wrecked in the air it comes down, hard
// (what a moving plane runs into, its body or the end of a wing: struck, thrown aside and up, hurt)
function planeStrike(pl,v){
  const g=pl.g,y0=g.position.y,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),k=Math.max(0.3,Math.min(1.6,v/24)),x0=g.position.x,z0=g.position.z;
  const Q=planeDim(pl),hit=(o,r,H)=>{if(o.pos.y>y0+Q.hy||o.pos.y+H<y0)return null;const dx=o.pos.x-x0,dz=o.pos.z-z0,R=Math.max(Q.hz,Q.wx)+2;if(dx*dx+dz*dz>R*R+r*r*4)return null;const al=dx*tx+dz*tz,ac=-dx*tz+dz*tx;
    if(!(Math.abs(al)<=Q.hz+r&&Math.abs(ac)<=Q.hx+r||o.pos.y+H>=y0+Q.wy-0.4&&Math.abs(al-Q.wo)<=Q.wz+r&&Math.abs(ac)<=Q.wx+r))return null;
    const sg=ac>=0?1:-1;return new V3(tx*.8-tz*sg*.6,0,tz*.8+tx*sg*.6);};
  for(const c of cars){if(!c.alive||c.trainT>0)continue;const d=hit(c,c.hx,c.hy||1.4);
    if(d){c.trainT=1;damageCar(c,Math.round(10+24*k),d,'acc');if(c.alive)launchCar(c,6+10*k,d.clone().multiplyScalar(1+2.5*k),6);clang();thud(0.7);}}
  for(const g2 of goblins){if(g2.hp<=0||g2.trainT>0||g2.state==='wait'||g2.state==='dead'||!g2.root.visible)continue;const d=hit(g2,0.5,1.4);
    if(d){g2.trainT=1;damageGoblin(g2,Math.round(4+12*k),g2.pos.clone(),d.clone().multiplyScalar(1+k),'Hit by a plane',ACCIDENT);g2.vy=Math.max(g2.vy||0,12+16*k);g2.kv.x+=d.x*(14+26*k);g2.kv.z+=d.z*(14+26*k);}}
}
function planeHit(pl,n){
  if(vehDamage('plane',pl,n)<2)return;const g=pl.g,p=g.position;   // (the steps every vehicle shares: registry.js)
  blastFx(p.x,p.y+3,p.z,0.8,2.4);smoke(p.x,p.y+3,p.z,26,0x262626);
  for(let k=0;k<10;k++){const d=debris[(debrisIdx++)%debris.length];d.m.position.set(p.x+(Math.random()-.5)*8,p.y+2+Math.random()*2,p.z+(Math.random()-.5)*12);d.v.set((Math.random()-.5)*20,8+Math.random()*12,(Math.random()-.5)*20);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=25;d.m.visible=true;}
  g.traverse(o=>{if(o.isMesh){o.userData.mat=o.userData.mat||o.material;o.material=TRM.dark;}});
  noise(1.2,1,500,'lowpass');tone('sawtooth',70,16,1.4,0.32);addShake(1,p.x,p.z,50);hitGoblins(p.x,p.z,12,10,'Blown up with a plane',p.y+1);
  if(p.y>G+3){pl.fall=true;pl.vy=-2;pl.fv=pl.v||40;}else g.rotation.z=(Math.random()<.5?1:-1)*(0.12+Math.random()*0.14);
}
function planeWreck(pl,V,dt){
  const g=pl.g,p=g.position;pl.deadT+=dt;
  if(pl.fall){pl.vy-=26*dt;pl.fv*=1-dt*.25;const h=g.rotation.y;p.x+=Math.sin(h)*pl.fv*dt;p.z+=Math.cos(h)*pl.fv*dt;p.y+=pl.vy*dt;g.rotation.x=Math.min(.7,g.rotation.x+dt*.4);g.rotation.z+=dt*.5;if(Math.random()<dt*20)smoke(p.x,p.y+3,p.z,2,0x262626);
    const gy=groundAt(p.x,p.z,p.y+2);if(p.y<=gy||p.y<=G+1){p.y=Math.max(gy,G+1);pl.fall=false;g.rotation.x=0;g.rotation.z=.2;airCrash(p.x,p.y,p.z,8,'Flattened by a falling plane');
      blastFx(p.x,p.y+2,p.z,0.8,2.4);smoke(p.x,p.y+2,p.z,26,0x262626);noise(1.4,1,400,'lowpass');addShake(1.2,p.x,p.z,60);hitGoblins(p.x,p.z,14,14,'Flattened by a falling plane',p.y+1);}}
  else if(Math.random()<dt*3)smoke(p.x,p.y+3,p.z,2,0x262626);
  // (a new one's been brought in, once no one's looking)
  if(pl.deadT>120&&!players.some(q=>q.active&&Math.hypot(p.x-q.pos.x,p.z-q.pos.z)<350)){pl.dead=false;pl.free=null;pl.hp=planeMax(pl);g.traverse(o=>{if(o.isMesh&&o.userData.mat)o.material=o.userData.mat;});g.rotation.set(0,0,0);if(pl.fly){pl.fly.i=0;pl.fly.t=0;pl.fly.sp=0;pl.fly.pos={u:pl.fly.path[1][0],v:pl.fly.path[1][1],h:0};pl.fly.hd=apYaw(V.B,0);}}
}
// the launch site's rocket: on the pad, then on the hour (three times a day) a countdown, ignition, and up it goes,
// faster and faster, out of sight; a new one is rolled out a while later
function makeRocket(){
  const g=new THREE.Group(),cyl=(r0,r1,h,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,14),m);o.position.set(x,y,z);g.add(o);return o;};
  cyl(1.7,1.7,28,TRM.white,0,15,0);cyl(1.72,1.72,1.2,TRM.dark,0,29.5,0);cyl(1.3,1.7,8,TRM.white,0,34,0);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(1.3,4.5,14),TRM.white);nose.position.y=40.2;g.add(nose);
  for(const s2 of[-1,1]){cyl(0.9,0.9,20,TRM.white,s2*2.6,11,0);const nc=new THREE.Mesh(new THREE.ConeGeometry(0.9,2.2,10),TRM.red);nc.position.set(s2*2.6,22.1,0);g.add(nc);}
  for(let k=0;k<4;k++){const f=new THREE.Mesh(LM_BOX,TRM.dark);f.scale.set(0.2,3,1.8);const a=k*Math.PI/2;f.position.set(Math.cos(a)*1.9,2.2,Math.sin(a)*1.9);f.rotation.y=-a;g.add(f);}
  const flame=new THREE.Mesh(new THREE.ConeGeometry(1.6,7,10),new THREE.MeshBasicMaterial({color:0xffa030}));flame.rotation.x=Math.PI;flame.position.y=-3.4;flame.visible=false;g.add(flame);g.userData.flame=flame;
  return g;
}
function updateLaunch(V,dt){
  const B=V.B,x=B.ax*CELL+16.5,z=B.az*CELL+80.5,g=V.rocket,hr=Math.floor(hourNow()),me=players.find(q=>q.active),near=me&&Math.hypot(me.pos.x-x,me.pos.z-z)<900;
  if(V.lastHr<0)V.lastHr=hr;
  if(V.st==='pad'&&hr!==V.lastHr&&hr%6===3){V.st='count';V.t=10;}
  V.lastHr=hr;
  if(V.st==='count'){const before=Math.ceil(V.t);V.t-=dt;if(Math.ceil(V.t)!==before&&near&&audio)tone('square',V.t<1?1200:880,V.t<1?1200:880,0.12,0.05);if(V.t<=0){V.st='up';V.y=0;V.v=0;V.t=0;}}
  if(V.st==='up'){V.t+=dt;V.v=Math.min(160,V.v+(V.t<3?2:9)*dt);V.y+=V.v*dt;g.userData.flame.visible=true;g.userData.flame.scale.set(1,0.8+Math.random()*0.5,1);
    if(V.t<6&&Math.random()<0.8)smoke(x+(Math.random()-.5)*10,G+2,z+(Math.random()-.5)*10,2,0xd8d8d4);
    if(near&&V.t<0.1)noise(4,0.25,140,'lowpass');
    if(V.y>700){V.st='gone';V.t=0;g.visible=false;g.userData.flame.visible=false;}}
  if(V.st==='gone'){V.t+=dt;if(V.t>90){V.st='pad';V.y=0;g.visible=true;}}
  g.position.set(x,G+2+V.y,z);
}
