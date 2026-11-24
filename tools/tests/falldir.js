// Which way a collapsing building falls: SC=none|stairs|east|eastwall (SC=stairs: every structural block inside gone, outer walls standing -> should drop straight; east/eastwall -> should tip 1.00,0.00)
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
src=src.replace("window.__t={","window.__t={collapseBuilding,topples,bodies,plotInfo,blockAt,bldgAt,CELL,G,FH,get,setRaw,STR:()=>STRUCT,");eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;for(let i=0;i<5;i++){now+=16.7;T.frame(now);}
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;}
const SC=process.env.SC||'stairs',G=T.G,CELL=T.CELL;
const cx=Math.floor(A.pos.x/CELL),cz=Math.floor(A.pos.z/CELL);const out=[];let n=0;
for(let r=0;r<14&&n<25;r++)for(let px=cx-r;px<=cx+r;px++)for(let pz=cz-r;pz<=cz+r;pz++){if(Math.max(Math.abs(px-cx),Math.abs(pz-cz))!==r||n>=25)continue;
  const P=T.plotInfo(px,pz);P.b.forEach((b,i)=>{
    if(n>=25||!b.stair||b.top<G+12||b.x1-b.x0<6||b.z1-b.z0<6)return;
    const X0=px*CELL,Z0=pz*CELL,L=G+2,W=b.x1-b.x0,D=b.z1-b.z0;
    // design: structural cells, and which are on the outer ring (first/last per row and column)
    const st=new Set();for(let x=b.x0;x<b.x1;x++)for(let z=b.z0;z<b.z1;z++){T.blockAt(b,x,z,L,px,pz);if(T.STR())st.add(x+','+z);}
    const outer=new Set();
    for(let z=b.z0;z<b.z1;z++){const xs=[];for(let x=b.x0;x<b.x1;x++)if(st.has(x+','+z))xs.push(x);if(xs.length){outer.add(xs[0]+','+z);outer.add(xs[xs.length-1]+','+z);}}
    for(let x=b.x0;x<b.x1;x++){const zs=[];for(let z=b.z0;z<b.z1;z++)if(st.has(x+','+z))zs.push(z);if(zs.length){outer.add(x+','+zs[0]);outer.add(x+','+zs[zs.length-1]);}}
    const inner=[...st].filter(k=>!outer.has(k));if(!inner.length)return;
    const kill=(x,z)=>{for(let y=L;y<L+1;y++)T.setRaw(X0+x,y,Z0+z,0);};
    if(SC==='stairs'){for(const k of inner){const [x,z]=k.split(',').map(Number);kill(x,z);}}   // everything structural inside gone, every outer wall standing
    else if(SC==='east'){for(const k of st){const [x,z]=k.split(',').map(Number);if(x>=b.x1-Math.ceil(W*0.4))kill(x,z);}}   // east 40% smashed, inside and out
    else if(SC==='eastwall'){for(const k of outer){const [x,z]=k.split(',').map(Number);if(x===b.x1-1)kill(x,z);}}   // just the east outer wall
    const t0=T.topples.length,b0=T.bodies.length;
    T.collapseBuilding({b,i,px,pz,key:px+','+pz+','+i},L,null);
    const tp=T.topples.length>t0?T.topples[T.topples.length-1]:null;
    out.push((b.kind||b.style||'?')+' '+W+'x'+D+' inner '+inner.length+': '+(tp?'tips '+tp.D.x.toFixed(2)+','+tp.D.z.toFixed(2):'drops straight'));n++;});}
console.log(SC);for(const l of out)console.log('  '+l);
process.exit(0);
