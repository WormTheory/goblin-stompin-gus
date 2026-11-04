// How long the goblins' route maps and the goblins as a whole take per frame, in a real browser with a full crowd after a
// hippo running about town. (Needs t3.html: see tools/build_3d.py. Software rendering slows the frames, so read the
// milliseconds, not the frame rate.) Usage, from tools/ui: node chasecost.js [seconds] [seed]
const {chromium}=require('playwright');const fs=require('fs');
let html=fs.readFileSync('t3.html','utf8');const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
html=html.replace("  navUpdate(dt);\n","  {const a0=performance.now();navUpdate(dt);(window.__nv=window.__nv||[]).push(performance.now()-a0);playTime=Math.max(playTime,900);}\n");
html=html.replace("safe('goblins',()=>updateGoblins(sdt));","safe('goblins',()=>{const a0=performance.now();updateGoblins(sdt);(window.__gb=window.__gb||[]).push(performance.now()-a0);});");
fs.writeFileSync('t3cost.html',html);
const secs=+(process.argv[2]||60),seed=+(process.argv[3]||12345);
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3cost.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(3000);
await p.evaluate(()=>{const G=window.__G,P=G.players[0];let x=P.pos.x,z=P.pos.z,d=0,t=0;window.__hold=setInterval(()=>{t++;if(t%120===0)d=Math.random()*6.28;x+=Math.sin(d)*0.1;z+=Math.cos(d)*0.1;P.hp=999;const s=G.surfaceAt(x,z);if(s.y-P.pos.y>3||s.y-P.pos.y<-3){d+=2;}P.pos.set(x,s.y,z);P.vy=0;},16);window.__nv=[];window.__gb=[];});
let peak=0;for(let i=0;i<secs/5;i++){await p.waitForTimeout(5000);peak=Math.max(peak,await p.evaluate(()=>window.__G.goblins.filter(g=>g.state==='chase'&&!g.civ&&!g.staff).length));}
const r=await p.evaluate(()=>{const f=a=>{const v=[...a].sort((x,y)=>x-y),q=u=>v[Math.floor(v.length*u)]||0;return {frames:v.length,mean:+(v.reduce((x,y)=>x+y,0)/v.length).toFixed(3),p50:+q(.5).toFixed(2),p99:+q(.99).toFixed(2),max:+q(.9999).toFixed(2)};};return {routeMap:f(window.__nv),allGoblins:f(window.__gb)};});
console.log(JSON.stringify(r),'hostile goblins peak',peak);console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3cost.html');})();
