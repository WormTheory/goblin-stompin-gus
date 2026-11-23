// terr: territories (world/territories.js). For a seed (each in a process of its own): how long the tiles take, a hash of
// every cell's owner over a square of tiles (worked out twice, in two orders, and again after clearing), how many places
// each territory has (every one should have two or more where the land allows), their names (none a place's, none twice)
// and kinds of rule; that the world itself (chunks, places, their names) is the same whatever the territory settings;
// and that a world saved with territory settings, loaded again (as a guest gets the host's world), has the same territories.
// Usage: node terr.js [seeds, default 1,2,3]   (CFG='{"ter":2}' to look at other settings)
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs'),cp=require('child_process');
const WS=process.env.WSEED;
if(WS===undefined){
  const seeds=(process.argv[2]||'1,2,3').split(',').map(Number);
  for(const s of seeds)process.stdout.write(cp.execFileSync(process.execPath,[__filename],{env:Object.assign({},process.env,{WSEED:String(s)}),encoding:'utf8',maxBuffer:1<<26}));
  process.exit(0);
}
let src0=fs.readFileSync('g.js','utf8');
const NAMES=['genChunk','seed','CS','CELL','SET_SP','WORLD_CFG','WORLD_DEF','worldCfgSet','worldCfgSent','saveObj','save','load','seaV','SEA_T','settlementLat','settlementAt','setName','terSt','terTile','terCell','terAt','terOfSet','terInfo','terClear','terWarm','terPeekCell','TER_N','TER_SOV','clearWorld'];
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={};'+NAMES.map(n=>`try{if(typeof ${n}!=='undefined')window.__t.${n}=${n};}catch(e){}`).join('')+'\n})();');
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
class Q{setFromUnitVectors(){return this}constructor(){this.x=0;this.y=0;this.z=0;this.w=1}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}setFromAxisAngle(a,t){const s=Math.sin(t/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(t/2);return this}copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}}
class V3{transformDirection(){return this}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.lengthSq())}project(){return this}fromBufferAttribute(a,i){const A=a.array||a.a;this.x=A[i*3];this.y=A[i*3+1];this.z=A[i*3+2];return this}applyMatrix4(m){const e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z+e[12];this.y=e[1]*x+e[5]*y+e[9]*z+e[13];this.z=e[2]*x+e[6]*y+e[10]*z+e[14];return this}setFromMatrixPosition(o){this.x=o.position.x;this.y=o.position.y;this.z=o.position.z;return this}normalize(){const l=Math.hypot(this.x,this.y,this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}applyQuaternion(q){const x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this}constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}clone(){return new V3(this.x,this.y,this.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}setScalar(s){return this.set(s,s,s)}}
class Rot extends V3{constructor(){super();this.order='XYZ'}}
class Col{getHex(){return (Math.round(this.r*255)<<16)|(Math.round(this.g*255)<<8)|Math.round(this.b*255)}constructor(r,g,b){if(typeof r==='number'&&g===undefined)this.setHex(r);else{this.r=r||0;this.g=g||0;this.b=b||0;}}setHex(h){this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this}copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}clone(){return new Col(this.r,this.g,this.b)}lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this}multiplyScalar(k){this.r*=k;this.g*=k;this.b*=k;return this}getHexString(){return [this.r,this.g,this.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')}}
class Mat{dummy(){}dispose(){}constructor(o={}){Object.assign(this,o);this.color=new Col();this.emissive=new Col();this.opacity=o.opacity??1}}
class O3{rotateX(){return this}updateMatrixWorld(){}get matrixWorld(){return {position:this.position,elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}}lookAt(){}traverse(f){f(this);for(const c of this.children)c.traverse?c.traverse(f):f(c);}remove(){}constructor(g,m){this.matrix=new M4();this.layers={set(){},enable(){}};this.quaternion=new Q();this.userData={};this.position=new V3();this.rotation=new Rot();this.scale=new V3(1,1,1);this.children=[];this.visible=true;this.geometry=g||{dispose(){}};this.material=m}add(c){this.children.push(c);if(c&&typeof c==="object")c.parent=this;return this}remove(){}}
class M4{constructor(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}makeTranslation(){return this}compose(){return this}makeRotationAxis(){return this}makeScale(){return this}multiply(){return this}premultiply(){return this}multiplyMatrices(){return this}makeRotationY(){return this}setPosition(){return this}copy(){return this}}
const THREE={CylinderGeometry:class{translate(){return this}rotateX(){return this}dispose(){}},ShaderChunk:{common:'',project_vertex:'mvPosition = modelViewMatrix * mvPosition;'},Material:class{},ConeGeometry:class{dispose(){}translate(){return this}rotateX(){return this}},DataTexture:class{constructor(){this.needsUpdate=false}},RGBAFormat:1023,InstancedBufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n}},SphereGeometry:class{dispose(){}},ShaderMaterial:class{constructor(o){Object.assign(this,o)}},Matrix4:M4,InstancedMesh:class extends O3{get isMesh(){return true}constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false,array:new Float32Array(n*16)}}setMatrixAt(){}setColorAt(){if(!this.instanceColor)this.instanceColor={needsUpdate:false,array:new Float32Array(this.count*3)}}},Quaternion:Q,Vector4:class{constructor(x,y,z,w){this.set(x,y,z,w)}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}},Vector2:V3,Vector3:V3,Color:Col,Group:O3,Mesh:class extends O3{get isMesh(){return true}},Scene:class extends O3{},LineSegments:O3,
 MeshBasicMaterial:Mat,MeshLambertMaterial:Mat,LineBasicMaterial:Mat,
 BoxGeometry:class{constructor(w=1,h=1,d=1){this.p=[w,h,d]}computeBoundingBox(){const[w,h,d]=this.p;this.boundingBox={min:{x:-w/2,y:-h/2,z:-d/2},max:{x:w/2,y:h/2,z:d/2}}}setAttribute(){}dispose(){}translate(){return this}rotateX(){return this}},RingGeometry:class{dispose(){}},CircleGeometry:class{dispose(){}},EdgesGeometry:class{constructor(){this.attributes={position:{array:new Float32Array(72).map((_,i)=>(i%3===0?(i>>4&1):i%3===1?(i>>3&1):(i>>2&1))-0.5),count:24}}}dispose(){}},PlaneGeometry:class{setAttribute(){}dispose(){}},
 BufferGeometry:class{setDrawRange(){}constructor(){this.attributes={}}setAttribute(n,a){this.attributes[n]=a}setIndex(){}dispose(){}},BufferAttribute:class{constructor(a){this.array=a}setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}getX(i){return this.array[i*3]}getY(i){return this.array[i*3+1]}getZ(i){return this.array[i*3+2]}},Points:class extends O3{},Object3D:class extends O3{updateMatrix(){this.matrix={elements:[this.scale.x,0,0,0,0,this.scale.y,0,0,0,0,this.scale.z,0,this.position.x,this.position.y,this.position.z,1]}}},PointsMaterial:Mat,Float32BufferAttribute:class{constructor(a){this.a=a;this.array=a;this.count=a.length/3}},
 CanvasTexture:class{constructor(){this.offset=new V3();this.repeat=new V3()}},NearestFilter:1,RepeatWrapping:1,DoubleSide:2,
 Plane:class{constructor(n,c){this.normal=n;this.constant=c}},Fog:class{constructor(c,n,f){this.color=new Col();this.near=n;this.far=f}},
 PerspectiveCamera:class extends O3{updateProjectionMatrix(){}},
 WebGLRenderer:class{get capabilities(){return {getMaxAnisotropy:()=>8}}clearDepth(){}setClearColor(){}get domElement(){return {clientWidth:640,clientHeight:360,width:0,height:0}}getPixelRatio(){return 1}setPixelRatio(){}setSize(){}render(){}setScissorTest(){}setViewport(){}setScissor(){}},
 HemisphereLight:class extends O3{constructor(){super();this.color=new Col();this.groundColor=new Col();this.intensity=1}},DirectionalLight:class extends O3{constructor(){super();this.color=new Col();this.intensity=1}}};
