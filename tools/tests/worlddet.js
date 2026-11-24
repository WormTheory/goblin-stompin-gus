// worlddet: the world is the same every time it's worked out from a seed. For a few fixed seeds (each in a process of its
// own, so the game loads afresh with that seed) it prints a hash of each of a spread of chunks as genChunk makes them,
// made twice; then checks the landscape noise (world/noise.js, world/climate.js) gives identical values on repeated calls,
// stays in its range, and uses arithmetic only (no Math.sin, cos, tanh, exp, pow or random, which may differ between
// browsers in the last bit). The chunk hashes must only change when world generation is meant to (with SAVE_KEY bumped).
// Usage: node worlddet.js [seeds, default 1,2,3]
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs'),cp=require('child_process');
const WS=process.env.WSEED;
if(WS===undefined){
  const seeds=(process.argv[2]||'1,2,3').split(',').map(Number);
  for(const s of seeds)process.stdout.write(cp.execFileSync(process.execPath,[__filename],{env:Object.assign({},process.env,{WSEED:String(s)}),encoding:'utf8'}));
  process.exit(0);
}
let src0=fs.readFileSync('g.js','utf8');
const NAMES=['genChunk','seed','CS','H','CELL','nzNoise','nzFbm','nzRidged','nzWarp','nzSmooth','nzClamp01','climateAt','biomeAt','realmOf','WORLD_CFG','worldCfgSent','saveObj','seaV','settlementAt','BIOMES','biomeOfPlot','bioPick','climAt','PLAINS_OPEN','plainsTree','TREE_K','reliefNat','ruggedAt','plainsH','reliefMask','rlfDist','rlfLines16','railDist','rlfTop','RLF','rlfSnow','rlfRock','landTop'];
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={};'+NAMES.map(n=>`try{if(typeof ${n}!=='undefined')window.__t.${n}=${n};}catch(e){}`).join('')+'\n})();');
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
// (a fresh world with this seed, as the World Generator hands one over)
global.localStorage={getItem:k=>String(k).startsWith('goblin-city-v')?JSON.stringify({seed:+WS,edits:{},coll:{},down:[],dest:{},test:[]}):null,setItem(){},removeItem(){}};
global.requestAnimationFrame=()=>{};
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>[]},configurable:true});
eval(src);const T=window.__t;
const fnv=(h,b)=>Math.imul(h^b,16777619)>>>0;
const hashArr=a=>{let h=2166136261;for(let i=0;i<a.length;i++)h=fnv(h,a[i]);return h.toString(16).padStart(8,'0');};
const F64=new Float64Array(1),U8=new Uint8Array(F64.buffer);
const hashNums=L=>{let h=2166136261;for(const v of L){F64[0]=v;for(let i=0;i<8;i++)h=fnv(h,U8[i]);}return h.toString(16).padStart(8,'0');};
console.log('== seed '+T.seed+(T.seed===+WS?'':' (WANTED '+WS+')'));
// chunks: the start, a spread round it, and some far out (towns, plains, the sea, whatever falls there)
const CH=[[0,0],[1,0],[0,-1],[3,-2],[-5,7],[12,12],[-20,9],[40,-33],[-77,61],[150,150],[-300,-220],[700,-512]];
let same=0;
for(const [cx,cz] of CH){const a=T.genChunk(cx,cz),b=T.genChunk(cx,cz),h=hashArr(a),ok=hashArr(b)===h;if(ok)same++;
  // (and a hash of each column's top block's height, so a change shows whether it's the ground or what stands on it)
  const tops=[];for(let lz=0;lz<T.CS;lz++)for(let lx=0;lx<T.CS;lx++){let y=T.H-1;while(y>0&&!a[lx+lz*T.CS+y*T.CS*T.CS])y--;tops.push(y);}
  console.log(`chunk ${cx},${cz}: blocks ${h} tops ${hashNums(tops)} realm ${T.realmOf(Math.floor(cx*T.CS/T.CELL),Math.floor(cz*T.CS/T.CELL))}${ok?'':' DIFFERENT THE SECOND TIME'}`);}
console.log(`chunks made the same twice: ${same}/${CH.length}`);
// the noise: a spread of points, worked out twice
const P=[];let r=12345;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647;};
for(let i=0;i<3000;i++)P.push([(rnd()-0.5)*2e6,(rnd()-0.5)*2e6]);
const fns={
  nzNoise:([x,z])=>T.nzNoise(x/37.3,z/37.3,7),
  nzFbm:([x,z])=>T.nzFbm(x,z,500,5,11),
  nzRidged:([x,z])=>T.nzRidged(x,z,800,4,13),
  nzWarpX:([x,z])=>T.nzWarp(x,z,600,200,17)[0]-x,
  climT:([x,z])=>T.climateAt(x,z).t,
  climM:([x,z])=>T.climateAt(x,z).m,
  rugged:([x,z])=>T.ruggedAt(x,z),
  relief:([x,z])=>T.reliefNat(x,z)};
