let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__ev=s=>eval(s);window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,ABIL,AB,DT,setGob,mHeld,freeFoe,foeSpawn,PICKUPS,SHOTS,FOES,damageGoblin,gobDrop,foeArm,GOB_FOES,WEAPONS};\n})();');
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
class Q{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}setFromAxisAngle(a,t){const s=Math.sin(t/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(t/2);return this}copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}}
class V3{project(){return this}fromBufferAttribute(a,i){const A=a.array||a.a;this.x=A[i*3];this.y=A[i*3+1];this.z=A[i*3+2];return this}applyMatrix4(m){const e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z+e[12];this.y=e[1]*x+e[5]*y+e[9]*z+e[13];this.z=e[2]*x+e[6]*y+e[10]*z+e[14];return this}setFromMatrixPosition(o){this.x=o.position.x;this.y=o.position.y;this.z=o.position.z;return this}normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}applyQuaternion(q){const x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this}constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}clone(){return new V3(this.x,this.y,this.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}setScalar(s){return this.set(s,s,s)}}
class Rot extends V3{constructor(){super();this.order='XYZ'}}
class Col{constructor(r,g,b){if(typeof r==='number'&&g===undefined)this.setHex(r);else{this.r=r||0;this.g=g||0;this.b=b||0;}}setHex(h){this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this}copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}clone(){return new Col(this.r,this.g,this.b)}lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this}multiplyScalar(k){this.r*=k;this.g*=k;this.b*=k;return this}getHexString(){return [this.r,this.g,this.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')}}
class Mat{dummy(){}dispose(){}constructor(o={}){Object.assign(this,o);this.color=new Col();this.emissive=new Col();this.opacity=o.opacity??1}}
class O3{rotateX(){return this}updateMatrixWorld(){}get matrixWorld(){return {position:this.position,elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}}lookAt(){}traverse(f){f(this);for(const c of this.children)c.traverse?c.traverse(f):f(c);}remove(){}constructor(g,m){this.matrix=new M4();this.layers={set(){},enable(){}};this.quaternion=new Q();this.userData={};this.position=new V3();this.rotation=new Rot();this.scale=new V3(1,1,1);this.children=[];this.visible=true;this.geometry=g||{dispose(){}};this.material=m}add(c){this.children.push(c);if(c&&typeof c==="object")c.parent=this;return this}remove(){}}
class M4{makeTranslation(){return this}compose(){return this}makeRotationAxis(){return this}makeScale(){return this}multiply(){return this}premultiply(){return this}multiplyMatrices(){return this}makeRotationY(){return this}setPosition(){return this}copy(){return this}}
const THREE={CylinderGeometry:class{translate(){return this}rotateX(){return this}dispose(){}},ShaderChunk:{common:'',project_vertex:'mvPosition = modelViewMatrix * mvPosition;'},Material:class{},ConeGeometry:class{dispose(){}translate(){return this}rotateX(){return this}},DataTexture:class{constructor(){this.needsUpdate=false}},RGBAFormat:1023,InstancedBufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n}},SphereGeometry:class{dispose(){}},ShaderMaterial:class{constructor(o){Object.assign(this,o)}},Matrix4:M4,InstancedMesh:class extends O3{get isMesh(){return true}constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false,array:new Float32Array(n*16)}}setMatrixAt(){}setColorAt(){this.instanceColor={needsUpdate:false}}},Quaternion:Q,Vector4:class{constructor(x,y,z,w){this.set(x,y,z,w)}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}},Vector2:V3,Vector3:V3,Color:Col,Group:O3,Mesh:class extends O3{get isMesh(){return true}},Scene:class extends O3{},LineSegments:O3,
 MeshBasicMaterial:Mat,MeshLambertMaterial:Mat,LineBasicMaterial:Mat,
 BoxGeometry:class{constructor(w=1,h=1,d=1){this.p=[w,h,d]}computeBoundingBox(){const[w,h,d]=this.p;this.boundingBox={min:{x:-w/2,y:-h/2,z:-d/2},max:{x:w/2,y:h/2,z:d/2}}}setAttribute(){}dispose(){}translate(){return this}rotateX(){return this}},RingGeometry:class{dispose(){}},CircleGeometry:class{dispose(){}},EdgesGeometry:class{constructor(){this.attributes={position:{array:new Float32Array(72).map((_,i)=>(i%3===0?(i>>4&1):i%3===1?(i>>3&1):(i>>2&1))-0.5),count:24}}}dispose(){}},PlaneGeometry:class{dispose(){}},
 BufferGeometry:class{setDrawRange(){}constructor(){this.attributes={}}setAttribute(n,a){this.attributes[n]=a}setIndex(){}dispose(){}},BufferAttribute:class{constructor(a){this.array=a}setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}getX(i){return this.array[i*3]}getY(i){return this.array[i*3+1]}getZ(i){return this.array[i*3+2]}},Points:class extends O3{},Object3D:class extends O3{updateMatrix(){this.matrix={elements:[this.scale.x,0,0,0,0,this.scale.y,0,0,0,0,this.scale.z,0,this.position.x,this.position.y,this.position.z,1]}}},PointsMaterial:Mat,Float32BufferAttribute:class{constructor(a){this.a=a;this.array=a;this.count=a.length/3}},
 CanvasTexture:class{constructor(){this.offset=new V3();this.repeat=new V3()}},NearestFilter:1,RepeatWrapping:1,DoubleSide:2,
 Plane:class{constructor(n,c){this.normal=n;this.constant=c}},Fog:class{constructor(c,n,f){this.color=new Col();this.near=n;this.far=f}},
 PerspectiveCamera:class extends O3{updateProjectionMatrix(){}},
 WebGLRenderer:class{get capabilities(){return {getMaxAnisotropy:()=>8}}clearDepth(){}setClearColor(){}get domElement(){return {clientWidth:640,clientHeight:360,width:0,height:0}}getPixelRatio(){return 1}setPixelRatio(){}setSize(){}render(){}setScissorTest(){}setViewport(){}setScissor(){}},
 HemisphereLight:class extends O3{constructor(){super();this.color=new Col();this.groundColor=new Col();this.intensity=1}},DirectionalLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}}};
