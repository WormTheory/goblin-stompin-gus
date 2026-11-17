let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
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
// ---- spawning: the sea (twice the barge's), the carrier on it, its chunks drawn a few at a time
let S;{const t0=Date.now();T.menuOpen=true;T.TS.n=1;T.tenvVeh('carrier');T.menuOpen=false;const t1=Date.now();
 S=T.SHIPS.find(s=>s);if(S&&S.crewV)S.crewV.off=true;console.log('spawn:',els.tpInfo.textContent,'|',t1-t0,'ms');
 if(!S){console.log('no ship');process.exit(0);}
 const sea=T.TENV.sea;console.log('sea',sea.x1-sea.x0,'x',sea.z1-sea.z0,'| ship at',f1(S.x),f1(S.z),'yaw',f1(S.yaw),'| from gus',f1(Math.hypot(S.x-P.pos.x,S.z-P.pos.z)));
 let fr=0,worst=0,last=-1,same=0;const t2=Date.now();while(fr<400&&same<20){const a=Date.now();run(1/60);worst=Math.max(worst,Date.now()-a);fr++;const k=pocketMeshes().length;same=k===last?same+1:0;last=k;}fr-=same;
 const M=pocketMeshes();console.log('pocket chunks drawn',M.length,'over',fr,'frames,',Date.now()-t2,'ms (slowest frame',worst,'ms) | hung off the ship',M.every(e=>e.m.every(m=>m.parent===S.grp)),'| meshes',M.reduce((n,e)=>n+e.m.length,0));}
// ---- what it's made of, deck by deck (blocks counted in its footprint)
{const K=S.K,names={18:'metal',12:'deck',40:'floor tile',81:'white wall',84:'dark paint',8:'glass',29:'bed',30:'sofa',28:'shelf',41:'fridge',31:'screen',32:'crate',64:'seat',24:'reactor glow',129:'rail',75:'checker',13:'yellow line',68:'white line',46:'hospital white'};
 const levels=[['hull below water',-6,-1],['lower deck',0,4],['hangar',5,10],['gallery deck',11,15],['flight deck',16,16],['island',17,48]];
 for(const [n,a,b] of levels){const c={};let air=0;const isl=a>16;for(let y=a;y<=b;y++)for(let u=isl?-18:K.u0;u<=(isl?-12:K.u1);u++)for(let w=isl?-22:K.w0;w<=(isl?-4:K.w1);w++){const v=T.get(S.ox+u,G0+y,S.oz+w);if(!v||v===9){if(v===0)air++;continue;}const k=names[v]||(v>=140&&v<152?'stairs':'#'+v);c[k]=(c[k]||0)+1;}
  console.log(n.padEnd(17),'air',String(air).padStart(6),'|',Object.entries(c).sort((x,y)=>y[1]-x[1]).slice(0,12).map(([k,v])=>k+' '+v).join(', '));}}
console.log('key blocks: landing',blk(0,0,-87),'stern door',blk(0,1,-86),'hangar',blk(0,7,0),'gallery',blk(0,13,0),'deck',blk(0,16,0),'island door',blk(12,17,-12),'helm console',blk(14,27,-5),'mast',blk(15,44,-12));
// ---- its furniture (props, drawn with the ship) and its doors
const cellOf=f=>'s '+f1(S.ox-f.x+.5)+' y '+f1(f.y0-G0)+' w '+f1(f.z-S.oz-.5);
{const L=S.props||[],by={};for(const f of L)by[f.type]=(by[f.type]||0)+1;
 console.log('props',L.length,'| boxes drawn',S.pm?S.pm[0].count+' + '+S.pm[1].count+' glowing':'none','| hung off the ship',!!S.pm&&S.pm.every(m=>m.parent===S.grp));
 console.log(' ',Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(', '));
 const bad=L.filter(f=>f.cells.some(c=>T.solidAt(Math.floor(c[0]),Math.floor(f.y0),Math.floor(c[1])))||f.y0%1===0&&!T.solidAt(Math.floor(f.x),f.y0-1,Math.floor(f.z)));
 console.log('  in a wall or over nothing:',bad.length,bad.slice(0,6).map(f=>f.type+' '+cellOf(f)).join('; '));
 const ds=T.SHIP_KINDS.carrier.doors();console.log('doorways',ds.length,'| all of them door markers',ds.every(d=>{for(let a=d.a0;a<=d.a1;a++){const b=d.ax==='w'?blk(d.c,d.y-G0,a):blk(a,d.y-G0,d.c);if(b!==124)return false;}return true;}));}
// ---- aboard as Gnash: swim up to the stern, climb out, in at the stern door, and up every flight of stairs to the roof
{T.shipToWorld(S,S.ox+0.5,S.oz-95,W);put(W.x,G0-0.6,W.z,S.yaw);run(0.3);console.log('swimming 6 off the stern:',where(P));
 P.cam.yaw=BOW;P.cam.pitch=0.1;let t=0;T.keys.add('KeyW');T.keys.add('Space');while(t<8&&!(P.pos.y>=G0+0.9&&P.grounded&&aboard(P)))run(0.1),t+=0.1;T.keys.delete('KeyW');T.keys.delete('Space');run(0.3);
 console.log('  swum to the landing and climbed out:',where(P),'in',f1(t),'s');
 hold(['KeyW'],1.5);console.log('  walked in at the stern door:',where(P),'(the lobby is w -85 to -73, y 1)');}
