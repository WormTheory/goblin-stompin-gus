let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={activeProps,activeFix,propCells,propCK,streetFurn,refreshFixtures,knockFixtures,knockFix,downFix,falling,goblins,FIX_BAR,cars,biomeOf,get score(){return score},players,keys,frame,get,solidAt,DT,DBG_ITEMS,dbgItems,dbgMenuNav,dbgMenuToggle,dbgVal,GFX_OFF,toggleGfx,gfxArr,chunkArr,meshes,buildChunk,sewerStair,caveMouth,metroOf,settlementLat,settlementAt,setRaw,CS,CELL,G,SEW0,SUB_F,AIR,BRICK,WATER,li,PROP_L,PROP_G};\n})();');
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
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;S(5);
// The debug Rendering switches: caves, sewers and subways stop being drawn, with the world itself left alone. Each kind:
// the open space and tunnel blocks in the chunks round one real example, with the switch on and off.
const {CS,CELL,G,SEW0,SUB_F,AIR,BRICK,GFX_OFF}=T;
const chunksOf=(px,pz)=>{const a=[];for(let x=px*CELL-CS;x<(px+1)*CELL+CS;x+=CS)for(let z=pz*CELL-CS;z<(pz+1)*CELL+CS;z+=CS)a.push([Math.floor(x/CS),Math.floor(z/CS)]);return a;};
// (open cells from y0 to y1, and how many of the real world's blocks changed anywhere in those chunks)
const open=(arrs,y0,y1)=>{let n=0;for(const a of arrs)for(let y=y0;y<=y1;y++)for(let i=0;i<CS*CS;i++)if(a[y*CS*CS+i]===AIR)n++;return n;};
const real=L=>L.map(([x,z])=>T.chunkArr(x,z));
const drawn=L=>L.map(([x,z])=>T.gfxArr(x,z));
function report(name,key,g,px,pz,y0,y1){
  const L=chunksOf(px,pz),r=real(L).map(a=>a.slice());
  const before=open(drawn(L),y0,y1);GFX_OFF[g]=true;const v=drawn(L),after=open(v,y0,y1);
  let diff=0;v.forEach((a,i)=>{for(let j=0;j<a.length;j++)if(a[j]!==r[i][j])diff++;});
  let same=0;real(L).forEach((a,i)=>{for(let j=0;j<a.length;j++)if(a[j]!==r[i][j])same++;});
  GFX_OFF[g]=false;
  console.log(name,'at plot',px,pz,': open cells drawn on',before,'off',after,'| cells drawn differently',diff,'| real blocks changed',same);
}
const R=60;let st=null,mo=null,me=null;
for(let d=0;d<R&&!(st&&mo);d++)for(let a=-d;a<=d;a++)for(let b=-d;b<=d;b++){if(Math.max(Math.abs(a),Math.abs(b))!==d)continue;
  if(!st&&T.sewerStair(a,b))st=[a,b];if(!mo&&T.caveMouth(a,b))mo=[a,b];}
for(let a=-6;a<=6&&!me;a++)for(let b=-6;b<=6&&!me;b++){const M=T.metroOf(T.settlementLat(a,b));if(M&&M.stations.length)me=M.stations[0];}
if(st)report('sewers ','gSewers','sewers',st[0],st[1],SEW0,G);else console.log('no sewer stair found');
if(mo)report('caves  ','gCaves','caves',mo[0],mo[1],G-21,G);else console.log('no cave mouth found');
if(me)report('subways','gSubway','subway',me.px,me.pz,SUB_F,G);else console.log('no subway station found');
// a crater stays a crater: smash a hole in the street over a sewer and it's still drawn as a hole
if(st){const x=st[0]*CELL+3,z=st[1]*CELL+20,cx=Math.floor(x/CS),cz=Math.floor(z/CS),li=(y)=>T.li(((x%CS)+CS)%CS,y,((z%CS)+CS)%CS);
  T.setRaw(x,G,z,AIR);T.setRaw(x,G-1,z,AIR);GFX_OFF.sewers=true;const a=T.gfxArr(cx,cz);
  console.log('crater with sewers off: street',a[li(G)],'brick below',a[li(G-1)],'(both 0 is a hole), sewer space below that is solid',a[li(SEW0+3)]!==AIR);GFX_OFF.sewers=false;}
