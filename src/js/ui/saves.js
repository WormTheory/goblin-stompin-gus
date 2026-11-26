// ---------- Where the game is saved: Browser save or Local save (the title menu's switch) ----------
// Browser save keeps the city in this browser's localStorage, as it always has. Local save keeps it in a file on this
// computer that the player picks, through the File System Access API (Chrome and Edge on a computer only), and they can
// have as many files as they like and switch between them. Either way the game itself still plays from localStorage:
// the working copy is SAVE_KEY and the few keys kept beside it (SV_KEYS). In Local save that's just a copy of the file,
// written back to it as the game saves (svTick). Switching puts the browser save aside in IndexedDB, which has far more
// room than localStorage, and brings it back when switching back, then reloads, the way New city and the Testing
// Environment do. The files' handles are kept in IndexedDB too, so next time the game opens the same file again (the
// browser asks once a session whether the game may still change it, on the first click or key press).
const SV_MODE_KEY='goblin-stompin-gus-savemode';
const SV_KEYS=()=>[SAVE_KEY,POS_KEY,OBIT_KEY,MAP_KEY,TENV_PARK,PLAY_KEY];   // (a function: some of these are declared further on)
const SV={mode:'browser',cur:null,t:0,can:false,why:'',files:[],rec:null,perm:'',err:'',block:false,busy:false,last:null,status:''};
try{const o=JSON.parse(localStorage.getItem(SV_MODE_KEY)||'null');if(o&&o.mode==='local'&&o.cur){SV.mode='local';SV.cur=String(o.cur);SV.t=+o.t||0;}}catch(e){}
// (whether this browser can save to files at all, and if not, why not, in words for the menu)
{let top=true;try{top=window.top===window.self;}catch(e){top=false;}
 if(typeof window.showSaveFilePicker!=='function'||typeof window.showOpenFilePicker!=='function'||!window.indexedDB)
   SV.why=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'')?"Local saves need Chrome or Edge on a computer: phones and tablets can't keep saving to a file. Your game saves in this browser, but you can export it to a file and import it again.":"This browser can't keep saving to a file by itself (only Chrome and Edge on a computer can), so your game saves in the browser. But you can export your world to a file whenever you like, to keep it safe or carry it to another browser or computer, and import it again.";
 else if(!top)SV.why='Local saves only work with the game open in its own tab or window. Open it on its own to use them.';
 else SV.can=true;}
