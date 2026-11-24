let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={FOES,SHOTS,TRACERS,trainHit,damageGoblin,DT,nearestPlayer,get wrecked(){return wrecked},TRAIN_BOXES,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,boxesTouch,MIL,tenvVeh,CREWCARS,CREW_SPOTS,damageCar,milHit,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
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

// Crews: the militia compound's technicals and four-wheelers and the military base's tanks and helicopters start empty;
// set off, goblins of the camp's kind run out and climb aboard, and only then do they go. The Testing Environment's buttons
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;
run(2);const G0=44;
const spawnK=k=>{T.tenvSpawn(k);let n=0;while(T.TS.search&&n<5000){T.tenvTick();n++;}return T.TENV.boxes[T.TENV.boxes.length-1];};
const foes=k=>T.goblins.filter(g=>g.foeKind===k&&g.state==='chase');
const place=(x,z)=>{P.pos.set(x,0,z);P.pos.y=Math.max(G0+1,T.groundAt(x,z,80));P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.rideC=null;P.vcl=null;if(P.state==='climb')P.state='walk';};
const f1=v=>v.toFixed(1);
// count the bullets fired (tracers) and the hits on Gus, over s seconds (keeping him alive), with a line of state after
const watch=(s,label,extra)=>{let shots=0,hits=0,last=P.hp,lowest=P.hp;const seenT=new Map();
  for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);
    for(const t of T.TRACERS){if(t.t>(seenT.get(t)??0)+0.001)shots++;seenT.set(t,t.t);}
    if(P.hp<last)hits++;last=P.hp;lowest=Math.min(lowest,P.hp);if(P.hp<8)P.hp=20;}
  console.log(label,'| bullets',shots,'| hits on gus',hits,'lowest hp',lowest,extra?'| '+extra():'');};
const vehs=()=>T.CREWCARS.filter(c=>c.alive);
const seats=c=>(c.crew.drv?'D':'-')+(c.crew.gun?'G':'-');
const vline=()=>vehs().map(c=>c.veh[0]+':'+seats(c)+(c.dh.visible?'h':'')+(c.vehG[c.veh].gunner.visible?'g':'')+' moved '+f1(Math.hypot(c.pos.x-c.home.x,c.pos.z-c.home.z))).join(', ');
const runners=()=>T.goblins.filter(g=>g.state==='chase'&&g.mount);
// ---- the militia compound ----
{const B=spawnK('militia');const X0=B.ax*32,Z0=B.az*32;
 place(X0+32,Z0-75);run(3);   // (well outside: near enough that the place is filled in, too far to set it off)
 const V=[...T.venues.values()].find(v=>v.kind==='guards'&&v.style==='militia');
 for(const c of vehs())c.home={x:c.pos.x,z:c.pos.z};
 console.log('militia: roused',V.roused,'| vehicles',vehs().length,vehs().map(c=>c.veh).join(' '),'| at their spots',vehs().every(c=>V.vspots.some(S=>Math.hypot(S.x-c.pos.x,S.z-c.pos.z)<0.6)),'| crewed',vehs().filter(c=>c.crew.drv||c.crew.gun).length,'| shown aboard',vehs().filter(c=>c.dh.visible||c.vehG[c.veh].gunner.visible).length,'| old block pickups gone',T.get(X0+42,G0+2,Z0+29)===0&&T.get(X0+50,G0+3,Z0+29)===0);
 run(3);console.log('   3 s later, still outside: vehicles',vline(),'| runners',runners().length);
 place(X0+32,Z0+46);run(0.2);P.hp=20;
 console.log('gus walks in: roused',V.roused,'| runners',runners().length,'heading for',runners().map(g=>g.mount.o.veh[0]+g.mount.seat).join(' '),'| from the HQ',runners().every(g=>Math.abs(g.pos.z-(Z0+23))<3));
 watch(1.5,'   1.5 s',()=>'vehicles '+vline()+' | runners '+runners().length);
 // (one shot dead on the way: its seat's still empty, and another comes out for it)
 const r=runners()[0];let rk=null;if(r){rk=r.mount;T.damageGoblin(r,99,new T.V3(r.pos.x,r.pos.y+1,r.pos.z),new T.V3(0,0.5,1));}
 run(1.4);console.log('   one killed running: dead',r&&r.state==='dead','| another sent for that seat',!!rk&&runners().some(g=>g.mount.o===rk.o&&g.mount.seat===rk.seat));
 watch(4,'   4 s more',()=>'vehicles '+vline()+' | runners '+runners().length);
 watch(8,'   8 s more',()=>'vehicles '+vline()+' | nearest to gus '+vehs().map(c=>f1(Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z))).join(' '));
 // (a technical blown up, with both aboard: their bodies come out of the wreck)
 const t=vehs().find(c=>c.veh==='technical'&&c.crew.drv&&c.crew.gun);
 if(t){const names=[t.crew.drv.name,t.crew.gun.name],d0=T.goblins.filter(g=>g.state==='dead').length;T.damageCar(t,99);run(0.2);
   const dead=T.goblins.filter(g=>g.state==='dead');console.log('technical destroyed: alive',t.alive,'| bodies thrown out',dead.length-d0,'| by name',names.every(n=>dead.some(g=>g.id&&g.id.name===n)),'| militiamen',dead.filter(g=>g.foeKind==='militia').length>=2);}
 run(1);console.log('   its spot stays empty',vehs().length,'vehicles left');
 T.tenvClear();place(P.pos.x,P.pos.z+700);run(3);console.log('   gone 700 off: vehicles',vehs().length);}
