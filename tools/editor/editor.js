// ---- Gus Editor: models and animations, saved as the JSON files in src/assets/ that the game is built from ----
// One page, three panes: the asset browser (left), the 3D view with the timeline under it (middle) and the inspector
// (right). It reads and writes the files through tools/editor/serve.py, and builds every model and animation with
// src/js/core/assets.js, the same code the game uses as it loads, so what it shows is what the game will have.
// An open file is a doc: {kind, name, data (the file as an object), saved (its text as last read or saved), stamp (the
// server's, to catch a file changed on disk), undo, redo}. Every edit goes through edit(), which keeps undo and tells
// the live game.
'use strict';
const $=id=>document.getElementById(id);
const S={grip:true,tab:'models',kind:null,name:null,wl:'held',sel:-1,ctx:true,insp:'box',hsel:-1,msel:[],hmsel:[],t:0,playing:false,speed:1,loop:true,key:null,autoKey:true,
  snap:0.01,mode:'translate',game:null,gameOk:false,list:{weapons:[],clips:[],bodies:[],grips:[],props:[],fixtures:[],moves:[]},search:'',previewW:null,fp:true,tint:'#6b7780',groups:{}};
const DOCS=new Map();
const key=(k,n)=>k+'/'+n;
const doc=()=>S.kind?DOCS.get(key(S.kind,S.name)):null;
// ---- the editor's tabs: each shows its own kinds of file in the list, and keeps the file it had open ----
const TABS=[['models','Weapons and goblins',['weapons','clips','bodies','grips']],['props','Props',['props','fixtures']],['hippo','Hippo',['moves']],['sites','Structures',['sites']]];
const tabOf=(kind,name)=>kind==='clips'&&/^hip/.test(name||'')?'hippo':(TABS.find(t=>t[2].includes(kind))||TABS[0])[0];   // (a hippo's animations are in the Hippo tab)
const TAB_OPEN={};   // (the file each tab last had open: [kind, name])
// ---- kinds of file a module of their own edits (hippo.js, sites.js): each hook, if it has one, stands in for the
// editor's own for that kind -- open, rebuild (the view), insp and inspTabs (the inspector), toolbar, frame, tl (the
// timeline: bar, draw, and its pointer events), tick (each frame), play (may it play), step, changed, del, dup, list,
// start, message ----
const EXT={};
const ext=()=>{const d=doc();return d&&EXT[d.kind]||null;};
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
// (soft: mid-drag the view already shows the change, so it isn't made again, which would let go of what's being dragged)
function edit(f,merge,soft){
  const d=doc();if(!d)return;
  if(!(merge&&mergeTag===merge)){d.undo.push(JSON.stringify(d.data));if(d.undo.length>300)d.undo.shift();d.redo.length=0;}
  mergeTag=merge||null;f(d.data);changed(false,soft);
}
function undo(redo){const d=doc();if(!d)return;const from=redo?d.redo:d.undo,to=redo?d.undo:d.redo;if(!from.length)return;
  to.push(JSON.stringify(d.data));d.data=JSON.parse(from.pop());mergeTag=null;changed(true);}
let liveT=0;
function changed(full,soft){
  const d=doc();
  if(d&&d.kind==='weapons')WDATA[d.name]=d.data;
  if(d&&d.kind==='grips')GUN_GRIP[d.name]=d.data;   // (what gunGrip reads: the edit shows at once)
  {const X=ext();if(X&&X.changed)X.changed(d,soft);}
  if(d&&d.kind==='clips'&&d.data.layout==='hippo')hipClipLive(d);   // (hippo.js: the Hippo tab's own copy of the game takes it too)
  renderList();
  if(!soft)rebuild();else if(d&&d.kind==='clips')poseAt(S.t);   // (letting go of a drag makes the whole view again)
  if(full)renderInsp();else refreshInsp();drawTL();
  clearTimeout(liveT);liveT=setTimeout(()=>sendLive(d),120);
}

// ---- the asset browser ----
const WDATA={};   // (every weapon's file, for previews: which weapon plays which clip, what's held in it)
const LAYOUT_NAME={body:'third person',vm:'first-person swing',vr:'first-person reload',hippo:'hippo'};
function clipLayout(name){const d=DOCS.get(key('clips',name));return d?d.data.layout:assetLayoutOf(name);}
// a weapon's animations, as its fields name them (shown under it in the list, and the choices in its Stats)
const WCLIPS=[['npc','pose','Aiming pose','body'],['npc','strike','Strike up close','body'],['npc','rl','Reload','body'],['player','body','Blow (as others see it)','body'],
  ['player','swing','First person: swing','vm'],['player','rl','First person: reload','vr']];
const clipsOf=n=>{const W=WDATA[n],o=[];if(!W)return o;for(const [a,f,t] of WCLIPS){const c=W[a]&&W[a][f];if(typeof c==='string'&&c)o.push([c,t]);}return o;};
const OPEN=new Set();   // (weapons whose animations are shown under them)
const listDot=(kind,n)=>{const d=DOCS.get(key(kind,n));return d&&(dirty(d)||d.isNew)?' <span class="dirty" title="Not saved">●</span>':'';};
const listIt=(kind,n,label,sm)=>'<div class="item'+(S.kind===kind&&S.name===n?' on':'')+'" data-k="'+kind+'" data-n="'+esc(n)+'">'+esc(label)+listDot(kind,n)+'<small>'+esc(sm!==undefined?sm:label===n?'':n)+'</small></div>';
function renderList(){
  const q=S.search.toLowerCase(),hit=s=>!q||String(s||'').toLowerCase().includes(q);
  const dot=listDot,it=listIt;
  $('tabs').innerHTML=TABS.map(([k,t])=>'<button data-tab="'+k+'"'+(S.tab===k?' class="on"':'')+'>'+t+'</button>').join('');
  for(const b of $('tabs').querySelectorAll('button'))b.onclick=()=>setTab(b.dataset.tab);
  {const T=TABS.find(t=>t[0]===S.tab),X=T&&T[2].map(k=>EXT[k]).find(x=>x&&x.list);if(X){$('assetList').innerHTML=X.list(hit);
    for(const e of $('assetList').querySelectorAll('.item[data-k]'))e.onclick=()=>open(e.dataset.k,e.dataset.n);if(X.listBind)X.listBind();return;}}
  if(S.tab==='props'){let h='';
    // (props and fixtures: long lists, so their sections fold; searching opens them)
    for(const [kind,title] of [['props','Props'],['fixtures','Street fixtures']]){const names=(S.list[kind]||[]).filter(n=>hit(n)),op=!!q||S.groups[kind]!==false;
      h+='<div class="grp"><button class="tw" data-grp="'+kind+'">'+(op?'▾':'▸')+'</button><span>'+title+'</span><small>'+names.length+'</small></div>';
      if(op)for(const n of names)h+=it(kind,n,n);}
    $('assetList').innerHTML=h;
    for(const e of $('assetList').querySelectorAll('.item'))e.onclick=()=>open(e.dataset.k,e.dataset.n);
    for(const b of $('assetList').querySelectorAll('button[data-grp]'))b.onclick=()=>{const k=b.dataset.grp;S.groups[k]=S.groups[k]===false;renderList();};
    return;}
  let h='<div class="grp"><span>Weapons</span><button class="x" id="newW" title="New weapon (a copy of the one open, or the club)">+ new</button></div>';
  const used=new Set();
  for(const n of S.list.weapons){const cl=clipsOf(n);for(const [c] of cl)used.add(c);
    const wm=hit(n)||hit(WDATA[n]&&WDATA[n].name),cm=cl.filter(([c,t])=>hit(c)||hit(t));if(!wm&&!cm.length)continue;
    const op=cl.length&&(OPEN.has(n)||(!wm&&cm.length));
    h+='<div class="item'+(S.kind==='weapons'&&S.name===n?' on':'')+'" data-k="weapons" data-n="'+esc(n)+'">'+
      (cl.length?'<button class="tw" data-tw="'+esc(n)+'" title="'+(op?'Hide':'Show')+' its animations">'+(op?'▾':'▸')+'</button>':'<span class="tw"></span>')+
      esc(WDATA[n]?WDATA[n].name:n)+dot('weapons',n)+'<small>'+esc(n)+'</small></div>';
    if(op)for(const [c,t] of (wm?cl:cm))h+='<div class="item sub'+(S.kind==='clips'&&S.name===c&&S.previewW===n?' on':'')+'" data-k="clips" data-n="'+esc(c)+'" data-w="'+esc(n)+'">'+esc(t)+dot('clips',c)+'<small>'+esc(c)+'</small></div>';}
  h+='<div class="grp"><span>Gun grips (two hands)</span></div>';
  for(const n of S.list.grips||[])if(hit(n))h+=it('grips',n,n);
  h+='<div class="grp"><span>Bodies (hurtboxes)</span></div>';
  for(const n of S.list.bodies||[])if(hit(n))h+=it('bodies',n,(DOCS.get(key('bodies',n))||{data:{}}).data.name||n);
  h+='<div class="grp"><span>Other animations</span><button class="x" id="newC" title="New animation (a copy of the one open). A weapon uses it once it\'s picked in the weapon\'s Stats">+ new</button></div>';
  let none=true;for(const n of S.list.clips)if(!used.has(n)&&hit(n)&&clipLayout(n)!=='hippo'){h+=it('clips',n,n,LAYOUT_NAME[clipLayout(n)]||'');none=false;}
  if(none)h+='<div class="note" style="padding:0 6px">'+(q?'None match':'None')+'</div>';
  $('assetList').innerHTML=h;
  for(const e of $('assetList').querySelectorAll('.item'))e.onclick=()=>open(e.dataset.k,e.dataset.n,e.dataset.w);
  for(const b of $('assetList').querySelectorAll('button[data-tw]'))b.onclick=ev=>{ev.stopPropagation();const n=b.dataset.tw;if(OPEN.has(n))OPEN.delete(n);else OPEN.add(n);renderList();};
  $('newW').onclick=()=>newAsset('weapons');$('newC').onclick=()=>newAsset('clips');
}
// switching tabs: the list shows that tab's files, and the file it last had open comes back (or nothing)
const EMPTY_TXT={models:'Pick a weapon or an animation on the left.',props:'Pick a prop or a street fixture on the left.',hippo:'Pick a move on the left.',sites:'Pick a structure on the left.'};
function setTab(t){if(S.tab===t)return;if(S.kind)TAB_OPEN[S.tab]=[S.kind,S.name];S.tab=t;S.search='';$('search').value='';
  const o=TAB_OPEN[t];if(o)return open(o[0],o[1]);
  S.kind=null;S.name=null;S.playing=false;gizmo.detach();$('empty').style.display='';$('empty').textContent=EMPTY_TXT[t]||'';
  renderList();renderToolbar();renderInsp();rebuild();tlShow();status('');}
