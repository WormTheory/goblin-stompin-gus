// AI pilots looking where they're going (carrier-jets.js airSolid, jetAvoid, jetBreakHdg): a carrier's jets sent after Gnash
// from a spot (SPOTS=deckP|deckA|deckF|seaS|seaS2|seaP|stern|bow, SECS long) where the island is often in their way;
// counts jets that flew into something and where, the phases they got through. node airavoid.js
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync(process.env.GJS||'g.js','utf8');
src0=src0.replace('function planeCrash(pl,x,y,z,ground){','function planeCrash(pl,x,y,z,ground){(globalThis.__cr=globalThis.__cr||[]).push({pl,x,y,z,ground,info:JSON.stringify({av:pl.av,ph:pl.ai&&pl.ai.ph,ext:pl.ai&&pl.ai.ext,leg:pl.ai&&pl.ai.leg,v:pl.free.v,gm:pl.free.gm,h:pl.g.rotation.y,px:pl.g.position.x,py:pl.g.position.y,pz:pl.g.position.z})});');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={shockwave,get shocks(){return shocks},shipPt,nearestPlayer,addFire,get fires(){return fires},SHIPS,SHIP_X0,SHIP_KINDS,TRAIN_BOXES,trainHit,buildChunk,shipToWorld,worldToShip,shipOf,tenvVeh,tenvFoe,tenvClear,get TENV(){return TENV},get TS(){return TS},frame,players,goblins,get,solidAt,groundAt,chunks,meshes,venues,setGob,keys,DT,crush,doorsOn,propCells,shipFits,PROPS,PT,FOES,award,shot,damagePlayer,crushBall,get SHOTS(){return SHOTS},mHeld,cars,drvFind,drvEnter,drvExit,gunRound,gobShoot,mgDraw,mgSlash,lockTargets,damageCar,mechHit,MG,worldToShip,shipGQ,get playing(){return playing},get nEdits(){return Object.keys(edits).length},get edits(){return edits},set menuOpen(v){menuOpen=v},SAVE_KEY};\n})();');
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

// The aircraft carrier (vehicles/carrier.js): a ship with insides at three-quarters of the real size. Spawned in the
// Testing Environment, its decks walked as Gnash and as Gus, its helm, goblins aboard, and its health and sinking
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),G0=44,W={x:0,z:0};
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=()=>hold(['KeyF'],0.1);
const put=(x,y,z,yaw)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;if(yaw!==undefined){P.cam.yaw=yaw;P.heading=yaw+Math.PI;}};
const aboard=o=>o.pos.x>=T.SHIP_X0;
// (s across to starboard, w toward the bow, y above the sea, as carrier.js has them)
const where=o=>aboard(o)?'aboard (s '+f1(S.ox-o.pos.x)+' w '+f1(o.pos.z-S.oz)+' y '+f1(o.pos.y-G0)+')':'in the world (y '+f1(o.pos.y-G0)+')';
const at=(s,y,w,yaw)=>put(S.ox-s+0.5,G0+y,S.oz+w+0.5,yaw);   // (stood in the middle of block s,w)
const blk=(s,y,w)=>T.get(S.ox-s,G0+y,S.oz+w);
const quietG=()=>{for(const g of T.goblins)if(g.state!=='wait'){g.state='wait';g.t=0;g.root.visible=false;}};
const pocketMeshes=()=>[...T.meshes.values()].filter(e=>e.cx>=T.SHIP_X0/16);
const BOW=Math.PI;   // (camera yaw facing the bow, in the pocket)
// (W held from the foot of a flight until stood on the floor it goes up to, then a step on)
const climb=(s,y,w,secs,label,want)=>{at(s,y,w,BOW);run(0.3);let t=0;T.keys.add('KeyW');while(t<secs&&!(P.grounded&&P.pos.y-G0>=want-0.05))run(0.1),t+=0.1;run(0.3);T.keys.delete('KeyW');run(0.3);
  console.log('  '+label+':',Math.abs(P.pos.y-G0-want)<0.2&&P.grounded?'up in '+f1(t)+' s, now':'(wanted y '+want+')',where(P));};
T.DT.invuln=true;T.setGob(true);run(0.5);
// ---- AI aircraft avoiding things: the carrier's jets sent after Gnash from spots where the island is in their way;
// each run counts jets that flew into something (planeCrash) and where
let S;{T.menuOpen=true;T.TS.n=1;T.tenvVeh('carrier');T.menuOpen=false;S=T.SHIPS.find(s=>s);S.crewV.off=true;run(4);}
const spots=(process.env.SPOTS||'deckP').split(',');
const SECS=+(process.env.SECS||120);
const SP={deckP:[-10,17,-12],deckA:[0,17,-60],deckF:[8,17,40],seaS:[120,1,-12],seaS2:[60,1,-40],seaP:[-150,1,0],stern:[0,1,-200],bow:[10,1,200]};   // (s,y,w: s across, + toward port? as carrier.js: x = ox - s)
let tot=0,totIs=0;
for(const k of spots){const [s,y,w]=SP[k];
  const V=S.jetV,C=S.crewV;
  // (reset: every jet back home and alive)
  for(const pl of V.pl){if(pl.dead)continue;}
  globalThis.__cr=[];C.off=false;for(const M of S.mounts)M.crew=null;
  const at=()=>{if(y>5){P.pos.set(S.ox-s+0.5,G0+y,S.oz+w+0.5);}else{const p=T.shipToWorld(S,S.ox-s,S.oz+w,{x:0,z:0});P.pos.set(p.x,G0+y,p.z);}P.vy=0;};
  at();run(0.3);T.shipGQ(C);
  let t=0,minIs=1e9,av=0;while(t<SECS){run(0.5);t+=0.5;for(const M of S.mounts)M.crew=null;if(y<=5)at();
    for(const pl of V.pl){if(pl.av&&pl.av.t>0)av++;if(pl.ai){(globalThis.__ph=globalThis.__ph||{})[pl.ai.ph]=((globalThis.__ph||{})[pl.ai.ph]||new Set()).add(pl);}}}console.log('phases reached',Object.entries(globalThis.__ph||{}).map(([k,v])=>k+':'+v.size).join(' '),'| missiles/shots',T.SHOTS.length);
  const cr=globalThis.__cr,isl=cr.filter(c=>c.x>=T.SHIP_X0&&Math.abs(S.ox-c.x)>8);
  console.log(k.padEnd(6),'launched',V.pl.filter(pl=>pl.ai||pl.dead).length,'| crashed',cr.length,cr.map(c=>(c.x>=T.SHIP_X0?'ship s'+f1(S.ox-c.x)+' w'+f1(c.z-S.oz)+' y'+f1(c.y-G0):'world y'+f1(c.y-G0))+(c.ground?' (sea/ground)':'')).join('; '),'| avoid samples',av);
  tot+=cr.length;
  C.off=true;
  // (bring the dead back for the next spot: a fresh carrier)
  T.tenvClear&&0;
}
for(const c of globalThis.__cr)console.log('  ',c.info.replace(/(\d\.\d\d)\d+/g,'$1'));console.log('TOTAL crashes',tot,'errors',errs.length,errs.slice(0,3).join(' | '));
process.exit(0);
