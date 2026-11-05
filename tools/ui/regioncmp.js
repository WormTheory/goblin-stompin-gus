// Far chunks merged into groups have to look exactly as they did: the same view with merging on and off, compared pixel by pixel, with
// the draw calls each way. Then a smash in a merged group, to see the separate chunks come back and show it.
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node regioncmp.js [outDir] (DETAIL=512 for far settings)
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1],out=process.argv[2]||'shots';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=d3d11','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,d])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:12345}));if(d)localStorage.setItem('goblin-stompin-gus-detail',d);},[SAVE_KEY,process.env.DETAIL]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(2000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(3000);
// everything that moves or flickers stopped, so only the merging differs between the two pictures
await p.evaluate(()=>{const G=window.__G,P=G.players[0],x=P.pos.x,y=P.pos.y+30,z=P.pos.z;window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.hp=999;P.cam.yaw=0.7;P.cam.pitch=-0.25;},20);});
await p.waitForTimeout(+(process.env.WAITMS||25000));
const info=()=>p.evaluate(()=>{const G=window.__G;return {calls:G.renderer.info.render.calls,tris:G.renderer.info.render.triangles,geos:G.renderer.info.memory.geometries};});
await p.evaluate(()=>{window.__G.DT.paused=true;});await p.waitForTimeout(1000);
const a=await info(),regA=await p.evaluate(()=>window.__G.regionCount());
const A0=await p.screenshot();await p.waitForTimeout(800);const A=await p.screenshot({path:out+'/merged.png'});
await p.evaluate(()=>window.__G.regions(false));await p.waitForTimeout(1500);
const c=await info();const B=await p.screenshot({path:out+'/separate.png'});
console.log('merged groups',regA,' merged:',JSON.stringify(a),' separate:',JSON.stringify(c));
const diff=await p.evaluate(async([x,y])=>{const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s;});const I=await load(x),J=await load(y),C=document.createElement('canvas');C.width=I.width;C.height=I.height;const g=C.getContext('2d');g.drawImage(I,0,0);const a=g.getImageData(0,0,C.width,C.height).data;g.drawImage(J,0,0);const b=g.getImageData(0,0,C.width,C.height).data;let n=0,big=0;for(let i=0;i<a.length;i+=4){const d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(d>0)n++;if(d>24)big++;}return {pixels:a.length/4,differ:n,differBig:big};},[A.toString('base64'),B.toString('base64')]);
console.log('pixels',JSON.stringify(diff));
if(process.env.CONTROL)console.log(A0.equals(A)?'two merged shots identical':'two merged shots differ (the comparison has noise)');
// a smash in a merged group: its chunks come back, separate and showing the hole, and it merges again once it's settled
await p.evaluate(()=>{const G=window.__G;G.DT.paused=false;G.regions(true);});await p.waitForTimeout(8000);
const sm=await p.evaluate(async()=>{const G=window.__G,P=G.players[0],n0=G.regionCount(),[x,z]=G.regionSpot();G.crush(x,G.G+1,z,3,-1,4);await new Promise(r=>setTimeout(r,300));const n1=G.regionCount(),hole=G.get(Math.floor(x),G.G+1,Math.floor(z));await new Promise(r=>setTimeout(r,6000));return {before:n0,afterSmash:n1,blockThere:hole,later:G.regionCount()};});
console.log('smash in a merged group',JSON.stringify(sm));
console.log(errs.slice(0,5).join('\n')||'no errors');await b.close();})();
