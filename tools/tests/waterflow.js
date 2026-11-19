let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get,setRaw,addEdit,get edits(){return edits},chunks,CS,G,H,WATER,AIR,STONE,SAND,NET,players,frame,wfJobs,wfRemoved,wfSeen,updateWater,WF_CAP};\n})();');
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
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
// Water flow (destruction/water-flow.js): knock out a block under or beside water and the water pours in, as far as its
// surface, at most WF_CAP blocks a breach and never more than the body it came from. Prints what each case filled.
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;run(1);
const {G,WATER:W,AIR,STONE}=T;
const dig=(x,y,z)=>{T.setRaw(x,y,z,AIR);T.addEdit(x,y,z,AIR);};   // (as a smash does it)
const put=(x,y,z,b)=>{T.setRaw(x,y,z,b);T.addEdit(x,y,z,b);};
const count=(x0,x1,y0,y1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(T.get(x,y,z)===W)n++;return n;};
const settle=()=>{for(let i=0;i<600&&(T.wfJobs.length||T.wfRemoved.length);i++)run(0.1);};
// 1. the sea: find a column of deep water and the sea bed under it
let sx=null,sz,bed;
for(let r=0;r<6000&&sx===null;r+=37)for(const [x,z] of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r],[r,-r],[-r,r]]){
  if(T.get(x,G,z)!==W||T.get(x,G-3,z)!==W)continue;let y=G;while(T.get(x,y,z)===W)y--;sx=x;sz=z;bed=y;break;}
if(sx===null){console.log('no sea found');process.exit(0);}
A.pos.set(sx+0.5,G+3,sz+0.5);run(1);
const room=(x0,y0,z0,w,h)=>{for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+w;z++)for(let y=y0;y<y0+h;y++)dig(x,y,z);};
// a shaft three deep straight down through the sea bed
dig(sx,bed,sz);dig(sx,bed-1,sz);dig(sx,bed-2,sz);
let t=0;while(t<5&&T.get(sx,bed-2,sz)!==W){run(0.05);t+=0.05;}
console.log('sea shaft: filled',count(sx,sx,bed-2,bed,sz,sz),'of 3 in',t.toFixed(2)+'s','| saved as edits',T.edits[sx+','+(bed-2)+','+sz]===W);
// a room 4 x 4 x 3 carved out under the bed (nothing open to the water yet), then a hole through to it
const bedAt=(x,z)=>{let y=G;while(T.get(x,y,z)===W)y--;return y;};
const rx=sx+3,rb=bedAt(rx,sz),ry=rb-6;room(rx,ry,sz,4,3);settle();
const dry=count(rx,rx+3,ry,ry+2,sz,sz+3);
for(let y=rb;y>=ry+3;y--)dig(rx,y,sz);settle();
console.log('sea room 48: dry before',dry,'after',count(rx,rx+3,ry,ry+2,sz,sz+3),'| shaft',count(rx,rx,ry+3,rb,sz,sz),'of',rb-ry-2);
// a cavern far bigger than one breach may fill: 10 x 10 x 5 = 500
let cx=sx-14;for(const k of [-14,-20,-26,-32,10,16,22,28])if(T.get(sx+k,G,sz)===W){cx=sx+k;break;}
const cb=bedAt(cx,sz),cy=cb-12;room(cx,cy,sz,10,5);settle();
for(let y=cb;y>cy+4;y--)dig(cx,y,sz);settle();
console.log('sea cavern 500: filled',count(cx,cx+9,cy,cy+4,sz,sz+9),'+ shaft',count(cx,cx,cy+5,cb,sz,sz),'of',cb-cy-4,'cap',T.WF_CAP);
// 2. a little tank: 2 x 2 of water on a stone pillar in the air, its stone knocked out from under it
const px=sx+40,pz=sz+40;
const py=G+20;for(let x=px-3;x<=px+3;x++)for(let z=pz-3;z<=pz+3;z++)put(x,py-6,z,STONE);   // (a floor to catch it)
for(let y=py-5;y<py;y++)for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])put(px+a,y,pz+b,STONE);
for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])put(px+a,py,pz+b,W);
settle();dig(px,py-1,pz);settle();
console.log('tank of 4 holed underneath: water below it',count(px-3,px+3,py-6,py-1,pz-3,pz+3),'(at most 4) | tank still',count(px,px+1,py,py,pz,pz+1));
// 3. water held in by a wall, the wall broken at the water's level, a pit dug beside it: fills no higher than the surface
const qx=px+20,qz=pz,qy=G+20;
for(let x=qx-1;x<=qx+8;x++)for(let z=qz-1;z<=qz+3;z++)for(let y=qy-4;y<=qy+3;y++)put(x,y,z,y===qy-4||x===qx-1||x===qx+8||z===qz-1||z===qz+3||x===qx+3?STONE:AIR);   // (a stone box, split in two by a wall at qx+3)
for(let x=qx;x<=qx+2;x++)for(let z=qz;z<=qz+2;z++)for(let y=qy-3;y<=qy;y++)put(x,y,z,W);   // (3 x 3, 4 deep: 36 blocks of water, surface at qy)
settle();dig(qx+3,qy,qz+1);settle();
console.log('walled pool broken at its surface: beside it',count(qx+4,qx+7,qy-3,qy+3,qz,qz+2),'above the surface',count(qx+4,qx+7,qy+1,qy+3,qz,qz+2),'(0) | gap',count(qx+3,qx+3,qy,qy,qz+1,qz+1));
// 4. a block knocked out with no water near it: nothing happens
dig(qx+5,qy+2,qz+1);settle();console.log('dry hole stays dry',T.get(qx+5,qy+2,qz+1)===AIR);
// 5. online: the host sends each filled block to its guests, as a smashed one
const out=[];T.NET.mode=1;T.NET.guests.set('g',{net:{out}});
dig(sx+1,bed,sz);for(let i=0;i<20&&T.wfRemoved.length+T.wfJobs.length;i++)T.updateWater(0.1);
T.NET.mode=0;T.NET.guests.clear();
const sent=[];for(const e of out)if(e[0]==='e')for(let i=0;i<e[1].length;i+=4)sent.push(e[1].slice(i,i+4).join(','));
console.log('sent to a guest',sent.join(' '),'| water',sent.some(s=>s===[sx+1,bed,sz,W].join(',')));
console.log('jobs left',T.wfJobs.length,'queued',T.wfRemoved.length/3,'seen',T.wfSeen.size);
process.exit(0);
