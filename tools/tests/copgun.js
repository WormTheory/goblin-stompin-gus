let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={FOES,SHOTS,TRACERS,trainHit,damageGoblin,DT,nearestPlayer,get wrecked(){return wrecked},TRAIN_BOXES,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,boxesTouch,MIL,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY,WEAPONS,STRIKES,calmNow};\n})();');
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
// Police: the handgun at range (drawn, aimed, fired, back in the holster) and the club up close
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;
run(2);const G0=44;
const place=(x,z)=>{P.pos.set(x,0,z);P.pos.y=Math.max(G0+1,T.groundAt(x,z,80));P.vy=0;P.mvx=P.mvz=0;};
const cops=()=>T.goblins.filter(g=>g.arms&&g.state==='chase');
const causes={};const dp=[];
console.log('tenv',!!T.TENV,'host',T.DT.host);
for(const [label,dist] of [['far',14],['close',1.5]]){
  for(const g of cops()){g.state='wait';g.root.visible=false;g.arms=null;}
  place(P.pos.x,P.pos.z);P.heading=0;P.hp=20;
  T.tenvFoe('cop');const C=cops();
  for(const g of C){const a=Math.random()*6.28;g.pos.set(P.pos.x+Math.sin(a)*dist,P.pos.y,P.pos.z+Math.cos(a)*dist);g.inv=false;}
  let shots=0,hits=0,last=P.hp,frames={0:0,1:0,2:0},seenT=new Map(),kicks=0,minD=99;
  for(let i=0;i<10*60;i++){now+=16.7;T.frame(now);
    for(const t of T.TRACERS){if(t.t>(seenT.get(t)??0)+0.001)shots++;seenT.set(t,t.t);}
    for(const g of C){frames[g.wkit.shown]=(frames[g.wkit.shown]||0)+1;if(g.arm.hand.rotation.x<-0.3&&g.wkit.shown===2)kicks++;minD=Math.min(minD,Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z));
      if(label==='close'&&Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z)>3){g.pos.set(P.pos.x+1.5,P.pos.y,P.pos.z);}}
    if(P.hp<last){hits++;}last=P.hp;if(P.hp<8)P.hp=20;
    if(label==='far')for(const g of C)if(Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z)<8){const a=Math.atan2(g.pos.x-P.pos.x,g.pos.z-P.pos.z);g.pos.set(P.pos.x+Math.sin(a)*14,g.pos.y,P.pos.z+Math.cos(a)*14);}}
  const ob=(P.obits||[]);
  console.log(label.padEnd(5),'cops',C.length,'| bullets',shots,'| hits on gus',hits,'| frames club+holster',frames[1],'gun out',frames[2],'none',frames[0],'| recoil frames',kicks,'| closest',minD.toFixed(1));
}
// calm: no shooting, gun put away
T.DT.host=2;for(const g of cops()){g.state='wait';g.root.visible=false;g.arms=null;}
T.tenvFoe('cop');const C2=cops();for(const g of C2){g.pos.set(P.pos.x+12,P.pos.y,P.pos.z);g.inv=false;}
let sh=0;const sT=new Map();for(let i=0;i<5*60;i++){now+=16.7;T.frame(now);for(const t of T.TRACERS){if(t.t>(sT.get(t)??0)+0.001)sh++;sT.set(t,t.t);}}
console.log('peaceful: cops',C2.length,'calm',T.calmNow(),'bullets',sh,'gun out',C2.filter(g=>g.wkit.shown===2).length);
// an ordinary goblin out of the same pool: no gun, no holster
T.DT.host=3;
const plain=T.goblins.find(g=>g.wkit&&!g.arms&&g.state==='chase');console.log('ordinary goblin with the kit:',plain?('shown '+plain.wkit.shown+' pistol visible '+plain.wkit.gun.some(m=>m.visible)+' holster visible '+plain.wkit.stow.some(m=>m.visible)):'none about');
console.log('pistol pose keys',new Set(T.STRIKES.pistol.flat().map(q=>q[0])).size,'| errors',errs.length,errs.slice(0,3));
