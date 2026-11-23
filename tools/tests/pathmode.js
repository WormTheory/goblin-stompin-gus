let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={setPath,pathSimple,get DT(){return DT},navCol,solidAt,G,keys,stFind,plotInfo,get,players,goblins,cars,frame};\n})();');
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
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;
// The Options switch between goblin pathfinding modes (setPath: 0 Advanced, 1 Simple). The same chases run in each: Gus
// clinging partway up a wall, a goblin below; Gus up on a roof; and Gus on level ground. In Simple a goblin should never
// set off on a jump or a climb (g.act) and no route map gets built, while it still runs Gus down on the level. Then
// Simple is chosen while a goblin's halfway up the wall: it should let go, drop, and land unhurt. And back to Advanced,
// it climbs again. ('BAD' marks a line that isn't what it should be.)
const CELL=32,G=T.G,DT=33.4;
const gob=T.goblins.find(g=>!g.civ&&!g.staff&&!g.medic&&!g.ff&&!g.cop)||T.goblins[0];
for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
const others=()=>{for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const groundY=(x,z,top=G+60)=>{let y=top;while(y>1&&!T.solidAt(x,y,z)&&T.get(x,y,z)!==9)y--;return y+1;};
const put=(x,y,z)=>{gob.state='chase';gob.hp=gob.hpMax=99;gob.stun=0;gob.indoor=false;gob.civ=false;gob.staff=false;gob.root.visible=true;gob.pos.set(x,y,z);gob.vy=0;gob.t=0;gob.detour=0;gob.kv.set(0,0,0);gob.atk=1;gob.act=null;gob.fallTop=undefined;gob.los=false;gob.losT=0;gob.trip=null;gob.stUp=undefined;};
const F=T.stFind('mid',0,0),P=T.plotInfo(F.ax,F.az);let b=P.b[0];for(const q of P.b)if((q.x1-q.x0)*(q.z1-q.z0)>(b.x1-b.x0)*(b.z1-b.z0))b=q;
const X0=F.ax*CELL,Z0=F.az*CELL,cx=X0+((b.x0+b.x1)>>1),wz=Z0+b.z0-1,y0=groundY(cx,wz),topY=groundY(cx,wz+1,G+150);
const wall={x:cx+.5,y:y0+Math.round((topY-y0)/2),z:wz+.6};
while(wall.y>y0+1&&!(T.solidAt(cx,wall.y,wz+1)&&T.solidAt(cx,wall.y+1,wz+1)))wall.y--;
const roofSpot=(()=>{for(let r=0;r<6;r++)for(let dz=2;dz<8;dz++){const x=cx+r,z=wz+dz;if(groundY(x,z,G+150)===topY)return {x:x+.5,y:topY,z:z+.5};}return null;})();
const cling=()=>{A.state='climb';A.climbD=[0,1];A.heading=0;A.vy=0;A.pos.set(wall.x,wall.y,wall.z);A.hp=999;};
const stand=q=>()=>{A.state='walk';A.vy=0;A.grounded=true;A.pos.set(q.x,q.y,q.z);A.hp=999;};
console.log('  building: mid,',topY-y0,'tall; Gus on the wall',wall.y-y0,'up; roof spot',roofSpot&&[roofSpot.x-cx,roofSpot.y-y0,roofSpot.z-wz].join());
// one chase: hold Gus with pose() for secs, the goblin starting at from; what the goblin did
function chase(pose,from,secs,climb){
  if(climb)T.keys.add('KeyC');for(let i=0;i<12;i++){pose();others();now+=DT;T.frame(now);}
  put(from.x,from.y,from.z);const hp0=gob.hp;
  let t=0,actF=0,climbF=0,blows=0,first=null,hi=gob.pos.y,navd=false;
  while(t<secs){pose();others();now+=DT;T.frame(now);t+=DT/1000;if(gob.state!=='chase')break;
    if(gob.act){actF++;if(gob.act.k==='up'||gob.act.k==='down')climbF++;}hi=Math.max(hi,gob.pos.y);if(A.nav)navd=true;
    if(A.hp<999){blows++;if(first===null)first=t;A.hp=999;}}
  T.keys.delete('KeyC');A.state='walk';
  return {actF,climbF,blows,first,hi:hi-from.y,navd,hurt:hp0-gob.hp,alive:gob.state==='chase'};
}
const fmt=r=>('jumps/climbs '+r.actF+' frames ('+r.climbF+' on a wall)').padEnd(38)+(r.blows?r.blows+' blows, first after '+r.first.toFixed(1)+'s':'no blows').padEnd(28)+'highest '+r.hi.toFixed(1)+'  route map '+(r.navd?'yes':'no');
const below={x:cx-5.5,y:y0,z:wz-6.5};
const flatA={x:cx+.5,y:y0,z:wz-8.5},flatG={x:cx-9.5,y:y0,z:wz-14.5};
let bad=0;const chk=(ok,s)=>{if(!ok)bad++;console.log(ok?'   ':'BAD',s);};
for(const mode of [0,1]){
  T.setPath(mode);const name=mode?'Simple':'Advanced';
  console.log(' ',name,'(pathSimple '+T.pathSimple()+')');
  const w=chase(cling,below,40,true);console.log('    Gus on a wall      ',fmt(w));
  const r=roofSpot?chase(stand(roofSpot),below,40):null;if(r)console.log('    Gus on the roof    ',fmt(r));
  const f=chase(stand(flatA),flatG,30);console.log('    Gus on the level   ',fmt(f));
  if(mode){chk(w.actF===0&&(!r||r.actF===0)&&f.actF===0,'Simple: never jumps or climbs');chk(!w.navd&&(!r||!r.navd)&&!f.navd,'Simple: no route map built');chk(f.blows>0,'Simple: still runs Gus down on the level');chk(!w.blows&&(!r||!r.blows),'Simple: can\'t reach Gus up a wall or on the roof');}
  else{chk(w.climbF>0&&w.blows>0,'Advanced: climbs the wall after Gus and hits him');chk(!r||r.blows>0,'Advanced: reaches Gus on the roof');chk(f.blows>0,'Advanced: runs Gus down on the level');}
}
// switched to Simple with the goblin partway up the wall
{T.setPath(0);T.keys.add('KeyC');for(let i=0;i<12;i++){cling();others();now+=DT;T.frame(now);}
  put(below.x,below.y,below.z);let t=0;while(t<40&&!(gob.act&&gob.act.k==='up'&&gob.pos.y>y0+3)){cling();others();now+=DT;T.frame(now);t+=DT/1000;}
  const onWall=!!(gob.act&&gob.act.k==='up'),hy=gob.pos.y-y0,hp=gob.hp;
  T.setPath(1);let land=null;t=0;while(t<6){cling();others();now+=DT;T.frame(now);t+=DT/1000;if(gob.act)break;if(land===null&&gob.vy===0&&gob.pos.y<y0+0.6)land=t;}
  T.keys.delete('KeyC');A.state='walk';
  console.log('  switched to Simple with the goblin',hy.toFixed(1),'up the wall: back on its feet after',land===null?'never':land.toFixed(1)+'s','at',(gob.pos.y-y0).toFixed(1),'hurt',hp-gob.hp,'state',gob.state,'softLand',!!gob.softLand);
  chk(onWall,'it was on the wall when Simple was chosen');chk(!gob.act&&land!==null&&gob.state==='chase'&&gob.hp===hp&&!gob.softLand,'let go, dropped and landed unhurt, and stays off the wall');}
// and back to Advanced: climbing again
{T.setPath(0);const w=chase(cling,below,40,true);console.log('  back to Advanced: Gus on a wall',fmt(w));chk(w.climbF>0,'Advanced again: climbs');}
console.log(bad?'  '+bad+' BAD':'  all as they should be');
process.exit(0);
