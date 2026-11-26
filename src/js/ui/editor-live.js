// ---- the editor's live preview (tools/editor/): the game opened with ?editor takes edited weapons, animations, props
// and street fixtures from
// the editor's window as they're made, before anything's saved or built. Nothing here runs without ?editor ----
// The editor opens this page itself (its Open game button), so the two share an origin; a message from anywhere else is
// ignored. An animation is swapped into STRIKES at once (everything reads it afresh each frame). A weapon's numbers are
// put into its entry in place (GOB_WPN and everything else keep the same objects), and its looks reach Gnash's and
// Grizzle's own models, rebuilt on the next frame, and new pickups; goblins already out keep the models they were made
// with until the page is reloaded.
const EDITOR_LIVE=typeof location!=='undefined'&&/[?&]editor\b/.test(location.search||'');
// (put src's fields into dst, keeping dst and any plain object in it the same object, dropping what src hasn't got)
function liveInPlace(dst,src){
  for(const k of Object.keys(dst))if(!(k in src))delete dst[k];
  for(const k in src){const a=dst[k],b=src[k];
    if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))liveInPlace(a,b);else dst[k]=b;}
}
function liveWeapon(k,file){
  if(!WEAPONS[k])return 'no weapon '+k+' in this build: save it and press Build';
  const W=assetWeapon(file);wpnDerive(k,W);liveInPlace(WEAPONS[k],W);
  for(const p of players)if(p.gb){scene.remove(p.gb.root);scene.remove(p.gb.vm);p.gb=null;}   // (gobKit makes them again, with the new shapes)
  for(let i=PICKUPS.length-1;i>=0;i--){const P=PICKUPS[i];if(P.k===k&&!P.live){scene.remove(P.m);PICKUPS.splice(i,1);}}
  return 'ok';
}
function liveClip(name,file){if(file.layout==='hippo')HCLIP[name]=assetClip(file);else if(file.layout==='rider'){const f=Object.assign({},file);delete f.note;ASSETS.clips[name]=f;}else STRIKES[name]=assetClip(file);return 'ok';}   // (a hippo's: move.js reads HCLIP; a rider's: light-vehicles.js reads it from ASSETS)
// (a light vehicle's model: every one of that kind built again from it, there and then)
function liveVeh(name,file){if(!VEH[name])return 'no vehicle '+name+' in this build';const f=Object.assign({},file);delete f.note;ASSETS.vehicles[name]=f;
  for(const c of cars){const G=c.vehG[name];if(!G)continue;c.g.remove(G.g);delete c.vehG[name];if(c.veh===name)setVeh(c,name);}return 'ok';}
