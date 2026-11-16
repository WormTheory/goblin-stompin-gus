let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={shockwave,get shocks(){return shocks},shipPt,nearestPlayer,addFire,get fires(){return fires},SHIPS,SHIP_X0,SHIP_KINDS,TRAIN_BOXES,trainHit,buildChunk,shipToWorld,worldToShip,shipOf,tenvVeh,tenvFoe,tenvClear,get TENV(){return TENV},get TS(){return TS},frame,players,goblins,get,solidAt,groundAt,chunks,meshes,venues,setGob,keys,DT,crush,doorsOn,propCells,get nEdits(){return Object.keys(edits).length},get edits(){return edits},set menuOpen(v){menuOpen=v},SAVE_KEY};\n})();');
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
 S=T.SHIPS.find(s=>s);console.log('spawn:',els.tpInfo.textContent,'|',t1-t0,'ms');
 if(!S){console.log('no ship');process.exit(0);}
 const sea=T.TENV.sea;console.log('sea',sea.x1-sea.x0,'x',sea.z1-sea.z0,'| ship at',f1(S.x),f1(S.z),'yaw',f1(S.yaw),'| from gus',f1(Math.hypot(S.x-P.pos.x,S.z-P.pos.z)));
 let fr=0,worst=0,last=-1,same=0;const t2=Date.now();while(fr<400&&same<20){const a=Date.now();run(1/60);worst=Math.max(worst,Date.now()-a);fr++;const k=pocketMeshes().length;same=k===last?same+1:0;last=k;}fr-=same;
 const M=pocketMeshes();console.log('pocket chunks drawn',M.length,'over',fr,'frames,',Date.now()-t2,'ms (slowest frame',worst,'ms) | hung off the ship',M.every(e=>e.m.every(m=>m.parent===S.grp)),'| meshes',M.reduce((n,e)=>n+e.m.length,0));}
// ---- what it's made of, deck by deck (blocks counted in its footprint)
{const K=S.K,names={18:'metal',12:'deck',40:'floor tile',81:'white wall',84:'dark paint',8:'glass',29:'bed',30:'sofa',28:'shelf',41:'fridge',31:'screen',32:'crate',64:'seat',24:'reactor glow',129:'rail',75:'checker',46:'hospital white'};
 const levels=[['hull below water',-6,-1],['lower deck',0,4],['hangar',5,10],['gallery deck',11,15],['flight deck',16,16],['island',17,48]];
 for(const [n,a,b] of levels){const c={};let air=0;const isl=a>16;for(let y=a;y<=b;y++)for(let u=isl?-18:K.u0;u<=(isl?-12:K.u1);u++)for(let w=isl?-22:K.w0;w<=(isl?-4:K.w1);w++){const v=T.get(S.ox+u,G0+y,S.oz+w);if(!v||v===9){if(v===0)air++;continue;}const k=names[v]||(v>=140&&v<152?'stairs':'#'+v);c[k]=(c[k]||0)+1;}
  console.log(n.padEnd(17),'air',String(air).padStart(6),'|',Object.entries(c).sort((x,y)=>y[1]-x[1]).slice(0,12).map(([k,v])=>k+' '+v).join(', '));}}
console.log('key blocks: landing',blk(0,0,-87),'stern door',blk(0,1,-86),'hangar',blk(0,7,0),'gallery',blk(0,13,0),'deck',blk(0,16,0),'island door',blk(12,17,-12),'helm console',blk(14,27,-5),'mast',blk(15,44,-12));
// ---- its furniture (props, drawn with the ship) and its doors
const cellOf=f=>'s '+f1(S.ox-f.x+.5)+' y '+f1(f.y0-G0)+' w '+f1(f.z-S.oz-.5);
{const L=S.props||[],by={};for(const f of L)by[f.type]=(by[f.type]||0)+1;
 console.log('props',L.length,'| boxes drawn',S.pm?S.pm[0].count+' + '+S.pm[1].count+' glowing':'none','| hung off the ship',!!S.pm&&S.pm.every(m=>m.parent===S.pg));
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
// ---- the helm, on the navigation bridge
let drove=false;
{at(14,27,-6,BOW);P.pos.x=S.ox-14;run(0.3);tap();drove=P.drv&&P.drv.k==='ship';console.log('F at the helm:',P.drv?P.drv.k:'on foot','| hud says',P.ui.drvHud&&P.ui.drvHud.txt.n);
 if(drove){const x0=S.x,z0=S.z,y0=S.yaw;hold(['KeyW'],15);
  console.log('  W 15 s: speed',f1(S.sp),'went',f1(Math.hypot(S.x-x0,S.z-z0)),'| still at the helm',where(P),'| camera from the ship',f1(Math.hypot(P.camera.position.x-S.x,P.camera.position.z-S.z)),'up',f1(P.camera.position.y-G0));
  hold(['KeyW','KeyD'],8);console.log('  W+D 8 s: yaw turned',f1(S.yaw-y0));
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
{at(0,17,0,BOW);run(0.3);const lo={x:S.ox+0.5,y:G0+1,z:S.oz-60.5};T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.find(q=>q.state==='chase');if(g){g.pos.set(lo.x,lo.y,lo.z);}
 S.hp=0;run(0.2);console.log('sinking:',S.dead,'| Gnash on the flight deck',where(P));let t=0,gOff=-1,pOff=-1;
 while(t<60&&T.SHIPS.some(s=>s)){run(0.5);t+=0.5;if(g&&gOff<0&&!aboard(g))gOff=t;if(pOff<0&&!aboard(P))pOff=t;}
 console.log('  goblin on the lower deck washed off after',gOff,'s | Gnash washed off after',pOff,'s, now',where(P),P.state,'| ship gone after',f1(t),'s:',!T.SHIPS.some(s=>s),'| pocket chunks drawn',pocketMeshes().length);}
console.log('errors',errs.length,errs.slice(0,3));
process.exit(0);
