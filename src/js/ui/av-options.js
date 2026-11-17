// ---------- Options: Sound volume, Brightness and Hide blood ----------
// All three are kept in this browser and go for everyone at once: split screen shares one sound system and one picture.
// (The volume itself is in core/audio.js, sndDest; Hide blood in destruction/smashing.js, BLOOD_OFF.)
const BRIGHT_KEY='goblin-stompin-gus-brightness';
const BRIGHT_MIN=0.2,BRIGHT_MAX=2.5;   // (20% to 250%: from a dim night-time look to washed out)
let brightness=1;try{const v=localStorage.getItem(BRIGHT_KEY);if(v!==null&&+v>=BRIGHT_MIN&&+v<=BRIGHT_MAX)brightness=+v;}catch(e){}
// (brightness is a filter on the 3D view's own canvas, so the menus, HUD and text over it stay as they are; at 100% there's
// no filter at all, so it costs nothing unless it's used)
function brightApply(){const c=document.getElementById('world');if(c&&c.style)c.style.filter=Math.abs(brightness-1)<0.001?'':'brightness('+brightness+')';}
{
  const vs=document.getElementById('sndVol'),vl=document.getElementById('sndVolVal');
  const showV=()=>{vs.value=String(Math.round(sndVol*100));vl.textContent=Math.round(sndVol*100)+'%';};showV();
  vs.addEventListener('input',()=>{setSndVol(Math.round(+vs.value||0)/100);showV();});
  // (a little blip at the new volume once the slider's let go, so you can hear what it's set to)
  vs.addEventListener('change',()=>{tone('triangle',660,0,0.08,0.06);});
  const bs=document.getElementById('brightness'),bl=document.getElementById('brightVal');
  const showB=()=>{bs.value=String(Math.round(brightness*100));bl.textContent=Math.round(brightness*100)+'%';};showB();brightApply();
  bs.addEventListener('input',()=>{brightness=Math.max(BRIGHT_MIN,Math.min(BRIGHT_MAX,Math.round(+bs.value||100)/100));showB();brightApply();try{localStorage.setItem(BRIGHT_KEY,String(brightness));}catch(e){}});
  const bt=document.getElementById('bloodTog');
  const showBl=()=>bt.setAttribute('aria-checked',String(BLOOD_OFF));showBl();
  bt.addEventListener('click',()=>{BLOOD_OFF=!BLOOD_OFF;showBl();try{localStorage.setItem(BLOOD_KEY,BLOOD_OFF?'1':'0');}catch(e){}
    // (switched on: what's already been spilt goes too)
    if(BLOOD_OFF){for(const d of decals)d.visible=false;decalsDirty=true;for(const p of players)p.pool.visible=false;}});
}