const listeners={};
const el=()=>({querySelectorAll:()=>[],closest:()=>null,matches:()=>false,contains:()=>false,attrs:{},kids:[],setAttribute(k,v){this.attrs[k]=v},style:{setProperty(k,v){this[k]=v}},hidden:false,textContent:'',innerHTML:'',classList:{contains(){return false},add(){},remove(){},toggle(){}},append(...k){this.kids.push(...k)},insertBefore(){},querySelector:()=>el(),focus(){},dataset:{},
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
// The weapons added after the first ones (enemies/weapons.js): the Katana, Large Club, Shotgun, Assault Rifle, Sniper
// Rifle, Bazooka and Landmines, and reloading. Gnash first: each gun's magazine run down, reloaded by itself and by the
// button, switching away stopping a reload; each new weapon on a thief; landmines planted, armed, set off by an enemy and
// not by him; drops and the loadout; his first-person view through a reload. Then enemies carrying each one (none do in
// the game yet: a made-up kind for each, as guards makes them): bursts, reloads, rockets, pellets, a planted mine, the
// heavy blows; and every Dev tab animation each would get.
const STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
// (the floor, put back after each blast: a crater left by the bazooka or a mine would swallow the next drop)
const floor=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-30;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(!T.get(x,y,z))T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};floor();
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;A.relT=0;A.biteT=0;A.biteCD=0;};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const tap=(k,n=3)=>{T.keys.add(k);S(n);T.keys.delete(k);S(2);};
const f=(v,n=2)=>v.toFixed(n);
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
const foe=(k,d,hp,dx=0)=>{const g=T.freeFoe(k,8);T.foeSpawn(g,k,null,0);g.pos.set(A.pos.x+dx,F,A.pos.z+d);g.heading=Math.PI;g.gunCD=g.bombCD=g.mineCD=1e9;g.stun=0;g.kv.set(0,0,0);if(hp)g.hp=hp;return g;};
const freeze=()=>{for(const g of T.goblins)if(g.state==='chase'){g.gunCD=g.bombCD=g.mineCD=1e9;g.kv.set(0,0,0);g.stun=9;}};
const killAll=()=>{for(const g of T.goblins)if(g.state==='chase'||g.state==='dead'){g.state='wait';g.root.visible=false;}for(const P of T.PICKUPS){P.live=false;P.m.visible=false;}for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}E('minesClear()');floor();};
const W=T.WEAPONS,NEW=['bigclub','katana','shotgun','arifle','sniper','bazooka','landmine'],GUNS=Object.keys(W).filter(k=>W[k].kind==='gun');
const ammo=k=>E('gobAmmo')(A,k);
const arm=()=>{A.wpns=E('GOB_WPN_ORDER').slice();A.mines=6;A.gren=0;A.ammo={};A.relT=0;};
const hint=()=>E('bindHint')(false,A).replace(/⟦([^⟧]*)⟧/g,'[$1]');
T.setGob(true);home();S(5);arm();
console.log('== GNASH');
A.wpn='shotgun';console.log('hint with the shotgun:',hint());A.wpn='katana';console.log('hint with the katana:',hint());
// each gun: fired till it's empty (pressing again each time it's ready), then reloaded by itself, then full
for(const k of GUNS){home();arm();A.wpn=k;S(20);const w=W[k];let shots=0,t=0;
  for(let i=0;i<(w.player.auto?w.mag*w.every*60*3:w.mag*4+20)&&ammo(k)>0;i++){const a=ammo(k);if(w.player.auto){T.mHeld.add('Mouse0');S(1);t++;}else{press(2);t+=2;const n=Math.ceil(w.every*60);S(n);t+=n;}if(ammo(k)<a)shots+=a-ammo(k);}
  T.mHeld.delete('Mouse0');let w0=0;while(!(A.relT>0)&&w0<40){S(1);w0++;}const rl=A.relT>0,dur=A.relDur;let n=0;while(A.relT>0&&n<600){S(1);n++;}
  console.log(k.padEnd(9),'mag',String(w.mag).padStart(2),'fired',String(shots).padStart(2),'in',f(t/60),'s; reloading after the last',rl,'(its reload '+(dur||0)+' s); full again',ammo(k)===w.mag);}
