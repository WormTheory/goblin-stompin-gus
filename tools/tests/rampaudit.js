let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={ROADW2:ROADW,jDeg,rtRamp,rtFlat,icRamps,keys,groundAt,tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,biomeOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStair,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,devRenderHbProps,devSetMode,devInitGL,devTick,devApply,dbgGeo,gusBite,set playingX(v){},HB,hbFromBuiltIn,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,biomeOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};

const [A,B]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;

// Measures how smooth the ramps are, from the game's own movement: Gus walked and sprinted up and down each kind of ramp,
// and every car seen on a slope while the traffic runs. Usage: SEED=1 node rampaudit.js [seconds of traffic per spot, default 45]
const SECS=+(process.argv[2]||45),CELL=32,G=44,DT=16.7/1000;
const pl=A;pl.hp=999;
const ramps=[];
const addR=(kind,x0,z0,x1,z1,ax)=>{if(ramps.filter(r=>r.kind===kind).length<4)ramps.push({kind,x0,z0,x1,z1});};
T.ensureRoutes(0,0);
for(let rx=-9;rx<=9;rx++)for(let rz=-9;rz<=9;rz++){const P=T.placeAt(rx,rz);for(const ax of ['x','z']){if(T.AX_KIND(P,ax)!=='moto')continue;const S=T.axisSpan(P,ax);if(!S||S.kind!=='moto')continue;T.ensureRoutes(P.cx*CELL,P.cz*CELL);
  const co=(a,c)=>ax==='x'?[a,c]:[c,a];
  for(const s of [-1,1]){if(T.sideUsed(P,ax,s))continue;const M=s>0?S.m1:S.m0;let lo=null,hi=null;for(let a=(M-3)*CELL;a<(M+3)*CELL;a++)if(T.hwRampAt(ax,S.k,a)){if(lo===null)lo=a;hi=a;}
    if(lo===null)continue;const c=S.k*CELL+(s>0?5.5:2.5),top=s>0?lo:hi,foot=s>0?hi:lo;addR('townEnd',...co(foot+s*12,c),...co(top-s*12,c));}
  for(let m=S.m0;m<=S.m1;m++)if(T.icOf(ax,S.k,m)===m){const side=1,HY=ax==='x'?T.HY_X:T.HY_Z;for(const r of T.icRamps(ax,m,side,HY)){if(r.k!=='rise')continue;const c=S.k*CELL+14,lo2=r.s>0?r.a0:r.a1,hi2=r.s>0?r.a1:r.a0,d=Math.sign(hi2-lo2);addR('slip',...co(lo2-d*6,c),...co(hi2+d*6,c));break;}}
}}
for(const R of T.ROUTES.slice()){if(R.kind!=='moto')continue;const F=T.rtFlat(R),RL=2*(R.HY-G);if(R.L<RL*3)continue;
  const lane=(s,o)=>{const p=T.rtPoint(R,s);return [p.x+p.tz*o,p.z-p.tx*o];};
  if(!F[0])addR('route',...lane(RL+12,1.5),...lane(0,1.5));if(!F[1])addR('route',...lane(R.L-RL-12,1.5),...lane(R.L,1.5));}
