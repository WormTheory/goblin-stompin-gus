// ---- Dev tab: Structures -- every kind of thing the world builds, found in this world (the nearest one to Gus) and
// shown on its own in a turntable preview: its blocks cut out of the world and meshed just as the world meshes them ----
const ST={r:null,scene:null,cam:null,grp:null,key:null,yaw:0.8,pitch:0.62,zoom:1,c:new V3(0,G+4,0),rad:24,info:'',search:null,
  // (view: stand-in viewers round the structure shown, so the world dresses it as it would round Gus; box: the part of the
  // world shown, x0,z0,x1,z1; fly: the free-flying camera)
  view:[],liveT:0,dressing:false,box:null,clip:[],dressT:0,fly:{on:false,pos:new V3(),yaw:0,pitch:0,sp:1,t:0,keys:new Set(),V:{active:true,state:'walk',pos:new V3()},at:new V3()}};
const ST_UNDER=new Set(['sewers','subway','metro','caves']);
// (kinds that spread over several blocks side by side; anything else is one block, even with the same next door)
const ST_SPREAD=new Set(['farm','dump','yard','navy','harbor','fishing','truckstop','nursery','cemetery']);
// (kinds the preview lists that aren't switches of their own in a test world: parts or versions of one that is)
const ST_EXTRA={Underground:[['metro','Subway stations']],Coast:[['fishing','Fishing wharves']]};
function stGroups(){return TEST_GROUPS.map(([g,items])=>[g,ST_EXTRA[g]?[...items,...ST_EXTRA[g]]:items]);}
// who the world's dressed for: the players and, while the Structures preview is up, its stand-ins round the structure
// shown (and its flying camera). Lamps, signs, props, doors, rides, animals and boats only appear round a viewer, so
// this is what gives the preview everything the structure has in the real world.
const stLive=()=>ST.dressing||performance.now()-ST.liveT<1000;   // (the preview's open, or it's being dressed now)
function viewers(){const L=[];for(const p of players)if(p.active)L.push(p);if(ST.view.length&&stLive())for(const v of ST.view)L.push(v);return L;}
const stHas=(x,z)=>!!ST.box&&stLive()&&x>=ST.box[0]&&x<ST.box[2]&&z>=ST.box[1]&&z<ST.box[3];
function stName(k){for(const [,items] of stGroups())for(const [kk,n] of items)if(kk===k)return n;return k;}
// where a kind is (in blocks: {ax,az,w,h}), around block (px,pz), or null
function stMatch(key,px,pz){
  const one={ax:px,az:pz,w:1,h:1};
  switch(key){
    case 'wrecks':return abandonedSpots(px,pz).length?one:null;
    case 'wind':return turbineAt(px,pz)?{ax:px-1,az:pz-1,w:3,h:3}:null;
    case 'bunker':return bunkerAt(px,pz)?one:null;
    case 'caves':return caveMouth(px,pz)?{ax:px-1,az:pz-1,w:3,h:3}:null;
    case 'sewers':return sewerStair(px,pz)?one:null;
    case 'subway':case 'metro':return plotType1(px,pz)==='metro'?one:null;
    case 'pylons':case 'billboards':case 'tolls':return null;   // (found along the highways instead: see stFind)
  }
  const S=superOf(px,pz);if(S&&S.kind===key)return {ax:S.ax,az:S.az,w:S.w,h:S.h};
  const M=macroOf1(px,pz);if(M&&M.kind===key&&M.w&&px>=M.ax&&px<M.ax+M.w&&pz>=M.az&&pz<M.az+M.h)return {ax:M.ax,az:M.az,w:M.w,h:M.h};
  const B=bigPlainsAt(px,pz);if(B&&B.kind===key)return {ax:B.ax,az:B.az,w:B.w,h:B.h};
  // (a fishing village's wharf is its own entry, so Docks are the towns' and cities' docks)
  const fishy=(a,b)=>plotInfo(a,b).fish;
  const coastIs=(a,b)=>{const c=coastType(a,b);return c===key&&(key!=='harbor'||!fishy(a,b))||key==='yard'&&c==='basin'||key==='navy'&&c==='nbasin'||key==='fishing'&&c==='harbor'&&fishy(a,b);};
  const ptIs=(a,b)=>plotType1(a,b)===key&&!superOf(a,b);
  const pred=coastIs(px,pz)?coastIs:ptIs(px,pz)?ptIs:null;if(!pred)return null;
  if(!ST_SPREAD.has(key))return one;
  // (a kind that spreads over a few blocks -- a farm, a port, a dump: the run of them joined to this one, up to 6 x 6)
  let x0=px,x1=px,z0=pz,z1=pz;const seen=new Set([px+','+pz]),q=[[px,pz]];
  while(q.length){const [a,b]=q.pop();for(const [dx,dz] of N4){const na=a+dx,nb=b+dz,k=na+','+nb;if(seen.has(k)||Math.abs(na-px)>5||Math.abs(nb-pz)>5)continue;seen.add(k);
    if(!pred(na,nb))continue;if(Math.max(x1,na)-Math.min(x0,na)>5||Math.max(z1,nb)-Math.min(z0,nb)>5)continue;x0=Math.min(x0,na);x1=Math.max(x1,na);z0=Math.min(z0,nb);z1=Math.max(z1,nb);q.push([na,nb]);}}
  return {ax:x0,az:z0,w:x1-x0+1,h:z1-z0+1};
}
// the nearest one to (cx,cz) (blocks), searching outward ring by ring
function stFind(key,cx,cz){
  if(key==='pylons'||key==='billboards'||key==='tolls'){
    const L=routesNearBox(cx*CELL-2500,cz*CELL-2500,cx*CELL+2500,cz*CELL+2500),seen=new Set();let best=null,bd=1e18;
    for(let i=0;i<L.length;i+=2){const R=L[i];if(seen.has(R))continue;seen.add(R);
      const pts=key==='pylons'?pylonsOf(R).filter(Boolean):key==='billboards'?boardsOf(R).filter(Boolean):tollsOf(R).map(s=>rtPoint(R,s));
      for(const P of pts){const d=(P.x-cx*CELL)**2+(P.z-cz*CELL)**2;if(d<bd){bd=d;best=P;}}}
    if(!best)return null;const px=Math.floor(best.x/CELL),pz=Math.floor(best.z/CELL);return {ax:px,az:pz,w:1,h:1,cx:best.x,cz:best.z,span:56};
  }
  return stRings(key,cx,cz,0,stR(key),Infinity).F;
}
const ST_R=150,stR=key=>key==='theme'||key==='fishing'?ST_R*2:ST_R;   // (whole parks and fishing villages are rare enough that one may be further off)
// search rings r0.. outward (stopping once past the time budget): {F, r: the ring to carry on from}
function stRings(key,cx,cz,r0,r1,budget){
  const t0=performance.now();
  for(let r=r0;r<=r1;r++){
    for(let i=-r;i<=r;i++)for(const [px,pz] of (r===0?[[cx,cz]]:Math.abs(i)===r?[[cx+i,cz-r],[cx+i,cz+r]]:[[cx+i,cz-r],[cx+i,cz+r],[cx-r,cz+i],[cx+r,cz+i]])){
      let m=null;try{m=stMatch(key,px,pz);}catch(e){}if(m)return {F:m,r};}
    if(performance.now()-t0>budget)return {F:null,r:r+1};}
  return {F:null,r:r1+1};
}
// the blocks of a box of the world (x0..x1, z0..z1, y0..y1; everything outside it counts as air, so its cut sides show),
// meshed the way the world is: the same faces, shading, ramps, fences and water
function stMeshes(X0,Z0,X1,Z1,Y0,Y1){
  const inB=(x,y,z)=>x>=X0&&x<X1&&z>=Z0&&z<Z1&&y>=Y0&&y<=Y1;
  const at=(x,y,z)=>inB(x,y,z)?get(x,y,z):AIR,opq=(x,y,z)=>{const b=at(x,y,z);return b!==AIR&&!BLOCK[b].transparent;};
  const bufs=[{p:[],u:[],c:[],i:[],k:[]},{p:[],u:[],c:[],i:[],k:[]}];
  for(let cx=Math.floor(X0/CS);cx<=Math.floor((X1-1)/CS);cx++)for(let cz=Math.floor(Z0/CS);cz<=Math.floor((Z1-1)/CS);cz++)chunkArr(cx,cz);
  for(let x=X0;x<X1;x++)for(let z=Z0;z<Z1;z++){
    let top=-1;for(let y=Y1;y>=Y0;y--){const b=get(x,y,z);if(b){top=BLOCK[b].liquid?-1:y;break;}}
    for(let y=Y0;y<=Y1;y++){const b=get(x,y,z);if(!b)continue;const info=BLOCK[b];if(!info)continue;
      const liquid=!!info.liquid,glow=!!info.glow,out=bufs[liquid?1:0];
      if(info.ramp){emitRamp(out,x,y,z,info);continue;}
      if(info.hide)continue;
      if(info.thin){emitFence(out,x,y,z,b,info,at(x-1,y,z),at(x+1,y,z),at(x,y,z-1),at(x,y,z+1),at(x,y+1,z),top===y);continue;}
      const waterTop=liquid&&at(x,y+1,z)!==WATER;
      for(const f of FACES){const [dx,dy,dz]=f.dir,nb=at(x+dx,y+dy,z+dz);if(!faceVisible(b,nb))continue;
        const tile=dy===1?info.tiles[0]:dy===-1?info.tiles[1]:info.tiles[2],tx=tile%AC,ty=Math.floor(tile/AC),n=out.p.length/3,axis=dx?0:dy?1:2,ua=(axis+1)%3,va=(axis+2)%3;
        for(const c of f.c){out.p.push(x+c[0],(waterTop&&c[1]===1)?y+0.88:y+c[1],z+c[2]);out.u.push((tx+0.002+c[3]*0.996)/AC,1-(ty+1)/AR+(0.002+c[4]*0.996)/AR);
          let s;if(glow)s=2;else{s=f.shade*DIM;if(!liquid){const bx=x+dx,by=y+dy,bz=z+dz,du=[0,0,0],dv=[0,0,0];du[ua]=c[ua]?1:-1;dv[va]=c[va]?1:-1;
            const s1=opq(bx+du[0],by+du[1],bz+du[2]),s2=opq(bx+dv[0],by+dv[1],bz+dv[2]),cc=opq(bx+du[0]+dv[0],by+du[1]+dv[1],bz+du[2]+dv[2]);s*=AO[(s1&&s2)?0:3-(s1+s2+cc)];}}
          out.c.push(s,s,s);out.k.push(0);}
        out.i.push(n,n+1,n+2,n+2,n+1,n+3);}}}
  return bufs.map((d,i)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(d.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(d.u,2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(d.c,3));g.setAttribute('aSky',new THREE.Float32BufferAttribute(d.k,1));g.setIndex(d.i);
    const m=new THREE.Mesh(g,i?matWater:matOpaque);if(i)m.renderOrder=1;m.frustumCulled=false;return m;});
}
function stInitGL(){
  if(ST.r)return true;
  try{ST.r=new THREE.WebGLRenderer({canvas:document.getElementById('devStCanvas'),antialias:true});}catch(e){return false;}
  ST.r.setPixelRatio(Math.min(devicePixelRatio||1,2));ST.r.setClearColor(0x141a20);
  const S=ST.scene=new THREE.Scene();
  // (the same orange grid floor as the abilities' preview, lying on the ground)
  {const c=document.createElement('canvas'),T=64,N=8;c.width=c.height=T*N;const x=c.getContext('2d');x.clearRect(0,0,T*N,T*N);
   x.fillStyle='rgba(255,154,42,0.55)';for(let i=0;i<N;i++){x.fillRect(i*T-1,0,3,T*N);x.fillRect(0,i*T-1,T*N,3);}
   x.fillStyle='rgba(255,170,70,0.95)';x.fillRect(0,0,4,T*N);x.fillRect(T*N-4,0,4,T*N);x.fillRect(0,0,T*N,4);x.fillRect(0,T*N-4,T*N,4);
   const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(60,60);tx.anisotropy=ST.r.capabilities.getMaxAnisotropy();
   const fl=new THREE.Mesh(new THREE.PlaneGeometry(480,480),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   fl.rotation.x=-Math.PI/2;fl.position.set(0,G+1+0.02,0);fl.renderOrder=-5;S.add(fl);ST.floor=fl;}
  ST.cam=new THREE.PerspectiveCamera(40,16/9,0.1,2000);
  return true;
}
function stSet(msg){ST.info=msg;const el=document.getElementById('devStInfo');if(el)el.textContent=msg;}
function stSelect(key){
  ST.key=key;stMarkDD();if(!stInitGL()){stSet('3D preview unavailable');return;}
  if(ST.grp){ST.scene.remove(ST.grp);ST.grp.traverse(m=>{if(m.geometry)m.geometry.dispose();});ST.grp=null;}
  ST.view=[];ST.box=null;
  const p=players.find(q=>q.active)||players[0],cx=Math.floor(p.pos.x/CELL),cz=Math.floor(p.pos.z/CELL);
  stSet('Looking for '+stName(key).toLowerCase()+'…');
  // (the highway features are found in one go; everything else is searched for a few rings at a time, in stTick)
  if(key==='pylons'||key==='billboards'||key==='tolls'){ST.search=null;setTimeout(()=>{if(ST.key===key)stShow(key,stFind(key,cx,cz));},30);}
  else ST.search={key,cx,cz,r:0};
}
// stand-ins spread over the box (on the ground, a few dozen blocks apart, as many as it takes up to 24), so all of it
// is dressed, not just round its middle
function stViewers(X0,Z0,X1,Z1){
  const W=X1-X0,D=Z1-Z0;let sp=56;while(Math.ceil(W/sp)*Math.ceil(D/sp)>24)sp+=8;
  const nx=Math.ceil(W/sp),nz=Math.ceil(D/sp),out=[];
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)out.push({active:true,state:'walk',pos:new V3(X0+(i+.5)*W/nx,G+1,Z0+(j+.5)*D/nz)});
  return out;
}
// dress the structure: everything the world puts round a viewer -- lamps, signals, signs, billboards, benches and bins,
// the furniture inside, doors, shop signs, clock towers and the like, rides, animals, boats, trains -- worked out now
// for the preview's viewers (and the game's players, who keep theirs). Drawn into the game's own scene; the preview
// draws that scene's dressing over its own blocks, cut to its box.
function stDress(){
  ST.liveT=performance.now();ST.dressT=0.5;ST.fly.at.copy(ST.fly.V.pos);
  ST.dressing=true;
  try{safe('stDress',()=>{refreshFixtures();refreshBrandSigns();refreshDoors();refreshLandmarks();headLamps();
    venueT=0;updateVenues(0);   // (made, and each put in place, without moving on)
    campFires.t=0;updateLandmarks(0);});}
  finally{ST.dressing=false;}
}
// what of the game's scene is dressing (everything else in it -- the terrain round Gus, the sky, cars, goblins -- isn't
// drawn in the preview)
function stDecoSet(){
  const S=new Set([FIX_BAR,FIX_GLOW,FIX_COL,PROP_L,PROP_G,CR_B,CR_H,PL_B,PL_H,BALL]);
  decoEach(g=>S.add(g));
  for(const B of BAT.values())if(B.deco)S.add(B.m);
  for(const m of bsigns)S.add(m);for(const m of campOn.values())S.add(m);
  return S;
}
function stDrawDeco(C){
  const keep=stDecoSet(),hid=[];
  for(const o of scene.children)if(o.visible&&!o.isLight&&!keep.has(o)){o.visible=false;hid.push(o);}
  // (in daylight, unfogged, like the blocks)
  const fog=scene.fog,bg=scene.background,hI=hemi.intensity,sI=sunLight.intensity,hC=hemi.color.clone(),hG=hemi.groundColor.clone(),sC=sunLight.color.clone(),sP=sunLight.position.clone();
  scene.fog=null;scene.background=null;hemi.intensity=0.75;hemi.color.setHex(0xe8f0e0);hemi.groundColor.setHex(0x40483a);sunLight.intensity=0.6;sunLight.color.setHex(0xffe8cc);sunLight.position.set(0.5,1,0.3);
  ST.r.autoClear=false;ST.r.clippingPlanes=ST.clip;
  try{ST.r.render(scene,C);}
  finally{ST.r.autoClear=true;ST.r.clippingPlanes=[];for(const o of hid)o.visible=true;scene.fog=fog;scene.background=bg;
    hemi.intensity=hI;hemi.color.copy(hC);hemi.groundColor.copy(hG);sunLight.intensity=sI;sunLight.color.copy(sC);sunLight.position.copy(sP);}
}
function stShow(key,F){
  try{
    if(!F){stSet('No '+stName(key).toLowerCase()+' within about '+(stR(key)*CELL).toLocaleString()+' blocks of Gus in this world');return;}
    stSet('Building '+stName(key).toLowerCase()+'…');
    // the box to show: the blocks it covers and a few blocks round them (a highway feature: a square round it)
    let X0=F.ax*CELL-4,Z0=F.az*CELL-4,X1=(F.ax+F.w)*CELL+4,Z1=(F.az+F.h)*CELL+4;
    if(F.span){X0=Math.floor(F.cx-F.span/2);Z0=Math.floor(F.cz-F.span/2);X1=X0+F.span;Z1=Z0+F.span;}
    const under=ST_UNDER.has(key)||key==='mine'||key==='quarry';
    // (underground: the near half cut away, so its tunnels show in section)
    if(ST_UNDER.has(key))Z1=Math.floor((Z0+Z1)/2)+2;
    const Y0=under?Math.max(1,G-34):G,Y1=H-1;
    const ms=stMeshes(X0,Z0,X1,Z1,Y0,Y1);
    // (left where it is in the world, so the world's own dressing lines up with it)
    const grp=new THREE.Group();const mx=(X0+X1)/2,mz=(Z0+Z1)/2;for(const m of ms)grp.add(m);
    ST.scene.add(grp);ST.grp=grp;
    let top=G+1;{const pa=ms[0].geometry.attributes.position.array;for(let i=1;i<pa.length;i+=3)if(pa[i]>top)top=pa[i];}
    ST.rad=Math.max(X1-X0,Z1-Z0,(top-G)*1.2)*0.62;ST.c.set(mx,ST_UNDER.has(key)?G-6:G+1+Math.min(top-G-1,ST.rad)*0.3,mz);ST.zoom=1;
    ST.floor.visible=!ST_UNDER.has(key);ST.floor.position.set(Math.round(mx),G+1+0.02,Math.round(mz));
    ST.box=[X0,Z0,X1,Z1];
    ST.clip=[new THREE.Plane(new V3(1,0,0),-X0),new THREE.Plane(new V3(-1,0,0),X1),new THREE.Plane(new V3(0,0,1),-Z0),new THREE.Plane(new V3(0,0,-1),Z1)];
    ST.view=stViewers(X0,Z0,X1,Z1);
    if(ST.fly.on){stOrbitCam();stFlyFrom(ST.cam);ST.view.push(ST.fly.V);}
    stDress();
    stSet(stName(key)+' · at '+Math.round(mx)+', '+Math.round(mz)+' · '+(X1-X0)+' × '+(Z1-Z0)+' blocks'+(ST_UNDER.has(key)?' · cut away to show it underground':''));
  }catch(e){stSet('Could not build the preview: '+e.message);}
}
// the turntable camera: round the structure's middle, at the yaw, pitch and zoom you've set
function stOrbitCam(){const C=ST.cam,c=ST.c,d=ST.rad*2.2*ST.zoom;C.position.set(c.x+Math.sin(ST.yaw)*Math.cos(ST.pitch)*d,c.y+Math.sin(ST.pitch)*d,c.z+Math.cos(ST.yaw)*Math.cos(ST.pitch)*d);C.lookAt(c.x,c.y,c.z);}
// ---- flying through the preview: a free camera that goes through anything (W A S D, up and down, drag to look) ----
const ST_FLYKEYS=new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','KeyC','Space','ShiftLeft','ShiftRight','ControlLeft','ControlRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
// (start where the camera is, looking the way it looks)
function stFlyFrom(C){const F=ST.fly,c=ST.c,dx=c.x-C.position.x,dy=c.y-C.position.y,dz=c.z-C.position.z;F.pos.copy(C.position);F.yaw=Math.atan2(-dx,-dz);F.pitch=Math.atan2(dy,Math.hypot(dx,dz));F.V.pos.copy(F.pos);}
function stFlyHint(){const h=document.getElementById('devStHint'),b=document.getElementById('devStFly'),on=ST.fly.on;
  if(h)h.textContent=on?'W A S D to fly · E / Space up · Q / C down · Shift faster · drag to look · scroll for speed · Esc to land':'drag to turn · scroll to zoom';
  if(b){b.setAttribute('aria-pressed',String(on));b.textContent=on?'Land':'Fly';b.classList.toggle('on',on);}}
