// Rubble lying on a building that then collapses under it: made afresh from the plan and the edits (leaving and coming back), none of it should be left floating
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync(process.env.G||'g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={ABIL,get keys(){return keys},get dbgRev(){return dbgRev},get dbgJoin(){return dbgJoin},hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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
src=src.replace("window.__t={","window.__t={collapseBuilding,plotInfo,bldgAt,CELL,G,CS,H,get,setRaw,addEdit,genChunk,li,COBBLE,");eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;for(let i=0;i<5;i++){now+=16.7;T.frame(now);}
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;}
const G=T.G,CELL=T.CELL,CS=T.CS,cobble=T.COBBLE;
// rubble piled on a building's roof (as placePile leaves it: blocks plus edits), then the building collapses under it.
// Made afresh from the plan and the edits (as when you leave and come back), is any of that rubble left in mid-air?
const cx=Math.floor(A.pos.x/CELL),cz=Math.floor(A.pos.z/CELL);let n=0,bad=0;
for(let r=0;r<14&&n<12;r++)for(let px=cx-r;px<=cx+r;px++)for(let pz=cz-r;pz<=cz+r;pz++){if(Math.max(Math.abs(px-cx),Math.abs(pz-cz))!==r||n>=12)continue;
  const P=T.plotInfo(px,pz);P.b.forEach((b,i)=>{
    if(n>=12||b.top<G+8||b.x1-b.x0<5||b.z1-b.z0<5)return;
    const X0=px*CELL,Z0=pz*CELL,x=X0+((b.x0+b.x1)>>1),z=Z0+((b.z0+b.z1)>>1);
    if(T.bldgAt(x,z)?.key!==px+','+pz+','+i)return;
    let y=T.H-2;while(y>G&&!T.get(x,y,z))y--;if(y<=G+4)return;
    const pile=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(let h=1;h<=2;h++){const X=x+dx,Y=y+h,Z=z+dz;if(T.get(X,Y,Z))continue;T.setRaw(X,Y,Z,cobble);T.addEdit(X,Y,Z,cobble);pile.push([X,Y,Z]);}
    T.collapseBuilding({b,i,px,pz,key:px+','+pz+','+i},G+2,null);
    const live=pile.filter(([X,Y,Z])=>T.get(X,Y,Z)).length;
    let regen=0;const arrs=new Map();
    for(const [X,Y,Z] of pile){const kx=Math.floor(X/CS),kz=Math.floor(Z/CS),k=kx+','+kz;if(!arrs.has(k))arrs.set(k,T.genChunk(kx,kz));const a=arrs.get(k);if(a[T.li(X-kx*CS,Y,Z-kz*CS)]===cobble)regen++;}
    if(regen)bad++;
    console.log((b.kind||b.style||'?')+' top '+(b.top-G)+': pile '+pile.length+', in the live world after the collapse '+live+', made afresh '+regen+(regen?'  FLOATING':''));n++;});}
console.log('buildings '+n+', floating rubble after reload in '+bad);
process.exit(0);
