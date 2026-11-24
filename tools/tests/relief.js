// relief: the land's height in the wilds (world/relief.js) as genChunk builds it, at fixed places in seed 1's world (SPOTS=
// to use others, x,z;x,z): roads and railways under mountains keep their headroom (tunnels), what's covered and how high, any
// block left hanging over air that isn't a tunnel's roof, a tree or a building's, lakes' water never above G (but a tarn's), and the
// mountains' tallest and snow. Every 'low headroom' and 'hanging' count should be 0 (the road at -46800,-44400 has a sign
// gantry over it, there before the mountains)
// worlddet: the world is the same every time it's worked out from a seed. For a few fixed seeds (each in a process of its
// own, so the game loads afresh with that seed) it prints a hash of each of a spread of chunks as genChunk makes them,
// made twice; then checks the landscape noise (world/noise.js, world/climate.js) gives identical values on repeated calls,
// stays in its range, and uses arithmetic only (no Math.sin, cos, tanh, exp, pow or random, which may differ between
// browsers in the last bit). The chunk hashes must only change when world generation is meant to (with SAVE_KEY bumped).
// Usage: node worlddet.js [seeds, default 1,2,3]
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs'),cp=require('child_process');
const WS=process.env.WSEED||'1';
let src0=fs.readFileSync(process.env.GJS||'g.js','utf8');
const NAMES=['PLAINS_OPEN','plainsH','RLF','WATER','STONE','DIRT','GRASS','SNOW','GRAVEL','SAND','MUD','LEAVES','PINE','routeAt','railNear','BLOCK','AIR','CONCRETE','STONE','LAMP','plainsH','reliefNat','RLF','ruggedAt','routeAt','G','landTop','rlfSnow','rlfRock','clBlend','railDist','riverAt','genChunk','seed','CS','H','CELL','nzNoise','nzFbm','nzRidged','nzWarp','nzSmooth','nzClamp01','climateAt','biomeAt','realmOf','WORLD_CFG','worldCfgSent','saveObj','seaV','settlementAt','BIOMES','biomeOfPlot','bioPick','climAt','PLAINS_OPEN','plainsTree','TREE_K'];
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
const G=T.G,CS=T.CS,H=T.H;
const spots=(process.env.SPOTS||'-49500,-57300;-48000,-45900;-47100,-43500;-46800,-44400;-46200,-42000;-17600,24000;-25200,-42400;1200,-1600').split(';').map(s=>s.split(',').map(Number));
const NAT=new Set([T.STONE,T.DIRT,T.GRASS,T.SNOW,T.GRAVEL,T.SAND,T.MUD]);
for(const [X,Z] of spots){const cx0=Math.floor(X/CS),cz0=Math.floor(Z/CS);let road=0,bad=0,roof=0,maxOver=0,rail=0,badR=0,ex=null,hang=0,hx=null,wetHi=0,water=0,top=0,snow=0;
  for(let ci=-3;ci<=3;ci++)for(let cj=-3;cj<=3;cj++){const cx=cx0+ci,cz=cz0+cj,a=T.genChunk(cx,cz),at=(lx,y,lz)=>a[lx+lz*CS+y*CS*CS];
    for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const x=cx*CS+lx,z=cz*CS+lz;
      let tp=H-1;while(tp>G&&!at(lx,tp,lz))tp--;if(tp-G>top)top=tp-G;
      T.plainsH(x,z);const tarn=T.RLF.wl>-99;   // (a tarn's water is meant to be up in the mountains, world/relief.js)
      for(let y=G+1;y<H;y++){const b=at(lx,y,lz);if(b===T.WATER){water++;if(!tarn)wetHi++;}}
      // (hanging: the land's own blocks over air, out on the open plains, away from a railway's tunnel (its roof is bare rock))
      if(T.PLAINS_OPEN(Math.floor(x/32),Math.floor(z/32)))for(let y=G+2;y<tp;y++){const b=at(lx,y,lz);if(NAT.has(b)&&at(lx,y-1,lz)===0&&T.railNear(x,z)>5){
        let lt=false;for(let yy=y;yy<=tp;yy++)if(at(lx,yy,lz)===T.LEAVES||at(lx,yy,lz)===T.PINE)lt=true;if(!lt){hang++;if(!hx)hx=[x,y-G,z,b];}}}
      const R=T.routeAt(x,z,12),onR=R&&R.d<3.5,onL=T.railNear(x,z)<1.5;if(!onR&&!onL)continue;
      if(onR)road++;else rail++;
      let y=G+1;while(y<H&&!at(lx,y,lz))y++;const clear=y-G-1;
      if(tp>G+9){roof++;maxOver=Math.max(maxOver,tp-G);}
      if(clear<6&&tp>G+1&&!(R&&R.R&&R.R.kind==='moto')){if(onR)bad++;else badR++;if(!ex)ex=[x,z,clear,tp-G,at(lx,G+1+clear,lz)];}}}
  console.log(`spot ${X},${Z}: tallest ${top}; road ${road} rail ${rail} covered ${roof} (highest ${maxOver}); low headroom road ${bad} rail ${badR}`+(ex?' e.g. '+ex.join(','):'')+`; hanging ${hang}`+(hx?' e.g. '+hx.join(','):'')+`; water above G ${wetHi}`);}
