let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={renderMap,explored:()=>explored,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,dbgGeo,gusBite,set playingX(v){},HB,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,realmOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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





const [A,B]=T.players;
const step=(n=1)=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
for(const f of els.play.L.click)f();pads.length=0;

const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();




for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
for(const g of T.goblins){g.state='wait';g.root.visible=false;g.t=-1e9;}
A.pos.set(4,13,60.5);A.heading=0;A.cam.yaw=Math.PI;A.state='walk';A.hp=99;S(10);
const mkG=(x,z)=>{const g=T.goblins.find(o=>o.state==='wait'&&!o.civ);g.state='chase';g.hp=99;g.stun=1e9;g.root.visible=true;g.pos.set(x,13,z);g.kv.set(0,0,0);return g;};
const a=mkG(4,68.5),b=mkG(7,66);
for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
for(const g of T.goblins){g.state='wait';g.root.visible=false;g.t=-1e9;}
let tw=null;for(let px=1;px<=8&&!tw;px++)for(let pz=1;pz<=8&&!tw;pz++){const a=T.plotInfo(px,pz);if((a.type==='mid'||a.type==='tower')&&!T.superOf(px,pz))tw={px,pz,b:a.b[0]};}
const bw=tw.b,X0=tw.px*32,Z0=tw.pz*32,cz=Z0+((bw.z0+bw.z1)>>1)+0.5;
const errs=[];console.error=(...a)=>{errs.push(a.join(' ').slice(0,300));};
let calls=0;const ctx=new Proxy({},{get:(t,p)=>{if(p in t)return t[p];if(p==='createPattern'||p==='createLinearGradient')return()=>({addColorStop(){}});if(p==='getImageData')return()=>({data:new Uint8ClampedArray(4)});if(p==='canvas')return{width:200,height:200};return(...a)=>{calls++;};},set:(t,p,v)=>{t[p]=v;return true;}});
const ce0=document.createElement;document.createElement=(...a)=>{const o=ce0(...a);o.getContext=()=>ctx;return o;};const els2=document.getElementById('mapCanvas');Object.assign(els2,{clientWidth:800,clientHeight:600,width:0,height:0,getContext:()=>ctx});
// explore a wide area so plains get drawn
const E=T.explored();for(let px=-80;px<=80;px++)for(let pz=-80;pz<=80;pz++)E.add(px+','+pz);
try{T.renderMap();console.log('renderMap ok, calls',calls);}catch(e){console.log('renderMap ERR',e.stack.split('\n').slice(0,4).join(' | '));}
A.ui.mini={width:200,height:200,getContext:()=>ctx};calls=0;
const R=T.ROUTES.length?T.ROUTES[0]:null;A.pos.set(448,46,-420);
try{S(120);console.log('frames with minimap ok, ctx calls',calls);}catch(e){console.log('ERR',e.stack.split('\n').slice(0,4).join(' | '));}
console.log('errors',errs.length,errs.slice(0,4));process.exit(0);
