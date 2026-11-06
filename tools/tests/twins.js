let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,mHeld,setChar,charName};\n})();');
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
// Gus and Gertie must be the same animal in all but looks: the same moves, played on the same controller inputs in the
// same frames on two identical patches of ground, have to leave them in the same places and states, frame for frame.
for(const f of els.playCoop.L.click)f();S(5);
const [A,B]=T.players;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
S(30);
const STONE=3,F=70,X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),OFF=48;   // (B's patch is OFF blocks along x from A's)
for(const o of [0,OFF])for(let x=X0-20;x<=X0+20;x++)for(let z=Z0-20;z<=Z0+30;z++){T.setRaw(x+o,F-1,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x+o,y,z))T.setRaw(x+o,y,z,0);}
let built=[];const put=(x,y,z)=>{for(const o of [0,OFF]){T.setRaw(X0+x+o,F+y,Z0+z,STONE);built.push([X0+x+o,F+y,Z0+z]);}},clear=()=>{for(const q of built)T.setRaw(q[0],q[1],q[2],0);built=[];};
const left=o=>built.filter(q=>q[0]-X0>=o-25&&q[0]-X0<=o+25&&T.get(q[0],q[1],q[2])).length;
const floor=()=>{const keep=new Set(built.map(q=>q.join()));for(const o of [0,OFF])for(let x=X0-20;x<=X0+20;x++)for(let z=Z0-20;z<=Z0+30;z++){for(let y=F-4;y<F;y++)if(T.get(x+o,y,z)!==STONE)T.setRaw(x+o,y,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x+o,y,z)&&!keep.has([x+o,y,z].join()))T.setRaw(x+o,y,z,0);}};
const home=()=>{floor();for(const [p,o] of [[A,0],[B,OFF]]){p.pos.set(X0+o+.5,F,Z0+.5);p.vy=0;p.state='walk';p.t=0;p.cam.yaw=Math.PI;p.cam.pitch=-0.3;p.heading=0;p.hp=20;p.mvx=p.mvz=0;p.stam=100;p.exhausted=false;p.airJumps=1;p.dashT=0;p.biteCD=0;p.smashCD=0;p.chargeCD=0;p.deadT=0;p.lockT=null;p.vb=null;p.piv=null;p.dodge=null;}};
const setPad=(ax,btn)=>{for(const P of pads){P.axes=ax.slice();P.buttons.forEach((b,i)=>{b.pressed=btn.includes(i);b.value=b.pressed?1:0;});}};
// a script: [frames, axes, buttons held]
const run=(name,script)=>{home();setPad([0,0,0,0],[]);S(3);let worst=0,at='',st=0,frames=0;
  for(const [n,ax,btn] of script){setPad(ax,btn);for(let i=0;i<n;i++){S(1);frames++;
    const d=Math.hypot(A.pos.x-(B.pos.x-OFF),A.pos.y-B.pos.y,A.pos.z-B.pos.z);if(d>worst){worst=d;at=frames;}if(A.state!==B.state)st++;}}
  setPad([0,0,0,0],[]);S(40);const d=Math.hypot(A.pos.x-(B.pos.x-OFF),A.pos.y-B.pos.y,A.pos.z-B.pos.z);
  console.log(name.padEnd(22),'player one moved',(Math.hypot(A.pos.x-X0-.5,A.pos.z-Z0-.5)).toFixed(2),'up',(A.pos.y-F).toFixed(2),
    ' | furthest apart',worst.toFixed(3),worst>0.001?'(frame '+at+')':'',' states differed',st,'frames  end gap',d.toFixed(3),' hp',A.hp,B.hp,' stamina',A.stam.toFixed(0),B.stam.toFixed(0));
};
const FWD=[0,-1,0,0],NO=[0,0,0,0];
const twin=(label,gob)=>{T.setGob(gob);console.log('== '+label);
run('walk',[[60,FWD,[]]]);
run('sprint',[[90,FWD,[6]]]);
run('trample (hold dash)',[[90,FWD,[1]]]);
run('jump',[[1,NO,[0]],[60,NO,[]]]);
run('double jump',[[1,NO,[0]],[14,NO,[]],[1,NO,[0]],[60,NO,[]]]);
run('dash',[[1,FWD,[1]],[40,FWD,[]]]);
run('long jump',[[40,FWD,[6]],[1,FWD,[6,0]],[60,FWD,[6]]]);
run('air dash',[[1,NO,[0]],[10,FWD,[]],[1,FWD,[1]],[60,FWD,[]]]);
{clear();floor();for(let v=-3;v<=3;v++)for(let y=0;y<4;y++)put(v,y,3);const b0=left(0);
 run('stomp by a wall',[[1,NO,[7]],[90,NO,[]]]);console.log('   blocks left by Gus',left(0),'by Gertie',left(OFF),'of',b0);clear();}
{for(let v=-3;v<=3;v++)for(let y=0;y<4;y++)put(v,y,3);const b0=left(0);
 run('charged stomp',[[70,NO,[7]],[90,NO,[]]]);console.log('   blocks left by Gus',left(0),'by Gertie',left(OFF),'of',b0);clear();}
{run('ground pound',[[1,NO,[0]],[16,NO,[]],[1,NO,[7]],[90,NO,[]]]);}
{for(let v=-3;v<=3;v++)for(let y=0;y<4;y++)put(v,y,3);const b0=left(0);
 run('bite a wall',[[1,FWD,[2]],[30,FWD,[]],[1,FWD,[2]],[30,FWD,[]],[1,FWD,[2]],[60,NO,[]]]);console.log('   blocks left by Gus',left(0),'by Gertie',left(OFF),'of',b0);clear();}
{for(let v=-4;v<=4;v++)for(let y=0;y<8;y++)for(let u=3;u<7;u++)put(v,y,u);
 run('spider climb',[[300,FWD,[4]]]);clear();}
run('roll? / lock on',[[1,FWD,[11]],[30,FWD,[]]]);
};
const who=()=>T.players.map(p=>T.charName(p)+(p.bow[0].visible?' (bow)':'')).join(' + ');
console.log('picked Gus:',who());
twin('as hippos',false);
T.setChar('gertie');console.log('picked Gertie:',who(),' goblin mode',T.DT.gob);
twin('as hippos, player one Gertie',false);
T.setChar('goblin');console.log('picked Gnash:',who(),' goblin mode',T.DT.gob);
twin('as goblins',true);
T.setChar('gus');console.log('picked Gus again:',who(),' goblin mode',T.DT.gob);
// the same hit does the same harm
{home();S(2);const hp=[];for(const p of [A,B]){p.hp=20;}
 const g=T.goblins.find(g=>!g.civ&&!g.staff);console.log('hp after the same fall from 30 up:');for(const p of [A,B]){p.pos.y=F+30;p.vy=0;}S(150);console.log('  player one',A.hp,'two',B.hp);}
process.exit(0);
