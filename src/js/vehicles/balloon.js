// ---- Hot-air balloons (the debug menu's only, so far): a wicker basket under a big striped envelope, kept in a venue
// of their own ('tenvBalloons', kind 'balloon', updated by updateBalloons from updateVenues). It flies on its heat: Jump
// burns (the flame roars and the air in the envelope warms, so it rises), Climb vents (it cools, and down it comes),
// and left alone it cools slowly and settles. Moving only nudges it about, slowly, the way the view points, as a
// balloon's never quick to answer. The basket and the envelope are boxes in TRAIN_BOXES like any vehicle's, so it's
// stood on, bumped into and shot through the same code (trainHit passes it to balloonHit). Shot down, the envelope
// goes and the basket falls ----
// the wind at each height the balloon could be at, and which it's in now ({list:[{lab,dir,sp}],cur}): four layers by its
// height over the ground, each blowing its own way (turned from the world's wind, windNow in boat-handling.js) and harder
// the higher it is, so it's steered by climbing or sinking into the layer that goes the right way
const BAL_LAYERS=[{lab:'SURFACE',hi:10,sp:0.5,off:0},{lab:'LOW',hi:30,sp:1.6,off:-1.3},{lab:'MID',hi:60,sp:2.8,off:1.7},{lab:'HIGH',hi:1e9,sp:4,off:3.0}];
function balWinds(B){const w=windNow(),agl=B.y-balGround(B.x,B.z,B.y);
  const list=BAL_LAYERS.map((L,i)=>({lab:L.lab,dir:w.a+L.off+0.25*Math.sin(WIND.t/90+i*1.7),sp:L.sp*(0.6+w.k)}));
  return{list,cur:Math.max(0,BAL_LAYERS.findIndex(L=>agl<L.hi))};}
// the wind it's in, as a velocity
function balWind(B){const L=balWinds(B),W=L.list[L.cur];return{x:Math.sin(W.dir)*W.sp,z:Math.cos(W.dir)*W.sp};}
const BAL={hp:60,rise:5.5,sink:4.5,drift:1.7,lagT:1.5,bags:6,bagLift:1.6,bagK:0.35,ropeL:12,bh:1.3,bw:1.1,e0:4.2,e1:13.6,er:3.7,ceil:60};
const BALM={wick:new THREE.MeshLambertMaterial({color:0x9a6a34}),rim:new THREE.MeshLambertMaterial({color:0x5a3a1c}),rope:new THREE.MeshLambertMaterial({color:0x3a3028}),
  burner:new THREE.MeshLambertMaterial({color:0x6a6e74}),flame:new THREE.MeshBasicMaterial({color:0xffa83a}),
  env:[0xd8322a,0xf2c230,0x2a6ad0,0xf2f2ee].map(c=>new THREE.MeshLambertMaterial({color:c}))},BAL_COL=[0xd8322a,0xf2c230,0x2a6ad0,0xf2f2ee];
