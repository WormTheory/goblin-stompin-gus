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
  if(playing&&!DT.todStop){const pt=tod;tod=(tod+dt/DAY_LEN*DAY_SPEEDS[daySpd])%1;if(tod<pt)dayN++;}
  const day=tod<DAY_FRAC,ang=day?Math.PI*tod/DAY_FRAC:Math.PI+Math.PI*(tod-DAY_FRAC)/(1-DAY_FRAC);
  const sy=Math.sin(ang),sx=Math.cos(ang);
  skyU.uSun.value.set(sx*0.92,sy,0.38).normalize();skyU.uMoon.value.set(-sx*0.92,-sy,-0.3).normalize();
  const dk=smooth(-0.12,0.3,sy),tw=Math.max(0,1-Math.abs(sy)/0.28)*(sy>-0.18?1:0);
  skyU.uTop.value.copy(SKYC.nightTop).lerp(SKYC.dayTop,dk).lerp(SKYC.duskTop,tw*0.45);
  skyU.uHor.value.copy(SKYC.nightHor).lerp(SKYC.dayHor,dk).lerp(SKYC.duskHor,tw*0.7);
  skyU.uNight.value=1-smooth(-0.25,0.05,sy);
  skyU.uSunCol.value.copy(SKYC.sunDay).lerp(SKYC.sunDusk,tw);
  // the weather: grey it over, darken it, light it up for a lightning flash
  {const cov=WXK.cover,dkw=WXK.dark,grey=_wxGrey.setRGB(0.6,0.63,0.66).multiplyScalar(0.12+0.88*dk);
   skyU.uTop.value.lerp(grey,cov*0.75).multiplyScalar(1-0.5*dkw);skyU.uHor.value.lerp(grey,cov*0.6).multiplyScalar(1-0.38*dkw);
   if(WX.flash>0){const f=WX.flash*(0.6+0.4*Math.random());skyU.uTop.value.lerp(_wxFlash,f*0.6);skyU.uHor.value.lerp(_wxFlash,f*0.5);}
   skyU.uCover.value=cov;const mp=moonPhase();skyU.uPhase.value=mp;skyU.uMoonLit.value=(1-Math.cos(Math.PI*2*mp))/2;}
  SKY.copy(skyU.uHor.value);
  WORLD_LIGHT.value.copy(SKYC.lightNight).lerp(SKYC.lightDay,dk).lerp(SKYC.dusk.clone().multiplyScalar(Math.max(0.35,dk)),tw*0.55);
  WORLD_LIGHT.value.multiplyScalar(1-0.42*WXK.dark);if(WX.flash>0)WORLD_LIGHT.value.lerp(_wxFlash,WX.flash*0.55);bbGlowSky();
  hemi.intensity=(0.16+0.59*dk)*(1-0.3*WXK.dark);
  const moonUp=sy<0,ml=skyU.uMoonLit.value;sunLight.intensity=(moonUp?0.04+0.12*ml:0.55*dk+0.06)*(1-0.75*WXK.cover);sunLight.color.setRGB(moonUp?0.6:1,moonUp?0.7:0.91-0.25*tw,moonUp?1:0.8-0.35*tw);
  const L=moonUp?skyU.uMoon.value:skyU.uSun.value;sunLight.position.set(L.x*10,Math.max(0.2,L.y)*10,L.z*10);
  for(const L of cloudLayers){const u=L.m.material.uniforms;u.uTint.value.copy(WORLD_LIGHT.value).multiplyScalar(1-0.25*WXK.dark);u.uOpacity.value=Math.min(0.97,L.D.op*(0.35+0.65*dk)*(0.6+2.2*WXK.cover));u.uCover.value=WXK.cover;}
  // headlights and tail lights come on after dark (not a parked car's: carLampsSync)
  const nl=1-dk;smat(CARC.head).emissive.setRGB(0.9*nl,0.8*nl,0.5*nl);smat(CARC.tail).emissive.setRGB(0.7*nl,0.06*nl,0.04*nl);carLampsSync();
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
  {const W=realmOf(px,pz)==='plains'?wonderNear(p.pos.x,p.pos.z,40):null;if(W)return WD_NAME[W.k];}
  if(tsAt(Math.floor(p.pos.x),Math.floor(p.pos.z)))return'\u26FD Truck stop';
  if(dumpAt(px,pz)!==null)return'\u{1F5D1}\uFE0F Garbage dump';
  if(castleAt(px,pz))return'\u{1F3F0} Castle';
  {const B=bigPlainsAt(px,pz);if(B)return BIO_SITE_N[B.kind]||(B.kind==='nuclear'?'\u2622\uFE0F Nuclear plant':B.kind==='airport'?'\u2708\uFE0F Airport':B.kind==='airfield'?'\u{1F6E9}\uFE0F Airfield':B.kind==='nasa'?'\u{1F680} Launch site':B.kind==='mine'?'\u26CF\uFE0F Mine':B.kind==='quarry'?'\u{1FAA8} Quarry':B.kind==='lumber'?'\u{1FAB5} Lumber camp':B.kind==='campsite'?'\u{1F3D5}\uFE0F Campsite':B.kind==='cult'?'\u{1F56F}\uFE0F Cult altar':B.kind==='tower5g'?'\u{1F4E1} 5G tower':B.kind==='prepper'?'\u{1F6E1}\uFE0F Prepper compound':B.kind==='militia'?'\u{1F3AF} Militia compound':B.kind==='ruins'?'\u{1F3DB}\uFE0F Ruins':B.kind==='thieves'?"\u{1F977} Thieves' hideout":'\u{1FA96} Military base');}
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
  safe('dest',()=>{const p=players.find(q=>q.active);const S=p&&settlementAt(Math.floor(p.pos.x/CELL),Math.floor(p.pos.z/CELL));if(S){setDestroyed(S);rampRazeTick(S);}
    // (otherwise, a little at a time, work out the totals for the places you've found but not been into, for the map)
    else if(destJob.S)setDestroyed(destJob.S);
    else for(const K of knownSets.values())if(!setListC.has(K.rx+','+K.rz)){setDestroyed(K);break;}});
  safe('banner',()=>placeBannerTick(dt));
  if(clockT<=0&&clockHand){
    clockT=0.2;
    const deg=day?180+180*tod/DAY_FRAC:180*(tod-DAY_FRAC)/(1-DAY_FRAC),rad=deg*Math.PI/180,hx=Math.cos(rad)*12.5,hy=Math.sin(rad)*12.5;
    clockHand.setAttribute('x2',hx.toFixed(2));clockHand.setAttribute('y2',hy.toFixed(2));
    clockOrb.setAttribute('cx',hx.toFixed(2));clockOrb.setAttribute('cy',hy.toFixed(2));
    clockOrb.setAttribute('fill',day?'#ffd447':'#fff6dc');
    // beside the clock: the day, then the season (the time of day is in the debug menu's Info pane; how wrecked a place is,
    // the Settlement razed card over the minimap)
    if(clockTxt){const h='<b>Day '+dayN+'</b><div>'+SEASONS[seasonOf()]+'</div>';
      if(clockTxt.dataset.h!==h){clockTxt.dataset.h=h;clockTxt.innerHTML=h;}}
    infoTick(whereLabel);   // (whereLabel lives in here, in updateSky)
  }
}
const FPS={el:null,n:0,t:0,worst:0,shown:false};
function fpsTick(raw){
  if(!FPS.el)FPS.el=document.getElementById('fpsCounter');if(!FPS.el)return;
  if(FPS.shown!==DT.fps){FPS.shown=DT.fps;FPS.el.hidden=!DT.fps;FPS.n=0;FPS.t=0;FPS.worst=0;}
  if(!DT.fps||!(raw>0)||raw>2)return;
  FPS.n++;FPS.t+=raw;FPS.worst=Math.max(FPS.worst,raw);
  if(FPS.t>=0.5){const f=FPS.n/FPS.t;FPS.el.textContent=Math.round(f)+' FPS\n'+(1000*FPS.t/FPS.n).toFixed(1)+' ms (worst '+(FPS.worst*1000).toFixed(0)+')';
    FPS.el.className='fpsc'+(f<30?' low':f<50?' mid':'');FPS.n=0;FPS.t=0;FPS.worst=0;}
}
let readoutH='',readoutK='';
// The info pane, under the clock: the time of day, the weather, the moon and where you are, in words. Shown from the debug menu's Overlays
// (DT.info, kept in this browser), off to begin with
const noSym=s=>s.replace(/[\u{1F000}-\u{1FAFF}\u2190-\u2BFF\uFE0F\u200D]/gu,'').replace(/ {2,}/g,' ').replace(/> /g,'>').trim();
let infoEl=null;
// (the biome at the first player's feet, as the ground there is made: biomeAt, or Alpine up on the bare rock)
function infoBiome(){const p=players.find(q=>q.active)||players[0];if(!p)return'—';const x=Math.floor(p.pos.x),z=Math.floor(p.pos.z);
  let i=biomeAt(x,z);const t=CLIM.t;if(realmOf(Math.floor(x/CELL),Math.floor(z/CELL))==='plains'&&plainsH(x,z)>rlfRock(t))i=BIO_I.alpine;return BIOMES[i].n;}