const listeners={};
const el=()=>({remove(){},querySelectorAll:()=>[],closest:()=>null,matches:()=>false,contains:()=>false,attrs:{},kids:[],setAttribute(k,v){this.attrs[k]=v},style:{setProperty(k,v){this[k]=v}},hidden:false,textContent:'',innerHTML:'',classList:{contains(){return false},add(){},remove(){},toggle(){}},append(...k){this.kids.push(...k)},insertBefore(){},querySelector:()=>el(),focus(){},dataset:{},
 L:{},addEventListener(t,f){(this.L[t]=this.L[t]||[]).push(f)},getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),clearRect(){},fillRect(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},set fillStyle(v){}}),requestPointerLock(){}});
const els={};
global.window=global;global.THREE=THREE;global.devicePixelRatio=1;global.innerWidth=800;global.innerHeight=600;
global.document={querySelector:()=>el(),getElementById:id=>els[id]||(els[id]=Object.assign(el(),{appendChild(){},style:{}})),createElement:()=>Object.assign(el(),{style:{}}),querySelectorAll:()=>[],addEventListener(){},pointerLockElement:null};
global.addEventListener=(t,f)=>{(listeners['w'+t]=listeners['w'+t]||[]).push(f)};
global.matchMedia=()=>({matches:false});
// (a fresh world with this seed, as the World Generator hands one over)
const LS=new Map();{const SK=src0.match(/SAVE_KEY='([^']+)'/)[1],GEN=+src0.match(/WORLD_GEN=(\d+)/)[1];LS.set(SK,JSON.stringify(Object.assign({seed:+WS,gen:GEN,edits:{},coll:{},down:[],dest:{},test:[]},process.env.CFG?{cfg:JSON.parse(process.env.CFG)}:{})));}
global.localStorage={getItem:k=>LS.has(k)?LS.get(k):null,setItem(k,v){LS.set(k,String(v))},removeItem:k=>LS.delete(k),key:i=>[...LS.keys()][i]??null,get length(){return LS.size}};
global.requestAnimationFrame=()=>{};
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>[]},configurable:true});
eval(src);const T=window.__t;
const fnv=(h,b)=>Math.imul(h^b,16777619)>>>0;
const hashStr=(h,s)=>{for(let i=0;i<s.length;i++)h=fnv(h,s.charCodeAt(i));return h;};
const hx=h=>h.toString(16).padStart(8,'0');
console.log('== seed '+T.seed+(T.seed===+WS?'':' (WANTED '+WS+')')+' cfg '+JSON.stringify(T.worldCfgSent()||{}));
const R=+(process.env.R||3);   // (tiles each way round the start's)
// every cell's owner over the square, in the order given
function ownHash(order){let h=2166136261;const L={};
  for(const [tx,tz] of order){const t=T.terTile(tx,tz);L[tx+','+tz]=t;}
  for(let tx=-R;tx<=R;tx++)for(let tz=-R;tz<=R;tz++){const t=L[tx+','+tz];for(let q=0;q<t.lab.length;q++)h=hashStr(h,t.lab[q]===255?'-':t.ids[t.lab[q]]);}
  return hx(h);}
