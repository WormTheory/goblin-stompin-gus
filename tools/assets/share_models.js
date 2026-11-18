// One-time move to shared models (Nov 2026): each weapon's held boxes become its one shape (model.boxes), held uses it as
// it is, and every other view keeps its own boxes for now (own), with a placement (at) fitted to them, so "Use the shared
// model" in the editor starts from about the right place, size and turn. Nothing the game builds changes (the suite
// assets and golden.js check). The club, which had no dropped model, gets one: the shared shape lying on the ground.
//   node tools/assets/share_models.js
const fs=require('fs'),path=require('path'),A=require('./asset-format.js');
const D=path.join(A.ROOT,'src/assets/weapons');
// (the box round a list of boxes, ignoring any tilt)
function bounds(L){const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(const b of L)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],b.p[i]-b.s[i]/2);hi[i]=Math.max(hi[i],b.p[i]+b.s[i]/2);}
  return {c:lo.map((v,i)=>(v+hi[i])/2),e:lo.map((v,i)=>hi[i]-v)};}
const H=Math.PI/2,R6=v=>Math.round(v*1e4)/1e4||0;
// the turn (in quarter turns), size and place that best put the shape over a view's own boxes
function fit(base,own){
  const B=bounds(base),O=bounds(own);let best=null;
  for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<4;z++){
    const r=[x*H,y*H,z*H],L=base.map(b=>A.assetPlace(b,{p:[0,0,0],r,k:1})),Bp=bounds(L);
    const k=(O.e[0]+O.e[1]+O.e[2])/(Bp.e[0]+Bp.e[1]+Bp.e[2]||1);
    const sc=[0,1,2].reduce((a,i)=>a+Math.abs(Math.log((Bp.e[i]*k+1e-3)/(O.e[i]+1e-3))),0);
    if(!best||sc<best.sc-1e-9)best={sc,r,k,c:Bp.c};}
  const p=O.c.map((v,i)=>R6(v-best.c[i]*best.k));
  const at={p,r:best.r.map(R6)};if(Math.abs(best.k-1)>1e-3)at.k=R6(best.k);if(!at.r.some(v=>v))delete at.r;return at;
}
const order=JSON.parse(fs.readFileSync(path.join(D,'_order.json'),'utf8')).order;
for(const n of order){
  const f=path.join(D,n+'.json'),W=JSON.parse(fs.readFileSync(f,'utf8')),M=W.model;
  if(!M||M.boxes||!Array.isArray(M.held))continue;
  const before=JSON.stringify(A.assetWeapon(W).model);
  const m={boxes:M.held};
  for(const k in M){
    if(k==='held'){m.held={at:{p:[0,0,0]}};
      // (the club, which had no dropped model: the shape lying on the ground, its middle at the drop's middle)
      if(n==='club'&&!M.drop){const B=bounds(M.held);m.drop={at:{p:B.c.map(v=>R6(-v))}};}}
    else if(A.ASSET_LISTS.includes(k)&&Array.isArray(M[k]))m[k]={at:fit(M.held,M[k]),own:M[k]};
    else m[k]=M[k];}
  W.model=m;
  const after=A.assetWeapon(W).model;if(n==='club')delete after.drop;
  if(JSON.stringify(after)!==before)console.log('CHANGED',n);
  const E=A.assetCheck('weapons',n,W);if(E.length)console.log(n,E);
  fs.writeFileSync(f,A.fmt(W));console.log(n,Object.keys(m).filter(k=>A.ASSET_LISTS.includes(k)).map(k=>k+(m[k].own?' (own)':' (shared)')).join(', '));
}
