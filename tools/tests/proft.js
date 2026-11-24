let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,DT,PROF,players,crush,foeBoom,collapseBuilding,chunks,meshes,genChunk,safe,get PROF_ON(){return PROF_ON},profCounts,get playing(){return playing}};\n})();');
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
const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
for(const f of els.play.L.click)f();
const P=T.players[0];
S(120);
console.log('off: PROF_ON',T.PROF_ON,'labels',T.PROF.lab.size,'frames kept',T.PROF.fill);
// switched on as the debug menu does
T.DT.prof=true;S(90);
console.log('on: PROF_ON',T.PROF_ON,'frames kept',T.PROF.fill,'pane shown',!!els.profPane&&!els.profPane.hidden);
const lab=[...T.PROF.avg.keys()].sort();
console.log('labels timed',lab.length,['goblins','cars','render','chunks'].every(k=>lab.includes(k))?'(goblins, cars, chunks, render among them)':'MISSING core labels: '+lab.join(','));
// a slow frame with events: a blast and a crater by the player, and a pretend stall
T.foeBoom(P.pos.x+6,P.pos.y,P.pos.z,3,1,'test');T.crush(P.pos.x+8,P.pos.y,P.pos.z,5);
T.safe('stall',()=>{const t=Date.now();while(Date.now()-t<5);});
now+=120;T.frame(now);S(2);
const sp=T.PROF.spikes[0];
console.log('spikes',T.PROF.spikes.length,sp?'first '+Math.round(sp.iv)+' ms, events '+sp.ev.map(e=>e[0]).join(',')+', stall named '+sp.top.some(e=>e[0]==='stall'):'none');
// own time only: a frame's systems add up to its CPU time
{const i=(T.PROF.i-1+T.PROF.N)%T.PROF.N;let s=0;for(let c=0;c<8;c++)s+=T.PROF.cat[i*8+c];console.log('systems vs cpu',Math.abs(s-T.PROF.cpu[i])<0.5?'match':'differ '+s.toFixed(2)+' '+T.PROF.cpu[i].toFixed(2));}
console.log('counts',T.profCounts().split(' · ').length,'items');
T.DT.prof=false;S(3);
console.log('off again: PROF_ON',T.PROF_ON,'pane hidden',els.profPane.hidden);