function stFlySet(on){
  const F=ST.fly;if(F.on===on)return;F.on=on;F.keys.clear();
  if(on){stOrbitCam();stFlyFrom(ST.cam);if(ST.box)ST.view.push(F.V);const cv=document.getElementById('devStCanvas');if(cv&&cv.focus)cv.focus({preventScroll:true});}
  else{ST.view=ST.view.filter(v=>v!==F.V);if(ST.box)stDress();}
  stFlyHint();
}
function stFlyMove(dt){
  const F=ST.fly,K=F.keys,k=c=>K.has(c)?1:0;
  const mz=k('KeyW')+k('ArrowUp')-k('KeyS')-k('ArrowDown'),mx=k('KeyD')+k('ArrowRight')-k('KeyA')-k('ArrowLeft'),up=k('KeyE')+k('Space')-k('KeyQ')-k('KeyC')-k('ControlLeft')-k('ControlRight');
  const sp=(K.has('ShiftLeft')||K.has('ShiftRight')?60:16)*F.sp*dt,cy=Math.cos(F.yaw),sy=Math.sin(F.yaw),cp=Math.cos(F.pitch),spp=Math.sin(F.pitch);
  // (forward goes where you look, pitch and all; sideways and up stay level and straight up)
  F.pos.x+=(-sy*cp*mz+cy*mx)*sp;F.pos.y+=(spp*mz+up)*sp;F.pos.z+=(-cy*cp*mz-sy*mx)*sp;
  F.pos.y=Math.max(1,Math.min(H+120,F.pos.y));F.V.pos.copy(F.pos);
}
function stTick(dt){
  const sec=document.getElementById('devSecStruct');if(!sec||!sec.open){if(ST.fly.on)stFlySet(false);return;}
  if(!ST.key){stBuildList();stSelect(stGroups()[0][1][0][0]);return;}
  if(!ST.r)return;
  if(ST.search){const S=ST.search,R=stRings(S.key,S.cx,S.cz,S.r,stR(S.key),12);S.r=R.r;
    if(R.F||S.r>stR(S.key)){ST.search=null;const F=R.F;setTimeout(()=>{if(ST.key===S.key)stShow(S.key,F);},20);}
    else stSet('Looking for '+stName(S.key).toLowerCase()+'… ('+Math.round(S.r*CELL).toLocaleString()+' blocks out)');}
  if(ST.view.length)ST.liveT=performance.now();   // (keeps the stand-ins counted while the preview's open)
  // (flying keeps to real time, so a slow frame doesn't slow you down)
  if(ST.fly.on){const t=performance.now();stFlyMove(Math.min(0.25,Math.max(0,(t-(ST.fly.t||t))/1000)));ST.fly.t=t;}else ST.fly.t=0;
  // (flying, the furniture, doors and the rest follow the camera round, the way they follow Gus: worked out again
  // when it's moved a few blocks, at most twice a second)
  if(ST.box&&ST.fly.on){ST.dressT-=dt;if(ST.dressT<=0&&ST.fly.at.distanceTo(ST.fly.V.pos)>4)stDress();}
  const cv=ST.r.domElement,w=cv.clientWidth|0,h=cv.clientHeight|0;if(w<10||h<10)return;
  if(cv.width!==Math.round(w*ST.r.getPixelRatio())||cv.height!==Math.round(h*ST.r.getPixelRatio()))ST.r.setSize(w,h,false);
  const C=ST.cam;C.aspect=w/h;C.updateProjectionMatrix();
  ST.floor.visible=!ST.fly.on&&!ST_UNDER.has(ST.key);   // (the grid's a turntable's floor: flying, it would lie over every floor inside)
  if(ST.fly.on){C.position.copy(ST.fly.pos);C.rotation.set(ST.fly.pitch,ST.fly.yaw,0,'YXZ');}
  else{if(!ST.drag)ST.yaw+=dt*0.12;stOrbitCam();}   // (turning slowly by itself, until you take hold of it)
  // (drawn flat and in daylight)
  const L0=WORLD_LIGHT.value.clone(),cu=CURVE_U.value;WORLD_LIGHT.value.setRGB(1,1,1);CURVE_U.value=0;
  try{ST.r.render(ST.scene,C);if(ST.box)stDrawDeco(C);}finally{WORLD_LIGHT.value.copy(L0);CURVE_U.value=cu;}
}
function stBuildList(){const list=document.getElementById('devStList');if(!list||list.childElementCount)return;
  list.innerHTML=stGroups().map(([g,items])=>'<li class="grp" aria-disabled="true">'+glEsc(g)+'</li>'+items.map(([k,n])=>'<li role="option" data-k="'+k+'">'+glEsc(n)+'</li>').join('')).join('');stMarkDD();}
