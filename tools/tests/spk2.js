let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={ABIL,get keys(){return keys},SPIKES,get dbgRev(){return dbgRev},get dbgJoin(){return dbgJoin},hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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
S2(30);const P0=P.pos.clone();T.ABIL.groundSpike=true;
const trial=(name,build)=>{T.keys.clear();P.pos.copy(P0);P.heading=0;P.stam=100;S2(30);const cells=build?build():[];
  const before=cells.map(([x,y,z])=>T.get(x,y,z));const seen=new Set();T.keys.add('KeyE');for(let i=0;i<130;i++)S2(1);T.keys.delete('KeyE');
  for(let i=0;i<60;i++){S2(1);for(const S of T.SPIKES)seen.add(S);}
  const intact=cells.filter(([x,y,z],i)=>T.get(x,y,z)===before[i]).length;
  console.log(name,'spikes',[...seen].map(S=>(S.z-P0.z).toFixed(1)+'@y'+S.y).join(','),'| blocks left',intact+'/'+cells.length);
  for(const [x,y,z] of cells)T.setRaw(x,y,z,0);S2(150);P0.x+=12;};
trial('open ground');
// a wall 3 high across the line at 8-9 ahead (where the 2nd spike would be)
trial('wall at the 2nd spike',()=>{const c=[];for(let dz=8;dz<10;dz++)for(let dx=-3;dx<=3;dx++)for(let y=45;y<48;y++){const x=Math.floor(P.pos.x)+dx,z=Math.floor(P.pos.z)+dz;T.setRaw(x,y,z,16);c.push([x,y,z]);}return c;});
// a low prop (1 high) where the 3rd spike would be
trial('bench at the 3rd spike',()=>{const c=[];for(let dz=14;dz<17;dz++)for(let dx=-2;dx<=2;dx++){const x=Math.floor(P.pos.x)+dx,z=Math.floor(P.pos.z)+dz;T.setRaw(x,45,z,64);c.push([x,45,z]);}return c;});

// a tall wall (6 high) across the 1st spike, and a 2-high block right on the 2nd: both should be smashed through
trial('tall wall at the 1st, block on the 2nd',()=>{const c=[];for(let dz=3;dz<6;dz++)for(let dx=-3;dx<=3;dx++)for(let y=45;y<51;y++){const x=Math.floor(P.pos.x)+dx,z=Math.floor(P.pos.z)+dz;T.setRaw(x,y,z,16);c.push([x,y,z]);}
  for(let dz=8;dz<10;dz++)for(let dx=-1;dx<=1;dx++)for(let y=45;y<47;y++){const x=Math.floor(P.pos.x)+dx,z=Math.floor(P.pos.z)+dz;T.setRaw(x,y,z,16);c.push([x,y,z]);}return c;});
process.exit(0);
