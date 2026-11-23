// The World Generator's worker: loads the game itself (../index.html, so it's always the game this page sits beside)
// with stand-ins for three.js and the page, so the game's own world-generation code works out the map for any seed.
// Nothing is drawn or played here; the page asks for pieces of the map and this answers.
'use strict';
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
// (the Play online panel's shut, made so in loadGame: open, the game's online code would join its lobby of open games
// from in here)
const els={};

self.window=self;self.THREE=THREE;self.devicePixelRatio=1;self.innerWidth=800;self.innerHeight=600;
self.document={querySelector:()=>el(),getElementById:id=>els[id]||(els[id]=Object.assign(el(),{appendChild(){},style:{}})),createElement:()=>Object.assign(el(),{style:{}}),querySelectorAll:()=>[],addEventListener(){},pointerLockElement:null,body:null,documentElement:null,hidden:false,visibilityState:'visible'};
self.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
self.requestAnimationFrame=()=>0;self.cancelAnimationFrame=()=>{};
self.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
try{Object.defineProperty(self,'navigator',{value:{getGamepads:()=>[],userAgent:'',language:'en',keyboard:null},configurable:true});}catch(e){}
self.AudioContext=undefined;self.webkitAudioContext=undefined;
let WSEED=1;
// (the game reads its world from its save on loading: hand it a fresh world with this seed)
self.localStorage={getItem:k=>String(k).startsWith('goblin-city-v')?JSON.stringify({seed:WSEED,edits:{},coll:{},down:[],dest:{},test:[]}):null,setItem(){},removeItem(){},key:()=>null,length:0};
const NAMES=['settlementLat','settlementAt','settlementRaw','setName','setKind','PLACE_KIND','zoneAt','seaPlot','seaV','SEA_T','coastType','plotType1','superOf','isRiver','riversNearBox','stMatch','cvSite','portCell','capitolPlan','climateAt','bioPick','BIOMES','reliefNat','plainsH','rlfValleys','realmOf','rlfSnow','rlfRock','RLF','CELL','SET_SP','BIGP','bigCell','MAPC','TEST_GROUPS','seed','ruggedAt','worldCfgSet','WORLD_CFG','setCache','setAtCache','nzNoise','CL_SP','bioNear','rivNode','rivWet','rivInflow','rivX','RIV_SP','terSt','terTile','terInfo','terAt','TER_N'];
let T=null,HTML=null,HTML_URL=null;
function loadGame(html,seed,sea){
  WSEED=seed;self.GSG_WORLD=sea||undefined;   // (the Land & sea sliders: the game's WORLD_CFG, read by its coast.js as it loads)
  const a=html.indexOf('three.min.js');if(a<0)throw new Error('no game script');
  const i=html.indexOf('<script>',a)+8,j=html.lastIndexOf('</script>');
  let src=html.slice(i,html.indexOf('</script>',i));
  const ex='window.__t={};'+NAMES.map(n=>`try{if(typeof ${n}!=='undefined')window.__t.${n}=${n};}catch(e){}`).join('')+'\n})();';
  const tail=/requestAnimationFrame\(frame\);\s*\}\)\(\);\s*$/;
  if(!tail.test(src))throw new Error('unexpected game script ending');
  src=src.replace(tail,ex);
  // (loaded again for a new seed or new settings: a fresh game, with nothing of the last one kept alive. So its stand-in
  // page starts empty, and what it'd leave running here, its timers and listeners, isn't started)
  for(const k in els)delete els[k];els.onlinePanel=Object.assign(el(),{hidden:true,appendChild(){},style:{}});
  sentRivers.clear();terIdxM.clear();terList.length=0;capKey=null;capitol=null;full=false;
  const realFetch=self.fetch,sI=self.setInterval,aE=self.addEventListener;self.fetch=()=>new Promise(()=>{});   // (the game checking for updates: not here)
  self.setInterval=()=>0;self.addEventListener=()=>{};
  try{(0,eval)(src);}finally{self.fetch=realFetch;self.setInterval=sI;self.addEventListener=aE;}
  T=self.__t;
  for(const n of ['settlementLat','settlementAt','seaV','SEA_T','plotType1','coastType','seaPlot'])if(T[n]===undefined)throw new Error('missing '+n);
}

