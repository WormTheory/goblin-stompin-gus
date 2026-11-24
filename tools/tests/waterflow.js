let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get,setRaw,addEdit,get edits(){return edits},chunks,CS,G,H,WATER,AIR,STONE,SAND,NET,players,frame,ckey,wfJobs,wfRemoved,wfSeen,updateWater,WF_CAP};\n})();');
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
// Water flow (destruction/water-flow.js): knock out a block under or beside water and the water pours in, as far as its
// surface, until the space is full (WF_CAP a breach is only a safety net), never more than a small body it came from
// holds, and waiting at the edge of the made world till that part is made. Prints what each case filled.
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;run(1);
const {G,WATER:W,AIR,STONE}=T;
const dig=(x,y,z)=>{T.setRaw(x,y,z,AIR);T.addEdit(x,y,z,AIR);};   // (as a smash does it)
const put=(x,y,z,b)=>{T.setRaw(x,y,z,b);T.addEdit(x,y,z,b);};
const count=(x0,x1,y0,y1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(T.get(x,y,z)===W)n++;return n;};
const settle=()=>{for(let i=0;i<600&&(T.wfJobs.length||T.wfRemoved.length);i++)run(0.1);};
// 1. the sea: find a column of deep water and the sea bed under it
let sx=null,sz,bed;
for(let r=0;r<6000&&sx===null;r+=37)for(const [x,z] of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r],[r,-r],[-r,r]]){
  if(T.get(x,G,z)!==W||T.get(x,G-3,z)!==W)continue;let y=G;while(T.get(x,y,z)===W)y--;sx=x;sz=z;bed=y;break;}
