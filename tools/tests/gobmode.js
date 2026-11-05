let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,mHeld,P_size:()=>[P_HX,P_HZ,P_HY]};\n})();');
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
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// Play as a goblin (the debug switch): the view, the body's size, what's left of a hippo's powers, and above all how the
// other goblins take it. Each goblin test runs twice, as a hippo first to show the test can tell the difference.
const STONE=3,KF='KeyW',KL='KeyA',KC='KeyC',KJ='Space',KS='ShiftLeft';
const ABIL0=JSON.stringify(T.ABIL),W0=T.AB.walk.speed,J0=T.AB.jump.launch;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){T.setRaw(x,F-1,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
let built=[];const put=(x,y,z)=>{T.setRaw(X0+x,F+y,Z0+z,STONE);built.push([X0+x,F+y,Z0+z]);},clear=()=>{for(const q of built)T.setRaw(q[0],q[1],q[2],0);built=[];};
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;};
const hold=(ks,n)=>{for(const k of ks)T.keys.add(k);S(n);for(const k of ks)T.keys.delete(k);};
const press=n=>{T.mHeld.add('Mouse0');S(n);T.mHeld.delete('Mouse0');};
const f=(v,n=2)=>v.toFixed(n);
T.setGob(true);home();S(5);
console.log('size',T.P_size().map(v=>f(v)).join(' '),' hippo model hidden',!A.rig.visible,' eye above feet',f(A.camera.position.y-A.pos.y),' near',A.camera.near);
// (yaw PI looks along +z)
{const z0=A.pos.z;hold([KF],60);const v=(A.pos.z-z0)/(60*0.0167);console.log('walk speed',f(v),' heading follows the camera',f(A.heading-(A.cam.yaw+Math.PI)));}
{home();const x0=A.pos.x,z0=A.pos.z;hold([KL],40);console.log('strafe left: sideways',f(A.pos.x-x0),'forward',f(A.pos.z-z0));}
{home();A.cam.yaw=Math.PI/2+Math.PI;S(2);const x0=A.pos.x;hold([KF],30);console.log('turned, forward now along x',f(A.pos.x-x0));}
{home();const z0=A.pos.z;hold([KF,KS],60);console.log('sprint speed',f((A.pos.z-z0)/(60*0.0167)),' stamina',f(A.stam,0));}
// a one-wide, two-high doorway, a step, a hop, a wall
for(let v=-6;v<=6;v++)if(v)for(let y=0;y<5;y++)put(v,y,4);for(let y=2;y<5;y++)put(0,y,4);
home();hold([KF],220);console.log('through a door 1 wide and 2 high: z',f(A.pos.z-Z0),'(wall at 4)');clear();
for(let v=-6;v<=6;v++)for(let y=0;y<5;y++)put(v,y,3);
home();hold([KF],120);console.log('stops at a wall: z',f(A.pos.z-Z0),' eye in a block',T.solidAt(Math.floor(A.camera.position.x),Math.floor(A.camera.position.y),Math.floor(A.camera.position.z)));
{let m=0;home();A.cam.yaw=Math.PI+0.5;T.keys.add(KF);for(let i=0;i<90;i++){S(1);const q=A.camera.position;m=Math.max(m,q.z);}T.keys.delete(KF);console.log('slides along it at an angle: x moved',f(A.pos.x-X0-.5),' furthest eye z',f(m-Z0));}
clear();
for(let v=-3;v<=3;v++)for(let u=3;u<9;u++)put(v,0,u);
home();hold([KF],120);console.log('walks up a one-block step: y',f(A.pos.y-F));clear();
{home();S(2);let top=0;hold([KJ],1);for(let i=0;i<70;i++){S(1);top=Math.max(top,A.pos.y-F);}console.log('hop height',f(top));
 home();S(2);hold([KJ],1);S(12);hold([KJ],1);let t2=0;for(let i=0;i<60;i++){S(1);t2=Math.max(t2,A.pos.y-F);}console.log('jump again in mid-air: height',f(t2),'(same means no second jump)');}
// none of a hippo's powers
{for(let v=-1;v<=1;v++)put(v,0,3);home();const blocks=()=>built.filter(q=>T.get(q[0],q[1],q[2])).length,b0=blocks();
 hold(['KeyE'],40);S(30);const stEnd=A.state;hold([KJ],1);hold(['KeyE'],40);S(60);
 hold([KF,KS],90);press(60);console.log('stomp, pound, charge at a wall and club it: blocks left',blocks(),'of',b0,' state',A.state,stEnd);clear();}
// the goblins
const crowd=(civ,n)=>{const L=T.goblins.filter(g=>!!g.civ===civ&&!g.staff).slice(0,n);L.forEach((g,i)=>{const a=i/n*6.28;g.state='chase';g.pos.set(A.pos.x+Math.sin(a)*3,F,A.pos.z+Math.cos(a)*3);g.hp=g.hpMax=civ?3:4;g.t=20;g.indoor=false;g.vendor=null;g.fleeing=false;g.wt=null;g.idle=0;g.root.visible=true;g.stun=0;g.kv.set(0,0,0);g.vy=0;g.medic=g.ff=g.news=g.cop=null;});return L;};
const parked=()=>{for(const g of T.goblins)if(g.state==='chase'||g.state==='dead'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
for(const gob of [false,true]){
  T.setGob(gob);home();S(2);
  parked();let L=crowd(true,6);let ran=0,flee=0;S(120);for(const g of L){const d=Math.hypot(g.pos.x-A.pos.x,g.pos.z-A.pos.z);if(g.fleeing)flee++;if(d>5.5)ran++;}
  console.log(gob?'GOBLIN':'HIPPO ','townsfolk 3 away, 2s later: arms up and fleeing',flee,'/6, got well away',ran,'/6');
  parked();home();S(2);L=crowd(false,6);S(300);const nearBy=L.filter(g=>Math.hypot(g.pos.x-A.pos.x,g.pos.z-A.pos.z)<2.3).length;
  console.log(gob?'GOBLIN':'HIPPO ','6 hostile goblins, 5s later: hp',A.hp,'of 20, crowding round',nearBy);
  parked();
}
T.setGob(true);home();S(2);
// the club
{parked();const g=crowd(false,1)[0];g.pos.set(A.pos.x,F,A.pos.z+1.1);const log=[];for(let i=0;i<4;i++){press(2);S(40);g.pos.set(A.pos.x,F,A.pos.z+1.1);log.push(g.state==='dead'?'dead':g.hp);}
 console.log('clubbing a goblin in front, hp after each blow',log.join(' '),' it fled',!!g.fleeing,' hp mine',A.hp);parked();}
{parked();const g=crowd(true,1)[0];g.pos.set(A.pos.x,F,A.pos.z-1.5);const h=g.hp;press(2);S(40);console.log('a goblin behind me is not hit: hp',g.hp,'of',h);parked();}
// climbing, with the eye never inside the wall
{for(let v=-5;v<=5;v++)for(let y=0;y<6;y++)for(let u=3;u<8;u++)put(v,y,u);home();let inBlock=0,peak=0,st=new Set();T.keys.add(KF);T.keys.add(KC);
 for(let i=0;i<500;i++){S(1);st.add(A.state);const q=A.camera.position;if(T.solidAt(Math.floor(q.x),Math.floor(q.y),Math.floor(q.z)))inBlock++;peak=Math.max(peak,A.pos.y-F);if(A.grounded&&A.pos.y-F>5.9&&A.state==='walk')break;}
 T.keys.delete(KF);T.keys.delete(KC);S(10);console.log('climb a 6-high block: reached',f(peak),' on top',f(A.pos.y-F),' states',[...st].join(','),' frames with the eye in a block',inBlock);clear();}
// looking up, and back to being a hippo
{home();A.cam.pitch=1.4;S(2);console.log('can look up to',f(A.cam.pitch));}
T.setGob(false);S(3);
console.log('back as a hippo: size',T.P_size().map(v=>f(v)).join(' '),' model shown',A.rig.visible,' near',A.camera.near,' abilities as they were',JSON.stringify(T.ABIL)===ABIL0,' speeds',T.AB.walk.speed===W0&&T.AB.jump.launch===J0);
{T.setGob(true);A.cam.pitch=1.4;T.setGob(false);console.log('pitch clamped back to',f(A.cam.pitch));home();const z0=A.pos.z;hold([KF],40);console.log('walks like a hippo again: moved',f(A.pos.z-z0));}
process.exit(0);   // (the stub's message boxes can't take the timers still running)
