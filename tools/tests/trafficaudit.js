let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,realmOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Measures how traffic flows: Gus hovers out of the way over each kind of spot while the cars drive, and every half
// second each car near him is checked. Usage: SEED=1 node trafficaudit.js [seconds per spot, default 90]
const SECS=+(process.argv[2]||90),CELL=32,G=44;
const pl=A;pl.hp=999;
const spots=[];
const addSpot=(name,x,z)=>{if(spots.length<14)spots.push([name,x,z]);};
const P0=T.placeAt(0,0);addSpot('capital',P0.cx*CELL+16,P0.cz*CELL+16);
for(let rx=-9;rx<=9;rx++)for(let rz=-9;rz<=9;rz++){const P=T.placeAt(rx,rz);for(const ax of ['x','z']){if(T.AX_KIND(P,ax)!=='moto')continue;const S=T.axisSpan(P,ax);if(!S||S.kind!=='moto')continue;const co=(a,c)=>ax==='x'?[a,c]:[c,a];
  for(const s of [-1,1]){const M=s>0?S.m1:S.m0;if(!T.sideUsed(P,ax,s)&&spots.filter(q=>q[0]==='rampEnd').length<3)addSpot('rampEnd',...co((M+(s>0?1.5:-0.5))*CELL,S.k*CELL+4));}
  for(let m=S.m0;m<=S.m1;m++)if(T.icOf(ax,S.k,m)===m&&spots.filter(q=>q[0]==='slip').length<2)addSpot('slip',...co((m+2)*CELL,S.k*CELL+4));
  const j=ax==='x'?m=>[m,S.k]:m=>[S.k,m];for(let m=S.m0;m<=S.m1;m++){const [a,b]=j(m);if(T.cloverAt(a,b)&&spots.filter(q=>q[0]==='clover').length<2)addSpot('clover',a*CELL+4,b*CELL+4);}
  // where the motorway route meets its town
  if(spots.filter(q=>q[0]==='townEdge').length<2&&T.sideUsed(P,ax,1))addSpot('townEdge',...co((S.m1+1)*CELL,S.k*CELL+4));
}}
{const R=T.ROUTES.find(r=>r.kind==='country'&&r.L>600);if(R){const p=T.rtPoint(R,R.L/2);addSpot('countryMid',p.x,p.z);const e=T.rtPoint(R,3);addSpot('countryEnd',e.x,e.z);}}
const totals={};let worst=[];
const only=process.env.SPOTS&&process.env.SPOTS.split(',');
for(const [name,sx,sz] of spots){if(only&&!only.includes(name))continue;
  const qHist=[];const stuck=new Map();let samples=0,stopped=0,gone=0,maxQ=0;const by={hw:[0,0],path:[0,0],route:[0,0],street:[0,0]};
  // (a fresh start at each spot, then let it settle before counting)
  pl.pos.set(sx,120,sz);pl.vy=0;pl.grounded=false;
  const hold=()=>{pl.pos.set(sx,120,sz);pl.vy=0;pl.hp=999;pl.peakY=120;pl.state='walk';for(const c of T.cars)if(c.hunter&&!c.police)c.hunter=false;};   // (nobody hunting him: this is about ordinary traffic)
  for(let i=0;i<20*60;i++){hold();now+=16.7;T.frame(now);}
  for(let t=0;t<SECS*2;t++){for(let i=0;i<30;i++){hold();now+=16.7;T.frame(now);}
    const near=T.cars.filter(c=>c.alive&&Math.hypot(c.pos.x-sx,c.pos.z-sz)<110&&!c.parked&&!c.parkPool&&!(c.veh==='amb'||c.veh==='fire'||c.veh==='police'||c.veh==='news'||c.pullPool||c.svcPool));const still=[];
    for(const c of near){const stop=Math.abs(c.speed)<0.6;const k=c.path?'path':c.hw?'hw':c.rt?'route':'street';by[k][0]++;if(stop){by[k][1]++;stopped++;}samples++;
      const v=(stuck.get(c)||0);const nv=stop?v+0.5:0;stuck.set(c,nv);if(nv>2)still.push(c);if(nv>=40&&!c._rep){c._rep=1;worst.push({name,x:Math.round(c.pos.x),y:Math.round(c.pos.y),z:Math.round(c.pos.z),k,veh:c.veh,hw:c.hw&&c.hw.ax,dir:c.dir,head:+c.heading.toFixed(2),lane:c.hw&&c.hw.lane,leaving:c.leaving});}}
    // the longest run of stopped cars nose to tail
    {const seen=new Set();for(const c of still){if(seen.has(c))continue;let n=0;const st=[c];seen.add(c);while(st.length){const a=st.pop();n++;for(const b of still)if(!seen.has(b)&&Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z)<11&&Math.abs(a.pos.y-b.pos.y)<3){seen.add(b);st.push(b);}}if(process.env.DUMPQ&&n>=+process.env.DUMPQ&&!global.__dumped){global.__dumped=(global.__dumped||0)+1;console.log('QUEUE',n,'at',name,'t',t/2);const X=[...seen];for(const o of T.cars){if(!o.alive||o.parked)continue;if(X.some(q=>Math.hypot(q.pos.x-o.pos.x,q.pos.z-o.pos.z)<26))console.log(X.includes(o)?'*':' ',o.veh.padEnd(6),o.pos.x.toFixed(1),o.pos.y.toFixed(1),o.pos.z.toFixed(1),'v',o.speed.toFixed(1),'h',o.heading.toFixed(2),'d',o.dir,o.hw?'hw'+o.hw.ax+o.hw.dir+' '+o.hw.lane+' y'+o.hw.y.toFixed(1):'',o.path?'path':'',o.rt?'rt':'','jam',(o.jamT||0).toFixed(1),'pass',o.passK,'stk',(stuck.get(o)||0));}}maxQ=Math.max(maxQ,n);const mi=Math.floor(t/120);qHist[mi]=Math.max(qHist[mi]||0,n);}}
  }
  if(process.env.TL)console.log('  queue by minute',JSON.stringify(qHist));
  const long=[...stuck.values()].filter(v=>v>=30).length;
  const pct=a=>a[0]?Math.round(100*a[1]/a[0]):0;
  console.log(name.padEnd(11),'at',Math.round(sx),Math.round(sz),'cars',(samples/(SECS*2)).toFixed(1),'stopped',(samples?Math.round(100*stopped/samples):0)+'%','(hw',pct(by.hw)+'% route',pct(by.route)+'% path',pct(by.path)+'% street',pct(by.street)+'%)','longest queue',maxQ,'stuck 30s+',long);
  const tt=totals[name]||(totals[name]=[0,0,0]);tt[0]+=samples;tt[1]+=stopped;tt[2]=Math.max(tt[2],maxQ);
}
const all=Object.values(totals).reduce((a,t)=>[a[0]+t[0],a[1]+t[1],Math.max(a[2],t[2])],[0,0,0]);
console.log('ALL stopped',Math.round(100*all[1]/(all[0]||1))+'%','longest queue',all[2],'cars stopped 40s+',worst.length);
for(const w of worst.slice(0,12))console.log('worst',JSON.stringify(w));
process.exit(0);
