// A building coming down during a frame is taken out over a few frames (collapseBuilding, destruction/structure.js), and
// one brought down outside a frame all at once. Brings the same tall buildings down both ways, each in a game of its own
// (this file runs itself twice), and checks: the falling piece is made of the same blocks and the same stump is left;
// nothing of it falls or is redrawn before it's all out; it's spread over several frames, and no frame does much of it;
// eight at once are finished one a frame.
const MODE=process.argv[2];
if(!MODE){
  const {execFileSync}=require('child_process');
  const go=m=>JSON.parse(execFileSync(process.execPath,[__filename,m],{env:process.env,maxBuffer:1e8}).toString().trim().split('\n').pop());
  const A=go('sync'),B=go('split');
  const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log(n,v?'ok':'BAD');};
  console.log('buildings',A.res.length,'| blocks in their pieces',A.res.map(r=>r.n).join(' '));
  chk('the same pieces fall',A.res.length>=4&&A.res.every((r,i)=>B.res[i]&&r.piece===B.res[i].piece&&r.n===B.res[i].n));
  chk('the same stumps are left',A.res.every((r,i)=>r.stump===B.res[i].stump));
  chk('all at once outside a frame',A.res.every(r=>r.frames===0));
  console.log('frames to come down, one at a time:',B.res.map(r=>r.frames).join(' '),'| its longest frame of collapsing',B.worst.toFixed(1),'ms');
  chk('spread over frames',B.res.some(r=>r.frames>=2));
  chk('nothing falls, nor its chunks redrawn, till it is all out',B.res.every(r=>!r.early));
  console.log('eight at once: finished on frames',B.eight.join(' '));
  chk('eight at once, one finished a frame',B.eight.length===8&&new Set(B.eight).size===8);
  const pass=ok.every(Boolean)&&!A.errs&&!B.errs;console.log('errors',A.errs+B.errs);console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
}
const {T,E,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;step(60);T.DT.invuln=true;
const G=T.G,CELL=T.CELL;
const list=[];for(let px=-12;px<=12;px++)for(let pz=-12;pz<=12;pz++){const I=T.plotInfo(px,pz);(I.b||[]).forEach(b=>{if(b.top>G+20)list.push({b,px,pz});});}
list.sort((a,b)=>b.b.top-a.b.top||a.px-b.px||a.pz-b.pz);
const mid=e=>[e.px*CELL+(e.b.x0+e.b.x1)/2,e.pz*CELL+(e.b.z0+e.b.z1)/2];
const hash=a=>{let h=0;for(const v of a)h=(Math.imul(h,31)+v)|0;return h;};
const res=[];let worst=0;
const ct=T.collapseTick;T.collapseTick=function(){const t=performance.now();ct();worst=Math.max(worst,performance.now()-t);};
// (one at a time, far apart, each with the players stood off)
const picked=[];for(const e of list){const [x,z]=mid(e);if(picked.every(q=>Math.hypot(mid(q)[0]-x,mid(q)[1]-z)>200))picked.push(e);if(picked.length>=5)break;}
for(const e of picked){
  const [x,z]=mid(e);T.players[0].pos.set(x+60,G+1.2,z+60);T.players[0].vy=0;step(120);
  const B=T.bldgAt(x,z);if(!B)continue;const L=G+1+T.FH*2,n0=T.topples.length+T.bodies.length;
  let early=false;const bc=T.buildChunk;
  T.buildChunk=function(cx,cz){if(T.collJobs.length&&T.collHold.has(T.ckey(cx,cz)))early=true;return bc(cx,cz);};
  if(MODE==='split')T.collInFrame=true;
  T.collapseBuilding(B,L,{x:1,z:0});T.collInFrame=false;
  let frames=0;while(T.collJobs.length&&frames<200){if(T.topples.length+T.bodies.length>n0)early=true;step(1);frames++;}
  T.buildChunk=bc;
  const P=T.topples.length>n0?T.topples[T.topples.length-1]:null,blocks=P?P.blocks:[];
  const piece=hash(blocks.map(q=>T.bkey(q.x,q.y,q.z)*7+q.b).sort((a,b)=>a-b));
  const b=B.b,X0=B.px*CELL,Z0=B.pz*CELL,st=[];
  for(let x=b.x0;x<b.x1;x++)for(let z=b.z0;z<b.z1;z++)for(let y=L-1;y<L+T.FH+2;y++)st.push(T.get(X0+x,y,Z0+z));
  res.push({n:blocks.length,piece,stump:hash(st),frames,early});
  step(400);   // (till it's down)
}
// eight at once
const eight=[];
{const [ax,az]=mid(list[0]),near=list.slice(0,80).sort((p,q)=>Math.hypot(mid(p)[0]-ax,mid(p)[1]-az)-Math.hypot(mid(q)[0]-ax,mid(q)[1]-az)).filter(e=>T.bldgAt(...mid(e))).slice(0,8);
 T.players[0].pos.set(ax+45,G+1.2,az+45);step(120);
 if(MODE==='split'){T.collInFrame=true;for(const e of near)T.collapseBuilding(T.bldgAt(...mid(e)),G+1+T.FH*2,{x:1,z:0});T.collInFrame=false;
   const cf=T.collFinish;T.collFinish=function(J){eight.push(f);return cf(J);};let f=0;while(T.collJobs.length&&f<600){step(1);f++;}T.collFinish=cf;}}
console.log(JSON.stringify({res,worst,eight,errs:errs.length}));