for(const k in fns){const A=P.map(fns[k]),B=P.map(fns[k]);let mn=1e9,mx=-1e9,s=0,diff=0,bad=0;
  for(let i=0;i<A.length;i++){if(!Object.is(A[i],B[i]))diff++;if(!isFinite(A[i]))bad++;mn=Math.min(mn,A[i]);mx=Math.max(mx,A[i]);s+=A[i];}
  console.log(`${k}: range ${mn.toFixed(3)}..${mx.toFixed(3)} mean ${(s/A.length).toFixed(3)} hash ${hashNums(A)} repeat diff ${diff} not finite ${bad}`);}
{let a=0,b=0;for(let i=0;i<2000;i++){const x=i*0.37,z=i*-0.53,v=T.nzNoise(x,z,3);if(Math.abs(v)>1.0001)a++;if(T.nzNoise(Math.floor(x),Math.floor(z),3)!==0)b++;}
  console.log(`nzNoise out of -1..1: ${a}, not 0 on lattice points: ${b}`);}
{const t=[0,0.5,1].map(v=>T.nzSmooth(0,1,v)).join(','),c=[-1,0.3,2].map(T.nzClamp01).join(',');console.log(`nzSmooth 0,.5,1 -> ${t}; nzClamp01 -1,.3,2 -> ${c}`);}
// arithmetic only
const srcOf=['nzNoise','nzFbm','nzRidged','nzWarp','nzSmooth','climateAt','climAt','bioPick','biomeAt'].map(n=>String(T[n])).join('\n')+String(src0.match(/function nzGrad[^\n]*/)||'');
const banned=srcOf.match(/Math\.(sin|cos|tan|tanh|exp|log|pow|random|sqrt|atan2?|hypot|cbrt)\b/g);
console.log('noise uses only arithmetic: '+(banned?'NO ('+[...new Set(banned)].join(' ')+')':'yes'));
// (the relief and its mask: arithmetic and square roots, which every browser rounds the same)
{const rs=['ruggedAt','reliefNat','rlfTop','reliefMask','rlfDist','rlfLines16','railDist','plainsH','landTop'].map(n=>String(T[n])).join('\n'),b=rs.match(/Math\.(sin|cos|tan|tanh|exp|log|pow|random|atan2?|hypot|cbrt)\b/g);
  console.log('relief uses only arithmetic and sqrt: '+(b?'NO ('+[...new Set(b)].join(' ')+')':'yes'));}
// the stubs and settings
console.log(`biomeAt(0,0) ${T.biomeAt(0,0)}; biomeOf gone: ${!/\bbiomeOf\b/.test(src0)}; WORLD_CFG ${JSON.stringify(T.WORLD_CFG)}; cfg in a default save: ${JSON.stringify(T.saveObj().cfg)}`);
// the biomes: their shares of the land over a square 60,000 blocks a side (a plot sampled every 500 blocks), the start's
// (always grassland within START_R0), and a chunk of open plains in each one found: its hash, what lies on top, its trees
{const N=120,cnt=new Array(T.BIOMES.length).fill(0),first={};let land=0,startBad=0;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i-N/2)*500,z=(j-N/2)*500,px=Math.floor(x/T.CELL),pz=Math.floor(z/T.CELL);
    if(T.realmOf(px,pz)==='sea')continue;land++;const b=T.biomeOfPlot(px,pz);cnt[b]++;
    if(first[b]===undefined&&T.realmOf(px,pz)==='plains'&&T.PLAINS_OPEN(px,pz))first[b]=[px,pz];}
  for(let k=0;k<400;k++){const x=((k%20)-10)*280,z=(Math.floor(k/20)-10)*280;if(T.biomeAt(x,z)!==0)startBad++;}
  console.log('biome shares of the land: '+T.BIOMES.map((B,i)=>B.k+' '+(100*cnt[i]/land).toFixed(1)+'%').join(', '));
  console.log('start not grassland: '+startBad+'/400');
  // (the land's height, world/relief.js: how high the open plains stand, in bands, the highest, and round the start)
  {const band={},bk=h=>h<-0.9?'lake':h<2?'0-1':h<10?'2-9':h<30?'10-29':h<60?'30-59':h<100?'60-99':'100+';let n=0,mx=-1,snow=0,st=0;
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i-N/2)*500,z=(j-N/2)*500,px=Math.floor(x/T.CELL),pz=Math.floor(z/T.CELL);
      if(T.realmOf(px,pz)!=='plains'||!T.PLAINS_OPEN(px,pz))continue;n++;const h=T.reliefNat(x,z);band[bk(h)]=(band[bk(h)]||0)+1;if(h>mx)mx=h;}
    for(let k=0;k<400;k++){const x=((k%20)-10)*140,z=(Math.floor(k/20)-10)*140;st=Math.max(st,T.reliefNat(x,z)-T.RLF.hill);}
    console.log('open plains by height (natural): '+Object.keys(band).sort().map(k=>k+' '+(100*band[k]/n).toFixed(1)+'%').join(', ')+'; highest '+mx.toFixed(1));
    console.log('mountains within 1400 of the start: '+st.toFixed(2));}
  for(const b in first){const [px,pz]=first[b],cx=Math.floor(px*T.CELL/T.CS),cz=Math.floor(pz*T.CELL/T.CS),a=T.genChunk(cx,cz),top={};let tr=0;
    for(let lz=0;lz<T.CS;lz++)for(let lx=0;lx<T.CS;lx++){let y=T.H-1;while(y>0&&!a[lx+lz*T.CS+y*T.CS*T.CS])y--;const v=a[lx+lz*T.CS+y*T.CS*T.CS];top[v]=(top[v]||0)+1;}
    for(let z=cz*T.CS;z<cz*T.CS+T.CS;z++)for(let x=cx*T.CS;x<cx*T.CS+T.CS;x++){const t=T.plainsTree(x,z);if(t)tr++;}
    console.log(`  ${T.BIOMES[b].k} at chunk ${cx},${cz}: blocks ${hashArr(a)} tops by block ${JSON.stringify(top)} trees ${tr}`);}}
