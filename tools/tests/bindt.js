let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get keys(){return keys},setBind,get BINDS(){return BINDS},defaultBinds,set BINDS2(v){BINDS=v},mHeld,mTap,ABIL,get dbgRev(){return dbgRev},get dbgJoin(){return dbgJoin},hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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
const P=A;const ground=()=>{for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;}};
const P0=P.pos.clone();const reset=()=>{T.keys.clear();P.pos.copy(P0);P.vy=0;P.state='walk';P.dodge=null;P.stam=100;P.hp=99;P.exhausted=false;P.dodgeCD=0;S2(60);};
const pad=mk(0);const press=(i,v)=>{pad.buttons[i].pressed=v;pad.buttons[i].value=v?1:0;};
const watch=(n,f)=>{let dodge=false,run=false,jump=false;const y0=P.pos.y;for(let i=0;i<n;i++){f&&f(i);S2(1);if(P.dodge)dodge=true;if(P.wasCharging||P.sprinting||P.state==='trample')run=true;if(P.pos.y>y0+1.5)jump=true;}return {dodge,run,jump};};
ground();reset();
console.log('grounded',P.grounded,'pos',P.pos.x.toFixed(1),P.pos.y.toFixed(1),P.pos.z.toFixed(1),'state',P.state,'paused',P.paused,T.playing,T.menuOpen);
// keyboard Shift tap -> dash
let r=watch(40,i=>{if(i===0)T.keys.add('ShiftLeft');if(i===4)T.keys.delete('ShiftLeft');});console.log('Shift tap',JSON.stringify(r));reset();
r=watch(60,i=>{if(i===0)T.keys.add('ShiftLeft');if(i===59)T.keys.delete('ShiftLeft');T.keys.add('KeyW');});T.keys.clear();console.log('Shift hold',JSON.stringify(r));reset();
// pad: L2 sprint held (no tap delay), B tap dash
pads.push(pad);S2(2);
r=watch(10,i=>{press(6,true);pad.axes[1]=-1;});press(6,false);pad.axes[1]=0;console.log('L2 hold (10 frames)',JSON.stringify(r),'charging',P.wasCharging);reset();
r=watch(30,i=>{press(6,i<3);});console.log('L2 tap',JSON.stringify(r));reset();
r=watch(30,i=>{press(1,i<3);});console.log('B tap',JSON.stringify(r));reset();
// bind Dash to F, Sprint key to G
T.setBind('dash','kb',0,'KeyF');T.setBind('sprint','kb',0,'KeyG');
r=watch(30,i=>{if(i===0)T.keys.add('KeyF');if(i===20)T.keys.delete('KeyF');});console.log('F (dash) held 20f',JSON.stringify(r));reset();
r=watch(20,i=>{T.keys.add('KeyG');T.keys.add('KeyW');});T.keys.clear();console.log('G (sprint) 20f',JSON.stringify(r),P.wasCharging);reset();
// rebind jump to J
T.setBind('jump','kb',0,'KeyJ');console.log('jump binds',JSON.stringify(T.BINDS.jump));
r=watch(30,i=>{if(i===0)T.keys.add('Space');if(i===5)T.keys.delete('Space');});console.log('Space after rebind',JSON.stringify(r));reset();
r=watch(30,i=>{if(i===0)T.keys.add('KeyJ');if(i===5)T.keys.delete('KeyJ');});console.log('J',JSON.stringify(r));reset();
// steal: bind Space to bite -> removed elsewhere?
T.setBind('bite','kb',1,'KeyJ');console.log('after stealing J for bite: jump',JSON.stringify(T.BINDS.jump),'bite',JSON.stringify(T.BINDS.bite));
process.exit(0);
