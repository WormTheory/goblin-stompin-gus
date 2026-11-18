// ---- hit shapes from the editor (tools/editor/): a weapon's hitboxes against goblins' hurtboxes ----
// A weapon file can carry hit.hitboxes (spheres, capsules and boxes in the attacker's own frame: from its feet, +z the
// way it faces), and src/assets/bodies/goblin.json the goblin's hurtboxes in the same kind of frame. A melee weapon with
// hitboxes hits every goblin one of its shapes touches; one without keeps the old hit, a circle reach ahead (hitGoblins).
// The shapes all count at the moment of the blow: Gnash's swing lands in one go, so a shape's live span (t) is for the
// editor's picture and for later, when blows are swept over their clip.
// Every shape becomes a 'round' (a segment with a radius: a sphere is one with no length, a capsule's runs along its own
// y) or a box; two rounds touch when their segments come closer than their radii, a round and a box when the segment
// comes closer to the box than its radius. Two boxes are tested as a round through the second box's long axis (near
// enough for weapons and bodies, which are never flat sheets).
const HIT_GOB=()=>(ASSETS.bodies&&ASSETS.bodies.goblin&&ASSETS.bodies.goblin.hit&&ASSETS.bodies.goblin.hit.hurtboxes)||[];
// a shape put into the world: x,y,z the frame's origin (feet), h its heading
function hitWorld(s,x,y,z,h){
  const c=Math.cos(h),sn=Math.sin(h),toW=(a,b,d)=>[x+a*c+d*sn,y+b,z-a*sn+d*c];
  // (its own axes: a tilt then the heading, three.js's XYZ order)
  const R=s.rot||[0,0,0],rx=(v,t)=>[v[0],v[1]*Math.cos(t)-v[2]*Math.sin(t),v[1]*Math.sin(t)+v[2]*Math.cos(t)],
    ry=(v,t)=>[v[0]*Math.cos(t)+v[2]*Math.sin(t),v[1],-v[0]*Math.sin(t)+v[2]*Math.cos(t)],rz=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t),v[2]];
  const ax=v=>{const w=rx(ry(rz(v,R[2]),R[1]),R[0]);return [w[0]*c+w[2]*sn,w[1],-w[0]*sn+w[2]*c];};
  const P=toW(s.p[0],s.p[1],s.p[2]);
  if(s.k==='box')return {box:true,c:P,u:[ax([1,0,0]),ax([0,1,0]),ax([0,0,1])],e:[s.s[0]/2,s.s[1]/2,s.s[2]/2]};
  const half=s.k==='capsule'?(s.h||0)/2:0,d=ax([0,1,0]);
  return {a:[P[0]-d[0]*half,P[1]-d[1]*half,P[2]-d[2]*half],b:[P[0]+d[0]*half,P[1]+d[1]*half,P[2]+d[2]*half],r:s.r};
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
  const h=p.heading,mine=H.map(s=>hitWorld(s,p.pos.x,p.pos.y,p.pos.z,h)),hurt=HIT_GOB(),fx=Math.sin(h),fz=Math.cos(h);
  for(const g of goblins){if(g.state!=='chase')continue;
    if(Math.hypot(g.pos.x-p.pos.x,g.pos.z-p.pos.z)>12)continue;   // (no weapon reaches further than this)
    const theirs=hurt.length?hurt.map(s=>hitWorld(s,g.pos.x,g.pos.y,g.pos.z,g.heading||0)):[{a:[g.pos.x,g.pos.y,g.pos.z],b:[g.pos.x,g.pos.y+1,g.pos.z],r:0.3}];
    if(mine.some(A=>theirs.some(B=>hitTouch(A,B)))){const dx=g.pos.x-p.pos.x,dz=g.pos.z-p.pos.z,d=Math.hypot(dx,dz)||1;
      damageGoblin(g,dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(dx/d,0.6,dz/d),cause);}}
  // (other players: the same shapes against a goblin's hurtboxes, or a hippo's middle)
  for(const q of pvpFoes(p)){const theirs=hurt.length&&q.gob?hurt.map(s=>hitWorld(s,q.pos.x,q.pos.y,q.pos.z,q.heading||0)):[{a:[q.pos.x,q.pos.y,q.pos.z],b:[q.pos.x,q.pos.y+1.2,q.pos.z],r:q.gob?0.3:0.9}];
    if(mine.some(A=>theirs.some(B=>hitTouch(A,B))))pvpHurt(p,q,dmg,new V3(q.pos.x,q.pos.y+0.8,q.pos.z),new V3(fx,0.4,fz),pvpCause||cause);}
  return true;
}