console.log('ramps to walk',JSON.stringify(ramps.map(r=>r.kind).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{})));
const off=()=>{for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}for(const g of T.goblins){g.state='wait';g.root.visible=false;g.t=-1e9;}};
function walk(x0,z0,x1,z1,sprint){
  const L=Math.hypot(x1-x0,z1-z0),hx=(x1-x0)/L,hz=(z1-z0)/L,yaw=Math.atan2(hx,hz)+Math.PI;
  pl.pos.set(x0,T.groundAt(x0,z0,120)+0.05,z0);pl.vy=0;pl.mvx=pl.mvz=0;pl.heading=Math.atan2(hx,hz);pl.state='walk';pl.hp=20;pl.stam=100;pl.peakY=pl.pos.y;pl.grounded=true;off();
  for(let i=0;i<20;i++){pl.pos.x=x0;pl.pos.z=z0;now+=16.7;T.frame(now);}
  T.keys.add('KeyW');if(sprint)T.keys.add('ShiftLeft');
  const m={frames:0,air:0,maxDy:0,maxDdy:0,minV:1e9,maxV:0,stops:0,got:false,dmg:0,state:{},maxOff:0};let py=pl.pos.y,pdy=null,px=pl.pos.x,pz=pl.pos.z;const hp0=pl.hp;
  for(let i=0;i<3000;i++){pl.cam.yaw=yaw;pl.stam=100;pl.hp=20;now+=16.7;T.frame(now);
    const a=(pl.pos.x-x0)*hx+(pl.pos.z-z0)*hz,o=Math.abs((pl.pos.x-x0)*hz-(pl.pos.z-z0)*hx);m.maxOff=Math.max(m.maxOff,o);
    const v=Math.hypot(pl.pos.x-px,pl.pos.z-pz)/DT,dy=pl.pos.y-py;
    if(a>2&&a<L-2){m.frames++;if(!pl.grounded)m.air++;m.maxDy=Math.max(m.maxDy,Math.abs(dy));if(pdy!==null)m.maxDdy=Math.max(m.maxDdy,Math.abs(dy-pdy));m.minV=Math.min(m.minV,v);m.maxV=Math.max(m.maxV,v);if(v<1)m.stops++;m.state[pl.state]=(m.state[pl.state]||0)+1;}
    if(TRACE&&i%6===0)m.tr=(m.tr||'')+` ${a.toFixed(1)}:${pl.pos.y.toFixed(2)}${pl.grounded?'':'^'}`;px=pl.pos.x;pz=pl.pos.z;py=pl.pos.y;pdy=dy;if(a>=L-1){m.got=true;break;}}
  if(!m.got){const nm=b=>b;m.end=[+pl.pos.x.toFixed(1),+pl.pos.y.toFixed(2),+pl.pos.z.toFixed(1)];m.round=[];for(let dy2=-1;dy2<=2;dy2++){m.round.push(T.get(Math.floor(pl.pos.x+hx*1.5),Math.floor(pl.pos.y)+dy2,Math.floor(pl.pos.z+hz*1.5)));}}
  T.keys.clear&&T.keys.delete('KeyW');T.keys.delete('ShiftLeft');m.dmg=hp0-pl.hp;return m;
}
const TRACE=process.env.TRACE;const fmt=m=>(m.end?'END '+JSON.stringify(m.end)+' ahead '+JSON.stringify(m.round)+' ':'')+(m.tr?m.tr+' | ':'')+`${m.got?'ok ':'NOT'} frames ${m.frames} air ${m.air} maxStep ${m.maxDy.toFixed(3)} maxJerk ${m.maxDdy.toFixed(3)} speed ${m.minV.toFixed(1)}-${m.maxV.toFixed(1)} stops ${m.stops} off ${m.maxOff.toFixed(1)} ${JSON.stringify(m.state)}`;
const ONLY=process.env.ONLY;if(!process.env.NOWALK)for(const r of ramps.filter(r=>!ONLY||r.kind===ONLY))for(const [lab,a,b,c,d] of [['up',r.x0,r.z0,r.x1,r.z1],['down',r.x1,r.z1,r.x0,r.z0]])for(const sp of [false,true]){
  console.log(r.kind.padEnd(8),lab.padEnd(4),sp?'sprint':'walk  ',Math.round(a),Math.round(c-a+a),fmt(walk(a,b,c,d,sp)));}

