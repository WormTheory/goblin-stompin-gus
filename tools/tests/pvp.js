let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,frame,setRaw,get,DT,setChar,setChar2,charName,setPvp,pvpOn,doBite,stompImpact,fallImpact,gobAttack,gobArms,gobShoot,gunRound,foeBoom,pvpBy,lockTargets,lockAlive,obitList,setGobP,AB,get score(){return score}};\n})();');
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
console.error=()=>{};
eval(src);const T=window.__t;let now=1000;
const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
// PvP (Options, player/pvp.js): two players face to face on a stone floor, one attacking the other with each kind of
// attack, with the switch off (no harm, as before) and on (each lands, cut down to player size), then a kill credited
// in the obituary, the lock-on list, and Gus and Gertie (and Gnash and Grizzle) doing exactly the same to each other.
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
S(30);
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z);
const floor=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){for(let y=F-4;y<F;y++)if(T.get(x,y,z)!==STONE)T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};
// A at the middle facing +z (heading 0), B gap blocks in front of it facing back
const home=(gap=2.2)=>{floor();for(const [p,dz,h] of [[A,0,0],[B,gap,Math.PI]]){p.pos.set(X0+.5,F,Z0+.5+dz);p.vy=0;p.state='walk';p.t=0;p.heading=h;p.cam.yaw=h+Math.PI;p.cam.pitch=0;p.hp=20;p.mvx=p.mvz=0;p.stam=100;p.exhausted=false;
  p.deadT=0;p.hbRuns=[];p.crashT=0;p.lockT=null;p.dodge=null;p.drv=null;p.pvpT=null;p.grounded=true;p.knockT=0;p.root.visible=true;}S(1);
  for(const p of [A,B]){p.pos.y=F;}};
const f=(v,n=1)=>v.toFixed(n);
// one attack by A at B: B's health lost
const hit=(name,fn,gap)=>{home(gap);const h0=B.hp;fn();S(20);return h0-B.hp;};   // (and a moment after: some attacks' hitboxes play out over frames)
const ATTACKS=[
  ['bite',()=>{A.biteStep=0;T.doBite(A);}],
  ['uppercut',()=>{A.biteStep=2;T.doBite(A);}],
  ['stomp',()=>T.stompImpact(A,0)],
  ['full stomp',()=>T.stompImpact(A,2)],
  ['ground pound',()=>T.fallImpact(A,10,true,0)],
  ['crash landing',()=>T.fallImpact(A,16,false,0)],
  ['heli gun round',()=>{T.gunRound({},A,A.pos.x,A.pos.y+1.5,A.pos.z,2,0,'Gunned down from a helicopter','test',{x:B.pos.x,y:B.pos.y+1.2,z:B.pos.z});}],
  ['tank shell blast',()=>T.foeBoom(B.pos.x,B.pos.y+0.5,B.pos.z+1,4.5,4,'Blown up by a goblin in a tank',T.pvpBy(A),0,60)],
];
const GOB_ATTACKS=[
  ['club',()=>{T.gobArms(A).wpn='club';T.gobAttack(A);S(30);},1.3],
  ['dagger',()=>{const k=T.gobArms(A);k.wpns=['club','dagger','handgun','rifle'];k.wpn='dagger';T.gobAttack(A);},1.2],
  ['rifle',()=>{const k=T.gobArms(A);k.wpns=['club','dagger','handgun','rifle'];k.wpn='rifle';A.camera.position.set(A.pos.x,A.pos.y+1.2,A.pos.z);A.cam.yaw=Math.PI;A.cam.pitch=0;T.gobShoot(A);},6],
];
const table=(label,list)=>{
  for(const on of [false,true]){T.setPvp(on);
    console.log(label,'PvP',on?'on ':'off',list.map(([n,fn,g])=>n+' '+f(hit(n,fn,g))).join(' | '));}};
console.log('switch starts',T.pvpOn()?'on':'off');
table('Gus at Gertie  ',ATTACKS);
T.setChar('gertie');T.setChar2('gus');table('Gertie at Gus  ',ATTACKS);
T.setChar('goblin');T.setChar2('gus');table('Gnash at Gus   ',GOB_ATTACKS);
T.setChar('gus');T.setChar2('goblin');table('Gus at Gnash   ',ATTACKS);
// a kill, and who the obituary blames; the killer's points
T.setChar('gus');T.setChar2('gertie');T.setPvp(true);
{home();B.hp=2;const s0=T.score;A.biteStep=2;T.doBite(A);const o=T.obitList()[0];
 console.log('kill: Gertie',B.state,'| obituary:',o&&o.name,'-',o&&o.cause,'by',o&&o.killer,'| points',T.score-s0);
 S(60*7);console.log('6s later Gertie',B.state,'hp',B.hp);}
// own blast doesn't blame yourself
{home();A.hp=2;T.foeBoom(A.pos.x,A.pos.y+0.5,A.pos.z,4,4,'Blown up by a goblin in a tank',T.pvpBy(A),0,60);const o=T.obitList()[0];console.log('own shell: Gus',A.state,'| obituary by "'+(o&&o.killer)+'"');S(60*7);}
// lock-on: the other player only with PvP on
for(const on of [false,true]){T.setPvp(on);home(6);console.log('lock-on PvP',on?'on ':'off','B in Gus\'s targets:',T.lockTargets(A,24).some(o=>o.t===B),' still locked:',T.lockAlive(B));}
// a guest's switch is the host's: here (not online) it's just the setting
T.setPvp(false);console.log('switched off:',T.pvpOn());
process.exit(0);
