// ---- Gus Editor: models and animations, saved as the JSON files in src/assets/ that the game is built from ----
// One page, three panes: the asset browser (left), the 3D view with the timeline under it (middle) and the inspector
// (right). It reads and writes the files through tools/editor/serve.py, and builds every model and animation with
// src/js/core/assets.js, the same code the game uses as it loads, so what it shows is what the game will have.
// An open file is a doc: {kind, name, data (the file as an object), saved (its text as last read or saved), stamp (the
// server's, to catch a file changed on disk), undo, redo}. Every edit goes through edit(), which keeps undo and tells
// the live game.
'use strict';
const $=id=>document.getElementById(id);
const S={tab:'models',kind:null,name:null,wl:'held',sel:-1,ctx:true,insp:'box',hsel:-1,t:0,playing:false,speed:1,loop:true,kSel:-1,autoKey:true,
  snap:0.01,mode:'translate',game:null,gameOk:false,list:{weapons:[],clips:[],bodies:[]},search:'',previewW:null,fp:true};
const DOCS=new Map();
const key=(k,n)=>k+'/'+n;
const doc=()=>S.kind?DOCS.get(key(S.kind,S.name)):null;
const r4=v=>Math.round(v*1e4)/1e4;
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---- talking to serve.py ----
async function api(path,body){
  const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
  let j={};try{j=await r.json();}catch(e){}
  if(!r.ok){const e=new Error(j.error||('server said '+r.status));e.status=r.status;e.body=j;throw e;}
  return j;
}
function status(t,bad){const s=$('status');s.textContent=t;s.className=bad?'bad':'';s.title=t;}
async function loadDoc(kind,name){
  const k=key(kind,name);if(DOCS.has(k))return DOCS.get(k);
  const j=await api('/api/read?kind='+kind+'&name='+encodeURIComponent(name));
  const d={kind,name,data:JSON.parse(j.text),saved:j.text,stamp:j.stamp,undo:[],redo:[]};DOCS.set(k,d);return d;
}
const dirty=d=>assetFmt(d.data)!==d.saved;

// ---- editing: every change goes through here ----
// f changes d.data; what it was before goes on the undo stack (a run of changes from one drag counts as one: merge)
let mergeTag=null;
function edit(f,merge){
  const d=doc();if(!d)return;
  if(!(merge&&mergeTag===merge)){d.undo.push(JSON.stringify(d.data));if(d.undo.length>300)d.undo.shift();d.redo.length=0;}
  mergeTag=merge||null;f(d.data);changed();
}
function undo(redo){const d=doc();if(!d)return;const from=redo?d.redo:d.undo,to=redo?d.undo:d.redo;if(!from.length)return;
  to.push(JSON.stringify(d.data));d.data=JSON.parse(from.pop());mergeTag=null;changed(true);}
let liveT=0;
function changed(full){
  const d=doc();
  if(d&&d.kind==='weapons')WDATA[d.name]=d.data;
  renderList();rebuild();if(full)renderInsp();else refreshInsp();drawTL();
  clearTimeout(liveT);liveT=setTimeout(()=>sendLive(d),120);
}

// ---- the asset browser ----
const WDATA={};   // (every weapon's file, for previews: which weapon plays which clip, what's held in it)
const CLIP_GROUPS=[['body','Third person (everyone)'],['vm','First person: swings'],['vr','First person: reloads']];
function clipLayout(name){const d=DOCS.get(key('clips',name));return d?d.data.layout:assetLayoutOf(name);}
function renderList(){
  const q=S.search.toLowerCase(),m=n=>!q||n.toLowerCase().includes(q)||(WDATA[n]&&WDATA[n].name.toLowerCase().includes(q));
  const it=(kind,n,label)=>{const d=DOCS.get(key(kind,n)),dt=d&&dirty(d);
    return '<div class="item'+(S.kind===kind&&S.name===n?' on':'')+'" data-k="'+kind+'" data-n="'+esc(n)+'">'+esc(label)+(dt?' <span class="dirty" title="Not saved">●</span>':'')+'<small>'+esc(label===n?'':n)+'</small></div>';};
  let h='<div class="grp"><span>Weapons</span><button class="x" id="newW" title="New weapon (a copy of the one open, or the club)">+ new</button></div>';
  for(const n of S.list.weapons)if(m(n))h+=it('weapons',n,WDATA[n]?WDATA[n].name:n);
  h+='<div class="grp"><span>Bodies (hurtboxes)</span></div>';
  for(const n of S.list.bodies||[])if(m(n))h+=it('bodies',n,(DOCS.get(key('bodies',n))||{data:{}}).data.name||n);
  for(const [L,title] of CLIP_GROUPS){h+='<div class="grp"><span>'+title+'</span>'+(L==='body'?'<button class="x" id="newC" title="New animation (a copy of the one open)">+ new</button>':'')+'</div>';
    for(const n of S.list.clips)if(clipLayout(n)===L&&m(n))h+=it('clips',n,n);}
  $('assetList').innerHTML=h;
  for(const e of $('assetList').querySelectorAll('.item'))e.onclick=()=>open(e.dataset.k,e.dataset.n);
  $('newW').onclick=()=>newAsset('weapons');$('newC').onclick=()=>newAsset('clips');
}
async function open(kind,name){
  try{await loadDoc(kind,name);}catch(e){return status('Could not open '+name+': '+e.message,true);}
  S.kind=kind;S.name=name;S.sel=-1;S.hsel=-1;S.kSel=-1;mergeTag=null;
  if(kind==='clips'){S.t=1;S.previewW=weaponFor(name);S.insp='clip';}
  else if(kind==='bodies')S.insp='hit';
  else if(!['box','stats','hit'].includes(S.insp))S.insp='box';
  $('empty').style.display='none';
  renderList();renderToolbar();renderInsp();rebuild();frameView();
  $('timeline').classList.toggle('show',kind==='clips');resize();drawTL();
  status((kind==='weapons'?'Weapon ':kind==='bodies'?'Body ':'Animation ')+name);
}
// (which weapon to show an animation with: the first that uses it)
function weaponFor(c){
  for(const n of S.list.weapons){const W=WDATA[n];if(!W)continue;const N=W.npc||{},P=W.player||{};
    if([N.strike,N.pose,N.rl,P.swing,P.rl,P.body].includes(c))return n;}
  return clipLayout(c)==='body'?'club':S.list.weapons.find(n=>WDATA[n]&&WDATA[n].kind==='gun')||'club';
}
async function newAsset(kind){
  const base=S.kind===kind?S.name:kind==='weapons'?'club':'club';
  const name=prompt((kind==='weapons'?'New weapon':'New animation')+': a short name (letters, digits, - and _), copied from '+base,base+'2');
  if(!name)return;if(!/^[A-Za-z0-9_-]{1,64}$/.test(name))return status('Names are letters, digits, - and _ only',true);
  if(S.list[kind].includes(name))return status(name+' already exists',true);
  const src=await loadDoc(kind,base),data=clone(src.data);if(kind==='weapons')data.name=name;
  DOCS.set(key(kind,name),{kind,name,data,saved:'',stamp:'',undo:[],redo:[],isNew:true});
  S.list[kind].push(name);if(kind==='weapons')WDATA[name]=data;
  await open(kind,name);status('New '+(kind==='weapons'?'weapon':'animation')+' '+name+': not saved yet. A new weapon needs a Build before Open game knows it');
}

