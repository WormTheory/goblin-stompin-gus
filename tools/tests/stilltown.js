// Standing still in town: is anything still being made? Player one is held where the game starts, in the middle of the
// first city with its traffic, crowds and services about, until the world round him has settled (every chunk in sight
// meshed, no far ring building), and then for STAY seconds more with the profiler on. It says where each frame's time
// went, how many chunks were made in that time and what asked for them, and what the worst frames were made of.
// Standing still nothing should make a chunk: one costs a few milliseconds, and anything that looks out past what's
// loaded with get() has its chunk made, thrown away two seconds later as too far off, and made again. (flyhitch.js asks
// the same after a long flight, high up and far from any town.)
// Usage: node stilltown.js     (STAY=60 the seconds watched, DETAIL=112 the detail distance)
const {T,E,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;step(120);
T.DT.prof=true;T.DT.invuln=true;
if(process.env.DETAIL){T.detailSetting=+process.env.DETAIL;E('viewR=VIEW_SOLO()');T.farDirty=true;}
const STAY=+(process.env.STAY||60),P=T.players[0],x0=P.pos.x,y0=P.pos.y,z0=P.pos.z;
// (held in place: with nobody at the controls a passing car or a goblin shoves him along, into chunks that do need making)
const hold=()=>{P.pos.set(x0,y0,z0);P.vy=0;if(P.kv)P.kv.set(0,0,0);};
let cur=new Map();E('(f)=>{const o=profAdd;profAdd=(k,ms)=>{o(k,ms);f(k,ms);}}')((k,ms)=>cur.set(k,(cur.get(k)||0)+ms));
let s=0;for(;s<300*60;s++){hold();step(1);if(s>600&&s%60===0&&!T.LODS.some(L=>L.job)&&E('chunkScan.full&&!rebuildQ.size&&!MW.pend.size'))break;}
console.log('settled after',(s/60).toFixed(0),'s: meshes',E('meshes.size'),'chunks',E('chunks.size'));
// (what makes chunks from here on, by who asked)
const made=new Map(),by=new Map();
E('(f)=>{const o=genChunk;genChunk=function(cx,cz){f(cx,cz,new Error().stack);return o.apply(this,arguments);}}')((cx,cz,st)=>{const k=cx+','+cz;made.set(k,(made.get(k)||0)+1);
  const w=st.split('\n').slice(2,9).map(l=>(l.trim().match(/^at (\S+)/)||[])[1]).filter(n=>n&&n!=='eval'&&n!=='safe').join(' < ');by.set(w,(by.get(w)||0)+1);});
const rec=[];for(let i=0;i<STAY*60;i++){cur=new Map();hold();const t0=performance.now();step(1);rec.push({t:performance.now()-t0,m:cur});}
const n=rec.length,tot={};for(const r of rec)for(const [k,v] of r.m)tot[k]=(tot[k]||0)+v;
const ts=rec.map(r=>r.t).sort((p,q)=>p-q);
console.log('standing still',STAY,'s: frame avg',(ts.reduce((a,b)=>a+b,0)/n).toFixed(2),'ms p90',ts[Math.floor(n*0.9)].toFixed(1),'p99',ts[Math.floor(n*0.99)].toFixed(1),'worst',ts[n-1].toFixed(1));
console.log('   ',Object.entries(tot).sort((p,q)=>q[1]-p[1]).slice(0,10).map(([k,v])=>k+' '+(v/n).toFixed(2)).join(', '));
console.log('    goblins about',E('goblins.filter(g=>g.state==="chase").length'),'| vehicles alive',E('cars.filter(c=>c.alive).length'),'of',E('cars.length'));
const nn=[...made.values()].reduce((a,b)=>a+b,0);
console.log('chunks made standing still:',nn,'('+made.size+' different)');
[...by].sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([w,k])=>console.log('   ',k,'by',w.slice(0,200)));
rec.sort((a,b)=>b.t-a.t);console.log('worst frames:');
for(const r of rec.slice(0,4))console.log('   ',r.t.toFixed(1),'ms |',[...r.m].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+v.toFixed(1)).join(', '));
console.log('errors',errs.length);
const ok=!errs.length;
console.log(ok?'stilltown ok':'stilltown FAILED');
process.exit(ok?0:1);
