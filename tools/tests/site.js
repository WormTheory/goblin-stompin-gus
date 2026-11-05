let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={FOES,SHOTS,TRACERS,trainHit,damageGoblin,DT,nearestPlayer,get wrecked(){return wrecked},TRAIN_BOXES,get TENV(){return TENV},get TS(){return TS},tenvShow,tenvSpawn,tenvTick,tenvFoe,tenvClear,tenvRemove,tenvGo,stMatch,frame,players,goblins,cars,get,groundAt,chunks,meshes,venues,activeFix,activeProps,doorsOn,lmOn,bsigns,get nBS(){return nBS},refreshFixtures,refreshDoors,refreshVenues,plotType,superOf,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},get playing(){return playing},V3,get seed(){return seed},explored:()=>explored,SAVE_KEY};\n})();');
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
class Q{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}setFromAxisAngle(a,t){const s=Math.sin(t/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(t/2);return this}copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}}
class V3{project(){return this}fromBufferAttribute(a,i){const A=a.array||a.a;this.x=A[i*3];this.y=A[i*3+1];this.z=A[i*3+2];return this}applyMatrix4(m){const e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z+e[12];this.y=e[1]*x+e[5]*y+e[9]*z+e[13];this.z=e[2]*x+e[6]*y+e[10]*z+e[14];return this}setFromMatrixPosition(o){this.x=o.position.x;this.y=o.position.y;this.z=o.position.z;return this}normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}applyQuaternion(q){const x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this}constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}clone(){return new V3(this.x,this.y,this.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}setScalar(s){return this.set(s,s,s)}}
class Rot extends V3{constructor(){super();this.order='XYZ'}}
class Col{constructor(r,g,b){if(typeof r==='number'&&g===undefined)this.setHex(r);else{this.r=r||0;this.g=g||0;this.b=b||0;}}setHex(h){this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this}copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}clone(){return new Col(this.r,this.g,this.b)}lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this}multiplyScalar(k){this.r*=k;this.g*=k;this.b*=k;return this}getHexString(){return [this.r,this.g,this.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')}}
class Mat{dummy(){}dispose(){}constructor(o={}){Object.assign(this,o);this.color=new Col();this.emissive=new Col();this.opacity=o.opacity??1}}
class O3{updateMatrixWorld(){}get matrixWorld(){return {position:this.position,elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}}lookAt(){}traverse(f){f(this);for(const c of this.children)c.traverse?c.traverse(f):f(c);}remove(){}constructor(g,m){this.matrix=new M4();this.layers={set(){},enable(){}};this.quaternion=new Q();this.userData={};this.position=new V3();this.rotation=new Rot();this.scale=new V3(1,1,1);this.children=[];this.visible=true;this.geometry=g||{dispose(){}};this.material=m}add(c){this.children.push(c);if(c&&typeof c==="object")c.parent=this;return this}remove(){}}
class M4{makeTranslation(){return this}compose(){return this}makeRotationAxis(){return this}makeScale(){return this}multiply(){return this}premultiply(){return this}multiplyMatrices(){return this}makeRotationY(){return this}setPosition(){return this}copy(){return this}}
const THREE={CylinderGeometry:class{translate(){return this}rotateX(){return this}dispose(){}},ShaderChunk:{common:'',project_vertex:'mvPosition = modelViewMatrix * mvPosition;'},Material:class{},ConeGeometry:class{dispose(){}translate(){return this}rotateX(){return this}},DataTexture:class{constructor(){this.needsUpdate=false}},RGBAFormat:1023,InstancedBufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n}},SphereGeometry:class{dispose(){}},ShaderMaterial:class{constructor(o){Object.assign(this,o)}},Matrix4:M4,InstancedMesh:class extends O3{get isMesh(){return true}constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false,array:new Float32Array(n*16)}}setMatrixAt(){}setColorAt(){this.instanceColor={needsUpdate:false}}},Quaternion:Q,Vector4:class{constructor(x,y,z,w){this.set(x,y,z,w)}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}},Vector2:V3,Vector3:V3,Color:Col,Group:O3,Mesh:class extends O3{get isMesh(){return true}},Scene:class extends O3{},LineSegments:O3,
 MeshBasicMaterial:Mat,MeshLambertMaterial:Mat,LineBasicMaterial:Mat,
 BoxGeometry:class{constructor(w=1,h=1,d=1){this.p=[w,h,d]}computeBoundingBox(){const[w,h,d]=this.p;this.boundingBox={min:{x:-w/2,y:-h/2,z:-d/2},max:{x:w/2,y:h/2,z:d/2}}}setAttribute(){}dispose(){}translate(){return this}rotateX(){return this}},RingGeometry:class{dispose(){}},CircleGeometry:class{dispose(){}},EdgesGeometry:class{constructor(){this.attributes={position:{array:new Float32Array(72).map((_,i)=>(i%3===0?(i>>4&1):i%3===1?(i>>3&1):(i>>2&1))-0.5),count:24}}}dispose(){}},PlaneGeometry:class{dispose(){}},
 BufferGeometry:class{setDrawRange(){}constructor(){this.attributes={}}setAttribute(n,a){this.attributes[n]=a}setIndex(){}dispose(){}},BufferAttribute:class{constructor(a){this.array=a}setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}getX(i){return this.array[i*3]}getY(i){return this.array[i*3+1]}getZ(i){return this.array[i*3+2]}},Points:class extends O3{},Object3D:class extends O3{updateMatrix(){this.matrix={elements:[this.scale.x,0,0,0,0,this.scale.y,0,0,0,0,this.scale.z,0,this.position.x,this.position.y,this.position.z,1]}}},PointsMaterial:Mat,Float32BufferAttribute:class{constructor(a){this.a=a;this.array=a;this.count=a.length/3}},
 CanvasTexture:class{constructor(){this.offset=new V3();this.repeat=new V3()}},NearestFilter:1,RepeatWrapping:1,DoubleSide:2,
 Plane:class{constructor(n,c){this.normal=n;this.constant=c}},Fog:class{constructor(c,n,f){this.color=new Col();this.near=n;this.far=f}},
 PerspectiveCamera:class extends O3{updateProjectionMatrix(){}},
 WebGLRenderer:class{get capabilities(){return {getMaxAnisotropy:()=>8}}clearDepth(){}setClearColor(){}get domElement(){return {clientWidth:640,clientHeight:360,width:0,height:0}}getPixelRatio(){return 1}setPixelRatio(){}setSize(){}render(){}setScissorTest(){}setViewport(){}setScissor(){}},
 HemisphereLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}},DirectionalLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}}};
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

