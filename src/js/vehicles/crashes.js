// ---- big vehicles running into each other: a train, a boat, a plane, a ride's car, meeting another one ----
// (cars already bump each other, and trains and planes already smash the cars in their way. These are what's left: two of
// the big ones whose boxes meet, at least one of them moving. Both take a knock that grows with how fast they met, and
// it counts once for each time they meet, however long they go on overlapping, so two passing through each other take
// one knock, not one every frame)
function bigCrashes(){
  const L=[];for(const B of TRAIN_BOXES){if(B.soft||!B.proxy.alive||B.y0>=B.top||B.proxy.T&&B.proxy.T.dead)continue;L.push(B);}   // (a wreck going down, or burning out, is out of it)
  for(let i=0;i<L.length;i++){const a=L[i],va=a.proxy.T||a.proxy,ra=Math.max(a.hx||TRAIN_HX,a.hz||TRAIN_HZ);
    for(let j=i+1;j<L.length;j++){const b=L[j],vb=b.proxy.T||b.proxy;if(va===vb||Math.abs(a.v)<2&&Math.abs(b.v)<2)continue;
      if(Math.abs(a.x-b.x)>ra+Math.max(b.hx||TRAIN_HX,b.hz||TRAIN_HZ)||Math.abs(a.z-b.z)>ra+Math.max(b.hx||TRAIN_HX,b.hz||TRAIN_HZ))continue;
      if(a.y0>=b.top||b.y0>=a.top)continue;
      if(!boxesTouch(a.x,a.z,Math.atan2(a.tx,a.tz),a.hx||TRAIN_HX,a.hz||TRAIN_HZ,b.x,b.z,Math.atan2(b.tx,b.tz),b.hx||TRAIN_HX,b.hz||TRAIN_HZ))continue;
      if(crashedLately(va,vb))continue;
      // how hard: their speeds along the line between them
      const dx=b.x-a.x,dz=b.z-a.z,dl=Math.hypot(dx,dz)||1,ux=dx/dl,uz=dz/dl,rel=Math.abs((a.tx*a.v-b.tx*b.v)*ux+(a.tz*a.v-b.tz*b.v)*uz)+0.3*Math.abs(Math.abs(a.v)-Math.abs(b.v));
      const n=Math.round(6+rel*2.5);damageCar(a.proxy,n,new V3(-ux,0,-uz),'acc');damageCar(b.proxy,n,new V3(ux,0,uz),'acc');
      const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,my=Math.max(a.y0,b.y0)+1;puff(mx,my,mz,10,0x8c8a84,1.2);
      const np=nearestPlayer(mx,mz,false);if(np&&np.d<90){const k=1-np.d/90;clang();thud(0.6*k);noise(0.5,0.3*k,300,'lowpass');}
      addShake(0.4,mx,mz,30);reportNews(mx,mz,'crash');}}
}
// (a pair that's still touching from a moment ago is the same crash going on: only the first touch of each meeting counts)
const bigPairs=new Map();
function crashedLately(a,b){const now=playTime,m=bigPairs.get(a)||new Map(),t=m.get(b)??(bigPairs.get(b)||new Map()).get(a);m.set(b,now);bigPairs.set(a,m);{const m2=bigPairs.get(b)||new Map();m2.set(a,now);bigPairs.set(b,m2);}
  if(bigPairs.size>64)for(const [k,mm] of bigPairs){for(const [k2,t2] of mm)if(now-t2>2)mm.delete(k2);if(!mm.size)bigPairs.delete(k);}
  return t!==undefined&&now-t<0.5;}
