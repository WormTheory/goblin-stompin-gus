let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={jDeg,rtRamp,tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,realmOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Audits town streets and motorway ramps from generated blocks: trees standing in a street, centre lines overshooting
// at a bend, ramps with no lines, and jumps in the barrier where a ramp meets the road.
// Usage: SEED=1 node streetaudit.js [radius in plots of everything, default 30] [radius in plots of plains-edge streets, default 120]
const R0=+(process.argv[2]||30),R1=+(process.argv[3]||120),CELL=32,G=44,ROADW=8,BL=T.BLOCK;
const names={};{const s=src0.slice(src0.indexOf('const AIR=0'),src0.indexOf('const AIR=0')+3000);for(const m of s.matchAll(/([A-Z_0-9]+)=(\d+)/g))names[+m[2]]=m[1];}
const nm=b=>names[b]||b,isLine=b=>/^LINE/.test(nm(b));
const road=b=>/^(ASPHALT|LINE|LANE|CROSS)/.test(nm(b));
T.ensureRoutes(0,0);
let trunks=0,leaves=0,cols=0,bends=0,over=0;const eg=[];
function scanStrip(x0,x1,z0,z1,px,pz){for(let x=x0;x<x1;x++)for(let z=z0;z<z1;z++){if(!road(T.get(x,G,z)))continue;cols++;
  let hit=null;for(let y=G+1;y<=G+3;y++){const n=nm(T.get(x,y,z));if(n==='LOG')hit='LOG';else if(n==='LEAVES'&&!hit)hit='LEAVES';}
  if(hit==='LOG'){trunks++;if(eg.length<8)eg.push([x,z,T.realmOf(px,pz),T.plotType(px,pz)]);}else if(hit)leaves++;}}
for(let px=-R1;px<=R1;px++)for(let pz=-R1;pz<=R1;pz++){
  const near=Math.abs(px)<=R0&&Math.abs(pz)<=R0;if(!near&&T.realmOf(px,pz)!=='plains')continue;
  const X=px*CELL,Z=pz*CELL;
  if(T.segOpen(px,pz,0))scanStrip(X,X+ROADW,Z,Z+CELL+ROADW,px,pz);
  if(T.segOpen(px,pz,1))scanStrip(X,X+CELL+ROADW,Z,Z+ROADW,px,pz);
  const z=T.segOpen(px,pz,0)||T.segOpen(px,pz,2),x=T.segOpen(px,pz,1)||T.segOpen(px,pz,3);
  if(T.jDeg(px,pz)===2&&z&&x){bends++;let n=0;for(let a=3;a<=4;a++)for(let b=3;b<=4;b++)if(isLine(T.get(X+a,G,Z+b)))n++;if(n)over++;}
}
console.log('street columns',cols,'with a tree trunk',trunks,'with leaves low over them',leaves,JSON.stringify(eg));
console.log('corner bends',bends,'with block lines through the middle',over);
// town ramps (deck down to a street) and route ramps (deck down to the road on the plains)
let town=0,townMarked=0,routeRamps=0,jog=0;const jogs=[];
for(let rx=-9;rx<=9;rx++)for(let rz=-9;rz<=9;rz++){const P=T.placeAt(rx,rz);for(const ax of ['x','z']){if(T.AX_KIND(P,ax)!=='moto')continue;const S=T.axisSpan(P,ax);if(!S||S.kind!=='moto')continue;T.ensureRoutes(P.cx*CELL,P.cz*CELL);
  for(const s of [-1,1]){if(T.sideUsed(P,ax,s))continue;const M=s>0?S.m1:S.m0,c=S.k*CELL+3;let any=false,marked=false;
    for(let a=(M-2)*CELL;a<(M+3)*CELL;a++){const r=T.hwRampAt(ax,S.k,a);if(!r)continue;const y=(ax==='x'?T.HY_X:T.HY_Z)-Math.floor(r.d/2),b=ax==='x'?T.get(a,y,c):T.get(c,y,a);if(BL[b]&&BL[b].ramp){any=true;if(b>=88&&b<124)marked=true;}}
    if(any){town++;if(marked)townMarked++;}}}}
for(const R of T.ROUTES.slice()){if(R.kind!=='moto')continue;const F=T.rtFlat(R),RL=2*(R.HY-G);if(Math.abs(R.A.T.rx)>9||Math.abs(R.A.T.rz)>9)continue;
  for(const [flat,sOf] of [[F[0],e=>e],[F[1],e=>R.L-e]]){if(flat||R.L<RL*3)continue;routeRamps++;
    // the barrier's distance out from the centre line, just up the ramp and just down it
    const wid=(e,sign)=>{const p=T.rtPoint(R,sOf(e));for(let w=4;w<=10;w+=0.25){const x=Math.floor(p.x+p.tz*w*sign),z=Math.floor(p.z-p.tx*w*sign),y=Math.round(T.rtSurfY(R,sOf(e)));for(let yy=y-1;yy<=y+1;yy++)if(nm(T.get(x,yy,z))==='CONCRETE'&&nm(T.get(x,yy+1,z))==='CONCRETE')return w;}return null;};
    let worst=0;for(const sign of [-1,1]){const u=wid(RL-2,sign),d=wid(RL+2,sign);if(u!==null&&d!==null)worst=Math.max(worst,Math.abs(u-d));}
    if(worst>=1){jog++;jogs.push(worst);}}}
console.log('town ramps',town,'with painted lines',townMarked,'| route ramps',routeRamps,'with a barrier jog of a block or more',jog,JSON.stringify(jogs.slice(0,12)));
process.exit(0);
