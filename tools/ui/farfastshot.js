// Real screenshots of the far view at speed (render/far-city.js): flies the camera in a straight line at SPEED blocks a
// second, well above the ground, and photographs the way ahead every few seconds; then jumps JUMP blocks away at a
// stroke and photographs again a quarter of a second, one second and four seconds after landing. The caption says how
// far behind each ring is (over 1: the backdrop is showing in its band) and whether the backdrop reaches the horizon.
// Usage, from tools/ui after build_3d.py: node farfastshot.js outDir [seed]   (SPEED=213 VIEW=2400 DETAIL=112 SECS=12 JUMP=6000 ALT=70)
// BACK=1 also photographs the backdrop on its own (the rings hidden), to see what it is.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const out=process.argv[2]||'farfastshots',seed=+(process.argv[3]||1),E=k=>process.env[k];
const SPEED=+(E('SPEED')||213),VIEW=E('VIEW')||'2400',DETAIL=E('DETAIL')||'112',SECS=+(E('SECS')||12),JUMP=+(E('JUMP')||6000),ALT=+(E('ALT')||70);
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,LODS,farBackOK,WX,wxSet,wxLocal,set tod(v){tod=v},set dayN(v){dayN=v},lag:()=>LODS.map(L=>farLag(L,players[0].pos)),');
fs.writeFileSync('t3ff.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=d3d11','--ignore-gpu-blocklist','--enable-gpu-rasterization']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.addInitScript(([k,s,v,d])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view',v);localStorage.setItem('goblin-stompin-gus-detail',d);},[SAVE_KEY,seed,VIEW,DETAIL]);
await p.goto('file://'+process.cwd()+'/t3ff.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const cap=tx=>p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},tx);
// (the camera's held on a line: x0,z0 at time t0, going at v along +x and a quarter of that along +z, looking ahead and a little down)
const fly=(x0,z0,v)=>p.evaluate(([x0,z0,v,ALT])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0],t0=performance.now();
  const clr=()=>{for(let i=0;i<60&&(G.WX.type!=='clear'||G.wxLocal(P.pos.x,P.pos.z,P.pos.y)!=='clear');i++)G.wxSet('clear',true);G.WX.snowC=0;G.WX.snowCover=0;};G.dayN=45;
  const yaw=Math.atan2(-1,-0.25),step=()=>{const t=(performance.now()-t0)/1000;G.tod=0.3;clr();P.pos.set(x0+v*t,G.G0+ALT,z0+v*0.25*t);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=-0.16;P.hp=999;P.root.visible=false;};
  step();window.__hold=setInterval(step,4);window.__at=()=>[P.pos.x,P.pos.z];},[x0,z0,v,ALT]);
const say=async tag=>{const L=await p.evaluate(()=>[window.__G.lag(),window.__G.farBackOK(),window.__G.LODS.map(L=>L.B.m.count+L.G.m.count)]);
  const fps=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now(),f=()=>{n++;if(performance.now()-t<500)requestAnimationFrame(f);else r(n*2);};requestAnimationFrame(f);}));
  const tx=tag+' | '+fps+' fps | behind: near '+L[0][0].toFixed(2)+', middle '+L[0][1].toFixed(2)+', far '+L[0][2].toFixed(2)+' | backdrop '+(L[1]?'reaches the horizon':'LEFT BEHIND')+' ('+L[2][3]+' boxes)';await cap(tx);console.log(tx);return L;};
let bad=0;
await fly(300,300,0);await p.waitForTimeout(9000);await say('standing, view '+VIEW);await p.screenshot({path:out+'/0-standing.png'});
await fly(300,300,SPEED);
for(let t=3;t<=SECS;t+=3){await p.waitForTimeout(3000);const L=await say('flying at '+SPEED+' blocks a second, '+t+' s in');if(!L[1])bad++;await p.screenshot({path:out+'/1-flying-'+String(t).padStart(2,'0')+'.png'});}
if(E('BACK')){await p.evaluate(()=>{for(const L of window.__G.LODS.slice(0,3)){L.B.m.visible=false;L.G.m.visible=false;L.cov.r.value.set(0,-1);}});await p.waitForTimeout(200);await cap('the backdrop on its own (the rings hidden)');await p.screenshot({path:out+'/2-backdrop-alone.png'});
  await p.evaluate(()=>{for(const L of window.__G.LODS.slice(0,3)){L.B.m.visible=true;L.G.m.visible=true;}window.__G.LODS.forEach(L=>L.key=-1);});await p.waitForTimeout(3000);}
if(JUMP){const at=await p.evaluate(()=>window.__at());await fly(at[0]+JUMP,at[1]+JUMP*0.4,0);
  for(const [ms,nm] of [[250,'0.25'],[250,'1'],[2500,'4'],[5500,'10']]){await p.waitForTimeout(ms);const L=await say('put down '+JUMP+' blocks away, '+nm+' s after');if(!L[1]&&nm!=='0.25')bad++;await p.screenshot({path:out+'/3-jump-'+nm+'s.png'});}}
console.log(errs.join('\n')||'no errors');console.log(bad?'farfastshot FAILED: the backdrop was left behind '+bad+' times':'farfastshot ok');
await b.close();fs.unlinkSync('t3ff.html');process.exit(bad||errs.length?1:0);})();
