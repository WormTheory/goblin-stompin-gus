// ---------- This rampage: the pause menu's stats card ----------
// Beside the pause menu's buttons: goblins flattened, score, the best combo, cars tossed (wrecked by a player, not
// by accident), how wrecked the place you're in is, and where and when you are. Kept for the city you're in, so a new
// city starts them again (rampReset); online, a guest gets the host's in the snapshot (m.sc) like the score.
const RAMP={cars:0,best:0};
function rampReset(){RAMP.cars=0;RAMP.best=0;for(const p of players){p.cbN=0;p.cbT=0;}}
const rpNum=n=>Math.round(n).toLocaleString('en-US');
// (the place a player is in: a town's name, or the place the coast round it belongs to; null out on the plains)
function placeOf(p){
  if(!p||TENV)return null;const px=Math.floor(p.pos.x/CELL),pz=Math.floor(p.pos.z/CELL);
  return settlementAt(px,pz)||coastOwner(px,pz)||null;
}
function renderRampage(){
  const $=id=>document.getElementById(id);if(!$('rampage'))return;
  const p=menuBy&&menuBy.active?menuBy:players.find(q=>q.active)||P1;
  $('rpKills').textContent=rpNum(kills);$('rpScore').textContent=rpNum(score);
  $('rpCombo').textContent='x'+RAMP.best;$('rpCars').textContent=rpNum(RAMP.cars);
  const S=placeOf(p);let where=TENV?'Testing Environment':S?setName(S):'Out on the plains';
  try{where+=' · '+timeLabel();}catch(e){}
  $('rpWhere').textContent=where;
  // (how much of this place is wrecked: only once its total has been worked out, which happens as you go through it)
  const v=S&&setListC.has(S.rx+','+S.rz)?setDestroyed(S):null,w=$('rpWreck'),wv=$('rpWreckV'),box=$('rpWreckBox');
  if(box)box.hidden=v==null;
  if(v!=null){const pc=Math.round(v*100);w.style.width=pc+'%';wv.textContent=pc+'%';w.classList.toggle('none',pc===0);}
  $('rpNote').textContent=TENV?'Nothing here counts toward a rampage: it\'s for trying things out.':
    !begun?'':kills+RAMP.cars===0?'Nothing flattened yet. Off you go.':'';
}
