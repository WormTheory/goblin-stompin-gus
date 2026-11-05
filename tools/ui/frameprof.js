// Where a frame's JavaScript time goes in the real game with the real three.js: a sampling profile from the browser, as the
// heaviest functions by their own time, and the game's top-level jobs by total time.
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html:
//   node frameprof.js [seed] [idle|run|fall] [seconds]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),mode=process.argv[3]||'idle',secs=+(process.argv[4]||10);
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:360}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));
  const raf=window.requestAnimationFrame.bind(window);window.__fr=[];window.__rec=false;
  window.requestAnimationFrame=f=>raf(t=>{const t0=performance.now();f(t);if(window.__rec)window.__fr.push(performance.now()-t0);});
},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(2000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(10000);
if(mode==='run'){await p.evaluate(()=>{const G=window.__G,P=G.players[0];let a=0;window.__hold=setInterval(()=>{a+=0.02;P.pos.x+=1.2;P.pos.z+=Math.sin(a)*0.5;P.pos.y=G.G+1.5;P.vy=0;P.hp=999;},20);});}
if(mode==='fall'){await p.evaluate(()=>{const G=window.__G,P=G.players[0],list=[];const pcx=Math.floor(P.pos.x/G.CELL),pcz=Math.floor(P.pos.z/G.CELL);
  for(let px=pcx-30;px<=pcx+30;px++)for(let pz=pcz-30;pz<=pcz+30;pz++){(G.plotInfo(px,pz).b||[]).forEach((b,i)=>{if(b.top>G.G+6)list.push({b,i,px,pz});});}
  list.sort((a,c)=>c.b.top-a.b.top);const E=list[0],B=E.b,x=E.px*G.CELL+(B.x0+B.x1)/2,z=E.pz*G.CELL+(B.z0+B.z1)/2;
  window.__spot=[x,z];window.__hold=setInterval(()=>{P.pos.set(x+45,G.G+1,z+45);P.vy=0;P.hp=999;P.cam.yaw=Math.atan2(45,45);P.cam.pitch=0.25;},20);});await p.waitForTimeout(10000);}
const cdp=await p.context().newCDPSession(p);
await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
await p.evaluate(()=>{window.__fr.length=0;window.__rec=true;});
if(mode==='fall')await p.evaluate(()=>{const G=window.__G,[x,z]=window.__spot;G.collapseBuilding(G.bldgAt(x,z),G.G+1+G.FH*2,{x:1,z:0});});
await p.waitForTimeout(secs*1000);
const fr=await p.evaluate(()=>{window.__rec=false;return window.__fr;});
const {profile:P}=await cdp.send('Profiler.stop');
const byId=new Map(P.nodes.map(n=>[n.id,n]));const self=new Map();let tot=0;
const nodeSelf=new Map();
for(let i=0;i<P.samples.length;i++){const d=P.timeDeltas[i]||0;nodeSelf.set(P.samples[i],(nodeSelf.get(P.samples[i])||0)+d);}
const name=n=>{const c=n.callFrame;return (c.functionName||'(anon)')+(c.url.includes('three')?' [three]':'')+':'+c.lineNumber;};
const incl=new Map();
const walk=(n,st)=>{const k=name(n),had=st.has(k);if(!had)st.add(k);let s=nodeSelf.get(n.id)||0;self.set(k,(self.get(k)||0)+s);for(const c of n.children||[])s+=walk(byId.get(c),st);if(!had){st.delete(k);incl.set(k,(incl.get(k)||0)+s);}return s;};
walk(P.nodes[0],new Set());
const nf=fr.length,ms=v=>(v/1000/nf).toFixed(2).padStart(7)+' ms/frame';
const s=[...fr].sort((a,c)=>a-c),q=f=>s[Math.floor(f*(s.length-1))].toFixed(1);
console.log(`frames ${nf} avg ${(fr.reduce((a,c)=>a+c,0)/nf).toFixed(1)} ms  p50 ${q(.5)} p90 ${q(.9)} p99 ${q(.99)} worst ${q(1)}`);
console.log('--- own time');for(const [k,v] of [...self].filter(e=>!/^\((idle|root|program)/.test(e[0])).sort((a,c)=>c[1]-a[1]).slice(0,+process.env.TOP||28))console.log(ms(v),k);
console.log('--- total time');for(const [k,v] of [...incl].filter(e=>!/^\((idle|root|program)/.test(e[0])).sort((a,c)=>c[1]-a[1]).slice(0,+process.env.TOP||28))console.log(ms(v),k);
console.log(errs.join('\n')||'no errors');await b.close();})();
