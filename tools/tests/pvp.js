let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,frame,setRaw,get,DT,setChar,setChar2,charName,setPvp,pvpOn,doBite,stompImpact,fallImpact,gobAttack,gobArms,gobShoot,gunRound,foeBoom,pvpBy,lockTargets,lockAlive,obitList,setGobP,AB,get score(){return score}};\n})();');
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
console.error=()=>{};
eval(src);const T=window.__t;let now=1000;
const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
// PvP (Options, player/pvp.js): two players face to face on a stone floor, one attacking the other with each kind of
// attack, with the switch off (no harm, as before) and on (each lands, cut down to player size), then a kill credited
// in the obituary, the lock-on list, and Gus and Gertie (and Gnash and Grizzle) doing exactly the same to each other.
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
S(30);
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z);
const floor=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){for(let y=F-4;y<F;y++)if(T.get(x,y,z)!==STONE)T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};
// A at the middle facing +z (heading 0), B gap blocks in front of it facing back
const home=(gap=2.2)=>{floor();for(const [p,dz,h] of [[A,0,0],[B,gap,Math.PI]]){p.pos.set(X0+.5,F,Z0+.5+dz);p.vy=0;p.state='walk';p.t=0;p.heading=h;p.cam.yaw=h+Math.PI;p.cam.pitch=0;p.hp=20;p.mvx=p.mvz=0;p.stam=100;p.exhausted=false;
  p.deadT=0;p.hbRuns=[];p.crashT=0;p.lockT=null;p.dodge=null;p.drv=null;p.pvpT=null;p.grounded=true;p.knockT=0;p.root.visible=true;}S(1);
  for(const p of [A,B]){p.pos.y=F;}};
const f=(v,n=1)=>v.toFixed(n);
// one attack by A at B: B's health lost
const hit=(name,fn,gap)=>{home(gap);const h0=B.hp;fn();S(20);return h0-B.hp;};   // (and a moment after: some attacks' hitboxes play out over frames)
const ATTACKS=[
  ['bite',()=>{A.biteStep=0;T.doBite(A);}],
  ['uppercut',()=>{A.biteStep=2;T.doBite(A);}],
  ['stomp',()=>T.stompImpact(A,0)],
  ['full stomp',()=>T.stompImpact(A,2)],
  ['ground pound',()=>T.fallImpact(A,10,true,0)],
  ['crash landing',()=>T.fallImpact(A,16,false,0)],
  ['heli gun round',()=>{T.gunRound({},A,A.pos.x,A.pos.y+1.5,A.pos.z,2,0,'Gunned down from a helicopter','test',{x:B.pos.x,y:B.pos.y+1.2,z:B.pos.z});}],
  ['tank shell blast',()=>T.foeBoom(B.pos.x,B.pos.y+0.5,B.pos.z+1,4.5,4,'Blown up by a goblin in a tank',T.pvpBy(A),0,60)],
];
const GOB_ATTACKS=[
  ['club',()=>{T.gobArms(A).wpn='club';T.gobAttack(A);S(30);},1.3],
  ['dagger',()=>{const k=T.gobArms(A);k.wpns=['club','dagger','handgun','rifle'];k.wpn='dagger';T.gobAttack(A);},1.2],
  ['rifle',()=>{const k=T.gobArms(A);k.wpns=['club','dagger','handgun','rifle'];k.wpn='rifle';A.camera.position.set(A.pos.x,A.pos.y+1.2,A.pos.z);A.cam.yaw=Math.PI;A.cam.pitch=0;T.gobShoot(A);},6],
];
const table=(label,list)=>{
  for(const on of [false,true]){T.setPvp(on);
    console.log(label,'PvP',on?'on ':'off',list.map(([n,fn,g])=>n+' '+f(hit(n,fn,g))).join(' | '));}};
console.log('switch starts',T.pvpOn()?'on':'off');
table('Gus at Gertie  ',ATTACKS);
T.setChar('gertie');T.setChar2('gus');table('Gertie at Gus  ',ATTACKS);
T.setChar('goblin');T.setChar2('gus');table('Gnash at Gus   ',GOB_ATTACKS);
T.setChar('gus');T.setChar2('goblin');table('Gus at Gnash   ',ATTACKS);
// a kill, and who the obituary blames; the killer's points
T.setChar('gus');T.setChar2('gertie');T.setPvp(true);
{home();B.hp=2;const s0=T.score;A.biteStep=2;T.doBite(A);const o=T.obitList()[0];
 console.log('kill: Gertie',B.state,'| obituary:',o&&o.name,'-',o&&o.cause,'by',o&&o.killer,'| points',T.score-s0);
 S(60*7);console.log('6s later Gertie',B.state,'hp',B.hp);}
// own blast doesn't blame yourself
{home();A.hp=2;T.foeBoom(A.pos.x,A.pos.y+0.5,A.pos.z,4,4,'Blown up by a goblin in a tank',T.pvpBy(A),0,60);const o=T.obitList()[0];console.log('own shell: Gus',A.state,'| obituary by "'+(o&&o.killer)+'"');S(60*7);}
// lock-on: the other player only with PvP on
for(const on of [false,true]){T.setPvp(on);home(6);console.log('lock-on PvP',on?'on ':'off','B in Gus\'s targets:',T.lockTargets(A,24).some(o=>o.t===B),' still locked:',T.lockAlive(B));}
// a guest's switch is the host's: here (not online) it's just the setting
T.setPvp(false);console.log('switched off:',T.pvpOn());
process.exit(0);
