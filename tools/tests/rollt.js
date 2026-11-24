let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={ABIL,get keys(){return keys},setBind,get dbgRev(){return dbgRev},get dbgJoin(){return dbgJoin},hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
const {Q,V3,Rot,Col,Mat,O3,M4,THREE}=require('./stub-three.js');   // (the stand-in three.js every suite shares)
const listeners={};
const el=()=>({remove(){},querySelectorAll:()=>[],closest:()=>null,matches:()=>false,contains:()=>false,attrs:{},kids:[],setAttribute(k,v){this.attrs[k]=v},style:{setProperty(k,v){this[k]=v}},hidden:false,textContent:'',innerHTML:'',classList:{contains(){return false},add(){},remove(){},toggle(){}},append(...k){this.kids.push(...k)},insertBefore(){},querySelector:()=>el(),focus(){},dataset:{},
 L:{},addEventListener(t,f){(this.L[t]=this.L[t]||[]).push(f)},getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),clearRect(){},fillRect(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},set fillStyle(v){}}),requestPointerLock(){}});
const els={};
global.window=global;global.THREE=THREE;global.devicePixelRatio=1;global.innerWidth=800;global.innerHeight=600;
global.document={querySelector:()=>el(),getElementById:id=>els[id]||(els[id]=Object.assign(el(),{appendChild(){},style:{}})),createElement:()=>Object.assign(el(),{style:{}}),querySelectorAll:()=>[],addEventListener(){},pointerLockElement:null};
global.addEventListener=(t,f)=>{(listeners['w'+t]=listeners['w'+t]||[]).push(f)};
global.matchMedia=()=>({matches:false});
global.localStorage={getItem:()=>null,setItem(){}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};

const [A,B]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
const S2=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
const P=A;for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;}
S2(30);const P0=P.pos.clone();T.setBind('dash','kb',0,'KeyF');
const go=(wall,gob)=>{T.keys.clear();P.pos.copy(P0);P.vy=0;P.stam=100;P.heading=0;P.dodgeCD=0;S2(30);const hx=Math.sin(P.heading),hz=Math.cos(P.heading);const cells=[];
  if(wall)for(let d=4;d<6;d++)for(let o=-1;o<=1;o++)for(let y=46;y<49;y++){const x=Math.floor(P.pos.x+hx*d-hz*o),z=Math.floor(P.pos.z+hz*d+hx*o);T.setRaw(x,y,z,16);cells.push([x,y,z]);}
  let g=null;if(gob){g=T.goblins.find(o=>o.state==='wait'&&!o.civ);g.state='chase';g.hp=99;g.stun=1e9;g.pos.set(P.pos.x+hx*5,P.pos.y,P.pos.z+hz*5);g.kv.set(0,0,0);}
  const x0=P.pos.x,z0=P.pos.z,y0=P.pos.y;let peak=y0,rollF=0,maxRot=0,gr=true;T.keys.add('KeyF');
  for(let i=0;i<70;i++){if(i===3)T.keys.delete('KeyF');S2(1);peak=Math.max(peak,P.pos.y);if(P.dodge&&P.dodge.roll)rollF++;maxRot=Math.max(maxRot,P.rig.rotation.x);if(P.dodge&&P.dodge.roll){gr=gr&&P.grounded;}}
  const left=cells.filter(([x,y,z])=>T.get(x,y,z)).length;const r={dist:+Math.hypot(P.pos.x-x0,P.pos.z-z0).toFixed(1),hop:+(peak-y0).toFixed(2),rollFrames:rollF,maxRot:+maxRot.toFixed(2),wallLeft:wall?left+'/'+cells.length:'-',gobHp:g?g.hp:"-",alwaysGrounded:gr};if(g){g.state='wait';}return r;};
T.ABIL.roll=false;console.log('dash',JSON.stringify(go()));
T.ABIL.roll=true;console.log('roll',JSON.stringify(go()));console.log('roll into wall',JSON.stringify(go(true)));console.log('roll into goblin',JSON.stringify(go(false,true)));

T.ABIL.roll=false;T.ABIL.blastDash=true;console.log('blast dash',JSON.stringify(go()));console.log('blast dash into wall',JSON.stringify(go(true)));console.log('blast dash into goblin',JSON.stringify(go(false,true)));
// blast air dash: jump, then press dash/sprint in the air, into a wall
const air=(blast,wall)=>{T.ABIL.blastAirDash=blast;T.keys.clear();P.pos.copy(P0);P.vy=0;P.stam=100;P.heading=0;S2(30);const hx=0,hz=1;const cells=[];
  if(wall)for(let d=7;d<10;d++)for(let o=-2;o<=2;o++)for(let y=45;y<51;y++){const x=Math.floor(P.pos.x-hz*o),z=Math.floor(P.pos.z+hz*d);T.setRaw(x,y,z,16);cells.push([x,y,z]);}
  const z0=P.pos.z;T.keys.add('Space');S2(10);T.keys.delete('Space');T.keys.add('ShiftLeft');S2(3);T.keys.delete('ShiftLeft');S2(100);
  return {dist:+(P.pos.z-z0).toFixed(1),wallLeft:wall?cells.filter(([x,y,z])=>T.get(x,y,z)).length+'/'+cells.length:'-'};};
console.log('air dash',JSON.stringify(air(false)),'blast air dash',JSON.stringify(air(true)));
console.log('air dash into wall',JSON.stringify(air(false,true)),'blast air dash into wall',JSON.stringify(air(true,true)));
process.exit(0);
