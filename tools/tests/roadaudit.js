let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={tollsOf,tsAt,axisSpan,sideUsed,hwDeadEnd,hwRampAt,exitPt,settlementLat,hwSurf,lineOf,rtSurfY,rtFlat,cloverOf,cloverAt,rampSite,icOf,plotType,hwRow,hwCol,hwLine,placeAt,AX_KIND,segOpen,buildRoutesFrom,HY_X,HY_Z,seaPlot,settlementAt,routesNearBox,rtRamp,rtPoint,routeAt,BLOCK,biomeOf,hwSurf,hwRampAt,hwDeadEnd,sideUsed,turbineAt,abandonedSpots,caveMouth,sewerStair,railLinksInBox,railLink,metroOf,metroStation,railAt,railPlot,railStation,railNear,underAt,seaPlot,coastType,venues2:()=>venues,refreshVenues,updateVenues,bigPlainsAt,bunkerAt,tollsOf,railOf,pylonsOf,venues,CR_B,PL_B,castleAt,gameOn,brandSpots,lmOn,setName,knownSets,PB,zoneAt,activeFix,boardsOf,pullSpots,managePull,PULL,streetFurn,doorSpec,routesNearBox,refreshFixtures,rtPoint,set dayN2(v){dayN=v},doorsOn,refreshDoors,updateDoors,routeCuts,doorRects,surfaceAt,exitPt,BLOCK,ROUTES,routeAt,riverAt,ensureRoutes,axisSpan,placeAt,hwLine,riverDir,genChunk,setDestroyed,nearStanding,setBuildings,bldgSolid,bldgLeft,get destroyed(){return destroyed},setRaw,addEdit,blockAt,ABIL,RIG_NAMES,devRenderHbProps,devSetMode,devInitGL,devTick,devApply,dbgGeo,gusBite,set playingX(v){},HB,hbFromBuiltIn,damageGoblin,devSimulate,DEVP,AB,DEV_ABIL,goblins,chunkArr,get leafFall(){return leafFall},set dayN(v){dayN=v},get dayN(){return dayN},WX,snowBorn,groundAt,rampUnder,rampSite,cloverOf,ctlAt,icRoutes,icOf,cloverAt,isRiver,zoneAt,farmK,farmLane,settlementAt,settlementLat,biomeOf,ghwRow,ghwCol,hwRow2:hwRow,hwCol2:hwCol,get split(){return split},get playing(){return playing},get eyePrefs(){return eyePrefs},topples,bodies,collapses:()=>collapses,plotInfo,get,setRaw,chunks,spawnTraffic,damageGoblin,rubble,crush,players,cars,goblins,damageCar,damagePlayer,get,plotInfo,keys,frame,chunks,meshes,get score(){return score},get meshes(){return meshes},get viewR(){return viewR},ctlAt,lightPhase,get trafficClock(){return trafficClock},set trafficClock(v){trafficClock=v},heads,signs,armAlive,trafficLimit,OBP,menuPad,shocks,cones,lockSwitch,hwRow,superOf,lotBays,parkSpots,crush,fallImpact,gasBoom,gasBoom,fires,addFire,updateFires,crushBall,hwCol,HY_X,HY_Z,superOf,spawnHw,plotType,bridgeOf,bridgeAt,findIndoor,pendingBooms,get score2(){return score},spawnGoblin,bldgAt,get menuOpen(){return menuOpen},set menuOpen(v){menuOpen=v},obitList,renderObits,showTab,hitGoblins,damageGoblin,V3,get viewSetting(){return viewSetting},lodFar,meshes,activeFix,get tod(){return tod},set tod(v){tod=v},WORLD_LIGHT,skyU,hemi,downFix:()=>downFix,falling,FIX_BAR,FIX_GLOW,get kills(){return kills},get split(){return split},get playing(){return playing}};\n})();');
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