console.log('stairs:');
climb(9,1,-86,3,'lower deck to hangar (aft)',6);
climb(-11,6,-86,3,'hangar to gallery deck (aft)',12);
climb(10,12,-82,3,'gallery deck to the flight deck (aft hatch)',17);
climb(-8,1,51,3,'lower deck to the forecastle (forward)',6);
climb(6,6,57,3,'forecastle to gallery deck (forward)',12);
climb(10,12,63,3,'gallery deck to the flight deck (forward hatch)',17);
{at(9,17,-12,Math.PI/2);run(0.3);hold(['KeyW'],2.5);console.log('  in at the island door from the deck:',where(P),S.ox-P.pos.x>12.5?'inside':'not in');}
climb(16,17,-20,3,'island: deck to flag bridge',22);
climb(16,22,-20,3,'island: flag bridge to navigation bridge',27);
climb(16,27,-20,3,'island: navigation bridge to Pri-Fly',32);
climb(16,32,-20,3,'island: Pri-Fly to the roof',37);
// ---- walking the length of each deck (W toward the bow from the stern end of each, straight down the middle)
console.log('walking forward down the middle:');
for(const [n,y,w0] of [['lower deck',1,-84],['hangar',6,-84],['gallery deck',12,-87],['flight deck',17,-88]]){at(0,y,w0,BOW);run(0.3);let t=0,z=P.pos.z,still=0;T.keys.add('KeyW');while(t<70&&still<3&&P.pos.z-S.oz<84){run(0.5);t+=0.5;still=P.pos.z-z<0.3?still+0.5:0;z=P.pos.z;}T.keys.delete('KeyW');console.log('  '+n.padEnd(13),'from w',w0,'got to w',f1(P.pos.z-S.oz),'| y',f1(P.pos.y-G0),still>=3?'(stopped)':P.pos.z-S.oz>=84?'(at the bow)':'');}
// ---- doors and props near Gnash on the lower deck: drawn, hung off the ship, opening as he comes up to one
{at(0,1,-52,Math.PI/2);run(1.5);const D=[...T.doorsOn.values()].filter(d=>d.R.S===S);
 console.log('in the corridor by the sick bay: ship doors drawn',D.length,'| hung off the ship',D.every(d=>d.v.g.parent===S.pg),'| open (the two beside him)',D.filter(d=>d.open>0.5).map(d=>d.R.key.split(':')[1]).join(' '),
  '| props goblins go round',[...T.propCells.values()].filter(f=>f.S===S).length);
 hold(['KeyW'],1.2);console.log('  walked in through the starboard door:',where(P),S.ox-P.pos.x>2.5?'in the sick bay':'not in');}
// ---- driving from the bridge: the engine telegraph, the rudder, the bridge view, running aground, ramming
const pr=k=>{T.keys.add(k);run(0.15);T.keys.delete(k);run(0.15);};   // (one press)
const hud=()=>P.ui.drvHud&&P.ui.drvHud.txt.w?P.ui.drvHud.txt.w.split('  ·  ').slice(0,3).join(' | '):'(none)';
const mid=(dz,yaw)=>{const R=T.TENV.sea;S.x=(R.x0+R.x1)/2;S.z=(R.z0+R.z1)/2+dz;S.yaw=yaw;S.yr=0;const o=S.ord,v=S.sp;S.ord=0;S.sp=0;run(2);S.ord=o;S.sp=v;};   // (back to the middle of the sea, with a moment for the water round it to load)
const helmW=()=>T.shipToWorld(S,S.ox-14,S.oz-5.5,{x:0,z:0});
let drove=false;
{at(14,27,-6,BOW);P.pos.x=S.ox-14;run(0.3);tap();drove=P.drv&&P.drv.k==='ship';console.log('F at the helm:',P.drv?P.drv.k:'on foot','| hud says',P.ui.drvHud&&P.ui.drvHud.txt.n,'|',hud());
 if(drove){
  mid(-140,0);pr('KeyW');pr('KeyW');console.log('  W pressed twice:',hud());
  {const x0=S.x,z0=S.z,v=[];for(let t=0;t<40;t+=5){run(5);v.push(f1(S.sp));}console.log('  speed every 5 s:',v.join(' '),'| went',f1(Math.hypot(S.x-x0,S.z-z0)),'| still at the helm',where(P));}
  hold(['KeyW'],2);console.log('  W held 2 s:',hud());
  {const v=[];for(let t=0;t<30;t+=5){run(5);v.push(f1(S.sp));}console.log('  speed every 5 s:',v.join(' '),'|',hud());}
  mid(0,0);{const y0=S.yaw;hold(['KeyD'],1);console.log('  D held 1 s:',hud().split(' | ')[2]);run(8);const y1=S.yaw;run(8);console.log('  turned',f1((S.yaw-y0)*180/Math.PI),'degrees in 16 s, the second 8 s',f1((S.yaw-y1)*180/Math.PI),'(keeps turning)');
   hold(['KeyC'],1.5);const y2=S.yaw;run(10);console.log('  C held:',hud().split(' | ')[2],'| turned',f1((S.yaw-y2)*180/Math.PI),'more in the 10 s after, turning now',f1(S.yr*180/Math.PI),'degrees a second');}
  mid(-140,0);S.ord=4;S.sp=8;{for(let k=0;k<4;k++)pr('KeyS');console.log('  S pressed four times:',hud().split(' | ')[0]);let t=0;const x0=S.x,z0=S.z;while(t<120&&S.sp>0.02){run(1);t++;}console.log('  stopped after',t,'s, in',f1(Math.hypot(S.x-x0,S.z-z0)));}
  {pr('KeyR');run(0.3);const h=helmW();console.log('  R, the bridge view: camera from the helm',f1(Math.hypot(P.camera.position.x-h.x,P.camera.position.z-h.z)),'up',f1(P.camera.position.y-G0),'|',P.ui.drvHud.txt.w.includes('chase view')?'offers the chase view':'');
   pr('KeyR');run(0.3);console.log('  R again: camera from the ship',f1(Math.hypot(P.camera.position.x-S.x,P.camera.position.z-S.z)),'up',f1(P.camera.position.y-G0));}
  // (aground: put 30 short of the sea's edge, heading for it at flank)
  {const R=T.TENV.sea;S.x=(R.x0+R.x1)/2;S.z=R.z1-S.K.w1-30;S.yaw=0;S.yr=0;S.rud=0;S.ord=0;S.sp=0;run(2);console.log('  put 30 short of the sea\'s edge, fits',T.shipFits(S,S.x,S.z,0));
   S.ord=4;S.sp=8;const h0=S.hp,z0=S.z;let t=0;while(t<10&&S.sp>0){run(0.1);t+=0.1;}
   console.log('  ran aground at flank after',f1(t),'s, going',f1(S.z-z0),'| health lost',f1(h0-S.hp),'| now',hud().split(' | ').slice(0,2).join(' | '),'| shake',f1(P.shake));
   pr('KeyS');const z1=S.z;run(20);console.log('  S, astern: backed off',f1(z1-S.z),'in 20 s |',hud().split(' | ')[0]);pr('KeyW');run(25);console.log('  W: back to',hud().split(' | ').slice(0,2).join(' | '));}
  // (ramming the barge, at two-thirds)
  {T.menuOpen=true;T.TS.n=1;T.tenvVeh('barge');T.menuOpen=false;const B=T.SHIPS.find(q=>q&&q!==S);const R=T.TENV.sea;
   S.x=(R.x0+R.x1)/2;S.z=(R.z0+R.z1)/2-60;S.yaw=0;S.yr=0;S.sp=0;S.ord=0;
   if(B){B.x=S.x;B.z=S.z+S.K.w1+30;B.yaw=0;B.sp=0;run(2);const hb=B.hp,hs=S.hp;S.ord=2;S.sp=4.4;let t=0;while(t<15&&B.hp>=hb){run(0.1);t+=0.1;}run(0.5);
    console.log('  rammed the barge at',f1(S.sp*4),'knots: the barge lost',f1(hb-B.hp),'of',B.K.hp,'| the carrier',f1(hs-S.hp),'| barge sinking',B.dead);
    B.hp=0;let u=0;while(u<30&&T.SHIPS.includes(B)){run(0.5);u+=0.5;}}else console.log('  no barge');}
  S.ord=0;S.sp=0;S.rud=0;S.yr=0;
  tap();console.log('  F again:',P.drv?P.drv.k:'on foot',where(P));}}
