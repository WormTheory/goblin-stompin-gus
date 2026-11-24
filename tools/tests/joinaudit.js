let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get seed(){return seed},jDeg,rtRamp,rtFlat,jSquare,hwRampAt,tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,realmOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Drives every lane from the blocks: can a car actually get along each highway and street, and on to whatever it meets?
// Usage: SEED=1 node joinaudit.js [lattice radius, default 9] [plots of street to scan, default 40]
const RAD=+(process.argv[2]||9),PR=+(process.argv[3]||40),CELL=32,G=44,BL=T.BLOCK,ROADW=8;
const names={};{const s=src0.slice(src0.indexOf('const AIR=0'),src0.indexOf('const AIR=0')+3000);for(const m of s.matchAll(/([A-Z_0-9]+)=(\d+)/g))names[+m[2]]=m[1];}
const nm=b=>names[b]||b,solid=b=>{const B=BL[b];return !!b&&B&&B.solid&&!B.ramp&&!B.thin;};
const isRoad=b=>{const B=BL[b];return !!b&&(B&&B.ramp||/^(ASPHALT|LINE|LANE|CROSS)/.test(nm(b)));};
const out={};const add=(k,o)=>{(out[k]=out[k]||[]).push(o);};
T.ensureRoutes(0,0);console.log('world seed',T.seed);
for(let rx=-RAD;rx<=RAD;rx++)for(let rz=-RAD;rz<=RAD;rz++){const P=T.placeAt(rx,rz);T.ensureRoutes(P.cx*CELL,P.cz*CELL);}
const inR=E=>Math.abs(E.T.rx)<=RAD&&Math.abs(E.T.rz)<=RAD;
let routes=0,km=0;
const hitC=new Map();const hit=(k,R,s,x,y,z,b)=>{const K=k+':'+R+':'+Math.floor(s/24);let c=hitC.get(K);if(!c){c={k,R,s:Math.round(s),x,y,z,b:nm(b),n:0};hitC.set(K,c);}c.n++;};
for(const R of T.ROUTES.slice()){if(!inR(R.A)||!inR(R.B))continue;routes++;km+=R.L;
  for(let s=2;s<=R.L-2;s+=1){const p=T.rtPoint(R,s),e=T.rtSurfY(R,s);
    for(const o of Math.min(s,R.L-s)<16?[-1.5,1.5]:[-4.5,-1.5,1.5,4.5]){const x=Math.floor(p.x+p.tz*o),z=Math.floor(p.z-p.tx*o),y0=Math.floor(e-0.01);
      // the surface: road within a block of where it should be
      let road=false;for(let y=y0-1;y<=y0+1;y++)if(isRoad(T.get(x,y,z)))road=true;
      if(!road){const b=T.get(x,y0,z);if(nm(b)==='PLANKS'||nm(b)==='GRAVEL'||nm(b)==='METAL'){}else hit('noRoad',R.id,s,x,y0,z,b);}
      for(let y=y0+1;y<=y0+3;y++){const b=T.get(x,y,z);if(solid(b)&&!(BL[b].ramp)){hit('blocked',R.id,s,x,y,z,b);break;}}
    }}
  // past each end, the road on into town: the lanes for 40 blocks in along the line
  for(const E of [R.A,R.B]){const S=T.axisSpan(E.T,E.ax);if(!S)continue;const ax=E.ax,a0=E.s>0?(S.m1+1)*CELL:S.m0*CELL,dir=-E.s,HY=S.kind==='moto'?(ax==='x'?T.HY_X:T.HY_Z):G;
    const spanL=(S.m1-S.m0+1)*CELL;for(let d=0;d<Math.min(40,spanL);d++){const a=a0+dir*d;for(const o of [2.5,5.5]){const c=S.k*CELL+o,[x,z]=ax==='x'?[Math.floor(a),Math.floor(c)]:[Math.floor(c),Math.floor(a)];const r=S.kind==='moto'?T.hwRampAt(ax,S.k,a):null,y0=S.kind==='moto'?(r?HY-Math.floor(r.d/2):HY):G;
      if(!isRoad(T.get(x,y0,z))&&!isRoad(T.get(x,y0-1,z)))hit('intoTown',R.id,d,x,y0,z,T.get(x,y0,z));
      for(let y=y0+1;y<=y0+3;y++){const b=T.get(x,y,z);if(solid(b)){hit('intoTownBlocked',R.id,d,x,y,z,b);break;}}}}}
}
// does each highway's end actually join up with its town's streets? (the size of the street network it reaches)
const lone=[];let endsN=0;for(const R of T.ROUTES.slice()){if(!inR(R.A)||!inR(R.B))continue;for(const E of [R.A,R.B]){const S=T.axisSpan(E.T,E.ax);if(!S||S.kind==='moto')continue;endsN++;const j0=E.s>0?S.m1+1:S.m0,st=E.ax==='x'?[j0,S.k]:[S.k,j0],seen=new Set([st.join()]),q=[st];while(q.length&&seen.size<40){const [i,j]=q.pop();for(let d=0;d<4;d++){if(!T.segOpen(i,j,d))continue;const n=[i+[0,1,0,-1][d],j+[1,0,-1,0][d]];if(!seen.has(n.join())){seen.add(n.join());q.push(n);}}}
  if(seen.size<6)lone.push({R:R.id,x:st[0]*CELL+4,z:st[1]*CELL+4,nodes:seen.size,type:E.T.type,sp:S.m0+'-'+S.m1,flat:!!S.flat});}}
