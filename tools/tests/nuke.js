let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__ev=s=>eval(s);window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,ABIL,AB,DT,setGob,mHeld,freeFoe,foeSpawn,PICKUPS,SHOTS,FOES,damageGoblin,gobDrop,foeArm,GOB_FOES,WEAPONS};\n})();');
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
eval(src);const T=window.__t,E=window.__ev;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// The weapons added after the first ones (enemies/weapons.js): the Katana, Large Club, Shotgun, Assault Rifle, Sniper
// Rifle, Bazooka and Landmines, and reloading. Gnash first: each gun's magazine run down, reloaded by itself and by the
// button, switching away stopping a reload; each new weapon on a thief; landmines planted, armed, set off by an enemy and
// not by him; drops and the loadout; his first-person view through a reload. Then enemies carrying each one (none do in
// The Nuke Launcher (src/assets/weapons/nuke.json): Gnash fires it level, the warhead flies slowly in a shallow arc and
// lands in a big blast (bigBlast, big-blast.js) far enough off that he lives; it reloads from its few spare warheads and
// then has none (unless Infinite ammo's on); a landmine and a goblin in the blast go too; fired at a wall in front of
// him, he's caught in it like anyone else. Then an enemy carrying one (a made-up kind) fires the same warhead.
const STONE=3;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;g.root.visible=false;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=Math.round(A.pos.y),W=T.WEAPONS.nuke,f=(v,n=1)=>v.toFixed(n);
const home=(yaw=Math.PI)=>{A.pos.set(X0+.5,F,Z0+.5);A.vy=0;A.state='walk';A.cam.yaw=yaw;A.cam.pitch=0;A.heading=yaw+Math.PI;A.hp=20;A.mvx=A.mvz=0;A.relT=0;A.biteT=0;A.biteCD=0;};
const press=(n,k='Mouse0')=>{T.mHeld.add(k);S(n);T.mHeld.delete(k);};
const tap=(k,n=3)=>{T.keys.add(k);S(n);T.keys.delete(k);S(2);};
const floor=()=>{for(let x=X0-6;x<=X0+6;x++)for(let z=Z0-6;z<=Z0+6;z++){for(let y=F-4;y<F;y++)if(!T.get(x,y,z))T.setRaw(x,y,z,STONE);}};
const ammo=()=>E('gobAmmo')(A,'nuke'),spare=()=>E('gobSpare')(A,'nuke'),craters=()=>E('craters'),jobs=()=>E('BB').jobs;
const settle=()=>{let n=0;while(jobs().length&&n<1200){S(1);n++;}S(5);return n;};
T.setGob(true);home();S(5);A.wpns=['club','nuke'];A.wpn='nuke';A.ammo={};A.spare={};S(20);floor();
console.log('nuke launcher: mag',W.mag,'spare',W.spare,'reload',W.reload,'s, big blast reach',W.nuke,', in the loadout list',E('GOB_PICK').includes('nuke'));
console.log('loaded',ammo(),', spare',spare());
// (a mine laid out where the blast will reach, and a goblin out there)
const mine=E('mineLay')(X0+0.5,F,Z0+70.5,{side:'e',k:'landmine'});
const g=T.freeFoe('thief',8);T.foeSpawn(g,'thief',null,0);g.pos.set(X0+0.5,F,Z0+66);g.gunCD=g.bombCD=g.mineCD=1e9;g.stun=99;
{const c0=craters().length;press(2);S(1);const N=T.SHOTS.find(q=>q.live&&q.kind==='nuke');
 let t=0,ys=[],x0=N&&N.pos.x,z0=N&&N.pos.z,last=null;while(N&&N.live&&t<900){last={x:N.pos.x,y:N.pos.y,z:N.pos.z};ys.push(N.pos.y);S(1);t++;}
 const C=craters()[craters().length-1];
 console.log('fired level: warhead',!!N,', flew',f(t/60,2),'s, highest',f(Math.max(...ys)-F),'above the floor, landed',last?f(Math.hypot(last.x-x0,last.z-z0)):'-','blocks off');
 console.log('big blast:',craters().length>c0,', reach',C&&C.R,', its middle',C?f(Math.hypot(C.x-A.pos.x,C.z-A.pos.z)):'-','from Gnash, a job running',jobs().length>0);
 const n=settle();console.log('settled in',n,'frames; Gnash hp',A.hp,A.state,'; the goblin out there',g.state,', the mine',mine&&mine.live?'still there':'gone');
 console.log('after firing: loaded',ammo(),', reloading',A.relT>0,', spare',spare());}