// the reload button with rounds still in it; switching weapons stops a reload; pressing with it empty starts one
{home();arm();A.wpn='rifle';S(20);press(2);S(30);const a=ammo('rifle');tap('KeyX');const on=A.relT>0;tap('KeyR');
 console.log('reload button with',a,'left: reloading',on,'| switched to',A.wpn,'mid-reload: still reloading',A.relT>0,'| rifle rounds',ammo('rifle'));
 while(A.wpn!=='rifle')tap('KeyR');A.ammo.rifle=0;S(2);A.relT=0;press(2);console.log('attack with it empty: reloading',A.relT>0,', rounds',A.ammo.rifle);S(200);
 A.ammo.rifle=W.rifle.mag;tap('KeyX');console.log('reload button with it full: reloading',A.relT>0);}
// the new weapons on thieves
{home();arm();A.wpn='bigclub';S(20);const g=foe('thief',1.2,9);freeze();press(4);S(70);console.log('large club on a thief (9 hp):',9-g.hp,'damage, it is',W.bigclub.dmg);killAll();}
{home();arm();A.wpn='katana';S(20);const g=foe('thief',1.1,9,-0.6),g2=foe('thief',1.1,9,0.6);freeze();press(4);S(40);console.log('katana on two thieves side by side (9 hp):',9-g.hp,'and',9-g2.hp,'damage, it is',W.katana.dmg);killAll();}
{home();arm();A.wpn='shotgun';S(20);const g=foe('thief',4,30);freeze();press(2);S(70);const g2=foe('thief',16,30);freeze();press(2);S(30);console.log('shotgun: a thief 4 ahead took',30-g.hp,', one 16 ahead',30-g2.hp,'('+W.shotgun.pellets+' pellets of',W.shotgun.dmg+')');killAll();}
{home();arm();A.wpn='arifle';S(20);const g=foe('thief',10,99);freeze();const a=ammo('arifle');T.mHeld.add('Mouse0');S(60);T.mHeld.delete('Mouse0');S(5);
 console.log('assault rifle held a second: fired',a-ammo('arifle'),', a thief 10 ahead took',99-g.hp,', the view climbed',f(A.cam.pitch,3),'rad');killAll();}
{home();arm();A.wpn='sniper';S(20);const g=foe('thief',28,9);freeze();press(2);S(30);console.log('sniper at a thief 28 ahead (9 hp):',9-g.hp,'damage, dead',g.state==='dead');killAll();}
{home();arm();A.wpn='bazooka';S(20);const g=foe('thief',12,9),g2=foe('thief',13,9,1.4);freeze();press(2);S(2);const R=T.SHOTS.find(Q=>Q.live&&Q.kind==='rocket');S(60);
 console.log('bazooka at a thief 12 ahead: rocket',!!R,', thief hp 9 ->',g.hp,', one beside it ->',g2.hp,', my hp',A.hp,', loaded',ammo('bazooka'),', reloading',A.relT>0);killAll();}
{home();arm();A.wpn='bazooka';S(20);for(let y=0;y<3;y++)for(let v=-2;v<=2;v++)T.setRaw(X0+v,F+y,Z0+4,STONE);press(2);S(40);
 console.log('bazooka at a wall 4 ahead: blocks left of 15:',[0,1,2].reduce((s,y)=>s+[-2,-1,0,1,2].filter(v=>T.get(X0+v,F+y,Z0+4)).length,0),', my hp',A.hp);
 killAll();}
