// ---- both hands on a gun (the Gus Editor, tools/editor/, loads this file as it is, to show guns held the way the game
// holds them, so it mustn't use anything from the rest of the game but ASSETS) ----
// The rig has no elbows: each arm is a straight 0.4 from its shoulder, and the shoulders are 0.64 apart, so with the gun
// held out along the weapon arm (as the poses in strikes.js have it) the free hand was left hanging in the air beside it. Just
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
// where each hand goes, per grip (a weapon's npc.aim names one): src/assets/grips/, a file each
const GUN_GRIP=ASSETS.grips;
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
  if(C.low!==undefined){s=Math.max(0,Math.min(1,(-0.9-A.rotation.x)/0.5));s=s*s*(3-2*s);
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
  const sd=ggX(g,up),f=C.fore[0]+(C.fore[1]-C.fore[0])*s,T=k!=='pistol'?[Hd[0]+g[0]*f-up[0]*0.05,Hd[1]+g[1]*f-up[1]*0.05,Hd[2]+g[2]*f-up[2]*0.05]
    :[Hd[0]+sd[0]*0.08-up[0]*0.05+g[0]*0.02,Hd[1]+sd[1]*0.08-up[1]*0.05+g[1]*0.02,Hd[2]+sd[2]*0.08-up[2]*0.05+g[2]*0.02];
  ggArm(Lm,[-0.32,0.92,0],T,C.reach);
}
// back to what the pose said
function gunGripUndo(m,root=m.arm.parent){const v=m._gg;if(!v)return;m._gg=null;const A=m.arm,H=A.hand,Lm=m.armL;
  A.rotation.set(v[0],v[1],v[2]);A.position.set(v[3],v[4],v[5]);H.rotation.set(v[6],v[7],v[8]);Lm.rotation.set(v[9],v[10],v[11]);Lm.position.set(v[12],v[13],v[14]);root.rotation.y=v[15];m.head.rotation.y=v[16];}
