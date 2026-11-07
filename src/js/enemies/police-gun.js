// ---- the police's handgun: drawn and fired at range, holstered for the club up close ----
// (as FOES' guns: shortest and longest range, seconds to aim, cooldown range, damage, cause. Shorter reach and quicker on
// the draw than a rifle; inside 4 blocks they put it away and use the club)
const COP_GUN=[4,30,0.45,[1.6,2.6],1,'Shot by the police'];
const COP_FOE={gun:COP_GUN,pistol:true};   // (what foeRanged reads for an officer: a handgun, no grenades)
// an officer of any kind (out of a police car, carjacked out of one, or the Testing Environment's): armed and ready
function copArm(g){if(!g.pkit)return;g.gun=COP_FOE;g.aim=0;g.aimK=null;g.gunCD=0.4+Math.random()*0.8;g.bombCD=99;g.relK=null;}
// which is in hand: the handgun while it's aimed and just after the shot, the club the rest of the time; an officer's
// holster shows on the belt whenever the gun isn't out. 0 nothing (not police), 1 club and holster, 2 the gun out (online
// guests are sent this: net-sync.js)
const copKitState=g=>!g.gun?0:g.aim>0&&g.aimK==='gun'||(g.relS??9)<STRIKE_FT&&g.relK==='pistol'?2:1;
function copKitShow(K,n){
  if(K.shown===n)return;K.shown=n;   // (only when it changes: batDraw picks the change up)
  for(const m of K.club)m.visible=n!==2;for(const m of K.pis)m.visible=n===2;for(const m of K.hol)m.visible=n===1;
}
// (in the game: put away once it's dead, or calmed down by the hostility setting with a shot half aimed)
const copKit=g=>{const n=copKitState(g);copKitShow(g.pkit,n===2&&(g.state!=='chase'||calmNow())?1:n);};
