let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,ABIL2,abilOf,AB,DT,setGob,mHeld,setChar,charName};\n})();');
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
// Gus and Gertie must be the same animal in all but looks: the same moves, played on the same controller inputs in the
// same frames on two identical patches of ground, have to leave them in the same places and states, frame for frame.
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
S(30);
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),OFF=48;   // (B's patch is OFF blocks along x from A's)
for(const o of [0,OFF])for(let x=X0-20;x<=X0+20;x++)for(let z=Z0-20;z<=Z0+30;z++){T.setRaw(x+o,F-1,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x+o,y,z))T.setRaw(x+o,y,z,0);}
let built=[];const put=(x,y,z)=>{for(const o of [0,OFF]){T.setRaw(X0+x+o,F+y,Z0+z,STONE);built.push([X0+x+o,F+y,Z0+z]);}},clear=()=>{for(const q of built)T.setRaw(q[0],q[1],q[2],0);built=[];};
const left=o=>built.filter(q=>q[0]-X0>=o-25&&q[0]-X0<=o+25&&T.get(q[0],q[1],q[2])).length;
const floor=()=>{const keep=new Set(built.map(q=>q.join()));for(const o of [0,OFF])for(let x=X0-20;x<=X0+20;x++)for(let z=Z0-20;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(T.get(x+o,y,z)!==STONE)T.setRaw(x+o,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x+o,y,z)&&!keep.has([x+o,y,z].join()))T.setRaw(x+o,y,z,0);}};
const home=()=>{floor();for(const [p,o] of [[A,0],[B,OFF]]){p.pos.set(X0+o+.5,F,Z0+.5);p.vy=0;p.state='walk';p.t=0;p.cam.yaw=Math.PI;p.cam.pitch=-0.3;p.heading=0;p.hp=20;p.mvx=p.mvz=0;p.stam=100;p.exhausted=false;p.airJumps=1;p.dashT=0;p.biteCD=0;p.smashCD=0;p.chargeCD=0;p.deadT=0;p.lockT=null;p.vb=null;p.piv=null;p.dodge=null;}};
const setPad=(ax,btn)=>{for(const P of pads){P.axes=ax.slice();P.buttons.forEach((b,i)=>{b.pressed=btn.includes(i);b.value=b.pressed?1:0;});}};
// a script: [frames, axes, buttons held]
const run=(name,script)=>{home();setPad([0,0,0,0],[]);S(3);let worst=0,at='',st=0,frames=0;
  for(const [n,ax,btn] of script){setPad(ax,btn);for(let i=0;i<n;i++){S(1);frames++;
    const d=Math.hypot(A.pos.x-(B.pos.x-OFF),A.pos.y-B.pos.y,A.pos.z-B.pos.z);if(d>worst){worst=d;at=frames;}if(A.state!==B.state)st++;}}
  setPad([0,0,0,0],[]);S(40);const d=Math.hypot(A.pos.x-(B.pos.x-OFF),A.pos.y-B.pos.y,A.pos.z-B.pos.z);
  console.log(name.padEnd(22),'player one moved',(Math.hypot(A.pos.x-X0-.5,A.pos.z-Z0-.5)).toFixed(2),'up',(A.pos.y-F).toFixed(2),
    ' | furthest apart',worst.toFixed(3),worst>0.001?'(frame '+at+')':'',' states differed',st,'frames  end gap',d.toFixed(3),' hp',A.hp,B.hp,' stamina',A.stam.toFixed(0),B.stam.toFixed(0));
};
const FWD=[0,-1,0,0],NO=[0,0,0,0];
const twin=(label,gob)=>{T.setGob(gob);console.log('== '+label);
run('walk',[[60,FWD,[]]]);
run('sprint',[[90,FWD,[6]]]);
run('trample (hold dash)',[[90,FWD,[1]]]);
run('jump',[[1,NO,[0]],[60,NO,[]]]);
run('double jump',[[1,NO,[0]],[14,NO,[]],[1,NO,[0]],[60,NO,[]]]);
run('dash',[[1,FWD,[1]],[40,FWD,[]]]);
run('long jump',[[40,FWD,[6]],[1,FWD,[6,0]],[60,FWD,[6]]]);
run('air dash',[[1,NO,[0]],[10,FWD,[]],[1,FWD,[1]],[60,FWD,[]]]);
{clear();floor();for(let v=-3;v<=3;v++)for(let y=0;y<4;y++)put(v,y,3);const b0=left(0);
 run('stomp by a wall',[[1,NO,[7]],[90,NO,[]]]);console.log('   blocks left by Gus',left(0),'by Gertie',left(OFF),'of',b0);clear();}
{for(let v=-3;v<=3;v++)for(let y=0;y<4;y++)put(v,y,3);const b0=left(0);
 run('charged stomp',[[70,NO,[7]],[90,NO,[]]]);console.log('   blocks left by Gus',left(0),'by Gertie',left(OFF),'of',b0);clear();}
{run('ground pound',[[1,NO,[0]],[16,NO,[]],[1,NO,[7]],[90,NO,[]]]);}
{for(let v=-3;v<=3;v++)for(let y=0;y<4;y++)put(v,y,3);const b0=left(0);
 run('bite a wall',[[1,FWD,[2]],[30,FWD,[]],[1,FWD,[2]],[30,FWD,[]],[1,FWD,[2]],[60,NO,[]]]);console.log('   blocks left by Gus',left(0),'by Gertie',left(OFF),'of',b0);clear();}
{for(let v=-4;v<=4;v++)for(let y=0;y<8;y++)for(let u=3;u<7;u++)put(v,y,u);
 run('spider climb',[[300,FWD,[4]]]);clear();}
run('roll? / lock on',[[1,FWD,[11]],[30,FWD,[]]]);
};
const who=()=>T.players.map(p=>T.charName(p)+(p.bow[0].visible?' (bow)':'')).join(' + ');
console.log('picked Gus:',who());
twin('as hippos',false);
T.setChar('gertie');console.log('picked Gertie:',who(),' goblin mode',T.DT.gob);
twin('as hippos, player one Gertie',false);
T.setChar('goblin');console.log('picked Gnash:',who(),' goblin mode',T.DT.gob);
twin('as goblins',true);
T.setChar('gus');console.log('picked Gus again:',who(),' goblin mode',T.DT.gob);
// the same hit does the same harm
{home();S(2);const hp=[];for(const p of [A,B]){p.hp=20;}
 const g=T.goblins.find(g=>!g.civ&&!g.staff);console.log('hp after the same fall from 30 up:');for(const p of [A,B]){p.pos.y=F+30;p.vy=0;}S(150);console.log('  player one',A.hp,'two',B.hp);}
