let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={G,CELL,metroOf,settlementLat,BLOCK,underAt,superOf,keys,stGroups,stFind,plotInfo,stairFloors,bldgAt,stFind,stMeshes,stGroups,get dbgRev(){return dbgRev},get dbgJoin(){return dbgJoin},hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Subway station stairs: are they stair blocks the whole way down, and can a goblin chase Gus up them and down again?
const G=T.G,CELL=T.CELL;let me=null;
for(let a=-6;a<=6&&!me;a++)for(let b=-6;b<=6&&!me;b++){const M=T.metroOf(T.settlementLat(a,b));if(M&&M.stations.length)me=M.stations[0];}
console.log('station',JSON.stringify({ax:me.ax,px:me.px,pz:me.pz}));
const al=me.ax==='x',X0=me.px*CELL,Z0=me.pz*CELL,RC=20;
const W=(u,c)=>al?[X0+u,Z0+RC+c]:[X0+RC+c,Z0+u];
{const [x,z]=W(20,-10);A.pos.set(x,G+2,z);A.vy=0;S(240);}
// the stair's blocks down its middle (c=-10): its surface block at each step along it (S: a stair block)
let line='';for(let u=8;u<=31;u++){const [x,z]=W(u,-10);T.get(x,G,z);const i=Math.min(19,30-u);let y=G-i+3;while(y>G-25&&!T.get(x,y,z))y--;const b=T.get(x,y,z);line+=` u${u}:y${y-G}${T.BLOCK[b]&&T.BLOCK[b].stair?'S':''}`;}
console.log(line);
A.hp=999;const gob=T.goblins.find(g=>!g.civ&&!g.staff&&!g.medic&&!g.ff&&!g.cop)||T.goblins[0];
for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
const step=n=>{for(let i=0;i<n;i++){A.hp=999;A.vy=0;for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=16.7;T.frame(now);}};
const hall=W(12,-4),top=W(33,-9);   // (a platform in the hall; the pavement past the stair's mouth)
for(const [from,to,label] of [[[hall,G-18],[top,G+1],'up'],[[top,G+1],[hall,G-18],'down']]){
  const s0={x:from[0][0]+.5,y:from[1],z:from[0][1]+.5},s1={x:to[0][0]+.5,y:to[1],z:to[0][1]+.5};
  for(let i=0;i<30;i++){A.pos.set(s1.x,s1.y,s1.z);step(1);}
  gob.state='chase';gob.hp=99;gob.stun=0;gob.civ=false;gob.root.visible=true;gob.pos.set(s0.x,s0.y,s0.z);gob.vy=0;gob.t=0;gob.detour=0;gob.trip=null;
  let t=0,ok=false,ys=[];while(t<60&&!ok){A.pos.set(s1.x,s1.y,s1.z);step(6);t+=0.1;ys.push(gob.pos.y-G);if(Math.abs(gob.pos.y-s1.y)<0.6)ok=true;}
  console.log('goblin',label,ok?'reached in '+t.toFixed(1)+'s':'FAILED at y '+(gob.pos.y-G).toFixed(1),'| y every second',ys.filter((_,k)=>k%10===0).map(v=>v.toFixed(1)).join(' '));
}
process.exit(0);
