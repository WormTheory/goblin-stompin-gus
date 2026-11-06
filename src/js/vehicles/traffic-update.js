let trafficJob=4;
function updateTraffic(dt){
  if(playing)trafficClock+=dt;
  let anyFall=false;
  for(const [k,f] of falling){
    f.t+=dt;anyFall=true;
    if(f.t>=0.7){falling.delete(k);downFix.set(k,f.ang);save();if(f.prop){puff(f.x,f.y+.2,f.z,2,0xbfc5ca,0.2);continue;}thud(0.35);puff(f.x+Math.sin(f.ang)*5,G+1.3,f.z+Math.cos(f.ang)*5,7,0x8c8a84,0.8);}
  }
  trafficRefreshT-=dt;
  // (what's near the players is gone over every 0.4 s, one job a frame so they don't all land on the same frame. A lamp post on
  // its way down needs the fixtures redrawn every frame, but only those.)
  if(trafficRefreshT<=0){trafficRefreshT=0.4;trafficJob=0;}
  if(trafficJob===0||anyFall)refreshFixtures();
  if(trafficJob===1)refreshBrandSigns();else if(trafficJob===2)refreshDoors();else if(trafficJob===3)refreshLandmarks();
  if(trafficJob<4)trafficJob++;
  updateDoors(dt);updateLandmarks(dt);safe('venues',()=>updateVenues(dt));
  headLamps();
}
// each signal head showing the colour its light's on
function headLamps(){for(const h of heads){if(!h.g.visible)continue;const ph=lightPhase(h.ct,h.axis),on=!h.lit?-1:ph==='r'?0:ph==='y'?1:2;h.lamps.forEach((m,j)=>{m.material=j===on?TL.on[j]:TL.off[j];});}}
function updateCars(dt){
  for(const bl of blasts){if(bl.t<=0)continue;bl.t-=dt;const k=1-Math.max(0,bl.t)/0.6;bl.m.forEach((f,i)=>{f.scale.setScalar((1+k*(i?4:6))*(bl.s||1));f.material.opacity=Math.max(0,1-k*1.1);f.rotation.y+=dt*3;if(bl.t<=0)f.visible=false;});}
  for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];w.t-=dt;if(Math.random()<dt*10)smoke(w.p.x,w.p.y+0.5,w.p.z,1,0x222222);if(w.t<=0)wrecks.splice(i,1);}
  for(const d of debris){if(d.life<=0)continue;d.life-=dt;const m=d.m;
    d.v.y-=20*dt;m.position.addScaledVector(d.v,dt);m.rotation.x+=d.spin.x*dt;m.rotation.y+=d.spin.y*dt;m.rotation.z+=d.spin.z*dt;
    const g=supportAt(m.position.x,m.position.z,m.position.y);
    if(g===null){d.v.x=0;d.v.z=0;}
    else if(m.position.y<g+0.15){m.position.y=g+0.15;d.v.y*=-0.3;d.v.x*=0.6;d.v.z*=0.6;d.spin.multiplyScalar(0.6);}
    if(d.life<21)m.material.emissive.setHex(0x000000);
    if(d.life<=0)m.visible=false;}
  let alive=0,hunters=0;for(const c of cars)if(c.alive&&!c.police&&!c.parkPool&&!c.hwPool){alive++;if(c.hunter)hunters++;}
  pullT-=dt;if(pullT<=0&&playing&&!TENV){pullT=1.5;managePull();}
  rvT-=dt;if(rvT<=0&&playing){rvT=1;manageRVs();}
  const clock=performance.now()/1000;
  for(const c of cars){
    if(!c.alive){
      c.respawnT-=dt;c.left=false;
      if(c.svcPool||c.pullPool||c.rvPool||TENV)continue;
      if(c.parkPool){if(c.respawnT<=0&&playing&&!spawnParked(c))c.respawnT=1.5;continue;}
      if(c.hwPool){if(c.respawnT<=0&&playing&&traffic>0&&!spawnHw(c))c.respawnT=1.5;continue;}
      if(c.police){if(c.respawnT<=0&&playing&&crowd>0&&!spawnPolice(c))c.respawnT=2;continue;}
      if(c.respawnT<=0&&playing&&alive<trafficTarget()){if(spawnTraffic(c))alive++;else c.respawnT=0.5;}continue;
    }
    const any=nearestPlayer(c.pos.x,c.pos.z,false);
    c.visT=(c.visT||0)-dt;
    let gone=!any||any.d>(c.parkPool?Math.min(75,Math.max(55,viewFar())):Math.max(85,viewFar()+14));   // parked cars recycle to car parks nearer you
    if(c.pullPool||c.rvPool)gone=!any||any.d>viewFar()+30;
    // far off and out of everyone's sight: recycle it closer in (unseen, so nothing pops)
    // (a parked car out past the edge stays put while anyone can see it, so it doesn't blink out of its bay)
    if(gone&&c.parkPool&&any&&any.d<130){if(c.visT<=0){c.visT=0.4;c.seenP=visibleToAny(c.pos.x,c.pos.y+1,c.pos.z);}if(c.seenP)gone=false;}
    if(!gone&&any.d>110&&!c.hunter&&!c.police&&!c.parkPool&&c.visT<=0){c.visT=0.5;gone=!visibleToAny(c.pos.x,c.pos.y+1,c.pos.z);}
    // no real progress for a good while (stuck behind something that isn't moving): find another way
    if(!gone&&!c.parked&&!c.hunter&&!c.police&&!c.svcPool){c.progT=(c.progT||0)+dt;if(!c.progP)c.progP={x:c.pos.x,z:c.pos.z};
      if(c.progT>15){if(Math.hypot(c.pos.x-c.progP.x,c.pos.z-c.progP.z)<3)carReroute(c);c.progT=0;c.progP.x=c.pos.x;c.progP.z=c.pos.z;}}
    if(!c.parked&&!c.hunter&&!c.police&&!c.svcPool){c.stuckLong=Math.abs(c.speed)<0.3?(c.stuckLong||0)+dt:0;
      if(!gone&&c.stuckLong>25&&c.visT<=0){c.visT=0.5;if(!visibleToAny(c.pos.x,c.pos.y+1,c.pos.z)){gone=true;c.stuckLong=0;}}}
    if(c.svcPool)gone=!any||any.d>(c.svcPool==='news'?620:320);   // (a news van comes from further off: see NEWS_R)
    if(c.drv)gone=false;   // (never recycled from under its driver)
    if(gone&&c.pullPool){c.hazard=false;c.hazG.visible=false;c.pullLit=false;}
    if(gone){if(c.svcPool){svcDone(c);continue;}c.alive=false;c.g.visible=false;c.respawnT=c.police?6:0.5;c.hunter=false;c.spot=null;continue;}
    c.hurt-=dt;c.ramCD-=dt;c.honkT-=dt;
    c.snowChk=(c.snowChk||0)-dt;if(c.snowChk<=0){c.snowChk=0.6+Math.random()*0.4;const cx=Math.floor(c.pos.x),cz=Math.floor(c.pos.z);let open=true;for(let y=Math.floor(c.pos.y)+3;y<Math.min(H,c.pos.y+45);y++)if(solidAt(cx,y,cz)){open=false;break;}c.snowOpen=open;}
    c.snowU.value+=((c.snowOpen?WX.snowCover:0)-c.snowU.value)*Math.min(1,dt*0.4);
    c.paint.emissive.setHex(c.hurt>0?0x441100:0x000000);
    const tgt=nearestPlayer(c.pos.x,c.pos.z,true);
    if(calmNow()&&c.hunter){c.hunter=false;if(c.police)c.parked=true;}
    if(c.police&&c.parked&&!c.svcPool&&!c.pullPool&&playing&&tgt&&tgt.d<30&&!calmNow()){c.parked=false;c.hunter=true;flashLabel('Police!',tgt.p);}
    if(c.police){const on=Math.floor(clock*6.5)%2===0,lit=c.hunter||c.pullLit||(c.svcPool&&c.svc&&c.svc.st!=='parked'&&c.svc.st!=='leave');c.lightR.color.setHex(lit?(on?0xff2a2a:0x501010):0x401010);c.lightB.color.setHex(lit?(on?0x101a50:0x3a7aff):0x101a40);}
    if(c.hazard){const on=Math.floor(clock*1.7)%2===0;c.hazM.color.setHex(on?0xffa024:0x3a2408);}
    if(c.flash&&c.svcPool){const on=Math.floor(clock*5.5)%2===0&&c.svc&&c.svc.st!=='parked';c.flash[0].color.setHex(on?0xff2a2a:0x501010);c.flash[1].color.setHex(on?0x303030:(c.svcPool==='amb'?0xffffff:0x3a7aff));}
    if(!c.police&&!c.parkPool&&!c.hwPool&&!c.hunter&&!c.hw&&!c.rt&&!c.path&&!calmNow()&&playing&&tgt&&tgt.d<22&&hunters<2&&Math.random()<dt*0.07){c.hunter=true;hunters++;flashLabel('A car is coming for you',tgt.p);sfx('A car comes for you (horn)',()=>{horn(0.08);});}
    if(c.hunter&&!tgt)c.hunter=false;
    // a highway car that's come down into town drives the streets for a while, then slips away once nobody's looking
    if(c.leaving&&c.hwPool&&!c.drv){c.leaveT=(c.leaveT||0)+dt;if(c.leaveT>14&&!visibleToAny(c.pos.x,c.pos.y+1,c.pos.z)&&!players.some(q=>q.standCar===c)){c.alive=false;c.g.visible=false;c.respawnT=0.5;c.leaving=false;c.leaveT=0;continue;}}
    // a car from the streets that's driven up a motorway's ramp: from the top it's motorway traffic
    if(playing&&!c.hw&&!c.rt&&!c.path&&!c.parked&&!c.svcPool&&!c.hunter&&!c.police&&!c.drv&&!c.left&&c.pos.y>G+2.5){const sh=Math.sin(c.heading),ch=Math.cos(c.heading),ax=Math.abs(sh)>Math.abs(ch)?'x':'z',dir=ax==='x'?Math.sign(sh):Math.sign(ch),k=Math.floor(((ax==='x'?c.pos.z:c.pos.x)+3)/CELL),al=ax==='x'?c.pos.x:c.pos.z;
      // (a long truck's middle sits well up the slope with its nose already on the street: it's finished with the ramp, not back on it)
      if(hwRampAt(ax,k,al)&&hwSurf(ax,k,al)>G+1.5){const inner=((ax==='x')===(dir>0))?5.5:2.5;c.hw={ax,dir,lane:k*CELL+inner,y:hwSurf(ax,k,al)};c.leaving=false;}}
    if(c.drv)drvCar(c,dt);   // (a goblin at the wheel: see drvCar)
    else if(c.left)c.speed*=Math.exp(-dt*3);   // (got out of and left where it stopped)
    else if(!playing){c.speed*=Math.exp(-dt*3);}
    else if(c.svcPool){svcDrive(c,dt);if(!c.alive)continue;}
    else if((c.police||c.parkPool)&&!c.hunter){c.speed*=Math.exp(-dt*4);}
    else if(c.path){
      // following a route over an interchange: steer for the next waypoint, ease to its speed, give way to anything ahead
      // a waypoint it's already gone past (it's further along the road to the next one): don't turn back for it
      if(c.path.length>1){const W0=c.path[0],W1=c.path[1];if((c.pos.x-W0.x)*(W1.x-W0.x)+(c.pos.z-W0.z)*(W1.z-W0.z)>0)c.path.shift();}
      const W=c.path[0],dx=W.x-c.pos.x,dz=W.z-c.pos.z;
      if(Math.hypot(dx,dz)<(W.r||2.5)){c.path.shift();
        if(!c.path.length){
          c.path=null;
          c.prevHw=null;if(c.pathEnd==='join'){const J=c.join;c.hw={ax:J.ax,dir:J.dir,lane:J.lane,y:J.y};}
          else{c.leaving=true;c.leaveT=0;c.dir=c.leaveDir;c.lastInter=-1;c.hw=null;}   // off the highway: it joins the street traffic
        }}
      else{
        let diff=Math.atan2(dx,dz)-c.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
        c.heading+=Math.max(-2.2*dt,Math.min(2.2*dt,diff));c.steer=Math.max(-1,Math.min(1,diff*2));
        let target=W.v;const sh=Math.sin(c.heading),ch=Math.cos(c.heading);
        // give way to anything just ahead -- but if it's been stuck a while, nose on through (traffic jams at a red light clear themselves)
        c.pathStill=Math.abs(c.speed)<0.5?(c.pathStill||0)+dt:0;
        if(c.pathStill<2.5)for(const o of cars){if(o===c||!o.alive||o.parked)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z,along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<12&&lat<2&&Math.abs(o.pos.y-c.pos.y)<2)target=Math.min(target,along<5?0:along);}
        // wedged at the end of a merge lane (a queue held it up until the lane ran out): shuffle sideways into the lane
        if(c.pathStill>2.5&&c.pathEnd==='join'&&c.join&&c.path.length<=3){const J=c.join,cur=J.ax==='x'?c.pos.z:c.pos.x,d=J.lane-cur;
          if(Math.abs(d)>0.3){const nx=J.ax==='x'?c.pos.x:c.pos.x+Math.sign(d)*0.6,nz=J.ax==='x'?c.pos.z+Math.sign(d)*0.6:c.pos.z;
            if(Math.abs(groundAt(nx,nz,c.pos.y+0.6)-c.pos.y)<0.6&&!cars.some(o=>o!==c&&o.alive&&Math.abs(o.pos.y-c.pos.y)<2&&Math.hypot(o.pos.x-nx,o.pos.z-nz)<o.hz+c.hz-0.6)){
              const k=Math.min(Math.abs(d),2.5*dt)*Math.sign(d);if(J.ax==='x')c.pos.z+=k;else c.pos.x+=k;}}}
        if(c.pathStill>4)c.pathStill=0;
        // at the top of an on-ramp: wait for a gap in the lane it's merging into (but not for ever)
        if(W.g&&c.pathEnd==='join'&&c.join){const J=c.join,ga=J.ax==='x'?W.x:W.z;c.gateT=(c.gateT||0)+dt;W.r=W.r||3.6;
          if(c.gateT<8&&cars.some(o=>o!==c&&o.alive&&o.hw&&!o.hw.ground&&o.hw.ax===J.ax&&Math.abs(o.hw.lane-J.lane)<1&&Math.abs(o.pos.y-J.y)<2.5&&(()=>{const r=((J.ax==='x'?o.pos.x:o.pos.z)-ga)*J.dir;return r>-26&&r<7;})())){const dG=Math.hypot(dx,dz);target=Math.min(target,dG<5.2?0:(dG-5.2)*1.5);}}
        else c.gateT=0;
        // (rolling down a ramp it's barely ever 'grounded' between the little steps, so don't wait for that)
        if(target<c.speed)c.speed=Math.max(target,c.speed-14*dt);else c.speed=Math.min(target,c.speed+6*dt);
      }
    }
    else if(c.rt){
      // out on a route: steer for a point a little way ahead along its line, in its lane; keep a gap to the car in front
      const T=c.rt,R=T.R,me=rtProject(R,c.pos.x,c.pos.z,T.i);T.i=me.i;
      const onDeck=Math.abs(c.pos.y-rtSurfY(R,me.s))<1.3&&Math.abs(me.sd)<9;
      // the end of the route: hand over to the place's main street, or its motorway deck
      const end=T.dir>0?me.s>R.L-1.5:me.s<1.5;
      if(end){const E=T.dir>0?R.B:R.A,inDir=-E.s;c.rt=null;
        if(R.kind==='moto'&&axisSpan(E.T,E.ax).kind==='moto'){const k=lineOf(E.T,E.ax),inner=Math.abs(T.lane)<3,lp=E.ax==='x'?(inDir>0?(inner?5.5:8.5):(inner?2.5:-0.5)):(inDir>0?(inner?2.5:-0.5):(inner?5.5:8.5));
          c.hw={ax:E.ax,dir:inDir,lane:k*CELL+lp,y:hwSurf(E.ax)};}
        else{c.dir=E.ax==='x'?(inDir>0?1:3):(inDir>0?0:2);c.lastInter=-1;c.leaving=!!c.hwPool;c.leaveT=0;
          // (it rolls in over the junction at the edge of town -- it was already past its stop line coming off the highway)
          const SP=axisSpan(E.T,E.ax),cell=E.s>0?SP.m1+1:SP.m0;c.passK=E.ax==='x'?cell*100003+SP.k:SP.k*100003+cell;}
        continue;}
      if(onDeck){
        const look=6+Math.max(0,c.speed)*0.45,P=rtPoint(R,me.s+T.dir*look),tx=P.tx*T.dir,tz=P.tz*T.dir,gx=P.x-tz*T.lane,gz=P.z+tx*T.lane;
        let diff=Math.atan2(gx-c.pos.x,gz-c.pos.z)-c.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
        c.heading+=Math.max(-2*dt,Math.min(2*dt,diff));c.steer=Math.max(-1,Math.min(1,diff*2));
        // ease off round the tighter bends (how much the line turns over the next stretch)
        const P2=rtPoint(R,me.s+T.dir*(look+18)),bend=Math.abs(Math.atan2(P.tx*P2.tz-P.tz*P2.tx,P.tx*P2.tx+P.tz*P2.tz));
        let target=(R.kind==='moto'?19:17)-Math.min(8,bend*14);
        // (slow right down through a toll plaza, pause at the booth)
        for(const ts of tollsOf(R)){const ahead=(ts-me.s)*T.dir;if(ahead>-2&&ahead<70)target=Math.min(target,ahead<2.5?1.6:1.6+ahead*0.28);}const sh=Math.sin(c.heading),ch=Math.cos(c.heading);
        // a country highway narrows to one lane each way into town: well before the end, the outer lane's cars move over
        // into the inner one where there's a gap (and wait for one, if it comes to that); setting out from town, now and
        // then a car moves out into the outer lane once it's clear of the place
        if(R.kind==='country'){const toEnd=T.dir>0?R.L-me.s:me.s,fromStart=T.dir>0?me.s:R.L-me.s;
          if(toEnd<170&&T.lane>3){
            const rel=o=>{const q=rtProject(R,o.pos.x,o.pos.z,o.rt.i);return(q.s-me.s)*T.dir;};
            const blocked=cars.some(o=>{if(o===c||!o.alive||!o.rt||o.rt.R!==R||o.rt.dir!==T.dir||o.rt.lane>3)return false;const d=rel(o);return d>-(c.hz+o.hz+4)&&d<c.hz+o.hz+5;});
            if(!blocked)T.lane=1.5;else if(toEnd<45)target=Math.min(target,Math.max(0,(toEnd-14)*0.6));}
          else if(toEnd>320&&fromStart>160&&!T.split){T.split=true;if(Math.random()<0.4)T.lane=4.5;}}
        c.jamT=Math.abs(c.speed)<0.3?(c.jamT||0)+dt:0;if(c.jamT>8)c.jamT=0;
        if(c.jamT<6.5)for(const o of cars){if(o===c||!o.alive)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z;if(Math.abs(ox)+Math.abs(oz)>60)continue;const along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<30+c.hz+o.hz&&lat<1.8&&Math.abs(o.pos.y-c.pos.y)<2){const ga=along-(c.hz+o.hz-3.2);target=Math.min(target,ga<7?0:Math.max(0,o.speed*Math.cos(o.heading-c.heading))+(ga-9)*0.9);}}
        if(tgt){const ox=tgt.p.pos.x-c.pos.x,oz=tgt.p.pos.z-c.pos.z,along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<14&&lat<2.4&&Math.abs(tgt.p.pos.y-c.pos.y)<2.5&&c.honkT<=0){sfx('Car horn',()=>{horn(0.07);});c.honkT=2;}}
        if(c.grounded){if(target<c.speed)c.speed=Math.max(target,c.speed-20*dt);else c.speed+=(target-c.speed)*Math.min(1,dt*0.8);}
      } else c.speed*=Math.exp(-dt*1.5);
    }
    else if(c.hw){
      // motorway driving: hold the lane, keep a gap to the car in front, cruise fast; knocked off the deck, it just rolls to a stop
      const H=c.hw;if(!H.ground){const kk=Math.floor((H.lane+3)/CELL),aa=H.ax==='x'?c.pos.x:c.pos.z;H.y=hwSurf(H.ax,kk,aa);if(c.pos.y<G+3&&!hwRampAt(H.ax,kk,aa)&&hwFootNear(H,c))H.y=G+1;}const onDeck=c.pos.y>H.y-1.3,sloped=!H.ground&&H.y%1!==0;
      // run off the end of a place's motorway deck: out on the route across the plains from here
      {const k=Math.floor((H.lane+3)/CELL),al=H.ax==='x'?c.pos.x:c.pos.z,m=Math.floor(al/CELL);
       if(!H.ground&&onDeck&&hwLine(H.ax,k,m)!=='moto'){
         let J=null;const cands=routesNearBox(c.pos.x-24,c.pos.z-24,c.pos.x+24,c.pos.z+24);
         for(let q=0;q<cands.length&&!J;q+=2){const R=cands[q];if(R.kind!=='moto')continue;
           for(const [E,dir,s] of [[R.A,1,0],[R.B,-1,R.L]]){if(E.ax!==H.ax||E.s!==H.dir)continue;const pt=R.pts[s?R.pts.length-1:0];if(Math.hypot(pt[0]-c.pos.x,pt[1]-c.pos.z)<26){J={R,dir,s};break;}}}
         if(J){const inner=Math.abs((H.lane-k*CELL)-((H.ax==='x')===(H.dir>0)?5.5:2.5))<1;c.rt={R:J.R,dir:J.dir,lane:inner?1.5:4.5,i:J.s?J.R.pts.length-2:0};c.hw=null;continue;}
       }}
      // a ground highway reaching a town: from here it's the main street
      // down a town's ramp at its open end, out in the country: on along whatever highway starts there (or, if none does, back up it)
      if(c.revT>0)c.revT-=dt;
      if(!H.ground&&H.y<=G+1.5&&!(c.revT>0)&&biomeOf(Math.floor(c.pos.x/CELL),Math.floor(c.pos.z/CELL))==='plains'){
        let J=null;const cands=routesNearBox(c.pos.x-30,c.pos.z-30,c.pos.x+30,c.pos.z+30);
        for(let q=0;q<cands.length&&!J;q+=2){const R=cands[q];for(const [dir,s] of [[1,0],[-1,1]]){const pt=R.pts[s?R.pts.length-1:0],nx=R.pts[s?R.pts.length-2:1];
          if(Math.hypot(pt[0]-c.pos.x,pt[1]-c.pos.z)<30&&((nx[0]-pt[0])*(H.ax==='x'?H.dir:0)+(nx[1]-pt[1])*(H.ax==='z'?H.dir:0))>0){J={R,dir,s};break;}}}
        if(J){dbgJoin++;c.rt={R:J.R,dir:J.dir,lane:1.5,i:J.s?J.R.pts.length-2:0};c.hw=null;continue;}
        H.dir=-H.dir;H.lane=Math.floor((H.lane+3)/CELL)*CELL+(((H.ax==='x')===(H.dir>0))?5.5:2.5);c.heading+=Math.PI;c.speed=0;c.revT=6;dbgRev++;}
      if((H.ground||H.y<=G+1.5)&&biomeOf(Math.floor(c.pos.x/CELL),Math.floor(c.pos.z/CELL))!=='plains'){c.hw=null;c.dir=H.ax==='x'?(H.dir>0?1:3):(H.dir>0?0:2);c.lastInter=-1;c.leaving=!!c.hwPool;c.leaveT=0;continue;}
      if(onDeck){
        const want=H.ax==='x'?(H.dir>0?Math.PI/2:-Math.PI/2):(H.dir>0?0:Math.PI),off=(H.ax==='x'?H.lane-c.pos.z:H.lane-c.pos.x);
        const side=H.ax==='x'?(H.dir>0?1:-1):(H.dir>0?-1:1);
        let diff=want-Math.max(-0.35,Math.min(0.35,off*0.25))*side-c.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
        c.heading+=Math.max(-2*dt,Math.min(2*dt,diff));c.steer=Math.max(-1,Math.min(1,diff*2));
        let target=sloped?14:19;const sh=Math.sin(c.heading),ch=Math.cos(c.heading);
        c.jamT=Math.abs(c.speed)<0.3?(c.jamT||0)+dt:0;if(c.jamT>8)c.jamT=0;
        if(c.jamT<6.5)for(const o of cars){if(o===c||!o.alive)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z,along=(H.ax==='x'?ox:oz)*H.dir,lat=Math.abs(H.ax==='x'?oz:ox);if(along>0&&along<30+c.hz+o.hz&&lat<1.8&&Math.abs(o.pos.y-c.pos.y)<2){const ga=along-(c.hz+o.hz-3.2);target=Math.min(target,ga<7?0:Math.max(0,o.speed*Math.cos(o.heading-c.heading))+(ga-9)*0.9);}}
        if(tgt){const ox=tgt.p.pos.x-c.pos.x,oz=tgt.p.pos.z-c.pos.z,along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<14&&lat<2.4&&Math.abs(tgt.p.pos.y-c.pos.y)<2.5&&c.honkT<=0){sfx('Car horn',()=>{horn(0.07);});c.honkT=2;}}
        // coming up to an interchange: sometimes take the off-ramp (decided once per interchange)
        if(!H.ground){const a=H.ax==='x'?c.pos.x:c.pos.z,k=Math.round((H.ax==='x'?H.lane-8.5:H.lane+0.5)/CELL),side=H.ax==='x'?(H.dir>0?1:-1):(H.dir>0?-1:1),m=Math.floor((a+H.dir*20)/CELL),m0=icOf(H.ax,Math.floor((H.ax==='x'?c.pos.z:c.pos.x)/CELL+0.2),m);
         if(m0!==null){const kk=Math.floor((H.ax==='x'?c.pos.z:c.pos.x)/CELL+0.2),R=icRoutes(H.ax,kk,m0,side),key=H.ax+kk+','+m0;
           const sa=R.off.start,da=(sa-a)*H.dir;
           if(da>0&&da<6&&c.icKey!==key){c.icKey=key;if(c.veh!=='semi'&&Math.random()<0.3){c.path=R.off.pts.slice();c.pathEnd='leave';c.leaveDir=R.leaveDir;c.prevHw=c.hw;c.pathBlk=0;c.hw=null;}}}}
        if(!H.ground)cloverChoice(c,H);
        // coming up to a town, where the ground-level highway narrows to one lane each way: zip merge. The outer lane
        // runs on to near the edge of town; its cars slot into the inner lane wherever there's room, and each car in the
        // inner lane lets one of them in ahead of it.
        // (the same where a motorway ends in a ramp down to the street: two lanes won't go into one at the bottom, so they
        // become one well before the top. Left till the foot, two queues fight over the street and block the ramp.)
        const dRamp=H.ground?1e9:rampAhead(H,H.ax==='x'?c.pos.x:c.pos.z);
        if(H.ground||H.y===G+1||dRamp<130){
          const a=H.ax==='x'?c.pos.x:c.pos.z,k=Math.floor((H.lane+3)/CELL),base=k*CELL;let dT=dRamp;
          if(H.ground||H.y===G+1)for(let s=0;s<=3;s++){const m=Math.floor(a/CELL)+s*H.dir;if(biomeOf(H.ax==='x'?m:k,H.ax==='x'?k:m)!=='plains'){dT=Math.min(dT,H.dir>0?m*CELL-a:a-(m+1)*CELL);break;}}
          if(dT<80){
            const inner=base+((H.ax==='x')===(H.dir>0)?5.5:2.5),lat=o=>H.ax==='x'?o.pos.z:o.pos.x,rel=o=>((H.ax==='x'?o.pos.x:o.pos.z)-a)*H.dir;
            const same=o=>o!==c&&o.alive&&o.hw&&o.hw.ax===H.ax&&o.hw.dir===H.dir&&Math.abs(o.pos.y-c.pos.y)<2&&Math.abs(lat(o)-inner)<6;
            const inIn=o=>Math.abs(o.hw.lane-inner)<1||Math.abs(lat(o)-inner)<1.6;
            if(Math.abs(H.lane-inner)>1){
              const g=2.5+c.speed*0.25;
              const free=!cars.some(o=>{if(!same(o)||!inIn(o))return false;const r=rel(o),need=c.hz+o.hz+g;return r>-need&&r<need;});
              if(dRamp<=0||free&&dT<70)H.lane=inner;                                           // slot in (already on the ramp, it has to, or it stops the whole slope)
              else if(dT<16+c.hz)target=Math.min(target,Math.max(0,(dT-c.hz-2)*1.2));     // the lane's ending: wait for a gap
            } else{
              if(c.zipFor&&(!c.zipFor.alive||!c.zipFor.hw||inIn(c.zipFor))){c.zipDone=true;c.zipFor=null;}   // it's in: that was this car's turn
              if(!c.zipDone){
              let m=null,mr=1e9;for(const o of cars){if(!same(o)||inIn(o))continue;const r=rel(o);if(r>(c.hz+o.hz)*0.5&&r<14+c.hz+o.hz&&r<mr){m=o;mr=r;}}
              if(m){c.zipFor=m;target=Math.min(target,Math.max(0,(mr-c.hz-m.hz-4)*1.2),Math.max(m.speed-2,(mr-c.hz-m.hz-4)*1.2));}
              else c.zipFor=null;
            }}
          } else{c.zipDone=false;c.zipFor=null;}
        }
        if(c.grounded||sloped){if(target<c.speed)c.speed=Math.max(target,c.speed-20*dt);else c.speed+=(target-c.speed)*Math.min(1,dt*0.8);}
      } else c.speed*=Math.exp(-dt*1.5);
    }
    else if(c.hunter){
      let thr=0,st=0;
      const dx=tgt.p.pos.x-c.pos.x,dz=tgt.p.pos.z-c.pos.z;
      let diff=Math.atan2(dx,dz)-c.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
      if(c.reverseT>0){c.reverseT-=dt;thr=-1;st=-Math.sign(diff);}
      else{st=Math.max(-1,Math.min(1,diff*2));thr=Math.abs(diff)<1.3?1:0.35;
        if(Math.abs(c.speed)<1){c.stuckT+=dt;if(c.stuckT>1.2){c.reverseT=1;c.stuckT=0;}}else c.stuckT=0;}
      if(c.grounded){if(thr>0)c.speed+=(c.speed<0?24:10)*thr*dt;else c.speed-=(c.speed>0?24:8)*dt;}
      c.speed=Math.max(-6,Math.min(15,c.speed));
      c.steer+=(st-c.steer)*Math.min(1,dt*8);
      c.heading+=c.steer*dt*Math.max(-1,Math.min(1,c.speed/5))*1.9;
    } else if(c.makeWay>0){
      // blocking an emergency vehicle: back up out of its way, then turn round and find another way
      c.makeWay-=dt;c.steer=0;if(c.grounded)c.speed=Math.max(-3.5,c.speed-12*dt);
      if(c.makeWay<=0){c.dir=(c.dir+2)%4;c.lastInter=-1;c.speed=0;}
    } else {
      // follow the lane, choose a way at each intersection
      // an emergency vehicle coming with its siren going: pull over to the kerb and stop until it's gone by
      c.yieldSv=false;
      for(const sv of SVC){if(!sv.alive||!sv.svc||sv.svc.st!=='go')continue;const ox=sv.pos.x-c.pos.x,oz=sv.pos.z-c.pos.z;if(Math.abs(ox)+Math.abs(oz)>40)continue;
        const vs=Math.sin(sv.heading),vc=Math.cos(sv.heading),along=-(ox*vs+oz*vc),lat=Math.abs(ox*vc-oz*vs);
        if(along>0&&along<30&&lat<4.5){c.yieldSv=true;break;}}
      const rx=mod(c.pos.x,CELL),rz=mod(c.pos.z,CELL);
      {const bx=Math.floor(c.pos.x/CELL),bz=Math.floor(c.pos.z/CELL);
       // driving out of town along a main street, past the last of its blocks: onto the country highway from there
       if(biomeOf(bx,bz)==='plains'&&!c.svcPool){const ax=c.dir%2?'x':'z',k=ax==='x'?Math.floor((c.pos.z+3)/CELL):Math.floor((c.pos.x+3)/CELL);
         const along=ax==='x'?c.pos.x:c.pos.z,m=Math.floor(along/CELL),dir=c.dir===1||c.dir===0?1:-1;
         if(hwLine(ax,k,m)===null&&hwLine(ax,k,m-dir)==='country'){
           // the place whose highway this is, and the routes leaving it here
           let T=null;const r0=Math.round((ax==='x'?m:k)/SET_SP),q0=Math.round((ax==='x'?k:m)/SET_SP);
           for(let rx=r0-1;rx<=r0+1&&!T;rx++)for(let rz=q0-1;rz<=q0+1&&!T;rz++){const P=placeAt(rx,rz);const S=axisSpan(P,ax);if(S&&S.k===k&&S.kind==='country'&&(dir>0?S.m1===m-1:S.m0===m+1))T=P;}
           const opts=T?routesAtExit(T,ax,dir):[];
           if(opts.length){const o=opts[Math.floor(Math.random()*opts.length)];c.rt={R:o.R,dir:o.dir,lane:1.5,i:o.dir>0?0:o.R.pts.length-2};}
           else{c.dir=(c.dir+2)%4;c.lastInter=-1;}   // (no highway on: turn round)
         }}}
      if(!c.hwPool&&!c.police&&c.veh!=='fire'&&!c.leaving&&!c.hw){const R=onRampAhead(c);if(R){c.path=R.on.slice(1);c.pathEnd='join';c.join={ax:R.ax,dir:R.d,lane:R.outer,y:R.HY+1};c.hw=null;c.waitK=null;}}
      if(rx<ROADW&&rz<ROADW){const ix=Math.floor(c.pos.x/CELL),iz=Math.floor(c.pos.z/CELL),ik=ckey(ix,iz);if(c.lastInter!==ik){c.lastInter=ik;const r=Math.random();
        let want=r<0.22?(c.dir+1)%4:r<0.44?(c.dir+3)%4:c.dir;
        // never turn into a street a superblock has built over; at a dead end, turn round
        if(!segOpen(ix,iz,want)||rampBlocked(ix,iz,want)){const opts=[c.dir,(c.dir+1)%4,(c.dir+3)%4].filter(d=>segOpen(ix,iz,d)&&!rampBlocked(ix,iz,d));want=opts.length?opts[Math.floor(Math.random()*opts.length)]:(c.dir+2)%4;}
        // ordinary traffic keeps away from destroyed blocks: if the way it picked runs past one, it takes another way
        // that doesn't (turning back if it has to) -- unless every way does. Emergency vehicles and police go anywhere.
        if(!c.svcPool&&!c.police&&segRuined(ix,iz,want)){
          const fw=[c.dir,(c.dir+1)%4,(c.dir+3)%4].filter(d=>segOpen(ix,iz,d)&&!rampBlocked(ix,iz,d)&&!segRuined(ix,iz,d)),back=(c.dir+2)%4;
          if(fw.length)want=fw[Math.floor(Math.random()*fw.length)];else if(segOpen(ix,iz,back)&&!rampBlocked(ix,iz,back)&&!segRuined(ix,iz,back))want=back;}
        c.dir=want;c.rbDone=false;}}
      let lane=laneOf(c);let vx,vz;
      if(c.yieldSv){const mid=(c.dir===0||c.dir===2?Math.floor(c.pos.x/CELL):Math.floor(c.pos.z/CELL))*CELL+RC;lane+=Math.sign(lane-mid)*1.3;}
      if(c.dir===0||c.dir===2){vz=DIRV[c.dir][1];vx=Math.max(-0.6,Math.min(0.6,(lane-c.pos.x)*0.5));}
      else{vx=DIRV[c.dir][0];vz=Math.max(-0.6,Math.min(0.6,(lane-c.pos.z)*0.5));}
      // a roundabout: circle it (keeping the island on your left) until you reach your exit, then take the lane out
      c.inRound=false;
      if(rx<ROADW+1.5&&rz<ROADW+1.5&&!c.rbDone){
        const ix=Math.floor(c.pos.x/CELL),iz=Math.floor(c.pos.z/CELL);
        if(ctlAt(ix,iz).k==='round'&&c.lastInter===ckey(ix,iz)){
          const ox=c.pos.x-(ix*CELL+ROADW/2),oz=c.pos.z-(iz*CELL+ROADW/2),rr=Math.hypot(ox,oz)||0.01;
          const rem=((Math.atan2(oz,ox)-RB_EXIT[c.dir])%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
          if(rem<0.3)c.rbDone=true;
          else{const k=(RB_R-rr)*0.7;vx=oz/rr+ox/rr*k;vz=-ox/rr+oz/rr*k;c.inRound=true;}   // along the circle, nudged back onto its radius
        }
      }
      let diff=Math.atan2(vx,vz)-c.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
      c.heading+=Math.max(-3*dt,Math.min(3*dt,diff));c.steer=Math.max(-1,Math.min(1,diff*2));
      let target=8;const sh=Math.sin(c.heading),ch=Math.cos(c.heading);
      c.jamT=Math.abs(c.speed)<0.3?(c.jamT||0)+dt:0;if(c.jamT>9)c.jamT=0;
      const offLane=Math.abs(lane-(c.dir%2?c.pos.z:c.pos.x))>1;
      // wandered off its lane (onto the pavement, against a pillar) and stuck there: slide back over into the lane
      if(c.jamT>4&&offLane){const cur=c.dir%2?c.pos.z:c.pos.x,d=lane-cur,st=Math.sign(d)*Math.min(Math.abs(d),2*dt),nx=c.dir%2?c.pos.x:c.pos.x+st,nz=c.dir%2?c.pos.z+st:c.pos.z;
        if(Math.abs(groundAt(nx,nz,c.pos.y+0.6)-c.pos.y)<0.6&&!solidAt(Math.floor(nx),Math.floor(c.pos.y+0.5),Math.floor(nz))){c.pos.x=nx;c.pos.z=nz;let df=DIRH[c.dir]-c.heading;df=Math.atan2(Math.sin(df),Math.cos(df));c.heading+=df*Math.min(1,dt*2);}}
      if(c.jamT<7)for(const o of cars){if(o===c||!o.alive)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z,along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<7.5+c.hz+o.hz-3.2&&lat<1.9&&Math.abs(o.pos.y-c.pos.y)<2){const ga=along-(c.hz+o.hz-3.2);
        // head-on (one of them has strayed into the wrong lane, turning round): the stray creeps back over to its own side, the other waits
        if(Math.cos(o.heading-c.heading)<-0.5){target=Math.min(target,offLane?1.5:ga<3?0:2);continue;}
        // (following: as fast as the car in front, plus a bit for the gap. A flat crawl behind anything nearby, even something
        // pulling away at full speed, meant a queue could never get going again before the lights changed)
        target=Math.min(target,ga<4?0:Math.max(3,Math.max(0,o.speed*Math.cos(o.heading-c.heading))+(ga-4)*0.8));}}
      target=Math.min(target,trafficLimit(c,dt));if(c.inRound)target=Math.min(target,5);if(c.yieldSv)target=Math.min(target,0.6);
      if(tgt&&c.honkT<=0){const ox=tgt.p.pos.x-c.pos.x,oz=tgt.p.pos.z-c.pos.z,along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<12&&lat<2.5){sfx('Car horn',()=>{horn(0.05);});c.honkT=2.5;}}
      // brake firmly (up to 10 u/s^2) so cars actually stop where they mean to; pull away gently
      // (rolling off the foot of a ramp it's barely ever 'grounded' between the little steps: without this a long truck can only coast, at a crawl, and holds everyone up)
      if(c.grounded||rampUnder(c.pos.x,c.pos.z,c.pos.y+0.5)){if(target<c.speed)c.speed=Math.max(target,c.speed-10*dt);else c.speed+=(target-c.speed)*Math.min(1,dt*1.5);}
    }
    if(c.speed>0.3&&!c.drv){const lim=xingLimit(c);if(lim<c.speed)c.speed=Math.max(lim,c.speed-14*dt);}   // (the barriers are down at a level crossing ahead)
    const fx=Math.sin(c.heading),fz=Math.cos(c.heading),dir=c.speed<0?-1:1;
    if(Math.abs(c.speed)>0.05){
      const ahead=groundAt(c.pos.x+fx*2.1*dir,c.pos.z+fz*2.1*dir,c.pos.y);
      // cars can't climb anything, and ordinary traffic won't drive into a hole either
      const rampLim=rampUnder(c.pos.x,c.pos.z,c.pos.y+0.5)||rampUnder(c.pos.x+fx*1.2*dir,c.pos.z+fz*1.2*dir,c.pos.y+0.5)||rampUnder(c.pos.x+fx*2.1*dir,c.pos.z+fz*2.1*dir,c.pos.y+0.5)?1.6:0.3;
      // dropped into a pothole (or a dip in the road): an ordinary car can bump its way back up one block onto the road
      const outOfHole=!c.hunter&&!c.drv&&c.pos.y<G+0.95&&c.pos.y>G-1.5&&ahead-c.pos.y<=1.1&&ahead>=G+0.95;
      if(!outOfHole&&c.pos.y>=G+0.95){c.holeT=0;c.holeNeed=0;}
      if(outOfHole){
        // it takes some doing: the car rocks back and forth against the lip, wheels spinning and kicking up dirt, engine
        // straining, until (after a few goes) it lurches up and out
        c.holeT=(c.holeT||0)+dt;if(!c.holeNeed)c.holeNeed=2.2+Math.random()*2.8;
        if(c.holeT<c.holeNeed){
          const ph=Math.sin(c.holeT*7.5),push=Math.max(0,ph);
          c.pos.x+=fx*ph*1.1*dir*dt;c.pos.z+=fz*ph*1.1*dir*dt;c.spinP=-ph*0.9*dir;c.speed=Math.max(Math.abs(c.speed),1)*Math.sign(c.speed||1);
          if(push>0.6&&Math.random()<dt*14)puff(c.pos.x-fx*dir*(c.hz||1.6),c.pos.y+0.2,c.pos.z-fz*dir*(c.hz||1.6),2,0x6e5a42,0.7);   // dirt flung out behind
          if(Math.random()<dt*1.6){const np=nearestPlayer(c.pos.x,c.pos.z,false);if(np&&np.d<36){const v=0.05*(1-np.d/36);sfx('Wheels spinning',()=>{tone('sawtooth',70,120+Math.random()*40,0.45,v);noise(0.35,v*0.8,500,'lowpass');});}}
        } else {
          c.pos.y=ahead+0.05;c.vy=3.2;c.grounded=false;c.spinP=-1.6*dir;c.holeT=0;c.holeNeed=0;
          c.pos.x+=fx*1.4*dir;c.pos.z+=fz*1.4*dir;c.speed=Math.max(Math.abs(c.speed),3)*Math.sign(c.speed||1);
          puff(c.pos.x-fx*dir*(c.hz||1.6),c.pos.y,c.pos.z-fz*dir*(c.hz||1.6),7,0x6e5a42,1.1);
          {const np=nearestPlayer(c.pos.x,c.pos.z,false);if(np&&np.d<36)sfx('Vehicle lurches free',()=>{thud(0.15*(1-np.d/36));});}
        }
      }
      else if((c.drv||c.hunter)&&c.grounded&&ahead-c.pos.y>rampLim&&ahead-c.pos.y<=1.05&&Math.abs(c.speed)>1&&!solidAt(c.pos.x+fx*2.1*dir,Math.floor(ahead)+1,c.pos.z+fz*2.1*dir)&&!solidAt(c.pos.x+fx*2.1*dir,Math.floor(ahead)+2,c.pos.z+fz*2.1*dir)){
        c.pos.y=ahead+0.02;c.vy=0;c.stepT=Math.min(3,(c.hz*2+1)/Math.max(1,Math.abs(c.speed))+0.2);c.speed*=0.85;c.pos.x+=fx*c.speed*dt;c.pos.z+=fz*c.speed*dt;c.spinP=-0.8*dir;   // (up a kerb or a step, as a goblin steps up one: a jolt up onto it, and carPhysics settles it)
        {const np=nearestPlayer(c.pos.x,c.pos.z,false);if(np&&np.d<36)sfx('Vehicle bumps up a kerb',()=>{thud(0.12*(1-np.d/36));});}
      }
      else if(ahead-c.pos.y>rampLim){
        // (into a wall fast enough, and it smashes a hole in it, wrecking its own front and losing most of its speed;
        // the bigger the vehicle and the faster, the bigger the hole; slower than that, it bounces off)
        if((c.hunter||c.drv)&&Math.abs(c.speed)>13){const sp=Math.abs(c.speed),k=Math.min(1,(sp-13)/15),big=c.hz>3*ES?1.35:c.veh==='bike'?0.7:1,R=(1.5+k*1.4)*big,
            ix=c.pos.x+fx*2.7*dir,iz=c.pos.z+fz*2.7*dir,iy=c.pos.y+Math.min(R*0.9,(c.hy||1.4)*0.6)+0.1;
          crushBall(ix,iy,iz,R,{force:0.8+k});damageCar(c,4+sp*0.4,undefined,'acc');sfx('Vehicle crashes into a wall',()=>{thud(0.7);clang();});addShake(0.4+k*0.5,ix,iz,25);smoke(ix,iy,iz,6,0x9a948a);
          c.speed*=0.35;}
        else if(c.hunter||c.drv){if(Math.abs(c.speed)>6){damageCar(c,1,undefined,'acc');sfx('Vehicle bumps a wall',()=>{thud(0.25);});}c.speed*=-0.25;if(c.reverseT<=0)c.reverseT=0.8;}
        else if(c.path){const W=c.path[0],d=Math.hypot(W.x-c.pos.x,W.z-c.pos.z)||1;c.speed=Math.min(c.speed,1);nudgeFlat(c,(W.x-c.pos.x)/d*2*dt,(W.z-c.pos.z)/d*2*dt);
          // wedged against a barrier just after peeling off the motorway: give up on the exit and carry on along the motorway
          c.pathBlk=(c.pathBlk||0)+dt;if(c.pathBlk>1.5&&c.prevHw&&Math.abs(c.pos.y-c.prevHw.y)<1.2){c.hw=c.prevHw;c.prevHw=null;c.path=null;c.pathBlk=0;}}
        else{c.dir=(c.dir+2)%4;c.speed=0;c.lastInter=-1;}
      } else {c.pos.x+=fx*c.speed*dt;c.pos.z+=fz*c.speed*dt;if(c.path)c.pathBlk=0;}
    }
    if(Math.abs(c.speed)>2&&c.pos.y<G+3&&knockFixtures(c.pos.x+fx*1.4*dir,c.pos.z+fz*1.4*dir,1.1,fx*dir,fz*dir)){c.speed*=0.5;damageCar(c,2,undefined,'acc');}
    for(const q of players){
      if(!q.active||q.state==='dead'||!c.alive)continue;
      if(q.vcl&&q.state==='climb'&&q.vcl.v===c||q.drv)continue;
      if(Math.abs(c.speed)>3&&c.ramCD<=0&&q.standCar!==c&&q.in.climb&&!DT.gob&&q.pos.y<c.pos.y+(c.hy||1.4)-0.6&&carHitsPlayer(c,q)&&vGrab(q,3,c))continue;   // (holding climb: he catches hold of it)
      if(Math.abs(c.speed)>3&&c.ramCD<=0&&q.standCar!==c&&!(q.standCar&&q.standCar.isTrain)&&q.pos.y<c.pos.y+(c.hy||1.4)-0.6&&carHitsPlayer(c,q)){   // (and a car the train's just sent flying doesn't knock its riders off)
        const fast=Math.abs(c.speed)>9;
        damagePlayer(q,fast?4:2,new V3(q.pos.x,q.pos.y+1.3,q.pos.z),new V3(fx*dir,0.3,fz*dir),fast?'Run down':'Hit by traffic',c.driver);
        shove(q,fx*dir*1.4,fz*dir*1.4);
        c.speed*=-0.3;c.reverseT=0.9;c.ramCD=1.2;sfx('Vehicle rams a hippo',()=>{thud(0.8);clang();});addShake(0.4,q.pos.x,q.pos.z,10);
        flashLabel(fast?'Run down':'Hit by traffic',q);
        damageCar(c,2,undefined,'acc');
      }
    }
    if(!c.alive)continue;
    if(c.hunter&&Math.abs(c.speed)>5)for(const gb of goblins){if(gb.state!=='chase')continue;if(carHitsGoblin(c,gb))damageGoblin(gb,6,new V3(gb.pos.x,gb.pos.y+0.8,gb.pos.z),new V3(fx*dir,0.5,fz*dir),'Run over',c.driver);}
    // (any other car going at a fair lick knocks a goblin in its way flying, and brakes hard; only near someone, where it can be seen)
    else if(Math.abs(c.speed)>5&&nearestPlayer(c.pos.x,c.pos.z,false)?.d<140){const sp=Math.abs(c.speed),R=c.hz+1.5;
      for(const gb of goblins){if(gb.state!=='chase'||gb.hp<=0||gb.trainT>0||!gb.root.visible)continue;const ex=gb.pos.x-c.pos.x,ez=gb.pos.z-c.pos.z;if(ex>R||ex<-R||ez>R||ez<-R||!carHitsGoblin(c,gb))continue;
        const k=Math.min(1,sp/24),sg=(ex*fz-ez*fx)>=0?1:-1,D=new V3(fx*dir*0.8+fz*sg*0.5,0,fz*dir*0.8-fx*sg*0.5);gb.trainT=1;
        damageGoblin(gb,Math.round(2+8*k),new V3(gb.pos.x,gb.pos.y+0.8,gb.pos.z),D,'Run over',c.driver||ACCIDENT);gb.vy=Math.max(gb.vy||0,5+8*k);gb.kv.x+=D.x*(6+14*k);gb.kv.z+=D.z*(6+14*k);
        c.speed*=0.6;sfx('Vehicle runs a goblin over',()=>{thud(0.3);});}}
    if(c.hp<15){c.smokeT-=dt;if(c.smokeT<=0){c.smokeT=c.hp<8?0.06:0.15;const hx=c.pos.x+fx*1.5,hz=c.pos.z+fz*1.5;smoke(hx,c.pos.y+1.1,hz,1,c.hp<8?0x1a1a1a:0x666666);if(c.hp<8)puff(hx,c.pos.y+0.9,hz,1,Math.random()<.5?0xff8a2a:0xffc040,0.25);}}
    carPhysics(c,dt);if(!c.alive)continue;
    if(Math.abs(c.kv.x)+Math.abs(c.kv.z)>0.05){nudgeFlat(c,c.kv.x*dt,c.kv.z*dt);const k=Math.exp(-dt*3.5);c.kv.x*=k;c.kv.z*=k;}
    c.g.position.copy(c.pos);c.g.rotation.set(c.pitch,c.heading,c.roll+(c.veh==='bike'?-c.steer*Math.min(1,Math.abs(c.speed)/8)*0.4:0));   // (a motorcycle leans into its turns)
    for(const w of c.wheels)w.rotation.x+=c.speed*dt/0.36;
    for(const f of c.front)f.rotation.y=c.steer*0.45;
  }
  // fender benders
  for(let i=0;i<cars.length;i++){const a=cars[i];if(!a.alive)continue;for(let j=i+1;j<cars.length;j++){const b=cars[j];if(!b.alive)continue;
    const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz);
    if(d<a.hz+b.hz+0.5&&d>0.001&&Math.abs(b.pos.y-a.pos.y)<1.6&&boxesTouch(a.pos.x,a.pos.z,a.heading,a.hx+0.15,a.hz+0.15,b.pos.x,b.pos.z,b.heading,b.hx+0.15,b.hz+0.15)){const push=0.25,ux=dx/d,uz=dz/d;nudgeFlat(a,-ux*push,-uz*push);nudgeFlat(b,ux*push,uz*push);
      const rel=Math.abs(a.speed-b.speed*(Math.cos(a.heading-b.heading)));
      // (a news van's on the road the longest, nobody gives way to it, and a bump's no story: it takes these lightly)
      if(rel>5){if(a.svcPool!=='news'&&b.svcPool!=='news')reportNews(a.pos.x,a.pos.z,'car crash');damageCar(a,a.svcPool==='news'?1:4,undefined,'acc');damageCar(b,b.svcPool==='news'?1:4,undefined,'acc');sfx('Vehicles collide',()=>{clang();thud(0.4);});addShake(0.2,a.pos.x,a.pos.z,15);}
      a.speed*=0.5;b.speed*=0.5;}}}
}
function updateSiren(dt){
  let best=null,bd=1e9;
  for(const c of cars){if(!c.alive||!c.police||!c.hunter)continue;const n=nearestPlayer(c.pos.x,c.pos.z,false);if(n&&n.d<bd){bd=n.d;best=c;}}
  if(!best||!playing)return;
  sirenT-=dt;
  if(sirenT<=0){sirenT=0.42;sirenHi=!sirenHi;const att=Math.max(0.1,1-bd/50),f=sirenHi?980:740;tone('square',f,f,0.38,0.035*att);tone('sine',f,f*0.98,0.38,0.03*att);}
}
function huntersCount(){let n=0;for(const c of cars)if(c.alive&&c.hunter)n++;return n;}