// (a body's hurtboxes are read from ASSETS each time a blow is tested: hit-shapes.js)
// (a grip is read by gunGrip each time a goblin with a gun is drawn: grip.js)
function liveGrip(name,file){const f=Object.assign({},file);delete f.note;GUN_GRIP[name]=f;return 'ok';}
function liveBody(name,file){ASSETS.bodies=ASSETS.bodies||{};const f=Object.assign({},file);delete f.note;ASSETS.bodies[name]=f;return 'ok';}
// (a prop or a fixture: its boxes swapped into the table, and the street's dressing drawn again on the next frame. A new
// one has nothing placing it till the game's built again)
function liveProp(name,file){if(!PROPS[name])return 'no prop '+name+' in this build: save it and press Build';const M=assetProp(file);propUnfight(M);PROPS[name]=M;trafficRefreshT=0;return 'ok';}
function liveFix(name,file){if(!FIXM[name])return 'no fixture '+name+' in this build';FIXM[name]=assetFix(file);trafficRefreshT=0;return 'ok';}
// (a hippo's move: its numbers into AB in place, its own hitboxes into HB; the next use of it goes by them)
function liveMove(k,file){
  if(!AB[k])return 'no move '+k+' in this build';
  const D=assetMove(k,file),i=DEV_ABIL.findIndex(o=>o.k===k);if(i>=0)DEV_ABIL[i]=D;
  const A={};for(const [pk,,v] of D.ps)A[pk]=v;if(D.blk){A.shape=D.blk[0];A.size=D.blk[1];}liveInPlace(AB[k],A);
  const H=file.hitboxes;if(H&&H.boxes)HB[k]={on:!!H.on,boxes:H.boxes.map(b=>Object.assign({},b))};else delete HB[k];
  return 'ok';
}
// ---- the editor's Hippo tab asks for a move acted out (devSimulate) and gets back: the model once (every part: its
// name, parent and box), each part's place, turn, size and whether it shows on every frame, where he stood, and the hit
// volumes as lines (the debug overlay's shapes), each with the frames it's up and which of the move's own hitboxes made
// it. Everything is measured from the sandbox's middle (DEV_O). ----
function liveModel(F){
  return F.nodes.map(o=>{const q={n:o.name||'',p:F.nodes.indexOf(o.parent)};
    if(o.isMesh&&o.geometry&&o.geometry.parameters){const g=o.geometry.parameters;q.g=[g.width,g.height,g.depth];q.c=o.material.color.getHex();}
    return q;});
}
function liveHitLines(h){
  const L=[],S={seg(ax,ay,az,bx,by,bz){L.push(ax-DEV_O.x,ay,az-DEV_O.z,bx-DEV_O.x,by,bz-DEV_O.z);},geo2(g,M){const a=g.attributes.position,v=new THREE.Vector3(),w=new THREE.Vector3();
    for(let i=0;i+1<a.count;i+=2){v.fromBufferAttribute(a,i).applyMatrix4(M);w.fromBufferAttribute(a,i+1).applyMatrix4(M);this.seg(v.x,v.y,v.z,w.x,w.y,w.z);}}};
  devDraw(h.kind==='block'?'block':'dmg',h.shape,h.o,{},{lb:S,pool:{},scene:{add(){}}},{x:0,z:0});
  return new Float32Array(L);
}
function liveRecord(k,ch){
  const R=devSimulate(k,ch||'gus'),F=DEVP.figs[R.fig],M=R.M,FL=11;
  for(let f=0;f<R.N;f++){const b=f*M*FL;R.tr[b]-=DEV_O.x;R.tr[b+2]-=DEV_O.z;}   // (the root: where he is)
  const rel=o=>{const q=Object.assign({},o);if(q.x!==undefined)q.x-=DEV_O.x;if(q.z!==undefined)q.z-=DEV_O.z;return q;};
  const hits=R.hits.map(h=>({f:h.f,until:h.until,kind:h.kind==='block'?'block':'dmg',src:h.src,shape:h.shape,o:rel(h.o),L:liveHitLines(h),
    cells:h.cells?Array.from(h.cells,(v,i)=>i%3===0?v-DEV_O.x:i%3===2?v-DEV_O.z:v):null}));
  return{key:k,N:R.N,M,model:liveModel(F),tr:R.tr,pos:R.pos,hits,anchors:R.anchors.filter(a=>a.k===k).map(a=>a.f),bones:RIG_NAMES,hurt:R.hurt,c:R.c,rad:R.rad,G};
}
// ---- the editor's Structures tab: what the game can tell it (every kind of site, the blocks and how they look), a site
// captured from the world as the plan builds it (its blocks, furniture, people and parked vehicles), and an edited site
// built in place at once ----
const BLOCK_NAMES='AIR,GRASS,DIRT,STONE,LOG,LEAVES,SAND,PLANKS,GLASS,WATER,COBBLE,BRICK,ASPHALT,LINE,LINEX,SIDEWALK,CONCRETE,MOSSCON,METAL,RUST,WIN_BLUE,WIN_GREEN,WIN_WARM,ROOF,NEON_G,NEON_M,LAMP,MOSSSTONE,SHELF,BED,SOFA,SCREEN,CRATE,AWN_R,AWN_G,FLOWER,POLICE,NEON_B,NEON_R,GRAVEL,FLOORT,FRIDGE,LINE_R,LINEX_R,CROSS,CROSSX,HOSPW,HOSPX,PUMP,SHINGLE,SIDING,SIDING_Y'.split(',')
  .concat([],'SEAT_B,SEAT_R,FIELD,FIELD_L,LANE,LANEX,CLAY,DEEPSLATE,BEDROCK,COAL,CRYSTAL,CHECKER,PAINT_BLUE,PAINT_RED,PAINT_GREEN,PAINT_ORANGE,PAINT_YELLOW,PAINT_WHITE,PAINT_NAVY,STUCCO,PAINT_DARK,NEON_Y,NEON_O,ICE'.split(','));