function stMarkDD(){const dd=document.getElementById('devStDD');if(!dd)return;dd.querySelector('button').textContent=ST.key?stName(ST.key):'Structure';
  for(const li of dd.querySelectorAll('li[data-k]'))li.classList.toggle('on',li.dataset.k===ST.key);}
{
  const list=document.getElementById('devStList'),dd=document.getElementById('devStDD');
  if(list&&dd){
    // (the list's filled in the first time it's needed: the kinds are only all defined further down)
    const ddb=dd.querySelector('button'),open=v=>{stBuildList();list.hidden=!v;ddb.setAttribute('aria-expanded',String(v));};
    ddb.addEventListener('click',()=>open(list.hidden));
    list.addEventListener('click',e=>{const li=e.target.closest('li[data-k]');if(li){open(false);stSelect(li.dataset.k);}});
    document.addEventListener('pointerdown',e=>{if(!list.hidden&&!dd.contains(e.target))open(false);});
    const cv=document.getElementById('devStCanvas');
    cv.addEventListener('pointerdown',e=>{ST.drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);});
    // (dragging turns the structure round, or, flying, turns your head)
    cv.addEventListener('pointermove',e=>{if(!ST.drag)return;const dx=e.clientX-ST.drag.x,dy=e.clientY-ST.drag.y;ST.drag={x:e.clientX,y:e.clientY};
      if(ST.fly.on){ST.fly.yaw-=dx*0.005;ST.fly.pitch=Math.max(-1.5,Math.min(1.5,ST.fly.pitch-dy*0.005));return;}
      ST.yaw-=dx*0.01;ST.pitch=Math.max(0.05,Math.min(1.45,ST.pitch+dy*0.01));});
    cv.addEventListener('pointerup',()=>{ST.drag=null;});cv.addEventListener('pointercancel',()=>{ST.drag=null;});
    // (scrolling zooms, or, flying, sets how fast you go)
    cv.addEventListener('wheel',e=>{e.preventDefault();const k=Math.pow(1.0015,e.deltaY);if(ST.fly.on)ST.fly.sp=Math.max(0.1,Math.min(8,ST.fly.sp/k));else ST.zoom=Math.max(0.1,Math.min(4,ST.zoom*k));},{passive:false});
    const fb=document.getElementById('devStFly');if(fb)fb.addEventListener('click',()=>stFlySet(!ST.fly.on));
    // the flying keys, ahead of the menu's own (which would move round the menu, or close it on Esc)
    const flying=()=>ST.fly.on&&menuOpen&&curTab==='dev'&&cv.getClientRects().length>0;
    const typing=t=>t&&(t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.tagName==='INPUT');
    window.addEventListener('keydown',e=>{if(!flying()||typing(e.target))return;
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();stFlySet(false);return;}
      if(!ST_FLYKEYS.has(e.code))return;e.preventDefault();e.stopImmediatePropagation();ST.fly.keys.add(e.code);},true);
    window.addEventListener('keyup',e=>{if(!ST.fly.keys.has(e.code))return;ST.fly.keys.delete(e.code);if(flying()){e.preventDefault();e.stopImmediatePropagation();}},true);
    window.addEventListener('blur',()=>ST.fly.keys.clear());
  }
}