function makeBalloon(k){
  const g=new THREE.Group(),bx=(m,sx,sy,sz,x,y,z,p=g)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);p.add(o);return o;};
  // (the basket, its rim, the ropes up to the envelope's mouth, the burner and its flame)
  bx(BALM.wick,2.2,1.3,2.2,0,0.65,0);bx(BALM.rim,2.3,0.14,2.3,0,1.33,0);
  for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const r=bx(BALM.rope,0.06,3.0,0.06,x*0.95,2.75,z*0.95);r.rotation.set(-z*0.1,0,x*0.1);}
  bx(BALM.burner,0.7,0.35,0.7,0,3.3,0);const flame=bx(BALM.flame,0.45,1.1,0.45,0,4.0,0);flame.visible=false;
  // (the envelope: a stack of slices, each an octagon of two squares, narrow at the mouth, widest high up, rounded on top,
  // in bands of two colours)
  const c1=BALM.env[k%4],c2=BALM.env[(k+1)%4],N=11,env=new THREE.Group();g.add(env);
  for(let i=0;i<N;i++){const t=(i+0.5)/N,r=BAL.er*(t<0.65?0.32+0.68*Math.sin(t/0.65*Math.PI/2):Math.sqrt(Math.max(0.05,1-((t-0.65)/0.38)**2))),h=(BAL.e1-BAL.e0)/N,y=BAL.e0+h*(i+0.5),m=i%2?c1:c2;
    bx(m,r*1.7,h+0.02,r*1.7,0,y,0,env);const o=bx(m,r*1.7,h+0.02,r*1.7,0,y,0,env);o.rotation.y=Math.PI/4;}
  return{g,flame,env};
}
// one standing ahead of the player, facing them (see tenvMech, whose spot it's found as)
function tenvBalloon(){
  if(!TENV&&!TS.dbg)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  let V=venues.get('tenvBalloons');if(!V){V={kind:'balloon',bl:[]};venues.set('tenvBalloons',V);}
  const fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),cx=p.pos.x+fx*12,cz=p.pos.z+fz*12;let made=0;
  for(let i=0;i<TS.n;i++){let x=cx,z=cz,ok=false;
    for(let k=0;k<24&&!ok;k++){const a=Math.random()*Math.PI*2,r=i||k?5+Math.random()*(10+k*1.5):0;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;ok=tenvRoom(x,z,BAL.er)&&balClear(x,spGround(x,z),z);}
    if(!ok)continue;
    const n=(TS.bal=(TS.bal||0)+1),M=makeBalloon(n),B={isBalloon:true,key:'bal:'+n,ck:n,V,g:M.g,flame:M.flame,env:M.env,x,y:spGround(x,z),z,h:Math.atan2(p.pos.x-x,p.pos.z-z),vx:0,vz:0,vy:0,heat:0,hp:BAL.hp,dead:false,deadT:0};
    scene.add(B.g);balPlace(B);V.bl.push(B);made++;}
  if(!V.bl.length)venues.delete('tenvBalloons');
  tsSet(made?'Spawned '+made+' hot-air balloon'+(made>1?'s':'')+' ahead of Gus. Get in as Gnash or Grizzle: '+keyLabel(BINDS.jump.kb[0])+' burns to rise, '+keyLabel(BINDS.climb.kb[0])+' vents to sink.':'No room for a hot-air balloon just there.');
}
// is there nothing solid where the basket and the envelope would be, with it standing at y?
function balClear(x,y,z){const w=BAL.bw*0.9,r=BAL.er*0.75;
  for(const yy of [y+0.3,y+1.1])for(const [a,b] of [[-w,-w],[w,-w],[-w,w],[w,w],[0,0]])if(solidAt(Math.floor(x+a),Math.floor(yy),Math.floor(z+b)))return false;
  for(const yy of [y+BAL.e0+1,y+(BAL.e0+BAL.e1)/2,y+BAL.e1-0.5])for(const [a,b] of [[-r,0],[r,0],[0,-r],[0,r],[0,0]])if(solidAt(Math.floor(x+a),Math.floor(yy),Math.floor(z+b)))return false;
  return true;}
// the ground (or the sea) under the basket
function balGround(x,z,y){const wet=get(Math.floor(x),G,Math.floor(z))===WATER?G+1:0;let g=wet;const w=BAL.bw*0.9;
  for(const [a,b] of [[0,0],[-w,-w],[w,-w],[-w,w],[w,w]])g=Math.max(g,groundAt(x+a,z+b,y+0.6));return g;}
