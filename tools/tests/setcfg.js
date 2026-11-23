let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,settlementLat,settlementAt,worldCfgSet,worldCfgSent,clearWorld,farmK,bigPlainsAt,edgeOn,seaPlot,WORLD_CFG,SAVE_KEY,get seed(){return seed}};\n})();');
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
// (a real store, so what New world writes can be read back; LS_FAIL makes saving fail, for the reset-in-place path)
const LS=new Map();
// (booted straight into a world saved with custom settlements, as the reload after New world does)
const CFG0=process.env.CFG?JSON.parse(process.env.CFG):{towns:0.5,csize:1.5,clu:0.8,sites:2};
{const SK=src0.match(/SAVE_KEY='([^']+)'/)[1],GEN=+src0.match(/WORLD_GEN=(\d+)/)[1];LS.set(SK,JSON.stringify({seed:1,gen:GEN,cfg:CFG0,edits:{},coll:{},down:[],dest:{},test:[]}));}let LS_FAIL=false;
global.localStorage={getItem:k=>LS.has(k)?LS.get(k):null,setItem(k,v){if(LS_FAIL)throw new Error('full');LS.set(k,String(v))},removeItem:k=>LS.delete(k),key:i=>[...LS.keys()][i]??null,get length(){return LS.size}};
global.requestAnimationFrame=()=>{};let reloads=0;global.location={reload(){reloads++;},search:'',href:'http://x/',protocol:'file:'};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];process.on('uncaughtException',e=>{errs.push(String(e&&e.stack||e).split('\n')[0]);});
for(const f of els.play.L.click)f();pads.length=0;
console.log('booted seed',T.seed,'cfg',JSON.stringify(T.worldCfgSent()));
run(4);const P=T.players[0];console.log('walked 4 s, at',P.pos.x.toFixed(0),P.pos.z.toFixed(0),'errors',errs.length);
// ---- the places, farms and big sites in a square round the start, for each setting ----
const N=10;   // (grid points each way: 21 x 21 places, 756 plots a side)
function survey(cfg){T.worldCfgSet(cfg);T.clearWorld();
  const by={city:0,large:0,small:0,village:0},Rc=[];let none=0,land=0,edgeBad=0;const cells=[];
  for(let rx=-N;rx<=N;rx++)for(let rz=-N;rz<=N;rz++){const S=T.settlementLat(rx,rz);
    if(T.seaPlot(S.cx,S.cz))continue;land++;
    if(S.none){none++;for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]])if(T.edgeOn(dx<0?rx-1:rx,dz<0?rz-1:rz,Math.abs(dx),Math.abs(dz)))edgeBad++;continue;}
    if(T.settlementAt(S.cx,S.cz)!==S)continue;by[S.type]++;if(S.type==='city')Rc.push(S.R);}
  // (clumping: the places per 3 x 3 grid points, as a variance over mean; about 1 or under is even, well over 1 clumped)
  for(let a=-9;a<=6;a+=3)for(let b=-9;b<=6;b+=3){let n=0,l=0;for(let i=0;i<3;i++)for(let j=0;j<3;j++){const S=T.settlementLat(a+i,b+j);if(T.seaPlot(S.cx,S.cz))continue;l++;if(!S.none)n++;}if(l===9)cells.push(n);}
  const mu=cells.reduce((s,v)=>s+v,0)/(cells.length||1),va=cells.reduce((s,v)=>s+(v-mu)*(v-mu),0)/(cells.length||1);
  let farms=0,sites={};const W=200;for(let px=-W;px<W;px++)for(let pz=-W;pz<W;pz++){if(T.farmK(px,pz)!==null)farms++;const B=T.bigPlainsAt(px,pz);if(B&&B.ax===px&&B.az===pz)sites[B.kind]=(sites[B.kind]||0)+1;}
  const ns=Object.values(sites).reduce((s,v)=>s+v,0);
  return {by,none,land,edgeBad,cityR:Rc.length?(Rc.reduce((s,v)=>s+v,0)/Rc.length).toFixed(1):'-',clump:mu?(va/mu).toFixed(2):'-',farms,ns,sites};}
const show=(name,c)=>{const r=survey(c);console.log(name.padEnd(26),'places',JSON.stringify(r.by),'empty',r.none+'/'+r.land,'roads into empty',r.edgeBad,'city R',r.cityR,'clumping',r.clump,'| farm plots',r.farms,'big sites',r.ns,JSON.stringify(r.sites));return r;};
const D=show('defaults',undefined);
show('towns 0.5',{towns:0.5});show('towns 0.2',{towns:0.2});
show('city size 0.6',{csize:0.6});show('city size 1.8',{csize:1.8});
show('spread out -1',{clu:-1});show('clustered 0.5',{clu:0.5});show('clustered 1',{clu:1});
show('country sites 0',{sites:0});show('country sites 3',{sites:3});
show('booted cfg',CFG0);
const A=JSON.stringify(survey(CFG0)),B=JSON.stringify(survey(CFG0));console.log('the same twice',A===B);
const D2=survey(undefined);console.log('defaults again the same',JSON.stringify(D)===JSON.stringify(D2));
// (spread out: every place right on its grid point)
T.worldCfgSet({clu:-1});T.clearWorld();let off=0;for(let rx=-5;rx<=5;rx++)for(let rz=-5;rz<=5;rz++){const S=T.settlementLat(rx,rz);if(S.cx!==rx*36||S.cz!==rz*36)off++;}console.log('spread out -1: places off their grid point',off);
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