if(process.env.NOCARS)process.exit(0);
// the traffic: hover out of the way over the ramps and follow every car near there
for(const c of T.cars){c.respawnT=0;}
const stats={};const ev=[];
const spots=ramps.map(r=>[r.kind,(r.x0+r.x1)/2,(r.z0+r.z1)/2]).filter((s,i,l)=>l.findIndex(q=>q[0]===s[0])===i||i%3===0).slice(0,+(process.env.SPOTS||8));
for(const [kind,sx,sz] of spots){
  const hold=()=>{pl.pos.set(sx,130,sz);pl.vy=0;pl.hp=999;pl.peakY=130;pl.state='walk';for(const c of T.cars)if(c.hunter&&!c.police)c.hunter=false;};
  for(let i=0;i<15*60;i++){hold();now+=16.7;T.frame(now);}
  const prev=new Map();
  for(let f=0;f<SECS*60;f++){hold();now+=16.7;T.frame(now);
    for(const c of T.cars){if(!c.alive||c.parked||Math.hypot(c.pos.x-sx,c.pos.z-sz)>140){prev.delete(c);continue;}
      const p=prev.get(c);const mode=c.path?'path':c.hw?'hw':c.rt?'route':'street',cur={y:c.pos.y,x:c.pos.x,z:c.pos.z,pitch:c.pitch||0,roll:c.roll||0,dy:p?c.pos.y-p.y:0,mode,sp:c.speed};prev.set(c,cur);if(!p)continue;
      const sloped=c.pos.y>G+1.3||Math.abs(cur.dy)>1e-3;if(!sloped)continue;
      const st=stats[mode]||(stats[mode]={frames:0,slope:0,airb:0,steps:0,maxDy:0,maxDdy:0,maxDp:0,maxDr:0,stopped:0,teleport:0});st.frames++;
      const v=Math.hypot(c.pos.x-p.x,c.pos.z-p.z),dy=Math.abs(cur.dy),ddy=Math.abs(cur.dy-p.dy),dp=Math.abs(cur.pitch-p.pitch),dr=Math.abs(cur.roll-p.roll);
      if(Math.abs(cur.dy)>1e-3)st.slope++;if(c.grounded===false)st.airb++;if(Math.abs(c.speed)<0.5)st.stopped++;
      st.maxDy=Math.max(st.maxDy,dy);st.maxDdy=Math.max(st.maxDdy,ddy);st.maxDp=Math.max(st.maxDp,dp);st.maxDr=Math.max(st.maxDr,dr);
      if(v>1.2)st.teleport++;
      // a step: much more climb in a frame than a one-in-two slope allows at this speed
      if(dy>0.5*v*1.5+0.04&&dy>0.06){st.steps++;if(ev.length<3000)ev.push({why:'step',mode,x:Math.round(c.pos.x),y:+c.pos.y.toFixed(2),z:Math.round(c.pos.z),dy:+cur.dy.toFixed(3),v:+v.toFixed(3),gr:c.grounded,veh:c.veh,h:+c.heading.toFixed(2),sp:+c.speed.toFixed(1),blk:c.pathBlk,cl:c.path&&c.path.length});}
      if(dp>0.05&&ev.length<3000)ev.push({why:'pitch',mode,x:Math.round(c.pos.x),y:+c.pos.y.toFixed(2),z:Math.round(c.pos.z),dp:+dp.toFixed(3),p:+cur.pitch.toFixed(3)});}
  }
  console.log('spot',kind,Math.round(sx),Math.round(sz),'cars',T.cars.filter(c=>c.alive&&Math.hypot(c.pos.x-sx,c.pos.z-sz)<140).length);
}
for(const k in stats){const s=stats[k];console.log(k.padEnd(7),'frames',s.frames,'moving vertically',s.slope,'airborne',s.airb,'stopped',s.stopped,'steps',s.steps,'teleports',s.teleport,'maxDy/frame',s.maxDy.toFixed(3),'maxJerk',s.maxDdy.toFixed(3),'maxPitch/frame',s.maxDp.toFixed(3),'maxRoll/frame',s.maxDr.toFixed(3));}
const cl={};for(const e of ev){const k=e.why+' '+e.mode+' '+Math.round(e.x/6)*6+','+Math.round(e.y)+','+Math.round(e.z/6)*6;cl[k]=(cl[k]||0)+1;}console.log('where',JSON.stringify(Object.entries(cl).sort((a,b)=>b[1]-a[1]).slice(0,14)));
const by={};for(const e of ev){const k=e.why+' '+e.mode;(by[k]=by[k]||[]).push(e);}
for(const k in by){console.log(k,by[k].length);for(const e of by[k].slice(0,5))console.log('  ',JSON.stringify(e));}
process.exit(0);
