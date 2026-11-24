let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={setVeh,navAt,navFloorOf,get nav(){return players[0].nav},navCols,navCol,solidAt,supportAt,G,H,CELL,superOf,keys,stGroups,stFind,plotInfo,stairFloors,bldgAt,stFind,stMeshes,stGroups,get dbgRev(){return dbgRev},get dbgJoin(){return dbgJoin},hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStreet,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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
src=src.replace(/navUpdate\(dt\);/,'{const a0=performance.now();navUpdate(dt);(window.__nv=window.__nv||[]).push(performance.now()-a0);}');eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};

const [A,B]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
const S2=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
// How well do goblins run a hippo down? Each case stands a hippo somewhere and a goblin somewhere else, and times the goblin
// until it could club the hippo (or gives up after CAP seconds). KINDS=market,school to choose, CAP=90 for the limit, TR=1 to trace.
const CELL=32,G=T.G;A.hp=999;
const CAP=+(process.env.CAP||130),DT=33.4;
const gob=T.goblins.find(g=>!g.civ&&!g.staff&&!g.medic&&!g.ff&&!g.cop)||T.goblins[0];
for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
const pinA=q=>{A.hp=999;A.vy=0;A.pos.set(q.x,q.y,q.z);A.grounded=true;};
const tick=q=>{pinA(q);for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=DT;T.frame(now);};
const airy=(x,y,z)=>!T.solidAt(x,y,z)&&!T.solidAt(x,y+1,z)&&T.get(x,y,z)!==9;
const floorOK=(x,y,z)=>airy(x,y,z)&&T.solidAt(x,y-1,z);
// a clear spot on this floor near (x,z), in the given box
const near=(x,y,z,box)=>{x=Math.floor(x);z=Math.floor(z);for(let r=0;r<40;r++)for(let a=0;a<(r?r*8:1);a++){const t=a/(r*8||1)*6.283,X=Math.floor(x+Math.cos(t)*r),Z=Math.floor(z+Math.sin(t)*r);if(box&&(X<box[0]||X>=box[1]||Z<box[2]||Z>=box[3]))continue;if(floorOK(X,y,Z))return {x:X+.5,y,z:Z+.5};}return null;};
const groundY=(x,z,top=G+60)=>{let y=top;while(y>1&&!T.solidAt(x,y,z)&&T.get(x,y,z)!==9)y--;return y+1;};
let nOK=0,nAll=0,tot=0;const fails=[];
const chase=(label,from,to)=>{if(!from||!to){console.log(' ',label,'(no spot)');return;}
  // (goblins further than 75 from a hippo aren't in play at all: start it within that)
  {const L=Math.hypot(from.x-to.x,from.z-to.z);if(L>65){const q=near(to.x+(from.x-to.x)*65/L,from.y,to.z+(from.z-to.z)*65/L);if(q)from=q;}}
  for(let i=0;i<12;i++)tick(to);
  gob.state='chase';gob.hp=99;gob.stun=0;gob.indoor=false;gob.civ=false;gob.staff=false;gob.root.visible=true;gob.pos.set(from.x,from.y,from.z);gob.vy=0;gob.t=0;gob.detour=0;gob.trip=null;gob.stUp=undefined;gob.kv.set(0,0,0);gob.wt=null;gob.stuck=0;gob.atk=1;gob.act=null;
  let t=0,ok=false,y0=from.y,hi=from.y,lo=from.y;const dist=Math.hypot(from.x-to.x,from.z-to.z);
  while(t<CAP&&!ok&&gob.state==='chase'){tick(to);t+=DT/1000;gob.hp=99;const dd=Math.hypot(gob.pos.x-A.pos.x,gob.pos.z-A.pos.z),dy=A.pos.y-gob.pos.y;hi=Math.max(hi,gob.pos.y);lo=Math.min(lo,gob.pos.y);if(dd<2.6&&dy>-1.3&&dy<1.5)ok=true;
    if(process.env.TR&&Math.round(t/DT*1000)%150===0)console.log('    t',t.toFixed(0),'gob',gob.pos.x.toFixed(1),gob.pos.y.toFixed(1),gob.pos.z.toFixed(1),'d',dd.toFixed(1),'dy',dy.toFixed(1),gob.act?gob.act.k:'',gob.wet?'wet':'',gob.state,'f',T.navCol(Math.floor(gob.pos.x),Math.floor(gob.pos.z)).join(),'gus f',T.navCol(Math.floor(A.pos.x),Math.floor(A.pos.z)).join(),'A',A.pos.x.toFixed(1),A.pos.y,A.pos.z.toFixed(1));}
  if(!ok&&process.env.TRF){for(let n=0;n<40;n++){tick(to);const F=T.nav.front,i=T.navAt(F,gob);console.log('     ',gob.pos.x.toFixed(2),gob.pos.y.toFixed(2),gob.pos.z.toFixed(2),'h',gob.heading.toFixed(2),'vy',gob.vy.toFixed(1),'det',gob.detour.toFixed(1),'act',gob.act&&gob.act.k,'node',i,i>=0?F.mv[i]+' '+F.cost[i]:'','stuck',gob.stuck.toFixed(2),'stun',gob.stun.toFixed(2));}const gx=Math.floor(gob.pos.x),gz=Math.floor(gob.pos.z),gy=Math.floor(gob.pos.y);for(let dz=-3;dz<=3;dz++){let l='';for(let dx=-3;dx<=3;dx++)l+=JSON.stringify(T.navCol(gx+dx,gz+dz)).padEnd(20);console.log(l);}for(const yy of [gy-1,gy,gy+1,gy+2]){console.log('y',yy);for(let dz=-3;dz<=3;dz++){let l='';for(let dx=-3;dx<=3;dx++)l+=String(T.get(gx+dx,yy,gz+dz)).padStart(4);console.log(l);}}let lo=999,hi=0;const F=T.nav.front;for(let i=0;i<F.n;i++){const f=F.key[i]&255;lo=Math.min(lo,f);hi=Math.max(hi,f);}console.log('map floors from',lo,'to',hi,'nodes',F.n);}
  nAll++;if(ok){nOK++;tot+=t;}else{fails.push(label);const F=T.nav&&T.nav.front;if(F){const i=T.navAt(F,gob),X=k=>[(k>>18&1023)+F.ox,(k>>8&1023)+F.oz,k&255].join(' ');console.log('    stuck at',gob.pos.x.toFixed(1),gob.pos.y.toFixed(1),gob.pos.z.toFixed(1),'node',i,i>=0?'cost '+F.cost[i]+' mv '+F.mv[i]+' to '+(F.par[i]>=0?X(F.key[F.par[i]]):'goal'):'','nodes',F.n,'hippo at',to.x,to.y,to.z,'heading',gob.heading.toFixed(2),'detour',gob.detour.toFixed(1),'act',gob.act&&gob.act.k,'cols here',JSON.stringify(T.navCol(Math.floor(gob.pos.x),Math.floor(gob.pos.z))),'indoor',gob.indoor);}}
  console.log(' ',label.padEnd(30),ok?('caught in '+t.toFixed(1)+'s').padEnd(20):('GAVE UP').padEnd(20),'dist',dist.toFixed(0).padStart(3),'rise',String(Math.round(to.y-from.y)).padStart(3),ok?'':Math.hypot(gob.pos.x-A.pos.x,gob.pos.z-A.pos.z)>150?'left play (the way round goes too far off)':'ended '+Math.hypot(gob.pos.x-to.x,gob.pos.z-to.z).toFixed(0)+' away, '+(to.y-gob.pos.y).toFixed(0)+' below');};
