// Does the frame rate sink over a long session? Plays for a few minutes on this machine's real graphics card (frame cap off), moving
// through the city, smashing as it goes and now and then bringing a building down, and prints the frame rate for each half minute with
// the draw calls, objects in the scene and the JavaScript heap. A leak shows as a frame rate falling while those climb.
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node longrun.js [page.html] [minutes]
const {chromium}=require('playwright');
const fs=require('fs');
const page=process.argv[2]||process.cwd()+'/t3.html',mins=+(process.argv[3]||4);
const SAVE_KEY=fs.readFileSync(page,'utf8').match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=d3d11','--ignore-gpu-blocklist','--disable-frame-rate-limit','--disable-gpu-vsync','--enable-precise-memory-info']});
const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:12345}));},[SAVE_KEY]);
await p.goto('file://'+page);await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(5000);
// a slow loop round a big square, a smash every second, a building toppled every 20 s
await p.evaluate(()=>{const G=window.__G,P=G.players[0],o={x:P.pos.x,z:P.pos.z};let t=0;
  window.__hold=setInterval(()=>{t+=0.02;const a=t*0.08,r=150;P.pos.set(o.x+Math.cos(a)*r,G.G+1.5,o.z+Math.sin(a)*r);P.vy=0;P.hp=999;P.cam.yaw=-a;P.cam.pitch=0.1;
    if(Math.floor(t*50)%50===0)G.crush(P.pos.x+6,G.G+1,P.pos.z+6,2,0,4);
    if(Math.floor(t*50)%1000===0){const B=G.bldgAt(P.pos.x+20,P.pos.z+20);if(B&&B.b.top>G.G+10)G.collapseBuilding(B,G.G+1+G.FH,{x:1,z:0});}},20);});
await p.waitForTimeout(8000);
const span=30000,n=Math.round(mins*60000/span);
for(let i=0;i<n;i++){
  const r=await p.evaluate(ms=>new Promise(res=>{const a=[];let l=performance.now();const t0=l;const f=()=>{const now=performance.now();a.push(now-l);l=now;now-t0<ms?requestAnimationFrame(f):res(a);};requestAnimationFrame(f);}),span);
  const info=await p.evaluate(()=>{const G=window.__G,R=G.renderer;let objs=0;G.scene.traverse(()=>objs++);const top={};for(const c of G.scene.children){let n=0;c.traverse(()=>n++);const k=c.type+(c.isMesh?':'+(c.material&&c.material.type):'')+(c.children.length?'/'+c.children.length:'');top[k]=(top[k]||0)+n;}window.__top=top;return {calls:R.info.render.calls,geos:R.info.memory.geometries,tex:R.info.memory.textures,objs,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):-1};});
  const s=r.slice(1),tot=s.reduce((x,y)=>x+y,0),m=[...s].sort((x,y)=>x-y);
  console.log(`${((i+1)*span/60000).toFixed(1).padStart(4)} min  ${(s.length/tot*1000).toFixed(0).padStart(4)} fps  p99 ${m[Math.floor(0.99*(m.length-1))].toFixed(1)} ms  calls ${info.calls}  geometries ${info.geos}  objects ${info.objs}  heap ${info.heap} MB`);
}
if(process.env.TOP){const t=await p.evaluate(()=>window.__top);console.log(Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,12).map(e=>e[0]+' '+e[1]).join(' | '));}
console.log(errs.slice(0,5).join('\n')||'no errors');await b.close();})();
