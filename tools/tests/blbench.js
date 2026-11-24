// Every chunk's mesh, hashed: buildChunk has to go on producing exactly the same geometry however it's made faster.
// Usage: SEED=1 node meshhash.js (compare the printed hashes before and after a change to the mesher)
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,frame,meshes,buildChunk,crush,G,CS,CELL,DT,ckey,get BL(){return BL_ON},set BL(v){BL_ON=v},blkFill,blkDone,chunkArr,blkEmitters,rebuildQ,setRaw,get:get,B_LIT};})();');
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

// Block lighting: how much longer buildChunk takes with it on, in the city round the start, and that it changes nothing else
const P=T.players[0],CS=T.CS;
const cx0=Math.floor(P.pos.x/CS),cz0=Math.floor(P.pos.z/CS),R=+(process.argv[2]||4);
const list=[];for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++){const cx=cx0+dx,cz=cz0+dz;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)T.chunkArr(cx+a,cz+b);list.push([cx,cz]);}
const ems=c=>{let n=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)n+=T.blkEmitters(T.chunkArr(c[0]+a,c[1]+b)).length;return n;};
list.sort((p,q)=>ems(q)-ems(p));
const dense=list.slice(0,8);
const fnv=(h,a)=>{for(let i=0;i<a.length;i++){const v=Math.round(a[i]*1000);h=Math.imul(h^v,16777619)>>>0;}return h;};
const hash=e=>{let h=2166136261;for(const m of e.m){const g=m.geometry;for(const k of ['position','uv','color','aSky'])h=fnv(h,Float32Array.from(g.attributes[k].array));h=fnv(h,g.index.array||g.index);}return h;};
const time=(on,L,reps)=>{T.BL=on;for(const c of L)T.buildChunk(c[0],c[1]);const t=process.hrtime.bigint();for(let r=0;r<reps;r++)for(const c of L)T.buildChunk(c[0],c[1]);return Number(process.hrtime.bigint()-t)/1e6/reps/L.length;};
for(let k=0;k<2;k++){time(false,list,1);time(true,list,1);}
const offA=time(false,list,3),onA=time(true,list,3),offD=time(false,dense,10),onD=time(true,dense,10);
console.log('chunks',list.length,'all: off',offA.toFixed(2),'ms on',onA.toFixed(2),'ms  +'+(onA-offA).toFixed(2));
console.log('densest 8 (emitters in 3x3: '+dense.map(ems).join(',')+'): off',offD.toFixed(2),'ms on',onD.toFixed(2),'ms  +'+(onD-offD).toFixed(2));
// the same geometry either way, and how much of it is lit
let same=0,lit=0,verts=0,unlitCh=0;
for(const c of list){T.BL=false;T.buildChunk(c[0],c[1]);const h0=hash(T.meshes.get(T.ckey(c[0],c[1])));T.BL=true;T.buildChunk(c[0],c[1]);const e=T.meshes.get(T.ckey(c[0],c[1]));if(hash(e)===h0)same++;
  let any=false;for(const m of e.m){const a=m.geometry.attributes.aBlk;if(!a)continue;for(let i=0;i<a.array.length;i+=3){verts++;if(a.array[i]|a.array[i+1]|a.array[i+2]){lit++;any=true;}}}if(!any)unlitCh++;}
console.log('same geometry',same+'/'+list.length,'lit corners',(100*lit/verts).toFixed(1)+'%','chunks with no light',unlitCh);
// an edit: a lamp block put in and taken out again rebuilds the chunks round it
T.rebuildQ.clear();const x=cx0*CS+8,z=cz0*CS+8,y=T.G+3;const was=T.get(x,y,z);T.setRaw(x,y,z,26+0);const q1=T.rebuildQ.size;T.rebuildQ.clear();T.setRaw(x,y,z,was);
console.log('rebuilds queued by a lamp block',q1);
{T.BL=true;const t=process.hrtime.bigint();for(let r=0;r<10;r++)for(const c of dense){T.blkFill(c[0],c[1],0,140);T.blkDone(c[0],c[1],{},0,140);}console.log('fill alone (densest)',(Number(process.hrtime.bigint()-t)/1e6/10/dense.length).toFixed(2),'ms');}
process.exit(0);
