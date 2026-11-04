// Cultists in the real page: the circle at its rite, then roused, fireballs in the air, then close up.
// Usage, from tools/ui (after python tools/build_3d.py game/index.html tools/ui/t3.html, with TENV, TS, tenvSpawn, tenvTick, tenvClear,
// tenvFoe, FIREB and groundAt added to window.__G): node cultshot.js [outDir]
const {chromium}=require('playwright');
const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(6000);
await p.evaluate(()=>{const G=window.__G;G.tenvSpawn('cult');});
for(let i=0;i<60;i++){await p.waitForTimeout(500);if(!(await p.evaluate(()=>!!window.__G.TS.search)))break;}
console.log('info:',await p.evaluate(()=>document.getElementById('tpInfo').textContent));
await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(12000);
const st=()=>p.evaluate(()=>{const G=window.__G,V=[...G.venues.values()].find(v=>v.kind==='cult'),P=G.players[0];
  return {V:V&&{cx:V.cx,cz:V.cz,roused:V.roused,n:V.slots.filter(Boolean).length},gus:[P.pos.x,P.pos.y,P.pos.z].map(v=>+v.toFixed(1)),cult:G.goblins.filter(g=>g.cultist&&g.state==='chase').length,fb:G.FIREB.filter(f=>f.live).length};});
console.log('calm',JSON.stringify(await st()));
// hold Gus still somewhere, looking at the altar (and keep him alive)
const hold=(dz,dx,pitch,yawOff)=>p.evaluate(([dz,dx,pitch,yawOff])=>{const G=window.__G,V=[...G.venues.values()].find(v=>v.kind==='cult'),P=G.players[0];clearInterval(window.__hold);
  const x=V.cx+dx,z=V.cz+dz,y=G.groundAt(x,z,80);window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.hp=20;P.heading=Math.atan2(V.cx-x,V.cz-z);P.cam.yaw=Math.atan2(-(V.cx-x),-(V.cz-z))+yawOff;P.cam.pitch=pitch;},16);},[dz,dx,pitch,yawOff]);
await hold(22,0,-0.2,0);await p.waitForTimeout(4000);await p.screenshot({path:out+'/cult-1-rite.png'});
await hold(13,3,-0.15,0);await p.waitForTimeout(1800);console.log('roused',JSON.stringify(await st()));
for(let i=0;i<4;i++){await p.waitForTimeout(700);await p.screenshot({path:out+'/cult-2-fire-'+i+'.png'});console.log(i,JSON.stringify(await st()));}
await p.waitForTimeout(2500);await p.screenshot({path:out+'/cult-3-close.png'});console.log('close',JSON.stringify(await st()));
// one up close, from the Testing Environment's Cultist button: conjuring and throwing (Gus kept out of the middle of the picture)
await p.evaluate(()=>{const G=window.__G;clearInterval(window.__hold);G.tenvClear();});
await hold(40,14,-0.05,0.55);await p.waitForTimeout(800);
await p.evaluate(()=>{const G=window.__G;G.TS.n=1;G.tenvFoe('cultist');const g=G.goblins.find(o=>o.cultist&&o.state==='chase'&&!o.cultV),P=G.players[0];
  const yaw=P.cam.yaw+0.42;window.__one=g;g.pos.set(P.pos.x-Math.sin(yaw)*7,P.pos.y,P.pos.z-Math.cos(yaw)*7);g.castCD=0.6;});
for(let i=0;i<8;i++){await p.waitForTimeout(250);const c=await p.evaluate(()=>{const g=window.__one;return {cast:+g.cast.toFixed(2),orb:g.orb.visible,fb:window.__G.FIREB.filter(f=>f.live).length};});
  await p.screenshot({path:out+'/cult-4-cast-'+i+'.png'});console.log('cast',i,JSON.stringify(c));}
console.log(errs.join('\n')||'no errors');await b.close();})();
