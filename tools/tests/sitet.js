// the editor's structures (world/sites.js): every kind captured from the world, one switched on and built in place of each of its kind, turned to face its way, with its furniture, people and parked vehicles; switched off again
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,liveSiteInfo,liveSiteCapture,liveSiteFind,liveSite,assetSiteDecode,assetSiteEncode,assetCheck,siteOf,siteIn,siteCol,sitePt,siteFace,SITE_ROT,get,chunks,ckey,G,GOLD,PROPS,placePlayer,V3,refreshProps,activeProps,venues2:()=>venues,parkSpots};\n})();');
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

const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;run(1);
const KINDS=process.env.KINDS?process.env.KINDS.split(','):null;
const t0=Date.now();
// 1. every kind captured from the world as the plan builds it, and the file round trip
const caps={};let nk=0,none=[];
for(const [g,items] of T.liveSiteInfo().kinds)for(const [k,name] of items){if(KINDS&&!KINDS.includes(k))continue;nk++;
  const s=Date.now();const r=T.liveSiteCapture(k,0);
  if(r.error){none.push(k);console.log('capture',k,'| none:',r.error,'|',Date.now()-s,'ms');continue;}
  const f=r.file,Ad=T.assetSiteDecode(f),errs=T.assetCheck('sites','t_'+k,f);
  const again=JSON.stringify(T.assetSiteEncode(Ad,f.size))===JSON.stringify(f.rows);
  caps[k]=r;console.log('capture',k,'| at',r.at.join(','),'| plots',f.w+'x'+f.h,'| face',f.face,'| size',f.size.join('x'),'from y',f.y0,'| props',f.props.length,'| people',f.people.length,'| cars',f.cars.length,
    '| text',Math.round(f.rows.join('').length/1024)+'k','| check',errs.length?errs.join(';'):'ok','| round trip',again?'same':'DIFFERENT','|',Date.now()-s,'ms');}