async function open(kind,name,w){
  try{await loadDoc(kind,name);}catch(e){return status('Could not open '+name+': '+e.message,true);}
  S.tab=tabOf(kind,name);
  S.kind=kind;S.name=name;S.sel=-1;S.hsel=-1;S.key=null;mergeTag=null;S.playing=false;renderTLBar();
  if(kind==='clips'){S.t=1;S.previewW=w||weaponFor(name);S.insp='clip';if(w)OPEN.add(w);}
  else if(kind==='bodies')S.insp='hit';
  else if(kind==='grips')S.insp='stats';
  else if(flatKind(kind)){S.insp='box';if(S.mode==='rotate')setMode('translate');}
  else if(!['box','stats','hit'].includes(S.insp))S.insp='box';
  {const X=EXT[kind];if(X&&X.open)X.open(doc());}
  $('empty').style.display='none';
  renderList();renderToolbar();renderInsp();rebuild();frameView();
  tlShow();
  status(({weapons:'Weapon ',bodies:'Body ',grips:'Grip ',props:'Prop ',fixtures:'Fixture ',moves:'Move ',sites:'Structure '}[kind]||'Animation ')+name);
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
  await open(kind,name);status('New '+(kind==='weapons'?'weapon':'animation')+' '+name+(kind==='weapons'?' (Build before Open game)':''));
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
  S.game=window.open('/game/index.html?editor','gsg-editor-game');S.gameOk=false;$('gameDot').className='';status('Opening the game…');
}
addEventListener('message',e=>{
  if(e.origin!==location.origin||!e.data)return;
  {for(const k in EXT)if(EXT[k].message&&EXT[k].message(e))return;}
  if(e.data.type==='gsg-ready'){S.gameOk=true;$('gameDot').className='on';status('Game connected');for(const d of DOCS.values())if(dirty(d))sendLive(d);}
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
const orbit=new THREE.OrbitControls(cam,R.domElement);orbit.target.set(0,0.4,0);orbit.enableDamping=false;   // (no drift after letting go)
const gizmo=new THREE.TransformControls(cam,R.domElement);gizmo.setSize(0.8);scene.add(gizmo);
// (in its own frame: this TransformControls draws the move and tilt handles along the thing's own axes whatever the space, but
// in 'world' it moved it along the world's, so a tilted model went off sideways from the arrow dragged; snapping then
// also rounds the numbers the file keeps)
gizmo.setSpace('local');
// (while dragging, the dragged thing moves itself and only the file follows; letting go makes everything again from the file)
gizmo.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value;if(!e.value){mergeTag=null;rebuild();renderInsp();}});
let content=new THREE.Group();scene.add(content);
const MATS={};
const matOf=(c,wire)=>{const k=c+(wire?'w':'');return MATS[k]||(MATS[k]=wire?new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.7}):new THREE.MeshLambertMaterial({color:c}));};
const ROLE_COL={'@club':0x7a5530,'@pole':0x3a3f45,'@lamp':0xffe6a8};
const colOf=c=>c==='@tint'?parseInt(S.tint.slice(1),16):c in ROLE_COL?ROLE_COL[c]:parseInt(c.slice(1),16);
const glowOf=b=>!!b.glow||b.c==='@lamp';
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
// ---- a weapon's model: one shared shape (model.boxes), and each view (held, view, drop, stow) either that shape placed
// ({at}) or a version of its own ({at, own}: at kept for going back). assetList in core/assets.js is how the game reads it ----
// how view j is drawn: 'shared', 'own' or 'none'
// (a prop or a street fixture: one list of plain boxes, W.boxes, never tilted)
const flatKind=k=>k==='props'||k==='fixtures',flatDoc=()=>{const d=doc();return !!d&&flatKind(d.kind);};
function viewMode(W,j){if(W&&Array.isArray(W.boxes))return 'own';const v=W&&W.model&&W.model[j];return !v?'none':Array.isArray(v)||v.own?'own':'shared';}
// the boxes view j shows, placed, as the game has them
const viewList=(W,j)=>W&&Array.isArray(W.boxes)?W.boxes:(W&&W.model&&assetList(W.model,j))||[];
// the boxes an edit to view j changes: the shared shape's (in its own frame) or the view's own (make: give it one first)
function editList(W,j,make){
  if(Array.isArray(W.boxes))return W.boxes;
  if(!W.model){if(!make)return [];W.model={};}
  const M=W.model;let v=M[j];
  // (a new first-person view starts turned as every hand-held weapon's is: a club's head up the screen, a gun's barrel
  // into it and its grip down; tools/assets/share_models.js, VIEW_TURN)
  if(!v){if(!make)return [];M.boxes=M.boxes||[];v=M[j]={at:j==='view'?{p:[0,-0.1,-0.5],r:[1.5708,3.1416,0]}:{p:[0,0,0]}};}
  return Array.isArray(v)?v:v.own?v.own:(M.boxes=M.boxes||[]);
}
// a group placing the shared shape as at says (moved, turned XYZ, scaled: the same sums as assetPlace)
function placeGroup(g,at){at=at||{};g.position.set(...(at.p||[0,0,0]));g.rotation.set(...(at.r||[0,0,0]));g.scale.setScalar(at.k||1);return g;}
// the first-person view's model, as gobKit builds it: the arm, and the weapon's view boxes in it (tags in groups of their
// own). A shared view's boxes go in a placing group (one per tag group, all alike: pgs), so editing one edits the shape
function fpRig(W){
  const vm=new THREE.Group();vm.scale.setScalar(FP_REF.scale);vm.rotation.order='YXZ';
  const arm=new THREE.Group();vm.add(arm);arm.add(boxMesh(FP_REF.arm));
  const mode=viewMode(W,'view'),v=mode!=='none'&&W.model.view,L=mode==='none'?[]:mode==='shared'?(W.model.boxes||[]):Array.isArray(v)?v:v.own;
  const tags={},meshes=[],pgs=[],tin={};
  const into=g=>{if(mode!=='shared')return g;const p=placeGroup(new THREE.Group(),v.at);g.add(p);pgs.push(p);return p;};
  const base=into(arm);
  L.forEach((b,i)=>{let to=base;if(b.tag){if(!tin[b.tag]){tags[b.tag]=new THREE.Group();arm.add(tags[b.tag]);tin[b.tag]=into(tags[b.tag]);}to=tin[b.tag];}
    const m=boxMesh(b);m.userData.i=i;to.add(m);meshes.push(m);});
  const F=W&&W.model&&W.model.fore;
  if(F){const P=F.p,Sx=F.r,d=[Sx[0]-P[0],Sx[1]-P[1],Sx[2]-P[2]],len=Math.hypot(...d),b=new THREE.Mesh(UNIT,matOf(colOf(FP_REF.arm.c)));
    b.scale.set(0.11,0.11,len);b.position.set((P[0]+Sx[0])/2,(P[1]+Sx[1])/2,(P[2]+Sx[2])/2);b.rotation.order='YXZ';b.rotation.set(-Math.asin(d[1]/len),Math.atan2(d[0],d[2]),0);
    (W.model.foreTag&&tags[W.model.foreTag]||arm).add(b);}
  return {vm,arm,tags,meshes,pgs};
}
let pickable=[],posed=null,fpView=null,hitMeshes=[],curPgs=[];
// ---- selecting more than one: S.sel / S.hsel is the one last picked (its numbers are what the inspector shows), and
// S.msel / S.hmsel every one picked, once more than one is (a plain click or anything else setting S.sel goes back to one,
// since the list then no longer has it in) ----
const selK=()=>S.insp==='hit'?'hsel':'sel',mselK=()=>S.insp==='hit'?'hmsel':'msel';
function selList(){const i=S[selK()],M=S[mselK()];return i<0?[]:M.includes(i)?M.slice():[i];}
// (add: Shift held, so i joins the selection, or leaves it if it was in)
function pickSel(i,add){const k=selK();if(!add||S[k]<0){S[k]=i;S[mselK()]=[];return;}if(i<0)return;
  const L=selList(),j=L.indexOf(i);if(j>=0){L.splice(j,1);S[k]=L.length?L[L.length-1]:-1;}else{L.push(i);S[k]=i;}S[mselK()]=L.length>1?L:[];}
// (more than one picked: the handles go on a pivot at their middle, holding them, and each is put back into the file from
// where it ends up in its own parent's frame)
let pivot=null;
function attachSel(){pivot=null;const ms=selList().map(i=>pickable[i]).filter(Boolean);if(!ms.length)return;
  if(ms.length===1)return gizmo.attach(ms[0]);
  content.updateMatrixWorld(true);const c=new THREE.Vector3(),v=new THREE.Vector3();for(const m of ms)c.add(m.getWorldPosition(v));c.divideScalar(ms.length);
  pivot=new THREE.Group();pivot.position.copy(c);content.add(pivot);pivot.updateMatrixWorld(true);
  pivot.userData.items=ms.map(m=>({m,par:m.parent}));for(const m of ms)pivot.attach(m);gizmo.attach(pivot);}
// (where a picked mesh is in its own parent's frame, as a stand-in with position, rotation and scale)
function inParent(it){const M=new THREE.Matrix4().copy(it.par.matrixWorld).invert().multiply(it.m.matrixWorld),o={position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),scale:new THREE.Vector3(),userData:it.m.userData};
  M.decompose(o.position,o.quaternion,o.scale);o.rotation=new THREE.Euler().setFromQuaternion(o.quaternion,it.m.rotation.order);return o;}
// make the view again from the open file
function rebuild(){
  gizmo.detach();scene.remove(content);content=new THREE.Group();scene.add(content);pickable=[];posed=null;fpView=null;hitMeshes=[];curPgs=[];
  const d=doc();grid.visible=grid1.visible=axes.visible=true;if(!d){hud('');return;}
  {const X=ext();grid.visible=grid1.visible=axes.visible=!(X&&X.noGrid);if(X&&X.rebuild){X.rebuild(d);return;}}
  if(d.kind==='bodies'){buildHit(d.data);return;}
  if(d.kind==='grips'){buildGrip(d.name);return;}
  if(flatKind(d.kind)){buildFlat(d);return;}
  if(d.kind==='weapons'){
    const W=d.data,mode=viewMode(W,S.wl);
    if(S.insp==='hit'){buildHit(W);return;}
    let par=content;
    if(S.wl==='held'){if(S.ctx){const J=goblin(true);content.add(J.root);const ac=aimClip(W);if(ac)poseBody(J,ac,1,W);else J.arm.rotation.x=-1.2;par=J.hand;}}
    else if(S.wl==='stow'){if(S.ctx){const J=goblin(true);content.add(J.root);par=J.root;}}
    if(S.wl==='view'){const F=fpRig(W);content.add(F.vm);F.vm.scale.setScalar(1);fpPose(F,W,null,0);pickable=F.meshes;curPgs=F.pgs;fpView=fpRig(W);fpPose(fpView,W,null,0);}
    else if(mode!=='none'){let to=par;
      if(mode==='shared'){to=placeGroup(new THREE.Group(),W.model[S.wl].at);par.add(to);curPgs=[to];}
      editList(W,S.wl).forEach((b,i)=>{const m=boxMesh(b);m.userData.i=i;to.add(m);pickable.push(m);});}
    // (S.sel -2: the whole shared model, placed for this view)
    if(S.sel===-2&&curPgs[0]){const g=curPgs[0];g.userData.place=true;g.userData.k=g.scale.x;gizmo.attach(g);}
    else if(S.sel>=0){for(const i of selList())if(pickable[i])outline(pickable[i]);attachSel();}
    budget(viewList(W,S.wl),mode);
  }else{
    const c=d.data,W=WDATA[S.previewW];
    if(c.layout==='hippo'){posed=hipClipRig();if(posed)poseAt(S.t);hud(posed?'':'Starting the game to get the hippo…');return;}
    if(c.layout==='body'){const J=goblin(false);content.add(J.root);
      for(const b of viewList(W,'held'))J.hand.add(boxMesh(b));
      if(W&&W.hit)drawHits(W.hit,J.root,true);
      posed={k:'body',J};}
    else{const F=fpRig(W);content.add(F.vm);F.vm.scale.setScalar(1);fpView=fpRig(W);posed={k:c.layout,F,W};}
    poseAt(S.t);hud('');
  }
}
// a prop or fixture: its boxes (glowing ones unlit, as the game draws them), a goblin beside it for size, and a fixture's
// spots as outlines of what goes there
const SPOT_SHAPE={head:[0.46,1.2,0.38],face:[0.95,0.95,0.02],ad:[7.7,3.7,0.3]};
const SPOT_MAT=new THREE.MeshBasicMaterial({color:0x8fd0ff,wireframe:true,depthTest:false,transparent:true,opacity:0.8});
function buildFlat(d){
  const W=d.data,L=W.boxes||[];
  L.forEach((b,i)=>{const m=boxMesh(b);if(glowOf(b))m.material=new THREE.MeshBasicMaterial({color:colOf(b.c)});m.userData.i=i;content.add(m);pickable.push(m);});
  for(const k in W.spots||{}){const z=SPOT_SHAPE[k]||[0.3,0.3,0.3],m=new THREE.Mesh(UNIT,SPOT_MAT);m.renderOrder=8;m.scale.set(...z);m.position.set(...W.spots[k]);content.add(m);}
  if(S.ctx){let x0=0;for(const b of L)x0=Math.min(x0,b.p[0]-b.s[0]/2);const J=goblin(true);J.root.position.x=x0-0.6;content.add(J.root);}
  if(S.sel>=0){for(const i of selList())if(pickable[i])outline(pickable[i]);attachSel();}
  hud(L.length+' box'+(L.length===1?'':'es'));
}
function outline(m){const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xffd060,depthTest:false}));e.renderOrder=9;m.add(e);}
function budget(L,mode){
  const tri={box:12,cyl:40,cone:20,sphere:100,wedge:8},sh=new Set(L.map(b=>b.sh||'box'));
  const t=L.reduce((a,b)=>a+(tri[b.sh||'box']||12),0);
  if(mode==='none')return hud('No model');
  hud(L.length+' boxes · '+t+' triangles · '+sh.size+' shape'+(sh.size>1?'s':'')+' · '+(mode==='shared'?'the shared model':'a version of its own')+(sh.has('sphere')?'\nspheres cost the most triangles':''));
}
function hud(t){$('hud').textContent=t;}

