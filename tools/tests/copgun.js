let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={FOES,SHOTS,TRACERS,trainHit,damageGoblin,DT,nearestPlayer,get wrecked(){return wrecked},TRAIN_BOXES,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,boxesTouch,MIL,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY,COP_GUN,STRIKES,calmNow};\n})();');
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
// Police: the handgun at range (drawn, aimed, fired, back in the holster) and the club up close
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;
run(2);const G0=44;
const place=(x,z)=>{P.pos.set(x,0,z);P.pos.y=Math.max(G0+1,T.groundAt(x,z,80));P.vy=0;P.mvx=P.mvz=0;};
const cops=()=>T.goblins.filter(g=>g.gun&&g.state==='chase');
const causes={};const dp=[];
console.log('tenv',!!T.TENV,'host',T.DT.host);
for(const [label,dist] of [['far',14],['close',1.5]]){
  for(const g of cops()){g.state='wait';g.root.visible=false;g.gun=null;}
  place(P.pos.x,P.pos.z);P.heading=0;P.hp=20;
  T.tenvFoe('cop');const C=cops();
  for(const g of C){const a=Math.random()*6.28;g.pos.set(P.pos.x+Math.sin(a)*dist,P.pos.y,P.pos.z+Math.cos(a)*dist);g.inv=false;}
  let shots=0,hits=0,last=P.hp,frames={0:0,1:0,2:0},seenT=new Map(),kicks=0,minD=99;
  for(let i=0;i<10*60;i++){now+=16.7;T.frame(now);
    for(const t of T.TRACERS){if(t.t>(seenT.get(t)??0)+0.001)shots++;seenT.set(t,t.t);}
    for(const g of C){frames[g.pkit.shown]=(frames[g.pkit.shown]||0)+1;if(g.arm.hand.rotation.x<-0.3&&g.pkit.shown===2)kicks++;minD=Math.min(minD,Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z));
      if(label==='close'&&Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z)>3){g.pos.set(P.pos.x+1.5,P.pos.y,P.pos.z);}}
    if(P.hp<last){hits++;}last=P.hp;if(P.hp<8)P.hp=20;
    if(label==='far')for(const g of C)if(Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z)<8){const a=Math.atan2(g.pos.x-P.pos.x,g.pos.z-P.pos.z);g.pos.set(P.pos.x+Math.sin(a)*14,g.pos.y,P.pos.z+Math.cos(a)*14);}}
  const ob=(P.obits||[]);
  console.log(label.padEnd(5),'cops',C.length,'| bullets',shots,'| hits on gus',hits,'| frames club+holster',frames[1],'gun out',frames[2],'none',frames[0],'| recoil frames',kicks,'| closest',minD.toFixed(1));
}
// calm: no shooting, gun put away
T.DT.host=1;for(const g of cops()){g.state='wait';g.root.visible=false;g.gun=null;}
T.tenvFoe('cop');const C2=cops();for(const g of C2){g.pos.set(P.pos.x+12,P.pos.y,P.pos.z);g.inv=false;}
let sh=0;const sT=new Map();for(let i=0;i<5*60;i++){now+=16.7;T.frame(now);for(const t of T.TRACERS){if(t.t>(sT.get(t)??0)+0.001)sh++;sT.set(t,t.t);}}
console.log('peaceful: cops',C2.length,'calm',T.calmNow(),'bullets',sh,'gun out',C2.filter(g=>g.pkit.shown===2).length);
// an ordinary goblin out of the same pool: no gun, no holster
T.DT.host=2;
const plain=T.goblins.find(g=>g.pkit&&!g.gun&&g.state==='chase');console.log('ordinary goblin with the kit:',plain?('shown '+plain.pkit.shown+' pistol visible '+plain.pkit.pis.some(m=>m.visible)+' holster visible '+plain.pkit.hol.some(m=>m.visible)):'none about');
console.log('pistol pose keys',T.STRIKES.pistol.length,'| errors',errs.length,errs.slice(0,3));