// Audits the motorways of a world, from the blocks actually generated: where decks stop dead, break, or cut through things.
// Usage: SEED=1 node roadaudit.js [lattice radius, default 18]   (motorways only run along every ninth row/column of places)
const RAD=+(process.argv[2]||18),CELL=32,G=44,CS=16,BL=T.BLOCK;
const names={};const blkSrc=src0.slice(src0.indexOf('const AIR=0'),src0.indexOf('const AIR=0')+3000);for(const m of blkSrc.matchAll(/([A-Z_0-9]+)=(\d+)/g))names[+m[2]]=m[1];
const nm=b=>names[b]||b;
const OK_DECK=new Set([12,13,14,16]);
const roadish=b=>{const B=BL[b];return !!b&&(b===12||b===13||b===14||b===16||!!(B&&B.ramp)||(names[b]||'').match(/^(LINE|LANE|CROSS)/));};
const out={deadNoRoute:[],deadNoRamp:[],breaks:[],clip:[],touch:[],rampFoot:[]};let spans=0,routes=0,deckCols=0;
const col=(ax,a,c)=>ax==='x'?[a,c]:[c,a];
const roadY=(x,z,y0,lim)=>{for(let d=0;d<=lim;d++){for(const y of d?[y0+d,y0-d]:[y0]){const b=T.get(x,y,z);if(roadish(b))return y;}}return null;};
function scanDeck(tag,ax,k,a0,a1,HY){
  const clips=new Map();
  for(let a=a0;a<a1;a++){const m=Math.floor(a/CELL),rampHere=T.hwRampAt(ax,k,a);
    // what's this part of the line next to? another motorway crossing, a slip road or cloverleaf is expected to be there
    const [px0,pz0]=col(ax,m,k);let expected=false;for(let d=-1;d<=1;d++){const [px,pz]=ax==='x'?[m+d,k]:[k,m+d];if(T.cloverOf(px,pz)||T.rampSite(px,pz)||T.rampSite(px,pz-1)||T.rampSite(px-1,pz)||(ax==='x'?T.hwCol(m+d,k)||T.hwCol(m+d,k-1):T.hwRow(m+d,k)||T.hwRow(m+d,k-1)))expected=true;}
    for(let q=0;q<=13;q++){const [x,z]=col(ax,a,k*CELL-3+q);deckCols++;
      const topY=rampHere?HY-Math.floor(rampHere.d/2):HY;
      for(let y=G+1;y<topY+8;y++){if(y>=topY-1&&y<=topY+1)continue;const b=T.get(x,y,z);if(!b||b===16||b===9)continue;if(y<topY-1&&/^(LEAVES|LOG|GRASS|FLOWER|DIRT|STONE|MOSSSTONE|FENCE|METAL|AWN_|CRATE|PLANKS)/.test(nm(b)))continue;
        if(!expected){const key=m+':'+nm(b);const K=Math.floor(a/CELL)+','+k;let c=clips.get(K);if(!c){c={tag,ax,k,m,x,z,y,HY,n:0,types:{},plot:T.plotType(...(ax==='x'?[m,z<k*CELL?k-1:k]:[x<k*CELL?k-1:k,m]))};clips.set(K,c);}c.n++;c.types[nm(b)]=(c.types[nm(b)]||0)+1;}
      }}}
  for(const c of clips.values())out.clip.push(c);
}
const seen=new Set();T.ensureRoutes(0,0);
for(let rx=-RAD;rx<=RAD;rx++)for(let rz=-RAD;rz<=RAD;rz++){
  const P=T.placeAt(rx,rz);
  for(const ax of ['x','z']){if(T.AX_KIND(P,ax)!=='moto')continue;
    const S=T.axisSpan(P,ax);if(!S)continue;
    const HY=ax==='x'?T.HY_X:T.HY_Z,[ex,ez]=[P.cx*CELL,P.cz*CELL];T.ensureRoutes(ex,ez);if(process.env.AUDIT_V)console.error('span',rx,rz,ax,S.kind,S.m0,S.m1,Date.now()%1000000);
    // each way out: there should be a route, or (at a motorway that stops here) a ramp down to the street
    if(S.kind==='moto'){spans++;scanDeck('deck',ax,S.k,S.m0*CELL,(S.m1+1)*CELL,HY);
      for(const s of [-1,1]){const used=T.sideUsed(P,ax,s);const M=s>0?S.m1:S.m0;
        const [ax0,c0]=[(s>0?(M+1)*CELL:M*CELL),S.k*CELL+4];const [x,z]=col(ax,ax0,c0);
        if(used){const R=T.ROUTES.find(R=>R.kind==='moto'&&R.ax===ax&&((R.A.T===P&&R.A.s===s)||(R.B.T===P&&R.B.s===s)));if(!R)out.deadNoRoute.push({rx,rz,ax,s,k:S.k,M,x,z});}
        else{const e=T.hwDeadEnd(ax,S.k,M);if(e!==s)out.deadNoRamp.push({rx,rz,ax,s,k:S.k,M,x,z,e,type:P.type});
          else{ // the ramp's foot: there must be a street on the ground to land on
            let foot=null;for(let d=-60;d<=60;d++){const a=ax0+d;if(T.hwRampAt(ax,S.k,a)&&!T.hwRampAt(ax,S.k,a+s)){foot=a;}}
            if(foot!==null){const a2=foot+s*2,[fx,fz]=col(ax,a2,c0),b=T.get(fx,G,fz),nx=T.get(fx,G+1,fz);if(!roadish(b)||nx)out.rampFoot.push({rx,rz,ax,s,k:S.k,M,x:fx,z:fz,b:nm(b),above:nm(nx),type:P.type});}
            else out.rampFoot.push({rx,rz,ax,s,k:S.k,M,x,z,b:'noFoot'});}}
      }}
  }
}
// the routes: walk each centre line from end to end looking for a jump in the road
// (a snapshot: generating chunks along the way builds more routes further out, and this would chase them forever)
for(const R of T.ROUTES.slice()){if(R.kind!=='moto'||seen.has(R))continue;const inR=E=>Math.abs(E.T.rx)<=RAD&&Math.abs(E.T.rz)<=RAD;if(!inR(R.A)||!inR(R.B))continue;seen.add(R);routes++;
  let prev=null;for(let s=0;s<=R.L;s+=1){const p=T.rtPoint(R,s),x=Math.floor(p.x+p.tz*2),z=Math.floor(p.z-p.tx*2),e=T.rtSurfY(R,s);
    const y=roadY(x,z,Math.round(e),3);if(y===null){out.breaks.push({R:R.id,s,x,z,why:'no road',e});s+=20;prev=null;continue;}
    if(prev!==null&&Math.abs(y-prev)>2){out.breaks.push({R:R.id,s,x,z,why:'jump',y,prev});s+=20;}
    prev=y;}
  // where a route meets a town's deck, its top must be level with the deck
  for(const [E,sAt] of [[R.A,0],[R.B,R.L]]){const S=T.axisSpan(E.T,E.ax);if(S&&S.kind==='moto'&&Math.abs(T.rtSurfY(R,sAt)-(R.HY+1))>1.5)out.breaks.push({R:R.id,why:'end level',y:T.rtSurfY(R,sAt)});}
}
const sum=l=>l.reduce((a,c)=>{a[c.plot]=(a[c.plot]||0)+1;return a;},{});
// everything a route runs through: blocks of something built, right beside or within its road (terrain and trees don't count)
const NATURAL=new Set(['GRASS','DIRT','LEAVES','LOG','FLOWER','STONE','SAND','WATER','MOSSSTONE','GRAVEL','CLAY','TALLGRASS','SNOW','FENCE','CONCRETE','ASPHALT','LINE','LINEX','LINE_R','LINEX_R','LANE','LANEX']);
const hitRoutes=new Map();const seen2=new Set();
for(const R of T.ROUTES.slice()){if(seen2.has(R))continue;const inR=E=>Math.abs(E.T.rx)<=RAD&&Math.abs(E.T.rz)<=RAD;if(!inR(R.A)||!inR(R.B))continue;seen2.add(R);
  for(let s=0;s<=R.L;s+=2){if((T.tollsOf?T.tollsOf(R):[]).some(t=>Math.abs(s-t)<8))continue;const p=T.rtPoint(R,s),e=R.kind==='moto'?T.rtSurfY(R,s):G+1;
    for(let w=-10;w<=10;w+=1){const x=Math.floor(p.x+p.tz*w),z=Math.floor(p.z-p.tx*w);const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
      for(let y=Math.max(G+1,Math.round(e)-3);y<e+8;y++){const b=T.get(x,y,z);if(!b||BL[b]&&BL[b].ramp)continue;const n=nm(b);if(NATURAL.has(n)||/^(GRASS|LEAF)/.test(n))continue;
        const K=R.id+':'+px+','+pz;let c=hitRoutes.get(K);if(!c){c={R:R.id,kind:R.kind,x,y,z,s:Math.round(s),n:0,types:{},plot:T.plotType(px,pz),e:+e.toFixed(1)};hitRoutes.set(K,c);}c.n++;c.types[n]=(c.types[n]||0)+1;}}}
}
out.routeHits=[...hitRoutes.values()].sort((a,b)=>b.n-a.n);
console.log('route hits',out.routeHits.length,'by plot',JSON.stringify(sum(out.routeHits)));for(const v of out.routeHits.slice(0,+(process.env.AUDIT_N||12)))console.log('routeHit',JSON.stringify(v));
// the motorways that stop at a place
let ends=0;const endL=[];for(let rx=-RAD;rx<=RAD;rx++)for(let rz=-RAD;rz<=RAD;rz++){const P=T.placeAt(rx,rz);for(const ax of ['x','z']){if(T.AX_KIND(P,ax)!=='moto')continue;const S=T.axisSpan(P,ax);if(!S)continue;for(const s of [-1,1])if(S.kind==='moto'&&!T.sideUsed(P,ax,s)){ends++;endL.push([rx,rz,ax,s,P.type,s>0?S.m1:S.m0,S.k]);}}}
let cross=0,clov=0;const noClov=[];for(let rx=-RAD;rx<=RAD;rx++)for(let rz=-RAD;rz<=RAD;rz++){const P=T.placeAt(rx,rz);if(T.AX_KIND(P,'x')!=='moto'||T.AX_KIND(P,'z')!=='moto')continue;const j=T.lineOf(P,'z'),k=T.lineOf(P,'x');if(T.hwCol(j,k)&&T.hwRow(k,j)){cross++;if(T.cloverAt(j,k))clov++;else noClov.push([rx,rz,P.type,j,k]);}}
console.log('motorway crossings',cross,'with interchange',clov,JSON.stringify(noClov));
console.log('motorway ends in a ramp',ends,JSON.stringify(endL.slice(0,10)));
console.log('spans','spans',spans,'routes',routes,'deckCols',deckCols);
console.log('dead ends: no route',out.deadNoRoute.length,'no ramp',out.deadNoRamp.length,'ramp foot bad',out.rampFoot.length,'breaks',out.breaks.length,'clip cells',out.clip.length,'by plot',JSON.stringify(sum(out.clip)));
const ty={};for(const c of out.clip)for(const t in c.types)ty[t]=(ty[t]||0)+c.types[t];console.log('clip blocks',JSON.stringify(ty));
for(const n of ['deadNoRoute','deadNoRamp','rampFoot','breaks'])for(const v of out[n].slice(0,8))console.log(n,JSON.stringify(v));
out.clip.sort((a,b)=>b.n-a.n);for(const v of out.clip.slice(0,10))console.log('clip',JSON.stringify(v));
if(process.env.AUDIT_JSON)fs.writeFileSync(process.env.AUDIT_JSON,JSON.stringify(out));
process.exit(0);