// ---- saving ----
async function save(d=doc()){
  if(!d)return false;
  const errs=assetCheck(d.kind,d.name,d.data);
  if(errs.length){dialog('<h3>Not saved: '+esc(d.name)+' has problems</h3><div class="err">'+esc(errs.join('\n'))+'</div><p style="text-align:right"><button onclick="closeDlg()">OK</button></p>');return false;}
  const text=assetFmt(d.data);
  try{const j=await api('/api/write',{kind:d.kind,name:d.name,text,stamp:d.stamp});d.saved=text;d.stamp=j.stamp;d.isNew=false;renderList();status('Saved src/assets/'+d.kind+'/'+d.name+'.json');return true;}
  catch(e){
    if(e.status===409){dialog('<h3>'+esc(d.name)+' changed on disk</h3><p>Someone (another thread, or a git pull) changed this file since you opened it. Saving now would lose their change.</p>'+
      '<p style="text-align:right"><button id="dReload">Load theirs (lose mine)</button> <button id="dOver">Overwrite with mine</button> <button onclick="closeDlg()">Cancel</button></p>');
      $('dReload').onclick=async()=>{DOCS.delete(key(d.kind,d.name));closeDlg();await open(d.kind,d.name);};
      $('dOver').onclick=async()=>{d.stamp=e.body.stamp||'';closeDlg();await save(d);};return false;}
    status('Save failed: '+e.message,true);return false;}
}
async function saveAll(){let n=0;for(const d of DOCS.values())if(dirty(d)||d.isNew){if(!await save(d))return;n++;}status(n?'Saved '+n+' file'+(n>1?'s':''):'Nothing to save');}
async function build(){
  for(const d of DOCS.values())if(dirty(d)||d.isNew){if(!confirm('Some files aren\'t saved, and the build only uses what\'s saved. Save them all first?'))break;await saveAll();break;}
  status('Building…');
  try{const j=await api('/api/build',{});status(j.ok?'Built game/index.html':'Build failed',!j.ok);
    if(!j.ok)dialog('<h3>Build failed</h3><div class="err">'+esc(j.out)+'</div><p style="text-align:right"><button onclick="closeDlg()">OK</button></p>');}
  catch(e){status('Build failed: '+e.message,true);}
}
function dialog(h){$('dlgBody').innerHTML=h;$('dialog').classList.add('show');}
function closeDlg(){$('dialog').classList.remove('show');}
window.closeDlg=closeDlg;

// ---- the live game: Open game opens the built game with ?editor, and each edit is sent to it ----
function openGame(){
  S.game=window.open('/game/index.html?editor','gsg-editor-game');S.gameOk=false;$('gameDot').className='';status('Opening the game… (it uses the last Build)');
}
addEventListener('message',e=>{
  if(e.origin!==location.origin||!e.data)return;
  if(e.data.type==='gsg-ready'){S.gameOk=true;$('gameDot').className='on';status('Game connected: edits show in it as you make them');for(const d of DOCS.values())if(dirty(d))sendLive(d);}
  if(e.data.type==='gsg-asset-done'&&e.data.result!=='ok')status('The game couldn\'t take '+e.data.name+': '+e.data.result,true);
});
function sendLive(d){
  if(!d||!S.game||S.game.closed){if(S.game&&S.game.closed){S.game=null;S.gameOk=false;$('gameDot').className='';}return;}
  if(!S.gameOk||assetCheck(d.kind,d.name,d.data).length)return;
  S.game.postMessage({type:'gsg-asset',kind:d.kind,name:d.name,file:clone(d.data)},location.origin);
}

// ---- the 3D view ----
const R=new THREE.WebGLRenderer({canvas:$('view'),antialias:true});R.setPixelRatio(Math.min(2,devicePixelRatio));R.autoClear=false;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x202329);
const cam=new THREE.PerspectiveCamera(40,1,0.01,200);cam.position.set(1.6,1.2,2.2);
const fpCam=new THREE.PerspectiveCamera(FP_REF.fov,300/190,0.01,50);
scene.add(new THREE.HemisphereLight(0xdfe8ff,0x50483c,0.85));{const L=new THREE.DirectionalLight(0xffffff,0.75);L.position.set(3,6,4);scene.add(L);}
const grid=new THREE.GridHelper(4,40,0x4a505c,0x30343c);scene.add(grid);
const grid1=new THREE.GridHelper(4,4,0x6a7080,0x6a7080);grid1.position.y=0.001;scene.add(grid1);   // (whole blocks)
const axes=new THREE.AxesHelper(0.25);scene.add(axes);
const orbit=new THREE.OrbitControls(cam,R.domElement);orbit.target.set(0,0.4,0);orbit.enableDamping=true;
const gizmo=new THREE.TransformControls(cam,R.domElement);gizmo.setSize(0.8);scene.add(gizmo);
gizmo.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value;if(!e.value)mergeTag=null;});
let content=new THREE.Group();scene.add(content);
const MATS={};
const matOf=(c,wire)=>{const k=c+(wire?'w':'');return MATS[k]||(MATS[k]=wire?new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.7}):new THREE.MeshLambertMaterial({color:c}));};
const colOf=c=>c==='@club'?0x7a5530:parseInt(c.slice(1),16);
const UNIT=new THREE.BoxGeometry(1,1,1);
const geoOf=sh=>!sh||sh==='box'?UNIT:assetGeo(sh);
// a mesh for a box of a file ({s,p,c,r,sh}), at its size and place
function boxMesh(b,ghost){
  const m=new THREE.Mesh(geoOf(b.sh),ghost?new THREE.MeshLambertMaterial({color:colOf(b.c),transparent:true,opacity:0.35,depthWrite:false}):matOf(colOf(b.c)));
  m.scale.set(b.s[0],b.s[1],b.s[2]);m.position.set(b.p[0],b.p[1],b.p[2]);if(b.r)m.rotation.set(b.r[0],b.r[1],b.r[2]);return m;
}
// the reference goblin, as groups by name
function goblin(ghost){
  const J={};
  const make=(n,par)=>{const g=new THREE.Group();g.name=n.name;g.position.set(...n.p);if(n.r)g.rotation.set(...n.r);
    for(const b of n.boxes)g.add(boxMesh(b,ghost));for(const k of n.kids||[])make(k,g);J[n.name]=g;par&&par.add(g);return g;};
  const root=make(GOBLIN_REF);root.scale.setScalar(GOBLIN_REF.scale);root.rotation.order='YXZ';J.root=root;return J;
}
// the first-person view's model, as gobKit builds it: the arm, and the weapon's view boxes in it (tags in groups of their own)
function fpRig(W,editing){
  const vm=new THREE.Group();vm.scale.setScalar(FP_REF.scale);vm.rotation.order='YXZ';
  const arm=new THREE.Group();vm.add(arm);arm.add(boxMesh(FP_REF.arm));
  const tags={},meshes=[];const L=W&&W.model&&W.model.view||[];
  L.forEach((b,i)=>{let to=arm;if(b.tag){to=tags[b.tag]||(tags[b.tag]=new THREE.Group());arm.add(to);}const m=boxMesh(b);m.userData.i=i;to.add(m);meshes.push(m);});
  const F=W&&W.model&&W.model.fore;
  if(F){const P=F.p,Sx=F.r,d=[Sx[0]-P[0],Sx[1]-P[1],Sx[2]-P[2]],len=Math.hypot(...d),b=new THREE.Mesh(UNIT,matOf(colOf(FP_REF.arm.c)));
    b.scale.set(0.11,0.11,len);b.position.set((P[0]+Sx[0])/2,(P[1]+Sx[1])/2,(P[2]+Sx[2])/2);b.rotation.order='YXZ';b.rotation.set(-Math.asin(d[1]/len),Math.atan2(d[0],d[2]),0);
    (W.model.foreTag&&tags[W.model.foreTag]||arm).add(b);}
  return {vm,arm,tags,meshes};
}
let pickable=[],posed=null,fpView=null,hitMeshes=[];
// make the view again from the open file
function rebuild(){
  gizmo.detach();scene.remove(content);content=new THREE.Group();scene.add(content);pickable=[];posed=null;fpView=null;hitMeshes=[];
  const d=doc();if(!d){hud('');return;}
  if(d.kind==='bodies'){buildHit(d.data);return;}
  if(d.kind==='weapons'){
    const W=d.data;
    if(S.insp==='hit'){buildHit(W);return;}
    const L=(W.model&&W.model[S.wl])||[];
    let par=content;
    if(S.wl==='held'){if(S.ctx){const J=goblin(true);content.add(J.root);J.arm.rotation.x=-1.2;par=J.hand;}}
    else if(S.wl==='stow'){if(S.ctx){const J=goblin(true);content.add(J.root);par=J.root;}}
    if(S.wl==='view'){const F=fpRig(W);content.add(F.vm);F.vm.scale.setScalar(1);fpPose(F,W,null,0);pickable=F.meshes;fpView=fpRig(W);fpPose(fpView,W,null,0);}
    else L.forEach((b,i)=>{const m=boxMesh(b);m.userData.i=i;par.add(m);pickable.push(m);});
    if(S.sel>=0&&pickable[S.sel]){gizmo.attach(pickable[S.sel]);outline(pickable[S.sel]);}
    budget(L);
  }else{
    const c=d.data,W=WDATA[S.previewW];
    if(c.layout==='body'){const J=goblin(false);content.add(J.root);
      for(const b of (W&&W.model&&W.model.held)||[])J.hand.add(boxMesh(b));
      if(W&&W.hit)drawHits(W.hit,J.root,true);
      posed={k:'body',J};}
    else{const F=fpRig(W);content.add(F.vm);F.vm.scale.setScalar(1);fpView=fpRig(W);posed={k:c.layout,F,W};}
    poseAt(S.t);hud('');
  }
}
function outline(m){const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xffd060,depthTest:false}));e.renderOrder=9;m.add(e);}
function budget(L){
  const tri={box:12,cyl:40,cone:20,sphere:100,wedge:8},sh=new Set(L.map(b=>b.sh||'box'));
  const t=L.reduce((a,b)=>a+(tri[b.sh||'box']||12),0);
  hud(L.length+' boxes · '+t+' triangles · '+sh.size+' shape'+(sh.size>1?'s':'')+(sh.has('sphere')?'\nspheres cost the most triangles: keep them off goblins':'')+
    (S.wl==='held'?'\nheld in the hand, in the hand\'s own frame':S.wl==='view'?'\nyour own first-person view (inset: as the game frames it)':S.wl==='stow'?'\nput away on the body (a holster, slung on the back)':'\nlying on the ground to be picked up'));
}
function hud(t){$('hud').textContent=t;}

