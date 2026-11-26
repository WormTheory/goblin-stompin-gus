// A long fast flight, then hovering still: does the world settle down? Player one is carried along a straight line high
// up at a jet's speed (FLY seconds at SPD blocks a second, the far view out to VIEW), then held still (STAY seconds), with
// the profiler on; it says where each frame's time went flying, just after and later, and then, over a further 30 s still,
// how many chunks were made and by what. Standing still nothing should be: a vehicle passed on the way and left far
// behind used to ask its block of sky with get() about once a second (openSky, for the snow on it), making its chunk
// again each time, only for it to be unloaded as too far off: a hitch every second or so, for good. So did a fire left
// burning back there (updateFires, finding the ground for each flame).
// Usage: node flyhitch.js     (SPD=220 FLY=120 STAY=30 VIEW=2400 SMASH=6)
const {T,E,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;step(120);
T.DT.prof=true;T.DT.invuln=true;T.viewSetting=+(process.env.VIEW||2400);T.farDirty=true;
const P=T.players[0];
// (each frame's time by the profiler's names)
let cur=new Map();E('(f)=>{const o=profAdd;profAdd=(k,ms)=>{o(k,ms);f(k,ms);}}')((k,ms)=>cur.set(k,(cur.get(k)||0)+ms));
const SPD=+(process.env.SPD||220),FLY=+(process.env.FLY||120),STAY=+(process.env.STAY||30);
const y0=T.G+120;let x=P.pos.x,z=P.pos.z;
const rec=[];
let fN=0;const SMASH=+(process.env.SMASH??6);   // (a big blast under the flight every SMASH seconds, 0 none: the fires it leaves burn on behind)
function fr(move){cur=new Map();if(move){x+=SPD/60;z+=SPD*0.3/60;
  if(SMASH&&++fN%(SMASH*60)===0){const gy=T.groundAt(x,z,T.H-2);T.bigBlast(x,gy+2,z,12);}}P.pos.set(x,y0,z);P.vy=0;P.grounded=false;const t0=performance.now();step(1);rec.push({t:performance.now()-t0,m:cur,move});}
for(let i=0;i<FLY*60;i++)fr(true);
for(let i=0;i<STAY*60;i++)fr(false);
function summ(a,lab){const n=a.length,tot={};for(const r of a)for(const [k,v] of r.m)tot[k]=(tot[k]||0)+v;
  const ts=a.map(r=>r.t).sort((p,q)=>p-q);console.log(lab.padEnd(18),'avg',(ts.reduce((s,v)=>s+v,0)/n).toFixed(2),'ms p90',ts[Math.floor(n*0.9)].toFixed(1),'p99',ts[Math.floor(n*0.99)].toFixed(1),'worst',ts[n-1].toFixed(1));
  console.log('   ',Object.entries(tot).sort((p,q)=>q[1]-p[1]).slice(0,8).map(([k,v])=>k+' '+(v/n).toFixed(2)).join(', '));}
const flyR=rec.filter(r=>r.move),stR=rec.filter(r=>!r.move);
summ(flyR,'flying');summ(stR.slice(0,600),'still, first 10 s');summ(stR.slice(-600),'still, last 10 s');
// (who makes chunks while standing still)
const made=new Map(),by=new Map();
E('(f)=>{const o=genChunk;genChunk=function(cx,cz){f(cx,cz,new Error().stack);return o.apply(this,arguments);}}')((cx,cz,st)=>{const k=cx+','+cz;made.set(k,(made.get(k)||0)+1);
  const s=st.split('\n').slice(2,8).map(l=>(l.trim().match(/^at (\S+)/)||[])[1]).filter(Boolean).join(' < ');by.set(s,(by.get(s)||0)+1);});
for(let i=0;i<30*60;i++)fr(false);
const n=[...made.values()].reduce((a,b)=>a+b,0);
console.log('chunks made in 30 s standing still:',n,'('+made.size+' different)');
[...by].sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(([s,k])=>console.log('   ',k,'by',s));
console.log('errors',errs.length);
const ok=n===0&&!errs.length;
console.log(ok?'flyhitch ok':'flyhitch FAILED: chunks still being made standing still');
process.exit(ok?0:1);