// The compounds' people (thieves, preppers, militia) and the military base's tanks and helicopters: alive or parked from the
// start, turning on Gus when he comes close (or hurts one); what each fires or throws; the Testing Environment's buttons
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;
run(2);const G0=44;
const spawnK=k=>{T.tenvSpawn(k);let n=0;while(T.TS.search&&n<5000){T.tenvTick();n++;}return T.TENV.boxes[T.TENV.boxes.length-1];};
const foes=k=>T.goblins.filter(g=>g.foeKind===k&&g.state==='chase');
const place=(x,z)=>{P.pos.set(x,0,z);P.pos.y=Math.max(G0+1,T.groundAt(x,z,80));P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.rideC=null;P.vcl=null;if(P.state==='climb')P.state='walk';};   // (off anything he's riding; the flat world is all at ground level: right even before its chunk's built)
// count what's fired and thrown, and the hits on Gus, over s seconds (keeping him alive)
const watch=(s,label,extra)=>{let shots=0,bombs={},hits=0,last=P.hp,lowest=P.hp;const seenT=new Map(),seenS=new Set();
  for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);
    for(const t of T.TRACERS){if(t.t>(seenT.get(t)??0)+0.001)shots++;seenT.set(t,t.t);}
    for(const S of T.SHOTS){if(S.live&&!seenS.has(S)){seenS.add(S);bombs[S.kind]=(bombs[S.kind]||0)+1;}if(!S.live)seenS.delete(S);}
    if(P.hp<last)hits++;last=P.hp;lowest=Math.min(lowest,P.hp);if(P.hp<8)P.hp=20;}
  console.log(label,'| bullets',shots,'| thrown/fired',JSON.stringify(bombs),'| hits on gus',hits,'lowest hp',lowest,extra?'| '+extra():'');};
for(const [site,k] of [['thieves','thief'],['prepper','prepper'],['militia','militia']]){
  const B=spawnK(site);if(!B||B.k!==site){console.log(site,'not found');continue;}
  run(3);const V=[...T.venues.values()].find(v=>v.kind==='guards'&&v.style===site);
  const fs=foes(k);
  console.log(site.padEnd(8),'box',JSON.stringify(B),'| posts',V&&V.posts.length,'filled',V&&V.slots.filter(Boolean).length,'| alive',fs.length,'hp',fs.map(g=>g.hp).join(','),'| up a tower',fs.filter(g=>g.hold).length,'| roused',V&&V.roused,'| jobs',fs.slice(0,3).map(g=>g.id.occ).join(', '));
  run(3);console.log('   3 s later: still calm',V&&!V.roused,'gus hp',P.hp,'| at posts',fs.map(g=>Math.hypot(g.pos.x-g.post.x,g.pos.z-g.post.z).toFixed(1)).join(' '));
  // walk him in to just inside the rousing distance of the nearest post
  const F=V.posts.find(q=>q.y<G0+3)||V.posts[0];place(F.x+3,F.z+(site==='thieves'?8:14));run(0.2);
  console.log('   gus near the posts: roused',V.roused);P.hp=20;
  watch(8,'   8 s',()=>'alive '+foes(k).length+' at '+foes(k).map(g=>Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z).toFixed(0)).join(' '));
  for(const g of foes(k))T.damageGoblin(g,99,new T.V3(g.pos.x,g.pos.y+1,g.pos.z),new T.V3(0,0.5,1));run(12);
  console.log('   killed all: alive',foes(k).length,'slain marks',V.slain.filter(Boolean).length);
  T.tenvClear();place(P.pos.x,P.pos.z+600);run(2);
}
// hurt one at its post: the whole compound turns
{const B=spawnK('prepper');const cx=(B.ax+B.w/2)*32,cz=(B.az+B.h/2)*32;place(cx,cz+60);run(3);const V=[...T.venues.values()].filter(v=>v.kind==='guards'&&v.style==='prepper').sort((a,b)=>Math.hypot(a.cx-cx,a.cz-cz)-Math.hypot(b.cx-cx,b.cz-cz))[0];
 const g=foes('prepper').find(o=>o.homeV===V);console.log('preppers, gus 60 off: roused',V.roused,'alive',foes('prepper').length);
 if(g){T.damageGoblin(g,1,new T.V3(g.pos.x,g.pos.y+1,g.pos.z),new T.V3(0,0.5,1));run(0.1);console.log('hit one: roused',V.roused);}
 T.tenvClear();place(P.pos.x,P.pos.z+600);run(2);}
