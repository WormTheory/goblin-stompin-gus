// ---------- Loop ----------
// Nobody leaves the world. Past WORLD_EDGE (world/places.js) chunk numbers run out and the ships' pockets begin, so a
// player who gets that far (hours on foot, most of an hour in a jet) is stopped there, out of whatever they were driving.
function worldEdgeTick(){
  for(const p of players){if(!p.active||!(p.pos.x<SHIP_X0))continue;   // (aboard a ship, in its pocket: that's a place of its own)
    const x=p.pos.x,z=p.pos.z;if(!isFinite(x)||!isFinite(z)||Math.abs(x)<=WORLD_EDGE&&Math.abs(z)<=WORLD_EDGE)continue;
    if(p.drv)drvExit(p);
    p.pos.x=Math.max(-WORLD_EDGE,Math.min(WORLD_EDGE,p.pos.x));p.pos.z=Math.max(-WORLD_EDGE,Math.min(WORLD_EDGE,p.pos.z));p.mvx=p.mvz=0;
    const t=performance.now();if(!(t-p.edgeSaid<5000)){p.edgeSaid=t;flashLabel('The edge of the world',p);}}
}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let last=performance.now();
// speed effects while charging: a smoothed 0..1 intensity, and streaks rushing past the lens
// running (trample or sprint): speed lines in the world around Gus, streaming back past him along the way he's
// actually moving -- real geometry in the scene, so the other player sees them too
function bodyStreaks(p,dt){
  const PX=pwx(p),PZ=pwz(p);   // (aboard a ship, where it's really got to: the streaks are out in the world)
  const ox=p.bsx??PX,oz=p.bsz??PZ;p.bsx=PX;p.bsz=PZ;
  if(dt>0){const vx=(PX-ox)/dt,vz=(PZ-oz)/dt,a=Math.min(1,dt*10);if(Math.hypot(vx,vz)<60){p.bvx=(p.bvx||0)+(vx-(p.bvx||0))*a;p.bvz=(p.bvz||0)+(vz-(p.bvz||0))*a;}}
  const sp=Math.hypot(p.bvx||0,p.bvz||0),want=(p.trK||0)>0.05&&p.state==='walk'&&sp>2&&!p.paused?Math.min(1,p.trK):0;
  p.bsK=(p.bsK||0)+(want-(p.bsK||0))*Math.min(1,dt*(want>(p.bsK||0)?6:5.5));
  // each streak is a thin tapered ribbon, drawn twice crossed (flat and upright) so it reads from any angle; a gradient
  // alpha map fades it from a bright head to nothing at the tail. (Plain GL lines are a single pixel wide -- too faint.)
  if(!p.bstr){if(p.bsK<0.02)return;
    const N=12,V=N*12,pos=new Float32Array(V*3),uv=new Float32Array(V*2),geo=new THREE.BufferGeometry();
    for(let i=0;i<N;i++)for(let q=0;q<2;q++){const o=(i*12+q*6)*2;uv.set([0,0,1,0,1,1,0,0,1,1,0,1],o);}
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    if(!bodyStreaks.tex){const c=document.createElement('canvas');c.width=64;c.height=4;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,64,0);
      gr.addColorStop(0,'#fff');gr.addColorStop(0.25,'#bbb');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,64,4);bodyStreaks.tex=new THREE.CanvasTexture(c);}
    const mat=new THREE.MeshBasicMaterial({color:0xfbf8f0,alphaMap:bodyStreaks.tex,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const ls=new THREE.Mesh(geo,mat);ls.frustumCulled=false;ls.renderOrder=9;scene.add(ls);
    p.bstr={ls,pos,pts:Array.from({length:N},()=>({life:0,t:1}))};}
  const B=p.bstr,P=B.pos,put=(o,x,y,z)=>{P[o]=x;P[o+1]=y;P[o+2]=z;};
  // each streak is born somewhere around him, a little ahead of his nose, pointing the way he's going -- and from then on
  // it's on its own: it holds its place in the world (drifting back slowly, like air he's pushing past) while he runs on
  // through it, and fades away. New ones only appear while he's running; the last few just finish and fade.
  const dx=(p.bvx||0)/(sp||1),dz=(p.bvz||0)/(sp||1),px=-dz,pz=dx;
  const live=want>0&&p.state!=='dead'&&!p.paused;let any=false;
  B.pts.forEach((s,i)=>{
    s.t+=dt/(s.life||1);
    if(s.t>=1&&live&&Math.random()<dt*14){   // (staggered, so they don't all appear at once)
      const a=Math.random()*Math.PI*2,r=1.35+Math.random()*1.0,sx=Math.cos(a)*r*1.15,sy=Math.sin(a)*r*0.75+0.15,ahead=0.8+Math.random()*2.2;
      s.x=PX+dx*ahead+px*sx;s.y=p.pos.y+1.1+sy;s.z=PZ+dz*ahead+pz*sx;s.dx=dx;s.dz=dz;s.vx=-dx*(1.5+Math.random()*2);s.vz=-dz*(1.5+Math.random()*2);
      s.l=(1.3+Math.random()*1.4)*(0.6+0.4*Math.min(1,sp/14));s.w=0.025+Math.random()*0.02;s.life=0.35+Math.random()*0.25;s.t=0;}
    const o0=i*36;
    if(s.t>=1){for(let k=0;k<36;k++)P[o0+k]=0;return;}
    any=true;s.x+=s.vx*dt;s.z+=s.vz*dt;
    const hx=s.x,hy=s.y,hz=s.z,tx=hx-s.dx*s.l,tz=hz-s.dz*s.l,qx=-s.dz,qz=s.dx;
    // (each one grows in and shrinks away over its life instead of popping)
    const w=s.w*Math.sin(s.t*Math.PI),wt=w*0.35;
    for(let q=0;q<2;q++){const ax=q?0:qx,ay=q?1:0,az=q?0:qz,o=(i*12+q*6)*3;
      const h0=[hx-ax*w,hy-ay*w,hz-az*w],t0=[tx-ax*wt,hy-ay*wt,tz-az*wt],t1=[tx+ax*wt,hy+ay*wt,tz+az*wt],h1=[hx+ax*w,hy+ay*w,hz+az*w];
      put(o,...h0);put(o+3,...t0);put(o+6,...t1);put(o+9,...h0);put(o+12,...t1);put(o+15,...h1);}
  });
  B.ls.visible=any;B.ls.material.opacity=0.38;
  if(any)B.ls.geometry.attributes.position.needsUpdate=true;
}
function updateSpeedFx(p,dt){
  const mv=Math.hypot(p.mvx||0,p.mvz||0);
  const target=p.state!=='dead'&&!p.paused&&(p.wasCharging||mv>7)?1:0,k0=p.speedFx||0;
  p.speedFx=k0+(target-k0)*Math.min(1,dt*(target?5:3));
  // R2 windup: the camera leans in a notch at each charge level
  const wzT=p.state==='windup'||p.pHover&&p.state==='pound'?[0.06,0.12,0.19][p.stompLevel||0]:0,wz0=p.windZoom||0;
  p.windZoom=wz0+(wzT-wz0)*Math.min(1,dt*(wzT>wz0?7:4));
  const k=p.speedFx;
  if(!p.streak){
    const N=24,pos=new Float32Array(N*6),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.LineBasicMaterial({color:0xf4f1ea,transparent:true,opacity:0,depthTest:false,depthWrite:false,fog:false});
    const ls=new THREE.LineSegments(geo,mat);ls.frustumCulled=false;ls.renderOrder=10;ls.visible=false;
    // each player's streaks live on their own layer so they never show up in the other player's view
    ls.layers.set(1+p.idx);p.camera.layers.enable(1+p.idx);p.camera.add(ls);scene.add(p.camera);
    const spawn=s=>{s.a=Math.random()*Math.PI*2;s.r=2.4+Math.random()*2.2;s.z=-9-Math.random()*6;return s;};
    p.streak={ls,pos,spawn,pts:Array.from({length:N},()=>spawn({}))};
  }
  const S=p.streak;S.ls.visible=k>0.03;if(!S.ls.visible)return;
  S.ls.material.opacity=0.3*k;
  const sp=24+mv,len=1.2+sp*0.05,asp=Math.sqrt(p.camera.aspect||1.6);
  S.pts.forEach((s,i)=>{
    s.z+=sp*dt;if(s.z>-1.5)S.spawn(s);
    const x=Math.cos(s.a)*s.r*asp,y=Math.sin(s.a)*s.r,o=i*6;
    S.pos[o]=x;S.pos[o+1]=y;S.pos[o+2]=s.z;S.pos[o+3]=x;S.pos[o+4]=y;S.pos[o+5]=s.z-len;
  });
  S.ls.geometry.attributes.position.needsUpdate=true;
}
// ---- the frame itself (it was at the end of render/daynight.js) ----
// one part of the world going wrong shouldn't stop the whole game: each update runs on its own, and an error in one is
// reported (once per kind) and skipped for that frame
const safe=(name,f)=>{if(PROF_ON){safeT(name,f);return;}try{f();}catch(e){if(!safe.seen[name]){safe.seen[name]=1;console.error('['+name+']',e);}}};safe.seen={};
// (the same, timed for the profiler: ui/profiler.js)
function safeT(name,f){const t0=performance.now(),c0=PROF_CH;PROF_CH=0;try{f();}catch(e){if(!safe.seen[name]){safe.seen[name]=1;console.error('['+name+']',e);}}const el=performance.now()-t0;profAdd(name,el-PROF_CH);PROF_CH=c0+el;}
// The graphics card's programs are made the first time something needing each is drawn, and that's a stall: the first explosion, or
// the first sprint. Everything hidden in the scene gets its program here instead, on the second frame, while the game is still
// on the title screen. (Plus the speed lines, whose materials aren't made till they're needed. These stay referenced, as
// three.js throws away a program once nothing is using it.)
let warmT=0,frameMs=16;const WARM=[];
function warmShaders(){
  if(!renderer.compile)return;
  const L=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({transparent:true,fog:false})),M=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({alphaMap:tex,transparent:true,side:THREE.DoubleSide,fog:false}));
  for(const o of [L,M]){scene.add(o);WARM.push(o);}
  try{renderer.compile(scene,P1.camera);}catch(e){}
  for(const o of [L,M])scene.remove(o);
  try{wpnIconsAll();}catch(e){}   // (the weapon bar's pictures, gob-weapons.js: drawn now, not when Gnash first shows it)
}
// One frame. frame0 does the work; this asks for the next one whatever happened in it. (It used to be asked for on
// frame0's last line, so anything going wrong outside a safe() -- the controls, a camera, drawing -- stopped the game
// dead for good. Now that frame is lost and the next one carries on; each kind of error is reported once.)
const frameErrs=new Set();
function frame(now,bg){
  try{collInFrame=true;frame0(now,bg);}
  catch(e){const k=String(e&&e.message||e);if(!frameErrs.has(k)&&frameErrs.size<20){frameErrs.add(k);console.error('[frame]',e);}}
  finally{collInFrame=false;if(!bg)requestAnimationFrame(frame);}   // (bg: nobody's looking, and the browser has stopped giving this tab frames)
}
function frame0(now,bg){   // (bg: a tab in the background while online, kept going by netBgClock without being drawn)
  if(warmT<2&&++warmT===2)warmShaders();
  madeNow=0;profBegin(now);
  fpsTick((now-last)/1000);safe('sound list',sndTick);
  frameMs+=(Math.min(100,Math.max(0,now-last))-frameMs)*0.05;   // (how long frames have been taking lately)
  const dt=Math.max(0,Math.min(0.06,(now-last)/1000));last=now;   // (never below 0: a long boot can hand the first frame a timestamp older than last, and negative time winds timers up, which queued a stomp nobody pressed)
  if(menuOpen)obitPreviewTick(dt);
  if(menuOpen&&curTab==='dev'){safe('devfo',()=>devFoTick(dt));safe('devst',()=>stTick(dt));}
  if(TS.search)safe('tenv',tenvTick);
  readInputs(dt);
  safe('net',()=>netTick(now,dt));   // (online: a guest's controls into its seat on the host; a guest's own sent on)
  // (online the city never stops for one player's menu: the others are still playing)
  playing=!menuOpen&&players.some(p=>p.active&&!p.paused)||netHost()&&NET.guests.size>0||netGuest()&&NET.joined;
  const netG=netGuest()&&NET.joined;if(netG){safe('dress',()=>netGuestDress(dt));safe('net',()=>netGuestFrame(dt));}
  // game time: scaled by the debug speed (0 when paused, or one 60th of a second for a single step), and cut
  // into short steps so a fast setting doesn't make things tunnel through walls
  // Paused (the menu open, or every hippo paused in co-op) the city stops dead, the same as the debug menu's Stop
  // time: nothing falls, burns, drives or ticks on. (Before the first game the title screen's city keeps going.)
  const held=begun&&!playing;
  let gdt=held?0:dt*gameSpeed();if(DT.paused&&DT.step&&!held){gdt=1/60;DT.step=false;}
  // time stopped (or the game speed at 0): the sound stops too, and picks up again where it was
  {const frozen=playing&&(DT.paused||SPEEDS[DT.speedI]===0)||!!bg;   // (and a tab in the background online is quiet: the game's heard in the tab that's showing)
  if(audio){try{if(frozen&&audio.state==='running')audio.suspend();else if(!frozen&&audio.state==='suspended'&&audioWanted)audio.resume();}catch(e){}}}
  const nSub=Math.max(1,Math.ceil(gdt/0.05)),sdt=gdt/nSub;
  for(let sI=0;sI<nSub;sI++){
    if(netG){netGuestStep(sdt,sI===0);continue;}   // (a guest online: the host's game does the playing, see net/net-sync.js)
    if(sI>0)for(const p of players){const I=p.in;I.jumpPress=I.bitePress=I.lockPress=I.chargePress=I.dashPress=I.sprintPress=false;for(const k of CTX_PRESS)I[k]=false;}
    for(const p of players){DBG_WHO='p';safe('player',()=>updatePlayer(p,sdt));DBG_WHO='n';}
    safe('edge',worldEdgeTick);
    safe('goblins',()=>updateGoblins(sdt));safe('fireballs',()=>{updateFireballs(sdt);updateShots(sdt);updateMines(sdt);gobPickups(sdt);});safe('cars',()=>updateCars(sdt));safe('stations',()=>updateStations(sdt));safe('services',()=>updateServices(sdt));
    safe('traffic',()=>updateTraffic(sdt));safe('farmlift',()=>farmLiftPost(sdt));safe('ships',shipCrossAll);for(const p of players)if(p.drv)safe('drive',()=>drvSeat(p));for(const p of players)if(p.vcl&&p.state==='climb')safe('vpin',()=>vRepin(p));safe('spikes',()=>updateSpikes(sdt));safe('weather',()=>updateWeather(sdt));safe('sky',()=>updateSky(sdt));
    for(const p of players)safe('health',()=>updateHealth(p,sdt));
    safe('parts',()=>updateParts(sdt));safe('rubble',()=>updateRubble(sdt));safe('shocks',()=>{updateShocks(sdt);updateCones(sdt);});safe('bodies',()=>updateBodies(sdt));safe('topples',()=>{collapseTick();updateTopples(sdt);});safe('water',()=>updateWater(sdt));
    safe('booms',()=>updateBooms(sdt));safe('fires',()=>updateFires(sdt));safe('flecks',()=>updateFlecks(sdt));
  }
  safe('far',()=>shipView(()=>updateFar(dt)));safe('debug',()=>updateDebug(gdt));safe('explore',()=>shipView(()=>updateExplore(dt)));   // (aboard a ship, the world round about is round where the ship is)
  safe('blast',()=>{bbTick(gdt);bldgDarkTick(gdt);});safe('tracks',()=>trkTick(gdt));safe('chunks',()=>{updateChunks(P2.active?2:1,dt);flushRebuilds();flushNotes(2);planAhead();regionTick();});
  camClock+=dt;
  // (a guest online is shown players it doesn't run itself: anything amiss with one mustn't stop the whole game)
  for(const p of players){try{poundWoosh(p);runWoosh(p);bodyStreaks(p,gdt);if(!p.active)continue;updateSpeedFx(p,gdt);placeCamera(p);shipCam(p);drvHud(p);updateSpeedo(p,dt);shipView(()=>updateMinimap(p,dt));p.shake*=Math.exp(-gdt*7);}catch(e){if(!netGuest())throw e;safe('view',()=>{throw e;});}}
  if(DT.freecam){P1.camera.position.copy(FC.pos);P1.camera.rotation.set(FC.pitch,FC.yaw,0,'YXZ');}
  const act=players.filter(p=>p.active);
  const nAct=act.length||1,mx=act.reduce((s,p)=>s+pwx(p),0)/nAct,mz=act.reduce((s,p)=>s+pwz(p),0)/nAct;   // (nobody active: the middle, not NaN)
  // each deck follows the players (so it always covers the sky) but its pattern stays put in the world and drifts on the
  // world's wind (windNow: the way smoke, rain and snow blow), each deck at its own speed (D.wind) and harder in windy weather
  if(!reduce&&gdt>0){const wa=windNow().a,sx=Math.sin(wa),sz=Math.cos(wa),wk=0.5+WXK.wind;
    for(const D of CLOUD_DECKS){const sp=Math.hypot(D.wind[0],D.wind[1])*dt*wk;D.drift[0]+=sx*sp;D.drift[1]+=sz*sp;}}
  for(const L of cloudLayers){const D=L.D,size=600*L.m.scale.x,u=L.m.material.uniforms;
    L.m.position.set(mx,H+D.h+L.dy,mz);u.uRep.value=size/D.period;
    // uv (0..1 across the deck) times the repeat, shifted so the deck's centre shows the pattern at the players' spot
    u.uOff.value.set(((mx-D.drift[0])/D.period-u.uRep.value/2)%1,((-mz+D.drift[1])/D.period-u.uRep.value/2)%1);
    u.uMRep.value=size/D.mperiod;u.uMOff.value.set(((mx-D.drift[0])/D.mperiod-u.uMRep.value/2)%1,((-mz+D.drift[1])/D.mperiod-u.uMRep.value/2)%1);}
  hintTime-=dt;
  for(const p of act){
    if(netGuest())safe('arms',()=>gobArmsHud(p));else gobArmsHud(p);
    const hint=p.ui.hint,grab=p===kbP()&&mouseNeedsClick();hint.hidden=!grab;
    if(grab){const txt='Click to look around with the mouse';if(hint._s!==txt){hint._s=txt;hint.textContent=txt;}}
    // (your controls on foot: a column down the left, the same place and look as a vehicle's, which take over while
    // you're in one (drvHud), so the two never show together)
    let fk=p.ui.fkeys;if(!fk){fk=p.ui.fkeys=document.createElement('div');fk.className='dkeys fkeys';fk.hidden=true;p.ui.view.append(fk);}
    fk.hidden=!(playing&&!p.drv);
    if(!fk.hidden){const txt=touchMode&&!p.pad?(p.gob?'BITE attacks  ·  STOMP throws a grenade  ·  JUMP  ·  tap DASH to dash, hold to sprint':'Hold STOMP  ·  BITE  ·  JUMP  ·  tap DASH to dash, hold to '+(abilOf(p).trample?'trample':'sprint')):bindHint(!!p.pad,p);if(fk._s!==txt){fk._s=txt;fk.innerHTML=keysHTML(txt);}}
  }
  for(const p of act){if(!p.paused)continue;const o=act.find(q=>q!==p);const txt=!o?'':o.paused?'Both paused. The city is frozen.':`The city keeps going while ${charName(o)} plays.`;if(p.ui.pstatus.textContent!==txt)p.ui.pstatus.textContent=txt;}
  const pol=cars.some(c=>c.alive&&c.police&&c.hunter);
  updateSiren(dt);promptTick(dt);safe('pops',()=>popTick(dt));
  // (the score, big, top left; under it the goblins slain, and a sticker for a police pursuit)
  {const rk=score+'|'+kills+'|'+pol;if(rk!==readoutK){readoutK=rk;const h=`<b class="sc">${score.toLocaleString('en-US')}</b><span class="rk">${kills.toLocaleString('en-US')} ${kills===1?'goblin':'goblins'} slain</span>${pol?'<i>Police pursuit</i>':''}`;if(h!==readoutH){readoutH=h;readout.innerHTML=h;}}}   // (only when it's changed: rebuilding it makes the browser lay the page out again, and even writing it out costs two number formats a frame)
  if(bg)return;   // (nobody's looking: no drawing, and no next frame asked for, the browser having stopped giving this tab any)
  const w=innerWidth,h=innerHeight;
  // (the title screen draws its own backdrop instead of the city: see ui/title-scene.js)
  if(atTitle&&menuOpen){let drew=false;safe('title',()=>{drew=titleDraw(dt,w,h);});if(drew){profEnd();return;}}
  let views;
  safe('batDraw',batDraw);safe('fxDraw',fxDraw);
  if(split==='none'){renderer.setScissorTest(false);renderView(P1,0,0,w,h);views=[[P1,0,0,w,h]];}
  else if(split==='win'){renderer.setScissorTest(false);renderView(P1,0,0,w,h);views=[[P1,0,0,w,h]];safe('w2',w2Render);}   // (player two in a window of their own, ui/seats.js)
  else{
    renderer.setScissorTest(true);
    if(split==='lr'){renderView(P1,0,0,w/2,h);renderView(P2,w/2,0,w/2,h);views=[[P1,0,0,w/2,h],[P2,w/2,0,w/2,h]];}
    else{renderView(P1,0,h/2,w,h/2);renderView(P2,0,0,w,h/2);views=[[P1,0,h/2,w,h/2],[P2,0,0,w,h/2]];}
  }
  safe('dbgOverlay',()=>drawDbgOverlay(dt,views));
  profEnd();
}
