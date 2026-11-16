let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={SHIPS,SHIP_X0,shipToWorld,worldToShip,shipOf,tenvVeh,tenvFoe,tenvClear,get TENV(){return TENV},get TS(){return TS},frame,players,goblins,get,solidAt,groundAt,chunks,meshes,venues,setGob,keys,DT,crush,get nEdits(){return Object.keys(edits).length},get edits(){return edits},set menuOpen(v){menuOpen=v},SAVE_KEY};\n})();');
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

// Ships with insides (vehicles/ships.js): the Testing Environment's barge. Its blocks are kept in a pocket of the world
// store and drawn where the ship is; anyone near it is moved into that pocket, and back out further off
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),G0=44,W={x:0,z:0};
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=()=>hold(['KeyF'],0.1);
const put=(x,y,z,yaw)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;if(yaw!==undefined){P.cam.yaw=yaw;P.heading=yaw+Math.PI;}};
const aboard=o=>o.pos.x>=T.SHIP_X0;
const where=o=>aboard(o)?'aboard (u '+f1(o.pos.x-S.ox)+' w '+f1(o.pos.z-S.oz)+' y '+f1(o.pos.y-G0)+')':'in the world (y '+f1(o.pos.y-G0)+')';
const quietG=()=>{for(const g of T.goblins)if(g.state!=='wait'){g.state='wait';g.t=0;g.root.visible=false;}};
const pocketMeshes=()=>[...T.meshes.values()].filter(e=>e.cx>=T.SHIP_X0/16);
T.DT.invuln=true;T.setGob(true);run(0.5);
// ---- spawning: a sea is laid out ahead, the barge put on it
T.menuOpen=true;T.TS.n=1;T.tenvVeh('barge');T.menuOpen=false;
const S=T.SHIPS.find(s=>s);
console.log('spawn:',els.tpInfo.textContent);
if(!S){console.log('no ship');process.exit(0);}
const sea=T.TENV.sea;console.log('sea',JSON.stringify(sea),'water at its middle',T.get((sea.x0+sea.x1)/2,G0-1,(sea.z0+sea.z1)/2)===9,'| ship at',f1(S.x),f1(S.z),'yaw',f1(S.yaw),'| from gus',f1(Math.hypot(S.x-P.pos.x,S.z-P.pos.z)));
run(0.5);
{const M=pocketMeshes();console.log('pocket chunks drawn',M.length,'| hung off the ship',M.every(e=>e.m.every(m=>m.parent===S.pg)),'| meshes',M.reduce((n,e)=>n+e.m.length,0));}
console.log('blocks: deck',T.get(S.ox,G0,S.oz),'console',T.get(S.ox,G0+1,S.oz-5),'stair',T.get(S.ox-3,G0+1,S.oz-11),'roof',T.get(S.ox,G0+6,S.oz-8),'water off the side',T.get(S.ox+9,G0-1,S.oz));
// ---- getting aboard: swimming up to the stern's swim platform from the open sea
{T.shipToWorld(S,S.ox-0.5,S.oz-22,W);put(W.x,G0-0.6,W.z,S.yaw);run(0.3);console.log('swimming 5 off the stern:',where(P));
 T.shipToWorld(S,S.ox-0.5,S.oz-19.5,W);put(W.x,G0-0.6,W.z,S.yaw);run(0.3);console.log('swimming 2 off the stern:',where(P),'state',P.state);
 // (facing the bow: in the pocket the bow is +z, so a camera yaw of pi; jump held to keep swimming up)
 P.cam.yaw=Math.PI;P.cam.pitch=0.1;let t=0;T.keys.add('KeyW');T.keys.add('Space');while(t<6&&!(P.pos.y>=G0+0.9&&P.grounded)){run(0.1);t+=0.1;}T.keys.delete('KeyW');T.keys.delete('Space');run(0.5);
 console.log('  swum on and climbed up:',where(P),'in',f1(t),'s');}
// ---- dropped on to the deck from above (world coordinates), then walking about
{T.shipToWorld(S,S.ox+0.5,S.oz-1.5,W);put(W.x,G0+4,W.z,S.yaw+Math.PI);run(1);console.log('dropped on the deck:',where(P),'grounded',P.grounded);
 P.cam.yaw=Math.PI;const z0=P.pos.z;hold(['KeyW'],1.2);console.log('  W 1.2 s toward the bow: went',f1(P.pos.z-z0),where(P));
 P.cam.yaw=Math.PI/2;const x0=P.pos.x;hold(['KeyW'],0.8);console.log('  W 0.8 s to port: went',f1(x0-P.pos.x),where(P));}
// ---- up the wheelhouse stairs to its roof
{put(S.ox-2,G0+1,S.oz-11.8,Math.PI);run(0.3);hold(['KeyW'],3);console.log('up the stairs 3 s:',where(P),'(roof is y 7)');}
// ---- the helm: F takes the controls, W and A/D sail it
let drove=false;
{put(S.ox+1,G0+1,S.oz-5.5,Math.PI);run(0.3);tap();drove=P.drv&&P.drv.k==='ship';console.log('F at the helm:',P.drv?P.drv.k:'on foot','| hud says',P.ui.drvHud&&P.ui.drvHud.txt.n);
 if(drove){const x0=S.x,z0=S.z,y0=S.yaw;hold(['KeyW'],8);
  console.log('  W 8 s: speed',f1(S.sp),'went',f1(Math.hypot(S.x-x0,S.z-z0)),'| gus still at the helm',where(P),'| camera from the ship',f1(Math.hypot(P.camera.position.x-S.x,P.camera.position.z-S.z)));
  hold(['KeyW','KeyD'],4);console.log('  W+D 4 s: yaw turned',f1(S.yaw-y0),'(right is negative)');
  hold(['KeyW','KeyA'],4);console.log('  W+A 4 s: yaw now',f1(S.yaw-y0));
  // (the camera, drawn in the world, behind the ship: its yaw follows the ship's)
  {const cx=P.camera.position.x-S.x,cz=P.camera.position.z-S.z,fx=Math.sin(S.yaw),fz=Math.cos(S.yaw);console.log('  camera behind the ship by',f1(-(cx*fx+cz*fz)),'aside',f1(Math.abs(cx*fz-cz*fx)),'up',f1(P.camera.position.y-G0));}
  tap();console.log('  F again:',P.drv?P.drv.k:'on foot',where(P));}}