// the military base
{const B=spawnK('base');run(4);const V=[...T.venues.values()].find(v=>v.kind==='army');
 const tanks=()=>V.mil.filter(M=>M.kind==='tank'),helis=()=>V.mil.filter(M=>M.kind==='heli');
 const blk=(u,v,y)=>T.get(V.X0+u,y,V.Z0+v);
 console.log('base box',JSON.stringify(B),'| tanks',tanks().length,'helicopters',helis().length,'| parked',V.mil.filter(M=>M.state==='park').length,'| alert',V.alert,'| old block tanks gone',blk(40,40,G0+2)===0&&blk(111,42,G0+2)===0&&blk(78,76,G0+2)===0,'| gus in base',P.pos.x>V.X0&&P.pos.x<V.X0+V.W&&P.pos.z>V.Z0&&P.pos.z<V.Z0+V.Hh);
 console.log('stand-ins in TRAIN_BOXES',T.TRAIN_BOXES.filter(b=>b.proxy&&b.proxy.T&&b.proxy.T.isMil).length);
 run(5);console.log('5 s outside: alert',V.alert);
 place(V.X0+30,V.Z0+60);run(0.2);console.log('gus in the base: alert',V.alert);P.hp=20;
 const st=()=>'hunting tanks '+tanks().filter(M=>M.state==='hunt').length+' moved '+tanks().filter(M=>Math.hypot(M.x-M.home.x,M.z-M.home.z)>1).length+' | helis '+helis().map(M=>M.state+' up '+(M.y-G0-1).toFixed(1)+' from gus '+Math.hypot(M.x-P.pos.x,M.z-P.pos.z).toFixed(0)).join(', ');
 watch(4,'base first 4 s',st);watch(10,'base next 10 s',st);
 // knock out a tank and a helicopter
 T.DT.invuln=true;P.hp=20;const t0=tanks().find(M=>M.state==='hunt'),h0=helis()[0];
 for(let i=0;i<20&&!t0.dead;i++)T.trainHit(t0,20,null,0);for(let i=0;i<20&&!h0.dead;i++)T.trainHit(h0,20,null,0);
 run(0.1);const y0=h0.y;run(6);console.log('destroyed: tank',t0.dead,'helicopter',h0.dead,'it fell',(y0-h0.y).toFixed(1),'to',(h0.y-G0-1).toFixed(1),'| saved wrecked',!!T.wrecked[t0.key]&&!!T.wrecked[h0.key],'| another tank woke',tanks().filter(M=>M.state==='hunt'&&!M.dead).length);
 // away: it stands down
 place(V.cx,V.cz+520);run(40);const V2=[...T.venues.values()].find(v=>v.kind==='army');console.log('gone 500 off for 40 s: venue',!!V2,V2?'alert '+V2.alert:'(dropped)');
 place(V.X0-20,V.Z0+60);run(3);const V3b=[...T.venues.values()].find(v=>v.kind==='army');console.log('back at the fence: alert',V3b&&V3b.alert,'wrecks still wrecked',V3b&&V3b.mil.filter(M=>M.dead).length,'parked',V3b&&V3b.mil.filter(M=>M.state==='park').length);T.DT.invuln=false;
 T.tenvClear();place(P.pos.x,P.pos.z+700);run(2);}
// the Testing Environment's buttons
for(const k of ['thief','prepper','militia']){T.tenvClear();run(0.5);T.menuOpen=true;T.TS.n=3;T.tenvFoe(k);console.log('foe',k,els.tpInfo.textContent);T.menuOpen=false;P.hp=20;
  watch(5,'   '+k+' button, 5 s',()=>'at '+foes(k).map(g=>Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z).toFixed(1)).join(' '));}
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