const KINDS=(process.env.KINDS||'market,bigbox,ikea,school,police,hospital,mall,museum,campus,prison,factory,mid,tower,fire,homes').split(',');
const findType=ty=>{for(let r=0;r<200;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const P=T.plotInfo(x,z);if(P.type===ty&&P.b.length)return {ax:x,az:z};}return null;};

// Gus clinging partway up a wall; a goblin starts on each side of the building (and further off) in turn. Where does it end up?
const KS=(process.env.WK||'mid,tower,school,police').split(',');   // (ONLY=1: just the corner and roof cases at the end)
for(const k of process.env.ONLY?[]:KS){const F=T.stFind(k,0,0);if(!F)continue;const P=T.plotInfo(F.ax,F.az);let b=P.b[0];for(const q of P.b)if((q.x1-q.x0)*(q.z1-q.z0)>(b.x1-b.x0)*(b.z1-b.z0))b=q;
  const X0=F.ax*CELL,Z0=F.az*CELL,cx=X0+((b.x0+b.x1)>>1),wz=Z0+b.z0-1,y0=groundY(cx,wz),topY=groundY(cx,wz+1,G+150);if(topY-y0<10){console.log(k,'too low');continue;}
  const up=Math.round((topY-y0)/2),to={x:cx+.5,y:y0+up,z:wz+.6};
  const W=b.x1-b.x0,Dp=b.z1-b.z0;
  const starts=[['same side',cx-6,wz-7],['left end',X0+b.x0-4,Z0+((b.z0+b.z1)>>1)],['right end',X0+b.x1+3,Z0+((b.z0+b.z1)>>1)],['far side',cx,Z0+b.z1+4]];
  for(const [name,sx,sz] of starts){const st=near(sx,groundY(Math.floor(sx),Math.floor(sz)),sz);if(!st){console.log(' ',name,'no spot');continue;}
    T.keys.add('KeyC');const cling=()=>{A.state='climb';A.climbD=[0,1];A.heading=0;A.vy=0;A.pos.set(to.x,to.y,to.z);A.hp=999;};
    for(let i=0;i<12;i++){cling();now+=DT;T.frame(now);}
    gob.state='chase';gob.hp=99;gob.stun=0;gob.indoor=false;gob.civ=false;gob.staff=false;gob.root.visible=true;gob.pos.set(st.x,st.y,st.z);gob.vy=0;gob.t=0;gob.detour=0;gob.kv.set(0,0,0);gob.atk=1;gob.act=null;
    let t=0,h=0,first=null,roof=0;while(t<60){cling();for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=DT;T.frame(now);t+=DT/1000;gob.hp=99;if(gob.pos.y>topY-0.5)roof+=DT/1000;if(A.hp<999){h++;if(first===null)first=t;}}
    T.keys.delete('KeyC');A.state='walk';
    console.log(' ',(k+' ('+(topY-y0)+' tall, Gus '+up+' up)').padEnd(28),name.padEnd(10),h?(h+' blows, first after '+first.toFixed(1)+'s').padEnd(30):'NO BLOWS'.padEnd(30),'time on the roof',roof.toFixed(1)+'s','ended',(gob.pos.x-to.x).toFixed(1),(gob.pos.y-to.y).toFixed(1),(gob.pos.z-to.z).toFixed(1),gob.act?gob.act.k:'');}}