// landmines
{home();arm();A.wpn='landmine';S(20);press(2);S(130);const M=E('MINES').filter(m=>m.live);console.log('plant a landmine: mines 6 ->',A.mines,', in the ground',M.length,', armed after',W.landmine.arm,'s:',!!M[0]&&M[0].armed);
 const m=M[0];if(m){A.pos.set(m.x,F,m.z);S(30);console.log('walk on to my own: still there',m.live,', my hp',A.hp);
 home();const g=foe('thief',3,9);g.stun=0;g.pos.set(m.x,F,m.z);S(3);console.log('a thief steps on it: gone off',!m.live,', thief',g.state==='dead'?'dead':'hp '+g.hp);}killAll();
 home();arm();A.mines=1;A.wpn='landmine';S(5);press(2);S(70);console.log('plant the last one: mines',A.mines,', carrying it still',A.wpns.includes('landmine'),', in hand',A.wpn);killAll();
 home();arm();A.wpn='landmine';S(5);const g=foe('thief',2.5,99);g.arms={weapons:['club'],hitBy:'x'};g.stun=0;press(2);S(110);const m2=E('MINES').find(q=>q.live);
 console.log('a thief chasing me over a fresh one: in the ground',!!m2,m2?'armed '+m2.armed:'');killAll();}
// drops: a kind carrying landmines leaves one or two; picked up they go in his hand as well
{home();arm();A.wpns=['club'];A.wpn='club';A.mines=0;const g=foe('thief',1.5,1);g.arms={weapons:['club','landmine'],hitBy:'x'};T.damageGoblin(g,9,g.pos.clone(),null,'Clubbed by another goblin');S(2);
 const P=T.PICKUPS.filter(P=>P.live).map(P=>P.k+' x'+P.n);T.keys.add('KeyW');S(60);T.keys.delete('KeyW');S(3);console.log('a landmine carrier killed: drops',P.join(', '),'| picked up: mines',A.mines,', weapons',A.wpns.join('+'));killAll();}
{home();arm();A.wpns=['club'];A.wpn='club';const g=foe('thief',1.5,1);g.arms={weapons:['katana','shotgun'],gun:{near:6,aim:0.6,cause:'x'},hitBy:'x'};T.damageGoblin(g,9,g.pos.clone(),null,'Clubbed by another goblin');S(2);
 console.log('a katana and shotgun carrier killed: drops',T.PICKUPS.filter(P=>P.live).map(P=>P.k).join(', '));T.keys.add('KeyW');S(60);T.keys.delete('KeyW');S(3);console.log('  picked up:',A.wpns.join('+'),', shotgun loaded',ammo('shotgun'));killAll();}
// the loadout: switches for the weapons, counts for grenades and landmines
{const L=E('GOB_LOAD');const was=JSON.stringify(L);L.w.katana=true;L.w.sniper=true;L.mines=3;L.gren=2;A.wpns=null;E('gobArms')(A);
 console.log('loadout with a katana, sniper, 3 mines, 2 grenades:',A.wpns.join('+'),'| mines',A.mines,'grenades',A.gren,'| mended from junk:',JSON.stringify(E('gloadFix')({w:{katana:1,landmine:true},mines:99,gren:-3})));
 const o=JSON.parse(was);for(const k in L)delete L[k];Object.assign(L,o);A.wpns=null;E('gobArms')(A);arm();}