// ---- goblins aboard: spawned round Gnash in the hangar, chasing him there
{S.sp=0;at(0,6,-10,BOW);run(0.5);T.menuOpen=true;T.TS.n=4;T.tenvFoe('goblin');T.menuOpen=false;
 const gs=T.goblins.filter(g=>g.state==='chase');console.log('goblins spawned in the hangar:',gs.filter(aboard).length,'of',gs.length);
 let near=1e9;for(let i=0;i<40;i++){run(0.2);for(const g of gs)if(g.state==='chase'&&aboard(g))near=Math.min(near,Math.hypot(g.pos.x-P.pos.x,g.pos.z-P.pos.z));}
 console.log('  8 s on: closest',f1(near),'| still aboard',gs.filter(g=>g.state==='chase'&&aboard(g)).length);
 // (one put down on the lower deck while he waits up on the flight deck, by the aft hatch: does it find the stairs?)
 quietG();at(10,17,-74,BOW);run(0.3);T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.find(q=>q.state==='chase');
 if(g){g.pos.set(S.ox-0.5,G0+1,S.oz-80.5);g.vy=0;let t=0,up=-1;while(t<40){run(0.5);t+=0.5;if(up<0&&g.pos.y>G0+16)up=t;if(up>=0)break;}
  console.log('  a goblin from the lower deck after Gnash on the flight deck: made it up',up<0?'never (now '+where(g)+')':'in '+up+' s');}
 quietG();run(0.2);}
// ---- Gus too: a hippo up the stairs between decks and through the island
{T.setGob(false);run(0.5);console.log('Gus:');
 climb(9,1,-86,3,'lower deck to hangar',6);climb(-11,6,-86,3,'hangar to gallery deck',12);climb(10,12,-82,3,'gallery deck to flight deck',17);
 climb(16,17,-20,3,'island: deck to flag bridge',22);climb(16,22,-20,3,'island: up to the navigation bridge',27);
 T.setGob(true);run(0.5);}
// ---- its health: smashing the deck, a hole below the waterline, a shell from outside, and sinking
{const hp0=S.hp;at(0,17,30,BOW);run(0.3);T.crush(S.ox+0.5,G0+16,S.oz+30.5,2,-1,1);run(0.2);console.log('health',hp0,'| after a crater in the flight deck',f1(S.hp));
 const h1=S.hp;T.crush(S.ox+0.5,G0+0,S.oz-20.5,2,-1,1);run(0.2);console.log('  a crater through the lower deck floor into the hull:',f1(h1-S.hp),'off, holes letting the sea in',S.leak,'| water in the crater',blk(0,-1,-21)===9);
 const h2=S.hp;run(10);console.log('  10 s later it\'s lost',f1(h2-S.hp),'more to the sea coming in');
 const bx=T.TRAIN_BOXES.filter(B=>B.proxy.T===S);const h3=S.hp;T.trainHit(S,120,null,0);console.log('  boxes out in the world',bx.length,'| a 120 shell on the hull from outside:',f1(h3-S.hp),'off');}
// (a bunk with the floor blown out from under it goes with it)
{const f=S.props.find(q=>q.type==='bunk'&&!q.gone&&q.y0===G0+1);at(0,1,-30,BOW);run(0.3);T.crush(f.x-1,G0,f.z,2,-1,1);run(0.6);const n=S.pm[0].count;
 console.log('  a bunk at',cellOf(f),'with its floor smashed out: gone',f.gone,'| boxes drawn now',n);}
