let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,seedFromText,freshWorld,get seed(){return seed},SAVE_KEY,seedLine};\n})();');
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
// (a real store, so what New world writes can be read back; LS_FAIL makes saving fail, for the reset-in-place path)
const LS=new Map();let LS_FAIL=false;
global.localStorage={getItem:k=>LS.has(k)?LS.get(k):null,setItem(k,v){if(LS_FAIL)throw new Error('full');LS.set(k,String(v))},removeItem:k=>LS.delete(k),key:i=>[...LS.keys()][i]??null,get length(){return LS.size}};
global.requestAnimationFrame=()=>{};let reloads=0;global.location={reload(){reloads++;},search:'',href:'http://x/',protocol:'file:'};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
for(const f of els.play.L.click)f();pads.length=0;run(1);

// ---- the seed's text, the same in the game and the World Generator ----
const wg=fs.readFileSync('../../game/WorldGen/index.html','utf8'),m=/const toSeed=(v=>\{[\s\S]*?\};)\n/.exec(wg);
const toSeed=m?eval('('+m[1].replace(/;$/,'')+')'):null;
const cases=['','   ','12345','-77','0007','9007199254740993','Goblin Town','goblin town','  Goblin Town  ','🦛 hippo','1e5','3.5','a'];
let same=0;
for(const c of cases){const a=T.seedFromText(c),b=toSeed?toSeed(c):'none';if(a===b)same++;
  console.log(JSON.stringify(c).padEnd(22),'game',String(a).padStart(10),' worldgen',String(b).padStart(10),a===b?'same':'DIFFERENT');}
console.log('same in both',same+'/'+cases.length);
const ok=v=>v===null||(Number.isSafeInteger(v));
console.log('text twice gives the same seed',T.seedFromText('Goblin Town')===T.seedFromText('Goblin Town'),' all whole numbers',cases.every(c=>ok(T.seedFromText(c))));

// ---- New world, as the menu does it ----
const conf=els.confirm,inp=els.nwSeed,yes=els.confirmYes,nw=els.newWorld;
const make=(txt,open=true)=>{LS.clear();for(const f of nw.L.click)f();inp.value=txt;conf.hidden=!open;const r0=reloads;for(const f of yes.L.click)f();
  const o=JSON.parse(LS.get(T.SAVE_KEY)||'null');return {seed:o&&o.seed,reload:reloads>r0};};
for(const [txt,open] of [['',true],['12345',true],['Goblin Town',true],['  Goblin Town',true],['12345',false]]){
  const r=make(txt,open);console.log('new world',JSON.stringify(txt).padEnd(16),open?'panel open  ':'panel hidden','saved seed',String(r.seed).padStart(10),'reloads',r.reload,
    'expected',open&&T.seedFromText(txt)!==null?(r.seed===T.seedFromText(txt)?'yes':'NO'):(Number.isInteger(r.seed)&&r.seed!==12345?'random':'NO'));}
nw.L.click.forEach(f=>f());console.log('field emptied on opening again',JSON.stringify(inp.value));
// (keys typed into it stay there: they're stopped before the game or the menu sees them)
let stopped=0,enter=0;const ev=k=>({key:k,code:k,stopPropagation(){stopped++},preventDefault(){}});
for(const f of inp.L.keydown)f(ev('KeyW'));for(const f of inp.L.keydown)f(ev('Space'));
console.log('keys kept from the game',stopped+'/2');
// ---- saving fails: the world's reset in place, with that seed, and the seed line says it ----
LS_FAIL=true;for(const f of nw.L.click)f();inp.value='Goblin Town';conf.hidden=false;for(const f of yes.L.click)f();LS_FAIL=false;
els.seedNote.textContent='';T.seedLine();
console.log('reset in place: seed',T.seed,T.seed===T.seedFromText('Goblin Town')?'as typed':'WRONG','· seed line has it',/seed \d+/.test(String(els.seedNote.textContent))||'(stub)');