// his own view through a reload: the magazine out and back, the rocket gone once fired and back once reloaded
{home();arm();A.wpn='rifle';S(20);A.ammo.rifle=0;tap('KeyX',1);let lo=0,hid=false;while(A.relT>0){S(1);const T2=A.gb.tags.rifle.mag;lo=Math.min(lo,T2.position.y);if(!T2.visible)hid=true;}S(2);
 console.log('rifle reload, first person: magazine down to',f(lo),', out of sight',hid,', home again',A.gb.tags.rifle.mag.position.y===0&&A.gb.tags.rifle.mag.visible);
 A.wpn='bazooka';S(20);const L=A.gb.tags.bazooka.load;A.biteCD=0;S(2);const v0=L.visible;press(2);S(3);const v1=L.visible;S(30);while(A.relT>0)S(1);S(2);console.log('bazooka rocket shown: loaded',v0,', fired',v1,', reloaded',L.visible);
 A.wpn='shotgun';A.biteCD=0;S(20);press(2);let pm=0;for(let i=0;i<40;i++){S(1);pm=Math.max(pm,A.gb.tags.shotgun.pump.position.z);}console.log('shotgun pump racked back',f(pm),'after a shot');
 A.wpn='sniper';A.biteCD=0;S(20);press(2);let bz=0;for(let i=0;i<70;i++){S(1);bz=Math.max(bz,A.gb.tags.sniper.bolt.position.z);}console.log('sniper bolt drawn back',f(bz),'after a shot');
 A.wpn='handgun';A.biteCD=0;S(20);T.mHeld.add('Mouse0');let sl=0;for(let i=0;i<10;i++){S(1);sl=Math.max(sl,A.gb.tags.handgun.slide.position.z);}T.mHeld.delete('Mouse0');console.log('handgun slide back',f(sl),'as it fires');}
killAll();
// ==== the sniper's scope, and what the code review found (Nov 2026) ====
console.log('== SCOPE AND FIXES');
home();killAll();
E("window.__dirs=[];window.__sw=0;(()=>{const f0=fireRound;fireRound=function(o){window.__dirs.push(o.dir);return f0.apply(this,arguments);};const s0=shockwave;shockwave=function(){window.__sw++;return s0.apply(this,arguments);};})()");
const armS=(L,k)=>{A.wpns=L;A.wpn=k;A.ammo={};A.relT=0;A.biteCD=0;A.biteT=0;A.gren=3;A.mines=2;};
const viewDir=()=>{const cp=Math.cos(A.cam.pitch);return{x:-Math.sin(A.cam.yaw)*cp,y:Math.sin(A.cam.pitch),z:-Math.cos(A.cam.yaw)*cp};};
const offV=d=>{const v=vw||viewDir();return Math.acos(Math.max(-1,Math.min(1,d.x*v.x+d.y*v.y+d.z*v.z)));};
let vw=null;const fire=()=>{S(110);A.biteCD=0;A.ammo.sniper=5;E('window.__dirs.length=0');vw=viewDir();press(2);S(3);return E('window.__dirs').slice();};   // (waiting out the bolt first; the view as it was before the kick)   // (waiting out the bolt first)
// (the scope: right click held with the sniper in hand looks down it; no grenade thrown; the look slowed to match)
{armS(['sniper','shotgun'],'sniper');S(5);const g0=A.gren,y0=A.cam.yaw;E('look')(A,100,0,0.0024);const yawFree=Math.abs(A.cam.yaw-y0);A.cam.yaw=y0;
 T.mHeld.add('Mouse2');S(30);const sc=A.scope,fov=A.scFov,y1=A.cam.yaw;E('look')(A,100,0,0.0024);const yawSc=Math.abs(A.cam.yaw-y1);A.cam.yaw=y1;
 console.log('sniper, right click held: scope up',f(sc),'view',f(fov,0),'degrees (from 72)  grenades',g0,'->',A.gren,' the look',f(yawSc/yawFree),'as fast');
 const on=[0,1,2].map(()=>offV(fire()[0]));T.mHeld.delete('Mouse2');S(20);
 const offs=[0,1,2,3,4,5].map(()=>offV(fire()[0]));
 console.log('  through the scope, off the middle',on.map(v=>f(v,4)).join(' '),' | off it',offs.map(v=>f(v,3)).join(' '),'(most',W.sniper.player.hip+')');
 E('look')(A,0,0,0);console.log('  let go: scope',f(A.scope),' view',A.scFov?f(A.scFov,0):'normal',' stomp with the shotgun in hand throws again:');
 A.wpn='shotgun';S(3);const g1=A.gren;press(3,'Mouse2');S(10);console.log('    grenades',g1,'->',A.gren);killAll();}
