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
// Landmines set off by players and by anything that hits them, and the debug menu's Infinite ammo on Gnash's grenades,
// landmines and magazines (enemies/mines.js, player/gob-weapons.js). Each line says what happened; the expected answer
// is in brackets.
const STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
const floor=()=>{for(let x=X0-24;x<=X0+40;x++)for(let z=Z0-30;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(!T.get(x,y,z))T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};floor();
const home=(yaw=0)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;A.relT=0;A.biteT=0;A.biteCD=0;A.grenCD=0;A.dead=false;};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const clear=()=>{for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}E('minesClear()');floor();};
const lay=(dx,dz,armed=true,o={})=>{const M=E('mineLay')(X0+.5+dx,F,Z0+.5+dz,Object.assign({side:'p',cause:'test',k:'landmine'},o));if(armed){M.t=99;M.armed=true;}return M;};
const arm=()=>{A.wpns=E('GOB_WPN_ORDER').slice();A.mines=6;A.gren=3;A.ammo={};A.relT=0;};
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
T.setGob(true);home();S(5);arm();
// ---- Infinite ammo ----
for(const inf of [false,true]){T.DT.infAmmo=inf;home();arm();clear();
  A.wpn='landmine';E('gobPlant')(A);const m=A.mines;
  E('gobThrow')(A);const g=A.gren;S(5);A.grenCD=0;A.gren=0;const n0=T.SHOTS.filter(Q=>Q.live&&Q.kind==='grenade').length;E('gobThrow')(A);const n1=T.SHOTS.filter(Q=>Q.live&&Q.kind==='grenade').length;
  A.wpn='rifle';const r0=E('gobAmmo')(A,'rifle');E('gobShoot')(A);const r1=E('gobAmmo')(A,'rifle');
  console.log('Infinite ammo',inf?'on: ':'off:','mines 6 ->',m,inf?'[6]':'[5]','| grenades 3 ->',g,inf?'[3]':'[2]','| thrown with none left',n1>n0,inf?'[true]':'[false]','| rifle',r0,'->',r1,inf?'[same]':'[one less]');
  S(200);clear();}
T.DT.infAmmo=false;
// ---- stepping on them ----
// (whoever planted it: safe on it till stepping off once, then it goes off under him)
{home();arm();clear();A.wpn='landmine';E('gobPlant')(A);const M=E('MINES').find(m=>m.live);A.pos.set(M.x,F,M.z);S(150);const stood=M.live;
 A.pos.set(M.x+3,F,M.z);S(5);A.pos.set(M.x,F,M.z);A.hp=20;S(3);console.log('Gnash on his own fresh mine: still there after 2.5 s',stood,'[true] | back on it after stepping off: gone off',!M.live,'[true], hurt',A.hp<20,'[true]');}
// (a player who didn't plant it: Gus and Gertie on a player's mine and on an enemy's; Gnash on another's)
T.setGob(false);
for(const who of [0,1])for(const side of ['p','g']){home();clear();A.who=who;const M=lay(0,0,true,{side});S(3);console.log((who?'Gertie':'Gus')+' steps on '+(side==='p'?'a player\'s':'an enemy\'s')+' mine: gone off',!M.live,'[true]');}
A.who=0;
{home();clear();const M=lay(0,4,true);S(3);console.log('Gus 4 away from one: gone off',!M.live,'[false]');}
T.setGob(true);
{home();clear();const M=lay(0,0,true,{owner:{active:false}});S(3);console.log('Gnash steps on another player\'s mine: gone off',!M.live,'[true]');}
// ---- hitting them ----
// (shot: Gnash's rifle aimed at one in the ground 8 ahead, still arming; one 3 to the side of where he aims)
{home();arm();clear();A.wpn='rifle';const M=lay(0,-8,false);const c=E('shipEye')(A);A.cam.pitch=Math.atan2(M.y+0.1-c.y,Math.hypot(M.x-c.x,M.z-c.z));E('gobShoot')(A);
 console.log('rifle round at a mine 8 ahead (still arming): gone off',!M.live,'[true]');}
{home();arm();clear();A.wpn='rifle';const M=lay(3,-8,true);const c=E('shipEye')(A);A.cam.pitch=Math.atan2(M.y+0.1-c.y,8);E('gobShoot')(A);
 console.log('rifle round 3 to one side of a mine: gone off',!M.live,'[false]');}
