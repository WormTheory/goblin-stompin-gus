let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get seed(){return seed},jDeg,rtRamp,rtFlat,jSquare,hwRampAt,tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,biomeOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStair,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,devRenderHbProps,devSetMode,devInitGL,devTick,devApply,dbgGeo,gusBite,set playingX(v){},HB,hbFromBuiltIn,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,biomeOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Drives every lane from the blocks: can a car actually get along each highway and street, and on to whatever it meets?
// Usage: SEED=1 node joinaudit.js [lattice radius, default 9] [plots of street to scan, default 40]
const RAD=+(process.argv[2]||9),PR=+(process.argv[3]||40),CELL=32,G=44,BL=T.BLOCK,ROADW=8;
const names={};{const s=src0.slice(src0.indexOf('const AIR=0'),src0.indexOf('const AIR=0')+3000);for(const m of s.matchAll(/([A-Z_0-9]+)=(\d+)/g))names[+m[2]]=m[1];}
const nm=b=>names[b]||b,solid=b=>{const B=BL[b];return !!b&&B&&B.solid&&!B.ramp&&!B.thin;};
const isRoad=b=>{const B=BL[b];return !!b&&(B&&B.ramp||/^(ASPHALT|LINE|LANE|CROSS)/.test(nm(b)));};
const out={};const add=(k,o)=>{(out[k]=out[k]||[]).push(o);};
T.ensureRoutes(0,0);console.log('world seed',T.seed);
for(let rx=-RAD;rx<=RAD;rx++)for(let rz=-RAD;rz<=RAD;rz++){const P=T.placeAt(rx,rz);T.ensureRoutes(P.cx*CELL,P.cz*CELL);}
const inR=E=>Math.abs(E.T.rx)<=RAD&&Math.abs(E.T.rz)<=RAD;
let routes=0,km=0;
const hitC=new Map();const hit=(k,R,s,x,y,z,b)=>{const K=k+':'+R+':'+Math.floor(s/24);let c=hitC.get(K);if(!c){c={k,R,s:Math.round(s),x,y,z,b:nm(b),n:0};hitC.set(K,c);}c.n++;};
for(const R of T.ROUTES.slice()){if(!inR(R.A)||!inR(R.B))continue;routes++;km+=R.L;
  for(let s=2;s<=R.L-2;s+=1){const p=T.rtPoint(R,s),e=T.rtSurfY(R,s);
    for(const o of Math.min(s,R.L-s)<16?[-1.5,1.5]:[-4.5,-1.5,1.5,4.5]){const x=Math.floor(p.x+p.tz*o),z=Math.floor(p.z-p.tx*o),y0=Math.floor(e-0.01);
      // the surface: road within a block of where it should be
      let road=false;for(let y=y0-1;y<=y0+1;y++)if(isRoad(T.get(x,y,z)))road=true;
      if(!road){const b=T.get(x,y0,z);if(nm(b)==='PLANKS'||nm(b)==='GRAVEL'||nm(b)==='METAL'){}else hit('noRoad',R.id,s,x,y0,z,b);}
      for(let y=y0+1;y<=y0+3;y++){const b=T.get(x,y,z);if(solid(b)&&!(BL[b].ramp)){hit('blocked',R.id,s,x,y,z,b);break;}}
    }}
  // past each end, the road on into town: the lanes for 40 blocks in along the line
  for(const E of [R.A,R.B]){const S=T.axisSpan(E.T,E.ax);if(!S)continue;const ax=E.ax,a0=E.s>0?(S.m1+1)*CELL:S.m0*CELL,dir=-E.s,HY=S.kind==='moto'?(ax==='x'?T.HY_X:T.HY_Z):G;
    const spanL=(S.m1-S.m0+1)*CELL;for(let d=0;d<Math.min(40,spanL);d++){const a=a0+dir*d;for(const o of [2.5,5.5]){const c=S.k*CELL+o,[x,z]=ax==='x'?[Math.floor(a),Math.floor(c)]:[Math.floor(c),Math.floor(a)];const r=S.kind==='moto'?T.hwRampAt(ax,S.k,a):null,y0=S.kind==='moto'?(r?HY-Math.floor(r.d/2):HY):G;
      if(!isRoad(T.get(x,y0,z))&&!isRoad(T.get(x,y0-1,z)))hit('intoTown',R.id,d,x,y0,z,T.get(x,y0,z));
      for(let y=y0+1;y<=y0+3;y++){const b=T.get(x,y,z);if(solid(b)){hit('intoTownBlocked',R.id,d,x,y,z,b);break;}}}}}
}
// does each highway's end actually join up with its town's streets? (the size of the street network it reaches)
const lone=[];let endsN=0;for(const R of T.ROUTES.slice()){if(!inR(R.A)||!inR(R.B))continue;for(const E of [R.A,R.B]){const S=T.axisSpan(E.T,E.ax);if(!S||S.kind==='moto')continue;endsN++;const j0=E.s>0?S.m1+1:S.m0,st=E.ax==='x'?[j0,S.k]:[S.k,j0],seen=new Set([st.join()]),q=[st];while(q.length&&seen.size<40){const [i,j]=q.pop();for(let d=0;d<4;d++){if(!T.segOpen(i,j,d))continue;const n=[i+[0,1,0,-1][d],j+[1,0,-1,0][d]];if(!seen.has(n.join())){seen.add(n.join());q.push(n);}}}
  if(seen.size<6)lone.push({R:R.id,x:st[0]*CELL+4,z:st[1]*CELL+4,nodes:seen.size,type:E.T.type,sp:S.m0+'-'+S.m1,flat:!!S.flat});}}
