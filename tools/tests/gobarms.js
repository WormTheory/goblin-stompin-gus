let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,DT,setGob,mHeld,freeFoe,foeSpawn,jackKinds,PICKUPS,SHOTS,bindHint,FOES,foeThrow,damageGoblin,gobDrop};\n})();');
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
console.error=()=>{};   // (the stub can't draw lightning, and says so in the weather's own stack trace)
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// Gnash's dash and weapons (player/gob-weapons.js): the dash, the club, dagger and rifle, grenades, what the enemies
// he kills drop and picking it up, and the controls hint. Run once as Gus first, to show a hippo has none of it.
const STONE=3,KF='KeyW',KL='KeyA',KC='KeyC',KJ='Space',KS='ShiftLeft';
const ABIL0=JSON.stringify(T.ABIL),W0=T.AB.walk.speed,J0=T.AB.jump.launch;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
for(let x=X0-24;x<=X0+24;x++)for(let z=Z0-24;z<=Z0+24;z++){T.setRaw(x,F-1,z,STONE);for(let y=F;y<F+24;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
let built=[];const put=(x,y,z)=>{T.setRaw(X0+x,F+y,Z0+z,STONE);built.push([X0+x,F+y,Z0+z]);},clear=()=>{for(const q of built)T.setRaw(q[0],q[1],q[2],0);built=[];};
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;};
const hold=(ks,n)=>{for(const k of ks)T.keys.add(k);S(n);for(const k of ks)T.keys.delete(k);};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const tap=(k,n=3)=>{T.keys.add(k);S(n);T.keys.delete(k);};
const f=(v,n=2)=>v.toFixed(n);
for(const g of T.goblins){g.state='wait';g.root.visible=false;}
// a foe of kind k standing d ahead of him (yaw PI: ahead is +z), ready to fight
const foe=(k,d,hp)=>{if(k==='soldier')T.jackKinds();const g=T.freeFoe(k,8);T.foeSpawn(g,k,null,0);g.pos.set(A.pos.x,F,A.pos.z+d);g.heading=Math.PI;g.gunCD=g.bombCD=1e9;g.stun=0;g.kv.set(0,0,0);if(hp)g.hp=hp;return g;};
const freeze=()=>{for(const g of T.goblins)if(g.state==='chase'){g.gunCD=g.bombCD=1e9;g.kv.set(0,0,0);}};
const drops=()=>T.PICKUPS.filter(P=>P.live).map(P=>P.k+(P.k==='grenade'?' x'+P.n:'')).sort().join(', ')||'none';
const killAll=()=>{for(const g of T.goblins)if(g.state==='chase'||g.state==='dead'){g.state='wait';g.root.visible=false;}for(const P of T.PICKUPS){P.live=false;P.m.visible=false;}for(const Q of T.SHOTS){Q.live=false;Q.g.visible=false;}};
const kit=()=>A.wpns?A.wpns.join('+')+' in hand '+A.wpn+', grenades '+A.gren:'none';
for(const gob of [false,true]){
  T.setGob(gob);home();S(5);console.log('==',gob?'GNASH':'GUS');
  // the dash: tapped with no direction held goes the way he's looking; holding back goes back
  {home();S(5);A.stam=100;const z0=A.pos.z;tap(KS,3);S(40);console.log('dash, nothing held: moved',f(A.pos.z-z0),' (ahead is +)');
   home();S(5);A.stam=100;const z1=A.pos.z;T.keys.add('KeyS');S(1);tap(KS,3);S(40);T.keys.delete('KeyS');console.log('dash, holding back: moved',f(A.pos.z-z1));}
  if(!gob){home();const g=foe('militia',1.6,1);freeze();press(20);S(30);console.log('bite a militiaman: dead',g.state==='dead',' drops',drops(),' kit',kit());killAll();continue;}
  console.log('starts with',kit(),'  hint:',T.bindHint(false,A).replace(/⟦([^⟧]*)⟧/g,'[$1]'));
  // the club, on a militiaman: his rifle and grenades are dropped
  {home();const g=foe('militia',1.1,1);freeze();press(30);S(30);console.log('club a militiaman: dead',g.state==='dead',' drops',drops());
   const P=T.PICKUPS.filter(P=>P.live);hold([KF],80);S(5);console.log('walk over them: drops left',drops(),' kit',kit());killAll();}
  // the rifle: a goblin 12 ahead takes a shot; behind a wall, it doesn't
  {home();const g=foe('thief',12,5);freeze();S(2);const h=g.hp;press(4);S(20);console.log('rifle at a thief 12 ahead: hp',h,'->',g.hp);
   for(let v=-2;v<=2;v++)for(let y=0;y<3;y++)put(v,y,6);const h2=g.hp;S(40);press(4);S(20);console.log('and with a wall between: hp',h2,'->',g.hp);clear();
   S(40);const h3=g.hp;press(4);S(40);press(4);S(20);console.log('wall gone, two more shots: hp',h3,'->',g.hp,' dead',g.state==='dead',' drops',drops());
   const n=A.wpns.length;hold([KF],170);S(5);console.log('walk over the dagger:',kit(),' new weapons',A.wpns.length-n);killAll();}
  // a second militiaman, killed when he's already got a rifle: just grenades
  {home();A.wpn='rifle';const g=foe('militia',6,1);freeze();S(30);press(4);S(20);console.log('shoot a militiaman with a rifle already: drops',drops());killAll();}
  // the weapon button goes round what he's got
  {home();const seq=[A.wpn];for(let i=0;i<3;i++){tap('KeyR',3);S(3);seq.push(A.wpn);}console.log('weapon button:',seq.join(' > '));}
  // the dagger: two a stab
  {home();A.wpn='dagger';const g=foe('prepper',1.1,5);freeze();press(20);S(10);console.log('stab a prepper: hp 5 ->',g.hp);killAll();}
  // grenades: they stack (up to 9), and one thrown at a goblin's feet goes off
  {home();A.gren=0;for(let i=0;i<6;i++){const g=foe('militia',1.5,1);T.damageGoblin(g,5,g.pos.clone(),null,'Clubbed by another goblin');}S(2);console.log('six militiamen down: drops',drops());
   hold([KF],60);S(5);console.log('picked up: grenades',A.gren,' left lying',drops());killAll();
   home();A.cam.pitch=-0.35;const g=foe('thief',8,3);freeze();const gz=g.pos.z,pin=n=>{for(let i=0;i<n;i++){g.pos.z=gz;g.kv.set(0,0,0);S(1);}};const n=A.gren;press(3,'Mouse2');pin(4);press(3,'Mouse2');pin(5);const live=T.SHOTS.filter(Q=>Q.live).length;
   console.log('right click, twice quickly: grenades',n,'->',A.gren,' in the air',live);pin(160);console.log('  the thief 8 ahead, where it lands: hp 3 ->',g.hp,' dead',g.state==='dead',' my hp',A.hp);killAll();A.cam.pitch=0;}
  // a prepper's bomb is a grenade now
  {home();const g=foe('prepper',8,5);T.foeThrow(g,A,T.FOES.prepper.bomb);const Q=T.SHOTS.filter(Q=>Q.live);console.log("prepper throws:",Q.map(q=>q.kind+' ('+q.cause+')').join(', '));killAll();}
}
process.exit(0);   // (the stub DOM can't take down the pickup labels' timers)