// (the shotgun's pattern aimed steeply up: as tall as it's wide, round the view's own up rather than flattened)
{home();armS(['shotgun'],'shotgun');A.cam.pitch=1.2;S(3);E('window.__dirs.length=0');A.biteCD=0;press(2);S(3);const D=E('window.__dirs').slice(),v=viewDir(),rx=Math.cos(A.cam.yaw),rz=-Math.sin(A.cam.yaw),ux=-rz*v.y,uy=rz*v.x-rx*v.z,uz=rx*v.y;
 let sr=0,su=0;for(const d of D){sr+=Math.abs(d.x*rx+d.z*rz);su+=Math.abs(d.x*ux+d.y*uy+d.z*uz);}
 console.log('shotgun aimed 69 degrees up: pellets',D.length,' spread across',f(sr/D.length,3),' up and down',f(su/D.length,3));A.cam.pitch=0;killAll();}
// (the Large Club's slam and landmines only on the ground; in the air a plain swing, and no mine)
{home();armS(['bigclub','landmine'],'bigclub');S(5);E('window.__sw=0');A.biteCD=0;press(2);S(40);const swG=E('window.__sw');
 home();A.biteCD=0;S(5);A.pos.y=F+4;A.vy=0;A.grounded=false;E('window.__sw=0');press(2);S(3);const swA=E('window.__sw');S(60);
 home();A.wpn='landmine';A.biteCD=0;S(5);A.pos.y=F+4;A.vy=0;A.grounded=false;const m0=A.mines;press(2);S(3);const inAir=A.mines;S(60);A.biteCD=0;S(5);press(2);S(40);
 console.log('large club: shockwaves on the ground',swG,' in the air',swA,'| landmines',m0,'-> jumping',inAir,'-> on the ground',A.mines);killAll();}
// (a mine under the big vehicles: a tank's box over it sets it off; a soft box, a wreck or a helicopter overhead don't)
{const tryBox=(b)=>{E('minesClear()');const M=E('mineLay')(X0+30.5,F,Z0+.5,{side:'g',cause:'test',k:'landmine'});M.t=99;E('updateMines')(0.02);
   M.y=F;const B=Object.assign({x:M.x,z:M.z,tx:0,tz:1,y0:F,top:F+2.5,hx:1.6,hz:2.6,proxy:{alive:true}},b);E('TRAIN_BOXES').push(B);E('updateMines')(0.02);E('TRAIN_BOXES').pop();const went=!M.live;E('minesClear()');floor();return went;};
 console.log('landmine under a tank',tryBox({}),' a soft box',tryBox({soft:true}),' a wreck',tryBox({proxy:{alive:false}}),' a helicopter 10 up',tryBox({y0:F+10,top:F+12}),' beside it',tryBox({x:X0+36.5}));}
// (changing the loadout keeps what's in each magazine and the gun in hand)
{home();const L=E('GOB_LOAD'),was=JSON.stringify(L);L.w.rifle=true;E('gobRearm')(A);A.wpn='rifle';A.ammo.rifle=2;L.w.katana=!L.w.katana;E('gobRearm')(A);
 console.log('loadout changed with 2 rounds in the rifle: in hand',A.wpn,' rounds',E('gobAmmo')(A,'rifle'));Object.assign(L,JSON.parse(was));E('gobRearm')(A);}