// ---- poses: the same sums the game does (strikeAt in strikes.js; gobCamera and gobViewGun in pivots.js) ----
function clipAt(c,u){
  const K=c.keys;u=Math.max(K[0].t,Math.min(K[K.length-1].t,u));let i=1;while(i<K.length-1&&K[i].t<u)i++;
  const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a.t)/((b.t-a.t)||1))),e=b.e,k=e==='i'?s*s:e==='o'?1-(1-s)*(1-s):s*s*(3-2*s);
  return a.v.map((x,j)=>x+(b.v[j]-x)*k);
}
function fpPose(F,W,c,u){
  F.arm.rotation.set(0,0,0);
  const gun=W&&(W.kind==='gun');
  if(c&&c.layout==='vm'){const v=clipAt(c,u);F.arm.rotation.x=v[0];F.arm.rotation.z=v.length>4?v[4]:0;F.arm.position.set(v[1],v[2],v[3]);}
  else if(gun||(c&&c.layout==='vr')){const M=(W&&W.player&&W.player.vm)||FP_REF.gunVm;let rx=0.04,rz=0,ax=M.x,ay=M.y,az=M.z,mg=0;
    if(c&&c.layout==='vr'){const r=clipAt(c,u);rx+=r[0];rz=r[1];ax+=r[2];ay+=r[3];az+=r[4];mg=r[5]||0;}
    F.arm.rotation.x=rx;F.arm.rotation.z=rz;F.arm.position.set(ax,ay,az);
    if(F.tags.mag){F.tags.mag.position.y=-0.3*mg;F.tags.mag.visible=mg<0.95;}
    if(F.tags.load){F.tags.load.visible=mg<0.9;F.tags.load.position.z=-0.45*mg;}}
  else if(W&&W.kind==='spell')F.arm.position.set(0.3,-0.5,-0.56),F.arm.rotation.x=0.18;
  else{const v=FP_REF.rest;F.arm.rotation.x=v[0];F.arm.position.set(v[1],v[2],v[3]);}
}
function poseAt(u){
  const d=doc();if(!posed||!d||d.kind!=='clips')return;const c=d.data;
  if(posed.k==='body'){const J=posed.J,v=clipAt(c,u);
    J.arm.rotation.set(v[0],0,v[1]);J.hand.rotation.x=v[2];J.armL.rotation.x=v[3];J.root.rotation.set(v[5],v[4],0);J.root.position.set(0,0,v[6]);}
  else{fpPose(posed.F,posed.W,c,u);fpPose(fpView,posed.W,c,u);}
}

// ---- hit shapes: a weapon's hitboxes, in the body's own frame (the goblin's feet, facing +z) ----
function hitMesh(s,col,wire){
  let g;if(s.k==='box')g=UNIT;else if(s.k==='sphere')g=new THREE.SphereGeometry(1,16,10);else g=new THREE.CylinderGeometry(1,1,1,16,1,true);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,wireframe:wire,transparent:true,opacity:wire?0.8:0.18,depthWrite:false}));
  if(s.k==='box')m.scale.set(...s.s);else if(s.k==='sphere')m.scale.setScalar(s.r);else{m.scale.set(s.r,s.h||0.001,s.r);
    for(const e of[-1,1]){const cap=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),m.material);cap.scale.set(1,s.r/(s.h||0.001),1);cap.position.y=e*0.5;m.add(cap);}}
  m.position.set(...s.p);if(s.rot)m.rotation.set(...s.rot);return m;
}
function drawHits(H,par,liveOnly){
  for(const s of H.hitboxes||[]){if(liveOnly&&s.t&&!(S.t>=s.t[0]&&S.t<=s.t[1]))continue;par.add(hitMesh(s,0xff5040,false));par.add(hitMesh(s,0xff5040,true));}
}
// (which set the hit tab edits: a body's hurtboxes, a weapon's hitboxes)
const hitSet=()=>doc()&&doc().kind==='bodies'?'hurtboxes':'hitboxes';
// the goblin's hurtboxes (src/assets/bodies/goblin.json), drawn on a goblin standing where a weapon's blow lands
const goblinHurt=()=>{const d=DOCS.get(key('bodies','goblin'));return (d&&d.data.hit&&d.data.hit.hurtboxes)||[];};
function buildHit(W){
  const set=hitSet(),body=set==='hurtboxes',col=body?0x50c0ff:0xff5040;
  const J=goblin(true);content.add(J.root);
  if(!body){J.arm.rotation.x=-1.2;for(const b of (W.model&&W.model.held)||[])J.hand.add(boxMesh(b,true));
    // (the built-in hit, for reference: everything within r of a point reach ahead, a little below to well above the feet)
    if(W.r&&W.reach){const ref=hitMesh({k:'capsule',p:[0,0.25,W.reach],r:W.r,h:5.5},0x60a0ff,true);ref.material.opacity=0.35;content.add(ref);}
    // (a goblin where the blow lands, facing back, with its hurtboxes)
    const T=goblin(true),z=(W.reach||1)+0.3;T.root.position.z=z;T.root.rotation.y=Math.PI;content.add(T.root);
    const tg=new THREE.Group();tg.position.z=z;tg.rotation.y=Math.PI;content.add(tg);for(const s of goblinHurt())tg.add(hitMesh(s,0x50c0ff,true));}
  const H=(W.hit&&W.hit[set])||[];
  H.forEach((s,i)=>{const m=hitMesh(s,i===S.hsel?0xffd060:col,false);m.userData.i=i;content.add(m);pickable.push(m);m.add(new THREE.Mesh(m.geometry,new THREE.MeshBasicMaterial({color:col,wireframe:true})));});
  hitMeshes=pickable;
  if(S.hsel>=0&&pickable[S.hsel])gizmo.attach(pickable[S.hsel]);
  hud(body?H.length+' hurtbox'+(H.length===1?'':'es')+'\nwhere a goblin can be hurt, from its feet (+z the way it faces)\nonly weapons with hitboxes of their own test against these':
    H.length+' hitbox'+(H.length===1?'':'es')+(H.length?'':' (the game uses the built-in hit, in blue)')+'\nin the goblin\'s own frame: +z is the way it faces\nthe goblin ahead shows its hurtboxes (Bodies: goblin)');
}