// Gus lets go partway: the goblin's on the wall below him, he drops to the foot of it. Does it come back down after him, or
// carry on up to the roof?
for(const k of process.env.ONLY?[]:KS){const F=T.stFind(k,0,0);if(!F)continue;const P=T.plotInfo(F.ax,F.az);let b=P.b[0];for(const q of P.b)if((q.x1-q.x0)*(q.z1-q.z0)>(b.x1-b.x0)*(b.z1-b.z0))b=q;
  const X0=F.ax*CELL,Z0=F.az*CELL,cx=X0+((b.x0+b.x1)>>1),wz=Z0+b.z0-1,y0=groundY(cx,wz),topY=groundY(cx,wz+1,G+150);if(topY-y0<10)continue;
  const up=Math.round((topY-y0)*0.75),wall={x:cx+.5,y:y0+up,z:wz+.6},foot={x:cx+.5,y:y0,z:wz-1.5};
  T.keys.add('KeyC');const cling=()=>{A.state='climb';A.climbD=[0,1];A.heading=0;A.vy=0;A.pos.set(wall.x,wall.y,wall.z);A.hp=999;};
  for(let i=0;i<12;i++){cling();now+=DT;T.frame(now);}
  gob.state='chase';gob.hp=99;gob.stun=0;gob.indoor=false;gob.civ=false;gob.staff=false;gob.root.visible=true;gob.pos.set(cx-5.5,y0,wz-6.5);gob.vy=0;gob.t=0;gob.detour=0;gob.kv.set(0,0,0);gob.atk=1;gob.act=null;
  let t=0,fell=false,h=0,first=null,roof=0,hiAfter=0,ft=0;
  while(t<60){if(!fell&&gob.act&&gob.act.k==='up'&&gob.pos.y>y0+3){fell=true;T.keys.delete('KeyC');ft=t;}
    if(fell){A.state='walk';A.vy=0;A.pos.set(foot.x,foot.y,foot.z);A.hp=999;A.grounded=true;}else cling();
    for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=DT;T.frame(now);t+=DT/1000;gob.hp=99;
    if(fell){hiAfter=Math.max(hiAfter,gob.pos.y-y0);if(gob.pos.y>topY-0.5)roof+=DT/1000;if(A.hp<999){h++;if(first===null)first=t-ft;}}}
  T.keys.delete('KeyC');A.state='walk';
  console.log(' ',(k+' ('+(topY-y0)+' tall)').padEnd(18),'Gus let go at',up,'up:',fell?(h?h+' blows after he landed, first '+first.toFixed(1)+'s later':'NO BLOWS after he landed').padEnd(42)+' goblin got up to '+hiAfter.toFixed(1)+', time on the roof '+roof.toFixed(1)+'s':'goblin never got on the wall');}