// (a mounted gun's round, as a helicopter's from above)
{home();clear();const M=lay(0,-10,true);E('fireRound')({x:M.x,y:M.y+12,z:M.z+6,at:{x:M.x,y:M.y,z:M.z},by:A,dmg:2,cause:'test',gobs:true,vehs:true,breaks:true});
 console.log('a vehicle gun\'s round at one: gone off',!M.live,'[true]');}
// (an enemy's round aimed at a player passes one by)
{home();clear();const M=lay(0,-4,true);E('fireRound')({x:M.x,y:M.y+0.1,z:M.z-6,at:{x:A.pos.x,y:A.pos.y+1,z:A.pos.z},tgt:A,hit:1,pdmg:0,cause:'test',id:null});
 console.log('an enemy\'s round at Gnash over one: gone off',!M.live,'[false]');}
// (melee: Gnash's club, dagger, large club; Gus's bite; any player attack's area)
for(const w of ['club','dagger','bigclub']){home();arm();clear();A.wpn=w;S(3);const M=lay(0,-1.2,false);A.biteCD=0;press(3);S(40);console.log('Gnash swings his',w,'at one 1.2 ahead: gone off',!M.live,'[true]');}
T.setGob(false);
{home();clear();S(3);const M=lay(0,-2.2,false);A.biteCD=0;press(3);S(40);console.log('Gus bites one 2.2 ahead: gone off',!M.live,'[true]');}
{home();clear();S(3);const M=lay(0,-12,false);E('pvpArea')(A,M.x,M.z+0.5,2,3,'test',F);console.log('any player attack (pvpArea) reaching one, PvP off: gone off',!M.live,'[true]');}
T.setGob(true);
// (blasts: one beside a mine sets it off, and the two beside that in a chain; one well away stays)
{home();clear();const M1=lay(0,-10,true),M2=lay(2.5,-10,true),M3=lay(5,-10,true),M4=lay(14,-10,true);E('foeBoom')(M1.x-1,F,M1.z,3,5,'test',null,0,30);
 console.log('a blast beside a mine: it, and the chain of two beside it, gone off',!M1.live,!M2.live,!M3.live,'[true true true] | one 13 off still there',M4.live,'[true]');}
{home();arm();clear();A.wpn='club';A.cam.pitch=0.25;A.gren=1;E('gobThrow')(A);const G=T.SHOTS.find(Q=>Q.live&&Q.kind==='grenade');let M=null,t=0;
 while(G.live&&t<400){S(1);t++;if(!M&&Math.hypot(G.v.x,G.v.y,G.v.z)<0.5)M=lay(G.pos.x-X0-.5+1.5,G.pos.z-Z0-.5,false);}
 console.log('a grenade come to rest 1.5 from one: gone off',!!M&&!M.live,'[true]');}
// (a player's fireball bursting on it)
{home();arm();clear();const M=lay(0,-6,true);const W=T.WEAPONS.spellbook;E('fireball')(A.pos.x,F+1,A.pos.z-1,M.x,M.y,M.z,{W,pl:A,by:null,cause:'test'});S(60);console.log('a fireball at one: gone off',!M.live,'[true]');}
// ---- vehicles on them: a tank's, a helicopter's (landed and well up) and a Mobile Gear's box over one ----
{const tryBox=b=>{clear();const M=lay(30,0,true);const B=Object.assign({x:M.x,z:M.z,tx:0,tz:1,y0:F,top:F+2.5,hx:1.6,hz:2.6,proxy:{alive:true}},b);E('TRAIN_BOXES').push(B);E('updateMines')(0.02);E('TRAIN_BOXES').pop();return !M.live;};
 console.log('a tank over one',tryBox({}),'[true] | a helicopter landed',tryBox({y0:F+0.2,top:F+3}),'[true] | 10 up',tryBox({y0:F+10,top:F+12}),'[false] | a Mobile Gear',tryBox({y0:F,top:F+8,hx:1.4,hz:1.4}),'[true]');}
console.log('done');