// gizmo -> the file
gizmo.addEventListener('objectChange',()=>{
  const o=gizmo.object;if(!o)return;const i=o.userData.i;
  if(S.insp==='hit'){edit(W=>{const s=W.hit[hitSet()][i];s.p=[r4(o.position.x),r4(o.position.y),r4(o.position.z)];
      if(s.k==='box')s.s=[o.scale.x,o.scale.y,o.scale.z].map(v=>r4(Math.max(0.005,Math.abs(v))));
      else if(s.k==='sphere')s.r=r4(Math.max(0.01,Math.abs(o.scale.x)));else{s.r=r4(Math.max(0.01,Math.abs(o.scale.x)));s.h=r4(Math.max(0,Math.abs(o.scale.y)));}
      const rr=[o.rotation.x,o.rotation.y,o.rotation.z].map(r4);if(rr.some(v=>v))s.rot=rr;else delete s.rot;},'giz');return;}
  edit(W=>{const b=W.model[S.wl][i];b.p=[r4(o.position.x),r4(o.position.y),r4(o.position.z)];
    b.s=[o.scale.x,o.scale.y,o.scale.z].map(v=>r4(Math.max(0.005,Math.abs(v))));
    const rr=[o.rotation.x,o.rotation.y,o.rotation.z].map(r4);if(rr.some(v=>v))b.r=rr;else delete b.r;},'giz');
});
// picking: a click (not a drag) on a box selects it
{let down=null;
  R.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
  R.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4||gizmo.dragging)return;down=null;
    const r=R.domElement.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(m,cam);
    const hit=ray.intersectObjects(pickable,false)[0];const i=hit?hit.object.userData.i:-1;
    if(S.insp==='hit')S.hsel=i;else S.sel=i;rebuild();renderInsp();});}
function frameView(){
  const d=doc();if(!d)return;
  if(S.insp==='hit'){orbit.target.set(0,0.6,0.8);cam.position.set(4.2,3,-1.6);}
  else if(d.kind==='clips'&&d.data.layout==='body'||S.ctx&&(S.wl==='held'||S.wl==='stow')){orbit.target.set(0,0.65,0.2);cam.position.set(2.2,1.4,2.4);}
  else if(d.kind==='clips'||S.wl==='view'){orbit.target.set(0.3,-0.4,-0.6);cam.position.set(1.6,0.4,0.6);}
  else{const L=(d.data.model&&d.data.model[S.wl])||[];const bb=new THREE.Box3();for(const b of L)bb.expandByPoint(new THREE.Vector3(...b.p));
    const c=bb.isEmpty()?new THREE.Vector3():bb.getCenter(new THREE.Vector3()),sz=Math.max(0.6,bb.getSize(new THREE.Vector3()).length());
    orbit.target.copy(c);cam.position.set(c.x+sz*1.1,c.y+sz*0.7,c.z+sz*1.3);}
  orbit.update();
}

