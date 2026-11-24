// Every chunk's mesh, hashed: buildChunk has to go on producing exactly the same geometry however it's made faster.
// Usage: SEED=1 node meshhash.js (compare the printed hashes before and after a change to the mesher)
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,frame,meshes,buildChunk,crush,G,CS,CELL,DT,ckey,get leafFall(){return leafFall},set leafFall(v){leafFall=v},GFX_OFF};})();');
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

THREE.BufferGeometry.prototype.setIndex=function(i){this.index=i;};
eval(src);const T=window.__t;let now=1000;
for(const f of els.play.L.click)f();pads.length=0;
for(let i=0;i<30;i++){now+=16.7;T.frame(now);}
const P=T.players[0];
const fnv=(h,a)=>{for(let i=0;i<a.length;i++){const v=Math.round(a[i]*1000);h=Math.imul(h^v,16777619)>>>0;}return h;};
const hashMesh=e=>{let h=2166136261,n=0;for(const m of e.m){const g=m.geometry;for(const k of ['position','uv','color','aSky'])h=fnv(h,Float32Array.from(g.attributes[k].array));   /* (as the graphics card gets them) */const I=g.index&&(g.index.array||g.index);h=fnv(h,I);n+=I.length;}return [h,n];};
let tot=2166136261,faces=0,chunks=0;const lines=[];
const spots=[[0,0],[17,5],[-23,31],[40,-12],[-60,-60],[90,70]];
const cx0=Math.floor(P.pos.x/T.CS),cz0=Math.floor(P.pos.z/T.CS);
const t0=Date.now();let buildMs=0;
const pass=(tag)=>{for(const [ax,az] of spots){for(let dx=0;dx<4;dx++)for(let dz=0;dz<4;dz++){const cx=cx0+ax+dx,cz=cz0+az+dz;const t=process.hrtime.bigint();T.buildChunk(cx,cz);buildMs+=Number(process.hrtime.bigint()-t)/1e6;const [h,n]=hashMesh(T.meshes.get(T.ckey(cx,cz)));tot=fnv(tot,[h]);faces+=n;chunks++;}}lines.push(tag+' '+tot+' tris '+faces/3);};
pass('plain');
T.crush(cx0*T.CS+8,T.G+6,cz0*T.CS+8,6,-6,12);pass('crushed');
T.leafFall=0.5;pass('leaves');T.leafFall=0;
T.GFX_OFF.caves=true;T.GFX_OFF.subway=true;pass('gfxoff');T.GFX_OFF.caves=false;T.GFX_OFF.subway=false;
console.log(lines.join('\n'));
console.log('chunks',chunks);console.error('per chunk',(buildMs/chunks).toFixed(2),'ms (includes generating)');
process.exit(0);
