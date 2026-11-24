// Crowd performance: how long the goblins' update takes with hundreds of them chasing, and that they still keep
// apart. Prints ms per frame for updateGoblins and for a whole frame (stub THREE, so no real drawing), how many
// goblins the pool holds, and the closest any two chasing goblins stand after a few seconds bunched up.
// Usage: node crowdperf.js [counts]   e.g. node crowdperf.js 50,200,800
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={goblins,players,updateGoblins,spawnGoblin,frame,scene,setCrowd(n){crowd=n;ensureCrowdPools();},DT};})();');
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
for(let i=0;i<120;i++){now+=16.7;T.frame(now);}
T.DT.invuln=true;T.DT.peace=true;   // (they mill about rather than all piling on to Gus)
const P=T.players[0];
const counts=(process.argv[2]||'50,200,400,800').split(',').map(Number);
for(const N of counts){
  T.setCrowd(N/14);
  for(const g of T.goblins)if(g.state!=='wait'){g.state='wait';g.root.visible=false;}
  let k=0;for(const g of T.goblins){if(k>=N)break;if(g.state==='wait'&&!g.civ&&!g.staff&&T.spawnGoblin(g))k++;}
  // bunched up: two to a spot on a grid a block apart, out in front of Gus
  let i=0;const cols=Math.ceil(Math.sqrt(N/2));
  for(const g of T.goblins)if(g.state==='chase'){const j=i>>1;g.pos.set(P.pos.x+6+Math.floor(j/cols)+(i&1)*0.05,P.pos.y,P.pos.z+(j%cols-cols/2));g.indoor=false;g.kv.set(0,0,0);i++;}
  for(let j=0;j<20;j++)T.updateGoblins(1/60);
  const R=60;let t0=process.hrtime.bigint();for(let j=0;j<R;j++)T.updateGoblins(1/60);
  const ms=Number(process.hrtime.bigint()-t0)/1e6/R;
  t0=process.hrtime.bigint();for(let j=0;j<R;j++){now+=16.7;T.frame(now);}
  const fm=Number(process.hrtime.bigint()-t0)/1e6/R;
  // the closest two chasing goblins on the same level (bunched pairs should have been pushed apart)
  const ch=T.goblins.filter(g=>g.state==='chase');let close=1e9,pairs=0;
  for(let a=0;a<ch.length;a++)for(let b=a+1;b<ch.length;b++){const A=ch[a],B=ch[b];if(Math.abs(A.pos.y-B.pos.y)>0.5)continue;const d=Math.hypot(A.pos.x-B.pos.x,A.pos.z-B.pos.z);if(d<close)close=d;if(d<0.3)pairs++;}
  console.log('goblins',N,'chasing',ch.length,'pool',T.goblins.length,'| updateGoblins',ms.toFixed(2),'ms','| whole frame',fm.toFixed(2),'ms','| closest pair',close.toFixed(2),'pairs under 0.3:',pairs);
}
process.exit(0);
