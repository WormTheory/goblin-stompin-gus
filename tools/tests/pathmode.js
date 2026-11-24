let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={setPath,pathSimple,get DT(){return DT},navCol,solidAt,G,keys,stFind,plotInfo,get,players,goblins,cars,frame};\n})();');
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
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;
// The Options switch between goblin pathfinding modes (setPath: 0 Advanced, 1 Simple). The same chases run in each: Gus
// clinging partway up a wall, a goblin below; Gus up on a roof; and Gus on level ground. In Simple a goblin should never
// set off on a jump or a climb (g.act) and no route map gets built, while it still runs Gus down on the level. Then
// Simple is chosen while a goblin's halfway up the wall: it should let go, drop, and land unhurt. And back to Advanced,
// it climbs again. ('BAD' marks a line that isn't what it should be.)
const CELL=32,G=T.G,DT=33.4;
const gob=T.goblins.find(g=>!g.civ&&!g.staff&&!g.medic&&!g.ff&&!g.cop)||T.goblins[0];
for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
const others=()=>{for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const groundY=(x,z,top=G+60)=>{let y=top;while(y>1&&!T.solidAt(x,y,z)&&T.get(x,y,z)!==9)y--;return y+1;};
const put=(x,y,z)=>{gob.state='chase';gob.hp=gob.hpMax=99;gob.stun=0;gob.indoor=false;gob.civ=false;gob.staff=false;gob.root.visible=true;gob.pos.set(x,y,z);gob.vy=0;gob.t=0;gob.detour=0;gob.kv.set(0,0,0);gob.atk=1;gob.act=null;gob.fallTop=undefined;gob.los=false;gob.losT=0;gob.trip=null;gob.stUp=undefined;};
const F=T.stFind('mid',0,0),P=T.plotInfo(F.ax,F.az);let b=P.b[0];for(const q of P.b)if((q.x1-q.x0)*(q.z1-q.z0)>(b.x1-b.x0)*(b.z1-b.z0))b=q;
const X0=F.ax*CELL,Z0=F.az*CELL,cx=X0+((b.x0+b.x1)>>1),wz=Z0+b.z0-1,y0=groundY(cx,wz),topY=groundY(cx,wz+1,G+150);
const wall={x:cx+.5,y:y0+Math.round((topY-y0)/2),z:wz+.6};
while(wall.y>y0+1&&!(T.solidAt(cx,wall.y,wz+1)&&T.solidAt(cx,wall.y+1,wz+1)))wall.y--;
const roofSpot=(()=>{for(let r=0;r<6;r++)for(let dz=2;dz<8;dz++){const x=cx+r,z=wz+dz;if(groundY(x,z,G+150)===topY)return {x:x+.5,y:topY,z:z+.5};}return null;})();
const cling=()=>{A.state='climb';A.climbD=[0,1];A.heading=0;A.vy=0;A.pos.set(wall.x,wall.y,wall.z);A.hp=999;};
const stand=q=>()=>{A.state='walk';A.vy=0;A.grounded=true;A.pos.set(q.x,q.y,q.z);A.hp=999;};
console.log('  building: mid,',topY-y0,'tall; Gus on the wall',wall.y-y0,'up; roof spot',roofSpot&&[roofSpot.x-cx,roofSpot.y-y0,roofSpot.z-wz].join());
// one chase: hold Gus with pose() for secs, the goblin starting at from; what the goblin did
function chase(pose,from,secs,climb){
  if(climb)T.keys.add('KeyC');for(let i=0;i<12;i++){pose();others();now+=DT;T.frame(now);}
  put(from.x,from.y,from.z);const hp0=gob.hp;
  let t=0,actF=0,climbF=0,blows=0,first=null,hi=gob.pos.y,navd=false;
  while(t<secs){pose();others();now+=DT;T.frame(now);t+=DT/1000;if(gob.state!=='chase')break;
    if(gob.act){actF++;if(gob.act.k==='up'||gob.act.k==='down')climbF++;}hi=Math.max(hi,gob.pos.y);if(A.nav)navd=true;
    if(A.hp<999){blows++;if(first===null)first=t;A.hp=999;}}
  T.keys.delete('KeyC');A.state='walk';
  return {actF,climbF,blows,first,hi:hi-from.y,navd,hurt:hp0-gob.hp,alive:gob.state==='chase'};
}
const fmt=r=>('jumps/climbs '+r.actF+' frames ('+r.climbF+' on a wall)').padEnd(38)+(r.blows?r.blows+' blows, first after '+r.first.toFixed(1)+'s':'no blows').padEnd(28)+'highest '+r.hi.toFixed(1)+'  route map '+(r.navd?'yes':'no');
const below={x:cx-5.5,y:y0,z:wz-6.5};
const flatA={x:cx+.5,y:y0,z:wz-8.5},flatG={x:cx-9.5,y:y0,z:wz-14.5};
let bad=0;const chk=(ok,s)=>{if(!ok)bad++;console.log(ok?'   ':'BAD',s);};
for(const mode of [0,1]){
  T.setPath(mode);const name=mode?'Simple':'Advanced';
  console.log(' ',name,'(pathSimple '+T.pathSimple()+')');
  const w=chase(cling,below,40,true);console.log('    Gus on a wall      ',fmt(w));
  const r=roofSpot?chase(stand(roofSpot),below,40):null;if(r)console.log('    Gus on the roof    ',fmt(r));
  const f=chase(stand(flatA),flatG,30);console.log('    Gus on the level   ',fmt(f));
  if(mode){chk(w.actF===0&&(!r||r.actF===0)&&f.actF===0,'Simple: never jumps or climbs');chk(!w.navd&&(!r||!r.navd)&&!f.navd,'Simple: no route map built');chk(f.blows>0,'Simple: still runs Gus down on the level');chk(!w.blows&&(!r||!r.blows),'Simple: can\'t reach Gus up a wall or on the roof');}
  else{chk(w.climbF>0&&w.blows>0,'Advanced: climbs the wall after Gus and hits him');chk(!r||r.blows>0,'Advanced: reaches Gus on the roof');chk(f.blows>0,'Advanced: runs Gus down on the level');}
}
// switched to Simple with the goblin partway up the wall
{T.setPath(0);T.keys.add('KeyC');for(let i=0;i<12;i++){cling();others();now+=DT;T.frame(now);}
  put(below.x,below.y,below.z);let t=0;while(t<40&&!(gob.act&&gob.act.k==='up'&&gob.pos.y>y0+3)){cling();others();now+=DT;T.frame(now);t+=DT/1000;}
  const onWall=!!(gob.act&&gob.act.k==='up'),hy=gob.pos.y-y0,hp=gob.hp;
  T.setPath(1);let land=null;t=0;while(t<6){cling();others();now+=DT;T.frame(now);t+=DT/1000;if(gob.act)break;if(land===null&&gob.vy===0&&gob.pos.y<y0+0.6)land=t;}
  T.keys.delete('KeyC');A.state='walk';
  console.log('  switched to Simple with the goblin',hy.toFixed(1),'up the wall: back on its feet after',land===null?'never':land.toFixed(1)+'s','at',(gob.pos.y-y0).toFixed(1),'hurt',hp-gob.hp,'state',gob.state,'softLand',!!gob.softLand);
  chk(onWall,'it was on the wall when Simple was chosen');chk(!gob.act&&land!==null&&gob.state==='chase'&&gob.hp===hp&&!gob.softLand,'let go, dropped and landed unhurt, and stays off the wall');}
// and back to Advanced: climbing again
{T.setPath(0);const w=chase(cling,below,40,true);console.log('  back to Advanced: Gus on a wall',fmt(w));chk(w.climbF>0,'Advanced again: climbs');}
console.log(bad?'  '+bad+' BAD':'  all as they should be');
process.exit(0);
