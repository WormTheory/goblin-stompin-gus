let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__ev=s=>eval(s);window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,ABIL,AB,DT,setGob,mHeld,freeFoe,foeSpawn,PICKUPS,SHOTS,FOES,damageGoblin,gobDrop,foeArm,GOB_FOES,WEAPONS};\n})();');
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
eval(src);const T=window.__t,E=window.__ev;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// Landmines set off by players and by anything that hits them, and the debug menu's Infinite ammo on Gnash's grenades,
// landmines and magazines (enemies/mines.js, player/gob-weapons.js). Each line says what happened; the expected answer
// is in brackets.
const STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
const floor=()=>{for(let x=X0-24;x<=X0+40;x++)for(let z=Z0-30;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(!T.get(x,y,z))T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};floor();
const home=(yaw=0)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;A.relT=0;A.biteT=0;A.biteCD=0;A.grenCD=0;A.dead=false;};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const clear=()=>{for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}E('minesClear()');floor();};
const lay=(dx,dz,armed=true,o={})=>{const M=E('mineLay')(X0+.5+dx,F,Z0+.5+dz,Object.assign({side:'p',cause:'test',k:'landmine'},o));if(armed){M.t=99;M.armed=true;}return M;};
const arm=()=>{A.wpns=E('GOB_WPN_ORDER').slice();A.mines=6;A.gren=3;A.ammo={};A.relT=0;};
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
T.setGob(true);home();S(5);arm();
// ---- Infinite ammo ----
for(const inf of [false,true]){T.DT.infAmmo=inf;home();arm();clear();
  A.wpn='landmine';E('gobPlant')(A);const m=A.mines;
  E('gobThrow')(A);const g=A.gren;S(5);A.grenCD=0;A.gren=0;const n0=T.SHOTS.filter(Q=>Q.live&&Q.kind==='grenade').length;E('gobThrow')(A);const n1=T.SHOTS.filter(Q=>Q.live&&Q.kind==='grenade').length;
  A.wpn='rifle';const r0=E('gobAmmo')(A,'rifle');E('gobShoot')(A);const r1=E('gobAmmo')(A,'rifle');
  console.log('Infinite ammo',inf?'on: ':'off:','mines 6 ->',m,inf?'[6]':'[5]','| grenades 3 ->',g,inf?'[3]':'[2]','| thrown with none left',n1>n0,inf?'[true]':'[false]','| rifle',r0,'->',r1,inf?'[same]':'[one less]');
  S(200);clear();}
T.DT.infAmmo=false;
// ---- stepping on them ----
// (whoever planted it: safe on it till stepping off once, then it goes off under him)
{home();arm();clear();A.wpn='landmine';E('gobPlant')(A);const M=E('MINES').find(m=>m.live);A.pos.set(M.x,F,M.z);S(150);const stood=M.live;
 A.pos.set(M.x+3,F,M.z);S(5);A.pos.set(M.x,F,M.z);A.hp=20;S(3);console.log('Gnash on his own fresh mine: still there after 2.5 s',stood,'[true] | back on it after stepping off: gone off',!M.live,'[true], hurt',A.hp<20,'[true]');}
// (a player who didn't plant it: Gus and Gertie on a player's mine and on an enemy's; Gnash on another's)
T.setGob(false);
for(const who of [0,1])for(const side of ['p','g']){home();clear();A.who=who;const M=lay(0,0,true,{side});S(3);console.log((who?'Gertie':'Gus')+' steps on '+(side==='p'?'a player\'s':'an enemy\'s')+' mine: gone off',!M.live,'[true]');}
A.who=0;
{home();clear();const M=lay(0,4,true);S(3);console.log('Gus 4 away from one: gone off',!M.live,'[false]');}
T.setGob(true);
{home();clear();const M=lay(0,0,true,{owner:{active:false}});S(3);console.log('Gnash steps on another player\'s mine: gone off',!M.live,'[true]');}
// ---- hitting them ----
// (shot: Gnash's rifle aimed at one in the ground 8 ahead, still arming; one 3 to the side of where he aims)
{home();arm();clear();A.wpn='rifle';const M=lay(0,-8,false);const c=E('shipEye')(A);A.cam.pitch=Math.atan2(M.y+0.1-c.y,Math.hypot(M.x-c.x,M.z-c.z));E('gobShoot')(A);
 console.log('rifle round at a mine 8 ahead (still arming): gone off',!M.live,'[true]');}
{home();arm();clear();A.wpn='rifle';const M=lay(3,-8,true);const c=E('shipEye')(A);A.cam.pitch=Math.atan2(M.y+0.1-c.y,8);E('gobShoot')(A);
 console.log('rifle round 3 to one side of a mine: gone off',!M.live,'[false]');}
