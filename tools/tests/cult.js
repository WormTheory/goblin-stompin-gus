let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get FIREB(){return FIREB},CULT_RING,damageGoblin,DT,nearestPlayer,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
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

// Cultists: alive at the altar from the start, turning on Gus when he comes close (or hurts one); fireballs from range,
// daggers up close; the Testing Environment's Cultist button
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;
run(2);
T.tenvSpawn('cult');let n=0;while(T.TS.search&&n<5000){T.tenvTick();n++;}
const B=T.TENV.boxes[T.TENV.boxes.length-1];console.log('spawned',JSON.stringify(B));
run(3);
const ven=()=>[...T.venues.values()].find(V=>V.kind==='cult');let V=ven();
const cults=()=>T.goblins.filter(g=>g.cultist&&g.state==='chase');
const fmt=g=>Math.hypot(g.pos.x-V.cx,g.pos.z-V.cz-0.5).toFixed(1);
const dAlt=()=>Math.hypot(P.pos.x-V.cx,P.pos.z-V.cz).toFixed(1);
console.log('venue',!!V,'gus from altar',dAlt(),'places',V&&V.n,'filled',V&&V.slots.filter(Boolean).length,'roused',V&&V.roused);
console.log('cultists alive',cults().length,'from altar',cults().map(fmt).join(' '),'arms',cults().map(g=>g.arm.rotation.x.toFixed(1)).join(' '),'jobs',cults().map(g=>g.id.occ).join(', '));
run(4);console.log('4 s later: still calm',!V.roused,'gus hp',P.hp,'circling, from altar',cults().map(fmt).join(' '));
const at=(d)=>{P.pos.set(V.cx,0,V.cz+d);P.pos.y=T.groundAt(P.pos.x,P.pos.z,60);P.vy=0;};
// phase 1: Gus 12 from the altar, standing still
const watch=(s,label)=>{let shots=0,live0=new Set(),minHp=P.hp,drops=0,last=P.hp;for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);
  for(const F of T.FIREB){if(F.live&&!live0.has(F)){shots++;live0.add(F);}if(!F.live)live0.delete(F);}
  if(P.hp<last)drops++;last=P.hp;minHp=Math.min(minHp,P.hp);if(P.hp<6)P.hp=20;}
  const ds=cults().map(g=>Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z).toFixed(1));
  console.log(label,'| fireballs thrown',shots,'| hits on gus',drops,'lowest hp',minHp,'| cultists',ds.length,'at',ds.join(' '));};
P.hp=20;at(12);run(0.1);console.log('gus 12 from altar: roused',V.roused);
watch(1.2,'first 1.2 s');
watch(4,'next 4 s');
// phase 2: in among them
P.hp=20;at(0.5);P.pos.x+=0;watch(5,'gus at the altar, 5 s');
// phase 3: kill them all: they stay dead while he's about
for(const g of cults())T.damageGoblin(g,99,new T.V3(g.pos.x,g.pos.y+1,g.pos.z),new T.V3(0,0.5,1));
run(15);console.log('killed all: alive',cults().length,'slain marks',V.slain.filter(Boolean).length,'roused',V.roused);
// phase 4: away (venue dropped), back: a fresh circle; hurting one rouses it
P.pos.set(V.cx,0,V.cz+400);P.pos.y=T.groundAt(P.pos.x,P.pos.z,60);run(3);console.log('gone 400 off: venue kept',!!ven(),'cultists about',cults().length);
at(40);run(3);V=ven();console.log('back at 40: venue',!!V,'roused',V&&V.roused,'alive',cults().length);
const g0=cults()[0];T.damageGoblin(g0,1,new T.V3(g0.pos.x,g0.pos.y+1,g0.pos.z),new T.V3(0,0.5,1));run(0.1);console.log('hit one from 40 off: roused',V.roused);
watch(4,'roused from 40 off, 4 s');
// phase 5: the Testing Environment's Cultist button
T.tenvClear();run(1);
T.menuOpen=true;T.TS.n=3;T.tenvFoe('cultist');console.log('foe cultist',els.tpInfo.textContent);T.menuOpen=false;
run(0.1);const fc=cults().filter(g=>!g.homeV);console.log('spawned cultists',fc.length,'no altar',fc.every(g=>g.homeV===null));
P.hp=20;watch(5,'button cultists, 5 s');
// phase 6: one cultist right beside Gus: daggers, no fireballs (too close to bother)
T.tenvClear();run(0.5);T.menuOpen=true;T.TS.n=1;T.tenvFoe('cultist');T.menuOpen=false;
{const g=cults()[0];g.pos.set(P.pos.x+1.6,P.pos.y,P.pos.z);g.gunCD=0;}
P.hp=20;watch(3,'one cultist beside gus, 3 s (dagger every 0.85 s)');
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
