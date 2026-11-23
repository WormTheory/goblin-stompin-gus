let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,ABIL,DT,setGob,mHeld,freeFoe,foeSpawn,SHOTS,FOES,foeThrow,shot,GREN_CRUSH,get edits(){return edits},BEDROCK};\n})();');
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
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// grenades break blocks (enemies/shots.js, GREN_CRUSH): Gnash's thrown at a wall, a prepper's at his feet, one at the
// bottom of the world (bedrock stays); Gus and Gertie throw none
const STONE=3,F=70;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z);
const pad=()=>{for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){for(let y=F-4;y<F;y++)T.setRaw(x,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}};
const count=(x0,x1,y0,y1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(T.get(x,y,z))n++;return n;};
const home=()=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=Math.PI;A.cam.pitch=0;A.heading=0;A.hp=20;A.mvx=A.mvz=0;};
const press=(n,k='Mouse2')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
let at='';const boomWait=()=>{let Q=T.SHOTS.find(Q=>Q.live);for(let i=0;i<300&&T.SHOTS.some(Q=>Q.live);i++){if(Q)at=(Q.pos.x-X0-.5).toFixed(1)+','+(Q.pos.y-F).toFixed(1)+','+(Q.pos.z-Z0-.5).toFixed(1);S(1);}S(10);};
console.log('GREN_CRUSH',T.GREN_CRUSH);
for(const who of ['Gus','Gertie','Gnash']){
  T.setGob(who==='Gnash');A.who=who==='Gertie'?1:0;pad();home();S(5);if(A.gob){A.gren=5;A.wpns=['club','grenade'];A.wpn='grenade';A.biteCD=0;}   // (Gnash: grenades in hand, thrown with the attack)
  // a stone wall 5 ahead (ahead is +z), 7 wide and 5 high
  for(let x=-3;x<=3;x++)for(let y=0;y<5;y++)T.setRaw(X0+x,F+y,Z0+5,STONE);
  const w0=count(X0-3,X0+3,F,F+4,Z0+5,Z0+5),fl0=count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8),e0=Object.keys(T.edits).length;
  A.cam.pitch=0.05;press(3,A.gob?'Mouse0':'Mouse2');S(A.gob?20:0);boomWait();
  const w1=count(X0-3,X0+3,F,F+4,Z0+5,Z0+5),fl1=count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8);
  console.log(who.padEnd(6),'throws at a wall 5 ahead: wall',w0,'->',w1,' floor near it',fl0,'->',fl1,' edits saved',Object.keys(T.edits).length-e0,' hp',A.hp,A.gob?' went off at '+at+' from him':'');
}
// one lying a step from a wall (so at its foot) when it goes off: a hole in the wall, Gus or Gnash alike
{pad();home();S(5);for(let x=-3;x<=3;x++)for(let y=0;y<5;y++)T.setRaw(X0+x,F+y,Z0+5,STONE);const w0=count(X0-3,X0+3,F,F+4,Z0+5,Z0+5);
 T.shot({kind:'grenade',x:X0+.5,y:F+.15,z:Z0+4,vx:0,vy:0,vz:0,grav:20,fuse:0.05,R:3.3,dmg:3,cause:'test',bounce:true,crush:T.GREN_CRUSH});boomWait();
 console.log('one lying at the foot of the wall: wall',w0,'->',count(X0-3,X0+3,F,F+4,Z0+5,Z0+5));}
// a prepper's grenade lobbed at his feet: a crater in the floor
{T.setGob(false);pad();home();S(5);const g=T.freeFoe('prepper',8);T.foeSpawn(g,'prepper',null,0);g.pos.set(A.pos.x,F,A.pos.z+8);g.heading=Math.PI;g.gunCD=g.bombCD=1e9;
 const fl0=count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8);T.foeThrow(g,A,T.FOES.prepper.bomb);A.pos.set(X0+.5,F,Z0-20.5);boomWait();
 console.log('prepper grenade at his feet: floor',fl0,'->',count(X0-8,X0+8,F-4,F-1,Z0-8,Z0+8));g.state='wait';g.root.visible=false;}
// one going off at the bottom of the world: bedrock stays
{let n0=0;for(let x=X0-3;x<=X0+3;x++)for(let z=Z0-3;z<=Z0+3;z++)if(T.get(x,0,z)===T.BEDROCK)n0++;
 for(let x=X0-3;x<=X0+3;x++)for(let z=Z0-3;z<=Z0+3;z++)for(let y=1;y<4;y++)T.setRaw(x,y,z,0);
 T.shot({kind:'grenade',x:X0+.5,y:1.2,z:Z0+.5,vx:0,vy:0,vz:0,grav:20,fuse:0.05,R:3.3,dmg:3,cause:'test',bounce:true,crush:T.GREN_CRUSH});boomWait();
 let n1=0;for(let x=X0-3;x<=X0+3;x++)for(let z=Z0-3;z<=Z0+3;z++)if(T.get(x,0,z)===T.BEDROCK)n1++;console.log('at the bottom of the world: bedrock',n0,'->',n1);}
process.exit(0);