console.log('ground highway ends',endsN,'not joined to streets',lone.length,JSON.stringify(lone.slice(0,10)));
const hits=[...hitC.values()];const cnt={};for(const c of hits)cnt[c.k]=(cnt[c.k]||0)+1;
console.log('routes',routes,'length',Math.round(km),'problem stretches',JSON.stringify(cnt));
const byb={};for(const c of hits){const k=c.k+' '+c.b;byb[k]=(byb[k]||0)+1;}console.log('by block',JSON.stringify(byb));
for(const k of Object.keys(cnt))for(const c of hits.filter(h=>h.k===k).sort((a,b)=>b.n-a.n).slice(0,8))console.log(' ',JSON.stringify(c));
// the streets: both lanes of every open stretch, and what's at each end
let segs=0;const sb=new Map();const sh=(k,x,y,z,b)=>{const K=k+':'+Math.floor(x/CELL)+','+Math.floor(z/CELL);let c=sb.get(K);if(!c){c={k,x,y,z,b:nm(b),n:0,type:T.plotType(Math.floor(x/CELL),Math.floor(z/CELL))};sb.set(K,c);}c.n++;};
let ends=0,endBad=[],deg={};
for(let i=-PR;i<=PR;i++)for(let j=-PR;j<=PR;j++){const dg=T.jDeg(i,j);deg[dg]=(deg[dg]||0)+1;
  for(const d of [0,1]){if(!T.segOpen(i,j,d))continue;segs++;
    for(let a=ROADW;a<CELL;a+=1)for(const o of [2,6]){const x=d===0?i*CELL+o:i*CELL+a,z=d===0?j*CELL+a:j*CELL+o;const b=T.get(x,G,z);
      if(!isRoad(b)&&!isRoad(T.get(x,G+1,z))&&!isRoad(T.get(x,G+2,z)))sh('noSurface',x,G,z,b);
      for(let y=G+1;y<=G+3;y++){const u=T.get(x,y,z);if(solid(u)){sh('blocked',x,y,z,u);break;}}}}
  // a dead end: one arm only. What's beyond the stub?
  if(dg===1){ends++;const dir=[0,1,2,3].find(q=>T.segOpen(i,j,q)),opp=[[0,-1],[-1,0],[0,1],[1,0]][dir],cx=i*CELL+4,cz=j*CELL+4;let f=null;for(let t=4;t<=26&&!f;t+=2){const x=cx+opp[0]*t,z=cz+opp[1]*t,b=T.get(x,G,z);if(isRoad(b)&&t>6)f=t;}
    endBad.push({i,j,x:cx,z:cz,dir,type:T.plotType(i,j),near:f,bar:nm(T.get(cx+opp[0]*6,G+1,cz+opp[1]*6))});}
}
const sl=[...sb.values()];const sc={};for(const c of sl)sc[c.k+' '+c.b]=(sc[c.k+' '+c.b]||0)+1;
console.log('street stretches',segs,'junction degrees',JSON.stringify(deg),'problems',JSON.stringify(sc));for(const c of sl.sort((a,b)=>b.n-a.n).slice(0,10))console.log(' ',JSON.stringify(c));
console.log('dead ends',ends,'with road just beyond',endBad.filter(e=>e.near).length,JSON.stringify(endBad.filter(e=>e.near).slice(0,8)));
process.exit(0);
