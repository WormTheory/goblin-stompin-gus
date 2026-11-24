let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={farJobNear,farJobMid,farJobFar,farStage:()=>farStage(),plotInfo,collapses:()=>collapses,get destroyed(){return destroyed},get craters(){return craters},G,CELL,bldgSolid,BB,players,frame,superOf,realmOf,seaPlot};\n})();');
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

const [A,B]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
const S2=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
const G=T.G,CELL=T.CELL;
// a tall building away from spawn
let BD=null;for(let r=6;r<40&&!BD;r++)for(let px=-r;px<=r&&!BD;px++)for(const pz of[-r,r]){if(T.seaPlot(px,pz)||T.superOf(px,pz))continue;const P=T.plotInfo(px,pz);P.b.forEach((b,i)=>{if(!BD&&b.top>G+20&&!b.farSkip&&b.x1-b.x0>=4&&b.z1-b.z0>=4)BD={b,px,pz,i,key:px+','+pz+','+i};});}
const {b,px,pz,key}=BD,X0=px*CELL,Z0=pz*CELL,cx=X0+(b.x0+b.x1)/2,cz=Z0+(b.z0+b.z1)/2;
console.log('building',key,'top',b.top-G);
function runJ(job,ra,rb){const S=T.farStage(),SG=T.farStage();const g=job(S,SG,[{pos:{x:cx+ra+60,z:cz}}],0,rb);let n=0;while(!g.next().done&&n++<1e7);
  let hi=-1,cnt=0;for(let i=0;i<S.n;i++){const m=S.mat,o=i*16,x=m[o+12],z=m[o+14];if(Math.abs(x-cx)<(b.x1-b.x0)/2&&Math.abs(z-cz)<(b.z1-b.z0)/2){cnt++;hi=Math.max(hi,m[o+13]+m[o+5]/2);}}
  return cnt?(hi-G-1).toFixed(1):'none';}
const all=tag=>console.log(tag.padEnd(22),'near',runJ(T.farJobNear,0,700),'mid',runJ(T.farJobMid,0,700),'far',runJ(T.farJobFar,0,1400));
all('intact');
T.collapses()[key]=G+8;all('collapsed to G+8');delete T.collapses()[key];
T.collapses()[key]=G+2;all('collapsed to G+2');delete T.collapses()[key];
const N=T.bldgSolid(b,px,pz,key);T.destroyed[key]=Math.round(N/2);all('half knocked out');delete T.destroyed[key];
T.craters.push({x:cx,y:G+1,z:cz,R:160,s:7,n:1});all('crater on it');
T.craters[0].x=cx+130;T.craters[0]._k=undefined;all('crater ring 130 off');
T.craters.length=0;all('crater gone');
process.exit(0);
