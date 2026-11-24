let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={keys,drvEnter,drvExit,MIL,boxesTouch,PLANE_HP,get TENVB(){return venues.get("tenvPlanes")},get TENVA(){return venues.get("tenvArmy")},tenvVeh,VEH,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
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
const LS={};global.localStorage={getItem:k=>k in LS?LS[k]:(/goblin-city-v/.test(k)?JSON.stringify({seed:12345,edits:{},coll:{},down:[],dest:{},test:[],tenv:{boxes:[]}}):null),setItem(k,v){LS[k]=String(v)},removeItem(k){delete LS[k]}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};

// Testing Environment: boots empty and flat; structures spawn in front of Gus with their dressing; enemies spawn ahead of Gus
// Vehicles running into each other: a tank into a helicopter's tail, a car into a parked plane, a plane taxiing into a
// tank, a tank into a parked plane, a helicopter's tail swung through a tank. Each says whether they ended up overlapping.
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(3);P.hp=20;
const parts={tank:[{c:0,hx:1.6,hz:2.7,y0:0,y1:2.3}],heli:[{c:0,hx:1.0,hz:2.4,y0:0,y1:2.2},{c:-4.2,hx:0.35,hz:1.9,y0:1.5,y1:3.25}]};
const boxesOf=o=>o.isMil?parts[o.kind].map(a=>({x:o.x+Math.sin(o.h)*a.c,z:o.z+Math.cos(o.h)*a.c,h:o.h,hx:a.hx,hz:a.hz,y0:o.y+a.y0,y1:o.y+a.y1}))
  :o.isPlane?[{x:o.g.position.x,z:o.g.position.z,h:o.g.rotation.y,hx:1.25,hz:9.9,y0:o.g.position.y,y1:o.g.position.y+3.65}]
  :[{x:o.pos.x,z:o.pos.z,h:o.heading,hx:o.hx,hz:o.hz,y0:o.pos.y,y1:o.pos.y+(o.hy||1.4)}];
const overlap=(a,b)=>{let m=0;for(const p of boxesOf(a))for(const q of boxesOf(b)){if(p.y0>=q.y1||q.y0>=p.y1)continue;if(T.boxesTouch(p.x,p.z,p.h,p.hx,p.hz,q.x,q.z,q.h,q.hx,q.hz))m=1;}return m;};
const mil=k=>{T.TS.n=1;T.TS.vm='park';const V=T.TENVA,n0=V?V.mil.length:0;T.menuOpen=true;T.tenvVeh(k);T.menuOpen=false;return T.TENVA.mil[n0];};
const plane=()=>{T.TS.n=1;const V=T.TENVB,n0=V?V.pl.length:0;T.menuOpen=true;T.tenvVeh('plane');T.menuOpen=false;return T.TENVB&&T.TENVB.pl[n0];};
const car=()=>{T.TS.n=1;T.TS.vm='park';const n0=T.cars.filter(c=>c.alive).length;T.menuOpen=true;T.tenvVeh('car');T.menuOpen=false;return T.cars.filter(c=>c.alive&&c.parked).pop();};
const clear=()=>{if(P.drv)T.drvExit(P);T.tenvClear();run(0.5);P.pos.set(0,46,0);P.cam.yaw=Math.PI;run(0.5);};
// drive o (D) for s seconds holding W, watching whether it overlaps t
const drive=(D,t,s,label)=>{T.drvEnter(P,D);T.keys.add('KeyW');let ov=0,frames=0;for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);P.hp=20;if(overlap(D.o,t))ov++;frames++;}T.keys.delete('KeyW');
  const hp=o=>o.isMil?o.hp:o.isPlane?o.hp:o.hp;console.log(label.padEnd(34),'frames overlapping',ov+'/'+frames,'| health now',Math.round(hp(D.o)),Math.round(hp(t)),'| dead',!!(D.o.dead||D.o.alive===false),!!(t.dead||t.alive===false));T.drvExit(P);run(0.3);};
const put=(o,x,z,h)=>{if(o.isMil){o.x=x;o.z=z;o.h=h;o.home={x,z,h};}else if(o.isPlane){o.g.position.set(x,45,z);o.g.rotation.set(0,h,0);}else{o.pos.set(x,45,z);o.heading=h;o.speed=0;}};
// 1. a tank driven at the tail of a helicopter sat side on across its path
{clear();const tk=mil('tank'),he=mil('heli');put(tk,0,20,0);put(he,4.2,32,Math.PI/2);run(0.5);drive({k:'tank',o:tk,V:tk.V},he,6,'tank into a helicopter\'s tail');}
// 2. a tank driven at a helicopter's body
{clear();const tk=mil('tank'),he=mil('heli');put(tk,0,20,0);put(he,0,32,Math.PI/2);run(0.5);drive({k:'tank',o:tk,V:tk.V},he,6,'tank into a helicopter\'s body');}
// 3. a car driven into the side of a parked plane
{clear();const pl=plane(),c=car();if(!pl||!c)console.log('no plane or car',!!pl,!!c);else{put(pl,0,40,Math.PI/2);put(c,0,20,0);run(0.5);drive({k:'car',o:c},pl,4,'car into a parked plane');}}
// 4. a plane taxiing into a parked tank
{clear();const pl=plane(),tk=mil('tank');if(!pl)console.log('no plane');else{put(pl,0,0,0);put(tk,0,60,Math.PI/2);run(0.5);drive({k:'plane',o:pl},tk,6,'plane taxiing into a tank');}}
// 5. a tank driven into the side of a parked plane
{clear();const pl=plane(),tk=mil('tank');if(!pl)console.log('no plane');else{put(pl,0,40,Math.PI/2);put(tk,0,25,0);run(0.5);drive({k:'tank',o:tk,V:tk.V},pl,6,'tank into a parked plane');}}
// 6. a car driven into a parked tank
{clear();const tk=mil('tank'),c=car();if(!c)console.log('no car');else{put(tk,0,40,Math.PI/2);put(c,0,20,0);run(0.5);drive({k:'car',o:c},tk,4,'car into a parked tank');}}
// 7. a helicopter flown low into a parked tank
{clear();const he=mil('heli'),tk=mil('tank');put(he,0,15,0);put(tk,0,35,Math.PI/2);run(0.5);T.drvEnter(P,{k:'heli',o:he,V:he.V});run(3);P.cam.yaw=Math.PI;drive({k:'heli',o:he,V:he.V},tk,4,'helicopter flown into a tank');}
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
