// ---------- The world, saved and loaded: the smashed blocks packed chunk by chunk, save() and load() ----------
// (It was the top of render/sky.js. What goes where once it is saved, the browser or a file, is ui/saves.js.)
let saveTimer=null;
// ---- smashed blocks, packed: in the save they go chunk by chunk, grouped by what's there now, each as three characters (where in
// the chunk it is, in base 64), rather than about seventeen as "x,y,z":b. That's six times as many before the browser's storage
// fills, and a chunk nothing's happened in since the last save just reuses its string, so saving doesn't grow with the city's ruin. ----
const ED64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',edPackC=new Map();
function edPackChunk(m){
  const by=new Map();for(const [i,b] of m){const s=ED64[i>>12&63]+ED64[i>>6&63]+ED64[i&63];let a=by.get(b);if(!a){a=[];by.set(b,a);}a.push(s);}
  const out=[];for(const [b,a] of by)out.push(b+':'+a.join(''));return out.join(';');
}
function editsPacked(){
  const out={};
  for(const [k,L] of chunkEdits){let c=edPackC.get(k);
    if(!c||c.L!==L||c.n!==L.v){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;c={L,n:L.v,key:cx+','+cz,str:edPackChunk(L)};edPackC.set(k,c);}
    out[c.key]=c.str;}
  return out;
}
function editsUnpack(P){
  for(const key in P){const [cx,cz]=key.split(',').map(Number),x0=cx*CS,z0=cz*CS,ck=ckey(cx,cz);let l=chunkEdits.get(ck);if(!l){l=new Map();l.v=0;chunkEdits.set(ck,l);}l.v++;
    for(const part of P[key].split(';')){const c=part.indexOf(':'),b=+part.slice(0,c);
      for(let o=c+1;o+2<part.length;o+=3){const i=ED64.indexOf(part[o])<<12|ED64.indexOf(part[o+1])<<6|ED64.indexOf(part[o+2]);
        l.set(i,b);}}}
}
// (the world as saved; extra: anything else to go in with it)
const saveObj=extra=>Object.assign({seed,gen:WORLD_GEN,cfg:worldCfgSent(),ed2:editsPacked(),coll:collapses,craters,wreck:wrecked,down:[...downFix],dest:destroyed,test:[...TEST_OFF]},extra);
const saveText=extra=>JSON.stringify(saveObj(extra));
let saveFullSaid=false;
var WB={on:false,pending:null,saved:null};   // (a city too big for localStorage: see worldPut in ui/saves.js)
// (worldPut, in ui/saves.js, puts it in localStorage, or once the city's grown too big for that, its smashed blocks in
// IndexedDB and the rest in localStorage. Saving waits while a big city's smashed blocks are still being read back in.)
// (Saved 0.7 s after the last change, but no later than 5 s after the first one not yet saved: a long rampage or a fire
// that never lets up used to put the save off for as long as it went on.)
let saveDue=0;
function save(){if(saveBlocked||WB.pending)return;const now=Date.now();if(!saveDue)saveDue=now+5000;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveDue=0;if(saveBlocked||WB.pending)return;flushNotes(Infinity);
  let o;try{o=saveObj({tenv:TENV||undefined});}catch(e){return;}
  worldPut(o).then(()=>{saveFullSaid=false;},()=>{
  // (better to say so once than to quietly stop saving)
  if(!saveFullSaid){saveFullSaid=true;try{flashLabel("Can't save: the browser's storage is full");}catch(e2){}}});},Math.max(0,Math.min(700,saveDue-now)));}
// (A save that can't be read is kept aside under SAVE_KEY+'-unreadable' before a new world's first save goes over it.)
let loadBad=false;
function loadKeep(raw){try{if(raw&&!netWorldText()){loadBad=true;localStorage.setItem(SAVE_KEY+'-unreadable',raw);}}catch(e){}}
function load(){let raw=null;try{raw=netWorldText()||localStorage.getItem(SAVE_KEY);const s=JSON.parse(raw||'null');   // (a tab joining a game online builds the host's world, kept in its own session storage)
  if(netWorldText())saveBlocked=true;if(s&&typeof s.seed==="number"&&(s.gen===undefined||s.gen===WORLD_GEN)){seed=s.seed;if(s.cfg&&typeof s.cfg==='object')worldCfgSet(s.cfg);TEST_OFF=new Set(Array.isArray(s.test)?s.test:[]);TENV=s.tenv&&Array.isArray(s.tenv.boxes)?{boxes:s.tenv.boxes.filter(B=>B&&[B.ax,B.az,B.w,B.h].every(Number.isFinite))}:null;if(TENV&&s.tenv.sea&&['x0','x1','z0','z1'].every(k=>Number.isFinite(s.tenv.sea[k])))TENV.sea=s.tenv.sea;tenvIndex();if(s.ed2db&&!s.ed2){WB.on=true;WB.pending=s.ed2db;}const oldE=s.ed2?null:s.edits||{};collapses=s.coll||{};craters=bbValid(s.craters);wrecked=(s.wreck&&typeof s.wreck==='object')?s.wreck:{};destroyed=(s.dest&&typeof s.dest==='object')?s.dest:{};destroyVer++;setDCache.clear();downFix=new Map(Array.isArray(s.down)?s.down:[]);if(s.ed2)editsUnpack(s.ed2);else for(const k in oldE){const [x,y,z]=k.split(',').map(Number);editPut(x,y,z,oldE[k]);}return true;}}catch(e){loadKeep(raw);}return false;}