console.log('ground highway ends',endsN,'not joined to streets',lone.length,JSON.stringify(lone.slice(0,10)));
const hits=[...hitC.values()];const cnt={};for(const c of hits)cnt[c.k]=(cnt[c.k]||0)+1;
console.log('routes',routes,'length',Math.round(km),'problem stretches',JSON.stringify(cnt));
const byb={};for(const c of hits){const k=c.k+' '+c.b;byb[k]=(byb[k]||0)+1;}console.log('by block',JSON.stringify(byb));
for(const k of Object.keys(cnt))for(const c of hits.filter(h=>h.k===k).sort((a,b)=>b.n-a.n).slice(0,8))console.log(' ',JSON.stringify(c));
// the streets: both lanes of every open stretch, and what's at each end
let segs=0;const sb=new Map();const sh=(k,x,y,z,b)=>{const K=k+':'+Math.floor(x/CELL)+','+Math.floor(z/CELL);let c=sb.get(K);if(!c){c={k,x,y,z,b:nm(b),n:0,type:T.plotType(Math.floor(x/CELL),Math.floor(z/CELL))};sb.set(K,c);}c.n++;};
let ends=0,endBad=[],deg={};
for(let i=-PR;i<=PR;i++)for(let j=-PR;j<=PR;j++){const dg=T.jDeg(i,j);deg[dg]=(deg[dg]||0)+1;
  for(const d of [0,1]){if(!T.segOpen(i,j,d))continue;segs++;
    for(let a=ROADW;a<CELL;a+=1)for(const o of [2,6]){const x=d===0?i*CELL+o:i*CELL+a,z=d===0?j*CELL+a:j*CELL+o;const b=T.get(x,G,z);
      if(!isRoad(b)&&!isRoad(T.get(x,G+1,z))&&!isRoad(T.get(x,G+2,z)))sh('noSurface',x,G,z,b);
      for(let y=G+1;y<=G+3;y++){const u=T.get(x,y,z);if(solid(u)){sh('blocked',x,y,z,u);break;}}}}
  // a dead end: one arm only. What's beyond the stub?
  if(dg===1){ends++;const dir=[0,1,2,3].find(q=>T.segOpen(i,j,q)),opp=[[0,-1],[-1,0],[0,1],[1,0]][dir],cx=i*CELL+4,cz=j*CELL+4;let f=null;for(let t=4;t<=26&&!f;t+=2){const x=cx+opp[0]*t,z=cz+opp[1]*t,b=T.get(x,G,z);if(isRoad(b)&&t>6)f=t;}
    endBad.push({i,j,x:cx,z:cz,dir,type:T.plotType(i,j),near:f,bar:nm(T.get(cx+opp[0]*6,G+1,cz+opp[1]*6))});}
}
const sl=[...sb.values()];const sc={};for(const c of sl)sc[c.k+' '+c.b]=(sc[c.k+' '+c.b]||0)+1;
console.log('street stretches',segs,'junction degrees',JSON.stringify(deg),'problems',JSON.stringify(sc));for(const c of sl.sort((a,b)=>b.n-a.n).slice(0,10))console.log(' ',JSON.stringify(c));
console.log('dead ends',ends,'with road just beyond',endBad.filter(e=>e.near).length,JSON.stringify(endBad.filter(e=>e.near).slice(0,8)));
process.exit(0);
