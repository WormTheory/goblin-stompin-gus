let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,mHeld,freeFoe,foeSpawn,PICKUPS,SHOTS,bindHint,FOES,foeThrow,damageGoblin,gobDrop,foeArm,GOB_FOES,FIREB,freeCultist,cultSpawn,WEAPONS,mTap};\n})();');
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
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// Gnash's dash and weapons (player/gob-weapons.js): the dash, the club, dagger and rifle, grenades, what the enemies
// he kills drop and picking it up, and the controls hint. Run once as Gus first, to show a hippo has none of it.
const STONE=3,KF='KeyW',KL='KeyA',KC='KeyC',KJ='Space',KS='ShiftLeft';
const ABIL0=JSON.stringify(T.ABIL),W0=T.AB.walk.speed,J0=T.AB.jump.launch;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){T.setRaw(x,F-1,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
let built=[];const put=(x,y,z)=>{T.setRaw(X0+x,F+y,Z0+z,STONE);built.push([X0+x,F+y,Z0+z]);},clear=()=>{for(const q of built)T.setRaw(q[0],q[1],q[2],0);built=[];};
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;};
const hold=(ks,n)=>{for(const k of ks)T.keys.add(k);S(n);for(const k of ks)T.keys.delete(k);};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const tap=(k,n=3)=>{T.keys.add(k);S(n);T.keys.delete(k);};
const nextW=()=>{for(let i=0;i<3;i++){T.mTap.add('MouseWheelDown');S(1);}};   // (the next weapon: a notch of the wheel down)
const f=(v,n=2)=>v.toFixed(n);
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
// a foe of kind k standing d ahead of him (yaw PI: ahead is +z), ready to fight
const foe=(k,d,hp)=>{const g=T.freeFoe(k,8);T.foeSpawn(g,k,null,0);g.pos.set(A.pos.x,F,A.pos.z+d);g.heading=Math.PI;g.gunCD=g.bombCD=1e9;g.stun=0;g.kv.set(0,0,0);if(hp)g.hp=hp;return g;};
const freeze=()=>{for(const g of T.goblins)if(g.state==='chase'){g.gunCD=g.bombCD=1e9;g.kv.set(0,0,0);}};
const drops=()=>T.PICKUPS.filter(P=>P.live).map(P=>P.k+(P.k==='grenade'?' x'+P.n:'')).sort().join(', ')||'none';
const killAll=()=>{for(const g of T.goblins)if(g.state==='chase'||g.state==='dead'){g.state='wait';g.root.visible=false;}for(const P of T.PICKUPS){P.live=false;P.m.visible=false;}for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}};
const kit=()=>A.wpns?A.wpns.join('+')+' in hand '+A.wpn+', grenades '+A.gren:'none';
for(const gob of [false,true]){
  T.setGob(gob);home();S(5);console.log('==',gob?'GNASH':'GUS');
  // the dash: tapped with no direction held goes the way he's looking; holding back goes back
  {home();S(5);A.stam=100;const z0=A.pos.z;tap(KS,3);S(40);console.log('dash, nothing held: moved',f(A.pos.z-z0),' (ahead is +)');
   home();S(5);A.stam=100;const z1=A.pos.z;T.keys.add('KeyS');S(1);tap(KS,3);S(40);T.keys.delete('KeyS');console.log('dash, holding back: moved',f(A.pos.z-z1));}
  if(!gob){home();const g=foe('militia',1.6,1);freeze();press(20);S(30);console.log('bite a militiaman: dead',g.state==='dead',' drops',drops(),' kit',kit());killAll();continue;}
  console.log('starts with',kit(),'  hint:',T.bindHint(false,A).replace(/⟦([^⟧]*)⟧/g,'[$1]'));
  // the club, on a militiaman: his rifle and grenades are dropped
  {home();const g=foe('militia',1.1,1);freeze();press(30);S(30);console.log('club a militiaman: dead',g.state==='dead',' drops',drops());
   const P=T.PICKUPS.filter(P=>P.live);hold([KF],80);S(5);console.log('walk over them: drops left',drops(),' kit',kit());killAll();}
  // the rifle: a goblin 12 ahead takes a shot; behind a wall, it doesn't
  {home();const g=foe('thief',12,5);freeze();S(2);const h=g.hp;press(4);S(20);console.log('rifle at a thief 12 ahead: hp',h,'->',g.hp);
   for(let v=-2;v<=2;v++)for(let y=0;y<3;y++)put(v,y,6);const h2=g.hp;S(40);press(4);S(20);console.log('and with a wall between: hp',h2,'->',g.hp);clear();
   S(40);const h3=g.hp;press(4);S(40);press(4);S(20);console.log('wall gone, two more shots: hp',h3,'->',g.hp,' dead',g.state==='dead',' drops',drops());
   const n=A.wpns.length;hold([KF],170);S(5);console.log('walk over the dagger:',kit(),' new weapons',A.wpns.length-n);killAll();}
  // a second militiaman, killed when he's already got a rifle: just grenades
  {home();A.wpn='rifle';const g=foe('militia',6,1);freeze();S(30);press(4);S(20);console.log('shoot a militiaman with a rifle already: drops',drops());killAll();}
  // the weapon button goes round what he's got
  {home();const seq=[A.wpn];for(let i=0;i<3;i++){nextW();S(3);seq.push(A.wpn);}console.log('weapon button:',seq.join(' > '));
   {const w0=A.wpn;tap('KeyR',3);S(3);console.log('R:',w0===A.wpn?'no switch':'switched to '+A.wpn);}
   // (the mouse wheel: down the next, up the one before; the D-pad: right the next, left the one before)
   const wh=c=>{for(let i=0;i<3;i++){T.mTap.add(c);S(1);}S(3);},dp=b=>{pads.push(mk(0));S(2);pads[0].buttons[b].pressed=true;S(3);pads[0].buttons[b].pressed=false;S(3);pads.length=0;};
   const sw=[A.wpn];wh('MouseWheelDown');sw.push(A.wpn);wh('MouseWheelDown');sw.push(A.wpn);wh('MouseWheelUp');sw.push(A.wpn);wh('MouseWheelUp');sw.push(A.wpn);console.log('mouse wheel down, down, up, up:',sw.join(' > '));
   const sd=[A.wpn];dp(15);sd.push(A.wpn);dp(14);sd.push(A.wpn);dp(14);sd.push(A.wpn);console.log('d-pad right, left, left:',sd.join(' > '));}
  // the dagger: two a stab
  {home();A.wpn='dagger';const g=foe('prepper',1.1,5);freeze();press(20);S(10);console.log('stab a prepper: hp 5 ->',g.hp);killAll();}
  // grenades: they stack (up to 9), and one thrown at a goblin's feet goes off
  {home();A.gren=0;for(let i=0;i<6;i++){const g=foe('militia',1.5,1);T.damageGoblin(g,5,g.pos.clone(),null,'Clubbed by another goblin');}S(2);console.log('six militiamen down: drops',drops());
   hold([KF],60);S(5);console.log('picked up: grenades',A.gren,' left lying',drops());killAll();
   home();A.cam.pitch=-0.2;const g=foe('thief',8,3);freeze();const gz=g.pos.z,pin=n=>{for(let i=0;i<n;i++){g.pos.z=gz;g.kv.set(0,0,0);S(1);}};const n=A.gren;press(3,'Mouse2');pin(10);const rc=A.gren;
   const wasW=A.wpn;A.wpn='grenade';A.biteCD=0;press(3,'Mouse0');pin(4);press(3,'Mouse0');pin(20);const live=T.SHOTS.filter(Q=>Q.live).length;
   console.log('grenades in the weapon list:',A.wpns.includes('grenade'),' right click throws none:',n,'->',rc,' grenades in hand, attack twice quickly: ->',A.gren,' in the air',live);pin(160);console.log('  the thief 8 ahead, where it lands: hp 3 ->',g.hp,' dead',g.state==='dead',' my hp',A.hp);killAll();
   A.gren=1;A.wpn='grenade';A.biteCD=0;A.cam.pitch=0.15;A.cam.yaw+=Math.PI;press(3,'Mouse0');S(30);console.log('  the last one thrown: grenades',A.gren,' in the list',A.wpns.includes('grenade'),' in hand now',A.wpn);S(200);killAll();A.cam.pitch=0;A.cam.yaw-=Math.PI;}
  // a police officer's handgun: dropped where he falls, picked up, and fired (quicker than the rifle, shorter reach)
  {home();const g=T.goblins.find(q=>q.wkit&&q.state==='wait'&&!q.special&&!q.cultist);
   g.state='chase';g.root.visible=true;g.civ=false;g.foeKind=null;g.hp=4;g.stun=0;g.kv.set(0,0,0);g.pos.set(A.pos.x,F,A.pos.z+1.1);T.foeArm(g,T.GOB_FOES.police);g.gunCD=1e9;
   console.log('officer armed:',g.arms===T.GOB_FOES.police);const n=A.wpns.length;T.damageGoblin(g,9,g.pos.clone(),null,'Clubbed by another goblin');S(2);console.log('club an officer: drops',drops());
   hold([KF],60);S(5);console.log('walk over it:',kit(),' new weapons',A.wpns.length-n);
   const g2=foe('thief',12,5);freeze();S(30);const h=g2.hp;press(4);S(25);press(4);S(20);console.log('handgun at a thief 12 ahead, twice: hp',h,'->',g2.hp);
   const g3=foe('thief',34,5);g3.pos.x=A.pos.x;freeze();S(30);const h3=g3.hp;press(4);S(20);console.log('and one 34 ahead, past its reach: hp',h3,'->',g3.hp);
   const seq=[A.wpn];for(let i=0;i<4;i++){nextW();S(3);seq.push(A.wpn);}console.log('weapon button:',seq.join(' > '));killAll();}
  // the Fireball Spellbook: a cultist drops it, and it's conjured (the weapon's cast) then flies and bends after the nearest enemy
  {home();const W=T.WEAPONS.spellbook;const c=T.freeCultist(8);T.cultSpawn(c,null,0);c.pos.set(A.pos.x,F,A.pos.z+1.1);c.state='chase';c.gunCD=1e9;c.stun=0;c.kv.set(0,0,0);
   T.damageGoblin(c,9,c.pos.clone(),null,'Clubbed by another goblin');S(2);console.log('kill a cultist: drops',drops());
   hold([KF],60);S(5);console.log('walk over it:',kit());
   while(A.wpn!=='spellbook'){nextW();S(3);}
   const g=foe('thief',14,5);g.pos.x=A.pos.x+0.6;freeze();S(30);g.pos.set(A.pos.x+0.6,F,A.pos.z+14);g.stun=9;const h=g.hp;let live=-1,t=0,x0=null,x1=null,B=null;T.mHeld.add('Mouse0');
   for(let i=0;i<200;i++){S(1);t+=16.7;const f=T.FIREB.find(f=>f.live);if(f){if(live<0){live=t;B=f;x0=f.pos.x;}x1=f.pos.x;}if(i===3)T.mHeld.delete('Mouse0');if(g.hp<h||live>0&&!B.live)break;}
   console.log('cast straight ahead (a still thief 14 ahead, 0.6 right of the aim): ball out after',live<0?'never':(live/1000).toFixed(2)+'s','(cast',W.cast+'s), bent',x1==null?'-':(x1-x0).toFixed(2),'toward it, thief hp',h,'->',g.hp);
   let casts=0;const seen=new Set(T.FIREB.filter(f=>f.live));T.mHeld.add('Mouse0');S(4);T.mHeld.delete('Mouse0');for(let i=0;i<60;i++){S(1);for(const f of T.FIREB)if(f.live&&!seen.has(f)){seen.add(f);casts++;}}
   console.log('pressed again at once: new balls',casts,'(comes again every',W.every+'s)');
   killAll();home();S(200);const g2=foe('thief',24,5);g2.pos.x=A.pos.x;freeze();S(10);const h2=g2.hp;press(4);S(150);console.log('one 24 ahead: hp',h2,'->',g2.hp);
   killAll();
   // (a kill drops the first weapon on its list he hasn't got: with the book, a cultist's dagger; an officer's club never drops)
   const kc=()=>{home();const c=T.freeCultist(8);T.cultSpawn(c,null,0);c.pos.set(A.pos.x,F,A.pos.z+1.1);c.state='chase';c.gunCD=1e9;c.stun=0;c.kv.set(0,0,0);
     T.damageGoblin(c,9,c.pos.clone(),null,'Clubbed by another goblin');S(2);const d=drops();killAll();return d;};
   const wp=A.wpns.slice();A.wpns=wp.filter(k=>k!=='dagger');A.wpn=A.wpns[0];console.log('book, no dagger: a cultist drops',kc());
   A.wpns=wp.slice();console.log('book and dagger: a cultist drops',kc());
   A.wpns=wp.filter(k=>k!=='spellbook');A.wpn=A.wpns[0];console.log('dagger, no book: a cultist drops',kc());
   A.wpns=wp.slice();A.wpn=wp[0];
   {home();const g=T.goblins.find(q=>q.wkit&&q.state==='wait'&&!q.special&&!q.cultist);g.state='chase';g.root.visible=true;g.civ=false;g.foeKind=null;g.hp=4;g.stun=0;g.kv.set(0,0,0);g.pos.set(A.pos.x,F,A.pos.z+1.1);T.foeArm(g,T.GOB_FOES.police);g.gunCD=1e9;
    T.damageGoblin(g,9,g.pos.clone(),null,'Clubbed by another goblin');S(2);console.log('with the handgun already: an officer drops',drops(),'(the club never drops)');killAll();}}
  // a prepper's bomb is a grenade now
  {home();const g=foe('prepper',8,5);T.foeThrow(g,A,T.FOES.prepper.bomb);const Q=T.SHOTS.filter(Q=>Q.live);console.log("prepper throws:",Q.map(q=>q.kind+' ('+q.cause+')').join(', '));killAll();}
}
process.exit(0);   // (the stub DOM can't take down the pickup labels' timers)
