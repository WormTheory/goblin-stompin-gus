// worlddet: the world is the same every time it's worked out from a seed. For a few fixed seeds (each in a process of its
// own, so the game loads afresh with that seed) it prints a hash of each of a spread of chunks as genChunk makes them,
// made twice; then checks the landscape noise (world/noise.js, world/climate.js) gives identical values on repeated calls,
// stays in its range, and uses arithmetic only (no Math.sin, cos, tanh, exp, pow or random, which may differ between
// browsers in the last bit). The chunk hashes must only change when world generation is meant to (with SAVE_KEY bumped).
// Usage: node worlddet.js [seeds, default 1,2,3]
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs'),cp=require('child_process');
const WS=process.env.WSEED;
if(WS===undefined){
  const seeds=(process.argv[2]||'1,2,3').split(',').map(Number);
  for(const s of seeds)process.stdout.write(cp.execFileSync(process.execPath,[__filename],{env:Object.assign({},process.env,{WSEED:String(s)}),encoding:'utf8'}));
  process.exit(0);
}
let src0=fs.readFileSync('g.js','utf8');
const NAMES=['genChunk','seed','CS','H','CELL','nzNoise','nzFbm','nzRidged','nzWarp','nzSmooth','nzClamp01','climateAt','biomeAt','realmOf','WORLD_CFG','worldCfgSent','saveObj','seaV','settlementAt','BIOMES','biomeOfPlot','bioPick','climAt','PLAINS_OPEN','plainsTree','TREE_K','reliefNat','ruggedAt','plainsH','reliefMask','rlfDist','rlfLines16','railDist','rlfTop','RLF','rlfSnow','rlfRock','landTop'];
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={};'+NAMES.map(n=>`try{if(typeof ${n}!=='undefined')window.__t.${n}=${n};}catch(e){}`).join('')+'\n})();');
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
// (a fresh world with this seed, as the World Generator hands one over)
global.localStorage={getItem:k=>String(k).startsWith('goblin-city-v')?JSON.stringify({seed:+WS,edits:{},coll:{},down:[],dest:{},test:[]}):null,setItem(){},removeItem(){}};
global.requestAnimationFrame=()=>{};
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>[]},configurable:true});
eval(src);const T=window.__t;
const fnv=(h,b)=>Math.imul(h^b,16777619)>>>0;
const hashArr=a=>{let h=2166136261;for(let i=0;i<a.length;i++)h=fnv(h,a[i]);return h.toString(16).padStart(8,'0');};
const F64=new Float64Array(1),U8=new Uint8Array(F64.buffer);
const hashNums=L=>{let h=2166136261;for(const v of L){F64[0]=v;for(let i=0;i<8;i++)h=fnv(h,U8[i]);}return h.toString(16).padStart(8,'0');};
console.log('== seed '+T.seed+(T.seed===+WS?'':' (WANTED '+WS+')'));
// chunks: the start, a spread round it, and some far out (towns, plains, the sea, whatever falls there)
const CH=[[0,0],[1,0],[0,-1],[3,-2],[-5,7],[12,12],[-20,9],[40,-33],[-77,61],[150,150],[-300,-220],[700,-512]];
let same=0;
for(const [cx,cz] of CH){const a=T.genChunk(cx,cz),b=T.genChunk(cx,cz),h=hashArr(a),ok=hashArr(b)===h;if(ok)same++;
  // (and a hash of each column's top block's height, so a change shows whether it's the ground or what stands on it)
  const tops=[];for(let lz=0;lz<T.CS;lz++)for(let lx=0;lx<T.CS;lx++){let y=T.H-1;while(y>0&&!a[lx+lz*T.CS+y*T.CS*T.CS])y--;tops.push(y);}
  console.log(`chunk ${cx},${cz}: blocks ${h} tops ${hashNums(tops)} realm ${T.realmOf(Math.floor(cx*T.CS/T.CELL),Math.floor(cz*T.CS/T.CELL))}${ok?'':' DIFFERENT THE SECOND TIME'}`);}
console.log(`chunks made the same twice: ${same}/${CH.length}`);
// the noise: a spread of points, worked out twice
const P=[];let r=12345;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647;};
for(let i=0;i<3000;i++)P.push([(rnd()-0.5)*2e6,(rnd()-0.5)*2e6]);
const fns={
  nzNoise:([x,z])=>T.nzNoise(x/37.3,z/37.3,7),
  nzFbm:([x,z])=>T.nzFbm(x,z,500,5,11),
  nzRidged:([x,z])=>T.nzRidged(x,z,800,4,13),
  nzWarpX:([x,z])=>T.nzWarp(x,z,600,200,17)[0]-x,
  climT:([x,z])=>T.climateAt(x,z).t,
  climM:([x,z])=>T.climateAt(x,z).m,
  rugged:([x,z])=>T.ruggedAt(x,z),
  relief:([x,z])=>T.reliefNat(x,z)};