// ---- riding along: walk while it's under way and turning (the ship carries on a moment with nobody at the helm)
{S.sp=5;const u0=P.pos.x,w0=P.pos.z,x0=S.x,z0=S.z;run(2);console.log('standing while it coasts 2 s: moved on the deck',f1(Math.hypot(P.pos.x-u0,P.pos.z-w0)),'| ship moved',f1(Math.hypot(S.x-x0,S.z-z0)),where(P));}
// ---- fighting aboard: goblins spawned round Gus on the deck chase him there
{put(S.ox+0.5,G0+1,S.oz+4.5,Math.PI);run(0.5);T.menuOpen=true;T.TS.n=3;T.tenvFoe('goblin');T.menuOpen=false;
 const gs=T.goblins.filter(g=>g.state==='chase');console.log('goblins spawned aboard:',gs.filter(aboard).length,'of',gs.length);
 let near=1e9;for(let i=0;i<40;i++){run(0.2);for(const g of gs)if(g.state==='chase'&&aboard(g))near=Math.min(near,Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z));}
 console.log('  8 s on: closest a goblin got',f1(near),'| still aboard',gs.filter(g=>g.state==='chase'&&aboard(g)).length,'| fell in',gs.filter(g=>g.state==='chase'&&aboard(g)&&g.pos.y<G0).length);
 const e0=T.nEdits;T.crush(S.ox+3,G0+1,S.oz+10,1,-1,1);console.log('  crushed the deck: blocks changed',T.nEdits-e0,'all in the pocket',Object.keys(T.edits).every(k=>+k.split(',')[0]>=T.SHIP_X0));
 quietG();run(0.2);}
// ---- a goblin out in the sea goes for Gus aboard: swims to the ship and climbs on
{T.shipToWorld(S,S.ox+0.5,S.oz+2.5,W);put(S.ox+0.5,G0+1,S.oz+2.5,Math.PI);run(0.3);
 // (spawned ahead of a stand-in out in the water, then Gus put back aboard)
 const sx=P.pos.x,sz=P.pos.z;T.shipToWorld(S,S.ox+0.5,S.oz-40,W);put(W.x,G0-0.6,W.z,S.yaw+Math.PI);run(0.1);
 T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.find(q=>q.state==='chase');if(g){g.pos.y=G0-0.6;g.vy=0;}   // (up at the surface)
 put(sx,G0+1,sz,Math.PI);run(0.2);
 if(!g)console.log('no goblin');else{console.log('goblin in the sea:',where(g),'from the ship',f1(Math.hypot(g.pos.x-S.x,g.pos.z-S.z)));
  let t=0,on=-1;while(t<40&&g.state==='chase'){run(0.5);t+=0.5;if(on<0&&aboard(g)&&g.pos.y>=G0+0.9)on=t;if(on>=0&&t>on+3)break;}
  console.log('  after',t,'s:',where(g),g.state,'| up on the deck after',on<0?'never':on+' s','| from gus',f1(aboard(g)?Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z):-1));}
 quietG();run(0.2);}
// ---- Gus too: a hippo on the deck and up the stairs
{T.setGob(false);run(0.5);T.shipToWorld(S,S.ox+0.5,S.oz-1.5,W);put(W.x,G0+4,W.z,S.yaw+Math.PI);run(1);console.log('Gus dropped on the deck:',where(P),'grounded',P.grounded);
 P.cam.yaw=Math.PI;const z0=P.pos.z;hold(['KeyW'],1.2);console.log('  W 1.2 s toward the bow: went',f1(P.pos.z-z0),where(P));
 put(S.ox-2,G0+2.5,S.oz-10.5,Math.PI);run(0.5);console.log('  on the first steps:',where(P));let top=0;T.keys.add('KeyW');for(let i=0;i<20;i++){run(0.1);top=Math.max(top,P.pos.y-G0);}T.keys.delete('KeyW');console.log('  up the stairs 2 s: highest',f1(top),where(P),'(roof is y 7)');
 T.setGob(true);run(0.5);}
// ---- getting off: over the side, swimming away
{put(S.ox+7.5,G0-0.5,S.oz,Math.PI/2);run(0.2);P.cam.yaw=-Math.PI/2;hold(['KeyW'],3);console.log('swimming off to starboard 3 s:',where(P),'from the ship',f1(Math.hypot(P.pos.x-S.x,P.pos.z-S.z)));}
// ---- cleared away
{T.tenvClear();run(0.3);console.log('cleared: ships',T.SHIPS.filter(s=>s).length,'| pocket chunks drawn',pocketMeshes().length,'| venue',T.venues.has('tenvShips'),'| sea kept',!!T.TENV.sea);}
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