// (a mounted gun's round, as a helicopter's from above)
{home();clear();const M=lay(0,-10,true);E('fireRound')({x:M.x,y:M.y+12,z:M.z+6,at:{x:M.x,y:M.y,z:M.z},by:A,dmg:2,cause:'test',gobs:true,vehs:true,breaks:true});
 console.log('a vehicle gun\'s round at one: gone off',!M.live,'[true]');}
// (an enemy's round aimed at a player passes one by)
{home();clear();const M=lay(0,-4,true);E('fireRound')({x:M.x,y:M.y+0.1,z:M.z-6,at:{x:A.pos.x,y:A.pos.y+1,z:A.pos.z},tgt:A,hit:1,pdmg:0,cause:'test',id:null});
 console.log('an enemy\'s round at Gnash over one: gone off',!M.live,'[false]');}
// (melee: Gnash's club, dagger, large club; Gus's bite; any player attack's area)
for(const w of ['club','dagger','bigclub']){home();arm();clear();A.wpn=w;S(3);const M=lay(0,-1.2,false);A.biteCD=0;press(3);S(40);console.log('Gnash swings his',w,'at one 1.2 ahead: gone off',!M.live,'[true]');}
T.setGob(false);
{home();clear();S(3);const M=lay(0,-2.2,false);A.biteCD=0;press(3);S(40);console.log('Gus bites one 2.2 ahead: gone off',!M.live,'[true]');}
{home();clear();S(3);const M=lay(0,-12,false);E('pvpArea')(A,M.x,M.z+0.5,2,3,'test',F);console.log('any player attack (pvpArea) reaching one, PvP off: gone off',!M.live,'[true]');}
T.setGob(true);
// (blasts: one beside a mine sets it off, and the two beside that in a chain; one well away stays)
{home();clear();const M1=lay(0,-10,true),M2=lay(2.5,-10,true),M3=lay(5,-10,true),M4=lay(14,-10,true);E('foeBoom')(M1.x-1,F,M1.z,3,5,'test',null,0,30);
 console.log('a blast beside a mine: it, and the chain of two beside it, gone off',!M1.live,!M2.live,!M3.live,'[true true true] | one 13 off still there',M4.live,'[true]');}
{home();arm();clear();A.wpn='club';A.cam.pitch=0.25;A.gren=1;E('gobThrow')(A);const G=T.SHOTS.find(Q=>Q.live&&Q.kind==='grenade');let M=null,t=0;
 while(G.live&&t<400){S(1);t++;if(!M&&Math.hypot(G.v.x,G.v.y,G.v.z)<0.5)M=lay(G.pos.x-X0-.5+1.5,G.pos.z-Z0-.5,false);}
 console.log('a grenade come to rest 1.5 from one: gone off',!!M&&!M.live,'[true]');}
// (a player's fireball bursting on it)
{home();arm();clear();const M=lay(0,-6,true);const W=T.WEAPONS.spellbook;E('fireball')(A.pos.x,F+1,A.pos.z-1,M.x,M.y,M.z,{W,pl:A,by:null,cause:'test'});S(60);console.log('a fireball at one: gone off',!M.live,'[true]');}
// ---- vehicles on them: a tank's, a helicopter's (landed and well up) and a Mobile Gear's box over one ----
{const tryBox=b=>{clear();const M=lay(30,0,true);const B=Object.assign({x:M.x,z:M.z,tx:0,tz:1,y0:F,top:F+2.5,hx:1.6,hz:2.6,proxy:{alive:true}},b);E('TRAIN_BOXES').push(B);E('updateMines')(0.02);E('TRAIN_BOXES').pop();return !M.live;};
 console.log('a tank over one',tryBox({}),'[true] | a helicopter landed',tryBox({y0:F+0.2,top:F+3}),'[true] | 10 up',tryBox({y0:F+10,top:F+12}),'[false] | a Mobile Gear',tryBox({y0:F,top:F+8,hx:1.4,hz:1.4}),'[true]');}
console.log('done');