// ---- the pieces of the map the page asks for ----
const ZC={city:10,large:11,suburb:12,small:13,village:14};
const ptIdx=new Map(),ptNames=[];
const ptOf=n=>{n=String(n);let v=ptIdx.get(n);if(v===undefined){v=ptNames.length;ptNames.push(n);ptIdx.set(n,v);}return v;};
const sentRivers=new Set();
// a settlement worth showing: some of it is actually on land (the sea or a river can take a whole small place)
function setAlive(S){
  if(T.settlementAt(S.cx,S.cz)===S)return true;
  const r=Math.max(1,Math.round(S.R*0.5));
  for(const [dx,dz] of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r],[r,-r],[-r,r]])if(T.settlementAt(S.cx+dx,S.cz+dz)===S)return true;
  return false;
}
function setInfo(S){return {k:S.rx+','+S.rz,name:T.setName(S),type:S.type,kind:T.PLACE_KIND?T.PLACE_KIND[T.setKind(S)]||S.type:S.type,x:S.cx+.5,z:S.cz+.5,R:S.R};}
let capKey=null,capitol=null,full=false;
// ---- the overview: the land first (from the sea's own noise: quick), then what stands on it. Land tiles come in levels:
// level 0 is 256 plots a side sampled every other plot, and each level up is twice as far across, sampled half as finely,
// so a whole continent's worth costs about the same as a town's when zoomed far out ----
function land(tx,tz,L){
  L=Math.max(0,L|0);const N=256<<L,st=2<<L,h=st>>1,M=N/st,x0=tx*N,z0=tz*N,a=new Uint8Array(M*M),t=T.SEA_T;
  for(let j=0;j<M;j++)for(let i=0;i<M;i++){const v=T.seaV(x0+i*st+h,z0+j*st+h);a[j*M+i]=v>t+0.05?0:v>t?1:2;}
  return {land:a,M};
}
// ---- the climate, tiled as the land is: each sample's temperature and moisture (0..255) from the game's climateAt, its
// biome (bioPick, an index into BIOMES, whose names and map colours come too) and whether it's land, so the sea can be
// left as it is ----
function clim(tx,tz,L){
  if(!T.climateAt)throw new Error('no climate in this build');
  const r=land(tx,tz,L),M=r.M,st=2<<Math.max(0,L|0),h=st>>1,N=M*st,x0=tx*N,z0=tz*N,t=new Uint8Array(M*M),m=new Uint8Array(M*M),b=new Uint8Array(M*M),C=T.CELL,bp=T.bioPick;
  // (and the land's height above the datum out in the wilds, reliefNat, with what it is there: 0 ground, 1 bare rock,
  // 2 snow, 3 a lake (not the hills' ponds). Towns and everything else built stay at the datum)
  const hg=T.reliefNat?new Int16Array(M*M):null,hk=hg?new Uint8Array(M*M):null;
  // (river valleys and source lakes only this close in: further out they'd want every river on the continent worked out)
  if(T.rlfValleys)T.rlfValleys(L<=2);
  for(let j=0;j<M;j++)for(let i=0;i<M;i++){const q=j*M+i,X=(x0+i*st+h)*C,Z=(z0+j*st+h)*C,c=T.climateAt(X,Z),ct=c.t;t[q]=Math.round(ct*255);m[q]=Math.round(c.m*255);if(bp)b[q]=bp(ct,c.m,X,Z);
    if(hg&&r.land[q]===2&&T.realmOf(x0+i*st+h,z0+j*st+h)==='plains'){const v=Math.round(T.reliefNat(X,Z));hg[q]=Math.max(0,v);hk[q]=v<-0.9&&T.RLF.lake>1?3:v>T.rlfSnow(ct)?2:v>T.rlfRock(ct)?1:0;}}
  if(T.rlfValleys)T.rlfValleys(true);
  return {land:r.land,M,st,t,m,b,hg,hk,bio:T.BIOMES?T.BIOMES.map(B=>[B.n,B.map,B.k]):null};
}
function coarse(tx,tz){
  const N=256,x0=tx*N,z0=tz*N;
  const sets=[],SP=T.SET_SP;
  for(let rx=Math.floor((x0-12)/SP)-1;rx<=Math.ceil((x0+N+12)/SP)+1;rx++)for(let rz=Math.floor((z0-12)/SP)-1;rz<=Math.ceil((z0+N+12)/SP)+1;rz++){
    const S=T.settlementLat(rx,rz);if(S.cx<x0||S.cx>=x0+N||S.cz<z0||S.cz>=z0+N)continue;if(!setAlive(S))continue;
    const o=setInfo(S);if(o.k===capKey)o.cap=true;sets.push(o);}
  const bases=[];
  if(T.BIGP&&T.bigCell){const i=T.BIGP.findIndex(K=>K.kind==='base');if(i>=0){const K=T.BIGP[i];
    for(let ax=Math.ceil(x0/K.w)*K.w;ax<x0+N;ax+=K.w)for(let az=Math.ceil(z0/K.h)*K.h;az<z0+N;az+=K.h)if(T.bigCell(i,ax,az))bases.push([ax,az,K.w,K.h]);}}
  const navy=[],cvs=[];
  if(T.portCell){for(let cx=x0/8;cx<(x0+N)/8;cx++)for(let cz=z0/8;cz<(z0+N)/8;cz++){
    if(T.portCell(cx*8,cz*8)!=='navy')continue;
    let n=0,sx=0,sz=0;for(let a=0;a<8;a++)for(let b=0;b<8;b++){const c=T.coastType(cx*8+a,cz*8+b);if(c==='navy'||c==='nbasin'){n++;sx+=cx*8+a+.5;sz+=cz*8+b+.5;}}
    if(n)navy.push([sx/n,sz/n]);
    const v=T.cvSite?T.cvSite(cx,cz):null;if(v)cvs.push([v.x/T.CELL,v.z/T.CELL,v.yaw]);}}
  const rivers=[];
  if(T.riversNearBox){const L=T.riversNearBox(x0*T.CELL,z0*T.CELL,(x0+N)*T.CELL,(z0+N)*T.CELL);
    for(let q=0;q<L.length;q+=2){const R=L[q];if(sentRivers.has(R))continue;sentRivers.add(R);
      // (the game only cuts a river into dry land: where its line runs into the sea, the sea's water is there instead,
      // so the line is broken there, every few blocks along it, rather than drawn across the water)
      let run=[];const cut=()=>{if(run.length>1)rivers.push({p:run,w:R.w||9});run=[];},wet=(x,z)=>T.seaV(x/T.CELL,z/T.CELL)>T.SEA_T;
      for(let i=0;i<R.pts.length;i++){const [x1,z1]=R.pts[i];
        if(i){const [x0,z0]=R.pts[i-1],n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)/6));
          for(let k=1;k<n;k++){const x=x0+(x1-x0)*k/n,z=z0+(z1-z0)*k/n;if(wet(x,z))cut();else run.push([x/T.CELL,z/T.CELL]);}}
        if(wet(x1,z1))cut();else run.push([x1/T.CELL,z1/T.CELL]);}
      cut();}}
  return {sets,bases,navy,cvs,rivers};
}
// ---- the detail: 32 plots a side, each plot as the game has it ----
function detail(tx,tz){
  const N=32,x0=tx*N,z0=tz*N,zone=new Uint8Array(N*N),pt=new Uint8Array(N*N),n0=ptNames.length;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const px=x0+i,pz=z0+j,k=j*N+i;
    const sp=T.seaPlot(px,pz),ct=T.coastType(px,pz);let c=sp===2?1:sp===1?(ct==='beach'?4:2):3;
    if(c!==1&&T.isRiver&&T.isRiver(px,pz))c=5;
    const S=T.settlementAt(px,pz);if(S)c=ZC[T.zoneAt(px,pz)]||13;
    if(ct==='navy'||ct==='nbasin')c=20;
    zone[k]=c;
    if(c!==1){let t;const B=T.superOf&&T.superOf(px,pz);t=B?B.kind:T.plotType1(px,pz);pt[k]=Math.min(255,ptOf(t));}}
  return {zone,pt,names:ptNames.slice(n0),n0};
}
// ---- one plot: what it is and what place it's in ----
function plot(px,pz){
  const S=T.settlementAt(px,pz),sp=T.seaPlot(px,pz);let t;const B=T.superOf&&T.superOf(px,pz);t=sp===2?'sea':B?B.kind:T.plotType1(px,pz);
  return {t:String(t),set:S?setInfo(S):null,zone:S?T.zoneAt(px,pz):null,cap:S&&(S.rx+','+S.rz)===capKey};
}
// ---- one point (in plots): how high the ground is there, in blocks above the sea (the sea's surface is the datum, G,
// which towns and everything built stay at), what it is (rock, snow, a lake) and the biome ----
function point(x,z){
  const C=T.CELL,X=x*C,Z=z*C,px=Math.floor(x),pz=Math.floor(z),o={};
  if(T.seaPlot(px,pz)===2)o.sea=true;
  else if(T.plainsH&&T.realmOf(px,pz)==='plains'){const h=T.plainsH(X,Z);o.h=h;if(T.RLF.cut)o.cut=true;if(T.RLF.tun)o.tun=true;
    if(T.climateAt&&h>0){const t=T.climateAt(X,Z).t;if(h>T.rlfSnow(t))o.snow=true;else if(h>T.rlfRock(t))o.rock=true;}}
  else o.h=0;
  if(T.climateAt&&T.bioPick&&T.BIOMES&&!o.sea){const c=T.climateAt(X,Z),B=T.BIOMES[T.bioPick(c.t,c.m,X,Z)];if(B)o.bio=B.n;}
  if(T.terAt&&!o.sea){const I=T.terInfo(T.terAt(px,pz));if(I)o.ter=I.title;}
  return o;
}
// ---- a square of heights for the 3D view: n x n samples st plots apart from (x0,z0) (in plots), in blocks above the
// sea's surface: the land's own height out in the wilds (reliefNat, with river valleys and lakes when it's close enough
// in to work them out), the datum in towns, and the sea bed sloping gently down from the shore by how far out the sea is (shallow, as it's scaled up
// with the land) ----
function grid(x0,z0,st,n){
  const C=T.CELL,h=new Float32Array(n*n),t=T.SEA_T;if(T.rlfValleys)T.rlfValleys(st*C<=48);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=x0+i*st,z=z0+j*st,v=T.seaV(x,z);let y=0;
    if(v>t)y=-Math.min(14,2+(v-t)*90);
    else if(T.reliefNat&&T.realmOf(Math.floor(x),Math.floor(z))==='plains')y=T.reliefNat(x*C,z*C);
    h[j*n+i]=y;}
  if(T.rlfValleys)T.rlfValleys(true);
  return {h,n};
}
// ---- the Noise view: the raw fields generation starts from, sampled straight from the game's functions on a grid of
// nx samples a row, st plots apart, from (x0,z0) (in plots), rows j0 to j0+nj. Nothing built is worked out: no roads,
// rivers' courses or chunks. NaN is the sea, where a field is only about the land ----
const NZ_TYPES=['city','large','small','village'];
function noise(f,x0,z0,st,nx,j0,nj){
  const C=T.CELL,ts=T.SEA_T,W=T.WORLD_CFG,o=new Float32Array(nx*nj),SP=T.SET_SP,tn0=terList.length,cs=st*C;
  // (the territories need each of their tiles worked out: too far out, there'd be thousands, so nothing till it's closer)
  if(f==='ter'&&(!T.terSt||nx*st/T.terSt().TT*(nj*st/T.terSt().TT)>1200)){o.fill(NaN);return {v:o,far:true};}
  if(f==='h'&&T.rlfValleys)T.rlfValleys(false);   // (valleys want every river's course: the land as it lies)
  for(let j=0;j<nj;j++){const z=z0+(j0+j+.5)*st;
    for(let i=0;i<nx;i++){const x=x0+(i+.5)*st,q=j*nx+i,v=T.seaV(x,z);
      if(f==='land'){o[q]=ts-v;continue;}   // (above 0 is land: the coastline is where the continent field crosses SEA_T)
      if(v>ts){o[q]=NaN;continue;}
      let X=x*C,Z=z*C,r;
      // (samples further apart than the climate's lattice share none of its corners: right on one, the game works out
      // that corner alone, a quarter of the work, and the sample moves no more than half a lattice step)
      if(f==='h'&&cs>=2*T.CL_SP){X=Math.round(X/T.CL_SP)*T.CL_SP;Z=Math.round(Z/T.CL_SP)*T.CL_SP;}
      if(f==='t'||f==='m'){const c=T.climateAt(X,Z);r=f==='t'?c.t:c.m;}
      else if(f==='bio'){const c=T.climateAt(X,Z);r=T.bioPick(c.t,c.m,X,Z);}
      else if(f==='rug')r=T.ruggedAt(X,Z);
      else if(f==='h')r=Math.max(0,T.reliefNat(X,Z));
      // (the territories: an index into the list sent with the answer, tn, so the page can name and colour them)
      else if(f==='ter')r=terIdx(T.terAt(Math.floor(x),Math.floor(z)));
      // (how likely a river is to rise here: a lattice node's odds of being a source, as rivBias and rivSrcM in
      // world/routes.js work them out, before what's built nearby rules one out)
      else if(f==='riv'){const g=T.ruggedAt(X,Z);let b=0.35+1.65*g;if(g<0.35)b+=0.8*T.climateAt(X,Z).m;r=Math.min(1,0.16*W.riv*b);}
      // (the places: the chance a grid point has one, as setNone in world/places.js works it out, and where the places
      // themselves stand, as negative numbers by type, while samples are close enough together to see them)
      // (and how many sizes smaller places come out here, as settlementLat steps them down: by how rugged it is and the
      // biome's town, dn. As dn*4 plus the chance, so the page can read both back)
      else if(f==='town'){let m=1;if(W.clu>0){const g=Math.max(0,Math.min(1,0.5+T.nzNoise(x/SP/3.2,z/SP/3.2,4481)*1.6));m=1-W.clu+W.clu*g;}
        const g=T.ruggedAt(X,Z),bt=T.bioNear?T.bioNear(X,Z).town:null,dn=Math.min(3,(g>0.9?3:g>0.78?2:g>0.62?1:0)+(bt?bt.dn:0));r=dn*4+W.towns*m;
        if(st<=12){const rx=Math.round(x/SP),rz=Math.round(z/SP);
          for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const S=T.settlementLat(rx+a,rz+b);if(S.none)continue;
            const dx=x-S.cx-.5,dz=z-S.cz-.5;if(dx*dx+dz*dz<=S.R*S.R){const k=-1-NZ_TYPES.indexOf(S.type);if(k<r)r=k;}}}}
      o[q]=r;}}
  if(f==='h'&&T.rlfValleys)T.rlfValleys(true);
  return {v:o,bio:f==='bio'&&T.BIOMES?T.BIOMES.map(B=>[B.n,B.map,B.k]):null,tn:f==='ter'?terList.slice(tn0):null,tn0};
}
// (where rivers and streams really rise, in a box (in plots): the drainage lattice's nodes with water leaving them and none
// coming in, at the point the river's drawn from (rivX), 2 a river and 1 a stream)
function rsrc(x0,z0,x1,z1){
  const C=T.CELL,SP=T.RIV_SP,out=[];
  for(let k=Math.floor(x0*C/SP)-1;k<=Math.ceil(x1*C/SP)+1;k++)for(let j=Math.floor(z0*C/SP)-1;j<=Math.ceil(z1*C/SP)+1;j++){
    const n=T.rivNode(k,j),w=T.rivWet(n);if(!w||T.rivInflow(n))continue;const X=T.rivX(n),x=X.x/C,z=X.z/C;
    if(x>=x0&&x<x1&&z>=z0&&z<z1)out.push(x,z,w);}
  return out;
}
// (the sliders, changed without loading the game again: the world's settings and everything worked out from them)
function cfg(o){T.worldCfgSet(o||{});terIdxM.clear();terList.length=0;if(T.setCache)T.setCache.clear();if(T.setAtCache)T.setAtCache.clear();sentRivers.clear();return true;}
// ---- the territories: a tile of them as the game works it out (world/territories.js), TER_N cells a side, each cell's
// territory as an index into ids, 255 none, and which cells are land; with each territory's name, kind, colour and
// capital ----
const terIdxM=new Map(),terList=[];
function terIdx(id){if(id==null)return NaN;let v=terIdxM.get(id);if(v===undefined){const I=T.terInfo(id);v=terList.length;terList.push(I?[I.title,I.hue]:['?',0]);terIdxM.set(id,v);}return v;}
function ter(tx,tz){
  if(!T.terTile)throw new Error('no territories in this build');
  const R=T.terTile(tx,tz),St=T.terSt(),info={};
  for(const id of R.ids){const I=T.terInfo(id);if(I)info[id]={title:I.title,name:I.name,sov:I.sov,hue:I.hue,cap:I.cap.rx+','+I.cap.rz,cx:I.cap.cx+.5,cz:I.cap.cz+.5,capName:T.setName(I.cap)};}
  return {tx,tz,N:T.TER_N,TT:St.TT,lab:R.lab,land:R.land,ids:R.ids,info};
}
// ---- a settlement in full: how big it is and what's in it ----
function place(k){
  const [rx,rz]=k.split(',').map(Number),S=T.settlementLat(rx,rz),r=Math.ceil(S.R*1.4)+3,counts={};let n=0;
  for(let px=S.cx-r;px<=S.cx+r;px++)for(let pz=S.cz-r;pz<=S.cz+r;pz++){if(T.settlementAt(px,pz)!==S)continue;n++;
    const B=T.superOf&&T.superOf(px,pz),t=String(B?B.kind+'@'+B.ax+','+B.az:T.plotType1(px,pz));counts[t]=(counts[t]||0)+1;}
  const kinds={};for(const t in counts){const kk=t.split('@')[0];kinds[kk]=(kinds[kk]||0)+(t.includes('@')?1:counts[t]);}
  return Object.assign(setInfo(S),{plots:n,kinds,cap:k===capKey});
}
// ---- settlements by name, nearest the view first ----
function search(q,cx,cz){
  q=q.toLowerCase();const SP=T.SET_SP,r0=Math.round(cx/SP),c0=Math.round(cz/SP),out=[];
  for(let d=0;d<=40&&out.length<40;d++)for(let rx=r0-d;rx<=r0+d;rx++)for(let rz=c0-d;rz<=c0+d;rz++){
    if(Math.max(Math.abs(rx-r0),Math.abs(rz-c0))!==d)continue;const S=T.settlementLat(rx,rz);
    if(!T.setName(S).toLowerCase().includes(q)||!setAlive(S))continue;const o=setInfo(S);if(o.k===capKey)o.cap=true;out.push(o);}
  return out.slice(0,40);
}
self.onmessage=async e=>{
  const m=e.data;
  try{
    if(m.op==='init'){
      // (the game's file kept, so a new seed or new settings load it again without fetching it)
      const t0=Date.now();if(HTML_URL!==m.url){const r=await fetch(m.url,{cache:'no-store'});if(!r.ok)throw new Error('game file '+r.status);HTML=await r.text();HTML_URL=m.url;}
      loadGame(HTML,m.seed,m.sea);
      if(T.seed!==m.seed)throw new Error('seed not taken');
      if(m.lite){postMessage({id:m.id,ok:{seed:T.seed,lite:true,mapc:{},labels:{},cap:null,ms:Date.now()-t0}});return;}   // (the Noise view: none of what's built)
      full=true;const C=T.capitolPlan?T.capitolPlan():null;capitol=C;const S=C?T.settlementAt(C.ax,C.az):T.settlementLat(0,0);capKey=S?S.rx+','+S.rz:null;
      const labels={};if(T.TEST_GROUPS)for(const [,L] of T.TEST_GROUPS)for(const [k,n] of L)labels[k]=n;
      postMessage({id:m.id,ok:{seed:T.seed,mapc:T.MAPC||{},labels,cap:capKey,capitol:C,ms:Date.now()-t0}});return;}
    let r;
    if(m.op==='land')r=land(m.tx,m.tz,m.L);
    else if(m.op==='clim')r=clim(m.tx,m.tz,m.L);
    else if(m.op==='coarse')r=coarse(m.tx,m.tz);
    else if(m.op==='detail')r=detail(m.tx,m.tz);
    else if(m.op==='plot')r=plot(m.px,m.pz);
    else if(m.op==='pt')r=point(m.x,m.z);
    else if(m.op==='place')r=place(m.k);
    else if(m.op==='grid')r=grid(m.x0,m.z0,m.st,m.n);
    else if(m.op==='noise')r=noise(m.f,m.x0,m.z0,m.st,m.nx,m.j0,m.nj);
    else if(m.op==='cfg')r=cfg(m.cfg);
    else if(m.op==='ter')r=ter(m.tx,m.tz);
    else if(m.op==='rsrc')r=rsrc(m.x0,m.z0,m.x1,m.z1);
    else if(m.op==='search')r=search(m.q,m.cx,m.cz);
    postMessage({id:m.id,ok:r});
  }catch(err){postMessage({id:m.id,err:String(err&&err.message||err)});}
};
