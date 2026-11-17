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
  // a handgun shot (police): the rifle's, but held out at arm's length in both hands, a little in to the middle, and the
  // kick snapping the wrist and the muzzle up rather than shoving the shoulder back
  pistol:[[0,-0.5,0,0,0,0,0,0],[0.35,-1.57,-0.1,0,-1.47,0.12,0.03,0,'o'],[1,-1.57,-0.1,0,-1.47,0.12,0.03,0],
    [1.06,-1.85,-0.1,-0.45,-1.7,0.12,-0.05,-0.04,'o'],[1.4,-1.57,-0.1,0,-1.47,0.12,0.02,0],[2,-0.5,0,0,0,0,0,0]],
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
const gobWk=g=>{if(g.cultist)return'dagger';const F=g.foeKind&&FOES[g.foeKind],W=F&&WEAPONS[F.gear];return W&&W.npc&&W.npc.strike||'club';};   // (the blow its weapon strikes: WEAPONS)
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
// ---- both hands on a gun ----
// The rig has no elbows: each arm is a straight 0.4 from its shoulder, and the shoulders are 0.64 apart, so with the gun
// held out along the weapon arm (as the poses above have it) the free hand was left hanging in the air beside it. Just
// before a goblin with a gun is drawn (batDraw, gobCamera, the Dev tab's recordings), the pose is read for where the gun
// points, and the arms are put round it: the weapon hand in toward the middle (a rifle's stock tucked into the shoulder,
// a handgun out in front of the chest), the wrist turning the gun back to where it pointed, and the free hand on the
// rifle's foregrip or wrapped under the handgun's grip. A rifleman turns side-on to his target, the head turned back to
// it; a rifle that isn't being aimed is carried low across the body, both hands on it. What the pose said is put back
// after drawing (gunGripUndo), so the goblin's own code, and what's sent online, never see any of this.
// (rows of 3 x 3 rotation matrices; ggEul is a three.js 'XYZ' Euler's)
const ggEul=(x,y,z)=>{const a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z),af=a*f,be=b*e,ae=a*e,bf=b*f;
  return [c*e,-c*f,d,af+be*d,ae-bf*d,-b*c,bf-ae*d,be+af*d,a*c];};
const ggMul=(A,B)=>{const o=new Array(9);for(let r=0;r<3;r++)for(let c=0;c<3;c++)o[r*3+c]=A[r*3]*B[c]+A[r*3+1]*B[3+c]+A[r*3+2]*B[6+c];return o;};
const ggT=A=>[A[0],A[3],A[6],A[1],A[4],A[7],A[2],A[5],A[8]];
const ggNorm=v=>{const n=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/n,v[1]/n,v[2]/n];};
const ggX=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// where each hand goes (in the body's own frame: x to the weapon arm's side, y up, z forward), how far round the body
// turns, and how far a shoulder may reach to get its hand there
const GUN_GRIP={
  rifle:{sh:[0.1,0.84,0.12],out:0.16,fore:[0.12,0.22],tw:[0.75,0.75],low:-0.5,reach:0.1},
  pistol:{sh:[0.04,0.92,0],out:0.29,fore:[0,0],tw:[0,0],reach:0.08}};