const sq=[];for(let tx=-R;tx<=R;tx++)for(let tz=-R;tz<=R;tz++)sq.push([tx,tz]);
let t0=Date.now();T.terTile(0,0);const tFirst=Date.now()-t0;
t0=Date.now();const h1=ownHash(sq);const tAll=Date.now()-t0;
const St=T.terSt();console.log(`tile ${St.TP.toFixed(1)} grid points (${Math.round(St.TT*T.CELL)} blocks) across, cells ${Math.round(St.cs*T.CELL)} blocks; first tile ${tFirst} ms, ${sq.length} tiles ${tAll} ms (${(tAll/sq.length).toFixed(0)} ms each)`);
const h2=ownHash(sq.slice().reverse());T.terClear();const h3=ownHash(sq.slice().reverse());T.terClear();
// (and worked out from the outside in, warming a little at a time as the game does)
for(const [tx,tz] of sq){const N=T.TER_N,cs=T.terSt().cs,px=(tx+0.5)*N*cs,pz=(tz+0.5)*N*cs;let g=0;while(T.terWarm(px,pz,2)===undefined&&g<5000)g++;}
const h4=ownHash(sq);
console.log(`owners ${h1}; again reversed ${h2}, after clearing ${h3}, warmed bit by bit ${h4}: ${h1===h2&&h2===h3&&h3===h4?'same':'DIFFERENT'}`);
// ---- the places in each territory (capitals in the inner square, places counted further out so all of each is in) ----
const by=new Map(),SP=T.SET_SP,TP=St.TP;let alive=0;
const G0=Math.floor(-(R+1)*TP),G1=Math.ceil((R+2)*TP);
for(let rx=G0;rx<=G1;rx++)for(let rz=G0;rz<=G1;rz++){const S=T.settlementLat(rx,rz);if(S.none||T.seaV(S.cx+0.5,S.cz+0.5)>T.SEA_T)continue;alive++;
  const id=T.terOfSet(S);if(!id)continue;if(!by.has(id))by.set(id,[]);by.get(id).push(S);}