function svSaveMode(){try{localStorage.setItem(SV_MODE_KEY,JSON.stringify(SV.mode==='local'?{mode:'local',cur:SV.cur,t:SV.t}:{mode:'browser'}));}catch(e){}}
// ---- IndexedDB: 'files' holds each known save file ({id, name, handle, t}), 'kv' the browser save while it's put aside.
// (An old version played from the website's /v/X/ gets a database of its own, as its localStorage keys are kept apart.) ----
const SV_DB='gsg-saves'+(m=>m?'-v'+m[1]:'')(typeof location!=='undefined'&&/\/v\/([^/]+)\//.exec(location.pathname||''));
function svDb(){return new Promise((ok,no)=>{const r=indexedDB.open(SV_DB,1);
  r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('files'))d.createObjectStore('files',{keyPath:'id'});if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv');};
  r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
function svIdb(store,mode,fn){return svDb().then(db=>new Promise((ok,no)=>{const tx=db.transaction(store,mode),r=fn(tx.objectStore(store));let out;
  if(r)r.onsuccess=()=>{out=r.result;};tx.oncomplete=()=>{db.close();ok(out);};tx.onerror=tx.onabort=()=>{db.close();no(tx.error);};}));}
const svFiles=()=>svIdb('files','readonly',s=>s.getAll()).then(a=>(a||[]).sort((x,y)=>(y.t||0)-(x.t||0)));
const svPut=rec=>svIdb('files','readwrite',s=>s.put(rec));
const svForget=id=>svIdb('files','readwrite',s=>s.delete(id));
const svKv=(k,v)=>v===undefined?svIdb('kv','readonly',s=>s.get(k)):svIdb('kv','readwrite',s=>v===null?s.delete(k):s.put(v,k));
// ---- a city too big for localStorage. A site gets about 5 MB of it, shared with every other version played from the same
// website, and a long rampage's smashed blocks can outgrow that: a save that didn't fit simply wasn't made, so the city kept
// going back to how it was the last time it fitted. Now, once it doesn't fit, its smashed blocks (nearly all of a big save)
// go in IndexedDB, which has far more room, and the rest stays in localStorage with a note of which copy of them goes with it
// (ed2db). load() sees the note and the blocks are read back in just after the page loads (worldLoadBig), with saving held
// off until they are. ----
const WB_ID=()=>'world:'+SAVE_KEY;
// (one at a time: two saves overlapping, the debounced one, Save now and a carrier's, could finish out of order and leave
// localStorage naming a copy of the blocks that IndexedDB no longer had. The first starts at once, as before, so a save as
// the page closes still reaches localStorage; any made while one's still going wait their turn.)
let WB_Q=Promise.resolve(),WB_N=0;
// (each chunk's smashed blocks are a record of their own, keyed WB_ID()+'|'+chunk, beside a note under WB_ID() naming which
// copy they are. A save writes only the chunks that changed since the last one it wrote (WB.saved, what IndexedDB holds),
// in one transaction with the note, over one connection kept open: copying and writing every chunk each time made a hitch
// every few seconds in a long rampage's city. Before anything's known of what's there (the first save since the page
// loaded a small world, or after one failed), it clears them all and writes the lot. An older save, with all the chunks
// in the note as ed2, still loads, and is rewritten this way the first time it's saved.)
let WB_DB=null;
function wbDb(){if(!WB_DB)WB_DB=svDb().then(db=>{db.onversionchange=()=>{db.close();WB_DB=null;};db.onclose=()=>{WB_DB=null;};return db;},e=>{WB_DB=null;throw e;});return WB_DB;}
function wbTx(mode,fn){return wbDb().then(db=>new Promise((ok,no)=>{let tx;try{tx=db.transaction('kv',mode);}catch(e){WB_DB=null;no(e);return;}
  const out=fn(tx.objectStore('kv'));tx.oncomplete=()=>ok(out);tx.onerror=tx.onabort=()=>no(tx.error);}));}
const wbRange=()=>IDBKeyRange.bound(WB_ID()+'|',WB_ID()+'|￿');
function wbWrite(t,ed2){const was=WB.saved,id=WB_ID()+'|',has=k=>Object.prototype.hasOwnProperty.call(ed2,k);WB.saved=null;   // (not known again till this one's done)
  return wbTx('readwrite',s=>{
    if(!was)s.delete(wbRange());
    for(const k in ed2)if(!was||was.get(k)!==ed2[k])s.put(ed2[k],id+k);
    if(was)for(const k of was.keys())if(!has(k))s.delete(id+k);
    s.put({t,parts:1},WB_ID());
  }).then(()=>{WB.saved=new Map(Object.entries(ed2));});}
// (the smashed blocks back as one ed2, or null if there are none)
function wbRead(){const R=wbRange();return wbTx('readonly',s=>({a:s.get(WB_ID()),ks:s.getAllKeys(R),vs:s.getAll(R)})).then(({a,ks,vs})=>{
  const n=a.result;if(!n)return null;if(n.ed2&&typeof n.ed2==='object')return n.ed2;if(!n.parts)return null;
  const ed2={},L=WB_ID().length+1;ks.result.forEach((k,i)=>{ed2[String(k).slice(L)]=vs.result[i];});
  WB.saved=new Map(Object.entries(ed2));return ed2;});}
function worldPut(o){WB_N++;const run=()=>worldPut0(o),p=WB_N===1?run():WB_Q.then(run,run),done=()=>{WB_N--;};WB_Q=p.then(done,done);return p;}
async function worldPut0(o){
  if(!WB.on||!o.ed2){try{localStorage.setItem(SAVE_KEY,JSON.stringify(o));return;}catch(e){if(!window.indexedDB||!o.ed2)throw e;WB.on=true;}}
  const t=Date.now()+'-'+Math.random().toString(36).slice(2,8);
  await wbWrite(t,o.ed2);
  const small=Object.assign({},o,{ed2db:t});delete small.ed2;
  localStorage.setItem(SAVE_KEY,JSON.stringify(small));
}
async function worldLoadBig(){
  const want=WB.pending;if(!want)return;let ed2=null;try{ed2=await wbRead();}catch(e){}
  // (a copy other than the one named is the newest one written, so it's taken rather than thrown away; with none at all,
  // nothing's saved straight away, so the save isn't overwritten with no smashed blocks)
  const got=!!(ed2&&typeof ed2==='object');if(got){editsUnpack(ed2);worldRefresh();}
  else try{flashLabel("Couldn't find all of this world's smashed blocks");}catch(e){}
  WB.pending=null;if(got)save();
}
// (the chunks already built while the smashed blocks were being read, and their neighbours, built again with them)
function worldRefresh(){
  const S=new Set();
  for(const k of chunkEdits.keys()){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)S.add(ckey(cx+dx,cz+dz));}
  for(const k of S)if(chunks.has(k)){chunks.delete(k);gfxRecC.delete(k);}
  lastK=-1;
  for(const k of S)if(meshes.has(k))buildChunk(Math.floor(k/65536)-32768,(k%65536)-32768);
  farDirty=true;
}
// ---- the working copy, and a save file's contents ----
// (where you're standing, the obituary and the map, saved now; the world itself is taken live, by svData)
function svFlush(){if(saveBlocked)return;
  try{savePos();}catch(e){}try{playSave();}catch(e){}try{saveExplored();}catch(e){}
  try{if(obits&&obitSeed===seed)localStorage.setItem(OBIT_KEY,JSON.stringify({seed,total:obitTotal,list:obitList()}));}catch(e){}}
// (and the world too, wherever it goes)
async function svFlushAll(){if(saveBlocked||WB.pending)return;clearTimeout(saveTimer);svFlush();flushNotes(Infinity);await worldPut(saveObj({tenv:TENV||undefined}));}
// (everything a save file holds: the world as it is this moment, and the other keys as they're kept)
function svData(){if(WB.pending)throw new Error("Just a moment: the world's still loading.");
  const d={};for(const k of SV_KEYS()){try{const v=localStorage.getItem(k);if(v!==null)d[k]=v;}catch(e){}}
  if(!saveBlocked){flushNotes(Infinity);d[SAVE_KEY]=saveText({tenv:TENV||undefined});}
  return d;}
async function svApply(d){
  for(const k of SV_KEYS()){if(k===SAVE_KEY)continue;if(d&&typeof d[k]==='string')localStorage.setItem(k,d[k]);else localStorage.removeItem(k);}
  if(d&&typeof d[SAVE_KEY]==='string')await worldPut(JSON.parse(d[SAVE_KEY]));else localStorage.removeItem(SAVE_KEY);
}
const svText=(d,t)=>JSON.stringify({game:"Goblin-Stompin' Gus",kind:'save',version:GAME_VER,key:SAVE_KEY,t,data:d});
// (a file read back: {empty} for a new file, otherwise its contents; a file that isn't a save, or is one from a version whose
// cities are built differently, throws with a reason to show)
function svParse(text){if(!String(text||'').trim())return {empty:true};let o=null;try{o=JSON.parse(text);}catch(e){}
  if(!o||o.kind!=='save'||!o.data||typeof o.data!=='object')throw new Error("That file isn't a Goblin-Stompin' Gus save.");
  if(o.key!==SAVE_KEY)throw new Error('That save is from version '+(o.version||'?')+", whose worlds are built differently, so it can't be opened in this version.");
  return o;}
async function svRead(h){const f=await h.getFile();return svParse(await f.text());}
let svQ=Promise.resolve();   // (one write at a time, in order)
function svWrite(h,text){const q=svQ.catch(()=>{}).then(async()=>{const w=await h.createWritable();try{await w.write(text);await w.close();}catch(e){try{await w.abort();}catch(e2){}throw e;}});svQ=q;return q;}
async function svPerm(h,ask){const o={mode:'readwrite'};try{let s=await h.queryPermission(o);if(s!=='granted'&&ask)s=await h.requestPermission(o);return s;}catch(e){return 'denied';}}
function svReload(){clearTimeout(saveTimer);saveBlocked=true;location.reload();}
// ---- Local save, while playing: the working copy goes to the file whenever the game saves, and every few seconds if
// anything else has changed (where you're standing, the obituary, the map). Not in the Testing Environment, whose
// empty world isn't the city in the file, and not as a guest in someone else's online game. ----
function svTick(force){
  if(SV.mode!=='local'||!SV.rec||SV.perm!=='granted'||SV.block||SV.busy||saveBlocked||WB.pending||TENV||netGuest())return;
  const d=svData(),s=JSON.stringify(d);if(s===SV.last&&!force)return;SV.last=s;const t=Date.now();
  svWrite(SV.rec.handle,svText(d,t)).then(()=>{SV.t=t;svSaveMode();if(SV.err){SV.err='';svUi();}},e=>{SV.last=null;
    if(!SV.err){SV.err="Couldn't save to "+SV.rec.name+(e&&e.message?' ('+e.message+')':'')+'. Your game is still kept in this browser.';svUi();try{flashLabel("Can't save to your save file");}catch(e2){}}});
}
{const s0=save;let t=null;save=function save(){s0();if(SV.mode==='local'){clearTimeout(t);t=setTimeout(()=>svTick(),1500);}};}
{const iv=setInterval(()=>svTick(),10000);if(iv&&iv.unref)iv.unref();}   // (unref: the tests' Node can still finish)
document.addEventListener('visibilitychange',()=>{if(document.hidden){svFlush();svTick();}});   // (the world itself is saved as it changes)
// (opened again in a new session: the file's own copy wins if it's newer than the one kept here, say from playing on
// another computer; otherwise what's kept here is written to it)
async function svSync(){
  if(!SV.rec)return;let o;
  try{o=await svRead(SV.rec.handle);}catch(e){SV.block=true;SV.err="Can't use "+SV.rec.name+': '+(e&&e.message||'it could not be read')+' Pick another file, or switch to Browser save.';svUi();return;}
  if(!o.empty&&(+o.t||0)>SV.t&&JSON.stringify(o.data)!==JSON.stringify(svData())){
    try{await svApply(o.data);}catch(e){SV.block=true;SV.err="This browser hasn't room to load "+SV.rec.name+'.';svUi();return;}
    SV.t=+o.t||Date.now();svSaveMode();try{flashLabel('Loading '+SV.rec.name+', saved more recently than this copy');}catch(e){}
    setTimeout(svReload,600);return;}
  svFlush();svTick(true);svUi();
}
// (asking the browser to let the game change the file again: it needs a click or a key press to ask)
async function svConnect(ask){
  if(SV.mode!=='local'||!SV.rec||SV.perm==='granted')return;
  const s=await svPerm(SV.rec.handle,ask);if(s===SV.perm&&s!=='granted')return;SV.perm=s;
  if(s==='granted'){SV.err='';await svSync();}
  else if(ask&&s==='denied'){SV.err="The browser wasn't allowed to change "+SV.rec.name+", so your game is only being kept in this browser for now. Pick it in Local saves to try again.";}
  svUi();
}
{const ask=()=>{if(SV.mode==='local'&&SV.rec&&SV.perm!=='granted'&&!SV.asked){SV.asked=true;svConnect(true);}};
 document.addEventListener('click',ask,true);document.addEventListener('keydown',e=>{if(e.key!=='Escape')ask();},true);}
// ---- switching ----
async function svGo(fn){if(SV.busy)return;SV.busy=true;SV.status='';SV.ok='';svUi();try{await fn();}catch(e){SV.status=e&&e.name==='AbortError'?'':(e&&e.message||String(e));}SV.busy=false;svUi();}
// Local save, in the file rec: data is what goes in it (null: whatever the file has already)
async function svUseLocal(rec,data){
  if(TENV)throw new Error('Leave the Testing Environment first: your world is parked while you\'re in it.');
  if(await svPerm(rec.handle,true)!=='granted')throw new Error('The browser needs your permission to save in '+rec.name+'. Pick it again and choose Allow (or "Allow on every visit").');
  let o=null;if(!data){o=await svRead(rec.handle);if(o.empty)data={};}
  if(saveBlocked)throw new Error("Not while you're in someone else's online game.");
  svFlush();const now=svData();
  // (put the browser save aside, or write the last file's last moments to it, before the working copy is swapped)
  if(SV.mode==='browser')await svKv('browser',now);
  else if(SV.rec&&SV.perm==='granted'&&!SV.block&&SV.rec.id!==rec.id){try{await svWrite(SV.rec.handle,svText(now,Date.now()));}catch(e){}}
  const d=data||o.data,t=data?Date.now():(+o.t||Date.now());
  if(data)await svWrite(rec.handle,svText(d,t));
  try{await svApply(d);}catch(e){if(SV.mode==='browser'){try{await svApply(now);}catch(e2){}}throw new Error("This browser hasn't room to load that save.");}
  rec.t=Date.now();await svPut(rec);
  SV.mode='local';SV.cur=rec.id;SV.t=t;svSaveMode();svReload();
}
async function svUseBrowser(){
  if(SV.mode!=='local')return;
  if(TENV)throw new Error('Leave the Testing Environment first: your world is parked while you\'re in it.');
  if(saveBlocked)throw new Error("Not while you're in someone else's online game.");
  svFlush();if(SV.rec&&SV.perm==='granted'&&!SV.block){try{await svWrite(SV.rec.handle,svText(svData(),Date.now()));}catch(e){}}
  const b=await svKv('browser');await svApply(b&&typeof b==='object'?b:{});await svKv('browser',null);
  SV.mode='browser';SV.cur=null;SV.t=0;svSaveMode();svReload();
}
// (a file picked from the browser's own picker: the one already listed if it's the same file)
async function svRec(h){for(const r of SV.files){try{if(await r.handle.isSameEntry(h))return r;}catch(e){}}
  return {id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)),name:h.name,handle:h,t:Date.now()};}