// ---- knocking props over: Gus walking into one (Gnash squeezes past), and a blast reaching from outside the hull
{T.setGob(false);run(0.3);const f=S.props.filter(q=>!q.gone&&!q.fall&&q.down==null&&q.y0===G0+1&&(q.type==='ltable'||q.type==='bench'))[0];
 if(!f)console.log('knocking props: none to try');else{const s0=f.x-2.5,z0=f.z;put(s0,f.y0+0.05,z0,Math.atan2(-(f.x-s0),-(f.z-z0)));run(0.3);const n0=S.propsFall||0;hold(['KeyW'],1.2);run(0.8);
  console.log('  (Gus ended at',cellOf({x:P.pos.x,y0:P.pos.y,z:P.pos.z}),')');console.log('Gus walked into a',f.type,'at',cellOf(f),': knocked over',f.down!=null,'| goblins still go round it',[...T.propCells.values()].some(q=>q===f));}
 T.setGob(true);run(0.3);}
{const K=S.K,w=0,y=9;let u=K.u1;while(u>K.u0&&!T.solidAt(S.ox+u,G0+y,S.oz+w))u--;T.shipToWorld(S,S.ox+u+1.2,S.oz+w+0.5,W);const e0=T.nEdits,b0=blk(-u,y,w),h0=S.hp;
 T.crushBall(W.x,G0+y+0.5,W.z,2.5);run(0.3);console.log('a blast just outside the hull (out in the world, by the hangar wall): blocks smashed',T.nEdits-e0,'| hull block there',b0,'->',blk(-u,y,w),'| health',f1(h0-S.hp),'off');}
