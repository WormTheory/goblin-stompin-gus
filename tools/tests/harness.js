// The way to write a new suite: no header to copy, and no list of the game's names to keep.
//   const {T,E,run,step,els,pads,errs}=require('./harness.js')();      // boots the game (SEED from the environment, or 1)
//   T.placeAt(0,0); T.players[0].pos.x; T.seed=5;                     // any name inside the game, read, called or set
//   E('cars.filter(c=>c.alive).length')                               // or any piece of code, run inside the game
//   run(2)  -> two seconds of frames;  step(n) -> n frames;  errs -> what the game reported with console.error
//   for(const f of els.play.L.click)f();                              // press a button: its listeners are in els[id].L
// boot({seed, before(src) -> src}) takes a seed, and may change the script before it runs.
// It works through the game's own way in for tools (window.GSG_TEST -> window.__gsg, end of core/testing-env.js), so
// the script runs exactly as built. The older suites splice `window.__t={...}` over its last line instead; they still
// work, and tools/run_tests.sh runs both kinds. End a suite with a line that says whether it passed, and
// process.exit(1) if it didn't: run_tests.sh fails on that.
const fs=require('fs'),path=require('path');
module.exports=function boot(o={}){
  let s=+(o.seed||process.env.SEED||1);Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
  let src=fs.readFileSync(path.join(__dirname,'g.js'),'utf8');if(o.before)src=o.before(src);
  const {THREE}=require('./stub-three.js');
  const H={errs:[]};const ce=console.error;console.error=(...a)=>{H.errs.push(a.map(String).join(' '));if(o.loud)ce(...a);};
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
  const pads=[mk(0),mk(1)];H.pads=pads;H.els=els;H.listeners=listeners;
  Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
  global.GSG_TEST=true;
  (0,eval)(src);
  const E=global.__gsg;if(!E)throw new Error('harness: the game did not give window.__gsg (see the end of core/testing-env.js)');
  // (T.name reads a name inside the game as it is now, T.name=v sets it)
  H.E=E;H.T=new Proxy({},{get:(_,k)=>typeof k==='string'?E(k):undefined,set:(_,k,v)=>{E('(v)=>{'+k+'=v}')(v);return true;},has:(_,k)=>{try{E(k);return true;}catch(e){return false;}}});
  let now=1000;H.step=n=>{for(let i=0;i<n;i++){now+=16.7;E('frame')(now);}};H.run=sec=>H.step(Math.round(sec*60));
  return H;
};