const SV_TYPES=[{description:"Goblin-Stompin' Gus save",accept:{'application/json':['.json']}}];
function svNewName(){const used=new Set(SV.files.map(r=>r.name));let n=1,s='gus-world.json';while(used.has(s))s='gus-world-'+(++n)+'.json';return s;}
// ---- the menu: the switch, and the Local saves card that pops out beside it ----
const svEl=id=>document.getElementById(id);
function svWhen(t){if(!t)return '';const d=new Date(t),n=new Date();
  return (d.toDateString()===n.toDateString()?'today':d.toLocaleDateString(undefined,{day:'numeric',month:'short'}))+' at '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});}
function svUi(){
  const b=svEl('saveBrowser'),l=svEl('saveLocal');if(!b||!l)return;
  b.setAttribute('aria-checked',String(SV.mode!=='local'));l.setAttribute('aria-checked',String(SV.mode==='local'));
  l.title=SV.can?'Save your game in files on this computer':'Export and import save files (this browser can\'t keep saving to a file by itself)';
  b.title=SV.mode==='local'?'Switch back to the game saved in this browser':'Your game is saved in this browser';
  svEl('saveIntro').textContent=SV.can?'Saves as files on this computer.':SV.why;
  for(const id of ['saveNewCopy','saveNewFresh','saveOpen']){const e=svEl(id);e.hidden=!SV.can;e.disabled=SV.busy;}
  // (export works everywhere; import is for browsers without Local save, since Open a save file does the same there)
  svEl('saveFileBtns').hidden=!SV.can;svEl('saveExport').disabled=SV.busy;svEl('saveImport').hidden=SV.can;svEl('saveImport').disabled=SV.busy;
  const L=svEl('saveList');L.textContent='';L.hidden=!SV.can||!SV.files.length;
  for(const r of SV.files){const cur=SV.mode==='local'&&r.id===SV.cur,row=document.createElement('div');row.className='sv-row'+(cur?' cur':'');
    const go=document.createElement('button');go.type='button';go.className='sv-file';go.disabled=SV.busy;
    const nm=document.createElement('b');nm.textContent=r.name;const inf=document.createElement('small');
    inf.textContent=cur?(SV.perm==='granted'?'In use · saved '+(svWhen(SV.t)||'just now'):'In use · click to let the game save to it'):'Last played '+svWhen(r.t);
    go.append(nm,inf);go.addEventListener('click',()=>{if(cur){if(SV.perm!=='granted')svGo(()=>svConnect(true));return;}svGo(()=>svUseLocal(r,null));});row.append(go);
    if(!cur){const x=document.createElement('button');x.type='button';x.className='sv-x';x.textContent='Forget';x.title='Take '+r.name+' off this list (the file itself stays where it is)';x.disabled=SV.busy;
      x.addEventListener('click',()=>svGo(async()=>{await svForget(r.id);SV.files=SV.files.filter(f=>f.id!==r.id);}));row.append(x);}
    L.append(row);}
  const st=svEl('saveStatus');st.textContent=SV.busy?'Just a moment…':(SV.status||SV.err||SV.ok||(SV.can&&!SV.files.length?'No save files yet: make a new one, or open one you saved before.':''));
  st.classList.toggle('bad',!!(SV.status||SV.err)&&!SV.busy);
  try{seedLine();}catch(e){}
}
// (the line under the menu and at the foot of the pause menu: the version, the city's seed and where it's saved)
function seedLine(){const sn=svEl('seedNote');if(!sn)return;
  const where=SV.mode==='local'&&SV.rec?(SV.perm==='granted'&&!SV.block?' · saving to '+SV.rec.name:' · saving in this browser until '+SV.rec.name+' can be reached'):'';   // (a browser save goes without saying)
  const t=TENV?`Testing Environment · ${TENV.boxes.length} structure${TENV.boxes.length===1?'':'s'} spawned · seed ${seed}`:`World seed ${seed}${worldCfgSent()?' · custom':''} · endless${where}`;
  sn.textContent='';const v=document.createElement('span');v.className='sn-ver';v.textContent='Version '+GAME_VER+' · ';sn.append(v,t);}
{
  const pan=svEl('savePanel'),l=svEl('saveLocal');
  l.addEventListener('click',()=>{const open=pan.hidden;titlePop(open?'savePanel':null);if(open&&SV.mode==='local'&&SV.perm!=='granted')svConnect(true);});
  svEl('saveBrowser').addEventListener('click',()=>{if(SV.mode==='local')svGo(svUseBrowser);});
  // (the pickers must open straight from the click, before anything's waited for)
  const newFile=fresh=>{if(!SV.can||SV.busy)return;const p=window.showSaveFilePicker({suggestedName:svNewName(),types:SV_TYPES,id:'gsg-saves'});
    svGo(async()=>{const h=await p,r=await svRec(h);r.name=h.name;svFlush();await svUseLocal(r,fresh?{}:svData());});};
  svEl('saveNewCopy').addEventListener('click',()=>newFile(false));
  svEl('saveNewFresh').addEventListener('click',()=>newFile(true));
  svEl('saveOpen').addEventListener('click',()=>{if(!SV.can||SV.busy)return;const p=window.showOpenFilePicker({types:SV_TYPES,id:'gsg-saves'});
    svGo(async()=>{const [h]=await p,r=await svRec(h);if(SV.mode==='local'&&r.id===SV.cur)return;await svUseLocal(r,null);});});
}
// ---- Export and import: a save file downloaded by hand, and one read back in. They're the same files Local save writes,
// so they open in either. Any browser can do this, Firefox and phones too, where Local save can't. ----
// (asking the browser not to clear the game's storage when the disk gets low: Firefox asks the player, Chrome decides
// for itself; once is enough)
let svPersistAsked=false;
function svPersist(){if(svPersistAsked)return;svPersistAsked=true;try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});}catch(e){}}
function svExportName(){const d=new Date(),z=n=>String(n).padStart(2,'0');return 'gus-world-'+seed+'-'+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'.json';}
async function svExport(){
  if(saveBlocked)throw new Error("In someone else's online game it's their world: they can export it.");
  await svFlushAll();const name=svExportName(),url=URL.createObjectURL(new Blob([svText(svData(),Date.now())],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  SV.status='';SV.ok='Exported '+name+' (look in your Downloads).';
}
// (an imported file replaces the city in this browser: it asks first, as the city there would be lost unless exported)
let svPending=null;
function svAskShow(on){svEl('saveAsk').hidden=!on;if(on)svEl('saveAskYes').focus();}
async function svImportPick(f){
  svPending=null;svAskShow(false);if(!f)return;
  if(saveBlocked)throw new Error("Not while you're in someone else's online game.");
  if(TENV)throw new Error('Leave the Testing Environment first: your world is parked while you\'re in it.');
  if(f.size>200e6)throw new Error("That file's too big to be a save.");
  const o=svParse(await f.text());if(o.empty)throw new Error("That file's empty.");
  svPending={o,name:f.name};
  svEl('saveAskTxt').textContent='Load '+f.name+(o.t?', saved '+svWhen(+o.t):'')+'? It replaces your browser world.';
  svAskShow(true);
}
async function svImport(){
  const P=svPending;svPending=null;svAskShow(false);if(!P)return;
  try{await svApply(P.o.data);}catch(e){throw new Error("This browser hasn't room to load "+P.name+'.');}
  SV.ok='Loading '+P.name+'…';svUi();setTimeout(svReload,400);
}
{const inp=svEl('saveImportFile');
 svEl('saveExport').addEventListener('click',()=>{if(SV.busy)return;svPersist();svGo(svExport);});
 svEl('saveImport').addEventListener('click',()=>{if(SV.busy)return;svPersist();inp.value='';inp.click();});
 inp.addEventListener('change',()=>{const f=inp.files&&inp.files[0];svGo(()=>svImportPick(f));});
 svEl('saveAskYes').addEventListener('click',()=>svGo(svImport));
 svEl('saveAskNo').addEventListener('click',()=>{svPending=null;svAskShow(false);svEl('saveImport').focus();});}
// Save now (the pause menu): everything saved this moment, to the file too in Local save, and it says whether it worked
{const b=svEl('saveNow');let tm=null;
 const say=(t,cls,why)=>{b.textContent=t;b.classList.remove('ok','bad');if(cls)b.classList.add(cls);b.title=why||'';clearTimeout(tm);tm=setTimeout(()=>{b.textContent='Save now';b.classList.remove('ok','bad');},why?8000:2500);};
 b.addEventListener('click',async()=>{
   if(saveBlocked){say('Not saved','bad',"In someone else's online game it's their world, saved on their computer.");return;}
   if(WB.pending){say('Still loading','bad','The world is still being read back in. Try again in a moment.');return;}
   b.textContent='Saving…';svPersist();
   try{await svFlushAll();}catch(e){say("Couldn't save",'bad',"The browser's storage is full"+(SV.can?': try Local save on the title screen, which saves to a file instead.':'.'));return;}
   if(SV.mode==='local'&&SV.rec&&!TENV){
     if(SV.perm!=='granted'||SV.block){say('Saved in browser','bad',SV.err||('The game isn\'t allowed to change '+SV.rec.name+' yet.'));return;}
     try{const t=Date.now(),d=svData();await svWrite(SV.rec.handle,svText(d,t));SV.last=JSON.stringify(d);SV.t=t;svSaveMode();svUi();}
     catch(e){say('Saved in browser','bad',"Couldn't write "+SV.rec.name+(e&&e.message?': '+e.message:''));return;}}
   say('Saved','ok');});}
// (getting going: the known files, and the one in use)
(async()=>{
  await null;   // (once the whole script has run, load() included)
  if(WB.pending)await worldLoadBig();
  if(SV.can)try{SV.files=await svFiles();}catch(e){SV.files=[];}
  if(SV.mode==='local'){SV.rec=SV.files.find(r=>r.id===SV.cur)||null;
    if(!SV.rec){SV.err=SV.can?"The save file in use last time isn't known any more: open it again, or pick another.":SV.why;}
    else{SV.perm=await svPerm(SV.rec.handle,false);if(SV.perm==='granted')await svSync();}}
  svUi();
})();
svUi();