// (a block's name for the palette: the plain ones from the list above, the ramps, stairs and the rest worked out)
function liveBlockName(i){
  const DIRS=['+x','-x','+z','-z'];
  if(WET[i]&&i!==WATER)return 'Water '+BLOCK[i].lvl+'/8 deep';
  if(i>=RAMP0&&i<RAMP0+12)return 'Ramp '+DIRS[Math.floor((i-RAMP0)/3)]+['',' low half',' high half'][(i-RAMP0)%3];
  if(i>=RAMPL0&&i<RAMPL0+36){const j=i-RAMPL0;return 'Road ramp '+['yellow','white edge','dashed'][Math.floor(j/12)]+' '+DIRS[Math.floor(j%12/3)]+['',' low half',' high half'][j%3];}
  if(i>=STAIR0&&i<STAIR0+12)return ['Concrete','Steel','Wood'][Math.floor((i-STAIR0)/4)]+' stairs '+DIRS[(i-STAIR0)%4];
  const T={[DOOR_W]:'DOOR_WOOD',[DOOR_WK]:'DOOR_WOOD_DARK',[DOOR_G]:'DOOR_GLASS',[DOOR_GB]:'DOOR_GLASS_BLUE',[DOOR_BARN]:'DOOR_BARN',[FENCE]:'FENCE',[FENCE_W]:'FENCE_WOOD',[MARBLE]:'MARBLE',[BRONZE]:'BRONZE',
    [COURT]:'COURT',[COURT_L]:'COURT_LINE',[CHAINLINK]:'CHAINLINK',[GRAVE]:'GRAVE',[GRAVEX]:'GRAVE_CROSS',[STAINED]:'STAINED_GLASS',[GOLD]:'GOLD',[RAILPOST]:'RAIL_POST'};
  let n=T[i]||(i<RAMP0?BLOCK_NAMES[i]:BLOCK_NAMES[i-12]);if(!n)return 'Block '+i;
  n=n.replace(/_/g,' ').toLowerCase();return n[0].toUpperCase()+n.slice(1);
}
function liveSiteInfo(){
  const blocks=[];for(let i=0;i<BLOCK.length;i++){const B=BLOCK[i];if(!B&&i)continue;
    blocks.push(i?{i,n:liveBlockName(i),t:B.tiles,tr:!!B.transparent,lq:!!B.liquid,gl:!!B.glow,thin:B.thin||0,ramp:B.ramp?[B.ramp.dir,B.ramp.h0,B.ramp.h1]:null,stair:!!B.stair,hide:!!B.hide}:{i:0,n:'Air'});}
  const kinds=stGroups().map(([g,items])=>[g,items.filter(([k])=>!['pylons','billboards','tolls'].includes(k))]).filter(([,items])=>items.length);
  return {kinds,blocks,atlas:atlas.toDataURL?atlas.toDataURL():'',T,AC,AR,props:PROPS,veh:Object.keys(VEH).map(k=>[k,VEH[k].hx||1,VEH[k].hy||1.6,VEH[k].hz||2]),foes:Object.keys(FOES).map(k=>[k,FOES[k].name||k]),G,CELL,PL0,PW,seed};
}
// the n-th one of a kind nearest to player one (counting outward, plot by plot)
function liveSiteFind(kind,n){
  const P=players.find(p=>p.active)||players[0],cx=Math.floor(P.pos.x/CELL),cz=Math.floor(P.pos.z/CELL),seen=new Set(),t0=performance.now();
  for(let r=0;r<=stR(kind);r++){
    for(let i=-r;i<=r;i++)for(const [px,pz] of (r===0?[[cx,cz]]:Math.abs(i)===r?[[cx+i,cz-r],[cx+i,cz+r]]:[[cx+i,cz-r],[cx+i,cz+r],[cx-r,cz+i],[cx+r,cz+i]])){
      let m=null;try{m=stMatch(kind,px,pz);}catch(e){}if(!m)continue;const k=m.ax+','+m.az;if(seen.has(k))continue;seen.add(k);if(seen.size>n)return m;}
    if(performance.now()-t0>20000)break;}
  return null;
}
// (nature's own blocks, and the ore deep down: a site keeps everything from the lowest height anything else is found at,
// and at least a few blocks under the ground)
const SITE_NATURAL=new Set([AIR,GRASS,DIRT,STONE,SAND,WATER,GRAVEL,CLAY,DEEPSLATE,BEDROCK,COAL,CRYSTAL,ICE,PACKICE]);
function liveSiteCapture(kind,n){
  const m=liveSiteFind(kind,n|0);if(!m)return {error:'There is none of these near enough in this world'};
  const X0=m.ax*CELL+PL0,Z0=m.az*CELL+PL0,NX=(m.w-1)*CELL+PW,NZ=(m.h-1)*CELL+PW,C=new Map();
  // (as the plan builds it: nothing smashed or fallen, and no site from the editor in its place)
  const keep=new Map(SITES),real=collapses;SITES.clear();siteC.clear();siteI.clear();collapses={};TR.raw++;
  try{for(let cx=Math.floor(X0/CS);cx<=Math.floor((X0+NX-1)/CS);cx++)for(let cz=Math.floor(Z0/CS);cz<=Math.floor((Z0+NZ-1)/CS);cz++)C.set(cx+','+cz,genChunk(cx,cz));}
  finally{TR.raw--;collapses=real;for(const [k,v] of keep)SITES.set(k,v);siteC.clear();siteI.clear();}
  const at=(x,y,z)=>{const cx=Math.floor(x/CS),cz=Math.floor(z/CS);return C.get(cx+','+cz)[li(x-cx*CS,y,z-cz*CS)];};
  let lo=H,hi=0;
  for(let u=0;u<NX;u++)for(let v=0;v<NZ;v++)for(let y=1;y<H;y++){const b=at(X0+u,y,Z0+v);if(b!==AIR&&y>hi)hi=y;if(!SITE_NATURAL.has(b)&&!(y<G-6&&(b===RUST||b===GOLD))&&y<lo)lo=y;}
  const y0=Math.max(1,Math.min(G-3,lo-1)),NY=Math.max(1,hi-y0+1),A=new Uint8Array(NX*NY*NZ);
  for(let v=0;v<NZ;v++)for(let u=0;u<NX;u++){const b0=(v*NX+u)*NY;for(let y=0;y<NY;y++)A[b0+y]=at(X0+u,y0+y,Z0+v);}
  const r2=x=>Math.round(x*100)/100,inLot=(x,z)=>x>=X0&&x<X0+NX&&z>=Z0&&z<Z0+NZ,yaw=y=>r2(((y||0)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);
  // its furniture: what the game would set out, every floor of every building, and outdoors
  const props=[],pk=new Set(),addP=f=>{if(!f||!f.prop||!PROPS[f.type]||!inLot(f.x,f.z)||pk.has(f.key))return;pk.add(f.key);
    const q={m:f.type,p:[r2(f.x-X0),r2(f.y0),r2(f.z-Z0)],yaw:yaw(f.yaw)};if(f.tint!=null&&PROPS[f.type].some(b=>b[0]===PT))q.tint=f.tint;props.push(q);};
  const plots=new Set();
  for(let px=m.ax;px<m.ax+m.w;px++)for(let pz=m.az;pz<m.az+m.h;pz++){const S=superOf(px,pz),ax=S?S.ax:px,az=S?S.az:pz,k=ax+','+az;if(plots.has(k))continue;plots.add(k);
    const P=plotInfo(ax,az);
    try{if(siteKind(px,pz))for(const f of siteProps(plotInfo(px,pz),px,pz))addP(f);}catch(e){}
    try{if(COAST_PROPS.has(P.type))for(const f of coastProps(P,ax,az))if(!f.snap)addP(f);}catch(e){}
    try{if(P.patio)for(const f of patioProps(P,ax,az))addP(f);if(S&&S.kind==='stadium')for(const f of stadiumProps(S))addP(f);}catch(e){}
    for(const b of P.b){const ward=b.kind==='ward';
      for(let n2=0;n2<40;n2++){const fy=n2===0?G+1:G+b.gf+1+FH*(n2-1);if(fy>Math.min(b.detailTop,b.top-1)-2)break;try{for(const f of roomProps(b,ax,az,n2,ward))addP(f);}catch(e){}}}}
  // its people: a compound's at their posts
  const people=[],B=bigPlainsAt(m.ax,m.az);
  if(B&&FIG_STYLE[B.kind])for(const [u,v,y] of sitePeople(B)){const x=B.ax*CELL+u+0.5,z=B.az*CELL+v+0.5;if(inLot(x,z))people.push({k:FIG_STYLE[B.kind].foe,p:[r2(x-X0),y,r2(z-Z0)],yaw:0});}
  // its parked vehicles
  const cars=[];for(let px=m.ax;px<m.ax+m.w;px++)for(let pz=m.az;pz<m.az+m.h;pz++)for(const o of parkSpots0(px,pz))if(inLot(o.x,o.z)&&(!o.veh||VEH[o.veh]))cars.push({k:o.veh||'car',p:[r2(o.x-X0),o.y,r2(o.z-Z0)],yaw:yaw(o.h)});
  return {file:{name:stName(kind),kind,w:m.w,h:m.h,face:siteFace(m),on:false,y0,size:[NX,NY,NZ],rows:assetSiteEncode(A,[NX,NY,NZ]),props,people,cars},
    at:[m.ax,m.az],n:n|0};
}
// an edited site, built at once wherever its kind is loaded (and its people and furniture again)
function liveSite(name,file){
  ASSETS.sites=ASSETS.sites||{};const was=ASSETS.sites[name];
  const f=Object.assign({},file);delete f.note;ASSETS.sites[name]=f;sitesLoad();
  const kinds=new Set([file.kind]);if(was)kinds.add(was.kind);
  for(const [k,V] of venues)if(V.kind==='siteppl'){for(const g of V.slots)if(g){g.state='wait';g.root.visible=false;if(g.homeV===V)g.homeV=null;g.vendor=null;}venues.delete(k);}
  const redo=[];for(const k of chunks.keys()){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cx>=SHIP_CX0)continue;const px=Math.floor(cx*CS/CELL),pz=Math.floor(cz*CS/CELL);
    for(const kd of kinds){let m=null;try{m=stMatch(kd,px,pz);}catch(e){}if(m){redo.push([k,cx,cz]);break;}}}
  for(const [k] of redo){chunks.delete(k);gfxRecC.delete(k);}lastK=-1;
  for(const [k,cx,cz] of redo)if(meshes.has(k))buildChunk(cx,cz);
  farDirty=true;trafficRefreshT=0;venueT=0;
  return 'ok';
}
if(EDITOR_LIVE){
  addEventListener('message',e=>{
    if(e.origin!==location.origin)return;const d=e.data;
    if(d&&d.type==='gsg-rec'){let r;try{r=liveRecord(d.key,d.ch);}catch(err){r={error:String(err&&err.message||err)};}
      try{e.source&&e.source.postMessage({type:'gsg-rec-done',id:d.id,rec:r},location.origin);}catch(err){}return;}
    if(d&&(d.type==='gsg-site-info'||d.type==='gsg-site-cap')){let r;try{r=d.type==='gsg-site-info'?liveSiteInfo():liveSiteCapture(d.kind,d.n);}catch(err){r={error:String(err&&err.message||err)};}
      try{e.source&&e.source.postMessage({type:d.type+'-done',id:d.id,res:r},location.origin);}catch(err){}return;}
    if(!d||d.type!=='gsg-asset')return;
    let r;try{r=d.kind==='weapons'?liveWeapon(d.name,d.file):d.kind==='clips'?liveClip(d.name,d.file):d.kind==='bodies'?liveBody(d.name,d.file):d.kind==='grips'?liveGrip(d.name,d.file):d.kind==='props'?liveProp(d.name,d.file):d.kind==='vehicles'?liveVeh(d.name,d.file):d.kind==='fixtures'?liveFix(d.name,d.file):d.kind==='moves'?liveMove(d.name,d.file):d.kind==='sites'?liveSite(d.name,d.file):'unknown kind';}catch(err){r=String(err&&err.message||err);}
    try{e.source&&e.source.postMessage({type:'gsg-asset-done',kind:d.kind,name:d.name,result:r},location.origin);}catch(err){}
  });
  // (tell the editor this window is ready for its edits)
  try{if(window.opener)window.opener.postMessage({type:'gsg-ready'},location.origin);}catch(e){}
  try{if(window.parent!==window)window.parent.postMessage({type:'gsg-ready',frame:true},location.origin);}catch(e){}   // (the Hippo tab's hidden copy)
}