function updateVenues(dt){
  TRAIN_BOXES.length=0;updateTrains(dt);
  for(const p of players)if(p.trainT>0)p.trainT-=dt;for(const c of cars)if(c.trainT>0)c.trainT-=dt;for(const g of goblins)if(g.trainT>0)g.trainT-=dt;
  venueT-=dt;if(venueT<=0){venueT=1;refreshVenues();}
  let nC=0,nP=0;BALL.visible=false;const t=performance.now()/1000;
  for(const V of venues.values()){
    if(V.kind==='boat'||V.kind==='sub'){updateSeaVenue(V,dt,t);continue;}
    if(V.kind==='rtrain'||V.kind==='xing'){updateRailVenue(V,dt,t);continue;}
    if(V.kind==='cult'){updateCultVenue(V,dt,t);continue;}
    if(V.kind==='wind'||V.kind==='guards'){updateSiteVenue(V,dt,t);continue;}
    if(V.kind==='army'){updateArmy(V,dt);continue;}
    if(V.kind==='train'){
      // the train: runs the line between the two stations, easing in and out, waiting a while at each platform
      const R=V.R,end=V.dir>0?R.L-46:46,left=(end-V.s)*V.dir;
      if(V.wait>0){V.wait-=dt;if(V.wait<=0)V.dir=-V.dir;}
      else{const want=left<60?Math.max(1.5,left*0.35):20;V.v+=(want-V.v)*Math.min(1,dt*(want<V.v?1.5:0.35));V.s+=V.v*V.dir*dt;if(left<=0.5){V.s=end;V.v=0;V.wait=14;}}
      const RL=railOf(R);V.cars.forEach((g,i)=>{const s2=Math.max(26,Math.min(R.L-26,V.s-i*10.6*V.dir)),P=rtPointL(R,s2);g.position.set(P.x-P.tz*RL.off,G+1.2,P.z+P.tx*RL.off);g.rotation.y=Math.atan2(P.tx*V.dir,P.tz*V.dir);});
      continue;}
    if(V.kind==='airport'){if(V.tenv)updateTenvPlanes(V,dt);else updateAirport(V,dt);continue;}
    if(V.kind==='nasa'){updateLaunch(V,dt);continue;}
    if(V.kind==='toll'){
      // each barrier lifts as a car comes up to it in its lane, drops again once it's through
      for(const A of V.arms){let near=false;for(const c of cars){if(!c.alive||!c.rt||c.rt.R!==V.R)continue;if(Math.sign(c.rt.lane*c.rt.dir)!==Math.sign(A.L)&&false)continue;if(Math.hypot(c.pos.x-A.x,c.pos.z-A.z)<6.5){near=true;break;}}
        A.a+=((near?1.35:0)-A.a)*Math.min(1,dt*3);A.lift.rotation.z=A.a;}
      continue;}
    if(V.kind==='theme'){if(!V.ride)makeRides(V);if(V.survey&&!rideSurvey(V))continue;updateRides(V,dt);continue;}
    if(V.kind==='zoo'){
      if(!V.animals){const P=plotInfo(V.S.ax,V.S.az),X0=V.S.ax*CELL,Z0=V.S.az*CELL;if(!get(X0+P.encl[0].x0+2,G,Z0+P.encl[0].z0+2))continue;V.animals=[];let num=0;
        for(const E of P.encl)for(let i=0;i<E.n;i++){const wk='z'+V.S.ax+','+V.S.az+':'+(num++);if(wrecked[wk])continue;const A=makeAnimal(E.sp);A.wk=wk;A.E={x0:X0+E.x0+1.5,x1:X0+E.x1-1.5,z0:Z0+E.z0+1.5,z1:Z0+E.z1-1.5};A.x=A.E.x0+Math.random()*(A.E.x1-A.E.x0);A.z=A.E.z0+Math.random()*(A.E.z1-A.E.z0);
          A.tx=A.x;A.tz=A.z;A.h=0;A.sp=E.sp;A.y=E.g==='pool'?G:G+1;A.wait=Math.random()*4;A.ph=Math.random()*7;scene.add(A.g);V.animals.push(A);}}
      for(const A of V.animals){
        if(A.dead){animalFall(A,dt);continue;}
        // amble to a spot, stop a while, amble on; a hippo stomping close by (or one that's been hurt) sends them running
        if(A.frit>0)A.frit-=dt;
        const me=players.find(q=>q.active),scared=me&&Math.hypot(me.pos.x-A.x,me.pos.z-A.z)<7||A.frit>0;
        if(A.wait>0&&!scared){A.wait-=dt;}
        else{const dx=A.tx-A.x,dz=A.tz-A.z,d=Math.hypot(dx,dz),spd=(scared?3.2:0.9)*(A.sp==='penguin'?0.6:A.sp==='giraffe'?1.2:1);
          if(d<0.3||scared&&d<1){A.tx=A.E.x0+Math.random()*(A.E.x1-A.E.x0);A.tz=A.E.z0+Math.random()*(A.E.z1-A.E.z0);if(!scared)A.wait=1+Math.random()*5;}
          else{A.x+=dx/d*spd*dt;A.z+=dz/d*spd*dt;let dh=Math.atan2(dx,dz)-A.h;while(dh>Math.PI)dh-=Math.PI*2;while(dh<-Math.PI)dh+=Math.PI*2;A.h+=dh*Math.min(1,dt*4);A.ph+=dt*spd*5;}}
        if(A.kx||A.kz){A.x=Math.max(A.E.x0,Math.min(A.E.x1,A.x+A.kx*dt));A.z=Math.max(A.E.z0,Math.min(A.E.z1,A.z+A.kz*dt));const k=Math.exp(-dt*6);A.kx*=k;A.kz*=k;if(Math.abs(A.kx)+Math.abs(A.kz)<0.05)A.kx=A.kz=0;}   // (knocked back, but the fence still holds them)
        const gy=groundAt(A.x,A.z,A.y+3);A.g.position.set(A.x,(gy!==null&&Math.abs(gy-A.y)<3?gy:A.y)+(A.sp==='monkey'&&A.wait<=0?Math.abs(Math.sin(A.ph))*0.4:0),A.z);A.g.rotation.y=A.h;
        A.legs.forEach((l,i)=>{l.rotation.x=A.wait>0?0:Math.sin(A.ph+(i%2?Math.PI:0))*0.45;});
        animalBox(A);}
      continue;}
    const on=gameOn(V.kind);
    if(!V.seats){V.seats=venueSeats(V);}
    if(!V.seats.length)continue;
    // the crowd: most seats taken during a game, a scattering otherwise; every so often a roar and they all jump up
    V.cheerT-=dt;if(V.cheerT<=0){V.cheerT=on?14+Math.random()*25:60;V.cheer=on?2:0;if(on){const me=players.find(q=>q.active);if(me&&Math.hypot(me.pos.x-V.pitch.x0,me.pos.z-V.pitch.z0)<160)noise(1.6,0.08,700,'lowpass');}}
    V.cheer=Math.max(0,V.cheer-dt);const fill=on?0.8:0.02;
    for(const [x,y,z,h] of V.seats){if(h>fill||nC>=FANS_MAX)continue;const jump=V.cheer>0?Math.max(0,Math.sin(t*9+h*40))*0.45:0;
      _A.makeTranslation(x,y+0.36+jump,z);CR_B.setMatrixAt(nC,_A);_A.makeTranslation(x,y+0.92+jump,z);CR_H.setMatrixAt(nC,_A);
      CR_B.setColorAt(nC,_fcF.setHex(h<fill*0.45?0xc8302a:h<fill*0.9?0x2a5ac8:[0xf0f0e8,0x2a2a2a,0xe0c040][Math.floor(h*97)%3]));nC++;}
    if(!on)continue;
    // the game: two teams chasing the ball about, the cheerleaders bouncing on the sidelines
    const Pt=V.pitch;if(!V.ball||Math.random()<dt*0.35)V.ball={x:Pt.x0+Pt.w*(0.15+Math.random()*0.7),z:Pt.z0+Pt.h*(0.15+Math.random()*0.7)};
    const bx=BALL.position.x||V.ball.x,bz=BALL.position.z||V.ball.z;BALL.position.set(bx+(V.ball.x-bx)*Math.min(1,dt*1.5),Pt.y+0.35,bz+(V.ball.z-bz)*Math.min(1,dt*1.5));BALL.visible=true;
    const n=V.kind==='stadium'?11:5;
    for(let tm=0;tm<2;tm++)for(let i=0;i<n;i++){if(nP>=PL_MAX)break;const fx=(i+0.5)/n,hx=Pt.x0+Pt.w*(Pt.long?fx:(tm?0.25+fx*0.2:0.55+fx*0.2)),hz=Pt.z0+Pt.h*(Pt.long?(tm?0.25+((i*7)%n)/n*0.2:0.55+((i*7)%n)/n*0.2):fx);
      const pull=0.35+0.25*Math.sin(t*0.7+i),px=hx+(BALL.position.x-hx)*pull+Math.sin(t*1.3+i*2+tm)*1.5,pz=hz+(BALL.position.z-hz)*pull+Math.cos(t*1.1+i*3)*1.5,run=Math.abs(Math.sin(t*10+i))*0.15;
      _A.makeTranslation(px,Pt.y+0.55+run,pz);PL_B.setMatrixAt(nP,_A);_A.makeTranslation(px,Pt.y+1.38+run,pz);PL_H.setMatrixAt(nP,_A);PL_B.setColorAt(nP,_fcF.setHex(tm?0x2a5ac8:0xc8302a));nP++;}
    for(let i=0;i<8;i++){if(nP>=PL_MAX)break;const side=i<4?-1.6:Pt.h+1.6,px=Pt.x0+Pt.w*(0.3+0.13*(i%4)),pz=Pt.z0+side,j=Math.max(0,Math.sin(t*6+i*1.3))*0.7;
      _A.makeTranslation(px,Pt.y+0.55+j,pz);PL_B.setMatrixAt(nP,_A);_A.makeTranslation(px,Pt.y+1.38+j,pz);PL_H.setMatrixAt(nP,_A);PL_B.setColorAt(nP,_fcF.setHex(i%2?0xffd23a:0xf4f4f0));nP++;}
  }
  bigCrashes();
  fxSent(CR_B,nC);fxSent(CR_H,nC);fxSent(PL_B,nP);fxSent(PL_H,nP);
}
function knockFixtures(x,z,r,dx,dz){let n=0;for(const f of activeFix){const ex=f.x-x,ez=f.z-z,rr=r+(f.rad||0);if(ex*ex+ez*ez<rr*rr&&knockFix(f,dx||ex,dz||ez))n++;}return n;}

