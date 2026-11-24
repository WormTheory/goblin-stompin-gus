// Toppling performance: brings down a tall building and times every frame of its fall (stub THREE, so no real drawing).
// Usage: node toppleperf.js top [nth tallest]  (env FLOOR: the storey it breaks at, RAD: how far to look, DUMP=1: every frame's ms)
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={WX,set leafFall(v){leafFall=v},goblins,players,cars,frame,scene,DT,plotInfo,collapseBuilding,bldgAt,settle,topples,bodies,chunks,meshes,get,G,H,CELL,FH,keys,crush,rebuildSet,buildChunk,updateTopples,updateBodies,updateRubble,updateParts,ckey,CS,edits,save};})();');
src=src.replace("const safe=(name,f)=>{try{f();}","const safe=(name,f)=>{const __t0=process.hrtime.bigint();try{f();global.__sec[name]=(global.__sec[name]||0)+Number(process.hrtime.bigint()-__t0)/1e6;}");global.__sec={};
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

eval(src);const T=window.__t;let now=1000;
for(const f of els.play.L.click)f();pads.length=0;
for(let i=0;i<60;i++){now+=16.7;T.frame(now);}
T.DT.invuln=true;
const P=T.players[0];
// the tallest buildings within a few plots of Gus
const pcx=Math.floor(P.pos.x/T.CELL),pcz=Math.floor(P.pos.z/T.CELL);
const list=[];const R=+(process.env.RAD||30);
for(let px=pcx-R;px<=pcx+R;px++)for(let pz=pcz-R;pz<=pcz+R;pz++){const I=T.plotInfo(px,pz);(I.b||[]).forEach((b,i)=>{if(b.top>T.G+6)list.push({b,i,px,pz});});}
list.sort((a,b)=>b.b.top-a.b.top);
const mode=process.argv[2]||'top';   // top: fall from above the ground floor, leaning
const nth=+(process.argv[3]||0);
const E=list[nth];const b=E.b;
console.log('building',b.kind||b.type||'',' size',b.x1-b.x0,'x',b.z1-b.z0,'top',b.top-T.G,'plots searched',list.length);
const wx=E.px*T.CELL+(b.x0+b.x1)/2,wz=E.pz*T.CELL+(b.z0+b.z1)/2;
P.pos.set(wx+40,T.G+1,wz+40);
for(let i=0;i<240;i++){now+=16.7;T.frame(now);}
const fr=[];
if(process.env.SNOW){T.WX.snowCover=0.6;T.WX.k.snow=0.65;T.WX.snowClock=5;}if(process.env.LEAF)T.leafFall=+process.env.LEAF;
const B=T.bldgAt(wx,wz);
// take out one side of a low floor by hand, so it leans the way it would in a real fight
const L=T.G+1+T.FH*(+(process.env.FLOOR||2));
const t00=process.hrtime.bigint();
// mode 'into': the tallest building with another tall one close by, toppled toward it
let push={x:1,z:0};
if(mode==='into'){const c=e=>[e.px*T.CELL+(e.b.x0+e.b.x1)/2,e.pz*T.CELL+(e.b.z0+e.b.z1)/2];const [ax,az]=c(E);let best=null;for(const O of list){if(O===E)continue;const [ox,oz]=c(O);const d=Math.hypot(ox-ax,oz-az);if(d>3&&d<70&&(!best||O.b.top>best.O.b.top))best={O,ox,oz,d};}
  if(best){const dx=best.ox-ax,dz=best.oz-az;push=Math.abs(dx)>Math.abs(dz)?{x:Math.sign(dx),z:0}:{x:0,z:Math.sign(dz)};console.log('toppling toward a building',best.O.b.top-T.G,'tall,',best.d.toFixed(0),'away');}}
T.collapseBuilding(B,L,push);
const first=Number(process.hrtime.bigint()-t00)/1e6;
console.log('collapse call',first.toFixed(1),'ms; topples',T.topples.length,'bodies',T.bodies.length,T.topples[0]?('surface '+T.topples[0].n+' blocks '+T.topples[0].blocks.length):'');
const names=['updateTopples','updateBodies','updateRubble','updateParts'];
let maxT=0;let edits0=Object.keys(T.edits).length;
for(let i=0;i<60*20;i++){now+=16.7;const t=process.hrtime.bigint();T.frame(now);const ms=Number(process.hrtime.bigint()-t)/1e6;fr.push(ms);if(ms>(+process.env.SLOW||1e9))console.log('frame',i,ms.toFixed(0),'ms:',Object.entries(global.__sec).filter(e=>e[1]>2).sort((a,c)=>c[1]-a[1]).map(e=>e[0]+' '+e[1].toFixed(0)).join(', '));global.__sec={};maxT=Math.max(maxT,T.topples.length+T.bodies.length);if(!T.topples.length&&!T.bodies.length&&i>60)break;}
const s=[...fr].sort((a,c)=>a-c);
const pc=q=>s[Math.floor(q*(s.length-1))].toFixed(1);
console.log('frames',fr.length,'avg',(fr.reduce((a,c)=>a+c,0)/fr.length).toFixed(1),'ms  p50',pc(.5),'p90',pc(.9),'p99',pc(.99),'worst',pc(1),' edits',Object.keys(T.edits).length-edits0,' most falling at once',maxT);
let t=process.hrtime.bigint();for(let i=0;i<60;i++){now+=16.7;T.frame(now);}console.log('after: avg',(Number(process.hrtime.bigint()-t)/1e6/60).toFixed(1),'ms');
if(process.env.DUMP)console.log(fr.map(x=>x.toFixed(0)).join(' '));
process.exit(0);