// ---- vehicles aboard: spawned on the flight deck, driven about, a helicopter flown off and landed back, a shell off the side
{const near=(x,y,z,o)=>{for(let r=1;r<8;r+=0.5)for(let k=0;k<8;k++){const a=k*Math.PI/4;put(x+Math.cos(a)*r,y+0.3,z+Math.sin(a)*r);run(0.2);const d=T.drvFind(P);if(d&&(!o||d.o===o))return d;}return null;};   // (o: that one, not a parked jet beside it; tried all round it)
 const wh=o=>{const p=o.pos||o;return p.x>=T.SHIP_X0?'aboard (s '+f1(S.ox-p.x)+' w '+f1(p.z-S.oz)+' y '+f1(p.y-G0)+')':'in the world (y '+f1(p.y-G0)+')';};
 at(0,17,-20,BOW);run(0.5);T.TS.vm='park';
 for(const k of ['car','tank','heli','mech']){T.menuOpen=true;T.TS.n=1;T.tenvVeh(k);T.menuOpen=false;console.log('spawned from the flight deck:',els.tpInfo.textContent.split('.')[0]);}
 run(1);const c=T.cars.find(c=>c.alive),A=T.venues.get('tenvArmy'),Tk=A.mil.find(M=>M.kind==='tank'),Hc=A.mil.find(M=>M.kind==='heli'),Mg=(T.venues.get('tenvMechs')||{mechs:[]}).mechs[0];
 for(const [n,o] of [['car',c],['tank',Tk],['helicopter',Hc]])console.log(' ',n,wh(o),'| model hung off the ship',o.g.parent===S.pg);
 if(Mg){const d=T.shipToWorld(S,S.ox,S.oz,{x:0,z:0});console.log('  Mobile Gear (stays out in the world, on the ship\'s box): y',f1(Mg.y-G0),'|',f1(Math.hypot(Mg.x-S.x,Mg.z-S.z)),'from the ship\'s middle');}
 {const d=near(c.pos.x,c.pos.y,c.pos.z,c);T.drvEnter(P,d);const z0=c.pos.z;T.keys.add('KeyW');run(2);T.keys.delete('KeyW');run(1);console.log('  car driven along the deck',f1(Math.abs(c.pos.z-z0)),'blocks, still',wh(c),'| Gnash',wh(P));T.drvExit(P);run(0.5);}
 {let p0=[c.pos.x,c.pos.z];run(3);console.log('  the car left standing 3 s: moved',f1(Math.hypot(c.pos.x-p0[0],c.pos.z-p0[1])));p0=[c.pos.x,c.pos.z];const w0=[S.x,S.z];S.ord=3;run(6);console.log('  the carrier under way: moved',f1(Math.hypot(S.x-w0[0],S.z-w0[1])),'| the parked car on its deck moved',f1(Math.hypot(c.pos.x-p0[0],c.pos.z-p0[1])),'in the ship\'s frame');S.ord=0;S.sp=0;run(0.5);}
 {const d=near(Hc.x,Hc.y,Hc.z,Hc);T.drvEnter(P,d);T.keys.add('Space');run(3);T.keys.delete('Space');console.log('  helicopter lifted off:',wh(Hc));
  P.cam.yaw=-Math.PI/2;T.keys.add('KeyW');run(4);T.keys.delete('KeyW');run(2);console.log('  flown off the side:',wh(Hc),'| model back in the world',Hc.g.parent!==S.pg,'| Gnash',wh(P));
  P.cam.yaw=Math.PI/2;T.keys.add('KeyW');let tb=0;while(tb<8&&!(Hc.pos.x>=T.SHIP_X0&&S.ox-Hc.pos.x>-12))run(0.1),tb+=0.1;T.keys.delete('KeyW');run(2);console.log('  flown back over the deck (',f1(tb),'s):',wh(Hc),'| model hung off the ship',Hc.g.parent===S.pg);
  T.keys.add('KeyC');run(5);T.keys.delete('KeyC');run(1);console.log('  let down: landed',wh(Hc),'| hp',Hc.hp);T.drvExit(P);run(0.5);console.log('  Gnash out on the deck',wh(P));}
 {const d=near(Tk.x,Tk.y,Tk.z,Tk);T.drvEnter(P,d);P.cam.yaw=-Math.PI/2;P.cam.pitch=0.1;run(1.5);Tk.wpn.shell.cd=0;Tk.wpn.shell.rl=0;Tk.wpn.shell.n=4;const n0=new Set(T.SHOTS.filter(s=>s.live));
  T.mHeld.add('Mouse0');run(0.02);T.mHeld.delete('Mouse0');const sh=T.SHOTS.find(s=>s.live&&!n0.has(s));let out=-1,t=0,d0=sh?Math.hypot(sh.g.position.x-S.x,sh.g.position.z-S.z):0;
  while(sh&&sh.live&&t<2){run(1/60);t+=1/60;if(out<0&&sh.pos.x<T.SHIP_X0)out=t;}
  console.log('  tank shell fired over the side: started',sh?f1(d0)+' from the ship\'s middle, drawn there':'none','| out into the world after',f1(out),'s');T.drvExit(P);run(0.5);}
 // (the Mobile Gear stood on the deck, out in the world: climbed into from aboard, its rifle at the deck and at a goblin
 // on it, a round from out at sea at the hull, Infinite stamina)
 if(Mg){const q=T.worldToShip(S,Mg.x,Mg.z,{x:0,z:0});let d=null;for(let r=2;r<6&&!d;r+=0.5){put(q.x+r,Mg.y+S.sk+0.3,q.z);run(0.3);d=T.drvFind(P);}
  console.log('Mobile Gear on the deck: Gnash aboard beside it finds',d?d.k:'nothing');
  if(d&&d.k==='mech'){T.drvEnter(P,d);run(0.5);console.log('  in:',P.drv&&P.drv.k,'| Gnash',wh(P));
   const e0=T.nEdits,h0=S.hp,A0={x:Mg.x+3,y:Mg.y-3,z:Mg.z+3};for(let i=0;i<20;i++)T.gunRound(Mg,P,Mg.x,Mg.y+6,Mg.z,4,0.002,'test','test',A0);run(0.3);
   console.log('  20 rifle rounds at the deck at its feet: blocks broken',T.nEdits-e0,'| health',f1(h0-S.hp),'off');
   at(0,17,0,BOW);T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.find(q=>q.state==='chase');
   if(g){g.pos.set(q.x-6,G0+17,q.z+6);g.act=null;const gw=T.shipToWorld(S,g.pos.x,g.pos.z,{x:0,z:0}),hp=g.hp;T.gunRound(Mg,P,Mg.x,Mg.y+6,Mg.z,4,0.0001,'test','test',{x:gw.x,y:g.pos.y-S.sk+0.8,z:gw.z});
    console.log('  a rifle round at a goblin stood on the deck: its hp',hp,'->',g.hp,g.state);}
   quietG();
   // (the Heat Cleaver: one sweep at a goblin stood on the deck 8 off, then one at the island's side)
   {T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.find(q=>q.state==='chase');const sw=(wx,wz,pt)=>{const dx=wx-Mg.x,dz=wz-Mg.z,L=Math.hypot(dx,dz)||1;T.mgSlash(Mg,{fx:dx/L,fz:dz/L,e:0,hit:new Set(),pt:pt||0},0,1);};
    if(g){const q=T.worldToShip(S,Mg.x,Mg.z,{x:0,z:0});g.pos.set(q.x-6,G0+17,q.z+5);g.act=null;g.hp=Math.min(g.hp,15);const hp=g.hp,gw=T.shipToWorld(S,g.pos.x,g.pos.z,{x:0,z:0});sw(gw.x,gw.z);
     console.log('  Heat Cleaver at a goblin stood on the deck 8 off: its hp',hp,'->',g.hp,g.state);}
    const e0=T.nEdits,h0=S.hp,q=T.worldToShip(S,Mg.x,Mg.z,{x:0,z:0}),fw=T.shipToWorld(S,q.x,q.z+10,{x:0,z:0});sw(fw.x,fw.z,-0.8);console.log('  swung down at the deck ahead: blocks cut',T.nEdits-e0,'| the ship\'s health',f1(h0-S.hp),'off');quietG();}
   T.DT.infStam=true;Mg.en=10;run(0.2);T.mgDraw(Mg,50);T.mgDraw(Mg,50);console.log('  Infinite stamina: energy',Math.round(Mg.en),'of',T.MG.enMax,'after drawing 100 | redlined',Mg.red>0);T.DT.infStam=false;
   T.drvExit(P);run(1);console.log('  out again:',wh(P));}
  // (from out at sea: a round at the hull's side, from 30 off the port side)
  {const w=T.shipToWorld(S,S.ox-14,S.oz+0.5,{x:0,z:0}),f=T.shipToWorld(S,S.ox+30,S.oz+0.5,{x:0,z:0}),e0=T.nEdits;let n=0;
   for(let i=0;i<20;i++)T.gunRound(Mg,P,f.x,G0+3,f.z,4,0.002,'test','test',{x:w.x,y:G0+3,z:w.z});console.log('  20 rounds at the hull from 30 off the port side: blocks broken',T.nEdits-e0);}
 }
}
// ---- its crew and deck weapons: posts, general quarters, the mounts manned and firing, a player at them, standing down
for(const pl of S.jetV.pl)pl.rest=1e9;   // (its pilots kept below for now: the jets have their own checks after these)
{const V=S.crewV;V.off=false;quietG();const act=()=>T.goblins.filter(g=>g.state==='chase');console.log('crew posts',V.posts.length,'| deck weapons',S.mounts.length);
// posts standable?
for(const P0 of V.posts){const x=Math.floor(P0.x),z=Math.floor(P0.z),y=P0.y;const ok=!T.solidAt(x,y,z)&&!T.solidAt(x,y+1,z)&&T.solidAt(x,y-1,z);if(!ok)console.log('  a post with no room to stand:',P0.k,'s',f1(S.ox-P0.x+.5),'y',P0.y-G0,'w',f1(P0.z-S.oz-.5),T.get(x,y-1,z),T.get(x,y,z),T.get(x,y+1,z));}
for(const M of S.mounts){const x=Math.floor(M.x),z=Math.floor(M.z);let ok=T.solidAt(x,M.y-1,z);for(let dy=0;dy<3;dy++)for(const [a,b] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])if(T.solidAt(x+a,M.y+dy,z+b))ok=false;console.log('  mount',M.kind,'s',f1(S.ox-M.x+.5),'w',f1(M.z-S.oz-.5),ok?'ok':'BAD',T.get(x,M.y-1,z));}
// (calm first: hostility Peaceful, Gnash on the flight deck
T.DT.host=1;put(S.ox+0.5,G0+17,S.oz-20.5,Math.PI);run(2);console.log('  hostility Peaceful, Gnash on the flight deck: general quarters',V.roused,'crew out',act().length,act().map(g=>g.foeKind).join(','));
T.DT.host=2;run(1);
console.log('  hostility Normal: general quarters',V.roused,'| crew out',act().length,act().map(g=>g.foeKind).join(','));
run(3);console.log('  3 s on: chasing',act().length,'| mounts (C crewed, r a sailor running for it)',S.mounts.map(m=>m.crew?'C':m.call?'r':'-').join(''));
run(10);console.log('  13 s on: mounts',S.mounts.map(m=>m.crew?'C':m.call?'r':'-').join(''),'hp',P.hp);
// out in the sea 50 off the port side: the mounts open up
const live=k=>T.SHOTS.filter(q=>q.live&&q.kind===k).length;
{T.shipToWorld(S,S.ox+40,S.oz+0.5,W);T.DT.invuln=false;P.hp=P.hpMax=999;put(W.x,G0-0.6,W.z,0);let hits=0,miss=0,maxM=0;const h0=P.hp;
 for(let i=0;i<8*10;i++){run(0.1);maxM=Math.max(maxM,live('missile'));}
 console.log('  Gnash in the sea 40 off the port side, 8 s: hp lost',h0-P.hp,'| missiles in the air at most',maxM,'| player',P.state,'| mounts',S.mounts.map(m=>m.kind+':'+(m.wpn.gun?Math.round(m.wpn.gun.n):m.wpn.rkt.n)).join(' '));
 T.DT.invuln=true;}
