let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__ev=s=>eval(s);window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,ABIL,AB,DT,setGob,mHeld,freeFoe,foeSpawn,PICKUPS,SHOTS,FOES,damageGoblin,gobDrop,foeArm,GOB_FOES,WEAPONS};\n})();');
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
class Q{setFromUnitVectors(){return this}constructor(){this.x=0;this.y=0;this.z=0;this.w=1}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}setFromAxisAngle(a,t){const s=Math.sin(t/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(t/2);return this}copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}}
class V3{transformDirection(){return this}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.lengthSq())}project(){return this}fromBufferAttribute(a,i){const A=a.array||a.a;this.x=A[i*3];this.y=A[i*3+1];this.z=A[i*3+2];return this}applyMatrix4(m){const e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z+e[12];this.y=e[1]*x+e[5]*y+e[9]*z+e[13];this.z=e[2]*x+e[6]*y+e[10]*z+e[14];return this}setFromMatrixPosition(o){this.x=o.position.x;this.y=o.position.y;this.z=o.position.z;return this}normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}applyQuaternion(q){const x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this}constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}clone(){return new V3(this.x,this.y,this.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}setScalar(s){return this.set(s,s,s)}}
class Rot extends V3{constructor(){super();this.order='XYZ'}}
class Col{getHex(){return (Math.round(this.r*255)<<16)|(Math.round(this.g*255)<<8)|Math.round(this.b*255)}constructor(r,g,b){if(typeof r==='number'&&g===undefined)this.setHex(r);else{this.r=r||0;this.g=g||0;this.b=b||0;}}setHex(h){this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this}copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}clone(){return new Col(this.r,this.g,this.b)}lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this}multiplyScalar(k){this.r*=k;this.g*=k;this.b*=k;return this}getHexString(){return [this.r,this.g,this.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')}}
class Mat{dummy(){}dispose(){}constructor(o={}){Object.assign(this,o);this.color=new Col();this.emissive=new Col();this.opacity=o.opacity??1}}
class O3{rotateX(){return this}updateMatrixWorld(){}get matrixWorld(){return {position:this.position,elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}}lookAt(){}traverse(f){f(this);for(const c of this.children)c.traverse?c.traverse(f):f(c);}remove(){}constructor(g,m){this.matrix=new M4();this.layers={set(){},enable(){}};this.quaternion=new Q();this.userData={};this.position=new V3();this.rotation=new Rot();this.scale=new V3(1,1,1);this.children=[];this.visible=true;this.geometry=g||{dispose(){}};this.material=m}add(c){this.children.push(c);if(c&&typeof c==="object")c.parent=this;return this}remove(){}}
class M4{constructor(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}makeTranslation(){return this}compose(){return this}makeRotationAxis(){return this}makeScale(){return this}multiply(){return this}premultiply(){return this}multiplyMatrices(){return this}makeRotationY(){return this}setPosition(){return this}copy(){return this}}
const THREE={CylinderGeometry:class{translate(){return this}rotateX(){return this}dispose(){}},ShaderChunk:{common:'',project_vertex:'mvPosition = modelViewMatrix * mvPosition;'},Material:class{},ConeGeometry:class{dispose(){}translate(){return this}rotateX(){return this}},DataTexture:class{constructor(){this.needsUpdate=false}},RGBAFormat:1023,InstancedBufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n}},SphereGeometry:class{dispose(){}},ShaderMaterial:class{constructor(o){Object.assign(this,o)}},Matrix4:M4,InstancedMesh:class extends O3{get isMesh(){return true}constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false,array:new Float32Array(n*16)}}setMatrixAt(){}setColorAt(){if(!this.instanceColor)this.instanceColor={needsUpdate:false,array:new Float32Array(this.count*3)}}},Quaternion:Q,Vector4:class{constructor(x,y,z,w){this.set(x,y,z,w)}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}},Vector2:V3,Vector3:V3,Color:Col,Group:O3,Mesh:class extends O3{get isMesh(){return true}},Scene:class extends O3{},LineSegments:O3,
 MeshBasicMaterial:Mat,MeshLambertMaterial:Mat,LineBasicMaterial:Mat,
 BoxGeometry:class{constructor(w=1,h=1,d=1){this.p=[w,h,d]}computeBoundingBox(){const[w,h,d]=this.p;this.boundingBox={min:{x:-w/2,y:-h/2,z:-d/2},max:{x:w/2,y:h/2,z:d/2}}}setAttribute(){}dispose(){}translate(){return this}rotateX(){return this}},RingGeometry:class{dispose(){}},CircleGeometry:class{dispose(){}},EdgesGeometry:class{constructor(){this.attributes={position:{array:new Float32Array(72).map((_,i)=>(i%3===0?(i>>4&1):i%3===1?(i>>3&1):(i>>2&1))-0.5),count:24}}}dispose(){}},PlaneGeometry:class{setAttribute(){}dispose(){}},
 BufferGeometry:class{setDrawRange(){}constructor(){this.attributes={}}setAttribute(n,a){this.attributes[n]=a}setIndex(){}dispose(){}},BufferAttribute:class{constructor(a){this.array=a}setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}getX(i){return this.array[i*3]}getY(i){return this.array[i*3+1]}getZ(i){return this.array[i*3+2]}},Points:class extends O3{},Object3D:class extends O3{updateMatrix(){this.matrix={elements:[this.scale.x,0,0,0,0,this.scale.y,0,0,0,0,this.scale.z,0,this.position.x,this.position.y,this.position.z,1]}}},PointsMaterial:Mat,Float32BufferAttribute:class{constructor(a){this.a=a;this.array=a;this.count=a.length/3}},
 CanvasTexture:class{constructor(){this.offset=new V3();this.repeat=new V3()}},NearestFilter:1,RepeatWrapping:1,DoubleSide:2,
 Plane:class{constructor(n,c){this.normal=n;this.constant=c}},Fog:class{constructor(c,n,f){this.color=new Col();this.near=n;this.far=f}},
 PerspectiveCamera:class extends O3{updateProjectionMatrix(){}},
 WebGLRenderer:class{get capabilities(){return {getMaxAnisotropy:()=>8}}clearDepth(){}setClearColor(){}get domElement(){return {clientWidth:640,clientHeight:360,width:0,height:0}}getPixelRatio(){return 1}setPixelRatio(){}setSize(){}render(){}setScissorTest(){}setViewport(){}setScissor(){}},
 HemisphereLight:class extends O3{constructor(){super();this.color=new Col();this.groundColor=new Col();this.intensity=1}},DirectionalLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}}};
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
eval(src);const T=window.__t,E=window.__ev;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// The rocket launcher: fired straight, locked on a car by holding its sight on it, a locked rocket homing in on the car
// fired well off to one side, the sight ignoring goblins, an enemy's rocket chasing a player in a vehicle. node launchert.js
// (header from weapons2.js) The weapons added after the first ones (enemies/weapons.js): the Katana, Large Club, Shotgun, Assault Rifle, Sniper
// Rifle, Bazooka and Landmines, and reloading. Gnash first: each gun's magazine run down, reloaded by itself and by the
// button, switching away stopping a reload; each new weapon on a thief; landmines planted, armed, set off by an enemy and
// not by him; drops and the loadout; his first-person view through a reload. Then enemies carrying each one (none do in
// the game yet: a made-up kind for each, as guards makes them): bursts, reloads, rockets, pellets, a planted mine, the
// heavy blows; and every Dev tab animation each would get.
const STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
// (the floor, put back after each blast: a crater left by the rocket launcher or a mine would swallow the next drop)
const floor=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-30;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(!T.get(x,y,z))T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};floor();
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;A.relT=0;A.biteT=0;A.biteCD=0;};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const tap=(k,n=3)=>{T.keys.add(k);S(n);T.keys.delete(k);S(2);};
const f=(v,n=2)=>v.toFixed(n);
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
const foe=(k,d,hp,dx=0)=>{const g=T.freeFoe(k,8);T.foeSpawn(g,k,null,0);g.pos.set(A.pos.x+dx,F,A.pos.z+d);g.heading=Math.PI;g.gunCD=g.bombCD=g.mineCD=1e9;g.stun=0;g.kv.set(0,0,0);if(hp)g.hp=hp;return g;};
const freeze=()=>{for(const g of T.goblins)if(g.state==='chase'){g.gunCD=g.bombCD=g.mineCD=1e9;g.kv.set(0,0,0);g.stun=9;}};
const killAll=()=>{for(const g of T.goblins)if(g.state==='chase'||g.state==='dead'){g.state='wait';g.root.visible=false;}for(const P of T.PICKUPS){P.live=false;P.m.visible=false;}for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}E('minesClear()');floor();};
const W=T.WEAPONS,NEW=['bigclub','katana','shotgun','arifle','sniper','launcher','landmine'],GUNS=Object.keys(W).filter(k=>W[k].kind==='gun');
const ammo=k=>E('gobAmmo')(A,k);
const arm=()=>{A.wpns=E('GOB_WPN_ORDER').slice();A.mines=6;A.gren=0;A.ammo={};A.relT=0;};
T.setGob(true);home();S(5);arm();
const car=(dx,dz)=>{const c=T.cars.find(c=>!c.parkPool)||T.cars[0];c.alive=true;c.respawnT=1e9;c.hp=c.hpMax=30;c.speed=0;c.parked=false;c.pos.set(X0+.5+dx,F,Z0+.5+dz);c.heading=0;return c;};
const fly=(c,n)=>{let hit=false;for(let i=0;i<n;i++){S(1);if(!c.alive||c.hp<30){hit=true;break;}}return hit;};
const park=c=>{c.alive=false;c.pos.set(X0+500,F,Z0+500);};
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}
// fired straight at a car dead ahead, no lock
{home();arm();A.wpn='launcher';S(20);const c=car(0,26);press(2);console.log('straight at a car 26 ahead: hit',fly(c,120),' lock',!!A.lockT);park(c);killAll();}
// fired straight 25 degrees away from a car: a miss
{home();arm();A.wpn='launcher';S(20);const c=car(11,24);press(2);console.log('straight, 25 degrees off a car: hit',fly(c,120));park(c);killAll();}
// the sight held on a car a little off the crosshair: how long till it locks; then turned away and fired: it homes in
{home();arm();A.wpn='launcher';S(20);const c=car(2,26);T.mHeld.add('Mouse2');let t=0;while(!A.lockT&&t<300){S(1);t++;}const lk=A.lockT===c,seen=A.lockMark&&A.lockMark.visible;T.mHeld.delete('Mouse2');S(10);
 console.log('sight on a car 26 off: locked',lk,'after',f(t/60),'s; marker shown',!!seen);
 A.cam.yaw=Math.PI+0.45;S(2);press(2);console.log('  turned 25 degrees away and fired: hit',fly(c,150));park(c);killAll();E('setLock')(A,null);}
