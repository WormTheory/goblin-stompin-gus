let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB};\n})();');
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
console.error=()=>{};   // (the stub can't draw lightning, and says so in the weather's own stack trace)
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// Can Gus spider-climb on to narrow things? Each case builds something on a flat floor, walks him at it with climb and
// forward held, and says where he ended up. Holding forward carries him on over the top, so forward's let go as he lands.
const DIRS=[[0,1],[1,0],[0,-1],[-1,0]],STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;   // (the floor's top: well above the town)
// (only what the last case built is taken away again: rewriting the whole arena each time runs out of memory)
for(let x=X0-14;x<=X0+14;x++)for(let z=Z0-14;z<=Z0+14;z++){T.setRaw(x,F-1,z,STONE);for(let y=F;y<F+36;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
let built=[];const clear=()=>{for(const [x,y,z] of built)T.setRaw(x,y,z,0);built=[];};
// u: blocks out in front of him, v: across. cols=[[u,v,fromHeight,toHeight],...]
const build=(d,cols)=>{for(const [u,v,a,b] of cols)for(let y=a;y<b;y++){const q=[X0+d[0]*u-d[1]*v,F+y,Z0+d[1]*u+d[0]*v];T.setRaw(q[0],q[1],q[2],STONE);built.push(q);}};
const row=(u,a,b,w=4)=>{const o=[];for(let v=-w;v<=w;v++)o.push([u,v,a,b]);return o;};
const SHAPES={
  pillar:h=>[[[3,0,0,h]],h],
  'free wall 1 deep':h=>[row(3,0,h),h],
  'ledge 1 deep':h=>[[...row(3,0,h),...row(4,0,h+9)],h],
  'ledge 2 deep':h=>[[...row(3,0,h),...row(4,0,h),...row(5,0,h+9)],h],
  'stack of 1 deep':h=>[[...row(3,0,h),...row(4,0,h*2),...row(5,0,h*3),...row(6,0,h*3+9)],h*3],
  'pillar from ledge':h=>[[...row(3,0,2),[4,0,2,2+h]],2+h],
  platform:h=>[[...row(3,0,h),...row(4,0,h),...row(5,0,h),...row(6,0,h),...row(7,0,h)],h],
};
const KF='KeyW',KC='KeyC';
const trial=(d,shape,h,off)=>{
  clear();const [cols,top]=SHAPES[shape](h);build(d,cols);
  const w=Math.atan2(d[0],d[1]);
  A.pos.set(X0+.5+d[0]*-1-d[1]*off,F,Z0+.5+d[1]*-1+d[0]*off);A.heading=w;A.cam.yaw=w+Math.PI;A.cam.pitch=-0.3;A.state='walk';A.vy=0;A.mvx=A.mvz=0;A.grounded=true;A.piv=null;A.peakY=F;A.hp=20;
  S(2);T.keys.add(KF);T.keys.add(KC);let seen=new Set(),t=0,got=false;
  for(;t<900&&!got;t++){S(1);seen.add(A.state);if(A.state==='walk'&&A.grounded&&Math.abs(A.pos.y-(F+top))<0.01)got=true;}
  if(got&&h>1&&(shape==='pillar'||shape==='free wall 1 deep'))S(40);   // (forward still held: he mustn't be carried straight off the far side)
  T.keys.delete(KF);T.keys.delete(KC);S(60);
  const onTop=Math.abs(A.pos.y-(F+top))<0.01&&A.grounded&&A.state==='walk';
  return {onTop,climbed:seen.has('climb'),y:+(A.pos.y-F).toFixed(2),state:A.state,secs:+(t/60).toFixed(1),out:+((A.pos.x-X0-.5)*d[0]+(A.pos.z-Z0-.5)*d[1]).toFixed(2)};
};
let bad=0,all=0;
for(const shape of Object.keys(SHAPES))for(const h of (shape==='ledge 1 deep'?[2,3,5,8]:[1,2,3,5,8]))for(const off of [0,0.35,-0.35,0.7,-0.7]){
  if(off&&shape!=='pillar'&&shape!=='pillar from ledge'&&off!==0.35)continue;
  const R=DIRS.map(d=>trial(d,shape,h,off)),ok=R.filter(r=>r.onTop).length;all+=4;bad+=4-ok;
  const b=R.find(r=>!r.onTop);
  console.log(shape.padEnd(18),'high',String(h).padStart(2),'off',String(off).padStart(5),`on top ${ok}/4`,b?JSON.stringify(b):'');
}
console.log('on top',all-bad,'of',all);process.exit(0);
