// Toppling performance: brings down a tall building and times every frame of its fall (stub THREE, so no real drawing).
// Usage: node toppleperf.js top [nth tallest]  (env FLOOR: the storey it breaks at, RAD: how far to look, DUMP=1: every frame's ms)
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={WX,set leafFall(v){leafFall=v},goblins,players,cars,frame,scene,DT,plotInfo,collapseBuilding,bldgAt,settle,topples,bodies,chunks,meshes,get,G,H,CELL,FH,keys,crush,rebuildSet,buildChunk,updateTopples,updateBodies,updateRubble,updateParts,ckey,CS,edits,save};})();');
src=src.replace("const safe=(name,f)=>{try{f();}","const safe=(name,f)=>{const __t0=process.hrtime.bigint();try{f();global.__sec[name]=(global.__sec[name]||0)+Number(process.hrtime.bigint()-__t0)/1e6;}");global.__sec={};
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
class Q{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}setFromAxisAngle(a,t){const s=Math.sin(t/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(t/2);return this}copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}}
class V3{project(){return this}fromBufferAttribute(a,i){const A=a.array||a.a;this.x=A[i*3];this.y=A[i*3+1];this.z=A[i*3+2];return this}applyMatrix4(m){const e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z+e[12];this.y=e[1]*x+e[5]*y+e[9]*z+e[13];this.z=e[2]*x+e[6]*y+e[10]*z+e[14];return this}setFromMatrixPosition(o){this.x=o.position.x;this.y=o.position.y;this.z=o.position.z;return this}normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}applyQuaternion(q){const x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this}constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}clone(){return new V3(this.x,this.y,this.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}setScalar(s){return this.set(s,s,s)}}
class Rot extends V3{constructor(){super();this.order='XYZ'}}
class Col{constructor(r,g,b){if(typeof r==='number'&&g===undefined)this.setHex(r);else{this.r=r||0;this.g=g||0;this.b=b||0;}}setHex(h){this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this}copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}clone(){return new Col(this.r,this.g,this.b)}lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this}multiplyScalar(k){this.r*=k;this.g*=k;this.b*=k;return this}getHexString(){return [this.r,this.g,this.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')}}
class Mat{dummy(){}dispose(){}constructor(o={}){Object.assign(this,o);this.color=new Col();this.emissive=new Col();this.opacity=o.opacity??1}}
class O3{updateMatrixWorld(){}get matrixWorld(){return {position:this.position,elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}}lookAt(){}traverse(f){f(this);for(const c of this.children)c.traverse?c.traverse(f):f(c);}remove(){}constructor(g,m){this.matrix=new M4();this.layers={set(){},enable(){}};this.quaternion=new Q();this.userData={};this.position=new V3();this.rotation=new Rot();this.scale=new V3(1,1,1);this.children=[];this.visible=true;this.geometry=g||{dispose(){}};this.material=m}add(c){this.children.push(c);if(c&&typeof c==="object")c.parent=this;return this}remove(){}}
class M4{makeTranslation(){return this}compose(){return this}makeRotationAxis(){return this}makeScale(){return this}multiply(){return this}premultiply(){return this}multiplyMatrices(){return this}makeRotationY(){return this}setPosition(){return this}copy(){return this}}
const THREE={CylinderGeometry:class{translate(){return this}rotateX(){return this}dispose(){}},ShaderChunk:{common:'',project_vertex:'mvPosition = modelViewMatrix * mvPosition;'},Material:class{},ConeGeometry:class{dispose(){}translate(){return this}rotateX(){return this}},DataTexture:class{constructor(){this.needsUpdate=false}},RGBAFormat:1023,InstancedBufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n}},SphereGeometry:class{dispose(){}},ShaderMaterial:class{constructor(o){Object.assign(this,o)}},Matrix4:M4,InstancedMesh:class extends O3{get isMesh(){return true}constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false,array:new Float32Array(n*16)}}setMatrixAt(){}setColorAt(){this.instanceColor={needsUpdate:false}}},Quaternion:Q,Vector4:class{constructor(x,y,z,w){this.set(x,y,z,w)}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}},Vector2:V3,Vector3:V3,Color:Col,Group:O3,Mesh:class extends O3{get isMesh(){return true}},Scene:class extends O3{},LineSegments:O3,
 MeshBasicMaterial:Mat,MeshLambertMaterial:Mat,LineBasicMaterial:Mat,
 BoxGeometry:class{constructor(w=1,h=1,d=1){this.p=[w,h,d]}computeBoundingBox(){const[w,h,d]=this.p;this.boundingBox={min:{x:-w/2,y:-h/2,z:-d/2},max:{x:w/2,y:h/2,z:d/2}}}setAttribute(){}dispose(){}translate(){return this}rotateX(){return this}},RingGeometry:class{dispose(){}},CircleGeometry:class{dispose(){}},EdgesGeometry:class{constructor(){this.attributes={position:{array:new Float32Array(72).map((_,i)=>(i%3===0?(i>>4&1):i%3===1?(i>>3&1):(i>>2&1))-0.5),count:24}}}dispose(){}},PlaneGeometry:class{dispose(){}},
 BufferGeometry:class{setDrawRange(){}constructor(){this.attributes={}}setAttribute(n,a){this.attributes[n]=a}setIndex(){}dispose(){}},BufferAttribute:class{constructor(a){this.array=a}setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}getX(i){return this.array[i*3]}getY(i){return this.array[i*3+1]}getZ(i){return this.array[i*3+2]}},Points:class extends O3{},Object3D:class extends O3{updateMatrix(){this.matrix={elements:[this.scale.x,0,0,0,0,this.scale.y,0,0,0,0,this.scale.z,0,this.position.x,this.position.y,this.position.z,1]}}},PointsMaterial:Mat,Float32BufferAttribute:class{constructor(a){this.a=a;this.array=a;this.count=a.length/3}},
 CanvasTexture:class{constructor(){this.offset=new V3();this.repeat=new V3()}},NearestFilter:1,RepeatWrapping:1,DoubleSide:2,
 Plane:class{constructor(n,c){this.normal=n;this.constant=c}},Fog:class{constructor(c,n,f){this.color=new Col();this.near=n;this.far=f}},
 PerspectiveCamera:class extends O3{updateProjectionMatrix(){}},
 WebGLRenderer:class{get capabilities(){return {getMaxAnisotropy:()=>8}}clearDepth(){}setClearColor(){}get domElement(){return {clientWidth:640,clientHeight:360,width:0,height:0}}getPixelRatio(){return 1}setPixelRatio(){}setSize(){}render(){}setScissorTest(){}setViewport(){}setScissor(){}},
 HemisphereLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}},DirectionalLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}}};
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

