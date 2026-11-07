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
const STRIKES={
  // a club: lifted up and cocked behind the head, a beat at the top, then chopped down through the target with a snap of
  // the wrist, the body turning into it
  club:[[0,-0.5,0,0,0,0,0,0],[0.45,-2.5,0.2,-0.3,-0.6,0.22,-0.05,0,'o'],[0.8,-3.55,0.3,-0.7,-0.9,0.4,-0.12,-0.05],
    [0.86,-3.65,0.3,-0.75,-0.95,0.42,-0.13,-0.06],[1,-1.0,0.05,1.3,0.35,-0.3,0.18,0.15,'i'],[1.25,-0.3,0,1.0,0.4,-0.35,0.2,0.15,'o'],[2,-0.5,0,0,0,0,0,0]],
  // a dagger: drawn back to the hip, point first, the free hand out in front; then driven straight in at arm's length
  dagger:[[0,-0.5,0,0,0,0,0,0],[0.65,0.55,0.15,-0.55,-1.0,0.45,-0.05,-0.08,'o'],[0.84,0.6,0.15,-0.6,-1.05,0.48,-0.06,-0.1],
    [1,-1.45,-0.12,1.45,0.25,-0.35,0.16,0.2,'i'],[1.3,-1.4,-0.12,1.4,0.2,-0.3,0.14,0.18],[2,-0.5,0,0,0,0,0,0]],
  // a rifle butt: the rifle swung up and over till the barrel points back and the stock forward, pulled back to the hip,
  // then the stock shoved into the target with both hands, and swung back over the top to carry it again
  butt:[[0,-0.5,0,0,0,0,0,0],[0.4,-1.0,0.2,-2.0,-0.9,0.2,0,0,'o'],[0.8,-0.45,0.35,-4.26,-0.7,0.5,-0.08,-0.08],
    [0.86,-0.42,0.35,-4.3,-0.7,0.52,-0.09,-0.1],[1,-1.45,0.3,-3.26,-1.3,-0.3,0.2,0.2,'i'],[1.3,-1.35,0.3,-3.36,-1.2,-0.25,0.16,0.18],[2,-0.5,0,0,0,0,0,0]],
  // a rifle shot: shouldered and held on the target, then the kick, and back down
  aim:[[0,-0.5,0,0,0,0,0,0],[0.35,-1.5,0,0,-1.35,0.15,0.04,0,'o'],[1,-1.5,0,0,-1.35,0.15,0.04,0],
    [1.06,-1.85,0,0,-1.55,0.15,-0.08,-0.06,'o'],[1.4,-1.5,0,0,-1.35,0.15,0.02,0],[2,-0.5,0,0,0,0,0,0]],
  // a grenade: the free hand drawn back behind the head, the other arm out at the target, then thrown overarm
  throw:[[0,-0.5,0,0,0,0,0,0],[0.35,-0.9,0,0,-2.3,-0.15,-0.03,0,'o'],[0.78,-1.2,0,0,-3.7,-0.45,-0.12,-0.05],
    [0.86,-1.2,0,0,-3.75,-0.47,-0.13,-0.06],[1,-0.4,0,0,-1.5,0.35,0.15,0.12,'i'],[1.3,-0.3,0,0,-0.7,0.4,0.18,0.12,'o'],[2,-0.5,0,0,0,0,0,0]],
  // a cultist's fireball: raised high in the free hand as it grows, drawn back, then hurled
  cast:[[0,-0.5,0,0,0,0,0,0],[0.4,-0.6,0,0,-2.6,-0.1,-0.03,0,'o'],[0.8,-0.7,0,0,-3.4,-0.35,-0.1,-0.04],
    [0.88,-0.7,0,0,-3.5,-0.38,-0.11,-0.05],[1,-0.4,0,0,-1.3,0.35,0.15,0.12,'i'],[1.3,-0.35,0,0,-0.8,0.35,0.15,0.1,'o'],[2,-0.5,0,0,0,0,0,0]],
  // Gnash's and Grizzle's own arm in first person: [u, its tilt, across, up, forward]
  // (the club held back, not right up: any higher and it's out of the top of the picture, and you'd never see the wind-up)
  vmClub:[[0,0.08,0.52,-0.62,-0.72],[0.7,0.8,0.62,-0.5,-0.7,'o'],[0.8,0.85,0.62,-0.49,-0.69],[1,-0.55,0.36,-0.7,-0.82,'i'],[1.3,-0.75,0.34,-0.76,-0.8],[2,0.08,0.52,-0.62,-0.72]],
  vmDagger:[[0,0.3,0.46,-0.6,-0.66],[0.65,0.42,0.5,-0.56,-0.5,'o'],[0.75,0.44,0.5,-0.56,-0.48],[1,0.02,0.34,-0.6,-1.1,'i'],[1.35,0.04,0.34,-0.6,-1.06],[2,0.3,0.46,-0.6,-0.66]]};
const _SP=new Float32Array(8);
function strikeAt(w,u){
  const K=STRIKES[w];u=Math.max(0,Math.min(2,u));let i=1;while(i<K.length-1&&K[i][0]<u)i++;
  const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))),e=b[b.length-1],k=e==='i'?s*s:e==='o'?1-(1-s)*(1-s):s*s*(3-2*s);
  const n=typeof e==='string'?b.length-2:b.length-1;for(let j=0;j<n;j++)_SP[j]=a[j+1]+(b[j+1]-a[j+1])*k;return _SP;
}
// how long the strike itself takes: from the last key before the blow lands to the blow (the Dev tab's frame data)
const strikeSwing=w=>{const K=STRIKES[w];let u=0;for(const k of K)if(k[0]<1)u=k[0];return 1-u;};
// which blow a goblin strikes with: a dagger (cultists, thieves), a rifle butt (whoever carries a rifle), or a club (the
// street's goblins and police, and anyone bare-handed, whose blow is the same overarm swing)
const gobWk=g=>g.cultist||g.foeKind==='thief'?'dagger':g.foeKind&&FOES[g.foeKind]&&FOES[g.foeKind].gear==='rifle'?'butt':'club';
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
  if(winding&&g.atk<0.45){gobStrike(g,gobWk(g),1-Math.max(0,g.atk)/0.45);return true;}
  if((g.atkS??9)<STRIKE_FT){gobStrike(g,gobWk(g),1+g.atkS/STRIKE_FT);return true;}
  return false;
}
// where a model's root goes, with the blow's twist, lean and step added (h its heading, x0 any lean of its own)
function gobBodyRoot(root,m,x,y,z,h,x0=0){
  const X=m.atkX,lu=X?X.lu:0;root.position.set(x+Math.sin(h)*lu,y,z+Math.cos(h)*lu);root.rotation.y=h+(X?X.tw:0);
  if(X||x0)root.rotation.x=x0+(X?X.ln:0);
}
// a street goblin's root, at height y: anything a blow set and nothing posed this frame eases back first
function gobRootPose(g,y,dt){if(!g.posed&&g.atkX)gobStrikeEase(g,dt);g.posed=false;gobBodyRoot(g.root,g,g.pos.x,y,g.pos.z,g.heading);}
