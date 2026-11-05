// Toppling performance in the real game with the real three.js: brings down a tall building and times each frame's
// JavaScript (including its calls into WebGL), with draw calls and triangles from the renderer. Software rendering, so
// the screen's frame rate means nothing, but the time spent in JavaScript and the counts are real.
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node toppleperf3d.js [seed] [nth tallest] [png]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),nth=+(process.argv[3]||0),shot=process.argv[4];
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:360}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));
  // every animation frame's callback is timed, and what the renderer drew in it noted
  const raf=window.requestAnimationFrame.bind(window);window.__fr=[];window.__rec=false;
  window.requestAnimationFrame=f=>raf(t=>{const t0=performance.now();f(t);const ms=performance.now()-t0;if(window.__rec){const i=window.__G.renderer.info;window.__fr.push([ms,i.render.calls,i.render.triangles,i.memory.geometries]);}});
},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(2000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(6000);
const info=await p.evaluate(nth=>{const G=window.__G,P=G.players[0],list=[];const pcx=Math.floor(P.pos.x/G.CELL),pcz=Math.floor(P.pos.z/G.CELL);
  for(let px=pcx-30;px<=pcx+30;px++)for(let pz=pcz-30;pz<=pcz+30;pz++){(G.plotInfo(px,pz).b||[]).forEach((b,i)=>{if(b.top>G.G+6)list.push({b,i,px,pz});});}
  list.sort((a,c)=>c.b.top-a.b.top);const E=list[nth],B=E.b,x=E.px*G.CELL+(B.x0+B.x1)/2,z=E.pz*G.CELL+(B.z0+B.z1)/2;
  window.__spot=[x,z];window.__hold=setInterval(()=>{P.pos.set(x+45,G.G+1,z+45);P.vy=0;P.hp=999;P.cam.yaw=Math.atan2(45,45);P.cam.pitch=0.25;},20);
  return {kind:B.kind,w:B.x1-B.x0,d:B.z1-B.z0,top:B.top-G.G};},nth);
console.log(JSON.stringify(info));
await p.waitForTimeout(12000);
const res=await p.evaluate(()=>new Promise(res=>{const G=window.__G,[x,z]=window.__spot;window.__fr.length=0;window.__rec=true;
  setTimeout(()=>{const idle=window.__fr.slice();window.__fr=[];
    G.collapseBuilding(G.bldgAt(x,z),G.G+1+G.FH*2,{x:1,z:0});
    const t0=performance.now();const iv=setInterval(()=>{const live=G.topples.length+G.bodies.length;
      if(window.__shot===undefined&&G.topples[0]&&G.topples[0].theta>0.6){window.__shot=1;}
      if(!live||performance.now()-t0>40000){clearInterval(iv);setTimeout(()=>{res({idle,fall:window.__fr});},1000);}},100);},4000);}));
const st=a=>{const m=a.map(f=>f[0]).sort((x,y)=>x-y),q=f=>m[Math.floor(f*(m.length-1))].toFixed(1),mx=i=>Math.max(...a.map(f=>f[i]));return `frames ${a.length} avg ${(m.reduce((x,y)=>x+y,0)/m.length).toFixed(1)} ms  p50 ${q(.5)} p90 ${q(.9)} p99 ${q(.99)} worst ${q(1)}  calls avg ${(a.reduce((s,f)=>s+f[1],0)/a.length).toFixed(0)} max ${mx(1)}  tris max ${mx(2)}`;};
console.log('idle:',st(res.idle));console.log('fall:',st(res.fall));
if(process.env.DUMP)console.log(res.fall.map(f=>f[0].toFixed(0)+'/'+f[1]).join(' '));
if(shot)await p.screenshot({path:shot});
console.log(errs.join('\n')||'no errors');await b.close();})();