// Each player's own ability switches (they go with the seat, not the hippo): player one with Double jump off, player two
// with it on, then the other way round with player one as Gertie. The one with it off should only get the one jump.
{const peaks=()=>{home();setPad(NO,[]);S(3);let a=0,b=0;const sc=[[1,NO,[0]],[14,NO,[]],[1,NO,[0]],[60,NO,[]]];
   for(const [n,ax,btn] of sc){setPad(ax,btn);for(let i=0;i<n;i++){S(1);a=Math.max(a,A.pos.y-F);b=Math.max(b,B.pos.y-F);}}setPad(NO,[]);S(40);return [a,b];};
 console.log("== each player's own switches");
 for(const [c,off] of [['gus',T.ABIL],['gertie',T.ABIL],['gus',T.ABIL2]]){T.setChar(c);off.double=false;const [a,b]=peaks();off.double=true;
   console.log(`  player one ${T.charName(A)}, ${off===T.ABIL?'player one':'player two'} without Double jump: highest jump player one ${a.toFixed(2)} player two ${b.toFixed(2)}  (sets used: ${T.abilOf(A)===T.ABIL?'own':'WRONG'}, ${T.abilOf(B)===T.ABIL2?'own':'WRONG'})`);}
 T.setChar('gus');}
process.exit(0);
