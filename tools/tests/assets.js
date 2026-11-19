let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={PROPS,FIXM,assetProp,assetFix,liveProp,liveFix,liveMove,liveRecord,AB,HB,DEV_ABIL,assetMovesAll,get trafficRefreshT(){return trafficRefreshT},players,cars,goblins,frame,setGob,WEAPONS,GOB_WPN,STRIKES,ASSETS,assetCheck,assetFmt,assetWeapon,assetWeaponOf,assetClip,assetClipOf,wpnHitShapes,hitWorld,hitTouch,liveWeapon,liveClip,PICKUPS,hitGoblins,assetList,assetPlace,ASSET_LISTS,wpnHitSweep,hitHand,gobSwingU};\n})();');
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
// The editor's asset files (src/assets/, tools/editor/): every file passes the check the editor and build use and
// keeps its exact layout through a load and save; what the game built from them matches the files; weapon hitboxes
// against goblin hurtboxes (player/hit-shapes.js); the live preview's entries (ui/editor-live.js).
const path=require('path'),AS=path.join(__dirname,'..','..','src','assets');
for(const kind of ['weapons','clips','bodies','grips','props','fixtures','moves']){
  const names=JSON.parse(fs.readFileSync(path.join(AS,kind,'_order.json'),'utf8')).order;let bad=[],moved=[];
  for(const n of names){const text=fs.readFileSync(path.join(AS,kind,n+'.json'),'utf8').replace(/\r\n/g,'\n'),a=JSON.parse(text);
    const E=T.assetCheck(kind,n,a);if(E.length)bad.push(n+': '+E.join('; '));if(T.assetFmt(a)!==text)moved.push(n);}
  console.log(kind,names.length,'files | problems',bad.length?bad.join(' | '):'none','| layout changed by a save',moved.length?moved.join(','):'none');}
// (the game's tables, from the build, against the files: a weapon's entry back as a file, a clip's keys)
{let wd=[],cd=[];
  for(const k in T.ASSETS.weapons){const f=JSON.parse(fs.readFileSync(path.join(AS,'weapons',k+'.json'),'utf8'));delete f.note;
    const back=T.assetWeaponOf(T.assetWeapon(f));if(JSON.stringify(back)!==JSON.stringify(T.assetWeaponOf(T.assetWeapon(T.ASSETS.weapons[k]))))wd.push(k);
    if(JSON.stringify(T.WEAPONS[k].model.held)!==JSON.stringify(T.assetWeapon(f).model.held))wd.push(k+'(held)');}
  for(const k in T.ASSETS.clips)if(JSON.stringify(T.STRIKES[k])!==JSON.stringify(T.assetClip(T.ASSETS.clips[k])))cd.push(k);
  console.log('game tables from the files: weapons',wd.length?'differ '+wd.join(','):'same','| clips',cd.length?'differ '+cd.join(','):'same');}
// (shared models: each view that shares the weapon's one model is it placed, and placing then taking the placing off
// gives the model back; a view with its own version is just that)
{let sh=0,own=0,bad=[];
  for(const k in T.ASSETS.weapons){const M=T.ASSETS.weapons[k].model;if(!M)continue;
    for(const j of T.ASSET_LISTS){const v=M[j];if(!v)continue;
      if(Array.isArray(v)||v.own){own++;continue;}sh++;
      const L=T.assetList(M,j);if(L.length!==M.boxes.length){bad.push(k+'.'+j+' count');continue;}
      L.forEach((b,i)=>{const u=T.assetPlace(b,v.at,true),o=M.boxes[i];
        if(u.p.some((x,q)=>Math.abs(x-o.p[q])>1e-4)||u.s.some((x,q)=>Math.abs(x-o.s[q])>1e-4))bad.push(k+'.'+j+'['+i+']');});}}
  console.log('shared models: views sharing',sh,'| with their own',own,'| round trip',bad.length?'off '+bad.join(','):'exact','| club dropped',!!T.WEAPONS.club.model.drop&&T.WEAPONS.club.model.drop.length);}
// ---- hit shapes ----
T.setGob(true);S(20);
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
const G=T.goblins.slice(0,1)[0];
const hitAt=(W,dx,dz,dy=0,h=0)=>{A.heading=h;G.state='chase';G.hp=1000;G.heading=0;G.pos.x=A.pos.x+dx;G.pos.y=A.pos.y+dy;G.pos.z=A.pos.z+dz;
  const hp=G.hp;if(W)T.wpnHitShapes(A,W,5,'test');else T.hitGoblins(A.pos.x+Math.sin(h)*T.WEAPONS.club.reach,A.pos.z+Math.cos(h)*T.WEAPONS.club.reach,T.WEAPONS.club.r,5,'test',A.pos.y);
  const r=G.hp<hp;G.state='wait';G.hp=0;return r;};