// (a new action's default key left off a key the player already gave another move: Reload's X here, saved on Jump)
{const B0=JSON.parse(JSON.stringify(E('BINDS'))),sv=JSON.parse(JSON.stringify(E('defaultBinds()')));delete sv.reload;sv.jump.kb=['Space','KeyX'];
 const gi=localStorage.getItem;localStorage.getItem=k=>k==='goblin-binds-v1'?JSON.stringify(sv):null;E('loadBinds()');localStorage.getItem=gi;const R=E('BINDS').reload;
 console.log('an old save with X on Jump: Reload keys',JSON.stringify(R.kb),' pad',JSON.stringify(R.pad),' Jump keeps',JSON.stringify(E('BINDS').jump.kb));
 E('loadBinds()');console.log('  with no save: Reload keys',JSON.stringify(E('BINDS').reload.kb));}
killAll();
// ==== enemies, a made-up kind for each new weapon ====
console.log('== ENEMIES');
const kindOf=w=>{const K=W[w].kind;return K==='gun'?{weapons:['dagger',w],gun:{near:6,aim:0.6,cause:'Shot'},hitBy:'Stabbed'}:K==='mine'?{weapons:['club',w],hitBy:'Clubbed'}:{weapons:[w],hitBy:'Hit'};};
T.setGob(false);home();S(5);
for(const w of NEW){home();killAll();const melee=W[w].kind==='melee',D=melee?1.4:14,F2=kindOf(w),g=foe('militia',D,99);g.arms=F2;E('foeFresh')(g);g.gunCD=0;g.mineCD=0;g.stun=0;
  let hits=0,dmg=0,shots=0,rockets=0,reloads=0,bursts=0,mines=0,booms=0,mag=null;const seen=new Set();
  for(let i=0;i<60*12;i++){const h=A.hp;A.pos.set(X0+.5,F,Z0+.5);A.state='walk';
    const am=E('MINES').find(m=>m.live&&m.armed);if(am)A.pos.set(am.x,F,am.z);
    S(1);if(A.hp<h){hits++;dmg+=h-A.hp;}if(A.hp<6||A.state==='dead'){A.state='walk';A.hp=20;}
    if(g.mag!==undefined&&mag!==null&&g.mag<mag)shots+=mag-g.mag;if(g.mag!==undefined)mag=g.mag;
    if(g.relT>0&&!g._r)reloads++;g._r=g.relT>0;if(g.burstN>0&&!g._b)bursts++;g._b=g.burstN>0;
    for(const Q of T.SHOTS)if(Q.kind==='rocket'&&Q.live&&(!Q._c||Q.t<Q._t)){rockets++;Q._c=1;}for(const Q of T.SHOTS)Q._t=Q.live?Q.t:9;
    for(const m of E('MINES')){if(m.live&&!seen.has(m)){seen.add(m);mines++;}if(!m.live&&seen.has(m)&&!seen.has('b'+m.n)){seen.add('b'+m.n);booms++;}}
    g.pos.set(X0+.5,F,Z0+.5+D);g.kv.set(0,0,0);if(g.state!=='chase'){g.state='chase';g.root.visible=true;g.hp=99;}}
  console.log(('made-up '+w).padEnd(17),'12 s at '+D+' blocks: hit me',hits,'times for',dmg,
    W[w].kind==='gun'?'| shots '+shots+', reloads '+reloads+(W[w].npc.burst?', bursts '+bursts:'')+(W[w].proj?', rockets '+rockets:''):W[w].kind==='mine'?'| mines planted '+mines+', gone off under me '+booms:'| a blow is '+W[w].dmg);}
killAll();
// ==== the Dev tab: every animation each made-up kind would get ====
{const DK=E('DEV_FOE_KINDS'),look=DK[0].look,out=[];
 for(const w of NEW){const K=E('devFoArms')({k:'mk_'+w,n:'Made-up '+w,hp:4,spd:2.8,look},kindOf(w),['idle','walk','attack'],['death']);DK.push(K);
   for(const a of K.anims){let ok;try{const r=E('devFoSim')('mk_'+w,a);ok=r.N+' frames'+(r.marks.length?', '+[...new Set(r.marks.map(m=>m.row||m.n||m.name||''))].filter(Boolean).join('/'):'');}catch(e){ok='ERROR '+e.message;}out.push((w+' '+E('devFoAnimName')(K,a)).padEnd(40)+ok);}}
 console.log('Dev tab:\n  '+out.join('\n  '));}
process.exit(0);
