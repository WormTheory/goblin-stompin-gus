// ---- the police's handgun: drawn and fired at range, holstered for the club up close ----
// (an officer is GOB_FOES.police, weapons.js: a club and a handgun, as WEAPONS has them, the handgun aimed for a moment
// from 4 blocks out; inside that they put it away and use the club)
// an officer of any kind (out of a police car, carjacked out of one, or the Testing Environment's): armed and ready
function copArm(g){if(!g.pkit)return;g.arms=GOB_FOES.police;g.aim=0;g.aimK=null;g.gunCD=0.4+Math.random()*0.8;g.bombCD=99;g.relK=null;}
// which is in hand, for one whose model carries a gun beside its blade or club (a street goblin's: goblinModel): the gun
// while it's aimed and just after the shot, the club the rest of the time, the holster on the belt whenever the gun isn't
// out. 0 the club alone (its kind carries no gun), 1 club and holster, 2 the gun out (online guests are sent this: net-sync.js)
const copKitState=g=>{const k=foeGunK(foeOf(g));if(!k)return 0;return g.aim>0&&g.aimK==='gun'||(g.relS??9)<STRIKE_FT&&g.relK===WEAPONS[k].npc.pose?2:1;};
function copKitShow(K,n){
  if(K.shown===n)return;K.shown=n;   // (only when it changes: batDraw picks the change up)
  for(const m of K.club)m.visible=n!==2;for(const m of K.pis)m.visible=n===2;for(const m of K.hol)m.visible=n===1;
}
// (in the game: put away once it's dead, or calmed down by the hostility setting with a shot half aimed)
const copKit=g=>{const n=copKitState(g);copKitShow(g.pkit,n===2&&(g.state!=='chase'||calmNow())?1:n);};
