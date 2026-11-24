let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={scene,get nBS(){return nBS},set tenvSpot(f){tenvSpot=f},tenvSpot:(w,h)=>tenvSpot(w,h),tenvVeh,VEH,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
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
const LS={};global.localStorage={getItem:k=>k in LS?LS[k]:(/goblin-city-v/.test(k)?JSON.stringify({seed:12345,edits:{},coll:{},down:[],dest:{},test:[],tenv:{boxes:[]}}):null),setItem(k,v){LS[k]=String(v)},removeItem(k){delete LS[k]}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};


// relocation check: MODE=home builds the structure where the plan has it, MODE=move in front of Gus; either way Gus
// is put down south of it and the world around it run a few seconds, then everything in and round the box is listed
// relative to the box's corner, for comparing
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(1);
const key=process.env.KIND||'hospital',mode=process.env.MODE||'move';
if(mode==="home")T.tenvSpot=(w,h,F)=>({ax:F.ax,az:F.az});
let home=null;
T.tenvSpawn(key);let n=0;
if(mode==='home'){ // (intercept the spot: the source itself)
  while(T.TS.search&&n<5000){const S=T.TS.search;T.tenvTick();n++;}
}else while(T.TS.search&&n<5000){T.tenvTick();n++;}
const B=T.TENV.boxes[T.TENV.boxes.length-1];
if(!B){console.log(JSON.stringify({err:'none',msg:els.tpInfo.textContent}));process.exit(0);}
const X0=B.ax*32,Z0=B.az*32,W=B.w*32,Hh=B.h*32;
const gus0={x:P.pos.x-X0,z:P.pos.z-Z0};
T.tenvGo(B);run(Number(process.env.SECS||4));
const r=v=>Math.round(v*4)/4;
const out={box:B,gus0,gus:[r(P.pos.x-X0),r(P.pos.y),r(P.pos.z-Z0)]};
// blocks: per column a hash, in and a ring round the box
const cols={};let nb=0;
for(let x=-8;x<W+8;x++)for(let z=-8;z<Hh+8;z++){let h=0;for(let y=40;y<140;y++){const b=T.get(X0+x,y,Z0+z);if(b){nb++;h=(h*31+b*7+y)%1000000007;}}if(h)cols[x+','+z]=h;}
out.nb=nb;out.cols=cols;
// meshes in the scene, by where they are
const ms=[];const walk=(o,px,py,pz)=>{const x=px+o.position.x,y=py+o.position.y,z=pz+o.position.z;
  if(o.isMesh&&o.visible!==false&&x>X0-40&&x<X0+W+40&&z>Z0-40&&z<Z0+Hh+40)ms.push([r(x-X0),r(y),r(z-Z0)].join(','));
  for(const c of o.children||[])walk(c,x,y,z);};
for(const c of T.scene.children)walk(c,0,0,0);
out.meshes=ms.sort();
const xz=L=>L.filter(o=>o&&typeof o.x==='number').map(o=>[r(o.x-X0),r(o.z-Z0)].join(',')).sort();
out.fix=xz(T.activeFix.map(f=>f.it||f.o||f));out.props=xz(T.activeProps.map(f=>f.it||f.o||f));
out.doors=T.doorsOn.size;out.signs=T.nBS;out.venues=[...T.venues.keys()].length;out.lm=T.lmOn.size;
out.gob=T.goblins.filter(g=>g.state!=='wait'&&Math.abs(g.pos.x-X0-W/2)<W&&Math.abs(g.pos.z-Z0-Hh/2)<Hh).map(g=>[r(g.pos.x-X0),r(g.pos.z-Z0),g.staff?'s':g.civ?'c':'h'].join(',')).sort();
out.errs=errs;
console.log(JSON.stringify(out));
process.exit(0);
