// ---- day/night: a 10-minute cycle, 6 minutes of day and 4 of night ----
const DAY_LEN=600,DAY_FRAC=0.6;let tod=0.08,clockT=0,dayN=1;
// e.g. 'Day 2, dusk', for the obituary
function timeLabel(){const t=tod,part=t<0.06?'dawn':t<0.22?'morning':t<0.38?'midday':t<0.52?'afternoon':t<0.62?'dusk':t<0.74?'evening':t<0.86?'midnight':'the small hours';return 'Day '+dayN+', '+part;}
const cA=(hex)=>new THREE.Color(hex);
const SKYC={dayTop:cA(0x5d87b0),dayHor:cA(0xa9b8b4),duskTop:cA(0x4a4a78),duskHor:cA(0xd98a5c),nightTop:cA(0x060a17),nightHor:cA(0x172030),
  lightDay:cA(0xffffff),lightNight:new THREE.Color(0.2,0.23,0.34),dusk:new THREE.Color(1,0.84,0.72),sunDay:new THREE.Color(1,0.93,0.78),sunDusk:new THREE.Color(1,0.55,0.3)};
const _wxGrey=new THREE.Color(),_wxFlash=new THREE.Color(0.92,0.95,1.0);
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const clockHand=document.getElementById('clockHand'),clockOrb=document.getElementById('clockOrb'),clockTxt=document.getElementById('clockTxt');
function updateSky(dt){
  if(playing){const pt=tod;tod=(tod+dt/DAY_LEN*DAY_SPEEDS[daySpd])%1;if(tod<pt)dayN++;}
  const day=tod<DAY_FRAC,ang=day?Math.PI*tod/DAY_FRAC:Math.PI+Math.PI*(tod-DAY_FRAC)/(1-DAY_FRAC);
  const sy=Math.sin(ang),sx=Math.cos(ang);
  skyU.uSun.value.set(sx*0.92,sy,0.38).normalize();skyU.uMoon.value.set(-sx*0.92,-sy,-0.3).normalize();
  const dk=smooth(-0.12,0.3,sy),tw=Math.max(0,1-Math.abs(sy)/0.28)*(sy>-0.18?1:0);
  skyU.uTop.value.copy(SKYC.nightTop).lerp(SKYC.dayTop,dk).lerp(SKYC.duskTop,tw*0.45);
  skyU.uHor.value.copy(SKYC.nightHor).lerp(SKYC.dayHor,dk).lerp(SKYC.duskHor,tw*0.7);
  skyU.uNight.value=1-smooth(-0.25,0.05,sy);
  skyU.uSunCol.value.copy(SKYC.sunDay).lerp(SKYC.sunDusk,tw);
  // the weather: grey it over, darken it, light it up for a lightning flash
  {const cov=WX.k.cover,dkw=WX.k.dark,grey=_wxGrey.setRGB(0.6,0.63,0.66).multiplyScalar(0.12+0.88*dk);
   skyU.uTop.value.lerp(grey,cov*0.75).multiplyScalar(1-0.5*dkw);skyU.uHor.value.lerp(grey,cov*0.6).multiplyScalar(1-0.38*dkw);
   if(WX.flash>0){const f=WX.flash*(0.6+0.4*Math.random());skyU.uTop.value.lerp(_wxFlash,f*0.6);skyU.uHor.value.lerp(_wxFlash,f*0.5);}
   skyU.uCover.value=cov;const mp=moonPhase();skyU.uPhase.value=mp;skyU.uMoonLit.value=(1-Math.cos(Math.PI*2*mp))/2;}
  SKY.copy(skyU.uHor.value);
  WORLD_LIGHT.value.copy(SKYC.lightNight).lerp(SKYC.lightDay,dk).lerp(SKYC.dusk.clone().multiplyScalar(Math.max(0.35,dk)),tw*0.55);
  WORLD_LIGHT.value.multiplyScalar(1-0.42*WX.k.dark);if(WX.flash>0)WORLD_LIGHT.value.lerp(_wxFlash,WX.flash*0.55);
  hemi.intensity=(0.16+0.59*dk)*(1-0.3*WX.k.dark);
  const moonUp=sy<0,ml=skyU.uMoonLit.value;sunLight.intensity=(moonUp?0.04+0.12*ml:0.55*dk+0.06)*(1-0.75*WX.k.cover);sunLight.color.setRGB(moonUp?0.6:1,moonUp?0.7:0.91-0.25*tw,moonUp?1:0.8-0.35*tw);
  const L=moonUp?skyU.uMoon.value:skyU.uSun.value;sunLight.position.set(L.x*10,Math.max(0.2,L.y)*10,L.z*10);
  for(const L of cloudLayers){const u=L.m.material.uniforms;u.uTint.value.copy(WORLD_LIGHT.value).multiplyScalar(1-0.25*WX.k.dark);u.uOpacity.value=Math.min(0.97,L.D.op*(0.35+0.65*dk)*(0.6+2.2*WX.k.cover));u.uCover.value=WX.k.cover;}
  // headlights and tail lights come on after dark
  const nl=1-dk;smat(CARC.head).emissive.setRGB(0.9*nl,0.8*nl,0.5*nl);smat(CARC.tail).emissive.setRGB(0.7*nl,0.06*nl,0.04*nl);
  // where the (first) player is: the kind of place, or the open country
const PLACE_LBL={city:'\u{1F3D9}\uFE0F City',large:'\u{1F3E2} Large town',small:'\u{1F3D8}\uFE0F Small town',village:'\u{1F3E1} Village',coastcity:'\u{1F3D9}\uFE0F Coastal city',harbortown:'\u2693 Harbor town',resort:'\u{1F3D6}\uFE0F Resort town',fishing:'\u{1F41F} Fishing village'};
function whereLabel(){
  const p=players.find(q=>q.active)||players[0];if(!p)return'';
  const px=Math.floor(p.pos.x/CELL),pz=Math.floor(p.pos.z/CELL),S=settlementAt(px,pz);
  if(TENV&&!tenvShow(px,pz))return'\u{1F9EA} Testing Environment';
  {const u=underAt(p.pos.x,p.pos.y,p.pos.z);if(u){const L=u==='sewer'?'\u{1F400} Sewers':u==='cave'?(bigPlainsAt(px,pz)&&bigPlainsAt(px,pz).kind==='mine'?'\u26CF\uFE0F Mine workings':'\u{1F987} Caves'):'\u{1F687} Subway';return S?'<div class="sname">'+setName(S)+'</div>'+L:L;}}
  if(seaPlot(px,pz)){const t=plotType(px,pz),O=t==='yard'||t==='basin'||t==='harbor'||t==='beach'?coastOwner(px,pz):null,on=O?'<div class="sname">'+setName(O)+'</div>':'';if(O&&coastD(p.pos.x,p.pos.z)<4)return on+(t==='harbor'?(plotInfo(px,pz).fish?'\u{1F41F} Fishing docks':'\u2693 Docks'):t==='beach'?'\u{1F3D6}\uFE0F Beach':'\u{1F6A2} Shipping port');return t==='yard'||t==='basin'?'\u{1F6A2} Shipping port':t==='navy'||t==='nbasin'?'\u2693 Naval base':t==='harbor'?'\u2693 Docks':t==='lighthouse'?'\u{1F5FC} Lighthouse':t==='rig'?'\u{1F6E2}\uFE0F Oil rig':coastD(p.pos.x,p.pos.z)>=0?'\u{1F30A} Ocean':t==='beach'?'\u{1F3D6}\uFE0F Beach':'\u{1F30A} Coast';}
  if(S)return '<div class="sname">'+setName(S)+'</div>'+(zoneAt(px,pz)==='suburb'?'\u{1F3E1} Suburbs of a '+PLACE_KIND[setKind(S)].toLowerCase():PLACE_LBL[setKind(S)]);
  if(isRiver(px,pz)||riverAt(p.pos.x,p.pos.z,RIV_W+1))return'\u{1F30A} River';
  if(tsAt(Math.floor(p.pos.x),Math.floor(p.pos.z)))return'\u26FD Truck stop';
  if(dumpAt(px,pz)!==null)return'\u{1F5D1}\uFE0F Garbage dump';
  if(castleAt(px,pz))return'\u{1F3F0} Castle';
  {const B=bigPlainsAt(px,pz);if(B)return B.kind==='nuclear'?'\u2622\uFE0F Nuclear plant':B.kind==='airport'?'\u2708\uFE0F Airport':B.kind==='nasa'?'\u{1F680} Launch site':B.kind==='mine'?'\u26CF\uFE0F Mine':B.kind==='quarry'?'\u{1FAA8} Quarry':B.kind==='lumber'?'\u{1FAB5} Lumber camp':B.kind==='campsite'?'\u{1F3D5}\uFE0F Campsite':B.kind==='cult'?'\u{1F56F}\uFE0F Cult altar':B.kind==='tower5g'?'\u{1F4E1} 5G tower':B.kind==='prepper'?'\u{1F6E1}\uFE0F Prepper compound':B.kind==='militia'?'\u{1F3AF} Militia compound':B.kind==='ruins'?'\u{1F3DB}\uFE0F Ruins':B.kind==='thieves'?"\u{1F977} Thieves' hideout":'\u{1FA96} Military base';}
  if(caveMouth(px,pz))return'\u{1F987} Cave';
  if(turbineAt(px,pz))return'\u{1F32C}\uFE0F Wind farm';
  return farmK(px,pz)!==null||farmlandOf(px,pz)?'\u{1F69C} Farmland':'\u{1F33E} Plains';
}
// in a place: how much of it has been destroyed (worked out a little each frame the first time you're there)
function destLabel(){
  const p=players.find(q=>q.active)||players[0];if(!p)return'';
  const S=settlementAt(Math.floor(p.pos.x/CELL),Math.floor(p.pos.z/CELL));if(!S)return'';
  const v=setDestroyed(S);return'<div class="dest">\u{1F4A5} Destroyed: '+(v===null?'\u2026':Math.round(v*100)+'%')+'</div>';
}
// HUD clock: daytime is the top half (sunrise on the left, sunset on the right), night the bottom half
  clockT-=dt;
  safe('dest',()=>{const p=players.find(q=>q.active);const S=p&&settlementAt(Math.floor(p.pos.x/CELL),Math.floor(p.pos.z/CELL));if(S)setDestroyed(S);
    // (otherwise, a little at a time, work out the totals for the places you've found but not been into, for the map)
    else if(destJob.S)setDestroyed(destJob.S);
    else for(const K of knownSets.values())if(!setListC.has(K.rx+','+K.rz)){setDestroyed(K);break;}});
  safe('banner',()=>placeBannerTick(dt));
  if(clockT<=0&&clockHand){
    clockT=0.2;
    const deg=day?180+180*tod/DAY_FRAC:180*(tod-DAY_FRAC)/(1-DAY_FRAC),rad=deg*Math.PI/180,hx=Math.cos(rad)*12.5,hy=Math.sin(rad)*12.5;
    clockHand.setAttribute('x2',hx.toFixed(2));clockHand.setAttribute('y2',hy.toFixed(2));
    clockOrb.setAttribute('cx',hx.toFixed(2));clockOrb.setAttribute('cy',hy.toFixed(2));
    clockOrb.setAttribute('fill',day?'#ffd75a':'#dfe6f2');
    // stacked under the clock: the day (and the time of day), then the season, the weather and the moon
    if(clockTxt){const W=WX_TYPES[WX.type],M=moonInfo(),se=seasonOf(),part=timeLabel().split(', ')[1];
      const h='<b>Day '+dayN+'<small>'+part+'</small></b><div>'+SEASON_ICONS[se]+' '+SEASONS[se]+'</div><div>'+W.i+' '+W.n+'</div><div>'+M[1]+' '+M[0]+'</div><div>'+whereLabel()+'</div>'+destLabel();
      if(clockTxt.dataset.h!==h){clockTxt.dataset.h=h;clockTxt.innerHTML=h;}}
  }
}
// one part of the world going wrong shouldn't stop the whole game: each update runs on its own, and an error in one is
// reported (once per kind) and skipped for that frame
const safe=(name,f)=>{try{f();}catch(e){if(!safe.seen[name]){safe.seen[name]=1;console.error('['+name+']',e);}}};safe.seen={};
const FPS={el:null,n:0,t:0,worst:0,shown:false};
function fpsTick(raw){
  if(!FPS.el)FPS.el=document.getElementById('fpsCounter');if(!FPS.el)return;
  if(FPS.shown!==DT.fps){FPS.shown=DT.fps;FPS.el.hidden=!DT.fps;FPS.n=0;FPS.t=0;FPS.worst=0;}
  if(!DT.fps||!(raw>0)||raw>2)return;
  FPS.n++;FPS.t+=raw;FPS.worst=Math.max(FPS.worst,raw);
  if(FPS.t>=0.5){const f=FPS.n/FPS.t;FPS.el.textContent=Math.round(f)+' FPS\n'+(1000*FPS.t/FPS.n).toFixed(1)+' ms (worst '+(FPS.worst*1000).toFixed(0)+')';
    FPS.el.className='fpsc'+(f<30?' low':f<50?' mid':'');FPS.n=0;FPS.t=0;FPS.worst=0;}
}
let readoutH='';
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
}
function frame(now){
  if(warmT<2&&++warmT===2)warmShaders();
  madeNow=0;
  fpsTick((now-last)/1000);safe('sound list',sndTick);
  frameMs+=(Math.min(100,Math.max(0,now-last))-frameMs)*0.05;   // (how long frames have been taking lately)
  const dt=Math.max(0,Math.min(0.06,(now-last)/1000));last=now;   // (never below 0: a long boot can hand the first frame a timestamp older than last, and negative time winds timers up, which queued a stomp nobody pressed)
  if(menuOpen)obitPreviewTick(dt);
  if(menuOpen&&curTab==='dev'){safe('dev',()=>devTick(dt));safe('devst',()=>stTick(dt));}
  if(TS.search)safe('tenv',tenvTick);
  readInputs(dt);
  playing=!menuOpen&&players.some(p=>p.active&&!p.paused);
  // game time: scaled by the debug speed (0 when paused, or one 60th of a second for a single step), and cut
  // into short steps so a fast setting doesn't make things tunnel through walls
  let gdt=dt*gameSpeed();if(DT.paused&&DT.step){gdt=1/60;DT.step=false;}
  // time stopped (or the game speed at 0): the sound stops too, and picks up again where it was
  {const frozen=playing&&(DT.paused||SPEEDS[DT.speedI]===0);if(audio){try{if(frozen&&audio.state==='running')audio.suspend();else if(!frozen&&audio.state==='suspended'&&audioWanted)audio.resume();}catch(e){}}}
  const nSub=Math.max(1,Math.ceil(gdt/0.05)),sdt=gdt/nSub;
  for(let sI=0;sI<nSub;sI++){
    if(sI>0)for(const p of players){const I=p.in;I.jumpPress=I.bitePress=I.lockPress=I.chargePress=I.dashPress=I.sprintPress=false;}
    for(const p of players){DBG_WHO='p';safe('player',()=>updatePlayer(p,sdt));DBG_WHO='n';}
    safe('goblins',()=>updateGoblins(sdt));safe('fireballs',()=>{updateFireballs(sdt);updateShots(sdt);});safe('cars',()=>updateCars(sdt));safe('stations',()=>updateStations(sdt));safe('services',()=>updateServices(sdt));
    safe('traffic',()=>updateTraffic(sdt));for(const p of players)if(p.drv)safe('drive',()=>drvSeat(p));for(const p of players)if(p.vcl&&p.state==='climb')safe('vpin',()=>vRepin(p));safe('spikes',()=>updateSpikes(sdt));safe('weather',()=>updateWeather(sdt));safe('sky',()=>updateSky(sdt));
    for(const p of players)safe('health',()=>updateHealth(p,sdt));
    safe('parts',()=>updateParts(sdt));safe('rubble',()=>updateRubble(sdt));safe('shocks',()=>{updateShocks(sdt);updateCones(sdt);});safe('bodies',()=>updateBodies(sdt));safe('topples',()=>updateTopples(sdt));
    safe('booms',()=>updateBooms(sdt));safe('fires',()=>updateFires(sdt));safe('flecks',()=>updateFlecks(sdt));
  }
  safe('far',()=>updateFar(dt));safe('debug',()=>updateDebug(gdt));safe('explore',()=>updateExplore(dt));
  safe('chunks',()=>{updateChunks(P2.active?2:1,dt);flushRebuilds();flushNotes(2);planAhead();regionTick();});
  camClock+=dt;
  for(const p of players){poundWoosh(p);runWoosh(p);bodyStreaks(p,gdt);if(!p.active)continue;updateSpeedFx(p,gdt);placeCamera(p);updateSpeedo(p,dt);updateMinimap(p,dt);p.shake*=Math.exp(-gdt*7);}
  if(DT.freecam){P1.camera.position.copy(FC.pos);P1.camera.rotation.set(FC.pitch,FC.yaw,0,'YXZ');}
  const act=players.filter(p=>p.active);
  const mx=act.reduce((s,p)=>s+p.pos.x,0)/act.length,mz=act.reduce((s,p)=>s+p.pos.z,0)/act.length;
  // each deck follows the players (so it always covers the sky) but its pattern stays put in the world and drifts on its own wind
  for(const D of CLOUD_DECKS){if(!reduce){const wk=0.5+WX.k.wind;D.drift[0]+=D.wind[0]*dt*wk;D.drift[1]+=D.wind[1]*dt*wk;}}
  for(const L of cloudLayers){const D=L.D,size=600*L.m.scale.x,u=L.m.material.uniforms;
    L.m.position.set(mx,H+D.h+L.dy,mz);u.uRep.value=size/D.period;
    // uv (0..1 across the deck) times the repeat, shifted so the deck's centre shows the pattern at the players' spot
    u.uOff.value.set(((mx-D.drift[0])/D.period-u.uRep.value/2)%1,((-mz+D.drift[1])/D.period-u.uRep.value/2)%1);
    u.uMRep.value=size/D.mperiod;u.uMOff.value.set(((mx-D.drift[0])/D.mperiod-u.uMRep.value/2)%1,((-mz+D.drift[1])/D.mperiod-u.uMRep.value/2)%1);}
  hintTime-=dt;
  for(const p of act){
    const hint=p.ui.hint;hint.hidden=!(playing&&hintTime>0);
    if(!hint.hidden){const txt=touchMode&&!p.pad?'Hold STOMP  ·  BITE  ·  JUMP  ·  tap DASH to dash, hold to '+(ABIL.trample?'trample':'sprint'):bindHint(!!p.pad);if(hint.textContent!==txt)hint.textContent=txt;}
  }
  for(const p of act){if(!p.paused)continue;const o=act.find(q=>q!==p);const txt=!o?'':o.paused?'Both paused. The city is frozen.':`The city keeps going while ${o.idx?'Gertie':'Gus'} plays.`;if(p.ui.pstatus.textContent!==txt)p.ui.pstatus.textContent=txt;}
  const hn=huntersCount(),pol=cars.some(c=>c.alive&&c.police&&c.hunter);
  updateSiren(dt);promptTick(dt);
  {const h=`Kills <b>${kills}</b>  ·  Score <b>${score}</b>${hn?`  ·  <i>${hn} CAR${hn>1?'S':''} HUNTING YOU</i>`:''}${pol?'  ·  <i>POLICE PURSUIT</i>':''}`;if(h!==readoutH){readoutH=h;readout.innerHTML=h;}}   // (only when it's changed: rebuilding it makes the browser lay the page out again)
  const w=innerWidth,h=innerHeight;
  let views;
  safe('batDraw',batDraw);safe('fxDraw',fxDraw);
  if(split==='none'){renderer.setScissorTest(false);renderView(P1,0,0,w,h);views=[[P1,0,0,w,h]];}
  else{
    renderer.setScissorTest(true);
    if(split==='lr'){renderView(P1,0,0,w/2,h);renderView(P2,w/2,0,w/2,h);views=[[P1,0,0,w/2,h],[P2,w/2,0,w/2,h]];}
    else{renderView(P1,0,h/2,w,h/2);renderView(P2,0,0,w,h/2);views=[[P1,0,h/2,w,h/2],[P2,0,0,w,h/2]];}
  }
  safe('dbgOverlay',()=>drawDbgOverlay(dt,views));
  requestAnimationFrame(frame);
}

