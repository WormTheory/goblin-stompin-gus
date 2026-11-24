// Two players in Mobile Gears, split screen: each pilots their own, both on their own controllers, and the two can't
// walk or boost through each other. node mechcoop.js
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,setGobP,venues,tenvSpawnOne,tenvClear,drvFind,drvEnter,MG,mHeld,setChar,setChar2,charName,bodyOf,bindHint,freeFoe,foeSpawn,PICKUPS,damageGoblin,charTint};\n})();');
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
const errs=[];console.error=(...a)=>errs.push(a.join(" ").slice(0,200));
eval(src);const T=window.__t;let now=1000;
const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
const sec=s=>S(Math.round(s*60));
const pad=(i,ax,btn)=>{const P=pads[i];P.axes=ax.slice();P.buttons.forEach((b,k)=>{b.pressed=btn.includes(k);b.value=b.pressed?1:0;});};
const none=()=>{pad(0,[0,0,0,0],[]);pad(1,[0,0,0,0],[]);};
const f=(v,n=1)=>v.toFixed(n);
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;T.DT.invuln=true;T.DT.host=1;   // (Passive: nobody comes after anyone, but goblins can still be hurt, as Pacifist would stop)
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
S(30);T.setGobP(A,true);T.setGobP(B,true);S(10);
// (a flat stone floor, open above, 80 along x)
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z);
for(let x=X0-50;x<=X0+50;x++)for(let z=Z0-16;z<=Z0+16;z++){for(let y=F-3;y<F;y++)T.setRaw(x,y,z,STONE);for(let y=F;y<F+30;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
A.pos.set(X0+.5,F,Z0+.5);A.cam.yaw=Math.PI;S(20);
// (two Mobile Gears from the debug menu, one put 40 to the west and one 40 to the east, each player beside their own)
console.log('spawn:',T.tenvSpawnOne('mech').split('.')[0]);S(20);console.log('spawn:',T.tenvSpawnOne('mech').split('.')[0]);S(20);
const V=T.venues.get('tenvMechs'),[M1,M2]=V.mechs;
const place=(M,x,p)=>{M.x=x;M.z=Z0+.5;M.y=F;M.vx=M.vz=M.vy=0;M.h=0;p.pos.set(x-(T.MG.r+0.8),F+0.2,Z0+.5);p.vy=0;p.state='walk';};
place(M1,X0-20,A);place(M2,X0+20,B);S(10);
const DA=T.drvFind(A),DB=T.drvFind(B);if(DA)T.drvEnter(A,DA);if(DB)T.drvEnter(B,DB);S(20);
console.log('two goblins, two Mobile Gears: player one in',A.drv&&A.drv.k,' player two in',B.drv&&B.drv.k,' each their own',!!(A.drv&&B.drv&&A.drv.o!==B.drv.o),
  ' each display shown',!!(A.ui.drvHud&&!A.ui.drvHud.el.hidden),!!(B.ui.drvHud&&!B.ui.drvHud.el.hidden),' each own energy bar',!!(A.ui.drvHud.mg&&B.ui.drvHud.mg&&A.ui.drvHud.mg.el!==B.ui.drvHud.mg.el));
const Ma=A.drv.o,Mb=B.drv.o;
// (facing each other: player one looks east, player two west; both push forward on their own sticks)
A.cam.yaw=-Math.PI/2;B.cam.yaw=Math.PI/2;A.cam.pitch=B.cam.pitch=-0.1;
const gap=()=>Math.max(Math.abs(Ma.x-Mb.x),Math.abs(Ma.z-Mb.z));let least=1e9;
const watch=s=>{for(let i=0;i<Math.round(s*60);i++){S(1);least=Math.min(least,gap());}};
pad(0,[0,-1,0,0],[]);pad(1,[0,-1,0,0],[]);watch(6);none();
console.log('walking at each other: closest',f(least,2),'(each is',f(T.MG.r*2,1),'wide)  overlapped',least<T.MG.r*2-0.05,'  player one went',f(Ma.x-(X0-20)),' player two',f((X0+20)-Mb.x));
// (back apart, then player one quick-boosts into player two standing still)
Ma.x=X0-20;Mb.x=X0+20;Ma.vx=Mb.vx=0;sec(0.5);least=1e9;Ma.en=Mb.en=T.MG.enMax;
pad(0,[0,-1,0,0],[2]);watch(0.1);pad(0,[0,-1,0,0],[]);watch(0.5);pad(0,[0,-1,0,0],[2]);watch(0.1);pad(0,[0,-1,0,0],[]);watch(1.5);none();
console.log('quick boosting into the other: closest',f(least,2),' overlapped',least<T.MG.r*2-0.05,'  the other moved',f(Math.abs(Mb.x-(X0+20)),2));
// (each player's controls only move their own: player two alone pushes left)
{const a0=Ma.x,b0=Mb.z;pad(1,[-1,0,0,0],[]);sec(1.5);none();console.log('player two strafes: theirs moved',f(Math.abs(Mb.z-b0)),' player one\'s',f(Math.abs(Ma.x-a0),2));}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
