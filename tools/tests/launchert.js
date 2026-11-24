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
// The rocket launcher: fired straight, locked on a car by holding its sight on it, a locked rocket homing in on the car
// fired well off to one side, the sight ignoring goblins, an enemy's rocket chasing a player in a vehicle. node launchert.js
// (header from weapons2.js) The weapons added after the first ones (enemies/weapons.js): the Katana, Large Club, Shotgun, Assault Rifle, Sniper
// Rifle, Bazooka and Landmines, and reloading. Gnash first: each gun's magazine run down, reloaded by itself and by the
// button, switching away stopping a reload; each new weapon on a thief; landmines planted, armed, set off by an enemy and
// not by him; drops and the loadout; his first-person view through a reload. Then enemies carrying each one (none do in
// the game yet: a made-up kind for each, as guards makes them): bursts, reloads, rockets, pellets, a planted mine, the
// heavy blows; and every Dev tab animation each would get.
const STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
// (the floor, put back after each blast: a crater left by the rocket launcher or a mine would swallow the next drop)
const floor=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-30;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(!T.get(x,y,z))T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};floor();
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;A.relT=0;A.biteT=0;A.biteCD=0;};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const tap=(k,n=3)=>{T.keys.add(k);S(n);T.keys.delete(k);S(2);};
const f=(v,n=2)=>v.toFixed(n);
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
const foe=(k,d,hp,dx=0)=>{const g=T.freeFoe(k,8);T.foeSpawn(g,k,null,0);g.pos.set(A.pos.x+dx,F,A.pos.z+d);g.heading=Math.PI;g.gunCD=g.bombCD=g.mineCD=1e9;g.stun=0;g.kv.set(0,0,0);if(hp)g.hp=hp;return g;};
const freeze=()=>{for(const g of T.goblins)if(g.state==='chase'){g.gunCD=g.bombCD=g.mineCD=1e9;g.kv.set(0,0,0);g.stun=9;}};
const killAll=()=>{for(const g of T.goblins)if(g.state==='chase'||g.state==='dead'){g.state='wait';g.root.visible=false;}for(const P of T.PICKUPS){P.live=false;P.m.visible=false;}for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}E('minesClear()');floor();};
const W=T.WEAPONS,NEW=['bigclub','katana','shotgun','arifle','sniper','launcher','landmine'],GUNS=Object.keys(W).filter(k=>W[k].kind==='gun');
const ammo=k=>E('gobAmmo')(A,k);
const arm=()=>{A.wpns=E('GOB_WPN_ORDER').slice();A.mines=6;A.gren=0;A.ammo={};A.relT=0;};
T.setGob(true);home();S(5);arm();
const car=(dx,dz)=>{const c=T.cars.find(c=>!c.parkPool)||T.cars[0];c.alive=true;c.respawnT=1e9;c.hp=c.hpMax=30;c.speed=0;c.parked=false;c.pos.set(X0+.5+dx,F,Z0+.5+dz);c.heading=0;return c;};
const fly=(c,n)=>{let hit=false;for(let i=0;i<n;i++){S(1);if(!c.alive||c.hp<30){hit=true;break;}}return hit;};
const park=c=>{c.alive=false;c.pos.set(X0+500,F,Z0+500);};
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}
// fired straight at a car dead ahead, no lock
{home();arm();A.wpn='launcher';S(20);const c=car(0,26);press(2);console.log('straight at a car 26 ahead: hit',fly(c,120),' lock',!!A.lockT);park(c);killAll();}
// fired straight 25 degrees away from a car: a miss
{home();arm();A.wpn='launcher';S(20);const c=car(11,24);press(2);console.log('straight, 25 degrees off a car: hit',fly(c,120));park(c);killAll();}
// the sight held on a car a little off the crosshair: how long till it locks; then turned away and fired: it homes in
{home();arm();A.wpn='launcher';S(20);const c=car(2,26);T.mHeld.add('Mouse2');let t=0;while(!A.lockT&&t<300){S(1);t++;}const lk=A.lockT===c,seen=A.lockMark&&A.lockMark.visible;T.mHeld.delete('Mouse2');S(10);
 console.log('sight on a car 26 off: locked',lk,'after',f(t/60),'s; marker shown',!!seen);
 A.cam.yaw=Math.PI+0.45;S(2);press(2);console.log('  turned 25 degrees away and fired: hit',fly(c,150));park(c);killAll();E('setLock')(A,null);}
// a car out of the cone: never locks
{home();arm();A.wpn='launcher';S(20);const c=car(11,24);T.mHeld.add('Mouse2');S(150);T.mHeld.delete('Mouse2');console.log('sight held 24 degrees off a car: locked',!!A.lockT);park(c);killAll();E('setLock')(A,null);}
// a goblin under the crosshair: the seeker passes it by
{home();arm();A.wpn='launcher';S(20);const g=foe('thief',20,9);freeze();T.mHeld.add('Mouse2');S(150);T.mHeld.delete('Mouse2');console.log('sight held on a goblin: locked',!!A.lockT);killAll();E('setLock')(A,null);}
// a car locked with the lock button instead: a rocket fired off to one side homes in too
{home();arm();A.wpn='launcher';S(20);const c=car(2,18);tap('KeyQ');const L=A.lockT===c;A.cam.yaw=Math.PI+0.3;S(1);press(2);console.log('lock button on a car 18 ahead:',L,' fired 17 degrees off to one side: hit',fly(c,150));park(c);killAll();E('setLock')(A,null);}
// an enemy's rocket at a player in a vehicle chases it; at one on foot it doesn't
{home();const c=car(0,6);const g=foe('thief',30,9);freeze();const Fk={gun:{cause:'test'},weapons:['launcher']};A.drv={k:'car',o:c};
 E('foeShoot')(g,A,Fk);const R=T.SHOTS.filter(q=>q.live).pop();A.drv=null;E('foeShoot')(g,A,Fk);const R2=T.SHOTS.filter(q=>q.live).pop();
 console.log('enemy rocket at a player driving: chases',!!(R&&R.chase),' on foot:',!!(R2&&R2.chase));park(c);killAll();}
// Gertie and Gus can't carry it (a goblin's weapon), and the old bazooka switch carries over in a saved loadout
console.log('saved loadout with the bazooka on: launcher',E('gloadFix')({w:{club:true,bazooka:true}}).w.launcher,' with it off:',E('gloadFix')({w:{club:true,bazooka:false}}).w.launcher);
console.log('done');
process.exit(0);