// ---- poses: the same sums the game does (strikeAt in strikes.js; gobCamera and gobViewGun in pivots.js) ----
let POSE_OVR=null;   // (posing by dragging tries values out: {c, v} poses clip c with v in place of its keys)
const clipAt=(c,u)=>POSE_OVR&&POSE_OVR.c===c?POSE_OVR.v.slice():assetPoseAt(c,u);   // (each channel from its own keys: core/assets.js)
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
  if(hitTL())return hitPoseAt(u);
  const d=doc();if(!posed||!d||d.kind!=='clips')return;const c=d.data;
  if(posed.k==='body')poseBody(posed.J,c,u,WDATA[S.previewW],/^rl/.test(d.name));
  else if(posed.k==='hippo')hipClipPose(posed,c,u);
  else{fpPose(posed.F,posed.W,c,u);fpPose(fpView,posed.W,c,u);}
}
// a goblin posed by a body clip at u, as gobStrike does, then (with the toggle on, for a gun) both hands put on the gun
// as the game does just before drawing it (gunGrip, src/js/enemies/grip.js, loaded as it is). Not while reloading (rl):
// the game lets go of the grip for a reload
function poseBody(J,c,u,W,reload){
  const v=clipAt(c,u);
  J.arm.position.set(0.32,0.92,0);J.armL.position.set(-0.32,0.92,0);J.head.rotation.set(0,0,0);J.hand.rotation.set(v[2],0,0);J.armL.rotation.set(v[3],0,0);
  J.arm.rotation.set(v[0],0,v[1]);J.root.rotation.set(v[5],v[4],0);J.root.position.set(0,0,v[6]||0);
  const k=W&&W.npc&&W.npc.aim;
  if(S.grip&&k&&!reload&&GUN_GRIP[k]){J.arm.hand=J.hand;gunGrip(J,J.root,k);}
}
// the toggle: both hands on the gun as the game puts them, or the pose as the animation alone has it
const gripChk=()=>'<label title="Two-handed grip before drawing"><input type="checkbox" id="gripChk"'+(S.grip?' checked':'')+'> Two hands on the gun</label>';
// a grip on show: a goblin with each gun that uses it, aiming (its pose at the blow) and carried (the pose's start)
function buildGrip(k){
  const ws=S.list.weapons.filter(n=>WDATA[n]&&WDATA[n].npc&&WDATA[n].npc.aim===k);let x=0;
  for(const n of ws.length?ws:[]){const W=WDATA[n],ac=aimClip(W);if(!ac)continue;
    for(const u of [0,1]){const J=goblin(false);J.root.position.x=0;for(const b of viewList(W,'held'))J.hand.add(boxMesh(b));
      const g=new THREE.Group();g.position.x=x;g.add(J.root);content.add(g);poseBody(J,ac,u,W);x+=1.1;}}
  if(S.grip)gripStatus(k,ws);else hud('');
  if(!ws.length)hud('No weapon uses this grip');
}
function gripStatus(k,ws){hud(ws.map(n=>WDATA[n].name).join(', ')+'\neach gun carried, then aimed');}
// a weapon's aiming pose (its npc.pose clip), for showing it held
const aimClip=W=>{const n=W&&W.npc&&W.npc.pose,d=n&&DOCS.get(key('clips',n));return d?d.data:null;};

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
  const J=goblin(true);content.add(J.root);hitPose=null;
  const bc=body?null:hitBlow(W);
  if(!body){if(bc)poseBody(J,bc,S.t,W,false);else J.arm.rotation.x=-1.2;for(const b of viewList(W,'held'))J.hand.add(boxMesh(b,true));
    // (the built-in hit, for reference: everything within r of a point reach ahead, a little below to well above the feet)
    if(W.r&&W.reach){const ref=hitMesh({k:'capsule',p:[0,0.25,W.reach],r:W.r,h:5.5},0x60a0ff,true);ref.material.opacity=0.35;content.add(ref);}
    // (a goblin where the blow lands, facing back, with its hurtboxes)
    const T=goblin(true),z=(W.reach||1)+0.3;T.root.position.z=z;T.root.rotation.y=Math.PI;content.add(T.root);
    const tg=new THREE.Group();tg.position.z=z;tg.rotation.y=Math.PI;content.add(tg);for(const s of goblinHurt())tg.add(hitMesh(s,0x50c0ff,true));}
  const H=(W.hit&&W.hit[set])||[];
  H.forEach((s,i)=>{const m=hitMesh(s,selList().includes(i)?0xffd060:col,false);m.userData.i=i;(!body&&s.on==='hand'?J.hand:content).add(m);pickable.push(m);
    const w=new THREE.Mesh(m.geometry,new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true}));m.add(w);m.userData.w=w;});
  hitMeshes=pickable;
  if(bc){hitPose={J,c:bc,W};hitLive(S.t);}
  if(S.hsel>=0)attachSel();
  hud(body?H.length+' hurtbox'+(H.length===1?'':'es'):
    H.length+' hitbox'+(H.length===1?'':'es')+(H.length?'':' (built-in hit in blue)'));
}
// ---- a weapon's hitboxes on the timeline of its blow (the one Gnash's third person swings: gobBodyPose) ----
const hitBlowName=W=>W&&(W.player&&W.player.body||W.npc&&W.npc.strike)||'club';
const hitBlow=W=>{const d=DOCS.get(key('clips',hitBlowName(W)));return d&&d.data.layout==='body'?d.data:null;};
// (the timeline is a weapon's hitboxes', on its Hitboxes tab)
const hitTL=()=>{const d=doc();return !!d&&d.kind==='weapons'&&S.insp==='hit';};
function tlShow(){const d=doc(),X=ext();$('timeline').classList.toggle('show',!!d&&(X?!!(X.tl&&(!X.tlOn||X.tlOn(d))):d.kind==='clips'||hitTL()));renderTLBar();resize();drawTL();}
let hitPose=null;
// is a hitbox live at u? (one without a span: only as the blow lands)
const hitIsLive=(s,u)=>s.t?u>=s.t[0]-1e-6&&u<=s.t[1]+1e-6:Math.abs(u-1)<0.02;
function hitLive(u){const d=doc();if(!d||!d.data.hit)return;const H=d.data.hit.hitboxes||[];
  pickable.forEach((m,i)=>{const s=H[i];if(!s||!m.userData.w)return;const on=hitIsLive(s,u);m.material.opacity=on?0.32:0.04;m.userData.w.material.opacity=on?0.9:0.25;});}
function hitPoseAt(u){if(!hitPose)return;poseBody(hitPose.J,hitPose.c,u,hitPose.W,false);hitLive(u);}

// gizmo -> the file
gizmo.addEventListener('objectChange',()=>{
  const o=gizmo.object;if(!o)return;
  if(o.userData.items){o.updateMatrixWorld(true);const os=o.userData.items.map(inParent);
    edit(W=>{for(const x of os)(S.insp==='hit'?putHit:putBox)(W,x);},'giz',true);return;}
  if(S.insp==='hit'){edit(W=>putHit(W,o),'giz',true);return;}
  if(o.userData.place){
    // (the whole shared model: one size, so the handle pulled furthest sets it)
    const k0=o.userData.k,sc=[o.scale.x,o.scale.y,o.scale.z];let k=sc.reduce((a,v)=>Math.abs(v-k0)>Math.abs(a-k0)?v:a,k0);k=r4(Math.max(0.01,Math.abs(k)));
    o.scale.setScalar(k);o.userData.k=k;
    for(const g of curPgs)if(g!==o){g.position.copy(o.position);g.rotation.copy(o.rotation);g.scale.copy(o.scale);}
    edit(W=>{const v=W.model[S.wl],at={p:[o.position.x,o.position.y,o.position.z].map(r4)};const rr=[o.rotation.x,o.rotation.y,o.rotation.z].map(r4);
      if(rr.some(x=>x))at.r=rr;if(k!==1)at.k=k;v.at=at;},'giz',true);return;}
  edit(W=>putBox(W,o),'giz',true);
});
// (a moved box or hit shape back into the file, from its mesh (or a stand-in) in its parent's frame)
function putBox(W,o){const b=editList(W,S.wl)[o.userData.i];b.p=[r4(o.position.x),r4(o.position.y),r4(o.position.z)];
  b.s=[o.scale.x,o.scale.y,o.scale.z].map(v=>r4(Math.max(0.005,Math.abs(v))));
  const rr=[o.rotation.x,o.rotation.y,o.rotation.z].map(r4);if(rr.some(v=>v)&&!Array.isArray(W.boxes))b.r=rr;else delete b.r;}
function putHit(W,o){const s=W.hit[hitSet()][o.userData.i];s.p=[r4(o.position.x),r4(o.position.y),r4(o.position.z)];
  if(s.k==='box')s.s=[o.scale.x,o.scale.y,o.scale.z].map(v=>r4(Math.max(0.005,Math.abs(v))));
  else if(s.k==='sphere')s.r=r4(Math.max(0.01,Math.abs(o.scale.x)));else{s.r=r4(Math.max(0.01,Math.abs(o.scale.x)));s.h=r4(Math.max(0,Math.abs(o.scale.y)));}
  const rr=[o.rotation.x,o.rotation.y,o.rotation.z].map(r4);if(rr.some(v=>v))s.rot=rr;else delete s.rot;}
// picking: a click (not a drag) on a box selects it
{let down=null;
  R.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
  R.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4||gizmo.dragging)return;down=null;
    const r=R.domElement.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(m,cam);
    const hit=ray.intersectObjects(pickable,false)[0];const i=hit?hit.object.userData.i:-1;
    pickSel(i,e.shiftKey);rebuild();renderInsp();});}
function frameView(){
  const d=doc();if(!d)return;
  {const X=ext();if(X&&X.frame){X.frame(d);orbit.update();return;}}
  if(d.kind==='grips'){orbit.target.set(2.2,0.7,0);cam.position.set(-1.4,1.9,4.4);}   // (from in front and to the side: an aimed gun points at a viewer straight ahead)
  else if(d.kind==='clips'&&d.data.layout==='hippo'){orbit.target.set(0,1.2,0.3);cam.position.set(5.2,3.2,5.6);}
  else if(S.insp==='hit'){orbit.target.set(0,0.6,0.8);cam.position.set(4.2,3,-1.6);}
  else if(!flatKind(d.kind)&&(d.kind==='clips'&&d.data.layout==='body'||S.ctx&&(S.wl==='held'||S.wl==='stow'))){orbit.target.set(0,0.65,0.2);cam.position.set(2.2,1.4,2.4);}
  else if(!flatKind(d.kind)&&(d.kind==='clips'||S.wl==='view')){orbit.target.set(0.3,-0.4,-0.6);cam.position.set(1.6,0.4,0.6);}
  else{const L=viewList(d.data,S.wl);const bb=new THREE.Box3();for(const b of L){bb.expandByPoint(new THREE.Vector3(b.p[0]-b.s[0]/2,b.p[1]-b.s[1]/2,b.p[2]-b.s[2]/2));bb.expandByPoint(new THREE.Vector3(b.p[0]+b.s[0]/2,b.p[1]+b.s[1]/2,b.p[2]+b.s[2]/2));}
    const c=bb.isEmpty()?new THREE.Vector3():bb.getCenter(new THREE.Vector3()),sz=Math.max(0.6,bb.getSize(new THREE.Vector3()).length());
    orbit.target.copy(c);cam.position.set(c.x+sz*1.1,c.y+sz*0.7,c.z+sz*1.3);}
  orbit.update();
}