eval(src);const T=window.__t;let now=1000;
for(const f of els.play.L.click)f();pads.length=0;
for(let i=0;i<60;i++){now+=16.7;T.frame(now);}
T.DT.invuln=true;
const P=T.players[0];
// the tallest buildings within a few plots of Gus
const pcx=Math.floor(P.pos.x/T.CELL),pcz=Math.floor(P.pos.z/T.CELL);
const list=[];const R=+(process.env.RAD||30);
for(let px=pcx-R;px<=pcx+R;px++)for(let pz=pcz-R;pz<=pcz+R;pz++){const I=T.plotInfo(px,pz);(I.b||[]).forEach((b,i)=>{if(b.top>T.G+6)list.push({b,i,px,pz});});}
list.sort((a,b)=>b.b.top-a.b.top);
const mode=process.argv[2]||'top';   // top: fall from above the ground floor, leaning
const nth=+(process.argv[3]||0);
const E=list[nth];const b=E.b;
console.log('building',b.kind||b.type||'',' size',b.x1-b.x0,'x',b.z1-b.z0,'top',b.top-T.G,'plots searched',list.length);
const wx=E.px*T.CELL+(b.x0+b.x1)/2,wz=E.pz*T.CELL+(b.z0+b.z1)/2;
P.pos.set(wx+40,T.G+1,wz+40);
for(let i=0;i<240;i++){now+=16.7;T.frame(now);}
const fr=[];
if(process.env.SNOW){T.WX.snowCover=0.6;T.WX.k.snow=0.65;T.WX.snowClock=5;}if(process.env.LEAF)T.leafFall=+process.env.LEAF;
const B=T.bldgAt(wx,wz);
// take out one side of a low floor by hand, so it leans the way it would in a real fight
const L=T.G+1+T.FH*(+(process.env.FLOOR||2));
const t00=process.hrtime.bigint();
// mode 'into': the tallest building with another tall one close by, toppled toward it
let push={x:1,z:0};
if(mode==='into'){const c=e=>[e.px*T.CELL+(e.b.x0+e.b.x1)/2,e.pz*T.CELL+(e.b.z0+e.b.z1)/2];const [ax,az]=c(E);let best=null;for(const O of list){if(O===E)continue;const [ox,oz]=c(O);const d=Math.hypot(ox-ax,oz-az);if(d>3&&d<70&&(!best||O.b.top>best.O.b.top))best={O,ox,oz,d};}
  if(best){const dx=best.ox-ax,dz=best.oz-az;push=Math.abs(dx)>Math.abs(dz)?{x:Math.sign(dx),z:0}:{x:0,z:Math.sign(dz)};console.log('toppling toward a building',best.O.b.top-T.G,'tall,',best.d.toFixed(0),'away');}}
T.collapseBuilding(B,L,push);
const first=Number(process.hrtime.bigint()-t00)/1e6;
console.log('collapse call',first.toFixed(1),'ms; topples',T.topples.length,'bodies',T.bodies.length,T.topples[0]?('surface '+T.topples[0].n+' blocks '+T.topples[0].blocks.length):'');
const names=['updateTopples','updateBodies','updateRubble','updateParts'];
let maxT=0;let edits0=Object.keys(T.edits).length;
for(let i=0;i<60*20;i++){now+=16.7;const t=process.hrtime.bigint();T.frame(now);const ms=Number(process.hrtime.bigint()-t)/1e6;fr.push(ms);if(ms>(+process.env.SLOW||1e9))console.log('frame',i,ms.toFixed(0),'ms:',Object.entries(global.__sec).filter(e=>e[1]>2).sort((a,c)=>c[1]-a[1]).map(e=>e[0]+' '+e[1].toFixed(0)).join(', '));global.__sec={};maxT=Math.max(maxT,T.topples.length+T.bodies.length);if(!T.topples.length&&!T.bodies.length&&i>60)break;}
const s=[...fr].sort((a,c)=>a-c);
const pc=q=>s[Math.floor(q*(s.length-1))].toFixed(1);
console.log('frames',fr.length,'avg',(fr.reduce((a,c)=>a+c,0)/fr.length).toFixed(1),'ms  p50',pc(.5),'p90',pc(.9),'p99',pc(.99),'worst',pc(1),' edits',Object.keys(T.edits).length-edits0,' most falling at once',maxT);
let t=process.hrtime.bigint();for(let i=0;i<60;i++){now+=16.7;T.frame(now);}console.log('after: avg',(Number(process.hrtime.bigint()-t)/1e6/60).toFixed(1),'ms');
if(process.env.DUMP)console.log(fr.map(x=>x.toFixed(0)).join(' '));
process.exit(0);