// ---- the military base ----
{const B=spawnK('base');run(4);const V=[...T.venues.values()].find(v=>v.kind==='army');
 const tanks=()=>V.mil.filter(M=>M.kind==='tank'),helis=()=>V.mil.filter(M=>M.kind==='heli');
 console.log('base: crewed',V.mil.filter(M=>M.crew).length,'of',V.mil.length,'| parked',V.mil.filter(M=>M.state==='park').length);
 place(V.X0+30,V.Z0+60);run(0.2);P.hp=20;
 const st=()=>'tanks '+['man','hunt'].map(s=>s+' '+tanks().filter(M=>M.state===s).length).join(' ')+' crewed '+tanks().filter(M=>M.crew).length+' moved '+tanks().filter(M=>Math.hypot(M.x-M.home.x,M.z-M.home.z)>1).length+' | helis '+helis().map(M=>M.state+(M.crew?' crewed':'')+' up '+f1(M.y-G0-1)).join(', ')+' | soldiers running '+runners().filter(g=>g.foeKind==='soldier').length;
 console.log('gus in the base: alert',V.alert,'|',st(),'| from the barracks',runners().every(g=>g.pos.z<V.Z0+35));
 const manned=()=>tanks().filter(M=>M.state==='man');
 console.log('   empty tanks stay put',manned().every(M=>Math.hypot(M.x-M.home.x,M.z-M.home.z)<0.1&&M.v<0.05));
 // (kill the soldier running for the nearest tank: it waits its turn again, and another goes)
 const M0=manned().sort((a,b)=>Math.hypot(a.x-P.pos.x,a.z-P.pos.z)-Math.hypot(b.x-P.pos.x,b.z-P.pos.z))[0];
 if(M0&&M0.runner){const g=M0.runner;T.damageGoblin(g,99,new T.V3(g.pos.x,g.pos.y+1,g.pos.z),new T.V3(0,0.5,1));run(0.1);console.log('   its soldier killed: that tank',M0.state,'| crewed',!!M0.crew);}
 T.DT.invuln=true;
 for(const [s,l] of [[1,'1 s'],[3,'3 s more'],[6,'6 s more'],[10,'10 s more']]){run(s);console.log('   '+l+':',st());}
 const t0=tanks().find(M=>M.state==='hunt'&&M.crew&&M.crew.name);
 if(t0){const nm=t0.crew.name,d0=T.goblins.filter(g=>g.state==='dead').length;for(let i=0;i<20&&!t0.dead;i++)T.trainHit(t0,20,null,0);run(0.2);
   console.log('tank destroyed: its crewman\'s body out of it',T.goblins.filter(g=>g.state==='dead').length-d0>=1&&T.goblins.some(g=>g.state==='dead'&&g.id&&g.id.name===nm));}
 // (away long enough to stand down: back home, the crew climbs out and walks to the barracks)
 T.DT.host=2;run(0.2);console.log('hostility to Peaceful: alert',V.alert,'| going home',tanks().filter(M=>M.state==='home').length);
 const HS=tanks().filter(M=>M.state==='home');let back=0,walk=0;for(let i=0;i<60*40&&back<HS.length;i++){now+=16.7;T.frame(now);walk=Math.max(walk,runners().filter(g=>g.mount.home).length);back=HS.filter(M=>M.state==='park'&&!M.crew).length;}
 console.log('   back in their places, empty',back,'of',HS.length,'| soldiers seen walking back to the barracks',walk);T.DT.host=3;
 T.DT.invuln=false;T.tenvClear();place(P.pos.x,P.pos.z+700);run(2);}
// ---- the Testing Environment's buttons ----
for(const [t,vm] of [['technical','hunt'],['quad','hunt'],['technical','park']]){T.tenvClear();run(0.5);T.menuOpen=true;T.TS.n=2;T.TS.vm=vm;T.tenvVeh(t);console.log(t,vm,els.tpInfo.textContent);T.menuOpen=false;P.hp=20;
  for(const c of vehs())c.home={x:c.pos.x,z:c.pos.z};
  watch(6,'   6 s',()=>vline());}
T.TS.vm='hunt';
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