console.log('kinds',nk,'| captured',Object.keys(caps).length,'| none near',none.join(',')||'-');
// 2. one switched on: built in place of every one of its kind and size, turned to face its way
function lotCheck(I,mark){
  const s=I.s,NY=s.size[1],R=T.SITE_ROT[I.k];let bad=0,n=0,where=null;
  for(let u=0;u<I.LX;u++)for(let v=0;v<I.LZ;v++){const b0=T.siteCol(I,u,v);for(let y=s.y0;y<s.y0+NY;y++){n++;const w=T.get(I.X0+u,y,I.Z0+v),want=R[s.A[b0+y-s.y0]];
    if(w!==want)bad++;if(w===mark)where=[u,y,v];}}
  return {bad,n,where};
}
const pick=['police','school','fire','grocery','bank','church','house','hospital','thieves','farm'].find(k=>caps[k]&&caps[k].file.face>=0)||Object.keys(caps).find(k=>caps[k].file.face>=0);
if(pick){
  const F=JSON.parse(JSON.stringify(caps[pick].file));F.on=true;
  // (a marker block, one it hasn't otherwise got, 2 in from its lot's corner along x, 3 along z, 4 over the ground: where each copy has it shows the turn)
  const D=T.assetSiteDecode(F),[NX,NY,NZ]=F.size,mu=2,mv=3,my=T.G+4,MK=[131,132,136,137,138,139,75,70].find(b=>!D.includes(b));D[(mv*NX+mu)*NY+(my-F.y0)]=MK;F.rows=T.assetSiteEncode(D,F.size);
  T.liveSite('t_'+pick,F);
  const seen=[];for(let n=0;n<10;n++){const r=T.liveSiteFind(pick,n);if(!r)break;const I=T.siteOf(r.ax,r.az);
    if(!I){console.log('on',pick,'#'+n,'at',r.ax+','+r.az,'| not built: its size',r.w+'x'+r.h,'against',F.w+'x'+F.h);continue;}
    for(let cx=Math.floor(I.X0/16);cx<=Math.floor((I.X0+I.LX-1)/16);cx++)for(let cz=Math.floor(I.Z0/16);cz<=Math.floor((I.Z0+I.LZ-1)/16);cz++)T.chunks.delete(T.ckey(cx,cz));
    const c=lotCheck(I,MK),[ex,ez]=T.sitePt(I,mu+0.5,mv+0.5);
    console.log('on',pick,'#'+n,'at',r.ax+','+r.az,'| face',T.siteFace(r),'turns',I.k,'| blocks unlike the file',c.bad,'of',c.n,'| marker at',c.where&&[c.where[0],c.where[1]-T.G,c.where[2]].join(','),'expected',[Math.floor(ex-I.X0),4,Math.floor(ez-I.Z0)].join(','));seen.push(I.k);}
  console.log('turns seen',[...new Set(seen)].sort().join(','));
  // (the file said to face each way in turn: the first one built turned to match, every block where the turn puts it)
  for(const fc of [0,1,2,3]){const F3=Object.assign({},F,{face:fc});T.liveSite('t_'+pick,F3);const r=T.liveSiteFind(pick,0),I=T.siteOf(r.ax,r.az);if(!I){console.log('file facing',fc,'| not built');continue;}
    for(let cx=Math.floor(I.X0/16);cx<=Math.floor((I.X0+I.LX-1)/16);cx++)for(let cz=Math.floor(I.Z0/16);cz<=Math.floor((I.Z0+I.LZ-1)/16);cz++)T.chunks.delete(T.ckey(cx,cz));
    const c=lotCheck(I,MK),[ex,ez]=T.sitePt(I,mu+0.5,mv+0.5);
    console.log('file facing',fc,'| this one faces',T.siteFace(r),'turns',I.k,'| blocks unlike the file',c.bad,'| marker at',c.where&&[c.where[0],c.where[1]-T.G,c.where[2]].join(','),'expected',[Math.floor(ex-I.X0),4,Math.floor(ez-I.Z0)].join(','));}
  T.liveSite('t_'+pick,F);
  // 3. its furniture in place of the plan's, its people, its parked vehicles
  const I=T.siteOf(caps[pick].at[0],caps[pick].at[1]),F2=JSON.parse(JSON.stringify(F));
  if(!F2.props.length)F2.props.push({m:Object.keys(T.PROPS)[0],p:[NX/2,T.G+1,NZ/2],yaw:0});
  F2.people=[{k:'thief',p:[3.5,T.G+1,3.5],yaw:0},{k:'civilian',p:[5.5,T.G+1,3.5],yaw:1},{k:'staff',p:[7.5,T.G+1,3.5],yaw:2}];
  F2.cars=[{k:'pickup',p:[4,T.G+1,NZ-4],yaw:0}];
  T.liveSite('t_'+pick,F2);
  T.placePlayer(A,new T.V3(I.X0+I.LX/2,T.G+30,I.Z0+I.LZ+12));run(3);
  T.refreshProps();const mine=T.activeProps.filter(f=>String(f.key).startsWith('st:')).length,other=T.activeProps.filter(f=>!String(f.key).startsWith('st:')&&T.siteIn(f.x,f.z)).length;
  console.log('props: its own drawn',mine,'of',F2.props.length,'| the plan\'s left in its lot',other);
  const V=[...T.venues2().values()].find(v=>v.kind==='siteppl');run(4);
  console.log('people:',V?V.slots.map((g,i)=>V.posts[i].k+' '+(g?g.state+(g.homeV===V?' at its post':g.vendor?' at its spot':''):'none')).join(', '):'no venue');
  const ps=T.parkSpots(I.ax,I.az),tc=ps.filter(o=>String(o.key).startsWith('st:'));
  console.log('parked: its own',tc.map(o=>o.veh).join(',')||'none','| the plan\'s left in its lot',ps.filter(o=>!String(o.key).startsWith('st:')&&T.siteIn(o.x,o.z)).length);
  // 4. switched off again: the plan's own back
  F2.on=false;T.liveSite('t_'+pick,F2);console.log('off: built',T.siteOf(I.ax,I.az)?'still':'no longer');
}
console.log('total',Date.now()-t0,'ms');
