// The move to shared models (Nov 2026): each weapon's held boxes became its one shape (model.boxes), held uses it as it
// is, and every other view kept its own boxes (own), with a placement (at) fitted to them, so "Use the shared model" in
// the editor starts from about the right place, size and turn. Nothing the game builds changes (the suite assets and
// golden.js check). The club, which had no dropped model, got one: the shared shape lying on the ground.
// Run again on files already moved, it fits each own version's at afresh (the own boxes, and so the game, unchanged).
// The fit tries every quarter turn and scores how well the placed boxes land on the view's own, box by box (the nearest
// of the other's, both ways, place and size), so a model isn't put in upside down because its outline matches either way.
//   node tools/assets/share_models.js
const fs=require('fs'),path=require('path'),A=require('./asset-format.js');
const D=path.join(A.ROOT,'src/assets/weapons');
// (the box round a list of boxes, ignoring any tilt)
function bounds(L){const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(const b of L)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],b.p[i]-b.s[i]/2);hi[i]=Math.max(hi[i],b.p[i]+b.s[i]/2);}
  return {c:lo.map((v,i)=>(v+hi[i])/2),e:lo.map((v,i)=>hi[i]-v)};}
const H=Math.PI/2,R6=v=>Math.round(v*1e4)/1e4||0;
// (a box's size along the world axes once it's turned: its extents)
const ext=b=>{const M=b.r?aM(b.r):null;if(!M)return b.s;return [0,1,2].map(i=>Math.abs(M[i*3])*b.s[0]+Math.abs(M[i*3+1])*b.s[1]+Math.abs(M[i*3+2])*b.s[2]);};
const aM=r=>{const [x,y,z]=r,a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
  return [c*e,-c*f,d,a*f+b*e*d,a*e-b*f*d,-b*c,b*f-a*e*d,b*e+a*f*d,a*c];};
const dist=(a,b)=>Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1],a.p[2]-b.p[2]);
const sdist=(a,b)=>{const x=ext(a),y=ext(b);return Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2]);};
// how far one list of boxes is from another: each box to the nearest of the other's, weighted by its size, both ways
function apart(P,O){
  const one=(X,Y)=>{let s=0,w=0;for(const a of X){const v=a.s[0]*a.s[1]*a.s[2]+1e-6;let m=1e9;for(const b of Y)m=Math.min(m,dist(a,b)+0.5*sdist(a,b));s+=m*v;w+=v;}return s/w;};
  return one(P,O)+one(O,P);}
// the turn (in quarter turns), size and place that best put the shape over a view's own boxes
// (first person always takes one turn: what's held along the hand's +z (a club's head) points up the screen, and what's
// held along its -y (a gun's barrel, down the arm) points away, into the screen; so a gun's grip, held along -z, points down)
// A gun lying on the ground keeps its grip (held along -z) pointing down. Anything else is fitted freely.
const VIEW_TURN=[H,2*H,0],HAND_HELD=['melee','gun'];   // (a spellbook or a mine is held flat, and fitted like the other views)
const near=(a,b)=>Math.abs(a-b)<1e-6;
function rule(W,k){
  if(k==='view'&&HAND_HELD.includes(W.kind))return r=>near(r[0],VIEW_TURN[0])&&near(r[1],VIEW_TURN[1])&&near(r[2],VIEW_TURN[2]);
  if(k==='drop'&&W.kind==='gun')return r=>{const M=aM(r);return near(M[5],1);};   // (the turned -z is -y)
  return null;}
function fit(base,own,ok,byLong){
  const O=bounds(own);let best=null;
  for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<4;z++){
    const r=[x*H,y*H,z*H];if(ok&&!ok(r))continue;
    const L=base.map(b=>A.assetPlace(b,{p:[0,0,0],r,k:1})),Bp=bounds(L);
    // (lying or slung, the longest side matched: a gun as long as the one it stands for. In first person, where the
    // view's own version is often only the near half of a gun, all three sides at once, or a rifle fills the screen)
    const k=byLong?Math.max(...O.e)/(Math.max(...Bp.e)||1):(O.e[0]+O.e[1]+O.e[2])/(Bp.e[0]+Bp.e[1]+Bp.e[2]||1);
    const p=O.c.map((v,i)=>v-Bp.c[i]*k),P=base.map(b=>A.assetPlace(b,{p,r,k}));
    const sc=apart(P,own);
    if(!best||sc<best.sc-1e-9)best={sc,r,k,p};}
  const at={p:best.p.map(R6),r:best.r.map(R6)};if(Math.abs(best.k-1)>1e-3)at.k=R6(best.k);if(!at.r.some(v=>v))delete at.r;return at;
}
const order=JSON.parse(fs.readFileSync(path.join(D,'_order.json'),'utf8')).order;
for(const n of order){
  const f=path.join(D,n+'.json'),W=JSON.parse(fs.readFileSync(f,'utf8')),M=W.model;
  if(!M)continue;
  const before=JSON.stringify(A.assetWeapon(W).model);
  if(M.boxes){   // (already moved: fit each own version's placing again)
    const done=[];
    for(const k of A.ASSET_LISTS){const v=M[k];if(!v||!v.own)continue;const at=fit(M.boxes,v.own,rule(W,k),k!=='view');
      if(JSON.stringify(at)!==JSON.stringify(v.at)){done.push(k+' '+JSON.stringify(v.at)+' -> '+JSON.stringify(at));v.at=at;}}
    if(JSON.stringify(A.assetWeapon(W).model)!==before)console.log('CHANGED',n);
    fs.writeFileSync(f,A.fmt(W));console.log(n,done.length?'\n  '+done.join('\n  '):'unchanged');continue;}
  if(!Array.isArray(M.held))continue;
  const m={boxes:M.held};
  for(const k in M){
    if(k==='held'){m.held={at:{p:[0,0,0]}};
      // (the club, which had no dropped model: the shape lying on the ground, its middle at the drop's middle)
      if(n==='club'&&!M.drop){const B=bounds(M.held);m.drop={at:{p:B.c.map(v=>R6(-v))}};}}
    else if(A.ASSET_LISTS.includes(k)&&Array.isArray(M[k]))m[k]={at:fit(M.held,M[k],rule(W,k),k!=='view'),own:M[k]};
    else m[k]=M[k];}
  W.model=m;
  const after=A.assetWeapon(W).model;if(n==='club')delete after.drop;
  if(JSON.stringify(after)!==before)console.log('CHANGED',n);
  const E=A.assetCheck('weapons',n,W);if(E.length)console.log(n,E);
  fs.writeFileSync(f,A.fmt(W));console.log(n,Object.keys(m).filter(k=>A.ASSET_LISTS.includes(k)).map(k=>k+(m[k].own?' (own)':' (shared)')).join(', '));
}