// a rocket fired at the ship from out there: the Phalanx gets it?
{let down=0,hit=0;for(let k=0;k<6;k++){T.shipToWorld(S,S.ox+60,S.oz+70,W);const Q=T.shot({kind:'rocket',x:W.x,y:G0+18,z:W.z,vx:0,vy:0,vz:0,grav:0,fuse:6,R:3,dmg:3,cause:'test'});
  T.shipToWorld(S,S.ox-12,S.oz+72,{x:0,z:0});const tx=S.x,tz=S.z;const L=Math.hypot(tx-W.x,tz-W.z);Q.v.set((tx-W.x)/L*30,0,(tz-W.z)/L*30);
  let t=0;while(Q.live&&t<4){run(1/30);t+=1/30;}const d=Math.hypot(Q.pos.x-W.x,Q.pos.z-W.z);if(d<L-30)down++;else hit++;}
 console.log('  rockets fired at the bow from 60 off: shot down',down,'of 6 (well short of it)');}
// stand down: Gnash well away for 35 s
{T.shipToWorld(S,S.ox+150,S.oz,W);put(W.x,G0-0.6,W.z,0);run(36);console.log('  150 off for 36 s: general quarters',V.roused,'mounts crewed',S.mounts.filter(m=>m.crew).length);}
// Gnash at the Sea Sparrow: a tank out in the world, 60 off the starboard bow; lock on, launch
{const near=(x,y,z)=>{for(let r=1;r<4;r+=0.25){put(x+r,y+0.05,z);run(0.15);const d=T.drvFind(P);if(d&&d.k==='mount')return d;}return null;};
 T.shipToWorld(S,S.ox-14-40,S.oz+50,W);put(W.x,G0-0.6,W.z,0);run(0.2);T.menuOpen=true;T.TS.n=1;T.TS.vm='park';P.cam.yaw=0;T.tenvVeh('tank');T.menuOpen=false;run(0.5);
 const A=T.venues.get('tenvArmy'),Tk=A.mil[A.mil.length-1];console.log('Gnash at the Sea Sparrow: a tank out in the world',Tk.pos.x<T.SHIP_X0?'world':'aboard',f1(Math.hypot(Tk.x-S.x,Tk.z-S.z)),'from the ship');
 const Mt=S.mounts.find(m=>m.kind==='sparrow'&&m.z>S.oz);const d=near(Mt.x,Mt.y,Mt.z);console.log('  at the launcher, F finds it:',d?'found':'none',d&&d.o===Mt);
 T.drvEnter(P,d);run(0.3);console.log('  in:',P.drv&&P.drv.k,'| its sailor thrown off',!Mt.crew);
 // (look at the tank: its bearing from the mount, in the ship's frame)
 T.worldToShip(S,Tk.x,Tk.z,W);const yaw=Math.atan2(W.x-Mt.x,W.z-Mt.z);P.cam.yaw=yaw+Math.PI;P.cam.pitch=-0.15;run(0.5);
 T.keys.add('KeyQ');run(0.05);T.keys.delete('KeyQ');run(0.2);console.log('  Q: locked on the tank',P.lockT===Tk);
 const h0=Tk.hp;T.mHeld.add('Mouse0');run(0.05);T.mHeld.delete('Mouse0');run(0.1);console.log('  bite: missiles up',live('missile'),'| magazine',Mt.wpn.rkt.n);
 run(4);console.log('  4 s on: the tank\'s hp',h0,'->',f1(Tk.hp),Tk.dead?'(destroyed)':'');
 // the Phalanx: a rocket coming in, Gnash holding the trigger at it
 T.drvExit(P);run(0.3);const C=S.mounts.find(m=>m.kind==='ciws'&&m.z>S.oz);const d2=near(C.x,C.y,C.z);T.drvEnter(P,d2);run(0.3);
 T.shipToWorld(S,S.ox-12-50,S.oz+72,W);const Q=T.shot({kind:'rocket',x:W.x,y:G0+19,z:W.z,vx:0,vy:0,vz:0,grav:0,fuse:6,R:3,dmg:3,cause:'test'});const mz=T.shipToWorld(S,C.x,C.z,{x:0,z:0});const L=Math.hypot(mz.x-W.x,mz.z-W.z);Q.v.set((mz.x-W.x)/L*25,0,(mz.z-W.z)/L*25);
 const yaw2=Math.atan2(-1,0);T.worldToShip(S,W.x,W.z,W);P.cam.yaw=Math.atan2(W.x-C.x,W.z-C.z)+Math.PI;P.cam.pitch=0.02;T.keys.add('KeyQ');run(0.05);T.keys.delete('KeyQ');
 T.mHeld.add('Mouse0');let t=0;while(Q.live&&t<3){run(1/30);t+=1/30;}T.mHeld.delete('Mouse0');console.log('Gnash at the Phalanx, holding fire on a rocket coming at it: gone after',f1(t),'s',f1(Math.hypot(Q.pos.x-mz.x,Q.pos.z-mz.z)),'off it | heat',Math.round(C.wpn.gun.n));
 T.drvExit(P);run(0.3);}
