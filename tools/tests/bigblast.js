// Big blasts (destruction/big-blast.js): a town-sized blast at the starting city as a job spread over frames.
// 1. the old way for comparison (one crushBall of the same size, in one frame; OLD=0 skips it, it takes a few seconds)
// 2. bigBlast(R=160): the worst frame of blast work (and of the buildings it brings down) and of the whole frame (the harness's own
//    frames are slow and spiky: compare its median with the no-blast one printed first), how long it takes, what it took, the save's size
// 3. online: a host and a guest (the in-memory network from net.js): the guest carves the same crater from one command, and
//    once everything has settled the two have the same blocks; how much was sent
// 4. the host's save loaded again in a fresh game: the crater made again from the record matches the host's blocks
// The game's own timing budgets need a real clock, so these games get the real performance.now (the frames are still stepped).
const fs=require('fs'),vm=require('vm'),{performance}=require('perf_hooks');
const src0=fs.readFileSync('g.js','utf8'),d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,P1,P2,NET,netHostWith,netJoinWith,bigBlast,crushBall,BB,get craters(){return craters},get collapses(){return collapses},get edits(){return edits},'+
  'get destroyed(){return destroyed},chunks,ckey,chunkArr,CS,G,H,DT,goblins,cars,save,get seed(){return seed},get chunkEdits(){return chunkEdits},rebuildQ,get RAMP(){return RAMP}};})();');
if(src===src0)throw new Error('closing line not found');
const SAVE_KEY=(src0.match(/SAVE_KEY='([^']+)'/)||[])[1];
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get _m(){return m}};};
function game(name,rseed,ls,ss){
  const timers=[];let clock=1000;
  const ctx={console,crypto:require('crypto').webcrypto,TextEncoder,structuredClone,performance,
    setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){},__LS:store(ls),__SS:store(ss)};
  vm.createContext(ctx);
  const head='var global=globalThis;let __s='+rseed+';Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};\n'+stubs+
    '\nO3.prototype.isObject3D=true;global.localStorage=__LS;global.sessionStorage=__SS;global.location={reload(){}};\n';
  vm.runInContext(head+src,ctx,{filename:name+'.js'});
  const T=ctx.__t,g={name,T,ctx,LS:ctx.__LS,SS:ctx.__SS,reloads:0,ft:[]};
  g.step=n=>{for(let i=0;i<n;i++){clock+=16.7;for(let k=timers.length-1;k>=0;k--)if(timers[k].at<=clock){const t=timers.splice(k,1)[0];try{t.f();}catch(e){}}
    const t0=performance.now();T.frame(clock);g.ft.push(performance.now()-t0);hub.pump();}};
  g.play=()=>{for(const f of ctx.document.getElementById('play').L.click)f();};
  T.NET.onReload=()=>{g.reloads++;};
  T.NET.makeTr=(kind,code)=>{if(String(code).startsWith('gsg-lobby'))throw new Error('no lobby here');return hub.make();};
  return g;
}
const hub={ts:[],q:[],sent:0,bytes:0,big:0,n:0,
  make(){const T={kind:'mem',self:'m'+this.ts.length,on:{},open:true,
      send:(d,to)=>{if(!T.open)return;const s=JSON.stringify(d);hub.sent++;hub.bytes+=s.length;hub.big=Math.max(hub.big,s.length);hub.q.push({from:T.self,to:to||null,s});},
      close:()=>{T.open=false;}};
    for(const o of this.ts)if(o.open){this.q.push({join:T.self,to:o.self});this.q.push({join:o.self,to:T.self});}
    this.ts.push(T);return T;},
  pump(){this.n++;let n=0;while(this.q.length&&n++<10000){const m=this.q.shift();
    for(const T of this.ts){if(!T.open||T.self===m.from)continue;if(m.to&&m.to!==T.self)continue;
      if(m.join){if(T.on.join)T.on.join(m.join);}else if(m.leave){}else if(T.on.msg)T.on.msg(m.from,JSON.parse(m.s));}}}};