// the switches themselves, and a chunk redrawn with each off
for(const it of T.DBG_ITEMS.filter(it=>it.sec==='Rendering')){const was=T.dbgVal(it.k);T.DT.cur=T.dbgItems().indexOf(it);T.dbgMenuToggle();console.log(it.label,'switch:',was,'->',T.dbgVal(it.k));S(60);T.dbgMenuToggle();}
S(60);
console.log('props meshes visible after switching back',T.PROP_L.visible,T.PROP_G.visible);
// the menu: every row reachable, up/down within a column, left/right across on a plain row, adjusting on a slider
{const L=T.dbgItems(),byC=[0,1,2,3].map(c=>L.filter(o=>o.c===c).map(o=>o.k));console.log('columns',JSON.stringify(byC));
 const nav=(dy,dx)=>{T.DT.navDir='';T.dbgMenuNav('kbd',dy,dx,0);T.DT.navDir='';return T.dbgItems()[T.DT.cur];};
 const seen=new Set();T.DT.cur=0;const s0=T.DT.speedI,c0=T.DT.curve,p0=T.DT.psI;for(let i=0;i<400;i++){const it=nav(i%5===4?0:1,i%5===4?1:0);seen.add(it.k);}T.DT.speedI=s0;T.DT.curve=c0;T.DT.psI=p0;
 console.log('rows reached by walking the menu',seen.size,'of',L.length);
 T.DT.cur=L.findIndex(o=>o.k==='paused');console.log('right from Stop time goes to',nav(0,1).k,', then left back to',nav(0,-1).k);
 T.DT.cur=L.findIndex(o=>o.k==='speed');const s1=T.DT.speedI;console.log('left on Game speed, not picked: goes to',nav(0,-1).k,'and speed index stays',s1,'->',T.DT.speedI);
 T.DT.cur=L.findIndex(o=>o.k==='speed');T.dbgMenuToggle();console.log('picked with A:',T.DT.edit,'; then left: stays on',nav(0,-1).k,'speed index',s1,'->',T.DT.speedI,'; A again lets go:',(T.dbgMenuToggle(),T.DT.edit),'; picked again, then down lets go:',(T.dbgMenuToggle(),nav(1,0).k),T.DT.edit);T.DT.speedI=s1;}
// the Enemy hostility slider: picked with A, then left and right step it, Normal, Peaceful, Passive, and no further
{const L=T.dbgItems(),nav=(dy,dx)=>{T.DT.navDir='';T.dbgMenuNav('kbd',dy,dx,0);T.DT.navDir='';};
 T.DT.cur=L.findIndex(o=>o.k==='host');const h0=T.DT.host,seen=[T.dbgVal('host')];nav(0,-1);const unpicked=T.dbgItems()[T.DT.cur].k;
 T.DT.cur=L.findIndex(o=>o.k==='host');T.dbgMenuToggle();for(let i=0;i<3;i++){nav(0,-1);seen.push(T.dbgVal('host'));}nav(0,1);seen.push(T.dbgVal('host'));T.dbgMenuToggle();
 console.log('hostility: left, not picked, goes to',unpicked,'; picked, left x3 then right:',seen.join(' > '),'; stored',T.DT.host);T.DT.host=h0;}
// benches and litter bins are props now: drawn and listed as props, and goblins go round them, out to the lamp posts' distance
{T.refreshFixtures();const str=T.activeProps.filter(f=>f.type==='parkbench'||f.type==='litterbin'),old=T.activeFix.filter(f=>f.type==='bench'||f.type==='bin');
 const far=str.reduce((m,f)=>Math.max(m,Math.max(Math.abs(f.x-A.pos.x),Math.abs(f.z-A.pos.z))),0);
 console.log('street props',str.filter(f=>f.type==='parkbench').length,'benches',str.filter(f=>f.type==='litterbin').length,'bins, furthest',far.toFixed(0),'blocks; still old fixtures',old.length,'; also listed for traffic',str.filter(f=>T.activeFix.includes(f)).length);
 const b=str.find(f=>f.type==='parkbench');if(b){console.log('bench: all three of its cells block goblins',[-1,0,1].every(e=>T.propCells.get(T.propCK(b.x+Math.cos(b.yaw)*.9*e,b.y0,b.z-Math.sin(b.yaw)*.9*e))===b));
   const s0=T.score,n=T.knockFixtures(b.x,b.z,1.1,1,0);console.log('a car hitting it: knocked',n,'score +',T.score-s0);S(60);T.refreshFixtures();console.log('down after falling',T.downFix.has(b.key),' still blocks goblins',T.propCells.get(T.propCK(b.x,b.y0,b.z))===b);}
 // how long street furniture lasts with nobody touching it: goblins held up by it shove it over
 S(60*60);T.refreshFixtures();const all=T.activeProps.filter(f=>f.type==='parkbench'||f.type==='litterbin');
 console.log('after a minute of goblins walking about:',all.filter(f=>T.downFix.has(f.key)).length,'of',all.length,'street props down; goblins',T.goblins.length);}
// the Interface switches: one at a time, and the whole display
{const css=()=>els.uiOff.textContent,rows=T.DBG_ITEMS.filter(it=>it.sec==='Interface');
 const tog=k=>{T.DT.cur=T.dbgItems().findIndex(o=>o.k===k);T.dbgMenuToggle();};
 let ok=0;for(const it of rows.slice(1)){const on0=T.dbgVal(it.k);tog(it.k);const hid=css().includes('{display:none');tog(it.k);if(on0&&hid&&T.dbgVal(it.k)&&!css())ok++;}
 console.log('interface rows',rows.length,'each hides and comes back',ok,'of',rows.length-1);
 tog('uiAll');console.log('whole display off:',css().split('}').length-1,'rules, row says',T.dbgVal('uiAll'));tog('uiMini');console.log('one back on: row says',T.dbgVal('uiAll'),'rules',css().split('}').length-1);tog('uiAll');console.log('all off again, rules',css().split('}').length-1);tog('uiAll');console.log('all on again, css empty',css()==='');}
process.exit(0);