V.off=true;quietG();}
// ---- jets on the deck: parked, climbed into, the catapult, the wires, flown off and back over
// ---- a deck weapon as a target: picked out by the lock-on from out at sea, a missile at it, wrecked; nobody can man it
{T.drvExit(P);run(0.2);const Mt=S.mounts.find(m=>m.kind==='ram'),w0=T.shipToWorld(S,S.ox-60,S.oz+62,{x:0,z:0});put(w0.x,G0-0.6,w0.z,0);run(0.3);
 const L=T.lockTargets(P,150);console.log('deck weapons: Gnash 70 off the side, the lock-on picks out',L.filter(o=>o.t.isMountT).length,'of',S.mounts.length,'| the RAM among them',L.some(o=>o.t===Mt.lk));
 const hp0=Mt.hp;let n=0;while(!Mt.dead&&n<4){const w=Mt.lk.pos;T.shot({kind:'missile',x:w.x-25,y:w.y+10,z:w.z,vx:30,vy:0,vz:0,grav:0,fuse:8,R:3,dmg:3,crush:1,vd:120,cause:'test',tgt:Mt.lk,sp:50,turn:4});run(1.5);n++;}
 console.log('  missiles at the RAM:',n,'| its health',hp0,'->',Math.round(Mt.hp),'| wrecked',Mt.dead,'| still in the lock-on',T.lockTargets(P,150).some(o=>o.t===Mt.lk));
 at(-11,17,62,BOW);run(0.3);const d=T.drvFind(P);console.log('  Gnash beside the wreck: F finds',d?(d.k+(d.o===Mt?' (the wreck!)':'')):'nothing');}
// ---- Invulnerability covers what you're driving: the Mobile Gear on the deck takes nothing while it's on
{const Mg=(T.venues.get('tenvMechs')||{mechs:[]}).mechs[0];if(Mg){const q=T.worldToShip(S,Mg.x,Mg.z,{x:0,z:0});let d=null;for(let r=2;r<6&&!d;r+=0.5){put(q.x+r,Mg.y+S.sk+0.3,q.z);run(0.3);d=T.drvFind(P);}
  if(d&&d.k==='mech'){T.drvEnter(P,d);run(0.2);const h0=Mg.hp;T.DT.invuln=true;T.mechHit(Mg,20);const h1=Mg.hp;T.DT.invuln=false;T.mechHit(Mg,20);
   console.log('Invulnerability in the Mobile Gear: hp',Math.round(h0),'-> hit with it on',Math.round(h1),'-> hit with it off',Math.round(Mg.hp));T.drvExit(P);run(0.5);}else console.log('Invulnerability: Mobile Gear not found');}}