const f1=v=>(+v).toFixed(1),f2=v=>(+v).toFixed(2),ok=b=>b?'ok':'BAD',SEED=+(process.env.SEED||1),R=+(process.env.R||160);
const yieldNow=()=>new Promise(r=>setImmediate(r));
// every block of the chunks both games have, across the blast: how many differ (and a few of them)
function compare(A,B,C,label){
  let n=0,cells=0,ch=0;const ex=[];const r=C.R*1.1+16;
  for(let cx=Math.floor((C.x-r)/16);cx<=Math.floor((C.x+r)/16);cx++)for(let cz=Math.floor((C.z-r)/16);cz<=Math.floor((C.z+r)/16);cz++){
    const k=A.T.ckey(cx,cz),a=A.T.chunks.get(k);if(!a)continue;const b=B?B.T.chunks.get(k):null;if(B&&!b)continue;ch++;
    const bb=b||A.other(cx,cz);for(let i=0;i<a.length;i++){cells++;if(a[i]!==bb[i]){n++;if(ex.length<4){const y=Math.floor(i/256),r2=i%256;ex.push([cx*16+r2%16,y,cz*16+Math.floor(r2/16),a[i],bb[i]].join(','));}}}}
  console.log(label,'chunks compared',ch,'blocks',cells,'different',n,ok(n===0),ex.length?'e.g. '+ex.join(' | '):'');
  return n;
}
(async()=>{
// ---- 1. the old way ----
if(process.env.OLD!=='0'){const O=game('old',SEED,{});O.play();O.step(120);const p=O.T.P1.pos;
  const t0=performance.now(),n=O.T.crushBall(p.x+30,O.T.G+1,p.z,R),ms=performance.now()-t0;
  console.log('old crushBall R',R,'blocks',n,'one frame of',f1(ms),'ms');}
// ---- 2. the job, alone ----
if(process.env.SKIP2!=='1'){const H=game('solo',SEED,{});H.play();H.step(120);const T=H.T;T.DT.invuln=true;
  {const f0=H.ft.length;H.step(90);const q=H.ft.slice(f0).sort((a,b)=>a-b);console.log('whole frame with no blast: median',f1(q[q.length>>1]),'95th',f1(q[Math.floor(q.length*0.95)]));}
  const p=T.P1.pos,e0=Object.keys(T.edits).length,c0=Object.keys(T.collapses).length;H.ft.length=0;
  const J=T.bigBlast(p.x+30,T.G+1,p.z,R);let f=0;while(!J.done&&f<60*40){const w0=J.work;H.step(1);f++;if(process.env.DBG&&H.ft[H.ft.length-1]>40)console.log('DBG frame',f,'ms',f1(H.ft[H.ft.length-1]),'blast',f1(J.work-w0),'ring',f1(J.ring),'i',J.i,'bq',J.bq.length,'dq',J.dq.length);}
  const ft=H.ft.slice(),worstF=Math.max(...ft),sorted=ft.slice().sort((a,b)=>a-b);
  console.log('bigBlast R',R,'done',ok(J.done),'in',f,'frames ('+f1(f/60)+' s), chunks',J.list.length,'vaporised buildings',J.nVap,'buildings checked for collapse',J.bq.length===0?'all':'not all');
  console.log('blast work a frame (carving, hits, effects): worst',f2(J.worst),'ms',ok(J.worst<15),'average',f2(J.work/Math.max(1,J.frames)),'total',f1(J.work),'ms');
  console.log('buildings brought down round the edge (one every few frames, each an ordinary collapse): worst',f2(J.sw||0),'ms, total',f1(J.swT||0),'ms');
  console.log('whole frame while it ran: worst',f1(worstF),'ms, 95th',f1(sorted[Math.floor(sorted.length*0.95)]),'median',f1(sorted[sorted.length>>1]));
  H.step(60*8);T.save();H.step(60);
  const s=H.LS.getItem(SAVE_KEY)||'',o=JSON.parse(s||'{}');
  console.log('after: craters',T.craters.length,'collapses +',Object.keys(T.collapses).length-c0,'edits',e0,'->',Object.keys(T.edits).length,'save',Math.round(s.length/1024),'KB, crater record',JSON.stringify((o.craters||[])[0]),'rampage buildings',T.RAMP.nB);}
if(process.env.ONLY2==='1')process.exit(0);
// ---- 3. online ----
const HG=game('host',SEED,{});HG.play();HG.step(120);const HT=HG.T;HT.DT.invuln=true;
HT.netHostWith(hub.make(),'TESTB','mem');
const G1=game('guest1',SEED+977,{});G1.step(30);G1.T.netJoinWith(hub.make(),'TESTB','mem');
for(let i=0;i<20&&!G1.reloads;i++){G1.step(1);HG.step(1);}
const G=game('guest',SEED+977,Object.fromEntries(G1.LS._m),Object.fromEntries(G1.SS._m)),GT=G.T;
for(let i=0;i<60&&!GT.NET.joined;i++){G.step(1);HG.step(1);await yieldNow();}
for(let i=0;i<90;i++){HG.step(1);G.step(1);}
console.log('guest joined',ok(GT.NET.joined));
const p=HT.P1.pos,b0=hub.bytes,s0=hub.sent;hub.big=0;
const J=HT.bigBlast(p.x+30,HT.G+1,p.z,R),C=HT.craters[HT.craters.length-1];
let f=0;while((!J.done||GT.BB.jobs.length)&&f<60*40){HG.step(1);G.step(1);f++;}
console.log('guest heard of it',ok(GT.craters.some(c=>c.n===C.n)),'both done in',f,'frames; sent meanwhile',Math.round((hub.bytes-b0)/1024),'KB in',hub.sent-s0,'messages, largest',Math.round(hub.big/1024),'KB');
for(let i=0;i<60*20;i++){HG.step(1);G.step(1);}   // (falling pieces landing, everything sent over)
compare(HG,G,C,'host against guest:');
// ---- 4. the save loaded again ----
await yieldNow();HT.save();for(let i=0;i<60;i++){HG.step(1);G.step(1);await yieldNow();}   // (saves queue on a promise: let it run)
if(process.env.DBG){const s=HG.LS.getItem(SAVE_KEY);console.log('DBG host save',s?s.length:null,s?JSON.stringify(JSON.parse(s).craters):'',[...HG.LS._m.keys()].join(' '));}
const L=game('reload',SEED,Object.fromEntries(HG.LS._m));L.step(2);
console.log('reloaded: same seed',ok(L.T.seed===HT.seed),'craters',L.T.craters.length,ok(L.T.craters.length===HT.craters.length));
HG.other=(cx,cz)=>L.T.chunkArr(cx,cz);compare(HG,null,C,'host against the save made again:');
process.exit(0);
})().catch(e=>{console.log('ERROR',e&&e.stack||e);process.exit(1);});
