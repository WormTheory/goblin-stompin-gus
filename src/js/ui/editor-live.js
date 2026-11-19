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
if(EDITOR_LIVE){
  addEventListener('message',e=>{
    if(e.origin!==location.origin)return;const d=e.data;if(!d||d.type!=='gsg-asset')return;
    let r;try{r=d.kind==='weapons'?liveWeapon(d.name,d.file):d.kind==='clips'?liveClip(d.name,d.file):d.kind==='bodies'?liveBody(d.name,d.file):d.kind==='grips'?liveGrip(d.name,d.file):d.kind==='props'?liveProp(d.name,d.file):d.kind==='fixtures'?liveFix(d.name,d.file):'unknown kind';}catch(err){r=String(err&&err.message||err);}
    try{e.source&&e.source.postMessage({type:'gsg-asset-done',kind:d.kind,name:d.name,result:r},location.origin);}catch(err){}
  });
  // (tell the editor this window is ready for its edits)
  try{if(window.opener)window.opener.postMessage({type:'gsg-ready'},location.origin);}catch(e){}
}