const club=T.WEAPONS.club;
console.log('club has hitboxes of its own',!!(club.hit&&club.hit.hitboxes),'| none: wpnHitShapes leaves it to the old hit',T.wpnHitShapes(A,{},5,'x')===false);
// (the built-in hit copied as a capsule: how often it agrees with the old circle over a grid round Gnash)
const cap={hit:{hitboxes:[{k:'capsule',p:[0,0.25,club.reach],r:club.r,h:5.5}]}};
{let same=0,n=0,both=0,onlyNew=0,onlyOld=0;for(let x=-3;x<=3;x+=0.25)for(let z=-3;z<=4;z+=0.25){const a=hitAt(null,x,z),b=hitAt(cap,x,z);n++;if(a===b)same++;if(a&&b)both++;else if(b)onlyNew++;else if(a)onlyOld++;}
  console.log('built-in hit as a capsule against the old circle: agree',same+'/'+n,'| both hit',both,'| only the capsule (its goblin has a body)',onlyNew,'| only the circle',onlyOld);}
console.log('capsule: ahead',hitAt(cap,0,1.1),'| behind',hitAt(cap,0,-1.5),'| far ahead',hitAt(cap,0,3.5),'| turned to face +x, goblin at +x',hitAt(cap,1.1,0,0,Math.PI/2),'| turned, goblin still ahead of where he faced',hitAt(cap,0,1.1,0,Math.PI/2));
const side={hit:{hitboxes:[{k:'box',p:[0.8,0.6,0.6],s:[0.6,1.2,0.6]}]}};
console.log('box out to his +x side: there',hitAt(side,0.8,0.6),'| the other side',hitAt(side,-0.8,0.6),'| straight ahead',hitAt(side,0,1.2));
const tilt={hit:{hitboxes:[{k:'capsule',p:[0,0.6,0.8],r:0.15,h:1.6,rot:[0,0,Math.PI/2]}]}};
console.log('a sweep across, tilted on its side: at its left end',hitAt(tilt,-0.75,0.8),'| right end',hitAt(tilt,0.75,0.8),'| standing up (no tilt) the ends miss',hitAt({hit:{hitboxes:[{k:'capsule',p:[0,0.6,0.8],r:0.15,h:1.6}]}},0.75,0.8));
console.log('above his head: a goblin on a ledge 1.5 up',hitAt({hit:{hitboxes:[{k:'sphere',p:[0,2,0.8],r:0.4}]}},0,0.8,1.5),'| on the ground under it',hitAt({hit:{hitboxes:[{k:'sphere',p:[0,2,0.8],r:0.4}]}},0,0.8,0));
// (a swing in time: a katana with a capsule along its blade, following the hand, live on part of the blow. The swing is
// stepped as the game steps it (biteT counting down, wpnHitSweep each frame) and the goblin is hit only while the
// capsule's live and touching it, once a swing)
{const K=T.WEAPONS.katana,old=K.hit,P=K.player;A.gob=true;A.wpns=['club','katana'];A.wpn='katana';A.state='walk';
  const swing=(span,dx,dz,dt=1/60)=>{K.hit={hitboxes:[{k:'capsule',on:'hand',p:[0,0,0.55],r:0.15,h:0.9,rot:[1.5708,0,0],t:span}]};
    A.heading=0;G.state='chase';G.hp=1000;G.heading=Math.PI;G.pos.x=A.pos.x+dx;G.pos.y=A.pos.y;G.pos.z=A.pos.z+dz;
    A.biteDur=P.dur;A.biteT=P.dur;A.lungeT=P.lunge;A.hsOn=false;let first=null,n=0,hp=G.hp;
    while(A.biteT>0){T.wpnHitSweep(A);if(G.hp<hp){n++;hp=G.hp;if(first===null)first=+T.gobSwingU(A).toFixed(2);}A.biteT-=dt;A.lungeT-=dt;}
    T.wpnHitSweep(A);G.state='wait';G.hp=0;return n?'hit at u '+first+(n>1?' ('+n+' times!)':''):'missed';};
  console.log('a swing in time: live as it lands, goblin ahead',swing([0.85,1.1],0,0.9),'| well behind',swing([0.85,1.1],0,-2),'| live only in the wind-up',swing([0.05,0.3],0,0.9),
    '| a short span at 60 fps',swing([1.02,1.06],0,0.9),'| and at 15 fps (stepped over, still counted)',swing([1.02,1.06],0,0.9,1/15),'| live all through: hit once',swing([0,2],0,0.9));
  const h0=T.hitHand('katana',0.2),h1=T.hitHand('katana',1);console.log('the hand moves with the blow: wind-up',h0.o.map(v=>+v.toFixed(2)).join(','),'| landing',h1.o.map(v=>+v.toFixed(2)).join(','));
  K.hit=old;}
