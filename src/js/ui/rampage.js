// ---------- This rampage: the pause menu's stats card ----------
// Beside the pause menu's buttons: goblins slain, score, the best combo, vehicles destroyed (any kind, wrecked by a player, not
// by accident), buildings demolished (each brought down by a player once, however many times it gives way: rampBldg),
// settlements razed (every building in them down, rampRazeTick), and where and when you are. Kept for the city you're
// in, so a new city starts them again (rampReset); online, a guest gets the host's in the snapshot (m.sc) like the score.
const RAMP={cars:0,best:0,bldgs:new Set(),razed:new Set(),pre:new Set(),seen:new Set(),nB:0,nR:0};
function rampReset(){RAMP.cars=0;RAMP.best=0;RAMP.nB=RAMP.nR=0;for(const k of ['bldgs','razed','pre','seen'])RAMP[k].clear();for(const p of players){p.cbN=0;p.cbT=0;}}
function rampBldg(key){if(BLAME==='acc'||RAMP.bldgs.has(key))return;RAMP.bldgs.add(key);RAMP.nB=RAMP.bldgs.size;}
// (a place counts once its total is known and it's all down. One already in ruins the first time it's worked out, from
// before this rampage, never counts)
function rampRazeTick(S){
  const k=S.rx+','+S.rz;if(!setListC.has(k)||RAMP.razed.has(k)||RAMP.pre.has(k))return;
  const gone=setDestroyed(S)>=1;if(!RAMP.seen.has(k)){RAMP.seen.add(k);if(gone){RAMP.pre.add(k);return;}}
  if(gone){RAMP.razed.add(k);RAMP.nR=RAMP.razed.size;}
}
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
  $('rpBldgs').textContent=rpNum(RAMP.nB);$('rpRazed').textContent=rpNum(RAMP.nR);
  const S=placeOf(p);let where=TENV?'Testing Environment':S?setName(S):'Out on the plains';
  try{where+=' · '+timeLabel();}catch(e){}
  $('rpWhere').textContent=where;
  $('rpNote').textContent=TENV?'Doesn\'t count here':
    '';
}
