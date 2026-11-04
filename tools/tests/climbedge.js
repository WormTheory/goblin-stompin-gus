let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,bodyHits,BLOCK};\n})();');
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
global.localStorage={getItem:()=>null,setItem(){}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
console.error=()=>{};   // (the stub can't draw lightning, and says so in the weather's own stack trace)
eval(src);const T=window.__t;let now=1000,step=16.7;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=step;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// The odd ways of getting on to and about narrow things that suite spiderclimb doesn't try: coming in at an angle, grabbing
// on mid-jump, sprinting in, low frame rates, steering about on the wall, setting off again from the top, and real places.
// Every line says what happened; 'BAD' marks one that isn't what a player would want. ONLY=angle,jump,... to choose.
const ONLY=(process.env.ONLY||'angle,jump,sprint,fps,steer,down,off,world').split(',');
const DIRS=[[0,1],[1,0],[0,-1],[-1,0]],STONE=3,W='KeyW',AK='KeyA',SK='KeyS',DK='KeyD',C='KeyC',J='Space',SH='ShiftLeft';
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
A.hp=20;S(30);
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
for(let x=X0-16;x<=X0+16;x++)for(let z=Z0-16;z<=Z0+16;z++){T.setRaw(x,F-1,z,STONE);for(let y=F;y<F+36;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
let built=[];const clear=()=>{for(const [x,y,z] of built)T.setRaw(x,y,z,0);built=[];};
const build=(d,cols)=>{for(const [u,v,a,b] of cols)for(let y=a;y<b;y++){const q=[X0+d[0]*u-d[1]*v,F+y,Z0+d[1]*u+d[0]*v];T.setRaw(q[0],q[1],q[2],STONE);built.push(q);}};
const row=(u,a,b,w=4)=>{const o=[];for(let v=-w;v<=w;v++)o.push([u,v,a,b]);return o;};
const SH_={pillar:h=>[[[3,0,0,h]],h],wall:h=>[row(3,0,h),h],ledge:h=>[[...row(3,0,h,11),...row(4,0,h+9,11)],h],platform:h=>[[...row(3,0,h),...row(4,0,h),...row(5,0,h),...row(6,0,h),...row(7,0,h)],h]};
const allUp=()=>{T.keys.clear();};
const put=(x,z,w,y=F)=>{A.pos.set(x,y,z);A.heading=w;A.cam.yaw=w+Math.PI;A.cam.pitch=-0.3;A.state='walk';A.vy=0;A.mvx=A.mvz=0;A.grounded=true;A.piv=null;A.peakY=y;A.hp=20;A.stam=100;A.exhausted=false;A.perch=false;A.dashT=0;A.dodge=null;A.climbD=null;};
const setup=(d,shape,h)=>{clear();const [c,top]=SH_[shape](h);build(d,c);return top;};
const on=top=>Math.abs(A.pos.y-(F+top))<0.01&&A.grounded&&A.state==='walk';
const hold=(top,n=900)=>{let t=0,got=false;for(;t<n&&!got;t++){S(1);if(on(top))got=true;}return {got,t};};
const desc=d=>`y ${(A.pos.y-F).toFixed(2)} ${A.state} out ${((A.pos.x-X0-.5)*d[0]+(A.pos.z-Z0-.5)*d[1]).toFixed(2)} across ${((A.pos.x-X0-.5)*-d[1]+(A.pos.z-Z0-.5)*d[0]).toFixed(2)}`;
let nBad=0,nAll=0;const say=(ok,label,rest='')=>{nAll++;if(!ok)nBad++;console.log(ok?'    ':'BAD ',label,rest);};
const tally=(label,R)=>{const ok=R.filter(r=>r.ok).length,b=R.find(r=>!r.ok);say(ok===R.length,label,`${ok}/${R.length} `+(b?b.s:''));};
if(ONLY.includes('angle')){console.log('-- walking in at an angle (forward and climb held)');
 for(const shape of ['pillar','wall','ledge','platform'])for(const h of [3,6])for(const a of [15,-15,30,-30,40,-40,60,-60]){
  const R=DIRS.map(d=>{const top=setup(d,shape,h),w=Math.atan2(d[0],d[1])+a*Math.PI/180,cx=X0+d[0]*3+.5,cz=Z0+d[1]*3+.5;
   put(cx-Math.sin(w)*6,cz-Math.cos(w)*6,w);S(2);T.keys.add(W);T.keys.add(C);hold(top,500);allUp();S(45);return {ok:on(top),s:desc(d)};});
  tally(`${shape} high ${h} at ${a} degrees`.padEnd(36),R);}
}
if(ONLY.includes('jump')){console.log('-- jumping at it with climb held');
 for(const shape of ['pillar','wall','ledge','platform'])for(const h of [2,3,4,5,8])for(const far of [1.2,2.5,4]){
  const R=DIRS.map(d=>{const top=setup(d,shape,h),fx=X0+d[0]*3+.5-d[0]*.5,fz=Z0+d[1]*3+.5-d[1]*.5;put(fx-d[0]*far,fz-d[1]*far,Math.atan2(d[0],d[1]));S(2);T.keys.add(W);T.keys.add(C);T.keys.add(J);S(4);T.keys.delete(J);hold(top,500);allUp();S(45);return {ok:on(top),s:desc(d)};});
  tally(`${shape} high ${h} from ${far} away`.padEnd(36),R);}
}
if(ONLY.includes('sprint')){console.log('-- sprinting in with climb held');
 for(const tr of [true,false]){T.ABIL.trample=tr;for(const shape of ['pillar','wall','ledge','platform'])for(const h of [2,3,6]){
  const R=DIRS.map(d=>{const top=setup(d,shape,h);put(X0+.5-d[0]*9,Z0+.5-d[1]*9,Math.atan2(d[0],d[1]));S(2);T.keys.add(SH);T.keys.add(W);T.keys.add(C);hold(top,500);allUp();S(45);const sur=built.every(([x,y,z])=>T.solidAt(x,y,z));return {ok:on(top),s:desc(d)+(sur?'':' (block smashed)')};});
  tally(`trample ${tr?'on ':'off'} ${shape} high ${h}`.padEnd(36),R);}}
 T.ABIL.trample=true;
}
if(ONLY.includes('fps')){console.log('-- at low frame rates');
 for(const ms of [33.4,50,80,120]){step=ms;for(const [shape,h] of [['pillar',3],['pillar',6],['wall',3],['ledge',3],['ledge',6],['platform',3]]){
  const R=DIRS.map(d=>{const top=setup(d,shape,h);put(X0+.5-d[0],Z0+.5-d[1],Math.atan2(d[0],d[1]));S(2);T.keys.add(W);T.keys.add(C);hold(top,600);allUp();S(20);return {ok:on(top),s:desc(d)};});
  tally(`${ms} ms a frame ${shape} high ${h}`.padEnd(36),R);}}
 step=16.7;
}
const grab=(d,y)=>{put(X0+.5-d[0],Z0+.5-d[1],Math.atan2(d[0],d[1]));S(2);T.keys.add(W);T.keys.add(C);for(let i=0;i<300&&!(A.state==='climb'&&A.pos.y>=F+y);i++)S(1);T.keys.delete(W);S(2);return A.state==='climb';};
if(ONLY.includes('steer')){console.log('-- crawling sideways on it, then on up');
 const SHP={pillar:h=>[[3,0,0,h]],'wall 3 wide 1 deep':h=>row(3,0,h,1),'wall 9 wide 1 deep':h=>row(3,0,h,4),'block 2x2':h=>[[3,0,0,h],[3,1,0,h],[4,0,0,h],[4,1,0,h]]};
 for(const name of Object.keys(SHP))for(const key of [DK,AK])for(const secs of [2,6,12]){
  const R=DIRS.map(d=>{clear();build(d,SHP[name](7));if(!grab(d,2)){allUp();return {ok:false,s:'no grab '+desc(d)};}let turns=0,lastD=A.climbD,fell=null;T.keys.add(key);
   for(let i=0;i<secs*60;i++){S(1);if(A.climbD&&String(A.climbD)!==String(lastD)){turns++;lastD=A.climbD;}if(A.state==='walk'){fell=i;break;}}
   T.keys.delete(key);if(fell!==null){allUp();S(45);return {ok:false,s:`let go after ${(fell/60).toFixed(1)}s, ${turns} corners, `+desc(d)};}
   for(let i=0;i<60&&A.state!=='climb';i++)S(1);S(3);T.keys.add((A.climbFlip||1)>0?W:SK);hold(7,300);allUp();S(45);return {ok:on(7),s:`${turns} corners, `+desc(d)};});
  tally(`${name} ${key==='KeyD'?'right':'left'} for ${secs}s`.padEnd(36),R);}
}
if(ONLY.includes('down')){console.log('-- climbing back down');
 for(const shape of ['pillar','wall','ledge','platform']){
  const R=DIRS.map(d=>{setup(d,shape,8);if(!grab(d,4)){allUp();return {ok:false,s:'no grab'};}T.keys.add(SK);let i=0;for(;i<360&&A.state!=='walk';i++)S(1);allUp();S(45);return {ok:Math.abs(A.pos.y-F)<0.01&&A.state==='walk'&&!T.bodyHits(A,A.pos.x,A.pos.z,A.heading),s:desc(d)+' after '+(i/60).toFixed(1)+'s'};});
  tally(`${shape} down to the floor`.padEnd(36),R);}
}
if(ONLY.includes('off')){console.log('-- setting off again from the top');
 // sets up on top, lets everything go, then holds keys for a second and a half and says what happened
 const after=(shape,h,keysOn,test,label)=>{const R=DIRS.map(d=>{const top=setup(d,shape,h);put(X0+.5-d[0],Z0+.5-d[1],Math.atan2(d[0],d[1]));S(2);T.keys.add(W);T.keys.add(C);hold(top,700);allUp();S(45);if(!on(top))return {ok:false,s:'never got on top: '+desc(d)};
   const x0=A.pos.x,z0=A.pos.z,hit0=T.bodyHits(A,x0,z0,A.heading);for(const k of keysOn)T.keys.add(k);const seen=new Set();for(let i=0;i<90;i++){S(1);seen.add(A.state);}const res={top,moved:Math.hypot(A.pos.x-x0,A.pos.z-z0),y:A.pos.y-F,seen,hit0,hit1:T.bodyHits(A,A.pos.x,A.pos.z,A.heading)};allUp();S(10);return {ok:test(res),s:desc(d)+` moved ${res.moved.toFixed(2)} states ${[...seen]}`+(hit0?' overlapping at the start':'')};});tally(label.padEnd(46),R);};
 const moved=r=>r.moved>0.8,tip=r=>r.seen.has('climb')||r.seen.has('piv')||r.moved>0.8,along=r=>r.moved>1&&Math.abs(r.y-r.top)<0.01;
 after('pillar',3,[W],moved,'pillar 3: forward, no climb: walks off');
 after('pillar',3,[W,C],moved,'pillar 3: forward with climb: walks off');
 after('pillar',6,[W,C],tip,'pillar 6: forward with climb: tips over or off');
 after('pillar',3,[SK],moved,'pillar 3: back: turns and walks off');
 after('pillar',3,[AK],moved,'pillar 3: left: turns and walks off');
 after('pillar',6,[DK,C],tip,'pillar 6: right with climb: tips over or off');
 after('wall',3,[W],moved,'free wall 3: forward: walks off');
 after('wall',3,[DK],r=>r.moved>1,'free wall 3: right: moves');
 after('ledge',3,[DK],along,'ledge 3: right: walks along the ledge');
 after('ledge',3,[AK],along,'ledge 3: left: walks along the ledge');
 after('ledge',3,[DK,C],along,'ledge 3: right with climb: along the ledge');
 after('ledge',3,[AK,C],along,'ledge 3: left with climb: along the ledge');
 after('ledge',3,[W],r=>Math.abs(r.y-r.top)<0.01&&!r.hit1,'ledge 3: forward, no climb: stays, not in the wall');
 after('ledge',3,[W,C],r=>r.y>r.top+0.5,'ledge 3: forward with climb: climbs on up');
 after('ledge',3,[SK],moved,'ledge 3: back: drops off');
 after('ledge',6,[SK,C],tip,'ledge 6: back with climb: tips over or off');
 after('ledge',3,[J],r=>r.hit1===false,'ledge 3: jump: comes down clear of the wall');
 after('platform',3,[W],moved,'platform 3: forward: walks on');
}
if(ONLY.includes('off')){console.log('-- a slot too narrow to stand in: on up the wall at the back of it');
 const R=DIRS.map(d=>{clear();build(d,[[3,0,0,8],[4,0,0,20],...row(3,8,20,4).filter(c=>c[1]!==0)]);build(d,row(3,0,8,4).filter(c=>c[1]!==0));put(X0+.5-d[0],Z0+.5-d[1],Math.atan2(d[0],d[1]));S(2);T.keys.add(W);T.keys.add(C);S(300);const st=A.state,y=A.pos.y-F;allUp();T.keys.add(C);S(5);allUp();S(45);return {ok:y>12,s:`was ${st} at y ${y.toFixed(2)}, then `+desc(d)};});
 tally('slot in a wall, 8 up'.padEnd(36),R);
}
if(ONLY.includes('world')){console.log('-- things that are really in the world');
 const topOf=(x,z,from)=>{let y=from;while(y>0&&!T.solidAt(x,y,z))y--;return y+1;};
 const stats={};let tried=0;const CAPN=+(process.env.WN||200);
 const SP=[];for(const r of [0,90,300,700,1400])for(let k=0;k<(r?8:1);k++)SP.push([Math.round(Math.cos(k*.785)*r),Math.round(Math.sin(k*.785)*r)]);
 for(const [dx,dz] of SP){const ox=X0+dx,oz=Z0+dz;put(ox,oz,0,120);A.spawnSnap=false;S(90);
  const posts=[];for(let x=ox-28;x<=ox+28;x++)for(let z=oz-28;z<=oz+28;z++){const t=topOf(x,z,110);if(t<2||(t>=F-1&&Math.abs(x-X0)<=16&&Math.abs(z-Z0)<=16))continue;const b=T.get(x,t-1,z);   // (not the test's own arena)
   if(!T.BLOCK[b]||T.BLOCK[b].ramp||T.BLOCK[b].stair||T.BLOCK[b].brittle)continue;   // (fences go flat when he walks into them, climb held or not)
    const n=DIRS.map(([a,c])=>topOf(x+a,z+c,t+3));
    for(let i=0;i<4;i++){const f=n[(i+2)%4],bk=n[i],dd=DIRS[i],nx=x-dd[0],nz=z-dd[1],gy=f;   // (from the far side of direction i, towards it)
      if(gy>t-2||t-gy>14||T.get(nx,gy-1,nz)===9)continue;
      if(topOf(nx-dd[0],nz-dd[1],gy+1)!==gy||topOf(nx-dd[0]*2,nz-dd[1]*2,gy+1)!==gy)continue;
      if([0,1,2,3].some(h=>T.solidAt(nx,gy+h,nz)||T.solidAt(nx-dd[0],gy+h,nz-dd[1])))continue;
      if(T.solidAt(x,t,z)||T.solidAt(x,t+1,z)||T.solidAt(x,t+2,z))continue;
      {let whole=true;for(let y=gy;y<t;y++)if(!T.solidAt(x,y,z))whole=false;if(!whole)continue;}   // (solid all the way up: not a sign or a tree's crown overhead)
      if(!(bk<t||bk>t+1))continue;   // (a block deep: past it is a drop, or a wall)
      posts.push({x,z,t,gy,dd,b,bk});break;}}
  // a spread of them, not all from one wall
  const seen=new Set(),pick=[];for(const q of posts.sort(()=>Math.random()-.5)){const k=q.b+'|'+Math.floor(q.x/6)+'|'+Math.floor(q.z/6);if(seen.has(k))continue;seen.add(k);pick.push(q);if(pick.length>=CAPN/SP.length)break;}
  for(const q of pick){const w=Math.atan2(q.dd[0],q.dd[1]);put(q.x+.5-q.dd[0]*2.2,q.z+.5-q.dd[1]*2.2,w,q.gy);if(T.bodyHits(A,A.pos.x,A.pos.z,w))continue;S(2);T.keys.add(W);T.keys.add(C);let got=false,seenC=false,t=0;
   for(;t<(q.t-q.gy)*30+240&&!got;t++){S(1);if(A.state==='climb')seenC=true;if(A.state==='walk'&&A.grounded&&A.pos.y>=q.t-1.05)got=true;}   // (up there, or gone on up something higher behind it)
   allUp();S(45);tried++;const K=`block ${q.b}`+(q.bk<q.t?' drop behind':' wall behind');stats[K]=stats[K]||{ok:0,bad:0,ex:null};
   if(got)stats[K].ok++;else{stats[K].bad++;if(process.env.WX){const L=[];for(let y=q.t+3;y>=q.gy-1;y--){let l=String(y).padStart(4)+' ';for(let u=-2;u<=5;u++)l+=String(T.get(q.x+q.dd[0]*u,y,q.z+q.dd[1]*u)||'.').padStart(4);L.push(l);}console.log(K,'at',q.x,q.t,q.z,'dir',q.dd,'ended',A.pos.x.toFixed(1),A.pos.y.toFixed(1),A.pos.z.toFixed(1),A.state,'climbed',seenC,String.fromCharCode(10)+L.join(String.fromCharCode(10)));}stats[K].ex=stats[K].ex||`at ${q.x},${q.t},${q.z} from ${q.dd} ground ${q.gy} behind ${q.bk} ended y ${A.pos.y.toFixed(1)} at ${A.pos.x.toFixed(1)},${A.pos.z.toFixed(1)} ${A.state} climbed ${seenC}`;}}
 }
 console.log('tried',tried);for(const k of Object.keys(stats).sort()){const s=stats[k];say(s.bad===0,k.padEnd(28),`${s.ok} ok ${s.bad} failed `+(s.ex||''));}
}
console.log('fine',nAll-nBad,'of',nAll,'lines');process.exit(0);
