let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={coastD,seaBlk,SEA_T,seaPlot,coastType,oceanDepth,tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,realmOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Measures the coast, from generated blocks: straight cut-offs along block boundaries, sudden changes of beach and
// depth, specks of land at sea. Usage: SEED=1 node shoreaudit.js [cells radius, default 150]
const RAD=+(process.argv[2]||150),CELL=32,G=44;
const top=(x,z)=>{for(let y=G+14;y>=8;y--){const b=T.get(x,y,z);if(b&&b!==9)return{y,b};if(b===9&&y===G)continue;}return{y:8,b:0};};
const water=(x,z)=>T.get(x,G,z)===9;
const names={};const blk=src0.slice(src0.indexOf('const AIR=0'),src0.indexOf('const AIR=0')+3000);for(const m of blk.matchAll(/([A-Z_0-9]+)=(\d+)/g))names[+m[2]]=m[1];
// (only ordinary shore: a port's squared-off quays and a town's harbour are meant to be straight)
const shorePlots=[];for(let px=-RAD;px<RAD;px+=1)for(let pz=-RAD;pz<RAD;pz+=1){if(T.seaPlot(px,pz)!==1)continue;const t=T.coastType(px,pz);if(t==='shore'||t==='beach'||t==='sea')shorePlots.push([px,pz,t]);if(shorePlots.length>=(+process.env.MAXP||400))break;}
let edgeRuns=0,edgeLen=0,depthJumps=0,depthCols=0,specks=0,widthJump=0,sandCols=0;const ex=[];
for(const [px,pz] of shorePlots){const X0=px*CELL,Z0=pz*CELL;
  // along each plot edge: a straight run where water or sand stops dead at the boundary is the giveaway
  for(const ax of ['x','z']){let run=0;for(let i=0;i<CELL;i++){const [a,b]=ax==='x'?[X0+i,Z0]:[X0,Z0+i],[c,d]=ax==='x'?[X0+i,Z0-1]:[X0-1,Z0+i];
      const wa=water(a,b),wc=water(c,d),sa=names[T.get(a,G,b)]==='SAND',sc=names[T.get(c,G,d)]==='SAND';
      if((wa!==wc&&Math.abs(T.coastD(a,b))>2.5)||(sa!==sc&&!wa&&!wc&&Math.abs(T.coastD(a,b))<30)){run++;}else{if(run>=8){edgeRuns++;edgeLen+=run;if(ex.length<10)ex.push(['edge',a,b,run]);}run=0;}}
    if(run>=8){edgeRuns++;edgeLen+=run;}}
  // the sea bed: depth shouldn't jump by more than a block or two between neighbours
  for(let i=0;i<CELL;i+=2)for(let j=0;j<CELL;j+=2){const x=X0+i,z=Z0+j;if(!water(x,z))continue;depthCols++;const f=(q,r)=>{let y=G;while(y>4){const b=names[T.get(q,y,r)];if(b==='SAND'||b==='GRAVEL'||b==='DIRT'||b==='STONE')break;y--;}return y;};const d=f(x,z);if(water(x+1,z)&&Math.abs(f(x+1,z)-d)>2)depthJumps++;if(water(x,z+1)&&Math.abs(f(x,z+1)-d)>2)depthJumps++;}
  // specks: a little patch of land with water all round it
  for(let i=4;i<CELL;i+=8)for(let j=4;j<CELL;j+=8){const x=X0+i,z=Z0+j;if(water(x,z))continue;let w=0;for(const [q,r] of [[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,4],[4,-4],[-4,-4]])if(water(x+q,z+r))w++;if(w===8)specks++;}
}
console.log('shore plots',shorePlots.length,'edge cut-offs',edgeRuns,'(blocks '+edgeLen+')','depth jumps',depthJumps,'of',depthCols,'specks',specks);
for(const e of ex)console.log(JSON.stringify(e));
process.exit(0);
