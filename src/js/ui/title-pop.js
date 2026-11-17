// ---------- The title menu's pop-out cards ----------
// The title screen's menu card never scrolls: what a button opens (Play online, New city's "are you sure?", Local saves)
// pops out to the left of the card, beside the button that opened it, one at a time. (Paused, the same cards open in
// the pause menu's own row, and on a narrow screen inside the card, as before: see style.css, .tpop.)
const TITLE_POPS=['onlinePanel','confirm','savePanel'];
const TITLE_POP_BY={onlinePanel:'onlineBtn',confirm:'newWorld',savePanel:'saveLocal'};
// (show one of them, by id, and close the rest; null closes them all)
function titlePop(id){
  for(const k of TITLE_POPS){const el=document.getElementById(k);if(!el)continue;const on=k===id;
    if(k==='onlinePanel'&&!on&&!el.hidden){document.getElementById('onlineBtn').click();continue;}   // (closed its own way, so the lobby stops listening)
    if(el.hidden===on)el.hidden=!on;const b=document.getElementById(TITLE_POP_BY[k]);if(b&&k!=='confirm')b.setAttribute('aria-expanded',String(on));}
  titlePopPlace();
}
// (beside its button: level with it where there's room, otherwise as low as it fits on screen, never off the top)
function titlePopPlace(){
  const menu=document.getElementById('titleMenu');if(!menu||!menu.getBoundingClientRect)return;
  for(const k of TITLE_POPS){const el=document.getElementById(k);if(!el||el.hidden)continue;
    const b=document.getElementById(TITLE_POP_BY[k]),mr=menu.getBoundingClientRect();
    if(getComputedStyle(el).position!=='absolute'){el.style.top='';continue;}
    const want=b?b.offsetTop-12:0,h=el.offsetHeight,room=innerHeight-110-mr.top;
    el.style.top=Math.round(Math.max(16-mr.top,Math.min(want,room-h)))+'px';}
}
for(const k of TITLE_POPS){const b=document.getElementById(TITLE_POP_BY[k]),el=document.getElementById(k);
  // (each button already opens its own card; this closes the others, and places it, once the button's own handler has
  // run: New city's is added further on)
  if(b&&k!=='savePanel')b.addEventListener('click',()=>setTimeout(()=>{if(!el.hidden)titlePop(k);},0));
  if(el&&window.ResizeObserver)new ResizeObserver(()=>titlePopPlace()).observe(el);}
addEventListener('resize',titlePopPlace);
