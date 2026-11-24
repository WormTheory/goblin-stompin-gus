let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get TENVA(){return venues.get("tenvArmy")},tenvVeh,VEH,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
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
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;
console.log('in tenv',!!T.TENV,'seed',T.seed);
run(3);
const blocks=(x0,z0,x1,z1)=>{let n=0,top=0;for(let x=x0;x<x1;x+=2)for(let z=z0;z<z1;z+=2)for(let y=45;y<120;y++)if(T.get(x,y,z)){n++;top=Math.max(top,y);}return [n,top];};
const p0=P.pos;console.log('gus at',p0.x.toFixed(1),p0.y.toFixed(1),p0.z.toFixed(1),'blocks above ground within 60:',blocks(p0.x-60,p0.z-60,p0.x+60,p0.z+60)[0]);
const fixN=()=>T.activeFix.length,propN=()=>T.activeProps.length;
console.log('empty world: fixtures',fixN(),'props',propN(),'doors',T.doorsOn.size,'landmarks',T.lmOn.size,'venues',T.venues.size,'cars alive',T.cars.filter(c=>c.alive).length,'goblins about',T.goblins.filter(g=>g.state!=='wait').length);
run(20);
console.log('after 20 s: cars alive',T.cars.filter(c=>c.alive).length,'goblins about',T.goblins.filter(g=>g.state!=='wait').length);
for(const key of (process.env.KINDS||'hospital,homes,fire,mall,zoo,farm').split(',')){
  P.cam.yaw=(P.cam.yaw+1.3)%(Math.PI*2);   // (looking a different way each time)
  const t0=Date.now();T.tenvSpawn(key);let n=0;while(T.TS.search&&n<5000){T.tenvTick();n++;}
  const B=T.TENV.boxes[T.TENV.boxes.length-1];
  if(!B||B.k!==key){console.log(key.padEnd(9),'not found',els.tpInfo&&els.tpInfo.textContent);continue;}
  run(2);
  // (built in front of Gus, where the camera looks: how far ahead its middle is, and how far to the side)
  const yaw=P.cam.yaw,fx=-Math.sin(yaw),fz=-Math.cos(yaw),mx=(B.ax+B.w/2)*32-P.pos.x,mz=(B.az+B.h/2)*32-P.pos.z;
  console.log(key.padEnd(9),'from',B.sx+','+B.sz,'built at',B.ax+','+B.az,'ahead',Math.round(mx*fx+mz*fz),'aside',Math.round(Math.abs(mx*fz-mz*fx)),'yaw',yaw.toFixed(2));
  const X0=B.ax*32,Z0=B.az*32,X1=X0+B.w*32,Z1=Z0+B.h*32,[nb,top]=blocks(X0,Z0,X1,Z1),[nOut]=blocks(X0-64,Z1+8,X1+64,Z1+64);
  console.log(key.padEnd(9),'box',JSON.stringify(B),'search+build ms',Date.now()-t0,'| blocks in box',nb,'top',top,'| outside (south strip)',nOut,'| gus',P.pos.x.toFixed(0),P.pos.y.toFixed(1),P.pos.z.toFixed(0),
    '| fixtures',fixN(),'props',propN(),'doors',T.doorsOn.size,'signs',T.nBS,'venues',T.venues.size);
}
// enemies
T.menuOpen=true;
for(const k of ['goblin','cop','civ']){T.TS.n=k==='goblin'?5:1;T.tenvFoe(k);console.log('foe',k.padEnd(7),els.tpInfo.textContent);}
T.TS.n=1;for(const t of [...Object.keys(T.VEH),'police','tank','heli','plane']){T.TS.vm='hunt';T.tenvVeh(t);console.log('veh',t.padEnd(7),els.tpInfo.textContent);}
T.TS.vm='park';T.TS.n=3;T.tenvVeh('bus');console.log('veh park',els.tpInfo.textContent);T.TS.vm='hunt';
T.menuOpen=false;run(0.2);
const about=()=>T.goblins.filter(g=>g.state==='chase').map(g=>Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z).toFixed(1));
console.log('goblins out',about().length,'distances',about().join(' '),'cars',T.cars.filter(c=>c.alive).map(c=>(c.police?'P':'C')+(c.hunter?'h':'')+Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z).toFixed(0)).join(' '));
run(4);
console.log('after 4 s: goblins out',about().join(' '),'| gus hp',P.hp,'| cars',T.cars.filter(c=>c.alive).map(c=>(c.police?'P':'C')+(c.hunter?'h':'')+Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z).toFixed(0)).join(' '));
{const V=T.TENVA;console.log('army',V?V.mil.map(M=>M.kind+':'+M.state+' '+Math.round(Math.hypot(M.x-P.pos.x,M.z-P.pos.z))+'m up '+(M.y-45).toFixed(1)).join(', '):'none');}
T.tenvClear();run(1);console.log('cleared: goblins out',about().length,'cars',T.cars.filter(c=>c.alive).length);
// remove the first one: back to flat ground
const B0=T.TENV.boxes[0];T.tenvRemove(0);run(1);
console.log('removed',B0.k,'blocks left in its box',blocks(B0.ax*32,B0.az*32,(B0.ax+B0.w)*32,(B0.az+B0.h)*32)[0],'boxes',T.TENV.boxes.length,'saved',JSON.stringify(JSON.parse(LS[T.SAVE_KEY]||'{}').tenv||null).slice(0,160));
// Reset world: asks once, then everything spawned is gone
els.confirmYes.click=()=>{for(const f of els.confirmYes.L.click)f();};T.menuOpen=true;for(const f of els.tpReset.L.click)f();console.log('reset 1st press:',els.tpReset.textContent,'| boxes',T.TENV.boxes.length);
for(const f of els.tpReset.L.click)f();run(1);console.log('reset 2nd press: boxes',T.TENV.boxes.length,'army',!!T.TENVA,'cars',T.cars.filter(c=>c.alive).length,'in tenv',!!T.TENV);
console.log('errors',errs.length,errs.slice(0,3));

process.exit(0);
