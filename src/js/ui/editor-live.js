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
function liveClip(name,file){STRIKES[name]=assetClip(file);return 'ok';}
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
if(EDITOR_LIVE){
  addEventListener('message',e=>{
    if(e.origin!==location.origin)return;const d=e.data;
    if(d&&d.type==='gsg-rec'){let r;try{r=liveRecord(d.key,d.ch);}catch(err){r={error:String(err&&err.message||err)};}
      try{e.source&&e.source.postMessage({type:'gsg-rec-done',id:d.id,rec:r},location.origin);}catch(err){}return;}
    if(!d||d.type!=='gsg-asset')return;
    let r;try{r=d.kind==='weapons'?liveWeapon(d.name,d.file):d.kind==='clips'?liveClip(d.name,d.file):d.kind==='bodies'?liveBody(d.name,d.file):d.kind==='grips'?liveGrip(d.name,d.file):d.kind==='props'?liveProp(d.name,d.file):d.kind==='fixtures'?liveFix(d.name,d.file):d.kind==='moves'?liveMove(d.name,d.file):'unknown kind';}catch(err){r=String(err&&err.message||err);}
    try{e.source&&e.source.postMessage({type:'gsg-asset-done',kind:d.kind,name:d.name,result:r},location.origin);}catch(err){}
  });
  // (tell the editor this window is ready for its edits)
  try{if(window.opener)window.opener.postMessage({type:'gsg-ready'},location.origin);}catch(e){}
  try{if(window.parent!==window)window.parent.postMessage({type:'gsg-ready',frame:true},location.origin);}catch(e){}   // (the Hippo tab's hidden copy)
}