function balPlace(B){B.g.position.set(B.x,B.y,B.z);B.g.rotation.set(0,B.h,0);}
function updateBalloons(V,dt){
  for(const B of V.bl){
    if(B.dead){
      // (shot down: the basket drops, and lies there a while before it's cleared away)
      B.deadT+=dt;const gy=balGround(B.x,B.z,B.y);
      if(B.ws){const air=B.ws.air,v=wsStep(B.ws,B,dt);if(air&&!B.ws.air&&v>8&&!B.ws.hit){B.ws.hit=true;thud(0.5);puff(B.x,B.y+0.5,B.z,10,0x8c7a5a,1.4);hitGoblins(B.x,B.z,2,6,'Crushed by a falling balloon',B.y);}}   // (drifting on as it falls: wreck-slide.js)
      else if(B.y>gy){B.vy-=20*dt;B.y=Math.max(gy,B.y+B.vy*dt);if(B.y<=gy){if(B.vy<-8){thud(0.5);puff(B.x,B.y+0.5,B.z,10,0x8c7a5a,1.4);hitGoblins(B.x,B.z,2,6,'Crushed by a falling balloon',B.y);}B.vy=0;}}
      balPlace(B);balloonBoxes(B);continue;}
    const p=B.drv,i=p?drvIn(p):null,burn=!!(i&&i.jump),vent=!!(i&&(i.climb||i.charge));
    // the heat in the envelope: the burner warms it a second or two behind (B.lag, so a climb has to be started early),
    // it cools a little all the time, and quickly through the vent; lighter by each sandbag dropped, heavier by each goblin
    // on the rope
    B.lag=(B.lag||0)+((burn?1:0)-(B.lag||0))*Math.min(1,dt/BAL.lagT);
    B.heat+=(0.32*B.lag-0.05)*dt-(vent?0.35*dt:0);B.heat=Math.max(0,Math.min(1,B.heat));
    const tv=(B.heat>0.45?(B.heat-0.45)/0.55*BAL.rise:-(0.45-B.heat)/0.45*BAL.sink)+balWeight(B);B.vy+=(tv-B.vy)*Math.min(1,dt*0.7);
    if(i)balControls(B,p,i);
    B.flame.visible=burn;if(burn){B.flame.scale.y=0.9+Math.random()*0.5;B.burnT=(B.burnT||0)-dt;if(B.burnT<=0&&audio){B.burnT=0.3;sfx('Balloon burner',()=>noise(0.32,0.12,500,'lowpass'));}}
    const gy=balGround(B.x,B.z,B.y),air=B.y>gy+0.05;
    // drifting: with the wind of the layer it's in, and the way the view points, a little, only off the ground
    let wx=0,wz=0;if(i&&air){const yaw=p.cam.yaw+Math.PI,fx=Math.sin(yaw),fz=Math.cos(yaw),f=-i.z,r=i.x;wx=fx*f-Math.cos(yaw)*r;wz=fz*f+Math.sin(yaw)*r;const m=Math.hypot(wx,wz);if(m>1){wx/=m;wz/=m;}}
    const k=Math.min(1,dt*(air?0.6:4)),W=air?balWind(B):{x:0,z:0};B.vx+=(wx*BAL.drift+W.x-B.vx)*k;B.vz+=(wz*BAL.drift+W.z-B.vz)*k;
    {const nx=B.x+B.vx*dt,nz=B.z+B.vz*dt;
     if((nx!==B.x||nz!==B.z)&&balClear(nx,B.y,nz)&&!balHits(B,nx,nz,B.y))B.x=nx,B.z=nz;else{B.vx*=-0.2;B.vz*=-0.2;}}
    {let ny=B.y+B.vy*dt;const g2=balGround(B.x,B.z,B.y);if(ny<=g2){ny=g2;if(B.vy<-6)thud(0.3);B.vy=Math.max(0,B.vy);}
     if(B.vy>0&&(!balClear(B.x,ny,B.z)||balHits(B,B.x,B.z,ny))){ny=B.y;B.vy=0;}   // (up against something overhead)
     B.y=Math.min(ny,H+BAL.ceil);}
    vehSmoke('balloon',B,B.x,B.y+BAL.e0,B.z,dt);
    balPlace(B);balRope(B,dt);balloonBoxes(B);}
  windNow(dt);balBags(V,dt);
  V.bl=V.bl.filter(B=>{if(B.dead&&B.deadT>20&&!players.some(q=>q.drv&&q.drv.o===B)){scene.remove(B.g);return false;}return true;});
}
// another vehicle where the basket or the envelope would be?
function balHits(B,x,z,y){return!!(vehIn(x,z,B.h,BAL.bw,BAL.bw,y,y+BAL.bh,B)||vehIn(x,z,0,BAL.er*0.8,BAL.er*0.8,y+BAL.e0,y+BAL.e1,B));}
// the basket and the envelope, as boxes (the envelope's top can be stood on)
function balloonBoxes(B){
  if(!B.pr)B.pr=[0,1].map(i=>({isTrain:true,isPlane:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:i?BAL.er*0.8:BAL.bw,hz:i?BAL.er*0.8:BAL.bw,hy:i?BAL.e1-BAL.e0:BAL.bh,heading:0,top:0,veh:'plane',T:B,i}));
  const [b,e]=B.pr;b.alive=e.alive=true;b.pos.set(B.x,B.y,B.z);b.heading=B.h;b.top=B.y+BAL.bh;e.pos.set(B.x,B.y+BAL.e0,B.z);e.top=B.y+BAL.e1;e.alive=!B.dead;
  const v=Math.hypot(B.vx,B.vz);
  TRAIN_BOXES.push({x:B.x,z:B.z,tx:Math.sin(B.h),tz:Math.cos(B.h),y0:B.y,top:b.top,v,hx:BAL.bw,hz:BAL.bw,proxy:b});
  if(!B.dead)TRAIN_BOXES.push({x:B.x,z:B.z,tx:0,tz:1,y0:B.y+BAL.e0,top:e.top,v,hx:BAL.er*0.8,hz:BAL.er*0.8,proxy:e});
}
// hurt: the envelope tears and goes, and the basket (and anyone in it) comes down
function balloonHit(B,n){
  if(vehDamage('balloon',B,n)<2)return;   // (the steps every vehicle shares: registry.js)
  B.env.visible=false;B.flame.visible=false;balLetGo(B);
  for(let k=0;k<3;k++)puff(B.x,B.y+BAL.e0+k*3,B.z,10,BAL_COL[(B.ck+k)%4],2.2);
  if(audio)sfx('Balloon torn',()=>{noise(0.6,0.5,700,'bandpass');thud(0.4);});
}
// ---- sandbags and the rope ----
// Right click drops a sandbag (six to start with): a small lift at once, and it falls on whatever's below, flattening a
// goblin it lands on. Left click lets the rope down or pulls it up: hostile goblins under it grab it and climb (weighing
// the balloon down), and one that reaches the basket climbs in and tears at it; pulling the rope up drops any still on it.
// Another player on foot can climb it too, holding climb
function balWeight(B){return(BAL.bags-(B.bags??BAL.bags))*BAL.bagK-(B.climb?B.climb.filter(c=>!c.in).length*0.7:0);}
function balControls(B,p,i){if(B.bags===undefined)B.bags=BAL.bags;
  if(i.blBagP){if(B.bags>0){B.bags--;B.vy+=BAL.bagLift;const m=new THREE.Mesh(LM_BOX,BALM.rim);m.scale.set(0.5,0.45,0.5);scene.add(m);
      (B.V.bags||(B.V.bags=[])).push({m,x:B.x+0.4,y:B.y-0.3,z:B.z,vx:B.vx,vy:Math.min(0,B.vy)-1,vz:B.vz,by:p,t:0,down:false});
      if(audio)sfx('Sandbag dropped',()=>noise(0.2,0.08,400,'lowpass'));flashLabel(B.bags+' sandbag'+(B.bags===1?'':'s')+' left',p);}
    else flashLabel('No sandbags left',p);}
  if(i.blRopeP){B.rope=!B.rope;if(audio)sfx('Rope',()=>noise(0.3,0.06,900,'bandpass'));flashLabel(B.rope?'Rope down: goblins can climb it':'Rope up',p);if(!B.rope)balLetGo(B,true);}}