function infoTick(whereLabel){
  if(!infoEl)infoEl=document.getElementById('infoPane');if(!infoEl)return;
  if(infoEl.hidden===DT.info)infoEl.hidden=!DT.info;if(!DT.info)return;
  let st='—';try{st=structLabel();}catch(e){}
  const hr=hourNow(),tm=String(Math.floor(hr)).padStart(2,'0')+':'+String(Math.floor(hr%1*60)).padStart(2,'0');
  const h='<div><span class="ik">Time</span>'+tm+', '+timeLabel().split(', ')[1]+(DT.todStop?' (paused)':'')+'</div><div><span class="ik">Weather</span>'+WX_TYPES[wxHere()].n+'</div><div><span class="ik">Moon</span>'+moonInfo()[0]+'</div><div><span class="ik">Place</span>'+noSym(whereLabel())+'</div><div><span class="ik">Biome</span>'+infoBiome()+'</div><div><span class="ik">Structure</span>'+st+'</div>';
  if(infoEl.dataset.h!==h){infoEl.dataset.h=h;infoEl.innerHTML=h;}
}
// the structure or site the (first) player is in or on, named as the Structures previewer lists its kind (made singular).
// A town lot's building only counts inside its walls (or on its roof), not out in the street in front; a big site, a
// country site or an open lot (a park, a cemetery) counts anywhere on it. A shop's or restaurant's brand follows its kind.
const ST_ONE={ruins:'Ruins',harbor:'Docks',news:'TV news',water:'Water works',yard:'Shipping port',castle:'Castle',fishing:'Fishing wharf',basin:'Shipping port',nbasin:'Naval base'};
const stOne=k=>ST_ONE[k]||stName(k).replace(/ \(.*\)$/,'').replace(/ies$/,'y').replace(/(ch|sh|x)es$/,'$1').replace(/([^s])s$/,'$1');
const ST_OPEN=new Set(['park','plaza','court','cemetery','build','trailers','camp','farmers','nursery','rail','beach','lighthouse','rig','wreck','navy','yard','harbor','basin','nbasin','farm','dump','truckstop']);
function structLabel(){
  const p=players.find(q=>q.active)||players[0];if(!p)return'—';
  const x=Math.floor(p.pos.x),z=Math.floor(p.pos.z),px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
  if(TENV&&!tenvShow(px,pz))return'—';
  const u=underAt(p.pos.x,p.pos.y,p.pos.z);if(u&&!(u==='subway'&&plotType(px,pz)==='metro')&&!(u==='cave'&&bigPlainsAt(px,pz)&&bigPlainsAt(px,pz).kind==='mine'))return'—';   // (in the sewers or caves: nothing up top counts, bar a mine's workings)
  const known=k=>stName(k)!==k||!!ST_ONE[k];
  const S=superOf(px,pz);if(S&&known(S.kind))return stOne(S.kind);
  {const M=macroOf1(px,pz);if(M&&M.w&&known(M.kind)&&px>=M.ax&&px<M.ax+M.w&&pz>=M.az&&pz<M.az+M.h&&(M.kind!=='hood'||/^(homes|park|court)$/.test(plotType1(px,pz))))return stOne(M.kind);}
  {const B=bigPlainsAt(px,pz);if(B&&known(B.kind))return stOne(B.kind);}
  if(turbineAt(px,pz))return stOne('wind');
  {const k=siteKind(px,pz);if(k==='bunker'||k==='wrecks')return stOne(k);}
  let t=plotType(px,pz);if(t==='harbor'&&plotInfo(px,pz).fish)t='fishing';
  if(!known(t))return'—';
  if(ST_OPEN.has(t)||t==='metro'&&u)return stOne(t);   // (a subway station: down on its platforms)
  const hit=bldgAt(x,z);if(!hit)return'—';
  const nm=stOne(t),n=hit.b.brand&&!hit.b.brand.only&&hit.b.brand.n&&!String(hit.b.brand.n).toUpperCase().includes(nm.toUpperCase())&&hit.b.brand.n;   // (not a sign that just says what it is)
  return nm+(n?' · '+String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;'):'');
}