// ---- the live preview ----
{const f=JSON.parse(fs.readFileSync(path.join(AS,'weapons','dagger.json'),'utf8'));const same=T.WEAPONS.dagger,gw=T.GOB_WPN.dagger,dmg0=same.dmg;
  f.model.boxes[0].s=[0.5,0.5,0.5];f.dmg=dmg0+7;   // (the shared model, which held uses)
  console.log('live weapon:',T.liveWeapon('dagger',f),'| same entry kept',T.WEAPONS.dagger===same,'| new shape',T.WEAPONS.dagger.model.held[0][0]===0.5,'| new damage reaches Gnash',T.GOB_WPN.dagger===gw&&T.GOB_WPN.dagger.dmg===dmg0+7,'| unknown weapon:',T.liveWeapon('nope',f));
  const back=JSON.parse(fs.readFileSync(path.join(AS,'weapons','dagger.json'),'utf8'));T.liveWeapon('dagger',back);console.log('put back: damage',T.GOB_WPN.dagger.dmg===dmg0);
  const c=JSON.parse(fs.readFileSync(path.join(AS,'clips','club.json'),'utf8'));c.tracks.arm[1][1]=-2;console.log('live clip:',T.liveClip('club',c),'| in the table',T.STRIKES.club[0][1][1]===-2);}
  {const f=JSON.parse(fs.readFileSync(path.join(AS,'props','bed.json'),'utf8')),n0=T.PROPS.bed.length;f.boxes.push({s:[0.2,0.2,0.2],p:[0,1,0],c:'#ff0000',glow:true});
    const r=T.liveProp('bed',f);console.log('live prop:',r,'| a box more',T.PROPS.bed.length===n0+1,'| glows',T.PROPS.bed[n0][0]===0x1000000+0xff0000,'| dressing redrawn',T.trafficRefreshT===0,'| unknown prop',T.liveProp('nosuch',f)!=='ok');
    const g=JSON.parse(fs.readFileSync(path.join(AS,'fixtures','lamp.json'),'utf8'));g.boxes[1].s[1]=9;console.log('live fixture:',T.liveFix('lamp',g),'| taller post',T.FIXM.lamp.boxes[1][5]===9);}
// (the props and fixtures the game has against their files: every prop's colours and boxes, each fixture's boxes and spots)
{const pd=[],fd=[];for(const k in T.ASSETS.props){const a=T.assetProp(T.ASSETS.props[k]);if(k!=='bed'&&(T.PROPS[k].length!==a.length||T.PROPS[k].some((q,i)=>q[0]!==a[i][0])))pd.push(k);}
  for(const k in T.ASSETS.fixtures)if(k!=='lamp'&&JSON.stringify(T.FIXM[k])!==JSON.stringify(T.assetFix(T.ASSETS.fixtures[k])))fd.push(k);
  console.log('props in the game',Object.keys(T.PROPS).length,'from files',Object.keys(T.ASSETS.props).length,pd.length?'differ '+pd.join(','):'same','| fixtures',Object.keys(T.FIXM).join(','),fd.length?'differ '+fd.join(','):'same');}
// (the hippos' moves: the game's tables from their files, a move edited live, and a recording for the editor's Hippo tab)
{const D=T.assetMovesAll(T.ASSETS);let same=JSON.stringify(D)===JSON.stringify(T.DEV_ABIL);for(const m of D)for(const [pk,,v] of m.ps)if(T.AB[m.k][pk]!==v)same=false;
  console.log('moves in the game',T.DEV_ABIL.length,'from files',D.length,same?'same':'DIFFERENT','| custom hitboxes',Object.keys(T.HB).length);
  const f=JSON.parse(fs.readFileSync(path.join(AS,'moves','stomp1.json'),'utf8')),A=T.AB.stomp1;f.params.dmg.v=33;
  const R0=T.liveRecord('stomp1');
  f.hitboxes={on:true,boxes:[{kind:'dmg',shape:'sphere',bone:'root',r:2,len:3,fwd:2,up:1,side:0,a:0,b:5,dmg:9,carDmg:9}]};
  console.log('live move:',T.liveMove('stomp1',f),'| same entry',T.AB.stomp1===A,'| damage',A.dmg,'| hitboxes on',!!(T.HB.stomp1&&T.HB.stomp1.on),'| unknown',T.liveMove('nope',f));
  const R=T.liveRecord('stomp1'),m=R.model;
  console.log('recording: frames',R.N,'parts',m.length,'boxes',m.filter(q=>q.g).length,'named',m.filter(q=>q.n).map(q=>q.n).join(','),'| root at',R.tr[0].toFixed(2),R.tr[2].toFixed(2),
    '| hits built-in',R0.hits.length,'custom',R.hits.filter(h=>h.src===0).length,'lines',R.hits.every(h=>h.L.length>0&&h.L.length%6===0),'| near him',R.hits.every(h=>Math.abs(h.L[0])<20&&Math.abs(h.L[2])<20),'| anchors',R.anchors.join(','));
  const back=JSON.parse(fs.readFileSync(path.join(AS,'moves','stomp1.json'),'utf8'));T.liveMove('stomp1',back);console.log('put back: damage',A.dmg,'| hitboxes',!!T.HB.stomp1);}
S(5);console.log('frames after: ok');
