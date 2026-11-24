let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,goblins,damageGoblin,hitGoblins,spawnGoblin,V3,frame,DT,HOST_N,HOST_MAX,pacifistNow,passiveNow,calmNow,dbgStep,dbgVal,todHour,setTodHour,hourNow,get tod(){return tod},set tod(v){tod=v},get dayN(){return dayN},get seed(){return seed},set seed(v){seed=v},toggleMark,markOf,loadMarks,saveMarks,mapOwner,mapClick,MAPV,MARK_KEY,set menuBy(v){menuBy=v},netClock,netClockSet,syncHost};\n})();');
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
const LS=new Map([['goblin-stompin-gus-hostility','1']]);global.localStorage={getItem:k=>LS.has(k)?LS.get(k):null,setItem:(k,v)=>LS.set(k,String(v)),removeItem:k=>LS.delete(k)};   // (an old saved hostility: Peaceful, as it was numbered)
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};

const [A,B]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
const ok=v=>v?'ok':'WRONG';
// ---- enemy hostility: the old saved steps move up one; Pacifist below Passive
console.log('old saved Peaceful (1) reads as',T.HOST_N[T.DT.host],ok(T.HOST_N[T.DT.host]==='Peaceful'),'| steps',T.HOST_N.join(' < '));
T.DT.host=3;T.dbgStep('host',1);console.log('right at Normal stays',T.HOST_N[T.DT.host],ok(T.DT.host===3));
for(let i=0;i<5;i++)T.dbgStep('host',-1);console.log('left x5 ends at',T.HOST_N[T.DT.host],ok(T.DT.host===0),'pacifist',T.pacifistNow(),'passive',T.passiveNow(),'calm',T.calmNow());
const live=()=>T.goblins.filter(g=>g.state==='chase');
S(240);let g=live()[0];if(!g){const w=T.goblins.find(o=>o.state==='wait'&&!o.special);if(w&&T.spawnGoblin(w))g=w;}
if(g){const hp=g.hp;T.damageGoblin(g,99,new T.V3(g.pos.x,g.pos.y+1,g.pos.z),new T.V3(1,0,0));T.hitGoblins(g.pos.x,g.pos.z,6,99,'test');S(5);
  console.log('Pacifist: a 99 hit and a blast on a goblin, hp',hp,'->',g.hp,'state',g.state,ok(g.hp===hp&&g.state==='chase'));
  T.DT.host=1;T.damageGoblin(g,1,new T.V3(g.pos.x,g.pos.y+1,g.pos.z),null);console.log('Passive: the same goblin hit for 1, hp',hp,'->',g.hp,ok(g.hp===hp-1));}
else console.log('no goblin about to test on');
// (online: an older host's three steps still read right, and this one's four go across)
T.DT.host=0;const nc=T.netClock();console.log('sent to guests: host',nc.host,'hostV',nc.hostV,ok(nc.host===0&&nc.hostV===0));
T.netClockSet(Object.assign({},nc,{hostV:undefined,host:2}));console.log('older host sends 2 (its Normal): reads',T.HOST_N[T.DT.host],ok(T.DT.host===3));
T.DT.host=3;
// ---- time of day
for(const h of [0,6,12,18,23]){T.setTodHour(h);console.log('set',String(h).padStart(2,'0')+':00','-> clock hour',T.todHour(),'tod',T.tod.toFixed(4),'label',T.dbgVal('tod'),ok(T.todHour()===h));}
T.setTodHour(23);T.dbgStep('tod',1);console.log('23:00 stepped right:',T.dbgVal('tod'),ok(T.todHour()===0));T.dbgStep('tod',-1);console.log('and back left:',T.dbgVal('tod'),ok(T.todHour()===23));
const d0=T.dayN;T.setTodHour(12);S(60);console.log('time still runs on from noon, a second later',T.hourNow().toFixed(3),ok(T.hourNow()>=12),'same day',ok(T.dayN===d0));
// ---- map markers, one each
T.menuBy=A;T.toggleMark(A,100,200,false);T.toggleMark(B,-50,-60,false);
console.log('marks: P1',JSON.stringify(T.markOf(A)),'P2',JSON.stringify(T.markOf(B)),ok(T.markOf(A).x===100&&T.markOf(B).z===-60));
console.log('saved',LS.get(T.MARK_KEY));
A.mark=null;B.mark=null;T.loadMarks();console.log('loaded back',JSON.stringify(T.markOf(A)),JSON.stringify(T.markOf(B)),ok(T.markOf(A)&&T.markOf(A).z===200&&T.markOf(B).x===-50));
T.toggleMark(A,100,200,true);console.log('pointing at it again takes it away:',T.markOf(A),ok(T.markOf(A)===null),'P2 keeps theirs',ok(!!T.markOf(B)));
const s0=T.seed;T.seed=s0+1;console.log('another world: no marks',ok(!T.markOf(A)&&!T.markOf(B)));T.seed=s0;console.log('back to this one: P2 has theirs again',ok(!!T.markOf(B)));
const ba=B.active;B.active=true;T.menuBy=B;console.log('in co-op, P2s menu sets',T.mapOwner()===B?'P2s marker':'P1s marker',ok(T.mapOwner()===B));B.active=ba;T.menuBy=null;console.log('alone, the menu sets',T.mapOwner()===A?'P1s marker':'?',ok(T.mapOwner()===A));
process.exit(0);
