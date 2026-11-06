let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={keys,drvEnter,drvExit,MIL,boxesTouch,PLANE_HP,get TENVB(){return venues.get("tenvPlanes")},get TENVA(){return venues.get("tenvArmy")},tenvVeh,VEH,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
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
const LS={};global.localStorage={getItem:k=>k in LS?LS[k]:(/goblin-city-v/.test(k)?JSON.stringify({seed:12345,edits:{},coll:{},down:[],dest:{},test:[],tenv:{boxes:[]}}):null),setItem(k,v){LS[k]=String(v)},removeItem(k){delete LS[k]}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};

// Testing Environment: boots empty and flat; structures spawn in front of Gus with their dressing; enemies spawn ahead of Gus
// Vehicles running into each other: a tank into a helicopter's tail, a car into a parked plane, a plane taxiing into a
// tank, a tank into a parked plane, a helicopter's tail swung through a tank. Each says whether they ended up overlapping.
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(3);P.hp=20;
const parts={tank:[{c:0,hx:1.6,hz:2.7,y0:0,y1:2.3}],heli:[{c:0,hx:1.0,hz:2.4,y0:0,y1:2.2},{c:-4.2,hx:0.35,hz:1.9,y0:1.5,y1:3.25}]};
const boxesOf=o=>o.isMil?parts[o.kind].map(a=>({x:o.x+Math.sin(o.h)*a.c,z:o.z+Math.cos(o.h)*a.c,h:o.h,hx:a.hx,hz:a.hz,y0:o.y+a.y0,y1:o.y+a.y1}))
  :o.isPlane?[{x:o.g.position.x,z:o.g.position.z,h:o.g.rotation.y,hx:1.25,hz:9.9,y0:o.g.position.y,y1:o.g.position.y+3.65}]
  :[{x:o.pos.x,z:o.pos.z,h:o.heading,hx:o.hx,hz:o.hz,y0:o.pos.y,y1:o.pos.y+(o.hy||1.4)}];
const overlap=(a,b)=>{let m=0;for(const p of boxesOf(a))for(const q of boxesOf(b)){if(p.y0>=q.y1||q.y0>=p.y1)continue;if(T.boxesTouch(p.x,p.z,p.h,p.hx,p.hz,q.x,q.z,q.h,q.hx,q.hz))m=1;}return m;};
const mil=k=>{T.TS.n=1;T.TS.vm='park';const V=T.TENVA,n0=V?V.mil.length:0;T.menuOpen=true;T.tenvVeh(k);T.menuOpen=false;return T.TENVA.mil[n0];};
const plane=()=>{T.TS.n=1;const V=T.TENVB,n0=V?V.pl.length:0;T.menuOpen=true;T.tenvVeh('plane');T.menuOpen=false;return T.TENVB&&T.TENVB.pl[n0];};
const car=()=>{T.TS.n=1;T.TS.vm='park';const n0=T.cars.filter(c=>c.alive).length;T.menuOpen=true;T.tenvVeh('car');T.menuOpen=false;return T.cars.filter(c=>c.alive&&c.parked).pop();};
const clear=()=>{if(P.drv)T.drvExit(P);T.tenvClear();run(0.5);P.pos.set(0,46,0);P.cam.yaw=Math.PI;run(0.5);};
// drive o (D) for s seconds holding W, watching whether it overlaps t
const drive=(D,t,s,label)=>{T.drvEnter(P,D);T.keys.add('KeyW');let ov=0,frames=0;for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);P.hp=20;if(overlap(D.o,t))ov++;frames++;}T.keys.delete('KeyW');
  const hp=o=>o.isMil?o.hp:o.isPlane?o.hp:o.hp;console.log(label.padEnd(34),'frames overlapping',ov+'/'+frames,'| health now',Math.round(hp(D.o)),Math.round(hp(t)),'| dead',!!(D.o.dead||D.o.alive===false),!!(t.dead||t.alive===false));T.drvExit(P);run(0.3);};
const put=(o,x,z,h)=>{if(o.isMil){o.x=x;o.z=z;o.h=h;o.home={x,z,h};}else if(o.isPlane){o.g.position.set(x,45,z);o.g.rotation.set(0,h,0);}else{o.pos.set(x,45,z);o.heading=h;o.speed=0;}};
// 1. a tank driven at the tail of a helicopter sat side on across its path
{clear();const tk=mil('tank'),he=mil('heli');put(tk,0,20,0);put(he,4.2,32,Math.PI/2);run(0.5);drive({k:'tank',o:tk,V:tk.V},he,6,'tank into a helicopter\'s tail');}
// 2. a tank driven at a helicopter's body
{clear();const tk=mil('tank'),he=mil('heli');put(tk,0,20,0);put(he,0,32,Math.PI/2);run(0.5);drive({k:'tank',o:tk,V:tk.V},he,6,'tank into a helicopter\'s body');}
// 3. a car driven into the side of a parked plane
{clear();const pl=plane(),c=car();if(!pl||!c)console.log('no plane or car',!!pl,!!c);else{put(pl,0,40,Math.PI/2);put(c,0,20,0);run(0.5);drive({k:'car',o:c},pl,4,'car into a parked plane');}}
// 4. a plane taxiing into a parked tank
{clear();const pl=plane(),tk=mil('tank');if(!pl)console.log('no plane');else{put(pl,0,0,0);put(tk,0,60,Math.PI/2);run(0.5);drive({k:'plane',o:pl},tk,6,'plane taxiing into a tank');}}
// 5. a tank driven into the side of a parked plane
{clear();const pl=plane(),tk=mil('tank');if(!pl)console.log('no plane');else{put(pl,0,40,Math.PI/2);put(tk,0,25,0);run(0.5);drive({k:'tank',o:tk,V:tk.V},pl,6,'tank into a parked plane');}}
// 6. a car driven into a parked tank
{clear();const tk=mil('tank'),c=car();if(!c)console.log('no car');else{put(tk,0,40,Math.PI/2);put(c,0,20,0);run(0.5);drive({k:'car',o:c},tk,4,'car into a parked tank');}}
// 7. a helicopter flown low into a parked tank
{clear();const he=mil('heli'),tk=mil('tank');put(he,0,15,0);put(tk,0,35,Math.PI/2);run(0.5);T.drvEnter(P,{k:'heli',o:he,V:he.V});run(3);P.cam.yaw=Math.PI;drive({k:'heli',o:he,V:he.V},tk,4,'helicopter flown into a tank');}
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
