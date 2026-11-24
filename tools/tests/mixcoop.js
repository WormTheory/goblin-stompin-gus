let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,mHeld,setChar,setChar2,charName,bodyOf,bindHint,freeFoe,foeSpawn,PICKUPS,damageGoblin,charTint};\n})();');
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
console.error=()=>{};
eval(src);const T=window.__t;let now=1000;
const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
// Co-op with one hippo and one goblin (goblin mode is each player's own: setGobP, char-select.js). Picks player two's
// kind on the title screen, then plays both through the same pad inputs side by side: each should move as its own
// kind does alone, see itself the way it should (a hippo's chase camera, a goblin's first person) and only the
// goblin should get Gnash's weapons, drops and pickups.
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
S(30);
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),OFF=48;
const floor=()=>{for(const o of [0,OFF])for(let x=X0-20;x<=X0+20;x++)for(let z=Z0-20;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(T.get(x+o,y,z)!==STONE)T.setRaw(x+o,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x+o,y,z))T.setRaw(x+o,y,z,0);}};
const home=()=>{floor();for(const [p,o] of [[A,0],[B,OFF]]){p.pos.set(X0+o+.5,F,Z0+.5);p.vy=0;p.state='walk';p.t=0;p.cam.yaw=Math.PI;p.cam.pitch=-0.1;p.heading=0;p.hp=20;p.mvx=p.mvz=0;p.stam=100;p.exhausted=false;p.airJumps=1;p.dashT=0;p.biteCD=0;p.smashCD=0;p.chargeCD=0;p.deadT=0;p.lockT=null;p.vb=null;p.piv=null;p.dodge=null;}};
const setPad=(ax,btn)=>{for(const P of pads){P.axes=ax.slice();P.buttons.forEach((b,i)=>{b.pressed=btn.includes(i);b.value=b.pressed?1:0;});}};
const f=(v,n=2)=>v.toFixed(n);
const state=()=>T.players.map(p=>T.charName(p)+(p.gob?' (goblin':' (hippo')+', tint '+T.charTint(p)+', body '+f(T.bodyOf(p).hy)+' tall, model '+(p.gob?'goblin':'hippo')+(p.rig.visible?' hippo-rig':'')+')').join(' + ')+'  any goblin '+T.DT.gob;
const run=(name,script)=>{home();setPad([0,0,0,0],[]);S(3);for(const [n,ax,btn] of script){setPad(ax,btn);S(n);}setPad([0,0,0,0],[]);S(40);
  console.log(name.padEnd(12),T.players.map(p=>T.charName(p)+' moved '+f(Math.hypot(p.pos.x-X0-.5-(p===B?OFF:0),p.pos.z-Z0-.5))+' up '+f(p.pos.y-F)+' '+p.state).join('  |  '));};
const FWD=[0,-1,0,0],NO=[0,0,0,0];
const pair=label=>{console.log('== '+label+':',state());
  run('walk',[[60,FWD,[]]]);run('sprint',[[90,FWD,[6]]]);run('jump',[[1,NO,[0]],[60,NO,[]]]);run('dash',[[1,FWD,[1]],[40,FWD,[]]]);
  home();S(5);console.log('   camera from the feet:',T.players.map(p=>T.charName(p)+' '+f(p.camera.position.distanceTo?p.camera.position.distanceTo(p.pos):Math.hypot(p.camera.position.x-p.pos.x,p.camera.position.y-p.pos.y,p.camera.position.z-p.pos.z))).join(', '));
  console.log('   hint:',T.players.map(p=>T.charName(p)+': '+T.bindHint(true,p).replace(/⟦([^⟧]*)⟧/g,'[$1]').slice(0,60)).join('  |  '));};
console.log('picked Gus:',state());
T.setChar2('goblin');pair('Gus, and a goblin as player two');
// only the goblin's kills drop things, and only he picks them up
{home();S(5);const drops=()=>T.PICKUPS.filter(P=>P.live).map(P=>P.k).sort().join(', ')||'none';
 const foe=(p,d)=>{const g=T.freeFoe('militia',8);T.foeSpawn(g,'militia',null,0);g.pos.set(p.pos.x,F,p.pos.z+d);g.gunCD=g.bombCD=1e9;g.hp=1;return g;};
 const g1=foe(A,1.4);T.damageGoblin(g1,5,g1.pos.clone(),null,'Bitten by Gus');S(2);console.log('Gus kills a militiaman: drops',drops());
 const g2=foe(A,1.4);T.damageGoblin(g2,5,g2.pos.clone(),null,'Clubbed by another goblin');S(2);console.log('Gnash clubs one by Gus: drops',drops());
 setPad([0,-1,0,0],[]);S(5);setPad(NO,[]);A.pos.set(g2.pos.x,F,g2.pos.z);S(30);console.log('Gus stands on them: left',drops(),' Gus kit',A.wpns?A.wpns.join('+'):'none');
 B.pos.set(g2.pos.x,F,g2.pos.z);S(30);console.log('Gnash stands on them: left',drops(),' Gnash kit',B.wpns.join('+'),'grenades',B.gren);}
T.setChar('goblin');T.setChar2('hippo');pair('Gnash, and a hippo as player two');
T.setChar('goblin');T.setChar2('goblin');console.log('both goblins:',state());
T.setChar('gertie');console.log('Gertie, player two still a goblin:',state());
T.setChar2('hippo');console.log('player two a hippo again:',state());
T.setChar('gus');console.log('back to Gus:',state());
process.exit(0);