// turn an arm (a straight 0.4 from its pivot) to put its end at T, the shoulder giving a little (up to r) if it's too far
// or too near; [shoulder x,y,z] is where it starts
function ggArm(arm,P0,T,r){
  const v=[T[0]-P0[0],T[1]-P0[1],T[2]-P0[2]],L=Math.hypot(v[0],v[1],v[2])||1,d=[v[0]/L,v[1]/L,v[2]/L],s=Math.max(-r,Math.min(r,L-0.4));
  arm.position.set(P0[0]+d[0]*s,P0[1]+d[1]*s,P0[2]+d[2]*s);
  const z=Math.asin(Math.max(-1,Math.min(1,d[0]))),x=Math.atan2(-d[2],-d[1]);arm.rotation.set(x,0,z);return ggEul(x,0,z);
}
// m a goblin model, root what it hangs off, k 'rifle' or 'pistol'
function gunGrip(m,root,k){
  const C=GUN_GRIP[k],A=m.arm,H=A.hand,Lm=m.armL;if(!C||!H)return;
  const butt=Math.abs(H.rotation.x)>1.2;if(butt)return;   // (turned over for a blow with the butt: as the blow has it, strikes.js)
  m._gg=[A.rotation.x,A.rotation.y,A.rotation.z,A.position.x,A.position.y,A.position.z,H.rotation.x,H.rotation.y,H.rotation.z,
    Lm.rotation.x,Lm.rotation.y,Lm.rotation.z,Lm.position.x,Lm.position.y,Lm.position.z,root.rotation.y,m.head.rotation.y];
  // where the pose has the gun pointing, and which way is its top
  const Mi=ggMul(ggEul(A.rotation.x,A.rotation.y,A.rotation.z),ggEul(H.rotation.x,H.rotation.y,H.rotation.z));
  let g=[-Mi[1],-Mi[4],-Mi[7]],up=[Mi[2],Mi[5],Mi[8]];
  // (a rifle that isn't up at the shoulder is carried low, pointing ahead and down)
  let s=1;
  if(k==='rifle'){s=Math.max(0,Math.min(1,(-0.9-A.rotation.x)/0.5));s=s*s*(3-2*s);
    if(s<1){const h=Math.atan2(g[0],g[2]),e=C.low,c=[Math.sin(h)*Math.cos(e),Math.sin(e),Math.cos(h)*Math.cos(e)];
      g=ggNorm([c[0]+(g[0]-c[0])*s,c[1]+(g[1]-c[1])*s,c[2]+(g[2]-c[2])*s]);up=[up[0]*s,up[1]*s+(1-s),up[2]*s];}}
  // turned side-on: the body round by tw, and the gun (and the head) back by as much, so it points where it did
  const tw=C.tw[0]+(C.tw[1]-C.tw[0])*s,ct=Math.cos(tw),st=Math.sin(tw),ry=v=>[v[0]*ct-v[2]*st,v[1],v[0]*st+v[2]*ct];
  if(tw){root.rotation.y+=tw;m.head.rotation.y=-tw*0.85;g=ry(g);up=ry(up);}
  const dg=up[0]*g[0]+up[1]*g[1]+up[2]*g[2];up=ggNorm([up[0]-g[0]*dg,up[1]-g[1]*dg,up[2]-g[2]*dg]);
  // the weapon hand, and the gun in it turned to point along g
  const Hd=[C.sh[0]+g[0]*C.out,C.sh[1]+g[1]*C.out,C.sh[2]+g[2]*C.out];
  const Ma=ggArm(A,[0.32,0.92,0],Hd,C.reach),X=ggX([-g[0],-g[1],-g[2]],up),Mg=[X[0],-g[0],up[0],X[1],-g[1],up[1],X[2],-g[2],up[2]];
  const Mh=ggMul(ggT(Ma),Mg),y=Math.asin(Math.max(-1,Math.min(1,Mh[2])));
  if(Math.abs(Mh[2])<0.9999999)H.rotation.set(Math.atan2(-Mh[5],Mh[8]),y,Math.atan2(-Mh[1],Mh[0]));else H.rotation.set(Math.atan2(Mh[7],Mh[4]),y,0);
  // the free hand: under the rifle's barrel, or wrapped round the handgun's grip from the other side
  const sd=ggX(g,up),f=C.fore[0]+(C.fore[1]-C.fore[0])*s,T=k==='rifle'?[Hd[0]+g[0]*f-up[0]*0.05,Hd[1]+g[1]*f-up[1]*0.05,Hd[2]+g[2]*f-up[2]*0.05]
    :[Hd[0]+sd[0]*0.08-up[0]*0.05+g[0]*0.02,Hd[1]+sd[1]*0.08-up[1]*0.05+g[1]*0.02,Hd[2]+sd[2]*0.08-up[2]*0.05+g[2]*0.02];
  ggArm(Lm,[-0.32,0.92,0],T,C.reach);
}
// back to what the pose said
function gunGripUndo(m,root=m.arm.parent){const v=m._gg;if(!v)return;m._gg=null;const A=m.arm,H=A.hand,Lm=m.armL;
  A.rotation.set(v[0],v[1],v[2]);A.position.set(v[3],v[4],v[5]);H.rotation.set(v[6],v[7],v[8]);Lm.rotation.set(v[9],v[10],v[11]);Lm.position.set(v[12],v[13],v[14]);root.rotation.y=v[15];m.head.rotation.y=v[16];}
// which gun a street goblin has out to grip, if any (null: one hand, or none, as posed): an officer's handgun while it's
// drawn, a rifle always, unless the goblin is dead, climbing, swimming, or has the free hand busy (a grenade, a fireball,
// thrown up in a panic)
function gunHeld(g){
  const k=g.pkit&&g.pkit.shown===2?WEAPONS.handgun.npc.aim:g.root.gunK;if(!k)return null;
  if(g.state==='dead'||g.dead||g.hp<=0||g.act||g.wet||g.orb&&g.orb.visible||g.armL.rotation.x<-1.9||g.arm.rotation.x<-2.3)return null;
  return k;
}
