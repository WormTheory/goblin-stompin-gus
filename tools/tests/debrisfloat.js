let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync(process.env.G||'g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={plotInfo,superOf,CELL,frame,bldgAt,colTop,G,H,get,setRaw,addEdit,collapseBuilding,chunks,ckey,CS,get edits(){return edits},get collapses(){return collapses},editsPacked,editsUnpack,chunkEdits};\n})();');
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
eval(src);const T=window.__t;
// Debris that came down on a building's roof, then the building itself collapsing: when its chunks are made again
// (leaving and coming back, or loading the save), is the debris still hanging where the roof was?
// Usage: node debrisfloat.js
for(let i=0;i<30;i++)T.frame(1000+i*33);
let tried=0,floating=0;
for(let px=-6;px<=6&&tried<8;px++)for(let pz=-6;pz<=6&&tried<8;pz++){const S=T.superOf(px,pz);if(S)continue;const P=T.plotInfo(px,pz);if(!P||!P.b)continue;
  P.b.forEach((b,i)=>{if(tried>=8||b.top<T.G+8||b.x1-b.x0<6)return;
    const rx=(b.x0+b.x1)>>1,rz=(b.z0+b.z1)>>1,x=px*T.CELL+rx,z=pz*T.CELL+rz,B=T.bldgAt(x,z);if(!B||B.key!==px+','+pz+','+i)return;
    let y=T.H-1;while(y>T.G&&T.get(x,y,z)===0)y--;if(y<=T.G+4)return;y++;
    // (a block of rubble landed on the roof, as a falling piece leaves it)
    T.setRaw(x,y,z,1);T.addEdit(x,y,z,1);
    T.collapseBuilding(B,T.G+2,null);
    for(let f=0;f<200;f++)T.frame(2000+tried*20000+f*33);
    const now=T.get(x,y,z);
    // (the chunks made again from the plan and the saved edits, as after leaving the area or loading the save)
    const s=JSON.stringify(T.editsPacked());for(const k of [...T.edits&&Object.keys(T.edits)])delete T.edits[k];T.chunkEdits.clear();T.editsUnpack(JSON.parse(s));
    for(const k of [...T.chunks.keys()])T.chunks.delete(k);T.get(99999,50,99999);T.chunks.clear();   // (and past the last chunk looked at, kept to hand)
    const again=T.get(x,y,z),under=T.get(x,y-1,z);tried++;
    const bad=again!==0&&under===0;if(bad)floating++;
    console.log((bad?'BAD ':'    ')+B.key+' roof block at y '+y+': live '+(now?'there':'gone')+', made again '+(again?'there':'gone')+', under it '+(under?'solid':'air'));});}
console.log('buildings tried',tried,'debris left floating',floating);
// The same for real: every building in a crowded block of plots brought down in turn, pushed toward its neighbours, so
// that falling pieces land on roofs and those buildings come down after. Then every saved block that isn't air, made
// again: is there anything under it?
{let n=0,t=500000;const near=+(process.argv[2]||2);
 for(let px=-near;px<=near;px++)for(let pz=-near;pz<=near;pz++){const S=T.superOf(px,pz);if(S)continue;const P=T.plotInfo(px,pz);if(!P||!P.b)continue;
   P.b.forEach((b,i)=>{if(b.top<T.G+6)return;const x=px*T.CELL+((b.x0+b.x1)>>1),z=pz*T.CELL+((b.z0+b.z1)>>1),B=T.bldgAt(x,z);if(!B||B.key!==px+','+pz+','+i||T.collapses[B.key]!==undefined)return;
     const a=Math.random()*Math.PI*2;T.collapseBuilding(B,T.G+2+Math.floor(Math.random()*4),{x:Math.cos(a),z:Math.sin(a)});n++;
     for(let f=0;f<240;f++)T.frame(t+=33);});}
 for(let f=0;f<600;f++)T.frame(t+=33);
 const s=JSON.stringify(T.editsPacked());for(const k of Object.keys(T.edits))delete T.edits[k];T.chunkEdits.clear();T.editsUnpack(JSON.parse(s));
 T.chunks.clear();T.get(99999,50,99999);T.chunks.clear();
 let solid=0,hang=0;const ex=[];
 for(const k in T.edits){if(!T.edits[k])continue;const [x,y,z]=k.split(',').map(Number);if(y<=T.G+1)continue;solid++;
   if(T.get(x,y,z)&&!T.get(x,y-1,z)&&!T.get(x+1,y,z)&&!T.get(x-1,y,z)&&!T.get(x,y,z+1)&&!T.get(x,y,z-1)&&!T.get(x,y+1,z)){hang++;if(ex.length<5)ex.push(k);}}
 console.log('buildings brought down',n,'saved blocks',solid,'made again with nothing touching them',hang,ex.join(' '));}
process.exit(0);   // (the game's own timers would only go on to trip over the fake page)
