// ---- how a goblin's blow looks: a wind-up, the strike, and the follow-through, for each weapon ----
// One timeline per kind of blow, u from 0 to 2: 0 to 1 the wind-up, the blow landing at exactly 1 (the frame its hit is
// worked out, so nothing about when a blow lands has changed), 1 to 2 the follow-through and back to the rest. Each key:
// [u, arm's swing, arm out to the side, wrist, free arm's swing, twist at the waist, lean forward, half-step forward, ease
// in to it ('i' gathering speed, for the strike itself; 'o' slowing; otherwise smooth)]. The twist, lean and step are
// only for the look: where the goblin really stands doesn't move. The street's goblins, the compounds' people, cultists,
// Gnash and Grizzle as others see them, and the Dev tab's Enemies section all pose from these.
// (The arm's swing: 0 hangs down, -1.57 straight out in front, -3.14 straight up, past that back behind the head. The
// weapon's in the wrist: a club or a dagger points along the forearm's front, so it's level when the arm and wrist add up
// to 0; a rifle hangs on down past the hand.)
const STRIKE_FT=0.35;   // (seconds of follow-through after a blow, a throw or a shot)
// (the timelines themselves are in src/assets/clips/, one file per clip, edited with the editor in tools/editor/:
// core/assets.js builds this table from them as the page loads. A clip's layout says what its numbers are: body for the
// keys described above; vm, Gnash's own arm in first person, [tilt, across, up, forward, roll]; vr, a first-person
// reload added to where the gun's held, [tilt, roll, across, up, forward, how far out the magazine is])
const STRIKES=assetClipsAll(ASSETS);
const _SP=new Float32Array(8);
// (a blow's own wind-up and follow-through, in seconds: a heavy weapon's are longer, its npc's wind and ft)
const strikeWind=k=>WEAPONS[k]&&WEAPONS[k].npc&&WEAPONS[k].npc.wind||0.45,strikeFt=k=>WEAPONS[k]&&WEAPONS[k].npc&&WEAPONS[k].npc.ft||STRIKE_FT;
function strikeAt(w,u){
  const K=STRIKES[w];u=Math.max(0,Math.min(2,u));let i=1;while(i<K.length-1&&K[i][0]<u)i++;
  const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))),e=b[b.length-1],k=e==='i'?s*s:e==='o'?1-(1-s)*(1-s):s*s*(3-2*s);
  const n=typeof e==='string'?b.length-2:b.length-1;for(let j=0;j<n;j++)_SP[j]=a[j+1]+(b[j+1]-a[j+1])*k;return _SP;
}
// how long the strike itself takes: from the last key before the blow lands to the blow (the Dev tab's frame data)
const strikeSwing=w=>{const K=STRIKES[w];let u=0;for(const k of K)if(k[0]<1)u=k[0];return 1-u;};
// which blow a goblin strikes with: what it strikes with up close (foeMeleeK: a dagger, a club, a rifle by its butt), or
// with nothing, its fists, whose blow is the club's overarm swing
const gobWk=g=>{const k=foeMeleeK(foeOf(g)),W=k&&WEAPONS[k];return W&&W.npc&&W.npc.strike||'club';};   // (the blow its weapon strikes: WEAPONS)
// pose a goblin model's arms at u along a blow (only:'L' just the free arm), and keep the twist, lean and step on m.atkX
// for whoever places its root
function gobStrike(m,w,u,only){
  const v=strikeAt(w,u),X=m.atkX||(m.atkX={tw:0,ln:0,lu:0});m.posed=true;
  if(only!=='L'){m.arm.rotation.x=v[0];m.arm.rotation.z=v[1];if(m.arm.hand)m.arm.hand.rotation.x=v[2];}
  m.armL.rotation.x=v[3];X.tw=v[4];X.ln=v[5];X.lu=v[6];
}
// a blow cut short (stunned, out of reach): what only a blow sets eases back to nothing
function gobStrikeEase(m,dt){
  const k=Math.min(1,dt*10);m.arm.rotation.z-=m.arm.rotation.z*k;if(m.arm.hand)m.arm.hand.rotation.x-=m.arm.hand.rotation.x*k;
  const X=m.atkX;if(X){X.tw-=X.tw*k;X.ln-=X.ln*k;X.lu-=X.lu*k;}
}
// a melee goblin's arm this frame: winding up (atk, the seconds till its blow, under 0.45 and in reach), following through
// (atkS, the seconds since its last blow), or neither (false: its own code puts the arm back at the rest)
function gobMeleePose(g,winding){
  const mk=foeMeleeK(foeOf(g)),wd=strikeWind(mk),ft=strikeFt(mk);
  if(winding&&g.atk<wd){gobStrike(g,gobWk(g),1-Math.max(0,g.atk)/wd);return true;}
  if((g.atkS??9)<ft){gobStrike(g,gobWk(g),1+g.atkS/ft);return true;}
  return false;
}
// where a model's root goes, with the blow's twist, lean and step added (h its heading, x0 any lean of its own)
function gobBodyRoot(root,m,x,y,z,h,x0=0){
  const X=m.atkX,lu=X?X.lu:0;root.position.set(x+Math.sin(h)*lu,y,z+Math.cos(h)*lu);root.rotation.y=h+(X?X.tw:0);
  if(X||x0)root.rotation.x=x0+(X?X.ln:0);
}
// a street goblin's root, at height y: anything a blow set and nothing posed this frame eases back first
function gobRootPose(g,y,dt){if(!g.posed&&g.atkX)gobStrikeEase(g,dt);g.posed=false;gobBodyRoot(g.root,g,g.pos.x,y,g.pos.z,g.heading);}
// (both hands on a gun: gunGrip, in enemies/grip.js)
// which gun a street goblin has out to grip, if any (null: one hand, or none, as posed): an officer's handgun while it's
// drawn, a rifle always, unless the goblin is dead, climbing, swimming, or has the free hand busy (a grenade, a fireball,
// thrown up in a panic)
function gunHeld(g){
  const k=g.wkit&&g.wkit.shown===2?WEAPONS[g.wkit.k].npc.aim:g.root.gunK;if(!k)return null;
  if(g.state==='dead'||g.dead||g.hp<=0||g.act||g.wet||g.relT>0||g.orb&&g.orb.visible||g.mineB&&g.mineB.visible||g.armL.rotation.x<-1.9||g.arm.rotation.x<-2.3)return null;
  return k;
}
