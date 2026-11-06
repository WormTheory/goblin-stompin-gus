let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={players,cars,goblins,keys,frame,setRaw,get,solidAt,groundAt,ABIL,AB,bodyHits,BLOCK,setBind,setChar,DT,vBox,vHold};\n})();');
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
// Fighting from a wall: R1 (bite) while spider-climbing snaps at goblins the way his head points; stomp kicks a hole
// through the wall and puts him inside. Every line says what happened; 'BAD' marks one that isn't what it should be.
const DIRS=[[0,1],[1,0],[0,-1],[-1,0]],STONE=3,W='KeyW',SK='KeyS',DK='KeyD',C='KeyC',BITE='KeyB',STOMP='KeyE';
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}
const gob=T.goblins.find(g=>!g.civ&&!g.staff&&!g.medic&&!g.ff&&!g.cop)||T.goblins[0];
const park=()=>{for(const g of T.goblins){g.state='wait';g.t=-1e9;}};park();
A.hp=20;S(30);T.setBind('bite','kb',0,BITE);   // (the mouse doesn't come through the stub: R1 on a key instead)
const X0=Math.floor(A.pos.x),Z0=Math.floor(A.pos.z),F=70;
for(let x=X0-16;x<=X0+16;x++)for(let z=Z0-16;z<=Z0+16;z++){T.setRaw(x,F-1,z,STONE);for(let y=F;y<F+30;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);}
for(let y=1;y<F-1;y++)T.setRaw(X0+16,y,Z0+16,STONE);   // (a leg down to the ground, so a kicked hole doesn't let the whole floating floor fall)
let built=[];const clear=()=>{for(const [x,y,z] of built)T.setRaw(x,y,z,0);built=[];for(let x=X0-16;x<=X0+16;x++)for(let z=Z0-16;z<=Z0+16;z++)for(let y=F;y<F+16;y++)if(T.get(x,y,z))T.setRaw(x,y,z,0);};
// u: blocks out in front of him, v: across
const blk=(d,u,v,y)=>{const q=[X0+d[0]*u-d[1]*v,F+y,Z0+d[1]*u+d[0]*v];T.setRaw(q[0],q[1],q[2],STONE);built.push(q);};
const W2=(d,u,v)=>[X0+d[0]*u-d[1]*v,Z0+d[1]*u+d[0]*v];
let nBad=0,nAll=0;const say=(ok,label,rest='')=>{nAll++;if(!ok)nBad++;console.log(ok?'    ':'BAD ',label,rest);};
const tally=(label,R)=>{const ok=R.filter(r=>r.ok).length,b=R.find(r=>!r.ok);say(ok===R.length,label.padEnd(46),`${ok}/${R.length} `+(b?b.s:''));};
const put=(x,z,w)=>{A.pos.set(x,F,z);A.heading=w;A.cam.yaw=w+Math.PI;A.cam.pitch=-0.3;A.state='walk';A.vy=0;A.mvx=A.mvz=0;A.grounded=true;A.piv=null;A.peakY=F;A.hp=20;A.perch=false;A.biteT=0;A.biteCD=0;A.qBite=0;A.qStomp=0;};
// on to the wall in front (u=3) and up it to height y, then let go of the stick (climb still held)
const grab=(d,y)=>{put(X0+.5-d[0],Z0+.5-d[1],Math.atan2(d[0],d[1]));S(2);T.keys.add(W);T.keys.add(C);for(let i=0;i<400&&!(A.state==='climb'&&A.pos.y>=F+y);i++)S(1);T.keys.delete(W);S(3);return A.state==='climb';};
const press=k=>{T.keys.add(k);S(2);T.keys.delete(k);};
const desc=d=>`y ${(A.pos.y-F).toFixed(2)} ${A.state} out ${((A.pos.x-X0-.5)*d[0]+(A.pos.z-Z0-.5)*d[1]).toFixed(2)} across ${((A.pos.x-X0-.5)*-d[1]+(A.pos.z-Z0-.5)*d[0]).toFixed(2)}`;
const putGob=(x,y,z)=>{gob.state='chase';gob.hp=gob.hpMax=99;gob.stun=0;gob.vy=0;gob.t=0;gob.act=null;gob.indoor=false;gob.civ=false;gob.kv.set(0,0,0);gob.pos.set(x,y,z);gob.root.visible=true;};

