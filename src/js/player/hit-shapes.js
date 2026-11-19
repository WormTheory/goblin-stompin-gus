// ---- hit shapes from the editor (tools/editor/): a weapon's hitboxes against goblins' hurtboxes ----
// A weapon file can carry hit.hitboxes (spheres, capsules and boxes in the attacker's own frame: from its feet, +z the
// way it faces), and src/assets/bodies/goblin.json the goblin's hurtboxes in the same kind of frame. A melee weapon with
// hitboxes hits every goblin one of its shapes touches; one without keeps the old hit, a circle reach ahead (hitGoblins).
// When they count: a shape with a live span (t: [from,to] on the weapon's third-person blow, u 0 to 2, 1 where it lands)
// counts on every frame of the swing inside it (wpnHitSweep); one without counts once, as the blow lands (u 1).
// Where they are: from the attacker's feet (+z the way it faces), or with on:'hand' in the hand's own frame (the goblin
// rig's, scaled as it is: what the editor shows), so it follows the blow (hitHand works the hand out from the clip).
// Every shape becomes a 'round' (a segment with a radius: a sphere is one with no length, a capsule's runs along its own
// y) or a box; two rounds touch when their segments come closer than their radii, a round and a box when the segment
// comes closer to the box than its radius. Two boxes are tested as a round through the second box's long axis (near
// enough for weapons and bodies, which are never flat sheets).
const HIT_GOB=()=>(ASSETS.bodies&&ASSETS.bodies.goblin&&ASSETS.bodies.goblin.hit&&ASSETS.bodies.goblin.hit.hurtboxes)||[];
const hrx=(v,t)=>[v[0],v[1]*Math.cos(t)-v[2]*Math.sin(t),v[1]*Math.sin(t)+v[2]*Math.cos(t)],
  hry=(v,t)=>[v[0]*Math.cos(t)+v[2]*Math.sin(t),v[1],-v[0]*Math.sin(t)+v[2]*Math.cos(t)],hrz=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t),v[2]];
// the hand, at u along a blow (a clip of the body layout), in the attacker's own frame before its heading: {o (where),
// x,y,z (its axes, each ES long: the rig's scale)}. The same chain goblinModel builds and gobStrike/gobBodyRoot pose: the
// root stepped forward, turned (twist) and leant (YXZ), scaled; the arm at its shoulder swung and raised (XYZ); the
// wrist below it turned
function hitHand(clip,u){
  const v=strikeAt(clip,u),arm=q=>hrx(hrz(q,v[1]),v[0]),root=q=>{q=hry(hrx(q,v[5]),v[4]);return [q[0]*ES,q[1]*ES,q[2]*ES+(v[6]||0)];};
  const at=q=>{const a=arm([q[0],q[1]-0.4,q[2]]);return root([a[0]+0.32,a[1]+0.92,a[2]]);},o=at([0,0,0]);
  const ax=d=>{const w=root(arm(hrx(d,v[2])));const z=root([0,0,0]);return [w[0]-z[0],w[1]-z[1],w[2]-z[2]];};
  return {o,x:ax([1,0,0]),y:ax([0,1,0]),z:ax([0,0,1])};
}
// a shape put into the world: x,y,z the frame's origin (feet), h its heading, Hd the hand (hitHand) for one on it
function hitWorld(s,x,y,z,h,Hd){
  const c=Math.cos(h),sn=Math.sin(h),toW=(a,b,d)=>[x+a*c+d*sn,y+b,z-a*sn+d*c],hd=s.on==='hand'&&Hd;
  // (from the hand's frame into the feet's, lengths scaled with it: ES)
  const inH=q=>hd?[Hd.o[0]+Hd.x[0]*q[0]+Hd.y[0]*q[1]+Hd.z[0]*q[2],Hd.o[1]+Hd.x[1]*q[0]+Hd.y[1]*q[1]+Hd.z[1]*q[2],Hd.o[2]+Hd.x[2]*q[0]+Hd.y[2]*q[1]+Hd.z[2]*q[2]]:q,
    dirH=q=>hd?[Hd.x[0]*q[0]+Hd.y[0]*q[1]+Hd.z[0]*q[2],Hd.x[1]*q[0]+Hd.y[1]*q[1]+Hd.z[1]*q[2],Hd.x[2]*q[0]+Hd.y[2]*q[1]+Hd.z[2]*q[2]].map(a=>a/ES):q,K=hd?ES:1;
  // (its own axes: a tilt (three.js's XYZ order), into the hand's frame if it's on it, then the heading)
  const R=s.rot||[0,0,0],ax=v=>{const w=dirH(hrx(hry(hrz(v,R[2]),R[1]),R[0]));return [w[0]*c+w[2]*sn,w[1],-w[0]*sn+w[2]*c];};
  const Q=inH(s.p),P=toW(Q[0],Q[1],Q[2]);
  if(s.k==='box')return {box:true,c:P,u:[ax([1,0,0]),ax([0,1,0]),ax([0,0,1])],e:[s.s[0]/2*K,s.s[1]/2*K,s.s[2]/2*K]};
  const half=s.k==='capsule'?(s.h||0)/2*K:0,d=ax([0,1,0]);
  return {a:[P[0]-d[0]*half,P[1]-d[1]*half,P[2]-d[2]*half],b:[P[0]+d[0]*half,P[1]+d[1]*half,P[2]+d[2]*half],r:s.r*K};
}
const hv=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],hdot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
// the closest point on a box to p
function hitBoxNear(B,p){const d=hv(p,B.c),o=B.c.slice();
  for(let i=0;i<3;i++){const t=Math.max(-B.e[i],Math.min(B.e[i],hdot(d,B.u[i])));o[0]+=B.u[i][0]*t;o[1]+=B.u[i][1]*t;o[2]+=B.u[i][2]*t;}return o;}
const hitLerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function hitSegNear(a,b,p){const d=hv(b,a),L=hdot(d,d);return hitLerp(a,b,L>1e-9?Math.max(0,Math.min(1,hdot(hv(p,a),d)/L)):0);}
const hitDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
// (a box as a round: through its longest axis, its radius the larger of the other two half-sizes)
function hitBoxRound(B){let i=0;for(let j=1;j<3;j++)if(B.e[j]>B.e[i])i=j;const u=B.u[i],e=B.e[i],o=[0,1,2].filter(j=>j!==i);
  return {a:[B.c[0]-u[0]*e,B.c[1]-u[1]*e,B.c[2]-u[2]*e],b:[B.c[0]+u[0]*e,B.c[1]+u[1]*e,B.c[2]+u[2]*e],r:Math.max(B.e[o[0]],B.e[o[1]])};}
// do two shapes (as hitWorld gives them) touch? (segments are walked in 9 steps: shapes are a few blocks long at most)
function hitTouch(A,B){
  if(A.box&&B.box)B=hitBoxRound(B);
  if(B.box){const t=A;A=B;B=t;}
  for(let i=0;i<=8;i++){const p=hitLerp(B.a,B.b,i/8);
    if(A.box){if(hitDist(p,hitBoxNear(A,p))<B.r)return true;}
    else if(hitDist(p,hitSegNear(A.a,A.b,p))<A.r+B.r)return true;}
  return false;
}
// a melee blow with hitboxes: every chasing goblin touched takes the blow (once), and so does any player PvP allows.
// Returns false (and does nothing) for a weapon with none, so the caller falls back to its old hit
function wpnHitShapes(p,K,dmg,cause,pvpCause){
  const H=K&&K.hit&&K.hit.hitboxes;if(!H||!H.length)return false;
  if(!p.hsOn)p.hsHit=new Set();   // (no swing being swept (on a wall, or a blow from elsewhere): a fresh list of who's been hit)
  const now=H.filter(s=>!s.t);if(now.length)hitShapesAt(p,K,now,1,dmg,cause,pvpCause);
  return true;
}
// the blow a weapon's hitboxes are timed and posed against: its third-person one (as gobBodyPose draws it)
const hitBlowOf=K=>K&&(K.player&&K.player.body||K.npc&&K.npc.strike)||'club';
// these shapes, posed at u along the blow, against every chasing goblin (and player PvP allows) not yet hit this swing
// (p.hsHit, kept by wpnHitSweep: once each)
function hitShapesAt(p,K,H,u,dmg,cause,pvpCause){
  const Hd=H.some(s=>s.on==='hand')?hitHand(hitBlowOf(K),u):null,done=p.hsHit||(p.hsHit=new Set());
  const h=p.heading,mine=H.map(s=>hitWorld(s,p.pos.x,p.pos.y,p.pos.z,h,Hd)),hurt=HIT_GOB(),fx=Math.sin(h),fz=Math.cos(h);
  for(const g of goblins){if(g.state!=='chase'||done.has(g))continue;
    if(Math.hypot(g.pos.x-p.pos.x,g.pos.z-p.pos.z)>12)continue;   // (no weapon reaches further than this)
    const theirs=hurt.length?hurt.map(s=>hitWorld(s,g.pos.x,g.pos.y,g.pos.z,g.heading||0)):[{a:[g.pos.x,g.pos.y,g.pos.z],b:[g.pos.x,g.pos.y+1,g.pos.z],r:0.3}];
    if(mine.some(A=>theirs.some(B=>hitTouch(A,B)))){const dx=g.pos.x-p.pos.x,dz=g.pos.z-p.pos.z,d=Math.hypot(dx,dz)||1;
      done.add(g);damageGoblin(g,dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(dx/d,0.6,dz/d),cause);}}
  // (other players: the same shapes against a goblin's hurtboxes, or a hippo's middle)
  for(const q of pvpFoes(p)){if(done.has(q))continue;const theirs=hurt.length&&q.gob?hurt.map(s=>hitWorld(s,q.pos.x,q.pos.y,q.pos.z,q.heading||0)):[{a:[q.pos.x,q.pos.y,q.pos.z],b:[q.pos.x,q.pos.y+1.2,q.pos.z],r:q.gob?0.3:0.9}];
    if(mine.some(A=>theirs.some(B=>hitTouch(A,B)))){done.add(q);pvpHurt(p,q,dmg,new V3(q.pos.x,q.pos.y+0.8,q.pos.z),new V3(fx,0.4,fz),pvpCause||cause);}}
  // (a landmine the shapes touch goes off: a flat disc as a short capsule)
  for(const M of MINES){if(!M.live||Math.hypot(M.x-p.pos.x,M.z-p.pos.z)>12)continue;const B={a:[M.x,M.y,M.z],b:[M.x,M.y+0.15,M.z],r:0.3};if(mine.some(A=>hitTouch(A,B)))mineBoom(M,pvpBy(p));}
}
// each frame of a player goblin's swing: the shapes with a live span that the swing has passed through since the last
// frame (so a short span isn't missed at a low frame rate), posed along the stretch of it passed through. A new swing
// starts a fresh list of who's been hit (from gobArmsTick)
function wpnHitSweep(p){
  const k=p.wpn,K=WEAPONS[k],H=K&&K.kind==='melee'&&K.hit&&K.hit.hitboxes;
  if(!(p.biteT>0)||!H||p.state==='climb'){p.hsOn=false;return;}
  const u=gobSwingU(p);if(!p.hsOn||u<(p.hsU??0)){p.hsOn=true;p.hsU=0;p.hsHit=new Set();}
  const u0=p.hsU;p.hsU=u;
  // (the part of its span this frame went through, tried every 0.02 of u at most 8 times, so a fast swing at a low frame
  // rate doesn't pass through a goblin between two frames)
  const W=K.player||{};for(const s of H){if(!s.t||s.t[1]<u0||s.t[0]>u)continue;const a=Math.max(s.t[0],u0),b=Math.min(s.t[1],u),n=Math.min(8,Math.ceil((b-a)/0.02));
    for(let i=0;i<=n;i++)hitShapesAt(p,K,[s],n?a+(b-a)*i/n:b,W.dmg,W.cause,W.pvp);}
}
