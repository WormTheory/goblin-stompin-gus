// ---- the obituary: every goblin that dies, newest first (kept per city) ----
const OBIT_KEY='goblin-stompin-gus-obits';let obits=null,obitSeed=null,obitTotal=0,obitSel=0;
function obitList(){if(!obits||obitSeed!==seed){obits=[];obitTotal=0;obitSeed=seed;try{const s=JSON.parse(localStorage.getItem(OBIT_KEY)||'null');if(s&&s.seed===seed&&Array.isArray(s.list)){obits=s.list;obitTotal=s.total||s.list.length;}}catch(e){}}return obits;}
let obitSaveT=null;function obitSave(){clearTimeout(obitSaveT);obitSaveT=setTimeout(()=>{try{localStorage.setItem(OBIT_KEY,JSON.stringify({seed,total:obitTotal,list:obitList()}));}catch(e){}},800);}
// who did it, for the record: a goblin or driver is named with their job, e.g. 'Snik Mudwhistle (cab driver)'
function killerName(killer){
  const kn=killer&&killer.name?killer.name.charAt(0).toUpperCase()+killer.name.slice(1).toLowerCase():'';
  return killer&&killer.occ?killer.name+' ('+killer.occ.toLowerCase()+')':kn;
}
function recordObit(g,cause,killer){
  if(!g.id)return;
  const who=killerName(killer);
  // nobody's fault (well, nobody's but the traffic's): no killer named, just how it happened
  if(killer===ACCIDENT)return recordObitAs(g,cause==='Fell to death'?'Fell to death':cause+' in a traffic accident','');   // (a fall of its own: nobody to blame, not even the traffic)
  recordObitAs(g,cause,who);
}
function recordObitAs(g,cause,who){const L=obitList();
  L.unshift(Object.assign({},g.id,{civ:g.id.civ!==undefined?g.id.civ:g.civ,cause,killer:who,when:timeLabel(),n:++obitTotal}));
  if(L.length>400)L.length=400;obitSave();renderObitCount();
  if(menuOpen&&curTab==='obit'){obitSel=Math.min(obitSel+1,L.length-1);renderObits();}
}
// Gus and Gertie go in the book too
function recordHippoObit(p,cause,killer){
  const L=obitList(),gus=!p.idx;
  L.unshift({hippo:true,idx:p.idx,name:gus?'Gus':'Gertie',age:gus?34:31,occ:'Hippopotamus',hobby:'Stomping goblins',quirk:gus?'Extremely wall-eyed':'Looks you right in the eye',
    cause,killer:killer===ACCIDENT?'':killerName(killer),when:timeLabel(),n:++obitTotal});
  if(L.length>400)L.length=400;obitSave();renderObitCount();
  if(menuOpen&&curTab==='obit'){obitSel=Math.min(obitSel+1,L.length-1);renderObits();}
}
function renderObitCount(){const el=document.getElementById('obitCount');if(el){const L=obitList();el.textContent=String(Math.max(obitTotal,L.length));}}
// the list: just numbers and names; picking one shows the rest beside it, with the goblin itself turning slowly
function renderObits(){
  const L=obitList(),ol=document.getElementById('obitList'),sum=document.getElementById('obitSum'),wrap=document.getElementById('obitWrap');
  const civ=L.filter(o=>o.civ&&!o.hippo).length,hip=L.filter(o=>o.hippo),gob=L.length-hip.length;
  const total=Math.max(obitTotal,L.length)-hip.length,gusN=hip.filter(o=>!o.idx).length,gerN=hip.length-gusN;
  const times=n=>n===1?'once':n===2?'twice':n+' times';
  const hipTxt=(gusN?' Gus has died '+times(gusN)+'.':'')+(gerN?' Gertie has died '+times(gerN)+'.':'');
  sum.textContent=!L.length?'No goblins have died yet. Give it time.':(gob?total+' goblin'+(total===1?' has':'s have')+' died in this city: '+(gob-civ)+' hostile, '+civ+' civilian'+(civ===1?'':'s')+(total>gob?' among the latest '+gob+' listed.':'.'):'No goblins have died yet.')+hipTxt;
  wrap.hidden=!L.length;ol.textContent='';
  L.forEach((o,i)=>{
    const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.className='obn'+(o.hippo?' hippo':o.civ?' civ':'');b.dataset.i=String(i);
    const num=document.createElement('span');num.className='obn-n';num.textContent=(o.n||L.length-i)+'.';
    const nm=document.createElement('span');nm.className='obn-name';nm.textContent=o.name;
    b.append(num,nm);b.addEventListener('click',()=>selectObit(i));b.addEventListener('focus',()=>selectObit(i));li.append(b);ol.append(li);
  });
  if(L.length)selectObit(Math.max(0,Math.min(obitSel,L.length-1)));
}
function selectObit(i){
  const L=obitList(),o=L[i];if(!o)return;obitSel=i;
  for(const b of document.querySelectorAll('#obitList .obn'))b.setAttribute('aria-current',String(+b.dataset.i===i));
  const info=document.getElementById('obitInfo');info.textContent='';
  const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
  const meta=el('div','obd-meta');meta.append(el('span','obd-n','No. '+(o.n||L.length-i)),el('span','ob-age','age '+o.age),el('span','ob-tag'+(o.hippo?' hippo':o.civ?' civ':''),o.hippo?'HIPPO':o.civ?'CIVILIAN':'HOSTILE'));
  const dl=el('dl','ob-facts');for(const [k,v] of [['Occupation',o.occ],['Hobby',o.hobby],['Quirk',o.quirk]])dl.append(el('dt','',k),el('dd','',v));
  info.append(el('h3','obd-name',o.name),meta,dl,el('div','ob-death',o.cause+(o.killer?' by '+o.killer:'')),el('div','obd-when',o.when));
  obitShow(o);
}
// ---- 3D preview of the selected goblin: its own little renderer and scene ----
const OBP={r:null,scene:null,cam:null,root:null,spin:0,w:0,h:0};
function obitPreviewInit(){
  if(OBP.r)return true;
  try{OBP.r=new THREE.WebGLRenderer({canvas:document.getElementById('obitCanvas'),antialias:true,alpha:true});}catch(e){return false;}
  OBP.r.setPixelRatio(Math.min(devicePixelRatio||1,2));
  OBP.scene=new THREE.Scene();
  OBP.scene.add(new THREE.HemisphereLight(0xeef2e6,0x3a4030,0.95));
  const d=new THREE.DirectionalLight(0xffeedd,0.75);d.position.set(2,3,3);OBP.scene.add(d);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(0.75,32),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35}));disc.rotation.x=-Math.PI/2;OBP.scene.add(disc);
  OBP.cam=new THREE.PerspectiveCamera(28,1,0.1,30);OBP.cam.position.set(0,1.05,4.6);OBP.cam.lookAt(new V3(0,0.8,0));
  return true;
}
function obitShow(o){
  if(!obitPreviewInit())return;
  if(OBP.root){OBP.scene.remove(OBP.root);if(!OBP.root.userData.shared)OBP.root.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material&&m.material.dispose)m.material.dispose();});}
  if(o.hippo){
    // a copy of the hippo's own model (sharing its meshes' geometry and materials), standing, scaled to fit the frame
    const src=players[o.idx]||players[0];let c;try{c=src.root.clone(true);}catch(e){return;}const root=new THREE.Group();
    c.position.set(0,0,0);c.rotation.set(0,0,0);c.visible=true;c.traverse(m=>{m.visible=m.visible||m===c;});
    root.add(c);root.userData.shared=true;
    try{const bb=new THREE.Box3().setFromObject(c),sz=bb.getSize(new V3()),k=1.9/Math.max(sz.x,sz.y,sz.z,0.01);c.scale.multiplyScalar(k);c.position.y=-bb.min.y*k;}catch(e){}
    OBP.root=root;OBP.scene.add(root);OBP.spin=-0.6;return;
  }
  const cu=!!(o.look&&o.look.cult),fk=o.look&&o.look.foe&&FOES[o.look.foe],root=new THREE.Group(),m=goblinModel(root,{club:!o.civ&&!cu&&!fk,cult:cu,gear:fk?fk.gear:undefined,tunic:cu||fk?o.look.tunic:undefined});
  const hx=s=>parseInt(String(s||'#6f9a3a').slice(1),16);
  const L=o.look||{skin:hx(o.sk),tunic:hx(o.tu),pants:0x3a3328,hat:hx(o.ht),acc:0x884422,acc2:0x111111,hair:0x1b1b1b,show:[],h:1,w:1,hs:1};
  applyLook({roles:m.roles,acc:m.acc,root,head:m.head},L,1);
  m.arm.rotation.x=o.civ?0:-0.45;
  OBP.root=root;OBP.scene.add(root);OBP.spin=-0.6;
}
function obitPreviewTick(dt){
  if(!OBP.r||!OBP.root||curTab!=='obit')return;
  const cv=document.getElementById('obitCanvas'),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  if(w!==OBP.w||h!==OBP.h){OBP.w=w;OBP.h=h;OBP.r.setSize(w,h,false);OBP.cam.aspect=w/h;OBP.cam.updateProjectionMatrix();}
  // turned by hand only: right stick (see menuPad) or dragging with the mouse
  OBP.root.rotation.y=OBP.spin;
  // (drawn flat and in daylight, like the Dev tab's preview: with the world's bend left on, the culling would judge this
  // little scene from the main camera -- far off across the city -- and throw the goblin away as over the horizon)
  const L0=WORLD_LIGHT.value.clone(),cu=CURVE_U.value;WORLD_LIGHT.value.setRGB(1,1,1);CURVE_U.value=0;
  try{OBP.r.render(OBP.scene,OBP.cam);}finally{WORLD_LIGHT.value.copy(L0);CURVE_U.value=cu;}
}
{
  const cv=document.getElementById('obitCanvas');let drag=null;
  cv.addEventListener('pointerdown',e=>{drag=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener('pointermove',e=>{if(drag===null)return;OBP.spin+=(e.clientX-drag)*0.012;drag=e.clientX;});
  const end=()=>{drag=null;};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
}