// reloads till the spares are gone, then nothing
{let fired=1,loads=[];for(let i=0;i<6;i++){let n=0;while(A.relT>0&&n<900){S(1);n++;}loads.push(ammo()+'/'+spare());if(ammo()<1)break;home(0);A.cam.pitch=0.5;S(2);press(2);S(2);fired++;
   let m=0;while(T.SHOTS.some(q=>q.live&&q.kind==='nuke')&&m<900){S(1);m++;}settle();floor();home(0);}
 console.log('fired',fired,'in all; loaded/spare after each reload',loads.join(' '));
 tap('KeyX');console.log('reload button with no spares: reloading',A.relT>0);
 home();A.ammo.nuke=0;S(2);press(2);console.log('attack with it empty and no spares: reloading',A.relT>0,', shot',T.SHOTS.some(q=>q.live&&q.kind==='nuke'));
 T.DT.infAmmo=true;tap('KeyX');const rl=A.relT>0;let n=0;while(A.relT>0&&n<900){S(1);n++;}console.log('Infinite ammo: reloads with none spare',rl,', loaded',ammo(),', spare',spare());
 home(0);A.cam.pitch=0.5;S(2);press(2);S(2);console.log('Infinite ammo: fired and still loaded',ammo(),', spare',spare());let m=0;while(T.SHOTS.some(q=>q.live&&q.kind==='nuke')&&m<900){S(1);m++;}settle();T.DT.infAmmo=false;}
// picked up afresh: full again
{E('gobPickupsClear')();A.wpns=['club'];A.wpn='club';home();const pu=T.PICKUPS;
 const g2=T.freeFoe('thief',8);T.foeSpawn(g2,'thief',null,0);g2.pos.set(A.pos.x,F,A.pos.z+1.6);g2.arms=Object.assign({},T.FOES.thief,{weapons:['nuke']});g2.state='dead';T.gobDrop(g2);
 const lv=pu.filter(q=>q.live&&q.k==='nuke').length;g2.state='wait';g2.root.visible=false;for(let i=0;i<60;i++){A.pos.z+=0.03;S(1);}
 console.log('dropped by an enemy:',lv,', picked up',A.wpns.includes('nuke'),', loaded',ammo(),', spare',spare());}
// the debug menu's Nuke strength: a step down from the weapon's own, then set low, the next warhead's blast that reach
{const st=E('dbgStep');st('nukeR',-1);const a=E('dbgVal')('nukeR');T.DT.nukeR=0;st('nukeR',99);const top=E('dbgVal')('nukeR');T.DT.nukeR=0;st('nukeR',-99);const lo=E('dbgVal')('nukeR');
 T.DT.nukeR=24;home(0);A.wpn='nuke';A.ammo.nuke=1;A.relT=0;A.cam.pitch=0.5;S(2);press(2);S(2);let m=0;while(T.SHOTS.some(q=>q.live&&q.kind==='nuke')&&m<900){S(1);m++;}
 const C=craters()[craters().length-1];settle();floor();T.DT.nukeR=0;
 console.log('Nuke strength: one step down',a,', the most',top,', the least',lo,'| set to 24, the next blast',C&&C.R);}
// fired at a wall just ahead: he's in it
{home();floor();for(let y=0;y<4;y++)for(let v=-2;v<=2;v++)T.setRaw(X0+v,F+y,Z0+5,STONE);A.ammo.nuke=1;A.relT=0;A.hp=20;S(2);press(2);S(30);settle();
 console.log('fired at a wall 5 ahead: Gnash',A.state,', hp',A.hp);}
// an enemy with one
{for(const p of T.players)p.hp=20;A.state='walk';home();S(30);T.setGob(false);S(5);home();const g3=T.freeFoe('thief',8);T.foeSpawn(g3,'thief',null,0);g3.pos.set(A.pos.x,F,A.pos.z+60);
 g3.arms=Object.assign({},T.FOES.thief,{weapons:['nuke'],gun:{near:4,aim:0.3,cause:'Nuked by a goblin'}});E('foeFresh')&&E('foeFresh')(g3);g3.gunCD=0;g3.stun=0;
 let N=null,n=0;while(!N&&n<900){S(1);n++;N=T.SHOTS.find(q=>q.live&&q.kind==='nuke');}
 console.log('an enemy carrying one: fired a warhead',!!N,', with a big blast',N?N.bb:0);for(const q of T.SHOTS){q.live=false;q.g.visible=false;}}
process.exit(0);   // (pop-ups left on timers)