for(const k in fns){const A=P.map(fns[k]),B=P.map(fns[k]);let mn=1e9,mx=-1e9,s=0,diff=0,bad=0;
  for(let i=0;i<A.length;i++){if(!Object.is(A[i],B[i]))diff++;if(!isFinite(A[i]))bad++;mn=Math.min(mn,A[i]);mx=Math.max(mx,A[i]);s+=A[i];}
  console.log(`${k}: range ${mn.toFixed(3)}..${mx.toFixed(3)} mean ${(s/A.length).toFixed(3)} hash ${hashNums(A)} repeat diff ${diff} not finite ${bad}`);}
{let a=0,b=0;for(let i=0;i<2000;i++){const x=i*0.37,z=i*-0.53,v=T.nzNoise(x,z,3);if(Math.abs(v)>1.0001)a++;if(T.nzNoise(Math.floor(x),Math.floor(z),3)!==0)b++;}
  console.log(`nzNoise out of -1..1: ${a}, not 0 on lattice points: ${b}`);}
{const t=[0,0.5,1].map(v=>T.nzSmooth(0,1,v)).join(','),c=[-1,0.3,2].map(T.nzClamp01).join(',');console.log(`nzSmooth 0,.5,1 -> ${t}; nzClamp01 -1,.3,2 -> ${c}`);}
// arithmetic only
const srcOf=['nzNoise','nzFbm','nzRidged','nzWarp','nzSmooth','climateAt','climAt','bioPick','biomeAt'].map(n=>String(T[n])).join('\n')+String(src0.match(/function nzGrad[^\n]*/)||'');
const banned=srcOf.match(/Math\.(sin|cos|tan|tanh|exp|log|pow|random|sqrt|atan2?|hypot|cbrt)\b/g);
console.log('noise uses only arithmetic: '+(banned?'NO ('+[...new Set(banned)].join(' ')+')':'yes'));
// (the relief and its mask: arithmetic and square roots, which every browser rounds the same)
{const rs=['ruggedAt','reliefNat','rlfTop','reliefMask','rlfDist','rlfLines16','railDist','plainsH','landTop'].map(n=>String(T[n])).join('\n'),b=rs.match(/Math\.(sin|cos|tan|tanh|exp|log|pow|random|atan2?|hypot|cbrt)\b/g);
  console.log('relief uses only arithmetic and sqrt: '+(b?'NO ('+[...new Set(b)].join(' ')+')':'yes'));}
// the stubs and settings
console.log(`biomeAt(0,0) ${T.biomeAt(0,0)}; biomeOf gone: ${!/\bbiomeOf\b/.test(src0)}; WORLD_CFG ${JSON.stringify(T.WORLD_CFG)}; cfg in a default save: ${JSON.stringify(T.saveObj().cfg)}`);
// the biomes: their shares of the land over a square 60,000 blocks a side (a plot sampled every 500 blocks), the start's
// (always grassland within START_R0), and a chunk of open plains in each one found: its hash, what lies on top, its trees
{const N=120,cnt=new Array(T.BIOMES.length).fill(0),first={};let land=0,startBad=0;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i-N/2)*500,z=(j-N/2)*500,px=Math.floor(x/T.CELL),pz=Math.floor(z/T.CELL);
    if(T.realmOf(px,pz)==='sea')continue;land++;const b=T.biomeOfPlot(px,pz);cnt[b]++;
    if(first[b]===undefined&&T.realmOf(px,pz)==='plains'&&T.PLAINS_OPEN(px,pz))first[b]=[px,pz];}
  for(let k=0;k<400;k++){const x=((k%20)-10)*280,z=(Math.floor(k/20)-10)*280;if(T.biomeAt(x,z)!==0)startBad++;}
  console.log('biome shares of the land: '+T.BIOMES.map((B,i)=>B.k+' '+(100*cnt[i]/land).toFixed(1)+'%').join(', '));
  console.log('start not grassland: '+startBad+'/400');
  // (the land's height, world/relief.js: how high the open plains stand, in bands, the highest, and round the start)
  {const band={},bk=h=>h<-0.9?'lake':h<2?'0-1':h<10?'2-9':h<30?'10-29':h<60?'30-59':h<100?'60-99':'100+';let n=0,mx=-1,snow=0,st=0;
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i-N/2)*500,z=(j-N/2)*500,px=Math.floor(x/T.CELL),pz=Math.floor(z/T.CELL);
      if(T.realmOf(px,pz)!=='plains'||!T.PLAINS_OPEN(px,pz))continue;n++;const h=T.reliefNat(x,z);band[bk(h)]=(band[bk(h)]||0)+1;if(h>mx)mx=h;}
    for(let k=0;k<400;k++){const x=((k%20)-10)*140,z=(Math.floor(k/20)-10)*140;st=Math.max(st,T.reliefNat(x,z)-T.RLF.hill);}
    console.log('open plains by height (natural): '+Object.keys(band).sort().map(k=>k+' '+(100*band[k]/n).toFixed(1)+'%').join(', ')+'; highest '+mx.toFixed(1));
    console.log('mountains within 1400 of the start: '+st.toFixed(2));}
  for(const b in first){const [px,pz]=first[b],cx=Math.floor(px*T.CELL/T.CS),cz=Math.floor(pz*T.CELL/T.CS),a=T.genChunk(cx,cz),top={};let tr=0;
    for(let lz=0;lz<T.CS;lz++)for(let lx=0;lx<T.CS;lx++){let y=T.H-1;while(y>0&&!a[lx+lz*T.CS+y*T.CS*T.CS])y--;const v=a[lx+lz*T.CS+y*T.CS*T.CS];top[v]=(top[v]||0)+1;}
    for(let z=cz*T.CS;z<cz*T.CS+T.CS;z++)for(let x=cx*T.CS;x<cx*T.CS+T.CS;x++){const t=T.plainsTree(x,z);if(t)tr++;}
    console.log(`  ${T.BIOMES[b].k} at chunk ${cx},${cz}: blocks ${hashArr(a)} tops by block ${JSON.stringify(top)} trees ${tr}`);}}