// ---- the toolbar over the view ----
function renderToolbar(){
  const d=doc();let h='';
  if(!d){$('toolbar').innerHTML='';return;}
  {const X=ext();if(X&&X.toolbar){$('toolbar').innerHTML=X.toolbar(d)+'<span class="grow"></span><button id="frameBtn" title="Frame the view (F)">Frame</button>';$('frameBtn').onclick=frameView;if(X.toolbarBind)X.toolbarBind(d);return;}}
  if(d.kind==='weapons'&&S.insp!=='hit'){
    const L=[['held','Held'],['view','First person'],['drop','Dropped'],['stow','Put away']];
    h+=L.map(([k,t])=>{const m=viewMode(d.data,k);return '<button data-wl="'+k+'" class="'+(S.wl===k?'on':'')+(m==='none'?' none':'')+'" title="'+
      (m==='none'?'This weapon has none: the inspector can add one':m==='shared'?'The shared model, placed for this view':'A version of its own, not the shared model')+'">'+t+(m==='own'?' <small>own</small>':'')+'</button>';}).join('');
    h+='<span class="sep"></span>';
    h+=[['translate','Move (G)'],['rotate','Tilt (R)'],['scale','Size (S)']].map(([k,t])=>'<button data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+t+'</button>').join('');
    h+='<label>Snap <select id="snapSel">'+[['0','off'],['0.005','0.005'],['0.01','0.01'],['0.0625','1/16'],['0.1','0.1']].map(([v,t])=>'<option value="'+v+'"'+(+v===S.snap?' selected':'')+'>'+t+'</option>').join('')+'</select></label>';
    if(S.wl==='held'||S.wl==='stow')h+='<label><input type="checkbox" id="ctxChk"'+(S.ctx?' checked':'')+'> On a goblin</label>';
    if(S.wl==='held'&&d.data.npc&&d.data.npc.aim)h+=gripChk();
  }else if(flatKind(d.kind)){
    h+=[['translate','Move (G)'],['scale','Size (S)']].map(([k,t])=>'<button data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+t+'</button>').join('');
    h+='<label>Snap <select id="snapSel">'+[['0','off'],['0.005','0.005'],['0.01','0.01'],['0.0625','1/16'],['0.1','0.1']].map(([v,t])=>'<option value="'+v+'"'+(+v===S.snap?' selected':'')+'>'+t+'</option>').join('')+'</select></label>';
    h+='<label><input type="checkbox" id="ctxChk"'+(S.ctx?' checked':'')+'> Goblin</label>';
    if(d.kind==='props')h+='<label title="The tint is picked where each one is placed">Tint <input type="color" id="tintIn" value="'+S.tint+'"></label>';
  }else if(d.kind==='grips'){
    h+=gripChk();
  }else if(d.kind!=='clips'){
    h+=[['translate','Move (G)'],['rotate','Tilt (R)'],['scale','Size (S)']].map(([k,t])=>'<button data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+t+'</button>').join('');
  }else if(d.data.layout!=='hippo'){
    if(d.data.layout==='body')h+=gripChk();
    h+='<label>Shown with <select id="pwSel">'+S.list.weapons.map(n=>'<option value="'+n+'"'+(n===S.previewW?' selected':'')+'>'+esc(WDATA[n]?WDATA[n].name:n)+'</option>').join('')+'</select></label>';
  }
  h+='<span class="grow"></span><button id="frameBtn" title="Frame the view (F)">Frame</button>';
  $('toolbar').innerHTML=h;
  for(const b of $('toolbar').querySelectorAll('[data-wl]'))b.onclick=()=>{S.wl=b.dataset.wl;S.sel=-1;renderToolbar();renderInsp();rebuild();frameView();};
  for(const b of $('toolbar').querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
  if($('snapSel'))$('snapSel').onchange=e=>{S.snap=+e.target.value;applySnap();};
  if($('gripChk'))$('gripChk').onchange=e=>{S.grip=e.target.checked;rebuild();};
  if($('ctxChk'))$('ctxChk').onchange=e=>{S.ctx=e.target.checked;S.sel=-1;rebuild();frameView();};
  if($('tintIn'))$('tintIn').oninput=e=>{S.tint=e.target.value;rebuild();renderInsp();};
  if($('pwSel'))$('pwSel').onchange=e=>{S.previewW=e.target.value;rebuild();};
  $('frameBtn').onclick=frameView;
}
function setMode(m){if(m==='rotate'&&flatDoc())return;S.mode=m;gizmo.setMode(m);renderToolbar();}
function applySnap(fine){const s=S.snap*(fine?0.25:1);gizmo.setTranslationSnap(s||null);gizmo.setScaleSnap(s||null);gizmo.setRotationSnap(S.snap?Math.PI/(fine?72:24):null);}
addEventListener('keydown',e=>{if(e.key==='Shift')applySnap(true);});addEventListener('keyup',e=>{if(e.key==='Shift')applySnap(false);});

// ---- the inspector ----
const num=(v,id,step=0.01)=>'<input type="number" step="'+step+'" id="'+id+'" value="'+(v??'')+'">';
const v3=(v,id)=>'<span class="v3">'+[0,1,2].map(j=>num(v?v[j]:0,id+j)).join('')+'</span>';
function renderInsp(){
  const d=doc();
  {const X=ext();if(X&&X.insp){const T=X.inspTabs?X.inspTabs(d):[];
    $('inspTabs').innerHTML=T.map(([k,t])=>'<button class="'+(S.insp===k?'on':'')+'" data-t="'+k+'">'+t+'</button>').join('');
    for(const b of $('inspTabs').querySelectorAll('button'))b.onclick=()=>{S.insp=b.dataset.t;renderToolbar();renderInsp();rebuild();tlShow();};
    return X.insp($('inspBody'),d);}}
  const tabs=!d?[]:flatKind(d.kind)?[['box','Boxes']]:d.kind==='weapons'?[['box','Boxes'],['stats','Stats'],['hit','Hitboxes']]:d.kind==='bodies'?[['hit','Hurtboxes']]:d.kind==='grips'?[['stats','Numbers']]:[['clip','Animation']];
  $('inspTabs').innerHTML=tabs.map(([k,t])=>'<button class="'+(S.insp===k?'on':'')+'" data-t="'+k+'">'+t+'</button>').join('');
  for(const b of $('inspTabs').querySelectorAll('button'))b.onclick=()=>{S.insp=b.dataset.t;S.sel=-1;S.hsel=-1;S.playing=false;if(hitTL())S.t=1;renderToolbar();renderInsp();rebuild();frameView();tlShow();};
  const B=$('inspBody');if(!d){B.innerHTML='';return;}
  if(d.kind==='clips')return renderClipInsp(B,d);
  if(S.insp==='stats')return renderStats(B,d);
  if(S.insp==='hit')return renderHitInsp(B,d);
  if(flatKind(d.kind))return renderFlatInsp(B,d);
  renderBoxInsp(B,d);
}
// (only the values: a re-render of the whole inspector would lose focus mid-typing)
function refreshInsp(){
  const d=doc();if(!d)return;const a=document.activeElement;
  // (a slider being dragged is left alone too: drawing it again would drop it from under the mouse)
  if(a&&$('inspBody').contains(a)&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')&&a.type!=='checkbox')return;
  renderInsp();
}
function renderBoxInsp(B,d){
  const W=d.data,j=S.wl,mode=viewMode(W,j),L=editList(W,j),b=L[S.sel],sl=selList();
  const VN={held:'held',view:'first-person',drop:'dropped',stow:'put away'}[j],deg=r=>(r||[0,0,0]).map(v=>+(v*180/Math.PI).toFixed(2));
  const sharing=ASSET_LISTS.filter(k=>viewMode(W,k)==='shared').map(k=>({held:'held',view:'first person',drop:'dropped',stow:'put away'}[k]));
  let h='<h3>This view</h3>';
  if(mode==='shared'){const at=W.model[j].at||{};
    h+='<p class="note">Shared with: '+esc(sharing.join(', '))+'</p>'+
      '<div class="row"><label>Place</label>'+v3(at.p||[0,0,0],'ap')+'</div><div class="row"><label>Tilt (degrees)</label>'+v3(deg(at.r),'ar')+'</div><div class="row"><label>Size</label>'+num(at.k??1,'ak')+'</div>'+
      '<div class="row"><button id="plSel" class="'+(S.sel===-2?'on':'')+'" title="Drag the whole model with the handles">Move the whole model</button><button id="mkOwn" title="Give this view a version of its own, starting from the shared model as placed here">Make unique</button></div>';}
  else if(mode==='own')h+='<div class="row"><button id="useShared"'+(W.model.boxes&&W.model.boxes.length?'':' disabled')+' title="Drop this version and use the shared model again, placed as it was last">Use the shared model</button></div>';
  else h+='<div class="row"><button id="addView">Add model</button></div>';
  if(mode!=='none')h+='<h3>'+(mode==='shared'?'Shared model\'s boxes':'Its own boxes')+'</h3>';
  if(mode!=='none')h+='<div class="row"><button id="addBox">+ Box</button><button id="dupBox"'+(b?'':' disabled')+'>Duplicate</button><button id="mirBox"'+(b?'':' disabled')+' title="A copy on the other side (x flipped)">Mirror</button><button id="delBox"'+(b?'':' disabled')+'>Delete</button></div>';
  if(mode!=='none')h+='<div class="list" id="boxList">'+L.map((x,i)=>'<div class="item'+(sl.includes(i)?' on':'')+'" data-i="'+i+'"><span style="color:'+(x.c==='@club'?'#7a5530':x.c)+'">■</span> '+esc(x.role||x.tag||(x.sh&&x.sh!=='box'?x.sh:'box'))+' <small>'+x.s.map(v=>+v.toFixed(3)).join(' × ')+'</small></div>').join('')+'</div>';
  if(b){
    h+=sl.length>1?'<p class="note">'+sl.length+' picked</p>':'';h+='<h3>Box '+(S.sel+1)+'</h3>';
    h+='<div class="row"><label>Size</label>'+v3(b.s,'bs')+'</div><div class="row"><label>Place</label>'+v3(b.p,'bp')+'</div><div class="row"><label>Tilt (degrees)</label>'+v3((b.r||[0,0,0]).map(v=>+(v*180/Math.PI).toFixed(2)),'br')+'</div>';
    h+='<div class="row"><label>Shape</label><select id="bsh">'+ASSET_SHAPES.map(s=>'<option'+((b.sh||'box')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></div>';
    const isRole=b.c[0]==='@';
    h+='<div class="row"><label>Colour</label><input type="color" id="bc" value="'+(isRole?'#7a5530':b.c)+'"'+(isRole?' disabled':'')+'><label style="width:auto"><input type="checkbox" id="brole"'+(isRole?' checked':'')+'> club colour</label></div>';
    if(S.wl==='held'||S.wl==='stow')h+='<div class="row"><label>Part name</label><input id="brl" value="'+esc(b.role||'')+'" placeholder="e.g. blade"></div>';
    if(S.wl==='view')h+='<div class="row"><label>Draw order</label>'+num(b.o,'bo',1)+'</div><div class="row"><label>Moves as</label><select id="btag">'+['','mag','load','bolt','pump','slide'].map(t=>'<option value="'+t+'"'+((b.tag||'')===t?' selected':'')+'>'+(t||'(fixed)')+'</option>').join('')+'</select></div>';
  }
  if(S.wl==='view'){const F=W.model.fore;h+='<h3>Other forearm</h3>'+(F?'<div class="row"><label>Hand at</label>'+v3(F.p,'fp')+'</div><div class="row"><label>From</label>'+v3(F.r,'fr')+'</div><div class="row"><button id="foreDel">Remove</button></div>':'<div class="row"><button id="foreAdd">+ Other hand on it</button></div>');}
  if(W.note!==undefined||true)h+='<h3>Note</h3><textarea id="wnote" rows="3" style="width:100%" placeholder="What this weapon is, for whoever edits it next">'+esc(W.note||'')+'</textarea>';
  B.innerHTML=h;
  for(const e of B.querySelectorAll('#boxList .item'))e.onclick=ev=>{pickSel(+e.dataset.i,ev.shiftKey);rebuild();renderInsp();};
  if(mode==='shared'){
    const pa=f=>e=>edit(W2=>{const at=W2.model[j].at=W2.model[j].at||{p:[0,0,0]};f(at,+e.target.value);if(at.r&&!at.r.some(v=>v))delete at.r;if(at.k===1)delete at.k;});
    for(const q of[0,1,2]){$('ap'+q).onchange=pa((at,v)=>{at.p=at.p||[0,0,0];at.p[q]=r4(v);});$('ar'+q).onchange=pa((at,v)=>{at.r=at.r||[0,0,0];at.r[q]=r4(v*Math.PI/180);});}
    $('ak').onchange=pa((at,v)=>{at.k=r4(Math.max(0.01,v));});
    $('plSel').onclick=()=>{S.sel=S.sel===-2?-1:-2;rebuild();renderInsp();};
    $('mkOwn').onclick=()=>{edit(W2=>{const own=assetList(W2.model,j).map(x=>{x.p=x.p.map(r4);x.s=x.s.map(r4);if(x.r)x.r=x.r.map(r4);return x;});W2.model[j]={at:W2.model[j].at,own};});
      if(S.sel===-2)S.sel=-1;renderToolbar();renderInsp();rebuild();status('Made unique');};}
  if($('useShared'))$('useShared').onclick=()=>{edit(W2=>{const v=W2.model[j];if(Array.isArray(v)||!v.at)W2.model[j]={at:{p:[0,0,0]}};else delete v.own;});
    S.sel=-1;renderToolbar();renderInsp();rebuild();frameView();status('Using the shared model');};
  if($('addView'))$('addView').onclick=()=>{edit(W2=>{editList(W2,j,true);});S.sel=-1;renderToolbar();renderInsp();rebuild();frameView();};
  if(mode!=='none'){
  $('addBox').onclick=()=>edit(W2=>{const L=editList(W2,j,true),o=b?b.p:[0,0,0];L.push({s:[0.1,0.1,0.1],p:[o[0],o[1],o[2]+0.1],c:b?b.c:'#888888'});if(mode==='own'&&j==='view')L[L.length-1].o=62;S.sel=L.length-1;});
  $('dupBox').onclick=()=>dup();$('mirBox').onclick=()=>mirror();$('delBox').onclick=()=>del();
  const set=(f)=>e=>edit(W2=>f(editList(W2,j)[S.sel],e.target),'f'+e.target.id);
  if(b){for(const j of[0,1,2]){$('bs'+j).onchange=set((x,t)=>{x.s[j]=Math.max(0.001,r4(+t.value));});$('bp'+j).onchange=set((x,t)=>{x.p[j]=r4(+t.value);});
      $('br'+j).onchange=set((x,t)=>{x.r=x.r||[0,0,0];x.r[j]=r4(+t.value*Math.PI/180);if(!x.r.some(v=>v))delete x.r;});}
    $('bsh').onchange=set((x,t)=>{if(t.value==='box')delete x.sh;else x.sh=t.value;});
    $('bc').oninput=set((x,t)=>{x.c=t.value;});$('brole').onchange=set((x,t)=>{x.c=t.checked?'@club':'#7a5530';});
    if($('brl'))$('brl').onchange=set((x,t)=>{if(t.value)x.role=t.value;else delete x.role;});
    if($('bo'))$('bo').onchange=set((x,t)=>{x.o=+t.value;});
    if($('btag'))$('btag').onchange=set((x,t)=>{if(t.value)x.tag=t.value;else delete x.tag;});}}
  if($('foreAdd'))$('foreAdd').onclick=()=>edit(W2=>{W2.model.fore={p:[0,0,-0.9],r:[-0.62,-0.42,-0.1]};});
  if($('foreDel'))$('foreDel').onclick=()=>edit(W2=>{delete W2.model.fore;delete W2.model.foreTag;});
  if($('fp0'))for(const j of[0,1,2]){$('fp'+j).onchange=e=>edit(W2=>{W2.model.fore.p[j]=r4(+e.target.value);});$('fr'+j).onchange=e=>edit(W2=>{W2.model.fore.r[j]=r4(+e.target.value);});}
  $('wnote').onchange=e=>edit(W2=>{if(e.target.value)W2.note=e.target.value;else delete W2.note;});
}
// a prop's or a fixture's boxes: size, place, colour (its own, or the tint, pole steel or a lamp), glow; a fixture's spots
function renderFlatInsp(B,d){
  const W=d.data,L=W.boxes,b=L[S.sel],sl=selList(),fix=d.kind==='fixtures';
  const ROLES=fix?[['@pole','Pole'],['@lamp','Lamp']]:[['@tint','Tint']],rn=c=>(ROLES.find(r=>r[0]===c)||[])[1];
  const sw=x=>'#'+colOf(x.c).toString(16).padStart(6,'0');
  let h='<div class="row"><button id="addBox">+ Box</button><button id="dupBox"'+(b?'':' disabled')+'>Duplicate</button><button id="mirBox"'+(b?'':' disabled')+'>Mirror</button><button id="delBox"'+(b?'':' disabled')+'>Delete</button></div>';
  h+='<div class="list" id="boxList">'+L.map((x,i)=>'<div class="item'+(sl.includes(i)?' on':'')+'" data-i="'+i+'"><span style="color:'+sw(x)+'">■</span> '+esc(rn(x.c)||'box')+(x.glow?' (glow)':'')+' <small>'+x.s.map(v=>+v.toFixed(3)).join(' × ')+'</small></div>').join('')+'</div>';
  if(b){h+=sl.length>1?'<p class="note">'+sl.length+' picked</p>':'';h+='<h3>Box '+(S.sel+1)+'</h3>';
    h+='<div class="row"><label>Size</label>'+v3(b.s,'bs')+'</div><div class="row"><label>Place</label>'+v3(b.p,'bp')+'</div>';
    const role=b.c[0]==='@';
    h+='<div class="row"><label>Colour</label><select id="brl"><option value="">Own</option>'+ROLES.map(([c,t])=>'<option value="'+c+'"'+(b.c===c?' selected':'')+'>'+t+'</option>').join('')+'</select><input type="color" id="bc" value="'+(role?sw(b):b.c)+'"'+(role?' disabled':'')+'></div>';
    if(!fix&&!role)h+='<div class="row"><label style="width:auto"><input type="checkbox" id="bglow"'+(b.glow?' checked':'')+'> Glows</label></div>';}
  if(fix&&W.spots){h+='<h3>Spots</h3>';for(const k in W.spots)h+='<div class="row"><label>'+esc(k)+'</label>'+v3(W.spots[k],'sp_'+k)+'</div>';}
  h+='<h3>Note</h3><textarea id="wnote" rows="3" style="width:100%">'+esc(W.note||'')+'</textarea>';
  B.innerHTML=h;
  for(const e of B.querySelectorAll('#boxList .item'))e.onclick=ev=>{pickSel(+e.dataset.i,ev.shiftKey);rebuild();renderInsp();};
  $('addBox').onclick=()=>edit(W2=>{const o=b?b.p:[0,0.5,0];W2.boxes.push({s:[0.2,0.2,0.2],p:[o[0],o[1],o[2]+0.1],c:b?b.c:'#888888'});S.sel=W2.boxes.length-1;S.msel=[];});
  $('dupBox').onclick=()=>dup();$('mirBox').onclick=()=>mirror();$('delBox').onclick=()=>del();
  const set=f=>e=>edit(W2=>f(W2.boxes[S.sel],e.target),'f'+e.target.id);
  if(b){for(const j of[0,1,2]){$('bs'+j).onchange=set((x,t)=>{x.s[j]=Math.max(0.001,r4(+t.value));});$('bp'+j).onchange=set((x,t)=>{x.p[j]=r4(+t.value);});}
    $('brl').onchange=set((x,t)=>{x.c=t.value||sw(x);if(t.value)delete x.glow;});
    $('bc').oninput=set((x,t)=>{x.c=t.value;});
    if($('bglow'))$('bglow').onchange=set((x,t)=>{if(t.checked)x.glow=true;else delete x.glow;});}
  for(const k in (fix&&W.spots)||{})for(const j of[0,1,2])$('sp_'+k+j).onchange=e=>edit(W2=>{W2.spots[k][j]=r4(+e.target.value);});
  $('wnote').onchange=e=>edit(W2=>{if(e.target.value)W2.note=e.target.value;else delete W2.note;});
}
function dup(){const d=doc();if(!d)return;
  {const X=ext();if(X){if(X.dup)X.dup(d);return;}}
  if(d.kind==='clips')return copyKey();
  const P=selList();if(!P.length)return;
  if(S.insp==='hit'){edit(W=>{const H=W.hit[hitSet()];addSel(H,P.map(i=>{const c=clone(H[i]);c.p[0]=r4(c.p[0]+0.1);return c;}));});return;}
  edit(W=>{const L=editList(W,S.wl);addSel(L,P.map(i=>{const c=clone(L[i]);c.p[0]=r4(c.p[0]+0.05);return c;}));});}
// (new copies onto the end of a list, and they become the selection)
function addSel(L,cs){const n=L.length;L.push(...cs);const I=cs.map((c,i)=>n+i);S[selK()]=I[I.length-1];S[mselK()]=I.length>1?I:[];}
function mirror(){const d=doc();if(!d||ext()||!(d.kind==='weapons'||flatKind(d.kind))||S.sel<0||S.insp!=='box')return;
  const P=selList();edit(W=>{const L=editList(W,S.wl);addSel(L,P.map(i=>{const c=clone(L[i]);c.p[0]=r4(-c.p[0]);if(c.r){c.r[1]=-c.r[1];c.r[2]=-c.r[2];}return c;}));});}
function del(){const d=doc();if(!d)return;
  {const X=ext();if(X){if(X.del)X.del(d);return;}}
  if(d.kind==='clips')return delKey();
  const P=selList().sort((a,b)=>b-a);if(!P.length)return;
  if(S.insp==='hit'){const set=hitSet();edit(W=>{for(const i of P)W.hit[set].splice(i,1);S.hsel=-1;S.hmsel=[];if(!W.hit[set].length)delete W.hit[set];if(!Object.keys(W.hit).length)delete W.hit;});return;}
  edit(W=>{const L=editList(W,S.wl);for(const i of P)L.splice(i,1);S.sel=-1;S.msel=[];});}

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
  const W=d.data;let h='<table class="stats">';
  // (a field naming an animation or a grip: a choice of the ones there are, of the kind that fits)
  const REF={};if(d.kind==='weapons'){for(const [a,f,,L] of WCLIPS)REF[a+'.'+f]=S.list.clips.filter(c=>clipLayout(c)===L);REF['npc.aim']=S.list.grips||[];}
  const row=(path,v)=>{const id='st_'+path;let inp;
    if(REF[path]&&(typeof v==='string'||v===undefined)){const L=REF[path];
      inp='<span class="refsel"><select id="'+id+'"><option value="">(none)</option>'+(v&&!L.includes(v)?'<option selected>'+esc(v)+' (missing)</option>':'')+
        L.map(c=>'<option'+(c===v?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select>'+
        (v&&L.includes(v)?'<button class="x" data-open="'+esc(v)+'" data-ok="'+(path==='npc.aim'?'grips':'clips')+'" title="Open it">→</button>':'')+'</span>';}
    else if(typeof v==='boolean')inp='<input type="checkbox" id="'+id+'"'+(v?' checked':'')+'>';
    else if(typeof v==='number')inp='<input type="number" step="any" id="'+id+'" value="'+v+'">';
    else if(typeof v==='string')inp='<input type="text" id="'+id+'" value="'+esc(v)+'">';
    else inp='<input type="text" id="'+id+'" value="'+esc(JSON.stringify(v))+'" title="JSON">';
    return '<tr title="'+esc(FIELD_HELP[path]||'')+'"><td>'+esc(path)+'</td><td>'+inp+'</td><td><button class="x" data-del="'+esc(path)+'" title="Remove this field">×</button></td></tr>';};
  for(const k in W){if(['model','hit','note'].includes(k))continue;const v=W[k];
    if(v&&typeof v==='object'&&!Array.isArray(v)){h+='<tr class="sec"><td colspan="3">'+esc(k)+'</td></tr>';for(const j in v)h+=row(k+'.'+j,v[j]);}
    else h+=row(k,v);}
  h+='</table><h3>Add a field</h3><div class="row"><input id="nf" placeholder="name, or npc.name / player.name" style="flex:1"><select id="nft"><option>number</option><option>text</option><option>yes/no</option></select><button id="nfb">Add</button></div>';
  B.innerHTML=h;
  const at=(o,p)=>{const s=p.split('.');for(let i=0;i<s.length-1;i++)o=o[s[i]]=o[s[i]]||{};return [o,s[s.length-1]];};
  for(const inp of B.querySelectorAll('input[id^=st_]')){const path=inp.id.slice(3);
    inp.onchange=()=>edit(W2=>{const [o,k]=at(W2,path),old=o[k];let v;
      if(inp.type==='checkbox')v=inp.checked;else if(inp.type==='number')v=+inp.value;else if(typeof old==='string')v=inp.value;else{try{v=JSON.parse(inp.value);}catch(e){status(path+': not valid JSON, unchanged',true);return;}}
      o[k]=v;},'st'+path);}
  for(const sel of B.querySelectorAll('select[id^=st_]')){const path=sel.id.slice(3);
    sel.onchange=()=>edit(W2=>{const [o,k]=at(W2,path),v=sel.value;if(!v)delete o[k];else if(!/ \(missing\)$/.test(v))o[k]=v;},'st'+path);}
  for(const x of B.querySelectorAll('[data-open]'))x.onclick=()=>open(x.dataset.ok,x.dataset.open,d.kind==='weapons'?d.name:undefined);
  for(const x of B.querySelectorAll('[data-del]'))x.onclick=()=>edit(W2=>{const [o,k]=at(W2,x.dataset.del);delete o[k];});
  $('nfb').onclick=()=>{const p=$('nf').value.trim();if(!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)?$/.test(p))return status('A field name is letters and digits, or npc.name / player.name',true);
    edit(W2=>{const [o,k]=at(W2,p);o[k]=$('nft').value==='number'?0:$('nft').value==='text'?'':false;});};
}
function renderHitInsp(B,d){
  const set=hitSet(),body=set==='hurtboxes',W=d.data,H=(W.hit&&W.hit[set])||[],s=H[S.hsel];
  let h=body?'<div class="row"><label>Name</label><input id="bname" value="'+esc(W.name||'')+'"></div>':
    '';
  h+='<div class="row"><button data-add="sphere">+ Sphere</button><button data-add="capsule">+ Capsule</button><button data-add="box">+ Box</button></div>';
  h+='<div class="row">'+(body?'':'<button id="hbCopy"'+(W.r&&W.reach?'':' disabled')+'>Copy the built-in hit</button>')+(s?'<button id="hbDel">Delete</button>':'')+'</div>';
  h+='<div class="list">'+H.map((x,i)=>'<div class="item'+(selList().includes(i)?' on':'')+'" data-i="'+i+'">'+x.k+' <small>'+(body?'':x.t?'live '+x.t.join('–'):'always')+'</small></div>').join('')+'</div>';
  if(s){h+='<h3>'+s.k+'</h3><div class="row"><label>Place</label>'+v3(s.p,'hp')+'</div>';
    if(s.k==='box')h+='<div class="row"><label>Size</label>'+v3(s.s,'hs')+'</div>';else h+='<div class="row"><label>Radius</label>'+num(s.r,'hr')+'</div>';
    if(s.k==='capsule')h+='<div class="row"><label>Length</label>'+num(s.h,'hh')+'</div>';
    h+='<div class="row"><label>Tilt (degrees)</label>'+v3((s.rot||[0,0,0]).map(v=>+(v*180/Math.PI).toFixed(2)),'hro')+'</div>';
    if(!body)h+='<div class="row"><label>Follows</label><select id="hon"><option value="">Feet</option><option value="hand"'+(s.on==='hand'?' selected':'')+'>Hand</option></select></div>'+
      '<div class="row"><label>Hurts</label><select id="hlv"><option value="">On impact</option><option value="1"'+(s.t?' selected':'')+'>From … to …</option></select></div>'+(s.t?'<div class="row"><label>From, to</label>'+num(s.t[0],'ht0')+num(s.t[1],'ht1')+'</div>':'');}
  B.innerHTML=h;
  for(const e of B.querySelectorAll('.list .item'))e.onclick=ev=>{pickSel(+e.dataset.i,ev.shiftKey);rebuild();renderInsp();};
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
    if($('hlv'))$('hlv').onchange=put((x,t)=>{if(t.value)x.t=[r4(Math.max(0,S.t-0.1)),r4(Math.min(2,S.t+0.1))];else delete x.t;});
    // (changing what it follows keeps it where it is now, at the playhead)
    if($('hon'))$('hon').onchange=e=>{const i=S.hsel,m=pickable[i],to=e.target.value;if(!m||!hitPose)return;content.updateMatrixWorld(true);
      const par=to==='hand'?hitPose.J.hand:content,o=inParent({m,par});
      edit(W2=>{const x=W2.hit.hitboxes[i];if(to)x.on=to;else delete x.on;putHit(W2,o);});};
    for(const j of[0,1])if($('ht'+j))$('ht'+j).onchange=put((x,t)=>{if(!x.t)x.t=[0.9,1.1];x.t[j]=r4(+t.value);if(x.t[0]>x.t[1])x.t.reverse();});}
}

// ---- animations: the inspector and the timeline ----
// A clip keeps a track of keys per channel ([[u,value,ease?],...], core/assets.js), u from 0 to 2. What's selected (S.key)
// is one key, {j (the channel), i (its place in the track)}, or every channel's key at one time, {all: u}, or nothing.
const chNames=c=>assetChNames(c);
const trackOf=(c,j)=>c.tracks[chNames(c)[j]];
const KEY_EPS=1e-4;
const keyIn=(K,t)=>K.findIndex(q=>Math.abs(q[0]-t)<KEY_EPS);
// every time any channel has a key at, in order
function keyTimes(c){const o=[];for(const n of chNames(c))for(const q of c.tracks[n])if(!o.some(t=>Math.abs(t-q[0])<KEY_EPS))o.push(q[0]);return o.sort((a,b)=>a-b);}
// channel j's key at t, made from the pose there if it hasn't one (make); its index, or -1
function keyCh(C,j,t,make){const K=trackOf(C,j);let i=keyIn(K,t);if(i>=0||!make)return i;
  const v=r4(clipAt(C,t)[j]);i=K.findIndex(q=>q[0]>t);if(i<0)i=K.length;K.splice(i,0,[r4(t),v]);return i;}
// the selected key's time (or the playhead's, with none)
const keyT=c=>{const k=S.key;if(!k)return S.t;if(k.all!==undefined)return k.all;const q=trackOf(c,k.j)[k.i];return q?q[0]:S.t;};
const easeSel=(id,e,mixed)=>'<select id="'+id+'">'+(mixed?'<option value="-" selected>(mixed)</option>':'')+'<option value=""'+(!mixed&&!e?' selected':'')+'>smooth</option><option value="i"'+(!mixed&&e==='i'?' selected':'')+'>gathering speed (in)</option><option value="o"'+(!mixed&&e==='o'?' selected':'')+'>slowing (out)</option><option value="l"'+(!mixed&&e==='l'?' selected':'')+'>steady</option></select>';
// how each channel reads in the inspector: a plain name, which way is which, its unit (turns in degrees, places in
// blocks, the magazine from 0 to 1) and the slider's range (wide enough for every clip there is). The files keep radians
// and the game's numbers: only the inspector shows them this way
const CH_UI={
  body:{arm:['Arm swing','minus raises it forward and up, plus swings it back','deg',-270,60],armOut:['Arm out to the side','plus lifts it away from the body','deg',-90,90],
    wrist:['Wrist','plus tips the weapon down, minus up and back','deg',-270,120],free:['Free arm swing','minus raises it forward and up, plus swings it back','deg',-270,60],
    twist:['Twist at the waist','plus turns the chest toward the weapon arm','deg',-60,60],lean:['Lean','plus forward, minus back','deg',-30,60],step:['Step','plus a half-step forward, in blocks','blk',-0.5,0.5]},
  vm:{tilt:['Tilt','plus points it up, minus down','deg',-90,90],across:['Across','plus to the right','blk',-1,1],up:['Height','plus higher on the screen','blk',-1.5,0.5],
    fwd:['Distance','minus further out in front, plus closer','blk',-1.5,0.5],roll:['Roll','plus turns it anticlockwise','deg',-90,90]},
  vr:{tilt:['Tilt','plus points it up, minus down (added to how it\'s held)','deg',-60,60],roll:['Roll','plus turns it anticlockwise','deg',-90,90],
    across:['Across','plus to the right (added to where it\'s held)','blk',-0.3,0.3],up:['Height','plus higher','blk',-0.3,0.3],fwd:['Distance','plus closer','blk',-0.3,0.3],
    mag:['Magazine out','0 in place, 1 gone (it drops away, then a new one comes up)','',0,1]}};   // (and the hippo's: hippo.js adds them)
const chUI=(c,j)=>{const nm=chNames(c)[j]||ASSET_LAYOUTS[c.layout].ch[j][0],u=CH_UI[c.layout]&&CH_UI[c.layout][nm];
  return u?{n:u[0],h:u[1],u:u[2],lo:u[3],hi:u[4]}:{n:ASSET_LAYOUTS[c.layout].ch[j][1],h:'',u:'',lo:-4,hi:4};};
const toUI=(U,v)=>U.u==='deg'?+(v*180/Math.PI).toFixed(2):+(+v).toFixed(4),fromUI=(U,v)=>U.u==='deg'?v*Math.PI/180:v;
const UNIT_TXT={deg:'°',blk:'blocks'};
function renderClipInsp(B,d){
  const c=d.data,L=ASSET_LAYOUTS[c.layout],names=chNames(c),n=names.length,v=clipAt(c,S.t),k=S.key,dis=S.playing?' disabled':'';
  let h='<div class="row"><label>Layout</label><b>'+esc(c.layout)+'</b></div><p class="note">Used by: '+esc(users(S.name).join(', ')||'nothing')+'</p>';
  h+='<div class="row"><button id="kAdd" title="A key on every channel at the playhead (K)">+ Key every channel</button><button id="kDel"'+(k?'':' disabled')+'>Delete key'+(k&&k.all!==undefined?'s':'')+'</button></div>';
  h+='<div class="row"><label style="width:auto"><input type="checkbox" id="autoK"'+(S.autoKey?' checked':'')+'> Auto-key</label></div>';
  h+='<h3 id="poseH">'+poseTitle(c)+'</h3>';poseShownK=JSON.stringify(k);
  if(k&&k.all===undefined){const q=trackOf(c,k.j)[k.i];if(q)h+='<div class="row"><label>Time</label>'+num(q[0],'kt',0.01)+'</div><div class="row"><label>Ease into it</label>'+easeSel('ke',q[2])+'</div>';}
  else if(k){const es=names.map(nm=>{const K=c.tracks[nm],i=keyIn(K,k.all);return i<0?null:(K[i][2]||'');}).filter(e=>e!==null);
    h+='<div class="row"><label>Time</label>'+num(k.all,'kt',0.01)+'</div><div class="row"><label>Ease into them</label>'+easeSel('ke',es[0],es.some(e=>e!==es[0]))+'</div>';}
  for(let j=0;j<n;j++){const U=chUI(c,j),has=keyIn(trackOf(c,j),S.t)>=0,st=U.u==='deg'?0.5:0.005,val=toUI(U,v[j]);
    h+='<div class="row chrow"><button class="kd'+(has?' on':'')+'" id="kd'+j+'"'+dis+' title="'+(has?'This channel has a key here: click to delete it':'Key this channel at the playhead')+'" style="color:'+CH_COL[j%CH_COL.length]+'">'+(has?'◆':'◇')+'</button>'+
      '<label title="'+esc(U.h)+'" style="color:'+CH_COL[j%CH_COL.length]+';width:118px">'+esc(U.n)+'</label><input type="range" min="'+Math.min(U.lo,val)+'" max="'+Math.max(U.hi,val)+'" step="'+st+'" id="cr'+j+'" value="'+val+'"'+dis+'>'+
      num(val,'cn'+j,st).replace('<input','<input'+dis)+'<small class="unit">'+(UNIT_TXT[U.u]||'')+'</small></div>';}
  if(L&&n<L.ch.length)h+='<div class="row"><button id="addCh">+ '+esc(L.ch[n][1])+' channel</button></div>';
  h+='<h3>Note</h3><textarea id="cnote" rows="4" style="width:100%">'+esc(c.note||'')+'</textarea>';
  B.innerHTML=h;
  $('kAdd').onclick=addKey;$('kDel').onclick=delKey;$('autoK').onchange=e=>{S.autoKey=e.target.checked;};
  if(k&&$('kt'))$('kt').onchange=e=>{moveKey(+e.target.value);mergeTag=null;renderInsp();};
  if(k&&$('ke'))$('ke').onchange=e=>{const val=e.target.value;if(val==='-')return;edit(C=>{
    const set=q=>{if(val)q[2]=val;else q.length=2;};
    if(k.all===undefined)set(trackOf(C,k.j)[k.i]);else for(const nm of chNames(C)){const K=C.tracks[nm],i=keyIn(K,k.all);if(i>=0)set(K[i]);}});};
  for(let j=0;j<n;j++){
    // (soft while dragging a slider: the goblin is posed again, nothing else made again; letting go draws the inspector again)
    const U=chUI(c,j),put=(val,tag,soft)=>{if(S.playing)return;const C0=doc().data;if(keyIn(trackOf(C0,j),S.t)<0&&!S.autoKey)return status('Auto-key is off: key the channel first',true);
      val=fromUI(U,val);edit(C=>{const i=keyCh(C,j,S.t,true);trackOf(C,j)[i][1]=r4(val);},tag,soft);};
    $('cr'+j).oninput=e=>{$('cn'+j).value=e.target.value;put(+e.target.value,'cr'+j,true);};
    $('cr'+j).onchange=()=>{mergeTag=null;rebuild();renderInsp();};
    $('cn'+j).onchange=e=>put(+e.target.value,'cn'+j);
    $('kd'+j).onclick=()=>{const C0=doc().data,K=trackOf(C0,j),i=keyIn(K,S.t);
      if(i<0){edit(C=>{const ii=keyCh(C,j,S.t,true);S.key={j,i:ii};});}
      else{if(K.length<2)return status('A channel keeps at least one key',true);edit(C=>{trackOf(C,j).splice(i,1);});S.key=null;}
      renderInsp();};}
  if($('addCh'))$('addCh').onclick=()=>edit(C=>{C.tracks[L.ch[n][0]]=[[0,0]];});
  $('cnote').onchange=e=>edit(C=>{if(e.target.value)C.note=e.target.value;else delete C.note;});
}
function poseTitle(c){const k=S.key;
  if(!k)return 'Pose at '+S.t.toFixed(3);
  if(k.all!==undefined)return 'Keys at '+k.all.toFixed(3)+' (every channel keyed there)';
  return 'Key: '+esc(ASSET_LAYOUTS[c.layout].ch[k.j][1])+', '+(k.i+1)+' of '+trackOf(c,k.j).length;}
function users(c){if(HIP_USE[c])return [HIP_USE[c]];const o=[];for(const n of S.list.weapons){const W=WDATA[n];if(!W)continue;const N=W.npc||{},P=W.player||{};
  for(const [f,v] of [['strike',N.strike],['pose',N.pose],['reload',N.rl],['first-person swing',P.swing],['first-person reload',P.rl],['as others see him',P.body]])if(v===c)o.push((W.name||n)+' ('+f+')');}return o;}
// a key on every channel at the playhead (K)
function addKey(){const d=doc();if(!d||d.kind!=='clips'||S.playing)return;edit(C=>{for(let j=0;j<chNames(C).length;j++)keyCh(C,j,S.t,true);});S.key={all:r4(S.t)};renderInsp();}
function delKey(){const d=doc();if(!d||!S.key)return;const k=S.key;
  if(k.all===undefined){if(trackOf(d.data,k.j).length<2)return status('A channel keeps at least one key',true);edit(C=>{trackOf(C,k.j).splice(k.i,1);});}
  else{let kept=0;edit(C=>{for(const nm of chNames(C)){const K=C.tracks[nm],i=keyIn(K,k.all);if(i<0)continue;if(K.length<2){kept++;continue;}K.splice(i,1);}});
    if(kept)status(kept+' channel'+(kept>1?'s keep their':' keeps its')+' only key',true);}
  S.key=null;renderInsp();}
// move the selected key (or keys) to u, as far as its neighbours on its own channel allow (merge: one undo for a drag)
function moveKey(u,merge){const d=doc();if(!d||!S.key)return;const k=S.key,c=d.data;
  const lim=(K,i)=>[i>0?K[i-1][0]+0.005:0,i<K.length-1?K[i+1][0]-0.005:2];
  if(k.all===undefined){const K=trackOf(c,k.j),[lo,hi]=lim(K,k.i);const t=r4(Math.max(lo,Math.min(hi,u)));edit(C=>{trackOf(C,k.j)[k.i][0]=t;},merge);S.t=t;return;}
  // (every channel's key at one time moves by the same amount, as far as all their neighbours allow)
  let dlo=-1e9,dhi=1e9;for(const nm of chNames(c)){const K=c.tracks[nm],i=keyIn(K,k.all);if(i<0)continue;const [lo,hi]=lim(K,i);dlo=Math.max(dlo,lo-k.all);dhi=Math.min(dhi,hi-k.all);}
  const dt=Math.max(dlo,Math.min(dhi,u-k.all)),t0=k.all,t=r4(t0+dt);if(Math.abs(t-t0)<KEY_EPS/2)return;
  edit(C=>{for(const nm of chNames(C)){const K=C.tracks[nm],i=keyIn(K,t0);if(i>=0)K[i][0]=t;}},merge);S.key={all:t};S.t=t;}
let poseClip=null;
function copyKey(){const d=doc();if(!d)return;poseClip=clipAt(d.data,S.t);status('Pose copied');}
function pasteKey(){const d=doc();if(!d||!poseClip||S.playing)return;edit(C=>{chNames(C).forEach((nm,j)=>{if(j>=poseClip.length)return;const i=keyCh(C,j,S.t,true);C.tracks[nm][i][1]=r4(poseClip[j]);});});S.key={all:r4(S.t)};renderInsp();}
const CH_COL=['#e06a5a','#e0b040','#7fb24a','#4ab0c0','#6a8ae0','#b07ae0','#e07ab0'];
// the timeline: along the top a row of every time something's keyed (drag one to move every channel's key there), then
// a row of keys per channel, then a curve per channel over u, the playhead
const TL=$('tl'),tg=TL.getContext('2d');
const TL_L=78,TL_R=20,TL_ROW=12,TL_TOP=18;
const tlX=(c,u)=>TL_L+u/2*(TL.width/devicePixelRatio-TL_L-TL_R);
const tlU=(c,x)=>Math.max(0,Math.min(2,(x-TL_L)/(TL.width/devicePixelRatio-TL_L-TL_R)*2));
const tlRowY=j=>TL_TOP+j*TL_ROW+TL_ROW/2;
// (playing, the pose can't be changed: the key selected is let go, and the inspector's sliders follow the playhead)
function setPlaying(v){const d=doc(),X=ext();if(v&&!(d&&(X?X.play&&X.play(d):d.kind==='clips'||hitTL())))return;S.playing=v;if(v)S.key=null;renderTLBar();renderInsp();drawTL();}
// the inspector's pose follows the playhead, as it plays or is dragged (without drawing it all again, which would drop a slider)
let poseShownK=null;
function syncPose(){
  const d=doc();if(!d||d.kind!=='clips'||S.insp!=='clip'||!$('poseH'))return;
  const c=d.data;if(JSON.stringify(S.key)!==poseShownK)return renderInsp();
  const v=clipAt(c,S.t),a=document.activeElement;$('poseH').innerHTML=poseTitle(c);
  for(let j=0;j<v.length;j++){const r=$('cr'+j),n=$('cn'+j),kd=$('kd'+j);if(!r)continue;const U=chUI(c,j),val=toUI(U,v[j]);if(a!==r)r.value=val;if(a!==n)n.value=val;
    if(kd){const has=keyIn(trackOf(c,j),S.t)>=0;kd.textContent=has?'◆':'◇';kd.classList.toggle('on',has);}}
}
function renderTLBar(){
  {const X=ext();if(X&&X.tl){$('tlbar').innerHTML=X.tl.bar();if(X.tl.barBind)X.tl.barBind();return;}}
  if(hitTL()){$('tlbar').innerHTML='<button id="tlPlay">'+(S.playing?'Pause':'Play')+' (Space)</button><label><input type="checkbox" id="tlLoop"'+(S.loop?' checked':'')+'> Loop</label>'+
      '<label>Speed <select id="tlSpd">'+[0.1,0.25,0.5,1].map(v=>'<option'+(v===S.speed?' selected':'')+'>'+v+'</option>').join('')+'</select></label><span class="note" id="tlU"></span><span class="grow"></span>';
    $('tlPlay').onclick=()=>setPlaying(!S.playing);$('tlLoop').onchange=e=>S.loop=e.target.checked;$('tlSpd').onchange=e=>S.speed=+e.target.value;return;}
  $('tlbar').innerHTML='<button id="tlPlay">'+(S.playing?'Pause':'Play')+' (Space)</button><label><input type="checkbox" id="tlLoop"'+(S.loop?' checked':'')+'> Loop</label>'+
    '<label>Speed <select id="tlSpd">'+[0.1,0.25,0.5,1].map(v=>'<option'+(v===S.speed?' selected':'')+'>'+v+'</option>').join('')+'</select></label><span class="note" id="tlU"></span><span class="grow"></span>';
  $('tlPlay').onclick=()=>setPlaying(!S.playing);$('tlLoop').onchange=e=>S.loop=e.target.checked;$('tlSpd').onchange=e=>S.speed=+e.target.value;
}
function diamond(x,y,r,col){tg.fillStyle=col;tg.beginPath();tg.moveTo(x,y-r);tg.lineTo(x+r,y);tg.lineTo(x,y+r);tg.lineTo(x-r,y);tg.fill();}
function drawTL(){
  {const X=ext();if(X&&X.tl){X.tl.draw();return;}}
  if(hitTL())return drawHitTL();
  const d=doc();if(!d||d.kind!=='clips')return;const c=d.data,W=TL.clientWidth,H=TL.clientHeight;
  if(TL.width!==W*devicePixelRatio||TL.height!==H*devicePixelRatio){TL.width=W*devicePixelRatio;TL.height=H*devicePixelRatio;}
  tg.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);tg.clearRect(0,0,W,H);
  const names=chNames(c),n=names.length,L=ASSET_LAYOUTS[c.layout],k=S.key;
  const top=TL_TOP+n*TL_ROW+8,bot=H-14;let lo=1e9,hi=-1e9;for(const nm of names)for(const q of c.tracks[nm]){lo=Math.min(lo,q[1]);hi=Math.max(hi,q[1]);}if(hi-lo<0.5){hi+=0.25;lo-=0.25;}
  const Y=v=>bot-(v-lo)/(hi-lo)*(bot-top-6);
  tg.font='11px system-ui';
  // (the rows of keys: every channel's, then each channel's own)
  tg.fillStyle='#8890a0';tg.fillText('all',6,11);
  for(let j=0;j<n;j++){const y=tlRowY(j);tg.fillStyle=j%2?'#1c1f24':'#20232a';tg.fillRect(TL_L,y-TL_ROW/2,W-TL_L-TL_R,TL_ROW);tg.fillStyle=CH_COL[j%CH_COL.length];tg.fillText(L.ch[j][0],6,y+4);}
  if(bot>top+10){tg.fillStyle='#181a1f';tg.fillRect(TL_L,top-2,W-TL_L-TL_R,bot-top+4);}
  for(let u=0;u<=2+1e-6;u+=0.25){const x=tlX(c,u);tg.fillStyle=u%1===0?'#3a404c':'#262a32';tg.fillRect(x,TL_TOP,1,bot-TL_TOP+2);tg.fillStyle='#8890a0';tg.fillText(u.toFixed(2),x-10,H-2);}
  if(bot>top+10){
    if(c.layout==='body'){tg.fillStyle='#8890a0';tg.fillText('wind-up',tlX(c,0.4),top+10);tg.fillText('follow-through',tlX(c,1.35),top+10);}
    tg.fillStyle='#3a404c';tg.fillRect(TL_L,Y(0),W-TL_L-TL_R,1);
    for(let j=0;j<n;j++){tg.strokeStyle=CH_COL[j%CH_COL.length];tg.lineWidth=1.5;tg.beginPath();
      for(let x=TL_L;x<=W-TL_R;x+=2){const v=clipAt(c,tlU(c,x))[j];x===TL_L?tg.moveTo(x,Y(v)):tg.lineTo(x,Y(v));}tg.stroke();
      for(const q of trackOf(c,j))diamond(tlX(c,q[0]),Y(q[1]),3,CH_COL[j%CH_COL.length]);}}
  for(const t of keyTimes(c))diamond(tlX(c,t),9,6,k&&k.all!==undefined&&Math.abs(k.all-t)<KEY_EPS?'#ffd060':'#d0d4dc');
  for(let j=0;j<n;j++)trackOf(c,j).forEach((q,i)=>{const x=tlX(c,q[0]),y=tlRowY(j),on=k&&k.all===undefined&&k.j===j&&k.i===i;
    diamond(x,y,5,on?'#ffd060':CH_COL[j%CH_COL.length]);if(q[2]){tg.fillStyle='#8890a0';tg.fillText(q[2]==='i'?'in':'out',x+6,y+4);}});
  const x=tlX(c,S.t);tg.fillStyle='#ffd060';tg.fillRect(x-1,0,2,H);
  const u=$('tlU');if(u)u.textContent='u '+S.t.toFixed(3);
}
// (a module's own timeline: its pointer handling first, ahead of the clips' and hitboxes' below)
for(const ev of ['pointerdown','pointermove','pointerup','dblclick'])TL.addEventListener(ev,e=>{const X=ext();if(X&&X.tl){if(X.tl[ev])X.tl[ev](e);e.stopImmediatePropagation();}});
// what's under a point on the timeline: {all:t} on the top row, {j,i} on a channel's row, else null
function tlHit(c,x,y){
  if(y<TL_TOP){let best=null,bd=7;for(const t of keyTimes(c)){const dd=Math.abs(tlX(c,t)-x);if(dd<bd){bd=dd;best={all:t};}}return best;}
  const j=Math.floor((y-TL_TOP)/TL_ROW);if(j<0||j>=chNames(c).length)return null;
  let best=null,bd=7;trackOf(c,j).forEach((q,i)=>{const dd=Math.abs(tlX(c,q[0])-x);if(dd<bd){bd=dd;best={j,i};}});return best||{row:j};
}
{let drag=null;
  TL.addEventListener('pointerdown',e=>{const d=doc();if(!d||d.kind!=='clips')return;if(hitTL())return;const c=d.data,r=TL.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    const h=tlHit(c,x,y);
    if(h&&h.row===undefined){S.key=h;S.t=keyT(c);drag={key:true};}
    else{S.key=null;S.t=tlU(c,x);drag={t:1};}
    TL.setPointerCapture(e.pointerId);poseAt(S.t);drawTL();renderInsp();});
  TL.addEventListener('pointermove',e=>{if(!drag||hitTL())return;const d=doc(),c=d.data,r=TL.getBoundingClientRect(),u=tlU(c,e.clientX-r.left);
    if(drag.key){if(S.playing)return;moveKey(u,'tlk');}
    else S.t=u;
    poseAt(S.t);drawTL();syncPose();});
  TL.addEventListener('pointerup',()=>{drag=null;mergeTag=null;renderInsp();});
  TL.addEventListener('dblclick',e=>{const d=doc();if(!d||S.playing||hitTL())return;const c=d.data,r=TL.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,h=tlHit(c,x,y);
    S.t=r4(tlU(c,x));
    if(h&&(h.row!==undefined||h.j!==undefined)){const j=h.row!==undefined?h.row:h.j;edit(C=>{S.key={j,i:keyCh(C,j,S.t,true)};});renderInsp();}
    else addKey();});}

// ---- posing by dragging: grab a part of the posed figure in the view and it follows the mouse, the editor working out
// the channels it moves (keyed at the playhead, as a slider would: Auto-key, or a key already there). Each step tries
// each channel a little either way, sees where the grabbed point goes on the screen, and moves the channels by as much
// as brings the point to the mouse (least squares, damped so it never jumps) ----
// (what a press on the figure grabs: the channels it moves and the point that follows the mouse, a function giving it
// in the world)
function poseGrab(hit,e,c){
  const o=hit.object,under=g=>{for(let q=o;q;q=q.parent)if(q===g)return true;return false;},nm=chNames(c),J=nm.indexOf.bind(nm);
  const fixed=(g,l)=>()=>g.localToWorld(l.clone());
  if(posed.k==='hippo')return hipClipGrab(o,under,J,e,hit,fixed);
  if(posed.k==='body'){const P=posed.J;
    if(under(P.hand))return e.shiftKey?{ch:[J('arm'),J('armOut')],pt:fixed(P.hand,P.hand.worldToLocal(hit.point.clone()))}:{ch:[J('wrist')],pt:fixed(P.hand,P.hand.worldToLocal(hit.point.clone()))};
    if(under(P.arm))return{ch:[J('arm'),J('armOut')],pt:fixed(P.arm,new THREE.Vector3(0,-0.4,0))};
    if(under(P.armL))return{ch:[J('free')],pt:fixed(P.armL,new THREE.Vector3(0,-0.4,0))};
    return e.shiftKey?{ch:[J('step')],pt:fixed(P.head,new THREE.Vector3(0,0.3,0))}:{ch:[J('twist'),J('lean')],pt:fixed(P.head,new THREE.Vector3(0,0.3,0))};}
  const A=posed.F.arm,l=A.worldToLocal(hit.point.clone());
  return{ch:e.altKey?[J('fwd')]:e.shiftKey?[J('tilt'),J('roll')]:[J('across'),J('up')],pt:fixed(A,l)};
}
function poseScreen(v3){const r=R.domElement.getBoundingClientRect(),q=v3.clone().project(cam);return [(q.x+1)/2*r.width,(1-q.y)/2*r.height];}
// (where the grabbed point is on the screen with these values)
function poseTry(G,c,v){POSE_OVR={c,v};poseAt(S.t);content.updateMatrixWorld(true);const p=poseScreen(G.pt());POSE_OVR=null;return p;}
function poseStep(G,c,mx,my){
  const v=clipAt(c,S.t),ch=G.ch.filter(j=>j>=0&&j<v.length);if(!ch.length)return;
  const P0=poseTry(G,c,v),m=[mx-P0[0],my-P0[1]];if(Math.hypot(m[0],m[1])<0.5){poseAt(S.t);return;}
  const cols=ch.map(j=>{const U=chUI(c,j),eps=U.u==='deg'?0.01:0.004,w=v.slice();w[j]+=eps;const P=poseTry(G,c,w);return [(P[0]-P0[0])/eps,(P[1]-P0[1])/eps];});
  // (damped least squares: (JtJ + l I) d = Jt m, for one or two channels)
  const n=ch.length,A=[],b=[];let big=0;for(const q of cols)big=Math.max(big,q[0]*q[0]+q[1]*q[1]);const lam=big*0.02+1e-6;
  for(let i=0;i<n;i++){A.push([]);for(let k=0;k<n;k++)A[i].push(cols[i][0]*cols[k][0]+cols[i][1]*cols[k][1]+(i===k?lam:0));b.push(cols[i][0]*m[0]+cols[i][1]*m[1]);}
  let d;if(n===1)d=[b[0]/A[0][0]];else{const det=A[0][0]*A[1][1]-A[0][1]*A[1][0];d=[(b[0]*A[1][1]-b[1]*A[0][1])/det,(A[0][0]*b[1]-A[1][0]*b[0])/det];}
  // (no more than a tenth of a turn, or a tenth of a block, in one step)
  d=d.map((x,i)=>{const U=chUI(c,ch[i]),lim=U.u==='deg'?0.6:0.1;return Math.max(-lim,Math.min(lim,x));});
  edit(C=>{ch.forEach((j,i)=>{const U=chUI(C,j),k=keyCh(C,j,S.t,true),val=v[j]+d[i],lo=fromUI(U,U.lo),hi=fromUI(U,U.hi);trackOf(C,j)[k][1]=r4(Math.max(Math.min(lo,v[j]),Math.min(Math.max(hi,v[j]),val)));});},'pdrag',true);
  poseAt(S.t);drawTL();syncPose();
}
{let G=null;
  const hitFig=e=>{const d=doc();if(!d||d.kind!=='clips'||!posed||S.playing)return null;const root=posed.k==='body'?posed.J.root:posed.k==='hippo'?posed.root:posed.F.vm;
    const r=R.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
    return ray.intersectObject(root,true)[0]||null;};
  // (in the capture phase, so it's ahead of the view's own turning)
  $('viewWrap').addEventListener('pointerdown',e=>{if(e.button!==0)return;const h=hitFig(e);if(!h)return;const d=doc(),c=d.data,g=poseGrab(h,e,c);
    const nm=chNames(c),miss=g.ch.filter(j=>j<0).length;if(miss===g.ch.length)return status('This animation has no channel for that part',true);
    if(!S.autoKey&&g.ch.some(j=>j>=0&&keyIn(trackOf(c,j),S.t)<0))return status('Auto-key is off: key the channels first',true);
    G=g;orbit.enabled=false;e.stopPropagation();R.domElement.setPointerCapture(e.pointerId);R.domElement.style.cursor='grabbing';},true);
  R.domElement.addEventListener('pointermove',e=>{const r=R.domElement.getBoundingClientRect();
    if(G){poseStep(G,doc().data,e.clientX-r.left,e.clientY-r.top);return;}
    if(e.buttons===0)R.domElement.style.cursor=hitFig(e)?'grab':'';});
  addEventListener('pointerup',()=>{if(!G)return;G=null;orbit.enabled=true;mergeTag=null;R.domElement.style.cursor='';rebuild();renderInsp();drawTL();});}

// ---- the hitboxes' timeline: the blow's channels faintly behind, a row per hitbox with a bar where it's live (or a
// mark at 1 for one that hurts only as the blow lands), the playhead ----
const HT_ROW=18;
const htRowY=i=>TL_TOP+i*HT_ROW;
function drawHitTL(){
  const d=doc(),W=d.data,c=hitBlow(W),H=(W.hit&&W.hit.hitboxes)||[],Wd=TL.clientWidth,Ht=TL.clientHeight;
  if(TL.width!==Wd*devicePixelRatio||TL.height!==Ht*devicePixelRatio){TL.width=Wd*devicePixelRatio;TL.height=Ht*devicePixelRatio;}
  tg.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);tg.clearRect(0,0,Wd,Ht);tg.font='11px system-ui';
  const bot=Ht-14,sl=selList();
  tg.fillStyle='#8890a0';tg.fillText(c?'blow: '+hitBlowName(W):'no blow ('+hitBlowName(W)+' is not a body animation)',6,11);
  for(let u=0;u<=2+1e-6;u+=0.25){const x=tlX(null,u);tg.fillStyle=u%1===0?'#3a404c':'#262a32';tg.fillRect(x,TL_TOP,1,bot-TL_TOP+2);tg.fillStyle='#8890a0';tg.fillText(u.toFixed(2),x-10,Ht-2);}
  // (the blow's own channels, faint, so you can see where it swings)
  if(c){const n=chNames(c).length;let lo=1e9,hi=-1e9;for(const nm of chNames(c))for(const q of c.tracks[nm]){lo=Math.min(lo,q[1]);hi=Math.max(hi,q[1]);}if(hi-lo<0.5){hi+=0.25;lo-=0.25;}
    const Y=v=>bot-(v-lo)/(hi-lo)*(bot-TL_TOP-6);tg.globalAlpha=0.28;
    for(let j=0;j<n;j++){tg.strokeStyle=CH_COL[j%CH_COL.length];tg.lineWidth=1;tg.beginPath();for(let x=TL_L;x<=Wd-TL_R;x+=3){const v=clipAt(c,tlU(null,x))[j];x===TL_L?tg.moveTo(x,Y(v)):tg.lineTo(x,Y(v));}tg.stroke();}
    tg.globalAlpha=1;}
  {const x=tlX(null,1);tg.fillStyle='#ff6a50';tg.fillRect(x,TL_TOP,1,bot-TL_TOP+2);tg.fillText('lands',x+3,TL_TOP-4);}
  H.forEach((s,i)=>{const y=htRowY(i),on=sl.includes(i);tg.fillStyle=i%2?'#1c1f24':'#20232a';tg.fillRect(TL_L,y,Wd-TL_L-TL_R,HT_ROW-2);
    tg.fillStyle=on?'#ffd060':'#d0d4dc';tg.fillText((i+1)+' '+s.k+(s.on==='hand'?' (hand)':''),6,y+12);
    if(s.t){const a=tlX(null,s.t[0]),b=tlX(null,s.t[1]);tg.fillStyle=on?'#ffd060':'#ff5040';tg.globalAlpha=on?0.85:0.6;tg.fillRect(a,y+2,Math.max(2,b-a),HT_ROW-6);tg.globalAlpha=1;
      tg.fillStyle='#fff';tg.fillRect(a,y+2,2,HT_ROW-6);tg.fillRect(Math.max(a,b-2),y+2,2,HT_ROW-6);}
    else{const x=tlX(null,1);diamond(x,y+HT_ROW/2-1,5,on?'#ffd060':'#ff5040');tg.fillStyle='#8890a0';tg.fillText('as it lands',x+8,y+12);}});
  if(!H.length){tg.fillStyle='#8890a0';tg.fillText('No hitboxes: add one in the inspector (the game uses the built-in hit until then)',TL_L+6,TL_TOP+12);}
  const x=tlX(null,S.t);tg.fillStyle='#ffd060';tg.fillRect(x-1,0,2,Ht);
  const u=$('tlU');if(u)u.textContent='u '+S.t.toFixed(3);
}
{let drag=null;
  // (what's under a point: a hitbox's row, and on its bar which part: the start 0, the end 1 or the middle 2)
  const at=(x,y)=>{const d=doc(),H=(d.data.hit&&d.data.hit.hitboxes)||[],i=Math.floor((y-TL_TOP)/HT_ROW);if(y<TL_TOP||i<0||i>=H.length)return null;
    const s=H[i];if(!s.t)return{i,part:null};const a=tlX(null,s.t[0]),b=tlX(null,s.t[1]);
    return{i,part:Math.abs(x-a)<5?0:Math.abs(x-b)<5?1:x>a&&x<b?2:null};};
  TL.addEventListener('pointerdown',e=>{if(!hitTL())return;const r=TL.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,h=at(x,y),u=tlU(null,x);drag=null;
    if(h){pickSel(h.i,e.shiftKey);if(h.part!=null&&!S.playing){const s=doc().data.hit.hitboxes[h.i];drag={i:h.i,part:h.part,u0:u,t0:s.t.slice()};}}
    if(!drag){S.t=u;drag={t:1};}
    TL.setPointerCapture(e.pointerId);rebuild();renderInsp();drawTL();});
  TL.addEventListener('pointermove',e=>{if(!drag||!hitTL())return;const r=TL.getBoundingClientRect(),u=tlU(null,e.clientX-r.left);
    if(drag.t){S.t=u;poseAt(u);drawTL();return;}
    const D=drag;edit(W=>{const s=W.hit.hitboxes[D.i],t=D.t0.slice();
      if(D.part===2){const du=Math.max(-t[0],Math.min(2-t[1],u-D.u0));t[0]+=du;t[1]+=du;}else{t[D.part]=Math.max(0,Math.min(2,u));if(t[0]>t[1])t.reverse();}
      s.t=t.map(r4);},'tlh',true);drawTL();hitLive(S.t);});
  TL.addEventListener('pointerup',()=>{if(!hitTL())return;const was=drag;drag=null;mergeTag=null;if(was&&!was.t){rebuild();renderInsp();}});
  TL.addEventListener('dblclick',e=>{if(!hitTL()||S.playing)return;const r=TL.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,h=at(x,y);if(!h)return;
    const u=tlU(null,x);edit(W=>{W.hit.hitboxes[h.i].t=[r4(Math.max(0,u-0.1)),r4(Math.min(2,u+0.1))];});drawTL();});}

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
  else if(k===' '){e.preventDefault();setPlaying(!S.playing);}
  else if(k==='k'&&doc()&&doc().kind==='clips')addKey();
  else if((k===','||k==='.')&&ext()&&ext().step){ext().step(k===','?-1:1);}
  else if((k===','||k==='.')&&doc()&&(doc().kind==='clips'||hitTL())){S.t=Math.max(0,Math.min(2,S.t+(k===','?-1:1)*0.01));S.key=null;poseAt(S.t);drawTL();renderInsp();}
  else if(k==='?'||k==='/')$('help').classList.toggle('show');
  else if(k==='escape'){$('help').classList.remove('show');closeDlg();}
});
addEventListener('beforeunload',e=>{for(const d of DOCS.values())if(dirty(d)||d.isNew){e.preventDefault();e.returnValue='';return;}});

// ---- the loop ----
function resize(){const r=$('viewWrap').getBoundingClientRect();R.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix();drawTL();}
addEventListener('resize',resize);
new ResizeObserver(()=>resize()).observe($('viewWrap'));
// ---- the panes' sizes: the bars between them drag, and are kept in this browser ----
const PANES={lw:[150,520,230],rw:[240,640,320],th:[160,700,300]};
function paneSet(k,v){const [lo,hi]=PANES[k];v=Math.round(Math.max(lo,Math.min(hi,v)));$('app').style.setProperty('--'+k,v+'px');try{localStorage.setItem('gsg-editor-'+k,v);}catch(e){}}
for(const k in PANES){let v=PANES[k][2];try{v=+localStorage.getItem('gsg-editor-'+k)||v;}catch(e){}paneSet(k,v);}
for(const bar of document.querySelectorAll('[data-split]')){const k=bar.dataset.split;
  bar.addEventListener('pointerdown',e=>{e.preventDefault();bar.setPointerCapture(e.pointerId);bar.classList.add('on');
    const x0=e.clientX,y0=e.clientY,v0=parseFloat(getComputedStyle($('app')).getPropertyValue('--'+k));
    const mv=ev=>paneSet(k,k==='lw'?v0+ev.clientX-x0:k==='rw'?v0-(ev.clientX-x0):v0-(ev.clientY-y0));
    const up=()=>{bar.classList.remove('on');bar.removeEventListener('pointermove',mv);bar.removeEventListener('pointerup',up);bar.removeEventListener('pointercancel',up);};
    bar.addEventListener('pointermove',mv);bar.addEventListener('pointerup',up);bar.addEventListener('pointercancel',up);});
  bar.addEventListener('dblclick',()=>paneSet(k,PANES[k][2]));}
let last=performance.now();
function loop(now){
  const dt=Math.min(0.1,(now-last)/1000);last=now;
  const d=doc();
  {const X=ext();if(X&&X.tick)X.tick(dt);}
  if(S.playing&&d&&!ext()&&(d.kind==='clips'||hitTL())){const a=0,b=2;S.t+=dt*S.speed*(b-a)/1.0;   // (every clip runs u 0 to 2)
    if(S.t>b){if(S.loop)S.t=a+(S.t-b)%((b-a)||1);else{S.t=b;setPlaying(false);}}poseAt(S.t);drawTL();syncPose();}
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
  await Promise.all([...S.list.clips.map(n=>loadDoc('clips',n)),...(S.list.bodies||[]).map(n=>loadDoc('bodies',n)),...(S.list.grips||[]).map(async n=>{const d=await loadDoc('grips',n);GUN_GRIP[n]=d.data;})]);
  for(const k in EXT)if(EXT[k].start)await EXT[k].start();
  renderList();renderTLBar();resize();applySnap();status('Ready');
  $('search').oninput=e=>{S.search=e.target.value;renderList();};
  $('saveBtn').onclick=()=>save();$('saveAllBtn').onclick=saveAll;$('buildBtn').onclick=build;$('gameBtn').onclick=openGame;
  $('helpBtn').onclick=()=>$('help').classList.toggle('show');
  requestAnimationFrame(loop);
}
// (start() is called from the page, once every module has loaded: hippo.js, sites.js)
