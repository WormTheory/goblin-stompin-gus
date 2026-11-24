let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,frame,DT,RAMP,rampReset,renderRampage,collapseBuilding,setBuildings,settlementAt,setDestroyed,setListC,rampRazeTick,flushNotes,smashAll:k=>{destroyed[k]=1e9;destroyVer++;},CELL,G,bldgStanding,get BLAME(){return BLAME},set BLAME(v){BLAME=v}};\n})();');
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
console.error=()=>{};   // (the stub can't draw lightning, and says so in the weather's own stack trace)
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;

// This rampage's buildings demolished and settlements razed (ui/rampage.js)
let S0=null;for(let r=0;r<40&&!S0;r++)for(let i=-r;i<=r&&!S0;i++)for(let j=-r;j<=r&&!S0;j++){const s=T.settlementAt(Math.floor(A.pos.x/T.CELL)+i,Math.floor(A.pos.z/T.CELL)+j);if(s)S0=s;}
// (the smallest place about)
const seenS=new Set();let best=null;for(let i=-40;i<=40;i++)for(let j=-40;j<=40;j++){const s=T.settlementAt(Math.floor(A.pos.x/T.CELL)+i,Math.floor(A.pos.z/T.CELL)+j);if(s&&!seenS.has(s)){seenS.add(s);const n=T.setBuildings(s).length;if(n&&(!best||n<best.n))best={s,n};}}
const P=best.s,L=T.setBuildings(P);console.log('place with',L.length,'buildings');
let v=null;for(let i=0;i<500&&v===null;i++)v=T.setDestroyed(P);console.log('wrecked at first',v);
T.rampReset();T.rampRazeTick(P);
T.collapseBuilding(L[0],T.G+1);T.collapseBuilding(L[0],T.G+1);console.log('one building brought down twice: demolished',T.RAMP.nB);
T.BLAME='acc';T.collapseBuilding(L[1%L.length],T.G+1);T.BLAME=null;console.log('another by accident: demolished',T.RAMP.nB);
T.rampRazeTick(P);console.log('razed so far',T.RAMP.nR);
for(const E of L)T.collapseBuilding(E,T.G+1);T.flushNotes(1e9);
const t0=Date.now();while(Date.now()-t0<400){}
for(const E of L)if(T.bldgStanding(E.b,E.px,E.pz,E.key))T.smashAll(E.key);   // (the landmarks don't fall: smashed to bits instead)
{const t1=Date.now();while(Date.now()-t1<300){}}v=T.setDestroyed(P);T.rampRazeTick(P);console.log('all down: wrecked',v,' demolished',T.RAMP.nB,' razed',T.RAMP.nR);T.rampRazeTick(P);console.log('again: razed',T.RAMP.nR);
T.renderRampage();console.log('card:',['rpKills','rpCars','rpBldgs','rpRazed'].map(k=>document.getElementById(k).textContent).join(' / '));
T.rampReset();T.rampRazeTick(P);console.log('a new rampage, already in ruins: razed',T.RAMP.nR);
// the info pane (debug menu, Overlays): off to begin with, then the weather, the moon and where you are, in words
{const el=document.getElementById('infoPane');S(20);console.log('info pane at first: hidden',el.hidden);T.DT.info=true;S(30);console.log('switched on: hidden',el.hidden,' says',(el.innerHTML||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
 console.log('status card:',(document.getElementById('clockTxt').innerHTML||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());}
process.exit(0);