// ---- the toolbar over the view ----
function renderToolbar(){
  const d=doc();let h='';
  if(!d){$('toolbar').innerHTML='';return;}
  if(d.kind==='weapons'&&S.insp!=='hit'){
    const L=[['held','Held'],['view','First person'],['drop','Dropped'],['stow','Put away']];
    h+=L.map(([k,t])=>'<button data-wl="'+k+'" class="'+(S.wl===k?'on':'')+'"'+(d.data.model&&d.data.model[k]||k==='held'?'':' title="This weapon has none: add a box to start one"')+'>'+t+'</button>').join('');
    h+='<span class="sep"></span>';
    h+=[['translate','Move (G)'],['rotate','Tilt (R)'],['scale','Size (S)']].map(([k,t])=>'<button data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+t+'</button>').join('');
    h+='<label>Snap <select id="snapSel">'+[['0','off'],['0.005','0.005'],['0.01','0.01'],['0.0625','1/16'],['0.1','0.1']].map(([v,t])=>'<option value="'+v+'"'+(+v===S.snap?' selected':'')+'>'+t+'</option>').join('')+'</select></label>';
    if(S.wl==='held'||S.wl==='stow')h+='<label><input type="checkbox" id="ctxChk"'+(S.ctx?' checked':'')+'> On a goblin</label>';
  }else if(d.kind!=='clips'){
    h+=[['translate','Move (G)'],['rotate','Tilt (R)'],['scale','Size (S)']].map(([k,t])=>'<button data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+t+'</button>').join('');
  }else{
    h+='<label>Shown with <select id="pwSel">'+S.list.weapons.map(n=>'<option value="'+n+'"'+(n===S.previewW?' selected':'')+'>'+esc(WDATA[n]?WDATA[n].name:n)+'</option>').join('')+'</select></label>';
    h+='<span class="note">'+esc(ASSET_LAYOUTS[d.data.layout]?ASSET_LAYOUTS[d.data.layout].about:'')+'</span>';
  }
  h+='<span class="grow"></span><button id="frameBtn" title="Frame the view (F)">Frame</button>';
  $('toolbar').innerHTML=h;
  for(const b of $('toolbar').querySelectorAll('[data-wl]'))b.onclick=()=>{S.wl=b.dataset.wl;S.sel=-1;renderToolbar();renderInsp();rebuild();frameView();};
  for(const b of $('toolbar').querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
  if($('snapSel'))$('snapSel').onchange=e=>{S.snap=+e.target.value;applySnap();};
  if($('ctxChk'))$('ctxChk').onchange=e=>{S.ctx=e.target.checked;S.sel=-1;rebuild();frameView();};
  if($('pwSel'))$('pwSel').onchange=e=>{S.previewW=e.target.value;rebuild();};
  $('frameBtn').onclick=frameView;
}
function setMode(m){S.mode=m;gizmo.setMode(m);renderToolbar();}
function applySnap(fine){const s=S.snap*(fine?0.25:1);gizmo.setTranslationSnap(s||null);gizmo.setScaleSnap(s||null);gizmo.setRotationSnap(S.snap?Math.PI/(fine?72:24):null);}
addEventListener('keydown',e=>{if(e.key==='Shift')applySnap(true);});addEventListener('keyup',e=>{if(e.key==='Shift')applySnap(false);});

// ---- the inspector ----
const num=(v,id,step=0.01)=>'<input type="number" step="'+step+'" id="'+id+'" value="'+(v??'')+'">';
const v3=(v,id)=>'<span class="v3">'+[0,1,2].map(j=>num(v?v[j]:0,id+j)).join('')+'</span>';
function renderInsp(){
  const d=doc();
  const tabs=!d?[]:d.kind==='weapons'?[['box','Boxes'],['stats','Stats'],['hit','Hitboxes']]:d.kind==='bodies'?[['hit','Hurtboxes']]:[['clip','Animation']];
  $('inspTabs').innerHTML=tabs.map(([k,t])=>'<button class="'+(S.insp===k?'on':'')+'" data-t="'+k+'">'+t+'</button>').join('');
  for(const b of $('inspTabs').querySelectorAll('button'))b.onclick=()=>{S.insp=b.dataset.t;S.sel=-1;S.hsel=-1;renderToolbar();renderInsp();rebuild();frameView();};
  const B=$('inspBody');if(!d){B.innerHTML='';return;}
  if(d.kind==='clips')return renderClipInsp(B,d);
  if(S.insp==='stats')return renderStats(B,d);
  if(S.insp==='hit')return renderHitInsp(B,d);
  renderBoxInsp(B,d);
}
// (only the values: a re-render of the whole inspector would lose focus mid-typing)
function refreshInsp(){
  const d=doc();if(!d)return;const a=document.activeElement;
  if(a&&$('inspBody').contains(a)&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')&&a.type!=='range')return;
  renderInsp();
}
function renderBoxInsp(B,d){
  const W=d.data,L=(W.model&&W.model[S.wl])||[],b=L[S.sel];
  let h='<div class="row"><button id="addBox">+ Box</button><button id="dupBox"'+(b?'':' disabled')+'>Duplicate</button><button id="mirBox"'+(b?'':' disabled')+' title="A copy on the other side (x flipped)">Mirror</button><button id="delBox"'+(b?'':' disabled')+'>Delete</button></div>';
  h+='<div class="list" id="boxList">'+L.map((x,i)=>'<div class="item'+(i===S.sel?' on':'')+'" data-i="'+i+'"><span style="color:'+(x.c==='@club'?'#7a5530':x.c)+'">■</span> '+esc(x.role||x.tag||(x.sh&&x.sh!=='box'?x.sh:'box'))+' <small>'+x.s.map(v=>+v.toFixed(3)).join(' × ')+'</small></div>').join('')+'</div>';
  if(b){
    h+='<h3>Box '+(S.sel+1)+'</h3>';
    h+='<div class="row"><label>Size</label>'+v3(b.s,'bs')+'</div><div class="row"><label>Place</label>'+v3(b.p,'bp')+'</div><div class="row"><label>Tilt (degrees)</label>'+v3((b.r||[0,0,0]).map(v=>+(v*180/Math.PI).toFixed(2)),'br')+'</div>';
    h+='<div class="row"><label>Shape</label><select id="bsh">'+ASSET_SHAPES.map(s=>'<option'+((b.sh||'box')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></div>';
    const isRole=b.c[0]==='@';
    h+='<div class="row"><label>Colour</label><input type="color" id="bc" value="'+(isRole?'#7a5530':b.c)+'"'+(isRole?' disabled':'')+'><label style="width:auto"><input type="checkbox" id="brole"'+(isRole?' checked':'')+'> club colour</label></div>';
    if(S.wl==='held'||S.wl==='stow')h+='<div class="row"><label>Part name</label><input id="brl" value="'+esc(b.role||'')+'" placeholder="e.g. blade"></div>';
    if(S.wl==='view')h+='<div class="row"><label>Draw order</label>'+num(b.o,'bo',1)+'</div><div class="row"><label>Moves as</label><select id="btag">'+['','mag','load','bolt','pump','slide'].map(t=>'<option value="'+t+'"'+((b.tag||'')===t?' selected':'')+'>'+(t||'(fixed)')+'</option>').join('')+'</select></div>';
  }else h+='<p class="note">Click a box in the view or the list to edit it.</p>';
  if(S.wl==='view'){const F=W.model.fore;h+='<h3>Other forearm</h3>'+(F?'<div class="row"><label>Hand at</label>'+v3(F.p,'fp')+'</div><div class="row"><label>From</label>'+v3(F.r,'fr')+'</div><div class="row"><button id="foreDel">Remove</button></div>':'<div class="row"><button id="foreAdd">+ Other hand on it</button></div>');}
  if(W.note!==undefined||true)h+='<h3>Note</h3><textarea id="wnote" rows="3" style="width:100%" placeholder="What this weapon is, for whoever edits it next">'+esc(W.note||'')+'</textarea>';
  B.innerHTML=h;
  for(const e of B.querySelectorAll('#boxList .item'))e.onclick=()=>{S.sel=+e.dataset.i;rebuild();renderInsp();};
  const L2=W2=>{W2.model=W2.model||{};return W2.model[S.wl]=W2.model[S.wl]||[];};
  $('addBox').onclick=()=>edit(W2=>{const L=L2(W2),o=b?b.p:[0,0,0];L.push({s:[0.1,0.1,0.1],p:[o[0],o[1],o[2]+0.1],c:b?b.c:'#888888'});if(S.wl==='view')L[L.length-1].o=62;S.sel=L.length-1;});
  $('dupBox').onclick=()=>dup();$('mirBox').onclick=()=>mirror();$('delBox').onclick=()=>del();
  const set=(f)=>e=>edit(W2=>f(W2.model[S.wl][S.sel],e.target),'f'+e.target.id);
  if(b){for(const j of[0,1,2]){$('bs'+j).onchange=set((x,t)=>{x.s[j]=Math.max(0.001,r4(+t.value));});$('bp'+j).onchange=set((x,t)=>{x.p[j]=r4(+t.value);});
      $('br'+j).onchange=set((x,t)=>{x.r=x.r||[0,0,0];x.r[j]=r4(+t.value*Math.PI/180);if(!x.r.some(v=>v))delete x.r;});}
    $('bsh').onchange=set((x,t)=>{if(t.value==='box')delete x.sh;else x.sh=t.value;});
    $('bc').oninput=set((x,t)=>{x.c=t.value;});$('brole').onchange=set((x,t)=>{x.c=t.checked?'@club':'#7a5530';});
    if($('brl'))$('brl').onchange=set((x,t)=>{if(t.value)x.role=t.value;else delete x.role;});
    if($('bo'))$('bo').onchange=set((x,t)=>{x.o=+t.value;});
    if($('btag'))$('btag').onchange=set((x,t)=>{if(t.value)x.tag=t.value;else delete x.tag;});}
  if($('foreAdd'))$('foreAdd').onclick=()=>edit(W2=>{W2.model.fore={p:[0,0,-0.9],r:[-0.62,-0.42,-0.1]};});
  if($('foreDel'))$('foreDel').onclick=()=>edit(W2=>{delete W2.model.fore;delete W2.model.foreTag;});
  if($('fp0'))for(const j of[0,1,2]){$('fp'+j).onchange=e=>edit(W2=>{W2.model.fore.p[j]=r4(+e.target.value);});$('fr'+j).onchange=e=>edit(W2=>{W2.model.fore.r[j]=r4(+e.target.value);});}
  $('wnote').onchange=e=>edit(W2=>{if(e.target.value)W2.note=e.target.value;else delete W2.note;});
}
function dup(){const d=doc();if(!d)return;
  if(d.kind==='clips')return copyKey();
  if(S.insp==='hit'){if(S.hsel<0)return;edit(W=>{const H=W.hit[hitSet()],c=clone(H[S.hsel]);c.p[0]+=0.1;H.push(c);S.hsel=H.length-1;});return;}
  if(S.sel<0)return;edit(W=>{const L=W.model[S.wl],c=clone(L[S.sel]);c.p[0]=r4(c.p[0]+0.05);L.push(c);S.sel=L.length-1;});}
function mirror(){const d=doc();if(!d||d.kind!=='weapons'||S.sel<0||S.insp!=='box')return;
  edit(W=>{const L=W.model[S.wl],c=clone(L[S.sel]);c.p[0]=r4(-c.p[0]);if(c.r){c.r[1]=-c.r[1];c.r[2]=-c.r[2];}L.push(c);S.sel=L.length-1;});}
function del(){const d=doc();if(!d)return;
  if(d.kind==='clips')return delKey();
  if(S.insp==='hit'){if(S.hsel<0)return;const set=hitSet();edit(W=>{W.hit[set].splice(S.hsel,1);S.hsel=-1;if(!W.hit[set].length)delete W.hit[set];if(!Object.keys(W.hit).length)delete W.hit;});return;}
  if(S.sel<0)return;edit(W=>{W.model[S.wl].splice(S.sel,1);S.sel=-1;});}

// the weapon's numbers: every field in its file but the model, the hit shapes and the note, as a table
const FIELD_HELP={name:'Its name in the game',about:'The line on the Character tab',kind:'melee, gun, spell, throw or mine',drop:'Left behind by a killed enemy for Gnash',stack:'Carried as a pile (grenades, mines)',
  dmg:'Damage of a blow, a round or a blast',every:'Seconds between one use and the next',range:'How far a gun reaches',breaks:'Its rounds can break the block they hit (half the time)',
  r:'A blade or club: how wide its hit is',reach:'A blade or club: how far ahead its hit is',R:'Blast radius',fuse:'Seconds till a grenade goes off',mag:'Rounds in a magazine',reload:'Seconds to reload',
  carDmg:'Damage to cars',pellets:'Pellets in a shot',spread:'How far pellets scatter',proj:'A rocket: it flies at speed and bursts',speed:'How fast the rocket flies',crush:'Its crater',vd:'Its harm to vehicles',
  arm:'Seconds before a mine is live',near:'Closest a spell is cast at',cast:'Seconds conjuring a spell','npc.strike':'The blow it strikes up close (an animation)','npc.pose':'The pose it aims in (an animation)',
  'npc.rl':'Its reload (an animation)','npc.aim':'How the hands grip it: rifle, pistol or tube','npc.wind':'Seconds of wind-up','npc.ft':'Seconds of follow-through','npc.burst':'Rounds fired at a time',
  'player.dur':'Seconds the swing or shot takes','player.lunge':'Seconds till it lands','player.cause':'What it\'s called when it kills you','player.swing':'First-person swing (an animation)',
  'player.rl':'First-person reload (an animation)','player.body':'The blow others see him strike (an animation)','player.auto':'Fires for as long as the button\'s held','player.cycle':'bolt, pump or slide worked after a shot'};
function renderStats(B,d){
  const W=d.data;let h='<p class="note">Every number here is the same whoever carries it: Gnash, Grizzle or any enemy.</p><table class="stats">';
  const row=(path,v)=>{const id='st_'+path;let inp;
    if(typeof v==='boolean')inp='<input type="checkbox" id="'+id+'"'+(v?' checked':'')+'>';
    else if(typeof v==='number')inp='<input type="number" step="any" id="'+id+'" value="'+v+'">';
    else if(typeof v==='string')inp='<input type="text" id="'+id+'" value="'+esc(v)+'">';
    else inp='<input type="text" id="'+id+'" value="'+esc(JSON.stringify(v))+'" title="JSON">';
    return '<tr title="'+esc(FIELD_HELP[path]||'')+'"><td>'+esc(path)+'</td><td>'+inp+'</td><td><button class="x" data-del="'+esc(path)+'" title="Remove this field">×</button></td></tr>';};
  for(const k in W){if(['model','hit','note'].includes(k))continue;const v=W[k];
    if(v&&typeof v==='object'&&!Array.isArray(v)){h+='<tr class="sec"><td colspan="3">'+esc(k)+'</td></tr>';for(const j in v)h+=row(k+'.'+j,v[j]);}
    else h+=row(k,v);}
  h+='</table><h3>Add a field</h3><div class="row"><input id="nf" placeholder="name, or npc.name / player.name" style="flex:1"><select id="nft"><option>number</option><option>text</option><option>yes/no</option></select><button id="nfb">Add</button></div>';
  h+='<p class="note">Hover a field for what it does.</p>';
  B.innerHTML=h;
  const at=(o,p)=>{const s=p.split('.');for(let i=0;i<s.length-1;i++)o=o[s[i]]=o[s[i]]||{};return [o,s[s.length-1]];};
  for(const inp of B.querySelectorAll('input[id^=st_]')){const path=inp.id.slice(3);
    inp.onchange=()=>edit(W2=>{const [o,k]=at(W2,path),old=o[k];let v;
      if(inp.type==='checkbox')v=inp.checked;else if(inp.type==='number')v=+inp.value;else if(typeof old==='string')v=inp.value;else{try{v=JSON.parse(inp.value);}catch(e){status(path+': not valid JSON, unchanged',true);return;}}
      o[k]=v;},'st'+path);}
  for(const x of B.querySelectorAll('[data-del]'))x.onclick=()=>edit(W2=>{const [o,k]=at(W2,x.dataset.del);delete o[k];});
  $('nfb').onclick=()=>{const p=$('nf').value.trim();if(!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)?$/.test(p))return status('A field name is letters and digits, or npc.name / player.name',true);
    edit(W2=>{const [o,k]=at(W2,p);o[k]=$('nft').value==='number'?0:$('nft').value==='text'?'':false;});};
}
function renderHitInsp(B,d){
  const set=hitSet(),body=set==='hurtboxes',W=d.data,H=(W.hit&&W.hit[set])||[],s=H[S.hsel];
  let h=body?'<div class="row"><label>Name</label><input id="bname" value="'+esc(W.name||'')+'"></div><p class="note">Where this body can be hurt, from its feet (+z the way it faces). A weapon with hitboxes of its own hits it when one of them touches one of these.</p>':
    '<p class="note">Where a blow with this weapon hurts, in the goblin\'s own frame (+z ahead). With none, the game uses the built-in hit in blue: everything within r of a point reach ahead. With hitboxes, it hits a goblin when one touches its hurtboxes (Bodies: goblin).</p>';
  h+='<div class="row"><button data-add="sphere">+ Sphere</button><button data-add="capsule">+ Capsule</button><button data-add="box">+ Box</button></div>';
  h+='<div class="row">'+(body?'':'<button id="hbCopy"'+(W.r&&W.reach?'':' disabled')+'>Copy the built-in hit</button>')+(s?'<button id="hbDel">Delete</button>':'')+'</div>';
  h+='<div class="list">'+H.map((x,i)=>'<div class="item'+(i===S.hsel?' on':'')+'" data-i="'+i+'">'+x.k+' <small>'+(body?'':x.t?'live '+x.t.join('–'):'always')+'</small></div>').join('')+'</div>';
  if(s){h+='<h3>'+s.k+'</h3><div class="row"><label>Place</label>'+v3(s.p,'hp')+'</div>';
    if(s.k==='box')h+='<div class="row"><label>Size</label>'+v3(s.s,'hs')+'</div>';else h+='<div class="row"><label>Radius</label>'+num(s.r,'hr')+'</div>';
    if(s.k==='capsule')h+='<div class="row"><label>Length</label>'+num(s.h,'hh')+'</div>';
    h+='<div class="row"><label>Tilt (degrees)</label>'+v3((s.rot||[0,0,0]).map(v=>+(v*180/Math.PI).toFixed(2)),'hro')+'</div>';
    if(!body)h+='<div class="row"><label>Live on its blow</label><input type="checkbox" id="hlv"'+(s.t?' checked':'')+'> from '+num(s.t?s.t[0]:0.9,'ht0')+' to '+num(s.t?s.t[1]:1.1,'ht1')+'</div><p class="note">On the blow\'s timeline: 1 is where it lands. (Gnash\'s blows land in one go for now, so the game counts every hitbox at the moment of the blow.)</p>';}
  B.innerHTML=h;
  for(const e of B.querySelectorAll('.list .item'))e.onclick=()=>{S.hsel=+e.dataset.i;rebuild();renderInsp();};
  const add=sh=>edit(W2=>{W2.hit=W2.hit||{};const L=W2.hit[set]=W2.hit[set]||[];const R0=body?0.25:W2.r||1,F=body?0:W2.reach||1;
    L.push(sh==='box'?{k:'box',p:[0,0.6,F],s:[R0*2,1.2,R0*2]}:sh==='sphere'?{k:'sphere',p:[0,0.6,F],r:R0}:{k:'capsule',p:[0,0.6,F],r:R0,h:1});S.hsel=L.length-1;});
  for(const b of B.querySelectorAll('[data-add]'))b.onclick=()=>add(b.dataset.add);
  if($('bname'))$('bname').onchange=e=>edit(W2=>{W2.name=e.target.value;});
  if($('hbCopy'))$('hbCopy').onclick=()=>edit(W2=>{W2.hit=W2.hit||{};const L=W2.hit.hitboxes=W2.hit.hitboxes||[];L.push({k:'capsule',p:[0,0.25,W2.reach],r:W2.r,h:5.5});S.hsel=L.length-1;});
  if(s){const put=f=>e=>edit(W2=>f(W2.hit[set][S.hsel],e.target),'h'+e.target.id);
    $('hbDel').onclick=()=>del();
    for(const j of[0,1,2]){$('hp'+j).onchange=put((x,t)=>{x.p[j]=r4(+t.value);});if($('hs'+j))$('hs'+j).onchange=put((x,t)=>{x.s[j]=Math.max(0.01,r4(+t.value));});
      $('hro'+j).onchange=put((x,t)=>{x.rot=x.rot||[0,0,0];x.rot[j]=r4(+t.value*Math.PI/180);if(!x.rot.some(v=>v))delete x.rot;});}
    if($('hr'))$('hr').onchange=put((x,t)=>{x.r=Math.max(0.01,r4(+t.value));});if($('hh'))$('hh').onchange=put((x,t)=>{x.h=Math.max(0,r4(+t.value));});
    if($('hlv'))$('hlv').onchange=put((x,t)=>{if(t.checked)x.t=[0.9,1.1];else delete x.t;});
    for(const j of[0,1])if($('ht'+j))$('ht'+j).onchange=put((x,t)=>{if(!x.t)x.t=[0.9,1.1];x.t[j]=r4(+t.value);if(x.t[0]>x.t[1])x.t.reverse();});}
}

// ---- animations: the inspector and the timeline ----
function renderClipInsp(B,d){
  const c=d.data,L=ASSET_LAYOUTS[c.layout],k=c.keys[S.kSel],n=c.keys[0].v.length,v=k?k.v:clipAt(c,S.t);
  let h='<div class="row"><label>Layout</label><b>'+esc(c.layout)+'</b></div><p class="note">'+esc(L?L.about:'')+'. Users: '+esc(users(S.name).join(', ')||'none yet')+'</p>';
  h+='<div class="row"><button id="kAdd">+ Key at playhead (K)</button><button id="kDel"'+(k?'':' disabled')+'>Delete key</button></div>';
  h+='<div class="row"><label style="width:auto"><input type="checkbox" id="autoK"'+(S.autoKey?' checked':'')+'> Auto-key: moving a slider keys the pose at the playhead</label></div>';
  h+='<h3>'+(k?'Key '+(S.kSel+1)+' of '+c.keys.length:'Pose at '+S.t.toFixed(3))+'</h3>';
  if(k)h+='<div class="row"><label>Time</label>'+num(k.t,'kt',0.01)+'</div><div class="row"><label>Ease into it</label><select id="ke"><option value="">smooth</option><option value="i"'+(k.e==='i'?' selected':'')+'>gathering speed (in)</option><option value="o"'+(k.e==='o'?' selected':'')+'>slowing (out)</option></select></div>';
  for(let j=0;j<n;j++){const ch=L.ch[j]||['v'+j,'value '+j];
    h+='<div class="row"><label title="'+esc(ch[1])+'" style="color:'+CH_COL[j%CH_COL.length]+'">'+esc(ch[1])+'</label><input type="range" min="-4" max="4" step="0.01" id="cr'+j+'" value="'+v[j]+'">'+num(+v[j].toFixed(4),'cn'+j)+'</div>';}
  if(L&&n<L.ch.length)h+='<div class="row"><button id="addCh">+ '+esc(L.ch[n][1])+' channel</button></div>';
  h+='<h3>Events</h3><p class="note">Marks the game\'s code reads: hit (the blow lands, always at 1 on a blow).</p>'+(c.events||[]).map((e,i)=>'<div class="row"><input id="evk'+i+'" value="'+esc(e.k)+'" style="width:90px">'+num(e.t,'evt'+i)+'<button class="x" data-ev="'+i+'">×</button></div>').join('')+'<div class="row"><button id="evAdd">+ Event at playhead</button></div>';
  h+='<h3>Note</h3><textarea id="cnote" rows="4" style="width:100%">'+esc(c.note||'')+'</textarea>';
  B.innerHTML=h;
  $('kAdd').onclick=addKey;$('kDel').onclick=delKey;$('autoK').onchange=e=>{S.autoKey=e.target.checked;};
  if(k){$('kt').onchange=e=>edit(C=>{const K=C.keys,lo=S.kSel>0?K[S.kSel-1].t:-1e9,hi=S.kSel<K.length-1?K[S.kSel+1].t:1e9;K[S.kSel].t=r4(Math.max(lo,Math.min(hi,+e.target.value)));});
    $('ke').onchange=e=>edit(C=>{if(e.target.value)C.keys[S.kSel].e=e.target.value;else delete C.keys[S.kSel].e;});}
  for(let j=0;j<n;j++){
    const put=(val,tag)=>{if(!k&&!S.autoKey)return;edit(C=>{let i=S.kSel;if(i<0){i=keyAt(C,S.t,true);S.kSel=i;}C.keys[i].v[j]=r4(val);},tag);};
    $('cr'+j).oninput=e=>{$('cn'+j).value=e.target.value;put(+e.target.value,'cr'+j+'@'+S.kSel);};
    $('cn'+j).onchange=e=>put(+e.target.value,'cn'+j);}
  if($('addCh'))$('addCh').onclick=()=>edit(C=>{for(const K of C.keys)K.v.push(0);});
  for(let i=0;i<(c.events||[]).length;i++){$('evk'+i).onchange=e=>edit(C=>{C.events[i].k=e.target.value;});$('evt'+i).onchange=e=>edit(C=>{C.events[i].t=r4(+e.target.value);});}
  for(const x of B.querySelectorAll('[data-ev]'))x.onclick=()=>edit(C=>{C.events.splice(+x.dataset.ev,1);});
  $('evAdd').onclick=()=>edit(C=>{(C.events=C.events||[]).push({t:r4(S.t),k:'hit'});});
  $('cnote').onchange=e=>edit(C=>{if(e.target.value)C.note=e.target.value;else delete C.note;});
}
function users(c){const o=[];for(const n of S.list.weapons){const W=WDATA[n];if(!W)continue;const N=W.npc||{},P=W.player||{};
  for(const [f,v] of [['strike',N.strike],['pose',N.pose],['reload',N.rl],['first-person swing',P.swing],['first-person reload',P.rl],['as others see him',P.body]])if(v===c)o.push((W.name||n)+' ('+f+')');}return o;}
// the index of the key at time t, made from the pose there if there isn't one (make)
function keyAt(C,t,make){const K=C.keys;let i=K.findIndex(k=>Math.abs(k.t-t)<1e-4);if(i>=0||!make)return i;
  const v=clipAt(C,t).map(r4);i=K.findIndex(k=>k.t>t);if(i<0)i=K.length;K.splice(i,0,{t:r4(t),v});return i;}
function addKey(){edit(C=>{S.kSel=keyAt(C,S.t,true);});renderInsp();}
function delKey(){const d=doc();if(!d||S.kSel<0)return;if(d.data.keys.length<=2)return status('A clip needs at least two keys',true);
  edit(C=>{C.keys.splice(S.kSel,1);S.kSel=-1;});renderInsp();}
let poseClip=null;
function copyKey(){const d=doc();if(!d)return;poseClip=clipAt(d.data,S.t);status('Pose copied: select a key and press Ctrl+V');}
function pasteKey(){const d=doc();if(!d||!poseClip)return;edit(C=>{const i=S.kSel>=0?S.kSel:keyAt(C,S.t,true);S.kSel=i;C.keys[i].v=poseClip.slice(0,C.keys[i].v.length).map(r4);});renderInsp();}
const CH_COL=['#e06a5a','#e0b040','#7fb24a','#4ab0c0','#6a8ae0','#b07ae0','#e07ab0'];
// the timeline: a curve per channel over u, keys as diamonds along the top, events as flags, the playhead
const TL=$('tl'),tg=TL.getContext('2d');
const tlX=(c,u)=>{const K=c.keys,a=K[0].t,b=K[K.length-1].t;return 40+(u-a)/((b-a)||1)*(TL.width/devicePixelRatio-60);};
const tlU=(c,x)=>{const K=c.keys,a=K[0].t,b=K[K.length-1].t;return a+(x-40)/(TL.width/devicePixelRatio-60)*(b-a);};
function renderTLBar(){
  $('tlbar').innerHTML='<button id="tlPlay">'+(S.playing?'Pause':'Play')+' (Space)</button><label><input type="checkbox" id="tlLoop"'+(S.loop?' checked':'')+'> Loop</label>'+
    '<label>Speed <select id="tlSpd">'+[0.1,0.25,0.5,1].map(v=>'<option'+(v===S.speed?' selected':'')+'>'+v+'</option>').join('')+'</select></label><span class="note" id="tlU"></span><span class="grow"></span><span class="note">Click: playhead · drag a diamond: move the key · double-click: add a key</span>';
  $('tlPlay').onclick=()=>{S.playing=!S.playing;renderTLBar();};$('tlLoop').onchange=e=>S.loop=e.target.checked;$('tlSpd').onchange=e=>S.speed=+e.target.value;
}
function drawTL(){
  const d=doc();if(!d||d.kind!=='clips')return;const c=d.data,W=TL.clientWidth,H=TL.clientHeight;
  if(TL.width!==W*devicePixelRatio||TL.height!==H*devicePixelRatio){TL.width=W*devicePixelRatio;TL.height=H*devicePixelRatio;}
  tg.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);tg.clearRect(0,0,W,H);
  const top=26,bot=H-14,K=c.keys;let lo=1e9,hi=-1e9;for(const k of K)for(const v of k.v){lo=Math.min(lo,v);hi=Math.max(hi,v);}if(hi-lo<0.5){hi+=0.25;lo-=0.25;}
  const Y=v=>bot-(v-lo)/(hi-lo)*(bot-top-6);
  tg.fillStyle='#181a1f';tg.fillRect(40,top-2,W-60,bot-top+4);
  // (where the blow lands, and the wind-up and follow-through either side of it)
  tg.font='11px system-ui';tg.fillStyle='#8890a0';
  for(let u=Math.ceil(K[0].t*4)/4;u<=K[K.length-1].t+1e-6;u+=0.25){const x=tlX(c,u);tg.fillStyle=u%1===0?'#3a404c':'#262a32';tg.fillRect(x,top-2,1,bot-top+4);tg.fillStyle='#8890a0';tg.fillText(u.toFixed(2),x-10,H-2);}
  if(c.layout==='body'){tg.fillStyle='#8890a0';tg.fillText('wind-up',tlX(c,0.4),top+10);tg.fillText('follow-through',tlX(c,1.35),top+10);}
  tg.fillStyle='#3a404c';tg.fillRect(40,Y(0),W-60,1);
  const n=K[0].v.length;
  for(let j=0;j<n;j++){tg.strokeStyle=CH_COL[j%CH_COL.length];tg.lineWidth=1.5;tg.beginPath();
    for(let x=40;x<=W-20;x+=2){const v=clipAt(c,tlU(c,x))[j];x===40?tg.moveTo(x,Y(v)):tg.lineTo(x,Y(v));}tg.stroke();}
  K.forEach((k,i)=>{const x=tlX(c,k.t);tg.fillStyle=i===S.kSel?'#ffd060':'#d0d4dc';tg.beginPath();tg.moveTo(x,4);tg.lineTo(x+6,11);tg.lineTo(x,18);tg.lineTo(x-6,11);tg.fill();
    if(k.e){tg.fillStyle='#8890a0';tg.fillText(k.e==='i'?'in':'out',x+7,16);}
    tg.fillStyle='#ffffff18';tg.fillRect(x,top,1,bot-top);});
  for(const e of c.events||[]){const x=tlX(c,e.t);tg.fillStyle='#ff6a50';tg.fillRect(x-1,top-2,2,bot-top+4);tg.fillText(e.k,x+3,bot-4);}
  const x=tlX(c,S.t);tg.fillStyle='#ffd060';tg.fillRect(x-1,0,2,H);
  const u=$('tlU');if(u)u.textContent='u '+S.t.toFixed(3);
}
{let drag=null;
  TL.addEventListener('pointerdown',e=>{const d=doc();if(!d||d.kind!=='clips')return;const c=d.data,r=TL.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    const i=c.keys.findIndex(k=>Math.abs(tlX(c,k.t)-x)<7&&y<24);
    if(i>=0){S.kSel=i;drag={i};S.t=c.keys[i].t;}else{S.kSel=-1;S.t=Math.max(c.keys[0].t,Math.min(c.keys[c.keys.length-1].t,tlU(c,x)));drag={t:1};const ki=c.keys.findIndex(k=>Math.abs(k.t-S.t)<0.012);if(ki>=0){S.kSel=ki;S.t=c.keys[ki].t;}}
    TL.setPointerCapture(e.pointerId);poseAt(S.t);drawTL();renderInsp();});
  TL.addEventListener('pointermove',e=>{if(!drag)return;const d=doc(),c=d.data,r=TL.getBoundingClientRect(),u=tlU(c,e.clientX-r.left);
    if(drag.i!==undefined){const i=drag.i,K=c.keys;if(i===0||i===K.length-1)return;   // (the first and last keys stay where they are: the ends of the clip)
      edit(C=>{const K=C.keys;K[i].t=r4(Math.max(K[i-1].t+0.005,Math.min(K[i+1].t-0.005,u)));},'tlk'+i);S.t=c.keys[i].t;}
    else S.t=Math.max(c.keys[0].t,Math.min(c.keys[c.keys.length-1].t,u));
    poseAt(S.t);drawTL();});
  TL.addEventListener('pointerup',()=>{drag=null;mergeTag=null;renderInsp();});
  TL.addEventListener('dblclick',e=>{const d=doc();if(!d)return;const r=TL.getBoundingClientRect();S.t=r4(tlU(d.data,e.clientX-r.left));addKey();});}

// ---- keys ----
addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement&&document.activeElement.tagName)&&document.activeElement.type!=='range'&&document.activeElement.type!=='checkbox';
  const c=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(c&&k==='s'){e.preventDefault();save();return;}
  if(typing)return;
  if(c&&k==='z'){e.preventDefault();undo(e.shiftKey);return;}
  if(c&&k==='y'){e.preventDefault();undo(true);return;}
  if(c&&k==='d'){e.preventDefault();dup();return;}
  if(c&&k==='c'&&doc()&&doc().kind==='clips'){copyKey();return;}
  if(c&&k==='v'&&doc()&&doc().kind==='clips'){pasteKey();return;}
  if(c)return;
  if(k==='g')setMode('translate');else if(k==='r')setMode('rotate');else if(k==='s')setMode('scale');
  else if(k==='m')mirror();else if(k==='delete'||k==='backspace')del();else if(k==='f')frameView();
  else if(k===' '){e.preventDefault();S.playing=!S.playing;renderTLBar();}
  else if(k==='k'&&doc()&&doc().kind==='clips')addKey();
  else if((k===','||k==='.')&&doc()&&doc().kind==='clips'){const C=doc().data;S.t=Math.max(C.keys[0].t,Math.min(C.keys[C.keys.length-1].t,S.t+(k===','?-1:1)*0.01));S.kSel=keyAt(C,S.t,false);poseAt(S.t);drawTL();renderInsp();}
  else if(k==='?'||k==='/')$('help').classList.toggle('show');
  else if(k==='escape'){$('help').classList.remove('show');closeDlg();}
});
addEventListener('beforeunload',e=>{for(const d of DOCS.values())if(dirty(d)||d.isNew){e.preventDefault();e.returnValue='';return;}});

// ---- the loop ----
function resize(){const r=$('viewWrap').getBoundingClientRect();R.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix();drawTL();}
addEventListener('resize',resize);
let last=performance.now();
function loop(now){
  const dt=Math.min(0.1,(now-last)/1000);last=now;
  const d=doc();
  if(S.playing&&d&&d.kind==='clips'){const K=d.data.keys,a=K[0].t,b=K[K.length-1].t;S.t+=dt*S.speed*(b-a)/1.0;
    if(S.t>b){if(S.loop)S.t=a+(S.t-b)%((b-a)||1);else{S.t=b;S.playing=false;renderTLBar();}}poseAt(S.t);drawTL();}
  orbit.update();
  const r=$('viewWrap').getBoundingClientRect();
  R.setViewport(0,0,r.width,r.height);R.setScissorTest(false);R.clear();R.render(scene,cam);
  // (the inset: the first-person model as the game frames it, the camera at its origin looking down -z)
  const showFp=!!fpView;$('inset').style.display=showFp?'block':'none';
  if(showFp){const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xdfe8ff,0x50483c,0.9));s.background=new THREE.Color(0x3a4a5a);
    const L=new THREE.DirectionalLight(0xffffff,0.6);L.position.set(1,2,1);s.add(L);s.add(fpView.vm);fpView.vm.scale.setScalar(FP_REF.scale);
    const w=300,h=190,x=r.width-w-10,y=10;R.setScissorTest(true);R.setScissor(x,y,w,h);R.setViewport(x,y,w,h);R.clear();fpCam.aspect=w/h;fpCam.updateProjectionMatrix();R.render(s,fpCam);R.setScissorTest(false);}
  requestAnimationFrame(loop);
}

// ---- start ----
async function start(){
  try{S.list=await api('/api/list');}catch(e){status('No server: run python tools/editor/serve.py and open http://localhost:8737/tools/editor/',true);return;}
  await Promise.all(S.list.weapons.map(async n=>{const d=await loadDoc('weapons',n);WDATA[n]=d.data;}));
  await Promise.all([...S.list.clips.map(n=>loadDoc('clips',n)),...(S.list.bodies||[]).map(n=>loadDoc('bodies',n))]);
  renderList();renderTLBar();resize();applySnap();status('Ready: '+S.list.weapons.length+' weapons, '+S.list.clips.length+' animations');
  $('search').oninput=e=>{S.search=e.target.value;renderList();};
  $('saveBtn').onclick=()=>save();$('saveAllBtn').onclick=saveAll;$('buildBtn').onclick=build;$('gameBtn').onclick=openGame;
  $('helpBtn').onclick=()=>$('help').classList.toggle('show');
  requestAnimationFrame(loop);
}
start();