// Round the corner: Gus clings to the front of the building near one end; the goblin's already partway up the end wall,
// climbing. Does it come round the corner to him (or down and round), or carry on up to the roof first?
// And from the roof: the goblin's up top over Gus, who clings lower down the front. Does it climb down to him, or jump off?
const goPut=(x,y,z,act)=>{gob.state='chase';gob.hp=99;gob.stun=0;gob.indoor=false;gob.civ=false;gob.staff=false;gob.root.visible=true;gob.pos.set(x,y,z);gob.vy=0;gob.t=0;gob.detour=0;gob.kv.set(0,0,0);gob.atk=1;gob.act=act;gob.fallTop=undefined;gob.los=false;gob.losT=0;};
for(const k of KS){const F=T.stFind(k,0,0);if(!F)continue;const P=T.plotInfo(F.ax,F.az);let b=P.b[0];for(const q of P.b)if((q.x1-q.x0)*(q.z1-q.z0)>(b.x1-b.x0)*(b.z1-b.z0))b=q;
  const X0=F.ax*CELL,Z0=F.az*CELL,cx=X0+((b.x0+b.x1)>>1),wz=Z0+b.z0-1,y0=groundY(cx,wz),topY=groundY(cx,wz+1,G+150);if(topY-y0<10)continue;
  for(const [name,frac,setup,edge] of [
    ['corner, low',0.6,(to)=>{const ex=X0+b.x0-1,ez=Z0+b.z0+3,ey=y0+2,tp=groundY(ex+1,ez,G+150);return [ex+.7,ey,ez+.5,{k:'up',x:ex+.7,z:ez+.5,y1:tp,tx:ex+1.5,tz:ez+.5,f:[1,0],chasing:true}];}],
    ['corner, level',0.5,(to)=>{const ex=X0+b.x0-1,ez=Z0+b.z0+3,ey=Math.floor(to.y),tp=groundY(ex+1,ez,G+150);return [ex+.7,ey,ez+.5,{k:'up',x:ex+.7,z:ez+.5,y1:tp,tx:ex+1.5,tz:ez+.5,f:[1,0],chasing:true}];}],
    ['corner, far end',0.5,(to)=>{const ex=X0+b.x1,ez=Z0+b.z0+3,ey=y0+2,tp=groundY(ex-1,ez,G+150);return [ex+.3,ey,ez+.5,{k:'up',x:ex+.3,z:ez+.5,y1:tp,tx:ex-.5,tz:ez+.5,f:[-1,0],chasing:true}];}],
    ['roof, Gus a third up',0.33,(to)=>{const q=near(cx,topY,wz+4);return q&&[q.x,q.y,q.z,null];}],
    ['roof, Gus near the top',0.75,(to)=>{const q=near(cx+3,topY,wz+6);return q&&[q.x,q.y,q.z,null];}],
    ['roof, Gus low',0.15,(to)=>{const q=near(cx-3,topY,wz+3);return q&&[q.x,q.y,q.z,null];}],
    ['roof, far corner',0.3,(to)=>{const q=near(Math.min(X0+b.x1-2,cx+20),topY,Math.min(Z0+b.z1-2,wz+20));return q&&[q.x,q.y,q.z,null];}],
    // (Gus edging along the wall a block every second and a half, so the goblin's route is always a moment behind him)
    ['roof, Gus edging along',0.4,(to)=>{const q=near(cx,topY,wz+3);return q&&[q.x,q.y,q.z,null];},1],
    ['corner, Gus edging along',0.5,(to)=>{const ex=X0+b.x0-1,ez=Z0+b.z0+3,ey=y0+2,tp=groundY(ex+1,ez,G+150);return [ex+.7,ey,ez+.5,{k:'up',x:ex+.7,z:ez+.5,y1:tp,tx:ex+1.5,tz:ez+.5,f:[1,0],chasing:true}];},1]]){
    const gx=name.startsWith('corner')?X0+b.x0+1:cx,to={x:gx+.5,y:y0+Math.round((topY-y0)*frac),z:wz+.6};
    while(to.y>y0+1&&!(T.solidAt(gx,to.y,wz+1)&&T.solidAt(gx,to.y+1,wz+1)))to.y--;   // (somewhere there's wall to cling to, not a window or the gap under the eaves)
    T.keys.add('KeyC');let ex=0;const cling=()=>{A.state='climb';A.climbD=[0,1];A.heading=0;A.vy=0;A.pos.set(to.x+ex,to.y,to.z);A.hp=999;};
    for(let i=0;i<30;i++){cling();now+=DT;T.frame(now);}
    const st=setup(to);if(!st){console.log(' ',k,name,'(no spot)');continue;}const [sx,sy,sz,act]=st;goPut(sx,sy,sz,act);
    let t=0,h=0,first=null,roof=0,hi=gob.pos.y,drop=0,minY=gob.pos.y,wallT=0,offTop=false;
    while(t<40){if(edge)ex=[0,1,2,3,2,1][Math.floor(t/1.5)%6];cling();for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}
      const yb=gob.pos.y,climbing=gob.act&&(gob.act.k==='up'||gob.act.k==='down');now+=DT;T.frame(now);t+=DT/1000;gob.hp=99;
      if(gob.state!=='chase'){gob.state='chase';}
      hi=Math.max(hi,gob.pos.y);minY=Math.min(minY,gob.pos.y);if(gob.pos.y>topY-0.5)roof+=DT/1000;if(climbing)wallT+=DT/1000;
      if(!gob.act&&yb-gob.pos.y>0.3){drop+=yb-gob.pos.y;if(yb>topY-1)offTop=true;}
      if(A.hp<999){h++;if(first===null)first=t;}}
    T.keys.delete('KeyC');A.state='walk';
    console.log(' ',(k+' ('+(topY-y0)+' tall, Gus '+(to.y-y0)+' up)').padEnd(28),name.padEnd(22),h?(h+' blows, first after '+first.toFixed(1)+'s').padEnd(30):'NO BLOWS'.padEnd(30),
      'on the roof',roof.toFixed(1)+'s','top',(hi-y0).toFixed(1),'lowest',(minY-y0).toFixed(1),'fell',drop.toFixed(1)+(offTop?' (off the roof)':''),'on the wall',wallT.toFixed(1)+'s');}}
process.exit(0);