// the sandbags falling and lying where they land (cleared away after a while)
function balBags(V,dt){if(!V.bags)return;
  for(const b of V.bags){b.t+=dt;if(b.down)continue;b.vy-=20*dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.vx*=Math.exp(-dt*0.5);b.vz*=Math.exp(-dt*0.5);const ny=b.y+b.vy*dt,gy=groundAt(b.x,b.z,b.y+0.5);
    if(ny<=gy){b.y=gy;b.down=true;b.t=0;if(b.vy<-6){thud(0.25);puff(b.x,gy+0.3,b.z,6,0xc8b48a,0.8);
        const by='Flattened by a sandbag';hitGoblins(b.x,b.z,1.4,8,by,gy);for(const q of pvpFoes(b.by)){if(Math.hypot(q.pos.x-b.x,q.pos.z-b.z)<1.2&&Math.abs(q.pos.y-gy)<2)pvpHurt(b.by,q,4,new V3(b.x,gy,b.z),null,by,{cd:1});}}}
    else b.y=ny;b.m.position.set(b.x,b.y+0.22,b.z);}
  V.bags=V.bags.filter(b=>{if(b.down&&b.t>15){scene.remove(b.m);return false;}return true;});}
// the rope: drawn hanging from the basket, its climbers carried up it
function balRope(B,dt){const on=B.rope&&!B.dead;
  if(!B.ropeM&&on){B.ropeM=new THREE.Mesh(LM_BOX,BALM.rope);B.g.add(B.ropeM);}
  if(!B.ropeM)return;B.ropeM.visible=on;if(!on)return;
  const gy=balGround(B.x,B.z,B.y),L=Math.min(BAL.ropeL,Math.max(0.5,B.y-gy+0.3)),bot=B.y-L,c=Math.cos(B.h),s=Math.sin(B.h),rx=B.x+c*0.9+s*0.9,rz=B.z-s*0.9+c*0.9;
  B.ropeM.scale.set(0.08,L,0.08);B.ropeM.position.set(0.9,-L/2,0.9);
  B.climb=B.climb||[];
  // (hostile goblins at its foot grab it, three at most)
  if(B.climb.length<3&&!calmNow())for(const g of goblins){if(g.state!=='chase'||g.ropeB||B.climb.length>=3)continue;
    if(Math.hypot(g.pos.x-rx,g.pos.z-rz)>1.4||g.pos.y>bot+2.2||g.pos.y<bot-2.5)continue;g.ropeB=B;B.climb.push({g,h:Math.max(0,g.pos.y-bot),in:false,t:0});}
  for(const c of B.climb){const g=c.g;if(g.state!=='chase'){g.ropeB=null;c.gone=true;continue;}
    if(!c.in){c.h+=1.8*dt;if(bot+c.h>=B.y){c.in=true;c.o=(B.climb.filter(q=>q.in).length%3-1)*0.6;}}
    if(c.in){g.pos.set(B.x+c.o*Math.cos(B.h),B.y+BAL.bh+0.02,B.z-c.o*Math.sin(B.h));c.t+=dt;if(c.t>1){c.t=0;balloonHit(B,2);}}   // (in the basket: tearing at it)
    else g.pos.set(rx,bot+c.h,rz);
    g.vy=0;g.kv.set(0,0,0);g.stun=Math.max(g.stun||0,0.12);}
  B.climb=B.climb.filter(c=>!c.gone);
  // (another player, on foot at the rope, holding climb: up it, and out on to the basket's rim at the top)
  for(const q of players){if(!q.active||q.drv||q.state==='dead'||!q.in||!q.in.climb)continue;
    if(Math.hypot(q.pos.x-rx,q.pos.z-rz)>1.2||q.pos.y<bot-1.5||q.pos.y>B.y+BAL.bh)continue;
    q.pos.x+=(rx-q.pos.x)*Math.min(1,dt*8);q.pos.z+=(rz-q.pos.z)*Math.min(1,dt*8);q.vy=0;q.pos.y+=3*dt;if(q.pos.y>=B.y+BAL.bh-0.3){q.pos.y=B.y+BAL.bh+0.05;q.pos.x=B.x;q.pos.z=B.z;}}}
// the climbers let go: the rope pulled up (only those still on it), or the balloon gone (all of them)
function balLetGo(B,ropeOnly){if(!B.climb)return;for(const c of B.climb){if(ropeOnly&&c.in)continue;c.g.ropeB=null;c.gone=true;c.g.stun=0;}B.climb=B.climb.filter(c=>!c.gone);}
// the controls, for the column down the left
function balHow(p,D){const A=id=>actMark(p,id),B=D.o,n=B.bags??BAL.bags;
  return A('blBurn')+' burner (hold; it warms a moment behind)  ·  '+A('blVent')+' vent  ·  Move to trim the drift: climb or sink to change wind  ·  '+A('blBag')+' drop a sandbag ('+n+' left)  ·  '+A('blRope')+(B.rope?' pull up the rope':' let down the rope')+'  ·  ';}
