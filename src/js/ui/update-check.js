// ---------- Is there a newer version? ----------
// Every build writes game/version.json beside the game (tools/build.py): its version and an id for that exact build. When
// the game's opened from the website it fetches that file, past the browser's cache, and if the id isn't its own, a newer
// game has been published there since this copy was loaded (or cached), so an Update button appears on the title screen
// and at the foot of the pause menu. Each copy on the site checks its own folder's file, so the test and hotfix links
// check against their own latest, and an old version kept under /v/X/ only ever finds itself. Opened as a file, it
// doesn't check at all.
const UPD={v:null};
function updShow(){const b=document.getElementById('updBtn');if(!b||!UPD.v)return;b.hidden=false;
  const nv=UPD.v.version&&UPD.v.version!==GAME_VER?'Update to version '+UPD.v.version:'Update available';
  b.firstChild.textContent=nv+' ';b.title='A newer build of the game has been published. Your world is saved first, then the page reloads with it.';}
function updCheck(){
  if(typeof location==='undefined'||!/^https?:$/.test(location.protocol)||!window.fetch||GAME_BUILD.indexOf('{{')===0)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{
    if(v&&typeof v.build==='string'&&v.build&&v.build!==GAME_BUILD){UPD.v=v;updShow();}}).catch(()=>{});
}
// (updating: the game's saved first, to its file too in Local save, then reloaded at an address the browser hasn't cached)
document.getElementById('updBtn').addEventListener('click',async()=>{
  if(!UPD.v)return;const b=document.getElementById('updBtn');b.disabled=true;b.firstChild.textContent='Updating… ';
  try{await svFlushAll();if(SV.mode==='local'&&SV.rec&&SV.perm==='granted'&&!SV.block&&!TENV)await svWrite(SV.rec.handle,svText(svData(),Date.now()));}catch(e){}
  clearTimeout(saveTimer);saveBlocked=true;location.replace(location.pathname+'?u='+encodeURIComponent(UPD.v.build)+location.hash);
});
updCheck();
// (and again now and then, for a game left open: every half hour)
{const iv=setInterval(updCheck,30*60*1000);if(iv&&iv.unref)iv.unref();}