if(sx===null){console.log('no sea found');process.exit(0);}
A.pos.set(sx+0.5,G+3,sz+0.5);run(1);
const room=(x0,y0,z0,w,h)=>{for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+w;z++)for(let y=y0;y<y0+h;y++)dig(x,y,z);};
// a shaft three deep straight down through the sea bed
dig(sx,bed,sz);dig(sx,bed-1,sz);dig(sx,bed-2,sz);
let t=0;while(t<5&&T.get(sx,bed-2,sz)!==W){run(0.05);t+=0.05;}
console.log('sea shaft: filled',count(sx,sx,bed-2,bed,sz,sz),'of 3 in',t.toFixed(2)+'s','| saved as edits',T.edits[sx+','+(bed-2)+','+sz]===W);
// a room 4 x 4 x 3 carved out under the bed (nothing open to the water yet), then a hole through to it
const bedAt=(x,z)=>{let y=G;while(T.get(x,y,z)===W)y--;return y;};
const rx=sx+3,rb=bedAt(rx,sz),ry=rb-6;room(rx,ry,sz,4,3);settle();
const dry=count(rx,rx+3,ry,ry+2,sz,sz+3);
for(let y=rb;y>=ry+3;y--)dig(rx,y,sz);settle();
console.log('sea room 48: dry before',dry,'after',count(rx,rx+3,ry,ry+2,sz,sz+3),'| shaft',count(rx,rx,ry+3,rb,sz,sz),'of',rb-ry-2);
// a cavern 10 x 10 x 5 = 500: fills to the last block
let cx=sx-14;for(const k of [-14,-20,-26,-32,10,16,22,28])if(T.get(sx+k,G,sz)===W){cx=sx+k;break;}
const cb=bedAt(cx,sz),cy=cb-12;room(cx,cy,sz,10,5);settle();
for(let y=cb;y>cy+4;y--)dig(cx,y,sz);settle();
console.log('sea cavern 500: filled',count(cx,cx+9,cy,cy+4,sz,sz+9),'+ shaft',count(cx,cx,cy+5,cb,sz,sz),'of',cb-cy-4,'| safety cap',T.WF_CAP);
// 2. a little tank: 2 x 2 of water on a stone pillar in the air, its stone knocked out from under it
const px=sx+40,pz=sz+40;
const py=G+20;for(let x=px-3;x<=px+3;x++)for(let z=pz-3;z<=pz+3;z++)put(x,py-6,z,STONE);   // (a floor to catch it)
for(let y=py-5;y<py;y++)for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])put(px+a,y,pz+b,STONE);
for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])put(px+a,py,pz+b,W);
settle();dig(px,py-1,pz);settle();
console.log('tank of 4 holed underneath: water below it',count(px-3,px+3,py-6,py-1,pz-3,pz+3),'(at most 4) | tank still',count(px,px+1,py,py,pz,pz+1));
// 3. water held in by a wall, the wall broken at the water's level, a pit dug beside it: fills no higher than the surface
const qx=px+20,qz=pz,qy=G+20;
for(let x=qx-1;x<=qx+8;x++)for(let z=qz-1;z<=qz+3;z++)for(let y=qy-4;y<=qy+3;y++)put(x,y,z,y===qy-4||x===qx-1||x===qx+8||z===qz-1||z===qz+3||x===qx+3?STONE:AIR);   // (a stone box, split in two by a wall at qx+3)
for(let x=qx;x<=qx+2;x++)for(let z=qz;z<=qz+2;z++)for(let y=qy-3;y<=qy;y++)put(x,y,z,W);   // (3 x 3, 4 deep: 36 blocks of water, surface at qy)
settle();dig(qx+3,qy,qz+1);settle();
console.log('walled pool broken at its surface: beside it',count(qx+4,qx+7,qy-3,qy+3,qz,qz+2),'above the surface',count(qx+4,qx+7,qy+1,qy+3,qz,qz+2),'(0) | gap',count(qx+3,qx+3,qy,qy,qz+1,qz+1));
// 4. a block knocked out with no water near it: nothing happens
dig(qx+5,qy+2,qz+1);settle();console.log('dry hole stays dry',T.get(qx+5,qy+2,qz+1)===AIR);
// 5. online: the host sends each filled block to its guests, as a smashed one
const out=[];T.NET.mode=1;T.NET.guests.set('g',{net:{out}});
dig(sx+1,bed,sz);for(let i=0;i<20&&T.wfRemoved.length+T.wfJobs.length;i++)T.updateWater(0.1);
T.NET.mode=0;T.NET.guests.clear();
const sent=[];for(const e of out)if(e[0]==='e')for(let i=0;i<e[1].length;i+=4)sent.push(e[1].slice(i,i+4).join(','));
console.log('sent to a guest',sent.join(' '),'| water',sent.some(s=>s===[sx+1,bed,sz,W].join(',')));
// 6. the edge of the made world: a tunnel from the sea runs to the end of its chunk, and the next chunk isn't made yet
// (far from the players, stepping the water alone: a frame would let go of chunks out there)
const step=s=>{for(let t=0;t<s;t+=0.25)T.updateWater(0.25);};
let ex=null,ez,eb;
for(let r=2600;r<9000&&ex===null;r+=53)for(const [x,z] of [[r,r],[-r,r],[r,-r],[-r,-r]]){
  const c=Math.floor(x/T.CS);if(T.chunks.has(T.ckey(c+1,Math.floor(z/T.CS))))continue;
  if(T.get(x,G,z)!==W||T.get(x,G-3,z)!==W)continue;ex=x;ez=z;eb=bedAt(x,z);break;}
if(ex===null)console.log('edge: no sea found');else{
  const ty=eb-3,x1=(Math.floor(ex/T.CS)+1)*T.CS-1,nb=T.ckey(Math.floor(ex/T.CS)+1,Math.floor(ez/T.CS));
  for(let y=eb;y>=ty;y--)dig(ex,y,ez);for(let x=ex+1;x<=x1;x++)dig(x,ty,ez);
  for(let i=0;i<80&&!(T.wfJobs.some(J=>J.park.length));i++)step(0.25);
  console.log('edge: tunnel',count(ex,x1,ty,ty,ez,ez),'of',x1-ex+1,'| waiting at the edge',T.wfJobs.reduce((n,J)=>n+J.park.length/3,0),'| next chunk still unmade',!T.chunks.has(nb));
  T.get(x1+1,ty,ez);for(let x=x1+1;x<=x1+4;x++)dig(x,ty,ez);step(3);
  console.log('edge: once made, the tunnel on in it',count(x1+1,x1+4,ty,ty,ez,ez),'of 4 | still waiting',T.wfJobs.reduce((n,J)=>n+J.park.length/3,0));}
T.wfJobs.length=0;T.wfSeen.clear();
console.log('jobs left',T.wfJobs.length,'queued',T.wfRemoved.length/3,'seen',T.wfSeen.size);
process.exit(0);
