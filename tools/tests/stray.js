let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,realmOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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
const seen=new Set();const L=T.routesNearBox(-3000,-3000,3000,3000);
for(let i=0;i<L.length;i+=2){const R=L[i];if(!R||R.kind!=='moto'||seen.has(R))continue;seen.add(R);const RL=2*(R.HY-44);
  for(const s of [RL,R.L-RL]){const P=T.rtPoint(R,s);const cx=Math.round(P.x),cz=Math.round(P.z);
    const hits=[];
    for(let x=cx-40;x<=cx+40;x++)for(let z=cz-40;z<=cz+40;z++){if(T.realmOf(Math.floor(x/32),Math.floor(z/32))!=='plains')continue;T.surfaceAt(x,z);
      for(let y=44;y<72;y++){const b=T.get(x,y,z);if(!b)continue;const B=T.BLOCK[b];if(!B)continue;
        if((b===12||b===16||b===13||b===14||B.ramp)&&!(y===44&&(b===12||b===16||b===13||b===14))&&!(y===43)){
          // is it part of the route? nearest distance to R
          let best=1e9,bs=0;for(let q=Math.max(0,s-80);q<=Math.min(R.L,s+80);q+=1){const Q=T.rtPoint(R,q);const d=Math.hypot(Q.x-x-0.5,Q.z-z-0.5);if(d<best){best=d;bs=q;}}
          if(best>10)hits.push([x,y,z,b,best.toFixed(1),Math.round(bs)]);}}}
    // (being far from this one route proves nothing: another road may run past, or the deck carry on beyond the route's end.
    // The real question is whether a block is cut off: follow touching road blocks from it, and an orphan soon runs out.)
    const isRoad=(x,y,z)=>{T.surfaceAt(x,z);const b=T.get(x,y,z);const B=b&&T.BLOCK[b];return !!B&&(b===12||b===16||b===13||b===14||!!B.ramp);};
    let cutOff=0;for(const h of hits){const vis=new Set([h[0]+','+h[1]+','+h[2]]),st=[[h[0],h[1],h[2]]];let n=0;while(st.length&&n<400){const [x,y,z]=st.pop();n++;for(const dx of [-1,0,1])for(const dz of [-1,0,1])for(const dy of [-1,0,1]){const k=(x+dx)+','+(y+dy)+','+(z+dz);if(vis.has(k)||y+dy<44||y+dy>72)continue;if(isRoad(x+dx,y+dy,z+dz)){vis.add(k);st.push([x+dx,y+dy,z+dz]);}}}if(n<400)cutOff++;}
    console.log('end',cx,cz,'s',Math.round(s),'far from this route',hits.length,'cut off',cutOff);}}
process.exit(0);