console.log('-- R1 on the wall');
// a tall wall; he hangs on at height 4, his head pointed up, along or down; a goblin is put where it's wanted, relative to
// his body (a: along the way his head points, o: out from the wall), and stays put for the bite
const tall=d=>{for(let v=-6;v<=6;v++)for(let y=0;y<14;y++)blk(d,3,v,y);};
for(const [how,keys] of [['head up',[W]],['head along (right)',[DK]],['head down',[SK]]])for(const [where,along,out,want] of [['in front of his snout',2.4,0.6,true],['just past his snout',3.4,0.8,true],['beside his snout, out from the wall',2.0,1.3,true],['well out of reach',6,0.6,false],['behind him',-2.5,0.6,false]]){
  const R=DIRS.map(d=>{clear();tall(d);if(!grab(d,4))return {ok:false,s:'no grab '+desc(d)};
    for(const k of keys)T.keys.add(k);S(how==='head up'?6:24);for(const k of keys)T.keys.delete(k);S(30);   // (turn his head that way, then stop)
    if(A.state!=='climb')return {ok:false,s:'fell off: '+desc(d)};
    const r=A.climbRoll||0,dd=A.climbD,u=[-dd[1]*Math.sin(r),Math.cos(r),dd[0]*Math.sin(r)],c=[A.pos.x-dd[0]*0.5,A.pos.y+1.3,A.pos.z-dd[1]*0.5];
    const gx=c[0]+u[0]*along-dd[0]*out,gy=c[1]+u[1]*along-0.7,gz=c[2]+u[2]*along-dd[1]*out;
    let hp0=0,hit=false;for(let i=0;i<40;i++){putGob(gx,gy,gz);if(i===0)hp0=gob.hp;if(i===2)press(BITE);else S(1);if(gob.hp<hp0)hit=true;}
    const st=A.state;park();return {ok:hit===want&&st==='climb',s:`${hit?'hit':'missed'}, ${st}, roll ${r.toFixed(2)} `+desc(d)};});
  tally(`${how}: goblin ${where}`,R);
}
{// biting again straight away waits for the cooldown, and he never lets go
  const R=DIRS.map(d=>{clear();tall(d);if(!grab(d,4))return {ok:false,s:'no grab'};const c=[A.pos.x-A.climbD[0]*0.5,A.pos.y+1.3,A.pos.z-A.climbD[1]*0.5];
    let hits=0,last=99;for(let i=0;i<60;i++){putGob(c[0]-A.climbD[0]*0.5,c[1]+2.4-0.7,c[2]-A.climbD[1]*0.5);if(i%4===0)press(BITE);else S(1);if(gob.hp<last){hits++;}last=gob.hp;}
    const st=A.state;park();return {ok:hits>=1&&hits<=2&&st==='climb',s:`${hits} hits in a second, ${st}`};});
  tally('mashing R1 for a second: one bite or two',R);
}

