let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,activeFix,activeProps,downFix,falling,knockAt,knockRay,fireRound,foeBoom,pvpArea,doBite,shot,fireball,refreshFixtures,get G(){return G}};\n})();');
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

const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;run(3);
const G=T.G;
const reset=()=>{T.falling.clear();T.downFix.clear();};
const lamps=()=>T.activeFix.filter(f=>f.type==='lamp');
// a lamp near Gus, Gus put 2.4 blocks off it facing it
function setup(){reset();T.refreshFixtures();const L=lamps().sort((a,b)=>Math.hypot(a.x-A.pos.x,a.z-A.pos.z)-Math.hypot(b.x-A.pos.x,b.z-A.pos.z))[0];return L;}
const down=f=>T.falling.has(f.key)||T.downFix.has(f.key);
const res=[];const chk=(name,f,fn)=>{reset();fn(f);res.push(name.padEnd(28)+(down(f)?'down':'STANDING')+'   (knocked '+(T.falling.size+T.downFix.size)+')');};
let L=setup();if(!L){console.log('no lamp found');process.exit(0);}
console.log('lamps near',lamps().length,'props near',T.activeProps.length);
chk('knockAt',L,f=>T.knockAt(f.x,G+1,f.z,1));
chk('knockAt on a roof',L,f=>T.knockAt(f.x,G+20,f.z,1));
chk('pvpArea (stomp, club...)',L,f=>T.pvpArea(A,f.x+0.5,f.z,1.2,3,'x',G+1));
chk('foeBoom (grenade, shell)',L,f=>T.foeBoom(f.x+2,G+1.5,f.z,3,2,'x',null,0));
chk('bullet',L,f=>{const r=T.fireRound({x:f.x-3,y:G+2,z:f.z+0.1,at:{x:f.x+20,y:G+2,z:f.z+0.1},gobs:true,dmg:1,cause:'x',by:A});res.push('  bullet ended '+r.hit+' at '+(r.x-f.x).toFixed(2));});
chk('bullet missing it',L,f=>T.fireRound({x:f.x-3,y:G+2,z:f.z+3,at:{x:f.x+20,y:G+2,z:f.z+3},gobs:true,dmg:1,cause:'x',by:A}));
chk('rocket',L,f=>{T.shot({kind:'rocket',x:f.x-3,y:G+2.5,z:f.z,vx:30,vy:0,vz:0,grav:0,R:1.5,dmg:2,cause:'x',fuse:3});run(1);});
chk('fireball',L,f=>{T.fireball(f.x-3,G+2,f.z,f.x+30,G+2,f.z,{pl:A});run(1.5);});
chk('bite',L,f=>{const hx=0,hz=1;A.pos.set(f.x,G+1,f.z-2.4);A.vy=0;A.heading=0;A.state='normal';T.doBite(A);});
chk('wall-high bullet over it',L,f=>T.fireRound({x:f.x-3,y:G+12,z:f.z,at:{x:f.x+20,y:G+12,z:f.z},gobs:true,dmg:1,cause:'x',by:A}));
const P=T.activeProps.find(p=>Math.hypot(p.x-A.pos.x,p.z-A.pos.z)<34);
if(P){chk('prop: bullet',P,f=>T.fireRound({x:f.x-1.5,y:f.y0+0.7,z:f.z,at:{x:f.x+6,y:f.y0+0.7,z:f.z},gobs:true,dmg:1,cause:'x',by:A}));
  chk('prop: pvpArea',P,f=>T.pvpArea(A,f.x,f.z,1,3,'x',f.y0));
  chk('prop: foeBoom',P,f=>T.foeBoom(f.x+1,f.y0+0.5,f.z,2.5,2,'x',null,0));}
else res.push('no prop near');
console.log(res.join('\n'));
