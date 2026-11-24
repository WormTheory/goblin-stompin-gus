let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,ABIL,DT,setGob,mHeld,freeFoe,foeSpawn,SHOTS,FOES,foeThrow,shot,GREN_CRUSH,get edits(){return edits},BEDROCK};\n})();');
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
// grenades break blocks (enemies/shots.js, GREN_CRUSH): Gnash's thrown at a wall, a prepper's at his feet, one at the
// bottom of the world (bedrock stays); Gus and Gertie throw none
const STONE=3,F=70;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z);
const pad=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){for(let y=F-4;y<F;y++)T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};
const count=(x0,x1,y0,y1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(T.get(x,y,z))n++;return n;};
const home=()=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=Math.PI;A.cam.pitch=0;A.heading=0;A.hp=20;A.mvx=A.mvz=0;};
const press=(n,k='Mouse2')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
let at='';const boomWait=()=>{let Q=T.SHOTS.find(Q=>Q.live);for(let i=0;i<300&&T.SHOTS.some(Q=>Q.live);i++){if(Q)at=(Q.pos.x-X0-.5).toFixed(1)+','+(Q.pos.y-F).toFixed(1)+','+(Q.pos.z-Z0-.5).toFixed(1);S(1);}S(10);};
console.log('GREN_CRUSH',T.GREN_CRUSH);
for(const who of ['Gus','Gertie','Gnash']){
  T.setGob(who==='Gnash');A.who=who==='Gertie'?1:0;pad();home();S(5);if(A.gob){A.gren=5;A.wpns=['club','grenade'];A.wpn='grenade';A.biteCD=0;}   // (Gnash: grenades in hand, thrown with the attack)
  // a stone wall 5 ahead (ahead is +z), 7 wide and 5 high
  for(let x=-3;x<=3;x++)for(let y=0;y<5;y++)T.setRaw(X0+x,F+y,Z0+5,STONE);
  const w0=count(X0-3,X0+3,F,F+4,Z0+5,Z0+5),fl0=count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8),e0=Object.keys(T.edits).length;
  A.cam.pitch=0.05;press(3,A.gob?'Mouse0':'Mouse2');S(A.gob?20:0);boomWait();
  const w1=count(X0-3,X0+3,F,F+4,Z0+5,Z0+5),fl1=count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8);
  console.log(who.padEnd(6),'throws at a wall 5 ahead: wall',w0,'->',w1,' floor near it',fl0,'->',fl1,' edits saved',Object.keys(T.edits).length-e0,' hp',A.hp,A.gob?' went off at '+at+' from him':'');
}
// one lying a step from a wall (so at its foot) when it goes off: a hole in the wall, Gus or Gnash alike
{pad();home();S(5);for(let x=-3;x<=3;x++)for(let y=0;y<5;y++)T.setRaw(X0+x,F+y,Z0+5,STONE);const w0=count(X0-3,X0+3,F,F+4,Z0+5,Z0+5);
 T.shot({kind:'grenade',x:X0+.5,y:F+.15,z:Z0+4,vx:0,vy:0,vz:0,grav:20,fuse:0.05,R:3.3,dmg:3,cause:'test',bounce:true,crush:T.GREN_CRUSH});boomWait();
 console.log('one lying at the foot of the wall: wall',w0,'->',count(X0-3,X0+3,F,F+4,Z0+5,Z0+5));}
// a prepper's grenade lobbed at his feet: a crater in the floor
{T.setGob(false);pad();home();S(5);const g=T.freeFoe('prepper',8);T.foeSpawn(g,'prepper',null,0);g.pos.set(A.pos.x,F,A.pos.z+8);g.heading=Math.PI;g.gunCD=g.bombCD=1e9;
 const fl0=count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8);T.foeThrow(g,A,T.FOES.prepper.bomb);A.pos.set(X0+.5,F,Z0-20.5);boomWait();
 console.log('prepper grenade at his feet: floor',fl0,'->',count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8));g.state='wait';g.root.visible=false;}
// one going off at the bottom of the world: bedrock stays
{let n0=0;for(let x=X0-3;x<=X0+3;x++)for(let z=Z0-3;z<=Z0+3;z++)if(T.get(x,0,z)===T.BEDROCK)n0++;
 for(let x=X0-3;x<=X0+3;x++)for(let z=Z0-3;z<=Z0+3;z++)for(let y=1;y<4;y++)T.setRaw(x,y,z,0);
 T.shot({kind:'grenade',x:X0+.5,y:1.2,z:Z0+.5,vx:0,vy:0,vz:0,grav:20,fuse:0.05,R:3.3,dmg:3,cause:'test',bounce:true,crush:T.GREN_CRUSH});boomWait();
 let n1=0;for(let x=X0-3;x<=X0+3;x++)for(let z=Z0-3;z<=Z0+3;z++)if(T.get(x,0,z)===T.BEDROCK)n1++;console.log('at the bottom of the world: bedrock',n0,'->',n1);}
process.exit(0);