const inner=[...by.keys()].filter(id=>{const [a,b]=id.split(',').map(Number);return Math.abs(a)<R&&Math.abs(b)<R;});
const counts=inner.map(id=>by.get(id).length).sort((a,b)=>a-b),one=inner.filter(id=>by.get(id).length<2);
console.log(`territories ${inner.length} (capitals within ${R-1} tiles): places each min ${counts[0]} median ${counts[counts.length>>1]} max ${counts[counts.length-1]}; with fewer than 2: ${one.length}${one.length?' ('+one.map(id=>{const I=T.terInfo(id);return I.title+' at '+I.cap.cx+','+I.cap.cz+(T.settlementLat(I.cap.rx+1,I.cap.rz).none?'':'')}).join('; ')+')':''}`);
{const own=new Set();for(const id of inner)for(const S of by.get(id))if(T.terOfSet(S)!==id)own.add(S);console.log('every place in its own territory:',own.size?own.size+' NOT':'yes');}
{const caps=inner.filter(id=>T.terOfSet(T.terInfo(id).cap)===id).length;console.log(`capitals in their own territory: ${caps}/${inner.length}`);}
// ---- names and kinds of rule ----
{const names=new Map(),sets=new Set(),kinds={};let clash=0,dup=0;
  // (a place's name: any place within two tiles of the territory's own)
  const near=id=>{const [a,b]=id.split(',').map(Number),o=new Set();for(let rx=Math.floor((a-2)*TP);rx<=Math.ceil((a+3)*TP);rx++)for(let rz=Math.floor((b-2)*TP);rz<=Math.ceil((b+3)*TP);rz++){const S=T.settlementLat(rx,rz);if(!S.none)o.add(T.setName(S));}return o;};
  for(const id of by.keys()){const I=T.terInfo(id);if(near(id).has(I.name))clash++;if(names.has(I.name)&&names.get(I.name)!==id)dup++;names.set(I.name,id);kinds[I.sov]=(kinds[I.sov]||0)+1;}
  console.log(`names: ${names.size}, the same as a place's nearby ${clash}, the same as another territory's ${dup}`);
  console.log('kinds:',Object.entries(kinds).sort((a,b)=>b[1]-a[1]).map(([k,n])=>k+' '+n).join(', '));
  console.log('e.g.',inner.slice(0,6).map(id=>{const I=T.terInfo(id);return `${I.title} (capital ${T.setName(I.cap)}, ${by.get(id).length} places)`;}).join('; '));}
// ---- the world doesn't change with the territories' settings: chunks, places and their names ----
function worldHash(){let h=2166136261;for(const [cx,cz] of [[0,0],[3,-2],[-20,9],[40,-33],[150,150]]){const a=T.genChunk(cx,cz);for(let i=0;i<a.length;i+=7)h=fnv(h,a[i]);}
  for(let rx=-6;rx<=6;rx++)for(let rz=-6;rz<=6;rz++){const S=T.settlementLat(rx,rz);h=hashStr(h,S.type+S.cx+','+S.cz+S.R+(S.none?'x':'')+T.setName(S));}return hx(h);}
{const cfg0=Object.assign({},T.worldCfgSent()||{}),w0=worldHash();
  T.worldCfgSet(Object.assign({},cfg0,{ter:2.2,tvar:0.3}));T.clearWorld();const w1=worldHash(),hb=ownHash(sq);
  T.worldCfgSet(cfg0);T.clearWorld();const w2=worldHash();
  console.log(`world with these settings ${w0}, with ter 2.2 tvar 0.3 ${w1}, back ${w2}: ${w0===w1&&w1===w2?'same':'DIFFERENT'}; territories then ${hb} (${hb===h1?'SAME AS BEFORE?':'different, as they should be'})`);}
// ---- saved with territory settings and loaded again (a guest builds the host's world from that save) ----
{const cfg={ter:1.7,tvar:0.4};T.worldCfgSet(cfg);const ha=ownHash(sq),sent=JSON.stringify(T.worldCfgSent());T.save&&T.save();
  const text=JSON.stringify(T.saveObj());T.worldCfgSet(null);const hd=ownHash(sq);
  // (the host's save text, as a guest gets it, into a fresh store, loaded)
  const SK=src0.match(/SAVE_KEY='([^']+)'/)[1];LS.set(SK,text);const ok=T.load();const hb=ownHash(sq);
  console.log(`saved cfg ${sent}; loaded ${ok?'ok':'FAILED'} cfg ${JSON.stringify(T.worldCfgSent())}: territories ${ha} -> ${hb} ${ha===hb?'same':'DIFFERENT'} (defaults meanwhile ${hd})`);
  LS.set(SK,JSON.stringify({seed:T.seed,edits:{}}));T.worldCfgSet(null);T.load();console.log('an old save with no cfg loads with the defaults:',T.WORLD_CFG.ter===1&&T.WORLD_CFG.tvar===1?'yes':'NO');}