// a car out of the cone: never locks
{home();arm();A.wpn='launcher';S(20);const c=car(11,24);T.mHeld.add('Mouse2');S(150);T.mHeld.delete('Mouse2');console.log('sight held 24 degrees off a car: locked',!!A.lockT);park(c);killAll();E('setLock')(A,null);}
// a goblin under the crosshair: the seeker passes it by
{home();arm();A.wpn='launcher';S(20);const g=foe('thief',20,9);freeze();T.mHeld.add('Mouse2');S(150);T.mHeld.delete('Mouse2');console.log('sight held on a goblin: locked',!!A.lockT);killAll();E('setLock')(A,null);}
// a car locked with the lock button instead: a rocket fired off to one side homes in too
{home();arm();A.wpn='launcher';S(20);const c=car(2,18);tap('KeyQ');const L=A.lockT===c;A.cam.yaw=Math.PI+0.3;S(1);press(2);console.log('lock button on a car 18 ahead:',L,' fired 17 degrees off to one side: hit',fly(c,150));park(c);killAll();E('setLock')(A,null);}
// an enemy's rocket at a player in a vehicle chases it; at one on foot it doesn't
{home();const c=car(0,6);const g=foe('thief',30,9);freeze();const Fk={gun:{cause:'test'},weapons:['launcher']};A.drv={k:'car',o:c};
 E('foeShoot')(g,A,Fk);const R=T.SHOTS.filter(q=>q.live).pop();A.drv=null;E('foeShoot')(g,A,Fk);const R2=T.SHOTS.filter(q=>q.live).pop();
 console.log('enemy rocket at a player driving: chases',!!(R&&R.chase),' on foot:',!!(R2&&R2.chase));park(c);killAll();}
// Gertie and Gus can't carry it (a goblin's weapon), and the old bazooka switch carries over in a saved loadout
console.log('saved loadout with the bazooka on: launcher',E('gloadFix')({w:{club:true,bazooka:true}}).w.launcher,' with it off:',E('gloadFix')({w:{club:true,bazooka:false}}).w.launcher);
console.log('done');
process.exit(0);
