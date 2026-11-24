let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={plotInfo,plotBounds,superOf,plotType,placeAt,CELL,PL0,PL1,frame,bldgSolid,blockAt,bldgAt,colTop,G,H,rawGet,bldgThresh,chunks,STRUCTv:0};\n})();');
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
// Can each building really be knocked down far enough to count as destroyed? For every building near the middle, its blocks
// as the world actually built them (rawGet), that also count towards it when knocked out (the same test as noteBlock: the
// building found there by bldgAt, and the block it should be), against its total (bldgSolid). Short by more than its
// threshold (bldgThresh), it can never count as destroyed, however much of it is knocked out.
// Usage: node solidaudit.js [radius in plots, default 12] [kind to list, e.g. armory]
const R=+(process.argv[2]||12),want=process.argv[3]||'',by=new Map();let n=0,never=0;const ex=[];
for(let px=-R;px<=R;px++)for(let pz=-R;pz<=R;pz++){const S=T.superOf(px,pz);if(S&&(S.ax!==px||S.az!==pz))continue;const P=T.plotInfo(px,pz);if(!P||!P.b)continue;
  P.b.forEach((b,i)=>{const key=px+','+pz+','+i,N=T.bldgSolid(b,px,pz,key);let got=0;
    for(let rx=b.x0;rx<b.x1;rx++)for(let rz=b.z0;rz<b.z1;rz++){const x=px*T.CELL+rx,z=pz*T.CELL+rz,B=T.bldgAt(x,z);if(!B||B.key!==key)continue;const t=T.colTop(b,rx,rz);
      for(let y=T.G+1;y<=t&&y<T.H;y++){const v=T.rawGet(x,y,z);if(v!==0&&T.blockAt(b,rx,rz,y,px,pz)===v)got++;}}
    const k=(P.type||'?')+'/'+(b.style||b.kind),need=1-T.bldgThresh(b),ok=got>=N*need+1;n++;
    const e=by.get(k)||{n:0,never:0,worst:1};e.n++;e.worst=Math.min(e.worst,got/N);if(!ok){e.never++;never++;if(ex.length<30)ex.push(k+' '+key+' built '+got+' of '+N+' ('+(100*got/N).toFixed(1)+'%), needs '+(100*need).toFixed(1)+'%');}by.set(k,e);
    if(want&&k.includes(want))console.log(k,key,'built',got,'of',N);
    for(const c of [...T.chunks.keys()])if(T.chunks.size>3000)T.chunks.delete(c);});}
console.log('buildings',n,'that can never count as destroyed',never);
for(const l of ex)console.log('  '+l);
for(const [k,e] of [...by].sort((a,b)=>a[1].worst-b[1].worst).slice(0,15))console.log(' ',k,'x'+e.n,'never',e.never,'least built',(100*e.worst).toFixed(1)+'%');