console.log('-- stomp on the wall: through it and in');
// a hollow box (inside 6 across, 5 deep) with walls 'th' thick, a floor inside at 'fl' and a second floor 5 up
const house=(d,th,fl=0)=>{for(let u=3;u<3+th*2+5;u++)for(let v=-5-th;v<=5+th;v++){const wall=u<3+th||u>=3+th+5||Math.abs(v)>5;for(let y=0;y<11;y++)if(wall||y<fl||y===5)blk(d,u,v,y);}};
const inside=(d,th)=>{const u=(A.pos.x-X0-.5)*d[0]+(A.pos.z-Z0-.5)*d[1]+0.5,v=(A.pos.x-X0-.5)*-d[1]+(A.pos.z-Z0-.5)*d[0];return u>3+th&&u<3+th+5&&Math.abs(v)<5.5;};
for(const th of [1,2,3])for(const [h,floor] of [[1,0],[3,0],[6,6]]){
  const R=DIRS.map(d=>{clear();house(d,th);if(!grab(d,h))return {ok:false,s:'no grab '+desc(d)};press(STOMP);T.keys.delete(C);S(60);
    const ok=A.state==='walk'&&A.grounded&&Math.abs(A.pos.y-F-floor)<0.01&&inside(d,th)&&!T.bodyHits(A,A.pos.x,A.pos.z,A.heading);
    return {ok,s:`ended ${desc(d)}${T.bodyHits(A,A.pos.x,A.pos.z,A.heading)?' (in a wall)':''}`};});
  tally(`wall ${th} thick, from ${h} up: inside on the floor at ${floor}`,R);
}
{// a free-standing wall: out the far side, on the ground
  const R=DIRS.map(d=>{clear();for(let v=-5;v<=5;v++)for(let y=0;y<8;y++)blk(d,3,v,y);if(!grab(d,2))return {ok:false,s:'no grab'};press(STOMP);T.keys.delete(C);S(90);
    const out=(A.pos.x-X0-.5)*d[0]+(A.pos.z-Z0-.5)*d[1];return {ok:A.state==='walk'&&Math.abs(A.pos.y-F)<0.01&&out>3.5,s:desc(d)};});
  tally('free-standing wall 1 thick: out the far side',R);
}
{// high on a free-standing wall: through, and a drop to the ground
  const R=DIRS.map(d=>{clear();for(let v=-5;v<=5;v++)for(let y=0;y<12;y++)blk(d,3,v,y);if(!grab(d,7))return {ok:false,s:'no grab'};press(STOMP);T.keys.delete(C);S(150);
    const out=(A.pos.x-X0-.5)*d[0]+(A.pos.z-Z0-.5)*d[1];return {ok:A.state==='walk'&&A.pos.y<=F+0.01&&out>3.5,s:desc(d)+' grounded '+A.grounded};});   // (a drop that long is a crash landing: it may blow a hole in the floor)
  tally('high on a free-standing wall: through and down',R);
}
{// solid rock: he kicks a hollow and keeps clinging, a little further in
  const R=DIRS.map(d=>{clear();for(let u=3;u<12;u++)for(let v=-5;v<=5;v++)for(let y=0;y<12;y++)blk(d,u,v,y);if(!grab(d,3))return {ok:false,s:'no grab'};const o0=(A.pos.x-X0)*d[0]+(A.pos.z-Z0)*d[1];press(STOMP);S(40);
    const o1=(A.pos.x-X0)*d[0]+(A.pos.z-Z0)*d[1];const st=A.state;T.keys.delete(C);S(40);return {ok:st==='climb'&&o1-o0>2.5,s:`${st}, moved in ${(o1-o0).toFixed(2)}`};});
  tally('solid rock: a hollow, still clinging, further in',R);
}
{// a goblin just inside gets caught by the kick
  const R=DIRS.map(d=>{clear();house(d,1);if(!grab(d,1))return {ok:false,s:'no grab'};const [gx,gz]=W2(d,4.5,0.5);putGob(gx,F,gz);const h0=gob.hp;press(STOMP);for(let i=0;i<5;i++){S(1);}const hit=gob.hp<h0||gob.state==='dead';T.keys.delete(C);S(40);park();return {ok:hit,s:'goblin '+(hit?'hit':'missed')};});
  tally('goblin just inside the wall: hit by the kick',R);
}
{// stomp switched off in the Character tab: nothing happens
  T.ABIL.stomp=false;const R=DIRS.map(d=>{clear();house(d,1);if(!grab(d,1))return {ok:false,s:'no grab'};press(STOMP);S(20);const st=A.state,whole=built.every(([x,y,z])=>T.solidAt(x,y,z));T.keys.delete(C);S(30);return {ok:st==='climb'&&whole,s:`${st}, wall whole ${whole}`};});
  T.ABIL.stomp=true;tally('stomp switched off: still clinging, wall whole',R);
}
console.log('-- R1 clinging to the side of a vehicle');
{// a car parked on the floor; he takes hold of its long side, head up (or turned along it), and bites
 const car=T.cars.find(c=>!c.isTrain&&!c.isPlane&&c.hp>0)||T.cars[0];
 const R=[];for(const turn of [null,DK])for(const s of [1,-1]){clear();
  car.alive=true;car.respawnT=1e9;car.speed=0;car.parked=true;car.heading=0;car.pos.set(X0+.5,F,Z0+.5);car.vy=0;car.kv.set(0,0,0);car.hp=99;S(5);
  const b=T.vBox(car);put(car.pos.x-s*(b.hc+0.3),car.pos.z,s>0?Math.PI/2:-Math.PI/2);T.keys.add(C);const held=T.vHold(A,car,b,{k:'c',s},false);
  if(turn){T.keys.add(turn);S(20);T.keys.delete(turn);}S(10);
  const r=A.climbRoll||0,dd=A.climbD,u=[-dd[1]*Math.sin(r),Math.cos(r),dd[0]*Math.sin(r)],c=[A.pos.x-dd[0]*0.5,A.pos.y+1.3,A.pos.z-dd[1]*0.5];
  let hp0=0,hit=false;const ch0=car.hp;for(let i=0;i<40;i++){car.speed=0;putGob(c[0]+u[0]*2.4-dd[0]*0.6,c[1]+u[1]*2.4-0.7,c[2]+u[2]*2.4-dd[1]*0.6);if(i===0)hp0=gob.hp;if(i===2)press(BITE);else S(1);if(gob.hp<hp0)hit=true;}
  const st=A.state,on=!!A.vcl,bit=car.hp<ch0;park();T.keys.clear();S(40);car.alive=false;
  R.push({ok:held&&hit&&on&&bit,s:`held ${held}, goblin ${hit?'hit':'missed'}, car bitten ${bit}, still on ${on} (${st})`});}
 tally('car side: R1 bites the goblin and the car',R);
}
console.log('-- the other characters');
const biteUp=()=>DIRS.map(d=>{clear();tall(d);if(!grab(d,3))return {ok:false,s:'no grab '+desc(d)};const dd=A.climbD,small=T.DT.gob;
  const c=small?[A.pos.x-dd[0]*0.4,A.pos.y+0.7,A.pos.z-dd[1]*0.4]:[A.pos.x-dd[0]*0.5,A.pos.y+1.3,A.pos.z-dd[1]*0.5],up=small?1.0:2.4;
  let hp0=0,hit=false;for(let i=0;i<40;i++){putGob(c[0],c[1]+up-0.7,c[2]);if(i===0)hp0=gob.hp;if(i===2)press(BITE);else S(1);if(gob.hp<hp0)hit=true;}
  const st=A.state;park();T.keys.clear();S(30);return {ok:hit&&st==='climb',s:`${hit?'hit':'missed'}, ${st}`};});
T.setChar('gertie');tally('Gertie: R1 on the wall hits a goblin above',biteUp());
{const R=DIRS.map(d=>{clear();house(d,1);if(!grab(d,1))return {ok:false,s:'no grab'};press(STOMP);T.keys.delete(C);S(60);return {ok:A.state==='walk'&&inside(d,1),s:desc(d)};});tally('Gertie: stomp on the wall puts her inside',R);}
T.setChar('goblin');tally('Gnash: R1 on the wall clubs a goblin above',biteUp());
{const R=DIRS.map(d=>{clear();house(d,1);if(!grab(d,1))return {ok:false,s:'no grab'};press(STOMP);S(20);const st=A.state,whole=built.every(([x,y,z])=>T.solidAt(x,y,z));T.keys.clear();S(30);return {ok:st==='climb'&&whole,s:`${st}, wall whole ${whole}`};});
 tally("Gnash: stomp is his grenade, not a kick",R);}
T.setChar('gus');
console.log('fine',nAll-nBad,'of',nAll,'lines');process.exit(0);