for(const pl of S.jetV.pl)pl.rest=0;
{const V=S.jetV,J=V?V.pl:[];const sw=o=>{const p=o.g.position;return p.x>=T.SHIP_X0?'aboard (s '+f1(S.ox-p.x)+' w '+f1(p.z-S.oz)+' y '+f1(p.y-G0)+')':'in the world (y '+f1(p.y-G0)+')';};
 console.log('jets parked',J.length,'| all on the deck',J.every(pl=>Math.abs(pl.g.position.y-(G0+17))<0.01),'| hung off the ship',J.every(pl=>pl.g.parent===S.pg));
 // (each parked one standing on deck, not over the side, not in another's way)
 for(const pl of J){const p=pl.g.position,s=S.ox-p.x-0.5,w=p.z-S.oz-0.5;let bad=0;for(const [a,b] of [[0,5.8],[0,-5.8],[3.4,0],[-3.4,0]]){const h=pl.g.rotation.y,x=p.x+Math.cos(h)*a+Math.sin(h)*b,z=p.z-Math.sin(h)*a+Math.cos(h)*b;if(!T.solidAt(x,G0+16,z))bad++;}
   if(bad)console.log('  jet at s',f1(s),'w',f1(w),': corners over nothing',bad);}
 const pl=J[3];const p0=pl.g.position;
 // (Gnash beside it on the deck, F)
 let d=null;for(let r=3;r<8&&!d;r+=0.5){put(p0.x+r,G0+17.05,p0.z-2);run(0.3);d=T.drvFind(P);}
 console.log('beside jet 4: F finds',d&&d.k,d&&d.o===pl);if(!d||d.o!==pl){process.exit(0);}
 T.drvEnter(P,d);run(0.5);console.log('  in:',P.drv&&P.drv.k,'| Gnash',aboard(P)?'aboard':'in the world');
 // (put on the bow's port catapult, a few blocks back from its start, and the throttle opened)
 pl.g.position.set(S.ox+5+0.5,G0+17,S.oz+36+0.5);pl.g.rotation.set(0,0,0);pl.free.v=0;pl.free.thr=0;run(0.3);
 console.log('  stopped on the bow catapult: hooked on',!!pl.cat,pl.cat&&pl.cat.ph);let t=0;T.keys.add('Space');while(t<3&&pl.cat&&pl.cat.ph==='wait')run(0.05),t+=0.05;console.log('  Space held (throttle up): held for launch after',f1(t),'s |',pl.cat?pl.cat.ph:'not hooked','| throttle',f1(pl.free.thr),'| speed',f1(pl.free.v));
 t=0;let t1=-1,v1=0;while(t<5){run(1/30);t+=1/30;if(t1<0&&!pl.cat){t1=t;v1=pl.free.v;}}T.keys.delete('Space');
 console.log('  let go of it after',f1(t1),'s at',f1(v1),'| 5 s on:',sw(pl),'speed',f1(pl.free.v),'flying',pl.free.air,'| model hung off',pl.g.parent===S.pg?'the ship':'the scene','| Gnash',aboard(P)?'aboard':'in the world');
 // (round again, and back in over the stern, low, along the angled strip, hook down: placed there in the pocket)
 run(2);T.drvExit(P);run(0.2);
 // (fresh: jet 5, set flying down the angled deck's line toward the wires)
 const q=J[4];{let d2=null;for(let r=3;r<8&&!d2;r+=0.5){put(q.g.position.x+r,G0+17.05,q.g.position.z-2);run(0.3);d2=T.drvFind(P);}T.drvEnter(P,d2);run(0.3);}
 const h=Math.atan(0.16),w0=-88,s0=-3-(w0+89)*0.16;q.g.position.set(S.ox-s0+0.5,G0+19.5,S.oz+w0+0.5);q.g.rotation.set(0,h,0);Object.assign(q.free,{v:40,thr:0,gm:-0.06,pt:0.05,rl:0,vy:-2.4,air:true});
 T.keys.add('KeyR');run(0.05);T.keys.delete('KeyR');T.keys.add('KeyW');console.log('  jet 5 coming in over the stern on the angled strip at 40, R: hook',q.hook?'down':'up');
 const z0=q.g.position.z;t=0;let trapped=null;while(t<6&&!(q.free&&q.free.v<0.5&&!q.free.air)&&!q.dead){run(1/30);t+=1/30;if(process.env.DBG&&Math.round(t*30)%3===0)console.log('    t',f1(t),sw(q),'v',f1(q.free.v),'vy',f1(q.free.vy),'air',q.free.air,'pt',q.free.pt.toFixed(2),'trap',!!q.trap);if(!q.free.air)T.keys.delete('KeyW');if(q.trap&&!trapped)trapped={n:q.trap.n,t};}T.keys.delete('KeyW');
 console.log('  after',f1(t),'s:',q.dead?'WRECKED':sw(q),'| caught wire',trapped?trapped.n:'none','| rolled',f1(q.g.position.z-z0),'blocks along w | hook now',q.hook?'down':'up');
 // (no hook: the same approach rolls on and brakes)
 Object.assign(q.free,{v:40,thr:0,gm:-0.06,pt:0.05,rl:0,vy:-2.4,air:true});q.g.position.set(S.ox-s0+0.5,G0+19.5,S.oz+w0+0.5);q.g.rotation.set(0,h,0);
 if(q.hook)T.keys.add('KeyR'),run(0.05),T.keys.delete('KeyR');t=0;T.keys.add('KeyW');while(t<8&&!(q.free.v<0.5&&!q.free.air)&&!q.dead){run(1/30);t+=1/30;if(!q.free.air)T.keys.delete('KeyW');}T.keys.delete('KeyW');
 console.log('  hook up, the same approach: after',f1(t),'s',q.dead?'WRECKED':sw(q),'| speed',f1(q.free.v));
 T.drvExit(P);run(0.3);
}

// ---- pilots at general quarters: launched, flying at Gnash out at sea, coming back and landing on the wires
{const V=S.jetV,C=S.crewV;C.off=false;for(const M of S.mounts)M.crew=null;
 // (Gnash swimming 150 off the port side, invulnerable; the mounts left unmanned so it's the jets that go for him)
 const w=T.shipToWorld(S,S.ox+150,S.oz,{x:0,z:0});put(w.x,G0+1,w.z);run(0.5);T.shipGQ(C);
 const ph=()=>V.pl.map(pl=>pl.dead?'X':pl.ai?(pl.ai.ph==='final'?'FN':pl.ai.ph.slice(0,2))+(pl.trap?'*':' '):pl.call?'r ':'- ').join(' ');
 let launched=new Set(),trapped=new Set(),landed=new Set(),sh=0;const s0=T.SHOTS.length;
 for(let t=0;t<90;t+=0.5){run(0.5);for(const M of S.mounts)M.crew=null;
   V.pl.forEach((pl,i)=>{if(pl.ai&&pl.ai.ph==='fight')launched.add(i);if(pl.trap)trapped.add(i);if(pl.ai&&pl.ai.ph==='park')landed.add(i);});
   if(Math.round(t*2)%20===0)console.log('  t',t.toFixed(0),'jets',ph(),'| flying',V.pl.filter(pl=>pl.ai&&pl.free&&pl.free.air).map(pl=>{const p=pl.g.position;return (p.x>=T.SHIP_X0?'a':'w')+Math.round(p.y-G0)+'/'+Math.round(pl.free.v);}).join(' '));}
 console.log('pilots at GQ: launched',launched.size,'| caught a wire',trapped.size,'| towed home after landing',landed.size,'| wrecked',V.pl.filter(pl=>pl.dead).length);
 C.off=true;quietG();}
{at(0,17,0,BOW);run(0.3);const lo={x:S.ox+0.5,y:G0+1,z:S.oz-60.5};T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.find(q=>q.state==='chase');if(g){g.pos.set(lo.x,lo.y,lo.z);}
 S.hp=0;run(0.2);console.log('sinking:',S.dead,'| Gnash on the flight deck',where(P));let t=0,gOff=-1,pOff=-1;
 while(t<60&&T.SHIPS.some(s=>s)){run(0.5);t+=0.5;if(g&&gOff<0&&!aboard(g))gOff=t;if(pOff<0&&!aboard(P))pOff=t;}
 console.log('  goblin on the lower deck washed off after',gOff,'s | Gnash washed off after',pOff,'s, now',where(P),P.state,'| ship gone after',f1(t),'s:',!T.SHIPS.some(s=>s),'| pocket chunks drawn',pocketMeshes().length);}
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
