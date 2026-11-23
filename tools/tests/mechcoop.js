// Two players in Mobile Gears, split screen: each pilots their own, both on their own controllers, and the two can't
// walk or boost through each other. node mechcoop.js
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,setGobP,venues,tenvSpawnOne,tenvClear,drvFind,drvEnter,MG,mHeld,setChar,setChar2,charName,bodyOf,bindHint,freeFoe,foeSpawn,PICKUPS,damageGoblin,charTint};\n})();');
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
const errs=[];console.error=(...a)=>errs.push(a.join(" ").slice(0,200));
eval(src);const T=window.__t;let now=1000;
const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};
const sec=s=>S(Math.round(s*60));
const pad=(i,ax,btn)=>{const P=pads[i];P.axes=ax.slice();P.buttons.forEach((b,k)=>{b.pressed=btn.includes(k);b.value=b.pressed?1:0;});};
const none=()=>{pad(0,[0,0,0,0],[]);pad(1,[0,0,0,0],[]);};
const f=(v,n=1)=>v.toFixed(n);
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;T.DT.invuln=true;T.DT.host=1;   // (Passive: nobody comes after anyone, but goblins can still be hurt, as Pacifist would stop)
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
S(30);T.setGobP(A,true);T.setGobP(B,true);S(10);
// (a flat stone floor, open above, 80 along x)
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z);
for(let x=X0-50;x<=X0+50;x++)for(let z=Z0-16;z<=Z0+16;z++){for(let y=F-3;y<F;y++)T.setRaw(x,y,z,STONE);for(let y=F;y<F+30;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
A.pos.set(X0+.5,F,Z0+.5);A.cam.yaw=Math.PI;S(20);
// (two Mobile Gears from the debug menu, one put 40 to the west and one 40 to the east, each player beside their own)
console.log('spawn:',T.tenvSpawnOne('mech').split('.')[0]);S(20);console.log('spawn:',T.tenvSpawnOne('mech').split('.')[0]);S(20);
const V=T.venues.get('tenvMechs'),[M1,M2]=V.mechs;
const place=(M,x,p)=>{M.x=x;M.z=Z0+.5;M.y=F;M.vx=M.vz=M.vy=0;M.h=0;p.pos.set(x-(T.MG.r+0.8),F+0.2,Z0+.5);p.vy=0;p.state='walk';};
place(M1,X0-20,A);place(M2,X0+20,B);S(10);
const DA=T.drvFind(A),DB=T.drvFind(B);if(DA)T.drvEnter(A,DA);if(DB)T.drvEnter(B,DB);S(20);
console.log('two goblins, two Mobile Gears: player one in',A.drv&&A.drv.k,' player two in',B.drv&&B.drv.k,' each their own',!!(A.drv&&B.drv&&A.drv.o!==B.drv.o),
  ' each display shown',!!(A.ui.drvHud&&!A.ui.drvHud.el.hidden),!!(B.ui.drvHud&&!B.ui.drvHud.el.hidden),' each own energy bar',!!(A.ui.drvHud.mg&&B.ui.drvHud.mg&&A.ui.drvHud.mg.el!==B.ui.drvHud.mg.el));
const Ma=A.drv.o,Mb=B.drv.o;
// (facing each other: player one looks east, player two west; both push forward on their own sticks)
A.cam.yaw=-Math.PI/2;B.cam.yaw=Math.PI/2;A.cam.pitch=B.cam.pitch=-0.1;
const gap=()=>Math.max(Math.abs(Ma.x-Mb.x),Math.abs(Ma.z-Mb.z));let least=1e9;
const watch=s=>{for(let i=0;i<Math.round(s*60);i++){S(1);least=Math.min(least,gap());}};
pad(0,[0,-1,0,0],[]);pad(1,[0,-1,0,0],[]);watch(6);none();
console.log('walking at each other: closest',f(least,2),'(each is',f(T.MG.r*2,1),'wide)  overlapped',least<T.MG.r*2-0.05,'  player one went',f(Ma.x-(X0-20)),' player two',f((X0+20)-Mb.x));
// (back apart, then player one quick-boosts into player two standing still)
Ma.x=X0-20;Mb.x=X0+20;Ma.vx=Mb.vx=0;sec(0.5);least=1e9;Ma.en=Mb.en=T.MG.enMax;
pad(0,[0,-1,0,0],[2]);watch(0.1);pad(0,[0,-1,0,0],[]);watch(0.5);pad(0,[0,-1,0,0],[2]);watch(0.1);pad(0,[0,-1,0,0],[]);watch(1.5);none();
console.log('quick boosting into the other: closest',f(least,2),' overlapped',least<T.MG.r*2-0.05,'  the other moved',f(Math.abs(Mb.x-(X0+20)),2));
// (each player's controls only move their own: player two alone pushes left)
{const a0=Ma.x,b0=Mb.z;pad(1,[-1,0,0,0],[]);sec(1.5);none();console.log('player two strafes: theirs moved',f(Math.abs(Mb.z-b0)),' player one\'s',f(Math.abs(Ma.x-a0),2));}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
